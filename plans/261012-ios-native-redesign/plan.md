# iOS native redesign (mobile-first, desktop 3 cột)

Status: superseded by plans/261012-studio-implementation (user rejected iOS-native look as too similar; chose concept B "Studio")

## Quyết định đã chốt (user)
- Phong cách: iOS native hiện đại (Apple HIG iOS 26): nền grouped, inset-grouped list, card bo lớn, vật liệu kính mờ cho thanh điều hướng, large title.
- Desktop (>=1024px): 3 cột kiểu iPad/Mac — sidebar điều hướng + nội dung + cột phụ (TOC, tiến độ, bài tiếp) trong reader; >=1280px hiện cột phụ, 1024–1279 TOC gập.
- Phạm vi: toàn bộ UI; GIỮ hành vi: route, localStorage schema, data-* hooks, nội dung, tìm kiếm, CSP, fidelity gate. Không sửa SVG minh hoạ, không sửa content MDX.

## Phases
| # | Phase | Owner files | Phụ thuộc |
|---|---|---|---|
| 1 | [Foundation: tokens, base, shell, layouts](phase-01-foundation-shell.md) | src/styles/{tokens,base,view-transitions}.css, src/layouts/*, src/components/shell/* | — |
| 2a | [Tab screens + domain components](phase-02a-screens.md) | src/pages/{index,linh-vuc/**,tim-kiem*,da-luu*,gioi-thieu,404}.astro, src/components/domain/*, islands: continue-reading-card, progress-ring, saved-list, search-box | 1 |
| 2b | [Reader + lesson components + prose](phase-02b-reader.md) | src/styles/prose.css, src/pages/hoc/**, src/components/lesson/*, islands: mark-complete, bookmark, reader-progress-tracker | 1 |
| 3 | Verify + review | — (fix-only) | 2a, 2b |

## Acceptance
- `pnpm test`, `pnpm check`, `pnpm build` xanh.
- Screenshot 390x844 (iPhone), 1440x900 (desktop), light + dark, cho: Học tiếp, Lĩnh vực, domain, reader, Tìm kiếm, Đã lưu. Không tràn ngang, tap target >=44px, contrast >=4.5:1 (token-contrast test).
- Reduced motion tôn trọng; backdrop-filter có fallback nền đặc.
- docs/design-guidelines.md (mới) + cập nhật codebase-summary/system-architecture nếu đổi cấu trúc.
