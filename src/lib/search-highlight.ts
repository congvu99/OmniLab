/**
 * Maps MiniSearch's matched (already diacritic-folded, see
 * search-normalize.ts) `terms` back onto the ORIGINAL accented display text,
 * so the search-box island can wrap "đệm" in <mark> for a folded match term
 * "dem" without ever seeing the accented form itself.
 *
 * Relies on foldDiacritics being length-preserving per character (lowercase
 * is 1:1, đ->d is 1:1, and NFD-decompose-then-strip-combining-marks always
 * nets back to exactly one base letter per original character for the
 * precomposed Vietnamese letters this app's content uses) — so an index
 * found in `foldDiacritics(text)` is valid to slice directly out of `text`.
 */
import { foldDiacritics } from './search-normalize';

export interface HighlightSegment {
  text: string;
  match: boolean;
}

export function buildHighlightSegments(originalText: string, terms: string[]): HighlightSegment[] {
  const folded = foldDiacritics(originalText);
  const ranges: [number, number][] = [];

  for (const term of new Set(terms.filter((t) => t.length > 0))) {
    let from = 0;
    for (;;) {
      const idx = folded.indexOf(term, from);
      if (idx === -1) break;
      ranges.push([idx, idx + term.length]);
      from = idx + term.length;
    }
  }

  if (ranges.length === 0) return [{ text: originalText, match: false }];

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: originalText.slice(cursor, start), match: false });
    segments.push({ text: originalText.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < originalText.length) segments.push({ text: originalText.slice(cursor), match: false });

  return segments;
}
