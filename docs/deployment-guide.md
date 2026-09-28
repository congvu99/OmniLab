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
  - HTML (`*.html`, `/`) → `Cache-Control: no-cache` (luôn revalidate, không cache cứng).
- Security header trên mọi response: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, CSP chỉ `'self'`
  (không có domain ngoài — font tự host, không dùng Google Fonts/CDN).
- `try_files {path} {path}.html {path}/index.html` + `handle_errors` →
  `/{status_code}.html` — **không** có SPA fallback (`/index.html` khi miss),
  nên URL sai luôn ra 404 thật, không bị nuốt bởi trang chủ.

## 4. Checklist smoke test sau deploy

Chạy các lệnh sau, thay `$DOMAIN` bằng domain thật (vd `omnilab.vn`):

```bash
# 1. Trang chủ phải 200
curl -s -o /dev/null -w "%{http_code}\n" https://$DOMAIN/
# kỳ vọng: 200

# 2. URL không tồn tại phải 404 thật (không fallback trang chủ)
curl -s -o /dev/null -w "%{http_code}\n" https://$DOMAIN/khong-ton-tai
# kỳ vọng: 404

# 3. Asset /_astro/* phải có cache header immutable
curl -sI https://$DOMAIN/_astro/<ten-file-thuc-te>.js | grep -i cache-control
# kỳ vọng: public, max-age=31536000, immutable

# 4. HTTPS hợp lệ (không lỗi chứng chỉ)
curl -sI https://$DOMAIN/ | head -1
# kỳ vọng: HTTP/2 200 (không phải lỗi SSL)

# 5. Security header có mặt
curl -sI https://$DOMAIN/ | grep -iE "x-content-type-options|referrer-policy|content-security-policy"
```

Nếu bước 2 trả `200` với nội dung trang chủ (không phải trang 404 thật) →
nền tảng đang bỏ qua `Caddyfile` custom, thử đặt `RAILPACK_NO_SPA=1` và
`RAILPACK_SPA_OUTPUT_DIR=dist` rồi redeploy.

## 5. Rollback

Vibe Deploy Nhân Hòa (theo Railpack/Railway convention) cho phép chọn lại
deployment trước đó trên dashboard — chọn commit/build trước và "Redeploy".
Không cần thao tác gì trong repo.
