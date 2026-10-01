# Fact-check A: Tổng quan, Dữ liệu và công nghệ, Vĩ mô

Ngày kiểm: 2026-10-01. Người kiểm: fact-checker độc lập. Chỉ đọc, không sửa bài.
Phạm vi: 6 file MDX dưới `src/content/lessons/nghe-tai-chinh/`. Mọi sửa ở nội dung chính phải sửa **cả** snapshot `content-sources/nghe-tai-chinh/...`, nếu không `verify:fidelity` sẽ báo lệch (xem `docs/content-authoring-guide.md`, mục "Lĩnh vực tự biên soạn").

Tổng cộng đã kiểm khoảng 150 khẳng định, 42 URL duy nhất và 10 khối RealLife. Các khối RealLife dài 65–88 tiếng, đều ≤ 90 tiếng và đều kết bằng "→". Không khối nào có số liệu thời sự hay khuyến nghị sản phẩm.

Cách kiểm URL: dùng curl kèm User-Agent trình duyệt. Trang nào trả 403 (fahasa, weforum, imf, adb, thuvienphapluat) thì kiểm lại qua WebSearch hoặc trình đọc r.jina.ai trước khi kết luận.

**Lỗi chung lớn nhất:** bài gộp **hai báo cáo khác nhau** của CFA Institute thành "khảo sát năm 2021".
- Bộ số T-shaped 49/21/16/14% và số 17% học Python/R, 12% học trực quan hóa lấy từ báo cáo *Investment Professional of the Future* (công bố **5/2019**). Báo cáo này khảo sát 3.832 hội viên **và ứng viên** CFA cùng 133 lãnh đạo ngành, trong thời gian 18/1–1/3/2019.
- Các con số "2.137 hội viên", "41 tổ chức" và "hơn 100 chuyên gia qua roundtable" lấy từ báo cáo *Future of Skills and Learning*: khảo sát 11/2021, công bố 7/2022. Báo cáo này **không** có bộ số T-shaped nêu trên.

Ghi chú quy tắc (không phải lỗi sự thật): hai bài tổng quan dài khoảng 1.400 tiếng nhưng mỗi bài chỉ có 1 khối RealLife. Bốn bài còn lại mỗi bài có 2 khối. Guide yêu cầu 3–5 khối cho bài dài hơn khoảng 600 tiếng. Nếu domain này đã chốt ngoại lệ thì bỏ qua ghi chú này.

---

## 1. `tong-quan/01-can-gi-ngoai-tai-chinh.mdx`

Đã kiểm khoảng 30 khẳng định và 6 URL.

| Mức | Vị trí (trích) | Vấn đề | Đề xuất thay thế | Nguồn |
|---|---|---|---|---|
| **Sai** | "Năm 2021, CFA Institute khảo sát 2.137 hội viên và phỏng vấn hơn 100 chuyên gia, nhân sự từ 41 tổ chức đầu tư" | Bảng 49/21/16/14% bên dưới đến từ báo cáo **2019**, không phải 2021. Số 2.137 và 41 thuộc một báo cáo khác (khảo sát 11/2021), và báo cáo đó không có bảng này. Trong báo cáo 2019, người xếp hạng là **133 lãnh đạo ngành**, không phải 2.137 hội viên. | "Năm 2019, CFA Institute khảo sát hơn 3.800 hội viên và ứng viên CFA, cùng 133 lãnh đạo trong ngành đầu tư, và tổ chức các buổi thảo luận với hơn 100 người làm nghề. Một câu hỏi dành cho lãnh đạo: nhóm kỹ năng nào quan trọng nhất trong 5–10 năm tới?" | CFA Institute, *Investment Professional of the Future* Executive Summary (5/2019), mục "About the Report" và "T-shaped skills are valued"; CFA Institute press release 7/7/2022 (2.137 hội viên, 11/2021, 41 tổ chức) |
| **Sai** | "Cùng khảo sát đó còn cho thấy… chỉ 17% đang học ngôn ngữ phân tích dữ liệu như Python hay R, và 12% học trực quan hóa" | Hai con số này đúng, nhưng thuộc khảo sát 2019 và đo trên "investment professionals" (gồm cả ứng viên). Câu này chỉ đúng khi câu phía trên được sửa thành năm 2019. | Giữ câu nhưng thêm năm: "Cùng khảo sát năm 2019 đó…" | Investor Daily, 26/6/2019 ("only 17 per cent… Python and R… only 12 per cent… data visualisation") |
| Diễn đạt | "Nghĩa là người chịu học những thứ này đang đứng ở chỗ ít người cạnh tranh" | Đây là suy diễn từ số liệu đã 7 năm tuổi (2019), lại phát biểu ở thì hiện tại. | "Nghĩa là, ít nhất vào thời điểm khảo sát, người chịu học những thứ này có lợi thế vì còn ít người theo." | như trên |
| Diễn đạt | "**Chương trình CFA** hiện yêu cầu ứng viên hoàn thành module thực hành như mô hình tài chính và lập trình Python. Chính tổ chức cấp chứng chỉ CFA đã coi lập trình là kỹ năng nền." | Ứng viên phải hoàn thành **một** PSM ở mỗi cấp và được **chọn** module. Ở cấp I có thể chọn Financial Modeling thay cho Python, nên lập trình không bắt buộc. Nói "coi lập trình là kỹ năng nền" là quá tay. | "…yêu cầu ứng viên hoàn thành một module thực hành ở mỗi cấp, với các lựa chọn như mô hình tài chính, lập trình Python, khoa học dữ liệu và AI. Việc đưa Python vào danh sách module cho thấy tổ chức cấp chứng chỉ CFA coi kỹ năng này là một phần của nghề." | cfainstitute.org, Practical Skills Modules ("you must complete one PSM at each level") |
| Diễn đạt | "Bốn nguồn độc lập, bốn cách hỏi khác nhau" | Ba trong bốn nguồn liệt kê là của CFA Institute: khảo sát AI 2024, chương trình CFA và khảo sát ở mục trước. Chúng không độc lập với nhau. | "Ba tổ chức khác nhau (CFA Institute, WEF, ACCA), nhiều cách hỏi khác nhau, cùng một hướng…" | — |
| Diễn đạt (nhẹ) | "khảo sát về AI năm 2024 với 200 công ty đầu tư" | Nguồn ghi là "200 investment industry representatives from investment firms", tức 200 người đại diện chứ không phải 200 công ty. | "…khảo sát năm 2024 với 200 đại diện các công ty đầu tư" | CFA Institute press release 27/8/2024 |
| Chưa xác minh (nguồn) | Link ACCA ".../what-skills-and-competencies-does-the-acca-qualification-develop.html" | Trang vẫn sống, nhưng **không** liệt kê trí tuệ cảm xúc, sáng tạo, năng lực số hay tầm nhìn. Nội dung trong bài đúng, nhưng nằm ở khung "seven professional quotients" của ACCA (TEQ, IQ, CQ, DQ, EQ, VQ, XQ). | Thay hoặc bổ sung link: `https://www.accaglobal.com/content/dam/ACCA_Global/Members/Advocacy/resources/ACCA-seven-quotients-PPT.pdf`, tiêu đề "ACCA — Seven professional quotients". | ACCA seven quotients PDF; Accountancy Age 2/6/2016 |

Tất cả URL còn sống. Link weforum trả 403 với curl, nhưng nội dung đọc qua r.jina.ai đúng chương 3: "seven out of 10 companies" và "AI and big data top the list as the fastest-growing skills". Các số liệu WEF đều đúng (hơn 1.000 doanh nghiệp, 55 nền kinh tế).

RealLife "Thợ sửa xe giỏi nhất tiệm" (84 tiếng): đúng ý T-shaped, bối cảnh Việt Nam, không gây hiểu sai.

**Kết luận: CẦN SỬA**

---

## 2. `tong-quan/02-ban-do-hanh-trinh.mdx`

Đã kiểm khoảng 25 khẳng định và 7 URL. Các điểm đúng:
- TT 135/2025/TT-BTC: ban hành 26/12/2025, hiệu lực 09/02/2026, thay thế TT 197/2015, quy đổi CFA từ cấp II trở lên và CIIA.
- Ba loại chứng chỉ hành nghề chứng khoán.
- Phép tính 6–8 giờ/tuần × 52 tuần ≈ 300–400 giờ.
- Oakley có bản tiếng Việt của Alpha Books / NXB Thế Giới, đang bán trên Fahasa.
- *Ultralearning* có chín nguyên tắc, dự án MIT Challenge kéo dài khoảng 12 tháng.

| Mức | Vị trí (trích) | Vấn đề | Đề xuất thay thế | Nguồn |
|---|---|---|---|---|
| **Link hỏng** | Nguồn: "[Tiki — Ultralearning: Học siêu tốc](https://tiki.vn/ultralearning-hoc-sieu-toc-1980-p200970047.html)" | Tiki trả trang "404 — Không tìm thấy trang yêu cầu". Đây là 404 thật: link Tiki khác trong cùng đợt kiểm vẫn trả 200. | Thay bằng `https://www.fahasa.com/hoc-sieu-toc.html` (tiêu đề "Fahasa — Học siêu tốc (Scott Young, 1980 Books, NXB Công Thương)"). | curl và r.jina.ai đọc trang Fahasa: nhà cung cấp 1980 Books, NXB Công Thương |
| Chưa xác minh | Đọc thêm: "*Học siêu tốc – Ultralearning*… có bản tiếng Việt, bán trên Fahasa, Tiki" | Bản tiếng Việt có thật (1980 Books, NXB Công Thương, 2022, dịch giả Thu Ánh). Tuy nhiên Fahasa, netabooks và book365 đều hiện "tạm hết hàng / hết hàng" vào ngày kiểm. | "…có bản tiếng Việt (1980 Books, NXB Công Thương); tìm trên Fahasa, Tiki hoặc thư viện, vì sách có lúc tạm hết hàng." | fahasa.com/hoc-sieu-toc.html; netabooks.vn/hoc-sieu-toc; book365.vn |
| Diễn đạt | Bảng lộ trình, CFA: "Thường 2,5–4 năm cho 3 cấp" | Mốc 2,5 năm hiếm khi đạt được. Các nguồn tổng hợp từ FAQ của CFA Institute đều ghi 3–4 năm. Ngoài ra, để nhận charter còn cần 4.000 giờ kinh nghiệm trong tối thiểu 36 tháng. | "Thường 3–4 năm cho 3 cấp; nhận charter cần thêm kinh nghiệm làm việc" | 300hours.com; proschoolonline.com (dẫn FAQ CFA Institute). Search không mở được trang FAQ gốc |
| Diễn đạt (nhẹ) | Bước 4: "Các nhà tâm lý học nhận thức đã chứng minh qua rất nhiều thí nghiệm" | Hướng nói đúng (tổng quan của Dunlosky 2013 và sách *Make It Stick* xếp hai kỹ thuật này ở mức hiệu quả cao), nhưng "chứng minh" là quá chắc. | "…đã kiểm chứng qua rất nhiều thí nghiệm rằng hai kỹ thuật này hiệu quả hơn đọc lại…" | source.washu.edu (2014) |

RealLife "Tập thể dục 30 phút mỗi ngày" (68 tiếng): đúng cơ chế học giãn cách và nhịp đều, không có vấn đề.

**Kết luận: CẦN SỬA**

---

## 3. `du-lieu-cong-nghe/01-hieu-nhanh.mdx`

Đã kiểm khoảng 20 khẳng định và 6 URL. Các điểm đúng:
- Phép tính 15 × 5 × 8 = 600.
- PSM: phải hoàn thành 1 module ở mỗi cấp mới nhận kết quả thi; các module có Python, Data Science and AI.
- Khảo sát AI 2024: 85% và 70%, diễn đạt khớp với nguồn.
- WEF: AI và dữ liệu lớn là kỹ năng tăng nhanh nhất.
- *Python for Data Analysis* 3E có bản HTML Open Access miễn phí; McKinney là người tạo ra pandas.
- Oakley có bản tiếng Việt Alpha Books, đang bán trên Fahasa.

| Mức | Vị trí (trích) | Vấn đề | Đề xuất thay thế | Nguồn |
|---|---|---|---|---|
| **Sai** | "**Khảo sát CFA Institute năm 2021:** chỉ 17% hội viên đang học Python hoặc R, 12% học trực quan hóa dữ liệu" | Khảo sát là năm **2019** và gồm cả hội viên lẫn ứng viên CFA. | "**Khảo sát CFA Institute năm 2019** (hơn 3.800 hội viên và ứng viên): chỉ 17% đang học Python hoặc R, 12% học trực quan hóa dữ liệu." | Investor Daily 26/6/2019; Executive Summary 5/2019 |
| Diễn đạt (nhẹ) | "trong khảo sát năm 2024 của CFA Institute với 200 công ty đầu tư" | Nguồn ghi 200 người đại diện, không phải 200 công ty. | "…với 200 đại diện các công ty đầu tư…" | CFA press release 27/8/2024 |
| Diễn đạt (nhẹ) | "**WEF Future of Jobs 2025:** AI và dữ liệu lớn là nhóm kỹ năng tăng nhanh nhất trên thị trường lao động" | Đây là kỳ vọng của doanh nghiệp được khảo sát cho giai đoạn 2025–2030, không phải số đo thị trường. | "…AI và dữ liệu lớn đứng đầu danh sách kỹ năng mà doanh nghiệp kỳ vọng tăng tầm quan trọng nhanh nhất đến 2030." | WEF FoJ 2025, chương 3 |

Link Investor Daily ở mục Nguồn có tiêu đề "tóm tắt khảo sát CFA Institute 2021", nhưng bài báo đăng ngày 26/6/2019. Cần sửa tiêu đề link thành "…khảo sát CFA Institute 2019". Lỗi này cũng có ở bài tổng quan 01.

RealLife "Dao, nồi và chảo trong bếp" (87 tiếng) và "Thực tập sinh rất nhanh nhưng hay đoán" (88 tiếng): đúng cơ chế, có nêu giới hạn (kiểm tra số, bảo mật), không gây hiểu sai.

**Kết luận: CẦN SỬA**

---

## 4. `du-lieu-cong-nghe/02-hoc-o-dau.mdx`

Đã kiểm khoảng 25 khẳng định và 14 URL. Các điểm đúng:
- Tổng giờ 40–50 + 35–45 + 50–60 + 45–55 = 170–210. Lan học khoảng 5 tháng × 8–10 giờ/tuần ≈ 175–215 giờ, khớp.
- PSM 10–20 giờ mỗi module.
- Khóa HKUST trên Coursera có "Join for Free", chứng chỉ trả phí, dùng dữ liệu cổ phiếu.
- vnstock dùng giấy phép riêng (license-2026.09), miễn phí cho cá nhân, học tập và nghiên cứu, không phải OSI, và không cấp quyền dữ liệu bên thứ ba. Mô tả trong bài là đúng.
- Storytelling with Data có bản tiếng Việt của Sunbook / NXB Thế Giới, còn hàng trên Tiki. Cuốn *Let's Practice! – Thực hành kể chuyện thông qua dữ liệu* có bản tiếng Việt trên Tiki.
- Tất cả URL trong bảng "Học ở đâu" và mục Nguồn còn sống. hsx.vn, hnx.vn, nso.gov.vn và sbv.gov.vn chuyển hướng hợp lệ.

Không có vấn đề sự thật.

RealLife "Học bơi ở hồ rồi mới ra biển" (85 tiếng) và "Cân lại ở quầy cân đối chứng" (65 tiếng): đúng cơ chế, bối cảnh Việt Nam (cân đối chứng ở chợ là thực tế có thật), không có vấn đề.

**Kết luận: ĐẠT**

---

## 5. `vi-mo/01-hieu-nhanh.mdx`

Đã kiểm khoảng 30 khẳng định và 8 URL. Các điểm đúng:
- Phép tính: 100/1,08^5 = 68,06; 100/1,10^5 = 62,09; mức giảm 8,8%, khớp "gần 9%".
- Lãi suất thực 6% − 4% ≈ 2%.
- PMI 50 là ngưỡng; Fed họp 8 kỳ mỗi năm.
- GFSR 4/2023 chương 3 "Geopolitics and Financial Fragmentation" có nội dung về phân bổ vốn danh mục và ngân hàng xuyên biên giới.
- Tetlock: 284 chuyên gia, 82.361 dự báo.
- *Superforecasting* có bản tiếng Việt Alpha Books.
- *Cẩm nang kinh tế học* là bản dịch *Economics: The User's Guide*, Omega Plus, dịch giả Nguyễn Tuệ Anh.

| Mức | Vị trí (trích) | Vấn đề | Đề xuất thay thế | Nguồn |
|---|---|---|---|---|
| **Sai** (lỗi thời) | Đọc thêm: "giáo sư kinh tế học ở Cambridge viết cho người không học kinh tế" | Ha-Joon Chang dạy ở Cambridge từ 1990 đến 2021. Từ 2022 ông là Distinguished Research Professor tại SOAS, University of London. | "nhà kinh tế học từng giảng dạy hơn 30 năm ở Đại học Cambridge (nay ở SOAS, Đại học London) viết cho người không học kinh tế…" | SOAS news, 11/4/2022 |
| Diễn đạt | "nhóm 'siêu dự báo viên' của Tetlock… theo các bài tường thuật, họ hơn cả nhà phân tích tình báo có thông tin mật khoảng 30%" | Theo các nguồn, **dự báo tổng hợp của Good Judgment Project** chính xác hơn khoảng 25–30% so với **một thị trường dự báo nội bộ** của giới tình báo. Đây không phải so sánh trực tiếp siêu dự báo viên với từng nhà phân tích. | "…theo các bài tường thuật, dự báo tổng hợp của dự án, có nhóm siêu dự báo viên làm nòng cốt, chính xác hơn khoảng 25–30% so với một thị trường dự báo nội bộ của các nhà phân tích tình báo có thông tin mật." | AI Impacts (GJP): "outperformed a prediction market inside the intelligence community… by 25 or 30 percent" |
| Diễn đạt (nhẹ) | "từ năm 1984 đến 2004" | Các nguồn không thống nhất. Nhiều nguồn ghi bộ dữ liệu 82.361 dự báo được tích lũy "by 2003"; nguồn khác ghi 1984–2004. | "trong khoảng hai thập kỷ, từ giữa thập niên 1980 đến đầu thập niên 2000" | Tschoegl, review *Expert Political Judgment* (UPenn repository); Journal of Accountancy 3/2006 |
| Diễn đạt (nhẹ) | "**lạm phát cơ bản** (đã loại các nhóm đó)" | Ở Việt Nam, lạm phát cơ bản còn loại thêm các mặt hàng do Nhà nước quản lý giá, như dịch vụ y tế và giáo dục. | "…(đã loại lương thực, thực phẩm tươi sống, năng lượng và các mặt hàng do Nhà nước quản lý giá như y tế, giáo dục)" | Định nghĩa lạm phát cơ bản của Cục Thống kê |
| Chưa xác minh (mua được) | Đọc thêm: *Cẩm nang kinh tế học*, bản tiếng Việt của Omega Plus; link Nguồn omegaplus.vn | Trang Omega Plus ghi "hết hàng". Trang Fahasa `fahasa.com/cam-nang-kinh-te-hoc.html` (NXB ĐH Kinh tế Quốc dân) ghi "tạm hết hàng" vào ngày kiểm. | Thêm link Fahasa vào mục Nguồn và viết "…bản tiếng Việt của Omega Plus (có lúc tạm hết hàng; có thể tìm ở thư viện trường kinh tế)". Hoặc thay bằng cuốn *Kinh tế học dễ xơi* (Ha-Joon Chang, Omega Plus) nếu muốn sách đang có hàng. | omegaplus.vn/cam-nang-kinh-te-hoc; fahasa.com/cam-nang-kinh-te-hoc.html (qua r.jina.ai) |
| Chưa xác minh (link) | Nguồn: elibrary.imf.org/…/CH003.xml | Trang đòi CAPTCHA, không đọc được bằng công cụ. Nội dung chương đã xác nhận qua imf.org. | Thay bằng trang GFSR chính thức: `https://www.imf.org/en/Publications/GFSR/Issues/2023/04/11/global-financial-stability-report-april-2023` | IMF GFSR 4/2023, Ch.3 executive summary |

RealLife "Lời hứa trả tiền sau 5 năm" (79 tiếng): đúng cơ chế chi phí cơ hội và chiết khấu, không có số thời sự, không gây hiểu sai.

RealLife "Dự báo thời tiết và chiếc ô" (65 tiếng): đúng ý "giá đã phản ánh kỳ vọng, chỉ phần bất ngờ làm giá động mạnh".

**Kết luận: CẦN SỬA**

---

## 6. `vi-mo/02-hoc-o-dau.mdx`

Đã kiểm khoảng 25 khẳng định và 13 URL. Các điểm đúng:
- MRU do Tyler Cowen và Alex Tabarrok lập năm 2012, miễn phí.
- MIT OCW 14.05 Spring 2013 còn sống.
- IMFx trên edX cho audit miễn phí, chứng chỉ "small fee"; có khóa Financial Programming and Policies.
- FRED còn sống (hơn 800.000 chuỗi, khớp "hàng trăm nghìn").
- IMF WEO hai kỳ mỗi năm.
- ADB ADO còn sống (403 với curl, đọc được qua reader).
- Bản dịch Mankiw có ở thư viện HPU (bản ghi "Kinh tế học vĩ mô", NXB Hồng Đức 2023, ISBN 9786043989519, theo kết quả search).

| Mức | Vị trí (trích) | Vấn đề | Đề xuất thay thế | Nguồn |
|---|---|---|---|---|
| **Link hỏng** | Nguồn: "[Fahasa — Siêu dự báo](https://www.fahasa.com/sieu-du-bao-218215.html)" | Fahasa trả "404 - Trang không tìm thấy" (đọc qua r.jina.ai). | Thay bằng `https://www.fahasa.com/sieu-du-bao-nghe-thuat-va-khoa-hoc-du-doan-tuong-lai-tai-ban-2026.html`, tiêu đề "Fahasa — Siêu dự báo (tái bản 2026)". Trang này còn hàng, NXB Thế Giới, nhà cung cấp Omega Việt. Hoặc dùng link Alpha Books như bài 01. | r.jina.ai đọc cả hai trang Fahasa |
| Diễn đạt | Đọc thêm: "viết từ nghiên cứu dự báo lớn nhất từng làm" | Khẳng định tuyệt đối không có nguồn. | "…viết từ một trong những nghiên cứu dự báo quy mô lớn nhất (giải đấu dự báo do IARPA tài trợ, 2011–2015)." | AI Impacts (GJP) |
| Diễn đạt | "Tổng thời gian gợi ý cho phần nền là khoảng 80–120 giờ trong 4–6 tháng" | Chặng 1–4 cộng lại là 60–80 giờ. Nếu tính thêm chặng 5 (5–10 giờ/tháng × 4–6 tháng = 20–60 giờ) thì được 80–140 giờ. Không cách cộng nào ra đúng 80–120. | "…khoảng 60–80 giờ cho bốn chặng đầu, cộng 5–10 giờ mỗi tháng cho nhật ký dự báo; tổng cộng khoảng 80–140 giờ trong 4–6 tháng." | Tính lại từ chính bài |
| Chưa xác minh (link) | Nguồn: lib.hpu.edu.vn/handle/123456789/35714 | Máy kiểm không kết nối được (ECONNREFUSED/timeout), nhưng bản ghi có trong chỉ mục search. Bản ghi là bản dịch *Principles of Economics* 6E (phần vĩ mô), không phải giáo trình *Macroeconomics* trung cấp của Mankiw. | Giữ link, ghi rõ trong bảng: "*Kinh tế học vĩ mô* (N. Gregory Mankiw, bản dịch từ *Principles of Economics*)". Mở thử bằng trình duyệt trước khi xuất bản. | Kết quả search: lib.hpu.edu.vn …/35714 |
| Chưa xác minh (mua được) | Đọc thêm: *Cẩm nang kinh tế học* | Giống mục ở bài 01: tạm hết hàng trên Omega Plus và Fahasa. | Như đề xuất ở bài 01. | như trên |

RealLife "Người đi biển ghi sổ thời tiết" (70 tiếng), mức Diễn đạt (nhẹ): câu "nhiều người ghi lại mỗi lần đoán đúng hay sai" là một nhận định khái quát về ngư dân, không có nguồn. Đề xuất viết thành tình huống giả định: "Một ngư dân lâu năm nhìn mây và gió để đoán thời tiết, và có thói quen ghi lại mỗi lần đoán đúng hay sai. Qua nhiều mùa, ông biết dấu hiệu nào đáng tin, dấu hiệu nào chỉ là trùng hợp. → …" (khoảng 65 tiếng).

RealLife "Gà gáy và mặt trời mọc" (67 tiếng): ví dụ kinh điển về tương quan không phải nhân quả, đúng và không có vấn đề.

**Kết luận: CẦN SỬA**

---

## Tóm tắt ưu tiên sửa

1. **Sai:** năm và quy mô khảo sát CFA (tong-quan/01 và du-lieu/01): đổi thành 2019, hơn 3.800 hội viên và ứng viên, 133 lãnh đạo; sửa cả tiêu đề link Investor Daily.
2. **Sai:** Ha-Joon Chang không còn ở Cambridge (vi-mo/01).
3. **Link hỏng:** Tiki Ultralearning (tong-quan/02) và Fahasa Siêu dự báo (vi-mo/02).
4. Các điểm diễn đạt: Tetlock "30%", "bốn nguồn độc lập", "coi lập trình là kỹ năng nền", tổng giờ vĩ mô.

## Câu hỏi chưa giải quyết

- Domain `nghe-tai-chinh` có được phép dùng 1–2 khối RealLife cho bài khoảng 1.400 tiếng không, hay phải theo mức 3–5 của guide?
- *Học siêu tốc* và *Cẩm nang kinh tế học* đang "tạm hết hàng". Có giữ hai sách này không, khi quy tắc yêu cầu sách "mua được ở VN"?
- Trang lib.hpu.edu.vn không truy cập được từ máy kiểm. Cần người mở thử bằng trình duyệt.
