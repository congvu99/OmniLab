---
nguon: The System Design Primer - mục "Consistency patterns"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../README.md#consistency-patterns
tai-lieu-tham-khao: Transactions across data centers (Ryan Barrett, Google I/O 2009)
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Các mẫu nhất quán (Consistency Patterns)

## Nội dung gốc

Khi có nhiều bản sao của cùng một dữ liệu, ta đứng trước các lựa chọn về cách đồng bộ chúng sao cho client nhìn thấy dữ liệu một cách nhất quán. Nhắc lại định nghĩa tính nhất quán trong [định lý CAP](03-cap-theorem.md): mọi lần đọc đều nhận được kết quả của lần ghi gần nhất, hoặc nhận lỗi.

### Nhất quán yếu (Weak consistency)

Sau một lần ghi, các lần đọc có thể thấy hoặc không thấy dữ liệu mới. Hệ thống chỉ cố gắng ở mức tốt nhất có thể (best effort).

Cách tiếp cận này xuất hiện trong các hệ như memcached. Nhất quán yếu phù hợp với những tình huống thời gian thực như VoIP, video chat, game nhiều người chơi thời gian thực. Ví dụ, nếu bạn đang gọi điện và mất sóng vài giây, khi có sóng lại bạn sẽ không nghe được những gì đã nói trong lúc mất kết nối.

### Nhất quán cuối cùng (Eventual consistency)

Sau một lần ghi, các lần đọc rồi sẽ thấy dữ liệu mới (thường trong vòng vài mili-giây). Dữ liệu được nhân bản bất đồng bộ.

Cách tiếp cận này xuất hiện trong các hệ như DNS và email. Nhất quán cuối cùng phù hợp với các hệ thống có tính sẵn sàng cao.

### Nhất quán mạnh (Strong consistency)

Sau một lần ghi, các lần đọc sẽ thấy dữ liệu mới. Dữ liệu được nhân bản đồng bộ.

Cách tiếp cận này xuất hiện trong các hệ thống tệp và các hệ quản trị cơ sở dữ liệu quan hệ (RDBMS). Nhất quán mạnh phù hợp với các hệ thống cần giao dịch (transaction).

### Nguồn và đọc thêm

- [Transactions across data centers](http://snarfed.org/transactions_across_datacenters_io.html)

---

## Ghi chú của người dịch

**1. Ba mức này là một dải liên tục, không phải ba hộp riêng biệt**

Cách dễ nhớ nhất là xếp chúng theo câu hỏi *"lần đọc sau khi ghi thấy gì?"*:

| Mức | Đọc thấy dữ liệu mới? | Nhân bản | Giá phải trả |
|---|---|---|---|
| Yếu | Có thể có, có thể không, **vĩnh viễn** | Không đảm bảo | Mất dữ liệu, nhưng nhanh nhất và rẻ nhất |
| Cuối cùng | Không ngay, nhưng **chắc chắn sẽ thấy** | Bất đồng bộ | Cửa sổ dữ liệu cũ, logic ứng dụng phức tạp hơn |
| Mạnh | **Thấy ngay** | Đồng bộ | Độ trễ ghi cao, sẵn sàng thấp hơn khi có sự cố |

Điểm phân biệt then chốt giữa **yếu** và **cuối cùng**: nhất quán cuối cùng có **lời hứa hội tụ** - dữ liệu sẽ đồng nhất nếu ngừng ghi đủ lâu. Nhất quán yếu **không hứa gì cả**; dữ liệu mất là mất luôn. Ví dụ cuộc gọi VoIP trong bản gốc minh họa chính xác điểm này: đoạn âm thanh mất trong lúc rớt sóng không bao giờ được gửi lại.

**2. Nhất quán cuối cùng trên thực tế "cuối cùng" là bao lâu?**

Bản gốc nói "thường trong vòng vài mili-giây", đúng cho trường hợp bình thường nhưng che mất phần nguy hiểm. Con số này là **độ trễ nhân bản (replication lag)**, và nó không cố định:

- Trong cùng trung tâm dữ liệu: dưới 1 ms đến vài ms.
- Xuyên vùng địa lý: hàng chục đến hàng trăm ms.
- Khi bản sao đang bận, đang rebuild index, hoặc vừa khởi động lại: **hàng giây đến hàng phút**.
- Khi mạng phân mảnh: **vô hạn cho tới khi khắc phục xong**.

Lỗi kinh điển sinh ra từ đây: người dùng sửa hồ sơ, hệ thống ghi vào master, rồi chuyển hướng sang trang xem hồ sơ - trang này đọc từ replica chưa kịp cập nhật, nên hiển thị dữ liệu cũ. Người dùng tưởng thao tác thất bại và sửa lại lần nữa. Đây là lý do cần biết tới các đảm bảo bổ sung ở mục 3.

**3. Các mức trung gian mà bản gốc không nhắc - nhưng dùng nhiều nhất trong thực tế**

Giữa "cuối cùng" và "mạnh" có vài đảm bảo rất hữu ích, chi phí thấp hơn nhất quán mạnh nhiều:

- **Đọc-thấy-ghi-của-mình (read-your-writes)**: người dùng luôn thấy thay đổi *của chính mình*, còn thay đổi của người khác thì có thể trễ. Cách làm phổ biến: sau khi ghi, ghim (pin) các lần đọc của phiên đó vào master trong vài giây. Đây là lời giải trực tiếp cho lỗi ở mục 2.
- **Đọc đơn điệu (monotonic reads)**: đã thấy dữ liệu mới thì không bao giờ thấy lại dữ liệu cũ hơn. Không có đảm bảo này, người dùng làm mới trang hai lần có thể thấy bình luận xuất hiện rồi biến mất - do hai lần đọc rơi vào hai replica có độ trễ khác nhau. Cách làm: gắn mỗi phiên vào một replica cố định.
- **Nhất quán nhân quả (causal consistency)**: nếu B là phản hồi của A thì không ai thấy B trước khi thấy A. Quan trọng với bình luận, tin nhắn, chuỗi trả lời.

Trong phỏng vấn, nhắc được "read-your-writes" thay vì chỉ nói "eventual consistency" là khác biệt rõ rệt, vì nó cho thấy bạn nghĩ tới trải nghiệm người dùng chứ không chỉ thuộc tính hệ thống.

**4. Nhất quán mạnh đắt ở chỗ nào**

"Nhân bản đồng bộ" nghe gọn, nhưng hàm ý ba chi phí:

1. **Độ trễ**: mỗi lần ghi phải chờ ít nhất một vòng round-trip tới các bản sao. Xuyên lục địa là 150-200 ms mỗi lần ghi, xem [Độ trễ và thông lượng](02-latency-vs-throughput.md).
2. **Tính sẵn sàng**: nếu bản sao bắt buộc không phản hồi, lần ghi **thất bại**. Càng nhiều bản sao đồng bộ, xác suất có một cái hỏng càng cao - đây chính là công thức "sẵn sàng nối tiếp" ở [Các mẫu sẵn sàng](05-availability-patterns.md).
3. **Thông lượng**: giữ khóa lâu hơn nghĩa là ít giao dịch song song hơn.

Vì vậy nguyên tắc thực dụng: **dùng nhất quán mạnh cho phần nhỏ dữ liệu thực sự cần, phần còn lại để nhất quán cuối cùng.** Trong một hệ thương mại điện tử, thường chỉ tồn kho, thanh toán và số dư cần mạnh; danh mục sản phẩm, đánh giá, lịch sử xem đều không cần.

**5. Đối chiếu nhanh với hệ thật**

| Hệ thống | Mức mặc định | Ghi chú |
|---|---|---|
| memcached, Redis (không bền vững) | Yếu | Mất cache là mất luôn, tính lại từ nguồn |
| DNS | Cuối cùng | TTL quyết định độ dài cửa sổ dữ liệu cũ, có thể tới hàng giờ |
| Cassandra, DynamoDB | Cuối cùng | Chỉnh lên mạnh được, xem [CAP](03-cap-theorem.md) mục 5 |
| PostgreSQL, MySQL (đọc từ master) | Mạnh | Đọc từ replica thì tụt xuống cuối cùng |
| Hệ thống tệp cục bộ | Mạnh | Ghi xong đọc lại thấy ngay |

Điểm đáng chú ý: **cùng một cơ sở dữ liệu có thể cho hai mức khác nhau tùy chỗ đọc.** MySQL đọc từ master là mạnh, đọc từ read replica là cuối cùng. Rất nhiều sự cố "dữ liệu lúc có lúc không" bắt nguồn từ việc thêm read replica để giảm tải mà quên rằng mức nhất quán đã thay đổi.

**6. Nối với các mục khác**

- [CAP](03-cap-theorem.md) nói *phải* chọn giữa C và A khi mạng hỏng; mục này nói *chọn như thế nào* trong thực tế.
- [Caches](../00-nen-tang/03-caches.md) là ví dụ sống của nhất quán yếu và cuối cùng: mọi cache đều là một bản sao có thể cũ, và chiến lược vô hiệu hóa cache chính là chiến lược nhất quán.
- [Asynchronism](../00-nen-tang/04-asynchronism.md) là công cụ chính để đạt nhất quán cuối cùng: đẩy việc đồng bộ ra khỏi đường đi của request.
- [Databases](../00-nen-tang/02-databases.md) bàn về nhân bản master-slave, nơi độ trễ nhân bản sinh ra cửa sổ dữ liệu cũ.

**7. Câu hỏi nên tự hỏi trong buổi phỏng vấn system design**

- Dữ liệu này nếu cũ 1 giây thì sao? Cũ 1 phút thì sao? (Hai câu trả lời khác nhau sẽ cho hai thiết kế khác nhau.)
- Người ghi có phải người đọc ngay sau đó không? (Nếu có thì cần read-your-writes, không cần nhất quán mạnh toàn cục.)
- Có thao tác nào đọc rồi ghi dựa trên giá trị vừa đọc không? (Trừ tồn kho, cộng số dư - những chỗ này cần nhất quán mạnh hoặc khóa lạc quan.)
- Khi hai bản sao xung đột thì giải quyết thế nào? (Ghi sau thắng? Gộp? Hỏi người dùng? Bản gốc không nhắc nhưng đây là phần bắt buộc của mọi thiết kế nhất quán cuối cùng.)

Đối chiếu README gốc của repo:
- [Consistency patterns](../../README.md#consistency-patterns)
- [Availability patterns](../../README.md#availability-patterns) - mục kế tiếp
