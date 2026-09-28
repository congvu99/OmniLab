---
nguon: The System Design Primer - mục "Reverse proxy (web server)"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../README.md#reverse-proxy-web-server
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Proxy ngược (Reverse Proxy - máy chủ web)

## Nội dung gốc

<p align="center">
  <img src="../../images/n41Azff.png" alt="Sơ đồ proxy ngược đứng giữa Internet và các máy chủ nội bộ">
  <br/>
  <i><a href=https://upload.wikimedia.org/wikipedia/commons/6/67/Reverse_proxy_h2g2bob.svg>Nguồn: Wikipedia</a></i>
  <br/>
</p>

Proxy ngược (reverse proxy) là một máy chủ web tập trung các dịch vụ nội bộ và cung cấp giao diện thống nhất ra bên ngoài. Request từ client được chuyển tiếp tới một máy chủ có thể đáp ứng nó, rồi proxy ngược trả phản hồi của máy chủ đó về cho client.

Các lợi ích bổ sung gồm:

- **Tăng cường bảo mật** - Che giấu thông tin về các máy chủ phía sau (backend), chặn IP theo danh sách đen (blacklist), giới hạn số kết nối trên mỗi client
- **Tăng khả năng mở rộng và tính linh hoạt** - Client chỉ thấy IP của proxy ngược, nhờ đó bạn có thể mở rộng máy chủ hoặc thay đổi cấu hình của chúng
- **Kết thúc SSL (SSL termination)** - Giải mã request đến và mã hóa phản hồi của máy chủ, để các máy chủ phía sau không phải thực hiện những thao tác có thể tốn kém này
    - Không cần cài [chứng chỉ X.509](https://en.wikipedia.org/wiki/X.509) trên từng máy chủ
- **Nén (compression)** - Nén phản hồi của máy chủ
- **Lưu đệm (caching)** - Trả phản hồi cho các request đã được lưu đệm
- **Nội dung tĩnh (static content)** - Phục vụ trực tiếp nội dung tĩnh
    - HTML/CSS/JS
    - Ảnh
    - Video
    - v.v.

### Bộ cân bằng tải và proxy ngược

- Triển khai bộ cân bằng tải hữu ích khi bạn có nhiều máy chủ. Thường thì bộ cân bằng tải định tuyến lưu lượng tới một nhóm máy chủ cùng thực hiện một chức năng.
- Proxy ngược có thể hữu ích ngay cả khi chỉ có một máy chủ web hoặc máy chủ ứng dụng, mang lại các lợi ích đã mô tả ở phần trước.
- Các giải pháp như NGINX và HAProxy có thể hỗ trợ cả proxy ngược tầng 7 lẫn cân bằng tải.

### Nhược điểm: proxy ngược

- Thêm proxy ngược làm tăng độ phức tạp.
- Một proxy ngược duy nhất là một điểm lỗi đơn; cấu hình nhiều proxy ngược (tức [chuyển đổi dự phòng - failover](https://en.wikipedia.org/wiki/Failover)) lại càng tăng thêm độ phức tạp.

### Nguồn và đọc thêm

- [Reverse proxy vs load balancer](https://www.nginx.com/resources/glossary/reverse-proxy-vs-load-balancer/)
- [NGINX architecture](https://www.nginx.com/blog/inside-nginx-how-we-designed-for-performance-scale/)
- [HAProxy architecture guide](http://www.haproxy.org/download/1.2/doc/architecture.txt)
- [Wikipedia](https://en.wikipedia.org/wiki/Reverse_proxy)

---

## Ghi chú của người dịch

**1. "Ngược" so với cái gì - proxy xuôi và proxy ngược**

Chữ "ngược" chỉ có nghĩa khi đặt cạnh proxy thông thường (forward proxy):

| | Proxy xuôi (forward proxy) | Proxy ngược (reverse proxy) |
|---|---|---|
| Đứng về phía | Client | Server |
| Ai biết về nó | Client cấu hình để đi qua nó | Client không biết, tưởng đang nói chuyện với server thật |
| Che giấu | Danh tính client | Cấu trúc bên trong của server |
| Ví dụ | Proxy công ty lọc truy cập web, proxy đi ra Internet cho mạng nội bộ | NGINX trước ứng dụng, CDN, API gateway |

**2. Bộ cân bằng tải, proxy ngược, API gateway - ranh giới đã nhòa**

Bản gốc phân biệt hai khái niệm, nhưng câu thứ ba ("NGINX và HAProxy hỗ trợ cả hai") mới phản ánh thực tế: **đây là vai trò, không phải sản phẩm**. Cùng một phần mềm có thể đóng cả ba vai:

| Vai trò | Việc chính | Công cụ tiêu biểu 2026 |
|---|---|---|
| Proxy ngược / máy chủ web | TLS, nén, file tĩnh, cache, chuyển tiếp | NGINX, Caddy (tự động xin chứng chỉ HTTPS), Apache httpd |
| Bộ cân bằng tải | Chia request cho nhiều máy, health check | HAProxy, Envoy, AWS ALB/NLB |
| API gateway | Xác thực, giới hạn tần suất (rate limiting), định tuyến theo phiên bản API, chuyển đổi giao thức | Kong, AWS API Gateway, Envoy Gateway, Apigee |
| Ingress trong Kubernetes | Cả ba vai trên cho cụm Kubernetes | ingress-nginx, Traefik, các bản hiện thực Gateway API |

Trong phỏng vấn, vẽ **một hộp** ghi "LB / reverse proxy" là đủ, miễn là giải thích được nó làm những việc gì. Lưu ý: dự án ingress-nginx của cộng đồng Kubernetes đã thông báo ngừng phát triển; hướng mới là **Gateway API**.

**3. Bẫy: kết thúc TLS rồi đi tiếp bằng văn bản thuần**

"Kết thúc SSL" nghĩa là đoạn từ proxy tới backend có thể không mã hóa. Thời bản gốc viết, mạng nội bộ được coi là tin cậy. Đến 2026, xu hướng **zero trust** coi mạng nội bộ cũng không an toàn: nhiều hệ thống **mã hóa lại** từ proxy tới backend, hoặc dùng **mTLS** (xác thực hai chiều) giữa các dịch vụ, thường do service mesh (Istio, Linkerd) tự làm. Với dữ liệu nhạy cảm (thanh toán, y tế), các chuẩn tuân thủ thường yêu cầu mã hóa cả trong nội bộ. Còn "SSL" hiện nay thực chất là TLS - SSL đã lỗi thời và không còn được dùng.

**4. Các bẫy vận hành hay gặp**

- **Mất IP thật của client**: backend chỉ thấy IP của proxy. Proxy phải thêm header `X-Forwarded-For` (hoặc chuẩn `Forwarded`), hoặc dùng PROXY protocol ở tầng 4. Ngược lại, **backend không được tin header này từ bất kỳ ai** - chỉ tin khi nó do proxy của mình thêm vào, nếu không kẻ tấn công tự điền IP giả để lách giới hạn tần suất hoặc danh sách chặn IP.
- **Thời gian chờ (timeout) lệch nhau**: proxy chờ 60 giây, backend xử lý 90 giây → người dùng nhận 504 trong khi backend vẫn tiếp tục làm (và có thể làm thành công). Timeout nên giảm dần từ ngoài vào trong.
- **Lỗi 502 khi keep-alive lệch nhau**: backend đóng kết nối rảnh sớm hơn proxy, proxy gửi request vào kết nối vừa bị đóng. Quy tắc: thời gian giữ kết nối rảnh của backend phải **dài hơn** của proxy.
- **Tấn công lén lút request (HTTP request smuggling)**: proxy và backend hiểu ranh giới của một request khác nhau (do xử lý `Content-Length` và `Transfer-Encoding` khác nhau), kẻ tấn công nhét một request ẩn vào. Giữ phần mềm cập nhật và dùng HTTP/2 tới backend khi có thể giúp giảm rủi ro.
- **Header `Host` sai**: proxy chuyển tiếp mà không giữ `Host` gốc, ứng dụng sinh link hoặc redirect sai tên miền.

**5. Đệm request (buffering) - lợi ích bản gốc không nói**

Một lợi ích lớn của NGINX trước ứng dụng: nó **đệm toàn bộ request và phản hồi**. Client mạng chậm (điện thoại 3G) tải lên chậm hay tải xuống chậm thì NGINX gánh, luồng xử lý của ứng dụng được giải phóng ngay. Với máy chủ ứng dụng mỗi luồng một request (nhiều máy chủ Python/Ruby truyền thống), điều này quyết định chịu được bao nhiêu người dùng đồng thời. Ngược lại, với luồng dữ liệu thời gian thực (SSE, streaming) phải **tắt** đệm, không thì client nhận dữ liệu theo cục.

**6. Nối với các mục khác**

- [Bộ cân bằng tải](03-load-balancer.md) - phần lớn bộ cân bằng tải tầng 7 là proxy ngược có thêm chức năng chia tải.
- [CDN](02-cdn.md) - CDN hiện đại là proxy ngược phân tán toàn cầu, làm các việc cache, nén, TLS ở gần người dùng.
- [Cache](07-cache.md) - proxy ngược là một tầng cache (ví dụ cache của NGINX, Varnish).
- [Các mẫu sẵn sàng](../01-danh-doi/05-availability-patterns.md) - cách giải quyết nhược điểm điểm lỗi đơn.
- [Bảo mật](10-security.md) - giới hạn tần suất, chặn IP, TLS.
- [Tầng ứng dụng](05-application-layer.md) - mục kế tiếp; tách tầng web (proxy) khỏi tầng ứng dụng.

**7. Câu hỏi nên tự hỏi trong buổi phỏng vấn system design**

- Chỉ có một máy chủ ứng dụng thì có cần proxy ngược không? (Có - TLS, nén, file tĩnh, đệm client chậm đều là lý do chính đáng.)
- TLS kết thúc ở đâu, và đoạn còn lại từ đó vào trong có được mã hóa không?
- Những việc cắt ngang như xác thực, giới hạn tần suất, ghi log nên làm ở proxy hay trong từng dịch vụ? (Làm ở proxy thì một chỗ, nhưng proxy thành nơi chứa logic nghiệp vụ.)
- Proxy có giữ trạng thái gì không - cache, phiên? (Không giữ thì nhân bản dễ; có thì phải tính chuyện đồng bộ.)

Đối chiếu README gốc của repo:
- [Reverse proxy (web server)](../../README.md#reverse-proxy-web-server)
- [Application layer](../../README.md#application-layer) - mục kế tiếp
