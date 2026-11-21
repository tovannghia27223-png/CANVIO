# CANVIO — Tóm tắt phiên làm việc (2026-11-20 → 2026-11-21)

Mọi mục dưới đây đã nằm trên `main`, mỗi mục là một lot độc lập `canvio-lotNNN` (nhúng trong `index.html`) + bản `canvio-pNNN-*.js` + test Node + test Chrome thật. Quy tắc: chỉ thêm, không xoá chức năng cũ.

| Mục | Làm gì | Kiểm bằng gì |
|---|---|---|
| P127.3 | Đo độ to LUFS (BS.1770-4) cho clip đang chọn, gợi ý tăng/giảm tới −14 LUFS | Sine chuẩn −3,01 LUFS, stereo +3 dB, gate; Chrome (nút) |
| P127.5 | 4 mẫu dàn dựng: Short/Reel, YouTube dài, Recap, Video vui (khung chữ, có undo) | Unit + Chrome (thêm 5 khung, undo) |
| P125.1 / P125.3 / P125.4 (giảm dung lượng) | Video → web cuộn (HTML offline), mẫu chữ Hero/Lộ dần/Marquee, ngân sách MB | Chrome thật: cuộn đầu/giữa/cuối, chữ đúng, reduced-motion |
| P132 (GIF) | Bộ mã hoá GIF89a, xuất từ timeline | ffprobe giải mã đúng codec/rộng/số khung |
| P145 core | Giấy phép + credit + cổng chất lượng, cue sheet nhạc (link), kiểm font tiếng Việt, data merge CSV, JSONL | Unit 13 mục + Chrome 8 mục |
| P145.3 | 6 SFX tổng hợp (whoosh, hit, riser, click, glitch, pop), WAV, thêm vào timeline | Chrome + ffprobe |
| P136 | Image Trace ảnh → SVG nhiều màu | Kết xuất lại so pixel: lệch 0,15% |
| P134 (đo màu) | Histogram, waveform, vectorscope + nhận xét cháy sáng/đen kịt | Unit + Chrome |
| P138 (khử ồn) | Spectral gating, tạo clip mới | Chrome: ồn −16 dB, tiếng −0,4 dB, clip gốc nguyên |
| P140 | Biểu đồ từ CSV → SVG (cột/đường/tròn/donut), lưu vào Tài nguyên | Chrome: 4 kiểu vẽ được, tải, lưu |
| P133 (bền vững) | Kho OPFS (rơi về IndexedDB), tự lưu bản phục hồi mọi engine, banner khôi phục sau sự cố, thẻ Bộ nhớ | Chrome: OPFS 3 MB, mô phỏng crash → khôi phục |
| P133 (Worker) | Khử ồn chạy trong Web Worker, có fallback | Kết quả giống hệt luồng chính, trang không đơ |
| P144 | 15 lệnh palette mới + lệnh gần đây, Alt+Shift chuyển trang, F1 trợ giúp theo trang | Chrome 14 mục |

Nền: sửa 2 lỗi gốc làm đơ Chrome (vòng lặp MutationObserver P111, lỗi `CDN` của CVKit); Security Hub P131 và gia cố nhập SVG; quality gate + EDL P127.4/.6.

CI trên GitHub: các commit P138, P133, P144 đều chạy thành công (xanh) ở bước hosted runtime.

## Giới hạn trung thực
- Chưa thử với video/audio thật dài; đo LUFS, khử ồn, GIF mới thử bằng tín hiệu/khung tổng hợp. Chưa nghe/xem bằng mắt tai người dùng thật.
- Khử ồn KHÔNG phải RNNoise/AI: tiếng kéo dài đều bị coi là ồn; ồn thay đổi không xử lý được.
- GIF chỉ 256 màu cố định; Image Trace ra đường gấp khúc (phần mượt Bezier/pattern do AI khác làm).
- Chỉ kiểm Chromium; chưa Firefox/WebKit/cảm ứng/di động thật (P142).
- Chưa làm: proxy 720p video 4K, OffscreenCanvas, Auto Reframe, ducking/nhạc nền theo mood (phần P127.7 do AI kia), tour lần đầu, trợ giúp từng Studio, P130 (cần Supabase thật), P122.3 (cần chốt hợp đồng bảo mật), 14 cổng P70 cần nghiệm thu trên máy thật.

## Việc cho người/AI tiếp theo
Pull trước (`git pull --rebase origin main`; CI bot hay push commit build). AI kia đang giữ PR #45 (P124 Auto Layout), P143 (tách mã) và P145.6–10; không dẫm chân. Xem `CANVIO_NEXT_AI_PROMPT.md` để biết quy tắc nhúng (CRLF, không viết `</script>` thật trong mã) và lệnh chạy test.


## Tiếp tục 2026-11-21 — P134.2 Auto Reframe candidate

- Tạo branch riêng work/p134-auto-reframe-20261121 từ main 907b62b; không thay đổi PR #45.
- Thêm canvio-p134-reframe.js và Node suite tests/p127/run-p134r-tests.cjs (11 kiểm tra), Chromium/ffmpeg/ffprobe harness tests/p145/run-p134r-browser.py.
- Bản nhẹ phân tích chuyển động + cạnh/độ tương phản, chọn crop 9:16 hoặc 1:1; xuất WebM tại 720×1280 / 1080×1080. File cục bộ ≤100 MiB, ≤60 giây; không dùng face model, không gửi mạng, không thay timeline/store.
- Đã thêm bước tích hợp lot canvio-lot134r và lệnh Node/browser test vào hosted workflow. Kết quả CI/PR chưa được xác nhận trong báo cáo này.
- Chưa nghiệm thu: full-app same-origin CI, footage đời thực dài, âm thanh bằng tai người, Firefox/WebKit và mobile thật. Auto Reframe có thể bám texture/contrast không phải chủ thể.

## Consolidated continuation — P124 / P133.2 / P144.3

- Created branch work/canvio-p124-p133-p144-final-20261121 from current main after P134.2 merge and bot runtime-manifest commit.
- Carried P124 Auto Layout, P133.2 local 4K→720p proxy, and P144.3 contextual help into one candidate. Added all three source integrations to hosted workflow; Node/Chromium/ffmpeg/ffprobe tests wired.
- Updated Guide, Roadmap, All-P Tracker, Next AI Prompt, Session Summary, QA report and Acceptance Matrix. CI pending; not merged.
