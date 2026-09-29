---
title: "Hiệu đính nội dung gốc: tai-chinh lo-trinh-12-tuan (tuần 01-12)"
date: 2026-09-29
status: completed
---

# Hiệu đính nội dung gốc — tai-chinh / lo-trinh-12-tuan

Phạm vi: chỉ văn bản gốc (bỏ qua `<RealLife>`, `<Figure added>`, `<Disclaimer>`). So từng đoạn với `content-sources/finance/index.html` dòng 43–57 (section `#lich-hoc`). Chỉ thêm khối `<ReviewNote>` ở cuối file, không sửa dòng nào khác.

## Kết quả

| Bài | Ghi chú | Mức độ |
|---|---|---|
| 01 | 3 | Định dạng ×3 (link `#hoc-lieu` chết; eyebrow "03 / Kế hoạch thực hiện" thành đoạn văn + summary; mã H1/S1 không có link) |
| 02 | 1 | Định dạng (H1) |
| 03 | 2 | Định dạng ("giải bài lãi kép bên dưới" — bài tập nằm ở module Thực hành; H1/H2) |
| 04 | 1 | Định dạng (H2 + "mục Việt Nam") |
| 05 | 2 | Diễn đạt (21 ngày cân nhắc áp dụng cả BH sức khoẻ >1 năm, tính từ ngày nhận HĐ) + Định dạng |
| 06 | 2 | Diễn đạt (rút BHXH một lần bị giới hạn từ 01/7/2025) + Định dạng |
| 07 | 1 | Định dạng (H3, S1, mục Việt Nam) |
| 08 | 1 | Định dạng (H3, H6) |
| 09 | 1 | Định dạng (H3) |
| 10 | 1 | Định dạng (H2, H4, S2) |
| 11 | 1 | Định dạng (H3) |
| 12 | 0 | Không thêm khối |

Không phát hiện: lỗi sai sự thật, lỗi số học (văn bản gốc của 12 tuần không có con số tính toán), lỗi chính tả/dấu, escape thừa, list/table vỡ, mất nhấn mạnh (**Học/Làm/Đạt khi/Quyết định** khớp HTML). Không có liên kết ngoài nào trong văn bản gốc của 12 bài (chỉ `#hoc-lieu`).

## Bằng chứng chính

- `#hoc-lieu`: `grep 'id="hoc-lieu"' dist/hoc/tai-chinh` → 0 kết quả. Thư viện H1–H6 ở `nguon-hoc/01-nguon-hoc-chinh-thuc.mdx` (URL `/hoc/tai-chinh/nguon-hoc/nguon-hoc-chinh-thuc`), S1–S5 ở `nguon-hoc/02-tu-sach-va-lich-doc.mdx`, "mục Việt Nam" ở `an-toan/01-boi-canh-viet-nam.mdx`, bài lãi kép ở `thuc-hanh/01-bai-tap-va-thu-tu-tien-du.mdx` mục "2. Lãi kép & sức mua". URL đều có trong `dist/`.
- Eyebrow: `dist/.../tuan-01/index.html` có `<meta name="description" content="03 / Kế hoạch thực hiện">`; `tai-chinh.yaml` đặt `lo-trinh-12-tuan` là module order 2, không phải 03.
- Điều 35 Luật KDBH 2022 (tải toàn văn, trích): "Đối với các hợp đồng bảo hiểm có thời hạn trên 01 năm, trong thời hạn 21 ngày kể từ ngày nhận được hợp đồng bảo hiểm…", nằm trong "Mục 2. HỢP ĐỒNG BẢO HIỂM NHÂN THỌ, HỢP ĐỒNG BẢO HIỂM SỨC KHỎE". Nguồn: [xaydungchinhsach.chinhphu.vn](https://xaydungchinhsach.chinhphu.vn/toan-van-luat-kinh-doanh-bao-hiem-119240130070753445.htm), [AIA](https://www.aia.com.vn/vi/song-khoe/loi-khuyen/tai-chinh/huy-hop-dong-bao-hiem-trong-21-ngay.html).
- Khoản 1 Điều 70 Luật BHXH 2024 (trích qua BHXH TP.HCM trả lời trên Báo Chính phủ 14/4/2026): các điểm a–e; điểm đ (12 tháng nghỉ, chưa đủ 20 năm) chỉ cho "người lao động có thời gian đóng bảo hiểm xã hội trước ngày Luật này có hiệu lực". Nguồn: [baochinhphu.vn](https://baochinhphu.vn/dieu-kien-va-muc-huong-bhxh-mot-lan-102260413155753513.htm), [BHXH Hà Nội](https://hanoi.baohiemxahoi.gov.vn/tintuc/Pages/chinh-sach-moi.aspx?CateID=0&ItemID=35024), [14 điểm mới Luật BHXH 2024](https://xaydungchinhsach.chinhphu.vn/14-noi-dung-moi-trong-tam-cua-luat-bao-hiem-xa-hoi-2024-119240806172349712.htm). Mọi link trích dẫn: HTTP 200 (curl, 2026-09-29).
- CIC (tuần 4, "Tự tra lịch sử tín dụng của mình tại CIC"): CIC vẫn là đơn vị thuộc NHNN, tra cứu cá nhân qua web/app CIC Connect vẫn còn → không ghi chú.

## Vấn đề hệ thống (không ghi vào ReviewNote)

- `summary` frontmatter của tuần 02–12 chứa markdown thô (`**Học:**`, `**Làm:**`), hiện nguyên dấu `**` trong meta description và snippet tìm kiếm (`dist/search-index.json`: 12 summary có `**`; `search-index.json.ts` dùng `data.summary` nguyên văn). Tuần 06 summary bị cắt "…". Đây là lỗi của script migration (lấy đoạn đầu làm summary), sửa ở frontmatter hoặc strip markdown khi build — ngoài quyền sửa của task này, chỉ ghi trong ReviewNote tuần 01 vì ở đó lỗi còn hiện trong thân bài.
- Tuần 02–12 chỉ có `###` (H3), không có H2 → nhảy cấp heading từ H1 (tiêu đề trang). Là cấu trúc do tách bài, không phải nội dung gốc; controller cân nhắc.
- Các mã H/S và "mục Việt Nam" lặp ở 11 bài: cách sửa gọn nhất là gắn link cho mã một lần trong migration (hoặc component chú thích mã nguồn), thay vì sửa tay từng bài.

## Kiểm tra

- `git diff --numstat` 11 file: chỉ thêm dòng (6–8+/0−); 0 dòng bị xoá. Bài 12 không đổi.
- `pnpm verify:fidelity`: OK — 27 kien-truc + 23 tai-chinh.
- Không chạy build/check, không commit (theo chỉ dẫn).

## Câu hỏi chưa giải quyết

- Một kết quả tìm kiếm nói web cic.gov.vn tạm dừng đăng ký từ 01/4/2026, trang Techcombank (cập nhật 27/9/2026) vẫn hướng dẫn dùng web; cic.gov.vn trả 403 với curl. Không đủ chắc để ghi chú; câu gốc chỉ nói "tại CIC" nên vẫn đúng.
- Có muốn ghi lỗi `summary` markdown thô vào ReviewNote từng bài không, hay sửa tập trung ở script/build?
