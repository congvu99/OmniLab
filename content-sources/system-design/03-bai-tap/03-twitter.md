---
nguon: The System Design Primer - bài giải "Design the Twitter timeline and search"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../solutions/system_design/twitter/README.md
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Thiết kế timeline và tìm kiếm của Twitter

## Nội dung gốc

*Lưu ý: Tài liệu này liên kết trực tiếp tới các phần liên quan trong [các chủ đề system design](../../README.md#index-of-system-design-topics) để tránh lặp lại. Hãy tham khảo nội dung được liên kết để nắm các điểm thảo luận chung, các đánh đổi (tradeoff) và phương án thay thế.*

**Thiết kế news feed của Facebook** và **Thiết kế chức năng tìm kiếm của Facebook** là những câu hỏi tương tự.

## Bước 1: Phác thảo các trường hợp sử dụng và ràng buộc

> Thu thập yêu cầu và khoanh vùng bài toán.
> Đặt câu hỏi để làm rõ các trường hợp sử dụng (use case) và ràng buộc (constraint).
> Thảo luận các giả định.

Vì không có người phỏng vấn để trả lời các câu hỏi làm rõ, chúng ta sẽ tự định nghĩa một số trường hợp sử dụng và ràng buộc.

### Các trường hợp sử dụng

#### Chúng ta khoanh vùng bài toán, chỉ xử lý các trường hợp sử dụng sau

* **Người dùng** đăng một tweet
    * **Dịch vụ** đẩy tweet tới những người theo dõi (follower), gửi thông báo đẩy (push notification) và email
* **Người dùng** xem user timeline (hoạt động của chính người dùng đó)
* **Người dùng** xem home timeline (hoạt động của những người mà người dùng đang theo dõi)
* **Người dùng** tìm kiếm theo từ khóa
* **Dịch vụ** có tính sẵn sàng cao (high availability)

#### Ngoài phạm vi

* **Dịch vụ** đẩy tweet vào Twitter Firehose và các luồng (stream) khác
* **Dịch vụ** lọc bỏ tweet dựa trên thiết lập hiển thị của người dùng
    * Ẩn @reply nếu người dùng không đồng thời theo dõi người được trả lời
    * Tôn trọng thiết lập "ẩn retweet"
* Phân tích số liệu (analytics)

### Ràng buộc và giả định

#### Nêu các giả định

Chung

* Lưu lượng truy cập không phân bố đều
* Đăng tweet phải nhanh
    * Phát tán (fan out) một tweet tới tất cả follower phải nhanh, trừ khi bạn có hàng triệu follower
* 100 triệu người dùng hoạt động
* 500 triệu tweet mỗi ngày, tức 15 tỷ tweet mỗi tháng
    * Trung bình mỗi tweet được phát tán tới 10 nơi nhận
    * Tổng cộng 5 tỷ lượt giao tweet qua fan-out mỗi ngày
    * 150 tỷ lượt giao tweet qua fan-out mỗi tháng
* 250 tỷ yêu cầu đọc mỗi tháng
* 10 tỷ lượt tìm kiếm mỗi tháng

Timeline

* Xem timeline phải nhanh
* Twitter đọc nhiều hơn ghi (read heavy)
    * Tối ưu cho việc đọc tweet nhanh
* Việc tiếp nhận (ingest) tweet thì nặng về ghi (write heavy)

Tìm kiếm

* Tìm kiếm phải nhanh
* Tìm kiếm nặng về đọc

#### Tính toán mức sử dụng

**Hãy hỏi rõ người phỏng vấn xem bạn có nên thực hiện các phép ước lượng nhanh (back-of-the-envelope) hay không.**

* Kích thước mỗi tweet:
    * `tweet_id` - 8 byte
    * `user_id` - 32 byte
    * `text` - 140 byte
    * `media` - trung bình 10 KB
    * Tổng: ~10 KB
* 150 TB nội dung tweet mới mỗi tháng
    * 10 KB mỗi tweet * 500 triệu tweet mỗi ngày * 30 ngày mỗi tháng
    * 5,4 PB nội dung tweet mới trong 3 năm
* 100 nghìn yêu cầu đọc mỗi giây
    * 250 tỷ yêu cầu đọc mỗi tháng * (400 yêu cầu mỗi giây / 1 tỷ yêu cầu mỗi tháng)
* 6.000 tweet mỗi giây
    * 15 tỷ tweet mỗi tháng * (400 yêu cầu mỗi giây / 1 tỷ yêu cầu mỗi tháng)
* 60 nghìn lượt giao tweet qua fan-out mỗi giây
    * 150 tỷ lượt giao tweet qua fan-out mỗi tháng * (400 yêu cầu mỗi giây / 1 tỷ yêu cầu mỗi tháng)
* 4.000 yêu cầu tìm kiếm mỗi giây
    * 10 tỷ lượt tìm kiếm mỗi tháng * (400 yêu cầu mỗi giây / 1 tỷ yêu cầu mỗi tháng)

Bảng quy đổi tiện dụng:

* 2,5 triệu giây mỗi tháng
* 1 yêu cầu mỗi giây = 2,5 triệu yêu cầu mỗi tháng
* 40 yêu cầu mỗi giây = 100 triệu yêu cầu mỗi tháng
* 400 yêu cầu mỗi giây = 1 tỷ yêu cầu mỗi tháng

## Bước 2: Tạo thiết kế tổng quan

> Phác thảo thiết kế tổng quan (high level design) với tất cả các thành phần quan trọng.

![Thiết kế tổng quan Twitter](../../solutions/system_design/twitter/twitter_basic.png)

## Bước 3: Thiết kế các thành phần cốt lõi

> Đi sâu vào chi tiết từng thành phần cốt lõi.

### Trường hợp sử dụng: Người dùng đăng một tweet

Chúng ta có thể lưu các tweet của chính người dùng để dựng user timeline (hoạt động của người dùng) trong một [cơ sở dữ liệu quan hệ (relational database)](../02-chu-de/06-database.md). Chúng ta nên thảo luận về [các trường hợp sử dụng và đánh đổi giữa việc chọn SQL hay NoSQL](../02-chu-de/06-database.md).

Việc giao tweet và dựng home timeline (hoạt động của những người mà người dùng đang theo dõi) khó hơn. Phát tán tweet tới tất cả follower (60 nghìn lượt giao tweet qua fan-out mỗi giây) sẽ làm quá tải một [cơ sở dữ liệu quan hệ](../02-chu-de/06-database.md) truyền thống. Có lẽ chúng ta sẽ muốn chọn một kho dữ liệu ghi nhanh như **cơ sở dữ liệu NoSQL** hoặc **bộ nhớ đệm trong RAM (Memory Cache)**. Đọc tuần tự 1 MB từ bộ nhớ mất khoảng 250 micro giây, trong khi đọc từ SSD lâu hơn 4 lần và từ ổ đĩa cứng lâu hơn 80 lần.<sup><a href=../../README.md#latency-numbers-every-programmer-should-know>1</a></sup>

Chúng ta có thể lưu media như ảnh hoặc video trên một **kho lưu trữ đối tượng (Object Store)**.

* **Client** gửi một tweet tới **Web Server**, vốn đang chạy như một [reverse proxy](../02-chu-de/04-reverse-proxy.md)
* **Web Server** chuyển tiếp yêu cầu tới máy chủ **Write API**
* **Write API** lưu tweet vào user timeline của người dùng trên một **cơ sở dữ liệu SQL**
* **Write API** liên hệ với **Fan Out Service**, dịch vụ này thực hiện các việc sau:
    * Truy vấn **User Graph Service** để tìm các follower của người dùng, được lưu trong **Memory Cache**
    * Lưu tweet vào *home timeline của các follower* trong một **Memory Cache**
        * Thao tác O(n): 1.000 follower = 1.000 lần tra cứu và chèn
    * Lưu tweet vào **Search Index Service** để hỗ trợ tìm kiếm nhanh
    * Lưu media vào **Object Store**
    * Dùng **Notification Service** để gửi thông báo đẩy tới các follower:
        * Dùng một **hàng đợi (Queue)** (không có trong hình) để gửi thông báo một cách bất đồng bộ

**Hãy hỏi rõ người phỏng vấn bạn cần viết bao nhiêu code**.

Nếu **Memory Cache** của chúng ta là Redis, ta có thể dùng kiểu list gốc của Redis với cấu trúc sau:

```
           tweet n+2                   tweet n+1                   tweet n
| 8 bytes   8 bytes  1 byte | 8 bytes   8 bytes  1 byte | 8 bytes   8 bytes  1 byte |
| tweet_id  user_id  meta   | tweet_id  user_id  meta   | tweet_id  user_id  meta   |
```

Tweet mới sẽ được đặt vào **Memory Cache**, nơi dựng nên home timeline của người dùng (hoạt động của những người mà người dùng đang theo dõi).

Chúng ta sẽ dùng một [**REST API**](../02-chu-de/09-communication.md) công khai:

```
$ curl -X POST --data '{ "user_id": "123", "auth_token": "ABC123", \
    "status": "hello world!", "media_ids": "ABC987" }' \
    https://twitter.com/api/v1/tweet
```

Phản hồi:

```
{
    "created_at": "Wed Sep 05 00:37:15 +0000 2012",
    "status": "hello world!",
    "tweet_id": "987",
    "user_id": "123",
    ...
}
```

Với giao tiếp nội bộ, chúng ta có thể dùng [lời gọi thủ tục từ xa (Remote Procedure Call - RPC)](../02-chu-de/09-communication.md).

### Trường hợp sử dụng: Người dùng xem home timeline

* **Client** gửi yêu cầu xem home timeline tới **Web Server**
* **Web Server** chuyển tiếp yêu cầu tới máy chủ **Read API**
* Máy chủ **Read API** liên hệ với **Timeline Service**, dịch vụ này thực hiện các việc sau:
    * Lấy dữ liệu timeline lưu trong **Memory Cache**, gồm các tweet id và user id - O(1)
    * Truy vấn **Tweet Info Service** bằng một lệnh [multiget](http://redis.io/commands/mget) để lấy thêm thông tin về các tweet id - O(n)
    * Truy vấn **User Info Service** bằng một lệnh multiget để lấy thêm thông tin về các user id - O(n)

REST API:

```
$ curl https://twitter.com/api/v1/home_timeline?user_id=123
```

Phản hồi:

```
{
    "user_id": "456",
    "tweet_id": "123",
    "status": "foo"
},
{
    "user_id": "789",
    "tweet_id": "456",
    "status": "bar"
},
{
    "user_id": "789",
    "tweet_id": "579",
    "status": "baz"
},
```

### Trường hợp sử dụng: Người dùng xem user timeline

* **Client** gửi yêu cầu xem user timeline tới **Web Server**
* **Web Server** chuyển tiếp yêu cầu tới máy chủ **Read API**
* **Read API** lấy user timeline từ **cơ sở dữ liệu SQL**

REST API sẽ tương tự home timeline, chỉ khác là mọi tweet đều đến từ chính người dùng thay vì từ những người mà người dùng đang theo dõi.

### Trường hợp sử dụng: Người dùng tìm kiếm theo từ khóa

* **Client** gửi yêu cầu tìm kiếm tới **Web Server**
* **Web Server** chuyển tiếp yêu cầu tới máy chủ **Search API**
* **Search API** liên hệ với **Search Service**, dịch vụ này thực hiện các việc sau:
    * Phân tích cú pháp/tách token (parse/tokenize) truy vấn đầu vào, xác định những gì cần tìm
        * Loại bỏ markup
        * Tách văn bản thành các từ (term)
        * Sửa lỗi chính tả
        * Chuẩn hóa chữ hoa chữ thường
        * Chuyển truy vấn sang dạng dùng các phép toán boolean
    * Truy vấn **Search Cluster** (ví dụ [Lucene](https://lucene.apache.org/)) để lấy kết quả:
        * [Scatter gather](../../README.md#under-development) tới từng máy chủ trong cụm để xác định có kết quả nào cho truy vấn không
        * Gộp (merge), xếp hạng (rank), sắp xếp (sort) và trả về kết quả

REST API:

```
$ curl https://twitter.com/api/v1/search?query=hello+world
```

Phản hồi sẽ tương tự home timeline, chỉ khác là gồm các tweet khớp với truy vấn đã cho.

## Bước 4: Mở rộng thiết kế

> Xác định và xử lý các điểm nghẽn (bottleneck), dựa trên các ràng buộc.

![Thiết kế Twitter sau khi mở rộng](../../solutions/system_design/twitter/twitter.png)

**Quan trọng: Đừng nhảy thẳng từ thiết kế ban đầu sang thiết kế cuối cùng!**

Hãy nói rằng bạn sẽ 1) **Benchmark/kiểm thử tải (Load Test)**, 2) **Profile** để tìm điểm nghẽn, 3) xử lý các điểm nghẽn trong khi đánh giá các phương án thay thế và đánh đổi, và 4) lặp lại. Xem [Thiết kế một hệ thống mở rộng tới hàng triệu người dùng trên AWS](02-scaling-aws.md) để có ví dụ về cách mở rộng thiết kế ban đầu theo từng bước lặp.

Điều quan trọng là thảo luận những điểm nghẽn bạn có thể gặp với thiết kế ban đầu và cách xử lý từng điểm. Ví dụ, việc thêm một **bộ cân bằng tải (Load Balancer)** với nhiều **Web Server** giải quyết được vấn đề gì? **CDN**? **Bản sao Master-Slave (Master-Slave Replicas)**? Mỗi thứ có những phương án thay thế và **đánh đổi** nào?

Chúng ta sẽ đưa vào một số thành phần để hoàn thiện thiết kế và xử lý các vấn đề về khả năng mở rộng. Các bộ cân bằng tải nội bộ không được vẽ ra để hình đỡ rối.

*Để tránh lặp lại các thảo luận*, hãy tham khảo các [chủ đề system design](../../README.md#index-of-system-design-topics) sau để nắm các điểm thảo luận chính, đánh đổi và phương án thay thế:

* [DNS](../02-chu-de/01-dns.md)
* [CDN](../02-chu-de/02-cdn.md)
* [Bộ cân bằng tải (Load balancer)](../02-chu-de/03-load-balancer.md)
* [Mở rộng theo chiều ngang (Horizontal scaling)](../02-chu-de/03-load-balancer.md)
* [Web server (reverse proxy)](../02-chu-de/04-reverse-proxy.md)
* [API server (tầng ứng dụng - application layer)](../02-chu-de/05-application-layer.md)
* [Bộ nhớ đệm (Cache)](../02-chu-de/07-cache.md)
* [Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS)](../02-chu-de/06-database.md)
* [Fail-over master-slave cho SQL ghi](../01-danh-doi/05-availability-patterns.md)
* [Nhân bản master-slave (Master-slave replication)](../02-chu-de/06-database.md)
* [Các mẫu nhất quán (Consistency patterns)](../01-danh-doi/04-consistency-patterns.md)
* [Các mẫu sẵn sàng (Availability patterns)](../01-danh-doi/05-availability-patterns.md)

**Fanout Service** là một điểm nghẽn tiềm năng. Những người dùng Twitter có hàng triệu follower có thể mất vài phút để tweet của họ đi hết quá trình fan-out. Điều này có thể dẫn tới tình trạng tranh chấp (race condition) với các @reply cho tweet đó, mà ta có thể giảm thiểu bằng cách sắp xếp lại thứ tự tweet tại thời điểm phục vụ (serve time).

Chúng ta cũng có thể tránh fan-out tweet của những người dùng có rất nhiều follower. Thay vào đó, ta có thể tìm kiếm để lấy tweet của những người dùng này, gộp kết quả tìm kiếm với kết quả home timeline của người dùng, rồi sắp xếp lại thứ tự tweet tại thời điểm phục vụ.

Các tối ưu bổ sung gồm:

* Chỉ giữ vài trăm tweet cho mỗi home timeline trong **Memory Cache**
* Chỉ giữ thông tin home timeline của người dùng đang hoạt động trong **Memory Cache**
    * Nếu một người dùng không hoạt động trong 30 ngày qua, ta có thể dựng lại timeline từ **cơ sở dữ liệu SQL**
        * Truy vấn **User Graph Service** để xác định người dùng đang theo dõi những ai
        * Lấy tweet từ **cơ sở dữ liệu SQL** và thêm vào **Memory Cache**
* Chỉ lưu tweet của một tháng trong **Tweet Info Service**
* Chỉ lưu người dùng đang hoạt động trong **User Info Service**
* **Search Cluster** nhiều khả năng cần giữ tweet trong bộ nhớ để giữ độ trễ thấp

Chúng ta cũng sẽ muốn xử lý điểm nghẽn ở **cơ sở dữ liệu SQL**.

Mặc dù **Memory Cache** sẽ giảm tải cho cơ sở dữ liệu, nhưng khó mà chỉ riêng các **bản sao đọc SQL (SQL Read Replicas)** là đủ để xử lý các lần trượt cache (cache miss). Có lẽ chúng ta cần áp dụng thêm các mẫu mở rộng SQL khác.

Lượng ghi lớn sẽ làm quá tải một cụm **SQL Write Master-Slave** duy nhất, điều này cũng cho thấy cần thêm các kỹ thuật mở rộng:

* [Liên hợp (Federation)](../02-chu-de/06-database.md)
* [Phân mảnh (Sharding)](../02-chu-de/06-database.md)
* [Phi chuẩn hóa (Denormalization)](../02-chu-de/06-database.md)
* [Tinh chỉnh SQL (SQL Tuning)](../02-chu-de/06-database.md)

Chúng ta cũng nên cân nhắc chuyển một phần dữ liệu sang **cơ sở dữ liệu NoSQL**.

## Các điểm thảo luận bổ sung

> Các chủ đề bổ sung để đi sâu, tùy theo phạm vi bài toán và thời gian còn lại.

#### NoSQL

* [Kho khóa-giá trị (Key-value store)](../02-chu-de/06-database.md)
* [Kho tài liệu (Document store)](../02-chu-de/06-database.md)
* [Kho cột rộng (Wide column store)](../02-chu-de/06-database.md)
* [Cơ sở dữ liệu đồ thị (Graph database)](../02-chu-de/06-database.md)
* [SQL hay NoSQL](../02-chu-de/06-database.md)

### Bộ nhớ đệm (Caching)

* Cache ở đâu
    * [Cache phía client (Client caching)](../02-chu-de/07-cache.md)
    * [Cache ở CDN (CDN caching)](../02-chu-de/07-cache.md)
    * [Cache ở web server (Web server caching)](../02-chu-de/07-cache.md)
    * [Cache ở cơ sở dữ liệu (Database caching)](../02-chu-de/07-cache.md)
    * [Cache ở tầng ứng dụng (Application caching)](../02-chu-de/07-cache.md)
* Cache cái gì
    * [Cache ở mức truy vấn cơ sở dữ liệu](../02-chu-de/07-cache.md)
    * [Cache ở mức đối tượng](../02-chu-de/07-cache.md)
* Khi nào cập nhật cache
    * [Cache-aside](../02-chu-de/07-cache.md)
    * [Write-through](../02-chu-de/07-cache.md)
    * [Write-behind (write-back)](../02-chu-de/07-cache.md)
    * [Refresh ahead](../02-chu-de/07-cache.md)

### Bất đồng bộ và microservices

* [Hàng đợi thông điệp (Message queues)](../02-chu-de/08-asynchronism.md)
* [Hàng đợi tác vụ (Task queues)](../02-chu-de/08-asynchronism.md)
* [Áp lực ngược (Back pressure)](../02-chu-de/08-asynchronism.md)
* [Microservices](../02-chu-de/05-application-layer.md)

### Giao tiếp

* Thảo luận các đánh đổi:
    * Giao tiếp bên ngoài với client - [HTTP API theo kiểu REST](../02-chu-de/09-communication.md)
    * Giao tiếp nội bộ - [RPC](../02-chu-de/09-communication.md)
* [Khám phá dịch vụ (Service discovery)](../02-chu-de/05-application-layer.md)

### Bảo mật

Tham khảo [mục bảo mật](../02-chu-de/10-security.md).

### Các con số độ trễ

Xem [Các con số độ trễ mà mọi lập trình viên nên biết (Latency numbers every programmer should know)](../../README.md#latency-numbers-every-programmer-should-know).

### Liên tục

* Tiếp tục benchmark và giám sát hệ thống để xử lý các điểm nghẽn khi chúng xuất hiện
* Mở rộng là một quá trình lặp đi lặp lại

---

## Ghi chú của người dịch

**1. Fan-out on write (push) và fan-out on read (pull) - trọng tâm của bài này**

Thiết kế trong bài gốc là **fan-out on write**: khi có tweet mới, hệ thống ghi ngay tweet id vào home timeline (trong cache) của từng follower. Cách ngược lại là **fan-out on read**: không ghi gì trước, khi người dùng mở home timeline thì mới đi lấy tweet mới nhất của từng người họ theo dõi rồi gộp lại.

| Tiêu chí | Fan-out on write (push) | Fan-out on read (pull) |
|---|---|---|
| Chi phí khi đăng tweet | O(số follower) lần ghi | O(1) |
| Chi phí khi đọc timeline | O(1) - đọc sẵn một list | O(số người đang theo dõi) truy vấn + gộp + sắp xếp |
| Độ trễ đọc | Rất thấp, ổn định | Cao hơn, dao động |
| Lãng phí | Ghi cả cho người không bao giờ mở app | Không ghi thừa |
| Phù hợp khi | Đọc nhiều hơn ghi rất nhiều (đúng với Twitter theo giả định của bài: 250 tỷ đọc vs 15 tỷ tweet mỗi tháng) | Người dùng ít hoạt động, hoặc tài khoản có quá nhiều follower |

Câu trả lời mà người phỏng vấn thường chờ đợi là **mô hình lai (hybrid)** - chính là ý ở Bước 4 của bài gốc: fan-out on write cho người dùng thường, fan-out on read cho tài khoản nổi tiếng, rồi gộp hai nguồn ở thời điểm phục vụ.

**2. Vấn đề người nổi tiếng (celebrity problem / hot key)**

Một tài khoản có hàng chục triệu follower đăng tweet thì fan-out on write sinh ra hàng chục triệu lần ghi cho một sự kiện. Hệ quả: hàng đợi fan-out bị dồn, tweet tới follower chậm vài phút (bài gốc có nhắc), và reply có thể tới trước tweet gốc. Các điểm nên nói thêm:

- Đặt **ngưỡng số follower** để phân loại tài khoản "nổi tiếng" - không fan-out, mà khi đọc thì kéo tweet của họ và gộp vào. Ngưỡng là một tham số tinh chỉnh bằng đo đạc, không có con số chuẩn.
- Fan-out cho tài khoản lớn nên chạy nền, **chia nhỏ theo lô** và ưu tiên follower đang online trước.
- Phía đọc cũng có hot key: tweet của người nổi tiếng được hàng triệu người đọc cùng lúc, cần cache nhiều bản sao hoặc cache cục bộ trên từng máy chủ ứng dụng để không dồn vào một node cache.
- Chỉ fan-out cho **người dùng đang hoạt động** (bài gốc đã gợi ý giữ timeline cho người hoạt động trong 30 ngày) - giảm đáng kể số lần ghi thừa.

**3. Những chỗ bài gốc đơn giản hóa hoặc đã lỗi thời**

- **Giới hạn 140 ký tự** đã được Twitter nâng lên 280 từ năm 2017, và nền tảng (nay là X) còn cho tài khoản trả phí đăng bài dài hơn nhiều. Ước lượng kích thước vẫn chấp nhận được vì phần media 10 KB chiếm gần hết dung lượng.
- **`user_id` 32 byte** là con số khá dư; thực tế id thường là số nguyên 64 bit (8 byte). Twitter công bố thuật toán **Snowflake** để sinh id 64 bit có thứ tự theo thời gian (timestamp + id máy + số thứ tự), nhờ đó sắp xếp tweet theo id cũng là sắp xếp theo thời gian - rất tiện cho việc gộp timeline. Đây là câu hỏi phụ hay gặp: "sinh tweet id duy nhất trên nhiều máy như thế nào?".
- **Media không đi qua Fan Out Service** trong thực tế: client thường tải media trực tiếp lên object store (S3, GCS...) qua URL ký sẵn (pre-signed URL) trước, rồi mới gửi tweet kèm `media_ids` - đúng như ví dụ curl có trường `media_ids`. Media sau đó được phân phối qua CDN.
- **Timeline sắp xếp theo thời gian** là giả định của bài. Timeline "For you" hiện nay được xếp hạng bằng mô hình học máy: bước lấy ứng viên (candidate retrieval) từ cả người mình theo dõi lẫn ngoài mạng lưới, rồi xếp hạng và lọc. Nếu người phỏng vấn hỏi về ranking thì fan-out chỉ còn là một nguồn ứng viên.
- **Tìm kiếm qua Lucene**: bài gốc dùng Lucene đúng tinh thần; ngày nay thường là Elasticsearch hoặc OpenSearch (đều dựa trên Lucene). Điểm nên nói thêm là tìm kiếm tweet cần **gần thời gian thực** - index được ghi qua một hàng đợi/luồng sự kiện (ví dụ Kafka) và phân mảnh theo thời gian để phần dữ liệu mới, được truy vấn nhiều nhất, nằm trên các node nóng.
- **Liên kết "Scatter gather"** trong bài gốc trỏ tới mục "Under development" - README gốc chưa viết phần này. Ý tưởng: gửi truy vấn song song tới mọi shard của index, mỗi shard trả top-k cục bộ, rồi một node gộp lại. Độ trễ tổng bị quyết định bởi shard chậm nhất (tail latency), nên hay đi kèm các kỹ thuật như gửi yêu cầu dự phòng (hedged request) hoặc trả kết quả một phần khi hết thời gian chờ.

**4. Công cụ tương đương hiện đại (tham khảo, không phải lựa chọn duy nhất)**

| Thành phần trong bài | Lựa chọn phổ biến hiện nay |
|---|---|
| Memory Cache chứa home timeline | Redis / Valkey (list hoặc sorted set theo tweet id), cụm có phân mảnh |
| Hàng đợi fan-out, thông báo | Kafka, Amazon SQS/SNS, Google Pub/Sub |
| Lưu tweet quy mô lớn | Cơ sở dữ liệu wide-column (Cassandra, ScyllaDB) hoặc MySQL/PostgreSQL phân mảnh (Vitess, Citus) |
| User graph | Bảng quan hệ follow được phân mảnh theo user id, có cache; cơ sở dữ liệu đồ thị hiếm khi cần cho truy vấn một bước "ai theo dõi ai" |
| Search Cluster | Elasticsearch / OpenSearch |
| Object Store + CDN | S3 / GCS / R2 + CloudFront / Cloudflare / Fastly |
| Thông báo đẩy | APNs (iOS), FCM (Android) phía sau Notification Service |

**5. Câu hỏi thường bị hỏi thêm trong phỏng vấn**

- Home timeline trong Redis bị mất (node chết) thì sao? - Cache chỉ là dữ liệu dẫn xuất, dựng lại được từ user graph + kho tweet (bài gốc đã mô tả quy trình dựng lại cho người dùng không hoạt động). Cần nói rõ đây là nguồn phụ, không phải nguồn sự thật.
- Người dùng xóa tweet hoặc hủy theo dõi thì sao? - Với fan-out on write, phải xóa id khỏi nhiều timeline, hoặc đơn giản hơn là **lọc khi đọc** (bước multiget sẽ thấy tweet đã bị xóa và bỏ qua).
- Phân trang timeline thế nào? - Dùng con trỏ (cursor) dựa trên tweet id (`max_id`, `since_id`) thay vì offset, vì timeline liên tục có phần tử mới chèn lên đầu.
- Mức nhất quán cần thiết? - Timeline là AP điển hình: tweet đến trễ vài giây là chấp nhận được (xem [Định lý CAP](../01-danh-doi/03-cap-theorem.md) và [Các mẫu nhất quán](../01-danh-doi/04-consistency-patterns.md)). Riêng user timeline của chính người đăng nên đảm bảo đọc được bài mình vừa viết (read-your-writes).
- Ước lượng bộ nhớ cho cache timeline: số người dùng hoạt động * số tweet giữ lại * kích thước mỗi phần tử. Với cấu trúc 17 byte/tweet của bài gốc, 100 triệu người dùng * 800 tweet * 17 byte vào khoảng 1,4 TB - chưa tính overhead của Redis. Đây là phép tính tự làm dựa trên giả định của bài, tự thay số "vài trăm tweet" theo ý mình khi trình bày.

**6. Nối với các mục khác**

- Hàng đợi và xử lý bất đồng bộ cho fan-out: [Asynchronism](../00-nen-tang/04-asynchronism.md), [Bất đồng bộ](../02-chu-de/08-asynchronism.md).
- Cache home timeline: [Caches](../00-nen-tang/03-caches.md), [Bộ nhớ đệm](../02-chu-de/07-cache.md).
- Phân mảnh, liên hợp, phi chuẩn hóa: [Databases](../00-nen-tang/02-databases.md), [Cơ sở dữ liệu](../02-chu-de/06-database.md).
- Đọc nhiều hơn ghi nên tối ưu đường đọc - liên hệ [Độ trễ và thông lượng](../01-danh-doi/02-latency-vs-throughput.md).
