// Astro config: static output only, no server adapter, so Railpack serves
// the build with its Caddy static-file provider (see ./Caddyfile).
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// SITE_URL is read at build time so sitemap.xml/canonical URLs match the real
// deploy domain. Fallback keeps `pnpm build` reproducible before the user
// sets SITE_URL on Railpack/Vibe Deploy Nhan Hoa. Document in deployment-guide.md.
const site = process.env.SITE_URL ?? 'https://omnilab.example';

export default defineConfig({
  site,
  output: 'static',
  integrations: [mdx(), sitemap()],
  build: {
    // Keep all CSS in external files (never inline <style> blocks) so the
    // Caddyfile CSP can stay `style-src 'self'` without 'unsafe-inline'.
    inlineStylesheets: 'never',
  },
});
