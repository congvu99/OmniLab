---
name: editorial-review-original-content
description: How OmniLab editorial reviews of translated System Design Primer lessons go (ReviewNote append-only) and where real defects hide
metadata:
  type: project
---

Editorial review of kien-truc/chu-de 06-10 (2026-09-29) found that the Vietnamese translation matches the English primer closely. The real defects were errors in the English original that TranslatorNote missed, stale TranslatorNote facts (vendor renames/retirements, OWASP edition, VN law), and dead links.

**Why:** the lesson text is locked by the fidelity gate, so defects get recorded in a `<ReviewNote>` block appended at the end of the file. The block is excluded from verify-fidelity and search.

**How to apply:**
- Put the effort into checking technical claims in the original and TranslatorNote, not into re-diffing the translation.
- Link checks:
  - Many 403/405 responses are bot protection (stackoverflow, quora, medium, infoq, mysql docs, Cloudflare sites), so do not report those as dead.
  - Use the Wayback availability API to find replacement links.
  - Test the MDX by compiling with @mdx-js/mdx from `node_modules/.pnpm` instead of running the build.
- Related: [[reallife-factcheck-recurring-defects]].
