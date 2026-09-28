// Tests for src/lib/saved-list-controller.ts against a hand-built fake DOM
// (no jsdom — same convention as search-box-controller tests) and the real
// createProgressStore (in-memory storage double, like progress-store.test.mjs)
// so removal actually mutates real store state. Covers two regressions:
// focus lost on remove, and an all-bookmarks-missing list showing a blank
// card instead of the empty state.
import { describe, expect, it } from 'vitest';
import { createProgressStore } from '../src/lib/progress-store.ts';
import { attachSavedList, readSavedListElements } from '../src/lib/saved-list-controller.ts';

function createFakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}

function createFakeButton() {
  const listeners = {};
  return {
    tagName: 'BUTTON',
    addEventListener(type, fn) {
      listeners[type] = fn;
    },
    click() {
      listeners.click?.();
    },
    focus() {
      this._focused = true;
    },
    _focused: false,
  };
}

function createFakeRow(id) {
  const link = { href: '' };
  const title = { textContent: '' };
  const domain = { textContent: '' };
  const removeButton = createFakeButton();
  const row = {
    id,
    querySelector(selector) {
      if (selector === '[data-saved-row-link]') return link;
      if (selector === '[data-saved-row-title]') return title;
      if (selector === '[data-saved-row-domain]') return domain;
      if (selector === '[data-saved-row-remove]') return removeButton;
      return null;
    },
  };
  return { row, link, title, domain, removeButton };
}

function createFakeRowsList() {
  const children = [];
  return {
    children,
    hidden: true,
    replaceChildren() {
      children.length = 0;
    },
    append(row) {
      children.push(row);
    },
  };
}

function createFakeEmptyState() {
  return { hidden: true, focus() { this._focused = true; }, _focused: false };
}

/** Builds a template that hands out a fresh row + lets the test inspect each one, in append order. */
function createTrackedTemplate() {
  const built = [];
  return {
    template: {
      content: {
        cloneNode: () => {
          const row = createFakeRow();
          built.push(row);
          return row.row;
        },
      },
    },
    built,
  };
}

function setup({ bookmarks = [], lessons = [] } = {}) {
  const store = createProgressStore({ storage: createFakeStorage() });
  for (const id of bookmarks) store.toggleBookmark(id);

  const emptyState = createFakeEmptyState();
  const rowsList = createFakeRowsList();
  const { template, built } = createTrackedTemplate();
  const els = { root: {}, emptyState, rowsList, template };

  const fetchLessonsIndex = () => Promise.resolve(lessons);
  const cleanup = attachSavedList(els, store, fetchLessonsIndex);

  return { store, emptyState, rowsList, built, cleanup };
}

async function flush() {
  // Let the controller's async render() (awaiting the injected
  // fetchLessonsIndex promise) resolve.
  await Promise.resolve();
  await Promise.resolve();
}

describe('readSavedListElements', () => {
  it('returns null when a required element is missing', () => {
    const root = { querySelector: () => null };
    expect(readSavedListElements(root)).toBeNull();
  });

  it('returns the elements when the DOM contract is satisfied', () => {
    const emptyState = {};
    const rowsList = {};
    const template = {};
    const root = {
      querySelector(sel) {
        if (sel === '[data-saved-empty]') return emptyState;
        if (sel === '[data-saved-rows]') return rowsList;
        if (sel === '[data-saved-row-template]') return template;
        return null;
      },
    };
    expect(readSavedListElements(root)).toEqual({ root, emptyState, rowsList, template });
  });
});

describe('attachSavedList: empty/basic rendering', () => {
  it('shows the empty state when there are no bookmarks', async () => {
    const { emptyState, rowsList } = setup({ bookmarks: [] });
    await flush();
    expect(emptyState.hidden).toBe(false);
    expect(rowsList.hidden).toBe(true);
  });

  it('renders one row per bookmark found in the lessons index', async () => {
    const { rowsList, built } = setup({
      bookmarks: ['a/b/c'],
      lessons: [{ id: 'a/b/c', url: '/hoc/a/b/c', title: 'Bài A', domainTitle: 'Domain A' }],
    });
    await flush();
    expect(rowsList.children).toHaveLength(1);
    expect(built[0].link.href).toBe('/hoc/a/b/c');
    expect(built[0].title.textContent).toBe('Bài A');
  });

  it('shows the empty state (not a blank card) when every bookmarked id is missing from the lessons index', async () => {
    const { emptyState, rowsList } = setup({
      bookmarks: ['deleted/a', 'deleted/b'],
      lessons: [{ id: 'still/here', url: '/x', title: 'X', domainTitle: 'D' }],
    });
    await flush();
    expect(rowsList.children).toHaveLength(0);
    expect(emptyState.hidden).toBe(false);
    expect(rowsList.hidden).toBe(true);
  });
});

describe('attachSavedList: focus after removal', () => {
  const lessons = [
    { id: 'a', url: '/a', title: 'A', domainTitle: 'D' },
    { id: 'b', url: '/b', title: 'B', domainTitle: 'D' },
    { id: 'c', url: '/c', title: 'C', domainTitle: 'D' },
  ];

  it('moves focus to the next row (which shifts into the removed row\'s position)', async () => {
    const { built } = setup({ bookmarks: ['a', 'b', 'c'], lessons });
    await flush();

    built[0].removeButton.click(); // remove "a" (index 0)
    await flush();

    expect(built).toHaveLength(5); // 3 initial + 2 re-rendered (b, c remain)
    const secondRenderRows = built.slice(3);
    expect(secondRenderRows).toHaveLength(2);
    // "b" now occupies index 0 — its remove button should be focused.
    expect(secondRenderRows[0].removeButton._focused).toBe(true);
    expect(secondRenderRows[1].removeButton._focused).toBe(false);
  });

  it('moves focus to the new last row when the last row was removed', async () => {
    const { built } = setup({ bookmarks: ['a', 'b', 'c'], lessons });
    await flush();

    built[2].removeButton.click(); // remove "c" (last, index 2)
    await flush();

    const secondRenderRows = built.slice(3);
    expect(secondRenderRows).toHaveLength(2);
    expect(secondRenderRows[0].removeButton._focused).toBe(false);
    expect(secondRenderRows[1].removeButton._focused).toBe(true); // clamped to the new last index
  });

  it('moves focus to the empty state when the only bookmark is removed', async () => {
    const { built, emptyState } = setup({ bookmarks: ['a'], lessons });
    await flush();

    built[0].removeButton.click();
    await flush();

    expect(emptyState._focused).toBe(true);
  });

  it('does not steal focus on an unrelated store change (not a removal)', async () => {
    const { store, built } = setup({ bookmarks: ['a', 'b'], lessons });
    await flush();

    store.markDone('some/other/lesson', true); // unrelated mutation -> re-render
    await flush();

    const secondRenderRows = built.slice(2);
    expect(secondRenderRows.every((r) => !r.removeButton._focused)).toBe(true);
  });
});

describe('attachSavedList: cleanup', () => {
  it('the returned cleanup function unsubscribes from the store', async () => {
    const { store, cleanup, rowsList } = setup({
      bookmarks: ['a'],
      lessons: [{ id: 'a', url: '/a', title: 'A', domainTitle: 'D' }],
    });
    await flush();
    expect(rowsList.children).toHaveLength(1);

    cleanup();
    rowsList.children.length = 0; // simulate the row surviving until next mutation
    store.toggleBookmark('b'); // would normally trigger a re-render
    await flush();
    expect(rowsList.children).toHaveLength(0); // render() never ran again
  });
});
