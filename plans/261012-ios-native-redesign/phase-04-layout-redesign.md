# Phase 4 — Đổi bố cục từng màn hình (vòng 2)

Lý do: vòng 1 chỉ đổi lớp sơn (user: "thiết kế ko thay đổi gì nhiều"). User chọn: đổi bố cục từng màn hình, giữ route + dữ liệu + localStorage schema; ưu tiên cả 4 khu vực: Học tiếp, lĩnh vực, trang đọc bài, desktop.

## Ràng buộc chung
- Giữ: route, localStorage schema (chỉ ĐỌC thêm dữ liệu sẵn có, không thêm key), data-* hook mà src/lib controllers + tests dùng, CSP (không inline script), fidelity gate, nội dung MDX/SVG.
- Dùng `src/components/domain/domain-artwork.astro` (gradient + icon theo accent, size hero|card|thumb) làm "ảnh bìa" của lĩnh vực ở mọi nơi. Ngoại lệ raw color: chỉ trong component này.
- Mỗi màn hình phải khác HẲN bản vòng 1 khi đặt cạnh nhau (bố cục, thứ bậc, kích thước), không chỉ đổi màu.
- Desktop không được để >40% màn hình trống ở 1440x900.

## 4A — Tab screens + desktop shell (1 agent)
Files: src/pages/{index,linh-vuc/**,tim-kiem*,da-luu*,gioi-thieu,404}.astro, src/components/domain/* (trừ domain-artwork: chỉ sửa nhỏ nếu cần), islands continue-reading-card/progress-ring/saved-list/search-box, + island mới cho widget, src/layouts/app-layout.astro, src/components/shell/{sidebar-nav,tab-bar,large-title-header}.astro, base.css (chỉ thêm utility).
- Học tiếp = dashboard widget (bento): lời chào theo giờ; hero "Đang đọc" có domain-artwork + % + nút Tiếp tục; widget số liệu (bài đã xong, % tổng, đã lưu, phút đã đọc ước tính) lấy từ progress store; hàng lĩnh vực dạng thẻ lớn có artwork; empty state cho người mới. Desktop: lưới bento 4 cột lấp màn hình.
- Lĩnh vực = thẻ lớn kiểu App Store Today (artwork card, title đè lên, tagline, số bài, tiến độ). Desktop: lưới 3 cột đầy màn hình.
- Trang lĩnh vực = hero artwork full-bleed + large title đè; thanh tiến độ; segmented control chọn module (mobile, cuộn ngang, sticky) và danh sách bài dạng card có số thứ tự lớn/trạng thái; desktop: 2 cột (danh sách module bên trái sticky | bài bên phải) hoặc lưới card.
- Tìm kiếm/Đã lưu: gợi ý tìm kiếm (chip chủ đề) khi rỗng, kết quả card; Đã lưu dạng lưới card trên desktop.
- Desktop shell: bỏ giới hạn 880px cho trang tab (max ~1200px), sidebar có tiến độ từng lĩnh vực.

## 4B — Reader (1 agent)
Files: src/pages/hoc/**, src/components/lesson/*, src/styles/prose.css, islands mark-complete/bookmark/reader-progress-tracker, src/layouts/reader-layout.astro, src/components/shell/reader-top-bar.astro, src/lib/toc-scrollspy.ts.
- Hero bài học: domain-artwork size hero full-bleed (mobile tràn viền dưới top bar), breadcrumb module, title lớn đè/dưới artwork, chip meta (phút đọc, nguồn, module) — gộp cho hết lặp tiêu đề 3 lần (top bar chỉ hiện title khi cuộn qua hero).
- Thanh tiến độ đọc mảnh dưới top bar; mobile: thanh hành động nổi dưới đáy (mục lục dạng sheet, lưu, hoàn thành) thay cho các khối rải trong bài.
- Khối "Ví dụ đời sống", note, review-note, disclaimer: nhận diện riêng rõ (icon lớn, nền tint, nhãn).
- Cuối bài: card hoàn thành lớn + bài tiếp theo có artwork.
- Desktop: 3 cột như cũ nhưng hero rộng toàn cột nội dung, aside có mini-progress ring; 1024–1279 có TOC ở thanh hành động.
