# Full restyle — design concepts (chưa implement)

Status: done — user chose concept B "Studio" (see plans/261012-studio-implementation)

## Bối cảnh
- Vòng redesign iOS (plans/261012-ios-native-redesign) bị user từ chối: "thiết kế ko thay đổi gì nhiều". User muốn làm lại TOÀN BỘ theo một phong cách mới: màu sắc, icon, typography, component, tương tác, chuyển động.
- User yêu cầu xem thiết kế TRƯỚC khi thực hiện → giai đoạn này chỉ tạo concept HTML tĩnh, không sửa src/.
- Vẫn: ưu tiên iPhone, tối ưu desktop; giữ route/dữ liệu/localStorage; 3 lĩnh vực (Kiến trúc hệ thống 27 bài, Tài chính cá nhân 23, Nghề tài chính 14); tiếng Việt có dấu đầy đủ.

## Concepts (3 hướng, user chọn 1 hoặc trộn)
| # | Tên | File |
|---|---|---|
| A | Aurora Glass | concept-a-aurora-glass/index.html |
| B | Studio Dark | concept-b-studio/index.html |
| C | Soft Bento | concept-c-soft-bento/index.html |
Trang so sánh: index.html

## Mỗi concept phải có
1. Moodboard: cảm xúc, 3 từ khoá, tham chiếu.
2. Màu: palette light + dark, accent cho 3 lĩnh vực, contrast >=4.5:1 text.
3. Typography: font (phải hỗ trợ đủ tiếng Việt, tự host được, OFL), thang cỡ.
4. Icon: bộ icon mới (khác Lucide line hiện tại), 12+ icon dùng trong app, inline SVG.
5. Component: nút, card, list row, tab bar/sidebar, ô tìm kiếm, progress, chip, khối "Ví dụ đời sống", note, toast.
6. Motion: demo chạy được — chuyển trang, nhấn nút, mở bài, hoàn thành bài, progress, reduced motion.
7. Màn hình: khung iPhone (Học tiếp, Lĩnh vực, trang lĩnh vực, đọc bài, Tìm kiếm, Đã lưu) + khung desktop 1440 (Học tiếp, đọc bài) — prototype bấm chuyển màn được.
