---
phase: 4
title: Domain and reader screens
status: completed
priority: P1
effort: 1 ngày
dependencies:
  - 2
  - 3
---

# Phase 4: Domain and reader screens

## Overview
Ghép shell (Phase 2) với nội dung (Phase 3): danh sách lĩnh vực, màn hình lĩnh vực theo module, reader bài học, điều hướng bài trước/sau, bìa fallback.

## Requirements
- Functional:
  - `/linh-vuc`: card mỗi lĩnh vực (accent, icon, tagline, số bài, vòng % — số % gắn ở Phase 5, ở đây render slot).
  - `/linh-vuc/[domain]`: hero card màu domain → section theo module → `lesson-row` (số thứ tự, tiêu đề, phút đọc, slot trạng thái ✓).
  - `/hoc/[domain]/[module]/[slug]`: `ReaderLayout`, bìa (ảnh user hoặc fallback), meta (module, phút đọc, nguồn), nội dung prose, cuối bài: slot "Hoàn thành" (Phase 5) + card "Bài tiếp".
  - Bài `examplesReviewed: false` mà có `<RealLife>` → badge "Nháp" trên khối.
  - Bìa fallback: SVG sinh lúc build (gradient accent domain + icon module + tiêu đề) — không cần ảnh.
- Non-functional: mọi route tĩnh (`getStaticPaths`); ảnh bìa qua `astro:assets` → WebP, có width/height (CLS 0); ảnh dưới fold `loading="lazy"`.

## Architecture
- Helpers `src/lib/content-queries.ts`: `getDomains()`, `getLessonsByDomain(id)` (sort module.order → lesson.order), `getAdjacent(lessonId)`. Mọi trang dùng helper này — 1 chỗ định nghĩa thứ tự.
- Components: `domain-card.astro`, `lesson-row.astro`, `lesson-cover.astro` (ảnh hoặc fallback), `next-lesson-card.astro`.
- `data-lesson-id` + `data-domain` đặt trên root reader/row để island Phase 5 đọc — hợp đồng DOM duy nhất giữa server markup và client state.
- Trang "Học tiếp" (`/`) ở phase này: danh sách lĩnh vực + "Bắt đầu từ bài 1"; logic "đang đọc dở" ở Phase 5.

## Related Code Files
- Create: `src/lib/content-queries.ts`
- Create: `src/components/domain/{domain-card,lesson-row}.astro`, `src/components/lesson/{lesson-cover,next-lesson-card,lesson-meta}.astro`
- Create: `src/pages/linh-vuc/[domain]/index.astro`, `src/pages/hoc/[domain]/[module]/[slug].astro`, `src/pages/gioi-thieu.astro` (nguồn + license + credit ảnh)
- Modify: `src/pages/index.astro`, `src/pages/linh-vuc/index.astro`, `src/styles/prose.css` (bảng, code, figure trên mobile)

## Implementation Steps
1. `content-queries.ts` + unit test thứ tự/adjacent (bài cuối module → bài đầu module kế).
2. Domain list + domain detail.
3. Reader: cover, meta, prose, attribution footer (nguồn + license), `<Disclaimer>` cho Tài chính (render từ layout theo domain flag thay vì chèn từng file — DRY).
4. Bảng rộng (bài database, bài tập) → wrapper cuộn ngang riêng + gợi ý cuộn; code block cuộn ngang trong khối, không kéo trang.
5. Fallback cover SVG.
6. Duyệt tay 5 bài dài nhất trên 375px.

## Success Criteria
- [ ] Mọi bài truy cập được từ Lĩnh vực → Module → Bài; "Bài tiếp" đúng thứ tự.
- [ ] Không horizontal scroll trang ở 375px với bài Database, Scaling AWS, Mint.
- [ ] Mỗi bài hiển thị nguồn + license; bài Tài chính có disclaimer.
- [ ] CLS < 0.1 trên reader (Lighthouse).

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| Bảng/sơ đồ gốc quá rộng cho mobile | H | M | Wrapper cuộn + ảnh có thể chạm để phóng (link mở ảnh gốc) |
| Bài quá dài (5.5k từ) mệt khi đọc trên điện thoại | M | M | Mục lục thu gọn đầu bài (heading h2) + progress bar; không chia nhỏ nội dung gốc |
