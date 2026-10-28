---
phase: 5
title: "Phase 5: Player UI"
status: completed
priority: P1
effort: "2d"
dependencies: [2]
---

# Phase 5: Player UI (trình phát trên trang bài)

## Overview

Trang bài tải `/audio/manifest.json`. Có bản nghe cho bài thì hiện trình phát gồm card trong bài (mọi độ rộng) và mini bar cố định khi đang phát mà card đã cuộn khỏi màn hình. Sau mỗi heading `##` có trong bản nghe có nút "Nghe từ mục này" (mốc chính xác). Sau mỗi heading `###` có nút "Nghe từ đây" (mốc gần đúng, ước theo tỉ lệ ký tự). Không có bản (404, mạng lỗi, manifest hỏng, Railpack) thì mọi thứ giữ `hidden`. Không framework: logic thuần trong `src/lib` có test, binding DOM mỏng, vòng đời qua `onPageLoad`.

<!-- Updated: Validation Session 1 - bỏ bản tóm tắt ở aside, thêm nút ### gần đúng, sửa luồng phát cho iOS (red-team m7, M3, M4; quyết định người dùng 1) -->

Chỉ phụ thuộc phase 2 (`audio-manifest.ts`, `speech-script-queries.ts`), chạy song song với phase 3–4. Thử giao diện bằng manifest và file `.m4a` mẫu đặt tạm trong `dist/audio/`.

## Context links

- Trang bài: `src/pages/hoc/[domain]/[module]/[slug].astro:85-119` (thứ tự: LessonHeader `:92`, filler h2 `:105`, LessonToc `:106`, Disclaimer `:107`, `.lesson-body`), `data-lesson-id` ở `:87`.
- Quy ước nhiều bản sao trạng thái: `docs/design-guidelines.md:331-339`; mẫu bind nhiều bản: `src/components/islands/bookmark-button.astro:3,99` (`[data-bb]`). Plan này không thêm gì vào aside (`src/components/lesson/lesson-aside.astro` không bị sửa); card và mini bar dùng chung một controller.
- Vòng đời: `src/lib/page-lifecycle.ts:22` (`onPageLoad`, cleanup ở `astro:before-swap`); ClientRouter ở `src/layouts/reader-layout.astro:44` thay `<body>` mỗi lần điều hướng.
- Lưu trữ mẫu: `src/lib/user-prefs.ts:57-109` (`readPrefs`/`writePrefs` nhận `storage` inject, `safeLocalStorage()` cho private mode).
- Mini bar nằm trên dock: selector ở `src/components/lesson/reader-toast.astro:51-57`; token `--z-nav: 100`, `--z-overlay: 200`, `--z-toast: 300`, `--shell-tabbar-h`, `--shell-tabbar-gap` (`src/styles/tokens.css:163-170`).
- Giảm chuyển động: `src/lib/reduced-motion.ts:7` (`prefersReducedMotion()`, tính cả lựa chọn ở /toi).
- Icon: `src/components/icon/icon-paths.ts:11` (lưới 24px, nét 1.5, round, không fill), `src/components/icon/icon-names.ts` (`ICON_NAMES` lấy từ key), test `tests/icon-names.test.mjs`.
- A11y và hiệu năng: `docs/code-standards.md` mục A11y (44px, focus-visible, live region) và Performance (JS ≤ 30 KB gzip mỗi trang).
- Red-team: `./reports/red-team-261028-1156-plan-review.md` (M3 iOS, M4 mốc `###`, m7 aside).

## Requirements

### Hiển thị

- `[slug].astro` gắn `data-script-hash` (từ `getLessonSpeechScript`, phase 2; bài bị bộ trích bỏ qua thì không gắn và player không hiện) lên `<article class="lesson-article">`, và đặt `<LessonAudioPlayer>` giữa `LessonHeader` và filler/TOC. Mini bar đặt sau `</article>` trong slot mặc định; không sửa `reader-layout.astro`.
- Card (hiện ở mọi độ rộng, không mang `.hide-at-aside-width`): icon tai nghe, "Nghe bài", tổng thời lượng ("32 phút"), nút Phát/Tạm dừng, Lùi 15 giây, Tới 15 giây, `<select>` Tốc độ (0,75 / 1 / 1,25 / 1,5 / 1,75 / 2x), thời gian "12:03 / 32:10", danh sách mục (`<details>`, mỗi mục là nút, mục đang nghe có `aria-current="true"`; mốc `###` thụt lề một cấp và có hậu tố "(gần đúng)" cho trình đọc màn hình), ghi chú "Bản nghe của phiên bản trước" khi `entry.scriptHash` khác `data-script-hash`.
- Mini bar: chỉ hiện khi đang phát và card ngoài viewport (IntersectionObserver). Gồm Phát/Tạm dừng, Lùi 15 giây, tên mục, thời gian. Dưới 1024px nằm trên dock theo selector của reader-toast; `z-index: var(--z-nav)` (thấp hơn overlay và toast). Khi hiện thì thêm padding đáy cho `.reader-content` để không che chữ cuối bài.
- Nút theo heading (clone từ `<template>` render sẵn với `<Icon name="headphones">`), chèn làm phần tử anh em ngay sau heading:
  - `h2[id]` của mục có trong cả manifest entry lẫn trang (trừ `:intro`): "Nghe từ mục này", tua tới `startSec` chính xác.
  - `h3[id]` của mốc có trong cả manifest entry (`depth: 3`) lẫn trang: "Nghe từ đây", `aria-label` "Nghe từ đây (vị trí gần đúng)", tua tới `startSec` gần đúng. Áp dụng cả cho 13 bài không có `##`.
  - Mục hoặc mốc chỉ có trong bản cũ vẫn nằm trong danh sách nhưng không có nút trên trang; heading chỉ có trên trang mới thì không có nút.
  - Bấm: tua, phát, không cuộn trang.
- Icon mới trong `icon-paths.ts` (khối "extras"): `play`, `pause`, `skip-back-15`, `skip-forward-15`, `headphones`.

### Hành vi phát (an toàn cho iOS Safari)

<!-- Updated: Validation Session 1 - preload metadata, phát đồng bộ trong cử chỉ, tua sau loadedmetadata, đặt cả defaultPlaybackRate (red-team M3) -->
- Manifest: `fetch('/audio/manifest.json', { cache: 'no-cache' })` mỗi lần vào trang bài; 404, lỗi mạng, JSON hỏng, entry sai shape → `null` → không hiện gì. Dùng `parseAudioManifest` của phase 2.
- `<audio preload="metadata">` duy nhất. Gán `src = /audio/<file>` ngay khi tìm được entry của bài (trình duyệt chỉ tải phần đầu file, vài KB, nhờ `+faststart`), không đợi lần bấm đầu. Nhờ vậy lúc người dùng bấm, phần tử đã có nguồn và `play()` có thể gọi ngay.
- Mọi thao tác bắt đầu phát (Phát, chọn mục, chọn mốc, Nghe tiếp) gọi `audio.play()` đồng bộ ngay trong handler của cử chỉ người dùng, không có `await` hay `setTimeout` nào đứng trước, vì iOS chỉ cho phát khi lời gọi còn nằm trong cử chỉ.
- Tua: nếu `audio.readyState >= 1` (HAVE_METADATA) thì đặt `currentTime` ngay; nếu chưa thì lưu `pendingSeek` và áp dụng ở sự kiện `loadedmetadata` (iOS bỏ qua hoặc ném lỗi khi đặt `currentTime` trước khi có metadata). `pendingSeek` mới ghi đè cái cũ; vị trí khôi phục từ storage cũng đi qua cùng đường này.
- Tốc độ: mỗi lần đổi tốc độ và sau mỗi lần gán `src` (kể cả ở `loadedmetadata`), đặt cả `playbackRate` và `defaultPlaybackRate`, vì Safari đặt lại `playbackRate` theo `defaultPlaybackRate` khi nạp nguồn.
- Vị trí nghe: khoá mới `omnilab:v1:audio` = `{ v: 1, rate, byLesson: { [lessonId]: { t, key, at } } }`. Không thêm vào `LessonProgress` và không đồng bộ lên server. Khôi phục `t` chỉ khi `key` bằng `audioKey` hiện tại và `t` còn cách cuối > 5 giây. Lưu khi tạm dừng, mỗi ~5 giây khi đang phát, `visibilitychange` hidden, `pagehide`, và trong cleanup `astro:before-swap`. Phát hết thì xoá vị trí bài đó. Giữ tối đa 50 bài gần nhất theo `at`. `rate` là lựa chọn chung cho mọi bài, kẹp 0,75–2. Private mode: storage lỗi → chạy trong bộ nhớ, không throw.
- Điều hướng sang trang khác: cleanup gọi `audio.pause()` trước khi body bị thay (phần tử bị tháo ra vẫn có thể phát tiếp nếu không pause), lưu vị trí, gỡ handler Media Session. Âm thanh dừng khi chuyển trang là hành vi đã chấp nhận.
- Media Session (nếu có `navigator.mediaSession`): metadata `title` = tên bài, `artist` = "OmniLab", `album` = tên lĩnh vực, artwork `/icons/icon-192.png`, `/icons/icon-512.png`; handler `play`, `pause`, `seekbackward`, `seekforward` (15 giây), `seekto`; `setPositionState` bọc try/catch.
- `play()` bị từ chối (chính sách autoplay) hoặc `<audio>` lỗi tải → trạng thái tạm dừng, thông báo "Không phát được bản nghe. Thử lại sau." trong live region và card.
- Live region `aria-live="polite"` (sr-only) báo: đang phát, đã tạm dừng, đã chuyển tới mục X, tốc độ mới, lỗi.
- Nút ≥ 44px, `:focus-visible` theo token, nhãn `aria-label` cho nút chỉ có icon, nút Phát/Tạm dừng dùng `aria-pressed` hoặc đổi nhãn. Giảm chuyển động: mini bar hiện/ẩn tức thì, không trượt.

## Related code files

| Thao tác | File |
|---|---|
| Create | `src/lib/audio-player-logic.ts` (`formatClock`, `chapterIndexAt`, `clampRate`, `PLAYBACK_RATES`, `skipTarget`, `resolveAudioView(entry, pageHash, pageHeadingIds)` trả mục `##` và mốc `###` có nút) |
| Create | `src/lib/audio-position-store.ts` (`AUDIO_STORAGE_KEY`, đọc/ghi có storage inject, giới hạn 50) |
| Create | `src/lib/audio-manifest-client.ts` (fetch inject, trả entry của bài hoặc `null`) |
| Create | `src/lib/audio-player-controller.ts` (điều khiển một đối tượng kiểu audio inject; `pendingSeek`; đặt cả hai tốc độ; lưu vị trí có throttle; Media Session qua adapter inject) |
| Create | `src/lib/audio-player-binding.ts` (DOM: bind card và mini bar `[data-audio-ui]`, chèn nút sau `h2`/`h3`, live region) |
| Create | `src/components/islands/lesson-audio-player.astro` (card, `<audio preload="metadata">`, `<template>` nút heading, `<script>` gọi `onPageLoad`) |
| Create | `src/components/islands/lesson-audio-mini-bar.astro` |
| Create | `tests/audio-player-logic.test.mjs`, `tests/audio-position-store.test.mjs`, `tests/audio-manifest-client.test.mjs`, `tests/audio-player-controller.test.mjs` |
| Modify | `src/pages/hoc/[domain]/[module]/[slug].astro` (`data-script-hash`, chèn player và mini bar) |
| Modify | `src/components/icon/icon-paths.ts` (5 icon) |
| Modify | `tests/icon-names.test.mjs` (kiểm 5 icon mới có markup) |

## Implementation steps

1. Tìm trước khi viết: grep `formatDuration`, `mm:ss`, `padStart(2`, `mediaSession`, `IntersectionObserver`, `aria-live` trong `src/` để dùng lại (ví dụ helper định dạng thời gian, cách reader-toast dùng live region).
2. Icon: vẽ 5 glyph theo đúng quy tắc của `icon-paths.ts`; cập nhật test icon.
3. Test đỏ rồi viết `audio-player-logic.ts`: `formatClock` (0, 59, 61, ≥ 1 giờ, `NaN` → "0:00"); `chapterIndexAt` (trước mục đầu, đúng ranh giới, mục cuối, có mốc `###` xen giữa); `clampRate`; `skipTarget` kẹp trong [0, duration]; `resolveAudioView` (cờ phiên bản trước, giao id heading cho cả `h2` và `h3`, bỏ `:intro`, bài chỉ có "Mở đầu" + mốc `###`, mốc có `approx`).
4. Test đỏ rồi viết `audio-position-store.ts` (rỗng, JSON hỏng, sai `v`, ghi/đọc, cắt còn 50, storage ném lỗi, `rate` ngoài khoảng bị kẹp) và `audio-manifest-client.ts` (404, lỗi mạng, JSON hỏng, có/không có entry, gọi với `cache: 'no-cache'`).
5. Test đỏ rồi viết `audio-player-controller.ts` với audio giả mô phỏng hành vi Safari (khởi đầu `readyState = 0`; đặt `currentTime` khi `readyState = 0` bị bỏ qua; gán `src` đặt lại `playbackRate` về `defaultPlaybackRate`; `loadedmetadata` bắn bất đồng bộ), store giả, Media Session giả:
   - Có entry → `src` được gán ngay, `preload` là `metadata`, chưa gọi `play()`.
   - Bấm Phát → `play()` được gọi đồng bộ trong handler (kiểm bằng cờ ghi lại trước khi handler trả về).
   - Chọn mục khi `readyState = 0` → `play()` gọi ngay, `currentTime` chỉ được đặt sau `loadedmetadata` và bằng `startSec`; chọn hai mục liên tiếp trước metadata → áp dụng mục sau.
   - Tốc độ 1,5 → sau `loadedmetadata` cả `playbackRate` và `defaultPlaybackRate` là 1,5.
   - Khôi phục vị trí khi khoá khớp, không khôi phục khi khác; ±15 giây kẹp; đổi tốc độ được lưu; hết bài xoá vị trí; `play()` bị từ chối → tạm dừng + thông báo; `dispose()` pause và lưu vị trí.
6. Viết `audio-player-binding.ts` và hai component; nối vào `[slug].astro`. CSS dùng token sẵn có, không màu cứng.
7. `pnpm test`, `pnpm check`, `pnpm build`. Kiểm `dist/**/*.html` không có `<script>` inline (quy ước CSP) và mọi trang bài có `data-script-hash`.
8. Thử trên trình duyệt thật (Playwright hoặc Chrome DevTools, không thêm dependency vào repo): sau `pnpm build`, đặt tạm `dist/audio/manifest.json` và một file `.m4a` mẫu (lấy từ lần thử thật ở phase 3, hoặc tạo bằng ffmpeg bản static ngoài repo), rồi `pnpm preview`. Kiểm ở 390px và 1280px, sáng và tối:
   - Không có `dist/audio/` → không thấy player, không lỗi console ngoài 404 của manifest.
   - Có bản → card hiện ở cả hai độ rộng; Phát, ±15 giây, tốc độ, danh sách mục (mốc `###` thụt lề), nút "Nghe từ mục này" sau `h2` và "Nghe từ đây" sau `h3` hoạt động; mini bar hiện khi cuộn qua card, nằm trên dock, ẩn khi dock ẩn thì xuống đúng chỗ.
   - Một bài không có `##` (ví dụ `tai-chinh/lo-trinh-12-tuan/tuan-12`) với manifest mẫu có mốc `###` → có nút "Nghe từ đây".
   - Mở trang, bấm ngay một mục giữa bài trước khi metadata về (throttle mạng "Slow 3G") → phát từ đúng mục.
   - Đổi `scriptHash` trong manifest mẫu → thấy "Bản nghe của phiên bản trước".
   - Tải lại trang → khôi phục vị trí; chuyển sang bài khác → âm thanh dừng; quay lại → vị trí còn.
   - Bàn phím: Tab qua mọi nút, focus ring rõ; bật giảm chuyển động ở /toi → mini bar không trượt.
   - Xoá file mẫu khỏi `dist/` sau khi thử.
   - Kiểm trên iPhone thật nằm trong checklist VPS ở phase 4.
9. Đo JS: tổng gzip các file `/_astro/*.js` mà một trang bài tải, trước và sau thay đổi; phải ≤ 30 KB.

## Todo

- [x] 5 icon + test
- [x] `audio-player-logic.ts` + test (gồm mốc `###`)
- [x] `audio-position-store.ts`, `audio-manifest-client.ts` + test
- [x] `audio-player-controller.ts` + test (audio giả kiểu Safari, `readyState = 0`)
- [x] `audio-player-binding.ts`, `lesson-audio-player.astro`, `lesson-audio-mini-bar.astro`
- [x] Nối vào `[slug].astro`
- [x] Thử trình duyệt thật theo bước 8 (Chrome headless qua agent-browser; Slow 3G thay bằng nạp lại src để readyState = 0; iPhone thật thuộc phase 4)
- [x] Đo JS budget (trang bài 32,8 KB → 37,5 KB gzip; baseline đã vượt 30 KB, xem reports/dev-phase-05-261028-1402.md)

## Success criteria

- `pnpm test` xanh (4 file test mới + test icon cập nhật); `pnpm check` 0 lỗi; `pnpm build` thành công.
- Test controller chứng minh: `play()` luôn được gọi đồng bộ trong cử chỉ; tua trước metadata được áp dụng ở `loadedmetadata`; tốc độ giữ nguyên sau khi gán `src`.
- 78 trang bài có `data-script-hash`; không có `<script>` inline mới trong `dist/**/*.html`; `src/components/lesson/lesson-aside.astro` không đổi.
- Không có manifest → 0 phần tử player hiển thị (kiểm bằng trình duyệt thật).
- Mọi tình huống ở bước 8 đạt; JS trang bài ≤ 30 KB gzip.
- `localStorage` chỉ có thêm khoá `omnilab:v1:audio`; `omnilab:v1:state` không đổi shape.

## Risk assessment

| Rủi ro | Khả năng × Tác động | Giảm thiểu |
|---|---|---|
| iOS Safari không phát, không tua hoặc mất tốc độ | Trung bình × Cao | `preload="metadata"` và `src` gán sớm; `play()` đồng bộ trong cử chỉ; `pendingSeek` ở `loadedmetadata`; đặt cả `defaultPlaybackRate`; test audio giả kiểu Safari; kiểm iPhone thật ở checklist phase 4. |
| Audio vẫn phát sau khi chuyển trang (phần tử bị tháo nhưng chưa pause) | Trung bình × Trung bình | Cleanup luôn `pause()`; có test controller cho `dispose()`; kiểm ở bước 8. |
| `preload="metadata"` tốn băng thông khi chỉ mở trang | Thấp × Thấp | Chỉ phần đầu file (moov ở đầu nhờ `+faststart`); không có bản nghe thì không gán `src`. |
| Mốc `###` lệch vài giây gây hiểu nhầm | Chắc chắn × Thấp | Nhãn và danh sách ghi rõ "gần đúng"; worker lùi mốc 1 giây. |
| Mini bar che toast hoặc chữ cuối bài | Trung bình × Thấp | Toast z-index cao hơn nên nổi lên trên khi hiện; thêm padding đáy khi mini bar hiện. |
| Nút theo heading làm lệch bố cục heading/đánh số prose | Thấp × Thấp | Chèn làm phần tử anh em sau heading, không nằm trong heading; kiểm trực quan bước 8. |
| Manifest lớn dần | Thấp × Thấp | ~78 entry, mốc `###` thêm vài KB, gzip qua Caddy, revalidate bằng ETag. |

## Security

- Client chỉ đọc file tĩnh cùng origin; không có key hay endpoint server mới. CSP không đổi (`<audio>` cùng origin hợp lệ theo `default-src 'self'`).
- Chỉ dựng URL từ `file` đã qua `AUDIO_FILE_PATTERN`; mọi chữ từ manifest (tên mục, tên mốc) gán bằng `textContent`, không `innerHTML`.
- Vị trí nghe chỉ lưu trên máy, không gửi đi.

## Rollback

Gỡ `<LessonAudioPlayer>` và mini bar khỏi trang; các module mới không còn được import. Khoá `omnilab:v1:audio` còn sót trên máy người dùng vô hại.
