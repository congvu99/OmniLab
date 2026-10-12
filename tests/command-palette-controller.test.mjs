// Controller wiring against a hand-built fake DOM (no jsdom, see search-box-controller test).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCommandPalette, OPEN_PALETTE_EVENT } from '../src/lib/command-palette-controller.ts';

const docs = [
  { id: 'a/m/cache', title: 'Bộ nhớ đệm (Cache)', url: '/hoc/a/m/cache', domain: 'a', domainTitle: 'Kiến trúc', summary: 's', headings: 'Cache', text: 'bộ nhớ đệm cache' },
];
const lessons = [{ id: 'a/m/cache', title: 'Bộ nhớ đệm (Cache)', url: '/hoc/a/m/cache', domain: 'a', domainTitle: 'Kiến trúc', module: 'm', readingMinutes: 3 }];

function el(tag = 'div') {
  const listeners = {};
  const attrs = {};
  const self = {
    tagName: tag, hidden: false, textContent: '', dataset: {}, children: [], value: '', id: '', className: '',
    style: { setProperty() {} },
    setAttribute: (k, v) => { attrs[k] = String(v); },
    getAttribute: (k) => attrs[k] ?? null,
    removeAttribute: (k) => { delete attrs[k]; },
    addEventListener: (t, f) => { (listeners[t] ??= new Set()).add(f); },
    removeEventListener: (t, f) => listeners[t]?.delete(f),
    append(...n) { self.children.push(...n); },
    replaceChildren(...n) { self.children = n; },
    contains: () => true,
    focus: vi.fn(),
    closest(sel) { return sel === '[role="option"]' && attrs.role === 'option' ? self : null; },
    querySelectorAll() {
      const out = [];
      const walk = (n) => n.children?.forEach((c) => { if (c.getAttribute?.('aria-selected') === 'true') out.push(c); walk(c); });
      walk(self);
      return out;
    },
    querySelector(sel) {
      const id = sel.startsWith('#') ? sel.slice(1) : null;
      let found = null;
      const walk = (n) => n.children?.forEach((c) => { if (id && c.id === id) found = c; walk(c); });
      walk(self);
      return found;
    },
    _count: (t) => listeners[t]?.size ?? 0,
    _fire: (t, ev = {}) => listeners[t]?.forEach((f) => f({ target: self, ...ev })),
    _attrs: attrs,
  };
  return self;
}

let docListeners, root, parts, nav, palette;
function fireDoc(type, ev = {}) {
  docListeners[type]?.forEach((f) => f({ preventDefault() {}, ...ev }));
}
function buildRoot() {
  parts = { panel: el(), input: el('input'), list: el('ul'), status: el(), message: el(), count: el() };
  const map = {
    '[data-cmdk-panel]': parts.panel, '[data-cmdk-input]': parts.input, '[data-cmdk-list]': parts.list,
    '[data-cmdk-status]': parts.status, '[data-cmdk-message]': parts.message, '[data-cmdk-count]': parts.count,
  };
  root = el();
  root.hidden = true;
  root.querySelector = (s) => map[s] ?? null;
  return root;
}

beforeEach(() => {
  vi.useFakeTimers();
  docListeners = {};
  globalThis.requestAnimationFrame = (f) => f();
  globalThis.window = { location: { assign: vi.fn() } };
  globalThis.document = {
    activeElement: null,
    documentElement: { classList: { add: vi.fn(), remove: vi.fn() } },
    createElement: (t) => el(t),
    createTextNode: (text) => ({ textContent: text }),
    addEventListener: (t, f) => { (docListeners[t] ??= new Set()).add(f); },
    removeEventListener: (t, f) => docListeners[t]?.delete(f),
  };
  nav = vi.fn();
  palette = createCommandPalette({
    navigate: nav,
    fetchLessons: vi.fn(() => Promise.resolve(lessons)),
    fetchDocs: vi.fn(() => Promise.resolve(docs)),
    getContinueId: () => 'a/m/cache',
  });
  palette.bind(buildRoot());
});
afterEach(() => { palette.destroy(); vi.useRealTimers(); });

const text = (n) => (n.children?.length ? n.children.map(text).join('') : n.textContent);
const optionTitles = () => parts.list.children.filter((c) => c._attrs.role === 'option').map((c) => text(c.children[0]));

describe('command palette controller', () => {
  it('opens on Ctrl+K and on the custom event; plain k does not open', () => {
    fireDoc('keydown', { key: 'k' });
    expect(palette.isOpen()).toBe(false);
    fireDoc('keydown', { key: 'k', ctrlKey: true });
    expect(palette.isOpen()).toBe(true);
    expect(root.hidden).toBe(false);
    expect(parts.input._attrs['aria-expanded']).toBe('true');
    palette.close();
    fireDoc(OPEN_PALETTE_EVENT);
    expect(palette.isOpen()).toBe(true);
  });

  it('shows tabs immediately, then continue lesson after lessons load', async () => {
    palette.open();
    expect(optionTitles()).toEqual(['Học tiếp', 'Lĩnh vực', 'Tìm kiếm', 'Đã lưu', 'Tôi']);
    await vi.advanceTimersByTimeAsync(0);
    expect(optionTitles()[0]).toBe('Bộ nhớ đệm (Cache)');
    expect(parts.input._attrs['aria-activedescendant']).toBe('cmdk-opt-0');
  });

  it('searches accent-insensitively and navigates on Enter', async () => {
    palette.open();
    await vi.advanceTimersByTimeAsync(0);
    parts.input.value = 'bo nho dem';
    parts.input._fire('input');
    await vi.advanceTimersByTimeAsync(300);
    expect(optionTitles()).toEqual(['Bộ nhớ đệm (Cache)']);
    fireDoc('keydown', { key: 'Enter' });
    expect(nav).toHaveBeenCalledWith('/hoc/a/m/cache');
    expect(palette.isOpen()).toBe(false);
  });

  it('Enter typed before the debounce fires opens the fresh first result, not a stale row', async () => {
    palette.open();
    await vi.advanceTimersByTimeAsync(0);
    fireDoc('keydown', { key: 'ArrowDown' }); // stale list: a tab row is selected
    parts.input.value = 'cache';
    parts.input._fire('input');
    fireDoc('keydown', { key: 'Enter' }); // within the 120ms debounce
    await vi.advanceTimersByTimeAsync(0);
    expect(nav).toHaveBeenCalledTimes(1);
    expect(nav).toHaveBeenCalledWith('/hoc/a/m/cache');
    expect(palette.isOpen()).toBe(false);
  });

  it('shows empty message for no matches and closes on Escape', async () => {
    palette.open();
    parts.input.value = 'zzzqqq';
    parts.input._fire('input');
    await vi.advanceTimersByTimeAsync(300);
    expect(parts.message.hidden).toBe(false);
    fireDoc('keydown', { key: 'Escape' });
    expect(palette.isOpen()).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(root.hidden).toBe(true);
  });

  it('ArrowDown moves aria-activedescendant; backdrop click closes', () => {
    palette.open();
    fireDoc('keydown', { key: 'ArrowDown' });
    expect(parts.input._attrs['aria-activedescendant']).toBe('cmdk-opt-1');
    root._fire('click', { target: root });
    expect(palette.isOpen()).toBe(false);
  });

  it('rebinding replaces element listeners without duplicating document ones', () => {
    const before = docListeners.keydown.size;
    const oldInput = parts.input;
    palette.bind(buildRoot());
    expect(oldInput._count('input')).toBe(0);
    expect(parts.input._count('input')).toBe(1);
    expect(docListeners.keydown.size).toBe(before);
  });

  it('closes on astro:before-swap', () => {
    palette.open();
    fireDoc('astro:before-swap');
    expect(palette.isOpen()).toBe(false);
  });
});
