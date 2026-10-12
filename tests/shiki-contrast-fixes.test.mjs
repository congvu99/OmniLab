import { describe, expect, it } from 'vitest';
import { fixStyleContrast } from '../src/lib/shiki-contrast-fixes.mjs';

describe('fixStyleContrast', () => {
  it('swaps the failing light-theme orange in the color declaration', () => {
    expect(fixStyleContrast('color:#E36209;--shiki-dark:#FFAB70')).toBe('color:#C24E00;--shiki-dark:#FFAB70');
  });

  it('swaps the failing dark-theme comment gray only in --shiki-dark', () => {
    expect(fixStyleContrast('color:#6A737D;--shiki-dark:#6A737D')).toBe('color:#6A737D;--shiki-dark:#8B949E');
  });

  it('is case-insensitive and leaves passing colors untouched', () => {
    expect(fixStyleContrast('color:#e36209')).toBe('color:#C24E00');
    expect(fixStyleContrast('color:#24292E;--shiki-dark:#E1E4E8')).toBe('color:#24292E;--shiki-dark:#E1E4E8');
  });
});
