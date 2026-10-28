// Static speech scripts for the TTS worker (built once at deploy time, then
// copied into the tts image). Lessons whose extraction fails are left out
// with a `[tts-scripts]` build warning instead of failing the site build.
// Public on purpose: it only holds lesson text that the pages already show.
import type { APIRoute } from 'astro';
import { getAllLessonsOrdered } from '../lib/content-queries';
import {
  SPEECH_EXTRACTOR_VERSION,
  SPEECH_SCRIPTS_FILE_VERSION,
  type SpeechLesson,
  type SpeechScriptsFile,
} from '../lib/speech-script-contract';
import { getLessonSpeechScript } from '../lib/speech-script-queries';

export const GET: APIRoute = async () => {
  const lessons = await getAllLessonsOrdered();
  const scripts = await Promise.all(lessons.map(getLessonSpeechScript));
  const payload: SpeechScriptsFile = {
    v: SPEECH_SCRIPTS_FILE_VERSION,
    extractorVersion: SPEECH_EXTRACTOR_VERSION,
    // Course order (getAllLessonsOrdered), so the worker fills lessons in reading order.
    lessons: scripts.filter((script): script is SpeechLesson => script !== null),
  };
  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
};
