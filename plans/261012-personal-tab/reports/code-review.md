# Code review: tab "Tôi" (/toi) + display prefs

Scope: uncommitted diff on main @02f37ff (27 modified + 9 new files). Gates after fixes: `pnpm test` 464/464, `pnpm check` 0/0/0, `pnpm build` 74 pages. Browser: agent-browser vs `http.server 4570 -d dist` (stopped).

## Fixed (2 confirmed defects)

1. **High: command palette dark accent + forced reduced-motion rules were dead CSS.** `command-palette.astro` uses `<style is:global>`, where `:global(...)` is not compiled. The build shipped the literal `:global(:root[data-theme="dark"]) .cmdk-it{…}` (an invalid selector, so the browser drops the rule), plus 2 `:global(:root[data-motion="reduce"])` rules. Effect: in dark mode, palette domain icons used the light accent (#4B45D1 on the dark surface). Fix: plain `:root[data-theme='dark'] .cmdk-it` / `:root[data-motion='reduce'] …`. Verified: dist has no `:global(` left; in dark mode `--cmdk-c` = #9B9BFF.
2. **High: dock vanished after tapping a setting on /toi.** In `tab-bar.astro`, `isTextInput` treated every `HTMLInputElement` as a keyboard field, so focusing a segmented radio set `data-hidden=true`. The dock then had opacity 0 and pointer-events none until focus left. Before the fix, agent-browser could not click dock links because they were covered. Fix: exclude radio/checkbox/button/submit/reset/range/color/file/image. Verified: radio focus leaves the dock alone, and the search field still hides it.

## Open (not fixed: layout or behavior decision)

- **Medium a11y (WCAG 1.3.2/2.4.3):** /toi mobile uses `.me__col{display:contents}` + CSS `order`. Visual order is account, UI, progress, data. DOM/focus order is account, progress, UI, data, so Tab jumps past "Giao diện" into the progress rows and then back up. Options: (a) accept DOM order on mobile (progress before UI); (b) DOM = account, UI, progress, data, with explicit desktop grid placement (rows become coupled); (c) desktop left = account+UI, right = progress+data. Lead/user decides.
- **Low:** the `writePrefs` comment says "notification still fires so the choice applies for the current page view". That is false when localStorage throws: `prefs-init.apply()` re-reads storage and gets the defaults, and `updatePrefs` merges onto the defaults, so each toggle resets the others. Modern browsers rarely throw (Safari private mode allows localStorage), so the impact is small. Fix the comment, or keep an in-memory copy in prefs-init (CustomEvent detail).
- **Low:** `prefs-init.js` duplicates the validation in `user-prefs.ts` and has no test. Suggest a vm-based test like the scratch one I ran (blocked storage, bad JSON, unknown values, `[1]`, `"dark"`, valid values all give the expected attrs; no global leaks; 3 listeners).
- **Low:** the install tip (iPhone/iPad wording) shows in desktop Chrome too. This is a known deviation. "Lưu trữ bền" also overstates durability on iOS Safari outside standalone mode (ITP 7-day eviction).
- **Low:** live system-theme follow needs `MediaQueryList.addEventListener` (iOS 14+). Older Safari would not live-update. Acceptable.

## Checklist

- (a) Acceptance:
  - 5 tabs at 320 (56x52, labels fit, no overflow), 390 and 1440 (sidebar has "Tôi", aria-current). Active "Tôi" pill shows.
  - Theme, size and motion apply immediately and survive reload + soft nav (3 dock hops). The meta theme-color follows.
  - System-follow works (media dark→light flips `data-theme` and the meta).
  - Reader at 390/l: prose 18.81px. In reduce mode the dock autohide fades only (transform none).
  - Contrast thresholds unchanged.
  - Met, apart from the open focus-order note.
- (b) Theme migration complete:
  - No `prefers-color-scheme` left in src CSS/SVG/MDX/JS; it remains only in `prefs-init.js`, where it is intended.
  - Shiki dark uses `[data-theme=dark]`. `color-scheme` flips. The manifest stays static light (fine).
  - Reduced motion: every media block has a `data-motion` twin. The 6 inline SVG illustrations with `no-preference` animations are covered by the global `:root[data-motion=reduce] *` collapse (they are inlined via `?raw`, same as the OS path).
  - JS: no direct reduced-motion `matchMedia` left. dock-autohide/toc-scrollspy do no motion in JS, and their CSS transitions are collapsed.
- (c) `prefs-init.js`:
  - It is the first script in head, before every stylesheet link (verified in dist).
  - Robust to blocked storage, bad JSON and unknown values. No global leaks (IIFE).
  - Not re-run on swaps: Astro dedupes by src. After 3 soft navs one dispatch causes exactly 1 `data-theme` mutation, so listeners are not duplicated.
  - `after-swap` re-apply works; the theme-color meta gets re-set after the head swap.
  - Caddy: `@notHashed` gives `/prefs-init.js` `Cache-Control: no-cache` (revalidates). No service worker.
- (d) Regressions:
  - Palette quick actions include "Tôi". 404 is themed. Search-field dock hide still works.
  - Focus ring: the light-mode rule's specificity rose to (0,3,0). Checked overrides: tab-link wins by order, and upnext/saved/lesson-row still get box-shadow none.
  - axe on /toi at 1440 dark: 0 violations (3 "incomplete" contrast items on 0% pills, which already existed).
- (e) `app-layout`, `reader-layout` and `progress-store.ts` are untouched. `domain-accent.ts` has a comment-only change. Routes, data-* hooks and the progress schema are unchanged. dist: 0 inline scripts, 0 `on*=` handlers; every page loads `/prefs-init.js`.
- (f) `section#tai-khoan` is empty and hidden via `:empty`. No fake account UI.
- (g) No new lint/type/build errors.

## Files touched by review
- src/components/command-palette/command-palette.astro (selectors lines 207, 307-312)
- src/components/shell/tab-bar.astro (`isTextInput`)

Status: DONE_WITH_CONCERNS
Summary: Fixed 2 defects (dead :global selectors in the is:global palette CSS; dock hidden on radio focus). All gates green.
Concerns: /toi mobile focus order differs from visual order (needs a layout decision); a misleading blocked-storage comment in user-prefs; prefs-init.js has no test.
