// String-level MDX-safety transforms for the system-design snapshot. We work
// on the raw markdown text (not an mdast round-trip) so formatting the
// translator chose (list style, blank lines, table layout) survives
// untouched — only the handful of constructs that are genuinely unsafe or
// meaningful for MDX are rewritten.
import { resolveLink } from './links.mjs';

/**
 * Escapes stray `{`/`}` outside fenced code blocks and inline code spans.
 * None of the corpus's raw HTML tags contain braces, so this is safe to run
 * as a first, generic pass before any structural (HTML->JSX) rewrite.
 */
export function escapeBraces(markdown) {
  const fenceSplit = markdown.split(/(^```[\s\S]*?^```$)/m);
  return fenceSplit
    .map((chunk, i) => (i % 2 === 1 ? chunk : escapeBracesOutsideInlineCode(chunk)))
    .join('');
}

function escapeBracesOutsideInlineCode(text) {
  return text
    .split(/(`[^`\n]*`)/g)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/[{}]/g, (c) => `\\${c}`)))
    .join('');
}

/**
 * One known stray `>` used as a "greater than" comparison in prose
 * (01-danh-doi/03-cap-theorem.md: "R + W > N"). A literal `>` is otherwise
 * unused outside recognized tags in this corpus (verified by scanning every
 * mdast text node across all 28 files), so a targeted string replace is
 * safer here than a generic rule that would also mangle `<br/>` closes.
 */
export function escapeKnownStrayGreaterThan(markdown) {
  return markdown.replaceAll('R + W > N', 'R + W \\> N');
}

function escapeForJsxDoubleQuoted(text) {
  return text.replace(/"/g, '&quot;');
}

function escapeForTemplateLiteral(text) {
  return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/**
 * Converts the two raw `<p align="center">...</p>` figure-credit shapes
 * used throughout the corpus into `<Figure>` JSX (with image) or an italic
 * markdown credit line (without image, communication.md only). `onImage` is
 * called for every referenced image path so the caller can register it for
 * copying + collect the import statement.
 */
// "Nguồn: " (source credit) is written inconsistently across the corpus:
// sometimes just before the <a>, sometimes as the first words INSIDE the
// <a> text. Both are matched (and normalized to the same output shape) —
// harmless since verify-fidelity only compares concatenated visible text,
// never which tag a word sits in.
const CREDIT_INNER_RE = /<i>\s*(?:Nguồn:\s*)?<a href="?([^">]+)"?>\s*(?:Nguồn:\s*)?([^<]*)<\/a>\s*<\/i>/;

export function convertFigureBlocks(markdown, { onImage }) {
  const withImageRe = new RegExp(
    `<p align="center">\\r?\\n\\s*<img src="([^"]+)" alt="([^"]*)">\\r?\\n\\s*<br\\/>\\r?\\n\\s*${CREDIT_INNER_RE.source}` +
      `(?:\\r?\\n\\s*<br\\/>)?\\r?\\n<\\/p>`,
    'g',
  );
  let out = markdown.replace(withImageRe, (_m, src, alt, href, linkText) => {
    const importName = onImage(src);
    const safeAlt = escapeForJsxDoubleQuoted(alt);
    const safeCredit = escapeForTemplateLiteral(`Nguồn: <a href="${href}">${linkText}</a>`);
    return `<Figure src={${importName}} alt="${safeAlt}" credit={\`${safeCredit}\`} />`;
  });

  const noImageRe = new RegExp(`<p align="center">\\r?\\n\\s*${CREDIT_INNER_RE.source}\\r?\\n<\\/p>`, 'g');
  out = out.replace(noImageRe, (_m, href, linkText) => `*Nguồn: [${linkText}](${href})*`);

  return out;
}

/** Converts plain `![alt](path.png)` markdown images (bai-tap solutions) to `<Figure>`. */
export function convertPlainImages(markdown, { onImage }) {
  return markdown.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt, src) => {
    const importName = onImage(src);
    const safeAlt = escapeForJsxDoubleQuoted(alt);
    return `<Figure src={${importName}} alt="${safeAlt}" />`;
  });
}

/** Quotes + resolves the unquoted `<sup><a href=...>N</a></sup>` footnote links. */
export function fixSupFootnotes(markdown, currentModuleDir) {
  return markdown.replace(/<sup><a href="?([^">]+)"?>([^<]*)<\/a><\/sup>/g, (_m, href, label) => {
    const resolved = resolveLink(href, currentModuleDir);
    return `<sup><a href="${resolved}">${label}</a></sup>`;
  });
}

/** Rewrites `[text](target.md[#anchor])` links; external/non-.md targets are untouched. */
export function rewriteMarkdownLinks(markdown, currentModuleDir) {
  return markdown.replace(/(?<!!)\[([^\]]*)\]\(([^)\s]+)\)/g, (whole, label, target) => {
    if (/^https?:\/\//.test(target)) return whole;
    if (!target.includes('.md')) return whole;
    return `[${label}](${resolveLink(target, currentModuleDir)})`;
  });
}

/**
 * Splits the body into `{ main, translatorNote }` at the
 * "## Ghi chú của người dịch" heading. `translatorNote` includes the
 * heading itself (kept as a child of <TranslatorNote>, not a prop) and
 * everything after it, verbatim. Returns `translatorNote: null` when the
 * file has no such section (e.g. README.md).
 */
export function splitTranslatorNote(body) {
  const marker = '## Ghi chú của người dịch';
  const index = body.indexOf(marker);
  if (index === -1) return { main: body, translatorNote: null };
  return { main: body.slice(0, index), translatorNote: body.slice(index) };
}
