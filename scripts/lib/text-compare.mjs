// Normalization + comparison of already-extracted plain text. Split out of
// fidelity.mjs per the >200-line modularization rule.
//
// NFC, collapse whitespace, strip URLs (visible text only — changing a link
// target must never fail fidelity). Heading/list markers are already
// excluded because mdast only stores the text content of those nodes, never
// the `#`/`-`/`1.` markup.
const URL_RE = /\bhttps?:\/\/[^\s)>\]"']+/g;

export function normalizeText(input) {
  return input
    .normalize('NFC')
    .replace(URL_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Index of the first differing character, or -1 if `a` and `b` are identical. */
export function findFirstDifference(a, b) {
  const len = Math.min(a.length, b.length);
  let i = 0;
  while (i < len && a[i] === b[i]) i++;
  if (i === len && a.length === b.length) return -1;
  return i;
}

/** `radius` characters of context on each side of `index`, for error output. */
export function contextAround(text, index, radius = 80) {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end);
}

/**
 * Compares two already-normalized text strings. Returns `{ ok: true }` or
 * `{ ok: false, index, contextA, contextB }` with ±80-char context for the
 * first divergence (also handles pure length differences, e.g. a deleted
 * trailing paragraph, where the shared prefix is otherwise identical).
 */
export function compareNormalized(a, b) {
  const index = findFirstDifference(a, b);
  if (index === -1) return { ok: true };
  return {
    ok: false,
    index,
    contextA: contextAround(a, index),
    contextB: contextAround(b, index),
  };
}
