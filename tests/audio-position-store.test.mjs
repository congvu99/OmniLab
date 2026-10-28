// Device-local listening memory (`omnilab:v1:audio`): lenient parsing, resume
// rules, 50-lesson cap, rate clamp, and in-memory fallback when storage throws.
import { describe, expect, it } from 'vitest';
import {
  AUDIO_STORAGE_KEY,
  createAudioPositionStore,
  MAX_REMEMBERED_LESSONS,
  parseAudioState,
} from '../src/lib/audio-position-store.ts';

const LESSON = 'kien-truc/chu-de/cache';
const KEY = 'f'.repeat(64);

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
  };
}

const throwingStorage = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('QuotaExceededError');
  },
};

describe('parseAudioState', () => {
  it('returns an empty state for empty, broken or foreign data', () => {
    for (const raw of [null, '', '{', '[]', '{"v":2,"rate":1.5,"byLesson":{}}', '"x"']) {
      expect(parseAudioState(raw), String(raw)).toEqual({ v: 1, rate: 1, byLesson: {} });
    }
  });

  it('clamps the rate and drops malformed lessons', () => {
    const raw = JSON.stringify({
      v: 1,
      rate: 7,
      byLesson: {
        [LESSON]: { t: 12, key: KEY, at: 1 },
        'not-a-lesson': { t: 1, key: KEY, at: 1 },
        'a/b/c': { t: -1, key: KEY, at: 1 },
        'a/b/d': { t: 1, key: '', at: 1 },
      },
    });
    expect(parseAudioState(raw)).toEqual({ v: 1, rate: 2, byLesson: { [LESSON]: { t: 12, key: KEY, at: 1 } } });
  });
});

describe('createAudioPositionStore', () => {
  it('writes and reads positions under its own key', () => {
    const storage = memoryStorage();
    const store = createAudioPositionStore({ storage, now: () => 42 });
    store.savePosition(LESSON, KEY, 125.5);
    expect(JSON.parse(storage.data.get(AUDIO_STORAGE_KEY))).toEqual({
      v: 1,
      rate: 1,
      byLesson: { [LESSON]: { t: 125.5, key: KEY, at: 42 } },
    });
    expect(store.getResumeTime(LESSON, KEY, 600)).toBe(125.5);
    expect([...storage.data.keys()]).toEqual([AUDIO_STORAGE_KEY]);
  });

  it('only resumes the same audio file and not within 5 s of the end', () => {
    const store = createAudioPositionStore({ storage: memoryStorage() });
    store.savePosition(LESSON, KEY, 596);
    expect(store.getResumeTime(LESSON, KEY, 600)).toBeNull();
    store.savePosition(LESSON, KEY, 594);
    expect(store.getResumeTime(LESSON, KEY, 600)).toBe(594);
    expect(store.getResumeTime(LESSON, 'e'.repeat(64), 600)).toBeNull();
    expect(store.getResumeTime('a/b/c', KEY, 600)).toBeNull();
    store.savePosition(LESSON, KEY, 0);
    expect(store.getResumeTime(LESSON, KEY, 600)).toBeNull();
  });

  it('clears one lesson and ignores invalid seconds', () => {
    const store = createAudioPositionStore({ storage: memoryStorage() });
    store.savePosition(LESSON, KEY, 30);
    store.savePosition(LESSON, KEY, Number.NaN);
    expect(store.getResumeTime(LESSON, KEY, 600)).toBe(30);
    store.clearPosition(LESSON);
    store.clearPosition('a/b/missing');
    expect(store.getResumeTime(LESSON, KEY, 600)).toBeNull();
  });

  it('keeps only the 50 most recently saved lessons', () => {
    let clock = 0;
    const store = createAudioPositionStore({ storage: memoryStorage(), now: () => ++clock });
    for (let i = 0; i < MAX_REMEMBERED_LESSONS + 5; i++) store.savePosition(`d/m/s${i}`, KEY, 10);
    expect(store.getResumeTime('d/m/s0', KEY, 600)).toBeNull();
    expect(store.getResumeTime('d/m/s4', KEY, 600)).toBeNull();
    expect(store.getResumeTime('d/m/s5', KEY, 600)).toBe(10);
    expect(store.getResumeTime(`d/m/s${MAX_REMEMBERED_LESSONS + 4}`, KEY, 600)).toBe(10);
  });

  it('stores a clamped shared rate', () => {
    const storage = memoryStorage();
    const store = createAudioPositionStore({ storage });
    expect(store.getRate()).toBe(1);
    store.setRate(1.5);
    expect(createAudioPositionStore({ storage }).getRate()).toBe(1.5);
    store.setRate(0.2);
    expect(store.getRate()).toBe(0.75);
  });

  it('keeps working in memory when storage throws (private mode)', () => {
    const store = createAudioPositionStore({ storage: throwingStorage });
    expect(() => store.savePosition(LESSON, KEY, 77)).not.toThrow();
    expect(store.getResumeTime(LESSON, KEY, 600)).toBe(77);
    store.setRate(1.25);
    expect(store.getRate()).toBe(1.25);
  });

  it('keeps working without any storage', () => {
    const store = createAudioPositionStore({ storage: undefined });
    store.savePosition(LESSON, KEY, 9);
    expect(store.getResumeTime(LESSON, KEY, 600)).toBe(9);
  });
});
