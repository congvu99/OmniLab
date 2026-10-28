/**
 * TTS worker configuration: env -> validated config (throws a readable Error
 * on a bad value) plus the fixed thresholds that operators never tune.
 * The API key is only read here and handed to the Gemini client; it is never
 * part of anything that gets logged (see `describeConfig`).
 */
import {
  TTS_CHARS_PER_SEC,
  TTS_DEFAULT_VOICE,
  TTS_MAX_CHUNK_CHARS,
  TTS_MODEL,
  TTS_REQUEST_TIMEOUT_MS,
  TTS_STYLE,
  TTS_VOICE_NAME_PATTERN,
} from './tts-defaults.ts';
import { MINUTE_MS } from './tts-common.ts';

// Chặn dọn dẹp khi văn bản đọc làm mất nhiều hơn max(5 bài, 10% số bài có bản nghe) (thường do build hỏng).
export const GC_MAX_DROP_RATIO = 0.1;
export const GC_MAX_DROP_LESSONS = 5;
/** Extra attempts for a 200 response without usable audio before the lesson fails. */
export const NO_AUDIO_MAX_RETRIES = 3;
// Tỉ lệ (thời lượng dự kiến theo charsPerSec ÷ thời lượng thật) hợp lệ; ngoài khoảng là bị cắt/đọc vội/chèn lặng.
export const DURATION_RATIO_MIN = 0.5;
export const DURATION_RATIO_MAX = 2;
/** Chunks shorter than this are not duration-checked: relative error is too large. */
export const DURATION_CHECK_MIN_CHARS = 80;
/** At most this many in-progress work directories (disk budget). */
export const MAX_WORK_DIRS = 2;
/** Bump when concatenation or encoding changes: part of every audioKey. */
export const AUDIO_PIPELINE_VERSION = 1;
/** Fixed silence between chunks, so chunk joins sound like a paragraph pause. */
export const CHUNK_GAP_MS = 400;
export const STALE_TMP_MS = 3_600_000;
export const INVALID_MANIFEST_RETAIN_MS = 30 * 86_400_000;
/** Consecutive 5xx/network failures on one chunk before the cycle stops (idle `upstream`). */
export const RETRYABLE_MAX_ATTEMPTS = 8;
/** Consecutive unclassified 429s treated as a daily quota. */
export const QUOTA_UNKNOWN_MAX_ATTEMPTS = 5;
/** Consecutive per-minute 429s on one chunk before the cycle stops (idle `quota_minute`). */
export const QUOTA_MINUTE_MAX_ATTEMPTS = 10;
export const FFMPEG_TIMEOUT_MS = 15 * 60_000;

export interface TtsConfig {
  apiKey: string;
  model: string;
  voice: string;
  style: string;
  maxChunkChars: number;
  charsPerSec: number;
  minIntervalMs: number;
  rescanMs: number;
  retainOldMs: number;
  retainRemovedMs: number;
  failedRetryMs: number;
  requestTimeoutMs: number;
  dataDir: string;
  scriptsPath: string;
  ffmpegPath: string;
}

const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

interface NumberRule {
  fallback: number;
  min: number;
  max: number;
  integer?: boolean;
}

function readNumber(env: NodeJS.ProcessEnv, name: string, rule: NumberRule): number {
  const raw = env[name]?.trim();
  if (raw === undefined || raw === '') return rule.fallback;
  const value = Number(raw);
  const integerOk = rule.integer === false || Number.isInteger(value);
  if (!Number.isFinite(value) || !integerOk || value < rule.min || value > rule.max) {
    const kind = rule.integer === false ? 'a number' : 'an integer';
    throw new Error(`${name} must be ${kind} in [${rule.min}, ${rule.max}], got "${raw}"`);
  }
  return value;
}

function readText(env: NodeJS.ProcessEnv, name: string, fallback: string): string {
  const raw = env[name]?.trim();
  return raw === undefined || raw === '' ? fallback : raw;
}

/** Env -> config. `dev` switches paths to the local checkout (`./.data/audio`, `dist/`). */
export function configFromEnv(env: NodeJS.ProcessEnv, dev: boolean): TtsConfig {
  const voice = readText(env, 'TTS_VOICE', TTS_DEFAULT_VOICE);
  if (!TTS_VOICE_NAME_PATTERN.test(voice)) throw new Error(`TTS_VOICE has an invalid voice name: ${JSON.stringify(voice)}`);
  return {
    apiKey: env.GEMINI_API_KEY?.trim() ?? '',
    model: readText(env, 'TTS_MODEL', TTS_MODEL),
    voice,
    style: readText(env, 'TTS_STYLE', TTS_STYLE),
    maxChunkChars: readNumber(env, 'TTS_MAX_CHUNK_CHARS', { fallback: TTS_MAX_CHUNK_CHARS, min: 500, max: 4000 }),
    charsPerSec: readNumber(env, 'TTS_CHARS_PER_SEC', { fallback: TTS_CHARS_PER_SEC, min: 1, max: 100, integer: false }),
    minIntervalMs: readNumber(env, 'TTS_MIN_INTERVAL_MS', { fallback: 30_000, min: 0, max: DAY_MS }),
    rescanMs: readNumber(env, 'TTS_RESCAN_MINUTES', { fallback: 60, min: 1, max: 24 * 60 }) * MINUTE_MS,
    retainOldMs: readNumber(env, 'TTS_RETAIN_OLD_HOURS', { fallback: 24, min: 0, max: 24 * 365 }) * HOUR_MS,
    retainRemovedMs: readNumber(env, 'TTS_RETAIN_REMOVED_DAYS', { fallback: 30, min: 1, max: 3650 }) * DAY_MS,
    failedRetryMs: readNumber(env, 'TTS_FAILED_RETRY_DAYS', { fallback: 7, min: 1, max: 365 }) * DAY_MS,
    requestTimeoutMs: readNumber(env, 'TTS_REQUEST_TIMEOUT_MS', { fallback: TTS_REQUEST_TIMEOUT_MS, min: 10_000, max: 600_000 }),
    dataDir: readText(env, 'TTS_DATA_DIR', dev ? './.data/audio' : '/data/audio'),
    scriptsPath: readText(env, 'TTS_SCRIPTS_PATH', dev ? 'dist/tts-scripts.json' : '/app/tts-scripts.json'),
    ffmpegPath: readText(env, 'FFMPEG_PATH', 'ffmpeg'),
  };
}

/** Loggable view of the config: never contains the key, only whether one is set. */
export function describeConfig(config: TtsConfig): Record<string, unknown> {
  return { model: config.model, voice: config.voice, maxChunkChars: config.maxChunkChars, hasKey: config.apiKey !== '' };
}
