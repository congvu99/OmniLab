// Astro config: static output only, no server adapter, so Railpack serves
// the build with its Caddy static-file provider (see ./Caddyfile).
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import rehypeWrapTables from './src/lib/rehype-wrap-tables.mjs';

// SITE_URL is read at build time so sitemap.xml's URLs match the real
// deploy domain (no <link rel="canonical"> is emitted in v1 — sitemap.xml
// is the only place `site` is consumed, via @astrojs/sitemap below).
// Fallback keeps `pnpm build` reproducible before the user sets SITE_URL on
// Vibe Deploy — documented in docs/deployment-guide.md — but a real deploy
// running with the placeholder would ship a sitemap full of
// https://omnilab.example URLs silently, so warn loudly when it's missing.
if (!process.env.SITE_URL) {
  console.warn(
    '[astro.config.mjs] SITE_URL is not set — sitemap.xml will use the placeholder ' +
      'https://omnilab.example. Set SITE_URL to the real deploy domain before shipping ' +
      'a production build (see docs/deployment-guide.md).',
  );
}
const site = process.env.SITE_URL ?? 'https://omnilab.example';

export default defineConfig({
  site,
  output: 'static',
  markdown: {
    // Unified processor is required for remark plugins to run (Astro 7's
    // default processor ignores them). SmartyPants is off so rendered text
    // keeps the original quotes/dashes exactly as written in the sources.
    processor: unified({
      remarkPlugins: [remarkReadingTime],
      rehypePlugins: [rehypeWrapTables],
      smartypants: false
    }),
    shikiConfig: {
      // Dual theme: light colors inline, dark colors exposed as --shiki-dark
      // vars and switched in src/styles/prose.css under prefers-color-scheme.
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: 'light',
      wrap: false,
    },
  },
  integrations: [mdx(), sitemap()],
  build: {
    // Keep all CSS in external files (never inline <style> blocks).
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Never inline hoisted component scripts: they stay external files so
      // the Caddyfile CSP can use plain `script-src 'self'` without hashes
      // that would silently break whenever a script changes.
      assetsInlineLimit: 0,
    },
  },
});
