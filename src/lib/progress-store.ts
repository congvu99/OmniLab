/**
 * Client-only progress/bookmark store (localStorage, versioned). Single
 * source of truth for every progress-tracking island (mark-complete,
 * bookmark, lesson-status checkmarks, domain progress ring, continue-reading
 * card, saved list) — see phase-05 spec "Architecture". No backend: this is
 * the whole persistence layer for v1.
 *
 * Storage/event-target are injectable (see CreateProgressStoreOptions) so
 * this file is unit-testable in a plain Node vitest environment (no jsdom)
 * without touching a real `window`/`localStorage` — see
 * tests/progress-store.test.mjs. State shape + migration live in
 * ./progress-state.ts (kept separate per the >200-line modularization rule).
 */
import { emptyState, migrate, type LessonId, type LessonProgress, type ProgressState } from './progress-state';
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
  /** Stamp `visitedAt` immediately (call once per reader-page mount). */
  visit(id: LessonId): void;
  /** Add/remove `id` from bookmarks. Returns the new bookmarked state. */
  toggleBookmark(id: LessonId): boolean;
  isBookmarked(id: LessonId): boolean;
  /** Most recently visited lesson that isn't done yet, or `null`. */
  lastUnfinished(): LessonId | null;
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

  function readFromStorage(): ProgressState {
    if (!isPersistent || !storage) return emptyState();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      return raw ? migrate(JSON.parse(raw)) : emptyState();
    } catch {
      return emptyState();
    }
  }

  let state = readFromStorage();
  const listeners = new Set<(state: ProgressState) => void>();

  function notify() {
    for (const fn of listeners) fn(state);
  }

  function persist(next: ProgressState) {
    state = next;
    if (isPersistent && storage) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Quota exceeded or write blocked after construction (rare) — keep
        // serving the in-memory state for this tab instead of throwing.
      }
    }
    notify();
  }

  function patchLesson(id: LessonId, patch: Partial<LessonProgress>) {
    const lessons = { ...state.lessons };
    lessons[id] = { ...lessons[id], ...patch };
    persist({ ...state, lessons });
  }

  const scrollThrottle = createScrollThrottle({
    throttleMs: SCROLL_THROTTLE_MS,
    now,
    onFlush(id, ratio) {
      const prev = state.lessons[id];
      patchLesson(id, { scroll: ratio, visitedAt: prev?.visitedAt ?? now() });
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
      patchLesson(id, done ? { done: true, doneAt: now() } : { done: false, doneAt: undefined });
    },

    saveScroll(id, ratio) {
      scrollThrottle.save(id, Math.min(1, Math.max(0, ratio)));
    },

    visit(id) {
      patchLesson(id, { visitedAt: now() });
    },

    toggleBookmark(id) {
      const isSaved = state.bookmarks.includes(id);
      const bookmarks = isSaved ? state.bookmarks.filter((b) => b !== id) : [...state.bookmarks, id];
      persist({ ...state, bookmarks });
      return !isSaved;
    },

    isBookmarked(id) {
      return state.bookmarks.includes(id);
    },

    lastUnfinished() {
      let best: { id: LessonId; visitedAt: number } | null = null;
      for (const [id, progress] of Object.entries(state.lessons)) {
        if (progress.done || progress.visitedAt === undefined) continue;
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
