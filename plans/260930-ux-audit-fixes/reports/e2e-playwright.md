# E2E (Playwright Chromium, pnpm preview) — 2026-09-30

Note: tester subagent report (test-report.md) is static-analysis only; this file is the real-browser run.

| Check | Result |
|---|---|
| Zoom: button opens dialog, svg 720px wide, close icon 22px | pass |
| Duplicate ids while dialog open | none |
| Esc closes, svg restored, focus back on "Phóng to hình" | pass |
| Tap on diagram host opens dialog | pass |
| TOC summary / link height | 44 / 45.5px |
| Mark-complete accessible name = visible "Hoàn thành bài học", aria-pressed toggles | pass |
| Toast stays while undo focused >5s; undo returns focus to toggle | pass |
| Search input name "Tìm kiếm bài học" | pass |
| Index fetch aborted → error + status "Không tải được dữ liệu tìm kiếm." → retry → "14 kết quả" | pass |
| Horizontal overflow, 57 pages × {375×812, 844×390} | 0 (after inline-code fix; was 115px on pastebin lesson) |
| axe-core wcag2a/aa/21aa/22aa on /, /linh-vuc/tai-chinh/, /tim-kiem/, lesson, /da-luu/ (+ dark tai-chinh) | 0 violations |

Not covered: real iOS Safari (safe-area in landscape, standalone), VoiceOver browse mode.
