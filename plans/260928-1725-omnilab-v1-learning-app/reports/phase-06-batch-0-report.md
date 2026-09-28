---
phase: 6
batch: 0
title: "Phase 6 batch 0 report: pilot content — style guides, components, 6 pilot lessons"
date: 2026-09-28
status: completed
---

# Phase 6 batch 0 report: pilot content

## Files created

- `docs/content-authoring-guide.md` — RealLife writing rules (1 ví dụ = 1 so
  sánh, ≤90 từ, kết bằng "→ ...", bối cảnh VN, giới hạn ẩn dụ khi cần, quy
  tắc riêng Tài chính: không số liệu thời sự trừ khi ghi "số giả định",
  không gợi ý sản phẩm/nhà cung cấp), quy trình chèn `<Figure added svg=...>`
  + lý do dùng `?raw` thay vì `astro:assets`, quy ước đặt tên file SVG,
  checklist cho các batch sau.
- `docs/illustration-style-guide.md` — spec đầy đủ: viewBox 360×220/360×300,
  stroke-width 2 round cap/join, màu chỉ qua `var(--...)`/`color-mix(...)`/
  `currentColor` (không hex), chữ Be Vietnam Pro 13-15px thật `<text>`, ≤6-8
  nhãn, accessibility (`role="img"` + `aria-labelledby` + `<title>` id duy
  nhất site-wide), dark mode (tự động qua token, không cần code riêng),
  animation tuỳ chọn (`@media (prefers-reduced-motion: no-preference)`,
  CSP OK vì `style-src` đã có `unsafe-inline`), giải thích kỹ thuật đầy đủ vì
  sao `?raw` + inline SVG, không phải `<img src=svg>`.
- `docs/cover-image-prompt.md` — 1 master prompt (flat editorial, warm paper
  bg, 1 accent màu domain, không chữ/logo, 16:9), bảng biến
  `{chủ đề}/{ẩn dụ đời sống}/{màu accent}`, output spec 1200×675,
  `src/content/lessons/<domain>/<module>/covers/<slug>.jpg|png` +
  `cover: ./covers/<slug>.png` trong frontmatter, 6 prompt đã điền cho đúng
  6 bài thí điểm.
- `src/assets/illustrations/{kien-truc,tai-chinh}/*.svg` — 13 file, xem bảng
  dưới.

## Files modified

- `src/components/lesson/real-life.astro` — thêm icon Lucide `lightbulb`
  (import `@lucide/astro/icons/lightbulb`, dependency có sẵn, không thêm
  mới) inline trong markup component (đúng yêu cầu "Lucide-like icon drawn
  as inline SVG", dùng thẳng Lucide thật thay vì tự vẽ lại để nhất quán với
  phần còn lại của app); thêm badge "Nháp" — CSS thuần
  `:global([data-examples-reviewed='false']) .real-life .real-life__badge`,
  không JS, không prop mới (backward-compatible 100%, `title?` prop không
  đổi). Đã build-verify: `data-examples-reviewed="false"` do layout Phase 4
  set trên `<article>` thật, badge hiện đúng trong output build thật (xem
  "Verify" bên dưới) — không phải giả định suông.
- `src/components/lesson/figure.astro` — thêm prop mới `svg?: string`
  (backward-compatible: mọi `<Figure src={...}>` cũ không đổi hành vi).
  Nhánh mới render `<div class="figure__svg" set:html={svg} />` khi có
  `svg`. Thêm style `.figure__svg` (padding + nền `var(--surface-2)` thay vì
  border sát ảnh như bitmap, vì diagram có chữ cần khoảng thở) +
  `.figure__svg :global(svg) { border: none }` để không bị border đúp từ
  rule `.figure :global(svg)` chung.

## 13 SVG — kích thước & mô tả

| File | Bytes | Cơ chế minh hoạ |
|---|---|---|
| `kien-truc/chu-de-cache-cache-hit-miss.svg` | 2996 | Luồng cache hit (trả ngay) vs miss (đi DB, nạp lại cache); 1 path có animation dash (reduced-motion-safe) |
| `kien-truc/chu-de-cache-cache-aside-vs-write-through.svg` | 4321 | So sánh 2 hàng: cache-aside (app tự đọc/ghi cả 2) vs write-through (app chỉ nói chuyện cache) |
| `kien-truc/chu-de-cache-ttl-eviction.svg` | 4158 | Timeline TTL hết hạn + sơ đồ 4 slot LRU eviction khi đầy |
| `kien-truc/chu-de-load-balancer-health-check.svg` | 2986 | LB định tuyến tới 2 server khỏe, loại 1 server "tạm nghỉ" (X mark + dashed) |
| `kien-truc/chu-de-load-balancer-layer4-vs-layer7.svg` | 3895 | 2 hàng: tầng 4 (chuyển cả kết nối tới 1 server) vs tầng 7 (đọc URL, định tuyến /api và /img riêng) |
| `kien-truc/danh-doi-cap-theorem-partition-choice.svg` | 3194 | Node A/B nối bình thường → phân mảnh (zigzag) → rẽ nhánh CP/AP |
| `kien-truc/danh-doi-cap-theorem-cp-vs-ap-vi-du.svg` | 2115 | 2 cột ví dụ: chọn CP (chuyển khoản, vé giới hạn) vs AP (like, giỏ hàng) |
| `tai-chinh/lo-trinh-12-tuan-tuan-03-lai-kep.svg` | 1577 | Đường lãi đơn (thẳng) vs lãi kép (cong dốc dần) theo 0/10/20 năm |
| `tai-chinh/lo-trinh-12-tuan-tuan-03-lam-phat-suc-mua.svg` | 2439 | 2 hàng 5 ô hàng hoá: hôm nay đủ 5, 5 năm sau (lạm phát) chỉ còn 4 (ô cuối gạch chéo) |
| `tai-chinh/lo-trinh-12-tuan-tuan-04-du-no-giam-dan.svg` | 2392 | 4 cột giảm dần (dư nợ từng kỳ), chú thích lãi giảm theo dư nợ |
| `tai-chinh/lo-trinh-12-tuan-tuan-04-thu-tu-tra-no.svg` | 1676 | 3 thanh ngang theo lãi suất (40/18/9%), thanh cao nhất đánh dấu "① trả trước" |
| `tai-chinh/lo-trinh-12-tuan-tuan-05-quy-du-phong.svg` | 1565 | "Bình" quỹ dự phòng, mức hiện có (~2 tháng) vs vạch tối thiểu 3 tháng vs mục tiêu 6 tháng |
| `tai-chinh/lo-trinh-12-tuan-tuan-05-thoi-gian-cho-bao-hiem.svg` | 1877 | Timeline: ngày 0 ký HĐ → ngày 21 hết cân nhắc → thời gian chờ quyền lợi |

Tất cả < 15KB (lớn nhất 4.3KB, ~29% ngân sách). Tất cả pass check tự viết:
0 mã hex (`grep -rn '#[0-9a-fA-F]\{3,8\}'` toàn thư mục → rỗng), balanced-tag
well-formedness (script tay, không có XML lib trong deps), title id duy
nhất site-wide (13/13 unique, marker id cũng không trùng file nào).

## RealLife blocks per lesson

**`kien-truc/chu-de/07-cache`** (5 khối — bài mẫu, tự review kỹ nhất):
1. "Tủ lạnh ở nhà" (hit/miss) — sau đoạn intro, kèm Figure cache-hit-miss.
2. "Tủ lạnh chật chỗ (LRU)" — sau đoạn "Cache ở tầng ứng dụng" (mục LRU/hot-cold), kèm Figure ttl-eviction.
3. "Hạn sử dụng trên hộp sữa" (TTL) — trong nhược điểm cache-aside.
4. "Quán phở ghi order" (cache-aside vs write-through) — sau đoạn Write-through, kèm Figure cache-aside-vs-write-through.
5. "Thực đơn treo tường" (cache invalidation khó) — cuối mục nhược điểm cache.

**`kien-truc/chu-de/03-load-balancer`** (5 khối):
1. "Nhân viên xếp hàng ở ngân hàng" (khái niệm LB chung).
2. "Quầy treo biển tạm nghỉ" (health check) — kèm Figure health-check.
3. "Bảo vệ nhìn biển số vs lễ tân đọc thư" (L4 vs L7) — kèm Figure layer4-vs-layer7.
4. "Thuê thêm người thay vì ép một người làm gấp đôi" (scale out vs up).
5. "Một cổng bảo vệ duy nhất" (LB tự thành SPOF).

**`kien-truc/danh-doi/03-cap-theorem`** (4 khối, có câu giới hạn ẩn dụ theo yêu cầu phase file):
1. "Hai tổng đài ngân hàng mất kết nối" — kèm Figure partition-choice + **câu giới hạn rõ ràng**: "đây không phải chọn trước tuỳ ý — nó chỉ xảy ra khi dây đứt; lúc bình thường cả hai vẫn vừa nhất quán vừa sẵn sàng".
2. "Rút tiền ở ATM khi mất kết nối" (ví dụ CP).
3. "Lượt thích vẫn hiển thị dù mạng chập chờn" (ví dụ AP) — kèm Figure cp-vs-ap-vi-du ngay sau.
4. "Một hệ thống, nhiều lựa chọn khác nhau" (CP/AP theo từng chức năng, không phải toàn hệ thống).

**`tai-chinh/lo-trinh-12-tuan/03-tuan-03`** (3 khối):
1. "Cây trồng từ hạt" (lãi kép) — kèm Figure lai-kep.
2. "Giỏ hàng vơi dần dù cùng số tiền" (lạm phát) — kèm Figure lam-phat.
3. "Bình xăng dự trữ trong cốp xe" (bộ đệm nhỏ).

**`tai-chinh/lo-trinh-12-tuan/04-tuan-04`** (3 khối):
1. "Dư nợ giảm dần" — kèm Figure du-no-giam-dan.
2. "Ưu tiên trả khoản lãi cao nhất trước" — kèm Figure thu-tu-tra-no.
3. "Hết ưu đãi, lãi suất thả nổi".

**`tai-chinh/lo-trinh-12-tuan/05-tuan-05`** (3 khối):
1. "Bảo hiểm và dự phòng giải quyết rủi ro khác nhau".
2. "Bình chứa nước dự trữ" (quỹ dự phòng 3-6 tháng) — kèm Figure quy-du-phong.
3. "21 ngày cân nhắc" (bảo hiểm nhân thọ) — kèm Figure thoi-gian-cho-bao-hiem.

Tổng: 23 `<RealLife>`, 13 `<Figure added svg=...>` trên 6 bài — đúng dải
3-5 RealLife/bài và 1-3 SVG/bài yêu cầu. Không bài Tài chính nào có số liệu
thời sự/gợi ý sản phẩm cụ thể — tất cả ví dụ dùng danh từ chung ("một ngân
hàng", "một hợp đồng bảo hiểm"). `examplesReviewed` **vẫn `false`** ở cả 6
file — không tự đổi, đúng quy trình uỷ quyền fact-check.

## Quyết định về Figure/`?raw`

Thêm prop `svg?: string` vào `Figure` (không đổi API cũ). Lý do bắt buộc
(không chỉ để tiện): style guide yêu cầu `fill="var(--accent)"` — `var()`
trong presentation attribute chỉ resolve khi SVG nằm inline thật trong DOM
đang hiển thị (đã research + xác nhận qua build thật, xem dưới), không
resolve nếu SVG được tải như resource ngoài qua `<img src=*.svg>` hay
`astro:assets`' `<Image>`. `?raw` là cú pháp import gốc của Vite (Astro build
trên Vite) — đã **build thật thành công** trong `.mdx` frontmatter-import,
không cần sửa `astro.config.mjs` (ngoài quyền sở hữu, và không cần thiết).

Verify cụ thể trên `dist/hoc/kien-truc/chu-de/cache/index.html` (build thật,
không phải giả định):
- `role="img" aria-labelledby="svg-cache-hit-miss-title"` v.v. — 3/3 SVG có mặt, đúng id.
- `fill="var(--accent)"` xuất hiện nguyên văn trong output (không bị build tool resolve/inline thành hex).
- `data-examples-reviewed="false"` có thật trên ancestor (Phase 4 đã wire) → badge "Nháp" render đúng trong HTML.
- Không có mã hex nào bên trong bất kỳ khối `.figure__svg` nào (script tay kiểm tra theo từng block).

## Tests

- `pnpm verify:fidelity`: **OK — 27 kien-truc + 23 tai-chinh** khớp snapshot
  gốc (bao gồm 6 bài đã sửa). Số 27 kien-truc (không phải 28 như phase-03
  report) là trạng thái hiện tại của repo lúc tôi làm việc (thiếu file
  `nen-tang/00-gioi-thieu`) — **không phải do tôi xoá**, tôi không đụng file
  nào ngoài 6 bài được giao; khả năng cao thuộc phạm vi Phase 4 đang chạy
  song song. Không chặn kết quả của tôi (verify vẫn pass cho phần tôi sửa).
- `pnpm test` (vitest): **121/121 pass** (không đổi file test nào, không
  cần thêm case — logic fidelity cho `<RealLife>`/`<Figure added>` đã có
  sẵn 8 case từ Phase 3, đủ cover các pattern tôi dùng).
- `pnpm check` (astro check): **0 errors, 0 warnings, 0 hints**, 53 file.
- `pnpm build`: **pass, 58 trang**, chạy 2 lần độc lập (dist bị agent Phase 4
  ghi đè giữa 2 lần verify của tôi — môi trường chia sẻ, không phải lỗi) —
  cả 2 lần đều pass sạch. `use astro:head-inject` warnings trong log build
  là của các file `.mdx` khác (tuần-01, tuần-08, communication, security...)
  không thuộc 6 bài tôi sửa — không điều tra thêm (ngoài phạm vi).

## File ownership — xác nhận

`git status` giới hạn đúng danh sách được giao: chỉ 8 file tôi sửa/tạo theo
kế hoạch xuất hiện (`figure.astro`, `real-life.astro`, 6 `.mdx`, 3 doc mới,
13 SVG mới). Không đụng `scripts/lib/fidelity.mjs` (không cần — không có
bug thật), không đụng `tests/fidelity.test.mjs` (case có sẵn đã đủ), không
commit git. Thấy các file untracked khác của Phase 4
(`attribution-footer.astro`, `lesson-cover.astro`, `lesson-meta.astro`,
`lesson-toc.astro`, `next-lesson-card.astro`, `tests/content-order.test.mjs`)
— không đọc/sửa, đúng ranh giới sở hữu file.

## Điều batch sau cần biết

1. **Copy đúng quy trình trong `docs/content-authoring-guide.md`** — đặc
   biệt mục "Vì sao `svg={...}` qua `?raw`" và số `../../../../` (4 cấp cố
   định từ `src/content/lessons/<domain>/<module>/*.mdx` tới `src/assets/`).
2. **`examplesReviewed` giữ `false`** — batch nội dung không tự đổi, đó là
   việc của agent fact-check.
3. **Badge "Nháp" đã hoạt động thật** (xác nhận qua build) — không cần làm
   gì thêm ở `real-life.astro`, chỉ cần dùng `<RealLife>` bình thường.
4. **`Figure` giờ có 2 chế độ**: `src={ImageMetadata}` (ảnh bitmap gốc,
   không đổi) và `svg={rawString}` (SVG mới, `added` bắt buộc kèm theo).
   Đừng nhầm lẫn — dùng sai sẽ khiến `verify-fidelity` báo fail (thiếu
   `added` → bị so sánh như ảnh gốc) hoặc SVG không đổi màu theo theme
   (dùng `src=` thay vì `svg=` cho SVG).
5. **Naming SVG**: `src/assets/illustrations/<domain>/<module>-<slug>-<ten-hinh>.svg`
   — đã dùng nhất quán cho cả 13 file, có ví dụ thật để copy pattern.
6. `docs/cover-image-prompt.md` chỉ là **prompt gợi ý cho user** — không có
   tool sinh ảnh nào chạy tự động trong repo; batch sau không cần tự tạo
   file ảnh bìa nhị phân trừ khi user yêu cầu riêng.
7. Repo hiện có 27 (không phải 28) bài kien-truc — nếu batch sau thấy số
   khác với phase-03 report, đó là do Phase 4 đang tái cấu trúc
   `nen-tang/00-gioi-thieu`, không phải lỗi từ phía nội dung.

## Unresolved questions

- Không có — mọi quyết định kỹ thuật (Figure `svg` prop, `?raw` import,
  badge CSS, đặt tên file) đã tự quyết theo đúng spec phase-06 + đã verify
  bằng build thật, không cần user xác nhận thêm cho batch 0 này.

Status: DONE
Summary: 3 style-guide docs, `real-life.astro`+`figure.astro` (backward-compatible, +Lucide icon, +draft badge, +inline-SVG `svg` prop) done; 13 SVG (all <15KB, 0 hex, unique a11y ids) + 23 RealLife + 13 Figure added across 6 pilot lessons (cache/load-balancer/cap-theorem/tuan-03/04/05); verify-fidelity/test/check/build all pass on real repo build, confirmed live in built HTML (not just source).
Concerns/Blockers: none blocking. Repo's kien-truc lesson count (27 vs phase-03's 28) reflects Phase 4's concurrent in-flight work, not mine — flagging for controller awareness, not actionable by me.
