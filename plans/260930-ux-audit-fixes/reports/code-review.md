# Code review: UX audit fixes (uncommitted diff, 2026-09-30)

## Scope
- 20 modified files + `src/lib/figure-zoom-controller.ts`, `tests/token-contrast.test.mjs` (~275 LOC added, 43 removed)
- Focus: acceptance criteria in `plan.md`, regressions (figure zoom, toast, search retry, safe-area gutters), contracts
- Verified: `pnpm test` 285/285 pass, `pnpm check` 0/0/0; `dist/` already contains the new markup and CSS (built after the change)

## Overall
Small, well-scoped presentational diff. No contract breaks. One confirmed CSS regression in the new zoom dialog, one a11y trade-off in the figure button, and one alignment inconsistency in the landscape gutters. Nothing blocking.

## Acceptance criteria
| ID | Result | Note |
|---|---|---|
| H1 | Met, with defect | Padding is `--space-2` below 480px and zoom works. The close-icon size is wrong (see F1). |
| H2 | Met | `#1C7455` gives 4.88:1 on surface-2. The old `#1F7A5A` measures 4.496, so the new test would have failed on it (checked). No stale hex left in src/docs/public/tests/scripts. |
| H3 | Met, with inconsistency | Tokens are added and bars use them. Content in `.app-main` is misaligned with the header in landscape (see F3). |
| M1 | Met | sr-only span inside the `<label>`. |
| M2 | Met | Constant visible name plus `aria-pressed`. No leftover `data-mcb-label` references. |
| M3 | Met | Pauses on focus and mouse hover. Focus returns to the toggle through `hideToast`. |
| M4 | Met | `--line-strong` measures 3.16 to 3.70 light and 3.23 to 3.96 dark, all at least 3:1. |
| M5 | Met | Status text plus retry. `ensureIndex` clears the rejected promise, so retry really refetches. |
| M6 | Met | `@media (hover:hover)` in sidebar, cards, rows, results and saved list. |
| M7 | Met | Summary is 44px. Links are 15px × 1.7 line-height (`.prose`) + 20px = 45.5px. |
| L1–L4 | Met | |
| Test | Met | Covers ink, ink-2, danger, success and accents on bg, surface and surface-2 in both themes, plus line-strong and accent-on. |

## Critical
None.

## High
None.

## Medium

### F1. The dialog close "X" renders at 44px instead of 22px
- `src/components/lesson/figure.astro:85-92`
- The existing rule `.figure :global(svg) { width:100%; height:auto; display:block; border… }` compiles to `.figure[data-astro-cid-hz7sprz6] svg`, as confirmed in `dist/_astro/_slug_.B_r-clSB.css`. It matches every `<svg>` inside the figure, which now includes the lucide `X` in `.figure__dialog-close` and the `Maximize2` hint.
- The close button is a 44px-wide `inline-flex` box, so the X becomes a 44×44 glyph that fills the whole button. The hint icon only survives because its absolutely positioned shrink-to-fit parent resolves the percentage to its own 16px. `.figure__svg :global(svg)` removes the border, but it does not undo the width.
- Fix: narrow the photo rule to the content graphics only. For example, `.figure > :global(img), .figure > :global(svg), .figure__svg-host > :global(svg) {…}`, keeping the `.figure__dialog-body :global(svg)` rule. A cheaper alternative is `.figure__dialog-close :global(svg), .figure__zoom-hint :global(svg) { width:auto; height:auto; }`.

### F2. Wrapping the diagram in a `<button>` removes its image semantics for AT
- `figure.astro:50-56`
- ARIA treats the children of a button as presentational. The SVG's `role="img"` and `<title>`/`aria-labelledby` disappear from the accessibility tree. A screen-reader user now meets "nút, Phóng to hình: {alt}" instead of a graphic, and long `alt` text turns into a long button name.
- The header comment at lines 22-23 ("the wrapper below adds no redundant aria-label") is now false.
- Fix: keep the SVG host outside the button as an image. Add a small, visible, labelled "Phóng to" overlay button for keyboard and AT users. If tap-anywhere is wanted, add a pointer `click` listener on the host that calls the same `open`. Update the header comment either way.

### F3. Landscape gutters: content and header no longer line up, and content gets a double inset
- `src/layouts/app-layout.astro:83-86`, together with `large-title-header.astro:50,66` and `app-layout.astro:108,145`
- `.app-main` adds `env(safe-area-inset-left)`, and its children keep their own 16px margins. The header, iOS hint and storage warning use `max(16px, inset)` instead.
- On an iPhone in landscape (inset ≈ 47px), the large title starts at 47px while cards and rows start at 63px, a 16px offset. The layout comment acknowledges the stacking, but it contradicts the plan's single `--gutter-*` contract.
- Fix: `padding-left: max(0px, calc(env(safe-area-inset-left) - var(--space-4)))` (same for the right). Children's 16px plus this padding then equals `--gutter-l`/`--gutter-r` exactly.

### F4. The changed paths have no tests
- `tests/search-box-controller.test.mjs` has no error or retry case, even though `SearchBoxElements` gained `retry` and `runSearch` now writes to `resultCount` on load and on error. The toast pause/focus logic and `figure-zoom-controller.ts` are also untested.
- Fix: add a test where fetch rejects, then check that the error is shown and `resultCount` reads "Không tải được…". Then click retry, let fetch resolve, and check that results render and the fetch was called twice. Optionally add a jsdom test for `attachFigureZoom`: open moves the SVG into the dialog body, and cleanup restores it to the host.

## Low
- **L-a. Toast pause does not help screen-reader browse mode.** `mark-complete-button.astro:166-181`. A virtual cursor does not move DOM focus, so the 4s timer still runs for those users. The status announcement covers the message, but "Hoàn tác" can disappear before it is reached. Consider not auto-hiding while `document.activeElement === button`, or a longer duration.
- **L-b. The backdrop-click handler is effectively dead code.** `figure-zoom-controller.ts:34-37`. The dialog is 100vw × 100dvh, so `::backdrop` is never exposed, and the comment overstates the handler. Remove it or keep it with an accurate comment.
- **L-c. Back gesture closes the page, not the zoom.** A hardware back or iOS swipe-back while the dialog is open navigates away from the lesson instead of closing the dialog. Cleanup runs correctly on `astro:before-swap`, so nothing leaks; this is only a UX expectation. Optional: push a history state on open and close on `popstate`.
- **L-d. No scroll containment in the dialog body.** `.figure__dialog-body` has no `overscroll-behavior: contain`, so on iOS the pan can chain into page scroll behind the modal.
- **L-e. The zoom hint can hide diagram content.** `.figure__zoom-hint` (`top:0; right:0`) sits over the top-right corner of the diagram and can cover labels drawn there. Consider offsetting it outside the SVG box or into the panel padding.
- **L-f. The hover ring is hard to see.** Card hover uses `0 0 0 1px var(--line)`, which is about 1.2:1 against the surface. That is fine as a non-essential affordance, but `--line-strong` would be noticeable.
- **L-g. The done state has no text cue.** M2 keeps the visible text "Hoàn thành bài học" in both states, so sighted users see the state only through the icon shape and the fill. This follows the accepted plan decision; noting it only.

## Regression checks (all pass)
- **Soft navigation cleanup:** `onPageLoad` cleanup runs on `astro:before-swap`. It closes the dialog, restores the SVG synchronously and removes listeners. Toast listeners attach to a new DOM node per page, so there is no leak.
- **CSS specificity versus `.prose svg` (0,1,1):** the scoped rules (0,2,1) win. In the dialog, `max-width:none` and `width:max(100%,720px)` come later in source order than `.figure svg`, so they win (verified in the built CSS).
- **verify-fidelity and search index:** both read MDX source (`scripts/lib/mdx-text-extract.mjs`, `src/lib/search-mdx-to-text.ts`), not rendered HTML, so they are unaffected.
- **Contracts:** progress store API unchanged. Search index shape unchanged. Content schema unchanged (only the accent value changed). `SearchBoxElements.retry` is optional, so callers stay compatible.
- **Moving vs cloning the SVG:** moving keeps ids unique. `restore` uses `body.querySelector('svg')`, and the close icon is in the bar, not the body, so the right node goes back. A modal dialog makes the trigger inert, so the zoom cannot be opened twice.
- **Search retry:** retry focuses the input before the error block is hidden, so focus is not lost. The `requestId` guard handles an overlapping debounce.

## Recommended actions
1. F1: narrow the `.figure :global(svg)` selector (single-line fix).
2. F3: change `.app-main` padding to `max(0px, inset - 16px)`.
3. F2: move the SVG out of the button, or accept the trade-off and fix the stale comment.
4. F4: add the search error/retry test.
5. Low items as follow-ups.

## Metrics
- Type check: 0 errors, 0 warnings. Tests: 285/285. No linter configured. Coverage not measured.

## Unresolved questions
- Is losing image semantics inside the zoom button (F2) acceptable to the product owner, or should the diagram stay an image with a separate zoom control?

Status: DONE_WITH_CONCERNS
Summary: All acceptance criteria are met and test, check and build are green with no contract breaks. The main concerns are the oversized close icon in the zoom dialog (F1), the loss of image semantics inside the zoom button (F2), and the landscape gutter misalignment (F3).
