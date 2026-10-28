/**
 * One worker cycle: retry requests, script load, safe GC, quota pause check,
 * then the queue. A lesson processor result other than `undefined` stops the
 * cycle (pause, auth, contract, upstream, repeated failure, encode failure).
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parseSpeechScripts, speechScriptHashInput } from '../../src/lib/speech-script-contract.ts';
import type { SpeechLesson } from '../../src/lib/speech-script-contract.ts';
import { RETRY_ALL_FAILED } from './audio-store.ts';
import { runGc } from './audio-gc.ts';
import { buildWorkQueue, clearFailedForLesson, targetKeys } from './tts-work-plan.ts';
import type { TtsState } from './tts-work-plan.ts';
import { createLessonProcessor, errorMessage } from './tts-worker.ts';
import type { CycleOutcome, LessonContext, WorkerDeps } from './tts-worker.ts';

/** The page shows `scriptHash`; a value that does not match the text means a corrupt or mixed build output. */
function verifyScriptHash(lesson: SpeechLesson): void {
  const actual = createHash('sha256').update(speechScriptHashInput(lesson.chapters)).digest('hex');
  if (actual !== lesson.scriptHash) throw new Error(`lesson "${lesson.id}": scriptHash does not match its chapters`);
}

/** Builds the per-cycle runner around the lesson processor. */
export function createTtsWorker(deps: WorkerDeps) {
  const { config, store, client, log } = deps;
  const now = deps.now ?? Date.now;
  const processor = createLessonProcessor(deps);
  let loggedNoKey = false;

  async function loadScripts(): Promise<SpeechLesson[] | null> {
    try {
      const { lessons } = parseSpeechScripts(await readFile(config.scriptsPath, 'utf8'));
      lessons.forEach(verifyScriptHash);
      if (lessons.length > 0) return lessons;
      log('scripts_invalid', { reason: 'no lessons' });
    } catch (err) {
      // Chỉ log lý do (đường dẫn lỗi trong JSON), không bao giờ log nội dung văn bản đọc.
      log('scripts_invalid', { reason: errorMessage(err) });
    }
    return null;
  }

  async function applyRetryRequests(state: TtsState): Promise<void> {
    const requests = await store.readRetryRequests();
    if (requests.length === 0) return;
    for (const request of requests) {
      if (request === RETRY_ALL_FAILED) state.failed = {};
      else clearFailedForLesson(state, request);
    }
    await store.writeState(state);
    for (const request of requests) await store.removeRetryRequest(request);
    log('retry_requested', { lessons: requests });
  }

  /** One pass; scripts that are unreadable or empty skip GC and generation entirely. */
  async function runCycle(options: { only?: string } = {}, signal?: AbortSignal): Promise<CycleOutcome> {
    await store.ensureLayout();
    const { state, corrupt } = await store.readState();
    if (corrupt) log('error', { message: 'state.json unreadable, starting from an empty state' });
    await applyRetryRequests(state);
    const lessons = await loadScripts();
    if (!lessons) return { kind: 'idle', reason: 'scripts_invalid' };
    const { manifest, invalidMovedTo } = await store.readManifest(now());
    if (invalidMovedTo) log('error', { message: 'manifest.json unreadable, moved aside', movedTo: invalidMovedTo });
    const targets = targetKeys(lessons, config);
    const { retainOldMs, retainRemovedMs } = config;
    const manifestRecovered = invalidMovedTo !== undefined;
    await runGc({ store, manifest, state, targets, log, retainOldMs, retainRemovedMs, lessonIds: new Set(targets.keys()), now: now(), manifestRecovered });
    if (!client) {
      if (!loggedNoKey) log('idle_no_key', { hint: 'no Gemini API key configured: cleanup only, no audio generated' });
      loggedNoKey = true;
      return { kind: 'idle', reason: 'no_key' };
    }
    if (state.pausedUntil !== undefined && state.pausedUntil > now()) {
      log('paused', { until: new Date(state.pausedUntil).toISOString(), reason: 'quota_pause_pending' });
      return { kind: 'paused', until: state.pausedUntil };
    }
    const workDirs = await store.listWorkDirs();
    const dirKeys = new Set(workDirs.map((d) => `${d.lessonId}/${d.audioKey}`));
    const { queue, counts } = buildWorkQueue({ lessons, targets, manifest, state, workDirs: dirKeys, now: now(), only: options.only });
    log('cycle', { ...counts, queued: queue.length, workDirs: workDirs.length });
    const ctx: LessonContext = { client, manifest, state, signal };
    for (const item of queue) {
      const stop = await processor.processLesson(ctx, item);
      if (stop) return stop;
    }
    return { kind: 'done' };
  }

  return { runCycle };
}

export type TtsWorker = ReturnType<typeof createTtsWorker>;
