---
phase: 6
batch: D
title: "Phase 6 batch D report: content enrichment — pastebin, scaling-aws, twitter, web-crawler"
date: 2026-09-28
status: completed
---

# Phase 6 batch D report: system-design exercise lessons

Scope: added `<RealLife>` examples + new inline SVG `<Figure added>` illustrations to
4 `kien-truc/bai-tap` exercise write-ups. Text/frontmatter/code fences untouched — only
insertions (RealLife blocks, Figure blocks, `?raw` import lines).

## `kien-truc/bai-tap/01-pastebin.mdx` (5 RealLife, 2 SVG)

1. "Vé gửi xe máy ở bãi giữ xe" — shortlink là khóa ngắn ánh xạ tới nội dung dài, giống mã vé tra ra đúng xe trong bãi.
2. "Ước lượng nhanh trước khi mở rộng" — nhẩm số phần ăn cần chuẩn bị ~ back-of-envelope estimation trước khi thiết kế. Kèm SVG `bai-tap-pastebin-uoc-luong-nhanh.svg` (2172 B): chuỗi 4 bước nhân/chia từ 10 triệu paste/tháng ra 4 lượt ghi/giây.
3. "Bốc số thứ tự ở phòng khám" — kiểm tra trùng trước khi phát số ~ kiểm tra shortlink trùng trước khi lưu, sinh lại nếu trùng. Kèm SVG `bai-tap-pastebin-tao-shortlink.svg` (3303 B): luồng băm → base62 → kiểm tra trùng SQL → lưu, với nhánh lặp lại khi trùng.
4. "Kho gửi đồ tách khỏi quầy lễ tân" — tách Object Store (nội dung paste) khỏi SQL (chỉ lưu đường dẫn/"phiếu").
5. "Hàng bán chạy để sẵn ngoài kệ" — Memory Cache hấp thụ phần lớn lượt đọc trước khi chạm DB (đọc/ghi 10:1).

## `kien-truc/bai-tap/02-scaling-aws.mdx` (4 RealLife, 2 SVG)

1. "Nồi phở đổi cỡ khi đông khách" — mở rộng theo chiều dọc (đổi máy mạnh hơn) có trần, khác ẩn dụ "thuê thêm người" đã dùng ở bài Load Balancer thí điểm.
2. "Tách sổ sách khỏi quầy bán hàng" — tách Object Store + MySQL ra máy riêng ở giai đoạn Users+.
3. "Thuê nhân viên bán trưa theo giờ cao điểm" — autoscaling co giãn theo giờ hành chính. Kèm SVG `bai-tap-scaling-aws-autoscaling-theo-gio.svg` (1875 B): biểu đồ cột số server theo 5 khung giờ trong ngày, đỉnh ở buổi trưa.
4. "Photocopy nhận đơn rồi giao sau" — xử lý bất đồng bộ qua Queue + Worker Service (ví dụ tạo thumbnail).

SVG bổ sung `bai-tap-scaling-aws-hanh-trinh-mo-rong.svg` (2284 B): mô hình tổng quan hành trình Users+ → Users++++ (mỗi bước đo tải rồi mới xử lý đúng nút thắt), chèn ngay đầu "Bước 4" trước khi đi vào từng giai đoạn chi tiết.

## `kien-truc/bai-tap/03-twitter.mdx` (5 RealLife, 2 SVG)

1. "Sổ tay giao hàng ước lượng nhanh" — back-of-envelope cho kích thước tweet/tải hệ thống.
2. "Nhóm chat lớp học báo bài ngay" — fan-out on write đẩy tweet ngay tới home timeline follower. Kèm SVG `bai-tap-twitter-fan-out-ghi.svg` (3025 B): Tweet → Fan Out Service → N timeline (O(n) lượt ghi).
3. "Đơn hàng khổng lồ của người bán livestream triệu follow" — celebrity/hot-key problem, vì sao tránh fan-out cho tài khoản quá lớn. Kèm SVG `bai-tap-twitter-fan-out-ghi-vs-doc.svg` (3581 B): so sánh chi phí push (nặng lúc đăng) vs pull (nặng lúc đọc).
4. "Nhật ký cá nhân và bảng tin chung cư" — phân biệt user timeline (chỉ tweet của bạn) vs home timeline (gộp nhiều người).
5. "Mục lục cuối sách giáo khoa" — reverse/inverted index tra ngược từ khóa ra tài liệu.

## `kien-truc/bai-tap/04-web-crawler.mdx` (5 RealLife, 2 SVG)

1. "Ước lượng số xe tải cho kho hàng mới" — back-of-envelope dung lượng lưu trữ (500KB × 4 tỷ trang/tháng).
2. "Người giao báo đánh dấu nhà đã giao" — priority queue + tập "đã crawl" ngăn vòng lặp vô hạn. Kèm SVG `bai-tap-web-crawler-vong-lap-crawl.svg` (2863 B): vòng lặp lấy URL ưu tiên → kiểm tra trùng → crawl hoặc bỏ qua.
3. "Đi chợ định kỳ bổ sung hàng tươi" — tần suất crawl lại theo tốc độ trang thực sự thay đổi, không cố định.
4. "Biển báo giới hạn giờ giao hàng" — `robots.txt` như biển quy định crawler được/không được ghé.
5. "Vân tay giấy tờ, không cần đọc từng chữ" — phát hiện gần trùng lặp qua chữ ký/fingerprint thay vì so từng ký tự. Kèm SVG `bai-tap-web-crawler-van-tay-trung-lap.svg` (3225 B): hai trang gần giống nhau → hai "vân tay" 8-bit rút gọn gần giống nhau, lệch 1 vị trí vẫn tính là trùng.

## SVG — kiểm tra kỹ thuật

Tất cả 8 file: viewBox 360×220 (trừ shortlink 360×300), `width="100%"`, `role="img"` +
`aria-labelledby` trỏ `<title>` duy nhất site-wide (prefix `svg-btp-`/`svg-bsa-`/
`svg-btw-`/`svg-bwc-`), màu chỉ qua `var(--accent)`/`var(--ink)`/`var(--ink-2)`/
`var(--surface-2)`/`var(--danger)`/`color-mix(...)`, chữ `<text>` thật tiếng Việt đủ
dấu ≤ 8 nhãn/hình, `stroke-width="2"` (một điểm nhấn "≈ 4 lượt ghi/giây" và cột "Trưa"
dùng `2.5` theo đúng ngoại lệ style guide). Kích thước lớn nhất 3581 B (~24% ngân sách
15KB). Hex-color grep (`grep -rn '#[0-9a-fA-F]\{3,8\}'`) trên 8 file → rỗng. Kiểm tra
cân bằng thẻ + số dấu `"` chẵn bằng script tay (Node, không có XML lib trong deps,
cùng cách batch 0 đã làm) → cả 8 file OK. Không trùng `id` nào với các SVG khác trong
`src/assets/illustrations/` (grep toàn thư mục, không tìm thấy id lặp).

## Tests

- `pnpm verify:fidelity` (full suite): **crash, không do tôi**. Script `readdirSync`
  toàn bộ `src/content/lessons` và parse MDX; crash không bắt được (uncaught exception)
  khi gặp `src/content/lessons/tai-chinh/nguon-hoc/02-tu-sach-va-lich-doc.mdx:62`
  — `<RealLife title=”Mượn thư viện trước khi mua sách đắt tiền”>` dùng dấu ngoặc kép
  cong (U+201D) thay vì `"` thẳng trong JSX attribute, khiến `micromark-extension-mdx-jsx`
  ném lỗi parse. File này **không thuộc phạm vi tôi** (domain tài-chinh, agent batch
  khác đang sửa song song — `git status` xác nhận đang modified, 21 dòng thêm, không
  phải do tôi). Đã viết script tạm trong scratchpad tái dùng đúng logic
  `scripts/lib/fidelity.mjs`/`frontmatter.mjs` để verify riêng 4 file tôi sở hữu (không
  sửa file nào ngoài phạm vi, không đụng `scripts/verify-fidelity.mjs`) →
  **cả 4 file: OK, khớp snapshot gốc, `examplesReviewed` vẫn `false`**.
- `pnpm test` (vitest): **158/158 pass**.
- Hex-color grep trên 8 SVG mới: rỗng.
- XML well-formedness (tag-balance + quote-count script): 8/8 OK.

## File ownership — xác nhận

`git status` cho thấy đúng 12 file thuộc phạm vi tôi (4 `.mdx` + 8 `.svg` mới). Các
file khác đang `modified`/`untracked` (kien-truc/chu-de/*, tai-chinh/*, src/lib/progress-*,
src/lib/search-*, src/pages/*.json.ts, tests/*) là của các agent batch/phase khác chạy
song song — không đọc/sửa, không commit git, đúng ranh giới file ownership.

## Điều cần controller biết

`verify:fidelity` không tự phục hồi sau file MDX lỗi cú pháp — một file hỏng làm sập
toàn bộ script cho mọi batch khác đang chạy song song. Đề xuất (không tự sửa vì ngoài
ownership): agent phụ trách `tai-chinh/nguon-hoc/02-tu-sach-va-lich-doc.mdx` cần đổi
`”`/`“` (curly quote) thành `"` thẳng trong `title=` của `<RealLife>` dòng 62; controller
nên chạy lại `pnpm verify:fidelity` full suite sau khi file đó được sửa để xác nhận
toàn bộ 51+ bài (không chỉ 4 bài của tôi) đều pass.

## Unresolved questions

Không có — mọi quyết định (đặt tên SVG, vị trí RealLife, tránh trùng ẩn dụ tủ lạnh/
quầy ngân hàng/tổng đài và cả ẩn dụ "thuê thêm người" đã dùng ở bài Load Balancer thí
điểm) tự quyết theo đúng content-authoring-guide.md + illustration-style-guide.md, đã
verify qua fidelity/test/hex/XML thật.

Status: DONE_WITH_CONCERNS
Summary: 19 RealLife + 8 Figure added (2/lesson) trên 4 bài kien-truc/bai-tap
(pastebin/scaling-aws/twitter/web-crawler); text gốc/frontmatter không đổi
(`examplesReviewed` vẫn `false`); 8 SVG mới đều <15KB, 0 hex, id/title duy nhất
site-wide, XML cân bằng; `pnpm test` 158/158 pass; fidelity của 4 file tôi sở hữu
verify OK qua script tạm (full-suite `pnpm verify:fidelity` hiện crash do lỗi cú pháp
trong một file tai-chinh không thuộc phạm vi tôi, agent khác đang sửa song song).
Concerns/Blockers: full-suite `pnpm verify:fidelity` không chạy được tới cuối vì file
ngoài phạm vi (`tai-chinh/nguon-hoc/02-tu-sach-va-lich-doc.mdx` dòng 62, curly quote
trong JSX attribute) — không phải lỗi của tôi, cần agent sở hữu file đó hoặc controller
sửa rồi chạy lại full suite để xác nhận toàn repo.
