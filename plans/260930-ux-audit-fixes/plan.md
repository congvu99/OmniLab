# UX audit fixes

Status: done · Mode: auto (user pre-approved decisions, no questions)

## Scope
Fix 15 findings from UX audit 2026-09-30. Out of scope: redrawing SVG font sizes (follow-up), CI axe gate.

## Phase 01 — single phase (all small, independent CSS/markup edits)

| ID | Change | Files |
|---|---|---|
| H1 | `.figure__svg` padding `--space-2` <480px; tap diagram → native `<dialog>` full-screen zoom | `components/lesson/figure.astro` |
| H2 | Finance accent + `--success` `#1F7A5A` → `#1C7455` (4.88:1 on surface-2) | `content/domains/tai-chinh.yaml`, `styles/tokens.css` |
| H3 | `--gutter-l/r` = `max(space-4, safe-area-inset)`; apply to shell bars/containers | `tokens.css`, shell components, layouts |
| M1 | sr-only label text for search input | `islands/search-box.astro` |
| M2 | Mark-complete: drop constant aria-label, visible label = name, `aria-pressed` = state | `islands/mark-complete-button.astro` |
| M3 | Undo toast pauses timer on focus/hover; focus returns to toggle when toast hides with focus inside | same |
| M4 | `--line-strong` token (≥3:1 vs surface) for control borders | `tokens.css`, `search-box.astro` |
| M5 | Search error announced via status region + "Thử lại" button | `search-box.astro`, `lib/search-box-controller.ts` |
| M6 | `@media (hover:hover)` states for sidebar, cards, rows, results | shell/domain/islands |
| M7 | TOC summary 44px, links block + padding | `lesson/lesson-toc.astro` |
| L1 | Row titles 2-line clamp | `lesson-row.astro`, `saved-list.astro` |
| L2 | Draft badge 12px | `lesson/real-life.astro` |
| L3 | Navbar height read from `--shell-navbar-h` | `large-title-header.astro`, `reader-top-bar.astro` |
| L4 | Loading text announced through the persistent status region | `search-box-controller.ts` |
| — | Vitest: token + domain accent contrast ≥4.5 on bg/surface/surface-2, both themes | `tests/token-contrast.test.mjs` |

## Acceptance
- `pnpm test`, `pnpm check`, `pnpm build` green.
- Contrast test passes; would have failed on old `#1F7A5A`.
- No public contract change (progress store, search index, content schema untouched).

## Risks / rollback
Pure presentational + one controller path; revert commit to roll back.

## Result (2026-09-30)
- All 15 findings fixed + review follow-ups (zoom trigger moved out of the diagram so SVG keeps image semantics; icon sizing; landscape gutter alignment; retry test).
- Extra fix found in e2e: inline `code` with long tokens caused 115px horizontal scroll at 375px → `overflow-wrap: anywhere`.
- Verification: `pnpm test` 286/286, `pnpm check` 0 errors, `pnpm build` 58 pages; Playwright e2e + axe-core — see reports/e2e-playwright.md.
- Follow-up: raise legacy SVG labels (11–12px) to ≥13px.
