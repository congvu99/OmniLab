// Audio store on a temp dir: durable manifest writes (fsync observed through injected io),
// corrupt manifest moved aside, state.json recovery, chunk resume validation, retry requests.
import { appendFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, truncateSync, writeFileSync } from 'node:fs';
import { open, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAudioStore } from '../server/tts/audio-store.ts';

const NOW = Date.UTC(2026, 9, 28, 7);
const KEY = 'a'.repeat(64);
const EXPECTED = { model: 'm', voice: 'v', textSha256: ['s0', 's1', 's2'] };
const pcm = (bytes, fill = 1) => new Uint8Array(bytes).fill(fill);
let dir;
let store;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'omnilab-tts-store-'));
  store = createAudioStore(dir);
  await store.ensureLayout();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function recordingIo() {
  const calls = [];
  const io = {
    async open(path, flags) {
      const handle = await open(path, flags);
      const sync = handle.sync.bind(handle);
      handle.sync = async () => {
        calls.push(['sync', path]);
        return sync();
      };
      return handle;
    },
    async rename(from, to) {
      calls.push(['rename', from, to]);
      return rename(from, to);
    },
  };
  return { io, calls };
}

describe('manifest', () => {
  it('writes atomically: fsync tmp, rename, then fsync the directory (best effort on Windows)', async () => {
    const { io, calls } = recordingIo();
    const recording = createAudioStore(dir, io);
    const manifest = { v: 1, updatedAt: 'now', lessons: {} };
    await recording.writeManifest(manifest);
    const tmp = `${recording.manifestPath}.tmp`;
    expect(calls[0]).toEqual(['sync', tmp]);
    expect(calls[1]).toEqual(['rename', tmp, recording.manifestPath]);
    if (process.platform !== 'win32') expect(calls[2]).toEqual(['sync', recording.publicDir]);
    expect(JSON.parse(readFileSync(recording.manifestPath, 'utf8'))).toEqual(manifest);
    expect(existsSync(tmp)).toBe(false);
  });

  it('missing manifest reads as empty without moving anything', async () => {
    const { manifest, invalidMovedTo } = await store.readManifest(NOW);
    expect(manifest.lessons).toEqual({});
    expect(invalidMovedTo).toBeUndefined();
  });

  it.each([['broken json', '{"v":1,'], ['other version', '{"v":9,"lessons":{}}']])('%s is moved to work/manifest.invalid-*', async (_, text) => {
    writeFileSync(store.manifestPath, text);
    const { manifest, invalidMovedTo } = await store.readManifest(NOW);
    expect(manifest.lessons).toEqual({});
    expect(invalidMovedTo).toBe(join(store.workDir, 'manifest.invalid-2026-10-28T07-00-00-000Z.json'));
    expect(readFileSync(invalidMovedTo, 'utf8')).toBe(text);
    expect(existsSync(store.manifestPath)).toBe(false);
    expect(await store.readManifestStrict()).toEqual({ v: 1, updatedAt: '', lessons: {} });
  });
});

describe('state', () => {
  it('round-trips, and reports a corrupt file as an empty state', async () => {
    expect(await store.readState()).toEqual({ state: { v: 1, failed: {}, retired: {} }, corrupt: false });
    const state = { v: 1, pausedUntil: NOW, failed: {}, retired: { 'x.m4a': { at: 1, kind: 'removed' } } };
    await store.writeState(state);
    expect((await store.readState()).state).toEqual(state);
    writeFileSync(store.statePath, 'garbage');
    expect(await store.readState()).toEqual({ state: { v: 1, failed: {}, retired: {} }, corrupt: true });
  });
});

describe('chunk progress', () => {
  let work;

  beforeEach(async () => {
    work = store.lessonWorkDir('d/m/s', KEY);
    for (let i = 0; i < 3; i++) await store.saveChunk(work, i, pcm(100 + i * 2), 24000, EXPECTED);
  });

  const files = () => readdirSync(work).sort();

  it('resumes after the last valid chunk and leaves no tmp files', async () => {
    expect(files()).toEqual(['0000.pcm', '0001.pcm', '0002.pcm', 'meta.json']);
    expect(await store.loadChunkProgress(work, EXPECTED)).toEqual({ done: 3, sampleRate: 24000 });
    const meta = JSON.parse(readFileSync(join(work, 'meta.json'), 'utf8'));
    expect(meta).toMatchObject({ sampleRate: 24000, chunkCount: 3, model: 'm', voice: 'v' });
    expect(meta.chunks).toEqual([{ textSha256: 's0', bytes: 100 }, { textSha256: 's1', bytes: 102 }, { textSha256: 's2', bytes: 104 }]);
  });

  const corruptions = [
    ['missing file', () => rmSync(join(work, '0001.pcm'))],
    ['zero bytes', () => truncateSync(join(work, '0001.pcm'), 0)],
    ['odd bytes', () => truncateSync(join(work, '0001.pcm'), 101)],
    ['size differs from meta', () => appendFileSync(join(work, '0001.pcm'), Buffer.alloc(2))],
  ];
  it.each(corruptions)('%s: chunk 1 and everything after it are dropped', async (_, corrupt) => {
    corrupt();
    expect(await store.loadChunkProgress(work, EXPECTED)).toEqual({ done: 1, sampleRate: 24000 });
    expect(files()).toEqual(['0000.pcm', 'meta.json']);
    expect(JSON.parse(readFileSync(join(work, 'meta.json'), 'utf8')).chunks).toHaveLength(1);
  });

  it('a changed chunk text (textSha256) invalidates that chunk and the rest', async () => {
    const edited = { ...EXPECTED, textSha256: ['s0', 'changed', 's2'] };
    expect(await store.loadChunkProgress(work, edited)).toEqual({ done: 1, sampleRate: 24000 });
    expect(files()).toEqual(['0000.pcm', 'meta.json']);
  });

  it('another voice or chunk count discards everything', async () => {
    expect((await store.loadChunkProgress(work, { ...EXPECTED, voice: 'other' })).done).toBe(0);
    expect(files()).toEqual(['meta.json']);
  });

  it('stray tmp files are removed and a missing dir is simply empty', async () => {
    writeFileSync(join(work, '0003.pcm.tmp'), 'x');
    await store.loadChunkProgress(work, EXPECTED);
    expect(files()).not.toContain('0003.pcm.tmp');
    expect(await store.loadChunkProgress(join(dir, 'nope'), EXPECTED)).toEqual({ done: 0 });
  });

  it('lists and removes work dirs (and the then-empty lesson dir)', async () => {
    const [info] = await store.listWorkDirs();
    expect(info).toMatchObject({ lessonId: 'd/m/s', audioKey: KEY, path: work });
    await store.removeWorkDir(work);
    expect(await store.listWorkDirs()).toEqual([]);
    expect(existsSync(join(store.workDir, 'd.m.s'))).toBe(false);
  });
});

describe('paths and retry requests', () => {
  it('rejects ids that could escape the data dir', () => {
    expect(() => store.lessonWorkDir('../x/y', KEY)).toThrow();
    expect(() => store.lessonWorkDir('d/m/s', '../../etc')).toThrow();
  });

  it('writes, lists and removes retry request files', async () => {
    await store.writeRetryRequest('d/m/s', NOW);
    expect(await store.readRetryRequests()).toEqual(['d/m/s']);
    await store.removeRetryRequest('d/m/s');
    expect(await store.readRetryRequests()).toEqual([]);
    await expect(store.writeRetryRequest('bad id', NOW)).rejects.toThrow(/invalid lesson id/);
  });

  it('publish moves a work file into public/', async () => {
    const source = join(store.workDir, 'out.m4a');
    writeFileSync(source, 'audio');
    await store.publish(source, 'd.m.s.aaaaaaaaaaaa.m4a');
    expect(readFileSync(join(store.publicDir, 'd.m.s.aaaaaaaaaaaa.m4a'), 'utf8')).toBe('audio');
    expect(existsSync(source)).toBe(false);
  });
});
