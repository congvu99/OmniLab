/**
 * Pure merge of two progress states — shared by the browser and the sync
 * server (plain Node, type stripping), so: no DOM, no clock, no `owner`
 * handling, and relative imports carry the `.ts` extension.
 *
 * Every field resolves to the "greater" side under a total order, which
 * makes `mergeStates` commutative, associative and idempotent: devices that
 * exchange states in any order converge to the same canonical result.
 */
import type { BookmarkMeta, LessonId, LessonProgress, SyncState } from './progress-state.ts';

type Comparable = Pick<SyncState, 'lessons' | 'bookmarkMeta'>;

function compareNumbers(a: number, b: number): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

/** done decision order: (doneUpdatedAt, true > false > unknown, doneAt). */
function compareDone(a: LessonProgress, b: LessonProgress): number {
  const rank = (p: LessonProgress) => (p.done === true ? 2 : p.done === false ? 1 : 0);
  return (
    compareNumbers(a.doneUpdatedAt ?? 0, b.doneUpdatedAt ?? 0) ||
    compareNumbers(rank(a), rank(b)) ||
    compareNumbers(a.doneAt ?? -1, b.doneAt ?? -1)
  );
}

/** visit order: (visitedAt, scroll) — scroll follows the freshest visit. */
function compareVisit(a: LessonProgress, b: LessonProgress): number {
  return (
    compareNumbers(a.visitedAt ?? -Infinity, b.visitedAt ?? -Infinity) ||
    compareNumbers(a.scroll ?? -1, b.scroll ?? -1)
  );
}

function mergeLesson(a: LessonProgress, b: LessonProgress): LessonProgress {
  const doneSide = compareDone(a, b) >= 0 ? a : b;
  const visitSide = compareVisit(a, b) >= 0 ? a : b;
  const out: LessonProgress = {};
  if (doneSide.done !== undefined) out.done = doneSide.done;
  if (doneSide.done === true && doneSide.doneAt !== undefined) out.doneAt = doneSide.doneAt;
  // Missing timestamp == 0: normalize so the result is side-independent on ties.
  const stamp = doneSide.doneUpdatedAt ?? 0;
  if (doneSide.done !== undefined || stamp > 0) out.doneUpdatedAt = stamp;
  if (visitSide.scroll !== undefined) out.scroll = visitSide.scroll;
  if (visitSide.visitedAt !== undefined) out.visitedAt = visitSide.visitedAt;
  return out;
}

/** Bookmark order: later `at` wins; tie -> `on: true` wins. */
function mergeBookmark(a: BookmarkMeta, b: BookmarkMeta): BookmarkMeta {
  const winner = compareNumbers(a.at, b.at) || compareNumbers(+a.on, +b.on);
  const w = winner >= 0 ? a : b;
  return { on: w.on, at: w.at };
}

function mergeRecords<T>(
  a: Record<LessonId, T>,
  b: Record<LessonId, T>,
  mergeOne: (x: T, y: T) => T,
): Record<LessonId, T> {
  const out: Record<LessonId, T> = {};
  for (const id of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    if (id === '__proto__') continue; // would set the prototype instead of a key
    const x = Object.hasOwn(a, id) ? a[id] : undefined;
    const y = Object.hasOwn(b, id) ? b[id] : undefined;
    out[id] = x !== undefined && y !== undefined ? mergeOne(x, y) : (x ?? y)!;
  }
  return out;
}

/** Merge two states into a canonical (sorted-key) v2 state. Does not touch `owner`. */
export function mergeStates(a: Comparable, b: Comparable): SyncState {
  return {
    v: 2,
    lessons: mergeRecords(a.lessons, b.lessons, mergeLesson),
    bookmarkMeta: mergeRecords(a.bookmarkMeta, b.bookmarkMeta, mergeBookmark),
  };
}

/** JSON with object keys sorted and `undefined` dropped — stable across key order. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** cyrb53: sync pure-JS 53-bit string hash (works in browser and Node alike). */
function cyrb53(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * Short deterministic content hash (14 hex chars) of the synced part of a
 * state; ignores `owner` and the derived `bookmarks`. Used to detect "nothing
 * changed since last sync" — not a security primitive.
 */
export function stateHash(state: Comparable): string {
  const json = canonicalJson({ v: 2, lessons: state.lessons, bookmarkMeta: state.bookmarkMeta });
  return cyrb53(json).toString(16).padStart(14, '0');
}
