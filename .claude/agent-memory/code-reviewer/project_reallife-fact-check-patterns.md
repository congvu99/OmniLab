---
name: reallife-fact-check-patterns
description: Recurring defects in AI-written RealLife analogies/SVGs for OmniLab system-design lessons, and the word-count convention used when fact-checking them
metadata:
  type: project
---

Fact-checker (code-reviewer agent) sets `examplesReviewed: true` on lessons by user delegation; only RealLife bodies, Figure-added alt/caption, owned SVGs and that frontmatter flag may change. `pnpm verify:fidelity` must still pass.

**Why:** User delegated human review to an independent agent (plan.md decision 2026-09-28). The first kien-truc/chu-de pass (2026-09-28) fixed 17 of 26 blocks, so writer output is not trustworthy as-is.

**How to apply:** check these recurring defects first:
- DNS diagrams that chain Root→TLD→Authoritative (wrong: the resolver queries each level iteratively)
- LRU explained as "oldest" or "least used" (that is FIFO/LFU)
- TTL analogies implying data is fresh until expiry
- cache-aside vs write-through reduced to "who writes first" (the real difference is who talks to the DB)
- absolute claims ("never sends to a dead server")
- two analogies in one block
- the same setting reused across lessons (restaurant, building gate/receptionist)
- viewBox 360x260 (guide allows only 220/300; fix with `0 -20 360 300`)

Word count: "≤ 90 từ" measured as whitespace tokens counts syllables. Pilot blocks run 90-116 syllables, so treat about 115 syllables as the ceiling.
