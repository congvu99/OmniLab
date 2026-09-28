import { describe, expect, it } from 'vitest';
import { foldDiacritics } from '../src/lib/search-normalize.ts';

describe('foldDiacritics', () => {
  it('strips Vietnamese combining diacritics and lowercases', () => {
    expect(foldDiacritics('Bộ nhớ đệm')).toBe('bo nho dem');
    expect(foldDiacritics('Cân bằng tải')).toBe('can bang tai');
    expect(foldDiacritics('Lãi kép')).toBe('lai kep');
  });

  it('folds đ/Đ to d (no Unicode canonical decomposition for this letter)', () => {
    expect(foldDiacritics('Đường dẫn')).toBe('duong dan');
    expect(foldDiacritics('đĐđ')).toBe('ddd');
  });

  it('is a no-op (besides lowercasing) for plain ASCII input', () => {
    expect(foldDiacritics('cache')).toBe('cache');
    expect(foldDiacritics('Load Balancer')).toBe('load balancer');
  });

  it('is idempotent: folding already-folded text changes nothing', () => {
    const once = foldDiacritics('Khả năng mở rộng');
    expect(foldDiacritics(once)).toBe(once);
  });
});
