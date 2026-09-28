// Tests for scripts/lib/parse-domain-yaml.mjs — the tolerant reader used by
// verify-fidelity.mjs and tests/lesson-content.test.mjs to derive domain ids
// and their module lists without hardcoding them. Also runs against the
// real content files as a regression guard.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDomains, parseDomainYaml } from '../scripts/lib/parse-domain-yaml.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DOMAINS_DIR = path.join(ROOT, 'src', 'content', 'domains');

const SAMPLE = `# a leading comment
id: demo
title: "Demo lĩnh vực"
tagline: 'Chỉ để test'
accent: "#123456"
accentDark: "#abcdef"
icon: network
order: 3 # trailing comment
isFinance: false
modules:
  - id: mod-a
    title: "Module A"
    order: 1
  - id: mod-b
    title: 'Module B'
    order: 2
`;

describe('parseDomainYaml', () => {
  it('parses flat scalar fields (quoted, single-quoted, unquoted, with comments)', () => {
    const data = parseDomainYaml(SAMPLE);
    expect(data.id).toBe('demo');
    expect(data.title).toBe('Demo lĩnh vực');
    expect(data.tagline).toBe('Chỉ để test');
    expect(data.icon).toBe('network');
    expect(data.order).toBe(3);
    expect(data.isFinance).toBe(false);
  });

  it('parses the modules block sequence in order', () => {
    const data = parseDomainYaml(SAMPLE);
    expect(data.modules).toEqual([
      { id: 'mod-a', title: 'Module A', order: 1 },
      { id: 'mod-b', title: 'Module B', order: 2 },
    ]);
  });
});

describe('loadDomains against the real content', () => {
  const domains = loadDomains(DOMAINS_DIR);

  it('finds both shipped domains with their ids and modules', () => {
    const byId = new Map(domains.map((d) => [d.id, d]));
    expect(byId.has('kien-truc')).toBe(true);
    expect(byId.has('tai-chinh')).toBe(true);
    expect(byId.get('kien-truc').modules.map((m) => m.id)).toEqual(['nen-tang', 'danh-doi', 'chu-de', 'bai-tap']);
    expect(byId.get('tai-chinh').isFinance).toBe(true);
    expect(byId.get('kien-truc').isFinance).toBeUndefined();
  });

  it('matches parseDomainYaml applied directly to each real file (no drift between the two paths)', () => {
    for (const file of ['kien-truc.yaml', 'tai-chinh.yaml']) {
      const source = readFileSync(path.join(DOMAINS_DIR, file), 'utf8');
      const direct = parseDomainYaml(source);
      const viaLoader = domains.find((d) => d.id === direct.id);
      expect(viaLoader).toEqual(direct);
    }
  });
});
