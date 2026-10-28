// Pure helpers of the lesson audio player: clock text, current chapter,
// rate clamp, skip targets and the heading-button view model (## exact,
// ### approximate, intro never gets a button).
import { describe, expect, it } from 'vitest';
import {
  chapterIndexAt,
  clampRate,
  formatClock,
  formatListenMinutes,
  formatRate,
  headingButtonLabel,
  PLAYBACK_RATES,
  resolveAudioView,
  skipTarget,
} from '../src/lib/audio-player-logic.ts';

const chapter = (id, startSec, depth = 2) => ({ id, title: `Mục ${id}`, startSec, depth, approx: depth === 3 });

function entry(overrides = {}) {
  return {
    scriptHash: 'a'.repeat(64),
    audioKey: 'b'.repeat(64),
    file: 'kien-truc.chu-de.cache.bbbbbbbbbbbb.m4a',
    durationSec: 600,
    chapters: [chapter(':intro', 0), chapter('cache-la-gi', 40), chapter('vi-du', 95, 3), chapter('ket-luan', 300)],
    generatedAt: '2026-10-28T00:00:00Z',
    model: 'm',
    voice: 'v',
    ...overrides,
  };
}

describe('formatClock', () => {
  it('formats minutes and seconds, hours when needed', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(59)).toBe('0:59');
    expect(formatClock(61)).toBe('1:01');
    expect(formatClock(723.9)).toBe('12:03');
    expect(formatClock(3600)).toBe('1:00:00');
    expect(formatClock(3729)).toBe('1:02:09');
  });

  it('falls back to 0:00 for NaN, Infinity and negatives', () => {
    expect(formatClock(Number.NaN)).toBe('0:00');
    expect(formatClock(Number.POSITIVE_INFINITY)).toBe('0:00');
    expect(formatClock(-5)).toBe('0:00');
  });
});

describe('formatListenMinutes / formatRate', () => {
  it('rounds to whole minutes, at least one', () => {
    expect(formatListenMinutes(1930)).toBe('32 phút');
    expect(formatListenMinutes(10)).toBe('1 phút');
    expect(formatListenMinutes(Number.NaN)).toBe('1 phút');
  });

  it('uses a decimal comma', () => {
    expect(formatRate(1.5)).toBe('1,5x');
    expect(formatRate(1)).toBe('1x');
    expect(PLAYBACK_RATES.map(formatRate)).toEqual(['0,75x', '1x', '1,25x', '1,5x', '1,75x', '2x']);
  });
});

describe('clampRate', () => {
  it('keeps rates inside [0.75, 2] and rejects garbage', () => {
    expect(clampRate(1.25)).toBe(1.25);
    expect(clampRate(0.1)).toBe(0.75);
    expect(clampRate(9)).toBe(2);
    expect(clampRate(Number.NaN)).toBe(1);
    expect(clampRate('1.5')).toBe(1);
    expect(clampRate(undefined)).toBe(1);
  });
});

describe('skipTarget', () => {
  it('clamps inside [0, duration]', () => {
    expect(skipTarget(100, 15, 600)).toBe(115);
    expect(skipTarget(5, -15, 600)).toBe(0);
    expect(skipTarget(590, 15, 600)).toBe(600);
  });

  it('only clamps at 0 when the duration is unknown', () => {
    expect(skipTarget(590, 15, Number.NaN)).toBe(605);
    expect(skipTarget(Number.NaN, 15, 600)).toBe(15);
  });
});

describe('chapterIndexAt', () => {
  const chapters = entry().chapters;

  it('returns -1 before the first chapter', () => {
    expect(chapterIndexAt([chapter('a', 10)], 3)).toBe(-1);
  });

  it('switches exactly on a boundary, including ### marks in between', () => {
    expect(chapterIndexAt(chapters, 0)).toBe(0);
    expect(chapterIndexAt(chapters, 39.9)).toBe(0);
    expect(chapterIndexAt(chapters, 40)).toBe(1);
    expect(chapterIndexAt(chapters, 95)).toBe(2);
    expect(chapterIndexAt(chapters, 299)).toBe(2);
    expect(chapterIndexAt(chapters, 599)).toBe(3);
  });
});

describe('resolveAudioView', () => {
  const pageHeadings = [
    { id: 'cache-la-gi', depth: 2 },
    { id: 'vi-du', depth: 3 },
    { id: 'chi-tren-trang', depth: 2 },
  ];

  it('flags an older script version', () => {
    expect(resolveAudioView(entry(), 'a'.repeat(64), pageHeadings).isPreviousVersion).toBe(false);
    expect(resolveAudioView(entry(), 'c'.repeat(64), pageHeadings).isPreviousVersion).toBe(true);
  });

  it('gives buttons only to headings present on both sides at the same depth, never the intro', () => {
    const view = resolveAudioView(entry(), 'a'.repeat(64), [...pageHeadings, { id: ':intro', depth: 2 }]);
    expect(view.chapters.map((c) => [c.id, c.hasHeadingButton])).toEqual([
      [':intro', false],
      ['cache-la-gi', true],
      ['vi-du', true],
      // Only in the old audio: listed, but no button on the page.
      ['ket-luan', false],
    ]);
    expect(view.chapters[2].approx).toBe(true);
  });

  it('does not match a heading whose depth changed', () => {
    const view = resolveAudioView(entry(), 'a'.repeat(64), [{ id: 'vi-du', depth: 2 }]);
    expect(view.chapters.find((c) => c.id === 'vi-du').hasHeadingButton).toBe(false);
  });

  it('supports lessons with only the intro plus ### marks', () => {
    const marksOnly = entry({ chapters: [chapter(':intro', 0), chapter('tuan-1', 12, 3), chapter('tuan-2', 80, 3)] });
    const view = resolveAudioView(marksOnly, 'a'.repeat(64), [
      { id: 'tuan-1', depth: 3 },
      { id: 'tuan-2', depth: 3 },
    ]);
    expect(view.chapters.filter((c) => c.hasHeadingButton).map((c) => c.id)).toEqual(['tuan-1', 'tuan-2']);
    expect(view.chapters.every((c) => c.depth === 2 || c.approx)).toBe(true);
  });
});

describe('headingButtonLabel', () => {
  it('starts with the visible text and names the section, so screen-reader button lists differ', () => {
    expect(headingButtonLabel(2, 'Cache là gì', false)).toBe('Nghe từ mục này: Cache là gì');
    expect(headingButtonLabel(3, 'Ví dụ', true)).toBe('Nghe từ đây (vị trí gần đúng): Ví dụ');
    expect(headingButtonLabel(3, 'Ví dụ', false)).toBe('Nghe từ đây: Ví dụ');
  });
});
