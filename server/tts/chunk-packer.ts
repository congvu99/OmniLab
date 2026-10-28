/**
 * Splits a lesson's speech script into TTS request chunks. Pure.
 * A chunk never spans two chapters, so every `##` chapter starts exactly at a
 * chunk boundary; `###` marks ride along with their character offset inside
 * the chunk text so the encoder can place them approximately.
 */
import type { SpeechChapter } from '../../src/lib/speech-script-contract.ts';

export interface ChunkMark {
  id: string;
  title: string;
  /** Offset (UTF-16 units) of the mark's heading paragraph in `TextChunk.text`. */
  charOffset: number;
}

export interface TextChunk {
  chapterIndex: number;
  text: string;
  marks: ChunkMark[];
}

interface Piece {
  text: string;
  paragraphIndex: number;
  /** First piece of its paragraph: marks attach here, and it is joined with a newline. */
  paragraphStart: boolean;
}

const PARAGRAPH_SEPARATOR = '\n';
const SENTENCE_SEPARATOR = ' ';
// Ranh giới câu: dấu kết câu rồi khoảng trắng; dấu câu ở lại cuối câu trước.
const SENTENCE_BOUNDARY = /(?<=[.!?…])\s+/u;

/** Greedy join of `parts` with `sep` into strings of at most `max` chars. */
function packGreedy(parts: string[], sep: string, max: number): string[] {
  const out: string[] = [];
  let current = '';
  for (const part of parts) {
    if (current === '') current = part;
    else if (current.length + sep.length + part.length <= max) current += sep + part;
    else {
      out.push(current);
      current = part;
    }
  }
  if (current !== '') out.push(current);
  return out;
}

/** Last resort for a single word longer than `max` (e.g. a URL): hard cut. */
function hardSplit(word: string, max: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < word.length; i += max) out.push(word.slice(i, i + max));
  return out;
}

function splitLongSentence(sentence: string, max: number): string[] {
  const words = sentence.split(/\s+/u).filter(Boolean).flatMap((w) => (w.length > max ? hardSplit(w, max) : [w]));
  return packGreedy(words, SENTENCE_SEPARATOR, max);
}

/** Paragraph -> pieces of at most `max` chars: whole, else by sentence, else by whitespace. */
function splitParagraph(paragraph: string, max: number): string[] {
  if (paragraph.length <= max) return [paragraph];
  const sentences = paragraph
    .split(SENTENCE_BOUNDARY)
    .filter(Boolean)
    .flatMap((s) => (s.length > max ? splitLongSentence(s, max) : [s]));
  return packGreedy(sentences, SENTENCE_SEPARATOR, max);
}

function chapterPieces(chapter: SpeechChapter, max: number): Piece[] {
  return chapter.paragraphs.flatMap((paragraph, paragraphIndex) =>
    splitParagraph(paragraph, max).map((text, i) => ({ text, paragraphIndex, paragraphStart: i === 0 })),
  );
}

function packChapter(chapter: SpeechChapter, chapterIndex: number, max: number): TextChunk[] {
  const chunks: TextChunk[] = [];
  let current: TextChunk | undefined;
  for (const piece of chapterPieces(chapter, max)) {
    const sep = piece.paragraphStart ? PARAGRAPH_SEPARATOR : SENTENCE_SEPARATOR;
    if (!current || current.text.length + sep.length + piece.text.length > max) {
      current = { chapterIndex, text: '', marks: [] };
      chunks.push(current);
    }
    const charOffset = current.text === '' ? 0 : current.text.length + sep.length;
    current.text = current.text === '' ? piece.text : current.text + sep + piece.text;
    if (!piece.paragraphStart) continue;
    for (const mark of chapter.marks) {
      if (mark.paragraphIndex === piece.paragraphIndex) current.marks.push({ id: mark.id, title: mark.title, charOffset });
    }
  }
  return chunks;
}

/**
 * Chunks for a whole lesson, in reading order. Every chunk is at most
 * `maxChars` long and joining all chunk texts (whitespace-normalised) gives
 * back the original paragraphs.
 */
export function packChunks(chapters: readonly SpeechChapter[], maxChars: number): TextChunk[] {
  if (!Number.isInteger(maxChars) || maxChars < 1) throw new Error(`packChunks: invalid maxChars ${maxChars}`);
  return chapters.flatMap((chapter, index) => packChapter(chapter, index, maxChars));
}
