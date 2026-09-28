# Lộ trình dự án

## v1 (2026-09-28): code xong, chờ deploy

Trạng thái: toàn bộ 7 phase trong [plan v1](../plans/260928-1725-omnilab-v1-learning-app/plan.md) đã hoàn thành trên `main`. Deploy lên Vibe Deploy Nhân Hòa và kiểm tra trên iPhone thật do chủ dự án thực hiện (xem [deployment-guide.md](deployment-guide.md)).

| Hạng mục | Kết quả |
|---|---|
| Lĩnh vực / module / bài | 2 / 10 (Kiến trúc 4, Tài chính 6) / 50 (27 + 23) |
| Ví dụ đời sống (`<RealLife>`) | 167 khối, cả 50 bài `examplesReviewed: true` sau fact-check agent |
| Minh hoạ | 78 SVG mới (inline, theo theme) + 44 ảnh gốc có ghi nguồn |
| Tiến độ, bookmark, Học tiếp | `localStorage` (`omnilab:v1:state`), fallback in-memory ở private mode |
| Tìm kiếm | MiniSearch, gập dấu tiếng Việt; index ~84KB gzip, chỉ tải ở `/tim-kiem` |
| JS mỗi trang | 6,6–13KB gzip (ngân sách 30KB) |
| Lighthouse mobile (đo lại sau sửa lỗi, 3 trang) | Performance 96–97, Accessibility 100, Best Practices 100, SEO 100, CLS 0; LCP 2,1–2,3s (mục tiêu < 2s, chưa đạt trên giả lập 4G chậm) — [QA report](../plans/260928-1725-omnilab-v1-learning-app/reports/phase-07-qa-report.md) |
| Test | 237 unit test (vitest) |

Chưa kiểm được trong môi trường dev (chủ dự án làm sau deploy): chế độ standalone trên iPhone thật, safe-area, lưu tiến độ lâu dài trên iOS, hiển thị SVG ở dark mode trên Safari.

## Ứng viên v2

| # | Hạng mục | Giá trị | Công sức | Ghi chú |
|---|---|---|---|---|
| 1 | Xuất/nhập tiến độ (JSON) | Dùng nhiều thiết bị | Thấp | Không cần backend |
| 2 | Đọc offline (service worker) | Cao với người đọc di động | Trung bình–cao | Cần chiến lược version cache cẩn thận |
| 3 | Ảnh bìa cho 50 bài | Cảm giác app | Thấp (tự tạo ảnh) | Theo [cover-image-prompt.md](cover-image-prompt.md) |
| 4 | Quiz / flashcard cuối bài | Học chủ động | Trung bình | Là nội dung mới, cần fact-check như ví dụ |
| 5 | Thêm lĩnh vực | Mở rộng | Theo nội dung | Chỉ cần YAML + thư mục bài ([content-authoring-guide.md](content-authoring-guide.md)) |
| 6 | Giảm kích thước search index | Tải nhanh hơn | Thấp | Cắt text dài, giữ tiêu đề + heading |
| 7 | Analytics tôn trọng riêng tư | Biết bài nào được đọc | Thấp | Cần cập nhật CSP `connect-src` |

## Việc còn mở

- Xác nhận giấy phép nội dung Tài chính (hiện ghi "Chưa xác định").
- Bảng "số 9" trong bài Availability (bản gốc upstream) ghi 99,99%/tuần là "1m 5s"; giá trị đúng ≈ 1m 0,5s. Nội dung gốc bị khoá bởi fidelity gate, nếu muốn sửa thì thêm ghi chú người dịch.
- Kiểm tra trực quan SVG ở light/dark trên iPhone thật (đã soát tự động 156/156 trên Chromium).
- LCP 2,1–2,3s trên giả lập 4G chậm, cần tối ưu font/ảnh nếu muốn < 2s.
- HSTS: chưa đặt trong Caddyfile; xác nhận nền tảng Vibe Deploy có tự thêm không.
