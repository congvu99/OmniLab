/**
 * Generates one lesson: one chunk per request, each chunk stored durably
 * before the next request (a quota pause, a deploy or SIGTERM never loses a
 * paid-for chunk), duration sanity check with one regeneration, then encode,
 * publish and manifest update. Requests and retries of one chunk live in
 * tts-chunk-synth.ts; the cycle around it (GC, queue, pauses) in tts-cycle.ts.
 */
import { createHash } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { audioFileName } from '../../src/lib/audio-manifest.ts';
import type { AudioManifest } from '../../src/lib/audio-manifest.ts';
import type { GeminiTtsClient } from './gemini-tts-client.ts';
import { packChunks } from './chunk-packer.ts';
import type { TextChunk } from './chunk-packer.ts';
import { buildAudioChapters } from './audio-encode.ts';
import type { LessonEncoder } from './audio-encode.ts';
import { chunkFileName } from './audio-store.ts';
import type { AudioStore, ChunkExpectation } from './audio-store.ts';
import type { LogEvent } from './audio-gc.ts';
import { failedRecord } from './tts-work-plan.ts';
import type { TtsState, WorkItem } from './tts-work-plan.ts';
import type { Sleep, StopReason } from './tts-schedule.ts';
import type { TtsConfig } from './tts-config.ts';
import { createChunkSynthesizer } from './tts-chunk-synth.ts';

export interface WorkerDeps {
  config: TtsConfig;
  store: AudioStore;
  /** `null` when no API key is configured: the worker only cleans up. */
  client: GeminiTtsClient | null;
  encoder: LessonEncoder;
  log: LogEvent;
  now?: () => number;
  random?: () => number;
  sleep?: Sleep;
}

/** Why a cycle ended without finishing the queue; StopReason values come from tts-schedule.ts. */
export type IdleReason = 'no_key' | 'scripts_invalid' | 'encode_failed' | 'repeated_failure' | StopReason;

export type CycleOutcome =
  | { kind: 'done' }
  | { kind: 'idle'; reason: IdleReason }
  | { kind: 'paused'; until: number };

/** Mutable per-cycle state shared with the cycle runner (tts-cycle.ts). */
export type LessonContext = {
  client: GeminiTtsClient;
  manifest: AudioManifest;
  state: TtsState;
  signal?: AbortSignal;
  /** Failure reason of the previous lesson in this cycle (without the chunk number); reset by a ready lesson. */
  lastFailure?: string;
};

const CHUNK_PREFIX = /^chunk \d+\/\d+: /;
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
/** Error text for logs and failure reasons, capped at 300 chars. */
export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 300);

export function createLessonProcessor(deps: WorkerDeps) {
  const { config, store, encoder, log } = deps;
  const now = deps.now ?? Date.now;
  const synthesizer = createChunkSynthesizer(deps);

  async function fail(ctx: LessonContext, item: WorkItem, reason: string): Promise<CycleOutcome | undefined> {
    ctx.state.failed[item.audioKey] = failedRecord(item.lesson.id, now(), config.failedRetryMs, reason);
    await store.writeState(ctx.state);
    log('lesson_failed', { lessonId: item.lesson.id, reason });
    // Hai bài liên tiếp lỗi cùng lý do trong một vòng gần như chắc là lỗi chung: dừng vòng, không khoá thêm bài nào.
    const signature = reason.replace(CHUNK_PREFIX, '');
    const repeated = ctx.lastFailure === signature;
    ctx.lastFailure = signature;
    if (!repeated) return undefined;
    log('failure_streak', { lessonId: item.lesson.id, reason: signature });
    return { kind: 'idle', reason: 'repeated_failure' };
  }

  async function finishLesson(ctx: LessonContext, item: WorkItem, dir: string, chunks: TextChunk[], sampleRate: number): Promise<CycleOutcome | undefined> {
    const { lesson, audioKey } = item;
    let output: string;
    try {
      output = await encoder.encode({ workDir: dir, chunkCount: chunks.length, sampleRate }, ctx.signal);
    } catch (err) {
      if (ctx.signal?.aborted) throw err;
      // Lỗi môi trường (thiếu ffmpeg, đầy đĩa): giữ các đoạn đã tạo, dừng vòng để không đốt request cho bài khác.
      log('encode_failed', { lessonId: lesson.id, message: errorMessage(err) });
      return { kind: 'idle', reason: 'encode_failed' };
    }
    const file = audioFileName(lesson.id, audioKey);
    await store.publish(output, file);
    const chunkBytes = await Promise.all(chunks.map(async (_, i) => (await stat(join(dir, chunkFileName(i)))).size));
    const { durationSec, chapters } = buildAudioChapters({ chapters: lesson.chapters, chunks, chunkBytes, sampleRate });
    const generatedAt = new Date(now()).toISOString();
    const previous = ctx.manifest.lessons[lesson.id];
    const { model, voice } = config;
    ctx.manifest.lessons[lesson.id] = { scriptHash: lesson.scriptHash, audioKey, file, durationSec, chapters, generatedAt, model, voice };
    ctx.manifest.updatedAt = generatedAt;
    await store.writeManifest(ctx.manifest);
    if (previous && previous.file !== file) ctx.state.retired[previous.file] = { at: now(), kind: 'replaced' };
    if (ctx.state.failed[audioKey]?.lessonId === lesson.id) delete ctx.state.failed[audioKey];
    await store.writeState(ctx.state);
    await store.removeWorkDir(dir);
    ctx.lastFailure = undefined;
    log('lesson_ready', { lessonId: lesson.id, durationSec, chunks: chunks.length, file });
    return undefined;
  }

  async function processLesson(ctx: LessonContext, item: WorkItem): Promise<CycleOutcome | undefined> {
    const lessonId = item.lesson.id;
    const chunks = packChunks(item.lesson.chapters, config.maxChunkChars);
    const expected: ChunkExpectation = { model: config.model, voice: config.voice, textSha256: chunks.map((c) => sha256(c.text)) };
    const dir = store.lessonWorkDir(lessonId, item.audioKey);
    let { done, sampleRate } = await store.loadChunkProgress(dir, expected);
    for (; done < chunks.length; done++) {
      const outcome = await synthesizer.synthesizeChunk(ctx, chunks[done], { lessonId, chunk: done + 1, of: chunks.length });
      if (outcome.kind === 'stop') return outcome.outcome;
      if (outcome.kind === 'failed') return fail(ctx, item, outcome.reason);
      if (sampleRate !== undefined && outcome.sampleRate !== sampleRate) {
        await store.removeWorkDir(dir);
        return fail(ctx, item, `chunk ${done + 1}/${chunks.length}: sample rate ${outcome.sampleRate} != ${sampleRate}`);
      }
      sampleRate = outcome.sampleRate;
      await store.saveChunk(dir, done, outcome.pcm, sampleRate, expected);
    }
    if (sampleRate === undefined) throw new Error(`no chunk audio to encode for ${lessonId}`);
    return finishLesson(ctx, item, dir, chunks, sampleRate);
  }

  return { processLesson };
}

export type LessonProcessor = ReturnType<typeof createLessonProcessor>;
