---
title: "Fact-check: RealLife + SVG, kien-truc nen-tang (4) + danh-doi (5)"
date: 2026-09-28
status: completed
---

# Fact-check report: kien-truc nen-tang + danh-doi

Scope: 9 lessons, 32 `<RealLife>`, 15 `<Figure added>` + SVG. Reviewer acted as the independent approver (delegated by user). All 9 files now have `examplesReviewed: true`.

Edits were limited to `<RealLife>` bodies/titles, added-Figure `caption`, the 15 SVGs, and the `examplesReviewed` frontmatter line. `git diff` confirms that no other lines changed.

## Verify

- `pnpm verify:fidelity`: OK (27 kien-truc + 23 tai-chinh).
- Hex grep (`#[0-9a-fA-F]{3,8}`) on all 15 SVGs: 0.
- 15/15 SVGs parse as XML (python ElementTree); all have `role="img"` and a `<title>`; ids are unique site-wide; largest file 4.0KB.
- viewBox: all now `360x220` or `360x300`. Batch A and the pilot had used 180/200/230/240/260, which breaks the style guide.
- Word count: 32/32 blocks are ≤ 90 words, each has exactly one `→`, and the `→` sentence comes last.
- Rendered all SVGs through sharp into a contact sheet. The sheet used a monospace fallback font, so it shows the worst case. Labels that overflowed there were shortened.
- `pnpm build`/`check` not run (per instruction).

## Numbers recomputed (năm = 365,25 ngày)

- 99,9%: 8h45m57,6s/năm, 43m49,8s/tháng, 10m4,8s/tuần, 1m26,4s/ngày. Matches the lesson table.
- 99,99%: 52m35,8s/năm, 4m23s/tháng, 8,6s/ngày. These match. **Week is wrong in the ORIGINAL table: it says "1m 5s", the correct value is 1m 0,5s.** The error comes from the upstream primer and the table is fidelity-locked, so I did not fix it (see Unresolved).
- Series: 0,999² = 0,998001 → 99,8% ✓. Parallel: 1 − 0,001² = 99,9999% ✓. Each added nine shrinks the downtime budget exactly 10×.

## Per-lesson verdict

### nen-tang/01-clones: FIXED

- "Tủ gửi đồ dùng chung ở siêu thị": the mapping was wrong. The cashier counters (servers) never access the locker (session store), only the customer does, so it cannot illustrate "any server reads the session". It was also a near-duplicate of bai-tap/pastebin "Kho gửi đồ tách khỏi quầy lễ tân". Replaced with "Bệnh án nằm ở máy chung, không ở sổ tay y tá": nurses on shifts = servers, shared ward record = external session store.
- "Bản kẽm gốc": "ép ra" is wrong for a printing plate, and the block left out the original's "deploy code mới nhất" step. Reworded, and the tie-back now includes that step.
- Photocopy block: OK. SVG OK (viewBox 260 → 300 only).

### nen-tang/02-databases: FIXED

- "Thuê thêm kế toán mà sổ vẫn một cuốn": contradicts itself. It says "vẫn chỉ có một cuốn sổ" but ties back to sharding, which splits the data. It also left out replication, which the original lists first. Rewritten as "Cứu cuốn sổ cái ngày càng tốn kém": photocopies for reading = slaves, writes to the original = master, thicker book = RAM, split volumes = sharding. Each step costs more than the last.
- "Chia sổ theo từng quầy riêng": this describes federation/functional partitioning, not denormalization. Replaced with "Phiếu giao hàng chép sẵn địa chỉ khách": redundant copies so reads need no Join, and the cost moves to writes and application code.
- SVG: label "Tách theo đối tượng" was not denormalization → "Phi chuẩn hóa"; footers shortened; viewBox 240 → 220.

### nen-tang/03-caches: FIXED

- Query-cache block: the questions were about seat availability but the invalidation trigger was "giá vé đổi", which did not match. It also contained two extra inline "→". Now a sold-out train must be purged from several question-notes, including an aggregate one ("chuyến rẻ nhất tuần").
- Object-cache block: switched setting from spa to train, to keep the contrast with block 2 in one setting. "sửa" became "vứt bỏ", which matches the original's "vứt bỏ đối tượng".
- Session block: added the real reason (the session is read on almost every request, not just "short-lived"). "vé" → "phiếu".
- SVG: "xoá" → "xóa" (matches lesson spelling); removed "#1"; viewBox 230 → 220.

### nen-tang/04-asynchronism: FIXED

- Laundry block: near-duplicate of bai-tap/05-mint "Phiếu hẹn ở tiệm giặt ủi", and the tie-back cited "bước 2 và 3" when it actually showed steps 2 and 5. Replaced with "Gửi laptop đi bảo hành" (receipt = immediate reply, shelf = queue, technicians = workers, checking the receipt code = polling).
- Clinic block: "mỗi người gọi số riêng" implied separate queues, and it was a near-duplicate of pastebin "Bốc số thứ tự ở phòng khám". Replaced with "Nhân viên đóng gói đơn mùa sale": one shared pile of order slips, and a pile that still grows once arrivals outpace the packers.
- Canteen block: added a limit sentence (you can only precompute what is predictable, which leads into kiểu 2).
- Worker-pool caption/SVG: "hàng đợi phình (back pressure)" named the symptom as back pressure. Back pressure is the remedy (bound the queue, report busy when full), as the TranslatorNote says. Caption fixed. The SVG footers overflowed 360px and were shortened; a meaningless dashed line was removed; viewBox 200 → 220.
- Hai-kiểu SVG: label and footer shortened; viewBox 230 → 220.

### danh-doi/01-performance-vs-scalability: FIXED (minor)

- Block 1: "mở thêm quầy cũng vô ích" was too absolute (more counters do raise throughput). Now: it does not make each customer's checkout faster. "Đổi ca đông người" was unnatural and was reworded.
- Block 2: added the shared-bottleneck limit ("chung một máy quẹt thẻ"), which matches the TranslatorNote's "tỉ lệ thuận"/Amdahl point.
- SVG OK, unchanged.

### danh-doi/02-latency-vs-throughput: FIXED

- **Math error**: 4 cooks × (1 bowl / 5 min) = 48 bowls/hour, not "mỗi phút một tô, 60 tô/giờ". Changed to 5 cooks, and added "thêm đầu bếp thì tô/giờ tăng, tô của bạn vẫn 5 phút", which shows the two metrics are independent.
- Block 1: "không quan tâm quán đang phục vụ bao nhiêu bàn" suggested latency does not depend on load (queueing says it does). Reworded to "con số đo cho một tô, chưa nói gì về cả quán".
- Block 3: "khách không phân biệt được 10 phút với 3 phút" is false. "Thuê thêm đầu bếp để ép xuống 3 phút" is also wrong: more cooks raise throughput, they do not cut the cook time. Rewritten as batch-blanching vs single-bowl, which ties to the batching figure and the TranslatorNote's SLO framing.
- Gom-lô SVG: **the arrows pointed into empty space and never reached the DB**. Redrawn as App→DB with 3 separate trips vs 1 batched trip. Pipe SVG: top text overflowed, shortened; viewBox 180 → 220.

### danh-doi/03-cap-theorem (pilot): FIXED

- Block 1: the title said "tổng đài" but the body said "chi nhánh", so the title is now "Hai chi nhánh ngân hàng mất kết nối". The limit sentence came after the "→"; it is restructured so the "→" comes last and the block fits ≤ 90 words (it was 94).
- ATM block: duplicated block 1 (bank withdrawal, CP branch). Replaced with "Quầy bán vé tàu Tết mất kết nối", which ties to the original's atomic read/write and the "đặt vé số lượng có hạn" row.
- Likes block: **it described optimistic client-side UI, not CAP**. CAP-AP is about server nodes answering with possibly stale data during a partition. Rewritten as two datacenters (HN/HCM) that show different counts, then merge after the link heals, which matches the original's "ghi lan truyền khi phân mảnh được khắc phục".
- Ví điện tử block OK.
- CP/AP SVG: the right-column bullet "Giỏ hàng, feed mạng xã hội" overflowed the viewBox; now "Giỏ hàng, bảng tin", with bullets at font 12. Partition SVG: viewBox 260 → 300.

### danh-doi/04-consistency-patterns: FIXED

- Weak block: it framed weak consistency as durability loss. Added the read-side behaviour (two viewers see different counts; a later read may never see the write).
- Eventual block: near-duplicate of chu-de/08 "Đăng story thấy ngay...". It also said "vài giây" where the original says "thường vài mili-giây". Replaced with "Báo địa chỉ mới sau khi chuyển nhà" (DNS/email-like propagation), with an explicit note that the real window is usually milliseconds.
- Strong block: bank transfer appeared 3× across CAP and consistency, and "đợi đồng bộ" was asserted but never shown. Replaced with "Hai sổ học phí phải ghi xong cùng lúc", which is literally synchronous replication and matches the figure.
- Ba-mức SVG: the right labels and the footer overflowed 360px; relaid out; viewBox 230 → 220. Đồng bộ SVG: footer overflowed and was split/shortened; viewBox 240 → 220.

### danh-doi/05-availability-patterns: FIXED

- Active-passive block: "người đứng quầy báo ốm" is the opposite of the mechanism. In a heartbeat setup the failed node cannot report; the passive node detects the missing heartbeat. Rewritten with periodic "vẫn ổn" messages, takeover on silence, and hot vs cold standby from the original.
- Active-active block: 3rd cashier analogy across these lessons. Now "Hai cửa soát vé cùng mở ở rạp phim", with a capacity-headroom limit (each side must be able to absorb the other's load).
- "Số 9" block: the title (nghỉ ốm) did not match the body (trễ chuyến), and it said "8 giờ" and "gần 10 lần". Now a 24/7 pharmacy: "gần 8 giờ 46 phút" / "chưa tới 53 phút", and "đúng 10 lần".
- Series block: added concrete math (0,99³ ≈ 97%).
- Parallel block: added the independent-failure limit (one flood blocks both roads = shared failure point).
- Số-9 SVG + caption: exact values 8 giờ 45 phút 57 giây / 52 phút 36 giây, "đúng 10 lần"; viewBox 180 → 220.
- Nối tiếp/song song SVG: **the parallel fork was miswired** (the paths started at y=157 while the junction dot sat at 179, and there was no merge). Redrawn with input → fork → Foo/Bar → merge → 99,9999%. Formula shown as "≈ 99,8%". viewBox 240 → 220.
- Failover SVG OK; viewBox 240 → 300 only.

## Variety summary

Near-duplicates removed: laundry (vs mint), clinic queue (vs pastebin), shared locker (vs pastebin), social feed (vs chu-de/08), bank ×3 (CAP/consistency), cashier ×3 (perf/availability). Some settings still recur across modules (phở, lễ tân, sổ), but each is used for a different mechanism, so I kept them.

## Sources

None external. Every claim was checked against the lesson text, the TranslatorNotes and first-principles arithmetic (node script).

## Unresolved questions

- The original 99,99% weekly downtime "1m 5s" is wrong (the correct value is 1m 0,5s, an error inherited from the upstream primer). It is fidelity-locked. Does the user want a TranslatorNote erratum? That is outside this task's editable scope.
- The rest of kien-truc (chu-de, bai-tap) has SVGs with non-standard viewBoxes too (e.g. `chu-de-cache-cache-aside-vs-write-through.svg` is 260). These are not owned here and not fixed.
- The SVGs were checked visually only with a fallback font and light tokens. The dark theme and real Be Vietnam Pro metrics were not viewed in a browser.

Status: DONE_WITH_CONCERNS
