# Phase 3 report - review + fix (Studio restyle)

Scope: whole working-tree diff vs HEAD 477e2a4 (phases 1, 2a, 2b, 2c). Design kept as-is; only defects fixed. No commits. docs/README, MDX/SVG content untouched.

## Verification (final)
- `pnpm test`: 24 files / 432 tests pass (was 23/422; +1 palette regression test, +2 toast contrast asserts x2 themes, +new illustration-token-contract test).
- `pnpm check`: 0 errors / 0 warnings / 0 hints.
- `pnpm build`: fidelity OK (27+14+23), 73 pages built.
- Browser (agent-browser, `python -m http.server 4540 -d dist`, seeded `omnilab:v1:state`: 6 done, 1 reading, 3 bookmarks). Server on :4540 stopped after.
  - Overflow, all 73 pages x 320/390/768/1024/1279/1280/1440 (element-level + scrollWidth): 0 after fix (1 defect found at 320, see H2).
  - axe 4.14 on reader + tab pages, light/dark x 390/1440 (48 runs) + all 73 pages light/1440 + dark/390: only pre-existing content issues remain (see "Not fixed").
  - Palette open (dark/light): axe 0 violations. Ctrl+K opens once, Esc closes, typed query + Enter navigates (soft nav).
  - ClientRouter: after 5 soft navigations, one click = one toggle for bookmark (2 instances sync), complete (zone + aside sync, undo via toast), palette (no duplicate keydown). Sparks DOM nodes cleaned up. Scrollspy aria-current single, aside marker/ring update after soft nav.
  - Scroll restore: 50% saved -> restored 0.50 on soft nav and on hard reload.
  - Reduced motion (emulated): `.rise`/`.btn` animation/transition collapse; reduced transparency (CDP `Emulation.setEmulatedMedia`): `--material-bar` solid, blur none, top bar solid, grain off. Grain only >=1024.
  - Tap targets >=44 on all checked pages at 390 and 1440, except sidebar rows 36px on fine pointer (documented phase-1 deviation, 44 on coarse).
  - Keyboard Tab sweep (home + reader, 390/1440): every focused element has a visible ring.
  - Fonts loaded: Be Vietnam Pro 400/500/600/700/800 + JetBrains Mono 400/500 - all weights used; no mono 600+ (no synthetic bold).
  - Palette lazy: no palette fetch on load; search-index.json (432KB) only on first typed query.
  - CSP: built HTML has no inline `<script>` and no inline `on*=` handlers.

## Findings

| Sev | Finding | Where | Status |
|---|---|---|---|
| High | `@keyframes ol-rise` defined twice (2a stagger in base.css, page push in view-transitions.css). Global keyframe names collide: the later one won, so every `.rise` row/card entered with the 40px horizontal page-push instead of the 8px rise (and edits to either silently change the other). | base.css:670/678, view-transitions.css:50/66 | FIXED: renamed to `ol-stagger-in` / `ol-push-in` |
| High | `.rows` grid used the implicit `auto` track: a row's nowrap meta line sized the track to its full text -> rows ran 56px past the viewport at 320 (home "Tiếp theo", content-dependent) and ellipsis never applied. | base.css:724 | FIXED: `grid-template-columns: minmax(0, 1fr)` |
| High | Removing all "legacy aliases" as listed would break every lesson diagram: 1070+ `var(--ink)`/`var(--ink-2)` in src/assets/illustrations SVGs (documented contract in docs/illustration-style-guide.md). | tokens.css | FIXED: kept `--ink/--ink-2` as named "illustration contract"; removed the rest; new guard test tests/illustration-token-contract.test.mjs |
| Medium | Legacy aliases still referenced: app-layout (`--ink`, `--ink-2` x3), base.css skip-link `--shadow-card`, view-transitions `--dur-exit`. Aliases `--separator --fill-tint --shadow-card --shadow-float --material-tab --dur-fast --dur --dur-exit --ease-out --ease-in --ease-spring --text-footnote --radius-card-sm` deleted. progress-ring already migrated. | app-layout.astro, base.css:212, view-transitions.css:57, tokens.css | FIXED |
| Medium | Heading order on finance lessons that need the h2 filler: layout's sr-only filler h2 is rendered BEFORE the slot, i.e. before the header h1 -> outline h2, h1, h3 (axe heading-order on e.g. /hoc/tai-chinh/thuc-hanh/bai-tap-va-thu-tu-tien-du/). | [slug].astro:62/105/134, reader-layout.astro:104 | FIXED: lesson page renders the sr-only filler right after its header h1 (no section number); layout fallback h2 hidden for all `.lesson-article`. Hidden duplicate-title heading (display:none) verified: removed from a11y tree, outline h1 -> h2 -> h3 |
| Medium | Command palette: Enter typed within the 120ms debounce activated a row of the STALE list (e.g. a quick action/tab) instead of the typed query's first result. | command-palette-controller.ts:257/266 | FIXED: Enter with a pending query flushes it then opens row 0; regression test (fails without fix) |
| Medium | WCAG 2.5.3 label-in-name (axe): dock "Đã lưu" link got `aria-label="Đã lưu, N bài"` overriding visible text; sidebar search `aria-label="Tìm kiếm — mở bảng lệnh"` vs visible "Tìm kiếm…". | tab-bar.astro:40/208, sidebar-nav.astro:35 | FIXED: sr-only suffix text instead of aria-label override |
| Medium | axe landmark-unique on desktop home: sidebar `<section aria-labelledby>` "Lĩnh vực" region duplicated the home page "Lĩnh vực" region. | sidebar-nav.astro:59/82 | FIXED: sidebar sections unnamed (headings kept) |
| Medium | Branding still indigo (favicon.svg, apple-touch-icon, icon-192/512/512-maskable). | public/ | FIXED: regenerated with sharp, same names/sizes: favicon = volt tile + graphite `omni` glyph (sidebar mark); PNGs = full-bleed graphite #0B0C0E, centered volt tile (58%, inside maskable safe zone) + graphite glyph |
| Low | Raw hex outside tokens: reader toast (7 literals) and palette (`var(--x, #hex)` fallbacks for tokens that always exist). | reader-toast.astro:38-105, command-palette.astro | FIXED: toast uses `--dock`, `--dock-line`, `--dock-shadow`, `--volt`, `--on-volt`, `--dock-text`, new `--dock-text-strong` (#EDEEF0, contrast-tested on --dock both themes, plus --volt on --dock); palette aliases map straight to tokens |
| Low | Palette scrim kept `backdrop-filter: blur(6px)` under prefers-reduced-transparency. | command-palette.astro:293 | FIXED |
| Low | Complete toast could fire on the NEXT page (with an undo for the previous lesson) if user navigated while lessons index loaded. | mark-complete-button.astro:285 | FIXED: skip when root disconnected |
| Low | Dead CSS: `.ios-list/.ios-row/.ios-section-*/.ios-card/.ios-search`, `.btn-filled` (0 usages in src). | base.css | FIXED: removed (~140 lines) |

## Reviewed, no change needed
- 2a out-of-ownership edits: search-box-controller (optional filters/clear/suggestions; listeners all removed in cleanup; stale-request guard intact) and saved-list-controller (optional meta/count labels; old contract returns `undefined`) - correct, tested.
- toc-scrollspy `onActiveChange`: additive, tested.
- Every island uses `onPageLoad` or an init that tears down previous bindings; palette creates document listeners once, rebinds element listeners per page, closes on before-swap; toast resets on before-swap. Sparks/inline styles set via CSSOM (CSP-safe; style-src allows inline anyway).
- localStorage schema unchanged; data-* hooks used by src/lib + tests intact (all suites pass).
- Theme: palette dark accent uses prefers-color-scheme (2c report's `[data-theme]` concern already resolved).

## Not fixed (pre-existing / out of scope)
- axe heading-order: kien-truc bai-tap mint, pastebin, twitter (h3 -> h5 "NoSQL") - fidelity-locked MDX.
- axe empty-table-header: 11 lessons whose source tables have an empty corner `<th>` - content.
- axe color-contrast in code blocks: Shiki github-light `#e36209` on #fff (3.48, sales-rank) and github-dark comments `#6a737d` on `#24292e` (3.04, query-cache, social-graph) - same as HEAD; fix = different Shiki theme or token-mapped theme (design decision).
- Sidebar rows 36px on fine pointers (concept; >=24px WCAG 2.5.8 AA; 44 on coarse) - documented deviation.
- Palette input: global focus-visible ring draws a square volt ring inside the palette input (a11y OK, slightly off concept). Left as-is.
- Unused tokens kept as design-system vocabulary: `--material-border`, `--text-display`, `--text-h2/h3`, `--text-read`, `--shell-measure`, `--ease-snap` (CSS; used as JS literal).
- Sidebar script fetches lessons-index.json (16KB) even <1024 where the sidebar is hidden - cheap, memoized; not changed.
- `scripts/capture-design-screenshots.mjs` deleted in the index (not by this phase) - docs agent should check references.

## Files touched in phase 3
src/styles/{tokens,base,view-transitions}.css, src/layouts/{app-layout,reader-layout}.astro, src/pages/hoc/[domain]/[module]/[slug].astro, src/components/shell/{tab-bar,sidebar-nav}.astro, src/components/lesson/reader-toast.astro, src/components/islands/mark-complete-button.astro, src/components/command-palette/command-palette.astro, src/lib/command-palette-controller.ts, tests/{command-palette-controller,token-contrast}.test.mjs, tests/illustration-token-contract.test.mjs (new), public/favicon.svg, public/icons/*.png.

## Notes for docs agent
- tokens: `--ink/--ink-2` = illustration contract (not legacy); new `--dock-text-strong`; legacy aliases removed.
- Keyframes: `ol-stagger-in` (.rise), `ol-push-in` (page push).
- Lesson heading filler now rendered by the lesson page after the header h1; layout fallback h2 hidden for lesson articles.

Status: DONE_WITH_CONCERNS
Summary: Fixed 13 issues (keyframe collision, 320px row overflow, heading order, palette stale-Enter, label-in-name/landmark a11y, legacy tokens, dead CSS, raw hex, branding icons); test/check/build green and browser checks (overflow 73x7, axe, soft-nav sync, scroll restore, reduced motion/transparency) pass.
Concerns/Blockers: remaining axe hits are pre-existing content/code-theme issues (MDX heading jumps, empty table headers, Shiki comment contrast) outside allowed scope.
