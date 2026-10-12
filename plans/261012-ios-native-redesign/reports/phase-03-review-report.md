# Phase 03 report — review + fixes (iOS native redesign)

Scope: whole uncommitted diff (37 modified files + lesson-aside.astro, toc-scrollspy.ts, its test). Fix-only; no content/SVG/docs/screenshot-script edits.

## Findings

| # | Sev | Where | Finding | Status |
|---|---|---|---|---|
| 1 | High | src/lib/toc-scrollspy.ts (update(), was `links[next].scrollIntoView`) | `scrollIntoView` scrolls every scrollable ancestor incl. the window whenever the active aside link is outside the viewport, so the scrollspy could yank the page mid-read. | Fixed: new pure `nearestScrollDelta()` + `scrollContainer` option; only `.reader-aside` scrollTop is adjusted, skipped while aside is display:none. lesson-aside.astro passes the container. +4 unit tests. Browser: window scrollY never moved at 20/50/80/99%; on a 10-entry TOC at 1440x500 the aside self-scrolled (scrollTop 84) and the active link stayed inside the box. |
| 2 | High (a11y 1.4.3) | src/styles/tokens.css `--accent-tint` | 14% *transparent* tint: accent text on it over --bg / sidebar glass fell below 4.5:1 for the green domain (#1C7455: 4.24 on --bg, ~4.4 on sidebar). Hits tab bar active label, sidebar active row, inline mark-complete button, reading badge. | Fixed: `color-mix(in srgb, var(--accent) 12%, var(--surface))` (opaque). Worst case now 4.83 (green light); indigo 5.25, orange 6.02, dark accents >= 6.7. |
| 3 | Medium (a11y 1.4.11) | src/styles/base.css `.ios-search` | Fill-only field ~1.1:1 vs page. | Fixed: `box-shadow: inset 0 0 0 1px var(--line-strong)` (3.52:1 light, 5.06:1 dark; no layout change, pill + fill kept). |
| 4 | Medium (a11y 2.4.7) | base.css `.ios-list` (overflow:hidden), lesson-toc.astro (details overflow:hidden), next-lesson-card in `.reader-aside` (overflow-y:auto) | Global 2px *outside* focus ring clipped at the container edges. | Fixed: `outline-offset: -2px` for `.ios-list .ios-row`, `.lesson-toc summary/a`, `.reader-aside .next-lesson-card`. Verified computed -2px on focused home row. |
| 5 | Medium (a11y 2.5.5 / plan "tap >=44") | lesson-aside.astro `.aside-toc a` | Rows ~35px; aside also shows on touch iPads landscape (>=1280). | Fixed: flex + min-height 44px. |
| 6 | Low | tokens.css | Legacy aliases `--surface-veil`, `--shadow-bar` unused (grep src/tests). | Removed. |
| 7 | Low | base.css | Dead utilities never used in src: `.btn-tinted`, `.btn-plain`, `.btn-sm`, `.ios-glass`, `.ios-card--flush`, `.ios-row__title`, `.ios-row__detail`. | Removed + header comment updated. **docs agent: drop them from docs/design-guidelines.md if listed.** |
| 8 | Low (tokens-only) | prose.css code `border-radius: 6px`; domain-hero icon `border-radius: 20px`; lesson-toc `padding: 12px` | Raw px radius/spacing. | Fixed: new `--radius-xs: 6px`; hero -> `--radius-card-sm`; `--space-3`. |
| 9 | Low | lesson-toc.astro `li` | New `.prose li { padding-left: .2em }` leaked into the inline TOC rows. | Fixed: `padding: 0`. |
| 10 | Low (enhancement, item 5) | tokens.css | No `prefers-reduced-transparency` handling. | Added: same solid material fills as the `@supports not (backdrop-filter)` fallback (light + dark). |
| 11 | Info | sidebar-nav.astro | `<h2>Lĩnh vực</h2>` in sidebar precedes page `<h1>` in DOM (>=1024). Not a heading-level skip; legit nav section heading. | Not changed. |
| 12 | Info | prose.css `18px`, `40px`, `30px` font sizes (>=1024) | Raw font-size px; tokens rule names color/spacing/radius/duration only. | Not changed. |
| 13 | Info | sidebar-nav dot / search-results / index / domain page `style="--x:..."` | Inline style attributes. Caddyfile CSP has `style-src 'self' 'unsafe-inline'`, pre-existing pattern (domain accent on <html>). No new inline `<script>`; all scripts are bundled modules (`script-src 'self'` OK). | OK. |
| 14 | Info | src/components/domain/domain-artwork.astro | Untracked file appeared 10:30 during review (another agent), not referenced anywhere. | Not reviewed / not touched. |

## Verified OK (no change)
- data-* hooks: `data-mcb*`, `data-bb`, `data-crc-*`, `data-search-*`, `data-saved-*`, `.lesson-row[data-lesson-id]`, `.lesson-article[data-lesson-id]`, `#reader-content` all present; no src/lib controller or test uses single `querySelector` on the now-duplicated islands.
- Duplicate islands sync (1440): click aside complete + labeled bookmark after a soft nav -> mcb `["true","true"]`, bb aria-pressed `["true","true"]`. Toast only on the clicked instance.
- Duplicates/landmarks at 1440: 0 duplicate ids; exactly 1 visible mcb, 1 aside TOC, 0 inline TOC, 1 next card; aside landmark `Thông tin bài học` + nav `aside-toc-title`. Inner lesson `<aside>`s sit inside `<article>` (not landmarks).
- ClientRouter: patched add/removeEventListener counter over 4 soft navs lesson->lesson: net scroll/resize listeners 0 per nav (no leak); leaving to a domain page tears all down. Scrollspy + progress re-init after soft nav (aria-current set, 60%).
- Scroll restore: scroll 2500 -> next lesson (0) -> history.back() -> 2500.
- Reduced motion: global rule gives tab bar transitionDuration 1e-05s; search spinner stops; `scrollIntoView` removed entirely.
- backdrop-filter fallback: `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` swaps all three materials to solid in light/dark; all glass surfaces read the tokens.

## Responsive (scrollWidth - innerWidth over all 73 built pages)
320x700, 390x900, 1024, 1100, 1279, 1280, 1440: **0 overflow on every page at every width** (64 lessons incl. table/code-heavy ones).

## Verification
- `pnpm test`: 18 files, **336 passed** (332 + 4 new nearestScrollDelta tests).
- `pnpm check`: 104 files, 0 errors / 0 warnings / 0 hints.
- `pnpm build`: 73 pages, complete.
- Browser: agent-browser session `rv430` vs `python -m http.server 4430 -d dist`; screenshots (search 390 light/dark ring, tai-chinh 1440 sidebar tint) checked visually; session closed, server on 4430 stopped.

## Files changed in this phase
src/styles/tokens.css, src/styles/base.css, src/styles/prose.css, src/lib/toc-scrollspy.ts, tests/toc-scrollspy.test.mjs, src/components/lesson/lesson-aside.astro, src/components/lesson/lesson-toc.astro, src/components/lesson/next-lesson-card.astro, src/components/domain/domain-hero.astro.

## Unresolved questions
- docs/design-guidelines.md may list the removed utilities / old `--accent-tint` formula — docs agent should sync.
- domain-artwork.astro (untracked, unused) — owner/intent unknown.

Status: DONE_WITH_CONCERNS
Summary: Reviewed the full redesign diff; fixed 10 issues (scrollspy window-scroll hijack, green-accent tint contrast, search-field 3:1 boundary, clipped focus rings, aside TOC targets, dead aliases/utilities, raw px, reduced-transparency). test/check/build green, 0 overflow at 320–1440 on all 73 pages.
Concerns/Blockers: docs need sync for removed utilities and accent-tint change; an untracked unused domain-artwork.astro appeared mid-review from another agent.
