import { describe, expect, it } from 'vitest';
import { mdxToPlainText } from '../src/lib/search-mdx-to-text.ts';

// Structurally similar to real lesson MDX bodies (see
// src/content/lessons/kien-truc/chu-de/07-cache.mdx) but shortened/paraphrased.
const sample = `
import img_a from '../../../../assets/legacy/system-design/a.png';
import svgFoo from '../../../../assets/illustrations/kien-truc/foo.svg?raw';

# Bộ nhớ đệm (Cache)

## Nội dung gốc

<Figure src={img_a} alt="Sơ đồ" credit={\`Nguồn: <a href="http://example.com">Ví dụ</a>\`} />

Bộ nhớ đệm giúp giảm tải cho hệ thống.

<RealLife title="Tủ lạnh ở nhà">

Tủ lạnh nhà bạn có sẵn đồ ăn, lấy dùng ngay — đây là cache hit.

</RealLife>

### Cache phía client (Client caching)

Cache có thể nằm ở [phía máy chủ](/hoc/kien-truc/chu-de/reverse-proxy), hoặc dùng \`localStorage\`.

<Disclaimer />
`;

describe('mdxToPlainText', () => {
  const text = mdxToPlainText(sample);

  it('drops import lines', () => {
    expect(text).not.toMatch(/import /);
  });

  it('drops Figure entirely (including the embedded <a> in its credit attribute)', () => {
    expect(text).not.toMatch(/Sơ đồ/);
    expect(text).not.toMatch(/Ví dụ/);
    expect(text).not.toMatch(/<a/);
  });

  it('keeps RealLife inner prose but strips its tags', () => {
    expect(text).toContain('Tủ lạnh nhà bạn có sẵn đồ ăn');
    expect(text).not.toMatch(/RealLife/);
  });

  it('keeps heading and link text, drops markdown link syntax', () => {
    expect(text).toContain('Bộ nhớ đệm (Cache)');
    expect(text).toContain('phía máy chủ');
    expect(text).not.toMatch(/\]\(/);
  });

  it('unwraps inline code, keeping the code text', () => {
    expect(text).toContain('localStorage');
  });

  it('drops a self-closing component with no children (Disclaimer)', () => {
    expect(text).not.toMatch(/Disclaimer/);
  });

  it('collapses whitespace to single spaces', () => {
    expect(text).not.toMatch(/\s{2,}/);
  });

  it('truncates to maxLength', () => {
    const long = 'a'.repeat(5000);
    expect(mdxToPlainText(long, 100)).toHaveLength(100);
  });
});
