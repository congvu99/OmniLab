---
phase: 3
title: "Content model and migration"
status: pending
priority: P1
effort: "2 ngày"
dependencies: [1]
---

# Phase 3: Content model and migration

## Overview
Schema nội dung domain-agnostic, MDX components nội dung, script chuyển 28 md Kiến trúc + tách `index.html` Tài chính thành bài học, snapshot nguồn gốc, và **`verify-fidelity` chặn build nếu nội dung gốc bị sửa**. Chạy song song được với Phase 2 (khác file).

## Requirements
- Functional:
  - Thêm lĩnh vực = `src/content/domains/<id>.yaml` + thư mục `src/content/lessons/<id>/` — không sửa code.
  - Mỗi bài có nguồn + license hiển thị được; bài Tài chính có `<Disclaimer>`.
  - Lesson ID ổn định `domain/slug` (slug = tên file bỏ tiền tố số), không đổi sau khi publish.
- Non-functional: script migration idempotent (chạy lại ra kết quả như cũ); snapshot nguồn commit vào repo để fidelity check không phụ thuộc máy.

## Architecture
**Schema** (`src/content.config.ts`, zod):
```ts
domains: { id, title, tagline, accent, accentDark, icon, order }
modules (trong domain YAML): [{ id, title, order }]
lessons: {
  domain: reference('domains'), module: string, order: number,
  title: string, summary: string, cover?: image(),
  source: { name, author, url?, license, translatedAt? },
  examplesReviewed: boolean = false,
}
// readingMinutes: tính lúc build (remark plugin, ~200 từ/phút)
```
**Cấu trúc nội dung:**
```
src/content/domains/kien-truc.yaml   # modules: nen-tang, danh-doi, chu-de, bai-tap
src/content/domains/tai-chinh.yaml   # modules: khoi-dong, 12-tuan, bai-tap, nguon-hoc (chốt khi tách)
src/content/lessons/kien-truc/chu-de/07-cache.mdx
content-sources/system-design/**.md  # snapshot gốc (read-only)
content-sources/finance/index.html   # snapshot gốc
src/assets/legacy/system-design/*.png  # ảnh gốc, giữ credit
```
**MDX components** (`src/components/lesson/`): `real-life.astro` (tiêu đề + icon + accent nền nhạt), `figure.astro` (SVG/ảnh + alt bắt buộc + caption + credit), `note.astro`, `translator-note.astro`, `disclaimer.astro`. Map vào MDX qua `components` prop — không import từng file.

**Migration:**
- `scripts/migrate-system-design.mjs`: đọc snapshot → giữ frontmatter gốc map sang schema → sửa link nội bộ `../02-chu-de/07-cache.md` → `/hoc/kien-truc/cache`, ảnh `../../images/x.png` → import từ `src/assets/legacy/` → bọc khối "Ghi chú của người dịch" bằng `<TranslatorNote>` → ghi `.mdx`. Escape ký tự MDX nhạy cảm (`{`, `<` trong text/code).
- `scripts/migrate-finance-html.mjs`: parse HTML (`node-html-parser`/`hast`), tách theo `h2/h3` bằng `scripts/finance-split-map.json` (section id → lesson slug/module/order), convert sang markdown (`turndown` hoặc `hast-util-to-mdast`), giữ bảng, box/note → `<Note>`.
**Fidelity** (`scripts/verify-fidelity.mjs`, chạy trong `pnpm build` qua `prebuild`):
1. Parse MDX → mdast; xoá node `<RealLife>`, `<Figure>`, `<Disclaimer>`; lấy plain text.
2. Parse nguồn tương ứng → plain text (md: remark; html: hast → text).
3. Normalize: Unicode NFC, gộp whitespace, bỏ URL/đường dẫn (chỉ so text hiển thị), bỏ số thứ tự heading.
4. So sánh; lệch → in diff theo đoạn + exit 1. Mapping bài ↔ nguồn khai báo trong frontmatter `source.snapshot`.

## Related Code Files
- Create: `src/content.config.ts`, `src/content/domains/*.yaml`, `src/content/lessons/**`, `content-sources/**`, `src/assets/legacy/**`
- Create: `src/components/lesson/{real-life,figure,note,translator-note,disclaimer}.astro`, `src/lib/lesson-id.ts`, `src/lib/remark-reading-time.mjs`
- Create: `scripts/migrate-system-design.mjs`, `scripts/migrate-finance-html.mjs`, `scripts/finance-split-map.json`, `scripts/verify-fidelity.mjs`
- Create: `tests/verify-fidelity.test.mjs` (node:test hoặc vitest)
- Modify: `package.json` (scripts `migrate:*`, `verify:fidelity`, `prebuild`)

## Implementation Steps
1. Snapshot nguồn vào `content-sources/` (copy, không sửa); copy 36 ảnh vào `src/assets/legacy/system-design/`.
2. Viết schema + 2 domain YAML.
3. Viết 5 MDX components (chưa cần style cuối — dùng token Phase 2 nếu đã có).
4. **Test trước cho `verify-fidelity`**: case pass (chỉ thêm `<RealLife>`), case fail (sửa 1 từ gốc), case fail (xoá 1 đoạn), case pass (đổi URL link nội bộ), case NFC vs NFD.
5. Viết `verify-fidelity.mjs` đến khi test pass.
6. Viết `migrate-system-design.mjs`; chạy; kiểm tay 3 bài (cache, database — dài nhất, pastebin — có ảnh).
7. Chốt `finance-split-map.json` (đề xuất: 1 bài "Học để làm gì" + 1 "Bốn chặng" + 12 bài tuần + 1 "Bài tập thực hành" + 1 "An toàn & chống giả mạo" + 1 "Nguồn học" + 1 "Chọn nhánh tiếp" + 1 "Nghiên cứu nói gì" ≈ 19); chạy `migrate-finance-html.mjs`.
8. `pnpm verify:fidelity` pass toàn bộ; `astro check` pass (schema).
9. Trang `/gioi-thieu` liệt kê nguồn + license CC BY 4.0 (Donne Martin & cộng đồng) + credit ảnh bên thứ ba.

## Success Criteria
- [ ] 28 bài Kiến trúc + ~19 bài Tài chính build được, schema hợp lệ.
- [ ] `verify-fidelity` test pass; chạy trên toàn bộ nội dung pass.
- [ ] Không còn link nội bộ hỏng (link checker ở Phase 7, kiểm sơ bộ ở đây).
- [ ] Chạy lại migration không tạo diff git.
- [ ] Thêm domain thử `demo.yaml` + 1 bài → hiển thị trong collection mà không sửa code.

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| Ký tự `{}`/`<` trong md làm MDX compile lỗi | H | M | Escape trong script; code block giữ nguyên fence |
| HTML tài chính cấu trúc không đều → tách sai | M | M | Split map thủ công, review từng bài; fidelity so theo section |
| Fidelity quá chặt (false positive do format bảng/list) | M | M | So plain text sau normalize, không so markdown thô |
| Ảnh bên thứ ba vi phạm bản quyền | M | M | Giữ caption credit gốc; ưu tiên thay SVG (Phase 6 + vòng 2) |
