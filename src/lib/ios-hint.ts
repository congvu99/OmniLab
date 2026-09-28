/**
 * One-time dismissible "Thêm vào màn hình chính" hint for iOS Safari users
 * browsing in a regular tab (not yet installed standalone) — localStorage
 * persistence is unreliable there (Safari's ITP may evict it), so this
 * nudges toward installing. Deliberately a separate tiny localStorage key
 * (not routed through progress-store.ts's versioned state) since it's UI
 * chrome, not user progress data.
 */
const DISMISSED_KEY = 'omnilab:v1:ios-hint-dismissed';

function isIosNonStandalone(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as "Macintosh" in the UA string but is touch-capable,
  // unlike a real Mac.
  const isIos = /iP(hone|od|ad)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIos && !isStandalone;
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function dismiss(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    // Private mode / quota — the banner will just show again next visit,
    // no worse than not persisting it at all.
  }
}

export function initIosHint(): void {
  const banner = document.querySelector<HTMLElement>('[data-ios-hint]');
  const dismissButton = document.querySelector<HTMLButtonElement>('[data-ios-hint-dismiss]');
  if (!banner || !dismissButton) return;

  if (!isIosNonStandalone() || isDismissed()) {
    banner.hidden = true;
    return;
  }

  banner.hidden = false;
  dismissButton.addEventListener(
    'click',
    () => {
      banner.hidden = true;
      dismiss();
    },
    { once: true },
  );
}
