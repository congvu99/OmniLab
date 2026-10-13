# Fact-check C — danh-gia-quy/01-02, chien-luoc/01-02

Ngày: 2026-10-13 · Vòng kiểm chứng thứ hai (độc lập) · Plan: `261013-fund-investing-domain`

## Tóm tắt

- Đã tự mở lại bản gốc của 7 nguồn bằng curl + pdftotext: Vanguard 2012 (DCA), Vanguard 2010 (tái cân bằng), Barber và Odean 2000, Sirri và Tufano 1998, GIPS 2020, NBER WP 6733, Sharpe (trang SR.htm). Đã mở bằng WebFetch: Morningstar Úc (Active/Passive), Wealth Management và Kitces (Mind the Gap), Evidence Investor (SPIVA), Vanguard UK (TD/TE), Vanguard Principles, Econometric Society (K&T 1979), 2 bản ghi Thư viện số Quốc hội, trang sách Housel trên Tiki (API).
- Tìm thấy 2 lỗi **Sai**, cả hai đã sửa:
  1. chien-luoc/01: "quỹ giảm 30% đúng năm thứ ba → thiếu khoảng 180 triệu trên 600 triệu". Con số này không khớp với giả định nạp tiền cuối mỗi năm, vì khoản nạp cuối năm 3 chưa chịu mức giảm. Tính đúng là còn 487 triệu, hụt 143,5 triệu so với kế hoạch 630,5 triệu.
  2. chien-luoc/02: "thời điểm dòng tiền vào ra **và phí** cũng góp phần" vào khoảng cách của Mind the Gap. Cả lợi suất quỹ lẫn lợi suất nhà đầu tư đều đã trừ phí, nên phí không tạo ra khoảng cách. Câu này không có nguồn. Đã thay bằng câu đúng định nghĩa: khoảng cách đo tác động của thời điểm tiền vào ra, và không phải lần vào ra nào cũng là lỗi hành vi.
- Có 9 mục **Diễn đạt** (các mục 5, 7, 9, 11, 16, 21, 24, 34, 35), đã sửa. Ngoài ra đã bổ sung kỳ dữ liệu, tác giả và lời giải thích thuật ngữ.
- Tất cả các tên bài, năm, tạp chí, tập/số, trang mà writer báo là "ghi theo trí nhớ" đều **đúng** với bản gốc.
- Sách Housel bản Việt đã được xác minh (NXB Dân Trí, 1980 Books, dịch giả Hoàng Thị Minh Phúc) qua trang sản phẩm Tiki. Đã thêm link vào mục Nguồn.
- Có 1 SVG sửa hình: sụt giảm 100→70 trước đây vẽ không theo tỷ lệ so với trục 0, nay đã vẽ lại đúng tỷ lệ. Các SVG khác đã kiểm tỷ lệ, đều đúng.
- Đã đặt `examplesReviewed: true` ở 4 MDX. `pnpm verify:fidelity`: OK (14 dau-tu-quy + các lĩnh vực khác). `pnpm check`: 0 lỗi, 0 cảnh báo.

## Bảng kiểm chứng

| # | Bài | Khẳng định | Nguồn đã mở | Kết quả |
|---|---|---|---|---|
| 1 | dgq/01 | Sharpe, "Mutual Fund Performance", Journal of Business, 01/1966, tr. 119–138; ban đầu gọi "reward-to-variability" | SR.htm (danh mục tài liệu + mở đầu) | Đúng |
| 2 | dgq/01 | Dùng Sharpe ex post chưa hiệu chỉnh thay cho dự báo là "subject to serious question" | SR.htm, mục Summary (bài JPM, Fall 1994) | Đúng. Đã thêm "bài năm 1994" |
| 3 | dgq/01 | Sharpe không tính tương quan với tài sản khác | SR.htm, mục Correlations | Đúng |
| 4 | dgq/01 | GIPS: lợi suất net đã trừ phí quản lý và chi phí giao dịch | GIPS 2020, mục tính lợi suất composite ("net-of-fees returns must reflect the deduction of transaction costs and investment management fees") | Đúng. Đã thêm "do CFA Institute ban hành" |
| 5 | dgq/01 | GIPS yêu cầu độ lệch chuẩn 3 năm, tính từ lợi suất tháng rồi quy ra năm | GIPS 4.A.1.j | Diễn đạt: chuẩn yêu cầu số này "tại cuối mỗi năm", không chỉ 3 năm gần nhất. Đã sửa |
| 6 | dgq/01 | GIPS mặc định trình bày TWR; MWR chỉ dùng trong trường hợp đặc thù | GIPS 1.A.35 (kiểm soát dòng tiền + quỹ đóng/thời hạn cố định/cam kết vốn cố định/tài sản kém thanh khoản) | Đúng. Đã thêm ví dụ các trường hợp |
| 7 | dgq/01 | TD = total return quỹ − total return chỉ số; TE = độ lệch chuẩn quy ra năm của TD; các nhà cung cấp tính khác nhau | Vanguard UK (đăng 04/01/2026) | Đúng. Nhãn link "cập nhật" đổi thành "đăng ngày" |
| 8 | dgq/02 | Morningstar Active/Passive giữa năm 2026: dữ liệu đến 30/06/2026, ~9.226 quỹ, ~29 nghìn tỷ USD, "just over 40%" quỹ survived and beat, tăng 7 điểm; cổ phiếu Mỹ 36% | Morningstar Úc (Brian Paoli, 19/08/2026) | Đúng. Mức bình quân là "asset-weighted average passive composite"; đã ghi "tính theo quy mô tài sản" |
| 9 | dgq/02 | SPIVA Persistence "bản 2024": không quỹ top-quartile large-cap năm 2020 nào còn top đến hết 2024 | Evidence Investor (Powell, 19/09/2025) ghi đúng câu này nhưng chỉ gọi là "latest US persistence scorecard". Kết quả tìm kiếm có URL S&P "us-persistence-scorecard-year-end-2024" và tóm tắt khớp. Trang S&P trả 403 | Diễn đạt. Đã ghi "bản cuối năm 2024" và nói rõ là theo bài tổng hợp của Powell |
| 10 | dgq/02, cl/02 | Sirri và Tufano, "Costly Search and Mutual Fund Flows", JF 53(5), 10/1998, tr. 1589–1622; câu "chase returns… failing to flee" ở tr. 1590 | PDF Babson (tr. 1589 → 1622) | Đúng. Đã thêm kỳ dữ liệu 12/1971–12/1990 (quỹ cổ phiếu Mỹ, mục B. Data) |
| 11 | dgq/02 | GIPS "yêu cầu so với chỉ số tương ứng" | GIPS 4.A.1.e: trình bày total return của benchmark, "unless the firm determines there is no appropriate benchmark" | Diễn đạt. Đã sửa và ghi rõ ngoại lệ |
| 12 | dgq/02 | Malkiel, *Bước đi ngẫu nhiên trên phố Wall*, NXB Lao động – Xã hội, 2009 | Thư viện số Quốc hội 11742/95306 | Đúng. Tiki không có ấn bản này; câu rào "tên bản dịch ở nhà sách có thể khác" vẫn giữ |
| 13 | cl/01 | Vanguard 07/2012, "Dollar-cost averaging just means taking risk later", tác giả Shtekhman, Tasopoulos, Wimmer | PDF bản sao | Đúng |
| 14 | cl/01 | 60/40, DCA 12 tháng, khoảng 10 năm lăn; Mỹ 1926–2011, Anh 1976–2011, Úc 1984–2011; LSI thắng 67/67/66% | PDF, Hình 1 | Đúng. Đã giải thích "khoảng lăn" (1/1926–12/1935, dời từng tháng đến 12/2011) |
| 15 | cl/01 | DCA 36 tháng: LSI thắng ~90% (Mỹ) | PDF tr. 3 | Đúng |
| 16 | cl/01 | Ở Mỹ, LSI hơn 2,3% | PDF tr. 4: $2.450.264 so với $2.395.824 | Đúng (+2,27%). Câu "chia ra thì giá trị cuối trung bình **thấp hơn** khoảng 2,3%" là Diễn đạt, vì tính theo chiều đó chỉ là −2,22%. Đã viết lại thành "bỏ một lần cao hơn khoảng 2,3%" |
| 17 | cl/01 | 1.021 khoảng 12 tháng; LSI giảm giá trị 229 lần (22,4%), DCA 180 lần (17,6%) | PDF tr. 6 | Đúng. Đã thêm số lần |
| 18 | cl/01 | Tác giả nói DCA từ lương là bài toán khác | PDF tr. 4 ("a prudent way to invest") | Đúng. Đã thêm ý "cách làm thận trọng" |
| 19 | cl/01 | Vanguard 07/2010, Jaconetti, Kinniry, Zilbering; dữ liệu Mỹ 1926–2009 | PDF bản sao; benchmark là chỉ số Mỹ (S&P 90/S&P 500/Wilshire 5000/MSCI US; trái phiếu Mỹ) | Đúng |
| 20 | cl/01 | Mục tiêu là giảm rủi ro, không tối đa lợi nhuận; không có tần suất/ngưỡng tối ưu; 1.008 lần (tháng, không ngưỡng) so với 15 lần (năm, ngưỡng 10%) | PDF tóm tắt + Hình 7 | Đúng (84 năm × 12 = 1.008) |
| 21 | cl/01 | Ngưỡng 5% nghĩa là gì | PDF tr. 2: "deviated… by at least 5 percentage points" | Diễn đạt: là **5 điểm phần trăm**, không phải 5% tương đối. Đã sửa cả thân bài, Mẹo và Tóm tắt, kèm ví dụ 60%→65% |
| 22 | cl/01 | Theo dõi năm/nửa năm, ngưỡng 5%; ưu tiên hằng năm khi có thuế/chi phí; chỉ theo ngưỡng thì phải theo dõi hằng ngày | PDF | Đúng. Bỏ dạng mệnh lệnh "hãy", ghi thành kết luận của Vanguard |
| 23 | cl/01 | Vanguard Principles (12/2023): chân trời ngắn thì tiết kiệm là chính, dài thì lợi suất quan trọng hơn; risk capacity khác risk tolerance | vanguard.ca (06/12/2023) | Đúng. Đã tách câu, định nghĩa cả hai thuật ngữ |
| 24 | cl/02 | Mind the Gap 2026: ~23.000 quỹ mở và ETF Mỹ; 01/01/2016–31/12/2025; 8,7% so với 9,9%; ~12% tổng lợi nhuận; ~3,8 nghìn tỷ USD; phát hành 08/2026 | Wealth Management (Misonzhnik, 06/08/2026); Kitces (8,74% / 9,89%, chênh 1,15%) | Đúng. Câu "Morningstar ước tính khoảng 3,8 nghìn tỷ USD" thiếu chủ ngữ (là phần lợi nhuận bị bỏ lỡ), đã sửa |
| 25 | cl/02 | Khoảng cách theo nhóm: cổ phiếu Mỹ 0,4; chỉ số cổ phiếu Mỹ 0,1; allocation 0,7; chỉ số 1,1; ngành 1,2; quỹ mở 1,2; ETF 1,6 | Wealth Management; Kitces (0,44; ngành 1,22) | Đúng |
| 26 | cl/02 | "Khoảng cách giống các lần ước tính trước" | Wealth Management ("consistent with the gap… in previous reports") | Đúng |
| 27 | cl/02 | Khoảng cách do "thời điểm dòng tiền **và phí**" | Không có nguồn. Về định nghĩa, cả hai lợi suất đều đã trừ phí | **Sai**, đã sửa |
| 28 | cl/02 | Barber và Odean, "Trading Is Hazardous to Your Wealth: The Common Stock Investment Performance of Individual Investors", JF 55(2), 04/2000, tr. 773–806 | PDF Haas | Đúng |
| 29 | cl/02 | 66.465 hộ; 1991–1996; 11,4% / 17,9% / 16,4% / 18,5%; vòng quay ~75%; lợi suất gộp gần như bằng nhau | PDF (tóm tắt + tr. 774–775) | Đúng. Đã thêm: các hộ tự mua bán cổ phiếu (không phải quỹ), được chia thành 5 nhóm theo mức giao dịch; và giải thích "vòng quay 75%" bằng lời thường |
| 30 | cl/02 | Kahneman và Tversky, Econometrica 1979, hàm giá trị dốc hơn phía lỗ | Econometric Society: tập 47 số 2, 03/1979; "generally steeper for losses than for gains" | Đúng. Đã thêm tập/số và giải thích "lý thuyết triển vọng" |
| 31 | cl/02 | NBER WP 6733 trích French và Poterba (1991): nhà đầu tư các nước công nghiệp "reluctant to hold more than a fraction of their wealth in foreign assets" | PDF NBER; trang nber.org: Rowland và Tesar, "Multinationals and the Gains from International Diversification", 09/1998 | Đúng. Đã thêm tác giả và năm. Đã thêm ví dụ số lấy từ chính bài: cuối 1996, cổ phiếu nước ngoài chiếm 10% danh mục cổ phiếu Mỹ (Tesar và Werner 1997) |
| 32 | cl/02 | *Tư duy nhanh và chậm*, NXB Thế Giới + Alpha Books, 2014 | Thư viện số Quốc hội 11742/96559 (ISBN 9786047706907) | Đúng |
| 33 | cl/02 | *Tâm lý học về tiền* (Housel), NXB Dân Trí, 1980 Books, dịch giả Hoàng Thị Minh Phúc | Tiki API sản phẩm 75953557 (Công ty phát hành 1980 Books; NXB Dân Trí; Dịch giả Hoàng Thị Minh Phúc; 384 trang). Cũng có một ấn bản khác của NXB ĐHQG Hà Nội | Đúng. Đã thêm link Tiki vào Nguồn |
| 34 | cl/02 | Câu chuyện "Chị phân tích nghề này" | — | Diễn đạt (sai ngữ pháp). Đã sửa thành "Chị làm nghề phân tích đầu tư" |
| 35 | dgq/02 | "hai phép tính giúp bạn tự trả lời" (chỉ có một phép tính); "huề vốn với quỹ chỉ số" | — | Diễn đạt. Đã sửa thành "một phép tính nhỏ" và "kết quả ngang quỹ chỉ số" |

## Phép tính (node, đã tính lại)

| Bài | Phép tính | Kết quả node | Trong bài |
|---|---|---|---|
| dgq/01 | 2^(1/5) − 1 | 14,87% | 14,87% ✓ |
| dgq/01 | 100 × 1,2^5 | 248,83 | ~248,8 ✓ |
| dgq/01 | 1,5^(1/3) − 1 (phòng trọ) | 14,47% | ~14,5% ✓ |
| dgq/01 | Cần tăng để hồi sau khi giảm 10/20/30/50% | 11,1 / 25 / 42,9 / 100% | ✓ (bảng + SVG) |
| dgq/01 | Độ lệch chuẩn A (7,9,7,9) và B (−4,20,−4,20) | 1 và 12 | ✓ |
| dgq/01 | 100 qua 4 năm: A, B; CAGR | 136,03 / 132,71; 8,00% / 7,33% | ✓ |
| dgq/01 | Sharpe C, D | 0,40 / 0,30 | ✓ |
| dgq/01 | TD 13,7 − 15 | −1,3 | ✓ |
| dgq/01 | TE M / N (trung bình, độ lệch chuẩn) | −1,3 / 0,07; −1,3 / 2,55 | "nhỏ" / "lớn" ✓ |
| dgq/01 | NAV 100→200→100, mua thêm 100 triệu ở 200 | 150 triệu, −25% | ✓ (SVG ✓) |
| dgq/02 | Quỹ E (5,−5,2,−12,40) / F (7,6,8,5,6) | +25,35%, 4,62%/năm / +36,34%, 6,40%/năm | ✓ |
| dgq/02 | Quán cà phê 5/6; 5/10 | 83,3%; 50% | ✓ |
| dgq/02 | Phễu 40/80; 40/100 | 50%; 40% | ✓ (SVG ✓) |
| cl/01 | DCA 3 tháng: số chứng chỉ, giá bình quân, trung bình cộng | 915; 9.836; 10.167 | ✓ |
| cl/01 | Cam: 600/16; (30+50)/2 | 37,5; 40 | ✓ |
| cl/01 | 120 triệu, NAV tăng/giảm tuyến tính, mua đầu tháng | Tăng: 134,40 / 127,53; Giảm: 91,20 / 103,10 | ✓ |
| cl/01 | 60/40, cổ phiếu +30% | 78/118 = 66,1%; 70,8/47,2; bán 7,2 | ✓ (SVG: thanh 198/300 = 66% ✓) |
| cl/01 | FV 200 triệu × 3 năm, 20 triệu × 25 năm, lãi 5%, nạp cuối năm | 630,50; 954,54; phần lãi 4,84%; 47,6% | ✓ |
| cl/01 | Giảm 30% ở năm 3 | (200×1,05+200)×0,7+200 = 487; hụt 143,5 | **Bản cũ ghi 180/600: Sai**, đã sửa |
| cl/02 | 100 × 1,099^10; 100 × 1,087^10 | 257,0; 230,3 | ✓ |
| cl/02 | 100 × 1,08^10; 100 × 1,044^10 | 215,9; 153,8 | ✓ (bài trừ cộng gộp 8 − 3,6 và ghi "khoảng") |
| cl/02 | Gửi xe 5k × 3 × 30; 5k × 30 | 450k; 150k | ✓ |
| cl/02 | Chị Thu bán ở 80, mua lại ở 100, lên 120 | 80; 96 so với 120 | ✓ |
| cl/02 | SVG hai cột | 96,7/110 = 0,879 = 8,7/9,9 | ✓ |

## Link (curl, theo dõi chuyển hướng, UA trình duyệt)

Cả 16 link trong mục Nguồn đều trả về **200**: babson (Sirri-Tufano), haas (Barber-Odean), indexacapital (Vanguard 2010), militarymoneymanual (Vanguard 2012), 2 link thuvienso.quochoi.vn, wealthmanagement.com, stanford SR.htm, econometricsociety.org, evidenceinvestor.com, gipsstandards.org, kitces.com, morningstar.com.au, nber.org w6733.pdf, vanguard.ca, vanguard.co.uk. Link mới thêm: tiki.vn/tam-ly-hoc-ve-tien-p75953557.html, trả về 200. Không có link hỏng.

## Độ dễ hiểu (đã sửa)

- Đã tách các câu dài hơn 30 chữ trong thân bài: đoạn Morningstar, SPIVA, Sirri-Tufano, GIPS chỉ số tham chiếu, Barber-Odean (ở cả 2 bài), kết luận Vanguard 2010, chân trời/risk capacity, đoạn mở Mind the Gap, khoảng lăn, các câu "2,3%", và câu trong RealLife gửi xe. Hai câu dài còn lại nằm trong ghi chú "số giả định" ở mục Nguồn (là danh sách liệt kê), được giữ nguyên.
- Thuật ngữ nay đã được giải thích ngay lần đầu: sai số bám sát ("chênh lệch thay đổi nhiều hay ít"), ngưỡng, khoảng lăn, chân trời đầu tư, khẩu vị rủi ro và khả năng chịu lỗ, vòng quay danh mục, môi giới chiết khấu, lý thuyết triển vọng, quỹ vốn hoá lớn, ETF, NBER.
- RealLife: 7 khối, mỗi khối 64–75 tiếng, đều kết bằng "→". Đã thêm "(số giả định)" vào 3 khối có giá cả (phòng trọ, cam, gửi xe).
- Quy tắc: không có tên quỹ hay công ty quản lý quỹ. Tổ chức nghiên cứu (Vanguard, Morningstar, S&P DJI, CFA Institute, NBER) được phép nêu. Không có lời khuyên mua bán; câu kết luận Vanguard 2010 đã bỏ dạng mệnh lệnh. Mọi bằng chứng Mỹ đều ghi "Mỹ" và kỳ dữ liệu (đã bổ sung kỳ cho Sirri-Tufano và Barber-Odean ở dgq/02).

## SVG

- `danh-gia-quy-chi-so-danh-gia-sut-giam-can-hoi.svg`: đã vẽ lại. Đáy 70 trước đây nằm ở y = 150 (gần trục 0) nên trông như giảm hơn 80%. Nay đặt ở y = 92, tức 70% chiều cao của đỉnh so với trục; thêm mũi tên −30% và đường mức đáy. Vẫn dùng CSS var, không có hex, 1.956 byte, title/role/aria như cũ, 4 nhãn chữ, XML hợp lệ.
- 7 SVG còn lại: số và tỷ lệ đã kiểm (hai cột 9,9/8,7; thanh 60→66; bậc DCA 1/12; phễu là sơ đồ, không vẽ theo tỷ lệ, có ghi số). Không sửa.

## Không xác minh được

- Trang gốc của S&P SPIVA (403) và Morningstar Mind the Gap/Active-Passive bản Mỹ (chặn): chỉ dựa vào nguồn thứ cấp đã mở (mức B), khớp nhau.
- Trang của Sharpe 1994 trên Journal of Portfolio Management: bài chỉ ghi năm, không ghi trang.
- Kahneman và Tversky 1979: trang 263–291 hay 263–292 (Econometric Society ghi 292). Bài không ghi trang nên không ảnh hưởng.
- Tình trạng còn bán của bản Malkiel 2009 (không thấy trên Tiki; Fahasa 403). Bài đã có câu rào.

## Câu hỏi mở

1. Có chấp nhận ghi tên nhà sách trực tuyến (Tiki) trong mục Đọc thêm/Nguồn không? Content guide cho phép, nhưng writer brief cấm nêu "app" cụ thể. Nếu không, bỏ cụm "theo trang sách trên Tiki" và link Tiki ở cl/02, cả MDX lẫn snapshot.
2. Housel còn một ấn bản của NXB ĐHQG Hà Nội. Có cần nêu không, hay giữ ấn bản Dân Trí/1980 Books?

Status: DONE
Summary: Đã xác minh lại 35 khẳng định với nguồn gốc; sửa 2 lỗi Sai (hụt 180 triệu → 143,5 triệu; "phí" góp vào khoảng cách Mind the Gap) và 9 lỗi diễn đạt; vẽ lại 1 SVG cho đúng tỷ lệ. Đã đặt examplesReviewed: true ở 4 bài; verify:fidelity OK, astro check 0 lỗi.
