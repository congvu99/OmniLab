# Phase 01 report — foundation & shell

## Changed
- tokens.css: iOS palette light/dark (bg #F2F2F7/#000, surface #FFF/#1C1C1E, surface-2, ink, ink-2 solid, separator, fill-tint), accent-tint, material tokens (`--material-bar/-tab/-sidebar/-border/-blur`) with solid fallback via `@supports not (backdrop-filter)`, radius card 22 / card-sm 16 / row 12, type scale, `--ease-spring`, `--shadow-float`, shell tokens (`--shell-sidebar-w` 264, `--shell-aside-w` 296, `--shell-content-max` 880, `--shell-measure` 68ch, `--shell-tabbar-h/-gap`). No token renamed -> token-contrast test untouched, passes (55).
- base.css: utilities documented at top. `.ios-list > .ios-row[data-chevron]` (`--ios-row-inset`), `.ios-row__title/__detail`, `.ios-section-header/-footer`, `.ios-card(--flush)`, `.btn .btn-filled|-tinted|-plain .btn-sm`, `.ios-search` (pill, wrap icon + input), `.ios-glass`, `.hide-at-aside-width`. Removed 4px radius on :focus-visible.
- Shell: floating glass pill tab bar (<1024); glass sidebar (>=1024) now also lists domains (getDomains, dot colour per theme); large-title navbar turns glass on collapse; glass reader top bar (offset by sidebar on desktop).
- app-layout: desktop main centered, max 880px + gutters. reader-layout: sidebar added to reader.
- theme-color meta + manifest bg/theme -> #F2F2F7 (dark meta #000000).

## Aside slot contract (reader-layout)
- `<Fragment slot="aside">...</Fragment>` (or any element with slot="aside") renders `<aside class="reader-aside" aria-label="Thông tin bài học">`, only if slot is provided.
- Shown only at >=1280px (sticky, flex column, gap 16, scrolls if tall). Hidden (display:none) at 1024-1279 and <1024.
- So inline equivalents (collapsible TOC, next-lesson card) must stay in default slot; add class `hide-at-aside-width` to them to hide at >=1280 (avoid duplicates). Prefer: aside = TOC + progress + next lesson; inline TOC hidden >=1280.
- Main: `#reader-content.prose` max-width 68ch + 2*32px padding, centered at >=1024; fallback h1/h2 logic untouched. `main#reader-content` id and top-bar IntersectionObserver unchanged.

## Legacy aliases left (remove in phase 2)
- `--surface-veil` -> `--material-bar`; `--shadow-bar` -> `--shadow-float` (nothing in src references them now besides tokens.css; safe to delete).
- `--text-footnote` (15px) = `--text-subhead`; `--text-caption` (13px) = iOS footnote. `--radius-card` value changed 16 -> 22 globally (existing cards got bigger radius); use `--radius-card-sm` for nested/figure.
- `--line` still exists for decorative borders; prefer `--separator`.

## Validation
pnpm test (327), check (0 errors), build (73 pages) pass. Screenshots: plans/261012-ios-native-redesign/reports/phase-01/ (home, lv, lesson x 390/1440 x light/dark). Preview server stopped.

## Known issues / notes
- `.ios-search` has no 3:1 border (iOS-native fill only); phase 2 may add one if a11y audit demands.
- Reader desktop layout visually verified without aside (nothing fills the slot yet). Lesson TOC currently inline.
- Domain/lesson pages still use old component styles (phase 2). prose.css `.prose` max-width 65ch is overridden by reader-layout on `.reader-content`; 2b may drop it.
- Sidebar section "Lĩnh vực" duplicates tab item name; fine for nav, h2 inside nav used for labelling.
- Tab bar hides on input focus (existing behavior kept; transform now also clears the safe area).

Status: DONE
