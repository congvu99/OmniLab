---
phase: 6
batch: b
title: "Phase 6 batch B report: RealLife + Figure illustrations for DNS/CDN/reverse-proxy/application-layer/asynchronism"
date: 2026-09-28
status: completed
---

# Phase 6 batch B report: content enrichment

## Files owned/modified

- `src/content/lessons/kien-truc/chu-de/01-dns.mdx`
- `src/content/lessons/kien-truc/chu-de/02-cdn.mdx`
- `src/content/lessons/kien-truc/chu-de/04-reverse-proxy.mdx`
- `src/content/lessons/kien-truc/chu-de/05-application-layer.mdx`
- `src/content/lessons/kien-truc/chu-de/08-asynchronism.mdx`
- 7 new SVG in `src/assets/illustrations/kien-truc/` (table below)

Only `<RealLife>`/`<Figure added .../>` blocks + `import ... ?raw` lines inserted.
No character of original text, frontmatter, or `source.snapshot` touched —
confirmed by `pnpm verify:fidelity` (OK, unchanged). No file outside this list
touched (`git status` shows only my 5 `.mdx` + 7 new `.svg`; other untracked
SVGs visible in status belong to parallel batches, not read/edited by me).

## RealLife + Figure per lesson

**`kien-truc/chu-de/01-dns`** (3 RealLife, 1 Figure):
1. "Danh bạ liên hệ trong điện thoại" — tên dễ nhớ (contact name) → DNS tra
   ra IP khó nhớ, sau đoạn intro.
2. "Hỏi thăm địa chỉ qua từng cấp" — hỏi bảo vệ → tổ trưởng → phường +
   "ghi sổ tay" tạm rồi lỗi thời, sau đoạn phân cấp/cache/TTL. Kèm Figure
   `chu-de-dns-tra-cuu-phan-cap.svg` (3845B) — hierarchical resolver→root→TLD→
   authoritative chain vs cache-hit shortcut curve.
3. "Trạm cấp nước chung của cả khu" — điểm phụ thuộc dùng chung, sau mục
   Nhược điểm (DDoS/quản lý tập trung).

**`kien-truc/chu-de/02-cdn`** (3 RealLife, 2 Figure):
1. "Kho hàng gần nhà thay vì chờ nhập từ nước ngoài" — proximity, sau đoạn
   intro. Kèm Figure `chu-de-cdn-may-chu-gan-nguoi-dung.svg` (3612B) —
   không-CDN (đường xa tới gốc) vs có-CDN (đường ngắn tới điểm gần).
2. "Cửa hàng nhượng quyền nhập sẵn hàng vs đặt khi có khách" — push vs pull,
   giữa 2 mục CDN kiểu đẩy/kéo. Kèm Figure `chu-de-cdn-push-vs-pull.svg`
   (3638B) — 2 hàng luồng: push (đẩy lên trước) vs pull (lấy khi có request
   đầu).
3. "Poster quảng cáo cũ vẫn dán khắp thành phố" — staleness/TTL, sau mục
   Nhược điểm.

**`kien-truc/chu-de/04-reverse-proxy`** (3 RealLife, 1 Figure):
1. "Lễ tân ở sảnh toà nhà văn phòng" — giấu cấu trúc nội bộ, sau đoạn intro.
   Kèm Figure `chu-de-reverse-proxy-an-may-chu-noi-bo.svg` (3679B) — 2
   client gộp qua 1 proxy tới 3 server ẩn.
2. "Bảo vệ kiểm tra giấy tờ ở cổng thay cho từng phòng" — SSL termination
   tập trung 1 chỗ, giữa list lợi ích.
3. "Một cửa an ninh duy nhất của chung cư" — SPOF, sau mục Nhược điểm.

**`kien-truc/chu-de/05-application-layer`** (3 RealLife, 1 Figure):
1. "Bếp và bộ phận phục vụ trong nhà hàng" — tách tầng web/ứng dụng để mở
   rộng độc lập, sau đoạn intro. Kèm Figure
   `chu-de-application-layer-tach-tang-web-ung-dung.svg` (2772B) — tầng web
   cố định, tầng ứng dụng co giãn (+1 box dashed).
2. "Mỗi quầy trong khu ẩm thực chỉ bán một món" — microservices/Pinterest,
   sau ví dụ Pinterest.
3. "Ứng dụng gọi xe biết tài xế nào đang online gần đó" — service discovery
   + health check, sau mục Khám phá dịch vụ.

**`kien-truc/chu-de/08-asynchronism`** (4 RealLife, 2 Figure):
1. "Phiếu gọi món ở quán ăn đông khách" — non-blocking request, sau đoạn
   intro. Kèm Figure `chu-de-asynchronism-dong-bo-vs-bat-dong-bo.svg`
   (4336B) — đồng bộ (chờ) vs bất đồng bộ (trả ngay, queue+worker nền).
2. "Đăng story thấy ngay, nhưng bạn bè nhận thông báo chậm hơn vài giây" —
   optimistic UI, tái diễn giải ví dụ tweet gốc bằng bối cảnh VN, sau đoạn
   message-queue workflow.
3. "Bãi giữ xe hết chỗ, treo biển tạm dừng nhận khách" — back pressure/503,
   sau đoạn Back pressure. Kèm Figure
   `chu-de-asynchronism-ap-luc-nguoc.svg` (3060B) — hàng đợi đầy tới giới
   hạn → 503 → client backoff.
4. "Gọi cấp cứu không thể xếp hàng chờ xử lý sau" — khi nào KHÔNG nên async,
   sau mục Nhược điểm.

Tổng: **16 `<RealLife>`, 7 `<Figure added svg=...>`** trên 5 bài — trong dải
2–5 RealLife/bài (bài ngắn 6–8 phút đọc, dùng 3–4) và 1–3 SVG/bài yêu cầu.

## Bối cảnh & tránh lặp ẩn dụ

Dùng đa dạng bối cảnh VN mới: danh bạ điện thoại, hỏi đường qua tổ dân phố,
trạm cấp nước chung, kho hàng gần nhà, cửa hàng nhượng quyền, poster quảng
cáo, lễ tân toà nhà, bảo vệ kiểm tra giấy tờ, cửa an ninh chung cư, bếp/phục
vụ nhà hàng, khu ẩm thực (food court), ứng dụng gọi xe, phiếu gọi món, story
mạng xã hội, bãi giữ xe, gọi cấp cứu 115 — không dùng tủ lạnh/quầy ngân
hàng/tổng đài (loại trừ theo yêu cầu), không lặp ẩn dụ giữa các khối trong
cùng 1 bài.

## 7 SVG mới — kích thước & cơ chế

| File | Bytes | Cơ chế minh hoạ |
|---|---|---|
| `chu-de-dns-tra-cuu-phan-cap.svg` | 3845 | Client→Resolver(cache)→Root→TLD→Authoritative theo thứ tự khi trượt cache; đường cong accent animated khi có cache trả thẳng |
| `chu-de-cdn-may-chu-gan-nguoi-dung.svg` | 3612 | 2 hàng: không CDN (đường dài, chậm tới gốc) vs có CDN (đường ngắn tới điểm gần, đồng bộ ngầm với gốc) |
| `chu-de-cdn-push-vs-pull.svg` | 3638 | 2 hàng: push (đẩy nội dung lên CDN trước) vs pull (CDN lấy từ gốc khi có request đầu) |
| `chu-de-reverse-proxy-an-may-chu-noi-bo.svg` | 3679 | 2 client dồn qua 1 proxy ngược tới 3 server ẩn phía sau; nhãn "1 địa chỉ duy nhất" / "ẩn cấu trúc bên trong" |
| `chu-de-application-layer-tach-tang-web-ung-dung.svg` | 2772 | Tầng web 3 box cố định phía trên, tầng ứng dụng 4 box (1 dashed "+") co giãn độc lập phía dưới |
| `chu-de-asynchronism-dong-bo-vs-bat-dong-bo.svg` | 4336 | 2 hàng: đồng bộ (client chờ server xử lý xong) vs bất đồng bộ (server trả ngay, việc chuyển vào Queue→Worker xử lý nền), animated flow |
| `chu-de-asynchronism-ap-luc-nguoc.svg` | 3060 | Hàng đợi dạng "bình" chứa 4 slot tới vạch giới hạn → từ chối bằng HTTP 503 → client thử lại (backoff), dùng `var(--danger)` |

Tất cả < 15KB (lớn nhất 4336B ≈ 29% ngân sách). `<title>` id + marker id đều
prefix riêng theo file (`svg-dnsr-`, `svg-cdnp-`, `svg-cdnpp-`, `svg-rph-`,
`svg-applt-`, `svg-asf-`, `svg-asbp-`), không trùng bất kỳ id nào trong toàn
bộ `src/assets/illustrations` (grep xác nhận 0 id trùng site-wide). Màu chỉ
dùng `var(--accent)`, `var(--ink)`, `var(--ink-2)`, `var(--surface-2)`,
`var(--line)`, `var(--danger)`, `color-mix(in srgb, var(--accent) 12%,
transparent)` — 0 mã hex (grep xác nhận). `viewBox` dùng đúng `0 0 360 220`
hoặc `0 0 360 260`/`0 0 360 300` (2 hình cần 2 hàng so sánh dùng chiều cao
lớn hơn, theo mẫu pilot `chu-de-load-balancer-layer4-vs-layer7.svg` vốn cũng
260). Chữ Việt đủ dấu qua `<text>`/`<tspan>` thật, không path. Animation (2
hình: DNS resolve, async flow) bọc `@media (prefers-reduced-motion:
no-preference)`.

## Xác minh XML well-formedness

Không có `xmllint`/`python3` trong môi trường (đã thử, không có sẵn). Viết
script Node tay (`scratchpad/check-svg.mjs`, stack-based tag matching +
quote-count parity) — cả 7 file: `OK`, không lệch thẻ, không lệch dấu
ngoặc kép. Cách làm giống batch 0 (không có XML lib trong deps).

## Tests

- `pnpm verify:fidelity`: **OK — 27 kien-truc + 23 tai-chinh** khớp snapshot
  gốc, bao gồm 5 bài đã sửa. Không đổi.
- `pnpm test` (vitest): **140/140 pass**, không sửa file test nào.
- Hex-color grep trên 7 SVG mới: rỗng (0 match, xác nhận qua exit code).
- `git status`: chỉ 5 `.mdx` sở hữu (modified) + 7 `.svg` mới (untracked)
  xuất hiện; các SVG untracked khác trong `kien-truc/` thuộc batch song song
  khác (communication/database/security/danh-doi/nen-tang/bai-tap) — không
  đọc/sửa, đúng ranh giới file ownership.
- Không chạy `pnpm build`/`pnpm check` theo yêu cầu (dist/.astro dùng chung,
  controller build tập trung).

## Ghi chú

- `examplesReviewed` giữ nguyên `false` ở cả 5 file — không tự đổi, đúng quy
  trình uỷ quyền cho agent fact-check chạy sau.
- Ví dụ "Đăng story..." trong bài asynchronism diễn giải lại đúng ví dụ
  tweet có sẵn trong văn bản gốc (chỉ đổi bối cảnh sang mạng xã hội quen
  thuộc VN) — không mâu thuẫn với nội dung gốc ngay phía trên.

Status: DONE
Summary: 5 lessons (dns/cdn/reverse-proxy/application-layer/asynchronism) done — 16 RealLife + 7 Figure added SVG (all <15KB, 0 hex, unique a11y ids, well-formed XML via hand script), fresh VN analogies (no tủ lạnh/quầy ngân hàng/tổng đài, no repeats across own 5 lessons); verify-fidelity OK (27+23 unchanged), vitest 140/140 pass, hex grep clean, file ownership respected (only 5 mdx + 7 new svg touched, other parallel-batch untracked files left untouched); no build/check run per instructions (shared dist, controller builds centrally).
Concerns/Blockers: none blocking. No xmllint/python3 available in this environment for a canonical XML validator — used a hand-rolled Node stack-based tag/quote checker instead (same approach as batch 0); recommend controller's central `pnpm build` as the authoritative XML/Astro-compile check across all batches.
