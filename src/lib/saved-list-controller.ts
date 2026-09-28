/**
 * DOM wiring for saved-list.astro's markup — split out per the >200-line
 * modularization rule (mirrors src/lib/search-box-controller.ts). Both the
 * store and the lessons-index fetcher are injected so the render/focus
 * logic is unit-testable without a real ProgressStore/network — see
 * tests/saved-list-controller.test.mjs, which covers two regressions this
 * fixes: focus lost on remove, and an all-bookmarks-missing list showing a
 * blank card instead of the empty state.
 */
import type { ProgressStore } from './progress-store';
import type { LessonIndexEntry } from './lessons-index-client';

export interface SavedListElements {
  root: HTMLElement;
  emptyState: HTMLElement;
  rowsList: HTMLUListElement;
  template: HTMLTemplateElement;
}

/** Reads and validates the DOM contract from a `[data-saved-list]` root; `null` if anything's missing. */
export function readSavedListElements(root: HTMLElement): SavedListElements | null {
  const emptyState = root.querySelector<HTMLElement>('[data-saved-empty]');
  const rowsList = root.querySelector<HTMLUListElement>('[data-saved-rows]');
  const template = root.querySelector<HTMLTemplateElement>('[data-saved-row-template]');
  if (!emptyState || !rowsList || !template) return null;
  return { root, emptyState, rowsList, template };
}

/** Wires up one saved-list instance. Returns a cleanup function to call before re-init. */
export function attachSavedList(
  els: SavedListElements,
  store: ProgressStore,
  fetchLessonsIndex: () => Promise<Pick<LessonIndexEntry, 'id' | 'url' | 'title' | 'domainTitle'>[]>,
): () => void {
  const { emptyState, rowsList, template } = els;

  // Set by a remove button's click handler right before it mutates the
  // store (which synchronously re-triggers the subscribe -> render() below);
  // consumed once at the end of the render it caused. Anything OTHER than a
  // removal (initial render, a store change from elsewhere, e.g. marking a
  // different lesson done) leaves this null, so focus is only ever moved as
  // a direct result of a remove click — never stolen on an unrelated
  // re-render.
  let pendingFocusIndex: number | null = null;

  function showEmpty() {
    emptyState.hidden = false;
    rowsList.hidden = true;
    rowsList.replaceChildren();
  }

  /** Moves focus to the row that now occupies `index` (the next row shifts into a removed row's position), the last row if `index` is now out of range, or the empty state if no rows are left. */
  function restoreFocusAfterRemoval(index: number, rowCount: number) {
    if (rowCount === 0) {
      emptyState.focus();
      return;
    }
    const clamped = Math.min(index, rowCount - 1);
    const row = rowsList.children[clamped];
    row?.querySelector<HTMLButtonElement>('[data-saved-row-remove]')?.focus();
  }

  async function render() {
    const focusIndex = pendingFocusIndex;
    pendingFocusIndex = null;

    const bookmarks = store.get().bookmarks;
    if (bookmarks.length === 0) {
      showEmpty();
      if (focusIndex !== null) restoreFocusAfterRemoval(focusIndex, 0);
      return;
    }

    let lessons;
    try {
      lessons = await fetchLessonsIndex();
    } catch {
      // Keep the empty-state message visible rather than showing a broken list.
      showEmpty();
      return;
    }

    const byId = new Map(lessons.map((l) => [l.id, l]));
    rowsList.replaceChildren();

    // Some bookmarked ids can be missing from the lessons index (the lesson
    // was renamed/removed) — track how many rows actually render, not
    // `bookmarks.length`, so an all-missing bookmark list shows the empty
    // state instead of an empty white card.
    let appended = 0;
    for (const id of bookmarks) {
      const entry = byId.get(id);
      if (!entry) continue;
      const node = template.content.cloneNode(true) as DocumentFragment;
      const link = node.querySelector<HTMLAnchorElement>('[data-saved-row-link]')!;
      const title = node.querySelector<HTMLElement>('[data-saved-row-title]')!;
      const domain = node.querySelector<HTMLElement>('[data-saved-row-domain]')!;
      const removeButton = node.querySelector<HTMLButtonElement>('[data-saved-row-remove]')!;

      link.href = entry.url;
      title.textContent = entry.title;
      domain.textContent = entry.domainTitle;
      const rowIndex = appended;
      removeButton.addEventListener('click', () => {
        pendingFocusIndex = rowIndex;
        store.toggleBookmark(id);
      });

      rowsList.append(node);
      appended += 1;
    }

    if (appended === 0) {
      showEmpty();
    } else {
      emptyState.hidden = true;
      rowsList.hidden = false;
    }

    if (focusIndex !== null) restoreFocusAfterRemoval(focusIndex, appended);
  }

  return store.subscribe(() => {
    void render();
  });
}
