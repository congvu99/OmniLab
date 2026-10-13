# Hướng dẫn chung cho writer — lĩnh vực `dau-tu-quy` (Quỹ và đầu tư)

Đọc trước: `README.md`, `docs/content-authoring-guide.md` (đặc biệt mục "Lĩnh vực tự biên soạn"), `docs/illustration-style-guide.md`, và một bài mẫu: `src/content/lessons/nghe-tai-chinh/vi-mo/01-hieu-nhanh.mdx` + snapshot `content-sources/nghe-tai-chinh/03-vi-mo/01-hieu-nhanh.md` + SVG trong `src/assets/illustrations/nghe-tai-chinh/`.

Domain YAML đã có: `src/content/domains/dau-tu-quy.yaml` (KHÔNG sửa).

## Danh sách bài (slug cố định — liên kết chéo `/hoc/dau-tu-quy/<module>/<slug>` với slug = tên file BỎ tiền tố số và đuôi, ví dụ `/hoc/dau-tu-quy/nen-tang/rui-ro-loi-nhuan-lai-kep`)

| Module | File MDX | Snapshot | Tiêu đề gợi ý |
|---|---|---|---|
| nen-tang | `nen-tang/01-rui-ro-loi-nhuan-lai-kep.mdx` | `dau-tu-quy/01-nen-tang/01-rui-ro-loi-nhuan-lai-kep.md` | Rủi ro, lợi nhuận, lạm phát và lãi kép |
| nen-tang | `nen-tang/02-da-dang-hoa-phan-bo.mdx` | `dau-tu-quy/01-nen-tang/02-da-dang-hoa-phan-bo.md` | Đa dạng hoá, phân bổ tài sản và khẩu vị rủi ro |
| quy-la-gi | `quy-la-gi/01-co-che-quy.mdx` | `dau-tu-quy/02-quy-la-gi/01-co-che-quy.md` | Quỹ đầu tư vận hành thế nào: góp chung, NAV và các bên |
| quy-la-gi | `quy-la-gi/02-khung-phap-ly.mdx` | `dau-tu-quy/02-quy-la-gi/02-khung-phap-ly.md` | Luật nói gì về quỹ và quyền của bạn |
| loai-quy | `loai-quy/01-quy-mo-dong-etf.mdx` | `dau-tu-quy/03-loai-quy/01-quy-mo-dong-etf.md` | Quỹ mở, quỹ đóng, ETF và quỹ thành viên |
| loai-quy | `loai-quy/02-quy-theo-tai-san.mdx` | `dau-tu-quy/03-loai-quy/02-quy-theo-tai-san.md` | Quỹ cổ phiếu, trái phiếu, cân bằng, tiền tệ; chủ động hay chỉ số |
| chi-phi-tai-lieu | `chi-phi-tai-lieu/01-phi-va-thue.mdx` | `dau-tu-quy/04-chi-phi-tai-lieu/01-phi-va-thue.md` | Phí và thuế: những khoản lặng lẽ ăn vào lợi nhuận |
| chi-phi-tai-lieu | `chi-phi-tai-lieu/02-doc-tai-lieu-quy.mdx` | `dau-tu-quy/04-chi-phi-tai-lieu/02-doc-tai-lieu-quy.md` | Đọc bản cáo bạch và báo cáo quỹ |
| danh-gia-quy | `danh-gia-quy/01-chi-so-danh-gia.mdx` | `dau-tu-quy/05-danh-gia-quy/01-chi-so-danh-gia.md` | Đo một quỹ: lợi nhuận, rủi ro và độ bám chỉ số |
| danh-gia-quy | `danh-gia-quy/02-chu-dong-thu-dong-chon-quy.mdx` | `dau-tu-quy/05-danh-gia-quy/02-chu-dong-thu-dong-chon-quy.md` | Chủ động hay thụ động, và quy trình chọn quỹ |
| chien-luoc | `chien-luoc/01-dau-tu-dinh-ky-tai-can-bang.mdx` | `dau-tu-quy/06-chien-luoc/01-dau-tu-dinh-ky-tai-can-bang.md` | Đầu tư định kỳ, một lần hay tái cân bằng |
| chien-luoc | `chien-luoc/02-sai-lam-hanh-vi.mdx` | `dau-tu-quy/06-chien-luoc/02-sai-lam-hanh-vi.md` | Kẻ thù lớn nhất là chính mình: sai lầm hành vi |
| an-toan-nguon-hoc | `an-toan-nguon-hoc/01-nhan-dien-lua-dao.mdx` | `dau-tu-quy/07-an-toan-nguon-hoc/01-nhan-dien-lua-dao.md` | Nhận diện "quỹ" lừa đảo và cách tra cứu |
| an-toan-nguon-hoc | `an-toan-nguon-hoc/02-hoc-o-dau.mdx` | `dau-tu-quy/07-an-toan-nguon-hoc/02-hoc-o-dau.md` | Học tiếp ở đâu: lộ trình, nguồn chính thức và sách |

MDX nằm dưới `src/content/lessons/dau-tu-quy/`; snapshot dưới `content-sources/`.

## Frontmatter MDX

```yaml
---
domain: "dau-tu-quy"
module: "<module>"
order: <1|2>
title: "<tiêu đề — trùng H1>"
summary: "<1–2 câu, ≤200 ký tự>"
source:
  name: "OmniLab — Kiến thức quỹ và đầu tư"
  author: "OmniLab (tổng hợp từ nguồn công khai)"
  license: "Nội dung tự biên soạn của OmniLab"
  snapshot: "dau-tu-quy/<NN-module>/<NN-slug>.md"
examplesReviewed: false
---
```

Snapshot `.md` có frontmatter riêng (`nguon`, `tac-gia`, `ngay-viet: 2026-10-13`, `trang-thai: hoan-thanh`) như mẫu `nghe-tai-chinh`. Thân snapshot = thân MDX trừ import, `<Disclaimer />`, `<RealLife>`, `<Figure added>`. Văn bản chính phải giống từng chữ — chạy `pnpm verify:fidelity` để kiểm.

## Giọng văn — DỄ HIỂU là yêu cầu số 1 (user nhấn mạnh)

- Câu ngắn (thường ≤25 chữ). Một đoạn một ý. Không văn phong luật/học thuật.
- Mọi thuật ngữ giải thích bằng lời thường **ngay lần đầu**, kèm tên tiếng Anh trong ngoặc nếu hay gặp. Ví dụ: "giá trị tài sản ròng (NAV) — hiểu đơn giản là giá trị một phần của quỹ sau khi trừ nợ".
- Mỗi khái niệm chính có **ví dụ minh hoạ**: tình huống đời thường VN hoặc phép tính với "số giả định". Ưu tiên ví dụ có con số cụ thể, tính ra kết quả.
- Mỗi bài có:
  1. Mở đầu bằng câu chuyện ngắn của nhân vật.
  2. Các mục nội dung (H2), xen ví dụ, bảng khi so sánh.
  3. Khối `> **Mẹo:** ...` (1–2 cái).
  4. Mục `## Tóm tắt nhanh` (4–6 gạch đầu dòng).
  5. Mục `## Thuật ngữ trong bài` (bảng 2 cột: Thuật ngữ | Nghĩa dễ hiểu, 4–8 dòng).
  6. Mục `## Đọc thêm` (chỉ khi có nguồn/sách đã xác minh; ghi *Vì sao nên đọc* và *Giúp được gì*).
  7. Mục `## Nguồn` (danh sách link đã xác minh trong báo cáo research).
- Độ dài thân bài: khoảng 1.200–1.800 chữ.
- **Nhân vật hư cấu:** Minh (28 tuổi, kỹ sư phần mềm ở TP.HCM, lần đầu đầu tư) và chị Thu (bạn của gia đình Minh, nhiều năm làm phân tích đầu tư). Bài `nen-tang/01` giới thiệu họ và ghi rõ "nhân vật hư cấu". Các bài khác dùng tiếp, không giới thiệu lại dài.

## Quy tắc nguồn (user: "không phán đoán, phải có cơ sở")

- CHỈ dùng khẳng định nằm trong bảng kiểm chứng của báo cáo research với mức tin cậy Cao/Trung bình hoặc A/B. Mọi mục "Chưa xác minh" → KHÔNG đưa vào bài, kể cả diễn đạt mềm.
- Số liệu thực (CPI, nghiên cứu, điều luật) phải ghi kỳ/ngày và nguồn trong câu hoặc ngay sau. Ví dụ tính toán ghi "số giả định".
- Văn bản pháp luật: ghi số hiệu + điều/khoản; nêu văn bản sửa đổi còn hiệu lực (Luật CK 54/2019/QH14 sửa bởi 56/2024/QH15; TT 98/2020/TT-BTC sửa bởi TT 136/2025/TT-BTC) và khuyên đọc văn bản hợp nhất; ghi "tính đến tháng 10/2026".
- Bằng chứng Mỹ: ghi rõ "thị trường Mỹ" + kỳ dữ liệu; không suy ra cho VN.
- Không nêu tên quỹ, công ty quản lý quỹ, app, ngân hàng cụ thể. Không lời khuyên "nên mua X". Có thể nêu tên chỉ số do sở giao dịch công bố (VN30) và tên cơ quan nhà nước.
- Phí trần: biểu giá TT 102/2021/TT-BTC ĐÃ BỊ BÃI BỎ từ 02/08/2025 (khoản 16 Điều 1 TT 42/2025/TT-BTC) — chỉ được nhắc như biểu giá cũ. Hiện hành: mức phí mua bán tối đa ghi trong Điều lệ và bản cáo bạch từng quỹ (TT 136/2025 Điều 16, 21). Bảo hiểm tiền gửi: Luật 111/2025/QH15 (thay Luật 06/2012/QH13 từ 01/05/2026).
- Thuế (từ 01/07/2026): căn cứ Luật Thuế TNCN 109/2025/QH15 và NĐ 253/2026/NĐ-CP (KHÔNG dẫn TT 111/2013). Chi tiết và các điểm chưa xác minh (mua lại CCQ có là "chuyển nhượng" không; ETF thứ cấp có được miễn 2 năm không) xem research-04 — các điểm đó viết dưới dạng "chưa có hướng dẫn rõ, hỏi công ty quản lý quỹ/cơ quan thuế", không khẳng định.
- Khi hai báo cáo research lệch nhau, theo báo cáo có nguồn mức cao hơn (A > B); nếu vẫn không rõ thì bỏ.

## RealLife + SVG

- 1–3 `<RealLife title="...">` mỗi bài, ≤90 tiếng, kết bằng "→ ...", bối cảnh VN, không trùng ví dụ trong thân bài.
- 1–2 SVG mỗi bài trong `src/assets/illustrations/dau-tu-quy/<module>-<slug>-<ten-hinh>.svg`, theo đúng checklist của `docs/illustration-style-guide.md` (màu qua CSS var, không hex, <15KB, `<title>` + `role="img"` + `aria-labelledby` với id duy nhất toàn site, ≤ ~8 nhãn chữ). Import `?raw`, `<Figure added svg={...} alt=... caption=... />`, 4 cấp `../../../../`.
- Mỗi SVG giải thích một cơ chế (luồng tiền, so sánh), không trang trí. Nhãn chữ tiếng Việt có dấu.

## Kiểm tra trước khi báo xong

- `pnpm verify:fidelity` in OK (nếu writer khác chưa xong bài của họ mà làm fail, ghi rõ trong báo cáo, chỉ cần không có lỗi ở file của bạn).
- `pnpm check` không có lỗi ở file của bạn.
- Mở thử SVG trong trình duyệt hoặc kiểm tra XML hợp lệ.
- `examplesReviewed: false`.
- Chỉ tạo/sửa file thuộc phạm vi được giao.
