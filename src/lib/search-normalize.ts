/**
 * Diacritic-insensitive term normalization for Vietnamese search
 * (Pagefind's built-in Vietnamese folding missed the target lesson for a
 * fully-unaccented query in the top 15 — see docs/system-architecture.md
 * "Tìm kiếm"). Used as MiniSearch's `processTerm`, applied identically at
 * index time and query time, so "bo nho dem" matches content indexed as
 * "bộ nhớ đệm".
 *
 * Order matters: lowercase first (so "Đ"->"đ" via a single case rule), then
 * fold "đ"/"Đ" -> "d" (Vietnamese đ has NO Unicode canonical decomposition,
 * NFD alone will not touch it), then NFD-normalize the rest and strip
 * combining diacritical marks (U+0300-U+036F) so "ệ" -> "e", "ộ" -> "o", etc.
 */
// Explicit \uXXXX escapes (not literal combining characters in the source
// file) — a literal combining mark embedded directly in a regex character
// class is invisible in most editors/diffs and easy to corrupt without
// anyone noticing.
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const D_WITH_STROKE = /đ/g;

export function foldDiacritics(input: string): string {
  return input.toLowerCase().replace(D_WITH_STROKE, 'd').normalize('NFD').replace(COMBINING_MARKS, '');
}
