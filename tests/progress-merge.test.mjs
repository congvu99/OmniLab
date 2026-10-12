// Tests for src/lib/progress-merge.ts: mergeStates must be pure, commutative,
// associative and idempotent so concurrent devices converge.
import { describe, expect, it } from 'vitest';
import { mergeStates, stateHash } from '../src/lib/progress-merge.ts';

const A = 'd/m/a';
const B = 'd/m/b';
const C = 'd/m/c';
const st = (lessons = {}, bookmarkMeta = {}) => ({ v: 2, lessons, bookmarkMeta });

describe('mergeStates: lessons', () => {
  it('later done/undone decision wins by doneUpdatedAt', () => {
    const done = st({ [A]: { done: true, doneAt: 10, doneUpdatedAt: 10 } });
    const undone = st({ [A]: { done: false, doneUpdatedAt: 20 } });
    expect(mergeStates(done, undone).lessons[A]).toEqual({ done: false, doneUpdatedAt: 20 });
    expect(mergeStates(undone, done).lessons[A]).toEqual({ done: false, doneUpdatedAt: 20 });
    const redone = st({ [A]: { done: true, doneAt: 30, doneUpdatedAt: 30 } });
    expect(mergeStates(undone, redone).lessons[A]).toEqual({ done: true, doneAt: 30, doneUpdatedAt: 30 });
  });

  it('tie on doneUpdatedAt: done:true wins, both orders', () => {
    const t = st({ [A]: { done: true, doneAt: 10, doneUpdatedAt: 10 } });
    const f = st({ [A]: { done: false, doneUpdatedAt: 10 } });
    expect(mergeStates(t, f).lessons[A].done).toBe(true);
    expect(mergeStates(f, t).lessons[A].done).toBe(true);
  });

  it('visitedAt is the max; scroll follows the side with the larger visitedAt', () => {
    const x = st({ [A]: { visitedAt: 100, scroll: 0.9 } });
    const y = st({ [A]: { visitedAt: 200, scroll: 0.1 } });
    expect(mergeStates(x, y).lessons[A]).toEqual({ visitedAt: 200, scroll: 0.1 });
    expect(mergeStates(y, x).lessons[A]).toEqual({ visitedAt: 200, scroll: 0.1 });
  });

  it('visitedAt tie: larger scroll wins', () => {
    const x = st({ [A]: { visitedAt: 100, scroll: 0.3 } });
    const y = st({ [A]: { visitedAt: 100, scroll: 0.6 } });
    expect(mergeStates(x, y).lessons[A].scroll).toBe(0.6);
    expect(mergeStates(y, x).lessons[A].scroll).toBe(0.6);
  });

  it('done and scroll resolve independently', () => {
    const x = st({ [A]: { done: true, doneAt: 5, doneUpdatedAt: 5, visitedAt: 10, scroll: 0.2 } });
    const y = st({ [A]: { visitedAt: 50, scroll: 0.8 } });
    expect(mergeStates(x, y).lessons[A]).toEqual({
      done: true, doneAt: 5, doneUpdatedAt: 5, visitedAt: 50, scroll: 0.8,
    });
  });

  it('unions lessons present on only one side', () => {
    const m = mergeStates(st({ [A]: { visitedAt: 1 } }), st({ [B]: { visitedAt: 2 } }));
    expect(Object.keys(m.lessons)).toEqual([A, B]);
  });
});

describe('mergeStates: bookmarks', () => {
  it('later at wins (add vs remove, crossed)', () => {
    const added = st({}, { [A]: { on: true, at: 10 } });
    const removed = st({}, { [A]: { on: false, at: 20 } });
    expect(mergeStates(added, removed).bookmarkMeta[A]).toEqual({ on: false, at: 20 });
    expect(mergeStates(removed, added).bookmarkMeta[A]).toEqual({ on: false, at: 20 });
    const readded = st({}, { [A]: { on: true, at: 30 } });
    expect(mergeStates(removed, readded).bookmarkMeta[A]).toEqual({ on: true, at: 30 });
  });

  it('tie: on:true wins; tombstones are kept', () => {
    const on = st({}, { [A]: { on: true, at: 5 } });
    const off = st({}, { [A]: { on: false, at: 5 } });
    expect(mergeStates(on, off).bookmarkMeta[A].on).toBe(true);
    expect(mergeStates(off, off).bookmarkMeta[A]).toEqual({ on: false, at: 5 });
  });

  it('unions bookmarks added on different devices', () => {
    const m = mergeStates(st({}, { [A]: { on: true, at: 1 } }), st({}, { [B]: { on: true, at: 2 } }));
    expect(Object.keys(m.bookmarkMeta)).toEqual([A, B]);
  });
});

describe('mergeStates: algebraic laws', () => {
  const x = st(
    { [A]: { done: true, doneAt: 5, doneUpdatedAt: 5, visitedAt: 7, scroll: 0.3 }, [B]: { done: false, doneUpdatedAt: 0 } },
    { [A]: { on: true, at: 1 }, [C]: { on: false, at: 4 } },
  );
  const y = st(
    { [A]: { done: false, doneUpdatedAt: 9, visitedAt: 7, scroll: 0.5 }, [C]: { visitedAt: 3, scroll: 0.1 } },
    { [A]: { on: false, at: 6 }, [B]: { on: true, at: 2 } },
  );
  const z = st(
    { [A]: { done: true, doneAt: 9, doneUpdatedAt: 9 }, [B]: { done: true, doneAt: 1, doneUpdatedAt: 1, visitedAt: 2 } },
    { [A]: { on: true, at: 6 }, [C]: { on: true, at: 4 } },
  );

  it('idempotent', () => {
    expect(mergeStates(x, x)).toEqual(mergeStates(mergeStates(x, x), x));
    const m = mergeStates(x, y);
    expect(mergeStates(m, y)).toEqual(m);
    expect(stateHash(mergeStates(mergeStates(x, y), y))).toBe(stateHash(mergeStates(x, y)));
  });

  it('commutative', () => {
    expect(stateHash(mergeStates(x, y))).toBe(stateHash(mergeStates(y, x)));
    expect(mergeStates(x, z)).toEqual(mergeStates(z, x));
  });

  it('associative', () => {
    expect(mergeStates(mergeStates(x, y), z)).toEqual(mergeStates(x, mergeStates(y, z)));
  });

  it('does not mutate inputs and ignores owner', () => {
    const a = { ...x, owner: 'alice' };
    const before = JSON.stringify(a);
    const m = mergeStates(a, y);
    expect(JSON.stringify(a)).toBe(before);
    expect(m.owner).toBeUndefined();
  });
});

describe('stateHash', () => {
  it('is independent of key order and ignores owner and derived bookmarks', () => {
    const p = { v: 2, lessons: { [A]: { visitedAt: 1, scroll: 0.5 }, [B]: {} }, bookmarkMeta: {} };
    const q = { bookmarkMeta: {}, owner: 'bob', bookmarks: [], lessons: { [B]: {}, [A]: { scroll: 0.5, visitedAt: 1 } }, v: 2 };
    expect(stateHash(p)).toBe(stateHash(q));
  });

  it('changes when content changes, and is a short hex string', () => {
    const p = st({ [A]: { visitedAt: 1 } });
    const q = st({ [A]: { visitedAt: 2 } });
    expect(stateHash(p)).not.toBe(stateHash(q));
    expect(stateHash(p)).toMatch(/^[0-9a-f]{12,16}$/);
  });
});
