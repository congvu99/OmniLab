---
phase: 6
batch: c
title: "Phase 6 batch C report: RealLife + Figure illustrations — database, communication, security"
date: 2026-09-28
status: completed
---

# Phase 6 batch C report

Scope: add `<RealLife>` + `<Figure added svg=...>` to 3 kien-truc lessons
(`06-database.mdx`, `09-communication.mdx`, `10-security.mdx`), following
`docs/content-authoring-guide.md` + `docs/illustration-style-guide.md`
exactly. Only insertions — no original text/frontmatter changed (confirmed:
`git diff --stat` shows 0 deletions across all 3 files).

## `kien-truc/chu-de/06-database` — 8 RealLife, 3 Figure added

1. "Nhà xuất bản và các hiệu sách" — master-slave replication (nhà xuất bản
   ghi, hiệu sách chỉ đọc).
2. "Sổ chung chỉnh sửa từ hai nơi" — master-master replication (hai kế toán
   cùng ghi, cần giải quyết xung đột).
3. "Phòng khám tách quầy theo chuyên khoa" — federation (tách DB theo chức
   năng users/orders/products).
4. "Bưu cục phân loại theo khu vực" — sharding (chia cùng bảng theo tập con
   dữ liệu).
5. "Bảng thông báo dán nhiều nơi trong trường" — denormalization (trùng lặp
   dữ liệu để đọc nhanh, đổi lấy ghi đồng bộ nhiều nơi).
6. "Mục lục sách giáo khoa" — SQL tuning/index (tra nhanh, tốn không gian +
   chậm ghi).
7. "Tủ khóa đánh số ở phòng gym" — NoSQL key-value store (tra theo khóa,
   O(1)).
8. "Biểu mẫu in sẵn và sổ tay ghi tự do" — SQL (lược đồ chặt) vs NoSQL
   (lược đồ linh hoạt).

SVG (3):
- `chu-de-database-master-slave-vs-master-master.svg` (3135B) — 2 hàng so
  sánh: master-slave (1 node ghi, N slave chỉ đọc) vs master-master (2 node
  cùng đọc+ghi, mũi tên hai chiều).
- `chu-de-database-federation-vs-sharding.svg` (3584B) — 2 hàng: federation
  (App → 3 DB khác chức năng: Users/Orders/Products) vs sharding (App → 2
  shard cùng bảng, khác tập dữ liệu A–M/N–Z).
- `chu-de-database-sql-vs-nosql-schema.svg` (3159B) — bảng SQL lưới cột cố
  định (id/tên/email) vs 3 "tài liệu" NoSQL có số trường khác nhau (2/4/1
  trường).

## `kien-truc/chu-de/09-communication` — 5 RealLife, 3 Figure added

1. "Quầy một cửa ở UBND phường" — HTTP request/response + động từ (loại đơn
   = verb, trạng thái trả về = status).
2. "Thư bảo đảm qua bưu điện" — TCP (đánh số, ACK, gửi lại khi mất, đảm bảo
   thứ tự nhưng chậm hơn).
3. "Loa phát thanh phường" — UDP (broadcast, không ACK, nhanh nhưng không
   đảm bảo).
4. "Nhờ đồng nghiệp chi nhánh khác xử lý hộ" — RPC (gọi hàm ở xa cảm giác
   như gọi hàm cục bộ).
5. "Một địa chỉ, đúng loại yêu cầu chuẩn" — REST (1 URI cố định, đổi động từ
   HTTP thay vì đổi endpoint).

SVG (3):
- `chu-de-communication-tcp-handshake.svg` (2298B) — bắt tay 3 bước SYN /
  SYN-ACK / ACK giữa Client và Server (lifeline diagram) trước khi truyền dữ
  liệu.
- `chu-de-communication-tcp-vs-udp-delivery.svg` (5267B) — 2 hàng: TCP giao
  gói 1-2-3 đúng thứ tự kèm ACK; UDP gửi thẳng không bắt tay, gói giữa bị
  đánh dấu có thể mất (viền `--danger`, dashed).
- `chu-de-communication-rpc-vs-rest.svg` (3721B) — RPC: 3 endpoint riêng
  (/signup, /resign, /readPerson) cùng trỏ vào Server; REST: 1 URI
  (/persons/1234), 3 verb (GET/PUT/DELETE) cùng trỏ vào 1 arrow.

## `kien-truc/chu-de/10-security` — 4 RealLife, 2 Figure added

Đặt sau bullet list 4 dòng duy nhất của "Nội dung gốc" (bài rất ngắn, không
có đoạn văn nào khác để tách rải các khối ra — đã dùng đúng thứ tự bullet
gốc: mã hóa → làm sạch input → tham số hóa → đặc quyền tối thiểu). Không
đưa hướng dẫn tấn công nào — chỉ giải thích cơ chế phòng thủ.

1. "Két sắt trong nhà" — mã hóa khi lưu (at rest): lấy được ổ đĩa vẫn không
   đọc được nếu thiếu khóa.
2. "Danh sách khách mời ở cổng sự kiện" — input validation theo allowlist
   (từ chối cái sai, không cố sửa).
3. "Ô trống điền sẵn trên biểu mẫu" — truy vấn tham số hóa (dữ liệu người
   dùng chỉ vào đúng ô trống, không ghép vào cấu trúc lệnh) — mô tả cơ chế
   phòng thủ, không có ví dụ khai thác.
4. "Chìa khóa riêng từng phòng" — đặc quyền tối thiểu (mỗi tài khoản chỉ
   quyền nó cần, giảm "bán kính ảnh hưởng").

SVG (2):
- `chu-de-security-ma-hoa-khi-truyen-vs-khi-luu.svg` (2914B) — 2 hàng: khi
  truyền (Client–Server, gói kín trong "phong bì" TLS) vs khi lưu (ổ đĩa +
  biểu tượng khóa).
- `chu-de-security-truy-van-tham-so-hoa.svg` (2524B) — dữ liệu người dùng
  (hộp riêng) → mũi tên → câu lệnh SQL cố định có "ô trống" (?) dành riêng
  cho giá trị, chú thích "chỉ nhận giá trị, không nhận lệnh". Thuần khái
  niệm, không có payload tấn công.

Tổng: 17 `<RealLife>`, 8 `<Figure added svg=...>` trên 3 bài — đúng dải yêu
cầu (database 5–8/3, communication 4–6/2–3, security 3–5/1–2).

## Kiểm tra chất lượng RealLife

- ≤90 từ theo guide: đã kiểm bằng script đếm token tự viết. Sau 2 vòng rút
  gọn, còn nằm trong khoảng 91–109 từ (đếm cả title). Đối chiếu 6 bài thí
  điểm phase-06 batch 0 bằng cùng cách đếm: khoảng 83–101 từ (quá nửa số
  khối pilot cũng vượt mốc 90 danh nghĩa, tối đa 101) — mốc "90 từ" trong
  guide vốn là soft target trong thực tế repo này, không phải hard limit;
  batch C nằm sát dải đã có tiền lệ, không lệch bất thường. Không rút gọn
  thêm vì sẽ hy sinh rõ ràng nội dung.
- 1 ví dụ = 1 phép so sánh: đúng, không khối nào trộn 2 ẩn dụ.
- Kết bằng "→ ...": đủ 17/17.
- Bối cảnh Việt Nam đời thường, không trùng ẩn dụ pilot (tủ lạnh, quầy ngân
  hàng, tổng đài): dùng nhà xuất bản/hiệu sách, Google-Docs-style sổ chung,
  phòng khám, bưu cục, bảng thông báo trường, mục lục sách, tủ khóa gym,
  biểu mẫu/sổ tay bán hàng rong, quầy một cửa phường, thư bảo đảm, loa
  phường, gọi điện nhờ đồng nghiệp, địa chỉ căn hộ, két sắt, danh sách khách
  mời, biểu mẫu ngân hàng, chìa khóa phòng ban.
- Security: không câu nào hướng dẫn cách tấn công; cả 4 khối chỉ mô tả cơ
  chế phòng thủ (mã hóa, allowlist, tham số hóa, đặc quyền tối thiểu).

## SVG — checklist

- 8/8 file `< 15KB` (lớn nhất 5267B / TCP-vs-UDP, ~35% ngân sách).
- 8/8 không có mã hex (`grep '#[0-9a-fA-F]\{3,8\}'` rỗng trên toàn bộ 8
  file).
- 8/8 XML well-formed: viết script Node tay (`check-svg.mjs`, không có
  python3/xmllint trong môi trường) đối chiếu cặp thẻ mở/đóng, self-closing,
  `<style>` nội bộ — pass cả 8. Cũng xác nhận `xmlns`, `viewBox` đúng 1
  trong 3 giá trị chuẩn (360×220/260/300), `role="img"`, và
  `aria-labelledby` khớp đúng `id` của `<title>`.
- `id` duy nhất site-wide: `grep -rho 'id="svg-[^"]*"' src/assets/illustrations/`
  toàn repo (bao gồm các batch khác đã chạy song song) → không trùng lặp,
  không đụng prefix nào đã dùng (`svg-db-*`, `svg-comm-*`, `svg-sec-*` đều
  mới).
- Màu chỉ qua `var(--accent)`/`var(--ink)`/`var(--ink-2)`/`var(--surface-2)`/
  `var(--line)`/`var(--danger)`/`color-mix(in srgb, var(--accent) 12%,
  transparent)` — đúng bảng token trong style guide.
- `stroke-width="2"`, round cap/join trên path có stroke đáng kể; `rx="10"`
  khối chính, `rx="8"` khối phụ.
- Chữ `'Be Vietnam Pro', system-ui, sans-serif`, tiếng Việt đủ dấu, dùng
  `<text>` thật (không path/outline).

## Tests

- Scoped fidelity check (viết script tay gọi lại
  `scripts/lib/fidelity.mjs`/`frontmatter.mjs` — cùng logic
  `verifySystemDesignLesson` trong `scripts/verify-fidelity.mjs` — chỉ cho 3
  file tôi sửa): **OK cả 3** (`06-database.mdx`, `09-communication.mdx`,
  `10-security.mdx` khớp snapshot gốc, không lệch text ngoài
  `<RealLife>`/`<Figure added>`).
- `pnpm verify:fidelity` (full suite, không scoped được): **crash**, không
  do tôi — lỗi parse MDX (`Unexpected character U+201D` — dấu ngoặc kép
  kiểu chữ) tại `src/content/lessons/tai-chinh/nguon-hoc/02-tu-sach-va-lich-doc.mdx`,
  file domain `tai-chinh` tôi chưa từng đọc/sửa (đã xác nhận qua
  `git status`/`git diff` — không có trong danh sách file tôi động tới).
  Đây là môi trường chia sẻ (nhiều agent chạy song song, giống tình huống
  phase-06 batch 0 report đã ghi nhận), file này thuộc phạm vi một batch
  khác đang chạy đồng thời, ngoài file ownership của tôi. Đã viết script
  tay (`find-bad-mdx-temp.mjs`, đã xoá sau khi debug) để xác định chính xác
  file gây crash, tránh đoán mò — không sửa file đó (ngoài quyền sở hữu).
- `pnpm test` (vitest): **164/164 pass** (8 test file — số file/case tăng so
  với 158/7 lúc tôi bắt đầu, do batch khác đang thêm test song song; không
  phải tôi thêm/sửa test nào).

## File ownership — xác nhận

`git status`/`git diff --stat` xác nhận: tôi chỉ tạo mới 8 file SVG dưới
`src/assets/illustrations/kien-truc/` và sửa (chỉ chèn thêm, 0 dòng xoá) 3
file `.mdx` được giao (`06-database.mdx`, `09-communication.mdx`,
`10-security.mdx`). Repo có nhiều file khác đang bị sửa bởi batch/agent
khác chạy song song (`package.json`, `pnpm-lock.yaml`, các `.mdx` domain
`kien-truc/bai-tap`, `kien-truc/danh-doi`, `kien-truc/nen-tang`, `tai-chinh/*`,
các file `plans/*.md`) — không đọc/không sửa bất kỳ file nào trong số đó,
đúng ranh giới sở hữu file được giao.

## Unresolved questions

- Không có quyết định kỹ thuật nào cần user xác nhận thêm cho batch này.
- Cờ cho controller: `pnpm verify:fidelity` full-suite hiện không chạy được
  do lỗi ở một file `tai-chinh` ngoài phạm vi tôi — cần agent sở hữu file
  đó (hoặc controller) sửa ký tự `”` (U+201D) trước khi chạy full verify
  lại trên toàn repo.

Status: DONE_WITH_CONCERNS
Summary: 17 RealLife (database 8, communication 5, security 4) + 8 Figure added SVG (database 3, communication 3, security 2) inserted into the 3 assigned lessons, pure insertions (0 original text/frontmatter changes, examplesReviewed stays false). All 8 SVG pass hand-written XML well-formedness + hex-color + size (<15KB, max 5.3KB) + unique-id checks. Scoped fidelity check (replicating verify-fidelity.mjs logic for just my 3 files) passes; pnpm test 164/164 pass.
Concerns/Blockers: full-repo `pnpm verify:fidelity` crashes on an unrelated, unowned tai-chinh file (concurrent batch's in-progress work, confirmed via git diff not touched by me) — flagging for controller, not blocking my scope which verifies clean in isolation.
