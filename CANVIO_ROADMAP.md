# CANVIO — Lộ trình theo giai đoạn (P43+)

> Đọc `CANVIO_AI_GUIDE.md` trước khi sửa. Nguyên tắc: không viết lại từ đầu, không xóa tính năng cũ, chỉ gộp / thêm / nâng cấp; miễn phí, không API trả phí; không giả lập cloud bằng localStorage; export phải kiểm tra bằng file thật.

## Trạng thái hiện tại (đã kiểm bằng Chromium thật trên http://localhost)
- R6 `23.3.60-r6`: 48 page điều hướng được, 0 pageerror, Project Vault IndexedDB round-trip đạt, dữ liệu còn sau reload.
- Lỗi mạng duy nhất trong sandbox: CDN bị chặn (Google Fonts, Konva, GrapesJS, Three.js). Cần kiểm trên Chrome thật.
- Đã làm (nhánh `claude/p43-error-hardening`): 8 chỗ `onerror=reject` (FileReader, IndexedDB open, Image loader) nay reject bằng `Error` thật thay vì `Event`/`undefined`, nên log không còn "undefined" nếu một tài nguyên lỗi.

## Giai đoạn 0 — Chốt phát hành R6 (việc của chủ repo)
1. Settings → Pages → Source = `GitHub Actions`.
2. Settings → Variables → `CANVIO_ENABLE_PAGES_DEPLOY=true`, chạy workflow "CANVIO GitHub Pages (Node 24)".
3. Kiểm trên Chrome thật: Konva/GrapesJS CDN, lưu-đóng-mở dự án, P30/P31 trên website live.
4. Xóa `static.yml` cũ sau khi Node 24 deploy ổn (cảnh báo Node 20).
**Xong khi:** `main/index.html` là R6 trên production, không còn cảnh báo Node 20.

## Giai đoạn 1 — Nền tảng tin cậy (Production)
- Project recovery: autosave + khôi phục sau crash, danh sách phiên bản (snapshot có tên) trên Project Vault hiện có.
- Mở rộng adapter Unified Layers cho `videoEngine`, `webEngine`, `portfolioStudio` (hiện chưa có history/snapshot chung).
- Hợp nhất timeline: `MotionCut` và `Video Engine` dùng một nguồn dữ liệu, không tạo timeline thứ ba.
- Test hook cho export: kiểm file thật (kích thước, mime, giải mã lại được), không chỉ kiểm nút bấm.
**Xong khi:** đóng/mở lại dự án không mất dữ liệu; một timeline, một asset store, một project store.

## Giai đoạn 2 — Video (thay CapCut Pro)
- Multi-track chuyên sâu trên Video Engine: khóa/ẩn track, snap, ripple edit, nhóm clip.
- Keyframe graph (đường cong easing có thể kéo), dùng chung engine với Motion Lab.
- Chroma key (canvas/WebGL, local), mask hình học, tracking điểm đơn giản.
- Phụ đề tự động local (Whisper chạy WASM, kiểm giấy phép) — tùy chọn, tải khi người dùng bật.
- Export: WebM chắc chắn; MP4 qua WebCodecs khi trình duyệt hỗ trợ, ghi rõ giới hạn.
**Xong khi:** dựng được video 3 track có keyframe + chroma key, xuất file mở lại được.

## Giai đoạn 3 — Design (thay Canva Pro)
- Vector Forge: thư viện symbol, typography nâng cao (kerning, tracking, text-on-path).
- Layout Foundry: master pages, bleed, preflight cơ bản; multi-page poster dùng chung.
- Template nội bộ có tìm kiếm/tag, áp Brand Kit một nhấn (Theme Factory style).
- Bộ kiểm tra giấy phép cho font/icon/ảnh khi nhập vào Asset Library.
**Xong khi:** từ một Brand Kit tạo được poster + slide + web cùng bộ mặt.

## Giai đoạn 4 — Motion & Web (thay motion site AI)
- Animation timeline cho Website Engine: scroll-trigger, hover, interaction builder (CSS/IO thuần).
- Easing editor chung (Giai đoạn 2).
- Khung hiệu ứng 3D nhẹ (Three.js đã có loader), xuất HTML tự chứa.
**Xong khi:** dựng được landing page có scroll animation, xuất 1 file chạy offline.

## Giai đoạn 5 — AI (không giả lập)
- Model adapter thống nhất: Prompt Forge → provider (Gemini free tier, local qua Ollama/WebGPU nếu có).
- AI workflow: brief → prompt → asset → đặt vào editor, qua đúng luồng sync hiện có.
- Chỉ gọi là "AI" khi có model thật chạy; phần handoff prompt ghi rõ là handoff.
**Xong khi:** một model local/free tạo được ảnh hoặc văn bản và đưa vào Asset Library.

## Giai đoạn 6 — Asset & Production nâng cao
- Thư viện ảnh/video/icon/font/template có trường giấy phép.
- Batch export + preset (social, in ấn, web), hàng đợi render đã có (23.3.9).
- Backup/restore toàn dự án thành ZIP.

## Ngoài phạm vi (không làm)
Cộng tác real-time đa người dùng, lưu server, đồng bộ hai chiều với Canva/Figma — chỉ khi có kiến trúc đồng bộ thật.

## Prompt giao việc cho AI khác (mẫu)
> Theo `CANVIO_AI_GUIDE.md` và `CANVIO_ROADMAP.md`, làm Giai đoạn N. Chỉ sửa trong khối script/hàm đã có, không xóa tính năng cũ, không thêm dependency trả phí, giữ `if(...||$('#id'))return`. Sau khi sửa: chạy `CV190Library.tests()`, `CVUnifiedLayers.tests()`, `CANVIOPersistentProjects.tests()`, kiểm cú pháp mọi script, mở bằng Chromium thật và báo `pageerror`. Cập nhật mục liên quan trong guide.
