/**
 * Thin fetch wrapper for the sync sidecar: every call has a hard timeout
 * (a hung sidecar must never stall the UI), never throws, and reports a
 * network failure as `status: 0`. Bodies are parsed leniently — a non-JSON
 * reply (e.g. an HTML 502 from a proxy) yields `json: undefined`.
 */
import type { ErrorCode } from './progress-sync-types';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface HttpResult {
  /** 0 = network error / timeout / aborted. */
  status: number;
  json: unknown;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  timeoutMs: number;
  keepalive?: boolean;
  /** Account the caller believes is signed in; the server rejects the request if the cookie belongs to someone else. */
  user?: string;
}

const ERROR_CODES: ReadonlySet<string> = new Set<ErrorCode>([
  'invalid_username', 'invalid_password', 'password_mismatch', 'username_taken', 'bad_credentials',
  'rate_limited', 'busy', 'unauthorized', 'too_large', 'unsupported_media', 'unavailable', 'bad_request',
]);

export function createHttp(fetchImpl: FetchLike) {
  return async function request(path: string, opts: RequestOptions): Promise<HttpResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
    try {
      const init: RequestInit = {
        method: opts.method ?? 'GET',
        credentials: 'same-origin',
        signal: controller.signal,
        cache: 'no-store',
      };
      if (opts.keepalive) init.keepalive = true;
      // The sidecar rejects POST/PUT without a JSON content type (415).
      const headers: Record<string, string> = {};
      if (opts.user) headers['X-Sync-User'] = opts.user;
      if (opts.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(opts.body);
      }
      if (Object.keys(headers).length) init.headers = headers;
      const res = await fetchImpl(path, init);
      let json: unknown;
      try {
        json = await res.json();
      } catch {
        json = undefined;
      }
      return { status: res.status, json };
    } catch {
      return { status: 0, json: undefined };
    } finally {
      clearTimeout(timer);
    }
  };
}

/** `{ code }` from an error body if it is a known ErrorCode, else `fallback`. */
export function errorCodeOf(json: unknown, fallback: ErrorCode): ErrorCode {
  const code = (json as { code?: unknown } | null | undefined)?.code;
  return typeof code === 'string' && ERROR_CODES.has(code) ? (code as ErrorCode) : fallback;
}

export function usernameOf(json: unknown): string | undefined {
  const name = (json as { username?: unknown } | null | undefined)?.username;
  return typeof name === 'string' && name !== '' ? name : undefined;
}
