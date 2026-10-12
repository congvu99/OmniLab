/**
 * ProgressState shape + migration — split out of progress-store.ts (which
 * owns the store factory/behavior) per the >200-line modularization rule.
 * `migrate()` is the single place a schema change plugs into; kept pure (no
 * storage/DOM access) so it's trivially unit-testable and runs unchanged on
 * the sync server (plain Node, type stripping — hence `import type` only).
 *
 * v2 vs v1: completion carries `doneUpdatedAt`, bookmarks live in
 * `bookmarkMeta` (tombstones + insertion order) and the local data may be
 * tagged with an `owner`. The `bookmarks` array is DERIVED from
 * `bookmarkMeta` and never persisted, so consumers keep their old contract.
 */

/** Stable lesson id: `domain/module/slug` (see src/lib/lesson-id.ts). */
export type LessonId = string;

export interface LessonProgress {
  done?: boolean;
  doneAt?: number;
  /** When the done/undone decision was made — drives last-writer-wins on merge. */
  doneUpdatedAt?: number;
  /** Scroll position as a ratio (0..1) — resilient to viewport/font-size changes. */
  scroll?: number;
  visitedAt?: number;
}

export interface BookmarkMeta {
  on: boolean;
  /** Time of the last add/remove decision (tombstones are kept, never GC'd). */
  at: number;
}

/** The persisted + synced part of the state (what `mergeStates` operates on). */
export interface SyncState {
  v: 2;
  /** Username owning the local data; undefined = anonymous. Never merged. */
  owner?: string;
  lessons: Record<LessonId, LessonProgress>;
  bookmarkMeta: Record<LessonId, BookmarkMeta>;
}

/** What the store hands to consumers: SyncState + derived `bookmarks`. */
export interface ProgressState extends SyncState {
  /** Derived: ids with `on` true, ordered by (at, id) ascending. Not persisted. */
  bookmarks: LessonId[];
}

export const LESSON_ID_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function deriveBookmarks(meta: Record<LessonId, BookmarkMeta>): LessonId[] {
  return Object.entries(meta)
    .filter(([, m]) => m.on)
    .sort(([ia, a], [ib, b]) => a.at - b.at || (ia < ib ? -1 : ia > ib ? 1 : 0))
    .map(([id]) => id);
}

export function withBookmarks(state: SyncState): ProgressState {
  return { ...state, bookmarks: deriveBookmarks(state.bookmarkMeta) };
}

/** Persisted/wire form: everything except the derived `bookmarks`. */
export function toSyncState(state: SyncState): SyncState {
  const out: SyncState = { v: 2, lessons: state.lessons, bookmarkMeta: state.bookmarkMeta };
  if (state.owner !== undefined) out.owner = state.owner;
  return out;
}

export function emptyState(): ProgressState {
  return { v: 2, lessons: {}, bookmarkMeta: {}, bookmarks: [] };
}

/**
 * True when `raw` looks like a real payload from a NEWER schema version
 * (`v` is a number greater than 2) — as opposed to genuinely missing or
 * corrupt data. The store (progress-store.ts) uses this to decide whether
 * it's safe to write back to storage: an older build must never overwrite a
 * newer payload with its own shape (e.g. after a deploy rollback, with a
 * browser that already wrote newer data) — see `migrate()` below.
 */
export function isUnknownFutureVersion(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const v = (raw as Record<string, unknown>).v;
  return typeof v === 'number' && v > 2;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Copy the lesson fields common to v1 and v2, dropping anything mistyped. */
function readLesson(v: Record<string, unknown>): LessonProgress {
  const entry: LessonProgress = {};
  if (typeof v.done === 'boolean') entry.done = v.done;
  if (isFiniteNumber(v.doneAt)) entry.doneAt = v.doneAt;
  if (isFiniteNumber(v.doneUpdatedAt)) entry.doneUpdatedAt = v.doneUpdatedAt;
  if (isFiniteNumber(v.scroll)) entry.scroll = Math.min(1, Math.max(0, v.scroll));
  if (isFiniteNumber(v.visitedAt)) entry.visitedAt = v.visitedAt;
  return entry;
}

function migrateV1(obj: Record<string, unknown>): ProgressState {
  const lessons: Record<LessonId, LessonProgress> = {};
  if (isObject(obj.lessons)) {
    // v1 ids were never validated, so only prototype-pollution keys are dropped here;
    // ids that fail LESSON_ID_PATTERN are dropped by migrateV2 on the next re-read.
    for (const [id, value] of Object.entries(obj.lessons)) {
      if (FORBIDDEN_KEYS.has(id) || !isObject(value)) continue;
      const entry = readLesson(value);
      // v1 "not done" is the weakest claim (0): it must never override a
      // "done" recorded on another device. v1 "done" is stamped with its
      // completion time (1 if unknown, still beating 0).
      delete entry.doneUpdatedAt;
      if (entry.done === true) entry.doneUpdatedAt = entry.doneAt ?? 1;
      else if (entry.done === false) entry.doneUpdatedAt = 0;
      lessons[id] = entry;
    }
  }

  const bookmarkMeta: Record<LessonId, BookmarkMeta> = {};
  if (Array.isArray(obj.bookmarks)) {
    // `at` = 1-based index keeps the existing "Đã lưu" order.
    let index = 0;
    for (const id of obj.bookmarks) {
      if (typeof id !== 'string' || FORBIDDEN_KEYS.has(id) || Object.hasOwn(bookmarkMeta, id)) continue;
      bookmarkMeta[id] = { on: true, at: ++index };
    }
  }
  return withBookmarks({ v: 2, lessons, bookmarkMeta });
}

function migrateV2(obj: Record<string, unknown>): ProgressState {
  const lessons: Record<LessonId, LessonProgress> = {};
  if (isObject(obj.lessons)) {
    for (const [id, value] of Object.entries(obj.lessons)) {
      if (!LESSON_ID_PATTERN.test(id) || !isObject(value)) continue;
      lessons[id] = readLesson(value);
    }
  }

  const bookmarkMeta: Record<LessonId, BookmarkMeta> = {};
  if (isObject(obj.bookmarkMeta)) {
    for (const [id, value] of Object.entries(obj.bookmarkMeta)) {
      if (!LESSON_ID_PATTERN.test(id) || !isObject(value)) continue;
      if (typeof value.on !== 'boolean' || !isFiniteNumber(value.at)) continue;
      bookmarkMeta[id] = { on: value.on, at: value.at };
    }
  }

  const state: SyncState = { v: 2, lessons, bookmarkMeta };
  if (typeof obj.owner === 'string' && obj.owner !== '') state.owner = obj.owner;
  return withBookmarks(state);
}

/**
 * Normalize arbitrary parsed JSON into a valid ProgressState. v1 is upgraded
 * (see migrateV1), v2 is validated (ids must look like real lesson ids, no
 * prototype-pollution keys), anything else (missing/mismatched `v`,
 * malformed shape) starts fresh rather than crashing. Callers reading from
 * persistent storage should check `isUnknownFutureVersion(raw)` FIRST and,
 * if true, treat the resulting emptyState() as in-memory-only for this tab
 * (never persist it) — this function itself has no access to storage and
 * cannot enforce that on its own.
 */
export function migrate(raw: unknown): ProgressState {
  if (!isObject(raw)) return emptyState();
  if (raw.v === 1) return migrateV1(raw);
  if (raw.v === 2) return migrateV2(raw);
  return emptyState();
}
