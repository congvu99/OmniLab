/**
 * Build-time access to a lesson's speech script, shared by the
 * `/tts-scripts.json` endpoint and the reader page (`data-script-hash`), so
 * each lesson is rendered and extracted once per build.
 */
import { render } from 'astro:content';
import { getDomain, type QueriedLesson } from './content-queries';
import { buildSpeechLesson } from './speech-script-extract';
import type { SpeechLesson } from './speech-script-contract';

const cache = new Map<string, Promise<SpeechLesson | null>>();

const warn = (message: string): void => console.warn(message);

async function loadSpeechLesson(lesson: QueriedLesson): Promise<SpeechLesson | null> {
  try {
    const [{ headings }, domain] = await Promise.all([render(lesson.entry), getDomain(lesson.domainId)]);
    return buildSpeechLesson(
      {
        id: lesson.id,
        title: lesson.title,
        body: lesson.entry.body ?? '',
        headings,
        hasPageDisclaimer: domain?.data.isFinance === true,
      },
      warn,
    );
  } catch (error) {
    // Same contract as buildSpeechLesson: the lesson only loses its audio.
    warn(`[tts-scripts] skipped ${lesson.id}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * The lesson's speech script, or null (already warned) when it could not be
 * built. Never rejects. Memoized per lesson id for the whole build; not in
 * `astro dev`, where an edited MDX must show its new hash without a restart.
 */
export function getLessonSpeechScript(lesson: QueriedLesson): Promise<SpeechLesson | null> {
  if (import.meta.env.DEV) return loadSpeechLesson(lesson);
  let pending = cache.get(lesson.id);
  if (!pending) {
    pending = loadSpeechLesson(lesson);
    cache.set(lesson.id, pending);
  }
  return pending;
}
