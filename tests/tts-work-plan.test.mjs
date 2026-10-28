// TTS work plan: audioKey inputs, queue order (resume, missing, stale in course order),
// failed lessons waiting for retryAfter, and the lenient state.json parser.
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { speechScriptHashInput } from '../src/lib/speech-script-contract.ts';
import {
  buildWorkQueue, clearFailedForLesson, computeAudioKey, emptyTtsState, failedRecord, parseTtsState, targetKeys,
} from '../server/tts/tts-work-plan.ts';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 28, 7);
const CONFIG = { model: 'gemini-3.8-flash-tts', voice: 'Charon', style: 'Giọng trầm.', maxChunkChars: 1800 };

function lesson(id, paragraphs = [`Bài ${id}.`]) {
  const chapters = [{ id: ':intro', title: 'Mở đầu', paragraphs, marks: [] }];
  return { id, title: id, scriptHash: createHash('sha256').update(speechScriptHashInput(chapters)).digest('hex'), chapters };
}

const entry = (audioKey) => ({ scriptHash: 'x', audioKey, file: 'f', durationSec: 1, chapters: [], generatedAt: 'g', model: 'm', voice: 'v' });

function queueFor(lessons, { entries = {}, state = emptyTtsState(), workDirs = [], only, now = NOW } = {}) {
  const targets = targetKeys(lessons, CONFIG);
  const manifest = { v: 1, updatedAt: '', lessons: entries };
  return { targets, ...buildWorkQueue({ lessons, targets, manifest, state, workDirs: new Set(workDirs), now, only }) };
}

describe('computeAudioKey', () => {
  const base = { scriptHash: 'a'.repeat(64), ...CONFIG };

  it('is a stable sha256 hex', () => {
    expect(computeAudioKey(base)).toMatch(/^[0-9a-f]{64}$/);
    expect(computeAudioKey({ ...base })).toBe(computeAudioKey(base));
  });

  it('changes with voice, model, style, chunk size or script', () => {
    const key = computeAudioKey(base);
    for (const change of [{ voice: 'Orus' }, { model: 'other' }, { style: 'Khác.' }, { maxChunkChars: 1500 }, { scriptHash: 'b'.repeat(64) }]) {
      expect(computeAudioKey({ ...base, ...change })).not.toBe(key);
    }
  });

  it('editing one paragraph gives the whole lesson a new key', () => {
    const before = targetKeys([lesson('a/b/c', ['Một.', 'Hai.'])], CONFIG).get('a/b/c');
    const after = targetKeys([lesson('a/b/c', ['Một.', 'Hai sửa.'])], CONFIG).get('a/b/c');
    expect(after).not.toBe(before);
  });
});

describe('buildWorkQueue', () => {
  const lessons = ['d/m/one', 'd/m/two', 'd/m/three', 'd/m/four'].map((id) => lesson(id));
  const keys = targetKeys(lessons, CONFIG);

  it('resume first, then missing, then stale, each in course order; done lessons skipped', () => {
    const entries = {
      'd/m/one': entry('0'.repeat(64)), // stale
      'd/m/three': entry(keys.get('d/m/three')), // done
      'd/m/four': entry('1'.repeat(64)), // stale but resumable
    };
    const { queue, counts } = queueFor(lessons, { entries, workDirs: [`d/m/four/${keys.get('d/m/four')}`] });
    expect(queue.map((i) => [i.lesson.id, i.reason])).toEqual([['d/m/four', 'resume'], ['d/m/two', 'missing'], ['d/m/one', 'stale']]);
    expect(queue[0].audioKey).toBe(keys.get('d/m/four'));
    expect(counts).toEqual({ missing: 1, stale: 1, failed: 0 });
  });

  it('a work dir for an old key does not count as resumable', () => {
    const { queue } = queueFor(lessons, { workDirs: ['d/m/four/' + '2'.repeat(64)] });
    expect(queue.map((i) => i.reason)).toEqual(['missing', 'missing', 'missing', 'missing']);
  });

  it('skips a failed key until retryAfter, then queues it again', () => {
    const state = emptyTtsState();
    state.failed[keys.get('d/m/two')] = failedRecord('d/m/two', NOW, 7 * DAY, 'boom');
    const waiting = queueFor(lessons, { state, now: NOW + 6 * DAY });
    expect(waiting.queue.map((i) => i.lesson.id)).not.toContain('d/m/two');
    expect(waiting.counts.failed).toBe(1);
    const due = queueFor(lessons, { state, now: NOW + 7 * DAY + 1 });
    expect(due.queue.map((i) => i.lesson.id)).toContain('d/m/two');
  });

  it('a failure recorded for an old key does not block the new key', () => {
    const state = emptyTtsState();
    state.failed['3'.repeat(64)] = failedRecord('d/m/two', NOW, 7 * DAY, 'old');
    expect(queueFor(lessons, { state }).queue).toHaveLength(4);
  });

  it('--only limits the queue to one lesson', () => {
    expect(queueFor(lessons, { only: 'd/m/three' }).queue.map((i) => i.lesson.id)).toEqual(['d/m/three']);
  });
});

describe('state helpers', () => {
  it('failedRecord caps the reason at 300 chars', () => {
    const record = failedRecord('d/m/x', NOW, DAY, 'r'.repeat(500));
    expect(record).toMatchObject({ lessonId: 'd/m/x', at: NOW, retryAfter: NOW + DAY });
    expect(record.reason).toHaveLength(300);
  });

  it('clearFailedForLesson removes every key of that lesson only', () => {
    const state = emptyTtsState();
    state.failed['a'.repeat(64)] = failedRecord('d/m/x', NOW, DAY, '');
    state.failed['b'.repeat(64)] = failedRecord('d/m/x', NOW, DAY, '');
    state.failed['c'.repeat(64)] = failedRecord('d/m/y', NOW, DAY, '');
    expect(clearFailedForLesson(state, 'd/m/x')).toBe(true);
    expect(Object.keys(state.failed)).toEqual(['c'.repeat(64)]);
    expect(clearFailedForLesson(state, 'd/m/x')).toBe(false);
  });

  it('parseTtsState drops malformed records and rejects other shapes', () => {
    const raw = {
      v: 1,
      pausedUntil: NOW,
      failed: { ['a'.repeat(64)]: { lessonId: 'd/m/x', at: 1, retryAfter: 2, reason: 'r' }, short: { lessonId: 'd/m/x', at: 1, retryAfter: 2 }, ['b'.repeat(64)]: { lessonId: '../x', at: 1, retryAfter: 2 } },
      retired: { 'f.m4a': { at: 5, kind: 'replaced' }, 'g.m4a': { at: 5, kind: 'weird' } },
    };
    expect(parseTtsState(raw)).toEqual({
      v: 1,
      pausedUntil: NOW,
      failed: { ['a'.repeat(64)]: { lessonId: 'd/m/x', at: 1, retryAfter: 2, reason: 'r' } },
      retired: { 'f.m4a': { at: 5, kind: 'replaced' } },
    });
    expect(parseTtsState({ v: 2, failed: {}, retired: {} })).toBeNull();
    expect(parseTtsState(null)).toBeNull();
  });
});
