---
title: "Editorial review (original content): finance khoi-dong, an-toan, thuc-hanh, nguon-hoc, di-tiep (11 lessons)"
date: 2026-09-29
status: completed
---

# Editorial review: finance "other" modules, original text only

Scope: original content of the 11 lessons in `src/content/lessons/tai-chinh/{khoi-dong,an-toan,thuc-hanh,nguon-hoc,di-tiep}/*.mdx`. `<RealLife>`, `<Figure added>` and `<Disclaimer>` were excluded. The only edit was appending one `<ReviewNote>` block at the end of each file that had issues. Frontmatter and existing lines are unchanged (`git diff -U0`: every hunk is `+N,0` at EOF).

Compared against: `content-sources/finance/index.html` (converted to annotated text for a diff by eye).

## Verdict per lesson

| Lesson | ReviewNote | Items |
|---|---|---|
| khoi-dong/01-vi-sao-hoc | yes | 1 Định dạng (hero "pills" merged into a run-on line) |
| khoi-dong/02-bon-chang | no | EU/OECD framework claims verified |
| an-toan/01-boi-canh-viet-nam | yes | 2 Lỗi thời (gold tax 01/7/2026; eTax link on the old Bình Phước subsite), 3 Diễn đạt (CIC free-once-a-year not supported by the cited VIB page; the "15 năm" pension condition omits retirement age; the 60-day ULIP rule omits the Luật TCTD 2024 ban on tied insurance) |
| an-toan/02-chong-gia-mao | no | thresholds, tố giác path, 2023 UBCKNN warning verified |
| thuc-hanh/01-bai-tap-va-thu-tu-tien-du | yes | 2 Định dạng (lost superscript "số năm"; `<details>` solutions flattened, so "Xem lời giải" is dead text), 1 Diễn đạt ("suất tăng sức mua") |
| nguon-hoc/01-nguon-hoc-chinh-thuc | no | KAV 11/39, Coursera 4,8 / 32.312 / 2.431.713, CFA 350 USD / 35–65 h / 12 months, Open Yale lecture numbers 2/4/5/11 all verified |
| nguon-hoc/02-tu-sach-va-lich-doc | yes | 1 Sai (*Same as Ever* has a VN print edition, 2024), 3 Diễn đạt (*The 100-Year Life* link says "tạm dịch", no VN edition evidence, no authors; Ittelson VN publisher/translator is on the cited Goodreads page; Malkiel author missing), 1 Định dạng ("mục 05" references have no link after the lessons were split) |
| di-tiep/01-chon-nhanh-tiep | no | — |
| di-tiep/02-nghien-cuu-noi-gi | yes | 2 Diễn đạt ("bản bàn giao" is internal jargon; "Điểm được kiểm chứng lại" is an author changelog) |
| di-tiep/03-tu-danh-gia | yes | 1 Định dạng (the `ul.checklist` "□" boxes were lost, but the lead-in still says "Đánh dấu") |
| di-tiep/04-nguon-tham-khao | yes | 2 Lỗi thời (source 28 gold tax, source 17 eTax Bình Phước), 1 Diễn đạt ("máy hiện tại", "bản bàn giao", "trình đọc web") |

Total: 7 lessons annotated, 21 items (1 Sai, 4 Lỗi thời, 10 Diễn đạt, 6 Định dạng).

## Key findings (evidence)

1. **Gold-bar tax (an-toan/01 row Vàng; di-tiep/04 #28).** The lessons say "chịu thuế 0,1% từ 01/7/2026". On 30/6/2026 the Ministry of Finance said this reading is inaccurate and the tax is not being collected yet. Luật 109/2025/QH15 leaves the threshold, start date and rate adjustment to the Government, and the implementing decree is still pending. [Báo Chính phủ](https://baochinhphu.vn/chua-thu-thue-chuyen-nhuong-vang-mieng-tu-ngay-1-7-2026-102260630112726952.htm)
2. **eTax link (an-toan/01; di-tiep/04 #17).** `binhphuoc.gdt.gov.vn` still returns HTTP 200, but it belongs to a province that NQ 202/2025/QH15 merged into Đồng Nai (effective 01/7/2025). A national equivalent exists: `https://gdt.gov.vn/wps/portal/Home/etax-mobile/tl-hd` (HTTP 200, same section).
3. ***Same as Ever* (nguon-hoc/02).** A VN print edition exists: "Quy luật bất biến về bản chất con người và tâm lý làm giàu", 1980 Books / NXB Công Thương, translated by Hoàng Thị Minh Phúc, 2024. [Alpha Books](https://shop.alphabooks.vn/same-as-ever-quy-luat-bat-bien-ve-ban-chat-con-nguoi-va-tam-ly-lam-giau-morgan-housel-1980-books-p39106304.html)
4. **CIC "lượt tra đầu tiên mỗi năm miễn phí".** The claim is true ([Techcombank](https://techcombank.com/thong-tin/blog/cic-la-gi): "miễn phí kiểm tra CIC 1 lần/năm"), but the cited VIB page only says "miễn phí qua 3 kênh".
5. **Tied insurance.** Luật Các TCTD 2024 Điều 15 (from 01/7/2024) bans tying non-compulsory insurance to any banking service. The 60-day ULIP window from TT 67/2023 (verified on xaydungchinhsach) is narrower, so on its own the row reads as if bundling were allowed outside that window. [BNews](https://bnews.vn/quy-dinh-cam-ban-bao-hiem-di-kem-khoan-vay-co-ngan-duoc-triet-de-tinh-trang-ban-bia-kem-lac/339454.html)

## Verified OK (no note)

- QĐ 928/QĐ-TTg (25/5/2026) replaces QĐ 149; học sinh, sinh viên are a priority group (vanban.chinhphu.vn detail page plus news).
- Biometric thresholds of 10 triệu per transaction and 20 triệu per day (SBV page); tố giác via "Bộ với công dân" → "Gửi nội dung tố giác về tội phạm" (Công an Nghệ An, 08/05/2026); Báo Chính phủ 02/03/2023 UBCKNN warning about fake fund managers.
- NĐ 232/2025, NQ 05/2025/NQ-CP (09/9/2025), Luật BHXH 2024 (75/70 tuổi), TT 67/2023 (ghi âm, 60 ngày).
- EU/OECD framework (Jan 2022; digital and sustainable finance added).
- Research: Fernandes 168/201/0,1%; Kaiser 76 RCT / >160.000 / NBER w27057 2020 / JFE 2022; Drexler (AEA). The prior fact-check report already covered these, and I re-confirmed the link targets.
- Books: Boglehead (Ngô Thế Vinh, NXB Công Thương, 400 tr.), Chang (NXB ĐH KTQD, TS Nguyễn Tuệ Anh), Mollick (NXB Thế Giới, 04/2025), Cú hích (NXB Tổng hợp TP.HCM, 2023), Nudge on the Yale 2011 reading list, Open Yale lectures 2/4/5/11.
- Math: exercises 1–4 recomputed (3 tr; 27 − 6 = 21; 7 months; 11.910.160; 1,92%; 1,44 tr vs 780.000; 25%; 66,7%) ✓.

## Link check (all 60 unique external URLs, curl GET -L, browser UA)

- No 404, 410, DNS or TLS failures.
- 403 bot walls, all verified to exist another way: consumerfinance.gov (WebFetch read the content), oecd.org (search index shows the page), thuvienphapluat.vn (Cloudflare "Just a moment", not verifiable automatically).
- Same-site redirects: happy.live → happylive.com.vn, ssc.gov.vn → /webcenter/portal/ubck, the old VTVgo URL → `vtvgo.vn/page/digitalvodplaylist_1539` (same playlist id), plus trailing-slash and slug normalisations on fonos, congan.nghean and xaydungchinhsach (NĐ 232).
- Soft-content checks: the BHXH ItemID=443898 page is a Q&A about tra cứu quá trình đóng ✓. The Nghệ An police article matches ✓. The vanban docid pages are the correct documents ✓.
- JS-only pages, where I confirmed HTTP 200 but could not check the content: dragoncapital.com.vn VN30 product page, VTVgo playlist, vi.khanacademy.org course (client challenge).

## Checks

- `pnpm verify:fidelity`: **OK — 27 kien-truc + 23 tai-chinh**.
- The 7 edited MDX files compile with @mdx-js/mdx 3.1.1 + remark-gfm, 7/7 OK. Build/check not run, per instructions.
- No git commit.

## Cross-cutting (outside ReviewNote scope; frontmatter can't be edited)

- `summary` in frontmatter is auto-extracted and is used as the meta description and in search results. For 8 of the 11 lessons it is just the eyebrow ("05 / Bối cảnh Việt Nam"). For an-toan/02 it is truncated list text ending "… 3.", and for nguon-hoc/02 it is truncated and contains raw `**`. Consider hand-written summaries.

## Unresolved questions

- The biometric rule is cited as QĐ 2345/QĐ-NHNN. TT 50/2024/TT-NHNN (from 01/01/2025, amended by TT 77/2025 from 01/7/2026) now governs online-banking authentication. Sources disagree on whether QĐ 2345 is still the operative basis for the individual 10/20 triệu thresholds, so I did not flag it. Worth checking with a legal database.
- *Your Money or Your Life*: one blog uses a VN title ("Tiền hay cuộc sống"), but I found no print edition. I left the original claim as is.
- The *Tiền khéo, tiền khôn* VTVgo link and the Dragon Capital product page render only with JS. Their content is unverified.
