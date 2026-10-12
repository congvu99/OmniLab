/**
 * Nightly backup for the sync sidecar: `node server/sync/sync-server-entry.ts --backup`.
 * Consistent online snapshot (VACUUM INTO) to DATA_DIR/backups/omnilab-YYYY-MM-DD.db,
 * then prune snapshots older than 14 days. Runs with the container uid, so file
 * ownership always matches the live database.
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RETENTION_MS = 14 * 86_400_000;
const BACKUP_FILE = /^omnilab-\d{4}-\d{2}-\d{2}\.db$/;

const VN_OFFSET_MS = 7 * 3_600_000; // Asia/Ho_Chi_Minh is fixed UTC+7 (no DST)

/** Named after the Vietnam calendar day, so the 03:15 cron run is dated "today". */
export function backupFileName(date: Date): string {
  return `omnilab-${new Date(date.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10)}.db`;
}

/** Writes today's snapshot (replacing a same-day one) and prunes old ones. Returns the snapshot path. */
export function runBackup(dataDir: string, now: number = Date.now()): string {
  const source = join(dataDir, 'omnilab.db');
  // Never create an empty database as a side effect of a mistyped DATA_DIR.
  if (!existsSync(source)) throw new Error(`database not found: ${source}`);
  const dir = join(dataDir, 'backups');
  mkdirSync(dir, { recursive: true });
  const target = join(dir, backupFileName(new Date(now)));
  // Snapshot into a temp file, then rename over the target: a failed run
  // never destroys the same-day snapshot made earlier (VACUUM INTO refuses to overwrite).
  const tmp = `${target}.tmp`;
  rmSync(tmp, { force: true });
  const db = new DatabaseSync(source);
  try {
    db.exec('PRAGMA busy_timeout=3000');
    db.prepare('VACUUM INTO ?').run(tmp);
    renameSync(tmp, target);
  } catch (err) {
    rmSync(tmp, { force: true });
    throw err;
  } finally {
    db.close();
  }
  for (const name of readdirSync(dir)) {
    if (!BACKUP_FILE.test(name)) continue;
    const file = join(dir, name);
    if (now - statSync(file).mtimeMs > RETENTION_MS) rmSync(file, { force: true });
  }
  return target;
}

/** CLI wrapper: returns the process exit code. */
export function backupMain(env: NodeJS.ProcessEnv): number {
  try {
    console.log(`backup ok ${runBackup(env.DATA_DIR ?? '/data')}`);
    return 0;
  } catch (err) {
    console.error(`backup failed: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}
