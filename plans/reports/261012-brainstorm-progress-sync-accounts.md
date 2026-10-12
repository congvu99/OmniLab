# Brainstorm: Đồng bộ tiến độ học qua tài khoản (sidecar sync)

- Ngày: 2026-10-12 · Trạng thái: **đã duyệt thiết kế** · Mode: không `--html`, không `--wiki`
- Deploy đích: VPS Contabo, Docker Compose, Caddy chung ([docs/deployment-vps-guide.html](../../docs/deployment-vps-guide.html))

## 1. Vấn đề & yêu cầu

Tiến độ (`omnilab:v1:state` trong localStorage) gắn theo máy + tên miền → không dùng được nhiều thiết bị, mất khi đổi domain. Cần một nơi lưu duy nhất, không DB server riêng, nhiệm vụ duy nhất: lưu + đồng bộ trạng thái học.

| Mục | Chốt |
|---|---|
| Output | Đăng ký (tên, mk, nhập lại mk) / đăng nhập / đăng xuất; tự đồng bộ giữa thiết bị |
| Dữ liệu sync | Hoàn thành, bookmark, bài đang học (`visitedAt`), vị trí cuộn |
| Acceptance | Máy A đánh dấu xong bài X → máy B mở app/quay lại tab thấy X xong ≤ vài giây; sửa đồng thời 2 máy không mất dữ liệu; chưa đăng nhập app chạy y như hiện tại; site tĩnh + header Caddyfile không đổi |
| Ngoài phạm vi | Quên mật khẩu qua email, OAuth, chia sẻ giữa user, offline service worker, multi-instance |
| Ràng buộc | Node 24, 0 dependency mới phía server, cùng repo/compose/VPS, container `app` vẫn read-only |

## 2. Phương án đã xét

| Phương án | Kết luận |
|---|---|
| KV serverless ngoài (Cloudflare/Upstash) | Loại: user muốn tự host trên VPS, không thêm nền tảng |
| QR/link chuyển tay | Loại: không phải sync thật |
| Google Drive appData | Loại: OAuth trong PWA iOS kém, bắt buộc tk Google |
| Astro node adapter thay Caddy | Duyệt ban đầu, **thay bằng sidecar** khi biết deploy là VPS: phải port CSP/cache/404 sang middleware, mất read-only, blast radius cả site |
| **Sidecar `sync` trong compose** | **Chọn** |

## 3. Giải pháp

```
Caddy chung (TLS, HSTS) → omnilab:8080 (Caddy + dist/, read-only)
                                 └─ /api/* → sync:3000 (Node 24 thuần) → data/omnilab.db (bind mount)
```

- `sync`: `node:http` + `node:sqlite` + `node:crypto`, ~300 LOC, thư mục riêng (vd. `server/sync/`), image riêng hoặc stage riêng trong Dockerfile.
- Bảng: `users(username PK, pass_hash, created_at)`, `progress(username PK, state_json, updated_at)`.
- Mật khẩu: `scrypt` + salt ngẫu nhiên, so sánh `timingSafeEqual`. Tối thiểu 8 ký tự. Username chuẩn hoá lowercase, `[a-z0-9_.-]{3,32}`.
- Session: cookie HMAC (`SESSION_SECRET` trong `.env`), `HttpOnly; Secure; SameSite=Lax; Path=/api`, 180 ngày. Không bảng session.
- Rate limit in-memory: 5 lần sai / 15 phút / (username, IP); IP từ `X-Forwarded-For` (proxy tin cậy).
- Body ≤ 32 KB; state validate qua `migrate()` dùng chung.

### Contract

```
POST /api/auth/register {username,password,confirm} → 201 + cookie | 409 trùng tên | 400
POST /api/auth/login    {username,password}         → 200 + cookie | 401 | 429
POST /api/auth/logout                               → 204
GET  /api/me                                        → {username} | 401
GET  /api/progress                                  → ProgressState v2
PUT  /api/progress  ProgressState v2 → merge server-side → state đã merge
GET  /api/health                                    → 200 (healthcheck compose)
```

### Schema v2 + merge

- `ProgressState` lên `v:2`: mỗi trường lesson có `updatedAt` riêng (`doneUpdatedAt`, `scrollUpdatedAt`, `visitedAt` tự là ts); bookmark → map `{id: {on: boolean, at: number}}` (tombstone).
- `migrate()` v1→v2: gán `at` = timestamp sẵn có hoặc 0.
- `merge(a, b)`: thuần, theo từng lesson/từng trường, LWW theo timestamp; dùng chung client + server (module TS không phụ thuộc DOM, build ra JS cho sidecar hoặc sidecar import bản đã compile).
- Lưu ý: `isUnknownFutureVersion` hiện chặn ghi khi gặp v>1 → bản v2 rollback về v1 sẽ chỉ in-memory, đúng như thiết kế sẵn.

### Client sync

- localStorage vẫn là nguồn chính; module `progress-sync` gắn `progressStore.subscribe`.
- Pull: khi load + `visibilitychange` visible. Push: debounce 10s + flush khi `visibilitychange` hidden / `pagehide` (`fetch keepalive`).
- Đăng nhập lần đầu trên máy có dữ liệu local → `PUT` state local, server merge → nhận state hợp nhất.
- Đăng xuất: giữ dữ liệu local (không xoá), dừng sync.
- UI: mục "Tài khoản & đồng bộ" trong tab "Đã lưu": form đăng nhập/đăng ký, trạng thái "Đồng bộ lúc …", đăng xuất, ghi chú "quên mật khẩu = không khôi phục được".

### Hạ tầng thay đổi

- [Caddyfile](../../Caddyfile): thêm `handle /api/* { reverse_proxy sync:3000 }` trước `file_server`; CSP giữ nguyên (`connect-src 'self'`).
- [compose.yml](../../compose.yml): service `sync`, `read_only`, volume `./data:/data`, `mem_limit` ~96m, healthcheck `/api/health`, `env_file .env` (`SESSION_SECRET`).
- [deploy/deploy.sh](../../deploy/deploy.sh): build + thay cả 2 service, health check thêm `/api/health`; rollback giữ nguyên `data/`.
- Backup: cron hằng ngày `VACUUM INTO /srv/backups/omnilab-YYYYMMDD.db`, giữ 14 bản.
- `sync` fail-fast khi khởi động nếu `/data` không ghi được hoặc thiếu `SESSION_SECRET`.

## 4. Rủi ro

| Rủi ro | L | I | Giảm thiểu |
|---|---|---|---|
| Merge sai → mất tiến độ | M | H | `merge` thuần + unit test bảng (đồng thời, tombstone, clock lệch); local không bao giờ bị xoá |
| Lệch giờ giữa thiết bị làm LWW chọn sai | M | L | Chấp nhận; server có thể clamp ts tương lai > now+1 ngày |
| Brute-force | M | M | Rate limit + scrypt |
| Mất VPS/ổ đĩa → mất tài khoản | L | H | Backup hằng ngày, khuyến nghị copy ra ngoài VPS |
| Lộ `SESSION_SECRET` | L | H | Chỉ trong `.env` server, không commit; đổi secret = đăng xuất mọi người |
| Dữ liệu cá nhân (NĐ 13/2023) | L | M | Chỉ lưu username + hash + tiến độ; ghi chú chính sách ngắn trên form |
| Railpack/Vibe Deploy cũ dùng chung Caddyfile | L | L | `/api` trả 502 ở đó, site vẫn chạy; Vibe Deploy sắp bỏ |
| SQLite 1 instance | L | L | Nợ kỹ thuật có chủ đích, đủ cho quy mô hiện tại |

## 5. Ước lượng & đo thành công

- Công sức ~4–5 ngày: sidecar + auth (1,5), schema v2 + merge + test (1), sync client + UI (1–1,5), compose/Caddy/deploy/backup + docs (0,5–1).
- Độ phức tạp: merge O(n) theo số bài (~64); payload ~3–8 KB; tải ghi ≈ 1 PUT/10s/thiết bị đang đọc.
- Thành công: kịch bản 2 thiết bị pass thủ công; `pnpm test` có test merge/migrate v2; smoke `curl` header Caddy không đổi; `/api/health` 200; restore backup thử thành công 1 lần.

## 6. Bước tiếp & phụ thuộc

1. `/ck:plan` từ report này.
2. Docs cần cập nhật khi làm: `system-architecture.md`, `deployment-vps-guide.html` (backup, `SESSION_SECRET`, data/), `project-roadmap.md` (sync xong, hạng mục xuất/nhập JSON hạ ưu tiên), `README.md` (tính năng).
3. Nên ship trước khi chuyển domain sang DuckDNS để người dùng mang tiến độ theo.

## Câu hỏi còn mở

- Chuyển domain: người dùng hiện tại cần đăng nhập ở domain cũ trước khi đổi; có cần banner nhắc không?
- Có cần giới hạn đăng ký (chỉ bạn + người quen, mã mời) hay mở công khai?
- Backup có đẩy ra ngoài VPS (vd. Google Drive/rclone) không?
