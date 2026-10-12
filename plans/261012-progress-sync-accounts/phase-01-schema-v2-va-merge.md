---
phase: 1
title: "Schema v2 va merge"
status: done
priority: P1
effort: "1.5d"
dependencies: []
---

# Phase 1: Schema v2 và merge

## Overview
Nâng `ProgressState` lên `v:2`: timestamp cho trạng thái hoàn thành, bookmark có tombstone + thứ tự, `owner` của dữ liệu local. Thêm `mergeStates` thuần dùng chung client/server và `applyRemote` trên store. Giữ nguyên các field consumer đang đọc.

## Requirements
- Consumer đọc trực tiếp `state.lessons[id].done/scroll/visitedAt`, `state.bookmarks`, `lastUnfinished()` → **không đổi** tên/ý nghĩa. Danh sách đầy đủ (RT#9): `lesson-row.astro`, `bookmark-button.astro`, `continue-reading-card.astro`, `mark-complete-button.astro`, `reader-progress-tracker.astro`, `progress-ring.astro`, `progress-ring-apply.ts`, `saved-list-controller.ts`, `domain-progress.ts`, `domain-progress.astro`, `learning-stats.astro`, `command-palette.astro` (grep lại `\.bookmarks|\.lessons\[|lastUnfinished` khi bắt đầu).
- `mergeStates(a, b)` **thuần, không có `now`**, giao hoán + kết hợp + luỹ đẳng, output canonical (key sắp xếp) để so hash ổn định (RT#1, RT#8).
- Không API DOM; import nội bộ có đuôi `.ts` để sidecar Node 24 chạy trực tiếp.

## Architecture
```ts
interface LessonProgress {            // field cũ giữ nguyên
  done?: boolean; doneAt?: number;
  doneUpdatedAt?: number;              // mới: thời điểm quyết định done/undone
  scroll?: number; visitedAt?: number; // scroll merge theo visitedAt (RT#15)
}
interface ProgressState {
  v: 2;
  owner?: string;                      // username sở hữu dữ liệu local; undefined = ẩn danh (RT#3)
  lessons: Record<LessonId, LessonProgress>;
  bookmarkMeta: Record<LessonId, { on: boolean; at: number }>; // nguồn sự thật duy nhất (RT#8)
}
// `bookmarks: LessonId[]` KHÔNG lưu; dẫn xuất trong get()/migrate(): id có on=true, sắp theo (at, id) tăng
mergeStates(a: ProgressState, b: ProgressState): ProgressState   // không đụng owner
stateHash(s: ProgressState): string                               // JSON canonical → hash ngắn
```
- Luật merge mỗi lesson:
  - `done/doneAt` theo `doneUpdatedAt` lớn hơn; hoà → `done:true` thắng.
  - `visitedAt = max`; `scroll` đi theo bên có `visitedAt` lớn hơn (hoà → scroll lớn hơn).
- Bookmark: `at` lớn hơn thắng; hoà → `on:true` thắng. **Không xoá tombstone** (số id bị chặn bởi số bài) (RT#8).
- `migrate()`:
  - v1 → v2 (RT#2, RT#8):
    - `doneUpdatedAt = done === true ? (doneAt ?? 1) : 0`. v1 "chưa xong" là tuyên bố yếu nhất, không bao giờ đè "đã xong" ở máy khác.
    - bookmark: `at = index + 1`, `on: true` (giữ thứ tự danh sách Đã lưu).
  - v2 → validate: id phải khớp `^[a-z0-9-]+/[a-z0-9-]+/[a-z0-9-]+$`, bỏ `__proto__`/`constructor`/`prototype`; dựng object bằng `Object.create(null)` hoặc lọc key (RT#13).
  - Khác → `emptyState()`.
  - `isUnknownFutureVersion`: ngưỡng `v > 2`.
- Store:
  - Thêm `applyRemote(remote)` = `mutate(base => ({ ...mergeStates(base, remote), owner: base.owner }))` (RT#1). Không có `replace()`.
  - Thêm `setOwner(username | undefined)` và `clear()`.
  - `get()` trả thêm `bookmarks` dẫn xuất (giữ contract cũ).

## Related Code Files
- Modify: `src/lib/progress-state.ts` (schema, migrate, emptyState, validate id, `bookmarks` dẫn xuất)
- Create: `src/lib/progress-merge.ts` (`mergeStates`, `stateHash`)
- Modify: `src/lib/progress-store.ts` (`markDone` ghi `doneUpdatedAt`; `toggleBookmark` ghi meta với `at = now`; `applyRemote`, `setOwner`, `clear`)
- Modify: `tests/progress-store.test.mjs`. Các test **phải đổi kỳ vọng hình dạng**, hành vi giữ nguyên (RT#9):
  - dòng ~56 (`toEqual({done,doneAt})`)
  - ~292-297 (migrate v1 round-trip; `{v:2}` không còn là "tương lai" → fixture tương lai chuyển sang `v:3`)
  - ~302-318 (shape lesson)
  - ~326-330, ~336-356 (rollback-safety dùng `v:3`)
  - ~347, ~382 (empty state)
- Create: `tests/progress-merge.test.mjs`, `tests/progress-state-migrate-v2.test.mjs`

## Implementation Steps (TDD)
1. Chạy `pnpm test` ghi baseline xanh.
2. **Đỏ** migrate:
   - fixture v1 thật → v2;
   - kịch bản RT#2: máy A `done@T1`, máy B chỉ `visitedAt=T2>T1` → sau migrate+merge X vẫn done;
   - thứ tự bookmark giữ nguyên;
   - `__proto__`/id sai mẫu bị loại;
   - `v:3` → `isUnknownFutureVersion` true.
3. **Đỏ** merge (bảng):
   - done/undone đồng thời; scroll theo visitedAt; bookmark thêm/bỏ chéo;
   - luỹ đẳng, giao hoán, kết hợp;
   - `stateHash(merge(merge(a,b),b)) === stateHash(merge(a,b))`.
4. **Đỏ** store: `applyRemote` giữa lúc có `markDone` mới hơn → không mất (`markDone` sau rồi `applyRemote` bản cũ → vẫn done).
5. Cập nhật test cũ theo danh sách trên (chỉ hình dạng).
6. **Xanh**: cài đặt. `pnpm test`, `pnpm check`.

## Success Criteria
- [ ] Test mới + cũ (đã cập nhật hình dạng) xanh; `pnpm check` sạch.
- [ ] localStorage v1 có sẵn → dữ liệu còn nguyên, thứ tự Đã lưu không đổi, ghi lại thành v2.
- [ ] `node -e "import('./src/lib/progress-merge.ts').then(m=>console.log(typeof m.mergeStates))"` in `function`.

## Risk Assessment
- Rollback deploy về bản client v1 sau khi browser đã ghi v2: bản v1 chỉ ghi in-memory (`skipPersist`), **mọi thay đổi trong thời gian rollback mất khi tải lại** (RT#15/failure #10c). Quy ước: không rollback client qua mốc v2; nếu buộc phải rollback thì app-layout hiện cảnh báo lưu trữ khi `skipPersist` bật (thêm điều kiện vào chỗ đang đọc `isPersistent`).
- Lệch giờ thiết bị: LWW theo giờ máy; server kẹp `ts > now → now`. Rủi ro còn lại được chấp nhận (máy dùng NTP).
