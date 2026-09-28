/**
 * Single source of truth for "what order do domains/modules/lessons render
 * in" across every page (domain list, domain detail, reader prev/next,
 * homepage). All pages that need content collection data go through here
 * instead of calling `getCollection`/`getEntry` directly, so there is exactly
 * one place that defines ordering (see phase-04 spec, "Architecture").
 *
 * Ordering/adjacency itself is implemented in ./content-order.ts as pure
 * functions over plain arrays (no astro:content import there) so it's unit
 * testable without a content-collection runtime; this file is the thin
 * astro:content-aware wrapper around it.
 */
import { getCollection, getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { lessonIdOf, lessonUrlOf } from './lesson-id';
import { adjacentInOrder, sortByOrder, sortLessons, type Adjacent } from './content-order';

export type DomainEntry = CollectionEntry<'domains'>;
export type LessonEntry = CollectionEntry<'lessons'>;
export type DomainModule = DomainEntry['data']['modules'][number];

/** A lesson entry enriched with its derived id/url/readingMinutes — what every page actually renders. */
export interface QueriedLesson {
  entry: LessonEntry;
  /** Stable id: `domain/module/slug` (see src/lib/lesson-id.ts). */
  id: string;
  /** Public route: `/hoc/domain/module/slug`. */
  url: string;
  domainId: string;
  moduleId: string;
  title: string;
  /** Ordering within the module. */
  order: number;
  /** Always populated at migrate/build time (see content.config.ts); defaults to 1 defensively. */
  readingMinutes: number;
}

function domainIdOf(entry: LessonEntry): string {
  const domain = entry.data.domain;
  return typeof domain === 'string' ? domain : domain.id;
}

function toQueriedLesson(entry: LessonEntry): QueriedLesson {
  return {
    entry,
    id: lessonIdOf(entry),
    url: lessonUrlOf(entry),
    domainId: domainIdOf(entry),
    moduleId: entry.data.module,
    title: entry.data.title,
    order: entry.data.order,
    readingMinutes: entry.data.readingMinutes ?? 1,
  };
}

/** All domains, sorted by their `order` field (ascending). */
export async function getDomains(): Promise<DomainEntry[]> {
  const domains = await getCollection('domains');
  return sortByOrder(domains, (d) => d.data.order);
}

/** A single domain by id, or `undefined` if it doesn't exist. */
export async function getDomain(id: string): Promise<DomainEntry | undefined> {
  return getEntry('domains', id);
}

/** A domain's modules, sorted by `order` (ascending). `[]` for an unknown domain id. */
export async function getModules(domainId: string): Promise<DomainModule[]> {
  const domain = await getDomain(domainId);
  if (!domain) return [];
  return sortByOrder(domain.data.modules, (m) => m.order);
}

/**
 * Every lesson belonging to `domainId`, sorted module.order -> lesson.order
 * (see content-order.ts). `[]` for an unknown domain id.
 */
export async function getLessonsByDomain(domainId: string): Promise<QueriedLesson[]> {
  const [domain, lessons] = await Promise.all([getDomain(domainId), getCollection('lessons')]);
  if (!domain) return [];
  const moduleOrder = new Map(domain.data.modules.map((m) => [m.id, m.order]));
  const queried = lessons.filter((entry) => domainIdOf(entry) === domainId).map(toQueriedLesson);
  return sortLessons(queried, (moduleId) => moduleOrder.get(moduleId));
}

/** Every lesson across every domain, sorted domain.order -> module.order -> lesson.order. */
export async function getAllLessonsOrdered(): Promise<QueriedLesson[]> {
  const domains = await getDomains();
  const perDomain = await Promise.all(domains.map((d) => getLessonsByDomain(d.data.id)));
  return perDomain.flat();
}

/**
 * prev/next lesson for `lessonId`, crossing module boundaries within its
 * domain (e.g. the last lesson of one module's `next` is the first lesson of
 * the following module). `{ prev: null, next: null }` if `lessonId` isn't
 * found in its own domain's lesson list.
 */
export async function getAdjacent(lessonId: string): Promise<Adjacent<QueriedLesson>> {
  const domainId = lessonId.split('/')[0];
  const sorted = await getLessonsByDomain(domainId);
  return adjacentInOrder(sorted, lessonId);
}
