# Illustration style guide — inline SVG for `<Figure added>`

Quy tắc vẽ SVG mới cho lesson content (Phase 6 trở đi). Đọc kèm
[`docs/content-authoring-guide.md`](./content-authoring-guide.md) (cách chèn
vào MDX, đặt tên file, checklist). Mục tiêu: mỗi SVG **giải thích một cơ chế**
(luồng dữ liệu, so sánh trước/sau, so sánh hai chiến lược) — không phải hình
trang trí. 6 bài thí điểm (Phase 6 batch 0,
`src/assets/illustrations/{kien-truc,tai-chinh}/*.svg`) là ví dụ tham chiếu.

## Kích thước & bố cục

- `viewBox="0 0 360 220"` (mặc định) hoặc `"0 0 360 300"` khi cần cao hơn
  (ví dụ so sánh 2 hàng xếp chồng). Không dùng kích thước khác — 360 là bề
  rộng nội dung `.prose` thu nhỏ nhất trên mobile, giữ cố định để mọi SVG
  scale nhất quán.
- `width="100%"` trên thẻ `<svg>`, không set `height` cố định (tỉ lệ giữ qua
  `viewBox`, container `.figure__svg` trong `figure.astro` lo phần còn lại).
- Mobile-first: thiết kế sao cho đọc được ở 360px width thật (không chỉ ở màn
  hình lớn rồi thu nhỏ) — chữ nhỏ nhất 11-12px, không đặt 2 nhãn chồng nhau
  theo chiều ngang trong khoảng < 60px.

## Nét vẽ

- `stroke-width="2"` cho đường/khung chính; có thể `2.5` để nhấn 1 phần tử
  quan trọng nhất trong hình (không lạm dụng — tối đa 1 phần tử/hình).
- `stroke-linecap="round"` và `stroke-linejoin="round"` trên mọi path/line có
  stroke đáng kể.
- Bo góc hình chữ nhật: `rx="10"` (khối chính) hoặc `rx="6"`–`rx="8"` (khối
  phụ/nhỏ, badge).

## Màu — CHỈ qua CSS custom property hoặc `currentColor`

**Không bao giờ** viết mã hex (`#...`) hay tên màu CSS cố định (`red`,
`royalblue`...) trong SVG. Mọi màu phải là:

| Vai trò | Giá trị |
|---|---|
| Luồng chính / phần tử được nhấn mạnh | `var(--accent)` |
| Phần tử phụ / trung tính / đường viền thường | `var(--ink-2)` |
| Nền khối được tô (accent) | `color-mix(in srgb, var(--accent) 12%, transparent)` (dùng đúng 12% để nhất quán giữa các hình; có thể tăng nhẹ 14% khi cần khối rất nhỏ vẫn đọc được viền, nhưng ưu tiên 12%) |
| Nền khối trung tính | `var(--surface-2)` |
| Chữ | `var(--ink)` (nhãn chính) hoặc `var(--ink-2)` (chú thích phụ) |
| Cảnh báo/lỗi (vd node "hỏng", "hết hạn") | `var(--danger)` — vẫn là token, không phải hex |

Vì sao được phép dùng `fill="var(--accent)"` trực tiếp làm presentation
attribute (không cần `<style>`/`style=""`): khi SVG được nhúng inline vào
DOM (tức là qua `svg={...}` + `set:html` trong `figure.astro`, KHÔNG phải
`<img src="*.svg">`), trình duyệt resolve `var()` trong presentation
attribute giống hệt như trong một khai báo CSS thật — đây là hành vi đã được
xác nhận hoạt động trên trình duyệt hiện đại (WHATWG/CSSWG đang làm rõ thêm
trong spec 2025, nhưng hành vi thực tế đã ổn định). Xem
"Inline via `?raw`, not `<img>`" bên dưới và comment trong `figure.astro`.

## Chữ

- `font-family="'Be Vietnam Pro', system-ui, sans-serif"` trên mọi `<text>`
  (SVG không đọc được CSS custom property `--font-ui` qua presentation
  attribute cho `font-family` một cách đáng tin cậy trên mọi trình duyệt —
  ghi trực tiếp tên font, khớp với font đã self-host qua `@fontsource`).
- Cỡ chữ 13–15px (`font-size="13"`–`"15"`), tiêu đề nhỏ trong hình có thể
  `font-weight="700"`.
- **Chữ tiếng Việt phải đúng dấu** — không được bỏ dấu để "cho gọn". Đây là
  nội dung hiển thị, không phải id/class.
- Tối đa **~6–8 nhãn chữ mỗi hình**. Vượt quá nghĩa là hình đang cố nhồi quá
  nhiều ý — tách thành 2 SVG thay vì 1 SVG rối.
- Luôn dùng `<text>` thật (để chọn/copy/đọc bằng screen reader được), không
  bao giờ vẽ chữ bằng path/font-outline.

## Accessibility (bắt buộc trên mọi file)

```xml
<svg viewBox="0 0 360 220" width="100%" role="img"
     aria-labelledby="svg-<ten-duy-nhat>-title"
     xmlns="http://www.w3.org/2000/svg">
  <title id="svg-<ten-duy-nhat>-title">Mô tả ngắn gọn cơ chế hình vẽ</title>
  ...
</svg>
```

- `role="img"` + `aria-labelledby` trỏ đúng `id` của `<title>` — bắt buộc,
  đây là accessible name duy nhất của hình (không có `alt` nào khác áp dụng
  vì hình được nhúng qua `set:html`, không phải `<img>`).
- `id` của `<title>` và mọi `id` khác (marker, v.v.) **phải duy nhất trong
  toàn bộ site**, không chỉ trong 1 file — vì nhiều `<Figure>` có thể xuất
  hiện trên cùng 1 trang (nhiều SVG/bài) và `id` trùng sẽ khiến
  `aria-labelledby`/`href="#..."` trỏ nhầm hình. Quy ước: prefix bằng
  `svg-<tên-file-không-domain>` (ví dụ file
  `kien-truc/chu-de-cache-cache-hit-miss.svg` → prefix `svg-chm-` cho
  marker, `svg-cache-hit-miss-title` cho title).
- Không dùng `aria-hidden="true"` trên `<svg>` gốc (hình mang thông tin, không
  phải trang trí).

## Dark mode

Không cần code riêng cho dark — mọi màu đã là `var(--accent)`/`var(--ink)`/...
nên tự đổi theo `@media (prefers-color-scheme: dark)` trong
`src/styles/tokens.css` (Phase 2). Việc của bạn: **không** hard-code màu nào
khác, và tự kiểm tra bằng mắt cả 2 theme trước khi coi hình là xong (dev
server + đổi theme hệ điều hành, hoặc DevTools "Emulate CSS
prefers-color-scheme").

## Animation (tuỳ chọn, hiếm khi cần)

Chỉ 1 luồng "chạy" nhẹ trong toàn hình, dùng CSS animation trong 1 khối
`<style>` bên trong chính file SVG, class riêng cho path đó (tên class phải
unique theo file — prefix giống quy ước id ở trên):

```xml
<style>
  @media (prefers-reduced-motion: no-preference) {
    .svg-chm-flow { stroke-dasharray: 6 6; animation: svg-chm-dash 1.6s linear infinite; }
  }
  @keyframes svg-chm-dash { to { stroke-dashoffset: -24; } }
</style>
```

- **Bắt buộc** bọc trong `@media (prefers-reduced-motion: no-preference)` —
  animation phải tắt hẳn (không chạy chậm hơn, tắt hẳn) khi user bật "giảm
  chuyển động".
- `<style>` bên trong `<svg>` được phép về CSP: `Caddyfile`'s
  `style-src 'self' 'unsafe-inline'` đã cho phép cả `<style>` tag lẫn
  `style=""` attribute (lý do gốc là Shiki syntax highlight, nhưng chính
  sách áp dụng cho toàn trang). Không dùng `<script>`/SMIL điều khiển bằng
  JS trong SVG — `script-src 'self'` sẽ chặn bất kỳ script nào không phải
  file `.js` nội bộ.
- Không bắt buộc — phần lớn SVG trong 6 bài thí điểm KHÔNG có animation; chỉ
  thêm khi nó thực sự làm rõ hướng luồng dữ liệu (vd cache hit path).

## Inline via `?raw`, not `<img>`

```mdx
import cacheHitMiss from '../../../../assets/illustrations/kien-truc/chu-de-cache-cache-hit-miss.svg?raw';
```

```mdx
<Figure added svg={cacheHitMiss} alt="..." caption="..." />
```

`?raw` là cú pháp import đặc biệt của Vite (Astro build trên Vite) — trả về
**toàn bộ nội dung file dưới dạng string**, thay vì URL tới file. Đã xác
nhận hoạt động trong MDX frontmatter-import của Astro 7 + `@astrojs/mdx@8`
(build thật trong repo này, xem phase-06 batch 0 report) — không cần cấu
hình gì thêm trong `astro.config.mjs`. Đây là lựa chọn duy nhất phù hợp: nó
vừa giữ SVG **inline trong HTML** (bắt buộc để `var(--accent)` resolve, xem
"Màu" ở trên) vừa để Astro fingerprint/tree-shake được vì nó vẫn đi qua Vite
module graph như mọi import khác (không phải raw string dán tay).

**Không dùng** `<img src="*.svg">` hay `astro:assets`' `<Image>` cho các SVG
loại "diagram cần đổi màu theo theme" này — cả hai đều tải SVG như resource
tách biệt, `var()` bên trong không bao giờ resolve. `<Figure src={...}>` với
`astro:assets` vẫn đúng và giữ nguyên cho **ảnh bitmap gốc** (44 ảnh PNG/JPG
legacy) — không đổi gì ở đó.

## Checklist trước khi coi 1 SVG là xong

- [ ] `viewBox="0 0 360 220"` hoặc `"0 0 360 300"`, `width="100%"`.
- [ ] `role="img"` + `aria-labelledby` trỏ đúng `<title id="...">` duy nhất
      site-wide.
- [ ] Không có ký tự `#` nào theo sau bởi mã màu (grep nhanh:
      `grep -n '#[0-9a-fA-F]\{3,8\}' file.svg` phải rỗng — `#` trong
      `id="svg-..."` không tính vì đó không phải giá trị màu, nhưng để chắc
      chắn, tránh dùng `#` cho bất cứ mục đích nào khác ngoài `id`/`href`
      fragment).
- [ ] Mọi `fill`/`stroke` là `var(--...)`, `color-mix(in srgb, var(--...) ...)`,
      hoặc `currentColor` — không có tên màu CSS cố định.
- [ ] `stroke-width="2"` (hoặc `2.5` cho đúng 1 điểm nhấn), round cap/join.
- [ ] Chữ là `<text>` thật, tiếng Việt đủ dấu, ≤ ~8 nhãn.
- [ ] File `< 15KB` (`wc -c file.svg` hoặc `ls -la`).
- [ ] Đặt đúng tên/đường dẫn theo quy ước trong
      `content-authoring-guide.md` ("Đặt tên file").
- [ ] Nhìn thử cả light + dark (đổi `prefers-color-scheme` trong DevTools).
- [ ] Nếu có animation: bọc `@media (prefers-reduced-motion: no-preference)`.
