/**
 * Wire contract shared by the sync sidecar (server/sync) and the browser
 * client. Types only (erasable) so plain Node can import it unchanged.
 */

/** Every error response body is `{ code: ErrorCode }`. */
export type ErrorCode =
  | 'invalid_username'
  | 'invalid_password'
  | 'password_mismatch'
  | 'username_taken'
  | 'bad_credentials'
  | 'rate_limited'
  | 'busy'
  | 'unauthorized'
  | 'too_large'
  | 'unsupported_media'
  | 'unavailable'
  // Malformed JSON / not a v2 state / unknown route.
  | 'bad_request';

export interface ErrorBody {
  code: ErrorCode;
}

export interface UserBody {
  username: string;
}

/** Max request body and max stored state size, in bytes. */
export const MAX_STATE_BYTES = 64 * 1024;

/** Client-side sync status broadcast to the UI (see progress-sync.ts). */
export type SyncStatus =
  // Initial: the one GET /api/me of this page load has not answered yet.
  | { kind: 'checking' }
  | { kind: 'signed-out' }
  // Sidecar unreachable / 5xx / non-JSON reply: NOT the same as signed-out.
  | { kind: 'unavailable' }
  // Local data belongs to another account: waiting for resolveMerge().
  | { kind: 'needs-merge-decision'; username: string }
  | { kind: 'syncing'; username: string }
  | { kind: 'synced'; username: string; at: number }
  | { kind: 'error'; username: string; code: ErrorCode };

export type AuthResult =
  | { ok: true; username: string; needsMergeDecision: boolean }
  | { ok: false; code: ErrorCode };
