---
phase: 5
title: "Phase 5 report: Progress bookmarks and search"
date: 2026-09-28
status: completed
---

# Phase 5 report: Progress, bookmarks and search

## Spike: Pagefind vs MiniSearch (decision — Option B, MiniSearch)

Built the real site (`pnpm exec astro build`, 50 lesson pages with
`data-pagefind-body`), ran `npx pagefind --site dist` (v1.5.2, indexed 50
pages/3850 words, no Vietnamese stemming per its own warning), then queried
the generated index with a real headless Chromium (Playwright, already
cached locally) loading `pagefind.js` in-browser (Node's own fetch-based
loader for the browser bundle doesn't work outside a server — confirmed,
see below).

| Query | Top 3 | Cache lesson in top 3? |
|---|---|---|
| `cache` | cache, nen-tang/caches, bai-tap/query-cache | ✅ |
| `bộ nhớ đệm` | nen-tang/caches, tai-chinh/tuan-03, **cache** | ✅ (rank 3) |
| `bo nho dem` | nen-tang/caches, tai-chinh/tuan-03, chu-de/load-balancer | ❌ **not in top 15 at all** |
| `cân bằng tải` / `can bang tai` | load-balancer top both | ✅ (accent-fold works for this pair) |
| `lãi kép` / `lai kep` | tai-chinh/tuan-03 top both | ✅ |

**Decision: Option B.** Pagefind's own diacritic folding is inconsistent —
it worked for `cân bằng tải`/`lãi kép` but the fully-unaccented `bo nho dem`
never surfaces the dedicated Cache lesson at all (checked all 15 results,
not just top 3) — a hard fail against the acceptance criterion. Built
`search-index.json` (title/headings/summary/text, `text` = MDX body
regex-stripped to plain text, capped 2500 chars/lesson) + MiniSearch 7.2.0
client-side, `processTerm` = lowercase → `đ/Đ→d/D` → NFD-normalize → strip
combining marks (`src/lib/search-normalize.ts`), applied identically at
index and query time (MiniSearch's own mechanism). `prefix: true, fuzzy:
0.2`, `boost: {title:4, headings:2, text:1}`.

**Real-data acceptance check** (ran a Node script directly against the
built `dist/search-index.json` + the real `src/lib/search-index.ts`, not a
synthetic fixture):

```
"cache"        -> top3: [chu-de/cache, nen-tang/caches, bai-tap/query-cache]        ✅
"bộ nhớ đệm"   -> top3: [chu-de/cache, tai-chinh/tuan-03, nen-tang/caches]          ✅
"bo nho dem"   -> top3: [chu-de/cache, tai-chinh/tuan-03, nen-tang/caches]          ✅ (identical to accented — proves folding)
"cân bằng tải" / "can bang tai" -> both: load-balancer, clones, tuan-07            ✅ identical
"lãi kép" / "lai kep"           -> both: tuan-03, bai-tap-va-thu-tu-tien-du, ...   ✅ identical
```

All 3 required queries return `kien-truc/chu-de/cache` in the top 3; the
accent/no-accent pairs return byte-identical result sets, proving the fold
is symmetric on real content, not just the synthetic fixture in
`tests/search-index.test.mjs`.

**Follow-up (not done — outside my file ownership):** `docs/system-architecture.md`
is on the "MUST NOT touch" list for this phase; the decision above needs
copying there by whoever owns `docs/`.

## Files created

**Store (test-first, per spec):**
- `src/lib/progress-state.ts` (58L) — `ProgressState`/`LessonProgress` types, `emptyState`, `migrate` (v1 passthrough, anything else → fresh state, drops malformed lesson/bookmark entries defensively).
- `src/lib/progress-scroll-throttle.ts` (46L) — leading+trailing ~1s-per-id throttle, factored out of the store for the 200-line rule.
- `src/lib/progress-store.ts` (202L) — `createProgressStore(options)` factory (storage/eventTarget/now all injectable → testable without jsdom) + `getProgressStore()` lazy browser singleton. `get/markDone/saveScroll/visit/toggleBookmark/isBookmarked/lastUnfinished/subscribe/isPersistent`. `visit(id)` is one addition beyond the spec's illustrative interface sketch (needed to record `visitedAt` for short lessons a reader never scrolls).
- `tests/progress-store.test.mjs` (19 tests) — markDone/undo, bookmark toggle, lastUnfinished (skips done, picks most-recent-visited), scroll throttle (fake timers), subscribe (immediate + on-change + cross-tab via a fake `storage`-event target), `migrate` edge cases, 3 private-mode-fallback scenarios (setItem throws, getItem throws, no storage at all — all `isPersistent:false`, zero crashes).

**Search:**
- `src/lib/search-normalize.ts` (18L) — `foldDiacritics`.
- `src/lib/search-mdx-to-text.ts` (52L) — MDX→plain-text stripper for the build-time index (drops `Figure`/`Disclaimer` whole, unwraps `RealLife`/`Note`/`TranslatorNote` keeping their prose, strips markdown syntax, truncates).
- `src/lib/search-index.ts` (76L) — `buildSearchIndex`/`searchLessons` (MiniSearch wrapper).
- `src/lib/search-highlight.ts` (57L) — maps MiniSearch's *folded* matched terms back onto the *original accented* summary text for `<mark>` highlighting, exploiting that `foldDiacritics` is length-preserving per character.
- `src/lib/search-index-client.ts` / `src/lib/lessons-index-client.ts` — memoized browser fetch wrappers for the two JSON endpoints.
- `src/lib/search-box-controller.ts` (141L) — DOM wiring split out of `search-box.astro` (was 306L combined, over the 200-line rule).
- `src/pages/lessons-index.json.ts`, `src/pages/search-index.json.ts` — static build-time endpoints.
- `tests/search-normalize.test.mjs`, `tests/search-mdx-to-text.test.mjs`, `tests/search-index.test.mjs`, `tests/search-highlight.test.mjs`, `tests/search-box-controller.test.mjs` — 174 tests total across the whole phase (see below); `search-index.test.mjs` encodes the acceptance criterion as a fixture-based regression test independent of the real-data check above.

**Misc lib:**
- `src/lib/progress-ring-apply.ts` (60L) + `tests/progress-ring-apply.test.mjs` — pure-ish ring-DOM-update (percent/fraction/stroke-dashoffset math), tested against a hand-built fake element (no jsdom).
- `src/lib/ios-hint.ts`, `src/lib/request-persistent-storage.ts`.

**Islands** (`src/components/islands/`): `mark-complete-button.astro`, `bookmark-button.astro`, `progress-ring.astro` (shared presentational ring, `showFraction` variant), `continue-reading-card.astro`, `saved-list.astro`, `search-box.astro`, `reader-progress-tracker.astro` (script-only: visit + scroll save/resume).

## Files modified

- `src/components/domain/lesson-row.astro` — checkmark icon + visually-hidden "Đã hoàn thành" text in `.lesson-status-slot`, `data-done` toggle; **inline bootstrap `<script>`** decorating every row on the page (see "Ownership-driven architecture note" below).
- `src/components/domain/domain-card.astro` — `.progress-ring-slot` now renders `<ProgressRing>`; own bootstrap `<script>`.
- `src/components/domain/domain-hero.astro` — added a `<ProgressRing showFraction>` row; derives `domainId` from `Astro.url.pathname` (see note below) rather than a new prop; own bootstrap `<script>`.
- `src/pages/hoc/[domain]/[module]/[slug].astro` — `<BookmarkButton slot="top-actions">`, `<ReaderProgressTracker>`, `<MarkCompleteButton>` inside the existing slots.
- `src/pages/index.astro`, `src/pages/da-luu.astro`, `src/pages/tim-kiem.astro` — swapped placeholder markup for `<ContinueReadingCard>`/`<SavedList>`/`<SearchBox>`.
- `src/layouts/app-layout.astro` — iOS "Thêm vào màn hình chính" one-time banner (dismissal stored separately from `progress-store.ts`, since it's UI chrome not progress), `navigator.storage.persist()` call, and a private-mode `isPersistent` warning banner (see "requirement I'd initially missed" below).
- `src/layouts/reader-layout.astro` — `storage.persist()` call only (no banner — full-bleed reading, no room; the tab-page banner already covers every session since every read starts from a tab page).
- `package.json`/`pnpm-lock.yaml` — added `minisearch@7.2.0` (only dependency added).

## Ownership-driven architecture note (read before reviewing the ring/checkmark code)

The phase-05 spec's "Related Code Files" section only grants
`src/pages/{index,da-luu,tim-kiem}.astro` and
`src/pages/hoc/[domain]/[module]/[slug].astro` — **not**
`src/pages/linh-vuc/index.astro` or `src/pages/linh-vuc/[domain]/index.astro`,
even though `domain-card`/`domain-hero`/`lesson-row` (which I *am* granted,
"only to place islands in slots") render exclusively on those two pages.
Originally built page-level "decorator" islands
(`domain-progress-decorator.astro`, `lesson-status-decorator.astro`) meant
to be `import`ed into those pages — then realized I have no file I'm allowed
to import them from. Fixed by **inlining a small bootstrap `<script>`
directly into `domain-card.astro`/`domain-hero.astro`/`lesson-row.astro`**
themselves (each does `document.querySelectorAll(...)` for its own class,
so it decorates every instance on the page from one script execution —
Astro hoists/dedupes identical component `<script>` content once per page
regardless of instance count). The actual math/DOM-update logic still lives
in `src/lib/progress-ring-apply.ts` (unit tested); only the ~25-line
fetch+subscribe bootstrap is duplicated between `domain-card.astro` and
`domain-hero.astro` (never render on the same page, so no real waste).
`domain-hero.astro` derives `domainId` from `Astro.url.pathname` instead of
a new prop, since adding a required prop would need editing its caller page
(`linh-vuc/[domain]/index.astro`, not owned).

## Requirement I'd initially missed, caught before finishing

Requirement #5 ("Private mode: app must not crash; show a subtle note that
progress saving is off") — I'd built the `isPersistent` flag but never
surfaced it in any UI. Added `.storage-warning` to `app-layout.astro`,
toggled by `getProgressStore().isPersistent`. Verified with a real
Playwright test that stubs `window.localStorage` to throw on every call
(simulating Safari private mode) — see e2e section.

## Real bug found via e2e (not caught by unit tests or code review)

`[hidden]` (the native HTML attribute, which the DOM `.hidden = true/false`
property maps to) and an *unconditional* `display: flex` in my own scoped
CSS have equal specificity (0,1,0 each); per the CSS cascade, author styles
win specificity ties over the UA stylesheet — so `.mcb-toast { display:
flex }` silently defeated `toast.hidden = true`. Found empirically: a
Playwright check of `/da-luu` after bookmarking showed the empty-state
message still visible even though the saved-rows list had correctly
rendered. Same bug existed in `search-box.astro` (`.search-status`,
`.search-results`), `continue-reading-card.astro` (`.crc-card`),
`saved-list.astro` (`.empty-state`), and `app-layout.astro` (`.ios-hint`) —
anywhere I toggled `.hidden` on an element that also had a non-default
`display` value. Fixed with an explicit `.foo[hidden] { display: none; }`
override in each of those 5 files; re-verified all 5 with the same
real-browser checks afterward (see e2e section — all pass now).

## Tests

`pnpm test`: **174/174 pass** (10 files; 121 pre-existing Phase 1-4 tests
untouched + 53 new: 19 progress-store, 6 progress-ring-apply, 9
search-index, 4 search-normalize, 8 search-mdx-to-text, 6 search-highlight,
4 search-box-controller — note: total new is 53, bringing 121→174; store
tests inject fake `Storage`/event-target/`now()` objects per the task's
"don't add jsdom" instruction).

`pnpm check`: **0 errors, 0 warnings, 0 hints** (82 files).

`pnpm build`: **pass** (full pipeline incl. `verify-fidelity`), 58 pages +
2 new JSON endpoints (`/lessons-index.json`, `/search-index.json`).

## Inline-script / CSP scan

Scanned all 58 `dist/**/*.html` for `<script>` tags without `src=`: **0
found** — every island script ships external (same `assetsInlineLimit: 0`
contract as Phase 2/4). Did not touch `Caddyfile` (MiniSearch needs no
`wasm-unsafe-eval`) or `astro.config.mjs` (no Pagefind/search integration
added, per the spike decision).

## JS budget (gzip, per page type — measured from real `dist/` output)

| Page type | Scripts | Gzip total |
|---|---|---|
| Home (`/`) | 7 | 7.16 KB |
| Domain list (`/linh-vuc`) | 6 | 6.65 KB |
| Domain detail (`/linh-vuc/kien-truc`) | 7 | 6.97 KB |
| Lesson (`/hoc/kien-truc/chu-de/cache`) | 7 | 7.16 KB |
| Search (`/tim-kiem`) | 6 | **13.00 KB** (includes MiniSearch, bundled into `search-box`'s own chunk) |
| Saved (`/da-luu`) | 6 | 6.86 KB |

All well under the 30 KB/page budget; `ClientRouter` (5.5KB gzip, shared
across every page, same as Phase 2) dominates the non-search pages.

**Data payloads** (fetched separately, not counted as "script", lazy —
`search-index.json` is only fetched on the user's first real keystroke, not
on page load): `lessons-index.json` 12.2KB raw / 2.2KB gzip;
`search-index.json` 170.4KB raw / **45.2KB gzip** for 50 lessons (~0.9KB
gzip/lesson) — larger than I'd like; if this needs to shrink further,
lowering `mdxToPlainText`'s 2500-char cap is the lever (not done — the real
search-acceptance numbers above already pass at the current cap, and it's
fetched lazily+once, cached across in-app navigation).

## End-to-end evidence (Playwright, headless Chromium, against `astro preview` of the real `dist/`)

**Required check** (open lesson → complete → domain page shows ✓+% →
reload persists):
```
pressedAfterClick: "true"     toastVisible: true
rowDone: "true"                statusText: "Đã hoàn thành"
ringLabel: "Đã hoàn thành 1 trên 27 bài — 4 phần trăm"   ringPercentText: "4%"
rowDoneAfterReload: "true"     (after a real page reload — localStorage round-trip confirmed)
crcEmptyVisible: true          (home's continue-reading card correctly shows empty state:
                                 the only visited lesson is now done, lastUnfinished()==null)
consoleErrors: []
```

**Additional coverage** (bookmark → saved-list → remove; search UI end to
end; undo toast; scroll resume across a real client-router soft
navigation; domain-hero ring; private-mode fallback):
```
bookmark:  savedTitle="Bộ cân bằng tải (Load Balancer)", savedEmptyHidden=true,
           emptyVisibleAfterRemove=true (after clicking the remove button)
search UI: resultCount=20, firstResult="Bộ nhớ đệm (Cache)" for "bo nho dem",
           hasMarkCount=45 (<mark> highlights actually rendered)
undo:      doneAfterUndo="false", toastHiddenAfterUndo=true
scroll:    scrollRatioBeforeNav=0.5136..., scrollRatioAfterReturn=0.5136...
           (soft-nav away via back button + a lesson-row click, then back —
           exact match, proves astro:page-load re-init + rAF resume works
           across View Transitions, not just full reload)
hero ring: "Đã hoàn thành 1 trên 27 bài — 4 phần trăm", fraction "1/27 bài"
private mode: warningVisible=true, doneInMemory="true" (mark-complete still
           works in-memory, zero console errors, with localStorage stubbed
           to throw on every call)
```
All console/page error arrays were empty across every check.

## Deviations / notes

1. `visit(id)` added to the store beyond the spec's illustrative interface
   sketch — needed so `lastUnfinished()` works for lessons short enough a
   reader never scrolls (`saveScroll` alone wouldn't stamp `visitedAt`).
2. `docs/system-architecture.md` not updated with the spike decision — on
   this phase's "MUST NOT touch" list; numbers/decision are above for
   whoever owns `docs/` to copy in.
3. Page-level decorator islands weren't possible for the domain-progress
   ring / lesson checkmarks — see "Ownership-driven architecture note"
   above; logic still centralized in `src/lib/progress-ring-apply.ts`, only
   the bootstrap wiring is duplicated (2 copies, ~25 lines each).
4. `search-index.json` gzip (45.2KB) is the one number I'm not fully happy
   with size-wise; flagging rather than guessing at a truncation-length
   tradeoff the controller/user hasn't weighed in on.
5. Did not touch `Caddyfile` or `astro.config.mjs` at all (spike concluded
   MiniSearch, not Pagefind — neither grant was needed).

## Unresolved questions

- Should `search-index.json`'s per-lesson text cap (currently 2500 chars)
  be reduced to shrink the 45.2KB gzip payload? Current cap already passes
  every acceptance query on real data — no functional reason to change it,
  purely a size/thoroughness tradeoff.
- Who copies the Pagefind-vs-MiniSearch decision into
  `docs/system-architecture.md` (outside my file ownership this phase)?

Status: DONE
Summary: Spike (real Pagefind build + headless-browser query, not just docs) proved Pagefind fails "bo nho dem" on real content (target lesson absent from top 15, not just low-ranked) → built search-index.json + MiniSearch with a length-preserving diacritic-fold processTerm, verified against the real 50-lesson dist output (not just a fixture) that cache/bộ nhớ đệm/bo nho dem all return the Cache lesson top-3. Store (progress-store.ts, test-first, 19 tests, storage/event-target/now all injected — no jsdom) + 6 islands (mark-complete w/ undo toast, bookmark, lesson-status checkmark, domain progress ring incl. domain-hero, continue-reading w/ scroll-ratio resume across real soft-navigation, saved-list, search-box w/ highlighted snippets) wired into the reader/home/saved/search pages within strict file ownership — hit and worked around a real ownership gap (linh-vuc pages not granted) by inlining bootstrap scripts into the three domain components I do own instead. Found and fixed a real cross-component CSS bug ([hidden] vs unconditional display) via actual Playwright e2e testing, not code review. pnpm test 174/174, check 0/0/0, build passes (58 pages + 2 endpoints), 0 inline scripts, all pages 7-13KB gzip JS (budget 30KB). Private-mode fallback verified in a real browser with localStorage stubbed to throw — no crash, warning shown, in-memory writes still work.
Concerns/Blockers: none blocking. docs/system-architecture.md spike write-up and the search-index.json size tradeoff are flagged above for controller/docs-owner follow-up, not requesting a decision before Phase 6/7 proceed.
