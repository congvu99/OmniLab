# Kiến trúc hệ thống — OmniLab v1

OmniLab là app học tập tĩnh (Astro 7) chạy hoàn toàn trong trình duyệt. Không server, không database—toàn bộ dữ liệu người dùng lưu trong localStorage.

## Kiến trúc tổng quan

```
┌───────────────────────────────────────────────────────────┐
│ Trình duyệt người dùng (iOS Safari, Chrome, Firefox)      │
├───────────────────────────────────────────────────────────┤
│ • Trang HTML tĩnh (Astro build) + island tương tác       │
│ • Storage: localStorage (omnilab:v1:state) + fallback     │
│ • Tìm kiếm: MiniSearch lazy-load trên /tim-kiem          │
│ • Giao diện: CSS token + prefers-color-scheme             │
└───────────────────────────────────────────────────────────┘
         ↓ HTTPS (Railpack TLS) ↓
┌───────────────────────────────────────────────────────────┐
│ Vibe Deploy + Caddy (phục vụ file tĩnh)                   │
├───────────────────────────────────────────────────────────┤
│ • dist/ (output Astro build)                              │
│ • Cache: /_astro/* immutable, còn lại no-cache            │
│ • CSP: script-src 'self', style-src 'unsafe-inline'       │
│ • Không SPA fallback (404 thật)                           │
└───────────────────────────────────────────────────────────┘
         ↓ Git push ↓
┌───────────────────────────────────────────────────────────┐
│ Repo GitHub/GitLab (user quản lý)                         │
├───────────────────────────────────────────────────────────┤
│ • Mã nguồn (src/), nội dung (src/content/lessons/)        │
│ • Docs (./docs/), config build (astro.config.mjs)         │
└───────────────────────────────────────────────────────────┘
```

## Quy trình nội dung

**Tạo bài**: Markdown + MDX (JSX components), đặt trong `src/content/lessons/{domain}/{module}/` với metadata frontmatter (domain, module, order, title, summary, examplesReviewed).

**Build-time** (`pnpm build`):
1. `verify:fidelity` — Đảm bảo nội dung gốc (trước `<RealLife>` đầu tiên) không thay đổi
2. Astro MDX plugin — Parse JSX components (`<RealLife>`, `<Figure added>`, `<Disclaimer>`)
3. remark plugin — Tính `readingMinutes` (tự động)
4. Shiki — Syntax highlight (light inline, dark via CSS vars)
5. Render → HTML tĩnh

**Output** (`dist/`):
- 58+ trang HTML (v1: 50 bài), mỗi bài → `/hoc/{domain}/{module}/{slug}/index.html`
- `search-index.json` (45KB gzip, MiniSearch)
- `lessons-index.json` (2.2KB gzip, metadata API)
- Tất cả script ngoài file (`/_astro/*.js`, không inline)

## Mô hình dữ liệu nội dung

**Domain** (YAML): `kien-truc` (27 bài), `tai-chinh` (23 bài). Mỗi domain có modules + metadata màu accent.

**Lesson ID** (bất biến): `{domain}/{module}/{slug}` — dùng làm khóa localStorage + lịch sử.

**Nội dung RealLife** (≤90 từ): Ví dụ Việt Nam (quán phở, ngân hàng, v.v.), kết thúc bằng "→..." (liên kết ẩn dụ).

**Verify-fidelity**: Loại bỏ `<RealLife>`, `<Figure added>`, `<Disclaimer>` → so sánh snapshot có giữ nguyên nội dung gốc.

## Client state

**localStorage** (`omnilab:v1:state`, JSON):
```json
{
  "v": 1,
  "lessons": { "domain/module/slug": { "done": boolean, "doneAt": timestamp, "scroll": 0..1, "visitedAt": timestamp } },
  "bookmarks": ["domain/module/slug", ...]
}
```

**Fallback**: Nếu localStorage throw (Safari private mode) → lưu in-memory (không persist). Hiển thị cảnh báo.

**Store** (`progress-store.ts`): Factory injectable (testable), singleton được gọi bởi mọi island. Phương thức: `markDone()`, `visit()`, `saveScroll()`, `toggleBookmark()`, `lastUnfinished()`, `subscribe()`, `isPersistent`.

## Tìm kiếm (MiniSearch)

**Tại sao MiniSearch** (không Pagefind): Phase 5 spike, Pagefind failed query "bo nho dem" (cache vắng top 15). MiniSearch với xử lý dấu Tiếng Việt (`Đ↔d`, `ô↔o`, NFD normalize) → `cache` ≡ `bộ nhớ đệm` ≡ `bo nho dem`.

**Build-time**: Parse MDX → plain text (loại bỏ Figure/Disclaimer, unwrap RealLife). Tạo index MiniSearch, serialize → `search-index.json`.

**Runtime**: Lazy-load trên `/tim-kiem` (first keystroke). Search real-time, highlight term, prefix + fuzzy 0.2 match. Payload 45KB gzip (0.9KB per bài).

## Styling & Dark mode

**CSS tokens** (`src/styles/tokens.css`): Biến custom (`--color-*`, `--spacing-*`, `--font-*`).

**Dark mode**: Media query `prefers-color-scheme` (không toggle UI). Shiki: light colors inline, dark trong `--shiki-dark-*` vars, apply trong `prose.css`.

## Security (CSP)

**Caddyfile** (`Content-Security-Policy`):
```
script-src 'self' (all scripts external, vite.build.assetsInlineLimit: 0, no hashes)
style-src 'self' 'unsafe-inline' (only Shiki inline styles)
default-src 'self', img-src 'self' data:, object-src 'none', frame-ancestors 'none'
```

**Threat model**: Site tĩnh, không user input, không auth/cookies, không third-party script.

## Performance

- **JS**: 6–13KB gzip/trang (budget 30KB). Home/domain/lesson: 6–7KB. Search: 13KB.
- **HTML**: 58 trang, ~150KB raw / ~40KB gzip.
- **Search index**: 170KB raw / 45KB gzip (lazy-load).
- **Fonts**: Self-hosted (@fontsource, không CDN).
- **Cache**: /_astro/* immutable, mọi đường dẫn khác no-cache (revalidate).

## Thêm domain

1. Tạo `src/content/domains/{id}.yaml` (metadata + modules)
2. Thêm folder `src/content/lessons/{id}/{module}/`
3. Viết file MDX
4. Chạy `pnpm build` — không sửa code Astro

---

Xem chi tiết: [`docs/codebase-summary.md`](./codebase-summary.md), [`docs/deployment-guide.md`](./deployment-guide.md)
