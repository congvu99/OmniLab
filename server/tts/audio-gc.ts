/**
 * Cleanup of the TTS data dir that can never wipe the audio library in bulk:
 * a suspicious script file (too many lessons gone) blocks entry removal, a
 * vanished lesson keeps its audio for `retainRemovedMs`, a replaced file for
 * `retainOldMs`, and every `.m4a` is checked against the manifest on disk
 * right before it is deleted. Called only with a valid, non-empty script list.
 */
import { readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { AUDIO_FILE_PATTERN } from '../../src/lib/audio-manifest.ts';
import type { AudioManifest } from '../../src/lib/audio-manifest.ts';
import type { AudioStore } from './audio-store.ts';
import type { TtsState } from './tts-work-plan.ts';
import { noEntries } from './tts-common.ts';
import { GC_MAX_DROP_LESSONS, GC_MAX_DROP_RATIO, INVALID_MANIFEST_RETAIN_MS, MAX_WORK_DIRS, STALE_TMP_MS } from './tts-config.ts';

export type LogEvent = (event: string, fields?: Record<string, unknown>) => void;

export interface GcInput {
  store: AudioStore;
  /** Mutated in place: expired removed lessons are dropped. */
  manifest: AudioManifest;
  /** Mutated in place: `retired` and stale `failed` records. */
  state: TtsState;
  lessonIds: ReadonlySet<string>;
  /** lessonId -> target audioKey. */
  targets: ReadonlyMap<string, string>;
  now: number;
  retainOldMs: number;
  retainRemovedMs: number;
  /** The manifest was unreadable this cycle: delete nothing, orphans are retired as `removed` (long retention). */
  manifestRecovered: boolean;
  log: LogEvent;
}

export interface GcResult {
  removed: number;
  retired: number;
  refused: boolean;
}

const INVALID_MANIFEST_FILE = /^manifest\.invalid-.*\.json$/;

async function ageMs(path: string, now: number): Promise<number> {
  return stat(path).then((s) => now - s.mtimeMs, () => -1);
}

/** Deletes `*.tmp` older than an hour in `dir` and its subdirectories (two levels are enough). */
async function removeStaleTmp(dir: string, now: number, depth: number): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const path = join(dir, entry.name);
    if (entry.isDirectory() && depth > 0) await removeStaleTmp(path, now, depth - 1);
    else if (entry.isFile() && entry.name.endsWith('.tmp') && (await ageMs(path, now)) > STALE_TMP_MS) await rm(path, { force: true });
  }
}

function retireDroppedLessons(input: GcInput, dropped: string[]): { retired: number; changed: boolean } {
  const { manifest, state, now } = input;
  let retired = 0;
  let changed = false;
  for (const lessonId of dropped) {
    const file = manifest.lessons[lessonId].file;
    const record = state.retired[file];
    if (record?.kind !== 'removed') {
      state.retired[file] = { at: now, kind: 'removed' };
      retired++;
    } else if (now - record.at > input.retainRemovedMs) {
      delete manifest.lessons[lessonId];
      changed = true;
    }
  }
  return { retired, changed };
}

function isExpired(input: GcInput, file: string): boolean {
  const record = input.state.retired[file];
  const keep = record.kind === 'removed' ? input.retainRemovedMs : input.retainOldMs;
  return input.now - record.at > keep;
}

/** Deletes expired retired files that the manifest on disk no longer references. */
async function deleteExpired(input: GcInput, referenced: ReadonlySet<string>): Promise<number> {
  const candidates = Object.keys(input.state.retired).filter((file) => !referenced.has(file) && isExpired(input, file));
  if (candidates.length === 0) return 0;
  const onDisk = await input.store.readManifestStrict();
  if (!onDisk) return 0;
  const stillReferenced = new Set(Object.values(onDisk.lessons).map((e) => e.file));
  let removed = 0;
  for (const file of candidates) {
    delete input.state.retired[file];
    if (stillReferenced.has(file) || !AUDIO_FILE_PATTERN.test(file)) continue;
    await rm(join(input.store.publicDir, file), { force: true });
    removed++;
  }
  return removed;
}

async function pruneWorkDirs(input: GcInput, refused: boolean): Promise<void> {
  const kept = [];
  for (const dir of await input.store.listWorkDirs()) {
    const target = input.targets.get(dir.lessonId);
    // Văn bản đọc đáng ngờ (gc_refused) thì giữ cả dữ liệu dở của bài biến mất.
    const keepDropped = refused && target === undefined;
    // Đã publish mà chưa kịp xoá work (dừng giữa ghi manifest và xoá): dữ liệu dở không còn dùng tới.
    const published = input.manifest.lessons[dir.lessonId]?.audioKey === dir.audioKey;
    if (!published && (target === dir.audioKey || keepDropped)) kept.push(dir);
    else await input.store.removeWorkDir(dir.path);
  }
  kept.sort((a, b) => b.mtimeMs - a.mtimeMs);
  for (const dir of kept.slice(MAX_WORK_DIRS)) await input.store.removeWorkDir(dir.path);
}

async function pruneWorkFiles(input: GcInput): Promise<void> {
  const { store, now } = input;
  await removeStaleTmp(store.publicDir, now, 0);
  await removeStaleTmp(store.workDir, now, 2);
  for (const name of (await readdir(store.workDir).catch(noEntries)).filter((n) => INVALID_MANIFEST_FILE.test(n))) {
    if ((await ageMs(join(store.workDir, name), now)) > INVALID_MANIFEST_RETAIN_MS) await rm(join(store.workDir, name), { force: true });
  }
}

/** One cleanup pass; writes the manifest and state itself when it changed them. */
export async function runGc(input: GcInput): Promise<GcResult> {
  const { manifest, state, store, log } = input;
  const before = JSON.stringify(state);
  const entryIds = Object.keys(manifest.lessons);
  const dropped = entryIds.filter((id) => !input.lessonIds.has(id));
  // Ngưỡng an toàn: mất hơn max(5 bài, 10% số bài có bản nghe) thì coi văn bản đọc là đáng ngờ, không gỡ entry nào.
  // Kho nhỏ vẫn gỡ được vài bài bị xoá thật; tệp văn bản đọc rỗng/hỏng đã bị chặn trước khi tới GC.
  const refused = dropped.length > Math.max(GC_MAX_DROP_LESSONS, GC_MAX_DROP_RATIO * entryIds.length);
  let retired = 0;
  let manifestChanged = false;
  if (refused) log('gc_refused', { dropping: dropped.length, entries: entryIds.length });
  else ({ retired, changed: manifestChanged } = retireDroppedLessons(input, dropped));

  const referenced = new Set(Object.values(manifest.lessons).map((e) => e.file));
  for (const [lessonId, entry] of Object.entries(manifest.lessons)) {
    const record = state.retired[entry.file];
    // File vẫn được manifest dùng (bài quay lại trước hạn, hoặc bản cũ được tham chiếu lại): bỏ khỏi danh sách chờ xoá.
    if (record && (record.kind === 'replaced' || input.lessonIds.has(lessonId))) delete state.retired[entry.file];
  }
  // Manifest vừa khôi phục (rỗng) thì file mồ côi có thể là cả kho đang phát: giữ theo hạn bài bị gỡ (30 ngày), không phải 24 giờ.
  const orphanKind = input.manifestRecovered ? 'removed' : 'replaced';
  for (const name of await readdir(store.publicDir).catch(noEntries)) {
    if (!AUDIO_FILE_PATTERN.test(name) || referenced.has(name) || state.retired[name]) continue;
    state.retired[name] = { at: input.now, kind: orphanKind };
    retired++;
  }
  const targetKeys = new Set(input.targets.values());
  for (const key of Object.keys(state.failed)) if (!targetKeys.has(key)) delete state.failed[key];

  if (manifestChanged) await store.writeManifest({ ...manifest, updatedAt: new Date(input.now).toISOString() });
  const removed = input.manifestRecovered ? 0 : await deleteExpired(input, referenced);
  if (JSON.stringify(state) !== before) await store.writeState(state);
  await pruneWorkDirs(input, refused);
  await pruneWorkFiles(input);
  if (removed > 0 || retired > 0) log('gc', { removed, retired });
  return { removed, retired, refused };
}
