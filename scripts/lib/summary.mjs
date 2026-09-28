// Shared by both migration scripts: turns a raw text string into a
// frontmatter-safe summary (<=200 chars, schema limit — src/content.config.ts).
export function truncateAtSentence(text, maxLen) {
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen);
  const boundary = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '));
  if (boundary > 40) return slice.slice(0, boundary + 1).trim();
  return `${slice.slice(0, maxLen - 1).trim()}…`;
}
