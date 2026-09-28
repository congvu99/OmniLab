# Code Review — OmniLab v1 (pre-push)

Date: 2026-09-28 · Branch: main @ 4f1258b · Reviewer: code-reviewer (report only, no edits)

## Scope
- Files: astro.config.mjs, Caddyfile, package.json, public/manifest.webmanifest, src/content.config.ts, src/lib/**, src/components/**, src/layouts/**, src/pages/**, src/styles/**, scripts/**, tests/** (lesson prose excluded)
- LOC: ~7.7k (code + tests + scripts)
- Runs: `pnpm test` → 10 files / 174 tests PASS. `pnpm check` → 0 errors / 0 warnings / 0 hints. `node scripts/verify-fidelity.mjs` → OK (27 + 23).
- Extra probes I ran (scratchpad scripts, nothing in the repo changed): recomputed readingMinutes for all 50 lessons; ran MiniSearch against `dist/search-index.json`; fed crafted MDX to `textFromLessonMdx`; grepped `dist/` for inline scripts, handlers and styles; read the Astro ClientRouter source (`node_modules/astro/dist/transitions/router.js`, `swap-functions.js`).

## Overall
The core logic is well tested: the store, ordering, search folding and fidelity. XSS hygiene is good: search results and the saved list use a `<template>` plus `textContent`, and `set:html` only takes build-time repo content. The CSP holds: `dist/` has 0 inline `<script>` and 0 `on*=` attributes. The biggest risk is how scripts behave with ClientRouter. Several module scripts bind to the DOM once and stop working after the first soft navigation. The scroll tracker can also overwrite the saved position during navigation. That directly weakens AC1 and AC3, and the QA report checked those two structurally only ("verified structure"), not by behaviour. The Caddy HTML cache rule matches almost no real page URLs.

---

## Critical
None.

## High

### H1. Top-level module scripts bind once and die after the first ClientRouter navigation — confidence HIGH
- `src/components/shell/tab-bar.astro:113-124`, `src/components/shell/reader-top-bar.astro:118-157`, `src/components/shell/large-title-header.astro:79-91`
- Astro module scripts run once per session. `swap-functions.js` `detectScriptExecuted` marks them `data-astro-exec` and `runScripts` skips them. These three query the DOM at the top level instead of on `astro:page-load`. After the body swap, `bar`, `progress`, `navbar`, `sentinel` and `articleHeading` point at detached nodes.
- Failure scenarios:
  - Home (first load) → tap the "Tìm kiếm" tab → focus the input. The *old* detached tab bar gets `data-hidden`, so the visible bar stays up and the iOS keyboard pushes it into mid-screen. This is the risk the code was written to prevent, and it touches AC1.
  - Reader A → "Bài tiếp theo" → B. B's reading-progress bar stays at 0 and the collapsing title never toggles. A's window scroll listener keeps writing to a detached node (leak).
  - `/` → `/linh-vuc`: the large-title navbar never collapses.
- Fix: wrap each script in `init()` on `astro:page-load`, and tear down on `astro:before-swap`. For tab-bar, keep the `document` listeners registered once and look up the bar at event time:
  ```ts
  document.addEventListener('focusin', (ev) => {
    if (isTextInput(ev.target)) document.querySelector<HTMLElement>('[data-tab-bar]')?.setAttribute('data-hidden', 'true');
  });
  ```
  For reader-top-bar and large-title-header, keep a module-level `cleanup` that runs `observer.disconnect()` and `removeEventListener('scroll', …)`. This is the same pattern `reader-progress-tracker.astro` already uses.

### H2. Scroll tracker can overwrite the previous lesson's position with 0 during soft navigation — confidence MEDIUM (traced through the router code, not run in a browser)
- `src/components/islands/reader-progress-tracker.astro:14-18, 52-56`
- Cleanup of the window scroll listener only happens in the *next* `astro:page-load`. In `router.js`, the sequence is: `updateDOM` → `moveToLocation` calls `scrollTo({top:0})` right after the swap (lines 131/149) → `updateCallbackDone.finally(async () => { await runScripts(); onPageLoad(); })` (lines 350-352). `runScripts` waits for the `load` event of every script that has not run yet in the session. In that gap the browser renders frames. The scroll event from `scrollTo(0)` reaches the *old* `onScroll`, whose rAF calls `store.saveScroll(oldLessonId, 0)`.
- Failure scenario (the core AC3 loop): open the app on `/` → "Học tiếp" → lesson A (resumes at 50%) → read to 70% → tap the back chevron to `/linh-vuc/kien-truc`. That page's lesson-row and domain-hero scripts are new this session, so `runScripts` waits. A is saved as 0. Next launch, "Học tiếp" shows 0% and opens A at the top. The phase-05 e2e passed because its target page was already visited, so its scripts were marked executed and there was no wait.
- A secondary gap: the trailing throttle write (up to 1 s) is lost when the app is closed or backgrounded (no flush on `pagehide`).
- Fix:
  ```ts
  document.addEventListener('astro:before-swap', () => { cleanup?.(); cleanup = null; });
  // inside the rAF callback:
  if (!article.isConnected) return;
  ```
  Also add `flush()` to `ScrollThrottle` (flush every pending id). Call it from cleanup and from `pagehide` / `visibilitychange` (hidden).

### H3. Caddy `@html` matcher misses every clean URL → HTML/JSON served without Cache-Control — confidence HIGH
- `Caddyfile:42-43`: `@html path *.html /`. The Caddy `path` matcher is exact apart from wildcards, so `/` matches only the root. `header` runs before `try_files` in Caddy's directive order, so the matcher sees the original URI, e.g. `/linh-vuc/kien-truc` or `/hoc/kien-truc/chu-de/cache`. Neither matches. The same goes for `/lessons-index.json`, `/search-index.json` and `/manifest.webmanifest`.
- Failure scenario: `file_server` sends `Last-Modified`, so browsers (especially iOS standalone) use heuristic freshness, about 10% of the file's age. After a redeploy, a stale cached HTML page references `/_astro/*.<oldhash>.js/css`. Those files do not exist in the new container → 404 → page without JS/CSS. A stale `lessons-index.json` also hides newly added lessons from "Học tiếp" and "Đã lưu".
- Fix:
  ```
  @notHashed not path /_astro/*
  header @notHashed Cache-Control "no-cache"
  ```
  Keep the `@astroAssets` immutable rule.

## Medium

### M1. `readingMinutes` is stale for 47/50 lessons; the build-time remark plugin's output is never used — confidence HIGH
- `src/lib/remark-reading-time.mjs:14-17` writes to `file.data.astro.frontmatter`. In Astro that only surfaces as `render().remarkPluginFrontmatter`. Every consumer reads `entry.data.readingMinutes` instead: `content-queries.ts:52`, `[slug].astro:65`, `lessons-index.json.ts:29`. That value is the frozen number written by the migration, before phase 6 added `<RealLife>` blocks.
- Measured: Cache lesson frontmatter 12 vs recomputed 15. `dist/hoc/kien-truc/chu-de/cache/index.html` shows "12 phút đọc". 47 of 50 differ, typically by +1 to +4 minutes, and the domain totals are wrong too.
- Fix: pick one of these.
  - (a) Compute `readingMinutes` in `content-queries.ts` `toQueriedLesson` from `entry.body`, reusing the plugin function through a shared pure helper, and drop the frontmatter field.
  - (b) Keep the frontmatter field, add a vitest that asserts frontmatter equals `computeReadingMinutes(body)`, and add a `pnpm` script to regenerate it.
- Either way, drop the misleading plugin registration or the comments that claim it populates `entry.data` (`astro.config.mjs:20-24`, `content.config.ts:59-61`, `scripts/lib/reading-time.mjs:5-12`, which is also stale: it says Astro runs no remark plugins).

### M2. verify-fidelity false negatives: added or changed visible text can slip through — confidence HIGH (probed with `textFromLessonMdx`)
- `scripts/lib/fidelity.mjs:305-310, 216-217, 245-253`. Probe results, where the lesson text still equals the base `"Đoạn gốc."`:
  - `{"Câu chèn thêm"}` (an `mdxFlowExpression` or `mdxTextExpression`) is ignored, but MDX renders it.
  - `export const x = "chèn"` plus `{x}` is ignored.
  - `<Note title="Tiêu đề chèn">`: `title` is not in `TEXT_ATTR_NAMES`, but `note.astro:12` renders it. The same applies to any future text-bearing prop.
- `scripts/verify-fidelity.mjs:121-125` classifies lessons by the hand-rolled `parseLessonFrontmatter`. `domain: 'kien-truc'` (single quotes) or `domain: kien-truc # x` parses as a different string. That lesson is then counted as "other" and **skipped silently**, while Astro's YAML still renders it under kien-truc. `pnpm build` does not run vitest, so `lesson-content.test.mjs` never gets the chance to fail.
- Deleting a kien-truc lesson file is not detected: there is no check that every `content-sources/system-design/**` snapshot is referenced. Finance is covered because its lessons are concatenated.
- Fix:
  - Treat `mdxFlowExpression`, `mdxTextExpression` and `mdxjsEsm` exports as a failure unless they are imports: forbid them in lesson bodies.
  - Include every string-valued JSX attribute on components other than RealLife, Disclaimer and `Figure added`, or maintain an explicit per-component rendered-prop list.
  - Derive the domain from the file path (`lessons/<domain>/…`) and exit 1 on an unknown domain unless it is explicitly allowlisted.
  - Assert that the set of referenced snapshots equals the set of snapshot files, excluding README.
- The remaining hole is by design: `content-sources/` sits in the same repo and is not hash-pinned. Editing lesson and snapshot together passes. Optionally commit a `content-sources.sha256` manifest and check it.
- No false positives found. The current corpus passes, and URL stripping and link-target changes are intentionally ignored.

### M3. Search corpus truncated to 2,500 chars per lesson; long lessons are mostly unsearchable — confidence HIGH
- `src/lib/search-mdx-to-text.ts:33, 51`. 34 of 50 docs hit the cap. "consistent hashing" appears in 5 lessons (database, cache, load-balancer, query-cache, social-graph) and is indexed in 0 (checked against `dist/search-index.json`).
- The index is fetched only on `/tim-kiem` (170 KB raw today). Raise the cap substantially (e.g. 20k) or drop it, since `text` is not in `storeFields`.

### M4. Search precision: OR + prefix + fuzzy returns nearly every lesson; highlights are noisy — confidence HIGH (ran)
- `src/lib/search-index.ts:47-52`. "bộ nhớ đệm" returns 50/50 and "ĐỆM" 49/50, so the "Không tìm thấy" state is practically unreachable. The matched terms include `bo, bot, nho, nhu, nha, de, deu`. `search-highlight.ts:27` then highlights them as raw substrings, so "de" lights up inside unrelated words.
- Fix: `combineWith: 'AND'`, falling back to OR only when AND returns nothing. Use `fuzzy: (term) => term.length >= 4 ? 0.2 : 0` and a similar guard for prefix. In `buildHighlightSegments`, only accept matches that start at a word boundary (`idx === 0 || /\s|\p{P}/u.test(folded[idx-1])`).

### M5. 22 finance lessons render with no `<h1>` — confidence HIGH
- dist count: 28 lesson pages have one h1, 22 have zero. Finance sources start at h2, and the lesson title is rendered as `<p class="lesson-cover__title">` (`lesson-cover.astro:57`). This is a screen-reader landmark and heading-structure problem. It also sends `reader-top-bar.astro:134-137` down the "no heading" fallback, so the title is always shown.
- Fix: in `[slug].astro`, compute `hasH1 = headings.some(h => h.depth === 1)` and pass it to `LessonCover`, which renders the title as `<h1>` when `!hasH1`. No fidelity impact.

### M6. saved-list: focus is lost on remove; all-stale bookmarks give a blank screen — confidence HIGH (from reading the code)
- `src/components/islands/saved-list.astro:162-182`. Clicking remove triggers a store notify, and `replaceChildren()` destroys the focused button. Keyboard and VoiceOver focus drops to `<body>`.
- If every bookmark ID is missing from the index (lesson renamed or removed), the loop appends nothing, then sets `emptyState.hidden = true; rowsList.hidden = false` → an empty white card.
- Fix: count appended rows and show the empty state when the count is 0. After removal, move focus to the next row's link, or to the list/heading with `tabindex=-1`. Optionally prune unknown IDs from `bookmarks`.

### M7. AC7 ("new domain without code changes") only holds for rendering; several hardcoded domain lists — confidence HIGH
- `tests/lesson-content.test.mjs:18-21` (`DOMAIN_MODULES`): adding a test domain makes `pnpm test` fail with "unknown domain".
- `scripts/verify-fidelity.mjs:26-33` (`FINANCE_MODULE_ORDER` duplicates the YAML).
- `src/components/islands/search-box.astro:144-164`: result domain colours are hardcoded for kien-truc and tai-chinh, so a new domain shows the kien-truc indigo.
- `src/pages/gioi-thieu.astro:27-30`: credits are only scanned for kien-truc.
- Fix: parse `src/content/domains/*.yaml` in tests and scripts (the `yaml` package is already a transitive dependency of Astro, or add it as a devDependency). For search results, emit `accent`/`accentDark` in `search-index.json` and set `style="--card-accent:…"` on each row, the same way domain-card does.

### M8. Duplicated progress-ring bootstrap (domain-card / domain-hero) plus an async init race leak — confidence HIGH
- `src/components/domain/domain-card.astro` (script) and `src/components/domain/domain-hero.astro` (script) are byte-identical. They build to identical content (`…sZPoTcEB.js`) under two filenames, so once both pages have been visited, two module instances run on every `astro:page-load`.
- `init` is async. If a navigation happens before `fetchLessonsIndex()` resolves, the first `init` resumes after the second one's `unsubscribe?.()` has already run. It subscribes the detached old rings and overwrites `unsubscribe`, so that subscription is never released.
- Fix: move one copy into `src/components/islands/progress-ring.astro`, which owns the `.progress-ring-slot` DOM contract, and delete both duplicates. Add a generation guard:
  ```ts
  const gen = ++generation; const lessons = await fetchLessonsIndex(); if (gen !== generation) return;
  ```
  The stale comments in `progress-ring.astro:5` and `lessons-index-client.ts:4` reference a non-existent `domain-progress-decorator.astro`.

## Low

- **L1 Comments reference plan phases or reports** (not allowed by the review rules): 58 occurrences in 45 code/script/test files, e.g. `progress-store.ts:5,11`, `real-life.astro:8,67`, `figure.astro:7`, `mdx-components.ts:1-4` ("temporary render route … in Phase 3"), `index.astro:2` ("Phase 5 fills"), `mark-complete-button.astro:6,71`. Rewrite them to state the invariant.
  - Other stale or incorrect comments:
    - `base.css:123` says the touchstart no-op lives in base-head (it is in app-layout and reader-layout).
    - `Caddyfile:53-55` says `'unsafe-inline'` is only for Shiki. It is also required for the `<html style="--domain-accent…">`, the progress-ring `style=` attributes, and the 6 inline-SVG `<style>` blocks (dns, cdn, cache, asynchronism, mint, query-cache).
    - `astro.config.mjs:10-11` promises canonical URLs, but no `<link rel="canonical">` is emitted.
- **L2 Dead attribute:** `data-pagefind-body` at `[slug].astro:60` (Pagefind was dropped).
- **L3 Duplicate type:** `LessonIndexEntry` is declared in both `src/pages/lessons-index.json.ts:8-16` and `src/lib/lessons-index-client.ts:9-17`. Import one from the other.
- **L4 Highlight offsets assume NFC input** (`search-highlight.ts:21`). Decomposed text such as `"ém"` folds from 3 chars to 2 and shifts the `<mark>` slices. The content is 100% NFC today (verified), but nothing guards it. Add `originalText = originalText.normalize('NFC')` first, and NFC-normalize `summary` in `search-index.json.ts`. `search-normalize.ts:13` embeds literal invisible combining characters; write `/[̀-ͯ]/g`.
- **L5 Rollback data loss:** `progress-state.ts:37` returns `emptyState()` for `v !== 1`, and the first write then destroys a future v2 payload if a deploy is rolled back. For `v > 1`, keep the tab in-memory only and do not persist.
- **L6 `lastUnfinished()` can pick a removed lesson ID** (`progress-store.ts:180-187`). `continue-reading-card.astro:120-123` then shows the empty state even when other valid unfinished lessons exist. Pass the set of known IDs, or filter in the card.
- **L7 A11y details:**
  - `mark-complete-button.astro:127-128` changes both the label and `aria-pressed`, so screen readers announce a double state. Keep the label constant.
  - The toast live region starts `hidden` and is filled and then shown together (`:131-137`), so the announcement is unreliable. Keep the region rendered and swap only its text.
  - Search: `aria-live` on the whole results `<ul>` (`search-box.astro:38`) is noisy. Prefer one visually hidden "N kết quả" status.
  - `.search-field input:focus{outline:none}` relies on a border-colour change only.
  - The iOS hint dismiss button is 32 px (`app-layout.astro:116-117`).
  - The back link's `aria-label` equals the domain name and has no "Quay lại" (`reader-top-bar.astro:20`).
- **L8 `SITE_URL` fallback:** `astro.config.mjs:13` silently builds a sitemap with `https://omnilab.example`, and the current `dist/sitemap-0.xml` has it. Log a warning (or fail when `NODE_ENV=production`/`RAILPACK` is set and `SITE_URL` is missing).
- **L9 Files over 200 LOC:** `src/lib/progress-store.ts` (203), `scripts/lib/fidelity.mjs` (269; split into hast-to-text, mdast-to-text and compare), `scripts/migrate-system-design.mjs` (275), `scripts/lib/finance-extract.mjs` (215).
- **L10 Cross-tab lost update:** `persist()` writes the whole state. A write in tab B that lands before B receives tab A's `storage` event reverts A's change. The window is small; the fix is to re-read storage and merge per lesson inside `persist()`.
- **L11 Optional headers:** `Permissions-Policy` (e.g. `camera=(), microphone=(), geolocation=()`). HSTS if the platform does not add it.

## Edge cases found while scouting
- ClientRouter skips scripts that already ran in the session (`scriptsAlreadyRan`), which is the root of H1 and of the H2 timing gap.
- `runScripts` waits only for scripts not yet executed, so H2 only shows on the first visit to a page type in a session. Existing e2e runs did not exercise that path.
- Search: an empty query or an all-punctuation query (`(`, `"`) returns 0 results safely. MiniSearch does not use regex, so no escaping issue. đ/Đ fold correctly ("ĐỆM" → "dem").
- rehype-wrap-tables: correct for flat tables (returns SKIP after the replace). Nested tables are not wrapped (acceptable). It does run in the build: `.table-wrap` is present in dist.
- The `search-mdx-to-text` self-closing `<Figure[\s\S]*?/>` would over-consume a paired `<Figure>…</Figure>`. None exist today (0 closing tags); this is a latent risk only.

## Acceptance criteria → code
| AC | Implemented at | Status |
|---|---|---|
| 1 standalone, 4 tabs, safe-area | `public/manifest.webmanifest`, `base-head.astro:30,50-53`, `nav-items.ts`, `tab-bar.astro:55`, `reader-top-bar.astro:39`, `large-title-header.astro:27` | Implemented. Keyboard-hide is broken after soft navigation (H1). Real-device check still pending (QA evidence is structural). |
| 2 27 + 23 lessons, fidelity | `scripts/verify-fidelity.mjs` | PASS (ran). Guard gaps in M2. |
| 3 done → %, persist, "Học tiếp" + scroll | `progress-store.ts`, `progress-ring-apply.ts`, domain-card and domain-hero scripts, `continue-reading-card.astro`, `reader-progress-tracker.astro` | Implemented. Scroll position is at risk (H2). QA evidence is structural only. |
| 4 cache / bộ nhớ đệm / bo nho dem | `search-normalize.ts`, `search-index.ts`, `tests/search-index.test.mjs` | PASS (ran on real dist: Cache is #1 or #2). Precision in M4. |
| 5 RealLife + SVG + reviewed | content | PASS: 50/50 have `<RealLife>`, `svg={…}` and `examplesReviewed: true` (grep). |
| 6 Lighthouse ≥ 95, CLS < 0.1 | `reports/qa/lighthouse-summary.json` | Scores PASS (96-100). CLS is not recorded in the summary; the QA claim is not measured. |
| 7 test domain without code change | `content.config.ts`, `content-queries.ts`, dynamic Lucide icon | Rendering works (per QA). Tests, fidelity, search colours and credits are hardcoded (M7). |

## Security / contracts summary
- CSP matches reality for scripts: every `<script>` in dist has a `src` and there are 0 inline handlers. Styles need `'unsafe-inline'` (see L1).
- No `innerHTML` on runtime data. `set:html` is used only for build-time repo content (`figure.astro:44,56`, `gioi-thieu.astro:80`). `domainAccentStyle` validates hex before interpolating.
- No secrets in tracked files (pattern scan). `.env*` is gitignored and Caddy hides `.env*` and `.git`.
- Contracts are consistent: lesson ID `domain/module/slug` (`lesson-id.ts`), URL `/hoc/<id>`, storage key `omnilab:v1:state`, and the data-attributes (`data-lesson-id`, `data-mcb*`, `data-bb`, `data-crc*`, `data-saved-*`, `data-search-*`, `.progress-ring-slot[data-domain]`) match between markup and scripts.
- Minor: domain identity uses both `domain.id` (YAML filename) and `domain.data.id` (field), e.g. `index.astro:13` vs `content-queries.ts:89`. Nothing asserts that they are equal.

## Performance
- JS gzip is small. The largest chunks are search-box at 20.5 KB raw (MiniSearch, only on `/tim-kiem`) and ClientRouter at 16 KB raw. Progress-store is shared (2.4 KB).
- Images use astro:assets webp with width/height and `loading=lazy`.
- Fonts: Fontsource with `font-display: swap` and unicode-range subsets, no preload (acceptable).

## Recommended actions (in order)
1. H1: re-init the tab-bar, reader-top-bar and large-title-header scripts on `astro:page-load`, with teardown.
2. H2: tear down the scroll tracker on `astro:before-swap`, add the `isConnected` guard, and flush the throttle on `pagehide`.
3. H3: Caddy `not path /_astro/*` → `Cache-Control: no-cache`.
4. M1: fix the `readingMinutes` source of truth.
5. M2: close the fidelity bypasses (expressions, attributes, path-based domain, snapshot coverage).
6. M3 and M4: raise the search text cap; AND-first search with fuzzy guards and word-boundary highlight.
7. M5, M6, M8, M7, then the Low items.
8. Re-run a real-browser check of AC3 after fixes: `/` → Học tiếp → scroll → back to a not-yet-visited domain page → reload → Học tiếp.

## Metrics
- Type check: 0 errors / 0 warnings (astro check, 83 files).
- Tests: 174/174 pass. No coverage tool is configured, so coverage % is unknown. No test exercises the ClientRouter lifecycle.
- Lint: no linter configured.

## Unresolved questions
- H2 timing is traced from the router source but not reproduced in a browser. It needs one Playwright run of the exact path in action 8.
- Does Vibe Deploy / Railpack add HSTS or Cache-Control upstream of Caddy? If it does, H3's impact is smaller.
- Should fidelity forbid MDX expressions outright, or allowlist them? This is a product/content policy decision.

Status: DONE_WITH_CONCERNS
Summary: No critical issues. 3 High (ClientRouter one-shot scripts, scroll-overwrite race threatening AC3, Caddy HTML no-cache matcher missing clean URLs), 8 Medium (stale readingMinutes 47/50, verify-fidelity bypasses, search truncation/precision, missing h1 on finance lessons, saved-list focus and blank state, AC7 hardcoding, duplicated ring bootstrap). Tests 174/174 pass and astro check is clean.
Concerns/Blockers: H2 is traced from code but not reproduced in a browser. The QA evidence for AC1, AC3 and CLS is structural, not behavioural.
