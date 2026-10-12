/**
 * DOM controller for the ⌘K command palette (markup + styles live in
 * src/components/command-palette/command-palette.astro). All side-effecting
 * boundaries (navigate, fetches, progress store) are injected via
 * `PaletteDeps`, so the controller is testable without Astro virtual modules.
 *
 * Lifecycle (ClientRouter-safe): `createCommandPalette` registers the
 * document-level listeners (keydown, focusin, open event, before-swap)
 * exactly once; `bind(root)` is called on every `astro:page-load` with the
 * (possibly new) DOM and swaps the element-level listeners. Index/lessons
 * data are fetched lazily on the first open and cached for the session.
 */
import type MiniSearch from 'minisearch';
import { buildSearchIndex, searchLessons, type SearchDoc } from './search-index';
import { buildHighlightSegments } from './search-highlight';
import type { LessonIndexEntry } from './lessons-index-client';
import {
  MAX_RESULTS,
  buildQueryItems,
  buildQuickActions,
  reduceKey,
  type PaletteItem,
} from './command-palette-logic';

export const OPEN_PALETTE_EVENT = 'omnilab:open-palette';
const DEBOUNCE_MS = 120;
const CLOSE_MS = 150;

export interface PaletteDeps {
  navigate(url: string): void | Promise<void>;
  fetchLessons(): Promise<LessonIndexEntry[]>;
  fetchDocs(): Promise<SearchDoc[]>;
  /** Read-only: most recent unfinished lesson among `knownIds`, or null. */
  getContinueId(knownIds: ReadonlySet<string>): string | null;
}

interface Els {
  root: HTMLElement;
  panel: HTMLElement;
  input: HTMLInputElement;
  list: HTMLElement;
  status: HTMLElement;
  message: HTMLElement;
  count: HTMLElement;
}

export function readPaletteElements(root: HTMLElement): Els | null {
  const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s);
  const panel = q('[data-cmdk-panel]');
  const input = q<HTMLInputElement>('[data-cmdk-input]');
  const list = q('[data-cmdk-list]');
  const status = q('[data-cmdk-status]');
  const message = q('[data-cmdk-message]');
  const count = q('[data-cmdk-count]');
  if (!panel || !input || !list || !status || !message || !count) return null;
  return { root, panel, input, list, status, message, count };
}

export function createCommandPalette(deps: PaletteDeps) {
  let els: Els | null = null;
  let unbindEls: (() => void) | null = null;
  let isOpen = false;
  let items: PaletteItem[] = [];
  let selected = 0;
  let lastFocus: HTMLElement | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let debounce: ReturnType<typeof setTimeout> | undefined;
  /** True between an input event and its debounced query run. */
  let queryPending = false;
  let requestId = 0;

  let lessons: LessonIndexEntry[] = [];
  let continueId: string | null = null;
  let lessonsPromise: Promise<void> | null = null;
  let index: MiniSearch<SearchDoc> | null = null;
  let indexPromise: Promise<void> | null = null;

  function ensureLessons(): Promise<void> {
    lessonsPromise ??= deps
      .fetchLessons()
      .then((l) => {
        lessons = l;
      })
      .catch(() => {
        lessonsPromise = null; // allow retry on next open; quick actions still show tabs
      });
    return lessonsPromise;
  }

  function ensureIndex(): Promise<void> {
    indexPromise ??= deps.fetchDocs().then(
      (docs) => {
        index = buildSearchIndex(docs);
      },
      (err) => {
        indexPromise = null;
        throw err;
      },
    );
    return indexPromise;
  }

  /* ---------------- rendering ---------------- */

  function optionId(i: number) {
    return `cmdk-opt-${i}`;
  }

  function renderRow(item: PaletteItem, i: number, query: string): HTMLElement {
    const li = document.createElement('li');
    li.id = optionId(i);
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.dataset.i = String(i);
    li.className = 'cmdk-it';
    if (item.accent) li.style.setProperty('--cmdk-accent', item.accent);
    if (item.accentDark) li.style.setProperty('--cmdk-accent-dark', item.accentDark);

    const title = document.createElement('b');
    if (query && item.terms) {
      for (const seg of buildHighlightSegments(item.title, item.terms)) {
        if (seg.match) {
          const mark = document.createElement('mark');
          mark.textContent = seg.text;
          title.append(mark);
        } else title.append(document.createTextNode(seg.text));
      }
    } else title.textContent = item.title;

    const meta = document.createElement('span');
    meta.className = 'cmdk-meta';
    meta.textContent = item.meta;
    li.append(title, meta);
    return li;
  }

  function renderItems(next: PaletteItem[], query: string, msg = '') {
    if (!els) return;
    items = next;
    selected = 0;
    const rows: HTMLElement[] = [];
    let lastGroup = '';
    next.forEach((item, i) => {
      if (item.group !== lastGroup) {
        lastGroup = item.group;
        const gh = document.createElement('li');
        gh.setAttribute('role', 'presentation');
        gh.className = 'cmdk-gh';
        gh.textContent = item.group;
        rows.push(gh);
      }
      rows.push(renderRow(item, i, query));
    });
    els.list.replaceChildren(...rows);
    els.message.textContent = msg;
    els.message.hidden = !msg;
    els.count.textContent = next.length ? `${next.length} mục` : '';
    els.status.textContent = msg || (query ? `${next.length} kết quả` : '');
    applySelection(true);
  }

  function applySelection(scroll: boolean) {
    if (!els) return;
    els.list.querySelectorAll('[aria-selected="true"]').forEach((n) => n.setAttribute('aria-selected', 'false'));
    const el = items.length ? els.list.querySelector<HTMLElement>(`#${optionId(selected)}`) : null;
    if (el) {
      el.setAttribute('aria-selected', 'true');
      els.input.setAttribute('aria-activedescendant', el.id);
      if (scroll) el.scrollIntoView?.({ block: 'nearest' });
    } else els.input.removeAttribute('aria-activedescendant');
  }

  function renderQuick() {
    renderItems(buildQuickActions(lessons, continueId), '');
  }

  /* ---------------- search ---------------- */

  async function runQuery() {
    queryPending = false;
    if (!els) return;
    const query = els.input.value.trim();
    const mine = ++requestId;
    if (!query) return renderQuick();
    try {
      await ensureIndex();
      if (mine !== requestId || !index || !els) return;
      const results = searchLessons(index, query, MAX_RESULTS);
      const next = buildQueryItems(buildQuickActions(lessons, null), results, query);
      renderItems(next, query, next.length ? '' : `Không có kết quả cho “${query}”`);
    } catch {
      if (mine !== requestId || !els) return;
      renderItems([], query, 'Không tải được dữ liệu tìm kiếm.');
    }
  }

  function onInput() {
    clearTimeout(debounce);
    queryPending = true;
    debounce = setTimeout(() => void runQuery(), DEBOUNCE_MS);
  }

  /* ---------------- open / close ---------------- */

  function open() {
    if (isOpen || !els) return;
    isOpen = true;
    clearTimeout(closeTimer);
    lastFocus = (document.activeElement as HTMLElement | null) ?? null;
    const { root, input } = els;
    input.value = '';
    root.hidden = false;
    document.documentElement.classList.add('cmdk-lock');
    input.setAttribute('aria-expanded', 'true');
    renderQuick(); // tabs immediately; lessons/continue fill in below
    requestAnimationFrame(() => {
      if (isOpen) root.setAttribute('data-state', 'open');
    });
    input.focus({ preventScroll: true });
    void ensureLessons().then(() => {
      if (!isOpen || !els) return;
      continueId = deps.getContinueId(new Set(lessons.map((l) => l.id)));
      if (!els.input.value.trim()) renderQuick();
    });
  }

  function close(restoreFocus = true) {
    if (!isOpen || !els) return;
    isOpen = false;
    clearTimeout(debounce);
    queryPending = false;
    requestId++;
    const e = els;
    e.root.removeAttribute('data-state');
    e.input.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('cmdk-lock');
    closeTimer = setTimeout(() => {
      e.root.hidden = true;
    }, CLOSE_MS);
    if (restoreFocus && lastFocus?.isConnected !== false) lastFocus?.focus({ preventScroll: true });
    lastFocus = null;
  }

  function activate(i: number) {
    const item = items[i];
    if (!item) return;
    close(false);
    void Promise.resolve(deps.navigate(item.url)).catch(() => {
      window.location.assign(item.url); // soft navigation failed: fall back to a hard one
    });
  }

  /* ---------------- events ---------------- */

  /** Enter typed before the debounce fired: run the query now, then open its
   *  first row (otherwise Enter would open a row of the stale list). */
  function flushAndActivate() {
    clearTimeout(debounce);
    const mine = requestId + 1; // the id runQuery() is about to take
    void runQuery().then(() => {
      if (isOpen && requestId === mine && items.length) activate(selected);
    });
  }

  function onDocKeydown(e: KeyboardEvent) {
    if (isOpen && queryPending && e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      flushAndActivate();
      return;
    }
    const r = reduceKey({ open: isOpen, selected, count: items.length }, e);
    if (r.action === 'none') {
      if (isOpen && e.key === 'Tab') e.preventDefault(); // focus trap: the input is the only tab stop
      return;
    }
    if (r.preventDefault) e.preventDefault();
    if (r.action === 'open') open();
    else if (r.action === 'close') close();
    else if (r.action === 'move') {
      selected = r.state.selected;
      applySelection(true);
    } else if (r.action === 'activate') activate(selected);
  }

  const onDocFocusIn = (ev: Event) => {
    if (isOpen && els && !els.panel.contains(ev.target as Node)) els.input.focus({ preventScroll: true });
  };
  const onOpenEvent = () => open();
  const onBeforeSwap = () => close(false);

  function optionIndex(target: EventTarget | null): number {
    const li = (target as HTMLElement | null)?.closest?.<HTMLElement>('[role="option"]');
    return li ? Number(li.dataset.i) : -1;
  }

  function bind(root: HTMLElement | null) {
    unbindEls?.();
    unbindEls = null;
    if (isOpen) close(false);
    clearTimeout(closeTimer);
    els = root ? readPaletteElements(root) : null;
    if (!els) return;
    const e = els;
    const onBackdrop = (ev: Event) => {
      if (ev.target === e.root) close();
    };
    const onMove = (ev: Event) => {
      const i = optionIndex(ev.target);
      if (i >= 0 && i !== selected) {
        selected = i;
        applySelection(false);
      }
    };
    const onDown = (ev: Event) => {
      if (optionIndex(ev.target) >= 0) ev.preventDefault(); // keep input focus
    };
    const onClick = (ev: Event) => {
      const i = optionIndex(ev.target);
      if (i >= 0) activate(i);
    };
    e.input.addEventListener('input', onInput);
    e.root.addEventListener('click', onBackdrop);
    e.list.addEventListener('mousemove', onMove);
    e.list.addEventListener('mousedown', onDown);
    e.list.addEventListener('click', onClick);
    unbindEls = () => {
      e.input.removeEventListener('input', onInput);
      e.root.removeEventListener('click', onBackdrop);
      e.list.removeEventListener('mousemove', onMove);
      e.list.removeEventListener('mousedown', onDown);
      e.list.removeEventListener('click', onClick);
    };
  }

  document.addEventListener('keydown', onDocKeydown);
  document.addEventListener('focusin', onDocFocusIn);
  document.addEventListener(OPEN_PALETTE_EVENT, onOpenEvent);
  document.addEventListener('astro:before-swap', onBeforeSwap);

  return {
    bind,
    open,
    close,
    isOpen: () => isOpen,
    destroy() {
      unbindEls?.();
      document.removeEventListener('keydown', onDocKeydown);
      document.removeEventListener('focusin', onDocFocusIn);
      document.removeEventListener(OPEN_PALETTE_EVENT, onOpenEvent);
      document.removeEventListener('astro:before-swap', onBeforeSwap);
      clearTimeout(debounce);
      clearTimeout(closeTimer);
    },
  };
}
