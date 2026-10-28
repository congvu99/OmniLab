// Gemini TTS client with a fake fetch: request shape, audio extraction, failure kinds, key hygiene;
// plus the tts:sample CLI driven by a fake client (no network anywhere).
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildSynthesisBody, createGeminiTtsClient } from '../server/tts/gemini-tts-client.ts';
import { runSampleCli } from '../server/tts/tts-sample-cli.ts';
import { wavHeader } from '../server/tts/wav-pcm.ts';

const KEY = 'AIzaTEST-secret-key-123';
const REQ = { text: 'Xin chào các bạn.', model: 'gemini-3.8-flash-tts', voice: 'Charon', style: 'Giọng trầm.' };
const wavB64 = (pcmBytes, rate = 24000) => Buffer.concat([wavHeader(pcmBytes, rate), Buffer.alloc(pcmBytes, 1)]).toString('base64');
const audioResponse = (data) => ({
  steps: [
    { type: 'user_input', content: [{ type: 'text', text: 'x' }] },
    { type: 'model_output', content: [{ type: 'text', text: 'ok' }, { type: 'audio', data }] },
  ],
});

function fakeFetch(status, payload) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    return new Response(typeof payload === 'string' ? payload : JSON.stringify(payload), { status });
  };
  return { fn, calls };
}

const clientWith = (fetch, extra = {}) => createGeminiTtsClient({ apiKey: KEY, fetch, baseUrl: 'https://api.test/', ...extra });

describe('synthesize request', () => {
  it('posts the Interactions body with the key only in the header and store:false', async () => {
    const { fn, calls } = fakeFetch(200, audioResponse(wavB64(4800)));
    await clientWith(fn).synthesize(REQ);
    const [{ url, init }] = calls;
    expect(url).toBe('https://api.test/v1beta/interactions');
    expect(url).not.toContain(KEY);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'x-goog-api-key': KEY, 'Content-Type': 'application/json' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body)).toEqual({
      model: REQ.model,
      input: [{ type: 'user_input', content: [{ type: 'text', text: REQ.text, annotations: [{ type: 'speech_metadata', style: REQ.style }] }] }],
      response_format: { type: 'audio', mime_type: 'audio/wav' },
      generation_config: { speech_config: [{ voice: 'Charon' }] },
      store: false,
    });
    expect(init.body).not.toContain(KEY);
  });

  it('omits annotations when style is empty', () => {
    expect(buildSynthesisBody({ ...REQ, style: '' }).input[0].content[0]).toEqual({ type: 'text', text: REQ.text });
  });

  it('rejects empty text without calling fetch; refuses an empty key', async () => {
    const { fn, calls } = fakeFetch(200, {});
    expect(await clientWith(fn).synthesize({ ...REQ, text: '  ' })).toEqual({ kind: 'rejected', reason: 'empty_text' });
    expect(calls).toHaveLength(0);
    expect(() => createGeminiTtsClient({ apiKey: ' ' })).toThrow(/empty/);
  });
});

describe('synthesize response', () => {
  it('returns PCM from the last audio part with duration and latency', async () => {
    let t = 1000;
    const { fn } = fakeFetch(200, audioResponse(wavB64(48000)));
    const result = await clientWith(fn, { now: () => (t += 250) }).synthesize(REQ);
    expect(result).toMatchObject({ kind: 'ok', sampleRate: 24000, durationSec: 1, latencyMs: 250 });
    expect(result.pcm.length).toBe(48000);
  });

  it.each([
    ['text-only steps', { steps: [{ type: 'model_output', content: [{ type: 'text', text: 'hi' }] }] }, 'no_audio_part'],
    ['no steps', {}, 'no_audio_part'],
    ['empty audio data', audioResponse(''), 'no_audio_part'],
    ['empty data chunk', audioResponse(wavB64(0)), 'bad_pcm_length_0'],
    ['odd PCM length', audioResponse(wavB64(4801)), 'bad_pcm_length_4801'],
    ['non-JSON body', 'not json', 'invalid_json'],
  ])('%s -> no_audio', async (_name, payload, reason) => {
    const { fn } = fakeFetch(200, payload);
    expect(await clientWith(fn).synthesize(REQ)).toMatchObject({ kind: 'no_audio', reason });
  });

  it('non-WAV audio or stereo WAV -> contract (same for every lesson, stops the cycle)', async () => {
    const notWav = Buffer.from('raw pcm bytes here').toString('base64');
    expect(await clientWith(fakeFetch(200, audioResponse(notWav)).fn).synthesize(REQ)).toMatchObject({ kind: 'contract', reason: expect.stringMatching(/^bad_wav/) });
    const stereo = Buffer.concat([wavHeader(8, 24000, 2), Buffer.alloc(8)]).toString('base64');
    expect(await clientWith(fakeFetch(200, audioResponse(stereo)).fn).synthesize(REQ)).toMatchObject({ kind: 'contract', reason: 'unsupported_wav: 2ch 16bit' });
  });
});

describe('synthesize failures', () => {
  const quotaBody = (quotaId, retryDelay) => ({
    error: { code: 429, details: [{ '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId }] }, { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay }] },
  });

  it('429 per day / per minute -> quota with scope', async () => {
    const day = await clientWith(fakeFetch(429, quotaBody('GenerateRequestsPerDayPerProjectPerModel-FreeTier', '1s')).fn).synthesize(REQ);
    expect(day).toMatchObject({ kind: 'quota', status: 429, scope: 'day', zeroQuota: false });
    expect(day.retryAfterMs).toBeUndefined();
    expect(JSON.parse(day.body).error.code).toBe(429);
    const minute = await clientWith(fakeFetch(429, quotaBody('InputTokensPerModelPerMinute-FreeTier', '27s')).fn).synthesize(REQ);
    expect(minute).toMatchObject({ kind: 'quota', scope: 'minute', retryAfterMs: 27000 });
  });

  it('clips error bodies to 2 KB and redacts the key', async () => {
    const result = await clientWith(fakeFetch(500, `${KEY} ${'x'.repeat(5000)}`).fn).synthesize(REQ);
    expect(result).toMatchObject({ kind: 'retryable', status: 500, reason: 'http_500' });
    expect(Buffer.byteLength(result.body)).toBeLessThanOrEqual(2048);
    expect(result.body).not.toContain(KEY);
    expect(result.body.startsWith('[redacted]')).toBe(true);
  });

  it.each([
    [401, {}, 'auth'],
    [403, { error: { status: 'PERMISSION_DENIED' } }, 'auth'],
    [400, { error: { details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID' }] } }, 'auth'],
    [400, { error: { status: 'INVALID_ARGUMENT', message: 'Invalid value at store' } }, 'contract'],
    [404, { error: { status: 'NOT_FOUND', message: 'models/x is not found' } }, 'contract'],
    [415, {}, 'contract'],
    [400, { error: { status: 'INVALID_ARGUMENT', message: 'Request blocked', details: [{ reason: 'PROHIBITED_CONTENT' }] } }, 'rejected'],
    [400, { promptFeedback: { blockReason: 'SAFETY' } }, 'rejected'],
    [408, {}, 'retryable'],
    [503, {}, 'retryable'],
  ])('HTTP %i -> %s', async (status, payload, kind) => {
    expect(await clientWith(fakeFetch(status, payload).fn).synthesize(REQ)).toMatchObject({ kind, status });
  });

  it('network TypeError -> retryable, with the key redacted from the message', async () => {
    const fn = async () => {
      throw new TypeError(`fetch failed for ${KEY}`);
    };
    const result = await clientWith(fn).synthesize(REQ);
    expect(result).toEqual({ kind: 'retryable', reason: 'network: fetch failed for [redacted]' });
  });

  const hangingFetch = async (_url, init) =>
    new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));

  it('timeout -> retryable', async () => {
    expect(await clientWith(hangingFetch, { timeoutMs: 10 }).synthesize(REQ)).toEqual({ kind: 'retryable', reason: 'timeout' });
  });

  it('external abort is rethrown, not reported as an API failure', async () => {
    const controller = new AbortController();
    const pending = clientWith(hangingFetch).synthesize(REQ, controller.signal);
    controller.abort(new Error('SIGTERM'));
    await expect(pending).rejects.toThrow('SIGTERM');
  });
});

describe('listVoices', () => {
  it('GETs /v1beta/voices with the query and returns parsed data', async () => {
    const { fn, calls } = fakeFetch(200, { voices: [{ name: 'v1' }] });
    const result = await clientWith(fn).listVoices({ language_code: 'vi-VN', page_size: '100' });
    expect(result).toEqual({ kind: 'ok', data: { voices: [{ name: 'v1' }] } });
    expect(calls[0].url).toBe('https://api.test/v1beta/voices?language_code=vi-VN&page_size=100');
    expect(calls[0].init.method).toBe('GET');
    expect(calls[0].init.headers).toEqual({ 'x-goog-api-key': KEY });
  });

  it('maps HTTP failures like synthesize', async () => {
    expect(await clientWith(fakeFetch(404, {}).fn).listVoices({})).toMatchObject({ kind: 'contract', status: 404 });
  });
});

describe('tts:sample CLI', () => {
  let dir;
  let lines;
  const io = () => ({ out: (l) => lines.push(['out', l]), err: (l) => lines.push(['err', l]) });
  const fakeClient = (results) => () => ({ synthesize: async () => results.shift(), listVoices: async () => results.shift() });
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'omnilab-tts-'));
    lines = [];
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('--help works without a key; missing key exits 2 without echoing anything secret', async () => {
    expect(await runSampleCli(['--help'], { env: {}, ...io() })).toBe(0);
    expect(lines[0][1]).toMatch(/^Usage: pnpm tts:sample/);
    expect(await runSampleCli([], { env: { GEMINI_API_KEY: '  ' }, ...io() })).toBe(2);
    expect(lines.at(-1)[1]).toMatch(/GEMINI_API_KEY is not set/);
  });

  it('rejects unknown flags and path-like voice names', async () => {
    expect(await runSampleCli(['--bogus'], { env: { GEMINI_API_KEY: KEY }, ...io() })).toBe(2);
    expect(await runSampleCli(['--voices', '../evil'], { env: { GEMINI_API_KEY: KEY }, ...io() })).toBe(2);
  });

  it('writes a WAV per voice, prints metrics, saves the 429 body and stops', async () => {
    const pcm = new Uint8Array(48000);
    const results = [
      { kind: 'ok', pcm, sampleRate: 24000, durationSec: 1, latencyMs: 900 },
      { kind: 'quota', status: 429, scope: 'day', zeroQuota: false, quotaIds: ['X'], body: '{"error":{"code":429}}' },
    ];
    const deps = { env: { GEMINI_API_KEY: KEY }, createClient: fakeClient(results), now: () => new Date(Date.UTC(2026, 9, 28, 6, 0)), ...io() };
    const code = await runSampleCli(['--voices', 'Charon,Orus,Algenib', '--out', dir], deps);
    expect(code).toBe(1);
    expect(readdirSync(dir).sort()).toEqual(['429-2026-10-28T06-00-00-000Z.json', 'Charon.wav']);
    expect(readFileSync(join(dir, 'Charon.wav')).length).toBe(44 + 48000);
    const metrics = JSON.parse(lines[0][1]);
    expect(metrics).toMatchObject({ voice: 'Charon', bytes: 48000, sampleRate: 24000, durationSec: 1, latencyMs: 900 });
    expect(metrics.charsPerSec).toBe(metrics.chars);
    expect(lines).toHaveLength(2);
    expect(JSON.stringify(lines)).not.toContain(KEY);
  });
});
