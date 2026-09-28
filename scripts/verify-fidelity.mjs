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
  findForbiddenMdxConstructs,
  normalizeText,
  textFromHtmlDocument,
  textFromLessonMdx,
  textFromMarkdownSource,
} from './lib/fidelity.mjs';
import { parseLessonFrontmatter } from './lib/frontmatter.mjs';
import { loadDomains } from './lib/parse-domain-yaml.mjs';
import { checkSnapshotCoverage } from './lib/snapshot-coverage.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LESSONS_DIR = path.join(ROOT, 'src', 'content', 'lessons');
const DOMAINS_DIR = path.join(ROOT, 'src', 'content', 'domains');
const CONTENT_SOURCES_DIR = path.join(ROOT, 'content-sources');
const FINANCE_HTML_PATH = path.join(CONTENT_SOURCES_DIR, 'finance', 'index.html');
// content-sources/system-design/ mirrors the kien-truc lesson tree 1:1 by
// design (see scripts/migrate-system-design.mjs); every other known domain
// uses the same per-lesson-snapshot strategy but isn't assumed to live
// under this specific folder, so snapshot-COVERAGE (are all snapshots used,
// is every reference real) is only enforced for this one, concrete folder.
const SYSTEM_DESIGN_SOURCE_SUBDIR = 'system-design';

function walkFiles(dir, predicate) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkFiles(full, predicate));
    } else if (predicate(entry)) {
      results.push(full);
    }
  }
  return results;
}

function walkMdxFiles(dir) {
  return walkFiles(dir, (name) => name.endsWith('.mdx'));
}

/** Domain id from the lesson's OWN FILE PATH (`lessons/<domain>/...`) — authoritative, unlike frontmatter which can be malformed/misread. */
function domainIdFromPath(filePath) {
  return path.relative(LESSONS_DIR, filePath).split(path.sep)[0];
}

function loadLesson(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const frontmatter = parseLessonFrontmatter(source);
  const pathDomain = domainIdFromPath(filePath);
  return { filePath, source, frontmatter, pathDomain };
}

function fail(label, comparison) {
  console.error(`\nFIDELITY MISMATCH: ${label}`);
  console.error(`  ...${comparison.contextA}...`);
  console.error('  vs (source):');
  console.error(`  ...${comparison.contextB}...`);
}

/** Every lesson, regardless of domain: no MDX construct that could inject text invisible to this checker. */
function verifyNoForbiddenConstructs(lesson) {
  const violations = findForbiddenMdxConstructs(lesson.source);
  if (violations.length === 0) return true;
  console.error(`\nFIDELITY VIOLATION: ${path.relative(ROOT, lesson.filePath)}`);
  for (const v of violations) console.error(`  ${v}`);
  return false;
}

/** Generic strategy: one lesson <-> one markdown snapshot file, compared 1:1. Used by every domain except an `isFinance` one. */
function verifyLessonAgainstMarkdownSnapshot(lesson) {
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

/** Finance strategy: every lesson in the domain concatenated (in module/order sequence) <-> one big HTML source document. */
function verifyFinanceDomain(domainId, financeLessons, moduleOrder) {
  if (financeLessons.length === 0) return true;
  const byModuleThenOrder = [...financeLessons].sort((a, b) => {
    const moduleDiff = (moduleOrder.get(a.frontmatter.module) ?? 0) - (moduleOrder.get(b.frontmatter.module) ?? 0);
    if (moduleDiff !== 0) return moduleDiff;
    return a.frontmatter.order - b.frontmatter.order;
  });
  const concatenated = byModuleThenOrder.map((lesson) => textFromLessonMdx(lesson.source)).join(' ');
  const lessonsText = normalizeText(concatenated);

  const html = readFileSync(FINANCE_HTML_PATH, 'utf8');
  // Content = <div class="hero"> + all <section> inside <main>.
  // nav/masthead/footer are navigation chrome, not original content, and
  // are intentionally excluded here by only feeding the hero+main HTML
  // fragment to the extractor.
  const heroMatch = html.match(/<div class="hero">[\s\S]*?<\/div>\s*<\/header>/);
  const mainMatch = html.match(/<main>([\s\S]*)<\/main>/);
  if (!heroMatch || !mainMatch) {
    throw new Error('Could not locate hero/main sections in content-sources/finance/index.html');
  }
  const bodyHtml = `${heroMatch[0]}${mainMatch[1]}`;
  const sourceText = normalizeText(textFromHtmlDocument(bodyHtml));

  const comparison = compareNormalized(sourceText, lessonsText);
  if (!comparison.ok) {
    fail(`${domainId} (all lessons concatenated) vs content-sources/finance/index.html`, {
      contextA: comparison.contextB,
      contextB: comparison.contextA,
    });
    return false;
  }
  return true;
}

function verifySnapshotCoverage(lessons) {
  const snapshotDir = path.join(CONTENT_SOURCES_DIR, SYSTEM_DESIGN_SOURCE_SUBDIR);
  const onDisk = walkFiles(snapshotDir, (name) => name.endsWith('.md') && name !== 'README.md').map((f) =>
    path.join(SYSTEM_DESIGN_SOURCE_SUBDIR, path.relative(snapshotDir, f)).split(path.sep).join('/'),
  );
  const referenced = lessons
    .filter((l) => l.frontmatter.source?.snapshot?.startsWith(`${SYSTEM_DESIGN_SOURCE_SUBDIR}/`))
    .map((l) => ({ snapshot: l.frontmatter.source.snapshot, source: path.relative(ROOT, l.filePath) }));

  const errors = checkSnapshotCoverage(onDisk, referenced);
  if (errors.length === 0) return true;
  console.error(`\nFIDELITY VIOLATION: snapshot <-> lesson coverage mismatch under content-sources/${SYSTEM_DESIGN_SOURCE_SUBDIR}/`);
  for (const e of errors) console.error(`  ${e}`);
  return false;
}

function main() {
  const files = walkMdxFiles(LESSONS_DIR);
  if (files.length === 0) {
    console.error(`No lesson MDX files found under ${LESSONS_DIR}`);
    process.exit(1);
  }

  const domains = loadDomains(DOMAINS_DIR);
  const domainIds = new Set(domains.map((d) => d.id));
  const financeDomainIds = new Set(domains.filter((d) => d.isFinance).map((d) => d.id));
  const moduleOrderByDomain = new Map(
    domains.map((d) => [d.id, new Map(d.modules.map((m) => [m.id, m.order]))]),
  );

  const lessons = files.map(loadLesson);

  let ok = true;

  // Fail loudly on any domain not declared in src/content/domains/*.yaml —
  // this is the ONE allowlist: declaring a domain there is how a lesson
  // opts into being checked at all, so a typo'd/unregistered domain can no
  // longer silently skip verification.
  for (const lesson of lessons) {
    if (!domainIds.has(lesson.pathDomain)) {
      console.error(
        `\nFIDELITY VIOLATION: ${path.relative(ROOT, lesson.filePath)} is under an unknown domain "${lesson.pathDomain}" ` +
          `(no matching src/content/domains/${lesson.pathDomain}.yaml). Add the domain YAML file, or move/rename this lesson.`,
      );
      ok = false;
    } else if (lesson.frontmatter.domain !== lesson.pathDomain) {
      console.error(
        `\nFIDELITY VIOLATION: ${path.relative(ROOT, lesson.filePath)} frontmatter "domain: ${lesson.frontmatter.domain}" ` +
          `does not match its folder ("${lesson.pathDomain}").`,
      );
      ok = false;
    }
  }
  if (!ok) {
    console.error(`\nverify-fidelity: FAILED (${lessons.length} lesson files checked)`);
    process.exit(1);
  }

  // Domain-agnostic guard: no lesson may inject text through an MDX
  // construct the text extractors treat as zero-width.
  for (const lesson of lessons) {
    ok = verifyNoForbiddenConstructs(lesson) && ok;
  }

  const byDomain = new Map();
  for (const lesson of lessons) {
    const list = byDomain.get(lesson.pathDomain) ?? [];
    list.push(lesson);
    byDomain.set(lesson.pathDomain, list);
  }

  for (const [domainId, domainLessons] of byDomain) {
    if (financeDomainIds.has(domainId)) {
      ok = verifyFinanceDomain(domainId, domainLessons, moduleOrderByDomain.get(domainId) ?? new Map()) && ok;
    } else {
      for (const lesson of domainLessons) ok = verifyLessonAgainstMarkdownSnapshot(lesson) && ok;
    }
  }

  ok = verifySnapshotCoverage(lessons.filter((l) => l.pathDomain === 'kien-truc')) && ok;

  if (!ok) {
    console.error(`\nverify-fidelity: FAILED (${lessons.length} lesson files checked)`);
    process.exit(1);
  }

  const perDomainCounts = [...byDomain.entries()].map(([id, list]) => `${list.length} ${id}`).join(' + ');
  console.log(`verify-fidelity: OK — ${perDomainCounts} lesson(s) match their source snapshots.`);
}

main();
