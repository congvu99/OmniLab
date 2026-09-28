---
phase: 6
batch: e
title: "Phase 6 batch E report: content enrichment — kien-truc/bai-tap (mint, sales-rank, social-graph, query-cache)"
date: 2026-09-28
status: completed
---

# Phase 6 batch E report

Owned files only: `src/content/lessons/kien-truc/bai-tap/{05-mint,06-sales-rank,07-social-graph,08-query-cache}.mdx`
+ 8 new SVGs in `src/assets/illustrations/kien-truc/`. Followed
`docs/content-authoring-guide.md` + `docs/illustration-style-guide.md`
literally; studied `chu-de/07-cache.mdx` + `chu-de/03-load-balancer.mdx` as
reference before writing. No other file touched.

## 05-mint.mdx (4 RealLife, 2 Figure added)

1. "Sổ thu chi tự động" — use case overview (auto-fetch + categorize +
   budget) vs manual household expense ledger.
2. "Phiếu hẹn ở tiệm giặt ủi" — async queue: Accounts API acks immediately,
   worker processes extraction job later.
3. "Sổ tay phân loại do cả nhà cùng sửa" — Category Service: seeded
   seller→category map + crowdsourced overrides that get written back.
4. "Kế toán tổng kết cuối tháng" — MapReduce batch aggregation vs realtime
   per-transaction accounting (batch vs realtime trade-off).

SVGs:
- `bai-tap-mint-hang-doi-bat-dong-bo.svg` (4121 B) — Client↔Accounts API
  immediate-ack path (accent, animated dash) vs Queue→Worker→DB-update path
  (async mechanism).
- `bai-tap-mint-phan-loai-hoc-dan.svg` (3772 B) — decision flow: lookup
  seller map → hit returns category; miss → user picks → feedback loop
  (accent, animated) writes back into the map.

## 06-sales-rank.mdx (4 RealLife, 2 Figure added)

1. "Bảng xếp hạng bán chạy ở chợ" — overview: market fruit-seller tallying
   best-sellers nightly maps to hourly category ranking at Amazon scale.
2. "Giờ mới xếp lại một lần, không phải tức khắc" — supermarket price board
   updated only after stock-take, vs hourly-batch ranking despite 40k
   reads/sec.
3. "Cân đo rồi mới xếp giá" — MapReduce two-step mechanism: weigh-all-first
   (map+reduce counts) then sort-after (distributed sort), mirrored by a
   produce vendor weighing before pricing.
4. "Kệ hàng bán chạy bày sẵn đầu chợ" — front-shelf display vs Memory Cache
   absorbing reads because data changes slowly but is read constantly.

SVGs:
- `bai-tap-sales-rank-luong-mapreduce.svg` (3471 B) — 5-stage vertical
  pipeline (log → map → reduce → sort → ranked table) with bracket labels
  "Bước 1"/"Bước 2" matching the original's two MapReduce steps.
- `bai-tap-sales-rank-doc-ghi-lech-100-1.svg` (1640 B) — bar comparison,
  tall accent bar (đọc ~40.000/s) vs short neutral bar (ghi ~400/s),
  explaining why cache sits in front of the DB.

## 07-social-graph.mdx (4 RealLife, 2 Figure added)

1. "Bạn của bạn" — overview: asking mutual friends for an intro = shortest
   path search over a friend graph.
2. "Dò từng vòng quen biết, gần trước xa sau" — BFS mechanism: exhaust
   direct friends (level 1) before friends-of-friends (level 2), why BFS
   uses a queue not a stack.
3. "Đường đi hay hỏi thì thuộc lòng sẵn" — caching precomputed BFS results
   for frequently-searched pairs (info-desk guide who already knows the
   route by heart).
4. "Hỏi cùng lúc hai đầu, gặp nhau giữa đường" — bidirectional BFS: search
   from both ends simultaneously, meet in the middle, halves the expanded
   search space.

SVGs:
- `bai-tap-social-graph-bfs-tung-vong.svg` (2137 B) — small graph: source
  node, level-1 ring (3 nodes), level-2 ring (2 nodes, one marked "Đích" in
  accent) showing round-by-round BFS expansion.
- `bai-tap-social-graph-bfs-hai-chieu.svg` (1767 B) — two-row comparison:
  large dashed circle (one-directional BFS search space) vs two small
  dashed circles meeting (bidirectional BFS), same visual language.

## 08-query-cache.mdx (4 RealLife, 2 Figure added)

1. "Ghi chú câu hỏi hay gặp" — overview: exam-prep FAQ notes = cache
   hit/miss for search queries.
2. "Xếp lại chồng ghi chú mỗi lần dùng" — LRU doubly-linked-list mechanism:
   move-to-front on hit, evict-from-tail when full, hash table for O(1)
   lookup.
3. "Rao vặt hết hạn nhưng chưa ai gỡ xuống" — stale bulletin-board listing
   vs TTL-based cache invalidation (deliberately different object from the
   pilot's milk-expiry/menu-board analogies).
4. "Chia ghi chú ra nhiều ngăn kéo theo vần" — filing-cabinet-by-letter vs
   `machine = hash(query)` sharding across the cache cluster.

SVGs:
- `bai-tap-query-cache-lru-danh-sach-lien-ket.svg` (2814 B) — 3-node
  doubly-linked list, head (accent, "mới nhất") to tail (danger, dashed,
  "bị xoá"), animated move-to-front arrow, hash-table box with dashed
  O(1)-lookup pointer.
- `bai-tap-query-cache-sharding-hash.svg` (2754 B) — Truy vấn → hash(query)
  → routes (solid accent arrow) to Máy 2, dashed neutral arrows to Máy 1/3
  showing the non-chosen paths.

## Design-move mapping (per task instructions)

- Category service / classification → 05-mint (phân loại học dần).
- MapReduce → 06-sales-rank (luồng MapReduce hai bước).
- Graph BFS → 07-social-graph (BFS từng vòng + bidirectional).
- Key-value cache → 08-query-cache (LRU linked list + sharding).
- Batch vs realtime trade-off appears explicitly in both 05-mint (kế toán
  cuối tháng) and 06-sales-rank (giờ mới xếp lại một lần).

## Verification

- All 16 `<RealLife>` blocks: single analogy each, end with "→ ...", ≤90
  words (measured via `awk` word-split on the paragraph line after the
  opening tag) — first draft had several blocks at 92–111 words, trimmed
  all down to 78–90 before finalizing.
- No pilot analogies reused (no tủ lạnh, quầy ngân hàng, tổng đài). Varied
  contexts: sổ thu chi, tiệm giặt ủi, chợ/vựa trái cây, hội chợ triển lãm,
  ghi chú ôn thi, rao vặt chung cư, tủ hồ sơ.
- Finance-specific rules N/A (kien-truc domain, not tai-chinh).
- 8 SVGs: `viewBox="0 0 360 {220|240|260|300|320}"` (within the two allowed
  heights per file, using 300/320 only for the taller multi-stage
  pipelines), `width="100%"`, unique `<title id="svg-...-title">` +
  `role="img"` + `aria-labelledby` (checked site-wide, 0 duplicates against
  existing 20 SVGs across kien-truc + tai-chinh), `stroke-width="2"` (2.5
  on ≤1 emphasized element per file), round cap/join, colors only via
  `var(--accent)` / `var(--ink-2)` / `var(--ink)` / `var(--danger)` /
  `var(--surface-2)` / `color-mix(in srgb, var(--accent) 12%, transparent)`
  — 0 hex (`grep -noE '#[0-9a-fA-F]{3,8}'` empty on all 8 files), real
  `<text>` for every label (no path-drawn text), ≤7 text labels per file,
  Vietnamese diacritics intact. Byte sizes: 4121/3772/3471/1640/2137/1767/
  2814/2754 — largest at 4.1KB (~27% of the 15KB budget).
- XML well-formedness: `python -c "import xml.dom.minidom; ...parse(...)"`
  OK on all 8 files (no XML lib in project deps, used system Python
  directly per environment).
- `pnpm verify:fidelity`: **OK — 27 kien-truc + 23 tai-chinh** match
  snapshots (ran twice, before and after the word-count trim pass; both
  green — RealLife/Figure-added subtrees strip cleanly regardless of
  wording changes inside them).
- `pnpm test`: **158/158 pass** (test count grew from 121 in batch-0's run
  to 158 here — other concurrent batches adding tests in the shared repo,
  not mine; not investigated, outside file ownership).
- Did **not** run `pnpm check` or `pnpm build` per explicit instruction
  (shared dist/.astro, controller builds centrally).
- `examplesReviewed: false` unchanged in all 4 frontmatters (grep-verified
  post-edit) — left for the independent fact-check agent.
- `git status` confirms only the 4 owned `.mdx` + 8 new SVGs touched; other
  untracked SVGs/lessons visible in status belong to concurrent batches,
  not read or modified.

## Deviation from initial draft

First pass of all 16 RealLife blocks measured 78–111 words; 9 blocks
exceeded the 90-word ceiling (up to 111). Trimmed all over-length blocks by
cutting redundant clauses/repeated nouns while preserving the single
analogy and the closing "→" sentence — re-verified word counts and re-ran
`verify:fidelity` + `pnpm test` after trimming, both still green.

## Unresolved questions

None. All decisions (analogy choice, SVG mechanism per lesson, placement
anchors) resolvable from the authoring guide + existing pilot pattern
without further user input.

Status: DONE
Summary: 4 lessons (mint/sales-rank/social-graph/query-cache) enriched with 16 RealLife blocks (4 each, ≤90 words, distinct VN contexts, no pilot-analogy reuse) + 8 new mechanism SVGs (2 each: async queue, categorization loop, MapReduce pipeline, read:write skew, BFS rounds, bidirectional BFS, LRU linked-list, hash sharding) — mapped to the requested design moves (categorization, MapReduce, graph BFS, key-value cache, batch-vs-realtime). verify:fidelity and pnpm test both pass; 0 hex colors, all SVGs <4.2KB and well-formed XML; examplesReviewed left false; only owned files touched.
Concerns/Blockers: none blocking. Did not run pnpm check/build per instruction — relying on verify:fidelity + vitest + manual XML/hex checks for owned-file correctness; full-app build correctness for these 4 files is the controller's centralized-build responsibility.
