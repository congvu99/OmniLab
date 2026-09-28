/**
 * Shared reading-time math (~200 words/minute) — the single place both
 * consumers plug into:
 *  - src/lib/remark-reading-time.mjs (build-time remark plugin, tokenizes
 *    the mdast tree it already has via `mdast-util-to-string`)
 *  - src/lib/content-queries.ts (`toQueriedLesson`, tokenizes the raw MDX
 *    body directly — see that file for why it can't rely on the plugin's
 *    own frontmatter write: Astro only exposes that via
 *    `render().remarkPluginFrontmatter`, never on `entry.data`)
 *  - scripts/lib/reading-time.mjs (migration-time, same math via the
 *    remark plugin path)
 */
export const WORDS_PER_MINUTE = 200;

/** Whitespace-tokenized word count. Vietnamese content is whitespace-separated, so this works for both domains. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

/** Rounds to the nearest minute, minimum 1 (never "0 phút đọc" for a very short lesson). */
export function minutesForWordCount(words: number): number {
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
