import { describe, expect, it } from 'vitest';
import { applyProgressRing } from '../src/lib/progress-ring-apply.ts';

/** Minimal fake matching RingElementLike/RingCircleLike/RingTextLike — no jsdom needed. */
function createFakeRing(domain, { hasFraction = false } = {}) {
  const fill = { attrs: { r: '14' }, getAttribute(n) { return this.attrs[n] ?? null; }, style: { strokeDasharray: '', strokeDashoffset: '' } };
  const text = { textContent: '' };
  const fraction = hasFraction ? { textContent: '' } : null;
  const attrs = {};
  return {
    dataset: { domain },
    setAttribute(name, value) { attrs[name] = value; },
    getAttribute(name) { return attrs[name] ?? null; },
    querySelector(selector) {
      if (selector === '[data-progress-ring-fill]') return fill;
      if (selector === '[data-progress-ring-text]') return text;
      if (selector === '[data-progress-ring-fraction]') return fraction;
      return null;
    },
    _fill: fill,
    _text: text,
    _fraction: fraction,
  };
}

const lessons = [
  { id: 'kien-truc/a/1', domain: 'kien-truc' },
  { id: 'kien-truc/a/2', domain: 'kien-truc' },
  { id: 'kien-truc/a/3', domain: 'kien-truc' },
  { id: 'tai-chinh/a/1', domain: 'tai-chinh' },
];

describe('applyProgressRing', () => {
  it('computes percent/fraction and sets stroke-dashoffset for a partially-done domain', () => {
    const ring = createFakeRing('kien-truc', { hasFraction: true });
    const state = { v: 1, lessons: { 'kien-truc/a/1': { done: true } }, bookmarks: [] };

    applyProgressRing(ring, state, lessons);

    expect(ring._text.textContent).toBe('33%'); // 1/3 rounded
    expect(ring._fraction.textContent).toBe('1/3 bài');
    expect(ring.getAttribute('aria-label')).toBe('Đã hoàn thành 1 trên 3 bài — 33 phần trăm');

    const circumference = 2 * Math.PI * 14;
    expect(ring._fill.style.strokeDasharray).toBe(String(circumference));
    expect(ring._fill.style.strokeDashoffset).toBe(String(circumference * (1 - 1 / 3)));
  });

  it('only counts lessons belonging to the ring\'s own domain', () => {
    const ring = createFakeRing('tai-chinh', { hasFraction: true });
    const state = { v: 1, lessons: { 'kien-truc/a/1': { done: true }, 'kien-truc/a/2': { done: true } }, bookmarks: [] };

    applyProgressRing(ring, state, lessons);
    expect(ring._text.textContent).toBe('0%');
    expect(ring._fraction.textContent).toBe('0/1 bài');
  });

  it('shows 0% (not NaN/Infinity) when a domain has zero lessons in the index', () => {
    const ring = createFakeRing('unknown-domain', { hasFraction: true });
    applyProgressRing(ring, { v: 1, lessons: {}, bookmarks: [] }, lessons);
    expect(ring._text.textContent).toBe('0%');
    expect(ring._fraction.textContent).toBe('0/0 bài');
  });

  it('shows 100% when every lesson in the domain is done', () => {
    const ring = createFakeRing('kien-truc', { hasFraction: true });
    const state = {
      v: 1,
      lessons: { 'kien-truc/a/1': { done: true }, 'kien-truc/a/2': { done: true }, 'kien-truc/a/3': { done: true } },
      bookmarks: [],
    };
    applyProgressRing(ring, state, lessons);
    expect(ring._text.textContent).toBe('100%');
    expect(ring._fill.style.strokeDashoffset).toBe('0');
  });

  it('is a no-op when the ring has no data-domain (defensive)', () => {
    const ring = createFakeRing(undefined, { hasFraction: true });
    applyProgressRing(ring, { v: 1, lessons: {}, bookmarks: [] }, lessons);
    expect(ring._text.textContent).toBe(''); // untouched
  });

  it('skips the fraction text when the ring has no [data-progress-ring-fraction] (compact card variant)', () => {
    const ring = createFakeRing('kien-truc', { hasFraction: false });
    expect(() => applyProgressRing(ring, { v: 1, lessons: {}, bookmarks: [] }, lessons)).not.toThrow();
    expect(ring._text.textContent).toBe('0%');
  });
});
