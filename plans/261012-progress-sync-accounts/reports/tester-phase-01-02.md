# Tester report: phase 1-2 (progress sync)

Worktree: D:/project/OmniLab-progress-sync (feat/progress-sync, uncommitted). No repo files changed. Scratch files only in scratchpad, removed temp data.

## Gates
- `pnpm test`: 21 files, 454/454 passed, 0 skipped, 2.45s.
- `pnpm check` (astro check): 110 files, 0 errors, 0 warnings, 0 hints.
- `pnpm check:server` (tsc -p tsconfig.server.json): clean, exit 0.
- `pnpm build`: exit 0, 73 pages, sitemap created. Warnings: Vite `MODULE_LEVEL_DIRECTIVE` ("use astro:head-inject") on MDX lessons. Not errors; not checked against main.

## Manual checks
1. `import('./src/lib/progress-merge.ts')` → `function`. PASS.
2. Sidecar `--dev`, DATA_DIR scratch, PORT 3101:
   - health 200 `{"ok":true}`, `Content-Type: application/json`, `Cache-Control: no-store`, `Vary: Cookie`. PASS.
   - register 201 + cookie (HttpOnly; SameSite=Lax; Path=/api; no Secure in dev). PASS.
   - duplicate register 409 `username_taken`. PASS.
   - me 200. PASS.
   - PUT v2 200, returns merged state, no owner/bookmarks keys. GET 200 identical. PASS.
   - PUT v1 body → 400 `bad_request`. PASS.
   - PUT 70 KB → 413 `too_large` (authenticated). PASS.
   - PUT no cookie → 401; text/plain → 415. PASS.
   - logout without JSON content-type → 415; with JSON → 204 + cookie cleared. PASS.
   - logout-all 204; old cookie me/PUT → 401; re-login works; state persisted after logout-all. PASS.
   - `__proto__` bookmark key dropped. PASS.
   - Log lines contain no password/cookie/body. PASS.
   - Prod start without `--dev` and without SESSION_SECRET → exit 1, "SESSION_SECRET must be set to at least 32 characters". PASS.
   - Short secret → same exit 1. PASS.
   - Prod start, valid secret → listens; cookie has `Secure`. PASS.
   - Processes killed. Temp data removed; no `.data` left in worktree.
3. Migration (scratch script, scratchpad only; extension-resolve hook needed because progress-store.ts imports without `.ts`):
   - v1 `bookmarks: [z,x,y]` → v2 bookmarkMeta at 1,2,3; derived order `[z,x,y]`. PASS.
   - v1 `done:true, doneAt:100` → `doneUpdatedAt:100`, done kept. `done:false` → `doneUpdatedAt:0`. PASS.
   - Store on raw v1 localStorage: order kept, done kept, first write rewrites as v2 with no persisted `bookmarks` key. PASS.
   - RT#2: remote with only `visitedAt` newer → done kept, bookmarks kept. PASS.
   - `__proto__` id dropped. `v:3` is future (`isUnknownFutureVersion` true). PASS.

## Concerns (none blocking)
- Unknown route returns HTTP 404 with body `code: bad_request`. Plan contract has no 404 row. Low.
- Unauthenticated oversized PUT returns 401, not 413 (auth runs before body read, by design). 413 verified only with a valid cookie. Low.
- Unwritable DATA_DIR → raw Node `ENOTDIR` message, exit 1. Non-zero exit OK; message not the friendly form. Low.
- Health 503 path not exercised (needs DB failure). Covered only if unit tests do; not manually checked.
- `progress-store.ts` is not runnable by plain Node (extensionless imports). Fine for Vite and vitest, but the sidecar must never import it. Currently it imports only progress-state, progress-merge and progress-sync-types, which run directly.
- `sync:dev` uses `--dev` flag, not env prefix (already in impl report deviations). Accepted.
- Not tested: phase 3+ (client sync, UI), browser two-tab scenario, rollback/backup (phase 5).

Status: DONE_WITH_CONCERNS
Summary: All gates green (454 tests, check 0/0/0, check:server clean, build 73 pages). Sidecar API, auth, status codes, headers, startup failures and v1→v2 migration verified manually. No blocking defects.
Concerns/Blockers: none blocking; minor items above.

## Unresolved questions
- Build MODULE_LEVEL_DIRECTIVE warnings: pre-existing on main? Not verified.
- Should unknown routes return 404 with a dedicated code (e.g. `not_found`) rather than `bad_request`? Plan contract silent.
