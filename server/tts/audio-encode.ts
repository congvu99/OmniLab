/**
 * Turns the chunk PCM files of one lesson into a single AAC `.m4a`: the
 * chunks, with a fixed silence between them, are streamed into ffmpeg's stdin
 * (never the whole lesson in RAM, no second copy of the PCM on disk) through
 * an injectable runner that only ever receives `PATH` in its environment (the
 * API key must not reach a child process). Also computes chapter start times
 * from PCM byte counts.
 */
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { AudioChapter } from '../../src/lib/audio-manifest.ts';
import type { SpeechChapter } from '../../src/lib/speech-script-contract.ts';
import type { TextChunk } from './chunk-packer.ts';
import { pcmDurationSec } from './wav-pcm.ts';
import { CHUNK_GAP_MS } from './tts-config.ts';
import { chunkFileName } from './audio-store.ts';
import { round2 } from './tts-common.ts';

export interface RunOptions {
  env: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs: number;
  /** Bytes fed to the child's stdin; when absent the child reads EOF at once. */
  stdin?: AsyncIterable<Uint8Array>;
}

export interface RunResult {
  code: number | null;
  stderr: string;
}

export type ProcessRunner = (command: string, args: string[], options: RunOptions) => Promise<RunResult>;

export interface EncodeInput {
  workDir: string;
  chunkCount: number;
  sampleRate: number;
}

export interface LessonEncoder {
  /** Writes `<workDir>/out.m4a` and returns its path; throws on any failure (no partial output left). */
  encode(input: EncodeInput, signal?: AbortSignal): Promise<string>;
}

const STDERR_MAX_CHARS = 2000;
const BYTES_PER_SAMPLE = 2; // PCM s16le mono
const MARK_LEAD_SEC = 1;
// Con đóng stdin trước (ffmpeg lỗi hoặc bị kill): mã thoát của nó đã nói lên lỗi, không phải lỗi đọc PCM.
const STDIN_CLOSED_CODES = new Set(['EPIPE', 'ERR_STREAM_DESTROYED', 'ERR_STREAM_PREMATURE_CLOSE', 'EOF']);
export const FFMPEG_STDIN = 'pipe:0';

/** Silence between chunks in bytes; always whole samples. */
export function gapBytes(sampleRate: number): number {
  return Math.round((sampleRate * CHUNK_GAP_MS) / 1000) * BYTES_PER_SAMPLE;
}

/** ffmpeg reads raw s16le mono from stdin; one thread so encoding never starves Caddy/sync on a 1 vCPU VPS. */
export function ffmpegArgs(sampleRate: number, outputPath: string): string[] {
  return [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 's16le', '-ar', String(sampleRate), '-ac', '1', '-i', FFMPEG_STDIN,
    '-threads', '1', '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart', outputPath,
  ];
}

/** Child-process environment: PATH only, so secrets in the worker env never leak. */
export function minimalEnv(source: NodeJS.ProcessEnv): Record<string, string> {
  return { PATH: source.PATH ?? '' };
}

const isStdinClosed = (err: unknown) => STDIN_CLOSED_CODES.has((err as NodeJS.ErrnoException | undefined)?.code ?? '');

/**
 * Default runner: `spawn` without a shell, stderr kept (capped), killed on abort or timeout.
 * A failure while reading `stdin` kills the child and rejects, so a truncated input never
 * turns into a short but "successful" encode.
 */
export const spawnRunner: ProcessRunner = (command, args, options) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: options.env,
      signal: options.signal,
      timeout: options.timeoutMs,
      killSignal: 'SIGKILL',
      stdio: ['pipe', 'ignore', 'pipe'],
      windowsHide: true,
    });
    let stderr = '';
    let feedError: unknown;
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (text: string) => {
      if (stderr.length < STDERR_MAX_CHARS) stderr = (stderr + text).slice(0, STDERR_MAX_CHARS);
    });
    if (options.stdin) {
      pipeline(Readable.from(options.stdin), child.stdin).catch((err: unknown) => {
        if (isStdinClosed(err)) return;
        feedError = err;
        child.kill('SIGKILL');
      });
    } else {
      child.stdin.on('error', () => undefined); // con thoát trước khi đọc: EOF đã gửi, không có gì để báo
      child.stdin.end();
    }
    child.on('error', (err) => reject(options.signal?.aborted ? options.signal.reason : err));
    child.on('close', (code) => (feedError === undefined ? resolve({ code, stderr }) : reject(feedError)));
  });

/** Chunk files in order with `silenceBytes` of zeros between them, read piece by piece. */
export async function* pcmStream(chunkPaths: readonly string[], silenceBytes: number): AsyncGenerator<Uint8Array> {
  const silence = Buffer.alloc(silenceBytes);
  for (const [index, path] of chunkPaths.entries()) {
    if (index > 0) yield silence;
    for await (const piece of createReadStream(path)) yield piece as Buffer;
  }
}

export interface FfmpegEncoderOptions {
  ffmpegPath: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
  runner?: ProcessRunner;
}

export function createFfmpegEncoder(options: FfmpegEncoderOptions): LessonEncoder {
  const runner = options.runner ?? spawnRunner;
  return {
    async encode({ workDir, chunkCount, sampleRate }, signal) {
      const output = join(workDir, 'out.m4a');
      const paths = Array.from({ length: chunkCount }, (_, i) => join(workDir, chunkFileName(i)));
      try {
        const stdin = pcmStream(paths, gapBytes(sampleRate));
        const runOptions = { env: minimalEnv(options.env), signal, timeoutMs: options.timeoutMs, stdin };
        const result = await runner(options.ffmpegPath, ffmpegArgs(sampleRate, output), runOptions);
        if (result.code !== 0) throw new Error(`ffmpeg exited with ${result.code}: ${result.stderr.trim()}`);
        if ((await stat(output)).size === 0) throw new Error('ffmpeg produced an empty file');
        return output;
      } catch (err) {
        await rm(output, { force: true });
        throw err;
      }
    },
  };
}

export interface ChapterTimingInput {
  chapters: readonly SpeechChapter[];
  chunks: readonly TextChunk[];
  /** PCM byte length of every chunk, in order. */
  chunkBytes: readonly number[];
  sampleRate: number;
}

/**
 * Exact `##` starts (chunk boundaries) and approximate `###` starts, plus the
 * total duration, all derived from PCM byte counts and the fixed gap.
 */
export function buildAudioChapters(input: ChapterTimingInput): { durationSec: number; chapters: AudioChapter[] } {
  const gap = gapBytes(input.sampleRate);
  const seconds = (bytes: number) => pcmDurationSec(bytes, input.sampleRate);
  const result: AudioChapter[] = [];
  let offset = 0;
  input.chunks.forEach((chunk, index) => {
    const startSec = seconds(offset);
    const chunkSec = seconds(input.chunkBytes[index]);
    const previous = input.chunks[index - 1];
    if (!previous || previous.chapterIndex !== chunk.chapterIndex) {
      const chapter = input.chapters[chunk.chapterIndex];
      result.push({ id: chapter.id, title: chapter.title, startSec: round2(startSec), depth: 2, approx: false });
    }
    for (const mark of chunk.marks) {
      // Mốc ### gần đúng: theo tỉ lệ ký tự trong đoạn, lùi 1 giây để không mất chữ đầu, không trước đầu đoạn.
      const estimated = startSec + (mark.charOffset / chunk.text.length) * chunkSec - MARK_LEAD_SEC;
      result.push({ id: mark.id, title: mark.title, startSec: round2(Math.max(startSec, estimated)), depth: 3, approx: true });
    }
    offset += input.chunkBytes[index] + (index < input.chunks.length - 1 ? gap : 0);
  });
  // Stable sort: a `##` chapter stays ahead of a `###` mark at the same instant.
  return { durationSec: round2(seconds(offset)), chapters: result.sort((a, b) => a.startSec - b.startSec) };
}
