# Tóm tắt Codebase — OmniLab v1 + Studio redesign

**Dự án**: App học tập Astro 7 (static) + MDX | **Trạng thái**: v1 Studio redesign hoàn tất | **Cập nhật**: 2026-10-12

## Sự kiện chính

| Khía cạnh | Chi tiết |
|-----------|---------|
| **Framework** | Astro 7 (static) + MDX, vanilla TypeScript (islands) |
| **Design** | Studio (dark-first, Volt signature, depth motion, command palette) |
| **Deploy** | VPS Docker Compose (app + sync + tts) là chính; Railpack + Caddy (Vibe Deploy Nhân Hòa) là phương án cũ |
| **Nội dung** | 4 domain (kiến-trúc 27, tài-chính 23, nghề-tài-chính 14, đầu-tư-quỹ 14 bài), YAML + MDX |
| **Lưu trữ** | localStorage (`omnilab:v1:state`, payload v2) + fallback in-memory; tài khoản đồng bộ qua sidecar Node + SQLite (`server/sync/`) |
| **Nghe bài** | Bản nghe Gemini TTS do sidecar `tts` tạo nền, Caddy phục vụ `/audio/*`; trình phát ẩn khi chưa có. Vị trí nghe dở: `omnilab:v1:audio` (không đồng bộ) |
| **Tìm kiếm** | MiniSearch + diacritic folding, index lazy-load |
| **Icon** | 33-icon custom sprite (Studio monoline), no Lucide |
| **Fonts** | Be Vietnam Pro + JetBrains Mono (@fontsource) |
| **SVG** | 123 minh họa + 44 ảnh gốc |
| **Lưu ý v1** | Offline không hỗ trợ; progress = localStorage (private mode = in-memory); đồng bộ chỉ khi đăng nhập và có sidecar |

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
│   │   ├── account-sync-panel      # /toi #tai-khoan: đăng ký/đăng nhập, gộp, đăng xuất (view + controller tách riêng)
│   │   ├── lesson-audio-player, lesson-audio-mini-bar  # Trình phát bản nghe: card dưới tiêu đề + thanh nhỏ bám đáy; chung một controller
│   │   └── search-box, domain-nav, tab-bar, sidebar-nav
│   ├── lesson/                     # Lesson components (RealLife, Figure, etc.)
│   ├── shell/                      # Layout shells (app-layout, reader-layout)
│   └── domain/                     # Domain cards, headers, art
├── content/
│   ├── domains/: kien-truc.yaml, tai-chinh.yaml, nghe-tai-chinh.yaml, dau-tu-quy.yaml
│   └── lessons/: MDX by domain/module/slug
├── layouts/                        # Astro layouts (app-layout, reader-layout)
├── lib/
│   ├── progress-store.ts, search-index.ts, lesson-id.ts, toc-scrollspy.ts
│   ├── command-palette-logic.ts, command-palette-controller.ts  # (new)
│   ├── user-prefs.ts, reduced-motion.ts  # prefs hiển thị (theme/cỡ chữ/chuyển động), helper reduced motion
│   ├── progress-merge.ts           # mergeStates + stateHash: thuần, dùng chung client và server
│   ├── progress-sync*.ts           # Engine đồng bộ client: engine, transfer, http, dirty, triggers, status, singleton, contract, types
│   ├── account-sync-panel-*.ts     # View model (viewOf, errorText, validateAuthForm) + controller của panel tài khoản
│   ├── speech-script-*.ts          # Build: MDX → văn bản đọc (contract, extract, text, queries); `scriptHash`. contract thuần, worker import trực tiếp
│   ├── audio-manifest.ts           # Hợp đồng `manifest.json` + tên file `.m4a`: thuần, dùng chung worker và trình duyệt
│   ├── audio-*.ts                  # Trình phát: logic thuần, controller, binding DOM, lưu vị trí (`omnilab:v1:audio`), tải manifest
│   └── (domain-progress, complete-check-motion, reader-toast, etc.)
├── pages/: routes (home, hoc/*, linh-vuc, tim-kiem, da-luu, toi, gioi-thieu, 404) + `tts-scripts.json` (văn bản đọc cho worker, không dùng ở client)
└── public/prefs-init.js  # pre-paint theme/prefs script (script ngoài, CSP)
└── styles/
    ├── tokens.css      # Studio color/motion/typography tokens
    ├── base.css        # Utilities (.btn, .card, .row, .kbd, etc.)
    ├── prose.css       # Lesson body + code syntax
    └── view-transitions.css  # Depth push transition

server/sync/                        # Sidecar đồng bộ (Node 24, node:http + node:sqlite, 0 npm deps)
├── sync-server-entry.ts            # Router, header, log, SIGTERM; `--dev` (cổng 3001), `--backup`
├── sync-sqlite-store.ts            # Schema users/progress (WAL), sanitizeIncoming, mergeProgress
├── sync-auth.ts                    # scrypt, limiter băm, cookie HMAC, throttle đăng nhập, cap đăng ký
├── sync-http-helpers.ts            # HttpError, readBody (64 KB), parseJson, configFromEnv
└── sync-backup.ts                  # VACUUM INTO → backups/omnilab-YYYY-MM-DD.db, giữ 14 ngày

server/tts/                         # Sidecar tạo bản nghe (Node 24 + ffmpeg, 0 npm deps); cấu hình: tts-config.ts, mặc định: tts-defaults.ts
├── tts-worker-entry.ts             # SIGTERM, CLI `--dev --once --only --retry-failed <id|all>`, log JSON
├── tts-cycle.ts                    # Một vòng chạy: GC, chọn bài, dừng cả vòng khi lỗi chung (contract, upstream, quota phút, lỗi lặp)
├── tts-worker.ts, tts-chunk-synth.ts  # Xử lý một bài / một đoạn: nhịp request, kiểm thời lượng, thử lại, lưu đoạn, nén, công bố
├── tts-common.ts                   # Helper dùng chung trong server/tts
├── tts-work-plan.ts, tts-schedule.ts  # audioKey + hàng đợi + state.json; giờ ngủ tới 0h Los Angeles, backoff
├── chunk-packer.ts, audio-encode.ts, wav-pcm.ts  # Chia đoạn theo mục, ghép PCM + nén AAC, đọc WAV
├── audio-store.ts, audio-gc.ts     # Bố cục `public/` + `work/` ghi bền; dọn dẹp an toàn
├── gemini-tts-client.ts, gemini-quota.ts  # Gọi Gemini, phân loại 429
└── tts-sample-cli.ts               # `pnpm tts:sample`: thử giọng, đo ký tự/giây

deploy/
├── deploy.sh                       # git pull → build app + sync (+ tts, lỗi chỉ WARN) → gate / và /api/health → rollback
└── backup-sync-db.sh               # Chạy --backup trong container sync (cron)

Dockerfile                          # Stage build → sync → tts → app (app là stage cuối, mặc định)
compose.yml                         # Service app (web + internal), sync (internal, không ports), tts (egress, không ports)
Caddyfile                           # Static + /api/* proxy tới omnilab-sync:3000 (503 JSON khi sidecar không có) + /audio/* allowlist
```

## Mô hình nội dung

**Domains** (YAML):
- `kien-truc`: 27 bài, 4 modules, CC BY 4.0
- `tai-chinh`: 23 bài, 1 module (12 tuần), license pending
- `nghe-tai-chinh`: 14 bài, 7 modules (tổng quan + 6 nhóm kỹ năng), OmniLab tự biên soạn; snapshot ở `content-sources/nghe-tai-chinh/`, mỗi bài tự chèn `<Disclaimer />` (domain không đặt `isFinance`)
- `dau-tu-quy`: 14 bài, 7 modules (nền tảng, quỹ là gì, loại quỹ, phí–thuế–tài liệu, đánh giá, chiến lược, an toàn–nguồn học), cùng khuôn với `nghe-tai-chinh`; snapshot ở `content-sources/dau-tu-quy/`, nhân vật hư cấu Minh và chị Thu

**Lessons** (MDX):
- Path: `src/content/lessons/{domain}/{module}/{NN-slug}.mdx`
- Lesson ID (bất biến): `{domain}/{module}/{slug}`
- URL: `/hoc/{domain}/{module}/{slug}`
- Frontmatter: domain, module, order, title, summary, source (snapshot), examplesReviewed (false→true by fact-check agent)
- 221 khối RealLife (≤ 90 tiếng = âm tiết, bài ngắn 1-2 khối; `nghe-tai-chinh` và `dau-tu-quy` 1–3 khối/bài vì câu chuyện dẫn đã mang ví dụ)

**Verify-fidelity**: Gate trong `pnpm build`, loại bỏ `<RealLife>`, `<Figure added>`, `<Disclaimer>` → so sánh snapshot giữ nguyên nội dung gốc.

## Client state

**localStorage key**: `omnilab:v1:state` (payload v:2: `lessons{}`, `bookmarkMeta{}`, `owner?`; `bookmarks[]` là dẫn xuất). Chi tiết: [system-architecture.md](./system-architecture.md#máy-chủ-đồng-bộ-sync-sidecar).  
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

**Caddyfile** (repo, dùng cho cả VPS và Railpack):
- Cache: `/_astro/*` immutable, mọi đường dẫn khác no-cache
- CSP: `script-src 'self'`, `style-src 'unsafe-inline'`
- Không SPA fallback (404 thực)
- `/api/*` → `omnilab-sync:3000`; sidecar không có → 503 `{"code":"unavailable"}`
- `/audio/*` → chỉ `manifest.json` và file `.m4a` đúng mẫu; không có mount (Railpack) → 404, trình phát ẩn. Chi tiết: [system-architecture.md](./system-architecture.md#bản-nghe-bài-học-sidecar-tts)

## Testing & Quality

- **Vitest** (`pnpm test`; no jsdom, injectable deps). Số lượng thay đổi theo thời điểm, không ghi cứng ở đây.
  - Icon names + paths, command palette logic/controller, search controller, progress store, toc-scrollspy, lesson reader model, token contrast, etc.
  - Đồng bộ: `progress-merge`, migrate v2, `progress-sync` (engine), panel tài khoản, `sync-auth`, `sync-http-api` (end-to-end qua HTTP), `sync-backup`, `lesson-content` (id bài khớp regex)
  - Bản nghe: trích văn bản đọc (`speech-script-*`, gồm quét toàn bộ bài), `audio-manifest`, logic/controller/lưu vị trí của trình phát (audio giả kiểu Safari), và worker `tts-*` (lịch, chia đoạn, kế hoạch, kho ghi bền, dọn dẹp, nén, quota, client Gemini bằng fetch giả: không test nào gọi mạng). Test nén bằng ffmpeg thật tự bỏ qua khi máy không có ffmpeg
- Type-check server: `pnpm check:server` (`tsconfig.server.json`, gồm `server/**` và các module dùng chung `speech-script-contract.ts`, `audio-manifest.ts`; không nằm trong `pnpm check`)
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
