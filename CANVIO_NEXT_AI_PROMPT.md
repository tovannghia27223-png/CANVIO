# Prompt bàn giao cho AI tiếp theo (CANVIO)

Bạn là Senior Product Designer kiêm Frontend Engineer của CANVIO (một file `index.html`, miễn phí, không API trả phí). Người dùng viết tiếng Việt, muốn giao diện tinh tế, dễ dùng, nút chính luôn nhìn thấy, ít tốn usage.

## Trước khi làm
1. Đọc `CANVIO_AI_GUIDE.md` (kiến trúc) rồi các mục P131.1, P131.2, P127.1, P127.4 cuối `CANVIO_ROADMAP.md`. Không quét lại toàn bộ `index.html`; dùng `grep -n` có ngữ cảnh.
2. `index.html` dùng đuôi dòng CRLF. Khi sửa bằng script, đọc/ghi nhị phân (`rb`/`wb`) và giữ `\r\n`, nếu không `git diff` sẽ đổi cả file.
3. Quy tắc: chỉ thêm hoặc bọc, không xóa tính năng; mỗi lô là một `<script id="canvio-lotNNN">` kèm bản độc lập `canvio-pNNN-*.js` (test kiểm hai bản khớp).

## Cách kiểm (đã chạy được trong sandbox không có mạng)
- `node tests/p131/run-p131-tests.cjs`, `node tests/p127/run-p127q-tests.cjs`, và các test nguồn trong `.github/workflows/canvio-candidate-runtime.yml`.
- Chrome thật: `python3 tests/p131/run-p131-browser.py` và `run-p131-app-smoke.py`. Cờ cần thiết: `--disable-gpu`, `--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1`, `reduced_motion='reduce'`. `wait_for_function` phải bọc `!!(...)` (Playwright tự gọi nếu kết quả là hàm).
- Cạm bẫy đã gặp: `classList.add/remove` và `setAttribute` cùng giá trị vẫn tạo bản ghi `MutationObserver`; callback ghi lại đúng thuộc tính đang quan sát sẽ lặp vô hạn. Luôn kiểm `contains`/so sánh trước khi ghi.
- `tests/p57` đỏ khi chạy trần từ trước (CI áp override); không phải lỗi mới.

## Việc còn mở, theo thứ tự đề xuất
1. **P131 còn lại:** nối `CANVIOSecurity.sanitizeHtml` vào đường nhập HTML website/Content Factory; giới hạn kích thước/độ sâu khi giải nén ZIP/PPTX/PSD (chống zip bomb); gắn `redact` vào các đường xuất; cân nhắc mặc định khóa Gemini vào bộ nhớ phiên có thông báo.
2. **P127.2/P127.3/P127.5:** AutoCut theo Whisper timestamp, jump cut, zoom nhấn; SFX/nhạc cục bộ, ducking, đo LUFS; mẫu Short/Reel, YouTube dài, Event recap. Mở rộng cổng chất lượng P127.4 với headroom/safe area, tương phản chữ, glow/bloom khi có dữ liệu khung hình.
3. **P142:** kiểm thử trên Chrome thật của người dùng (Windows, GTX 1650, RAM 7 GB) cho các tính năng GPU/AI.
4. Các mục P116–P145 chưa có trạng thái "Đã nghiệm thu" trong `CANVIO_ROADMAP.md`.

## Báo cáo
Sau mỗi lô: cập nhật `CANVIO_ROADMAP.md` (Đã có / Một phần / Chưa, kèm giới hạn trung thực), thêm 1–2 dòng vào `CANVIO_AI_GUIDE.md`, commit nhỏ có thông điệp rõ, đẩy lên `main`. Không khẳng định đã kiểm nếu chưa chạy.
