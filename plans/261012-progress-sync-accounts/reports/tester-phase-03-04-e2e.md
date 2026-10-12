# Tester report: progress sync e2e (phase 3-4)

Worktree `D:/project/OmniLab-progress-sync` (feat/progress-sync), phases 3-4 uncommitted. Repo source not modified. Scratch: `C:/Users/ADMINI~1/AppData/Local/Temp/claude/d--project-OmniLab/cf35d9c1-82a6-4fc0-bf38-99a657811042/scratchpad/` (e2e_run.py, static-proxy.mjs, g_debug.py). Temp sync data and servers removed.

## 1. Gates

| Gate | Result |
|---|---|
| `pnpm test` | PASS. 32 files, 619/619, 2.65s |
| `pnpm check` | PASS. 156 files, 0 errors, 0 warnings, 0 hints |
| `pnpm check:server` | PASS. tsc clean |
| `pnpm build` | PASS. 73 pages, sitemap ok. Warnings: vite `MODULE_LEVEL_DIRECTIVE` "use astro:head-inject" on MDX lesson modules. Not verified against main; likely pre-existing |

## 2. Setup

- Sidecar: `node server/sync/sync-server-entry.ts --dev`, PORT 3001, DATA_DIR temp, fresh secret.
- Static `dist/` + `/api/*` proxy on 127.0.0.1:4399 (scratchpad `static-proxy.mjs`, logs every /api call; returns 503 `{"code":"unavailable"}` when sidecar down).
- Python Playwright, Chrome channel, viewport 390x844, `is_mobile`, touch. Context A light, B dark. Extra throwaway contexts for account C, E, G, H.
- Order: a, b, c, d, e, g, h, then f last (f kills sidecar, so it cannot run earlier).

## 3. Scenario results

Main run: 37 checks, 36 pass, 1 fail. Offline run: 10 checks, 9 pass, 1 probe error.

### a. Signed-out loads: PASS
- `/`, `/hoc/kien-truc/bai-tap/pastebin/`, `/da-luu/`: exactly 1 `GET /api/me` per load, 0 other /api calls.
- `/da-luu/` timeline (fetch + panel state): `state:none, checking, req:/api/me, checking, resp:/api/me:401, checking, state:form`. No form before response.

### b. A registers, completes, bookmarks X then Y: PASS
- Register on /da-luu, account shown. pastebin done. bookmark pastebin (X), then mint (Y).
- Server: done X; bookmarks X,Y; `bookmarkMeta.at` X < Y.

### c. B logs in (dark): PASS
- B localStorage: done X, bookmarks X,Y.
- B saved list order == A order.
- B lesson pastebin shows done.

### d. B unbookmarks X; A returns to tab: PASS (with a fixed test sequencing)
- B first bookmarks Z (query-cache) so order check has 3 items. Extra step, not in spec.
- A open on /da-luu before B's change, list X,Y,Z (stale, as expected).
- B removes X via `[data-saved-row-remove]`. Server: X off, Y and Z on.
- A: simulated hidden then visible (`document.visibilityState` override + `visibilitychange`). List now Y,Z, order preserved.
- Caveat: visibility is simulated, not a real tab switch.
- First attempt was invalid (A reloaded after change, so the pass proved nothing). Fixed, re-run.

### e. Shared device: PASS
- A logout (keep data): owner kept = A, X done kept.
- Account C pre-seeded on server (query-cache done) from throwaway context.
- A logs in C: merge prompt "Máy này đang có tiến độ của tài khoản khác. Gộp vào tài khoản ec…?". 0 PUT during 5s prompt. Server C unchanged (only query-cache, no bookmarks).
- "Gộp vào tài khoản": server C = done {X, query-cache}, bookmarks {Y, Z}. Local owner = C, merged.
- Variant 2 (fresh ctx E, local owner E with twitter done): E logs out (keep), logs in C. Prompt, no auto-merge (twitter still local). "Dùng tiến độ của tài khoản": local done == server done {X, query-cache}, twitter gone, owner = C, bookmarks == server.

### g. Two tabs, same context: FAIL (duplicate PUT)
- Expected: 1 PUT, no ping-pong over 40s.
- Observed: tab1 PUT=1, tab2 PUT=1, both ~3s after one click, identical body. No ping-pong over 40s. Tab2 reflected done via storage event.
- Repro (g_debug.py, reproduced twice):
  1. Register account in ctx. Open `/hoc/kien-truc/bai-tap/query-cache/` in tab1 and tab2 (same ctx).
  2. Click `[data-mcb] .mcb-button:visible` in tab1.
  3. Observe `PUT /api/progress` from tab1 and from tab2 at about +3s. Both 200. No visibility events fired.
- Suspected cause (not fixed):
  - `src/lib/progress-sync-triggers.ts:48-61`. Watcher's `storage` listener sets `external = true` and the subscriber checks it in a microtask. The comment (l.48-49) assumes the store's listener and its subscriber microtask both finish before the watcher listener runs. For a browser-dispatched event, a microtask checkpoint runs after each listener callback, so the subscriber's microtask runs with `external` still false and schedules a push.
  - Store side: `src/lib/progress-store.ts:213` registers `handleStorageEvent`; `:210` calls `notify()` synchronously.
  - Impact: one redundant idempotent PUT per other tab per cross-tab change. No loop, so plan finding #1 ping-pong is not reproduced. Unit tests (fake event target, sync dispatch) cannot see this; needs a real-browser check.
  - Fix direction: set origin flag synchronously before notify, or register the watcher listener before the store's, or drop the microtask. Add a two-tab browser check.

### h. Logout-all: PASS
- H1 logout-all: server session revoked (`/api/me` 401).
- H2 (stale session, on lesson page) bookmarks: PUT gets 401.
- H2 then shows signed-out form. Local bookmark kept, owner kept.

### f. Sidecar down (run after sidecar killed): PASS, 1 probe error
- `/`, pastebin, `/da-luu/`, `/gioi-thieu/`: 200.
- `/hoc/`: 404. Probe error. `/hoc/` has no index route in dist or main. Not a regression.
- `/api/me`: 503, `application/json`, body `{"code":"unavailable"}`.
- Panel: "Chưa kết nối được máy chủ đồng bộ" visible.
- Mark complete works locally. Done persists after reload. Local state has done pastebin.

## 4. Acceptance criteria (plan.md) coverage

| Criterion | Status |
|---|---|
| `pnpm test` green | PASS |
| Manual 2-browser: register A, done+bookmark; B login sees; B unbookmark, A sees on return; order kept | PASS (visibility simulated) |
| Shared device: A logout, B login → prompt, no auto-merge | PASS |
| Signed-out: one GET /api/me per load | PASS |
| Sidecar down: site 200, /api 503 JSON, UI unavailable text, local progress works | PASS |
| Two tabs: no ping-pong | PASS for ping-pong; FAIL for single PUT (see g) |
| Static header unchanged | NOT TESTED (not in this scope) |
| Sidecar only on internal network, port 3000 not exposed | NOT TESTED (deploy, phase 5) |
| Rollback, backup/restore | NOT TESTED (phase 5, needs VPS) |

## 5. Screenshots

390x844. Light: `e2e-signed-out-light-390.png`, `e2e-signed-in-light-390.png`, `e2e-merge-light-390.png`, `e2e-return-tab-light-390.png`. Dark: `e2e-signed-in-dark-390.png`, `e2e-lesson-done-dark-390.png`, `e2e-logged-out-dark-390.png`, `e2e-unavailable-dark-390.png`. All in `reports/screens/`. Not visually reviewed by tester; captured for reference.
Gaps: no dark merge shot, no register-form shot in this run (phase-4 screens cover register).

## 6. Performance / other

- Test suite 2.65s. Build 12s. Check 12s.
- Sidecar /api latency 2-6ms locally (proxy log).
- Not checked: browser console errors, memory, 375px/desktop.

## 7. Critical issues

None blocking. One functional defect (g): redundant PUT from every other tab on cross-tab change. Not a data-loss or loop issue.

## 8. Recommendations

1. Fix `progress-sync-triggers.ts` cross-tab origin detection (g). Add two-tab Playwright check to the e2e list: assert exactly one PUT per mark-done.
2. Correct the comment at `progress-sync-triggers.ts:48-49` after fix.
3. Keep this e2e harness as a manual or CI-optional script. It needs Chrome and a sidecar.
4. Add console-error capture to future runs.

## 9. Next steps

1. Fix (g) and re-run this scenario (step g and step f at minimum).
2. Phase 5 deploy checks: sidecar not on port 3000, backup/restore on VPS.
3. Commit phases 3-4 after fix.

Status: DONE_WITH_CONCERNS
Summary: all gates green (619 tests). E2E a-f and h pass with real browsers, dark and light. One failure: two tabs send duplicate PUT per mark-done (no ping-pong). Suspected cause `src/lib/progress-sync-triggers.ts:48-61`.
Concerns: (1) duplicate PUT above; (2) visibility return simulated, not real tab switch; (3) step order changed (f last); (4) `/hoc/` probe error (route nonexistent, not a regression).

## Unresolved questions
- Is the "2 tabs, 1 PUT" expectation strict in the plan? Plan says ping-pong only. Treat as defect or accepted?
- Are the MDX `MODULE_LEVEL_DIRECTIVE` build warnings pre-existing on main? Not checked.
- Real-device or real tab-switch test for visibility path still needed?
