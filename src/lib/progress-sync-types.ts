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
