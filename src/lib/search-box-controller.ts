/**
 * DOM wiring for search-box.astro's markup — split out of the .astro file
 * per the >200-line modularization rule (the component was 306 lines with
 * this inlined). Debounces input (200ms), lazily loads+builds the MiniSearch
 * index on first real query, and renders results into the `<template>`
 * clone (see search-box.astro's header comment on why: never innerHTML/
 * createElement for content whose CSS needs to stay Astro-scoped).
 */
import { fetchSearchIndexDocs } from './search-index-client';
import { buildSearchIndex, searchLessons, type SearchDoc, type SearchResult } from './search-index';
import { buildHighlightSegments } from './search-highlight';
import type MiniSearch from 'minisearch';

const DEBOUNCE_MS = 200;

export interface SearchBoxElements {
  root: HTMLElement;
  input: HTMLInputElement;
  hint: HTMLElement;
  loading: HTMLElement;
  error: HTMLElement;
  empty: HTMLElement;
  resultsList: HTMLUListElement;
  template: HTMLTemplateElement;
  /** sr-only status region announcing "N kết quả" once per search — see search-box.astro's header comment for why the results `<ul>` itself no longer carries aria-live. */
  resultCount: HTMLElement;
  /** "Thử lại" button inside the error state; optional so older markup keeps working. */
  retry?: HTMLButtonElement | null;
  /** Visible "N kết quả" label (the sr-only `resultCount` stays the announced one). */
  countLabel?: HTMLElement | null;
  /** Domain filter chips (`[data-search-filter]`, value "all" or a domain id); filter already-fetched results client-side. */
  filters?: HTMLButtonElement[];
  /** "×" button that empties the field. */
  clearButton?: HTMLButtonElement | null;
  /** Suggested-query chips (`[data-search-suggest]`) that fill the field and search at once. */
  suggestions?: HTMLButtonElement[];
}

/** Reads and validates the DOM contract from a `.search-shell` root; `null` if anything's missing. */
export function readSearchBoxElements(root: HTMLElement): SearchBoxElements | null {
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const hint = root.querySelector<HTMLElement>('[data-search-hint]');
  const loading = root.querySelector<HTMLElement>('[data-search-loading]');
  const error = root.querySelector<HTMLElement>('[data-search-error]');
  const empty = root.querySelector<HTMLElement>('[data-search-empty]');
  const resultsList = root.querySelector<HTMLUListElement>('[data-search-results]');
  const template = root.querySelector<HTMLTemplateElement>('[data-search-result-template]');
  const resultCount = root.querySelector<HTMLElement>('[data-search-result-count]');
  const retry = root.querySelector<HTMLButtonElement>('[data-search-retry]');
  const countLabel = root.querySelector<HTMLElement>('[data-search-count-label]');
  const filters = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-search-filter]'));
  const clearButton = root.querySelector<HTMLButtonElement>('[data-search-clear]');
  const suggestions = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-search-suggest]'));
  if (!input || !hint || !loading || !error || !empty || !resultsList || !template || !resultCount) return null;
  return { root, input, hint, loading, error, empty, resultsList, template, resultCount, retry, countLabel, filters, clearButton, suggestions };
}

function renderResultRow(template: HTMLTemplateElement, result: SearchResult): DocumentFragment {
  const node = template.content.cloneNode(true) as DocumentFragment;
  const link = node.querySelector<HTMLAnchorElement>('[data-search-result-link]')!;
  const title = node.querySelector<HTMLElement>('[data-search-result-title]')!;
  const domain = node.querySelector<HTMLElement>('[data-search-result-domain]')!;
  const snippet = node.querySelector<HTMLElement>('[data-search-result-snippet]')!;

  link.href = result.url;
  title.textContent = result.title;
  domain.textContent = result.domainTitle;
  domain.dataset.domain = result.domain;
  // Per-domain accent, set as CSS custom properties (same pattern as
  // domain-card.astro's `--card-accent`) instead of a hardcoded
  // `[data-domain='...']` color map in search-box.astro's CSS — a new
  // domain gets a correctly-colored result row with zero UI code changes.
  if (result.domainAccent) link.style.setProperty('--card-accent', result.domainAccent);
  if (result.domainAccentDark) link.style.setProperty('--card-accent-dark', result.domainAccentDark);

  for (const segment of buildHighlightSegments(result.summary, result.terms)) {
    if (segment.match) {
      const mark = document.createElement('mark');
      mark.textContent = segment.text;
      snippet.append(mark);
    } else {
      snippet.append(document.createTextNode(segment.text));
    }
  }

  return node;
}

/** Wires up one search-box instance. Returns a cleanup function to call before re-init. */
export function attachSearchBox(els: SearchBoxElements): () => void {
  const { input, hint, loading, error, empty, resultsList, template, resultCount, retry, countLabel, clearButton } = els;
  const filters = els.filters ?? [];
  const suggestions = els.suggestions ?? [];

  function showOnly(el: HTMLElement | null) {
    for (const candidate of [hint, loading, error, empty]) {
      candidate.hidden = candidate !== el;
    }
  }

  let index: MiniSearch<SearchDoc> | null = null;
  let indexPromise: Promise<void> | null = null;

  function ensureIndex(): Promise<void> {
    if (!indexPromise) {
      indexPromise = fetchSearchIndexDocs()
        .then((docs) => {
          index = buildSearchIndex(docs);
        })
        .catch((err) => {
          indexPromise = null;
          throw err;
        });
    }
    return indexPromise;
  }

  // Domain filter chips narrow the already-fetched results (no re-search).
  let activeDomain = 'all';
  let lastResults: SearchResult[] = [];

  function setCountLabel(text: string) {
    if (countLabel) countLabel.textContent = text;
  }

  function renderResults(all: SearchResult[]) {
    lastResults = all;
    const results = activeDomain === 'all' ? all : all.filter((r) => r.domain === activeDomain);
    resultsList.replaceChildren();
    if (results.length === 0) {
      resultsList.hidden = true;
      showOnly(empty);
      resultCount.textContent = '0 kết quả';
      setCountLabel('');
      return;
    }
    results.forEach((result, i) => {
      const node = renderResultRow(template, result);
      // Entrance stagger (first 8 rows), consumed by the `.rise` class in markup.
      node.querySelector<HTMLElement>('li')?.style.setProperty('--i', String(Math.min(i, 8)));
      resultsList.append(node);
    });
    resultsList.hidden = false;
    showOnly(null);
    resultCount.textContent = `${results.length} kết quả`;
    setCountLabel(`${results.length} kết quả`);
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let requestId = 0;

  async function runSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      lastResults = [];
      resultsList.hidden = true;
      showOnly(hint);
      resultCount.textContent = '';
      setCountLabel('');
      return;
    }

    const thisRequest = ++requestId;
    showOnly(loading);
    setCountLabel('');
    // Only the first query waits on the network (index fetch); later ones are
    // synchronous, so announcing "loading" there would just be noise.
    if (!index) resultCount.textContent = 'Đang tìm...';

    try {
      await ensureIndex();
      if (thisRequest !== requestId || !index) return; // a newer keystroke superseded this one
      const results = searchLessons(index, trimmed);
      if (thisRequest !== requestId) return; // superseded while searchLessons ran (sync, but stay defensive)
      renderResults(results);
    } catch {
      if (thisRequest !== requestId) return;
      resultsList.hidden = true;
      showOnly(error);
      setCountLabel('');
      resultCount.textContent = 'Không tải được dữ liệu tìm kiếm.';
    }
  }

  function onInput() {
    if (clearButton) clearButton.hidden = input.value.length === 0;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void runSearch(input.value), DEBOUNCE_MS);
  }

  /** Programmatic text change (clear / suggestion): search right away, no debounce. */
  function setQuery(value: string) {
    input.value = value;
    if (clearButton) clearButton.hidden = value.length === 0;
    clearTimeout(debounceTimer);
    void runSearch(value);
    input.focus();
  }

  const onClear = () => setQuery('');
  const suggestionHandlers = suggestions.map((chip) => {
    const handler = () => setQuery(chip.dataset.searchSuggest ?? '');
    chip.addEventListener('click', handler);
    return handler;
  });

  const filterHandlers = filters.map((chip) => {
    const handler = () => {
      activeDomain = chip.dataset.searchFilter ?? 'all';
      for (const other of filters) other.setAttribute('aria-pressed', String(other === chip));
      if (input.value.trim() && lastResults.length > 0) renderResults(lastResults);
    };
    chip.addEventListener('click', handler);
    return handler;
  });

  const onRetry = () => {
    input.focus();
    void runSearch(input.value);
  };

  input.addEventListener('input', onInput);
  retry?.addEventListener('click', onRetry);
  clearButton?.addEventListener('click', onClear);
  return () => {
    input.removeEventListener('input', onInput);
    retry?.removeEventListener('click', onRetry);
    clearButton?.removeEventListener('click', onClear);
    suggestions.forEach((chip, i) => chip.removeEventListener('click', suggestionHandlers[i]));
    filters.forEach((chip, i) => chip.removeEventListener('click', filterHandlers[i]));
    clearTimeout(debounceTimer);
  };
}
