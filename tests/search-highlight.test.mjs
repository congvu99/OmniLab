import { describe, expect, it } from 'vitest';
import { buildHighlightSegments } from '../src/lib/search-highlight.ts';

describe('buildHighlightSegments', () => {
  it('returns a single non-match segment when there are no terms', () => {
    expect(buildHighlightSegments('Bộ nhớ đệm', [])).toEqual([{ text: 'Bộ nhớ đệm', match: false }]);
  });

  it('highlights an accented match found via its diacritic-folded term', () => {
    // MiniSearch's processTerm folds "đệm" -> "dem" before matching, so this
    // simulates the term MiniSearch would actually report.
    const segments = buildHighlightSegments('Bộ nhớ đệm giúp giảm tải.', ['dem']);
    expect(segments).toEqual([
      { text: 'Bộ nhớ ', match: false },
      { text: 'đệm', match: true },
      { text: ' giúp giảm tải.', match: false },
    ]);
  });

  it('highlights a plain ASCII match case-insensitively', () => {
    const segments = buildHighlightSegments('Cache giúp giảm tải.', ['cache']);
    expect(segments[0]).toEqual({ text: 'Cache', match: true });
  });

  it('highlights multiple non-overlapping terms', () => {
    const segments = buildHighlightSegments('Cân bằng tải giúp giảm tải hệ thống.', ['can', 'tai']);
    const matched = segments.filter((s) => s.match).map((s) => s.text);
    expect(matched).toEqual(['Cân', 'tải', 'tải']);
  });

  it('merges overlapping/adjacent match ranges instead of double-wrapping', () => {
    const segments = buildHighlightSegments('cache', ['cache', 'cach']);
    expect(segments).toEqual([{ text: 'cache', match: true }]);
  });

  it('reassembling all segment text reproduces the original string exactly', () => {
    const original = 'Bộ cân bằng tải phân phối lưu lượng cho nhiều máy chủ.';
    const segments = buildHighlightSegments(original, ['can', 'bang', 'may']);
    expect(segments.map((s) => s.text).join('')).toBe(original);
  });
});
