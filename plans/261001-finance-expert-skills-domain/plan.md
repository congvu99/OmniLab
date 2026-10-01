# Lĩnh vực mới: Nghề tài chính (kỹ năng bổ trợ)

Status: done · 2026-10-01 (fact-check + 19 SVG xong)

## Mục tiêu
Thêm lĩnh vực thứ 3 vào OmniLab: 6 nhóm kỹ năng bổ trợ ngoài kiến thức tài chính (dữ liệu & công nghệ, vĩ mô & địa chính trị, pháp lý–đạo đức–thuế, tài chính hành vi, giao tiếp & lãnh đạo, phân tích ngành). Mỗi nhóm: 1 bài "hiểu nhanh" + 1 bài "học ở đâu, học thế nào" (quy trình theo chặng, nguồn đã kiểm tra).

## Quyết định
- **Domain mới `nghe-tai-chinh`**, không chèn vào `tai-chinh`: domain `tai-chinh` (`isFinance`) so fidelity cả domain với `content-sources/finance/index.html`; thêm bài vào đó sẽ phá gate.
- Không đặt `isFinance` (sẽ kéo theo chiến lược fidelity HTML). Bài cần cảnh báo dùng `<Disclaimer />` trực tiếp trong MDX (extractor đã bỏ qua component này).
- Nội dung tự biên soạn: snapshot markdown trong `content-sources/nghe-tai-chinh/<module>/<nn>-<slug>.md`, MDX = snapshot + `<RealLife>`/`<Disclaimer>`.
- `examplesReviewed: false` (badge "Nháp") cho tới khi fact-check độc lập.
- Không vẽ SVG mới ở đợt này.
- Giọng văn sách (user yêu cầu giữa chừng): nhân vật Lan + anh Quân, số liệu có nguồn, Mẹo, Đọc thêm; sách chỉ giới thiệu khi có bản tiếng Việt hoặc đọc online miễn phí.
- Báo cáo research có lỗi đã tự sửa khi viết bài: số hiệu Luật Chứng khoán (54/2019/QH14, không phải 80/2019), thuế 0,1% gán nhầm cho TT 135/2025, tên bài Gal & Rucker, số liệu ngành bịa (NIM, quỹ đất...) đã loại bỏ.

## Phases
1. Nghiên cứu 6 nhóm (6 researcher song song) → `reports/research-0N-*.md`
2. Viết 14 bài (2 tổng quan + 12) + snapshot
3. Domain YAML, test, check, build
4. Cập nhật README, roadmap, codebase-summary

## Acceptance
- `pnpm test`, `pnpm check`, `pnpm build` pass (gồm verify-fidelity, contrast accent).
- Mỗi nguồn học trong bài có URL đã kiểm tra hoặc ghi "chưa xác minh".

## Fact-check + SVG (đợt 2)
- 3 fact-checker độc lập → `reports/fact-check-{a,b,c}-*.md`; đã sửa hết lỗi Sai/Diễn đạt/Link hỏng (gồm: số liệu CFA thuộc báo cáo 5/2019, không phải 2021; RealLife bác sĩ sai Luật Dược → đổi ví dụ; "bốn giải Nobel" → ba; văn bản sửa đổi Luật 56/2024, NĐ 128/2021, 306/2025, 245/2025, Luật 96/2025; link CFA ethics; Ha-Joon Chang nay ở SOAS).
- 19 SVG trong `src/assets/illustrations/nghe-tai-chinh/`, đã xem light/dark bằng Chrome headless.
- `examplesReviewed: true` cả 14 bài.
