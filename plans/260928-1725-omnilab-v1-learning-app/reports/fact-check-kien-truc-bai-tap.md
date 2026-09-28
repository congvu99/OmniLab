---
title: "Fact-check + quality review: kien-truc/bai-tap RealLife examples and SVGs (8 lessons)"
date: 2026-09-28
reviewer: independent fact-check agent (user-delegated approval)
status: completed
---

# Fact-check: kien-truc/bai-tap 01-08

Scope: 35 `<RealLife>` blocks, 16 `<Figure added>` (alt/caption) and 16 SVGs
`src/assets/illustrations/kien-truc/bai-tap-*.svg`. Only RealLife bodies/titles,
added-Figure alt/caption, the SVGs and the `examplesReviewed` frontmatter were edited.
The original text, code fences and legacy Figures were not touched (fidelity OK).

Verdict: all 8 lessons PASS after fixes → `examplesReviewed: true` on all 8.

## Recomputed numbers (checked against the original text)

| Lesson | Original | Recomputed | Used in example/SVG |
|---|---|---|---|
| pastebin | 10M writes/month, 1.27 KB | 10M ÷ 2.5M s = 4 writes/s; ×10 = 40 reads/s; 1.27 KB × 10M = 12.7 GB/month; ×36 = 457 ≈ 450 GB; 62^7 = 3,521,614,606,208 ≈ 3.5×10^12 | SVG estimate (2 branches), sim block |
| scaling-aws | 1B writes, 100B reads/month | 400 writes/s, 40,000 reads/s, 1 TB/month, 36 TB/3 years | (no numbers quoted) |
| twitter | 250B reads, 15B tweets, 150B fan-out/month | ×(400/s per 1B) → 100k reads/s, 6,000 tweets/s, 60k fan-out/s; 10 KB × 500M × 30 = 150 TB/month | conversion-factor block |
| web-crawler | 4B pages/month, 500 KB | 2 PB/month, 72 PB/3 years; 1,600 writes/s | estimate block; 500 × 20 kg = 10 t (analogy) ✓ |
| mint | 5B tx/month, 500M reads | 2,000 tx/s, 200 reads/s, 250 GB/month | (no numbers quoted) |
| sales-rank | 1B tx, 100B reads/month | 400 tx/s, 40,000 reads/s, ratio 100:1 | xổ số block, read/write SVG |
| social-graph | 50 friends/user, 1B searches | 400 req/s; one-way BFS depth 4: 50^4 = 6.25M nodes; two-way: 2 × 50^2 = 5,000 | two-way BFS block + SVG labels |
| query-cache | 10B queries | 4,000 req/s; mod 10→11: only 10/110 ≈ 9% of keys stay | sharding block ("gần như mọi đơn phải dời kệ") |

## Per-lesson results

### 01-pastebin: PASS after fixes
- **SVG estimate, wrong mechanism.** The chain was "10M paste → × 1.27 KB = 12.7 GB/month → ÷ 2.5M s → ≈ 4 writes/s". 12.7 GB ÷ 2.5M s is ~5 KB/s, not 4 writes/s. The caption repeated the error ("Nhân ... với kích thước trung bình, rồi chia cho số giây ... ra con số 4 lượt ghi/giây"). Redrawn as 2 branches (storage: 12.7 GB/month → ~450 GB/3 years; load: 4 writes/s → ×10 = 40 reads/s). Caption and alt rewritten.
- **SVG shortlink, wrong input.** It showed "Nội dung paste" → MD5. The original hashes `ip_address + timestamp` (or random data). Hashing the content is deterministic, so "sinh lại" would return the same code. Changed to "ip + timestamp", added the "Lấy 7 ký tự đầu" step, and the retry loop now goes back to the input. Moved the "có" label, which sat on the curve. Caption and alt fixed.
- "Bốc số thứ tự ở phòng khám": queue numbers are sequential and never collide, so this is the wrong analogy for hash-and-check. Replaced with "Chọn số sim còn trống" (pick a number, check it is free, retry), plus 62^7 ≈ 3.5 nghìn tỷ and "hiếm trùng nhưng không phải không bao giờ".
- "Kho gửi đồ tách khỏi quầy lễ tân" was almost the same as block 1 (vé gửi xe, a claim ticket). Its ending "phình to độc lập" was also reused in scaling-aws. Replaced with "Sổ hợp đồng và tủ ổ cứng ở studio ảnh cưới" (metadata row vs blob store).
- Estimate block: added the actual numbers (4 writes/s, 40 reads/s). Cache block: a miss goes to SQL Read Replicas + Object Store (original), not just "DB". Trimmed to ≤ 90 words.

### 02-scaling-aws: PASS after fixes
- "Nồi phở": "đổi máy mạnh hơn là bước rẻ và nhanh nhất" contradicts the original ("Mở rộng theo chiều dọc có thể trở nên rất đắt", "Không có dự phòng"). Rewritten: simplest step, but cost climbs fast, has a ceiling, and no redundancy.
- Autoscaling block: added the missing limit from the original ("Có thể mất một khoảng thời gian trước khi hệ thống tăng quy mô": new instances need time to start). Caption now mentions the min-instance floor and "giờ hành chính của người dùng" (the original means US hours).
- "Photocopy nhận đơn ... phiếu hẹn" was a near-duplicate of mint's "Phiếu hẹn ở tiệm giặt ủi" (same appointment-slip analogy for a queue). Replaced with "Thùng chờ phân loại ở bưu cục" (decoupling plus scaling workers separately), and it now follows the original thumbnail steps.
- SVG journey stopped at Users++++ although the lesson goes to Users+++++. Redrawn with 6 stages and alternating labels. Caption and alt updated.
- Sổ nợ tạp hoá block: removed the "phình to độc lập" ending that repeated pastebin, trimmed.

### 03-twitter: PASS after fixes
- Estimate block had the same mechanical error: "từ 500 triệu tweet/ngày, nhân kích thước trung bình, chia cho số giây mỗi tháng, ra ngay số tweet mỗi giây". Size × count gives storage (150 TB/month), not tweets/s. It was also a near-duplicate of pastebin's "nhẩm để thuê thêm người" and was 109 words. Replaced with a conversion-factor analogy ("Hệ số nhẩm của tài xế xe khách", 300 km ÷ 50 km/h = 6 h) tied to the original's 400/s per 1B/month: 250B → 100k/s, 15B → 6,000/s.
- "Nhóm chat lớp": a group chat stores one message per group, and the analogy mixed up push notifications (a separate Notification Service in the original) with timeline fan-out. Replaced with "Thông báo nhét sẵn vào khe cửa từng phòng" (write N copies up front, O(1) read), plus the original's "1.000 follower = 1.000 lần ghi".
- "Người bán livestream": order fulfilment is per-buyer work, not fan-out of the same content, and the pull/hybrid fix had no counterpart in the analogy. Replaced with "Ca sĩ đăng lịch diễn lên trang chính thức" (pull for celebrities, push for normal users, merge at serve time, as in the original).
- "Mục lục cuối sách": in Vietnamese "mục lục" means table of contents, a forward index, which is the opposite of an inverted index. Renamed to "Bảng tra cứu thuật ngữ", showing a posting list (trang 42, 57, 103).
- User vs home timeline: added the limit that each user has their own "board", prebuilt in Memory Cache (a shared apartment board would mislead).
- SVG push vs pull: the two rows were not labelled with their strategy, and the same N was used for followers and followees. Redrawn with headers "Fan-out on write (push)" / "Fan-out on read (pull)", O(N) vs O(M). Caption fixed.

### 04-web-crawler: PASS after fixes
- Crawl-loop block and SVG said "bỏ qua" on a similar signature. The original says "giảm độ ưu tiên của liên kết trang này" (`reduce_priority_link_to_crawl`). Fixed the text, caption and SVG (new "Giảm ưu tiên" box). The old "có" label overlapped the loop curve.
- "Vân tay giấy tờ / công chứng viên" compared fixed features (số trang, con dấu), which is exact matching and does not show near-duplicate detection. Replaced with a clause-overlap comparison (Jaccard, per the original), plus the limit that an ordinary hash changes completely when one character changes.
- Fingerprint SVG caption: labelled as illustrative SimHash (8 of 64 bits, Hamming distance under a threshold). The label now says "khác 1 bit".
- robots.txt: the analogy was about time windows (8h-17h) while the tie-in was about paths. Replaced with a "khu vực nội bộ" sign. Added the limit that robots.txt is advisory and cannot block rogue crawlers, and kept the original "kiểm soát tần suất" as "gợi ý tần suất".
- Estimate block: added 2 PB/month and 72 PB/3 years. Recrawl block now matches the original: default weekly, faster for popular or frequently changing pages, based on mined change intervals. Both trimmed.

### 05-mint: PASS after fixes
- Overview: "ba use case: trích xuất, phân loại, đề xuất ngân sách" left out connecting an account (a top-level use case in the original) and treated categorisation, a sub-item of extraction, as its own use case. Fixed.
- Category block: "Một quán ăn gia đình" was incoherent with the household framing. Real chain brand names (Bách Hoá Xanh, Điện máy Xanh) replaced with fictional sellers. Added the limit that the override votes come from many users, not one family.
- Batch block: "cuối tháng" implied budget alerts only at month end. Changed to a daily batch that adds into the monthly total, and added the original's point that it cuts DB load.
- SVG queue: the "phản hồi ngay" label sat on the response curve. The worker is now labelled "Worker trích xuất giao dịch" and the caption follows the original's Transaction Extraction flow.
- SVG categorisation: the viewBox was 360×320 (the guide allows only 220/300), and the "trúng"/"chưa có" labels overlapped the curves. The loop crossed the left box. Relaid out at 360×300 and relabelled ("có sẵn", "Người dùng tự ghi đè").

### 06-sales-rank: PASS after fixes
- "Kệ hàng bán chạy bày sẵn đầu chợ" was a near-duplicate of pastebin's "Hàng bán chạy để sẵn ngoài kệ" (same analogy for a cache). It also said "cache gần như luôn trúng", which goes further than the original's cache-miss concern. Replaced with "Tờ kết quả xổ số dán trước sạp" (changes rarely, read constantly), ending "tỉ lệ cache hit rất cao".
- "Cân đo rồi mới xếp giá" was the third fruit-market analogy in one lesson, and "giá" is ambiguous (shelf or price). Replaced with a two-step apartment-board vote count. Sort direction is left unstated because the original sorts ascending (translator note flags it).
- MapReduce SVG: "Map: gộp theo (danh mục, SP)" was wrong, since the mapper emits and filters to the past week while grouping happens in shuffle. Now "Map: lọc tuần qua, phát (danh mục, SP)". Step 2 label changed to "Sắp xếp theo (danh mục, SL)", matching `mapper_sort`. Caption rewritten.
- Read/write SVG: the "Tỉ lệ ..." heading overlapped the "Đọc" label and the top of the bar. Bars were 150 vs 17 px (about 9:1) presented as 100:1. Relaid out with a "cột không theo tỉ lệ" note. The caption "thay vì mở rộng SQL" contradicted the original, which says SQL scaling may still be needed for cache misses. Fixed.

### 07-social-graph: PASS after fixes
- Two-way BFS SVG: the one-way circle was centred on the midpoint instead of the source. The two small circles (r=28, 104 px apart) did not touch, so they never "gặp nhau". The bottom circles were clipped (y 268 > viewBox 260), the viewBox was non-standard, and there were no source/destination labels. Redrawn at 300 px with a source-centred circle of radius d, two touching d/2 circles, and "≈ b^d" vs "≈ 2 × b^(d/2)" node labels. Caption adds the b=50, d=4 intuition and notes the gap is exponential, not areal.
- Two-way BFS block: added the numbers (5,000 vs 6.25M) and changed the ending from "mỗi phía một nửa quãng đường" to "giảm theo cấp số mũ, không chỉ một nửa".
- BFS-cache block: added the invalidation limit (kết bạn/hủy kết bạn làm đường cache lỗi thời). Removed the awkward "cặp người dùng có nhiều lượt tìm kiếm chung".
- BFS-levels SVG: viewBox changed from 260 to 220 (content fits, max y 214). The BFS blocks were correct: queue not stack, level order, shortest path in an unweighted graph.

### 08-query-cache: PASS after fixes
- Sharding block, **misleading**: "tủ hồ sơ theo vần chữ cái ... Nguyễn luôn ở ngăn N" describes range partitioning, not hashing. "Nguyễn" is exactly the hot-shard case hashing avoids. Replaced with a warehouse split by the last digit of a near-random order id (hash-like, even spread), contrasted with splitting by surname. Added the original's consistent-hashing pointer: changing mod 10 to mod 11 moves about 91% of keys. The sharding caption got the same note.
- LRU block: the notes were the third "ghi chú" object in the same lesson. Replaced with a 5-slot shoe rack, plus the limit that a linked list does not shift the whole row, only relinks pointers, so get/set are O(1).
- LRU SVG: `M90 60 H150 M210 60 H270` with only marker-end drew one arrowhead on one segment, so the doubly-linked list had no backward links. The move-to-front arrow came out of the "bị xoá" tail node (contradictory), the label overlapped the curve, and the viewBox was 240. Redrawn: bidirectional links, move-to-front from the middle node, tail labelled "loại khi đầy", hash table "query → node, O(1)", 220 px. Caption adds O(1) for both parts.
- Rao vặt block: moved from "bảng tin chung cư", which twitter uses. Added deletion and page-rank change, the original's three update triggers.
- FAQ block: added "giải xong chép thêm vào tờ", matching cache-aside fill after a miss (original: "Cập nhật Memory Cache với nội dung vừa lấy").

## Variety: duplicates found across lessons, then resolved

| Duplicate | Kept | Rewritten |
|---|---|---|
| Best-sellers on the front shelf = cache | pastebin | sales-rank (xổ số) |
| Appointment slip = async queue | mint (giặt ủi) | scaling-aws (bưu cục) |
| Mental arithmetic to decide hiring = estimate | pastebin | twitter (hệ số quy đổi) |
| Claim ticket / storeroom slip | pastebin #1 (vé xe) | pastebin #4 (studio ảnh) |
| "tách ... phình to độc lập" ending | — | pastebin #4, scaling #2 |
| Apartment bulletin board | twitter | query-cache rao vặt (cột điện) |
| 3× fruit/market in sales-rank | block 1 | blocks 3, 4 |
| 3× "ghi chú" in query-cache | block 1 | blocks 2, 4 |

## Guide compliance after fixes

- 35/35 blocks have one analogy and end with "→ ...". Word count (tokens containing a letter or digit): max 90. The batch-D blocks were 92-109 before trimming.
- JSX attributes use straight ASCII quotes, with 0 curly quotes inside `<RealLife>`/`<Figure>` tags. No quotes inside `title=`.
- 16/16 SVGs: hex grep `#[0-9a-fA-F]{3,8}` = 0, no named colours. viewBox is only 360×220 (11) or 360×300 (5). All have `<title>` + `role="img"` + `aria-labelledby` and parse as XML (minidom). Max 8 `<text>`, max 4.1 KB. No duplicate `id` across `src/assets/illustrations/`. At most one element per file uses 2.5 stroke.

## Verification

- `pnpm verify:fidelity` (full suite): **OK — 27 kien-truc + 23 tai-chinh** (ran after all edits).
- Frontmatter diff: only `examplesReviewed: false → true` (8 files).
- `pnpm build`/`check` were not run, as instructed. SVGs were not viewed in a browser (light/dark).

## Unresolved questions

- The 90-word rule: counting is ambiguous for Vietnamese syllables and symbol tokens (→, —, ×). I used "tokens containing a letter or digit ≤ 90". Raw whitespace tokens are still ≤ 93. Should the guide pin a counting method?
- The 8-bit SimHash illustration goes beyond the lesson text, which mentions only Jaccard/cosine; SimHash comes from the translator note. I kept it, labelled as illustrative.

Status: DONE_WITH_CONCERNS
Summary: All 8 kien-truc/bai-tap lessons fact-checked and fixed in place (29 of 35 RealLife blocks rewritten or trimmed, 13 SVGs corrected, captions and alts fixed); fidelity OK; `examplesReviewed: true` set on all 8.
Concerns/Blockers: SVGs were checked by coordinate math and XML parse, not viewed in a browser in light/dark; the word-count method is not specified by the guide.
