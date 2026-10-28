/**
 * What the worker should generate next. Pure: the audioKey, the worker state
 * shape (`work/state.json`) with a defensive parser, and the ordered queue
 * (resumable first, then missing, then stale, each in course order).
 */
import { createHash } from 'node:crypto';
import type { SpeechLesson } from '../../src/lib/speech-script-contract.ts';
import type { AudioManifest } from '../../src/lib/audio-manifest.ts';
import { LESSON_ID_PATTERN } from '../../src/lib/progress-state.ts';
import { AUDIO_PIPELINE_VERSION } from './tts-config.ts';
import { isObject } from './tts-common.ts';

export const STATE_VERSION = 1;
export const AUDIO_KEY_PATTERN = /^[0-9a-f]{64}$/;
const FAILURE_REASON_MAX_CHARS = 300;

export interface FailedRecord {
  lessonId: string;
  at: number;
  retryAfter: number;
  reason: string;
}

export type RetiredKind = 'replaced' | 'removed';

export interface RetiredRecord {
  at: number;
  kind: RetiredKind;
}

/** `work/state.json`. Times are epoch milliseconds. */
export interface TtsState {
  v: typeof STATE_VERSION;
  pausedUntil?: number;
  failed: Record<string, FailedRecord>;
  retired: Record<string, RetiredRecord>;
}

export interface AudioKeyInput {
  scriptHash: string;
  model: string;
  voice: string;
  style: string;
  maxChunkChars: number;
}

/** sha256 of everything that changes the audio; a change regenerates the whole lesson. */
export function computeAudioKey(input: AudioKeyInput): string {
  const parts = [input.scriptHash, input.model, input.voice, input.style, input.maxChunkChars, AUDIO_PIPELINE_VERSION];
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

export function emptyTtsState(): TtsState {
  return { v: STATE_VERSION, failed: {}, retired: {} };
}

const isTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

function parseFailed(raw: unknown): FailedRecord | null {
  if (!isObject(raw)) return null;
  const { lessonId, at, retryAfter, reason } = raw;
  if (typeof lessonId !== 'string' || !LESSON_ID_PATTERN.test(lessonId) || !isTime(at) || !isTime(retryAfter)) return null;
  return { lessonId, at, retryAfter, reason: typeof reason === 'string' ? reason : '' };
}

function parseRetired(raw: unknown): RetiredRecord | null {
  if (!isObject(raw) || !isTime(raw.at) || (raw.kind !== 'replaced' && raw.kind !== 'removed')) return null;
  return { at: raw.at, kind: raw.kind };
}

/** Lenient parser: malformed records are dropped; a wrong shape or version gives `null`. */
export function parseTtsState(raw: unknown): TtsState | null {
  if (!isObject(raw) || raw.v !== STATE_VERSION || !isObject(raw.failed) || !isObject(raw.retired)) return null;
  const state = emptyTtsState();
  if (isTime(raw.pausedUntil)) state.pausedUntil = raw.pausedUntil;
  for (const [key, value] of Object.entries(raw.failed)) {
    const record = parseFailed(value);
    if (record && AUDIO_KEY_PATTERN.test(key)) state.failed[key] = record;
  }
  for (const [file, value] of Object.entries(raw.retired)) {
    const record = parseRetired(value);
    if (record) state.retired[file] = record;
  }
  return state;
}

export function failedRecord(lessonId: string, now: number, retryAfterMs: number, reason: string): FailedRecord {
  return { lessonId, at: now, retryAfter: now + retryAfterMs, reason: reason.slice(0, FAILURE_REASON_MAX_CHARS) };
}

/** Drops every failed record of `lessonId`; returns whether anything changed. */
export function clearFailedForLesson(state: TtsState, lessonId: string): boolean {
  const keys = Object.keys(state.failed).filter((key) => state.failed[key].lessonId === lessonId);
  for (const key of keys) delete state.failed[key];
  return keys.length > 0;
}

export type WorkReason = 'resume' | 'missing' | 'stale';

export interface WorkItem {
  lesson: SpeechLesson;
  audioKey: string;
  reason: WorkReason;
}

export interface WorkQueueInput {
  lessons: readonly SpeechLesson[];
  /** lessonId -> target audioKey (see `targetKeys`). */
  targets: ReadonlyMap<string, string>;
  manifest: AudioManifest;
  state: TtsState;
  /** `${lessonId}/${audioKey}` of existing work directories. */
  workDirs: ReadonlySet<string>;
  now: number;
  only?: string;
}

export interface WorkQueue {
  queue: WorkItem[];
  counts: { missing: number; stale: number; failed: number };
}

export function targetKeys(lessons: readonly SpeechLesson[], config: Omit<AudioKeyInput, 'scriptHash'>): Map<string, string> {
  return new Map(lessons.map((lesson) => [lesson.id, computeAudioKey({ ...config, scriptHash: lesson.scriptHash })]));
}

/** Ordered work for one cycle; lessons whose target key already failed wait for `retryAfter`. */
export function buildWorkQueue(input: WorkQueueInput): WorkQueue {
  const groups: Record<WorkReason, WorkItem[]> = { resume: [], missing: [], stale: [] };
  let failed = 0;
  for (const lesson of input.lessons) {
    if (input.only !== undefined && lesson.id !== input.only) continue;
    const audioKey = input.targets.get(lesson.id);
    const entry = input.manifest.lessons[lesson.id];
    if (!audioKey || entry?.audioKey === audioKey) continue;
    const failure = input.state.failed[audioKey];
    if (failure?.lessonId === lesson.id && failure.retryAfter > input.now) {
      failed++;
      continue;
    }
    let reason: WorkReason = entry ? 'stale' : 'missing';
    // Bài đang dở luôn làm trước để không có nhiều thư mục work dở cùng lúc.
    if (input.workDirs.has(`${lesson.id}/${audioKey}`)) reason = 'resume';
    groups[reason].push({ lesson, audioKey, reason });
  }
  return {
    queue: [...groups.resume, ...groups.missing, ...groups.stale],
    counts: { missing: groups.missing.length, stale: groups.stale.length, failed },
  };
}
