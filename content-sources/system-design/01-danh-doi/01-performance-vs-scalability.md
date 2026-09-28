---
nguon: The System Design Primer - mục "Performance vs scalability"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../README.md#performance-vs-scalability
tai-lieu-tham-khao: A word on scalability (Werner Vogels, 2006)
ngay-dich: 2026-09-21
trang-thai: hoan-thanh
---

# Hiệu năng và khả năng mở rộng (Performance vs Scalability)

## Nội dung gốc

Một dịch vụ được gọi là **có khả năng mở rộng (scalable)** nếu nó cho ra **hiệu năng (performance)** tăng lên **tỉ lệ thuận với lượng tài nguyên được thêm vào**. Thông thường, tăng hiệu năng nghĩa là phục vụ được nhiều đơn vị công việc hơn, nhưng cũng có thể là xử lý được những đơn vị công việc lớn hơn - ví dụ khi tập dữ liệu phình to.

Một cách nhìn khác về hiệu năng và khả năng mở rộng:

- Nếu bạn gặp vấn đề về **hiệu năng**, hệ thống của bạn **chậm với một người dùng duy nhất**.
- Nếu bạn gặp vấn đề về **khả năng mở rộng**, hệ thống của bạn **nhanh với một người dùng, nhưng chậm khi tải nặng**.

### Nguồn và đọc thêm

- [A word on scalability](http://www.allthingsdistributed.com/2006/03/a_word_on_scalability.html)
- [Scalability, availability, stability, patterns](http://www.slideshare.net/jboner/scalability-availability-stability-patterns/)

---

## Ghi chú của người dịch

**1. Vì sao mục này ngắn nhưng lại đặt ở đầu phần "đánh đổi"**

Nội dung gốc chỉ vài dòng, nhưng nó là **bộ lọc chẩn đoán** dùng cho mọi mục còn lại. Trước khi bàn cache, load balancer hay sharding, phải trả lời được: hệ thống đang chậm vì *bản thân nó chậm*, hay vì *nó không chịu nổi tải*? Hai bệnh này chữa bằng hai loại thuốc hoàn toàn khác nhau.

| | Vấn đề hiệu năng | Vấn đề khả năng mở rộng |
|---|---|---|
| Triệu chứng | Chậm ngay cả khi chỉ có 1 người dùng | Nhanh với 1 người, chậm khi đông |
| Nguyên nhân hay gặp | Thuật toán tồi, truy vấn N+1, thiếu index, gọi mạng tuần tự | Hết kết nối DB, nghẽn CPU/băng thông, tranh chấp khóa, điểm nghẽn dùng chung |
| Cách chữa | Tối ưu code, thêm index, gộp truy vấn, tính trước | Thêm máy, tách tầng, [cache](../00-nen-tang/03-caches.md), [bất đồng bộ](../00-nen-tang/04-asynchronism.md), [nhân bản](../00-nen-tang/01-clones.md) |
| Thêm máy có giúp không? | **Không** | **Có** - nếu kiến trúc cho phép |

Sai lầm kinh điển: gặp vấn đề hiệu năng nhưng lại đi mua thêm server. Một truy vấn thiếu index thì chạy trên 100 máy vẫn chậm y như chạy trên 1 máy - chỉ tốn tiền gấp 100 lần.

**2. Định nghĩa của Werner Vogels - chỗ dễ bỏ sót**

Định nghĩa gốc nhấn mạnh hai chữ **"tỉ lệ thuận"**. Đây mới là phần quan trọng, không phải chữ "tăng".

- Thêm gấp đôi tài nguyên mà hiệu năng tăng gấp đôi → mở rộng tốt.
- Thêm gấp đôi tài nguyên mà hiệu năng chỉ tăng 1,2 lần → **không** phải hệ thống có khả năng mở rộng, chỉ là hệ thống đang được vá tạm bằng tiền.
- Thêm máy mà hiệu năng **giảm** → hoàn toàn có thật, thường do chi phí điều phối/đồng bộ giữa các node lớn hơn phần việc thu được.

Vogels cũng nói thêm một ý mà bản tóm tắt trong README không nhắc: khả năng mở rộng không chỉ về kỹ thuật, nó còn phải đúng với **chi phí vận hành** và **độ phức tạp quản trị**. Một hệ thống mà cứ thêm 1 máy lại cần thêm 1 người trực thì không mở rộng được, dù biểu đồ thông lượng có đẹp đến đâu.

**3. Giới hạn lý thuyết: định luật Amdahl**

Mục gốc không nhắc, nhưng nên biết: nếu một phần công việc **buộc phải chạy tuần tự** (không song song hóa được), thì phần đó đặt ra trần cứng cho mọi nỗ lực mở rộng. Ví dụ 5% công việc là tuần tự thì dù thêm bao nhiêu máy, tốc độ tối đa cũng chỉ nhanh lên khoảng 20 lần.

Ý nghĩa thực tế: **đi tìm phần tuần tự trước khi đi mua máy**. Phần tuần tự thường nằm ở những chỗ rất tầm thường - một bảng đếm dùng chung, một khóa toàn cục, một dịch vụ sinh ID tập trung, một lần ghi vào master DB.

**4. Nối với các bài đã đọc**

Loạt bài *Scalability for Dummies* vừa dịch xong thực chất là câu trả lời cho **vế khả năng mở rộng**:

- [Clones](../00-nen-tang/01-clones.md) - làm tầng ứng dụng không trạng thái để thêm máy có tác dụng.
- [Databases](../00-nen-tang/02-databases.md) - gỡ điểm nghẽn ở tầng dữ liệu, chỗ thường "không tỉ lệ thuận" nhất.
- [Caches](../00-nen-tang/03-caches.md) - giảm lượng công việc thật sự phải làm.
- [Asynchronism](../00-nen-tang/04-asynchronism.md) - đẩy việc ra khỏi đường đi của request.

Còn **vế hiệu năng** thì không có bài nào trong repo này dạy cả - nó thuộc về profiling, tối ưu truy vấn, cấu trúc dữ liệu. Đó là lý do phải phân biệt hai vế: repo này chỉ chữa được một trong hai bệnh.

**5. Câu hỏi nên tự hỏi trong buổi phỏng vấn system design**

Khi đề bài nói "hệ thống đang chậm", hỏi ngược lại trước khi vẽ kiến trúc:

- Chậm với mọi mức tải, hay chỉ chậm lúc cao điểm?
- Độ trễ ở phân vị nào - trung bình hay p99? (Trung bình đẹp mà p99 tệ thường là dấu hiệu tranh chấp tài nguyên, tức vấn đề mở rộng.)
- Thêm một máy nữa thì chỉ số nào cải thiện, cải thiện bao nhiêu?

Câu hỏi thứ ba chính là định nghĩa của Vogels, phát biểu dưới dạng câu hỏi.

Đối chiếu README gốc của repo:
- [Performance vs scalability](../../README.md#performance-vs-scalability)
- [Latency vs throughput](../../README.md#latency-vs-throughput) - mục kế tiếp
