/**
 * Per-lesson scroll-ratio throttle (~1 write/second) — split out of
 * progress-store.ts per the >200-line modularization rule. Leading+trailing:
 * the first call after `throttleMs` of silence flushes immediately: any
 * calls inside the window update the pending ratio and get coalesced into
 * one flush at the end of the window (never buffers more than one pending
 * write per lesson id).
 */
export interface ScrollThrottleOptions {
  throttleMs: number;
  now: () => number;
  onFlush: (id: string, ratio: number) => void;
}

export interface ScrollThrottle {
  save(id: string, ratio: number): void;
  /**
   * Immediately flush any pending write(s) (bypassing the throttle window).
   * With no `id`, flushes every lesson that has a pending write — call this
   * before the page/tab is torn down (e.g. `astro:before-swap`, `pagehide`)
   * so the trailing up-to-`throttleMs` write is never silently lost.
   */
  flush(id?: string): void;
}

export function createScrollThrottle({ throttleMs, now, onFlush }: ScrollThrottleOptions): ScrollThrottle {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const pending = new Map<string, number>();
  const lastFlush = new Map<string, number>();

  function flushOne(id: string) {
    const timer = timers.get(id);
    if (timer !== undefined) clearTimeout(timer);
    timers.delete(id);
    const ratio = pending.get(id);
    pending.delete(id);
    if (ratio === undefined) return;
    lastFlush.set(id, now());
    onFlush(id, ratio);
  }

  return {
    save(id, ratio) {
      pending.set(id, ratio);
      const elapsed = now() - (lastFlush.get(id) ?? 0);
      if (elapsed >= throttleMs) {
        flushOne(id);
        return;
      }
      if (!timers.has(id)) {
        timers.set(id, setTimeout(() => flushOne(id), throttleMs - elapsed));
      }
    },

    flush(id) {
      if (id !== undefined) {
        flushOne(id);
        return;
      }
      for (const pendingId of [...pending.keys()]) flushOne(pendingId);
    },
  };
}
