// Tests for the v1 -> v2 migration and v2 validation in src/lib/progress-state.ts.
import { describe, expect, it } from 'vitest';
import { emptyState, isUnknownFutureVersion, migrate } from '../src/lib/progress-state.ts';
import { mergeStates } from '../src/lib/progress-merge.ts';

const A = 'kien-truc/chu-de/a';
const B = 'kien-truc/chu-de/b';
const C = 'kien-truc/chu-de/c';

describe('migrate v1 -> v2', () => {
  it('converts a real v1 payload, preserving data and bookmark order', () => {
    const v1 = {
      v: 1,
      lessons: {
        [A]: { done: true, doneAt: 500, visitedAt: 600, scroll: 0.5 },
        [B]: { done: false, visitedAt: 700 },
        [C]: { scroll: 0.2, visitedAt: 100 },
      },
      bookmarks: [C, A, B],
    };
    const s = migrate(v1);
    expect(s.v).toBe(2);
    expect(s.owner).toBeUndefined();
    expect(s.lessons[A]).toEqual({ done: true, doneAt: 500, doneUpdatedAt: 500, visitedAt: 600, scroll: 0.5 });
    expect(s.lessons[B]).toEqual({ done: false, doneUpdatedAt: 0, visitedAt: 700 });
    expect(s.lessons[C]).toEqual({ scroll: 0.2, visitedAt: 100 });
    expect(s.bookmarkMeta[C]).toEqual({ on: true, at: 1 });
    expect(s.bookmarkMeta[A]).toEqual({ on: true, at: 2 });
    expect(s.bookmarks).toEqual([C, A, B]);
  });

  it('uses doneUpdatedAt=1 when a v1 done lesson has no doneAt', () => {
    expect(migrate({ v: 1, lessons: { [A]: { done: true } }, bookmarks: [] }).lessons[A].doneUpdatedAt).toBe(1);
  });

  it('a lesson merely re-opened on another device does not erase completion after merge', () => {
    const machineA = migrate({ v: 1, lessons: { [A]: { done: true, doneAt: 1000, visitedAt: 1000 } }, bookmarks: [] });
    const machineB = migrate({ v: 1, lessons: { [A]: { visitedAt: 5000 } }, bookmarks: [] });
    const merged = mergeStates(machineA, machineB);
    expect(merged.lessons[A].done).toBe(true);
    expect(merged.lessons[A].visitedAt).toBe(5000);
    // v1 "not done" is the weakest claim: it never overrides a done elsewhere.
    const machineC = migrate({ v: 1, lessons: { [A]: { done: false, visitedAt: 9000 } }, bookmarks: [] });
    expect(mergeStates(machineA, machineC).lessons[A].done).toBe(true);
    expect(mergeStates(machineC, machineA).lessons[A].done).toBe(true);
  });

  it('migrating the same v1 payload twice is deterministic', () => {
    const v1 = { v: 1, lessons: { [A]: { done: true, doneAt: 5 } }, bookmarks: [A, B] };
    expect(migrate(v1)).toEqual(migrate(v1));
  });
});

describe('migrate v2 validation', () => {
  it('round-trips a valid v2 payload and derives bookmarks', () => {
    const raw = {
      v: 2,
      owner: 'alice',
      lessons: { [A]: { done: true, doneAt: 5, doneUpdatedAt: 5 } },
      bookmarkMeta: { [A]: { on: true, at: 9 }, [B]: { on: false, at: 10 } },
    };
    const s = migrate(raw);
    expect(s).toMatchObject(raw);
    expect(s.bookmarks).toEqual([A]);
  });

  it('derives bookmarks ordered by (at, id) and skips tombstones', () => {
    const s = migrate({
      v: 2,
      lessons: {},
      bookmarkMeta: { [C]: { on: true, at: 3 }, [A]: { on: true, at: 3 }, [B]: { on: false, at: 9 } },
    });
    expect(s.bookmarks).toEqual([A, C]);
  });

  it('drops ids that do not match domain/module/slug and prototype-pollution keys', () => {
    const raw = JSON.parse(
      `{"v":2,"lessons":{"__proto__":{"done":true},"constructor":{"done":true},"prototype":{"done":true},"bad id":{"done":true},"a/b":{"done":true},"${A}":{"done":true,"doneUpdatedAt":1}},` +
        `"bookmarkMeta":{"__proto__":{"on":true,"at":1},"nope":{"on":true,"at":1},"${B}":{"on":true,"at":2}}}`,
    );
    const s = migrate(raw);
    expect(Object.keys(s.lessons)).toEqual([A]);
    expect(Object.keys(s.bookmarkMeta)).toEqual([B]);
    expect({}.done).toBeUndefined();
  });

  it('drops malformed entries and clamps scroll', () => {
    const s = migrate({
      v: 2,
      lessons: { [A]: { scroll: 4, doneUpdatedAt: 'x', done: 'yes' }, [B]: null },
      bookmarkMeta: { [A]: { on: 'true', at: 1 }, [B]: { on: true, at: 'x' }, [C]: 5 },
    });
    expect(s.lessons).toEqual({ [A]: { scroll: 1 } });
    expect(s.bookmarkMeta).toEqual({});
  });

  it('non-string owner is discarded', () => {
    expect(migrate({ v: 2, owner: 5, lessons: {}, bookmarkMeta: {} }).owner).toBeUndefined();
  });
});

describe('versions', () => {
  it('v:3 is an unknown future version; v:2 is not', () => {
    expect(isUnknownFutureVersion({ v: 3 })).toBe(true);
    expect(isUnknownFutureVersion({ v: 2 })).toBe(false);
    expect(isUnknownFutureVersion({ v: 1 })).toBe(false);
  });

  it('unknown versions and junk start fresh', () => {
    expect(migrate({ v: 3, lessons: {} })).toEqual(emptyState());
    expect(migrate(null)).toEqual(emptyState());
    expect(emptyState()).toEqual({ v: 2, lessons: {}, bookmarkMeta: {}, bookmarks: [] });
  });
});
