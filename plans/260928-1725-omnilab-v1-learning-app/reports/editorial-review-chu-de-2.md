# Editorial review: kien-truc/chu-de 06–10 (Database, Cache, Asynchronism, Communication, Security)

Date: 2026-09-29. Scope: original translated content + TranslatorNote (RealLife and `<Figure added>` excluded). Compared against `D:\HardSkills\system-design-primer\README.md`, checked against rendered `dist/` and live links.

## Result

| Lesson | Items | Types |
|---|---|---|
| 06-database | 6 | 1 Sai, 3 Lỗi thời, 2 Định dạng |
| 07-cache | 8 | 2 Sai, 2 Diễn đạt, 3 Lỗi thời, 1 Định dạng |
| 08-asynchronism | 1 | 1 Diễn đạt (TranslatorNote) |
| 09-communication | 4 | 2 Sai, 2 Định dạng |
| 10-security | 4 | 2 Định dạng, 2 Lỗi thời (TranslatorNote) |

Each file got one `<ReviewNote>` block appended after `</TranslatorNote>`. Diff is additions only (48 lines, 0 deletions). `pnpm verify:fidelity` OK. Standalone MDX compile (@mdx-js/mdx 3.1.1 + remark-gfm) OK for all 5 files. No build/check run, no commit.

## Main findings

- Translation fidelity is high. No wrong meaning, omissions or mistranslated terms vs the English text. Every "Sai" item comes from an error in the English original.
- Original errors the TranslatorNote does not cover:
  - Cassandra listed as keeping keys in lexicographic order. Murmur3 hashes partition keys, so only clustering keys are sorted.
  - Cache: LRU described as "invalidation", and the link points to replacement policies.
  - Write-through "cache is never stale" (overstated).
  - Write-behind says the application does the async DB write (it is the cache).
  - Cache key mismatch between the cache-aside and write-through code samples.
  - RPC server stub "unmarshals the results".
  - REST "all communication must be cacheable".
- Outdated:
  - Varnish Cache renamed Vinyl Cache (2026-03), old domain fails over HTTPS.
  - Azure Cache for Redis being retired.
  - KeyDB effectively unmaintained.
  - OWASP Top 10:2025 now current.
  - VN Decree 13/2023 replaced by Law 91/2025/QH15 plus Decree 356/2025 (from 2026-01-01).
  - Cassandra super column family no longer exists.
  - Graph DB "REST only" claim.
  - Doc links point to httpd 2.2 and MySQL 5.7.
- Dead links (404): qnimate Redis architecture, escotal OSI figure credit, restcookbook HATEOAS, OWASP old wiki. AWS ElastiCache Strategies soft-redirects to a generic page.
- Rendering: no stray escapes; the `\{` in the comparison table renders as `{`; all `/hoc/...` links and `#anchor`s resolve in `dist/`; no heading skips. The one issue is the h6 "Nguồn và đọc thêm: phi chuẩn hóa", nested under "Nhược điểm" (inherited from the original).
- No Vietnamese spelling or diacritic typos found in original text.

## Not reported (unverifiable or bot-blocked)

403/405 from bot protection, so not judged dead: stackoverflow, quora, medium, sitepoint, cyberciti, dev.mysql.com, infoq (figure credit), blog.x.com FlockDB, arstechnica civis thread, aiddroid, wildbunny (Cloudflare challenge; WebFetch saw 404, curl saw 403, so inconclusive). Redirect-only links (nginx→f5, protobuf→protobuf.dev, celeryproject→celeryq.dev, puncsky→tianpan.co, slideshare, code.facebook.com) were skipped per scope.

## Unresolved questions

- The brief listed TranslatorNote as in scope ("everything except RealLife/Figure added"). TN items are included and labelled "Ghi chú người dịch mục N". Drop them if TN was meant to be out of scope.
- The arstechnica `civis/viewtopic.php?t=1190508` link (Communication, further reading) may have broken in the 2022 forum migration. Not verifiable from here.

Status: DONE_WITH_CONCERNS
Summary: 23 verified review items appended as ReviewNote blocks across all 5 lessons, append-only; fidelity gate passes.
Concerns/Blockers: several bot-protected links could not be verified; TranslatorNote items included on the assumption that TN is in scope.
