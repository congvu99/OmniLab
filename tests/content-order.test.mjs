// Pure-function tests for src/lib/content-order.ts — the ordering/adjacency
// logic behind content-queries.ts, tested here against plain arrays so it
// doesn't need an astro:content runtime (see that file's own header comment).
import { describe, expect, it } from 'vitest';
import { adjacentInOrder, sortByOrder, sortLessons } from '../src/lib/content-order.ts';

describe('sortByOrder', () => {
  it('sorts ascending by the given order field', () => {
    const items = [{ id: 'c', order: 3 }, { id: 'a', order: 1 }, { id: 'b', order: 2 }];
    expect(sortByOrder(items, (i) => i.order).map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input array', () => {
    const items = [{ order: 2 }, { order: 1 }];
    const copy = [...items];
    sortByOrder(items, (i) => i.order);
    expect(items).toEqual(copy);
  });

  it('is stable for equal order values', () => {
    const items = [{ id: 'x', order: 1 }, { id: 'y', order: 1 }];
    expect(sortByOrder(items, (i) => i.order).map((i) => i.id)).toEqual(['x', 'y']);
  });
});

describe('sortLessons', () => {
  const moduleOrder = { 'nen-tang': 1, 'danh-doi': 2, 'chu-de': 3 };
  const moduleOrderOf = (id) => moduleOrder[id];

  it('sorts by module order first, then lesson order within the module', () => {
    const lessons = [
      { id: 'k/danh-doi/b', moduleId: 'danh-doi', order: 2 },
      { id: 'k/nen-tang/z', moduleId: 'nen-tang', order: 4 },
      { id: 'k/danh-doi/a', moduleId: 'danh-doi', order: 1 },
      { id: 'k/nen-tang/a', moduleId: 'nen-tang', order: 1 },
    ];
    expect(sortLessons(lessons, moduleOrderOf).map((l) => l.id)).toEqual([
      'k/nen-tang/a',
      'k/nen-tang/z',
      'k/danh-doi/a',
      'k/danh-doi/b',
    ]);
  });

  it('crosses module boundaries: last lesson of module N sorts before first lesson of module N+1 regardless of lesson.order values', () => {
    const lessons = [
      { id: 'last-of-nen-tang', moduleId: 'nen-tang', order: 99 },
      { id: 'first-of-danh-doi', moduleId: 'danh-doi', order: 1 },
    ];
    expect(sortLessons(lessons, moduleOrderOf).map((l) => l.id)).toEqual([
      'last-of-nen-tang',
      'first-of-danh-doi',
    ]);
  });

  it('places lessons with an unknown moduleId after all known modules', () => {
    const lessons = [
      { id: 'unknown', moduleId: 'ghost', order: 1 },
      { id: 'known', moduleId: 'nen-tang', order: 1 },
    ];
    expect(sortLessons(lessons, moduleOrderOf).map((l) => l.id)).toEqual(['known', 'unknown']);
  });

  it('does not mutate the input array', () => {
    const lessons = [{ id: 'b', moduleId: 'danh-doi', order: 1 }, { id: 'a', moduleId: 'nen-tang', order: 1 }];
    const copy = [...lessons];
    sortLessons(lessons, moduleOrderOf);
    expect(lessons).toEqual(copy);
  });
});

describe('adjacentInOrder', () => {
  const sorted = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('returns prev=null for the first item', () => {
    expect(adjacentInOrder(sorted, 'a')).toEqual({ prev: null, next: { id: 'b' } });
  });

  it('returns both prev and next for a middle item', () => {
    expect(adjacentInOrder(sorted, 'b')).toEqual({ prev: { id: 'a' }, next: { id: 'c' } });
  });

  it('returns next=null for the last item', () => {
    expect(adjacentInOrder(sorted, 'c')).toEqual({ prev: { id: 'b' }, next: null });
  });

  it('returns {prev:null, next:null} for an id not in the list', () => {
    expect(adjacentInOrder(sorted, 'missing')).toEqual({ prev: null, next: null });
  });

  it('returns {prev:null, next:null} for an empty list', () => {
    expect(adjacentInOrder([], 'a')).toEqual({ prev: null, next: null });
  });
});
