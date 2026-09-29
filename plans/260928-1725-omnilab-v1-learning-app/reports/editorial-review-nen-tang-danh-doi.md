# Editorial review: kien-truc / nen-tang + danh-doi (original content)

Date: 2026-09-29. Scope: 9 lessons, only original content (the body plus `<TranslatorNote>`, both part of the source snapshot). Skipped `<RealLife>` and `<Figure added>`.
Method: compared each lesson against the English originals (README sections; the 4 lecloud posts fetched from web.archive.org). Re-computed every number. Did an HTTP check of all external links. Checked `/hoc/...` routes against file names and GitHub anchors against README headings. Scanned the existing `dist/` build for stray escapes. Scanned for repeated words.
Change: appended one `<ReviewNote>` at the end of 8 files (additions only, 55 lines, 0 lines removed). `pnpm verify:fidelity` passes (27 + 23 OK).

## Summary per lesson

| Lesson | Sai | Lỗi thời | Định dạng | Diễn đạt | Total |
|---|---|---|---|---|---|
| nen-tang/01-clones | 0 | 0 | 0 | 1 | 1 |
| nen-tang/02-databases | 0 | 1 | 0 | 1 | 2 |
| nen-tang/03-caches | 0 | 1 | 0 | 0 | 1 |
| nen-tang/04-asynchronism | 0 | 0 | 0 | 2 | 2 |
| danh-doi/01-performance-vs-scalability | 1 | 0 | 0 | 0 | 1 |
| danh-doi/02-latency-vs-throughput | 1 | 0 | 0 | 0 | 1 |
| danh-doi/03-cap-theorem | 1 | 0 | 0 | 2 | 3 |
| danh-doi/04-consistency-patterns | 0 | 0 | 0 | 0 | 0 (no block) |
| danh-doi/05-availability-patterns | 1 | 0 | 0 | 3 | 4 |
| **Total** | 4 | 2 | 0 | 9 | 15 |

## Notes

### nen-tang/01-clones
- [Diễn đạt] "phân phối tải ... một cách đều đặn": the original says "evenly". "Đều đặn" means regular in time. Suggest "đồng đều".

### nen-tang/02-databases
- [Lỗi thời] TranslatorNote table says MongoDB means "mất transaction và mất tính nhất quán mạnh". MongoDB has had multi-document transactions since 4.0 and cross-shard transactions since 4.2, and the default write concern is now `w: majority`.
- [Diễn đạt] "distributed SQL (CockroachDB, TiDB, Vitess, Aurora)": Vitess is a sharding layer for MySQL, and Aurora (standard) has a single writer. Neither is distributed SQL.

### nen-tang/03-caches
- [Lỗi thời] "Redis và Memcached vẫn là hai lựa chọn mặc định": the licence changed in 2024 (RSALv2/SSPLv1, AGPLv3 added in Redis 8) and the Valkey fork appeared. Suggest mentioning Valkey.

### nen-tang/04-asynchronism
- [Diễn đạt] "ta cần làm mọi thứ bất đồng bộ": "mọi thứ" is not in the original and overstates the point.
- [Diễn đạt] TranslatorNote item 5 says "Phần 3 kết thúc bằng hình ảnh đội quân worker". That image is in the middle of Part 3, not at the end.

### danh-doi/01-performance-vs-scalability
- [Sai] TranslatorNote item 2 attributes "chi phí vận hành, độ phức tạp quản trị" to Vogels. His article does not say this. What it actually adds is redundancy without performance loss, and heterogeneity (verified against the full article text).

### danh-doi/02-latency-vs-throughput
- [Sai] "10 TB / 2 giờ vượt xa mọi đường truyền internet": that works out to about 11 Gbps, which is below backbone/DC links (100-400 Gbps).

### danh-doi/03-cap-theorem
- [Sai] "Khả tuần tự hóa nguyên tử (linearizability)": "khả tuần tự" is the Vietnamese term for serializability. Suggest "tính khả tuyến tính / nhất quán nguyên tử".
- [Diễn đạt] "Khả năng chịu phân mảnh": the rest of the course uses "phân mảnh" for sharding. Suggest "chịu chia cắt mạng / phân vùng mạng".
- [Diễn đạt] The PACELC table lists MongoDB as PC/EC. Abadi and Wikipedia classify it as PA/EC, and it is only close to PC with majority write/read concerns.

### danh-doi/04-consistency-patterns
- No issues found. The translation matches the README, the snarfed link is alive (redirects to /s/), and the internal links exist.

### danh-doi/05-availability-patterns
- [Sai] 99.99%/week "1m 5s" should be "1m 0,5s" (60.48 s). I re-computed the whole table: the other 7 cells are correct (year = 365.2425 d, month = year/12).
- [Diễn đạt] "Con số này vượt quá thời gian một người trực kịp nhận cảnh báo": the meaning is inverted. 5 m 15 s a year is *shorter* than an on-call response.
- [Diễn đạt] The table says failover takes "vài giây tới vài phút (hot/cold)", but item 4 says "cold standby vài chục phút". The two disagree.
- [Diễn đạt] The note puts split-brain only under active-active. The classic split-brain is heartbeat-based active-passive (the mechanism the original itself describes).

## Checks with no finding
- External links (13): all alive. Cadence returns a Cloudflare 403 to curl, but Wayback CDX shows 200 as recently as 2026-02. ksat.me serves real content. The YouTube video exists (oembed OK). Redirects only: slideshare, snarfed.
- Internal `/hoc/...` links (9 distinct): all resolve to existing lesson files.
- GitHub README anchors (28 distinct): all match README headings.
- Rendered HTML in the existing dist (not rebuilt): no stray `\{`, `\<`. `R + W \> N` renders as `R + W > N`.
- Other numbers checked and correct: 0.999² ≈ 99.8%; 1-(0.001)² = 99.9999%; 0.999^10 ≈ 99.0% ≈ 87 h/year; five 9s = 5 m 15.6 s/year; 1-0.99^10 ≈ 9.6% ≈ 10%; Amdahl 5% serial gives a 20x ceiling; cache 95% hit then fails means 20x DB load; DynamoDB strong read = 2x RCU.
- Vietnamese spelling: no typos found. The only repeated-word hits ("song song", "máy chủ chủ động") are legitimate.

## Unresolved questions
- The README anchors in the body text (e.g. 05 "mục Cơ sở dữ liệu", 02 "Mục tiếp theo, CAP theorem") link to GitHub even though internal lessons now exist. I left these unflagged because the migration script (`resolveSourceUrl`) does this by design. Should in-body cross-references be remapped to `/hoc/...` routes?
- The Redis/Valkey note is a licensing/ecosystem update, not an error. Keep it or drop it, depending on how strict the editorial policy is on "Lỗi thời".
