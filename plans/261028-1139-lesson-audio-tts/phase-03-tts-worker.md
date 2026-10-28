---
phase: 3
title: "Phase 3: TTS worker"
status: in-progress
priority: P1
effort: "2.5d"
dependencies: [1, 2]
---

# Phase 3: TTS worker (`server/tts/`)

## Overview

Worker Node 24 chạy liên tục. Nó đọc `tts-scripts.json` có sẵn trong image và so với `manifest.json`, rồi tạo bản nghe cho bài còn thiếu trước, bài đã đổi sau. Mỗi đoạn PCM được ghi xuống đĩa ngay (fsync), nên dừng giữa chừng vì hết quota, deploy hay SIGTERM không làm mất request đã tốn. Khi đủ đoạn, worker ghép, nén AAC và cập nhật manifest nguyên tử. Worker không bao giờ xoá hàng loạt bản nghe vì một file văn bản đọc hỏng, và không bao giờ đưa vào manifest một đoạn audio thiếu hay sai thời lượng. Không có npm dependency; `ffmpeg` là binary ngoài (cài ở image tts, phase 4).

<!-- Updated: Validation Session 1 - thêm an toàn GC, kiểm audio Gemini, fsync, giới hạn thư mục dở, mốc ### gần đúng, tạo lại cả bài khi sửa (red-team M1, M2, m1, m2, m5; quyết định người dùng 1, 2) -->

## Context links

- Mẫu server: `server/sync/sync-server-entry.ts:185-199` (CLI `import.meta.main`, SIGTERM/SIGINT, log JSON một dòng), `server/sync/sync-http-helpers.ts:77-88` (`configFromEnv(env, dev)`), cờ `--dev` dùng `./.data` (`package.json` script `sync:dev`).
- Test server mẫu: `tests/sync-*.test.mjs` (dùng `mkdtempSync`, log thu vào mảng).
- Phase 1: `server/tts/gemini-tts-client.ts` (kind `ok`, `quota`, `retryable`, `auth`, `rejected`, `no_audio`), `gemini-quota.ts`, `wav-pcm.ts` (`parseWav` trả `durationSec`), `tts-defaults.ts` (`charsPerSec` đo ở phase 1). Phase 2: `src/lib/speech-script-contract.ts` (mục + mốc `###`), `src/lib/audio-manifest.ts` (`AudioChapter` có `depth`, `approx`).
- Nghiên cứu mục 3 (một model + một voice + một style ngắn cho cả bài), mục 4 (429 ngày/phút, reset 0h Pacific), mục "Kế hoạch thực thi" bước 4 (khoảng lặng giữa đoạn).
- Red-team: `./reports/red-team-261028-1156-plan-review.md` (M1 GC, M2 audio Gemini, m1 fsync, m2 đĩa, m5 env ffmpeg).
- `tsconfig.server.json` include hiện tại: `server/**/*.ts` + 3 file `src/lib/progress-*.ts`.

## Requirements

### Cấu hình (`configFromEnv(env, dev)`, throw Error đọc được khi giá trị sai)

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `GEMINI_API_KEY` | rỗng | Rỗng → worker chỉ dọn dẹp và ngủ, không crash |
| `TTS_MODEL` | `gemini-3.8-flash-tts` | Từ `tts-defaults.ts` |
| `TTS_VOICE` | giọng chốt ở phase 1 | |
| `TTS_STYLE` | style ngắn ở `tts-defaults.ts` | |
| `TTS_MAX_CHUNK_CHARS` | 1800 (hoặc giá trị chốt ở phase 1) | Giới hạn 500–4000 |
| `TTS_CHARS_PER_SEC` | `charsPerSec` ở `tts-defaults.ts` (đo ở phase 1, mặc định 14) | Chuẩn để kiểm thời lượng từng đoạn |
| `TTS_MIN_INTERVAL_MS` | 30000 | Khoảng cách tối thiểu giữa hai request, tránh 429 theo phút |
| `TTS_RESCAN_MINUTES` | 60 | |
| `TTS_RETAIN_OLD_HOURS` | 24 | Giữ file bản cũ sau khi thay, cho người đang nghe dở |
| `TTS_RETAIN_REMOVED_DAYS` | 30 | Giữ bản nghe của bài biến mất khỏi văn bản đọc trước khi xoá |
| `TTS_FAILED_RETRY_DAYS` | 7 | Bài lỗi được tự thử lại sau số ngày này |
| `TTS_REQUEST_TIMEOUT_MS` | 180000 | |
| `TTS_DATA_DIR` | `/data/audio` (dev: `./.data/audio`) | Có `public/` và `work/`; trên VPS là thư mục host riêng (phase 4) |
| `TTS_SCRIPTS_PATH` | `/app/tts-scripts.json` (dev: `dist/tts-scripts.json`) | |
| `FFMPEG_PATH` | `ffmpeg` | Cho phép dùng ffmpeg bản static khi thử trên máy dev |

Các ngưỡng cố định (không đưa ra env vì không cần chỉnh khi vận hành) nằm thành hằng có tên trong `tts-config.ts`: `GC_MAX_DROP_RATIO = 0.1`, `GC_MAX_DROP_LESSONS = 5`, `NO_AUDIO_MAX_RETRIES = 3`, `DURATION_RATIO_MIN = 0.5`, `DURATION_RATIO_MAX = 2`, `MAX_WORK_DIRS = 2`.

### Khoá và thứ tự công việc

- `audioKey` = sha256 hex của JSON `[scriptHash, model, voice, style, maxChunkChars, AUDIO_PIPELINE_VERSION]`. Đổi bất kỳ giá trị nào thì bài được tạo lại, bản cũ vẫn phát trong lúc chờ. `AUDIO_PIPELINE_VERSION` tăng khi đổi cách ghép/nén.
- Sửa bài thì `scriptHash` đổi và cả bài được tạo lại từ đầu (quyết định người dùng 2). Không có cache theo từng đoạn giữa hai khoá khác nhau; dữ liệu đoạn chỉ dùng lại để chạy tiếp cùng một `audioKey`.
- Hàng đợi: bài đang có thư mục work dở (cùng `audioKey` mục tiêu) đứng đầu, để không bao giờ có nhiều bài dở cùng lúc; tiếp theo là bài chưa có entry trong manifest; cuối cùng là bài có `audioKey` khác. Trong mỗi nhóm giữ thứ tự khoá học của `tts-scripts.json`. Bỏ qua bài có `audioKey` trong `state.failed` khi `retryAfter` chưa tới.
- Chia đoạn (`chunk-packer.ts`, thuần): gom các đoạn văn của MỘT mục tới ≤ `maxChunkChars`; đoạn văn dài hơn thì tách theo câu (`.`, `!`, `?`, `…` + khoảng trắng), câu vẫn dài thì tách ở khoảng trắng. Đoạn không bao giờ vắt qua hai mục, nên mốc bắt đầu mục `##` là chính xác. Mỗi đoạn mang theo danh sách mốc `###` nằm trong nó cùng vị trí ký tự của mốc trong chữ của đoạn.

### Mốc `###` gần đúng

- `startSec` của mốc = `startSec` của đoạn chứa nó + (vị trí ký tự của mốc ÷ tổng ký tự của đoạn) × thời lượng đoạn, trừ 1 giây (kẹp không nhỏ hơn đầu đoạn). Trừ 1 giây để người nghe không mất chữ đầu của tên mốc.
- Manifest ghi mốc với `depth: 3, approx: true`; mục `##` và "Mở đầu" ghi `depth: 2, approx: false`. Danh sách chapters sắp theo `startSec`.
- Không tốn thêm request nào; không thêm ranh giới đoạn.

### Lưu trữ (`/data/audio`)

```
public/manifest.json                     ← trình duyệt đọc; ghi tmp + fsync file + rename + fsync thư mục
public/<domain>.<module>.<slug>.<key12>.m4a
work/state.json                          ← { v:1, pausedUntil?, failed:{[audioKey]:{lessonId, at, retryAfter, reason}}, retired:{[file]:{at, kind:"replaced"|"removed"}} }
work/<domain>.<module>.<slug>/<audioKey>/0000.pcm … meta.json
```

<!-- Updated: Validation Session 1 - fsync và băm từng đoạn để chạy tiếp an toàn (red-team m1) -->
- `meta.json` gồm `sampleRate`, `chunkCount`, `model`, `voice` và mảng `chunks[i] = { textSha256, bytes }`. Mỗi đoạn ghi `NNNN.pcm.tmp`, fsync, rename thành `NNNN.pcm`, fsync thư mục, rồi mới cập nhật `meta.json` theo cùng cách.
- Khởi động lại: chạy tiếp từ chỉ số đầu tiên bị thiếu hoặc không hợp lệ. Một đoạn hợp lệ khi file tồn tại, kích thước > 0, chẵn byte, bằng `bytes` trong `meta.json` và `textSha256` khớp chữ của đoạn đó theo plan chia đoạn hiện tại. Đoạn không hợp lệ và mọi đoạn sau nó bị xoá rồi tạo lại.
- `sampleRate` của đoạn sau khác đoạn đầu → lỗi `rejected`, xoá thư mục work của khoá, ghi `failed`.
- Đủ đoạn: ghép PCM + khoảng lặng cố định (400 ms) giữa các đoạn thành `full.pcm` bằng stream (không giữ cả bài trong RAM), rồi `ffmpeg -nostdin -hide_banner -loglevel error -y -f s16le -ar <rate> -ac 1 -i full.pcm -c:a aac -b:a 48k -movflags +faststart out.m4a`. ffmpeg chạy bằng `spawn` với `env: { PATH }` tối thiểu (không truyền `GEMINI_API_KEY` hay biến nào khác), có timeout, bị kill khi SIGTERM. Rename `out.m4a` vào `public/` (cùng filesystem) sau khi fsync, tính `durationSec`, `startSec` từng mục và mốc từ số byte PCM, ghi manifest, đưa file cũ của bài vào `state.retired` với `kind: "replaced"`, xoá thư mục work của khoá.

### Dọn dẹp an toàn (không bao giờ xoá hàng loạt)

<!-- Updated: Validation Session 1 - chặn GC khi văn bản đọc hỏng hoặc làm mất nhiều bài (red-team M1) -->
- Văn bản đọc không đọc được, sai shape, hoặc có 0 bài: log `scripts_invalid` (lý do, không có nội dung), KHÔNG dọn dẹp, KHÔNG tạo bài mới, ngủ `TTS_RESCAN_MINUTES` rồi đọc lại. Worker không thoát nên container không rơi vào vòng crash-restart.
- Trước khi dọn, đếm số bài có entry trong manifest nhưng không còn trong văn bản đọc. Nếu số này > `GC_MAX_DROP_LESSONS` hoặc > `GC_MAX_DROP_RATIO` × số entry: log `gc_refused` (số bài sẽ mất, tổng số entry), bỏ qua toàn bộ bước gỡ entry trong vòng đó; tạo bài vẫn tiếp tục.
- Bài biến mất (trong ngưỡng): entry vẫn ở manifest và file vẫn phát được tới khi quá `TTS_RETAIN_REMOVED_DAYS` kể từ lần đầu thấy vắng (ghi `retired[file] = { at, kind: "removed" }`). Bài quay lại trước hạn thì bỏ khỏi `retired`. Hết hạn thì gỡ entry rồi xoá file.
- Bản cũ bị thay (`kind: "replaced"`) chỉ bị xoá khi quá `TTS_RETAIN_OLD_HOURS`.
- Ngay trước khi xoá bất kỳ `.m4a` nào, đọc lại manifest hiện tại và kiểm file không còn được entry nào tham chiếu; còn tham chiếu thì bỏ khỏi `retired`, không xoá.
- `.m4a` trong `public/` không có trong manifest và không có trong `retired` thì được đưa vào `retired` với `kind: "replaced"` (không xoá ngay).
- Thư mục work: xoá thư mục có `audioKey` không còn là khoá mục tiêu của bài nào (kể cả bài đã đổi nội dung). Nếu vẫn còn nhiều hơn `MAX_WORK_DIRS` thư mục, chỉ giữ thư mục đang làm dở và thư mục mới nhất. `*.tmp` cũ hơn 1 giờ bị xoá. `work/manifest.invalid-*` cũ hơn 30 ngày bị xoá.
- Manifest hỏng (không parse được): log `error`, chuyển sang `work/manifest.invalid-<thời điểm>.json`, bắt đầu với manifest rỗng; vòng đó KHÔNG xoá `.m4a` nào (các file mồ côi chỉ vào `retired` và chờ thời hạn). Chỉ một worker được ghi (compose một instance, không scale).

### Xử lý kết quả API

<!-- Updated: Validation Session 1 - thử lại có giới hạn khi thiếu audio, kiểm thời lượng, tự thử lại bài lỗi (red-team M2) -->

| Kết quả | Hành động |
|---|---|
| `ok` | Kiểm thời lượng (dưới), lưu đoạn, chờ đủ `TTS_MIN_INTERVAL_MS` rồi gọi đoạn tiếp |
| `no_audio` (200 nhưng không có audio, audio rỗng hoặc lẻ byte) | Thử lại cùng đoạn tối đa `NO_AUDIO_MAX_RETRIES` lần, backoff 30 giây × 2ⁿ; vẫn lỗi thì xử lý như `rejected` |
| `quota` `day` | `pausedUntil` = 0h kế tiếp giờ `America/Los_Angeles` + jitter 2–10 phút, ghi `state.json`, ngủ tới đó |
| `quota` `minute` | Chờ `retryAfterMs` (kẹp 1 giây – 5 phút, + jitter), thử lại cùng đoạn |
| `quota` `unknown` | Backoff 60 giây × 2ⁿ (tối đa 30 phút); 5 lần liên tiếp → coi như quota ngày |
| `retryable` (5xx, mạng, timeout) | Backoff 10 giây × 2ⁿ (tối đa 30 phút); 8 lần liên tiếp trên một đoạn → hoãn bài đó tới vòng sau |
| `auth` | Log lỗi một lần, ngủ `TTS_RESCAN_MINUTES`, không đốt request |
| `rejected` | Ghi `state.failed[audioKey] = { lessonId, at, retryAfter: at + TTS_FAILED_RETRY_DAYS, reason }` (lý do gồm số đoạn, status, message ≤ 300 ký tự), sang bài khác |

- Kiểm thời lượng mỗi đoạn: `ratio = (ký tự ÷ charsPerSec) ÷ durationSec`. Ngoài khoảng `[DURATION_RATIO_MIN, DURATION_RATIO_MAX]` (đọc quá nhanh, bị cắt, hoặc chèn lặng dài) thì log `chunk_outlier` (lessonId, chunk, ratio) và tạo lại đoạn đó đúng một lần. Lần hai vẫn ngoài khoảng thì nhận đoạn tốt hơn (ratio gần 1 hơn) và log `chunk_outlier_kept`, để một giọng đọc chậm hợp lệ không làm kẹt bài. Đoạn ngắn dưới 80 ký tự không bị kiểm vì sai số tương đối lớn.
- Bài lỗi tự được thử lại khi `retryAfter` đã qua, hoặc khi `audioKey` đổi. Người vận hành thử lại ngay bằng `--retry-failed <lessonId>`: lệnh này chỉ ghi file yêu cầu `work/retry-requests/<lessonId>` (tmp + rename) rồi thoát, không ghi `state.json`, để không tranh ghi với worker đang chạy. Đầu mỗi vòng, worker đọc các file yêu cầu, xoá mục `failed` của bài tương ứng, ghi `state.json`, rồi xoá file yêu cầu. Không cần xoá `state.json`. Tạm dừng quota (`pausedUntil`) không có lệnh bỏ tay; nó tự hết ở 0h Los Angeles.
- Body 429 đầu tiên của mỗi tiến trình được log nguyên văn (≤ 2 KB) để chốt chuỗi `quotaId` (câu hỏi mở).
- Tính 0h Los Angeles bằng `Intl.DateTimeFormat` + `timeZone`; nếu runtime không có dữ liệu múi giờ thì dùng UTC−8 cố định (ngủ muộn tối đa 1 giờ vào mùa hè, an toàn).
- Mọi lần ngủ đi qua `sleep(ms, signal)` nhận AbortSignal. SIGTERM huỷ fetch đang chạy, kill ffmpeg, thoát trong vài giây, không để lại file đoạn dở (nhờ tmp + fsync + rename). Một request đang chạy lúc deploy có thể đã bị Google tính vào quota mà không trả về audio; chấp nhận mất tối đa một request mỗi lần deploy.
- Log JSON một dòng: `start` (model, voice, maxChunkChars, hasKey: true/false), `idle_no_key`, `scripts_invalid`, `paused` (until), `cycle` (missing, stale, failed, workDirs), `chunk_ok` (lessonId, chunk, of, sec, ratio), `chunk_outlier`, `chunk_outlier_kept`, `no_audio_retry`, `quota`, `lesson_ready` (lessonId, durationSec, chunks, file), `lesson_failed`, `gc` (removed, retired), `gc_refused`. Không bao giờ log key, header, hay nội dung văn bản (chỉ số ký tự).
- CLI: `--dev` (đường dẫn local), `--once` (xử lý hết hàng đợi hoặc tới lần tạm dừng đầu rồi thoát), `--only <lessonId>` (giới hạn một bài, dùng cho thử thật tốn ít request), `--retry-failed <lessonId>` (ghi file yêu cầu thử lại cho một bài rồi thoát; lesson id kiểm bằng `LESSON_ID_PATTERN`).

## Related code files

| Thao tác | File |
|---|---|
| Create | `server/tts/tts-config.ts` (env + hằng ngưỡng) |
| Create | `server/tts/tts-schedule.ts` (0h Los Angeles, backoff, jitter có `random` inject) |
| Create | `server/tts/chunk-packer.ts` (đoạn + vị trí mốc `###`) |
| Create | `server/tts/tts-work-plan.ts` (`audioKey`, hàng đợi, `retryAfter`) |
| Create | `server/tts/audio-store.ts` (thư mục, đoạn PCM + `meta.json`, `state.json`, manifest nguyên tử, fsync) |
| Create | `server/tts/audio-gc.ts` (ngưỡng dọn, thời hạn giữ, kiểm tham chiếu trước khi xoá, giới hạn thư mục work) |
| Create | `server/tts/audio-encode.ts` (ghép PCM + khoảng lặng, chạy ffmpeg qua runner inject với env tối thiểu, tính mốc mục và mốc gần đúng) |
| Create | `server/tts/tts-worker.ts` (`processLesson`, `runCycle`, kiểm thời lượng, thử lại `no_audio`) |
| Create | `server/tts/tts-worker-entry.ts` (vòng lặp, SIGTERM, cờ CLI gồm `--retry-failed`) |
| Create | `tests/tts-schedule.test.mjs`, `tests/tts-chunk-packer.test.mjs`, `tests/tts-work-plan.test.mjs`, `tests/tts-audio-store.test.mjs`, `tests/tts-audio-gc.test.mjs`, `tests/tts-audio-encode.test.mjs`, `tests/tts-worker.test.mjs` |
| Modify | `tsconfig.server.json` (include thêm `src/lib/speech-script-contract.ts`, `src/lib/audio-manifest.ts`) |
| Modify | `package.json` (script `"tts:dev": "node --env-file-if-exists=.env.local server/tts/tts-worker-entry.ts --dev"`) |

Mỗi file dưới 200 dòng; chỉ cú pháp erasable, import tương đối giữ `.ts`. `audio-gc.ts` tách khỏi `audio-store.ts` vì luật dọn dẹp đủ phức tạp để có test riêng.

## Implementation steps

1. Tìm trước khi viết: grep `createHash`, `rename(`, `fsync`, `spawn(`, `Intl.DateTimeFormat` trong `server/` và `src/lib/` để dùng lại helper sẵn có (ví dụ cách sync ghi file ở `server/sync/`).
2. Test đỏ `tts-schedule`: `nextPacificMidnight` cho 2026-10-28T10:00Z (PDT) → 2026-10-29T07:00Z; ngày đổi giờ 2026-11-01 (trước và sau 2h sáng LA); mùa xuân 2027-03-14; fallback UTC−8 khi `Intl` ném lỗi; backoff có trần; jitter nằm trong khoảng.
3. Test đỏ `chunk-packer`: đoạn ngắn gộp lại; không vắt qua mục; câu dài bị tách; không mất hay thêm ký tự (nối lại bằng khoảng trắng bằng văn bản gốc); mọi đoạn ≤ max; mốc `###` gắn đúng đoạn với vị trí ký tự đúng; bài chỉ có "Mở đầu" với nhiều mốc.
4. Test đỏ `tts-work-plan`: bài dở đứng đầu; thiếu trước, đổi sau, theo thứ tự khoá học; bài trong `failed` bị bỏ qua khi chưa tới `retryAfter` và được đưa lại khi đã qua; đổi voice → khoá mới; sửa một đoạn văn → `audioKey` mới cho cả bài.
5. Test đỏ `audio-store` trên thư mục tạm: ghi manifest nguyên tử (có gọi fsync qua fs inject), manifest hỏng bị chuyển chỗ; chạy tiếp từ chỉ số đầu tiên thiếu; đoạn có kích thước 0, lẻ byte, sai `bytes` hoặc sai `textSha256` bị coi là thiếu cùng mọi đoạn sau nó.
6. Test đỏ `audio-gc`:
   - Văn bản đọc rỗng hoặc hỏng → manifest và thư mục `public/` không đổi, log `scripts_invalid`.
   - Văn bản đọc mất 50% bài → manifest không đổi, log `gc_refused`.
   - Mất 1 bài → entry còn tới ngày thứ 30, ngày 31 bị gỡ và file bị xoá; bài quay lại ở ngày 10 → không bị xoá.
   - File cũ bị thay → còn trong 24 giờ, sau đó bị xoá; file trong `retired` nhưng manifest lại tham chiếu → không xoá.
   - Ba thư mục work → còn tối đa hai; `manifest.invalid-*` cũ hơn 30 ngày bị xoá.
7. Test đỏ `audio-encode`: ghép đúng số byte kể cả khoảng lặng; `startSec` mục chính xác; `startSec` mốc theo tỉ lệ ký tự trừ 1 giây và không nhỏ hơn đầu đoạn; tham số ffmpeg; runner nhận `env` chỉ có `PATH`; ffmpeg lỗi → không có file nào vào `public/`.
8. Test đỏ `tts-worker` với client giả, encoder giả, đồng hồ và `sleep` giả:
   - Bài mới → manifest có entry, mục `##` và mốc `###` đúng, thư mục work bị xoá.
   - Quota ngày ở đoạn 2/4 → `pausedUntil` đúng; khởi tạo worker mới trên cùng thư mục trước mốc → 0 request; sau mốc → chỉ gọi đoạn 3 và 4.
   - Bài đổi nội dung → tạo lại cả bài; file cũ còn tới khi quá thời gian giữ.
   - Không key → 0 request, log `idle_no_key` một lần.
   - 429 phút → chờ `retryAfterMs` rồi thành công; 5 lần 429 không rõ → tạm dừng như quota ngày.
   - `no_audio` hai lần rồi `ok` → bài xong; `no_audio` bốn lần → `failed` có `retryAfter` sau 7 ngày, bài khác vẫn chạy.
   - Đoạn có ratio 3 → tạo lại một lần; lần hai ratio 1 → nhận; lần hai vẫn ratio 3 → nhận bản tốt hơn và log `chunk_outlier_kept`, không lặp vô hạn.
   - `rejected` → ghi `failed`, bài khác vẫn chạy; `--retry-failed` tạo file yêu cầu, vòng sau worker xoá đúng mục `failed` của bài đó và xoá file yêu cầu; lesson id sai pattern bị từ chối.
   - Abort giữa chừng → vòng lặp thoát, không có `.pcm` dở.
9. Viết code tới khi xanh; `pnpm check:server`, `pnpm check`, `pnpm test`.
10. Thử thật (người dùng hoặc agent có `.env.local`, cần ffmpeg: cài sẵn hoặc bản static để ngoài repo, trỏ `FFMPEG_PATH`): `pnpm build`, rồi `pnpm tts:dev --once --only tai-chinh/lo-trinh-12-tuan/tuan-12` (một bài ngắn, vài request). Kiểm `.data/audio/public/manifest.json`, phát file `.m4a`, nghe chỗ nối đoạn có tiếng click không, bấm thử một mốc `###`. Không có key hoặc ffmpeg thì ghi "chưa kiểm tra" và chuyển sang kiểm trên VPS ở phase 4.

## Todo

- [x] `tts-config.ts` (env + hằng ngưỡng)
- [x] `tts-schedule.ts` + test
- [x] `chunk-packer.ts` + test (gồm mốc `###`)
- [x] `tts-work-plan.ts` + test
- [x] `audio-store.ts` + test (fsync, `meta.json` băm từng đoạn)
- [x] `audio-gc.ts` + test (ngưỡng, 30 ngày, 24 giờ, giới hạn thư mục work)
- [x] `audio-encode.ts` + test (env tối thiểu cho ffmpeg, mốc gần đúng)
- [x] `tts-worker.ts`, `tts-worker-entry.ts` + test kịch bản (`no_audio`, outlier, `--retry-failed`)
- [x] `tsconfig.server.json`, script `tts:dev`
- [ ] Thử thật một bài ngắn (hoặc ghi rõ chưa kiểm tra) — chưa kiểm tra: máy dev không có key, ffmpeg, Docker; xem reports/dev-phase-03-261028-1402.md

## Success criteria

- `pnpm test` xanh với 7 file test mới, phủ đủ các kịch bản ở bước 5–8; `pnpm check:server` và `pnpm check` 0 lỗi.
- Test chứng minh: văn bản đọc rỗng hoặc làm mất hơn ngưỡng bài thì manifest và `public/` giữ nguyên byte-for-byte.
- Test chứng minh: không có đoạn nào thiếu audio hoặc ngoài khoảng thời lượng lọt vào manifest mà không qua đúng một lần tạo lại và một dòng log.
- `grep -rn "GEMINI_API_KEY\|apiKey" server/tts` chỉ thấy ở chỗ đọc config và tạo header, không có trong lệnh log hay trong `env` truyền cho ffmpeg.
- Nếu đã thử thật: file `.m4a` phát được trên Chrome và Safari iOS, `durationSec` trong manifest lệch < 1 giây so với thời lượng thật, bấm mục `##` nhảy đúng đầu mục, bấm mốc `###` nhảy tới trước tên mốc không quá vài giây.

## Risk assessment

| Rủi ro | Khả năng × Tác động | Giảm thiểu |
|---|---|---|
| Quota free rất thấp, đợt đầu kéo dài nhiều tuần | Cao × Trung bình | ~450–500 request cho 78 bài; 10–20 RPD → khoảng 23–50 ngày. Worker không cần trông; ưu tiên bài chưa có bản nghe; mỗi bài sửa sau đó tốn lại số request của cả bài. Lịch thật chốt sau phase 1. |
| Văn bản đọc hỏng hoặc build lỗi làm mất cả thư viện bản nghe | Thấp × Cao | Không dọn khi văn bản đọc hỏng hoặc rỗng; ngưỡng >10% hoặc >5 bài chặn dọn; bài biến mất giữ 30 ngày; kiểm tham chiếu ngay trước khi xoá. |
| Gemini trả 200 thiếu audio hoặc audio bị cắt | Trung bình × Trung bình | Kind `no_audio` thử lại có giới hạn; kiểm thời lượng theo `charsPerSec` và tạo lại một lần; bài lỗi tự thử lại sau 7 ngày. |
| Phân loại sai 429 (chuỗi `quotaId` TTS khác mẫu) | Trung bình × Trung bình | So chuỗi con, log body 429 đầu tiên, luật "5 lần không rõ → quota ngày" chặn việc đốt request. |
| Mất điện hoặc kill giữa lúc ghi làm hỏng đoạn hay manifest | Thấp × Trung bình | tmp + fsync + rename + fsync thư mục; `meta.json` có kích thước và băm từng đoạn; đoạn sai bị tạo lại. |
| Giọng trôi hoặc lệch giữa các đoạn | Trung bình × Trung bình | Một model + voice + style ngắn cho cả bài; cỡ đoạn chốt bằng nghe thử; đổi cỡ đoạn thì khoá đổi, bài được tạo lại sạch. |
| Hết đĩa | Thấp × Trung bình | Tối đa 2 thư mục work cùng lúc, ước đỉnh ~300 MB PCM dở (2 bài dài, mỗi bài ~100–150 MB) cộng ~280 MB AAC cho ~13 giờ, cộng bản cũ trong thời gian giữ. Khuyến nghị còn trống ≥ 1 GB (checklist phase 4). |
| OOM khi nén | Thấp × Thấp | Ghép bằng stream; ffmpeg AAC mono dùng ít RAM; `mem_limit` đặt ở phase 4 và đo bằng `docker stats`. |
| Hai worker cùng ghi manifest | Thấp × Trung bình | Chỉ một service tts trong compose; ghi chú trong docs không scale và không chạy `tts:dev` trỏ vào thư mục VPS. |
| Mốc `###` lệch | Chắc chắn × Thấp | Người dùng đã chấp nhận mốc gần đúng; UI ghi rõ là gần đúng (phase 5). |

## Security

- Key chỉ đọc từ env, chỉ đi trong header `x-goog-api-key`; không log, không ghi file, không truyền cho tiến trình con (ffmpeg chỉ nhận `PATH`). Lỗi mạng log `err.message`, không log header.
- Request gửi `store: false` để Google không lưu interaction phía server (phase 1).
- Worker không mở cổng, không nhận input từ mạng; input duy nhất là `tts-scripts.json` có sẵn trong image. Đường dẫn file dựng từ lesson id đã kiểm bằng `LESSON_ID_PATTERN` (cả ở `--retry-failed`), nên không có path traversal.
- Free tier: chỉ gửi văn bản bài học công khai, không có dữ liệu người dùng; chủ dự án đã chấp nhận vùng xám điều khoản EEA/UK/CH (ghi ở tài liệu deploy, phase 6).

## Rollback

Code mới hoàn toàn; revert commit. Dữ liệu ở thư mục audio sinh lại được, có thể xoá cả thư mục mà không ảnh hưởng site (player tự ẩn), nhưng tạo lại tốn lại toàn bộ quota, nên chỉ xoá khi thật cần.
