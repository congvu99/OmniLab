# Kiến trúc hệ thống — OmniLab v1

OmniLab là app học tập tĩnh (Astro 7). Trang và nội dung là file tĩnh; tiến độ và bookmark lưu trong localStorage và là nguồn chính. Tài khoản tùy chọn: đăng nhập thì tiến độ được đồng bộ qua một máy chủ đồng bộ nhỏ (sidecar, Node + SQLite) trên VPS. Học vẫn chạy khi không đăng nhập hoặc sidecar sập. Giao diện Studio: dark-first, Volt signature color, motion 120–200ms, custom icon sprite, command palette ⌘K/Ctrl+K.

## Kiến trúc tổng quan

```
┌───────────────────────────────────────────────────────────┐
│ Trình duyệt người dùng (iOS Safari, Chrome, Firefox)      │
├───────────────────────────────────────────────────────────┤
│ • Trang HTML tĩnh (Astro build) + island tương tác       │
│ • Giao diện: Studio dark-first (graphite), Volt, hairline│
│ • Layout:                                                  │
│   - Mobile <1024px: Dock 5 tab (reader: tự ẩn khi cuộn)  │
│   - Desktop ≥1024px: Sidebar 256px left (nav + domains)  │
│   - Wide ≥1280px: + reader aside 300px sticky scrollable │
│ • Command palette: ⌘K (macOS) / Ctrl+K (Windows/Linux)   │
│ • Storage: localStorage (omnilab:v1:state, v2) + in-memory│
│ • Tài khoản: tab Tôi → Tài khoản; đồng bộ khi đăng nhập  │
│ • Tìm kiếm: MiniSearch + diacritic folding, lazy-load    │
│ • Motion: 120–200ms, depth push page transition, stagger  │
│ • Icons: 32-icon custom sprite (no Lucide)               │
│ • Fonts: Be Vietnam Pro (UI) + JetBrains Mono (data)     │
│ • Tap targets: ≥44px; contrast ≥4.5:1                    │
└───────────────────────────────────────────────────────────┘
         ↓ HTTPS (Caddy chung trên VPS) ↓
┌───────────────────────────────────────────────────────────┐
│ Docker Compose trên VPS: app (Caddy + dist/) + sync + tts │
├───────────────────────────────────────────────────────────┤
│ • dist/ (output Astro build), Caddyfile của repo          │
│ • Cache: /_astro/* immutable, còn lại no-cache            │
│ • CSP: script-src 'self', style-src 'unsafe-inline'       │
│ • /api/* → sync (mạng internal); sync lỗi → 503 JSON      │
│ • /audio/* → thư mục bản nghe (chỉ đọc) do tts ghi        │
│ • Không SPA fallback (404 thật)                           │
└───────────────────────────────────────────────────────────┘
(Railpack / Vibe Deploy, phương án cũ: chỉ site tĩnh, /api luôn 503)
         ↓ Git push ↓
┌───────────────────────────────────────────────────────────┐
│ Repo GitHub/GitLab (user quản lý)                         │
├───────────────────────────────────────────────────────────┤
│ • Mã nguồn (src/), nội dung (src/content/lessons/)        │
│ • Docs (./docs/), config build (astro.config.mjs)         │
└───────────────────────────────────────────────────────────┘
```

## Quy trình nội dung

**Tạo bài**: Markdown + MDX (JSX components), đặt trong `src/content/lessons/{domain}/{module}/` với metadata frontmatter (domain, module, order, title, summary, examplesReviewed).

**Build-time** (`pnpm build`):
1. `verify:fidelity` — Đảm bảo nội dung gốc (trước `<RealLife>` đầu tiên) không thay đổi
2. Astro MDX plugin — Parse JSX components (`<RealLife>`, `<Figure added>`, `<Disclaimer>`)
3. remark plugin — Tính `readingMinutes` (tự động)
4. Shiki — Syntax highlight (light inline, dark via CSS vars)
5. Render → HTML tĩnh

**Output** (`dist/`):
- 73 trang HTML (64 bài học + trang chung + 404), mỗi bài → `/hoc/{domain}/{module}/{slug}/index.html`
- `search-index.json` (~84KB gzip, MiniSearch)
- `lessons-index.json` (2.2KB gzip, metadata API)
- Tất cả script ngoài file (`/_astro/*.js`, không inline)

## Mô hình dữ liệu nội dung

**Domain** (YAML): `kien-truc` (27 bài), `tai-chinh` (23 bài), `nghe-tai-chinh` (14 bài, tự biên soạn, fidelity so 1:1 với `content-sources/nghe-tai-chinh/`). Mỗi domain có modules + metadata màu accent.

**Lesson ID** (bất biến): `{domain}/{module}/{slug}` — khóa trong tiến độ, bookmark và khi gộp đồng bộ. Regex `LESSON_ID_PATTERN` (`progress-state.ts`), `content.config.ts` ràng buộc cùng quy tắc.

**Nội dung RealLife** (≤90 từ): Ví dụ Việt Nam (quán phở, ngân hàng, v.v.), kết thúc bằng "→..." (liên kết ẩn dụ).

**Verify-fidelity**: Loại bỏ `<RealLife>`, `<Figure added>`, `<Disclaimer>` → so sánh snapshot có giữ nguyên nội dung gốc.

## Client state

**localStorage** (`omnilab:v1:state`, JSON, payload `v: 2`). Key giữ nguyên từ v1; payload v1 được migrate khi đọc. Chi tiết schema và luật gộp: [Máy chủ đồng bộ](#máy-chủ-đồng-bộ-sync-sidecar).
```json
{
  "v": 2,
  "lessons": { "domain/module/slug": { "done": true, "doneAt": 1, "doneUpdatedAt": 1, "scroll": 0.4, "visitedAt": 1 } },
  "bookmarkMeta": { "domain/module/slug": { "on": true, "at": 1 } },
  "owner": "ten-tai-khoan"
}
```
`bookmarks` không lưu: là danh sách dẫn xuất từ `bookmarkMeta` (`owner` chỉ có khi đã đăng nhập ít nhất một lần).

**Prefs hiển thị** (`omnilab:prefs`, JSON, tách khỏi state tiến độ): `{ "v": 1, "theme": "system|light|dark", "textSize": "s|m|l", "motion": "system|reduce" }`. `src/lib/user-prefs.ts` parse an toàn (JSON hỏng/giá trị lạ → mặc định từng trường), ghi, `subscribePrefs` (storage event đa tab). `public/prefs-init.js` (plain script, `<script is:inline src>` đầu `<head>` trong `base-head.astro`, trước CSS) đọc cùng key, đặt `<html data-theme data-text-size data-motion>` + `theme-color`; theo dõi `matchMedia` (theme=system), storage event, event `omnilab:prefs-changed` (ghi cục bộ từ trang /toi) và `astro:after-swap` (ClientRouter thay thuộc tính `<html>`).

**Vị trí nghe bài** (`omnilab:v1:audio`, JSON, tách khỏi state tiến độ): `{ v, rate, byLesson: { [id]: { t, key, at } } }` gồm tốc độ phát chung và vị trí nghe dở từng bài (giữ 50 bài mới nhất). Chỉ nằm trên máy, **không** đồng bộ qua tài khoản và không đi vào `mergeStates`. Đọc/ghi: `src/lib/audio-position-store.ts`.

**Fallback**: Nếu localStorage throw (Safari private mode) → lưu in-memory (không persist). Hiển thị cảnh báo.

**Store** (`progress-store.ts`): Factory injectable (testable), singleton được gọi bởi mọi island. Phương thức: `markDone()`, `visit()`, `saveScroll()`, `toggleBookmark()`, `lastUnfinished()`, `subscribe()`, `isPersistent`, `isWriteBlocked`. Đồng bộ dùng thêm `applyRemote()` (gộp, không thay thế), `setOwner()`, `clear()`.

## Máy chủ đồng bộ (sync sidecar)

Tiến độ và bookmark vẫn lưu trên máy trước. Khi đăng nhập, client gộp tiến độ máy với tiến độ trên server. Chưa đăng nhập: app chạy như trước, chỉ gọi `GET /api/me` một lần mỗi lần tải trang.

Code: `server/sync/` (server, 5 file), `src/lib/progress-sync*.ts` (client), `src/lib/progress-merge.ts` (luật gộp, dùng chung cho cả hai phía).

### Triển khai

```
Trình duyệt ──HTTPS──► Caddy chung (VPS)
                           │ mạng web
                           ▼
                       omnilab:8080      app: Caddy + dist/ (read-only)
                           │ /api/* → omnilab-sync:3000     mạng internal
                           ▼
                       omnilab-sync      Node 24, node:http + node:sqlite
                           │ bind mount ${OMNILAB_DATA_DIR:-/srv/data/omnilab} → /data
                           ▼
                       /data/omnilab.db (WAL), /data/backups/omnilab-YYYY-MM-DD.db
```

| Thành phần | Cấu hình (theo `compose.yml`, `Dockerfile`, `Caddyfile`) |
|---|---|
| `sync` | Chỉ mạng `internal` (`internal: true`, không egress), không `ports:`; `read_only`, `cap_drop: [ALL]`, `no-new-privileges`; user `node` (uid 1000); `mem_limit` 192 MB; healthcheck `GET /api/health` |
| `app` | Mạng `web` (alias `omnilab`) + `internal`; `mem_limit` 128 MB; chỉ chờ sync `service_started`, không chờ healthy |
| Caddy | `/api/*` proxy tới `omnilab-sync:3000`, dial timeout 2 s. Sidecar không tới được → 503 `{"code":"unavailable"}`, `Cache-Control: no-store`, `application/json` |
| Header trang tĩnh | Không đổi (CSP, cache, `-Server`, `-Via`). Kiểm bằng so sánh header trước/sau deploy |
| Railpack / Vibe Deploy | Không có sidecar: mọi `/api/*` là 503, site vẫn chạy |

`Dockerfile` có bốn stage theo thứ tự `build` → `sync` → `tts` → `app`. `app` là stage cuối để `docker build .` không kèm `--target` (host kiểu Railpack) vẫn ra site tĩnh; compose luôn chỉ định `target` rõ ràng. Stage `sync` chỉ copy `server/sync/` và ba module thuần trong `src/lib/` (`progress-state.ts`, `progress-merge.ts`, `progress-sync-types.ts`), không cần `SITE_URL`. Stage `tts`: xem [Bản nghe bài học](#bản-nghe-bài-học-sidecar-tts).

### Schema trạng thái v2

Wire (API `GET`/`PUT /api/progress`): `{ v: 2, lessons, bookmarkMeta }`. localStorage lưu thêm `owner` (xem bảng dưới).

| Trường | Ý nghĩa |
|---|---|
| `lessons[id]` | `done`, `doneAt`, `doneUpdatedAt` (mốc của quyết định hoàn thành), `scroll` (0–1), `visitedAt` |
| `bookmarkMeta[id]` | `{on, at}`. `on: false` là tombstone: giữ lại để gộp đúng, bookmark đã bỏ không "sống lại" |
| `owner` | Chỉ trên máy, không gửi lên server: tài khoản gắn với dữ liệu local |
| `bookmarks` | Dẫn xuất từ `bookmarkMeta`, không lưu; code cũ đọc `state.bookmarks` vẫn đúng |

- Client gặp `v` lớn hơn 2 (bản mới hơn) chỉ đọc, không ghi đè (`isUnknownFutureVersion` → `skipPersist`). Vì vậy không rollback client về trước mốc v2.
- Key phụ: `omnilab:v2:lastSyncedHash` (hash đã đồng bộ), `omnilab:v2:syncUser` (báo đăng nhập/đăng xuất giữa các tab).

### Luật gộp (`mergeStates`)

Hàm thuần, giao hoán, kết hợp và luỹ đẳng: các máy trao đổi trạng thái theo thứ tự nào cũng hội tụ về cùng kết quả. Mỗi trường thắng theo thứ tự tuyệt đối:

| Trường | Bên thắng |
|---|---|
| Hoàn thành (`done`, `doneAt`) | `doneUpdatedAt` lớn hơn. Cùng mốc: `true` > `false` > chưa có; rồi tới `doneAt` |
| Lần xem (`visitedAt`, `scroll`) | `visitedAt` lớn hơn; `scroll` theo lần xem đó |
| Bookmark (`on`, `at`) | `at` lớn hơn. Cùng mốc: `on: true` thắng |

- Id `__proto__`, `constructor`, `prototype` bị loại.
- Server kéo mốc thời gian ở tương lai về thời điểm hiện tại (`sanitizeIncoming`). Không có GC tombstone.
- Gộp chỉ bổ sung: client gọi `applyRemote` (merge), không thay thế dữ liệu local.

### Đồng bộ phía client

- Đẩy: chỉ khi có thay đổi hoàn thành/bookmark (scroll và lần xem đi kèm). Debounce 3 s, chờ tối đa 30 s. Ẩn tab hoặc đóng trang: gửi `keepalive` nếu còn thay đổi.
- Kéo: khi tab hiển thị lại, cách lần kéo trước ít nhất 5 s.
- Body tối đa 64 KB. State gộp vượt 64 KB → `too_large`, dừng đẩy (kéo vẫn chạy).
- Trạng thái (`SyncStatus`): `checking`, `signed-out`, `unavailable`, `needs-merge-decision`, `syncing`, `synced`, `error`. Lỗi mạng hoặc 5xx → `unavailable`, không phải `signed-out`. 401 trên `/api/me` → `signed-out`, dữ liệu local giữ nguyên.
- Máy dùng chung: dữ liệu local có `owner` khác tài khoản vừa đăng nhập → `needs-merge-decision`. Người dùng chọn "Gộp vào tài khoản" hoặc "Dùng tiến độ của tài khoản". Không tự gộp.
- Đăng nhập/đăng xuất ở tab khác → tab này kiểm lại `/api/me`. Mọi request tiến độ gửi `X-Sync-User`, nên tab cũ không ghi nhầm sang tài khoản khác.

### API

Base `/api`. Response JSON, `Cache-Control: no-store`, `Vary: Cookie`. Lỗi có dạng `{"code": ErrorCode}`.

| Method | Đường dẫn | Xác thực | Thành công | Lỗi chính |
|---|---|---|---|---|
| GET | `/api/health` | Không | 200 `{"ok":true}` | — |
| POST | `/api/auth/register` | Không | 201 `{"username"}` + cookie | 400, 409 `username_taken`, 429 |
| POST | `/api/auth/login` | Không | 200 `{"username"}` + cookie | 400, 401 `bad_credentials`, 429 |
| POST | `/api/auth/logout` | Không | 204, xoá cookie | 415 |
| POST | `/api/auth/logout-all` | Cookie + `X-Sync-User` | 204, tăng `session_version` | 401 |
| GET | `/api/me` | Cookie | 200 `{"username"}` | 401 `unauthorized` |
| GET | `/api/progress` | Cookie + `X-Sync-User` | 200 state v2 | 401 |
| PUT | `/api/progress` | Cookie + `X-Sync-User` | 200 state đã gộp | 400, 401, 413, 503 `busy` |

- `POST` và `PUT` bắt buộc `Content-Type: application/json` (kể cả logout), thiếu thì 415.
- `X-Sync-User` phải trùng tên trong cookie; thiếu hoặc lệch → 401.
- Route không có → 404 `bad_request`. Lỗi không lường trước → 503 `unavailable`.
- Tên: 3–32 ký tự `[a-z0-9_.-]` sau trim + lowercase. Mật khẩu: 8–128 ký tự, chuẩn hoá NFC; đăng ký phải khớp `confirm`.

ErrorCode (12 mã, khai báo trong `src/lib/progress-sync-types.ts`):

| Code | HTTP | Ý nghĩa |
|---|---|---|
| `invalid_username` | 400 | Tên sai định dạng |
| `invalid_password` | 400 | Mật khẩu ngoài 8–128 ký tự |
| `password_mismatch` | 400 | `confirm` khác mật khẩu |
| `bad_request` | 400, 404 | JSON hỏng, state không phải v2, route lạ |
| `bad_credentials` | 401 | Sai tên hoặc mật khẩu |
| `unauthorized` | 401 | Thiếu/hỏng cookie, phiên đã thu hồi, hoặc sai `X-Sync-User` |
| `username_taken` | 409 | Tên đã có |
| `unsupported_media` | 415 | Thiếu `Content-Type: application/json` |
| `too_large` | 413 | Body > 64 KB, hoặc state gộp > 64 KB (không ghi gì) |
| `rate_limited` | 429 | Đăng nhập sai nhiều (có `Retry-After`), hoặc quá 30 lần đăng ký/giờ toàn máy chủ |
| `busy` | 503 | Hàng đợi băm mật khẩu đầy; `Retry-After: 2` |
| `unavailable` | 503 | Lỗi nội bộ, hoặc (từ Caddy) sidecar không tới được |

### Xác thực và phiên

- Mật khẩu: scrypt (N=16384, r=8, p=1, salt 16 byte, khoá 32 byte). Tối đa 2 lần băm song song, 8 yêu cầu chờ; quá thì `busy`.
- Cookie `omnilab_session`: JSON `{u, sv, exp}` ký HMAC-SHA256 bằng `SESSION_SECRET`. Thuộc tính `HttpOnly; SameSite=Lax; Path=/api; Secure` (bỏ `Secure` khi `COOKIE_SECURE=0`), hết hạn sau 180 ngày.
- Thu hồi: `sv` phải khớp `users.session_version`. `logout-all` và lệnh reset mật khẩu tăng số này, mọi cookie cũ mất hiệu lực.
- Chống dò: đăng nhập theo tên. 3 lần sai đầu miễn phí, sau đó chờ 1, 2, 4 … tối đa 60 s. Tên không tồn tại vẫn tốn một lần scrypt, nên thời gian phản hồi không lộ tên tồn tại.
- Bộ đếm throttle và giới hạn đăng ký nằm trong bộ nhớ, reset khi container khởi động lại.
- Log: một dòng JSON mỗi request (`t`, `method`, `path`, `status`, `ms`). Không ghi body, mật khẩu hay cookie.

### Mô hình đe doạ

| Mục | Nội dung |
|---|---|
| Lưu gì | Tên (chữ thường), hash scrypt, tiến độ (id bài, mốc thời gian, vị trí cuộn, bookmark). Không email, không tên thật |
| Bảo vệ | scrypt, throttle đăng nhập, giới hạn đăng ký, cookie HttpOnly + ký HMAC, sidecar không egress và không publish cổng |
| Chấp nhận | `username_taken` lộ tên đã tồn tại (đã quyết định). Không có quên mật khẩu tự động: reset bằng lệnh trên server |
| Phía trình duyệt | CSP không đổi (`script-src 'self'`). Tên người dùng hiển thị bằng `textContent`, không render HTML từ đầu vào |
| Chưa có | Quên mật khẩu qua email, OAuth, mã mời, nhiều instance (throttle và giới hạn đăng ký nằm trong bộ nhớ một instance) |

### Sao lưu

`server/sync/sync-backup.ts`, chạy bằng `node server/sync/sync-server-entry.ts --backup`: `VACUUM INTO` ra file tạm, rồi đổi tên thành `backups/omnilab-YYYY-MM-DD.db` (ngày theo múi giờ Việt Nam). Giữ 14 ngày. Cron, restore và reset mật khẩu: [deployment-vps-guide.html](./deployment-vps-guide.html), chương 6. Bản nghe bài học không nằm trong backup này: sinh lại được từ bài học, chỉ tốn lại hạn mức Gemini.

## Bản nghe bài học (sidecar tts)

Mỗi bài có thể có một bản nghe (một file `.m4a`) do giọng Gemini TTS đọc. Bản nghe là phần thêm: không có thì site và trình phát vẫn hoạt động, trình phát ẩn. Chi tiết hành vi nằm trong code; mục này chỉ ghi luồng, lý do và ranh giới.

Code: `src/lib/speech-script-*.ts` và `src/pages/tts-scripts.json.ts` (build), `server/tts/` (worker), `src/lib/audio-*.ts` và `src/components/islands/lesson-audio-*.astro` (trình phát).

### Luồng

```
build (astro)  MDX ─► speech-script-extract ─► dist/tts-scripts.json  (+ data-script-hash trên <article> của trang bài)
                                                   │ COPY vào image tts
VPS compose    tts (Node 24 + ffmpeg, mạng egress) ──► Gemini TTS (khoá chỉ ở header, store:false)
                 │ PCM từng đoạn (fsync): <audio dir>/work/…
                 └─► <audio dir>/public/{manifest.json, <bài>.<khoá>.m4a}
               app (Caddy, mount <audio dir>/public chỉ đọc) ── /audio/* ──► trình duyệt
trình duyệt    GET /audio/manifest.json: có bản cho bài → hiện trình phát; 404 hoặc thiếu bài → ẩn
<audio dir> = ${OMNILAB_AUDIO_DIR:-/srv/data/omnilab-audio} trên host, /data/audio trong container tts
```

- **Văn bản đọc** sinh lúc build bằng bộ trích cố định, không dùng LLM, tách riêng khỏi `mdxToPlainText` (thứ nuôi tìm kiếm). Bài nào bộ trích lỗi thì bị bỏ khỏi `tts-scripts.json` kèm cảnh báo `[tts-scripts]` trong log build; bài đó chỉ mất bản nghe, không làm hỏng build. Quy tắc khối nào được đọc: [content-authoring-guide.md](./content-authoring-guide.md#bản-nghe).
- **Hai mã băm.** `scriptHash` = hash văn bản đọc + phiên bản bộ trích (`SPEECH_EXTRACTOR_VERSION`), tính lúc build, gắn vào trang bài (`data-script-hash`). `audioKey` = `scriptHash` + model + giọng + style + cỡ đoạn + phiên bản ghép/nén, tính ở worker (`computeAudioKey`, `server/tts/tts-work-plan.ts`). Tách hai mã để trang biết "bản nghe này có khớp chữ đang hiển thị không" mà không cần biết cấu hình giọng; còn đổi giọng/model chỉ làm lệch `audioKey` (worker tạo lại, chữ trên trang không đổi nên trang vẫn coi là khớp). Tên file `.m4a` chứa 12 ký tự đầu của `audioKey`, nên nội dung một tên file không bao giờ đổi và cache được vĩnh viễn.
- **Lệch `scriptHash`** (bài vừa sửa, worker chưa tạo lại xong): trang vẫn phát bản cũ kèm nhãn "Bản nghe của phiên bản trước". Nút theo heading chỉ gắn cho heading còn tồn tại với cùng cấp.
- **Mốc theo heading.** `##` là ranh giới đoạn gửi Gemini nên mốc chính xác. `###` là mốc gần đúng, ước theo tỉ lệ ký tự trong mục `##` chứa nó (kẹp về đầu đoạn), không tốn thêm request. Phần nội dung trước `##` đầu tiên là mục "Mở đầu" (id `:intro`, không có nút heading). 13 bài không có `##` vẫn có nút `###`.
- **Hàng đợi một request một lần.** Worker gửi tuần tự, cách nhau `TTS_MIN_INTERVAL_MS`, lưu từng đoạn PCM (fsync, kèm `meta.json` có hash văn bản và số byte) rồi mới nén AAC bằng ffmpeg và công bố. Container bị tạo lại giữa chừng thì chạy tiếp từ đoạn đầu tiên thiếu hoặc sai. Sửa bài là tạo lại cả bài (không có cache theo từng đoạn): đã cân nhắc và chấp nhận tốn lại số request của cả bài để đơn giản hoá, xem [content-authoring-guide.md](./content-authoring-guide.md#bản-nghe).
- **Hạn mức free tier.** 429 tính theo ngày thì worker ngủ tới 0h giờ Los Angeles cộng độ trễ ngẫu nhiên ngắn (khoảng 14–15h giờ Việt Nam), trạng thái `pausedUntil` nằm trong `work/state.json` nên qua được restart. 429 theo phút thì chờ `retryDelay` rồi thử lại; 429 không phân loại được thì thử vài lần liên tiếp rồi coi như hạn mức ngày. Phân loại theo chuỗi con của `quotaId`: `server/tts/gemini-quota.ts`. Một lần deploy có thể làm lãng phí một request đang chạy (SIGTERM huỷ request đó, và nó có thể đã bị tính vào hạn mức). Đợt tạo đầu khoảng 450–500 request cho toàn bộ bài; ở 10–20 request/ngày là khoảng 23–50 ngày, các bài tự lên dần.
- **Kiểm audio.** Phản hồi 200 mà thiếu audio được thử lại có giới hạn. Thời lượng thật so với ước theo ký tự/giây (`TTS_CHARS_PER_SEC`) phải trong khoảng [0,5×; 2×]; ngoài khoảng thì tạo lại đúng một lần và giữ bản gần 1 hơn. Bài vẫn lỗi thì ghi `failed` trong `state.json`, tự thử lại sau `TTS_FAILED_RETRY_DAYS` (7 ngày) hoặc khi chạy `--retry-failed <lessonId>` / `--retry-failed all`. Ngưỡng nằm ở `server/tts/tts-config.ts`.
- **Lỗi chung dừng cả vòng, không đánh lỗi từng bài** (`server/tts/tts-chunk-synth.ts`). Lý do: hạn mức free tier rất ít, một lỗi cấu hình không được đốt request cho mọi bài rồi khoá chúng 7 ngày. Khoá sai (`auth`), request/định dạng không khớp (`contract`: 4xx không phải chặn nội dung, WAV sai định dạng; request ghim `response_format.mime_type = audio/wav`), 5xx/mạng sau 8 lần (`upstream`), 429 theo phút 10 lần liên tiếp (`quota_minute`): vòng dừng với `idle` tương ứng, vòng quét sau thử lại. Hai bài liên tiếp lỗi cùng lý do trong một vòng cũng dừng vòng (`repeated_failure`, log `failure_streak`). Chỉ lỗi riêng của bài (nội dung bị chặn, thiếu audio sau nhiều lần) mới ghi `failed`.
- **Dọn dẹp an toàn** (`server/tts/audio-gc.ts`). Lý do: `tts-scripts.json` hỏng hoặc rỗng (thường do build lỗi) không được phép xoá cả kho audio đã tốn nhiều ngày hạn mức. Văn bản đọc rỗng, hỏng hoặc sai cấu trúc: không dọn gì, log `scripts_invalid`, ngủ (không crash-loop). Văn bản đọc làm mất nhiều hơn max(5 bài, 10% số bài đang có bản nghe): `gc_refused`, giữ nguyên manifest và file. Bài biến mất thật được giữ bản nghe 30 ngày (`TTS_RETAIN_REMOVED_DAYS`), file mồ côi lúc khôi phục manifest hỏng cũng vậy; file bị thay thế giữ 24 giờ (`TTS_RETAIN_OLD_HOURS`) để trình duyệt đang mở bản cũ vẫn tải được; kiểm tham chiếu manifest ngay trước khi xoá. Kho nhỏ vẫn gỡ được tối đa 5 bài bị xoá thật; vượt ngưỡng chỉ khiến file được giữ lại, không gây hại.
- **Không phụ thuộc deploy site.** `deploy/deploy.sh` build image `tts` riêng; build hoặc khởi động `tts` lỗi chỉ in `WARN` và giữ container `tts` cũ, không chặn cổng sức khoẻ của site. Thư mục audio trên host (và `public/`) chưa có hoặc không thuộc uid 1000 cũng chỉ in `WARN` kèm lệnh `install -d`. `app` không `depends_on` `tts`.

### Ranh giới triển khai

| Thành phần | Cấu hình (theo `compose.yml`, `Dockerfile`, `Caddyfile`) |
|---|---|
| `tts` | Chỉ mạng `egress` (bridge thường, có ra Internet; không `web`, không `internal`), không `ports:`; `read_only`, `cap_drop: [ALL]`, `no-new-privileges`; user `node` (uid 1000); `mem_limit` 256 MB, `cpus` 0,5, `pids_limit` 64 (ffmpeg `-threads 1`, PCM đưa thẳng vào stdin); `stop_grace_period` 20 s; không healthcheck (không phục vụ gì, trạng thái nằm ở log và manifest). Chỉ service này nhận `GEMINI_API_KEY`; tiến trình con ffmpeg chỉ nhận `PATH` |
| Thư mục audio | Riêng, tách khỏi dữ liệu sync (`OMNILAB_DATA_DIR`). `tts` mount cả thư mục; `app` chỉ mount `public/` vào `/srv/audio` ở chế độ chỉ đọc, không thấy `work/` |
| Dockerfile stage `tts` | Cùng bản Node alpine với `sync`, thêm ffmpeg (chỉ ở image này), `COPY` đúng các file entry import lúc chạy + `tts-scripts.json` từ stage `build` (vì vậy build `tts` cần `SITE_URL`). Khoá API là biến môi trường lúc chạy, không phải build arg |
| Caddy `/audio/*` | Chỉ trả `manifest.json` và tên file đúng mẫu `AUDIO_FILE_PATTERN` (`src/lib/audio-manifest.ts`); mọi đường dẫn khác dưới `/audio` là 404 trống, `no-store`. `.m4a` đặt `Content-Type: audio/mp4` cố định (Safari cần), `immutable`; `manifest.json` `no-cache`. CSP không đổi: `<audio>` cùng origin nằm trong `default-src 'self'` |
| Railpack | Không có mount, nên `/audio/manifest.json` là 404 và trình phát ẩn; Caddyfile dùng chung vẫn chạy |

### Điều khoản free tier

Gemini free tier cho phép Google dùng nội dung gửi lên để cải thiện sản phẩm. Vì vậy chỉ gửi bài học công khai. Với EEA/UK/CH điều khoản có vùng xám; chủ dự án đã chấp nhận ngày 2026-10-28. Ghi nhận cho người vận hành nằm ở [deployment-vps-guide.html](./deployment-vps-guide.html) (chương 8).

## Tìm kiếm (MiniSearch)

**Tại sao MiniSearch** (không Pagefind): Phase 5 spike, Pagefind failed query "bo nho dem" (cache vắng top 15). MiniSearch với xử lý dấu Tiếng Việt (`Đ↔d`, `ô↔o`, NFD normalize) → `cache` ≡ `bộ nhớ đệm` ≡ `bo nho dem`.

**Build-time**: Parse MDX → plain text (loại bỏ Figure/Disclaimer, unwrap RealLife). Tạo index MiniSearch, serialize → `search-index.json`.

**Runtime**: Lazy-load trên `/tim-kiem` (first keystroke). Truy vấn AND trước, không có kết quả thì OR; prefix chỉ cho từ cuối, fuzzy 0.2 chỉ cho từ ≥ 4 ký tự; highlight theo ranh giới từ sau NFC. Payload ~84KB gzip (text cap 6000 ký tự/bài).

**Error handling**: Nếu load index thất bại → hiển thị error state với nút "Thử lại". Lỗi được announced qua persistent status region (live region) để screen reader phát hiện. Xem `src/lib/search-box-controller.ts`.

## Layout Desktop (3 cột, >=1280px)

Reader layout (`src/layouts/reader-layout.astro`) cung cấp aside slot dành cho TOC + tiến độ + action (bookmark, complete, next lesson):

- **Sidebar** (264px): Điều hướng + danh sách lĩnh vực
- **Main** (68ch, centered): Nội dung bài học
- **Aside** (296px, >=1280px only): Sticky column scrolls independently

**TOC Scrollspy** (`src/lib/toc-scrollspy.ts`): 
- IntersectionObserver + rAF throttle: Highlights current heading as user scrolls
- Sets `aria-current="location"` on active TOC link
- Progress bar: Reading % (0–100) updated per scroll/resize
- Aside TOC: scrollIntoView instant (no animation), respects reduced-motion
- Inline TOC (mobile/tablet): Collapsible, hidden at >=1280px via `.hide-at-aside-width`

**Contract**: Inline copy có `.hide-at-aside-width` ở <1280px; aside never renders <1280px. Islands (bookmark, complete) bind every instance + share progress store → click aside button flips all copies.

## Styling & Dark mode

**CSS tokens** (`src/styles/tokens.css`): Biến custom cho màu iOS (light/dark palette), material glass (blur + fallback), radius, type scale, motion, spacing 4pt grid.

**Shared utilities** (`src/styles/base.css`): `.ios-list`, `.ios-row`, `.ios-card`, `.btn`, `.ios-search`, `.ios-glass`, `.hide-at-aside-width` — single source of truth, không dùng CSS tùy chỉnh.

**Dark mode**: `:root[data-theme="dark"]` do prefs-init đặt từ lựa chọn ở /toi (Sáng/Tối/Theo hệ thống); không còn `@media (prefers-color-scheme)` trong CSS, không JS = sáng. Shiki: light colors inline, dark trong `--shiki-dark-*` vars, apply trong `prose.css`; `src/lib/shiki-contrast-fixes.mjs` thay 2 màu github-* dưới AA (cam light, comment dark). `rehype-wrap-tables.mjs` bọc bảng trong vùng cuộn và đổi ô `<th>` rỗng (góc bảng so sánh) thành `<td>` để không sửa nội dung bài.

## Security (CSP)

Bản nghe: `<audio>` tải `/audio/*` cùng origin nên không cần sửa CSP (`default-src 'self'`); Caddyfile có ghi chú tại chỗ.

**Caddyfile** (`Content-Security-Policy`):
```
script-src 'self' (all scripts external, vite.build.assetsInlineLimit: 0, no hashes)
style-src 'self' 'unsafe-inline' (only Shiki inline styles)
default-src 'self', img-src 'self' data:, object-src 'none', frame-ancestors 'none'
```

**Threat model (site tĩnh)**: không user input được render thành HTML, không third-party script. Phần tài khoản và cookie có mô hình đe doạ riêng ở [Máy chủ đồng bộ](#mô-hình-đe-doạ). CSP không đổi.

## Performance

- **JS**: 6–13KB gzip/trang (budget 30KB). Home/domain/lesson: 6–7KB. Search: 13KB.
- **HTML**: 73 trang (kể cả 404), ~150KB raw / ~40KB gzip (số liệu cũ, chưa đo lại sau khi thêm tab Tôi và tài khoản).
- **Search index**: ~84KB gzip (lazy-load).
- **Fonts**: Self-hosted (@fontsource, không CDN).
- **Cache**: /_astro/* immutable, mọi đường dẫn khác no-cache (revalidate).

## Thêm domain

1. Tạo `src/content/domains/{id}.yaml` (metadata + modules)
2. Thêm folder `src/content/lessons/{id}/{module}/`
3. Viết file MDX
4. Chạy `pnpm build` — không sửa code Astro

---

Xem chi tiết: [`docs/codebase-summary.md`](./codebase-summary.md), [`docs/deployment-vps-guide.html`](./deployment-vps-guide.html) (deploy chính), [`docs/deployment-guide.md`](./deployment-guide.md) (Railpack, phương án cũ)
