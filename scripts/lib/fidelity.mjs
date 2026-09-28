// Pure, side-effect-free helpers used by scripts/verify-fidelity.mjs AND
// tests/fidelity.test.mjs. Keeping these here (instead of inline in the CLI
// script) is what makes the fidelity rules unit-testable without touching
// the filesystem.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import { fromHtml } from 'hast-util-from-html';
import { stripFrontmatter } from './frontmatter.mjs';

// ---------------------------------------------------------------------------
// hast (parsed raw HTML) -> plain text. Hand-rolled instead of
// hast-util-to-string (not in the allowed dependency list) — trivial enough
// that a tiny recursive walk is clearer than pulling in another package.
// ---------------------------------------------------------------------------
// Only insert a synthetic space between two ELEMENT siblings with nothing
// between them (e.g. minified `<span>A</span><span>B</span>` chip lists) —
// mirrors scripts/lib/finance-extract.mjs `insertImplicitSpaces`, which
// applies the identical rule when generating the migrated MDX. Text-element
// or text-text adjacency is left alone: the source's own whitespace (or
// deliberate lack of it, e.g. `suất)<sup>số năm</sup>`) is preserved as-is,
// so both sides tokenize to the same words.
function joinChildrenText(children) {
  let out = '';
  for (let i = 0; i < children.length; i += 1) {
    out += hastToText(children[i]);
    if (children[i]?.type === 'element' && children[i + 1]?.type === 'element') out += ' ';
  }
  return out;
}

function hastToText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value ?? '';
  if (node.type === 'root') return joinChildrenText(node.children ?? []);
  if (node.type === 'element') {
    const tag = node.tagName;
    if (tag === 'script' || tag === 'style') return '';
    // `<br>` is a hard line break — like mdast's `break` node, it always
    // counts as a word separator (e.g. `.formula` divs use it between
    // otherwise-unspaced lines: "...11.910.160 đồng<br>Lợi suất...").
    if (tag === 'br') return ' ';
    const childText = joinChildrenText(node.children ?? []);
    if (tag === 'img') {
      const alt = node.properties?.alt ?? '';
      return [childText, alt].filter(Boolean).join(' ');
    }
    return childText;
  }
  return '';
}

/** Visible text of a raw HTML fragment (e.g. an mdast `html` node's value). */
export function textFromHtmlFragment(htmlSource) {
  return hastToText(fromHtml(htmlSource, { fragment: true }));
}

/** Visible text of a full HTML document (used for the finance source). */
export function textFromHtmlDocument(htmlSource) {
  return hastToText(fromHtml(htmlSource));
}

// ---------------------------------------------------------------------------
// mdast (markdown or MDX) -> plain text.
// ---------------------------------------------------------------------------

// JSX elements that are ADDED content, never part of the original source:
// stripped entirely (their text must NOT be compared).
const REMOVED_JSX_NAMES = new Set(['RealLife', 'Disclaimer']);
// JSX string attributes whose value is original translated/caption text.
const TEXT_ATTR_NAMES = new Set(['alt', 'caption', 'credit']);

/**
 * Text value of a JSX attribute. Plain string attrs (`alt="..."`) are
 * trivial; `credit`/`caption` are sometimes written as a template-literal
 * expression (`credit={\`Nguồn: <a href="...">...</a>\`}`) so the original
 * source link stays a real anchor — use the acorn-parsed estree when
 * available (remark-mdx parses attribute expressions with acorn) to get the
 * cooked string, then run it through the HTML text extractor since it may
 * itself contain markup.
 */
function jsxAttrValueText(attr) {
  if (typeof attr.value === 'string') return textFromHtmlFragment(attr.value);
  if (attr.value && typeof attr.value === 'object') {
    const expr = attr.value.data?.estree?.body?.[0]?.expression;
    if (expr?.type === 'TemplateLiteral' && expr.quasis?.length) {
      const cooked = expr.quasis.map((q) => q.value.cooked ?? '').join('');
      return textFromHtmlFragment(cooked);
    }
    if (expr?.type === 'Literal' && typeof expr.value === 'string') {
      return textFromHtmlFragment(expr.value);
    }
    const raw = (attr.value.value ?? '').replace(/^[`"']|[`"']$/g, '');
    return textFromHtmlFragment(raw);
  }
  return '';
}

function jsxAttrsText(node) {
  const parts = [];
  for (const attr of node.attributes ?? []) {
    if (attr.type === 'mdxJsxAttribute' && TEXT_ATTR_NAMES.has(attr.name)) {
      parts.push(jsxAttrValueText(attr));
    }
  }
  return parts.join(' ');
}

function hasTruthyJsxFlag(node, names) {
  return (node.attributes ?? []).some(
    (attr) =>
      attr.type === 'mdxJsxAttribute' &&
      names.includes(attr.name) &&
      (attr.value === null || attr.value === true || attr.value === 'true'),
  );
}

// Phrasing/inline containers: their children are words and inline marks
// that already carry whatever whitespace the source had (e.g. a link
// immediately followed by "." with no space) — joining with '' preserves
// that. Everything else (root, blockquote, list, listItem, table, tableRow,
// mdxJsxFlowElement, ...) holds block-level siblings with NO whitespace
// node between them in mdast, so joining with ' ' is required to avoid
// gluing e.g. two paragraphs together. Mirrors the identical hast-side rule
// in `hastToText`/`insertImplicitSpaces` — see notes there.
const INLINE_JOIN_TYPES = new Set([
  'paragraph',
  'heading',
  'emphasis',
  'strong',
  'delete',
  'link',
  'linkReference',
  'tableCell',
  'mdxJsxTextElement',
]);

function joinNodes(nodes, separator) {
  return nodes.map(mdastToText).join(separator);
}

function mdastToText(node) {
  if (!node) return '';
  switch (node.type) {
    case 'text':
    case 'inlineCode':
    case 'code':
      return node.value ?? '';
    case 'html':
      // Raw HTML embedded in markdown (e.g. the original <p align="center">
      // figure blocks) — sub-parse so alt/credit text is still counted.
      return textFromHtmlFragment(node.value ?? '');
    case 'image':
    case 'imageReference':
      // Alt text is original, translated content — must be compared.
      return node.alt ?? '';
    case 'break':
      return ' ';
    case 'yaml':
    case 'mdxjsEsm':
    case 'mdxFlowExpression':
    case 'mdxTextExpression':
    case 'thematicBreak':
      return '';
    case 'mdxJsxFlowElement':
    case 'mdxJsxTextElement': {
      const name = node.name ?? '';
      // `<br/>`/`<hr/>` kept verbatim in a few system-design table cells —
      // always a word separator, same as mdast's native `break` node above.
      if (name === 'br' || name === 'hr') return ' ';
      if (REMOVED_JSX_NAMES.has(name)) return '';
      if (name === 'Figure' && hasTruthyJsxFlag(node, ['added', 'data-added'])) return '';
      const attrText = jsxAttrsText(node);
      const childText = joinNodes(node.children ?? [], node.type === 'mdxJsxTextElement' ? '' : ' ');
      return [attrText, childText].filter(Boolean).join(' ');
    }
    default: {
      if (Array.isArray(node.children)) {
        return joinNodes(node.children, INLINE_JOIN_TYPES.has(node.type) ? '' : ' ');
      }
      return '';
    }
  }
}

/**
 * The corpus has several `<a href=URL>` tags with an UNQUOTED attribute
 * value (valid, if unusual, HTML). remark-gfm's autolink extension then
 * greedily matches the bare URL as its own link node and swallows the
 * tag's closing `>`, so the `<a href=` / `</a>` fragments are left behind
 * as literal, uncleaned text — a parser quirk, not a content difference.
 * Quoting the attribute (comparison-only; the snapshot file itself is
 * never touched) makes both this and the structurally-identical `<img>`/
 * `<p>` blocks parse as proper HTML so their visible text is extracted
 * the same way on both sides of the fidelity check.
 */
function quoteUnquotedHrefs(markdown) {
  return markdown.replace(/<a href=([^"'\s>]+)>/g, '<a href="$1">');
}

/** Parses an original (non-MDX) markdown snapshot body into mdast. */
export function parseMarkdown(markdown) {
  return unified().use(remarkParse).use(remarkGfm).parse(quoteUnquotedHrefs(markdown));
}

/** Parses a migrated lesson MDX body into mdast. */
export function parseMdx(mdxSource) {
  return unified().use(remarkParse).use(remarkMdx).use(remarkGfm).parse(mdxSource);
}

/** Plain visible text of an original markdown snapshot (frontmatter stripped). */
export function textFromMarkdownSource(markdown) {
  return mdastToText(parseMarkdown(stripFrontmatter(markdown)));
}

/** Plain visible text of a migrated lesson MDX body, with added JSX removed. */
export function textFromLessonMdx(mdxSource) {
  return mdastToText(parseMdx(stripFrontmatter(mdxSource)));
}

// ---------------------------------------------------------------------------
// Normalization: NFC, collapse whitespace, strip URLs (visible text only —
// changing a link target must never fail fidelity). Heading/list markers are
// already excluded because mdast only stores the text content of those
// nodes, never the `#`/`-`/`1.` markup.
// ---------------------------------------------------------------------------
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
