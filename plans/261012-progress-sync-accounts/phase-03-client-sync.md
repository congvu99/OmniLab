---
phase: 3
title: "Client sync"
status: done
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 3: Client sync

## Overview
Module client gắn vào `progressStore`: pull/push/merge với `/api/progress`, quản lý phiên, xử lý owner trên máy dùng chung, phát trạng thái cho UI.

## Requirements
- Singleton `getProgressSync()` cạnh `getProgressStore()`, **start một lần ở module top-level** (không trong `astro:page-load`), import từ script của cả `app-layout.astro` và `reader-layout.astro` (RT#15).
- Boot: một `GET /api/me` mỗi lần tải trang đầy đủ, **không cache sessionStorage** (RT#11).
  - 200 → signed-in. 401 → signed-out.
  - Mạng lỗi / 5xx / body không phải JSON → `unavailable` (không hiện form đăng nhập như thể đã đăng xuất); thử lại khi `visible`.
- Dirty (RT#1):
  - Lưu `omnilab:v2:lastSyncedHash` trong localStorage (chung mọi tab).
  - Dirty ⇔ `stateHash(current) !== lastSyncedHash`. Không dùng cờ "nguồn remote".
  - Tab nhận `storage` event mà hash khớp → không push.
- Pull: khi boot (signed-in) + `visibilitychange → visible`. Kết quả áp bằng `store.applyRemote()` (merge, không ghi đè), sau đó `lastSyncedHash = stateHash(remote)`. Nếu state local sau merge khác remote → còn dirty → push.
- Push (RT#15):
  - Khi `done`/bookmark đổi: debounce 3 s, `maxWait` 30 s.
  - Khi `hidden`/`pagehide`: gọi `store.flushScroll()` **trước**, rồi `fetch(..., {keepalive:true})` nếu dirty.
  - Scroll đơn thuần không kích hoạt push riêng; nó đi kèm lần push kế tiếp hoặc lần flush khi ẩn tab.
  - Gửi state với lesson id đã lọc theo `lessons-index.json` nếu đã tải (RT#13).
- Lỗi:
  - Mạng/5xx → giữ dirty, thử lại ở lần thay đổi kế tiếp hoặc khi `visible` (không timer nhiều tầng) (RT#15).
  - 401 → signed-out, giữ dữ liệu local.
  - 413 → trạng thái `error{code:'too_large'}`, dừng push đến khi tải lại.
- Owner (RT#3):
  - Login/register thành công:
    - `owner` local trống hoặc trùng username → PUT local (merge) → `applyRemote` → `setOwner(username)`.
    - `owner` local khác → **không PUT**, trả `needsMergeDecision` cho UI:
      - "Gộp" → PUT;
      - "Dùng tiến độ của tài khoản" → `store.clear()` rồi pull.
  - Logout: gọi API, giữ `owner` (để lần login người khác bị hỏi); UI có tuỳ chọn "Xoá dữ liệu trên máy này" → `store.clear()`.

## Architecture
```ts
type SyncStatus =
  | { kind: 'signed-out' }
  | { kind: 'unavailable' }                                  // không liên lạc được sidecar
  | { kind: 'syncing'; username: string }
  | { kind: 'synced'; username: string; at: number }
  | { kind: 'error'; username: string; code: ErrorCode };
type AuthResult =
  | { ok: true; username: string; needsMergeDecision: boolean }
  | { ok: false; code: ErrorCode };
interface ProgressSync {
  register(u: string, p: string, confirm: string): Promise<AuthResult>;
  login(u: string, p: string): Promise<AuthResult>;
  resolveMerge(choice: 'merge' | 'use-account'): Promise<void>;
  logout(opts?: { clearLocal?: boolean }): Promise<void>;
  logoutAll(): Promise<void>;
  subscribe(fn: (s: SyncStatus) => void): () => void;   // gọi ngay với trạng thái hiện tại
}
```
`ErrorCode` lấy đúng danh sách ở phase 2 (export từ một file type dùng chung `src/lib/progress-sync-types.ts`).

## Related Code Files
- Create: `src/lib/progress-sync.ts` (singleton + engine; fetch/clock/document/storage inject được)
- Create: `src/lib/progress-sync-types.ts` (`SyncStatus`, `AuthResult`, `ErrorCode`)
- Modify: `src/layouts/app-layout.astro`, `src/layouts/reader-layout.astro` (import `getProgressSync`)
- Create: `tests/progress-sync.test.mjs`

## Implementation Steps (TDD)
1. **Đỏ** (fake fetch + fake timers):
   - signed-out → chỉ 1 `/api/me`; `/api/me` 502 HTML → `unavailable`.
   - 3 lần toggle trong 3 s → 1 PUT; đọc liên tục 60 s chỉ có scroll → 0 PUT, hidden → 1 PUT keepalive sau `flushScroll`.
   - `markDone` giữa lúc PUT đang bay → sau response vẫn done và còn dirty → push tiếp (RT#1).
   - Hai instance mô phỏng 2 tab dùng chung storage → 1 thay đổi chỉ sinh 1 PUT.
   - Login user khác owner → không PUT, `needsMergeDecision:true`.
   - 413 → error too_large, không retry.
   - `getProgressSync()` gọi 2 lần → cùng instance, listener đăng ký 1 lần.
2. **Xanh**: cài đặt.
3. Chạy lại toàn bộ test store/islands.

## Success Criteria
- [ ] Test xanh.
- [ ] Soft navigation 10 trang: 1 instance, 1 bộ listener.
- [ ] Không request `/api/*` nào ngoài 1 `/api/me` khi chưa đăng nhập.

## Risk Assessment
- Safari iOS có thể bỏ `keepalive` khi kill app → mất ≤ 30 s thay đổi chưa đẩy ở máy đó; dữ liệu vẫn còn local và được đẩy ở lần mở sau (hash khác → dirty).
- Hai tab cùng dirty có thể cùng PUT một lần; merge luỹ đẳng nên vô hại.
