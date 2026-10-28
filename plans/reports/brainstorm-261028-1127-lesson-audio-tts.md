# Brainstorm: nghe bài học bằng giọng Gemini TTS

Ngày: 2026-10-28. Trạng thái: chờ người dùng chốt các câu hỏi cuối, sau đó lập plan.

## Hợp đồng

**Kết quả:** Mỗi bài học có nút "Nghe bài". Người dùng đọc hoặc nghe tùy ý. Âm thanh tạo bằng Gemini TTS, giọng nam trầm, dùng hạn mức miễn phí. Một job chạy nền tự phát hiện bài mới hoặc bài đã sửa mà chưa có âm thanh, tự chuyển đổi. Hết lượt thì tự đợi tới khi hạn mức được cấp lại rồi chạy tiếp.

**Ràng buộc:**
- Chỉ dùng free tier Gemini API. Hạn mức TTS miễn phí Google không công bố; báo cáo từ cộng đồng khoảng 10–20 request/ngày, reset lúc 0h giờ Thái Bình Dương (14h–15h giờ Việt Nam). Job phải chạy đúng dù hạn mức là bao nhiêu.
- Free tier: Google được dùng nội dung gửi lên để cải thiện sản phẩm. Bài học đã công khai nên chấp nhận được.
- API key chỉ nằm trên máy chủ (`.env`), không bao giờ ra trình duyệt hay vào git.
- Nội dung gốc không bị sửa (`verify-fidelity` vẫn qua). Âm thanh là bản phái sinh, tạo từ văn bản bài.
- Site vẫn chạy bình thường khi chưa có âm thanh, khi job dừng, hoặc khi deploy kiểu Railpack (không có job): nút nghe ẩn đi.
- CSP hiện tại `default-src 'self'` đã cho phép phát media cùng origin, không cần nới.

**Ngoài phạm vi:** trả phí Gemini; chọn giọng nghe trong app; tải về nghe offline (PWA v1 không offline); đánh dấu chữ chạy theo giọng đọc; dịch hay viết lại bài bằng LLM trước khi đọc.

**Tiêu chí hoàn thành:**
1. Bài có âm thanh hiện trình phát: phát/dừng, tua ±15 giây, tốc độ 0,75–2x, nhớ vị trí nghe dở trên máy, điều khiển ở màn hình khoá (Media Session).
2. Deploy một bài mới: job tự nhận ra và tạo âm thanh mà không cần chạy lệnh tay.
3. Hết hạn mức (HTTP 429): job ghi log, ngủ tới mốc reset, rồi chạy tiếp từ đoạn đang dở, không mất các đoạn đã tạo.
4. Sửa nội dung một bài: job tạo lại âm thanh cho bài đó (nhận biết bằng hash văn bản đọc + giọng + model + style).
5. Có test cho phần chuyển MDX sang văn bản đọc, chia đoạn, tính mốc reset, và quyết định bài nào cần tạo.

## Số liệu đo được

- 78 bài, khoảng 653 nghìn ký tự cần đọc (đã bỏ code, Figure, Disclaimer, ReviewNote; đo bằng `mdxToPlainText` có sẵn). Bài dài nhất khoảng 27,7 nghìn ký tự.
- Ước tính khoảng 13 giờ âm thanh (14 ký tự/giây).
- Chia đoạn khoảng 3,5 nghìn ký tự (4–5 phút) thì cần khoảng 190 request. Với 10–20 request/ngày, đợt đầu mất khoảng 10–19 ngày. Sau đó mỗi bài mới chỉ tốn 2–8 request.
- WAV gốc từ Gemini (24 kHz, 16-bit, mono) cho 13 giờ là khoảng 2,2 GB. Nén AAC 48 kbps mono còn khoảng 280 MB, nên phải nén.

## Các phương án đã so sánh

| | A. Worker sidecar trên VPS (đề xuất) | B. Script chạy trên máy Windows + Task Scheduler | C. GitHub Actions cron |
|---|---|---|---|
| Cách chạy | Service `tts` mới trong `compose.yml`, chạy liên tục, ghi âm thanh vào thư mục dữ liệu VPS; Caddy phục vụ `/audio/*` từ thư mục đó (mount chỉ đọc) | Chạy `pnpm tts` theo lịch, rồi đẩy file lên VPS bằng scp/rsync | Workflow theo lịch tạo âm thanh rồi commit hoặc đưa lên Release |
| Tự chạy khi có bài mới | Có: danh sách văn bản đọc được tạo lúc build image, mỗi lần deploy là có danh sách mới | Chỉ khi máy bật và đã pull code | Có |
| Giả định dễ vỡ nhất | VPS có chỗ khoảng 300 MB và cho phép kết nối ra ngoài | Máy luôn bật, có quyền SSH lên VPS | Repo chịu được hàng trăm MB âm thanh |
| Hỏng đầu tiên khi | Mạng `internal` chặn kết nối ra ngoài, nên service phải có mạng riêng được ra Internet | Máy tắt hoặc ngủ thì job dừng | Git phình to mỗi lần tạo lại; Actions phải giữ key |

Đề xuất A vì production hiện là VPS Docker Compose ([README.md](../../README.md), [compose.yml](../../compose.yml)), đã có sẵn thư mục dữ liệu bền `${OMNILAB_DATA_DIR}` và cơ chế deploy tự build lại image. Nếu bỏ thì chỉ cần gỡ một service, ít tốn kém nhất.

Better approaches: không có. Hướng đề xuất trùng với yêu cầu của người dùng (job tự chạy, đợi hết lượt); bằng chứng là hạ tầng VPS hiện có.

## Thiết kế đề xuất (phương án A)

1. **Lúc build:** script build tạo `tts-scripts.json` từ MDX. Mỗi bài gồm id, hash, và danh sách đoạn văn bản đọc. Chia đoạn theo ranh giới heading (`##`), không cắt giữa câu. Tái dùng `src/lib/search-mdx-to-text.ts` bằng cách mở rộng (thêm hàm mới, không đổi hành vi đang dùng cho tìm kiếm).
2. **Chuyển văn bản đọc** (quyết định cố định, không dùng LLM): bỏ khối code và nói "đoạn mã, xem trên màn hình"; bảng đọc theo từng hàng, kèm tên cột; Figure chỉ đọc caption; RealLife đọc kèm câu dẫn "Ví dụ đời sống"; link chỉ giữ chữ. Giọng và nhịp đặt ở trường `style`, vì Gemini đọc trường `text` đúng nguyên văn.
3. **Worker** (Node 24, cùng kiểu với `server/sync`, không cần thêm npm dep; dùng `ffmpeg` của Alpine để nén AAC):
   - Vòng lặp: đọc danh sách văn bản đọc và manifest, chọn bài thiếu hoặc lệch hash (bài chưa có âm thanh trước, bài đã sửa sau). Mỗi lần gọi API xử lý một đoạn, lưu đoạn đó xuống đĩa ngay.
   - Đủ đoạn thì ghép lại, nén thành `audio/<lessonId>-<hash>.m4a`, cập nhật `manifest.json` bằng ghi file tạm rồi đổi tên, sau đó xoá file cũ.
   - Lỗi 429: nếu có `retryDelay` ngắn thì đợi đúng thời gian đó; nếu là hạn mức theo ngày thì ngủ tới 0h Pacific cộng vài phút. Lỗi 5xx thì đợi tăng dần. Không có key thì ngủ, không làm sập container.
4. **Phía site:** trang bài tải `/audio/manifest.json`. Có bản khớp thì hiện trình phát, không có thì ẩn. Vị trí nghe dở lưu trong `localStorage` theo cùng quy ước khoá `omnilab:v1:*`.
5. **Giọng:** các ứng viên nam trầm là Algenib ("Gravelly"), Charon, Orus, Gacrux. Thư viện giọng mở rộng có lọc theo giới tính và cao độ thấp. Dùng một lệnh `tts:sample` tạo đoạn mẫu tiếng Việt khoảng 20 giây cho mỗi giọng (tốn 4–5 request) để người dùng nghe rồi chọn. Model mặc định `gemini-3.8-flash-tts` (free tier, có tiếng Việt).
6. **Tăng tốc (tuỳ chọn):** mỗi model TTS có hạn mức riêng. Có thể chạy song song model `flash-lite-tts`, nhưng mỗi bài chỉ dùng một model để giọng không đổi giữa chừng.

## Rủi ro

- Hạn mức free có thể giảm hoặc model preview bị gỡ. Model và giọng để ở cấu hình, đổi được mà không sửa code. Đổi model thì hash đổi, các bài sẽ được tạo lại dần.
- Đọc liên tục 4–5 phút có thể làm giọng bị trôi. Kích thước đoạn để ở cấu hình, nghe thử bằng `tts:sample` rồi chỉnh.
- Phát âm thuật ngữ tiếng Anh trong bài Kiến trúc hệ thống có thể chưa chuẩn. Cần nghe thử một bài.
- Nhớ cấu hình: thêm `GEMINI_API_KEY` vào `.env` trên VPS, thêm bước kiểm tra trong `deploy/deploy.sh` (không bắt buộc có key để deploy qua), cập nhật `docs/deployment-vps-guide.html`. Người dùng tự deploy.

## Quyết định đã chốt (người dùng, 2026-10-28)

1. Worker chạy dạng sidecar trên VPS (phương án A). Railpack vẫn phải build được, chỉ không có nút nghe.
2. Bảng đọc theo từng hàng kèm tên cột; code chỉ nói "đoạn mã, xem trên màn hình".
3. Bài vừa sửa mà âm thanh mới chưa xong: vẫn cho nghe bản cũ, kèm ghi chú "Bản nghe của phiên bản trước".
4. Có làm danh sách mục: trình phát có danh sách mục, mỗi heading trong bài có nút "nghe từ mục này" (mở rộng phạm vi so với yêu cầu ban đầu, người dùng đã đồng ý).
