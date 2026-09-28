# Tóm tắt Codebase — OmniLab v1

**Dự án**: App học tập Astro 7 (static output) + MDX | **Trạng thái**: v1 hoàn tất | **Cập nhật**: 2026-09-28

## Sự kiện chính

| Khía cạnh | Chi tiết |
|-----------|---------|
| **Framework** | Astro 7 (static) + MDX, vanilla TypeScript (islands) |
| **Deploy** | Railpack + Caddy (Vibe Deploy Nhân Hòa) |
| **Nội dung** | Domain YAML + lesson MDX, ID = `domain/module/slug` |
| **Lưu trữ** | localStorage (`omnilab:v1:state`) + fallback in-memory |
| **Tìm kiếm** | MiniSearch v7.2.0, xử lý dấu Tiếng Việt |
| **SVG** | 78 tệp minh họa (kien-truc/)
| **Lưu ý v1** | Offline không hỗ trợ; progress = localStorage (private mode = in-memory, không persist) |

## Cấu trúc thư mục

```
src/
├── assets/illustrations/           # 78 SVG
├── components/
│   ├── islands/: BookmarkButton, ProgressRing (client JS)
│   ├── lesson/: RealLife, Figure, Disclaimer
│   └── shell/, domain/
├── content/
│   ├── domains/: kien-truc.yaml, tai-chinh.yaml
│   └── lessons/: MDX by domain/module/slug
├── lib/: progress-store.ts, search-index.ts, lesson-id.ts
├── pages/: routes (home, domains, hoc/*, search, saved, 404)
└── styles/: tokens.css, prose.css
```

## Mô hình nội dung

**Domains** (YAML):
- `kien-truc`: 27 bài, 4 modules, CC BY 4.0
- `tai-chinh`: 23 bài, 1 module (12 tuần), license pending

**Lessons** (MDX):
- Path: `src/content/lessons/{domain}/{module}/{NN-slug}.mdx`
- Lesson ID (bất biến): `{domain}/{module}/{slug}`
- URL: `/hoc/{domain}/{module}/{slug}`
- Frontmatter: domain, module, order, title, summary, source (snapshot), examplesReviewed (false→true by fact-check agent)
- 167 khối RealLife (≤ 90 tiếng = âm tiết, bài ngắn 1-2 khối)

**Verify-fidelity**: Gate trong `pnpm build`, loại bỏ `<RealLife>`, `<Figure added>`, `<Disclaimer>` → so sánh snapshot giữ nguyên nội dung gốc.

## Client state

**localStorage key**: `omnilab:v1:state` (v:1, lessons{}, bookmarks[]).  
**Fallback**: Private mode (localStorage throws) → in-memory (không persist).  
**Store**: `createProgressStore(options)` injectable (testable).

## Search — Tại sao MiniSearch

**Phase 5 spike**: Pagefind fail query "bo nho dem" (cache vắng top 15).  
**MiniSearch**: Diacritic folding (Đ↔d, ô↔o) → cache/bộ nhớ đệm/bo nho dem identical.  
**Index**: 45KB gzip, lazy-load keystroke đầu (không load page).

## Build & Astro config

- `output: 'static'`, Unified processor (remark-reading-time, smartypants off)
- Shiki dual theme (light inline, dark `--shiki-dark-*` vars)
- Vite `assetsInlineLimit: 0` (all scripts external, CSP `script-src 'self'` no hashes)

**Caddyfile** (Railpack):
- Cache: `/_astro/*` immutable, HTML no-cache
- CSP: `script-src 'self'`, `style-src 'unsafe-inline'` (Shiki chỉ)
- Không SPA fallback (404 thực)

## Testing & Quality

- 174 tests (Vitest, no jsdom, injectable deps)
- TypeScript: astro check (0 errors)
- build: verify:fidelity + astro build
- Lighthouse mục tiêu ≥95 (xem phase-07-qa-report)

## Tấm ghi chú

1. Thêm domain: `src/content/domains/{id}.yaml` + folder → không sửa code.
2. Islands re-init: Lắng nghe `astro:page-load` (soft nav).
3. SVG trong Figure: Import `?raw` (inline, CSS vars resolve).
4. Offline v2 candidate: Service worker + IndexedDB (không v1).
