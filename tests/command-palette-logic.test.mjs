import { describe, expect, it } from 'vitest';
import {
  MAX_RESULTS,
  buildQueryItems,
  buildQuickActions,
  filterActions,
  isToggleShortcut,
  moveSelection,
  reduceKey,
} from '../src/lib/command-palette-logic.ts';

const lessons = [
  { id: 'a/m/x', title: 'Bộ nhớ đệm', url: '/hoc/a/m/x', domain: 'kien-truc', domainTitle: 'Kiến trúc hệ thống', module: 'm', readingMinutes: 7 },
  { id: 'a/m/y', title: 'Cân bằng tải', url: '/hoc/a/m/y', domain: 'kien-truc', domainTitle: 'Kiến trúc hệ thống', module: 'm', readingMinutes: 5 },
  { id: 'b/m/z', title: 'Lãi suất', url: '/hoc/b/m/z', domain: 'tai-chinh', domainTitle: 'Tài chính', module: 'm', readingMinutes: 4 },
];

describe('quick actions', () => {
  it('lists continue lesson, 5 tabs, then distinct domains with counts', () => {
    const items = buildQuickActions(lessons, 'a/m/y');
    expect(items.map((i) => i.group)).toEqual(['Tiếp tục', 'Điều hướng', 'Điều hướng', 'Điều hướng', 'Điều hướng', 'Điều hướng', 'Lĩnh vực', 'Lĩnh vực']);
    expect(items[0]).toMatchObject({ title: 'Cân bằng tải', url: '/hoc/a/m/y', meta: 'Kiến trúc hệ thống · 5′' });
    const domains = items.filter((i) => i.group === 'Lĩnh vực');
    expect(domains[0]).toMatchObject({ url: '/linh-vuc/kien-truc', meta: '2 bài' });
  });
  it('skips continue when id is null or unknown; tabs still present before lessons load', () => {
    expect(buildQuickActions(lessons, null).some((i) => i.group === 'Tiếp tục')).toBe(false);
    expect(buildQuickActions(lessons, 'zzz').some((i) => i.group === 'Tiếp tục')).toBe(false);
    expect(buildQuickActions([], null)).toHaveLength(5);
  });
  it('filters accent-insensitively', () => {
    const items = buildQuickActions(lessons, null);
    expect(filterActions(items, 'hoc tiep').map((i) => i.title)).toEqual(['Học tiếp']);
    expect(filterActions(items, 'kien truc').map((i) => i.url)).toEqual(['/linh-vuc/kien-truc']);
    expect(filterActions(items, '  ')).toHaveLength(items.length);
  });
});

describe('buildQueryItems', () => {
  const result = (n) => ({ id: `l/${n}`, title: `Bài ${n}`, url: `/hoc/l/${n}`, domain: 'd', domainTitle: 'D', summary: '', terms: ['bai'] });
  const actions = buildQuickActions(lessons, 'a/m/x');
  it('puts matching nav before lessons and caps total', () => {
    const results = Array.from({ length: 20 }, (_, i) => result(i));
    const out = buildQueryItems(actions, results, 'tim kiem');
    expect(out[0].title).toBe('Tìm kiếm');
    expect(out).toHaveLength(MAX_RESULTS);
    expect(out[1].group).toBe('Bài học');
  });
  it('excludes continue item and preserves result order', () => {
    const out = buildQueryItems(actions, [result(2), result(1)], 'zzzz');
    expect(out.map((i) => i.key)).toEqual(['lesson:l/2', 'lesson:l/1']);
  });
  it('carries accent and terms for highlighting', () => {
    const out = buildQueryItems([], [{ ...result(1), domainAccent: '#fff', domainAccentDark: '#000' }], 'x');
    expect(out[0]).toMatchObject({ accent: '#fff', accentDark: '#000', terms: ['bai'] });
  });
});

describe('keyboard state machine', () => {
  const s = (o = {}) => ({ open: true, selected: 0, count: 3, ...o });
  it('wraps selection', () => {
    expect(moveSelection(2, 1, 3)).toBe(0);
    expect(moveSelection(0, -1, 3)).toBe(2);
    expect(moveSelection(0, 1, 0)).toBe(0);
  });
  it('toggles on meta/ctrl+k only', () => {
    expect(isToggleShortcut({ key: 'k', metaKey: true })).toBe(true);
    expect(isToggleShortcut({ key: 'K', ctrlKey: true })).toBe(true);
    expect(isToggleShortcut({ key: 'k' })).toBe(false);
    expect(isToggleShortcut({ key: 'k', ctrlKey: true, shiftKey: true })).toBe(false);
    expect(reduceKey(s({ open: false }), { key: 'k', ctrlKey: true }).action).toBe('open');
    expect(reduceKey(s(), { key: 'k', metaKey: true }).action).toBe('close');
  });
  it('plain k and other keys do nothing when closed', () => {
    for (const key of ['k', 'ArrowDown', 'Enter', 'Escape']) {
      const r = reduceKey(s({ open: false }), { key });
      expect(r.action).toBe('none');
      expect(r.preventDefault).toBe(false);
    }
  });
  it('arrows, home/end, enter, escape when open', () => {
    expect(reduceKey(s(), { key: 'ArrowDown' }).state.selected).toBe(1);
    expect(reduceKey(s(), { key: 'ArrowUp' }).state.selected).toBe(2);
    expect(reduceKey(s({ selected: 1 }), { key: 'End' }).state.selected).toBe(2);
    expect(reduceKey(s({ selected: 1 }), { key: 'Home' }).state.selected).toBe(0);
    expect(reduceKey(s(), { key: 'Enter' }).action).toBe('activate');
    expect(reduceKey(s({ count: 0 }), { key: 'Enter' }).action).toBe('none');
    expect(reduceKey(s(), { key: 'Escape' })).toMatchObject({ action: 'close', state: { open: false } });
  });
  it('ignores keys during IME composition', () => {
    expect(reduceKey(s(), { key: 'Enter', isComposing: true }).action).toBe('none');
  });
});
