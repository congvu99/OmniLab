// Computes `readingMinutes` at migration time using the SAME plugin Astro
// is configured to run (src/lib/remark-reading-time.mjs, registered via
// `mdx({ remarkPlugins })` in astro.config.mjs).
//
// Why this exists: Astro 7's default MDX/Markdown processor ("Sätteri",
// shipped by @astrojs/mdx 8.x) does not run remark/rehype plugins at all —
// only the legacy `@astrojs/markdown-remark` processor does, and installing
// it is outside this phase's file ownership (package.json dependencies are
// frozen). Registering the plugin in astro.config.mjs is still correct and
// forward-compatible (it will start working with zero code changes the day
// that package is added) — this module is the working fallback so
// `readingMinutes` is populated today. See phase-03 report.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import { remarkReadingTime } from '../../src/lib/remark-reading-time.mjs';

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);

/** Reading time (minutes) for an MDX lesson body, via the real remark plugin. */
export function computeReadingMinutes(mdxBody) {
  const tree = parser.parse(mdxBody);
  const file = { data: { astro: { frontmatter: {} } } };
  remarkReadingTime()(tree, file);
  return file.data.astro.frontmatter.readingMinutes;
}
