# Editorial review — kien-truc/chu-de 01–05 (DNS, CDN, Load balancer, Reverse proxy, Application layer)

Date: 2026-09-29. Scope: original translated content + TranslatorNote (both in fidelity snapshot). Skipped `<RealLife>` and `<Figure added>`.
Compared against `D:\HardSkills\system-design-primer\README.md` lines 581–807.

## Method
- Sentence-by-sentence EN vs VI comparison of main text. No meaning errors, omissions or inverted sentences found.
- Internal links: every `/hoc/...` target exists in `dist/hoc/kien-truc/**`. Anchors `#cân-bằng-tải-tầng-4/7-...` and `database#kho-khóa---giá-trị-key-value-store` match built heading ids.
- Rendered-output scan of dist HTML (text only): no stray `**`, `](`, backslash escapes, raw `#`, raw table pipes. Table counts match source.
- All 42 external links checked with curl -L (browser UA), 2026-09-29.
- Facts in TranslatorNotes spot-checked (Dyn/Mirai 2016, Fastly 06/2021, Kafka 4.0 dropped ZooKeeper, Prime Video 2023, PostgreSQL max_connections=100, s-maxage, P2C in Envoy/NGINX): OK.

## Notes appended (ReviewNote)
| Lesson | Items |
|---|---|
| 01-dns | [Lỗi thời] "gần đây" = 2016 Dyn attack, Twitter → X; [Lỗi thời] dyn.com link 301 to blogs.oracle.com homepage → archive link |
| 02-cdn | [Lỗi thời] figure credit creative-artworks.eu HTTP 500 (whole domain) → archive link; [Lỗi thời] "CDN đòi hỏi phải đổi URL" not true when CDN fronts whole domain |
| 03-load-balancer | [Lỗi thời] SSL termination → TLS (RFC 7568/8996), re-encryption not mentioned; [Sai] "cache bền vững (Redis, Memcached)" — Memcached has no persistence (error in EN original); [Lỗi thời] 3 nginx.com links soft-dead (redirect to f5.com/products/nginx) → blog.nginx.org + f5.com/glossary; [Lỗi thời] ELB listener doc = Classic LB "previous generation" → add ALB listeners doc |
| 04-reverse-proxy | [Lỗi thời] NGINX architecture link soft-dead → blog.nginx.org; [Lỗi thời] TN mục 2: ingress-nginx retired 03/2026 (archived, no patches), still listed as "tiêu biểu 2026" |
| 05-application-layer | [Lỗi thời] smartbear footnote 404 → smartbear.com/learn/api-design/microservices/ |

## Deliberately not flagged
- CNAME at apex (DNS), SSL wording in reverse-proxy, CloudFront-only dynamic content (CDN), coreos.com etcd link: already covered by TranslatorNote.
- Redirects to equivalent pages (cloudflare.com/dns, consul.io → developer.hashicorp.com, coreos → etcd.io, puncsky → tianpan.co, cloudncode wordpress → .blog, technet → learn.microsoft.com, nginx reverse-proxy glossary → f5.com/glossary/reverse-proxy).
- 403/202 bot responses (superuser.com, figshare.com): pages exist.
- Style: "CloudFlare"/"Etcd" casing, hóa/hoá mixing.

## Verification
- `git diff -U0` on the 5 files: only `@@ -N,0 +N+1,k @@` hunks at EOF (append-only).
- `pnpm verify:fidelity`: OK — 27 kien-truc + 23 tai-chinh lessons match snapshots.
- Build/check not run (per instructions); ReviewNote bodies contain no `{`, `<` or backslashes.

## Unresolved questions
- Soft-dead redirects (nginx.com → generic F5 product page, dyn.com → Oracle blog homepage) reported as dead; task rule said "not redirects" — treated these as dead because target content is gone. Drop if lead disagrees.
