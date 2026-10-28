/**
 * Data contract of `/tts-scripts.json`: the per-lesson speech script built
 * from MDX at build time (src/pages/tts-scripts.json.ts) and consumed by the
 * TTS worker. Pure and erasable-only (no astro:content, no DOM, no enum) so
 * the Node worker can import it via type stripping. Relative imports keep the
 * `.ts` extension for the same reason.
 */
import { LESSON_ID_PATTERN } from './progress-state.ts';

/**
 * Bump whenever the reading rules change (what is read, how it is phrased):
 * it is part of every `scriptHash`, so the worker regenerates every lesson.
 */
export const SPEECH_EXTRACTOR_VERSION = 1;
export const SPEECH_SCRIPTS_FILE_VERSION = 1;

/**
 * Content before the first `##` (title sentence, disclaimer, `###` marks of
 * lessons without `##`). github-slugger strips `:`, so this id can never
 * collide with a real heading slug.
 */
export const INTRO_CHAPTER_ID = ':intro';
export const INTRO_CHAPTER_TITLE = 'Mở đầu';

/** An approximate `###` position inside a chapter (no extra TTS request). */
export interface SpeechMark {
  /** Heading slug from `render(entry).headings`. */
  id: string;
  title: string;
  /** Index into the chapter's `paragraphs` of the paragraph that reads this heading. */
  paragraphIndex: number;
}

/** One `##` section (exact chunk boundary for the worker). */
export interface SpeechChapter {
  id: string;
  title: string;
  /** Non-empty, normalized paragraphs, read in order. */
  paragraphs: string[];
  marks: SpeechMark[];
}

export interface SpeechLesson {
  /** `domain/module/slug` (see src/lib/lesson-id.ts). */
  id: string;
  title: string;
  /** sha256 hex of `speechScriptHashInput(chapters)`. */
  scriptHash: string;
  chapters: SpeechChapter[];
}

export interface SpeechScriptsFile {
  v: typeof SPEECH_SCRIPTS_FILE_VERSION;
  extractorVersion: number;
  lessons: SpeechLesson[];
}

/**
 * Canonical string hashed into `scriptHash`. Fields are re-listed explicitly
 * so the key order (and thus the hash) does not depend on how the objects
 * were built, letting the worker re-verify a parsed file. Voice/model/chunk
 * size are deliberately absent: they are worker runtime config (`audioKey`).
 */
export function speechScriptHashInput(chapters: readonly SpeechChapter[]): string {
  return JSON.stringify({
    v: SPEECH_EXTRACTOR_VERSION,
    chapters: chapters.map((c) => ({
      id: c.id,
      title: c.title,
      paragraphs: c.paragraphs,
      marks: c.marks.map((m) => ({ id: m.id, title: m.title, paragraphIndex: m.paragraphIndex })),
    })),
  });
}

const SCRIPT_HASH_PATTERN = /^[0-9a-f]{64}$/;

type Json = Record<string, unknown>;

function fail(path: string, problem: string): never {
  throw new Error(`tts-scripts: ${path} ${problem}`);
}

function asObject(value: unknown, path: string): Json {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(path, 'must be an object');
  return value as Json;
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, 'must be an array');
  return value;
}

function asText(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim() === '') fail(path, 'must be a non-empty string');
  return value;
}

function parseMark(raw: unknown, path: string, paragraphCount: number): SpeechMark {
  const obj = asObject(raw, path);
  const index = obj.paragraphIndex;
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= paragraphCount) {
    fail(`${path}.paragraphIndex`, `must be an integer in [0, ${paragraphCount})`);
  }
  return { id: asText(obj.id, `${path}.id`), title: asText(obj.title, `${path}.title`), paragraphIndex: index };
}

function parseChapter(raw: unknown, path: string): SpeechChapter {
  const obj = asObject(raw, path);
  const paragraphs = asArray(obj.paragraphs, `${path}.paragraphs`).map((p, i) => asText(p, `${path}.paragraphs[${i}]`));
  if (paragraphs.length === 0) fail(`${path}.paragraphs`, 'must not be empty');
  const marks = asArray(obj.marks, `${path}.marks`).map((m, i) => parseMark(m, `${path}.marks[${i}]`, paragraphs.length));
  return { id: asText(obj.id, `${path}.id`), title: asText(obj.title, `${path}.title`), paragraphs, marks };
}

function parseLesson(raw: unknown, path: string): SpeechLesson {
  const obj = asObject(raw, path);
  const id = asText(obj.id, `${path}.id`);
  if (!LESSON_ID_PATTERN.test(id)) fail(`${path}.id`, `"${id}" is not a domain/module/slug lesson id`);
  const scriptHash = asText(obj.scriptHash, `${path}.scriptHash`);
  if (!SCRIPT_HASH_PATTERN.test(scriptHash)) fail(`${path}.scriptHash`, 'must be 64 lowercase hex chars');
  const chapters = asArray(obj.chapters, `${path}.chapters`).map((c, i) => parseChapter(c, `${path}.chapters[${i}]`));
  if (chapters.length === 0) fail(`${path}.chapters`, 'must not be empty');
  const ids = new Set<string>();
  for (const anchor of chapters.flatMap((c) => [c.id, ...c.marks.map((m) => m.id)])) {
    if (ids.has(anchor)) fail(`${path}`, `has duplicate chapter/mark id "${anchor}"`);
    ids.add(anchor);
  }
  return { id, title: asText(obj.title, `${path}.title`), scriptHash, chapters };
}

/**
 * Strict parser for `/tts-scripts.json` (a JSON string or an already parsed
 * value). Throws a readable Error naming the first offending path, so a
 * corrupt build output is rejected as a whole instead of half-processed.
 */
export function parseSpeechScripts(raw: unknown): SpeechScriptsFile {
  let value = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch (error) {
      throw new Error(`tts-scripts: invalid JSON (${(error as Error).message})`);
    }
  }
  const root = asObject(value, 'root');
  if (root.v !== SPEECH_SCRIPTS_FILE_VERSION) fail('root.v', `must be ${SPEECH_SCRIPTS_FILE_VERSION}`);
  const extractorVersion = root.extractorVersion;
  if (typeof extractorVersion !== 'number' || !Number.isInteger(extractorVersion) || extractorVersion < 1) {
    fail('root.extractorVersion', 'must be a positive integer');
  }
  const lessons = asArray(root.lessons, 'root.lessons').map((l, i) => parseLesson(l, `lessons[${i}]`));
  const seen = new Set<string>();
  for (const lesson of lessons) {
    if (seen.has(lesson.id)) fail('root.lessons', `has duplicate lesson id "${lesson.id}"`);
    seen.add(lesson.id);
  }
  return { v: SPEECH_SCRIPTS_FILE_VERSION, extractorVersion, lessons };
}
