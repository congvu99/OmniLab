/**
 * Client-only progress/bookmark store (localStorage, versioned). Single
 * source of truth for every progress-tracking island (mark-complete,
 * bookmark, lesson-status checkmarks, domain progress ring, continue-reading
 * card, saved list). No backend: this is the whole persistence layer for v1.
 *
 * Storage/event-target are injectable (see CreateProgressStoreOptions) so
 * this file is unit-testable in a plain Node vitest environment (no jsdom)
 * without touching a real `window`/`localStorage` — see
 * tests/progress-store.test.mjs. State shape + migration live in
 * ./progress-state.ts (kept separate per the >200-line modularization rule).
 */
import {
  emptyState,
  isUnknownFutureVersion,
  migrate,
  toSyncState,
  withBookmarks,
  type LessonId,
  type LessonProgress,
  type ProgressState,
  type SyncState,
} from './progress-state';
import { mergeStates } from './progress-merge';
import { createScrollThrottle } from './progress-scroll-throttle';

export type { LessonId, LessonProgress, ProgressState };
export { migrate };

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Minimal slice of `window` needed for cross-tab sync (`storage` event). */
export interface EventTargetLike {
  addEventListener(type: 'storage', listener: (event: { key: string | null }) => void): void;
  removeEventListener(type: 'storage', listener: (event: { key: string | null }) => void): void;
}

export interface ProgressStore {
  get(): ProgressState;
  /** Toggle a lesson's completion. Idempotent-safe to call with the same value twice. */
  markDone(id: LessonId, done: boolean): void;
  /** Record a scroll-position ratio (0..1), throttled to ~1 write/second per lesson. */
  saveScroll(id: LessonId, ratio: number): void;
  /** Immediately persist any pending throttled scroll write for `id` (or every lesson, if omitted). Call before teardown (`astro:before-swap`, `pagehide`) so a trailing write is never lost. */
  flushScroll(id?: LessonId): void;
  /** Stamp `visitedAt` immediately (call once per reader-page mount). */
  visit(id: LessonId): void;
  /** Add/remove `id` from bookmarks. Returns the new bookmarked state. */
  toggleBookmark(id: LessonId): boolean;
  isBookmarked(id: LessonId): boolean;
  /**
   * Most recently visited lesson that isn't done yet, or `null`. When
   * `knownIds` is given, a saved id no longer present there (the lesson was
   * renamed/removed) is skipped in favor of the next most recent match,
   * rather than making "Học tiếp" show the empty state despite other valid
   * unfinished lessons existing.
   */
  lastUnfinished(knownIds?: ReadonlySet<LessonId>): LessonId | null;
  /**
   * Merge a snapshot from the sync server into local state (never replaces:
   * a newer local edit made while the request was in flight survives). The
   * local `owner` is kept as-is.
   */
  applyRemote(remote: SyncState): void;
  /** Tag the local data with the signed-in username (`undefined` = anonymous). */
  setOwner(owner: string | undefined): void;
  /** Drop all local progress and the owner (sign-out / account switch). */
  clear(): void;
  /** Called immediately with the current state, then again on every change (in-page + cross-tab). */
  subscribe(fn: (state: ProgressState) => void): () => void;
  /** `false` when localStorage is unavailable/throws (e.g. Safari private mode) — state is in-memory only for this tab. */
  readonly isPersistent: boolean;
}

export interface CreateProgressStoreOptions {
  storage?: StorageLike;
  eventTarget?: EventTargetLike;
  now?: () => number;
}

const STORAGE_KEY = 'omnilab:v1:state';
const SCROLL_THROTTLE_MS = 1000;

/** Next timestamp for a decision on a record: never <= its previous one, so a quick re-toggle still wins on merge. */
function nextStamp(now: number, previous: number | undefined): number {
  return previous === undefined ? now : Math.max(now, previous + 1);
}

function resolveDefaultStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    // Accessing the property itself can throw (some locked-down embeds).
    return undefined;
  }
}

function resolveDefaultEventTarget(): EventTargetLike | undefined {
  return typeof window === 'undefined' ? undefined : window;
}

/** Probe once at construction: can we actually write+read+remove? (Safari private mode has localStorage present but throwing.) */
function probeStorage(storage: StorageLike | undefined): boolean {
  if (!storage) return false;
  const probeKey = `${STORAGE_KEY}:probe`;
  try {
    storage.setItem(probeKey, '1');
    storage.getItem(probeKey);
    storage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

export function createProgressStore(options: CreateProgressStoreOptions = {}): ProgressStore {
  const now = options.now ?? Date.now;
  const storage = options.storage ?? resolveDefaultStorage();
  const eventTarget = options.eventTarget ?? resolveDefaultEventTarget();
  const isPersistent = probeStorage(storage);

  // Set by readFromStorage() whenever the on-disk payload is a NEWER schema
  // version this build doesn't understand (e.g. a deploy rollback to v1
  // code after a browser already wrote v2+ data). While true, persist()
  // keeps working normally in-memory for this tab but never writes to
  // storage, so the newer payload on disk is left byte-for-byte untouched
  // instead of being silently wiped by the first v1 write (see
  // isUnknownFutureVersion in progress-state.ts).
  let skipPersist = false;

  function readFromStorage(): ProgressState {
    if (!isPersistent || !storage) return emptyState();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed: unknown = JSON.parse(raw);
      skipPersist = isUnknownFutureVersion(parsed);
      return migrate(parsed);
    } catch {
      return emptyState();
    }
  }

  let state = readFromStorage();
  const listeners = new Set<(state: ProgressState) => void>();

  function notify() {
    for (const fn of listeners) fn(state);
  }

  function writeAndNotify(next: SyncState) {
    state = withBookmarks(next);
    if (isPersistent && storage && !skipPersist) {
      try {
        // `bookmarks` is derived, so only the sync-shaped part is persisted.
        storage.setItem(STORAGE_KEY, JSON.stringify(toSyncState(next)));
      } catch {
        // Quota exceeded or write blocked after construction (rare) — keep
        // serving the in-memory state for this tab instead of throwing.
      }
    }
    notify();
  }

  /**
   * Applies `updater` to the FRESHEST known state, not to this tab's
   * possibly-stale in-memory `state`: two tabs open at once can each mutate
   * between the other's write and its `storage` event arriving, and without
   * re-reading here, whichever tab's `persist()` call landed last would
   * silently revert the other's change (both compute their "next" state
   * from their own last-seen snapshot). Re-reading storage right before
   * every write closes that window. Falls back to the in-memory `state`
   * when there is nothing to re-read from (not persistent, e.g. private
   * mode/SSR) or while `skipPersist` is set (see readFromStorage): in that
   * case disk never reflects this tab's own changes, so re-reading it would
   * instead throw away this tab's own in-memory progress.
   */
  function mutate(updater: (base: ProgressState) => SyncState) {
    const base = isPersistent && storage && !skipPersist ? readFromStorage() : state;
    writeAndNotify(updater(base));
  }

  function patchLesson(id: LessonId, makePatch: (prev: LessonProgress | undefined) => Partial<LessonProgress>) {
    mutate((base) => {
      const lessons = { ...base.lessons };
      lessons[id] = { ...lessons[id], ...makePatch(lessons[id]) };
      return { ...base, lessons };
    });
  }

  const scrollThrottle = createScrollThrottle({
    throttleMs: SCROLL_THROTTLE_MS,
    now,
    onFlush(id, ratio) {
      patchLesson(id, (prev) => ({ scroll: ratio, visitedAt: prev?.visitedAt ?? now() }));
    },
  });

  function handleStorageEvent(event: { key: string | null }) {
    // key === null means storage.clear() was called in another tab.
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    state = readFromStorage();
    notify();
  }

  eventTarget?.addEventListener('storage', handleStorageEvent);

  return {
    get isPersistent() {
      return isPersistent;
    },

    get() {
      return state;
    },

    markDone(id, done) {
      patchLesson(id, (prev) => {
        const doneUpdatedAt = nextStamp(now(), prev?.doneUpdatedAt);
        return done ? { done: true, doneAt: now(), doneUpdatedAt } : { done: false, doneAt: undefined, doneUpdatedAt };
      });
    },

    saveScroll(id, ratio) {
      scrollThrottle.save(id, Math.min(1, Math.max(0, ratio)));
    },

    flushScroll(id) {
      scrollThrottle.flush(id);
    },

    visit(id) {
      patchLesson(id, () => ({ visitedAt: now() }));
    },

    toggleBookmark(id) {
      // Toggle against the freshest read (via mutate()), and read the
      // outcome back off the result it actually wrote — not off this tab's
      // possibly-stale `state` — so the returned value always matches what
      // every subscriber (including this call's own caller) will see.
      let nowSaved = false;
      mutate((base) => {
        const prev = Object.hasOwn(base.bookmarkMeta, id) ? base.bookmarkMeta[id] : undefined;
        nowSaved = !prev?.on;
        return { ...base, bookmarkMeta: { ...base.bookmarkMeta, [id]: { on: nowSaved, at: nextStamp(now(), prev?.at) } } };
      });
      return nowSaved;
    },

    isBookmarked(id) {
      return Object.hasOwn(state.bookmarkMeta, id) && state.bookmarkMeta[id].on;
    },

    applyRemote(remote) {
      mutate((base) => ({ ...mergeStates(base, remote), owner: base.owner }));
    },

    setOwner(owner) {
      mutate((base) => ({ ...base, owner }));
    },

    clear() {
      writeAndNotify(emptyState());
    },

    lastUnfinished(knownIds) {
      let best: { id: LessonId; visitedAt: number } | null = null;
      for (const [id, progress] of Object.entries(state.lessons)) {
        if (progress.done || progress.visitedAt === undefined) continue;
        if (knownIds && !knownIds.has(id)) continue;
        if (!best || progress.visitedAt > best.visitedAt) best = { id, visitedAt: progress.visitedAt };
      }
      return best?.id ?? null;
    },

    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
  };
}

let singleton: ProgressStore | undefined;

/** Lazily-created browser singleton — call from island `<script>`s only (never at SSR/module top-level). */
export function getProgressStore(): ProgressStore {
  if (!singleton) singleton = createProgressStore();
  return singleton;
}
