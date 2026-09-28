#!/usr/bin/env node
// Fails the build if any lesson MDX diverges from its original source
// snapshot. Run standalone with `pnpm verify:fidelity`; also runs as part of
// `pnpm build` (see package.json — pnpm 9 does not auto-run `prebuild`
// unless `enable-pre-post-scripts=true` is set, which we cannot assume on
// the deploy host, so `build` explicitly chains this script first).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compareNormalized,
  normalizeText,
  textFromHtmlDocument,
  textFromLessonMdx,
  textFromMarkdownSource,
} from './lib/fidelity.mjs';
import { parseLessonFrontmatter } from './lib/frontmatter.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LESSONS_DIR = path.join(ROOT, 'src', 'content', 'lessons');
const CONTENT_SOURCES_DIR = path.join(ROOT, 'content-sources');
const FINANCE_HTML_PATH = path.join(CONTENT_SOURCES_DIR, 'finance', 'index.html');

// Must stay in sync with src/content/domains/tai-chinh.yaml `modules[].id`
// order — see scripts/lib/frontmatter.mjs for why we do not parse YAML here.
const FINANCE_MODULE_ORDER = [
  'khoi-dong',
  'lo-trinh-12-tuan',
  'thuc-hanh',
  'an-toan',
  'nguon-hoc',
  'di-tiep',
];

function walkMdxFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkMdxFiles(full));
    } else if (entry.endsWith('.mdx')) {
      results.push(full);
    }
  }
  return results;
}

function loadLesson(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const frontmatter = parseLessonFrontmatter(source);
  return { filePath, source, frontmatter };
}

function fail(label, comparison) {
  console.error(`\nFIDELITY MISMATCH: ${label}`);
  console.error(`  ...${comparison.contextA}...`);
  console.error('  vs (source):');
  console.error(`  ...${comparison.contextB}...`);
}

function verifySystemDesignLesson(lesson) {
  const snapshotPath = path.join(CONTENT_SOURCES_DIR, lesson.frontmatter.source.snapshot);
  const snapshotSource = readFileSync(snapshotPath, 'utf8');
  const sourceText = normalizeText(textFromMarkdownSource(snapshotSource));
  const lessonText = normalizeText(textFromLessonMdx(lesson.source));
  const comparison = compareNormalized(sourceText, lessonText);
  if (!comparison.ok) {
    fail(path.relative(ROOT, lesson.filePath), {
      contextA: comparison.contextB, // lesson text is "b" below; keep label order (lesson, source)
      contextB: comparison.contextA,
    });
    return false;
  }
  return true;
}

function verifyFinance(financeLessons) {
  if (financeLessons.length === 0) return true;
  const byModuleThenOrder = [...financeLessons].sort((a, b) => {
    const moduleDiff =
      FINANCE_MODULE_ORDER.indexOf(a.frontmatter.module) - FINANCE_MODULE_ORDER.indexOf(b.frontmatter.module);
    if (moduleDiff !== 0) return moduleDiff;
    return a.frontmatter.order - b.frontmatter.order;
  });
  const concatenated = byModuleThenOrder.map((lesson) => textFromLessonMdx(lesson.source)).join(' ');
  const lessonsText = normalizeText(concatenated);

  const html = readFileSync(FINANCE_HTML_PATH, 'utf8');
  // Content = <div class="hero"> + all <section> inside <main> (see
  // phase-03 report "Finance body-text boundary"). nav/masthead/footer are
  // navigation chrome, not original content, and are intentionally excluded
  // here by only feeding the hero+main HTML fragment to the extractor.
  const heroMatch = html.match(/<div class="hero">[\s\S]*?<\/div>\s*<\/header>/);
  const mainMatch = html.match(/<main>([\s\S]*)<\/main>/);
  if (!heroMatch || !mainMatch) {
    throw new Error('Could not locate hero/main sections in content-sources/finance/index.html');
  }
  const bodyHtml = `${heroMatch[0]}${mainMatch[1]}`;
  const sourceText = normalizeText(textFromHtmlDocument(bodyHtml));

  const comparison = compareNormalized(sourceText, lessonsText);
  if (!comparison.ok) {
    fail('finance (all lessons concatenated) vs content-sources/finance/index.html', {
      contextA: comparison.contextB,
      contextB: comparison.contextA,
    });
    return false;
  }
  return true;
}

function main() {
  const files = walkMdxFiles(LESSONS_DIR);
  if (files.length === 0) {
    console.error(`No lesson MDX files found under ${LESSONS_DIR}`);
    process.exit(1);
  }

  const lessons = files.map(loadLesson);
  const systemDesignLessons = lessons.filter((l) => l.frontmatter.domain === 'kien-truc');
  const financeLessons = lessons.filter((l) => l.frontmatter.domain === 'tai-chinh');
  const otherLessons = lessons.filter(
    (l) => l.frontmatter.domain !== 'kien-truc' && l.frontmatter.domain !== 'tai-chinh',
  );

  let ok = true;
  for (const lesson of systemDesignLessons) {
    ok = verifySystemDesignLesson(lesson) && ok;
  }
  ok = verifyFinance(financeLessons) && ok;

  if (!ok) {
    console.error(`\nverify-fidelity: FAILED (${lessons.length} lesson files checked)`);
    process.exit(1);
  }

  console.log(
    `verify-fidelity: OK — ${systemDesignLessons.length} kien-truc + ${financeLessons.length} tai-chinh` +
      (otherLessons.length ? ` + ${otherLessons.length} other` : '') +
      ' lesson(s) match their source snapshots.',
  );
}

main();
