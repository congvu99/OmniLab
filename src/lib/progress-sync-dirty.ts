/**
 * Dirty tracking for the sync engine. "Dirty" means the hash of the local
 * view differs from `lastSyncedHash`, which lives in localStorage so every
 * tab of the browser shares it. The view only contains lesson ids known to
 * this build, so ids from retired lessons never keep the state dirty.
 */
import { stateHash } from './progress-merge';
import type { ProgressState } from './progress-state';
import type { StorageLike } from './progress-store';

export const LAST_SYNCED_KEY = 'omnilab:v2:lastSyncedHash';
/** Written on every login/logout/merge decision; a `storage` event on it tells other tabs to re-check /api/me. */
export const SYNC_USER_KEY = 'omnilab:v2:syncUser';

export type Slice = Pick<ProgressState, 'lessons' | 'bookmarkMeta'>;

/** Hash of only the user decisions (done / bookmarks); scroll and visits are ignored. */
export function decisionsKey(s: Slice): string {
  const lessons: Slice['lessons'] = {};
  for (const [id, p] of Object.entries(s.lessons)) {
    if (p.doneUpdatedAt !== undefined || p.done !== undefined) lessons[id] = { done: p.done, doneAt: p.doneAt, doneUpdatedAt: p.doneUpdatedAt };
  }
  return stateHash({ lessons, bookmarkMeta: s.bookmarkMeta });
}

export function createDirtyTracker(storage: StorageLike | undefined) {
  let known: ReadonlySet<string> | undefined;
  let memoryLast: string | null = null;

  function view(state: Slice): Slice {
    if (!known) return { lessons: state.lessons, bookmarkMeta: state.bookmarkMeta };
    const keep = <T>(rec: Record<string, T>) => Object.fromEntries(Object.entries(rec).filter(([id]) => known!.has(id)));
    return { lessons: keep(state.lessons), bookmarkMeta: keep(state.bookmarkMeta) };
  }

  return {
    setKnownIds(ids: ReadonlySet<string> | undefined) {
      known = ids;
    },
    view,
    hashOf: (state: Slice) => stateHash(view(state)),
    readLast(): string | null {
      try {
        return storage?.getItem(LAST_SYNCED_KEY) ?? memoryLast;
      } catch {
        return memoryLast;
      }
    },
    writeLast(hash: string) {
      memoryLast = hash;
      try {
        storage?.setItem(LAST_SYNCED_KEY, hash);
      } catch {
        /* the in-memory copy is enough for this tab */
      }
    },
  };
}

const KNOWN_IDS_TIMEOUT_MS = 4000;

/** Resolve the known lesson ids, giving up (no filtering) on error or after a timeout so a slow index never blocks syncing. */
export async function loadKnownIds(load: (() => Promise<ReadonlySet<string> | undefined>) | undefined): Promise<ReadonlySet<string> | undefined> {
  if (!load) return undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => (timer = setTimeout(() => resolve(undefined), KNOWN_IDS_TIMEOUT_MS)));
  try {
    return await Promise.race([load().catch(() => undefined), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
