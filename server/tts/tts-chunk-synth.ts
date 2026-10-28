/**
 * Requests for one chunk: spacing between requests, bounded retries
 * (tts-schedule.ts) and the duration sanity check with one regeneration.
 * Failures that are not about the lesson (auth, request contract, upstream
 * down, a per-minute quota that never clears, the daily quota) stop the whole
 * cycle instead of failing the lesson, so they cannot burn the daily quota.
 */
import type { SynthesisResult } from './gemini-tts-client.ts';
import type { TextChunk } from './chunk-packer.ts';
import { decideRetry, newRetryCounters, pauseUntil, sleep as realSleep } from './tts-schedule.ts';
import type { StopReason } from './tts-schedule.ts';
import { DURATION_CHECK_MIN_CHARS, DURATION_RATIO_MAX, DURATION_RATIO_MIN } from './tts-config.ts';
import { round2 } from './tts-common.ts';
import type { CycleOutcome, LessonContext, WorkerDeps } from './tts-worker.ts';

export type ChunkPosition = { lessonId: string; chunk: number; of: number };
type ChunkAudio = { pcm: Uint8Array; sampleRate: number; ratio: number };
export type ChunkOutcome = ({ kind: 'ok' } & ChunkAudio) | { kind: 'failed'; reason: string } | { kind: 'stop'; outcome: CycleOutcome };
type Failure = Exclude<SynthesisResult, { kind: 'ok' }>;

/** Log event per cycle-stopping failure (one line per stopped cycle). */
const STOP_EVENTS: Record<StopReason, string> = {
  auth: 'auth_failed',
  contract: 'contract_failed',
  upstream: 'upstream_unavailable',
  quota_minute: 'quota_minute_exhausted',
};

const inRange = (ratio: number) => ratio >= DURATION_RATIO_MIN && ratio <= DURATION_RATIO_MAX;

export function createChunkSynthesizer(deps: WorkerDeps) {
  const { config, store, log } = deps;
  const now = deps.now ?? Date.now;
  const random = deps.random ?? Math.random;
  const sleep = deps.sleep ?? realSleep;
  let lastRequestAt: number | undefined;
  let loggedQuotaBody = false;

  async function request(ctx: LessonContext, text: string) {
    const wait = lastRequestAt === undefined ? 0 : lastRequestAt + config.minIntervalMs - now();
    if (wait > 0) await sleep(wait, ctx.signal);
    lastRequestAt = now();
    return ctx.client.synthesize({ text, model: config.model, voice: config.voice, style: config.style }, ctx.signal);
  }

  /** (expected seconds by charsPerSec) ÷ (real seconds); `undefined` when the chunk is too short to judge. */
  function durationRatio(chars: number, durationSec: number): number | undefined {
    if (chars < DURATION_CHECK_MIN_CHARS) return undefined;
    return durationSec > 0 ? chars / config.charsPerSec / durationSec : Number.POSITIVE_INFINITY;
  }

  function stopCycle(reason: StopReason, result: Failure, at: ChunkPosition): ChunkOutcome {
    const status = 'status' in result ? (result.status ?? null) : null;
    const detail = 'reason' in result ? result.reason : result.kind;
    // Chỉ lỗi hợp đồng kèm body (đã che key, tối đa 2 KB) để chẩn đoán shape request hoặc định dạng audio.
    const body = result.kind === 'contract' ? { body: result.body ?? null } : {};
    log(STOP_EVENTS[reason], { ...at, status, reason: detail, ...body });
    return { kind: 'stop', outcome: { kind: 'idle', reason } };
  }

  async function pauseCycle(ctx: LessonContext, result: Failure): Promise<ChunkOutcome> {
    const until = pauseUntil(now(), random);
    ctx.state.pausedUntil = until;
    await store.writeState(ctx.state);
    log('paused', { until: new Date(until).toISOString(), reason: `quota_${result.kind === 'quota' ? result.scope : 'unknown'}` });
    return { kind: 'stop', outcome: { kind: 'paused', until } };
  }

  function logQuota(result: Failure, at: ChunkPosition): void {
    if (result.kind !== 'quota') return;
    log('quota', { ...at, scope: result.scope, retryAfterMs: result.retryAfterMs ?? null, quotaIds: result.quotaIds, zeroQuota: result.zeroQuota });
    if (!loggedQuotaBody) log('quota_body', { body: result.body });
    loggedQuotaBody = true;
  }

  async function synthesizeChunk(ctx: LessonContext, chunk: TextChunk, at: ChunkPosition): Promise<ChunkOutcome> {
    const counters = newRetryCounters();
    let outlier: ChunkAudio | undefined;
    for (;;) {
      const result = await request(ctx, chunk.text);
      if (result.kind === 'ok') {
        counters.unknownQuota = 0;
        counters.minuteQuota = 0;
        const ratio = durationRatio(chunk.text.length, result.durationSec);
        const audio = { pcm: result.pcm, sampleRate: result.sampleRate, ratio: ratio ?? 1 };
        if (ratio === undefined || inRange(ratio)) {
          log('chunk_ok', { ...at, sec: round2(result.durationSec), ratio: ratio === undefined ? null : round2(ratio) });
          return { kind: 'ok', ...audio };
        }
        if (!outlier) {
          log('chunk_outlier', { ...at, ratio: round2(ratio) });
          outlier = audio;
          continue;
        }
        // Đã tạo lại một lần mà vẫn lệch: giữ bản có tỉ lệ gần 1 hơn (thang log) để giọng chậm hợp lệ không làm kẹt bài.
        const best = Math.abs(Math.log(ratio)) < Math.abs(Math.log(outlier.ratio)) ? audio : outlier;
        log('chunk_outlier_kept', { ...at, ratio: round2(best.ratio) });
        return { kind: 'ok', ...best };
      }
      logQuota(result, at);
      const decision = decideRetry(result, counters, random);
      if (decision.kind === 'fail') return { kind: 'failed', reason: `chunk ${at.chunk}/${at.of}: ${decision.reason}` };
      if (decision.kind === 'stop') return stopCycle(decision.reason, result, at);
      if (decision.kind === 'pause') return pauseCycle(ctx, result);
      if (result.kind === 'no_audio') log('no_audio_retry', { ...at, attempt: counters.noAudio, reason: result.reason });
      if (result.kind === 'retryable') log('retryable', { ...at, attempt: counters.retryable, reason: result.reason });
      await sleep(decision.ms, ctx.signal);
    }
  }

  return { synthesizeChunk };
}
