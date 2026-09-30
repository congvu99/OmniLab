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
  if (!input || !hint || !loading || !error || !empty || !resultsList || !template || !resultCount) return null;
  return { root, input, hint, loading, error, empty, resultsList, template, resultCount, retry };
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
  const { input, hint, loading, error, empty, resultsList, template, resultCount, retry } = els;

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

  function renderResults(results: SearchResult[]) {
    resultsList.replaceChildren();
    if (results.length === 0) {
      resultsList.hidden = true;
      showOnly(empty);
      resultCount.textContent = '0 kết quả';
      return;
    }
    for (const result of results) resultsList.append(renderResultRow(template, result));
    resultsList.hidden = false;
    showOnly(null);
    resultCount.textContent = `${results.length} kết quả`;
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let requestId = 0;

  async function runSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      resultsList.hidden = true;
      showOnly(hint);
      resultCount.textContent = '';
      return;
    }

    const thisRequest = ++requestId;
    showOnly(loading);
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
      resultCount.textContent = 'Không tải được dữ liệu tìm kiếm.';
    }
  }

  function onInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void runSearch(input.value), DEBOUNCE_MS);
  }

  const onRetry = () => {
    input.focus();
    void runSearch(input.value);
  };

  input.addEventListener('input', onInput);
  retry?.addEventListener('click', onRetry);
  return () => {
    input.removeEventListener('input', onInput);
    retry?.removeEventListener('click', onRetry);
    clearTimeout(debounceTimer);
  };
}
