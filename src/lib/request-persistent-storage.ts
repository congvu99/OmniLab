/**
 * Best-effort `navigator.storage.persist()` — asks the browser not to evict
 * localStorage under storage pressure. Only meaningful once running
 * standalone (installed to home screen); calling it in a regular browser
 * tab is a harmless no-op most browsers silently ignore/auto-deny. Safe to
 * call from every layout mount (idempotent — repeated calls are fine, the
 * browser just re-answers the same permission-less check).
 */
export function requestPersistentStorageIfStandalone(): void {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return;
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (!isStandalone) return;
  navigator.storage?.persist?.().catch(() => {
    // Best-effort only — a rejected/unsupported persist() must not affect
    // the rest of the app (progress-store already degrades gracefully).
  });
}
