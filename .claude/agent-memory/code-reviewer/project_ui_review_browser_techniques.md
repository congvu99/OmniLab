---
name: ui-review-browser-techniques
description: How to verify OmniLab UI changes in browser (overflow sweep, axe, reduced transparency) and recurring UI defect classes found in the Studio restyle review
metadata:
  type: project
---

UI review of OmniLab (Astro static, ClientRouter) found defects that only showed in-browser with seeded progress state.

**Why:** happy-path tests passed; real bugs were global `@keyframes` name collisions between base.css and view-transitions.css, grid `auto` tracks blown out by nowrap meta text (content-dependent, only with seeded localStorage `omnilab:v1:state`), sr-only filler headings placed before the real h1, aria-label overrides breaking label-in-name.

**How to apply:**
- Seed `omnilab:v1:state` (done/reading/bookmarks) before overflow/axe sweeps; empty state hides client-rendered rows.
- Overflow sweep: one agent-browser page loads each route in a same-origin iframe at each width; run async job storing result on window and poll (long evals time out).
- axe: `npm pack axe-core` into scratchpad, copy to dist/__axe.js after build, inject via script tag (python http.server has no CSP).
- agent-browser `set media` only does color scheme + reduced motion; reduced transparency needs CDP `Emulation.setEmulatedMedia` via node WebSocket on `get cdp-url`.
- Lesson SVGs use `var(--ink)`/`var(--ink-2)`: never remove those tokens (guarded by tests/illustration-token-contract.test.mjs). See [[split-lesson-crossref-defects]].
