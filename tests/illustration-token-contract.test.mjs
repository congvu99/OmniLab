// Inline lesson illustrations (src/assets/illustrations/**/*.svg, rendered via
// <Figure svg>) color themselves with var(--token) presentation attributes that
// resolve against the page's live CSS. Every token they reference must stay
// defined in src/styles/tokens.css, or diagrams silently lose their colors
// (e.g. dropping --ink/--ink-2 as "legacy aliases" would blank every label).
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TOKENS = readFileSync(path.join(ROOT, 'src', 'styles', 'tokens.css'), 'utf8');
const ILLUSTRATIONS = path.join(ROOT, 'src', 'assets', 'illustrations');

function svgFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return svgFiles(full);
    return entry.name.endsWith('.svg') ? [full] : [];
  });
}

const used = new Set();
for (const file of svgFiles(ILLUSTRATIONS)) {
  for (const m of readFileSync(file, 'utf8').matchAll(/var\(\s*(--[\w-]+)/g)) used.add(m[1]);
}

describe('illustration token contract', () => {
  it('finds illustration tokens to check', () => {
    expect(used.size).toBeGreaterThan(0);
  });

  for (const token of used) {
    it(`${token} is defined in tokens.css`, () => {
      expect(TOKENS).toMatch(new RegExp(`${token}\\s*:`));
    });
  }
});
