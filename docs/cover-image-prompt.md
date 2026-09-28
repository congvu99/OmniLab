# Cover image prompt — ảnh bìa bài học

Spec sinh ảnh bìa 1200×675 cho mỗi bài học (không bắt buộc — bài chưa có
cover dùng fallback của Phase 4). Ảnh do **user tự tạo** (quyết định đã chốt
trong `plan.md`: "Ảnh bìa user tự tạo") — agent nội dung chỉ chuẩn bị prompt
mẫu + điền biến cho 6 bài thí điểm để user (hoặc công cụ tạo ảnh do user
chọn) dùng, không tự sinh file ảnh nhị phân.

## Master prompt (giữ style nhất quán giữa mọi bài)

```
Soft flat editorial illustration, warm paper-white background, a single
clear visual metaphor for "{ẩn dụ đời sống}" representing the concept of
"{chủ đề}", minimalist geometric shapes, generous negative space, one
accent color {màu accent} used deliberately (20-30% of the composition) on
the main subject only, muted neutral secondary tones, soft diffused
lighting, no gradients that clash with flat style, no text, no logos, no
watermark, no photorealism, no 3D render, clean vector-art look suitable
for a mobile app lesson cover, 16:9 composition, centered or rule-of-thirds
subject placement with room at top for a title overlay added later.
```

### Biến

| Biến | Nghĩa | Nguồn |
|---|---|---|
| `{chủ đề}` | Tên khái niệm chính của bài (tiếng Việt, ngắn) | `title` trong frontmatter, bỏ phần "(English term)" |
| `{ẩn dụ đời sống}` | Ẩn dụ chính dùng trong `<RealLife>` đầu tiên của bài (nhất quán ảnh ↔ nội dung) | Khối `<RealLife>` đầu tiên trong bài |
| `{màu accent}` | Mã màu accent của domain, dùng đúng giá trị **light** (không phải dark variant) | `src/content/domains/<domain>.yaml` → `accent` (kien-truc `#4F46E5`, tai-chinh `#1F7A5A`) — đây là màu đưa vào prompt cho công cụ sinh ảnh bên ngoài, KHÔNG phải giá trị chèn vào code (không liên quan tới quy tắc "không hex trong SVG" ở illustration-style-guide.md — đó là quy tắc riêng cho SVG code, ảnh bìa là ảnh bitmap tạo bên ngoài repo) |

## Output spec

- Kích thước: **1200×675px** (tỉ lệ 16:9).
- Định dạng: `.jpg` hoặc `.png` (build tự sinh WebP qua `astro:assets`, xem
  `src/content.config.ts` `cover: image().optional()`).
- Đặt tại: `src/content/lessons/<domain>/<module>/covers/<slug>.jpg` (hoặc
  `.png`) — thư mục `covers/` nằm cạnh file `.mdx` của bài, tạo mới nếu
  module đó chưa có bài nào có cover.
- Khai báo trong frontmatter bài học:

  ```yaml
  cover: ./covers/<slug>.jpg
  ```

  (path tương đối, Astro content collections resolve tự động qua
  `image()` schema helper — không cần `import` thủ công như ảnh trong MDX
  body.)
- Chưa có ảnh → không set `cover:` → Phase 4's fallback cover hiển thị (theo
  domain accent), không phải lỗi.

## 6 prompt mẫu đã điền (bài thí điểm Phase 6 batch 0)

### Kiến trúc — Bộ nhớ đệm (Cache)

```
Soft flat editorial illustration, warm paper-white background, a single
clear visual metaphor for "một chiếc tủ lạnh ở nhà bếp, cửa hé mở với vài
món đồ bên trong" representing the concept of "Bộ nhớ đệm (Cache)",
minimalist geometric shapes, generous negative space, one accent color
#4F46E5 used deliberately (20-30% of the composition) on the main subject
only, muted neutral secondary tones, soft diffused lighting, no gradients
that clash with flat style, no text, no logos, no watermark, no
photorealism, no 3D render, clean vector-art look suitable for a mobile app
lesson cover, 16:9 composition, centered or rule-of-thirds subject placement
with room at top for a title overlay added later.
```

### Kiến trúc — Bộ cân bằng tải (Load Balancer)

```
... one accent color #4F46E5 ... a single clear visual metaphor for "một
nhân viên ngân hàng xếp khách đang xếp hàng vào các quầy giao dịch còn
trống" representing the concept of "Bộ cân bằng tải (Load Balancer)" ...
[phần còn lại giống master prompt ở trên]
```

### Kiến trúc — Định lý CAP (CAP Theorem)

```
... one accent color #4F46E5 ... a single clear visual metaphor for "hai
tổng đài điện thoại ngân hàng với đường dây giữa chúng bị đứt" representing
the concept of "Định lý CAP (CAP Theorem)" ... [phần còn lại giống master
prompt ở trên]
```

### Tài chính — Tuần 3 · Lãi kép, lạm phát & bộ đệm nhỏ

```
... one accent color #1F7A5A ... a single clear visual metaphor for "một
cây nhỏ mọc từ hạt, tán lá dần lớn theo từng vòng năm" representing the
concept of "Lãi kép và lạm phát" ... [phần còn lại giống master prompt ở
trên]
```

### Tài chính — Tuần 4 · Chi phí vay & kế hoạch trả nợ

```
... one accent color #1F7A5A ... a single clear visual metaphor for "một
chồng hoá đơn giảm dần chiều cao từ trái sang phải" representing the
concept of "Chi phí vay và kế hoạch trả nợ" ... [phần còn lại giống master
prompt ở trên]
```

### Tài chính — Tuần 5 · Quỹ dự phòng & bảo hiểm

```
... one accent color #1F7A5A ... a single clear visual metaphor for "một
chiếc bình/heo đất đang được rót đầy dần, có vạch mức an toàn" representing
the concept of "Quỹ dự phòng và bảo hiểm" ... [phần còn lại giống master
prompt ở trên]
```

## Ghi chú cho batch sau

- Điền `{ẩn dụ đời sống}` bằng đúng ẩn dụ dùng trong `<RealLife>` **đầu
  tiên** của bài (không bịa ẩn dụ mới riêng cho ảnh bìa) — giữ nhất quán
  giữa ảnh và nội dung đọc.
- Domain mới (nếu có) lấy `{màu accent}` từ file YAML domain đó, không tự
  đặt màu.
- Đây là **prompt gợi ý** cho một công cụ sinh ảnh AI bất kỳ mà user chọn —
  không có công cụ cụ thể nào được cài/gọi từ trong repo này.
