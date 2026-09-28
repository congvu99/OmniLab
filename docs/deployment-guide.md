# Hướng dẫn deploy (Railpack + Vibe Deploy Nhân Hòa)

Repo này build ra site tĩnh (Astro `output: 'static'`). Repo chỉ đảm bảo
**build được bằng Railpack**; việc tạo app, gắn domain, TLS, git remote,
theo dõi uptime trên Vibe Deploy Nhân Hòa do người dùng tự làm.

## 1. Railpack detect app này thế nào

- Railpack thấy `astro.config.mjs` với `output` khác `"server"` → nhận diện
  Astro static site, dùng Node provider để cài deps + `pnpm build`, output
  mặc định `dist/`.
- Node version: Railpack đọc theo thứ tự `RAILPACK_NODE_VERSION` → `engines.node`
  trong `package.json` → `.node-version`. Repo đã set cả `engines.node` và
  `.node-version` = `24`; đặt thêm env `RAILPACK_NODE_VERSION=24` trên
  dashboard nếu muốn ép cứng, không bắt buộc.
- Serve: Railpack dùng Caddy. Vì repo có `Caddyfile` ở root, Railpack dùng
  file này thay vì Caddyfile mặc định của nó — quyết định header cache,
  security header, và 404 thật (không fallback SPA).

## 2. Env vars khuyến nghị

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `SITE_URL` | `https://<domain-that>` | Dùng để sinh `sitemap.xml` đúng domain. Không set → fallback `https://omnilab.example` (build vẫn chạy nhưng sitemap sai domain). |
| `RAILPACK_NODE_VERSION` | `24` | Không bắt buộc (đã có `.node-version`), đặt để chắc chắn. |
| `RAILPACK_NO_SPA` | `1` | **Dự phòng** nếu nền tảng bỏ qua `Caddyfile` custom và dùng static-file provider mặc định của Railpack — tắt SPA fallback để URL sai vẫn ra 404 thật thay vì trả `index.html`. |
| `RAILPACK_SPA_OUTPUT_DIR` | `dist` | Dự phòng cùng lý do trên — chỉ đúng thư mục output nếu Railpack không tự nhận ra. |

Không có secret nào khác cần thiết ở Phase 1 (chưa có API/DB).

## 3. Caddyfile làm gì

File `Caddyfile` ở root ghi đè Caddyfile mặc định của Railpack:

- Lắng nghe `:{$PORT:80}` (đúng convention Railpack truyền `$PORT`).
- `root * dist`, `file_server` (ẩn `.git`, `.env*`), nén `gzip`/`zstd`.
- Cache:
  - `/_astro/*` (asset có content-hash) → `Cache-Control: public, max-age=31536000, immutable`.
  - Mọi đường dẫn ngoài `/_astro/*` (HTML clean URL, `*.json`, manifest, icon) → `Cache-Control: no-cache` (luôn revalidate).
- Security header trên mọi response:
  - `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
  - **CSP**: `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`
    - `script-src 'self'` (không hash): Tất cả component scripts ngoài file (Astro `vite.build.assetsInlineLimit: 0`), không inline `<script>` → không cần hash, CSP đơn giản hơn
    - `style-src 'unsafe-inline'`: Chỉ cho phép inline styles từ Shiki syntax highlighting trong code block (không có cách khác mà không inlining)
- `try_files {path} {path}.html {path}/index.html` + `handle_errors` →
  `/{status_code}.html` — **không** có SPA fallback (`/index.html` khi miss),
  nên URL sai luôn ra 404 thật, không bị nuốt bởi trang chủ.

## 4. Checklist smoke test sau deploy

### 4.1 HTTP/HTTPS headers & serving (từ terminal)

Chạy các lệnh sau, thay `$DOMAIN` bằng domain thật (vd `omnilab.vn`):

```bash
# 1. Trang chủ phải 200
curl -s -o /dev/null -w "%{http_code}\n" https://$DOMAIN/
# kỳ vọng: 200

# 2. URL không tồn tại phải 404 thật (không fallback trang chủ)
curl -s -o /dev/null -w "%{http_code}\n" https://$DOMAIN/khong-ton-tai
# kỳ vọng: 404

# 3. API endpoints phải 200
curl -s -o /dev/null -w "%{http_code}\n" https://$DOMAIN/search-index.json
# kỳ vọng: 200
curl -s -o /dev/null -w "%{http_code}\n" https://$DOMAIN/lessons-index.json
# kỳ vọng: 200

# 4. Asset /_astro/* phải có cache header immutable
curl -sI https://$DOMAIN/_astro/main.*.js | grep -i cache-control
# kỳ vọng: public, max-age=31536000, immutable

# 5. HTML phải có cache header no-cache
curl -sI https://$DOMAIN/ | grep -i cache-control
# kỳ vọng: no-cache

# 6. HTTPS hợp lệ (không lỗi chứng chỉ)
curl -sI https://$DOMAIN/ | head -1
# kỳ vọng: HTTP/2 200 (không phải lỗi SSL)

# 7. Security header có mặt
curl -sI https://$DOMAIN/ | grep -iE "x-content-type-options|referrer-policy|content-security-policy"
# kỳ vọng: output có 3 header trên
```

**Nếu bước 2 trả `200` với nội dung trang chủ** (không phải trang 404 thật):
- Nền tảng đang bỏ qua `Caddyfile` custom, thử đặt `RAILPACK_NO_SPA=1` và
  `RAILPACK_SPA_OUTPUT_DIR=dist` trên Vibe Deploy dashboard rồi redeploy.

### 4.2 Browser testing (desktop)

Trên máy tính, mở trình duyệt (Chrome, Firefox, Safari):

```
1. Trang chủ (https://$DOMAIN/) → phải load đầy đủ, không lỗi console
2. Bài học (https://$DOMAIN/hoc/kien-truc/chu-de/cache) → 
   - Hiện toàn bộ nội dung + ảnh
   - Dark mode: Tắt/bật OS dark mode → giao diện đổi màu
   - Developer Tools (F12) → Network tab:
     * Kiểm tra CSS/JS không có lỗi 404
     * Kiểm tra CSP header (không vi phạm CSP)
3. Tìm kiếm (https://$DOMAIN/tim-kiem) →
   - Gõ "cache" → kết quả hiện trong 1 giây
   - Gõ "bộ nhớ đệm" → hiện kết quả, bài Cache nên ở top
   - Gõ "bo nho dem" (không dấu) → kết quả giống "bộ nhớ đệm"
4. Lưu bài (bookmark button) → bài xuất hiện trên /da-luu
5. Đánh dấu hoàn thành (mark complete) → % ở trang lĩnh vực cập nhật
```

### 4.3 iPhone Safari (iOS standalone)

Trên iPhone/iPad với iOS 16+:

```
1. Mở Safari → nhập https://$DOMAIN
2. Chờ trang load xong
3. Tap Share (icon mũi tên) → "Add to Home Screen" → "Add"
4. Về home screen → tap icon OmniLab
   → Phải mở fullscreen (không browser chrome) ✅
   → Không có address bar ✅
   → Tab bar nằm dưới với 4 items (home, domains, saved, search) ✅
5. Scroll bài → Đánh dấu hoàn thành → % lĩnh vực cập nhật ngay ✅
6. Tap "Lĩnh vực" tab → Phải hiện danh sách lĩnh vực
7. Search: Tap "Tìm" tab → Gõ "cache" → Kết quả hiện
8. Saved: Tap tab Đã lưu → Phải hiện bài đã lưu (nếu có)
9. Đóng app → Mở lại → % hoàn thành + saved list vẫn còn
10. Kiểm tra safe-area (notch, home bar):
    - Nếu phone có notch → tab bar không bị che bởi notch
    - Nếu phone có Dynamic Island → không bị cover
    - Home bar area: padding đủ (tab bar không bị home bar che)
```

**Lưu ý**:
- Standalone mode cách biệt khỏi Safari (khác cache, khác localStorage)
- Nếu sửa web rồi update, cần xóa app khỏi home screen + re-add để thấy version mới
- Progress lưu localStorage (in-memory fallback private mode, không persist)

## 5. Rollback

Vibe Deploy Nhân Hòa (theo Railpack/Railway convention) cho phép chọn lại
deployment trước đó trên dashboard — chọn commit/build trước và "Redeploy".
Không cần thao tác gì trong repo.
