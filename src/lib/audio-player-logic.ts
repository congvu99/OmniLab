/**
 * Pure helpers behind the lesson audio player (no DOM): clock text, current
 * chapter lookup, playback-rate clamping, skip targets, and the view model
 * that decides which page headings get a "listen from here" button.
 * Unit-tested in tests/audio-player-logic.test.mjs.
 */
import type { AudioChapter, AudioEntry } from './audio-manifest';
import { INTRO_CHAPTER_ID } from './speech-script-contract';
import { pad2 } from './lesson-reader-model';

/** Choices of the speed `<select>`, also the clamp range of a stored rate. */
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export const MIN_PLAYBACK_RATE = PLAYBACK_RATES[0];
export const MAX_PLAYBACK_RATE = PLAYBACK_RATES[PLAYBACK_RATES.length - 1];
export const DEFAULT_PLAYBACK_RATE = 1;
/** Step of the back/forward buttons and the Media Session seek actions. */
export const SKIP_SECONDS = 15;

/** Live-region / card messages of the player. */
export const PLAYER_MESSAGES = {
  playing: 'Đang phát',
  paused: 'Đã tạm dừng',
  ended: 'Đã nghe hết bài',
  error: 'Không phát được bản nghe. Thử lại sau.',
  play: 'Phát',
  pause: 'Tạm dừng',
  headingChapter: 'Nghe từ mục này',
  headingMark: 'Nghe từ đây',
  approxSuffix: '(vị trí gần đúng)',
  playingFrom: (title: string) => `Đang phát từ mục ${title}`,
  rate: (rateLabel: string) => `Tốc độ ${rateLabel}`,
} as const;

/**
 * Accessible name of a "listen from here" button after a heading: the visible
 * text first (voice control), then the section title so screen-reader button
 * lists can tell the buttons apart.
 */
export function headingButtonLabel(depth: 2 | 3, title: string, approx: boolean): string {
  const visible = depth === 2 ? PLAYER_MESSAGES.headingChapter : PLAYER_MESSAGES.headingMark;
  return `${visible}${approx ? ` ${PLAYER_MESSAGES.approxSuffix}` : ''}: ${title}`;
}

/** What the UI renders; produced by the controller on every change. */
export interface PlayerSnapshot {
  playing: boolean;
  /** Seconds; a pending (not yet applied) seek already counts. */
  position: number;
  duration: number;
  rate: number;
  /** Index into `entry.chapters` being heard, -1 before the first. */
  chapterIndex: number;
  hasError: boolean;
}

export type MediaActionName = 'play' | 'pause' | 'seekbackward' | 'seekforward' | 'seekto';
export const MEDIA_ACTIONS: readonly MediaActionName[] = ['play', 'pause', 'seekbackward', 'seekforward', 'seekto'];
export type MediaActionCallback = (details: { seekTime?: number }) => void;

/** The single <audio> element as the controller uses it (faked in tests). */
export interface AudioElementLike {
  src: string;
  preload: string;
  currentTime: number;
  readonly duration: number;
  readonly readyState: number;
  readonly paused: boolean;
  playbackRate: number;
  defaultPlaybackRate: number;
  play(): Promise<void> | undefined;
  pause(): void;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

/** Thin wrapper over `navigator.mediaSession` (lock screen / headset controls). */
export interface MediaSessionAdapter {
  setMetadata(metadata: { title: string; artist: string; album: string } | null): void;
  setActionHandler(action: MediaActionName, handler: MediaActionCallback | null): void;
  setPositionState(state: { duration: number; playbackRate: number; position: number }): void;
  setPlaybackState(state: 'playing' | 'paused' | 'none'): void;
}

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

/** "0:00", "12:03", "1:02:09"; NaN / negative / Infinity -> "0:00". */
export function formatClock(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(total / SECONDS_PER_HOUR);
  const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const secs = total % SECONDS_PER_MINUTE;
  return hours > 0 ? `${hours}:${pad2(minutes)}:${pad2(secs)}` : `${minutes}:${pad2(secs)}`;
}

/** Whole minutes for the card header ("32 phút"); never below 1. */
export function formatListenMinutes(seconds: number): string {
  const minutes = Number.isFinite(seconds) ? Math.max(1, Math.round(seconds / SECONDS_PER_MINUTE)) : 1;
  return `${minutes} phút`;
}

/** "1,5x": Vietnamese decimal comma, as read by the speed select. */
export function formatRate(rate: number): string {
  return `${String(rate).replace('.', ',')}x`;
}

/** Stored or requested speed kept inside [0.75, 2]; garbage -> 1. */
export function clampRate(rate: unknown): number {
  if (typeof rate !== 'number' || !Number.isFinite(rate)) return DEFAULT_PLAYBACK_RATE;
  return Math.min(MAX_PLAYBACK_RATE, Math.max(MIN_PLAYBACK_RATE, rate));
}

/** `current + delta` kept inside [0, duration] (duration unknown -> only >= 0). */
export function skipTarget(current: number, delta: number, duration: number): number {
  const from = Number.isFinite(current) ? current : 0;
  const target = Math.max(0, from + delta);
  return Number.isFinite(duration) && duration > 0 ? Math.min(duration, target) : target;
}

/**
 * Index of the chapter/mark being heard at `seconds`: the last one whose
 * start has been reached (`chapters` sorted by startSec). -1 before the first.
 */
export function chapterIndexAt(chapters: readonly Pick<AudioChapter, 'startSec'>[], seconds: number): number {
  let active = -1;
  for (let i = 0; i < chapters.length; i++) {
    if (chapters[i].startSec <= seconds) active = i;
    else break;
  }
  return active;
}

/** A heading the page actually renders inside the lesson body. */
export interface PageHeading {
  id: string;
  /** 2 for `<h2>`, 3 for `<h3>`. */
  depth: number;
}

export interface AudioViewChapter extends AudioChapter {
  /** True when the page shows a matching heading that gets a listen button. */
  hasHeadingButton: boolean;
}

export interface AudioView {
  /** The audio was generated from an older text of the lesson. */
  isPreviousVersion: boolean;
  chapters: AudioViewChapter[];
}

/**
 * Joins the manifest entry with the rendered page. Every chapter/mark stays
 * in the list (old-version ones still seek), but only those whose heading id
 * exists on the page at the same depth get a button; the intro never does.
 */
export function resolveAudioView(entry: AudioEntry, pageHash: string, pageHeadings: readonly PageHeading[]): AudioView {
  const depthById = new Map(pageHeadings.map((h) => [h.id, h.depth]));
  return {
    isPreviousVersion: entry.scriptHash !== pageHash,
    chapters: entry.chapters.map((chapter) => ({
      ...chapter,
      hasHeadingButton: chapter.id !== INTRO_CHAPTER_ID && depthById.get(chapter.id) === chapter.depth,
    })),
  };
}
