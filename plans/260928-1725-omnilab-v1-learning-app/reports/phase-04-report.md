---
phase: 4
title: "Phase 4 report: Domain and reader screens"
date: 2026-09-28
status: completed
---

# Phase 4 report: Domain and reader screens

## Files created

- `src/lib/content-order.ts` (60L) — pure ordering/adjacency logic (`sortByOrder`, `sortLessons`,
  `adjacentInOrder`) over plain arrays, no `astro:content` import — unit-testable standalone.
- `src/lib/content-queries.ts` (103L) — `astro:content`-aware wrapper: `getDomains`, `getDomain`,
  `getModules`, `getLessonsByDomain`, `getAllLessonsOrdered`, `getAdjacent`. Every page below goes
  through this, single source of ordering truth per phase spec.
- `tests/content-order.test.mjs` (94L, 12 tests) — sortByOrder (ascending/stable/non-mutating),
  sortLessons (module-then-lesson order, module-boundary crossing, unknown-moduleId fallback,
  non-mutating), adjacentInOrder (first/middle/last/missing-id/empty-list).
- `src/components/domain/{domain-card,domain-hero,lesson-row}.astro` (150L/84L/82L).
- `src/components/lesson/{lesson-cover,lesson-meta,lesson-toc,attribution-footer,next-lesson-card}.astro`
  (119L/46L/69L/54L/73L).
- `src/pages/gioi-thieu.astro` (174L) — purpose, sources/licenses (System Design Primer CC BY 4.0 +
  link, finance roadmap license-pending), build-time-derived third-party image credits (see below),
  finance disclaimer restatement.
- `src/pages/linh-vuc/[domain]/index.astro` (105L) — domain detail: hero + module sections + lesson
  rows.

## Files modified

- `src/pages/hoc/[domain]/[module]/[slug].astro` (78L) — rewrote Phase 3's bare temp route: real
  `ReaderLayout`, cover, meta, TOC, `<Disclaimer>` gated on `domain.data.isFinance`, MDX body,
  attribution footer, complete-slot, next-lesson nav.
- `src/pages/index.astro` (64L) — "Học tiếp": `continue-reading-slot` + domain cards with
  "Bắt đầu từ bài 1" → first lesson.
- `src/pages/linh-vuc/index.astro` (72L) — real domain cards (was static placeholder), footer link to
  `/gioi-thieu`.
- `src/styles/prose.css` — table rule only (see "Wide-table fix" below); rest untouched.

## Files deleted

- `src/pages/demo-doc.astro` (Phase 2's throwaway reader-layout exerciser, per instructions).

## Not touched (confirmed via `git status`)

`src/components/lesson/{real-life,figure,note,translator-note,disclaimer}.astro`,
`src/components/lesson/mdx-components.ts`, `src/content/**`, `src/assets/**`, `scripts/**`, `docs/**`,
`astro.config.mjs`, `package.json`, `pnpm-lock.yaml`, `Caddyfile`, `src/components/shell/nav-items.ts`.
**Note:** `git status` at time of writing shows `real-life.astro`/`figure.astro` and several
`src/content/lessons/**/*.mdx` as modified, plus new `docs/{content-authoring-guide,cover-image-prompt,
illustration-style-guide}.md` and `src/assets/illustrations/` — these are the parallel Phase 6 content
agent's concurrent in-flight work (SVG style guide, per plan.md "Phase 6 phần SVG style guide có thể bắt
đầu ngay sau 2"), not mine. Confirmed I only ever `Read` those 5 lesson-component files, never
`Edit`/`Write`.

## Wide-table CSS fix (real bug found + fixed, worth flagging)

astro.config.mjs is off-limits (no rehype plugin to auto-wrap `<table>` in a scrolling `<div>`), and no
migrated content wraps its own tables. First attempt: `.prose table { display: block; width:
max-content; max-width: 100% }` (the common "GitHub markdown CSS" trick). **This did not actually work**
— measured empirically with Playwright at 375px on `kien-truc/bai-tap/scaling-aws` (a table nested
inside a `<TranslatorNote>` aside): 48px of real page-level horizontal overflow. Root cause (confirmed
via `getComputedStyle`/`getBoundingClientRect` on the live page): forcing `display: block` on `<table>`
does not change the UA-default `display` of its descendants (`thead`/`tr`/`td` stay
`table-row-group`/`table-row`/`table-cell`), so the browser still generates an anonymous table-layout
box for them — that anonymous box rendered wider than the blockified outer `<table>` box, escaping its
`overflow-x: auto`/`max-width: 100%`. Fixed by leaving `<table>` at its native `display: table` and
instead giving `overflow-x: auto` to the table's real DOM parent via `:has()`:
```css
.prose .table-wrap,
.prose :has(> table) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```
Re-verified with the same Playwright script: 0px overflow on all 9 pages checked (see "Verify" below).
`:has()` requires Safari 15.4+/Chrome 105+ — acceptable given the project's modern-iOS-Safari-first
target.

## Fallback lesson cover (no `cover` frontmatter — currently all 50 lessons)

Per spec "gradient accent domain + module icon + tiêu đề, rendered as inline SVG markup — not an inline
script": real inline `<svg>` (`<rect>` + `<linearGradient>`, base fill `var(--accent)` + a bottom
black-opacity gradient for text legibility) for the gradient background, plus a plain HTML overlay
(Lucide icon + `<p>` title) on top — SVG `<text>` doesn't wrap, so long titles use real HTML instead.
**Deviation**: content schema has no per-module icon field (`moduleSchema` = `{id, title, order}` only)
— used the **domain's** icon (the only icon in the schema) instead; documented here rather than guessing
at a schema change outside this phase's ownership. Zero CLS: wrapper `div` uses `aspect-ratio: 16/9`
(no JS/measurement needed); the `cover`-present branch uses `astro:assets <Image>` (sharp now installed
per controller's astro.config changes), which auto-derives width/height from the imported asset.

## Dynamic domain icon lookup (acceptance criteria #7 — new domain needs no code change)

`domain-card.astro`/`domain-hero.astro`/`lesson-cover.astro` resolve the YAML `icon: "network"` field via
`icons[toPascalCase(icon)]` from `@lucide/astro`'s `icons` namespace export (the *whole* Lucide icon set),
not a fixed per-icon import map like `tab-bar`/`sidebar-nav` use for the 4 static nav icons. This is
required for a genuinely-new domain (arbitrary icon name) to render without touching any of these
component files — verified against `docs/deployment-guide.md`'s "add a domain" contract in spirit (not
re-run here; Phase 3 already proved the equivalent for content, see phase-03 report). No client bundle
cost: these are server-rendered Astro components, output is static SVG in the HTML.

## `/gioi-thieu` image credits (build-time derived, not a general statement)

`entry.body` (glob loader's retained raw MDX text) is regex-scanned for `credit={\`...\`}`/`credit="..."`
occurrences across all `kien-truc` lessons, deduped, rendered in a `<details>` list. First regex attempt
(scoping to `<Figure ... >` tag text via `[^>]*`) silently produced 0 results — the credit value itself
embeds an `<a href="...">` tag whose own `>` prematurely closed the outer match. Fixed by matching
`credit={` values directly without first isolating the tag boundary (verified: 15 unique credits found
and rendered with working links in the built HTML).

## Verify (all pass)

- `pnpm test` (vitest): **121/121 pass** (111 pre-existing + 12 new content-order tests).
- `pnpm check` (`astro check`): **0 errors, 0 warnings, 0 hints**, 53 files.
- `pnpm build`: **58 pages** = 50 lessons (27 kien-truc + 23 tai-chinh) + 2 domain pages
  (`/linh-vuc/kien-truc`, `/linh-vuc/tai-chinh`) + 6 shell pages (`/`, `/404`, `/linh-vuc`, `/tim-kiem`,
  `/da-luu`, `/gioi-thieu`). Matches the expected count exactly.
- Inline-script/CSP check: wrote a small Node script scanning all 58 `dist/**/*.html` for
  `<script ...>` tags lacking `src=` — **0 found** (every script stays external per the existing
  `assetsInlineLimit: 0`/Caddyfile CSP contract; I added no `<script>` anywhere).
- Module-boundary next-lesson check: `kien-truc/nen-tang/asynchronism` (order 4, last of `nen-tang`) →
  `next-lesson-card` links to `/hoc/kien-truc/danh-doi/performance-vs-scalability` (order 1, first of
  `danh-doi`) — **correct**, confirms `getAdjacent` crosses module boundaries via the domain's own
  `modules[].order`, not lesson `order` alone.
- Domain-end check: `kien-truc/bai-tap/query-cache` (order 8, last lesson of the last module) renders
  the "Hoàn thành lĩnh vực" card instead of a next-lesson link — **correct**.
- DOM contract spot-check (`dist/hoc/kien-truc/chu-de/cache/index.html`): `data-lesson-id=
  "kien-truc/chu-de/cache"`, `data-domain="kien-truc"`, `data-pagefind-body`,
  `data-examples-reviewed="false"`, `class="lesson-complete-slot"` — all present on/under the `<article>`
  root as specified.
- TOC anchor check: `<h2 id="nội-dung-gốc">` / TOC `<a href="#nội-dung-gốc">` — ids match (Astro's
  built-in heading-id generation, independent of the custom `unified()` remark processor in
  astro.config.mjs; Vietnamese-diacritic slugs work correctly).
- Disclaimer gating: present on `tai-chinh/khoi-dong/vi-sao-hoc` (1×), absent on
  `kien-truc/chu-de/cache` (0×) — **correct** (`domain.data.isFinance`-gated).
- 375px no-page-horizontal-scroll: installed Playwright Chromium via `npx playwright install chromium`
  (already cached locally, no new npm dependency added to the project), served `dist/` via
  `astro preview`, measured `document.documentElement.scrollWidth` vs `clientWidth` on 9 pages
  (`chu-de/database`, `bai-tap/scaling-aws`, `bai-tap/mint`, `nen-tang/databases`, both domain pages,
  `/linh-vuc`, `/gioi-thieu`, `/`) — **0px overflow on all 9** after the `:has()` table fix (was 48px on
  `scaling-aws` before the fix — see above).
- Screenshots (375px) in `plans/260928-1725-omnilab-v1-learning-app/reports/screenshots/`:
  `linh-vuc-375.png`, `linh-vuc-kien-truc-375.png`, `home-375.png`, `gioi-thieu-375.png`,
  `database-top-375.png`, `scaling-aws-top-375.png`, `scaling-aws-table-375.png` (mid-scroll, proves the
  table scrolls internally without shifting the fixed back button), `finance-lesson-dark-375.png`
  (`prefers-color-scheme: dark` emulated — confirms cover-fallback text contrast and `<Disclaimer>`
  render correctly in dark mode too).

## DOM contracts for Phase 5 (as implemented — read this before wiring the progress island)

- **Domain card** (`/linh-vuc`, `/`): `<span class="progress-ring-slot" data-domain="<domainId>">`,
  empty, absolutely positioned top-right of the card.
- **Lesson row** (`/linh-vuc/<domain>`): row root is `<a class="lesson-row" data-lesson-id="<id>"
  data-domain="<domainId>">`; inside it, `<span class="lesson-status-slot">` (no data attrs of its own —
  read them off the row root via `.closest()`/parent selector).
- **Reader article** (`/hoc/<domain>/<module>/<slug>`): root is `<article class="lesson-article"
  data-lesson-id="<id>" data-domain="<domainId>" data-examples-reviewed="true|false"
  data-pagefind-body>`. Inside it: `<div class="lesson-complete-slot" data-lesson-id="<id>"
  data-domain="<domainId>">` (this slot *does* carry its own copies of both data attrs, for convenience
  — not strictly required by the phase spec but harmless/useful since it's the element Phase 5 will
  likely attach a "mark as read" control to directly).
- **Homepage**: `<div class="continue-reading-slot">`, empty, directly under `<h1>`-equivalent large
  title, before the domain-card list.
- **Badge "Nháp"**: `data-examples-reviewed="true|false"` lives on the same `<article>` root (not a
  separate slot) — Phase 6's CSS should target `[data-examples-reviewed="false"] .real-life` as already
  specified in my task brief; I did not touch `real-life.astro` itself.
- Lesson id format everywhere: `domain/module/slug` (unchanged from Phase 3's `lesson-id.ts` contract).

## Deviations / notes

1. Fallback cover uses the **domain** icon, not a "module icon" — schema has no module-level icon field
   (see "Fallback lesson cover" above).
2. `/gioi-thieu` third-party image credits are derived at build time (not a general statement) — 15
   unique credits found across 27 kien-truc lessons.
3. Tài chính's "23 bài · 40 phút đọc" total on the domain cards is correct per existing frontmatter data
   (16 of 23 finance lessons have `readingMinutes: 1`, reflecting Phase 3's fine-grained HTML-section
   split) — not a bug in this phase's aggregation logic, just a pre-existing content characteristic;
   flagging in case Phase 6/7 wants to revisit reading-time granularity for very short lessons.
4. `next-lesson-card`'s "Hoàn thành lĩnh vực" card links back to `/linh-vuc/<domainId>` (`domainHref`
   prop), not `/linh-vuc` — re-reading a finished domain's own lesson list felt more useful than the
   top-level domain picker; trivial one-line change if the controller prefers the latter.
5. `sortByOrder`/`sortLessons` in `content-order.ts` take an `orderOf`/`moduleOrderOf` **selector
   function** rather than assuming an `{ order }` shape directly — kept them decoupled from any specific
   entry shape (domains, modules, lessons all reuse the same `sortByOrder`) per DRY/YAGNI.

## Unresolved questions

None blocking. Carried over from Phase 3 (not mine to resolve): finance content license still
"Chưa xác định — cần user xác nhận" (reflected verbatim on `/gioi-thieu`, not glossed over).

Status: DONE
Summary: All Phase 4 routes/components built on top of Phase 2 shell + Phase 3 content
(`content-queries.ts`/`content-order.ts` single ordering source, domain list/detail, real reader replacing
the temp route, fallback SVG covers, TOC, attribution, next/complete nav, `/gioi-thieu`). `pnpm
test`/`check`/`build` all green (121 tests, 0/0/0, 58 pages). Found and fixed a real 48px 375px
horizontal-overflow bug in the wide-table CSS approach (documented root cause + fix) via actual
Playwright measurement, not just visual inspection — all 9 checked pages now 0px overflow. Did not touch
any file outside my ownership; confirmed the concurrent Phase 6 content-agent's in-flight changes
(`figure.astro`/`real-life.astro`/lesson `.mdx`/new `docs/`+`src/assets/illustrations/`) are not mine.
Concerns/Blockers: none blocking. Flagging deviations #1 and #3 above for controller awareness, not
requesting a decision before Phase 5/6 proceed.
