// Static JSON endpoint: every lesson's id/title/url/domain/readingMinutes.
// Islands that need lesson titles without a full page's worth of content
// (continue-reading-card, saved-list) fetch this once instead of it being
// inlined into every page — see phase-05 spec "Architecture".
import type { APIRoute } from 'astro';
import { getAllLessonsOrdered, getDomains } from '../lib/content-queries';

export interface LessonIndexEntry {
  id: string;
  title: string;
  url: string;
  domain: string;
  domainTitle: string;
  module: string;
  readingMinutes: number;
}

export const GET: APIRoute = async () => {
  const [lessons, domains] = await Promise.all([getAllLessonsOrdered(), getDomains()]);
  const domainTitleOf = new Map(domains.map((d) => [d.data.id, d.data.title]));

  const payload: LessonIndexEntry[] = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    url: lesson.url,
    domain: lesson.domainId,
    domainTitle: domainTitleOf.get(lesson.domainId) ?? lesson.domainId,
    module: lesson.moduleId,
    readingMinutes: lesson.readingMinutes,
  }));

  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
};
