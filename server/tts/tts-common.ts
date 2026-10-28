/**
 * Tiny helpers shared by the TTS worker modules (server/tts only, so the
 * worker image never needs another src/lib file for them).
 */

export const SECOND_MS = 1000;
export const MINUTE_MS = 60 * SECOND_MS;

export type Json = Record<string, unknown>;

/** Plain JSON object (arrays excluded). */
export const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);

/** `JSON.parse` that returns `undefined` instead of throwing. */
export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Rounds to 2 decimals (seconds and ratios in logs and the manifest). */
export const round2 = (value: number) => Math.round(value * 100) / 100;

/** `readdir(...).catch(noEntries)`: a missing directory reads as empty. */
export const noEntries = () => [] as string[];
