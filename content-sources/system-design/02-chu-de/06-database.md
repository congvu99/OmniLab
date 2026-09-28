---
nguon: The System Design Primer - mục "Database"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../README.md#database
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Cơ sở dữ liệu (Database)

## Nội dung gốc

<p align="center">
  <img src="../../images/Xkm5CXz.png" alt="Sơ đồ mở rộng cơ sở dữ liệu khi hệ thống tăng trưởng">
  <br/>
  <i>Nguồn: <a href="https://www.youtube.com/watch?v=kKjm4ehYiMs">Scaling up to your first 10 million users</a></i>
</p>

### Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS)

Một cơ sở dữ liệu quan hệ như SQL là một tập hợp các mục dữ liệu được tổ chức thành các bảng.

**ACID** là tập hợp các thuộc tính của [giao dịch (transaction)](https://en.wikipedia.org/wiki/Database_transaction) trong cơ sở dữ liệu quan hệ.

- **Tính nguyên tử (Atomicity)** - Mỗi giao dịch hoặc thực hiện trọn vẹn, hoặc không thực hiện gì cả.
- **Tính nhất quán (Consistency)** - Mọi giao dịch đều đưa cơ sở dữ liệu từ một trạng thái hợp lệ sang một trạng thái hợp lệ khác.
- **Tính cô lập (Isolation)** - Thực thi các giao dịch đồng thời cho kết quả giống như khi các giao dịch được thực thi tuần tự.
- **Tính bền vững (Durability)** - Một khi giao dịch đã được xác nhận (commit), nó sẽ được giữ nguyên như vậy.

Có nhiều kỹ thuật để mở rộng một cơ sở dữ liệu quan hệ: **nhân bản master-slave**, **nhân bản master-master**, **federation**, **sharding**, **phi chuẩn hóa (denormalization)** và **tinh chỉnh SQL (SQL tuning)**.

#### Nhân bản master-slave (Master-slave replication)

Master phục vụ cả đọc lẫn ghi, đồng thời nhân bản các thao tác ghi sang một hoặc nhiều slave; các slave chỉ phục vụ đọc. Slave cũng có thể nhân bản tiếp sang các slave khác theo dạng cây. Nếu master ngừng hoạt động, hệ thống có thể tiếp tục chạy ở chế độ chỉ đọc cho tới khi một slave được nâng cấp thành master hoặc một master mới được cấp phát.

<p align="center">
  <img src="../../images/C9ioGtn.png" alt="Sơ đồ nhân bản master-slave">
  <br/>
  <i>Nguồn: <a href="http://www.slideshare.net/jboner/scalability-availability-stability-patterns/">Scalability, availability, stability, patterns</a></i>
</p>

##### Nhược điểm: nhân bản master-slave

- Cần thêm logic để nâng cấp một slave thành master.
- Xem [Nhược điểm: nhân bản](#nhược-điểm-nhân-bản) cho các điểm liên quan tới **cả** master-slave lẫn master-master.

#### Nhân bản master-master (Master-master replication)

Cả hai master đều phục vụ đọc và ghi, và phối hợp với nhau khi ghi. Nếu một trong hai master ngừng hoạt động, hệ thống vẫn tiếp tục chạy với cả đọc lẫn ghi.

<p align="center">
  <img src="../../images/krAHLGg.png" alt="Sơ đồ nhân bản master-master">
  <br/>
  <i>Nguồn: <a href="http://www.slideshare.net/jboner/scalability-availability-stability-patterns/">Scalability, availability, stability, patterns</a></i>
</p>

##### Nhược điểm: nhân bản master-master

- Bạn sẽ cần một bộ cân bằng tải (load balancer), hoặc phải sửa logic ứng dụng để quyết định ghi vào đâu.
- Hầu hết hệ thống master-master hoặc chỉ nhất quán lỏng lẻo (vi phạm ACID), hoặc có độ trễ ghi tăng lên do phải đồng bộ.
- Việc giải quyết xung đột (conflict resolution) càng trở nên quan trọng khi thêm nhiều node ghi và khi độ trễ tăng.
- Xem [Nhược điểm: nhân bản](#nhược-điểm-nhân-bản) cho các điểm liên quan tới **cả** master-slave lẫn master-master.

##### Nhược điểm: nhân bản

- Có nguy cơ mất dữ liệu nếu master hỏng trước khi dữ liệu vừa ghi kịp nhân bản sang các node khác.
- Các thao tác ghi được phát lại (replay) trên các bản sao đọc (read replica). Nếu có nhiều thao tác ghi, bản sao đọc có thể bị sa lầy vào việc phát lại ghi và không phục vụ được nhiều thao tác đọc.
- Càng nhiều slave đọc thì càng phải nhân bản nhiều, dẫn tới độ trễ nhân bản (replication lag) lớn hơn.
- Trên một số hệ thống, ghi vào master có thể sinh nhiều luồng (thread) để ghi song song, trong khi bản sao đọc chỉ hỗ trợ ghi tuần tự bằng một luồng duy nhất.
- Nhân bản làm tăng lượng phần cứng và tăng độ phức tạp.

##### Nguồn và đọc thêm: nhân bản

- [Scalability, availability, stability, patterns](http://www.slideshare.net/jboner/scalability-availability-stability-patterns/)
- [Multi-master replication](https://en.wikipedia.org/wiki/Multi-master_replication)

#### Federation

<p align="center">
  <img src="../../images/U3qV33e.png" alt="Sơ đồ federation - tách cơ sở dữ liệu theo chức năng">
  <br/>
  <i>Nguồn: <a href="https://www.youtube.com/watch?v=kKjm4ehYiMs">Scaling up to your first 10 million users</a></i>
</p>

Federation (hay phân vùng theo chức năng - functional partitioning) tách cơ sở dữ liệu theo chức năng. Ví dụ, thay vì một cơ sở dữ liệu nguyên khối duy nhất, bạn có thể có ba cơ sở dữ liệu: **forums**, **users** và **products**, nhờ đó lưu lượng đọc và ghi vào mỗi cơ sở dữ liệu ít hơn, và vì vậy độ trễ nhân bản cũng thấp hơn. Cơ sở dữ liệu nhỏ hơn thì nhiều dữ liệu vừa trong bộ nhớ hơn, từ đó tăng tỉ lệ trúng cache (cache hit) nhờ tính cục bộ của cache (cache locality) tốt hơn. Vì không còn một master trung tâm duy nhất phải tuần tự hóa các thao tác ghi, bạn có thể ghi song song, tăng thông lượng (throughput).

##### Nhược điểm: federation

- Federation không hiệu quả nếu lược đồ (schema) của bạn đòi hỏi các hàm hoặc bảng khổng lồ.
- Bạn sẽ cần sửa logic ứng dụng để quyết định đọc và ghi vào cơ sở dữ liệu nào.
- Kết hợp (join) dữ liệu từ hai cơ sở dữ liệu phức tạp hơn khi phải dùng [liên kết máy chủ (server link)](http://stackoverflow.com/questions/5145637/querying-data-by-joining-two-tables-in-two-database-on-different-servers).
- Federation làm tăng lượng phần cứng và tăng độ phức tạp.

##### Nguồn và đọc thêm: federation

- [Scaling up to your first 10 million users](https://www.youtube.com/watch?v=kKjm4ehYiMs)

#### Sharding

<p align="center">
  <img src="../../images/wU8x5Id.png" alt="Sơ đồ sharding - chia dữ liệu ra nhiều cơ sở dữ liệu">
  <br/>
  <i>Nguồn: <a href="http://www.slideshare.net/jboner/scalability-availability-stability-patterns/">Scalability, availability, stability, patterns</a></i>
</p>

Sharding phân tán dữ liệu ra nhiều cơ sở dữ liệu khác nhau sao cho mỗi cơ sở dữ liệu chỉ quản lý một tập con của dữ liệu. Lấy cơ sở dữ liệu người dùng làm ví dụ: khi số người dùng tăng, ta thêm nhiều shard hơn vào cụm (cluster).

Tương tự ưu điểm của [federation](#federation), sharding giúp giảm lưu lượng đọc và ghi, giảm nhân bản và tăng tỉ lệ trúng cache. Kích thước chỉ mục (index) cũng giảm, thường giúp cải thiện hiệu năng với truy vấn nhanh hơn. Nếu một shard ngừng hoạt động, các shard khác vẫn chạy, dù bạn sẽ muốn thêm một hình thức nhân bản nào đó để tránh mất dữ liệu. Giống federation, không có master trung tâm duy nhất tuần tự hóa các thao tác ghi, nên bạn có thể ghi song song và tăng thông lượng.

Cách phổ biến để shard một bảng người dùng là theo chữ cái đầu của họ (last name) người dùng hoặc theo vị trí địa lý của người dùng.

##### Nhược điểm: sharding

- Bạn sẽ cần sửa logic ứng dụng để làm việc với các shard, có thể dẫn tới những truy vấn SQL phức tạp.
- Dữ liệu có thể phân bố lệch giữa các shard. Ví dụ, một nhóm người dùng hoạt động mạnh (power user) nằm trên cùng một shard có thể làm shard đó chịu tải cao hơn các shard khác.
    - Cân bằng lại (rebalancing) làm tăng thêm độ phức tạp. Một hàm sharding dựa trên [băm nhất quán (consistent hashing)](http://www.paperplanes.de/2011/12/9/the-magic-of-consistent-hashing.html) có thể giảm lượng dữ liệu phải chuyển đi.
- Kết hợp dữ liệu từ nhiều shard phức tạp hơn.
- Sharding làm tăng lượng phần cứng và tăng độ phức tạp.

##### Nguồn và đọc thêm: sharding

- [The coming of the shard](http://highscalability.com/blog/2009/8/6/an-unorthodox-approach-to-database-design-the-coming-of-the.html)
- [Shard database architecture](https://en.wikipedia.org/wiki/Shard_(database_architecture))
- [Consistent hashing](http://www.paperplanes.de/2011/12/9/the-magic-of-consistent-hashing.html)

#### Phi chuẩn hóa (Denormalization)

Phi chuẩn hóa cố gắng cải thiện hiệu năng đọc với cái giá là giảm một phần hiệu năng ghi. Các bản sao dư thừa của dữ liệu được ghi vào nhiều bảng để tránh các phép join tốn kém. Một số RDBMS như [PostgreSQL](https://en.wikipedia.org/wiki/PostgreSQL) và Oracle hỗ trợ [khung nhìn cụ thể hóa (materialized view)](https://en.wikipedia.org/wiki/Materialized_view), đảm nhận việc lưu thông tin dư thừa và giữ các bản sao dư thừa nhất quán với nhau.

Khi dữ liệu đã được phân tán bằng các kỹ thuật như [federation](#federation) và [sharding](#sharding), việc quản lý join xuyên trung tâm dữ liệu càng làm tăng độ phức tạp. Phi chuẩn hóa có thể giúp tránh phải thực hiện những phép join phức tạp như vậy.

Trong hầu hết hệ thống, số lượt đọc có thể áp đảo số lượt ghi theo tỉ lệ 100:1, thậm chí 1000:1. Một lượt đọc dẫn tới phép join phức tạp trong cơ sở dữ liệu có thể rất tốn kém, tiêu tốn đáng kể thời gian cho các thao tác đĩa.

##### Nhược điểm: phi chuẩn hóa

- Dữ liệu bị trùng lặp.
- Các ràng buộc (constraint) có thể giúp các bản sao dư thừa luôn đồng bộ, nhưng điều đó làm tăng độ phức tạp của thiết kế cơ sở dữ liệu.
- Một cơ sở dữ liệu phi chuẩn hóa chịu tải ghi nặng có thể chạy kém hơn phiên bản chuẩn hóa tương ứng.

###### Nguồn và đọc thêm: phi chuẩn hóa

- [Denormalization](https://en.wikipedia.org/wiki/Denormalization)

#### Tinh chỉnh SQL (SQL tuning)

Tinh chỉnh SQL là một chủ đề rộng và đã có nhiều [cuốn sách](https://www.amazon.com/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=sql+tuning) được viết để làm tài liệu tham khảo.

Điều quan trọng là phải **đo hiệu năng (benchmark)** và **phân tích hiệu năng (profile)** để mô phỏng và phát hiện nút thắt cổ chai (bottleneck).

- **Benchmark** - Mô phỏng tình huống tải cao bằng các công cụ như [ab](http://httpd.apache.org/docs/2.2/programs/ab.html).
- **Profile** - Bật các công cụ như [nhật ký truy vấn chậm (slow query log)](http://dev.mysql.com/doc/refman/5.7/en/slow-query-log.html) để giúp theo dõi các vấn đề hiệu năng.

Benchmark và profile có thể dẫn bạn tới các tối ưu sau.

##### Siết chặt lược đồ (Tighten up the schema)

- MySQL ghi xuống đĩa theo các khối liền kề để truy cập nhanh.
- Dùng `CHAR` thay cho `VARCHAR` với các trường có độ dài cố định.
    - `CHAR` cho phép truy cập ngẫu nhiên nhanh, trong khi với `VARCHAR`, bạn phải tìm điểm kết thúc của một chuỗi rồi mới chuyển sang chuỗi tiếp theo được.
- Dùng `TEXT` cho các khối văn bản lớn như bài blog. `TEXT` cũng cho phép tìm kiếm boolean. Dùng trường `TEXT` sẽ lưu trên đĩa một con trỏ dùng để định vị khối văn bản.
- Dùng `INT` cho các số lớn tới 2^32, tức khoảng 4 tỷ.
- Dùng `DECIMAL` cho tiền tệ để tránh lỗi biểu diễn số thực dấu phẩy động (floating point).
- Tránh lưu các `BLOBS` lớn, thay vào đó hãy lưu vị trí để lấy đối tượng.
- `VARCHAR(255)` là số ký tự lớn nhất có thể đếm bằng một số 8 bit, thường giúp tận dụng tối đa một byte trong một số RDBMS.
- Đặt ràng buộc `NOT NULL` ở những chỗ phù hợp để [cải thiện hiệu năng tìm kiếm](http://stackoverflow.com/questions/1017239/how-do-null-values-affect-performance-in-a-database-search).

##### Dùng chỉ mục tốt (Use good indices)

- Các cột bạn truy vấn (`SELECT`, `GROUP BY`, `ORDER BY`, `JOIN`) có thể nhanh hơn nhờ chỉ mục.
- Chỉ mục thường được biểu diễn dưới dạng [B-tree](https://en.wikipedia.org/wiki/B-tree) tự cân bằng, giữ dữ liệu có thứ tự và cho phép tìm kiếm, truy cập tuần tự, chèn và xóa trong thời gian logarit.
- Đặt chỉ mục có thể giữ dữ liệu trong bộ nhớ, đòi hỏi nhiều không gian hơn.
- Thao tác ghi cũng có thể chậm hơn vì chỉ mục cũng cần được cập nhật.
- Khi nạp lượng lớn dữ liệu, có thể sẽ nhanh hơn nếu tắt chỉ mục, nạp dữ liệu, rồi dựng lại chỉ mục.

##### Tránh các phép join tốn kém

- [Phi chuẩn hóa](#phi-chuẩn-hóa-denormalization) ở những chỗ hiệu năng đòi hỏi.

##### Phân vùng bảng (Partition tables)

- Tách một bảng bằng cách đưa các điểm nóng (hot spot) sang một bảng riêng để giúp giữ nó trong bộ nhớ.

##### Tinh chỉnh query cache

- Trong một số trường hợp, [query cache](https://dev.mysql.com/doc/refman/5.7/en/query-cache.html) có thể gây ra [vấn đề hiệu năng](https://www.percona.com/blog/2016/10/12/mysql-5-7-performance-tuning-immediately-after-installation/).

##### Nguồn và đọc thêm: tinh chỉnh SQL

- [Tips for optimizing MySQL queries](http://aiddroid.com/10-tips-optimizing-mysql-queries-dont-suck/)
- [Is there a good reason i see VARCHAR(255) used so often?](http://stackoverflow.com/questions/1217466/is-there-a-good-reason-i-see-varchar255-used-so-often-as-opposed-to-another-l)
- [How do null values affect performance?](http://stackoverflow.com/questions/1017239/how-do-null-values-affect-performance-in-a-database-search)
- [Slow query log](http://dev.mysql.com/doc/refman/5.7/en/slow-query-log.html)

### NoSQL

NoSQL là tập hợp các mục dữ liệu được biểu diễn trong một **kho khóa - giá trị (key-value store)**, **kho tài liệu (document store)**, **kho cột rộng (wide column store)** hoặc **cơ sở dữ liệu đồ thị (graph database)**. Dữ liệu được phi chuẩn hóa, và các phép join thường được thực hiện trong code ứng dụng. Hầu hết các kho NoSQL không có giao dịch ACID thực sự và ưu tiên [nhất quán cuối cùng (eventual consistency)](../01-danh-doi/04-consistency-patterns.md).

**BASE** thường được dùng để mô tả các thuộc tính của cơ sở dữ liệu NoSQL. So với [định lý CAP](../01-danh-doi/03-cap-theorem.md), BASE chọn tính sẵn sàng thay vì tính nhất quán.

- **Basically available (về cơ bản luôn sẵn sàng)** - hệ thống đảm bảo tính sẵn sàng.
- **Soft state (trạng thái mềm)** - trạng thái của hệ thống có thể thay đổi theo thời gian, kể cả khi không có đầu vào.
- **Eventual consistency (nhất quán cuối cùng)** - hệ thống sẽ trở nên nhất quán sau một khoảng thời gian, với điều kiện trong khoảng đó hệ thống không nhận thêm đầu vào.

Ngoài việc chọn giữa [SQL hay NoSQL](#sql-hay-nosql), cũng nên hiểu loại cơ sở dữ liệu NoSQL nào phù hợp nhất với (các) trường hợp sử dụng của bạn. Phần tiếp theo sẽ điểm qua **kho khóa - giá trị**, **kho tài liệu**, **kho cột rộng** và **cơ sở dữ liệu đồ thị**.

#### Kho khóa - giá trị (Key-value store)

> Trừu tượng hóa: bảng băm (hash table)

Một kho khóa - giá trị thường cho phép đọc và ghi trong O(1), và thường được lưu trên bộ nhớ hoặc SSD. Kho dữ liệu có thể giữ các khóa theo [thứ tự từ điển (lexicographic order)](https://en.wikipedia.org/wiki/Lexicographical_order), cho phép truy xuất hiệu quả một dải khóa. Kho khóa - giá trị có thể cho phép lưu siêu dữ liệu (metadata) đi kèm giá trị.

Kho khóa - giá trị cho hiệu năng cao và thường được dùng cho các mô hình dữ liệu đơn giản hoặc dữ liệu thay đổi nhanh, chẳng hạn một tầng cache trong bộ nhớ. Vì chúng chỉ cung cấp một tập thao tác hạn chế, độ phức tạp bị đẩy sang tầng ứng dụng nếu cần thêm thao tác.

Kho khóa - giá trị là nền tảng cho các hệ thống phức tạp hơn như kho tài liệu, và trong một số trường hợp là cả cơ sở dữ liệu đồ thị.

##### Nguồn và đọc thêm: kho khóa - giá trị

- [Key-value database](https://en.wikipedia.org/wiki/Key-value_database)
- [Disadvantages of key-value stores](http://stackoverflow.com/questions/4056093/what-are-the-disadvantages-of-using-a-key-value-table-over-nullable-columns-or)
- [Redis architecture](http://qnimate.com/overview-of-redis-architecture/)
- [Memcached architecture](https://adayinthelifeof.nl/2011/02/06/memcache-internals/)

#### Kho tài liệu (Document store)

> Trừu tượng hóa: kho khóa - giá trị với giá trị là các tài liệu

Kho tài liệu xoay quanh các tài liệu (XML, JSON, nhị phân, v.v.), trong đó một tài liệu lưu toàn bộ thông tin của một đối tượng. Kho tài liệu cung cấp API hoặc ngôn ngữ truy vấn để truy vấn dựa trên cấu trúc bên trong của chính tài liệu. *Lưu ý: nhiều kho khóa - giá trị có tính năng làm việc với siêu dữ liệu của giá trị, khiến ranh giới giữa hai kiểu lưu trữ này trở nên mờ nhạt.*

Tùy vào cách hiện thực bên dưới, tài liệu được tổ chức theo bộ sưu tập (collection), thẻ (tag), siêu dữ liệu hoặc thư mục. Dù các tài liệu có thể được tổ chức hoặc nhóm lại với nhau, chúng vẫn có thể có những trường hoàn toàn khác nhau.

Một số kho tài liệu như [MongoDB](https://www.mongodb.com/mongodb-architecture) và [CouchDB](https://blog.couchdb.org/2016/08/01/couchdb-2-0-architecture/) cũng cung cấp một ngôn ngữ giống SQL để thực hiện các truy vấn phức tạp. [DynamoDB](http://www.read.seas.harvard.edu/~kohler/class/cs239-w08/decandia07dynamo.pdf) hỗ trợ cả khóa - giá trị lẫn tài liệu.

Kho tài liệu mang lại tính linh hoạt cao và thường được dùng để làm việc với dữ liệu thỉnh thoảng thay đổi.

##### Nguồn và đọc thêm: kho tài liệu

- [Document-oriented database](https://en.wikipedia.org/wiki/Document-oriented_database)
- [MongoDB architecture](https://www.mongodb.com/mongodb-architecture)
- [CouchDB architecture](https://blog.couchdb.org/2016/08/01/couchdb-2-0-architecture/)
- [Elasticsearch architecture](https://www.elastic.co/blog/found-elasticsearch-from-the-bottom-up)

#### Kho cột rộng (Wide column store)

<p align="center">
  <img src="../../images/n16iOGk.png" alt="Sơ đồ cấu trúc kho cột rộng">
  <br/>
  <i>Nguồn: <a href="http://blog.grio.com/2015/11/sql-nosql-a-brief-history.html">SQL & NoSQL, a brief history</a></i>
</p>

> Trừu tượng hóa: map lồng nhau `ColumnFamily<RowKey, Columns<ColKey, Value, Timestamp>>`

Đơn vị dữ liệu cơ bản của kho cột rộng là một cột (cặp tên/giá trị). Các cột có thể được nhóm thành họ cột (column family, tương tự một bảng SQL). Siêu họ cột (super column family) lại nhóm các họ cột với nhau. Bạn có thể truy cập từng cột độc lập bằng khóa hàng (row key), và các cột có cùng khóa hàng tạo thành một hàng. Mỗi giá trị kèm một dấu thời gian (timestamp) dùng để quản lý phiên bản và giải quyết xung đột.

Google giới thiệu [Bigtable](http://www.read.seas.harvard.edu/~kohler/class/cs239-w08/chang06bigtable.pdf) là kho cột rộng đầu tiên, có ảnh hưởng tới [HBase](https://www.edureka.co/blog/hbase-architecture/) mã nguồn mở (thường dùng trong hệ sinh thái Hadoop) và [Cassandra](http://docs.datastax.com/en/cassandra/3.0/cassandra/architecture/archIntro.html) của Facebook. Các kho như BigTable, HBase và Cassandra giữ khóa theo thứ tự từ điển, cho phép truy xuất hiệu quả các dải khóa được chọn.

Kho cột rộng mang lại tính sẵn sàng cao và khả năng mở rộng cao. Chúng thường được dùng cho các tập dữ liệu rất lớn.

##### Nguồn và đọc thêm: kho cột rộng

- [SQL & NoSQL, a brief history](http://blog.grio.com/2015/11/sql-nosql-a-brief-history.html)
- [Bigtable architecture](http://www.read.seas.harvard.edu/~kohler/class/cs239-w08/chang06bigtable.pdf)
- [HBase architecture](https://www.edureka.co/blog/hbase-architecture/)
- [Cassandra architecture](http://docs.datastax.com/en/cassandra/3.0/cassandra/architecture/archIntro.html)

#### Cơ sở dữ liệu đồ thị (Graph database)

<p align="center">
  <img src="../../images/fNcl65g.png" alt="Ví dụ đồ thị thuộc tính trong cơ sở dữ liệu đồ thị">
  <br/>
  <i>Nguồn: <a href="https://en.wikipedia.org/wiki/File:GraphDatabase_PropertyGraph.png">Graph database</a></i>
</p>

> Trừu tượng hóa: đồ thị (graph)

Trong cơ sở dữ liệu đồ thị, mỗi nút (node) là một bản ghi và mỗi cung (arc) là một quan hệ giữa hai nút. Cơ sở dữ liệu đồ thị được tối ưu để biểu diễn các quan hệ phức tạp với nhiều khóa ngoại (foreign key) hoặc nhiều quan hệ nhiều - nhiều (many-to-many).

Cơ sở dữ liệu đồ thị cho hiệu năng cao với các mô hình dữ liệu có quan hệ phức tạp, chẳng hạn một mạng xã hội. Chúng còn tương đối mới và chưa được dùng rộng rãi; có thể khó tìm công cụ phát triển và tài liệu hơn. Nhiều cơ sở dữ liệu đồ thị chỉ có thể truy cập qua [REST API](09-communication.md).

##### Nguồn và đọc thêm: đồ thị

- [Graph database](https://en.wikipedia.org/wiki/Graph_database)
- [Neo4j](https://neo4j.com/)
- [FlockDB](https://blog.twitter.com/2010/introducing-flockdb)

#### Nguồn và đọc thêm: NoSQL

- [Explanation of base terminology](http://stackoverflow.com/questions/3342497/explanation-of-base-terminology)
- [NoSQL databases a survey and decision guidance](https://medium.com/baqend-blog/nosql-databases-a-survey-and-decision-guidance-ea7823a822d#.wskogqenq)
- [Scalability](https://web.archive.org/web/20220602114024/https://www.lecloud.net/post/7994751381/scalability-for-dummies-part-2-database)
- [Introduction to NoSQL](https://www.youtube.com/watch?v=qI_g07C_Q5I)
- [NoSQL patterns](http://horicky.blogspot.com/2009/11/nosql-patterns.html)

### SQL hay NoSQL

<p align="center">
  <img src="../../images/wXGqG5f.png" alt="So sánh chuyển đổi từ RDBMS sang NoSQL">
  <br/>
  <i>Nguồn: <a href="https://www.infoq.com/articles/Transition-RDBMS-NoSQL/">Transitioning from RDBMS to NoSQL</a></i>
</p>

Lý do chọn **SQL**:

- Dữ liệu có cấu trúc
- Lược đồ chặt chẽ
- Dữ liệu có quan hệ
- Cần các phép join phức tạp
- Giao dịch
- Có các mẫu mở rộng rõ ràng
- Lâu đời, vững chắc hơn: lập trình viên, cộng đồng, code, công cụ, v.v.
- Tra cứu theo chỉ mục rất nhanh

Lý do chọn **NoSQL**:

- Dữ liệu bán cấu trúc (semi-structured)
- Lược đồ động hoặc linh hoạt
- Dữ liệu phi quan hệ
- Không cần join phức tạp
- Lưu trữ nhiều TB (hoặc PB) dữ liệu
- Khối lượng công việc rất nặng về dữ liệu
- Thông lượng IOPS rất cao

Dữ liệu mẫu rất phù hợp với NoSQL:

- Thu nạp nhanh dữ liệu luồng nhấp chuột (clickstream) và log
- Dữ liệu bảng xếp hạng hoặc tính điểm
- Dữ liệu tạm thời, chẳng hạn giỏ hàng
- Các bảng được truy cập thường xuyên (bảng "nóng")
- Bảng siêu dữ liệu/bảng tra cứu

##### Nguồn và đọc thêm: SQL hay NoSQL

- [Scaling up to your first 10 million users](https://www.youtube.com/watch?v=kKjm4ehYiMs)
- [SQL vs NoSQL differences](https://www.sitepoint.com/sql-vs-nosql-differences/)

---

## Ghi chú của người dịch

**1. Thứ tự áp dụng quan trọng hơn danh sách kỹ thuật**

Bản gốc liệt kê sáu kỹ thuật ngang hàng, nhưng chúng có chi phí rất khác nhau. Thứ tự hợp lý khi một cơ sở dữ liệu quan hệ bắt đầu quá tải:

1. **Tinh chỉnh SQL và chỉ mục** - rẻ nhất, thường giải quyết phần lớn vấn đề. Trên bảng lớn, một truy vấn thiếu chỉ mục phải quét toàn bảng, có thể chậm hơn nhiều bậc độ lớn so với khi có chỉ mục phù hợp. Dùng `EXPLAIN` / `EXPLAIN ANALYZE` trước khi nghĩ tới kiến trúc.
2. **Mở rộng theo chiều dọc (vertical scaling)** - máy lớn hơn. Máy chủ cơ sở dữ liệu ngày nay có thể có hàng trăm GB tới vài TB RAM, đủ cho rất nhiều hệ thống.
3. **Cache** phía trước cơ sở dữ liệu (xem [Cache](07-cache.md) và [Caches](../00-nen-tang/03-caches.md)).
4. **Bản sao đọc (read replica)** - khi đọc là nút thắt.
5. **Federation** - khi các miền dữ liệu tách được tự nhiên.
6. **Sharding** - khi riêng lượng ghi hoặc lượng dữ liệu đã vượt quá một máy. Đây là bước đắt nhất và khó đảo ngược nhất.

Trong phỏng vấn, nhảy thẳng vào sharding mà không nói vì sao các bước trước không đủ là một điểm trừ.

**2. Thuật ngữ và các chi tiết đã lỗi thời trong bản gốc**

- **Master-slave** giờ thường gọi là **primary-replica** hoặc leader-follower (PostgreSQL dùng primary/standby; MySQL từ khoảng bản 8.0.22 chuyển sang `source`/`replica`, ví dụ `SHOW REPLICA STATUS`). Ý nghĩa không đổi.
- **Query cache của MySQL đã bị gỡ bỏ hoàn toàn từ MySQL 8.0**, nên mục "Tinh chỉnh query cache" giờ chỉ còn giá trị lịch sử. Bài học vẫn đúng: cache kết quả truy vấn ở tầng cơ sở dữ liệu thường bị vô hiệu hóa quá thường xuyên khi có ghi; cache ở tầng ứng dụng dễ kiểm soát hơn.
- **`CHAR` và `VARCHAR`**: lời khuyên "dùng `CHAR` cho nhanh" chủ yếu đúng với các engine cũ của MySQL. Trong PostgreSQL, tài liệu chính thức nói không có khác biệt hiệu năng đáng kể, và `CHAR` còn bị đệm khoảng trắng gây bất ngờ khi so sánh. Với `utf8mb4`, một ký tự có thể chiếm tới 4 byte, nên `CHAR(n)` không còn cố định theo byte.
- **`VARCHAR(255)`**: ý đúng là trong MySQL, tiền tố độ dài dùng 1 byte khi độ dài tối đa (tính bằng **byte**) không vượt 255, và 2 byte khi vượt. Với `utf8mb4`, `VARCHAR(255)` đã có thể vượt 255 byte. Đừng chọn 255 theo thói quen - hãy chọn theo nghiệp vụ.
- **`INT`**: `INT` có dấu tối đa khoảng 2,1 tỷ (2^31 - 1); 4 tỷ chỉ đúng với `INT UNSIGNED`. Khóa chính của bảng tăng trưởng nhanh nên dùng `BIGINT` ngay từ đầu - hết dải `INT` giữa chừng là loại sự cố rất đau đầu.
- **"`TEXT` cho phép tìm kiếm boolean"** là nói về chỉ mục `FULLTEXT` của MySQL. Nhu cầu tìm kiếm thật sự thường dùng hệ chuyên dụng (Elasticsearch, OpenSearch) hoặc full-text search của PostgreSQL.
- **Materialized view của PostgreSQL không tự cập nhật**: bạn phải chạy `REFRESH MATERIALIZED VIEW` (có thể kèm `CONCURRENTLY`). Câu "giữ các bản sao dư thừa nhất quán" trong bản gốc dễ gây hiểu lầm với PostgreSQL; Oracle thì có cơ chế fast refresh.
- **"Hầu hết NoSQL không có ACID"** đã không còn đúng nhiều: MongoDB hỗ trợ giao dịch ACID nhiều tài liệu từ bản 4.0, DynamoDB có API giao dịch. Tuy vậy, giao dịch xuyên phân vùng trong các hệ này vẫn đắt và có giới hạn.
- **"Cơ sở dữ liệu đồ thị còn mới, chưa phổ biến"** cũng đã cũ: Neo4j, Amazon Neptune đã trưởng thành, và ISO đã công bố chuẩn ngôn ngữ truy vấn đồ thị GQL vào năm 2024. FlockDB của Twitter thì đã ngừng phát triển từ lâu.
- **DynamoDB không phải Dynamo**: link trong bản gốc là bài báo Dynamo (2007), một hệ nội bộ của Amazon. DynamoDB là dịch vụ khác, kiến trúc khác (có bài báo riêng năm 2022), dù thừa hưởng một số ý tưởng.

**3. Ví dụ sharding trong bản gốc là một ví dụ xấu**

Shard theo **chữ cái đầu của họ** gần như chắc chắn gây lệch tải - với người Việt thì còn tệ hơn, vì một phần rất lớn dân số mang họ Nguyễn. Các chiến lược thực tế:

| Chiến lược | Cách làm | Ưu | Nhược |
|---|---|---|---|
| Theo dải (range) | `user_id` 1-1 triệu vào shard A, ... | Truy vấn theo dải hiệu quả | Điểm nóng ở dải mới nhất |
| Theo băm (hash) | `hash(user_id) mod N` | Phân bố đều | Đổi N là phải chuyển gần hết dữ liệu |
| Băm nhất quán | Vòng băm với node ảo | Thêm/bớt node chỉ chuyển một phần nhỏ | Phức tạp hơn, vẫn mất truy vấn theo dải |
| Theo thư mục (directory) | Bảng tra khóa → shard | Linh hoạt, dễ di chuyển từng khách hàng | Bảng tra là một phụ thuộc mới phải giữ sẵn sàng |
| Theo địa lý / tenant | Theo vùng hoặc theo khách hàng doanh nghiệp | Dữ liệu gần người dùng, đáp ứng yêu cầu lưu trữ dữ liệu trong nước | Vùng/khách hàng lớn vẫn có thể lệch |

Điều quyết định nhất là **chọn khóa shard (shard key)**: nó phải xuất hiện trong hầu hết truy vấn, nếu không mỗi truy vấn phải hỏi tất cả shard (scatter-gather). Và một khi đã chọn thì rất khó đổi.

**4. Độ trễ nhân bản: lỗi mà người dùng thấy ngay**

Với bản sao đọc bất đồng bộ, kịch bản kinh điển: người dùng sửa hồ sơ, trang tải lại đọc từ replica chưa kịp cập nhật, và họ thấy dữ liệu cũ. Các cách xử lý:

- **Đọc lại dữ liệu của chính mình (read-your-writes)**: sau khi một người dùng ghi, các lượt đọc của chính người đó trong vài giây tiếp theo đi thẳng vào primary.
- Theo dõi vị trí nhân bản (ví dụ LSN trong PostgreSQL, GTID trong MySQL) và chỉ đọc từ replica đã bắt kịp.
- Đọc những dữ liệu nhạy cảm (số dư, tồn kho) từ primary.

Đây là ứng dụng trực tiếp của [Các mẫu nhất quán](../01-danh-doi/04-consistency-patterns.md). Còn rủi ro mất dữ liệu khi primary hỏng thì đã bàn ở [Các mẫu sẵn sàng](../01-danh-doi/05-availability-patterns.md) (RPO/RTO).

**5. Master-master: hãy thận trọng**

Ghi ở cả hai nơi nghe hấp dẫn, nhưng hai người cùng sửa một bản ghi ở hai node là xung đột, và các chiến lược như "bản ghi sau cùng thắng" (last-write-wins) sẽ **âm thầm làm mất dữ liệu**. Trong thực tế, nhiều hệ dùng master-master chỉ để chuyển đổi dự phòng nhanh, còn ghi thì vẫn chỉ đi vào một node tại một thời điểm. Nếu thật sự cần ghi đa vùng, nên cân nhắc các hệ được thiết kế cho việc đó thay vì tự dựng.

**6. Bức tranh 2026: ranh giới SQL và NoSQL đã mờ đi**

- **SQL phân tán (distributed SQL / NewSQL)**: Google Spanner, CockroachDB, TiDB, YugabyteDB cung cấp SQL và giao dịch ACID nhưng tự sharding và nhân bản bên dưới. Chúng xóa bớt lý do "chọn NoSQL để mở rộng", đổi lại độ trễ ghi cao hơn do phải đồng thuận (consensus) giữa các node.
- **Sharding có sẵn công cụ**: Vitess (MySQL, dùng ở YouTube, Slack), Citus (PostgreSQL) giúp không phải tự viết logic định tuyến shard trong ứng dụng.
- **Dịch vụ được quản lý**: Amazon Aurora, Cloud SQL, AlloyDB, Neon... tách lưu trữ khỏi tính toán, tạo replica rất nhanh. Phần lớn công việc nhân bản và chuyển đổi dự phòng mô tả trong bản gốc giờ là một tùy chọn cấu hình - nhưng hiểu cơ chế vẫn cần để biết giới hạn của nó.
- **PostgreSQL "làm được nhiều thứ"**: cột `JSONB` cho dữ liệu bán cấu trúc, full-text search, và phần mở rộng pgvector cho tìm kiếm vector. Với nhiều hệ thống vừa và nhỏ, một PostgreSQL tốt thay được hai ba loại cơ sở dữ liệu.
- **Redis** vẫn là kho khóa - giá trị phổ biến nhất; sau khi Redis đổi giấy phép năm 2024, Linux Foundation có nhánh mã nguồn mở Valkey, và các nhà cung cấp đám mây lớn đã hỗ trợ Valkey.

| Loại | Ví dụ hiện nay | Hợp nhất với | Tránh khi |
|---|---|---|---|
| Quan hệ | PostgreSQL, MySQL | Mặc định cho hầu hết nghiệp vụ, giao dịch | Hiếm khi cần tránh ở quy mô vừa |
| SQL phân tán | Spanner, CockroachDB, TiDB | Cần ACID và vượt quá một máy, đa vùng | Hệ nhỏ - trả giá độ trễ và chi phí không cần thiết |
| Khóa - giá trị | Redis/Valkey, DynamoDB | Cache, phiên, bộ đếm, truy cập theo khóa | Cần truy vấn linh hoạt |
| Tài liệu | MongoDB, Firestore | Đối tượng tự chứa, lược đồ thay đổi | Dữ liệu quan hệ chằng chịt |
| Cột rộng | Cassandra, ScyllaDB, Bigtable | Ghi cực nhiều, chuỗi thời gian, truy cập theo mẫu biết trước | Truy vấn đặc biệt (ad hoc), cần join |
| Đồ thị | Neo4j, Neptune | Duyệt quan hệ nhiều bước (bạn của bạn, phát hiện gian lận) | Quan hệ đơn giản - SQL đủ dùng |

**7. Bẫy thường gặp với NoSQL**

- **Thiết kế theo truy vấn, không theo thực thể.** Với Cassandra hay DynamoDB, bạn phải biết trước mình sẽ truy vấn thế nào rồi mới thiết kế bảng; thêm một kiểu truy vấn mới sau này có thể phải dựng thêm bảng hoặc chỉ mục phụ. Ngược hẳn với cách chuẩn hóa ở SQL.
- **"Không có lược đồ" chỉ là lược đồ nằm trong code.** Dữ liệu cũ và mới cùng tồn tại với nhiều hình dạng khác nhau, và code phải xử lý tất cả.
- **Khóa nóng (hot partition/key)** tồn tại ở cả NoSQL: một người nổi tiếng hay một sản phẩm đang giảm giá dồn toàn bộ tải vào một phân vùng.
- **Chọn NoSQL "để mở rộng" khi dữ liệu mới vài chục GB** là tối ưu hóa sớm; một máy PostgreSQL xử lý được quy mô đó thoải mái.

**8. Nối với các mục khác**

- [Databases](../00-nen-tang/02-databases.md): bài nền tảng kể con đường thực tế từ MySQL một máy tới phi chuẩn hóa và NoSQL - đọc trước mục này rất hợp.
- [Định lý CAP](../01-danh-doi/03-cap-theorem.md): cơ sở lý thuyết cho BASE và cho việc NoSQL chọn sẵn sàng thay vì nhất quán.
- [Các mẫu nhất quán](../01-danh-doi/04-consistency-patterns.md) và [Các mẫu sẵn sàng](../01-danh-doi/05-availability-patterns.md): nhân bản đồng bộ/bất đồng bộ, mất dữ liệu khi chuyển đổi dự phòng.
- [Tầng ứng dụng](05-application-layer.md): federation ở tầng dữ liệu thường song hành với việc tách microservices, mỗi dịch vụ sở hữu cơ sở dữ liệu riêng.
- [Cache](07-cache.md): mục kế tiếp, lớp bảo vệ đầu tiên trước khi phải mở rộng cơ sở dữ liệu.

**9. Câu hỏi nên tự hỏi trong buổi phỏng vấn system design**

- Tỉ lệ đọc/ghi là bao nhiêu? Lượng dữ liệu sau vài năm là bao nhiêu? (Hai con số này quyết định gần hết các lựa chọn phía sau.)
- Dữ liệu nào bắt buộc nhất quán mạnh (tiền, tồn kho), dữ liệu nào chấp nhận nhất quán cuối cùng (lượt thích, bảng tin)?
- Các mẫu truy vấn chính là gì? Có cần join, truy vấn theo dải, hay chỉ tra theo khóa?
- Nếu phải shard thì khóa shard là gì, và truy vấn nào sẽ phải hỏi tất cả shard?
- Người dùng có chấp nhận thấy dữ liệu cũ vài giây sau khi ghi không? Nếu không, xử lý độ trễ nhân bản thế nào?
- Khi primary chết, ai (hoặc cái gì) nâng replica lên, mất bao lâu, và mất bao nhiêu dữ liệu?

Đối chiếu README gốc của repo:
- [Database](../../README.md#database)
- [Cache](../../README.md#cache) - mục kế tiếp
