---
phase: 6
batch: g
title: "Phase 6 batch G report: content enrichment — khoi-dong, an-toan, thuc-hanh, nguon-hoc, di-tiep (11 lessons)"
date: 2026-09-28
status: completed
---

# Phase 6 batch G report

Added `<RealLife>` + new inline SVG `<Figure added>` to the 11 assigned
personal-finance lessons, following `docs/content-authoring-guide.md` +
`docs/illustration-style-guide.md` literally. No original text/frontmatter
touched — only insertions (`<RealLife>`, `<Figure added>`, `import ...?raw`).
`examplesReviewed` left `false` everywhere (fact-check agent's job).

## Per lesson: RealLife titles + SVG + mechanism

### tai-chinh/khoi-dong/01-vi-sao-hoc.mdx
- RealLife: "Hiểu luật giao thông khác với lái xe giữa phố đông" (biết nguyên
  lý ≠ đủ điều kiện xuống tiền); "Gọi lại ngân hàng thay vì né tránh cuộc gọi
  nhắc nợ"; "Đọc từng dòng sao kê thay vì chỉ nhìn số dư cuối tháng".
- SVG `khoi-dong-vi-sao-hoc-ba-cach-to-chuc.svg` (2139B) — 3-cột so sánh cách
  tổ chức lộ trình học (giáo trình/sản phẩm/quyết định), cột "theo quyết
  định" được đánh dấu ✓ đã chọn.

### tai-chinh/khoi-dong/02-bon-chang.mdx
- RealLife: "Sửa nền nhà trước khi xây thêm phòng" (chặng 1 là nền, học sau
  khi vững); "Giáo án tập gym điều chỉnh theo tháng" (vòng lặp học→làm→kiểm
  tra→điều chỉnh).
- SVG `khoi-dong-bon-chang-lo-trinh-4-chang.svg` (2295B) — timeline ngang 4
  chặng, chặng 1-3 nối liền trong 12 tuần (dải accent), chặng 4 nối bằng nét
  đứt biểu thị "tuỳ nhu cầu, không bắt buộc".

### tai-chinh/an-toan/01-boi-canh-viet-nam.mdx
- RealLife: "Không phải công thức nào cũng đúng cho mọi gia đình" (50/30/20
  không phải luật); "So biểu phí trước khi mở sổ tiết kiệm mới".
- SVG `an-toan-boi-canh-viet-nam-nguyen-ly-va-tra-cuu.svg` (2355B) — luồng 3
  bước: Nguyên lý chung → Tra cứu nguồn chính thức → Áp dụng trường hợp của
  bạn (khớp chủ đề "học nguyên lý, kiểm tra điều kiện tại nơi dùng").

### tai-chinh/an-toan/02-chong-gia-mao.mdx (anti-scam — viết phòng thủ, không
kèm kịch bản có thể dùng để lừa đảo)
- RealLife: "Cuộc gọi giả danh nhân viên ngân hàng" (mô tả hành vi phòng thủ:
  cúp máy, tự tìm số tổng đài, gọi lại xác nhận); "Đọc kỹ tên miền trước khi
  bấm link đầu tư" (tự gõ địa chỉ, không bấm link được gửi tới).
- SVG `an-toan-chong-gia-mao-quy-trinh-xac-minh.svg` (2787B) — 3 bước phòng
  thủ khi có yêu cầu chuyển tiền/OTP bất thường: ① Dừng lại → ② Kiểm tra kênh
  chính thức → ③ Gọi lại số đã biết; kèm dòng "không chắc chắn thì đừng
  chuyển tiền, đừng đọc OTP".

### tai-chinh/thuc-hanh/01-bai-tap-va-thu-tu-tien-du.mdx
- RealLife: "Tự thay số liệu thật vào bài tập ngân sách" (công thức giữ
  nguyên, số liệu đổi theo người); "Mất 50% cần lãi 100% mới hòa vốn" (mở
  rộng bài tập 4 sang trường hợp khác).
- SVG 1 `...lo-va-phuc-hoi.svg` (1913B) — biểu đồ cột lỗ/phục hồi bất đối
  xứng minh hoạ đúng 2 số trong bài gốc: giảm 20% cần tăng 25%; giảm 40% cần
  tăng 66,7%.
- SVG 2 `...thu-tu-uu-tien.svg` (2556B) — phễu 5 bước ưu tiên dùng tiền dư
  (thiết yếu → bộ đệm nhỏ → nợ chi phí cao → dự phòng → mục tiêu dài hạn),
  đúng nội dung dòng "Thứ tự dùng tiền dư" gốc.

### tai-chinh/nguon-hoc/01-nguon-hoc-chinh-thuc.mdx (nguồn — 2 RealLife về
CÁCH dùng nguồn)
- RealLife: "Tài liệu quỹ vẫn hữu ích dù có mục đích bán hàng"; "Áp năm câu
  hỏi vào một kênh review tài chính" (áp dụng khung 5 câu hỏi có sẵn trong
  bài vào 1 tình huống cụ thể).
- SVG `...kiem-tra-mot-nguon.svg` (2685B) — luồng quyết định: Đọc một nguồn →
  có bán gì/hứa chắc chắn? → rẽ nhánh "có dấu hiệu → cẩn trọng" (danger) vs
  "minh bạch → dùng tham khảo" (accent).

### tai-chinh/nguon-hoc/02-tu-sach-va-lich-doc.mdx (nguồn — 2 RealLife về
CÁCH chọn/kiểm tra sách)
- RealLife: "Kiểm tra bản dịch trước khi mua trọn bộ sách"; "Mượn thư viện
  trước khi mua sách đắt tiền".
- SVG `...lich-doc-12-tuan.svg` (2297B) — timeline lịch đọc gắn 12 tuần: Tuần
  1-8 (S1) → Tuần 9-10 (S2) → Tuần 11-12 (ôn tập, nét đứt sau) → Sau 12 tuần
  (S3-S5), đúng nội dung "Lịch đọc gắn với 12 tuần" gốc.

### tai-chinh/di-tiep/01-chon-nhanh-tiep.mdx
- RealLife: "Chọn nhánh Đời sống khi ưu tiên là gia đình"; "Chọn nhánh Kinh
  doanh khi sắp mở một cửa hàng nhỏ".
- SVG `...so-do-ba-nhanh.svg` (2938B) — cây quyết định "Sau 12 tuần" rẽ 3
  nhánh A (đời sống)/B (kinh doanh, accent)/C (nghề nghiệp), mỗi nhánh kèm 1
  dòng tiêu chí ngắn.

### tai-chinh/di-tiep/02-nghien-cuu-noi-gi.mdx (nghiên cứu — RealLife về CÁCH
đọc kết luận trái ngược)
- RealLife: "Hai tin trái ngược về cà phê và sức khỏe" (chuyển hoá kỹ năng
  "đọc 2 nghiên cứu mâu thuẫn" sang bối cảnh khác, tránh lặp đúng ví dụ
  Fernandes/Kaiser đã có trong Figure); "Kết quả ở Cộng hòa Dominica chưa
  chắc đúng ở Việt Nam" (giới hạn khả năng khái quát của 1 nghiên cứu).
- SVG `...hai-ket-qua-khac-nhau.svg` (1866B) — 2 cột Fernandes (2014, hiệu
  ứng nhỏ giảm dần, đường xu hướng đi xuống) vs Kaiser & cộng sự (tác động
  tích cực, đường xu hướng đi lên, accent), chú thích "khác dữ liệu, khác
  cách đo → khác kết luận".

### tai-chinh/di-tiep/03-tu-danh-gia.mdx
- RealLife: "Danh sách trước chuyến bay, không phải bằng chuyên môn phi công"
  (checklist tự đánh giá ≠ chứng chỉ).
- SVG `...truoc-khi-dung-tien-that.svg` (2232B) — 5 ô checkbox (mục tiêu,
  thời điểm cần tiền, khả năng chịu lỗ, chi phí, tính hợp pháp của kênh giao
  dịch) → mũi tên xuống hộp "Quyết định dùng tiền thật", đúng câu gốc trong
  `<Note>` "Trước khi dùng tiền thật...".

### tai-chinh/di-tiep/04-nguon-tham-khao.mdx (danh sách 45 nguồn — 2 RealLife
về CÁCH kiểm tra một tuyên bố trước khi tin)
- RealLife: "Tìm đúng nguồn trước khi tin một con số trong bài"; "Ngày nghiên
  cứu không phải ngày luật còn hiệu lực" (đặt sau đoạn "Giới hạn" gốc, KHÔNG
  lồng vào trong `<Note>` — đã tự phát hiện + sửa lỗi lồng nhầm khi review).
- SVG `...kiem-tra-tuyen-bo.svg` (2153B) — luồng 4 bước: ① Đọc một tuyên bố
  trong bài → ② Tìm số nguồn trong danh sách → ③ Đối chiếu ngày & cơ quan
  phát hành → ④ Tin dùng có điều kiện (accent).

## Tổng số

22 `<RealLife>` (2 mỗi bài, trừ 03-tu-danh-gia 1 khối — bài ngắn
readingMinutes:1, scaled xuống theo đúng hướng dẫn "scaled to length"), 12
`<Figure added svg=...>` dùng 12 file SVG riêng biệt (thuc-hanh/01 có 2
Figure từ 2 SVG khác nhau trong cùng bài; 9 bài còn lại có 1 Figure/bài). Tất
cả SVG < 15KB (lớn nhất 2938B, ~19.6% ngân sách), 0 mã hex, title id duy nhất
site-wide (xác nhận qua grep toàn `src/assets/illustrations/*/*.svg`, không
trùng bất kỳ id nào của các batch khác đang chạy song song).

## Quality checks thực hiện

- Hex-color grep trên cả 12 SVG: rỗng (`grep -n '#[0-9a-fA-F]{3,8}'`).
- XML well-formedness: viết script Node kiểm tra cân bằng thẻ + ampersand hợp
  lệ cho cả 12 file (không có `xmllint`/`python3` trong môi trường) — tất cả
  `OK`.
- Title id uniqueness site-wide: `grep -rh 'id="svg-'` toàn
  `src/assets/illustrations/` (bao gồm SVG của các batch kien-truc song song
  khác) → không id nào trùng > 1 lần.
- Word count mỗi `<RealLife>` body: viết script đếm; hiệu chỉnh 3 khối vượt
  90 từ (khoi-dong/01 "Hiểu luật giao thông...", khoi-dong/02 "Giáo án tập
  gym...", di-tiep/02 "Hai tin trái ngược...") xuống 86-90 từ. Toàn bộ 22
  khối hiện ≤ 90 từ (đối chiếu cách đếm giống 9 khối RealLife pilot có sẵn,
  max pilot 87 từ).
- Tự phát hiện + sửa 1 lỗi: `<RealLife>` ở di-tiep/04 bị chèn nhầm vào bên
  trong `<Note>` gốc (trước đoạn "Giới hạn:") ở lần edit đầu — đã dời ra
  ngoài, trước `<Note>`, không đụng text gốc.
- Tự phát hiện + sửa 1 lỗi: dấu ngoặc kép cong (`"..."`) bị lẫn vào thuộc
  tính `title=` của 1 `<RealLife>` ở nguon-hoc/02 (JSX cần ngoặc thẳng) — đã
  sửa lại `"..."`, grep xác nhận không còn trường hợp nào khác trong 11 file.
- `pnpm verify:fidelity`: **OK — 27 kien-truc + 23 tai-chinh** (chạy 2 lần,
  trước và sau khi sửa word-count, đều pass).
- `pnpm test`: **158/158 pass** (số test cao hơn phase-06 batch-0's 121 vì
  test suite đã lớn thêm từ các phase/batch khác chạy song song trong repo
  chia sẻ — không phải do tôi thêm test).
- Không chạy `pnpm build`/`pnpm check` theo đúng chỉ định (dist/.astro dùng
  chung, controller build tập trung).

## File ownership — xác nhận

`git status` chỉ hiện đúng 11 file `.mdx` được giao (sửa) + 12 file `.svg`
mới trong `src/assets/illustrations/tai-chinh/`. Không đụng file nào khác —
đối chiếu `git status --porcelain` loại trừ đúng pattern sở hữu, phần còn
lại toàn bộ thuộc các batch/phase khác đang chạy song song (kien-truc SVG +
mdx, `package.json`, `pnpm-lock.yaml`, `src/pages/*-index.json.ts`, các file
đã có sẵn trong git status snapshot đầu phiên).

## Unresolved questions

Không có. Mọi quyết định (vị trí chèn, cơ chế minh hoạ cho từng SVG, cách xử
lý bài tham khảo/nguồn "1-2 RealLife về CÁCH dùng nguồn") đã tự quyết theo
đúng guide + đối chiếu pilot, không cần user xác nhận thêm cho batch này.

Status: DONE
Summary: 11/11 lessons done — 22 RealLife (≤90 từ, kết "→", bối cảnh VN mới không trùng pilot) + 12 SVG mới (<15KB, 0 hex, id unique site-wide, XML valid) inserted as `<Figure added>`; anti-scam lesson viết phòng thủ (không kèm kịch bản lừa đảo); verify-fidelity + test đều pass; examplesReviewed giữ false; tự phát hiện và sửa 2 lỗi nhỏ (RealLife lồng nhầm trong Note, dấu ngoặc cong trong JSX attr) trước khi báo cáo.
Concerns/Blockers: none blocking.
