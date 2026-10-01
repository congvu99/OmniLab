# Tổng quan dự án & PDR (Product Development Requirements) — OmniLab v1

**Tháng 09/2026**: App học tập Astro 7 (static) cho hệ thống thiết kế + tài chính cá nhân Việt Nam. 50 bài (27 kiến-trúc + 23 tài-chính), progress tracking, tìm kiếm, iOS standalone. Mục tiêu: Lighthouse ≥95 (xem QA report).

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

## Quyết định (Khóa — không đảo ngược)

| Quyết định | Lý do | Khóa |
|-----------|-------|------|
| Static output (no server) | Railpack simple, no DB, no cost scale | Yes |
| MiniSearch not Pagefind | Pagefind failed "bo nho dem" (cache vắng top 15) | Yes (phase 5 spike) |
| Offline not v1 | Complexity, v2 candidate (service worker + IndexedDB) | Yes |
| Dark: system preference | No toggle UI, respects OS setting | Yes |
| SVG inline `?raw` | CSS vars resolve in inline only | Yes |
| AI fact-check, no manual | Quality đủ, re-run nếu issue | Yes (2026-09-28) |

## Deploy

**Nền tảng**: Vibe Deploy Nhân Hòa (Railpack + Caddy). User setup domain/TLS/git remote (xem [`docs/deployment-guide.md`](./deployment-guide.md)).

**Env var** (dashboard Vibe Deploy):
- `SITE_URL=https://domain` (sitemap, canonical URL)

**Caddyfile** (repo):
- Cache: `/_astro/*` immutable, mọi đường dẫn khác no-cache
- CSP: `script-src 'self'`, `style-src 'unsafe-inline'`
- No SPA fallback (404 thật)

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
| v2 roadmap priority? | Offline likely first, sau đó multi-device sync |

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
