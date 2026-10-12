// Tests for src/lib/progress-sync.ts — fetch, clock, storage, document are all
// injected; vi fake timers drive debounce/maxWait/timeouts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgressStore } from '../src/lib/progress-store.ts';
import { createProgressSync } from '../src/lib/progress-sync.ts';
import { LAST_SYNCED_KEY } from '../src/lib/progress-sync-dirty.ts';

const A = 'kien-truc/chu-de/cache';
const B = 'kien-truc/chu-de/queue';

const json = (status, body) =>
  Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
const emptyRemote = { v: 2, lessons: {}, bookmarkMeta: {} };

/** Shared localStorage map; each "tab" gets a view that fires storage events in the others. */
function createDevice() {
  const map = new Map();
  const tabs = [];
  return {
    map,
    openTab() {
      const listeners = new Set();
      const tab = { listeners };
      tab.storage = {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem(k, v) {
          map.set(k, v);
          // Real browsers run a microtask checkpoint after EACH listener, so deliver every listener in its own task.
          let delay = 0;
          for (const other of tabs) if (other !== tab) for (const fn of other.listeners) setTimeout(() => fn({ key: k }), delay++);
        },
        removeItem: (k) => map.delete(k),
      };
      tab.eventTarget = {
        addEventListener: (_t, fn) => listeners.add(fn),
        removeEventListener: (_t, fn) => listeners.delete(fn),
      };
      tabs.push(tab);
      return tab;
    },
  };
}

function createEnv() {
  const handlers = { visibilitychange: [], pagehide: [], storage: [] };
  return {
    doc: { visibilityState: 'visible', addEventListener: (t, fn) => handlers[t].push(fn) },
    win: { addEventListener: (t, fn) => handlers[t].push(fn) },
    emit: (t) => handlers[t].forEach((fn) => fn()),
    handlers,
  };
}

/** routes: { 'GET /api/me': (init, call) => Promise<Response> } */
function createFetch(routes) {
  const calls = [];
  const fn = (url, init = {}) => {
    const key = `${init.method ?? 'GET'} ${url}`;
    const call = { key, init, body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    const route = routes[key];
    if (!route) return json(404, { code: 'bad_request' });
    return typeof route === "function" ? route(call) : route.then((r) => r.clone());
  };
  fn.calls = calls;
  fn.count = (key) => calls.filter((c) => c.key === key).length;
  return fn;
}

function make({ routes, device = createDevice(), tab = device.openTab(), env = createEnv(), known } = {}) {
  const store = createProgressStore({ storage: tab.storage, eventTarget: tab.eventTarget, now: () => Date.now() });
  const fetch = createFetch(routes);
  const sync = createProgressSync({
    store,
    fetch,
    now: () => Date.now(),
    storage: tab.storage,
    doc: env.doc,
    win: { addEventListener: (t, fn) => { env.win.addEventListener(t, fn); if (t === 'storage') tab.eventTarget.addEventListener('storage', (e) => fn(e)); } },
    getKnownIds: known ? async () => known : undefined,
  });
  const statuses = [];
  sync.subscribe((s) => statuses.push(s));
  return { store, fetch, sync, env, tab, device, statuses, last: () => statuses.at(-1) };
}

const signedInRoutes = (extra = {}) => ({
  'GET /api/me': json(200, { username: 'an' }),
  'GET /api/progress': json(200, emptyRemote),
  'PUT /api/progress': (call) => json(200, call.body),
  ...extra,
});

const settle = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('boot', () => {
  it('signed-out: exactly one GET /api/me and nothing else', async () => {
    const t = make({ routes: { 'GET /api/me': json(401, { code: 'unauthorized' }) } });
    await settle();
    t.store.markDone(A, true);
    await vi.advanceTimersByTimeAsync(60_000);
    t.env.emit('visibilitychange');
    await settle();
    expect(t.fetch.calls.map((c) => c.key)).toEqual(['GET /api/me']);
    expect(t.last()).toEqual({ kind: 'signed-out' });
    expect(t.statuses[0]).toEqual({ kind: 'checking' });
  });

  it('HTML 502 or network error -> unavailable (not signed-out); retries on visible', async () => {
    let up = false;
    const t = make({
      routes: {
        'GET /api/me': () => (up ? json(401, { code: 'unauthorized' }) : Promise.resolve(new Response('<html>Bad gateway</html>', { status: 502 }))),
      },
    });
    await settle();
    expect(t.last()).toEqual({ kind: 'unavailable' });
    up = true;
    t.env.emit('visibilitychange');
    await settle();
    expect(t.last()).toEqual({ kind: 'signed-out' });
    expect(t.fetch.count('GET /api/me')).toBe(2);
  });

  it('hung /api/me times out (~4s) -> unavailable', async () => {
    const hang = (_u, init) => new Promise((_res, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted'))));
    const t = make({ routes: { 'GET /api/me': (call) => hang(null, call.init) } });
    await vi.advanceTimersByTimeAsync(3900);
    expect(t.last()).toEqual({ kind: 'checking' });
    await vi.advanceTimersByTimeAsync(200);
    expect(t.last()).toEqual({ kind: 'unavailable' });
  });

  it('signed-in with matching owner: pulls and merges remote through migrate()', async () => {
    const device = createDevice();
    device.map.set('omnilab:v1:state', JSON.stringify({ v: 2, owner: 'an', lessons: {}, bookmarkMeta: {} }));
    const remote = { v: 2, lessons: { [A]: { done: true, doneAt: 5, doneUpdatedAt: 5 }, '../evil': { done: true } }, bookmarkMeta: { [B]: { on: true, at: 2 } } };
    const t = make({ device, routes: signedInRoutes({ 'GET /api/progress': json(200, remote) }) });
    await settle();
    expect(t.store.get().lessons[A].done).toBe(true);
    expect(t.store.get().lessons['../evil']).toBeUndefined();
    expect(t.store.get().bookmarks).toEqual([B]);
    expect(t.fetch.count('PUT /api/progress')).toBe(0);
    expect(t.last().kind).toBe('synced');
  });

  it('non-v2 pull body is rejected as an error and local data is untouched', async () => {
    const device = createDevice();
    device.map.set('omnilab:v1:state', JSON.stringify({ v: 2, owner: 'an', lessons: { [A]: { done: true, doneUpdatedAt: 3 } }, bookmarkMeta: {} }));
    const t = make({ device, routes: signedInRoutes({ 'GET /api/progress': json(200, { hello: 1 }) }) });
    await settle();
    expect(t.last()).toEqual({ kind: 'error', username: 'an', code: 'unavailable' });
    expect(t.store.get().lessons[A].done).toBe(true);
  });
});

describe('push', () => {
  async function signedIn(opts = {}) {
    const device = createDevice();
    device.map.set('omnilab:v1:state', JSON.stringify({ v: 2, owner: 'an', lessons: {}, bookmarkMeta: {} }));
    const t = make({ device, routes: signedInRoutes(opts.routes), known: opts.known });
    await settle();
    return t;
  }

  it('3 toggles within 3s -> one PUT', async () => {
    const t = await signedIn();
    t.store.markDone(A, true);
    await vi.advanceTimersByTimeAsync(1000);
    t.store.markDone(A, false);
    await vi.advanceTimersByTimeAsync(1000);
    t.store.toggleBookmark(B);
    await vi.advanceTimersByTimeAsync(2900);
    expect(t.fetch.count('PUT /api/progress')).toBe(0);
    await vi.advanceTimersByTimeAsync(200);
    expect(t.fetch.count('PUT /api/progress')).toBe(1);
    const sent = t.fetch.calls.find((c) => c.key === 'PUT /api/progress');
    expect(sent.init.headers['Content-Type']).toBe('application/json');
    expect(sent.body.owner).toBeUndefined();
  });

  it('continuous changes cannot postpone the push beyond maxWait (30s)', async () => {
    const t = await signedIn();
    for (let i = 0; i < 14; i++) {
      t.store.toggleBookmark(A);
      await vi.advanceTimersByTimeAsync(2500);
    }
    expect(t.fetch.count('PUT /api/progress')).toBeGreaterThanOrEqual(1);
  });

  it('scroll-only reading for 60s -> 0 PUT; hidden flushes scroll first then one keepalive PUT', async () => {
    const t = await signedIn();
    const order = [];
    const realFlush = t.store.flushScroll;
    t.store.flushScroll = (...a) => (order.push('flush'), realFlush(...a));
    t.store.visit(A);
    await vi.advanceTimersByTimeAsync(3500); // visit alone is a scroll/visit change: no push
    for (let i = 0; i < 60; i++) {
      t.store.saveScroll(A, i / 100);
      await vi.advanceTimersByTimeAsync(1000);
    }
    expect(t.fetch.count('PUT /api/progress')).toBe(0);
    t.store.saveScroll(A, 0.9); // pending throttled write
    t.env.doc.visibilityState = 'hidden';
    t.env.emit('visibilitychange');
    await settle();
    const puts = t.fetch.calls.filter((c) => c.key === 'PUT /api/progress');
    expect(order).toEqual(['flush']);
    expect(puts).toHaveLength(1);
    expect(puts[0].init.keepalive).toBe(true);
    expect(puts[0].body.lessons[A].scroll).toBe(0.9);
  });

  it('markDone while a PUT is in flight survives the response and is pushed next', async () => {
    let release;
    let n = 0;
    const t = await signedIn({
      routes: {
        'PUT /api/progress': (call) => {
          n++;
          if (n > 1) return json(200, call.body);
          return new Promise((res) => (release = () => res(new Response(JSON.stringify(call.body), { status: 200 }))));
        },
      },
    });
    t.store.toggleBookmark(B);
    await vi.advanceTimersByTimeAsync(3100); // PUT #1 in flight
    t.store.markDone(A, true);
    release();
    await settle();
    expect(t.store.get().lessons[A].done).toBe(true);
    await vi.advanceTimersByTimeAsync(3100);
    expect(n).toBe(2);
    expect(t.fetch.calls.at(-1).body.lessons[A].done).toBe(true);
  });

  it('only lesson ids present in lessons-index are sent', async () => {
    const t = await signedIn({ known: new Set([A]) });
    t.store.markDone(A, true);
    t.store.markDone('x/y/gone', true);
    await vi.advanceTimersByTimeAsync(3100);
    const body = t.fetch.calls.find((c) => c.key === 'PUT /api/progress').body;
    expect(Object.keys(body.lessons)).toEqual([A]);
    // unknown ids stay local and do not keep the state permanently dirty
    t.env.doc.visibilityState = 'hidden';
    t.env.emit('visibilitychange');
    await settle();
    expect(t.fetch.count('PUT /api/progress')).toBe(1);
    expect(t.store.get().lessons['x/y/gone'].done).toBe(true);
  });

  it('two tabs sharing storage: one change -> one PUT; tab B does not push, and sees the change', async () => {
    const device = createDevice();
    device.map.set('omnilab:v1:state', JSON.stringify({ v: 2, owner: 'an', lessons: {}, bookmarkMeta: {} }));
    const env = createEnv();
    // Slow PUT: tab B's own timer fires while A's request is still in flight (lastSyncedHash not yet updated).
    const slow = { 'PUT /api/progress': (call) => new Promise((res) => setTimeout(() => res(new Response(JSON.stringify(call.body))), 1000)) };
    const a = make({ device, env, routes: signedInRoutes(slow) });
    const b = make({ device, env: createEnv(), routes: signedInRoutes(slow) });
    await settle();
    a.store.markDone(A, true);
    await vi.advanceTimersByTimeAsync(5000);
    expect(a.fetch.count('PUT /api/progress') + b.fetch.count('PUT /api/progress')).toBe(1);
    expect(b.store.get().lessons[A].done).toBe(true);
    expect(device.map.get(LAST_SYNCED_KEY)).toBeTruthy();
  });

  it('413 -> error too_large and no retry', async () => {
    const t = await signedIn({ routes: { 'PUT /api/progress': json(413, { code: 'too_large' }) } });
    t.store.markDone(A, true);
    await vi.advanceTimersByTimeAsync(3100);
    expect(t.last()).toEqual({ kind: 'error', username: 'an', code: 'too_large' });
    t.store.markDone(B, true);
    t.env.emit('visibilitychange');
    await vi.advanceTimersByTimeAsync(40_000);
    expect(t.fetch.count('PUT /api/progress')).toBe(1);
  });

  it('5xx keeps data dirty and retries on the next visible; 401 -> signed-out, local data kept', async () => {
    let status = 503;
    let meUser = 'an';
    const t = await signedIn({
      routes: {
        'GET /api/me': () => (meUser ? json(200, { username: meUser }) : json(401, { code: 'unauthorized' })),
        'PUT /api/progress': (call) => (status === 200 ? json(200, call.body) : json(status, { code: 'busy' })),
      },
    });
    t.store.markDone(A, true);
    await vi.advanceTimersByTimeAsync(3100);
    expect(t.last()).toEqual({ kind: 'error', username: 'an', code: 'busy' });
    status = 200;
    await vi.advanceTimersByTimeAsync(6000);
    t.env.emit('visibilitychange');
    await vi.advanceTimersByTimeAsync(100);
    expect(t.fetch.count('PUT /api/progress')).toBe(2);
    expect(t.last().kind).toBe('synced');
    status = 401;
    meUser = null;
    t.store.markDone(B, true);
    await vi.advanceTimersByTimeAsync(3100);
    expect(t.last()).toEqual({ kind: 'signed-out' });
    expect(t.store.get().lessons[B].done).toBe(true);
  });
});

describe('visibility pull', () => {
  it('visible pulls remote changes (throttled) and merges them', async () => {
    const device = createDevice();
    device.map.set('omnilab:v1:state', JSON.stringify({ v: 2, owner: 'an', lessons: {}, bookmarkMeta: {} }));
    let remote = emptyRemote;
    const t = make({ device, routes: signedInRoutes({ 'GET /api/progress': () => json(200, remote) }) });
    await settle();
    remote = { v: 2, lessons: {}, bookmarkMeta: { [B]: { on: true, at: 9 } } };
    t.env.emit('visibilitychange');
    await settle();
    expect(t.fetch.count('GET /api/progress')).toBe(1); // within 5s of boot pull
    await vi.advanceTimersByTimeAsync(6000);
    t.env.emit('visibilitychange');
    await settle();
    expect(t.store.get().bookmarks).toEqual([B]);
    expect(t.fetch.count('PUT /api/progress')).toBe(0);
  });
});

describe('auth + owner rules', () => {
  const authRoutes = (name = 'an') =>
    signedInRoutes({
      'GET /api/me': json(401, { code: 'unauthorized' }),
      'POST /api/auth/login': json(200, { username: name }),
      'POST /api/auth/register': json(201, { username: name }),
      'POST /api/auth/logout': json(204),
      'POST /api/auth/logout-all': json(204),
    });

  it('login with empty owner: PUT local (merge), claim owner', async () => {
    const t = make({ routes: authRoutes() });
    await settle();
    t.store.markDone(A, true);
    const res = await t.sync.login('an', 'pw-12345678');
    expect(res).toEqual({ ok: true, username: 'an', needsMergeDecision: false });
    expect(t.fetch.count('PUT /api/progress')).toBe(1);
    expect(t.store.get().owner).toBe('an');
    const post = t.fetch.calls.find((c) => c.key === 'POST /api/auth/login');
    expect(post.init.headers['Content-Type']).toBe('application/json');
  });

  it('register sends confirm; wrong password maps the error code', async () => {
    const t = make({ routes: { ...authRoutes(), 'POST /api/auth/login': json(401, { code: 'bad_credentials' }) } });
    await settle();
    expect(await t.sync.register('an', 'pw-12345678', 'pw-12345678')).toMatchObject({ ok: true });
    expect(t.fetch.calls.find((c) => c.key === 'POST /api/auth/register').body).toEqual({ username: 'an', password: 'pw-12345678', confirm: 'pw-12345678' });
    expect(await t.sync.login('an', 'x')).toEqual({ ok: false, code: 'bad_credentials' });
  });

  it('login as a different owner: no PUT, needsMergeDecision; merge -> PUT + owner switch', async () => {
    const device = createDevice();
    device.map.set('omnilab:v1:state', JSON.stringify({ v: 2, owner: 'binh', lessons: { [A]: { done: true, doneUpdatedAt: 4 } }, bookmarkMeta: {} }));
    const t = make({ device, routes: authRoutes('an') });
    await settle();
    const res = await t.sync.login('an', 'pw-12345678');
    expect(res).toEqual({ ok: true, username: 'an', needsMergeDecision: true });
    expect(t.last()).toEqual({ kind: 'needs-merge-decision', username: 'an' });
    t.store.markDone(B, true);
    await vi.advanceTimersByTimeAsync(40_000);
    expect(t.fetch.count('PUT /api/progress')).toBe(0);
    await t.sync.resolveMerge('merge');
    expect(t.fetch.count('PUT /api/progress')).toBe(1);
    expect(t.store.get().owner).toBe('an');
    expect(t.last().kind).toBe('synced');
  });

  it('use-account: wipes local data then pulls the account state', async () => {
    const device = createDevice();
    device.map.set('omnilab:v1:state', JSON.stringify({ v: 2, owner: 'binh', lessons: { [A]: { done: true, doneUpdatedAt: 4 } }, bookmarkMeta: {} }));
    const remote = { v: 2, lessons: {}, bookmarkMeta: { [B]: { on: true, at: 3 } } };
    const t = make({ device, routes: { ...authRoutes('an'), 'GET /api/progress': json(200, remote) } });
    await settle();
    await t.sync.login('an', 'pw-12345678');
    await t.sync.resolveMerge('use-account');
    expect(t.store.get().lessons[A]).toBeUndefined();
    expect(t.store.get().bookmarks).toEqual([B]);
    expect(t.store.get().owner).toBe('an');
    expect(t.fetch.count('PUT /api/progress')).toBe(0);
  });

  it('boot with a live session but a different local owner also asks first', async () => {
    const device = createDevice();
    device.map.set('omnilab:v1:state', JSON.stringify({ v: 2, owner: 'binh', lessons: {}, bookmarkMeta: {} }));
    const t = make({ device, routes: signedInRoutes() });
    await settle();
    expect(t.last()).toEqual({ kind: 'needs-merge-decision', username: 'an' });
    expect(t.fetch.count('GET /api/progress')).toBe(0);
  });

  it('logout keeps data and owner; clearLocal wipes both; logout-all hits its endpoint', async () => {
    const t = make({ routes: authRoutes() });
    await settle();
    t.store.markDone(A, true);
    await t.sync.login('an', 'pw-12345678');
    await t.sync.logout();
    const logoutCall = t.fetch.calls.find((c) => c.key === 'POST /api/auth/logout');
    expect(logoutCall.init.headers['Content-Type']).toBe('application/json');
    expect(t.last()).toEqual({ kind: 'signed-out' });
    expect(t.store.get().owner).toBe('an');
    expect(t.store.get().lessons[A].done).toBe(true);
    await t.sync.login('an', 'pw-12345678');
    await t.sync.logout({ clearLocal: true });
    expect(t.store.get().lessons[A]).toBeUndefined();
    expect(t.store.get().owner).toBeUndefined();
    await t.sync.login('an', 'pw-12345678');
    await t.sync.logoutAll();
    expect(t.fetch.count('POST /api/auth/logout-all')).toBe(1);
  });

  it('failed logout (server down) stays signed in with an error status', async () => {
    const t = make({ routes: { ...authRoutes(), 'POST /api/auth/logout': json(503, { code: 'unavailable' }) } });
    await settle();
    await t.sync.login('an', 'pw-12345678');
    await t.sync.logout();
    expect(t.last()).toEqual({ kind: 'error', username: 'an', code: 'unavailable' });
  });
});

describe('listeners', () => {
  it('subscribe replays current status and unsubscribe stops updates', async () => {
    const t = make({ routes: { 'GET /api/me': json(401, { code: 'unauthorized' }) } });
    await settle();
    const seen = [];
    const off = t.sync.subscribe((s) => seen.push(s.kind));
    expect(seen).toEqual(['signed-out']);
    off();
    expect(seen).toHaveLength(1);
  });
});

describe('getProgressSync singleton', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns one instance with one listener set, and issues a single /api/me', async () => {
    const map = new Map();
    const localStorage = { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
    const added = [];
    const addEventListener = (type) => added.push(type);
    const fetchSpy = vi.fn(() => json(401, { code: 'unauthorized' }));
    vi.stubGlobal('window', { localStorage, addEventListener });
    vi.stubGlobal('document', { visibilityState: 'visible', addEventListener });
    vi.stubGlobal('fetch', fetchSpy);
    vi.resetModules();
    const { getProgressSync } = await import('../src/lib/progress-sync-singleton.ts');
    const first = getProgressSync();
    const second = getProgressSync();
    await settle();
    expect(second).toBe(first);
    expect(added.filter((t) => t === 'visibilitychange')).toHaveLength(1);
    expect(added.filter((t) => t === 'pagehide')).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/me');
  });
});

/** Stateful fake sidecar shared by tabs: one cookie user at a time, enforces X-Sync-User like the real server. */
function createServer(initialUser) {
  const server = { user: initialUser, state: { v: 2, lessons: {}, bookmarkMeta: {} }, puts: [] };
  const guard = (call, ok) => {
    if (!server.user || call.init.headers?.['X-Sync-User'] !== server.user) return json(401, { code: 'unauthorized' });
    return ok();
  };
  server.routes = {
    'GET /api/me': () => (server.user ? json(200, { username: server.user }) : json(401, { code: 'unauthorized' })),
    'GET /api/progress': (call) => guard(call, () => json(200, server.state)),
    'PUT /api/progress': (call) => guard(call, () => (server.puts.push({ user: server.user, call }), json(200, call.body))),
    'POST /api/auth/login': (call) => ((server.user = call.body.username), json(200, { username: server.user })),
    'POST /api/auth/logout': () => ((server.user = null), json(204)),
    'POST /api/auth/logout-all': () => ((server.user = null), json(204)),
  };
  return server;
}
const ownedBy = (owner, lessons = {}) => JSON.stringify({ v: 2, owner, lessons, bookmarkMeta: {} });

describe('account identity across tabs', () => {
  it('sends X-Sync-User on GET and PUT progress, keepalive included', async () => {
    const server = createServer('an');
    const device = createDevice();
    device.map.set('omnilab:v1:state', ownedBy('an'));
    const t = make({ device, routes: server.routes });
    await settle();
    t.store.markDone(A, true);
    t.env.doc.visibilityState = 'hidden';
    t.env.emit('visibilitychange');
    await settle();
    const progressCalls = t.fetch.calls.filter((c) => c.key.endsWith('/api/progress'));
    expect(progressCalls.length).toBeGreaterThanOrEqual(2);
    for (const c of progressCalls) expect(c.init.headers['X-Sync-User']).toBe('an');
  });

  it('stale tab after logout+login elsewhere: no merge, no PUT; it asks the owner question', async () => {
    const server = createServer('a');
    const device = createDevice();
    device.map.set('omnilab:v1:state', ownedBy('a', { [A]: { done: true, doneUpdatedAt: 5 } }));
    const tab1 = make({ device, routes: server.routes });
    const tab2 = make({ device, env: createEnv(), routes: server.routes });
    await settle();
    await tab1.sync.logout();
    expect(await tab1.sync.login('b', 'pw-12345678')).toMatchObject({ ok: true, needsMergeDecision: true });
    await vi.advanceTimersByTimeAsync(100);
    expect(tab2.last()).toEqual({ kind: 'needs-merge-decision', username: 'b' });
    tab2.store.markDone(B, true);
    tab2.env.emit('visibilitychange');
    await vi.advanceTimersByTimeAsync(40_000);
    expect(server.puts.filter((p) => p.user === 'b')).toHaveLength(0);
    expect(tab2.store.get().lessons[B]?.done).toBe(true);
    expect(tab2.store.get().owner).toBe('a');
  });

  it('even without the broadcast, a mismatching claim (401) triggers a re-check instead of a merge', async () => {
    const server = createServer('a');
    const device = createDevice();
    device.map.set('omnilab:v1:state', ownedBy('a', { [A]: { done: true, doneUpdatedAt: 5 } }));
    const t = make({ device, routes: server.routes });
    await settle();
    server.user = 'b'; // cookie switched in another tab, event lost
    await vi.advanceTimersByTimeAsync(6000);
    t.env.emit('visibilitychange');
    await settle();
    expect(t.last()).toEqual({ kind: 'needs-merge-decision', username: 'b' });
    expect(server.puts.filter((p) => p.user === 'b')).toHaveLength(0);
  });

  it('a signed-out tab learns about a login in another tab', async () => {
    const server = createServer(null);
    const device = createDevice();
    const tab1 = make({ device, routes: server.routes });
    const tab2 = make({ device, env: createEnv(), routes: server.routes });
    await settle();
    expect(tab2.last()).toEqual({ kind: 'signed-out' });
    await tab1.sync.login('an', 'pw-12345678');
    await vi.advanceTimersByTimeAsync(100);
    expect(tab2.last().kind).toBe('synced');
    expect(tab2.store.get().owner).toBe('an');
  });
});

describe('logout and sessions', () => {
  async function signedInTab(extra = {}) {
    const server = createServer('an');
    const device = createDevice();
    device.map.set('omnilab:v1:state', ownedBy('an'));
    const t = make({ device, routes: { ...server.routes, ...extra } });
    await settle();
    return { server, t };
  }

  it('logout pushes unsynced decisions first (cookie still valid), then clears when asked', async () => {
    const { server, t } = await signedInTab();
    t.store.markDone(A, true);
    await t.sync.logout({ clearLocal: true });
    const keys = t.fetch.calls.map((c) => c.key);
    expect(keys.indexOf('PUT /api/progress')).toBeGreaterThan(-1);
    expect(keys.indexOf('PUT /api/progress')).toBeLessThan(keys.indexOf('POST /api/auth/logout'));
    expect(server.puts[0].call.body.lessons[A].done).toBe(true);
    expect(t.store.get().lessons[A]).toBeUndefined();
  });

  it('clearLocal is aborted when the final push fails', async () => {
    const { t } = await signedInTab({ 'PUT /api/progress': json(503, { code: 'unavailable' }) });
    t.store.markDone(A, true);
    await t.sync.logout({ clearLocal: true });
    expect(t.fetch.count('POST /api/auth/logout')).toBe(0);
    expect(t.store.get().lessons[A].done).toBe(true);
  });

  it('logoutAll honours clearLocal; a too_large state does not block logout', async () => {
    const { t } = await signedInTab({ 'PUT /api/progress': json(413, { code: 'too_large' }) });
    t.store.markDone(A, true);
    await vi.advanceTimersByTimeAsync(3100);
    await t.sync.logoutAll({ clearLocal: true });
    expect(t.fetch.count('PUT /api/progress')).toBe(1);
    expect(t.fetch.count('POST /api/auth/logout-all')).toBe(1);
    expect(t.store.get().lessons[A]).toBeUndefined();
  });

  it('a response from a previous session is discarded', async () => {
    const server = createServer('an');
    const device = createDevice();
    device.map.set('omnilab:v1:state', ownedBy('an'));
    let release;
    const gated = (call) => new Promise((res) => (release = () => res(server.routes['PUT /api/progress'](call))));
    const t = make({ device, routes: { ...server.routes, 'PUT /api/progress': gated } });
    await settle();
    t.store.markDone(A, true);
    await vi.advanceTimersByTimeAsync(3100); // PUT in flight, held
    const hold = release;
    // Session ends and another account signs in while that PUT is still pending.
    server.user = 'bo';
    await t.sync.login('bo', 'pw-12345678');
    expect(t.last()).toEqual({ kind: 'needs-merge-decision', username: 'bo' });
    hold();
    await vi.advanceTimersByTimeAsync(100);
    expect(t.last()).toEqual({ kind: 'needs-merge-decision', username: 'bo' });
  });

  it('failed merge PUT keeps the decision pending without looping; retry works', async () => {
    const server = createServer(null);
    let fail = true;
    const device = createDevice();
    device.map.set('omnilab:v1:state', ownedBy('old', { [A]: { done: true, doneUpdatedAt: 5 } }));
    const put = (c) => (fail ? json(503, { code: 'unavailable' }) : server.routes['PUT /api/progress'](c));
    const t = make({ device, routes: { ...server.routes, 'PUT /api/progress': put } });
    await settle();
    await t.sync.login('neo', 'pw-12345678');
    await t.sync.resolveMerge('merge');
    expect(t.last()).toEqual({ kind: 'needs-merge-decision', username: 'neo' });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(t.fetch.count('PUT /api/progress')).toBe(1);
    fail = false;
    await t.sync.resolveMerge('merge');
    expect(t.last().kind).toBe('synced');
    expect(t.store.get().owner).toBe('neo');
  });

  it('login normalizes passwords to NFC', async () => {
    const t = make({ routes: { ...signedInRoutes(), 'GET /api/me': json(401, { code: 'unauthorized' }), 'POST /api/auth/login': json(200, { username: 'an' }) } });
    await settle();
    const nfd = 'phố-12345678'.normalize('NFD');
    await t.sync.login('an', nfd);
    const body = t.fetch.calls.find((c) => c.key === 'POST /api/auth/login').body;
    expect(body.password).toBe(nfd.normalize('NFC'));
    expect(body.password).not.toBe(nfd);
  });
});

describe('push edge cases', () => {
  async function signedInWith(state, extra = {}) {
    const device = createDevice();
    device.map.set('omnilab:v1:state', JSON.stringify({ v: 2, owner: 'an', ...state }));
    const t = make({ device, routes: signedInRoutes(extra) });
    await settle();
    return t;
  }

  it('hidden followed by pagehide sends one keepalive PUT per dirty generation', async () => {
    const t = await signedInWith({ lessons: {}, bookmarkMeta: {} });
    t.store.markDone(A, true);
    t.env.doc.visibilityState = 'hidden';
    t.env.emit('visibilitychange');
    t.env.emit('pagehide');
    await settle();
    expect(t.fetch.count('PUT /api/progress')).toBe(1);
  });

  it('a state too big for keepalive is not sent on hide; over 64KB is too_large without any request', async () => {
    const bookmarkMeta = {};
    for (let i = 0; i < 1180; i++) bookmarkMeta[`kien-truc/chu-de/bai-${String(i).padStart(5, '0')}`] = { on: true, at: i + 1 };
    const t = await signedInWith({ lessons: {}, bookmarkMeta });
    const bodySize = () => JSON.stringify(t.store.get().bookmarkMeta).length;
    expect(bodySize()).toBeGreaterThan(55_000);
    await vi.advanceTimersByTimeAsync(10_000);
    const baseline = t.fetch.count('PUT /api/progress');
    t.store.markDone(A, true);
    for (let i = 0; bodySize() < 62_500; i++) t.store.toggleBookmark(`kien-truc/chu-de/extra-${i}`);
    t.env.doc.visibilityState = 'hidden';
    t.env.emit('visibilitychange');
    await settle();
    expect(t.fetch.count('PUT /api/progress')).toBe(baseline);
    for (let i = 0; bodySize() < 66_000; i++) t.store.toggleBookmark(`kien-truc/chu-de/more-${i}`);
    await vi.advanceTimersByTimeAsync(3100);
    expect(t.fetch.count('PUT /api/progress')).toBe(baseline);
    expect(t.last()).toEqual({ kind: 'error', username: 'an', code: 'too_large' });
  });

  it('413 stops pushing but pulls continue', async () => {
    const t = await signedInWith({ lessons: {}, bookmarkMeta: {} }, { 'PUT /api/progress': json(413, { code: 'too_large' }) });
    t.store.markDone(A, true);
    await vi.advanceTimersByTimeAsync(3100);
    const pulls = t.fetch.count('GET /api/progress');
    await vi.advanceTimersByTimeAsync(6000);
    t.env.emit('visibilitychange');
    await settle();
    expect(t.fetch.count('GET /api/progress')).toBe(pulls + 1);
    expect(t.fetch.count('PUT /api/progress')).toBe(1);
  });

  it('a throwing status subscriber does not break the engine or other subscribers', async () => {
    const t = make({ routes: { 'GET /api/me': json(401, { code: 'unauthorized' }) } });
    const seen = [];
    expect(() =>
      t.sync.subscribe(() => {
        throw new Error('boom');
      }),
    ).not.toThrow();
    t.sync.subscribe((s) => seen.push(s.kind));
    await settle();
    expect(seen.at(-1)).toBe('signed-out');
  });
});
