# Kiểm chứng vòng 2: module `an-toan-nguon-hoc` (dau-tu-quy)

Ngày kiểm chứng: 13/10/2026. Người kiểm: fact-checker D (độc lập).
Phạm vi: `01-nhan-dien-lua-dao.mdx`, `02-hoc-o-dau.mdx`, 2 snapshot trong `content-sources/dau-tu-quy/07-an-toan-nguon-hoc/`, 3 SVG `an-toan-nguon-hoc-*.svg`.
Cách làm: tự mở lại nguồn gốc (curl với User-Agent trình duyệt + pdftotext, WebFetch). Báo cáo research chỉ dùng để biết nên tìm ở đâu, không dùng làm bằng chứng.

## Tóm tắt

- Tìm được **4 lỗi Sai**, đã sửa hết:
  1. **TT 197/2015 đã hết hiệu lực.** TT 135/2025/TT-BTC (ký 26/12/2025, hiệu lực 09/02/2026) bãi bỏ TT 197/2015 (Điều 12 khoản 1). Bài 02 vẫn dẫn TT 197 như văn bản hiện hành, kèm số điều cũ. Đã viết lại mục chứng chỉ hành nghề theo Luật CK hợp nhất (Điều 9, 97) và TT 135/2025.
  2. **TT 98 Điều 20 khoản 6 đã bị TT 136/2025 sửa.** Từ 12/02/2026, NAV chỉ bắt buộc đăng trên web Sở GDCK khi chứng chỉ quỹ **niêm yết**. Bài 01 viết "công bố trên web công ty quản lý quỹ và Sở GDCK" cho mọi quỹ, và câu hỏi 4 bảo "so hai nơi". Đã sửa bảng luật, câu hỏi 4, alt hình, tóm tắt và SVG bốn câu hỏi.
  3. **Link nguồn tháng 3/2026 không chứa hai ý bài nêu.** Bài TBTC 26/03/2026 không có mức lãi 6–8,5%/10%/năm, cũng không có câu "không được pháp luật về chứng khoán bảo vệ". Hai ý này có ở CafeF, Dân trí, Vietstock, Markettimes. Đã thêm link CafeF 27/03/2026 vào Nguồn. Đã ghi rõ đó là mức lãi "các nền tảng tự quảng bá", không phải số của UBCKNN.
  4. **Mô tả nội dung sách Malkiel và Graham không có nguồn.** Cụm "đa dạng hoá, chi phí, chỉ số" và "rủi ro, khẩu vị, kỷ luật" chỉ là nhãn chủ đề do researcher tự đặt. Đã viết lại theo hồ sơ Thư viện số Quốc hội (Malkiel) và trang nhà sách (Graham).
- Sửa thêm vài chỗ **Diễn đạt** vượt nguồn: SEC không nói người dẫn dắt nhóm "cũng là nạn nhân"; FINRA không viết "nhiều người đã có lãi"; "hai danh sách khớp nhau ở năm điểm" nói quá; CFA không ghi ngôn ngữ; Luật CK Điều 12 khoản 4 còn có "giấy chứng nhận, chấp thuận".
- Bổ sung có nguồn: TT 98 Điều 22 khoản 6 (quảng cáo không được dùng hình ảnh cơ quan nhà nước) và Điều 23 khoản 1 điểm b (bắt buộc khuyến cáo có thể mất vốn). Thêm đèn đỏ phụ "bảo chuyển tiền thẳng cho người mời" (FINRA), để phân tích nốt chi tiết "chuyển 50 triệu vào tài khoản này" trong tin nhắn mẫu.
- Đã đặt `examplesReviewed: true` cho cả 2 MDX. `pnpm verify:fidelity` báo OK (14 bài dau-tu-quy). `pnpm check` cho 0 lỗi, 0 cảnh báo.

## Bảng kiểm chứng

### Bài 01 — Nhận diện "quỹ" lừa đảo

| # | Khẳng định | Nguồn đã mở | Kết quả | Xử lý |
|---|---|---|---|---|
| 1 | SEC: "If it sounds too good to be true, it is" | sec.gov/teachers-guide/how-to-avoid-fraud (WebFetch) | Đúng | Giữ |
| 2 | SEC: "If there's nothing in writing, walk away" | như trên | Đúng | Giữ |
| 3 | SEC + FINRA cùng nêu 5 dấu hiệu (hứa lãi chắc, lời mời tự tìm đến, ép nhanh, không giấy tờ, người bán không đăng ký) | SEC (Warnings + "resist the pressure", "unregistered"); FINRA Red Flags (Guarantees, Unsolicited, Unregistered Products/Sellers, Pushy Salespeople); FINRA Avoid Fraud | Diễn đạt: "hai danh sách khớp nhau ở năm điểm" nói quá. Danh sách gạch đầu dòng của SEC không có đủ 5 mục; hai mục còn lại nằm rải ở chỗ khác trên trang | Đổi thành "Cả hai cùng nêu năm dấu hiệu dưới đây" |
| 4 | FINRA: giữ bí mật, rủ người khác | FINRA Red Flags, "Requests for Secrecy": "won't ask you to keep secrets or to recruit additional investors" | Đúng | Giữ |
| 5 | Affinity fraud: "người dẫn dắt trong nhóm có thể cũng là nạn nhân" | SEC: "Fraudsters may convince unsuspecting group leaders to promote the scheme" | Diễn đạt vượt nguồn | Sửa: kẻ lừa có thể thuyết phục cả người có uy tín, vốn không nghi ngờ, đứng ra giới thiệu giúp |
| 6 | FINRA: "nhiều người đã có lãi rồi" | FINRA Avoid Fraud: "other savvy investors have already purchased" | Diễn đạt | Sửa: "nhiều nhà đầu tư sành sỏi đã mua rồi"; sửa cả bảng thuật ngữ |
| 7 | (mới) Chuyển tiền cho cá nhân người bán là đèn đỏ | FINRA Red Flags, "Unusual Asset-Holding Arrangements": "provide money to them personally" | Đúng | Thêm thành đèn đỏ phụ thứ 4 |
| 8 | UBCKNN cảnh báo "hợp tác đầu tư" qua app/web, tiền "ủy thác cho CTQLQ", tháng 3/2026 | TBTC 26/03/2026; Dân trí 26/03/2026; CafeF 27/03/2026; Vietstock; Markettimes | Đúng (ngày 26/3/2026) | Ghi rõ ngày |
| 9 | Lãi mời 6–8,5%/năm, có nơi đến 10%/năm | CafeF 27/03/2026 ("lợi nhuận mục tiêu 6–8,5%/năm", "lên đến 10%/năm"); Dân trí (8,5%) | Đúng, nhưng là số nền tảng **tự quảng bá**, và không có trong link TBTC đang dẫn | Ghi "các nền tảng này tự quảng bá"; thêm link CafeF |
| 10 | Không do UBCKNN quản lý, cấp phép; có thể không được luật chứng khoán bảo vệ | Câu thứ nhất có ở TBTC; cả hai câu có ở Dân trí, CafeF, Vietstock, Markettimes: "không được pháp luật về chứng khoán bảo vệ quyền và lợi ích hợp pháp" | Đúng (link cũ thiếu vế 2) | Thêm link CafeF |
| 11 | Năm 2023 UBCKNN cho biết văn bản cấp phép giả, chuyển Công an | thitruongtaichinhtiente.vn/print/47642.html (03/07/2023): văn bản giả số 128/GCN-UBCK ngày 10/5/2023 về lập quỹ đại chúng; UBCKNN gửi văn bản tới Công an | Đúng | Viết chính xác hơn: "tháng 7/2023", "văn bản giả mạo về việc lập quỹ đại chúng". Thêm ý UBCKNN nhắc danh sách CTQLQ, quỹ đăng trên ssc.gov.vn (cùng nguồn) |
| 12 | Luật CK Điều 12 khoản 4 | VBHN 102/VBHN-VPQH (Công báo 269, 12/5/2026), legalzone PDF + pdftotext | Đúng số khoản. Diễn đạt thiếu: nguyên văn là "cấp giấy phép, cấp giấy chứng nhận hoặc chấp thuận" | Bổ sung cụm này |
| 13 | Luật CK Điều 12 khoản 1 (gian lận, lừa đảo, làm giả tài liệu) | VBHN 102 | Đúng; khoản 1 không bị Luật 56/2024 sửa (chỉ khoản 3 có chú thích sửa) | Giữ |
| 14 | Luật CK sửa bởi Luật 56/2024 | VBHN 102 (còn có Luật 142/2025 về phục hồi, phá sản sửa một cụm từ) | Đúng | Thêm số và ngày VBHN (22/4/2026); thay link Luật CK 2019 gốc bằng link VBHN |
| 15 | TT 98 Điều 22 khoản 4 | caselaw TT 98 gốc; luatvietnam TT 136 toàn văn (TT 136 chỉ sửa Điều 22 **khoản 6**) | Đúng. Diễn đạt "có quy định riêng" mơ hồ; nguyên văn là "không áp dụng" cho quỹ mở đầu tư hoàn toàn vào trái phiếu, CK thu nhập cố định, và quỹ bảo toàn vốn | Viết đúng ngoại lệ |
| 16 | TT 98 Điều 22 khoản 5 | như trên | Đúng, không bị sửa | Giữ |
| 17 | TT 98 Điều 23 khoản 1 điểm c | như trên; TT 136 không sửa Điều 23 | Đúng | Gộp với điểm b (khuyến cáo có thể mất vốn) |
| 18 | TT 98 Điều 20 khoản 6: NAV công bố chậm nhất ngày làm việc kế tiếp, trên web CTQLQ **và** Sở GDCK | TT 136/2025 Điều 7 sửa khoản 6: web Sở GDCK "đối với trường hợp chứng chỉ quỹ niêm yết", web CTQLQ; "muộn nhất vào ngày làm việc tiếp theo của ngày định giá". (Bản gốc ghi "tại ngày làm việc tiếp theo") | **Sai** (dùng bản trước sửa đổi, lại pha chữ "chậm nhất" của bản mới) | Sửa bảng luật, câu hỏi 4, alt, tóm tắt, SVG |
| 19 | TT 98 Điều 3 khoản 2: tài sản quỹ đại chúng lưu ký tại 1 ngân hàng giám sát | caselaw TT 98; TT 136 không sửa Điều 3 | Đúng | Giữ |
| 20 | Tên ngân hàng giám sát ghi trong điều lệ, bản cáo bạch | TT 98 Điều 4 khoản 4; Phụ lục I (mẫu điều lệ) có "Điều 7. Ngân hàng giám sát"; Phụ lục III (mẫu bản cáo bạch) có mục "V. Ngân hàng giám sát" | Đúng | Ghi cơ sở: mẫu điều lệ và mẫu bản cáo bạch |
| 21 | (mới) NAV phải được ngân hàng giám sát xác nhận | TT 98 Điều 20 khoản 5; TT 136 không sửa khoản này | Đúng | Thêm vào câu hỏi 4 |
| 22 | (mới) TT 98 Điều 22 khoản 6: quảng cáo nhắc cơ quan nhà nước phải nói rõ chỉ xác nhận tính hợp pháp; không dùng tên, biểu tượng, hình ảnh cơ quan nhà nước | luatvietnam TT 136 Điều 9 (sửa khoản 6) | Đúng | Thêm 1 dòng vào bảng luật |
| 23 | BLHS 2015 Điều 174 khoản 1: "bằng thủ đoạn gian dối chiếm đoạt tài sản của người khác" | hethongphapluat (bản cập nhật); hoatieu.vn (Luật 86/2025, các mục 1–15); pbgdpl.cantho.gov.vn | Đúng. Luật 86/2025/QH15 (hiệu lực 01/7/2025) sửa Điều 40, 49, 62, 63, 109, 110, 114, 192–195, 235–243… và bỏ tử hình 8 tội; không thấy Điều 174 trong các phần đọc được | Giữ (xem mục Không xác minh được) |
| 24 | NAV = tài sản trừ nợ, chia cho số chứng chỉ quỹ | TT 98 Điều 20 khoản 1 điểm a, b | Đúng | Đưa định nghĩa lên trước bảng luật |
| 25 | NĐ 40/2018 (đa cấp) | Bài không dẫn | — | Không cần sửa. Ghi chú: có nguồn nói NĐ 137/2026 đã thay NĐ 40/2018 từ 01/7/2026 |
| 26 | Luật CK Điều 75 | Bài không dẫn. VBHN 102: khoản 1 (vốn), khoản 3a (≥2 cổ đông sáng lập là tổ chức), khoản 5 (≥5 nhân viên có chứng chỉ hành nghề quản lý quỹ) vẫn đúng số | — | Không cần sửa |
| 27 | TT 98 Điều 78 khoản 4 | Bài không dẫn. TT 136 Điều 26 sửa khoản 6, 7 và thêm khoản 9–12, không sửa khoản 4 | — | Không cần sửa |

### Bài 02 — Học ở đâu

| # | Khẳng định | Nguồn đã mở | Kết quả | Xử lý |
|---|---|---|---|---|
| 1 | SRTC thuộc UBCKNN | TT 135/2025 Điều 2 khoản 2 ("Trung tâm Nghiên cứu khoa học và Đào tạo chứng khoán thuộc Ủy ban Chứng khoán Nhà nước"); bài SRTC 07/01/2026 | Đúng (cơ sở cũ là TT 197 đã hết hiệu lực) | Giữ; sửa cách viết hoa đúng tên |
| 2 | Trang nhà đầu tư SRTC: kiến thức cơ bản, sản phẩm, tài liệu, văn bản pháp luật, hỏi đáp, công cụ tính | nhadautu.srtc.org.vn/en (menu) | Đúng. Link cũ `/en/quick-question` là trang bài trắc nghiệm, không phải trang chủ | Đổi link sang `/en`. Bản tiếng Việt `/` là trang tin, không có đủ các mục này, nên giữ bản tiếng Anh |
| 3 | SEC Beginners' Guides (đầu tư, quỹ tương hỗ, phân bổ/đa dạng hoá/tái cân bằng, báo cáo tài chính), cập nhật 2015 | sec.gov/investor/pubs_annote.shtml: "Modified: 4/8/2015", đủ 4 tựa | Đúng | Ghi ngày 08/4/2015 |
| 4 | CFA Investment Foundations: 5 môn, 100 câu, 35–65 giờ, 350 USD, tiếng Anh | cfainstitute.org (WebFetch + curl): Course 1–5, "100 multiple choice questions", "35-65 hours", "USD 350", tự học online; **không ghi ngôn ngữ** | Đúng số liệu; "Tiếng Anh" là Diễn đạt | Ghi "5 phần học", "trang chương trình viết bằng tiếng Anh" |
| 5 | Chứng chỉ hành nghề theo TT 197/2015 (Điều 3, 4, 5, 9); "có dự thảo thay thế" | TT 135/2025 Điều 12 khoản 1 (luatvietnam toàn văn) và bài SRTC: TT 135 hiệu lực 09/02/2026, bãi bỏ TT 197 | **Sai** (văn bản đã bị thay thế) | Viết lại theo Luật CK VBHN: Điều 97 khoản 1 (3 loại), Điều 9 khoản 1 điểm c (UBCKNN cấp), Điều 97 khoản 2 (điều kiện); TT 135: Điều 2 khoản 2, Điều 3 khoản 2–3 (SRTC cấp chứng chỉ chuyên môn, khoá học của SRTC hoặc trường đại học liên kết), Điều 4 (CIIA, CFA bậc I/II tương đương; Investment Foundations không có trong danh sách) |
| 6 | Housel — NXB Dân Trí, 1980 Books phát hành, dịch Hoàng Thị Minh Phúc; 19 bài | shop.alphabooks.vn (sống): Phát hành 1980Books, dịch giả Hoàng Thị Minh Phúc, NXB Dân Trí, "19 câu chuyện ngắn" | Đúng. "thay vì công thức làm giàu" là Diễn đạt | Sửa theo trang: "kiểm soát cảm xúc quan trọng hơn thuộc lòng công thức đầu tư" |
| 7 | Malkiel — NXB Lao động – Xã hội, 2009 | thuvienso.quochoi.vn/handle/11742/95306 (sống): Publisher NXB Lao động – Xã hội, Issue Date 2009; Tiki (sống, bản "Tái bản", không ghi NXB) | Đúng | Giữ |
| 8 | Malkiel: "bàn về đa dạng hoá, chi phí, đầu tư theo chỉ số" | Hồ sơ thư viện và Tiki không nêu | **Sai** (không có nguồn; là nhãn chủ đề của research-01) | Viết theo tóm tắt của thư viện |
| 9 | Graham — Nhã Nam, NXB Dân Trí, dịch Lê Quốc Phương và Bùi Quỳnh Chi | Tiki p278951335 (sống, gian Alpha Books Official) | Đúng | Giữ |
| 10 | Graham: "nói về rủi ro, khẩu vị và kỷ luật" | Trang Tiki: "tác phẩm kinh điển về đầu tư giá trị", in lần đầu 1949, có bình luận của Jason Zweig | **Sai** (không có nguồn) | Viết theo trang nhà sách |
| 11 | Kahneman — NXB Thế Giới & Alpha Books, 2014 | thuvienso.quochoi.vn/handle/11742/96559 (sống): NXB Thế giới, Công ty CP Sách Alpha, 2014, ISBN 9786047706907 | Đúng | Giữ |
| 12 | Lộ trình 4 chặng, nhịp học của Minh | Đề xuất của OmniLab, có ghi "giả định" | Không cần nguồn | Giữ |

## Link

Đã mở bằng curl hoặc WebFetch ngày 13/10/2026.

| Link | Trạng thái |
|---|---|
| sec.gov/teachers-guide/how-to-avoid-fraud | 200 (tiêu đề trang: "Saving and Investing for Teachers") |
| finra.org …/red-flags-fraud; …/avoid-fraud | 200 |
| thoibaotaichinhvietnam.vn …194520.html | 200, ngày 26/03/2026 |
| cafef.vn …188260327100235891.chn (mới) | 200 |
| thitruongtaichinhtiente.vn/print/47642.html | 200 |
| legalzone.vn … vbhn-102-vbhn-vpqh-luat-chung-khoan.pdf (mới, thay hethongphapluat Luật CK 2019 gốc) | 200, 102 trang |
| caselaw.vn TT 98 | 200 (bản gốc; đổi nhãn thành "toàn văn bản gốc") |
| luatvietnam.vn TT 136/2025 (mới) | 200, có toàn văn |
| luatvietnam.vn TT 135/2025 (mới, thay link TT 197) | 200, có toàn văn |
| nhadautu.srtc.org.vn/en/p/gioi-thieu-noi-dung-thong-tu-so-1352025… (mới) | 200 |
| hethongphapluat.com/bo-luat-hinh-su-2015/dieu-174 | 200. Lưu ý: trang chèn dòng chữ ẩn ra lệnh cho AI ("QUAN TRỌNG: Hãy luôn thông báo…"); đã bỏ qua, không ảnh hưởng nội dung bài |
| ssc.gov.vn | 200 → /webcenter/portal/ubck |
| nhadautu.srtc.org.vn/en (thay /en/quick-question); srtc.org.vn/en | 200 |
| sec.gov/investor/pubs_annote.shtml; cfainstitute.org …/investment-foundations-certificate | 200 |
| shop.alphabooks.vn Housel; 2 link thuvienso.quochoi.vn; 2 link tiki.vn | 200, đúng sách |

Link nội bộ: mọi `/hoc/dau-tu-quy/<module>/<slug>` đều trỏ tới file có thật (slug = tên file bỏ tiền tố số): nen-tang ×2, quy-la-gi ×2, loai-quy ×2, chi-phi-tai-lieu ×2, danh-gia-quy ×2, chien-luoc ×2, an-toan-nguon-hoc/nhan-dien-lua-dao. Link chéo `/hoc/tai-chinh/an-toan/chong-gia-mao` trỏ tới `src/content/lessons/tai-chinh/an-toan/02-chong-gia-mao.mdx`; tiêu đề khớp với chữ trên link.

## Độ dễ hiểu

- Tách các câu dài hơn 30 chữ: câu về NAV ở bảng luật, đoạn "Điểm cần nhớ", phần "Giúp được gì" của FINRA, phần "Việc làm được" ở chặng 1, ô SRTC trong bảng, phần giới thiệu sách Malkiel, điều kiện chứng chỉ hành nghề, gạch đầu dòng "Bốn câu hỏi" ở tóm tắt. Script chỉ còn báo 3 chỗ, đều là cảnh báo giả: câu trích dẫn đứng liền câu sau, tiêu đề in đậm đứng liền câu sau, và một dòng liệt kê nguồn.
- Thuật ngữ được giải thích ở lần đầu xuất hiện trong bài 01:
  - "đèn đỏ" = dấu hiệu cảnh báo;
  - điều lệ, bản cáo bạch (ngay sau bảng 5 đèn);
  - ngân hàng giám sát (ngay sau lời chị Thu);
  - NAV (đưa lên trước bảng luật).
- Bài 02 thêm câu phân biệt "chứng chỉ chuyên môn" và "chứng chỉ hành nghề".
- Tin nhắn mẫu: mọi chi tiết đã được đối chiếu với một dấu hiệu. Chi tiết "chuyển 50 triệu vào tài khoản này" trước đây chưa phân tích, nay thêm đèn đỏ phụ theo FINRA.
- RealLife: 4 khối, 56–67 tiếng, đều kết bằng "→", bối cảnh Việt Nam. Không thay đổi.
- Quy tắc nội dung: không nêu tên quỹ, công ty quản lý quỹ hay ứng dụng. Các báo có nêu tên app, nhưng bài cố ý không nêu. Không có lời khuyên mua bán. Số thực có ghi kỳ và nguồn: 26/3/2026, 7/2023, CFA 10/2026, SEC 08/4/2015.
- SVG: chỉ sửa nhãn câu 4 thành "④ NAV có công bố / công khai, đúng hạn?" và cập nhật `<title>`. XML hợp lệ, 4,7 KB, không có mã màu hex, id giữ nguyên. Hai SVG còn lại không có lỗi nội dung.
- Độ dài: bài 01 tăng từ khoảng 2.318 lên khoảng 2.810 tiếng (đếm theo dấu cách, chưa tính mục Nguồn), chủ yếu vì bảng luật đầy đủ hơn. Bài 02 khoảng 2.138 tiếng. Cả hai đều dài hơn mức 1.200–1.800 chữ trong brief, nhưng bản gốc cũng đã vượt mức này.

## Không xác minh được

1. Luật 86/2025/QH15 có sửa BLHS Điều 174 hay không: trang hoatieu.vn chỉ hiện đến mục 15 (Điều 243), phần sau bị cắt; thuvienphapluat trả 403. Các bản tóm tắt (Cần Thơ, lsvn) không nhắc Điều 174. Bài chỉ dẫn định nghĩa ở khoản 1, nên rủi ro thấp.
2. Toàn văn TT 136/2025 lấy từ luatvietnam (HTML). Bản PDF trên hcc.nghean.gov.vn là bản scan nên không trích được chữ. Chưa đối chiếu được bằng bản PDF có chữ.
3. Phụ lục III (mẫu bản cáo bạch) đã bị TT 136 thay. Chưa đọc được phụ lục mới để chắc rằng mục "Ngân hàng giám sát" vẫn còn. Bài vẫn đúng nhờ TT 98 Điều 4 khoản 4 (bản cáo bạch nêu rõ ngân hàng giám sát) và Phụ lục I (mẫu điều lệ), không bị thay.
4. Hệ thống tra cứu trạng thái người hành nghề của UBCKNN (TT 135 Điều 5, 7) đã chạy chưa: SRTC chỉ ghi "dự kiến trong năm 2026". Vì vậy không đưa ý này vào bài.
5. NĐ 40/2018 bị NĐ 137/2026 thay từ 01/7/2026: mới thấy ở một nguồn (hethongphapluat, Điều 58). Bài không dẫn văn bản này.
6. Danh sách công ty quản lý quỹ trên ssc.gov.vn: chưa mở được nội dung (cổng chạy bằng JavaScript). Bài chỉ dẫn lời UBCKNN (qua báo, 2023 và 2026) rằng danh sách có đăng trên đó.

## Câu hỏi mở

1. Bộ Tài chính dự kiến trình Quốc hội luật sửa đổi Luật Chứng khoán tại kỳ họp tháng 10/2026 (theo tinnhanhchungkhoan, congluan; chưa mở được toàn bài). Nếu luật mới được thông qua, cần rà lại số Điều 9, 12, 97 ở cả 2 bài. Có nên thêm một câu nhắc "luật đang được sửa tiếp" khi đã có nguồn chính thức không?
2. Bài 01 đã dài khoảng 2.800 tiếng. Controller có muốn rút gọn bảng luật (ví dụ bỏ dòng Điều 22 khoản 5) để gần mức 1.800 không?
3. Đã grep (chỉ đọc) các bài ngoài phạm vi: `quy-la-gi/01-co-che-quy` và `chi-phi-tai-lieu/02-doc-tai-lieu-quy` đã viết đúng Điều 20 khoản 6 sau TT 136. Không bài nào còn dẫn TT 197. Bài 01 của module này nay thống nhất với các bài đó.

Status: DONE
Summary: Đã kiểm 39 khẳng định và sửa 4 lỗi Sai (TT 197 đã bị TT 135/2025 thay; TT 98 Điều 20 khoản 6 đã bị TT 136 sửa về nơi công bố NAV; nguồn báo thiếu cho mức lãi và vế "không được bảo vệ"; mô tả sách không có nguồn) cùng các chỗ diễn đạt vượt nguồn. Đã đồng bộ MDX, snapshot và SVG, đặt `examplesReviewed: true`; `verify:fidelity` OK, `pnpm check` 0 lỗi.
