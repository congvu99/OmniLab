// Pure logic behind the reader aside's TOC scrollspy + progress readout.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachTocScrollspy, nearestScrollDelta, pickActiveIndex, readingPercent } from '../src/lib/toc-scrollspy.ts';

describe('pickActiveIndex', () => {
  it('returns -1 when no heading has reached the activation line', () => {
    expect(pickActiveIndex([300, 900], 100)).toBe(-1);
    expect(pickActiveIndex([], 100)).toBe(-1);
  });

  it('picks the last heading at or above the line', () => {
    expect(pickActiveIndex([-800, -200, 80, 600], 100)).toBe(2);
    expect(pickActiveIndex([100], 100)).toBe(0);
  });

  it('stays on the last heading once every heading is above the line', () => {
    expect(pickActiveIndex([-900, -500, -10], 100)).toBe(2);
  });
});

describe('readingPercent', () => {
  it('rounds and clamps to 0-100', () => {
    expect(readingPercent(0, 1000)).toBe(0);
    expect(readingPercent(333, 1000)).toBe(33);
    expect(readingPercent(1500, 1000)).toBe(100);
    expect(readingPercent(-20, 1000)).toBe(0);
  });

  it('is 0 when the page is not scrollable or inputs are invalid', () => {
    expect(readingPercent(50, 0)).toBe(0);
    expect(readingPercent(Number.NaN, 1000)).toBe(0);
  });
});

describe('nearestScrollDelta', () => {
  it('is 0 when the item is already inside the box', () => {
    expect(nearestScrollDelta(120, 150, 100, 500)).toBe(0);
    expect(nearestScrollDelta(100, 500, 100, 500)).toBe(0);
  });

  it('scrolls up by the overhang when the item is above the box', () => {
    expect(nearestScrollDelta(60, 90, 100, 500)).toBe(-40);
  });

  it('scrolls down by the overhang when the item is below the box', () => {
    expect(nearestScrollDelta(480, 530, 100, 500)).toBe(30);
  });

  it('aligns an item taller than the box to the box top', () => {
    expect(nearestScrollDelta(300, 900, 100, 500)).toBe(200);
  });
});

describe('attachTocScrollspy', () => {
  afterEach(() => vi.unstubAllGlobals());

  const el = (top) => {
    const attrs = new Map();
    return {
      attrs,
      getBoundingClientRect: () => ({ top, bottom: top + 20 }),
      setAttribute: (k, v) => attrs.set(k, v),
      removeAttribute: (k) => attrs.delete(k),
    };
  };

  it('marks the current link and reports index changes once per change', () => {
    vi.stubGlobal('window', { scrollY: 0, addEventListener() {}, removeEventListener() {} });
    vi.stubGlobal('document', { documentElement: { scrollHeight: 2000, clientHeight: 1000 } });
    const headings = [el(-300), el(40), el(700)];
    const links = [el(0), el(0), el(0)];
    const seen = [];
    const off = attachTocScrollspy({
      headings,
      links,
      offset: 100,
      onActiveChange: (i, link) => seen.push([i, link === links[i]]),
    });
    expect(seen).toEqual([[1, true]]);
    expect(links[1].attrs.get('aria-current')).toBe('location');
    expect(links[0].attrs.has('aria-current')).toBe(false);
    off();
  });
});
