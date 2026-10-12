/**
 * Auth primitives for the sync sidecar: scrypt hashing behind a concurrency
 * limiter, HMAC-signed session cookies, per-username login throttle and a
 * global registration cap. Pure Node (crypto only), no I/O besides hashing.
 */
import { randomBytes, scrypt, createHmac, timingSafeEqual } from 'node:crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 32;
// 128 * N * r = 16 MiB working set; give scrypt headroom above its 32 MiB default.
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

export class BusyError extends Error {
  constructor() {
    super('hash queue full');
  }
}

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LEN, { N: n, r, p, maxmem: SCRYPT_MAXMEM }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

/** `scrypt$N$r$p$<salt b64>$<hash b64>` */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

// Hash of a random password nobody knows: unknown usernames still pay a full scrypt.
let dummyHash: Promise<string> | undefined;

/** Constant-work verify; a missing/malformed stored hash returns false after a real scrypt. */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const parts = stored?.split('$') ?? [];
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
    await verifyPassword(password, await dummyHash);
    return false;
  }
  const [, n, r, p, salt, hash] = parts;
  const expected = Buffer.from(hash, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Runs at most `concurrency` tasks; up to `maxQueue` wait, the rest get BusyError. */
export function createLimiter(concurrency: number, maxQueue: number) {
  let active = 0;
  const waiting: Array<() => void> = [];
  async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active >= concurrency) {
      if (waiting.length >= maxQueue) throw new BusyError();
      await new Promise<void>((resolve) => waiting.push(resolve));
    } else {
      active++;
    }
    try {
      return await task();
    } finally {
      const next = waiting.shift();
      if (next) next(); // hand the slot over without releasing it
      else active--;
    }
  }
  return { run };
}

export interface SessionPayload {
  /** username */
  u: string;
  /** session_version at issue time */
  sv: number;
  /** expiry, epoch ms */
  exp: number;
}

function mac(body: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(body).digest();
}

export function signSession(payload: SessionPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${mac(body, secret).toString('base64url')}`;
}

export function verifySession(token: string, secret: string, now = Date.now()): SessionPayload | null {
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1), 'base64url');
  const want = mac(body, secret);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof p?.u !== 'string' || !Number.isInteger(p.sv) || typeof p.exp !== 'number') return null;
    return p.exp > now ? { u: p.u, sv: p.sv, exp: p.exp } : null;
  } catch {
    return null;
  }
}

const FREE_FAILURES = 3;
const MAX_DELAY_S = 60;
const MAX_TRACKED = 10_000;

/**
 * Per-username login delay: free for 3 failures, then 1s, 2s, 4s ... max 60s
 * after each further failure; success resets. In-memory, never hard-locks.
 * `begin()` reserves a slot BEFORE the (slow) password hash so parallel
 * attempts count too; every `begin()` must end in fail/success/cancel.
 */
export function createLoginThrottle(now: () => number = Date.now) {
  const entries = new Map<string, { failures: number; pending: number; until: number }>();
  const get = (key: string) => entries.get(key) ?? { failures: 0, pending: 0, until: 0 };
  const store = (key: string, e: { failures: number; pending: number; until: number }) => {
    entries.delete(key); // re-insert so Map order tracks recency
    if (e.failures > 0 || e.pending > 0) entries.set(key, e);
    if (entries.size > MAX_TRACKED) entries.delete(entries.keys().next().value!);
  };
  const waitSeconds = (e: { until: number }) => Math.max(0, Math.ceil((e.until - now()) / 1000));
  return {
    /** Seconds to wait before trying again (0 = go ahead); does not reserve. */
    retryAfter(username: string): number {
      const e = entries.get(username);
      return e ? waitSeconds(e) : 0;
    },
    /** Returns the wait in seconds, or 0 after reserving an attempt slot. */
    begin(username: string): number {
      const e = get(username);
      const wait = waitSeconds(e);
      if (wait > 0) return wait;
      if (e.failures + e.pending > FREE_FAILURES) return 1; // burst of in-flight attempts
      e.pending++;
      store(username, e);
      return 0;
    },
    fail(username: string): void {
      const e = get(username);
      e.pending = Math.max(0, e.pending - 1);
      e.failures++;
      const over = e.failures - FREE_FAILURES;
      e.until = over > 0 ? now() + Math.min(MAX_DELAY_S, 2 ** (over - 1)) * 1000 : 0;
      store(username, e);
    },
    success(username: string): void {
      entries.delete(username);
    },
    /** Release a reserved slot without counting a failure (e.g. hash queue busy). */
    cancel(username: string): void {
      const e = get(username);
      e.pending = Math.max(0, e.pending - 1);
      store(username, e);
    },
  };
}

/** Fixed-window counter: `take()` is false once `max` hits happened in `windowMs`. */
export function createCap(max: number, windowMs: number, now: () => number = Date.now) {
  let start = now();
  let count = 0;
  return {
    take(): boolean {
      if (now() - start > windowMs) {
        start = now();
        count = 0;
      }
      if (count >= max) return false;
      count++;
      return true;
    },
  };
}
