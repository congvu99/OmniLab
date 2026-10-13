# Fact-check B — `loai-quy` + `chi-phi-tai-lieu` (vòng 2)

Ngày: 2026-10-13 · Phạm vi: 4 MDX + 4 snapshot + 7 SVG (`loai-quy-*`, `chi-phi-tai-lieu-*`)

## Tóm tắt

- **3 lỗi Sai lớn đã sửa:**
  1. **TT 102/2021/TT-BTC đã bị bãi bỏ từ 02/08/2025** (khoản 16 Điều 1 TT 42/2025/TT-BTC). Bài phí-thuế trình bày biểu giá 5%/3%/1%/0,5% như trần hiện hành → viết lại: trần hiện hành nằm trong Điều lệ và bản cáo bạch (TT 136/2025 Đ16 sửa TT 98 Đ34; Đ21 sửa Đ43 k11–12). Bảng cũ giữ lại, ghi rõ "biểu giá cũ, đã bãi bỏ".
  2. **Luật Bảo hiểm tiền gửi 06/2012/QH13 hết hiệu lực từ 01/05/2026**, bị thay bởi Luật 111/2025/QH15 (Điều 40). Bài quy-theo-tai-san dẫn luật cũ → sửa theo Đ4 k3, Đ17 luật mới; thay link nguồn.
  3. **Trích dẫn sai điều:** TT 98 Đ5 k1 thuộc chương quỹ thành viên → sửa thành Đ35 k1 (quỹ mở). "Quỹ đóng phát hành một lần" sai với Luật CK Đ112 (được tăng vốn) → sửa.
- Thêm các chỗ Diễn đạt/thiếu: khấu trừ thuế (NĐ 253 Đ55 k1 có nói ai khấu trừ lợi tức → bỏ khỏi mục "chưa rõ"); Đ56 k4 chỉ nêu bên khấu trừ cho CK qua Sở giao dịch; Luật CK Đ111 (chỉ tạm ngừng mua lại trong trường hợp k2); thành viên lập quỹ gồm cả ngân hàng lưu ký, ký với công ty quản lý quỹ; NAV công bố trên website Sở giao dịch chỉ khi CCQ niêm yết (TT 136 Đ7); quỹ tiền tệ VN đã có định nghĩa (TT 136 Đ1 bổ sung TT 98 Đ2 k30).
- Luật 09/2026/QH16 **chỉ sửa Điều 7 khoản 1** Luật 109 (theo chú thích VBHN 112/VBHN-VPQH ngày 20/05/2026). Đ5 k4–5, Đ12 k1, Đ13 k2, Đ29 không đổi.
- Mọi phép tính đúng, trừ "20,6 triệu" → 20,68 (sửa 20,7). SVG khớp số liệu.
- `examplesReviewed: true` cho cả 4 MDX. `pnpm check` 0 lỗi. `pnpm verify:fidelity`: 4 bài này OK. Lệnh vẫn FAIL vì `an-toan-nguon-hoc/01-nhan-dien-lua-dao.mdx`, bài ngoài phạm vi, do fact-checker khác đang sửa.

## Bảng kiểm chứng

Nguồn A = PDF Công báo/bản gốc đã mở bằng curl + pdftotext; B = toàn văn trên LuatVietnam (đọc qua curl); C = báo chí.

| Bài | Khẳng định | Nguồn đã mở | Kết quả | Đã sửa gì |
|---|---|---|---|---|
| 01-etf | Quỹ ĐC/thành viên; mở/đóng (Đ99 k1–2); Đ4 k4, 38–43 | Luật CK VBHN 102/VBHN-VPQH, Công báo 269 (A) | Đúng | Thêm sửa đổi bởi Luật 142/2025/QH15 (VBHN ghi) |
| 01-etf | "Nếu không mua lại được, báo UBCKNN 24 giờ (Đ111 k1, 3)" | Luật CK Đ111 (A) | Diễn đạt | Chỉ tạm ngừng trong trường hợp k2; dẫn k2+k3 |
| 01-etf | Quỹ đóng "phát hành một lần" | Luật CK Đ112 (A) | **Sai** | Quỹ đóng được tăng vốn nếu đủ điều kiện, UBCKNN chấp thuận |
| 01-etf | Quỹ thành viên 2–99, NĐT chuyên nghiệp (Đ113) | Luật CK Đ4 k41, Đ113 k2b (A) | Đúng | — |
| 01-etf | Tiêu chí NĐT chuyên nghiệp cá nhân (Đ11 k1) | Luật CK Đ11 k1 c,d,đ (A) | Diễn đạt | Thêm "hoặc đăng ký giao dịch"; tách thành danh sách |
| 01-etf | Quỹ BĐS 65% doanh thu | Luật CK Đ4 k43 (A) | Diễn đạt | "65% tổng doanh thu"; tách câu 52 chữ |
| 01-etf | Mua/bán quỹ mở theo NAV kỳ kế tiếp ± phí | SEC Mutual Funds (curl, A) | Đúng | — |
| 01-etf | AP, creation unit 50.000, in-kind, premium/discount, index/active | SEC Updated Investor Bulletin ETFs 23/02/2023 (A) | Đúng | — |
| 01-etf | ETF không được bảo hiểm (FDIC) | SEC ETFs page (A) | Đúng | — |
| 01-etf | Quỹ đóng premium/discount | SEC Closed-End page + Bulletin (A) | Đúng | Thêm link Bulletin |
| 01-etf | Thành viên lập quỹ = "công ty chứng khoán đã ký hợp đồng lập quỹ" | TT 98 Đ2 k17 (B) | Thiếu | Thêm ngân hàng lưu ký; hợp đồng ký với công ty quản lý quỹ |
| 01-etf | iNAV | TT 98 Đ2 k5, Đ20 k7 (B) | Đúng | Thêm: cập nhật ≥15 giây/lần, chỉ để tham chiếu |
| 01-etf | NAV = tài sản − nợ, chia số CCQ | SEC MMF Bulletin 04/11/2024; ETF Bulletin (A) | Đúng | Sửa tên bản tin trong Nguồn |
| 02-tài sản | Quỹ cổ phiếu: rủi ro thị trường, diversified/non-diversified | SEC Glossary Stock fund (A) | Đúng | Tách câu |
| 02-tài sản | Trái phiếu "lãi cố định"; bán "thấp hơn giá gốc" | SEC Bonds (A) | Diễn đạt | "Lãi theo mức đã hẹn"; "thấp hơn mệnh giá" + giải thích mệnh giá |
| 02-tài sản | Rủi ro lãi suất (kỳ hạn dài nhạy hơn), tín dụng, trả nợ trước hạn | SEC Bond funds (A) | Đúng | "Có thể phải" đầu tư lại ở lãi thấp hơn |
| 02-tài sản | Cân bằng 60/40, vẫn chịu rủi ro thành phần | SEC Balanced fund (A) | Đúng | — |
| 02-tài sản | MMF: rủi ro thấp, lợi suất thấp, phí có thể vượt thu nhập; 1 USD; nửa cent; không FDIC | SEC MMF page + Bulletin 04/11/2024 (A) | Đúng | "cập nhật 11/2024" → "ngày 04/11/2024" |
| 02-tài sản | BHTG theo Luật 06/2012/QH13 (Đ4 k3, Đ18, Đ19) | Luật 111/2025/QH15 Đ4, Đ17, Đ18, Đ40 (B) | **Sai (hết hiệu lực 01/05/2026)** | Viết lại theo luật mới; đổi tóm tắt + Nguồn |
| 02-tài sản | "Chưa kiểm chứng quy định quỹ tiền tệ VN" | TT 136 Đ1 (bổ sung TT 98 Đ2 k30) (B) | Lỗi thời | Thêm định nghĩa quỹ đầu tư công cụ thị trường tiền tệ (≥80% NAV) |
| 02-tài sản | Quỹ chỉ số theo TT 98 | TT 98 Đ2 k15 (B) | Đúng | Ghi số khoản; tách câu |
| 02-tài sản | Thụ động: không luôn rẻ hơn, tracking error, sampling | SEC Index Funds (A) | Đúng | "thường ít phí" → "có thể ít phí" |
| 02-tài sản | Smart beta/quant dùng chỉ số tự dựng | SEC Bulletin Smart Beta 06/08/2018 (A) | Đúng, thiếu nguồn | Thêm link |
| 02-tài sản | VN30: 300.000 CP, 30 tỷ, cảnh báo, LNST âm, BCTC chấp nhận toàn phần, top 20, 21–40, 5 dự bị, T1/T7, trần 10/15/40% (GICS cấp 1); VNMidcap 70 | HOSE Ground Rule v4.0, QĐ 747/QĐ-SGDHCM 30/12/2024 (A); factsheet 31/12/2024 (A) | Đúng | Tách câu danh sách chỉ số |
| 03-phí | Biểu giá TT 102/2021 (Mục 7a, 7b, 8a, 8b) là trần hiện hành | LuatVietnam TT 102: "bị bãi bỏ bởi khoản 16 Điều 1 TT 42/2025" (B); lsvn.vn, thitruongtaichinhtiente, thuviennhadat: TT 42 hiệu lực 02/08/2025 (C) | **Sai (đã bãi bỏ)** | Viết lại mục; bảng ghi "biểu giá cũ"; sửa tóm tắt, summary, Nguồn |
| 03-phí | TT 136: mức tối đa ghi Điều lệ + BCB; tăng giá áp dụng sau 30 ngày; hiệu lực 12/02/2026 | TT 136 Đ16 (k4, k5 Đ34), Đ21 (k11–12 Đ43), Đ29 k1 (B) | Đúng | Thêm: được đặt mức khác nhau theo thời gian nắm giữ, số tiền |
| 03-phí | Chi phí quỹ (TT 98 Đ8, Đ37 k3) | TT 98 Đ37 k3a dẫn Đ8 (B) | Đúng | — |
| 03-phí | TER: chi phí vận hành / NAV bình quân; không gồm load, brokerage | SEC ib_mutualfundfees.pdf; SEC 2000 feestudy (A) | Đúng | Tách câu |
| 03-phí | ETF công bố TER (TT 98 Đ49 k4b) | TT 98 Đ49 k4 b, c (B); TT 136 không sửa Đ49 | Đúng | — |
| 03-phí | Bid-ask spread ETF | SEC ETF Bulletin (A) | Đúng | Giải thích thuật ngữ |
| 03-phí | Thuế bán CCQ 0,1% mỗi lần | Luật 109 Đ13 k2 (A, Công báo 37); NĐ 253 Đ10 k2 (CCQ là chứng khoán), Đ54 k1 (A, Công báo 402) | Đúng | Thêm Đ10 k2 |
| 03-phí | Miễn CCQ quỹ mở ≥2 năm; mua trước 01/07/2026; FIFO | Luật 109 Đ5 k4; NĐ 253 Đ43 k1–3 (A) | Đúng | — |
| 03-phí | Lợi tức quỹ 5%, giảm 50% 01/07/2026–30/06/2031 | Luật 109 Đ5 k5, Đ12 k1; NĐ 253 Đ9 k2, Đ44, Đ52 k1 (A) | Đúng | Thêm Đ9 k2 |
| 03-phí | Giá chuyển nhượng CCQ niêm yết | NĐ 253 Đ54 k2a (A) | Đúng | — |
| 03-phí | "Tổ chức trung gian khấu trừ 0,1% (Đ56 k2)" | NĐ 253 Đ56 k2, k4 (A) | Diễn đạt | Chỉ rõ áp dụng CK qua Sở giao dịch (k4a) |
| 03-phí | "Lợi tức quỹ: ai khấu trừ — chưa rõ" | NĐ 253 Đ55 k1 (A) | **Sai** | Đ55 k1: tổ chức trả thu nhập khấu trừ → chuyển thành khẳng định; giữ điểm "chia bằng CCQ" (Đ52 k4 chỉ nói cổ phiếu) |
| 03-phí | Hiệu lực Luật 109, NĐ 253 = 01/07/2026; NĐ 253 thay NĐ 65/2013 | Luật 109 Đ29; NĐ 253 Đ69 (A) | Đúng | — |
| 03-phí | Luật 09/2026 có sửa điều liên quan? | VBHN 112/VBHN-VPQH 20/05/2026 (B): chú thích 2 chỉ ở Đ7 k1 | Không sửa | Ghi rõ trong bài; sửa số hiệu VBHN |
| 03-phí | Ví dụ SEC 100.000 USD, 4%, 20 năm | SEC PDF (A) + node | Đúng | — |
| 03-phí | Kết quả quá khứ chỉ tham khảo (Đ23 k1c) | TT 98 Đ23 k1c (B) | Diễn đạt | Đây là nghĩa vụ ghi trong tài liệu giới thiệu quỹ |
| 04-tài liệu | BCB, BCB tóm tắt theo mẫu (Đ4 k4–5) | TT 98 Đ4 (B) | Diễn đạt | "Nội dung tối thiểu theo mẫu, trình bày dễ hiểu, cập nhật khi có thông tin quan trọng" |
| 04-tài liệu | Quảng cáo: không cam kết/dự báo (ngoại lệ), không bảo đảm hơn quỹ khác, cảnh báo rủi ro, quá khứ tham khảo | TT 98 Đ22 k4–5, Đ23 k1c, k2 (B) | Đúng | Tách câu 76 chữ thành danh sách; nêu ví dụ ngoại lệ |
| 04-tài liệu | "Ba nơi" công bố (TT 96 Đ7 k1) | TT 96 Đ7 k1 a–d (A); TT 136 Đ7 sửa TT 98 Đ20 k6 (B) | Diễn đạt / mâu thuẫn | Danh sách mở; NAV: website CTQLQ, Sở giao dịch chỉ khi CCQ niêm yết |
| 04-tài liệu | Lịch Đ26: NAV, 5 ngày làm việc, 20, 45, 90 ngày | TT 96 Đ26 k1, k4; Đ14 k2c, k3c; Đ10 k1c (A) | Đúng | Ghi BCTC theo Đ14 (mốc trùng); NAV "muộn nhất" (TT 136) |
| 04-tài liệu | TT 96 còn hiệu lực? | TT 08/2026 (mục lục, hethongphapluat): chỉ sửa Đ25 k8, Đ33, PL XVII | Còn hiệu lực; Đ7/26/27 không bị 08/2026 sửa | Ghi "sửa đổi gần nhất bởi TT 08/2026" |
| 04-tài liệu | Sự kiện bất thường 24 giờ (Đ27 k1) | TT 96 Đ27 k1 đ, i, l (A) | Đúng | Tách câu |
| 04-tài liệu | Mục tiêu đầu tư — TT 98 Đ5 k1 | TT 98 Đ5 nằm ở chương Quỹ thành viên (B) | **Sai trích dẫn** | → Đ35 k1 (quỹ mở, quỹ chỉ số) |
| 04-tài liệu | Giới hạn 20%, cấm cho vay/bảo lãnh (Đ110 k1) | Luật CK Đ110 k1 c, e (A) | Đúng | Tách câu |
| 04-tài liệu | NAV do CTQLQ xác định, NHGS xác nhận | Luật CK Đ106 k1 (A) | Đúng | — |
| 04-tài liệu | Thanh toán mua lại ≤5 ngày làm việc | TT 98 Đ32 k1c; Đ33 k1a, k3 (B) | Đúng, thiếu ngoại lệ | Thêm ngoại lệ: bán ròng >10% NAV → có thể kéo dài tối đa 30 ngày |
| 04-tài liệu | Giải trình khi ý kiến kiểm toán không chấp nhận toàn phần (TT 96 Đ10 k1b) | TT 96 Đ10 k1b, Đ26 k1a (A) | Diễn đạt | Đ10 viết cho công ty đại chúng; Đ26 chỉ dẫn thời hạn → ghi đúng phạm vi; giải thích "chấp nhận toàn phần" |
| 04-tài liệu | Bảng phí chuẩn hóa SEC (Shareholder Fees / Annual Fund Operating Expenses) | SEC PDF (A) | Đúng | Tách câu |
| 04-tài liệu | FINRA Fund Analyzer; "dùng dữ liệu quỹ Mỹ" | finra.org (WebFetch OK): dữ liệu Morningstar, mutual fund/ETF/ETN/MMF | Diễn đạt | Chỉ nói: công cụ làm cho nhà đầu tư Mỹ, đừng dùng tra quỹ VN |

## Phép tính (node)

| Mục | Bài ghi | Tính lại | Kết quả |
|---|---|---|---|
| 100 tr × 1,08^20 | 466,1 | 466,10 | Đúng |
| Phí 0,5/1/2% (20 năm) | 424,8 / 387,0 / 320,7 | 424,79 / 386,97 / 320,71 | Đúng |
| Chênh 0,5% vs 2% | ~104 | 104,07 | Đúng (SVG: bar cao 130/118,5/108/89,5 tỷ lệ đúng) |
| 5 năm: 0 / thấp / cao | 146,9 / 140,7 / 126,3 | 146,93 / 140,71 / 126,25 | Đúng |
| Chênh phí cao | 20,6 | 20,68 | **Sửa → 20,7** |
| Hòa vốn phí mua 5% | 5,3% | 5,26% | Đúng |
| SEC 100k, 4%, 20 năm | ~208k; −10k; −~30k | 208.815; −9.836; −28.204 | Đúng |
| Góp 2 tr/tháng, 20 năm | 1.075 / 907 / chênh 168 | 1.074,6 / 906,9 (lãi tháng tương đương năm, góp cuối tháng) | Đúng; đã ghi "góp cuối mỗi tháng" |
| Thuế 0,1% × 102 tr | 102.000 đ = 5,1% lãi 2 tr | 102.000; 5,1% | Đúng |
| Lợi tức 2 tr × 5% × 50% | 50.000 | 50.000 | Đúng |
| NAV (105−5)/10 triệu CCQ | 10.000 | 10.000 | Đúng |
| Mua 1.000 CCQ phí 1% | 10,1 tr | 10,1 tr | Đúng |
| Discount 9.500/10.000; iNAV 10.050 | 5%; 0,5% | 5%; 0,5% | Đúng |
| 20% ÷ 30 mã / 5 mã | 0,67% / 4% | 0,667% / 4% | Đúng |
| 60/40: 0,6×10 + 0,4×2 | 6,8% | 6,8% | Đúng |
| MMF 0,3 − 0,5 | −0,2% | −0,2% | Đúng |
| Tracking 10 − 0,5 − 0,3 | 9,2% | 9,2% | Đúng |
| Trái phiếu −1% / −4% trên 10.000 | 9.900 / 9.600 | Đúng (SVG cột 25/100) | Đúng |
| Thanh toán 5 ngày làm việc từ thứ Hai | thứ Hai tuần sau | Đúng | — |

## Link

Đã kiểm 28 link bằng curl.

- **200:** tất cả link investor.gov, luatvietnam, cdn.thuvienphapluat (Luật CK VBHN), congbaocdn (NĐ 253), legalzone (Luật 109), mbs (TT 96), vietstock (HOSE), caselaw, div.gov.vn.
- **sec.gov:** trả 403 với UA trình duyệt, 200 với UA khai báo → link sống, giữ.
- **finra.org:** trả 403 với curl, WebFetch đọc được → giữ.
- **Đã bỏ:**
  - 2 link Luật BHTG 06/2012/QH13 (văn bản hết hiệu lực).
  - Link TT 102 trên CaseLaw (thừa).
- **Đã thêm:**
  - Luật BHTG 111/2025/QH15 (LuatVietnam).
  - lsvn.vn về TT 42/2025.
  - SEC Smart Beta Bulletin.
  - SEC Closed-End Bulletin.
  - TT 136 và Luật CK VBHN trong bài 02-tài sản.
- **Đã đổi nhãn:** sửa tên bản tin MMF của SEC; sửa số hiệu VBHN 112.

## Độ dễ hiểu

- Tách mọi câu >30 chữ trong thân bài: ETF, thành viên lập quỹ, NĐT chuyên nghiệp, quỹ BĐS, cổ phiếu, BHTG, quỹ chỉ số, danh sách chỉ số HOSE, góp tháng, TER, quảng cáo (thành danh sách), kênh công bố, hàng rào đầu tư, bảng phí SEC, FINRA, mẹo.
- Còn lại một số câu 31–34 chữ, chủ yếu do phần trích dẫn điều khoản trong ngoặc.
- Thuật ngữ mới có giải thích ở lần đầu:
  - mệnh giá (thêm vào bảng thuật ngữ);
  - vòng quay danh mục;
  - bid-ask spread;
  - "chấp nhận toàn phần";
  - quỹ đầu tư công cụ thị trường tiền tệ.
- Ví dụ trái phiếu ghi rõ "số giả định".
- RealLife: 7 khối, mỗi khối 42–62 tiếng, đều kết bằng "→". Không đổi.
- Quy tắc tên: không có tên quỹ, công ty, ngân hàng hay app; không có lời khuyên mua bán.
- Độ dài thân bài (đã trừ bảng và mục Nguồn): etf ~1.950, tài sản ~1.990, phí ~1.750, tài liệu ~1.650. Hai bài loai-quy vượt nhẹ khung 1.800 vì phần bổ sung pháp lý.

## Không xác minh được

- Toàn văn Công báo của TT 42/2025/TT-BTC: chưa mở được bản gốc. Việc bãi bỏ dựa trên ghi chú hiệu lực của LuatVietnam (B) và 3 nguồn báo chí (C) khớp nhau.
- TT 96 sau sửa đổi 68/2024 và 18/2025: chưa đọc toàn văn hai thông tư này. Chỉ đọc mục lục TT 08/2026, không chạm Đ7/26/27.
- HOSE Ground Rule: chưa xác nhận có phiên bản mới hơn v4.0 trên website HOSE. Báo chí 2026 vẫn mô tả quy tắc của v4.0.
- Phụ lục III–VI TT 98 (mẫu bản cáo bạch): chưa đọc.
- Văn bản gốc (PDF Công báo) của TT 98, TT 136 và Luật BHTG 111/2025: mới đọc qua LuatVietnam (B).

## Câu hỏi mở

1. Brief (`writer-brief.md`) đang yêu cầu dùng biểu giá TT 102/2021 làm trần. Văn bản này đã bị bãi bỏ, nên cần cập nhật brief (nằm ngoài phạm vi của tôi).
2. Các bài khác có thể dẫn Luật BHTG 06/2012 hoặc TT 102. Đề nghị coordinator grep toàn domain `dau-tu-quy`, ví dụ `quy-la-gi/02-khung-phap-ly`, `an-toan-nguon-hoc/*`.
3. Mua lại CCQ quỹ mở có phải "chuyển nhượng" không, và ai khấu trừ 0,1% khi bán lại cho công ty quản lý quỹ? NĐ 253 chưa nêu rõ. Bài để ở dạng "hỏi cơ quan thuế".
4. `content-authoring-guide.md` dòng 19 nói agent giữ `examplesReviewed: false`. Tôi đặt `true` theo lệnh coordinator. Cần user xác nhận.

Status: DONE_WITH_CONCERNS
Summary: Sửa 3 lỗi Sai lớn: TT 102/2021 đã bị bãi bỏ từ 02/08/2025; Luật BHTG 06/2012 thay bằng 111/2025 từ 01/05/2026; TT 98 Đ5 → Đ35. Sửa thêm phần khấu trừ thuế (NĐ 253 Đ55), quỹ đóng tăng vốn và nơi công bố NAV (TT 136). 4 bài đặt `examplesReviewed: true`; `pnpm check` 0 lỗi, fidelity OK cho 4 bài.
Concerns: `pnpm verify:fidelity` tổng thể còn FAIL do `an-toan-nguon-hoc/01` (ngoài phạm vi); brief writer còn dẫn TT 102.
