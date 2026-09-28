// Build-time-safety checks that are cheap to run as unit tests: every
// lesson's `module` must exist in its domain's YAML `modules[]` (the zod
// schema in src/content.config.ts cannot express a cross-collection
// constraint like this), and every lesson file must parse with our
// frontmatter codec.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseLessonFrontmatter } from '../scripts/lib/frontmatter.mjs';
import { loadDomains } from '../scripts/lib/parse-domain-yaml.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LESSONS_DIR = path.join(ROOT, 'src', 'content', 'lessons');
const DOMAINS_DIR = path.join(ROOT, 'src', 'content', 'domains');

// Derived from src/content/domains/*.yaml — so adding a new domain (just a
// new YAML file + lesson folder, per docs/system-architecture.md "Thêm
// domain") needs no change here (this used to be a hardcoded copy of the
// YAML that a new domain would fail against).
const DOMAIN_MODULES = Object.fromEntries(
  loadDomains(DOMAINS_DIR).map((d) => [d.id, d.modules.map((m) => m.id)]),
);

function walkMdxFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkMdxFiles(full));
    else if (entry.endsWith('.mdx')) out.push(full);
  }
  return out;
}

describe('lesson frontmatter integrity', () => {
  const files = walkMdxFiles(LESSONS_DIR);

  it('finds lesson files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [path.relative(LESSONS_DIR, f), f]))('%s: module exists in its domain', (_label, file) => {
    const data = parseLessonFrontmatter(readFileSync(file, 'utf8'));
    const validModules = DOMAIN_MODULES[data.domain];
    expect(validModules, `unknown domain "${data.domain}"`).toBeDefined();
    expect(validModules).toContain(data.module);
  });

  it.each(files.map((f) => [path.relative(LESSONS_DIR, f), f]))('%s: has required frontmatter fields', (_label, file) => {
    const data = parseLessonFrontmatter(readFileSync(file, 'utf8'));
    expect(typeof data.order).toBe('number');
    expect(typeof data.title).toBe('string');
    expect(data.title.length).toBeGreaterThan(0);
    expect(typeof data.summary).toBe('string');
    expect(data.summary.length).toBeGreaterThan(0);
    expect(data.summary.length).toBeLessThanOrEqual(200);
    expect(data.source?.snapshot).toBeTruthy();
    expect(data.source?.license).toBeTruthy();
  });
});
