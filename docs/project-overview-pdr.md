# Tổng quan dự án & PDR (Product Development Requirements) — OmniLab v1

**Tháng 09/2026**: App học tập Astro 7 (static) cho hệ thống thiết kế + tài chính cá nhân Việt Nam. 50 bài (27 kiến-trúc + 23 tài-chính), progress tracking, tìm kiếm, iOS standalone. Mục tiêu: Lighthouse ≥95 (xem QA report).

**Cập nhật 2026-10-12**: thêm tài khoản (tên + mật khẩu) và đồng bộ tiến độ qua máy chủ đồng bộ (sidecar). Deploy chính chuyển sang VPS Docker Compose. Học vẫn chạy khi không đăng nhập. Chi tiết: [system-architecture.md](./system-architecture.md#máy-chủ-đồng-bộ-sync-sidecar).

## Tầm nhìn

Nền tảng học tập mã nguồn mở, bền vững, cho developer Việt. Độc lập server (Astro static), có thể thêm domain mà không sửa code, support iOS standalone.

## Yêu cầu chức năng

**1. Duyệt & học**
- Trang chủ: danh sách domain + "tiếp tục học" (bài cuối chưa xong)
- Trang domain: danh sách bài (progress ring, checkmark done)
- Bài reader: toàn màn hình, TOC, tự động lưu cuộn, "bài tiếp theo"

**2. Theo dõi tiến độ**
- Đánh dấu hoàn thành → % domain cập nhật ngay + persist localStorage
- Lưu vị trí cuộn (ratio 0..1) → resume khi quay lại
- Chế độ riêng tư (Safari): in-memory fallback (cảnh báo hiển thị)

**3. Dấu trang**
- Tap bookmark → lưu vào "Đã lưu"
- Danh sách lưu: xóa từ bookmark, hiển thị checkmark nếu hoàn thành

**4. Tìm kiếm**
- `/tim-kiem`: real-time, prefix search
- Vietnamese: `cache` ≡ `bộ nhớ đệm` ≡ `bo nho dem` (xử lý dấu MiniSearch)
- Index lazy-load (first keystroke)

**5. iOS Standalone**
- Add to home screen → fullscreen, tab bar (4 item: Home/Domains/Saved/Search)
- Safe-area inset (notch, home bar)
- Progress lưu localStorage (in-memory fallback private mode)

**6. Tài khoản & đồng bộ** (thêm 2026-10-12)
- Đăng ký / đăng nhập bằng tên + mật khẩu, không email. Mục Tài khoản ở tab Tôi (`/toi`)
- Đăng nhập → tiến độ và bookmark của máy được gộp với tài khoản (không ghi đè), đồng bộ giữa các thiết bị
- Máy đang có dữ liệu của tài khoản khác: hỏi trước khi gộp, không tự gộp
- Đăng xuất (có tuỳ chọn xoá dữ liệu trên máy), đăng xuất mọi thiết bị
- Chưa đăng nhập hoặc sidecar sập: học như cũ, UI báo "Chưa kết nối được máy chủ đồng bộ"
- Ngoài phạm vi v1: quên mật khẩu qua email, OAuth, mã mời, xuất/nhập JSON (hạ ưu tiên)

## Yêu cầu phi chức năng

| Yêu cầu | Mục tiêu | Ghi chú |
|---------|---------|---------|
| Lighthouse (mobile) | ≥95 | Xem plans/260928-1725-omnilab-v1-learning-app/reports/phase-07-qa-report.md |
| Build time | <30s | Node 24, pnpm cache |
| JS budget | ≤30KB gzip/page | Home/domain/lesson: 6–7KB, search: 13KB |
| Search index | ≤90KB gzip | ~84KB hiện tại (50 bài, text cap 6000 ký tự/bài) |
| CSP | script-src 'self' | No hashes, all scripts external |
| Nội dung gốc | 100% bất biến | `pnpm verify:fidelity` gate |
| Browser | Modern (iOS 16+, Chrome 120+) | No polyfill |
| **Offline** | **KHÔNG hỗ trợ v1** | Service worker = v2 candidate |
| Đồng bộ | Sidecar không egress, không publish cổng, RAM 192 MB; dữ liệu đồng bộ phải backup | Backup 1 lần/ngày (cron 03:15), giữ 14 ngày; cần backup ra ngoài VPS (khuyến nghị) |
| Bảo mật tài khoản | scrypt, throttle đăng nhập theo tên, cookie HttpOnly + HMAC, CSP không đổi | Chi tiết: mục "Mô hình đe doạ" trong system-architecture |

## Mô hình nội dung v1

| Domain | ID | Bài | Module | License |
|--------|----|----|--------|---------|
| Kiến trúc hệ thống | `kien-truc` | 27 | Nền tảng (6), Đánh đổi (5), Chủ đề (10), Bài tập (8) | CC BY 4.0 |
| Tài chính cá nhân | `tai-chinh` | 23 | 12 tuần (23 bài) | Chờ xác nhận |
| Nghề tài chính | `nghe-tai-chinh` | 14 | Tổng quan (2), 6 nhóm kỹ năng × 2 bài | Nội dung tự biên soạn của OmniLab |

**Quy trình**: Writer agent viết `<RealLife>` + SVG → Fact-check agent review (examplesReviewed: true). User ủy quyền 2026-09-28, tất cả 50 bài đã review ✓

**Verify-fidelity gate**: `pnpm build` kiểm snapshot (nội dung gốc từ nguồn không thay đổi).

## Tiêu chí chấp nhận

- [ ] 27 kiến-trúc + 23 tài-chính bài, tất cả examplesReviewed: true
- [ ] Mark complete → % domain cập nhật, persist qua reload
- [ ] Scroll resume hoạt động (`cache` / `bộ nhớ đệm` / `bo nho dem` tìm top-3)
- [ ] iOS standalone: fullscreen, tab bar visible
- [ ] `pnpm verify:fidelity` pass (nội dung gốc bất biến)
- [ ] Lighthouse: Xem phase-07-qa-report.md (mục tiêu ≥95)
- [ ] Domain extensibility test (YAML + 1 bài MDX → build pass, không sửa code)
- [ ] Đồng bộ: đăng ký ở máy A, đánh dấu xong + bookmark; đăng nhập ở máy B thấy ngay; B bỏ bookmark → A thấy khi quay lại tab
- [ ] Máy dùng chung: A đăng xuất, B đăng nhập → được hỏi gộp, không tự gộp
- [ ] Sidecar sập: site 200, `/api/*` 503 JSON, UI báo chưa kết nối, tiến độ local vẫn dùng
- [ ] Backup và restore đã thử trên VPS (checklist trong deployment-vps-guide.html)

## Quyết định (Khóa — không đảo ngược)

| Quyết định | Lý do | Khóa |
|-----------|-------|------|
| Static output (no server) | Railpack simple, no DB, no cost scale | Đã thay đổi 2026-10-12: site vẫn tĩnh, nhưng tài khoản/đồng bộ cần sidecar + DB trên VPS. Railpack không chạy được sidecar |
| Tài khoản bằng tên + mật khẩu, không email | Không cần dịch vụ email; dữ liệu cá nhân tối thiểu | Yes (2026-10-12) |
| Chấp nhận 409 lộ tên đã tồn tại | Đăng ký đơn giản; rủi ro dò tên được giảm bằng giới hạn đăng ký và throttle | Yes (2026-10-12) |
| Không rollback client qua mốc schema v2 | Client cũ không hiểu v2; client v2 chỉ đọc khi gặp v>2 | Yes (2026-10-12) |
| Server và client deploy cùng lúc | Header `X-Sync-User` là hợp đồng mới giữa hai phía | Yes (2026-10-12) |
| MiniSearch not Pagefind | Pagefind failed "bo nho dem" (cache vắng top 15) | Yes (phase 5 spike) |
| Offline not v1 | Complexity, v2 candidate (service worker + IndexedDB) | Yes |
| Dark: system preference | No toggle UI, respects OS setting | Yes |
| SVG inline `?raw` | CSS vars resolve in inline only | Yes |
| AI fact-check, no manual | Quality đủ, re-run nếu issue | Yes (2026-09-28) |

## Deploy

**Nền tảng chính**: VPS dùng chung với Docker Compose (xem [`docs/deployment-vps-guide.html`](./deployment-vps-guide.html)). Hai service: `app` (site tĩnh) và `sync` (đồng bộ, cần DB và backup).

**Phương án cũ**: Vibe Deploy Nhân Hòa (Railpack + Caddy), chỉ site tĩnh, không có đồng bộ (xem [`docs/deployment-guide.md`](./deployment-guide.md)).

**Env var**:
- `SITE_URL=https://domain` (sitemap, canonical URL), build time
- `SESSION_SECRET` (≥ 32 ký tự, sidecar; đổi giá trị = mọi phiên đăng nhập hết hạn)
- `OMNILAB_DATA_DIR` (tuỳ chọn, mặc định `/srv/data/omnilab`)

**Caddyfile** (repo):
- Cache: `/_astro/*` immutable, mọi đường dẫn khác no-cache
- CSP: `script-src 'self'`, `style-src 'unsafe-inline'`
- No SPA fallback (404 thật)
- `/api/*` → sidecar; sidecar không có → 503 JSON

## Nội dung License

| Nội dung | License |
|---------|---------|
| Kiến trúc hệ thống (27 bài + SVG minh hoạ) | CC BY 4.0 (Donne Martin, system-design-primer.com) |
| Tài chính cá nhân (23 bài) | **Chờ xác nhận** |
| Nghề tài chính (14 bài) | Tự biên soạn; trích dẫn nguồn công khai trong từng bài |
| App code (Astro, scripts) | TBD (MIT/Apache 2.0 likely) |

## Câu hỏi mở

| Câu hỏi | Ghi chú |
|--------|--------|
| License nội dung tài chính? | Xác nhận + document trước public launch |
| Upstream "~1m 5s" downtim figure fix? | System Design Primer nêu sai, nên "~1m 0.5s" (verify + PR?) |
| UptimeRobot monitoring? | Optional, user tự setup (ngoài repo) |
| v2 roadmap priority? | Multi-device sync đã xong (2026-10-12). Offline vẫn là ứng viên v2 đầu tiên |
| Backup ra ngoài VPS? | Chưa cấu hình. Khuyến nghị rclone, xem chương 6 deployment-vps-guide |

## Bảng điểm & thành công

| Chỉ số | Mục tiêu | Đo lường |
|--------|---------|---------|
| Build reproducibility | 100% | `pnpm build` identical output |
| Nội dung gốc | 100% unchanged | `pnpm verify:fidelity` = 0 |
| Test pass | 100% (174 tests) | `pnpm test` all pass |
| Type safety | 0 errors | `pnpm check` = 0 errors |
| Mobile Lighthouse | ≥95 | Xem phase-07-qa-report |
| JS budget | 6–13KB gzip | Per-page measurement |

---

Xem chi tiết: [`docs/system-architecture.md`](./system-architecture.md), [`docs/code-standards.md`](./code-standards.md), [`docs/codebase-summary.md`](./codebase-summary.md), [`docs/deployment-guide.md`](./deployment-guide.md)
