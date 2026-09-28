---
title: OmniLab v1 - app hoc tap da linh vuc
description: >-
  App đọc/học Astro tĩnh, UI kiểu iOS, 2 lĩnh vực (Kiến trúc hệ thống, Tài
  chính), 100% nội dung gốc + 6 bài thí điểm có ví dụ đời sống & SVG; deploy
  Railpack/Nhân Hòa.
status: in-progress
priority: P2
branch: main
tags:
  - astro
  - pwa
  - content
  - ios-style
  - railpack
blockedBy: []
blocks: []
created: '2026-09-28T10:23:12.431Z'
createdBy: 'ck:plan'
source: skill
---

# OmniLab v1 - app hoc tap da linh vuc

## Overview

Greenfield. Input: [brainstorm report](../reports/260928-1721-brainstorm-omnilab-learning-app.md) (đã duyệt).
Stack: Astro (static output) + MDX + content collections (zod), CSS tokens thuần (không Tailwind), vanilla TS islands, Pagefind, Lucide icons, Be Vietnam Pro. Deploy: Railpack → Caddy trên Vibe Deploy Nhân Hòa, domain có sẵn.
Nguyên tắc cốt lõi: **nội dung gốc bất biến** (chứng minh bằng `verify-fidelity`), ví dụ đời sống chỉ nằm trong `<RealLife>`, thêm lĩnh vực mới không cần sửa code.

Ước lượng tổng: **~10–12 ngày công** (tách QA thành phase riêng nên cao hơn brainstorm 9–11 ~1 ngày).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Scaffold and deploy pipeline](./phase-01-scaffold-and-deploy-pipeline.md) | In Progress |
| 2 | [Design system and app shell](./phase-02-design-system-and-app-shell.md) | Pending |
| 3 | [Content model and migration](./phase-03-content-model-and-migration.md) | Pending |
| 4 | [Domain and reader screens](./phase-04-domain-and-reader-screens.md) | Pending |
| 5 | [Progress bookmarks and search](./phase-05-progress-bookmarks-and-search.md) | Pending |
| 6 | [Pilot content](./phase-06-pilot-content.md) | Pending |
| 7 | [QA and launch](./phase-07-qa-and-launch.md) | Pending |

## Dependencies

- Phase graph: 1 → {2, 3} (song song được, khác file) → 4 → {5, 6} → 7. Phase 6 phần SVG style guide có thể bắt đầu ngay sau 2.
- External: repo GitHub (hoặc git remote) mà Vibe Deploy kéo được; DNS domain trỏ Nhân Hòa; nguồn đọc-only `D:\HardSkills\system-design-primer\hoc-tap-vi`, `D:\HardSkills\system-design-primer\images|solutions`, `D:\documents\bot\reports\deploy\index.html`.
- Cross-plan: none (không có plan khác).

## Acceptance Criteria (v1)

1. iPhone Safari → "Thêm vào màn hình chính" → mở standalone, tab bar 4 mục hoạt động, safe-area đúng.
2. Đủ 28 bài Kiến trúc + toàn bộ bài Tài chính; `pnpm verify:fidelity` pass.
3. Đánh dấu hoàn thành → % lĩnh vực cập nhật; đóng/mở app vẫn giữ; "Học tiếp" mở đúng bài + vị trí cuộn.
4. Tìm "cache" và "bộ nhớ đệm" (và "bo nho dem") đều ra bài Cache.
5. 6 bài thí điểm: `examplesReviewed: true`, có SVG, đạt ở light + dark.
6. Lighthouse mobile ≥ 95 (Performance, A11y, Best Practices); CLS < 0.1.
7. Thêm lĩnh vực thử nghiệm (YAML + 1 bài) hiển thị đúng mà không sửa code (xoá sau khi test).

## Decisions đã chốt (không đảo ngược nếu không có bằng chứng mới)

Standalone manifest có, offline/service worker không · Dark mode theo hệ thống, không toggle · Không tuỳ chỉnh cỡ chữ · Ảnh bìa user tự tạo · Nguồn copy 1 lần, OmniLab là source of truth · Ví dụ AI nháp → user duyệt, inline.

## Ownership

- **Deploy (Vibe Deploy Nhân Hòa, domain, TLS, git remote, uptime): user tự làm.** Repo chỉ đảm bảo build được bằng Railpack + `docs/deployment-guide.md`.
- Implementation: agent `fullstack-developer` theo phase, file ownership tách bạch; controller session điều phối + review.

## Unresolved Questions

- Vibe Deploy Nhân Hòa có tôn trọng `Caddyfile`/env `RAILPACK_*`? (user xác nhận khi deploy; repo có fallback env)
- Quyền/ghi công nội dung `index.html` tài chính.
- 36 ảnh PNG gốc: mặc định plan **giữ kèm credit** cho bài chưa có SVG — user xác nhận.
