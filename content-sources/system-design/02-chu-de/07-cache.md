---
nguon: The System Design Primer - mục "Cache"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../README.md#cache
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Bộ nhớ đệm (Cache)

## Nội dung gốc

<p align="center">
  <img src="../../images/Q6z24La.png" alt="Sơ đồ bộ điều phối tra cache trước khi thực thi request">
  <br/>
  <i>Nguồn: <a href="http://horicky.blogspot.com/2010/10/scalable-system-design-patterns.html">Scalable system design patterns</a></i>
</p>

Bộ nhớ đệm (caching) giúp cải thiện thời gian tải trang và có thể giảm tải cho máy chủ và cơ sở dữ liệu. Trong mô hình này, bộ điều phối (dispatcher) trước hết sẽ tra xem request này đã từng được thực hiện chưa và cố tìm kết quả trước đó để trả về, nhằm tiết kiệm việc thực thi thật.

Cơ sở dữ liệu thường hoạt động tốt nhất khi các thao tác đọc và ghi được phân bố đều trên các phân vùng (partition) của nó. Những mục phổ biến (popular items) có thể làm lệch sự phân bố này, gây ra nút thắt cổ chai. Đặt một cache phía trước cơ sở dữ liệu có thể giúp hấp thụ tải không đều và các đợt tăng đột biến lưu lượng.

### Cache phía client (Client caching)

Cache có thể nằm ở phía client (hệ điều hành hoặc trình duyệt), [phía máy chủ](04-reverse-proxy.md), hoặc ở một tầng cache riêng biệt.

### Cache ở CDN (CDN caching)

[CDN](02-cdn.md) được xem là một loại cache.

### Cache ở máy chủ web (Web server caching)

[Reverse proxy](04-reverse-proxy.md) và các cache như [Varnish](https://www.varnish-cache.org/) có thể phục vụ trực tiếp nội dung tĩnh và động. Máy chủ web cũng có thể cache các request, trả về response mà không cần liên hệ với máy chủ ứng dụng.

### Cache ở cơ sở dữ liệu (Database caching)

Cơ sở dữ liệu của bạn thường đã có sẵn một mức cache nào đó trong cấu hình mặc định, được tối ưu cho trường hợp sử dụng chung chung. Tinh chỉnh các thiết lập này cho các kiểu sử dụng cụ thể có thể tăng hiệu năng thêm nữa.

### Cache ở tầng ứng dụng (Application caching)

Các cache trong bộ nhớ (in-memory cache) như Memcached và Redis là các kho key-value nằm giữa ứng dụng và kho dữ liệu của bạn. Vì dữ liệu được giữ trong RAM, chúng nhanh hơn nhiều so với cơ sở dữ liệu thông thường, nơi dữ liệu được lưu trên đĩa. RAM hạn chế hơn đĩa, nên các thuật toán [vô hiệu hóa cache (cache invalidation)](https://en.wikipedia.org/wiki/Cache_algorithms) như [ít được dùng gần đây nhất (least recently used - LRU)](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)) có thể giúp loại bỏ các mục "nguội" (cold) và giữ dữ liệu "nóng" (hot) trong RAM.

Redis có thêm các tính năng sau:

- Tùy chọn lưu bền (persistence)
- Các cấu trúc dữ liệu dựng sẵn như tập hợp có thứ tự (sorted set) và danh sách (list)

Có nhiều mức bạn có thể cache, chia thành hai nhóm chung: **truy vấn cơ sở dữ liệu (database queries)** và **đối tượng (objects)**:

- Mức dòng (row level)
- Mức truy vấn (query level)
- Đối tượng hoàn chỉnh có thể tuần tự hóa (fully-formed serializable objects)
- HTML đã render hoàn chỉnh (fully-rendered HTML)

Nhìn chung, bạn nên tránh cache dựa trên file, vì nó khiến việc nhân bản (cloning) và tự động mở rộng (auto-scaling) khó khăn hơn.

### Cache ở mức truy vấn cơ sở dữ liệu

Mỗi khi truy vấn cơ sở dữ liệu, hãy băm (hash) câu truy vấn làm khóa và lưu kết quả vào cache. Cách này gặp vấn đề về hết hạn (expiration):

- Khó xóa kết quả đã cache của các truy vấn phức tạp
- Nếu một mẩu dữ liệu thay đổi, chẳng hạn một ô trong bảng, bạn cần xóa tất cả các truy vấn đã cache có thể chứa ô đã thay đổi đó

### Cache ở mức đối tượng

Hãy nhìn dữ liệu của bạn như một đối tượng, tương tự cách bạn làm với mã ứng dụng. Để ứng dụng lắp ráp tập dữ liệu từ cơ sở dữ liệu thành một thể hiện của lớp (class instance) hoặc một (hay nhiều) cấu trúc dữ liệu:

- Xóa đối tượng khỏi cache nếu dữ liệu nền của nó đã thay đổi
- Cho phép xử lý bất đồng bộ: các worker lắp ráp đối tượng bằng cách dùng đối tượng mới nhất đang được cache

Gợi ý những thứ nên cache:

- Phiên người dùng (user sessions)
- Trang web đã render hoàn chỉnh
- Luồng hoạt động (activity streams)
- Dữ liệu đồ thị người dùng (user graph data)

### Khi nào cập nhật cache

Vì bạn chỉ có thể lưu một lượng dữ liệu giới hạn trong cache, bạn cần xác định chiến lược cập nhật cache nào phù hợp nhất với trường hợp sử dụng của mình.

#### Cache-aside

<p align="center">
  <img src="../../images/ONjORqk.png" alt="Sơ đồ mẫu cache-aside">
  <br/>
  <i>Nguồn: <a href="http://www.slideshare.net/tmatyashovsky/from-cache-to-in-memory-data-grid-introduction-to-hazelcast">From cache to in-memory data grid</a></i>
</p>

Ứng dụng chịu trách nhiệm đọc và ghi vào kho lưu trữ. Cache không tương tác trực tiếp với kho lưu trữ. Ứng dụng làm như sau:

- Tìm mục trong cache, kết quả là trượt cache (cache miss)
- Tải mục từ cơ sở dữ liệu
- Thêm mục vào cache
- Trả về mục

```python
def get_user(self, user_id):
    user = cache.get("user.{0}", user_id)
    if user is None:
        user = db.query("SELECT * FROM users WHERE user_id = {0}", user_id)
        if user is not None:
            key = "user.{0}".format(user_id)
            cache.set(key, json.dumps(user))
    return user
```

[Memcached](https://memcached.org/) thường được dùng theo cách này.

Các lần đọc tiếp theo đối với dữ liệu đã được thêm vào cache sẽ nhanh. Cache-aside còn được gọi là tải lười (lazy loading). Chỉ dữ liệu được yêu cầu mới được cache, nhờ đó tránh làm đầy cache bằng dữ liệu không ai yêu cầu.

##### Nhược điểm: cache-aside

- Mỗi lần trượt cache dẫn tới ba lượt đi-về, có thể gây độ trễ đáng kể.
- Dữ liệu có thể bị cũ (stale) nếu nó được cập nhật trong cơ sở dữ liệu. Vấn đề này được giảm nhẹ bằng cách đặt thời gian sống (time-to-live - TTL) để buộc cập nhật mục cache, hoặc bằng cách dùng write-through.
- Khi một node hỏng, nó được thay bằng một node mới, rỗng, làm tăng độ trễ.

#### Write-through

<p align="center">
  <img src="../../images/0vBc0hN.png" alt="Sơ đồ mẫu write-through">
  <br/>
  <i>Nguồn: <a href="http://www.slideshare.net/jboner/scalability-availability-stability-patterns/">Scalability, availability, stability, patterns</a></i>
</p>

Ứng dụng dùng cache làm kho dữ liệu chính, đọc và ghi dữ liệu vào đó, còn cache chịu trách nhiệm đọc và ghi vào cơ sở dữ liệu:

- Ứng dụng thêm/cập nhật mục trong cache
- Cache ghi mục đó vào kho dữ liệu một cách đồng bộ
- Trả về

Mã ứng dụng:

```python
set_user(12345, {"foo":"bar"})
```

Mã cache:

```python
def set_user(user_id, values):
    user = db.query("UPDATE Users WHERE id = {0}", user_id, values)
    cache.set(user_id, user)
```

Nhìn tổng thể, write-through là một thao tác chậm do phải ghi, nhưng các lần đọc tiếp theo đối với dữ liệu vừa ghi sẽ nhanh. Người dùng thường chấp nhận độ trễ khi cập nhật dữ liệu hơn là khi đọc dữ liệu. Dữ liệu trong cache không bị cũ.

##### Nhược điểm: write-through

- Khi một node mới được tạo ra do có node hỏng hoặc do mở rộng, node mới sẽ không cache mục nào cho tới khi mục đó được cập nhật trong cơ sở dữ liệu. Kết hợp cache-aside với write-through có thể giảm nhẹ vấn đề này.
- Phần lớn dữ liệu được ghi có thể không bao giờ được đọc, điều này có thể giảm thiểu bằng TTL.

#### Write-behind (write-back)

<p align="center">
  <img src="../../images/rgSrvjG.png" alt="Sơ đồ mẫu write-behind">
  <br/>
  <i>Nguồn: <a href="http://www.slideshare.net/jboner/scalability-availability-stability-patterns/">Scalability, availability, stability, patterns</a></i>
</p>

Với write-behind, ứng dụng làm như sau:

- Thêm/cập nhật mục trong cache
- Ghi mục đó vào kho dữ liệu một cách bất đồng bộ, giúp cải thiện hiệu năng ghi

##### Nhược điểm: write-behind

- Có thể mất dữ liệu nếu cache sập trước khi nội dung của nó kịp ghi xuống kho dữ liệu.
- Triển khai write-behind phức tạp hơn triển khai cache-aside hoặc write-through.

#### Refresh-ahead

<p align="center">
  <img src="../../images/kxtjqgE.png" alt="Sơ đồ mẫu refresh-ahead">
  <br/>
  <i>Nguồn: <a href="http://www.slideshare.net/tmatyashovsky/from-cache-to-in-memory-data-grid-introduction-to-hazelcast">From cache to in-memory data grid</a></i>
</p>

Bạn có thể cấu hình cache để tự động làm mới bất kỳ mục cache nào vừa được truy cập gần đây trước khi nó hết hạn.

Refresh-ahead có thể giúp giảm độ trễ so với read-through nếu cache dự đoán chính xác được những mục nào có khả năng sẽ cần tới trong tương lai.

##### Nhược điểm: refresh-ahead

- Dự đoán không chính xác những mục nào có khả năng sẽ cần tới trong tương lai có thể khiến hiệu năng còn kém hơn so với khi không dùng refresh-ahead.

### Nhược điểm: cache

- Cần duy trì tính nhất quán giữa cache và nguồn dữ liệu gốc (source of truth) như cơ sở dữ liệu thông qua [vô hiệu hóa cache](https://en.wikipedia.org/wiki/Cache_algorithms).
- Vô hiệu hóa cache là một bài toán khó, kéo theo độ phức tạp bổ sung liên quan tới việc khi nào cập nhật cache.
- Cần thay đổi ứng dụng, chẳng hạn thêm Redis hoặc memcached.

### Nguồn và đọc thêm

- [From cache to in-memory data grid](http://www.slideshare.net/tmatyashovsky/from-cache-to-in-memory-data-grid-introduction-to-hazelcast)
- [Scalable system design patterns](http://horicky.blogspot.com/2010/10/scalable-system-design-patterns.html)
- [Introduction to architecting systems for scale](http://lethain.com/introduction-to-architecting-systems-for-scale/)
- [Scalability, availability, stability, patterns](http://www.slideshare.net/jboner/scalability-availability-stability-patterns/)
- [Scalability](https://web.archive.org/web/20230126233752/https://www.lecloud.net/post/9246290032/scalability-for-dummies-part-3-cache)
- [AWS ElastiCache strategies](http://docs.aws.amazon.com/AmazonElastiCache/latest/UserGuide/Strategies.html)
- [Wikipedia](https://en.wikipedia.org/wiki/Cache_(computing))

---

## Ghi chú của người dịch

**1. Mã ví dụ trong bản gốc là mã giả - đừng chép nguyên**

Hai đoạn Python được giữ nguyên để trung thành với bản gốc, nhưng chúng có lỗi nếu đọc như mã thật:

- `cache.get("user.{0}", user_id)` không định dạng chuỗi - khóa khi đọc là `"user.{0}"` trong khi khóa khi ghi là `"user.12345"`. Kết quả: **không bao giờ trúng cache**. Cần `cache.get("user.{0}".format(user_id))`.
- Khi ghi thì lưu `json.dumps(user)`, nhưng khi đọc lại không `json.loads` - hàm trả về hai kiểu khác nhau tùy trúng hay trượt.
- `db.query("... {0}", user_id)` gợi ý ghép chuỗi vào SQL. Mã thật phải dùng tham số hóa (parameterized query) để tránh SQL injection.
- `UPDATE Users WHERE id = ...` thiếu mệnh đề `SET`, và câu `UPDATE` thường không trả về bản ghi (trừ khi dùng `RETURNING` như PostgreSQL).

Hãy đọc chúng như sơ đồ luồng, không phải thư viện.

**2. Bốn chiến lược cập nhật cache: so sánh nhanh**

| | Cache-aside | Write-through | Write-behind | Refresh-ahead |
|---|---|---|---|---|
| Ai nói chuyện với DB | Ứng dụng | Cache (đồng bộ) | Cache (bất đồng bộ) | Cache (chủ động làm mới) |
| Đọc lần đầu | Chậm (trượt cache) | Nhanh nếu vừa ghi | Nhanh nếu vừa ghi | Nhanh nếu dự đoán đúng |
| Độ trễ ghi | Chỉ DB | DB + cache | Chỉ cache | Không ảnh hưởng |
| Rủi ro chính | Dữ liệu cũ, trượt đồng loạt | Cache đầy dữ liệu không ai đọc | Mất dữ liệu khi cache sập | Làm mới thừa, tốn tải DB |
| Thường gặp ở | Redis/Memcached tự viết | Cache dạng thư viện/data grid, DAX | Data grid (Hazelcast...), bộ đệm ghi của đĩa/CPU | CDN, cache có TTL ngắn cho dữ liệu nóng |

Trong thực tế, **cache-aside + TTL** là mặc định của đại đa số hệ thống web. Các mẫu còn lại thường xuất hiện khi cache là một sản phẩm tự quản lý việc đọc/ghi DB (như Hazelcast, Amazon DynamoDB Accelerator) chứ không phải Redis dùng tay.

Bản gốc có nhắc "read-through" ở phần refresh-ahead mà không định nghĩa: read-through giống cache-aside về hành vi, nhưng **cache** (hoặc thư viện) tự đi lấy dữ liệu từ DB khi trượt, thay vì ứng dụng làm.

**3. Bẫy kinh điển khi dùng cache-aside**

- **Điều kiện tranh chấp khi ghi (race condition)**: cách "cập nhật DB rồi ghi đè cache" có thể để lại giá trị cũ nếu hai request chen nhau. Cách an toàn hơn và phổ biến hơn là **cập nhật DB rồi xóa khóa cache** (delete, không set), để lần đọc sau tự nạp lại. Vẫn còn một cửa sổ nhỏ gây dữ liệu cũ, nên luôn kèm TTL làm lưới an toàn.
- **Cache stampede / thundering herd**: một khóa nóng hết hạn, hàng nghìn request cùng trượt và cùng đập vào DB. Chữa bằng: gộp request (request coalescing / single-flight), khóa phân tán ngắn khi nạp lại, hết hạn sớm có xác suất (probabilistic early expiration), hoặc phục vụ giá trị cũ trong lúc làm mới (stale-while-revalidate).
- **Hết hạn đồng loạt**: nạp cả triệu khóa cùng TTL thì chúng cũng hết hạn cùng lúc. Cộng thêm nhiễu ngẫu nhiên (jitter) vào TTL.
- **Cache penetration**: truy vấn khóa không tồn tại (thường do tấn công) thì luôn trượt và luôn chạm DB. Chữa bằng cache cả kết quả rỗng (negative caching) với TTL ngắn, hoặc Bloom filter.
- **Khóa nóng (hot key)**: một khóa quá phổ biến làm quá tải một node cache duy nhất - chính là vấn đề "popular items" mà bản gốc nêu, chỉ chuyển từ DB sang cache. Chữa bằng cache cục bộ trong tiến trình (L1) trước Redis, hoặc nhân bản khóa ra nhiều bản.
- **Cache khởi động lạnh (cold start)**: nhược điểm "node mới rỗng" trong bản gốc. Với hệ lớn, mất cả cụm cache có thể làm DB sập ngay vì DB chưa bao giờ được định cỡ để chịu toàn bộ tải. Cân nhắc làm ấm cache (warm-up) và giới hạn tốc độ nạp lại.

**4. Bức tranh công cụ đến 2026**

- **Redis** vẫn là lựa chọn mặc định, nhưng từ 2024 Redis đổi giấy phép khỏi BSD; cộng đồng tách nhánh thành **Valkey** (thuộc Linux Foundation), được nhiều nhà cung cấp đám mây dùng cho dịch vụ quản lý. Từ Redis 8, Redis bổ sung lại tùy chọn giấy phép AGPL. Về giao thức và cách dùng cơ bản, hai bên vẫn tương thích với nhau ở mức lệnh phổ biến.
- **Memcached** vẫn tồn tại ở các hệ rất lớn nhờ đơn giản, đa luồng, chỉ làm đúng một việc.
- Các lựa chọn tương thích giao thức Redis khác: **Dragonfly**, **KeyDB** (đa luồng).
- **Dịch vụ quản lý**: Amazon ElastiCache / MemoryDB, Google Memorystore, Azure Cache for Redis, Upstash (serverless, tính theo request).
- **Cache HTTP**: Varnish, Nginx `proxy_cache`, và CDN (Cloudflare, Fastly, CloudFront) - với header `Cache-Control`, `ETag`, `stale-while-revalidate`.
- **Cache trong tiến trình**: Caffeine (Java), `lru-cache` (Node.js), `functools.lru_cache` (Python) - nhanh nhất vì không qua mạng, nhưng mỗi instance một bản riêng, khó vô hiệu hóa đồng loạt.

Lưu ý về "Redis có tùy chọn lưu bền": RDB/AOF giúp khôi phục sau khởi động lại, nhưng **đừng coi Redis cache là nguồn dữ liệu gốc** trừ khi đã cấu hình và hiểu rõ đánh đổi (AOF `fsync` mỗi giây vẫn có thể mất khoảng một giây ghi).

**5. Chính sách loại bỏ (eviction) không chỉ có LRU**

Bản gốc nhắc LRU. Redis còn hỗ trợ LFU (least frequently used - ít được dùng nhất), loại ngẫu nhiên, và các biến thể chỉ áp lên khóa có TTL (`volatile-*`) hoặc mọi khóa (`allkeys-*`). Mặc định của Redis là `noeviction` - hết bộ nhớ thì **trả lỗi khi ghi** chứ không tự loại khóa. Dùng Redis làm cache mà quên đặt `maxmemory-policy` là bẫy rất hay gặp.

**6. Góc nhìn phỏng vấn**

Khi đề xuất thêm cache, người phỏng vấn thường hỏi tiếp:

- Tỉ lệ đọc/ghi là bao nhiêu? (Cache chỉ đáng giá khi đọc nhiều hơn ghi rõ rệt.)
- Dữ liệu được phép cũ bao lâu? (Quyết định TTL và chiến lược vô hiệu hóa - nối với [Các mẫu nhất quán](../01-danh-doi/04-consistency-patterns.md).)
- Tỉ lệ trúng cache (hit ratio) kỳ vọng và cách đo?
- Chuyện gì xảy ra khi cả cụm cache chết? DB có chịu nổi không?
- Khóa được thiết kế thế nào, và phân mảnh (sharding) cache ra sao? (Consistent hashing để thêm/bớt node không làm trượt toàn bộ.)
- Cache ở tầng nào: trình duyệt, CDN, reverse proxy, ứng dụng hay DB? Thường câu trả lời tốt là **nhiều tầng**, mỗi tầng một TTL.

Câu nói nổi tiếng của Phil Karlton đáng nhớ: *"Chỉ có hai thứ khó trong khoa học máy tính: vô hiệu hóa cache và đặt tên."*

**7. Nối với các mục khác**

- [Caches (Scalability for Dummies, Phần 3)](../00-nen-tang/03-caches.md) - bản nhập môn của chính chủ đề này, cùng hai mẫu "cache truy vấn" và "cache đối tượng", với lập luận vì sao nên chọn cache đối tượng.
- [Asynchronism](08-asynchronism.md) - mục kế tiếp; "cache ở mức đối tượng cho phép xử lý bất đồng bộ" chính là cầu nối giữa hai mục.
- [CDN](02-cdn.md) và [Reverse proxy](04-reverse-proxy.md) - các tầng cache nằm trước ứng dụng.
- [Database](06-database.md) - nơi cache hấp thụ tải đọc, bổ sung hoặc thay thế cho bản sao đọc (read replica).
- [Clones](../00-nen-tang/01-clones.md) - lý do không dùng cache dựa trên file: máy chủ phải không trạng thái để nhân bản.

Đối chiếu README gốc của repo:
- [Cache](../../README.md#cache)
- [Asynchronism](../../README.md#asynchronism) - mục kế tiếp
