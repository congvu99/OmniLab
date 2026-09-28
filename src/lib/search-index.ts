/**
 * MiniSearch wrapper — builds the client-side search index from the
 * build-time `search-index.json` payload (see src/pages/search-index.json.ts).
 * Pure (no fetch/DOM), so it's directly unit-testable against fixture docs —
 * see tests/search-index.test.mjs, which encodes the acceptance criterion
 * ("cache"/"bộ nhớ đệm"/"bo nho dem" all rank the Cache lesson in the top 3)
 * as a real regression test, not just a manual spike.
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
  /**
   * The lesson's domain accent colors (from src/content/domains/*.yaml),
   * carried through so the result row can be colored per-domain without the
   * UI hardcoding a domain -> color map. Optional so older/hand-built
   * fixtures stay valid; a missing value just falls back to the default
   * accent in CSS.
   */
  domainAccent?: string;
  domainAccentDark?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  domainTitle: string;
  summary: string;
  domainAccent?: string;
  domainAccentDark?: string;
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
    storeFields: ['title', 'url', 'domain', 'domainTitle', 'summary', 'domainAccent', 'domainAccentDark'],
    processTerm,
    searchOptions: {
      // Prefix-matching every term (not just the one the user is still
      // typing) turned short common syllables into wildcard matches against
      // nearly the whole corpus (e.g. "bo" -> "bo|bot|bong|..."). Only the
      // LAST term of the query is still being typed, so only it gets prefix
      // matching.
      prefix: (_term, i, terms) => i === terms.length - 1,
      // Fuzzy matching on short (<4 char) folded terms matched too much
      // unrelated content (e.g. "de" inside unrelated words).
      fuzzy: (term) => (term.length >= 4 ? 0.2 : false),
      boost: { title: 4, headings: 2, text: 1 },
    },
  });
  index.addAll(docs);
  return index;
}

function rawResultsFor(index: MiniSearch<SearchDoc>, query: string) {
  // AND first (every term must match somewhere) for precision — a 3-word
  // Vietnamese query OR'd together matched nearly every lesson. Fall back
  // to OR only when AND finds nothing, so a genuinely multi-topic
  // query (or one with a typo'd term outside fuzzy range) still returns
  // something instead of an empty "Không tìm thấy" for what most users
  // would consider a reasonable search.
  const andResults = index.search(query, { combineWith: 'AND' });
  return andResults.length > 0 ? andResults : index.search(query, { combineWith: 'OR' });
}

export function searchLessons(index: MiniSearch<SearchDoc>, query: string, limit = 20): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return rawResultsFor(index, trimmed)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      domain: r.domain,
      domainTitle: r.domainTitle,
      summary: r.summary,
      domainAccent: r.domainAccent,
      domainAccentDark: r.domainAccentDark,
      terms: r.terms,
    }));
}
