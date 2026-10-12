# Phase 2b — Reader, lesson components, prose
- prose.css: typography đọc dài iOS (17px/1.6 mobile, 18px desktop), measure ~68ch, headings, bảng scroll ngang, code block, blockquote.
- Reader desktop: điền `slot="aside"`: TOC sticky có scrollspy-highlight (JS nhẹ, CSP-safe như script hiện có), tiến độ đọc, bookmark/hoàn thành, bài tiếp theo. Mobile: TOC gập như cũ.
- Lesson components (cover, meta, note, real-life, review-note, disclaimer, figure, attribution, next-lesson) theo ngôn ngữ card iOS.
- Islands: mark-complete (nút filled lớn), bookmark (icon button), giữ logic.
- Không sửa MDX/SVG, fidelity gate phải pass.
