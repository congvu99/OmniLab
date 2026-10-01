# Fact-check C — Giao tiếp & lãnh đạo, Phân tích ngành

Ngày kiểm: 2026-10-01. Người kiểm: fact-checker độc lập (chỉ đọc, không sửa bài).
Phạm vi: 4 file MDX dưới `src/content/lessons/nghe-tai-chinh/{giao-tiep-lanh-dao,phan-tich-nganh}/`.
Quy tắc đối chiếu: `docs/content-authoring-guide.md` (RealLife, quy tắc riêng Tài chính, "Lĩnh vực tự biên soạn").

Tổng: kiểm khoảng 62 khẳng định (≈17 + 14 + 19 + 12), 6 khối RealLife, 26 URL. Phát hiện 1 lỗi **Sai** dùng chung ở 2 file (năm khảo sát CFA), còn lại là Chưa xác minh / Diễn đạt. Không có link hỏng thật (403 của fahasa/weforum, timeout của mckinsey.com là chặn bot; đã xác minh trang tồn tại bằng WebSearch).

Nếu sửa nội dung chính thì nhớ sửa **cả snapshot** `content-sources/nghe-tai-chinh/06-giao-tiep-lanh-dao/*.md` và `07-phan-tich-nganh/*.md` (fidelity gate).

---

## 1. `giao-tiep-lanh-dao/01-hieu-nhanh.mdx`

Đã kiểm 17 khẳng định, 2 RealLife, 8 URL.

| Mức | Vị trí (trích) | Vấn đề | Đề xuất thay thế | Nguồn |
|---|---|---|---|---|
| **Sai** | Mục "Lãnh đạo ngành đánh giá…": "Trong khảo sát năm 2021 của CFA Institute" | Báo cáo *Investment Professional of the Future* (bản tóm tắt chính là link ở mục Nguồn) ghi **MAY 2019** ở trang bìa. Số 49/21/16/14 khớp nguyên văn, chỉ có năm bị sai. | "Trong báo cáo năm 2019 của CFA Institute (*Investment Professional of the Future*), khi lãnh đạo ngành đầu tư chọn nhóm kỹ năng quan trọng nhất cho 5–10 năm tới, …" | [CFA exec summary PDF, tr.1 "MAY 2019", tr.2 "49% … leadership skills (21%), soft skills (16%), and technical skills (14%)"](https://rpc.cfainstitute.org/-/media/documents/survey/investment-prof-future-exec-summary-v2.pdf) |
| Diễn đạt | Như trên: "lãnh đạo (21%) và kỹ năng mềm (16%) được chọn nhiều hơn kỹ năng kỹ thuật thuần (14%)" | Đúng số nhưng bỏ mất hạng nhất (T-shaped 49%), nên người đọc dễ hiểu lãnh đạo là nhóm đứng đầu. | "…kỹ năng hình chữ T đứng đầu (49%), tiếp theo là lãnh đạo (21%), kỹ năng mềm (16%), rồi mới đến kỹ năng kỹ thuật (14%)." | như trên |
| Chưa xác minh | Đọc thêm: "*Nguyên lý kim tự tháp Minto* … bản tiếng Việt bán trên Fahasa, Tiki" | Bản tiếng Việt duy nhất tìm được là của NXB Tổng hợp TP.HCM (dịch: Bùi Quang Minh), 356 tr., in 2008/2012, giá bìa 62.000đ. Trang Fahasa có tồn tại nhưng các kết quả tìm kiếm cho thấy **tạm hết hàng**. Tìm trên Tiki (API tìm kiếm + WebSearch) **không có** sản phẩm nào. Hiện sách chủ yếu còn ở chợ sách cũ (Oreka, muabansachcu) và thư viện (ĐH FPT…). Như vậy chưa đạt quy tắc "mua được ở VN". | Bỏ "Tiki" và ghi đúng thực trạng: "bản tiếng Việt (NXB Tổng hợp TP.HCM) hiện khó mua mới, tìm ở thư viện hoặc nhà sách cũ". Hoặc thay bằng một sách tiếng Việt đang bán về viết/trình bày theo cấu trúc. Biên tập viên cần kiểm tình trạng hàng trên Fahasa bằng trình duyệt. | [Fahasa (403 với bot, có trong chỉ mục tìm kiếm)](https://www.fahasa.com/nguyen-ly-kim-tu-thap-minto.html); [Thư viện ĐH FPT](https://library.fpt.edu.vn/SearchBook/Detail?detail_id=4363); [Oreka (sách cũ)](https://www.oreka.vn/en/mua-ban-sach/nguyen-ly-kim-tu-thap-minto-detail/20332) |
| Diễn đạt | Ý 1: "sau đó là 3–4 luận điểm đỡ câu trả lời" | Minto không cố định 3–4. Bà khuyên mỗi nhóm không quá khoảng 5 ý, thường gặp nhất là 3. Ghi "3–4" như một quy tắc là chắc hơn bằng chứng. | "…sau đó là vài luận điểm (thường 2–5, hay gặp nhất là 3) đỡ câu trả lời" | Minto, *The Pyramid Principle*, ch.1 ("magical number seven" → khuyến nghị nhóm nhỏ) |
| Chưa xác minh (nguồn không đỡ) | Ý 5: "Khung năng lực của ACCA đặt trí tuệ cảm xúc cạnh kiến thức kỹ thuật" | Khẳng định đúng: ACCA có 7 "professional quotients" gồm Technical & Ethics (TEQ) và Emotional intelligence (EQ). Nhưng trang ACCA được dẫn ở mục Nguồn **không nhắc** đến EQ, chỉ trỏ sang báo cáo *Professional accountants – the future*. | Giữ câu. Đổi hoặc bổ sung nguồn: "ACCA — seven professional quotients" (PDF). | [ACCA seven quotients PDF](https://www.accaglobal.com/content/dam/ACCA_Global/Members/Advocacy/resources/ACCA-seven-quotients-PPT.pdf) |

Đã xác minh đúng (không cần sửa): WEF Future of Jobs 2025 đưa "leadership and social influence" vào top 3 kỹ năng cốt lõi. Minto là nữ MBA đầu tiên McKinsey tuyển (1963), phương pháp ra đời từ việc dạy viết cho nhân viên McKinsey. Knaflic từng làm phân tích ở ngân hàng, quỹ đầu tư tư nhân (private equity) và Google People Analytics (Chicago Booth). Fisher & Ury thuộc Harvard Negotiation Project, 4 nguyên tắc và BATNA đều đúng theo sách. *Storytelling with Data* bản Việt: Sunbook / NXB Thế Giới, còn hàng trên Tiki. Mọi URL đều sống (WEF 403 và mckinsey.com timeout là do chặn bot; WebSearch xác nhận cả hai trang tồn tại).

RealLife:
- "Bác sĩ báo kết quả xét nghiệm" (≈73 tiếng): đúng cơ chế, kết bằng "→", bối cảnh VN. Đạt.
- "Hai chị em tranh quả cam" (≈80 tiếng): đúng cơ chế lập trường/lợi ích (truyện kinh điển dùng trong *Getting to Yes*). Đạt.

**Kết luận: CẦN SỬA** (năm khảo sát CFA; tình trạng mua được của sách Minto)

---

## 2. `giao-tiep-lanh-dao/02-hoc-o-dau.mdx`

Đã kiểm 14 khẳng định, 1 RealLife, 7 URL.

| Mức | Vị trí (trích) | Vấn đề | Đề xuất thay thế | Nguồn |
|---|---|---|---|---|
| Chưa xác minh | Bảng "Học ở đâu": "*Nguyên lý kim tự tháp Minto* … Tiếng Việt, bán trên Fahasa, Tiki"; Chặng 1 "Học gì" | Giống file 01: bản NXB Tổng hợp TP.HCM có vẻ đã tạm hết hàng, Tiki không có. Chặng 1 lại dựa hoàn toàn vào cuốn này. | Ghi chú cột Ngôn ngữ: "Tiếng Việt (NXB Tổng hợp TP.HCM), khó mua mới, tìm ở thư viện/sách cũ". Chặng 1 bổ sung phương án dự phòng: bài viết tiếng Việt miễn phí về nguyên tắc kim tự tháp, hoặc một sách thay thế đang bán. | xem file 01 |
| Diễn đạt | Bảng: Toastmasters "Tiếng Anh, một số câu lạc bộ tiếng Việt" | Tìm thấy CLB **song ngữ** ("English Vietnamese Online Toastmasters Club", TP.HCM, 2021). Chưa thấy CLB thuần tiếng Việt. Việc có CLB ở Việt Nam là đúng (Saigon TM 2010, Hanoi Speakers 2011, UEH-ISB, Đà Nẵng…). | "Tiếng Anh; có câu lạc bộ song ngữ Anh–Việt" | [Toastmasters — English Vietnamese Online club](https://www.toastmasters.org/Find-a-Club/07881440-english-vietnamese-online-toastmasters-club) |
| Diễn đạt (nhỏ) | Bảng: "*Thương lượng không nhân nhượng* … Tiếng Việt (Alpha Books)" | Đúng. Alpha Books phát hành, NXB Thế Giới xuất bản. Trên trang Alpha có biến thể hiện "Hết hàng" nhưng vẫn có biến thể còn hàng, Tiki có nhiều nhà bán. Không phải lỗi; có thể ghi thêm NXB cho chuẩn. | "Tiếng Việt (Alpha Books – NXB Thế Giới)" | [Alpha Books](https://www.alphabooks.vn/thuong-luong-khong-nhan-nhuong) |

Đã xác minh đúng: *Let's Practice!* bản Việt "Thực hành kể chuyện thông qua dữ liệu" (Sunbook / NXB Thế Giới, 2021, còn hàng). *Hùng biện kiểu TED 3* (Carmine Gallo, Alpha Books / NXB Thế Giới, 364 tr., có trên Tiki). Coursera *Successful Negotiation: Essential Strategies and Skills* (U. Michigan, George Siedel) học miễn phí dạng audit, có đàm phán thực hành với bạn học (Module 6). *Business English: Making Presentations* (U. Washington) học miễn phí dạng audit, có module "Referring to Data and Describing Visuals", bài cuối dùng biểu đồ. *Getting to Yes* bán khoảng 15 triệu bản (Ury, 2022), nên "một trong những sách đàm phán bán chạy nhất" là có cơ sở. Gallo đã phân tích hơn 500 bài TED. Mọi URL sống và đúng sản phẩm.

RealLife "Học nấu ăn phải có người nếm" (≈68 tiếng): đúng cơ chế phản hồi, kết "→", bối cảnh VN. Đạt.

**Kết luận: CẦN SỬA** (chỉ phần sách Minto; các mục khác là Diễn đạt nhỏ)

---

## 3. `phan-tich-nganh/01-hieu-nhanh.mdx`

Đã kiểm 19 khẳng định, 2 RealLife, 6 URL.

| Mức | Vị trí (trích) | Vấn đề | Đề xuất thay thế | Nguồn |
|---|---|---|---|---|
| **Sai** | "Vì sao cần hiểu sâu…": "Trong khảo sát năm 2021 của CFA Institute, 49% lãnh đạo ngành đầu tư xếp hồ sơ T-shaped…" | Báo cáo ra năm **2019** (May 2019). Số 49% đúng. | "Trong báo cáo năm 2019 của CFA Institute (*Investment Professional of the Future*), 49% lãnh đạo ngành đầu tư xếp kỹ năng hình chữ T là nhóm quan trọng nhất cho 5–10 năm tới." | [CFA exec summary PDF](https://rpc.cfainstitute.org/-/media/documents/survey/investment-prof-future-exec-summary-v2.pdf) |
| Diễn đạt | Mở bài: "nợ phải trả gấp hơn mười lần vốn chủ sở hữu. Với một chuỗi bán lẻ, con số đó là dấu hiệu sắp phá sản." | Câu này chắc chắn hơn bằng chứng. Đòn bẩy 10 lần ở doanh nghiệp phi tài chính là rủi ro rất cao, nhưng chưa chắc "sắp phá sản". | "Với một chuỗi bán lẻ, con số đó là dấu hiệu đòn bẩy cực cao, rủi ro mất khả năng trả nợ rất lớn." | — |
| Diễn đạt | RealLife "Quán phở đầu ngõ…" (≈96 tiếng kể cả tiêu đề, vượt mức 90) | Có hai điểm. (1) Quá 90 tiếng mà không có câu giới hạn. (2) Ẩn dụ chỉ minh họa lực *cạnh tranh nội ngành*/*quyền lực khách hàng*, nhưng câu kết lại nói "Năm lực của Porter giải thích…". Người đọc dễ suy ra rằng quán độc quyền đầu ngõ cứ thế giữ giá lâu dài, trong khi chính lực *người mới gia nhập* (mở quán phở rất dễ) sẽ bào mòn lợi thế đó. | Rút gọn và thêm giới hạn: "Quán phở duy nhất đầu ngõ đông dân giữ được giá vì khách ngại đi xa. Cùng món đó trong khu ẩm thực hai chục quán, khách đổi quán vì chênh vài nghìn. Nhưng nếu đầu ngõ lãi to, sớm muộn sẽ có quán thứ hai mở ra. → Cạnh tranh, sức mặc cả của khách và rào cản gia nhập (vài lực trong năm lực Porter) quyết định lãi giữ được bao lâu." | Porter, HBR 2008 |
| Diễn đạt | Ý 5: "ngân hàng có giới hạn tăng trưởng tín dụng" | Năm 2026 vẫn đúng: NHNN vẫn giao chỉ tiêu, định hướng khoảng 15%, có nới cho một số ngân hàng. Tuy nhiên Chính phủ đã yêu cầu xây dựng lộ trình thí điểm bỏ "room" từ 2026, nên câu dễ lỗi thời. | "…ngân hàng chịu chỉ tiêu tăng trưởng tín dụng do NHNN giao (đang có lộ trình thí điểm bỏ dần), tỷ lệ an toàn vốn…" | [Báo Chính phủ 07/8/2025](https://baochinhphu.vn/thu-tuong-yeu-cau-nhnn-khan-truong-thi-diem-bo-room-tin-dung-102250807092619905.htm); [VietnamBiz 2026](https://vietnambiz.vn/nhnn-noi-room-tin-dung-cho-nha-o-xa-hoi-bat-dong-san-khu-cong-nghiep-trong-nam-2026-2026530195429953.htm) |
| Diễn đạt (tùy chọn) | Bảng chỉ số, CAR: "phải đạt mức tối thiểu theo quy định của Ngân hàng Nhà nước" | Không sai. Nếu muốn cụ thể thì văn bản hiện hành là **Thông tư 14/2025/TT-NHNN** (hiệu lực 15/9/2025, thay TT 41/2016 và các lần sửa đổi): CAR tối thiểu 8%, vốn cấp 1 tối thiểu 6%, vốn lõi cấp 1 tối thiểu 4,5%. Theo quy tắc, phải kèm văn bản và ngày. **Không** nên ghi "TT 41/2016" vì đã bị thay. | (giữ nguyên) hoặc "…tối thiểu 8% theo Thông tư 14/2025/TT-NHNN (hiệu lực 15/9/2025)" | [vbpl.vn TT 14/2025](https://vbpl.vn/TW/Lists/vbpq/Attachments/179459/Th%C3%B4ng%20t%C6%B0%2014-2025-TT-NHNN.docx); [Tạp chí Công Thương](https://tapchicongthuong.vn/quy-dinh-ty-le-an-toan-von-voi-ngan-hang-thuong-mai--chi-nhanh-ngan-hang-nuoc-ngoai-148523.htm) |
| Diễn đạt | Đọc thêm: "*Chiến lược cạnh tranh*… đây là cuốn sách giới thiệu khung năm lực" | Khung năm lực xuất hiện lần đầu trong bài HBR 1979 ("How Competitive Forces Shape Strategy"); sách 1980 trình bày đầy đủ. | "đây là cuốn sách trình bày đầy đủ khung năm lực (ra mắt lần đầu trong bài HBR 1979)…" | HBR 1979/2008 |
| Chưa xác minh | Đọc thêm: "*Chiến lược cạnh tranh* … NXB Trẻ, bán trên Fahasa, Tiki"; "*Lợi thế cạnh tranh* … NXB Trẻ" | Đã xác nhận có bản dịch: *Chiến lược cạnh tranh* (NXB Trẻ 2009; DTBooks – NXB Trẻ 2016), *Lợi thế cạnh tranh* (NXB Trẻ, 2008, dịch Nguyễn Phúc Hoàng). Trang Fahasa của cả hai có trong chỉ mục (403 với bot). Tuy vậy, một kết quả tìm kiếm ghi trang Fahasa *Chiến lược cạnh tranh* là bản **NXB Thanh Niên 2011**. Tiki **không** ra sản phẩm, trang Khai Tâm trả 404. Tình trạng còn hàng chưa xác minh được. | Biên tập viên mở 2 link Fahasa bằng trình duyệt để kiểm NXB và tình trạng hàng. Nếu không có trên Tiki thì bỏ "Tiki". Ghi "bản tiếng Việt (DTBooks – NXB Trẻ)" nếu đúng bản đang bán. | [Fahasa — Chiến lược cạnh tranh](https://www.fahasa.com/chien-luoc-canh-tranh.html); [Fahasa — Lợi thế cạnh tranh](https://www.fahasa.com/loi-the-canh-tranh-tao-lap-va-duy-tri-thanh-tich-vuot-troi-trong-kinh-doanh.html) |

Đã xác minh đúng: Porter là giáo sư Harvard, bài HBR 2008 (URL sống), 5 lực và các câu hỏi trong bảng đúng nội dung. *Lợi thế cạnh tranh* (1985) là sách giới thiệu chuỗi giá trị. Định nghĩa chuỗi giá trị (hoạt động chính và hỗ trợ) đúng. Đòn bẩy hoạt động (chi phí cố định cao thì lợi nhuận biến động mạnh) đúng. Các giai đoạn khởi đầu → tăng trưởng → tái cấu trúc (shakeout) → trưởng thành → suy giảm khớp giáo trình CFA. NIM, CASA (ở VN hiểu là tiền gửi không kỳ hạn), nợ xấu, bao phủ nợ xấu, CAR đều định nghĩa đúng. Chỉ số bất động sản (người mua trả tiền trước là doanh thu chưa ghi nhận), bán lẻ (doanh thu cửa hàng hiện hữu), sản xuất (công suất, spread giá) đều đúng. Đòn bẩy ngân hàng VN khoảng 10 lần là hợp lý. URL sbv.gov.vn, Damodaran đều sống.

RealLife:
- "Quán phở…": xem bảng trên (vượt độ dài, thiếu giới hạn).
- "Đo huyết áp và đo thị lực" (≈64 tiếng): đúng cơ chế, kết "→". Đạt.

**Kết luận: CẦN SỬA**

---

## 4. `phan-tich-nganh/02-hoc-o-dau.mdx`

Đã kiểm 12 khẳng định, 1 RealLife, 9 URL (bảng + Nguồn).

| Mức | Vị trí (trích) | Vấn đề | Đề xuất thay thế | Nguồn |
|---|---|---|---|---|
| Diễn đạt | Mở bài: "giải thích vì sao biên lãi ròng cả ngành co lại khi lãi suất thay đổi" | Viết như vậy thì hiểu là cứ lãi suất đổi (tăng hay giảm) thì NIM co lại, điều này không đúng. Chiều tác động phụ thuộc tốc độ tái định giá tài sản so với nguồn vốn và cạnh tranh huy động. | "…giải thích vì sao biên lãi ròng cả ngành co lại trong giai đoạn lãi suất huy động tăng nhanh hơn lãi cho vay" hoặc "…vì sao biên lãi ròng cả ngành thay đổi theo chu kỳ lãi suất" | — |
| Chưa xác minh | Bảng: "*Chiến lược cạnh tranh*, *Lợi thế cạnh tranh* … Bản tiếng Việt của NXB Trẻ"; Nguồn: link Fahasa | Như file 03: có bản dịch nhưng chưa xác minh được tình trạng còn hàng hay NXB của listing Fahasa. | Như file 03. | như trên |
| Diễn đạt (nhỏ) | Đọc thêm Damodaran: "học định giá từ một trong những người dạy giỏi nhất về chủ đề này" | Đây là nhận định chủ quan, không phải sai. Damodaran được biết rộng rãi, có nhiều giải thưởng giảng dạy. Có thể giữ, hoặc viết theo kiểu dựa trên bằng chứng. | "…học định giá từ một giáo sư được giới tài chính trích dẫn rộng rãi, với bài giảng miễn phí trên trang và YouTube." | [Damodaran Online](https://pages.stern.nyu.edu/~adamodar/) |

Đã xác minh đúng: Damodaran công bố dữ liệu theo ngành cập nhật hằng năm (tháng 1) và có khóa học online miễn phí. *Phân tích chứng khoán* (Graham & Dodd) bản Alpha Books có trên trang Alpha và Tiki. Graham là thầy của Buffett (Columbia). Cơ cấu nợ theo nhóm 1–5 nằm trong thuyết minh BCTC ngân hàng, đúng. Các trang HOSE (hsx.vn), HNX, UBCKNN (ssc.gov.vn), NHNN, Cục Thống kê (nso.gov.vn, sau sáp nhập 2025 thuộc Bộ Tài chính) đều sống. Không có số liệu thời sự, không khuyến nghị đầu tư.

RealLife "Người mua xe máy cũ đi xem chục chiếc" (≈74 tiếng): đúng cơ chế so sánh cùng ngành (peer comparison), kết "→", bối cảnh VN, không khuyến nghị. Đạt.

**Kết luận: CẦN SỬA** (diễn đạt NIM; kiểm tình trạng hàng sách Porter. Mức độ nhẹ)

---

## Câu hỏi chưa giải quyết

1. Sách Minto bản Việt có vẻ chỉ còn sách cũ. Có chấp nhận ghi chú "khó mua mới" không, hay phải thay bằng sách khác để giữ quy tắc "mua được ở VN"?
2. Tình trạng hàng và NXB thực tế trên 3 trang Fahasa (Minto, Chiến lược cạnh tranh, Lợi thế cạnh tranh) cần người kiểm bằng trình duyệt thật, vì bot bị 403.
3. Lỗi "CFA … 2021" có cả ở 2 bài ngoài phạm vi kiểm này: `tong-quan/01-can-gi-ngoai-tai-chinh` và `du-lieu-cong-nghe/01-hieu-nhanh` (MDX + snapshot). Nếu chúng cũng dẫn PDF *Investment Professional of the Future* thì phải sửa thành 2019. Cần người phụ trách các file đó xác nhận.
