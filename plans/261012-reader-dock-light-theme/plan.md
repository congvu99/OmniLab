# Reader dock + light-theme dock

Status: done · Created 2026-10-12

## Vấn đề (user)
1. Màn đọc bài trên iPhone không có menu dưới đáy → quay lại khó (nút back chỉ ở góc trên trái).
2. Dock vẫn màu đen khi máy dùng theme sáng.

## Quyết định
- Reader <1024px: hiện lại dock 4 tab, TỰ ẨN khi cuộn xuống đọc, HIỆN khi cuộn lên (ngưỡng nhỏ, tránh giật) hoặc gần cuối bài, và luôn hiện khi ở đầu trang. Desktop không đổi (sidebar).
- Dock theme sáng: vật liệu kính sáng (nền surface/material, chữ tối, hairline), mục đang chọn dùng pill volt + chữ --on-volt (volt chỉ là FILL). Theme tối giữ dock mực như hiện tại. Toast dùng token dock → đi theo cùng.

## Phạm vi / file
- src/styles/tokens.css (dock tokens light), src/components/shell/tab-bar.astro, src/layouts/reader-layout.astro (mount TabBar), script auto-hide (src/lib/dock-autohide*.ts + test), reader padding-bottom + toast offset khi dock hiện, src/components/lesson/reader-toast.astro nếu cần, tests/token-contrast.test.mjs (đổi cặp kiểm tra theo ngữ nghĩa mới, KHÔNG hạ ngưỡng 4.5/3).
- Ngoài phạm vi: desktop, đổi cấu trúc tab, tính năng mới.

## Acceptance
- iPhone reader: dock hiện khi mở bài; cuộn xuống >~80px ẩn (translateY + fade); cuộn lên ≥~24px hoặc còn <~400px tới cuối bài → hiện; ở đầu trang luôn hiện. Reduced motion: chỉ đổi opacity/visibility, không trượt.
- Dock ẩn không bắt focus (inert/visibility) ; khi focus bàn phím vào dock thì hiện.
- Không che nội dung cuối bài / nút hoàn thành / toast.
- Theme sáng: dock nền sáng, mọi chữ/icon ≥4.5:1, viền ≥3:1 nếu là ranh giới; theme tối không đổi.
- Không đổi data-* hooks, route, localStorage, CSP (không inline script). ClientRouter: không nhân đôi listener.
- pnpm test / check / build xanh.
