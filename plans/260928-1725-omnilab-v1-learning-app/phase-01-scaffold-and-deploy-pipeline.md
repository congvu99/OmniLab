---
phase: 1
title: Scaffold and deploy pipeline
status: in-progress
priority: P1
effort: 0.5 ngày
dependencies: []
---

# Phase 1: Scaffold and deploy pipeline

## Overview
Dựng project Astro rỗng, **cấu trúc build được bằng Railpack** (Astro static → Caddy), để user tự deploy lên Vibe Deploy Nhân Hòa sớm và xác nhận pipeline trước khi đầu tư UI/nội dung.

## Requirements
- Functional: `pnpm build` ra `dist/` tĩnh; URL domain trả trang "Hello OmniLab" qua HTTPS; URL không tồn tại trả 404 thật (không fallback index).
- Non-functional: Node pin (`engines.node` + `.node-version` = 24); pnpm lockfile commit; không secret trong repo.

## Architecture
- Astro `output: 'static'` (mặc định) → Railpack Node provider auto-detect Astro, build, serve `dist/` bằng Caddy.
- `Caddyfile` ở root (Railpack dùng khi có) để kiểm soát header + 404; fallback env `RAILPACK_NO_SPA=1` nếu nền tảng bỏ qua Caddyfile.
- Header dự kiến:
  - `/_astro/*` → `Cache-Control: public, max-age=31536000, immutable`
  - `*.html`, `/` → `Cache-Control: no-cache`
  - Toàn site: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP cơ bản (self + Google Fonts nếu dùng CDN; ưu tiên self-host font → CSP chỉ `self`).

## Related Code Files
- Create: `package.json`, `pnpm-lock.yaml`, `.node-version`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `src/pages/404.astro`, `Caddyfile`, `.gitignore`, `README.md` (tối thiểu: chạy local, deploy).

> **Ownership:** user tự deploy lên Vibe Deploy Nhân Hòa (tạo app, domain, TLS). Phase này chỉ giao **cấu trúc repo build được bằng Railpack** + tài liệu cấu hình.

## Implementation Steps
1. Tra docs Astro bản stable hiện tại (`ck:docs-seeker`) — xác nhận API content collections (`src/content.config.ts`, loader `glob`), MDX integration, View Transitions (`<ClientRouter />`).
2. Scaffold Astro (template minimal, TS strict) trong `D:\project\OmniLab`; thêm `@astrojs/mdx`, `@astrojs/sitemap`; `pnpm` + lockfile; `packageManager` field trong `package.json`.
3. Railpack-ready: `.node-version` = 24, `engines.node`, script `build` tự chứa mọi gate (prebuild/postbuild), `astro.config` không có adapter server, output `dist/`.
4. Viết `Caddyfile` với header trên + `handle_errors` 404 → `/404.html` (Railpack dùng Caddyfile ở root khi có).
5. Kiểm chứng local: `pnpm install --frozen-lockfile && pnpm build`; serve `dist/` (Caddy local nếu có, hoặc `npx serve dist`) → trang chủ 200, `/khong-ton-tai` 404. Nếu có `railpack` CLI: `railpack info .` xác nhận provider = node/astro static.
6. `docs/deployment-guide.md`: env khuyến nghị (`RAILPACK_NODE_VERSION=24`, dự phòng `RAILPACK_NO_SPA=1`, `RAILPACK_SPA_OUTPUT_DIR=dist`), checklist smoke test sau deploy (`curl -I` 200/404/header cache) để user tự chạy.
7. Commit đầu (`feat: scaffold astro project`). Không push/tạo remote — user tự làm.

## Success Criteria
- [ ] `pnpm install --frozen-lockfile && pnpm build` pass từ clone sạch; `dist/` chỉ chứa file tĩnh.
- [ ] Serve local: `/` 200, `/khong-ton-tai` 404.
- [ ] `Caddyfile` có header cache (`/_astro/*` immutable, HTML no-cache) + security headers.
- [ ] `docs/deployment-guide.md` có env + checklist smoke test cho user.

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| Vibe Deploy không phải Railpack chuẩn / bỏ qua Caddyfile | M | M | Thử env `RAILPACK_NO_SPA=1`, `RAILPACK_STATIC_FILE_ROOT=dist`; cuối cùng: Dockerfile Caddy tối giản |
| SPA fallback nuốt 404 | M | L | Caddyfile `handle_errors` / `RAILPACK_NO_SPA=1` |
| Node version lệch local/CI | L | M | `.node-version` + `engines` |
Rollback: redeploy commit trước trên dashboard Vibe Deploy.
