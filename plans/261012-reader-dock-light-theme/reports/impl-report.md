# Impl report: reader dock + light dock

## Changes
- src/lib/dock-autohide.ts (pure step fn: top zone 8, hide >80 + 4px jitter, reveal >=24 from last reversal, always shown <400 from end, clamps rubber-band, NaN-safe) + tests/dock-autohide.test.mjs (13 tests).
- src/lib/dock-autohide-binding.ts: rAF-throttled passive scroll, sets `data-scroll-hidden` + `inert`; Tab keydown / focusin reveals; matchMedia(<1024) reset; returns cleanup.
- tab-bar.astro: glass bg (`--dock-glass` + `--material-blur`), hide = translateY + opacity (reduced motion: opacity only, transform none), focus ring `--dock-accent`, binds autohide only when body[data-shell=reader], cleanup via existing onPageLoad (runs on astro:before-swap).
- reader-layout.astro: mounts TabBar; reader bottom padding += dock height + gap.
- reader-toast.astro: sits above dock when visible (<1024); undo/focus use `--dock-accent`; `width: max-content` (toast previously shrunk to half viewport and wrapped).
- tokens.css: light dock = light glass (#FFF / 0.86 glass, dark text, hairline, soft shadow); dark values explicit = unchanged; new tokens `--dock-glass`, `--dock-accent`, `--dock-pill-shadow`; solid fallback for no-backdrop / reduced-transparency.
- token-contrast.test.mjs: pairs re-expressed (text, text-strong, accent on --dock; badge; on-volt/volt already covered). Thresholds untouched.
- Docs: design-guidelines.md (dock section + responsive), system-architecture.md; stale "focus mode / no dock" comments fixed (app-layout, reader-top-bar, sidebar-nav, view-transitions.css).

## Acceptance
- Dock shown on lesson open: PASS (390x844, light+dark).
- Scroll down >80 hides (opacity 0, inert true), up >=24 shows, top shows: PASS (y 300 hidden; 800->770 shown).
- Near end shows; complete button + next card not covered: PASS (last content bottom 718 < dock top 766).
- Inert when hidden; Tab key reveals dock: PASS.
- Reduced motion: hidden transform=none, opacity 0: PASS.
- Toast above dock, readable light + dark: PASS (screenshots, scratchpad).
- Light dock on tab screens looks light: PASS; tabs pages do not auto-hide: PASS.
- ClientRouter x4 lesson<->tab cycles: net scroll listeners constant (0), hide/show consistent every cycle: PASS.
- Dark unchanged: bg rgb(22,24,28), same shadow/text values: PASS.
- pnpm test 26 files/449+ tests, pnpm check 0 errors, pnpm build: PASS.

## Contrast (light / dark)
- --dock-text on dock: 8.10 / 7.46
- --dock-text-strong: 19.32 / 15.31
- --dock-accent: 6.19 / 15.37
- --on-volt on --volt: 14.88 (pill text)
- Glass worst case (over --bg-2) still ~7.96 for dock-text.

## Notes
- Dock hairline (0.13 alpha) is decorative; boundary is carried by shadow, not a control edge (no 3:1 required).
- Hidden dock is inert, so VoiceOver swipe cannot reach it until revealed by scroll-up/Tab; accepted per spec.
- agent-browser `open` hangs return (page loads); used eval/timeout workarounds. Server stopped. Screenshots only in scratchpad.
