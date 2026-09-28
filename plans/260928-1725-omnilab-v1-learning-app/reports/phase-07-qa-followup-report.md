---
title: Phase 7 QA Follow-up Report - OmniLab v1
date: 2026-09-28
status: DONE_WITH_CONCERNS
---

# Phase 7 QA Follow-up Report — OmniLab v1

Completes the items the original phase-07 QA pass skipped (see
`reports/phase-07-qa-report.md`, "Issues Found & Resolution" #2 and the
"Concerns/Blockers" line in `reports/fact-check-kien-truc-*.md`: SVGs were
**never rendered in a real browser**, axe-core was never actually run
because of the CSP, and the horizontal-overflow check only covered 6 of 58
pages). All evidence below is from real Playwright/Chromium runs against the
production build (`pnpm build` → `dist/`), served by a throwaway Node static
server in the scratchpad that replicates the Caddyfile exactly (see
"Method" under item 3).

Scratchpad (scripts, not committed):
`C:\Users\ADMINI~1\AppData\Local\Temp\claude\d--project-OmniLab\b40b8c15-b124-46d1-8ea1-d1f0470e4fa7\scratchpad\qa2\`
(`server.mjs`, `svg-audit.mjs`, `contact-sheets.mjs`, `axe-audit.mjs`, `e2e.mjs`, `overflow-check.mjs`).

## 0. Test server

`server.mjs` serves `dist/` with clean-URL resolution (`{path}`, `{path}.html`,
`{path}/index.html`, mirroring Caddy's `try_files`) and 404 → `404.html`.
Two instances:
- port 4173, **with** the exact CSP header string copied from `Caddyfile`
  line 57 (`default-src 'self'; img-src 'self' data:; style-src 'self'
  'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self';
  object-src 'none'; base-uri 'self'; frame-ancestors 'none';`) — used for
  the SVG pass, CSP-violation collection, and all e2e/overflow checks.
- port 4174, **without** CSP — used only for axe-core, because
  `page.addScriptTag()` to inject `axe.min.js` is itself blocked by
  `script-src 'self'` with no hash/nonce for injected scripts. This is
  documented here, not a workaround of the real CSP: production still gets
  the CSP header from `Caddyfile`, and the CSP-compliance runtime check
  (item 3) runs against the *other*, CSP-enabled instance.
Verified via `curl -D -`: 4173 returns the header verbatim; 4174 does not;
both resolve `/linh-vuc/kien-truc` → 200 and `/no-such-page` → 404 (`404.html`).

## 1. SVG visual pass — 78 SVGs × 2 color schemes = 156 instances

**Method:** `svg-audit.mjs` — Playwright, viewport 375×812, deviceScaleFactor
2, `colorScheme: 'light'|'dark'`, navigated to all 50 lesson pages (every
lesson with ≥1 `<Figure added svg=...>`), for every `.figure__svg svg`:
`getBBox()` on every `<text>`/`<tspan>` checked against the SVG's `viewBox`
(1-unit tolerance); pairwise overlap of non-nested text boxes (intersection
area > 20% of the smaller box — ancestor/descendant pairs, i.e. a `<text>`
vs. its own `<tspan>` children, are excluded, see comment in the script);
contrast of computed `fill` vs. the nearest opaque ancestor background
(`.figure__svg`'s `var(--surface-2)`) via WCAG relative-luminance, flagged
`< 3:1`. Element-screenshotted every SVG in both schemes into
`svg-shots/<scheme>_<domain>_<lessonSlug>_<idx>.png`, then generated one
HTML grid page per domain × scheme (`contact-sheets.mjs`) and screenshotted
it full-page.

**Raw numbers (first run, before fixes):** 156 instances audited, 28 flagged
— all "overlap" against parent/descendant pairs before the ancestor-exclusion
fix was added (false positives, fixed in the script itself, not the SVGs).
**Second run (fixed detector):** 2 flagged (same issue, light+dark) — the
only genuine one.

| File | Issue | Fix |
|---|---|---|
| `src/assets/illustrations/kien-truc/chu-de-cache-ttl-eviction.svg` | Heading "Hết chỗ — loại theo LRU" (bbox y 118.0–135.5) overlapped label "D vào, đẩy A ra" (bbox y 121.2–137.5) — intersection 54% of the smaller box, both schemes | Moved heading `y="132"` → `y="114"` (single coordinate, no text/meaning change); re-measured bbox gap = 3.7px clear |

**Final run (after fix):** 156 instances audited, **0 flagged**.

Also noted, not fixed (no evidenced defect, listed for completeness per the
style guide's "220 or 300" viewBox rule): 3 files use `viewBox` height 260 and
4 use `"0 -20 360 300"` (y-offset -20) instead of the guide's 220/300 —
`chu-de-communication-rpc-vs-rest.svg`, `chu-de-communication-tcp-vs-udp-
delivery.svg`, `chu-de-security-ma-hoa-khi-truyen-vs-khi-luu.svg` (height
260); `chu-de-cache-cache-aside-vs-write-through.svg`, `chu-de-cache-ttl-
eviction.svg`, `chu-de-dns-tra-cuu-phan-cap.svg`, `chu-de-load-balancer-
layer4-vs-layer7.svg` (y-offset -20). None of these had a text/overlap/
contrast issue — this task's scope is "fix every flagged SVG"; these aren't
flagged, so left as-is (changing viewBox width/height with no evidenced
layout bug would be a cosmetic, unrequested edit against a passing file).

**Evidence:**
- `reports/qa/svg-audit-results.json` (all 156 instances, full bbox/issue detail, 59.9 KB)
- `reports/qa/svg-contact-kien-truc-light.png` (408.8 KB, 51 instances)
- `reports/qa/svg-contact-kien-truc-dark.png` (413.5 KB, 51 instances)
- `reports/qa/svg-contact-tai-chinh-light.png` (171.0 KB, 27 instances)
- `reports/qa/svg-contact-tai-chinh-dark.png` (175.5 KB, 27 instances)

**Result: PASS** (0/156 flagged after the one real fix).

## 2. axe-core — 9 pages × 2 schemes = 18 runs

**Method:** `axe-audit.mjs` against the no-CSP server (4174, see item 0),
`page.addScriptTag({ path: require.resolve('axe-core') })` (axe-core
installed via `npm install` into the scratchpad only, not the repo),
`window.axe.run(document, { resultTypes: ['violations'] })`. Pages: `/`,
`/linh-vuc`, `/linh-vuc/kien-truc`, `/linh-vuc/tai-chinh`,
`/hoc/kien-truc/chu-de/database`, `/hoc/tai-chinh/lo-trinh-12-tuan/tuan-04`
(the week-4 slug — found via `find dist -name index.html`, listed in
`all-pages.txt`), `/tim-kiem`, `/da-luu`, `/gioi-thieu`. Light + dark via
`colorScheme` context option.

**Raw numbers (first run):** 20 violations (1 per page × 18, +1 extra on
`/hoc/kien-truc/chu-de/database` for landmark-unique) across 4 distinct
rules: `region` (all 9×2=18 pages — one `<h1>` not contained by a landmark),
`heading-order` (database page), `landmark-unique` (database page, 3 tables
same aria-label), `page-has-heading-one` (tuan-04, no `<h1>` at all).

| Rule | Root cause | Fix |
|---|---|---|
| `region` | `large-title-header.astro`'s `<h1>` lived in a `<div class="lth-block">` sibling *after* (not inside) the `<header class="lth-navbar">`, so it wasn't in any landmark | Wrapped both the sticky nav bar and the title block in one outer `<header>` (the former inner `<header>` became a plain `<div>` — HTML forbids header-in-header); sticky positioning is unaffected since `position: sticky` doesn't require the `<header>` tag |
| `landmark-unique` | `rehype-wrap-tables.mjs` gave every `.table-wrap` region the identical `aria-label="Bảng (cuộn ngang)"`; the database lesson has 3 tables | Per-file counter: 2nd+ table on a page gets `"Bảng (cuộn ngang) 2"`, `"... 3"`, etc.; single-table pages unchanged. Regression test added: `tests/rehype-wrap-tables.test.mjs` |
| `page-has-heading-one` | All 23 finance lessons open at `##`/`###` (never `#`) — confirmed via `grep '^#' src/content/lessons/tai-chinh/**` — so `reader-layout.astro`'s contract ("first `<h1>` in `#reader-content` is the article's own title", per `reader-top-bar.astro`'s own header comment) silently broke for the whole domain | `reader-layout.astro` now always renders a sr-only `<h1>{title}</h1>` (using `lesson.data.title`, already passed as the `title` prop) right before `<slot/>`. Lesson text itself was **not** touched (out of file-ownership scope; content is fidelity-locked) |
| `heading-order` (tuan-04, introduced by the h1 fix above) | Injecting a bare `<h1>` before content that opens at `###` created a new h1→h3 (2-level) skip | Also render a sr-only `<h2>Nội dung bài</h2>` right after the fallback `<h1>`, so the sequence becomes h1→h2→h3 (no skip) regardless of whether the lesson's first real heading is h2 or h3. Both fallback headings are hidden (`display:none`, removed from the a11y tree too) via `.reader-content:has(.lesson-article h1)` whenever a lesson already supplies its own `<h1>` (i.e. every non-finance lesson) — verified no visible/duplicate-announced text via screenshot + `getComputedStyle` (1×1px `clip: rect(0,0,0,0)` box) |
| `heading-order` (database page) | `06-database.mdx` line 343 `### SQL hay NoSQL` (h3) is directly followed at line 389 by `##### Nguồn và đọc thêm: SQL hay NoSQL` (h5) — skips h4. This is a pre-existing authoring inconsistency in the lesson's own heading levels | **Not fixed** — `src/content/lessons/**` is out of file-ownership scope ("lesson text is fidelity-locked"). Documented here; the correct content fix is `#####` → `####` at that one line, for a future content-owning phase |

**Final numbers:** 4 violations remaining (2 rules × light/dark), both on
`/hoc/kien-truc/chu-de/database`, both the same `heading-order` content
issue above — everything else is 0/18 × 0 rules.

**Evidence:** `reports/qa/axe-results.json` (all 18 runs, full violation detail incl. node targets/failure summaries, 2.5 KB after fixes).

**Result: PASS WITH ONE KNOWN, UNFIXABLE-IN-SCOPE CONTENT ISSUE** (see Concerns).

## 3. CSP runtime — 0 violations required

**Method:** on the CSP server (4173, real header), `page.addInitScript()`
registers a `document.addEventListener('securitypolicyviolation', ...)`
listener that pushes every event into `window.__cspViolations`, plus a
`page.on('console')` listener for any "Content Security Policy" console
errors, collected after every step of the full e2e flow (item 4).

**Raw numbers:** 0 `securitypolicyviolation` events, 0 matching console
errors, across all 22 e2e checks (tab nav, mark-complete, bookmark,
continue-reading, 5 search queries, reduced-motion, back-nav, 404, wide
table).

**Evidence:** `reports/qa/csp-violations.json` (empty array, 2 bytes).

**Result: PASS** (0/0).

## 4. E2E flows (CSP server) — 22 checks

**Method:** `e2e.mjs`, single Playwright session, CSP server, 375×812,
`localStorage.clear()` before starting.

| # | Flow | Result | Evidence |
|---|---|---|---|
| 1 | Tab bar `aria-current="page"` on all 4 tabs (/, /linh-vuc, /tim-kiem, /da-luu), exactly one active at a time | PASS ×4 | per-tab link states |
| 2 | Mark lesson complete → `[data-mcb]` `data-done="true"` | PASS | |
| 3 | Domain page (`/linh-vuc/kien-truc`) row gets `data-done="true"` + checkmark | PASS | |
| 4 | Domain hero % ring updates (non-zero, `aria-label` reflects count) | PASS | `"4%"`, `"Đã hoàn thành 1 trên 27 bài — 4 phần trăm"` |
| 5 | Reload → mark-complete persists | PASS | |
| 6 | Bookmark button toggles `aria-pressed` | PASS | |
| 7 | Bookmarked lesson appears in `/da-luu` | PASS | `["Cơ sở dữ liệu (Database)"]` |
| 8 | Remove bookmark → row gone, empty state shown | PASS | |
| 9 | "Học tiếp" card on `/` shows last unfinished **visited** lesson (not the completed one) | PASS | title = "Bộ nhớ đệm (Cache)" |
| 10–14 | Search "cache", "bộ nhớ đệm", "bo nho dem", "can bang tai", "lai kep" → expected lesson in top 3 | PASS ×5 | see `reports/qa/e2e-flows-report.json` for full top-3 lists |
| 15 | `prefers-reduced-motion: no-preference` → slide animation present (sanity check) | PASS | `oldAnim: "ol-slide-out-left"`, `newAnim: "ol-slide-in-right"` |
| 16 | `prefers-reduced-motion: reduce` → **no** slide animation | PASS | `oldAnim: "none"`, `newAnim: "none"` — checked via `document.startViewTransition()` + `getComputedStyle(html, '::view-transition-old(root)')` in a real transition, not static CSS reasoning |
| 17 | Back navigation restores scroll position | PASS | scrollBefore 500 → scrollAfter 459 (within the 50px tolerance; small delta is layout/content differences between the two page loads, not a restoration failure — see Method note below) |
| 18 | Unknown URL → 404 page, HTTP 404 | PASS | title "Không tìm thấy trang - OmniLab" |
| 19 | Wide table in `/hoc/kien-truc/chu-de/database` scrolls inside `.table-wrap`, no page-level horizontal overflow at 375px | PASS | `wrapOverflows: true` (internal scroll present, correct), `pageOverflow: 0` |

**Method note (#17):** the first attempt used
`waitForLoadState('networkidle')` after the click and failed
(`scrollAfter: 0`); a throwaway debug script showed the click's target URL
hadn't actually changed yet when `networkidle` resolved (Astro's
`ClientRouter` does an in-place fetch+DOM-swap, not a real document reload,
and `scrollend`-driven `history.replaceState` — see
`node_modules/astro/dist/transitions/router.js` — needs the scroll to
settle first). Switched to `page.waitForURL()`; re-verified manually that
`history.state.scrollY` correctly held `500` before navigating and `459`
after `goBack()`. This was a **test-script bug, not a product bug** —
documented instead of silently "fixed" by loosening the tolerance.

**Total: 22/22 PASS, 0 CSP violations. Evidence:** `reports/qa/e2e-flows-report.json`.

## 5. Horizontal overflow at 375px — all 58 built pages

**Method:** `overflow-check.mjs`, every page from `all-pages.txt` (57, via
`find dist -name index.html`) + `/404` = 58, `document.scrollingElement.
{scrollWidth,clientWidth}` at 375×812.

**Raw numbers (first run):** 54/58 pass, 4 fail:
`/hoc/kien-truc/bai-tap/{pastebin,query-cache,scaling-aws,social-graph}`
(scrollWidth 394–427 vs. clientWidth 375).

**Root cause:** all 4 are exercise ("bài tập") lessons whose attribution
link text is the literal source-repo path, e.g. `solutions/system_design/
pastebin/README.md` — one long slash-separated token with no space to break
on. Isolated the exact offending element with a script that walks
`.lesson-article`'s descendants, skips anything inside an `overflow:auto/
hidden/scroll` ancestor (i.e. correctly-contained scrollable code blocks —
an earlier, cruder pass had false-flagged those `<pre>` blocks, whose own
`overflow-x:auto` scroll containment was actually working correctly, since
`html{overflow-x:hidden}` silently clips real overflow instead of showing a
scrollbar, which is why `document.scrollingElement.scrollWidth` — not a
visible scrollbar — is the correct signal here), and reports the max
`getBoundingClientRect().right`. All 4 converged on the same `<a>` with the
long path text.

**Fix:** `src/styles/prose.css` `.prose a` gained `overflow-wrap:
break-word` (global, all prose links — the long-word-only-when-needed
property, doesn't affect normal short link text).

**Final run:** 58/58 pass, 0 overflow.

**Evidence:** `reports/qa/overflow-375px-results.json` (all 58 pages, scrollWidth/clientWidth/overflow, 8.2 KB).

**Result: PASS** (58/58).

## Files edited

| File | Change |
|---|---|
| `src/assets/illustrations/kien-truc/chu-de-cache-ttl-eviction.svg` | 1-line coordinate fix (heading `y` position) — item 1 |
| `src/components/shell/large-title-header.astro` | Wrapped nav bar + title block in one outer `<header>` landmark — item 2 (`region`) |
| `src/layouts/reader-layout.astro` | Added sr-only fallback `<h1>`+`<h2>`, hidden via `:has()` when the lesson already has its own `<h1>` — item 2 (`page-has-heading-one`, `heading-order`) |
| `src/lib/rehype-wrap-tables.mjs` | Per-file counter → unique `aria-label` per table-wrap — item 2 (`landmark-unique`) |
| `src/styles/prose.css` | `.prose a { overflow-wrap: break-word }` — item 5 |
| `tests/rehype-wrap-tables.test.mjs` | New — regression tests for the unique-aria-label logic (4 tests) |

Not edited: `src/content/lessons/**` (untouched, per file ownership — the
one remaining `heading-order` violation lives there), `docs/**`, `README.md`,
`Caddyfile`, `package.json`.

## Quality gates (after all fixes)

- `pnpm test`: **PASS** — 11 test files, 178 tests (174 pre-existing + 4 new), all passed.
- `pnpm check`: **PASS** — 84 files, 0 errors, 0 warnings, 0 hints.
- `pnpm build`: **PASS** — 58 pages built in ~4s, no errors.

## Status: DONE_WITH_CONCERNS

**Summary:** all 5 QA items completed with real browser evidence (not
static reasoning). SVG pass: 156/156 instances clean after 1 real fix
(overlap in the cache TTL/eviction SVG). axe-core: 18 page×scheme runs, all
clean except 1 content-level heading-skip on the database lesson (can't fix
— lesson text locked). CSP: 0 violations across the full e2e flow. E2E: 22/22
pass. Overflow: 58/58 pages clean after 1 real fix (long unbreakable link
text). 4 production files + 1 new test file changed, all within the granted
file-ownership boundaries. Build/test/check all green.

**Concerns/Blockers:**
1. `src/content/lessons/kien-truc/chu-de/06-database.mdx` line 389
   (`##### Nguồn và đọc thêm: SQL hay NoSQL`) should be `####` (h4, not h5)
   to match its parent `### SQL hay NoSQL` (line 343) — a genuine
   `heading-order` a11y violation, but the file is fidelity-locked/out of
   this phase's file ownership. Flagging for a content-owning phase to make
   the 1-character fix.
2. The 3 SVGs with `viewBox` height 260 and 4 with a `"0 -20 360 300"`
   y-offset deviate from the style guide's "220 or 300" rule, but none had
   an actual measured defect (0 flagged issues) — left unchanged since
   "fix every flagged SVG" is the given scope, not "normalize every viewBox
   value regardless of whether it's broken." Worth a follow-up cosmetic pass
   if strict guide conformance matters for future SVG additions.
3. Lighthouse (Perf/A11y/BP/CLS) was already covered by the previous QA pass
   (`reports/qa/lighthouse-*.json`) and was explicitly out of scope for this
   follow-up (which targeted the *skipped* items only) — not re-run here.
