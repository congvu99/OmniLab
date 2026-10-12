# Lộ trình dự án

## v1 (2026-10-12): Studio redesign hoàn tất

Trạng thái: v1 code đầy đủ + Studio redesign (dark-first graphite, Volt signature, command palette ⌘K, reader scrollspy + completion motion) hoàn tất. Tests xanh, build xanh. Chờ deploy trên Vibe Deploy Nhân Hòa (xem [deployment-guide.md](deployment-guide.md)).

| Hạng mục | Kết quả |
|---|---|
| Lĩnh vực / module / bài | 3 / 13 (Kiến trúc 4, Tài chính 6, Tài chính nghề 7) / 64 (27 + 23 + 14) |
| Ví dụ đời sống (`<RealLife>`) | 196 khối, cả 64 bài `examplesReviewed: true` sau fact-check agent |
| Minh hoạ | 97 SVG mới (inline, theo theme; 19 cho `nghe-tai-chinh`) + 44 ảnh gốc có ghi nguồn |
| Giao diện | iOS 26 (Apple HIG): grouped background, glass material bar, radius 22/16/12, Be Vietnam Pro, 44px tap target, ≥4.5:1 contrast |
| Desktop 3 cột | >=1024px sidebar (264px) + main (68ch) | >=1280px + reader aside (296px, sticky, scroll independent); TOC scrollspy, progress, actions |
| Tiến độ, bookmark, Học tiếp | `localStorage` (`omnilab:v1:state`), fallback in-memory ở private mode; islands bind + sync |
| Tìm kiếm | MiniSearch, gập dấu tiếng Việt; index ~84KB gzip, chỉ tải ở `/tim-kiem` |
| JS mỗi trang | 6–13KB gzip (ngân sách 30KB) |
| Test | 332 unit test (vitest, gồm toc-scrollspy + contrast) |

Chưa kiểm được trong môi trường dev (chủ dự án làm sau deploy): chế độ standalone trên iPhone thật, safe-area, lưu tiến độ lâu dài trên iOS, hiển thị SVG ở dark mode trên Safari.

## Ứng viên v2

| # | Hạng mục | Giá trị | Công sức | Ghi chú |
|---|---|---|---|---|
| 1 | **Font-size control** (UI + reading) | Accessibility | Thấp | Dùng `clamp()` logic + optional button. Not fake. |
| 2 | **J/K/B keyboard shortcuts** | Power users | Thấp | J=next, K=prev, B=bookmark; check before showing kbd hint |
| 3 | **Recent searches** (localStorage) | Discover patterns | Thấp–trung | Thêm key `omnilab:v1:recents` (tối 5 query) |
| 4 | **Domain shortTitle** | Better search chips | Thấp | Add optional `shortTitle` to content schema (e.g. "KTH", "TCD", "NTK") |
| 5 | Xuất/nhập tiến độ (JSON) | Sync giữa thiết bị | Thấp | Không cần backend |
| 6 | Đọc offline (service worker) | Cao với mobile | Trung bình–cao | Cần chiến lược cache version |
| 7 | Ảnh bìa cho 50+ bài | Visual appeal | Thấp (tự tạo) | Generative via AI prompt template |
| 8 | Quiz / flashcard cuối bài | Luyện tập chủ động | Trung bình | Nội dung mới, cần fact-check |
| 9 | Dark-mode raster figures | Content fix | Thấp | Re-theme PNG diagrams (cache, etc.) |
| 10 | Analytics tôn trọng riêu tư | Metrics | Thấp | CSP `connect-src` update |

## Việc còn mở

- Xác nhận giấy phép nội dung Tài chính (hiện ghi "Chưa xác định").
- Bảng "số 9" trong bài Availability (bản gốc upstream) ghi 99,99%/tuần là "1m 5s"; giá trị đúng ≈ 1m 0,5s. Nội dung gốc bị khoá bởi fidelity gate, nếu muốn sửa thì thêm ghi chú người dịch.
- Kiểm tra trực quan SVG ở light/dark trên iPhone thật (đã soát tự động 156/156 trên Chromium).
- LCP 2,1–2,3s trên giả lập 4G chậm, cần tối ưu font/ảnh nếu muốn < 2s.
- HSTS: chưa đặt trong Caddyfile; xác nhận nền tảng Vibe Deploy có tự thêm không.
