/**
 * Browser-only fetch wrapper for /lessons-index.json (see
 * src/pages/lessons-index.json.ts), memoized per page-session so multiple
 * islands (continue-reading-card, saved-list, progress-ring) share one
 * network request instead of each fetching independently. The memo is a
 * module-level singleton, so it also survives client-router (View
 * Transitions) soft navigations — fetched at most once per browser session.
 */
export interface LessonIndexEntry {
  id: string;
  title: string;
  url: string;
  domain: string;
  domainTitle: string;
  module: string;
  readingMinutes: number;
}

let cache: Promise<LessonIndexEntry[]> | null = null;

export function fetchLessonsIndex(): Promise<LessonIndexEntry[]> {
  if (!cache) {
    cache = fetch('/lessons-index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`lessons-index.json: HTTP ${res.status}`);
        return res.json() as Promise<LessonIndexEntry[]>;
      })
      .catch((err) => {
        cache = null; // allow a retry on the next call instead of caching the failure forever
        throw err;
      });
  }
  return cache;
}
