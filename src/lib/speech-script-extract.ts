/**
 * Lesson MDX -> speech script (chapters of paragraphs + approximate `###`
 * marks) for the TTS worker. Fixed rules, no LLM; the inline rules live in
 * ./speech-script-text.ts. Build-time only: parses with the same remark stack
 * as verify-fidelity (scripts/lib/mdx-text-extract.mjs). Separate from
 * mdxToPlainText on purpose: that one feeds search and reading time.
 *
 * Chapter/mark ids are never re-slugged here: they come from Astro's own
 * `render(entry).headings`, paired in document order with every heading of
 * the AST (including headings nested in JSX). Any disagreement falls back to
 * a single intro chapter so a lesson stays listenable without wrong anchors.
 */
import { createHash } from 'node:crypto';
import { parseMdx } from '../../scripts/lib/mdx-text-extract.mjs';
import { DISCLAIMER_LABEL, DISCLAIMER_TEXT } from './disclaimer-copy';
import { findTitleDuplicate, type ReaderHeading } from './lesson-reader-model';
import {
  INTRO_CHAPTER_ID,
  INTRO_CHAPTER_TITLE,
  speechScriptHashInput,
  type SpeechChapter,
  type SpeechLesson,
} from './speech-script-contract';
import {
  alignHeadings,
  collapseSpaces,
  collectHeadings,
  containsJsx,
  finishSentence,
  headingPlainText,
  inlineText,
  jsxLeadText,
  jsxReadingOf,
  tableSentences,
  type MdNode,
} from './speech-script-text';

/** Read in place of a code fence: code is unreadable aloud, the page shows it. */
export const CODE_BLOCK_SENTENCE = 'Đoạn mã, xem trên màn hình.';
export const DISCLAIMER_SENTENCE = `${DISCLAIMER_LABEL} ${DISCLAIMER_TEXT}`;
export const HEADING_MISMATCH_WARNING = 'heading mismatch';

export interface SpeechExtractInput {
  /** MDX body (frontmatter already stripped, like `entry.body`). */
  body: string;
  title: string;
  /** `render(entry).headings`: the slugs the page really carries. */
  headings: readonly ReaderHeading[];
  /** Domain renders a page-level Disclaimer (`isFinance`). */
  hasPageDisclaimer: boolean;
}

export interface SpeechExtractResult {
  chapters: SpeechChapter[];
  /** e.g. "heading mismatch", "unknown JSX <Foo>"; never fatal. */
  warnings: string[];
}

const PHRASING_TYPES = new Set(['text', 'emphasis', 'strong', 'delete', 'inlineCode', 'link', 'linkReference', 'break', 'image', 'imageReference', 'footnoteReference', 'mdxJsxTextElement', 'mdxTextExpression', 'html']);
const SILENT_BLOCK_TYPES = new Set(['yaml', 'mdxjsEsm', 'mdxFlowExpression', 'thematicBreak', 'definition', 'html']);

interface WalkState {
  chapters: SpeechChapter[];
  /** Rendered heading per AST heading node (empty in the unstructured fallback). */
  headingOf: Map<MdNode, ReaderHeading>;
  structured: boolean;
  titleDuplicate: MdNode | undefined;
  suppressDepth: number;
  warnings: Set<string>;
}

function currentChapter(state: WalkState): SpeechChapter {
  return state.chapters[state.chapters.length - 1];
}

function emit(state: WalkState, text: string): void {
  if (state.suppressDepth > 0) return;
  const paragraph = finishSentence(text);
  if (paragraph) currentChapter(state).paragraphs.push(paragraph);
}

const onUnknown = (state: WalkState) => (name: string) => state.warnings.add(`unknown JSX <${name}>`);

function handleHeading(state: WalkState, node: MdNode): void {
  // Already read as the lesson title at the very start.
  if (node === state.titleDuplicate) return;
  const heading = state.headingOf.get(node);
  if (state.structured && heading && node.depth === 2) {
    state.chapters.push({ id: heading.slug, title: collapseSpaces(heading.text), paragraphs: [], marks: [] });
  } else if (state.structured && heading && node.depth === 3) {
    const chapter = currentChapter(state);
    chapter.marks.push({ id: heading.slug, title: collapseSpaces(heading.text), paragraphIndex: chapter.paragraphs.length });
  }
  emit(state, inlineText(node.children ?? [], onUnknown(state)));
}

function handleJsxFlow(state: WalkState, node: MdNode): void {
  const reading = jsxReadingOf(node.name);
  if (reading === 'space' || reading === 'drop') return;
  if (reading === 'suppress') {
    state.suppressDepth += 1;
    walkBlocks(state, node.children ?? []);
    state.suppressDepth -= 1;
    return;
  }
  if (reading === null) onUnknown(state)(node.name ?? '');
  emit(state, jsxLeadText(node));
  walkBlocks(state, node.children ?? []);
}

function walkBlock(state: WalkState, node: MdNode): void {
  if (SILENT_BLOCK_TYPES.has(node.type)) return;
  switch (node.type) {
    case 'heading':
      return handleHeading(state, node);
    case 'paragraph':
      return emit(state, inlineText(node.children ?? [], onUnknown(state)));
    case 'code':
      return emit(state, CODE_BLOCK_SENTENCE);
    case 'table':
      for (const sentence of tableSentences(node, onUnknown(state))) emit(state, sentence);
      return;
    case 'mdxJsxFlowElement':
      return handleJsxFlow(state, node);
    default:
      // blockquote, list, listItem, footnoteDefinition…: each child block is its own paragraph.
      walkBlocks(state, node.children ?? []);
  }
}

/** Block children; loose phrasing (e.g. a one-line `<summary>`) is grouped into one paragraph. */
function walkBlocks(state: WalkState, nodes: readonly MdNode[]): void {
  let phrasing: MdNode[] = [];
  const flush = (): void => {
    if (phrasing.length > 0) emit(state, inlineText(phrasing, onUnknown(state)));
    phrasing = [];
  };
  for (const node of nodes) {
    if (PHRASING_TYPES.has(node.type)) {
      phrasing.push(node);
      continue;
    }
    flush();
    walkBlock(state, node);
  }
  flush();
}

/** Pure MDX -> chapters. Throws only if the MDX itself does not parse. */
export function extractSpeechChapters(input: SpeechExtractInput): SpeechExtractResult {
  const tree = parseMdx(input.body) as MdNode;
  const astHeadings = collectHeadings(tree);
  const aligned = alignHeadings(astHeadings, input.headings);
  const duplicate = findTitleDuplicate(
    astHeadings.map((node) => ({ depth: node.depth ?? 0, slug: '', text: headingPlainText(node) })),
    input.title,
  );
  const intro: SpeechChapter = { id: INTRO_CHAPTER_ID, title: INTRO_CHAPTER_TITLE, paragraphs: [], marks: [] };
  const state: WalkState = {
    chapters: [intro],
    headingOf: aligned ?? new Map(),
    structured: aligned !== null,
    titleDuplicate: duplicate ? astHeadings[0] : undefined,
    suppressDepth: 0,
    warnings: new Set(aligned ? [] : [HEADING_MISMATCH_WARNING]),
  };
  emit(state, input.title);
  if (input.hasPageDisclaimer || containsJsx(tree, 'Disclaimer')) emit(state, DISCLAIMER_SENTENCE);
  walkBlocks(state, tree.children ?? []);

  // A chapter with nothing to read (e.g. only a ReviewNote) is dropped with its marks.
  const chapters = state.chapters
    .filter((chapter) => chapter.paragraphs.length > 0)
    .map((chapter) => ({ ...chapter, marks: chapter.marks.filter((m) => m.paragraphIndex < chapter.paragraphs.length) }));
  return { chapters, warnings: [...state.warnings] };
}

export interface SpeechLessonSource extends SpeechExtractInput {
  id: string;
}

export type SpeechWarn = (message: string) => void;

/**
 * One lesson's speech script with its `scriptHash`, or null when extraction
 * throws: a broken lesson only loses its audio, never the site build.
 * Every warning is reported as `[tts-scripts] <warning> <lessonId>`.
 */
export function buildSpeechLesson(source: SpeechLessonSource, warn: SpeechWarn): SpeechLesson | null {
  try {
    const { chapters, warnings } = extractSpeechChapters(source);
    for (const warning of warnings) warn(`[tts-scripts] ${warning} ${source.id}`);
    const scriptHash = createHash('sha256').update(speechScriptHashInput(chapters)).digest('hex');
    return { id: source.id, title: collapseSpaces(source.title), scriptHash, chapters };
  } catch (error) {
    warn(`[tts-scripts] skipped ${source.id}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
