/**
 * Pure decision logic for the reader's auto-hiding mobile dock. No DOM here:
 * dock-autohide-binding.ts feeds scroll positions in and applies the result.
 *
 * Rules (thresholds in DOCK_AUTOHIDE):
 *  - near the top of the page, or within `nearEndPx` of the end: always shown
 *  - scrolling down past `hideAfterPx`: hidden (after `jitterPx` of travel)
 *  - scrolling up by >= `revealDelta` from the last direction reversal: shown
 */
export const DOCK_AUTOHIDE = {
  topZonePx: 8,
  hideAfterPx: 80,
  revealDeltaPx: 24,
  nearEndPx: 400,
  jitterPx: 4,
} as const;

export interface DockScrollState {
  hidden: boolean;
  /** Scroll position seen on the previous step. */
  lastY: number;
  /** Position where the scroll direction last reversed. */
  anchorY: number;
  /** -1 up, 1 down, 0 not yet moved. */
  dir: -1 | 0 | 1;
}

export function createDockScrollState(y = 0): DockScrollState {
  return { hidden: false, lastY: y, anchorY: y, dir: 0 };
}

/**
 * Next state for a scroll sample. `y` is clamped to [0, maxY] so iOS
 * rubber-banding (negative / past-the-end scroll) never flips the dock.
 */
export function stepDockScroll(
  prev: DockScrollState,
  rawY: number,
  maxY: number,
  cfg = DOCK_AUTOHIDE,
): DockScrollState {
  const top = Math.max(0, Number.isFinite(maxY) ? maxY : 0);
  const y = Math.min(Math.max(0, Number.isFinite(rawY) ? rawY : 0), top);
  const dy = y - prev.lastY;

  const forceShow = y <= cfg.topZonePx || top - y < cfg.nearEndPx;
  if (dy === 0) {
    return forceShow && prev.hidden ? { ...prev, hidden: false } : prev;
  }

  const dir: -1 | 1 = dy > 0 ? 1 : -1;
  const anchorY = dir !== prev.dir ? prev.lastY : prev.anchorY;
  let hidden = prev.hidden;

  if (forceShow) {
    hidden = false;
  } else if (dir === 1) {
    if (y > cfg.hideAfterPx && y - anchorY >= cfg.jitterPx) hidden = true;
  } else if (anchorY - y >= cfg.revealDeltaPx) {
    hidden = false;
  }

  return { hidden, lastY: y, anchorY, dir };
}
