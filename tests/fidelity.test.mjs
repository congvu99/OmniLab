// Tests written BEFORE scripts/verify-fidelity.mjs (see phase-03 step 4):
// pin down exactly what verify-fidelity must accept/reject before it exists.
import { describe, expect, it } from 'vitest';
import {
  compareNormalized,
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
