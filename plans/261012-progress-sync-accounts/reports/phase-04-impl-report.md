# Phase 04 impl report (account UI)

Worktree D:/project/OmniLab-progress-sync (feat/progress-sync), uncommitted.

## Files
- NEW src/lib/account-sync-panel-view.ts (108): pure view model `viewOf(SyncStatus)`, `errorText(code)` (all 12 ErrorCodes, distinct vi text), `validateAuthForm`, `normalizeUsername` (trim+lowercase; rules mirror server: `^[a-z0-9_.-]{3,32}$`, pw 8-128, confirm on register).
- NEW src/lib/account-sync-panel-controller.ts (142): `readAccountPanelElements` (`[data-ap=name]`), `attachAccountPanel(els, sync)` -> cleanup. Busy-lock on all buttons, ignores re-submit, clears pw after success, inline error (aria-live), focus to first invalid field, focus to merge heading when prompt appears, clear-local checkbox resets on return to form. Re-exports view fns.
- NEW src/components/islands/account-sync-panel.astro (255, mostly CSS): `.card` + `.eyebrow` + `.chip` tabs + `.field` + `.btn*`; tokens only. Initial server state = `checking` skeleton (no logged-out flash). `onPageLoad` + `getProgressSync()`.
- MOD src/pages/da-luu.astro: `<AccountSyncPanel />` above `<SavedList />`.
- NEW tests/account-sync-panel-controller.test.mjs (262, 24 tests): validation (no API call), every status + every ErrorCode text, `<img>` username verbatim, busy lock, merge prompt never auto-resolves, logout clearLocal/logoutAll, cleanup. Red first (module missing), then green.

## Behaviour
- checking -> skeleton; signed-out -> form (Đăng nhập / Tạo tài khoản tabs, confirm row only on register, autocomplete username / current-password / new-password switched by mode); unavailable -> only "Chưa kết nối được máy chủ đồng bộ"; needs-merge-decision -> "Máy này đang có tiến độ của tài khoản khác. Gộp vào tài khoản {tên}?" + [Gộp vào tài khoản] / [Dùng tiến độ của tài khoản] (+ note replace warning); signed-in -> "Đã đăng nhập: {tên}", "Đồng bộ lúc HH:mm" / "Đang đồng bộ…" / error text, checkbox "Xoá dữ liệu trên máy này khi đăng xuất", Đăng xuất, Đăng xuất mọi thiết bị.
- Note text "Không có khôi phục mật khẩu qua email..." in form.
- Security: dynamic text only via textContent (grep: innerHTML appears only in comments).
- Fix found in browser: global `:focus-visible` box-shadow doubled inside `.field`; scoped override added.

## Gates
pnpm test 32 files / 619 tests green; pnpm check 0/0/0; check:server clean; pnpm build 73 pages. token-contrast untouched (no new colors; only existing tokens).

## Browser smoke (real Chrome via python playwright, built dist + sync:dev on 3001)
No dev proxy in astro.config, none added; used throwaway node static+/api proxy in scratchpad (port 4399), not in repo. Verified at 390px: mismatch error inline; register -> signed-in "Đồng bộ lúc 14:01"; reload shows no form flash (form hidden at first paint, account after /api/me); 2nd browser context (dark) wrong pw -> error, correct pw -> signed in; shared device: A logout (keep data) then register tester_b2 -> merge prompt shown, focus moved to heading; 503 on /api -> unavailable notice only. Only console error: expected 401 from /api/me when signed out.
Screens (reports/screens/): p4-signed-out-light-390, p4-register-light-390, p4-signed-in-light-390, p4-error-dark-390, p4-signed-in-dark-390, p4-merge-light-390, p4-register-focus-dark-390, p4-focus-light-390, p4-unavailable-dark-390, p4-signed-out-light-1280.

## Deviations / notes
1. View model split into separate file (200-line rule).
2. No user icon in sprite; title is text-only eyebrow (did not touch icon files).
3. Merge detail note + button labels are static markup; only the question text with username is dynamic.
4. Merge state has no logout button (plan lists only the two choices).
5. Not exercised in e2e: merge-actions click through to completed sync with real progress data (covered by phase-3 tests + controller tests); 375px/desktop dark not shot; no soft-nav (ClientRouter) e2e beyond onPageLoad pattern.
6. Dev servers I started were killed afterwards.

## Unresolved
- Plan acceptance "kịch bản 2 trình duyệt" done with login only (progress content not compared in UI).
- Dev proxy for /api still absent (needed for `astro dev`); decide in deploy phase.

Status: DONE_WITH_CONCERNS
Summary: Account panel (controller+view+island+mount) done TDD, 24 new tests, all four gates green, UI smoked in real Chrome light/dark 390px incl. shared-device merge prompt.
Concerns/Blockers: no /api dev proxy in astro.config (smoked via temp proxy); merge-complete data path not e2e-verified in browser; nothing committed.

---

# Rework (rebased on main 71444e1, /toi tab)

Worktree D:/project/OmniLab-progress-sync, uncommitted. Baseline before edits: 36 files / 663 tests green.

## Changes
- da-luu.astro reverted to main (`git checkout main -- ...`). Panel now mounted only in `toi.astro` `#tai-khoan` (added `aria-labelledby="me-account"`, import, header comment line; other sections untouched).
- Modules (all < 200): `account-sync-panel-view.ts` (161: + initial/dot, `fieldOfCode`, `logoutFailureText`, `sidebarAccountView`, NFC), `account-sync-panel-elements.ts` (21), `account-sync-panel-wipe.ts` (44), `account-sync-panel-controller.ts` (194, now takes `deps.clearLocalProgress`).
- Island rewritten to Studio design: `.sec-h` title, `.card`, heading + benefit line, segmented control (surface-3 track, 44px), `.field`, `.btn-primary`; form max 420px; profile row (initial avatar surface-3, name 700, mono status line + dot ok/busy(pulse)/error); switch for clear-local; merge = in-section warning card with 2 equal buttons + "Huỷ — đăng xuất"; unavailable = grey dot + --text-2 line; wipe block (2-step, --danger text, Esc cancels, focus defaults to "Giữ lại"). Tokens only; dark via `data-theme` (no prefers-color-scheme in CSS), pulse off under `[data-motion=reduce]` and OS reduced motion.
- Sidebar: "Tôi" item shows name (ellipsis) + dot, sr-only status text; uses `getProgressSync().subscribe`, textContent only, external bundled script (CSP-safe). Dock unchanged.
- Review items: M2 cancel (logout, clearLocal:false); M3 `logoutAll({clearLocal})` from checkbox; M5 avatar/dot + 2-step wipe + sidebar; M6 focus moves to account name after login/merge resolve, to username after logout (only for user-initiated actions, never on boot; merge prompt still takes focus on boot), single polite `notice` line used only for errors/wipe/logout failure (no syncing<->synced announcements), `aria-invalid` + `aria-describedby` (hint+error) on inputs.
- Engine follow-ups: view NFC-normalizes password length/confirm and username; failed logout/logoutAll -> notice "Chưa đăng xuất được. {code text}" (not sync copy).
- "Đồng bộ ngay" row not added: engine has no sync-now API.

## Tests
tests/account-sync-panel-controller.test.mjs 39 tests (was 24): NFC, helpers, merge cancel, logoutAll clearLocal, logout failure line, focus rules, aria-invalid, live-notice rules, avatar/dot, 2-step wipe, wipe hidden in checking/merge. Red first (12 failing), then green.

## Gates
pnpm test 36 files / 678 green; pnpm check 0/0/0; check:server clean; pnpm build 74 pages. token-contrast untouched.

## Smoke (Chrome, built dist + sync:dev + temp proxy), screens/toi-*.png
Light + dark (via localStorage `omnilab:prefs` theme) at 390px: register -> focus on account name; wipe step 1 focus on "Giữ lại"; logout -> focus username; second account on same device -> merge card -> "Huỷ — đăng xuất" returns to form. 1280px dark: sidebar shows "● smoke_…" with sr text "Đã đồng bộ". Console: only expected 401 from /api/me.
Screens: toi-signed-out/signed-in/wipe-confirm/merge-{light,dark}-390, toi-desktop-{light,dark}-1280.

## Notes
- Failed-logout path and `error` dot/tone covered by unit tests, not forced in browser.
- Merge "use-account"/"merge" click-through with real progress not re-run in browser.
- Servers I started were killed.

Status: DONE_WITH_CONCERNS
Summary: Panel moved to /toi #tai-khoan with Studio styling, sidebar status, review items M2/M3/M5/M6 and NFC/logout-failure copy done test-first; gates green; smoked light/dark 390 + 1280 sidebar.
Concerns/Blockers: no "Đồng bộ ngay" (no engine API); merge-resolve data path and failed-logout not exercised in a real browser; nothing committed.

---

## Follow-up: wipe only when signed out (final review H1, L4)
- `account-sync-panel-controller.ts`: `wipe-block` hidden unless `view.section === 'form'` (signed-out). Hidden when checking/unavailable/merge/signed-in. Signed-in users use the "xoá dữ liệu trên máy khi đăng xuất" switch; added hint under it: "Dùng khi đây không phải máy của bạn." (island markup + `.ap-switch small`).
- Test updated (all non-form statuses hide the block, signed-out shows). Written together with the fix, red run not separately captured.
- docs/deployment-vps-guide.html: removed "chạy lại với mật khẩu hiện tại" advice; reset snippet now `P.normalize('NFC')` and `U.trim().toLowerCase()` (matches sync-server-entry.ts rules); explain line updated.
- Gates: pnpm test 37 files / 682 green; pnpm check 0/0/0. Build skipped as asked. Not committed; did not touch progress-sync*/server/sync.

Status: DONE
Summary: Wipe block now signed-out only; admin reset snippet normalizes like the server and the unusable advice is gone.
Concerns/Blockers: none; red phase of the one updated test not captured separately.
