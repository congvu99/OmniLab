---
phase: 3
title: "Phase 3 report: Content model and migration"
date: 2026-09-28
status: completed
---

# Phase 3 report: Content model and migration

## Lesson counts

Kiến trúc (28, snapshot in `content-sources/system-design/`):

| Module | Lessons |
|---|---|
| nen-tang | 5 (4 gốc + `00-gioi-thieu` từ README.md — xem "README.md" bên dưới) |
| danh-doi | 5 |
| chu-de | 10 |
| bai-tap | 8 |

Tài chính (23, snapshot `content-sources/finance/index.html`):

| Module | Lessons |
|---|---|
| khoi-dong | 2 |
| lo-trinh-12-tuan | 12 |
| thuc-hanh | 1 |
| an-toan | 2 |
| nguon-hoc | 2 |
| di-tiep | 4 |

Tổng 51 bài. `src/content/lessons/**/*.mdx` (51 file) + `src/content/domains/{kien-truc,tai-chinh}.yaml`.

### README.md -> lesson thứ 28

`hoc-tap-vi/README.md` không có frontmatter dịch (nguon/tac-gia/...) và không phải nội dung dịch — là README điều hành của người dịch (quy ước đặt tên, bảng tiến độ). Acceptance criteria plan.md ghi "Đủ 28 bài Kiến trúc" = 27 file nội dung + README = 28, nên đã coi README là 1 lesson (`kien-truc/nen-tang/00-gioi-thieu`, order 0) thay vì bỏ qua — giữ nguyên toàn bộ text (kể cả bảng "Tiến độ") để fidelity so 1:1 như 27 file kia; `source.name`/`author` tự đặt (không có bản gốc để trích) — ghi rõ trong frontmatter đây là README biên tập, không phải bài dịch.

## Finance split table

`scripts/finance-split-map.json` là nguồn duy nhất (script đọc từ đó, không hardcode). Bảng người-đọc:

| # | Section HTML gốc | Lesson | Module | Ghi chú boundary |
|---|---|---|---|---|
| 1 | hero + `#bat-dau` | vi-sao-hoc | khoi-dong | hero (h1/lead/pills) gộp vào lesson đầu |
| 2 | `#ban-do` | bon-chang | khoi-dong | whole section |
| 3-14 | `#lich-hoc` | tuan-01..tuan-12 | lo-trinh-12-tuan | 1 lesson/`<article class="week">`; eyebrow+h2+p mở đầu section gắn vào tuan-01 |
| 15 | `#thuc-hanh` | bai-tap-va-thu-tu-tien-du | thuc-hanh | whole (4 bài tập + "Thứ tự dùng tiền dư" cùng 1 lesson — nội dung ngắn, tách thêm không cần thiết) |
| 16 | `#viet-nam` (trước h3 "Quy trình chống giả mạo") | boi-canh-viet-nam | an-toan | split-before-heading |
| 17 | `#viet-nam` (từ h3 đó trở đi) | chong-gia-mao | an-toan | split-before-heading |
| 18 | `#hoc-lieu` (trước h3 "Tủ sách: năm cuốn lõi") | nguon-hoc-chinh-thuc | nguon-hoc | split-before-heading |
| 19 | `#hoc-lieu` (từ h3 đó trở đi) | tu-sach-va-lich-doc | nguon-hoc | split-before-heading |
| 20 | `#mo-rong` | chon-nhanh-tiep | di-tiep | whole |
| 21 | `#bang-chung` | nghien-cuu-noi-gi | di-tiep | whole |
| 22 | `#tu-kiem-tra` | tu-danh-gia | di-tiep | whole |
| 23 | `#nguon` | nguon-tham-khao | di-tiep | whole |

23 lesson thay vì ~19 đề xuất trong plan — vì tài liệu thật dài hơn ước lượng (~7.5k từ, 10 section, section `#hoc-lieu` một mình đã ~2000 từ). Cân bằng độ dài bài học quan trọng hơn ép đúng con số 19; đã gộp 4 bài tập + "thứ tự dùng tiền dư" thành 1 lesson (thay vì 2) để bù lại.

**Boundary "content" của finance**: `<div class="hero">` (trong `<header>`) + toàn bộ `<main>` (10 `<section>`). Loại trừ: `<nav>` (mục lục trùng lặp), `.masthead` (site chrome), `<footer>`. Quyết định + lý do nằm trong `scripts/verify-fidelity.mjs` (`verifyFinance`, comment "Content = ...").

`migrate-finance-html.mjs` tự assert mọi `<section id>` trong HTML đều được `finance-split-map.json` dùng ít nhất 1 lần (throw nếu thiếu) — chặn drop nội dung do quên khai báo section mới.

## Escaping edge cases (system-design)

Audit toàn bộ 28 file bằng remark-parse+remark-gfm quét mọi text node chứa `{}<>ldata` trước khi viết script (không đoán):
- `{`/`}` trần ngoài code fence/inline code: chỉ có ở `02-chu-de/09-communication.md` (bảng so sánh RPC/REST, JSON mẫu dùng `<br/>` xuống dòng trong ô bảng) — escape bằng `\{`/`\}` (CommonMark backslash-escape hợp lệ cho mọi ASCII punctuation, kể cả trong bảng).
- `>` trần (không phải blockquote/tag): đúng 1 chỗ, `01-danh-doi/03-cap-theorem.md` ("R + W > N") — fix bằng string-replace theo đúng câu đó (không dùng rule chung vì sẽ phá `<br/>`).
- `<a href=URL>` không có ngoặc kép (hợp lệ nhưng lạ): 9 file, 2 dạng — trong khối `<p align="center">` credit ảnh, và trong `<sup><a href=...>N</a></sup>` footnote độ trễ. Cả hai được quote lại + resolve link khi build `<Figure credit=...>`/`<sup><a href="...">`.
- "Nguồn: " đặt TRƯỚC `<a>` (đa số file) so với đặt BÊN TRONG text của `<a>` (dns/cdn/load-balancer/reverse-proxy/communication) — 2 kiểu tác giả khác nhau; regex `CREDIT_INNER_RE` chấp nhận cả hai, chuẩn hoá output về 1 dạng (không ảnh hưởng fidelity vì chỉ so text hiển thị).
- 1 file (`04-reverse-proxy.md`) có `<br/>` thừa cuối khối credit ảnh (5 dòng thay vì 4 dòng như 24 file còn lại) — regex figure có nhánh optional cho trailing `<br/>`.
- Code fence (`` ```python ``) và inline code (`` `user.{0}` ``) giữ nguyên 100% — không đụng tới (script tách theo fence trước khi escape).
- Không có `<br>` thiếu `/` (không cần sửa).

## Escaping / conversion (finance)

- Không có `{`/`}` trong `<body>` (grep xác nhận, 122 cặp `{}` đều nằm trong `<style>` không đụng tới).
- Không có `<`/`>` trần trong text node nào (quét bằng hast text-node walk).
- `<caption>` trong bảng "Danh sách kiểm tra..." bị handler mặc định của `hast-util-to-mdast` **âm thầm bỏ** (`caption: ignore`) — phát hiện qua fidelity fail, sửa bằng `promoteTableCaptions()`: kéo caption ra thành `**...**` trước `<table>`.
- `<details>/<summary>` (lời giải bài tập ẩn/hiện) bị "làm phẳng" thành văn bản thường (mất tương tác ẩn/hiện, giữ 100% chữ) — quyết định chấp nhận được cho Phase 3 (nội dung không đổi); Phase 4/6 có thể bọc lại bằng component nếu muốn khôi phục UI thu gọn.
- `<span class="pill">`/`.badge`/`.ribbon` chip liền kề không có khoảng trắng trong HTML gốc (dựa vào CSS gap) → nối chữ dính (`"cốt lõiKhoảng"`) nếu convert thẳng. Fix: `insertImplicitSpaces()` chèn 1 space giữa 2 phần tử HTML liền kề không có text ở giữa — áp dụng TRƯỚC khi convert, nên đây là fix chất lượng nội dung thật (không phải mẹo qua fidelity).

## Fidelity: normalization rules (scripts/lib/fidelity.mjs)

1. Parse: nguồn `.md` → remark-parse+remark-gfm (không remark-mdx); bài `.mdx` → +remark-mdx. HTML nguồn (finance) → `hast-util-from-html`.
2. Trích text hiển thị bằng cách tự viết bộ duyệt cây (không dùng `mdast-util-to-string`/`hast-util-to-string` mặc định — cả hai không phân biệt được node "cần bỏ" như `<RealLife>`/`<Disclaimer>`, không xử lý `<caption>`/br đúng cách cho mục đích so sánh):
   - `text`/`inlineCode`/`code`: lấy nguyên `value` (code hiển thị được, đổi 1 ký tự trong code fence PHẢI fail).
   - `html` (raw HTML trong markdown): sub-parse qua `hast-util-from-html` rồi trích text (bắt được cả `alt`/text bên trong khối `<p align="center">`).
   - `image`/`imageReference`: dùng `alt` (chữ đã dịch, không phải nội dung phụ).
   - `break`, hast `<br>`/mdx `<br/>`: luôn = 1 khoảng trắng (không được nối chữ).
   - `<RealLife>`, `<Disclaimer>`: bỏ toàn bộ subtree (nội dung MỚI thêm).
   - `<Figure added>`/`data-added`: bỏ toàn bộ (SVG mới thêm sau này — Phase 6).
   - `<Figure>`/`<Note>`/`<TranslatorNote>` khác: giữ text con + text các attribute `alt`/`caption`/`credit` (kể cả khi viết dưới dạng template-literal JSX `credit={\`...\`}` — đọc qua estree acorn mà remark-mdx đã parse sẵn).
3. Join sibling: **chỉ** container "phrasing" (paragraph/heading/emphasis/strong/delete/link/tableCell/mdxJsxTextElement) nối con bằng `''` (tin tưởng khoảng trắng đã có sẵn trong text node, đúng ngữ nghĩa HTML/Markdown); mọi container khác (root/blockquote/list/table/tableRow/mdxJsxFlowElement...) nối bằng `' '` để tránh dính chữ giữa các khối. Hast-side có `insertImplicitSpaces()` tương ứng áp dụng CÙNG rule lúc convert finance, nên 2 bên luôn khớp.
4. Normalize cuối: Unicode NFC, bỏ mọi `https?://...`, gộp khoảng trắng, trim. Số thứ tự heading/list-marker không cần strip riêng vì mdast vốn không lưu chúng trong text node.
5. So sánh: `compareNormalized` tìm ký tự lệch đầu tiên, in `±80` ký tự quanh đó cho cả 2 phía.
6. Hệ quả: link nội bộ đổi URL → pass (chỉ so text hiển thị); NFC vs NFD → pass; thêm `<RealLife>`/`<Figure added>` → pass; sửa 1 chữ/xoá đoạn/sửa caption gốc → fail. 8 test case bắt buộc trong `tests/fidelity.test.mjs` cover đúng các case trên, viết TRƯỚC `verify-fidelity.mjs` (chạy fail trước khi script tồn tại, sau đó pass).

## Điều không giữ được chính xác 1:1

- Định dạng HTML gốc (bảng CSS class, `<details>` thu gọn, `<sup>` footnote số) → chuyển thành markdown/JSX tương đương, KHÔNG giữ pixel-perfect nhưng giữ 100% chữ (đã verify bằng `verify-fidelity`).
- README.md không có "nguồn/tác giả" gốc để trích — tự đặt `source.name`/`author` mô tả rõ đây là README biên tập nội bộ, không phải bản dịch tài liệu gốc.
- License bài Tài chính: `"Chưa xác định — cần user xác nhận"` — khớp "Unresolved Questions" đã có sẵn trong `plans/.../plan.md" ("Quyền/ghi công nội dung index.html tài chính"), không tự bịa license.
- 44 ảnh PNG/JPG gốc giữ nguyên định dạng/kích thước (không tối ưu qua Sharp — xem "Deviations" bên dưới), kèm credit "Nguồn: ..." gốc.

## Deviations / quyết định kỹ thuật đáng chú ý

1. **`readingMinutes` không chạy live trong `astro build`.** Astro 7 + `@astrojs/mdx@8` mặc định dùng processor "Sätteri" (Rust), **không chạy remark/rehype plugin nào** trừ khi cài thêm `@astrojs/markdown-remark` (`astro check`/`astro build` in cảnh báo rõ điều này). Cài thêm package nằm ngoài quyền sở hữu file phase này (`package.json` chỉ được sửa "scripts"). Giải pháp: vẫn đăng ký `remarkReadingTime` đúng như yêu cầu trong `astro.config.mjs` (`mdx({ remarkPlugins })`, tương thích ngược — tự chạy đúng ngay khi thêm package đó, 0 sửa code) + tính `readingMinutes` THẬT ngay lúc migrate bằng cách gọi thẳng plugin đó qua `scripts/lib/reading-time.mjs` (import trực tiếp `src/lib/remark-reading-time.mjs`, không viết lại logic). Ghi thẳng số vào frontmatter. **Cần user xác nhận**: có chấp nhận thêm `@astrojs/markdown-remark` ở phase sau để chuyển sang tính live không, hay giữ cách tính lúc migrate.
2. **`sharp` không có sẵn** (không nằm trong dependency whitelist) → `astro:assets` mặc định cần sharp để tối ưu ảnh, build sẽ lỗi. Đổi `image.service` sang `passthroughImageService()` (built-in của Astro core, không cần thêm package) — ảnh vẫn qua `astro:assets` (fingerprint, copy vào `_astro/`) nhưng không resize/convert định dạng. Ảnh gốc vốn đã vừa phải (lớn nhất 1.8 MB `Xkm5CXz.png`) nên chấp nhận được cho Phase 3; **Phase 6/QA nên xem lại** nếu cần Lighthouse Performance ≥95 (acceptance criteria #6) — có thể cần thêm `sharp` lúc đó.
3. `z.string().url()` (zod) báo deprecated trong `astro check` → đổi sang `z.url()` (zod v4 API mà `astro/zod` re-export) để giữ `astro check` sạch 0 hint.
4. `content.config.ts` import `z` từ `astro/zod` (không phải `astro:content`) theo đúng doc mới nhất — `astro:content`'s `z` re-export bị đánh dấu deprecated.

## Verify (tất cả pass)

- `pnpm test` (vitest): **111/111 pass** (8 fidelity + 103 lesson-content, gồm 51×2 file check + 1 "has lessons").
- `pnpm verify:fidelity`: **OK — 28 kien-truc + 23 tai-chinh lesson(s) match** (chạy trực tiếp `node scripts/verify-fidelity.mjs`, không qua `pnpm build`).
- `pnpm check` (`astro check`): **0 errors, 0 warnings, 0 hints** (41 file).
- `pnpm build` (= `node scripts/verify-fidelity.mjs && astro build`): **57 trang** (28 kien-truc + 23 tai-chinh + 6 trang shell của Phase 2: index/404/da-luu/demo-doc/linh-vuc/tim-kiem — không đụng file Phase 2, chỉ build chung).
- Idempotent: chạy `migrate-system-design.mjs` + `migrate-finance-html.mjs` **2 lần liên tiếp**, so sha256 toàn bộ `src/content/lessons/`, `content-sources/`, `src/assets/legacy/` — **identical** (không có timestamp/random trong output).
- "Thêm domain không sửa code": tạo `src/content/domains/demo.yaml` + `src/content/lessons/demo/demo-module/01-demo-lesson.mdx` (không sửa file code nào) → `astro check` 0 lỗi, `pnpm build` sinh `/hoc/demo/demo-module/demo-lesson/index.html` → xoá cả 2 file, build lại về đúng 57 trang. Xác nhận domain-agnostic đúng như acceptance criteria #7.
- Spot-check đọc HTML build: `chu-de/cache` (Figure + credit link thật, `\{`/`\}` render đúng `{`/`}`, `\>` render đúng `>`), `chu-de/database` (dài nhất, 46.9 KB HTML), `bai-tap/pastebin` (2 `<img>` từ `solutions/system_design/pastebin/*.png`, alt đúng), `tai-chinh/an-toan/boi-canh-viet-nam` (bảng + caption dịch ra `<strong>` đúng), `tai-chinh/thuc-hanh/bai-tap-va-thu-tu-tien-du` (4 `<Note>` lồng lời giải, chữ đầy đủ).

## Files

- Create: `src/content.config.ts`, `src/content/domains/{kien-truc,tai-chinh}.yaml`, `src/content/lessons/**/*.mdx` (51 file), `content-sources/system-design/**` (28 `.md`), `content-sources/finance/index.html`, `src/assets/legacy/system-design/*.{png,jpg}` (44 file).
- Create: `src/components/lesson/{real-life,figure,note,translator-note,disclaimer}.astro`, `src/components/lesson/mdx-components.ts`, `src/lib/lesson-id.ts`, `src/lib/remark-reading-time.mjs`.
- Create: `scripts/migrate-system-design.mjs`, `scripts/migrate-finance-html.mjs`, `scripts/finance-split-map.json`, `scripts/verify-fidelity.mjs`, `scripts/lib/{fidelity,frontmatter,links,system-design-transform,finance-extract,reading-time,summary}.mjs`.
- Create: `tests/fidelity.test.mjs`, `tests/lesson-content.test.mjs`, `vitest.config.ts`.
- Create (temporary, Phase 4 sẽ viết lại hoàn toàn): `src/pages/hoc/[domain]/[module]/[slug].astro` — render trần, không layout, chỉ để chứng minh mọi MDX compile qua `pnpm build`.
- Modify: `astro.config.mjs` (thêm `mdx({remarkPlugins})`, `image.service`), `package.json` (chỉ mục "scripts": thêm `test`, `migrate:system-design`, `migrate:finance`, `verify:fidelity`; đổi `build` thành `node scripts/verify-fidelity.mjs && astro build`).

## Unresolved questions

1. `@astrojs/markdown-remark` có nên thêm ở phase sau để `readingMinutes` chạy live trong `astro build` (thay vì tính lúc migrate)? Không chặn gì hiện tại (số đã đúng, ghi sẵn trong frontmatter) nhưng nếu Phase 4/5/6 cần remark plugin khác (vd reading-time hiển thị động theo nội dung user chỉnh sau này — không áp dụng ở đây vì nội dung tĩnh) thì nên cân nhắc.
2. `sharp` cho tối ưu ảnh — cần cho Lighthouse Performance ≥95 (acceptance criteria #6, thuộc Phase 7 QA) hay `passthroughImageService` đã đủ với 44 ảnh cỡ vài chục KB–1.8 MB? Đề xuất Phase 7 đo thử trước khi quyết định thêm dependency.
3. License nội dung Tài chính (`source.license: "Chưa xác định — cần user xác nhận"`) — đã có sẵn trong Unresolved Questions của `plan.md`, nhắc lại ở đây vì nó nằm trong 23 file MDX vừa tạo.
4. README.md → lesson `kien-truc/nen-tang/00-gioi-thieu`: quyết định tự đưa ra (không hỏi giữa chừng) dựa trên khớp số "28 bài" trong acceptance criteria; nếu user muốn tách khác (vd trang `/gioi-thieu` riêng thay vì 1 lesson trong domain) thì Phase 4 cần điều chỉnh routing, không phải sửa lại migration.

Status: DONE
Summary: 51/51 lesson MDX (28 kien-truc + 23 tai-chinh) migrated, schema+components+2 migration scripts+fidelity checker (tests-first, 111 vitest pass) all working; `pnpm build` renders all 51 via temp route (57 pages incl Phase 2 shell), `astro check` 0/0/0, migrations idempotent (sha256-verified), new-domain-no-code-change verified and cleaned up.
Concerns/Blockers: none blocking. 2 documented tradeoffs from missing-dependency constraints (readingMinutes computed at migrate-time not live-build-time; image optimization via passthroughImageService not sharp) — both correct/working today, both trivially upgradable later by adding 1 dependency each (not done here per file-ownership rule on package.json dependencies). Finance content license still unconfirmed (pre-existing plan.md unresolved question, not something this phase can resolve).
