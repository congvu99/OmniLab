// Chunk packer: merges short paragraphs, never crosses a chapter, splits long ones by sentence
// then whitespace, keeps every character, respects the limit and places `###` marks.
import { describe, expect, it } from 'vitest';
import { packChunks } from '../server/tts/chunk-packer.ts';

const norm = (text) => text.replace(/\s+/g, ' ').trim();
const chapter = (id, paragraphs, marks = []) => ({ id, title: id, paragraphs, marks });
const sentence = (n, words = 12) => `Câu số ${n} ${'chữ '.repeat(words).trim()}.`;

function expectLossless(chapters, chunks) {
  for (const [index, c] of chapters.entries()) {
    const own = chunks.filter((chunk) => chunk.chapterIndex === index).map((chunk) => chunk.text).join(' ');
    expect(norm(own)).toBe(norm(c.paragraphs.join(' ')));
  }
}

describe('packChunks', () => {
  it('merges short paragraphs of one chapter into one chunk, newline-separated', () => {
    const chunks = packChunks([chapter(':intro', ['Một.', 'Hai.', 'Ba.'])], 500);
    expect(chunks).toEqual([{ chapterIndex: 0, text: 'Một.\nHai.\nBa.', marks: [] }]);
  });

  it('never lets a chunk span two chapters', () => {
    const chapters = [chapter(':intro', ['Mở đầu ngắn.']), chapter('phan-a', ['Phần A ngắn.'])];
    const chunks = packChunks(chapters, 500);
    expect(chunks.map((c) => c.chapterIndex)).toEqual([0, 1]);
  });

  it('starts a new chunk when the next paragraph would overflow', () => {
    const a = 'a'.repeat(300);
    const b = 'b'.repeat(250);
    const chunks = packChunks([chapter(':intro', [a, b])], 500);
    expect(chunks.map((c) => c.text)).toEqual([a, b]);
  });

  it('splits a long paragraph by sentence, keeping punctuation and every character', () => {
    const paragraph = Array.from({ length: 30 }, (_, i) => sentence(i)).join(' ');
    const chapters = [chapter(':intro', [paragraph])];
    const chunks = packChunks(chapters, 500);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(500);
      expect(chunk.text.endsWith('.')).toBe(true);
    }
    expectLossless(chapters, chunks);
  });

  it('splits on …, ! and ? as well', () => {
    const paragraph = `${'x '.repeat(200)}thật sao? ${'y '.repeat(200)}tuyệt! ${'z '.repeat(100)}rồi…`;
    const chunks = packChunks([chapter(':intro', [paragraph])], 500);
    expect(chunks[0].text.endsWith('?')).toBe(true);
    expectLossless([chapter(':intro', [paragraph])], chunks);
  });

  it('splits an over-long sentence at whitespace and a giant word by hard cut', () => {
    const longSentence = `${'từ '.repeat(400)}cuối.`;
    const giant = 'h'.repeat(1200);
    const chapters = [chapter(':intro', [longSentence, giant])];
    const chunks = packChunks(chapters, 500);
    for (const chunk of chunks) expect(chunk.text.length).toBeLessThanOrEqual(500);
    expectLossless([chapter(':intro', [longSentence])], chunks.filter((c) => !c.text.includes('h')));
    expect(chunks.filter((c) => c.text.startsWith('h')).map((c) => c.text).join('')).toBe(giant);
  });

  it('every chunk is within the limit on a mixed lesson', () => {
    const chapters = [
      chapter(':intro', [sentence(1), Array.from({ length: 50 }, (_, i) => sentence(i)).join(' ')]),
      chapter('phan-a', Array.from({ length: 20 }, (_, i) => sentence(i, 30))),
    ];
    const chunks = packChunks(chapters, 700);
    for (const chunk of chunks) expect(chunk.text.length).toBeLessThanOrEqual(700);
    expectLossless(chapters, chunks);
  });

  it('attaches ### marks to the chunk holding their paragraph, with the right offset', () => {
    const paragraphs = ['Mở đầu.', 'Mục con một.', 'Nội dung một.', 'Mục con hai.', 'x'.repeat(480)];
    const marks = [
      { id: 'muc-mot', title: 'Mục con một', paragraphIndex: 1 },
      { id: 'muc-hai', title: 'Mục con hai', paragraphIndex: 3 },
    ];
    const chunks = packChunks([chapter(':intro', paragraphs, marks)], 500);
    expect(chunks).toHaveLength(2);
    const [first, second] = chunks;
    expect(first.marks.map((m) => m.id)).toEqual(['muc-mot', 'muc-hai']);
    for (const mark of first.marks) expect(first.text.slice(mark.charOffset)).toMatch(new RegExp(`^${mark.title}`));
    expect(second.marks).toEqual([]);
  });

  it('intro-only lesson with several marks (no ## at all)', () => {
    const paragraphs = Array.from({ length: 12 }, (_, i) => (i % 3 === 0 ? `Mốc ${i}.` : 'n'.repeat(150)));
    const marks = [0, 3, 6, 9].map((i) => ({ id: `moc-${i}`, title: `Mốc ${i}`, paragraphIndex: i }));
    const chunks = packChunks([chapter(':intro', paragraphs, marks)], 500);
    expect(chunks.every((c) => c.chapterIndex === 0)).toBe(true);
    const placed = chunks.flatMap((c) => c.marks.map((m) => ({ ...m, text: c.text })));
    expect(placed.map((m) => m.id)).toEqual(['moc-0', 'moc-3', 'moc-6', 'moc-9']);
    for (const mark of placed) expect(mark.text.slice(mark.charOffset).startsWith(mark.title)).toBe(true);
  });

  it('rejects a non-positive limit', () => {
    expect(() => packChunks([chapter(':intro', ['a'])], 0)).toThrow(/maxChars/);
  });
});
