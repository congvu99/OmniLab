// mdast (markdown or MDX) -> plain text, plus a "no disallowed constructs"
// guard. Split out of fidelity.mjs per the >200-line modularization rule.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';
import { stripFrontmatter } from './frontmatter.mjs';
import { textFromHtmlFragment } from './html-text-extract.mjs';

// JSX elements that are ADDED content, never part of the original source:
// stripped entirely (their text — children AND attributes — must NOT be
// compared).
const REMOVED_JSX_NAMES = new Set(['RealLife', 'Disclaimer']);

/**
 * Per-component allowlist of JSX attribute names whose string value is
 * ORIGINAL translated/caption text and must be fidelity-checked. Explicit
 * (rather than "every string attribute on every component") on purpose:
 * some props hold non-content values that happen to be strings (e.g.
 * `Figure`'s `src`, a local asset path that differs from the original
 * source's own image path by design) — including those would produce false
 * fidelity failures. Every component in
 * src/components/lesson/mdx-components.ts that can render a string prop as
 * visible text must have an entry here (add one when adding such a prop to
 * a new/existing component).
 */
const JSX_TEXT_ATTRS = {
  // alt/caption/credit are original captions/credits carried over from the
  // source image; src/added/svg are not content.
  Figure: ['alt', 'caption', 'credit'],
  // title is an optional heading rendered above the box's original content
  // (see src/components/lesson/note.astro) — used for both original
  // "note"/"box"/"warm" HTML divs converted 1:1 and future added notes, so
  // its text must round-trip through the fidelity check like everything
  // else non-removed.
  Note: ['title'],
};

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
    // Any other expression (identifier, member access, etc.) is not a
    // string literal — nothing to compare (and definitely not the raw
    // source text of the expression itself).
    return '';
  }
  return '';
}

function jsxAttrsText(node) {
  const allowedNames = JSX_TEXT_ATTRS[node.name] ?? [];
  if (allowedNames.length === 0) return '';
  const parts = [];
  for (const attr of node.attributes ?? []) {
    if (attr.type === 'mdxJsxAttribute' && allowedNames.includes(attr.name)) {
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
// in html-text-extract.mjs — see notes there.
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
      // Any node reaching here that ISN'T a plain `import` statement is
      // rejected up front by findForbiddenMdxConstructs (called before this
      // function anywhere lesson MDX is fidelity-checked) — by the time
      // mdastToText runs, these are known-safe to contribute zero text.
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

/**
 * Guards against silent text injection via MDX expressions/exports:
 * `{"some text"}` (mdxFlowExpression / mdxTextExpression) and
 * `export const x = "..."` (mdxjsEsm) both render
 * real visible text that textFromLessonMdx would otherwise never see —
 * mdastToText intentionally treats those node types as contributing zero
 * text, so without this guard a lesson could gain arbitrary added text that
 * still passes the fidelity comparison. Only plain `import` statements are
 * allowed inside an `mdxjsEsm` block (e.g. `import svg from '...svg?raw'`).
 *
 * Returns an array of human-readable violation strings; empty means clean.
 */
export function findForbiddenMdxConstructs(mdxSource) {
  const tree = parseMdx(stripFrontmatter(mdxSource));
  const violations = [];

  visit(tree, (node) => {
    if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
      const raw = mdxSource.slice(node.position?.start?.offset ?? 0, node.position?.end?.offset ?? 0);
      violations.push(`${node.type} (renders visible text, not allowed in lesson content): ${raw || '{...}'}`);
      return;
    }
    if (node.type === 'mdxjsEsm') {
      const statements = node.data?.estree?.body ?? [];
      for (const statement of statements) {
        if (statement.type !== 'ImportDeclaration') {
          const raw = mdxSource.slice(node.position?.start?.offset ?? 0, node.position?.end?.offset ?? 0);
          violations.push(`non-import ESM statement "${statement.type}" (not allowed in lesson content): ${raw}`);
        }
      }
    }
  });

  return violations;
}
