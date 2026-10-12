# Code review: phase 3 (client sync) + phase 4 (account UI)

Worktree `D:/project/OmniLab-progress-sync` (feat/progress-sync), uncommitted diff vs HEAD (phases 1, 2, 5). Read-only review. Ran `pnpm test` (32 files, 619/619 green), `pnpm check` (0/0/0) and `pnpm check:server` (clean). Did not run `pnpm build`.

## Scope
- New: `src/lib/progress-sync{,-contract,-dirty,-http,-singleton,-status,-triggers}.ts`, `src/lib/account-sync-panel-{controller,view}.ts`, `src/components/islands/account-sync-panel.astro`, `tests/progress-sync.test.mjs`, `tests/account-sync-panel-controller.test.mjs`
- Modified: `app-layout.astro`, `reader-layout.astro`, `progress-store.ts` (+`isWriteBlocked`), `progress-sync-types.ts` (+`SyncStatus`, `AuthResult`), `da-luu.astro`, `tests/saved-list-controller.test.mjs`
- About 1,030 LOC of source and 520 LOC of tests.
- Edge cases checked first:
  - the server progress responses carry no identity (`server/sync/sync-server-entry.ts:122-133`)
  - how the browser dispatches `storage` events vs the test fake
  - the order of the keepalive and pagehide pushes
  - logout vs the debounce timer

## Overall
- The engine is small and readable. The http wrapper never throws, has a timeout, uses `credentials: 'same-origin'` and `no-store`. `applyRemote` merges from a fresh read, so in-flight edits survive.
- CSP is fine: no inline script, `connect-src 'self'` covers `/api`.
- Dynamic text goes through textContent only (grep found no `innerHTML`).
- The main weakness is **auth identity is per-tab memory while the session cookie is per-browser**. That breaks the core RT#3 guarantee ("no auto-merge across owners").
- The cross-tab "don't push" logic only works under the synchronous test fake. In a real browser it does not hold.

## Critical

### C1. Stale tab pushes local data of owner A into account B without asking (RT#3 broken)
- **Where:** `src/lib/progress-sync.ts:42,94-116,173-177`; server `sync-server-entry.ts:124-133` (GET/PUT progress return the state only, no username).
- **Scenario:**
  1. Shared device, two tabs open while A is signed in.
  2. In tab 1: A logs out (keeps data, owner=A), then B logs in. Tab 1 correctly shows the merge prompt.
  3. Tab 2 still has `username='a'` in memory, because there is no cross-tab auth signal.
  4. The user switches back to tab 2 (`visible`, so `pull()`), or toggles a bookmark there (`schedule`, then `push`).
  5. The request carries **B's cookie**. GET returns B's state and `applyRemote` merges it into A-owned local data. `isDirty`, so PUT sends A's progress into B's account.
  6. B's progress is now on A's device, A's history is in B's account, and nobody chose to merge.
- The same mechanism makes a tab that was `signed-out` stay inert forever after a login in another tab (see M4).
- **Fix (pick one, server-side is most robust):**
  - (a) The client sends `X-Sync-User: <username>` on GET/PUT progress. The server answers 401 `unauthorized` (or 409) when it does not match the cookie user.
  - (b) The server includes `username` in progress responses (wrap as `{username, state}` or a header). The client drops the response and re-runs `boot()` on mismatch.
  - Also broadcast auth changes: write `omnilab:v2:syncUser` (username or empty) on login/logout. On a `storage` event for that key, reset and call `boot()`.
  - Add a two-tab test: logout+login in tab 1, then visible in tab 2, then expect no PUT.

## High

### H1. Logout drops unpushed decisions; with `clearLocal` they are lost permanently
- **Where:** `progress-sync.ts:157-165` (and `signedOut()` at :59-64 clears the scheduler).
- **Scenario:**
  1. Mark a lesson done or toggle a bookmark, then press "Đăng xuất" within the 3 s debounce window. No PUT is sent.
  2. With the "Xoá dữ liệu trên máy này" box ticked, `store.clear()` wipes the only copy.
  3. Without it, the change stays local under owner A. If B then logs in and chooses "Dùng tiến độ của tài khoản", it is also wiped.
- Scroll is not flushed either.
- **Fix:** in `endSession`, before calling the API: `store.flushScroll(); if (canSync() && isDirty()) await push({ force: true });`. Do this while the cookie is still valid. Add a test: toggle, logout(clearLocal) before 3 s, expect the PUT body to contain the toggle.

### H2. Cross-tab "external change" tagging does not work in real browsers, so every open tab PUTs every change
- **Where:** `src/lib/progress-sync-triggers.ts:50-61`.
- **Why it fails:**
  - It relies on the store's storage listener queuing a microtask *before* the watcher's own storage listener sets `external = true`.
  - For UA-dispatched events (`storage` is one), the HTML spec runs a microtask checkpoint after each listener callback returns. So the queued `onLocalDecision` check runs while `external` is still `false`.
- **Impact:**
  - Each other tab sees `isDirty()` true, because `lastSyncedHash` is not updated until the originating tab's PUT returns, and schedules its own push.
  - With N tabs open, one change gives about N PUTs at the same 3 s mark. No infinite loop, because identical `setItem` values do not fire `storage`.
  - Combined with C1, the multiplied PUTs also come from stale-identity tabs.
- **Phantom test:** `tests/progress-sync.test.mjs:26-29` fires listeners synchronously *inside* `setItem`, which is a single JS stack, so microtasks wait. The test "two tabs: one change -> one PUT" passes only because of the fake.
- **Fix options:**
  - Have the store report the change origin, e.g. `subscribe(fn(state, origin: 'local'|'storage'))` or a `lastChangeOrigin` getter set in `handleStorageEvent`. The watcher then reads it synchronously.
  - Or compute the decision in the store subscriber synchronously by checking a flag that the store sets around `handleStorageEvent`.
  - Make the fake dispatch via `queueMicrotask` per listener (or `setTimeout(0)`) so the test reflects browser semantics.

## Medium

### M1. A response from a previous session is applied to the next session
- **Where:** `progress-sync.ts:101-104,113-114`.
- The only guard is `if (!username) return`.
- **Scenario:** a PUT is in flight (up to 8 s), then logout, then login as B before it returns.
  - The old response is handled with `username = B`.
  - It sets `synced{B}`, overwriting `needs-merge-decision`, while `pendingMerge` stays true.
  - The UI loses the merge prompt and sync is stuck (`canSync` is false, no buttons) until reload.
- **Fix:** keep a `sessionEpoch` that is incremented in `reconcile`/`signedOut`. Capture it before `await http(...)` and discard the response if it changed.

### M2. The merge prompt has no exit; both options are destructive to the other owner's local data
- **Where:** `account-sync-panel.astro:50-58`, `progress-sync.ts:184-192` (impl report deviation 4).
- **Scenario:** B signs in on A's device by mistake.
  - The only choices are "merge A into B" or "wipe A's local data". Reloading re-asks, because the cookie persists.
  - The plan's acceptance criterion "được hỏi gộp, không tự gộp" is technically met, but a cancel path is missing.
- **Fix:** add "Huỷ / Đăng xuất" in the merge card, calling `logout()` with no data change.

### M3. "Đăng xuất mọi thiết bị" ignores the "Xoá dữ liệu trên máy này khi đăng xuất" checkbox
- **Where:** `account-sync-panel-controller.ts:243`, `progress-sync.ts:194` (hard-coded `false`).
- On a shared device, a user who ticks the box and picks logout-all keeps their data on the machine, while the UI implies it is cleared.
- **Fix:** `logoutAll(opts?: {clearLocal?})` and pass the checkbox value through.

### M4. A tab loaded while signed out never learns about a login in another tab
- **Where:** `progress-sync.ts:173-177` (visible only re-boots when the status is `unavailable`).
- That tab's own changes are persisted locally, but only reach the server when the logged-in tab later pushes or pulls.
- Its panel still shows the login form, which invites a second login.
- **Fix:** the same `syncUser` storage broadcast as in C1.

### M5. Phase-4 scope gaps not listed as deviations
- **Sidebar:** `src/components/shell/sidebar-nav.astro` (name and status dot on the "Tôi" item, listed in Related Code Files) is untouched.
- **2-step clear:** "Xoá tiến độ trên máy" with a two-step confirmation is not implemented.
- **Signed-in design:** the spec calls for an initial-letter avatar and a status dot (volt-ink / pulsing / danger, reduced-motion aware). The implementation shows text only.
- **Mount location:** the panel is on `/da-luu` instead of `/toi` `<section id="tai-khoan">`. `/toi` does not exist in this worktree; it comes from the personal-tab plan, which is still untracked in main. This is acceptable as interim, but it must move on rebase, and `da-luu.astro` must then be reverted.
- **Fix:** record these as explicit deviations or follow-up tasks before marking phase 4 Done.

### M6. Focus and announcements
- **Focus lost:** after a successful login or register the focused submit button becomes `hidden`, so focus falls to `<body>`. The same happens on logout (the logout button is hidden). A screen-reader user gets no confirmation that they are signed in, because `account-name` is not live.
  - **Fix:** after `result.ok`, focus `account-name` (`tabindex=-1`). After signing out, focus `username`.
- **Chatty live region:** `account-status` is `aria-live=polite` and flips "Đang đồng bộ…" / "Đồng bộ lúc HH:mm" on every bookmark and every tab hide, which is noisy.
  - **Fix:** announce only errors, e.g. a separate live node or set `aria-live` only when `tone=error`.
- **Inputs:** they lack `aria-invalid` and `aria-describedby` pointing to the error `<p>`.

## Low

- **L1.** `progress-sync.ts:96,167-178`:
  - `hidden` and `pagehide` both call `push({keepalive:true})`, and keepalive bypasses the `inFlight` gate. Closing a tab sends 2 identical PUTs.
  - Two in-flight keepalive bodies over about 32 KB each exceed the browser's 64 KB keepalive quota. `fetch` then rejects (status 0, error `unavailable`), and a body over 64 KB is reported as `unavailable`, not `too_large`.
  - **Fix:** skip the keepalive if one is already pending and the hash has not changed since it was sent. If the body is over about 60 KB, send without keepalive.
- **L2.** `progress-sync.ts:97-98`: `inFlight` is set *after* `await ensureKnownIds()`. Two pushes started during the first index load both pass the gate, giving a duplicate PUT. Harmless (idempotent merge) but sloppy. **Fix:** set `inFlight` before the await.
- **L3.** `progress-sync.ts:73,187`: if the 'merge' PUT fails, `owner` stays A. Later successful syncs use `takeOwner=false`, so the owner never flips and the next reload re-prompts for data that is already merged. **Fix:** remember a `pendingOwnerClaim` until the first successful 200.
- **L4.** `progress-sync.ts:42`: `halted` (413) also blocks *pull*. The plan says "dừng push". **Fix:** gate only `push` on `halted`.
- **L5.** `account-sync-panel-view.ts:61-62`: the client checks raw `.length` and raw `confirm === password`, while the server applies NFC first. For decomposed Vietnamese input this can give a different verdict (client rejects a pair the server accepts, or the reverse). **Fix:** `.normalize('NFC')` before validating and sending.
- **L6.** `progress-sync-status.ts:11`: a throwing subscriber aborts `set()` and propagates into the engine, mid-`handleResult`. **Fix:** wrap each listener call in try/catch.
- **L7.** `progress-sync.ts:159-161`: a failed logout shows "Chưa đồng bộ được. …" in the status line, which is wrong context. Return a result to the controller and show it in the error line instead.
- **L8.** `isWriteBlocked` has no unit test. `account-sync-panel.astro` is 255 lines (mostly CSS; acceptable). There are 7 sync lib files where the plan has 2; the split is reasonable and every file is under 200 lines.

## Acceptance check

| Criterion | Result |
|---|---|
| One `GET /api/me` when signed out | OK. Singleton plus module top-level; extra `/api/me` calls only on `visible` while `unavailable`. |
| No auto-merge across owners | **FAIL** across tabs (C1). OK in a single tab. |
| Local works with sidecar down | OK (timeouts, never throws, `unavailable` status, no form). |
| 413 | OK (`too_large`, halted until reload); also halts pull (L4). |
| Unbookmark propagates | OK (LWW `bookmarkMeta`, merge on pull at `visible`). |
| Đã lưu order | OK (`deriveBookmarks` by `at`; v1 migration uses a 1-based index). |
| Debounce 3 s / maxWait 30 s, scroll rides along | OK, tested. |
| In-flight `markDone` survives | OK (`applyRemote` uses `mutate` with a fresh read; follow-up push). |
| Multi-tab single PUT | **Not met in real browsers** (H2); the test is a phantom. |
| Soft-nav: one instance, one listener set | OK by design. Shared chunk, `assetsInlineLimit: 0`. The panel uses `onPageLoad` with cleanup on before-swap. No e2e. |
| textContent only / CSP / `same-origin` / password not stored or logged | OK. |
| Studio tokens only | OK. All tokens and classes exist in `tokens.css` / `base.css`. Avatar and dot missing (M5). |

## Side effects / regressions
- **`app-layout.astro` storage warning:** now also shown when `isWriteBlocked`, i.e. when storage holds future-schema data. That is correct, because writes are really dropped in that case. The copy was extended and the diacritics are fine. The reader layout still shows no warning (pre-existing).
- **`progress-store.ts`:** adds the `isWriteBlocked` getter only. No behaviour change.
- **`tests/saved-list-controller.test.mjs`:** the edit is justified.
  - Bookmarks toggled in the same ms tie on `at` and fall back to id order, so the old real-clock test was timing-flaky.
  - The injected clock makes it deterministic and does not weaken any assertion.
  - Real users cannot toggle two bookmarks in the same ms, and v1 migration keeps order via the index.
- **Every page now runs the sync engine:** one `/api/me` per full load, plus a `flushScroll()` on every `hidden`.
  - On the Railpack host (no sidecar), each full load issues a request that fails with 503 after about 2 s. The panel shows `checking`, then `unavailable`. Expected per plan.
- **Changes to `SyncStatus`:** `checking` and `needs-merge-decision` are added on top of the plan's union. Both are used consistently by the view. The server compiles (`check:server` clean).
- **`da-luu.astro`:** the panel is mounted above `SavedList` and pushes the list down. This is temporary until `/toi` exists (M5).

## Recommended actions (priority)
1. C1: identity check on progress requests (server header guard) plus the `syncUser` storage broadcast; add the two-tab logout/login test.
2. H1: flush and push before logout.
3. H2: store-level change origin; make the test fake dispatch asynchronously.
4. M1: session epoch guard.
5. M2, M3: merge-card cancel; `logoutAll` honours clear-local.
6. M5: log the scope gaps as deviations or tasks.
7. M6: focus management.
8. Low items as time allows.

Status: DONE_WITH_CONCERNS
Summary: Score 6.5/10. 1 Critical, 2 High, 6 Medium, 8 Low. Gates green (619 tests, check, check:server). Core merge and offline paths are solid. Cross-tab identity and change-origin handling are wrong in real browsers and the tests hide it.
Concerns: C1 violates the RT#3 acceptance criterion (it needs a small server change, which reopens phase 2). H2 is a phantom test. Phase-4 UI is incomplete vs spec (sidebar, 2-step clear, avatar and dot, `/toi`). No browser e2e for multi-tab or soft-nav.

## Unresolved questions
- Will C1 be fixed server-side (header guard, touches phase 2) or client-only (storage broadcast only, which still has a window)?
- Should the merge prompt allow cancel or logout? The plan listed only two choices.
- Does phase 4 stay on `/da-luu` until personal-tab lands, or wait for the rebase?
