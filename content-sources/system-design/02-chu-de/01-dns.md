---
nguon: The System Design Primer - mục "Domain name system"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../README.md#domain-name-system
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Hệ thống phân giải tên miền (Domain Name System)

## Nội dung gốc

<p align="center">
  <img src="../../images/IOyLj4i.jpg" alt="Sơ đồ quá trình phân giải tên miền qua các cấp máy chủ DNS">
  <br/>
  <i><a href=http://www.slideshare.net/srikrupa5/dns-security-presentation-issa>Nguồn: DNS security presentation</a></i>
</p>

Hệ thống phân giải tên miền (Domain Name System - DNS) chuyển một tên miền như www.example.com thành một địa chỉ IP.

DNS có cấu trúc phân cấp, với một vài máy chủ có thẩm quyền (authoritative server) ở cấp cao nhất. Bộ định tuyến (router) hoặc nhà cung cấp dịch vụ Internet (ISP) của bạn cung cấp thông tin về (các) máy chủ DNS cần liên hệ khi tra cứu. Các máy chủ DNS cấp thấp hơn lưu đệm (cache) các ánh xạ, và những ánh xạ này có thể trở nên lỗi thời do độ trễ lan truyền DNS (DNS propagation delay). Kết quả DNS cũng có thể được trình duyệt hoặc hệ điều hành lưu đệm trong một khoảng thời gian nhất định, xác định bởi [thời gian sống (time to live - TTL)](https://en.wikipedia.org/wiki/Time_to_live).

- **Bản ghi NS (name server)** - Chỉ định các máy chủ DNS cho tên miền/tên miền con của bạn.
- **Bản ghi MX (mail exchange)** - Chỉ định các máy chủ thư nhận thư đến.
- **Bản ghi A (address)** - Trỏ một tên tới một địa chỉ IP.
- **CNAME (canonical)** - Trỏ một tên tới một tên khác hoặc một `CNAME` khác (example.com tới www.example.com), hoặc tới một bản ghi `A`.

Các dịch vụ như [CloudFlare](https://www.cloudflare.com/dns/) và [Route 53](https://aws.amazon.com/route53/) cung cấp DNS được quản lý sẵn (managed DNS). Một số dịch vụ DNS có thể định tuyến lưu lượng theo nhiều phương pháp:

- [Vòng tròn có trọng số (weighted round robin)](https://www.jscape.com/blog/load-balancing-algorithms)
    - Ngăn lưu lượng đi tới các máy chủ đang bảo trì
    - Cân bằng giữa các cụm máy (cluster) có kích thước khác nhau
    - Thử nghiệm A/B (A/B testing)
- [Dựa trên độ trễ (latency-based)](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-latency.html)
- [Dựa trên vị trí địa lý (geolocation-based)](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-geo.html)

### Nhược điểm: DNS

- Truy cập máy chủ DNS gây thêm một chút độ trễ, dù đã được giảm nhẹ nhờ cơ chế lưu đệm mô tả ở trên.
- Việc quản lý máy chủ DNS có thể phức tạp và thường do [chính phủ, ISP và các công ty lớn](http://superuser.com/questions/472695/who-controls-the-dns-servers/472729) đảm nhận.
- Các dịch vụ DNS gần đây đã hứng chịu [tấn công DDoS](http://dyn.com/blog/dyn-analysis-summary-of-friday-october-21-attack/), khiến người dùng không truy cập được các trang như Twitter nếu không biết (các) địa chỉ IP của Twitter.

### Nguồn và đọc thêm

- [DNS architecture](https://technet.microsoft.com/en-us/library/dd197427(v=ws.10).aspx)
- [Wikipedia](https://en.wikipedia.org/wiki/Domain_Name_System)
- [DNS articles](https://support.dnsimple.com/categories/dns/)

---

## Ghi chú của người dịch

**1. Một lần tra cứu DNS thật sự đi qua những đâu**

Bản gốc nói gọn "DNS có cấu trúc phân cấp". Cụ thể hơn, có hai vai trò hay bị nhầm:

- **Recursive resolver** (máy phân giải đệ quy): máy đi hỏi hộ bạn - resolver của ISP, `8.8.8.8` (Google), `1.1.1.1` (Cloudflare), hoặc resolver nội bộ trong VPC. Nó giữ cache.
- **Authoritative server** (máy chủ có thẩm quyền): máy nắm câu trả lời gốc cho một vùng (zone) - chính là Route 53, Cloudflare DNS... nơi bạn khai báo bản ghi.

Khi cache trống, resolver đi lần lượt: root server → máy chủ của TLD (`.com`, `.vn`) → authoritative server của `example.com`. Trước cả resolver còn có cache của trình duyệt và hệ điều hành. Vì có quá nhiều tầng cache như vậy, **"lan truyền DNS" thực chất không phải là lan truyền, mà là chờ các bản cache cũ hết TTL**.

**2. Các loại bản ghi bản gốc bỏ qua nhưng gặp hằng ngày**

| Bản ghi | Dùng để | Ghi chú |
|---|---|---|
| AAAA | Trỏ tên tới địa chỉ IPv6 | Bản IPv6 của bản ghi A |
| TXT | Chứa văn bản tùy ý | Xác minh quyền sở hữu tên miền, SPF/DKIM/DMARC cho email |
| SOA | Thông tin quản trị của zone | Trường cuối quy định thời gian cache câu trả lời "không tồn tại" (negative caching) |
| CAA | Giới hạn CA nào được cấp chứng chỉ cho tên miền | Giảm rủi ro cấp chứng chỉ trái phép |
| SRV | Chỉ định host và cổng của một dịch vụ | Dùng trong một số hệ khám phá dịch vụ, SIP, XMPP |
| HTTPS / SVCB | Báo trước cho client cách kết nối (ví dụ hỗ trợ HTTP/3) | Loại bản ghi mới hơn, trình duyệt hiện đại đã hỗ trợ |

**3. Bẫy CNAME ở tên miền gốc (apex)**

Ví dụ trong bản gốc "example.com tới www.example.com" nghe tự nhiên nhưng **theo chuẩn DNS, CNAME không được đặt ở tên miền gốc** (`example.com`), vì ở đó bắt buộc phải có bản ghi SOA và NS, mà CNAME không được tồn tại cùng bản ghi nào khác. Các nhà cung cấp giải quyết bằng bản ghi "giả" ở phía họ: **ALIAS** (Route 53), **CNAME flattening** (Cloudflare), **ANAME** (một số nhà cung cấp khác) - máy chủ tự phân giải đích và trả về bản ghi A. Đây là lý do khi trỏ tên miền gốc tới một load balancer hay CDN, bạn thường phải dùng tính năng riêng của nhà cung cấp DNS.

**4. TTL - cái núm vặn quan trọng nhất**

| TTL | Ưu điểm | Nhược điểm |
|---|---|---|
| Ngắn (30-60 giây) | Đổi IP, chuyển đổi dự phòng nhanh | Nhiều truy vấn hơn, mỗi lần cache hết hạn là thêm độ trễ |
| Dài (vài giờ đến một ngày) | Ít truy vấn, nhanh, chịu được sự cố DNS tạm thời | Đổi cấu hình phải chờ rất lâu mới có hiệu lực |

Kinh nghiệm thực tế:

- **Hạ TTL trước khi di chuyển hạ tầng.** Nếu TTL đang là 1 ngày, hạ xuống 60 giây ít nhất 1 ngày trước khi đổi IP, rồi mới đổi. Đổi IP trước rồi mới hạ TTL thì vô dụng.
- **Không phải ai cũng tôn trọng TTL.** Một số resolver và client giữ cache lâu hơn quy định. Máy ảo Java từng nổi tiếng với việc cache DNS rất lâu tùy cấu hình bảo mật. Vì vậy chuyển đổi dự phòng chỉ bằng DNS luôn có một phần lưu lượng "đi lạc" tới IP cũ trong một thời gian.
- **Negative caching**: tra một tên chưa tồn tại (ví dụ trước khi kịp tạo bản ghi) thì câu trả lời "không tồn tại" cũng bị cache. Tạo bản ghi xong vẫn thấy lỗi là chuyện thường.

**5. Định tuyến bằng DNS - mạnh nhưng thô**

Các chính sách định tuyến trong bản gốc (trọng số, độ trễ, địa lý) hiện có ở hầu hết DNS quản lý sẵn: Route 53, Cloudflare, Google Cloud DNS, Azure Traffic Manager, NS1. Thêm vào đó là **định tuyến chuyển đổi dự phòng (failover routing)** kèm kiểm tra sức khỏe (health check). Nhưng cần hiểu giới hạn:

- DNS quyết định **theo vị trí của resolver**, không phải của người dùng. Người dùng ở Việt Nam dùng một resolver công cộng đặt ở nơi khác có thể bị định tuyến sai vùng. Phần mở rộng EDNS Client Subnet (ECS) giảm bớt vấn đề này, nhưng không phải resolver nào cũng gửi.
- DNS không biết server đang tải bao nhiêu, và bị TTL làm chậm phản ứng. Vì vậy **DNS dùng để chia tải thô giữa các vùng/trung tâm dữ liệu**, còn chia tải mịn giữa các máy trong một vùng là việc của [bộ cân bằng tải](03-load-balancer.md).
- Một cách khác để đưa người dùng tới điểm gần nhất là **anycast**: nhiều máy chủ ở nhiều nơi cùng quảng bá một địa chỉ IP, định tuyến Internet (BGP) tự đưa gói tin tới điểm gần. Các resolver công cộng, CDN và nhiều DNS quản lý sẵn dùng cách này.

**6. Bảo mật và độ tin cậy**

- **Vụ Dyn năm 2016** mà bản gốc nhắc tới do botnet Mirai (chủ yếu gồm thiết bị IoT) gây ra. Bài học: **DNS là một phụ thuộc nối tiếp** của mọi request - nhắc lại công thức ở [Các mẫu sẵn sàng](../01-danh-doi/05-availability-patterns.md). Nhiều công ty lớn sau đó dùng **hai nhà cung cấp DNS song song** để biến phụ thuộc nối tiếp thành song song.
- **DNSSEC** ký số bản ghi để chống giả mạo câu trả lời (cache poisoning). Nó xác thực dữ liệu nhưng **không mã hóa**.
- **DNS over HTTPS (DoH)** và **DNS over TLS (DoT)** mã hóa đường đi giữa client và resolver, chống nghe lén và sửa đổi trên đường. Trình duyệt hiện đại và nhiều hệ điều hành đã hỗ trợ.
- **Chiếm tên miền con (subdomain takeover)**: bản ghi CNAME còn trỏ tới một tài nguyên đám mây đã xóa (bucket, app), kẻ khác đăng ký lại tên đó và chiếm luôn tên miền con của bạn. Dọn bản ghi DNS khi hủy tài nguyên là việc hay bị quên.

**7. Nối với các mục khác**

- [Các mẫu sẵn sàng](../01-danh-doi/05-availability-patterns.md) - active-active hướng ra Internet cần DNS biết IP của cả hai máy; mục này giải thích TTL làm chuyển đổi dự phòng qua DNS chậm thế nào.
- [CDN](02-cdn.md) - mục kế tiếp; CDN dựa vào DNS (thường qua CNAME) để đưa người dùng tới điểm phục vụ gần nhất.
- [Bộ cân bằng tải](03-load-balancer.md) - chia tải mịn bên trong một vùng, bổ sung cho chia tải thô bằng DNS.
- [Độ trễ và thông lượng](../01-danh-doi/02-latency-vs-throughput.md) - một lần tra DNS khi cache trống cộng thêm vài vòng mạng vào độ trễ của request đầu tiên.

**8. Câu hỏi nên tự hỏi trong buổi phỏng vấn system design**

- Người dùng ở những vùng địa lý nào? (Nhiều vùng thì cần định tuyến theo độ trễ/địa lý ở tầng DNS.)
- Khi cả một vùng chết, lưu lượng được chuyển đi bằng cách nào, và mất bao lâu? (Câu trả lời phụ thuộc trực tiếp vào TTL và health check.)
- DNS có phải điểm lỗi đơn không? (Một nhà cung cấp DNS là một phụ thuộc nối tiếp cho toàn hệ thống.)
- Dịch vụ nội bộ tìm nhau bằng DNS hay bằng cơ chế khám phá dịch vụ khác? (Trong Kubernetes, DNS nội bộ của cluster đóng vai trò này.)

Đối chiếu README gốc của repo:
- [Domain name system](../../README.md#domain-name-system)
- [Content delivery network](../../README.md#content-delivery-network) - mục kế tiếp
