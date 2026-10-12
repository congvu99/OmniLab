import { describe, expect, it } from 'vitest';
import { domainProgress, learningStats, upNextLessons } from '../src/lib/domain-progress.ts';
import { applyHue, parseDomainMeta, serializeDomainMeta } from '../src/lib/domain-meta.ts';
import { formatTodayVi } from '../src/lib/format-today-vi.ts';

const lessons = [
  { id: 'a/m/1', domain: 'a', readingMinutes: 3 },
  { id: 'a/m/2', domain: 'a', readingMinutes: 5 },
  { id: 'a/m/3', domain: 'a', readingMinutes: 7 },
  { id: 'a/m/4', domain: 'a', readingMinutes: 2 },
  { id: 'b/m/1', domain: 'b', readingMinutes: 4 },
];
const state = (lessonsMap, bookmarks = []) => ({ v: 1, lessons: lessonsMap, bookmarks });

describe('domainProgress', () => {
  it('counts done lessons of one domain only', () => {
    const s = state({ 'a/m/1': { done: true }, 'a/m/2': { done: false }, 'b/m/1': { done: true } });
    expect(domainProgress(s, lessons, 'a')).toEqual({ done: 1, total: 4, percent: 25 });
    expect(domainProgress(s, lessons, 'b')).toEqual({ done: 1, total: 1, percent: 100 });
  });
  it('is 0% for an empty or unknown domain', () => {
    expect(domainProgress(state({}), lessons, 'zzz')).toEqual({ done: 0, total: 0, percent: 0 });
  });
});

describe('learningStats', () => {
  it('sums done lessons, minutes and resolvable bookmarks', () => {
    const s = state({ 'a/m/1': { done: true }, 'a/m/3': { done: true } }, ['a/m/2', 'gone/x/y']);
    expect(learningStats(s, lessons)).toEqual({ done: 2, total: 5, saved: 1, minutesRead: 10 });
  });
  it('is all zero for a fresh state', () => {
    expect(learningStats(state({}), lessons)).toEqual({ done: 0, total: 5, saved: 0, minutesRead: 0 });
  });
});

describe('upNextLessons', () => {
  it('returns following unfinished lessons of the same domain', () => {
    const s = state({ 'a/m/3': { done: true } });
    expect(upNextLessons(s, lessons, 'a/m/1', 3).map((l) => l.id)).toEqual(['a/m/2', 'a/m/4']);
  });
  it('is empty for unknown id or last lesson', () => {
    expect(upNextLessons(state({}), lessons, 'nope', 3)).toEqual([]);
    expect(upNextLessons(state({}), lessons, 'a/m/4', 3)).toEqual([]);
  });
  it('respects count', () => {
    expect(upNextLessons(state({}), lessons, 'a/m/1', 1)).toHaveLength(1);
  });
});

describe('domain meta', () => {
  it('round-trips and validates colors', () => {
    const raw = serializeDomainMeta([
      { id: 'a', title: 'A', accent: '#4B45D1', accentDark: '#9B9BFF', modules: { m: 'Module' } },
    ]);
    expect(parseDomainMeta(raw)).toEqual([
      { id: 'a', title: 'A', accent: '#4B45D1', accentDark: '#9B9BFF', modules: { m: 'Module' } },
    ]);
    const bad = JSON.stringify([{ id: 'a', title: 'A', accent: 'red;x', modules: { m: 1 } }, 5, { id: 1 }]);
    expect(parseDomainMeta(bad)).toEqual([{ id: 'a', title: 'A', accent: '', accentDark: '', modules: {} }]);
  });
  it('never throws on garbage', () => {
    expect(parseDomainMeta('{oops')).toEqual([]);
    expect(parseDomainMeta('{}')).toEqual([]);
    expect(parseDomainMeta(undefined)).toEqual([]);
  });
  it('applyHue sets both properties only for a valid accent', () => {
    const props = {};
    const el = { style: { setProperty: (k, v) => (props[k] = v) } };
    applyHue(el, { id: 'a', title: 'A', accent: '#111111', accentDark: '', modules: {} });
    expect(props).toEqual({ '--hue-l': '#111111', '--hue-d': '#111111' });
    const none = {};
    applyHue({ style: { setProperty: (k, v) => (none[k] = v) } }, undefined);
    expect(none).toEqual({});
  });
});

describe('formatTodayVi', () => {
  it('formats weekday and dd.mm', () => {
    expect(formatTodayVi(new Date(2026, 9, 12))).toBe('Thứ Hai · 12.10');
    expect(formatTodayVi(new Date(2026, 0, 4))).toBe('Chủ nhật · 04.01');
  });
});
