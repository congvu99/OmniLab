---
nguon: The System Design Primer - mục "Latency vs throughput"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../README.md#latency-vs-throughput
tai-lieu-tham-khao: Understanding latency vs throughput (Cadence Community)
ngay-dich: 2026-09-22
trang-thai: hoan-thanh
---

# Độ trễ và thông lượng (Latency vs Throughput)

## Nội dung gốc

**Độ trễ (latency)** là khoảng thời gian để thực hiện một hành động hoặc tạo ra một kết quả.

**Thông lượng (throughput)** là số lượng hành động hoặc kết quả như vậy trên một đơn vị thời gian.

Nhìn chung, bạn nên nhắm tới **thông lượng tối đa** với **độ trễ chấp nhận được**.

### Nguồn và đọc thêm

- [Understanding latency vs throughput](https://community.cadence.com/cadence_blogs_8/b/fv/posts/understanding-latency-vs-throughput)

---

## Ghi chú của người dịch

**1. Hai đại lượng, hai đơn vị - đừng nhầm lẫn**

| | Độ trễ | Thông lượng |
|---|---|---|
| Trả lời câu hỏi | "Một việc mất bao lâu?" | "Làm được bao nhiêu việc mỗi giây?" |
| Đơn vị | ms, µs, s | req/s, QPS, MB/s, giao dịch/phút |
| Người dùng cảm nhận | Trực tiếp - chờ lâu là thấy ngay | Gián tiếp - chỉ thấy khi hệ thống quá tải |
| Đo ở đâu | Từng request | Cả hệ thống, trong một khoảng thời gian |

Ví dụ kinh điển: một đường ống nước. **Độ trễ** là thời gian giọt nước đi từ đầu này sang đầu kia. **Thông lượng** là số lít chảy qua mỗi giây. Ống dài hơn → độ trễ tăng, thông lượng không đổi. Ống to hơn → thông lượng tăng, độ trễ không đổi. Hai thứ độc lập nhau về mặt vật lý.

Ví dụ gần hơn với đời thường: chuyển 10 TB dữ liệu bằng cách chở ổ cứng trên xe tải qua thành phố. **Thông lượng cực cao** (10 TB / 2 giờ vượt xa mọi đường truyền internet), **độ trễ cực tệ** (2 giờ cho byte đầu tiên). Ngược lại, một gói tin ping mất 5 ms nhưng chỉ mang được 64 byte.

**2. Vì sao lời khuyên gốc là "thông lượng tối đa với độ trễ chấp nhận được"**

Câu này ngắn nhưng nói lên thứ tự ưu tiên trong thiết kế hệ thống: độ trễ là **ràng buộc**, thông lượng là **mục tiêu tối ưu**.

Lý do: độ trễ có một ngưỡng mà dưới ngưỡng đó người dùng không phân biệt được nữa. Giảm từ 2 s xuống 200 ms là cải thiện lớn; giảm từ 50 ms xuống 45 ms thì gần như không ai nhận ra, nhưng để làm được có thể phải hy sinh rất nhiều thông lượng. Ngược lại, thông lượng cao hơn luôn có giá trị: hoặc phục vụ được nhiều người hơn, hoặc dùng ít máy hơn cho cùng lượng người.

Nói cách khác: **đặt ngưỡng độ trễ trước (SLO), rồi vắt kiệt thông lượng trong phạm vi ngưỡng đó.**

**3. Đánh đổi thật sự nằm ở đâu**

Hai đại lượng độc lập về định nghĩa, nhưng trong hệ thống thật chúng kéo nhau. Những chỗ hay gặp:

- **Gom lô (batching)**: gom 100 bản ghi rồi ghi một lần → thông lượng tăng mạnh, nhưng bản ghi đầu tiên phải chờ 99 bản còn lại → độ trễ tăng. Kafka, ghi log, cập nhật chỉ mục tìm kiếm đều dùng chiêu này.
- **Xếp hàng (queuing)**: hàng đợi giúp hệ thống không sập khi tải dồn, nhưng mỗi request phải xếp hàng. Đây là lý do [bất đồng bộ](../00-nen-tang/04-asynchronism.md) đổi độ trễ lấy khả năng chịu tải.
- **Tăng số kết nối đồng thời**: đẩy thông lượng lên đến một điểm nào đó, sau đó tranh chấp tài nguyên làm độ trễ bùng nổ còn thông lượng thì đứng yên hoặc tụt.

Quy luật đáng nhớ (định luật Little): **số việc đang xử lý = thông lượng × độ trễ**. Nếu hệ thống đã bão hòa, thông lượng không tăng được nữa thì mọi nỗ lực nhồi thêm request chỉ làm độ trễ tăng tuyến tính. Đây chính là cảm giác "web chậm dần rồi treo" khi có sự kiện sale.

**4. Trung bình là con số nói dối - phải dùng phân vị**

Đây là phần README gốc không nhắc nhưng bắt buộc phải biết.

Độ trễ trung bình 100 ms có thể che giấu việc 1% người dùng chờ 5 giây. Trong hệ thống thật, nên nhìn:

- **p50 (trung vị)** - trải nghiệm của người dùng điển hình
- **p95 / p99** - trải nghiệm của nhóm tệ nhất, thường là khách hàng lớn nhất (nhiều dữ liệu nhất → truy vấn nặng nhất)
- **p99.9** - nơi các vấn đề hạ tầng lộ diện: GC pause, retry, cache miss, node chậm

Vì sao đuôi (tail latency) quan trọng hơn vẻ ngoài của nó: nếu một trang web gọi 10 dịch vụ nội bộ song song và phải chờ tất cả, thì chỉ cần mỗi dịch vụ có p99 = 1 s, xác suất trang đó chậm đã là khoảng 1 - 0,99^10 ≈ **10%**. Đuôi của các dịch vụ con cộng dồn thành thân của dịch vụ cha. Google gọi hiện tượng này là *tail at scale*.

**5. Ba loại độ trễ không thể tối ưu bằng code**

Khi phân tích độ trễ, tách rõ phần nào là do mình, phần nào là do vật lý:

| Loại | Nguồn gốc | Có giảm được không |
|---|---|---|
| Truyền dẫn | Tốc độ ánh sáng trong cáp quang | Không - chỉ có thể **đặt máy gần người dùng hơn** ([CDN](../../README.md#content-delivery-network), multi-region) |
| Xử lý | Code, truy vấn, tuần tự hóa | Có - tối ưu, thêm index, [cache](../00-nen-tang/03-caches.md) |
| Xếp hàng | Chờ tài nguyên bận | Có - thêm năng lực, giảm tranh chấp |

Con số nên thuộc: một vòng round-trip Việt Nam - Mỹ khoảng **150-200 ms**, và **không có cách nào rút ngắn** ngoài việc không đi Mỹ nữa. Đây là lý do CDN tồn tại, và là lý do mọi bài toán "giảm độ trễ cho người dùng toàn cầu" cuối cùng đều thành bài toán "đặt dữ liệu ở đâu".

**6. Nối với mục trước và mục sau**

- [Hiệu năng và khả năng mở rộng](01-performance-vs-scalability.md) hỏi *"chậm vì bản thân chậm, hay chậm vì đông?"*. Mục này cung cấp hai cây thước để đo chính xác câu trả lời đó: hiệu năng kém → độ trễ tệ ngay cả khi tải thấp; mở rộng kém → độ trễ tăng vọt khi thông lượng tăng.
- Mục tiếp theo, [CAP theorem](../../README.md#cap-theorem), thêm chiều thứ ba: khi mạng chia cắt, hệ thống phải chọn giữa trả lời chậm/không trả lời (nhất quán) và trả lời nhanh nhưng có thể cũ (sẵn sàng). Độ trễ lúc đó không còn là vấn đề kỹ thuật thuần túy mà thành một lựa chọn về ngữ nghĩa dữ liệu.

**7. Câu hỏi nên tự hỏi trong buổi phỏng vấn system design**

- Yêu cầu độ trễ là bao nhiêu, và ở **phân vị nào**? ("p99 dưới 300 ms" là yêu cầu; "nhanh" thì không.)
- Thông lượng đỉnh so với trung bình chênh nhau mấy lần? (Tỉ lệ này quyết định phải dự phòng bao nhiêu, hay phải dùng hàng đợi.)
- Có thao tác nào chấp nhận được độ trễ cao không? (Nếu có → đẩy sang xử lý nền, đổi lấy độ trễ thấp cho đường đi chính.)
- Người dùng ở đâu? (Quyết định có cần CDN / multi-region hay không, trước cả khi bàn tới cache.)

Đối chiếu README gốc của repo:
- [Latency vs throughput](../../README.md#latency-vs-throughput)
- [Availability vs consistency](../../README.md#availability-vs-consistency) - mục kế tiếp
