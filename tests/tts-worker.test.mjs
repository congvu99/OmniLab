// TTS worker scenarios with a fake Gemini client, fake encoder, fake clock and fake sleep:
// new lesson, daily quota pause + resume across restarts, content edits, no key, 429 kinds,
// no_audio, duration outliers, rejected + --retry-failed, encode failure, abort. No network.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main, runWorkerLoop } from '../server/tts/tts-worker-entry.ts';
import { nextPacificMidnight } from '../server/tts/tts-schedule.ts';
import { createWorkerEnv, DAY, HOUR, lesson, MINUTE_429, NO_AUDIO, ok, RATE, shortLesson, T0 } from './helpers/tts-worker-harness.mjs';

const unknown429 = { ...MINUTE_429, scope: 'unknown', retryAfterMs: undefined, quotaIds: [] };
const day429 = { ...MINUTE_429, scope: 'day', retryAfterMs: undefined, quotaIds: ['GenerateRequestsPerDayPerProjectPerModel'] };

let env;
let dir;
let scriptsPath;
beforeEach(() => {
  env = createWorkerEnv();
  ({ dir, scriptsPath } = env);
});
afterEach(() => {
  vi.restoreAllMocks();
  env.cleanup();
});

const writeScripts = (lessons) => env.writeScripts(lessons);
const harness = (options) => env.harness(options);
const readManifest = () => env.readManifest();
const readState = () => env.readState();
const m4aFiles = () => env.m4aFiles();
const chunkTexts = ['Giới thiệu bài.\nMục nhỏ.\n' + 'p'.repeat(300), 'q'.repeat(300), 'r'.repeat(300), 's'.repeat(300)];

describe('new lesson', () => {
  it('generates 4 chunks, publishes, writes chapters (## exact, ### approx) and clears the work dir', async () => {
    writeScripts([lesson('d/m/a')]);
    const h = harness();
    expect(await h.worker.runCycle()).toEqual({ kind: 'done' });
    expect(h.calls).toEqual(chunkTexts);
    expect(h.encodes).toEqual([expect.objectContaining({ chunkCount: 4, sampleRate: RATE })]);
    const entry = readManifest().lessons['d/m/a'];
    const bytes = chunkTexts.map((t) => ok(t).pcm.length);
    const sec = (b) => Math.round((b / 2000) * 100) / 100;
    expect(entry.chapters).toEqual([
      { id: ':intro', title: 'Mở đầu', startSec: 0, depth: 2, approx: false },
      // 16 / 325 ký tự × 23,21 s − 1 s
      { id: 'muc-nho', title: 'Mục nhỏ', startSec: 0.14, depth: 3, approx: true },
      { id: 'phan-a', title: 'Phần A', startSec: sec(bytes[0] + 800), depth: 2, approx: false },
    ]);
    expect(entry.durationSec).toBe(sec(bytes.reduce((a, b) => a + b) + 3 * 800));
    expect(m4aFiles()).toEqual([entry.file]);
    expect(await h.store.listWorkDirs()).toEqual([]);
    expect(h.names()).toContain('lesson_ready');
    expect(JSON.stringify(h.events)).not.toMatch(/ppppp|test-key/);
  });

  it('--only limits generation to one lesson', async () => {
    writeScripts([shortLesson('d/m/a'), shortLesson('d/m/b')]);
    const h = harness();
    await h.worker.runCycle({ only: 'd/m/b' });
    expect(Object.keys(readManifest().lessons)).toEqual(['d/m/b']);
  });
});

describe('daily quota', () => {
  it('pauses until Pacific midnight; a restarted worker makes 0 requests before it and resumes at chunk 3 after', async () => {
    writeScripts([lesson('d/m/a')]);
    const first = harness({ respond: (_, n) => (n === 3 ? day429 : undefined) });
    const until = nextPacificMidnight(T0) + 2 * 60_000;
    expect(await first.worker.runCycle()).toEqual({ kind: 'paused', until });
    expect(readState().pausedUntil).toBe(until);
    expect(first.events.find((e) => e.event === 'quota_body')).toEqual({ event: 'quota_body', body: '{"error":{}}' });

    const early = harness({ at: until - 1 });
    expect(await early.worker.runCycle()).toEqual({ kind: 'paused', until });
    expect(early.calls).toEqual([]);

    const later = harness({ at: until + 1 });
    expect(await later.worker.runCycle()).toEqual({ kind: 'done' });
    expect(later.calls).toEqual(chunkTexts.slice(2));
    expect(readManifest().lessons['d/m/a']).toBeDefined();
  });
});

describe('edited lesson', () => {
  it('regenerates the whole lesson; the old file stays until the retention passes', async () => {
    writeScripts([lesson('d/m/a')]);
    await harness().worker.runCycle();
    const oldFile = readManifest().lessons['d/m/a'].file;
    writeScripts([lesson('d/m/a', 'z')]);
    const h = harness({ at: T0 + HOUR });
    await h.worker.runCycle();
    expect(h.calls).toHaveLength(4);
    const newFile = readManifest().lessons['d/m/a'].file;
    expect(newFile).not.toBe(oldFile);
    expect(m4aFiles().sort()).toEqual([oldFile, newFile].sort());
    expect(readState().retired[oldFile]).toEqual({ at: T0 + HOUR, kind: 'replaced' });
    await harness({ at: T0 + 20 * HOUR }).worker.runCycle();
    expect(m4aFiles()).toContain(oldFile);
    await harness({ at: T0 + 26 * HOUR }).worker.runCycle();
    expect(m4aFiles()).toEqual([newFile]);
  });
});

describe('no key', () => {
  it('cleans up, makes no request and logs idle_no_key once', async () => {
    writeScripts([lesson('d/m/a')]);
    const h = harness({ key: '' });
    expect(await h.worker.runCycle()).toEqual({ kind: 'idle', reason: 'no_key' });
    expect(await h.worker.runCycle()).toEqual({ kind: 'idle', reason: 'no_key' });
    expect(h.names().filter((n) => n === 'idle_no_key')).toHaveLength(1);
    expect(h.calls).toEqual([]);
  });
});

describe('transient failures', () => {
  it('per-minute 429 waits retryAfterMs then succeeds', async () => {
    writeScripts([shortLesson('d/m/a')]);
    const h = harness({ respond: (_, n) => (n === 1 ? MINUTE_429 : undefined) });
    expect(await h.worker.runCycle()).toEqual({ kind: 'done' });
    expect(h.sleeps).toEqual([27_000]);
  });

  it('five unknown 429s in a row pause like a daily quota', async () => {
    writeScripts([shortLesson('d/m/a')]);
    const h = harness({ respond: () => unknown429 });
    expect((await h.worker.runCycle()).kind).toBe('paused');
    expect(h.calls).toHaveLength(5);
    expect(h.sleeps).toEqual([60_000, 120_000, 240_000, 480_000]);
  });

  it('no_audio twice then ok: lesson ready', async () => {
    writeScripts([shortLesson('d/m/a')]);
    const h = harness({ respond: (_, n) => (n <= 2 ? NO_AUDIO : undefined) });
    await h.worker.runCycle();
    expect(h.names().filter((n) => n === 'no_audio_retry')).toHaveLength(2);
    expect(readManifest().lessons['d/m/a']).toBeDefined();
  });

  it('no_audio four times: failed for 7 days, the next lesson still runs', async () => {
    writeScripts([shortLesson('d/m/a'), shortLesson('d/m/b')]);
    const h = harness({ respond: (_, n) => (n <= 4 ? NO_AUDIO : undefined) });
    await h.worker.runCycle();
    const [failed] = Object.values(readState().failed);
    expect(failed).toMatchObject({ lessonId: 'd/m/a', retryAfter: failed.at + 7 * DAY });
    expect(failed.reason).toMatch(/no_audio/);
    expect(Object.keys(readManifest().lessons)).toEqual(['d/m/b']);
  });
});

describe('duration check', () => {
  it.each([
    ['ratio 3 then 1: second take accepted', [3, 1], 'chunk_ok', 1],
    ['ratio 3 then 3: better take kept, no loop', [3, 3], 'chunk_outlier_kept', 3],
    ['ratio 3 then 0.4: the closer one (0.4) kept', [3, 0.4], 'chunk_outlier_kept', 0.4],
  ])('%s', async (_, ratios, finalEvent, keptRatio) => {
    writeScripts([shortLesson('d/m/a')]);
    const h = harness({ respond: (text, n) => ok(text, ratios[n - 1]) });
    await h.worker.runCycle();
    expect(h.calls).toHaveLength(2);
    expect(h.names().filter((n) => n.startsWith('chunk_'))).toEqual(['chunk_outlier', finalEvent]);
    expect(h.names()).toContain('lesson_ready');
    expect(h.events.find((e) => e.event === finalEvent).ratio).toBe(keptRatio);
  });
});

describe('rejected and --retry-failed', () => {
  it('records the failure, keeps going, and retries after a retry request', async () => {
    writeScripts([shortLesson('d/m/a'), shortLesson('d/m/b')]);
    const reject = { kind: 'rejected', status: 400, reason: 'http_400', body: 'bad request' };
    const h = harness({ respond: (_, n) => (n === 1 ? reject : undefined) });
    await h.worker.runCycle();
    expect(Object.values(readState().failed)).toEqual([expect.objectContaining({ lessonId: 'd/m/a', reason: 'chunk 1/1: 400 http_400 bad request' })]);
    expect(Object.keys(readManifest().lessons)).toEqual(['d/m/b']);

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await main(['--retry-failed', 'd/m/a'], { TTS_DATA_DIR: dir }, new AbortController().signal)).toBe(0);
    expect(readdirSync(join(dir, 'work', 'retry-requests'))).toEqual(['d.m.a']);
    expect(await main(['--retry-failed', '../etc/passwd'], { TTS_DATA_DIR: dir }, new AbortController().signal)).toBe(2);

    const retry = harness({ at: T0 + HOUR });
    await retry.worker.runCycle();
    expect(retry.calls).toHaveLength(1);
    expect(readState().failed).toEqual({});
    expect(readdirSync(join(dir, 'work', 'retry-requests'))).toEqual([]);
    expect(Object.keys(readManifest().lessons).sort()).toEqual(['d/m/a', 'd/m/b']);
  });

  it('a sample-rate change between chunks fails the lesson and drops its work dir', async () => {
    writeScripts([lesson('d/m/a')]);
    const h = harness({ respond: (text, n) => (n === 2 ? ok(text, 1, 2000) : undefined) });
    await h.worker.runCycle();
    expect(Object.values(readState().failed)[0].reason).toMatch(/sample rate 2000 != 1000/);
    expect(await h.store.listWorkDirs()).toEqual([]);
  });
});

describe('encode failure', () => {
  it('nothing reaches public/, chunks are kept, a later cycle encodes without new requests', async () => {
    writeScripts([lesson('d/m/a'), lesson('d/m/b')]);
    const broken = harness({ encodeError: 'spawn ffmpeg ENOENT' });
    expect(await broken.worker.runCycle()).toEqual({ kind: 'idle', reason: 'encode_failed' });
    expect(broken.calls).toHaveLength(4); // stops before burning requests on lesson b
    expect(m4aFiles()).toEqual([]);
    expect(existsSync(join(dir, 'public', 'manifest.json'))).toBe(false);
    const fixed = harness({ at: T0 + HOUR, respond: () => undefined });
    await fixed.worker.runCycle({ only: 'd/m/a' });
    expect(fixed.calls).toEqual([]);
    expect(readManifest().lessons['d/m/a']).toBeDefined();
  });
});

describe('worker loop', () => {
  it('abort mid-lesson: the loop exits 0 and leaves only complete chunks', async () => {
    writeScripts([lesson('d/m/a')]);
    const controller = new AbortController();
    const h = harness({
      respond: (_, n) => {
        if (n === 2) {
          controller.abort(new Error('SIGTERM'));
          throw controller.signal.reason;
        }
        return undefined;
      },
    });
    const code = await runWorkerLoop(h.worker, { once: false, rescanMs: HOUR, signal: controller.signal, log: h.log, sleep: h.sleep });
    expect(code).toBe(0);
    expect(h.names().at(-1)).toBe('stopped');
    const [work] = await h.store.listWorkDirs();
    expect(readdirSync(work.path).sort()).toEqual(['0000.pcm', 'meta.json']);
  });

  it('--once exits 0 when idle without a key and 1 when the scripts are invalid', async () => {
    writeScripts([lesson('d/m/a')]);
    const idle = harness({ key: '' });
    const signal = new AbortController().signal;
    expect(await runWorkerLoop(idle.worker, { once: true, rescanMs: HOUR, signal, log: idle.log })).toBe(0);
    writeFileSync(scriptsPath, 'not json');
    const broken = harness({ key: '' });
    expect(await runWorkerLoop(broken.worker, { once: true, rescanMs: HOUR, signal, log: broken.log })).toBe(1);
  });

  it('a paused worker wakes at the rescan interval at the latest', async () => {
    writeScripts([shortLesson('d/m/a')]);
    const h = harness({ respond: () => day429 });
    const controller = new AbortController();
    const sleep = async (ms) => {
      h.sleeps.push(ms);
      controller.abort(new Error('stop'));
      throw controller.signal.reason;
    };
    await runWorkerLoop(h.worker, { once: false, rescanMs: HOUR, signal: controller.signal, log: h.log, sleep, now: () => h.clock.t });
    expect(h.sleeps).toEqual([HOUR]);
  });
});
