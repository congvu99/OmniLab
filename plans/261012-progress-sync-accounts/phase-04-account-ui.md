---
phase: 4
title: "Account UI"
status: done
priority: P2
effort: "0.75d"
dependencies: [3]
---

# Phase 4: Account UI

## Overview
Mục "Tài khoản & đồng bộ" là section đầu của **tab "Tôi" (`/toi`)** — đổi từ tab Đã lưu theo quyết định user 2026-10-12, xem `plans/261012-personal-tab/`. Gồm: đăng nhập/đăng ký, hỏi gộp dữ liệu khi khác chủ, trạng thái đồng bộ, đăng xuất, xoá tiến độ trên máy. Theo design system Studio (`docs/design-guidelines.md`).

## Thiết kế (Studio)
- Vị trí: `src/pages/toi.astro` đã chừa `<section id="tai-khoan">` — mount island vào đó, không sửa các section khác (Giao diện, Tiến độ, Dữ liệu & ứng dụng do plan personal-tab sở hữu).
- `signed-out`: thẻ hairline, tiêu đề "Đồng bộ tiến độ giữa các thiết bị" + 1 dòng lợi ích; segmented "Đăng nhập / Tạo tài khoản"; field `.field`; nút chính `.btn-primary` (volt), phụ `.btn-ghost`. Desktop: form rộng tối đa ~420px.
- `signed-in`: hàng hồ sơ = avatar tròn chữ cái đầu (nền `--surface-3`, chữ `--text`), tên (Be Vietnam Pro 700), dòng trạng thái mono nhỏ có chấm trạng thái (`synced` volt-ink · `syncing` nhấp nháy, tắt khi reduced motion · `error` danger). Dưới là `.rows`: "Đồng bộ ngay" (nếu có), Đăng xuất, Đăng xuất mọi thiết bị, công tắc "Xoá dữ liệu trên máy này khi đăng xuất".
- `needsMergeDecision`: thẻ cảnh báo trong section (không modal), 2 nút ngang bằng.
- `unavailable`: 1 dòng `--text-2` + chấm xám, không form.
- Sidebar desktop: mục "Tôi" hiển thị tên + chấm trạng thái khi đã đăng nhập (đọc `subscribe`); dock không đổi.
- "Xoá tiến độ trên máy" (dùng `store.clear()` từ phase 1): đặt trong section này, có xác nhận 2 bước, chữ `--danger`.
- Tương lai (ngoài phạm vi, cần API server mới): đổi mật khẩu, xoá tài khoản, đồng bộ cài đặt giao diện (`omnilab:prefs`).

## Requirements
- `signed-out`:
  - Hai chế độ "Đăng nhập" / "Tạo tài khoản"; tạo tài khoản có "Nhập lại mật khẩu".
  - Validate tại chỗ trước khi gửi.
  - Lỗi theo `ErrorCode` hiển thị inline (`aria-live="polite"`).
- `needsMergeDecision` (RT#3): hộp chọn "Máy này đang có tiến độ của tài khoản khác. Gộp vào tài khoản {tên}?" → [Gộp] / [Dùng tiến độ của tài khoản].
- `signed-in` hiển thị:
  - "Đã đăng nhập: {tên}";
  - "Đồng bộ lúc HH:mm" / "Đang đồng bộ…" / lỗi theo code;
  - các nút Đăng xuất, "Đăng xuất mọi thiết bị", checkbox "Xoá dữ liệu trên máy này khi đăng xuất".
- `unavailable`: dòng nhỏ "Chưa kết nối được máy chủ đồng bộ"; không hiện form (RT#11).
- Ghi chú: "Không có khôi phục mật khẩu qua email. Chỉ lưu tên đăng nhập và tiến độ học."
- `autocomplete` `username` / `current-password` / `new-password`.
- A11y: label thật, focus ring, nút ≥ 44 px, reduced motion.
- **Mọi chuỗi từ server/người dùng (username, thông điệp) chỉ gán qua `textContent`, không `innerHTML`** (RT#11/security #10).

## Architecture
- Island `src/components/islands/account-sync-panel.astro` + controller thuần `src/lib/account-sync-panel-controller.ts` (pattern `saved-list-controller.ts`).
- Controller map `SyncStatus` + `ErrorCode` → view model (text tiếng Việt, nút nào hiện), không chạm DOM.
- Gắn vào `src/pages/toi.astro`, trong `<section id="tai-khoan">`.

## Related Code Files
- Create: `src/components/islands/account-sync-panel.astro`, `src/lib/account-sync-panel-controller.ts`, `tests/account-sync-panel-controller.test.mjs`
- Modify: `src/pages/toi.astro` (chỉ section `#tai-khoan`), `src/components/shell/sidebar-nav.astro` (tên + trạng thái ở mục Tôi)

## Implementation Steps (TDD)
1. **Đỏ** controller:
   - validate (tên sai mẫu, mk < 8, confirm lệch) → không gọi API;
   - mỗi `SyncStatus` và mỗi `ErrorCode` → text;
   - khoá nút khi đang gửi;
   - `needsMergeDecision` → view hộp chọn;
   - username chứa `<img>` hiển thị nguyên văn (view model là text thuần).
2. **Xanh**: controller + island.
3. Kiểm thị giác light/dark, 375 px + desktop (chụp local, không publish).

## Success Criteria
- [ ] Test xanh; `pnpm check` sạch.
- [ ] Kịch bản 2 trình duyệt + kịch bản máy dùng chung (A đăng xuất, B đăng nhập → được hỏi) pass bằng UI.
- [ ] grep island: không có `innerHTML` với dữ liệu động.

## Risk Assessment
- Studio đã merge `main` (7840510). Trang `/toi` đến từ plan personal-tab — rebase `feat/progress-sync` lên `main` sau khi plan đó push.
