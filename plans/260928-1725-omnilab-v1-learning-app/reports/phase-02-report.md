---
phase: 2
title: "Phase 2 report: Design system and app shell"
date: 2026-09-28
status: completed
---

# Phase 2 report: Design system and app shell

## Files created

- `src/styles/tokens.css` (124L) — light/dark tokens: `--bg/--surface/--surface-2/--ink/--ink-2/--line`,
  `--accent`(=`var(--domain-accent,#4F46E5)`)/`--domain-accent`/`--domain-accent-dark`, named
  `--domain-kien-truc-accent(-dark)`/`--domain-tai-chinh-accent(-dark)` (for the one page that must show
  both domains' colors at once — see linh-vuc/index.astro), `--surface-veil` (translucent bar bg),
  `--radius-card`(16)/`--radius-row`(12)/`--radius-full`, 4pt spacing `--space-1..8`
  (4/8/12/16/24/32/48/64), `--dur-fast`(150)/`--dur`(250)/`--dur-exit`(170)/`--ease-out`/`--ease-in`,
  `--font-ui`/`--font-mono`, type scale `--text-caption..--text-large` (13/15/17/20/22/28/34),
  `--leading-*`, `--z-nav/--z-overlay/--z-toast`, `--shadow-card`, shell constants
  `--shell-navbar-h`(44)/`--shell-tabbar-h`(56)/`--shell-sidebar-w`(240). Dark block only in
  `@media(prefers-color-scheme:dark)`, no toggle.
- `src/styles/base.css` (147L) — reset, `color-scheme`, focus-visible rings, `.skip-link`, `.tap-scale`
  (transform/opacity only, no layout shift), reduced-motion global kill-switch. View Transitions CSS
  split out (see below, kept this file <150L per modularization rule).
- `src/styles/view-transitions.css` (68L) — forward=slide-left/back=slide-right on the default
  `::view-transition-*(root)` pseudo pair (no `transition:name` needed anywhere), keyed off
  `[data-astro-transition="back"]` (same mechanism Astro's own built-in `slide()` preset uses — verified
  in `astro/dist/transitions/router.js`). Reduced-motion: `animation:none!important` on all
  `::view-transition-*` (mirrors Astro's own `viewtransitions.css`), i.e. **no slide**, instant swap.
- `src/styles/prose.css` (172L) — `.prose` for reader body, 65ch measure, 17px/1.7, headings mapped to
  large/title1/title2/title3, `.table-wrap` horizontal-scroll contract for wide tables, `pre`/code
  scroll, blockquote, figure/figcaption, links underlined.
- `src/layouts/base-head.astro` — shared `<head>` partial (fonts, tokens/base/view-transitions CSS,
  manifest, icons, theme-color ×2, apple-mobile-web-app metas) used by both layouts so they can't drift.
- `src/layouts/domain-accent.ts` — `domainAccentStyle(light?, dark?)`: builds the inline `style` string
  for `<html>` (must be `:root` itself, not `<body>`, for the CSS custom-property override to reach
  tokens.css's `:root{--accent:var(--domain-accent,...)}` rule); validates hex before interpolating.
- `src/layouts/app-layout.astro` — props `{title, description?, domainAccent?, domainAccentDark?,
  largeTitle?}`; sidebar (>=1024px) + tab bar (<1024px) + optional `LargeTitleHeader` + `<main
  id="main-content">`; skip link; touchstart no-op (arms iOS `:active`).
- `src/layouts/reader-layout.astro` — props `{title, description?, domainAccent?, domainAccentDark?,
  backHref, backLabel?}` + default slot + named slot `top-actions` (passthrough to `ReaderTopBar`, ready
  for Phase 5's bookmark button); wraps slot in `<main id="reader-content" class="prose">` so consumers
  never have to remember the class; no tab bar/sidebar (full-bleed reading).
- `src/components/shell/nav-items.ts` — single source for the 4 tabs + `isNavItemActive()` (nested-route
  aware: `/linh-vuc` tab also highlights for `/linh-vuc/*` and `/hoc/*`).
- `src/components/shell/tab-bar.astro` — fixed bottom, `env(safe-area-inset-bottom)`, hides on
  `focusin`/`focusout` of any `<input>`/`<textarea>` anywhere on the page (iOS keyboard-jump guard),
  `aria-current="page"`.
- `src/components/shell/sidebar-nav.astro` — >=1024px fixed left sidebar, same data source.
- `src/components/shell/large-title-header.astro` — 34px title collapsing to 17px nav-bar title via
  `IntersectionObserver` on a sentinel (no scroll listener).
- `src/components/shell/reader-top-bar.astro` — back button (44px target), title that fades in once the
  article's own `<h1>` (in `#reader-content`) scrolls behind the bar, `top-actions` slot, progress bar
  via `transform:scaleX()` (rAF-throttled scroll listener, passive).
- `public/manifest.webmanifest` — standalone, `start_url`/`scope`=`/`, `lang:vi`, 192/512/512-maskable
  PNG icons.
- `public/icons/{apple-touch-icon,icon-192,icon-512,icon-512-maskable}.png` — real rasterized PNGs (see
  "Icon generation" below), not placeholders-in-name-only.
- `src/pages/{linh-vuc/index,tim-kiem,da-luu,demo-doc}.astro` — placeholders per spec; `demo-doc.astro`
  exercises `reader-layout` + `.prose` (headings/table/code/blockquote/list, incl. the
  "Ước lượng ổn định tưởng" diacritics stress string) since no real lesson content is mine to render yet;
  clearly marked for Phase 4 to delete.

## Files modified

- `src/pages/index.astro`, `src/pages/404.astro` — now use `app-layout.astro`.
- `public/favicon.svg` — redesigned to match the app-icon mark (graduation-cap glyph) instead of "OL"
  text monogram, same accent bg.
- `Caddyfile` — CSP `script-src` line only, +4 `'sha256-...'` hash-sources. See "CSP findings" below —
  this was **required**, not optional (verified against real build output, see below).

## Icon generation

No image CLI (ImageMagick etc.) pre-installed (`convert` on PATH is Windows' own disk-conversion tool,
not ImageMagick). Used `npx --yes sharp-cli` (one-off, not added to `package.json`/lockfile, per task
allowance) to rasterize hand-written SVG sources (accent-bg square + white Lucide `graduation-cap` glyph,
generous padding; maskable variant uses a smaller glyph so it stays inside the 40%-radius safe zone) to
PNG at 512/192/180px. Verified exact output dimensions by reading each PNG's IHDR chunk: 192x192,
512x512 (both `icon-512.png` and `icon-512-maskable.png`), 180x180. Apple touch icon has no transparency
(opaque bg fill) per iOS convention.

## Contrast ratios (WCAG relative-luminance, computed, not eyeballed)

| Pair | Light | Dark |
|---|---|---|
| `--ink` / `--bg` | 15.28:1 | 16.47:1 |
| `--ink` / `--surface` | 16.52:1 | 14.96:1 |
| `--ink-2` / `--bg` | 5.85:1 | 8.17:1 |
| `--ink-2` / `--surface` | 6.32:1 | 7.43:1 |
| Kiến trúc accent / `--surface` | 6.29:1 (#4F46E5) | 8.48:1 (#A5B4FC) |
| Tài chính accent / `--surface` | 5.26:1 (#1F7A5A) | 11.10:1 (#6EE7B7) |
| `--accent-on` / accent fill | 6.29:1 / 5.26:1 | 9.34:1 / 12.22:1 |

All exceed the required 4.5:1 (primary) / 3:1 (secondary), including for small text (13px tab labels)
which technically needs the stricter 4.5:1 — everything above clears that too, with margin. `--line`
borders: 1.22:1 (light) / 1.40:1 (dark) vs bg — dividers only, not held to text-contrast thresholds.
Script + numbers: `plans/.../reports/` scratch script available on request if these need re-deriving;
not committed (scratch-only, per instructions).

## JS budget (gzip)

Only script on every page: Astro's `ClientRouter` (View Transitions) — 16357B raw / **5653B gzip**,
one physical file (`ClientRouter.astro_astro_type_script_index_0_lang.*.js`), same content-hash across
all pages so it's fetched once and cached, not once-per-navigation. Plus 4 tiny per-component inline
scripts (330-400B raw each, see CSP section) that ride along inside the already-gzipped HTML response
(Caddyfile has `encode gzip zstd`). Worst case (cold cache, first page): ~5.7KB gzip total JS — well
under the 30KB/page budget.

## CSP findings (important — required a Caddyfile change)

`pnpm build`/`astro check` were blocked most of this session by Phase 3's in-flight
`astro.config.mjs`/`package.json` changes (missing `@astrojs/markdown-remark`, later missing lesson
assets) — **not mine to fix** (outside file ownership). To verify my own files without waiting, I built
an isolated scratch copy of the repo (own `node_modules` via `pnpm install`, `@astrojs/markdown-remark`
added *only* in that copy) and confirmed 0 `astro check` errors + a clean `astro build` for all 5 of my
pages + the demo reader page. Once Phase 3 resolved their config, I re-ran both `pnpm check` (0
errors/0 warnings, 40 files) and `pnpm build` (34 pages, full real content) in the actual repo — same
result, confirming the isolated verification was representative.

**Finding:** Astro's build auto-inlines small per-component `<script>` blocks as literal
`<script type="module">...</script>` in the HTML — confirmed via `dist/*.html`, and confirmed this is
independent of whether the script is written as an inline body or as `src="./file.ts"` (tested both).
There is no `astro.config.mjs` option analogous to `build.inlineStylesheets` to force these external, and
`astro.config.mjs` is outside Phase 2 ownership regardless. This affects exactly 4 distinct script bodies
(tab-bar focus-hide, large-title-header collapse observer, reader-top-bar collapse+progress, shared
touchstart no-op) — same 4 hashes reused verbatim across every page that includes them, confirmed
identical between the isolated build and the real repo build. Per task instructions ("hashes preferred
over 'unsafe-inline'"), added exactly these 4 `'sha256-...'` sources to `script-src` in `Caddyfile`
(comment there explains regeneration steps for future phases). `style-src` needed no change — confirmed
zero `<style>` tags anywhere in `dist/**/*.html`.

**Separate finding, not fixed (outside my file ownership):** `dist/hoc/**/*.html` (Phase 3's migrated
lesson content) contains inline `style="color:#..."` attributes — syntax-highlighted code token colors,
almost certainly Shiki/rehype-pretty-code's default inline-style output. `style-src 'self'` (no
`style-src-attr` override) blocks `style=""` attributes too, so these will currently render unstyled
(unhighlighted, still readable) once deployed. Flagging for Phase 3/6/controller — three options: switch
the highlighter to a CSS-variables theme (no inline styles), add `'unsafe-inline'` to `style-src` (accept
the tradeoff), or hash (impractical — effectively one unique value per token). Did not touch `style-src`
myself since I can't fully scope Phase 3's highlighter setup from Phase 2, and the file-ownership grant
for Caddyfile was for "the CSP line, only if truly required — justify" for *my own* phase's needs.
Also confirmed: `/hoc/**` pages do not yet use `reader-layout.astro` (still a Phase 3/4 stub) — not a
regression, just means their inline-script surface (if any, once wired) will already be covered by the
same 4 hashes since it'd be the same `reader-top-bar.astro` component.

## Deviations from phase file

- Phase file's own "Related Code Files" lists `astro.config.mjs` under Phase 2's modify list, but the
  controller's task explicitly assigned it to Phase 3 (and forbade me from touching it) — followed the
  controller instruction; Phase 3 already owns real changes there (mdx/markdown config).
- Did not add a 5th "large title" concept file beyond what's listed; `largeTitle` is a plain string prop
  on `app-layout.astro`, applied to all 4 tab pages (incl. Tìm kiếm/Đã lưu) for navigation consistency —
  not explicitly required by spec for those two but matches iOS's own Search-tab convention (large title
  + field below) and avoids an inconsistent shell across tabs.
- `apple-mobile-web-app-status-bar-style` set to `"default"`, not `"black-translucent"` — justified in
  `base-head.astro`'s comment: black-translucent forces permanently-white iOS status-bar icons with no
  per-theme control, which would be unreadable against the light theme's near-white top background;
  `"default"` avoids that contrast failure. `env(safe-area-inset-*)` in components still degrades to 0
  harmlessly under `"default"`.
- `linh-vuc/index.astro`'s two domain cards are non-interactive (no `href`) with a "Sắp có nội dung" note
  instead of linking to a not-yet-existing domain route — avoids shipping a dead link; Phase 4 will make
  them real links once `/linh-vuc/<slug>` exists.
- Split `view-transitions.css` out of `base.css` (147L + 68L instead of one 215L file) per the
  >200-line modularization guideline.

## Tests status

- Type check (`pnpm check`, real repo, after Phase 3 unblocked it): **0 errors, 0 warnings, 0 hints**,
  40 files.
- Build (`pnpm build`, real repo): **pass**, 34 pages, includes all 6 of mine + Phase 3's 28 lesson pages.
- No unit tests added — this phase is markup/CSS/shell wiring with no pure-function logic worth a test
  beyond `isNavItemActive()`; left untested by choice (trivial 3-line predicate, exercised implicitly by
  every page's `aria-current` in the build output) rather than adding a test harness dependency outside
  my file ownership (`vitest.config.ts` belongs to Phase 3).
- Manual width checks: no `playwright`/browser tool available in this environment (checked, not
  installed, `npx playwright` would need a fresh browser download I didn't attempt); verified layout
  correctness instead via the generated CSS (safe-area usage counts, media-query breakpoints at 768/1024)
  and literal HTML output inspection rather than screenshots.

## Unresolved questions

- Phase 3's Shiki/highlighter inline `style=""` attributes vs current strict `style-src 'self'` (see CSP
  findings) — needs a decision from whoever owns that pipeline.
- Confirm with user/controller once Vibe Deploy is live that the 4 CSP script hashes still match
  production `pnpm build` output (same Node/pnpm/lockfile as this session, so expected stable, but
  worth a one-line `curl` sanity check per `docs/deployment-guide.md`'s existing checklist).

Status: DONE
Summary: Design tokens (light/dark, verified contrast), app-shell layouts (tab bar/sidebar/large-title/reader-top-bar+progress), View Transitions slide (forward/back, reduced-motion-safe), manifest+real PNG icons, 5 placeholder pages + demo reader page. `pnpm check`/`pnpm build` pass on real repo (0 errors, 34 pages). Required one justified Caddyfile CSP change (4 script hashes, not unsafe-inline) after confirming Astro auto-inlines small component scripts with no config workaround available.
Concerns/Blockers: Phase 3's lesson-page syntax highlighting likely needs a CSP/Shiki decision (see CSP findings) — not blocking Phase 2 completion, flagging for controller routing.
