---
phase: 6
title: "Docs"
status: done
priority: P3
effort: "0.5d"
dependencies: [4, 5]
---

# Phase 6: Docs

## Overview
Cập nhật tài liệu cho tính năng tài khoản/đồng bộ và thay đổi vận hành (server giờ có dữ liệu người dùng). VPS Contabo là đích deploy chính.

## Related Code Files
- Modify: `README.md`
  - tính năng: tài khoản + đồng bộ; "lưu trên máy, đồng bộ khi đăng nhập";
  - đổi mục Deploy sang VPS (Docker Compose), Railpack thành phương án cũ.
- Modify: `docs/system-architecture.md`
  - sơ đồ sidecar + mạng `internal`;
  - contract API + `ErrorCode`;
  - schema v2, luật merge, owner;
  - CSP không đổi + threat model mới.
- Modify: `docs/codebase-summary.md` (`server/sync/`, module mới).
- Modify: `docs/deployment-vps-guide.html`
  - chương 0: có DB ở `/srv/data/omnilab`;
  - chương 2: `SESSION_SECRET` (`openssl rand -base64 48`), mkdir + chown 1000;
  - chương 4: kiểm `/api/health`, cổng 3000 không lộ, sync không ở mạng `web`;
  - chương 6: backup cron, restore (stop → xoá wal/shm → copy → chown → start), rclone ra ngoài, lệnh `node -e` reset mật khẩu + tăng `session_version`;
  - chương 5: nhắc người dùng đăng nhập ở domain cũ trước khi đổi domain;
  - đóng câu hỏi mở về xuất/nhập.
- Modify: `docs/deployment-guide.md`: Railpack không chạy sidecar → UI hiện `unavailable`, không dùng cho production.
- Modify: `docs/project-roadmap.md`: đồng bộ nhiều thiết bị xong; hạ ưu tiên xuất/nhập JSON.
- Modify: `docs/project-overview-pdr.md`: quyết định tài khoản tên/mk, không email, 409 lộ tên tồn tại (chấp nhận), dữ liệu cá nhân tối thiểu, không rollback client qua mốc v2.

## Implementation Steps
1. Đọc từng doc trước khi sửa; chỉ sửa phần liên quan.
2. Kiểm link, lệnh, tên file, đường dẫn khớp code thật.

## Success Criteria
- [ ] Làm theo guide VPS từ đầu trên máy sạch: chạy được sync + backup + restore.
- [ ] Không còn câu "Không có DB / không cần backup" sai sự thật.
