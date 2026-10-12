---
title: "Đồng bộ tiến độ qua tài khoản (sidecar sync)"
description: "Tài khoản tên/mật khẩu + sidecar Node (node:sqlite) trên mạng compose riêng để đồng bộ tiến độ học giữa thiết bị; site tĩnh + header Caddy giữ nguyên"
status: in-progress
priority: P2
branch: "feat/progress-sync"
tags: [sync, auth, sqlite, sidecar, tdd]
blockedBy: [261012-studio-implementation]
blocks: []
created: "2026-10-12T04:24:26.016Z"
createdBy: "ck:plan"
source: skill
---

# Đồng bộ tiến độ qua tài khoản (sidecar sync)

## Overview

Nguồn: [brainstorm report](../reports/261012-brainstorm-progress-sync-accounts.md). Mode: `--tdd`. Đã qua red-team (xem cuối file).

Kiến trúc:
```
Caddy chung → omnilab:8080 (Caddy + dist/, read-only)    [mạng web + internal]
                 └─ /api/* → omnilab-sync:3000 (Node 24 thuần, node:sqlite)   [chỉ mạng internal]
                                 └─ /srv/data/omnilab/omnilab.db (+ backups/)
```
- localStorage là nguồn chính; sync là lớp phụ, gộp bằng `mergeStates` (LWW theo trường, thuần, luỹ đẳng). Chưa đăng nhập thì app chạy y như cũ.
- Dữ liệu local có `owner`. Đăng nhập tài khoản khác trên cùng máy phải hỏi trước khi gộp.

Tổng effort ≈ 6,25d (1,5 + 1,5 + 1 + 0,75 + 1 + 0,5).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Schema v2 va merge](./phase-01-schema-v2-va-merge.md) | Done (2026-10-12) |
| 2 | [Sync server sidecar](./phase-02-sync-server-sidecar.md) | Done (2026-10-12) |
| 3 | [Client sync](./phase-03-client-sync.md) | Done (2026-10-12) |
| 4 | [Account UI](./phase-04-account-ui.md) | Done (2026-10-12) |
| 5 | [Infra deploy backup](./phase-05-infra-deploy-backup.md) | Code done, chờ checklist VPS |
| 6 | [Docs](./phase-06-docs.md) | Done (2026-10-12) |

Thứ tự: 1 → (2 ∥ 3) → 4 → 5 → 6. Phase 2 và 3 chỉ dùng chung module thuần của phase 1 cùng `ErrorCode` (định nghĩa ở phase 2, export qua `src/lib/progress-sync-types.ts`).

## Dependencies

- `blockedBy: 261012-studio-implementation`. Plan đó đang sửa tab Đã lưu, các island và layout trên `feat/studio-redesign`. Phase 3 (layout) và phase 4 (UI) đụng cùng vùng, nên bắt đầu sau khi studio merge vào `main`; tạo nhánh `feat/progress-sync` từ `main` mới. Phase 1–2 có thể làm sớm.
- Runtime: Node 24 (`node:sqlite`, type stripping `.ts`), Docker Compose trên VPS Contabo. Railpack/Vibe Deploy không chạy được sidecar, không dùng cho production.

## Acceptance criteria (toàn plan)

- [x] `pnpm test` xanh, gồm test mới: migrate v1→v2 (kể cả kịch bản "mở lại bài trên máy khác không xoá trạng thái hoàn thành"), merge, auth, API, client sync, controller UI.
- [x] Test cũ của `progress-store`: **hành vi giữ nguyên**; chỉ cập nhật các assert hình dạng đã liệt kê ở phase 1, fixture "phiên bản tương lai" chuyển sang `v:3`.
- [x] Kịch bản tay 2 trình duyệt: đăng ký ở A, đánh dấu xong + bookmark; đăng nhập ở B → thấy ngay; B bỏ bookmark → A thấy bỏ khi quay lại tab. Thứ tự Đã lưu giữ nguyên.
- [x] Máy dùng chung: A đăng xuất, B đăng nhập → được hỏi gộp, không tự gộp.
- [x] Chưa đăng nhập: chỉ một `GET /api/me` mỗi lần tải trang.
- [x] Header của trang tĩnh giống hệt mốc trước thay đổi.
- [x] Sidecar sập: site 200, `/api/*` 503 JSON, UI "Chưa kết nối được máy chủ đồng bộ", tiến độ local vẫn dùng bình thường.
- [ ] Sidecar chỉ ở mạng `internal`; cổng 3000 không lộ.
- [ ] Rollback lần deploy đầu, backup (chạy 2 lần/ngày) và restore đã thử thành công.

## Ngoài phạm vi

Quên mật khẩu qua email, OAuth, mã mời, multi-instance, offline service worker, xuất/nhập JSON, rebase đồng hồ thiết bị.

## Red Team Review

### Session — 2026-10-12
**Findings:** 15 (15 accepted, 0 rejected; 3 đề xuất con bị bác/chỉnh)
**Severity breakdown:** 4 Critical, 7 High, 4 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | `replace()` ghi đè sửa đổi đang bay + ping-pong nhiều tab | Critical | Accept | Phase 1, 3 |
| 2 | Migrate `doneUpdatedAt = visitedAt` xoá hoàn thành | Critical | Accept | Phase 1 |
| 3 | Máy dùng chung gộp nhầm tài khoản | Critical | Accept | Phase 1, 3, 4 |
| 4 | Sidecar trên mạng `web` dùng chung, tên `sync` dễ trùng | Critical | Accept | Phase 5 |
| 5 | Rate limit giả XFF được / thành công cụ khoá tài khoản; dò user | High | Accept (chỉnh: chỉ theo username, trễ tăng dần) | Phase 2 |
| 6 | scrypt vượt `mem_limit` → OOM | High | Accept | Phase 2, 5 |
| 7 | Session HMAC không thu hồi được | High | Accept | Phase 2, 4 |
| 8 | GC tombstone phá merge, `at=0` mất thứ tự, `clampFuture` thừa | High | Accept (bác rebase đồng hồ) | Phase 1, 2 |
| 9 | Tiêu chí test cũ sai, thiếu consumer | High | Accept | Phase 1, plan.md |
| 10 | Rollback/target Dockerfile/health gate | High | Accept | Phase 5 |
| 11 | `/api` lỗi ra HTML, cache header, trạng thái unavailable | High | Accept | Phase 3, 4, 5 |
| 12 | Origin check phụ thuộc `SITE_URL` build-time | Medium | Accept (bỏ Origin check) | Phase 2 |
| 13 | State phình → 413 vĩnh viễn; `__proto__` | Medium | Accept | Phase 1, 2, 3 |
| 14 | DB lọt build context, backup cùng đĩa, restore WAL, env | Medium | Accept | Phase 5, 6 |
| 15 | Over-engineering: scroll chatter, backoff, 6 file server, CLI, test chuỗi; init singleton | Medium | Accept (bác leader election, bác tắt encode) | Phase 1, 2, 3, 5 |

### Whole-Plan Consistency Sweep
- Delta: `replace` → `applyRemote`; bỏ `scrollUpdatedAt`, `clampFuture`, GC tombstone, Origin check, `SITE_URL` ở sidecar, CLI admin, 6 → 3 file server, test chuỗi infra; tên `sync:3000` → `omnilab-sync:3000`; `./data` → `/srv/data/omnilab`; mem 96m → 192m; body 32 KB → 64 KB; debounce 10 s → 3 s + maxWait 30 s; thêm `owner`, `session_version`, `logout-all`, `unavailable`, `ErrorCode`.
- Đã grep toàn bộ plan dir theo các từ khoá cũ; kết quả ở báo cáo cuối phiên. Không còn mâu thuẫn chưa giải quyết.
- Brainstorm report là tài liệu lịch sử (giữ nguyên); plan này là nguồn sự thật khi lệch.

## Progress — 2026-10-12
- Phase 1–2 xong trên worktree `D:/project/OmniLab-progress-sync` (nhánh `feat/progress-sync` từ `main`), commit cục bộ, chưa push. Phase 3–6 chờ studio merge `main` rồi rebase.
- Gate: `pnpm test` 454/454, `pnpm check` 0, `pnpm check:server` sạch, `pnpm build` 73 trang.
- Lệch so với plan (chi tiết ở reports/phase-0{1,2}-impl-report.md): server 4 file (thêm `sync-http-helpers.ts`); thêm `ErrorCode` `bad_request`; `sync:dev` dùng cờ `--dev` (cổng 3001), prod mặc định cổng 3000; thêm `@types/node`, `tsconfig.server.json`, `check:server`; `content.config.ts` ràng buộc regex id module.
- Việc mang sang phase 3: client phải chạy payload remote qua `migrate()` trước `applyRemote`; logout gửi `Content-Type: application/json`; cảnh báo `skipPersist` ở app-layout (rủi ro phase 1) chưa làm; kiểm lại consumer bên studio (`domain-progress.ts`, `learning-stats.astro`, `command-palette.astro`) sau rebase.
- Phase 5 (2026-10-12): code + test xong, đã kiểm Caddy 2.10.2 thật (header trang tĩnh không đổi; Railpack không có sidecar → `/api/*` 503 JSON). Chưa chạy được phần Docker (máy dev không có Docker) → checklist VPS ở reports/phase-05-impl-report.md. Lệch: không dùng `@down status 5xx` (để giữ 503 `busy` của sidecar); thêm `server/sync/sync-backup.ts`; stage Dockerfile `build → sync → app` (app cuối để `docker build .` vẫn ra site).
- Phase 3–4–6 (2026-10-12): xong trên `feat/progress-sync` (rebase lên `main` fe2a332), merge `main`. Panel ở tab "Tôi" `/toi#tai-khoan`. Gate: 687 test, check, check:server, build 74 trang. E2E Chrome thật (Playwright, 2 context, 390/1280, sáng/tối): 2 trình duyệt, gộp/ dùng tài khoản/ huỷ, tab cũ không gộp nhầm, 1 PUT/thay đổi qua nhiều tab, sidecar sập. 4 vòng review; báo cáo ở reports/.
- Lệch thêm: header `X-Sync-User` bắt buộc cho progress GET/PUT và logout-all (client + server phải deploy cùng nhau); "Xoá tiến độ trên máy" chỉ hiện khi chưa đăng nhập; màn hỏi gộp có "Huỷ — đăng xuất".
- Còn mở: 2 tiêu chí "sidecar chỉ ở mạng internal/cổng 3000 không lộ" và "rollback, backup, restore" chỉ xác minh được trên VPS → checklist ở reports/phase-05-impl-report.md. "Kịch bản tay" chạy bằng Playwright (visibility mô phỏng), chưa thử tay trên thiết bị thật.
