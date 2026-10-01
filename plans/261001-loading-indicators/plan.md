# Loading indicators

Status: in review · Mode: interactive

## Scope
Hiện trạng thái loading cho (1) soft navigation qua ClientRouter và (2) island chờ `/lessons-index.json`.
Out of scope: search (đã có loading state), reader scroll restore, offline/service worker, loading cho ảnh.

## Phase 01 — Navigation progress bar
| Change | Files |
|---|---|
| Thanh 3px màu `--accent`, fixed top (`--z-toast`), `aria-hidden`, `transition:persist="nav-progress"` để sống qua swap | new `components/shell/navigation-progress-bar.astro` |
| Script: `astro:before-preparation` → hẹn 150ms rồi hiện (trickle tới ~90%); `astro:after-swap` → chạy 100% rồi fade; huỷ timer nếu nav xong < 150ms (không nháy) | same |
| Reduced motion: không trickle/width-animate, chỉ hiện thanh tĩnh + fade | same |
| Mount trong cả 2 layout (cùng persist id → bar sống khi đi app ↔ reader) | `layouts/app-layout.astro`, `layouts/reader-layout.astro` |

## Phase 02 — Island skeletons (thay empty state nháy sai)
| Change | Files |
|---|---|
| Thêm skeleton card (server-render, mặc định hiện, `aria-busy`); empty state mặc định `hidden`; JS ẩn skeleton ở mọi nhánh kết thúc (data/empty/error) | `islands/continue-reading-card.astro` |
| Contract `SavedListElements` thêm `loadingState?` (optional → không vỡ caller); bookmarks rỗng → empty ngay (sync); có bookmark → skeleton tới khi fetch xong/lỗi | `islands/saved-list.astro`, `lib/saved-list-controller.ts` |
| Ring: `aria-busy="true"` server-side + pulse nhẹ track (tắt khi reduced-motion); bỏ busy khi apply xong hoặc fetch lỗi | `islands/progress-ring.astro` |
| Skeleton shimmer dùng chung: class `.skeleton` trong base.css, tôn trọng `prefers-reduced-motion` | `styles/base.css` |
| Test: saved-list loading → rows / → empty / → error; không có loadingState vẫn chạy | `tests/saved-list-controller.test.mjs` |

## Acceptance
- Nav < 150ms: không thấy bar. Nav chậm (DevTools Slow 3G): bar hiện, hoàn tất và biến mất sau swap; nav lỗi/abort không để bar treo.
- `/` lần đầu: thấy skeleton, không bao giờ thấy "Chưa có bài đang học" rồi đổi sang card. Soft-nav lại `/` (index đã cache): không flash skeleton.
- `/da-luu` không bookmark: empty ngay; có bookmark: skeleton → list; fetch lỗi: empty state.
- Reduced motion: không animation chạy liên tục.
- CSP không đổi (không inline script ngoài Astro bundle). `pnpm test`, `pnpm check`, `pnpm build` xanh.

## Risks
- `transition:persist` khác layout: nếu Astro không giữ được node → bar mất animation hoàn tất (degrade an toàn, không treo vì timer reset ở `astro:page-load`).
- Skeleton CLS: kích thước skeleton khớp card thật để tránh nhảy layout.
