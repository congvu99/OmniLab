// End-to-end tests for the sync sidecar: real server, random port, temp DB.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer } from '../server/sync/sync-server-entry.ts';
import { configFromEnv } from '../server/sync/sync-http-helpers.ts';

const SECRET = 's'.repeat(40);
const PASSWORD = 'hunter2-hunter2';
let dir;
let handle;
let base;
const logs = [];

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'omnilab-sync-'));
  handle = await startServer({
    dataDir: dir,
    secret: SECRET,
    port: 0,
    host: '127.0.0.1',
    cookieSecure: false,
    log: (line) => logs.push(line),
  });
  base = `http://127.0.0.1:${handle.port}`;
});

afterAll(async () => {
  await handle.close();
  rmSync(dir, { recursive: true, force: true });
});

async function call(method, path, { body, cookie, type = 'application/json', raw } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (body !== undefined || raw !== undefined) headers['content-type'] = type;
  const res = await fetch(base + path, {
    method,
    headers,
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const text = await res.text();
  return { res, status: res.status, json: text ? JSON.parse(text) : null };
}

function cookieOf(res) {
  return res.headers.get('set-cookie').split(';')[0];
}

let counter = 0;
async function register(name = `user${++counter}`) {
  const r = await call('POST', '/api/auth/register', {
    body: { username: name, password: PASSWORD, confirm: PASSWORD },
  });
  expect(r.status).toBe(201);
  return { name, cookie: cookieOf(r.res), r };
}

const lessonId = (n) => `dom/mod/l${String(n).padStart(5, '0')}`;
const bigState = (offset, count) => {
  const lessons = {};
  for (let i = 0; i < count; i++) {
    lessons[lessonId(offset + i)] = { done: true, doneAt: 5, doneUpdatedAt: 5, visitedAt: 5 };
  }
  return { v: 2, lessons, bookmarkMeta: {} };
};

describe('auth', () => {
  it('registers, sets a hardened cookie and serves /api/me', async () => {
    const { name, cookie, r } = await register();
    expect(r.json).toEqual({ username: name });
    const setCookie = r.res.headers.get('set-cookie');
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/SameSite=Lax/);
    expect(setCookie).toMatch(/Path=\/api/);
    expect(setCookie).toMatch(/Max-Age=15552000/);
    expect(setCookie).not.toMatch(/Secure/);
    const me = await call('GET', '/api/me', { cookie });
    expect(me.json).toEqual({ username: name });
  });

  it('rejects duplicates (409), bad input (400) and bad credentials (401)', async () => {
    const { name } = await register();
    const dup = await call('POST', '/api/auth/register', {
      body: { username: name, password: PASSWORD, confirm: PASSWORD },
    });
    expect([dup.status, dup.json]).toEqual([409, { code: 'username_taken' }]);
    const mismatch = await call('POST', '/api/auth/register', {
      body: { username: 'newbie', password: PASSWORD, confirm: 'other-pass-1' },
    });
    expect([mismatch.status, mismatch.json]).toEqual([400, { code: 'password_mismatch' }]);
    const badName = await call('POST', '/api/auth/register', {
      body: { username: 'a b', password: PASSWORD, confirm: PASSWORD },
    });
    expect([badName.status, badName.json]).toEqual([400, { code: 'invalid_username' }]);
    const shortPw = await call('POST', '/api/auth/register', {
      body: { username: 'newbie', password: 'short', confirm: 'short' },
    });
    expect([shortPw.status, shortPw.json]).toEqual([400, { code: 'invalid_password' }]);
    const bad = await call('POST', '/api/auth/login', { body: { username: name, password: 'wrong-password' } });
    expect([bad.status, bad.json]).toEqual([401, { code: 'bad_credentials' }]);
    const ghost = await call('POST', '/api/auth/login', { body: { username: 'nobody-here', password: PASSWORD } });
    expect([ghost.status, ghost.json]).toEqual([401, { code: 'bad_credentials' }]);
  });

  it('logs in and throttles repeated failures per username with Retry-After', async () => {
    const { name } = await register();
    const ok = await call('POST', '/api/auth/login', { body: { username: name, password: PASSWORD } });
    expect(ok.status).toBe(200);
    for (let i = 0; i < 3; i++) {
      const bad = await call('POST', '/api/auth/login', { body: { username: name, password: 'nope-nope-1' } });
      expect(bad.status).toBe(401);
    }
    await call('POST', '/api/auth/login', { body: { username: name, password: 'nope-nope-1' } });
    const blocked = await call('POST', '/api/auth/login', { body: { username: name, password: PASSWORD } });
    expect([blocked.status, blocked.json]).toEqual([429, { code: 'rate_limited' }]);
    expect(Number(blocked.res.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
  });

  it('throttles parallel wrong logins instead of letting a burst through', async () => {
    const { name } = await register();
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        call('POST', '/api/auth/login', { body: { username: name, password: 'nope-nope-1' } }),
      ),
    );
    expect(results.filter((r) => r.status === 429).length).toBeGreaterThanOrEqual(5);
    expect(results.filter((r) => r.status === 401).length).toBeLessThanOrEqual(5);
  });

  it('treats NFC and NFD forms of the same password as equal', async () => {
    const nfc = 'mật-khẩu-Việt-2024'.normalize('NFC');
    const nfd = nfc.normalize('NFD');
    expect(nfd).not.toBe(nfc);
    const name = `viet${++counter}`;
    const reg = await call('POST', '/api/auth/register', { body: { username: name, password: nfd, confirm: nfc } });
    expect(reg.status).toBe(201);
    const login = await call('POST', '/api/auth/login', { body: { username: name, password: nfc } });
    expect(login.status).toBe(200);
    const login2 = await call('POST', '/api/auth/login', { body: { username: name, password: nfd } });
    expect(login2.status).toBe(200);
  });

  it('401 without a cookie or with a forged one', async () => {
    expect((await call('GET', '/api/me')).status).toBe(401);
    expect((await call('GET', '/api/progress')).json).toEqual({ code: 'unauthorized' });
    expect((await call('GET', '/api/me', { cookie: 'omnilab_session=abc.def' })).status).toBe(401);
  });

  it('logout clears the cookie; logout-all invalidates older cookies', async () => {
    const { name, cookie } = await register();
    const second = await call('POST', '/api/auth/login', { body: { username: name, password: PASSWORD } });
    const cookie2 = cookieOf(second.res);
    const out = await call('POST', '/api/auth/logout', { body: {} });
    expect(out.status).toBe(204);
    expect(out.res.headers.get('set-cookie')).toMatch(/Max-Age=0/);
    expect((await call('POST', '/api/auth/logout-all', { body: {} })).status).toBe(401);
    expect((await call('POST', '/api/auth/logout-all', { cookie, body: {} })).status).toBe(204);
    expect((await call('GET', '/api/me', { cookie })).status).toBe(401);
    expect((await call('GET', '/api/me', { cookie: cookie2 })).status).toBe(401);
  });
});

describe('progress', () => {
  it('register -> put -> get returns the stored state without owner', async () => {
    const { cookie } = await register();
    expect((await call('GET', '/api/progress', { cookie })).json).toEqual({ v: 2, lessons: {}, bookmarkMeta: {} });
    const put = await call('PUT', '/api/progress', {
      cookie,
      body: {
        v: 2,
        owner: 'evil',
        lessons: { 'a/b/c': { done: true, doneAt: 5, doneUpdatedAt: 5 } },
        bookmarkMeta: { 'a/b/c': { on: true, at: 4 } },
        bookmarks: ['x'],
      },
    });
    expect(put.status).toBe(200);
    const got = await call('GET', '/api/progress', { cookie });
    expect(got.json).toEqual({
      v: 2,
      lessons: { 'a/b/c': { done: true, doneAt: 5, doneUpdatedAt: 5 } },
      bookmarkMeta: { 'a/b/c': { on: true, at: 4 } },
    });
  });

  it('merges interleaved writes from two devices', async () => {
    const { cookie } = await register();
    await call('PUT', '/api/progress', {
      cookie,
      body: { v: 2, lessons: { 'a/b/one': { done: true, doneAt: 5, doneUpdatedAt: 5 } }, bookmarkMeta: {} },
    });
    const second = await call('PUT', '/api/progress', {
      cookie,
      body: {
        v: 2,
        lessons: { 'a/b/two': { scroll: 0.5, visitedAt: 7 } },
        bookmarkMeta: { 'a/b/two': { on: true, at: 8 } },
      },
    });
    expect(Object.keys(second.json.lessons).sort()).toEqual(['a/b/one', 'a/b/two']);
    expect(second.json.bookmarkMeta['a/b/two']).toEqual({ on: true, at: 8 });
    expect((await call('GET', '/api/progress', { cookie })).json).toEqual(second.json);
  });

  it('keeps users isolated', async () => {
    const a = await register();
    const b = await register();
    await call('PUT', '/api/progress', { cookie: a.cookie, body: bigState(0, 3) });
    expect((await call('GET', '/api/progress', { cookie: b.cookie })).json.lessons).toEqual({});
  });

  it('clamps future timestamps to now', async () => {
    const { cookie } = await register();
    const before = Date.now();
    const far = Date.now() + 10 * 86_400_000;
    const put = await call('PUT', '/api/progress', {
      cookie,
      body: {
        v: 2,
        lessons: { 'a/b/c': { done: true, doneAt: far, doneUpdatedAt: far, visitedAt: far } },
        bookmarkMeta: { 'a/b/c': { on: true, at: far } },
      },
    });
    const l = put.json.lessons['a/b/c'];
    for (const v of [l.doneAt, l.doneUpdatedAt, l.visitedAt, put.json.bookmarkMeta['a/b/c'].at]) {
      expect(v).toBeGreaterThanOrEqual(before);
      expect(v).toBeLessThanOrEqual(Date.now());
    }
  });

  it('drops __proto__ and invalid ids', async () => {
    const { cookie } = await register();
    const raw =
      '{"v":2,"lessons":{"__proto__":{"done":true},"bad id":{"done":true},"a/b/ok":{"done":true,"doneUpdatedAt":1}},"bookmarkMeta":{"__proto__":{"on":true,"at":1}}}';
    const put = await call('PUT', '/api/progress', { cookie, raw });
    expect(put.status).toBe(200);
    expect(Object.keys(put.json.lessons)).toEqual(['a/b/ok']);
    expect(put.json.bookmarkMeta).toEqual({});
    expect({}.done).toBeUndefined();
  });

  it('400 for non-v2 or malformed bodies', async () => {
    const { cookie } = await register();
    const v1 = await call('PUT', '/api/progress', { cookie, body: { v: 1, lessons: {}, bookmarks: [] } });
    expect(v1.status).toBe(400);
    expect((await call('PUT', '/api/progress', { cookie, raw: '{nope' })).status).toBe(400);
    expect((await call('PUT', '/api/progress', { cookie, body: [] })).status).toBe(400);
  });

  it('413 for a >64KB body and for a merged state >64KB', async () => {
    const { cookie } = await register();
    const huge = await call('PUT', '/api/progress', { cookie, raw: JSON.stringify(bigState(0, 1200)) });
    expect([huge.status, huge.json]).toEqual([413, { code: 'too_large' }]);
    const firstBody = JSON.stringify(bigState(0, 600));
    expect(firstBody.length).toBeLessThan(65536);
    expect(firstBody.length).toBeGreaterThan(40000);
    const first = await call('PUT', '/api/progress', { cookie, raw: firstBody });
    expect(first.status).toBe(200);
    const second = await call('PUT', '/api/progress', { cookie, raw: JSON.stringify(bigState(10000, 600)) });
    expect([second.status, second.json]).toEqual([413, { code: 'too_large' }]);
    const stored = await call('GET', '/api/progress', { cookie });
    expect(Object.keys(stored.json.lessons)).toHaveLength(600);
  });

  it('413 JSON (not a reset) for a multi-megabyte body', async () => {
    const { cookie } = await register();
    const big = await call('PUT', '/api/progress', { cookie, raw: 'x'.repeat(3 * 1024 * 1024) });
    expect([big.status, big.json]).toEqual([413, { code: 'too_large' }]);
    expect((await call('GET', '/api/me', { cookie })).status).toBe(200);
  });

  it('415 for non-JSON content types on POST/PUT', async () => {
    const { cookie } = await register();
    const put = await call('PUT', '/api/progress', { cookie, raw: 'hello', type: 'text/plain' });
    expect([put.status, put.json]).toEqual([415, { code: 'unsupported_media' }]);
    const login = await call('POST', '/api/auth/login', { raw: 'a=b', type: 'application/x-www-form-urlencoded' });
    expect(login.status).toBe(415);
  });
});

describe('misc', () => {
  it('health, headers and unknown routes', async () => {
    const h = await call('GET', '/api/health');
    expect([h.status, h.json]).toEqual([200, { ok: true }]);
    for (const r of [h.res, (await call('GET', '/api/me')).res]) {
      expect(r.headers.get('cache-control')).toBe('no-store');
      expect(r.headers.get('vary')).toMatch(/Cookie/i);
      expect(r.headers.get('content-type')).toMatch(/^application\/json/);
    }
    expect((await call('GET', '/api/nope')).status).toBe(404);
  });

  it('never logs passwords, cookies or bodies', async () => {
    const { cookie } = await register();
    await call('PUT', '/api/progress', { cookie, body: bigState(0, 2) });
    const all = logs.join('\n');
    expect(logs.length).toBeGreaterThan(0);
    expect(all).not.toContain(PASSWORD);
    expect(all).not.toContain(cookie.split('=')[1]);
    expect(all).not.toContain('l00000');
    for (const line of logs) expect(() => JSON.parse(line)).not.toThrow();
  });

  it('10 parallel registers stay under 160MB RSS', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        call('POST', '/api/auth/register', {
          body: { username: `par-${i}-${Date.now()}`, password: PASSWORD, confirm: PASSWORD },
        }),
      ),
    );
    expect(results.every((r) => r.status === 201)).toBe(true);
    expect(process.memoryUsage().rss).toBeLessThan(160 * 1024 * 1024);
  });
});

describe('startup', () => {
  it('exits non-zero with a clear message when SESSION_SECRET is missing or short', () => {
    const entry = join(import.meta.dirname, '../server/sync/sync-server-entry.ts');
    for (const secret of [undefined, 'short']) {
      const env = { ...process.env, DATA_DIR: dir };
      delete env.SESSION_SECRET;
      if (secret) env.SESSION_SECRET = secret;
      const out = spawnSync(process.execPath, [entry], { env, encoding: 'utf8' });
      expect(out.status).not.toBe(0);
      expect(out.stderr).toMatch(/SESSION_SECRET/);
    }
  });
});

describe('configFromEnv', () => {
  const env = { SESSION_SECRET: 's'.repeat(40) };
  it('defaults to port 3000 in prod and 3001 with --dev', () => {
    expect(configFromEnv(env, false).port).toBe(3000);
    expect(configFromEnv(env, true).port).toBe(3001);
    expect(configFromEnv({ ...env, PORT: '4000' }, false).port).toBe(4000);
  });
});
