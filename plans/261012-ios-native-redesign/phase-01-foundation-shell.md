# Phase 1 — Foundation & shell

## Requirements
- tokens.css: palette iOS (systemGroupedBackground #F2F2F7 / dark #000, secondarySystemGrouped #FFF / #1C1C1E, tertiary #F2F2F7/#2C2C2E, label/secondaryLabel, separator), radius card 20–22px / row 12px, type scale iOS (largeTitle 34/41 bold, title1 28, title2 22, title3 20, headline 17 semibold, body 17, callout 16, subhead 15, footnote 13, caption 12), material tokens (--material-bar: translucent + blur/saturate), desktop tokens (--shell-sidebar-w ~260px, --shell-aside-w ~280px, content max widths). Giữ tên token đang được dùng hoặc migrate toàn bộ usages; token-contrast test phải pass (cập nhật test nếu đổi tên token, không hạ ngưỡng).
- Font: giữ Be Vietnam Pro (hỗ trợ tiếng Việt tốt; SF không tự host được). Có thể ưu tiên `-apple-system` trên Apple? -> KHÔNG: giữ nhất quán, dùng Be Vietnam Pro.
- base.css: reset, focus ring, .tap-scale, .sr-only, skip-link, utility inset-grouped list (.ios-list / .ios-row) dùng chung cho phase 2.
- Shell: tab bar kính mờ nổi (floating pill kiểu iOS 26) <1024px; sidebar kiểu macOS/iPadOS (vibrancy, section "Lĩnh vực" liệt kê domain nếu dễ lấy) >=1024px; large-title header collapse; reader-top-bar kính mờ.
- reader-layout: grid 3 cột >=1024px: sidebar | main (measure ~68ch) | aside slot (`<slot name="aside"/>`), sticky aside. <1024px: một cột như cũ. Reader trên desktop CÓ sidebar.
- Fallback khi không hỗ trợ backdrop-filter: nền đặc.
- Reduced motion, safe-area insets giữ nguyên.

## Validation
pnpm test && pnpm check && pnpm build; screenshot nhanh 390 & 1440.
