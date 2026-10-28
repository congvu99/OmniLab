/**
 * TTS worker process: the sleep loop around the cycle (tts-cycle.ts), SIGTERM
 * handling and the CLI.
 * Run: `node server/tts/tts-worker-entry.ts` (env: see tts-config.ts) or
 * `pnpm tts:dev` (local paths). Logs one JSON line per event, never the key.
 */
import { parseArgs } from 'node:util';
import { LESSON_ID_PATTERN } from '../../src/lib/progress-state.ts';
import { createGeminiTtsClient } from './gemini-tts-client.ts';
import { createFfmpegEncoder } from './audio-encode.ts';
import { createAudioStore, RETRY_ALL_FAILED } from './audio-store.ts';
import type { LogEvent } from './audio-gc.ts';
import { configFromEnv, describeConfig, FFMPEG_TIMEOUT_MS } from './tts-config.ts';
import { sleep as realSleep } from './tts-schedule.ts';
import type { Sleep } from './tts-schedule.ts';
import { errorMessage as message } from './tts-worker.ts';
import type { CycleOutcome } from './tts-worker.ts';
import { createTtsWorker } from './tts-cycle.ts';
import type { TtsWorker } from './tts-cycle.ts';

const USAGE = `Usage: node server/tts/tts-worker-entry.ts [options]

  --dev                     local paths (./.data/audio, dist/tts-scripts.json)
  --once                    process the queue (or until the first pause), then exit
  --only <lessonId>         limit work to one lesson (domain/module/slug)
  --retry-failed <lessonId> ask the running worker to retry a failed lesson, then exit
  --retry-failed all        same for every failed lesson
  -h, --help                show this help`;

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;
const ERROR_EVENTS = new Set([
  'error', 'scripts_invalid', 'auth_failed', 'contract_failed', 'upstream_unavailable', 'quota_minute_exhausted',
  'encode_failed', 'lesson_failed', 'failure_streak', 'gc_refused',
]);

export type LoopOptions = { once: boolean; only?: string; rescanMs: number; signal: AbortSignal; log: LogEvent; now?: () => number; sleep?: Sleep };

/** Runs cycles until aborted (or once); returns the process exit code. Never crash-loops on a bad cycle. */
export async function runWorkerLoop(worker: TtsWorker, options: LoopOptions): Promise<number> {
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? realSleep;
  for (;;) {
    let outcome: CycleOutcome | undefined;
    try {
      outcome = await worker.runCycle({ only: options.only }, options.signal);
    } catch (err) {
      if (options.signal.aborted) break;
      options.log('error', { message: message(err) });
    }
    if (options.once) {
      const clean = outcome?.kind === 'done' || outcome?.kind === 'paused' || (outcome?.kind === 'idle' && outcome.reason === 'no_key');
      options.log('exit', { outcome: outcome ?? 'error' });
      return clean ? EXIT_OK : EXIT_FAILED;
    }
    // Đang tạm dừng vì quota: vẫn thức dậy theo chu kỳ quét để dọn dẹp và nhận bài mới deploy.
    const wait = outcome?.kind === 'paused' ? Math.min(options.rescanMs, Math.max(0, outcome.until - now())) : options.rescanMs;
    try {
      await sleep(wait, options.signal);
    } catch {
      if (options.signal.aborted) break;
    }
  }
  options.log('stopped', {});
  return EXIT_OK;
}

const jsonLogger = (now: () => number): LogEvent => (event, fields = {}) => {
  const line = JSON.stringify({ t: new Date(now()).toISOString(), event, ...fields });
  (ERROR_EVENTS.has(event) ? console.error : console.log)(line);
};

/** CLI entry; returns the process exit code. */
export async function main(argv: string[], env: NodeJS.ProcessEnv, signal: AbortSignal): Promise<number> {
  let args;
  try {
    args = parseArgs({
      args: argv,
      allowPositionals: false,
      options: {
        dev: { type: 'boolean', default: false }, once: { type: 'boolean', default: false }, only: { type: 'string' },
        'retry-failed': { type: 'string' }, help: { type: 'boolean', short: 'h', default: false },
      },
    }).values;
    const retryAll = args['retry-failed'] === RETRY_ALL_FAILED;
    for (const id of [args.only, retryAll ? undefined : args['retry-failed']]) {
      if (id !== undefined && !LESSON_ID_PATTERN.test(id)) throw new Error(`invalid lesson id "${id}" (want domain/module/slug)`);
    }
  } catch (err) {
    console.error(`${message(err)}\n\n${USAGE}`);
    return EXIT_USAGE;
  }
  if (args.help) {
    console.log(USAGE);
    return EXIT_OK;
  }
  let config;
  try {
    config = configFromEnv(env, args.dev);
  } catch (err) {
    console.error(`tts worker: ${message(err)}`);
    return EXIT_USAGE;
  }
  const store = createAudioStore(config.dataDir);
  const retryLessonId = args['retry-failed'];
  if (retryLessonId !== undefined) {
    // Chỉ ghi file yêu cầu; worker đang chạy tự xử lý ở đầu vòng sau, tránh hai tiến trình cùng ghi state.json.
    await store.writeRetryRequest(retryLessonId, Date.now());
    console.log(`retry requested for ${retryLessonId}; the running worker applies it at its next cycle`);
    return EXIT_OK;
  }
  const log = jsonLogger(Date.now);
  const client = config.apiKey ? createGeminiTtsClient({ apiKey: config.apiKey, timeoutMs: config.requestTimeoutMs }) : null;
  const encoder = createFfmpegEncoder({ ffmpegPath: config.ffmpegPath, env, timeoutMs: FFMPEG_TIMEOUT_MS });
  log('start', { ...describeConfig(config), dataDir: config.dataDir, scriptsPath: config.scriptsPath, once: args.once });
  const worker = createTtsWorker({ config, store, client, encoder, log });
  return runWorkerLoop(worker, { once: args.once, only: args.only, rescanMs: config.rescanMs, signal, log });
}

if (import.meta.main) {
  const controller = new AbortController();
  const stop = () => controller.abort(new Error('worker stopping'));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  try {
    process.exitCode = await main(process.argv.slice(2), process.env, controller.signal);
  } catch (err) {
    console.error(`tts worker failed: ${message(err)}`);
    process.exitCode = EXIT_FAILED;
  }
}
