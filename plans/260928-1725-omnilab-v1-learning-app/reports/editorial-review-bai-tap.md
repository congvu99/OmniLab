# Editorial review: kien-truc/bai-tap (8 bài)

Ngày: 2026-09-29. Phạm vi: nội dung gốc + TranslatorNote của `src/content/lessons/kien-truc/bai-tap/01..08`. Bỏ qua `<RealLife>` và `<Figure added>`, vì hai phần này fact-check riêng.

## Cách làm
- Đối chiếu từng bài với README tiếng Anh gốc (`D:\HardSkills\system-design-primer\solutions\system_design\*`) và các file `.py`.
- Tính lại mọi phép ước lượng nhanh: pastebin, scaling-aws, twitter, web-crawler, mint, sales-rank, social-graph, query-cache đều khớp bản gốc, không có lỗi số học.
- Kiểm tra link ngoài bằng curl -L. Chỉ có `dmoz.org` chết (NXDOMAIN), và ghi chú của người dịch ở web-crawler đã nêu nên không ghi lại. Stack Overflow trả 403 là do chặn bot, link vẫn còn.
- Link nội bộ `/hoc/...`: tất cả 26 đích đều tồn tại.
- So md5 của 20 ảnh legacy với ảnh upstream: khớp hết. Đã xem 6 ảnh scaling_aws: alt khớp nội dung ảnh.
- Code fence: số dấu mở/đóng chẵn ở mọi file. Không thấy ký tự escape thừa.
- Lỗi code mà TranslatorNote đã nêu thì không ghi lại.

## Kết quả (đã thêm ReviewNote ở cuối file, chỉ append)
| Bài | Số mục | Tóm tắt |
|---|---|---|
| 01-pastebin | 2 | JSON phản hồi thiếu dấu phẩy, lệch "Hello World!"; link `pastebin.py` tương đối bị 404 |
| 02-scaling-aws | 1 | TN nói Redis đổi giấy phép 2024 nhưng thiếu việc Redis 8 (05/2025) thêm lại AGPLv3 |
| 03-twitter | 2 | Cấp heading không hạ một cấp như 6 bài kia (mục lục khác, h4 nằm ngay dưới h2); JSON home timeline không hợp lệ |
| 04-web-crawler | 6 | Cấp heading như twitter; 3 link `.py` tương đối bị 404 (2 link trong phần thân); `sort \| unique` sai lệnh; `Robots.txt` phải viết thường và chuẩn không quy định tần suất (RFC 9309); diễn đạt connection pooling "giảm bộ nhớ" không đúng; JSON không hợp lệ |
| 05-mint | 4 | Dấu phân cách số kiểu Anh (50,000 / 2,000 / 2.5 triệu); `calc_current_year_month()` thiếu `self.`; "bảng `TABLE budget_overrides`"; link `.py` bị 404 |
| 06-sales-rank | 3 | Dấu phân cách số kiểu Anh (1.44 TB / 40,000 / 2.5 triệu / 100,000); JSON không hợp lệ; link `.py` bị 404 |
| 07-social-graph | 1 | Link `.py` tương đối bị 404 |
| 08-query-cache | 2 | Link `.py` tương đối bị 404; cập nhật giấy phép Redis 8 |

Link `../../solutions/...` tương đối: có 8 link trên 7 file, được xuất nguyên văn ra HTML và không có trang đích. Đã kiểm tra URL GitHub thay thế: cả 7 file đều trả HTTP 200.

## Kiểm tra
- `pnpm verify:fidelity`: OK (27 kien-truc + 23 tai-chinh).
- `git diff`: 8 file, chỉ có dòng thêm (+), không có dòng xóa (-).
- Đã compile từng khối ReviewNote bằng `@mdx-js/mdx` 3.1.1: cả 8 khối đều compile được.
- Không chạy build/check, không commit.

## Câu hỏi chưa giải quyết
- Ở twitter/web-crawler, heading h2 cho mục lục chi tiết hơn các bài khác. Cần chủ sở hữu nội dung chọn chuẩn chung trước khi sửa: hạ cấp heading ở 2 bài này, hay nâng cấp ở 6 bài còn lại.
