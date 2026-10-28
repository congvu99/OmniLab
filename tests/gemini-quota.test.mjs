// 429 classification: per-day vs per-minute quota from QuotaFailure.quotaId, RetryInfo parsing.
import { describe, expect, it } from 'vitest';
import { classifyQuota, parseDurationMs } from '../server/tts/gemini-quota.ts';

const body = (violations, retryDelay) => ({
  error: {
    code: 429,
    message: 'You exceeded your current quota, please check your plan and billing details.',
    status: 'RESOURCE_EXHAUSTED',
    details: [
      { '@type': 'type.googleapis.com/google.rpc.Help', links: [{ url: 'https://ai.google.dev/gemini-api/docs/rate-limits' }] },
      ...(violations ? [{ '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations }] : []),
      ...(retryDelay ? [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay }] : []),
    ],
  },
});

const DAY_ID = 'GenerateRequestsPerDayPerProjectPerModel-FreeTier';
const MINUTE_ID = 'GenerateContentInputTokensPerModelPerMinute-FreeTier';

describe('parseDurationMs', () => {
  it('parses protobuf duration strings', () => {
    expect(parseDurationMs('27s')).toBe(27000);
    expect(parseDurationMs('1.5s')).toBe(1500);
    expect(parseDurationMs('0s')).toBe(0);
  });

  it('returns undefined for anything else', () => {
    for (const value of ['27', '1m', '', 's', '-1s', 27, null, undefined]) expect(parseDurationMs(value)).toBeUndefined();
  });
});

describe('classifyQuota', () => {
  it('per-day quota ignores the misleading retryDelay', () => {
    const result = classifyQuota(body([{ quotaId: DAY_ID, quotaValue: '250' }], '1s'));
    expect(result).toEqual({ scope: 'day', zeroQuota: false, quotaIds: [DAY_ID] });
  });

  it('per-minute quota carries retryAfterMs', () => {
    const result = classifyQuota(JSON.stringify(body([{ quotaId: MINUTE_ID, quotaValue: '10' }], '27s')));
    expect(result).toEqual({ scope: 'minute', retryAfterMs: 27000, zeroQuota: false, quotaIds: [MINUTE_ID] });
  });

  it('day wins when both day and minute violations are present', () => {
    expect(classifyQuota(body([{ quotaId: MINUTE_ID }, { quotaId: DAY_ID }], '5s')).scope).toBe('day');
  });

  it('quotaValue "0" means no quota for the model: day + zeroQuota', () => {
    expect(classifyQuota(body([{ quotaId: MINUTE_ID, quotaValue: '0' }], '30s'))).toEqual({
      scope: 'day',
      zeroQuota: true,
      quotaIds: [MINUTE_ID],
    });
  });

  it('no QuotaFailure detail is unknown (keeps RetryInfo hint if any)', () => {
    expect(classifyQuota(body(undefined, '2s'))).toEqual({ scope: 'unknown', retryAfterMs: 2000, zeroQuota: false, quotaIds: [] });
    expect(classifyQuota({ error: { code: 429 } })).toEqual({ scope: 'unknown', zeroQuota: false, quotaIds: [] });
  });

  it('unrecognised quotaId is unknown', () => {
    expect(classifyQuota(body([{ quotaId: 'SomethingElse' }])).scope).toBe('unknown');
  });

  it('non-JSON and odd shapes are unknown, never throw', () => {
    for (const input of ['<html>Too Many Requests</html>', '', null, 42, [], { error: 'x' }]) {
      expect(classifyQuota(input)).toEqual({ scope: 'unknown', zeroQuota: false, quotaIds: [] });
    }
  });

  it('accepts the array-wrapped error envelope', () => {
    expect(classifyQuota([body([{ quotaId: DAY_ID }])]).scope).toBe('day');
  });
});

describe('classifyQuota without details (Interactions API message only)', () => {
  const messageBody = (message) => JSON.stringify({ error: { message, code: 'too_many_requests' } });

  it('"requests per day" is the daily quota and ignores the retry hint', () => {
    const message =
      'Rate limit exceeded for model gemini-3.8-flash-tts (limit: 10 requests per day on Free Tier). ' +
      'Please retry in 22h35m50s or upgrade your tier at https://ai.dev/rate-limit.';
    expect(classifyQuota(messageBody(message))).toEqual({ scope: 'day', zeroQuota: false, quotaIds: [] });
  });

  it('"per minute" is the minute quota and parses the retry hint', () => {
    const message = 'Rate limit exceeded (limit: 3 requests per minute on Free Tier). Please retry in 1m5.5s.';
    expect(classifyQuota(messageBody(message))).toEqual({ scope: 'minute', retryAfterMs: 65_500, zeroQuota: false, quotaIds: [] });
    expect(classifyQuota(messageBody('3 requests per minute.'))).toEqual({ scope: 'minute', zeroQuota: false, quotaIds: [] });
  });

  it('a message naming neither window stays unknown', () => {
    expect(classifyQuota(messageBody('Rate limit exceeded. Please retry in 30s.')).scope).toBe('unknown');
  });
});
