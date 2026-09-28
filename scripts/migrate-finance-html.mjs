#!/usr/bin/env node
// Splits content-sources/finance/index.html (snapshot of
// D:\documents\bot\reports\deploy\index.html, read-only source) into MDX
// lessons per scripts/finance-split-map.json. Idempotent.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toMdast } from 'hast-util-to-mdast';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';
import {
  parseFinanceHtml,
  findHero,
  findSections,
  resolveLessonHast,
  insertImplicitSpaces,
  promoteTableCaptions,
  markNoteBoxes,
  replaceNoteSentinels,
} from './lib/finance-extract.mjs';
import { escapeBraces } from './lib/system-design-transform.mjs';
import { stringifyLessonFrontmatter } from './lib/frontmatter.mjs';
import { truncateAtSentence } from './lib/summary.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.dirname(SCRIPT_DIR);
const SOURCE_HTML = 'D:/documents/bot/reports/deploy/index.html';
const SNAPSHOT_PATH = path.join(REPO_ROOT, 'content-sources', 'finance', 'index.html');
const LESSONS_OUT_DIR = path.join(REPO_ROOT, 'src', 'content', 'lessons', 'tai-chinh');
const SPLIT_MAP_PATH = path.join(SCRIPT_DIR, 'finance-split-map.json');

const SOURCE_NAME = 'Lộ trình nền tảng tài chính — Sổ tay thực hành';
const SOURCE_AUTHOR = 'OmniLab (tổng hợp)';
// Copyright/license of the source deliverable was not specified by its
// author at hand-off — needs the content owner's confirmation before v1
// can claim a definite license for this domain (see README.md "Bản quyền
// và ghi công").
const LICENSE = 'Chưa xác định — cần user xác nhận';

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function hastToMarkdown(hastRoot) {
  promoteTableCaptions(hastRoot);
  insertImplicitSpaces(hastRoot);
  markNoteBoxes(hastRoot);
  const mdastTree = toMdast(hastRoot, { document: false });
  let markdown = toMarkdown(mdastTree, { extensions: [gfmToMarkdown()], bullet: '-', setext: false });
  markdown = replaceNoteSentinels(markdown);
  markdown = escapeBraces(markdown);
  return markdown.trim();
}

function deriveSummary(markdownBody) {
  // First non-empty line that isn't a heading is a good enough proxy for
  // "first paragraph" here — content is already flat markdown, not mdast.
  const firstParagraph = markdownBody
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block.length > 0 && !block.startsWith('#') && !block.startsWith('<Note>'));
  const text = (firstParagraph ?? markdownBody.slice(0, 200)).replace(/\s+/g, ' ').trim();
  return truncateAtSentence(text, 200);
}

function main() {
  ensureDir(path.dirname(SNAPSHOT_PATH));
  copyFileSync(SOURCE_HTML, SNAPSHOT_PATH);

  const html = readFileSync(SNAPSHOT_PATH, 'utf8');
  const tree = parseFinanceHtml(html);
  const heroEl = findHero(tree);
  const sectionsById = findSections(tree);

  const splitMap = JSON.parse(readFileSync(SPLIT_MAP_PATH, 'utf8'));
  const usedSections = new Set();
  let count = 0;

  for (const entry of splitMap.lessons) {
    usedSections.add(entry.sourceSection);
    const hastRoot = resolveLessonHast(entry, { heroEl, sectionsById });
    const bodyMarkdown = hastToMarkdown(hastRoot);
    const summary = deriveSummary(bodyMarkdown);

    // readingMinutes is intentionally not part of the written frontmatter —
    // it's derived at query time from the lesson body
    // (src/lib/content-queries.ts), so a value frozen here would just go
    // stale the moment the body changes.
    const frontmatterData = {
      domain: 'tai-chinh',
      module: entry.module,
      order: entry.order,
      title: entry.title,
      summary,
      source: {
        name: SOURCE_NAME,
        author: SOURCE_AUTHOR,
        license: LICENSE,
        snapshot: 'finance/index.html',
      },
      examplesReviewed: false,
    };

    const outFilePath = path.join(
      LESSONS_OUT_DIR,
      entry.module,
      `${String(entry.order).padStart(2, '0')}-${entry.slug}.mdx`,
    );
    ensureDir(path.dirname(outFilePath));
    const fileContent = `${stringifyLessonFrontmatter(frontmatterData)}\n\n${bodyMarkdown}\n`;
    writeFileSync(outFilePath, fileContent, 'utf8');
    count += 1;
  }

  // Fail loudly if a section in the source HTML was never mapped to a
  // lesson — that would silently drop original content.
  const allSectionIds = new Set(sectionsById.keys());
  const missing = [...allSectionIds].filter((id) => !usedSections.has(id));
  if (missing.length > 0) {
    throw new Error(`finance-split-map.json does not cover section(s): ${missing.join(', ')}`);
  }

  console.log(`migrate-finance-html: wrote ${count} lesson(s) covering ${allSectionIds.size} source section(s).`);
}

main();
