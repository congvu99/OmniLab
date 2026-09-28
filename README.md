# OmniLab

App học tập đa lĩnh vực, giao diện kiểu ứng dụng iPhone (ưu tiên mobile, có bản desktop). Nội dung gốc được giữ nguyên, bổ sung ví dụ đời sống và minh hoạ SVG để dễ hiểu hơn.

v1 có 2 lĩnh vực:

| Lĩnh vực | Số bài | Nguồn |
|---|---|---|
| Kiến trúc hệ thống | 27 | Bản dịch tiếng Việt của [The System Design Primer](https://github.com/donnemartin/system-design-primer) |
| Tài chính cá nhân | 23 | Lộ trình nền tảng tài chính 12 tuần (sổ tay thực hành) |

Tổng cộng 167 khối "Ví dụ đời sống", 78 minh hoạ SVG mới, 44 ảnh gốc.

## Tính năng

- Tab bar 4 mục: Học tiếp · Lĩnh vực · Tìm kiếm · Đã lưu; chuyển trang trượt kiểu iOS (tắt khi bật reduced motion).
- Cài lên màn hình chính iPhone (manifest standalone). **Không** hỗ trợ đọc offline ở v1.
- Tiến độ học, đánh dấu hoàn thành, bookmark, "Học tiếp" đúng vị trí cuộn — lưu trong `localStorage` của máy.
- Tìm kiếm toàn văn tiếng Việt, gõ có dấu hay không dấu đều được ("bo nho dem" = "bộ nhớ đệm").
- Dark mode theo hệ thống.

## Chạy local

Yêu cầu: Node 24, pnpm 9.

```bash
pnpm install
pnpm dev          # dev server
pnpm test         # unit tests (vitest)
pnpm check        # astro check (type + schema)
pnpm build        # verify-fidelity rồi astro build ra dist/
pnpm preview      # xem bản build
```

`pnpm build` dừng lại nếu nội dung gốc của bất kỳ bài nào bị sửa (xem [scripts/verify-fidelity.mjs](scripts/verify-fidelity.mjs)).

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [docs/project-overview-pdr.md](docs/project-overview-pdr.md) | Mục tiêu, phạm vi, yêu cầu, quyết định |
| [docs/system-architecture.md](docs/system-architecture.md) | Kiến trúc build, nội dung, client state, tìm kiếm, CSP |
| [docs/codebase-summary.md](docs/codebase-summary.md) | Bản đồ thư mục và module |
| [docs/code-standards.md](docs/code-standards.md) | Quy ước code và nội dung |
| [docs/content-authoring-guide.md](docs/content-authoring-guide.md) | Cách viết ví dụ đời sống, thêm bài, thêm lĩnh vực |
| [docs/illustration-style-guide.md](docs/illustration-style-guide.md) | Quy chuẩn vẽ SVG |
| [docs/cover-image-prompt.md](docs/cover-image-prompt.md) | Prompt mẫu để tự tạo ảnh bìa |
| [docs/deployment-guide.md](docs/deployment-guide.md) | Deploy bằng Railpack, env, smoke test |
| [docs/project-roadmap.md](docs/project-roadmap.md) | Việc đã xong và hướng v2 |

## Deploy

Site tĩnh (`dist/`), Railpack tự nhận Astro và phục vụ bằng Caddy theo [Caddyfile](Caddyfile). Chi tiết và checklist kiểm tra sau deploy: [docs/deployment-guide.md](docs/deployment-guide.md).

## Bản quyền và ghi công

- Nội dung Kiến trúc hệ thống: The System Design Primer — Donne Martin và cộng đồng, giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Ảnh gốc giữ nguyên chú thích nguồn.
- Nội dung Tài chính cá nhân: giấy phép chưa xác định (chờ chủ sở hữu xác nhận).
- Nội dung chỉ nhằm mục đích học tập, không phải tư vấn tài chính hay đầu tư.
