# Phase 02b report — reader, lesson components, prose

## Changed
- `src/styles/prose.css`: 17px/1.65 mobile, 18px/1.7 >=1024; dropped 65ch + margin-inline (reader-layout owns measure). h1-h4 scale + scroll-margin-top under glass bar, lists w/ muted markers, tables as inset card (`.table-wrap` scrolls inside), code/pre as cards, tinted-accent blockquote, hairline separators, images radius-card-sm.
- New `src/lib/toc-scrollspy.ts` (pure `pickActiveIndex`, `readingPercent` + `attachTocScrollspy`: IntersectionObserver + rAF scroll/resize, sets `aria-current="location"`, no animation) + `tests/toc-scrollspy.test.mjs` (+5 tests -> 332).
- New `src/components/lesson/lesson-aside.astro` (slot="aside"): `<nav aria-labelledby>` TOC w/ scrollspy highlight, "Tiến độ" card (percent + bar, updated from scroll), complete (large), bookmark (labeled), next-lesson card. Script uses `onPageLoad` (re-init per astro:page-load, torn down before-swap).
- `[slug].astro`: renders LessonAside; inline `.lesson-complete-slot`, `NextLessonCard`, and `LessonToc` carry `hide-at-aside-width` -> exactly one visible copy at any width (no duplicate links/landmarks/ids; aside TOC ids only `aside-*-title`).
- Islands: `mark-complete-button` (prop `placement`, filled-when-done capsule 54px, tinted when open) and `bookmark-button` (prop `variant: icon|labeled`) now bind **every** `[data-mcb]`/`[data-bb]` instance via `querySelectorAll`, each subscribed to the progress store -> copies stay in sync (verified in browser: click aside complete + labeled bookmark -> both inline/top-bar instances flip). `reader-progress-tracker` untouched.
- Components restyled iOS cards: cover (radius 22, 2.4:1 banner >=1024), meta, note (inset accent bar), real-life (accent-tint), review-note, translator-note, disclaimer (fill-tint, strong in ink), attribution (card, 44px link), figure (card panel, glass zoom chip, filled close), next-lesson (card + chevron), lesson-toc (iOS list in card, chevron, 44px rows).
- No edits to tokens/base/layouts/shell/MDX/SVG. No new inline scripts (bundled modules only).

## Validate
- `pnpm test` 332 pass; `pnpm check` 0 errors; `pnpm build` 73 pages.
- Screenshots `reports/phase-02b/`: arch (Mint, figures/tables/code) + fin (Dữ liệu và công nghệ, disclaimer) x 390/1024/1440 x light/dark, each + `-scrolled` (scrollspy active entry + progress %), plus `arch-390-light-table/-end`, `fin-1440-light-done`. scrollWidth == clientWidth at all sizes (390 min tested; 320 not screenshotted).
- Scrollspy verified: highlight follows current h2, progress 26-53% at scroll. Inspected + fixed: aside cards squashed when undo toast grew (now `flex-shrink:0`, aside scrolls).
- Preview: `astro preview` is single-instance per project (another agent held 4410), so served `dist` via `python -m http.server 4420`; stopped. agent-browser closed.

## Notes / requests
- Cover fallback + MDX h1 + top-bar title all show the title (pre-existing); consider hiding cover title overlay when h1 present (phase 3).
- At 1024-1279 aside is hidden by design; reader there = sidebar + article + inline TOC.
- Aside is DOM-after main (keyboard users reach it after article); acceptable, skip-link targets main.
- `--surface-veil`, `--shadow-bar` aliases still unused by my files.

Status: DONE
