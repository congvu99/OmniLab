# Scout: điểm tích hợp "Nghe bài học" (Gemini TTS sidecar), 2026-10-28

Nguồn: agent Explore quét read-only, lưu lại nguyên ý. Đường dẫn tính từ repo root.

## 1. Trang bài học và điểm gắn player

- Route: `src/pages/hoc/[domain]/[module]/[slug].astro`. `getStaticPaths` (24-30); `render(lesson)` trả `{Content, headings}` (33).
- Layout `src/layouts/reader-layout.astro`: slot `top-actions` (BookmarkButton, [slug].astro:73), slot `aside` (chỉ ≥1280px, reader-layout:127-129, 147-168), slot mặc định trong `<main id="reader-content" class="prose">` (57-75). Nội dung aside phải có bản inline `.hide-at-aside-width` (reader-layout:7-11).
- Thứ tự trong `<article class="lesson-article" data-lesson-id data-domain>` ([slug].astro:85-119): LessonHeader (92), sr-only filler h2 (105), LessonToc (106), Disclaimer, `.lesson-body`, AttributionFooter, MarkCompleteButton (117), NextLessonCard.
- TOC: `src/components/lesson/lesson-toc.astro` (inline `<details>`, <1280px) và `lesson-aside.astro` (sticky ≥1280px: `.pbox` ring, `atoc` với `data-aside-toc-link data-slug`, `.acts`). Scrollspy `src/lib/toc-scrollspy.ts` (logic thuần có test).
- Dock mobile `src/components/shell/tab-bar.astro`: fixed, `z-index: var(--z-nav)` (100), bottom = safe-area + `--shell-tabbar-gap` (12px), cao `--shell-tabbar-h` 66px (`src/styles/tokens.css:168-170`). Autohide `src/lib/dock-autohide-binding.ts` đặt `data-scroll-hidden` + `inert`, chỉ <1024px. Z-index: nav 100, overlay 200, toast 300 (tokens.css:163-165).
- Mẫu nằm trên dock: `src/components/lesson/reader-toast.astro:41-47` dùng `body:has([data-tab-bar]:not([data-scroll-hidden='true'], [data-hidden='true']))`. `.reader-content` chừa padding đáy cho dock (reader-layout:101-107).
- Gắn đề xuất: card player trong article giữa LessonHeader (92) và LessonToc (106); desktop ≥1280px thêm tóm tắt trong `lesson-aside.astro` sau `.pbox` (~57), giữ contract chỉ một bản hiển thị; mini bar cố định đặt trong `reader-layout.astro` cạnh `<ReaderToast />` (50), z-index < toast.
- Client script: không framework. `<script>` module trong `.astro` + controller thuần TS `src/lib/*-controller.ts`. Vòng đời `src/lib/page-lifecycle.ts` `onPageLoad(setup)` (chạy lại mỗi `astro:page-load`, cleanup ở `astro:before-swap`); mẫu `islands/reader-progress-tracker.astro`.
- ClientRouter (reader-layout:44) thay `<body>` mỗi lần điều hướng nên `<audio>` bị huỷ: lưu vị trí ở `astro:before-swap`.
- Lesson id client: `document.querySelector('.lesson-article[data-lesson-id]').dataset.lessonId` (reader-progress-tracker.astro:26-27). `src/lib/lesson-id.ts` chỉ chạy ở build: `lessonIdOf(entry)` = `domain/module/slug` (23-25), khớp `LESSON_ID_PATTERN` (`src/lib/progress-state.ts`).

## 2. Heading id

- Astro `rehypeHeadingIds` dùng `github-slugger`, Slugger mới mỗi tài liệu, trùng thành `-1`, `-2`; áp cho MDX.
- `render(entry).headings` = `[{depth, slug, text}]` cho mọi heading. TOC: `visibleHeadings = headings.filter(h !== titleDuplicate)`, `toc = depth === 2` ([slug].astro:51-53).
- Heading trùng tiêu đề (`findTitleDuplicate`, `src/lib/lesson-reader-model.ts`) bị ẩn bằng CSS nhưng vẫn chiếm slug và bị loại khỏi TOC.
- Kết luận: lấy id từ `render(lesson.entry).headings` (như `search-index.json.ts:49`), ghép theo thứ tự với heading trong AST (ngoài code fence; 10 bài có fence). Không tự cài lại slug. 344 heading `##` trên 78 bài.
- Nhiều bài tài chính mở bằng `###`: phần trước `##` đầu tiên và bài không có `##` cần xử lý riêng.

## 3. Endpoint JSON build-time, MDX thô

- Mẫu: `src/pages/lessons-index.json.ts` và `src/pages/search-index.json.ts` (GET trả `Response(JSON.stringify(..))`), phát ra `dist/<name>.json`. Client fetch memo `src/lib/lessons-index-client.ts:21-33`.
- JSON mới (vd `src/pages/tts-scripts.json.ts`) nằm trong `dist`, công khai ở `/tts-scripts.json` (nội dung vốn công khai).
- `src/lib/content-queries.ts`: `QueriedLesson {entry,id,url,domainId,moduleId,title,order,readingMinutes}`; `getAllLessonsOrdered()`.
- `mdxToPlainText` (`src/lib/search-mdx-to-text.ts:35-54`; caller `content-queries.ts:52`, `search-index.json.ts:66`, `tests/search-mdx-to-text.test.mjs`) KHÔNG hợp cho TTS: cắt 6000 ký tự, mất ranh giới heading, giữ nội dung code, bảng thành khoảng trắng. Không sửa hàm cũ (lệch reading time và search); viết bộ trích riêng.
- MDX thô (78 bài, 1,16 MB, lớn nhất 49 KB `kien-truc/chu-de/06-database.mdx`): `<Figure ... />` 167 (attr đa dòng, `credit` chứa `>` và `<a>`), `<RealLife title>` 221, `<Note>` 13, `<TranslatorNote>` 27, `<ReviewNote>` 44, `<Disclaimer>` 28, bảng GFM ở 53 bài, code fence ở 10 bài. Dòng `import` còn trong `entry.body`.
- Nên dùng AST: `scripts/lib/mdx-text-extract.mjs` (unified + remark-parse + remark-mdx + gfm + unist-util-visit, đều đã là devDependency) có `REMOVED_JSX_NAMES` và `JSX_TEXT_ATTRS` (Figure: alt/caption/credit, Note: title).
- Dockerfile: `build` (2-11, node:24-slim, cần `SITE_URL`), `sync` (21-31, alpine, zero deps), `app` (34-41, PHẢI là stage cuối). Stage `tts` chèn giữa `sync` và `app`, copy JSON từ build; target `tts` kéo stage build nên cần `SITE_URL`. `.dockerignore` loại `tests docs deploy data plans`.

## 4. localStorage

- Key hiện có: `omnilab:v1:state`, `omnilab:v1:ios-hint-dismissed`, `omnilab:prefs`, `omnilab:v2:lastSyncedHash`, `omnilab:v2:syncUser`. Đề xuất `omnilab:v1:audio` = `{v:1, byLesson:{[id]:{t, rate, hash, at}}}`.
- Không thêm vào `LessonProgress` (progress-state.ts:24-32) vì được đồng bộ lên server (`sanitizeIncoming`, `MAX_STATE_BYTES`).
- Fallback private mode: `probeStorage`/`resolveDefaultStorage` (progress-store.ts:101-125, không export); `user-prefs.ts` `safeLocalStorage()` (103-109) với `readPrefs/writePrefs` nhận `storage` inject. Viết `audio-position-store.ts` theo mẫu user-prefs.

## 5. server/sync (mẫu cho tts)

- `server/sync/sync-server-entry.ts`: `export async function startServer(config)`, CLI khi `import.meta.main` (185-199).
- Log JSON một dòng (145, 153, 191); `config.log` inject cho test.
- Config `configFromEnv(env, dev)` (`sync-http-helpers.ts:78-88`), throw Error đọc được; `--dev` dùng `./.data`.
- Shutdown SIGTERM/SIGINT (192-194). Fail-fast ghi thử `.write-test` (26-28).
- Type stripping Node ≥24.2: chỉ cú pháp erasable, import tương đối giữ `.ts`, không enum/namespace/parameter properties.
- `tsconfig.server.json` include `server/**/*.ts` + 3 file lib. Module dùng chung từ `src/lib` phải thêm vào include và COPY của Dockerfile, phải thuần.
- Tests `tests/sync-*.test.mjs`: server thật, cổng ngẫu nhiên, `mkdtempSync`, log thu vào mảng.
- Node 24 có `fetch` toàn cục. `.m4a` cần ffmpeg (`apk add ffmpeg`).

## 6. Caddy, compose, deploy

- `Caddyfile`: `root * dist` (28), `encode` (31), `handle /api/*` (42-48), cache (58-61), security header (63-90; CSP 85), `file_server` (94), `try_files` (99), `handle_errors` (101-115).
- CSP không có `media-src` nên rơi về `default-src 'self'`: audio cùng origin hợp lệ.
- Cache: `@notHashed not path /_astro/* /api/*` → `no-cache` (60-61). Muốn `.m4a` immutable còn `manifest.json` no-cache thì loại `/audio/*` và đặt header riêng.
- Đặt `handle /audio/*` sau `handle /api/*` với root riêng, `uri strip_prefix /audio`, `file_server`. file_server hỗ trợ Range (cần cho seek iOS). Kiểm `handle_errors` khi đổi root.
- `compose.yml`: `app` read_only, `tmpfs: [/tmp, /data, /config]` (đừng mount audio vào `/data`), mạng `web`+`internal`, mem 128m. `sync` chỉ `internal`, bind `${OMNILAB_DATA_DIR:-/srv/data/omnilab}:/data`, mem 192m. `internal` là `internal: true` nên KHÔNG egress: tts cần mạng riêng không-internal, không gắn `web`, không `ports:`.
- Quyền: host dir uid 1000; nếu `audio/` chưa có lúc `up`, Docker tạo bằng root, tts không ghi được: cần `mkdir -p` + `chown 1000` hoặc tts tự tạo trong `/data`.
- Env `GEMINI_API_KEY`: cho phép rỗng (tts tự ngủ) để không vỡ deploy hiện có.
- `deploy/deploy.sh`: `docker compose build app sync` (33) thêm tts; vòng dọn image (44-47) thêm `omnilab-tts`; tag latest (42-43); cổng sức khoẻ (38-40) không được bắt tts; rollback (55-63) cần xử lý tts. tts phải idempotent vì bị recreate mỗi deploy.
- `deploy/backup-sync-db.sh`: chỉ DB; audio sinh lại được, ghi rõ trong docs.

## 7. Tests

- Phẳng `tests/*.test.mjs`, import trực tiếp `../src/lib/x.ts`, `../server/sync/x.ts`. `vitest.config.ts`: `include:['tests/**/*.test.mjs']`, `environment:'node'`. Không jsdom: DOM giả viết tay, storage inject. Player tách logic thuần + binding DOM mỏng như `toc-scrollspy.ts`.
- `tests/lesson-content.test.mjs` là mẫu cho test hợp đồng mọi bài.
- Gate: `pnpm verify:fidelity`, `test`, `check`, `check:server`, `build`.

## 8. Tài liệu cần cập nhật

`README.md` (Tính năng 16-28, Chạy local 30, Deploy 64); `docs/system-architecture.md` (Triển khai 98-121, "ba stage" 121, CSP 255, Client state 73); `docs/codebase-summary.md` (20, 92, 104, 116); `docs/deployment-vps-guide.html` (182, 283-312, 382); `docs/deployment-guide.md` (Railpack: không có `/audio`); `docs/project-roadmap.md` (50-61, 65); `docs/content-authoring-guide.md` (khối nào được đọc, sửa bài thì sinh lại audio). Quy ước: `docs/code-standards.md` (kebab-case, file <200 LOC, JSDoc "why", `.test.mjs`, erasable TS, CSP 220-227, a11y 229), `docs/design-guidelines.md` (dock 85-100, motion 193-212, reduced motion 214-222, icon API 224-258, tap ≥44px + focus ring 348-357, live region 367-371).

## 9. scripts/verify-fidelity.mjs

Chỉ duyệt `src/content/lessons`, `src/content/domains`, `content-sources/` (18-23). Thêm endpoint hoặc script mới không làm vỡ.

## 10. Icon

`src/components/icon/icon-paths.ts` (`<Icon name size stroke-width filled label />`): không có play, pause, skip, headphones. Thêm vào `icon-paths.ts` (lưới 24px, nét 1.5, round cap/join, không fill; `tests/icon-names.test.mjs` phủ): `play`, `pause`, `skip-back-15`, `skip-forward-15`, `headphones`.
