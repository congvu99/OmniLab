---
name: finance-original-content-review-hotspots
description: Where the OmniLab finance handbook's ORIGINAL text (content-sources/finance) goes stale or wrong; what to re-verify first in any editorial/ReviewNote pass
metadata:
  type: project
---

The editorial pass of 2026-09-29 (11 finance lessons, ReviewNote only) found that errors cluster in a few places:
- Laws that are "effective" but not yet implemented. Example: the gold-bar 0,1% PIT is in effect from 01/7/2026, yet Bộ Tài chính said on 30/6/2026 that it is not collected yet (decree pending). Check the implementation status, not just the effective date.
- Links to provincial subsites of merged provinces. The 2025 merger (NQ 202/2025/QH15) left sites like binhphuoc.gdt.gov.vn up (HTTP 200) but stale. HTTP 200 does not mean current.
- Claims that "no Vietnamese print edition exists". Same as Ever did have one (1980 Books, 2024). "tạm dịch" in a cited article means there is no evidence of a translation.
- The cited source does not say what the text claims (e.g. the VIB page did not mention "CIC free once a year").
- Migration artifacts: `<sup>`, `<details>` solutions, `ul.checklist` boxes and `div.pills` were flattened. Internal author jargon ("bản bàn giao", "máy hiện tại") leaks through.

**Why:** the original was AI-compiled and says "đã đối chiếu 24/09/2026", but it did not check implementation status or the content of the sources it cites.
**How to apply:** in future finance fact-checks, search news from the last 3 months for every legal figure, grep the HTML source for sup/details/checklist/pills, and open each cited page to confirm it supports the sentence. Related: [[reallife-factcheck-recurring-defects]].
