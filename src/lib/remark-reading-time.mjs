// Remark plugin: computes `frontmatter.readingMinutes` from the rendered
// markdown/MDX body (~200 words/minute, Vietnamese included since it is
// whitespace-tokenized). Registered in astro.config.mjs markdown/mdx
// `remarkPlugins` so it runs for every lesson.
import { toString } from 'mdast-util-to-string';

const WORDS_PER_MINUTE = 200;

export function remarkReadingTime() {
  return (tree, file) => {
    const text = toString(tree);
    const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
    const frontmatter = file.data.astro?.frontmatter;
    if (frontmatter) {
      frontmatter.readingMinutes = minutes;
    }
  };
}

export default remarkReadingTime;
