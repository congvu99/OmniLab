// Tests search-box-controller.ts's DOM wiring against a hand-built fake DOM
// (jsdom isn't installed — see vitest.config.ts/progress-store tests for the
// same convention). Mocks fetchSearchIndexDocs via vi.mock since it's the
// only external boundary (search-index.ts/search-highlight.ts are the real,
// already-unit-tested implementations).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixtureDocs = [
  {
    id: 'kien-truc/chu-de/cache',
    title: 'Bộ nhớ đệm (Cache)',
    url: '/hoc/kien-truc/chu-de/cache',
    domain: 'kien-truc',
    domainTitle: 'Kiến trúc hệ thống',
    summary: 'Bộ nhớ đệm giúp giảm tải cho hệ thống.',
    headings: 'Cache là gì',
    text: 'Bộ nhớ đệm cache giúp giảm tải.',
    domainAccent: '#4F46E5',
    domainAccentDark: '#A5B4FC',
  },
];

vi.mock('../src/lib/search-index-client.ts', () => ({
  fetchSearchIndexDocs: vi.fn(() => Promise.resolve(fixtureDocs)),
}));

// The controller's highlight rendering calls real document.createElement/
// createTextNode (see renderResultRow) — stub just those two (not a full
// jsdom, per this project's no-jsdom convention) so tests that actually
// produce a highlighted match don't crash with "document is not defined".
globalThis.document ??= {
  createElement: (tag) => ({ tagName: tag, textContent: '' }),
  createTextNode: (text) => ({ textContent: text }),
};

// Minimal fake DOM elements — just enough surface for the controller
// (hidden/textContent/dataset/append/replaceChildren/addEventListener).
function createFakeEl(tag = 'div') {
  const listeners = {};
  return {
    tagName: tag,
    hidden: false,
    textContent: '',
    dataset: {},
    href: '',
    children: [],
    style: {
      _props: {},
      setProperty(name, value) {
        this._props[name] = value;
      },
    },
    addEventListener(type, fn) {
      listeners[type] = fn;
    },
    removeEventListener(type) {
      delete listeners[type];
    },
    _fire(type, value) {
      this.textContent = value ?? this.textContent;
      listeners[type]?.();
    },
    querySelector() {
      return createFakeEl();
    },
    replaceChildren() {
      this.children = [];
    },
    append(...nodes) {
      this.children.push(...nodes);
    },
  };
}

function createFakeTemplateRow() {
  const link = createFakeEl('a');
  const title = createFakeEl('span');
  const domain = createFakeEl('span');
  const snippet = createFakeEl('span');
  const fragment = {
    querySelector(selector) {
      if (selector === '[data-search-result-link]') return link;
      if (selector === '[data-search-result-title]') return title;
      if (selector === '[data-search-result-domain]') return domain;
      if (selector === '[data-search-result-snippet]') return snippet;
      return null;
    },
  };
  return { fragment, link, title, domain, snippet };
}

describe('attachSearchBox', () => {
  let els;
  let input;
  let hint;
  let loading;
  let error;
  let empty;
  let resultsList;
  let template;
  let resultCount;
  let attachSearchBox;
  let rows;

  beforeEach(async () => {
    vi.resetModules();
    ({ attachSearchBox } = await import('../src/lib/search-box-controller.ts'));

    input = { value: '', addEventListener: vi.fn(), removeEventListener: vi.fn() };
    // Match the real server-rendered markup's initial [hidden] state (see
    // search-box.astro): only the hint is visible by default.
    hint = createFakeEl();
    loading = createFakeEl();
    loading.hidden = true;
    error = createFakeEl();
    error.hidden = true;
    empty = createFakeEl();
    empty.hidden = true;
    resultsList = createFakeEl('ul');
    resultsList.hidden = true;
    rows = [];
    template = {
      content: {
        cloneNode: () => {
          const row = createFakeTemplateRow();
          rows.push(row);
          return row.fragment;
        },
      },
    };
    resultCount = createFakeEl();
    els = { root: createFakeEl(), input, hint, loading, error, empty, resultsList, template, resultCount };

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows the hint (not loading) when the query is empty', () => {
    attachSearchBox(els);
    input.value = '';
    const onInput = input.addEventListener.mock.calls.find((c) => c[0] === 'input')[1];
    onInput();
    vi.advanceTimersByTime(200);
    expect(hint.hidden).toBe(false);
    expect(resultsList.hidden).toBe(true);
  });

  it('debounces: rapid keystrokes within 200ms only run one search, for the latest value', async () => {
    attachSearchBox(els);
    const onInput = input.addEventListener.mock.calls.find((c) => c[0] === 'input')[1];

    // Three keystrokes fired back-to-back (no time advance between them) —
    // each resets the debounce timer, so only the last should ever search.
    input.value = 'c';
    onInput();
    input.value = 'ca';
    onInput();
    input.value = 'cache';
    onInput();

    // The debounced setTimeout fires an *async* runSearch (awaits
    // fetchSearchIndexDocs' Promise) — the async timer-advance variant also
    // flushes those pending microtasks, unlike a bare advanceTimersByTime +
    // vi.waitFor (which needs *real* wall-clock time to retry and would
    // hang for a full second under fake timers).
    await vi.advanceTimersByTimeAsync(200);

    expect(resultsList.hidden).toBe(false);
    expect(rows).toHaveLength(1); // exactly one search ran, not three
    expect(rows[0].title.textContent).toBe('Bộ nhớ đệm (Cache)');
    expect(rows[0].link.href).toBe('/hoc/kien-truc/chu-de/cache');
    // One sr-only status announcement instead of aria-live on every row.
    expect(resultCount.textContent).toBe('1 kết quả');
  });

  it('sets the domain accent as CSS custom properties on the row (no hardcoded domain color map)', async () => {
    attachSearchBox(els);
    const onInput = input.addEventListener.mock.calls.find((c) => c[0] === 'input')[1];
    input.value = 'cache';
    onInput();
    await vi.advanceTimersByTimeAsync(200);

    expect(rows[0].link.style._props['--card-accent']).toBe('#4F46E5');
    expect(rows[0].link.style._props['--card-accent-dark']).toBe('#A5B4FC');
  });

  it('announces a failed index load and recovers via the retry button', async () => {
    const { fetchSearchIndexDocs } = await import('../src/lib/search-index-client.ts');
    fetchSearchIndexDocs.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    const retry = createFakeEl('button');
    input.focus = vi.fn();
    attachSearchBox({ ...els, retry });
    const onInput = input.addEventListener.mock.calls.find((c) => c[0] === 'input')[1];

    input.value = 'cache';
    onInput();
    await vi.advanceTimersByTimeAsync(200);
    expect(error.hidden).toBe(false);
    expect(resultCount.textContent).toBe('Không tải được dữ liệu tìm kiếm.');

    retry._fire('click');
    await vi.advanceTimersByTimeAsync(0);
    expect(input.focus).toHaveBeenCalled();
    expect(fetchSearchIndexDocs).toHaveBeenCalledTimes(2); // cached rejection was dropped
    expect(error.hidden).toBe(true);
    expect(resultsList.hidden).toBe(false);
    expect(resultCount.textContent).toBe('1 kết quả');
  });

  it('shows the empty state for a query with no results', async () => {
    attachSearchBox(els);
    const onInput = input.addEventListener.mock.calls.find((c) => c[0] === 'input')[1];
    input.value = 'zzzznomatch';
    onInput();
    await vi.advanceTimersByTimeAsync(200);
    expect(empty.hidden).toBe(false);
    expect(resultsList.hidden).toBe(true);
    expect(resultCount.textContent).toBe('0 kết quả');
  });

  it('cleanup() removes the input listener', () => {
    const cleanup = attachSearchBox(els);
    cleanup();
    expect(input.removeEventListener).toHaveBeenCalledWith('input', expect.any(Function));
  });
});

describe('attachSearchBox: domain filters, clear button, suggestions, count label', () => {
  let attachSearchBox;
  let input;
  let els;
  let rows;

  function chip(dataset) {
    const el = createFakeEl('button');
    el.dataset = dataset;
    el.attrs = {};
    el.setAttribute = (name, value) => {
      el.attrs[name] = value;
    };
    return el;
  }

  beforeEach(async () => {
    vi.resetModules();
    ({ attachSearchBox } = await import('../src/lib/search-box-controller.ts'));
    input = { value: '', addEventListener: vi.fn(), removeEventListener: vi.fn(), focus: vi.fn() };
    rows = [];
    const hidden = (value) => Object.assign(createFakeEl(), { hidden: value });
    els = {
      root: createFakeEl(),
      input,
      hint: hidden(false),
      loading: hidden(true),
      error: hidden(true),
      empty: hidden(true),
      resultsList: Object.assign(createFakeEl('ul'), { hidden: true }),
      template: {
        content: {
          cloneNode: () => {
            const row = createFakeTemplateRow();
            rows.push(row);
            return row.fragment;
          },
        },
      },
      resultCount: createFakeEl(),
      countLabel: createFakeEl(),
      clearButton: Object.assign(createFakeEl('button'), { hidden: true }),
      filters: [chip({ searchFilter: 'all' }), chip({ searchFilter: 'kien-truc' }), chip({ searchFilter: 'tai-chinh' })],
      suggestions: [chip({ searchSuggest: 'cache' })],
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const typeQuery = async (value) => {
    const onInput = input.addEventListener.mock.calls.find((c) => c[0] === 'input')[1];
    input.value = value;
    onInput();
    await vi.advanceTimersByTimeAsync(200);
  };

  it('shows the clear button only while the field has text and mirrors the count into the visible label', async () => {
    attachSearchBox(els);
    await typeQuery('cache');
    expect(els.clearButton.hidden).toBe(false);
    expect(els.countLabel.textContent).toBe('1 kết quả');
    await typeQuery('');
    expect(els.clearButton.hidden).toBe(true);
    expect(els.countLabel.textContent).toBe('');
    expect(els.hint.hidden).toBe(false);
  });

  it('a domain chip narrows the fetched results without re-searching, and "all" restores them', async () => {
    attachSearchBox(els);
    await typeQuery('cache');
    const [all, arch, fin] = els.filters;

    fin._fire('click');
    expect(fin.attrs['aria-pressed']).toBe('true');
    expect(all.attrs['aria-pressed']).toBe('false');
    expect(els.empty.hidden).toBe(false);
    expect(els.resultsList.hidden).toBe(true);
    expect(els.resultCount.textContent).toBe('0 kết quả');

    arch._fire('click');
    expect(els.empty.hidden).toBe(true);
    expect(els.resultsList.hidden).toBe(false);
    expect(els.countLabel.textContent).toBe('1 kết quả');

    all._fire('click');
    expect(els.resultsList.hidden).toBe(false);
  });

  it('a suggestion chip fills the field and searches immediately (no debounce)', async () => {
    attachSearchBox(els);
    els.suggestions[0]._fire('click');
    await vi.advanceTimersByTimeAsync(0);
    expect(input.value).toBe('cache');
    expect(input.focus).toHaveBeenCalled();
    expect(els.resultsList.hidden).toBe(false);
    expect(rows).toHaveLength(1);
  });

  it('the clear button empties the field, restores the hint and refocuses the input', async () => {
    attachSearchBox(els);
    await typeQuery('cache');
    els.clearButton._fire('click');
    await vi.advanceTimersByTimeAsync(0);
    expect(input.value).toBe('');
    expect(els.clearButton.hidden).toBe(true);
    expect(els.hint.hidden).toBe(false);
    expect(els.resultsList.hidden).toBe(true);
    expect(input.focus).toHaveBeenCalled();
  });

  it('cleanup() also detaches chip handlers', () => {
    const cleanup = attachSearchBox(els);
    const removed = vi.fn();
    els.filters[0].removeEventListener = removed;
    cleanup();
    expect(removed).toHaveBeenCalledWith('click', expect.any(Function));
  });
});
