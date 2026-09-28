---
title: "Fact-check: kien-truc/chu-de database, communication, security (RealLife + Figure added)"
date: 2026-09-28
status: completed
---

# Fact-check report — kien-truc/chu-de batch 2

Scope: `06-database.mdx` (8 RealLife, 3 Figure added), `09-communication.mdx` (5/3), `10-security.mdx` (4/2) + 8 SVGs `src/assets/illustrations/kien-truc/chu-de-{database,communication,security}-*.svg`.
Edits limited to RealLife bodies, added-Figure captions, the SVGs, and frontmatter `examplesReviewed: true`. No original text, code fence, legacy Figure touched (verified via `git diff -U0`).
Sources: none external. All claims checked against the lesson's own original text + translator note, plus standard protocol knowledge (RFC 9293 TCP handshake/sliding window; RFC 9110 method safety/idempotency).

## 06-database — PASS after fixes

| Block | Issue | Fix |
|---|---|---|
| Nhà xuất bản và các hiệu sách | OK on write path; missing replication lag + failover mechanism in the tie-back | Added lag ("hiệu sách còn bán bản cũ — độ trễ nhân bản"); tie-back now = read-only mode until slave promoted (matches original) |
| Sổ chung chỉnh sửa từ hai nơi | **Wrong**: "cho phép cả hai node cùng ghi để không ai chờ ai" contradicts original ("phối hợp với nhau khi ghi", "độ trễ ghi tăng lên do phải đồng bộ") | Rewritten: every write synced to the other side; one site down → other keeps read+write; concurrent edit to same cell → conflict rule needed |
| Phòng khám tách quầy | "users, orders, products" diverged from original's **forums, users, products** | Aligned to forums/users/products |
| Bưu cục phân loại theo khu vực | OK but did not distinguish from federation | Added "bưu cục nào cũng làm cùng một việc, chỉ khác khu vực"; "chia cùng một bảng theo một khóa" |
| Bảng thông báo | OK | Trimmed; tie-back adds write-heavy penalty (original bullet 3) |
| Mục lục sách giáo khoa | OK (read speed vs space + write cost) | Trimmed; added JOIN/ORDER BY per original |
| Tủ khóa phòng gym | Tie-back "Không biết đúng số tủ, bạn không tìm được gì cả" overclaims (original: keys may be lexicographically ordered → range scans) | Tie-back now: querying by value content is not KV's strength, pushed to app layer (original wording) |
| Biểu mẫu vs sổ tay | "linh hoạt" could imply no schema cost | Added limit "người đọc sổ phải hiểu mọi kiểu ghi cũ" (= translator note "schema lives in code") |

Figures:
- master-slave-vs-master-master: caption "tự phối hợp khi trùng thời điểm" implied coordination only on conflict → rewritten (master takes all writes and replicates to read-only slaves; master-master syncs writes and resolves conflicts on same-record edits). SVG label → "cả hai đọc + ghi, đồng bộ ghi hai chiều".
- federation-vs-sharding: DB boxes Users/Orders/Products → Forums/Users/Products; header → "Sharding (cùng bảng, chia theo khóa)"; shard labels "users A–M" (overflowed 122px box) → "Shard 1 (họ A–M)" / "Shard 2 (họ N–Z)" (matches original last-name example). Caption updated to match.
- sql-vs-nosql-schema: NoSQL header "NoSQL — tài liệu linh hoạt" overflowed viewBox (x≈196+200>360) → "NoSQL — linh hoạt"; "N trường" labels overlapped field lines and ran past x=360 → right-aligned at x=346, lines shortened. Caption now says "kho tài liệu NoSQL" (not all NoSQL families are document-shaped).

## 09-communication — PASS after fixes

| Block | Issue | Fix |
|---|---|---|
| Quầy một cửa | OK on request/response; did not use the idempotency column right above it | Tie-back now: resubmitting a cancel request leaves state "đã hủy" (DELETE idempotent); two "cấp mới" requests may create two records (POST not idempotent) |
| Thư bảo đảm | **Misleading**: "thư luôn tới đúng thứ tự" (TCP packets can arrive out of order; receiver reorders by sequence number) and "chờ xác nhận từng bước" (implies stop-and-wait; TCP pipelines within flow/congestion window) | Rewritten: envelopes may arrive shuffled, receiver sorts by number; explicit limit that TCP sends many segments in flight within flow + congestion control |
| Loa phát thanh phường | Analogy is broadcast, but most UDP is unicast; "livestream" is mostly HTTP/TCP in practice | Added limit sentence (broadcast vs unicast); examples → gọi video, game thời gian thực (listed in original) |
| Nhờ đồng nghiệp | "luôn chậm và kém tin cậy hơn" vs original "thường" | → "thường"; added "nên cần phân biệt rõ hai loại" (original) |
| Một địa chỉ | "khác biệt lớn nhất" is opinion | → "khác biệt dễ thấy nhất"; otherwise correct (same URI, verb varies; create excluded) |

Figures:
- tcp-handshake: correct (SYN →, SYN-ACK ←, ACK →, then data). No change.
- tcp-vs-udp-delivery: ACK arrow ended mid-line at x=200 instead of returning to Client → path now Server → Client. Both captions-in-SVG centered at x=255 overflowed viewBox (~+20px) → centered at 180; UDP label adds "sai thứ tự" to match caption.
- rpc-vs-rest: correct vs original comparison table. No change.

## 10-security — PASS after fixes (defensive only, no attack payloads)

| Block | Issue | Fix |
|---|---|---|
| Két sắt | **Overclaim**: "lớp bảo vệ cuối cùng khi mọi lớp phòng thủ khác đã bị vượt qua" — translator note: at-rest encryption only defeats physical media loss; anyone reading via DB/app sees plaintext | Added key-separation hint + limit sentence; tie-back "chống mất ổ đĩa, không thay được phân quyền" |
| Danh sách khách mời | Correct allowlist framing; risk of implying validation alone stops XSS | Added limit: valid string can still be dangerous on render → context-aware output encoding (translator note §1) |
| Ô trống biểu mẫu | Correct; missing known limit | Added: table/column names cannot be parameters → allowlist (translator note §1); "dữ liệu truyền riêng" |
| Chìa khóa riêng từng phòng | Correct | Trimmed; extended to all principals (DB account, service, container) per translator note |

Figures:
- ma-hoa-khi-truyen-vs-khi-luu: accurate. No change.
- truy-van-tham-so-hoa: user data shown as `"user_id = 1234"` (a SQL-like fragment, muddles the value-only point); arrow pointed at whole statement not the slot; label "— chỉ nhận giá trị, không nhận lệnh" ran to x≈430 (viewBox 360). Redrawn: fixed statement `SELECT * FROM users WHERE id = [?]`, value box `1234` with arrow into the `?` slot, two bottom lines. 7 labels, no payload.

## Guide compliance

- 17/17 RealLife end with "→ ...", one analogy each, diacritics checked, no curly quotes (code-point scan: 0 U+2018/2019/201C/201D in 3 MDX + 8 SVG).
- Length: syllable-token count incl. title 88–101 (was 90–109). Vietnamese syllable counting inflates vs English words; still marginally over the ~90 soft target on some blocks because limit sentences were required — accepted.
- SVG: hex grep `#[0-9a-fA-F]{3,8}` = 0 on all 8; all < 6KB; scratch XML checker OK (xmlns, viewBox, role, title/aria match).

## Verification

- `pnpm verify:fidelity`: OK — 27 kien-truc + 23 tai-chinh lessons match snapshots.
- `pnpm build` / `pnpm check`: not run (per instruction).
- Not visually inspected in a browser (light/dark); label widths estimated from ~0.55–0.6em avg glyph width.

## Unresolved questions

- None blocking. Visual light/dark check of the 5 edited SVGs recommended at next build.

Status: DONE
Summary: All 3 lessons fact-checked; fixed 1 wrong claim (master-master "không ai chờ ai"), 4 misleading ones (TCP ordering/stop-and-wait, UDP broadcast, at-rest "last line of defense", KV "không tìm được gì"), aligned federation example to original, fixed 5 SVGs (wrong ACK direction, 4 viewBox overflows, confusing param-query input); examplesReviewed set true.
Concerns/Blockers: SVG text widths estimated, not rendered.
