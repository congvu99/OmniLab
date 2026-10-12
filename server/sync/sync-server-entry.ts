/**
 * Progress sync sidecar: plain node:http + node:sqlite, zero dependencies.
 * Routes, JSON body handling, error codes, config and graceful shutdown.
 * Run: `node server/sync/sync-server-entry.ts` (env: SESSION_SECRET, DATA_DIR,
 * PORT, HOST, COOKIE_SECURE) or `pnpm sync:dev`.
 */
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HttpError, configFromEnv, parseJson, readBody } from './sync-http-helpers.ts';
import type { SyncConfig } from './sync-http-helpers.ts';
import { MAX_STATE_BYTES } from '../../src/lib/progress-sync-types.ts';
import type { ErrorCode } from '../../src/lib/progress-sync-types.ts';
import { openStore, sanitizeIncoming } from './sync-sqlite-store.ts';
import type { UserRow } from './sync-sqlite-store.ts';
import {
  BusyError, createCap, createLimiter, createLoginThrottle,
  hashPassword, signSession, verifyPassword, verifySession,
} from './sync-auth.ts';
type Json = Record<string, unknown>;
const COOKIE = 'omnilab_session';
const COOKIE_MAX_AGE_S = 15_552_000; // 180 days
const USERNAME = /^[a-z0-9_.-]{3,32}$/;
export async function startServer(config: SyncConfig) {
  const log = config.log ?? ((line: string) => console.log(line));
  mkdirSync(join(config.dataDir, 'backups'), { recursive: true });
  const probe = join(config.dataDir, '.write-test');
  writeFileSync(probe, 'ok'); // fail fast if the volume is read-only
  rmSync(probe);
  const store = openStore(join(config.dataDir, 'omnilab.db'));
  const hashPool = createLimiter(2, 8);
  const throttle = createLoginThrottle();
  const registerCap = createCap(30, 3_600_000);

  const cookieAttrs = `HttpOnly; SameSite=Lax; Path=/api${config.cookieSecure ? '; Secure' : ''}`;
  const sessionCookie = (u: string, sv: number) =>
    `${COOKIE}=${signSession({ u, sv, exp: Date.now() + COOKIE_MAX_AGE_S * 1000 }, config.secret)}; ${cookieAttrs}; Max-Age=${COOKIE_MAX_AGE_S}`;
  const clearCookie = `${COOKIE}=; ${cookieAttrs}; Max-Age=0`;

  function authenticate(req: IncomingMessage): { username: string } {
    const match = /(?:^|;\s*)omnilab_session=([^;]+)/.exec(req.headers.cookie ?? '');
    const session = match ? verifySession(match[1], config.secret) : null;
    const user = session ? store.getUser(session.u) : undefined;
    if (!session || !user || user.session_version !== session.sv) throw new HttpError(401, 'unauthorized');
    return { username: user.username };
  }

  function credentials(body: unknown): { username: string; password: string; confirm: unknown } {
    const b = (body && typeof body === 'object' ? body : {}) as Json;
    const username = typeof b.username === 'string' ? b.username.trim().toLowerCase() : '';
    // NFC so Unikey/macOS/Windows input methods yield the same password.
    const nfc = (v: unknown) => (typeof v === 'string' ? v.normalize('NFC') : undefined);
    return { username, password: nfc(b.password) ?? '', confirm: nfc(b.confirm) };
  }

  const hash = (password: string) => hashPool.run(() => hashPassword(password));

  async function register(body: unknown): Promise<[number, Json, string]> {
    const { username, password, confirm } = credentials(body);
    if (!USERNAME.test(username)) throw new HttpError(400, 'invalid_username');
    if (password.length < 8 || password.length > 128) throw new HttpError(400, 'invalid_password');
    if (confirm !== password) throw new HttpError(400, 'password_mismatch');
    if (store.getUser(username)) throw new HttpError(409, 'username_taken');
    const passHash = await hash(password);
    if (!registerCap.take()) throw new HttpError(429, 'rate_limited', { 'Retry-After': '3600' });
    if (!store.createUser(username, passHash, Date.now())) throw new HttpError(409, 'username_taken');
    return [201, { username }, sessionCookie(username, 1)];
  }

  async function login(body: unknown): Promise<[number, Json, string]> {
    const { username, password } = credentials(body);
    const key = username.slice(0, 64);
    const wait = throttle.begin(key);
    if (wait > 0) throw new HttpError(429, 'rate_limited', { 'Retry-After': String(wait) });
    let ok = false;
    let user: UserRow | undefined;
    try {
      user = USERNAME.test(username) ? store.getUser(username) : undefined;
      ok = await hashPool.run(() => verifyPassword(password, user?.pass_hash ?? null));
    } catch (err) {
      throttle.cancel(key);
      throw err;
    }
    if (!user || !ok) {
      throttle.fail(key);
      throw new HttpError(401, 'bad_credentials');
    }
    throttle.success(key);
    return [200, { username }, sessionCookie(user.username, user.session_version)];
  }

  async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = req.method ?? 'GET';
    const path = new URL(req.url ?? '/', 'http://x').pathname;
    const send = (status: number, body?: unknown, headers: Record<string, string | string[]> = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Cookie', ...headers });
      res.end(status === 204 || body === undefined ? undefined : JSON.stringify(body));
    };

    if ((method === 'POST' || method === 'PUT') && !/^application\/json\s*(;|$)/i.test(req.headers['content-type'] ?? '')) {
      throw new HttpError(415, 'unsupported_media');
    }
    const key = `${method} ${path}`;
    switch (key) {
      case 'GET /api/health':
        return send(200, { ok: store.ping() });
      case 'POST /api/auth/register': {
        const [status, body, cookie] = await register(parseJson(await readBody(req)));
        return send(status, body, { 'Set-Cookie': cookie });
      }
      case 'POST /api/auth/login': {
        const [status, body, cookie] = await login(parseJson(await readBody(req)));
        return send(status, body, { 'Set-Cookie': cookie });
      }
      case 'POST /api/auth/logout':
        await readBody(req);
        return send(204, undefined, { 'Set-Cookie': clearCookie });
      case 'POST /api/auth/logout-all': {
        await readBody(req);
        store.bumpSessionVersion(authenticate(req).username);
        return send(204, undefined, { 'Set-Cookie': clearCookie });
      }
      case 'GET /api/me':
        return send(200, { username: authenticate(req).username });
      case 'GET /api/progress':
        return send(200, store.getProgress(authenticate(req).username));
      case 'PUT /api/progress': {
        const { username } = authenticate(req);
        const now = Date.now();
        const incoming = sanitizeIncoming(parseJson(await readBody(req)), now);
        if (!incoming) throw new HttpError(400, 'bad_request');
        const merged = store.mergeProgress(username, incoming, now, MAX_STATE_BYTES);
        if (merged === 'too_large') throw new HttpError(413, 'too_large');
        return send(200, merged);
      }
      default:
        throw new HttpError(404, 'bad_request');
    }
  }

  const server = createServer((req, res) => {
    const started = Date.now();
    res.on('finish', () => {
      const path = (req.url ?? '').split('?')[0];
      log(JSON.stringify({ t: new Date().toISOString(), method: req.method, path, status: res.statusCode, ms: Date.now() - started }));
    });
    route(req, res).catch((err: unknown) => {
      let status = 503;
      let code: ErrorCode = 'unavailable';
      let headers: Record<string, string> = {};
      if (err instanceof HttpError) ({ status, code, headers } = err);
      else if (err instanceof BusyError) [status, code, headers] = [503, 'busy', { 'Retry-After': '2' }];
      else console.error(JSON.stringify({ level: 'error', message: err instanceof Error ? err.message : String(err) }));
      if (res.headersSent) return void res.destroy();
      if (headers.Connection === 'close') {
        // Let the client finish sending (discarded) so it can read the 413, then drop the socket.
        req.resume();
        res.on('finish', () => setTimeout(() => req.destroy(), 3000).unref());
      }
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Cookie', ...headers });
      res.end(JSON.stringify({ code }));
    });
  });
  server.headersTimeout = 10_000;
  server.requestTimeout = 15_000;
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, config.host, resolve);
  });

  return {
    port: (server.address() as { port: number }).port,
    store,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => {
          store.close();
          resolve();
        });
        server.closeAllConnections();
      }),
  };
}

if (import.meta.main) {
  try {
    // --dev: local defaults (./.data, http cookies, throwaway secret) for `pnpm sync:dev`.
    const config = configFromEnv(process.env, process.argv.includes('--dev'));
    const handle = await startServer(config);
    console.log(JSON.stringify({ level: 'info', message: `sync listening on ${config.host}:${handle.port}` }));
    const stop = () => void handle.close().then(() => process.exit(0));
    process.on('SIGTERM', stop);
    process.on('SIGINT', stop);
  } catch (err) {
    console.error(`sync server failed to start: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
