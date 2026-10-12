/**
 * User display preferences (theme, reading text size, motion), stored under
 * one versioned localStorage key. Pure helpers: parsing never throws and
 * falls back to defaults per field, so a corrupt or hand-edited value can't
 * break the page. The same key/shape is read by the pre-paint script
 * public/prefs-init.js (plain script, no imports) — keep the two in sync.
 */
export const PREFS_KEY = 'omnilab:prefs';
/** Dispatched on `document` after a local write so prefs-init.js re-applies. */
export const PREFS_CHANGED_EVENT = 'omnilab:prefs-changed';

export const THEMES = ['system', 'light', 'dark'] as const;
export const TEXT_SIZES = ['s', 'm', 'l'] as const;
export const MOTIONS = ['system', 'reduce'] as const;

export type ThemePref = (typeof THEMES)[number];
export type TextSizePref = (typeof TEXT_SIZES)[number];
export type MotionPref = (typeof MOTIONS)[number];

export interface UserPrefs {
  v: 1;
  theme: ThemePref;
  textSize: TextSizePref;
  motion: MotionPref;
}

export const DEFAULT_PREFS: UserPrefs = { v: 1, theme: 'system', textSize: 'm', motion: 'system' };

function pick<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Safe parse: null / invalid JSON / unknown values -> defaults (per field). */
export function parsePrefs(raw: string | null | undefined): UserPrefs {
  if (!raw) return { ...DEFAULT_PREFS };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_PREFS };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { ...DEFAULT_PREFS };
  const o = data as Record<string, unknown>;
  return {
    v: 1,
    theme: pick(THEMES, o.theme, DEFAULT_PREFS.theme),
    textSize: pick(TEXT_SIZES, o.textSize, DEFAULT_PREFS.textSize),
    motion: pick(MOTIONS, o.motion, DEFAULT_PREFS.motion),
  };
}

export function serializePrefs(prefs: UserPrefs): string {
  return JSON.stringify({ v: 1, theme: prefs.theme, textSize: prefs.textSize, motion: prefs.motion });
}

/** Reads prefs from `storage`; storage errors (blocked / private mode) -> defaults. */
export function readPrefs(storage: Pick<Storage, 'getItem'> | undefined = safeLocalStorage()): UserPrefs {
  try {
    return parsePrefs(storage?.getItem(PREFS_KEY));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/**
 * Persists prefs and notifies the page (when `notify` is true and a document
 * exists). Returns false when storage rejects the write (e.g. blocked storage):
 * the notification still fires, but prefs-init.js re-reads storage and falls
 * back to defaults, so the choice does not stick in that case.
 */
export function writePrefs(
  prefs: UserPrefs,
  storage: Pick<Storage, 'setItem'> | undefined = safeLocalStorage(),
  notify = true,
): boolean {
  let ok = true;
  try {
    if (!storage) throw new Error('no storage');
    storage.setItem(PREFS_KEY, serializePrefs(prefs));
  } catch {
    ok = false;
  }
  if (notify && typeof document !== 'undefined') document.dispatchEvent(new Event(PREFS_CHANGED_EVENT));
  return ok;
}

/** Merges a partial change into the stored prefs and writes it. */
export function updatePrefs(patch: Partial<Omit<UserPrefs, 'v'>>): UserPrefs {
  const next = parsePrefs(JSON.stringify({ ...readPrefs(), ...patch }));
  writePrefs(next);
  return next;
}

/** Calls `cb` when another tab changes the prefs (storage event). Returns unsubscribe. */
export function subscribePrefs(cb: (prefs: UserPrefs) => void): () => void {
  const onStorage = (ev: StorageEvent) => {
    if (ev.key === null || ev.key === PREFS_KEY) cb(parsePrefs(ev.newValue));
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
