# CANVIO — Real Acceptance Runbook (23.3.110, 2026-11-18)

Các mục dưới đây KHÔNG thể hoàn tất trong container offline (không DNS npm/GitHub, không GPU vật lý, không thiết bị thứ hai). Không có thư viện giả và không đánh dấu hoàn thành khống. Chạy trên máy có mạng.

## 1. Một lệnh (P74/P81, P85 runtime)
`bash scripts/run-real-acceptance.sh` (cần Node ≥ 22, Python 3, `pip install playwright && playwright install chromium`).
Script cung cấp Three.js r187 + Draco/Meshopt/KTX2 và runtime P85 (OpenCV, dotLottie, Rive, PostFX), kiểm manifest SHA-256, chạy smoke trình duyệt, ghi `evidence/real-acceptance/run-*.tsv`. Bước lỗi = FAIL, bước cần người/phần cứng = NOT_RUN.
Sau đó: thêm fixture Draco/Meshopt/KTX2 thật vào P74 (smoke hiện chỉ cover GLB không nén).

## 2. Inference AI (P80/P102/P105) — mở bằng http://localhost hoặc https
- P102 ORMBG: ảnh chân dung / sản phẩm / thú cưng / kính / tóc phức tạp → kiểm RGBA, kích thước, viền, huỷ, unload worker, RAM.
- P105 Depth Anything: trong nhà / ngoài trời / chân dung / sản phẩm → kiểm `output.depth`, chuẩn hoá, hướng depth, halo/lỗ, huỷ, unload. Thử WebGPU fp16 và WASM fallback.
- P80 Whisper: một clip có tiếng, kiểm transcript và căn thời gian từ.

## 3. P106 GPU vật lý
Mở `chrome://gpu`: renderer KHÔNG được là SwiftShader/ANGLE-software. Chạy depth-parallax WebGL, xuất WebM, kiểm hoạt ảnh thay đổi khung hình. Ghi GPU, driver, trình duyệt.

## 4. P107 hai thiết bị + Project Vault
Thiết bị A: tạo preset + dự án, xuất ZIP portable (v2). Thiết bị B (profile trình duyệt sạch): nhập ZIP → kiểm kích thước nguồn/depth, strength, CRC. Khởi động lại trình duyệt, kiểm Project Vault/IndexedDB còn dữ liệu. Không có đồng bộ cloud: chuyển bằng file ZIP.

## 5. P70 — 14 cổng
Giữ OPEN, `releaseCertified:false` cho tới khi đính kèm bằng chứng thật (HTTPS + CSP/MIME worker, Safari/Edge, WCAG, A/V sync, xuất dài, in ấn, backup/restore, rollback). Chi tiết: `CANVIO_FINAL_ACCEPTANCE_MATRIX.md`.
