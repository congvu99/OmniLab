/**
 * Pull/push half of the sync engine (see progress-sync.ts for session and
 * auth handling). Works on a shared mutable `SyncSession` owned by the engine.
 * Every request captures the session epoch first and drops its response if
 * the epoch moved (logout / account switch) while it was in flight.
 */
import { migrate, toSyncState } from './progress-state';
import type { ProgressStore } from './progress-store';
import type { createDirtyTracker } from './progress-sync-dirty';
import { errorCodeOf, type HttpResult, type createHttp } from './progress-sync-http';
import { createScheduler, watchLocalChanges } from './progress-sync-triggers';
import { MAX_STATE_BYTES, type SyncStatus } from './progress-sync-types';

const API_TIMEOUT_MS = 8000;
// Browsers cap the total in-flight keepalive body size at 64 KB; stay well under it.
const KEEPALIVE_MAX_BYTES = 60 * 1024;

export interface SyncSession {
  epoch: number; // bumped whenever the session changes; older responses are dropped
  username?: string;
  pendingMerge: boolean;
  halted: boolean; // 413: stop pushing (pulls continue) until reload
  lastPullAt: number;
}

export interface TransferDeps {
  session: SyncSession;
  store: ProgressStore;
  now: () => number;
  http: ReturnType<typeof createHttp>;
  dirty: ReturnType<typeof createDirtyTracker>;
  set: (status: SyncStatus) => void;
  loadKnownIds: () => Promise<void>;
  /** Server said 401: the identity this tab believes in is no longer the cookie's. */
  onUnauthorized: () => void;
}

export function createTransfer(deps: TransferDeps) {
  const { session: s, store, now, http, dirty, set } = deps;
  const { view, hashOf, readLast, writeLast } = dirty;
  let flight: Promise<boolean> | undefined;
  let again = false;
  let applying = false;
  let lastKeepalive: string | undefined;

  const canPull = () => s.username !== undefined && !s.pendingMerge;
  const canPush = () => canPull() && !s.halted;
  const isDirty = () => hashOf(store.get()) !== readLast();
  const scheduler = createScheduler(() => void push({}));
  const watcher = watchLocalChanges({ store, isApplying: () => applying, onLocalDecision: () => canPush() && isDirty() && scheduler.schedule() });

  /** The session changed: forget in-flight work and pending timers. */
  function reset() {
    s.epoch++;
    flight = undefined;
    again = false;
    scheduler.clear();
  }

  /** Parse + validate a remote state and merge it into the store; false if the body is not a v2 state. */
  function applyRemoteJson(json: unknown, takeOwner: boolean): boolean {
    if (!json || typeof json !== 'object' || (json as { v?: unknown }).v !== 2) return false;
    const remote = migrate(json);
    applying = true;
    try {
      store.applyRemote(remote);
      if (s.username && (takeOwner || store.get().owner === undefined)) store.setOwner(s.username);
    } finally {
      applying = false;
    }
    writeLast(hashOf(remote));
    watcher.markSeen();
    return true;
  }

  /** Response handling shared by pull/push (caller already checked the epoch). True = state applied. */
  function handleResult(res: HttpResult, takeOwner = false): boolean {
    if (res.status === 200 && applyRemoteJson(res.json, takeOwner)) {
      set({ kind: 'synced', username: s.username!, at: now() });
      return true;
    }
    lastKeepalive = undefined;
    if (res.status === 401) return deps.onUnauthorized(), false;
    s.halted ||= res.status === 413;
    const code = res.status === 413 ? 'too_large' : errorCodeOf(res.json, 'unavailable');
    return set({ kind: 'error', username: s.username!, code }), false;
  }

  async function doPush(opts: { keepalive?: boolean; takeOwner?: boolean }, ep: number): Promise<boolean> {
    await deps.loadKnownIds();
    if (ep !== s.epoch) return false;
    const body = toSyncState({ v: 2, ...view(store.get()) });
    const size = JSON.stringify(body).length;
    if (size > MAX_STATE_BYTES) {
      s.halted = true;
      return set({ kind: 'error', username: s.username!, code: 'too_large' }), false;
    }
    if (opts.keepalive) {
      // One keepalive per dirty generation (hidden + pagehide), and none that could exceed the browser quota.
      const hash = hashOf(store.get());
      if (size > KEEPALIVE_MAX_BYTES || hash === lastKeepalive) return false;
      lastKeepalive = hash;
    }
    set({ kind: 'syncing', username: s.username! });
    const res = await http('/api/progress', { method: 'PUT', body, user: s.username, timeoutMs: API_TIMEOUT_MS, keepalive: opts.keepalive });
    if (ep !== s.epoch) return false;
    const ok = handleResult(res, opts.takeOwner);
    if (ok && again && isDirty()) scheduler.schedule();
    again = false;
    return ok;
  }

  function push(opts: { force?: boolean; keepalive?: boolean; takeOwner?: boolean }): Promise<boolean> {
    if (!canPush() || (!opts.force && !isDirty())) return Promise.resolve(false);
    if (flight && !opts.keepalive) {
      again = true;
      return flight;
    }
    const run = doPush(opts, s.epoch);
    if (!opts.keepalive) {
      const own = (flight = run);
      void run.finally(() => flight === own && (flight = undefined));
    }
    return run;
  }

  async function pull(takeOwner = false): Promise<boolean> {
    if (!canPull()) return false;
    const ep = s.epoch;
    await deps.loadKnownIds();
    if (ep !== s.epoch) return false;
    s.lastPullAt = now();
    set({ kind: 'syncing', username: s.username! });
    const res = await http('/api/progress', { user: s.username, timeoutMs: API_TIMEOUT_MS });
    if (ep !== s.epoch) return false;
    const ok = handleResult(res, takeOwner);
    if (ok && isDirty()) await push({});
    return ok;
  }

  return { push, pull, reset, canPull, canPush, isDirty };
}
