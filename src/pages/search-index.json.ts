// Static JSON search corpus for src/lib/search-index.ts (MiniSearch), built
// once at deploy time and fetched lazily only by the /tim-kiem page (not
// embedded in every page — see phase-05 spec). Chosen over Pagefind after a
// spike showed Pagefind's own Vietnamese folding missed the target lesson
// for a fully-unaccented query ("bo nho dem") in the top 3 — see phase-05
// report for the numbers.
import { render } from 'astro:content';
import type { APIRoute } from 'astro';
import { getAllLessonsOrdered, getDomains } from '../lib/content-queries';
import { mdxToPlainText } from '../lib/search-mdx-to-text';
import type { SearchDoc } from '../lib/search-index';

export const GET: APIRoute = async () => {
  const [lessons, domains] = await Promise.all([getAllLessonsOrdered(), getDomains()]);
  const domainTitleOf = new Map(domains.map((d) => [d.data.id, d.data.title]));

  const payload: SearchDoc[] = await Promise.all(
    lessons.map(async (lesson) => {
      const { headings } = await render(lesson.entry);
      const headingText = headings
        .filter((h) => h.depth <= 3)
        .map((h) => h.text)
        .join(' ');
      return {
        id: lesson.id,
        title: lesson.title,
        url: lesson.url,
        domain: lesson.domainId,
        domainTitle: domainTitleOf.get(lesson.domainId) ?? lesson.domainId,
        summary: lesson.entry.data.summary,
        headings: headingText,
        text: mdxToPlainText(lesson.entry.body ?? ''),
      };
    }),
  );

  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
};
