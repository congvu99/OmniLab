// --backup CLI mode: VACUUM INTO dated file, idempotent per day, prune > 14 days, restore round-trip.
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openStore } from '../server/sync/sync-sqlite-store.ts';
import { backupFileName, runBackup } from '../server/sync/sync-backup.ts';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 12, 3, 15);
let dir;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'omnilab-backup-'));
  const store = openStore(join(dir, 'omnilab.db'));
  store.createUser('alice', 'hash', NOW);
  store.close();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('runBackup', () => {
  it('names the file by UTC date', () => {
    expect(backupFileName(new Date(NOW))).toBe('omnilab-2026-10-12.db');
  });

  it('dates the file by Vietnam day (UTC+7)', () => {
    expect(backupFileName(new Date(Date.UTC(2026, 9, 12, 20, 15)))).toBe('omnilab-2026-10-13.db');
    expect(backupFileName(new Date(Date.UTC(2026, 9, 12, 16, 59)))).toBe('omnilab-2026-10-12.db');
  });

  it('failed run keeps the existing same-day snapshot and leaves no temp file', () => {
    const file = runBackup(dir, NOW);
    writeFileSync(join(dir, 'omnilab.db'), 'not a database'.repeat(100));
    expect(() => runBackup(dir, NOW)).toThrow();
    const copy = openStore(file);
    expect(copy.getUser('alice')?.username).toBe('alice');
    copy.close();
    expect(readdirSync(join(dir, 'backups'))).toEqual(['omnilab-2026-10-12.db']);
  });

  it('creates backups dir and a snapshot containing the data', () => {
    const file = runBackup(dir, NOW);
    expect(file).toBe(join(dir, 'backups', 'omnilab-2026-10-12.db'));
    const copy = openStore(file);
    expect(copy.getUser('alice')?.username).toBe('alice');
    copy.close();
  });

  it('runs twice on the same day without error and replaces the file', () => {
    runBackup(dir, NOW);
    const store = openStore(join(dir, 'omnilab.db'));
    store.createUser('bob', 'hash', NOW);
    store.close();
    const file = runBackup(dir, NOW);
    const copy = openStore(file);
    expect(copy.getUser('bob')?.username).toBe('bob');
    copy.close();
  });

  it('prunes backups older than 14 days, keeps recent and unrelated files', () => {
    const backups = join(dir, 'backups');
    mkdirSync(backups, { recursive: true });
    const old = join(backups, 'omnilab-2026-09-01.db');
    const recent = join(backups, 'omnilab-2026-10-05.db');
    const other = join(backups, 'notes.txt');
    for (const f of [old, recent, other]) writeFileSync(f, 'x');
    utimesSync(old, new Date(NOW - 20 * DAY), new Date(NOW - 20 * DAY));
    utimesSync(recent, new Date(NOW - 7 * DAY), new Date(NOW - 7 * DAY));
    utimesSync(other, new Date(NOW - 30 * DAY), new Date(NOW - 30 * DAY));
    runBackup(dir, NOW);
    expect(existsSync(old)).toBe(false);
    expect(existsSync(recent)).toBe(true);
    expect(existsSync(other)).toBe(true);
    expect(readdirSync(backups)).toContain('omnilab-2026-10-12.db');
  });

  it('restore procedure: stale wal/shm removed, backup copied over, data present', () => {
    const file = runBackup(dir, NOW);
    const store = openStore(join(dir, 'omnilab.db'));
    store.createUser('carol', 'hash', NOW);
    store.close();
    writeFileSync(join(dir, 'omnilab.db-wal'), 'stale');
    writeFileSync(join(dir, 'omnilab.db-shm'), 'stale');
    rmSync(join(dir, 'omnilab.db-wal'));
    rmSync(join(dir, 'omnilab.db-shm'));
    copyFileSync(file, join(dir, 'omnilab.db'));
    const restored = openStore(join(dir, 'omnilab.db'));
    expect(restored.getUser('alice')?.username).toBe('alice');
    expect(restored.getUser('carol')).toBeUndefined();
    restored.close();
  });

  it('CLI: --backup uses DATA_DIR, needs no SESSION_SECRET, exits 0', () => {
    const r = spawnSync(process.execPath, ['server/sync/sync-server-entry.ts', '--backup'], {
      env: { PATH: process.env.PATH, DATA_DIR: dir },
      encoding: 'utf8',
    });
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toMatch(/backup ok .*omnilab-\d{4}-\d{2}-\d{2}\.db/);
    expect(readdirSync(join(dir, 'backups')).length).toBe(1);
  });

  it('CLI: missing database fails non-zero and creates no empty db', () => {
    const empty = mkdtempSync(join(tmpdir(), 'omnilab-backup-empty-'));
    const r = spawnSync(process.execPath, ['server/sync/sync-server-entry.ts', '--backup'], {
      env: { PATH: process.env.PATH, DATA_DIR: empty },
      encoding: 'utf8',
    });
    expect(r.status).not.toBe(0);
    expect(existsSync(join(empty, 'omnilab.db'))).toBe(false);
    rmSync(empty, { recursive: true, force: true });
  });
});
