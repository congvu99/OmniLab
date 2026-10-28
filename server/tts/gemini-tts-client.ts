/**
 * Dependency-free Gemini TTS client over the Interactions API. HTTP and audio
 * failures come back as a `kind`-tagged result instead of throwing, so the
 * worker can decide between retrying, sleeping until the quota reset or giving up.
 * The API key travels only in the `x-goog-api-key` header and is redacted from
 * any response text kept in a result.
 */
import { classifyQuota } from './gemini-quota.ts';
import type { QuotaScope } from './gemini-quota.ts';
import { pcmDurationSec, parseWav, WavFormatError } from './wav-pcm.ts';
import { GEMINI_BASE_URL, TTS_ERROR_BODY_MAX_BYTES, TTS_REQUEST_TIMEOUT_MS } from './tts-defaults.ts';
import { isObject, parseJson } from './tts-common.ts';
import type { Json } from './tts-common.ts';

export interface GeminiTtsClientOptions {
  apiKey: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  baseUrl?: string;
  /** Clock for latency measurement; injectable for tests. */
  now?: () => number;
}

export interface SynthesisRequest {
  text: string;
  model: string;
  voice: string;
  /** Short delivery hint; omitted from the request when empty. */
  style?: string;
}

/**
 * Failures shared by every endpoint. `status` is absent for network errors and timeouts.
 * `contract`: the request or the audio format does not fit this client (bad field, unknown
 * model, unexpected WAV), so it would fail for every lesson. `rejected`: only this text failed.
 */
export type GeminiFailure =
  | { kind: 'quota'; status: 429; scope: QuotaScope; retryAfterMs?: number; zeroQuota: boolean; quotaIds: string[]; body: string }
  | { kind: 'retryable'; status?: number; reason: string; body?: string }
  | { kind: 'auth'; status: number; reason: string; body: string }
  | { kind: 'contract'; status?: number; reason: string; body?: string }
  | { kind: 'rejected'; status?: number; reason: string; body?: string };

export type SynthesisResult =
  | { kind: 'ok'; pcm: Uint8Array; sampleRate: number; durationSec: number; latencyMs: number }
  | { kind: 'no_audio'; reason: string; latencyMs: number }
  | GeminiFailure;

export type VoiceListResult = { kind: 'ok'; data: unknown } | GeminiFailure;

export interface GeminiTtsClient {
  synthesize(request: SynthesisRequest, signal?: AbortSignal): Promise<SynthesisResult>;
  listVoices(query: Readonly<Record<string, string>>, signal?: AbortSignal): Promise<VoiceListResult>;
}

type HttpOutcome = { ok: true; status: number; text: string } | { ok: false; failure: GeminiFailure };

const REQUIRED_BITS_PER_SAMPLE = 16;
const REQUIRED_CHANNELS = 1;
const API_KEY_INVALID = 'API_KEY_INVALID';
/** Pinned so a changed API default (e.g. raw `audio/l16`) surfaces as an error, not as noise. */
export const RESPONSE_AUDIO_MIME_TYPE = 'audio/wav';
// Lý do chặn theo nội dung (enum của Gemini): chỉ đoạn văn này bị từ chối, các bài khác vẫn chạy được.
const CONTENT_BLOCK_PATTERN = /\b(SAFETY|PROHIBITED_CONTENT|BLOCKLIST|SPII|RECITATION|IMAGE_SAFETY)\b/;

function hasInvalidKeyReason(body: unknown): boolean {
  const error = isObject(body) ? body.error : undefined;
  if (!isObject(error) || !Array.isArray(error.details)) return false;
  return error.details.some((detail) => isObject(detail) && detail.reason === API_KEY_INVALID);
}

function classifyHttpFailure(status: number, text: string, body: string): GeminiFailure {
  if (status === 429) return { kind: 'quota', status, ...classifyQuota(text), body };
  if (status === 401 || status === 403) return { kind: 'auth', status, reason: `http_${status}`, body };
  if (status === 400 && hasInvalidKeyReason(parseJson(text))) return { kind: 'auth', status, reason: API_KEY_INVALID, body };
  if (status === 408 || status >= 500) return { kind: 'retryable', status, reason: `http_${status}`, body };
  // 4xx khác (400 sai trường, 404 model, 415…) là lỗi request/cấu hình chung, trừ khi body nêu lý do chặn nội dung.
  if (CONTENT_BLOCK_PATTERN.test(text)) return { kind: 'rejected', status, reason: `http_${status}`, body };
  return { kind: 'contract', status, reason: `http_${status}`, body };
}

/** Last audio part of the last `model_output` step, base64-decoded; empty when absent. */
function extractAudio(response: unknown): Uint8Array {
  const steps = isObject(response) && Array.isArray(response.steps) ? response.steps : [];
  const audio = steps
    .filter((step): step is Json => isObject(step) && step.type === 'model_output' && Array.isArray(step.content))
    .flatMap((step) => (step.content as unknown[]).filter((part): part is Json => isObject(part) && part.type === 'audio'))
    .at(-1);
  return typeof audio?.data === 'string' ? Buffer.from(audio.data, 'base64') : new Uint8Array(0);
}

function decodeSynthesis(text: string, latencyMs: number): SynthesisResult {
  const response = parseJson(text);
  if (response === undefined) return { kind: 'no_audio', reason: 'invalid_json', latencyMs };
  const wav = extractAudio(response);
  if (wav.length === 0) return { kind: 'no_audio', reason: 'no_audio_part', latencyMs };
  let parsed;
  try {
    parsed = parseWav(wav);
  } catch (err) {
    if (err instanceof WavFormatError) return { kind: 'contract', reason: `bad_wav: ${err.message}` };
    throw err;
  }
  const { pcm, sampleRate, channels, bitsPerSample } = parsed;
  if (channels !== REQUIRED_CHANNELS || bitsPerSample !== REQUIRED_BITS_PER_SAMPLE) {
    return { kind: 'contract', reason: `unsupported_wav: ${channels}ch ${bitsPerSample}bit` };
  }
  // PCM 16-bit phải có số byte chẵn; lẻ hoặc rỗng nghĩa là audio hỏng, worker thử lại có giới hạn.
  if (pcm.length === 0 || pcm.length % 2 !== 0) return { kind: 'no_audio', reason: `bad_pcm_length_${pcm.length}`, latencyMs };
  return { kind: 'ok', pcm, sampleRate, durationSec: pcmDurationSec(pcm.length, sampleRate), latencyMs };
}

/** Build the Interactions request body; exported for shape tests. */
export function buildSynthesisBody(request: SynthesisRequest): Json {
  const content: Json = { type: 'text', text: request.text };
  if (request.style) content.annotations = [{ type: 'speech_metadata', style: request.style }];
  return {
    model: request.model,
    input: [{ type: 'user_input', content: [content] }],
    response_format: { type: 'audio', mime_type: RESPONSE_AUDIO_MIME_TYPE },
    generation_config: { speech_config: [{ voice: request.voice }] },
    // Free tier mặc định giữ interaction 1 ngày; store=false để Google không lưu lại.
    store: false,
  };
}

export function createGeminiTtsClient(options: GeminiTtsClientOptions): GeminiTtsClient {
  const apiKey = options.apiKey.trim();
  if (!apiKey) throw new Error('Gemini API key is empty');
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init));
  const timeoutMs = options.timeoutMs ?? TTS_REQUEST_TIMEOUT_MS;
  const baseUrl = (options.baseUrl ?? GEMINI_BASE_URL).replace(/\/+$/, '');
  const now = options.now ?? Date.now;

  const redact = (text: string) => text.split(apiKey).join('[redacted]');
  const clip = (text: string) => {
    const safe = redact(text);
    const bytes = Buffer.from(safe, 'utf8');
    return bytes.length <= TTS_ERROR_BODY_MAX_BYTES ? safe : bytes.subarray(0, TTS_ERROR_BODY_MAX_BYTES).toString('utf8');
  };

  async function send(path: string, init: RequestInit, signal?: AbortSignal): Promise<HttpOutcome> {
    const timeout = AbortSignal.timeout(timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const headers = { 'x-goog-api-key': apiKey, ...(init.headers as Record<string, string> | undefined) };
    try {
      const response = await doFetch(`${baseUrl}${path}`, { ...init, headers, signal: combined });
      const text = await response.text();
      if (response.ok) return { ok: true, status: response.status, text };
      return { ok: false, failure: classifyHttpFailure(response.status, text, clip(text)) };
    } catch (err) {
      // Hủy từ bên ngoài (SIGTERM) không phải lỗi API: ném lại để caller dừng hẳn.
      if (signal?.aborted) throw signal.reason;
      if (timeout.aborted) return { ok: false, failure: { kind: 'retryable', reason: 'timeout' } };
      if (err instanceof TypeError) return { ok: false, failure: { kind: 'retryable', reason: `network: ${redact(err.message)}` } };
      throw err;
    }
  }

  return {
    async synthesize(request, signal) {
      if (!request.text.trim()) return { kind: 'rejected', reason: 'empty_text' };
      const started = now();
      const outcome = await send(
        '/v1beta/interactions',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildSynthesisBody(request)) },
        signal,
      );
      if (!outcome.ok) return outcome.failure;
      return decodeSynthesis(outcome.text, now() - started);
    },

    async listVoices(query, signal) {
      const outcome = await send(`/v1beta/voices?${new URLSearchParams(query)}`, { method: 'GET' }, signal);
      if (!outcome.ok) return outcome.failure;
      const data = parseJson(outcome.text);
      return data === undefined ? { kind: 'rejected', status: outcome.status, reason: 'invalid_json' } : { kind: 'ok', data };
    },
  };
}
