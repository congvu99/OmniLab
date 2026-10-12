# Phase 02 impl report (sync sidecar)

Worktree D:/project/OmniLab-progress-sync (feat/progress-sync), uncommitted.

## Files
- NEW server/sync/sync-server-entry.ts (183): `startServer(cfg)` -> {port, store, close}, router, headers, logging, SIGTERM/SIGINT, `import.meta.main` boot.
- NEW server/sync/sync-sqlite-store.ts (117): schema (WAL, busy_timeout=3000, FK), users/progress, `sanitizeIncoming` (v===2 only, migrate, drop owner/bookmarks, clamp ts > now -> now), `mergeProgress` (BEGIN IMMEDIATE, merge, 64KB check, rollback), `backupTo` (VACUUM INTO), `ping`.
- NEW server/sync/sync-auth.ts (155): scrypt N16384 r8 p1 salt16 maxmem 64MB + dummy hash for unknown user, `createLimiter(2,8)` + `BusyError`, `signSession/verifySession` (b64url JSON + HMAC-SHA256, sv + exp), `createLoginThrottle` (per username, free x3 then 1,2,4..60s, 10k-entry cap), `createCap`.
- NEW server/sync/sync-http-helpers.ts (72): `HttpError`, `readBody` (64KB, drains up to 1MB), `parseJson`, `SyncConfig`, `configFromEnv`.
- NEW src/lib/progress-sync-types.ts: `ErrorCode`, `ErrorBody`, `UserBody`, `MAX_STATE_BYTES`(64KB) (shared with client in phase 3).
- NEW tests/sync-auth.test.mjs (10 tests), tests/sync-http-api.test.mjs (17 tests).
- MOD package.json: only `"sync:dev": "node server/sync/sync-server-entry.ts --dev"`. MOD .gitignore: `.data/`, `data/`.

## API as implemented
Matches phase-02 table. Cookie `omnilab_session`, `HttpOnly; SameSite=Lax; Path=/api; Max-Age=15552000; Secure` (unless cookieSecure false). All responses: `Content-Type: application/json`, `Cache-Control: no-store`, `Vary: Cookie`. Errors `{code}`. 415 check first (all POST/PUT incl. logout), then body (413 > 64KB), PUT merged > 64KB -> 413 nothing written. Username trimmed+lowercased then `^[a-z0-9_.-]{3,32}$`; pw 8-128. Register: dup check before hashing, global 30/h cap (429 Retry-After 3600) counted on pass-through-to-create. Busy -> 503 `busy` + Retry-After 2. PUT requires `v===2` (v1 -> 400). Logs: one JSON line {t,method,path,status,ms}. Server timeouts: headers 10s, request 15s.

## Tests
`pnpm test`: 21 files / 386 tests green (was 19 / 359; +27). Red confirmed first (module missing). `pnpm check`: 0 errors/0 warnings. Covers: hash ok/bad/malformed, limiter (12 tasks -> peak 2 running, 10 ok, 2 BusyError), cookie tamper/expiry/wrong secret, throttle growth/cap/reset, e2e register-put-get, 409/400/401/429, logout-all invalidation, 2-device merge, ts clamp, `__proto__` dropped, 413 (single and post-merge), 415, headers, no password/cookie/body in logs, 10 parallel registers RSS < 160MB, missing/short SESSION_SECRET -> exit != 0 with message.

## Smoke (pnpm sync:dev, curl, port 3001)
register 201 + cookie, me 200, PUT/GET progress round-trip identical, logout 204, login 200, logout-all 204, then /api/me with old cookie 401, health `{ok:true}`. Dev cookie has no `Secure`. `.data` removed afterwards, gitignored.

## Deviations
1. 4th file `sync-http-helpers.ts` (entry alone was 247 lines > 200 limit).
2. `ErrorCode` extra member `'bad_request'` (malformed JSON, non-v2 state, unknown route 404). Spec list had no code for 400 on PUT.
3. `sync:dev` uses `--dev` flag instead of `DATA_DIR=... COOKIE_SECURE=0` env prefix (does not work in cmd/pwsh under pnpm on Windows). `--dev` defaults: DATA_DIR `./.data`, HOST 127.0.0.1, PORT 3001, cookie not Secure (`COOKIE_SECURE=1` to force), and random per-process SESSION_SECRET when unset (sessions die on dev restart). Prod (no flag): SESSION_SECRET mandatory >= 32, DATA_DIR default `/data`, HOST 0.0.0.0, Secure unless `COOKIE_SECURE=0`.
4. Server .ts is not checked by `astro check` (only Astro/imported files), and no `@types/node` is installed top-level, so no tsconfig/devDependency change. Verified manually with tsc strict + erasableSyntaxOnly using pnpm-store @types/node 24.19.0: clean. If phase 3+ imports server types from client code, add `@types/node` devDependency then.
5. Register cap token consumed after hashing succeeds (not on validation failures/dups).
6. PUT: authenticate before reading body.

## Notes / unresolved
- Backups dir `DATA_DIR/backups` created at start; `backupTo` exists but no scheduler (phase 5/6).
- No ExperimentalWarning seen on Node v24.15.0 sqlite in tests (stderr not asserted).
- Throttle/cap are in-memory (reset on restart) per plan.

Status: DONE
Summary: Sync sidecar (4 files under server/sync, shared ErrorCode types), 27 new tests, full suite 386 green, check clean, curl smoke passed.
Concerns/Blockers: none blocking; see deviations 1-3.

## Review fixes (code-review-phase-01-02.md)
Gates: `pnpm test` 21 files / 454 tests, `pnpm check` 0/0/0, `pnpm check:server` clean, `pnpm build` 73 pages. Not committed.
- M1: `createLoginThrottle.begin()` reserves an attempt slot before scrypt (failures + in-flight > 3 -> 429, Retry-After 1); fail/success/cancel release it (cancel on hash-queue busy). Test: 10 parallel wrong logins -> >=5 are 429, <=5 are 401.
- M2: password and confirm `normalize('NFC')` in `credentials()` (before length check and hashing; register + login). Test: NFD register / NFC login and vice versa.
- M3: `LESSON_ID_PATTERN` exported; `tests/lesson-content.test.mjs` asserts every real lesson id matches (per-file case); `content.config.ts` has `idPart = z.string().regex(/^[a-z0-9-]+$/)` for module id and lesson `module` (build OK, 73 pages); comment in migrateV1 corrected (v1 ids not validated there, dropped by migrateV2 on re-read). v1 left lenient (no behavior change).
- M4: prod PORT default 3000, `--dev` 3001 (test on `configFromEnv`).
- M5: `@types/node ^24` devDependency (lockfile updated), `tsconfig.server.json` (strict, erasableSyntaxOnly, noEmit, nodenext; include server/**, progress-state/merge/sync-types), script `check:server`. It caught a real implicit-any in login(), fixed. Not chained into `check`.
- L1: Content-Length > 1 MB or stream growing past 1 MB -> immediate 413 JSON (`Connection: close`), body discarded, socket destroyed 3 s after response; no hang/reset. Test with 3 MB body then GET /api/me still works.
- L4: single throttle key `username.slice(0,64)` for begin/fail/success/cancel.
- L7: `.gitignore` anchored `/.data/`, `/data/`.
- L8: engines.node `>=24.2`.
- Side effects: pnpm-lock.yaml modified (types dependency); package.json diff = engines, sync:dev, check:server, @types/node. sync-server-entry.ts is exactly 200 lines (limit "<200" borderline); trimmed 1 blank line -> 199.
- Skipped per instruction: L2, L3, L5, L6, L9-L11.

Status: DONE
Summary: M1-M5, L1, L4, L7, L8 fixed with tests first; all gates green.
Concerns/Blockers: PORT for prod now 3000 by default; phase 5 need not set PORT. Logout still needs Content-Type: application/json (L5, phase 3).
