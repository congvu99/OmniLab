---
phase: 5
title: Progress bookmarks and search
status: completed
priority: P2
effort: 1–1.5 ngày
dependencies:
  - 4
---

# Phase 5: Progress bookmarks and search

## Overview
State phía client (localStorage): hoàn thành bài, % theo lĩnh vực, bookmark, "Học tiếp" (bài + vị trí cuộn). Tìm kiếm toàn văn Pagefind, hỗ trợ gõ không dấu.

## Requirements
- Functional:
  - Nút "Đánh dấu hoàn thành" cuối bài (toggle, có undo toast 4s); ✓ trên `lesson-row`; vòng % trên `domain-card` và hero domain.
  - Bookmark ở `reader-top-bar`; tab "Đã lưu" liệt kê bài đã lưu (empty state có hướng dẫn).
  - "Học tiếp" (`/`): card bài gần nhất chưa xong + resume vị trí cuộn; nếu trống → gợi ý bắt đầu.
  - Tìm kiếm: ô tìm ở `/tim-kiem`, kết quả có tiêu đề + đoạn trích highlight + lĩnh vực; gõ "bo nho dem" ra bài Cache.
- Non-functional: không backend; state versioned; lỗi localStorage (private mode, quota) → app vẫn đọc được, ẩn tính năng + thông báo nhẹ.

## Architecture
**Store** (`src/lib/progress-store.ts`, vanilla TS, dùng chung mọi island):
```ts
const KEY = 'omnilab:v1:state';
type State = {
  v: 1;
  lessons: Record<LessonId, { done?: boolean; doneAt?: number; scroll?: number; visitedAt?: number }>;
  bookmarks: LessonId[];
};
interface ProgressStore {
  get(): State; markDone(id, done: boolean): void; saveScroll(id, ratio: number): void;
  toggleBookmark(id): boolean; lastUnfinished(): LessonId | null;
  subscribe(fn): () => void;   // đồng bộ giữa các island + tab (storage event)
}
```
- `saveScroll` throttle 1s, lưu **tỉ lệ** (0–1) thay vì px (bền khi đổi cỡ màn hình).
- Gọi `navigator.storage.persist()` một lần khi chạy standalone.
- Migration: hàm `migrate(raw)` khi `v` khác → chuẩn bị sẵn cho v2.
- Danh sách bài cho "Đã lưu"/"Học tiếp": build xuất `lessons-index.json` tĩnh (id, title, domain, url, readingMinutes) — island fetch 1 lần, không nhúng vào mọi trang.

**Search:**
- Pagefind chạy sau build (`astro-pagefind` integration hoặc `pagefind --site dist` trong `postbuild`); `data-pagefind-body` chỉ trên nội dung reader; `data-pagefind-filter="domain"`.
- **Spike đầu phase (≤2h):** kiểm tra Pagefind với `lang="vi"`: query có dấu, không dấu, cụm "bộ nhớ đệm". Nếu không dấu fail → phương án B: build `search-index.json` (title, headings, text rút gọn) + MiniSearch với `processTerm` = NFD + bỏ dấu + `đ→d`. Chọn theo kết quả spike, ghi vào `docs/system-architecture.md`.
- UI search tự viết (không dùng Pagefind UI mặc định) để khớp style iOS; debounce 200ms; hiển thị trạng thái loading/empty/lỗi.

## Related Code Files
- Create: `src/lib/progress-store.ts`, `tests/progress-store.test.ts`
- Create: `src/components/islands/{mark-complete-button,bookmark-button,continue-reading-card,domain-progress-ring,saved-list,search-box}.astro` (mỗi file = markup + `<script>`)
- Create: `src/pages/lessons-index.json.ts` (endpoint tĩnh)
- Modify: `src/pages/{index,da-luu,tim-kiem}.astro`, `lesson-row.astro`, `domain-card.astro`, `reader-top-bar.astro`, `astro.config.mjs`, `package.json`

## Implementation Steps
1. Spike Pagefind tiếng Việt → quyết định A/B.
2. Test trước cho store: markDone/undo, bookmark toggle, lastUnfinished, migrate, localStorage throw → fallback in-memory.
3. Implement store đến khi test pass.
4. Islands: nút hoàn thành + toast undo (`aria-live="polite"`), bookmark (`aria-pressed`), ✓ row, vòng % (có text %, không chỉ màu).
5. "Học tiếp" + resume scroll (sau View Transition load, `requestAnimationFrame`).
6. "Đã lưu" + empty state.
7. Search box + trang kết quả.
8. Test thủ công trên iPhone standalone: đóng app, mở lại → state còn.

## Success Criteria
- [ ] Test store pass.
- [ ] Hoàn thành 1 bài → ✓ row + % domain cập nhật không reload; undo hoạt động.
- [ ] Đóng/mở app standalone iOS giữ state; "Học tiếp" mở đúng bài và vị trí.
- [ ] "cache", "bộ nhớ đệm", "bo nho dem" đều trả bài Cache trong top 3.
- [ ] Private mode: app không crash, có thông báo tính năng lưu bị tắt.

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| Pagefind không fold dấu tiếng Việt | M | M | Spike trước; phương án MiniSearch |
| iOS ITP xoá storage khi dùng trong Safari thường | M | M | Khuyến khích "Thêm vào màn hình chính" (banner 1 lần trên iOS Safari); `storage.persist()` |
| Island trùng lặp logic | L | L | 1 store + subscribe; islands chỉ render |
| Mất tiến độ khi đổi thiết bị | H | L | Ngoài phạm vi v1; vòng sau: export/import JSON |
