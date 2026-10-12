/** Public contract + injectable dependencies of the client sync engine (see progress-sync.ts). */
import type { ProgressStore, StorageLike } from './progress-store';
import type { FetchLike } from './progress-sync-http';
import type { AuthResult, SyncStatus } from './progress-sync-types';

export interface ProgressSync {
  register(username: string, password: string, confirm: string): Promise<AuthResult>;
  login(username: string, password: string): Promise<AuthResult>;
  /** Answer to `needsMergeDecision`: 'merge' pushes local data into the account, 'use-account' wipes local data and pulls. */
  resolveMerge(choice: 'merge' | 'use-account'): Promise<void>;
  /** Ends the session; local data and `owner` stay unless `clearLocal`. */
  logout(opts?: { clearLocal?: boolean }): Promise<void>;
  logoutAll(opts?: { clearLocal?: boolean }): Promise<void>;
  /** Called immediately with the current status, then on every change. */
  subscribe(fn: (status: SyncStatus) => void): () => void;
}

export interface CreateProgressSyncOptions {
  store: ProgressStore;
  fetch?: FetchLike;
  now?: () => number;
  storage?: StorageLike;
  doc?: { visibilityState: string; addEventListener(type: 'visibilitychange', fn: () => void): void };
  win?: { addEventListener(type: 'pagehide', fn: () => void): void; addEventListener(type: 'storage', fn: (e: { key: string | null }) => void): void };
  /** Lesson ids that exist in this build (lessons-index.json); unknown ids are not sent. `undefined` = no filtering. */
  getKnownIds?: () => Promise<ReadonlySet<string> | undefined>;
}
