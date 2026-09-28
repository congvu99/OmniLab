// hast (parsed raw HTML) -> plain text. Split out of fidelity.mjs per the
// >200-line modularization rule. Hand-rolled instead of hast-util-to-string
// (not in the allowed dependency list) — trivial enough that a tiny
// recursive walk is clearer than pulling in another package.
import { fromHtml } from 'hast-util-from-html';

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
