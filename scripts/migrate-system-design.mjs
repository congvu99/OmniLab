#!/usr/bin/env node
// Migrates the 27 translated system-design lessons + README.md from
// D:\HardSkills\system-design-primer\hoc-tap-vi (read-only source) into
// MDX content collection entries. Idempotent: re-running produces
// byte-identical output.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import { toString as mdastToString } from 'mdast-util-to-string';
import { stringifyLessonFrontmatter } from './lib/frontmatter.mjs';
import { MODULE_DIR_TO_ID, PRIMER_GITHUB_ROOT, PRIMER_GITHUB_BLOB, imageImportName } from './lib/links.mjs';
import { truncateAtSentence } from './lib/summary.mjs';
import {
  escapeBraces,
  escapeKnownStrayGreaterThan,
  convertFigureBlocks,
  convertPlainImages,
  fixSupFootnotes,
  rewriteMarkdownLinks,
  splitTranslatorNote,
} from './lib/system-design-transform.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.dirname(SCRIPT_DIR);
const PRIMER_ROOT = 'D:/HardSkills/system-design-primer';
const SOURCE_DIR = path.join(PRIMER_ROOT, 'hoc-tap-vi');
const SNAPSHOT_DIR = path.join(REPO_ROOT, 'content-sources', 'system-design');
const LESSONS_OUT_DIR = path.join(REPO_ROOT, 'src', 'content', 'lessons', 'kien-truc');
const ASSETS_OUT_DIR = path.join(REPO_ROOT, 'src', 'assets', 'legacy', 'system-design');

const LICENSE = 'CC BY 4.0 (nguyên bản: Donne Martin, The System Design Primer)';

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function listMdFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listMdFiles(full));
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

// --- Step 1: snapshot copy (byte-for-byte) ---------------------------------
function copySnapshot() {
  const files = listMdFiles(SOURCE_DIR);
  let count = 0;
  for (const file of files) {
    const rel = path.relative(SOURCE_DIR, file);
    const dest = path.join(SNAPSHOT_DIR, rel);
    ensureDir(path.dirname(dest));
    copyFileSync(file, dest);
    count += 1;
  }
  return count;
}

// --- Original (translator) frontmatter parsing ------------------------------
function parseOriginalFrontmatter(source) {
  if (!source.startsWith('---')) return { data: {}, body: source };
  const end = source.indexOf('\n---', 3);
  const yamlBlock = source.slice(source.indexOf('\n', 0) + 1, end);
  const afterCloser = source.indexOf('\n', end + 1);
  const body = afterCloser === -1 ? '' : source.slice(afterCloser + 1);
  const data = {};
  for (const line of yamlBlock.split('\n')) {
    const m = line.match(/^([a-z-]+):\s*(.*)$/);
    if (m) data[m[1]] = m[2].trim();
  }
  return { data, body };
}

function resolveSourceUrl(linkGoc) {
  if (!linkGoc) return undefined;
  if (/^https?:\/\//.test(linkGoc)) return linkGoc;
  const stripped = linkGoc.replace(/^(\.\.\/)+/, '');
  if (stripped.startsWith('README.md')) {
    const anchor = stripped.includes('#') ? stripped.slice(stripped.indexOf('#')) : '';
    return `${PRIMER_GITHUB_ROOT}${anchor}`;
  }
  const solutionsMatch = stripped.match(/^solutions\/system_design\/([^/]+)\/README\.md$/);
  if (solutionsMatch) return `${PRIMER_GITHUB_BLOB}/solutions/system_design/${solutionsMatch[1]}/README.md`;
  return linkGoc; // unexpected shape — keep as-is rather than silently drop
}

// --- Title / summary derivation ---------------------------------------------
const mdxParser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);

function deriveTitleAndSummary(mainBody) {
  const tree = mdxParser.parse(mainBody);
  const children = tree.children;
  const h1 = children.find((n) => n.type === 'heading' && n.depth === 1);
  const title = h1 ? mdastToString(h1).trim() : '(chưa có tiêu đề)';

  const headingIdx = children.findIndex(
    (n) => n.type === 'heading' && mdastToString(n).trim() === 'Nội dung gốc',
  );
  let paragraph = null;
  const searchFrom = headingIdx === -1 ? 0 : headingIdx + 1;
  for (let i = searchFrom; i < children.length; i++) {
    if (children[i].type === 'paragraph') {
      paragraph = children[i];
      break;
    }
  }
  const rawSummary = paragraph ? mdastToString(paragraph).replace(/\s+/g, ' ').trim() : title;
  return { title, summary: truncateAtSentence(rawSummary, 200) };
}

// --- Per-file transform ------------------------------------------------------
function transformFile({ absPath, moduleDir, isReadme }) {
  const raw = readFileSync(absPath, 'utf8');
  const { data: origFrontmatter, body: rawBody } = isReadme
    ? { data: {}, body: raw }
    : parseOriginalFrontmatter(raw);

  const usedImages = new Map(); // importName -> { basename, absSourcePath }
  const onImage = (srcPath) => {
    const basename = srcPath.split('/').pop();
    const importName = imageImportName(basename);
    if (!usedImages.has(importName)) {
      const absSource = path.resolve(path.dirname(absPath), srcPath);
      usedImages.set(importName, { basename, absSourcePath: absSource });
    }
    return importName;
  };

  let body = rawBody;
  body = escapeBraces(body);
  body = escapeKnownStrayGreaterThan(body);
  body = convertFigureBlocks(body, { onImage });
  body = convertPlainImages(body, { onImage });
  body = fixSupFootnotes(body, moduleDir);
  body = rewriteMarkdownLinks(body, moduleDir);

  const { main, translatorNote } = splitTranslatorNote(body);
  const { title, summary } = deriveTitleAndSummary(main);

  const finalBody = translatorNote ? `${main}<TranslatorNote>\n${translatorNote}\n</TranslatorNote>\n` : main;

  return { title, summary, finalBody, usedImages, origFrontmatter };
}

// readingMinutes is intentionally not part of the written frontmatter — it's
// derived at query time from the lesson body (src/lib/content-queries.ts),
// so a value frozen here at migration time would just go stale the moment
// the body changes.
function buildFrontmatter({ moduleId, order, title, summary, origFrontmatter, snapshotRel, isReadme }) {
  if (isReadme) {
    return {
      domain: 'kien-truc',
      module: moduleId,
      order,
      title,
      summary,
      source: {
        name: 'Tài liệu học System Design (tiếng Việt) — README',
        author: 'OmniLab (biên tập từ bản dịch cá nhân; xem từng bài để biết tác giả bản dịch gốc)',
        url: PRIMER_GITHUB_ROOT,
        license: LICENSE,
        snapshot: snapshotRel,
      },
      examplesReviewed: false,
    };
  }
  return {
    domain: 'kien-truc',
    module: moduleId,
    order,
    title,
    summary,
    source: {
      name: origFrontmatter.nguon ?? '(không rõ)',
      author: origFrontmatter['tac-gia'] ?? '(không rõ)',
      url: resolveSourceUrl(origFrontmatter['link-goc']),
      license: LICENSE,
      translatedAt: origFrontmatter['ngay-dich'],
      snapshot: snapshotRel,
    },
    examplesReviewed: false,
  };
}

function writeLessonFile({ frontmatterData, finalBody, usedImages, outFilePath }) {
  ensureDir(path.dirname(outFilePath));
  const importLines = [...usedImages.entries()].map(([importName, { basename }]) => {
    const assetAbsPath = path.join(ASSETS_OUT_DIR, basename);
    let rel = path.relative(path.dirname(outFilePath), assetAbsPath).split(path.sep).join('/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return `import ${importName} from '${rel}';`;
  });

  const sections = [stringifyLessonFrontmatter(frontmatterData)];
  if (importLines.length > 0) sections.push(importLines.join('\n'));
  sections.push(finalBody.trimEnd());

  writeFileSync(outFilePath, `${sections.join('\n\n')}\n`, 'utf8');
}

function main() {
  ensureDir(SNAPSHOT_DIR);
  ensureDir(LESSONS_OUT_DIR);
  ensureDir(ASSETS_OUT_DIR);

  const snapshotCount = copySnapshot();

  const globalImages = new Map(); // basename -> absSourcePath
  let lessonCount = 0;

  // README.md (translator index: conventions + progress table) is kept in the
  // snapshot for attribution but is not a lesson; /gioi-thieu covers it.

  // 27 translated .md files.
  for (const moduleDir of Object.keys(MODULE_DIR_TO_ID)) {
    const moduleId = MODULE_DIR_TO_ID[moduleDir];
    const dirAbsPath = path.join(SOURCE_DIR, moduleDir);
    const files = readdirSync(dirAbsPath)
      .filter((f) => f.endsWith('.md'))
      .sort();
    for (const filename of files) {
      const absPath = path.join(dirAbsPath, filename);
      const match = filename.match(/^(\d+)-(.+)\.md$/);
      if (!match) throw new Error(`Unexpected filename (no numeric prefix): ${filename}`);
      const [, numPrefix, slug] = match;
      const order = Number(numPrefix);

      let result;
      try {
        result = transformFile({ absPath, moduleDir, isReadme: false });
      } catch (err) {
        console.error(`Failed processing ${absPath}`);
        throw err;
      }
      for (const [, { basename, absSourcePath }] of result.usedImages) globalImages.set(basename, absSourcePath);

      const snapshotRel = `system-design/${moduleDir}/${filename}`;
      const frontmatterData = buildFrontmatter({
        moduleId,
        order,
        title: result.title,
        summary: result.summary,
        origFrontmatter: result.origFrontmatter,
        snapshotRel,
        isReadme: false,
      });
      const outFilePath = path.join(LESSONS_OUT_DIR, moduleId, `${numPrefix}-${slug}.mdx`);
      writeLessonFile({
        frontmatterData,
        finalBody: result.finalBody,
        usedImages: result.usedImages,
        outFilePath,
      });
      lessonCount += 1;
    }
  }

  // Copy every referenced image exactly once.
  for (const [basename, absSourcePath] of globalImages) {
    copyFileSync(absSourcePath, path.join(ASSETS_OUT_DIR, basename));
  }

  console.log(
    `migrate-system-design: snapshot ${snapshotCount} .md file(s), wrote ${lessonCount} lesson(s), copied ${globalImages.size} image(s).`,
  );
}

main();
