---
title: "Nghe bài học bằng Gemini TTS"
description: "Sidecar tts trên VPS tự chuyển bài học thành bản nghe (Gemini TTS free tier, đợi hạn mức), Caddy phục vụ /audio, trình phát trên trang bài; Railpack vẫn build, player ẩn"
status: in-progress
priority: P2
effort: 8.5d
branch: main
tags: [feature, backend, frontend, infra, tts]
blockedBy: []
blocks: []
created: 2026-10-28
---

# Nghe bài học bằng Gemini TTS

## Overview

Nguồn: [brainstorm](../reports/brainstorm-261028-1127-lesson-audio-tts.md), [nghiên cứu Gemini TTS](../reports/researcher-261028-1127-gemini-tts-api.md), [scout](../reports/scout-261028-1127-lesson-audio-integration.md), [red-team](./reports/red-team-261028-1156-plan-review.md). Các quyết định người dùng đã chốt trong brainstorm và ở Validation Log không mở lại.

<!-- Updated: Validation Session 1 - thư mục host riêng, bỏ aside, mốc ### gần đúng, effort 8,5d, commit và push main -->

```
build (astro)  MDX ─► speech-script-extract ─► dist/tts-scripts.json  (+ data-script-hash trên trang bài)
                 (lỗi một bài → bỏ bài đó + cảnh báo)  │ COPY vào image tts
VPS compose    tts (Node 24 + ffmpeg, mạng egress) ──► Gemini POST /v1beta/interactions (x-goog-api-key, store:false)
                 │ PCM từng đoạn (fsync): <audio dir>/work/…   429 theo ngày → ngủ tới 0h Los Angeles
                 └─► <audio dir>/public/{manifest.json, <bài>.<key>.m4a}
               app (Caddy, chỉ mount <audio dir>/public, chỉ đọc) ── /audio/* ──► trình duyệt
trình duyệt    GET /audio/manifest.json: có bản → player (card + mini bar); 404/thiếu → ẩn
<audio dir> = ${OMNILAB_AUDIO_DIR:-/srv/data/omnilab-audio} trên host, /data/audio trong tts
```

- Hai mã băm: `scriptHash` (văn bản đọc + phiên bản bộ trích, tính lúc build, gắn lên trang) và `audioKey` (`scriptHash` + model + voice + style + cỡ đoạn, tính ở worker). Lệch `scriptHash` thì hiện "Bản nghe của phiên bản trước"; lệch `audioKey` thì worker tạo lại cả bài.
- Thư mục host riêng `${OMNILAB_AUDIO_DIR:-/srv/data/omnilab-audio}`, tách khỏi dữ liệu sync: tts ghi cả thư mục, app chỉ mount `public/` ở chế độ chỉ đọc. Caddy chỉ phục vụ tên file khớp regex.
- Mục `##` có mốc chính xác (ranh giới đoạn); mốc `###` gần đúng, ước theo tỉ lệ ký tự trong đoạn, không tốn thêm request.
- Đợt tạo đầu: ~450–500 request cho 78 bài; 10–20 request/ngày → khoảng 23–50 ngày.
- Tổng effort ≈ 8,5d (0,75 + 1,5 + 2,5 + 1 + 2 + 0,75).
- Khi triển khai xong và mọi gate xanh: commit và push `main`, không force (quyết định người dùng 4; bước cuối của phase 6).
## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Start](./phase-01-start.md) | Pending |
| 2 | [Phase 2: Speech script extraction](./phase-02-speech-script-extraction.md) | Pending |
| 3 | [Phase 3: TTS worker](./phase-03-tts-worker.md) | Pending |
| 4 | [Phase 4: Infra deploy](./phase-04-infra-deploy.md) | Pending |
| 5 | [Phase 5: Player UI](./phase-05-player-ui.md) | Pending |
| 6 | [Phase 6: Docs verification](./phase-06-docs-verification.md) | Pending |

Thứ tự: (1 ∥ 2) → 3 → 4; phase 5 chỉ cần phase 2 nên chạy song song với 3–4; phase 6 sau cùng. Phase 1 ("Start") là bước khởi động: Gemini client, `tts:sample`, hiệu chỉnh bằng key thật của người dùng, chốt giọng và cỡ đoạn trước khi worker chạy hàng loạt. Không có hai phase song song nào sửa cùng một file.

## Success Criteria

<!-- Updated: Validation Session 1 - tiêu chí cho mốc ###, dọn dẹp an toàn, kiểm audio, iOS, build không vỡ, push main -->

- [ ] Bài có bản nghe hiện trình phát (card + mini bar): phát/dừng, tua ±15 giây, tốc độ 0,75–2x, danh sách mục, nút "Nghe từ mục này" ở heading `##` (mốc chính xác) và nút "Nghe từ đây" ở heading `###` (mốc gần đúng, kể cả 13 bài không có `##`), nhớ vị trí nghe dở (`omnilab:v1:audio`), điều khiển ở màn hình khoá.
- [ ] Trên iPhone thật (Safari): bấm mục trước khi audio tải xong vẫn phát đúng chỗ; tốc độ đã chọn giữ nguyên sau khi tua.
- [ ] Deploy một bài mới: worker tự nhận ra và tạo bản nghe, không cần lệnh tay.
- [ ] 429 theo ngày: worker ghi log, ngủ tới 0h Los Angeles cộng jitter, chạy tiếp từ đoạn dở, không mất đoạn đã tạo (kể cả khi container bị tạo lại).
- [ ] Sửa nội dung bài: worker tạo lại cả bài; trong lúc chờ, trang phát bản cũ kèm "Bản nghe của phiên bản trước".
- [x] `tts-scripts.json` rỗng, hỏng, hoặc làm mất nhiều hơn max(5 bài, 10% số bài có bản nghe): manifest và file audio giữ nguyên (có test); bài biến mất giữ bản nghe 30 ngày.
- [x] Audio thiếu hoặc thời lượng bất thường không lọt vào manifest mà không qua thử lại có giới hạn; bài lỗi tự thử lại sau 7 ngày hoặc bằng `--retry-failed <lessonId>`.
- [x] Bộ trích lỗi ở một bài hoặc build tts lỗi không làm hỏng build/deploy site.
- [x] Có test cho MDX → văn bản đọc (gồm mốc `###`), chia đoạn, mốc reset, phân loại 429, chọn bài cần tạo, dọn dẹp an toàn, kiểm audio, logic player (audio giả kiểu Safari).
- [x] Gate xanh: `pnpm verify:fidelity`, `pnpm test`, `pnpm check`, `pnpm check:server`, `pnpm build`.
- [ ] Thiếu `GEMINI_API_KEY`, worker dừng, hoặc deploy Railpack: site chạy bình thường, nút nghe ẩn; `docker build .` vẫn ra site tĩnh.
- [ ] API key chỉ nằm trong `.env` trên VPS và `.env.local` máy dev; không có trong git, `dist/`, image, log, env của ffmpeg; request gửi `store: false`.
- [x] Code đã commit và push `main` (không force) sau khi gate xanh.

Ngoài phạm vi: trả phí Gemini; chọn giọng trong app; nghe offline; chữ chạy theo giọng; viết lại bài bằng LLM; phát tiếp khi chuyển trang (audio dừng khi điều hướng, đã chấp nhận); cache theo từng đoạn khi sửa bài; bản tóm tắt player ở aside.

## Câu hỏi còn mở

<!-- Updated: Validation Session 1 - bỏ câu EEA (đã chấp nhận), thêm ổ đĩa VPS và cách tính quota cho lỗi -->

1. RPD/RPM free tier thực tế của `gemini-3.8-flash-tts` trên project của người dùng (xem trong AI Studio ở phase 1); con số này định lịch đợt đầu (~450–500 request, khoảng 23–50 ngày nếu 10–20 request/ngày).
2. Giọng cuối cùng: người dùng nghe mẫu `tts:sample` rồi chọn (Algenib, Charon, Alnilam, Orus hoặc giọng thư viện mở rộng).
3. Extended Voice Library (`GET /v1beta/voices`) có dùng được với key free và tiếng Việt không; chỉ biết sau `tts:sample --list-voices`.
4. Chuỗi `quotaId` thật trong body 429 của model TTS (mới có mẫu của model LLM). Worker phân loại theo chuỗi con `PerDay`/`PerMinute` và ghi log body 429 đầu tiên để chốt.
5. Ổ đĩa VPS còn trống bao nhiêu; plan cần ≥ 1 GB (đỉnh ~300 MB PCM dở + ~280 MB AAC + bản cũ trong thời gian giữ). Kiểm bằng `df -h` trong checklist phase 4.
6. Phản hồi 5xx hoặc 200 thiếu audio có bị tính vào RPD không; ghi lại khi chạy thật ở phase 1 (U6) và trên VPS.

## Validation Log

### Session 1 (2026-10-28)

Nguồn: [red-team](./reports/red-team-261028-1156-plan-review.md) (0 Blocker, 4 Major, 10 Minor) và quyết định của người dùng ngày 2026-10-28.

**Quyết định người dùng (đã khoá):**

1. Nút theo heading: nút ở `##` là chính xác (đầu mục); nút ở `###` là gần đúng, ước theo tỉ lệ ký tự trong mục `##` chứa nó, không thêm request Gemini. 13 bài không có `##` vẫn có nút `###`. Giải quyết M4.
2. Sửa bài thì tạo lại cả bài; không làm cache theo từng đoạn. Giải quyết m9.
3. Chủ dự án chấp nhận vùng xám điều khoản free tier cho EEA/UK/CH. Ghi vào tài liệu deploy (phase 6), bỏ khỏi câu hỏi mở. Giải quyết m10.
4. Triển khai xong và gate xanh thì commit và push `main`, không force (phase 6 bước 7).

**Xử lý từng phát hiện red-team:**

| Mã | Nội dung | Xử lý | Phase |
|---|---|---|---|
| M1 | GC có thể xoá cả kho audio | Văn bản đọc hỏng/rỗng → không dọn, log, ngủ (không crash-loop); mất > 10% hoặc > 5 bài → `gc_refused`; bài biến mất giữ 30 ngày; bản cũ giữ 24 giờ; kiểm tham chiếu ngay trước khi xoá; module `audio-gc.ts` có test riêng | 3 |
| M2 | Không kiểm audio, lỗi vĩnh viễn | Kind `no_audio` thử lại 3 lần có backoff; kiểm thời lượng/ký tự trong [0,5×; 2×] theo `charsPerSec` đo ở phase 1, tạo lại đúng một lần; `--retry-failed <lessonId>`; bài lỗi tự thử lại sau 7 ngày | 1, 3, 6 |
| M3 | iOS tua trước `loadedmetadata` | `preload="metadata"`, gán `src` khi có entry; `play()` đồng bộ trong cử chỉ; `pendingSeek` ở `loadedmetadata`; đặt cả `playbackRate` và `defaultPlaybackRate`; audio giả `readyState = 0`; kiểm iPhone thật | 4, 5 |
| M4 | Thu hẹp nút xuống chỉ `##` | Theo quyết định 1: mốc `###` gần đúng (`marks` trong văn bản đọc, `depth`/`approx` trong manifest) | 2, 3, 5 |
| m1 | Toàn vẹn khi chạy tiếp | fsync file đoạn và manifest trước rename, fsync thư mục; `meta.json` lưu `textSha256` + `bytes` từng đoạn; chạy tiếp từ chỉ số đầu tiên thiếu/sai | 3 |
| m2 | Ước tính đĩa sai | Ưu tiên bài đang dở; tối đa 2 thư mục work; dọn work có khoá lỗi thời; dọn `manifest.invalid-*` > 30 ngày; ước lại đỉnh ~300 MB PCM, khuyến nghị ≥ 1 GB trống | 3, 4 |
| m3 | Audio nằm trong volume của sync | Thư mục host riêng `${OMNILAB_AUDIO_DIR:-/srv/data/omnilab-audio}`; app chỉ mount `public/` `:ro`; `install -d` tạo cả thư mục và `public/` | 4, 6 |
| m4 | Content-Type `.m4a` phụ thuộc OS | Luôn đặt `Content-Type: audio/mp4` cho `@audioMedia`; kiểm cả 200 và 206 trên VPS | 4 |
| m5 | Key lộ sang ffmpeg, `store=true` | Spawn ffmpeg với `env: { PATH }`; body gửi `store: false` (vị trí trường kiểm ở phase 1). Không áp dụng gợi ý compose `secrets:` để giữ cùng cách với `SESSION_SECRET` hiện có; chấp nhận `docker inspect` thấy key trên VPS (chỉ chủ VPS có quyền) | 1, 3 |
| m6 | Tính năng phụ chặn deploy site | Bộ trích bọc `try/catch` theo bài, bài lỗi bị bỏ + cảnh báo, không gắn `data-script-hash`; deploy.sh build tts riêng, lỗi chỉ `WARN`, giữ tts cũ | 2, 4 |
| m7 | Thêm aside ngoài phạm vi | Bỏ bản aside; giữ card và mini bar; `lesson-aside.astro` không bị sửa | 5 |
| m8 | Ước quota và effort | ~450–500 request, 23–50 ngày; effort 8,5d; ghi chú mỗi deploy tts có thể mất một request đang chạy | plan, 3, 4 |
| m9 | Sửa chữ là tạo lại cả bài | Theo quyết định 2: giữ tạo lại cả bài, ghi vào tài liệu viết bài | 3, 6 |
| m10 | Điều khoản EEA/UK chưa có điểm chặn | Theo quyết định 3: đã chấp nhận, ghi vào `deployment-vps-guide.html` | 1, 6 |

### Whole-Plan Consistency Sweep

- `g1 plan validate 261028-1139-lesson-audio-tts`: Hợp lệ (trước và sau khi sửa).
- Effort: frontmatter các phase 0,75 + 1,5 + 2,5 + 1 + 2 + 0,75 = 8,5d, khớp frontmatter và Overview của `plan.md`.
- Quét chữ lỗi thời trên `plan.md` và 6 phase: `6,75`/`6.75`, `1.75d`, `1.25d`, `0.5d`, `3–5 tuần`, `~100 MB`, `preload="none"`, `lesson-audio-aside`, `hide-at-aside`, `/srv/data/omnilab/audio`, hướng dẫn xoá `state.json` không còn. `aside` chỉ còn trong ghi chú bỏ aside và câu nói `lesson-aside.astro` không bị sửa. `OMNILAB_DATA_DIR` chỉ còn khi nói về sync và trong tiêu chí kiểm nó không dùng cho audio. `EEA` chỉ còn ở dạng "đã chấp nhận".
- Nút theo heading: phase 2 (`marks`), phase 3 (`startSec` gần đúng), phase 5 (nút `h3`, nhãn "gần đúng") và Success Criteria thống nhất: `##` chính xác, `###` gần đúng, gồm 13 bài không có `##`.
- Thư mục audio: plan, phase 3 (`TTS_DATA_DIR` trong container), phase 4 (`${OMNILAB_AUDIO_DIR:-/srv/data/omnilab-audio}`, app mount `public` `:ro`, Caddy root `/srv/audio`), phase 6 (lệnh `install -d`) thống nhất.
- Phát hiện khi quét và đã sửa: `--retry-failed` ban đầu ghi thẳng `state.json` từ một tiến trình thứ hai, có thể tranh ghi với worker; đổi thành file yêu cầu `work/retry-requests/<lessonId>` do worker xử lý ở đầu vòng. Hướng dẫn "bỏ tạm dừng quota bằng tay" bị bỏ vì tạm dừng tự hết.
- Không có hai phase chạy song song cùng sửa một file: phase 5 bỏ sửa `lesson-aside.astro`; `[slug].astro` chỉ thuộc phase 5; `audio-gc.ts` mới chỉ thuộc phase 3.

<!-- slug: lesson-audio-tts -->
