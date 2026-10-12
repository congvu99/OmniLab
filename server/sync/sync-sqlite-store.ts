/**
 * SQLite persistence for the sync sidecar (node:sqlite, one file, WAL).
 * Owns the schema and the atomic read -> merge -> write of a user's progress.
 */
import { DatabaseSync } from 'node:sqlite';
import { migrate } from '../../src/lib/progress-state.ts';
import type { SyncState } from '../../src/lib/progress-state.ts';
import { mergeStates } from '../../src/lib/progress-merge.ts';

export interface UserRow {
  username: string;
  pass_hash: string;
  session_version: number;
}

const EMPTY: SyncState = { v: 2, lessons: {}, bookmarkMeta: {} };

/** Validate an untrusted payload, drop owner/derived data and clamp future timestamps to `now`. */
export function sanitizeIncoming(raw: unknown, now: number): SyncState | null {
  if (!raw || typeof raw !== 'object' || (raw as { v?: unknown }).v !== 2) return null;
  const s = migrate(raw);
  const clamp = (n: number | undefined) => (n !== undefined && n > now ? now : n);
  const lessons: SyncState['lessons'] = {};
  for (const [id, l] of Object.entries(s.lessons)) {
    const out = { ...l };
    for (const key of ['doneAt', 'doneUpdatedAt', 'visitedAt'] as const) {
      if (out[key] !== undefined) out[key] = clamp(out[key]);
    }
    lessons[id] = out;
  }
  const bookmarkMeta: SyncState['bookmarkMeta'] = {};
  for (const [id, m] of Object.entries(s.bookmarkMeta)) bookmarkMeta[id] = { on: m.on, at: clamp(m.at)! };
  return { v: 2, lessons, bookmarkMeta };
}

export function openStore(file: string) {
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=3000;
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      pass_hash TEXT NOT NULL,
      session_version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS progress (
      username TEXT PRIMARY KEY REFERENCES users(username),
      state_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, pass_hash, created_at) VALUES (?, ?, ?)');
  const selectUser = db.prepare('SELECT username, pass_hash, session_version FROM users WHERE username = ?');
  const bumpVersion = db.prepare('UPDATE users SET session_version = session_version + 1 WHERE username = ?');
  const selectState = db.prepare('SELECT state_json FROM progress WHERE username = ?');
  const upsertState = db.prepare(
    `INSERT INTO progress (username, state_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(username) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at`,
  );

  function readState(username: string): SyncState {
    const row = selectState.get(username) as { state_json: string } | undefined;
    return row ? (JSON.parse(row.state_json) as SyncState) : EMPTY;
  }

  return {
    ping(): boolean {
      return (db.prepare('SELECT 1 AS ok').get() as { ok: number }).ok === 1;
    },
    /** False when the username already exists. */
    createUser(username: string, passHash: string, now: number): boolean {
      return Number(insertUser.run(username, passHash, now).changes) === 1;
    },
    getUser(username: string): UserRow | undefined {
      return selectUser.get(username) as UserRow | undefined;
    },
    /** Invalidates every cookie issued so far (logout-all / password reset). */
    bumpSessionVersion(username: string): void {
      bumpVersion.run(username);
    },
    getProgress(username: string): SyncState {
      return readState(username);
    },
    /**
     * Atomic read -> merge -> size check -> write. Returns the merged state, or
     * 'too_large' when it would exceed `maxBytes` (nothing is written then).
     */
    mergeProgress(username: string, incoming: SyncState, now: number, maxBytes: number): SyncState | 'too_large' {
      db.exec('BEGIN IMMEDIATE');
      try {
        const merged = mergeStates(readState(username), incoming);
        const json = JSON.stringify(merged);
        if (Buffer.byteLength(json) > maxBytes) {
          db.exec('ROLLBACK');
          return 'too_large';
        }
        upsertState.run(username, json, now);
        db.exec('COMMIT');
        return merged;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    /** Consistent online snapshot (VACUUM INTO) for the backup job. */
    backupTo(path: string): void {
      db.prepare('VACUUM INTO ?').run(path);
    },
    close(): void {
      db.close();
    },
  };
}

export type Store = ReturnType<typeof openStore>;
