/**
 * Small HTTP/env helpers for the sync sidecar: typed error, size-limited body
 * reader, safe JSON parse and env -> config validation.
 */
import type { IncomingMessage } from 'node:http';
import { randomBytes } from 'node:crypto';
import { MAX_STATE_BYTES } from '../../src/lib/progress-sync-types.ts';
import type { ErrorCode } from '../../src/lib/progress-sync-types.ts';

export interface SyncConfig {
  dataDir: string;
  secret: string;
  port: number;
  host: string;
  /** Add `Secure` to the cookie; only turn off for local http dev. */
  cookieSecure: boolean;
  /** One JSON line per request; defaults to stdout. */
  log?: (line: string) => void;
}

export class HttpError extends Error {
  status: number;
  code: ErrorCode;
  headers: Record<string, string>;
  constructor(status: number, code: ErrorCode, headers: Record<string, string> = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

const HARD_BODY_CAP = 1024 * 1024; // beyond this we stop reading and drop the socket

/**
 * Read the body. Over the limit: bodies up to 1 MB are drained (not kept) and
 * answered with 413 at the end; a larger Content-Length, or a body that grows
 * past 1 MB, is answered right away with `Connection: close` (the caller drops
 * the socket once the response is sent).
 */
export function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'] ?? 0);
    const abort = () => new HttpError(413, 'too_large', { Connection: 'close' });
    if (declared > HARD_BODY_CAP) return reject(abort());
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > HARD_BODY_CAP && !settled) {
        settled = true;
        reject(abort());
      } else if (size <= MAX_STATE_BYTES) chunks.push(c);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      if (size > MAX_STATE_BYTES) reject(new HttpError(413, 'too_large'));
      else resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (err) => {
      if (!settled) reject(err);
      settled = true;
    });
  });
}

export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'bad_request');
  }
}

/** Env -> config; throws a readable Error on anything unsafe to start with. */
export function configFromEnv(env: NodeJS.ProcessEnv, dev: boolean): SyncConfig {
  const secret = env.SESSION_SECRET ?? (dev ? randomBytes(32).toString('hex') : '');
  if (secret.length < 32) throw new Error('SESSION_SECRET must be set to at least 32 characters');
  return {
    dataDir: env.DATA_DIR ?? (dev ? './.data' : '/data'),
    secret,
    port: Number(env.PORT ?? (dev ? 3001 : 3000)),
    host: env.HOST ?? (dev ? '127.0.0.1' : '0.0.0.0'),
    cookieSecure: dev ? env.COOKIE_SECURE === '1' : env.COOKIE_SECURE !== '0',
  };
}

