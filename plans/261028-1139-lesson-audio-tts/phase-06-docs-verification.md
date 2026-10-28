---
phase: 6
title: "Phase 6: Docs verification"
status: in-progress
priority: P2
effort: "0.75d"
dependencies: [1, 2, 3, 4, 5]
---

# Phase 6: Docs, kiểm tra toàn bộ và đẩy lên main

## Overview

Cập nhật tài liệu cho tính năng nghe bài (người đọc, người viết bài, người vận hành VPS), chạy toàn bộ gate, rồi commit và push lên `main` (không force) theo quyết định của người dùng. Tài liệu ghi rõ những gì chỉ kiểm được trên VPS hoặc iPhone thật.

<!-- Updated: Validation Session 1 - dùng --retry-failed thay xoá state.json, thư mục host riêng, ghi nhận chấp nhận điều khoản EEA/UK/CH, nút ### gần đúng, kiểm iPhone, bước commit và push main (quyết định người dùng 1, 3, 4; red-team M2, m3) -->

## Context links

- `README.md:16-28` (Tính năng), `:30-47` (Chạy local), `:64-68` (Deploy).
- `docs/system-architecture.md:73` (Client state), `:92-121` (sync sidecar, "ba stage" ở `:121`), `:216` (Sao lưu), `:255` (Security CSP).
- `docs/codebase-summary.md:20` (cấu trúc thư mục), `:92` (Client state), `:104` (Build), `:116` (Testing).
- `docs/deployment-vps-guide.html:147` (bảng compose "2 service"), `:154-174` (chương 2: `.env`, thư mục dữ liệu), `:283-312` (vận hành, lệnh hay dùng), `:313` (sao lưu), `:382` (xử lý sự cố), `:407` (câu hỏi còn mở).
- `docs/deployment-guide.md:57-101` (smoke test Railpack).
- `docs/project-roadmap.md:3` (mục mới nhất), `:50` (Ứng viên v2), `:65` (Việc còn mở).
- `docs/content-authoring-guide.md:190` (ReviewNote), `:207` (lĩnh vực tự biên soạn).
- `docs/code-standards.md:196` (quy ước server, hiện chỉ nhắc `server/sync/`).

## Requirements

| File | Nội dung cần thêm/sửa |
|---|---|
| `README.md` | Tính năng "Nghe bài" (giọng Gemini, tự tạo nền, ẩn khi chưa có, nút theo mục `##` chính xác và theo mốc `###` gần đúng); lệnh `pnpm tts:sample`, `pnpm tts:dev`; Deploy: VPS có thêm sidecar `tts`, Railpack không có bản nghe |
| `docs/system-architecture.md` | Mục mới "Bản nghe bài học (tts sidecar)": luồng build → worker → Caddy → client, hai mã băm, thư mục host riêng `${OMNILAB_AUDIO_DIR:-/srv/data/omnilab-audio}` (tts ghi, app chỉ mount `public/` chỉ đọc), xử lý quota, kiểm audio (thử lại khi thiếu audio, kiểm thời lượng), luật dọn dẹp an toàn (ngưỡng, giữ 30 ngày, giữ bản cũ 24 giờ), mốc `###` gần đúng; Dockerfile bốn stage `build → sync → tts → app`; build tts không chặn deploy site; Client state thêm `omnilab:v1:audio`; CSP: `<audio>` dùng `default-src 'self'` |
| `docs/codebase-summary.md` | `server/tts/` (gồm `audio-gc.ts`), các module `src/lib/speech-script-*`, `audio-*`, component player, test mới |
| `docs/deployment-vps-guide.html` | Bảng compose 3 service; `.env` thêm `GEMINI_API_KEY` (tuỳ chọn), `TTS_VOICE`, `OMNILAB_AUDIO_DIR` (tuỳ chọn); kiểm `df -h` còn ≥ 1 GB; lệnh `sudo install -d -o 1000 -g 1000 -m 755 /srv/data/omnilab-audio /srv/data/omnilab-audio/public`; xem log `docker compose logs -f tts` và ý nghĩa các sự kiện (gồm `gc_refused`, `scripts_invalid`, `chunk_outlier`); thử lại bài lỗi bằng `docker compose exec tts node server/tts/tts-worker-entry.ts --retry-failed <lessonId>` (worker nhận ở vòng sau; không xoá `state.json`); bài lỗi tự thử lại sau 7 ngày; tạm dừng quota tự hết ở 0h Los Angeles; bản nghe sinh lại được nhưng tốn lại quota nên không nằm trong backup DB; deploy có thể làm mất một request quota đang chạy; build tts lỗi chỉ in `WARN`, site vẫn lên; checklist kiểm `/audio` (header `audio/mp4`, 206, 404 cho `work/`) và kiểm trên iPhone thật; sự cố: thư mục audio thuộc root, key sai (`auth`), không ra Internet; đổi giọng hoặc model thì mọi bài được tạo lại dần; mục "Điều khoản free tier" ghi rằng chủ dự án đã chấp nhận vùng xám điều khoản Gemini free tier cho EEA/UK/CH (ngày 2026-10-28), chỉ gửi bài học công khai, Google có thể dùng nội dung gửi lên để cải thiện sản phẩm |
| `docs/deployment-guide.md` | Railpack không có tts: `/audio/manifest.json` 404, nút nghe ẩn; thêm dòng smoke test cho URL này |
| `docs/project-roadmap.md` | Mục "Nghe bài học (2026-10-28)" và việc còn mở (đợt tạo đầu theo quota, khoảng 23–50 ngày; giọng đã chọn) |
| `docs/content-authoring-guide.md` | Mục "Bản nghe": khối nào được đọc/bỏ (theo bảng quy tắc ở phase 2); `##` tạo mục có nút chính xác, `###` tạo mốc có nút gần đúng; sửa bài thì `scriptHash` đổi và cả bài được tạo lại (tốn lại số request của cả bài; trang hiện bản cũ kèm ghi chú trong lúc chờ); viết caption Figure đủ nghĩa vì đó là phần duy nhất được đọc; bộ trích lỗi ở một bài thì bài đó chỉ mất bản nghe và build in cảnh báo `[tts-scripts]`; khi đổi quy tắc đọc phải tăng `SPEECH_EXTRACTOR_VERSION` |
| `docs/code-standards.md` | Quy ước server áp dụng cho cả `server/tts/`; tiến trình con (ffmpeg) chỉ nhận env tối thiểu; module dùng chung mới `speech-script-contract.ts`, `audio-manifest.ts` phải thuần |

Tài liệu viết tiếng Việt có dấu, câu đầy đủ; không ghi mã plan/phase trong tài liệu sản phẩm.

## Implementation steps

1. Đọc lại code đã merge của phase 1–5 để tài liệu khớp tên biến env, sự kiện log, cờ CLI, đường dẫn thật (không chép từ plan).
2. Cập nhật từng file ở bảng trên.
3. Chạy gate đầy đủ:
   ```bash
   pnpm verify:fidelity
   pnpm test
   pnpm check
   pnpm check:server
   pnpm build
   ```
4. Kiểm sau build: lệnh kiểm id mục và mốc ở phase 2; `dist/tts-scripts.json` có 78 bài; mọi trang bài có `data-script-hash`; không có `<script>` inline; log build không có `[tts-scripts]`.
5. Kiểm bí mật: `git grep -n "AIza"` rỗng (tiền tố thường gặp của Google API key); `git status --porcelain` không có `.env.local`, `.tts-samples/`, `.data/`; `grep -rn "GEMINI_API_KEY" dist` rỗng.
6. Nếu máy có Docker: `docker build --target sync .`, `docker build --target tts --build-arg SITE_URL=http://localhost:8080 .`, `docker build --build-arg SITE_URL=http://localhost:8080 .` (ra stage `app`), `docker compose config`. Không có Docker thì ghi "chưa kiểm tra trên máy dev" và trỏ tới checklist VPS ở phase 4.
7. Commit và push (quyết định người dùng 4): chỉ khi mọi gate ở bước 3–5 xanh.
   - `git status` để chắc chỉ có file thuộc tính năng; không thêm `.env*`, `.tts-samples/`, `.data/`, `dist/`.
   - Chia commit theo nhóm có nghĩa, dùng conventional commit (ví dụ `feat(tts): ...`, `feat(player): ...`, `chore(deploy): ...`, `docs: ...`). Message không chứa mã plan, mã phase hay mã finding, không có dấu vết AI.
   - `git push origin main` (không `--force`, không `--force-with-lease`). Push bị từ chối vì remote có commit mới thì `git pull --rebase` rồi chạy lại gate trước khi push; xung đột thì dừng và báo người dùng.
8. Tổng hợp báo cáo cuối: tách "Đã xác minh" và "Chưa kiểm tra" (VPS, iPhone thật, đợt tạo đầu theo quota), kèm hash commit đã push.

## Todo

- [x] README
- [x] system-architecture, codebase-summary, code-standards
- [x] deployment-vps-guide.html (gồm mục điều khoản free tier), deployment-guide.md
- [x] project-roadmap, content-authoring-guide
- [x] Gate đầy đủ + kiểm sau build + kiểm bí mật
- [x] Docker build các target: chưa kiểm tra (máy dev không có Docker), người dùng chạy trên VPS
- [ ] Commit và push `main` (không force)
- [ ] Báo cáo cuối

## Success criteria

- 5 lệnh gate ở bước 3 đều xanh.
- Bước 4 và 5 đạt.
- Tài liệu nhắc đúng tên env, lệnh, cờ CLI, đường dẫn đang có trong code (kiểm chéo bằng grep từng tên env trong `server/tts/tts-config.ts` và cờ `--retry-failed` trong `server/tts/tts-worker-entry.ts`).
- `grep -n "state.json" docs/deployment-vps-guide.html` không còn hướng dẫn xoá file này.
- `git log origin/main -1` trùng commit cuối của tính năng; `git status` sạch.
- Báo cáo cuối liệt kê rõ các mục chỉ kiểm được trên VPS và iPhone thật.

## Risk assessment

| Rủi ro | Khả năng × Tác động | Giảm thiểu |
|---|---|---|
| Tài liệu lệch code (tên env, lệnh) | Trung bình × Trung bình | Bước 1 đọc code thật; tiêu chí kiểm chéo bằng grep. |
| Người vận hành quên tạo thư mục audio | Trung bình × Thấp | Lệnh nằm trong chương thiết lập và trong bảng sự cố; worker log hướng dẫn. |
| Push làm Railpack hoặc VPS build lỗi | Thấp × Cao | Chỉ push sau khi `pnpm build` xanh; bộ trích không làm vỡ build; build tts lỗi không chặn site. |
| Lỡ commit bí mật | Thấp × Cao | Bước 5 trước bước 7; `git status` kiểm danh sách file trước khi commit. |

## Security

- Tài liệu chỉ dùng giá trị mẫu (`GEMINI_API_KEY=...`), không dán key thật hay log `docker compose config`.
- Ghi chú free tier: Google được dùng nội dung gửi lên để cải thiện sản phẩm; chỉ gửi bài học công khai. Chủ dự án đã chấp nhận vùng xám điều khoản cho EEA/UK/CH; ghi nhận này nằm ở tài liệu deploy, không còn là câu hỏi mở.

## Rollback

Revert commit tài liệu; không ảnh hưởng runtime. Rút lại toàn bộ tính năng sau khi push: `git revert` các commit của tính năng (không rewrite lịch sử), rồi deploy lại.
