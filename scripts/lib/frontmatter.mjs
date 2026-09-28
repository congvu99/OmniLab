// Minimal, purpose-built YAML frontmatter reader/writer for lesson MDX
// files. NOT a general YAML parser — no `js-yaml` in the allowed dependency
// list for this phase, and we fully control both the writer (migration
// scripts) and the reader (verify-fidelity, tests), so a small hand-rolled
// codec for exactly the lesson frontmatter shape is simpler and safer than
// pulling in a general parser for a format we never need to round-trip
// through arbitrary YAML.

/** Splits `---\n<yaml>\n---\n<body>` into { data, body }. */
export function splitFrontmatter(source) {
  if (!source.startsWith('---')) {
    throw new Error('Missing frontmatter: file must start with "---"');
  }
  const end = source.indexOf('\n---', 3);
  if (end === -1) {
    throw new Error('Missing closing "---" for frontmatter');
  }
  const yamlBlock = source.slice(source.indexOf('\n', 0) + 1, end);
  const afterCloser = source.indexOf('\n', end + 1);
  const body = afterCloser === -1 ? '' : source.slice(afterCloser + 1);
  return { yaml: yamlBlock, body };
}

/**
 * Body text after frontmatter, without parsing the YAML. Lenient: source
 * snapshots are not all guaranteed to have frontmatter (e.g. the original
 * README.md has none) — such files are returned unchanged.
 */
export function stripFrontmatter(source) {
  if (!source.startsWith('---')) return source;
  return splitFrontmatter(source).body;
}

function escapeYamlDouble(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

/** Always double-quotes string scalars — simple and unambiguous to parse back. */
function yamlScalar(value) {
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return `"${escapeYamlDouble(value)}"`;
}

/**
 * Serializes the fixed lesson frontmatter shape (src/content.config.ts) to a
 * `---`-delimited YAML block. `source` is a nested object rendered as an
 * indented mapping (2 spaces), matching what Astro's YAML parser expects.
 */
export function stringifyLessonFrontmatter(data) {
  const lines = ['---'];
  lines.push(`domain: ${yamlScalar(data.domain)}`);
  lines.push(`module: ${yamlScalar(data.module)}`);
  lines.push(`order: ${yamlScalar(data.order)}`);
  lines.push(`title: ${yamlScalar(data.title)}`);
  lines.push(`summary: ${yamlScalar(data.summary)}`);
  lines.push('source:');
  lines.push(`  name: ${yamlScalar(data.source.name)}`);
  lines.push(`  author: ${yamlScalar(data.source.author)}`);
  if (data.source.url) lines.push(`  url: ${yamlScalar(data.source.url)}`);
  lines.push(`  license: ${yamlScalar(data.source.license)}`);
  if (data.source.translatedAt) lines.push(`  translatedAt: ${yamlScalar(data.source.translatedAt)}`);
  lines.push(`  snapshot: ${yamlScalar(data.source.snapshot)}`);
  lines.push(`examplesReviewed: ${yamlScalar(data.examplesReviewed ?? false)}`);
  if (typeof data.readingMinutes === 'number') {
    lines.push(`readingMinutes: ${yamlScalar(data.readingMinutes)}`);
  }
  lines.push('---');
  return lines.join('\n');
}

/**
 * Parses back exactly what `stringifyLessonFrontmatter` writes. Only used by
 * verify-fidelity.mjs / tests to read `source.snapshot` etc. — not a general
 * YAML reader.
 */
export function parseLessonFrontmatter(source) {
  const { yaml } = splitFrontmatter(source);
  const lines = yaml.split('\n');
  const data = { source: {} };
  let inSource = false;
  for (const rawLine of lines) {
    if (rawLine.trim() === '') continue;
    const indented = /^\s{2}/.test(rawLine);
    const line = rawLine.trim();
    const match = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (key === 'source' && rawValue === '') {
      inSource = true;
      continue;
    }
    const value = parseScalar(rawValue);
    if (indented && inSource) {
      data.source[key] = value;
    } else {
      inSource = false;
      data[key] = value;
    }
  }
  return data;
}

function parseScalar(raw) {
  if (raw.startsWith('"') && raw.endsWith('"')) {
    return raw
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}
