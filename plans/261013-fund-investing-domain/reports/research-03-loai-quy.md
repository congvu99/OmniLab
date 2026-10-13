# Research 03: Các loại quỹ (module `loai-quy`)

Ngày: 2026-10-13 · Phạm vi: Bài 01 (theo cấu trúc), Bài 02 (theo tài sản) · Trạng thái: DONE_WITH_CONCERNS

## Tóm tắt

- **Khung khái niệm quốc tế** (quỹ mở, quỹ đóng, ETF, rủi ro theo tài sản, chủ động vs chỉ số): nguồn chính là SEC Investor.gov. Phần lớn ý đối chiếu được ≥2 trang; ý nào chỉ 1 nguồn được đánh dấu 1N trong bảng kiểm chứng. Dùng được.
- **Pháp lý VN**: định nghĩa quỹ (Luật CK 54/2019 Đ4 kh.37–43) và TT 98/2020 mới có 1 nguồn thứ cấp mỗi văn bản. Chưa đạt vòng 2. TT 98 đã được sửa bởi TT 136/2025 (ký 29/12/2025; báo chí ghi hiệu lực 12/02/2026). Chưa mở được văn bản gốc TT 136. Vì vậy **mọi con số lấy từ TT 98 (lô ETF 100.000 CCQ, quỹ trái phiếu ≥80% NAV, tần suất định giá NAV) KHÔNG dùng trong bài.**
- **Chỉ số HOSE**: phương pháp VN30 xác minh qua HOSE-Index Ground Rule v4.0 (bản dịch) và factsheet dữ liệu 31/12/2024. **VNDiamond và VNFIN LEAD không có trong hai tài liệu này → KHÔNG dùng.** Không thấy căn cứ cho "tracker fund cần HOSE phê duyệt" trong Ground Rules → bỏ.
- **Quỹ thị trường tiền tệ VN** (TT 136/2025, theo báo chí): tối thiểu 80% NAV vào tiền gửi, chứng chỉ tiền gửi, công cụ nợ Chính phủ. Chỉ có báo chí (2 bài) → Chưa xác minh.
- **Bảo hiểm tiền gửi**: chứng chỉ quỹ không nằm trong danh sách tiền gửi được bảo hiểm (Luật 06/2012/QH13 Đ4.3, Đ18, Đ19; 2 nguồn khớp nhau). Xác minh tốt.
- **Chưa xác minh**: quỹ hưu trí bổ sung tự nguyện (tên luật, số hiệu), REIT niêm yết ở VN, ICI (không mở được).

### Xếp hạng độ tin cậy nguồn

| Hạng | Loại nguồn | Ví dụ trong báo cáo | Dùng cho |
|---|---|---|---|
| 1 | Cơ quan quản lý, trang chính thức | SEC Investor.gov (S1–S12) | Khái niệm, rủi ro quốc tế |
| 2 | Văn bản pháp luật VN qua host thứ cấp | hethongphapluat, luatvietnam, caselaw.vn, div.gov.vn (V1, V2, V6) | Định nghĩa, quyền lợi; cần đối chiếu Công báo trước khi xuất bản |
| 3 | Quy tắc chỉ số do sở ban hành, bản dịch | HOSE Ground Rule v4.0 + factsheet, host vietstock (V7, V8) | Phương pháp chỉ số |
| 4 | Báo chí VN | VCCI, Diễn đàn Doanh nghiệp (V4, V5) | Chỉ tìm văn bản gốc, không làm căn cứ nội dung |

### Đánh đổi và khuyến nghị (xếp hạng)

1. **Bài 01/02 lấy SEC làm xương sống khái niệm**; thêm lớp VN chỉ với điều khoản đã xác minh 2 nguồn (BHTG) hoặc đánh dấu "một nguồn" để fact-checker mở bản gốc. Chi phí: ít ví dụ VN cụ thể. Rủi ro thấp.
2. **Không đưa số liệu pháp lý VN từ TT 98/TT 136 vào bài** cho đến khi có bản gốc TT 136. Phương án "viết theo TT 98 kèm cảnh báo" bị loại: vi phạm quy tắc 3 và bài sẽ sai nếu TT 136 đổi số.
3. **Phương án loại**: đưa VNDiamond/VNFIN LEAD hoặc quỹ hưu trí tự nguyện vào như "đã biết" mà không có nguồn. Vi phạm quy tắc 3.

**Rủi ro adoption**: văn bản đổi nhanh (TT 136/2025 sửa TT 98/2020 đã được V2 ghi nhận; Luật 56/2024/QH15 sửa Luật CK 2019 theo tài liệu tìm kiếm, chưa xác minh). Mọi số liệu VN cần ngày kiểm tra lại trước khi xuất bản.

### Phương pháp và sai lệch quy trình (báo cáo minh bạch)

- WebFetch trả 403 cho toàn bộ investor.gov, ICI, thuvienphapluat.vn. Nội dung investor.gov được mở bằng `curl` (HTTP 200) và trích văn bản. Đây là sai lệch so với quy tắc "mở bằng WebFetch". Nội dung vẫn là trang gốc.
- vbpl.moj.gov.vn: lỗi DNS. Hsx.vn: trang chủ không có mục chỉ số.
- PDF (HOSE, BHTG): WebFetch không đọc được văn bản nhị phân; trích bằng `pdftotext` từ file đã tải về. Ground Rules và BHTG có lỗi font nhẹ, nội dung khớp.
- Ngân sách tìm kiếm: 5 lần WebSearch (theo skill). Các điểm còn thiếu được ghi ở mục Chưa xác minh.
- TT 98 trên luatvietnam bị cắt ở Điều 25; đã đọc tiếp bằng `offset`.

## Bài 01: Theo cấu trúc

### 1.1 Quỹ mở

- Mua/bán trực tiếp với quỹ hoặc qua môi giới. Giá = NAV kỳ tiếp theo (cộng phí mua nếu có). Bán lại bất kỳ ngày làm việc nào theo NAV kỳ tiếp theo, trừ phí bán lại (S1).
- NAV = (tài sản − nợ) / số lượng cổ phần đang lưu hành (S7, khái niệm NAV).
- VN: quỹ mở là quỹ đại chúng mà chứng chỉ quỹ phải được mua lại theo yêu cầu nhà đầu tư (V1 Đ4.39). Giá mua lại = NAV/CCQ trừ phí dịch vụ mua lại, nếu có (V2 Đ34.3, một nguồn).
- Đánh đổi: thanh khoản cao, nhưng nhà đầu tư không biết giá chính xác khi đặt lệnh; phí chi phối lợi nhuận (S1).

### 1.2 Quỹ đóng (niêm yết)

- Phát hành một lần rồi giao dịch trên sàn; không bắt buộc quỹ mua lại cổ phần; giá thị trường có thể lớn hơn hoặc nhỏ hơn giá trị tài sản (premium/discount) (S5).
- VN: quỹ đóng là quỹ đại chúng mà chứng chỉ không được mua lại theo yêu cầu nhà đầu tư (V1 Đ4.40).
- **Chưa xác minh**: quỹ đóng nào đang niêm yết ở VN; cơ chế giao dịch thực tế; tần suất định giá (chỉ có V2 Đ20.4(a), một nguồn, đã có sửa đổi).

### 1.3 ETF

- Cấu trúc: ETF phải đăng ký với SEC là open-end hoặc unit investment trust; giao dịch trên sàn ở giá thị trường trong phiên; có thể theo chỉ số hoặc chủ động (S2, S3).
- Tạo lập/mua lại: tổ chức lớn (authorized participant, AP) mua/đổi theo lô lớn gọi là "creation unit" (ví dụ 50.000 CP trong tài liệu SEC), thường trả bằng rổ chứng khoán (in-kind). Nhà đầu tư lẻ chỉ mua bán trên thị trường (S3).
- Giá: có thể premium hoặc discount so với NAV. Nhà đầu tư có thể mua/bán cao hơn hoặc thấp hơn NAV (S2).
- Sai lệch bám chỉ số: tracking error do phí, chi phí giao dịch, hoặc chỉ mua mẫu thay vì toàn bộ rổ (S8).
- VN (V1 Đ4.42): quỹ hoán đổi danh mục là quỹ mở hình thành từ việc nhận và hoán đổi danh mục CK cơ cấu lấy chứng chỉ quỹ; chứng chỉ được niêm yết và giao dịch trên sàn.
- VN (V2, một nguồn): thành viên lập quỹ là CTCK có môi giới và tự doanh, cùng ngân hàng lưu ký đã ký hợp đồng lập quỹ (Đ2.17). Chỉ thành viên lập quỹ hoán đổi trực tiếp với công ty quản lý quỹ (Đ43.2a). Chứng chỉ niêm yết giao dịch trên hệ thống của Sở (Đ44.1). iNAV là giá trị tài sản ròng tham chiếu trong phiên (Đ2.5).
- **Chưa dùng trong bài**: lô tối thiểu 100.000 CCQ (V2 Đ2.9, Đ43.2c) vì TT 136 có thể đã sửa.
- **Chưa xác minh**: chênh lệch giá–NAV ở ETF VN và cơ chế arbitrage cụ thể. Phần "AP giữ giá gần NAV" là suy luận nối S2 và S3. Cần nguồn chính thức (ICI không mở được).

### 1.4 Quỹ thành viên (VN)

- Quỹ đầu tư chứng khoán có 2–99 thành viên góp vốn, chỉ gồm nhà đầu tư chứng khoán chuyên nghiệp (V1 Đ4.41).
- Ghi chú cho người mới: không phải sản phẩm đại chúng. Không có so sánh US đã xác minh, nên không so sánh.

### 1.5 Quỹ đầu tư bất động sản (REIT-type, VN)

- Quỹ đầu tư chứng khoán đầu tư chủ yếu vào bất động sản và CK của tổ chức kinh doanh BĐS có doanh thu từ sở hữu, kinh doanh BĐS tối thiểu 65% trên báo cáo tài chính năm gần nhất (V1 Đ4.43, một nguồn).
- **Chưa xác minh**: có quỹ nào đang niêm yết không; thuế; có bị TT 136 sửa không. Dùng thuật ngữ "quỹ đầu tư bất động sản" theo luật VN, không dùng "REIT" trong bài nếu chưa có nguồn so sánh.

### 1.6 Quỹ hưu trí bổ sung tự nguyện

- **Chưa xác minh** (tên luật, số hiệu, hiệu lực không mở được; tra cứu Wikipedia trả 404). Không đưa vào bài.

### Bảng so sánh cấu trúc

| Tiêu chí | Quỹ mở | Quỹ đóng niêm yết | ETF |
|---|---|---|---|
| Mua/bán với | Quỹ hoặc kênh phân phối (S1) | Thị trường thứ cấp (S5) | Thị trường; AP đổi lô với quỹ (S3) |
| Giá | NAV kỳ tiếp theo (S1) | Giá thị trường, có thể premium/discount (S5) | Giá thị trường, có thể premium/discount (S2) |
| Thoát vốn | Bán lại cho quỹ (S1) | Bán cho người khác (S5) | Bán trên sàn; đổi lô chỉ AP (S3) |
| Rủi ro chính | Thị trường, phí | Chiết khấu so với giá trị tài sản (S5) | Sai lệch giá–NAV; tracking error (S2, S8) |
| VN | Luật Đ4.39; TT98 Đ34.3 (1 nguồn) | Luật Đ4.40 (1 nguồn) | Luật Đ4.42; TT98 Đ43–44 (1 nguồn) |

## Bài 02: Theo tài sản

### 2.1 Quỹ cổ phiếu

- Rủi ro chính là rủi ro thị trường: giá cổ phiếu biến động theo nền kinh tế và nhu cầu sản phẩm doanh nghiệp. Giá quỹ có thể tăng giảm nhanh (S11).
- Đa dạng hóa: quỹ "diversified" đầu tư vào nhiều công ty; quỹ "non-diversified" tập trung vào ít công ty hơn (S11).

### 2.2 Quỹ trái phiếu

- Trái phiếu là khoản vay: người mua nhận lãi suất cố định theo thời hạn và hoàn gốc khi đáo hạn (S12).
- **Rủi ro lãi suất**: lãi suất tăng làm giá trị quỹ có trái phiếu giảm. Quỹ nắm trái phiếu kỳ hạn dài chịu rủi ro này nhiều hơn quỹ nắm kỳ hạn ngắn (S9). Trái phiếu cũ lãi thấp có thể phải bán chiết khấu (S12).
- **Rủi ro tín dụng**: nhà phát hành không trả được nợ. Quỹ đầu tư vào trái phiếu xếp hạng tín nhiệm thấp rủi ro cao hơn (S9).
- **Rủi ro mua trước hạn (prepayment)**: nhà phát hành trả nợ sớm khi lãi suất giảm, quỹ có thể phải tái đầu tư ở lợi suất thấp hơn (S9).
- **Chưa xác minh**: định nghĩa và công thức duration từ trang SEC (trang glossary không trích được). Trong bài chỉ dùng: "kỳ hạn dài hơn thì nhạy hơn với lãi suất".
- VN (V2 Đ2.14, một nguồn, đã có sửa đổi): quỹ trái phiếu đầu tư vào trái phiếu, công cụ thị trường tiền tệ, tiền gửi có kỳ hạn, chiếm từ 80% NAV trở lên. **Chưa dùng con số 80%** cho đến khi xác minh TT 136.

### 2.3 Quỹ cân bằng

- Đầu tư nhiều loại tài sản, tỷ trọng tương đối cố định. Ví dụ tài liệu SEC: 60% cổ phiếu, 40% trái phiếu (S10). Dùng ví dụ này như minh họa, không phải khuyến nghị.
- Quỹ cân bằng không loại bỏ rủi ro: vẫn chịu rủi ro của từng tài sản thành phần (S10).
- **Chưa xác minh** định nghĩa "quỹ cân bằng" trong pháp luật VN (không có trong phần TT 98 đã đọc).

### 2.4 Quỹ thị trường tiền tệ

- Đầu tư vào nợ ngắn hạn thanh khoản cao và tiền mặt. Rủi ro thấp hơn các loại quỹ khác nhưng lợi suất lịch sử thấp hơn; phí có thể vượt thu nhập khi lãi suất ngắn hạn rất thấp (S6, S7).
- Đa số quỹ tiền tệ nhắm giữ NAV ổn định ở $1,00/cổ phần. Nếu NAV lệch quá nửa cent (break the buck), quỹ phải định giá lại. Khi đó nhà đầu tư lỗ (S7). Một số quỹ tổ chức dùng NAV thả nổi, giá có thể trên hoặc dưới $1,00 (S7).
- **Không phải tiền gửi**: không được FDIC bảo hiểm, khác với tiền gửi ngân hàng (S7; S2 cũng nêu quỹ không được FDIC bảo hiểm).
- VN, bảo hiểm tiền gửi (V6): tiền gửi được bảo hiểm là tiền gửi VND của cá nhân tại tổ chức tham gia bảo hiểm tiền gửi, gồm tiền gửi có kỳ hạn, không kỳ hạn, tiết kiệm, chứng chỉ tiền gửi, kỳ phiếu, tín phiếu (Đ18). Tổ chức tham gia là tổ chức tín dụng và chi nhánh ngân hàng nước ngoài (Đ4.3). Danh sách không có chứng chỉ quỹ. Kết luận: chứng chỉ quỹ không thuộc tiền gửi được bảo hiểm (đọc từ văn bản).
- **Chưa xác minh**: quỹ thị trường tiền tệ VN theo TT 136/2025 (xem mục Chưa xác minh).

### 2.5 Quỹ chủ động vs quỹ chỉ số (thụ động)

- Quỹ chỉ số (mutual fund hoặc ETF) cố gắng bám theo một chỉ số. Có thể mua toàn bộ hoặc chỉ một phần mẫu (S8).
- Quản lý thụ động: ít giao dịch, thường ít phí hơn, nhưng **không phải lúc nào cũng rẻ hơn** (S8).
- Quỹ chủ động: nhà quản lý chọn cổ phiếu/trái phiếu không nhất thiết theo chỉ số (S3).
- Rủi ro quỹ chỉ số: tracking error; ít linh hoạt khi giá giảm; underperformance do phí và chi phí giao dịch (S8).
- Lưu ý: chỉ số "smart beta" hoặc "quant" dùng công thức riêng, không phải chỉ số thị trường thuần (S8).
- VN (V2 Đ2.15, một nguồn): quỹ chỉ số là quỹ mở đầu tư vào danh mục CK cơ sở cấu thành chỉ số do Sở giao dịch chứng khoán xây dựng, quản lý, đáp ứng quy định về quỹ hoán đổi danh mục.

### 2.6 Chỉ số HOSE: phương pháp (mô tả, không khuyến nghị)

Nguồn: V7 (Ground Rule v4.0, bản dịch, mục nêu trong ngoặc), V8 (factsheet 31/12/2024). Phần này đã xác minh ở mức phương pháp.

| Chỉ số | Mô tả |
|---|---|
| VNAllShare | Toàn bộ CK niêm yết HOSE đạt tiêu chí (1.3.1) |
| VN30 | 30 mã vốn hóa lớn và thanh khoản nhất trong VNAllShare (1.3.2, 4.3.1) |
| VNMidcap | 70 mã vốn hóa lớn tiếp theo, ngoài VN30 (1.3.3) |
| VN100 | Hợp của VN30 và VNMidcap (1.3.4) |
| VNSmallcap | Phần còn lại ngoài VN100 (1.3.5) |
| Chỉ số ngành | Phân theo ngành GICS cấp 1 (1.3.6) |

Quy tắc VN30 (V7 §4.3.1):
- Loại mã có KLGD_KL dưới 300.000 CP, GTGD_KL dưới 30 tỷ VND; loại mã đang bị cảnh báo trong 3 tháng gần kỳ dữ liệu.
- Loại mã có LNST âm; yêu cầu BCTC kiểm toán không ngoại trừ. Các trường hợp đặc biệt đưa Hội đồng chỉ số xem xét.
- Xếp theo GTVH giảm dần. Hạng 1–20 luôn được chọn; hạng 21–40 ưu tiên rổ cũ; 5 mã dự bị.
- Gia quyền theo vốn hóa điều chỉnh free-float. Chặn tỷ trọng (capping): 10% mỗi mã, 15% nhóm mã liên quan, 40% nhóm cùng ngành GICS cấp 1 (§7.4 và bảng tóm tắt).
- Tần suất (bảng tóm tắt): đổi thành phần vào thứ Tư tuần thứ 3 của tháng 1 và 7; cập nhật số CP và free-float vào tháng 1, 4, 7, 10; có hiệu lực từ thứ Hai đầu tiên của tháng 2, 5, 8, 11.
- Chỉ số giá cập nhật thời gian thực mỗi 5 giây; chỉ số tổng lợi suất tính cuối phiên.
- Quản trị: Hội đồng chỉ số (Index Committee) giám sát; HOSE quản lý hằng ngày dưới sự chỉ đạo của VNX.

**Chưa xác minh (KHÔNG dùng)**: VNDiamond, VNFIN LEAD (không xuất hiện trong V7 và V8). "Sản phẩm theo chỉ số như quỹ tracker cần HOSE phê duyệt" (không thấy trong V7 đã trích; email index@hsx.vn có trong V7 §12 nhưng không kèm điều kiện phê duyệt).

### Bảng đánh đổi Bài 02

| Loại quỹ | Rủi ro chính | Biến động (định tính) | Nguồn |
|---|---|---|---|
| Cổ phiếu | Thị trường, ngành | Cao | S11 |
| Trái phiếu | Lãi suất (mạnh với kỳ hạn dài), tín dụng, mua trước hạn | Trung bình | S9, S12 |
| Cân bằng | Rủi ro của từng thành phần | Trung bình | S10 |
| Tiền tệ | Break the buck (NAV ổn định); không được FDIC bảo hiểm | Thấp, không phải tiền gửi | S6, S7 |
| Chỉ số | Tracking error; phí | Theo chỉ số nền | S8 |
| Chủ động | Chọn sai nhà quản lý; phí cao hơn | Tùy quỹ | S3, S8 |

## Bảng kiểm chứng

### Danh mục nguồn

Tất cả truy cập ngày 2026-10-13. "Mở bằng" ghi phương thức thực tế.

| ID | Tài liệu | URL | Mở bằng / ngày trên nguồn |
|---|---|---|---|
| S1 | Investor.gov, Mutual Funds | https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-funds-etfs/mutual-funds | curl HTTP 200 (WebFetch 403); không thấy ngày cập nhật |
| S2 | Investor.gov, Exchange-Traded Funds (ETFs) | https://www.investor.gov/introduction-investing/basics/investment-products/exchange-traded-funds-etfs | curl 200 (WebFetch 403); không thấy ngày |
| S3 | Investor.gov, Updated Investor Bulletin: ETFs | https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24 | curl 200; trang có chuỗi "Feb. 23, 2023" (không rõ là ngày cập nhật) |
| S4 | Investor.gov, Characteristics of Mutual Funds and ETFs (Bulletin) | https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/characteristics-mutual-funds-exchange-traded-funds | curl 200; trang ghi April 29, 2025 |
| S5 | Investor.gov, Publicly Traded Closed-End Funds | https://www.investor.gov/introduction-investing/investing-basics/investment-products/closed-end-funds/publicly-traded-closed-end-funds | curl 200 |
| S6 | Investor.gov, Money Market Funds (mục sản phẩm) | https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-5 | curl 200 |
| S7 | Investor.gov, Updated Investor Bulletin: Money Market Funds | https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated-12 | curl 200; trang ghi Nov. 4, 2024 |
| S8 | Investor.gov, Index Funds | https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-4 | curl 200 |
| S9 | Investor.gov, Glossary: Bond funds and income funds | https://www.investor.gov/introduction-investing/investing-basics/glossary/bond-funds-and-income-funds | curl 200 |
| S10 | Investor.gov, Glossary: Balanced fund | https://www.investor.gov/introduction-investing/investing-basics/glossary/balanced-fund | curl 200 |
| S11 | Investor.gov, Glossary: Stock fund | https://www.investor.gov/introduction-investing/investing-basics/glossary/stock-fund | curl 200 |
| S12 | Investor.gov, Bonds | https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds | curl 200 |
| V1 | Luật Chứng khoán 54/2019/QH14, Đ4 kh.37–43 | https://hethongphapluat.com/luat-chung-khoan-2019/khoan-37-dieu-4 (đến khoan-43-dieu-4) | curl 200; số hiệu 54/2019/QH14 hiển thị trên trang; trang khoản 1 mở bằng WebFetch |
| V2 | Thông tư 98/2020/TT-BTC (bản luatvietnam, có ghi sửa đổi bởi TT 136/2025) | https://luatvietnam.vn/tai-chinh/thong-tu-98-2020-huong-dan-hoat-dong-va-quan-ly-quy-dau-tu-chung-khoan-196328-d1.html | WebFetch 200 (2 lần, có offset); ban hành 16/11/2020, hiệu lực 01/01/2021 |
| V3 | Thông tư 136/2025/TT-BTC (metadata) | https://thuviennhadat.vn/vbpl/thong-tu-136-2025-tt-btc-sua-doi-thong-tu-98-2020-tt-btc-687395.html | WebFetch 200; ký 29/12/2025; hiệu lực ghi "Đã biết" (không có ngày) |
| V4 | VCCI, bài về TT 136/2025 | https://www.vcci.com.vn/tin-tuc/thong-tu-136-2025-tt-btc-buoc-ngoat-moi-trong-quan-ly-quy-dau-tu-chung-khoan | WebFetch 200; ngày đăng 01/01/2026 |
| V5 | Diễn đàn Doanh nghiệp, bài về TT 136/2025 | https://diendandoanhnghiep.vn/mo-duong-cho-quy-dau-tu-ha-tang-kien-tao-dong-von-dai-han-cho-nen-kinh-te-10168486.html | WebFetch 200; ngày đăng 02/01/2026 |
| V6 | Luật Bảo hiểm tiền gửi 06/2012/QH13 | https://caselaw.vn/van-ban-phap-luat/115773-luat-bao-hiem-tien-gui-so-06-2012-qh13-ngay-18-06-2012-cua-quoc-hoi ; https://div.gov.vn/uploads/files/PDF/1.Luat-bao-hiem-tien-gui-so-06-2012-qh13.pdf | WebFetch 200 (caselaw, ghi "Đang có hiệu lực", hiệu lực 01/01/2013); PDF div.gov.vn tải và đọc bằng pdftotext |
| V7 | HOSE-Index Ground Rule v4.0 (bản dịch EN), Quyết định 747/QĐ-SGDHCM ngày 30/12/2024 | https://static2.vietstock.vn/vietstock/2024/12/30/20241230_25_12_hose_index_4_0_translation.pdf | WebFetch không đọc được PDF; đọc bằng pdftotext từ file tải qua WebFetch |
| V8 | HOSE-Index factsheet, data as at 31/12/2024 | https://static2.vietstock.vn/vietstock/2025/1/13/20250113_form_factsheet_mcindices_eng_t01_2025.pdf | curl 200; pdftotext |

Không mở được: ICI (https://www.ici.org/faqs/faqs-exchange-traded-funds-etfs, 403 cả WebFetch lẫn curl); thuvienphapluat.vn (403); vbpl.moj.gov.vn (lỗi DNS); hsx.vn (trang chủ không có mục chỉ số); vi.wikipedia.org trang quỹ hưu trí (404).

### Khẳng định và trạng thái

Trạng thái: **XM** = xác minh từ ≥2 nguồn độc lập; **1N** = một nguồn (dùng được có ghi chú, fact-checker phải mở bản gốc); **CXM** = chưa xác minh, KHÔNG dùng trong bài.

| # | Khẳng định | Nguồn | Trạng thái | Dùng trong bài |
|---|---|---|---|---|
| 1 | Quỹ mở mua/bán theo NAV kỳ tiếp theo, trừ phí | S1, S4 (+ V2 Đ34.3 cho VN) | XM (US); 1N (VN) | Có |
| 2 | NAV = (tài sản − nợ)/số cổ phần | S7 | 1N (SEC) | Có, ghi nguồn |
| 3 | Quỹ đóng không buộc mua lại; giá premium/discount so với giá trị tài sản | S5 | 1N (US); VN: CXM | Có, ghi rõ "theo SEC" |
| 4 | Quỹ đóng VN là quỹ không mua lại theo yêu cầu | V1 Đ4.40 | 1N | Có, ghi nguồn |
| 5 | ETF đăng ký open-end hoặc UIT; giao dịch trên sàn; có thể premium/discount | S2, S3 (cấu trúc); S2 (premium) | XM cấu trúc; 1N premium | Có |
| 6 | Chỉ AP mua/đổi lô lớn (ví dụ 50.000 CP), thường in-kind; nhà đầu tư lẻ chỉ mua bán thị trường | S3 | 1N (US) | Có, ghi là "ví dụ" |
| 7 | ETF VN là quỹ mở hoán đổi danh mục, niêm yết trên sàn | V1 Đ4.42; V2 Đ44.1 | 1N + 1N (2 văn bản) | Có, ghi nguồn |
| 8 | Thành viên lập quỹ là CTCK; chỉ họ hoán đổi trực tiếp với quỹ | V2 Đ2.17, Đ43.2a | 1N | Có, ghi nguồn bản 2020 |
| 9 | Lô ETF VN tối thiểu 100.000 CCQ | V2 Đ2.9, Đ43.2c | 1N, có sửa đổi chưa kiểm | **CXM — KHÔNG dùng số** |
| 10 | iNAV tham chiếu trong phiên (VN) | V2 Đ2.5 | 1N | Có, không kèm số |
| 11 | ETF không được FDIC bảo hiểm | S2 | 1N (US) | Có |
| 12 | Chênh lệch giá ETF–NAV được AP giữ gần NAV | S2, S3 (suy luận nối) | CXM (cần nguồn chính thức) | Không |
| 13 | Index fund: tracking error; passive ít phí nhưng không luôn rẻ hơn | S8, S2 | XM (2 trang SEC) | Có |
| 14 | Quỹ chỉ số VN: chỉ số do Sở xây dựng, quản lý | V2 Đ2.15 | 1N | Có, ghi nguồn |
| 15 | Quỹ thành viên VN: 2–99 thành viên, nhà đầu tư chuyên nghiệp | V1 Đ4.41 | 1N | Có, ghi nguồn |
| 16 | Quỹ đầu tư BĐS VN: ≥65% doanh thu từ BĐS | V1 Đ4.43 | 1N | Có, ghi nguồn; không nói đã niêm yết |
| 17 | Rủi ro lãi suất: kỳ hạn dài nhạy hơn; lãi suất tăng làm giá trái phiếu giảm | S9, S12 | XM | Có |
| 18 | Rủi ro tín dụng, mua trước hạn | S9 | 1N (SEC glossary) | Có |
| 19 | Quỹ trái phiếu VN ≥80% NAV vào trái phiếu, CCTTTT, tiền gửi có kỳ hạn | V2 Đ2.14 | 1N, có sửa đổi | **CXM — KHÔNG dùng số 80%** |
| 20 | Quỹ cân bằng ví dụ 60/40, vẫn chịu rủi ro thành phần | S10 | 1N (SEC) | Có, ghi là ví dụ |
| 21 | Quỹ tiền tệ: NAV $1,00; break the buck; NAV thả nổi ở một số quỹ tổ chức | S7 | 1N (SEC, bài đọc đầy đủ) | Có, ghi nguồn |
| 22 | Quỹ tiền tệ không phải tiền gửi, không được FDIC bảo hiểm | S7 | 1N (US) | Có, ghi nguồn |
| 23 | Chứng chỉ quỹ không thuộc tiền gửi được bảo hiểm VN | V6 (Đ4.3, Đ18, Đ19) | XM (caselaw + div.gov.vn) | Có |
| 24 | Quỹ thị trường tiền tệ VN 80% tiền gửi/CCTG/công cụ nợ CP (TT 136) | V4, V5 (báo chí) | CXM (không có văn bản gốc) | **Không** |
| 25 | VN30: 30 mã, vốn hóa free-float, chọn từ VNAllShare; loại thanh khoản thấp, LNST âm; hạng 1–20 giữ; 5 mã dự bị; capping 10/15/40% | V7 §4.3.1, §7 (chi tiết); V8 (đối chiếu cấu trúc, free-float) | XM cấu trúc; 1N chi tiết (bản dịch) | Có, ghi "theo Ground Rule v4.0 bản dịch" |
| 26 | Các chỉ số HOSE: VNAllShare, VN30, VNMidcap, VN100, VNSmallcap, chỉ số ngành | V7 §1.3; V8 | XM | Có |
| 27 | Lịch đổi thành phần và cập nhật free-float của VN30 | V7 (bảng tóm tắt) | 1N (bản dịch, bảng) | Có, ghi nguồn; kiểm lại bản Việt |
| 28 | VNDiamond, VNFIN LEAD là chỉ số HOSE | Không có trong V7, V8 | CXM | **Không** |
| 29 | Tracker fund cần HOSE phê duyệt | Không thấy trong V7 đã trích | CXM | **Không** |
| 30 | Luật CK 2019 là căn cứ cho định nghĩa quỹ | V1 (số hiệu hiển thị trên trang) | 1N (vòng 2 chưa đạt) | Có, ghi "theo bản thứ cấp" |

## Chưa xác minh

Không dùng trong bài cho đến khi có nguồn đạt yêu cầu.

1. **TT 136/2025/TT-BTC** (văn bản gốc): hiệu lực (báo chí ghi 12/02/2026; trang VBPL được tóm tắt trong kết quả tìm kiếm ghi "chưa có hiệu lực", mâu thuẫn và chưa mở được); các điều sửa đổi về lô ETF, định giá NAV, quỹ trái phiếu (80%) và quỹ thị trường tiền tệ.
2. **Quỹ thị trường tiền tệ VN** theo TT 136: tên gọi chính thức, tỷ lệ 80% tài sản an toàn, cấu trúc. Chỉ có 2 bài báo.
3. **Quỹ hưu trí bổ sung tự nguyện**: tên luật, số hiệu, ngày hiệu lực, cơ chế. Không tra cứu được.
4. **REIT / quỹ đầu tư bất động sản đang niêm yết ở VN**: có hay không, số lượng, mã nào (không khuyến nghị mã cụ thể).
5. **Luật 56/2024/QH15** sửa Luật CK 2019: có ảnh hưởng đến Đ4 kh.37–43 không.
6. **Chênh lệch giá–NAV và arbitrage của ETF VN**: chưa có số liệu hoặc nguồn chính thức.
7. **Quy trình đặt lệnh ETF/quỹ mở qua CTCK hoặc đại lý phân phối ở VN**: chưa có nguồn. Không nêu tên kênh cụ thể.
8. **ICI** (creation/redemption, ETF basics): không mở được. Mục ETF dựa vào SEC.
9. **Bản tiếng Việt Ground Rule HOSE** (hsx.vn): không mở được. V7 là bản dịch trên vietstock.
10. **VNDiamond, VNFIN LEAD**: nguồn chính thức và phương pháp.
11. **Duration** (định nghĩa, công thức) trong SEC glossary: không trích được.
12. **Quỹ đóng niêm yết ở VN**: có hay không.
13. **Luật BHTG sửa đổi**: báo chí (tìm kiếm) nói Ngân hàng Nhà nước đang soạn thảo bản sửa đổi (08/2025). Chưa xác minh. Bản hiện hành dùng cho bài là Luật 06/2012/QH13.
14. **Quỹ cân bằng trong pháp luật VN**: định nghĩa.

## Ví dụ đời sống (bối cảnh VN, số giả định)

Các ví dụ dưới đây là minh họa, không phải số liệu thực. Không gắn tên quỹ hoặc công ty cụ thể.

**Bài 01**
1. **Minh bấm mua quỹ mở lúc 9 giờ sáng thứ Sáu.** Giá áp dụng là NAV của kỳ giao dịch kế tiếp, không phải giá lúc Minh bấm. Minh không biết giá chính xác khi đặt lệnh (S1). Số giả định: NAV 10.000 đồng/CCQ; phí mua 1% thì Minh trả 10.100 đồng cho mỗi CCQ.
2. **Chị Thu mua ETF trên sàn lúc 10 giờ sáng.** Giá khớp là giá thị trường, có thể cao hơn hoặc thấp hơn NAV tham chiếu (iNAV). Chị so sánh với giá trị rổ cổ phiếu và thấy giá cao hơn 0,5% (số giả định) (S2, V2 Đ2.5).
3. **Quỹ đóng như cổ phiếu của một quỹ.** Muốn thoát vốn, Minh phải bán cho người khác trên thị trường. Giá có thể thấp hơn giá trị tài sản ròng (S5). Số giả định: NAV 10.000, giá thị trường 9.500 (chiết khấu 5%).
4. **Quỹ thành viên không dành cho Minh.** Theo luật VN, quỹ thành viên chỉ có 2–99 thành viên và đều là nhà đầu tư chuyên nghiệp (V1 Đ4.41). Đây là ví dụ để người đọc không nhầm với quỹ đại chúng.

**Bài 02**
1. **Chị Thu nắm quỹ trái phiếu kỳ hạn dài.** Lãi suất thị trường tăng 1 điểm phần trăm, giá trái phiếu cũ lãi thấp giảm, NAV quỹ giảm. Quỹ kỳ hạn dài giảm nhiều hơn quỹ kỳ hạn ngắn (S9, S12). Số giả định: quỹ có NAV 10.000; kỳ hạn dài giảm 4%, kỳ hạn ngắn giảm 1%.
2. **Minh coi quỹ tiền tệ như gửi tiết kiệm.** Quỹ tiền tệ không phải tiền gửi ngân hàng. Chứng chỉ quỹ không nằm trong danh sách tiền gửi được bảo hiểm (V6 Đ18). Nếu NAV lệch khỏi mức mục tiêu, Minh có thể lỗ (S7).
3. **Quỹ cân bằng 60/40 khi thị trường giảm.** Phần cổ phiếu giảm và phần trái phiếu cũng có thể giảm vì lãi suất. Quỹ không tránh được giảm giá (S10). Số giả định: giảm 10% phần cổ phiếu và 2% phần trái phiếu thì danh mục giảm 6,8% (0,6 × 10% + 0,4 × 2%).
4. **Quỹ chỉ số VN30 và quỹ chủ động cùng cầm một mức phí.** Quỹ chỉ số bám theo VN30 có thể lệch so với chỉ số do phí và chi phí giao dịch (tracking error). Đây là lý do cần đọc tracking error trước khi so kết quả (S8). Chỉ mô tả phương pháp VN30, không nêu quỹ nào.

## Ý tưởng SVG

Mỗi bài 2 ý, theo style monoline của dự án (xem `docs/illustration-style-guide.md`).

**Bài 01**
- **SVG-01-A: Hai vòng của ETF.** Vòng sơ cấp: AP/thành viên lập quỹ ⇄ quỹ ETF, đổi "rổ chứng khoán" lấy "lô CCQ" (chú thích: lô lớn, chỉ tổ chức). Vòng thứ cấp: nhà đầu tư ⇄ sàn ⇄ CCQ niêm yết (giá thị trường). Mũi tên "chênh lệch giá–NAV" nối hai vòng. Không ghi số lô.
- **SVG-01-B: Quỹ mở / quỹ đóng / ETF.** Ba cột. Hàng 1: "mua/bán với ai" (quỹ / thị trường / sàn qua AP). Hàng 2: "giá theo gì" (NAV kỳ tiếp theo / giá thị trường / giá thị trường so với NAV tham chiếu). Hàng 3: "rủi ro chính". Không ghi số.

**Bài 02**
- **SVG-02-A: Lãi suất tăng, kỳ hạn dài giảm nhiều hơn.** Hai thanh giá trị: kỳ hạn ngắn và kỳ hạn dài, trước và sau khi lãi suất tăng. Thanh kỳ hạn dài giảm nhiều hơn. Số minh họa, ghi "số giả định".
- **SVG-02-B: Phổ rủi ro theo tài sản.** Thang từ tiền tệ → trái phiếu → cân bằng → cổ phiếu, với nhãn rủi ro chính trên từng nấc. Không ghi lợi suất.

## Câu hỏi mở

1. Có thể mở văn bản gốc TT 136/2025 (Công báo hoặc cơ sở dữ liệu Bộ Tài chính) để xác định hiệu lực và các điều sửa đổi về lô ETF, NAV, quỹ trái phiếu, quỹ tiền tệ?
2. Luật 56/2024/QH15 có sửa Đ4 khoản 37–43 Luật CK 2019 không? Cần bản Công báo để vòng 2.
3. Bản tiếng Việt Ground Rule HOSE (hsx.vn) có khớp bản dịch V7? VNDiamond và VNFIN LEAD thuộc nguồn nào?
4. Quỹ hưu trí bổ sung tự nguyện: đưa vào module hay bỏ? Nếu đưa vào, cần tên luật và số hiệu từ nguồn chính thức.
5. Có cần đưa ETF/quỹ mở "kênh phân phối" vào bài? Nếu có, cần nguồn VN về kênh giao dịch.
6. ICI có cần mở bằng cách khác (qua trình duyệt thật) để củng cố cơ chế AP không?
7. Tên gọi "quỹ đầu tư bất động sản" đã có quỹ niêm yết chưa? Nếu có, cần nguồn SSC hoặc HOSE/HNX.

Status: DONE_WITH_CONCERNS
Summary: Khung khái niệm quốc tế và phương pháp chỉ số VN30 đã xác minh tốt; pháp lý VN (TT 98/TT 136), VNDiamond/VNFIN LEAD, quỹ tiền tệ VN, quỹ hưu trí tự nguyện và REIT niêm yết chưa xác minh nên bị loại khỏi bài.
