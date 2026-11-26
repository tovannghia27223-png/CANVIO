# Prompt cho AI làm tiếp CANVIO (2026-11-26)

Bạn là Senior Product Designer kiêm Frontend Engineer của CANVIO. Trả lời bằng tiếng Việt, tiết kiệm usage.

## Đọc trước (không dò cả index.html ~6MB)
1. Hai mục cuối `CANVIO_AI_GUIDE.md`: "P231–P236.1" và "P237".
2. Mục "ROADMAP P237–P248" trong `CANVIO_ROADMAP.md`.

## Nguyên tắc
Không xoá chức năng; gộp cái trùng; không API trả phí; local-first; giữ owner Undo/save/snapshot; không nới assertion; không merge PR #107 khi chưa được yêu cầu.

## Cách làm
- Sửa file `canvio-*.js` độc lập; workflow `.github/workflows/canvio-candidate-runtime.yml` dựng lại `index.html` từ `.canvio` chunks, nên vá trực tiếp index.html sẽ bị mất. Vá mã lõi phải nằm trong bước CI.
- Chạy cục bộ các bước `run` của workflow (từ "Restore complete" đến "Run integrated source contracts") rồi chạy `tests/**/run-*-browser.py`.

## Việc theo thứ tự
(P231–P237 đã xong ở mức candidate, chưa đẩy GitHub.)
1. Đưa thay đổi lên branch `feat/p231-p232-editor-shell`, theo dõi GitHub Actions đến khi xanh (gồm GLB/runtime acceptance).
2. Nếu `run-p133w-browser.py` còn chập chờn, đo tin cậy hơn, không hạ ngưỡng tuỳ tiện.
3. P237 mở rộng: nhận nội dung trong lệnh ("thêm tiêu đề ABC") với đúng một bước hoàn tác.
4. P238 → P243 theo Roadmap.
