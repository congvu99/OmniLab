# Tester final e2e: progress sync, account panel on /toi

Branch feat/progress-sync, worktree `D:/project/OmniLab-progress-sync`, HEAD b7b7040 (rebased on main fe2a332). Worktree clean (`git status` empty), no repo source modified. Scratch: `C:/Users/ADMINI~1/AppData/Local/Temp/claude/d--project-OmniLab/cf35d9c1-82a6-4fc0-bf38-99a657811042/scratchpad/` (`final_e2e.py`, `wipe_repro.py`, logs `final-*.log`, `final_results_*.json`). Servers killed, temp sync DB removed.

## 0. Gates and setup

| Item | Result |
|---|---|
| `pnpm build` | PASS, exit 0, 74 pages. Warnings: vite `MODULE_LEVEL_DIRECTIVE` "use astro:head-inject" on lesson MDX (8+ files). Not checked vs main |
| `pnpm test` | PASS, 37 files, 682/682, 3.2s |
| Sidecar | `node server/sync/sync-server-entry.ts --dev`, 127.0.0.1:3001, temp DATA_DIR, throwaway secret |
| Static + /api proxy | `static-proxy.mjs` on 127.0.0.1:4399, dist from worktree |
| Browser | Python Playwright, Chrome channel. 390x844 mobile (light/dark), 1280x800 desktop |

## 1. Main run: 74 checks, 73 PASS, 1 FAIL

| Step | Result | Evidence |
|---|---|---|
| 1a signed-out `/`, lesson, `/da-luu/`, `/toi/` @390 and `/toi/` @1280 | PASS | Exactly 1 `GET /api/me` per load (401). No other /api call. Form visible after 401 |
| 1b A registers on /toi, done X, bookmarks X then Y | PASS | Server: done X, bm {X,Y}, `bookmarkMeta.at` X < Y |
| 1c B logs in (dark) | PASS | Local done X, bm {X,Y}. Saved list order == A order |
| 1d B unbookmarks X, A returns | PASS (visibility simulated) | Server bm {Y,Z}. A list Y,Z, order kept |
| 1e shared device: merge prompt | PASS | 0 PUT during 5s prompt. Server C untouched before choice |
| 1e "Gộp vào tài khoản" | PASS | Server C done {X,Z}, bm {Y,Z}. Local owner C |
| 1e "Dùng tiến độ của tài khoản" (variant, dark) | PASS | Local done == server done, owner C, twitter gone. Bookmarks equal |
| 1e "Huỷ — đăng xuất" (variant) | PASS | Back to signed-out form. 0 PUT. Local owner F + twitter kept. Server C unchanged |
| 1h logout-all | PASS | Session revoked (/api/me 401). Stale H2 PUT gets 401. Signed-out form. Local kept |
| 2 g: two tabs same context, one mark-done | PASS (previous FAIL fixed) | tab1 PUT=1, tab2 PUT=0 over 40s. Tab2 shows done via storage |
| 3 stale tab (C1) | PASS | See section 2 |
| 4 H1 change then logout within ~1s | PASS | See section 3 |
| 5 two-step wipe, Esc, Giữ lại, focus | PASS except wipe persistence | See section 4 |
| 6 sidebar 1280 | PASS | Signed-out: hidden. Signed-in: name `fd48121`, data-state ok, sr ", Đã đồng bộ". Logout: hidden |

Console: 25 errors, all expected: 401 (signed-out /api/me, stale PUT) and `net::ERR_FAILED` from the deliberate PUT abort in 4b. Page errors: 0.

## 2. Step 3, stale tab (review C1): PASS

- T1 and T2 signed in as SA (done X, bm Y).
- T1 logout (keep) → T2 follows to signed-out form via SYNC_USER_KEY.
- T1 login SB (server has done {Z}) → merge prompt in T1 (owner SA ≠ SB, no auto-merge).
- T2 toggles bookmark immediately after T1 login, then reopens /toi: 0 PUT from T2 (pendingMerge gate). T2 ends in merge state.
- Server SA unchanged (done X, bm Y). Server SB unchanged (done {Z}, no bm). Cancel in T1 leaves SB unchanged.
- Not exercised: the server 401 guard for X-Sync-User mismatch (`sync-server-entry.ts:44`). No PUT was sent in the window, so the guard never triggered.

## 3. Step 4, H1 (change then logout): PASS

- 4a: T1 marks done X (lesson), T2 on /toi clicks logout with clear-local on within ~1s. Order: `PUT /api/progress 200`, then `POST /api/auth/logout 204`. Local cleared after push. Fresh-device login sees twitter done.
- 4b: PUT aborted (route) + clear-local on. Local NOT cleared (twitter kept). Still signed in (account view). Notice: "Chưa đăng xuất được. Chưa kết nối được máy chủ đồng bộ. Tiến độ vẫn được lưu trên máy này." Tone error.
- Caveat: T1 debounced push raced the abort window in 4b. Server state after 4b not asserted.

## 4. Step 5, wipe: FAIL (wipe not durable while signed in)

PASS: step 1 reveals confirm, does not clear. Focus defaults to "Giữ lại". Esc cancels. "Giữ lại" cancels. "Xoá tiến độ" clears local immediately. Server copy untouched.

FAIL: local done returns ~3s after wipe.
- Repro (`wipe_repro.py`, reproduced 2x in full run): sign in, mark pastebin done, wait 4.5s, /toi, wipe → yes.
- t=0: local done = {}. t=+3.0s: one `PUT /api/progress` 200 with empty state. t=+4s onward: local done = {pastebin}. Server has pastebin throughout.
- Mechanism:
  - `account-sync-panel-wipe.ts:36` → `account-sync-panel.astro:459` → `progress-store.ts:278-279` `clear()` → `writeAndNotify`.
  - Watcher treats it as a local decision: `progress-sync-triggers.ts:50-51`, wired at `progress-sync-transfer.ts:50`.
  - Push response merges server copy back: `progress-sync-transfer.ts:61-66` (`applyRemoteJson` → `store.applyRemote`).
- Impact: "Xoá tiến độ trên máy" appears to do nothing when signed in. No data loss on server.
- Logout-with-clear path is not affected (signedOut() resets the scheduler).

## 5. Screenshots

Saved in `reports/screens/`:
- 390 light: `final-signed-in-light-390.png`, `final-merge-light-390.png`, `final-merge-stale-tab-light-390.png`, `final-wipe-confirm-light-390.png`
- 390 dark: `final-signed-in-dark-390.png`, `final-merge-dark-390.png`, `final-logged-out-dark-390.png`, `final-unavailable-dark-390.png` (offline run)
- 1280: `final-desktop-signed-in-light-1280.png`, `final-desktop-signed-in-dark-1280.png`

Visually checked two (merge dark 390, signed-in light 1280): render OK, no clipping. Gaps: no signed-out light 390 shot, no 1280 merge/wipe shot.

## 6. Offline run (sidecar down): PASS 9/9

- `/`, lesson, `/da-luu/`, `/toi/`, `/gioi-thieu/`: 200.
- `/api/me`: 503, `application/json`, `{"code":"unavailable"}`.
- Panel: "Chưa kết nối được máy chủ đồng bộ".
- Mark complete works locally. Done persists after reload.
- Console: 8 expected 401s. Page errors: 0.

## 7. Notes on harness changes

- Old scratch harness (tester-phase-03-04-e2e) server checks sent no `X-Sync-User` header. GET/PUT /api/progress now 401 without it (`sync-server-entry.ts:44`, `:126`, `:128`). Old server checks are invalid now. Final harness sends the header.
- Step d visibility is simulated (`visibilityState` override). Real tab switch not tested.

## 8. Critical issues

- Wipe resurrection (section 4). Behaviour bug, not data loss. Needs a product decision (see questions).

## 9. Recommendations

1. Decide wipe semantics when signed in. Options: (a) local-only wipe that suppresses the next push and pull until sign-out or next login; (b) hide or relabel wipe while signed in and point to logout-with-clear; (c) keep as-is and state "tiến độ sẽ được tải lại từ tài khoản". Add a browser check for "wipe stays wiped after 7s".
2. Add a regression unit test: `store.clear()` triggers no push from watcher, or push is suppressed for the wipe generation.
3. Add a real-browser test for X-Sync-User mismatch (401 path with live cookie of another user).
4. Add a real tab-switch check (headed browser, or two pages with real focus/visibility changes instead of the simulated override).
5. Capture a signed-out light 390 and 1280 merge/wipe screenshot set.
6. Check MDX `MODULE_LEVEL_DIRECTIVE` warnings against main build.

## 10. Status

Status: DONE_WITH_CONCERNS
Summary: main e2e 73/74 pass, offline 9/9, unit 682/682, build exit 0. Previous g FAIL fixed (1 PUT). C1 stale-tab and H1 logout-after-change pass. One FAIL: signed-in wipe reverts within ~3s (empty PUT pulls server copy back). Server data safe.
Concerns: (1) wipe bug, section 4; (2) visibility simulated; (3) server 401 guard for another-user identity not exercised live; (4) MDX build warnings not compared to main; (5) screenshot gaps.

## Unresolved questions

- Wipe semantics while signed in: local-only with push suppression (a), disabled/relabelled (b), or "reloads from account" (c)? Product decision, not fixed here.
- Is the 1-PUT-per-mark-done expectation strict in plan.md? Treated as strict here (g PASS now).
- Are MDX `MODULE_LEVEL_DIRECTIVE` build warnings pre-existing on main?
- Real tab-switch test still needed for visibility path?
