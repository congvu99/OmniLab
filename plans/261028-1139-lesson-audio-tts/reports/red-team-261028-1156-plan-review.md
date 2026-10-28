# Red-team review: plan "Nghe bài học bằng Gemini TTS"

Ngày: 2026-10-28. Phạm vi: `plan.md` và `phase-01..06`, đối chiếu với repo thật và ba báo cáo ngữ cảnh. Không sửa plan hay code.

## Đã xác minh (bằng code hoặc tài liệu, không tính là phát hiện)

- Shape Gemini: `POST /v1beta/interactions`, `x-goog-api-key`, audio nằm ở `steps[].content[].data`, unary trả WAV 24 kHz 16-bit mono. Khớp phase-01 "Requirements" (đã đọc lại ai.google.dev/gemini-api/docs/speech-generation).
- Thứ tự `handle` trong Caddy: hai `handle` cùng tên mà một bên là named matcher (`path_regexp`), bên kia là single path, thì không so được độ dài path. Sort ổn định nên giữ thứ tự viết, và `handle @audioFile` đứng trước `handle /audio/*` như phase-04 viết. Nguồn: tài liệu sắp xếp directive và `sortRoutes` của Caddy v2.10.2.
- Không có service worker hay precache trong `src/` (grep `serviceWorker|workbox` rỗng), nên `/tts-scripts.json` không bị đẩy xuống mọi client.
- Railpack đã có devDependencies lúc build: `package.json` script `build` chạy `scripts/verify-fidelity.mjs`, và script này dùng `unified`/`remark-mdx` qua `scripts/lib/mdx-text-extract.mjs:3-7`. Bộ trích mới dùng cùng các gói đó nên không thêm điều kiện build mới.
- Tham chiếu ở phase-02 đều đúng: `jsxAttrValueText` ở `mdx-text-extract.mjs:49`, chỗ gọi duy nhất ở `:74`, `parseMdx` ở `:182`, `REMOVED_JSX_NAMES` ở `:14`, `LESSON_ID_PATTERN` ở `progress-state.ts:48`, `findTitleDuplicate` ở `lesson-reader-model.ts:21`. Kho có 78 bài, trong đó 28 bài có `<Disclaimer>`.
- Icon cho Media Session có thật: `public/icons/icon-192.png` và `icon-512.png`. Node 24.15 hỗ trợ `--env-file-if-exists` và `AbortSignal.any`.
- Không có hai phase chạy song song nào sửa cùng một file. Phase 1 sửa `package.json` và `.gitignore`, phase 2 không sửa hai file đó. Phase 5 sửa `[slug].astro`, `lesson-aside.astro` và icon, phase 3–4 không sửa các file này.

## Blocker

Không có.

## Major

### M1. Dọn rác có thể xoá cả kho audio khi `tts-scripts.json` bất thường (Failure modes)
- Bằng chứng: phase-03 "Lưu trữ", gạch dọn dẹp ("bỏ entry của bài không còn trong `tts-scripts.json`", file không được tham chiếu thì xoá sau `TTS_RETAIN_OLD_HOURS` = 24). Plan không nói worker làm gì khi `parseSpeechScripts` ném lỗi, cũng không nói gì khi danh sách bài rỗng hoặc tụt mạnh.
- Tác động: chỉ cần một lỗi build làm file ra 0 bài hoặc thiếu một domain (ví dụ đổi `getAllLessonsOrdered`, lỗi lọc), hay một lần đổi slug hàng loạt, là worker gỡ entry khỏi manifest. Player tắt ngay, và 24 giờ sau file `.m4a` bị xoá. Tạo lại mất 3–7 tuần quota free. Đây là mất dữ liệu không đảo ngược được bằng rollback.
- Cách sửa: (1) Nếu `tts-scripts.json` hỏng thì log `error`, không dọn gì, ngủ `TTS_RESCAN_MINUTES`, không crash-loop. (2) Đặt ngưỡng an toàn: nếu số bài bị gỡ lớn hơn 10% hoặc lớn hơn 5 bài trong một vòng thì bỏ qua bước gỡ, log `gc_refused`, và chỉ gỡ khi người vận hành đặt `TTS_ALLOW_MASS_GC=1`. (3) Với bài biến mất khỏi kho, giữ file lâu hơn hẳn (ví dụ 30 ngày, tách khỏi 24 giờ dành cho bản thay thế), vì 280 MB đĩa rẻ hơn nhiều tuần quota. (4) Thêm test: kho rỗng hoặc tụt 50% thì manifest không đổi.

### M2. Không kiểm tra chất lượng audio trả về, và audio thiếu bị coi là lỗi vĩnh viễn (Assumptions + Failure modes)
- Bằng chứng: phase-01 "Requirements": "`steps` thiếu audio → `rejected`". phase-03 bảng "Xử lý kết quả API": `rejected` thì ghi `state.failed[audioKey]`, chỉ thử lại khi `audioKey` đổi hoặc người vận hành xoá `state.json`. Bước "Đủ đoạn" không kiểm tra độ dài từng đoạn.
- Tác động: model TTS preview đôi khi trả về chỉ có text, audio bị cắt cụt, hoặc audio im lặng hay dài bất thường. (a) Một phản hồi thiếu audio sẽ khoá cả bài vô thời hạn. Cách gỡ duy nhất là xoá `state.json`, mà làm vậy cũng xoá `pausedUntil` nên đốt thêm request. (b) Một đoạn bị cắt mà vẫn được ghép thì thành bản nghe lỗi vĩnh viễn: `audioKey` không đổi nên không bao giờ được tạo lại.
- Cách sửa: (1) Tách lý do `no_audio` khỏi `rejected` và xử lý như `retryable` có trần: thử tối đa 3 lần cho mỗi đoạn, sau đó mới ghi `failed` kèm `retryAfter` (ví dụ 7 ngày) thay vì vĩnh viễn. (2) Kiểm tra từng đoạn: `durationSec / chars` phải nằm trong [0,5×; 2×] của `charsPerSec` đo ở phase 1, và PCM phải có số byte chẵn, khác 0. Sai thì thử lại đoạn đó một lần. (3) Cho phép bỏ trạng thái failed của một khoá riêng, ví dụ `--retry-failed <lessonId>`, thay cho việc xoá toàn bộ `state.json`. Sửa luôn tài liệu phase 6, hiện đang hướng dẫn xoá `state.json`.

### M3. iOS Safari: tua và khôi phục vị trí trước `loadedmetadata` sẽ không có tác dụng (Failure modes)
- Bằng chứng: phase-05 "Hành vi": `<audio preload="none">`, chỉ gán `src` ở lần bấm Phát đầu tiên, khôi phục `t` và "Nghe từ mục này" khi audio chưa tải thì tua tới `startSec`. Test controller ở bước 5 dùng audio giả nên không bắt được lỗi này.
- Tác động: trên WebKit, gán `currentTime` khi `readyState` còn bằng 0 thì bị bỏ qua hoặc reset về 0. Đổi `src` cũng reset `playbackRate` về `defaultPlaybackRate`. Kết quả là nghe tiếp và nghe từ mục phát lại từ đầu, và tốc độ đã lưu bị mất trên iPhone, đúng nhóm người dùng hay nghe nhất.
- Cách sửa: trong cùng handler của cử chỉ người dùng, gán `src`, gọi `play()` đồng bộ (không `await` gì trước đó), rồi tua tới vị trí chờ (`pendingSeek`) trong `loadedmetadata`. Đặt cả `defaultPlaybackRate` lẫn `playbackRate`. Fake audio trong test phải mô phỏng `readyState` để kiểm tra rằng seek bị hoãn tới `loadedmetadata`. Thêm vào checklist iPhone thật ở phase 4 và 6: nghe tiếp, nghe từ mục khi chưa tải, tốc độ 1,5× sau khi tải lại trang.

### M4. Thu hẹp quyết định đã chốt "mỗi heading có nút nghe từ mục này" xuống chỉ `##` mà không ghi nhận (Scope)
- Bằng chứng: brainstorm "Quyết định đã chốt" mục 4 ghi "mỗi heading trong bài có nút". `plan.md` "Success Criteria" và phase-05 lại chỉ đặt nút ở `h2[id]`. Đếm trong repo: 344 dòng `## ` và 193 dòng `### `. 13 bài không có `##` nào (12 bài `tai-chinh/lo-trinh-12-tuan/*` và `an-toan/02`, mỗi bài một `###`; riêng `nguon-hoc/02-tu-sach-va-lich-doc.mdx` có 8 `###`), nên các bài này không có nút nào.
- Tác động: lệch với yêu cầu người dùng đã chốt, mà plan không có dòng nào xin xác nhận.
- Cách sửa tối ưu (không tốn thêm quota): giữ `##` làm ranh giới đoạn (mốc chính xác). Với `###`, ghi `startSec` gần đúng bằng tỉ lệ số ký tự trong đoạn chứa heading đó (đoạn có thời lượng thật, mốc lệch vài giây) và đánh dấu `approx: true` trong manifest. Không nên cắt đoạn ở mọi `###`, vì mỗi ranh giới bắt buộc làm tăng ước tính 30–40% request. Nếu người dùng chấp nhận chỉ dùng `##` (khớp với TOC) thì ghi rõ quyết định đó vào `plan.md`.

## Minor

- **m1. Tính toàn vẹn khi chạy tiếp** (phase-03 "Lưu trữ"). Ghi `tmp` rồi rename nhưng không `fsync` file đoạn trước khi rename, nên mất điện có thể để lại file `.pcm` 0 byte. Plan "đếm file `.pcm`" nên một chỗ trống ở giữa sẽ cho ra sai chỉ số. Nếu `chunk-packer` đổi thuật toán mà quên tăng `AUDIO_PIPELINE_VERSION`, các đoạn cũ và mới sẽ trộn lẫn. Cách sửa: `fsync` trước khi rename. `meta.json` lưu sha256 văn bản của từng đoạn, và khi chạy tiếp thì tìm chỉ số trống đầu tiên, kiểm tra kích thước khác 0 và chẵn. Lệch hash thì xoá thư mục work của khoá đó. Trước khi xoá một file trong `retired` thì kiểm tra lại rằng manifest không tham chiếu nó.
- **m2. Ước tính đĩa sai** (phase-03 "Risk", "PCM dở tối đa một bài ~100 MB"). Luật "8 lần `retryable` thì hoãn bài, sang bài khác" và việc chưa nói rõ có xoá work khi `rejected` hay không làm cho nhiều thư mục PCM dở có thể tồn tại cùng lúc. Cách sửa: vòng sau ưu tiên bài đang dở, giới hạn tối đa 2 thư mục work. Dọn thêm `work/manifest.invalid-*` cũ hơn 30 ngày.
- **m3. Bố cục thư mục** (phase-04 compose). `${OMNILAB_DATA_DIR}/audio` nằm trong volume rw của `sync` (`compose.yml:80`), nên sync, service đối diện Internet qua `/api`, ghi được vào `public/` mà Caddy phục vụ cùng origin. App lại mount cả `work/` và chỉ dựa vào regex để chặn. Cách sửa: dùng thư mục anh em `${OMNILAB_AUDIO_DIR:-/srv/data/omnilab-audio}`. App chỉ mount `.../public:/srv/audio:ro`, và lệnh `install -d` tạo cả `audio` và `audio/public` với uid 1000.
- **m4. Content-Type của `.m4a`** (phase-04 bước 2, "nếu Caddy trả kiểu khác thì đặt"). Thử trên Windows thì Go lấy MIME từ registry (thường là `audio/x-m4a`), còn image alpine lấy từ `/etc/mime.types`, nên kết quả thử trên máy dev không đại diện cho production. Thêm vào đó, `FROM caddy:2-alpine` (`Dockerfile:34`) không pin bản. Cách sửa: luôn đặt `header @audioMedia Content-Type "audio/mp4"` và kiểm tra lại header trên VPS.
- **m5. Giữ kín key** (phase-03 "Security", phase-04 "Security"). `spawn(ffmpeg)` mặc định kế thừa `process.env`, nên ffmpeg cũng có `GEMINI_API_KEY`. Interactions API mặc định `store=true` (free tier lưu 1 ngày). `docker inspect <container>` cũng lộ key (giống `SESSION_SECRET` hiện nay). Cách sửa: gọi spawn với `env: { PATH: process.env.PATH }`, gửi `"store": false` trong body, và thêm vào test của client. Cân nhắc dùng compose `secrets:` (file) để key không nằm trong Env của container.
- **m6. Tính năng phụ có thể chặn deploy site** (phase-02 bước 6, phase-04 deploy.sh). Bộ trích ném exception với một bài mới thì `astro build` hỏng, cả Railpack lẫn VPS đều không ra được bài mới. `apk add ffmpeg` lỗi mạng thì `docker compose build app sync tts` dừng toàn bộ deploy. Cách sửa: endpoint bọc từng bài trong try/catch, bài lỗi thì bỏ khỏi file, không gắn `data-script-hash` và có `console.warn`. Build tts tách khỏi `set -e` của site (build tts lỗi thì giữ image tts cũ, vẫn deploy app và sync).
- **m7. Thêm phạm vi so với quyết định đã chốt** (phase-05 "Hiển thị"). Bản tóm tắt ở aside ≥1280px và mini bar không có trong các quyết định đã chốt. Hai phần này đòi thêm IntersectionObserver, padding đáy và va chạm vị trí với toast (`reader-toast.astro:51-57` đặt toast ở cùng chỗ trên dock). Đề xuất: giữ mini bar vì nó thay được vai trò của aside khi card cuộn khỏi màn hình, bỏ bản aside để giảm một bản sao UI và khoảng 0,25d.
- **m8. Ước tính quota và effort** (`plan.md` câu hỏi 1, frontmatter `effort: 6.75d`). Đoạn không được vắt qua mục, nên với 78 mục "Mở đầu" và 344 `##`, số request thực tế khoảng 450–500 chứ không phải ~363 theo con số 653k/1.800. Với 10–20 RPD, đợt đầu mất khoảng 23–50 ngày, không phải 3–5 tuần. Mỗi lần deploy đổi nội dung thì container tts bị tạo lại (`stop_grace_period: 20s` nhỏ hơn latency TTS) và có thể mất một request đang chạy. Phase 3 (8 module, 6 file test có đồng hồ giả) và phase 5 mỗi phase 1,75d là lạc quan, thực tế tổng khoảng 8–9d. Nên ghi lại ước tính sau phase 1 dựa trên RPD thật.
- **m9. Sửa một lỗi chính tả là tạo lại cả bài** (phase-03 "Khoá"). `audioKey` tính theo cả bài, nên sửa một chữ trong bài 27,7k ký tự tốn khoảng 16 request, tức 1–2 ngày quota. Phương án tốt hơn về chi phí: cache theo đoạn, khoá là sha256 của (văn bản đoạn + model + voice + style + pipeline), lưu FLAC (cỡ 1 GB cho toàn kho), và chỉ gọi API cho đoạn đổi. Đánh đổi là tốn đĩa và phức tạp hơn. Cần người dùng quyết dựa trên tần suất sửa bài.
- **m10. Điều khoản EEA/UK chưa có điểm chặn** (`plan.md` câu hỏi 5, phase-06 "Security"). Đây đang là câu hỏi mở, nhưng không phase nào yêu cầu người dùng xác nhận trước khi bật trên VPS. Cách sửa: thêm vào checklist VPS ở phase 4 bước "chủ dự án xác nhận chấp nhận rủi ro điều khoản free tier", ghi vào `calibration.md`. Việc này không đảo lại quyết định dùng free tier.

## Thứ tự sửa đề xuất

1. M1 (bảo vệ khi dọn rác), M2 (kiểm tra audio, `no_audio` có thể thử lại): sửa trong phase 3 trước khi viết code.
2. M3: sửa thiết kế controller và test ở phase 5.
3. M4: hỏi người dùng hoặc thêm mốc `###` gần đúng, rồi cập nhật hợp đồng manifest ở phase 2 (`chapters[].approx`).
4. m3, m5, m6: cập nhật phase 4 (bố cục mount, env của spawn, `store:false`, tách build tts).
5. Các mục Minor còn lại: ghi vào plan dưới dạng quyết định hoặc rủi ro chấp nhận.

## Câu hỏi còn mở

1. Người dùng có chấp nhận nút chỉ ở `##` (khớp TOC), hay cần mốc gần đúng cho `###` (M4)?
2. Tần suất sửa bài sau khi xuất bản có đủ cao để đáng làm cache theo đoạn (m9) không?
3. Ổ đĩa VPS còn trống bao nhiêu? Con số này quyết định thời gian giữ file và có lưu FLAC theo đoạn được không.
4. Model TTS có trả 5xx hoặc phản hồi thiếu audio vẫn bị tính vào RPD không? Chưa có nguồn; cần ghi lại khi chạy thật ở phase 1 và 4.

Status: DONE_WITH_CONCERNS
Summary: 0 Blocker, 4 Major, 10 Minor. Plan chắc ở phần hạ tầng và bảo mật key, nhưng cần thêm bảo vệ khi dọn rác, kiểm tra audio trả về, sửa luồng tua trên iOS và xác nhận lại phạm vi nút theo heading trước khi code.
