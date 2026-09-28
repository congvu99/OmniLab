// Remark plugin: computes `frontmatter.readingMinutes` from the rendered
// markdown/MDX body. Registered in astro.config.mjs markdown `remarkPlugins`
// so it runs for every lesson. Astro only surfaces this write via
// `render(entry).then(r => r.remarkPluginFrontmatter)`, never on
// `entry.data` — so content-queries.ts computes the same number itself from
// `entry.body` (via the same shared math in compute-reading-time.ts) rather
// than depending on this plugin's output. This plugin still runs so the
// `render()` result stays correct for any future caller that does use it.
import { toString } from 'mdast-util-to-string';
import { countWords, minutesForWordCount } from './compute-reading-time.ts';

export function remarkReadingTime() {
  return (tree, file) => {
    const minutes = minutesForWordCount(countWords(toString(tree)));
    const frontmatter = file.data.astro?.frontmatter;
    if (frontmatter) {
      frontmatter.readingMinutes = minutes;
    }
  };
}

export default remarkReadingTime;
