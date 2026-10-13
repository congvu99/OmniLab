# Fact-check A — module `nen-tang` + `quy-la-gi` (vòng kiểm chứng thứ hai)

Ngày: 2026-10-13 · Phạm vi: 4 MDX + 4 snapshot + 8 SVG. Mọi nguồn được tự mở lại (curl với UA trình duyệt + pdftotext UTF-8; WebFetch cho FINRA/Econlib vì chặn curl). Báo cáo research chỉ dùng để tìm link, không làm bằng chứng.

## Tóm tắt

- 4 bài: phép tính đúng 100%; phần lớn khẳng định đúng nguồn.
- **Sai (đã sửa):** 3 — (1) nơi công bố NAV: TT 136/2025 đã sửa TT 98 Điều 20 khoản 6, website SGDCK chỉ áp dụng khi CCQ niêm yết; (2) "Investor.gov khuyên trả nợ + có quỹ dự phòng **trước khi** đầu tư" — nguồn viết "as you invest" (song song); (3) căn cứ VSDC "Điều 53" (Điều 53 là cơ cấu tổ chức) → Điều 52, 61.
- **Diễn đạt (đã sửa):** ~15 điểm, chủ yếu là văn bản pháp luật (Điều 110 tính trên "tổng giá trị tài sản" chứ không phải NAV, Điều 111 khoản 3 chỉ áp dụng khi có sự kiện ở khoản 2, Chương VII gồm Điều 99–117, tên NĐ 85/2026 là "bảo hiểm hưu trí bổ sung"...), cùng ví dụ rủi ro riêng không có trong nguồn Damodaran và thông tin NXB sách.
- Dễ hiểu: tách khoảng 15 câu dài; thêm giải thích lần đầu cho danh mục, đáo hạn, lưu ký, điều lệ quỹ, bản cáo bạch, giờ đóng sổ lệnh, ETF, tổ chức phát hành, chứng khoán đang lưu hành, thành viên độc lập, quỹ cân bằng.
- Không còn lỗi Sai → `examplesReviewed: true` ở cả 4 MDX. `pnpm verify:fidelity` OK (14 dau-tu-quy + 64 bài khác). `pnpm check`: 0 lỗi, 0 cảnh báo.

## Bảng kiểm chứng

Ký hiệu nguồn: **LCK** = Luật CK hợp nhất, Công báo 269 ngày 12/5/2026 (PDF thuvienphapluat CDN, giống hệt bản legalzone, 102 trang). **TT98** = caselaw.vn. **TT136** = luatvietnam.vn. **TT96** = PDF mbs.com.vn.

### Bài nen-tang/01 — Rủi ro, lợi nhuận, lạm phát, lãi kép

| Khẳng định | Nguồn đã mở | Kết quả | Đã sửa |
|---|---|---|---|
| FINRA: lợi nhuận kỳ vọng càng cao thì nguy cơ mất phần lớn/toàn bộ vốn càng lớn | FINRA "Know your risk tolerance" (WebFetch, 09/10/2024) | Đúng | Tách câu |
| Investor.gov: lạm phát giảm sức mua, là rủi ro với người nhận lãi cố định | Investor.gov WIW2023: "risk for investors receiving a fixed rate of return" | Diễn đạt ("lãi suất" ≠ "rate of return") | Viết lại: "mức lợi nhuận cố định" |
| CPI 9/2026 +5,08% so với cùng kỳ; lạm phát cơ bản +4,45%; công bố 3/10/2026; Cục Thống kê (BTC) | NSO họp báo 3/10/2026; TBTCVN; Tạp chí Công Thương | Đúng | Thay link trang chủ NSO bằng link bài họp báo |
| Fed: lãi thực = danh nghĩa − lạm phát | federalreserveeducation.org "Getting Real…" | Đúng | Ghi rõ "trang giáo dục của Fed"; câu "chỉ là xấp xỉ" là nhận xét của OmniLab (về toán thì đúng) |
| Quy tắc 72 "nhanh và khá chính xác", giả định lãi suất không đổi | people.tamu.edu/~fulling (bản in lại bài Texas A&M University System News, 1/1993) | Diễn đạt (nguồn là bài năm 1993, không phải "trường đại học" phát biểu) | Ghi "bài năm 1993 của hệ thống ĐH Texas A&M" |
| Sách *Nhà đầu tư thông minh*: dịch giả Lê Quốc Phương, Bùi Quỳnh Chi; NXB Dân Trí; Nhã Nam | Tiki (spec: NXB Dân Trí, công ty phát hành Nhã Nam, 680 trang) | Diễn đạt ("thương hiệu Nhã Nam") | "NXB Dân Trí, Nhã Nam phát hành"; thêm dòng trống thiếu trước `## Nguồn` |

### Bài nen-tang/02 — Đa dạng hoá, phân bổ tài sản, khẩu vị rủi ro

| Khẳng định | Nguồn đã mở | Kết quả | Đã sửa |
|---|---|---|---|
| Investor.gov: đa dạng hoá ở hai cấp (giữa và trong từng loại tài sản) | Investor.gov WIW2023 | Đúng | — |
| Markowitz: bài báo năm 1952, Nobel 1990; rủi ro phụ thuộc cách các khoản cùng lên xuống | Econlib (WebFetch) | Đúng | Tách câu, định nghĩa "danh mục" |
| Damodaran: rủi ro riêng giảm được, rủi ro thị trường (lãi suất, lạm phát, tin kinh tế) thì không | NYU Stern risk.pdf (slide 6–7) | Đúng phần nguyên lý; **ví dụ "vụ kiện, giám đốc ra đi" không có trong nguồn** | Thay bằng ví dụ trong nguồn: dự án tốt/kém hơn dự kiến, cạnh tranh mạnh/yếu hơn dự đoán |
| BHB 1986: 91 quỹ hưu trí lớn của Mỹ, số liệu quý 1974–1983, trung bình 93,6% mức biến động | PDF FAJ (bản in lại 1995): "explained on average fully 93.6 per cent of the total variation" | Đúng | Tách câu |
| Nuttall: >50 trích dẫn, hầu hết trích sai | publish.uwo.ca/~jnuttall ("over 50 examples… all but one misquoted"; viết năm 2000) | Đúng | Nêu chính xác hơn: chỉ một trường hợp trích đúng |
| Ibbotson & Kaplan 2000: ~90% theo thời gian, ~40% giữa các quỹ | CFA Institute (tóm tắt) + RePEc (94 quỹ cân bằng, 58 quỹ hưu trí) | Đúng | Thêm cỡ mẫu (thị trường Mỹ) |
| FINRA: định nghĩa "willing and able"; 4 yếu tố; "technically afford" ≠ "comfortable" | FINRA (WebFetch) | Đúng | — |
| Investor.gov: chân trời đầu tư (định nghĩa) | Investor.gov glossary | Đúng | — |
| FINRA: chân trời dài chịu được rủi ro cao hơn; chân trời ngắn tính đến thanh khoản | FINRA | Đúng | — |
| **"Investor.gov khuyên trả nợ lãi cao và có rainy-day money TRƯỚC KHI đầu tư"** | Investor.gov WIW2023: "pay off high-interest debt and build emergency savings **as you invest**" | **Sai** | Viết lại thành "song song với việc đầu tư"; đổi H2, câu tóm tắt và summary frontmatter; thêm hai câu đúng nguồn ("không chiến lược đầu tư nào…", "khỏi phải vay hay bán khoản đầu tư") |
| Thẻ tín dụng Mỹ lãi "18% trở lên" | Investor.gov WIW2023 | Đúng | — |
| FINRA: tính chi phí "định kỳ" và khẩn cấp | FINRA: "routine expenses" + "periodic or emergency expenses" | Diễn đạt | "chi phí thường ngày… lẫn chi phí bất thường hay khẩn cấp" |
| Malkiel: NXB Lao động – Xã hội 2009; "có bản tái bản" | Thư viện số Quốc hội (dc.publisher NXB Lao động - Xã hội, 2009); Tiki (bản tái bản: NXB Lao Động, 2021) | Diễn đạt (câu cũ ngầm hiểu bản tái bản cũng của NXB LĐ–XH) | Tách rõ hai bản |

### Bài quy-la-gi/01 — Cơ chế quỹ

| Khẳng định | Nguồn đã mở | Kết quả | Đã sửa |
|---|---|---|---|
| Điều 4 khoản 37 (quỹ ĐTCK), khoản 4 (CCQ), khoản 38 (quỹ đại chúng) | LCK | Đúng (khoản 37 có thêm "kể cả bất động sản") | Bổ sung "kể cả bất động sản", tách câu |
| Điều 103 khoản 2 điểm m: điều lệ quy định cách xác định NAV | LCK | Đúng | Thêm định nghĩa điều lệ quỹ (Điều 103 khoản 1) |
| Điều 106 khoản 1–2: CTQLQ xác định NAV, NHGS xác nhận; giá đóng cửa/trung bình | LCK | Đúng | Tách câu |
| **NAV công bố trên web CTQLQ VÀ SGDCK (TT98 Điều 20 khoản 6)** | TT98 bản gốc + **TT136 Điều 7** (sửa Điều 20 khoản 6, hiệu lực 12/02/2026): SGDCK "đối với trường hợp chứng chỉ quỹ niêm yết"; "muộn nhất vào ngày làm việc tiếp theo" | **Sai (lỗi thời)** | Viết lại theo bản sửa, ghi "đã được TT 136/2025 sửa" |
| TT96 Điều 26: lịch công bố định kỳ của quỹ đại chúng | PDF TT96 | Đúng | Diễn đạt rõ "các báo cáo khác" |
| Bảng các bên: Điều 101, 73, 102, 109, 9 khoản 1 | LCK | Đúng | Thêm định nghĩa "thành viên độc lập" (Điều 109 khoản 3) |
| NHGS: lưu ký tài sản quỹ đại chúng, căn cứ "Điều 106, 108" | LCK Điều 116 khoản 2 điểm b (lưu ký, quản lý tách biệt) | Diễn đạt (thiếu điều luật gốc) | Thêm Điều 116 |
| **VSDC: căn cứ Điều 53, 61** | LCK: Điều 52 = thành lập và hoạt động VSDC; Điều 53 = cơ cấu tổ chức; Điều 61 = đăng ký tập trung | **Sai** (Điều 53) | → Điều 4 khoản 42, Điều 52, 61; định nghĩa ETF |
| Điều 108 khoản 2: tài khoản phong tỏa | LCK | Đúng | Tách câu |
| TT98 Điều 3 khoản 2: tài sản quỹ đại chúng lưu ký tại NHGS | TT98 (TT136 không sửa Điều 3) | Đúng | Thêm Điều 116 + "tách biệt" |
| Điều 110 khoản 1: cấm cho vay, bảo lãnh | LCK (điểm e) | Đúng | — |
| TT98 Điều 30: tối thiểu 2 lần/tháng; Điều 32 khoản 1 điểm c: thanh toán ≤5 ngày làm việc | TT98; TT136 chỉ sửa Điều 30 khoản 6 và Điều 32 khoản 1 điểm d | Đúng (vẫn hiệu lực) | Thêm định nghĩa giờ đóng sổ lệnh, bản cáo bạch |
| RealLife: quỹ mở mua lại "theo giá trong ngày" | Điều 4 khoản 39–40; TT98 Điều 30 (giao dịch định kỳ) | Diễn đạt (gợi ý mua lại bất kỳ ngày nào) | "vào ngày nhận hàng cố định… vào các ngày giao dịch" (82 tiếng) |
| SEC Beginners' Guide to Mutual Funds; danh mục cập nhật 2015 | sec.gov pubs_annote (Modified 4/8/2015); beginmutual.htm (200) | Đúng | Thêm link trực tiếp |

### Bài quy-la-gi/02 — Khung pháp lý

| Khẳng định | Nguồn đã mở | Kết quả | Đã sửa |
|---|---|---|---|
| Luật 54/2019 sửa bởi 56/2024 (hiệu lực 01/01/2025) và 142/2025 (hiệu lực 01/03/2026) | LCK trang bìa Công báo | Đúng | — |
| "Chương VII (Điều 99 đến 113)" | LCK: Chương VII gồm Điều 99–117 (Mục 3 công ty đầu tư CK, Mục 4 NHGS) | Diễn đạt | "Mục 1 và Mục 2 Chương VII (Điều 99 đến 113)" |
| NĐ 155/2020 sửa bởi NĐ 245/2025 | PDF NĐ 245 (Công báo 1403+1404, ký 11/9/2025) | Đúng | — |
| Điều 100 khoản 3, 4 | LCK | Đúng | Tách câu; "Bộ trưởng Bộ Tài chính" |
| "Dự thảo sửa Luật CK đang được xem xét" (10/2026) | VietnamPlus 30/6/2026: Thứ trưởng BTC: trình QH khóa XVI kỳ họp 2 (dự kiến 10/2026) | Đúng nhưng mơ hồ | Ghi rõ nguồn và mốc thời gian; thêm link vào mục Nguồn |
| Điều 108: 100 NĐT (không tính NĐT chuyên nghiệp, trừ ETF), 50 tỷ, 90 ngày, báo cáo 10 ngày, hoàn tiền 15 ngày | LCK | Đúng ("ETF có quy định khác" → luật ghi "trừ quỹ hoán đổi danh mục") | Ghi rõ điều kiện 100 người không áp dụng cho ETF |
| Điều 110 khoản 1 a–g | LCK | Đúng về tỷ lệ; **ví dụ dùng "NAV 200 tỷ"/"NAV 100 tỷ" trong khi luật tính trên "tổng giá trị tài sản"** | Diễn đạt → giả định "tổng tài sản 200 tỷ, không nợ nên NAV cũng 200 tỷ"; quỹ đóng "tổng tài sản 100 tỷ"; giải thích tổ chức phát hành, chứng khoán đang lưu hành; nhóm công ty = mẹ–con |
| Điều 110 khoản 2: vay ≤5% NAV, ≤30 ngày | LCK (chỉ để trả chi phí cần thiết / thanh toán giao dịch CCQ; 5% "tại mọi thời điểm") | Đúng, thiếu điều kiện mục đích | Bổ sung mục đích vay |
| Điều 110 khoản 3–4 (vượt mức, 3 tháng) | LCK | Đúng | — |
| Điều 101 quyền/nghĩa vụ | LCK ("yêu cầu **công ty quản lý quỹ** mua lại CCQ quỹ mở") | Diễn đạt | Sửa chủ thể |
| Điều 102 Đại hội NĐT | LCK | Đúng | — |
| Điều 111 khoản 3: "không mua lại được thì báo UBCKNN trong 24 giờ" | LCK: chỉ khi xảy ra sự kiện ở khoản 2 (bất khả kháng, đình chỉ giao dịch không tính được NAV, sự kiện theo điều lệ); phải mua lại tiếp sau đó | Diễn đạt (dễ hiểu là quỹ được phép không mua lại) | Viết lại đầy đủ |
| Điều 112: tăng vốn quỹ đóng cần UBCKNN + ĐHNĐT | LCK Điều 112 khoản 1 (còn lợi nhuận năm trước dương, CTQLQ không bị phạt 2 năm, điều lệ cho phép) | Diễn đạt (thiếu điều kiện) | Thêm ví dụ điều kiện |
| Điều 104 khoản 1, 4 | LCK | Đúng | Chuyển thành danh sách; "chi phí giải thể", "các khoản phải trả khác" |
| Ví dụ giải thể 47 tỷ / 0,025% / 11,75 triệu | Tính lại | Đúng | — |
| Quỹ thành viên 2–99 NĐT chuyên nghiệp (Điều 4 khoản 41, Điều 113) | LCK | Đúng | — |
| Điều 11 khoản 1 điểm c, d, đ (chứng chỉ hành nghề; ≥2 tỷ; thu nhập chịu thuế ≥1 tỷ) | LCK | Đúng | Chuyển thành danh sách |
| NĐ 85/2026: hiệu lực 10/5/2026, thay NĐ 88/2016, loại trừ quản lý quỹ ĐTCK (Điều 1 khoản 2) | ketoananpha (toàn văn: Điều 44 khoản 1; Điều 1 khoản 2 điểm c) | Đúng; **tên chế định là "bảo hiểm hưu trí bổ sung"**, không phải "quỹ hưu trí bổ sung tự nguyện" | Diễn đạt → đổi tiêu đề H3 và câu chữ; dẫn thêm Điều 44 khoản 1 |
| Luật BHXH 41/2024/QH15 | luatvietnam (Điều 127 khoản 3 do NĐ 85/2026 hướng dẫn) | Đúng | — |

## Phép tính (node, tất cả khớp)

- Gỡ lỗ: 10%→11,11%; 20%→25%; 50%→100%.
- Lãi thực (CPI 5,08%): 104/1,0508=98,97; 106→100,88; 108→102,78. Lấy lãi trừ lạm phát: −1,08 / 0,92 / 2,92 (bảng ghi đúng là "xấp xỉ").
- Sức mua 100 triệu: 10 năm 60,93; 14 năm 49,97; 20 năm 37,12 → SVG ghi 61 / 50 / 37 và chiều cao cột (73,2 / 60 / 44,4 px theo thang 1,2) đều đúng. ln2/ln1,0508 = 13,99; 72/5,08 = 14,17.
- Lãi kép 12%/2 năm 125,44 so với lãi đơn 124. Lãi 8%: 215,9 / 466,1 / 1.006,3 so với 180 / 260 / 340; tỷ lệ 2,96; chênh lệch 35,9 và 666,3. SVG: thang 0,139 px/triệu, điểm cuối y=40,1, lãi đơn y=132,7, điểm gấp đôi năm 9 (199,9 triệu) y=152,2: đều đúng.
- Thời gian nhân đôi chính xác: 11,90 / 9,01 / 6,12 / 3,80; quy tắc 72 cho 12 / 9 / 6 / 3,6.
- Hiện giá: 500/1,08^10 = 231,60.
- Hai quán 50/50: +5% ở cả hai kịch bản.
- NAV: 100 tỷ; 10.000 đ/CCQ; 1.000 CCQ; 11.500 / 9.200 đ; người mới góp 11,5 triệu nhận 1.000 CCQ.
- Điều 110: 100 / 40 / 10 / 60 / 10 tỷ. Giải thể: 47 tỷ × 0,025% = 11,75 triệu.

## Link (mở lại ngày 13/10/2026)

- HTTP 200, nội dung đúng: Luật CK hợp nhất (CDN thuvienphapluat), caselaw TT98, luatvietnam TT98/TT136/BHXH, PDF TT96 (mbs), vsdc.vn, legalzone NĐ 245, ketoananpha NĐ 85, Investor.gov (WIW2023, glossary, 2026 bulletin), Fed Education, TAMU, TBTCVN, Tạp chí Công Thương, Tiki (2 sách), Thư viện số Quốc hội, Damodaran PDF, PDF Brinson, Nuttall, CFA, RePEc.
- curl bị 403 (chặn bot), mở bằng WebFetch thì OK: finra.org, econlib.org. sec.gov trả 200 khi khai báo UA theo chính sách của SEC.
- Đã thay: trang chủ nso.gov.vn → bài họp báo CPI 3/10/2026 trên NSO.
- Đã thêm: SEC beginmutual.htm; VietnamPlus 30/6/2026 (dự án sửa Luật CK).
- Không có link hỏng.

## Độ dễ hiểu (đã sửa)

- Tách câu dài (>30 chữ, không tính phần trích điều luật): định nghĩa FINRA, Investor.gov, danh mục chính sách, giới hạn hai mức, cụm câu "Thứ hai", định nghĩa quỹ ĐTCK, các ý về NAV, các lớp phong tỏa, Điều 100, trường hợp giải thể (chuyển thành danh sách), NĐT chuyên nghiệp (chuyển thành danh sách), các câu tóm tắt. Một số câu còn khoảng 31–33 chữ chỉ vì có phần trích điều/khoản trong ngoặc.
- Thêm giải thích ngay lần đầu: danh mục, đáo hạn, quỹ cân bằng, lưu ký (giữ hộ), điều lệ quỹ, chứng khoán niêm yết, giờ đóng sổ lệnh, bản cáo bạch, ETF / quỹ hoán đổi danh mục, thành viên độc lập, tổ chức phát hành, chứng khoán đang lưu hành, nhóm công ty có quan hệ sở hữu.
- Thêm ví dụ giả định cho phần quỹ dự phòng.
- Quy tắc: không nêu tên quỹ, CTQLQ hay ngân hàng; không có lời khuyên mua bán; số thực có kỳ và nguồn; ví dụ đều ghi "giả định". RealLife 57–82 tiếng (≤90), đều kết bằng "→".
- SVG hàng rào: nhãn "Nhóm công ty liên quan" → "Nhóm công ty có quan hệ sở hữu" (cả `<title>` và caption). Đã render bằng Chrome headless ở theme sáng/tối: không tràn chữ, màu chỉ dùng token, file 2,6KB.

## Không xác minh được (đã xử lý thế nào)

- Hiệu lực hiện tại của TT 96/2020: chưa thấy văn bản thay thế. Có kế hoạch sửa đổi (08/2026/TT-BTC, theo kết quả tìm kiếm), chưa rõ đã ban hành. Giữ trích dẫn Điều 26 (bài đã có câu "đọc văn bản hợp nhất").
- Câu "Quy tắc 72 đúng nhất ở khoảng 6–10%/năm" là phép tự tính của OmniLab (bài đã ghi rõ), bảng số liệu ủng hộ. Giữ nguyên.
- NĐ 155/2020 có văn bản sửa đổi nào sau NĐ 245/2025 không: chưa kiểm. Bài chỉ nói "sửa đổi bởi NĐ 245/2025", không khẳng định là bản sửa duy nhất.

## Câu hỏi mở

1. research-01 mục 5 ghi "trước khi đầu tư", nguồn gốc lại viết "as you invest". Fact-checker các module khác (chiến lược, an toàn) nên rà lại nếu có dùng cùng khẳng định này.
2. Kỳ họp QH tháng 10/2026 có thể thông qua Luật CK sửa đổi ngay sau ngày viết. Cần lịch rà lại bài `quy-la-gi/02` sau kỳ họp.

Status: DONE
Summary: Đã kiểm chứng lại toàn bộ khẳng định, phép tính, link và SVG của 4 bài nen-tang/quy-la-gi; sửa 3 lỗi Sai và khoảng 15 điểm Diễn đạt trong cả MDX lẫn snapshot; đặt examplesReviewed: true. verify:fidelity OK, astro check 0 lỗi.
