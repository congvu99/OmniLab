# Phase 2c report - command palette

## Files (all new)
- src/components/command-palette/command-palette.astro (markup, bundled script, global styles prefixed `cmdk`)
- src/lib/command-palette-logic.ts (pure: quick actions, query items, key reducer)
- src/lib/command-palette-controller.ts (DOM controller, deps injected)
- tests/command-palette-logic.test.mjs, tests/command-palette-controller.test.mjs (18 tests, pass)

## Public API
- Component: `<CommandPalette />` (default export of command-palette.astro)
- Open event: `document.dispatchEvent(new CustomEvent('omnilab:open-palette'))`; also any element with `data-open-palette` (delegated click).
- Shortcut: Cmd/Ctrl+K toggles; plain k ignored. Esc/backdrop close, Up/Down/Home/End, Enter -> astro `navigate()`.
- Data: lessons-index.json fetched on first open (tabs/domains/continue via getProgressStore().lastUnfinished, read-only); search-index.json only on first typed query. Same MiniSearch + foldDiacritics as Tim kiem tab.

## Mount
In base layout once (inside body, outside any transition:persist region not required):
`import CommandPalette from '../components/command-palette/command-palette.astro'; <CommandPalette />`
Script creates controller once, re-binds on astro:page-load, closes on astro:before-swap. If layout uses transition:persist on it, still fine.

## Assumed tokens (var(--x, fallback), all aliased locally as --cp-*)
--surface, --surface-3, --bg-2, --line, --line-2, --text, --text-2, --text-3, --volt-ink, --glow, --ease, --font, --mono.
Per-domain accent: `--cmdk-accent` / `--cmdk-accent-dark` set inline from search-index domainAccent(Dark); dark variant selected via `:root[data-theme='dark']` (align if the theme attribute differs).
Backdrop colors hardcoded rgba(5,6,8,.55). z-index 1000. Adds `html.cmdk-lock {overflow:hidden}`.

## Behavior notes
- Query list: up to 3 matching tabs/domains first, then ranked lessons, capped at 8.
- Focus: Tab trapped on input; document focusin outside panel refocuses input; focus restored on close (not on navigate).
- Motion: 150ms opacity + translate/scale; reduced-motion -> fade only, no blur.
- Components uses is:global style (rows created at runtime).

## Validation
- pnpm check: 0 errors. palette tests: 18/18 pass.
- pnpm test overall: 12 failures all in tests/token-contrast.test.mjs (--ink tokens vs foundation agent's concurrent tokens.css rewrite) - not mine. pnpm build not run.
- Not verified in a browser (no mounting).

## Unresolved
- Sliding highlight bar from concept not implemented (selected row uses static bg + volt left bar).
- Domain rows have no icon/accent in empty state (lessons-index lacks accent).
