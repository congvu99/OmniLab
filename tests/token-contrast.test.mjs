// WCAG contrast guard for the design tokens (src/styles/tokens.css) and every
// domain accent (src/content/domains/*.yaml), in BOTH themes. Accents are used
// as text on --bg, --surface and --surface-2 (links, TOC, sidebar active item),
// so all three backgrounds are checked, not just one.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TOKENS = readFileSync(path.join(ROOT, 'src', 'styles', 'tokens.css'), 'utf8');
const DOMAINS_DIR = path.join(ROOT, 'src', 'content', 'domains');

/** Collects `--name: #hex;` declarations from a CSS block. */
function hexTokens(block) {
  const out = {};
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2];
  return out;
}

const darkStart = TOKENS.indexOf('@media (prefers-color-scheme: dark) {');
const light = hexTokens(TOKENS.slice(0, darkStart));
const dark = { ...light, ...hexTokens(TOKENS.slice(darkStart)) };

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const domains = readdirSync(DOMAINS_DIR)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => {
    const text = readFileSync(path.join(DOMAINS_DIR, f), 'utf8');
    const pick = (key) => text.match(new RegExp(`^${key}:\\s*"?(#[0-9a-fA-F]{6})"?`, 'm'))?.[1];
    return { file: f, accent: pick('accent'), accentDark: pick('accentDark') };
  });

const BACKGROUNDS = ['bg', 'surface', 'surface-2'];
const themes = [
  ['light', light, 'accent'],
  ['dark', dark, 'accentDark'],
];

describe('token contrast (WCAG AA)', () => {
  it('reads the domain accents it is meant to guard', () => {
    expect(domains.length).toBeGreaterThan(0);
    for (const d of domains) {
      expect(d.accent, d.file).toMatch(/^#/);
      expect(d.accentDark, d.file).toMatch(/^#/);
    }
  });

  for (const [theme, t, accentKey] of themes) {
    for (const bg of BACKGROUNDS) {
      for (const fg of ['ink', 'ink-2', 'danger', 'success']) {
        it(`${theme}: --${fg} on --${bg} >= 4.5`, () => {
          expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
        });
      }
      for (const d of domains) {
        it(`${theme}: ${d.file} accent on --${bg} >= 4.5`, () => {
          expect(contrast(d[accentKey], t[bg])).toBeGreaterThanOrEqual(4.5);
        });
      }
      it(`${theme}: --line-strong on --${bg} >= 3 (control boundary)`, () => {
        expect(contrast(t['line-strong'], t[bg])).toBeGreaterThanOrEqual(3);
      });
    }

    for (const d of domains) {
      it(`${theme}: --accent-on on ${d.file} accent fill >= 4.5`, () => {
        expect(contrast(t['accent-on'], d[accentKey])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
