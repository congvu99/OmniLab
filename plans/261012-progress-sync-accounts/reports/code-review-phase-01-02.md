# Code review: phase 1 (schema v2 + merge) and phase 2 (sync sidecar)

Worktree: `D:/project/OmniLab-progress-sync` (branch `feat/progress-sync`, base `main`, uncommitted). Read-only review.

## Scope
- Modified: `src/lib/progress-state.ts` (173), `src/lib/progress-store.ts` (295), `tests/progress-store.test.mjs`, `tests/saved-list-controller.test.mjs`, `package.json`, `.gitignore`
- New: `src/lib/progress-merge.ts` (116), `src/lib/progress-sync-types.ts` (31), `server/sync/{sync-server-entry 184, sync-auth 155, sync-sqlite-store 117, sync-http-helpers 72}.ts`, 4 test files
- Gates run here: `pnpm test` 21 files / 386 pass; `pnpm check` 0/0/0; `pnpm build` OK (73 pages). `tsc --noEmit -p tsconfig.json` DOES include `server/sync/*.ts` and reports 0 errors in them (6 pre-existing errors, all unrelated `.astro` module imports in `mdx-components.ts`).
- Extra verification:
  - Fuzz 200k random triples: `mergeStates` commutative 0 failures, associative 0 failures. Idempotence 0 failures with store-canonical lesson shapes; fails on non-canonical shapes (see L2).
  - All real lesson ids checked: 3 domain files, 17 `module:` values, all `.mdx` filenames match `^[a-z0-9-]+/[a-z0-9-]+/[a-z0-9-]+$`. No current id is dropped.
  - Live probe against `startServer`: 100 KB body gives 413 JSON; 2 MB body gives ECONNRESET (no JSON, no log line); 10 parallel wrong logins for one user all return 401, none 429; `POST /api/auth/logout` without a Content-Type gives 415.

## Overall assessment
Solid, small and well tested. Merge laws hold. The v1 to v2 migration keeps all data and the Đã lưu order. On the server: prepared statements throughout, HMAC and password checks use timing-safe compares, `session_version` revocation works, errors are always `{code}` and no stack traces leak. No Critical or High defects. The open items are hardening issues: a concurrency bypass of the login throttle, password Unicode normalization (this must be decided before the first user registers), a latent silent-drop risk for non-conforming lesson ids, and a port default that disagrees with the plan.

## (a) Acceptance criteria

Phase 1
- [x] New and old tests green; `pnpm check` clean.
- [x] v1 localStorage: data kept, order kept (`at = index+1`), rewritten as v2 on the next mutate. Caveat: v1 ids that do not match the pattern survive the first read but are dropped on the next re-read (M3). No real id is affected today.
- [x] `import('./src/lib/progress-merge.ts')`: `mergeStates` is a function (the fuzz script imported it under plain Node 24.15).
- [x] RT#2 test exists (`progress-state-migrate-v2.test.mjs:36`). Store test "markDone then older applyRemote" exists.
- [~] Old store tests: shape-only per the plan, BUT fixture ids were also renamed (`a/lesson` to `a/m/lesson`, and so on). This is outside the plan's list, forced by the id regex, and documented as deviation 1. Behavior assertions are intact.
- [ ] Risk note "warn in app-layout when `skipPersist`": not done. Out of the phase-1 file list (L11).

Phase 2
- [x] All 8 routes, the contract table and the error codes (plus the extra `bad_request`, deviation 2).
- [x] Headers on every response, including errors: JSON content type, `no-store`, `Vary: Cookie`.
- [x] Missing or short `SESSION_SECRET` exits with a non-zero code (tested). `/data` write probe is in place.
- [x] Logs contain no password, cookie or body (tested). RSS stays under 160 MB with 10 parallel registers (tested).
- [x] 413 for a single body over 64 KB and after merge; 415; `__proto__` dropped; logout-all; 2-device merge; ts clamp.
- [~] 3 files became 4 (`sync-http-helpers.ts`), justified by the 200-line rule. `sync:dev` uses a `--dev` flag instead of an env prefix; fine.
- [!] `PORT` default is 3001 in prod too; plan and phase 5 Caddy use `omnilab-sync:3000` (M4).

## Critical
None.

## High
None.

## Medium

**M1. The login throttle can be bypassed by sending attempts in parallel.** `server/sync/sync-server-entry.ts:71-77`
- Cause: `throttle.retryAfter(username)` is checked before the scrypt await, and `throttle.fail()` only runs after the hash finishes. N concurrent attempts all pass the check.
- Verified: 10 parallel wrong logins gave 10x 401 and 0x 429. The burst size is capped only by the hash pool (2 running + 8 queued = 10).
- Effect: about 10 guesses per 60 s window instead of 1. Over a day: about 14k instead of about 1.4k guesses per account.
- Fix: count the attempt before hashing. Add a `pending` counter per entry and include it in `retryAfter` (`failures + pending > FREE_FAILURES` means wait). Or call `throttle.fail()` up front and undo it on success with `throttle.success()`. Add an e2e test that fires 10 parallel attempts and expects at least 6 responses to be 429.

**M2. Passwords are not Unicode-normalized.** `server/sync/sync-server-entry.ts:52` (and `sync-auth.ts:30,40`)
- Failure: the audience is Vietnamese. Typing tools (Unikey "Unicode tổ hợp" vs "dựng sẵn", macOS vs Windows input methods) produce NFD or NFC forms of the same visible password. A user who registers on one device cannot log in on another, and the error is a plain `bad_credentials`.
- Fix: `password.normalize('NFC')` in `credentials()`, applied before both the length check and hashing. Do this before launch; afterwards it needs a rehash-on-login migration.

**M3. Lesson ids that do not match the pattern are silently lost, and nothing guards against it.** `src/lib/progress-state.ts:50,109-110,135-149`
- Cause: `migrateV2` drops any id not matching `LESSON_ID_PATTERN`. `mutate()` re-reads storage, and so re-runs `migrate`, on every write.
- How it fails:
  - A future lesson whose filename, module or domain contains `_`, `.` or uppercase. The Astro glob slug keeps `_`, and `module` is a free `z.string()`.
  - The user marks the lesson done or bookmarks it. The UI updates in memory, the state is persisted, and the next mutation of any lesson drops it silently.
- The v1 branch is lenient about ids, but `migrateV2` drops them on the next re-read anyway (repro: v1 bookmark `old/slug` disappears after one write). The comment at :109 is therefore misleading.
- Fix:
  - Export `LESSON_ID_PATTERN`.
  - Add an assertion in `tests/lesson-content.test.mjs` that every `lessonIdOf(entry)` matches it.
  - Add `.regex(/^[a-z0-9-]+$/)` to `module` in `content.config.ts`.
  - Either apply the same rule to v1 (consistent, explicit drop) or fix the comment.

**M4. The production port default disagrees with the plan and Caddy.** `server/sync/sync-http-helpers.ts:68`
- `Number(env.PORT ?? 3001)` applies to both dev and prod. Phase 5 uses `reverse_proxy omnilab-sync:3000` and its checklist checks port 3000, and the phase 5 env list has no `PORT`.
- Failure: the first deploy returns 503 `unavailable` on every `/api/*` call, and the health gate fails.
- Fix: default 3000 in prod and 3001 only for `--dev`. Or record `PORT=3000` as mandatory in phase 5 and add it to the deviation list.

**M5. Server `.ts` files are not covered by any gate, and their typings depend on a transitive dependency.** `package.json`
- `astro check` skips `server/`. Plain `tsc` does see the files, but `@types/node` resolves only transitively (`node_modules/.pnpm/@types+node@24.19.0`); there is no top-level `node_modules/@types`. A dependency bump can remove it silently.
- The vitest e2e tests import the server through Vite's transform, so non-erasable syntax (enums, parameter properties) would pass tests and crash under `node`. Only the startup-exit test spawns real Node.
- Fix:
  - Add `@types/node@^24` as a devDependency.
  - Add `tsconfig.server.json` (`include: ["server/**/*.ts", "src/lib/progress-*.ts", "src/lib/progress-sync-types.ts"]`, `erasableSyntaxOnly: true`, `noEmit`, `allowImportingTsExtensions`) and a `check:server` script `tsc -p tsconfig.server.json`, chained into `check` or CI.
  - Optionally add one smoke test that spawns `node server/sync/sync-server-entry.ts --dev` and hits `/api/health`.

## Low

**L1. Bodies over 1 MB hang or reset instead of getting a 413 JSON.** `server/sync/sync-http-helpers.ts:40-49`
- `req.destroy()` causes neither `end` nor `error`, so the `readBody` promise never settles. The client gets ECONNRESET with no JSON body and no log line (verified).
- Bodies between 64 KB and 1 MB are fully drained before the 413. Memory is bounded (chunks are discarded), but bandwidth is spent.
- Fix: check `Content-Length > MAX_STATE_BYTES` first and reply 413 with `Connection: close`. On the hard cap, `reject(new HttpError(413,'too_large'))` before `req.destroy()`.

**L2. `mergeStates` passes one-sided records through without normalizing them.** `src/lib/progress-merge.ts:67`
- Records present on only one side are not normalized, while two-sided records are. So `merge(merge(a,b),b) !== merge(a,b)` for non-canonical inputs such as `{done:false, doneAt:5}` or `{done:true}` without `doneUpdatedAt`.
- Fuzz: 65% idempotence failures on arbitrary shapes, 0% on store-produced shapes.
- Risk in phase 3: hash-based "nothing changed" checks can loop on tampered or legacy local data.
- Fix: `out[id] = mergeOne(x ?? y, y ?? x)` to normalize always. Add a randomized law test, since the current law tests use 3 fixed fixtures.

**L3. `applyRemote` does not validate its input.** `src/lib/progress-store.ts:259`
- It trusts its argument, relying on phase 3 to call `migrate` first. Ids that fail the pattern would be persisted and then dropped on re-read.
- Fix: `mergeStates(base, migrate(remote))` inside `applyRemote` (defense in depth, cheap).

**L4. The throttle key is inconsistent.** `server/sync/sync-server-entry.ts:71,76`
- `retryAfter(username)` and `success(username)` use the full name, but `fail(username.slice(0,64))` uses a truncated one.
- Harmless today (valid names are at most 32 characters), but names over 64 characters are never throttled. Use one key, for example `const key = username.slice(0,64)`.

**L5. `logout` requires `Content-Type: application/json`, otherwise 415.** `server/sync/sync-server-entry.ts:91`
- A phase 3 `fetch('/api/auth/logout',{method:'POST'})` without that header silently fails to clear the cookie.
- Fix: put it in the phase 3 contract notes, or exempt empty-body logout from the 415 check (Lax plus the lack of CORS already blocks cross-site use).

**L6. The first unknown-user login is slower.** `server/sync/sync-auth.ts:43`
- The first unknown-user login computes the dummy hash lazily, costing 2 scrypts (a one-time timing tell). Precompute at `startServer`.

**L7. `.gitignore` `data/` is unanchored.** It hides any future `src/**/data/` folder. Use `/data/` and `/.data/`.

**L8. The Node version floor is too loose.** `engines.node ">=24"`, but `import.meta.main` needs 24.2 or later. Below that, `import.meta.main` is undefined, so the server never starts and exits 0 silently. Set `>=24.2` and pin the same in the phase 5 image.

**L9. `progress-store.ts` is 295 lines** (over 200; it was 261 before this change). Candidate split: bookmark and owner ops, or a `nextStamp` and timestamp helper module.

**L10. Two DoS paths are accepted by design but not written down.**
- Flooding logins keeps the global hash pool full, so real users get 503 `busy`.
- 30 registrations per hour exhausts the global signup cap for everyone.
- Document both in the phase 6 docs.

**L11. The rollback warning from the phase 1 risk note is not done** (`skipPersist` is not exposed and there is no banner). It only helps future rollbacks (v3 to v2), not rollbacks to pre-v2 builds. Track it in phase 3 or 4.

## Side effects / regressions
- **Consumer contract kept.**
  - Grep over `src/` finds these consumers: `lesson-row`, `bookmark-button` (`state.bookmarks.includes`), `continue-reading-card` (`lastUnfinished`, `.scroll`), `mark-complete-button`, `reader-progress-tracker`, `progress-ring`, `saved-list.astro` and `saved-list-controller` (`store.get().bookmarks` order).
  - All of them still get `bookmarks: string[]`, `lessons[id].done/scroll/visitedAt` and `lastUnfinished`. Nothing reads `.v`.
- **Đã lưu order.** v1 entries get `at` 1..n, then new adds get `at = now`, so new ones append as before. Re-adding a removed id moves it to the end (same as v1).
  - Edge: if a device clock moves backwards, a new bookmark sorts before older ones. v1 always appended. Accepted LWW trade-off.
- **Silent id drop.** Ids that fail the pattern disappear after the first re-read (M3). No current lesson is affected, and none ever was: the 3-part id format has existed since the first commit of `lesson-id.ts`.
- **Mixed-version tabs during deploy.** An old-JS tab that reads v2 sets `skipPersist`, shows empty progress and keeps its changes in memory only until reload. Disk data is not destroyed (existing guard).
- **Rollback to the pre-v2 client.** Progress appears empty and changes are lost on reload (known, see L11).
- **Persisted shape.** Still under key `omnilab:v1:state` (name only). `bookmarks` is no longer persisted; `owner` is added.
- **Studio-branch consumers** (`domain-progress.ts`, `learning-stats.astro`, `command-palette.astro`) are not in this worktree. Re-run the consumer grep and the tests after rebasing on `main` once studio merges.
- **Client bundle.** `progress-merge.ts` is now pulled into every page that imports the store (about 1 to 2 KB). Negligible.
- **Old tests.** Fixture ids were renamed in 2 old test files. Behavior assertions are unchanged.

## (c) Merge correctness
- Commutative and associative: verified (fuzz, 0 failures). Idempotent for canonical states; L2 covers non-canonical ones.
- RT#2: the v1 done lesson gets `doneUpdatedAt = doneAt`; a visit-only lesson has no stamp (0), so done survives.
- Tombstones: kept, never garbage-collected, and they win on a later `at`.
- Prototype pollution:
  - v2 ids are restricted by the pattern; `__proto__` is skipped in `mergeRecords`; v1 drops `__proto__`, `constructor` and `prototype`.
  - Output objects are plain `{}`, but every key written is pattern-checked or not `__proto__`.

## (d) Server security
- scrypt N=16384, r=8 uses about 16 MiB per hash; at most 2 run at once (about 32 MiB) plus the Node baseline, well under 192 MB. Measured RSS under 160 MB.
- Cookie: `HttpOnly; SameSite=Lax; Path=/api; Max-Age=15552000`, plus `Secure` by default in prod. The HMAC uses timing-safe compare with a length pre-check. `exp` is enforced and `sv` is checked against the DB on every authenticated request.
- Passwords: `timingSafeEqual`. Unknown or invalid usernames still pay a full scrypt (except L6).
- Enumeration: 409 on register is accepted per the plan; login gives no timing tell.
- Rate limit: per username with backoff (M1 bypass); 30 registrations per hour globally.
- Body limit: bounded memory and 413 JSON up to 1 MB; reset above that (L1).
- ts clamp: covers `doneAt`, `doneUpdatedAt`, `visitedAt` and bookmark `at`.
- SQL: prepared statements only, including `VACUUM INTO ?`.
- CSRF: Lax cookies, a JSON-only content type (which forces a CORS preflight) and no CORS headers.
- Errors: always `{code}` JSON with no-store. Unknown errors become 503 `unavailable` and only `err.message` goes to stderr. Exceptions: Node's own `clientError` responses (malformed HTTP, header timeout) and L1.

## (f) Patterns and size
- Follows existing patterns: pure modules, injected `now` and storage, kebab-case names, explanatory comments.
- Only `progress-store.ts` exceeds 200 lines (L9). Server files: 72 to 184 lines.

## Recommended actions (priority)
1. M1: reserve the throttle slot before hashing, plus a parallel-attempt test.
2. M2: NFC-normalize passwords before the first real user registers.
3. M4: prod port default 3000, or make `PORT=3000` explicit in phase 5.
4. M3: test that real lesson ids match the pattern, add a regex to the `module` schema, make v1 and v2 id handling consistent.
5. M5: `@types/node` devDependency, `tsconfig.server.json`, `check:server` script.
6. L1, L2, L3, L5, L8: cheap hardening before phase 3 depends on these contracts.

## Metrics
- Type coverage: strict TS; server clean under `tsc`, but not gated (M5).
- Tests: 386 pass (27 new for the server, 32 new for phase 1). No coverage tool configured.
- Lint/type issues introduced: 0.

## Unresolved questions
- Should invalid ids in v1 data be dropped explicitly at migrate time (consistent) or kept forever (would require relaxing the v2 regex)?
- Will phase 5 set `PORT` explicitly, or should the code default change?
- Logout: should phase 3 send `Content-Type: application/json`, or should the server exempt empty-body logout?

Status: DONE_WITH_CONCERNS
Summary: 8/10. Critical 0, High 0, Medium 5, Low 11. All gates green (test 386, check 0, build OK).
Concerns/Blockers: M1 throttle concurrency bypass and M2 password NFC should be fixed before any real user registers; M4 port mismatch will break the first deploy if phase 5 does not set PORT.
