/**
 * Client sync engine: keeps the localStorage-backed progressStore in step with
 * the sync sidecar (/api/*); inert until /api/me reports a session.
 * Dirty = stateHash(local view) !== shared lastSyncedHash. Remote payloads go
 * through migrate() then store.applyRemote() (merge, never replace). Data owned
 * by another account is never auto-merged ('needs-merge-decision'). Progress
 * requests carry X-Sync-User, and login/logout are broadcast to other tabs
 * (SYNC_USER_KEY), so a tab holding a stale identity can never touch another
 * account's data. Pull/push live in progress-sync-transfer.ts.
 */
import { createDirtyTracker, loadKnownIds, SYNC_USER_KEY } from './progress-sync-dirty';
import { createStatusChannel } from './progress-sync-status';
import { createTransfer, type SyncSession } from './progress-sync-transfer';
import type { CreateProgressSyncOptions, ProgressSync } from './progress-sync-contract';
import { createHttp, errorCodeOf, usernameOf } from './progress-sync-http';
import type { AuthResult } from './progress-sync-types';

export type { CreateProgressSyncOptions, ProgressSync };

const ME_TIMEOUT_MS = 4000;
const API_TIMEOUT_MS = 8000;
const MIN_PULL_GAP_MS = 5000;
const MAX_RECHECKS = 2;

export function createProgressSync(options: CreateProgressSyncOptions): ProgressSync {
  const { store } = options;
  const now = options.now ?? Date.now;
  const http = createHttp(options.fetch ?? ((input, init) => fetch(input, init)));
  const doc = options.doc ?? document;
  const win: NonNullable<CreateProgressSyncOptions['win']> = options.win ?? window;
  const dirty = createDirtyTracker(options.storage);
  const statusChannel = createStatusChannel({ kind: 'checking' });
  // Consecutive progress 401s while /api/me still succeeds (e.g. a proxy stripping X-Sync-User): stop re-checking.
  let unauthorizedRun = 0;
  const set: typeof statusChannel.set = (status) => {
    if (status.kind === 'synced') unauthorizedRun = 0;
    statusChannel.set(status);
  };
  const session: SyncSession = { epoch: 0, pendingMerge: false, halted: false, lastPullAt: -Infinity };
  let booting = 0;
  let broadcasts = 0;
  let knownLoaded: Promise<void> | undefined;

  const transfer = createTransfer({
    session,
    store,
    now,
    http,
    dirty,
    set,
    loadKnownIds: () => (knownLoaded ??= loadKnownIds(options.getKnownIds).then(dirty.setKnownIds)),
    onUnauthorized: () => {
      if (++unauthorizedRun <= MAX_RECHECKS) return recheck();
      if (session.username) set({ kind: 'error', username: session.username, code: 'unauthorized' });
    },
  });
  const { push, pull, canPush, canPull, isDirty } = transfer;

  function forgetIdentity() {
    transfer.reset();
    session.username = undefined;
    session.pendingMerge = session.halted = false;
  }
  function signedOut() {
    forgetIdentity();
    set({ kind: 'signed-out' });
  }
  /** Identity may have changed elsewhere: forget it and ask /api/me again. */
  function recheck() {
    forgetIdentity();
    void boot();
  }
  function broadcastUser(name: string) {
    try {
      options.storage?.setItem(SYNC_USER_KEY, `${name}|${now()}|${++broadcasts}`);
    } catch {
      /* other tabs then learn on their next 401 */
    }
  }

  /** Signed in as `name`: first contact decides between pull, merge-PUT and asking the user. Returns true if the user must decide. */
  async function reconcile(name: string, viaLogin: boolean): Promise<boolean> {
    transfer.reset();
    session.username = name;
    session.halted = false;
    const owner = store.get().owner;
    session.pendingMerge = owner !== undefined && owner !== name;
    if (session.pendingMerge) set({ kind: 'needs-merge-decision', username: name });
    else if (owner === name && !viaLogin) await pull();
    else await push({ force: true });
    return session.pendingMerge;
  }

  async function boot() {
    const ep = session.epoch;
    booting++;
    try {
      const res = await http('/api/me', { timeoutMs: ME_TIMEOUT_MS });
      if (ep !== session.epoch) return;
      const name = res.status === 200 ? usernameOf(res.json) : undefined;
      if (name) await reconcile(name, false);
      else if (res.status === 401 && res.json && typeof res.json === 'object') signedOut();
      else set({ kind: 'unavailable' });
    } finally {
      booting--;
    }
  }

  async function auth(path: string, payload: Record<string, string>): Promise<AuthResult> {
    // NFC so Unikey/macOS/Windows input methods yield the same password (the server does the same).
    for (const key of ['password', 'confirm']) if (key in payload) payload[key] = payload[key].normalize('NFC');
    const res = await http(path, { method: 'POST', body: payload, timeoutMs: API_TIMEOUT_MS });
    const name = res.status === 200 || res.status === 201 ? usernameOf(res.json) : undefined;
    if (!name) return { ok: false, code: errorCodeOf(res.json, res.status === 0 || res.status >= 500 ? 'unavailable' : 'bad_request') };
    broadcastUser(name);
    return { ok: true, username: name, needsMergeDecision: await reconcile(name, true) };
  }

  async function endSession(path: string, clearLocal: boolean, claimUser = false) {
    store.flushScroll();
    // Send unsynced decisions while the cookie is still valid; never wipe data that did not make it (a halted too_large state cannot push, so it is excepted).
    // An in-flight push carries an older body: keep pushing until nothing is left (or it fails).
    for (let tries = 0; tries < 3 && canPush() && isDirty(); tries++) await push({});
    if (clearLocal && canPush() && isDirty()) {
      if (session.username) set({ kind: 'error', username: session.username, code: 'unavailable' });
      return;
    }
    // logout-all affects the account, so it must name the account this tab believes in.
    const res = await http(path, { method: 'POST', body: {}, user: claimUser ? session.username : undefined, timeoutMs: API_TIMEOUT_MS });
    if (res.status !== 204 && res.status !== 401) {
      if (session.username) set({ kind: 'error', username: session.username, code: errorCodeOf(res.json, 'unavailable') });
      return;
    }
    if (clearLocal) store.clear();
    signedOut();
    broadcastUser('');
  }

  async function resolveMerge(choice: 'merge' | 'use-account') {
    const name = session.username;
    if (!name || !session.pendingMerge) return;
    const ep = session.epoch;
    session.pendingMerge = false;
    if (choice === 'use-account') store.clear();
    const ok = choice === 'merge' ? await push({ force: true, takeOwner: true }) : await pull(true);
    if (ok) return broadcastUser(name);
    if (ep !== session.epoch) return;
    // Failed: keep the question open (no timers, no retry loop) so the user can try again.
    session.pendingMerge = true;
    set({ kind: 'needs-merge-decision', username: name });
  }

  function onHidden() {
    store.flushScroll();
    void push({ keepalive: true });
  }

  doc.addEventListener('visibilitychange', () => {
    if (doc.visibilityState === 'hidden') return onHidden();
    if (statusChannel.get().kind === 'unavailable') {
      if (!booting) void boot();
    } else if (canPull() && now() - session.lastPullAt >= MIN_PULL_GAP_MS) void pull();
  });
  win.addEventListener('pagehide', onHidden);
  win.addEventListener('storage', (e) => e?.key === SYNC_USER_KEY && recheck());
  void boot();

  return {
    register: (u, p, c) => auth('/api/auth/register', { username: u, password: p, confirm: c }),
    login: (u, p) => auth('/api/auth/login', { username: u, password: p }),
    resolveMerge,
    logout: (opts) => endSession('/api/auth/logout', opts?.clearLocal === true),
    logoutAll: (opts) => endSession('/api/auth/logout-all', opts?.clearLocal === true, true),
    subscribe: statusChannel.subscribe,
  };
}
