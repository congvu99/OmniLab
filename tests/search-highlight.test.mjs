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

  describe('word-boundary only (short terms must not light up mid-word)', () => {
    it('does not highlight a term that only occurs mid-word', () => {
      // "de" occurs inside "video" ("vi-DE-o"), not at a word start — must
      // NOT be highlighted (a short fuzzy/prefix term must not light up
      // mid-word inside an unrelated term).
      const segments = buildHighlightSegments('Xem video hướng dẫn.', ['de']);
      expect(segments.every((s) => !s.match)).toBe(true);
    });

    it('still highlights the same short term when it does start a word', () => {
      const segments = buildHighlightSegments('Đệm giúp giảm tải.', ['de']);
      expect(segments[0]).toEqual({ text: 'Đệ', match: true });
    });

    it('treats punctuation as a boundary (start of a parenthesized word matches)', () => {
      const segments = buildHighlightSegments('Bộ nhớ đệm (cache) giúp nhanh hơn.', ['cache']);
      const matched = segments.filter((s) => s.match).map((s) => s.text);
      expect(matched).toEqual(['cache']);
    });
  });

  describe('NFC normalization (decomposed input must not shift match offsets)', () => {
    it('produces the same, correctly-sliced result for NFD and NFC input', () => {
      const nfc = 'Bộ nhớ đệm giúp giảm tải.';
      const nfd = nfc.normalize('NFD');
      const segmentsFromNfc = buildHighlightSegments(nfc, ['dem']);
      const segmentsFromNfd = buildHighlightSegments(nfd, ['dem']);
      expect(segmentsFromNfd).toEqual(segmentsFromNfc);
      expect(segmentsFromNfc.find((s) => s.match)?.text).toBe('đệm');
    });
  });
});
