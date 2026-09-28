// Astro config: static output only, no server adapter, so Railpack serves
// the build with its Caddy static-file provider (see ./Caddyfile).
import { defineConfig, passthroughImageService } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';

// SITE_URL is read at build time so sitemap.xml/canonical URLs match the real
// deploy domain. Fallback keeps `pnpm build` reproducible before the user
// sets SITE_URL on Railpack/Vibe Deploy Nhan Hoa. Document in deployment-guide.md.
const site = process.env.SITE_URL ?? 'https://omnilab.example';

export default defineConfig({
  site,
  output: 'static',
  // remarkReadingTime is registered here per spec, but Astro 7's default
  // processor ("Sätteri", shipped by @astrojs/mdx 8.x) does NOT run
  // remark/rehype plugins at all — only the legacy `@astrojs/markdown-remark`
  // processor does (`markdown.processor: unified({...})`), and adding that
  // dependency is outside this phase's file ownership (astro warns
  // "remarkPlugins ... is ignored" at build time; harmless, non-fatal).
  // This registration is still correct and forward-compatible — it starts
  // working with zero code changes the day that package is added. Until
  // then, `frontmatter.readingMinutes` is populated at MIGRATION time via
  // the same plugin (scripts/lib/reading-time.mjs imports and runs it
  // directly). See phase-03 report for the full investigation.
  integrations: [mdx({ remarkPlugins: [remarkReadingTime] }), sitemap()],
  image: {
    // `sharp` (astro:assets' default image service) is a native binary and
    // not in this phase's allowed dependency list. The legacy PNG/JPG
    // figures are already reasonably sized (system-design-primer diagrams),
    // so skipping resize/format conversion and just fingerprinting +
    // copying them is an acceptable tradeoff for now — revisit if a later
    // phase adds `sharp`.
    service: passthroughImageService(),
  },
  build: {
    // Keep all CSS in external files (never inline <style> blocks) so the
    // Caddyfile CSP can stay `style-src 'self'` without 'unsafe-inline'.
    inlineStylesheets: 'never',
  },
});
