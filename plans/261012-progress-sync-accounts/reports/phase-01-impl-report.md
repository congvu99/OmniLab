# Phase 01 impl report (schema v2 + merge)

Worktree: D:/project/OmniLab-progress-sync (feat/progress-sync). Not committed.

## Files
- NEW src/lib/progress-merge.ts (116 lines): `mergeStates`, `stateHash` (canonical JSON + cyrb53, 14 hex chars; ignores owner + derived bookmarks). Pure, `.ts` import of progress-state.
- MOD src/lib/progress-state.ts (173): types `SyncState` (persisted/wire: v:2, owner?, lessons, bookmarkMeta) and `ProgressState extends SyncState { bookmarks }` (derived). `migrate` v1->v2 / v2 validate (id regex, forbidden keys), `isUnknownFutureVersion` v>2, helpers `deriveBookmarks`, `withBookmarks`, `toSyncState`.
- MOD src/lib/progress-store.ts (295; was 261, already >200): markDone writes doneUpdatedAt; toggleBookmark writes bookmarkMeta; `applyRemote`, `setOwner`, `clear`; persists `toSyncState` (no `bookmarks`); `get().bookmarks` derived.
- NEW tests/progress-merge.test.mjs, tests/progress-state-migrate-v2.test.mjs; MOD tests/progress-store.test.mjs (+applyRemote/setOwner/clear block), tests/saved-list-controller.test.mjs (fixture ids only).

## Results
- `pnpm test`: 19 files / 359 tests green (baseline 17 / 327). `pnpm check`: 0 errors/warnings/hints.
- `node -e "import('./src/lib/progress-merge.ts')..."` prints `function`.
- Consumers (lesson-row, bookmark-button, continue-reading-card, mark-complete-button, reader-progress-tracker, progress-ring-apply, saved-list-controller): unchanged, contract preserved (`state.bookmarks`, `lessons[id].done/scroll/visitedAt`, `lastUnfinished`). Studio-only consumers not present in this worktree; they only read the same fields.

## tsconfig
Astro strict base already sets `allowImportingTsExtensions: true` + `noEmit`; no change needed. Store keeps extensionless imports for progress-state; merge uses `.ts`. progress-state uses only `import type` (none needed) so Node type stripping works.

## Deviations / decisions
1. Test fixture ids: v2 id regex validation (per plan) drops short ids when the store re-reads storage in `mutate()`. Changed fixture ids only (e.g. `a/lesson` -> `a/m/lesson`, `'a'` -> `a/b/a` in saved-list tests); behavior assertions unchanged. Real ids always match `domain/module/slug`.
2. v1 migrate stays lenient on ids (no regex; only `__proto__`/`constructor`/`prototype` dropped) since plan applies regex to v2 only. Remote payloads must go through `migrate()` (v2) before `applyRemote` in phase 3.
3. Extra: `doneUpdatedAt`/`bookmark.at` use `max(now, prev+1)` so a same-millisecond re-toggle still wins on merge (tested).
4. Merge uses total-order tuples: done = (doneUpdatedAt, true>false>unknown, doneAt); visit = (visitedAt, scroll); bookmark = (at, on). Missing doneUpdatedAt == 0, normalized in output so ties are side-independent. `__proto__` ids skipped in merge.
5. `mergeStates` accepts `Pick<SyncState,'lessons'|'bookmarkMeta'>`, returns SyncState without owner (store re-adds base.owner).
6. `clear()` writes emptyState directly (resets owner too).

## Unresolved
- progress-store.ts is 295 lines (>200 guideline); could split scroll/bookmark helpers later, left as-is to keep diff small.
- Rollback warning in app-layout (`skipPersist` banner, plan risk section) not done: outside phase-01 file list.

Status: DONE
