/**
 * Pure helpers behind the lesson reader header and aside (no DOM / astro
 * imports, unit-tested in tests/lesson-reader-model.test.mjs).
 */

export interface ReaderHeading {
  depth: number;
  slug: string;
  text: string;
}

const normalize = (s: string): string => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * The lesson body often opens with a heading that repeats the frontmatter
 * title ("# Title" in architecture lessons, "## Title" in finance lessons).
 * The reader header already renders the title as the page <h1>, so that
 * duplicate is hidden. Only the FIRST heading qualifies — a later heading that
 * merely reuses the title text is real content.
 */
export function findTitleDuplicate(headings: readonly ReaderHeading[], title: string): ReaderHeading | null {
  const first = headings[0];
  return first && normalize(first.text) === normalize(title) ? first : null;
}

/**
 * The header <h1> is followed by the body headings. If the first visible body
 * heading is deeper than h2 the outline would skip a level (axe
 * heading-order), so the layout's sr-only filler <h2> must stay in the tree.
 */
export function needsHeadingFiller(visible: readonly ReaderHeading[]): boolean {
  return visible.length > 0 && visible[0].depth > 2;
}

/**
 * Frontmatter `summary` is metadata of mixed quality: some are real
 * sentences, some are scraped fragments ("05 / Bối cảnh Việt Nam", numbered
 * list stubs, bold markdown). Returns display text, or null when it would
 * read as noise under the title.
 */
export function cleanSummary(raw: string | undefined): string | null {
  if (!raw) return null;
  const text = raw
    .replace(/\*\*|__|`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length < 40) return null;
  if (/^\d+\s*[/.)]\s/.test(text)) return null;
  return text;
}

/** Minutes still to read at `percent` progress (min 1 until the end). */
export function minutesLeft(totalMinutes: number, percent: number): number {
  const p = Math.min(100, Math.max(0, percent));
  return Math.max(1, Math.round(totalMinutes * (1 - p / 100)));
}

/** Aside progress caption: "còn 3 phút · 42%" / "đã tới cuối bài". */
export function readingLeftLabel(totalMinutes: number, percent: number): string {
  if (percent >= 98) return 'đã tới cuối bài';
  return `còn ${minutesLeft(totalMinutes, percent)} phút · ${percent}%`;
}

/** SVG stroke-dashoffset for a progress ring of circumference `circumference`. */
export function ringDashOffset(circumference: number, percent: number): number {
  const p = Math.min(100, Math.max(0, percent));
  return circumference * (1 - p / 100);
}

/** "07" style zero-padded lesson position. */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** "The System Design Primer - mục "Cache"" -> "The System Design Primer". */
export function shortSourceLabel(name: string): string {
  const head = name.split(/\s+[-–—]\s+/)[0]?.trim();
  return head || name;
}

/** "CC BY 4.0 (nguyên bản: ...)" -> "CC BY 4.0"; "X — ghi chú" -> "X". */
export function shortLicenseLabel(license: string): string {
  const head = license.replace(/\s*[(\[].*$/s, '').replace(/\s+[–—]\s+.*$/s, '').trim();
  return head || license;
}
