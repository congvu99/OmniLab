---
nguon: The System Design Primer - mục "Security"
tac-gia: Donne Martin và cộng đồng đóng góp
link-goc: ../../README.md#security
ngay-dich: 2026-09-28
trang-thai: hoan-thanh
---

# Bảo mật (Security)

## Nội dung gốc

Mục này cần được cập nhật thêm. Hãy cân nhắc [đóng góp](../../README.md#contributing)!

Bảo mật là một chủ đề rộng. Trừ khi bạn có nhiều kinh nghiệm, có nền tảng về bảo mật, hoặc đang ứng tuyển vào vị trí đòi hỏi kiến thức bảo mật, có lẽ bạn không cần biết nhiều hơn những điều cơ bản:

- Mã hóa dữ liệu khi truyền (in transit) và khi lưu trữ (at rest).
- Làm sạch (sanitize) mọi dữ liệu người dùng nhập vào, hoặc bất kỳ tham số đầu vào nào phơi ra cho người dùng, để ngăn [XSS](https://en.wikipedia.org/wiki/Cross-site_scripting) và [SQL injection](https://en.wikipedia.org/wiki/SQL_injection).
- Dùng truy vấn tham số hóa (parameterized query) để ngăn SQL injection.
- Áp dụng nguyên tắc [đặc quyền tối thiểu (least privilege)](https://en.wikipedia.org/wiki/Principle_of_least_privilege).

### Nguồn và đọc thêm

- [API security checklist](https://github.com/shieldfy/API-Security-Checklist)
- [Security guide for developers](https://github.com/FallibleInc/security-guide-for-developers)
- [OWASP top ten](https://www.owasp.org/index.php/OWASP_Top_Ten_Cheat_Sheet)

---

## Ghi chú của người dịch

Bản gốc tự nhận là còn sơ sài, nên phần ghi chú này dài hơn phần dịch. Mục tiêu là đủ để trả lời tự tin các câu hỏi bảo mật **trong ngữ cảnh system design**, không phải để trở thành chuyên gia bảo mật.

**1. Bốn gạch đầu dòng của bản gốc - đọc kỹ hơn**

- **"Làm sạch đầu vào để chống XSS"** là cách nói đã lỗi thời và dễ gây hiểu sai. Cách làm đúng hiện nay tách làm hai việc:
  - **Kiểm tra đầu vào (input validation)** theo danh sách cho phép (allowlist): đúng kiểu, đúng độ dài, đúng định dạng. Từ chối cái sai thay vì cố "sửa" nó.
  - **Mã hóa đầu ra theo ngữ cảnh (context-aware output encoding)**: cùng một chuỗi phải được escape khác nhau khi chèn vào HTML, thuộc tính HTML, JavaScript hay URL. XSS được chặn ở **lúc hiển thị**, không phải lúc nhập. Framework frontend hiện đại (React, Vue, Angular) tự escape mặc định; lỗ hổng thường nằm ở chỗ lập trình viên cố tình tắt nó (`dangerouslySetInnerHTML`, `v-html`). Thêm một lớp phòng thủ bằng **Content Security Policy (CSP)**.
- **Truy vấn tham số hóa** mới là biện pháp **chính** chống SQL injection; "làm sạch" chuỗi SQL bằng tay là cách sai. Lưu ý: tham số hóa không áp dụng được cho tên bảng, tên cột, `ORDER BY` - những chỗ đó phải dùng allowlist.
- **Mã hóa khi truyền và khi lưu** - xem mục 3.
- **Đặc quyền tối thiểu** áp dụng cho **mọi chủ thể**, không chỉ người dùng: tài khoản database của ứng dụng không cần quyền `DROP TABLE`, dịch vụ gửi email không cần đọc bảng thanh toán, container không cần chạy bằng root.

**2. OWASP Top 10 - danh sách nên thuộc**

Bản OWASP Top 10 năm 2021 (bản được trích dẫn rộng rãi nhất trong vài năm gần đây):

| Mã | Hạng mục | Ví dụ điển hình |
|---|---|---|
| A01 | Kiểm soát truy cập bị phá vỡ (Broken Access Control) | Đổi `/orders/123` thành `/orders/124` và xem được đơn của người khác (IDOR) |
| A02 | Lỗi mật mã (Cryptographic Failures) | Truyền dữ liệu nhạy cảm không qua TLS, băm mật khẩu bằng MD5 |
| A03 | Tiêm mã (Injection) - gồm cả XSS | SQL injection, command injection |
| A04 | Thiết kế không an toàn (Insecure Design) | Luồng đặt lại mật khẩu dựa trên câu hỏi bí mật đoán được |
| A05 | Cấu hình bảo mật sai (Security Misconfiguration) | Bucket lưu trữ để công khai, trang lỗi lộ stack trace |
| A06 | Thành phần có lỗ hổng hoặc lỗi thời (Vulnerable and Outdated Components) | Thư viện có CVE đã biết mà không cập nhật |
| A07 | Lỗi định danh và xác thực (Identification and Authentication Failures) | Không giới hạn số lần đăng nhập sai, session không hết hạn |
| A08 | Lỗi toàn vẹn phần mềm và dữ liệu (Software and Data Integrity Failures) | Pipeline CI kéo gói không kiểm chữ ký, deserialize dữ liệu không tin cậy |
| A09 | Lỗi ghi log và giám sát bảo mật (Security Logging and Monitoring Failures) | Bị xâm nhập nhiều tháng mà không ai biết |
| A10 | Giả mạo yêu cầu phía server (Server-Side Request Forgery - SSRF) | Tính năng "tải ảnh từ URL" bị lợi dụng để gọi dịch vụ metadata nội bộ của cloud |

OWASP đã công bố bản cập nhật năm 2025 với một số thay đổi về thứ tự và hạng mục (nhấn mạnh hơn vào chuỗi cung ứng phần mềm); nên xem danh sách mới nhất trên trang chính thức của OWASP. Với API, OWASP còn có danh sách riêng **OWASP API Security Top 10** - rất đáng đọc vì lỗi phổ biến nhất ở API là kiểm soát truy cập ở mức đối tượng (BOLA), tức IDOR ở ví dụ A01.

Bài học rút ra: **hạng mục đứng đầu là lỗi phân quyền, không phải lỗi mật mã hay injection**. Framework hiện đại đã chặn phần lớn injection; phân quyền thì framework không làm hộ được, vì nó là logic nghiệp vụ.

**3. Mã hóa: khi truyền và khi lưu**

*Khi truyền (in transit):*

- Dùng **TLS 1.2 trở lên, ưu tiên TLS 1.3**. TLS 1.0 và 1.1 đã chính thức bị loại bỏ (RFC 8996).
- Bật **HSTS** để trình duyệt không bao giờ quay về HTTP thường.
- Chứng chỉ phải tự động gia hạn (ACME, ví dụ Let's Encrypt) - chứng chỉ hết hạn là nguyên nhân sự cố ngừng dịch vụ rất phổ biến, và thời hạn tối đa của chứng chỉ công khai đang được rút ngắn dần theo lộ trình của CA/Browser Forum, nên gia hạn thủ công ngày càng không khả thi.
- **Giao tiếp nội bộ cũng phải mã hóa.** Mô hình "vỏ cứng, ruột mềm" (chỉ bảo vệ biên mạng, bên trong tin nhau hoàn toàn) đã bị thay bằng **zero trust**: mọi dịch vụ tự xác thực lẫn nhau, thường bằng **mTLS** (TLS hai chiều), và service mesh (Istio, Linkerd) giúp làm việc này mà không sửa code ứng dụng.
- Chỗ kết thúc TLS (TLS termination) thường ở load balancer hoặc reverse proxy - xem [Reverse proxy](04-reverse-proxy.md). Cần quyết định rõ đoạn từ đó vào backend có mã hóa lại hay không.

*Khi lưu (at rest):*

- Mã hóa đĩa/volume do cloud cung cấp gần như miễn phí và nên bật mặc định, nhưng nó **chỉ chống mất ổ cứng vật lý** - ai đọc được qua database thì vẫn đọc được dữ liệu rõ.
- Dữ liệu cực nhạy (số thẻ, số định danh cá nhân) nên mã hóa thêm ở **tầng ứng dụng** theo từng trường, hoặc thay bằng token (tokenization).
- **Mã hóa phong bì (envelope encryption)**: dữ liệu được mã hóa bằng khóa dữ liệu (DEK), khóa dữ liệu lại được mã hóa bằng khóa chính (KEK) nằm trong KMS hoặc HSM. Xoay vòng khóa chính không cần mã hóa lại toàn bộ dữ liệu.
- **Mật khẩu không mã hóa mà băm**, bằng thuật toán chậm có salt: **Argon2id**, bcrypt hoặc scrypt. Tuyệt đối không dùng MD5, SHA-1, hay SHA-256 thuần cho mật khẩu - chúng được thiết kế để nhanh, tức là dễ dò.

**4. Xác thực và phân quyền (authentication và authorization)**

Hai khái niệm hay bị trộn lẫn: **xác thực (authentication - AuthN)** trả lời "bạn là ai", **phân quyền (authorization - AuthZ)** trả lời "bạn được làm gì".

| Công nghệ | Là gì | Ghi chú |
|---|---|---|
| OAuth 2.0 | Giao thức **ủy quyền** - cho ứng dụng A truy cập tài nguyên của bạn ở B mà không cần mật khẩu B | Bản thân OAuth không dùng để đăng nhập |
| OpenID Connect (OIDC) | Lớp **xác thực** xây trên OAuth 2.0, thêm ID token | Đây mới là thứ đứng sau "Đăng nhập bằng Google" |
| PKCE | Phần mở rộng của OAuth chống đánh cắp mã ủy quyền | Nay được khuyến nghị cho mọi client, không chỉ ứng dụng di động |
| JWT | Định dạng token tự chứa, có chữ ký | Là định dạng, không phải giao thức |
| Session cookie | Server giữ trạng thái phiên, client giữ một mã ngẫu nhiên | Thu hồi dễ, cần kho session dùng chung khi mở rộng ngang |
| Passkey (WebAuthn/FIDO2) | Đăng nhập bằng cặp khóa gắn với thiết bị | Chống phishing về bản chất vì khóa gắn với tên miền |

Bẫy thường gặp với JWT:

- **Khó thu hồi**: JWT hợp lệ tới khi hết hạn. Cách chuẩn là access token sống ngắn (vài phút) cộng refresh token có thể thu hồi.
- **Tin vào trường `alg` trong header**: thư viện phải cố định thuật toán được chấp nhận; lỗ hổng `alg: none` và nhầm lẫn thuật toán đã từng rất phổ biến.
- **Để thông tin nhạy cảm trong payload**: JWT chỉ được ký, không được mã hóa - ai cũng đọc được nội dung.
- **Lưu token trong `localStorage`**: đọc được bằng JavaScript nên bị lộ khi có XSS. Cookie `HttpOnly`, `Secure`, `SameSite` an toàn hơn cho ứng dụng web.

Và điều quan trọng nhất: **phân quyền phải kiểm tra ở server cho từng đối tượng**, không chỉ ở từng endpoint. "Người dùng đã đăng nhập" không có nghĩa là "được xem đơn hàng 124".

**5. Quản lý bí mật (secret management)**

- **Không bao giờ commit bí mật vào git** - kể cả repo riêng tư, kể cả khi đã xóa ở commit sau (lịch sử git vẫn giữ). Dùng công cụ quét bí mật trong CI và pre-commit hook.
- Lưu bí mật trong kho chuyên dụng: HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault. Biến môi trường tốt hơn file cấu hình trong repo, nhưng vẫn dễ lộ qua log, dump tiến trình hoặc trang debug.
- Ưu tiên **thông tin xác thực ngắn hạn, cấp động** thay cho khóa tĩnh sống lâu: IAM role cho workload, workload identity federation cho CI (ví dụ GitHub Actions dùng OIDC để lấy quyền cloud tạm thời thay vì lưu access key).
- **Xoay vòng (rotation)** phải tự động hóa được. Bí mật không xoay vòng được là bí mật sẽ không bao giờ được xoay vòng.
- Khi bí mật bị lộ: **thu hồi trước, điều tra sau**. Xóa commit không cứu được gì nếu khóa đã bị bot quét.

**6. Những chủ đề bảo mật hay xuất hiện trong phỏng vấn system design**

- **Giới hạn tốc độ (rate limiting)**: chống dò mật khẩu, chống lạm dụng API, chống quá tải. Thuật toán thường gặp: token bucket, leaky bucket, cửa sổ trượt (sliding window). Đặt ở API gateway hoặc reverse proxy, đếm trong kho dùng chung (ví dụ Redis) để đúng khi có nhiều instance. "Thiết kế rate limiter" là một đề phỏng vấn riêng rất phổ biến.
- **Chống DDoS**: phần lớn nằm ở tầng hạ tầng - CDN, dịch vụ chống DDoS của nhà cung cấp cloud, anycast - xem [CDN](02-cdn.md). Ứng dụng tự chống DDoS tầng mạng là không thực tế.
- **CSRF**: cookie `SameSite` cộng token chống CSRF cho các thao tác thay đổi trạng thái.
- **SSRF**: mọi tính năng server tự đi lấy URL do người dùng cung cấp (webhook, xem trước link, tải ảnh) phải chặn địa chỉ nội bộ và địa chỉ metadata của cloud.
- **Webhook**: bên nhận phải kiểm chữ ký HMAC và dấu thời gian để chống giả mạo và phát lại.
- **Ghi log kiểm toán (audit log)**: ai làm gì, lúc nào, với đối tượng nào - và **không ghi** mật khẩu, token, số thẻ vào log.
- **Chuỗi cung ứng phần mềm (supply chain)**: khóa phiên bản phụ thuộc (lockfile), quét lỗ hổng phụ thuộc, SBOM, ký artifact build (ví dụ Sigstore). Các vụ tấn công qua gói npm/PyPI độc hại đã trở thành chuyện thường xuyên.
- **Dữ liệu cá nhân và tuân thủ**: tối thiểu hóa dữ liệu thu thập, quyền xóa dữ liệu, lưu trữ theo vùng địa lý (GDPR ở châu Âu; ở Việt Nam có Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân). Quyết định lưu dữ liệu ở vùng nào ảnh hưởng trực tiếp tới kiến trúc nhân bản.

**7. Phòng thủ theo chiều sâu (defense in depth) - khung trả lời phỏng vấn**

Khi được hỏi "hệ thống này bảo mật thế nào", thay vì liệt kê rời rạc, đi theo từng lớp:

| Lớp | Biện pháp |
|---|---|
| Biên | CDN/WAF, chống DDoS, rate limiting, chỉ mở cổng 443 |
| Truyền tải | TLS 1.3 bên ngoài, mTLS bên trong |
| Danh tính | OIDC/SSO, MFA hoặc passkey, token sống ngắn |
| Ứng dụng | Kiểm tra đầu vào, truy vấn tham số hóa, mã hóa đầu ra, phân quyền theo đối tượng |
| Dữ liệu | Mã hóa khi lưu, KMS, mã hóa theo trường cho dữ liệu cực nhạy, băm mật khẩu bằng Argon2id/bcrypt |
| Hạ tầng | Mạng riêng, security group chặt, đặc quyền tối thiểu cho IAM, không chạy root |
| Vận hành | Quản lý bí mật, vá lỗi phụ thuộc, audit log, giám sát và cảnh báo bất thường |

Nguyên tắc chung: **giả định mỗi lớp đều có thể bị xuyên thủng**, và thiết kế sao cho một lớp thất bại không đồng nghĩa với mất toàn bộ hệ thống. Kết hợp với câu hỏi "**bán kính ảnh hưởng (blast radius)** nếu thành phần này bị chiếm là bao lớn?" - đây chính là đặc quyền tối thiểu áp dụng ở mức kiến trúc.

**8. Nối với các mục khác**

- [Giao tiếp](09-communication.md) - HTTP, TLS và gRPC là nền của mã hóa khi truyền; idempotency key vừa là vấn đề độ tin cậy vừa là vấn đề an toàn giao dịch.
- [Reverse proxy](04-reverse-proxy.md) và [Load balancer](03-load-balancer.md) - nơi kết thúc TLS, đặt WAF và rate limiting.
- [Cơ sở dữ liệu](06-database.md) - phân quyền tài khoản database, mã hóa khi lưu, bản sao chứa dữ liệu nhạy cảm cũng cần bảo vệ như bản chính.
- [Cache](07-cache.md) - cẩn thận cache phản hồi chứa dữ liệu riêng của người dùng ở CDN hoặc cache dùng chung (thiếu `Cache-Control: private` là lỗi lộ dữ liệu có thật).

Đối chiếu README gốc của repo:
- [Security](../../README.md#security)
- [Appendix](../../README.md#appendix) - mục kế tiếp
