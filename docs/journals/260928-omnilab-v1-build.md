---
date: 2026-09-28
topic: OmniLab v1 — dựng app học tập 2 lĩnh vực bằng agent song song
---

# OmniLab v1: nhật ký kỹ thuật

## Bối cảnh
Repo trống → app Astro tĩnh kiểu iOS, 50 bài (27 Kiến trúc hệ thống + 23 Tài chính), giữ nguyên nội dung gốc, thêm ví dụ đời sống + SVG. Chủ dự án tự deploy (Railpack, Vibe Deploy Nhân Hòa) và uỷ quyền bỏ duyệt tay nội dung.

## Diễn biến chính
- Chạy song song theo file ownership: shell UI ∥ migration; reader ∥ lô nội dung thí điểm; 7 lô nội dung ∥ tiến độ/tìm kiếm. Cài dependency chung trước để tránh 2 agent cùng ghi lockfile.
- Slug theo tên file trùng nhau (`nen-tang/asynchronism` vs `chu-de/asynchronism`) → ID bài = `domain/module/slug`.
- Astro 7 bỏ qua remark plugin nếu không dùng processor `unified`; SmartyPants mặc định đổi dấu câu → tắt để giữ nguyên văn bản gốc.
- CSP bằng hash script rất dễ vỡ → `vite.build.assetsInlineLimit: 0`, CSP chỉ `script-src 'self'`.
- Pagefind không tìm được "bo nho dem" → MiniSearch + gập dấu tiếng Việt.
- `verify-fidelity` chặn build nếu văn bản gốc thay đổi; về sau siết thêm (cấm biểu thức MDX, kiểm `Note title`, phát hiện bài bị xoá).

## Điều rút ra
- Fact-check độc lập là bắt buộc: sửa hàng trăm lỗi ở ví dụ AI (sai luật BHXH/bảo hiểm, NAV thiếu nợ phải trả, DNS vẽ sai cơ chế, sơ đồ chống lừa đảo ngụ ý có thể đọc OTP).
- Báo cáo của agent phải được kiểm lại: một agent tài liệu khẳng định "chạy offline" và "Lighthouse ≥95" khi chưa đo; một agent QA bỏ qua phần soát SVG. Chỉ tin số đo có file bằng chứng.
- Code review toàn repo bắt được lỗi mà QA không thấy: script không chạy lại sau khi View Transitions chuyển trang, vị trí đọc bị ghi đè 0, HTML clean URL không có `Cache-Control`.

## Việc còn mở
Giấy phép nội dung Tài chính; lỗi upstream "1m 5s"; LCP 2,1–2,3s; HSTS; kiểm tra trên iPhone thật sau deploy.
