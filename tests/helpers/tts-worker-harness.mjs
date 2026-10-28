// Shared harness for TTS worker tests: a temp data dir, a fake Gemini client, fake encoder,
// fake clock and fake sleep. No network, no ffmpeg.
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { speechScriptHashInput } from '../../src/lib/speech-script-contract.ts';
import { createAudioStore } from '../../server/tts/audio-store.ts';
import { configFromEnv } from '../../server/tts/tts-config.ts';
import { createTtsWorker } from '../../server/tts/tts-cycle.ts';

export const RATE = 1000; // 2,000 PCM bytes per second
export const CPS = 14;
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
export const T0 = Date.parse('2026-10-28T10:00:00Z');
export const MINUTE_429 = { kind: 'quota', status: 429, scope: 'minute', retryAfterMs: 27_000, zeroQuota: false, quotaIds: ['PerMinute'], body: '{"error":{}}' };
export const NO_AUDIO = { kind: 'no_audio', reason: 'no_audio_part', latencyMs: 1 };

/** PCM whose duration gives `ratio` = (chars / CPS) / seconds. */
export function ok(text, ratio = 1, sampleRate = RATE) {
  const pcm = new Uint8Array(Math.max(2, Math.round((text.length / CPS / ratio) * sampleRate) * 2));
  return { kind: 'ok', pcm, sampleRate, durationSec: pcm.length / (sampleRate * 2), latencyMs: 1 };
}

const withHash = (id, chapters) => ({ id, title: id, scriptHash: createHash('sha256').update(speechScriptHashInput(chapters)).digest('hex'), chapters });

/** Four chunks at TTS_MAX_CHUNK_CHARS=500, with one `###` mark. */
export function lesson(id, filler = 'p') {
  return withHash(id, [
    { id: ':intro', title: 'Mở đầu', paragraphs: ['Giới thiệu bài.', 'Mục nhỏ.', filler.repeat(300)], marks: [{ id: 'muc-nho', title: 'Mục nhỏ', paragraphIndex: 1 }] },
    { id: 'phan-a', title: 'Phần A', paragraphs: ['q'.repeat(300), 'r'.repeat(300), 's'.repeat(300)], marks: [] },
  ]);
}

/** One chunk. */
export const shortLesson = (id) => withHash(id, [{ id: ':intro', title: 'Mở đầu', paragraphs: [`Bài ${id}. ${'t'.repeat(200)}`], marks: [] }]);

/** Temp data dir plus helpers; call `cleanup()` in afterEach. */
export function createWorkerEnv() {
  const dir = mkdtempSync(join(tmpdir(), 'omnilab-tts-worker-'));
  const scriptsPath = join(dir, 'tts-scripts.json');

  /** One worker process over `dir`; `respond(text, n)` returns a client result or undefined for ok. */
  function harness({ respond, key = 'test-key', at = T0, encodeError } = {}) {
    const clock = { t: at };
    const calls = [];
    const sleeps = [];
    const events = [];
    const encodes = [];
    const store = createAudioStore(dir);
    const env = { GEMINI_API_KEY: key, TTS_DATA_DIR: dir, TTS_SCRIPTS_PATH: scriptsPath, TTS_MAX_CHUNK_CHARS: '500', TTS_MIN_INTERVAL_MS: '0', TTS_CHARS_PER_SEC: String(CPS) };
    const config = configFromEnv(env, false);
    const client = key ? {
      async synthesize(request, signal) {
        if (signal?.aborted) throw signal.reason;
        calls.push(request.text);
        return (await respond?.(request.text, calls.length)) ?? ok(request.text);
      },
    } : null;
    const encoder = {
      async encode(input) {
        encodes.push(input);
        if (encodeError) throw new Error(encodeError);
        writeFileSync(join(input.workDir, 'out.m4a'), 'm4a');
        return join(input.workDir, 'out.m4a');
      },
    };
    const sleep = async (ms, signal) => {
      if (signal?.aborted) throw signal.reason;
      sleeps.push(ms);
      clock.t += ms;
    };
    const log = (event, fields) => events.push({ event, ...fields });
    const worker = createTtsWorker({ config, store, client, encoder, log, now: () => clock.t, random: () => 0, sleep });
    const names = () => events.map((e) => e.event);
    return { worker, clock, calls, sleeps, events, encodes, store, names, sleep, log };
  }

  return {
    dir,
    scriptsPath,
    harness,
    writeScripts: (lessons) => writeFileSync(scriptsPath, JSON.stringify({ v: 1, extractorVersion: 1, lessons })),
    readManifest: () => JSON.parse(readFileSync(join(dir, 'public', 'manifest.json'), 'utf8')),
    readState: () => JSON.parse(readFileSync(join(dir, 'work', 'state.json'), 'utf8')),
    m4aFiles: () => readdirSync(join(dir, 'public')).filter((f) => f.endsWith('.m4a')),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
