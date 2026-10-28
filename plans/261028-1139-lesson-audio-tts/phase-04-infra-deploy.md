---
phase: 4
title: "Phase 4: Infra deploy"
status: in-progress
priority: P1
effort: "1d"
dependencies: [3]
---

# Phase 4: Infra deploy (Dockerfile, compose, Caddy, deploy.sh)

## Overview

Đóng gói worker thành service `tts` trên mạng egress riêng. Bản nghe nằm ở một thư mục host riêng, tách khỏi volume của sync: tts ghi cả thư mục, app chỉ mount `public/` ở chế độ chỉ đọc. Caddy phục vụ `/audio/*` với `Content-Type` và cache đúng loại file. `deploy.sh` build app và sync như cũ (lỗi thì dừng), rồi build tts riêng: lỗi ở tts chỉ in cảnh báo, giữ container tts cũ và không chặn việc deploy site. Cổng sức khoẻ không phụ thuộc tts. Railpack và `docker build .` vẫn ra site tĩnh; ở đó `/audio/manifest.json` trả 404 nên player ẩn.

<!-- Updated: Validation Session 1 - thư mục host riêng, ép Content-Type audio/mp4, build tts không chặn deploy, thêm kiểm iPhone (red-team m3, m4, m6, M3) -->

## Context links

- `Dockerfile:1-11` (stage `build`, cần `SITE_URL`), `:13-31` (stage `sync`, comment "app must stay the LAST stage" ở `:17-19`), `:33-41` (stage `app`).
- `compose.yml:3-20` (`app`: read_only, `tmpfs: [/tmp, /data, /config]`, mạng `web` + `internal`, 128m), `:22-47` (`sync`: cap_drop, no-new-privileges, bind `${OMNILAB_DATA_DIR:-/srv/data/omnilab}:/data`), `:49-53` (`internal: true` → không ra Internet).
- `Caddyfile:28` (`root * dist`), `:42-49` (`handle /api/*`), `:57-61` (cache `@astroAssets`, `@notHashed`), `:85` (CSP, không có `media-src` nên dùng `default-src 'self'`), `:94-99` (`file_server`, `try_files`), `:101-115` (`handle_errors`).
- `deploy/deploy.sh:33` (build), `:38-51` (cổng `/` và `/api/health`, tag `latest`, dọn image), `:53-68` (rollback, xử lý lần đầu chưa có image sync cũ).
- `.dockerignore` (đã loại `data`, `.data`, `tests`, `docs`, `plans`, `deploy`).
- Hướng dẫn VPS: thư mục dữ liệu mode 700, chủ uid 1000 (`docs/deployment-vps-guide.html:166,174`).
- Plan trước đã kiểm Caddy bằng binary thật trên máy dev (`plans/261012-progress-sync-accounts/plan.md`, mục Progress, "đã kiểm Caddy 2.10.2 thật").
- Red-team: `./reports/red-team-261028-1156-plan-review.md` (m3 thư mục host, m4 Content-Type, m6 build tts lỗi, M3 iOS).

## Requirements

### Dockerfile

- Stage mới `tts` chèn giữa `sync` và `app`; `app` vẫn là stage cuối (giữ nguyên comment lý do).
- `FROM node:24.15-alpine AS tts` (cùng pin với `sync`), `RUN apk add --no-cache ffmpeg` (chỉ image này), `ENV NODE_ENV=production`, `WORKDIR /app`.
- COPY đúng thứ worker import: `package.json` (cần `"type": "module"`), `server/tts`, `src/lib/speech-script-contract.ts`, `src/lib/audio-manifest.ts`, `src/lib/progress-state.ts`; `COPY --from=build /app/dist/tts-scripts.json ./tts-scripts.json`. Vì kéo stage `build`, target `tts` cần build arg `SITE_URL` (ghi trong comment).
- `RUN mkdir -p /data/audio && chown node:node /data/audio`, `USER node`, `CMD ["node", "server/tts/tts-worker-entry.ts"]`. Không `EXPOSE`, không `HEALTHCHECK` HTTP (worker không mở cổng; trạng thái xem qua log và manifest).
- Ghi lại kích thước image `omnilab-tts` sau build (nghiên cứu ước thêm 60–100 MB cho ffmpeg, chưa kiểm chứng).

### compose.yml

<!-- Updated: Validation Session 1 - thư mục host riêng cho audio, app chỉ mount public chỉ đọc (red-team m3) -->
- Thư mục host: `${OMNILAB_AUDIO_DIR:-/srv/data/omnilab-audio}`, tách khỏi `${OMNILAB_DATA_DIR}` của sync. Như vậy app không bao giờ thấy thư mục dữ liệu sync, và backup hay chmod của sync không đụng tới audio.
- Service `tts`: `build: { context: ., target: tts, args: { SITE_URL: ${SITE_URL:?…} } }`, `image: omnilab-tts:${IMAGE_TAG:-latest}`, `restart: unless-stopped`, `read_only: true`, `cap_drop: [ALL]`, `security_opt: [no-new-privileges:true]`, `tmpfs: [/tmp]`, `networks: [egress]` (không `web`, không `internal`, không `ports:`), `volumes: - ${OMNILAB_AUDIO_DIR:-/srv/data/omnilab-audio}:/data/audio`, `stop_grace_period: 20s`, `mem_limit: 256m`.
- `environment`: `GEMINI_API_KEY: ${GEMINI_API_KEY:-}` (cho phép rỗng để deploy hiện có không vỡ), `TTS_VOICE: ${TTS_VOICE:-}`, `TTS_MODEL: ${TTS_MODEL:-}`, `TTS_STYLE: ${TTS_STYLE:-}`, `TTS_MAX_CHUNK_CHARS: ${TTS_MAX_CHUNK_CHARS:-}`. Giá trị rỗng nghĩa là dùng mặc định trong code (`configFromEnv` coi chuỗi rỗng là chưa đặt).
- Mạng mới `egress: {}` (bridge thường, không `internal`), chỉ tts dùng.
- `app`: thêm `volumes: - ${OMNILAB_AUDIO_DIR:-/srv/data/omnilab-audio}/public:/srv/audio:ro` (không đặt dưới `/data` vì `/data` là tmpfs). App chỉ thấy `public/`, không thấy `work/`. `app` không `depends_on` tts.
- Bố cục host: thư mục audio và `public/` bên trong đều thuộc uid 1000, tạo trước khi `up` (checklist). Nếu `public/` chưa có, Docker tự tạo nó bằng root khi mount cho app: tts không ghi được và log hướng dẫn `chown`, ngủ chờ; site không bị ảnh hưởng.

### Caddyfile

- Đặt sau `handle /api/*`:

  ```
  @audioFile path_regexp ^/audio/(manifest\.json|[a-z0-9-]+\.[a-z0-9-]+\.[a-z0-9-]+\.[a-f0-9]{12}\.m4a)$
  handle @audioFile {
  	root * {$AUDIO_ROOT:/srv/audio}
  	uri strip_prefix /audio
  	file_server
  }
  handle /audio/* {
  	error 404
  }
  ```
  `{$AUDIO_ROOT}` mặc định đúng đường dẫn mount trong image, chỉ để thử Caddy trên máy dev. Regex vẫn là lớp chặn chính, dù app không còn thấy `work/`.

<!-- Updated: Validation Session 1 - luôn đặt Content-Type audio/mp4 cho .m4a (red-team m4) -->
- `@audioMedia path_regexp ^/audio/.+\.m4a$` → `header @audioMedia Content-Type "audio/mp4"` (luôn đặt, không phụ thuộc bảng MIME của Caddy hay hệ điều hành, vì Safari cần đúng kiểu để phát) và `Cache-Control "public, max-age=31536000, immutable"` (tên file chứa khoá nên bất biến). `@notHashed` đổi thành matcher khối `not path /_astro/* /api/*` AND `not path_regexp ^/audio/.+\.m4a$`, nhờ vậy `manifest.json` vẫn `no-cache`.
- `handle_errors`: thêm nhánh `@audio path /audio/*` → `respond 404` (đặt trước nhánh `/{err.status_code}.html`, vì `root` đã đổi trong `handle` nên không được tìm trang 404 HTML ở đó).
- CSP giữ nguyên; thêm một dòng comment rằng `<audio>` cùng origin rơi về `default-src 'self'`.
- `file_server` hỗ trợ Range (seek trên iOS cần 206). `encode` mặc định không nén `audio/*`, nên Range không bị ảnh hưởng (kiểm bằng curl).

### deploy.sh

<!-- Updated: Validation Session 1 - build tts tách riêng, lỗi chỉ cảnh báo (red-team m6) -->
- Comment đầu: 3 image; tts là tuỳ chọn, lỗi của nó không chặn site.
- Sau kiểm `.env`: nếu `GEMINI_API_KEY` rỗng thì in thông báo (không dừng): tts sẽ chạy nhưng chỉ ngủ, chưa tạo bản nghe.
- Build theo hai bước:
  1. `docker compose build app sync` (lỗi → dừng như hiện nay).
  2. `docker compose build tts`; lỗi → in `WARN: tts build failed, keeping previous tts container` và đặt `TTS_BUILT=0`, không dừng script. Thành công → `TTS_BUILT=1`.
- `docker compose up -d --no-build app sync`; nếu `TTS_BUILT=1` thì thêm `docker compose up -d --no-build tts`. Khi `TTS_BUILT=0`, container tts đang chạy (nếu có) được giữ nguyên.
- Cổng sức khoẻ giữ nguyên (`/` và `/api/health` qua `app`), không kiểm tts.
- Thành công: tag `app`, `sync` như cũ; tag `omnilab-tts:$TAG` thành `latest` và dọn image `omnilab-tts` cũ chỉ khi `TTS_BUILT=1`. Khi `TTS_BUILT=0` không dọn image tts nào (container cũ còn dùng).
- Rollback: log thêm `tts`. Chỉ đụng tts khi `TTS_BUILT=1`: nếu có `omnilab-tts:$PREV` thì `up -d --no-build --no-deps tts` với PREV, không có (lần deploy tts đầu) thì `docker compose stop tts`. Giữ `set +e` trong đoạn rollback.

### .dockerignore

- Thêm `.tts-samples` để mẫu giọng trên máy dev không lọt vào build context.

## Related code files

| Thao tác | File |
|---|---|
| Modify | `Dockerfile` |
| Modify | `compose.yml` |
| Modify | `Caddyfile` |
| Modify | `deploy/deploy.sh` |
| Modify | `.dockerignore` |

## Implementation steps

1. Mốc so sánh: chạy Caddy bản hiện tại (binary tải về thư mục tạm, như plan trước) với `dist/` mới build, lưu `curl -sI` của `/`, một trang bài, một file `/_astro/*`, `/tts-scripts.json`, `/api/health`.
2. Sửa `Caddyfile`. Chạy Caddy với `AUDIO_ROOT=<thư mục tạm có manifest.json và một file .m4a đặt tên đúng pattern>`:
   - `curl -sI /audio/manifest.json` → 200, `Cache-Control: no-cache`, `Content-Type` JSON.
   - `curl -sI /audio/<file>.m4a` → 200, `immutable`, `Content-Type: audio/mp4` (đúng một header, không trùng), có `Accept-Ranges: bytes`, không có `Content-Encoding`.
   - `curl -s -o /dev/null -w "%{http_code}" -H "Range: bytes=0-99" /audio/<file>.m4a` → 206, `Content-Type: audio/mp4`.
   - `/audio/work/state.json`, `/audio/../Caddyfile`, `/audio/x.m4a` (sai pattern) → 404.
   - Không đặt `AUDIO_ROOT` tới thư mục có thật (giống Railpack) → `/audio/manifest.json` 404, không phải HTML 200.
   - Header của các URL ở bước 1 giống hệt mốc.
3. Sửa `Dockerfile`, `compose.yml`, `.dockerignore`, `deploy/deploy.sh`. `bash -n deploy/deploy.sh`. Đọc lại luồng `TTS_BUILT` theo bốn trường hợp: tts build ok + cổng ok; tts build lỗi + cổng ok; tts build ok + cổng lỗi; tts build lỗi + cổng lỗi. Ghi kết quả mong đợi của từng trường hợp vào báo cáo phase.
4. Nếu máy có Docker: `docker compose config` (tts chỉ có mạng `egress`, không `ports`; app chỉ mount `.../public` với `:ro`); `docker build --target tts --build-arg SITE_URL=http://localhost:8080 -t omnilab-tts:test .`; `docker build .` (không target) ra image Caddy; `docker run --rm omnilab-tts:test ffmpeg -version`; `docker run --rm omnilab-tts:test node -e "console.log(Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles'}).resolvedOptions().timeZone)"`. Máy dev hiện không có Docker: ghi "chưa kiểm tra" và đưa vào checklist VPS.
5. Viết checklist VPS cho người dùng (người dùng tự deploy) vào báo cáo phase:
   - `df -h /srv` còn trống ≥ 1 GB.
   - `sudo install -d -o 1000 -g 1000 -m 755 /srv/data/omnilab-audio /srv/data/omnilab-audio/public`
   - Thêm `GEMINI_API_KEY=…` và `TTS_VOICE=<giọng đã chọn>` vào `/srv/apps/omnilab/.env` (đặt `OMNILAB_AUDIO_DIR` chỉ khi muốn đường dẫn khác); `bash deploy/deploy.sh`.
   - `docker compose logs -f tts`: thấy `start` với `hasKey: true`, rồi `chunk_ok`; sau bài đầu có `lesson_ready`.
   - `docker network inspect web` không có container tts; `docker compose exec tts node -e "fetch('https://generativelanguage.googleapis.com').then(r=>console.log(r.status))"` in ra một mã HTTP bất kỳ (nghĩa là ra Internet được); `docker stats` lúc nén < 80% `mem_limit`.
   - `docker compose exec app ls /srv/audio` chỉ thấy `manifest.json` và file `.m4a`, không có `work`.
   - `curl -sI https://<domain>/audio/manifest.json` (200, `no-cache`), file `.m4a` (`Content-Type: audio/mp4`, immutable, 206 với Range), `/audio/work/state.json` (404).
   - `docker compose restart tts` giữa lúc đang tạo bài: log cho thấy chạy tiếp từ đoạn dở.
   - Thử rollback lần đầu (giả lập cổng lỗi): app về PREV, tts dừng, site vẫn 200.
   - Thử build tts lỗi (ví dụ tạm đổi tag ảnh base sai trên nhánh thử): deploy vẫn đưa app và sync lên, in `WARN`, container tts cũ vẫn chạy.
   - iPhone thật, Safari: mở bài đã có bản nghe, bấm Nghe → phát ngay; bấm một mục `##` khi chưa phát → phát từ đúng đầu mục; bấm một mốc `###` → phát gần mốc; đổi tốc độ 1,5× rồi bấm mục khác → tốc độ vẫn 1,5×; khoá màn hình → điều khiển trên màn hình khoá hoạt động; tải lại trang → nút "Nghe tiếp" đưa về đúng vị trí.

## Todo

- [x] Mốc header trước khi sửa (Caddy 2.10.2 thật, Caddyfile của HEAD)
- [x] Caddyfile + kiểm bằng Caddy thật (gồm `Content-Type: audio/mp4`)
- [x] Dockerfile stage `tts` (chưa chạy `docker build`: máy dev không có Docker; bộ COPY đã kiểm bằng cách chạy worker từ đúng các file đó)
- [x] compose service `tts`, mạng `egress`, thư mục host riêng, app mount `public` `:ro`
- [x] deploy.sh build tts riêng, cảnh báo khi lỗi, tag/dọn/rollback theo `TTS_BUILT`
- [x] `.dockerignore`
- [ ] Kiểm Docker (hoặc ghi chưa kiểm tra) + checklist VPS + kiểm iPhone (đã ghi "chưa kiểm tra" và checklist trong `reports/dev-phase-04-261028-1423.md`; chờ người dùng chạy trên VPS và iPhone)

## Success criteria

- Header các URL cũ giống hệt mốc; các kiểm `curl` ở bước 2 đúng như mô tả.
- `bash -n deploy/deploy.sh` không lỗi; `grep -n "omnilab-tts" deploy/deploy.sh` thấy ở tag, dọn image và rollback, mỗi chỗ đều nằm sau điều kiện `TTS_BUILT`; cổng sức khoẻ không nhắc tới tts; `docker compose build app sync` vẫn là bước dừng khi lỗi.
- `Dockerfile`: `grep -n "^FROM" Dockerfile` cho thứ tự `build`, `sync`, `tts`, `app`.
- `compose.yml`: tts không có `web`, `internal`, `ports`; `GEMINI_API_KEY` dạng `${GEMINI_API_KEY:-}`; `grep -n "OMNILAB_DATA_DIR" compose.yml` không xuất hiện ở service `tts` hay mount audio của `app`.
- Trên VPS (người dùng): checklist bước 5 đạt hết, gồm các kiểm trên iPhone thật.

## Risk assessment

| Rủi ro | Khả năng × Tác động | Giảm thiểu |
|---|---|---|
| Thư mục audio hoặc `public/` do Docker tạo bằng root, tts không ghi được | Trung bình × Thấp | `install -d -o 1000` tạo cả hai thư mục trong guide; worker log hướng dẫn và ngủ, site không ảnh hưởng. |
| Build tts lỗi (apk, mạng) làm hỏng deploy site | Trung bình × Cao | Build tts tách riêng, lỗi chỉ cảnh báo; app và sync vẫn lên; tts cũ giữ nguyên, image tts không bị dọn. |
| `handle_errors` tìm trang 404 trong root audio | Trung bình × Thấp | Nhánh `@audio` riêng trả 404 trống; kiểm ở bước 2. |
| `.m4a` trả sai Content-Type, Safari không phát | Thấp × Trung bình | Luôn đặt `Content-Type: audio/mp4`; kiểm cả 200 và 206. |
| Build chậm vì `app` và `tts` cùng kéo stage `build` | Thấp × Thấp | BuildKit dùng chung cache cho cùng stage và cùng arg; đo thời gian deploy. |
| VPS chặn kết nối ra ngoài | Thấp × Trung bình | Kiểm bằng `fetch` trong checklist; worker chỉ log `retryable`, site không ảnh hưởng. |
| Hết đĩa VPS | Thấp × Trung bình | Kiểm `df -h` trước deploy; worker giới hạn 2 thư mục work (phase 3). |
| Deploy giết một request đang chạy | Trung bình × Thấp | `stop_grace_period: 20s`; worker huỷ fetch, không để file dở; chấp nhận mất tối đa một request quota mỗi lần deploy tts. |
| Rollback để lại tts mới với app cũ | Thấp × Thấp | Rollback đưa tts về PREV hoặc dừng; app cũ không có route `/audio` nên không có player, dữ liệu audio không hỏng. |

## Security

- `GEMINI_API_KEY` chỉ ở `environment` của tts; không là build arg, không vào image, không vào app hay sync. Kiểm `docker inspect omnilab-tts:<tag>` (Config.Env) không có key; `docker compose config` chỉ in trên VPS (có key) nên không dán log đó ra ngoài.
- tts: rootfs chỉ đọc, không quyền Linux, không cổng, không ở mạng `web`/`internal` nên không chạm được app hay sync; chỉ ghi thư mục audio riêng. Không mount DB hay thư mục dữ liệu sync.
- app chỉ thấy `public/` của audio ở chế độ chỉ đọc; Caddy chỉ phục vụ tên file khớp regex.
- CSP không nới.

## Rollback

`deploy.sh` tự rollback khi cổng lỗi. Gỡ hẳn tính năng: bỏ service `tts`, mount audio ở app, khối `/audio` trong Caddyfile, stage `tts`; deploy lại. Thư mục `/srv/data/omnilab-audio` có thể xoá; không có dữ liệu người dùng trong đó (nhưng tạo lại tốn lại toàn bộ quota).
