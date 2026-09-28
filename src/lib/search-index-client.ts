/**
 * Browser-only fetch wrapper for /search-index.json (see
 * src/pages/search-index.json.ts). Only imported by search-box.astro, so it
 * only ever loads on `/tim-kiem` — "lazy-load index only on the search
 * page" per the phase-05 spec. Memoized so re-focusing the search input
 * doesn't refetch.
 */
import type { SearchDoc } from './search-index';

let cache: Promise<SearchDoc[]> | null = null;

export function fetchSearchIndexDocs(): Promise<SearchDoc[]> {
  if (!cache) {
    cache = fetch('/search-index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`search-index.json: HTTP ${res.status}`);
        return res.json() as Promise<SearchDoc[]>;
      })
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}
