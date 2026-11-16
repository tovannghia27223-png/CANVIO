# CANVIO — Bàn giao (2026-11-16)

## Trạng thái
- Production: `main` = R6 `23.3.60-r6` + bản vá P43 (lỗi tải/đọc tài nguyên báo bằng `Error` thật) + favicon SVG nhúng. Pages deploy (Node 24) đã chạy thành công.
- PR #7 (mở, **chưa merge**): P44 — lịch sử phiên bản trong Project Vault (📌 ghim phiên bản có tên, khôi phục, điểm khôi phục). Nhánh `claude/g1-version-history`.
- PR #4 (mở, không phải của phiên này): "docs: Phase 0 R6 acceptance audit".

## Đã kiểm (Chromium thật, http://localhost)
48 page điều hướng được; 0 pageerror; `CV190Library/CVUnifiedLayers/CANVIOPersistentProjects.tests()` đạt; IndexedDB round-trip đạt và còn dữ liệu sau reload; P44: ghim sống sót qua 4 lần tự lưu, restore đúng.

## Chưa kiểm / việc còn lại
1. Chrome thật: Designer (Konva) và Website Engine (GrapesJS) tải CDN được không; lưu–đóng–mở dự án có nội dung thật; P30/P31 trên website live; screen reader, zoom 200%, media thật; benchmark (P39–P41).
2. `pageerror: undefined`: chưa tái hiện được. Đã vá 8 chỗ `onerror=reject`; nếu còn thấy, gửi log kèm stack.
3. Giai đoạn 1 còn lại: adapter history cho `videoEngine`/`webEngine`/`portfolioStudio`; hợp nhất timeline MotionCut–Video Engine; test export bằng file thật. Giai đoạn 2–6: xem `CANVIO_ROADMAP.md`.
4. Xóa `static.yml` (workflow Pages cũ, còn cảnh báo Node 20) khi chắc chắn Node 24 ổn.

## Quy tắc khi sửa
- Đọc `CANVIO_AI_GUIDE.md` trước; chỉ sửa trong khối/hàm có sẵn; không xóa tính năng cũ; giữ guard `if(...||$('#id'))return`; không API trả phí; không giả lập cloud.
- **Khóa SHA-256 trong `.github/workflows/canvio-pages-node24.yml`:** mọi thay đổi `index.html` làm CI đỏ cho đến khi thêm hash mới (`sha256sum index.html`) vào danh sách `expected_r6*`.
- Test nhanh: chạy `python3 -m http.server`, mở bằng Playwright/Chrome, bắt `pageerror`, chạy 3 hàm `tests()` ở trên.
- Sau khi sửa, cập nhật đúng mục liên quan trong guide (file guide chưa nằm trong repo — nên thêm vào).

## Việc chỉ chủ repo làm được
Settings → Pages (Source = GitHub Actions) và biến `CANVIO_ENABLE_PAGES_DEPLOY=true` — đã bật, deploy chạy được. Phiên Claude không đổi được các cài đặt này.

## Prompt giao việc cho AI khác
> Theo `CANVIO_AI_GUIDE.md`, `CANVIO_ROADMAP.md`, `CANVIO_HANDOFF.md`: làm [mục]. Sửa surgical, không xóa tính năng cũ, thêm hash mới vào workflow, test Chromium thật (0 pageerror, 3 hàm tests() đạt), mở PR, ghi lại vào guide.
