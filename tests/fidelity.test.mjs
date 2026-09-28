// Pins down exactly what verify-fidelity must accept (added RealLife/Figure
// content, URL changes) vs reject (changed/deleted original text, injected
// MDX expressions) — see scripts/verify-fidelity.mjs.
import { describe, expect, it } from 'vitest';
import {
  compareNormalized,
  findForbiddenMdxConstructs,
  normalizeText,
  textFromHtmlDocument,
  textFromLessonMdx,
  textFromMarkdownSource,
} from '../scripts/lib/fidelity.mjs';

const ORIGINAL_MD = `---
nguon: Test
tac-gia: Ai do
link-goc: ../../README.md#cache
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Bộ nhớ đệm (Cache)

## Nội dung gốc

<p align="center">
  <img src="../../images/Q6z24La.png" alt="Sơ đồ bộ điều phối tra cache">
  <br/>
  <i>Nguồn: <a href="http://example.com">Scalable system design patterns</a></i>
</p>

Bộ nhớ đệm giúp cải thiện thời gian tải trang. Xem thêm [reverse proxy](../02-chu-de/04-reverse-proxy.md).

## Ghi chú của người dịch

Đây là ghi chú của người dịch, giữ nguyên trong bản dịch.
`;

function toMdx(body) {
  return `---
domain: "kien-truc"
module: "chu-de"
order: 7
title: "Bộ nhớ đệm (Cache)"
summary: "Cache giúp giảm tải hệ thống."
source:
  name: "Test"
  author: "Ai do"
  license: "CC BY 4.0"
  snapshot: "system-design/02-chu-de/07-cache.md"
examplesReviewed: false
---

${body}
`;
}

const BASELINE_MDX_BODY = `# Bộ nhớ đệm (Cache)

## Nội dung gốc

<Figure src="/legacy/Q6z24La.png" alt="Sơ đồ bộ điều phối tra cache" credit={\`Nguồn: <a href="http://example.com">Scalable system design patterns</a>\`} />

Bộ nhớ đệm giúp cải thiện thời gian tải trang. Xem thêm [reverse proxy](/hoc/kien-truc/chu-de/reverse-proxy).

<TranslatorNote>
## Ghi chú của người dịch

Đây là ghi chú của người dịch, giữ nguyên trong bản dịch.
</TranslatorNote>
`;

function sourceText() {
  return normalizeText(textFromMarkdownSource(ORIGINAL_MD));
}

describe('verify-fidelity text extraction + normalization', () => {
  it('passes when only <RealLife> is added', () => {
    const mdx = toMdx(
      `${BASELINE_MDX_BODY}\n<RealLife title="Ví dụ đời sống">\n\nĐây là ví dụ hoàn toàn mới, không có trong bản gốc.\n\n</RealLife>\n`,
    );
    const result = compareNormalized(sourceText(), normalizeText(textFromLessonMdx(mdx)));
    expect(result.ok).toBe(true);
  });

  it('fails when one original word is changed', () => {
    const mdx = toMdx(BASELINE_MDX_BODY.replace('cải thiện', 'phá hủy'));
    const result = compareNormalized(sourceText(), normalizeText(textFromLessonMdx(mdx)));
    expect(result.ok).toBe(false);
  });

  it('fails when a paragraph is deleted', () => {
    const withoutParagraph = BASELINE_MDX_BODY.replace(
      /Bộ nhớ đệm giúp cải thiện[\s\S]*?reverse-proxy\)\.\n/,
      '',
    );
    const mdx = toMdx(withoutParagraph);
    const result = compareNormalized(sourceText(), normalizeText(textFromLessonMdx(mdx)));
    expect(result.ok).toBe(false);
  });

  it('passes when an internal link URL changes (visible text only compared)', () => {
    const mdx = toMdx(
      BASELINE_MDX_BODY.replace(
        '[reverse proxy](/hoc/kien-truc/chu-de/reverse-proxy)',
        '[reverse proxy](/hoc/kien-truc/chu-de/reverse-proxy#tong-quan)',
      ),
    );
    const result = compareNormalized(sourceText(), normalizeText(textFromLessonMdx(mdx)));
    expect(result.ok).toBe(true);
  });

  it('passes for NFC vs NFD equivalent text', () => {
    // "Đệm" with a combining mark (NFD) vs precomposed (NFC) must be equal
    // after normalizeText().
    const nfd = 'Bỏ nhỏ đệm'.normalize('NFD');
    const nfc = nfd.normalize('NFC');
    expect(normalizeText(nfd)).toBe(normalizeText(nfc));
  });

  it('passes when a <Figure added> is inserted', () => {
    const mdx = toMdx(
      `${BASELINE_MDX_BODY}\n<Figure added alt="Sơ đồ SVG mới" caption="Minh họa bổ sung">\n  <svg />\n</Figure>\n`,
    );
    const result = compareNormalized(sourceText(), normalizeText(textFromLessonMdx(mdx)));
    expect(result.ok).toBe(true);
  });

  it('fails when a Figure caption from the original is altered', () => {
    const mdx = toMdx(
      BASELINE_MDX_BODY.replace(
        'Sơ đồ bộ điều phối tra cache',
        'Sơ đồ bộ điều phối tra cache ĐÃ BỊ SỬA',
      ),
    );
    const result = compareNormalized(sourceText(), normalizeText(textFromLessonMdx(mdx)));
    expect(result.ok).toBe(false);
  });
});

describe('finance HTML document text extraction', () => {
  it('extracts visible text of a section, ignoring markup/attributes', () => {
    const html = `<!doctype html><html><body><section id="a"><h2>Tiêu đề</h2><p>Nội dung <strong>quan trọng</strong>.</p></section></body></html>`;
    const text = normalizeText(textFromHtmlDocument(html));
    expect(text).toContain('Tiêu đề');
    expect(text).toContain('Nội dung quan trọng.');
  });
});

describe('<Note title> text is fidelity-checked', () => {
  it('fails when a Note title differs from the original', () => {
    const mdx = toMdx(`${BASELINE_MDX_BODY}\n<Note title="Tiêu đề chèn thêm">\n\nGhi chú.\n\n</Note>\n`);
    // The Note's title itself is added text not in ORIGINAL_MD, so any
    // non-empty title necessarily diverges from the source — this pins the
    // fix (title used to be silently ignored) rather than testing one
    // specific string.
    const result = compareNormalized(sourceText(), normalizeText(textFromLessonMdx(mdx)));
    expect(result.ok).toBe(false);
  });
});

describe('findForbiddenMdxConstructs (block silent text injection)', () => {
  it('is clean for plain import statements', () => {
    const mdx = toMdx(`import svg from '../../../../assets/illustrations/kien-truc/foo.svg?raw';\n\n${BASELINE_MDX_BODY}`);
    expect(findForbiddenMdxConstructs(mdx)).toEqual([]);
  });

  it('flags a bare {"..."} mdxFlowExpression', () => {
    const mdx = toMdx(`${BASELINE_MDX_BODY}\n{"Câu chèn thêm"}\n`);
    const violations = findForbiddenMdxConstructs(mdx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toMatch(/mdxFlowExpression/);
  });

  it('flags an inline {expr} mdxTextExpression', () => {
    const mdx = toMdx(`Đoạn văn có {"chèn"} ở giữa câu.\n`);
    const violations = findForbiddenMdxConstructs(mdx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toMatch(/mdxTextExpression/);
  });

  it('flags export statements (not just their {x} usage)', () => {
    const mdx = toMdx(`export const x = "chèn";\n\n{x}\n`);
    const violations = findForbiddenMdxConstructs(mdx);
    // Both the export and the {x} read (a block-level {x} parses as
    // mdxFlowExpression, not mdxTextExpression) are separately flagged.
    expect(violations.some((v) => v.includes('ExportNamedDeclaration'))).toBe(true);
    expect(violations.some((v) => v.includes('mdxFlowExpression'))).toBe(true);
  });
});
