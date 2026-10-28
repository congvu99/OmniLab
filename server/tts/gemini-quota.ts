/**
 * Pure classification of Gemini 429 bodies into per-day vs per-minute quota.
 * Matches on `PerDay` / `PerMinute` substrings of `QuotaFailure.violations[].quotaId`
 * because the exact TTS quota ids are not documented yet; falls back to the
 * error message when the body has no `details` (Interactions API).
 */
import { isObject, parseJson } from './tts-common.ts';
import type { Json } from './tts-common.ts';

export type QuotaScope = 'day' | 'minute' | 'unknown';

export interface QuotaClassification {
  scope: QuotaScope;
  /** Server hint from `RetryInfo.retryDelay`; never set for a per-day quota. */
  retryAfterMs?: number;
  /** A violation reported `quotaValue: "0"`: the project has no quota for this model. */
  zeroQuota: boolean;
  /** Raw quota ids seen, for logging and calibration. */
  quotaIds: string[];
}

const QUOTA_FAILURE_TYPE = 'google.rpc.QuotaFailure';
const RETRY_INFO_TYPE = 'google.rpc.RetryInfo';
const DURATION_PATTERN = /^(\d+(?:\.\d+)?)s$/;

/** Parse a protobuf JSON duration such as `"27s"` or `"1.5s"` into milliseconds. */
export function parseDurationMs(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const match = DURATION_PATTERN.exec(value.trim());
  return match ? Math.round(Number(match[1]) * 1000) : undefined;
}

function errorObject(body: unknown): Json | undefined {
  // Some Google endpoints wrap the error object in a one-element array.
  const root = Array.isArray(body) ? body[0] : body;
  return isObject(root) && isObject(root.error) ? root.error : undefined;
}

function errorDetails(body: unknown): Json[] {
  const error = errorObject(body);
  return error && Array.isArray(error.details) ? error.details.filter(isObject) : [];
}

const MESSAGE_DAY_PATTERN = /per day/i;
const MESSAGE_MINUTE_PATTERN = /per minute/i;
const MESSAGE_RETRY_PATTERN = /retry in (?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/i;

/** `"Please retry in 1m5.2s"` -> ms; undefined when the message carries no delay. */
function messageRetryMs(message: string): number | undefined {
  const match = MESSAGE_RETRY_PATTERN.exec(message);
  if (!match || (!match[1] && !match[2] && !match[3])) return undefined;
  const [hours, minutes, seconds] = [match[1], match[2], match[3]].map((part) => Number(part ?? 0));
  return Math.round(((hours * 60 + minutes) * 60 + seconds) * 1000);
}

/**
 * Interactions API 429s carry no `details`, only a message such as
 * "Rate limit exceeded ... (limit: 10 requests per day on Free Tier). Please retry in 22h35m50s".
 */
function classifyByMessage(body: unknown): QuotaClassification | undefined {
  const message = errorObject(body)?.message;
  if (typeof message !== 'string') return undefined;
  if (MESSAGE_DAY_PATTERN.test(message)) return { scope: 'day', zeroQuota: false, quotaIds: [] };
  if (!MESSAGE_MINUTE_PATTERN.test(message)) return undefined;
  const retryAfterMs = messageRetryMs(message);
  return retryAfterMs === undefined
    ? { scope: 'minute', zeroQuota: false, quotaIds: [] }
    : { scope: 'minute', retryAfterMs, zeroQuota: false, quotaIds: [] };
}

const hasType = (detail: Json, type: string) => typeof detail['@type'] === 'string' && detail['@type'].endsWith(type);

const parseBody = (body: unknown): unknown => (typeof body === 'string' ? parseJson(body) : body);

/** Classify a 429 body (raw text or parsed JSON); unparseable bodies are `unknown`. */
export function classifyQuota(body: unknown): QuotaClassification {
  const parsed = parseBody(body);
  const details = errorDetails(parsed);
  if (details.length === 0) return classifyByMessage(parsed) ?? { scope: 'unknown', zeroQuota: false, quotaIds: [] };
  const violations = details
    .filter((detail) => hasType(detail, QUOTA_FAILURE_TYPE) && Array.isArray(detail.violations))
    .flatMap((detail) => (detail.violations as unknown[]).filter(isObject));
  const quotaIds = violations.map((v) => v.quotaId).filter((id): id is string => typeof id === 'string');
  const zeroQuota = violations.some((v) => v.quotaValue === '0');
  const retryInfo = details.find((detail) => hasType(detail, RETRY_INFO_TYPE));
  const retryAfterMs = parseDurationMs(retryInfo?.retryDelay);

  // Hết quota ngày: không tin retryDelay (thường chỉ "1s"), phải chờ tới mốc reset 0h Los Angeles.
  if (zeroQuota || quotaIds.some((id) => id.includes('PerDay'))) return { scope: 'day', zeroQuota, quotaIds };
  const scope: QuotaScope = quotaIds.some((id) => id.includes('PerMinute')) ? 'minute' : 'unknown';
  return retryAfterMs === undefined ? { scope, zeroQuota, quotaIds } : { scope, retryAfterMs, zeroQuota, quotaIds };
}
