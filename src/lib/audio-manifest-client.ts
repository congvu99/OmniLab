/**
 * Browser side of `/audio/manifest.json`: fetched (revalidated) on every
 * lesson page visit and reduced to this lesson's entry. Any failure (404 on
 * Railpack or `pnpm dev`, network error, non-JSON body, invalid shape, no
 * entry) resolves to null so the player simply stays hidden. Never rejects.
 */
import { parseAudioManifest, type AudioEntry } from './audio-manifest';

export const AUDIO_MANIFEST_URL = '/audio/manifest.json';
/** Public URL prefix of the generated files (Caddy `handle /audio/*`). */
export const AUDIO_URL_PREFIX = '/audio/';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Pick<Response, 'ok' | 'json'>>;

export async function fetchLessonAudioEntry(
  lessonId: string,
  fetchImpl: FetchLike = (input, init) => fetch(input, init),
): Promise<AudioEntry | null> {
  try {
    // no-cache: always revalidate (ETag) so a freshly generated lesson shows up.
    const response = await fetchImpl(AUDIO_MANIFEST_URL, { cache: 'no-cache' });
    if (!response.ok) return null;
    const manifest = parseAudioManifest(await response.json());
    return Object.hasOwn(manifest.lessons, lessonId) ? manifest.lessons[lessonId] : null;
  } catch {
    return null;
  }
}

/** Same-origin URL of an entry's file; `file` already passed AUDIO_FILE_PATTERN. */
export function audioSourceUrl(entry: Pick<AudioEntry, 'file'>): string {
  return `${AUDIO_URL_PREFIX}${entry.file}`;
}
