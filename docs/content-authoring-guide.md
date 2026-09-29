# Content authoring guide — RealLife examples + Figure illustrations

Quy tắc dùng để viết `<RealLife>` (ví dụ đời sống) và `<Figure added>` (SVG
mới) cho **mọi** bài học OmniLab. Phase 6 batch 0 chốt style trên 6 bài thí
điểm; các batch sau copy đúng quy trình này cho ~45 bài còn lại. Đọc kèm
[`docs/illustration-style-guide.md`](./illustration-style-guide.md) (SVG) và
[`docs/cover-image-prompt.md`](./cover-image-prompt.md) (ảnh bìa).

## Nguyên tắc bất biến

- **Nội dung gốc không bao giờ bị sửa.** Chỉ được *thêm* `<RealLife>...</RealLife>`
  và `<Figure added .../>` block mới, cộng `import ... from '...svg?raw'` ở
  đầu file. Không đổi một chữ nào trong văn bản gốc, không đổi
  `source.snapshot`, không đổi cấu trúc heading.
- Sau khi sửa, chạy `pnpm verify:fidelity` — phải in `OK`. Script này loại bỏ
  toàn bộ subtree `<RealLife>` và mọi `<Figure added ...>` khi so khớp, nên
  chúng an toàn 100% với fidelity miễn là bạn không động vào text gốc xung
  quanh.
- `examplesReviewed` giữ nguyên `false` khi bạn (agent viết nội dung) commit.
  **Không tự đặt `true`** — đó là việc của agent fact-check độc lập chạy sau,
  theo uỷ quyền của user (xem `plan.md` "Decisions đã chốt", ngày 2026-09-28).
  Khi `examplesReviewed: false`, mỗi `<RealLife>` tự hiện badge "Nháp" (CSS
  thuần trong `real-life.astro`, không cần làm gì thêm).

## Vị trí đặt `<RealLife>`

- Đặt **ngay sau** đoạn/mục mà nó minh hoạ, cách nhau bằng dòng trống trước
  và sau (MDX cần blank line quanh JSX block để parser nhận đúng là block,
  không phải inline).
- Mỗi bài: **3–5 khối** `<RealLife>` (bài ngắn < ~600 tiếng hoặc bài danh
  mục nguồn: **1–2 khối**). Rải đều theo các khái niệm chính của bài, không
  dồn hết vào đầu/cuối.
- Cú pháp:

  ```mdx
  Đoạn văn gốc giải thích khái niệm X...

  <RealLife title="Tủ lạnh ở nhà">

  Nội dung ví dụ, markdown thường (in đậm, danh sách được).

  </RealLife>
  ```

  `title` mặc định là "Ví dụ đời sống" nếu bỏ trống — luôn nên đặt title cụ
  thể (ngữ cảnh, không phải nhắc lại tên khái niệm) để danh sách ví dụ trong
  1 bài không trùng lặp nhàm chán.

## Quy tắc viết 1 khối `<RealLife>`

1. **1 ví dụ = 1 phép so sánh.** Không nhồi 2-3 ẩn dụ vào cùng 1 khối.
2. **≤ 90 tiếng (≈ 110 khi cần câu giới hạn ẩn dụ).** Tiếng Việt đếm theo
   dấu cách là đếm âm tiết; tính cả tiêu đề phụ — đây là callout ngắn, không
   phải đoạn văn phụ.
3. **Kết thúc bằng câu nối lại khái niệm gốc**, dùng mũi tên `→`. Ví dụ:
   "→ Đây chính là cache hit." / "→ Đó là lý do CAP không cho bạn 'chọn 2
   trong 3' một cách tuỳ ý."
4. **Bối cảnh Việt Nam đời thường**: quán phở, tủ lạnh, ngân hàng/quầy giao
   dịch, xếp hàng, Grab/xe ôm công nghệ, chợ, siêu thị, nhà trọ, học phí, v.v.
   Tránh ẩn dụ Mỹ-centric (Amazon warehouse, US tax bracket...) trừ khi không
   có tương đương Việt Nam hợp lý.
5. **Nêu giới hạn của phép so sánh khi nó dễ gây hiểu sai.** Không phải ẩn
   dụ nào cũng cần câu giới hạn — chỉ thêm khi thiếu nó người đọc sẽ suy diễn
   sai một tính chất kỹ thuật quan trọng. Ví dụ kinh điển: CAP theorem không
   phải "chọn tự do 2 trong 3" (xem bài `danh-doi/cap-theorem` — ẩn dụ dùng
   "hai tổng đài ngân hàng mất kết nối với nhau" thay vì tam giác "chọn 2
   trong 3", vì tam giác đó chính là cách hiểu sai phổ biến nhất).
6. **Không có TODO/placeholder.** Mỗi khối phải là ví dụ hoàn chỉnh, không
   viết kiểu "TODO: nghĩ ví dụ hay hơn".

### Quy tắc riêng cho lĩnh vực Tài chính

- **Không số liệu thời sự** (lãi suất ngân hàng, mức thuế, giá vàng/USD,
  biểu phí cụ thể) trừ khi:
  - ghi rõ ngay trong câu là "ví dụ minh hoạ, số giả định", **hoặc**
  - kèm ngày + nguồn cụ thể (hiếm khi cần ở mức RealLife — ưu tiên cách 1).
- **Không khuyến nghị sản phẩm/nhà cung cấp cụ thể** (không nói "gửi tiết
  kiệm ở ngân hàng X", "mua bảo hiểm hãng Y"). Dùng danh từ chung: "một ngân
  hàng", "một hợp đồng bảo hiểm nhân thọ".
- **Không phải lời khuyên đầu tư.** Ví dụ minh hoạ cơ chế (lãi kép, dư nợ
  giảm dần, thời gian chờ bảo hiểm...), không đề xuất "nên làm gì với tiền
  của bạn". `<Disclaimer>` ở đầu mỗi bài Tài chính (Phase 4 wire sẵn theo
  `domain.isFinance`) đã nói rõ điều này ở cấp bài — RealLife không cần lặp
  lại disclaimer, chỉ cần không mâu thuẫn với nó.

### Ví dụ đã dùng (không phải quy định — minh hoạ mức độ)

- Cache → tủ lạnh ở nhà (có sẵn, lấy ngay = hit) vs chạy ra chợ (miss, phải
  đi lấy). TTL = hạn sử dụng ghi trên hộp. Cache invalidation = đồ hết hạn
  còn trong tủ nhưng chưa vứt — vẫn "lấy ra dùng được" theo nghĩa vật lý dù
  không nên.
- Load balancer → nhân viên xếp khách vào các quầy giao dịch ngân hàng còn
  trống. Health check = quầy treo biển "tạm nghỉ", nhân viên xếp khách
  không đưa khách tới quầy đó nữa.
- Lãi kép → cây trồng từ hạt: năm đầu chậm gần như không thấy gì, nhưng sau
  nhiều năm cây đủ lớn để tự ra thêm cây con — "lãi ra lãi" giống "cây ra
  cây".

## Quy trình cho SVG (`<Figure added>`)

Xem chi tiết vẽ trong `docs/illustration-style-guide.md`. Tóm tắt phần liên
quan tới việc chèn vào MDX:

1. Vẽ file `.svg` tại
   `src/assets/illustrations/<domain>/<module>-<slug>-<ten-hinh>.svg` (tên
   dài, mô tả rõ — xem "Đặt tên file" bên dưới).
2. Import ở đầu file MDX (cùng khối với các `import img_... from` sẵn có,
   hoặc tạo khối import mới ngay dưới frontmatter nếu bài chưa có ảnh nào):

   ```mdx
   import cacheHitMiss from '../../../../assets/illustrations/kien-truc/chu-de-cache-cache-hit-miss.svg?raw';
   ```

   Số lượng `../` phụ thuộc độ sâu file MDX: từ
   `src/content/lessons/<domain>/<module>/<file>.mdx` tới `src/assets/` luôn
   là **4 cấp `../../../../`** (module → domain → lessons → content → src).
   Xác nhận bằng cách so với import ảnh legacy đã có sẵn trong cùng file nếu
   có (cùng độ sâu, cùng số `../`).
3. Chèn ngay sau đoạn/mục liên quan (không nhất thiết ngay sau `<RealLife>` —
   tuỳ ngữ cảnh, có thể trước hoặc sau khối đó):

   ```mdx
   <Figure
     added
     svg={cacheHitMiss}
     alt="Luồng cache hit và cache miss"
     caption="Khi cache có sẵn dữ liệu (hit), trả ngay; khi không (miss), lấy từ DB rồi lưu lại vào cache."
   />
   ```

   `alt` mô tả ngắn cho mục lục/metadata; `caption` là chú thích hiển thị
   dưới hình (có thể dài hơn `alt`, giải thích cơ chế bằng 1 câu). `added`
   **bắt buộc** — thiếu nó, `verify-fidelity` sẽ coi hình này là ảnh gốc và
   so sánh nhầm (nó sẽ không tìm thấy text tương ứng trong snapshot và báo
   fail).
4. Mỗi bài: **1–3 SVG mới**, mỗi cái giải thích một **cơ chế** (luồng dữ
   liệu, so sánh trước/sau, so sánh 2 chiến lược) — không phải ảnh trang trí.
   Nếu một khái niệm chỉ cần chữ là đủ rõ, đừng ép vẽ SVG.

### Vì sao `svg={...}` qua `?raw` chứ không phải `src={...}` qua `astro:assets`

Quyết định đã chốt (xem thêm comment trong `figure.astro`): style guide yêu
cầu tô màu SVG bằng presentation attribute kiểu `fill="var(--accent)"` để tự
đổi theo light/dark. `var()` bên trong một presentation attribute **chỉ**
resolve được khi `<svg>` là một phần thật của DOM đang hiển thị (inline).
`astro:assets`' `<Image>` và `<img src="*.svg">` đều tải file SVG như một
resource ngoài (kể cả khi trình duyệt render nó), tách biệt khỏi CSS của
trang chủ — `var(--accent)` bên trong sẽ không bao giờ resolve, ảnh sẽ ra
màu mặc định hoặc trống. `Figure` component (Phase 6) thêm prop `svg?:
string` mới, render bằng `set:html`, backward-compatible 100% với mọi
`<Figure src={...} .../>` đã có (path đó không đổi hành vi).

Confirmed qua tài liệu MDN/CSS-WG (spec đang chuẩn hoá rõ hơn năm 2025) +
đã build thử trong repo này (`pnpm build`, xem phase-06 batch 0 report) —
nếu sau này thấy hành vi khác giữa các trình duyệt, đó là điều cần re-test,
không phải giả định sai từ đầu.

## Đặt tên file

- SVG: `src/assets/illustrations/<domain>/<module>-<slug>-<ten-hinh>.svg`
  — ví dụ `kien-truc/chu-de-cache-cache-hit-miss.svg`,
  `tai-chinh/lo-trinh-12-tuan-tuan-03-lai-kep.svg`. `<slug>` là tên file MDX
  không số thứ tự/không đuôi (ví dụ `07-cache.mdx` → slug `cache`,
  `03-tuan-03.mdx` → slug `tuan-03`). Tên dài, mô tả rõ — ưu tiên rõ ràng
  hơn ngắn gọn (theo quy ước đặt tên file của repo).
- Không đổi tên/xoá SVG đã có khi sửa bài — nếu cần vẽ lại, ghi đè cùng
  đường dẫn để không để lại file rác trong `src/assets/illustrations/`.

## Checklist trước khi coi một bài là "xong" (cho các batch sau)

1. [ ] 3–5 `<RealLife>` (bài ngắn 1–2), mỗi cái ≤ 90 tiếng, kết bằng câu nối "→ ...".
2. [ ] Bối cảnh Việt Nam, không sáo rỗng, không lặp ẩn dụ giữa các khối
       trong cùng 1 bài.
3. [ ] Tài chính: không số liệu thời sự (trừ khi ghi "số giả định"), không
       gợi ý sản phẩm/nhà cung cấp cụ thể, không phải lời khuyên đầu tư.
4. [ ] 1–3 `<Figure added svg={...} alt=... caption=... />`, đúng import
       `?raw`, đúng số `../` theo độ sâu file.
5. [ ] Mỗi SVG: đọc qua checklist trong `illustration-style-guide.md`
       (viewBox, màu qua CSS var, không hex, < 15KB, có `<title>` +
       `role="img"` + `aria-labelledby`, ≤ ~8 nhãn chữ).
6. [ ] `examplesReviewed` vẫn `false` (không tự đổi).
7. [ ] `pnpm verify:fidelity` pass cho (các) file vừa sửa (chạy full suite —
       script check toàn bộ 51+ bài, không check được từng file riêng lẻ).
8. [ ] `pnpm check` (astro check) và `pnpm build` pass — hoặc nếu phase khác
       đang sửa dở file ngoài phạm vi sở hữu của bạn, verify riêng phần bạn
       sửa và ghi rõ trong báo cáo lý do không chạy được full build.
9. [ ] Không có file `.astro`/`.ts`/`.ts` ngoài danh sách file được giao sửa
       (file ownership) bị động tới.

## Ghi chú hiệu đính (`<ReviewNote>`)

Dùng khi phát hiện lỗi trong **nội dung gốc** (dịch sai nghĩa, sai số liệu, thông tin lỗi thời, lỗi định dạng do migration) mà không được sửa trực tiếp vì fidelity gate khoá văn bản gốc.

- Đặt **một** khối `<ReviewNote>` ở **cuối file** (sau `<TranslatorNote>` nếu có). Không có vấn đề thì không thêm.
- Mỗi mục một gạch đầu dòng: **[Mức độ]** vị trí (tên mục + trích ngắn trong ngoặc kép) — vấn đề — đề xuất sửa — nguồn (nếu có).
- Mức độ: `Sai` (sai nghĩa/sai sự thật), `Lỗi thời` (đúng lúc viết, nay đã khác), `Định dạng` (lỗi hiển thị do chuyển đổi), `Diễn đạt` (đúng nhưng dễ hiểu sai).
- `verify-fidelity` và search index bỏ qua khối này.

```mdx
<ReviewNote>

- **[Sai]** Mục "Availability in numbers" ("1m 5s" ở dòng 99,99%/tuần) — 604.800 s × 0,01% = 60,5 s — nên là "1m 0.5s".

</ReviewNote>
```
