# Phase 1 — Tab "Tôi" + trang /toi

## Điều hướng
- `src/components/shell/nav-items.ts`: thêm `{ href: '/toi', label: 'Tôi', icon: <icon mới 'user'>, activePrefixes: ['/toi'] }`. Vẽ icon `user` cùng ngôn ngữ monoline 24px/1.5 trong `src/components/icon/` + cập nhật `tests/icon-names.test.mjs`.
- Dock 5 tab vừa 320–430px (nhãn không cắt, target >=44px); badge Đã lưu giữ nguyên. Sidebar desktop có "Tôi". Command palette quick actions có "Tôi" nếu đang lấy từ nav-items.

## Trang /toi (src/pages/toi.astro, app-layout, large title "Tôi")
Bố cục Studio: eyebrow mono, các section `.sec-h` + `.rows` hairline; desktop 2 cột (trái: Tài khoản + Tiến độ; phải: Giao diện + Dữ liệu) hoặc theo grid hiện có.
1. **Tài khoản & đồng bộ** — `<section id="tai-khoan">` rỗng + comment: phase 4 plan sync mount `account-sync-panel` vào đây. Không render gì khi chưa có.
2. **Giao diện**
   - Theme: segmented "Sáng / Tối / Theo hệ thống" (mặc định: Theo hệ thống).
   - Cỡ chữ khi đọc: segmented "Nhỏ / Vừa / Lớn" (mặc định Vừa) + dòng xem trước; áp vào `.prose` (biến cỡ chữ đọc, giữ line-height tỉ lệ).
   - Giảm chuyển động: "Theo hệ thống / Luôn bật".
3. **Tiến độ học** — tái dùng dữ liệu có sẵn (learning-stats / domain-progress): số bài xong / tổng, phút đã đọc ước tính, tiến độ từng lĩnh vực (thanh + %), link "Học tiếp".
4. **Dữ liệu & ứng dụng**
   - Trạng thái lưu trữ: bền / riêng tư (store.isPersistent), giải thích ngắn.
   - Cài lên màn hình chính: hướng dẫn iOS (Chia sẻ → Thêm vào MH chính); ẩn nếu đang standalone.
   - Giới thiệu & bản quyền → /gioi-thieu; miễn trừ tài chính (1 dòng).
   - Phiên bản: lấy từ package.json lúc build.

## Cài đặt (prefs)
- `src/lib/user-prefs.ts` (thuần, test được): key localStorage `omnilab:prefs` = `{ v:1, theme:'system'|'light'|'dark', textSize:'s'|'m'|'l', motion:'system'|'reduce' }`; parse an toàn (JSON hỏng/giá trị lạ → mặc định), write, subscribe (storage event đa tab).
- Áp trước khi vẽ (không nháy màu): file tĩnh `public/prefs-init.js` (script thường, KHÔNG inline — CSP `script-src 'self'`), nạp đồng bộ trong `<head>` của `base-head.astro` trước CSS; set `<html data-theme="light|dark" data-text-size data-motion>`; khi theme=system thì tính từ matchMedia và theo dõi thay đổi. Sau soft navigation (ClientRouter) giữ thuộc tính trên <html> (ClientRouter thay <html> attrs → re-apply ở `astro:after-swap`).
- CSS: chuyển toàn bộ `@media (prefers-color-scheme: dark)` sang `:root[data-theme="dark"]` (tokens.css + 7 file khác: command-palette, search-box, sidebar-nav, domain-accent.ts, base.css, prose.css, base-head theme-color). Shiki dark vars theo `[data-theme=dark]`. `theme-color` meta cập nhật theo theme chọn.
- Reduced motion: mọi `@media (prefers-reduced-motion: reduce)` thêm điều kiện `[data-motion="reduce"]`; JS dùng helper chung `prefersReducedMotion()` (đọc cả data-motion lẫn matchMedia) — thay các chỗ gọi matchMedia trực tiếp (dock-autohide-binding, complete-check-motion, toc-scrollspy, view-transitions…).
- Không có JS: mặc định theme sáng (chấp nhận được — app vốn cần JS; prefs-init là script chạy đầu tiên).

## Acceptance
- 5 tab hiển thị đúng 320/390/430/1024/1440, light & dark; tab "Tôi" active trên /toi.
- Đổi theme/cỡ chữ/chuyển động áp ngay, lưu, giữ qua reload + soft nav + tab khác; không nháy màu khi tải (kiểm bằng reload với theme ngược hệ thống).
- token-contrast test vẫn xanh (đọc token theo selector mới, không hạ ngưỡng).
- Không đổi route cũ, data-* hooks, schema progress; CSP không có inline script.
- pnpm test / check / build xanh; test mới cho user-prefs + nav-items.
