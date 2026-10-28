// The Caddyfile allowlist for /audio/* copies AUDIO_FILE_PATTERN (src/lib/audio-manifest.ts).
// If the two drift apart, Caddy silently 404s real files (or serves names the worker never
// writes). This test reads the regex out of the Caddyfile and checks both agree on real
// `audioFileName` outputs and on bad names.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AUDIO_FILE_PATTERN, audioFileName } from '../src/lib/audio-manifest.ts';

const caddyfile = readFileSync(new URL('../Caddyfile', import.meta.url), 'utf8');
const match = /@audioFile path_regexp (\S+)/.exec(caddyfile);
const caddyPath = new RegExp(match?.[1] ?? '^$');
const servedByCaddy = (name) => caddyPath.test(`/audio/${name}`);

const KEY = 'a1b2c3d4e5f6'.padEnd(64, '0');
const realNames = [
  audioFileName('quy-va-dau-tu/co-ban/quy-mo-la-gi', KEY),
  audioFileName('system-design/caching/cache-aside', 'f'.repeat(64)),
  audioFileName('a/b/c-1', '0123456789ab'.padEnd(64, 'c')),
];
const badNames = [
  'd.m.a.a1b2c3d4e5f.m4a', // 11 hex
  'd.m.a.A1B2C3D4E5F6.m4a', // uppercase hex
  'D.m.a.a1b2c3d4e5f6.m4a',
  'd.m.a.a1b2c3d4e5f6.m4a.tmp',
  'd.m.a.b.a1b2c3d4e5f6.m4a', // four id segments
  'd.m.a1b2c3d4e5f6.m4a',
  '..%2Fd.m.a.a1b2c3d4e5f6.m4a',
  'sub/d.m.a.a1b2c3d4e5f6.m4a',
  'd.m.a.a1b2c3d4e5f6.mp3',
];

describe('Caddyfile /audio allowlist', () => {
  it('has the @audioFile matcher', () => {
    expect(match).not.toBeNull();
  });

  it('is exactly manifest.json or AUDIO_FILE_PATTERN', () => {
    const fileSource = AUDIO_FILE_PATTERN.source.replace(/^\^/, '').replace(/\$$/, '');
    expect(match[1]).toBe(`${String.raw`^/audio/(manifest\.json|`}${fileSource})$`);
  });

  it.each(realNames)('serves real worker output %s', (name) => {
    expect(AUDIO_FILE_PATTERN.test(name)).toBe(true);
    expect(servedByCaddy(name)).toBe(true);
  });

  it.each(badNames)('rejects %s on both sides', (name) => {
    expect(AUDIO_FILE_PATTERN.test(name)).toBe(false);
    expect(servedByCaddy(name)).toBe(false);
  });

  it('serves manifest.json and nothing else outside the pattern', () => {
    expect(servedByCaddy('manifest.json')).toBe(true);
    expect(servedByCaddy('manifest.json.tmp')).toBe(false);
    expect(servedByCaddy('state.json')).toBe(false);
  });
});
