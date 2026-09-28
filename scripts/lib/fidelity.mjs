// Barrel re-export: verify-fidelity.mjs and tests/fidelity.test.mjs import
// everything from this one path. Split into html-text-extract.mjs (hast ->
// text), mdx-text-extract.mjs (mdast/MDX -> text + the forbidden-construct
// guard) and text-compare.mjs (normalize/diff) per the >200-line
// modularization rule — this file just re-exports so no call site needed to
// change when the split happened.
export { textFromHtmlDocument, textFromHtmlFragment } from './html-text-extract.mjs';
export {
  findForbiddenMdxConstructs,
  parseMarkdown,
  parseMdx,
  textFromLessonMdx,
  textFromMarkdownSource,
} from './mdx-text-extract.mjs';
export { compareNormalized, contextAround, findFirstDifference, normalizeText } from './text-compare.mjs';
