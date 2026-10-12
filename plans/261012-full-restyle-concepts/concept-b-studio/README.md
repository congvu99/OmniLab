# Concept B — "Studio"

Mở `index.html` bằng double-click (file://). Không gọi mạng. Tham số tiện cho review: `?theme=light`, `?motion=reduce|full`, `?screen=reader|search|saved|domain|domains`, `?dk=reader|cmdk`.

## Rationale
- **Mood**: bàn làm việc yên tĩnh cho người tự học — graphite gần đen (#0B0C0E), một màu điện "Volt" (#D4FF3A tối / #C8F031 nền nút sáng, chữ #4A6B00), viền 1px + highlight trong (inset), grain noise (SVG data-URI), lưới 24px kiểu bản vẽ kỹ thuật.
- **3 từ khoá**: Chính xác · Tập trung · Nhanh nhạy. Tham chiếu: Linear, Arc, Things 3, Raycast.
- **Vì sao hợp OmniLab**: 64 bài dài, nhiều thuật ngữ → cần khung chắc (số mono tabular "BÀI 01 / 27", hairline); đọc đêm là chủ yếu → dark là theme chủ đạo; "Học tiếp" là thẻ + nút volt duy nhất; desktop keyboard-first (⌘K, phím tắt hiện cạnh nút).
- **Khác bản iOS cũ**: không còn nền xám phẳng/card trắng; dock nổi màu mực ở cả 2 theme với chỉ báo volt trượt; push transition có chiều sâu (trang mới +40px/fade, trang cũ lùi 0.97) thay vì trượt ngang iOS; chế độ tập trung khi đọc (ẩn dock, vạch tiến độ volt dưới thanh bài); artwork lĩnh vực vẽ bằng nét (mạng node / đường tăng trưởng / chữ T).
- **Domain hues** (tối/sáng, tất cả ≥ 4.5:1 trên nền): Kiến trúc #9B9BFF/#4B45D1 · Tài chính #4FD8B4/#0B7259 · Nghề #FFA766/#A4440C. Contrast các token chữ tính trực tiếp trong trang (text-3 tối 5.28/4.84, sáng 5.26/5.78; volt-ink sáng 5.62).
- **Motion**: 120–200ms, ease-out `cubic-bezier(.2,.8,.2,1)`, stagger 30ms, glide indicator (dock, sidebar, tabs, ⌘K highlight, TOC scrollspy), progress fill, check draw (ring → disc snap → tick stroke-dashoffset + tia sáng). Reduced motion: mọi dịch chuyển → crossfade 120ms, check hiện ngay; tôn trọng `prefers-reduced-motion` + công tắc xem trước.

## Font & icon licensing
- **Be Vietnam Pro** (UI/display, 400–800) — SIL OFL 1.1, đã có trong repo qua `@fontsource/be-vietnam-pro`.
- **JetBrains Mono** (số liệu, nhãn, phím tắt, 400/500) — SIL OFL 1.1, lấy từ `@fontsource/jetbrains-mono` 5.3.0; hỗ trợ đủ tiếng Việt.
- Chỉ subset latin + vietnamese, tách bằng `unicode-range`; `assets/` ~264KB (14 woff2) + `OFL-*.txt`.
- **Icon**: 25 icon vẽ riêng (24px grid, stroke 1.5, round cap/join, vùng an toàn 2px), inline SVG sprite `<symbol>` — không phụ thuộc thư viện, không vướng license bên thứ ba.

## Implementation cost / risks nếu chọn
- **Cost ước tính**: ~3–4 ngày. Tokens (tokens.css viết lại 2 theme), thêm font JetBrains Mono (`npm i @fontsource/jetbrains-mono`, chỉ import 2 weight), thay `@lucide/astro` bằng 1 component `<Icon name>` dùng sprite, restyle ~30 component Astro hiện có (cấu trúc giữ nguyên, chủ yếu CSS), thêm palette ⌘K (island nhỏ, tái dùng dữ liệu search hiện có), TOC scrollspy đã có (`src/lib/toc-scrollspy.ts`).
- **Rủi ro**:
  - Volt trên nền sáng có contrast thấp nếu dùng làm chữ → bắt buộc tách token `--volt` (nền nút, chữ đen) và `--volt-ink` (chữ/link); cần lint/review để không dùng nhầm.
  - Dark là theme chủ đạo: cần quyết định mặc định (theo hệ thống hay ép dark) — ảnh hưởng manifest `theme_color` và splash iOS.
  - Ẩn dock khi đọc thay đổi điều hướng hiện tại (reader đang có tab bar?) → cần xác nhận hành vi.
  - `backdrop-filter` + grain overlay `mix-blend-mode` tốn GPU trên iPhone cũ → nên tắt grain trên mobile hoặc dùng PNG nhỏ tĩnh.
  - `color-mix()` cần Safari ≥16.2 (iOS 16.2+); thêm fallback nếu phải hỗ trợ cũ hơn.
  - Font thêm ~40KB (2 weight mono × vietnamese+latin) cho lần tải đầu.

## Files
- `index.html` (~140KB, HTML/CSS/vanilla JS một file; dữ liệu tiêu đề bài thật trích từ `src/content`)
- `assets/` woff2 + OFL licenses
- `shots/` desktop-1440-dark, desktop-1440-light-reader, mobile-390-dark-prototype, mobile-390-light-components

## Unresolved questions
- Mặc định dark cho mọi người dùng, hay theo hệ thống?
- Có chấp nhận ẩn tab bar trong trang đọc (focus mode) không?
- Phím tắt desktop (G H/L/T/S, J/K, B, ⇧D) chỉ là gợi ý trực quan trong prototype — có muốn triển khai thật không?
