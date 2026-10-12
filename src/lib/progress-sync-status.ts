/** Tiny observable holding the current SyncStatus (replays the value to new subscribers). */
import type { SyncStatus } from './progress-sync-types';

/** A throwing subscriber must not break the engine or the other subscribers. */
function safeCall(fn: (s: SyncStatus) => void, status: SyncStatus) {
  try {
    fn(status);
  } catch (err) {
    console.error('progress-sync subscriber failed', err);
  }
}

export function createStatusChannel(initial: SyncStatus) {
  let current = initial;
  const listeners = new Set<(s: SyncStatus) => void>();
  return {
    get: () => current,
    set(next: SyncStatus) {
      current = next;
      for (const fn of listeners) safeCall(fn, current);
    },
    subscribe(fn: (s: SyncStatus) => void) {
      listeners.add(fn);
      safeCall(fn, current);
      return () => listeners.delete(fn);
    },
  };
}
