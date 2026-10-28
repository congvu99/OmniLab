// Lenient parser of /audio/manifest.json (TTS worker -> browser player contract).
import { describe, expect, it } from 'vitest';
import { AUDIO_FILE_PATTERN, audioFileName, emptyAudioManifest, parseAudioManifest } from '../src/lib/audio-manifest.ts';

const ID = 'tai-chinh/nen-tang/ngan-sach';
const KEY = '0123456789abcdef0123';

function entry(overrides = {}) {
  return {
    scriptHash: 'h'.repeat(64),
    audioKey: KEY,
    file: audioFileName(ID, KEY),
    durationSec: 300,
    chapters: [
      { id: 'phan-hai', title: 'Phần hai', startSec: 120, depth: 2, approx: false },
      { id: ':intro', title: 'Mở đầu', startSec: 0, depth: 2, approx: false },
      { id: 'muc-con', title: 'Mục con', startSec: 60.5, depth: 3, approx: true },
    ],
    generatedAt: '2026-10-28T00:00:00.000Z',
    model: 'gemini-tts',
    voice: 'Charon',
    ...overrides,
  };
}

const manifest = (lessons) => ({ v: 1, updatedAt: '2026-10-28T00:00:00.000Z', lessons });

describe('audioFileName', () => {
  it('builds <domain>.<module>.<slug>.<12 hex>.m4a matching AUDIO_FILE_PATTERN', () => {
    const name = audioFileName(ID, KEY);
    expect(name).toBe('tai-chinh.nen-tang.ngan-sach.0123456789ab.m4a');
    expect(AUDIO_FILE_PATTERN.test(name)).toBe(true);
  });

  it('throws on an invalid lesson id or a non-hex key', () => {
    expect(() => audioFileName('../x/y', KEY)).toThrow(/invalid lesson id/);
    expect(() => audioFileName(ID, 'XYZ')).toThrow(/12 lowercase hex/);
  });
});

describe('parseAudioManifest', () => {
  it('parses a valid manifest and sorts chapters by startSec', () => {
    const parsed = parseAudioManifest(JSON.stringify(manifest({ [ID]: entry() })));
    expect(parsed.updatedAt).toBe('2026-10-28T00:00:00.000Z');
    expect(parsed.lessons[ID].chapters.map((c) => c.id)).toEqual([':intro', 'muc-con', 'phan-hai']);
    expect(parsed.lessons[ID].chapters[1]).toEqual({ id: 'muc-con', title: 'Mục con', startSec: 60.5, depth: 3, approx: true });
  });

  it('returns an empty manifest for invalid JSON, another version or a wrong shape', () => {
    expect(parseAudioManifest('not json')).toEqual(emptyAudioManifest());
    expect(parseAudioManifest({ ...manifest({ [ID]: entry() }), v: 2 })).toEqual(emptyAudioManifest());
    expect(parseAudioManifest({ v: 1, lessons: [] })).toEqual(emptyAudioManifest());
    expect(parseAudioManifest(null)).toEqual(emptyAudioManifest());
  });

  it('drops malformed entries and keeps the valid ones', () => {
    const other = 'kien-truc/chu-de/cache';
    const otherKey = 'fedcba9876543210';
    const parsed = parseAudioManifest(
      manifest({
        [ID]: entry(),
        [other]: entry({ audioKey: otherKey, file: audioFileName(other, otherKey), durationSec: 'long' }),
        'not-an-id': entry(),
        'a/b/c': 'oops',
      }),
    );
    expect(Object.keys(parsed.lessons)).toEqual([ID]);
  });

  it('drops an entry whose file escapes /audio/ or belongs to another lesson', () => {
    const files = [
      '../secret.m4a',
      '/etc/passwd',
      'tai-chinh.nen-tang.ngan-sach.0123456789ab.mp3',
      'kien-truc.chu-de.cache.0123456789ab.m4a',
    ];
    for (const file of files) {
      expect(parseAudioManifest(manifest({ [ID]: entry({ file }) })).lessons).toEqual({});
    }
  });

  it('drops chapters missing depth/approx or with a bad startSec', () => {
    const chapters = [
      { id: ':intro', title: 'Mở đầu', startSec: 0, depth: 2, approx: false },
      { id: 'no-depth', title: 'A', startSec: 1, approx: false },
      { id: 'no-approx', title: 'B', startSec: 2, depth: 3 },
      { id: 'depth-4', title: 'C', startSec: 3, depth: 4, approx: true },
      { id: 'negative', title: 'D', startSec: -1, depth: 2, approx: false },
    ];
    const parsed = parseAudioManifest(manifest({ [ID]: entry({ chapters }) }));
    expect(parsed.lessons[ID].chapters.map((c) => c.id)).toEqual([':intro']);
  });
});
