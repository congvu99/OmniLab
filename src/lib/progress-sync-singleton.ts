/**
 * Browser singleton for the sync engine, started on first call. Call it at the
 * top level of a layout `<script>` (never inside `astro:page-load`): module
 * scripts execute once per full page load, so listeners register once and
 * soft navigations keep the same instance.
 */
import { getProgressStore } from './progress-store';
import { createProgressSync, type ProgressSync } from './progress-sync';

let singleton: ProgressSync | undefined;

function localStorageOrUndefined(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined; // storage blocked: the engine keeps its dirty marker in memory
  }
}

export function getProgressSync(): ProgressSync {
  singleton ??= createProgressSync({
    store: getProgressStore(),
    storage: localStorageOrUndefined(),
    getKnownIds: async () => {
      const { fetchLessonsIndex } = await import('./lessons-index-client');
      return new Set((await fetchLessonsIndex()).map((lesson) => lesson.id));
    },
  });
  return singleton;
}
