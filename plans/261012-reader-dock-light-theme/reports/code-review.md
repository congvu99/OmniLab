# Code review: reader dock + light dock

Scope: git diff (tokens.css, tab-bar, reader-layout, reader-toast, token-contrast test, comments/docs) + new src/lib/dock-autohide.ts, dock-autohide-binding.ts, tests/dock-autohide.test.mjs.

## Fixed (1)
- **High: resumed lessons hid the dock on open.** Binding seeds state at scrollY=0 on astro:page-load; reader-progress-tracker then `scrollTo`s the saved ratio in a rAF (also router back/forward restore) -> one downward jump >80px -> hidden + inert immediately. Violates "dock hiện khi mở bài" for any partially-read lesson (impl only tested fresh lessons). Fix in dock-autohide-binding.ts: scroll samples only re-anchor until first user input (touchstart / wheel / pointerdown / keydown, passive, removed in cleanup). Side effect: VoiceOver gestures (no touch events) don't hide the dock -> better for SR users.

## Verified OK
- Acceptance thresholds (top 8, hide >80, reveal >=24 from reversal, near-end <400, rubber-band clamp) match spec; 13 unit tests real (not phantom).
- Tabs pages: binding gated on body[data-shell=reader]; app-layout unchanged -> no auto-hide.
- ClientRouter: setup on astro:page-load, cleanup on before-swap (removes all listeners, cancels rAF, clears inert/data attr). No stacking.
- Reader route /hoc/* -> "Lĩnh vực" active pill (has-active true).
- Desktop >=1024: tab-bar display:none; .reader-content padding overridden in min-width:1024 block -> unchanged.
- Reader-layout: aside slot, CommandPalette, fallback h1/h2 untouched; TabBar mounted after grid.
- View transitions: ol-dock now on both shells -> morphs instead of fading; docs comment updated.
- Toast: solid --dock bg (not glass); lifts above dock via body:has(...) only <1024 when dock shown; tokens-only.
- Reduced motion: transform none, opacity only. Reduced transparency / no backdrop: --dock-glass -> --dock.
- Contrast test thresholds untouched (4.5); dark values identical to before.
- No data-* hook/route/localStorage changes; built HTML has no inline scripts.

## Notes (not changed)
- `inert` + VoiceOver: acceptable. Back link in top bar is always reachable, dock force-shows within 400px of end (where SR users finish), and after the fix the dock no longer hides for VO-only gestures. Hidden dock is still reachable by keyboard (Tab reveals).
- `bar.addEventListener('focusin', reveal)` is effectively dead (inert dock can't take focus); harmless.
- Tab keydown anywhere reveals the dock (not only when focus heads to it); acceptable per spec.
- Light glass over very dark content: --dock-accent ~4.46:1 worst case on 0.86 white glass; on the dock it's only used as a focus ring (3:1 suffices). Labels stay >=5.9.
- Toast jumps (no transition on `bottom`) when dock hides while toast visible; cosmetic.
- Not re-verified in a browser after the fix (logic-only change; check/test/build green).

## Gates
pnpm test 26 files / 449 pass; pnpm check 0/0/0; pnpm build OK (73 pages).

Status: DONE
Summary: All acceptance criteria met after fixing the scroll-restore hide on resumed lessons; no regressions found in touchpoints.
