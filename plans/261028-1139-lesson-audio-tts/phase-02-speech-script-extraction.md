---
phase: 2
title: "Phase 2: Speech script extraction"
status: completed
priority: P1
effort: "1.5d"
dependencies: []
---

# Phase 2: Speech script extraction (văn bản đọc + hợp đồng dữ liệu)

## Overview

Lúc build, chuyển MDX mỗi bài thành văn bản đọc chia theo mục `##`, đánh dấu vị trí các heading `###` bên trong mục, tính `scriptHash`, phát ra `dist/tts-scripts.json`. Phase này cũng chốt hai hợp đồng dữ liệu thuần dùng chung: file văn bản đọc (build → worker) và `manifest.json` (worker → trình duyệt), để phase 3 và phase 5 làm song song được. Không sửa `mdxToPlainText` (`src/lib/search-mdx-to-text.ts`), vì hàm này đang phục vụ tìm kiếm và thời gian đọc. Lỗi ở một bài không bao giờ làm hỏng build của site.

## Context links

- Bộ trích AST sẵn có: `scripts/lib/mdx-text-extract.mjs` — `parseMdx` (:182), `jsxAttrValueText` (:49, xử lý caption dạng template literal có `<a>`), `REMOVED_JSX_NAMES` (:14), `JSX_TEXT_ATTRS` (:28).
- Endpoint JSON build-time mẫu: `src/pages/search-index.json.ts:13-50` (gọi `render(lesson.entry)` để lấy `headings`), `src/pages/lessons-index.json.ts`.
- Trang bài: `src/pages/hoc/[domain]/[module]/[slug].astro:33` (`render(lesson)` → `headings`), `:51-53` (`findTitleDuplicate`, `toc = depth === 2`), `:107` (Disclaimer cấp trang khi `domain.data.isFinance`).
- `findTitleDuplicate` ở `src/lib/lesson-reader-model.ts:21`; `ReaderHeading` ở `:6`.
- `getAllLessonsOrdered` ở `src/lib/content-queries.ts:100`; `getDomain` ở `:76`; `lessonIdOf` ở `src/lib/lesson-id.ts:23`; `LESSON_ID_PATTERN` ở `src/lib/progress-state.ts:48`.
- Component: `src/components/lesson/mdx-components.ts:11-18` (6 tag JSX: RealLife, Figure, Note, TranslatorNote, Disclaimer, ReviewNote); chữ Disclaimer ở `src/components/lesson/disclaimer.astro:31-36`.
- Kho bài (scout mục 3, red-team M4): 78 bài; 344 heading `##` và 193 heading `###`; 13 bài không có `##` nào (12 bài `tai-chinh/lo-trinh-12-tuan/*` và `an-toan/02`, riêng `nguon-hoc/02-tu-sach-va-lich-doc.mdx` có 8 `###`); 28 bài có `<Disclaimer />` trong MDX (domain không đặt `isFinance`), domain `tai-chinh` có `isFinance: true` (`src/content/domains/tai-chinh.yaml:9`); bảng GFM ở 53 bài; code fence ở 10 bài; JSX chữ thường gặp: `<a>` 33, `<br/>` 20, `<sup>` 10, `<details>/<summary>` 2.
- Test mẫu duyệt mọi bài: `tests/lesson-content.test.mjs` (`walkMdxFiles`, `parseLessonFrontmatter`).

## Requirements

### Quy tắc văn bản đọc (cố định, không dùng LLM)

| Nút | Cách đọc |
|---|---|
| Đầu bài | Câu tiêu đề bài (frontmatter `title`), rồi đúng một lần câu miễn trừ nếu domain có `isFinance` hoặc MDX có `<Disclaimer />` |
| `import`/ESM, biểu thức, `yaml`, `thematicBreak`, ảnh markdown | Bỏ |
| Heading trùng tiêu đề (`findTitleDuplicate`) | Bỏ (tiêu đề đã đọc ở đầu bài), không thành mục hay mốc |
| Heading khác | Đọc thành một câu; `##` mở một mục mới, `###` thành mốc gần đúng trong mục hiện tại |
| Đoạn văn, blockquote, mục danh sách | Mỗi khối một đoạn; danh sách có thứ tự không đọc số thứ tự |
| Code fence | Câu cố định "Đoạn mã, xem trên màn hình." |
| `inlineCode` | Đọc nguyên chữ |
| Bảng GFM | Mỗi hàng dữ liệu một câu: "<tên cột>: <giá trị>; …". Bỏ ô rỗng; cột không có tên thì chỉ đọc giá trị |
| Link | Chỉ chữ hiển thị |
| `<Figure>` | Chỉ `caption` (qua `jsxAttrValueText`); không caption thì bỏ; không đọc `alt`, `credit` |
| `<RealLife title>` | "Ví dụ đời sống: <title>." (không title thì "Ví dụ đời sống.") rồi nội dung |
| `<Note title>` | `title` (nếu có) rồi nội dung |
| `<TranslatorNote>` | Nội dung (heading `##` bên trong vẫn là mục) |
| `<ReviewNote>` | Bỏ toàn bộ (heading bên trong vẫn được đếm khi ghép id) |
| `<Disclaimer />` trong MDX | Bỏ tại chỗ (đã đọc ở đầu bài) |
| `<br/>` | Khoảng trắng; `<sup>`: bỏ; `<a>`, `<details>`, `<summary>`: nội dung |
| JSX lạ | Đọc nội dung, kèm cảnh báo build để phát hiện component mới |

Chuẩn hoá mỗi đoạn: NFC, gộp khoảng trắng, bỏ đoạn rỗng, thêm dấu chấm nếu đoạn kết thúc bằng chữ hoặc số để giọng đọc ngắt nghỉ.

### Mục, mốc và id

<!-- Updated: Validation Session 1 - thêm mốc ### gần đúng (quyết định người dùng 1, red-team M4) -->
- Mục = heading `##` không phải heading trùng tiêu đề, khớp với TOC ở `[slug].astro:53`. Nội dung trước `##` đầu tiên (gồm câu tiêu đề và miễn trừ) thuộc mục `INTRO_CHAPTER_ID = ':intro'`, tên "Mở đầu". Dấu `:` bị github-slugger loại nên id này không bao giờ trùng slug thật. `##` là ranh giới đoạn của worker nên mốc của mục là chính xác.
- Mốc = heading `###` không trùng tiêu đề, gắn vào mục đang mở (với 13 bài không có `##`, mốc nằm trong "Mở đầu"). Mỗi mốc lưu `{ id, title, paragraphIndex }`, trong đó `paragraphIndex` là vị trí đoạn chứa câu heading đó trong `paragraphs` của mục. Worker ước `startSec` của mốc theo tỉ lệ ký tự trong đoạn (chunk) chứa nó, không tốn thêm request Gemini. Không cắt đoạn ở `###` vì mỗi ranh giới bắt buộc làm tăng 30–40% số request.
- Id lấy từ `render(entry).headings` (github-slugger của Astro, gồm cả heading ẩn trùng tiêu đề), ghép theo thứ tự với mọi heading trong AST (kể cả heading nằm trong JSX như `ReviewNote`). Không tự cài lại thuật toán slug.
- Lệch số lượng, độ sâu hoặc chữ (so sau NFC + gộp khoảng trắng): bài đó được phát ra với một mục "Mở đầu" duy nhất, không mốc (vẫn nghe được, không có nút theo mục), kèm cảnh báo `[tts-scripts] heading mismatch <lessonId>`.
- Mục không có chữ để đọc (ví dụ toàn bộ nằm trong `ReviewNote`) bị bỏ; mốc nằm trong mục bị bỏ cũng bị bỏ.

### Lỗi không được làm hỏng build

<!-- Updated: Validation Session 1 - lỗi bộ trích theo từng bài không làm vỡ build site (red-team m6) -->
- Endpoint và trang bài gọi bộ trích trong `try/catch` theo từng bài. Bài ném lỗi thì bị bỏ khỏi `tts-scripts.json`, trang bài không có `data-script-hash` (player tự ẩn), build in `[tts-scripts] skipped <lessonId>: <message>` bằng `console.warn`. Site và các bài khác vẫn build bình thường, cả trên Railpack lẫn VPS.
- Tiêu chí của phase vẫn là 0 cảnh báo `[tts-scripts]` trên kho hiện tại.

### Hợp đồng dữ liệu

- `src/lib/speech-script-contract.ts` (thuần, dùng ở build và worker): `SPEECH_EXTRACTOR_VERSION = 1` (tăng khi đổi quy tắc đọc, mọi bài sẽ được tạo lại), `INTRO_CHAPTER_ID`, `INTRO_CHAPTER_TITLE`, kiểu `SpeechScriptsFile { v: 1, extractorVersion, lessons: SpeechLesson[] }`, `SpeechLesson { id, title, scriptHash, chapters: SpeechChapter[] }`, `SpeechChapter { id, title, paragraphs: string[], marks: { id, title, paragraphIndex }[] }`, và `parseSpeechScripts(raw)` throw Error đọc được khi sai shape (id phải khớp `LESSON_ID_PATTERN`, `paragraphIndex` phải nằm trong `paragraphs`).
- `src/lib/audio-manifest.ts` (thuần, dùng ở worker và trình duyệt): kiểu `AudioManifest { v: 1, updatedAt, lessons: Record<lessonId, AudioEntry> }`, `AudioEntry { scriptHash, audioKey, file, durationSec, chapters: AudioChapter[], generatedAt, model, voice }`, `AudioChapter { id, title, startSec, depth: 2 | 3, approx: boolean }` (mục "Mở đầu" có `depth: 2`; mốc `###` có `depth: 3, approx: true`), sắp theo `startSec`; `audioFileName(lessonId, audioKey)` → `<domain>.<module>.<slug>.<12 hex đầu của audioKey>.m4a` (dấu `.` không có trong `LESSON_ID_PATTERN` nên không mơ hồ); `AUDIO_FILE_PATTERN`; `parseAudioManifest(raw)` khoan dung: sai version thì trả manifest rỗng, entry sai shape hoặc `file` không khớp pattern thì bỏ entry đó.
- `scriptHash` = sha256 hex của JSON `{ v: SPEECH_EXTRACTOR_VERSION, chapters }` (id, tên mục, các đoạn, mốc). Voice, model, style, cỡ đoạn KHÔNG nằm trong `scriptHash` vì là cấu hình runtime của worker; chúng nằm trong `audioKey` ở phase 3.
- `dist/tts-scripts.json` theo thứ tự khoá học của `getAllLessonsOrdered()`; công khai ở `/tts-scripts.json` (nội dung vốn công khai).
- Chữ miễn trừ chuyển vào hằng `DISCLAIMER_LABEL`, `DISCLAIMER_TEXT` (`src/lib/disclaimer-copy.ts`) để component và bộ trích dùng chung một nguồn. HTML render của `disclaimer.astro` giữ nguyên.

## Related code files

| Thao tác | File |
|---|---|
| Create | `src/lib/speech-script-contract.ts` |
| Create | `src/lib/audio-manifest.ts` |
| Create | `src/lib/disclaimer-copy.ts` |
| Create | `src/lib/speech-script-extract.ts` (duyệt khối, mục, mốc, ghép id) |
| Create | `src/lib/speech-script-text.ts` (chữ inline, câu bảng, chuẩn hoá đoạn) |
| Create | `src/lib/speech-script-queries.ts` (chỉ dùng lúc build: `getLessonSpeechScript(entry)` có memo theo lesson id, bọc `try/catch` trả `null` + cảnh báo, tính `scriptHash` bằng `node:crypto`) |
| Create | `src/pages/tts-scripts.json.ts` |
| Create | `tests/speech-script-extract.test.mjs`, `tests/speech-script-corpus.test.mjs`, `tests/audio-manifest.test.mjs`, `tests/speech-script-contract.test.mjs` |
| Modify | `scripts/lib/mdx-text-extract.mjs` (chỉ thêm `export` cho `jsxAttrValueText`, hành vi giữ nguyên; nơi gọi hiện có: chỉ trong chính file, `:74`) |
| Modify | `src/components/lesson/disclaimer.astro` (render chữ từ `disclaimer-copy.ts`) |

`src/pages/hoc/[domain]/[module]/[slug].astro` thuộc phase 5 (gắn `data-script-hash` cùng lúc với player), để phase 2 và phase 5 không cùng sửa một file.

## Implementation steps

1. Tìm trước khi viết: grep `toString`, `mdast-util-to-string`, `sha256`, `createHash` trong `src/` và `scripts/`. Dùng lại `parseMdx`, `jsxAttrValueText`, `findTitleDuplicate`, `LESSON_ID_PATTERN`; `mdast-util-to-string` (devDependency, đã dùng ở `src/lib/remark-reading-time.mjs:9`) cho chữ heading.
2. Viết test đỏ cho `speech-script-extract` bằng fixture nhỏ cho từng dòng của bảng quy tắc: import bị bỏ; heading trùng tiêu đề bị bỏ và không thành mục hay mốc; bài chỉ có `###` (mọi mốc nằm trong "Mở đầu", `paragraphIndex` đúng); bài không có heading nào; `###` dưới `##` gắn đúng mục; code fence → câu cố định; bảng 2 cột có ô rỗng; Figure có và không có caption, caption dạng template literal chứa `<a>`; RealLife có và không có title; ReviewNote có `##` bên trong (id vẫn ghép đúng, mục rỗng bị bỏ); Disclaimer trong MDX cộng `hasPageDisclaimer` vẫn chỉ đọc một lần; `<sup>` bị bỏ; lệch heading → một mục "Mở đầu" không mốc + cảnh báo.
3. Viết `disclaimer-copy.ts`, sửa `disclaimer.astro` dùng hằng; so HTML trang một bài `tai-chinh` trước/sau bằng `git diff --no-index` trên file build (phải giống hệt).
4. Viết `speech-script-text.ts` và `speech-script-extract.ts` tới khi test xanh; mỗi file dưới 200 dòng.
5. Viết `speech-script-contract.ts`, `audio-manifest.ts` + test (parse đúng, sai version, entry hỏng bị bỏ, `file` chứa `../` bị bỏ, `audioFileName` khớp `AUDIO_FILE_PATTERN`, chapter thiếu `depth`/`approx` bị bỏ, `paragraphIndex` ngoài khoảng bị từ chối).
6. Viết `speech-script-queries.ts` và `src/pages/tts-scripts.json.ts` theo mẫu `search-index.json.ts`. Test: một bài giả làm bộ trích ném lỗi thì endpoint vẫn trả các bài còn lại và in cảnh báo.
7. Test hợp đồng trên toàn bộ kho (`speech-script-corpus.test.mjs`): với mỗi file MDX, dựng `headings` giả từ chính AST (id `h<i>`) rồi chạy bộ trích. Kiểm: 0 cảnh báo; mọi đoạn khác rỗng; không đoạn nào chứa "```", "|", "<", "import "; chữ miễn trừ xuất hiện đúng một lần ở bài có miễn trừ, 0 lần ở bài khác; bài có code fence có câu "Đoạn mã, xem trên màn hình."; không còn câu dẫn của ReviewNote; id mục và mốc duy nhất; 13 bài không có `##` vẫn có mốc `###` (trừ heading trùng tiêu đề). In tổng số ký tự và số mục để ước số request.
8. `pnpm build`, rồi kiểm id mục và mốc khớp HTML thật (lệnh ở Success criteria).

## Todo

- [x] Test đỏ cho từng quy tắc, gồm mốc `###`
- [x] `disclaimer-copy.ts` + `disclaimer.astro` (HTML không đổi)
- [x] `speech-script-text.ts`, `speech-script-extract.ts`
- [x] `speech-script-contract.ts`, `audio-manifest.ts` + test
- [x] `speech-script-queries.ts`, `src/pages/tts-scripts.json.ts` (lỗi từng bài không làm vỡ build)
- [x] Test hợp đồng 78 bài
- [x] Build và kiểm id mục, mốc trên `dist`

## Success criteria

- `pnpm test` xanh (4 file test mới); `pnpm check` 0 lỗi; `pnpm verify:fidelity` xanh.
- `pnpm build` thành công, log build không có dòng `[tts-scripts]`.
- `dist/tts-scripts.json` có 78 bài, và mọi id mục và mốc (trừ `:intro`) có trong HTML trang tương ứng:

  ```bash
  node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('dist/tts-scripts.json','utf8'));let bad=0;for(const l of d.lessons){const h=fs.readFileSync('dist/hoc/'+l.id+'/index.html','utf8');for(const c of l.chapters){for(const id of [c.id,...c.marks.map(m=>m.id)]){if(id!==':intro'&&!h.includes('id=\"'+id+'\"')){bad++;console.log(l.id,id)}}}}console.log('lessons',d.lessons.length,'missing',bad);process.exit(bad?1:0)"
  ```
- Số mục (không tính "Mở đầu") mỗi bài bằng số mục TOC (`##` hiển thị); tổng số mốc bằng số `###` không trùng tiêu đề, trừ phần bị bỏ có lý do ghi trong báo cáo phase.
- HTML của khối miễn trừ không đổi so với trước khi refactor.

## Risk assessment

| Rủi ro | Khả năng × Tác động | Giảm thiểu |
|---|---|---|
| `render().headings` không chứa heading nằm trong JSX (thứ tự lệch) | Trung bình × Trung bình | Kiểm ở bước 8 trên toàn kho; lệch thì bài đó rơi về một mục và có cảnh báo, không làm vỡ build. Nếu lệch có hệ thống thì điều chỉnh cách thu heading AST (bỏ heading trong JSX) cho khớp, không đổi slug. |
| Bộ trích ném lỗi với bài mới viết | Thấp × Thấp | `try/catch` theo bài: bài đó chỉ mất bản nghe, site vẫn build. |
| Mốc `###` lệch vài giây | Chắc chắn × Thấp | Người dùng chấp nhận mốc gần đúng; worker lùi mốc 1 giây để không mất chữ đầu heading (phase 3). |
| Đọc ký hiệu lạ ("→", "≈", "%") hoặc thuật ngữ tiếng Anh chưa chuẩn | Trung bình × Thấp | Nghe thử ở phase 1 và bài đầu tiên ở phase 4; đổi quy tắc thì tăng `SPEECH_EXTRACTOR_VERSION`. Bảng thay thế phát âm không nằm trong phạm vi plan này. |
| Build chậm thêm | Thấp × Thấp | 78 bài, ~1,16 MB MDX, parse một lần có memo; đo thời gian build trước/sau. |

## Security

- Chỉ xử lý nội dung bài công khai; `/tts-scripts.json` không chứa gì ngoài văn bản bài và id.
- Không có key hay cấu hình runtime trong output build.

## Rollback

Xoá endpoint và các module mới, revert `disclaimer.astro` và dòng `export`; không có dữ liệu người dùng hay trạng thái nào bị ảnh hưởng.
