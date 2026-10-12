// Icon name resolution: every domain YAML icon must resolve to a real glyph,
// unknown names fall back instead of throwing, aliases map to the concept set.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ICON_NAMES, resolveIcon } from '../src/components/icon/icon-names.ts';
import { ICON_PATHS } from '../src/components/icon/icon-paths.ts';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DOMAINS_DIR = path.join(ROOT, 'src', 'content', 'domains');

const CONCEPT_ICONS = [
  'resume', 'domains', 'search', 'bookmark', 'network', 'wallet', 'briefcase', 'check',
  'check-circle', 'clock', 'arrow-right', 'chevron-left', 'chevron-right', 'sun', 'moon',
  'bulb', 'info', 'command', 'toc', 'type', 'close', 'history', 'doc', 'spark', 'replay', 'omni',
];

describe('icon names', () => {
  it('ships every concept icon with drawable markup', () => {
    for (const name of CONCEPT_ICONS) {
      expect(ICON_NAMES, name).toContain(name);
      expect(ICON_PATHS[name].length, name).toBeGreaterThan(10);
    }
  });

  it('resolves every domain YAML icon to a concrete (non-fallback) glyph', () => {
    for (const f of readdirSync(DOMAINS_DIR).filter((x) => x.endsWith('.yaml'))) {
      const icon = readFileSync(path.join(DOMAINS_DIR, f), 'utf8').match(/^icon:\s*(\S+)/m)?.[1];
      expect(icon, f).toBeTruthy();
      expect(ICON_NAMES, `${f} -> ${icon}`).toContain(resolveIcon(icon).name);
      expect(resolveIcon(icon).name, f).not.toBe('domains');
    }
  });

  it('maps legacy names, rotates chevron-down, and falls back safely', () => {
    expect(resolveIcon('briefcase-business').name).toBe('briefcase');
    expect(resolveIcon('lightbulb').name).toBe('bulb');
    expect(resolveIcon('chevron-down')).toEqual({ name: 'chevron-right', rotate: 90 });
    expect(resolveIcon('does-not-exist').name).toBe('domains');
    expect(resolveIcon('constructor').name).toBe('domains');
    expect(resolveIcon(undefined).name).toBe('domains');
  });
});
