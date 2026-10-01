---
nguon: OmniLab — Nghiên cứu kỹ năng bổ trợ nghề tài chính
tac-gia: OmniLab (tổng hợp từ nguồn công khai)
ngay-viet: 2026-10-01
trang-thai: hoan-thanh
---

# Dữ liệu và công nghệ: bộ đồ nghề mới của người làm tài chính

## Hai ngày và ba mươi phút

Tuần sau buổi trình bày, anh Quân giao cho Lan một việc: so sánh 15 doanh nghiệp bán lẻ niêm yết theo 8 chỉ số trong 5 năm.

Lan làm theo cách quen thuộc: mở từng file báo cáo tài chính, tìm từng dòng, chép từng con số sang Excel. 15 doanh nghiệp nhân 5 năm nhân 8 chỉ số là 600 con số. Hai ngày, mỏi mắt, và Lan biết chắc mình đã gõ nhầm ở đâu đó nhưng không biết chỗ nào.

Ngồi bàn bên là Tùng, vào công ty cùng đợt với Lan. Tùng được giao việc tương tự cho ngành ngân hàng. Tùng viết một đoạn Python khoảng 50 dòng để đọc dữ liệu đã tải về, tính chỉ số, kiểm tra các năm thiếu số liệu, rồi xuất ra bảng. Lần đầu viết mất một buổi chiều. Từ quý sau, mỗi lần cập nhật chỉ còn khoảng 30 phút.

Lan không ghen tị. Lan chỉ thấy rõ một điều: Tùng không giỏi tài chính hơn mình, nhưng Tùng còn dư thời gian để *nghĩ* về con số, còn Lan dùng hết thời gian để *chép* con số.

## Vì sao nhóm kỹ năng này được ưu tiên

- **Chương trình CFA** đã bổ sung các module kỹ năng thực hành, trong đó có mô hình tài chính ba báo cáo, lập trình Python, và Python cho khoa học dữ liệu và AI. Ứng viên được chọn module, nhưng phải hoàn thành ít nhất một module ở mỗi cấp thì mới nhận được kết quả thi.
- **Khảo sát CFA Institute năm 2019** (hơn 3.800 hội viên và ứng viên): chỉ 17% đang học Python hoặc R, 12% học trực quan hóa dữ liệu. Kỹ năng được cần nhưng còn ít người có.
- **WEF Future of Jobs 2025:** AI và dữ liệu lớn đứng đầu danh sách kỹ năng mà doanh nghiệp kỳ vọng tăng tầm quan trọng nhanh nhất đến năm 2030.

## Mỗi công cụ một việc

| Công cụ, kỹ năng | Dùng để | Mức cần đạt |
|---|---|---|
| Excel | Mô hình tài chính, phân tích độ nhạy, bảng tổng hợp | Thành thạo hàm tài chính, PivotTable, Power Query, mô hình ba báo cáo |
| SQL | Lấy và lọc dữ liệu từ cơ sở dữ liệu của công ty | Viết được truy vấn có JOIN, GROUP BY, lọc theo thời gian |
| Python (pandas) | Dữ liệu nhiều dòng, việc lặp lại, phân tích thống kê | Đọc dữ liệu, làm sạch, tính lợi suất và biến động, vẽ biểu đồ |
| Thống kê | Biết một mối quan hệ là thật hay do ngẫu nhiên | Hiểu hồi quy, khoảng tin cậy, tương quan khác nhân quả |
| Trực quan hóa | Giúp người khác hiểu nhanh | Chọn đúng biểu đồ, bỏ chi tiết thừa |

> **Mẹo:** Đừng bắt đầu học Python bằng bài tập "in ra Hello World" rồi bỏ dở. Hãy bắt đầu bằng một việc bạn đang làm tay mỗi tháng và thấy chán nhất. Động lực học sẽ đến từ việc thấy công việc đó biến mất.

## Con số không có thật

Nhớ lại slide 14 trong buổi trình bày của Lan. Gần nửa đêm hôm làm slide, Lan đã hỏi một công cụ AI: "Giá trị hàng tồn kho của doanh nghiệp X cuối năm ngoái là bao nhiêu?" Công cụ trả lời ngay một con số, kèm câu văn rất tự tin. Con số ấy không có trong báo cáo tài chính nào.

Đây là hiện tượng các nhà nghiên cứu gọi là "ảo giác" của mô hình ngôn ngữ lớn (LLM): mô hình tạo ra câu trả lời nghe hợp lý nhưng sai sự thật. LLM rất hữu ích để tóm tắt báo cáo dài, viết nháp nhận xét, gợi ý câu hỏi cần kiểm tra, viết code. Nhưng có ba rủi ro người làm tài chính phải nhớ:

1. **Bịa số liệu.** Mọi con số AI đưa ra phải đối chiếu với báo cáo gốc.
2. **Rò rỉ dữ liệu.** Đưa thông tin khách hàng hay thông tin nội bộ chưa công bố vào công cụ AI công cộng có thể vi phạm quy định bảo mật và quy định về thông tin nội bộ.
3. **Trách nhiệm.** Người ký báo cáo chịu trách nhiệm về nội dung, dù đoạn văn do AI viết nháp.

Không chỉ Lan lo chuyện này. Trong khảo sát tháng 2/2024 của CFA Institute với 200 đại diện các công ty đầu tư, 85% cho rằng toàn ngành cần chuẩn mực và hướng dẫn đạo đức chung về AI, 70% thấy cần đào tạo nhân sự về tuân thủ và rủi ro khi dùng AI.

## Dữ liệu Việt Nam có sẵn để tập

Bạn không cần mua dữ liệu để bắt đầu. Báo cáo tài chính của doanh nghiệp niêm yết được công bố trên website doanh nghiệp và Sở Giao dịch Chứng khoán; số liệu vĩ mô có trên website Cục Thống kê và Ngân hàng Nhà nước. Dữ liệu thật thường thiếu năm, lệch đơn vị, có điều chỉnh hồi tố. Xử lý những chỗ lộn xộn đó chính là phần học có giá trị nhất, vì đó là thứ bạn sẽ gặp mỗi ngày khi đi làm.

## Cuối chương

Bốn tháng sau, Lan viết được đoạn code đầu tiên tự đọc báo cáo của 15 doanh nghiệp. Lan đem kết quả so với bảng chép tay ngày trước và thấy vài chỗ lệch. Lần nào dò lại, lỗi cũng nằm ở bảng cũ. Lan nhắn cho Tùng: "Hóa ra bảng hai ngày của mình sai ba chỗ."

Bài tiếp theo là lộ trình Lan đã đi: bốn chặng, từ Excel đến AI, mỗi chặng một sản phẩm.

## Đọc thêm

- ***Python for Data Analysis* (Wes McKinney, ấn bản thứ 3)**, tiếng Anh; tác giả cho đọc miễn phí bản online, truy cập được từ Việt Nam. *Vì sao nên đọc:* tác giả là người tạo ra thư viện pandas, thư viện mà gần như mọi người phân tích dữ liệu bằng Python đều dùng. *Giúp được gì:* bạn hiểu pandas từ gốc, không phải chép code trên mạng mà không biết vì sao nó chạy.
- ***Cách chinh phục toán và khoa học – A Mind for Numbers* (Barbara Oakley)**, bản tiếng Việt của Alpha Books (NXB Thế Giới). *Vì sao nên đọc:* nếu bạn giống Lan, nghĩ mình "không có đầu óc lập trình" hay sợ thống kê, cuốn này viết cho bạn; tác giả từng trượt toán rồi thành giáo sư kỹ thuật. *Giúp được gì:* bạn có cách học những môn khó từng chút một, không bị ngợp và bỏ giữa chừng.

## Nguồn

- [CFA Institute — Practical Skills Modules](https://www.cfainstitute.org/programs/cfa-program/candidate-resources/practical-skills-modules)
- [CFA Institute — khảo sát AI trong ngành đầu tư 2024](https://www.cfainstitute.org/about/press-room/2024/ai-in-investment-sector-survey)
- [Investor Daily — tóm tắt khảo sát CFA Institute 2019](https://www.investordaily.com.au/investment-roles-to-be-disrupted)
- [World Economic Forum — Future of Jobs Report 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/3-skills-outlook/)
- [Wes McKinney — Python for Data Analysis, 3E (bản đọc online)](https://wesmckinney.com/book/)
- [Fahasa — Cách chinh phục toán và khoa học](https://www.fahasa.com/cach-chinh-phuc-toan-va-khoa-hoc-a-mind-for-numbers-tai-ban-2022.html)
