/**
 * MiniSearch wrapper — builds the client-side search index from the
 * build-time `search-index.json` payload (see src/pages/search-index.json.ts).
 * Pure (no fetch/DOM), so it's directly unit-testable against fixture docs —
 * see tests/search-index.test.mjs, which encodes the phase-05 acceptance
 * criterion ("cache"/"bộ nhớ đệm"/"bo nho dem" all rank the Cache lesson in
 * the top 3) as a real regression test, not just a manual spike.
 */
import MiniSearch from 'minisearch';
import { foldDiacritics } from './search-normalize';

export interface SearchDoc {
  id: string;
  title: string;
  url: string;
  domain: string;
  domainTitle: string;
  /** Author-written 1-2 sentence summary (lesson frontmatter) — used as the result snippet, not indexed for matching. */
  summary: string;
  /** Joined H2/H3 heading text. */
  headings: string;
  /** Plain-text lesson body, truncated at build time (see the endpoint). */
  text: string;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  domainTitle: string;
  summary: string;
  /** MiniSearch's per-field match terms, used to build a highlighted snippet (see src/lib/search-highlight.ts). */
  terms: string[];
}

function processTerm(term: string): string | null {
  const folded = foldDiacritics(term);
  return folded.length > 0 ? folded : null;
}

export function buildSearchIndex(docs: SearchDoc[]): MiniSearch<SearchDoc> {
  const index = new MiniSearch<SearchDoc>({
    idField: 'id',
    fields: ['title', 'headings', 'text'],
    storeFields: ['title', 'url', 'domain', 'domainTitle', 'summary'],
    processTerm,
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 4, headings: 2, text: 1 },
    },
  });
  index.addAll(docs);
  return index;
}

export function searchLessons(index: MiniSearch<SearchDoc>, query: string, limit = 20): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return index
    .search(trimmed)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      domain: r.domain,
      domainTitle: r.domainTitle,
      summary: r.summary,
      terms: r.terms,
    }));
}
