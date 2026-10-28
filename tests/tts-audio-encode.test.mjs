// Audio encode: PCM chunks streamed into ffmpeg stdin with silence gaps (no full.pcm copy), exact `##`
// and approximate `###` start times, ffmpeg arguments, PATH-only child env, no output left on failure.
// The real-ffmpeg test runs only when `ffmpeg` is on PATH (skipped on the dev machine).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildAudioChapters, createFfmpegEncoder, ffmpegArgs, gapBytes, minimalEnv, pcmStream, spawnRunner,
} from '../server/tts/audio-encode.ts';

const RATE = 1000; // 2000 bytes per second keeps the maths readable
const GAP = gapBytes(RATE);
let dir;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'omnilab-tts-encode-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function writeChunks(sizes) {
  sizes.forEach((size, i) => writeFileSync(join(dir, `${String(i).padStart(4, '0')}.pcm`), Buffer.alloc(size, i + 1)));
}

async function collect(iterable) {
  const parts = [];
  for await (const part of iterable) parts.push(Buffer.from(part));
  return Buffer.concat(parts);
}

describe('pcmStream', () => {
  it('gap is 400 ms of whole 16-bit samples', () => {
    expect(gapBytes(24000)).toBe(19200);
    expect(GAP).toBe(800);
  });

  it('streams chunks in order with zeroed silence between them', async () => {
    writeChunks([100, 200, 50]);
    const bytes = await collect(pcmStream(['0000.pcm', '0001.pcm', '0002.pcm'].map((n) => join(dir, n)), GAP));
    expect(bytes.length).toBe(350 + 2 * GAP);
    expect(bytes.subarray(0, 100).every((b) => b === 1)).toBe(true);
    expect(bytes.subarray(100, 100 + GAP).every((b) => b === 0)).toBe(true);
    expect(bytes.subarray(100 + GAP, 300 + GAP).every((b) => b === 2)).toBe(true);
    expect(bytes.subarray(-50).every((b) => b === 3)).toBe(true);
  });
});

describe('buildAudioChapters', () => {
  const chapters = [
    { id: ':intro', title: 'Mở đầu', paragraphs: ['x'], marks: [] },
    { id: 'phan-a', title: 'Phần A', paragraphs: ['x'], marks: [] },
  ];
  // 3 chunks of 20 s each (40,000 bytes at 2,000 B/s); chunk 1 starts chapter 1.
  const chunks = [
    { chapterIndex: 0, text: 'a'.repeat(100), marks: [{ id: 'gan-dau', title: 'Gần đầu', charOffset: 2 }] },
    { chapterIndex: 1, text: 'b'.repeat(100), marks: [] },
    { chapterIndex: 1, text: 'c'.repeat(100), marks: [{ id: 'giua', title: 'Giữa', charOffset: 50 }] },
  ];
  const result = buildAudioChapters({ chapters, chunks, chunkBytes: [40_000, 40_000, 40_000], sampleRate: RATE });

  it('total duration counts every chunk and both gaps', () => {
    expect(result.durationSec).toBe(60.8);
  });

  it('`##` chapters start exactly at their first chunk', () => {
    const exact = result.chapters.filter((c) => c.depth === 2);
    expect(exact).toEqual([
      { id: ':intro', title: 'Mở đầu', startSec: 0, depth: 2, approx: false },
      { id: 'phan-a', title: 'Phần A', startSec: 20.4, depth: 2, approx: false },
    ]);
  });

  it('`###` marks: char ratio × chunk duration − 1 s, never before the chunk start', () => {
    const marks = Object.fromEntries(result.chapters.filter((c) => c.depth === 3).map((c) => [c.id, c]));
    expect(marks['gan-dau']).toEqual({ id: 'gan-dau', title: 'Gần đầu', startSec: 0, depth: 3, approx: true }); // 0.4 − 1 → clamped
    expect(marks.giua.startSec).toBe(49.8); // 40.8 + 0.5 × 20 − 1
  });

  it('is sorted by start time', () => {
    const starts = result.chapters.map((c) => c.startSec);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(result.chapters.map((c) => c.id)).toEqual([':intro', 'gan-dau', 'phan-a', 'giua']);
  });
});

describe('ffmpeg encoder', () => {
  it('builds the exact ffmpeg command line', () => {
    expect(ffmpegArgs(24000, 'out.m4a')).toEqual([
      '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', 'pipe:0',
      '-threads', '1', '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart', 'out.m4a',
    ]);
  });

  it('minimalEnv keeps PATH only', () => {
    expect(minimalEnv({ PATH: '/usr/bin', GEMINI_API_KEY: 'secret', HOME: '/root' })).toEqual({ PATH: '/usr/bin' });
  });

  it('runs the runner with a PATH-only env, PCM on stdin, no full.pcm on disk, and returns out.m4a', async () => {
    writeChunks([100, 100]);
    const calls = [];
    const runner = async (command, args, options) => {
      calls.push({ command, args, options: { ...options, stdin: undefined } });
      expect((await collect(options.stdin)).length).toBe(200 + GAP);
      expect(readdirSync(dir).sort()).toEqual(['0000.pcm', '0001.pcm']);
      writeFileSync(args.at(-1), 'm4a');
      return { code: 0, stderr: '' };
    };
    const env = { PATH: '/bin', GEMINI_API_KEY: 'AIza-secret' };
    const encoder = createFfmpegEncoder({ ffmpegPath: '/opt/ffmpeg', env, timeoutMs: 1000, runner });
    const output = await encoder.encode({ workDir: dir, chunkCount: 2, sampleRate: RATE });
    expect(output).toBe(join(dir, 'out.m4a'));
    expect(calls).toHaveLength(1);
    expect(calls[0].command).toBe('/opt/ffmpeg');
    expect(calls[0].options.env).toEqual({ PATH: '/bin' });
    expect(JSON.stringify(calls[0])).not.toContain('AIza-secret');
    expect(readdirSync(dir).sort()).toEqual(['0000.pcm', '0001.pcm', 'out.m4a']);
  });

  it.each([
    ['non-zero exit', async (_c, args) => (writeFileSync(args.at(-1), 'partial'), { code: 1, stderr: 'Invalid data' })],
    ['empty output', async (_c, args) => (writeFileSync(args.at(-1), ''), { code: 0, stderr: '' })],
    ['spawn error', async () => Promise.reject(new Error('spawn ffmpeg ENOENT'))],
  ])('%s: throws and leaves no out.m4a', async (_, runner) => {
    writeChunks([100]);
    const encoder = createFfmpegEncoder({ ffmpegPath: 'ffmpeg', env: {}, timeoutMs: 1000, runner });
    await expect(encoder.encode({ workDir: dir, chunkCount: 1, sampleRate: RATE })).rejects.toThrow();
    expect(readdirSync(dir)).toEqual(['0000.pcm']);
  });
});

describe('spawnRunner', () => {
  it('passes only the given env to the child', async () => {
    const script = 'process.stderr.write(JSON.stringify(Object.keys(process.env).filter((k) => k.startsWith("OMNILAB_"))))';
    process.env.OMNILAB_TTS_TEST_SECRET = 'should-not-leak';
    try {
      const result = await spawnRunner(process.execPath, ['-e', script], { env: { ...minimalEnv(process.env), OMNILAB_ONLY: '1' }, timeoutMs: 10_000 });
      expect(result.code).toBe(0);
      expect(JSON.parse(result.stderr)).toEqual(['OMNILAB_ONLY']);
    } finally {
      delete process.env.OMNILAB_TTS_TEST_SECRET;
    }
  });

  it('streams stdin into the child', async () => {
    const script = 'let n = 0; process.stdin.on("data", (d) => { n += d.length; }); process.stdin.on("end", () => process.stderr.write(String(n)));';
    async function* input() {
      yield Buffer.alloc(70_000, 1);
      yield Buffer.alloc(30_000, 2);
    }
    const result = await spawnRunner(process.execPath, ['-e', script], { env: minimalEnv(process.env), timeoutMs: 10_000, stdin: input() });
    expect(result).toEqual({ code: 0, stderr: '100000' });
  });

  it('a read error on stdin kills the child and rejects (no truncated encode)', async () => {
    const script = 'process.stdin.resume(); process.stdin.on("end", () => process.exit(0));';
    async function* input() {
      yield Buffer.alloc(10, 1);
      throw new Error('chunk read failed');
    }
    const pending = spawnRunner(process.execPath, ['-e', script], { env: minimalEnv(process.env), timeoutMs: 10_000, stdin: input() });
    await expect(pending).rejects.toThrow('chunk read failed');
  });

  it('rejects with the abort reason when aborted', async () => {
    const reason = new Error('stop');
    const controller = new AbortController();
    const pending = spawnRunner(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { env: minimalEnv(process.env), signal: controller.signal, timeoutMs: 60_000 });
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
  });

  const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
  it.skipIf(!hasFfmpeg)('encodes real PCM with ffmpeg (only when ffmpeg is installed)', async () => {
    writeChunks([48_000, 48_000]);
    const encoder = createFfmpegEncoder({ ffmpegPath: 'ffmpeg', env: process.env, timeoutMs: 60_000 });
    const output = await encoder.encode({ workDir: dir, chunkCount: 2, sampleRate: 24000 });
    expect(existsSync(output)).toBe(true);
    expect(readFileSync(output).subarray(4, 8).toString('latin1')).toBe('ftyp');
  });
});
