---
nguon: The System Design Primer - bài giải "Design Amazon's sales rank by category feature"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../solutions/system_design/sales_rank/README.md
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Thiết kế tính năng xếp hạng bán chạy theo danh mục của Amazon (sales rank)

## Nội dung gốc

*Lưu ý: Tài liệu này liên kết trực tiếp tới các phần liên quan trong [danh mục chủ đề system design](../../README.md#index-of-system-design-topics) để tránh lặp lại. Hãy tham khảo nội dung được liên kết để nắm các ý thảo luận chung, các đánh đổi (tradeoff) và phương án thay thế.*

### Bước 1: Phác thảo use case và ràng buộc

> Thu thập yêu cầu và xác định phạm vi bài toán.
> Đặt câu hỏi để làm rõ use case và ràng buộc.
> Thảo luận các giả định.

Vì không có người phỏng vấn để trả lời các câu hỏi làm rõ, ta sẽ tự định nghĩa một số use case và ràng buộc.

#### Use case

##### Ta giới hạn bài toán chỉ xử lý các use case sau

* **Dịch vụ (Service)** tính toán các sản phẩm phổ biến nhất trong tuần qua theo từng danh mục
* **Người dùng (User)** xem các sản phẩm phổ biến nhất trong tuần qua theo từng danh mục
* **Dịch vụ** có tính sẵn sàng cao (high availability)

##### Ngoài phạm vi

* Toàn bộ trang thương mại điện tử nói chung
    * Chỉ thiết kế các thành phần phục vụ việc tính xếp hạng bán chạy

#### Ràng buộc và giả định

##### Các giả định

* Lưu lượng truy cập không phân bố đều
* Một sản phẩm có thể thuộc nhiều danh mục
* Sản phẩm không thể đổi danh mục
* Không có danh mục con, ví dụ `foo/bar/baz`
* Kết quả phải được cập nhật mỗi giờ
    * Các sản phẩm phổ biến hơn có thể cần được cập nhật thường xuyên hơn
* 10 triệu sản phẩm
* 1000 danh mục
* 1 tỷ giao dịch mỗi tháng
* 100 tỷ yêu cầu đọc mỗi tháng
* Tỷ lệ đọc:ghi là 100:1

##### Tính toán mức sử dụng

**Hãy hỏi người phỏng vấn xem bạn có nên thực hiện các phép ước lượng nhanh (back-of-the-envelope) hay không.**

* Kích thước mỗi giao dịch:
    * `created_at` - 5 byte
    * `product_id` - 8 byte
    * `category_id` - 4 byte
    * `seller_id` - 8 byte
    * `buyer_id` - 8 byte
    * `quantity` - 4 byte
    * `total_price` - 5 byte
    * Tổng: ~40 byte
* 40 GB nội dung giao dịch mới mỗi tháng
    * 40 byte mỗi giao dịch * 1 tỷ giao dịch mỗi tháng
    * 1.44 TB nội dung giao dịch mới trong 3 năm
    * Giả định phần lớn là giao dịch mới chứ không phải cập nhật giao dịch cũ
* Trung bình 400 giao dịch mỗi giây
* Trung bình 40,000 yêu cầu đọc mỗi giây

Bảng quy đổi tiện dụng:

* 2.5 triệu giây mỗi tháng
* 1 yêu cầu mỗi giây = 2.5 triệu yêu cầu mỗi tháng
* 40 yêu cầu mỗi giây = 100 triệu yêu cầu mỗi tháng
* 400 yêu cầu mỗi giây = 1 tỷ yêu cầu mỗi tháng

### Bước 2: Tạo thiết kế tổng quan (high level design)

> Phác thảo thiết kế tổng quan với tất cả các thành phần quan trọng.

![Thiết kế tổng quan sales rank](../../solutions/system_design/sales_rank/sales_rank_basic.png)

### Bước 3: Thiết kế các thành phần cốt lõi

> Đi sâu vào chi tiết từng thành phần cốt lõi.

#### Use case: Dịch vụ tính toán các sản phẩm phổ biến nhất trong tuần qua theo từng danh mục

Ta có thể lưu các file log thô của máy chủ **Sales API** trên một **Object Store** được quản lý sẵn (managed) như Amazon S3, thay vì tự vận hành một hệ thống file phân tán (distributed file system).

**Hãy hỏi người phỏng vấn xem bạn cần viết bao nhiêu code**.

Ta giả định đây là một dòng log mẫu, phân tách bằng tab:

```
timestamp   product_id  category_id    qty     total_price   seller_id    buyer_id
t1          product1    category1      2       20.00         1            1
t2          product1    category2      2       20.00         2            2
t2          product1    category2      1       10.00         2            3
t3          product2    category1      3        7.00         3            4
t4          product3    category2      7        2.00         4            5
t5          product4    category1      1        5.00         5            6
...
```

**Sales Rank Service** có thể dùng **MapReduce**, lấy các file log của máy chủ **Sales API** làm đầu vào và ghi kết quả vào bảng tổng hợp `sales_rank` trong **SQL Database**. Ta nên thảo luận về [các use case và đánh đổi khi chọn SQL hay NoSQL](../02-chu-de/06-database.md).

Ta sẽ dùng **MapReduce** nhiều bước:

* **Bước 1** - Biến đổi dữ liệu thành `(category, product_id), sum(quantity)`
* **Bước 2** - Thực hiện sắp xếp phân tán (distributed sort)

```python
class SalesRanker(MRJob):

    def within_past_week(self, timestamp):
        """Trả về True nếu timestamp nằm trong tuần qua, ngược lại trả về False."""
        ...

    def mapper(self, _ line):
        """Phân tích từng dòng log, trích xuất và biến đổi các dòng liên quan.

        Phát ra (emit) các cặp key-value có dạng:

        (category1, product1), 2
        (category2, product1), 2
        (category2, product1), 1
        (category1, product2), 3
        (category2, product3), 7
        (category1, product4), 1
        """
        timestamp, product_id, category_id, quantity, total_price, seller_id, \
            buyer_id = line.split('\t')
        if self.within_past_week(timestamp):
            yield (category_id, product_id), quantity

    def reducer(self, key, value):
        """Cộng dồn các giá trị cho mỗi key.

        (category1, product1), 2
        (category2, product1), 3
        (category1, product2), 3
        (category2, product3), 7
        (category1, product4), 1
        """
        yield key, sum(values)

    def mapper_sort(self, key, value):
        """Tạo key sao cho việc sắp xếp diễn ra đúng.

        Biến đổi key và value thành dạng:

        (category1, 2), product1
        (category2, 3), product1
        (category1, 3), product2
        (category2, 7), product3
        (category1, 1), product4

        Bước shuffle/sort của MapReduce sau đó sẽ
        sắp xếp phân tán trên các key, cho ra kết quả:

        (category1, 1), product4
        (category1, 2), product1
        (category1, 3), product2
        (category2, 3), product1
        (category2, 7), product3
        """
        category_id, product_id = key
        quantity = value
        yield (category_id, quantity), product_id

    def reducer_identity(self, key, value):
        yield key, value

    def steps(self):
        """Chạy các bước map và reduce."""
        return [
            self.mr(mapper=self.mapper,
                    reducer=self.reducer),
            self.mr(mapper=self.mapper_sort,
                    reducer=self.reducer_identity),
        ]
```

Kết quả sẽ là danh sách đã sắp xếp sau đây, mà ta có thể chèn vào bảng `sales_rank`:

```
(category1, 1), product4
(category1, 2), product1
(category1, 3), product2
(category2, 3), product1
(category2, 7), product3
```

Bảng `sales_rank` có thể có cấu trúc như sau:

```
id int NOT NULL AUTO_INCREMENT
category_id int NOT NULL
total_sold int NOT NULL
product_id int NOT NULL
PRIMARY KEY(id)
FOREIGN KEY(category_id) REFERENCES Categories(id)
FOREIGN KEY(product_id) REFERENCES Products(id)
```

Ta sẽ tạo [chỉ mục (index)](../02-chu-de/06-database.md) trên `id `, `category_id` và `product_id` để tăng tốc tra cứu (thời gian log thay vì quét toàn bộ bảng) và để giữ dữ liệu trong bộ nhớ. Đọc tuần tự 1 MB từ bộ nhớ mất khoảng 250 micro giây, trong khi đọc từ SSD lâu hơn 4 lần và từ ổ đĩa (disk) lâu hơn 80 lần.<sup><a href=../../README.md#latency-numbers-every-programmer-should-know>1</a></sup>

#### Use case: Người dùng xem các sản phẩm phổ biến nhất trong tuần qua theo từng danh mục

* **Client** gửi yêu cầu tới **Web Server**, đang chạy dưới dạng [reverse proxy](../02-chu-de/04-reverse-proxy.md)
* **Web Server** chuyển tiếp yêu cầu tới máy chủ **Read API**
* Máy chủ **Read API** đọc từ bảng `sales_rank` trong **SQL Database**

Ta sẽ dùng một [**REST API**](../02-chu-de/09-communication.md) công khai:

```
$ curl https://amazon.com/api/v1/popular?category_id=1234
```

Phản hồi:

```
{
    "id": "100",
    "category_id": "1234",
    "total_sold": "100000",
    "product_id": "50",
},
{
    "id": "53",
    "category_id": "1234",
    "total_sold": "90000",
    "product_id": "200",
},
{
    "id": "75",
    "category_id": "1234",
    "total_sold": "80000",
    "product_id": "3",
},
```

Với giao tiếp nội bộ, ta có thể dùng [gọi thủ tục từ xa (Remote Procedure Call - RPC)](../02-chu-de/09-communication.md).

### Bước 4: Mở rộng thiết kế (scale)

> Xác định và xử lý các điểm nghẽn (bottleneck), dựa trên các ràng buộc.

![Thiết kế sales rank sau khi mở rộng](../../solutions/system_design/sales_rank/sales_rank.png)

**Quan trọng: Đừng nhảy thẳng từ thiết kế ban đầu sang thiết kế cuối cùng!**

Hãy nói rõ rằng bạn sẽ 1) **Đo hiệu năng/Kiểm thử tải (Benchmark/Load Test)**, 2) **Phân tích (Profile)** để tìm điểm nghẽn, 3) xử lý các điểm nghẽn trong khi đánh giá các phương án thay thế và đánh đổi, và 4) lặp lại. Xem [Thiết kế hệ thống phục vụ hàng triệu người dùng trên AWS](02-scaling-aws.md) làm ví dụ về cách mở rộng thiết kế ban đầu theo từng vòng lặp.

Điều quan trọng là thảo luận những điểm nghẽn có thể gặp với thiết kế ban đầu và cách xử lý từng điểm. Ví dụ: thêm **Load Balancer** với nhiều **Web Server** giải quyết được vấn đề gì? **CDN**? **Master-Slave Replicas**? Các phương án thay thế và **đánh đổi** của từng lựa chọn là gì?

Ta sẽ bổ sung một số thành phần để hoàn thiện thiết kế và xử lý các vấn đề về khả năng mở rộng. Các load balancer nội bộ không được vẽ để hình đỡ rối.

*Để tránh lặp lại các thảo luận*, hãy tham khảo các [chủ đề system design](../../README.md#index-of-system-design-topics) sau để nắm các ý chính, đánh đổi và phương án thay thế:

* [DNS](../02-chu-de/01-dns.md)
* [CDN](../02-chu-de/02-cdn.md)
* [Load balancer](../02-chu-de/03-load-balancer.md)
* [Mở rộng theo chiều ngang (horizontal scaling)](../02-chu-de/03-load-balancer.md)
* [Web server (reverse proxy)](../02-chu-de/04-reverse-proxy.md)
* [API server (tầng ứng dụng - application layer)](../02-chu-de/05-application-layer.md)
* [Cache](../02-chu-de/07-cache.md)
* [Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS)](../02-chu-de/06-database.md)
* [Fail-over master-slave cho SQL ghi](../01-danh-doi/05-availability-patterns.md)
* [Nhân bản master-slave (master-slave replication)](../02-chu-de/06-database.md)
* [Các mẫu nhất quán (consistency patterns)](../01-danh-doi/04-consistency-patterns.md)
* [Các mẫu sẵn sàng (availability patterns)](../01-danh-doi/05-availability-patterns.md)

**Analytics Database** có thể dùng giải pháp kho dữ liệu (data warehouse) như Amazon Redshift hoặc Google BigQuery.

Ta có thể chỉ muốn lưu dữ liệu trong một khoảng thời gian giới hạn trong cơ sở dữ liệu, phần còn lại lưu trong data warehouse hoặc trong **Object Store**. Một **Object Store** như Amazon S3 có thể dễ dàng đáp ứng ràng buộc 40 GB nội dung mới mỗi tháng.

Để xử lý 40,000 yêu cầu đọc mỗi giây *trung bình* (cao hơn vào giờ cao điểm), lưu lượng cho nội dung phổ biến (và xếp hạng bán chạy của chúng) nên được xử lý bởi **Memory Cache** thay vì cơ sở dữ liệu. **Memory Cache** cũng hữu ích để xử lý lưu lượng phân bố không đều và các đợt tăng đột biến (spike). Với lượng đọc lớn như vậy, **SQL Read Replicas** có thể không kham nổi các lần cache miss. Nhiều khả năng ta sẽ cần áp dụng thêm các mẫu mở rộng SQL.

400 thao tác ghi mỗi giây *trung bình* (cao hơn vào giờ cao điểm) có thể là quá sức với một **SQL Write Master-Slave** duy nhất, điều này cũng cho thấy cần thêm các kỹ thuật mở rộng.

Các mẫu mở rộng SQL gồm:

* [Liên kết (federation)](../02-chu-de/06-database.md)
* [Phân mảnh (sharding)](../02-chu-de/06-database.md)
* [Phi chuẩn hóa (denormalization)](../02-chu-de/06-database.md)
* [Tinh chỉnh SQL (SQL tuning)](../02-chu-de/06-database.md)

Ta cũng nên cân nhắc chuyển một phần dữ liệu sang **NoSQL Database**.

### Các ý thảo luận thêm (Additional talking points)

> Các chủ đề bổ sung để đào sâu, tùy vào phạm vi bài toán và thời gian còn lại.

##### NoSQL

* [Kho key-value (key-value store)](../02-chu-de/06-database.md)
* [Kho tài liệu (document store)](../02-chu-de/06-database.md)
* [Kho cột rộng (wide column store)](../02-chu-de/06-database.md)
* [Cơ sở dữ liệu đồ thị (graph database)](../02-chu-de/06-database.md)
* [SQL vs NoSQL](../02-chu-de/06-database.md)

#### Caching

* Cache ở đâu
    * [Cache phía client (client caching)](../02-chu-de/07-cache.md)
    * [Cache trên CDN](../02-chu-de/07-cache.md)
    * [Cache trên web server](../02-chu-de/07-cache.md)
    * [Cache trong cơ sở dữ liệu](../02-chu-de/07-cache.md)
    * [Cache ở tầng ứng dụng](../02-chu-de/07-cache.md)
* Cache cái gì
    * [Cache ở mức truy vấn cơ sở dữ liệu](../02-chu-de/07-cache.md)
    * [Cache ở mức đối tượng](../02-chu-de/07-cache.md)
* Khi nào cập nhật cache
    * [Cache-aside](../02-chu-de/07-cache.md)
    * [Write-through](../02-chu-de/07-cache.md)
    * [Write-behind (write-back)](../02-chu-de/07-cache.md)
    * [Refresh ahead](../02-chu-de/07-cache.md)

#### Bất đồng bộ và microservices

* [Hàng đợi thông điệp (message queues)](../02-chu-de/08-asynchronism.md)
* [Hàng đợi tác vụ (task queues)](../02-chu-de/08-asynchronism.md)
* [Áp lực ngược (back pressure)](../02-chu-de/08-asynchronism.md)
* [Microservices](../02-chu-de/05-application-layer.md)

#### Giao tiếp (communications)

* Thảo luận các đánh đổi:
    * Giao tiếp bên ngoài với client - [HTTP API theo REST](../02-chu-de/09-communication.md)
    * Giao tiếp nội bộ - [RPC](../02-chu-de/09-communication.md)
* [Khám phá dịch vụ (service discovery)](../02-chu-de/05-application-layer.md)

#### Bảo mật

Tham khảo [phần bảo mật](../02-chu-de/10-security.md).

#### Các con số về độ trễ

Xem [Các con số về độ trễ mà mọi lập trình viên nên biết](../../README.md#latency-numbers-every-programmer-should-know).

#### Liên tục

* Tiếp tục đo hiệu năng và giám sát hệ thống để xử lý các điểm nghẽn khi chúng xuất hiện
* Mở rộng hệ thống là một quá trình lặp đi lặp lại

---

## Ghi chú của người dịch

**1. Lỗi trong code mẫu và kết quả sắp xếp ngược chiều**

- `def mapper(self, _ line)` thiếu dấu phẩy - lỗi cú pháp; đúng là `def mapper(self, _, line)`.
- `reducer(self, key, value)` nhưng dùng `values`; cần đổi tên tham số thành `values`. `quantity` tách từ chuỗi nên là `str`, phải `int(quantity)` trước khi cộng.
- `reducer_identity(self, key, value)`: trong mrjob, reducer nhận một iterator các giá trị, nên phải `for v in values: yield key, v`, nếu không sẽ phát ra chính iterator.
- **Kết quả sắp xếp tăng dần**: `(category1, 1), product4` đứng đầu, tức sản phẩm bán **ít nhất** đứng đầu - ngược với "phổ biến nhất". Cần sắp giảm dần theo số lượng, ví dụ dùng key `(category_id, -quantity)`. Ngoài ra "sort toàn cục" là thừa: ta chỉ cần top-N **trong từng danh mục**, nên reducer theo `category_id` giữ một heap kích thước N là đủ - rẻ hơn nhiều so với sắp xếp phân tán toàn bộ dữ liệu. Tham khảo thêm [sales_rank_mapreduce.py](../../solutions/system_design/sales_rank/sales_rank_mapreduce.py).
- Bảng `sales_rank` không có cột `rank`, cũng không có cột thời điểm tính (`computed_at` hoặc `window_end`). Khi job chạy mỗi giờ, cần cách thay thế kết quả cũ một cách nguyên tử: ghi vào phiên bản mới rồi đổi con trỏ, hoặc khóa chính `(category_id, rank)` và upsert. Nếu không, người đọc có thể thấy nửa cũ nửa mới.

**2. Bài gốc nhầm giữa "ghi giao dịch" và "ghi bảng xếp hạng"**

Phần scale nói 400 ghi/giây có thể quá sức cho SQL master. Nhưng theo chính thiết kế, 400 giao dịch/giây đi vào **file log trên object store**, không đi vào bảng `sales_rank`. Bảng `sales_rank` chỉ được ghi **mỗi giờ một lần** theo lô.

Ước lượng lại: 1000 danh mục x top 100 = 100,000 dòng, mỗi dòng vài chục byte, tức vài MB. Toàn bộ bảng xếp hạng **nằm gọn trong RAM của một máy**. Nghĩa là:

- 40,000 đọc/giây không cần sharding SQL; chỉ cần cache (Redis, hoặc cache ngay trong bộ nhớ tiến trình của Read API) và CDN - vì dữ liệu chỉ đổi mỗi giờ, đặt `Cache-Control` với TTL vài phút là hợp lý.
- Cache miss gần như không tồn tại nếu chủ động nạp sẵn (warm) cache ngay sau mỗi lần job chạy xong, thay vì chờ cache-aside.
- Kết luận "cần thêm mẫu mở rộng SQL" của bài gốc là quá tay với chính số liệu của bài. Đây là điểm tốt để nêu trong phỏng vấn: **tính toán kích thước dữ liệu đầu ra trước khi quyết định scale tầng lưu trữ**.

Chỗ thực sự nặng là tầng **ghi nhận giao dịch** (nếu đó là DB giao dịch của hệ thống đặt hàng) và **job tính toán** phải quét 7 ngày dữ liệu mỗi giờ: khoảng 1 tỷ / 30 x 7 ≈ 233 triệu dòng, khoảng 9 GB mỗi lần chạy - vẫn nhẹ với Spark, nhưng lãng phí vì 6 ngày 23 giờ trong đó đã được tính ở lần trước.

**3. Cách làm hiện đại: stream processing và cửa sổ trượt**

"Tuần qua, cập nhật mỗi giờ" là định nghĩa kinh điển của **cửa sổ trượt (sliding / hopping window)**: kích thước 7 ngày, bước nhảy 1 giờ. Đến 2026, cách thường gặp:

- **Kafka (hoặc Kinesis, Pub/Sub) + Flink / Kafka Streams / Spark Structured Streaming**: đếm số lượng theo `(category, product)` trong từng khối 1 giờ; kết quả tuần = tổng của 168 khối gần nhất. Mỗi giờ chỉ cộng khối mới và trừ khối cũ nhất - không quét lại toàn bộ tuần.
- **Redis sorted set** cho phần phục vụ đọc: `ZINCRBY rank:{category} qty product` và `ZREVRANGE rank:{category} 0 99 WITHSCORES`. Có thể giữ một sorted set cho mỗi giờ rồi dùng `ZUNIONSTORE` gộp 168 cái; với 10 triệu sản phẩm thì nên chỉ giữ ứng viên (các sản phẩm có bán trong tuần) thay vì toàn bộ catalog.
- **Top-K xấp xỉ** (Count-Min Sketch + heap, thuật toán Space-Saving / Misra-Gries) khi số khóa quá lớn và chấp nhận sai số nhỏ. Với 10 triệu sản phẩm, đếm chính xác vẫn khả thi, nên chỉ nêu như phương án khi quy mô lớn hơn nhiều.
- Yêu cầu "sản phẩm phổ biến cần cập nhật thường xuyên hơn" thì stream processing giải quyết tự nhiên: kết quả có thể cập nhật gần thời gian thực, không cần hai lịch batch khác nhau.

Batch (MapReduce, nay là Spark) vẫn có chỗ đứng: chạy lại hằng ngày làm **nguồn đối chiếu** để sửa sai lệch do sự kiện đến muộn hoặc lỗi trong luồng stream (tư tưởng của kiến trúc Lambda). Nhiều hệ nay chọn kiến trúc Kappa - chỉ dùng stream, khi cần tính lại thì phát lại (replay) từ Kafka.

**4. Những điểm dễ bị hỏi thêm**

- **Hoàn trả và hủy đơn.** Giao dịch bị hủy hoặc hoàn tiền có nên trừ khỏi số đếm không? Với stream, đó là sự kiện số lượng âm.
- **Chống thao túng.** Người bán tự mua hàng của mình để leo hạng. Cần lọc giao dịch bất thường, đếm số người mua khác nhau thay vì chỉ tổng số lượng, hoặc giới hạn đóng góp của mỗi người mua.
- **Trọng số theo thời gian.** "Tổng số bán trong 7 ngày" tạo bước nhảy đột ngột khi một ngày bán mạnh rơi ra khỏi cửa sổ. Có thể dùng suy giảm theo hàm mũ (exponential decay) để thứ hạng mượt hơn. Amazon cũng nói công khai rằng Best Sellers Rank phản ánh doanh số gần đây lẫn trong quá khứ và được cập nhật hằng giờ, nhưng không công bố công thức cụ thể.
- **Danh mục nằm ở đâu.** Log mẫu ghi `category_id` trên từng dòng giao dịch, nên một sản phẩm thuộc 2 danh mục phải có 2 dòng log - dễ đếm trùng hoặc đếm sót. Tự nhiên hơn là log chỉ chứa `product_id`, job join với bảng `product -> categories` (bảng nhỏ, broadcast được) rồi phát ra mỗi danh mục một bản ghi.
- **Sự kiện đến muộn và trùng lặp.** Stream cần watermark để quyết định khi nào đóng một khối giờ, và ID sự kiện để chống đếm trùng khi producer retry.
- **Hot key.** Ngày Black Friday, vài sản phẩm chiếm phần lớn giao dịch, làm một partition Kafka hoặc một key Redis bị nóng. Có thể gom trước (pre-aggregate) ở phía producer, hoặc chia key thành nhiều key con rồi gộp lại.

**5. Nối với các mục khác**

- Bài trước dùng cùng khung MapReduce trên log thô: [Mint](05-mint.md).
- Đọc nhiều gấp 100 lần ghi, dữ liệu đổi theo giờ - trường hợp lý tưởng cho [Cache](../02-chu-de/07-cache.md) và [CDN](../02-chu-de/02-cdn.md).
- Hàng đợi, luồng sự kiện: [Bất đồng bộ](../02-chu-de/08-asynchronism.md).
- Chấp nhận bảng xếp hạng cũ tối đa một giờ là một dạng [nhất quán cuối cùng](../01-danh-doi/04-consistency-patterns.md); đổi lại hệ thống đọc có thể ưu tiên [sẵn sàng](../01-danh-doi/05-availability-patterns.md) tuyệt đối - trả bản xếp hạng cũ vẫn tốt hơn trả lỗi.
