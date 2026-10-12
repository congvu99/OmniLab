/**
 * Single answer to "should we skip movement?": true when the user chose
 * "Giảm chuyển động: luôn bật" in /toi (<html data-motion="reduce">, set by
 * public/prefs-init.js) or the OS asks for reduced motion. Use this instead
 * of calling matchMedia('(prefers-reduced-motion…)') directly.
 */
export function prefersReducedMotion(): boolean {
  if (typeof document !== 'undefined' && document.documentElement?.dataset?.motion === 'reduce') {
    return true;
  }
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
