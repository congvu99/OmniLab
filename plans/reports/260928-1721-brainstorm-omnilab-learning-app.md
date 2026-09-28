---
type: brainstorm-report
date: 2026-09-28
status: approved
project: OmniLab
modes: []
sources:
  - D:\HardSkills\system-design-primer\hoc-tap-vi (28 md, ~70.5k từ, CC BY 4.0)
  - D:\documents\bot\reports\deploy\index.html (Lộ trình tài chính 12 tuần, ~7.5k từ, không ảnh)
---

# Brainstorm: OmniLab — app học tập đa lĩnh vực (v1: Kiến trúc + Tài chính)

## 1. Tóm tắt

App đọc/học **Astro tĩnh**, UI phong cách **iOS app** (ưu tiên iPhone, web desktop thứ yếu), content model **domain-agnostic** (thêm lĩnh vực = 1 YAML + 1 thư mục). Deploy **Railpack trên Vibe Deploy Nhân Hòa**, domain có sẵn. V1: 100% nội dung gốc (~28 bài Kiến trúc + ~15 bài Tài chính) + **6 bài thí điểm** có ví dụ đời sống + SVG. Ước lượng v1 **9–11 ngày công**; ~37 bài còn lại thêm ~18 ngày (vòng 2). Rủi ro chính: độ đúng của ví dụ AI (tài chính).

## 2. Yêu cầu đã chốt

| Mục | Quyết định |
|---|---|
| Output | Web app tĩnh OmniLab, cài được lên màn hình iPhone (standalone) |
| Lĩnh vực v1 | Kiến trúc hệ thống, Tài chính; kiến trúc mở cho lĩnh vực khác |
| Nội dung | Giữ nguyên gốc; ví dụ đời sống thêm trong khối riêng `<RealLife>` inline, **AI nháp → user duyệt** |
| Minh họa | SVG vẽ theo style guide thống nhất + ảnh bìa (user tự tạo bằng công cụ ngoài) |
| Nguồn | Copy 1 lần vào OmniLab; OmniLab thành source of truth |
| Tính năng | Tiến độ + đánh dấu hoàn thành + bookmark + "học tiếp"; Tìm kiếm |
| Thêm (chấp nhận sau phản biện) | Manifest standalone (không offline); Dark mode theo hệ thống (không toggle) |
| Không làm | Tuỳ chỉnh cỡ chữ, offline/service worker |
| Deploy | Railpack (Vibe Deploy Nhân Hòa), domain có sẵn |
| Thí điểm | Kiến trúc: Cache, Load balancer, CAP theorem · Tài chính: Tuần 3 (Lãi kép & lạm phát), Tuần 4 (Chi phí vay), Tuần 5 (Quỹ dự phòng & bảo hiểm) |

**Ngoài phạm vi v1:** offline, quiz/flashcard, tài khoản/đồng bộ, analytics, ví dụ+SVG cho ~37 bài còn lại, App Store.

## 3. Phương án đã đánh giá

### Stack
| Phương án | Ưu | Nhược | Kết luận |
|---|---|---|---|
| **Astro + MDX (tự dựng)** | Tĩnh, 0 JS mặc định, content collections + zod, View Transitions, Railpack auto-detect | Tự dựng UI shell | **Chọn** |
| Astro Starlight | Search/sidebar sẵn | Giao diện docs, khó ra cảm giác app | Bỏ |
| Next.js PWA | Linh hoạt nếu có backend | Nặng, thừa cho site nội dung | Bỏ |
| Expo React Native | Native thật | ~3x công sức, MDX/bài dài khó, App Store | Bỏ |
| GitBook/Notion (buy) | Gần 0 công | Không tuỳ biến SVG/ví dụ/tiến độ, không app feel | Bỏ |

### Minh họa
SVG thống nhất + ảnh bìa (chọn) · chỉ SVG (ít cảm xúc) · chỉ ảnh AI (không đồng bộ, chữ Việt lỗi, nặng) · giữ PNG gốc (tiếng Anh, lệch style).

### Ví dụ đời sống
Inline khối riêng (chọn — giữ mạch đọc, kiểm chứng được) · gom cuối bài (mất mạch) · user tự viết (chậm).

## 4. Giải pháp đề xuất

### Content model
```
src/content/domains/{kien-truc,tai-chinh}.yaml      # title, accent, icon, order
src/content/lessons/<domain>/<module>/<NN-slug>.mdx
```
```ts
lesson = { domain, module, order, title, summary, cover?,
  source: { name, author, url, license },
  examplesReviewed: boolean }          // readingMinutes tính lúc build
```
- Lesson ID ổn định = `domain/slug`, không đổi (khóa cho tiến độ, link).
- MDX components: `<RealLife>`, `<Figure>` (SVG + alt + caption), `<Note>`, `<TranslatorNote>`, `<Disclaimer>`.
- Migration: script md→mdx (sửa đường dẫn ảnh/link nội bộ); `index.html` tài chính tách ~15 bài (12 tuần + bài tập + nguồn).
- `verify-fidelity`: bỏ `<RealLife>`/`<Figure>` → normalize → so với nguồn; lệch = build fail.

### UI (từ ui-ux-pro-max, đã lọc — bỏ gợi ý font trẻ em & "avoid dark mode")
- Tab bar 4 mục: **Học tiếp · Lĩnh vực · Tìm kiếm · Đã lưu**; ≥1024px chuyển sidebar.
- Lĩnh vực: hero card màu domain → module → dòng bài có ✓, vòng %.
- Reader: top bar (back, progress đọc, bookmark), measure ~60ch, cuối bài "Hoàn thành" + "Bài tiếp".
- Large title iOS, View Transitions slide 250ms, tôn trọng `prefers-reduced-motion`.
- Tokens: Be Vietnam Pro (UI + body 17px/1.7), JetBrains Mono (code); nền `#F7F6F2`, chữ `#1C1F24`; accent Kiến trúc `#4F46E5`, Tài chính `#1F7A5A`; dark = biến thể dịu, kiểm contrast riêng. Lucide icons, radius 16/12, touch ≥44pt, safe-area.
- SVG style guide: stroke 2px bo tròn, fill nhạt, chỉ accent domain + neutral, chữ Việt là text thật, màu qua `currentColor`/CSS vars.
- Ảnh bìa: slot 1200×675 → WebP qua `astro:assets` (<120KB); fallback gradient + icon; cung cấp 1 prompt mẫu cho style đồng nhất.

### Client state
`localStorage`: `omnilab:v1:progress` = `{ [lessonId]: { done, doneAt, lastScroll } }`, `omnilab:v1:bookmarks`. Gọi `navigator.storage.persist()`. JS island mục tiêu <30KB/trang.

### Search
Pagefind (index tĩnh). Test tiếng Việt có/không dấu tuần 1; fallback MiniSearch + normalize bỏ dấu.

### Deploy (Railpack)
- Railpack auto-detect Astro khi output không phải `server`; phục vụ `dist/` bằng Caddy.
- `RAILPACK_NO_SPA=1` hoặc `Caddyfile` riêng: 404 thật, `/_astro/*` `Cache-Control: immutable`, `*.html` `no-cache`.
- Manifest + `apple-mobile-web-app-*` meta, icon 180/192/512. Cần HTTPS (xác nhận TLS do Nhân Hòa cấp).

## 5. Rủi ro

| Rủi ro | L | I | Giảm thiểu |
|---|---|---|---|
| Ví dụ AI sai (lãi suất, thuế VN) | H | H | `examplesReviewed`; chưa duyệt → badge "Nháp"; tránh số liệu thời sự hoặc ghi ngày |
| Sửa nhầm nội dung gốc | M | H | `verify-fidelity` chặn build |
| Khối lượng nội dung kéo dài | H | M | Thí điểm 6 bài → chốt template → theo lô |
| Search không dấu miss | M | M | Test sớm; fallback MiniSearch |
| iOS ITP xóa localStorage (7 ngày) | M | M | Standalone manifest + `storage.persist()`; key versioned |
| Đổi slug mất tiến độ/link | L | M | ID cố định + redirect map |
| Bản quyền ảnh bên thứ ba | M | M | Ghi nguồn CC BY 4.0 mỗi bài; ưu tiên vẽ lại SVG; giữ credit ảnh gốc |
| Nội dung tài chính bị coi là tư vấn | L | H | `<Disclaimer>` mọi bài Tài chính |
| SPOF 1 container Caddy | L | L | Tĩnh, rollback = redeploy; tuỳ chọn Cloudflare Pages dự phòng |
| Vibe Deploy Nhân Hòa khác Railpack chuẩn | M | M | Deploy thử "hello Astro" ngày 1 trước khi dựng tiếp |

## 6. Vận hành
- Build gates: `astro check`, `verify-fidelity`, link checker.
- Mục tiêu: Lighthouse mobile ≥95, LCP <2s (4G), CLS <0.1.
- Giám sát: UptimeRobot + Caddy access log. Rollback: redeploy commit trước.

## 7. Ước lượng

| Hạng mục | Ngày |
|---|---|
| Scaffold, design system, app shell, điều hướng | 2–3 |
| Migration nội dung + `verify-fidelity` | 2 |
| Tiến độ, bookmark, search | 1–1.5 |
| 6 bài thí điểm (ví dụ + ~15 SVG) + vòng duyệt | 3–4 |
| Deploy + Caddyfile + domain | 0.5 |
| **Tổng v1** | **9–11** |

Vòng 2: ~37 bài × ~0.5 ngày ≈ 18 ngày.

## 8. Tiêu chí nghiệm thu
1. iPhone: "Thêm vào màn hình chính" → mở full-screen, tab bar hoạt động.
2. Đủ ~43 bài; `verify-fidelity` pass.
3. Đánh dấu hoàn thành → % cập nhật; đóng/mở lại vẫn giữ.
4. Tìm "cache" và "bộ nhớ đệm" đều ra kết quả.
5. 6 bài thí điểm: ví dụ đã duyệt, có SVG, đẹp ở light + dark.
6. Lighthouse mobile ≥95.

## 9. Bước tiếp theo
1. `/ck:plan` với báo cáo này làm input.
2. Ngày 1: deploy thử Astro rỗng lên Vibe Deploy để xác nhận pipeline Railpack + domain + TLS.
3. Test Pagefind tiếng Việt trước khi dựng UI tìm kiếm.

## Câu hỏi chưa giải quyết
- Vibe Deploy Nhân Hòa có dùng Railpack chuẩn (hỗ trợ env `RAILPACK_*`, `Caddyfile` tùy chỉnh) không? TLS tự cấp?
- Quyền sử dụng nội dung `index.html` tài chính (tự viết hay tổng hợp từ nguồn khác cần ghi công?).
- Dùng lại 36 ảnh PNG gốc cho các bài chưa vẽ lại SVG, hay ẩn đi đến khi vẽ xong?
- Repo git remote (GitHub?) để Vibe Deploy kéo code — chưa có.
