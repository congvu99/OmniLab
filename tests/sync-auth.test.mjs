// Tests for server/sync/sync-auth.ts: scrypt hashing, hash concurrency limiter,
// signed session cookies and the per-username login throttle.
import { describe, expect, it } from 'vitest';
import {
  BusyError,
  createCap,
  createLimiter,
  createLoginThrottle,
  hashPassword,
  signSession,
  verifyPassword,
  verifySession,
} from '../server/sync/sync-auth.ts';

const SECRET = 'x'.repeat(40);

describe('password hashing', () => {
  it('accepts the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('correct horse');
    expect(stored).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(await verifyPassword('correct horse', stored)).toBe(true);
    expect(await verifyPassword('wrong horse', stored)).toBe(false);
  });

  it('salts every hash and still burns a hash for unknown users', async () => {
    expect(await hashPassword('same-password')).not.toBe(await hashPassword('same-password'));
    expect(await verifyPassword('anything', null)).toBe(false);
  });

  it('rejects malformed stored hashes instead of throwing', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false);
  });
});

describe('createLimiter', () => {
  it('runs at most N at once and rejects beyond the queue', async () => {
    const limiter = createLimiter(2, 8);
    let running = 0;
    let peak = 0;
    const task = async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 10));
      running--;
      return 'ok';
    };
    const results = await Promise.allSettled(Array.from({ length: 12 }, () => limiter.run(task)));
    expect(peak).toBe(2);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(10);
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(rejected).toHaveLength(2);
    expect(rejected.every((r) => r.reason instanceof BusyError)).toBe(true);
  });

  it('keeps working after a task throws', async () => {
    const limiter = createLimiter(1, 1);
    await expect(
      limiter.run(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    await expect(limiter.run(async () => 7)).resolves.toBe(7);
  });
});

describe('session cookie', () => {
  const now = 1_000_000;
  it('round-trips a valid token', () => {
    const token = signSession({ u: 'alice', sv: 3, exp: now + 1000 }, SECRET);
    expect(verifySession(token, SECRET, now)).toEqual({ u: 'alice', sv: 3, exp: now + 1000 });
  });

  it('rejects expired, tampered, wrong-secret and malformed tokens', () => {
    const token = signSession({ u: 'alice', sv: 1, exp: now + 1000 }, SECRET);
    expect(verifySession(token, SECRET, now + 1001)).toBeNull();
    expect(verifySession(token, 'y'.repeat(40), now)).toBeNull();
    const [body, mac] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ u: 'bob', sv: 1, exp: now + 1000 })).toString('base64url');
    expect(verifySession(`${forged}.${mac}`, SECRET, now)).toBeNull();
    expect(verifySession(`${body}.${mac.slice(0, -1)}${mac.endsWith('A') ? 'B' : 'A'}`, SECRET, now)).toBeNull();
    expect(verifySession('nodot', SECRET, now)).toBeNull();
    expect(verifySession('', SECRET, now)).toBeNull();
  });
});

describe('login throttle', () => {
  it('allows 3 failures, then grows 1s, 2s, 4s ... capped at 60s', () => {
    let t = 0;
    const throttle = createLoginThrottle(() => t);
    for (let i = 0; i < 3; i++) {
      expect(throttle.retryAfter('alice')).toBe(0);
      throttle.fail('alice');
    }
    expect(throttle.retryAfter('alice')).toBe(0);
    throttle.fail('alice'); // 4th failure -> 1s
    expect(throttle.retryAfter('alice')).toBe(1);
    t += 1000;
    expect(throttle.retryAfter('alice')).toBe(0);
    throttle.fail('alice'); // 5th -> 2s
    expect(throttle.retryAfter('alice')).toBe(2);
    t += 2000;
    throttle.fail('alice'); // 6th -> 4s
    expect(throttle.retryAfter('alice')).toBe(4);
    for (let i = 0; i < 20; i++) {
      t += 100_000;
      throttle.fail('alice');
    }
    expect(throttle.retryAfter('alice')).toBe(60);
  });

  it('is per username and resets on success', () => {
    const throttle = createLoginThrottle(() => 0);
    for (let i = 0; i < 5; i++) throttle.fail('alice');
    expect(throttle.retryAfter('alice')).toBeGreaterThan(0);
    expect(throttle.retryAfter('bob')).toBe(0);
    throttle.success('alice');
    expect(throttle.retryAfter('alice')).toBe(0);
  });
});

describe('createCap', () => {
  it('allows max hits per window then recovers', () => {
    let t = 0;
    const cap = createCap(2, 1000, () => t);
    expect(cap.take()).toBe(true);
    expect(cap.take()).toBe(true);
    expect(cap.take()).toBe(false);
    t = 1001;
    expect(cap.take()).toBe(true);
  });
});
