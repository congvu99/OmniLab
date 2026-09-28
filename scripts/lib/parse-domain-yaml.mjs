// Minimal, purpose-built YAML reader for src/content/domains/*.yaml (see
// src/content.config.ts for the schema this mirrors: flat scalar fields +
// one `modules:` block sequence of small `{ id, title, order }` objects).
// NOT a general YAML parser — same rationale as scripts/lib/frontmatter.mjs:
// no YAML parser in the allowed dependency list (the `yaml` package is only
// a transitive dependency, not resolvable from our own code under pnpm's
// strict node_modules), and we fully control the shape we need to read.
//
// This is the single place that reads domain metadata for code that runs
// OUTSIDE Astro's content-collection loader (plain Node scripts, vitest
// tests) — see scripts/verify-fidelity.mjs and tests/lesson-content.test.mjs,
// both of which used to hardcode domain ids/modules directly, so adding a
// domain meant also updating those hardcoded copies. Code that already runs
// inside Astro's build pipeline should keep using `getCollection('domains')`
// instead of this.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

function stripComment(line) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i);
    }
  }
  return line;
}

function parseScalar(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

/** Parses one domain YAML file's source into `{ id, title, ..., modules: [{id,title,order}] }`. */
export function parseDomainYaml(source) {
  const data = { modules: [] };
  let inModules = false;
  let currentModule = null;

  for (const rawLine of source.split('\n')) {
    if (!rawLine.trim() || /^\s*#/.test(rawLine)) continue;
    const line = stripComment(rawLine);
    if (!line.trim()) continue;
    const indent = line.match(/^(\s*)/)[1].length;

    if (indent === 0) {
      const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
      if (!m) continue;
      const [, key, rawValue] = m;
      if (key === 'modules') {
        inModules = true;
        currentModule = null;
        continue;
      }
      inModules = false;
      data[key] = parseScalar(rawValue);
      continue;
    }

    if (!inModules) continue;

    const itemStart = line.match(/^\s*-\s+(.*)$/);
    if (itemStart) {
      currentModule = {};
      data.modules.push(currentModule);
      const kv = itemStart[1].match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
      if (kv) currentModule[kv[1]] = parseScalar(kv[2]);
      continue;
    }

    const kv = line.trim().match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (kv && currentModule) currentModule[kv[1]] = parseScalar(kv[2]);
  }

  return data;
}

/** Reads + parses every `*.yaml` file in `domainsDir` (src/content/domains). Throws if a file has no `id`. */
export function loadDomains(domainsDir) {
  const files = readdirSync(domainsDir).filter((f) => f.endsWith('.yaml'));
  return files.map((file) => {
    const source = readFileSync(path.join(domainsDir, file), 'utf8');
    const data = parseDomainYaml(source);
    if (!data.id) throw new Error(`${file}: missing required "id" field`);
    return data;
  });
}
