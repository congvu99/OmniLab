// MDX -> speech script reading rules, one fixture per rule.
import { describe, expect, it, vi } from 'vitest';
import { parseMdx } from '../scripts/lib/mdx-text-extract.mjs';
import { DISCLAIMER_LABEL } from '../src/lib/disclaimer-copy.ts';
import { INTRO_CHAPTER_ID, INTRO_CHAPTER_TITLE, speechScriptHashInput } from '../src/lib/speech-script-contract.ts';
import {
  buildSpeechLesson,
  CODE_BLOCK_SENTENCE,
  DISCLAIMER_SENTENCE,
  extractSpeechChapters,
  HEADING_MISMATCH_WARNING,
} from '../src/lib/speech-script-extract.ts';
import { collectHeadings, headingPlainText } from '../src/lib/speech-script-text.ts';

/** Stand-in for render(entry).headings: every AST heading, slug `h<i>`. */
function fakeHeadings(body) {
  return collectHeadings(parseMdx(body)).map((node, i) => ({ depth: node.depth, text: headingPlainText(node), slug: `h${i}` }));
}

function extract(body, { title = 'Bài mẫu', hasPageDisclaimer = false, headings = fakeHeadings(body) } = {}) {
  return extractSpeechChapters({ body, title, headings, hasPageDisclaimer });
}

const allParagraphs = (result) => result.chapters.flatMap((c) => c.paragraphs);

describe('lesson opening', () => {
  it('reads the title first, drops imports and the heading that repeats the title', () => {
    const body = "import svg from './a.svg?raw';\n\n## Bài mẫu\n\nNội dung đầu\n\n## Phần hai\n\nChữ";
    const { chapters, warnings } = extract(body);
    expect(warnings).toEqual([]);
    expect(chapters.map((c) => c.id)).toEqual([INTRO_CHAPTER_ID, 'h1']);
    expect(chapters[0]).toEqual({ id: INTRO_CHAPTER_ID, title: INTRO_CHAPTER_TITLE, paragraphs: ['Bài mẫu.', 'Nội dung đầu.'], marks: [] });
    expect(chapters[1]).toEqual({ id: 'h1', title: 'Phần hai', paragraphs: ['Phần hai.', 'Chữ.'], marks: [] });
  });

  it('reads the disclaimer once even when both the domain and the MDX carry it', () => {
    const { chapters } = extract('<Disclaimer />\n\nThân bài', { hasPageDisclaimer: true });
    expect(chapters[0].paragraphs).toEqual(['Bài mẫu.', DISCLAIMER_SENTENCE, 'Thân bài.']);
    expect(DISCLAIMER_SENTENCE.startsWith(DISCLAIMER_LABEL)).toBe(true);
    expect(extract('Chữ').chapters[0].paragraphs.join(' ')).not.toContain(DISCLAIMER_LABEL);
  });

  it('a lesson without headings is a single intro chapter', () => {
    const { chapters } = extract('Một đoạn.\n\nHai đoạn');
    expect(chapters).toEqual([{ id: INTRO_CHAPTER_ID, title: INTRO_CHAPTER_TITLE, paragraphs: ['Bài mẫu.', 'Một đoạn.', 'Hai đoạn.'], marks: [] }]);
  });
});

describe('chapters and ### marks', () => {
  it('### without any ## become approximate marks of the intro chapter', () => {
    const { chapters } = extract('### Bài mẫu\n\nA\n\n### Mốc một\n\nB\n\n### Mốc hai\n\nC');
    expect(chapters).toHaveLength(1);
    expect(chapters[0].paragraphs).toEqual(['Bài mẫu.', 'A.', 'Mốc một.', 'B.', 'Mốc hai.', 'C.']);
    expect(chapters[0].marks).toEqual([
      { id: 'h1', title: 'Mốc một', paragraphIndex: 2 },
      { id: 'h2', title: 'Mốc hai', paragraphIndex: 4 },
    ]);
  });

  it('### under ## attaches to that chapter; #### is only read', () => {
    const { chapters } = extract('## Một\n\nA\n\n### Con\n\nB\n\n#### Sâu\n\n## Hai\n\nC');
    expect(chapters.map((c) => c.id)).toEqual([INTRO_CHAPTER_ID, 'h0', 'h3']);
    expect(chapters[1].marks).toEqual([{ id: 'h1', title: 'Con', paragraphIndex: 2 }]);
    expect(chapters[1].paragraphs).toEqual(['Một.', 'A.', 'Con.', 'B.', 'Sâu.']);
  });

  it('ReviewNote is silent, its headings still consume ids, and an empty chapter is dropped', () => {
    const body = '## Một\n\nA\n\n<ReviewNote>\n\n## Ghi chú\n\n- Sửa chữ X\n\n</ReviewNote>\n\n## Hai\n\nB';
    const { chapters } = extract(body);
    expect(chapters.map((c) => c.id)).toEqual([INTRO_CHAPTER_ID, 'h0', 'h2']);
    expect(allParagraphs({ chapters }).join(' ')).not.toMatch(/Ghi chú|Sửa chữ/);
  });

  it('a hard break inside a heading matches Astro\'s rendered text (newline, not glued)', () => {
    const body = 'Dòng một\\\ndòng hai\n===\n\n## Mục\n\nA';
    const headings = [{ depth: 1, text: 'Dòng một\ndòng hai', slug: 'dong' }, { depth: 2, text: 'Mục', slug: 'muc' }];
    const { chapters, warnings } = extract(body, { headings });
    expect(warnings).toEqual([]);
    expect(chapters.map((c) => c.id)).toEqual([INTRO_CHAPTER_ID, 'muc']);
    expect(chapters[0].paragraphs).toEqual(['Bài mẫu.', 'Dòng một dòng hai.']);
  });

  it('heading mismatch falls back to one intro chapter without marks, with a warning', () => {
    const body = '## Một\n\nA\n\n### Con\n\nB';
    const headings = [{ depth: 2, text: 'Khác hẳn', slug: 'x' }, { depth: 3, text: 'Con', slug: 'con' }];
    const { chapters, warnings } = extract(body, { headings });
    expect(warnings).toEqual([HEADING_MISMATCH_WARNING]);
    expect(chapters).toEqual([
      { id: INTRO_CHAPTER_ID, title: INTRO_CHAPTER_TITLE, paragraphs: ['Bài mẫu.', 'Một.', 'A.', 'Con.', 'B.'], marks: [] },
    ]);
    expect(extract(body, { headings: headings.slice(0, 1) }).warnings).toEqual([HEADING_MISMATCH_WARNING]);
  });
});

describe('block reading rules', () => {
  it('code fence reads a fixed sentence; inline code reads its text', () => {
    expect(allParagraphs(extract('Gọi `GET /api`\n\n```js\nconst a = 1;\n```'))).toEqual(['Bài mẫu.', 'Gọi GET /api.', CODE_BLOCK_SENTENCE]);
  });

  it('table rows read "column: value", empty cells and nameless columns handled', () => {
    const body = '| Khoản | Số tiền |\n|---|---|\n| Tiền nhà | 5 triệu |\n| Ăn uống |  |\n|  | 2 triệu. |';
    expect(allParagraphs(extract(body)).slice(1)).toEqual(['Khoản: Tiền nhà; Số tiền: 5 triệu.', 'Khoản: Ăn uống.', 'Số tiền: 2 triệu.']);
    const nameless = '|  | B |\n|---|---|\n| x | y |';
    expect(allParagraphs(extract(nameless)).slice(1)).toEqual(['x; B: y.']);
  });

  it('lists and blockquotes read one paragraph per block, without numbering', () => {
    expect(allParagraphs(extract('1. Một\n2. Hai\n   - con\n\n> Trích dẫn')).slice(1)).toEqual(['Một.', 'Hai.', 'con.', 'Trích dẫn.']);
  });

  it('links read their text; images, <sup> and thematic breaks are silent; <br/> is a space', () => {
    const body = 'Xem [tài liệu](https://x.vn) tiếp<sup><a href="#n">1</a></sup>\n\n![ảnh](a.png)\n\n---\n\nA<br/>B';
    expect(allParagraphs(extract(body)).slice(1)).toEqual(['Xem tài liệu tiếp.', 'A B.']);
  });
});

describe('JSX reading rules', () => {
  it('Figure reads only its caption, including a template-literal caption with <a>', () => {
    const body = [
      '<Figure added svg={svg} alt="ALT" caption="Chú thích một" credit="Nguồn X" />',
      '<Figure src="a.png" alt="ALT2" />',
      '<Figure alt="ALT3" caption={`Theo <a href="https://x.vn">báo cáo</a> năm 2024`} />',
    ].join('\n\n');
    expect(allParagraphs(extract(body)).slice(1)).toEqual(['Chú thích một.', 'Theo báo cáo năm 2024.']);
  });

  it('RealLife reads its label + title, then its content', () => {
    expect(allParagraphs(extract('<RealLife title="Tủ lạnh">\n\nNội dung\n\n</RealLife>')).slice(1)).toEqual([
      'Ví dụ đời sống: Tủ lạnh.',
      'Nội dung.',
    ]);
    expect(allParagraphs(extract('<RealLife>\n\nNội dung\n\n</RealLife>')).slice(1)).toEqual(['Ví dụ đời sống.', 'Nội dung.']);
  });

  it('Note reads its title then content; TranslatorNote keeps its ## as a chapter; details/summary read', () => {
    const body = '<Note title="Lưu ý">\n\nGiữ tiền\n\n</Note>\n\n<TranslatorNote>\n\n## Ghi chú người dịch\n\nDịch\n\n</TranslatorNote>\n\n<details>\n<summary>Mở</summary>\n\nẨn\n\n</details>';
    const { chapters, warnings } = extract(body);
    expect(warnings).toEqual([]);
    expect(chapters[0].paragraphs.slice(1)).toEqual(['Lưu ý.', 'Giữ tiền.']);
    expect(chapters[1]).toMatchObject({ id: 'h0', title: 'Ghi chú người dịch', paragraphs: ['Ghi chú người dịch.', 'Dịch.', 'Mở.', 'Ẩn.'] });
  });

  it('unknown JSX is read and reported', () => {
    const { chapters, warnings } = extract('<Callout>\n\nChữ lạ\n\n</Callout>');
    expect(chapters[0].paragraphs).toContain('Chữ lạ.');
    expect(warnings).toEqual(['unknown JSX <Callout>']);
  });
});

describe('buildSpeechLesson', () => {
  const source = (id, body) => ({ id, title: 'Tiêu đề', body, headings: fakeHeadings(body), hasPageDisclaimer: false });

  it('hashes the canonical script and is deterministic', async () => {
    const warn = vi.fn();
    const lesson = buildSpeechLesson(source('a/b/c', '## Một\n\nA'), warn);
    const { createHash } = await import('node:crypto');
    expect(lesson.scriptHash).toBe(createHash('sha256').update(speechScriptHashInput(lesson.chapters)).digest('hex'));
    expect(buildSpeechLesson(source('a/b/c', '## Một\n\nA'), warn).scriptHash).toBe(lesson.scriptHash);
    expect(buildSpeechLesson(source('a/b/c', '## Một\n\nB'), warn).scriptHash).not.toBe(lesson.scriptHash);
    expect(warn).not.toHaveBeenCalled();
  });

  it('a lesson that fails to extract is skipped with a warning; the others still build', () => {
    const warn = vi.fn();
    const results = [source('a/b/ok', 'Chữ'), { ...source('a/b/broken', 'Chữ'), body: '<Figure caption="x"' }, source('a/b/ok-2', 'Chữ')].map((s) =>
      buildSpeechLesson(s, warn),
    );
    expect(results.filter(Boolean).map((l) => l.id)).toEqual(['a/b/ok', 'a/b/ok-2']);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/^\[tts-scripts\] skipped a\/b\/broken: /);
  });

  it('extractor warnings are prefixed with [tts-scripts] and the lesson id', () => {
    const warn = vi.fn();
    buildSpeechLesson({ ...source('a/b/c', '## Một'), headings: [] }, warn);
    expect(warn).toHaveBeenCalledWith('[tts-scripts] heading mismatch a/b/c');
  });
});
