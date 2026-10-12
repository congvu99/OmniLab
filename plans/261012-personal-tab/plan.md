# Tab "Tôi": thông tin cá nhân, cài đặt giao diện, tiến độ, dữ liệu & ứng dụng

Status: done · Created 2026-10-12 · Shipped to main 2026-10-12

## Quyết định (user, 2026-10-12)
- Tab thứ 5 "Tôi" trên dock (Học tiếp · Lĩnh vực · Tìm kiếm · Đã lưu · Tôi); desktop: mục "Tôi" trong sidebar. Route `/toi`.
- 4 nhóm: Tài khoản & đồng bộ · Giao diện · Tiến độ học · Dữ liệu & ứng dụng.
- Implement luôn theo design system Studio (docs/design-guidelines.md), không prototype.

## Ranh giới với plan đồng bộ tài khoản (plans/261012-progress-sync-accounts)
- Phiên khác đang code phase 3 (client sync) trên worktree `OmniLab-progress-sync` — đụng `app-layout.astro`, `reader-layout.astro`, `progress-store.ts`.
- Plan NÀY không sửa `progress-store.ts`, không thêm code sync/auth, sửa 2 layout tối thiểu (ưu tiên `base-head.astro`).
- Nhóm "Tài khoản & đồng bộ" do phase 4 của plan kia lắp vào `/toi` (spec đã cập nhật ở `phase-04-account-ui.md`). Trang `/toi` chừa sẵn vị trí `<section id="tai-khoan">` (comment chỉ dẫn), KHÔNG render UI giả khi chưa có sync.
- "Xoá tiến độ trên máy" cần `store.clear()` (có ở phase 1 nhánh sync) → làm ở phase 4 bên kia.

## Phases
| # | Phase | Status |
|---|---|---|
| 1 | [Tab + trang /toi + cài đặt](phase-01-personal-tab.md) | done |
| 2 | Review + test + docs + commit/push | done |
