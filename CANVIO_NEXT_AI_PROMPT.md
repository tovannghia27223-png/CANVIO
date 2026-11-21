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

## Cập nhật 2026-11-20 (sau P145 core)
Đã có thêm: P127.3 (LUFS), P127.5 (mẫu), P125.1/P125.3/P125.4-phần giảm dung lượng (web cuộn từ video), P145 core (giấy phép, cue sheet, kiểm font, data merge, JSONL).
Pull trước khi làm: CI bot hay push commit "build: commit verified ..." lên main; dùng `git pull --rebase origin main`.
Việc còn mở theo thứ tự gợi ý: P125.2 editor cuộn; P132 xuất GIF/APNG/WebP động; P136 Image Trace; P137 kiểu đoạn/bảng/luồng chữ; P138 khử ồn + TTS; P145.3 SFX Web Audio; P145.2 shader chuyển cảnh; P134 waveform/vectorscope; P124 Auto Layout/Component; P133 OPFS/proxy; P143 tách mã; P144 Command Palette; P145.4b trình phát nhúng tự phát; P130 (chặn: cần Supabase thật); P142 kiểm Firefox/WebKit/cảm ứng.
Quy tắc nhúng: mỗi lot là `<script id="canvio-lotNNN">` + bản độc lập `canvio-pNNN-*.js`; không viết chuỗi `</script>` thật trong mã (dùng `<\/script>`); index.html dùng CRLF, sửa bằng đọc/ghi nhị phân.



## Cập nhật tiếp tục 2026-11-21 — P134.2 candidate

- P134.2 Auto Reframe bản nhẹ đã có source canvio-p134-reframe.js, Node test tests/p127/run-p134r-tests.cjs (11 assertions), Chromium/ffprobe test tests/p145/run-p134r-browser.py trên branch work/p134-auto-reframe-20261121.
- Dò tương phản cạnh + sai khác frame; 9:16/1:1; WebM; giới hạn 60 giây/100 MiB. Không phải face/object AI; không upload/đụng timeline.
- Đọc kết quả PR/hosted CI trước khi merge. Không sửa PR #45. Nếu CI pass, kiểm source parity/index build/manifest trước khi xác nhận main.
- P133 trên main đã có OPFS/recovery + denoise Worker; chỉ còn proxy 720p, OffscreenCanvas use-case cụ thể và migration tài sản lớn có quota/rollback. P143 vẫn là tách mã theo từng lot và parity test.


## Tiếp tục P124 — rebased candidate 2026-11-21

- Source canvio-p124-autolayout.js, lot canvio-lot124; tests/p124/run-p124-tests.cjs và tests/p124/run-p124-browser.py.
- Branch work/p124-autolayout-rebased-20261121 dựa trên main hiện tại, không dựa trên PR #45 cũ. Chờ hosted CI trước khi merge.
- Scope hiện có 5 preset responsive + 4 card variants, dùng CVWeb.addComponents/CV.engines.web.save. Còn convert component chọn, visual breakpoint editor, nested variant sync, drag/resize constraints và accessibility/real GrapesJS review.
