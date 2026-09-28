/**
 * Pure ordering/adjacency logic for domains, modules and lessons — no
 * `astro:content` import here on purpose, so these functions are unit
 * testable against plain arrays without a full Astro/content-collection
 * environment (see tests/content-order.test.mjs). `src/lib/content-queries.ts`
 * is the thin `astro:content`-aware wrapper that feeds real collection data
 * through these functions; keep all "what order do things render in" logic
 * here so there is exactly one place that can get it wrong.
 */

/** Sort a list by a numeric `order` field (ascending, stable). Does not mutate the input. */
export function sortByOrder<T>(items: T[], orderOf: (item: T) => number): T[] {
  return [...items].sort((a, b) => orderOf(a) - orderOf(b));
}

export interface OrderableLesson {
  /** Stable lesson id, e.g. `kien-truc/chu-de/cache` (see src/lib/lesson-id.ts). */
  id: string;
  moduleId: string;
  /** Ordering within the module (mirrors the MDX filename's numeric prefix). */
  order: number;
}

/**
 * Sort lessons within a domain: module order first (via `moduleOrderOf`),
 * then lesson `order` within that module. Lessons whose `moduleId` isn't
 * found by `moduleOrderOf` sort after every known module (defensive — should
 * not happen for content that passed the zod schema, but keeps this function
 * total instead of throwing on bad input).
 */
export function sortLessons<T extends OrderableLesson>(
  lessons: T[],
  moduleOrderOf: (moduleId: string) => number | undefined,
): T[] {
  const orderOf = (moduleId: string) => moduleOrderOf(moduleId) ?? Number.POSITIVE_INFINITY;
  return [...lessons].sort((a, b) => {
    const byModule = orderOf(a.moduleId) - orderOf(b.moduleId);
    if (byModule !== 0) return byModule;
    return a.order - b.order;
  });
}

export interface Adjacent<T> {
  prev: T | null;
  next: T | null;
}

/**
 * prev/next neighbors of `id` within an already-sorted list (crosses module
 * boundaries transparently since the list is already flattened/sorted).
 * Returns `{ prev: null, next: null }` when `id` isn't found in `sorted`.
 */
export function adjacentInOrder<T extends { id: string }>(sorted: T[], id: string): Adjacent<T> {
  const index = sorted.findIndex((item) => item.id === id);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? sorted[index - 1] : null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}
