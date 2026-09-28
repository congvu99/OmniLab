// Stable lesson identity helpers. Contract (do not change without updating
// all phases): lesson ID = `${domain}/${module}/${slug}`, where `slug` is the
// MDX filename without its ordering prefix (`NN-`) and extension. `module` is
// required because e.g. `nen-tang/asynchronism` and `chu-de/asynchronism`
// would otherwise collide.
import type { CollectionEntry } from 'astro:content';

type LessonLike = Pick<CollectionEntry<'lessons'>, 'id' | 'data'>;

/** Strip a leading numeric ordering prefix (e.g. "07-cache" -> "cache"). */
function slugOf(entryId: string): string {
  const filename = entryId.split('/').pop() ?? entryId;
  return filename.replace(/^\d+-/, '');
}

/** Domain id from a lesson entry's `domain` reference field. */
function domainIdOf(entry: LessonLike): string {
  const domain = entry.data.domain;
  return typeof domain === 'string' ? domain : domain.id;
}

/** Stable lesson id: `domain/module/slug` (no numeric prefix, never changes after publish). */
export function lessonIdOf(entry: LessonLike): string {
  return `${domainIdOf(entry)}/${entry.data.module}/${slugOf(entry.id)}`;
}

/** Public URL for a lesson: `/hoc/domain/module/slug`. */
export function lessonUrlOf(entry: LessonLike): string {
  return `/hoc/${lessonIdOf(entry)}`;
}
