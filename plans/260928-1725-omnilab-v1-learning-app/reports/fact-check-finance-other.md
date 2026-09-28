---
title: "Fact-check + quality review: finance khoi-dong, an-toan, thuc-hanh, nguon-hoc, di-tiep (11 lessons)"
date: 2026-09-28
status: completed
---

# Fact-check: finance "other" modules (batch G output)

Scope: 22 `<RealLife>` + 12 `<Figure added>` (alt/caption/SVG) in
`src/content/lessons/tai-chinh/{khoi-dong,an-toan,thuc-hanh,nguon-hoc,di-tiep}/*.mdx`.
Edits restricted to RealLife bodies/titles, Figure alt/caption, the 12 SVGs, and
`examplesReviewed: true` (all 11). Original text untouched (fidelity OK).

## Verdicts per lesson

| Lesson | Verdict |
|---|---|
| khoi-dong/01-vi-sao-hoc | FIXED (1 RealLife, 1 SVG label) |
| khoi-dong/02-bon-chang | FIXED (1 RealLife contradicted Note, SVG dashed line) |
| an-toan/01-boi-canh-viet-nam | FIXED (50/30/20 definition, unlabelled numbers, rút trước hạn) |
| an-toan/02-chong-gia-mao | FIXED (OTP wording in SVG/caption, search-engine advice) |
| thuc-hanh/01-bai-tap-va-thu-tu-tien-du | FIXED (unlabelled numbers, analogy added, captions) |
| nguon-hoc/01-nguon-hoc-chinh-thuc | FIXED (overclaim, brand, ending contradicted example) |
| nguon-hoc/02-tu-sach-va-lich-doc | FIXED (alt/SVG title wrong, label overflow, section name) |
| di-tiep/01-chon-nhanh-tiep | FIXED (SVG highlighted branch B as if recommended) |
| di-tiep/02-nghien-cuu-noi-gi | FIXED (SVG implied Kaiser effect grows; caption overclaim) |
| di-tiep/03-tu-danh-gia | PASS + caption limit sentence |
| di-tiep/04-nguon-tham-khao | FIXED (wrong source reference, title/content mismatch) |

## Issues and fixes

### khoi-dong/01
- RealLife "Gọi lại ngân hàng...": "hỏi phương án giãn nợ... luôn đỡ rủi ro hơn". Restructuring is itself classified as nhóm 2 under TT 11/2021 and can still show in credit history, so "giãn nợ... luôn" overstated it. Changed to "bên cho vay" + "phương án thanh toán" (the original's wording), added a limit sentence ("có điều kiện, có thể vẫn ghi vào lịch sử tín dụng, xin xác nhận bằng văn bản"), and changed "luôn" to "thường".
- SVG ba-cach-to-chuc: "xa nhu cầu" dropped the original's hedge "có thể xa việc đang cần". Changed to "có thể xa / việc đang cần".
- Math: none. Other 2 blocks PASS.

### khoi-dong/02
- RealLife "Sửa nền nhà": "có bộ đệm nhỏ trước khi học các chặng sau... Vững chặng 1 rồi mới nên dồn nhiều thời gian cho các chặng sau". This **contradicts** the Note "Bạn không cần đợi đủ quỹ mới học tiếp" and 01's "Tiếp tục học kiến thức đầu tư". Rewrote it as "Đổ móng trước khi dựng tầng" with a limit sentence: learning goes on in order, and only *using money* needs the foundation.
- SVG lo-trinh-4-chang: the solid baseline ran 15→345 underneath the "optional" dashed segment, so the dash was invisible. Solid now stops at 230.

### an-toan/01
- "20% tiết kiệm" is wrong. Warren's 50/30/20 is savings **or debt repayment**. Fixed.
- "35%" / "60%" had no label. Added "Ví dụ minh hoạ, số giả định".
- Deposit block: kept "mất gần hết phần lãi". TT 04/2022/TT-NHNN caps early-withdrawal interest at the lowest demand-deposit rate. Rephrased it as a general statement ("với nhiều sổ... điều khoản cụ thể nằm trong hợp đồng") rather than a legal claim. Title "So biểu phí" did not match the content, so it became "Hỏi điều kiện rút trước hạn...".
- SVG PASS.

### an-toan/02 (scam, defensive only: PASS on no exploitable script)
- SVG + caption: "Không chắc chắn? Đừng chuyển tiền, đừng đọc OTP" / "yêu cầu... đọc OTP bất thường" implies that reading an OTP is fine when you feel sure. Official guidance says never give an OTP to anyone. Changed to "OTP không đọc cho bất kỳ ai", "bị đòi OTP", and "số đã biết" to "số tự tra" (so it cannot be read as the caller's number).
- RealLife "tên miền": the advice "tự gõ tên công ty vào công cụ tìm kiếm" is unsafe because search results can carry fake ads. Now points to the licensed-fund-manager list on UBCKNN (a government regulator, not a brand) and warns about fake search ads.
- RealLife "tài khoản an toàn": PASS. Matches the official warnings.

### thuc-hanh/01
- Math recomputed: 15−8−2−1−1=3 ✓; 9×3=27, gap 21, 7 months ✓; 1,06³ ✓; −20%→+25% ✓, −40%→+66,7% ✓, −50%→+100% ✓. SVG bar heights are proportional (1,5px/%: 30/38, 60/100) ✓.
- RealLife 1: "9 triệu, 6 triệu" had no label. Now "bộ số giả định khác" with the full calculation 9−6−1,5−0,5−0,5=0,5 ✓.
- RealLife 2 had no analogy. Replaced with a market-price analogy: 100.000 −50% = 50.000, +50% = 75.000, needs +100% ✓ (labelled số giả định). Title "cần lãi 100%" became "tăng", because "lãi" was wrong wording.
- Caption lo-va-phuc-hoi: added the formula "mức giảm ÷ phần còn lại" (20÷80, 40÷60) ✓. Caption and SVG title thu-tu-uu-tien: added "đề xuất có điều kiện" plus the exceptions from the original, because the figure presented the order as fixed. SVG uses a true minus sign.

### nguon-hoc/01
- RealLife 1: "vẫn là dữ liệu thật" overclaimed and had no analogy. Rewrote it with a milk-carton analogy (ingredient table vs "tốt nhất cho bé") and added "không phải đánh giá độc lập", in line with the H6 limit and the an-toan Note.
- RealLife 2: "kênh YouTube" became "kênh video" (brand). The example said "hứa lợi nhuận vượt trội" but then answered "hứa chắc chắn (có)", which is inconsistent; fixed. The ending "Trả lời được cả năm câu hỏi nhanh hơn..." did not follow, since the example answered only 2. Now: "bộ lọc nhanh... chưa phải đánh giá đầy đủ".
- SVG PASS.

### nguon-hoc/02
- alt + SVG `<title>` said "S1 xuyên suốt". Wrong: S1 is weeks 1–8 only. Fixed.
- SVG label "S1 theo chương" centred at x=30 overflowed the left edge (clipped). Now left-anchored at x=10. Also fixed the same dashed-line issue as in bon-chang.
- RealLife 2: "“nhánh mở rộng”" is not a real section, so it became `mục "Mở rộng theo nhu cầu"`. "đầu tư đọc" became "dành thời gian đọc" (ambiguous in a finance context). "bản tóm tắt" became "bản tóm tắt hợp pháp", to stay consistent with the original's "tránh PDF lậu".

### di-tiep/01
- SVG gave branch B accent colour and stroke 2.5, which reads as a recommendation. The original treats A/B/C as peers and says A can be the endpoint. All branches are now neutral and the root node is the accent. Labels were split into two lines because "C · Nghề nghiệp" and "mới chọn chứng chỉ" overflowed 100px boxes. "Kinh doanh" became "Doanh nghiệp" to match "NHÁNH B · DOANH NGHIỆP".
- Caption "không loại trừ nhau... không cần theo thứ tự" was not supported by the original. Now: "không có thứ bậc... với nhánh A, có thể dừng học chuyên sâu".
- RealLife 2: the wording "tiền lãi thật hay chỉ tồn kho tăng lên trên giấy" was muddled. Now "lợi nhuận sổ sách vs tiền mặt (kẹt ở tồn kho, máy móc)". This is correct accounting and matches "chênh lệch lợi nhuận và dòng tiền".

### di-tiep/02
- Research claims verified. Fernandes 2014: 168 papers, 201 studies, 0,1% variance, effects decay ✓. Kaiser et al.: 76 RCTs, >160.000 people, 33 countries, JFE 2022, positive causal effects ✓. Drexler 2014: Dominican Republic, ADOPEM clients, larger effect for low-skill participants ✓.
- SVG: Kaiser's **rising trend line** implied the effect grows over time, which neither paper claims. Fernandes's falling line sat on an unlabelled axis. Replaced both lines with what each study measured ("% phương sai ≈0,1%, giảm dần" vs "tác động nhân quả trung bình tích cực"). The Kaiser box is now neutral (no implied winner).
- Caption "không trực tiếp mâu thuẫn" is stronger than the original, and Kaiser et al. themselves report effects 3–5× larger than prior research. Now: "không so trực tiếp như cùng một con số" (the original's framing).
- RealLife coffee: "không phải khoa học sai" was too absolute (the lesson itself cites the priming replication failure). Now "chưa chắc nguồn nào sai".
- RealLife Dominica had no analogy and restated the original. Rewrote it with a rice-variety analogy (Mekong delta vs northern terraces, trial plot).

### di-tiep/03
- RealLife pilot checklist: PASS (analogy correct, does not claim certification).
- Caption: added the original's limit "đủ năm điều vẫn không chứng minh mọi sản phẩm đều phù hợp". SVG PASS.

### di-tiep/04
- RealLife 1: "mục THUẾ, NQ 110" was ambiguous because two entries carry the THUẾ label (17, 25). Now "nguồn số 25". The 15,5 triệu figure comes from the lesson's own sourced figure, and NQ 110/2025 is verified ✓.
- RealLife 2: the title "Ngày nghiên cứu..." did not match content about a decree's year. Retitled to "Năm ban hành không cho biết văn bản còn hiệu lực". "cổng thông tin pháp luật" became "cơ sở dữ liệu văn bản pháp luật chính thức".
- SVG step ③ and caption: added "hiệu lực" to match the RealLife and the original's line 22.

## Checks

- `pnpm verify:fidelity`: **OK — 27 kien-truc + 23 tai-chinh** (full suite, after all edits).
- Hex grep on the 12 SVGs: 0. No named colours. Hand-rolled XML tag balance/ampersand check: 12/12 OK. `<title id="svg-...">` present in all. No duplicate `id="svg-*"` site-wide. Largest SVG is 3114B.
- RealLife: 22 blocks, all ≤ 90 words (body, whitespace tokens), all end with "→ …". No curly quotes in JSX attributes. No RealLife nested in `<Note>`. Captions contain no internal `"`.
- Diff audit: only RealLife bodies/titles, Figure alt/caption, `examplesReviewed` changed in MDX.
- Not run: `pnpm build/check` (per instructions). No visual light/dark check (no dev server).

## Sources

- NHNN/banks: never give OTP/PIN to anyone: [VOV](https://vov.gov.vn/ngan-hang-khuyen-cao-khong-nen-cung-cap-mat-khau-otp-cho-nguoi-khac-dtnew-144220), [Người Lao Động/NHNN](https://tuoitre.vn/nld/xuat-hien-chieu-lua-tu-cai-dat-sinh-trac-hoc-ngan-hang-nha-nuoc-noi-gi-196240724120557534.htm)
- "Tài khoản an toàn" warning: [An ninh Thủ đô](https://anninhthudo.vn/canh-bao-an-toan-giao-dich-tuyet-doi-khong-chuyen-tien-vao-tai-khoan-an-toan-post669223.antd)
- UBCKNN publishes licensed fund-manager list at ssc.gov.vn: [Báo Chính phủ](https://baochinhphu.vn/canh-bao-gia-mao-van-ban-cua-uy-ban-chung-khoan-nha-nuoc-102230703171911732.htm), [VTV](https://vtv.vn/xa-hoi/canh-bao-gia-mao-uy-ban-chung-khoan-nha-nuoc-20230704064143041.htm)
- TT 04/2022/TT-NHNN early withdrawal: [Báo Chính phủ](https://baochinhphu.vn/quy-dinh-moi-ve-lai-suat-rut-truoc-han-tien-gui-10222062114522068.htm), [LuatVietnam](https://luatvietnam.vn/tai-chinh/thong-tu-04-2022-tt-nhnn-ngan-hang-nha-nuoc-viet-nam-222809-d1.html)
- TT 11/2021 debt groups (nhóm 2 includes restructured debt; nợ xấu = nhóm 3–5): [Thư viện pháp luật](https://thuvienphapluat.vn/hoi-dap-phap-luat/no-qua-han-bao-nhieu-ngay-thi-thanh-no-xau-nhom-2-138021585.html)
- Deposit insurance 350 triệu from 13/7/2026 (TT 05/2026): [BHTGVN](https://div.gov.vn/tu-ngay-13-7-2026-han-muc-chi-tra-tien-bao-hiem-cua-bao-hiem-tien-gui-viet-nam-la-350-trieu-dong)
- NQ 110/2025/UBTVQH15 (15,5 / 6,2 triệu): [LuatVietnam](https://luatvietnam.vn/tin-van-ban-moi/chinh-thuc-nang-muc-giam-tru-gia-canh-len-155-trieu-thang-ap-dung-tu-ky-tinh-thue-2026-186-104778-article.html)
- 50/30/20 = needs/wants/savings-or-debt: [Forbes Advisor](https://www.forbes.com/advisor/banking/guide-to-50-30-20-budget/)
- Fernandes, Lynch & Netemeyer 2014: [RePEc](https://ideas.repec.org/a/inm/ormnsc/v60y2014i8p1861-1883.html)
- Kaiser, Lusardi, Menkhoff & Urban 2022: [RePEc JFE](https://ideas.repec.org/a/eee/jfinec/v145y2022i2p255-272.html), [GFLEC](https://gflec.org/metaanalysis/)
- Drexler, Fischer & Schoar 2014: [AEA](https://www.aeaweb.org/articles?id=10.1257/app.6.2.1), [J-PAL PDF](https://www.povertyactionlab.org/sites/default/files/research-paper/124_303%20Rules%20of%20Thumb%20AEJ%20Apr2014.pdf)

## Unresolved questions

- Block count: 10/11 lessons have 2 RealLife blocks (di-tiep/03 has 1), below the guide's "3–5". Batch G justified this as scaling to short lessons. I did not add blocks (fact-check scope). Should the guide say 1–2 is acceptable for short lessons, or should a writer add blocks?
- Light/dark visual check of the 4 redrawn/relabelled SVGs has not been done (no dev server in this task).
- The parallel agent shares the scratchpad dir. My first `wc.mjs` was overwritten mid-run (detected and re-run under a unique name). This is a harmless process note.
