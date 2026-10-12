# Phase 06 docs report (đồng bộ tiến độ qua tài khoản)

Worktree: D:/project/OmniLab-progress-sync (feat/progress-sync). Chỉ sửa README.md và docs/. Không commit. Không đụng src/, tests/, server/, deploy/. Không chạy pnpm build.

## Files đã sửa
- README.md: tính năng tài khoản + đồng bộ; `pnpm check:server`, `pnpm sync:dev`; ghi chú `pnpm dev`/`preview` không proxy `/api`; Deploy = VPS (chính), Railpack = phương án cũ; bảng docs.
- docs/system-architecture.md: intro, sơ đồ (VPS, `/api` → sync), client state v2, mục mới "Máy chủ đồng bộ" (triển khai, schema v2, luật gộp, client sync, API, ErrorCode 12 mã, xác thực/phiên, threat model, sao lưu), CSP giữ nguyên, bỏ "không server/không auth/cookies".
- docs/deployment-vps-guide.html: giữ style cũ. Ch0 (DB ở `/srv/data/omnilab`, sơ đồ hai service); ch1 (Dockerfile 3 stage, compose 2 service, deploy.sh, backup script); ch2 (`SESSION_SECRET` base64 48, `chmod 600`, `grep -c` kiểm, mkdir/chown 1000/chmod 700, làm lại từ đầu giữ khoá); ch3 (log sync, header baseline); ch4 (kiểm mạng/cổng/cấu hình sync, curl `/api/health` và `/api/me`, thử sập sidecar, checklist trình duyệt); ch5 (bảng chuyển, nhắc đăng nhập trước khi đổi DNS); ch6 (backup, cron, rclone, kiểm backup, restore drill, reset mật khẩu bằng `node -e`, bảng script/lệnh); ch7 (thêm 11 sự cố); câu hỏi mở (đóng mục xuất/nhập).
- docs/codebase-summary.md: cây `server/sync/`, `deploy/`, Dockerfile/compose/Caddy; lib `progress-sync*`, `progress-merge`, panel tài khoản; key localStorage; bỏ số test cứng (cũ 436).
- docs/project-overview-pdr.md: cập nhật 2026-10-12; yêu cầu mục 6; NFR đồng bộ/bảo mật; tiêu chí (chưa tick); quyết định mới; deploy VPS chính; open question.
- docs/project-roadmap.md: mục "Tài khoản và đồng bộ" (trạng thái, việc còn mở); xuất/nhập JSON hạ ưu tiên.
- docs/deployment-guide.md (Railpack): banner phương án cũ; `/api` 503 JSON; smoke test 8; Tab bar 5 tab; không SESSION_SECRET.
- docs/code-standards.md: `pnpm check:server`; quy ước server (type stripping, erasable, `.ts`, module thuần).

## Claim đã kiểm trong code
- Compose: sync chỉ `internal`, không `ports:`, read_only, cap_drop ALL, no-new-privileges, 192m; app 128m, `web` alias `omnilab`, depends_on sync `service_started`; volume `${OMNILAB_DATA_DIR:-/srv/data/omnilab}` → `/data`; `SESSION_SECRET` bắt buộc.
- Dockerfile: stage build → sync → app (app cuối); sync copy đúng `server/sync` + 3 module `src/lib`.
- Caddyfile: `/api/*` → `omnilab-sync:3000`, dial 2s; handle_errors 503 `{"code":"unavailable"}` no-store; CSP string khớp bản cũ (không đổi).
- deploy.sh: gate `/` + `/api/health`; rollback; message "deploy FAILED … chưa có bản cũ" (không hoàn tác khi không có PREV); "đã cập nhật, chạy lại" (re-exec).
- Server (`sync-server-entry.ts`, `sync-http-helpers.ts`, `sync-auth.ts`, `sync-sqlite-store.ts`, `sync-backup.ts`): route list, status codes, 415 cho POST/PUT (kể cả logout), 404 `bad_request`, `X-Sync-User` bắt buộc cho `/api/progress`, 12 ErrorCode, 64 KB, scrypt N16384 r8 p1, limiter 2/8, throttle 3 miễn phí rồi 1..60 s, register cap 30/h, cookie `omnilab_session` HttpOnly/SameSite=Lax/Path=/api/Secure/180 ngày, `session_version`, log JSON, backup `VACUUM INTO` qua `.tmp`, giữ 14 ngày, `/data`.
- Client: key `omnilab:v1:state` giữ nguyên (payload v2), key phụ `omnilab:v2:lastSyncedHash`, `omnilab:v2:syncUser`; `isUnknownFutureVersion` → `skipPersist` (cơ sở cho "không rollback client qua v2"); debounce 3 s / maxWait 30 s; pull gap 5 s; `needs-merge-decision`; `isWriteBlocked`, `applyRemote`, `setOwner`, `clear`.
- Merge: thứ tự done/visit/bookmark đúng `progress-merge.ts`; `__proto__`/`constructor`/`prototype` bị loại; server clamp mốc tương lai.
- Chuỗi UI quoted trong docs có trong `src/lib/account-sync-panel-view.ts` và `account-sync-panel.astro`.
- Test lệnh bằng node 24.15 thật (scratch DB, ngoài repo):
  - Lệnh reset (dạng `node --input-type=module -e`, đúng nội dung trong guide, đường dẫn DB thay bằng file thử): in `reset ok`, `session_version` 1→3, mật khẩu mới verify = true; tên không tồn tại in `không có tài khoản này`.
  - `runBackup` tạo file; lệnh kiểm `PRAGMA integrity_check` + đếm users với `{readOnly:true}` trả `ok 1 tài khoản`.
- Build dist hiện có: 72 `index.html` + `404.html` = 73 trang (dùng cho "khoảng 73 trang", không build lại).
- Link md nội bộ: kiểm bằng script, không có link hỏng. Anchor `#máy-chủ-đồng-bộ-sync-sidecar`, `#mô-hình-đe-doạ` theo slug GitHub.
- Không còn câu sai "không có DB / không cần backup" (grep).

## Chưa kiểm được (không có Docker/VPS ở máy này)
- Toàn bộ lệnh docker/compose/cron/rclone/restore/rollback trong guide: viết theo code, chưa chạy. `docker compose exec -T -e U=… -e P=…` và `docker compose config | grep -c published` (kỳ vọng 0) chưa chạy thật.
- Restore `sh -c "mv …omnilab.db*…"` chưa chạy trên Linux thật.
- Success criterion "làm theo guide từ đầu trên máy sạch": chưa đạt, cần chạy trên VPS.

## Deviation / ghi chú
- repomix không cài sẵn và không chạy, nên codebase-summary cập nhật bằng ls/grep/đọc code. Không tạo file phụ trong repo.
- `.claude/scripts/validate-docs.cjs` không có trong worktree, nên không chạy được validator. Thay bằng kiểm link tay và kiểm cân bằng thẻ HTML.
- Tần suất backup: plan acceptance ghi "2 lần/ngày", code + checklist ghi cron 1 lần/ngày 03:15. Docs theo code (1 lần/ngày), ghi chú để chủ dự án xác nhận.
- Panel tài khoản: docs ghi ở `/toi` mục `#tai-khoan` theo chỉ đạo. `src/pages/toi.astro` có mục `#tai-khoan` placeholder, việc mount panel do agent UI đang làm, chưa kiểm được trong worktree này.
- Số test trong codebase-summary và code-standards: bỏ số cứng thay vì ghi số mới (số thay đổi theo thời điểm, và agent khác đang sửa src).

## Concerns cho chủ dự án (ngoài phạm vi docs)
1. `deploy/backup-sync-db.sh` (header) ghi cron `cd /home/deploy/omnilab`, không khớp đường dẫn `/srv/apps/omnilab` trong guide. Cần sửa comment trong deploy/ (ngoài quyền phase này). Guide dùng `/srv/apps/omnilab`.
2. `/srv/data/omnilab` mode 700 (chủ uid 1000) làm user `deploy` không đọc được `backups/`. Rclone và mọi lệnh đụng file phải `sudo`. Nếu muốn `deploy` đọc được: đổi 750 + group, hoặc chạy rclone bằng root (guide đang chọn cách này). Cần chủ dự án quyết định; phase-05 checklist có `chmod 700`.
3. Plan ghi backup 2 lần/ngày; code và cron 1 lần/ngày.
4. `docs/design-guidelines.md` dòng 268 còn liệt kê tab cũ (home, domains, search, saved, about), không thuộc phase này, không sửa.
5. `pnpm dev` không proxy `/api`: đã ghi trong README. Nếu cần dev đăng nhập thật, phải thêm proxy vào astro config (code, ngoài phạm vi).

Status: DONE_WITH_CONCERNS
Summary: Docs cập nhật theo code thật: README, system-architecture (mục máy chủ đồng bộ mới), deployment-vps-guide (ch0–7 + sao lưu/restore/reset), codebase-summary, PDR, roadmap, deployment-guide (phương án cũ), code-standards. Lệnh reset và kiểm backup đã chạy thử bằng node 24 trên DB thử; phần docker/cron/VPS chưa chạy được.
Concerns/Blockers: comment cron sai trong deploy/backup-sync-db.sh (ngoài quyền); mode 700 buộc rclone phải sudo; backup 1 lần/ngày vs plan 2 lần/ngày; checklist VPS chưa chạy.

## Unresolved questions
- Backup 1 hay 2 lần/ngày?
- Mode 700 hay 750 cho `/srv/data/omnilab`?
- Remote rclone nào cho backup ngoài VPS?
- Tên miền lâu dài (Nhân Hòa hay DuckDNS)?
