/**
 * What makes the sync engine push: a debounced scheduler (3 s quiet period,
 * 30 s hard cap) and a watcher that turns store changes into push requests.
 * Only user decisions (done / bookmarks) count; scroll and visit updates ride
 * along with the next push. Changes that arrived from ANOTHER tab (storage
 * event) never schedule a push here: that tab pushes them itself, and the
 * data stays dirty if it never does.
 */
import type { ProgressStore } from './progress-store';
import { decisionsKey } from './progress-sync-dirty';

const DEBOUNCE_MS = 3000;
const MAX_WAIT_MS = 30000;

export function createScheduler(fire: () => void) {
  let debounce: ReturnType<typeof setTimeout> | undefined;
  let maxWait: ReturnType<typeof setTimeout> | undefined;
  function clear() {
    clearTimeout(debounce);
    clearTimeout(maxWait);
    debounce = maxWait = undefined;
  }
  return {
    clear,
    schedule() {
      clearTimeout(debounce);
      const run = () => {
        clear();
        fire();
      };
      debounce = setTimeout(run, DEBOUNCE_MS);
      maxWait ??= setTimeout(run, MAX_WAIT_MS);
    },
  };
}

export interface ChangeWatcherOptions {
  store: ProgressStore;
  /** True while the engine itself is applying a remote snapshot. */
  isApplying: () => boolean;
  onLocalDecision: () => void;
}

export function watchLocalChanges(opts: ChangeWatcherOptions) {
  let prevKey = '';
  opts.store.subscribe((state, meta) => {
    const key = decisionsKey(state);
    if (key === prevKey) return;
    prevKey = key;
    // `meta.external` is set synchronously by the store, so no listener-ordering assumptions.
    if (!meta.external && !opts.isApplying()) opts.onLocalDecision();
  });
  return { markSeen: () => void (prevKey = decisionsKey(opts.store.get())) };
}
