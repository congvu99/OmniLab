// Contract test of the speech script extractor over every lesson in the repo.
// Headings are stood in from the AST itself (slug `h<i>`); the real slugs are
// checked against the built HTML after `pnpm build` (see the phase report).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toString } from 'mdast-util-to-string';
import { describe, expect, it } from 'vitest';
import { parseLessonFrontmatter, stripFrontmatter } from '../scripts/lib/frontmatter.mjs';
import { parseMdx } from '../scripts/lib/mdx-text-extract.mjs';
import { loadDomains } from '../scripts/lib/parse-domain-yaml.mjs';
import { DISCLAIMER_LABEL } from '../src/lib/disclaimer-copy.ts';
import { findTitleDuplicate } from '../src/lib/lesson-reader-model.ts';
import { INTRO_CHAPTER_ID, parseSpeechScripts, SPEECH_EXTRACTOR_VERSION } from '../src/lib/speech-script-contract.ts';
import { buildSpeechLesson, CODE_BLOCK_SENTENCE } from '../src/lib/speech-script-extract.ts';
import { collapseSpaces, collectHeadings, containsJsx, headingPlainText } from '../src/lib/speech-script-text.ts';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LESSONS_DIR = path.join(ROOT, 'src', 'content', 'lessons');
const FINANCE_DOMAINS = new Set(loadDomains(path.join(ROOT, 'src', 'content', 'domains')).filter((d) => d.isFinance === true).map((d) => d.id));

function walkMdxFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return walkMdxFiles(full);
    return entry.endsWith('.mdx') ? [full] : [];
  });
}

function jsxNodes(node, name, out = []) {
  if (node.type?.startsWith('mdxJsx') && node.name === name) out.push(node);
  for (const child of node.children ?? []) jsxNodes(child, name, out);
  return out;
}

const corpus = walkMdxFiles(LESSONS_DIR).map((file) => {
  const source = readFileSync(file, 'utf8');
  const data = parseLessonFrontmatter(source);
  const body = stripFrontmatter(source);
  const tree = parseMdx(body);
  const headings = collectHeadings(tree).map((node, i) => ({ depth: node.depth, text: headingPlainText(node), slug: `h${i}` }));
  const duplicate = findTitleDuplicate(headings, data.title);
  const visible = headings.filter((h) => h !== duplicate);
  const id = `${data.domain}/${data.module}/${path.basename(file, '.mdx').replace(/^\d+-/, '')}`;
  const warnings = [];
  const lesson = buildSpeechLesson(
    { id, title: data.title, body, headings, hasPageDisclaimer: FINANCE_DOMAINS.has(data.domain) },
    (message) => warnings.push(message),
  );
  return { id, data, body, tree, visible, lesson, warnings };
});

const scriptOf = (entry) => entry.lesson.chapters.flatMap((c) => c.paragraphs);

describe('speech scripts over the whole lesson corpus', () => {
  it('extracts every lesson with zero warnings into a contract-valid file', () => {
    expect(corpus.length).toBeGreaterThanOrEqual(78);
    expect(corpus.flatMap((e) => e.warnings)).toEqual([]);
    const file = parseSpeechScripts(
      JSON.parse(JSON.stringify({ v: 1, extractorVersion: SPEECH_EXTRACTOR_VERSION, lessons: corpus.map((e) => e.lesson) })),
    );
    expect(file.lessons).toHaveLength(corpus.length);
  });

  // A single `|` is legitimate inline code ("sort | unique"); a leaked table row has two or more.
  it('no paragraph is empty or leaks markup (fences, table pipes, JSX/HTML tags, imports)', () => {
    const leaks = corpus.flatMap((e) =>
      scriptOf(e)
        .filter((p) => p.trim() === '' || p.includes('```') || /\|.*\|/.test(p) || /<\/?[A-Za-z][\w.-]*(\s[^<>]*)?\/?>/.test(p) || p.includes('import '))
        .map((p) => `${e.id}: ${p.slice(0, 120)}`),
    );
    expect(leaks).toEqual([]);
  });

  it('reads the disclaimer exactly once where the page shows it, never elsewhere', () => {
    for (const e of corpus) {
      const expected = FINANCE_DOMAINS.has(e.data.domain) || containsJsx(e.tree, 'Disclaimer') ? 1 : 0;
      const count = scriptOf(e).filter((p) => p.includes(DISCLAIMER_LABEL)).length;
      expect(count, e.id).toBe(expected);
    }
  });

  it('every code fence becomes the fixed sentence', () => {
    for (const e of corpus) {
      const fences = (e.body.match(/^\s*```[^\n]*\n[\s\S]*?^\s*```/gm) ?? []).length;
      const sentences = scriptOf(e).filter((p) => p === CODE_BLOCK_SENTENCE).length;
      expect(sentences, e.id).toBe(fences);
    }
  });

  it('ReviewNote content is never read', () => {
    for (const e of corpus) {
      const script = scriptOf(e).join(' ');
      for (const note of jsxNodes(e.tree, 'ReviewNote')) {
        for (const block of note.children ?? []) {
          const text = collapseSpaces(toString(block));
          if (text.length > 60) expect(script, e.id).not.toContain(text.slice(0, 60));
        }
      }
    }
  });

  it('chapter and mark ids are unique; chapters follow the TOC and marks the visible ###', () => {
    for (const e of corpus) {
      const ids = e.lesson.chapters.flatMap((c) => [c.id, ...c.marks.map((m) => m.id)]);
      expect(new Set(ids).size, e.id).toBe(ids.length);
      expect(e.lesson.chapters[0].id, e.id).toBe(INTRO_CHAPTER_ID);
      const chapterIds = e.lesson.chapters.slice(1).map((c) => c.id);
      expect(chapterIds, e.id).toEqual(e.visible.filter((h) => h.depth === 2).map((h) => h.slug));
      const markIds = e.lesson.chapters.flatMap((c) => c.marks.map((m) => m.id));
      expect(markIds, e.id).toEqual(e.visible.filter((h) => h.depth === 3).map((h) => h.slug));
    }
  });

  it('lessons without ## still get their ### marks inside the intro chapter', () => {
    const withoutH2 = corpus.filter((e) => !e.visible.some((h) => h.depth === 2));
    expect(withoutH2.length).toBeGreaterThan(0);
    for (const e of withoutH2) {
      expect(e.lesson.chapters, e.id).toHaveLength(1);
      expect(e.lesson.chapters[0].marks.length, e.id).toBe(e.visible.filter((h) => h.depth === 3).length);
    }
    const chars = corpus.reduce((sum, e) => sum + scriptOf(e).join('\n').length, 0);
    const chapters = corpus.reduce((sum, e) => sum + e.lesson.chapters.length, 0);
    const marks = corpus.reduce((sum, e) => sum + e.lesson.chapters.reduce((n, c) => n + c.marks.length, 0), 0);
    const largest = Math.max(...corpus.map((e) => scriptOf(e).join('\n').length));
    console.info(
      `[speech-corpus] lessons=${corpus.length} chars=${chars} chapters=${chapters} (intro ${corpus.length}) marks=${marks} ` +
        `withoutH2=${withoutH2.length} largestLessonChars=${largest}`,
    );
  });
});
