---
nguon: The System Design Primer - mục "Application layer"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../README.md#application-layer
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Tầng ứng dụng (Application Layer)

## Nội dung gốc

<p align="center">
  <img src="../../images/yB5SYwm.png" alt="Sơ đồ tách tầng web và tầng ứng dụng">
  <br/>
  <i>Nguồn: <a href="http://lethain.com/introduction-to-architecting-systems-for-scale/#platform_layer">Intro to architecting systems for scale</a></i>
</p>

Tách tầng web (web layer) khỏi tầng ứng dụng (application layer, còn gọi là tầng nền tảng - platform layer) cho phép bạn mở rộng và cấu hình hai tầng này một cách độc lập. Thêm một API mới đồng nghĩa với thêm máy chủ ứng dụng, mà không nhất thiết phải thêm máy chủ web. **Nguyên tắc đơn trách nhiệm (single responsibility principle)** khuyến khích các dịch vụ nhỏ, tự chủ, phối hợp với nhau. Các nhóm nhỏ phụ trách các dịch vụ nhỏ có thể lên kế hoạch mạnh tay hơn cho tăng trưởng nhanh.

Các worker ở tầng ứng dụng cũng giúp hiện thực hóa [xử lý bất đồng bộ (asynchronism)](08-asynchronism.md).

### Microservices

Liên quan tới chủ đề này là [microservices](https://en.wikipedia.org/wiki/Microservices), có thể mô tả là một tập các dịch vụ nhỏ, dạng mô-đun, triển khai được độc lập. Mỗi dịch vụ chạy một tiến trình riêng và giao tiếp qua một cơ chế nhẹ, được định nghĩa rõ ràng, để phục vụ một mục tiêu nghiệp vụ. <sup><a href=https://smartbear.com/learn/api-design/what-are-microservices>1</a></sup>

Ví dụ, Pinterest có thể có các microservice sau: hồ sơ người dùng, người theo dõi, bảng tin (feed), tìm kiếm, tải ảnh lên, v.v.

### Khám phá dịch vụ (Service Discovery)

Các hệ thống như [Consul](https://www.consul.io/docs/index.html), [Etcd](https://coreos.com/etcd/docs/latest) và [Zookeeper](http://www.slideshare.net/sauravhaloi/introduction-to-apache-zookeeper) giúp các dịch vụ tìm thấy nhau bằng cách theo dõi tên, địa chỉ và cổng (port) đã được đăng ký. [Kiểm tra sức khỏe (health check)](https://www.consul.io/intro/getting-started/checks.html) giúp xác minh dịch vụ còn hoạt động đúng, và thường được thực hiện qua một endpoint [HTTP](09-communication.md). Cả Consul và Etcd đều có sẵn một [kho khóa - giá trị (key-value store)](06-database.md#kho-khóa---giá-trị-key-value-store), hữu ích để lưu giá trị cấu hình và các dữ liệu dùng chung khác.

### Nhược điểm: tầng ứng dụng

- Thêm một tầng ứng dụng gồm các dịch vụ liên kết lỏng (loosely coupled) đòi hỏi một cách tiếp cận khác về kiến trúc, vận hành và quy trình (so với một hệ thống nguyên khối - monolithic).
- Microservices có thể làm tăng độ phức tạp trong triển khai và vận hành.

### Nguồn và đọc thêm

- [Intro to architecting systems for scale](http://lethain.com/introduction-to-architecting-systems-for-scale)
- [Crack the system design interview](http://www.puncsky.com/blog/2016-02-13-crack-the-system-design-interview)
- [Service oriented architecture](https://en.wikipedia.org/wiki/Service-oriented_architecture)
- [Introduction to Zookeeper](http://www.slideshare.net/sauravhaloi/introduction-to-apache-zookeeper)
- [Here's what you need to know about building microservices](https://cloudncode.wordpress.com/2016/07/22/msa-getting-started/)

---

## Ghi chú của người dịch

**1. Bản gốc gộp hai ý khác nhau - tách ra mới hiểu đúng**

Mục này nói hai chuyện có liên quan nhưng không giống nhau:

- **Tách tầng web khỏi tầng ứng dụng**: tầng web lo phần "vỏ" (nhận kết nối, TLS, phục vụ tệp tĩnh, render trang), tầng ứng dụng lo logic nghiệp vụ. Hai tầng có đặc điểm tải khác nhau nên mở rộng riêng rẽ thì tiết kiệm hơn. Việc này làm được **ngay cả khi ứng dụng vẫn là một khối**.
- **Chia tầng ứng dụng thành microservices**: cắt logic nghiệp vụ theo miền (domain), mỗi phần triển khai độc lập. Đây là quyết định lớn hơn nhiều, và cái giá chủ yếu nằm ở tổ chức và vận hành, không nằm ở code.

Điều kiện chung cho cả hai: tầng ứng dụng phải **không giữ trạng thái (stateless)**, như đã bàn ở [Clones](../00-nen-tang/01-clones.md). Có vậy mới thêm, bớt máy chủ ứng dụng sau [bộ cân bằng tải](03-load-balancer.md) một cách tự do.

**2. Microservices năm 2026: hết thời "mặc định", quay về cân nhắc**

Sau khoảng một thập kỷ làm phong trào, cộng đồng đã tỉnh táo hơn:

- **Nguyên khối mô-đun (modular monolith)** thường là điểm khởi đầu hợp lý: một đơn vị triển khai, nhưng bên trong chia mô-đun theo miền với ranh giới rõ ràng. Khi một mô-đun thật sự cần mở rộng hoặc phát hành độc lập thì mới tách ra.
- Bài viết năm 2023 của nhóm Prime Video (Amazon) về việc gộp một hệ giám sát chất lượng video từ kiến trúc phân tán về một tiến trình để giảm chi phí là ví dụ hay được trích dẫn: kiến trúc phải theo bài toán, không theo mốt.
- **Định luật Conway**: kiến trúc hệ thống có xu hướng phản chiếu cấu trúc giao tiếp của tổ chức. Microservices chủ yếu giải quyết bài toán **nhiều nhóm cùng phát hành độc lập**. Một nhóm 5 người mà có 20 dịch vụ thường là dấu hiệu chia quá sớm.

| | Nguyên khối (có mô-đun) | Microservices |
|---|---|---|
| Triển khai | Một đơn vị, đơn giản | Nhiều đơn vị, cần CI/CD và hạ tầng tốt |
| Gọi giữa các phần | Gọi hàm trong tiến trình, nhanh, không lỗi mạng | Gọi qua mạng: độ trễ, timeout, thử lại |
| Giao dịch dữ liệu | Transaction cơ sở dữ liệu bình thường | Phải dùng saga, outbox, chấp nhận nhất quán cuối cùng |
| Mở rộng | Cả khối cùng mở rộng | Mở rộng riêng từng dịch vụ |
| Quan sát, gỡ lỗi | Một log, một stack trace | Cần distributed tracing (OpenTelemetry) |
| Hợp với | Nhóm nhỏ, sản phẩm đang tìm hướng | Nhiều nhóm, miền nghiệp vụ đã ổn định |

**3. Bẫy lớn nhất: "nguyên khối phân tán" (distributed monolith)**

Chia code thành nhiều dịch vụ nhưng chúng vẫn dùng chung một cơ sở dữ liệu, phải triển khai cùng lúc, hoặc gọi nhau đồng bộ thành chuỗi dài - đó là nhận đủ nhược điểm của cả hai kiểu mà không có ưu điểm nào. Dấu hiệu nhận biết:

- Sửa một tính năng phải phát hành đồng thời nhiều dịch vụ.
- Nhiều dịch vụ cùng đọc ghi chung một bảng.
- Một request đi qua một chuỗi dài lời gọi đồng bộ. Như đã tính ở [Các mẫu sẵn sàng](../01-danh-doi/05-availability-patterns.md), mỗi phụ thuộc nối tiếp là một phép nhân làm giảm độ sẵn sàng.

Nguyên tắc thường dùng: **mỗi dịch vụ sở hữu dữ liệu của riêng nó** (database per service), các dịch vụ khác chỉ truy cập qua API hoặc sự kiện.

**4. Khám phá dịch vụ hiện nay trông thế nào**

Bản gốc viết khi phải tự dựng Consul hay ZooKeeper. Hiện nay bức tranh đã khác:

- **Kubernetes** là môi trường phổ biến nhất, và nó có sẵn cơ chế khám phá dịch vụ: đối tượng Service cấp một tên DNS ổn định trỏ tới các pod phía sau. Bản thân Kubernetes lưu trạng thái cụm trong **etcd** - nên etcd vẫn rất quan trọng, chỉ là ít khi bạn dùng trực tiếp.
- **Service mesh** (Istio, Linkerd, hoặc proxy Envoy) đưa khám phá dịch vụ, mã hóa mTLS, thử lại, timeout và ngắt mạch ra khỏi code ứng dụng, đặt vào lớp hạ tầng.
- **Consul** vẫn được dùng, nhất là trong môi trường lai giữa máy ảo và container.
- **ZooKeeper** đang rút dần khỏi một số hệ sinh thái lớn: Apache Kafka đã chuyển sang cơ chế KRaft và bỏ hẳn ZooKeeper từ bản 4.0.
- Các link Etcd trong bản gốc (coreos.com) đã cũ, tài liệu hiện nằm tại etcd.io.

**5. Kiểm tra sức khỏe: phân biệt cho đúng**

Bản gốc chỉ nói "health check qua HTTP endpoint", nhưng thực tế có ít nhất hai loại, và nhầm lẫn giữa chúng là nguyên nhân của nhiều sự cố:

- **Liveness**: tiến trình còn sống không? Sai thì khởi động lại. Không nên kiểm tra phụ thuộc bên ngoài ở đây - nếu cơ sở dữ liệu chết mà liveness lại kiểm tra cơ sở dữ liệu, toàn bộ máy chủ ứng dụng sẽ bị khởi động lại liên tục, làm sự cố tệ hơn.
- **Readiness**: đã sẵn sàng nhận lưu lượng chưa? Sai thì tạm rút khỏi bộ cân bằng tải, không khởi động lại. Dùng khi đang khởi động, đang làm ấm cache, hoặc đang quá tải.

Kubernetes có sẵn cả hai loại probe này (cùng startup probe), còn gRPC có giao thức health checking chuẩn riêng.

**6. Nối với các mục khác**

- [Clones](../00-nen-tang/01-clones.md): điều kiện không trạng thái để nhân bản máy chủ ứng dụng.
- [Bộ cân bằng tải](03-load-balancer.md) và [Reverse proxy](04-reverse-proxy.md): đứng trước tầng web và tầng ứng dụng, phân phối lưu lượng tới các bản sao.
- [Xử lý bất đồng bộ](08-asynchronism.md): các worker ở tầng ứng dụng lấy việc từ hàng đợi; đây cũng là cách giảm phụ thuộc đồng bộ giữa các microservice.
- [Giao tiếp](09-communication.md): HTTP, REST, RPC - các "cơ chế nhẹ, định nghĩa rõ ràng" mà microservices dùng để nói chuyện với nhau.
- [Cơ sở dữ liệu](06-database.md): mục kế tiếp, nơi bàn chuyện chia dữ liệu - thứ khó nhất khi tách dịch vụ.

**7. Câu hỏi nên tự hỏi trong buổi phỏng vấn system design**

- Có thật sự cần microservices không, hay tách tầng web và tầng ứng dụng, cộng thêm worker bất đồng bộ là đủ? (Người phỏng vấn thường đánh giá cao việc biện minh được lựa chọn đơn giản.)
- Ranh giới dịch vụ đặt theo đâu? (Theo miền nghiệp vụ và quyền sở hữu dữ liệu, không theo tầng kỹ thuật.)
- Các dịch vụ gọi nhau đồng bộ hay qua sự kiện? Chuỗi gọi đồng bộ dài nhất là bao nhiêu bước?
- Khi một dịch vụ chậm, điều gì ngăn nó kéo sập cả hệ thống? (Timeout, ngắt mạch, giới hạn tải.)
- Dịch vụ tìm thấy nhau bằng cách nào, và làm sao biết một bản sao đã hỏng để rút nó ra?

Đối chiếu README gốc của repo:
- [Application layer](../../README.md#application-layer)
- [Database](../../README.md#database) - mục kế tiếp
