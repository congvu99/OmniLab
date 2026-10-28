/**
 * Device-local memory of the lesson audio player: the chosen speed (shared by
 * every lesson) and where each lesson was left off. Stored under its own key,
 * never inside `omnilab:v1:state` (that one syncs to the server; listening
 * positions are deliberately not synced). Parsing never throws; when storage
 * is blocked (Safari private mode) the store keeps working in memory.
 */
import { LESSON_ID_PATTERN } from './progress-state';
import { clampRate, DEFAULT_PLAYBACK_RATE } from './audio-player-logic';

export const AUDIO_STORAGE_KEY = 'omnilab:v1:audio';
/** Only the most recently heard lessons are remembered. */
export const MAX_REMEMBERED_LESSONS = 50;
/** A position this close to the end counts as finished: start over instead. */
export const RESUME_TAIL_SECONDS = 5;

export interface AudioPosition {
  /** Seconds into the audio. */
  t: number;
  /** `audioKey` of the file the position belongs to. */
  key: string;
  /** Epoch ms of the last save, used to evict the oldest lessons. */
  at: number;
}

export interface AudioPrefsState {
  v: 1;
  rate: number;
  byLesson: Record<string, AudioPosition>;
}

export type AudioStorage = Pick<Storage, 'getItem' | 'setItem'>;

export interface AudioPositionStore {
  getRate(): number;
  setRate(rate: number): void;
  /** Saved seconds for this exact audio file, or null (none / other file / at the end). */
  getResumeTime(lessonId: string, audioKey: string, durationSec: number): number | null;
  savePosition(lessonId: string, audioKey: string, seconds: number): void;
  clearPosition(lessonId: string): void;
}

const emptyState = (): AudioPrefsState => ({ v: 1, rate: DEFAULT_PLAYBACK_RATE, byLesson: {} });

function parsePosition(raw: unknown): AudioPosition | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { t, key, at } = raw as Record<string, unknown>;
  if (typeof t !== 'number' || !Number.isFinite(t) || t < 0) return null;
  if (typeof key !== 'string' || key === '' || typeof at !== 'number' || !Number.isFinite(at)) return null;
  return { t, key, at };
}

/** Lenient parse: bad JSON / other version -> empty state; bad lessons are dropped. */
export function parseAudioState(raw: string | null | undefined): AudioPrefsState {
  if (!raw) return emptyState();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyState();
  }
  if (typeof data !== 'object' || data === null || (data as { v?: unknown }).v !== 1) return emptyState();
  const { rate, byLesson } = data as Record<string, unknown>;
  const state: AudioPrefsState = { v: 1, rate: clampRate(rate), byLesson: {} };
  if (typeof byLesson !== 'object' || byLesson === null) return state;
  for (const [lessonId, value] of Object.entries(byLesson)) {
    const position = parsePosition(value);
    if (position && LESSON_ID_PATTERN.test(lessonId)) state.byLesson[lessonId] = position;
  }
  return state;
}

/** Keeps the `limit` most recently saved lessons. */
function trimLessons(byLesson: Record<string, AudioPosition>, limit: number): Record<string, AudioPosition> {
  const entries = Object.entries(byLesson);
  if (entries.length <= limit) return byLesson;
  return Object.fromEntries(entries.sort((a, b) => b[1].at - a[1].at).slice(0, limit));
}

function defaultStorage(): AudioStorage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    // Reading the property itself throws in some locked-down contexts.
    return undefined;
  }
}

export interface CreateAudioPositionStoreOptions {
  storage?: AudioStorage;
  now?: () => number;
}

export function createAudioPositionStore(options: CreateAudioPositionStoreOptions = {}): AudioPositionStore {
  const storage = 'storage' in options ? options.storage : defaultStorage();
  const now = options.now ?? Date.now;
  let memory = emptyState();
  // Once a read or write fails the in-memory copy becomes the source of truth.
  let storageUsable = storage !== undefined;

  function load(): AudioPrefsState {
    if (!storageUsable || !storage) return memory;
    try {
      memory = parseAudioState(storage.getItem(AUDIO_STORAGE_KEY));
    } catch {
      storageUsable = false;
    }
    return memory;
  }

  function save(state: AudioPrefsState): void {
    memory = { ...state, byLesson: trimLessons(state.byLesson, MAX_REMEMBERED_LESSONS) };
    if (!storageUsable || !storage) return;
    try {
      storage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(memory));
    } catch {
      storageUsable = false;
    }
  }

  return {
    getRate: () => load().rate,
    setRate(rate) {
      save({ ...load(), rate: clampRate(rate) });
    },
    getResumeTime(lessonId, audioKey, durationSec) {
      const position = load().byLesson[lessonId];
      if (!position || position.key !== audioKey || position.t <= 0) return null;
      return durationSec - position.t > RESUME_TAIL_SECONDS ? position.t : null;
    },
    savePosition(lessonId, audioKey, seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return;
      const state = load();
      save({ ...state, byLesson: { ...state.byLesson, [lessonId]: { t: seconds, key: audioKey, at: now() } } });
    },
    clearPosition(lessonId) {
      const state = load();
      if (!(lessonId in state.byLesson)) return;
      const byLesson = { ...state.byLesson };
      delete byLesson[lessonId];
      save({ ...state, byLesson });
    },
  };
}
