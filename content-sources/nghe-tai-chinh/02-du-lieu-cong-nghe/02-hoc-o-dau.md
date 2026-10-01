---
nguon: OmniLab — Nghiên cứu kỹ năng bổ trợ nghề tài chính
tac-gia: OmniLab (tổng hợp từ nguồn công khai)
ngay-viet: 2026-10-01
trang-thai: hoan-thanh
---

# Học dữ liệu cho tài chính: bốn chặng, nguồn học và dự án thực hành

## "Mình không có đầu óc lập trình"

Đó là câu Lan nói với Tùng trong lần đầu tiên cài Python. Lan học Tài chính, không học Công nghệ thông tin; nhìn màn hình đen với dòng chữ trắng, Lan thấy như đọc ngoại ngữ.

Tùng cười: "Mình cũng học Tài chính mà. Bí quyết là đừng học lập trình. Hãy học cách bắt máy làm việc tài chính mà cậu đang làm tay."

Lan mất khoảng năm tháng, mỗi tuần 8–10 giờ, để đi hết bốn chặng dưới đây. Không nhanh, nhưng không chặng nào bỏ dở, vì mỗi chặng kết thúc bằng một thứ Lan dùng được ngay trong công việc.

Tổng thời gian gợi ý: khoảng 170–210 giờ. Nếu bạn đã thành thạo Excel, có thể bắt đầu từ chặng 2.

## Chặng 1: Excel và báo cáo tài chính (40–50 giờ)

- **Học gì:** hàm tài chính (NPV, IRR, XNPV), PivotTable, Power Query; đọc ba báo cáo tài chính và thuyết minh.
- **Sản phẩm:** lấy báo cáo tài chính 3 năm của một doanh nghiệp niêm yết, tính các chỉ số chính (biên lợi nhuận, ROE, ROA, vòng quay tồn kho), giải thích xu hướng trong nửa trang.

> **Mẹo:** Học phím tắt Excel ngay tuần đầu. Nghe nhỏ nhặt, nhưng người dùng chuột cho mọi thao tác chậm hơn đáng kể, và cảm giác chậm chạp đó làm nhiều người nản.

## Chặng 2: SQL (35–45 giờ)

- **Học gì:** SELECT, WHERE, JOIN, GROUP BY, hàm xử lý ngày tháng, CTE.
- **Sản phẩm:** tự tạo một cơ sở dữ liệu nhỏ (doanh nghiệp, ngành, chỉ số theo năm) từ dữ liệu chặng 1 và các doanh nghiệp cùng ngành; viết 5 truy vấn, ví dụ "doanh nghiệp có ROE cao nhất mỗi ngành mỗi năm".

## Chặng 3: Python, pandas và thống kê (50–60 giờ)

- **Học gì:** DataFrame, đọc CSV và Excel, xử lý dữ liệu thiếu, tính lợi suất và độ biến động, hồi quy tuyến tính, vẽ biểu đồ.
- **Sản phẩm:** một notebook phân tích giá lịch sử 2 năm của 5 cổ phiếu cùng ngành: lợi suất theo tháng, ma trận tương quan, 3 biểu đồ, và một đoạn giải thích kết quả, kể cả giới hạn của phân tích.

Đây là chặng Lan suýt bỏ. Tuần thứ ba, code báo lỗi liên tục và Lan không hiểu vì sao. Điều giúp Lan đi tiếp là một quy tắc Tùng chỉ: *mỗi buổi học chỉ cần một dòng code chạy được*. Một dòng mỗi tối, sau một tháng là cả một chương trình.

## Chặng 4: Mô hình ba báo cáo và AI có kiểm soát (45–55 giờ)

- **Học gì:** mô hình ba báo cáo liên kết, phân tích kịch bản và độ nhạy; dùng LLM để tóm tắt và viết nháp; quy tắc kiểm tra số liệu và bảo mật.
- **Sản phẩm:** mô hình ba báo cáo cho một doanh nghiệp với 3 kịch bản; bản phân tích 2 trang có dùng AI viết nháp, kèm bảng đối chiếu từng con số với báo cáo gốc.

## Học ở đâu

| Nguồn | Phí | Ngôn ngữ | Chặng | Ghi chú |
|---|---|---|---|---|
| [CFA Institute — Practical Skills Modules](https://www.cfainstitute.org/programs/cfa-program/candidate-resources/practical-skills-modules) | Kèm phí thi CFA | Tiếng Anh | 1, 3, 4 | Chỉ dành cho ứng viên CFA; 10–20 giờ mỗi module |
| [Corporate Finance Institute — Excel](https://corporatefinanceinstitute.com/collections/excel/) | Có bài miễn phí, chương trình đầy đủ trả phí | Tiếng Anh | 1, 4 | Chuyên về mô hình tài chính |
| [Python and Statistics for Financial Analysis — HKUST (Coursera)](https://www.coursera.org/learn/python-statistics-financial-analysis) | Học miễn phí, chứng chỉ trả phí | Tiếng Anh | 3 | Python kết hợp thống kê trên dữ liệu cổ phiếu |
| [Tài liệu chính thức Python](https://docs.python.org/) | Miễn phí | Tiếng Anh | 3 | Phần Tutorial đủ cho người mới |
| [Tài liệu chính thức pandas](https://pandas.pydata.org/docs/) | Miễn phí | Tiếng Anh | 3 | Mục "Getting started" có hướng dẫn ngắn |
| [Microsoft Learn — Power BI](https://learn.microsoft.com/en-us/power-bi/) | Miễn phí | Có tiếng Việt một phần | 1, 3 | Trực quan hóa, kết nối với Excel |
| [MIT OpenCourseWare](https://ocw.mit.edu/) | Miễn phí | Tiếng Anh | 3 | Thống kê, xác suất trình độ đại học |
| [vnstock](https://github.com/thinh-vu/vnstock) | Bản Cộng đồng miễn phí cho cá nhân, học tập, nghiên cứu | Tiếng Việt, tiếng Anh | 3 | Thư viện Python lấy dữ liệu thị trường Việt Nam từ nguồn bên thứ ba; giấy phép riêng (không phải nguồn mở chuẩn OSI), không gồm quyền dùng dữ liệu; đọc điều khoản trước khi dùng cho công việc |

Dữ liệu gốc để đối chiếu: báo cáo tài chính trên website doanh nghiệp và Sở Giao dịch Chứng khoán ([HOSE](https://www.hsx.vn/), [HNX](https://www.hnx.vn/)), số liệu vĩ mô của [Cục Thống kê](https://www.nso.gov.vn/) và [Ngân hàng Nhà nước](https://www.sbv.gov.vn/).

Chính sách học miễn phí của Coursera có thể thay đổi; hãy xem lại trang khóa học trước khi đăng ký.

## Học như thế nào

- **Mỗi chặng kết thúc bằng một sản phẩm.** Xem video mà không làm sản phẩm thì sau vài tuần sẽ quên gần hết.
- **Tự dựng mô hình trước khi xem mẫu.** Chép mô hình có sẵn khiến bạn không biết giả định nào đang quyết định kết quả.
- **Kiểm tra chéo.** Chỉ số tự tính phải khớp gần đúng với số doanh nghiệp công bố; lệch thì tìm ra lý do rồi mới đi tiếp.
- **Giữ mô hình đơn giản.** Hồi quy hai, ba biến mà hiểu rõ có ích hơn mô hình nhiều biến không giải thích được.
- **Lưu phiên bản.** Đặt tên file theo phiên bản hoặc dùng Git để quay lại được khi sửa nhầm.

## Tự kiểm tra

- Tự dựng được mô hình ba báo cáo liên kết mà không cần mở mẫu.
- Viết được truy vấn SQL có JOIN và GROUP BY mà không tra cứu từng dòng.
- Chạy lại được notebook Python của mình cho một doanh nghiệp khác chỉ bằng cách đổi dữ liệu đầu vào.
- Giải thích được cho người không chuyên vì sao một con số AI đưa ra là sai, và sai ở bước nào.

## Đọc thêm

- ***Python for Data Analysis* (Wes McKinney, ấn bản thứ 3)**, tiếng Anh; bản online miễn phí, đọc được từ Việt Nam. *Vì sao nên đọc:* sách gốc về pandas, từ người tạo ra pandas. *Giúp được gì:* dùng làm sách tra cứu suốt chặng 3; mỗi khi bí, đọc đúng chương liên quan thay vì chép code rời rạc trên mạng.
- ***Storytelling with Data – Kể chuyện thông qua dữ liệu* (Cole Nussbaumer Knaflic)**, có bản tiếng Việt do Sunbook phát hành (NXB Thế Giới), bán trên Tiki; có thêm cuốn bài tập *Let's Practice! – Thực hành kể chuyện thông qua dữ liệu*. *Vì sao nên đọc:* phân tích xong mà biểu đồ rối thì không ai dùng kết quả. *Giúp được gì:* bạn biết chọn loại biểu đồ, bỏ chi tiết thừa và đặt tiêu đề nói thẳng thông điệp. Sách này cũng được giới thiệu ở module Giao tiếp và lãnh đạo.

## Nguồn

- [CFA Institute — Practical Skills Modules](https://www.cfainstitute.org/programs/cfa-program/candidate-resources/practical-skills-modules)
- [Coursera — Python and Statistics for Financial Analysis (HKUST)](https://www.coursera.org/learn/python-statistics-financial-analysis)
- [Wes McKinney — Python for Data Analysis, 3E](https://wesmckinney.com/book/)
- [pandas documentation](https://pandas.pydata.org/docs/)
- [vnstock trên GitHub](https://github.com/thinh-vu/vnstock)
- [Tiki — Storytelling With Data, bản tiếng Việt](https://tiki.vn/sach-storytelling-with-data-ke-chuyen-thong-qua-du-lieu-cuon-cam-nang-huong-dan-truc-quan-hoa-du-lieu-p76013378.html)
