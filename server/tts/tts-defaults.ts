/**
 * Single home for Gemini TTS defaults shared by the sample CLI and the worker.
 * Voice, chunk size and chars-per-second are provisional until calibrated
 * against the user's real key (see the lesson-audio plan, calibration report).
 */

export const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com';

export const TTS_MODEL = 'gemini-3.8-flash-tts';

// Style ngắn có chủ đích: style dài là nguyên nhân hàng đầu khiến giọng bị trôi (voice drift).
export const TTS_STYLE = 'Giọng nam trầm, ấm, đọc rõ ràng, nhịp vừa phải.';

/** Candidate prebuilt voices to audition with `pnpm tts:sample`. */
export const TTS_CANDIDATE_VOICES: readonly string[] = ['Algenib', 'Charon', 'Alnilam', 'Orus'];

/** Provisional until the user picks a voice after listening to the samples. */
export const TTS_DEFAULT_VOICE = 'Charon';

/** Max characters per request; raise only if a 3,500-char sample shows no drift. */
export const TTS_MAX_CHUNK_CHARS = 1800;

// Tốc độ đọc ước lượng (ký tự/giây) dùng để kiểm thời lượng audio; thay bằng số đo thật sau hiệu chỉnh.
export const TTS_CHARS_PER_SEC = 14;

/** Per-request timeout; calibration accepts latency up to ~120 s for long chunks. */
export const TTS_REQUEST_TIMEOUT_MS = 180_000;

/** Upper bound for error bodies kept in results and logs. */
export const TTS_ERROR_BODY_MAX_BYTES = 2048;

/** Extended Voice Library filter used by `tts:sample --list-voices`. */
export const TTS_VOICE_LIST_QUERY: Readonly<Record<string, string>> = {
  language_code: 'vi-VN',
  gender: 'male',
  pitch: 'low',
  page_size: '100',
};

/** Allowed voice names: the sample CLI turns them into file names, the worker into config. */
export const TTS_VOICE_NAME_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
