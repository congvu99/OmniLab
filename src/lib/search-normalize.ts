/**
 * Diacritic-insensitive term normalization for Vietnamese search (Phase 5
 * spike decision: Pagefind's built-in Vietnamese folding missed the target
 * lesson for a fully-unaccented query in top-3 — see phase-05 report. Used
 * as MiniSearch's `processTerm`, applied identically at index time and
 * query time, so "bo nho dem" matches content indexed as "bộ nhớ đệm").
 *
 * Order matters: lowercase first (so "Đ"->"đ" via a single case rule), then
 * fold "đ"/"Đ" -> "d" (Vietnamese đ has NO Unicode canonical decomposition,
 * NFD alone will not touch it), then NFD-normalize the rest and strip
 * combining diacritical marks (U+0300-U+036F) so "ệ" -> "e", "ộ" -> "o", etc.
 */
const COMBINING_MARKS = /[̀-ͯ]/g;
const D_WITH_STROKE = /đ/g;

export function foldDiacritics(input: string): string {
  return input.toLowerCase().replace(D_WITH_STROKE, 'd').normalize('NFD').replace(COMBINING_MARKS, '');
}
