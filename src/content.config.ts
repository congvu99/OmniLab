// Content collection schemas (Astro Content Layer API). Domain-agnostic by
// design: adding a new domain only needs a new `src/content/domains/<id>.yaml`
// + a `src/content/lessons/<id>/` folder — no changes here.
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const moduleSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number(),
});

const domains = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/domains' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    tagline: z.string(),
    accent: z.string(),
    accentDark: z.string(),
    // Lucide icon name (see @lucide/astro), e.g. "network" / "wallet".
    icon: z.string(),
    order: z.number(),
    // Drives <Disclaimer> rendering in the lesson layout (Phase 4).
    isFinance: z.boolean().optional(),
    modules: z.array(moduleSchema),
  }),
});

const lessons = defineCollection({
  // Lesson ID contract: `${domain}/${module}/${slug}` where slug = filename
  // without numeric prefix/extension. See src/lib/lesson-id.ts.
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: ({ image }) =>
    z.object({
      domain: reference('domains'),
      // Must match one of `domain.modules[].id` — validated in
      // tests/lesson-content.test.mjs (schema itself cannot cross-reference
      // another collection's data at parse time).
      module: z.string(),
      // Ordering within the module; numeric filename prefix mirrors this.
      order: z.number(),
      title: z.string(),
      // 1-2 sentences, <=200 chars. Metadata only — not rendered from body.
      summary: z.string().max(200),
      cover: image().optional(),
      source: z.object({
        name: z.string(),
        author: z.string(),
        url: z.url().optional(),
        license: z.string(),
        translatedAt: z.string().optional(),
        // Path relative to content-sources/, e.g.
        // "system-design/02-chu-de/07-cache.md".
        snapshot: z.string(),
      }),
      examplesReviewed: z.boolean().default(false),
      // Populated at build time by the remark-reading-time plugin
      // (astro.config.mjs markdown/mdx remarkPlugins) — not authored.
      readingMinutes: z.number().optional(),
    }),
});

export const collections = { domains, lessons };
