---
phase: 5
title: "Infra deploy backup"
status: in-progress
priority: P1
effort: "1d"
dependencies: [2]
---

# Phase 5: Infra, deploy, backup

## Overview
Đưa sidecar vào Dockerfile/compose trên **mạng riêng**, Caddy trong image proxy `/api/*`, deploy.sh build/kiểm/rollback cả hai image, backup và restore SQLite an toàn.

## Requirements
- Container `app`: giữ read-only; header CSP và cache cho trang tĩnh không đổi.
- `sync` (RT#4):
  - **Chỉ** ở mạng `internal` (`internal: true`), không bao giờ ở `web`; alias `omnilab-sync`.
  - read-only rootfs, chỉ ghi `/data`; không `ports:`.
  - `mem_limit: 192m` (RT#6); healthcheck `/api/health`.
- Dữ liệu ngoài thư mục repo (RT#14):
  - bind mount `/srv/data/omnilab:/data` (đường dẫn qua biến `OMNILAB_DATA_DIR`, mặc định giá trị này);
  - `.dockerignore` thêm `data`, `.data`, `*.db`, `*.db-*`.
- `sync.environment`: `SESSION_SECRET: ${SESSION_SECRET:?SESSION_SECRET chưa đặt}` (RT#14).
- Image (RT#10):
  - Dockerfile đặt tên stage `AS build`, `AS app`, `AS sync`;
  - compose khai `target: app` / `target: sync`;
  - image `omnilab:${IMAGE_TAG}` và `omnilab-sync:${IMAGE_TAG}`.

## Architecture
- Caddyfile (RT#11):
  - `handle /api/* { reverse_proxy omnilab-sync:3000 { @down status 5xx … } }`. Nếu upstream không kết nối được → `respond` JSON `{"code":"unavailable"}` 503, `Content-Type: application/json`, `Cache-Control: no-store`. Dùng `handle_errors` có matcher `path /api/*` đặt trước nhánh `/{err.status_code}.html`.
  - Matcher `@notHashed` thành `not path /_astro/* /api/*`.
  - Cập nhật comment threat model cạnh CSP: site giờ có cookie phiên (HttpOnly, Path=/api) và username người dùng; giữ `script-src 'self'`; giữ `style-src 'unsafe-inline'` với lý do không render HTML từ người dùng (island dùng `textContent`).
- compose: `app` nối `web` + `internal`; `sync` chỉ nối `internal`; `app.depends_on: [sync]` dạng `service_started` (site không chờ sync).
- Dockerfile stage `sync`:
  - `FROM node:24.x-alpine` (pin minor);
  - copy `server/sync`, `src/lib/progress-state.ts`, `src/lib/progress-merge.ts`;
  - `USER node`; `CMD ["node","server/sync/sync-server-entry.ts"]`.
- deploy.sh (RT#10):
  1. Kiểm `.env` có `SITE_URL` và `SESSION_SECRET` dài ≥ 32.
  2. Build cả hai service với `TAG`; `up -d --no-build`.
  3. Cổng: `wget` qua `app` tới `/` **và** `/api/health` (phải 200, không chỉ "có phản hồi").
  4. OK → tag `latest` + prune cả `omnilab` và `omnilab-sync` (giữ TAG, PREV).
  5. Lỗi → rollback:
     - `app` về PREV bằng `--no-deps`;
     - nếu `docker image inspect omnilab-sync:$PREV` có → `sync` về PREV, không có (lần deploy sync đầu) → `docker compose stop sync`.
     - Không dùng `set -e` cho đoạn rollback.
- Backup (RT#14):
  - `deploy/backup-sync-db.sh` chạy `docker compose exec -T sync node server/sync/sync-server-entry.ts --backup`;
  - chế độ `--backup` trong entry: tạo `/data/backups`, xoá file đích nếu có, `VACUUM INTO /data/backups/omnilab-YYYY-MM-DD.db`, xoá bản > 14 ngày; mọi việc chạy với uid của container nên không lỗi quyền.
  - Cron 03:15 của user deploy, log vào `/srv/data/omnilab/backup.log`.
  - Khuyến nghị (docs) `rclone copy` ra ngoài VPS.
- Restore (RT#14): `docker compose stop sync` → `rm -f omnilab.db-wal omnilab.db-shm` → copy backup thành `omnilab.db` → `chown 1000:1000` → `docker compose start sync`.

## Related Code Files
- Modify: `Caddyfile`, `Dockerfile`, `compose.yml`, `deploy/deploy.sh`, `.dockerignore`, `.gitignore`
- Create: `deploy/backup-sync-db.sh`
- (Không tạo test chuỗi Caddyfile; xác minh bằng `docker compose config` + diff header curl, RT#15)

## Implementation Steps (TDD)
1. **Đỏ/baseline**: lưu `curl -sI` của `/`, một trang bài, một asset `/_astro/*` từ bản hiện tại (local `docker compose up`) làm mốc so sánh.
2. **Đỏ** `docker compose config`: phải thấy `sync` không có mạng `web`, có `target: sync`, không có `ports`.
3. **Xanh**: sửa file.
4. Local (`SITE_URL=http://localhost:8080`, `COOKIE_SECURE=0`, `OMNILAB_DATA_DIR=./.data`):
   - diff header với mốc (chỉ khác ở `/api`);
   - `/api/health` 200; đăng ký + PUT/GET qua `localhost:8080`;
   - `docker compose stop sync` → `/api/me` trả JSON 503, `/` vẫn 200.
5. Thử deploy.sh lần đầu không có PREV sync (giả lập healthcheck fail) → `app` về PREV, `sync` dừng, script in "rolled back".
6. Backup chạy 2 lần cùng ngày không lỗi; restore theo quy trình → đăng nhập được, dữ liệu đúng.

## Success Criteria
- [ ] Header trang tĩnh không đổi so với mốc.
- [ ] `docker network inspect web` không chứa container sync.
- [ ] `sudo ss -tlnp` không lộ 3000.
- [ ] Sync sập → site 200, `/api/*` 503 JSON, UI `unavailable`.
- [ ] Rollback lần đầu và backup/restore đã thử thành công.

## Risk Assessment
- Thư mục `/srv/data/omnilab` phải thuộc uid 1000: bước `sudo mkdir -p … && sudo chown 1000:1000 …` trong guide.
- Schema DB chỉ thêm cột/bảng, nên rollback sidecar không phải đảo migration.
