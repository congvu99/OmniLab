# R5 — Đánh giá quỹ, chiến lược và hành vi

Ngày: 2026-10-13 · Phạm vi: `danh-gia-quy/01-02`, `chien-luoc/01-02` · Plan: `261013-fund-investing-domain`

## Tóm tắt

- Đã xác minh từ bản gốc (mở được): Vanguard 2012 (DCA), Barber & Odean 2000, Sirri & Tufano 1998, Vanguard 2010 (rebalancing), Vanguard Principles (2023), GIPS 2020, Sharpe 1966 (định nghĩa), Vanguard tracking difference/TE (2026).
- Đã xác minh từ 2 nguồn thứ cấp đã mở, khớp nhau: Morningstar Mind the Gap 2026 (dữ liệu đến 31/12/2025), Morningstar Active/Passive giữa năm 2026 (Mỹ).
- Vanguard 2012 xác nhận: LSI thắng DCA xấp xỉ 2/3 thời kỳ (Mỹ 67%, Anh 67%, Úc 66%; 60/40, DCA 12 tháng).
- Chưa lấy được số SPIVA mới nhất. spglobal.com chặn (403, kể cả curl). Số 79% (YE 2025) và 67% (H1 2026) chỉ thấy trong tóm tắt thứ cấp: KHÔNG dùng trong bài đến khi mở được PDF gốc.
- Morningstar gốc, SEC/Investor.gov, thuvienphapluat, Fahasa chặn truy cập. Bằng chứng học thuật Việt Nam (2 luận án Nottingham) chưa mở được: không dùng.
- Sách tiếng Việt: xác nhận được Malkiel (2009) và Kahneman (2014) qua bản ghi Thư viện số Quốc hội. Chưa thấy bản Việt của Housel và Bogle.
- Status: DONE_WITH_CONCERNS.

## Khuyến nghị xếp hạng (ưu tiên nguồn cho bài)

1. Vanguard 2012 DCA: A. Thiết kế nghiên cứu rõ, số đối chiếu được. Dùng làm trụ cột cho chien-luoc/01.
2. Barber & Odean 2000: A. Dữ liệu 66.465 hộ, bản JF. Dùng cho chien-luoc/02 (giao dịch quá nhiều). Giới hạn: giai đoạn 1991–1996.
3. Sirri & Tufano 1998: A. Dùng cho đuổi hiệu suất.
4. GIPS 2020: A. Chuẩn trình bày của công ty quản lý, không phải luật quỹ Việt Nam. Dùng để chuẩn hóa định nghĩa chỉ số.
5. Vanguard 2010 (rebalancing): A. Bản sao PDF, nội dung khớp tiêu đề Vanguard.
6. Morningstar Mind the Gap 2026: B. Số khớp 2 bài thứ cấp; bản gốc chặn. Dùng có ghi "Mỹ, 10 năm đến 31/12/2025".
7. Morningstar Active/Passive giữa năm 2026: B. Chỉ dùng số 1 năm.
8. SPIVA (YE 2025, H1 2026, Persistence): chưa mở bản gốc. Chỉ dùng sau khi người có quyền truy cập mở PDF và đối chiếu.

Lý do xếp hạng: nguồn học thuật gốc (JF, Econometrica) và tài liệu nghiên cứu của Vanguard/GIPS có kiểm chứng độc lập và ít đổi số. Báo cáo định kỳ của S&P/Morningstar cập nhật hằng năm hoặc nửa năm, dễ lỗi thời.

## Phương pháp và mức tin cậy

- A: bản gốc hoặc bản sao PDF mở được (WebFetch hoặc tải về rồi pdftotext).
- B: nguồn thứ cấp đã mở bằng WebFetch; số khớp ≥2 nguồn.
- C: chỉ có trong kết quả tìm kiếm hoặc tóm tắt. Không dùng số.
- Chặn: spglobal.com (403, kể cả curl), morningstar.com (403/429), investor.gov và sec.gov (403/chuyển hướng), thuvienphapluat.vn (403), vbpl.moj.gov.vn (không phân giải DNS), fahasa.com (403), tiki.vn (không có kết quả), jstor.org (lỗi), SSRN (socket đóng), DALBAR (403).
- Rủi ro lỗi thời: SPIVA (cập nhật giữa năm và cuối năm), Morningstar Mind the Gap (1 lần/năm, tháng 8), Morningstar Active/Passive (giữa năm và cuối năm), GIPS 2020 (có thể có edition mới), TT 98/2020/TT-BTC đã được sửa bởi TT 136/2025/TT-BTC. Kiểm lại trước khi publish.

## 1. danh-gia-quy/01 — Chỉ số đánh giá

### Xếp hạng chỉ số cho người mới

1. Lợi nhuận nhà đầu tư thực nhận (dollar-weighted) so với lợi nhuận quỹ (time-weighted). Quan trọng nhất: NAV không phản ánh thời điểm người học mua/bán. Liên kết với chien-luoc/02.
2. Lợi nhuận năm hóa (CAGR). Đơn vị so sánh cơ bản; luôn ghi kèm kỳ.
3. Mức sụt giảm tối đa (max drawdown). Đo trải nghiệm thực tế, dễ hiểu.
4. Độ lệch chuẩn và Sharpe. Cần để so rủi ro/lợi nhuận, nhưng dễ hiểu sai.
5. Chỉ số tham chiếu, tracking difference, tracking error. Chỉ dùng cho quỹ chỉ số hoặc khi so với benchmark.
6. Beta. Nâng cao; chỉ giới thiệu khái niệm.

### Định nghĩa dùng trong bài

| Chỉ số | Định nghĩa | Nguồn đã mở | Mức |
|---|---|---|---|
| Sharpe | (lợi suất vượt lãi suất phi rủi ro) / độ lệch chuẩn của lợi suất vượt. Ex ante là kỳ vọng; ex post là trung bình lịch sử. Không tính tương quan. Dùng ex post không hiệu chỉnh làm thay thế dự báo "subject to serious question" | Sharpe, trang cá nhân: https://web.stanford.edu/~wfsharpe/art/sr/SR.htm | A |
| Sharpe 1966 | "Mutual Fund Performance", Journal of Business, tháng 1/1966, tr. 119–138 (ban đầu gọi "reward-to-variability") | Cùng URL trên | A |
| Sharpe 1994 | "The Sharpe Ratio", đăng lại từ Journal of Portfolio Management, số Fall 1994 (trang chưa xác minh) | Cùng URL trên | A (không có trang) |
| Độ lệch chuẩn | GIPS yêu cầu công bố độ lệch chuẩn ex post 3 năm annualized theo lợi suất hằng tháng; kỳ trên 3 năm thì nên công bố | GIPS 2020 firms: https://www.gipsstandards.org/wp-content/uploads/2021/03/2020_gips_standards_firms.pdf (mục composite, ý j và 4.C.36) | A |
| TWR / MWR | Mặc định phải trình bày time-weighted return; money-weighted chỉ khi công ty kiểm soát dòng tiền và danh mục là đóng, kỳ cố định, cam kết vốn cố định, hoặc nhiều tài sản ít thanh khoản (mục 1.A.35) | GIPS 2020 (cùng URL) | A |
| Net-of-fees | Lợi suất net phải trừ phí quản lý và chi phí giao dịch; sub-period nối bằng phương pháp hình học ("geometrically link") | GIPS 2020 (cùng URL) | A |
| Hiệu lực GIPS | Edition 2020 có hiệu lực từ 1/1/2020; báo cáo có kỳ kết thúc từ 31/12/2020 phải theo 2020 | GIPS 2020 (cùng URL) | A |
| Tracking difference | Lợi suất total return của quỹ trừ lợi suất total return của chỉ số trong một kỳ; có thể dương hoặc âm | Vanguard UK, "What affects index tracking?", cập nhật 04/01/2026: https://www.vanguard.co.uk/content/uk-aem/gb/en/professional/vanguard-365/investment-knowledge/etf-knowledge/what-affects-index-tracking | A |
| Tracking error | Độ lệch chuẩn năm hóa của tracking difference. Các nhà cung cấp tính khác nhau; so sánh phải cùng phương pháp | Cùng URL Vanguard UK | A |
| Max drawdown | Mức giảm lớn nhất từ đỉnh đến đáy trước khi lập đỉnh mới | Magdon-Ismail & Atiya, "Maximum Drawdown", Risk 17(10), 2004, tr. 99–102 (abstract qua tìm kiếm; bản đầy đủ paywall). Các mô tả thứ cấp khớp | B- |
| CAGR | Lợi suất bình quân hình học năm: (giá trị cuối / giá trị đầu)^(1/n) − 1. Liên hệ "geometrically link" trong GIPS | Công thức tự suy từ GIPS (cùng URL). Không cần nguồn riêng | A (định nghĩa) |
| Beta | Độ nhạy của quỹ với thị trường; là phần rủi ro hệ thống không thể đa dạng hóa | Sharpe, JF 19(3), 1964, tr. 425–442 (nhiều nguồn thứ cấp khớp; bản gốc chưa mở) | B- |
| Phương sai/độ lệch chuẩn | Markowitz coi phương sai là thước đo rủi ro danh mục; JF 7(1), 1952, tr. 77–91 | Citation JSTOR qua tìm kiếm (chưa mở bản gốc) | B- |

### Ví dụ tính toán (số giả định)

- Quỹ 100 → 200 trong 5 năm: CAGR = 2^(1/5) − 1 = 14,87%/năm.
- Sụt từ 100 xuống 70 (drawdown 30%): cần +42,9% để về 100 (100/70 − 1).
- Dollar-weighted (xem bài 02 mục 4): NAV 100 → 200 → 100, không đổi trong 2 năm. Nếu người mua thêm 100 triệu ở đỉnh 200, người đó lỗ 25% (giá trị 150 triệu trên 200 triệu đầu tư). Số tính từ giả định trên.

### Trade-off và rủi ro áp dụng

- Sharpe: đơn giản, dễ so; nhưng ex post, không tính tương quan, nhạy với kỳ đo. Không dùng để kết luận "quỹ tốt" nếu không kèm drawdown.
- Max drawdown: trực quan; phụ thuộc chu kỳ dữ liệu. Một cú sốc có thể chi phối số liệu.
- Tracking error: đo độ bám chỉ số, không đo quỹ hơn hay kém. Tracking difference mới đo việc hơn/kém.
- Dollar-weighted: cần dữ liệu dòng tiền đầy đủ; người học không tự tính được. Chỉ dạy khái niệm.
- Chuẩn GIPS là chuẩn của công ty quản lý, không phải quy định Việt Nam. Ghi rõ khi trích.

## 2. danh-gia-quy/02 — Bằng chứng chủ động vs thụ động; chọn quỹ

### Bằng chứng dùng được

- Morningstar US Active/Passive Barometer giữa năm 2026 (dữ liệu đến 30/06/2026; khoảng 9.226 quỹ, khoảng 29 nghìn tỷ USD). Mức tin cậy B (bản Morningstar Úc mô tả báo cáo Mỹ). Trong 12 tháng đến 06/2026, "just over 40%" quỹ chủ động vừa còn sống vừa thắng bình quân passive có trọng số tài sản; tăng 7 điểm so với năm trước. Nhóm cổ phiếu Mỹ: 36%. Định nghĩa "survived and beat" đã loại trực tiếp quỹ đóng khỏi thành công; đây là ví dụ survivorship trong chính chỉ số.
- SPIVA Persistence bản 2024 (dữ liệu 2020–2024; mức B, qua bài của Robin Powell trên Evidence Investor, 19/09/2025). Không quỹ top-quartile large-cap nào năm 2020 còn top-quartile đến cuối 2024. Khoảng 25% quỹ top-quartile Mỹ giữ được top-quartile qua hai chu kỳ 3 năm liên tiếp. Bản 2025 chưa xác minh (xem mục 6).
- Survivorship trong SPIVA: mô tả (mức C, kết quả tìm kiếm từ tài liệu SPIVA cũ) là phương pháp có tính quỹ đã sáp nhập/thanh lý. Bỏ qua quỹ đóng làm phóng đại thành tích quỹ chủ động. Dùng định tính; kiểm lại phương pháp hiện hành trước khi trích.
- Việt Nam: chưa có bằng chứng đủ tin cậy (xem mục 6).

### Checklist chọn quỹ (xếp theo mức có cơ sở)

1. So với chỉ số tham chiếu đúng loại tài sản. Mức A (GIPS yêu cầu so với benchmark tương ứng).
2. Đọc lợi suất sau phí. Mức A (GIPS: net-of-fees trừ phí quản lý và chi phí giao dịch).
3. Xem kỳ dài, không chỉ 1 năm. Mức B (Morningstar 1 năm có tỷ lệ thắng thấp; persistence bản 2024 cho thấy top ngắn hạn không bền).
4. Kiểm danh sách so sánh có tính quỹ đóng/sáp nhập. Mức B (định nghĩa "survived" của Morningstar).
5. Xem chi phí và mức giao dịch của quỹ. Mức A (Barber & Odean, bài 02 mục 4).
6. Xem drawdown và (với quỹ chỉ số) tracking difference, tracking error. Mức A (GIPS, Vanguard).
7. Không chọn quỹ theo hiệu suất 1 năm vừa rồi. Mức A (Sirri & Tufano; xem bài 02 mục 4).

Trade-off: checklist dễ dạy nhưng người học phải tự tra phí, benchmark, lịch sử quỹ Việt Nam. Bài không khuyến nghị quỹ nào. Thiếu số liệu quỹ Việt Nam đủ tin cậy để so sánh định lượng.

Xếp hạng sức nặng bằng chứng cho bài: (1) Sirri & Tufano và Barber & Odean về hành vi (A); (2) Morningstar 1 năm 2026 (B); (3) SPIVA persistence 2024 (B, định tính); (4) SPIVA số liệu 2025–2026 (chưa xác minh; không dùng).

## 3. chien-luoc/01 — Đầu tư định kỳ (DCA), tái cân bằng, theo mục tiêu

### Vanguard 2012: DCA vs LSI (mức A)

- Tài liệu: "Dollar-cost averaging just means taking risk later", Vanguard research, tháng 7/2012; tác giả Anatoly Shtekhman, Christos Tasopoulos, Brian Wimmer. Bản đã đọc là bản sao PDF (militarymoneymanual.com); URL Vanguard chính thức trả 404. Nội dung khớp.
- Thiết kế: danh mục 60% cổ phiếu/40% trái phiếu; DCA 12 tháng là cơ sở; cửa sổ 10 năm lăn. Mỹ 1926–2011, Anh 1976–2011, Úc 1984–2011.
- Kết quả (Hình 1): LSI cho giá trị cao hơn ở Mỹ 67%, Anh 67%, Úc 66% số thời kỳ. Văn bản: "approximately two-thirds of the periods analyzed".
- Với DCA 36 tháng ở Mỹ: LSI thắng khoảng 90% thời kỳ 10 năm.
- Chênh lệch trung bình (Mỹ): giá trị cuối DCA $2.395.824 so với LSI $2.450.264, tức LSI hơn 2,3%. Số thứ cấp "1,8%" là số không khớp với bản gốc.
- Rủi ro sụt giảm (Mỹ, 1.021 cửa sổ 12 tháng lăn): LSI giảm giá trị ở 229 cửa sổ (22,4%), DCA ở 180 cửa sổ (17,6%). Mất trung bình $84.001 (LSI) so với $56.947 (DCA).
- Giới hạn trong chính bài: DCA từ thu nhập hàng tháng (lương) khác bài toán có tiền sẵn. Không so sánh trực tiếp hai trường hợp.
- Lập luận của bài: "delaying investment is itself a form of market-timing".

### Trade-off DCA vs LSI

- LSI: kỳ vọng cao hơn theo lịch sử (thị trường tăng); rủi ro hối tiếc cao hơn nếu thị trường giảm ngay sau khi đầu tư.
- DCA: giảm rủi ro sụt giảm ngắn hạn và hối tiếc; đổi lại có chi phí cơ hội lợi suất kỳ vọng.
- Khung nên dạy: "Nếu có tiền sẵn, lịch sử thường nghiêng về LSI; nếu DCA giúp giữ kỷ luật, đó là lựa chọn hành vi". Không khuyến nghị cá nhân.

### Tái cân bằng (Vanguard, tháng 7/2010; dữ liệu 1926–2009; mức A)

- Tác giả Colleen Jaconetti, Francis Kinniry Jr., Yan Zilbering. Bản sao PDF của indexacapital.com; nội dung khớp.
- Mục tiêu chính: "minimize risk relative to a target asset allocation, rather than to maximize returns".
- "No optimal frequency or threshold"; risk-adjusted returns không khác đáng kể giữa tái cân theo tháng, quý, năm; chi phí và số lần tăng mạnh theo tần suất.
- Ví dụ: tháng không ngưỡng cần 1.008 lần; năm với ngưỡng 10% cần 15 lần.
- Kết luận: với đa số danh mục cổ phiếu/trái phiếu đa dạng, theo dõi hằng năm hoặc nửa năm, tái cân khi lệch 5% là cân bằng hợp lý. Ưu tiên tái cân hằng năm khi có thuế hoặc chi phí/thời gian lớn.
- Chỉ ngưỡng (threshold-only) đòi theo dõi hằng ngày.

Xếp hạng cho người mới: (1) theo lịch hằng năm, kiểm tra lệch 5% khi xem; (2) theo ngưỡng — không phù hợp nếu không theo dõi thường xuyên. Vanguard research 2015 (cập nhật) chưa xác minh, không dùng.

### Mục tiêu và chân trời (Vanguard Principles for Investing Success, tháng 12/2023; mức A)

- Chân trời ngắn: tiết kiệm là yếu tố chính. Chân trời dài: lợi suất đóng vai trò lớn hơn. Trang nói: "As the time horizon increases, investment returns increase in importance."
- Phân bổ tài sản phải tính cả khả năng chịu lỗ thực tế ("risk capacity") gắn với chân trời và nhu cầu dòng tiền, không chỉ khẩu vị rủi ro.

## 4. chien-luoc/02 — Sai lầm hành vi

### Khoảng cách hành vi: Morningstar Mind the Gap 2026 (mức B)

- Phát hành: 5 hoặc 6/8/2026 (nguồn lệch một ngày). Dữ liệu: 1/1/2016–31/12/2025, gần 23.000 quỹ mở và ETF Mỹ.
- Nhà đầu tư (dollar-weighted): 8,7%/năm. Quỹ (time-weighted): 9,9%/năm. Khoảng cách khoảng 12% tổng lợi nhuận, khoảng 3,8 nghìn tỷ USD (ước tính Morningstar).
- Theo nhóm: cổ phiếu Mỹ 0,4% (Kitces: 0,44%); allocation 0,7%; sector 1,2%; alternative 1,6%. ETF 1,6% so với open-end 1,2%. Index 1,1%; index cổ phiếu Mỹ 0,1%.
- Morningstar nhận định khoảng cách "consistent with the gap that we have estimated in previous reports".
- Nguồn: Wealth Management (https://wealthmanagement.com/investing-strategies/investors-miss-out-on-12-of-fund-returns-over-decade) và Kitces (https://www.kitces.com/blog/weekend-reading-for-financial-planners-august-8-9-2026/). Hai nguồn khớp tổng thể. Kitces: 8,74% so với 9,89%, khoảng cách 1,15% cho mọi quỹ Mỹ.
- Trade-off: đây là chỉ số tổng hợp, không chỉ là lỗi hành vi. Thời điểm dòng tiền và phí cũng ảnh hưởng. Bài nên nói "khoảng cách" và nêu giới hạn đó.

### Giao dịch quá nhiều: Barber & Odean (JF, tập LV số 2, 2000; mức A)

- Dữ liệu: 66.465 hộ có tài khoản tại một công ty môi giới chiết khấu lớn, 1991–1996.
- Nhóm giao dịch nhiều nhất: lợi suất 11,4%/năm. Thị trường: 17,9%. Lợi suất trung bình hộ: 16,4%. Vòng quay danh mục: khoảng 75%/năm.
- Lợi suất gộp (trước chi phí) của nhóm giao dịch nhiều và ít gần như bằng nhau. Phần chênh lệch nằm ở chi phí giao dịch (spread và phí môi giới).
- Giới hạn: giai đoạn cũ, phí khác hiện nay. Có tranh luận học thuật (một thư bình luận SEC, chưa mở, không dùng).

### Đuổi hiệu suất: Sirri & Tufano (JF, tập LIII số 5, 1998, tr. 1589–1622; mức A)

- Câu gốc, tr. 1590: "Mutual fund consumers chase returns, flocking to funds with the highest recent returns, though failing to flee from poor performers."
- Nhà đầu tư đổ tiền mạnh vào quỹ có kết quả tốt kỳ trước, nhưng không rút mạnh khỏi quỹ kém. Chi phí tìm kiếm và marketing ảnh hưởng.

### Ác cảm thua lỗ: Kahneman & Tversky (Econometrica 47(2), 1979; mức A-)

- Trang Econometric Society: hàm giá trị "is generally steeper for losses than for gains".
- Hệ số 2,25 (Tversky & Kahneman 1992) chỉ có ở nguồn thứ cấp. Không dùng số này trong bài.
- Trang: 263–291 (hầu hết trích dẫn) hoặc 263–292 (trang Econometric Society). Bài chỉ ghi năm và tạp chí, không ghi trang.

### Thiên kiến quê nhà (home bias)

- NBER Working Paper 6733 (https://www.nber.org/papers/w6733.pdf): nhà đầu tư các nước công nghiệp "reluctant to hold more than a fraction of their wealth in foreign assets", trích French & Poterba (1991). Mức A- (định tính).
- Số cụ thể (Mỹ khoảng 92% cổ phiếu do nhà đầu tư trong nước nắm năm 1989) chỉ thấy trong tóm tắt thứ cấp: không dùng.

### FOMO và phê bình DALBAR

- FOMO: không tìm được nguồn đã mở. Chỉ mô tả hành vi, không kèm số.
- DALBAR QAIB: có tranh luận về phương pháp (tính dòng tiền). Bản gốc chặn (403). Không dùng số DALBAR. Nếu nhắc, ghi "có tranh luận về phương pháp", không kèm số.

### Xếp hạng sai lầm cho bài (theo độ mạnh bằng chứng)

1. Giao dịch quá nhiều (A).
2. Đuổi hiệu suất (A).
3. Khoảng cách NAV và lợi suất nhà đầu tư (B).
4. Ác cảm thua lỗ (A-, định tính).
5. Thiên kiến quê nhà (A-, định tính).
6. FOMO (không có nguồn; chỉ mô tả).

## 5. Bảng kiểm chứng

Vòng 1 = đối chiếu bản gốc hoặc nguồn đã mở. Vòng 2 = đối chiếu nguồn thứ hai hoặc kiểm chéo kỳ dữ liệu.

| # | Khẳng định | Giá trị | Kỳ dữ liệu | Nguồn (đã mở) | Vòng 1 | Vòng 2 | Mức | Dùng? |
|---|---|---|---|---|---|---|---|---|
| 1 | LSI thắng DCA 12 tháng, 60/40 | Mỹ 67%, Anh 67%, Úc 66% | Lăn 10 năm; Mỹ 1926–2011 | Vanguard 2012 (bản sao PDF): https://militarymoneymanual.com/wp-content/uploads/2021/08/Dollar-Cost-Averaging-Just-Means-Taking-Risk-Later-Vanguard.pdf | Khớp Hình 1 | Tóm tắt tìm kiếm (C) khớp định tính "khoảng 2/3" | A | Có |
| 2 | LSI thắng DCA 36 tháng (Mỹ) | ~90% | Lăn 10 năm, Mỹ | Như #1 | Khớp | Chưa có nguồn thứ hai | A | Có (ghi "Mỹ") |
| 3 | Chênh lệch giá trị cuối (Mỹ) | LSI +2,3% ($2.450.264 vs $2.395.824) | Lăn 10 năm, 60/40 | Như #1 | Khớp (tính lại: +2,27%) | Nguồn thứ cấp ghi 1,8%: mâu thuẫn, bản gốc thắng | A | Có (dùng 2,3%) |
| 4 | Cửa sổ 12 tháng LSI giảm giá trị | 229/1.021 (22,4%) so với DCA 180 (17,6%) | Mỹ, cửa sổ 12 tháng | Như #1 | Khớp | — | A | Có |
| 5 | Giao dịch nhiều: lợi suất vs thị trường | 11,4% vs 17,9%; TB hộ 16,4%; turnover ~75% | 1991–1996, 66.465 hộ | Barber & Odean 2000: https://faculty.haas.berkeley.edu/odean/papers%20current%20versions/Individual_Investor_Performance_Final.pdf | Khớp abstract | Khớp phần giới thiệu (11,4% vs 18,5% nhóm ít giao dịch) | A | Có |
| 6 | Lợi suất gộp nhóm giao dịch nhiều ≈ nhóm ít | Gần bằng nhau | 1991–1996 | Như #5 | Khớp | — | A | Có |
| 7 | Đuổi hiệu suất | Câu nguyên văn tr. 1590 | Gần hai thập kỷ dữ liệu quỹ cổ phiếu Mỹ (kỳ cụ thể chưa đọc) | Sirri & Tufano 1998: https://faculty.babson.edu/wp-content/uploads/2024/01/mutual-funds-JF-october-1998.pdf | Khớp | — | A | Có (không nêu kỳ cụ thể) |
| 8 | Khoảng cách NAV vs nhà đầu tư | 9,9% vs 8,7%; khoảng 12% tổng lợi nhuận | 10 năm đến 31/12/2025 | Wealth Management (2026): https://wealthmanagement.com/investing-strategies/investors-miss-out-on-12-of-fund-returns-over-decade ; Kitces: https://www.kitces.com/blog/weekend-reading-for-financial-planners-august-8-9-2026/ | Khớp | Kitces: 8,74/9,89, 1,15% | B | Có (ghi "Mỹ") |
| 9 | Khoảng cách theo nhóm | Cổ phiếu Mỹ 0,4%; ETF 1,6% vs open-end 1,2%; index cổ phiếu Mỹ 0,1% | 10 năm đến 2025 | Wealth Management (như #8) | Khớp | Kitces: cổ phiếu Mỹ 0,44% | B | Có |
| 10 | Ngày phát hành Mind the Gap 2026 | 5/8 hoặc 6/8/2026 | — | Wealth Management ghi 6/8; tóm tắt khác ghi 5/8 | Lệch | — | B | Ghi "tháng 8/2026" |
| 11 | Quỹ chủ động vs passive giữa năm 2026 (Mỹ) | Trên 40% thắng và còn sống, 1 năm; +7 điểm; cổ phiếu Mỹ 36% | Đến 30/06/2026; ~9.226 quỹ, ~29 nghìn tỷ USD | Morningstar Úc: https://www.morningstar.com.au/insights/funds/IMUGLN3MQFAF5GMAQ4MYXIP4VI/active-fund-manager-success-rates-ticked-up-2026-passive-funds-still-hold-advantage | Khớp (bản Úc viết lại số Mỹ) | Tóm tắt wire khớp "just over 40%" | B | Có (chỉ số 1 năm) |
| 12 | Persistence top-quartile (bản 2024) | 0 quỹ top-quartile large-cap 2020 còn top đến 2024; ~25% qua 2 chu kỳ 3 năm | 2020–2024 | Evidence Investor (Powell, 19/09/2025): https://www.evidenceinvestor.com/post/spiva-persistence-scorecard | Khớp nội dung | — | B | Có (ghi "bản 2024") |
| 13 | Định nghĩa Sharpe và caveat | (r − rf)/σ; không tính tương quan; ex post "subject to serious question" | — | Sharpe: https://web.stanford.edu/~wfsharpe/art/sr/SR.htm | Khớp | — | A | Có |
| 14 | Sharpe 1966 | JB, tr. 119–138 | 1966 | Như #13 | Khớp | — | A | Có |
| 15 | GIPS: ưu tiên TWR; điều kiện MWR | Mục 1.A.35 | Edition 2020 | GIPS 2020: https://www.gipsstandards.org/wp-content/uploads/2021/03/2020_gips_standards_firms.pdf | Khớp | — | A | Có |
| 16 | GIPS: net-of-fees trừ phí và chi phí giao dịch | Văn bản composite | 2020 | Như #15 | Khớp | — | A | Có |
| 17 | GIPS: SD 3 năm annualized ex post (tháng) | Văn bản composite, ý j | 2020 | Như #15 | Khớp | — | A | Có |
| 18 | GIPS hiệu lực | 1/1/2020 | — | Như #15 | Khớp | — | A | Có |
| 19 | TE = annualised SD của TD; TD = total return quỹ − chỉ số | Định nghĩa | Cập nhật 04/01/2026 | Vanguard UK: https://www.vanguard.co.uk/content/uk-aem/gb/en/professional/vanguard-365/investment-knowledge/etf-knowledge/what-affects-index-tracking | Khớp | — | A | Có |
| 20 | Mục tiêu rebalancing: giảm rủi ro, không tối đa lợi suất | Trích nguyên văn | Tháng 7/2010; 1926–2009 | Vanguard 2010 (bản sao): https://indexacapital.com/bundles/unaiadvisor/docs/papers/2010-Vanguard-Best-practices-for-portfolio-rebalancing.pdf?v=241 | Khớp | — | A | Có |
| 21 | Không có tần suất/ngưỡng tối ưu; 1.008 vs 15 lần; kết luận 5% | Trích | Như #20 | Như #20 | Khớp | — | A | Có |
| 22 | Chân trời: tiết kiệm vs lợi suất | Trích | Tháng 12/2023 | Vanguard Principles: https://www.vanguard.ca/en/insights/vanguard-principles-for-investing-success | Khớp | — | A | Có |
| 23 | Hàm giá trị dốc hơn phía lỗ | Trích | 1979 | Econometric Society: https://www.econometricsociety.org/publications/econometrica/1979/03/01/prospect-theory-analysis-decision-under-risk | Khớp | — | A- | Có (định tính) |
| 24 | Nhà đầu tư nắm ít tài sản nước ngoài (home bias) | Định tính | Nhiều thập kỷ | NBER WP 6733: https://www.nber.org/papers/w6733.pdf | Khớp | — | A- | Có (định tính) |
| 25 | Tracking difference ví dụ | Chỉ số +15%, quỹ +13,7% → −1,3% | Số giả định | Tự tính | — | — | — | Có (ghi "số giả định") |

Ghi chú: Vanguard 2012 không có URL chính thức đã mở được (404), nên dùng bản sao. Mức A đánh dấu cho bản sao khớp nội dung và tiêu đề gốc.

## 6. Chưa xác minh — KHÔNG dùng trong bài

- SPIVA US YE 2025: 79% quỹ cổ phiếu vốn hóa lớn Mỹ thua S&P 500 (2024: 65%). Nguồn gốc spglobal.com (403). Chỉ thấy trong tóm tắt.
- SPIVA US giữa năm 2026: 67% large-cap thua S&P 500 (H1 2026); mid 74%; small 69%. Nguồn gốc 403. Advisor Perspectives 403.
- SPIVA Persistence YE 2025: 4,5% large-cap ở trên trung vị cả 5 năm; so với 6,25% ngẫu nhiên. Chỉ thấy trong tóm tắt; các tóm tắt không khớp về "6,25%".
- SPIVA Persistence YE 2025: không quỹ top-quartile large-cap 2021 nào còn top đến 2025. Tóm tắt blog thứ cấp.
- SPIVA Persistence YE 2025: 23% quỹ bottom-quartile và 10% top-quartile bị sáp nhập/thanh lý. Không tìm được nguồn.
- Morningstar Active/Passive 10 năm: "một trên bốn" (wire) so với "60% xác suất thua" (Morningstar Úc). Mâu thuẫn; không dùng số 10 năm.
- Morningstar Active/Passive 2025 (edition cũ): số Boldin (8,2% vs 7,0%) là nguồn C; không dùng.
- Morningstar Mind the Gap bản gốc PDF (US 2026, cs-assets): 429/chưa mở.
- Morningstar Mind the Gap: tuyên bố "rebalancing có thể đóng góp vào khoảng cách" (tóm tắt Advisor Perspectives, C).
- Tversky & Kahneman 1992: λ = 2,25; meta 2024 ~1,955 (thứ cấp, không mở bản gốc, paywall DOI 10.1007/BF00122574).
- Kahneman & Tversky 1979: trang 263–291 hay 263–292 (trang Econometric Society ghi 292). Cần JSTOR 1914185 để chốt.
- French & Poterba 1991 (AER 81(2), tr. 222–226): số Mỹ ~92,2% và Nhật 95,7% (1989). Chỉ thấy trong tóm tắt NBER khác; bản gốc chưa mở.
- Sharpe 1994 (JPM): trang chưa xác minh.
- Sharpe 1964 (JF 19(3), tr. 425–442): citation từ nhiều nguồn thứ cấp; bản gốc chưa mở. Mức B-.
- Markowitz 1952: "standard deviation" có trong bài gốc không: chưa đọc bản gốc. Chỉ dùng "variance".
- Magdon-Ismail & Atiya 2004 (Risk): định nghĩa đầy đủ chưa mở (paywall).
- Vanguard rebalancing 2015 (cập nhật): nội dung thứ cấp; không dùng.
- Vanguard TDF 2022/2024 (200/175, 5%): không dùng.
- SPIVA methodology survivorship hiện hành: chỉ có mô tả cũ (2004–2015) qua tìm kiếm. Mức C.
- DALBAR QAIB số liệu và phương pháp: 403; chỉ có phê bình thứ cấp (Advisor Perspectives, Kitces). Không dùng số.
- SEC/Investor.gov "Investor Bulletin: Performance Claims" (2022) và bài "mutual fund past performance": 403. Chưa xác minh; không trích.
- Việt Nam, bằng chứng học thuật: Nguyễn (2018, 72 quỹ cổ phiếu 2009–2017; chỉ 8 quỹ thắng VN-Index) và Dinh (103 quỹ, 2009–2017; "icy hands"). Đều là luận án Nottingham; WebFetch bị 429. Chưa xác minh. Không dùng.
- Việt Nam, báo chí 05/2026 về quỹ lớn thua VN-Index: tin tức, không phải nghiên cứu; không nêu tên quỹ; không dùng.
- Việt Nam, quy định NAV: TT 98/2020/TT-BTC (ban hành 16/11/2020; hiệu lực 01/01/2021 theo tóm tắt) và TT 136/2025/TT-BTC (sửa đổi). Chưa đọc được văn bản gốc (403). Tần suất định giá và công bố NAV (Điều 20 và các điều về công bố) chưa xác minh. Không nêu tần suất trong bài.
- Việt Nam, TT 96/2020 công bố NAV "ngày sau ngày định giá": chỉ từ tóm tắt thứ cấp. Không dùng.
- FOMO: không có nguồn đã mở.
- Loss aversion và số "2 lần": không dùng số cụ thể.
- Housel, "Tâm lý học tiền bạc": bản Việt không thấy trên Tiki (không có kết quả) và Fahasa (403). Chưa xác minh.
- Bogle: không thấy bản Việt. Chưa xác minh.

## 7. Ví dụ đời sống (bối cảnh Việt Nam; số giả định)

danh-gia-quy/01:
- Minh (28 tuổi, kỹ sư) mua quỹ 100 triệu khi NAV 100. Sau một năm NAV lên 200, Minh bỏ thêm 100 triệu ở đỉnh. Năm sau NAV về 100. NAV hòa vốn 2 năm; Minh lỗ 25% (150 triệu trên 200 triệu). Dùng để dạy dollar-weighted.
- Quỹ giảm 30% từ đỉnh (100 → 70). Người chủ quan thấy "còn lại 70" và chưa biết cần +42,9% để về 100. Dùng để dạy drawdown.
- Quỹ chỉ số theo VN30 lệch so với chỉ số trong năm: chỉ số +15%, quỹ +13,7% → tracking difference −1,3%. Dùng để dạy tracking difference.
- Gửi 100 triệu, sau 5 năm thành 200 triệu → CAGR 14,87%/năm. So sánh với lãi tiết kiệm (không dẫn số lãi cụ thể, để người học tự tra ngân hàng).

danh-gia-quy/02:
- Nhóm Zalo khoe quỹ tăng 40% năm trước. Người tham gia chuyển tiền vào quỹ đó. Đây là đuổi hiệu suất (Sirri & Tufano).
- Chị Thu (bạn gia đình, từng phân tích đầu tư) so quỹ "top năm 2021" với năm 2025: đa số quỹ top không còn top. Chỉ dạy persistence (định tính; không dẫn số SPIVA chưa xác minh).
- Hai quỹ chủ động cùng mục tiêu, một quỹ nhìn "lợi suất 1 năm", một quỹ nhìn 5 năm. Dạy checklist kỳ dài.
- Quỹ đã đóng không xuất hiện trong bảng so sánh của app. Dạy survivorship: "chỉ những quỹ còn sống".

chien-luoc/01:
- Lương 15 triệu/tháng, trích 3 triệu mỗi tháng vào quỹ. Đây là DCA từ thu nhập; không phải câu hỏi LSI vs DCA.
- Thưởng Tết 120 triệu: đầu tư một lần hay chia 12 tháng (10 triệu/tháng). Lịch sử Vanguard thường nghiêng về một lần; nếu thị trường giảm đầu kỳ, DCA hối tiếc ít hơn.
- Danh mục 60/40 (cổ phiếu 60, trái phiếu 40). Cổ phiếu +30%, trái phiếu 0%: tỷ trọng thành khoảng 66/34. Dạy tái cân bằng.
- Mục tiêu mua nhà trong 3 năm so với hưu trí sau 25 năm: chân trời khác nhau; tỷ trọng cổ phiếu khác nhau.

chien-luoc/02:
- Minh chuyển tiền sang quỹ "đang top" mỗi quý. Dạy đuổi hiệu suất và giao dịch quá nhiều.
- Chị Thu bán khi quỹ giảm 20% (từ 100 xuống 80), chờ đến 100 mới mua lại. Lỗi ở chỗ bán theo cảm xúc (ác cảm thua lỗ).
- Lướt sóng: 12 vòng mua-bán mỗi năm, phí 0,3% mỗi vòng (giả định) → 3,6%/năm chỉ riêng phí. Dạy chi phí giao dịch.
- Chỉ đầu tư cổ phiếu hoặc quỹ trong nước vì quen tên (thiên kiến quê nhà; định tính).
- Nhóm chat "mua gấp kẻo lỡ" khi tin nóng lên: FOMO (không số).

## 8. Ý tưởng SVG (cơ chế)

danh-gia-quy/01:
- SVG-1 "NAV vs tiền thực nhận": hai đường. Đường NAV 100 → 200 → 100. Đường tiền người mua thêm ở đỉnh. Nhãn: "Người mua ở đỉnh: −25%; NAV: 0%".
- SVG-2 "Drawdown": đường giá có đỉnh và đáy, vùng tô đỏ từ đỉnh đến đáy, mũi tên "−30% → cần +42,9% để về đỉnh".

danh-gia-quy/02:
- SVG-3 "Phễu sống sót" (số giả định): 100 quỹ ban đầu → còn X sau 5 năm, sáp nhập/đóng Y. Dạy survivorship.
- SVG-4 "Checklist 7 bước" dạng sơ đồ dòng (không cần số).

chien-luoc/01:
- SVG-5 "Hai đường tiền": tỷ lệ tiền mặt và cổ phiếu theo tháng, LSI (100% đầu kỳ) và DCA 12 tháng (chia đều).
- SVG-6 "Tỷ trọng trôi": 60/40 → 66/34 → về 60/40 khi lệch ≥5 điểm (ngưỡng theo Vanguard 2010).

chien-luoc/02:
- SVG-7 "Cột kép": 9,9% (quỹ) và 8,7% (nhà đầu tư), 10 năm đến 31/12/2025, quỹ Mỹ. Ghi nguồn.
- SVG-8 "Hàm giá trị": đường hình S, phần lỗ dốc hơn phần lãi. Không có số.

## 9. Sách tiếng Việt

| Tác giả | Sách (bản Việt) | NXB, năm | Kiểm tra | Dùng cho |
|---|---|---|---|---|
| Daniel Kahneman | Tư duy nhanh và chậm (bản dịch từ Thinking, Fast and Slow), ISBN 9786047706907 | Thế Giới / Công ty Cổ phần Sách Alpha, 2014 | Bản ghi Thư viện số Quốc hội: https://thuvienso.quochoi.vn/handle/11742/96559 . Fahasa/Tiki chưa kiểm được | chien-luoc/02 |
| Burton Malkiel | Bước đi ngẫu nhiên trên phố Wall (bản dịch) | NXB Lao động – Xã hội, 2009 | Bản ghi Thư viện số Quốc hội: https://thuvienso.quochoi.vn/handle/11742/95306 . Tiki/Fahasa chưa kiểm được; tên bản dịch có thể khác | danh-gia-quy/02, chien-luoc/01 |
| Morgan Housel | Tâm lý học tiền bạc | Chưa xác minh | Tiki không có kết quả; Fahasa 403 | chien-luoc/02 (chưa xác minh) |
| John Bogle | Chưa xác minh bản Việt | — | Không tìm thấy | danh-gia-quy/02 (chưa xác minh) |

Ghi chú: bản ghi thư viện là bằng chứng tồn tại của ấn bản, chưa phải tình trạng bán hàng hiện nay. Cần kiểm trên Fahasa hoặc Tiki trước khi đưa link vào bài.

## 10. Câu hỏi mở

1. Có người nào mở được PDF S&P (SPIVA YE 2025, H1 2026, Persistence YE 2025) và Morningstar gốc không? Nếu không, bỏ các số SPIVA khỏi bài; chỉ giữ định tính.
2. Quy định NAV của quỹ mở Việt Nam (TT 98/2020 Điều 20; TT 136/2025): cần đọc văn bản gốc trước khi viết về tần suất định giá.
3. Có chấp nhận bằng chứng Mỹ (SPIVA, Morningstar, Vanguard, Barber-Odean) cho bài Việt Nam không? Nếu có, mọi số phải ghi "Mỹ" và kỳ dữ liệu.
4. Có cho phép dùng luận án Nottingham (chưa peer-review) như bằng chứng yếu cho Việt Nam không?
5. Housel và Bogle bản Việt: cần người có quyền truy cập Fahasa/Tiki xác nhận, hoặc bỏ khỏi danh sách.
6. Chốt trang Kahneman & Tversky 1979 (263–291 hay 263–292) và ngày Mind the Gap 2026 (5 hay 6/8/2026).
7. FOMO và thiên kiến quê nhà: có nguồn định lượng không? Nếu không, chỉ mô tả, không kèm số.

Hạn chế của nghiên cứu: không mở được các nguồn chính của S&P, Morningstar, SEC, DALBAR, Fahasa, thuvienphapluat; số liệu chủ động vs thụ động mới nhất chưa kiểm chứng; không có dữ liệu quỹ Việt Nam đáng tin; phí quỹ Việt Nam thuộc bài chi-phi-tai-lieu, không nghiên cứu ở đây.

Status: DONE_WITH_CONCERNS
Summary: R5 xong với 4 bài có nguồn gốc (Vanguard 2012/2010, Barber-Odean, Sirri-Tufano, GIPS 2020 mở được bản gốc). Số SPIVA mới nhất và bằng chứng Việt Nam chưa xác minh nên không dùng.
