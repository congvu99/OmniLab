/**
 * On-disk layout of the TTS data dir (`public/` served read-only by Caddy,
 * `work/` private to the worker) with crash-safe writes: tmp file, fsync,
 * rename, fsync of the directory. Chunk PCM is resumable: `meta.json` keeps
 * the size and text hash of every chunk, so a restart continues from the
 * first missing or invalid chunk and never trusts a torn file.
 */
import { open, mkdir, readFile, readdir, rename, rm, rmdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { emptyAudioManifest, parseAudioManifest, AUDIO_MANIFEST_VERSION } from '../../src/lib/audio-manifest.ts';
import type { AudioManifest } from '../../src/lib/audio-manifest.ts';
import { LESSON_ID_PATTERN } from '../../src/lib/progress-state.ts';
import { AUDIO_KEY_PATTERN, emptyTtsState, parseTtsState } from './tts-work-plan.ts';
import type { TtsState } from './tts-work-plan.ts';
import { noEntries } from './tts-common.ts';

/** Injectable fs primitives so tests can observe fsync calls. */
export type StoreIo = { open: typeof open; rename: typeof rename };

export interface ChunkExpectation {
  model: string;
  voice: string;
  /** sha256 of every chunk text of the current chunk plan. */
  textSha256: readonly string[];
}

type ChunkMeta = { v: 1; sampleRate: number; chunkCount: number; model: string; voice: string; chunks: { textSha256: string; bytes: number }[] };

export type WorkDirInfo = { lessonId: string; audioKey: string; path: string; mtimeMs: number };
type JsonRead = { kind: 'missing' } | { kind: 'invalid' } | { kind: 'ok'; value: unknown };

const DOTTED_LESSON = /^[a-z0-9-]+\.[a-z0-9-]+\.[a-z0-9-]+$/;
const CHUNK_FILE = /^(\d{4})\.pcm$/;
const META_FILE = 'meta.json';
/** Retry request name that clears every failed lesson (`--retry-failed all`); never a lesson id. */
export const RETRY_ALL_FAILED = 'all';
// Windows không cho mở thư mục để fsync; trên Linux (VPS) lệnh này luôn chạy được.
const DIR_SYNC_UNSUPPORTED = new Set(['EISDIR', 'EPERM', 'EACCES', 'EINVAL']);

const errorCode = (err: unknown) => (err as NodeJS.ErrnoException | undefined)?.code ?? '';
const dotted = (lessonId: string) => lessonId.replaceAll('/', '.');
export const chunkFileName = (index: number) => `${String(index).padStart(4, '0')}.pcm`;

async function readJson(path: string): Promise<JsonRead> {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (err) {
    if (errorCode(err) === 'ENOENT') return { kind: 'missing' };
    throw err;
  }
  try {
    return { kind: 'ok', value: JSON.parse(text) };
  } catch {
    return { kind: 'invalid' };
  }
}

function parseMeta(read: JsonRead, expected: ChunkExpectation): ChunkMeta | null {
  const meta = read.kind === 'ok' ? (read.value as ChunkMeta | null) : null;
  if (!meta || meta.v !== 1 || !Array.isArray(meta.chunks) || !Number.isInteger(meta.sampleRate) || meta.sampleRate <= 0) return null;
  if (meta.chunkCount !== expected.textSha256.length || meta.model !== expected.model || meta.voice !== expected.voice) return null;
  return meta;
}

export function createAudioStore(dataDir: string, io: StoreIo = { open, rename }) {
  const publicDir = join(dataDir, 'public');
  const workDir = join(dataDir, 'work');
  const retryDir = join(workDir, 'retry-requests');
  const manifestPath = join(publicDir, 'manifest.json');
  const statePath = join(workDir, 'state.json');

  async function syncFile(path: string, flags: string, data?: string | Uint8Array): Promise<void> {
    const handle = await io.open(path, flags);
    try {
      if (data !== undefined) await handle.writeFile(data);
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  async function syncDir(dir: string): Promise<void> {
    await syncFile(dir, 'r').catch((err: unknown) => {
      if (!DIR_SYNC_UNSUPPORTED.has(errorCode(err))) throw err;
    });
  }

  /** tmp + fsync + rename + fsync dir: after a crash the target is either old or new, never torn. */
  async function writeDurable(path: string, data: string | Uint8Array): Promise<void> {
    await syncFile(`${path}.tmp`, 'w', data);
    await io.rename(`${path}.tmp`, path);
    await syncDir(dirname(path));
  }

  const writeJson = (path: string, value: unknown) => writeDurable(path, `${JSON.stringify(value, null, 1)}\n`);

  function lessonWorkDir(lessonId: string, audioKey: string): string {
    if (!LESSON_ID_PATTERN.test(lessonId) || !AUDIO_KEY_PATTERN.test(audioKey)) throw new Error('invalid lesson id or audioKey');
    return join(workDir, dotted(lessonId), audioKey);
  }

  /** Strict read for reference checks: missing -> empty, unparseable or another version -> null. */
  async function readManifestStrict(): Promise<AudioManifest | null> {
    const read = await readJson(manifestPath);
    if (read.kind === 'missing') return emptyAudioManifest();
    const value = read.kind === 'ok' ? (read.value as { v?: unknown } | null) : null;
    return value?.v === AUDIO_MANIFEST_VERSION ? parseAudioManifest(value) : null;
  }

  /** A corrupt manifest is moved to `work/manifest.invalid-<time>.json` and replaced by an empty one. */
  async function readManifest(now: number): Promise<{ manifest: AudioManifest; invalidMovedTo?: string }> {
    const manifest = await readManifestStrict();
    if (manifest) return { manifest };
    const invalidMovedTo = join(workDir, `manifest.invalid-${new Date(now).toISOString().replace(/[:.]/g, '-')}.json`);
    await io.rename(manifestPath, invalidMovedTo);
    return { manifest: emptyAudioManifest(), invalidMovedTo };
  }

  async function readState(): Promise<{ state: TtsState; corrupt: boolean }> {
    const read = await readJson(statePath);
    const state = read.kind === 'ok' ? parseTtsState(read.value) : null;
    return { state: state ?? emptyTtsState(), corrupt: read.kind !== 'missing' && state === null };
  }

  /** Number of leading valid chunks; invalid chunks and everything after them are deleted. */
  async function loadChunkProgress(dir: string, expected: ChunkExpectation): Promise<{ done: number; sampleRate?: number }> {
    const meta = parseMeta(await readJson(join(dir, META_FILE)).catch(() => ({ kind: 'invalid' }) as const), expected);
    let done = 0;
    for (const record of meta?.chunks.slice(0, expected.textSha256.length) ?? []) {
      if (record.textSha256 !== expected.textSha256[done]) break;
      const bytes = await stat(join(dir, chunkFileName(done))).then((s) => s.size, () => -1);
      if (bytes <= 0 || bytes % 2 !== 0 || bytes !== record.bytes) break;
      done++;
    }
    for (const name of await readdir(dir).catch(noEntries)) {
      const match = CHUNK_FILE.exec(name);
      if ((match && Number(match[1]) >= done) || name.endsWith('.tmp')) await rm(join(dir, name), { force: true });
    }
    if (meta && meta.chunks.length !== done) await writeJson(join(dir, META_FILE), { ...meta, chunks: meta.chunks.slice(0, done) });
    return done > 0 && meta ? { done, sampleRate: meta.sampleRate } : { done };
  }

  /** Durably stores chunk `index`, then records its size and text hash in `meta.json`. */
  async function saveChunk(dir: string, index: number, pcm: Uint8Array, sampleRate: number, expected: ChunkExpectation): Promise<void> {
    await mkdir(dir, { recursive: true });
    await writeDurable(join(dir, chunkFileName(index)), pcm);
    const previous = index === 0 ? null : parseMeta(await readJson(join(dir, META_FILE)), expected);
    const chunks = previous?.chunks.slice(0, index) ?? [];
    if (chunks.length !== index) throw new Error(`meta.json lost chunks before ${index}`);
    chunks.push({ textSha256: expected.textSha256[index], bytes: pcm.length });
    const { model, voice } = expected;
    await writeJson(join(dir, META_FILE), { v: 1, sampleRate, chunkCount: expected.textSha256.length, model, voice, chunks });
  }

  async function listWorkDirs(): Promise<WorkDirInfo[]> {
    const out: WorkDirInfo[] = [];
    for (const lessonName of (await readdir(workDir).catch(noEntries)).filter((n) => DOTTED_LESSON.test(n))) {
      for (const audioKey of (await readdir(join(workDir, lessonName)).catch(noEntries)).filter((n) => AUDIO_KEY_PATTERN.test(n))) {
        const path = join(workDir, lessonName, audioKey);
        out.push({ lessonId: lessonName.replaceAll('.', '/'), audioKey, path, mtimeMs: (await stat(path)).mtimeMs });
      }
    }
    return out;
  }

  const retryRequestPath = (lessonId: string) => {
    if (lessonId === RETRY_ALL_FAILED) return join(retryDir, RETRY_ALL_FAILED);
    if (!LESSON_ID_PATTERN.test(lessonId)) throw new Error(`invalid lesson id "${lessonId}"`);
    return join(retryDir, dotted(lessonId));
  };

  return {
    publicDir, workDir, manifestPath, statePath,
    lessonWorkDir, readManifest, readManifestStrict, readState, loadChunkProgress, saveChunk, listWorkDirs,
    ensureLayout: () => Promise.all([mkdir(publicDir, { recursive: true }), mkdir(retryDir, { recursive: true })]),
    writeManifest: (manifest: AudioManifest) => writeJson(manifestPath, manifest),
    writeState: (state: TtsState) => writeJson(statePath, state),
    removeWorkDir: async (path: string) => {
      await rm(path, { recursive: true, force: true });
      await rmdir(dirname(path)).catch(() => undefined); // succeeds only once the lesson dir is empty
    },
    /** Moves a finished file into `public/` (same filesystem) after flushing it. */
    publish: async (sourcePath: string, fileName: string) => {
      await syncFile(sourcePath, 'r+');
      await io.rename(sourcePath, join(publicDir, fileName));
      await syncDir(publicDir);
    },
    readRetryRequests: async () => (await readdir(retryDir).catch(noEntries))
      .filter((n) => n === RETRY_ALL_FAILED || DOTTED_LESSON.test(n)).map((n) => n.replaceAll('.', '/')),
    writeRetryRequest: async (lessonId: string, now: number) => {
      await mkdir(retryDir, { recursive: true });
      await writeDurable(retryRequestPath(lessonId), `${new Date(now).toISOString()}\n`);
    },
    removeRetryRequest: (lessonId: string) => rm(retryRequestPath(lessonId), { force: true }),
  };
}

export type AudioStore = ReturnType<typeof createAudioStore>;
