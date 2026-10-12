# Implement concept B "Studio"

Status: in-progress · Created 2026-10-12 · Branch: feat/studio-redesign (checkpoint 477e2a4)

## Nguồn thiết kế (single source of truth)
plans/261012-full-restyle-concepts/concept-b-studio/index.html + README.md. Implementation phải khớp concept: màu, font, icon, component, motion, bố cục iPhone + desktop.

## Quyết định
- User chọn hướng B thuần (2026-10-12).
- Theme: theo hệ thống (prefers-color-scheme), không ép dark. Dark là theme "chủ đạo" về thiết kế.
- Focus mode: ẩn dock khi đọc bài (theo concept).
- Phím tắt: chỉ hiện hint cho phím thật sự hoạt động. Bắt buộc: ⌘K/Ctrl+K palette (↑↓ Enter Esc).
- Giữ: route, localStorage schema, data-* hooks của src/lib + tests, CSP (script-src 'self', không inline script), fidelity gate, MDX/SVG nội dung, YAML domain (map tên icon YAML → icon mới, có fallback).
- Giữ hạ tầng vòng 1: reader aside slot, toc-scrollspy, đồng bộ island, contrast test.
- Bỏ Lucide (@lucide/astro) khi không còn usage; icon = sprite 25 icon tự vẽ từ concept.
- Grain: chỉ desktop (>=1024px); fallback nền đặc khi không có backdrop-filter / reduce-transparency.
- color-mix: OK (iOS 16.2+), có fallback cho token quan trọng.

## Phases
| # | Phase | Owner | Dep |
|---|---|---|---|
| 1 | Foundation: tokens, fonts, Icon sprite + thay Lucide, base utilities, shell (dock, sidebar, top bars), page transitions | tokens/base/view-transitions css, layouts, shell, src/components/icon/*, package.json | — |
| 2a | Tab screens (Học tiếp, Lĩnh vực, domain, Tìm kiếm, Đã lưu, giới thiệu, 404) | pages tab, components/domain, islands tab | 1 |
| 2b | Reader (prose, hero, aside, focus mode, complete check-draw, lesson components) | pages/hoc, components/lesson, prose.css, islands reader, toc-scrollspy | 1 |
| 2c | ⌘K command palette island (dùng search index sẵn có) + mount vào 2 layout | components/command-palette/*, src/lib/command-palette-*.ts + test, 1 dòng mount trong app-layout/reader-layout | 1 |
| 3 | Review + fix, docs, screenshot after + design-preview.html | — | 2a,2b,2c |
| 4 | User duyệt design-preview → merge main + push | — | 3 |

## Acceptance
- pnpm test / check / build xanh; token-contrast test cập nhật theo token mới, không hạ ngưỡng 4.5:1 (text) / 3:1 (UI boundary).
- Không tràn ngang 320–1440; tap target >=44px; focus-visible; reduced motion = crossfade 120ms.
- Ảnh after vs concept: khớp ngôn ngữ thiết kế.
