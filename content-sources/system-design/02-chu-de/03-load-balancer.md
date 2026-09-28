---
nguon: The System Design Primer - mục "Load balancer"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../README.md#load-balancer
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Bộ cân bằng tải (Load Balancer)

## Nội dung gốc

<p align="center">
  <img src="../../images/h81n9iK.png" alt="Sơ đồ bộ cân bằng tải phân phối request tới nhiều máy chủ">
  <br/>
  <i><a href=http://horicky.blogspot.com/2010/10/scalable-system-design-patterns.html>Nguồn: Scalable system design patterns</a></i>
</p>

Bộ cân bằng tải (load balancer) phân phối các request đến từ client tới các tài nguyên tính toán như máy chủ ứng dụng và cơ sở dữ liệu. Trong mỗi trường hợp, bộ cân bằng tải trả phản hồi từ tài nguyên tính toán về đúng client. Bộ cân bằng tải hiệu quả trong việc:

- Ngăn request đi tới các máy chủ không khỏe (unhealthy)
- Ngăn tài nguyên bị quá tải
- Giúp loại bỏ điểm lỗi đơn (single point of failure)

Bộ cân bằng tải có thể được hiện thực bằng phần cứng (đắt đỏ) hoặc bằng phần mềm như HAProxy.

Các lợi ích bổ sung gồm:

- **Kết thúc SSL (SSL termination)** - Giải mã request đến và mã hóa phản hồi của máy chủ, để các máy chủ phía sau (backend) không phải thực hiện những thao tác có thể tốn kém này
    - Không cần cài [chứng chỉ X.509](https://en.wikipedia.org/wiki/X.509) trên từng máy chủ
- **Duy trì phiên (session persistence)** - Cấp cookie và định tuyến các request của một client cụ thể tới cùng một instance, nếu ứng dụng web không tự theo dõi phiên

Để phòng sự cố, người ta thường dựng nhiều bộ cân bằng tải, theo chế độ [chủ động - bị động (active-passive)](../01-danh-doi/05-availability-patterns.md) hoặc [chủ động - chủ động (active-active)](../01-danh-doi/05-availability-patterns.md).

Bộ cân bằng tải có thể định tuyến lưu lượng dựa trên nhiều tiêu chí, gồm:

- Ngẫu nhiên (random)
- Ít tải nhất (least loaded)
- Theo phiên/cookie (session/cookies)
- [Vòng tròn hoặc vòng tròn có trọng số (round robin or weighted round robin)](https://www.g33kinfo.com/info/round-robin-vs-weighted-round-robin-lb)
- [Tầng 4 (Layer 4)](#cân-bằng-tải-tầng-4-layer-4-load-balancing)
- [Tầng 7 (Layer 7)](#cân-bằng-tải-tầng-7-layer-7-load-balancing)

### Cân bằng tải tầng 4 (Layer 4 load balancing)

Bộ cân bằng tải tầng 4 xem thông tin ở [tầng giao vận (transport layer)](09-communication.md) để quyết định cách phân phối request. Thông thường, việc này dựa trên địa chỉ IP nguồn, IP đích và các cổng (port) trong phần đầu (header), chứ không dựa trên nội dung của gói tin. Bộ cân bằng tải tầng 4 chuyển tiếp các gói tin mạng tới và từ máy chủ upstream, thực hiện [biên dịch địa chỉ mạng (Network Address Translation - NAT)](https://web.archive.org/web/20240117134735/https://www.nginx.com/resources/glossary/layer-4-load-balancing/).

### Cân bằng tải tầng 7 (Layer 7 load balancing)

Bộ cân bằng tải tầng 7 xem xét [tầng ứng dụng (application layer)](09-communication.md) để quyết định cách phân phối request. Việc này có thể liên quan tới nội dung của header, thông điệp và cookie. Bộ cân bằng tải tầng 7 kết thúc (terminate) lưu lượng mạng, đọc thông điệp, đưa ra quyết định cân bằng tải, rồi mở một kết nối tới máy chủ được chọn. Ví dụ, một bộ cân bằng tải tầng 7 có thể chuyển lưu lượng video tới các máy chủ lưu trữ video, trong khi chuyển lưu lượng thanh toán nhạy cảm của người dùng tới các máy chủ đã được gia cố bảo mật.

Phải hy sinh sự linh hoạt, nhưng bù lại cân bằng tải tầng 4 tốn ít thời gian và tài nguyên tính toán hơn tầng 7, dù ảnh hưởng về hiệu năng có thể rất nhỏ trên phần cứng phổ thông hiện đại.

### Mở rộng theo chiều ngang (Horizontal scaling)

Bộ cân bằng tải cũng hỗ trợ mở rộng theo chiều ngang, cải thiện hiệu năng và tính sẵn sàng. Mở rộng ra (scale out) bằng các máy phổ thông tiết kiệm chi phí hơn và cho tính sẵn sàng cao hơn so với nâng cấp (scale up) một máy chủ duy nhất lên phần cứng đắt tiền hơn, gọi là **mở rộng theo chiều dọc (vertical scaling)**. Tuyển người làm việc với phần cứng phổ thông cũng dễ hơn so với các hệ thống doanh nghiệp chuyên dụng.

#### Nhược điểm: mở rộng theo chiều ngang

- Mở rộng theo chiều ngang làm tăng độ phức tạp và đòi hỏi nhân bản (clone) máy chủ
    - Máy chủ nên không trạng thái (stateless): không chứa bất kỳ dữ liệu nào liên quan tới người dùng như phiên (session) hay ảnh đại diện
    - Phiên có thể được lưu trong một kho dữ liệu tập trung như [cơ sở dữ liệu](06-database.md) (SQL, NoSQL) hoặc một [cache](07-cache.md) bền vững (Redis, Memcached)
- Các máy chủ phía dưới (downstream) như cache và cơ sở dữ liệu phải xử lý nhiều kết nối đồng thời hơn khi các máy chủ phía trên (upstream) mở rộng ra

### Nhược điểm: bộ cân bằng tải

- Bộ cân bằng tải có thể trở thành nút thắt cổ chai về hiệu năng nếu không đủ tài nguyên hoặc không được cấu hình đúng.
- Việc thêm bộ cân bằng tải để giúp loại bỏ điểm lỗi đơn lại làm tăng độ phức tạp.
- Một bộ cân bằng tải duy nhất chính là một điểm lỗi đơn; cấu hình nhiều bộ cân bằng tải lại càng tăng thêm độ phức tạp.

### Nguồn và đọc thêm

- [NGINX architecture](https://www.nginx.com/blog/inside-nginx-how-we-designed-for-performance-scale/)
- [HAProxy architecture guide](http://www.haproxy.org/download/1.2/doc/architecture.txt)
- [Scalability](https://web.archive.org/web/20220530193911/https://www.lecloud.net/post/7295452622/scalability-for-dummies-part-1-clones)
- [Wikipedia](https://en.wikipedia.org/wiki/Load_balancing_(computing))
- [Layer 4 load balancing](https://www.nginx.com/resources/glossary/layer-4-load-balancing/)
- [Layer 7 load balancing](https://www.nginx.com/resources/glossary/layer-7-load-balancing/)
- [ELB listener config](http://docs.aws.amazon.com/elasticloadbalancing/latest/classic/elb-listener-config.html)

---

## Ghi chú của người dịch

**1. Tầng 4 và tầng 7 - bảng so sánh thực tế**

| | Tầng 4 | Tầng 7 |
|---|---|---|
| Nhìn thấy | IP, cổng, giao thức (TCP/UDP) | URL, header, cookie, nội dung HTTP/gRPC |
| Định tuyến theo đường dẫn, tên miền | Không | Có (`/api` → dịch vụ A, `/img` → dịch vụ B) |
| Kết thúc TLS | Thường không (chuyển nguyên gói đã mã hóa) | Có |
| Chia tải theo | Kết nối | Từng request |
| Giao thức ngoài HTTP (cơ sở dữ liệu, MQTT, game UDP) | Tốt | Hạn chế |
| Ví dụ 2026 | AWS NLB, Google Cloud Network LB, IPVS, HAProxy chế độ TCP | AWS ALB, Google Cloud Application LB, Envoy, NGINX, HAProxy chế độ HTTP, Traefik |

Câu cuối của bản gốc đáng nhấn mạnh: **chênh lệch hiệu năng giữa tầng 4 và tầng 7 trên phần cứng hiện đại thường không phải lý do quyết định**. Lý do thật để chọn tầng 4 thường là: cần chuyển giao thức không phải HTTP, cần giữ nguyên IP nguồn của client, cần IP tĩnh, hoặc cần thông lượng cực lớn ở tầng ngoài cùng. Kiến trúc phổ biến là **kết hợp**: tầng 4 ở ngoài cùng, phía sau là một lớp tầng 7.

**2. Bẫy kinh điển: kết nối sống lâu với cân bằng tải tầng 4**

Tầng 4 chia tải **theo kết nối**, không theo request. Với HTTP/2, gRPC hay WebSocket, một client mở một kết nối rồi gửi hàng nghìn request trên đó - mọi request dồn vào **một** backend. Kết quả: vài máy quá tải, các máy mới thêm vào ngồi không. Đây là vấn đề rất hay gặp khi chạy gRPC trong Kubernetes với Service thông thường (vốn chia tải ở tầng 4). Cách chữa: dùng cân bằng tải tầng 7 hiểu HTTP/2 (Envoy, service mesh), cân bằng tải phía client, hoặc giới hạn tuổi thọ kết nối để client định kỳ kết nối lại.

**3. Thuật toán chia tải - bản gốc liệt kê, đây là khi nào dùng cái nào**

| Thuật toán | Hợp khi | Yếu ở |
|---|---|---|
| Vòng tròn (round robin) | Các máy như nhau, request tốn công gần bằng nhau | Request nặng nhẹ khác nhau thì lệch tải |
| Vòng tròn có trọng số | Các máy có cấu hình khác nhau, triển khai canary (đẩy 5% sang bản mới) | Trọng số tĩnh, không theo tải thật |
| Ít kết nối nhất (least connections) | Thời gian xử lý request chênh lệch lớn | Cần bộ cân bằng tải biết trạng thái kết nối |
| Chọn ngẫu nhiên hai, lấy máy nhẹ hơn (power of two choices) | Nhiều bộ cân bằng tải chạy song song, không chia sẻ trạng thái | Ít phổ biến trong cấu hình mặc định (Envoy và NGINX có hỗ trợ) |
| Băm nhất quán (consistent hashing) theo khóa | Muốn cùng khóa luôn tới cùng máy để tận dụng cache cục bộ | Khóa "nóng" làm một máy quá tải |

**4. Kiểm tra sức khỏe (health check) - chỗ hay sai nhất**

Lợi ích đầu tiên của bộ cân bằng tải là "ngăn request đi tới máy chủ không khỏe", nhưng cái gì gọi là "khỏe" mới là vấn đề:

- **Kiểm tra quá nông**: chỉ kiểm tra tiến trình còn mở cổng. Máy mất kết nối cơ sở dữ liệu vẫn "khỏe" và tiếp tục nhận request để trả lỗi.
- **Kiểm tra quá sâu**: endpoint kiểm tra gọi cả cơ sở dữ liệu. Cơ sở dữ liệu chậm một chút, **mọi** máy cùng bị đánh dấu hỏng, bộ cân bằng tải rút hết - từ sự cố nhỏ thành sập toàn bộ. Nhiều bộ cân bằng tải có cơ chế "fail open": nếu tất cả đều hỏng thì vẫn gửi cho tất cả.
- **Rút kết nối nhẹ nhàng (connection draining)**: khi gỡ một máy để triển khai, bộ cân bằng tải phải ngừng gửi request mới nhưng cho request đang chạy hoàn tất. Thiếu bước này là nguyên nhân phổ biến của lỗi 502 lác đác mỗi lần deploy.

**5. Duy trì phiên (sticky session) - có nhưng nên tránh**

Bản gốc nêu duy trì phiên như một lợi ích. Đúng, nhưng nó là **cách chữa triệu chứng** cho ứng dụng có trạng thái. Hệ quả: tải lệch (người dùng nặng dính chặt một máy), máy chết là mất phiên, không co giãn tự do được. Hướng đúng là phần "Nhược điểm: mở rộng theo chiều ngang" ngay trong bản gốc: đưa phiên ra kho tập trung (Redis) hoặc dùng token không trạng thái - chính là bài học của [Clones](../00-nen-tang/01-clones.md). Chỉ nên dùng sticky session khi có lý do rõ ràng, ví dụ WebSocket hoặc cache cục bộ tốn kém để dựng lại.

**6. Làm sao để chính bộ cân bằng tải không là điểm lỗi đơn**

Nhược điểm cuối của bản gốc có các lời giải chuẩn:

- **Cặp active-passive với IP ảo trôi (floating IP)**: dùng keepalived/VRRP, máy dự phòng nhận IP khi máy chính chết - áp dụng trực tiếp [Các mẫu sẵn sàng](../01-danh-doi/05-availability-patterns.md).
- **Nhiều bộ cân bằng tải active-active** phía sau [DNS](01-dns.md) hoặc anycast.
- **Dịch vụ quản lý sẵn trên đám mây** (ALB/NLB, Google Cloud Load Balancing, Azure Load Balancer): nhà cung cấp tự lo dư thừa. Trong phỏng vấn, nói "dùng load balancer quản lý sẵn, nó tự dư thừa trên nhiều vùng sẵn sàng (availability zone)" là câu trả lời hợp lệ, miễn là biết bên dưới nó làm gì.

**7. Nhược điểm dễ bị quên: cạn kết nối ở phía dưới**

Ý "máy chủ downstream phải xử lý nhiều kết nối đồng thời hơn" rất thực tế: 50 máy ứng dụng, mỗi máy một pool 20 kết nối, là 1.000 kết nối tới cơ sở dữ liệu. PostgreSQL mặc định cho phép 100 kết nối (`max_connections`). Mở rộng tầng ứng dụng mà quên tầng dưới là cách nhanh nhất làm sập cơ sở dữ liệu. Chữa bằng bộ gộp kết nối (connection pooler) như PgBouncer, hoặc proxy của nhà cung cấp đám mây (ví dụ RDS Proxy).

**8. Nối với các mục khác**

- [Clones](../00-nen-tang/01-clones.md) - điều kiện tiên quyết để cân bằng tải: máy chủ không trạng thái.
- [Các mẫu sẵn sàng](../01-danh-doi/05-availability-patterns.md) - active-passive, active-active áp dụng cho chính bộ cân bằng tải.
- [DNS](01-dns.md) - chia tải thô giữa các vùng; bộ cân bằng tải chia tải mịn trong một vùng.
- [Reverse proxy](04-reverse-proxy.md) - mục kế tiếp; phần lớn bộ cân bằng tải tầng 7 cũng là reverse proxy.
- [Hiệu năng và khả năng mở rộng](../01-danh-doi/01-performance-vs-scalability.md) - mở rộng chiều ngang và chiều dọc.
- [Giao tiếp](09-communication.md) - mô hình OSI, TCP/UDP, nền tảng để hiểu tầng 4 và tầng 7.

**9. Câu hỏi nên tự hỏi trong buổi phỏng vấn system design**

- Máy chủ phía sau có giữ trạng thái không? (Nếu có, phải giải quyết trước khi thêm bộ cân bằng tải, nếu không sẽ phải dùng sticky session.)
- Cần định tuyến theo nội dung request không - đường dẫn, tên miền, header? (Có thì cần tầng 7.)
- Giao thức là gì - HTTP/1.1, HTTP/2, gRPC, WebSocket, TCP thuần? (Quyết định tầng và thuật toán chia tải.)
- Health check kiểm tra cái gì, và điều gì xảy ra nếu tất cả backend cùng hỏng?
- Khi tầng ứng dụng tăng gấp 10 lần, cơ sở dữ liệu và cache có chịu nổi số kết nối không?

Đối chiếu README gốc của repo:
- [Load balancer](../../README.md#load-balancer)
- [Reverse proxy (web server)](../../README.md#reverse-proxy-web-server) - mục kế tiếp
