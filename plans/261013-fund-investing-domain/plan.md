# Lĩnh vực mới: Quỹ và đầu tư

Status: done · 2026-10-13

## Mục tiêu
Thêm lĩnh vực thứ 4 `dau-tu-quy`: kiến thức nền về đầu tư và chứng chỉ quỹ cho người mới, bối cảnh Việt Nam. Mọi khẳng định phải có nguồn kiểm tra được (văn bản pháp luật, cơ quan quản lý, nghiên cứu gốc); không suy đoán.

## Quyết định
- Domain mới, không chèn vào `tai-chinh` (fidelity HTML khoá cả domain) — cùng lý do với `nghe-tai-chinh`.
- Khuôn y hệt `nghe-tai-chinh`: snapshot markdown trong `content-sources/dau-tu-quy/<NN-module>/<NN-slug>.md`, MDX = snapshot + `<Disclaimer />` + `<RealLife>` + `<Figure added>`; không đặt `isFinance`.
- Giọng sách, nhân vật hư cấu mới: **Minh** (28 tuổi, kỹ sư phần mềm, lần đầu đầu tư) và **chị Thu** (bạn gia đình, nhiều năm làm phân tích đầu tư). Ghi rõ là hư cấu ở bài đầu.
- Không khuyến nghị quỹ/công ty cụ thể; không số liệu thời sự trừ khi có nguồn + ngày; ví dụ tính toán ghi "số giả định".
- **Ngôn ngữ dễ hiểu** (user yêu cầu 2026-10-13): câu ngắn, thuật ngữ nào cũng giải thích bằng lời thường ngay lần đầu xuất hiện (kèm tên tiếng Anh trong ngoặc nếu hay gặp), tránh văn phong pháp lý/học thuật; mỗi khái niệm chính có ví dụ minh hoạ bằng số giả định hoặc tình huống đời thường. Mỗi bài có mục "Tóm tắt nhanh" và bảng thuật ngữ ngắn.
- Kiểm chứng 2 vòng: researcher tự đối chiếu nguồn gốc → fact-checker độc lập đọc lại nguồn trước khi đặt `examplesReviewed: true`.

## Modules (7 × 2 bài = 14)
| # | id | Bài 01 | Bài 02 |
|---|---|---|---|
| 1 | nen-tang | Rủi ro, lợi nhuận, lạm phát, lãi kép | Đa dạng hoá, phân bổ tài sản, khẩu vị rủi ro |
| 2 | quy-la-gi | Cơ chế quỹ, NAV, các bên liên quan | Khung pháp lý VN và quyền nhà đầu tư |
| 3 | loai-quy | Quỹ mở, quỹ đóng, ETF, quỹ thành viên, quỹ hưu trí tự nguyện | Theo tài sản: cổ phiếu, trái phiếu, cân bằng, tiền tệ; chủ động vs chỉ số |
| 4 | chi-phi-tai-lieu | Phí và thuế | Đọc bản cáo bạch, điều lệ, báo cáo quỹ |
| 5 | danh-gia-quy | Chỉ số đánh giá hiệu suất và rủi ro | Bằng chứng chủ động vs thụ động; quy trình chọn quỹ |
| 6 | chien-luoc | Đầu tư định kỳ, tái cân bằng, theo mục tiêu | Sai lầm hành vi |
| 7 | an-toan-nguon-hoc | Nhận diện lừa đảo, tra cứu giấy phép | Học ở đâu: sách tiếng Việt, nguồn chính thức |

## Phases
1. Nghiên cứu: 6 researcher song song → `reports/research-0N-*.md`
2. Viết 14 bài + snapshot + SVG (writer theo module, sở hữu file tách biệt)
3. Domain YAML, motif, test/check/build
4. Fact-check độc lập 3 nhóm → `reports/fact-check-*.md`, sửa, đặt `examplesReviewed: true`
5. README, codebase-summary, roadmap; commit, push main

## Acceptance
- `pnpm test`, `pnpm check`, `pnpm build` pass.
- Mỗi số liệu/khẳng định pháp lý trong bài có nguồn ở mục Nguồn; điều chưa xác minh không đưa vào bài.
- Văn bản pháp luật ghi kèm văn bản sửa đổi còn hiệu lực tại 2026-10-13.

## Kết quả
- 14 bài, 26 SVG, 25 RealLife; `examplesReviewed: true` cả 14 bài sau 4 fact-checker độc lập (`reports/fact-check-{a,b,c,d}-*.md`).
- Fact-check bắt 13 lỗi Sai mà research + writer bỏ sót, đã sửa. Đáng kể nhất (văn bản hết hiệu lực/đã sửa): TT 102/2021 biểu giá bị bãi bỏ từ 02/08/2025 (TT 42/2025); Luật BHTG 06/2012 thay bằng 111/2025 từ 01/05/2026; TT 197/2015 thay bằng TT 135/2025 từ 09/02/2026; TT 136/2025 Điều 7 sửa nơi công bố NAV (Sở giao dịch chỉ khi CCQ niêm yết). Khác: Investor.gov nói quỹ dự phòng "song song khi đầu tư" (không phải "trước khi"); VSDC là Điều 52/61 (không phải 53); quỹ đóng được tăng vốn (Điều 112); phép tính hụt 180 → 143,5 triệu; "phí góp phần vào khoảng cách hành vi" không có nguồn.
- `pnpm test` 737/737, `pnpm check` 0 lỗi, `pnpm build` (gồm verify-fidelity) xanh; xem trang lĩnh vực + bài học ở theme sáng/tối bằng Chrome headless.

## Cần rà lại
- Sau kỳ họp Quốc hội 10/2026 (dự thảo sửa Luật Chứng khoán): `quy-la-gi/khung-phap-ly`, `an-toan-nguon-hoc/*` (số Điều 9, 12, 97, 110).
- Số liệu có kỳ: CPI 9/2026, Morningstar Mind the Gap 2026, Active/Passive giữa 2026.
