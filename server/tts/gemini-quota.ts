/**
 * Pure classification of Gemini 429 bodies into per-day vs per-minute quota.
 * Matches on `PerDay` / `PerMinute` substrings of `QuotaFailure.violations[].quotaId`
 * because the exact TTS quota ids are not documented yet.
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

function errorDetails(body: unknown): Json[] {
  // Some Google endpoints wrap the error object in a one-element array.
  const root = Array.isArray(body) ? body[0] : body;
  if (!isObject(root) || !isObject(root.error) || !Array.isArray(root.error.details)) return [];
  return root.error.details.filter(isObject);
}

const hasType = (detail: Json, type: string) => typeof detail['@type'] === 'string' && detail['@type'].endsWith(type);

const parseBody = (body: unknown): unknown => (typeof body === 'string' ? parseJson(body) : body);

/** Classify a 429 body (raw text or parsed JSON); unparseable bodies are `unknown`. */
export function classifyQuota(body: unknown): QuotaClassification {
  const details = errorDetails(parseBody(body));
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
