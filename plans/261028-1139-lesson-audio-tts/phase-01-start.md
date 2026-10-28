---
phase: 1
title: "Phase 1: Start"
status: in-progress
priority: P1
effort: "0.75d"
dependencies: []
---

# Phase 1: Start (Gemini client, mẫu giọng, hiệu chỉnh)

## Overview

Viết Gemini TTS client thuần (không npm dep), phân loại lỗi 429, và lệnh `pnpm tts:sample` để tạo mẫu giọng. Người dùng chạy hiệu chỉnh bằng key free của mình: xác nhận shape request, nhận WAV thật, đo số ký tự mỗi giây, chọn giọng, chọn cỡ đoạn an toàn, và nếu gặp thì lưu body 429 thật. Kết quả hiệu chỉnh đặt giá trị mặc định cho phase 3 (`TTS_VOICE`, `TTS_MAX_CHUNK_CHARS`, `TTS_CHARS_PER_SEC`, chuỗi `quotaId`) và cho phép tính lại lịch đợt tạo đầu theo RPD thật.

Phase này chạy song song được với phase 2 (không dùng chung file).

## Context links

- Nghiên cứu: [researcher-261028-1127-gemini-tts-api.md](../reports/researcher-261028-1127-gemini-tts-api.md) mục 1 (body request, cách lấy audio từ `steps[]`), mục 3 (8.192 token input, voice drift), mục 4 (body 429, `QuotaFailure.quotaId`, `RetryInfo.retryDelay`), mục 6 (giọng ứng viên, `GET /v1beta/voices`).
- Red-team: [red-team-261028-1156-plan-review.md](./reports/red-team-261028-1156-plan-review.md) (M2, m5, m8).
- Tài liệu Interactions API (https://ai.google.dev/gemini-api/docs/interactions, đã đọc 2026-10-28): mặc định `store=true`, free tier giữ interaction 1 ngày; đặt `store=false` để không lưu.
- Mẫu style server: `server/sync/sync-server-entry.ts:185-199` (CLI khi `import.meta.main`, log JSON một dòng), `server/sync/sync-http-helpers.ts:77-88` (`configFromEnv`, throw Error đọc được).
- Quy ước server: `docs/code-standards.md:196` (type stripping, chỉ cú pháp erasable, import tương đối giữ `.ts`, file < 200 dòng).
- `.gitignore:9-11` đã bỏ qua `.env` và `.env.*` (trừ `.env.example`), nên `.env.local` không vào git.

## Requirements

<!-- Updated: Validation Session 1 - thêm store:false, tách kind no_audio khỏi rejected, đo charsPerSec làm chuẩn kiểm tra audio -->
- Client gọi `POST https://generativelanguage.googleapis.com/v1beta/interactions`, header `x-goog-api-key` và `Content-Type: application/json`, body đúng mẫu ở báo cáo nghiên cứu mục 1: `model`, `input[0].content[0]` kiểu `text` có `annotations[{type:"speech_metadata", style}]`, `response_format:{type:"audio"}`, `generation_config.speech_config:[{voice}]`, và `store: false` để Google không giữ interaction. Tài liệu xác nhận có tham số này nhưng không có ví dụ body đầy đủ; vị trí ở cấp cao nhất của body [UNVERIFIED], xác nhận bằng request thật ở U3. Nếu API từ chối thì ghi lại trong `calibration.md` và bỏ trường.
- Lấy audio: `steps[]` lọc `type == "model_output"`, `content[]` lọc `type == "audio"`, lấy phần tử cuối, giải base64. Parse WAV (RIFF, `fmt ` PCM 16-bit mono, đọc `sampleRate`, tìm chunk `data`), trả `{ pcm, sampleRate, durationSec }`.
- Kết quả là union có `kind` (không throw cho lỗi HTTP):
  - `ok`;
  - `no_audio`: HTTP 200 nhưng không có phần audio, chỉ có text, PCM rỗng hoặc số byte lẻ. Worker thử lại có trần, không coi là lỗi vĩnh viễn;
  - `quota` (`scope: day | minute | unknown`, `retryAfterMs?`, `body` rút gọn ≤ 2 KB);
  - `retryable` (5xx, lỗi mạng, timeout);
  - `auth` (401, 403, hoặc 400 có `ErrorInfo.reason = API_KEY_INVALID`);
  - `rejected` (4xx khác, WAV sai định dạng).
- Phân loại 429 (`gemini-quota.ts`, thuần): duyệt `error.details[]`; `QuotaFailure.violations[].quotaId` chứa `PerDay` → `day`; chứa `PerMinute` → `minute` với `retryAfterMs` từ `RetryInfo.retryDelay` (dạng `"27s"`, `"1.5s"`); không có `QuotaFailure` → `unknown`. `quotaValue == "0"` → `day` kèm cờ `zeroQuota` để log nói rõ project không có hạn mức cho model. Không tin `retryDelay` khi đã là quota ngày.
- Timeout mỗi request qua `AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)])`; signal ngoài dùng cho SIGTERM ở phase 3.
- Hằng mặc định ở một chỗ (`tts-defaults.ts`): model `gemini-3.8-flash-tts`, style ngắn tiếng Việt (ví dụ "Giọng nam trầm, ấm, đọc rõ ràng, nhịp vừa phải."), danh sách giọng ứng viên `Algenib, Charon, Alnilam, Orus`, giọng mặc định tạm `Charon` cho tới khi người dùng chọn, `charsPerSec` mặc định 14 (số ước ở brainstorm) cho tới khi có số đo thật. Style giữ ngắn vì style dài là nguyên nhân hàng đầu của voice drift (nghiên cứu mục 3).
- `pnpm tts:sample`: đọc `GEMINI_API_KEY` từ môi trường hoặc `.env.local` (`node --env-file-if-exists=.env.local`). Cờ: `--voices a,b`, `--text-file <path>`, `--model`, `--style`, `--out <dir>` (mặc định `.tts-samples/`), `--list-voices` (gọi `GET /v1beta/voices?language_code=vi-VN&gender=male&pitch=low&page_size=100`, in kết quả hoặc mã lỗi, không dừng chương trình). Mỗi giọng ghi `<voice>.wav` và in một dòng JSON `{voice, chars, bytes, sampleRate, durationSec, charsPerSec, latencyMs}`. Gặp 429 thì lưu nguyên body vào `<out>/429-<thời điểm>.json` và in ra. Thiếu key thì thoát mã 2 với hướng dẫn, không in key.
- Văn bản mẫu mặc định: một đoạn tiếng Việt khoảng 300 ký tự có vài thuật ngữ tiếng Anh (ví dụ "cache", "load balancer") để nghe phát âm, khai báo hằng trong `tts-sample-cli.ts`.

## Related code files

| Thao tác | File |
|---|---|
| Create | `server/tts/tts-defaults.ts` |
| Create | `server/tts/gemini-tts-client.ts` |
| Create | `server/tts/gemini-quota.ts` |
| Create | `server/tts/wav-pcm.ts` (parse WAV → PCM, ghi WAV header cho file mẫu) |
| Create | `server/tts/tts-sample-cli.ts` |
| Create | `tests/gemini-tts-client.test.mjs`, `tests/gemini-quota.test.mjs`, `tests/wav-pcm.test.mjs` |
| Modify | `package.json` (script `"tts:sample": "node --env-file-if-exists=.env.local server/tts/tts-sample-cli.ts"`) |
| Modify | `.gitignore` (thêm `/.tts-samples/`) |

`tsconfig.server.json` đã include `server/**/*.ts` nên không cần sửa ở phase này.

## Implementation steps

1. Tìm trước khi viết: grep `fetch(`, `base64`, `RIFF`, `retryDelay` trong `server/` và `src/lib/`; ghi kết quả "không có sẵn" vào báo cáo phase nếu đúng vậy.
2. `wav-pcm.ts`: `parseWav(bytes) → { pcm, sampleRate, channels, bitsPerSample }` (duyệt chunk RIFF, không giả định header 44 byte), `wavHeader(pcmBytes, sampleRate)` cho file mẫu. Test: WAV tự tạo, WAV có chunk `LIST` chen giữa, file cắt cụt, không phải RIFF, chunk `data` rỗng.
3. `gemini-quota.ts`: `classifyQuota(body) → { scope, retryAfterMs?, zeroQuota }`, `parseDurationMs("27s")`. Test bằng body mẫu trong báo cáo nghiên cứu (ngày, phút, không có details, body không phải JSON, `quotaValue "0"`).
4. `gemini-tts-client.ts`: `createGeminiTtsClient({ apiKey, fetch, timeoutMs, baseUrl })` trả `{ synthesize(req, signal), listVoices(query, signal) }`. Test với fake `fetch`: kiểm URL, header (có `x-goog-api-key`, key không xuất hiện trong URL), body JSON đúng shape và có `store: false`; response thành công → PCM; `steps` chỉ có text, audio rỗng hoặc lẻ byte → `no_audio`; 429 ngày/phút; 500 → `retryable`; `TypeError` mạng → `retryable`; timeout → `retryable`; 401/403/`API_KEY_INVALID` → `auth`; 400 khác → `rejected`.
5. `tts-sample-cli.ts` + script `tts:sample`; thêm `/.tts-samples/` vào `.gitignore`.
6. `pnpm test`, `pnpm check:server`, `pnpm check`.
7. **Hiệu chỉnh (người dùng chạy, cần key thật; agent chuẩn bị lệnh và file văn bản):**
   - U1. Tạo API key trong AI Studio trên một project free. Mở trang rate limit, ghi RPD và RPM của `gemini-3.8-flash-tts` (và các model TTS khác nếu có).
   - U2. Tạo `.env.local` với dòng `GEMINI_API_KEY=...`. Kiểm `git check-ignore .env.local` in ra tên file.
   - U3. `pnpm tts:sample` (4 request) và `pnpm tts:sample --list-voices` (không tốn request TTS). Xác nhận API chấp nhận `store: false`.
   - U4. Nghe 4 file `.tts-samples/*.wav` (và một giọng thư viện mở rộng nam/trầm nếu có, thêm 1 request). Chọn giọng theo độ rõ khi nghe lâu, không chỉ theo độ trầm. Báo lại tên giọng.
   - U5. Agent cắt sẵn hai file văn bản từ một bài dài (ví dụ `src/content/lessons/kien-truc/chu-de/06-database.mdx`, đoạn văn xuôi không có code/bảng): khoảng 1.800 và 3.500 ký tự, đặt trong thư mục tạm ngoài repo. Người dùng chạy `pnpm tts:sample --voices <giọng đã chọn> --text-file <file>` cho từng file (2 request). Nghe xem giọng có trôi, có đọc sót hoặc đọc thêm không; ghi `durationSec`, `charsPerSec`, `latencyMs`.
   - U6. Gặp 429 ở bất kỳ bước nào: gửi lại file `429-*.json` (không chứa key). Gặp 5xx hoặc phản hồi không có audio: ghi lại, rồi xem trang usage trong AI Studio để biết lượt đó có bị tính vào RPD không.
8. Agent ghi kết quả vào `plans/261028-1139-lesson-audio-tts/reports/calibration.md`: RPD/RPM, giọng đã chọn, `charsPerSec`, cỡ đoạn chọn (mặc định 1.800, chỉ tăng nếu bản 3.500 không trôi và latency < 120 giây), kết quả `store: false`, body 429 thật nếu có, 5xx/thiếu audio có bị tính quota không, và lịch đợt đầu tính lại từ RPD thật (khoảng 450–500 request cho toàn kho). Cập nhật `tts-defaults.ts` (giọng, cỡ đoạn, `charsPerSec`) và test phân loại 429 bằng body thật.

## Todo

- [x] `wav-pcm.ts` + test
- [x] `gemini-quota.ts` + test
- [x] `gemini-tts-client.ts` + test với fake fetch (gồm `store: false`, `no_audio`)
- [x] `tts-defaults.ts`
- [x] `tts-sample-cli.ts`, script `tts:sample`, `.gitignore`
- [ ] U1–U6 (người dùng) và báo cáo `reports/calibration.md`
- [ ] Cập nhật mặc định giọng, cỡ đoạn, `charsPerSec`, mẫu 429 theo kết quả hiệu chỉnh

## Success criteria

- `pnpm test` xanh, gồm 3 file test mới; `pnpm check:server` và `pnpm check` không lỗi.
- Có ít nhất một WAV thật từ API, phát được, `sampleRate` đúng như header (dự kiến 24000).
- `reports/calibration.md` có: RPD/RPM, giọng người dùng chọn, `charsPerSec` đo được, cỡ đoạn chốt, kết quả `store: false`, body 429 thật hoặc ghi "chưa gặp 429", và lịch đợt đầu tính theo RPD thật.
- `git status --porcelain` không có `.env.local` hay `.tts-samples/`.

## Risk assessment

| Rủi ro | Khả năng × Tác động | Giảm thiểu |
|---|---|---|
| Shape `/v1beta/interactions` khác tài liệu (API preview đổi) | Trung bình × Cao | Phát hiện ngay ở U3; client có test shape nên sửa một chỗ. Không có fallback sang shape cũ `generateContent` vì nghiên cứu ghi shape đó không còn được tài liệu hoá cho 3.8. |
| Response không phải WAV (ví dụ PCM thô `audio/l16`) | Thấp × Trung bình | `parseWav` báo `rejected` rõ ràng; hiệu chỉnh thấy ngay. Nếu cần thì đặt `response_format.mime_type` tường minh. |
| Hiệu chỉnh tốn quota ngày | Chắc chắn × Thấp | Tổng khoảng 7 request; quota cùng project với VPS nên chạy hiệu chỉnh trước khi bật worker. |
| Free tier không có quota TTS cho project (`limit: 0`) | Thấp × Cao | Lộ ra ở U3 (cờ `zeroQuota`); dừng plan và báo người dùng trước khi làm phase 3–4. |

## Security

- Key chỉ đọc từ `process.env`; không log, không in, không ghi vào file mẫu hay file 429. Gửi qua header, không qua query string.
- `store: false` để Google không giữ interaction (free tier mặc định giữ 1 ngày).
- `.env.local` và `.tts-samples/` bị git bỏ qua; kiểm bằng `git check-ignore`.
- Free tier: Google được dùng input/output để cải thiện sản phẩm, và reviewer có thể đọc. Văn bản mẫu và bài học đều công khai, không chứa dữ liệu cá nhân. Chủ dự án đã chấp nhận vùng xám điều khoản EEA/UK/Thuỵ Sĩ (Validation Log ở `plan.md`).

## Rollback

Chỉ thêm file mới và một script; revert commit là đủ, không ảnh hưởng build hay runtime.
