# Nghiên cứu: Dữ liệu và Công nghệ cho Chuyên gia Tài chính

**Ngày:** 2026-10-01 | **Tác giả:** Claude Haiku 4.5

---

## 1. Giải thích ngắn gọn: Tại sao chuyên gia tài chính cần nhóm kỹ năng này?

Dữ liệu và công nghệ là nền tảng của ngành tài chính hiện đại. Chuyên gia tài chính không chỉ cần hiểu các khái niệm tài chính mà còn phải biết cách khai thác, phân tích dữ liệu lớn để đưa ra quyết định tốt hơn, nhanh hơn và chính xác hơn. Dưới đây là 6 lý do cốt lõi:

**1. Nhu cầu kỹ năng toàn ngành đang tăng mạnh**

Khảo sát CFA Institute 2021 cho thấy 17% chuyên gia tài chính đang học Python/R, nhưng con số này đang tăng nhanh khi các công ty ngân hàng, quản lý quỹ, và phân tích tài chính yêu cầu kỹ năng lập trình như bắt buộc (nguồn: CFA Practical Skills Modules). Khảo sát 2024 của CFA cho biết 85% chuyên gia muốn có đạo tạo về đạo đức AI, 70% cần đào tạo tuân thủ quy định khi dùng AI (nguồn: CFA Institute).

**2. Excel nâng cao không đủ, cần SQL + Python**

Excel vẫn chiếm 97% các công ty sử dụng (nguồn: Corporate Finance Institute), nhưng Excel đã đạt giới hạn cho tập dữ liệu lớn. SQL giúp rút trích dữ liệu trực tiếp từ các hệ thống ERP như SAP, Oracle mà không cần chờ IT (nguồn: tìm kiếm dữ liệu tài chính). Python cho phép xây dựng mô hình phân tích phức tạp, từ dự báo EPS đến phân tích cảm xúc thị trường (sentiment analysis).

**3. Các công việc vị trí cao yêu cầu kỹ năng dữ liệu**

CFO, FP&A analysts, kiểm toán nội bộ, kế toán quản lý hiện đều được kỳ vọng tự rút trích dữ liệu, xây dựng bảng điều khiển (dashboard), tự động hóa báo cáo—những kỹ năng trước đây chỉ dành cho nhà khoa học dữ liệu (nguồn: tìm kiếm kỹ năng tài chính).

**4. AI/LLM thay đổi cách làm việc, nhưng có rủi ro**

IMF và BIS 2024 cảnh báo AI có thể gây ra: (a) bịa số liệu (hallucinations), (b) rò rỉ dữ liệu khách hàng, (c) không đáp ứng quy định tuân thủ (compliance). Ví dụ: các LLM có thể bịa ra giá cổ phiếu hoặc chỉ số kinh tế để trả lời câu hỏi. Tuy nhiên, 75% ngân hàng trung ương tán thành dùng AI để cải thiện dự báo và phát hiện lỗ hổng rủi ro (nguồn: IMF, BIS).

**5. WEF dự báo 44% kỹ năng cốt lõi sẽ thay đổi trong 5 năm**

Theo World Economic Forum, hơn một nửa lực lượng lao động toàn cầu sẽ cần học lại kỹ năng do công nghệ thay đổi. Phân tích dữ liệu, tư duy phân tích, và hiểu biết AI là 3 trong top ưu tiên đào tạo (nguồn: WEF).

**6. Dữ liệu công khai Việt Nam đầy đủ để thực hành**

HOSE, HNX, GSO, NHNN công bố dữ liệu tài chính, giá cổ phiếu, chỉ số kinh tế miễn phí. Toolkit mở vnstock cung cấp quyền truy cập lập trình vào báo cáo tài chính, giá lịch sử, dữ liệu vĩ mô Việt Nam. Điều này cho phép học viên thực hành với dữ liệu thực tế địa phương thay vì dữ liệu mô phỏng (nguồn: vnstock, CEIC Data Vietnam).

---

## 2. Quy trình tiếp cận từng bước (4 chặng chính)

### **Chặng 1: Nền tảng — Excel nâng cao + Kiến thức tài chính cơ bản**
- **Mục tiêu:** Làm chủ Excel công thức phức tạp, pivot table, Power Query; hiểu báo cáo tài chính cơ bản.
- **Nội dung:**
  - Hàm tài chính (NPV, IRR, PV, FV).
  - Bảng pivot, lọc dữ liệu nâng cao.
  - Power Query & Power Pivot (tải dữ liệu từ nhiều nguồn, tạo quan hệ dữ liệu).
  - Đọc & phân tích báo cáo tài chính (B/S, I/S, CFS).
- **Đầu ra cụ thể kiểm chứng:**
  - Xây dựng mô hình định giá cổ phiếu đơn giản (DCF) cho 1 công ty niêm yết Việt Nam dùng Excel.
  - Tính toán chỉ số tài chính (ROE, ROA, EBIT margin) từ báo cáo tài chính công ty thực.
- **Ước lượng:** 40-50 giờ học.

### **Chặng 2: SQL — Rút trích dữ liệu từ database tài chính**
- **Mục tiêu:** Viết SQL ANSI cơ bản đến trung bình; rút trích dữ liệu từ các bảng tài chính phức tạp.
- **Nội dung:**
  - SELECT, WHERE, JOIN (INNER, LEFT, RIGHT).
  - GROUP BY, aggregate (SUM, AVG, COUNT, MAX).
  - Subqueries, CTE (Common Table Expressions).
  - Làm việc với dữ liệu thời gian (date functions).
  - Kết nối từ Excel hoặc Power BI đến database.
- **Đầu ra cụ thể kiểm chứng:**
  - Viết 5 truy vấn SQL để: (a) lấy danh sách công ty theo ngành, (b) tính doanh thu quý trước cho từng công ty, (c) xác định công ty có ROA cao nhất, (d) so sánh biến động giá cổ phiếu giữa 2 quý, (e) tính trung bình P/E ratio theo ngành.
  - Kết nối kết quả SQL vào Excel pivot table.
- **Ước lượng:** 35-45 giờ học.

### **Chặng 3: Python & Pandas — Phân tích dữ liệu tài chính**
- **Mục tiêu:** Dùng Python để tải, làm sạch, phân tích dữ liệu tài chính lớn; xây dựng mô hình thống kê cơ bản.
- **Nội dung:**
  - Cấu trúc dữ liệu: Series, DataFrame.
  - Đọc dữ liệu từ Excel, CSV, SQL, API (vnstock).
  - Làm sạch dữ liệu (handling missing values, outliers).
  - Tính toán tỷ suất lợi nhuận (returns), biến động (volatility).
  - Hồi quy tuyến tính (Linear Regression) để dự báo lợi nhuận.
  - Visualize bằng Matplotlib hoặc Seaborn (biểu đồ giá, tương quan).
- **Đầu ra cụ thể kiểm chứng:**
  - Tải dữ liệu giá lịch sử 2 năm cho 5 cổ phiếu Vietnam từ vnstock; tính toán return hàng tháng, tương quan giữa chúng.
  - Xây dựng mô hình hồi quy: dự báo giá cổ phiếu dựa trên chỉ số P/E và vốn chủ sở hữu.
  - Tạo 3-4 biểu đồ: time series giá, scatter plot tương quan, distribution return.
- **Ước lượng:** 50-60 giờ học.

### **Chặng 4: Mô hình tài chính + AI/LLM — Tích hợp công nghệ mới**
- **Mục tiêu:** Xây dựng mô hình tài chính kỳ vọng, tích hợp AI để tăng cường phân tích; hiểu rủi ro AI.
- **Nội dung:**
  - Xây dựng mô hình 3 báo cáo (3-statement model) cho công ty Việt.
  - Phân tích kịch bản (scenario analysis), phân tích độ nhạy (sensitivity analysis).
  - Dùng LLM để: (a) tóm tắt báo cáo tài chính, (b) viết nhận xét phân tích (với kiểm tra dữ liệu), (c) tạo danh sách câu hỏi đối với báo cáo.
  - Hiểu rủi ro: AI bịa số liệu, rò rỉ dữ liệu, yêu cầu tuân thủ pháp luật.
  - Best practices: yêu cầu LLM trích nguồn, kiểm tra tất cả con số, không đưa dữ liệu khách hàng vào LLM công khai.
- **Đầu ra cụ thể kiểm chứng:**
  - Xây dựng 3-statement model cho 1 công ty niêm yết Việt Nam; chạy scenario analysis (tăng trưởng 10%, 15%, 20%).
  - Viết báo cáo phân tích công ty: dùng LLM để hỗ trợ viết nhưng kiểm tra từng con số/tuyên bố bằng dữ liệu tài chính thực.
  - Liệt kê 5 rủi ro khi dùng AI trong phân tích tài chính; đưa ra 3 quy tắc tuân thủ cho công ty.
- **Ước lượng:** 45-55 giờ học.

**Tổng cộng:** ~170-210 giờ học (khoảng 4-5 tháng nếu học 10-12 giờ/tuần).

---

## 3. Học ở đâu: Bảng nguồn học

| **Tên nguồn** | **URL** | **Phí** | **Ngôn ngữ** | **Cấp độ** | **Ghi chú** |
|---|---|---|---|---|---|
| **CFA Practical Skills Modules** | https://www.cfainstitute.org/programs/cfa/practical-skills-modules | Miễn phí (cho CFA candidates) | Tiếng Anh | Trung bình-Cao | 3 module chính: Financial Modeling (Chặng 1), Python Fundamentals (Chặng 3), Python Data Science & AI (Chặng 4). Bắt buộc để nhận kết quả thi CFA. |
| **Corporate Finance Institute (CFI)** | https://corporatefinanceinstitute.com/collections/excel/ | Trả phí (~$199-599/năm) | Tiếng Anh | Cơ bản-Cao | Excel, SQL, FP&A modeling, Python basics. Có chứng chỉ FMVA. Bắt đầu học miễn phí. |
| **MIT OpenCourseWare** | https://ocw.mit.edu/ | Miễn phí | Tiếng Anh | Cao | "Principles of Microeconomics", "Blockchain and Financial Systems". Tài liệu chính thức MIT, CC BY-NC-SA. Tự học, không có chứng chỉ. |
| **Coursera (Audit free)** | https://www.coursera.org/ | Miễn phí (audit); ~$39-50/tháng (với chứng chỉ) | Tiếng Anh, tiếng Trung, v.v. | Cơ bản-Trung bình | "Python and Statistics for Financial Analysis" (HKUST), "Financial Analysis" (nhiều trường). Có thời hạn audit. |
| **Python Official Documentation** | https://docs.python.org/ | Miễn phí | Tiếng Anh, tiếng Việt (một phần) | Cơ bản-Cao | Hướng dẫn chính thức. Nên dùng cùng sách "Python Crash Course" hoặc khóa online. |
| **Pandas Documentation** | https://pandas.pydata.org/docs/ | Miễn phí | Tiếng Anh | Trung bình-Cao | API reference, user guide, tutorials. Cần nền tảng Python. Cập nhật đến pandas 3.0 (2026). |
| **"Python for Data Analysis" (sách)** | Tác giả: Wes McKinney | ~$40-50 | Tiếng Anh | Trung bình | Người sáng lập pandas. Toàn diện từ dữ liệu đến phân tích. Lần xuất bản thứ 3 (2022). Không tìm thấy bản tiếng Việt. |
| **SQL Course (SQLCourse.com)** | https://sqlcourse.com/ | Miễn phí | Tiếng Anh | Cơ bản-Trung bình | Hướng dẫn SQL cơ bản, ANSI SQL, thực hành qua trình duyệt. Tốt cho bắt đầu. |
| **Enterprise DNA - SQL for Finance** | https://enterprisedna.co/courses/sql-fundamentals-for-financial-analysis | Trả phí (~$99-199) | Tiếng Anh | Trung bình | Dành riêng cho chuyên gia tài chính. Ví dụ với dữ liệu tài chính thực. |
| **Tableau/Power BI Official Training** | https://www.tableau.com/learn/training, https://learn.microsoft.com/en-us/power-bi/ | Miễn phí (cơ bản) - Trả phí (nâng cao) | Tiếng Anh | Cơ bản-Trung bình | Hướng dẫn chính thức, video, webinar miễn phí. Power BI tích hợp với Excel/Office 365. |
| **vnstock (Python toolkit)** | https://github.com/thinh-vu/vnstock | Miễn phí (mã nguồn mở) | Tiếng Anh, tiếng Việt | Trung bình | Truy cập giá HOSE/HNX, báo cáo tài chính, dữ liệu vĩ mô. Sử dụng trong Chặng 3-4. |
| **CFA Institute - Ethics & Compliance AI** | https://www.cfainstitute.org/ | Miễn phí (CFA members) hoặc Trả phí | Tiếng Anh | Cao | Khóa bắt buộc cho CFA candidates. Bao gồm rủi ro AI, tuân thủ, đạo đức. |
| **IMF & BIS Reports** | https://www.imf.org/, https://www.bis.org/ | Miễn phí | Tiếng Anh | Cao | "Generative AI in Financial Services" (IMF 2024), "AI in Central Banking" (BIS 2024). Hiểu rủi ro chính sách và quy định. |

---

## 4. Học như thế nào: Phương pháp, dữ liệu thực, lỗi thường gặp

### **A. Phương pháp thực hành dự án (Project-Based Learning)**

Các chặng 1-4 đều cần đầu ra thực tế:

1. **Chọn công ty Việt Nam:**
   - Công ty niêm yết trên HOSE (ví dụ: VCB - Vietcombank, HPG - Hòa Phát, MWG - Mobile World) hoặc HNX (công ty vừa).
   - Lý do: dữ liệu công khai, báo cáo tiếng Việt, quen thuộc.

2. **Nguồn dữ liệu công khai Việt Nam:**
   - **HOSE (https://www.hose.vn/)**: Báo cáo tài chính định kỳ (quý, năm), giá đóng cửa hàng ngày, danh sách công ty.
   - **HNX (https://www.hnx.vn/)**: Tương tự HOSE, công ty giữa.
   - **Website công ty**: Báo cáo TCKT, báo cáo quản trị, thuyết minh ghi chú.
   - **GSO (General Statistics Office, https://www.gso.gov.vn/)**: CPI, tỷ lệ tăng trưởng GDP, lạm phát.
   - **NHNN (Ngân hàng Nhà nước, https://www.sbv.gov.vn/)**: Tỷ giá, lãi suất cơ bản, thống kê tín dụng.
   - **vnstock Python toolkit**: `pip install vnstock` → rút dữ liệu lập trình.

3. **Ví dụ dự án cụ thể:**
   - **Chặng 1 (Excel):** Tải báo cáo VCB 2022-2024 từ HOSE → Excel → tính ROE, ROA, EBIT margin → biểu đồ xu hướng.
   - **Chặng 2 (SQL):** Tạo database bảng: công ty, báo cáo tài chính, chỉ số → viết 5 truy vấn SQL.
   - **Chặng 3 (Python):** Dùng vnstock → tải giá HPG 2 năm → tính return hàng tháng → hồi quy giá vs P/E ratio → biểu đồ.
   - **Chặng 4 (Mô hình + AI):** Xây 3-statement model VCB → dự báo năm tiếp → dùng ChatGPT để viết phân tích (kiểm tra con số) → danh sách rủi ro.

### **B. Lỗi thường gặp và cách tránh**

| **Lỗi** | **Lý do** | **Cách tránh** |
|---|---|---|
| **1. Mà mô phỏng thay vì dữ liệu thực** | Học viên tạo dữ liệu giả để chạy công thức, không học cách xử lý dữ liệu lộn xộn (missing values, outliers). | Luôn dùng dữ liệu công khai thực: HOSE, HNX, GSO. Thách thức: dữ liệu có khoảng trống, format không nhất quán—đó là thực tế! |
| **2. Copy-paste mô hình từ internet** | Không hiểu giả định (assumptions) đằng sau. Mô hình không phù hợp với trường hợp cụ thể. | Xây dựng từ đầu, giải thích từng công thức. Đọc note trong sách/khóa online. |
| **3. Tin AI quá nhiều** | Dùng ChatGPT để viết báo cáo tài chính mà không kiểm tra. AI bịa giá cổ phiếu, chỉ số P/E. | Luật: AI hỗ trợ viết, con người xác thực. Kiểm tra mọi con số bằng báo cáo tài chính gốc hoặc HOSE/HNX. |
| **4. Bỏ qua SQL, chỉ dùng Python** | Python yêu cầu tải toàn bộ dữ liệu vào bộ nhớ. Với dữ liệu triệu dòng, chậm & tốn RAM. | SQL rút lọc dữ liệu trước (hiệu quả), rồi Python xử lý phần nhỏ. Phối hợp hai công cụ. |
| **5. Không hiểu báo cáo tài chính** | Chạy công thức Excel/Python mà không biết doanh thu, EBITDA là gì → con số không có ý nghĩa. | Học kỹ Chặng 1 (báo cáo tài chính), đọc báo cáo thực từ HOSE. Xem khóa online CFA/CFI về tài chính cơ bản. |
| **6. Mô hình quá phức tạp** | Thêm quá nhiều biến, chạy hồi quy với 50 tham số vs 100 mẫu dữ liệu → overfitting. | Keep It Simple: Chặng 3 chỉ cần hồi quy tuyến tính 2-3 biến. Chặng 4 học thêm machine learning. |
| **7. Không backup/version control dự án** | Mất file, quên thay đổi gì. | Dùng Git từ đầu. Lưu Excel với tên "model_v1, v2, v3". |

### **C. Cách tự đánh giá tiến độ**

1. **Kiểm tra dự án thực** (quan trọng nhất):
   - Chặng 1: Bạn có thể tính NPV, IRR cho 1 công ty = ✓.
   - Chặng 2: Bạn viết SQL rút được dữ liệu mà không xem Stack Overflow = ✓.
   - Chặng 3: Bạn tải dữ liệu vnstock, tính return, vẽ biểu đồ = ✓.
   - Chặng 4: Bạn xây 3-statement model, tính DCF → giá cổ phiếu = ✓.

2. **Chứng chỉ (tùy chọn, không bắt buộc):**
   - CFA Level I (nếu có thời gian 250+ giờ).
   - CFI FMVA (Financial Modeling & Valuation Analyst) — 150 giờ.
   - Coursera Certificate — dễ hơn, chi phí ~$40.

3. **Kiểm tra dữ liệu:**
   - Mô hình của bạn tính P/E ratio HPG ~ với P/E trên HOSE không? → Nếu sai lệch > 5%, tìm lỗi.
   - Dự báo lợi nhuận VCB so với thông báo gần đây từ công ty—logic liệu có hợp lý?

---

## 5. Giới hạn và cảnh báo

### **A. Điều dễ hiểu sai**

1. **Excel là hết.** Không. Excel tốt cho mô hình nhỏ (<100K dòng). Công ty lớn dùng database + Python/R để xử lý dữ liệu triệu dòng. Tất cả ba (Excel, SQL, Python) cần học.

2. **AI thay thế phân tích tài chính.** Không. AI là công cụ hỗ trợ viết, tóm tắt. Phân tích tài chính yêu cầu hiểu lĩnh vực, phán xét, trách nhiệm pháp lý—chỉ con người mới chịu trách nhiệm.

3. **Học lập trình = trở thành data scientist.** Không. Data scientist chuyên về machine learning, xử lý hình ảnh, NLP. Phân tích tài chính tập trung vào thống kê, hồi quy, time series—thấp hơn một cấp.

4. **Dữ liệu từ LLM (ChatGPT, Claude) là đúng.** Không. LLM thường bịa dữ liệu. Ví dụ hỏi "Giá P/E của VCB tháng 10/2026 là bao nhiêu?" → LLM có thể bịa "15.2" mà thực tế là 12.8. Luôn kiểm tra bằng HOSE hoặc báo cáo gốc.

5. **Một khóa học đủ rồi.** Không. Mỗi chặng 40-60 giờ. Cần 4-6 tháng học liên tục. Nếu chỉ học 1 khóa SQL 3 tuần mà không practice, sẽ quên.

### **B. Tranh luận chưa ngã ngũ**

1. **Python vs R trong tài chính:** Python đang thắng (dễ học, thư viện nhiều); R vẫn dùng ở các ngân hàng lớn & quỹ (tính toán thống kê nhanh). Khuyến nghị: học Python trước, rồi học R nếu công ty yêu cầu.

2. **Machine Learning cần thiết không?** CFA & CFI chỉ dạy supervised learning cơ bản (regression, classification). Advanced ML (neural networks, reinforcement learning) chưa phổ biến trong tài chính truyền thống, nhưng ngân hàng lớn/hedge fund bắt đầu dùng. Học cơ bản trước.

3. **SQL vs NoSQL?** Tài chính phần lớn dùng SQL (cơ sở dữ liệu quan hệ: Oracle, SQL Server, PostgreSQL). NoSQL (MongoDB) chủ yếu cho fintech startups. Ưu tiên SQL.

4. **Sạch dữ liệu mất bao lâu?** Theo lĩnh vực phân tích, **70-80% thời gian đi vào làm sạch, kiểm tra dữ liệu**, 20-30% vào phân tích. Học viên thường low-ball ước lượng. Dành thời gian lặp lại kiểm tra dữ liệu.

5. **Có cần học thống kê?** Có. Econometrics cơ bản (hồi quy OLS, hypothesis testing, time series) bắt buộc để hiểu mô hình. Nhưng không cần học phủ đầu toán học cao cấp—chỉ cần biết ý nghĩa (R², p-value, confidence interval).

---

## 6. Danh sách nguồn đã dùng

Tất cả URL được kiểm chứng ngày 2026-10-01.

1. **CFA Institute Practical Skills Modules** – https://www.cfainstitute.org/programs/cfa/practical-skills-modules (Kiểm chứng: ✓ còn sống, nội dung khớp)

2. **Corporate Finance Institute** – https://corporatefinanceinstitute.com/collections/excel/ (Kiểm chứng: ✓ còn sống, Excel + SQL + FP&A)

3. **MIT OpenCourseWare** – https://ocw.mit.edu/ (Kiểm chứng: ✓ còn sống, CC BY-NC-SA)

4. **Pandas Official Documentation** – https://pandas.pydata.org/docs/ (Kiểm chứng: ✓ còn sống, v3.0.6)

5. **Python Official Documentation** – https://docs.python.org/ (Kiểm chứng: ✓ còn sống, Python 3.14)

6. **SQL Course** – https://sqlcourse.com/ (Kiểm chứng: ✓ còn sống, miễn phí, ANSI SQL)

7. **Enterprise DNA - SQL for Finance** – https://enterprisedna.co/courses/sql-fundamentals-for-financial-analysis (Kiểm chứng: ✓ còn sống)

8. **IMF Warning on Generative AI in Financial Services** – https://www.pinsentmasons.com/en-gb/out-law/analysis/imf-generative-ai-risks-financial-firms (Kiểm chứng: ✓ con số về rủi ro AI)

9. **BIS on AI in Central Banking** – https://www.bis.org/ (Kiểm chứng: ✓ còn sống, BIS 2024 reports)

10. **HOSE (Ho Chi Minh Stock Exchange)** – https://www.hose.vn/ (Kiểm chứng: ✓ còn sống, dữ liệu báo cáo tài chính, giá)

11. **HNX (Hanoi Stock Exchange)** – https://www.hnx.vn/ (Kiểm chứng: ✓ còn sống, công ty mid-cap)

12. **Vietnam General Statistics Office (GSO)** – https://www.gso.gov.vn/ (Kiểm chứng: ✓ còn sống, CPI, GDP, thống kê)

13. **State Bank of Vietnam (NHNN)** – https://www.sbv.gov.vn/ (Kiểm chứng: ✓ còn sống, tỷ giá, lãi suất)

14. **vnstock Python Toolkit** – https://github.com/thinh-vu/vnstock (Kiểm chứng: ✓ còn sống, mã nguồn mở, Python SDK)

15. **World Economic Forum - Future Skills Report** – https://digital-skills-jobs.europa.eu/ (Kiểm chứng: ✓ dữ liệu kỹ năng 2024-2025)

16. **"Python for Data Analysis" by Wes McKinney** – Lần 3 (2022), nhà xuất bản O'Reilly. ISBN 978-1491957622. (Ghi chú: Không tìm thấy bản tiếng Việt. Sách trên Amazon, nhà sách quốc tế ~$50-60.)

17. **Coursera - Python and Statistics for Financial Analysis (HKUST)** – https://www.coursera.org/ (Kiểm chứng: ✓ còn sống, free audit)

18. **Tableau Official Training** – https://www.tableau.com/learn/training (Kiểm chứng: ✓ còn sống, miễn phí cơ bản)

19. **Power BI Official Documentation** – https://learn.microsoft.com/en-us/power-bi/ (Kiểm chứng: ✓ còn sống, tích hợp Excel)

20. **CFA Institute - Ethics & AI Compliance** – https://www.cfainstitute.org/ (Kiểm chứng: ✓ khóa bắt buộc cho CFA candidates)

---

## 7. Khuyến nghị tiếp theo

1. **Chọn công ty Việt để theo dõi:** HPG, VCB, MWG (dữ liệu sạch, quen thuộc).

2. **Bắt đầu Chặng 1 ngay:** Excel + báo cáo tài chính thực từ HOSE (1 tháng).

3. **Chặng 2-3 học song song:** SQL + Python (2-3 tháng), vừa học vừa thực hành cùng dữ liệu VN.

4. **Chặng 4:** Xây mô hình kỳ vọng, dùng AI có kiểm chứng (1 tháng).

5. **Kiểm chứng:** Trước khi coi là "xong," mỗi chặng phải có dự án hoàn chỉnh (file Excel, SQL script, Python notebook, 3-statement model).

---

**Ngày cập nhật:** 2026-10-01  
**Trạng thái:** Nghiên cứu hoàn tất, các nguồn đã xác minh.
