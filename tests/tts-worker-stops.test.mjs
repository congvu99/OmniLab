// Failures that are not about one lesson stop the whole cycle instead of failing lessons:
// request/format contract, upstream down after bounded retries, endless per-minute 429,
// two lessons in a row failing for the same reason. Plus `--retry-failed all`. No network.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main, runWorkerLoop } from '../server/tts/tts-worker-entry.ts';
import { createWorkerEnv, HOUR, lesson, MINUTE_429, shortLesson, T0 } from './helpers/tts-worker-harness.mjs';

const BAD_WAV = { kind: 'contract', reason: 'bad_wav: missing RIFF header' };
const BAD_FIELD = { kind: 'contract', status: 400, reason: 'http_400', body: '{"error":{"status":"INVALID_ARGUMENT"}}' };
const UNAVAILABLE = { kind: 'retryable', status: 503, reason: 'http_503' };
const reject = (body) => ({ kind: 'rejected', status: 400, reason: 'http_400', body });

let env;
beforeEach(() => {
  env = createWorkerEnv();
});
afterEach(() => {
  vi.restoreAllMocks();
  env.cleanup();
});

// No state.json yet means nothing was ever marked failed.
const failedLessons = () => (existsSync(join(env.dir, 'work', 'state.json')) ? Object.values(env.readState().failed).map((f) => f.lessonId).sort() : []);

describe('contract failures stop the cycle', () => {
  it.each([
    ['bad WAV', BAD_WAV],
    ['400 on a request field', BAD_FIELD],
  ])('%s: one request, no lesson marked failed, contract_failed logged with the body', async (_, failure) => {
    env.writeScripts([shortLesson('d/m/a'), shortLesson('d/m/b'), shortLesson('d/m/c')]);
    const h = env.harness({ respond: () => failure });
    expect(await h.worker.runCycle()).toEqual({ kind: 'idle', reason: 'contract' });
    expect(h.calls).toHaveLength(1);
    expect(failedLessons()).toEqual([]);
    const event = h.events.find((e) => e.event === 'contract_failed');
    expect(event).toMatchObject({ lessonId: 'd/m/a', reason: failure.reason, body: failure.body ?? null });
    expect(h.names()).not.toContain('lesson_failed');
  });

  it('--once exits 1 on a contract stop; the next cycle retries once the problem is gone', async () => {
    env.writeScripts([shortLesson('d/m/a')]);
    const broken = env.harness({ respond: () => BAD_WAV });
    expect(await runWorkerLoop(broken.worker, { once: true, rescanMs: HOUR, signal: new AbortController().signal, log: broken.log })).toBe(1);
    const fixed = env.harness({ at: T0 + HOUR });
    expect(await fixed.worker.runCycle()).toEqual({ kind: 'done' });
    expect(Object.keys(env.readManifest().lessons)).toEqual(['d/m/a']);
  });
});

describe('upstream down', () => {
  it('8 retryable failures stop the cycle (upstream); chunks already stored are kept for the next cycle', async () => {
    env.writeScripts([lesson('d/m/a'), lesson('d/m/b')]);
    const h = env.harness({ respond: (_, n) => (n >= 2 ? UNAVAILABLE : undefined) });
    expect(await h.worker.runCycle()).toEqual({ kind: 'idle', reason: 'upstream' });
    expect(h.calls).toHaveLength(1 + 8); // never moves on to lesson b
    expect(h.events.find((e) => e.event === 'upstream_unavailable')).toMatchObject({ lessonId: 'd/m/a', chunk: 2, status: 503 });
    expect(failedLessons()).toEqual([]);
    const later = env.harness({ at: T0 + 2 * HOUR });
    expect(await later.worker.runCycle()).toEqual({ kind: 'done' });
    expect(later.calls).toHaveLength(3 + 4); // lesson a resumes at chunk 2
  });
});

describe('per-minute quota', () => {
  it('ten per-minute 429s in a row stop the cycle (quota_minute) instead of retrying forever', async () => {
    env.writeScripts([shortLesson('d/m/a'), shortLesson('d/m/b')]);
    const h = env.harness({ respond: () => MINUTE_429 });
    expect(await h.worker.runCycle()).toEqual({ kind: 'idle', reason: 'quota_minute' });
    expect(h.calls).toHaveLength(10);
    expect(h.sleeps).toHaveLength(9);
    expect(h.names()).toContain('quota_minute_exhausted');
    expect(failedLessons()).toEqual([]);
  });
});

describe('repeated failure circuit breaker', () => {
  it('two lessons in a row failing for the same reason stop the cycle; the third is not attempted', async () => {
    env.writeScripts([shortLesson('d/m/a'), shortLesson('d/m/b'), shortLesson('d/m/c')]);
    const h = env.harness({ respond: () => reject('same') });
    expect(await h.worker.runCycle()).toEqual({ kind: 'idle', reason: 'repeated_failure' });
    expect(h.calls).toHaveLength(2);
    expect(failedLessons()).toEqual(['d/m/a', 'd/m/b']);
    expect(h.events.find((e) => e.event === 'failure_streak')).toEqual({ event: 'failure_streak', lessonId: 'd/m/b', reason: '400 http_400 same' });
  });

  it('different reasons, or a ready lesson in between, do not trip it', async () => {
    env.writeScripts([shortLesson('d/m/a'), shortLesson('d/m/b'), shortLesson('d/m/c'), shortLesson('d/m/d')]);
    const responses = [reject('one'), reject('two'), undefined, reject('two')];
    const h = env.harness({ respond: (_, n) => responses[n - 1] });
    expect(await h.worker.runCycle()).toEqual({ kind: 'done' });
    expect(failedLessons()).toEqual(['d/m/a', 'd/m/b', 'd/m/d']);
  });
});

describe('script hash re-check', () => {
  it('a scriptHash that does not match the chapters rejects the file: scripts_invalid, no request', async () => {
    env.writeScripts([shortLesson('d/m/a'), { ...shortLesson('d/m/b'), scriptHash: 'f'.repeat(64) }]);
    const h = env.harness();
    expect(await h.worker.runCycle()).toEqual({ kind: 'idle', reason: 'scripts_invalid' });
    expect(h.calls).toEqual([]);
    expect(h.events.find((e) => e.event === 'scripts_invalid').reason).toMatch(/d\/m\/b.*scriptHash/);
  });
});

describe('--retry-failed all', () => {
  it('writes one request file; the next cycle clears every failed lesson and retries them', async () => {
    env.writeScripts([shortLesson('d/m/a'), shortLesson('d/m/b')]);
    const responses = [reject('one'), reject('two')];
    await env.harness({ respond: (_, n) => responses[n - 1] }).worker.runCycle();
    expect(failedLessons()).toEqual(['d/m/a', 'd/m/b']);

    vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(await main(['--retry-failed', 'all'], { TTS_DATA_DIR: env.dir }, new AbortController().signal)).toBe(0);
    expect(readdirSync(join(env.dir, 'work', 'retry-requests'))).toEqual(['all']);

    const retry = env.harness({ at: T0 + HOUR });
    expect(await retry.worker.runCycle()).toEqual({ kind: 'done' });
    expect(retry.calls).toHaveLength(2);
    expect(failedLessons()).toEqual([]);
    expect(readdirSync(join(env.dir, 'work', 'retry-requests'))).toEqual([]);
    expect(retry.events.find((e) => e.event === 'retry_requested')).toEqual({ event: 'retry_requested', lessons: ['all'] });
  });
});
