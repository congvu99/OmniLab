/**
 * Shared setup/teardown helper for module `<script>`s that bind to the DOM
 * and must survive Astro ClientRouter soft navigations. A module script's
 * top-level code runs exactly once per browser session — ClientRouter marks
 * it `data-astro-exec` and skips re-running the script body on later swaps
 * (see `node_modules/astro/dist/transitions/swap-functions.js`,
 * `detectScriptExecuted`). Any DOM node captured at the top level therefore
 * belongs to the FIRST page only: once the next swap replaces the page
 * content, that node is detached and any listener/observer still bound to
 * it stops working (or leaks).
 *
 * `onPageLoad` re-runs `setup()` on every `astro:page-load` (fires after
 * each soft navigation settles, and once on the initial hard load) so DOM
 * lookups always target the current page, and runs the cleanup `setup()`
 * returns on the *next* `astro:before-swap` (fires right before the
 * upcoming swap starts) — not merely at the start of the next `setup()` —
 * so listeners/observers are torn down before, not after, their DOM is
 * replaced.
 */
export type Cleanup = (() => void) | void;

export function onPageLoad(setup: () => Cleanup): void {
  let cleanup: Cleanup;

  document.addEventListener('astro:page-load', () => {
    cleanup = setup();
  });

  document.addEventListener('astro:before-swap', () => {
    cleanup?.();
    cleanup = undefined;
  });
}
