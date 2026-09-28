---
nguon: Le Cloud Blog - Scalability for Dummies, Part 4
tac-gia: Sebastian Kreutzberger
ngay-goc: 2011-09-02
link-goc: https://web.archive.org/web/20220926171507/https://www.lecloud.net/post/9699762917/scalability-for-dummies-part-4-asynchronism
ngay-dich: 2026-09-18
trang-thai: hoan-thanh
---

# Khả năng mở rộng cho người mới - Phần 4: Bất đồng bộ (Asynchronism)

## Mở đầu bằng một hình ảnh

Phần thứ 4 của loạt bài này bắt đầu bằng một hình ảnh: hãy tưởng tượng bạn muốn mua bánh mì ở tiệm bánh yêu thích của mình.

Bạn bước vào tiệm, hỏi mua một ổ bánh mì, nhưng **chẳng có ổ bánh nào cả!** Thay vào đó, người ta bảo bạn quay lại sau 2 tiếng nữa khi ổ bánh bạn đặt đã xong.

Bực mình đúng không?

Để tránh rơi vào tình huống "xin vui lòng chờ một lát" như thế, ta cần làm mọi thứ **bất đồng bộ**. Và cái gì tốt cho tiệm bánh thì có lẽ cũng tốt cho web service hay web app của bạn.

Nhìn chung, có hai cách - hai mô hình - để làm bất đồng bộ.

## Bất đồng bộ kiểu 1: Làm sẵn từ trước

Hãy cứ ở lại với hình ảnh tiệm bánh. Cách xử lý bất đồng bộ thứ nhất là kiểu **"nướng bánh ban đêm, bán vào buổi sáng"**. Không phải chờ đợi gì ở quầy thu ngân, và khách hàng vui vẻ.

Áp vào một web app, điều này nghĩa là: **làm phần việc tốn thời gian từ trước, rồi phục vụ kết quả đã hoàn thành với thời gian đáp ứng cực thấp.**

Mô hình này rất hay được dùng để **biến nội dung động thành nội dung tĩnh**. Các trang của một website - có thể được dựng bằng một framework hay CMS đồ sộ - sẽ được render sẵn và lưu cục bộ thành các file HTML tĩnh mỗi khi có thay đổi.

Thường thì các tác vụ tính toán này được chạy định kỳ, chẳng hạn bằng một script được cronjob gọi mỗi giờ. Việc tính trước dữ liệu chung này có thể cải thiện website và web app cực kỳ mạnh, khiến chúng mở rộng tốt và chạy nhanh.

Cứ thử tưởng tượng khả năng mở rộng của website nếu script đó còn upload luôn các trang HTML đã render sẵn lên AWS S3, CloudFront hay một CDN nào khác! Website của bạn sẽ phản hồi cực nhanh và **gánh được hàng triệu lượt truy cập mỗi giờ!**

## Bất đồng bộ kiểu 2: Nhận việc rồi trả kết quả sau

Quay lại tiệm bánh. Đáng tiếc là đôi khi khách có những yêu cầu đặc biệt, kiểu bánh sinh nhật có dòng chữ "Chúc mừng sinh nhật, Steve!" ở trên.

Tiệm bánh **không thể đoán trước** những mong muốn kiểu này, nên buộc phải bắt đầu làm khi khách đang ở trong tiệm, rồi hẹn khách hôm sau quay lại.

Áp vào web service, điều đó nghĩa là **xử lý tác vụ một cách bất đồng bộ**.

Đây là một luồng làm việc điển hình:

1. Một người dùng vào website của bạn và khởi động một tác vụ tính toán rất nặng, phải mất vài phút mới xong.
2. Phần frontend của website **đẩy một job vào hàng đợi job (job queue)** và lập tức báo lại cho người dùng: *công việc của bạn đang được xử lý, mời bạn tiếp tục lướt trang.*
3. Hàng đợi job liên tục được **một nhóm worker** kiểm tra xem có job mới không.
4. Nếu có job mới, worker sẽ làm job đó, và sau vài phút thì phát tín hiệu báo job đã xong.
5. Frontend - vốn liên tục kiểm tra xem có tín hiệu "job đã xong" nào mới không - thấy job đã hoàn tất và báo lại cho người dùng.

Tôi biết đây là một ví dụ đã được đơn giản hóa rất nhiều.

## Học tiếp ở đâu

Nếu giờ bạn muốn đào sâu vào chi tiết và thiết kế kỹ thuật thực tế, tôi khuyên bạn xem 3 bài hướng dẫn đầu tiên trên website của RabbitMQ.

RabbitMQ là một trong nhiều hệ thống giúp triển khai xử lý bất đồng bộ. Bạn cũng có thể dùng ActiveMQ, hoặc đơn giản là một list của Redis. **Ý tưởng cốt lõi là có một hàng đợi các tác vụ/job để worker xử lý.**

Bất đồng bộ nghe thì có vẻ phức tạp, nhưng chắc chắn đáng để bạn dành thời gian tìm hiểu và tự tay triển khai.

Backend trở nên gần như mở rộng vô hạn, còn frontend thì nhanh nhẹn hẳn lên - điều đó tốt cho trải nghiệm người dùng nói chung.

> **Nếu bạn làm việc gì đó tốn thời gian, hãy luôn cố làm nó một cách bất đồng bộ.**

---

## Ghi chú của người dịch (2026)

Bài này giữ giá trị gần như nguyên vẹn. Hai mô hình vẫn là hai mô hình, và ví dụ tiệm bánh vẫn là cách giải thích hay nhất tôi từng gặp cho khái niệm này.

**1. Tên gọi chuẩn của hai mô hình**

README gốc của repo tách rõ hơn:
- Kiểu 1 ≈ tiền tính toán (precompute) + [CDN](../../README.md#content-delivery-network), và thuộc về [Asynchronism](../../README.md#asynchronism)
- Kiểu 2 = [Message queues](../../README.md#message-queues) và [Task queues](../../README.md#task-queues)

**2. Công cụ đã đổi, ý tưởng thì không**

| Bài gốc (2011) | Hiện nay |
|---|---|
| RabbitMQ, ActiveMQ | RabbitMQ vẫn dùng; thêm Kafka (luồng sự kiện lớn), SQS, NATS |
| Redis list làm queue | Vẫn dùng được; nay có Redis Streams chuẩn hơn |
| Cronjob render HTML tĩnh | Static site generator, ISR của Next.js - cùng một ý tưởng |
| Upload lên S3/CloudFront | Vẫn y nguyên |

**3. Thứ bài viết bỏ sót: chuyện gì xảy ra khi mọi việc hỏng**

Đây là lỗ hổng lớn nhất. Bài mô tả luồng thành công, không nói tới:

- **Job thất bại thì sao?** Cần retry, và cần giới hạn số lần retry.
- **Dead letter queue** - job hỏng mãi phải đẩy sang hàng đợi riêng, không được kẹt mãi làm nghẽn queue.
- **Idempotency** (tính lũy đẳng) - worker có thể nhận cùng một job hai lần. Nếu job là "trừ tiền tài khoản" thì chạy hai lần là thảm họa. Job phải được thiết kế để chạy lại nhiều lần vẫn ra cùng kết quả.
- **Back pressure** - nếu job đổ vào nhanh hơn worker xử lý, hàng đợi phình vô hạn rồi vỡ. README gốc có mục riêng về chuyện này: [Back pressure](../../README.md#back-pressure). Giải pháp là giới hạn kích thước queue và trả lỗi/báo bận khi đầy.

**4. Frontend "liên tục kiểm tra" - nay có cách tốt hơn**

Bài mô tả frontend polling liên tục để hỏi job xong chưa. Cách này tốn tài nguyên. Hiện nay thường dùng WebSocket, Server-Sent Events, hoặc webhook để server chủ động báo ngược lại.

**5. Điểm mấu chốt nối với Phần 3**

Chú ý mạch nối: [Phần 3](03-caches.md) kết thúc bằng hình ảnh *"một đội quân worker server lắp ráp sẵn object cho bạn"*. Đó chính xác là bất đồng bộ kiểu 1. Cache và bất đồng bộ không phải hai kỹ thuật rời rạc - chúng là **cùng một ý tưởng**: chuyển công việc ra khỏi đường đi của request người dùng.

Đối chiếu README gốc của repo:
- [Asynchronism](../../README.md#asynchronism)
- [Message queues](../../README.md#message-queues)
- [Task queues](../../README.md#task-queues)
- [Back pressure](../../README.md#back-pressure)
