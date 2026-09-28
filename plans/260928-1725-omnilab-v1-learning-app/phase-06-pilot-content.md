---
phase: 6
title: "Content enrichment (all lessons)"
status: pending
priority: P1
effort: "~8–10 ngày-agent (song song)"
dependencies: [4]
---

# Phase 6: Pilot content

## Overview
> **Scope change 2026-09-28 (user):** làm **toàn bộ bài học** (không chỉ thí điểm), không hỏi user; user bỏ vòng duyệt thủ công → thay bằng **agent fact-check độc lập** mỗi lô trước khi set `examplesReviewed: true`. Vòng 2 cũ gộp vào phase này.

Quy trình: (1) chốt style guide + SVG mẫu trên 6 bài thí điểm (dưới đây) bằng 1 agent; (2) fan-out agent song song theo lô thư mục bài học (file ownership tách bạch); (3) fact-check agent mỗi lô; (4) `verify-fidelity` + build.

Bài thí điểm (lô 0, chốt style):
- Kiến trúc: `chu-de/07-cache`, `chu-de/03-load-balancer`, `danh-doi/03-cap-theorem`
- Tài chính: Tuần 3 (Lãi kép, lạm phát & bộ đệm nhỏ), Tuần 4 (Chi phí vay & kế hoạch trả nợ), Tuần 5 (Quỹ dự phòng & bảo hiểm)

## Requirements
- Functional:
  - Mỗi bài 3–5 khối `<RealLife>`, đặt ngay sau đoạn khái niệm liên quan; bối cảnh Việt Nam đời thường (quán phở, tủ lạnh, ngân hàng, xếp hàng, Grab...).
  - Mỗi bài 1–3 SVG (`<Figure added>`), tổng ~90–110; mỗi SVG giải thích **cơ chế** (luồng, so sánh trước/sau), không trang trí.
  - `examplesReviewed: true` chỉ khi fact-check agent pass (user uỷ quyền, không duyệt tay).
  - File `docs/cover-image-prompt.md`: 1 prompt mẫu + biến (chủ đề, màu accent) + spec xuất ảnh.
- Non-functional: SVG < 15KB/ảnh, dùng `currentColor`/CSS var (đúng ở light + dark), chữ tiếng Việt là `<text>` thật, có `<title>` + alt; `verify-fidelity` vẫn pass.

## Architecture
**Quy tắc viết ví dụ** (`docs/content-authoring-guide.md`):
- 1 ví dụ = 1 phép so sánh, ≤ 90 từ, kết thúc bằng câu nối lại khái niệm gốc ("→ Đây chính là cache hit").
- Không số liệu thời sự (lãi suất, thuế, giá) trừ khi ghi "ví dụ minh hoạ, số giả định" hoặc kèm ngày + nguồn.
- Tài chính: không khuyến nghị sản phẩm/nhà cung cấp cụ thể.
- Chỉ ra **giới hạn** của phép so sánh khi dễ gây hiểu sai (VD: CAP ≠ "chọn 2 trong 3" tuỳ ý).
- Ví dụ minh hoạ (không phải nội dung phải làm):
  - Cache → tủ lạnh ở nhà vs chạy ra chợ; TTL = hạn sử dụng; cache invalidation = đồ trong tủ hỏng mà vẫn lấy ra dùng.
  - Load balancer → nhân viên xếp khách vào các quầy ngân hàng; health check = quầy treo biển "tạm nghỉ".
  - Lãi kép → cây mít trồng từ hạt: năm đầu chậm, 10 năm sau tự ra quả nuôi thêm cây.

**SVG style guide** (`docs/illustration-style-guide.md`):
- viewBox 360×220 (mobile) hoặc 360×300; stroke 2px, `stroke-linecap/linejoin: round`; bo góc 10.
- Màu: `var(--accent)` cho luồng chính, `var(--ink-2)` cho phụ, fill `color-mix(in srgb, var(--accent) 12%, transparent)`; không màu cứng.
- Chữ: Be Vietnam Pro 13–15px, `fill: var(--ink)`; tối đa ~6 nhãn/hình.
- Inline trong HTML (qua `?raw` import hoặc component `.astro` mỗi SVG) để CSS var có hiệu lực — không dùng `<img src=svg>`.
- Tuỳ chọn animation: 1 luồng "chạy" nhẹ, tắt khi reduced-motion.
- Lưu tại `src/assets/illustrations/<domain>/<lesson>-<ten-hinh>.svg`.

**Ảnh bìa:** spec 1200×675, đặt tại `src/content/lessons/<domain>/<module>/covers/<slug>.jpg|png`, khai báo `cover:` trong frontmatter; build tự ra WebP. Chưa có → fallback cover (Phase 4).

## Related Code Files
- Create: `docs/content-authoring-guide.md`, `docs/illustration-style-guide.md`, `docs/cover-image-prompt.md`
- Create: `src/assets/illustrations/**.svg` (~15)
- Modify: 6 file `.mdx` thí điểm (chỉ thêm `<RealLife>`/`<Figure>` + đổi frontmatter)
- Modify: `src/components/lesson/{real-life,figure}.astro` (style cuối)

## Implementation Steps
1. Viết 3 guide docs; user duyệt style guide + 1 SVG mẫu (Cache: luồng cache hit/miss) **trước khi** làm tiếp — chốt style sớm.
2. Với mỗi bài: AI nháp ví dụ → commit trên branch `content/pilot-<slug>` → user duyệt (sửa trực tiếp hoặc comment) → set `examplesReviewed: true`.
3. Vẽ SVG còn lại theo guide; kiểm tra light/dark, 375px.
4. `pnpm verify:fidelity` + `pnpm build` pass.
5. Retro ngắn: thời gian thực tế/bài → cập nhật ước lượng vòng 2 trong `docs/project-roadmap.md`.

## Success Criteria
- [ ] 6 bài `examplesReviewed: true`, user xác nhận chất lượng.
- [ ] ~15 SVG theo style guide, đúng ở light + dark, mỗi file < 15KB.
- [ ] Fidelity pass (nội dung gốc không đổi).
- [ ] Có số đo thời gian/bài để lập kế hoạch vòng 2.

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| Ví dụ AI sai / sáo rỗng | H | H | Quy tắc viết + user duyệt bắt buộc; badge "Nháp" khi chưa duyệt |
| Style SVG không đồng nhất giữa các bài | M | M | Chốt 1 SVG mẫu trước; guide có token cố định |
| Vòng duyệt của user làm tắc tiến độ | M | M | Duyệt theo lô 2 bài/lần; phase khác (5, 7 một phần) chạy song song |
| Ví dụ tài chính bị hiểu là tư vấn | L | H | Disclaimer + quy tắc không khuyến nghị sản phẩm |
