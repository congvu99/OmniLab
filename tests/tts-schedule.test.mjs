// TTS worker time maths: Pacific midnight (incl. DST change days and the UTC−8 fallback),
// bounded backoff, jitter range, retry decisions per failure kind and the abortable sleep.
import { describe, expect, it } from 'vitest';
import {
  backoffMs, decideRetry, jitterMs, newRetryCounters, nextPacificMidnight, pauseUntil, retryDelayMs, sleep,
} from '../server/tts/tts-schedule.ts';

const MIN = 60_000;
const iso = (ms) => new Date(ms).toISOString();
const next = (at) => iso(nextPacificMidnight(Date.parse(at)));
const zero = () => 0;

describe('nextPacificMidnight', () => {
  it('summer time (PDT, UTC−7)', () => {
    expect(next('2026-10-28T10:00:00Z')).toBe('2026-10-29T07:00:00.000Z');
  });

  it('is strictly after an exact midnight', () => {
    expect(next('2026-10-29T07:00:00Z')).toBe('2026-10-30T07:00:00.000Z');
  });

  it('autumn change day 2026-11-01: before and after 02:00 LA', () => {
    expect(next('2026-10-31T10:00:00Z')).toBe('2026-11-01T07:00:00.000Z');
    expect(next('2026-11-01T08:30:00Z')).toBe('2026-11-02T08:00:00.000Z'); // 01:30 PDT
    expect(next('2026-11-01T10:30:00Z')).toBe('2026-11-02T08:00:00.000Z'); // 02:30 PST
  });

  it('spring change day 2027-03-14', () => {
    expect(next('2027-03-13T20:00:00Z')).toBe('2027-03-14T08:00:00.000Z');
    expect(next('2027-03-14T09:00:00Z')).toBe('2027-03-15T07:00:00.000Z'); // 01:00 PST
    expect(next('2027-03-14T12:00:00Z')).toBe('2027-03-15T07:00:00.000Z'); // 05:00 PDT
  });

  it('falls back to fixed UTC−8 when Intl throws (late by at most an hour, never early)', () => {
    const broken = () => {
      throw new RangeError('no time zone data');
    };
    expect(iso(nextPacificMidnight(Date.parse('2026-10-28T10:00:00Z'), broken))).toBe('2026-10-29T08:00:00.000Z');
    expect(iso(nextPacificMidnight(Date.parse('2026-12-01T10:00:00Z'), broken))).toBe('2026-12-02T08:00:00.000Z');
  });

  it('pauseUntil adds 2–10 minutes of jitter', () => {
    const midnight = Date.parse('2026-10-29T07:00:00Z');
    const now = Date.parse('2026-10-28T10:00:00Z');
    expect(pauseUntil(now, zero)).toBe(midnight + 2 * MIN);
    expect(pauseUntil(now, () => 0.999999)).toBe(midnight + 10 * MIN);
  });
});

describe('backoff and jitter', () => {
  it('doubles from the base and stops at the cap', () => {
    expect([0, 1, 2, 3].map((n) => backoffMs(10_000, n, 50_000))).toEqual([10_000, 20_000, 40_000, 50_000]);
    expect(retryDelayMs(60_000, 10)).toBe(30 * MIN);
  });

  it('jitter stays inside [min, max]', () => {
    expect(jitterMs(5, 9, zero)).toBe(5);
    expect(jitterMs(5, 9, () => 0.999999)).toBe(9);
  });
});

describe('decideRetry', () => {
  const noAudio = { kind: 'no_audio', reason: 'no_audio_part', latencyMs: 1 };
  const quota = (scope, retryAfterMs) => ({ kind: 'quota', status: 429, scope, retryAfterMs, zeroQuota: false, quotaIds: [], body: '' });

  it('no_audio: three backoffs of 30 s × 2ⁿ, then fail', () => {
    const counters = newRetryCounters();
    const steps = [1, 2, 3, 4].map(() => decideRetry(noAudio, counters, zero));
    expect(steps.slice(0, 3)).toEqual([{ kind: 'wait', ms: 30_000 }, { kind: 'wait', ms: 60_000 }, { kind: 'wait', ms: 120_000 }]);
    expect(steps[3]).toEqual({ kind: 'fail', reason: 'no_audio no_audio_part' });
  });

  it('quota day pauses; minute waits retryAfter clamped to [1 s, 5 min] plus jitter', () => {
    expect(decideRetry(quota('day'), newRetryCounters(), zero)).toEqual({ kind: 'pause' });
    expect(decideRetry(quota('minute', 27_000), newRetryCounters(), zero)).toEqual({ kind: 'wait', ms: 27_000 });
    expect(decideRetry(quota('minute', 10), newRetryCounters(), zero)).toEqual({ kind: 'wait', ms: 1000 });
    expect(decideRetry(quota('minute', 3_600_000), newRetryCounters(), zero)).toEqual({ kind: 'wait', ms: 5 * MIN });
    expect(decideRetry(quota('minute'), newRetryCounters(), () => 0.999999)).toEqual({ kind: 'wait', ms: MIN + 5000 });
  });

  it('five unknown 429s in a row become a daily pause; another kind resets the streak', () => {
    const counters = newRetryCounters();
    const waits = [1, 2, 3, 4].map(() => decideRetry(quota('unknown'), counters, zero));
    expect(waits.map((d) => d.ms)).toEqual([MIN, 2 * MIN, 4 * MIN, 8 * MIN]);
    decideRetry(noAudio, counters, zero);
    expect(decideRetry(quota('unknown'), counters, zero)).toEqual({ kind: 'wait', ms: MIN });
    for (let i = 0; i < 3; i++) decideRetry(quota('unknown'), counters, zero);
    expect(decideRetry(quota('unknown'), counters, zero)).toEqual({ kind: 'pause' });
  });

  it('ten per-minute 429s in a row stop the cycle (quota_minute); another kind resets the streak', () => {
    const counters = newRetryCounters();
    const waits = Array.from({ length: 9 }, () => decideRetry(quota('minute', 1000), counters, zero));
    expect(waits.every((d) => d.kind === 'wait')).toBe(true);
    decideRetry(noAudio, counters, zero);
    for (let i = 0; i < 9; i++) expect(decideRetry(quota('minute', 1000), counters, zero).kind).toBe('wait');
    expect(decideRetry(quota('minute', 1000), counters, zero)).toEqual({ kind: 'stop', reason: 'quota_minute' });
  });

  it('retryable: 7 backoffs capped at 30 min, the 8th stops the cycle (upstream)', () => {
    const counters = newRetryCounters();
    const result = { kind: 'retryable', status: 503, reason: 'http_503' };
    const steps = Array.from({ length: 8 }, () => decideRetry(result, counters, zero));
    expect(steps.slice(0, 7).map((d) => d.ms)).toEqual([10_000, 20_000, 40_000, 80_000, 160_000, 320_000, 640_000]);
    expect(steps[7]).toEqual({ kind: 'stop', reason: 'upstream' });
  });

  it('auth and contract stop the cycle; rejected fails the lesson', () => {
    expect(decideRetry({ kind: 'auth', status: 403, reason: 'http_403', body: '' }, newRetryCounters(), zero)).toEqual({ kind: 'stop', reason: 'auth' });
    expect(decideRetry({ kind: 'contract', reason: 'bad_wav: no RIFF' }, newRetryCounters(), zero)).toEqual({ kind: 'stop', reason: 'contract' });
    expect(decideRetry({ kind: 'rejected', status: 400, reason: 'http_400', body: 'bad' }, newRetryCounters(), zero))
      .toEqual({ kind: 'fail', reason: '400 http_400 bad' });
  });
});

describe('sleep', () => {
  it('resolves after the delay', async () => {
    await expect(sleep(1)).resolves.toBeUndefined();
  });

  it('rejects with the abort reason, immediately or while waiting', async () => {
    const reason = new Error('stop');
    await expect(sleep(10, AbortSignal.abort(reason))).rejects.toBe(reason);
    const controller = new AbortController();
    const pending = sleep(60_000, controller.signal);
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
  });
});
