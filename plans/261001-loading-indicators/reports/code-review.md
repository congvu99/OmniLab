# Code Review: loading indicators (nav progress bar + island skeletons)

Date: 2026-10-01 · Scope: uncommitted diff on `main` (8 modified + 1 new file) · Plan: `plans/261001-loading-indicators/plan.md`

## Scope
- Files: `src/components/shell/navigation-progress-bar.astro` (new), `src/layouts/{app,reader}-layout.astro`, `src/components/islands/{continue-reading-card,saved-list,progress-ring}.astro`, `src/lib/saved-list-controller.ts`, `src/styles/base.css`, `tests/saved-list-controller.test.mjs`
- Verified against Astro runtime: `node_modules/astro/dist/transitions/router.js`, `events.js`
- Built output checked: nav-progress script emitted as external `/_astro/navigation-progress-bar...js` (CSP `script-src 'self'` OK, `inlineStylesheets: 'never'` + no-inline-scripts config honored)

## Overall
Saved-list + CRC skeleton logic is correct on all render exits. Nav bar handles the common cases (fast nav, hash links, superseded nav, back/forward). Two real defects: ring fetch-error path renders a **100%** ring, and the nav bar can get stuck after an offline fallback + back (bfcache). Plan's stated safety net (`astro:page-load` reset) was never implemented.

## High

### H1. Ring fetch-error path shows a FULL (100%) ring, labelled "Chưa bắt đầu"
`src/components/islands/progress-ring.astro:135-139`
On fetch failure the code removes `data-loading`, which un-hides the fill circle (`:84`). The fill has no `stroke-dasharray` until `applyProgressRing` runs (never, on error) → SVG draws a complete stroke = visually 100% done. The comment says "Degrade to the empty 0% ring (track only)" — false. Sighted users see "100%" while AT hears "Chưa bắt đầu". Pre-change code had the same visual, but this change explicitly claims to fix it and reintroduces it on the error path.
Fix (also fixes M2): server-render the empty state on the fill circle:
```astro
const circumference = 2 * Math.PI * radius;
<circle ... stroke-dasharray={circumference} stroke-dashoffset={circumference} data-progress-ring-fill />
```
Script's inline `style.strokeDash*` overrides presentation attributes, so `applyProgressRing` is unaffected. Then `data-loading` only needs to drive the pulse (fill hiding becomes unnecessary).

### H2. Nav bar stuck at ~90% after offline nav + Back (bfcache restore)
`src/components/shell/navigation-progress-bar.astro:128-131`
Offline/failed fetch: `fetchHTML` catches → returns `null` → `preventDefault()` → `location.href = to.href` (router.js:59-63, 250-254). Browser shows its offline error page; Back restores the original page from bfcache (Astro registers no unload handler, so it's eligible) with `is-visible` set and `trickleTimer` resumed → bar sits at ~90% until the next soft nav. Comment "tears this page (and the bar) down anyway — no extra error path needed" is wrong for bfcache. Mobile/offline is the exact scenario where this triggers.
Fix:
```ts
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  clearTimers();
  const bar = getBar();
  if (bar) reset(bar);
});
```

## Medium

### M1. Plan's safety net not implemented: no `astro:page-load` reset
Plan Risks: "không treo vì timer reset ở `astro:page-load`". Code only listens to `before-preparation`/`after-swap`. Real gap: if `event.swap()`/`moveToLocation` throws inside `updateDOM`, Astro logs and continues (router.js:362-367) — `after-swap` never fires, but `onPageLoad()` still runs via `updateCallbackDone.finally` (router.js:349-353). Add `document.addEventListener('astro:page-load', finish)` (idempotent: `finish()` with `!shown` just resets; with `shown` it's a no-op re-finish since timers are cleared first — or guard with a flag). Cheap belt-and-braces matching the plan.

### M2. Ring still "sweeps" from 100% → actual on successful load
`progress-ring.astro:78, 146-151`. `.progress-ring-svg circle` has `transition: stroke-dashoffset`. On reveal, computed offset goes 0 → C·(1-ratio) with dasharray C → the fill animates from a full ring down to the real value over `--dur` (250ms), and `data-loading` is removed in the same task so the fill is visible during the sweep. For a 0% user this is a full ring collapsing to nothing — the "renders as 100%" artifact the change targets, now animated. Same fix as H1 (server-render dasharray/offset = C so the transition starts from 0%).

### M3. View-transition snapshot: bar slides with the page
Bar lives in the `root` snapshot (no `view-transition-name`), and `finish()` runs inside the VT update callback (router.js:208). With `view-transitions.css` slide, the old snapshot's ~90% bar slides out left while the new page's bar (running its 100%+fade) slides in from the right — a "fixed" chrome bar visibly moving horizontally. Not stuck, but looks broken on every slow nav in VT browsers. Fix: `view-transition-name: nav-progress;` on `.nav-progress` (own group, stays put; default cross-fade), optionally `::view-transition-group(nav-progress){animation:none}` scoped via `:global`.

### M4. Superseded nav can suppress the newer nav's bar
`navigation-progress-bar.astro:115-126`. Sequence: nav A is mid-swap (inside VT callback) → user taps B → B's `before-preparation` → `start()` arms B's `showTimer` → A's `after-swap` fires → `finish()` `clearTimers()` kills B's timer (`shown` false → reset). If B is slow, no bar at all. Not stuck (fails safe), but loses feedback exactly on fast double-taps. Fix: listen to `astro:before-swap` and record `e.signal.aborted`; ignore the subsequent `after-swap` when the swap belonged to an aborted navigation.

### M5. Skeleton shows on hard load even with zero bookmarks; comment is false
`src/components/islands/saved-list.astro:12-15` says "No bookmarks → controller swaps to the empty state synchronously, so the skeleton never shows for that case." On a hard load Astro fires the first `astro:page-load` on `window` `load` (router.js:414), i.e. after images/fonts — skeleton paints until then, then flips to empty. New users (most common case) now see skeleton→empty where they previously saw the correct empty state immediately. Acceptable trade-off, but fix the comment; optionally same note for CRC (`continue-reading-card.astro:10-13`) — CRC could also short-circuit to `showEmpty()` before the fetch when the store has no lesson progress at all (no index needed to know "nothing in progress").

## Low

- L1. No-JS / script-load failure: skeletons pulse forever and ring label stays "Đang tải tiến độ" (`progress-ring.astro:37`); previously degraded to empty/"Chưa bắt đầu". Static site, JS-off is an edge, but a `<noscript><style>` hiding `[data-crc-loading],[data-saved-loading]` and un-hiding empties would restore the old degradation. Product call.
- L2. `.crc-skeleton` reuses `.crc-card` (`continue-reading-card.astro:14`) → inherits `.crc-card:hover` focus-ring-like box-shadow on a non-interactive element. Add `.crc-skeleton:hover { box-shadow: var(--shadow-card); }` or split shared box styles.
- L3. Reduced-motion block `transition: opacity var(--dur-fast) linear` (`navigation-progress-bar.astro:52`) is dead: the global `*{transition-duration:0.01ms !important}` (`base.css` reduced-motion block) wins. Fade is instant under reduce. Harmless (meets "no continuous animation"); drop or comment. The `transform: none !important` correctly beats JS inline `scaleX()` (author `!important` > inline normal) — verified OK. Trickle interval still runs under reduce (no visual effect); fine.
- L4. `.skeleton[hidden]` (`base.css:175`) unused — no `.skeleton` element ever toggled; only parents are hidden. YAGNI.
- L5. Ring error path ignores `cancelled` (`progress-ring.astro:135`) — mutates detached nodes after a nav. Harmless; for consistency `if (cancelled) return;` first.
- L6. Plan drift: plan specifies `aria-busy` on CRC skeleton and ring; implementation uses sr-only text + `aria-label` swap instead. Neither is wrong; update plan to match.
- L7. Tests: no case for "bookmarks present but all ids missing → skeleton hidden + empty", nor removal-to-empty with skeleton present. Paths are covered by code inspection (`showEmpty()` → `settle()`), add for regression safety.

## Checklist answers
(a) Acceptance
- Fast nav (<150ms): `finish()` with `!shown` → reset, timer cleared. OK.
- Same-page hash: router returns before `doPreparation` (router.js:232-238) → no event. OK.
- Back/forward: traverse goes through `transition()` → events fire. OK. bfcache restore: see H2.
- Superseded nav: start() resets; aborted nav never fires after-swap except the mid-swap case (M4).
- Aborted/failed → full reload: OK when page unloads; stuck on bfcache back (H2). Swap exception: stuck (M1).
- Persist across app↔reader: both layouts render same component (same cid, same persist id) → node moved. OK.
- VT snapshot: M3.
- Skeleton exits: CRC — all 3 `showEmpty()` paths + card branch call `settle()`; early `return` at `:149` only on broken markup. Saved-list — no bookmarks, fetch error, all-missing, rows: all settle. Ring — success OK, error path H1, cancelled → detached nodes (fine).
(b) Regressions: saved-list focus-after-removal unchanged (empty state unhidden before `emptyState.focus()`); CRC subscription unchanged; ring cancellation unchanged; layouts only add the component. None found.
(c) Contracts: `SavedListElements.loadingState?` optional, back-compat OK. Ring initial aria-label change OK on success/error; stuck on no-JS (L1).
(d) Patterns: `[hidden]` overrides present for `.crc-skeleton`, `.saved-skeleton`, existing `.empty-state`/`.crc-card`; `.crc-empty` has no `display` so native `[hidden]` works. Nav bar's module-level listeners correctly don't use `onPageLoad` (document-level, register once) and re-query the node each event — consistent with `page-lifecycle.ts` notes.
(e) Scoped CSS + global keyframes: Astro doesn't rename `@keyframes`; scoped `animation: ol-skeleton-pulse` resolves to base.css (loaded by both layouts via base-head). Scoped `.crc-skeleton__track` radius beats global `.skeleton` (higher specificity with cid attr). Reduced motion: see L3.

## Recommended actions (priority)
1. H1+M2: server-render `stroke-dasharray`/`stroke-dashoffset` = circumference on the ring fill.
2. H2: `pageshow` (persisted) reset in nav bar; fix comment at `:128-129`.
3. M1: add `astro:page-load` → `finish` fallback (matches plan).
4. M3: `view-transition-name` on the bar.
5. M4: ignore after-swap of aborted navigations.
6. M5/L-items: comment fix, optional CRC fast-path, tests.

## Unresolved questions
- Is no-JS degradation (L1) in scope for this static site?
- Accept skeleton→empty on hard load for new users (M5), or add the store-empty fast-path?

Status: DONE_WITH_CONCERNS
