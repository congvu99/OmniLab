# OmniLab

App học tập đa lĩnh vực, giao diện kiểu ứng dụng iPhone (ưu tiên mobile, có bản desktop). Nội dung gốc được giữ nguyên, bổ sung ví dụ đời sống và minh hoạ SVG để dễ hiểu hơn.

Có 4 lĩnh vực:

| Lĩnh vực | Số bài | Nguồn |
|---|---|---|
| Kiến trúc hệ thống | 27 | Bản dịch tiếng Việt của [The System Design Primer](https://github.com/donnemartin/system-design-primer) |
| Tài chính cá nhân | 23 | Lộ trình nền tảng tài chính 12 tuần (sổ tay thực hành) |
| Nghề tài chính | 14 | OmniLab tự biên soạn: 6 nhóm kỹ năng ngoài kiến thức tài chính (dữ liệu, vĩ mô, pháp lý, hành vi, giao tiếp, phân tích ngành), mỗi nhóm một bài "hiểu nhanh" và một bài quy trình học, nguồn và sách tiếng Việt nên đọc |
| Quỹ và đầu tư | 14 | OmniLab tự biên soạn: đầu tư qua chứng chỉ quỹ cho người mới — nền tảng, cơ chế và pháp lý quỹ ở Việt Nam, các loại quỹ, phí và thuế (Luật Thuế TNCN 2025), đánh giá quỹ, chiến lược và hành vi, nhận diện lừa đảo, nguồn học |

Tổng cộng 221 khối "Ví dụ đời sống", 123 minh hoạ SVG mới, 44 ảnh gốc.

## Tính năng

- **Giao diện Studio**: Dark-first (graphite #0B0C0E), Volt signature color, hairline borders, Be Vietnam Pro + JetBrains Mono, 44px tap targets
- **Dock** (mobile <1024px): 5 tab (Học tiếp · Lĩnh vực · Tìm kiếm · Đã lưu · Tôi); motion depth push thay vì trượt iOS
- **Tab Tôi** (`/toi`): chọn giao diện sáng/tối/theo hệ thống, cỡ chữ khi đọc, giảm chuyển động (lưu trên máy, áp ngay, không nháy màu khi tải); tiến độ học; trạng thái lưu trữ, hướng dẫn cài lên màn hình chính
- **Sidebar** (desktop ≥1024px): Điều hướng, lĩnh vực, bookmark, tiến độ toàn bộ
- **Command palette** (⌘K / Ctrl+K): Tìm kiếm bài học, jump tab, với keyboard shortcut + mouse click
- **Reader** (≥1280px): Table of contents scrollspy, progress ring, mark complete (motion: ring → disc → tick + spark), bookmark, next lesson
- **Tiến độ & bookmark**: Lưu trong `localStorage` của máy (`omnilab:v1:state`, schema v2); fallback in-memory ở private mode. "Học tiếp" nhớ vị trí cuộn.
- **Tài khoản & đồng bộ** (`/toi`, mục Tài khoản): đăng ký bằng tên + mật khẩu, không cần email. Tiến độ vẫn lưu trên máy; đăng nhập thì gộp và đồng bộ giữa các thiết bị. Chưa đăng nhập, hoặc máy chủ đồng bộ tạm sập, thì học như bình thường.
- **Nghe bài học**: bài nào có bản nghe thì hiện trình phát ngay dưới tiêu đề (giọng Gemini TTS): phát/dừng, tua 15 giây, tốc độ 0,75–2x, danh sách mục, thanh nhỏ bám đáy màn hình khi cuộn đi, điều khiển ở màn hình khoá. Nút "Nghe từ mục này" ở heading `##` nhảy đúng đầu mục; nút "Nghe từ đây" ở heading `###` nhảy gần đúng. Vị trí nghe dở nhớ trên máy (`omnilab:v1:audio`), không đồng bộ qua tài khoản. Bản nghe do sidecar `tts` trên VPS tự tạo nền, nên bài mới hoặc bài vừa sửa có thể chưa có bản nghe (trình phát ẩn) hoặc đang phát bản của phiên bản trước. Bản nghe chỉ có trên VPS: Railpack không có, trình phát ẩn.
- **Tìm kiếm** (MiniSearch): Toàn văn tiếng Việt, gõ có dấu hay không dấu ("bo nho dem" = "bộ nhớ đệm"), index lazy-load
- **Dark/light theme**: Mặc định theo hệ thống, đổi thủ công ở tab Tôi
- **Installable**: PWA (manifest standalone) trên iPhone, nhưng **không** offline ở v1

## Chạy local

Yêu cầu: Node 24, pnpm 9.

```bash
pnpm install
pnpm dev          # dev server
pnpm test         # unit tests (vitest)
pnpm check        # astro check (type + schema)
pnpm build        # verify-fidelity rồi astro build ra dist/
pnpm preview      # xem bản build
pnpm check:server # type-check máy chủ đồng bộ (tsconfig.server.json)
pnpm sync:dev     # máy chủ đồng bộ local: http://127.0.0.1:3001, dữ liệu ở ./.data
pnpm tts:sample   # thử giọng Gemini TTS, ghi .wav vào ./.tts-samples (cần GEMINI_API_KEY)
pnpm tts:dev      # chạy worker tạo bản nghe local, dữ liệu ở ./.data/audio (cần pnpm build trước và GEMINI_API_KEY)
```

`pnpm tts:sample` và `pnpm tts:dev` đọc `GEMINI_API_KEY` từ `.env.local` (không vào git) hoặc biến môi trường. `.tts-samples/` bị git bỏ qua. `pnpm tts:dev` cần `dist/tts-scripts.json` do `pnpm build` tạo, và `ffmpeg` trong PATH (hoặc `FFMPEG_PATH`) để nén AAC. Thêm `--once` để xử lý hàng đợi rồi thoát; mỗi bài dài tốn nhiều request trong hạn mức free tier, nên dùng `--only <domain/module/slug>` khi thử.

`pnpm build` dừng lại nếu nội dung gốc của bất kỳ bài nào bị sửa (xem [scripts/verify-fidelity.mjs](scripts/verify-fidelity.mjs)).

`pnpm dev` và `pnpm preview` không proxy `/api`, nên đăng nhập và đồng bộ không chạy được trong các lệnh này. Muốn thử đầy đủ: chạy `pnpm sync:dev` rồi tự proxy `/api` về cổng 3001, hoặc dùng VPS.

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [docs/design-guidelines.md](docs/design-guidelines.md) | **Studio design system**: token màu/typography/motion, icon API, command palette, layout, a11y |
| [docs/project-overview-pdr.md](docs/project-overview-pdr.md) | Mục tiêu, phạm vi, yêu cầu, quyết định |
| [docs/codebase-summary.md](docs/codebase-summary.md) | Bản đồ thư mục, kiến trúc, nội dung, tìm kiếm |
| [docs/code-standards.md](docs/code-standards.md) | Quy ước code, TypeScript, Astro, testing, git |
| [docs/system-architecture.md](docs/system-architecture.md) | Build pipeline, localStorage, máy chủ đồng bộ (API, merge, bảo mật), bản nghe bài học (sidecar tts), CSP |
| [docs/content-authoring-guide.md](docs/content-authoring-guide.md) | MDX lesson, RealLife, Figure, thêm lĩnh vực |
| [docs/illustration-style-guide.md](docs/illustration-style-guide.md) | SVG monoline style, grid, colors |
| [docs/deployment-vps-guide.html](docs/deployment-vps-guide.html) | **Deploy chính**: VPS Docker Compose, máy chủ đồng bộ, backup, restore |
| [docs/deployment-guide.md](docs/deployment-guide.md) | Railpack + Caddy (phương án cũ), env, smoke test |
| [docs/project-roadmap.md](docs/project-roadmap.md) | v1 trạng thái (Studio restyle), ứng viên v2 |

## Deploy

**Production: VPS, Docker Compose.** Site tĩnh chạy bằng Caddy trong image, kèm máy chủ đồng bộ (`server/sync/`, Node 24 + `node:sqlite`) trên mạng Docker riêng, không mở cổng ra ngoài. Thêm sidecar `tts` (`server/tts/`, Node 24 + ffmpeg) tạo bản nghe bài học bằng Gemini TTS free tier, chỉ có đường ra Internet, tuỳ chọn: thiếu `GEMINI_API_KEY` thì site vẫn chạy và trình phát ẩn. Từng bước, checklist, backup và vận hành bản nghe: [docs/deployment-vps-guide.html](docs/deployment-vps-guide.html).

**Railpack / Vibe Deploy Nhân Hòa: phương án cũ.** Chỉ phục vụ site tĩnh theo [Caddyfile](Caddyfile). Không chạy được máy chủ đồng bộ: `/api/*` trả 503 JSON, trang Tôi báo "Chưa kết nối được máy chủ đồng bộ", tiến độ trên máy vẫn dùng bình thường. Cũng không có bản nghe: `/audio/manifest.json` trả 404, trình phát ẩn. Chi tiết: [docs/deployment-guide.md](docs/deployment-guide.md).

## Bản quyền và ghi công

- Nội dung Kiến trúc hệ thống: The System Design Primer — Donne Martin và cộng đồng, giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Ảnh gốc giữ nguyên chú thích nguồn.
- Nội dung Tài chính cá nhân: giấy phép chưa xác định (chờ chủ sở hữu xác nhận).
- Nội dung Quỹ và đầu tư: OmniLab tự biên soạn từ nguồn công khai (văn bản pháp luật Việt Nam qua Công báo, SEC, FINRA, nghiên cứu gốc của Vanguard, Morningstar, Barber & Odean...), mỗi bài ghi nguồn ở cuối; nghiên cứu 2 vòng và fact-check độc lập 2026-10-13 (báo cáo trong `plans/261013-fund-investing-domain/reports/`). Văn bản pháp luật và thuế ghi "tính đến tháng 10/2026".
- Nội dung Nghề tài chính: OmniLab tự biên soạn từ nguồn công khai (CFA Institute, WEF, ACCA, IMF, văn bản pháp luật Việt Nam), mỗi bài ghi nguồn ở cuối; đã qua fact-check độc lập 2026-10-01 (3 báo cáo trong `plans/261001-finance-expert-skills-domain/reports/`).
- Nội dung chỉ nhằm mục đích học tập, không phải tư vấn tài chính hay đầu tư.
