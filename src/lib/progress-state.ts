/**
 * ProgressState shape + migration — split out of progress-store.ts (which
 * owns the store factory/behavior) per the >200-line modularization rule.
 * `migrate()` is the single place a future v1->v2 shape change would plug
 * into; kept pure (no storage/DOM access) so it's trivially unit-testable.
 */

/** Stable lesson id: `domain/module/slug` (see src/lib/lesson-id.ts). */
export type LessonId = string;

export interface LessonProgress {
  done?: boolean;
  doneAt?: number;
  /** Scroll position as a ratio (0..1) — resilient to viewport/font-size changes. */
  scroll?: number;
  visitedAt?: number;
}

export interface ProgressState {
  v: 1;
  lessons: Record<LessonId, LessonProgress>;
  bookmarks: LessonId[];
}

export function emptyState(): ProgressState {
  return { v: 1, lessons: {}, bookmarks: [] };
}

/**
 * True when `raw` looks like a real payload from a NEWER schema version
 * (`v` is a number greater than 1) — as opposed to genuinely missing or
 * corrupt data. The store (progress-store.ts) uses this to decide whether
 * it's safe to write back to storage: a v1 build must never overwrite a v2+
 * payload with today's v1 shape (e.g. after a deploy rollback to v1 code,
 * with a browser that already wrote v2 data) — see `migrate()` below.
 */
export function isUnknownFutureVersion(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const v = (raw as Record<string, unknown>).v;
  return typeof v === 'number' && v > 1;
}

/**
 * Normalize arbitrary parsed JSON into a valid ProgressState. `v:1` is the
 * only version that has ever shipped, so anything else (missing/mismatched
 * `v`, malformed shape) starts fresh rather than crashing. Callers reading
 * from persistent storage should check `isUnknownFutureVersion(raw)` FIRST
 * and, if true, treat the resulting emptyState() as in-memory-only for this
 * tab (never persist it) — this function itself has no access to storage
 * and cannot enforce that on its own.
 */
export function migrate(raw: unknown): ProgressState {
  if (!raw || typeof raw !== 'object') return emptyState();
  const obj = raw as Record<string, unknown>;
  if (obj.v !== 1) return emptyState();

  const lessons: Record<LessonId, LessonProgress> = {};
  if (obj.lessons && typeof obj.lessons === 'object') {
    for (const [id, value] of Object.entries(obj.lessons as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const v = value as Record<string, unknown>;
      const entry: LessonProgress = {};
      if (typeof v.done === 'boolean') entry.done = v.done;
      if (typeof v.doneAt === 'number') entry.doneAt = v.doneAt;
      if (typeof v.scroll === 'number') entry.scroll = Math.min(1, Math.max(0, v.scroll));
      if (typeof v.visitedAt === 'number') entry.visitedAt = v.visitedAt;
      lessons[id] = entry;
    }
  }

  const bookmarks = Array.isArray(obj.bookmarks)
    ? obj.bookmarks.filter((b): b is string => typeof b === 'string')
    : [];

  return { v: 1, lessons, bookmarks };
}
