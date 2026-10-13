# Research 01: Nền tảng đầu tư (module `nen-tang`)

Ngày: 2026-10-13 · Phạm vi: Bài 01 (rủi ro, lợi nhuận, lạm phát, lãi kép, giá trị thời gian của tiền), Bài 02 (đa dạng hoá, phân bổ tài sản, khẩu vị và khả năng chịu rủi ro, chân trời, quỹ dự phòng).

Quy ước: [Sn] = nguồn trong mục "Danh mục nguồn". "Đã mở" = đọc được nội dung qua WebFetch, curl hoặc pdftotext. "Tự tính" = phép toán tôi kiểm lại, không phải số liệu nguồn. Mức tin cậy: Cao / Trung bình / Thấp.

## Tóm tắt

- Rủi ro lợi nhuận: FINRA và Investor.gov khớp nhau. Kỳ vọng lợi nhuận cao đi kèm khả năng mất một phần hoặc toàn bộ vốn. [S9]
- Lạm phát: CPI tháng 9/2026 tăng 5,08% so với cùng kỳ, lạm phát cơ bản 4,45%. [S15][S16][S17] Lãi thực = lãi danh nghĩa trừ lạm phát (Fed). [S14]
- Lãi kép và Quy tắc 72: công thức chuẩn đã kiểm lại. Quy tắc 72 đúng tốt quanh 6–10%/năm, lệch khoảng 5% ở 20%. [S13][Tự tính]
- Phân bổ tài sản: nghiên cứu BHB 1986 hay bị hiểu sai. Con số 93,6% là R² theo thời gian của danh mục quỹ hưu trí, không phải phần lợi nhuận đến từ phân bổ. [S1][S4][S5] Ibbotson & Kaplan 2000 phân ba câu hỏi riêng; đây là cách trình bày trung lập nhất. [S2][S3]
- Khuyến nghị cách viết: (1) dùng khung 3 câu hỏi của Ibbotson & Kaplan; (2) nêu 93,6% chỉ kèm chú thích "biến động theo thời gian, mẫu quỹ hưu trí Mỹ"; (3) rủi ro tách thành "khả năng chịu" và "khẩu vị" theo FINRA.

## Bài 01: Rủi ro, lợi nhuận, lạm phát, lãi kép, giá trị thời gian

### 1. Rủi ro và lợi nhuận (đánh đổi)
- Lợi nhuận kỳ vọng càng cao thì rủi ro mất một phần hoặc toàn bộ vốn càng lớn. FINRA viết gần như nguyên văn: "the higher the expected returns of a product or strategy, the greater the risk that you could lose most or all of your investment." [S9] Mức tin cậy: Cao (nguồn gốc, đã mở).
- Rủi ro không chỉ là biến động. Jahnke phân biệt biến động ngắn hạn với kết quả tích luỹ theo thời gian: "Explaining the volatility of short-term returns is not the same as explaining returns earned over time." [S4] Mức tin cậy: Trung bình (một tác giả, bản in lại 2004, nhưng trích dẫn đúng bản gốc BHB ở điểm này).

### 2. Lạm phát và lãi suất thực
- Lạm phát là rủi ro sức mua với người nhận lãi suất cố định: Investor.gov viết "purchasing power, which is a risk for investors receiving a fixed rate of return." [S12] Mức tin cậy: Cao.
- Công thức Fed: "The real interest rate equals the nominal interest rate minus the inflation rate." Ví dụ: lãi 3% với lạm phát 3% cho lãi thực 0%. [S14] Mức tin cậy: Cao. Đây là dạng xấp xỉ. Dạng chính xác là (1 + lãi danh nghĩa) = (1 + lãi thực)(1 + lạm phát) [Tự tính; nguồn thứ cấp Saylor/Wikipedia, Trung bình]. Lệch rõ khi lạm phát cao.
- Số liệu Việt Nam (kỳ 9/2026, công bố 3/10/2026):
  - CPI so với cùng kỳ: +5,08%. Lạm phát cơ bản: +4,45%. [S15 đã mở, S16, S17]
  - CPI bình quân 9 tháng: +4,52%. Lạm phát cơ bản bình quân 9 tháng: +4,26%. [S16, S17]
  - CPI so với tháng trước: +0,62%. [S16]
  - Trang NSO hiển thị y/y và lạm phát cơ bản nhưng không hiển thị bình quân 9 tháng, nên hai số bình quân lấy từ báo thứ cấp.
- Lãi tiết kiệm 12 tháng (tổng hợp 35 ngân hàng, ngày 1/10/2026): từ 3,7% đến 7,8%/năm. Nhóm ngân hàng Big4 niêm yết 5,9%/năm. [S18] Nguồn là lãi niêm yết của ngân hàng, không phải dữ liệu chính thức của NHNN. Mức tin cậy: Trung bình.
- Lãi thực theo CPI y/y 5,08% [Tự tính]:
  - 5,9% → khoảng +0,8%/năm.
  - 7,8% → khoảng +2,6%/năm.
  - 3,7% → khoảng −1,3%/năm.

### 3. Lãi kép và Quy tắc 72
- Công thức: FV = PV × (1 + i)^n, với i là lãi mỗi kỳ và n là số kỳ. [S22] Mức tin cậy: Trung bình. Nguồn không rõ tác giả, nhưng đây là công thức chuẩn và đã kiểm lại. Ví dụ 1.000 với lãi 12%/năm, 2 năm → 1.254,40 [Tự tính].
- Quy tắc 72: thời gian nhân đôi ≈ 72 / lãi suất (%). Ví dụ 8% → 9 năm. TAMU viết đây là công cụ "quick and accurate" và giả định lãi suất không đổi trong suốt kỳ. [S13] Mức tin cậy: Cao cho cách dùng, Trung bình cho độ chính xác (TAMU không đưa bảng sai số).
- Giới hạn độ chính xác [Tự tính, so với ln2 / ln(1+r)]:

| Lãi suất | Thời gian nhân đôi chính xác (năm) | Quy tắc 72 (năm) | Sai lệch |
|---|---|---|---|
| 1% | 69,66 | 72,0 | +3,4% |
| 6% | 11,90 | 12,0 | +0,9% |
| 8% | 9,01 | 9,0 | −0,1% |
| 10% | 7,27 | 7,2 | −1,0% |
| 12% | 6,12 | 6,0 | −1,9% |
| 20% | 3,80 | 3,6 | −5,3% |

Kết luận: Quy tắc 72 dùng tốt quanh 6–10%. Sai lệch tăng ở lãi suất rất thấp hoặc rất cao. Lãi suất có thể đổi theo thời gian nên đây chỉ là ước lượng.

- Dùng cho lạm phát: CPI 5,08% thì sức mua giảm một nửa sau khoảng 14 năm (72/5,08 ≈ 14,2). Tính chính xác là ln2/ln(1,0508) ≈ 14,0 [Tự tính].

### 4. Giá trị thời gian của tiền
- Quy đổi ngược: PV = FV / (1 + i)^n. Dùng khi hỏi "muốn có X sau n năm thì hôm nay cần bao nhiêu" [Tự tính; công thức cùng nguồn S22, Trung bình].
- Ví dụ sức mua [Tự tính, giả định CPI không đổi ở 5,08%]: 100 triệu để trong tủ 20 năm còn tương đương khoảng 37 triệu theo giá hôm nay.
- Jahnke giải thích tại sao lãi kép quan trọng với kỳ dài: "Persistent small increments to periodic returns compound over time, while the volatility in returns grows more slowly as the investment period is lengthened." [S4] Mức tin cậy: Trung bình (một tác giả, nhưng lập luận khớp với toán học).

## Bài 02: Đa dạng hoá, phân bổ tài sản, khẩu vị và khả năng, chân trời, quỹ dự phòng

### 1. Đa dạng hoá: rủi ro hệ thống và phi hệ thống
- Định nghĩa: đa dạng hoá là trải tiền vào nhiều khoản đầu tư để giảm rủi ro tổng thể. Investor.gov viết: "Diversification means investing in a variety of assets to lower the overall risk of your investment portfolio." [S11] Đa dạng cần thực hiện ở hai cấp: giữa các loại tài sản và trong từng loại. [S12] Mức tin cậy: Cao.
- Rủi ro riêng của doanh nghiệp (phi hệ thống) giảm khi nắm nhiều khoản đầu tư. Rủi ro thị trường (hệ thống) thì không giảm được bằng cách này. Damodaran lập luận hai lý do: mỗi khoản chiếm tỉ trọng nhỏ; các sự kiện tốt và xấu riêng lẻ bù trừ. [S8] Mức tin cậy: Trung bình-Cao. Nguồn là slide giảng dạy của giáo sư NYU, không phải bài báo đăng tạp chí.
- Ví dụ rủi ro hệ thống trong slide: lãi suất, lạm phát, tin tức nền kinh tế. Ví dụ rủi ro riêng: một dự án của công ty làm tốt hoặc kém hơn dự kiến. [S8]
- Tương quan: Markowitz (1952) cho thấy rủi ro danh mục phụ thuộc vào cách các khoản đầu tư cùng biến động. Thông tin trên econlib: hai cổ phiếu biến động ngược chiều có thể khiến danh mục có rủi ro thấp hơn từng cổ phiếu riêng. [S7] Mức tin cậy: Cao cho ý tưởng; Trung bình cho chi tiết (nguồn là bách khoa thư kinh tế).
- Vanguard 2017 cũng viết rằng dữ liệu BHB lấy từ quỹ hưu trí, vốn có rủi ro thị trường hệ thống cao, nên R² cao. [S6] Mức tin cậy: Trung bình-Cao.

### 2. Phân bổ tài sản và nghiên cứu Brinson, Hood & Beebower (1986)
- Phân bổ tài sản là cách chia tiền giữa cổ phiếu, trái phiếu, tiền mặt và các loại khác. Phù hợp phụ thuộc vào khả năng chịu rủi ro và chân trời đầu tư. [S11] Mức tin cậy: Cao.
- Dữ liệu gốc BHB [S1, đã mở bản scan bản in lại FAJ 1995]:
  - Mẫu: 91 quỹ hưu trí doanh nghiệp lớn (SEI), dữ liệu quý, 40 quý từ 1974 (bảng 6 ghi 1974–1983; bảng 7 ghi 1973–1985 — mâu thuẫn trong bản gốc).
  - Kết quả: trung bình 93,6% biến động lợi nhuận quý của mỗi quỹ được giải thích bởi lợi nhuận danh mục chính sách (R² trung bình của 91 hồi quy theo thời gian).
  - Chi phí quản lý chủ động: trung bình khoảng 1,10%/năm.
  - Bản gốc không nói phân bổ tài sản "quyết định 93,6% lợi nhuận". Con số là tỉ lệ phương sai theo thời gian.
- Cách hiểu sai: Nuttall (viết năm 2000) khảo sát hơn 50 trích dẫn về BHB và kết luận gần như tất cả đều sai; nguyên văn "all but one of these claims misquoted the results". [S5] Nuttall chỉ rõ 93,6% là "measure how much of the fluctuation over time is explained, not the level of return." [S5] Mức tin cậy: Cao cho việc đối chiếu bản gốc; Trung bình vì bản Nuttall là web cá nhân.
- Jahnke (1997) đồng ý phần số liệu nhưng phê bình cách diễn giải, và đề xuất dùng độ lệch chuẩn thay phương sai. [S4] Mức tin cậy: Trung bình. Jahnke là cố vấn tài chính, có lợi ích với lập luận "phân bổ động".
- Vanguard 2017 (Scott và cộng sự, Vanguard Research, tháng 2/2017; mẫu quỹ cân bằng 1990–9/2015) [S6]:
  - Theo thời gian: phân bổ chính sách giải thích trung vị 80,5% đến 91,1% biến động lợi nhuận (Mỹ 91,1%; Canada 86,0%; Anh 80,5%; Úc 89,1%; Nhật 87,9%).
  - Chéo quỹ (cross-sectional): chỉ 22,7% đến 47,7% phân tán lợi nhuận giữa các quỹ.
  - Vanguard bán quỹ chỉ số, nên có thiên hướng đối với chiến lược thụ động. Dữ liệu được đối chiếu độc lập, nhưng cần ghi chú.
- Ibbotson & Kaplan (2000) [S2, S3]: phân biệt ba câu hỏi:
  - Khoảng 90% biến động lợi nhuận của một quỹ theo thời gian được giải thích bởi phân bổ chính sách.
  - Khoảng 40% khác biệt lợi nhuận giữa các quỹ được giải thích bởi phân bổ chính sách.
  - Về mức lợi nhuận trung bình: "about 100 percent" theo bản tóm tắt CFA; "slightly more than 100 percent" theo bản working paper. Tôi chưa có bài đầy đủ để chốt.
- Khuyến nghị cách viết: nêu ba câu hỏi theo Ibbotson & Kaplan. Với 93,6%, luôn ghi "biến động theo thời gian, quỹ hưu trí Mỹ 1974–1983". Không viết "phân bổ quyết định 93,6% lợi nhuận".

### 3. Khẩu vị rủi ro và khả năng chịu rủi ro
- FINRA định nghĩa risk tolerance là "the amount of investment risk you're willing and able to accept". Bốn yếu tố: mục tiêu đầu tư, chân trời thời gian, mức phụ thuộc vào số tiền (ví dụ tiền học phí, tiền nhà), và tính cách. [S9] Mức tin cậy: Cao (đã mở trang gốc FINRA).
- FINRA viết: "The amount of risk you can technically afford to take isn't necessarily the same as the amount of risk you're comfortable taking." [S9] Đây là căn cứ phân biệt "khả năng" và "khẩu vị". Mức tin cậy: Cao.

### 4. Chân trời đầu tư
- Investor.gov định nghĩa: chân trời là "the number of months, years, or decades you need to invest to achieve your financial goal." [S10] Mức tin cậy: Cao.
- FINRA: chân trời dài thì chịu được rủi ro cao hơn, vì "You have decades to make up for losses"; chân trời ngắn cần tài sản an toàn và thanh khoản hơn. [S9] Mức tin cậy: Cao.

### 5. Quỹ dự phòng trước khi đầu tư
- Investor.gov khuyến nghị trả nợ lãi suất cao và có quỹ dự phòng trước khi đầu tư. Quỹ dự phòng là "rainy-day money". Thẻ tín dụng ở Mỹ có thể lãi "as much as 18% or more". [S12] Mức tin cậy: Cao cho nguyên tắc; Trung bình cho con số 18% (áp dụng thị trường Mỹ, không áp dụng trực tiếp cho Việt Nam).
- FINRA liệt kê chi phí định kỳ và chi phí khẩn cấp (sửa nhà, xe, y tế) là yếu tố khi xác định số tiền "không thể mất". [S9] Mức tin cậy: Cao.
- Chưa có nguồn đã mở nào đưa ra số tháng chi tiêu cụ thể cho quỹ dự phòng. Không đưa con số này vào bài.

## Bảng kiểm chứng

| Khẳng định | Nguồn 1 | Nguồn 2 | Tin cậy |
|---|---|---|---|
| Lợi nhuận kỳ vọng cao đi kèm rủi ro mất hết vốn | [S9] FINRA (đã mở) | [S12] Investor.gov (đã mở; gián tiếp) | Cao |
| Lãi thực = lãi danh nghĩa − lạm phát (xấp xỉ) | [S14] Fed Education (đã mở) | [Tự tính] 5,9% − 5,08% = 0,82 so với 0,78 chính xác | Cao |
| CPI tháng 9/2026 y/y +5,08% | [S15] NSO (đã mở, trang chủ) | [S16] Thời báo TC, 3/10/2026 (đã mở); [S17] Tạp chí CT, 3/10/2026 (đã mở) | Cao |
| Lạm phát cơ bản tháng 9/2026 y/y +4,45% | [S15] NSO (đã mở) | [S16] (đã mở) | Cao |
| CPI bình quân 9 tháng 2026 +4,52%; cơ bản 4,26% | [S16] (đã mở) | [S17] (đã mở) | Trung bình-Cao (không có trên trang NSO đã mở) |
| CPI tháng 9/2026 m/m +0,62% | [S16] (đã mở) | Không có nguồn thứ hai đã mở | Trung bình |
| Lãi tiết kiệm 12 tháng 3,7%–7,8%; Big4 5,9% (1/10/2026) | [S18] (đã mở) | Không có nguồn thứ hai đã mở; mức 7,8% có trong tìm kiếm khác (8/2026) nhưng chưa mở | Trung bình |
| Quy tắc 72: 72/8 = 9 năm; giả định lãi suất không đổi | [S13] TAMU (đã mở) | [Tự tính] 9,01 năm chính xác | Cao |
| Sai số Quy tắc 72 là khoảng −5% đến +3% trong dải 1–20% | [Tự tính] | Không có nguồn thứ hai (TAMU không có bảng sai số) | Trung bình (phép toán kiểm được) |
| FV = PV(1 + i)^n; 1.000 ở 12% 2 năm = 1.254,40 | [S22] (đã mở; tác giả không rõ) | [Tự tính] | Cao (toán) / Trung bình (nguồn) |
| Phân bổ tài sản giải thích 93,6% biến động theo thời gian (quỹ hưu trí 1974–1983) | [S1] BHB (đã mở bản scan) | [S4] Jahnke (đã mở); [S5] Nuttall (đã mở); [S6] Vanguard 2017 (đã mở) | Cao |
| Chi phí quản lý chủ động trung bình khoảng 1,10%/năm | [S1] BHB (đã mở) | [S4] Jahnke ghi "1.1 percent each year" (đã mở) | Cao |
| Ibbotson & Kaplan: ~90% biến động theo thời gian; ~40% khác biệt giữa quỹ | [S2] CFA abstract (đã mở) | [S3] RePEc working paper (đã mở); [S6] Vanguard 2017 (chéo quỹ 22,7–47,7%) | Cao (hướng); Trung bình (con số chính xác) |
| Ibbotson & Kaplan: phần lợi nhuận mức trung bình "about 100%" | [S2] (đã mở) | [S3] ghi "slightly more than 100%" | Thấp-Trung bình (mâu thuẫn; không dùng số này) |
| Vanguard 2017: 80,5%–91,1% biến động theo thời gian (quỹ cân bằng, 5 thị trường) | [S6] (đã mở) | Chưa mở nguồn thứ hai (trang Vanguard Core allocation chỉ thấy trong tìm kiếm) | Trung bình |
| Đa dạng hoá giảm rủi ro riêng, không giảm rủi ro thị trường | [S8] Damodaran (đã mở) | [S11] Investor.gov 2026; [S6] Vanguard 2017 (đối chiếu gián tiếp) | Cao |
| Markowitz 1952: đa dạng hoá dựa trên tương quan giữa các khoản đầu tư | [S7] econlib (đã mở) | Bài báo gốc JoF 7(1), 77–91: DOI không mở được (403) | Trung bình-Cao |
| Risk tolerance = "willing and able"; khả năng khác khẩu vị | [S9] FINRA (đã mở) | [S11] Investor.gov 2026 (mức rủi ro phụ thuộc khẩu vị và chân trời) | Cao |
| Chân trời là số tháng, năm hoặc thập kỷ để đạt mục tiêu | [S10] Investor.gov (đã mở) | [S9] FINRA (chân trời dài chịu được rủi ro hơn) | Cao |

Ghi chú về nguồn: Investor.gov trả về HTML rỗng cho nhiều mục (glossary "risk", "systematic risk", "inflation" chỉ có khung trang). Tôi không dựa vào các mục đó.

## Chưa xác minh (KHÔNG dùng trong bài)

- BHB (1991), cập nhật 82 quỹ hưu trí 1977–1987 với 91,5%: bản PDF tải về là HTML, không mở được. Chỉ biết qua Nuttall nhắc đến 91,5%.
- Jahnke: "79%" khi dùng độ lệch chuẩn thay vì phương sai. Đây là phép tính của Jahnke, chưa đối chiếu.
- Mẫu nghiên cứu Ibbotson & Kaplan: bản working paper ghi 58 quỹ hưu trí, 5 năm, 1993–97. Bản tóm tắt CFA (chỉ thấy trong tìm kiếm) ghi 10 năm. Chưa giải quyết được vì bài đầy đủ là members-only.
- Trang Vanguard "Core allocation" (81%–91%, phân theo quốc gia): chỉ thấy trong kết quả tìm kiếm, chưa mở.
- Mục tiêu lạm phát khoảng 4,5% năm 2026: chỉ thấy trong báo thứ cấp; chưa có văn bản của Chính phủ hoặc NHNN.
- Xăng tăng 9,39% m/m và đóng góp 0,40 điểm phần trăm vào CPI tháng 9: chỉ thấy trong tìm kiếm, chưa mở.
- Học phí năm học mới tăng làm CPI tháng 9 tăng: chỉ thấy trong tìm kiếm, chưa mở.
- Nguồn gốc Quy tắc 72 (thường gán cho Luca Pacioli, 1494): chưa tra. Không đưa vào bài.
- Công thức chính xác của Fisher, nguồn thứ cấp: Saylor và Wikipedia (tìm kiếm), chưa mở. Chỉ dùng như kiểm tra toán học.
- Số tháng chi tiêu cho quỹ dự phòng: chưa tìm được nguồn đã mở.
- Thông tin ngân hàng cụ thể (tên ngân hàng và mức lãi): không đưa vào bài. Chỉ dùng khoảng tổng hợp.
- Bản tiếng Việt của "Tâm lý học tiền bạc": không tìm thấy bản đã xác nhận.
- Trang Fahasa: trả về 403 với curl và WebFetch. Không có link Fahasa nào được xác minh.
- Số trang bài BHB: bản in lại ghi 39–44; Vanguard trích 39–48. Dùng 39–44 theo bản scan, ghi chú mâu thuẫn.
- Mức "Morningstar cho rằng đo khẩu vị là 'nice to have'": một ý kiến, không phải nguồn chính thức. Không dùng.

## Ví dụ đời sống (Việt Nam)

1. Gửi tiết kiệm 12 tháng: 100 triệu, lãi niêm yết 5,9%/năm (nhóm Big4, 1/10/2026), CPI 5,08%. Sau một năm, sức mua của 100 triệu khoảng 100,8 triệu so với hôm nay (lãi thực khoảng 0,8%). Số liệu có nguồn [S16][S18].
2. Cất tiền mặt trong tủ: 100 triệu, CPI giả định 5,08%/năm. Sau 20 năm còn khoảng 37 triệu theo giá hôm nay. Số giả định, tính toán [Tự tính].
3. Giỏ đồ chợ cuối tuần: giả định giỏ 500.000 đồng năm nay, năm sau cùng giỏ khoảng 525.000 đồng nếu tăng 5%. Số giả định, dùng cho lạm phát.
4. Trả nợ trước khi đầu tư: thẻ tín dụng hoặc vay tiêu dùng lãi cao. Dùng ví dụ Mỹ của Investor.gov (18% trở lên) và nói rõ đây là thị trường Mỹ [S12].

Ví dụ đa dạng hoá (không cần nguồn, minh hoạ khái niệm): quán bán cả cà phê và nước mía. Mưa nhiều thì nước mía ế, nhưng cả hai ít khi cùng ế. Đây là minh hoạ tương quan thấp, không phải số liệu.

## Ý tưởng SVG (minh hoạ cơ chế, không phải dự báo)

Bài 01:
1. Lãi kép vs lãi đơn: hai đường từ 100 triệu, lãi 8%/năm, trục 0–30 năm. Đánh dấu điểm nhân đôi sau 9 năm, đặt chú thích "Quy tắc 72: 72 / 8 = 9". Mục đích: thấy đường cong tăng nhanh về sau.
2. Thước sức mua: cột 100 đơn vị hôm nay, giảm theo CPI giả định 5%, mốc 0, 5, 10, 14, 20 năm. Đặt chú thích "sức mua giảm một nửa sau khoảng 14 năm".

Bài 02:
1. Rủi ro danh mục theo số khoản đầu tư: trục x là số khoản, trục y là rủi ro tổng. Đường giảm nhanh rồi chạm một mức nền (rủi ro thị trường). Ghi rõ đây là hình minh hoạ theo Damodaran, không có số liệu thực.
2. Khẩu vị × khả năng: hai trục (khả năng chịu, khẩu vị), bốn ô. Dùng câu của FINRA: "có thể chịu" khác "có thoải mái không". Có thể thêm trục chân trời.

## Sách tiếng Việt (đã kiểm tra trang sản phẩm)

| Sách | Link | Kiểm tra | Liên quan |
|---|---|---|---|
| Bước đi ngẫu nhiên trên phố Wall (Burton G. Malkiel) | Tiki: https://tiki.vn/sach-buoc-di-ngau-nhien-tren-pho-wall-tai-ban-p100395623.html ; NXB (Thư viện số Quốc hội): https://thuvienso.quochoi.vn/handle/11742/95306?mode=full | Tiki đã mở (tên, tác giả, giá 249.000₫ niêm yết). NXB Lao động – Xã hội, 2009, theo hồ sơ thư viện. Dịch giả không ghi rõ. | Đa dạng hoá, chi phí, chỉ số. Trung bình-Cao |
| Nhà đầu tư thông minh (Benjamin Graham, Jason Zweig) | Tiki: https://tiki.vn/nha-dau-tu-thong-minh-benjamin-graham-jason-zweig-le-quoc-phuong-bui-quynh-chi-dich-nha-nam-nxb-dan-tri-p278951335.html | Tiki đã mở: dịch giả Lê Quốc Phương, Bùi Quỳnh Chi; NXB Dân Trí (thương hiệu Nhã Nam); 280.000₫. Năm xuất bản không hiển thị. | Rủi ro, khẩu vị, kỷ luật. Cao (tồn tại bản Việt) |
| Người giàu có nhất thành Babylon (George S. Clason, tái bản 2020) | Tiki: https://tiki.vn/sach-nguoi-giau-co-nhat-thanh-babylon-tai-ban-2020-p57325187.html | Tiki đã mở: tên, tác giả, 98.000₫. NXB và dịch giả không hiển thị. Nội dung chưa đối chiếu. | Tiết kiệm, lãi kép ở mức khái quát. Thấp (dùng cẩn trọng) |

Không có sách nào được đề xuất như "nên mua" theo sản phẩm. Đây chỉ là danh sách kiểm tra được.

## Câu hỏi mở

1. Ibbotson & Kaplan: có cần mua bản đầy đủ (members-only) để chốt mẫu và chữ "about 100%" hay "slightly more than 100%"? Đề xuất tạm: chỉ dùng 90% và 40%.
2. Có nên đưa 93,6% vào bài? Nên đưa, nhưng phải kèm chú thích "biến động theo thời gian". Quyết định biên tập.
3. Số CPI sẽ cập nhật theo tháng. Khi xuất bản bài, cần đối chiếu lại với NSO và ghi rõ kỳ số liệu.
4. Dùng khoảng lãi tiết kiệm (3,7%–7,8%) hay một mốc giả định? Đề xuất: dùng số giả định, ghi "số tổng hợp ngày 1/10/2026".
5. Quỹ dự phòng: cần nguồn đã mở về số tháng chi tiêu trước khi viết con số. Hiện chưa có.
6. Bản tiếng Việt của Graham: nếu trích nguyên văn, cần kiểm tra trang bản quyền của NXB Dân Trí.

## Đánh giá nguồn và xếp hạng ưu tiên

Xếp hạng độ tin cậy: (1) văn bản gốc và trang cơ quan (FINRA, Investor.gov, Fed Education, NSO, BHB bản scan); (2) nghiên cứu của tổ chức có kiểm chứng (Vanguard 2017, CFA abstract, Ibbotson & Kaplan WP); (3) báo thứ cấp và bài tổng hợp (Thời báo TC, Tạp chí CT, thị trường tài chính tiền tệ); (4) trang bán sách và tìm kiếm (Tiki, RePEc snippet). Chỉ dùng nhóm 3 và 4 khi có nguồn nhóm 1 hoặc 2 xác nhận.

Ưu tiên cách trình bày cho bài viết:
1. Khung ba câu hỏi của Ibbotson & Kaplan (trung lập nhất, khớp Vanguard 2017).
2. Quy tắc 72 kèm bảng sai số (đơn giản, kiểm được).
3. BHB 93,6% chỉ khi có chú thích phương sai theo thời gian. Không dùng làm khẳng định chung.

## Danh mục nguồn

- [S1] Brinson, Hood, Beebower, "Determinants of Portfolio Performance", FAJ 42(4), tháng 7–8/1986, tr. 39–44; in lại FAJ 51(1), 1/1995, tr. 133–138. Đã mở bản scan: https://indexacapital.com/bundles/unaiadvisor/docs/papers/1986-Brinson-Determinants-of-Portfolio-Performance-I.pdf?v=241
- [S2] Ibbotson & Kaplan, "Does Asset Allocation Policy Explain 40, 90, or 100 Percent of Performance?", FAJ 56(1), 2000, DOI 10.2469/faj.v56.n1.2327. Đã mở tóm tắt: https://rpc.cfainstitute.org/research/financial-analysts-journal/2000/does-asset-allocation-policy-explain-40-90-or-100-percent-of-performance
- [S3] Ibbotson & Kaplan, Yale SOM working paper ysm215 (2001). Đã mở: https://ideas.repec.org/p/ysm/somwrk/ysm215.html
- [S4] Jahnke, "The Asset Allocation Hoax", Journal of Financial Planning, 2/1997; bản in lại 8/2004. Đã mở: https://www.financialplanningassociation.org/sites/default/files/2021-08/AUG04%20The%20Asset%20Allocation%20Hoax.pdf
- [S5] Nuttall (viết năm 2000; khảo sát 1998). Đã mở: https://publish.uwo.ca/~jnuttall/asset.html
- [S6] Scott, Balsamo, McShane, Tasopoulos, "The Global Case for Strategic Asset Allocation and an Examination of Home Bias", Vanguard Research, 2/2017; dữ liệu 1/1990–9/2015. Đã mở bản sao bên thứ ba: https://www.fa-mag.com/userfiles/white_papers/wp_5.pdf
- [S7] Markowitz, "Portfolio Selection", JoF 7(1), 1952, tr. 77–91; Nobel 1990. Đã mở bách khoa thư econlib: https://www.econlib.org/library/Enc/bios/Markowitz.html
- [S8] Damodaran, "Understanding Risk" (slide, NYU Stern). Đã mở: https://pages.stern.nyu.edu/~adamodar/pdfiles/invphiloh/risk.pdf
- [S9] FINRA Investor Insights, "Know your risk tolerance" (trang 2026). Đã mở: https://www.finra.org/investors/insights/know-your-risk-tolerance
- [S10] Investor.gov, glossary "Time Horizon". Đã mở: https://www.investor.gov/introduction-investing/investing-basics/glossary/time-horizon
- [S11] Investor.gov, Investor Bulletin 2026 (Investor.gov tips). Đã mở: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/investorgov-tips-2026-investor-bulletin
- [S12] Investor.gov, World Investor Week 2023 alert. Đã mở: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/WorldInvestorWeek2023
- [S13] Fulling (Texas A&M), "The Rule of 72 for compound interest". Đã mở: https://people.tamu.edu/~fulling/m152/interest.html
- [S14] Federal Reserve Education, "Getting Real About Interest Rates" (không có ngày). Đã mở: https://www.federalreserveeducation.org/teaching-resources/economics/banks-interest-rates/getting-real-about-interest-rates
- [S15] Cục Thống kê (Bộ Tài chính), trang chủ NSO, chỉ số tháng 9/2026, công bố 3/10/2026. Đã mở: https://www.nso.gov.vn/
- [S16] Thời báo Tài chính Việt Nam, "CPI 9 tháng tăng 4,52%...", 3/10/2026. Đã mở: https://thoibaotaichinhvietnam.vn/cpi-9-thang-tang-4-52-du-dia-cuoi-nam-con-rat-hep-204793.html
- [S17] Tạp chí Công Thương, "9 tháng năm 2026, CPI tăng 4,52%...", 3/10/2026. Đã mở: https://tapchicongthuong.vn/9-thang-nam-2026--cpi-tang-4-52-lam-phat-co-ban-tang-4-26-554941.htm
- [S18] Thị trường Tài chính Tiền tệ, "Lãi suất đầu tháng 10/2026", 1/10/2026 (tổng hợp lãi niêm yết 35 ngân hàng). Đã mở: https://thitruongtaichinhtiente.vn/lai-suat-dau-thang-10-2026-tiet-kiem-giu-nhip-on-dinh-chung-chi-tien-gui-hut-khach-85944.html
- [S19] Tiki, "Bước đi ngẫu nhiên trên phố Wall (Tái bản)". Đã mở: https://tiki.vn/sach-buoc-di-ngau-nhien-tren-pho-wall-tai-ban-p100395623.html . Thư viện số Quốc hội (NXB, năm): https://thuvienso.quochoi.vn/handle/11742/95306?mode=full
- [S20] Tiki, "Nhà đầu tư thông minh" (Nhã Nam / NXB Dân Trí). Đã mở: https://tiki.vn/nha-dau-tu-thong-minh-benjamin-graham-jason-zweig-le-quoc-phuong-bui-quynh-chi-dich-nha-nam-nxb-dan-tri-p278951335.html
- [S21] Tiki, "Người giàu có nhất thành Babylon (Tái bản 2020)". Đã mở: https://tiki.vn/sach-nguoi-giau-co-nhat-thanh-babylon-tai-ban-2020-p57325187.html
- [S22] Trang tài liệu "Investopedia" (readthedocs, không rõ tác giả, không ngày). Đã mở: https://investopedia.readthedocs.io/en/latest/invest/Ch5/Chapter554.html

Status: DONE_WITH_CONCERNS
Summary: Bài 01 và Bài 02 đã có nguồn gốc (BHB 1986, FINRA, Investor.gov, Fed, NSO) và đối chiếu chéo cho các số chính. Còn thiếu: bài đầy đủ của Ibbotson & Kaplan (chốt mẫu và "100%"), nguồn số tháng quỹ dự phòng, và xác nhận nhà xuất bản của một số sách.
