---
phase: 2
title: Design system and app shell
status: in-progress
priority: P1
effort: 1.5–2 ngày
dependencies:
  - 1
---

# Phase 2: Design system and app shell

## Overview
Design tokens (light + dark theo hệ thống), typography, layout shell kiểu iOS (tab bar đáy, large title, safe-area), sidebar desktop ≥1024px, View Transitions, manifest standalone. Chưa có nội dung thật — dùng trang placeholder.

## Requirements
- Functional: 4 tab **Học tiếp** (`/`) · **Lĩnh vực** (`/linh-vuc`) · **Tìm kiếm** (`/tim-kiem`) · **Đã lưu** (`/da-luu`); tab active highlight (màu + weight + `aria-current="page"`); desktop ≥1024px chuyển sidebar trái, cùng 4 mục.
- Standalone: `manifest.webmanifest` (`display: standalone`, `start_url: /`, `lang: vi`, theme/background color), icon 180 (apple-touch), 192, 512, maskable; meta `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.
- Non-functional: body ≥16px (dùng 17px), touch target ≥44pt, contrast ≥4.5:1 cả 2 theme, `prefers-reduced-motion` tắt slide, `viewport-fit=cover` + `env(safe-area-inset-*)`, không horizontal scroll ở 375px, không disable zoom.

## Architecture
**Tokens** (`src/styles/tokens.css`, CSS custom properties; component chỉ dùng token, không raw hex):
```css
:root{
  --bg:#F7F6F2; --surface:#FFFFFF; --surface-2:#EFEDE7; --ink:#1C1F24; --ink-2:#5A606B;
  --line:#E3E0D8; --accent:var(--domain-accent,#4F46E5);
  --radius-card:16px; --radius-row:12px; --space-1:4px; /* 4pt scale: 4 8 12 16 24 32 48 */
  --dur-fast:150ms; --dur:250ms; --ease-out:cubic-bezier(.2,.8,.2,1);
  --font-ui:"Be Vietnam Pro",system-ui,sans-serif; --font-mono:"JetBrains Mono",ui-monospace,monospace;
}
@media (prefers-color-scheme:dark){ :root{ --bg:#111315; --surface:#1A1D21; ... } }
```
- Domain accent qua `--domain-accent` set ở layout theo YAML domain (Kiến trúc `#4F46E5`, Tài chính `#1F7A5A`; bản dark sáng hơn/dịu hơn, kiểm contrast riêng).
- Type scale: 13 caption · 15 footnote · 17 body (lh 1.7) · 20 title3 · 22 title2 · 28 title1 · 34 large title. Measure reader 60–68ch.
- Font: **self-host** Be Vietnam Pro (subset `latin` + `vietnamese`, weights 400/500/600/700, `font-display: swap`) qua `@fontsource` → CSP chỉ `self`, không phụ thuộc Google.
- Icon: Lucide (SVG inline qua `astro-icon` hoặc import SVG), stroke 2, size token 20/24.
- Layout: `AppLayout` (tab bar/sidebar + `<main>`), `ReaderLayout` (top bar: back · title thu gọn · bookmark; progress bar đọc; ẩn tab bar khi đọc để tối đa chỗ).
- Large title: header 34px, khi cuộn thu thành title 17px trong nav bar (IntersectionObserver, không scroll listener).
- View Transitions: `<ClientRouter />`; forward = slide trái, back = slide phải (`transition:animate` custom, 250ms, exit ~170ms); reduced-motion → fade/none. Giữ scroll position khi back.
- JS: chỉ `<script>` vanilla TS; mục tiêu < 30KB/trang.

## Related Code Files
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/prose.css`
- Create: `src/layouts/app-layout.astro`, `src/layouts/reader-layout.astro`
- Create: `src/components/shell/tab-bar.astro`, `src/components/shell/sidebar-nav.astro`, `src/components/shell/large-title-header.astro`, `src/components/shell/reader-top-bar.astro`, `src/components/shell/nav-items.ts` (1 nguồn cho tab bar + sidebar — DRY)
- Create: `public/manifest.webmanifest`, `public/icons/*` (icon tạm; user thay sau)
- Create: placeholder `src/pages/linh-vuc/index.astro`, `src/pages/tim-kiem.astro`, `src/pages/da-luu.astro`
- Modify: `src/pages/index.astro`, `astro.config.mjs`

## Implementation Steps
1. Cài `@fontsource/be-vietnam-pro`, `@fontsource/jetbrains-mono`; import subset cần thiết.
2. Viết tokens light/dark + base reset + prose (heading, list, table cuộn ngang trong wrapper, code, blockquote).
3. `nav-items.ts` → `tab-bar.astro` (fixed bottom, `padding-bottom: env(safe-area-inset-bottom)`, blur nền nhẹ chỉ để tách lớp) + `sidebar-nav.astro` (≥1024px).
4. `large-title-header.astro` + logic thu gọn khi cuộn.
5. `reader-top-bar.astro` + progress bar đọc (transform scaleX, không animate width).
6. Bật `<ClientRouter />`, định nghĩa animation forward/back, reduced-motion.
7. Manifest + icons + meta iOS; `theme-color` 2 giá trị theo `media`.
8. Kiểm tra 375px / 430px / 768px / 1280px; iOS Safari thật (hoặc BrowserStack) cho standalone + safe-area.
9. Chạy checklist ui-ux-pro-max §1–§3, §5, §9.

## Success Criteria
- [ ] 4 tab chuyển trang có slide, back slide ngược, reduced-motion không slide.
- [ ] Standalone trên iPhone: không thanh Safari, tab bar không đè home indicator.
- [ ] Contrast text chính ≥4.5:1, phụ ≥3:1 ở light và dark (đo bằng tool).
- [ ] Không raw hex ngoài `tokens.css`.
- [ ] JS mỗi trang < 30KB (gzip).

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| View Transitions trên iOS Safari cũ không mượt | M | L | Progressive enhancement: không hỗ trợ → điều hướng thường |
| Fixed tab bar + bàn phím iOS nhảy layout (trang tìm kiếm) | M | M | Ẩn tab bar khi input focus; test thực tế |
| Font tiếng Việt lỗi dấu chồng | L | M | Be Vietnam Pro có subset vietnamese; test chuỗi "Ước lượng ổn định tưởng" |
