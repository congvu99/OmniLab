// Tests for src/lib/progress-store.ts — storage/event-target/now are all
// injected (no jsdom/real localStorage needed, see that file's header).
import { describe, expect, it, vi } from 'vitest';
import { createProgressStore } from '../src/lib/progress-store.ts';
import { migrate } from '../src/lib/progress-state.ts';

/** In-memory Storage-like double. `throwOnWrite`/`throwOnRead` simulate Safari private mode. */
function createFakeStorage({ throwOnWrite = false, throwOnRead = false } = {}) {
  const map = new Map();
  return {
    getItem(key) {
      if (throwOnRead) throw new DOMException('blocked', 'SecurityError');
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      if (throwOnWrite) throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      map.set(key, value);
    },
    removeItem(key) {
      map.delete(key);
    },
    // test helper, not part of StorageLike
    _dump() {
      return Object.fromEntries(map);
    },
  };
}

function createFakeEventTarget() {
  const listeners = new Set();
  return {
    addEventListener(_type, fn) {
      listeners.add(fn);
    },
    removeEventListener(_type, fn) {
      listeners.delete(fn);
    },
    // test helper: simulate another tab writing and firing the storage event
    emit(key) {
      for (const fn of listeners) fn({ key });
    },
  };
}

function createClock(start = 1000) {
  let t = start;
  return { now: () => t, advance: (ms) => (t += ms) };
}

describe('markDone', () => {
  it('marks a lesson done with a timestamp, and undoes it (toast undo = call again with false)', () => {
    const clock = createClock();
    const store = createProgressStore({ storage: createFakeStorage(), now: clock.now });

    store.markDone('kien-truc/chu-de/cache', true);
    expect(store.get().lessons['kien-truc/chu-de/cache']).toEqual({ done: true, doneAt: 1000 });

    store.markDone('kien-truc/chu-de/cache', false);
    expect(store.get().lessons['kien-truc/chu-de/cache'].done).toBe(false);
    expect(store.get().lessons['kien-truc/chu-de/cache'].doneAt).toBeUndefined();
  });

  it('persists across a fresh store instance reading the same storage', () => {
    const storage = createFakeStorage();
    const store1 = createProgressStore({ storage });
    store1.markDone('a/b/c', true);

    const store2 = createProgressStore({ storage });
    expect(store2.get().lessons['a/b/c'].done).toBe(true);
  });
});

describe('toggleBookmark', () => {
  it('adds on first toggle, removes on second, returns the new state', () => {
    const store = createProgressStore({ storage: createFakeStorage() });
    expect(store.toggleBookmark('a/b/c')).toBe(true);
    expect(store.get().bookmarks).toEqual(['a/b/c']);
    expect(store.isBookmarked('a/b/c')).toBe(true);

    expect(store.toggleBookmark('a/b/c')).toBe(false);
    expect(store.get().bookmarks).toEqual([]);
    expect(store.isBookmarked('a/b/c')).toBe(false);
  });
});

describe('lastUnfinished', () => {
  it('returns null when no lesson was ever visited', () => {
    const store = createProgressStore({ storage: createFakeStorage() });
    expect(store.lastUnfinished()).toBeNull();
  });

  it('returns the most recently visited lesson that is not done', () => {
    const clock = createClock();
    const store = createProgressStore({ storage: createFakeStorage(), now: clock.now });

    store.visit('older/lesson');
    clock.advance(100);
    store.visit('newer/lesson');

    expect(store.lastUnfinished()).toBe('newer/lesson');
  });

  it('skips lessons marked done, even if most recently visited', () => {
    const clock = createClock();
    const store = createProgressStore({ storage: createFakeStorage(), now: clock.now });

    store.visit('unfinished/lesson');
    clock.advance(100);
    store.visit('finished/lesson');
    store.markDone('finished/lesson', true);

    expect(store.lastUnfinished()).toBe('unfinished/lesson');
  });
});

describe('saveScroll (throttled ~1s per lesson)', () => {
  it('flushes immediately on the first call for a lesson', () => {
    const clock = createClock();
    const store = createProgressStore({ storage: createFakeStorage(), now: clock.now });
    store.saveScroll('a/b/c', 0.42);
    expect(store.get().lessons['a/b/c'].scroll).toBe(0.42);
  });

  it('coalesces rapid calls within the window into a single trailing flush', () => {
    vi.useFakeTimers();
    try {
      const clock = createClock();
      const store = createProgressStore({ storage: createFakeStorage(), now: clock.now });

      store.saveScroll('a/b/c', 0.1); // flushes immediately (first call)
      store.saveScroll('a/b/c', 0.5); // within window -> scheduled
      store.saveScroll('a/b/c', 0.9); // within window -> replaces pending value

      expect(store.get().lessons['a/b/c'].scroll).toBe(0.1); // not yet flushed
      vi.advanceTimersByTime(1000);
      expect(store.get().lessons['a/b/c'].scroll).toBe(0.9); // latest value wins
    } finally {
      vi.useRealTimers();
    }
  });

  it('clamps ratio to [0,1]', () => {
    const store = createProgressStore({ storage: createFakeStorage() });
    store.saveScroll('a/b/c', 1.5);
    expect(store.get().lessons['a/b/c'].scroll).toBe(1);
    store.saveScroll('x/y/z', -0.2);
    expect(store.get().lessons['x/y/z'].scroll).toBe(0);
  });
});

describe('subscribe', () => {
  it('calls the listener immediately with current state, then on every mutation', () => {
    const store = createProgressStore({ storage: createFakeStorage() });
    const calls = [];
    const unsubscribe = store.subscribe((state) => calls.push(state.bookmarks.length));

    expect(calls).toEqual([0]);
    store.toggleBookmark('a/b/c');
    expect(calls).toEqual([0, 1]);

    unsubscribe();
    store.toggleBookmark('x/y/z');
    expect(calls).toEqual([0, 1]); // no call after unsubscribe
  });

  it('syncs across tabs via the storage event (same key written elsewhere)', () => {
    const storage = createFakeStorage();
    const eventTarget = createFakeEventTarget();
    const store = createProgressStore({ storage, eventTarget });

    const calls = [];
    store.subscribe((state) => calls.push(state.bookmarks.length));

    // Simulate another tab: write directly to the shared storage, then fire
    // the same 'storage' event the browser would dispatch in this tab.
    storage.setItem('omnilab:v1:state', JSON.stringify({ v: 1, lessons: {}, bookmarks: ['other/tab/x'] }));
    eventTarget.emit('omnilab:v1:state');

    expect(store.get().bookmarks).toEqual(['other/tab/x']);
    expect(calls.at(-1)).toBe(1);
  });

  it('ignores storage events for unrelated keys', () => {
    const eventTarget = createFakeEventTarget();
    const store = createProgressStore({ storage: createFakeStorage(), eventTarget });
    store.toggleBookmark('a/b/c');
    eventTarget.emit('some-other-app:key');
    expect(store.get().bookmarks).toEqual(['a/b/c']);
  });
});

describe('migrate', () => {
  it('passes through a well-formed v1 state', () => {
    const raw = { v: 1, lessons: { 'a/b/c': { done: true, doneAt: 5 } }, bookmarks: ['a/b/c'] };
    expect(migrate(raw)).toEqual(raw);
  });

  it('starts fresh for an unknown/missing version', () => {
    expect(migrate({ v: 2, lessons: {}, bookmarks: [] })).toEqual({ v: 1, lessons: {}, bookmarks: [] });
    expect(migrate({})).toEqual({ v: 1, lessons: {}, bookmarks: [] });
    expect(migrate(null)).toEqual({ v: 1, lessons: {}, bookmarks: [] });
    expect(migrate('not an object')).toEqual({ v: 1, lessons: {}, bookmarks: [] });
  });

  it('drops malformed lesson entries and non-string bookmarks instead of throwing', () => {
    const raw = {
      v: 1,
      lessons: { good: { done: true }, bad: 'not an object', ugly: null },
      bookmarks: ['ok', 42, null],
    };
    expect(migrate(raw)).toEqual({
      v: 1,
      lessons: { good: { done: true } },
      bookmarks: ['ok'],
    });
  });

  it('clamps out-of-range scroll ratios during migration', () => {
    const raw = { v: 1, lessons: { a: { scroll: 5 }, b: { scroll: -3 } }, bookmarks: [] };
    expect(migrate(raw).lessons).toEqual({ a: { scroll: 1 }, b: { scroll: 0 } });
  });
});

describe('private-mode fallback (localStorage throws)', () => {
  it('isPersistent is false and reads/writes still work in-memory without throwing', () => {
    const store = createProgressStore({ storage: createFakeStorage({ throwOnWrite: true }) });
    expect(store.isPersistent).toBe(false);

    expect(() => store.markDone('a/b/c', true)).not.toThrow();
    expect(store.get().lessons['a/b/c'].done).toBe(true);

    expect(() => store.toggleBookmark('x/y/z')).not.toThrow();
    expect(store.get().bookmarks).toEqual(['x/y/z']);
  });

  it('isPersistent is false and no crash when localStorage.getItem itself throws', () => {
    const store = createProgressStore({ storage: createFakeStorage({ throwOnRead: true }) });
    expect(store.isPersistent).toBe(false);
    expect(store.get()).toEqual({ v: 1, lessons: {}, bookmarks: [] });
  });

  it('no storage injected at all (e.g. SSR) falls back to a working in-memory store', () => {
    const store = createProgressStore({ storage: undefined, eventTarget: undefined });
    expect(store.isPersistent).toBe(false);
    store.markDone('a/b/c', true);
    expect(store.get().lessons['a/b/c'].done).toBe(true);
  });
});
