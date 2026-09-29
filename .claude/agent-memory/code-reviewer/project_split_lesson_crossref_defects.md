---
name: split-lesson-crossref-defects
description: Migration defects when single-page HTML sources are split into OmniLab lessons — dead in-page anchors, orphan source codes, raw-markdown summaries
metadata:
  type: project
---

Editorial review of tai-chinh lo-trinh-12-tuan (2026-09-29) found the original text itself is faithful, but splitting the single-page source broke cross-references:
- In-page anchors like `#hoc-lieu` survive in MDX but no element has that id on the lesson page (confirm with grep on `dist/`).
- Codes (H1–H6, S1–S5), "mục Việt Nam", "bài … bên dưới" point to sections now in other modules; no links.
- Section eyebrows ("03 / Kế hoạch thực hiện") become body paragraphs AND the frontmatter `summary`; other summaries keep raw `**Học:**`, which shows literally in meta description/search snippets.

**Why:** the migration script took the first paragraph as summary and kept source-relative wording; the fidelity gate locks the text, so these can only be flagged.
**How to apply:** in any review of split-source lessons (both domains), grep `](#`, source codes, "bên dưới/mục X", and `summary:` with `**` first; map each to its real `/hoc/<domain>/<module>/<slug>` URL. Legal wording worth checking for finance: Điều 35 KDBH 2022 covers life AND health >1 year; Điều 70 BHXH 2024 lump-sum limits. See [[reallife-factcheck-recurring-defects]].
