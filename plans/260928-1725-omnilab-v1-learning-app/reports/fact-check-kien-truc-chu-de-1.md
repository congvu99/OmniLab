---
title: "Fact-check: kien-truc/chu-de 01-05, 07, 08: RealLife + Figure added"
date: 2026-09-28
status: completed
---

# Fact-check report: kien-truc/chu-de (DNS, CDN, LB, reverse proxy, app layer, cache, asynchronism)

Scope: 26 `<RealLife>` blocks, 12 `<Figure added>` + their SVGs across 7 lessons. What I changed: RealLife bodies/titles, Figure `alt`/`caption`, the SVG files, and `examplesReviewed: true` in the frontmatter. Original lesson text is untouched (`pnpm verify:fidelity` passes).

## Verdict per lesson

| Lesson | Verdict | Blocks fixed |
|---|---|---|
| 01-dns | FIX, now pass | RL2 rewritten, RL3 limit added, Figure caption + SVG redrawn |
| 02-cdn | FIX, now pass | RL2 rewritten, RL3 purge claim fixed, push/pull caption + SVG |
| 03-load-balancer | FIX, now pass | RL1, RL2, RL3, RL4 rewritten/fixed; L4/L7 SVG |
| 04-reverse-proxy | FIX, now pass | RL1 rewritten, RL2 limit added, RL3 replaced |
| 05-application-layer | Minor fix, pass | RL3 health-check direction; caption + SVG label |
| 07-cache | FIX, now pass | RL1 tweak, RL2 (LRU), RL3 (TTL), RL4 rewritten; 2 SVG |
| 08-asynchronism | FIX, now pass | RL2 tweak, RL4 replaced; back-pressure SVG redrawn, flow SVG arrow |

## Issues found and fixes

### 01-dns
- **RL2 "Hỏi thăm địa chỉ qua từng cấp": wrong direction.** It said "hỏi bảo vệ khu phố → tổ trưởng → phường … DNS tra cứu qua từng cấp (root → TLD → authoritative) y hệt vậy". The analogy goes from the most local level up to higher levels. Real resolution goes the other way: from the top (root) down to more specific servers, and each level only refers you to the next one. The analogy also left out the recursive resolver, which the translator note points out as the role people most often confuse. Fix: a friend (the resolver) asks on your behalf: khu đô thị → toà C → số căn, with "mỗi nơi chỉ chỉ sang nơi cụ thể hơn" (referral). He keeps the answer in a notebook with an expiry (TTL cache). This also avoids "quận/phường" wording, since the district level was abolished in the 2025 administrative reform.
- **SVG `chu-de-dns-tra-cuu-phan-cap.svg`: wrong mechanism.** It drew arrows Root → TLD → Authoritative, which suggests the servers forward the query to each other. Resolution is iterative: the resolver itself queries each server in turn. Redrawn: three two-way dashed arrows from the Resolver to Root/TLD/Authoritative, numbered 1-2-3, with the label "trượt cache: resolver tự hỏi 1 → 2 → 3". Caption updated to match (resolver queries each level in turn, each level refers to the next, then the result is cached by TTL). The viewBox was 360×260, which the style guide does not allow, so it is now `0 -20 360 300`.
- **RL3 "Trạm cấp nước": overclaim.** "không ai tra ra được địa chỉ IP" is too strong. It contradicted the original's "nếu không biết IP" and ignored cached answers. Fix: added "chỉ nhà nào còn nước trong bồn mới dùng tạm được" / "trừ khi đã có sẵn trong cache", and made it "nhà cung cấp DNS mà chúng cùng dùng" (Dyn was one managed provider, not DNS as a whole).
- RL1 (danh bạ): pass.

### 02-cdn
- **RL2 push vs pull.** It reused the retail/warehouse setting from RL1 in the same lesson ("kho hàng gần nhà" vs "cửa hàng nhượng quyền nhập hàng từ kho tổng"), and it left out the trade-off the original stresses (push costs the most storage; pull re-fetches after TTL even when nothing changed). Rewritten as "Thư viện chi nhánh": push = the main library sends books ahead and the branch shelves must hold them all; pull = the branch borrows when the first reader asks (that reader waits), keeps the book until it is due back, then borrows again even though the book has not changed. The ending ties it back to storage, the slow first request and TTL.
- **RL3 poster: inaccurate.** "chủ động xóa (purge) từng điểm" suggests you purge each PoP by hand. Real CDN purge is a single API command that spreads to all edges. Fix: "chủ động ra lệnh xoá (purge) — tuỳ CDN, lệnh này có thể mất một lúc mới lan tới mọi điểm". Cloudflare's docs call its purge "Instant", so the wording is hedged by provider.
- **SVG push-vs-pull.** The pull row showed only the request direction. It now has two-way arrows and the label "miss đầu tiên: kéo từ gốc, cache theo TTL". Caption now ends "…cho tới khi hết TTL".
- RL1 + proximity SVG: pass.

### 03-load-balancer
- **RL1: overclaim.** "chọn máy chủ đang rảnh nhất" presents least-loaded as the only rule, while the original lists random, round robin and others. The ending ("ẩn số lượng và tình trạng thật…") did not match the paragraph above it. Fix: selection is "theo quy tắc đã cấu hình (vòng tròn, ít tải nhất...)", and the ending now ties back to preventing overload.
- **RL2 health check: false absolute.** "request không bao giờ bị gửi tới một máy chủ đã chết" is wrong: a server that dies between two checks still receives requests until enough checks fail. Added a limit sentence and changed the ending to "ngừng gửi… chứ không chặn được tức thì".
- **RL3 L4 vs L7.** It mixed two analogies ("biển số xe" and "thư"), used a near-duplicate of reverse-proxy RL1 (lễ tân dẫn tới "phòng Kế toán"), and "định tuyến chính xác hơn" is wrong: L7 routes by content, not "more accurately". Replaced with a single analogy, "Bưu cục chỉ đọc nhãn vs bưu cục mở kiện". L4 reads the label and forwards the whole parcel. L7 opens it, routes fragile items to the fragile-goods truck and important papers to an escorted truck (this mirrors the original's video/payment example), then repacks and sends it on (terminate + new connection).
- **RL4 scale out.** "Quán ăn" duplicated the restaurant setting used in the app-layer, async and cache lessons. It also skipped the stateless requirement that the text right below it covers. Replaced with shipper xe máy vs one big truck, plus the condition that orders live on a shared app and not in one shipper's head (stateless).
- **SVG L4/L7.** `stroke-width="4"` broke the style guide (only 2 or 2.5 allowed), so it is now 2.5. Also fixed the 260 viewBox and added the label "chỉ xem IP + cổng → chuyển nguyên kết nối".
- RL5 + health-check SVG: pass.

### 04-reverse-proxy
- **RL1 lễ tân: misleading mechanism.** "lễ tân sẽ gọi hoặc dẫn đúng người xuống" suggests the client meets the backend directly. A reverse proxy forwards the request and returns the response itself. Fix: the receptionist takes the file up, collects the result and hands it back. Also added "Kể cả toà nhà chỉ có một phòng làm việc, lễ tân vẫn có ích", which captures the original's point that separates a reverse proxy from an LB (useful even with one server).
- **RL2 SSL termination.** Added a limit sentence: after termination, internal traffic is usually plaintext, so the internal network has to be trusted.
- **RL3 SPOF: near-duplicate.** "Một cửa an ninh duy nhất của chung cư" was almost the same as LB RL5 "Một cổng bảo vệ duy nhất". Replaced with "Cây cầu duy nhất vào cù lao". A second bridge is the failover, and it ties back to the original's complexity cost.
- SVG: pass (flow and labels correct).

### 05-application-layer
- **RL3 service discovery.** "mỗi dịch vụ tự đăng ký… tình trạng còn sống (qua health check)" suggests the service reports its own health. The original says the health check usually goes through an HTTP endpoint that the registry polls. Fixed, and trimmed from 144 to 110 syllables.
- **SVG.** "Tầng web (cố định)" suggested the web tier cannot scale, so it is now "(giữ nguyên)". Caption now also says the reverse holds. Arrow stroke/marker color made consistent.
- RL1 (bếp/phục vụ), RL2 (food court): pass.

### 07-cache
- **RL2 LRU: wrong algorithm.** "bỏ bớt món để lâu nhất, ít đụng tới nhất" mixes FIFO (oldest) and LFU (least often used) with LRU. Fix: evict what has gone longest without being used, even if it was bought last week. Keep the pickle jar bought last month but eaten this morning. Added "LRU xét lần dùng gần nhất, không xét ngày mua hay tổng số lần dùng".
- **RL3 TTL: misleading.** "Trước hạn, bạn yên tâm dùng" suggests cached data stays fresh until the TTL runs out. That contradicts the drawback right above it: data can go stale in the cache. "cache phải nạp lại" was also wrong for cache-aside, where the application reloads the data. Fix: application reloads from the DB, plus a limit sentence. Ending: "TTL không ngăn dữ liệu cũ, chỉ giới hạn nó cũ tối đa bao lâu".
- **RL4 "Quán phở ghi order": 3 defects.** (a) It used two analogies in one block (phở + electronic price board). (b) The conclusion "Khác nhau ở chỗ ai ghi trước" is wrong: the real difference is who talks to the DB (the app in cache-aside; the cache, synchronously, in write-through). (c) It nearly duplicated the async lesson's "phiếu gọi món". Rewritten as one analogy: a grocery with the master price book in the storeroom (DB) and a small notebook at the counter (cache). The ending states the correct difference.
- RL1: added the "populate cache after miss" step, which the caption already described. RL5 (thực đơn): pass.
- **SVG cache-aside-vs-write-through.** The label "đọc/ghi DB trực tiếp khi miss" was wrong because writes are not "khi miss". It is now "đọc DB khi miss · ghi DB trực tiếp" and moved so it no longer overlaps the curve (the curve's lowest point was at y≈92, the label at y=98). The write-through app↔cache label said "ghi" on a two-way arrow; now "đọc/ghi". ViewBox fixed.
- **SVG ttl-eviction.** ViewBox fixed. Content correct (LRU = "lâu chưa dùng nhất"). hit-miss SVG: pass.

### 08-asynchronism
- **RL4 "Gọi cấp cứu 115": misleading.** An emergency call is actually handled asynchronously: the operator takes the call and the ambulance comes later. So as an example of "cannot be async" it points the wrong way. Replaced with "Xe bánh mì không cần phát phiếu số" (a cheap job with an instant handoff). It contrasts with RL1's "phiếu gọi món" and matches the original: "tính toán rẻ… thời gian thực… hàng đợi làm tăng độ trễ và độ phức tạp".
- **RL2 story.** It called the work "gửi thông báo", but the original's example is fan-out to followers' timelines. Now "đưa story tới bảng tin… đẩy vào hàng đợi, worker xử lý dần". Title shortened.
- **SVG back pressure: wrong flow.** There was no Client node. The arrow went queue → "HTTP 503" box, and the retry arrow came from the 503 box back into the queue. Redrawn: Client → "request mới" → full queue; queue → Client "HTTP 503: đang bận"; Client dashed retry "thử lại sau, giãn cách lũy thừa (backoff)". 8 labels.
- **SVG sync/async.** The return arrow ended below the Client box (78,180), so its endpoint is fixed to (80,166).
- RL1 (phiếu gọi món), RL3 (bãi giữ xe): pass.

## Variety across the 7 lessons
Near-duplicates removed:
- "lễ tân → phòng Kế toán" (LB RL3 and RP RL1)
- single-gate SPOF (LB RL5 and RP RL3)
- order slips (cache RL4 and async RL1)
- restaurant setting used in 4 lessons, cut to 2 (app-layer, async) plus the cache menu board
- warehouse repeated inside the CDN lesson

The fridge appears in 3 cache blocks (hit/miss, LRU, milk TTL). I kept that on purpose: it is one running analogy that the authoring guide itself names as the reference example. Each block covers a different mechanism.

## Guide compliance notes
- **Length:** measured in whitespace tokens (Vietnamese syllables/tiếng), title included. All 26 blocks are 86–116 syllables (the longest, CDN RL1 at 116, is the writer's original text and was left as is). That fits "≤ ~90 từ" if a từ ghép counts as one word, and the pilot blocks (batch 0) sit in the same range. The one real outlier (app-layer RL3, 144) was trimmed to 110.
- Every block ends with "→ …", has one analogy, and uses correct diacritics.
- **SVG:** 0 hex colors, 0 named colors. All have `<title>` and `role="img"`, with `aria-labelledby` resolving. Ids are unique across the site. All files are under 5KB, well-formed (stack-based tag and quote-parity check), and use viewBox 220/300 only. Four files had the non-standard 360×260 viewBox (DNS, L4/L7, cache-aside, ttl-eviction) and now use `0 -20 360 300`, which keeps the content and centres it.

## Verification
- `pnpm verify:fidelity`: OK (27 kien-truc + 23 tai-chinh).
- Hex grep on all 12 SVGs: 0 matches.
- `git diff`: only the 7 MDX files and 8 SVGs changed. MDX hunks are inside RealLife blocks, Figure captions, and the `examplesReviewed` line.
- Not run: `pnpm build`/`check` (per instructions, shared build dirs) and a visual light/dark check (no browser in this session).

## Sources
Fetched and confirmed in this session:
- AWS ALB health checks: a target is taken out of service only after `UnhealthyThresholdCount` consecutive failures (default 2 × 30s interval), which supports the LB RL2 limit sentence. https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html
- Consul: HTTP checks are run by the agent polling the endpoint; TTL checks (the service reports itself) also exist. This supports the app-layer RL3 wording. https://developer.hashicorp.com/consul/docs/services/usage/checks
- Cloudflare purge: one request, described as "Instant Purge". This led to the hedged CDN RL3 wording. https://developers.cloudflare.com/cache/how-to/purge-cache/

Standard references, not fetched this session (well-established behaviour, and it matches the lesson's own translator note):
- RFC 1034 §5.3 (stub → recursive resolver; resolver follows referrals from root down): https://www.rfc-editor.org/rfc/rfc1034
- LRU vs LFU/FIFO: https://en.wikipedia.org/wiki/Cache_replacement_policies

## Unresolved questions
- The guide says "≤ 90 từ" but does not say whether it counts tiếng or từ. I recommend the guide state "≈ 110 tiếng" so later batches measure the same way.
- I have not looked at the SVGs in a browser (light/dark). The layout was checked by coordinates only; the controller's build/visual pass should confirm.

Status: DONE_WITH_CONCERNS
Summary: 7 lessons reviewed. 17 of 26 RealLife blocks fixed or rewritten; 9 SVGs and 5 Figure captions fixed (wrong DNS resolution chain, wrong LRU definition, wrong cache-aside/write-through distinction, misleading TTL/health-check/115/lễ tân analogies, broken back-pressure flow, near-duplicates across lessons). examplesReviewed set true on all 7; verify:fidelity OK, 0 hex.
Concerns/Blockers: SVGs not visually checked in a browser (no build/dev server allowed); word-count convention in the guide is ambiguous (syllables vs words).
