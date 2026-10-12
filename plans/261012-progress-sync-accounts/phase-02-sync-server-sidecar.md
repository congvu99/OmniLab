---
phase: 2
title: "Sync server sidecar"
status: done
priority: P1
effort: "1.5d"
dependencies: [1]
---

# Phase 2: Sync server sidecar

## Overview
Service Node 24 thuần (`node:http`, `node:sqlite`, `node:crypto`), 0 dependency, 3 module. Phục vụ auth và lưu/merge tiến độ trong một file SQLite.

## Requirements
- Functional: register (tên, mk, nhập lại), login, logout, logout-all, me, get/put progress, health.
- Non-functional:
  - Body ≤ 64 KB; state sau merge ≤ 64 KB, vượt → 413 (RT#13).
  - Fail-fast khi `/data` không ghi được hoặc `SESSION_SECRET` < 32 ký tự.
  - Log JSON một dòng/request, không log body/mật khẩu/cookie.
  - Mọi response `/api/*`: `Content-Type: application/json`, `Cache-Control: no-store`, `Vary: Cookie` (RT#11).

## Architecture
```
server/sync/                      (RT#15: gom còn 3 file, mỗi file < 200 dòng)
  sync-server-entry.ts            // env, mở DB, router, JSON body + giới hạn, mã lỗi, SIGTERM, mkdir /data/backups
  sync-sqlite-store.ts            // schema, users/progress, transaction get→merge→put, backupTo(path)
  sync-auth.ts                    // scrypt + semaphore, cookie HMAC + session_version, login throttle
```
- DB ở `/data/omnilab.db`: `PRAGMA journal_mode=WAL; busy_timeout=3000`.
  - `users(username TEXT PK, pass_hash TEXT, session_version INT DEFAULT 1, created_at INT)`
  - `progress(username TEXT PK REFERENCES users, state_json TEXT, updated_at INT)`
- PUT: trong transaction: đọc → `migrate` → kẹp mọi ts `> now` về `now` → `mergeStates(stored, incoming)` → kiểm kích thước → ghi → trả state đã merge (không có `owner`).
- Mật khẩu (RT#6):
  - `scrypt(N=16384,r=8,p=1)` + salt 16B; `timingSafeEqual`.
  - **Semaphore tối đa 2 phép hash đồng thời**; hàng đợi > 8 → 503 `{code:'busy'}` + `Retry-After: 2`.
  - User không tồn tại vẫn chạy scrypt với hash giả (chống dò bằng thời gian) (RT#5).
- Session (RT#7):
  - Cookie `omnilab_session=<b64url({u,sv,exp})>.<hmac>`; `HttpOnly; SameSite=Lax; Path=/api; Max-Age=15552000`; `Secure` trừ khi `COOKIE_SECURE=0` (chỉ dev) (RT#12).
  - Mỗi request đã xác thực kiểm `sv == users.session_version`.
  - `logout-all` và reset mật khẩu tăng `session_version`.
- Throttle (RT#5):
  - Login: theo **username** (không theo IP, không đọc XFF), trễ tăng dần sau mỗi lần sai: 0, 0, 0, 1 s, 2 s, 4 s … tối đa 60 s; reset khi đúng.
    - Trả 429 + `Retry-After`, không khoá cứng.
    - In-memory, mất khi restart là chấp nhận được.
  - Register: tối đa 30 tài khoản mới/giờ toàn hệ thống.
  - 409 cho tên trùng là cố ý (dò được tên tồn tại, chấp nhận cho app cá nhân, ghi vào docs).
- CSRF: `SameSite=Lax` + chỉ nhận `Content-Type: application/json` cho POST/PUT (415 nếu khác). **Không** kiểm Origin, sidecar không cần `SITE_URL` (RT#12).
- Import `../../src/lib/progress-merge.ts` và `progress-state.ts` trực tiếp (type stripping).

### Contract
Lỗi luôn là `{ code: ErrorCode }`. `ErrorCode = 'invalid_username' | 'invalid_password' | 'password_mismatch' | 'username_taken' | 'bad_credentials' | 'rate_limited' | 'busy' | 'unauthorized' | 'too_large' | 'unsupported_media' | 'unavailable'` (RT#15).

| Route | Thành công | Lỗi |
|---|---|---|
| POST /api/auth/register `{username,password,confirm}` | 201 `{username}` + cookie | 400 invalid_*/password_mismatch, 409 username_taken, 429, 503 busy |
| POST /api/auth/login `{username,password}` | 200 `{username}` + cookie | 401 bad_credentials, 429 rate_limited |
| POST /api/auth/logout | 204 + xoá cookie | — |
| POST /api/auth/logout-all | 204 + tăng session_version | 401 |
| GET /api/me | 200 `{username}` | 401 unauthorized |
| GET /api/progress | 200 state v2 (empty nếu chưa có) | 401 |
| PUT /api/progress (state v2) | 200 state merged | 400, 401, 413 too_large, 415 |
| GET /api/health | 200 `{ok:true}` (SELECT 1) | 503 |

- Username: lowercase, `^[a-z0-9_.-]{3,32}$`.
- Mật khẩu: 8–128 ký tự.

## Related Code Files
- Create: `server/sync/sync-server-entry.ts`, `server/sync/sync-sqlite-store.ts`, `server/sync/sync-auth.ts`
- Create: `tests/sync-auth.test.mjs`, `tests/sync-http-api.test.mjs` (server thật, cổng ngẫu nhiên, DB file tạm)
- Modify: `package.json` (`sync:dev`), `.gitignore` (`.data/`, `data/`)
- (tsconfig đã include `**/*`, không cần sửa; nếu `astro check` báo thiếu type `node:sqlite` thì thêm `@types/node` vào devDependencies)

## Implementation Steps (TDD)
1. **Đỏ** `sync-auth`:
   - hash đúng/sai;
   - cookie ký/hết hạn/sửa byte/`sv` cũ bị từ chối;
   - throttle tăng dần + reset;
   - semaphore: 10 hash song song → tối đa 2 chạy cùng lúc, phần vượt hàng đợi → busy.
2. **Đỏ** API e2e:
   - register → put → get; trùng tên 409; confirm sai 400;
   - body 70 KB → 413; 2 PUT 40 KB id khác nhau → lần 2 bị 413 (giới hạn sau merge);
   - id `__proto__` bị loại; không cookie → 401; Content-Type text → 415;
   - logout-all làm cookie cũ 401;
   - 2 "thiết bị" PUT xen kẽ → hợp nhất;
   - response có `no-store`.
3. **Xanh**: cài đặt 3 module.
4. `pnpm sync:dev` = `DATA_DIR=./.data COOKIE_SECURE=0 node server/sync/sync-server-entry.ts`.

## Success Criteria
- [ ] Test xanh; curl local qua toàn bộ route.
- [ ] Không log mật khẩu/cookie (grep log test).
- [ ] Thiếu `SESSION_SECRET` → exit ≠ 0, thông báo rõ.
- [ ] 10 register song song: RSS < 160 MB (đo bằng `process.memoryUsage` trong test tải nhỏ).

## Risk Assessment
- `node:sqlite` có ExperimentalWarning ở một số bản Node 24 → pin `node:24.x-alpine` cụ thể ở phase 5.
- Throttle theo username vẫn cho phép làm chậm đăng nhập của người khác tối đa 60 s/lần; chấp nhận thay cho khoá cứng.
- Reset mật khẩu khi người dùng quên: lệnh `node -e` trong guide VPS (phase 6), không làm CLI riêng (RT#15).
