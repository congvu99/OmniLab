---
nguon: The System Design Primer - mục "Content delivery network"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../README.md#content-delivery-network
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Mạng phân phối nội dung (Content Delivery Network)

## Nội dung gốc

<p align="center">
  <img src="../../images/h9TAuGI.jpg" alt="Sơ đồ mạng phân phối nội dung với các máy chủ đặt gần người dùng">
  <br/>
  <i><a href=https://www.creative-artworks.eu/why-use-a-content-delivery-network-cdn/>Nguồn: Why use a CDN</a></i>
</p>

Mạng phân phối nội dung (content delivery network - CDN) là một mạng lưới máy chủ proxy phân tán toàn cầu, phục vụ nội dung từ những vị trí gần người dùng hơn. Thông thường, các file tĩnh như HTML/CSS/JS, ảnh và video được phục vụ từ CDN, dù một số CDN như CloudFront của Amazon có hỗ trợ nội dung động. Kết quả phân giải DNS của trang web sẽ cho client biết cần liên hệ máy chủ nào.

Phục vụ nội dung từ CDN có thể cải thiện hiệu năng đáng kể theo hai cách:

- Người dùng nhận nội dung từ các trung tâm dữ liệu ở gần họ
- Máy chủ của bạn không phải phục vụ những request mà CDN đã đáp ứng

### CDN kiểu đẩy (Push CDN)

CDN kiểu đẩy nhận nội dung mới mỗi khi có thay đổi trên máy chủ của bạn. Bạn chịu toàn bộ trách nhiệm cung cấp nội dung: tải trực tiếp lên CDN và viết lại URL để trỏ tới CDN. Bạn có thể cấu hình khi nào nội dung hết hạn và khi nào được cập nhật. Nội dung chỉ được tải lên khi nó mới hoặc đã thay đổi, giúp giảm tối đa lưu lượng nhưng lại tốn tối đa dung lượng lưu trữ.

Những trang có ít lưu lượng hoặc có nội dung không thường xuyên cập nhật hợp với CDN kiểu đẩy. Nội dung được đặt lên CDN một lần, thay vì bị kéo lại theo chu kỳ.

### CDN kiểu kéo (Pull CDN)

CDN kiểu kéo lấy nội dung mới từ máy chủ của bạn khi người dùng đầu tiên yêu cầu nội dung đó. Bạn để nguyên nội dung trên máy chủ của mình và viết lại URL để trỏ tới CDN. Điều này khiến request chậm hơn cho tới khi nội dung được lưu đệm trên CDN.

[Thời gian sống (time-to-live - TTL)](https://en.wikipedia.org/wiki/Time_to_live) xác định nội dung được lưu đệm trong bao lâu. CDN kiểu kéo giảm tối đa dung lượng lưu trữ trên CDN, nhưng có thể tạo lưu lượng dư thừa nếu file hết hạn và bị kéo lại trước khi nó thực sự thay đổi.

Những trang có lưu lượng lớn hợp với CDN kiểu kéo, vì lưu lượng được dàn đều hơn và chỉ nội dung vừa được yêu cầu gần đây mới nằm lại trên CDN.

### Nhược điểm: CDN

- Chi phí CDN có thể đáng kể tùy theo lưu lượng, dù cần cân nhắc so với những chi phí phát sinh thêm nếu bạn không dùng CDN.
- Nội dung có thể bị cũ nếu nó được cập nhật trước khi TTL hết hạn.
- CDN đòi hỏi phải đổi URL của nội dung tĩnh để trỏ tới CDN.

### Nguồn và đọc thêm

- [Globally distributed content delivery](https://figshare.com/articles/Globally_distributed_content_delivery/6605972)
- [The differences between push and pull CDNs](https://www.geeksforgeeks.org/system-design/pull-cdn-vs-push-cdn/)
- [Wikipedia](https://en.wikipedia.org/wiki/Content_delivery_network)

---

## Ghi chú của người dịch

**1. CDN ngày nay không chỉ phục vụ file tĩnh**

Bản gốc viết từ thời CDN chủ yếu là "nơi để ảnh và CSS". Đến 2026, các CDN lớn (Cloudflare, Amazon CloudFront, Akamai, Fastly, Google Cloud CDN, Azure Front Door, Bunny) thường đứng **trước toàn bộ trang web**, kể cả API, và làm thêm nhiều việc:

- **Kết thúc TLS gần người dùng**: bắt tay TLS tốn vài vòng mạng; thực hiện ở điểm gần người dùng rồi giữ kết nối sẵn về máy chủ gốc (origin) giúp giảm độ trễ ngay cả với nội dung **không cache được**.
- **Chống DDoS và tường lửa ứng dụng web (WAF)**: lưu lượng tấn công bị hấp thụ ở mạng lưới rộng của CDN trước khi tới origin.
- **HTTP/2, HTTP/3, nén Brotli, tối ưu ảnh** ngay tại biên (edge).
- **Tính toán ở biên (edge compute)**: Cloudflare Workers, CloudFront Functions và Lambda@Edge, Fastly Compute - chạy mã ngắn tại điểm gần người dùng (định tuyến, xác thực, A/B test, cá nhân hóa nhẹ).

Nghĩa là CDN hiện đại vừa là cache, vừa là [reverse proxy](04-reverse-proxy.md) phân tán toàn cầu.

**2. Push và pull trong thực tế 2026**

| | Kéo (pull) | Đẩy (push) |
|---|---|---|
| Nội dung nằm ở | Origin của bạn, CDN cache theo nhu cầu | Bạn chủ động tải lên kho lưu trữ của CDN |
| Request đầu tiên | Chậm (cache miss, phải về origin) | Nhanh ngay từ đầu |
| Vận hành | Đơn giản, chỉ cần cấu hình cache | Phải có bước tải lên trong quy trình triển khai |
| Hợp với | Hầu hết trang web, API, nội dung khó đoán trước | File lớn, phân phối phần mềm, video theo lịch |

Phần lớn hệ thống hiện nay dùng **kiểu kéo**. "Kiểu đẩy" trong thực tế thường mang dạng: đẩy file lên kho đối tượng (S3, Google Cloud Storage, Cloudflare R2), rồi để CDN kéo từ kho đó. Tức là ranh giới giữa hai kiểu đã mờ đi.

**3. Nhược điểm "nội dung bị cũ" - cách xử lý chuẩn là không dùng purge**

Có hai cách để người dùng thấy phiên bản mới:

- **Xóa cache (purge/invalidation)**: gọi API của CDN để xóa. Được, nhưng mất thời gian lan tới mọi điểm, có thể tính phí, và dễ quên.
- **Đổi tên file theo nội dung (fingerprinting, cache busting)**: `app.3f9a1c.js` thay vì `app.js`. Nội dung đổi thì tên đổi, URL mới chưa từng bị cache. File đó có thể đặt TTL rất dài (một năm, kèm `immutable`). Chỉ file HTML trỏ tới chúng mới cần TTL ngắn.

Các công cụ build frontend hiện nay (Vite, webpack, Next.js...) làm việc này mặc định. Đây là đáp án đúng cho nhược điểm thứ hai và cũng giải quyết luôn nhược điểm thứ ba của bản gốc (đổi URL) một cách tự động.

**4. Các header điều khiển cache cần biết**

| Header / chỉ thị | Ý nghĩa |
|---|---|
| `Cache-Control: max-age=N` | Trình duyệt và CDN được cache N giây |
| `s-maxage=N` | Chỉ áp dụng cho cache dùng chung (CDN, proxy), ghi đè `max-age` |
| `private` | Chỉ trình duyệt được cache, CDN không được |
| `no-store` | Không ai được cache |
| `stale-while-revalidate=N` | Được trả bản cũ trong lúc lấy bản mới ở nền |
| `Vary` | Cache riêng theo header nào đó (ví dụ `Accept-Encoding`) |
| `ETag` / `Last-Modified` | Cho phép hỏi lại "đã đổi chưa" mà không tải lại toàn bộ |

**5. Bẫy thường gặp**

- **Cache nhầm dữ liệu cá nhân**: trang có thông tin tài khoản bị CDN cache rồi trả cho người khác. Đây là sự cố rò rỉ dữ liệu thật, không chỉ lỗi hiển thị. Nguyên tắc: phản hồi phụ thuộc người dùng phải `private` hoặc `no-store`, và phải hiểu rõ **khóa cache (cache key)** của CDN gồm những gì (đường dẫn, query string, header, cookie).
- **Tỉ lệ trúng cache thấp vì query string rác**: tham số theo dõi quảng cáo (`utm_*`) làm mỗi URL thành một mục cache riêng. Cấu hình khóa cache bỏ qua các tham số này.
- **Dồn request về origin (thundering herd)**: một file phổ biến hết hạn, hàng nghìn điểm biên cùng về origin lấy. Các CDN có **gộp request (request collapsing)** và **tầng che chắn origin (origin shield)** - một tầng cache trung gian để các điểm biên hỏi nó thay vì hỏi thẳng origin.
- **CDN cũng là phụ thuộc nối tiếp**: sự cố của một CDN lớn (ví dụ sự cố Fastly tháng 6/2021, khi một thay đổi cấu hình của khách hàng kích hoạt lỗi phần mềm tiềm ẩn) từng làm hàng loạt trang lớn đồng loạt không truy cập được. Hệ thống rất quan trọng đôi khi dùng hai CDN, chuyển đổi bằng [DNS](01-dns.md).
- **Chi phí**: cái đắt thường không phải CDN mà là **lưu lượng ra khỏi đám mây (egress)** từ origin. Tỉ lệ trúng cache cao giảm cả hai.

**6. Nối với các mục khác**

- [DNS](01-dns.md) - cơ chế đưa người dùng tới điểm CDN gần nhất (CNAME tới tên miền của CDN, kèm định tuyến địa lý hoặc anycast).
- [Cache](07-cache.md) - CDN là một tầng trong chuỗi cache: trình duyệt → CDN → reverse proxy → ứng dụng → cơ sở dữ liệu.
- [Caches](../00-nen-tang/03-caches.md) - bài nền tảng về cache đã dịch.
- [Reverse proxy](04-reverse-proxy.md) - CDN hiện đại về bản chất là reverse proxy phân tán toàn cầu.
- [Độ trễ và thông lượng](../01-danh-doi/02-latency-vs-throughput.md) - CDN là cách duy nhất "phá" được giới hạn tốc độ ánh sáng: không truyền nhanh hơn được thì đặt dữ liệu gần hơn.

**7. Câu hỏi nên tự hỏi trong buổi phỏng vấn system design**

- Bao nhiêu phần trăm lưu lượng là nội dung tĩnh, bao nhiêu phụ thuộc từng người dùng? (Quyết định CDN gánh được bao nhiêu tải.)
- Khi nội dung thay đổi, người dùng phải thấy bản mới sau bao lâu? (Quyết định TTL và chiến lược purge hay fingerprinting.)
- Nội dung có cần kiểm soát truy cập không - video trả phí, file riêng tư? (Dùng URL ký số có thời hạn - signed URL/cookie.)
- Origin chịu được bao nhiêu nếu toàn bộ cache CDN trống cùng lúc? (Kịch bản khi đổi cấu hình cache hoặc chuyển CDN.)

Đối chiếu README gốc của repo:
- [Content delivery network](../../README.md#content-delivery-network)
- [Load balancer](../../README.md#load-balancer) - mục kế tiếp
