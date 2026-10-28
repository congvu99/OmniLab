// Browser fetch of /audio/manifest.json: every failure mode resolves to null
// (player hidden), the request always revalidates (no-cache).
import { describe, expect, it, vi } from 'vitest';
import { AUDIO_MANIFEST_URL, audioSourceUrl, fetchLessonAudioEntry } from '../src/lib/audio-manifest-client.ts';

const LESSON = 'kien-truc/chu-de/cache';
const ENTRY = {
  scriptHash: 'a'.repeat(64),
  audioKey: 'b'.repeat(64),
  file: 'kien-truc.chu-de.cache.bbbbbbbbbbbb.m4a',
  durationSec: 600,
  chapters: [{ id: ':intro', title: 'Mở đầu', startSec: 0, depth: 2, approx: false }],
  generatedAt: '2026-10-28T00:00:00Z',
  model: 'm',
  voice: 'v',
};
const MANIFEST = { v: 1, updatedAt: '2026-10-28T00:00:00Z', lessons: { [LESSON]: ENTRY } };

const respond = (ok, body) => vi.fn(async () => ({ ok, json: async () => body }));

describe('fetchLessonAudioEntry', () => {
  it('returns the lesson entry and revalidates the manifest', async () => {
    const fetchImpl = respond(true, MANIFEST);
    expect(await fetchLessonAudioEntry(LESSON, fetchImpl)).toEqual(ENTRY);
    expect(fetchImpl).toHaveBeenCalledWith(AUDIO_MANIFEST_URL, { cache: 'no-cache' });
  });

  it('returns null when the lesson has no entry', async () => {
    expect(await fetchLessonAudioEntry('kien-truc/chu-de/khac', respond(true, MANIFEST))).toBeNull();
    expect(await fetchLessonAudioEntry('constructor', respond(true, MANIFEST))).toBeNull();
  });

  it('returns null on 404 without reading the body', async () => {
    const json = vi.fn();
    expect(await fetchLessonAudioEntry(LESSON, async () => ({ ok: false, json }))).toBeNull();
    expect(json).not.toHaveBeenCalled();
  });

  it('returns null on network errors and non-JSON bodies', async () => {
    expect(await fetchLessonAudioEntry(LESSON, () => Promise.reject(new TypeError('offline')))).toBeNull();
    const html = async () => ({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    });
    expect(await fetchLessonAudioEntry(LESSON, html)).toBeNull();
  });

  it('returns null for a manifest of another version or a malformed entry', async () => {
    expect(await fetchLessonAudioEntry(LESSON, respond(true, { ...MANIFEST, v: 2 }))).toBeNull();
    const tampered = { ...MANIFEST, lessons: { [LESSON]: { ...ENTRY, file: '../secret.m4a' } } };
    expect(await fetchLessonAudioEntry(LESSON, respond(true, tampered))).toBeNull();
  });
});

describe('audioSourceUrl', () => {
  it('serves files from /audio/', () => {
    expect(audioSourceUrl(ENTRY)).toBe('/audio/kien-truc.chu-de.cache.bbbbbbbbbbbb.m4a');
  });
});
