# Tóm tắt Codebase — OmniLab v1 + Studio redesign

**Dự án**: App học tập Astro 7 (static) + MDX | **Trạng thái**: v1 Studio redesign hoàn tất | **Cập nhật**: 2026-10-12

## Sự kiện chính

| Khía cạnh | Chi tiết |
|-----------|---------|
| **Framework** | Astro 7 (static) + MDX, vanilla TypeScript (islands) |
| **Design** | Studio (dark-first, Volt signature, depth motion, command palette) |
| **Deploy** | Railpack + Caddy (Vibe Deploy Nhân Hòa) |
| **Nội dung** | 3 domain (kiến-trúc 27, tài-chính 23, nghề-tài-chính 14 bài), YAML + MDX |
| **Lưu trữ** | localStorage (`omnilab:v1:state`) + fallback in-memory |
| **Tìm kiếm** | MiniSearch + diacritic folding, index lazy-load |
| **Icon** | 32-icon custom sprite (Studio monoline), no Lucide |
| **Fonts** | Be Vietnam Pro + JetBrains Mono (@fontsource) |
| **SVG** | 97 minh họa + 44 ảnh gốc |
| **Lưu ý v1** | Offline không hỗ trợ; progress = localStorage (private mode = in-memory) |

## Cấu trúc thư mục

```
src/
├── assets/illustrations/           # 97 SVG + 44 ảnh gốc
├── components/
│   ├── icon/                       # Icon component + sprite paths (32 icon, no Lucide)
│   ├── command-palette/            # ⌘K/Ctrl+K palette (new)
│   ├── islands/                    # Interactive islands
│   │   ├── mark-complete-button    # Ring/disc/tick motion, spark, toast
│   │   ├── bookmark-button         # Bookmark toggle, sync via store
│   │   ├── learning-stats, domain-progress, up-next-list  # Home
│   │   ├── domain-page-controls    # Domain filter chips
│   │   ├── display-settings, storage-status  # /toi (Giao diện, Dữ liệu & ứng dụng; copy lưu trữ ở lib/storage-status-copy.ts, gợi ý cài chỉ iOS)
│   │   └── search-box, domain-nav, tab-bar, sidebar-nav
│   ├── lesson/                     # Lesson components (RealLife, Figure, etc.)
│   ├── shell/                      # Layout shells (app-layout, reader-layout)
│   └── domain/                     # Domain cards, headers, art
├── content/
│   ├── domains/: kien-truc.yaml, tai-chinh.yaml, nghe-tai-chinh.yaml
│   └── lessons/: MDX by domain/module/slug
├── layouts/                        # Astro layouts (app-layout, reader-layout)
├── lib/
│   ├── progress-store.ts, search-index.ts, lesson-id.ts, toc-scrollspy.ts
│   ├── command-palette-logic.ts, command-palette-controller.ts  # (new)
│   ├── user-prefs.ts, reduced-motion.ts  # prefs hiển thị (theme/cỡ chữ/chuyển động), helper reduced motion
│   └── (domain-progress, complete-check-motion, reader-toast, etc.)
├── pages/: routes (home, hoc/*, linh-vuc, tim-kiem, da-luu, toi, gioi-thieu, 404)
└── public/prefs-init.js  # pre-paint theme/prefs script (script ngoài, CSP)
└── styles/
    ├── tokens.css      # Studio color/motion/typography tokens
    ├── base.css        # Utilities (.btn, .card, .row, .kbd, etc.)
    ├── prose.css       # Lesson body + code syntax
    └── view-transitions.css  # Depth push transition
```

## Mô hình nội dung

**Domains** (YAML):
- `kien-truc`: 27 bài, 4 modules, CC BY 4.0
- `tai-chinh`: 23 bài, 1 module (12 tuần), license pending
- `nghe-tai-chinh`: 14 bài, 7 modules (tổng quan + 6 nhóm kỹ năng), OmniLab tự biên soạn; snapshot ở `content-sources/nghe-tai-chinh/`, mỗi bài tự chèn `<Disclaimer />` (domain không đặt `isFinance`)

**Lessons** (MDX):
- Path: `src/content/lessons/{domain}/{module}/{NN-slug}.mdx`
- Lesson ID (bất biến): `{domain}/{module}/{slug}`
- URL: `/hoc/{domain}/{module}/{slug}`
- Frontmatter: domain, module, order, title, summary, source (snapshot), examplesReviewed (false→true by fact-check agent)
- 196 khối RealLife (≤ 90 tiếng = âm tiết, bài ngắn 1-2 khối; `nghe-tai-chinh` 1–3 khối/bài vì câu chuyện dẫn đã mang ví dụ)

**Verify-fidelity**: Gate trong `pnpm build`, loại bỏ `<RealLife>`, `<Figure added>`, `<Disclaimer>` → so sánh snapshot giữ nguyên nội dung gốc.

## Client state

**localStorage key**: `omnilab:v1:state` (v:1, lessons{}, bookmarks[]).  
**Fallback**: Private mode (localStorage throws) → in-memory (không persist).  
**Store**: `createProgressStore(options)` injectable (testable).

## Search — Tại sao MiniSearch

**Phase 5 spike**: Pagefind fail query "bo nho dem" (cache vắng top 15).  
**MiniSearch**: Diacritic folding (Đ↔d, ô↔o) → cache/bộ nhớ đệm/bo nho dem identical.  
**Index**: ~84KB gzip, lazy-load keystroke đầu (không load page).

## Build & Astro config

- `output: 'static'`, Unified processor (remark-reading-time, smartypants off)
- Shiki dual theme (light inline, dark `--shiki-dark-*` vars) + transformer `shiki-contrast-fixes.mjs` (đưa màu token về >=4.5:1)
- Vite `assetsInlineLimit: 0` (all scripts external, CSP `script-src 'self'` no hashes)

**Caddyfile** (Railpack):
- Cache: `/_astro/*` immutable, mọi đường dẫn khác no-cache
- CSP: `script-src 'self'`, `style-src 'unsafe-inline'` (Shiki chỉ)
- Không SPA fallback (404 thực)

## Testing & Quality

- **436 tests** (Vitest, 25 test files; no jsdom, injectable deps)
  - Icon names + paths, command palette logic/controller, search controller, progress store, toc-scrollspy, lesson reader model, token contrast, etc.
- TypeScript: astro check (0 errors, schema valid)
- Contrast: 55 token pairs verified ≥4.5:1 light/dark (Studio tokens: text/text-2/text-3/volt/volt-ink/domain hues/danger/success on all surfaces)
- Build: verify:fidelity gate (content snapshot check) + astro build → dist/ (74 pages)
- Lighthouse: Target ≥95 (to be verified post-deploy)

## Tấm ghi chú

1. Thêm domain: `src/content/domains/{id}.yaml` + folder → không sửa code.
2. Islands re-init: Lắng nghe `astro:page-load` (soft nav); state-bearing islands bind every instance + sync via progress store.
3. SVG trong Figure: Import `?raw` (inline, CSS vars resolve).
4. `--ink` / `--ink-2` là hợp đồng màu cho minh hoạ SVG (>1.000 chỗ dùng trong bài học), không phải alias cũ — `tests/illustration-token-contract.test.mjs` chặn việc xoá. Component mới dùng `--text` / `--text-2`.
5. Offline v2 candidate: Service worker + IndexedDB (không v1).
