---
phase: 7
title: "QA and launch"
status: pending
priority: P1
effort: "0.5–1 ngày"
dependencies: [5, 6]
---

# Phase 7: QA and launch

## Overview
Cổng chất lượng trước khi công bố: build gates, Lighthouse, a11y, test iPhone thật, link checker, docs, deploy production + giám sát uptime.

## Requirements
- Functional: tất cả Acceptance Criteria trong `plan.md` đạt.
- Non-functional: Lighthouse mobile ≥95 (Perf/A11y/BP), CLS <0.1, LCP <2s (4G giả lập), JS <30KB/trang; 0 link nội bộ hỏng.

## Architecture
- `pnpm check` = `astro check` + `verify:fidelity` + unit tests; `pnpm build` = `prebuild` (fidelity) → `astro build` → `postbuild` (search index) → link checker trên `dist/` (`lychee --offline` hoặc script nội bộ).
- Không có CI riêng ở v1 nếu Vibe Deploy build trực tiếp: gate chạy trong `build` → build fail = deploy fail (an toàn mặc định). Nếu có GitHub, thêm workflow `check` trên PR (tuỳ chọn).
- Giám sát: UptimeRobot HTTP check domain 5 phút; log Caddy trên dashboard Nhân Hòa.

## Related Code Files
- Create: `docs/system-architecture.md`, `docs/code-standards.md`, `docs/project-roadmap.md` (vòng 2: ~41 bài còn lại, export/import tiến độ, offline, quiz), `docs/codebase-summary.md`
- Modify: `README.md`, `docs/deployment-guide.md`, `package.json` (scripts `check`, `postbuild`)
- Optional create: `.github/workflows/check.yml`

## Implementation Steps
1. Chạy `pnpm check` + `pnpm build` sạch.
2. Lighthouse mobile trên 4 trang: `/`, `/linh-vuc/kien-truc`, `/hoc/kien-truc/chu-de/database` (dài nhất), `/tim-kiem`; sửa đến khi đạt.
3. A11y: axe DevTools + VoiceOver iOS trên reader và tab bar; focus ring, `aria-current`, `aria-pressed`, heading tuần tự.
4. iPhone thật: standalone, safe-area, dark mode, reduced motion, Dynamic Type lớn nhất (text không bị cắt), xoay ngang.
5. Test "thêm lĩnh vực demo" (AC #7) rồi xoá.
6. Viết/cập nhật docs; `ck:docs` hoặc `docs-manager` review nhanh.
7. Bàn giao cho user deploy (user-owned): checklist smoke test + gợi ý UptimeRobot trong `docs/deployment-guide.md`.
8. Code review (`ck:code-review`) trước bàn giao.

## Success Criteria
- [ ] Toàn bộ Acceptance Criteria `plan.md` #1–#7 đạt, có bằng chứng (screenshot/Lighthouse report trong `plans/260928-1725-omnilab-v1-learning-app/reports/`).
- [ ] Docs phản ánh đúng cấu hình thật.
- [ ] Checklist deploy + smoke test bàn giao cho user (deploy, uptime monitor, test iPhone trên domain thật: user-owned).

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| Lighthouse Perf thấp do font | M | M | Subset + preload 1 weight chính, `font-display: swap` |
| Gate trong build làm deploy fail bất ngờ khi sửa nội dung | M | L | Chạy `pnpm check` local trước push; thông báo lỗi fidelity rõ file/đoạn |
| Không có thiết bị iOS thật | L | M | BrowserStack/mượn máy; Safari desktop Responsive chỉ là tạm |
Rollback: redeploy commit trước.
