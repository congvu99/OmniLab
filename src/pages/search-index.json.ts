// Static JSON search corpus for src/lib/search-index.ts (MiniSearch), built
// once at deploy time and fetched lazily only by the /tim-kiem page (not
// embedded in every page). Chosen over Pagefind: a spike showed Pagefind's
// own Vietnamese folding missed the target lesson for a fully-unaccented
// query ("bo nho dem") in the top 15 — see docs/system-architecture.md
// "Tìm kiếm" for the numbers.
import { render } from 'astro:content';
import type { APIRoute } from 'astro';
import { getAllLessonsOrdered, getDomains } from '../lib/content-queries';
import { mdxToPlainText } from '../lib/search-mdx-to-text';
import type { SearchDoc } from '../lib/search-index';

export const GET: APIRoute = async () => {
  const [lessons, domains] = await Promise.all([getAllLessonsOrdered(), getDomains()]);
  const domainTitleOf = new Map(domains.map((d) => [d.data.id, d.data.title]));
  // Per-domain accent colors, so the result row's color comes from the
  // domain's own metadata (same source as domain-card.astro) instead of a
  // hardcoded per-domain-id color map in the search UI.
  const domainAccentOf = new Map(domains.map((d) => [d.data.id, { accent: d.data.accent, accentDark: d.data.accentDark }]));

  const payload: SearchDoc[] = await Promise.all(
    lessons.map(async (lesson) => {
      const { headings } = await render(lesson.entry);
      const headingText = headings
        .filter((h) => h.depth <= 3)
        .map((h) => h.text)
        .join(' ');
      const accent = domainAccentOf.get(lesson.domainId);
      return {
        id: lesson.id,
        title: lesson.title,
        url: lesson.url,
        domain: lesson.domainId,
        domainTitle: domainTitleOf.get(lesson.domainId) ?? lesson.domainId,
        // NFC up front: search-highlight.ts slices this text by an offset
        // computed against its NFC-folded form, so decomposed input here
        // would shift every <mark> boundary.
        summary: lesson.entry.data.summary.normalize('NFC'),
        headings: headingText,
        text: mdxToPlainText(lesson.entry.body ?? ''),
        domainAccent: accent?.accent,
        domainAccentDark: accent?.accentDark,
      };
    }),
  );

  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
};
