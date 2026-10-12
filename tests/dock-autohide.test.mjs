import { describe, expect, it } from 'vitest';
import { createDockScrollState, stepDockScroll } from '../src/lib/dock-autohide.ts';

const MAX = 5000;
const run = (ys, start = createDockScrollState(0), max = MAX) =>
  ys.reduce((s, y) => stepDockScroll(s, y, max), start);

describe('stepDockScroll', () => {
  it('starts shown and stays shown at the top', () => {
    expect(createDockScrollState().hidden).toBe(false);
    expect(run([2, 5, 8]).hidden).toBe(false);
  });

  it('keeps the dock while scrolled less than the hide threshold', () => {
    expect(run([20, 50, 80]).hidden).toBe(false);
  });

  it('hides when scrolling down past 80px', () => {
    expect(run([40, 90, 120]).hidden).toBe(true);
  });

  it('ignores sub-jitter downward movement', () => {
    const s = run([200, 100, 102]); // reversal at 100, only 2px down
    expect(s.hidden).toBe(false);
  });

  it('reveals after scrolling up >= 24px, not before', () => {
    const hidden = run([100, 300, 500]);
    expect(hidden.hidden).toBe(true);
    expect(stepDockScroll(hidden, 490, MAX).hidden).toBe(true);
    expect(stepDockScroll(hidden, 476, MAX).hidden).toBe(false);
  });

  it('measures the reveal delta from the last reversal, not cumulatively across jitter', () => {
    const s = run([100, 300, 500, 495, 500, 495, 500]);
    expect(s.hidden).toBe(true);
  });

  it('re-hides after a reveal when scrolling down again', () => {
    const s = run([100, 300, 500, 470, 520]);
    expect(s.hidden).toBe(true);
  });

  it('is always shown within 400px of the end', () => {
    const s = run([100, 300, 500, 4700]);
    expect(s.hidden).toBe(false);
    expect(run([4700, 4800, 4900]).hidden).toBe(false);
  });

  it('shows again when returning to the top', () => {
    const s = run([100, 300, 500, 6]);
    expect(s.hidden).toBe(false);
  });

  it('clamps rubber-band overscroll (negative / beyond max)', () => {
    expect(run([300, 500, -40]).hidden).toBe(false);
    expect(run([300, 500, MAX + 80]).hidden).toBe(false);
  });

  it('always shows on short pages (end is within 400px)', () => {
    expect(run([100, 200, 300], createDockScrollState(0), 350).hidden).toBe(false);
  });

  it('repeated identical samples do not change state', () => {
    const a = run([100, 300, 500]);
    expect(stepDockScroll(a, 500, MAX)).toBe(a);
  });

  it('survives non-finite input', () => {
    const a = createDockScrollState(0);
    expect(stepDockScroll(a, Number.NaN, MAX).hidden).toBe(false);
    expect(stepDockScroll(a, 300, Number.NaN).hidden).toBe(false);
  });
});
