---
phase: 1
title: "Phase 1 report: Scaffold and deploy pipeline"
date: 2026-09-28
status: completed
---

# Phase 1 report: Scaffold and deploy pipeline

## Versions chốt

- Astro `7.3.5` (stable, `npm view astro version`)
- `@astrojs/mdx` `8.0.2` (peer: `astro ^7.2.10`)
- `@astrojs/sitemap` `3.7.4`
- `@astrojs/check` `0.9.10` (peer: `typescript ^5 || ^6`)
- TypeScript `6.0.3` — **không** dùng `7.0.2` (mới nhất) vì `@astrojs/check`
  chưa hỗ trợ TS 7 trong peerDependencies; dùng 7.0.2 sẽ gây peer mismatch.
- Node `24.15.0`, pnpm `9.15.4` (theo môi trường có sẵn, khớp yêu cầu).
- API xác nhận qua docs.astro.build: `src/content.config.ts` + `glob` loader
  từ `astro/loaders` là pattern hiện hành cho content collections (Astro 7
  vẫn giữ Content Layer API này); `<ClientRouter />` là tên hiện tại của
  View Transitions component. **Không tạo `content.config.ts`/dùng
  `ClientRouter` ở phase này** — không có trong "Related Code Files" của
  phase-01 và sẽ do Phase 2/3 sở hữu (tránh xung đột file ownership).
- Astro 7 đổi default markdown processor (Sätteri) và `compressHTML` default
  → `'jsx'` — không ảnh hưởng phase này (chưa có Markdown/MDX content).

## Files created

- `package.json` — `packageManager: pnpm@9.15.4`, `engines.node: >=24`,
  scripts `dev/build/preview/check`. `build` là lệnh trần (`astro build`)
  để Phase 3 gắn `prebuild` (`verify:fidelity`) — pnpm/npm tự chạy
  `prebuild`/`postbuild` hook nếu tồn tại, không cần sửa `build` script.
- `astro.config.mjs` — `output: 'static'`, không adapter; `site` đọc từ
  `process.env.SITE_URL` fallback `https://omnilab.example`; integrations
  `mdx()`, `sitemap()`; `build.inlineStylesheets: 'never'` (lý do: giữ CSP
  `style-src 'self'` không cần `'unsafe-inline'` — xác nhận bằng cách kiểm
  tra `dist/*.html` không có `<style>` inline).
- `tsconfig.json` — extends `astro/tsconfigs/strict`.
- `src/env.d.ts`, `src/pages/index.astro`, `src/pages/404.astro` — trang
  placeholder tiếng Việt, `<html lang="vi">`, tự chứa (chưa có layout —
  Phase 2 sẽ thêm `AppLayout`).
- `public/favicon.svg` — icon tạm chữ "OL" nền accent `#4F46E5` (trùng màu
  accent domain Kiến trúc trong plan, dễ thay ở Phase 2).
- `Caddyfile` — mirror cấu trúc global block (`admin off`, `auto_https off`,
  `trusted_proxies`) từ Caddyfile mặc định của Railpack
  (`core/providers/staticfile/Caddyfile.template` trên GitHub, đã fetch
  trực tiếp để đối chiếu) + `:{$PORT:80}` convention; tùy biến thêm cache
  header `/_astro/*` immutable, HTML no-cache, CSP strict `'self'` (không
  `unsafe-inline` — xem lý do ở `astro.config.mjs`), bỏ CSP rộng
  (`https: *`) mà bản gốc Railpack có. `try_files` **không** có nhánh SPA
  fallback (`/index.html`) — 404 thật qua `handle_errors` → `/{code}.html`.
- `.gitignore`, `.node-version` (`24`).
- `docs/deployment-guide.md` — tiếng Việt: cách Railpack detect app, bảng
  env (`SITE_URL`, `RAILPACK_NODE_VERSION`, `RAILPACK_NO_SPA`,
  `RAILPACK_SPA_OUTPUT_DIR`), giải thích Caddyfile, checklist `curl` sau
  deploy, rollback = redeploy commit trước trên dashboard.
- `README.md` — tiếng Việt ngắn gọn, lệnh pnpm, link deployment-guide +
  plans.
- `plans/260928-1725-omnilab-v1-learning-app/reports/phase-01-report.md`
  (file này).

## Verification output summary

- `pnpm install` — 276 packages, 0 lỗi peer dependency, `typescript 6.0.3
  (7.0.2 is available)` (thông báo thông tin, không phải lỗi).
- `pnpm install --frozen-lockfile` — pass, "Lockfile is up to date".
- `pnpm build` — pass, output `dist/404.html`, `dist/index.html`,
  `dist/favicon.svg`, `dist/sitemap-0.xml`, `dist/sitemap-index.xml` (5
  file tĩnh, không JS runtime nào — trang chưa có script).
- `pnpm check` (astro check) — `0 errors, 0 warnings, 0 hints` (5 files).
- Kiểm tra `dist/*.html` bằng `cat` — không có `<style>`/`<script>` inline
  → xác nhận CSP `style-src 'self'; script-src 'self'` không cần
  `unsafe-inline`.
- Serve local (`npx serve dist -l 4321`, không có `caddy` binary trong
  môi trường): `curl http://127.0.0.1:4321/` → `200`;
  `curl http://127.0.0.1:4321/khong-ton-tai` → `404` với body thật của
  `404.html` (không fallback `index.html`).
- `railpack` CLI: không có sẵn trong môi trường, **bỏ qua** `railpack info .`
  theo chỉ dẫn task (đã bù bằng cách fetch trực tiếp
  `Caddyfile.template` + docs `railpack.com/languages/node` để xác nhận
  cách detect Astro/env vars thay vì đoán).

## Deviations / decisions

- Không tạo `content.config.ts`, không thêm `<ClientRouter />` dù được
  nhắc trong yêu cầu "verify API" — vì các file/behavior này thuộc file
  ownership của Phase 2 (layouts, ClientRouter) và Phase 3
  (`content.config.ts`). Đã verify API qua docs để phase sau dùng đúng,
  nhưng không implement để tránh đụng file ngoài phạm vi phase 1.
- TypeScript ghim `^6.0.3` thay vì `7.0.2` mới nhất — lý do peer dependency
  `@astrojs/check` (xem trên). Sẽ tự nâng khi `@astrojs/check` hỗ trợ TS 7.
- CSP trong `Caddyfile` chặt hơn bản mặc định Railpack (bỏ `https: *`
  wildcard) vì domain ngoài duy nhất cần (Google Fonts) đã loại bỏ theo
  quyết định self-host font trong plan.
- Không cài/thử `railpack` CLI cục bộ (không có sẵn, cài thêm ngoài phạm vi
  "structure phải build được" của phase) — xác nhận hành vi qua source
  Caddyfile template + docs thay thế.
- Commit chỉ gồm file project (không `.claude/`) + toàn bộ `plans/`, theo
  đúng chỉ dẫn task; `.claude/` vốn đã bị git ignore ở tầng global/system
  (`git ls-files --others --ignored --exclude-standard` xác nhận
  `.claude/settings.local.json` bị ignore) nên không cần thao tác thêm.

## Unresolved questions

- Vibe Deploy Nhân Hòa có tôn trọng `Caddyfile` custom ở root hay dùng
  static-file provider riêng? Không kiểm chứng được (không có quyền
  deploy/tài khoản trong phiên này) — đã ghi fallback `RAILPACK_NO_SPA=1`
  + `RAILPACK_SPA_OUTPUT_DIR=dist` trong `docs/deployment-guide.md`, cần
  user xác nhận khi deploy thật (đã là unresolved question ở `plan.md`).
