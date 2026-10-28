// Safe GC: a broken/empty script file or a mass disappearance never touches manifest or public/
// (byte-for-byte), removed lessons keep audio 30 days, replaced files 24 hours, the on-disk
// manifest is re-checked before any delete, and work dirs / tmp / invalid manifests are bounded.
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAudioStore } from '../server/tts/audio-store.ts';
import { runGc } from '../server/tts/audio-gc.ts';
import { configFromEnv } from '../server/tts/tts-config.ts';
import { createTtsWorker } from '../server/tts/tts-cycle.ts';
import { emptyTtsState } from '../server/tts/tts-work-plan.ts';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const T0 = Date.UTC(2026, 9, 28, 7);
const KEY = 'a'.repeat(64);
let dir;
let store;
let events;
const log = (event, fields) => events.push({ event, ...fields });

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'omnilab-tts-gc-'));
  store = createAudioStore(dir);
  await store.ensureLayout();
  events = [];
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const lessonId = (i) => `d/m/l${i}`;
const fileOf = (i) => `d.m.l${i}.${KEY.slice(0, 12)}.m4a`;
const entryOf = (i) => ({ scriptHash: 's', audioKey: KEY, file: fileOf(i), durationSec: 10, chapters: [], generatedAt: 'g', model: 'm', voice: 'v' });

/** n lessons with audio on disk and in the manifest. */
async function seed(n) {
  const manifest = { v: 1, updatedAt: 'seed', lessons: {} };
  for (let i = 0; i < n; i++) {
    manifest.lessons[lessonId(i)] = entryOf(i);
    writeFileSync(join(store.publicDir, fileOf(i)), `audio ${i}`);
  }
  await store.writeManifest(manifest);
  return manifest;
}

const ids = (count, skip = []) => new Set(Array.from({ length: count }, (_, i) => i).filter((i) => !skip.includes(i)).map(lessonId));
const publicFiles = () => readdirSync(store.publicDir).sort();
const snapshot = () => ({ manifest: readFileSync(store.manifestPath), files: publicFiles().map((f) => [f, readFileSync(join(store.publicDir, f), 'utf8')]) });

function gc(manifest, state, lessonIds, now, extra = {}) {
  return runGc({ store, manifest, state, lessonIds, targets: new Map(), now, retainOldMs: DAY, retainRemovedMs: 30 * DAY, manifestRecovered: false, log, ...extra });
}

describe('script file guard (through the worker cycle)', () => {
  it.each([
    ['empty lesson list', JSON.stringify({ v: 1, extractorVersion: 1, lessons: [] })],
    ['broken JSON', '{"v":1,"lessons":['],
    ['wrong shape', JSON.stringify({ v: 1, extractorVersion: 1, lessons: [{ id: 'x' }] })],
  ])('%s: manifest and public/ unchanged byte-for-byte, scripts_invalid logged', async (_, text) => {
    await seed(3);
    writeFileSync(join(store.workDir, 'stale.tmp'), 'x');
    const scriptsPath = join(dir, 'tts-scripts.json');
    writeFileSync(scriptsPath, text);
    const before = snapshot();
    const config = configFromEnv({ TTS_DATA_DIR: dir, TTS_SCRIPTS_PATH: scriptsPath }, false);
    const worker = createTtsWorker({ config, store, client: null, encoder: { encode: () => Promise.reject(new Error('no')) }, log, now: () => T0 + 400 * DAY });
    expect(await worker.runCycle()).toEqual({ kind: 'idle', reason: 'scripts_invalid' });
    expect(snapshot()).toEqual(before);
    expect(events.map((e) => e.event)).toEqual(['scripts_invalid']);
    expect(JSON.stringify(events)).not.toContain('"lessons"');
  });
});

describe('drop thresholds', () => {
  it('most of a small library gone (6 of 10): gc_refused, nothing retired or removed', async () => {
    const manifest = await seed(10);
    const before = snapshot();
    const state = emptyTtsState();
    const result = await gc(manifest, state, ids(10, [0, 1, 2, 3, 4, 5]), T0 + 365 * DAY);
    expect(result.refused).toBe(true);
    expect(events).toContainEqual({ event: 'gc_refused', dropping: 6, entries: 10 });
    expect(snapshot()).toEqual(before);
    expect(state.retired).toEqual({});
  });

  it('a small library can drop one lesson: retired, not refused', async () => {
    const manifest = await seed(3);
    const state = emptyTtsState();
    const result = await gc(manifest, state, ids(3, [1]), T0);
    expect(result.refused).toBe(false);
    expect(events.map((e) => e.event)).not.toContain('gc_refused');
    expect(state.retired).toEqual({ [fileOf(1)]: { at: T0, kind: 'removed' } });
  });

  it('up to 5 lessons gone is allowed whatever the library size', async () => {
    const manifest = await seed(10);
    const result = await gc(manifest, emptyTtsState(), ids(10, [0, 1, 2, 3, 4]), T0);
    expect(result.refused).toBe(false);
    expect(result.retired).toBe(5);
  });

  it('78 entries: 7 gone (under 10%) is allowed, 8 gone (over 10%) is refused', async () => {
    const allowed = await gc(await seed(78), emptyTtsState(), ids(78, [0, 1, 2, 3, 4, 5, 6]), T0);
    expect(allowed.refused).toBe(false);
    const manifest = await seed(78);
    const before = snapshot();
    const state = emptyTtsState();
    const refused = await gc(manifest, state, ids(78, [0, 1, 2, 3, 4, 5, 6, 7]), T0);
    expect(refused.refused).toBe(true);
    expect(events).toContainEqual({ event: 'gc_refused', dropping: 8, entries: 78 });
    expect(snapshot()).toEqual(before);
    expect(state.retired).toEqual({});
  });

  it('6 of 100 gone (over 5 but under 10%) is allowed', async () => {
    const manifest = await seed(100);
    const result = await gc(manifest, emptyTtsState(), ids(100, [1, 2, 3, 4, 5, 6]), T0);
    expect(result.refused).toBe(false);
  });
});

describe('retention', () => {
  it('a removed lesson keeps its entry and file through day 30, both go on day 31', async () => {
    const manifest = await seed(10);
    const state = emptyTtsState();
    const lessons = ids(10, [9]);
    await gc(manifest, state, lessons, T0);
    expect(state.retired[fileOf(9)]).toEqual({ at: T0, kind: 'removed' });
    await gc(manifest, state, lessons, T0 + 30 * DAY);
    expect(Object.keys(JSON.parse(readFileSync(store.manifestPath, 'utf8')).lessons)).toContain(lessonId(9));
    expect(publicFiles()).toContain(fileOf(9));
    await gc(manifest, state, lessons, T0 + 31 * DAY);
    expect(Object.keys(JSON.parse(readFileSync(store.manifestPath, 'utf8')).lessons)).not.toContain(lessonId(9));
    expect(publicFiles()).not.toContain(fileOf(9));
    expect(state.retired).toEqual({});
    expect(publicFiles().filter((f) => f.endsWith('.m4a'))).toHaveLength(9);
  });

  it('a lesson that comes back on day 10 is never deleted', async () => {
    const manifest = await seed(10);
    const state = emptyTtsState();
    await gc(manifest, state, ids(10, [9]), T0);
    await gc(manifest, state, ids(10), T0 + 10 * DAY);
    expect(state.retired).toEqual({});
    await gc(manifest, state, ids(10), T0 + 31 * DAY);
    expect(publicFiles()).toContain(fileOf(9));
  });

  it('an orphan .m4a is retired as replaced, kept 24 h, then deleted', async () => {
    const manifest = await seed(2);
    const old = 'd.m.l0.bbbbbbbbbbbb.m4a';
    writeFileSync(join(store.publicDir, old), 'old');
    const state = emptyTtsState();
    await gc(manifest, state, ids(2), T0);
    expect(state.retired[old]).toEqual({ at: T0, kind: 'replaced' });
    expect(JSON.parse(readFileSync(store.statePath, 'utf8')).retired[old]).toEqual({ at: T0, kind: 'replaced' });
    await gc(manifest, state, ids(2), T0 + 23 * HOUR);
    expect(publicFiles()).toContain(old);
    await gc(manifest, state, ids(2), T0 + 25 * HOUR);
    expect(publicFiles()).not.toContain(old);
    expect(publicFiles()).toEqual([fileOf(0), fileOf(1), 'manifest.json']);
  });

  it('re-reads the manifest on disk before deleting: a referenced file stays and leaves retired', async () => {
    await seed(1);
    const state = emptyTtsState();
    state.retired[fileOf(0)] = { at: T0 - 10 * DAY, kind: 'replaced' };
    const stale = { v: 1, updatedAt: '', lessons: {} }; // in-memory view that no longer references the file
    const result = await gc(stale, state, ids(1), T0);
    expect(result.removed).toBe(0);
    expect(publicFiles()).toContain(fileOf(0));
    expect(state.retired).toEqual({});
  });

  it('after a manifest recovery nothing is deleted, orphans are retired as removed (30 days)', async () => {
    const orphan = 'd.m.l5.cccccccccccc.m4a';
    writeFileSync(join(store.publicDir, orphan), 'x');
    const state = emptyTtsState();
    state.retired['d.m.l6.dddddddddddd.m4a'] = { at: T0 - 10 * DAY, kind: 'replaced' };
    writeFileSync(join(store.publicDir, 'd.m.l6.dddddddddddd.m4a'), 'y');
    await gc({ v: 1, updatedAt: '', lessons: {} }, state, ids(1), T0, { manifestRecovered: true });
    expect(publicFiles()).toEqual(['d.m.l5.cccccccccccc.m4a', 'd.m.l6.dddddddddddd.m4a']);
    expect(state.retired[orphan]).toEqual({ at: T0, kind: 'removed' });
  });

  it('a recovered library survives the cycles after the recovery for 30 days, not 24 hours', async () => {
    const orphan = 'd.m.l5.cccccccccccc.m4a';
    writeFileSync(join(store.publicDir, orphan), 'x');
    const empty = () => ({ v: 1, updatedAt: '', lessons: {} });
    const state = emptyTtsState();
    await gc(empty(), state, ids(1), T0, { manifestRecovered: true });
    await gc(empty(), state, ids(1), T0 + 25 * HOUR);
    await gc(empty(), state, ids(1), T0 + 29 * DAY);
    expect(publicFiles()).toContain(orphan);
    await gc(empty(), state, ids(1), T0 + 31 * DAY);
    expect(publicFiles()).not.toContain(orphan);
  });
});

describe('work area', () => {
  function workDir(i, key, ageMs) {
    const path = store.lessonWorkDir(lessonId(i), key);
    mkdirSync(path, { recursive: true });
    writeFileSync(join(path, '0000.pcm'), 'pcm');
    const at = new Date(Date.now() - ageMs);
    utimesSync(path, at, at);
    return path;
  }

  it('drops dirs of non-target keys and keeps at most the two newest', async () => {
    const keys = ['1', '2', '3'].map((c) => c.repeat(64));
    const targets = new Map(keys.map((k, i) => [lessonId(i), k]));
    const oldest = workDir(0, keys[0], 3 * HOUR);
    const middle = workDir(1, keys[1], 2 * HOUR);
    const newest = workDir(2, keys[2], HOUR);
    const outdated = workDir(2, '9'.repeat(64), 0);
    await gc({ v: 1, updatedAt: '', lessons: {} }, emptyTtsState(), ids(3), Date.now(), { targets });
    expect([oldest, middle, newest, outdated].map(existsSync)).toEqual([false, true, true, false]);
  });

  it('drops a target-key dir whose audio is already published (stopped between manifest write and cleanup)', async () => {
    const published = workDir(0, KEY, HOUR);
    const pending = workDir(1, '1'.repeat(64), HOUR);
    const manifest = { v: 1, updatedAt: '', lessons: { [lessonId(0)]: entryOf(0) } };
    const targets = new Map([[lessonId(0), KEY], [lessonId(1), '1'.repeat(64)]]);
    await gc(manifest, emptyTtsState(), ids(2), Date.now(), { targets });
    expect([published, pending].map(existsSync)).toEqual([false, true]);
  });

  it('removes tmp files older than an hour and invalid manifests older than 30 days', async () => {
    const age = (path, ms) => utimesSync(path, new Date(Date.now() - ms), new Date(Date.now() - ms));
    const paths = {
      staleTmp: join(store.publicDir, 'manifest.json.tmp'),
      freshTmp: join(store.workDir, 'state.json.tmp'),
      oldInvalid: join(store.workDir, 'manifest.invalid-2026-01-01.json'),
      newInvalid: join(store.workDir, 'manifest.invalid-2026-10-27.json'),
    };
    for (const path of Object.values(paths)) writeFileSync(path, 'x');
    age(paths.staleTmp, 2 * HOUR);
    age(paths.freshTmp, 10 * 60_000);
    age(paths.oldInvalid, 31 * DAY);
    age(paths.newInvalid, DAY);
    await gc({ v: 1, updatedAt: '', lessons: {} }, emptyTtsState(), ids(1), Date.now());
    expect(Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, existsSync(p)])))
      .toEqual({ staleTmp: false, freshTmp: true, oldInvalid: false, newInvalid: true });
  });

  it('prunes failed records of keys that are no longer a target', async () => {
    const state = emptyTtsState();
    state.failed['1'.repeat(64)] = { lessonId: lessonId(0), at: T0, retryAfter: T0 + DAY, reason: '' };
    state.failed['2'.repeat(64)] = { lessonId: lessonId(0), at: T0, retryAfter: T0 + DAY, reason: '' };
    await gc({ v: 1, updatedAt: '', lessons: {} }, state, ids(1), T0, { targets: new Map([[lessonId(0), '2'.repeat(64)]]) });
    expect(Object.keys(state.failed)).toEqual(['2'.repeat(64)]);
  });
});
