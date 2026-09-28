---
phase: 6
batch: A
title: "Phase 6 batch A report: content enrichment — 8 lessons (nen-tang + danh-doi)"
date: 2026-09-28
status: completed
---

# Phase 6 batch A report

Copied process from `docs/content-authoring-guide.md` + `docs/illustration-style-guide.md`
(phase-06 batch 0). 8 lessons, 27 `<RealLife>`, 13 `<Figure added svg=...>`.

## Per-lesson detail

### `kien-truc/nen-tang/01-clones.mdx` (3 RealLife, 1 SVG)
1. "Quán photocopy nhiều chi nhánh" — server giống hệt nhau, không giữ dữ liệu riêng.
2. "Tủ gửi đồ dùng chung ở siêu thị" — session ở kho tập trung bên ngoài.
3. "In hàng loạt từ một bản kẽm gốc" — AMI làm bản gốc nhân instance.
- `nen-tang-clones-dinh-tuyen-khong-trang-thai.svg` (3715B) — Steve qua LB tới 3 server khác nhau, tất cả trỏ về 1 session store dùng chung (stateless routing).

### `kien-truc/nen-tang/02-databases.mdx` (3 RealLife, 1 SVG)
1. "Sổ ghi chép bán hàng của tiệm tạp hóa" — DB thành nút thắt cổ chai.
2. "Thuê thêm kế toán mà sổ vẫn một cuốn" — con đường 1 (vá MySQL) đắt dần.
3. "Chia sổ theo từng quầy riêng" — con đường 2 (denormalize, không Join).
- `nen-tang-databases-hai-con-duong.svg` (3995B) — 2 hàng so sánh con đường 1 (MySQL→+RAM/replication→Sharding, escalating cost) vs con đường 2 (Dữ liệu→tách đối tượng→NoSQL/join code).

### `kien-truc/nen-tang/03-caches.mdx` (4 RealLife, 1 SVG)
1. "Ngăn kéo bàn làm việc so với kho hàng dưới tầng hầm" — RAM nhanh/nhỏ vs đĩa chậm/lớn.
2. "Ghi chú riêng cho từng câu hỏi của khách" — mô hình 1 (cache truy vấn) khó dọn.
3. "Hồ sơ khách hàng đầy đủ một chỗ" — mô hình 2 (cache đối tượng) dễ dọn.
4. "Vé giữ chỗ tạm ở quầy lễ tân" — session là dữ liệu sống ngắn, không nên vào DB chính.
- `nen-tang-caches-mo-hinh-truy-van-vs-doi-tuong.svg` (2505B) — 2 hàng: 3 mảnh "Câu hỏi A/B/C" rời rạc (mô hình 1) vs 1 khối "Object" nguyên (mô hình 2).

### `kien-truc/nen-tang/04-asynchronism.mdx` (3 RealLife, 2 SVG)
Tránh trùng ẩn dụ "bánh mì" có sẵn trong bài gốc — dùng căn tin/giặt ủi/phòng khám.
1. "Cơm phần chuẩn bị sẵn ở căn tin" — bất đồng bộ kiểu 1 (làm trước).
2. "Gửi đồ ở tiệm giặt ủi, lấy số hẹn quay lại" — kiểu 2 (job queue, nhận việc trả sau).
3. "Nhiều bác sĩ cùng gọi số ở phòng khám" — nhiều worker xử lý song song.
- `nen-tang-asynchronism-hai-kieu-bat-dong-bo.svg` (3845B) — 2 hàng: Cronjob→Render tĩnh→User nhận ngay vs Request→Job queue→Worker.
- `nen-tang-asynchronism-worker-pool.svg` (2928B) — hàng đợi job + 2 worker kéo song song, ghi chú back pressure.

### `kien-truc/danh-doi/01-performance-vs-scalability.mdx` (2 RealLife, 1 SVG)
Nội dung gốc rất ngắn (1 đoạn + 2 bullet) → dùng mức thấp của dải "2–3".
1. "Nhân viên tính tiền chậm tay" — vấn đề hiệu năng (chậm dù ít hay đông).
2. "Một quầy thu ngân duy nhất vào giờ cao điểm" — vấn đề khả năng mở rộng.
- `danh-doi-performance-vs-scalability-chan-doan.svg` (3531B) — 2 cột: hiệu năng (1 người dùng → luôn Chậm) vs mở rộng (1 người dùng → Nhanh; nhiều người dùng → Chậm).

### `kien-truc/danh-doi/02-latency-vs-throughput.mdx` (3 RealLife, 2 SVG)
Cùng mạch "quán phở" xuyên suốt 3 khối (nhất quán trong 1 bài, giống cách pilot lặp "tủ lạnh" trong bài cache).
1. "Gọi món ở quán ăn" — định nghĩa độ trễ.
2. "Quán phở phục vụ được bao nhiêu tô mỗi giờ" — định nghĩa thông lượng.
3. "Quán đặt ngưỡng chờ hợp lý rồi mới tối ưu số tô" — "thông lượng tối đa, độ trễ chấp nhận được".
- `danh-doi-latency-vs-throughput-ong-dan.svg` (1616B) — 1 ống nước: mũi tên dọc ống = độ trễ, mặt cắt ngang = thông lượng.
- `danh-doi-latency-vs-throughput-gom-lo.svg` (3431B) — 2 hàng: gửi ngay từng cái (độ trễ thấp/lần, thông lượng thấp hơn) vs gom lô (độ trễ item đầu tăng, thông lượng tăng).

### `kien-truc/danh-doi/04-consistency-patterns.mdx` (4 RealLife, 2 SVG)
Tránh lặp lại ví dụ VoIP có sẵn trong bài gốc bằng ví dụ khác cho "yếu".
1. "Nhiều chi nhánh cùng một chuỗi cà phê" — khung dẫn nhập 3 mức.
2. "Bộ đếm lượt xem đôi lúc trôi mất vài lượt" — nhất quán yếu.
3. "Đăng bài mạng xã hội, bạn bè thấy sau vài giây" — nhất quán cuối cùng.
4. "Chuyển khoản ngân hàng phải khớp ngay lập tức" — nhất quán mạnh.
- `danh-doi-consistency-patterns-ba-muc-do.svg` (2514B) — timeline Ghi→Đọc cho 3 mức (yếu: có thể không thấy; cuối cùng: thấy sau chắc chắn; mạnh: thấy ngay).
- `danh-doi-consistency-patterns-dong-bo-vs-bat-dong-bo.svg` (3567B) — Master→Replica đồng bộ (chờ xong mới trả lời) vs bất đồng bộ (trả lời ngay, cập nhật sau).

### `kien-truc/danh-doi/05-availability-patterns.mdx` (5 RealLife, 3 SVG — bài dài nhất, 9 phút)
1. "Nhân viên dự phòng trực điện thoại ở nhà" — active-passive.
2. "Hai quầy thu ngân cùng mở song song" — active-active.
3. "Ngân sách nghỉ ốm co lại khi đặt mục tiêu cao hơn" — thêm 1 số 9 = ngân sách chết co ~10 lần.
4. "Đi qua nhiều trạm kiểm soát liên tiếp" — mắc nối tiếp.
5. "Hai con đường tới cùng một điểm" — mắc song song.
- `danh-doi-availability-patterns-active-passive-vs-active.svg` (3689B) — active-passive (nhịp tim, chỉ 1 bên phục vụ) vs active-active (cả hai phục vụ).
- `danh-doi-availability-patterns-so-9-thoi-gian-chet.svg` (1552B) — 2 thanh: 99,9% = 8h45p/năm vs 99,99% = 52p/năm.
- `danh-doi-availability-patterns-noi-tiep-vs-song-song.svg` (2936B) — Foo→Bar nối tiếp (99,9%×99,9%=99,8%) vs Foo/Bar song song (→99,9999%).

## Verify

- `pnpm verify:fidelity`: **OK — 27 kien-truc + 23 tai-chinh** khớp snapshot (bao gồm 8 bài đã sửa). Số 27/23 là trạng thái repo hiện tại lúc chạy (batch khác đang làm song song), không phải do tôi đổi — tôi chỉ sửa đúng 8 file được giao.
- `pnpm test` (vitest): **158/158 pass**, không đổi file test nào.
- Hex-color grep trên 13 SVG mới: rỗng (0 match `#[0-9a-fA-F]{3,8}`).
- Balanced-tag well-formedness (script Node tự viết, không có xmllint trong PATH): **13/13 WELL-FORMED**.
- Kích thước: tất cả < 15KB, lớn nhất `nen-tang-databases-hai-con-duong.svg` 3995B (~27% ngân sách).
- `id="svg-..."` duy nhất site-wide: grep toàn `src/assets/illustrations` (kể cả SVG của các batch song song khác) → 0 trùng.
- `examplesReviewed` vẫn `false` ở cả 8 file (grep xác nhận dòng 14 mỗi file).
- Word-count `<RealLife>`: script Node đếm cả 27 khối, tất cả ≤ 90 từ (thấp nhất 52, cao nhất 86), tất cả có "→".
- File ownership: `git status` giới hạn đúng 8 `.mdx` + 13 `.svg` mới của tôi trong số các thay đổi liên quan; các file khác đổi/untracked (bai-tap, chu-de, tai-chinh, src/lib/*, plans/*, package.json...) thuộc các batch/phase khác chạy song song — không đụng tới.

## Quyết định nội dung đáng chú ý

- Original text của `nen-tang/*` và `danh-doi/01,02` khá ngắn → đặt RealLife/Figure bám theo heading/đoạn trong phần **"Nội dung gốc"** (không chèn vào `<TranslatorNote>`), đúng convention pilot batch 0 (verify-fidelity so khớp phần thân chính; TranslatorNote không phải nơi đặt các khối mới theo tiền lệ 6 bài thí điểm).
- Tránh trùng ẩn dụ: không dùng "tủ lạnh" (cache pilot), "nhân viên xếp khách vào quầy" (LB pilot), "tổng đài" (CAP pilot). Asynchronism tránh lặp "bánh mì" vốn đã là ví dụ của chính bài gốc. Consistency tránh lặp nguyên ví dụ VoIP có sẵn cho mục "yếu", dùng "bộ đếm lượt xem" thay thế.
- `danh-doi/02-latency-vs-throughput` cố ý dùng chung mạch "quán phở" cho cả 3 RealLife trong cùng bài (nhất quán nội bộ, giống cách pilot lặp "tủ lạnh" nhiều lần trong 1 bài cache) — không vi phạm "1 ví dụ = 1 phép so sánh" vì mỗi khối vẫn là 1 so sánh riêng biệt (độ trễ / thông lượng / đánh đổi).

Đối chiếu README gốc: không áp dụng (nội dung dịch/gốc không đổi, chỉ thêm RealLife/Figure).

## Unresolved questions

Không có.

Status: DONE
Summary: 27 RealLife + 13 Figure added svg trên 8 bài (nen-tang/clones,databases,caches,asynchronism; danh-doi/performance-vs-scalability,latency-vs-throughput,consistency-patterns,availability-patterns); verify:fidelity OK, vitest 158/158 pass, 0 hex color, 13/13 SVG well-formed XML, unique a11y ids site-wide, examplesReviewed vẫn false, word-count/arrow rule 27/27 pass, file ownership respected (không đụng file ngoài phạm vi giao).
Concerns/Blockers: none. Không chạy `pnpm build`/`pnpm check` theo đúng chỉ dẫn (controller build tập trung, dist/.astro dùng chung với batch khác).
