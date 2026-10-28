/**
 * Time maths for the TTS worker: the Gemini daily quota reset (midnight
 * America/Los_Angeles), exponential backoff, jitter with an injected random
 * source and an abortable sleep. Pure except for `sleep`.
 */
import type { QuotaScope } from './gemini-quota.ts';
import type { SynthesisResult } from './gemini-tts-client.ts';
import { NO_AUDIO_MAX_RETRIES, QUOTA_MINUTE_MAX_ATTEMPTS, QUOTA_UNKNOWN_MAX_ATTEMPTS, RETRYABLE_MAX_ATTEMPTS } from './tts-config.ts';
import { MINUTE_MS, SECOND_MS } from './tts-common.ts';

const PACIFIC_TIME_ZONE = 'America/Los_Angeles';
// Không có dữ liệu múi giờ thì dùng UTC−8 (giờ chuẩn): mùa hè ngủ muộn tối đa 1 giờ, không bao giờ dậy sớm.
const PACIFIC_STANDARD_OFFSET_MIN = -8 * 60;

export type FormatterFactory = () => Intl.DateTimeFormat;

const defaultFormatterFactory: FormatterFactory = () =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

let cachedFormatter: Intl.DateTimeFormat | undefined;

function formatter(factory: FormatterFactory | undefined): Intl.DateTimeFormat {
  if (factory) return factory();
  cachedFormatter ??= defaultFormatterFactory();
  return cachedFormatter;
}

interface CivilDate {
  year: number;
  month: number;
  day: number;
}

/** Pacific civil date and UTC offset (minutes) at `ms`; falls back to fixed UTC−8. */
function pacificClock(ms: number, factory?: FormatterFactory): { date: CivilDate; offsetMin: number } {
  try {
    const parts = Object.fromEntries(formatter(factory).formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
    const [year, month, day, hour, minute, second] = ['year', 'month', 'day', 'hour', 'minute', 'second'].map((k) => Number(parts[k]));
    const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    if (!Number.isFinite(asUtc)) throw new Error('unparseable Pacific time parts');
    const flooredMs = Math.floor(ms / 1000) * 1000;
    return { date: { year, month, day }, offsetMin: Math.round((asUtc - flooredMs) / MINUTE_MS) };
  } catch {
    const shifted = new Date(ms + PACIFIC_STANDARD_OFFSET_MIN * MINUTE_MS);
    const date = { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
    return { date, offsetMin: PACIFIC_STANDARD_OFFSET_MIN };
  }
}

/**
 * First Pacific midnight strictly after `nowMs` (epoch ms). The offset is
 * re-read at the candidate instant, so DST change days (always at 02:00 LA)
 * land on the real midnight.
 */
export function nextPacificMidnight(nowMs: number, factory?: FormatterFactory): number {
  const { date, offsetMin } = pacificClock(nowMs, factory);
  const midnightAsUtc = Date.UTC(date.year, date.month - 1, date.day + 1);
  const guess = midnightAsUtc - offsetMin * MINUTE_MS;
  return midnightAsUtc - pacificClock(guess, factory).offsetMin * MINUTE_MS;
}

/** `baseMs × 2^attempt`, capped; attempt counts from 0. */
export function backoffMs(baseMs: number, attempt: number, capMs: number): number {
  return Math.min(capMs, baseMs * 2 ** Math.max(0, attempt));
}

/** Uniform integer in [minMs, maxMs] from an injected `random()` in [0, 1). */
export function jitterMs(minMs: number, maxMs: number, random: () => number): number {
  return minMs + Math.floor(random() * (maxMs - minMs + 1));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export type Sleep = (ms: number, signal?: AbortSignal) => Promise<void>;

/** Resolves after `ms`, or rejects with `signal.reason` as soon as the signal aborts. */
export const sleep: Sleep = (ms, signal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, Math.max(0, ms));
    signal?.addEventListener('abort', onAbort, { once: true });
  });

const MAX_BACKOFF_MS = 30 * MINUTE_MS;
// Ngủ thêm 2–10 phút sau 0h Los Angeles để không dồn request đúng lúc quota vừa reset.
const PAUSE_JITTER_MIN_MS = 2 * MINUTE_MS;
const PAUSE_JITTER_MAX_MS = 10 * MINUTE_MS;
const MINUTE_QUOTA_MIN_WAIT_MS = SECOND_MS;
const MINUTE_QUOTA_MAX_WAIT_MS = 5 * MINUTE_MS;
const MINUTE_QUOTA_JITTER_MAX_MS = 5 * SECOND_MS;
const UNKNOWN_QUOTA_BASE_MS = MINUTE_MS;
const NO_AUDIO_BASE_MS = 30 * SECOND_MS;
const RETRYABLE_BASE_MS = 10 * SECOND_MS;

/** Exponential backoff with the worker-wide 30-minute cap. */
export const retryDelayMs = (baseMs: number, attempt: number) => backoffMs(baseMs, attempt, MAX_BACKOFF_MS);

/** When a daily-quota pause ends: next Pacific midnight plus 2–10 minutes of jitter. */
export function pauseUntil(nowMs: number, random: () => number, factory?: FormatterFactory): number {
  return nextPacificMidnight(nowMs, factory) + jitterMs(PAUSE_JITTER_MIN_MS, PAUSE_JITTER_MAX_MS, random);
}

/** Failures that are not about the current lesson: the whole cycle stops, nothing is marked failed. */
export type StopReason = 'auth' | 'contract' | 'upstream' | 'quota_minute';

export type RetryDecision =
  | { kind: 'wait'; ms: number }
  | { kind: 'pause' }
  | { kind: 'fail'; reason: string }
  | { kind: 'stop'; reason: StopReason };

/** Consecutive failures of one kind on the current chunk. */
export interface RetryCounters {
  noAudio: number;
  unknownQuota: number;
  minuteQuota: number;
  retryable: number;
}

export const newRetryCounters = (): RetryCounters => ({ noAudio: 0, unknownQuota: 0, minuteQuota: 0, retryable: 0 });

function decideQuota(scope: QuotaScope, retryAfterMs: number | undefined, counters: RetryCounters, random: () => number): RetryDecision {
  if (scope === 'day') return { kind: 'pause' };
  if (scope === 'minute') {
    // 429 theo phút lặp mãi (quota id thật chưa rõ) thì dừng vòng, vòng sau thử lại, không gửi đều đặn vô hạn.
    if (counters.minuteQuota >= QUOTA_MINUTE_MAX_ATTEMPTS) return { kind: 'stop', reason: 'quota_minute' };
    const base = clamp(retryAfterMs ?? MINUTE_MS, MINUTE_QUOTA_MIN_WAIT_MS, MINUTE_QUOTA_MAX_WAIT_MS);
    return { kind: 'wait', ms: base + jitterMs(0, MINUTE_QUOTA_JITTER_MAX_MS, random) };
  }
  // 429 không rõ loại lặp lại nhiều lần thì coi như hết quota ngày để không đốt request.
  if (counters.unknownQuota >= QUOTA_UNKNOWN_MAX_ATTEMPTS) return { kind: 'pause' };
  return { kind: 'wait', ms: retryDelayMs(UNKNOWN_QUOTA_BASE_MS, counters.unknownQuota - 1) };
}

/**
 * Next step after a failed synthesis attempt; updates `counters` in place.
 * Every retry path is bounded (a counter ends in fail, pause or stop), so a chunk can never loop forever.
 */
export function decideRetry(
  result: Exclude<SynthesisResult, { kind: 'ok' }>,
  counters: RetryCounters,
  random: () => number,
): RetryDecision {
  const quotaScope = result.kind === 'quota' ? result.scope : undefined;
  counters.unknownQuota = quotaScope === 'unknown' ? counters.unknownQuota + 1 : 0;
  counters.minuteQuota = quotaScope === 'minute' ? counters.minuteQuota + 1 : 0;
  switch (result.kind) {
    case 'no_audio':
      counters.noAudio++;
      if (counters.noAudio > NO_AUDIO_MAX_RETRIES) return { kind: 'fail', reason: `no_audio ${result.reason}` };
      return { kind: 'wait', ms: retryDelayMs(NO_AUDIO_BASE_MS, counters.noAudio - 1) };
    case 'quota':
      return decideQuota(result.scope, result.retryAfterMs, counters, random);
    case 'retryable':
      counters.retryable++;
      if (counters.retryable >= RETRYABLE_MAX_ATTEMPTS) return { kind: 'stop', reason: 'upstream' };
      return { kind: 'wait', ms: retryDelayMs(RETRYABLE_BASE_MS, counters.retryable - 1) };
    case 'auth':
      return { kind: 'stop', reason: 'auth' };
    case 'contract':
      return { kind: 'stop', reason: 'contract' };
    case 'rejected':
      return { kind: 'fail', reason: `${result.status ?? '-'} ${result.reason} ${result.body ?? ''}`.trim() };
  }
}
