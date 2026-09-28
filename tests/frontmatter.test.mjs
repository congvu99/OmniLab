// Tests for scripts/lib/frontmatter.mjs's parseLessonFrontmatter tolerance:
// single-quoted scalars and trailing comments previously made `domain`
// parse as a string that never matched 'kien-truc'/'tai-chinh', silently
// dropping the lesson out of verify-fidelity's checks.
import { describe, expect, it } from 'vitest';
import { parseLessonFrontmatter, stringifyLessonFrontmatter } from '../scripts/lib/frontmatter.mjs';

function wrap(yamlBody, body = '# Bài học\n') {
  return `---\n${yamlBody}\n---\n\n${body}`;
}

describe('parseLessonFrontmatter tolerance', () => {
  it('parses double-quoted scalars (the canonical writer format)', () => {
    const data = parseLessonFrontmatter(wrap('domain: "kien-truc"\norder: 7'));
    expect(data.domain).toBe('kien-truc');
    expect(data.order).toBe(7);
  });

  it('parses single-quoted scalars', () => {
    const data = parseLessonFrontmatter(wrap("domain: 'kien-truc'\ntitle: 'Bộ nhớ đệm'"));
    expect(data.domain).toBe('kien-truc');
    expect(data.title).toBe('Bộ nhớ đệm');
  });

  it('parses unquoted scalars', () => {
    const data = parseLessonFrontmatter(wrap('domain: kien-truc\norder: 3'));
    expect(data.domain).toBe('kien-truc');
    expect(data.order).toBe(3);
  });

  it('strips a trailing comment after an unquoted value', () => {
    const data = parseLessonFrontmatter(wrap('domain: kien-truc # temporary note'));
    expect(data.domain).toBe('kien-truc');
  });

  it('strips a trailing comment after a quoted value', () => {
    const data = parseLessonFrontmatter(wrap('domain: "kien-truc" # temporary note'));
    expect(data.domain).toBe('kien-truc');
  });

  it('does not treat a `#` inside a quoted value as a comment', () => {
    const data = parseLessonFrontmatter(wrap('title: "Chủ đề #7"'));
    expect(data.title).toBe('Chủ đề #7');
  });

  it('ignores a full-line comment', () => {
    const data = parseLessonFrontmatter(wrap('# a stray comment line\ndomain: kien-truc'));
    expect(data.domain).toBe('kien-truc');
  });

  it('unescapes doubled single-quotes inside single-quoted scalars (YAML rule)', () => {
    const data = parseLessonFrontmatter(wrap("title: 'It''s cache'"));
    expect(data.title).toBe("It's cache");
  });

  it('parses nested source.* fields regardless of quoting style', () => {
    const data = parseLessonFrontmatter(
      wrap(["source:", "  name: 'Test'", '  author: "Ai do"', '  license: CC BY 4.0', '  snapshot: "a/b.md"'].join('\n')),
    );
    expect(data.source).toEqual({ name: 'Test', author: 'Ai do', license: 'CC BY 4.0', snapshot: 'a/b.md' });
  });

  it('round-trips through stringifyLessonFrontmatter unchanged', () => {
    const written = stringifyLessonFrontmatter({
      domain: 'kien-truc',
      module: 'chu-de',
      order: 7,
      title: 'Bộ nhớ đệm (Cache)',
      summary: 'Tóm tắt.',
      source: { name: 'Test', author: 'Ai do', license: 'CC BY 4.0', snapshot: 'system-design/x.md' },
      examplesReviewed: true,
    });
    const parsed = parseLessonFrontmatter(`${written}\n\n# Bài học\n`);
    expect(parsed.domain).toBe('kien-truc');
    expect(parsed.order).toBe(7);
    expect(parsed.examplesReviewed).toBe(true);
    expect(parsed.source.snapshot).toBe('system-design/x.md');
  });
});
