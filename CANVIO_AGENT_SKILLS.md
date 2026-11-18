# CANVIO Agent Skills — hướng dẫn cho AI/Claude Code

Tài liệu này là **skill pack hướng dẫn agent**, không phải thư viện/runtime chạy trong CANVIO. Không thêm package hoặc request mạng chỉ để "cài skill".

## 1. Nguyên tắc vận hành

1. Đọc `CANVIO_AI_GUIDE.md` và `CANVIO_ROADMAP.md` trước khi sửa.
2. Làm additive, giữ một owner cho project, Asset Library, timeline, layer/history và Project Vault.
3. Ưu tiên Web, Poster, CV, PPT, Canva-like Design và Video; 3D/CGI nặng ở cuối.
4. Ưu tiên dependency miễn phí, có license thương mại rõ ràng; ghi source, version, license và bundle size. Không thêm dependency nếu môi trường offline không thể pin/bundle/kiểm tra.
5. Provider/model chỉ chạy khi người dùng bấm; không nhúng API key, không gửi asset riêng tư ra API host.
6. Không tạo dashboard giả, nút giả hoặc feature parity giả. Capability phải có owner, path thực thi và error handling.
7. Giữ giới hạn `P70 releaseCertified:false` cho đến khi người nghiệm thu có evidence cho từng gate thật.

## 2. Skill theo chuyên môn

### Product / Brand / Design System
- Chuẩn hóa mục tiêu, người dùng, workflow, token, hierarchy, contrast và empty/error/loading state.
- Gộp tính năng trùng; không tạo Brand Kit, Theme, font store hay asset catalog song song.
- Brand apply phải có preview, báo cáo tác động, explicit confirm và undo.
- Design DNA/AI output là gợi ý có sai số, không hứa tái tạo giống tuyệt đối.

### Frontend Engineering
- Trước khi sửa, tìm module owner theo tên API trong guide; không scan toàn bộ HTML trừ khi cần.
- Gắn panel vào page/editor đã có, giữ navigation/toolbar/action bar nhất quán.
- Giữ focus, keyboard, accessible label, `prefers-reduced-motion`, mobile/reflow và trạng thái nút disabled.
- Không thêm `script src` runtime vào app offline. Worker/file asset phải được đóng gói cạnh `index.html` theo đường dẫn tương đối.
- Chèn script trước `</body>` cuối cùng, không dùng `</body>` đầu tiên vì template website có thể chứa chuỗi HTML.

### Video / Motion
- `CV.engines.video` là timeline duy nhất. Mọi clip import, export, undo và commit qua owner này.
- Tôn trọng track lock/visibility/mute, `isClipLocked`, canonical history và Project Vault hooks.
- WebCodecs chỉ dùng khi capability thật phù hợp; không bỏ audio/footage âm thầm. Giữ MediaRecorder/WebM fallback.
- Motion checklist chỉ điền gợi ý vào inspector; người dùng tự áp dụng.

### AI / Local Inference
- Model tải lười sau hành động rõ ràng của người dùng; ưu tiên worker.
- Có backend detect, fallback WebGPU → WASM/CPU, progress, cancel, unload, max file/dimension và quota/memory notice.
- Dữ liệu đầu vào/đầu ra chỉ đi qua Asset Library hiện hữu. Ghi rõ model license và dữ liệu được truyền đi (nếu có).
- Không gọi inference thật trong boot, không chạy nền, không tuyên bố PASS nếu chưa tải model và dùng sample thật.

### QA / Release Engineering
- Chạy Node parse cho từng inline script và worker, kiểm duplicate IDs, actual DOM external scripts, module sync và workflow syntax.
- Tách source VM, Chromium synthetic smoke, real-origin browser acceptance, actual media/Office app round-trip và production deployment thành các mức evidence riêng.
- Ghi PASS/WARN/FAIL/OPEN/BLOCKED trung thực; không sửa test để che lỗi sản phẩm, cũng không giữ expectation title/version cũ sau đổi marker.
- Mỗi candidate phải có manifest SHA-256, ZIP integrity và handoff. Không deploy khi P70 gates còn OPEN.

## 3. Skill files bên ngoài

Không tự động chạy `npx skills add` trong build này vì network/npm registry bị chặn và skill ngoài không thuộc runtime CANVIO. Có thể cài skill tương thích trong môi trường agent sau khi kiểm tra source và license; ưu tiên Brand Identity, Frontend Design, Motion Design, Design DNA, Three.js và GSAP. Ghi ngày/version và không copy mã nguồn nếu chưa rõ license.

## 4. Definition of done cho mỗi P

- Mã thật được tích hợp vào owner hiện hữu.
- Có test hợp đồng/fixture tương ứng; lỗi đã tái hiện được sửa.
- Static audit pass; các smoke môi trường không chạy được ghi BLOCKED thay vì giả PASS.
- `CANVIO_AI_GUIDE.md`, `CANVIO_ROADMAP.md`, `CANVIO_QA_REPORT.md`, `CANVIO_HANDOFF.md` được cập nhật cùng lượt.
- Tạo manifest, checksum và ZIP mới; ghi rõ phần còn OPEN cho AI nghiệm thu tiếp.
