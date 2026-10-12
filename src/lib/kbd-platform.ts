/**
 * Keyboard-hint helper: shortcut hints are authored with the Mac glyph
 * (`<kbd data-kbd-mod>⌘</kbd>`); on other platforms the palette listens for
 * Ctrl+K, so the hint must say "Ctrl". Idempotent, safe to call on every
 * page load.
 */
export function isApplePlatform(nav: { platform?: string; userAgent?: string }): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(nav.platform || nav.userAgent || '');
}

export function applyModKeyLabel(root: ParentNode, nav: { platform?: string; userAgent?: string } = navigator): void {
  if (isApplePlatform(nav)) return;
  for (const el of root.querySelectorAll<HTMLElement>('[data-kbd-mod]')) el.textContent = 'Ctrl';
}
