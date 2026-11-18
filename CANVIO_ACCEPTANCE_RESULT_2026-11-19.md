# CANVIO 23.3.110 — Biên bản nghiệm thu (chạy trong container, 2026-11-19)

index.html SHA-256 `1736457b…9b82` (không đổi). Kết quả là bằng chứng thật của lần chạy này; chưa phải nghiệm thu thực tế (xem phần C).

## A. PASS
Node: P48, P49, P50, P55, P56, P57, P63–P67, P68–P70, P74/P81 contract, P85 contract, worker P102/P105, P107 ZIP.
Chromium (Chrome hệ thống): P55, P56, P62, P63–P67, P68–P70, P72/P73/P102/P103/P105–P107 API smoke, P85 lazy boot, P88 PPTX, P97–P101/P104, P106 (2D fallback + SwiftShader WebGL).
Static audit, manifest 162/162.

## B. Không chạy được vì môi trường (không phải lỗi app)
- P87 (DOCX) và P90–P96 (UX): lỗi duy nhất là `net::ERR_TUNNEL_CONNECTION_FAILED` cho `cdnjs.../three.js/r128/three.min.js`. URL này nằm trong website do app SINH RA (preview/xuất, hằng `CDN3`), không phải lúc khởi động app (boot = 0 request ngoài). Container chặn mạng nên tải thất bại → test "không có console error" rớt. Đã chạy trước đó trong môi trường khác: P87 14/14, P90–P96 34/34. Cần chạy lại có mạng hoặc stub CDN ở cấp context.
- P82/P84 PDF: thiếu PyMuPDF (`fitz`), không cài được (không có mạng) → NOT RUN.
- Test P85/P82 mặc định trỏ `/usr/bin/chromium`; trên máy này dùng `CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome`.

## C. Vẫn OPEN (cần mạng/phần cứng/người)
P74/P81 runtime + giải mã nén; P85 runtime (PostFX, OpenCV, dotLottie, Rive, WebGPU); suy luận P80/P102/P105; GPU vật lý P106; hai thiết bị + Project Vault P107; 14 cổng P70. `releaseCertified:false`. Không Stable, không deploy.

## D. Ghi chú sản phẩm
Website xuất ra dùng CDN three r128/GSAP khi người dùng không đóng gói offline (P73). Đây là hành vi hiện có, nên ghi rõ trong UI nếu muốn cam kết "không mạng".
