/**
 * Pure progress math shared by the tab-screen islands (domain cards, learning
 * stats, "up next" list, sidebar footer). Takes the progress-store snapshot
 * and the /lessons-index.json payload (already ordered domain -> module ->
 * lesson by content-queries) so it is unit-testable without a DOM — see
 * tests/domain-progress.test.mjs.
 */
import type { ProgressState } from './progress-state';
import type { LessonIndexEntry } from './lessons-index-client';

export type ProgressLesson = Pick<LessonIndexEntry, 'id' | 'domain' | 'readingMinutes'>;

export interface DomainProgress {
  done: number;
  total: number;
  /** Rounded 0-100; 0 when the domain has no lessons. */
  percent: number;
}

export function domainProgress(
  state: ProgressState,
  lessons: readonly ProgressLesson[],
  domainId: string,
): DomainProgress {
  const inDomain = lessons.filter((l) => l.domain === domainId);
  const done = inDomain.filter((l) => state.lessons[l.id]?.done).length;
  const total = inDomain.length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export interface LearningStats {
  done: number;
  total: number;
  /** Bookmarks that still resolve to a lesson (renamed/removed ids are ignored). */
  saved: number;
  /** Sum of reading minutes of every finished lesson. */
  minutesRead: number;
}

export function learningStats(state: ProgressState, lessons: readonly ProgressLesson[]): LearningStats {
  let done = 0;
  let minutesRead = 0;
  for (const l of lessons) {
    if (state.lessons[l.id]?.done) {
      done += 1;
      minutesRead += l.readingMinutes;
    }
  }
  const known = new Set(lessons.map((l) => l.id));
  const saved = state.bookmarks.filter((id) => known.has(id)).length;
  return { done, total: lessons.length, saved, minutesRead };
}

/**
 * The lessons that follow `currentId` inside its own domain and are not done
 * yet, in reading order (at most `count`). Empty when `currentId` is unknown
 * or is the domain's last lesson.
 */
export function upNextLessons<T extends ProgressLesson>(
  state: ProgressState,
  lessons: readonly T[],
  currentId: string,
  count: number,
): T[] {
  const current = lessons.find((l) => l.id === currentId);
  if (!current) return [];
  const inDomain = lessons.filter((l) => l.domain === current.domain);
  const at = inDomain.findIndex((l) => l.id === currentId);
  return inDomain
    .slice(at + 1)
    .filter((l) => !state.lessons[l.id]?.done)
    .slice(0, Math.max(0, count));
}
