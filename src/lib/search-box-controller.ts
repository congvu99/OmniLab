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
  if (!input || !hint || !loading || !error || !empty || !resultsList || !template) return null;
  return { root, input, hint, loading, error, empty, resultsList, template };
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
  const { input, hint, loading, error, empty, resultsList, template } = els;

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
      return;
    }
    for (const result of results) resultsList.append(renderResultRow(template, result));
    resultsList.hidden = false;
    showOnly(null);
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let requestId = 0;

  async function runSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      resultsList.hidden = true;
      showOnly(hint);
      return;
    }

    const thisRequest = ++requestId;
    showOnly(loading);

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
    }
  }

  function onInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void runSearch(input.value), DEBOUNCE_MS);
  }

  input.addEventListener('input', onInput);
  return () => {
    input.removeEventListener('input', onInput);
    clearTimeout(debounceTimer);
  };
}
