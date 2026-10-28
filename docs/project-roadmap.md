# Lộ trình dự án

## Nghe bài học (2026-10-28)

Trạng thái: code và test xong, chưa deploy. Bài có bản nghe hiện trình phát (card + thanh nhỏ); bản nghe do sidecar `tts` trên VPS tự tạo bằng Gemini TTS free tier. Thiết kế và ranh giới: [system-architecture.md](./system-architecture.md#bản-nghe-bài-học-sidecar-tts); vận hành: [deployment-vps-guide.html](./deployment-vps-guide.html), chương 8.

Ngoài phạm vi (đã chốt): gói trả phí Gemini, chọn giọng trong app, nghe offline, chữ chạy theo giọng, viết lại bài bằng LLM, phát tiếp khi chuyển trang (audio dừng khi điều hướng), cache theo từng đoạn khi sửa bài (sửa bài là tạo lại cả bài).

Việc còn mở:
- Hiệu chỉnh bằng khoá thật (chủ dự án chạy `pnpm tts:sample`): chốt giọng (`TTS_VOICE` hiện là giá trị tạm), cỡ đoạn, `TTS_CHARS_PER_SEC`, hạn mức thực tế mỗi ngày (RPD/RPM) của model TTS, chuỗi `quotaId` thật của 429, và việc lỗi 5xx hoặc phản hồi thiếu audio có bị tính vào hạn mức không.
- Chạy checklist VPS ([chương 8.4](./deployment-vps-guide.html#c8)): header `/audio`, ranh giới mạng, SIGTERM thật qua `docker stop`, ffmpeg và múi giờ Los Angeles trong image alpine, dung lượng ổ đĩa (cần ≥ 1 GB), `docker build` các target, rollback `tts`. Máy dev không có Docker hay ffmpeg nên các mục này chưa kiểm.
- Kiểm trên iPhone thật (Safari): bấm mục trước khi audio tải xong, giữ tốc độ sau khi tua, màn hình khoá. Chưa nghe thử AAC thật từ worker: tiếng click ở chỗ nối đoạn, độ lệch mốc `###`.
- Đợt tạo đầu: khoảng 450–500 request cho toàn bộ bài; ở 10–20 request/ngày là khoảng 23–50 ngày. Các bài lên dần, không cần thao tác.
- Nợ ngân sách JS (mở, chưa xử lý): trang bài tải 37,5 KB gzip, vượt ngân sách 30 KB trong [code-standards.md](./code-standards.md#performance). Mức nền trước tính năng này đã là 32,8 KB (lớn nhất: `search-index-client` 6,3 KB, `client` 4,3 KB, `progress-sync-singleton` 3,7 KB); trình phát thêm khoảng 4,35 KB gzip. Ngân sách giữ nguyên, chưa nâng. Hướng giảm (ý tưởng, chưa đánh giá): tách phần nền (tìm kiếm, đồng bộ) khỏi trang bài hoặc tải chậm; trình phát không tải chậm được vì khi mọi bài đều có bản nghe thì vẫn phải tải chừng đó.

## Lĩnh vực "Quỹ và đầu tư" (2026-10-13)

Trạng thái: 14 bài (7 module × 2), 26 SVG, 25 khối RealLife. Nghiên cứu 6 nhóm + fact-check độc lập 4 nhóm; báo cáo trong `plans/261013-fund-investing-domain/reports/`.

Việc còn mở:
- Văn bản pháp luật đổi nhanh trong 2026 (Luật Thuế TNCN 109/2025 + NĐ 253/2026; TT 136/2025 sửa TT 98/2020; dự thảo sửa Luật Chứng khoán dự kiến hiệu lực 2027). Rà lại các bài `quy-la-gi`, `chi-phi-tai-lieu`, `an-toan-nguon-hoc` khi có văn bản mới.
- Số liệu thời sự có ngày (CPI 9/2026, Morningstar 2026): cập nhật theo kỳ phát hành mới.


## Tài khoản và đồng bộ tiến độ (2026-10-12)

Trạng thái: code và test xong trên nhánh `feat/progress-sync`. Chưa deploy. Trước khi coi là xong cần làm checklist VPS (chương 4, 6 trong [deployment-vps-guide.html](deployment-vps-guide.html)).

| Hạng mục | Trạng thái |
|---|---|
| Schema v2 (`owner`, `bookmarkMeta`, `doneUpdatedAt`) + migrate từ v1 | Xong |
| Luật gộp thuần, giao hoán, luỹ đẳng (`mergeStates`) | Xong |
| Máy chủ đồng bộ (Node + `node:sqlite`, 5 file, không npm deps) | Xong |
| Client: đăng ký, đăng nhập, gộp, đăng xuất, panel tài khoản ở tab Tôi | Xong |
| Đồng bộ nhiều thiết bị | Xong (kiểm tay 2 trình duyệt: chưa làm đầy đủ) |
| Deploy VPS: sidecar mạng `internal`, Caddy `/api` 503 JSON, deploy có rollback | Code xong; chưa chạy trên VPS |
| Backup hằng ngày + restore | Script xong; chưa thử restore trên VPS |

Việc còn mở:
- Chạy checklist VPS: rollback lần deploy đầu, chạy backup hai lần trong một ngày (kiểm ghi đè), restore drill.
- Backup ra ngoài VPS (rclone): chưa cấu hình.
- Quên mật khẩu: chưa có, reset thủ công bằng lệnh trên server.
- Xuất/nhập JSON: hạ ưu tiên, xem ứng viên v2 số 5.

## v1 (2026-10-12): Studio redesign hoàn tất

Trạng thái: v1 code đầy đủ + Studio redesign (dark-first graphite, Volt signature, command palette ⌘K, reader scrollspy + completion motion) hoàn tất. Tests xanh, build xanh. Chờ deploy trên Vibe Deploy Nhân Hòa (xem [deployment-guide.md](deployment-guide.md)).

| Hạng mục | Kết quả |
|---|---|
| Lĩnh vực / module / bài | 4 / 20 (Kiến trúc 4, Tài chính 6, Tài chính nghề 7, Quỹ và đầu tư 7) / 78 (27 + 23 + 14 + 14) |
| Ví dụ đời sống (`<RealLife>`) | 221 khối, cả 78 bài `examplesReviewed: true` sau fact-check agent |
| Minh hoạ | 123 SVG mới (inline, theo theme; 19 cho `nghe-tai-chinh`, 26 cho `dau-tu-quy`) + 44 ảnh gốc có ghi nguồn |
| Giao diện | iOS 26 (Apple HIG): grouped background, glass material bar, radius 22/16/12, Be Vietnam Pro, 44px tap target, ≥4.5:1 contrast |
| Desktop 3 cột | >=1024px sidebar (264px) + main (68ch) | >=1280px + reader aside (296px, sticky, scroll independent); TOC scrollspy, progress, actions |
| Tiến độ, bookmark, Học tiếp | `localStorage` (`omnilab:v1:state`, payload v2 từ 2026-10-12), fallback in-memory ở private mode; islands bind + sync |
| Tìm kiếm | MiniSearch, gập dấu tiếng Việt; index ~84KB gzip, chỉ tải ở `/tim-kiem` |
| JS mỗi trang | 6–13KB gzip (ngân sách 30KB) |
| Test | 332 unit test (vitest, gồm toc-scrollspy + contrast) |

Chưa kiểm được trong môi trường dev (chủ dự án làm sau deploy): chế độ standalone trên iPhone thật, safe-area, lưu tiến độ lâu dài trên iOS, hiển thị SVG ở dark mode trên Safari.

## Ứng viên v2

| # | Hạng mục | Giá trị | Công sức | Ghi chú |
|---|---|---|---|---|
| 1 | **Font-size control** (UI + reading) | Accessibility | Thấp | Dùng `clamp()` logic + optional button. Not fake. |
| 2 | **J/K/B keyboard shortcuts** | Power users | Thấp | J=next, K=prev, B=bookmark; check before showing kbd hint |
| 3 | **Recent searches** (localStorage) | Discover patterns | Thấp–trung | Thêm key `omnilab:v1:recents` (tối 5 query) |
| 4 | **Domain shortTitle** | Better search chips | Thấp | Add optional `shortTitle` to content schema (e.g. "KTH", "TCD", "NTK") |
| 5 | Xuất/nhập tiến độ (JSON) | Sao lưu thủ công (đồng bộ đã có qua tài khoản) | Thấp | **Hạ ưu tiên** 2026-10-12. Không cần backend |
| 6 | Đọc offline (service worker) | Cao với mobile | Trung bình–cao | Cần chiến lược cache version |
| 7 | Ảnh bìa cho 50+ bài | Visual appeal | Thấp (tự tạo) | Generative via AI prompt template |
| 8 | Quiz / flashcard cuối bài | Luyện tập chủ động | Trung bình | Nội dung mới, cần fact-check |
| 9 | Dark-mode raster figures | Content fix | Thấp | Re-theme PNG diagrams (cache, etc.) |
| 10 | Analytics tôn trọng riêu tư | Metrics | Thấp | CSP `connect-src` update |

## Việc còn mở

- Xác nhận giấy phép nội dung Tài chính (hiện ghi "Chưa xác định").
- Bảng "số 9" trong bài Availability (bản gốc upstream) ghi 99,99%/tuần là "1m 5s"; giá trị đúng ≈ 1m 0,5s. Nội dung gốc bị khoá bởi fidelity gate, nếu muốn sửa thì thêm ghi chú người dịch.
- Kiểm tra trực quan SVG ở light/dark trên iPhone thật (đã soát tự động 156/156 trên Chromium).
- LCP 2,1–2,3s trên giả lập 4G chậm, cần tối ưu font/ảnh nếu muốn < 2s.
- HSTS: chưa đặt trong Caddyfile; xác nhận nền tảng Vibe Deploy có tự thêm không.
