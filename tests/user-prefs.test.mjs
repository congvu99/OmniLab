// user-prefs: safe parsing, defaulting per field, writing and cross-tab events.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PREFS,
  PREFS_KEY,
  parsePrefs,
  readPrefs,
  serializePrefs,
  subscribePrefs,
  writePrefs,
} from '../src/lib/user-prefs.ts';

const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
};

afterEach(() => vi.unstubAllGlobals());

describe('parsePrefs', () => {
  it('returns defaults for missing, corrupt or non-object input', () => {
    for (const raw of [null, undefined, '', '{oops', 'null', '42', '[]', '"x"']) {
      expect(parsePrefs(raw), String(raw)).toEqual(DEFAULT_PREFS);
    }
  });

  it('reads valid values', () => {
    const raw = JSON.stringify({ v: 1, theme: 'dark', textSize: 'l', motion: 'reduce' });
    expect(parsePrefs(raw)).toEqual({ v: 1, theme: 'dark', textSize: 'l', motion: 'reduce' });
  });

  it('falls back per field on unknown values and ignores extra keys', () => {
    const raw = JSON.stringify({ theme: 'neon', textSize: 's', motion: 7, extra: true });
    expect(parsePrefs(raw)).toEqual({ v: 1, theme: 'system', textSize: 's', motion: 'system' });
  });

  it('returns a fresh object each time', () => {
    expect(parsePrefs(null)).not.toBe(DEFAULT_PREFS);
  });
});

describe('read / write', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage();
    const prefs = { v: 1, theme: 'light', textSize: 's', motion: 'reduce' };
    expect(writePrefs(prefs, storage, false)).toBe(true);
    expect(JSON.parse(storage.data[PREFS_KEY])).toEqual(prefs);
    expect(readPrefs(storage)).toEqual(prefs);
    expect(parsePrefs(serializePrefs(prefs))).toEqual(prefs);
  });

  it('returns false when storage throws, and read falls back to defaults', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(writePrefs(DEFAULT_PREFS, broken, false)).toBe(false);
    expect(readPrefs(broken)).toEqual(DEFAULT_PREFS);
  });

  it('notifies the document so the page re-applies immediately', () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('document', { dispatchEvent });
    writePrefs(DEFAULT_PREFS, memoryStorage());
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent.mock.calls[0][0].type).toBe('omnilab:prefs-changed');
  });
});

describe('subscribePrefs', () => {
  it('reports storage events for the prefs key and stops after unsubscribe', () => {
    let handler;
    const removed = [];
    vi.stubGlobal('window', {
      addEventListener: (_t, h) => {
        handler = h;
      },
      removeEventListener: (_t, h) => removed.push(h),
    });
    const cb = vi.fn();
    const off = subscribePrefs(cb);
    handler({ key: 'other', newValue: '{}' });
    expect(cb).not.toHaveBeenCalled();
    handler({ key: PREFS_KEY, newValue: JSON.stringify({ theme: 'dark' }) });
    expect(cb).toHaveBeenCalledWith({ v: 1, theme: 'dark', textSize: 'm', motion: 'system' });
    handler({ key: null, newValue: null }); // storage.clear()
    expect(cb).toHaveBeenLastCalledWith(DEFAULT_PREFS);
    off();
    expect(removed).toEqual([handler]);
  });
});
