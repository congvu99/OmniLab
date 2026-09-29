---
name: reallife-factcheck-recurring-defects
description: Recurring defects found when fact-checking AI-written RealLife blocks and inline SVGs in OmniLab lessons; what to check first
metadata:
  type: project
---

Fact-check of kien-truc/bai-tap (2026-09-28) found the same defect classes that writer agents keep producing:
- Back-of-envelope chains that mix up storage and rate (size × count ÷ seconds presented as "writes/s").
- SVG text labels sitting on bezier curves or overlapping other labels; non-standard viewBox heights (240/260/320) even though the guide allows only 220/300; `marker-end` on a multi-segment path, which draws only one arrowhead.
- Analogies that encode the wrong mechanism (alphabetical drawers for hash sharding, sequential queue tickets for random-code collisions, "bỏ qua" when the original says "giảm ưu tiên").
- Cross-lesson duplicate analogies (the same shelf/cache or appointment-slip/queue analogy in two lessons). Writer batches only check within their own batch.
- Word count over 90 (Vietnamese syllables), which writers under-report.

**Why:** writer agents self-report "all OK", but their checks cover syntax only (hex, XML), not semantics.
**How to apply:** for any future content fact-check, recompute every number, compute bezier midpoints against label boxes, grep viewBoxes, and compare analogies across ALL lessons in the module, not just one batch. The original lesson text is the source of truth; translator notes flag errors in the original, so don't "fix" them in RealLife blocks.
