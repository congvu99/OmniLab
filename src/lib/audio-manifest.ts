/**
 * Data contract of `/audio/manifest.json`, written by the TTS worker and read
 * by the lesson player in the browser. Pure and erasable-only (no DOM, no
 * astro:content, no enum) so both runtimes import the same file.
 *
 * Parsing is deliberately lenient: a bad entry only costs that lesson its
 * player (it hides), never the whole page, and an unknown version yields an
 * empty manifest. File names are validated so a tampered manifest can never
 * point the player outside `/audio/`.
 */
import { LESSON_ID_PATTERN } from './progress-state.ts';

export const AUDIO_MANIFEST_VERSION = 1;

/** Hex chars of `audioKey` kept in the file name: enough to never collide per lesson. */
export const AUDIO_KEY_FILE_CHARS = 12;

/**
 * `<domain>.<module>.<slug>.<12 hex>.m4a`. `.` is not allowed in a lesson id
 * segment (LESSON_ID_PATTERN), so the name maps back to exactly one lesson.
 */
export const AUDIO_FILE_PATTERN = /^[a-z0-9-]+\.[a-z0-9-]+\.[a-z0-9-]+\.[0-9a-f]{12}\.m4a$/;

export interface AudioChapter {
  /** Heading slug, or INTRO_CHAPTER_ID for the opening chapter. */
  id: string;
  title: string;
  startSec: number;
  /** 2 = `##` chapter (or the intro), 3 = `###` mark. */
  depth: 2 | 3;
  /** True for `###` marks, estimated from character ratios inside a chunk. */
  approx: boolean;
}

export interface AudioEntry {
  /** Hash of the speech script the audio was generated from (compared with the page's). */
  scriptHash: string;
  /** scriptHash + model + voice + style + chunk size; changes force regeneration. */
  audioKey: string;
  /** Bare file name under `/audio/`, see AUDIO_FILE_PATTERN. */
  file: string;
  durationSec: number;
  /** Sorted by `startSec`. */
  chapters: AudioChapter[];
  /** ISO timestamp. */
  generatedAt: string;
  model: string;
  voice: string;
}

export interface AudioManifest {
  v: typeof AUDIO_MANIFEST_VERSION;
  /** ISO timestamp of the last write. */
  updatedAt: string;
  lessons: Record<string, AudioEntry>;
}

export function emptyAudioManifest(): AudioManifest {
  return { v: AUDIO_MANIFEST_VERSION, updatedAt: '', lessons: {} };
}

/** Throws on an invalid lesson id or an audioKey shorter than 12 lowercase hex chars. */
export function audioFileName(lessonId: string, audioKey: string): string {
  if (!LESSON_ID_PATTERN.test(lessonId)) throw new Error(`audioFileName: invalid lesson id "${lessonId}"`);
  const prefix = audioKey.slice(0, AUDIO_KEY_FILE_CHARS);
  if (!/^[0-9a-f]{12}$/.test(prefix)) throw new Error('audioFileName: audioKey must start with 12 lowercase hex chars');
  return `${lessonId.replaceAll('/', '.')}.${prefix}.m4a`;
}

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}

function isSeconds(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function parseChapter(raw: unknown): AudioChapter | null {
  if (!isObject(raw)) return null;
  const { id, title, startSec, depth, approx } = raw;
  if (!isText(id) || typeof title !== 'string' || !isSeconds(startSec)) return null;
  if ((depth !== 2 && depth !== 3) || typeof approx !== 'boolean') return null;
  return { id, title, startSec, depth, approx };
}

function parseEntry(lessonId: string, raw: unknown): AudioEntry | null {
  if (!isObject(raw)) return null;
  const { scriptHash, audioKey, file, durationSec, chapters, generatedAt, model, voice } = raw;
  if (!isText(scriptHash) || !isText(audioKey) || !isText(generatedAt) || !isText(model) || !isText(voice)) return null;
  if (!isText(file) || !AUDIO_FILE_PATTERN.test(file)) return null;
  // The file must belong to this lesson, never to another one.
  if (!file.startsWith(`${lessonId.replaceAll('/', '.')}.`)) return null;
  if (!isSeconds(durationSec) || durationSec === 0 || !Array.isArray(chapters)) return null;
  const parsedChapters = chapters
    .map(parseChapter)
    .filter((c): c is AudioChapter => c !== null)
    .sort((a, b) => a.startSec - b.startSec);
  return { scriptHash, audioKey, file, durationSec, chapters: parsedChapters, generatedAt, model, voice };
}

/**
 * Lenient parser for a JSON string or an already parsed value. Never throws:
 * invalid JSON or another version gives an empty manifest; a malformed entry
 * (or one whose `file` fails AUDIO_FILE_PATTERN) is dropped; a malformed
 * chapter is dropped from its entry.
 */
export function parseAudioManifest(raw: unknown): AudioManifest {
  let value = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return emptyAudioManifest();
    }
  }
  if (!isObject(value) || value.v !== AUDIO_MANIFEST_VERSION || !isObject(value.lessons)) return emptyAudioManifest();
  const lessons: Record<string, AudioEntry> = {};
  for (const [lessonId, rawEntry] of Object.entries(value.lessons)) {
    if (!LESSON_ID_PATTERN.test(lessonId)) continue;
    const entry = parseEntry(lessonId, rawEntry);
    if (entry) lessons[lessonId] = entry;
  }
  return { v: AUDIO_MANIFEST_VERSION, updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '', lessons };
}
