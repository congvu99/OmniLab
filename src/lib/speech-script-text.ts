/**
 * Inline-level reading rules of the speech script extractor
 * (src/lib/speech-script-extract.ts): what a phrasing node or a JSX tag reads
 * as, how a GFM table becomes sentences, paragraph normalization, and the
 * heading helpers that pair AST headings with Astro's rendered ones. Build-time
 * only; reads a structural view of mdast (no transitive @types package).
 */
import { jsxAttrValueText } from '../../scripts/lib/mdx-text-extract.mjs';
import type { ReaderHeading } from './lesson-reader-model';

/** The fields of an mdast / mdx-jsx node the extractor reads. */
export interface MdNode {
  type: string;
  value?: string;
  depth?: number;
  name?: string | null;
  children?: MdNode[];
  attributes?: Array<{ type: string; name?: string; value?: unknown }>;
}

/** Every heading in document order, including headings nested in JSX. */
export function collectHeadings(node: MdNode, out: MdNode[] = []): MdNode[] {
  if (node.type === 'heading') out.push(node);
  for (const child of node.children ?? []) collectHeadings(child, out);
  return out;
}

// Mirrors Astro's `headings[].text`: text and code values concatenated, a hard
// break adds its newline (mdast-util-to-string would glue both lines), images
// add nothing.
function headingRawText(node: MdNode): string {
  if (node.type === 'break') return '\n';
  if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'mdxTextExpression') return node.value ?? '';
  return (node.children ?? []).map(headingRawText).join('');
}

/** Heading text as Astro reports it in `headings[].text`, whitespace-collapsed. */
export function headingPlainText(node: MdNode): string {
  return collapseSpaces(headingRawText(node));
}

/** Pairs AST headings with rendered ones; null when count, depth or text disagree. */
export function alignHeadings(astHeadings: MdNode[], rendered: readonly ReaderHeading[]): Map<MdNode, ReaderHeading> | null {
  if (astHeadings.length !== rendered.length) return null;
  const pairs = new Map<MdNode, ReaderHeading>();
  for (const [index, node] of astHeadings.entries()) {
    const heading = rendered[index];
    if (node.depth !== heading.depth || headingPlainText(node) !== collapseSpaces(heading.text)) return null;
    pairs.set(node, heading);
  }
  return pairs;
}

/** True when a JSX element named `name` appears anywhere in the tree. */
export function containsJsx(node: MdNode, name: string): boolean {
  if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === name) return true;
  return (node.children ?? []).some((child) => containsJsx(child, name));
}

/** How a JSX tag is read. `suppress`: skipped, but headings inside still open chapters (ids stay aligned). */
export type JsxReading = 'content' | 'space' | 'drop' | 'suppress';

/** Lead sentence of a `<RealLife>` callout (matches the component's visible tag). */
export const REAL_LIFE_LABEL = 'Ví dụ đời sống';

// Every tag the lesson corpus uses (see src/components/lesson/mdx-components.ts
// and docs/content-authoring-guide.md). Anything else is read as content and
// reported, so a new component gets a deliberate reading rule.
const JSX_READING: Readonly<Record<string, JsxReading>> = {
  RealLife: 'content',
  Note: 'content',
  TranslatorNote: 'content',
  Figure: 'content',
  a: 'content',
  details: 'content',
  summary: 'content',
  br: 'space',
  hr: 'space',
  sup: 'drop',
  // Already read once at the start of the lesson.
  Disclaimer: 'drop',
  // Editorial notes about the source, not lesson content.
  ReviewNote: 'suppress',
};

/** Reading rule of a JSX tag, or null for an unknown tag. Fragments (`<>`) read their content. */
export function jsxReadingOf(name: string | null | undefined): JsxReading | null {
  if (!name) return 'content';
  return Object.hasOwn(JSX_READING, name) ? JSX_READING[name] : null;
}

function attributeText(node: MdNode, attrName: string): string {
  const attr = node.attributes?.find((a) => a.type === 'mdxJsxAttribute' && a.name === attrName);
  return attr ? String(jsxAttrValueText(attr)) : '';
}

/**
 * Text read before a JSX tag's children: the RealLife label + title, a Note
 * title, a Figure caption (never `alt`/`credit`: alt duplicates the caption
 * or describes a picture, credit is a source link).
 */
export function jsxLeadText(node: MdNode): string {
  switch (node.name) {
    case 'RealLife': {
      const title = collapseSpaces(attributeText(node, 'title'));
      return title ? `${REAL_LIFE_LABEL}: ${title}` : REAL_LIFE_LABEL;
    }
    case 'Note':
      return attributeText(node, 'title');
    case 'Figure':
      return attributeText(node, 'caption');
    default:
      return '';
  }
}

export type UnknownJsxHandler = (name: string) => void;

function inlineJsxText(node: MdNode, onUnknownJsx: UnknownJsxHandler): string {
  const reading = jsxReadingOf(node.name);
  if (reading === 'space') return ' ';
  if (reading === 'drop' || reading === 'suppress') return '';
  if (reading === null) onUnknownJsx(node.name ?? '');
  const lead = finishSentence(jsxLeadText(node));
  return [lead, inlineText(node.children ?? [], onUnknownJsx)].filter(Boolean).join(' ');
}

function inlineNodeText(node: MdNode, onUnknownJsx: UnknownJsxHandler): string {
  switch (node.type) {
    case 'text':
    case 'inlineCode':
      return node.value ?? '';
    case 'break':
      return ' ';
    case 'mdxJsxTextElement':
    case 'mdxJsxFlowElement':
      return inlineJsxText(node, onUnknownJsx);
    case 'image':
    case 'imageReference':
    case 'footnoteReference':
    case 'mdxTextExpression':
    case 'html':
      return '';
    default:
      return inlineText(node.children ?? [], onUnknownJsx);
  }
}

/** Spoken text of phrasing content (links read their visible text only). */
export function inlineText(nodes: readonly MdNode[], onUnknownJsx: UnknownJsxHandler): string {
  return nodes.map((node) => inlineNodeText(node, onUnknownJsx)).join('');
}

/** NFC + single spaces, trimmed. */
export function collapseSpaces(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

// A paragraph ending in a word, number or closing bracket/quote gets a period
// so the voice pauses between paragraphs instead of running them together.
const NEEDS_FINAL_STOP = /[\p{L}\p{N})\]"'”’»%]$/u;

/** Normalized paragraph ('' when nothing is left to read). */
export function finishSentence(text: string): string {
  const collapsed = collapseSpaces(text);
  if (collapsed === '') return '';
  return NEEDS_FINAL_STOP.test(collapsed) ? `${collapsed}.` : collapsed;
}

function cellText(cell: MdNode, onUnknownJsx: UnknownJsxHandler): string {
  // Trailing punctuation would clash with the "; " joining cells.
  return collapseSpaces(inlineText(cell.children ?? [], onUnknownJsx)).replace(/[\s.;:,]+$/u, '');
}

/**
 * One sentence per GFM data row: "<column>: <value>; …". Empty cells are
 * skipped; a column without a header reads only its value.
 */
export function tableSentences(table: MdNode, onUnknownJsx: UnknownJsxHandler): string[] {
  const [headerRow, ...dataRows] = table.children ?? [];
  if (!headerRow) return [];
  const columnNames = (headerRow.children ?? []).map((cell) => cellText(cell, onUnknownJsx));
  return dataRows
    .map((row) =>
      (row.children ?? [])
        .map((cell, index) => {
          const value = cellText(cell, onUnknownJsx);
          if (value === '') return '';
          const name = columnNames[index] ?? '';
          return name ? `${name}: ${value}` : value;
        })
        .filter(Boolean)
        .join('; '),
    )
    .map(finishSentence)
    .filter(Boolean);
}
