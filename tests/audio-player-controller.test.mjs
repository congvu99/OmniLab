// Lesson audio controller against a fake <audio> that behaves like iOS
// Safari: starts at readyState 0, ignores currentTime writes before metadata,
// resets playbackRate to defaultPlaybackRate when a source is assigned or
// loaded, and fires loadedmetadata only when the test says so.
import { describe, expect, it, vi } from 'vitest';
import { createAudioPlayerController } from '../src/lib/audio-player-controller.ts';
import { PLAYER_MESSAGES } from '../src/lib/audio-player-logic.ts';
import { createAudioPositionStore } from '../src/lib/audio-position-store.ts';

const LESSON = 'kien-truc/chu-de/cache';
const ENTRY = {
  scriptHash: 'a'.repeat(64),
  audioKey: 'b'.repeat(64),
  file: 'kien-truc.chu-de.cache.bbbbbbbbbbbb.m4a',
  durationSec: 600,
  chapters: [
    { id: ':intro', title: 'Mở đầu', startSec: 0, depth: 2, approx: false },
    { id: 'cache-la-gi', title: 'Cache là gì', startSec: 40, depth: 2, approx: false },
    { id: 'vi-du', title: 'Ví dụ', startSec: 95, depth: 3, approx: true },
    { id: 'ket-luan', title: 'Kết luận', startSec: 300, depth: 2, approx: false },
  ],
  generatedAt: '2026-10-28T00:00:00Z',
  model: 'm',
  voice: 'v',
};

function createSafariAudio() {
  const listeners = new Map();
  let src = '';
  let currentTime = 0;
  return {
    preload: 'auto',
    readyState: 0,
    paused: true,
    duration: Number.NaN,
    playbackRate: 1,
    defaultPlaybackRate: 1,
    playCalls: 0,
    playResult: () => Promise.resolve(),
    get currentTime() {
      return currentTime;
    },
    set currentTime(value) {
      // iOS ignores (or throws on) seeks before HAVE_METADATA.
      if (this.readyState >= 1) currentTime = value;
    },
    get src() {
      return src;
    },
    set src(value) {
      src = value;
      this.readyState = 0;
      this.playbackRate = this.defaultPlaybackRate;
    },
    play() {
      this.playCalls += 1;
      this.paused = false;
      this.fire('play');
      return this.playResult();
    },
    pause() {
      if (this.paused) return;
      this.paused = true;
      this.fire('pause');
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    listenerCount: () => [...listeners.values()].reduce((n, set) => n + set.size, 0),
    fire(type) {
      for (const fn of listeners.get(type) ?? []) fn();
    },
    loadMetadata(duration = 600) {
      this.readyState = 1;
      this.duration = duration;
      this.playbackRate = this.defaultPlaybackRate;
      this.fire('loadedmetadata');
    },
    advanceTo(seconds) {
      currentTime = seconds;
      this.fire('timeupdate');
    },
  };
}

function createMediaSession() {
  return {
    handlers: {},
    metadata: undefined,
    playbackState: undefined,
    setMetadata(m) {
      this.metadata = m;
    },
    setActionHandler(action, fn) {
      this.handlers[action] = fn;
    },
    setPositionState: vi.fn(() => {
      throw new RangeError('Safari: position out of range');
    }),
    setPlaybackState(state) {
      this.playbackState = state;
    },
  };
}

function setup({ storage = new Map(), clock = { t: 0 } } = {}) {
  const audio = createSafariAudio();
  const fakeStorage = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) };
  const store = createAudioPositionStore({ storage: fakeStorage, now: () => clock.t });
  const mediaSession = createMediaSession();
  const announce = vi.fn();
  const snapshots = [];
  const controller = createAudioPlayerController({
    audio,
    entry: ENTRY,
    lessonId: LESSON,
    src: '/audio/kien-truc.chu-de.cache.bbbbbbbbbbbb.m4a',
    store,
    metadata: { title: 'Cache', album: 'Kiến trúc' },
    mediaSession,
    onChange: (s) => snapshots.push(s),
    announce,
    now: () => clock.t,
  });
  return { audio, store, mediaSession, announce, snapshots, controller, storage, clock };
}

describe('createAudioPlayerController', () => {
  it('assigns the source up front with preload=metadata and does not play', () => {
    const { audio, controller } = setup();
    expect(audio.src).toBe('/audio/kien-truc.chu-de.cache.bbbbbbbbbbbb.m4a');
    expect(audio.preload).toBe('metadata');
    expect(audio.playCalls).toBe(0);
    expect(controller.snapshot()).toMatchObject({ playing: false, position: 0, duration: 600, chapterIndex: 0 });
  });

  it('calls play() synchronously inside the gesture handler', () => {
    const { audio, controller } = setup();
    controller.togglePlay();
    // Checked before any await: the call already happened in the same tick.
    expect(audio.playCalls).toBe(1);
    controller.togglePlay();
    expect(audio.paused).toBe(true);
  });

  it('plays a chapter immediately but seeks only after loadedmetadata (latest wins)', () => {
    const { audio, controller } = setup();
    controller.playChapter(1);
    controller.playChapter(3);
    expect(audio.playCalls).toBe(2);
    expect(audio.currentTime).toBe(0);
    expect(controller.snapshot()).toMatchObject({ position: 300, chapterIndex: 3 });
    audio.loadMetadata();
    expect(audio.currentTime).toBe(300);
  });

  it('seeks directly once metadata is loaded', () => {
    const { audio, controller } = setup();
    audio.loadMetadata();
    controller.playChapter(2);
    expect(audio.currentTime).toBe(95);
  });

  it('keeps the chosen rate after the source loads (playbackRate and defaultPlaybackRate)', () => {
    const { audio, controller, store } = setup();
    controller.setRate(1.5);
    audio.loadMetadata();
    expect(audio.playbackRate).toBe(1.5);
    expect(audio.defaultPlaybackRate).toBe(1.5);
    expect(store.getRate()).toBe(1.5);
  });

  it('applies a stored rate to a new page', () => {
    const storage = new Map();
    setup({ storage }).controller.setRate(1.75);
    const { audio } = setup({ storage });
    expect(audio.playbackRate).toBe(1.75);
    audio.loadMetadata();
    expect(audio.playbackRate).toBe(1.75);
  });

  it('restores the saved position only for the same audioKey', () => {
    const storage = new Map();
    const first = setup({ storage });
    first.audio.loadMetadata();
    first.controller.play();
    first.audio.advanceTo(222);
    first.controller.dispose();

    const again = setup({ storage });
    again.audio.loadMetadata();
    expect(again.audio.currentTime).toBe(222);

    const state = JSON.parse(storage.get('omnilab:v1:audio'));
    state.byLesson[LESSON].key = 'c'.repeat(64);
    storage.set('omnilab:v1:audio', JSON.stringify(state));
    const other = setup({ storage });
    other.audio.loadMetadata();
    expect(other.audio.currentTime).toBe(0);
  });

  it('clamps ±15 s skips inside the audio', () => {
    const { audio, controller } = setup();
    audio.loadMetadata();
    controller.skip(-15);
    expect(audio.currentTime).toBe(0);
    audio.advanceTo(590);
    controller.skip(15);
    expect(audio.currentTime).toBe(600);
  });

  it('saves while playing at most every 5 s, on pause, and clears on end', () => {
    const { audio, controller, store, clock } = setup();
    audio.loadMetadata();
    controller.play();
    clock.t = 1000;
    audio.advanceTo(10);
    expect(store.getResumeTime(LESSON, ENTRY.audioKey, 600)).toBeNull();
    clock.t = 5000;
    audio.advanceTo(20);
    expect(store.getResumeTime(LESSON, ENTRY.audioKey, 600)).toBe(20);
    audio.advanceTo(30);
    audio.pause();
    expect(store.getResumeTime(LESSON, ENTRY.audioKey, 600)).toBe(30);
    audio.fire('ended');
    expect(store.getResumeTime(LESSON, ENTRY.audioKey, 600)).toBeNull();
  });

  it('turns a rejected play() into a paused state with a message', async () => {
    const { audio, controller, announce } = setup();
    audio.playResult = () => {
      audio.paused = true;
      return Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
    };
    controller.togglePlay();
    await Promise.resolve();
    await Promise.resolve();
    expect(controller.snapshot()).toMatchObject({ playing: false, hasError: true });
    expect(announce).toHaveBeenLastCalledWith(PLAYER_MESSAGES.error);
  });

  it('ignores AbortError (play interrupted by pause) and reports load errors', async () => {
    const { audio, controller } = setup();
    audio.playResult = () => Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    controller.play();
    await Promise.resolve();
    await Promise.resolve();
    expect(controller.snapshot().hasError).toBe(false);
    audio.fire('error');
    expect(controller.snapshot().hasError).toBe(true);
  });

  it('wires Media Session actions and survives setPositionState throwing', () => {
    const { audio, controller, mediaSession } = setup();
    expect(mediaSession.metadata).toEqual({ title: 'Cache', artist: 'OmniLab', album: 'Kiến trúc' });
    audio.loadMetadata();
    mediaSession.handlers.seekto({ seekTime: 120 });
    expect(audio.currentTime).toBe(120);
    mediaSession.handlers.seekforward({});
    expect(audio.currentTime).toBe(135);
    mediaSession.handlers.seekbackward({});
    expect(audio.currentTime).toBe(120);
    mediaSession.handlers.play({});
    expect(mediaSession.playbackState).toBe('playing');
    mediaSession.handlers.pause({});
    expect(audio.paused).toBe(true);
    expect(mediaSession.setPositionState).toHaveBeenCalled();
    expect(controller.snapshot().position).toBe(120);
  });

  it('never writes a position before the audio has played (opening a page is not listening)', () => {
    const storage = new Map();
    const { audio, controller } = setup({ storage });
    audio.loadMetadata();
    controller.skip(15);
    controller.savePosition();
    controller.dispose();
    expect(storage.has('omnilab:v1:audio')).toBe(false);
  });

  it('announces the chapter and the rate with PLAYER_MESSAGES', () => {
    const { audio, controller, announce } = setup();
    audio.loadMetadata();
    controller.playChapter(1);
    expect(announce).toHaveBeenLastCalledWith(PLAYER_MESSAGES.playingFrom('Cache là gì'));
    controller.setRate(1.5);
    expect(announce).toHaveBeenLastCalledWith(PLAYER_MESSAGES.rate('1,5x'));
  });

  it('dispose pauses, saves, and unhooks the element and Media Session', () => {
    const { audio, controller, mediaSession, store } = setup();
    audio.loadMetadata();
    controller.play();
    audio.advanceTo(48);
    controller.dispose();
    expect(audio.paused).toBe(true);
    expect(store.getResumeTime(LESSON, ENTRY.audioKey, 600)).toBe(48);
    expect(audio.listenerCount()).toBe(0);
    expect(Object.values(mediaSession.handlers).every((h) => h === null)).toBe(true);
    expect(mediaSession.metadata).toBeNull();
    expect(mediaSession.playbackState).toBe('none');
    expect(() => controller.dispose()).not.toThrow();
  });
});
