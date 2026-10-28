/**
 * Lesson audio player state machine, DOM-free: drives one injected audio-like
 * element (the page's single `<audio preload="metadata">`), the position store
 * and an optional Media Session adapter. Tested against a fake audio that
 * behaves like iOS Safari (tests/audio-player-controller.test.mjs). iOS rules:
 * - `play()` runs synchronously inside the user's gesture (no await/timer first).
 * - `currentTime` is set only after metadata; earlier seeks wait in
 *   `pendingSeek` (latest wins) and are applied on `loadedmetadata`.
 * - Safari resets `playbackRate` from `defaultPlaybackRate` on load: set both.
 */
import type { AudioEntry } from './audio-manifest';
import type { AudioPositionStore } from './audio-position-store';
import { chapterIndexAt, clampRate, formatRate, MEDIA_ACTIONS, PLAYER_MESSAGES, SKIP_SECONDS, skipTarget } from './audio-player-logic';
import type { AudioElementLike, MediaActionCallback, MediaActionName, MediaSessionAdapter, PlayerSnapshot } from './audio-player-logic';

/** HTMLMediaElement.HAVE_METADATA. */
const HAVE_METADATA = 1;
/** Position is persisted at most this often while playing (plus on pause/hide/leave). */
export const POSITION_SAVE_INTERVAL_MS = 5000;

export interface AudioPlayerControllerOptions {
  audio: AudioElementLike;
  entry: AudioEntry;
  lessonId: string;
  src: string;
  store: AudioPositionStore;
  metadata: { title: string; album: string };
  mediaSession?: MediaSessionAdapter;
  onChange: (snapshot: PlayerSnapshot) => void;
  announce: (message: string) => void;
  now?: () => number;
}

export interface AudioPlayerController {
  togglePlay(): void;
  play(): void;
  skip(deltaSec: number): void;
  /** Seeks to the chapter/mark start and plays (gesture-safe). */
  playChapter(index: number): void;
  setRate(rate: number): void;
  savePosition(): void;
  snapshot(): PlayerSnapshot;
  /** Pauses (a detached element would keep playing), saves, unhooks everything. */
  dispose(): void;
}

export function createAudioPlayerController(options: AudioPlayerControllerOptions): AudioPlayerController {
  const { audio, entry, lessonId, store, mediaSession, announce } = options;
  const now = options.now ?? Date.now;
  let rate = clampRate(store.getRate());
  let pendingSeek: number | null = null;
  let hasError = false;
  let lastSaveAt = now();
  let disposed = false;
  // Chỉ lưu vị trí sau lần phát đầu: mở trang mà không nghe không được đẩy bài nghe dở ra khỏi danh sách.
  let hasPlayed = false;

  const duration = (): number => (Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : entry.durationSec);
  const position = (): number => pendingSeek ?? (Number.isFinite(audio.currentTime) ? audio.currentTime : 0);

  function snapshot(): PlayerSnapshot {
    const t = position();
    return { playing: !audio.paused, position: t, duration: duration(), rate, chapterIndex: chapterIndexAt(entry.chapters, t), hasError };
  }

  function emit(): void {
    options.onChange(snapshot());
    try {
      mediaSession?.setPositionState({ duration: duration(), playbackRate: rate, position: Math.min(position(), duration()) });
    } catch {
      // Safari throws on values it considers out of range; the lock screen keeps the previous position.
    }
  }

  function applyRate(): void {
    audio.defaultPlaybackRate = rate;
    audio.playbackRate = rate;
  }

  function seekTo(seconds: number): void {
    const target = skipTarget(seconds, 0, duration());
    pendingSeek = audio.readyState >= HAVE_METADATA ? null : target;
    if (pendingSeek === null) audio.currentTime = target;
    emit();
  }

  function fail(): void {
    hasError = true;
    announce(PLAYER_MESSAGES.error);
    emit();
  }

  function play(message: string = PLAYER_MESSAGES.playing): void {
    hasError = false;
    let result: Promise<void> | undefined;
    try {
      result = audio.play();
    } catch {
      fail();
      return;
    }
    announce(message);
    // AbortError = a later pause()/src change interrupted this play(): not a failure.
    result?.catch((error: unknown) => {
      if (!disposed && (error as { name?: string } | null)?.name !== 'AbortError') fail();
    });
  }

  function savePosition(): void {
    if (!hasPlayed) return;
    lastSaveAt = now();
    store.savePosition(lessonId, entry.audioKey, position());
  }

  const skip = (deltaSec: number): void => seekTo(skipTarget(position(), deltaSec, duration()));

  const listeners: Record<string, () => void> = {
    loadedmetadata() {
      applyRate();
      if (pendingSeek !== null) audio.currentTime = Math.min(pendingSeek, duration());
      pendingSeek = null;
      emit();
    },
    play() {
      hasPlayed = true;
      mediaSession?.setPlaybackState('playing');
      emit();
    },
    pause() {
      mediaSession?.setPlaybackState('paused');
      savePosition();
      announce(PLAYER_MESSAGES.paused);
      emit();
    },
    timeupdate() {
      if (!audio.paused && now() - lastSaveAt >= POSITION_SAVE_INTERVAL_MS) savePosition();
      emit();
    },
    ended() {
      store.clearPosition(lessonId);
      announce(PLAYER_MESSAGES.ended);
      emit();
    },
    error: fail,
  };

  const mediaHandlers: Record<MediaActionName, MediaActionCallback> = {
    play: () => play(),
    pause: () => audio.pause(),
    seekbackward: () => skip(-SKIP_SECONDS),
    seekforward: () => skip(SKIP_SECONDS),
    seekto: ({ seekTime }) => {
      if (typeof seekTime === 'number') seekTo(seekTime);
    },
  };

  for (const [type, listener] of Object.entries(listeners)) audio.addEventListener(type, listener);
  mediaSession?.setMetadata({ title: options.metadata.title, artist: 'OmniLab', album: options.metadata.album });
  for (const action of MEDIA_ACTIONS) mediaSession?.setActionHandler(action, mediaHandlers[action]);

  // Source assigned up front (only the moov header loads) so a later tap can play() at once.
  audio.preload = 'metadata';
  audio.src = options.src;
  applyRate();
  const resumeAt = store.getResumeTime(lessonId, entry.audioKey, entry.durationSec);
  if (resumeAt === null) emit();
  else seekTo(resumeAt);

  return {
    togglePlay: () => (audio.paused ? play() : audio.pause()),
    play: () => play(),
    skip,
    playChapter(index) {
      const chapter = entry.chapters[index];
      if (!chapter) return;
      seekTo(chapter.startSec);
      play(PLAYER_MESSAGES.playingFrom(chapter.title));
    },
    setRate(next) {
      rate = clampRate(next);
      applyRate();
      store.setRate(rate);
      announce(PLAYER_MESSAGES.rate(formatRate(rate)));
      emit();
    },
    savePosition,
    snapshot,
    dispose() {
      if (disposed) return;
      disposed = true;
      savePosition();
      for (const [type, listener] of Object.entries(listeners)) audio.removeEventListener(type, listener);
      audio.pause();
      for (const action of MEDIA_ACTIONS) mediaSession?.setActionHandler(action, null);
      mediaSession?.setMetadata(null);
      mediaSession?.setPlaybackState('none');
    },
  };
}
