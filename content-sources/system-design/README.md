# Tài liệu học System Design (tiếng Việt)

Bản dịch và ghi chú cá nhân cho [The System Design Primer](../README.md).

## Quy ước

- Tên file: `NN-ten-mo-ta.md`, kebab-case, có số thứ tự để giữ đúng thứ tự học.
- Mỗi file dịch có phần đầu (frontmatter) ghi: nguồn, tác giả, ngày gốc, link gốc, ngày dịch, trạng thái.
- Thuật ngữ tiếng Anh giữ nguyên trong ngoặc ở lần xuất hiện đầu tiên, ví dụ: bộ cân bằng tải (load balancer).
- Ghi chú riêng của người dịch đặt cuối file, dưới tiêu đề "Ghi chú của người dịch", không trộn vào nội dung gốc.
- Ảnh dùng chung để trong `_assets/`.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `00-nen-tang/` | Bước 1-2 của lộ trình: video Harvard + loạt bài Scalability for Dummies |
| `01-danh-doi/` | Các cặp đánh đổi nền tảng: performance/scalability, latency/throughput, CAP, consistency, availability |
| `02-chu-de/` | Từng chủ đề trong README gốc: DNS, CDN, load balancer, database, cache, asynchronism, communication, security |
| `03-bai-tap/` | Đề và lời giải trong `solutions/` |
| `_assets/` | Hình ảnh |

## Tiến độ

### 00 - Nền tảng

| # | Tài liệu | Trạng thái |
|---|---|---|
| - | Video: [Scalability Lecture at Harvard](https://www.youtube.com/watch?v=-W9F__D3oY4) | Đã xem |
| 01 | [Clones](00-nen-tang/01-clones.md) | Đã dịch |
| 02 | [Databases](00-nen-tang/02-databases.md) | Đã dịch |
| 03 | [Caches](00-nen-tang/03-caches.md) | Đã dịch |
| 04 | [Asynchronism](00-nen-tang/04-asynchronism.md) | Đã dịch |

### 01 - Đánh đổi

| # | Tài liệu | Trạng thái |
|---|---|---|
| 01 | [Performance vs scalability](01-danh-doi/01-performance-vs-scalability.md) | Đã dịch |
| 02 | [Latency vs throughput](01-danh-doi/02-latency-vs-throughput.md) | Đã dịch |
| 03 | [CAP theorem](01-danh-doi/03-cap-theorem.md) | Đã dịch |
| 04 | [Consistency patterns](01-danh-doi/04-consistency-patterns.md) | Đã dịch |
| 05 | [Availability patterns](01-danh-doi/05-availability-patterns.md) | Đã dịch |

### 02 - Chủ đề

| # | Tài liệu | Trạng thái |
|---|---|---|
| 01 | [DNS](02-chu-de/01-dns.md) | Đã dịch |
| 02 | [CDN](02-chu-de/02-cdn.md) | Đã dịch |
| 03 | [Load balancer](02-chu-de/03-load-balancer.md) | Đã dịch |
| 04 | [Reverse proxy](02-chu-de/04-reverse-proxy.md) | Đã dịch |
| 05 | [Application layer](02-chu-de/05-application-layer.md) | Đã dịch |
| 06 | [Database](02-chu-de/06-database.md) | Đã dịch |
| 07 | [Cache](02-chu-de/07-cache.md) | Đã dịch |
| 08 | [Asynchronism](02-chu-de/08-asynchronism.md) | Đã dịch |
| 09 | [Communication](02-chu-de/09-communication.md) | Đã dịch |
| 10 | [Security](02-chu-de/10-security.md) | Đã dịch |

### 03 - Bài tập

| # | Tài liệu | Trạng thái |
|---|---|---|
| 01 | [Pastebin (hoặc Bit.ly)](03-bai-tap/01-pastebin.md) | Đã dịch |
| 02 | [Scaling lên hàng triệu người dùng trên AWS](03-bai-tap/02-scaling-aws.md) | Đã dịch |
| 03 | [Twitter timeline và search](03-bai-tap/03-twitter.md) | Đã dịch |
| 04 | [Web crawler](03-bai-tap/04-web-crawler.md) | Đã dịch |
| 05 | [Mint.com](03-bai-tap/05-mint.md) | Đã dịch |
| 06 | [Sales rank theo danh mục](03-bai-tap/06-sales-rank.md) | Đã dịch |
| 07 | [Cấu trúc dữ liệu cho mạng xã hội](03-bai-tap/07-social-graph.md) | Đã dịch |
| 08 | [Key-value store cho search engine](03-bai-tap/08-query-cache.md) | Đã dịch |
