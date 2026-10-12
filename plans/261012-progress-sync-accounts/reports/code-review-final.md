# Final pre-merge review: feat/progress-sync

Worktree `D:/project/OmniLab-progress-sync`. 4 commits on top of `main` fe2a332 (3600e5a, f24898a, 6c5c5ec, b7b7040). 55 files, +5303/-194.

The review was read-only.
- **Gates run:**
  - `pnpm test`: 37 files, 682/682 passing.
  - `pnpm check`: 0 errors, 0 warnings, 0 hints.
  - `pnpm check:server`: clean.
- **Not run:** `pnpm build` (the tester builds it).
- **Scratch reproduction:** one test lives outside the repo (scratchpad vitest config), so it does not touch the worktree.

## Scope / scout
- **Server:** the `X-Sync-User` guard in `server/sync/sync-server-entry.ts:39-46,125-128`.
- **Client engine:** `src/lib/progress-sync{,-transfer,-http,-triggers,-dirty,-status,-singleton}.ts`.
- **UI:** `account-sync-panel.astro`, `account-sync-panel-{controller,view,wipe,elements}.ts`, `sidebar-nav.astro`, `toi.astro`.
- **Existing files touched:**
  - `app-layout.astro`, `reader-layout.astro`, `content.config.ts`, `progress-store.ts`, `progress-state.ts`
  - `Caddyfile`, `Dockerfile`, `compose.yml`, `deploy/deploy.sh`, `package.json`, `.gitignore`, `.dockerignore`
  - `tests/saved-list-controller.test.mjs`, `tests/lesson-content.test.mjs`
- **Edge cases scouted:**
  - a signed-in local wipe
  - logout while a push is in flight
  - a persistent 401 loop
  - stale tab plus logout-all
  - sidebar subscribe on soft navigation
  - the Docker `sync` stage import closure
  - the docs reset command

## Verification of code-review-phase-03-04 fixes

| Item | Holds? | Evidence |
|---|---|---|
| C1 stale-tab cross-account write | **Yes** | Server: `authenticate(req, true)` on both progress routes requires `req.headers['x-sync-user'] === user.username`; the DB username is canonical. A missing header (undefined) or a duplicated header (Node joins duplicates as `"a, b"`) never matches, so 401 and no bypass. Client: every progress call sends `user: s.username` (`progress-sync-transfer.ts:346,375`). The keepalive path sends it too. A custom header with keepalive needs no preflight on same-origin. On 401 the client calls `recheck()`. The `syncUser` storage broadcast tells other tabs to re-check. |
| C1 normalization | **Yes** | The server lowercases and trims the username and checks the ASCII regex `^[a-z0-9_.-]{3,32}$`. The client takes the name from server responses (`usernameOf`), never from raw input. The panel `normalizeUsername` = NFC + trim + lowercase, which matches. NFC is a no-op on the ASCII-only names the regex allows. |
| H1 logout drops unpushed decisions | **Mostly** | `endSession` flushes scroll and pushes if dirty before the API call, and aborts a clear-local logout when that push fails. Gap: see M1 below (a push already in flight). |
| H2 cross-tab external tagging | **Yes** | The store passes `{external}` synchronously from `handleStorageEvent` (`progress-store.ts` `notify(true)`), and the watcher uses it. The test fake now delivers each listener in its own task. |
| M1 stale response into the next session | **Yes** | `session.epoch` is captured before every await in boot, pull, doPush and resolveMerge. `reset()` bumps it. |
| M2 merge cancel | **Yes** | "Huỷ — đăng xuất" calls `logout({clearLocal:false})`. |
| M3 logoutAll ignores the clear-local checkbox | **Yes** | The controller passes `clear-local.checked` (`account-sync-panel-controller.ts:183-185`). |
| M4 signed-out tab never learns of a login | **Yes** | The `storage` event on `omnilab:v2:syncUser` triggers `recheck()` (`progress-sync.ts:230`). |
| M5 scope gaps | **Yes** | Panel moved to `/toi #tai-khoan`. `da-luu.astro` is no longer in the diff vs main. Avatar, dot, 2-step wipe and sidebar status are all added. The "Đồng bộ ngay" button is recorded as not done. |
| M6 focus / a11y | **Yes** | Focus goes to `account-name` or `username` only for user actions, and to the merge title on boot. A single polite notice line carries errors only. Inputs have `aria-invalid` and `aria-describedby`. |
| Lows L1–L8 | Yes | keepalive dedup, the 60 KB keepalive cap, `inFlight` set first, halt blocks push only, NFC, the try/catch in the status channel, the logout-failure copy and the `isWriteBlocked` test all hold. |

## Critical
None.

## High

### H1. "Xoá tiến độ trên máy" while signed in is reverted about 3 s later; the UI has already announced "Đã xoá"
- **Where:**
  - `src/lib/account-sync-panel-controller.ts:92`: `wipe-block` is visible in the `account`, `unavailable` and `form` sections.
  - `src/components/islands/account-sync-panel.astro:459`: `clearLocalProgress: () => getProgressStore().clear()`.
  - `src/lib/progress-sync-transfer.ts:291`: the watcher.
- **Scenario:**
  1. The user is signed in and synced, then confirms the 2-step wipe.
  2. `store.clear()` notifies with `external:false`, so the watcher calls `onLocalDecision`. `canPush()` and `isDirty()` are both true, so it schedules a push.
  3. 3 s later it PUTs an empty state. The server's LWW merge has nothing to tombstone and returns the full account state.
  4. `applyRemote` restores every done mark and bookmark, and `setOwner` re-tags them.
- **Reproduced:** a scratch vitest using the real store, engine and `mergeStates` printed `after wipe+4s: {"done":true,...} true an`.
- **Same in `unavailable`:** the next reconnect (`boot`, then `reconcile`, owner undefined, then `push({force:true})`) restores it too.
- **Impact:** the feature appears broken. A user on a shared or borrowed device believes the device is clean, but the progress reappears. The copy "Tiến độ đã đồng bộ lên tài khoản không bị xoá" makes the user expect it to stay gone locally. No server data is lost.
- **Fix (pick one):**
  - (a) Show `wipe-block` only in the `form` section (signed out). In the signed-in state the existing "Xoá dữ liệu trên máy này khi đăng xuất" switch already covers the shared-device need. One line: `els['wipe-block'].hidden = view.section !== 'form';`. Add a controller test for it.
  - (b) When signed in, make the wipe call `sync.logout({clearLocal:true})` and change the copy to say it signs out.
  - Add an engine test: signed in, `clear()`, advance 4 s, expect the state to stay empty or the action to be unavailable.

## Medium

### M1. A logout with clear-local can wipe a change that is newer than the push already in flight
- **Where:** `progress-sync.ts:189` combined with `progress-sync-transfer.ts:356-358`.
- **Scenario:**
  1. The debounced push starts. On a slow network it can take up to 8 s.
  2. During that push the user toggles another bookmark, ticks the switch and presses "Đăng xuất".
  3. `push({})` sees `flight`, sets `again=true` and returns the old flight, which carries the old body. It resolves `true`, so `pushed=true` and `store.clear()` wipes the newer toggle that never reached the server.
- **Window:** narrow (needs a slow network), but it is exactly the case the H1 fix exists for.
- **Fix:** in `endSession`, loop while a flight exists or the state is still dirty. For example, `await push({}); if (isDirty()) pushed = await push({})`, or expose `transfer.flush()` that awaits any flight and then pushes if still dirty.

### M2. The plan's manual acceptance is not executed; plan.md is stale
- `plan.md` lists phases 3/4/6 as "Pending" and every acceptance checkbox is unticked.
- These items are untested in a real browser or on the VPS:
  - two-browser sync
  - shared-device prompt end-to-end with real merge/use-account data (phase-04 report: "not re-run in browser")
  - "header của trang tĩnh giống hệt"
  - rollback, backup and restore
- These are not code defects, but the code should not ship to production before the phase-5 VPS checklist runs.
- **Fix:** lead updates plan.md. Run the phase-05 VPS checklist plus the two-browser script before announcing the feature.

## Low

- **L1.** `progress-sync.ts:136-139` and `progress-sync-transfer.ts:324`: a repeated 401 on progress makes `recheck` call `boot`, then `pull`, then get 401 again, with no backoff.
  - It only happens if `/api/me` succeeds while progress keeps failing the claim, for example if an intermediate proxy strips `X-Sync-User`. Caddy does not strip it.
  - **Fix:** count consecutive progress 401s within one `boot`. On the second, set `error{unauthorized}` instead of rebooting.
- **L2.** `sync-server-entry.ts:118-121`: `logout-all` is not claim-checked.
  - A stale tab whose `syncUser` event was lost (storage blocked) can bump the session version of the account that is currently signed in, B.
  - Impact is limited to signing B out everywhere. Optional fix: `authenticate(req, true)` and have the client send `user` on logout-all.
- **L3.** `src/pages/toi.astro:117-120`: `.me__sec--account:empty { display:none }` is now dead, because the section is never empty. Remove it or leave it (harmless). That section is owned by the personal-tab plan, so flag it to that owner rather than editing it here.
- **L4.** `docs/deployment-vps-guide.html:379`: "đăng xuất mọi thiết bị mà không đổi mật khẩu: chạy lại lệnh với mật khẩu hiện tại" is unusable advice, because the admin does not know user passwords.
  - Suggest a separate one-liner: `UPDATE users SET session_version = session_version + 1 WHERE username = ?`.
  - Also, the reset command hashes `P` without `.normalize('NFC')`. The doc warns about this; adding `.normalize('NFC')` in the snippet would fix it outright.
- **L5.** `sidebar-nav.astro:432-450`: the sidebar subscribes on every `astro:page-load` and unsubscribes on before-swap.
  - It never triggers `/api/me`: the subscribe only replays the status.
  - The status channel is a Set, so there is no listener leak across soft navigations.
  - No issue, noted for risk calibration only.

## Side effects on existing behavior (whole-branch diff)

**Existing files:**
- **`progress-store.ts` / `progress-state.ts`:**
  - Storage key unchanged (`omnilab:v1:state`), payload is now `v:2`.
  - Rolling back to main is safe: main's `isUnknownFutureVersion` (`v > 1`) keeps v2 data in memory and never overwrites it.
  - Consumers still get the derived `bookmarks`.
  - `markDone` and `toggleBookmark` now stamp LWW times. The old tests' behavior is preserved, with the asserts reshaped per phase 1.
- **`content.config.ts`:** module ids now must match `^[a-z0-9-]+$`, and the content test asserts every lesson id matches `LESSON_ID_PATTERN`. Any future content with `_` or uppercase in a module id will fail the build. This is intentional and documented in a code comment.
- **`app-layout.astro`:**
  - The storage warning also appears when `isWriteBlocked`, and its copy is extended. This is correct.
  - The engine starts once per full load on every app page. Signed out, that is one `/api/me`. On Railpack (no sidecar) it is one 503 per load.
- **`reader-layout.astro`:** same engine start; there is still no storage warning there (pre-existing).
- **`sidebar-nav.astro`:**
  - Additive span inside the "Tôi" link, hidden until a signed-in status. `.sidebar-count` still uses `margin-left:auto`, but the two never appear on the same item.
  - The link's accessible name becomes "Tôi {name}, {status}".
  - Reduced motion is handled both via the OS media query and via `:root[data-motion='reduce']`.
- **`toi.astro`:** only the `#tai-khoan` slot changes (`aria-labelledby="me-account"` matches the h2 in the panel). The other sections are byte-identical.
- **`tests/saved-list-controller.test.mjs`:** gets an injected clock (fixes a same-ms tie). This is justified in the prior review.

**Infra and build:**
- **Caddyfile, Dockerfile, compose, deploy.sh:** reviewed in code-review-phase-05.
  - Re-checked: the Docker `sync` stage copies exactly the runtime import closure (`progress-state.ts`, `progress-merge.ts`, `progress-sync-types.ts`, none of which import further).
  - `app` is still the last stage.
  - `"type":"module"` is present.
- **`package.json`:**
  - `engines.node` goes from `>=24` to `>=24.2`. Railpack must provide Node 24.2 or later, which is likely.
  - `@types/node` is added as a dev dependency.

**Cross-cutting:**
- **CSP:** unchanged. All new scripts are bundled modules and all text is set via `textContent` (grep found no `innerHTML`). `connect-src 'self'` covers `/api`.
- **Tokens:** every `var(--…)` in the panel and the sidebar addition exists in `src/styles` (the only misses, `--dot`/`--dot-dark`, are pre-existing inline vars). There are no raw colors. Dark mode is via `data-theme`.

## Docs spot-check

- **README:**
  - `sync:dev` on port 3001: matches `configFromEnv`.
  - `/toi` mount: matches.
  - Railpack gives 503 JSON: matches the Caddy `handle_errors`.
- **`docs/system-architecture.md`:**
  - API table, `X-Sync-User` 401, error codes, cookie attributes (`Path=/api`, 180 days), 64 KB limit, debounce 3 s / max 30 s, statuses, `syncUser` key: all match the code.
  - "lệnh reset mật khẩu tăng session_version": matches the guide command.
- **`deployment-vps-guide.html`:** the reset command works against the code (container WORKDIR `/app`, `.ts` import via type stripping). It has the wording issue in L4.
- **`codebase-summary.md`:** panel location `/toi #tai-khoan` is correct.

## Plan-level acceptance (plan.md)

| Criterion | State |
|---|---|
| `pnpm test` green incl. new suites | Met (682) |
| Old `progress-store` behavior kept | Met (per phase-1 review and tests) |
| 2-browser sync scenario | Not executed manually (unit-covered only) |
| Shared device asks before merging | Met in code and tests across tabs (C1 fixed); browser smoke covered only the prompt and cancel |
| Signed out: one `/api/me` per load | Met (singleton, unit test "exactly one GET /api/me") |
| Static headers unchanged | Verified in phase 5 on real Caddy (per its report) |
| Sidecar down: site 200, `/api` 503 JSON, UI message | Met (Caddy `handle_errors`, `unavailable` view) |
| Sidecar on internal network only | Met in compose (no `ports:`, `internal: true`) |
| Rollback, backup, restore tried | **Not done** (no Docker on the dev machine; VPS checklist pending) |

## Recommended actions
1. Fix H1: hide the wipe while signed in (or turn it into logout + clear) and add the test. This is small and should be done before merge.
2. Fix M1: make `endSession` push until clean.
3. Lead: update plan.md statuses. Run the VPS checklist and the two-browser script before enabling in production.
4. L1, L2, L4 as convenient.

## Merge recommendation
**GO, conditional on H1** (a one-line visibility change plus a test). Merge is safe with respect to existing behavior: rollback-safe storage, unchanged CSP and headers, and the signed-out path is inert. Without the H1 fix it is still mergeable as a known issue, but shipping a destructive-looking button that silently does nothing visible is a bad first impression. Production deploy remains gated on the phase-5 VPS checklist.

Status: DONE_WITH_CONCERNS
Summary: Score 8/10. 0 Critical, 1 High, 2 Medium, 5 Low. All prior C1/H1/H2/M1–M6 fixes verified. The `X-Sync-User` guard has no bypass and its normalization is consistent. Gates green (682 tests, check, check:server).
Concerns: H1 is reproduced: a signed-in local wipe is undone by sync. M1 is a narrow in-flight race in logout+clear. Manual 2-browser and VPS rollback/backup acceptance are still unexecuted.

## Unresolved questions
- Should "Xoá tiến độ trên máy" exist at all while signed in, or is "Xoá dữ liệu khi đăng xuất" enough? This is a product call; option (a) assumes it is enough.
- Should logout-all also require `X-Sync-User` (small server contract change)?
