# Nghiên cứu Gemini API TTS cho batch job 78 bài học tiếng Việt (free tier)

Ngày: 2026-10-28. Phạm vi: chỉ đọc tài liệu, không sửa code.

## Kết luận trước

1. Dùng `gemini-3.8-flash-tts` qua endpoint mới `POST /v1beta/interactions` (không dùng shape cũ `generateContent`). Free tier có đủ cho cả 4 model TTS.
2. API không trả mp3/aac/opus. Chỉ có WAV, PCM (`audio/l16`), mulaw, alaw. Cần encode sau bằng ffmpeg sang AAC-LC `.m4a` (mono, ~48 kbps), phát được trên iOS Safari.
3. Nút thắt thật là quota free tier, không phải kỹ thuật. Giới hạn input là 8.192 token/request. Với ~653k ký tự cần khoảng 300-400 request (cắt đoạn ~1.800-2.000 ký tự). Nếu RPD thực tế là 10-20 thì mất 3-5 tuần. Phải đo RPD thật trên project trước khi cam kết lịch.
4. Batch job phải idempotent, có state file, resume theo ngày (reset 00:00 giờ Pacific, tức khoảng 14:00-15:00 giờ Bangkok), và phân biệt 429 theo ngày với 429 theo phút bằng `quotaId`.
5. Ffmpeg không nên nằm trong image runtime. Chạy encode trong job một lần (container riêng hoặc máy dev), commit/ship file `.m4a`. Image runtime giữ nguyên zero-dependency.

## 1. Request REST unary

Nguồn chính thức: https://ai.google.dev/gemini-api/docs/speech-generation (đã xác minh; ví dụ curl lấy nguyên văn từ trang).

- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/interactions`
- Header: `x-goog-api-key: $GEMINI_API_KEY`, `Content-Type: application/json`
- Giọng chọn qua `generation_config.speech_config` là mảng `[{ "voice": "Kore" }]` cho single-speaker. Multi-speaker dùng object `{"speakers":[...]}` và `speech_metadata.speaker`.
- Style qua `annotations[].type = "speech_metadata"` với field `style`, gắn vào content item `text`.
- `response_format`: `{ "type": "audio" }`, có thể thêm `mime_type` và `sample_rate` (ví dụ 24000, 16000, 8000).
- Không có field language: trang ghi "The TTS models detect the input language automatically." Vậy không ép được `vi-VN`; chỉ dựa vào tự nhận dạng.

Body tối thiểu (đúng như ví dụ chính thức, chỉ đổi text/voice):

```json
{
  "model": "gemini-3.8-flash-tts",
  "input": [{
    "type": "user_input",
    "content": [{
      "type": "text",
      "text": "Xin chào các bạn.",
      "annotations": [{ "type": "speech_metadata", "style": "giọng trầm, rõ ràng, tốc độ vừa" }]
    }]
  }],
  "response_format": { "type": "audio" },
  "generation_config": { "speech_config": [{ "voice": "Algenib" }] }
}
```

Lấy audio: response có `steps[]`; lọc `type=="model_output"`, rồi `content[]` có `type=="audio"`, lấy phần tử cuối, field `.data` là base64. Mặc định unary trả WAV 24 kHz 16-bit mono.

Shape cũ (`generationConfig.responseModalities:["AUDIO"]` + `speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName`): trang speech-generation không còn tài liệu hóa, chỉ nhắc `AUDIO_L16` cho `generateContent`. Kết luận: shape mới là đường chính; shape cũ [UNVERIFIED] còn chạy với model 2.5 nhưng không nên dùng cho 3.8. Nên thử một request thật để xác nhận 3.8 có chấp nhận hay không; đừng dựa vào nó.

## 2. Định dạng nén và encoder

- Trang chính thức chỉ liệt kê: `audio/wav` (unary mặc định), `audio/l16` (PCM), `audio/mulaw`, `audio/alaw`. Không có mp3/aac/opus. Đã xác minh qua https://ai.google.dev/gemini-api/docs/speech-generation và https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts.
- Ffmpeg trên Alpine: gói `ffmpeg` (edge) nặng 269,8 KiB tải / 624,7 KiB cài (https://pkgs.alpinelinux.org/package/edge/community/x86_64/ffmpeg) nhưng đó chỉ là binary; thư viện phụ thuộc (`ffmpeg-libavcodec`, v.v.) kéo thêm nhiều. Số liệu cộng dồn không có nguồn tin cậy: các image cộng đồng báo 44-92 MB tổng cho node+ffmpeg, đã cũ. [UNVERIFIED] ước lượng thêm 60-100 MB vào image; hãy đo bằng `docker images`.
- Lựa chọn pure-JS: không có encoder AAC/Opus pure-JS đáng tin cậy mà tôi xác minh được. [UNVERIFIED]. Không khuyến nghị (rủi ro bảo trì, chất lượng).
- Khuyến nghị: AAC-LC trong `.m4a` (MP4), mono, 48 kbps, 24 kHz hoặc 44,1 kHz, `-movflags +faststart`. Lý do: iOS Safari phát AAC/MP4 mọi phiên bản; Opus trong Ogg/WebM chỉ được Safari hỗ trợ ở bản mới nên rủi ro phân mảnh [UNVERIFIED chi tiết phiên bản]. Lệnh:
  `ffmpeg -i in.wav -ac 1 -c:a aac -b:a 48k -movflags +faststart out.m4a`
  Ước tính dung lượng: 13 giờ x 48 kbps ≈ 280 MB tổng; có thể hạ 32 kbps (≈ 190 MB) cho giọng nói. [Tính toán, không phải nguồn.]
- Nếu cần chạy trong Docker: dùng multi-stage hoặc một service `tts-batch` tách riêng, không cài ffmpeg vào image sidecar chính.

## 3. Giới hạn độ dài và chunking

- Trang model https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts: input 8.192 token (chỉ text), output 16.384 token ("Gemini API serving limit").
- Tốc độ token audio: tài liệu token ghi 32 token/giây cho audio (https://ai.google.dev/gemini-api/docs/tokens), áp dụng cho input; tốc độ cho output TTS không được nêu. Nếu giống nhau, 16.384/32 ≈ 512 giây ≈ 8,5 phút audio tối đa mỗi request. [UNVERIFIED]. Thực tế nên giữ mỗi request ≤ 2-3 phút audio.
- Tiếng Việt nhiều token/ký tự hơn tiếng Anh, nên không nên chạm trần 8.192 token. Chunk đề xuất 1.500-2.000 ký tự, cắt tại ranh giới đoạn/câu. [Đề xuất, chưa đo.]
- Về voice drift: trang chính thức nói "Long-form "Audio Profile" paragraphs and multi-bullet "Director's Notes" ... are the most common cause of voice drift", khuyến nghị `style` ngắn hoặc để trống, không viết meta-instruction kiểu "giữ nguyên âm sắc". Chia lời thoại dài thành các lượt ngắn. Vậy: cùng một model, cùng voice, cùng `style` ngắn cho mọi chunk của một bài; không đổi model giữa chừng bài.
- Mô tả "text là transcript nguyên văn": nên loại bỏ markdown, bảng, code block khỏi text trước khi gửi, nếu không sẽ bị đọc ra.

## 4. Lỗi 429 và phân biệt phút/ngày

Tài liệu chính thức (https://ai.google.dev/gemini-api/docs/troubleshooting, https://ai.google.dev/gemini-api/docs/rate-limits) chỉ nêu `429 RESOURCE_EXHAUSTED`, backoff mũ có jitter, không đưa body mẫu. RPD reset lúc midnight Pacific. Body thật lấy từ báo cáo cộng đồng (độ tin cậy trung bình): https://discuss.ai.google.dev/t/429-errors-despite-waiting-after-retrydelay/96899

Dạng body (đã rút gọn, các field có thật theo thread; message nguyên văn "You exceeded your current quota, please check your plan and billing details."):

```json
{ "error": {
  "code": 429,
  "message": "You exceeded your current quota, please check your plan and billing details. ...",
  "status": "RESOURCE_EXHAUSTED",
  "details": [
    { "@type": "type.googleapis.com/google.rpc.Help", "links": [ { "url": "https://ai.google.dev/gemini-api/docs/rate-limits" } ] },
    { "@type": "type.googleapis.com/google.rpc.QuotaFailure",
      "violations": [{
        "quotaMetric": "generativelanguage.googleapis.com/generate_content_free_tier_requests",
        "quotaId": "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
        "quotaDimensions": { "model": "gemini-2.5-flash", "location": "global" },
        "quotaValue": "250" }] },
    { "@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "1s" }
  ] } }
```

Cách phân loại:
- Duyệt `error.details[]`, tìm `@type` = `google.rpc.QuotaFailure`, đọc `violations[].quotaId`.
- `quotaId` chứa `PerDay` (ví dụ `GenerateRequestsPerDayPerProjectPerModel-FreeTier`) thì là quota ngày: dừng job tới sau reset, KHÔNG retry theo `retryDelay`. Thread xác nhận `retryDelay` ("1s") gây hiểu lầm khi là quota ngày.
- `quotaId` chứa `PerMinute` (ví dụ `GenerateContentInputTokensPerModelPerMinute-FreeTier`, retryDelay kiểu "27s") thì chờ `retryDelay` rồi retry.
- Một số 429 không có `QuotaFailure`/`RetryInfo` (báo cáo cộng đồng); khi đó coi là phút, backoff có giới hạn, và nếu lặp lại N lần liên tiếp thì coi như hết ngày.
- Không thấy mẫu `quotaId` riêng cho TTS 3.8. Tên có thể khác (ví dụ TTS có metric riêng). [UNVERIFIED]. Hãy ghi log nguyên body 429 đầu tiên khi chạy thử để chốt chuỗi cần match; match theo substring `PerDay` thay vì tên đầy đủ.
- Một guide bên thứ ba (2026-09-30) nói `limit: 0` nghĩa là project không có quota cho model đó. [UNVERIFIED, bên thứ ba.]

## 5. Quota có chung giữa các model TTS không

- Chính thức: "Rate limits are applied per project, not per API key" và "Limits vary depending on the specific model being used" (https://ai.google.dev/gemini-api/docs/rate-limits). Giới hạn free TTS không được công bố trên trang này; phải xem AI Studio (trang rate limit trong dashboard).
- Tên quota thật trong body 429 là `...PerProjectPerModel-FreeTier` và `quotaDimensions.model` cho thấy bộ đếm theo model. Suy ra: mỗi model có bộ đếm RPD riêng (cùng project). Đây là suy luận từ 1 ví dụ LLM, [UNVERIFIED] cho TTS.
- Hệ quả thực dụng: có thể dùng `gemini-3.8-flash-tts` rồi `gemini-3.8-flash-lite-tts`, `gemini-3.1-flash-tts-preview`, `gemini-2.5-flash-preview-tts` làm quota dự phòng. Nhưng giọng khác nhau giữa các model, nên chỉ chuyển model theo ranh giới bài học, và ghi model vào manifest. Thêm API key mới trong cùng project không tăng quota.
- Cảnh báo: tạo nhiều project để lách quota có thể vi phạm điều khoản; không khuyến nghị.

## 6. Giọng nam trầm tiếng Việt

Nguồn: https://ai.google.dev/gemini-api/docs/speech-generation (danh sách 30 giọng và mô tả tính chất).

- Bảng chính thức chỉ gán mô tả (không có cột giới tính/độ trầm trong phần tôi đọc được): Algenib (Gravelly), Charon (Informative), Orus (Firm), Alnilam (Firm), Iapetus (Clear), Rasalgethi (Informative), Schedar (Even), Sadaltager (Knowledgeable). Giới tính từng giọng là kiến thức chung, [UNVERIFIED] trong lần đọc này. Gacrux (Mature) theo hiểu biết của tôi là giọng nữ, không phải ứng viên.
- Extended Voice Library: `GET /v1beta/voices` hoặc `client.voices.list()` (Python `google-genai` >= 2.25.0) / `ai.voices.list()` (JS `@google/genai` >= 2.24.0). Filter: `language_code`, `region_code`, `accent`, `gender` (female|male|neutral), `pitch` (low|medium|high), `persona`, `context`, `type` (prebuilt|prompted|replicated), `search`, `page_size` (mặc định 50, tối đa 1000), `page_token`. Cùng filter thì OR, khác filter thì AND. Query mẫu (suy ra từ tên filter, chưa chạy): `GET /v1beta/voices?language_code=vi-VN&gender=male&pitch=low&page_size=100`. [UNVERIFIED định dạng giá trị `language_code`.]
- Định dạng ID: voice tùy chỉnh dùng `voice_...` (stateful, tối đa 200/project, TTL 1 năm) và `voicekey_...` (stateless, TTL 7 ngày). Định dạng ID cho giọng thư viện/prebuilt không được nêu. [UNVERIFIED]
- Dùng được trên free tier và với tiếng Việt không? Không được nêu rõ cho Extended Library. Voice design/replication chỉ trên 3.8 models. [UNVERIFIED cho free tier.] Khuyến nghị: gọi `voices.list` bằng key free để xem, rồi thử 1 request ngắn.

4 ứng viên (thứ tự ưu tiên, cần nghe thử tiếng Việt thật trước khi chốt):
1. Algenib (Gravelly): hợp "trầm khàn", rủi ro khó nghe khi đọc 13 giờ.
2. Charon (Informative): hướng thuyết minh, thường được dùng cho nội dung giáo dục.
3. Alnilam (Firm): giọng chắc, ổn định.
4. Orus (Firm): dự phòng cho Alnilam.
Gợi ý: nghe cùng một đoạn 300 ký tự bằng cả 4 giọng, chọn theo độ rõ chứ không theo độ trầm; thêm một ứng viên từ `voices.list` (gender=male, pitch=low) nếu key free truy cập được.

## 7. Điều khoản free tier

- Giá: 4 model TTS đều "Free of charge" ở Standard tier; Batch/Flex không có trên free (https://ai.google.dev/gemini-api/docs/pricing). Free tier đánh dấu "Used to improve our products: Yes"; paid là "No".
- Điều khoản (https://ai.google.dev/gemini-api/terms): người dùng ở EEA/Thụy Sĩ/UK chỉ được dùng Paid Services khi app phục vụ họ; app không được hướng tới người dưới 18; không đưa dữ liệu nhạy cảm vào Unpaid Services; reviewer có thể đọc input/output. Ở đây, chạy batch một lần trên nội dung bài học công khai rồi phục vụ file tĩnh: mình gọi API, không phải người dùng cuối gọi, nên rủi ro thấp. Nhưng điều khoản nói về "API Clients available to users"; việc phục vụ audio đã tạo sẵn là vùng xám. [UNVERIFIED về diễn giải pháp lý; nên hỏi chủ dự án.] Không gửi nội dung riêng tư/cá nhân vào API.
- Khu vực: Việt Nam có trong danh sách quốc gia hỗ trợ Gemini API và AI Studio (https://ai.google.dev/gemini-api/docs/available-regions). Trang không xác nhận free tier riêng cho Việt Nam.
- Điều kiện đủ: https://ai.google.dev/gemini-api/docs/troubleshooting ghi "Not all Google Cloud projects or accounts are eligible for the Gemini API free tier"; eligibility theo project, không theo key. Nâng lên paid không mở khoá free quota.

## 8. Kiểm soát phát âm và thẻ

- Phát âm: tài liệu không có cơ chế (không SSML, không phoneme, không lexicon). Cách duy nhất được nêu: viết hoa từ để nhấn mạnh ("This is a VERY important point!"). Cho thuật ngữ tiếng Anh trong văn bản tiếng Việt: thử viết lại thành phiên âm tiếng Việt (ví dụ "ây pi ai") ở bước tiền xử lý, hoặc để nguyên và nghe thử. Nên có bảng thay thế (glossary) trước khi gửi, đặt trong repo.
- Thẻ pause: `<short pause>`, `<long pause>`.
- Thẻ giọng khác: breath, sigh, laugh, whispers, cough, v.v. (danh sách đầy đủ trong trang speech-generation). Trang ghi với transcript không phải tiếng Anh vẫn nên dùng thẻ tiếng Anh.
- Dùng `<short pause>` giữa các đoạn/mục để nhịp tự nhiên; không lạm dụng vì thẻ nằm trong transcript.

## Ma trận quyết định (lựa chọn tổng thể)

| Phương án | Độ tin cậy | Chi phí | Bảo trì | Nhận xét |
|---|---|---|---|---|
| A. 3.8-flash-tts + ffmpeg encode offline, state file, resume theo ngày | Cao | 0 | Thấp | Khuyến nghị. Chất lượng tốt nhất, không đổi image runtime. |
| B. A + rơi sang 3.8-flash-lite-tts khi hết quota | Trung bình | 0 | Trung bình | Nhanh hơn, nhưng giọng khác; chỉ chuyển theo ranh giới bài. |
| C. Batch API | n/a | n/a | n/a | Không có trên free tier. Loại. |
| D. Giữ WAV, không encode | Cao | 0 | Thấp | ~13h x 24 kHz 16-bit ≈ 2,2 GB; không thực tế cho web. Loại. |

Xếp hạng: A > B > D > C. Dùng B chỉ nếu RPD đo được quá thấp so với thời hạn.

## Kế hoạch thực thi gợi ý cho người triển khai

1. Gọi 1 request thử, ghi log nguyên response và body 429 đầu tiên; đo RPD thực tế trong AI Studio.
2. Viết script Node 24 (fetch built-in, không npm) với manifest JSON: `{lessonId, chunkIndex, model, voice, status, sha256(text)}`; ghi WAV từng chunk, nối PCM (cùng sample rate) rồi encode một lần/bài.
3. Gặp quota ngày thì thoát có mã riêng; lập lịch chạy lại sau ~14:30 giờ Bangkok (kiểm tra mùa giờ Pacific: PDT/PST lệch 14 hoặc 15 giờ so với Bangkok).
4. Nối chunk: thêm ~300 ms im lặng giữa các chunk; kiểm tra tiếng click ở điểm nối.

## Hạn chế của nghiên cứu

- Công cụ fetch tóm tắt trang qua mô hình nhỏ; ví dụ curl lấy nguyên văn nhưng chi tiết như `language_code` của voices và ID giọng thư viện không có trong trang. RPD free tier cho TTS không công bố. Giới tính từng giọng prebuilt chưa kiểm chứng. Body 429 thật chỉ có cho model LLM, không phải TTS. Chưa gọi API thật (chỉ đọc).

## Nguồn

- https://ai.google.dev/gemini-api/docs/speech-generation
- https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://ai.google.dev/gemini-api/docs/troubleshooting
- https://ai.google.dev/gemini-api/docs/available-regions
- https://ai.google.dev/gemini-api/docs/tokens
- https://ai.google.dev/gemini-api/terms
- https://discuss.ai.google.dev/t/429-errors-despite-waiting-after-retrydelay/96899 (cộng đồng)
- https://pkgs.alpinelinux.org/package/edge/community/x86_64/ffmpeg

## Câu hỏi còn mở

1. RPD free tier thực tế của từng model TTS trên project này là bao nhiêu (xem AI Studio)?
2. Chủ dự án chấp nhận rủi ro điều khoản "free tier + EEA/UK users" khi phục vụ audio đã tạo sẵn không?
3. Chốt đặt ffmpeg ở đâu: máy dev, container job riêng, hay cài vào image sidecar?
4. Extended Voice Library có truy cập được trên free tier với tiếng Việt không (cần gọi `voices.list`)?
