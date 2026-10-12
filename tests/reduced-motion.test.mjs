// prefersReducedMotion: honors the in-app override and the OS media query.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion } from '../src/lib/reduced-motion.ts';

afterEach(() => vi.unstubAllGlobals());

const setup = ({ motion, media }) => {
  vi.stubGlobal('document', { documentElement: { dataset: motion ? { motion } : {} } });
  vi.stubGlobal('matchMedia', (q) => ({ matches: q.includes('prefers-reduced-motion') && media }));
};

describe('prefersReducedMotion', () => {
  it('is true when the user forces reduced motion, even if the OS does not', () => {
    setup({ motion: 'reduce', media: false });
    expect(prefersReducedMotion()).toBe(true);
  });

  it('follows the OS setting when the preference is "system"', () => {
    setup({ motion: 'system', media: true });
    expect(prefersReducedMotion()).toBe(true);
    setup({ motion: 'system', media: false });
    expect(prefersReducedMotion()).toBe(false);
  });

  it('is false without a document or matchMedia', () => {
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});
