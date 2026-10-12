# Phase 03 impl report (client sync engine)

Worktree D:/project/OmniLab-progress-sync (feat/progress-sync), uncommitted.

## Files (all < 200 lines)
- NEW src/lib/progress-sync.ts (197): `createProgressSync(opts)` engine.
- NEW src/lib/progress-sync-singleton.ts (~30): `getProgressSync()` singleton (store + localStorage + lessons-index known ids).
- NEW src/lib/progress-sync-contract.ts: `ProgressSync`, `CreateProgressSyncOptions` types.
- NEW src/lib/progress-sync-http.ts: fetch wrapper (AbortController timeout, never throws, status 0 = network), `errorCodeOf`, `usernameOf`.
- NEW src/lib/progress-sync-dirty.ts: `decisionsKey`, dirty tracker (`omnilab:v2:lastSyncedHash`, view filtered by known lesson ids), `loadKnownIds` (4s cap).
- NEW src/lib/progress-sync-triggers.ts: debounce(3s)/maxWait(30s) scheduler, store-change watcher (decisions only, ignores cross-tab origin).
- NEW src/lib/progress-sync-status.ts: status observable.
- MOD src/lib/progress-sync-types.ts: + `SyncStatus`, `AuthResult` (existing exports untouched; `check:server` clean).
- MOD src/lib/progress-store.ts: + `readonly isWriteBlocked` getter (skipPersist).
- MOD src/layouts/app-layout.astro: import + top-level `getProgressSync()`; storage warning now shown when `!isPersistent || isWriteBlocked` (text extended: "...hoặc dữ liệu trên máy mới hơn bản này...").
- MOD src/layouts/reader-layout.astro: import + top-level `getProgressSync()`.
- MOD tests/saved-list-controller.test.mjs: pre-existing failure at base (bookmarks toggled in same ms with real clock -> id-order tie, 1 test red even with my changes stashed); fixed by injecting an advancing `now` in `setupEnriched`.
- NEW tests/progress-sync.test.mjs: 23 tests.

## Public API for phase 4
```ts
import { getProgressSync } from '../lib/progress-sync-singleton';   // NOT progress-sync.ts
sync.subscribe(fn)   // replays current status immediately; returns unsubscribe
sync.register(u, p, confirm): Promise<AuthResult>
sync.login(u, p): Promise<AuthResult>
sync.resolveMerge('merge' | 'use-account'): Promise<void>   // only valid while status = needs-merge-decision
sync.logout({ clearLocal?: boolean }): Promise<void>        // keeps data+owner unless clearLocal
sync.logoutAll(): Promise<void>
```
AuthResult: `{ok:true, username, needsMergeDecision}` | `{ok:false, code: ErrorCode}` (network/5xx -> `unavailable`; unknown 4xx -> `bad_request`; server codes passed through incl. `rate_limited`, `busy`, `bad_credentials`...).
SyncStatus kinds: `checking` (initial, before the one /api/me answers; NEW) | `signed-out` | `unavailable` | `needs-merge-decision {username}` (NEW) | `syncing {username}` | `synced {username, at}` | `error {username, code}`.
- `error` codes seen: `too_large` (413, pushing halted until reload), `unavailable` (network/5xx/non-v2 body), `busy`, others from server body. 401 -> `signed-out` (local data kept).
- Failed logout (server down) leaves user signed in with `error{unavailable}`.
- No DOM events emitted; UI uses subscribe only. Store changes (after applyRemote) reach all islands through the store's own subscribe.

## Behavior summary
- Boot: one GET /api/me (4s timeout). 200 -> reconcile; 401+JSON -> signed-out; anything else -> unavailable (retry on `visible`, status-only, no timers). Signed-out: no other /api call ever (tested).
- Reconcile: owner == user -> GET + merge (push if dirty); owner empty or login -> PUT local (merge) -> applyRemote (via `migrate()`, requires `v===2` else error) -> owner claimed; owner differs -> no PUT, `needs-merge-decision` (also at boot with live session).
- Push: decisions-only (done/bookmark) changes, debounce 3s, maxWait 30s; scroll/visit ride along. hidden/pagehide: `store.flushScroll()` then keepalive PUT if dirty. In-flight edits survive (applyRemote merges) and trigger a follow-up push. Changes arriving via `storage` event from another tab never schedule a push (microtask-tagged), shared `lastSyncedHash` prevents duplicates.
- visible: pull (min 5s gap), push if still dirty. Wire state filtered by lessons-index ids (4s cap, falls back to unfiltered).
- Logout/logout-all send `Content-Type: application/json` + `{}` body.

## Consumers
All listed consumers either subscribe to the store (re-render on applyRemote) or read `store.get()` at interaction time; the store's `storage` listener already notifies on cross-tab writes (applyRemote writes via `mutate` -> persist -> other tabs get the event). No consumer edits needed. command-palette reads `lastUnfinished` lazily on open.

## Gates
`pnpm test` 31 files / 595 tests green (+23 new; was 571 on this base w/ 1 pre-existing red), `pnpm check` 0/0/0, `pnpm check:server` clean, `pnpm build` 73 pages. Red phase: tests written against the then-missing module; two logic bugs found and fixed by tests (lesson with only visit counted as a decision; shared Response body in fake).

## Deviations
1. 7 lib files instead of 2 (200-line rule); `getProgressSync` lives in `progress-sync-singleton.ts`, not progress-sync.ts.
2. `SyncStatus` adds `checking` and `needs-merge-decision` (phase-4 needs both: avoids a logged-out form flash; owner flow needs a pending state).
3. Store: new `isWriteBlocked` getter (tiny) for the skipPersist warning.
4. Edited tests/saved-list-controller.test.mjs (outside phase scope) to fix pre-existing red.
5. Visible-pull gap 5s and timeouts (me 4s, others 8s) are my choices.

## Unresolved
- Real-browser check not done (no Playwright run): soft-nav 10 pages one instance is covered by the module-top-level design + singleton test, not by an e2e run.
- On Railpack host each /api call may hang ~2s before 503: boot uses 4s cap, so status stays `checking` up to ~2s; UI should tolerate.
- Phase-4 UI must call `resolveMerge` or the data stays unsynced; nothing auto-resolves.

Status: DONE_WITH_CONCERNS
Summary: Sync engine + singleton + layout mounts done, 23 new tests, all four gates green.
Concerns/Blockers: SyncStatus extended (2 kinds) and saved-list test touched; no browser e2e.

## Review fixes (code-review-phase-03-04.md, tests first)
Gates: `pnpm test` 32 files / 635 tests, `pnpm check` 0/0/0, `pnpm check:server` clean, `pnpm build` 73 pages. Not committed.

### New server contract (phase 2)
- `GET /api/progress` and `PUT /api/progress` now REQUIRE header `X-Sync-User: <username>` equal to the cookie's user; missing or mismatched -> `401 {"code":"unauthorized"}`. `/api/me`, auth routes unchanged. `server/sync/sync-server-entry.ts` 199 lines. Tests: `tests/sync-http-api.test.mjs` helper auto-sends the claim per cookie; +1 mismatch/missing test (22 tests).
- Client: `progress-sync-http.ts` sends it on every progress call (keepalive included). On a 401 from progress the tab no longer goes `signed-out` blindly: it re-asks `/api/me` (`recheck`).
- Cross-tab broadcast: localStorage key `omnilab:v2:syncUser` (value `name|time|seq`, empty name = logout) written on login/register, logout, successful resolveMerge. A `storage` event on it makes other tabs `recheck()` (fixes signed-out tab not learning of a login elsewhere, M4).

### Fixes
- C1: above. Tests: stale tab (logout+login elsewhere) -> `needs-merge-decision`, no PUT as the new user; lost-event case (401 -> recheck); signed-out tab picks up login.
- H1: logout/logoutAll flush scroll and push if dirty before the API call. `clearLocal` aborts (error status, nothing wiped) if that push fails; too_large (halted) state still logs out. `logoutAll({clearLocal})` added (M3 engine side; UI must pass the checkbox).
- H2: store `subscribe(fn(state, {external}))`; `external` true synchronously for storage-event changes. Triggers use it (no microtask/ordering tricks). Test fake now delivers each listener in its own task (browser semantics) and the PUT is slow; the two-tab test was red on old code (2 PUTs), now 1.
- M1: session epoch; push/pull/boot responses from an older epoch are dropped. Test: held PUT of old session released after switching accounts leaves `needs-merge-decision` intact.
- Lows: keepalive deduped per dirty generation (hidden+pagehide = 1 PUT); keepalive skipped when body > 60 KB; body > 64 KB -> `too_large` without a request; in-flight promise set before awaiting lessons-index; failed merge/use-account keeps `needs-merge-decision` (no timers, no loop; retry works); 413 halts push only, pulls continue; passwords/confirm NFC-normalized in the engine; status listener exceptions isolated (try/catch + console.error); `isWriteBlocked` test added to `tests/progress-store.test.mjs`.

### Structure
`progress-sync.ts` (165, session/auth/wiring) + new `progress-sync-transfer.ts` (142, pull/push/apply); triggers no longer take `win`. Contract: `win` listener for `storage` receives `{key}`; `logoutAll(opts?)`.

### For the UI agent
- Pass the clear-local checkbox to `logoutAll({clearLocal})` (M3).
- `account-sync-panel-view.ts` still validates raw `.length`/`confirm===password`; NFC-normalize there too (L5). Engine already normalizes what it sends.
- After a failed `logout()` the status becomes `error`; UI should show it in the error line (L7).
- Merge-card cancel (M2), focus/aria (M6), M5 scope gaps untouched.

### Not done / notes
- No dedicated test for "inFlight before lessons-index load" (needs a slow index plus two simultaneous pushes); covered by design only.
- Existing UI untouched.

Status: DONE_WITH_CONCERNS
Summary: C1 (server+client), H1, H2, M1 and the listed lows fixed test-first; gates green.
Concerns/Blockers: server contract change (X-Sync-User required) must be deployed together with the client; panel items above remain for the UI agent.

## Final-review fixes (code-review-final.md M1, L1, L2)
Gates: `pnpm test` 37 files / 687 tests, `pnpm check` 0/0/0, `pnpm check:server` clean, `pnpm build` run (see Status). Not committed. Tests written first (L1 test looped forever before the fix).
- M1: `endSession` now loops (max 3) `push({})` while `canPush() && isDirty()`, so a change made during an in-flight push is pushed before logout; with `clearLocal` it aborts (error status, nothing wiped) if still dirty. Halted too_large still cannot push, so logout proceeds. Test: held PUT#1, markDone during it, logout({clearLocal}) -> second PUT contains the change, POST logout after both, then local cleared.
- L2: server `POST /api/auth/logout-all` now uses `authenticate(req, true)` (needs `X-Sync-User` == cookie user, else 401, session untouched); client sends it (`logoutAll` only). Plain `POST /api/auth/logout` stays header-less: it only clears the caller's own cookie and changes no server state (tested). Server tests: helper adds the claim for logout-all, +1 test (mismatch/empty claim 401, session intact, plain logout OK). `sync-server-entry.ts` still 199 lines. Contract summary: progress GET/PUT and logout-all require `X-Sync-User`.
- L1: engine counts consecutive progress 401s (reset on any `synced`); after 2 re-checks the third sets `error{unauthorized}` and stops (no boot loop; later manual/visible attempts re-use the same cap). Test: /api/me 200 + progress 401 -> <=3 /api/me, final `error unauthorized`, no further calls in 60 s.
- Files: src/lib/progress-sync.ts (176), server/sync/sync-server-entry.ts, tests/progress-sync.test.mjs, tests/sync-http-api.test.mjs. Panel files, docs, panel test untouched.

Status: DONE
Summary: M1, L1, L2 fixed test-first.
Concerns: the L2 client/server change must ship together (old client logout-all without header now gets 401, treated as signed-out locally but the session is not bumped).
