# CANVIO — Roadmap trạng thái tích hợp (P70 baseline + 23.3.111 continuation; 2026-11-21)

> Tài liệu này giữ nguyên trạng thái nền P70 và lịch sử nghiệm thu. Các cập nhật mới hơn nằm trong phần continuation ở cuối file (hiện tới 23.3.111/P125.4 và P145.6–P145.10). “Đã tích hợp” mô tả code path hiện diện; không thay thế nghiệm thu dự án thật, media thật, provider thật hoặc production. Không mở rộng feature giả để làm đẹp checklist.

## Tổng quan

- **P70 baseline:** `index.html` — `23.3.84-p70` application marker; PhaseSuite `70.0.0` (P68–P70 final milestone implementation on P67).
- **Latest hosted continuation:** `23.3.111-github-runtime-ci`; P125.4 and P145.6–P145.10 are merged to `main`; their hosted verification and limits are recorded in the continuation section below.
- **SHA-256:** See `CANVIO_MANIFEST.json` for final P70 source and package hashes.
- **Trạng thái phát hành:** P70 (`23.3.84-p70`) is integrated on GitHub `main` and the GitHub Pages deployment completed successfully. P47–P70 source/regression/Chromium synthetic smoke pass; fourteen real-world acceptance gates remain OPEN. It remains a Stable Release Candidate, not CANVIO 1.0 Stable or production-certified.
- **Nguyên tắc:** một canonical Video Engine timeline, một Asset Library, một Project Vault, một Unified Layers history owner; không cloud giả, không API key nhúng trong source, không request nền.

| Giai đoạn | Trạng thái P70 | Tóm tắt |
|---|---|---|
| 1 · Nền tảng tin cậy | **P57–P62 đã tích hợp; cần nghiệm thu thật** | Native persistence audit/sentinel, export media acceptance, Whisper safeguards, accessibility triage, hosting/security checks và fail-closed RC gate; không thay đổi các data owner hiện hữu |
| 2 · Video | **P63–P65 đã tích hợp trên candidate; vẫn cần nghiệm thu thật** | Canonical timeline contract và explicit bridge; ripple/group/move/duplicate/snap; local SAD tracker và stabilization keyframes. MotionCut live sync, footage quality và project round-trip chưa certified |
| 3 · Design | **P66–P67 tích hợp một phần** | AI prompt→Asset Library/SVG layer; Layout Foundry master, CSS typography, print preflight/HTML. Font embedding, physical bleed, PDF/X/CMYK còn mở |
| 4 · Motion & Web | **P47 foundations + P68 offline OBJ profile** | Website Motion/reduced-motion retained; P68 exports a geometry-only single-file OBJ viewer. Website 3D runtime and GLTF/FBX remain open |
| 5 · AI | **P66 workflow candidate** | Prompt builder + user-selected asset ingestion; provider execution vẫn explicit và do người dùng vận hành, chưa có automatic generation trong module |
| 6 · Asset & Production | **Backup ZIP tích hợp; nghiệm thu dữ liệu còn mở** | SHA/CRC, localStorage + IndexedDB schema, credential exclusion; third-party compressed ZIP và restore IDB thật chưa chứng nhận |

## Giai đoạn 1 — Nền tảng tin cậy

### Đã tích hợp
- P44: Project Vault pin snapshot có tên, giữ tối đa 20 pinned versions/workspace cùng rolling autosave, restore/delete và restore point. Reuse store cũ.
- P46: `webEngine` và `portfolioStudio` có adapter trong `CVUnifiedLayers`; Project Vault hook theo các mutator của hai module.
- P46: MotionCut có nút chuyển media gốc vào `CV.engines.video.importFiles()`. Video Engine vẫn là timeline chuẩn; mapping source theo imported Blob/media ID nhằm tránh lệch khi file bị từ chối.

### Còn mở
- Kiểm tra native IndexedDB trên Chrome origin thật (save → reload → close/reopen), nhất là Portfolio gallery Blob và website markup/CSS.
- MotionCut và Video Engine chưa dùng chung một state model/timeline editor; P46 chỉ handoff clip vào timeline chính.
- Kiểm tra export file thật, không chỉ API/button.

## Giai đoạn 2 — Video

### P47 addition
- Video Engine inspector has editable cubic-bezier X1/Y1/X2/Y2 fields and a live curve preview. X values are clamped/validated to [0,1], Y to [-2,2].
- `vMotionEase` returns exact endpoint values at progress 0 and 1 before bisection. Extracted-source math tests cover endpoints and invalid X rejection.

### P48 addition
- Four track lanes now expose Hide/Show and Lock/Unlock; Audio exposes Mute/Unmute. Track settings are sanitized and persisted in the existing timeline store and canonical snapshot/restore path.
- Effective track lock protects clip edits, media import/relink, Audio Studio/Mixer operations and Unified Layers mutation. Track visibility affects preview output; hidden/muted audio is excluded from export and blocked in Audio Studio preview.
- Added WebVTT import/export alongside existing SRT. Parser validates WEBVTT header/timestamps, supports cue IDs/settings and multiline payload, caps import at 2 MB, requires an unlocked text track and creates an Undo checkpoint. Export escapes cue text (`&`, `<`, `>`) before writing.
- This is subtitle interchange, **not** Whisper/ASR speech recognition.

### Đã có trong base và được giữ lại
- Timeline nhiều track, media video/ảnh/audio/text; media records dùng IndexedDB hiện hữu.
- Split, transition/crossfade, undo/redo, audio operations, SRT import/export, EDL export và WebM export.
- Keyframe interpolation, multi-keyframe color interpolation và continuity test cho split animation.

### Còn mở / không tuyên bố đã làm
- Whisper WASM auto captions và model/license/package validation.
- Point tracking, motion tracking/stabilization và chroma key production-ready nếu engine hiện tại không cung cấp code path được xác minh.
- MP4/H.264/WebCodecs muxing; P46 không thêm muxer hoặc chứng minh MP4 export.
- Track grouping, full ripple editing, track lock/visibility semantics và keyframe graph UX cần nghiệm thu trong engine.
- Export real-world media (MIME, duration, decode, A/V sync, long files, memory).

## Giai đoạn 3 — Design

### P47 addition
- Vector Forge typography inspector now exposes font-weight presets (300–900), tracking (−4–40 px) and text anchor (start/middle/end) for ordinary SVG text and nested SVG `textPath`.
- It does not constitute advanced kerning, font shaping or license verification.

### Đã tích hợp / được giữ
- P46 thêm SVG text-on-path bằng `textPath` + SVG path, vẫn chỉnh sửa được nội dung chữ.
- Giữ Layout Foundry, multi-page/print structure, Brand Kit và Asset Library metadata hiện có.

### Còn mở
- Kerning/tracking controls chuyên sâu, master-page/bleed preflight sign-off, search/tag template workflow và one-click Brand Kit consistency cần test end-to-end.
- Font/icon/image license values là metadata, không phải bằng chứng pháp lý. Xác minh license/attribution trước khi phát hành thương mại.
- In thử PDF/print output ở kích thước thật.

## Giai đoạn 4 — Motion & Web

### P47 addition
- Website Motion Builder now persists an easing preset per selected GrapesJS component and exports it through `--canvio-motion-easing`; the runtime retains reduced-motion behavior.
- It is a preset selector, not a shared graph editor.

### Đã tích hợp
- P46 thêm Website Motion Builder cho component đang chọn: fade, slide-up, slide-left, scale-in; thời lượng/trễ có giới hạn.
- Export wrapper inject runtime dùng IntersectionObserver; có `prefers-reduced-motion` và progressive enhancement (không ẩn content nếu JS/IO không hoạt động).

### Còn mở
- Easing editor dạng graph chia sẻ giữa Website Engine và Video Engine.
- Self-contained 3D export/offline; cần đóng gói asset/dependency thực thay vì trông chờ CDN.
- Kiểm tra output thật trên Chrome/Safari, keyboard/reduced-motion, CSP, MIME, assets, deep links và P30/P31 trên staging/public origin.

## Giai đoạn 5 — AI

### Đã tích hợp
- Gemini tiếp tục dùng `GeminiAPI.call()` hiện tại.
- P46 thêm direct user-triggered adapter cho OpenAI-compatible Chat Completions, Anthropic Messages, custom OpenAI-compatible endpoint và local Ollama/LM Studio style endpoint.
- API key của các adapter bổ sung chỉ đọc từ `sessionStorage`; request direct, CORS-dependent, HTTPS-only trừ localhost, timeout 30 giây, không có proxy/background request.

### Còn mở
- Actual API/CORS verification với tài khoản/provider do chủ repo cấu hình.
- Image generation, generated asset ingestion, model capability negotiation, provider quotas and safe output review.
- Full brief → prompt → model → asset → editor handoff. Không gắn nhãn tính năng “AI đã chạy” chỉ vì endpoint có thể cấu hình.

## Giai đoạn 6 — Asset & Production nâng cao

### Đã tích hợp
- P46 thêm portable ZIP export với `manifest.json`, integrity-sealed `full-backup.json` và restore README.
- Snapshot CANVIO-prefixed localStorage và CANVIO-prefixed IndexedDB databases/stores; schema có keyPath, autoIncrement và indexes.
- Blob/Date/typed bytes encoding; loại sessionStorage và credential-shaped keys khỏi backup.
- Restore kiểm local header, chỉ ZIP store method, CRC32, SHA-256 và yêu cầu xác nhận; chỉ restore namespace CANVIO. Existing DB mở không ép version bump; schema mismatch bị bỏ qua và báo warning.

### Còn mở
- Kiểm chứng native IndexedDB export/import trên cùng origin và origin mới với workspace/media thật; quota, blocked DB, record >80 MB và schema drift.
- ZIP reader chưa nhận mọi định dạng ZIP nén từ bên thứ ba; chỉ hỗ trợ stored ZIP do `CVZip.build()` tạo.
- Batch export presets và license-aware asset operations cần nghiệm thu theo file thật.

## Release gates bắt buộc

1. Chrome thật trên HTTP(S) origin: không `pageerror`, không lỗi boot; P19/P37–P42 tests, Unified Layers và Project Vault tests đạt.
2. Save/restore user project qua reload và browser restart; kiểm tra cả Web, Portfolio, Video và media Blobs.
3. Real file export/import and playback: MIME, file size, duration, decode, A/V sync.
4. API provider real request, CORS, rate limit, credential handling, không lộ key trong report/backup.
5. Accessibility: keyboard-only, screen reader, true 200% zoom; P19/P40 heuristic không thay thế WCAG audit.
6. P30/P31 live website, HTTPS/TLS, redirects, assets, CSP/MIME/CORS.
7. Đối chiếu workflow SHA P47; chỉ merge/deploy sau khi toàn bộ release gates được ký nhận.

## Ngoài phạm vi

Không giả lập real-time collaboration, cloud persistence, provider proxy hoặc đồng bộ hai chiều Canva/Figma/Google Slides khi không có backend/API và mô hình đồng bộ thật.


## P47 verification update
- Candidate SHA-256: `3dde04dda166f411b9f4391176f4a1c42cbc26f1a0735143c7b65fbb62c42e10`; size 4,223,396 bytes; 21,325 lines.
- Static checks: 80/80 inline scripts pass; 490/490 IDs unique; zero duplicate IDs; zero external script `src`.
- Isolated P47 VM harness: 17/17 assertions true (owner stubs; not full app runtime).
- Extracted cubic-bezier math tests: six assertions pass, including exact endpoints and invalid X rejection.
- Direct/ZIP restore fixture passes in mock storage; CRC corruption rejected before mutation.
- Browser attempt blocked before boot by `ERR_BLOCKED_BY_ADMINISTRATOR`; real-origin runtime and external acceptance remain OPEN.

## P47 remaining acceptance
- Validate typography controls and textPath editing/exports on real Chrome with real installed fonts.
- Validate custom Video Engine curves through multi-keyframe editing, split/undo/redo, save/reopen and real media export.
- Validate Website Motion export in Chrome/Safari and prefers-reduced-motion on actual pages.
- Keep Whisper WASM, point tracking/stabilization, MP4/H.264, fully unified native timeline, full AI image workflow, offline 3D packaging, comprehensive font/license/print preflight and browser-native persistence as OPEN until built/tested.


## P48 verification update
- Candidate SHA-256: `6dc2eb3f18be18e567d955ee90a59f478c756de4146fa11aa5dc9832a47b2039`; size 4,234,342 bytes; 21,341 lines.
- Static audit: 80/80 inline scripts pass, 490/490 unique IDs, no duplicate IDs, no external script `src`.
- P48 track/WebVTT source harness: 26/26 assertions pass.
- P47 bezier and portable backup/restore/CRC fixtures still pass against P48.
- Chromium full-app launch is still blocked before app boot in this execution environment; no real-browser runtime PASS is claimed.

## P48 remaining acceptance
- Verify track hide/lock/mute behavior through actual Video Engine edit flows, Project Vault save/reopen and Unified Layers in ordinary Chrome.
- Verify WebVTT import/export in Chrome, cue styling and round-trip with external subtitle editors.
- Verify audio mute affects WebM output and Audio Studio preview with actual media.
- Keep Whisper WASM, point tracking/stabilization, MP4/H.264 muxing, fully unified native timeline, complete AI image workflow and offline 3D packaging OPEN until built/tested.


## P49 — Video Production & AI Caption (2026-11-16)

### Đã tích hợp trong source

- **MP4/H.264 capability-aware export:** canonical Video Engine dò các MIME AVC candidates bằng `MediaRecorder.isTypeSupported()`. Chỉ hiển thị đường MP4/H.264 khi browser xác nhận AVC; sau render còn kiểm tra MIME thực tế trước khi lưu, không đặt đuôi MP4 cho blob WebM/không rõ codec. WebM vẫn là fallback. Đây là native MediaRecorder path, không phải FFmpeg muxer và không ép trình duyệt hỗ trợ codec mà nó không có.
- **Subtitle QC:** nút `✓ QC phụ đề` rà cấu trúc cue, cue trống, time range, overlap, thời lượng gợi ý, tốc độ ký tự/giây và độ dài dòng. Cảnh báo mang tính heuristic để editor rà lại, không thay thế tiêu chuẩn broadcast.
- **Whisper ASR:** `Whisper AI` cho phép người dùng chọn audio, chọn tiếng Việt/Anh/tự nhận dạng và tạo cue timestamp vào track chữ canonical. Audio được giải mã/resample 16 kHz trong browser, chuyển cho module worker chạy Transformers.js `3.8.1` với model `Xenova/whisper-tiny` q8 trên CPU/WASM mặc định. File giới hạn 100 MB, duration tối đa 8 phút mỗi lượt.
- Worker asset `assets/canvio-whisper-worker.js` được đóng gói riêng, không phải inline script. Request runtime/model chỉ diễn ra sau thao tác người dùng; audio không được gửi tới API ASR hosted trong code path này. Lần đầu cần network để lấy runtime/model; browser cache là best-effort, không khẳng định offline first-run.
- Cue tạo tự động có timestamp, được thêm vào track 3, tạo undo point, save/render và phải được người dùng rà lại. Không có diarization hoặc bảo đảm chính tả/độ chính xác.

### Kiểm thử P49

- P49 isolated Node VM harness: **35/35** assertions pass.
- P48 track/WebVTT harness: **26/26** assertions pass.
- P47 cubic-bezier + integration + backup/restore + CRC fixtures pass.
- Static audit: 80 inline JS blocks, 490 unique IDs, zero external script src; worker JS syntax is checked separately.
- CI packages both `index.html` and `assets/canvio-whisper-worker.js`, and P49 runs the P47/P48/P49 regression suites. Workflow SHA gate is tied to the exact candidate hash in this release package.

### Còn mở trước production

- Run in ordinary Chrome/Safari/Edge over HTTPS: validate worker module/CORS, CDN runtime import, model download/cache, inference result, memory use, repeat cached run and browser offline behavior.
- Validate native MP4/H.264 on a browser which reports the AVC MIME supported; real recording may still fail under constraints, so test actual blob MIME, decode, duration, audio, A/V sync and memory. Confirm unsupported browsers stay on WebM.
- Test Whisper with real Vietnamese and English clips, proper nouns/noise/music, cue timestamps and repeated operations. Verify stop/unload, large audio and failure recovery.
- Run external SRT/WebVTT round-trip, native IndexedDB save/reopen, real-origin P30/P31, keyboard/screen-reader and 200% zoom.
- Tracking/stabilization, unified MotionCut+Video Engine model, full edit/ripple/group semantics, complete AI image→asset path, advanced kerning/print and offline 3D export remain open.

**Release disposition:** P49 local candidate with static/source-level tests passing. Not merged, not deployed and not production-certified because full browser/media/model acceptance is blocked in this environment.


## P50 — Production Controls & Resource Lifecycle (2026-11-16)

### Đã tích hợp trong source

- **Render cancellation:** thêm `Hủy render` trong Video Engine. Chỉ một render được chạy tại một thời điểm; nút hủy gọi trực tiếp stop handler đang hoạt động. Cleanup khôi phục playhead, dừng audio/stream tracks, hủy animation frame và vô hiệu hóa nút sau khi recorder settle. `exportWebM`/`exportMP4` UI wrappers xử lý Promise rejection để thao tác hủy không phát sinh unhandled rejection do click handler.
- **Whisper cancellation:** `Hủy Whisper` tăng job token, terminate module worker, reject/clear request đang chờ và bảo đảm kết quả trả về muộn không được ghi vào timeline. Hủy trong giai đoạn AudioContext decode là cooperative; decode hiện tại có thể hoàn tất rồi mới dừng trước bước inference/tạo cue.
- **Model unload:** `Giải phóng model` terminate worker, giải phóng pipeline/model trong memory và clear pending work. Browser HTTP cache có thể vẫn giữ model asset đã tải; nút này không xóa browser cache.
- **Watchdog:** inference worker có timeout 15 phút; khi timeout, worker bị terminate và lỗi hướng dẫn retry được trả về.
- API bổ sung trên canonical Video Engine: `cancelExport`, `whisperCancel`; `whisperUnload` được giữ và nối với control cập nhật trạng thái. `CANVIOPhaseSuite.tests()` thêm `videoWhisperCancellation` và `videoExportCancellation`.

### P50 validation

- P50 source VM harness: **27/27 assertions** pass, gồm worker cancellation, job-token invalidation, pending rejection, worker URL/module loading, ArrayBuffer transfer, 15-minute watchdog, export cancel callback, single-render guard, UI wiring và candidate marker.
- P49 source harness: 35/35; P48: 26/26; P47 integration, bezier, restore and CRC fixtures pass.
- Static audit after P50: 80/80 inline scripts pass `node --check`; 493/493 IDs are unique; zero duplicate IDs; zero external script `src`; Whisper worker syntax passes.
- These fixtures verify source-level state transitions with stubs. They do not prove native `MediaRecorder.stop()` latency, real browser codec finalization, AudioContext cancellation, GPU/RAM reclamation, model accuracy, or browser page runtime.

### P50 remaining acceptance

- Real browser: cancel WebM/MP4 export at multiple progress points; confirm no file is saved, track/playhead returns to previous time, audio/stream tracks stop, a new export can start after cancellation and no late `dataavailable` chunk creates output.
- Real browser: cancel Whisper during decode, first runtime/model download, inference and post-result boundary; confirm no partial caption clips, retry works, unload reduces memory pressure and cached assets are not misreported as deleted.
- Run Chrome/Edge/Safari HTTPS, native IndexedDB, WebVTT external round-trip, real A/V decode/sync, accessibility and public-origin P30/P31 acceptance.

**Release disposition:** P55 local candidate. Chromium smoke now executes the application through `page.set_content()` on opaque `about:blank`; URL navigation/native storage remain blocked by the host policy. No commit, PR, merge or deployment was performed.


## P51 — Runtime/media diagnostics (2026-11-16)

- Added `CANVIORuntimeDiagnostics.collect()` for secure-context/API/media capability observations. WebM and AVC/H.264 are checked independently; MP4 is optional and not used as a pass/fail requirement when WebM exists.
- Added read-only StorageManager estimate and a user-triggered diagnostics panel in Video Engine. No hidden network probe or project mutation.
- **Still open:** actual codec/container render, decode, playback, A/V sync, module worker and browser-origin behavior.

## P52 — Render recovery (2026-11-16)

- Added a compact session recovery ledger for existing Video Engine WebM/MP4 export wrappers. It records status, format, timestamps, elapsed time and bytes, but no source media, file names, timeline or credentials.
- Detects a stale running/cancelling render after reload as interrupted; pagehide requests `cancelExport`. It does not resume a render after navigation.
- **Still open:** crash/termination/cancel timing on real Chrome/Edge/Safari; verify no partial output and a new export works after cancellation.

## P53 — Project backup/restore preflight (2026-11-16)

- Added a read-only backup audit and ZIP preflight for non-empty file, ZIP signature and a 512 MiB in-memory limit before the existing CRC/SHA parser and restore confirmation.
- Does not broaden the ZIP reader to arbitrary compressed archives and does not expose key values.
- **Still open:** IndexedDB save/reopen, Blob-heavy export, restore on same/fresh origin, blocked transactions and quota failure on native browser storage.

## P54 — Large-timeline resource budget (2026-11-16)

- Added clip-type/track counts, timeline duration, invalid-entry count, canvas backing-store estimate and best-effort deviceMemory/heap details. Threshold warnings are advisory and do not mutate the project.
- **Still open:** actual memory/CPU benchmarks on low-memory devices and long-form video projects; the report does not estimate opaque media Blob residency.

## P55 — Unified Stable Release Readiness (2026-11-16)

- Added `CANVIOReleaseGate.run()` and a Video Engine **🧪 Kiểm tra P55** panel with JSON export. It consolidates runtime, storage, project/timeline and PhaseSuite evidence.
- Status is `BLOCKED` or `NEEDS_MANUAL_ACCEPTANCE`; `releaseCertified` stays false and six browser/real-media/Whisper/data/accessibility/hosting acceptance gates remain explicitly pending.
- P55 source harness: **49/49**; P50 27/27; P49 35/35; P48 26/26; P47 fixtures pass. Static audit: 81 inline scripts pass syntax, 494 static IDs are unique and no external script `src`. Chromium smoke: **24/24** checks passed on Chromium 144.0.7559.96, including synthetic WebM/MP4 encode+decode, cancellation/retry and responsive widths.

**P55 disposition:** local release-readiness candidate, not CANVIO 1.0 Stable. The smoke uses an opaque `about:blank` origin with in-memory storage shims; it cannot certify HTTPS, native IndexedDB, real Whisper, real user-media A/V sync, accessibility or deployed hosting. Complete all six manual gates before production approval; continue to P56+ if any critical issue is found.


### P55 runtime smoke follow-up — 2026-11-16

- Chromium `144.0.7559.96` now boots the actual app source through Playwright `set_content()`. The test confirms P55 title stability (including the inherited P42 MutationObserver), nine SPA routes, all P47–P55 PhaseSuite flags, unique runtime IDs, track visibility, WebVTT, synthetic WebM/VP9 + MP4/H.264 render and browser decode, render cancel/retry, and narrow viewport no-overflow.
- Browser smoke: **24/24 PASS**, zero uncaught page errors, zero console errors after external font requests are stubbed. Evidence: `tests/p55/browser-smoke-report.json`.
- Origin limitations remain: host navigation policy blocks `file://` and localhost, so the browser test runs on opaque `about:blank` with a test-only local/sessionStorage shim. Native IndexedDB, secure context, deployed worker/model access, Whisper inference, real media A/V sync, accessibility and hosting remain pending.
- GitHub Actions has a pinned Playwright/Chromium smoke step. Local workflow YAML parses; a hosted Actions run remains unobserved.


## P56 — Portable archive integrity and safe restore (2026-11-17)

### Đã tích hợp
- Read-only validator `window.CANVIOArchivePreflight.inspect(file)` runs before the existing P53 signature/size preflight, legacy ZIP parser and restore path. It validates the EOCD, single-disk count, Central Directory bounds/size, stored-only method, flags, safe unique paths, local-header agreement, offsets and contiguous local records.
- Keeps the existing `CVZip.build()` writer, `readStoreZip()` parser, per-entry CRC32 check, `CV11.backupIntegrity.verify()` SHA-256 check and data owners unchanged. This is a strict CANVIO-format preflight, not general ZIP support.
- The existing restore confirmation displays a read-only summary of backup date, eligible CANVIO localStorage key count, IndexedDB database/store/record counts, excluded-secret count, warning count, checksum and ZIP structural evidence. It does not display project values or secrets. Cancel leaves storage unchanged.
- P56 adds no database/object store, no second timeline and no background service.

### Kiểm chứng
- P56 VM suite: 27/27; Chromium smoke: 27/27; P55 release/diagnostic VM: 49/49; P48/P49/P50 suites retained.
- Real Chromium validates a generated `CVZip.build()` archive, rejects tampered Central Directory CRC metadata and confirms preview secrecy/storage immutability. The smoke origin is opaque `about:blank`, so it is not native IndexedDB or HTTPS acceptance.

### Còn mở
- Native IndexedDB save/restore and quota/blocked-database behavior; real-media A/V sync and cross-browser export; real Whisper inference/cancel/unload; keyboard/screen-reader/true 200% zoom; Pages/HTTPS/CSP/CORS and post-deploy checks. P56 is not CANVIO 1.0 Stable.


## P57–P62 — Chặng 1: Platform Reliability & Release Candidate (2026-11-17)

### P57 · Native Persistence & Project Recovery diagnostics
- Added explicit read-only audit of the existing `CANVIO_81_MEDIA` database/store, record count, quota estimate and persistent-storage status.
- Added explicit temporary Blob add/read/delete round-trip using a unique sentinel ID. It refuses to create a missing database or upgrade schema; no user media record is overwritten.
- `navigator.storage.persist()` is called only after an explicit user action. Grant status is reported, not treated as backup.

### P58 · Professional Media Export acceptance
- Added user-selected MP4/WebM metadata and local browser `canplay` decode-readiness check; validates MIME/extension consistency, duration and dimensions, then revokes the object URL.
- Does not upload/store the selected file and does not claim full file integrity, A/V sync or cross-browser acceptance. Existing engine export path remains authoritative.

### P59 · Whisper AI production safeguards
- Added same-origin worker provenance check (user-triggered, no model download/inference) and hard limits in worker: 8-minute 16 kHz maximum, language allowlist, ArrayBuffer validation and response-shape validation.
- Existing Whisper model/runtime is still downloaded on first use; real Vietnamese/English model inference remains OPEN.

### P60 · Accessibility screening
- Added DOM screening for accessible names, image alt, landmarks, headings and dialog names. It is read-only and bounded to 200 findings.
- WCAG, screen reader, keyboard-only and true 200% zoom are still OPEN.

### P61 · Hosting & Security
- Added origin/secure-context, same-origin worker URL, external script and mixed-content screening. Server HTTP headers cannot be proven from DOM; require deployed inspection.
- Pages deploy workflow is push-to-main only; PR and manual dispatch validate without deploying.

### P62 · Phase 1 Release Candidate Gate
- Added aggregate report and dashboard. It always reports `releaseCertified:false` while six manual gates remain open.
- Candidate marker: `23.3.76-p62`, base `23.3.70-p56`, PhaseSuite `62.0.0`.

### Chặng 1 evidence
- P57–P62 source VM suite: 15/15 assertions.
- P47–P56 regression suites plus P57–P62 source VM and Chromium smoke run against the P62 artifact.
- P62 Chromium smoke: 32/32 checks on a synthetic/opaque origin; P60 DOM triage reports 32 review candidates; manual gates (HTTPS matrix, real media A/V sync, Whisper inference, native data round-trip, accessibility, hosting/CSP/CORS) remain OPEN. P62 is not CANVIO 1.0 Stable.


## P63–P67 — Chặng 2: Creative Production Expansion (2026-11-17)

### P63 · Unified Timeline Contract
- `window.CANVIOUnifiedTimeline` inspects and validates `CV.engines.video._state()` as the canonical Video Engine timeline. It reuses existing MotionCut and Shape Animation bridge APIs for explicit transfer/import.
- MotionCut and Motion Lab continue to own their editor-local working state until a user explicitly transfers or renders/imports content. This is not transparent live synchronization or a full shared editor model. No second timeline or persistent store is added.

### P64 · Advanced Timeline Editing
- Canonical ripple-delete planner/execution, persistent clip group metadata, move/duplicate group and edge snapping. Mutations commit through the Video Engine owner.
- Ripple preflight blocks if a locked clip/track would be affected. Real undo/redo, transitions, trims and project round-trip remain manual acceptance.

### P65 · Motion Tracking & Stabilization
- Local grayscale patch matching using SAD and a uniqueness/confidence check; rejects flat or ambiguous regions rather than reporting false tracking success.
- Applies bounded transform keyframes to the selected unlocked canonical clip. Uses user-selected local media up to 100 MB/60 seconds; no remote model/network. It is heuristic point tracking, not AI object tracking.

### P66 · AI Creative Asset Workflow
- Builds structured prompts locally from the user's brief; imports user-selected images/SVG into the existing Asset Library with provenance/license metadata. Provider calls remain explicit through existing adapters and no API key is stored in this workflow.
- SVG active markup, external references and handlers are filtered; Vector Forge receives an actual SVG image layer. Provider quality, rights and commercial license still require review.

### P67 · Design & Print Production
- Layout Foundry master header/footer/folio, browser CSS typography controls and print preflight for page dimensions, safe margin/bleed metadata, alt text, unsafe URLs, scripts and active embeds.
- Print output is sanitized HTML, not PDF/X or CMYK. Browser fonts are not embedded/outlined; physical bleed/crop marks and press-ready pagination are not certified.

### P63–P67 verification
- Source VM suite: **18/18**. Chromium 144.0.7559.96 smoke: **43/43**. Static audit: 90/90 inline scripts parse, 503/503 static IDs unique, zero duplicates/external script `src`.
- Smoke uses opaque `about:blank` and in-memory storage shims; real project, device, provider, font, printer and production-origin acceptance remains OPEN. See `CANVIO_QA_REPORT.md`.
- Local candidate only; no P67 commit, PR, merge, hosted Actions run or deployment is claimed.


## P68–P70 — Chặng 3: Offline Production, Optimization & CANVIO 1.0 Candidate (2026-11-17)

### P68 · Offline 3D Packaging
- `CANVIOOffline3D` parses Wavefront OBJ geometry under explicit limits (5 MiB source, 100k vertices, 12k triangles), validates/triangulates faces, normalizes bounds and emits a single HTML with embedded mesh data.
- The viewer uses an inline Canvas 2D mesh projection with drag orbit, wheel zoom, reset and wireframe controls. The HTML has CSP `connect-src 'none'` and no external scripts/styles/runtime/network APIs.
- Scope is intentionally bounded: geometry-only OBJ. MTL/material/texture, GLB/GLTF, FBX, STL, rigged animation, live Three.js website scenes and full 3D editor projects are not packaged.

### P69 · System Health & Performance Budget
- Read-only bounded scan records DOM nodes, Canvas backing-store bytes, decoded image/video surface estimates, active media and Resource Timing totals when exposed.
- User-triggered frame sampler reports average/median frame intervals and >33 ms / >50 ms counts. Recommendations are advisory only. No automatic cache deletion, media compression or project mutation.

### P70 · CANVIO 1.0 Stable Candidate Gate
- Aggregates availability of Phase 1/2/3 implementations and defines fourteen real-world acceptance gates. The summary does not trigger the asynchronous P62 media/timeline probe.
- Report status is `BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE`; `releaseCertified:false` is immutable in this candidate. P70 does not self-certify or deploy.

### P68–P70 verification
- P68–P70 source VM: **16/16**; P68–P70 Chromium: **16/16**; inherited P63–P67 Chromium regression on P70 build: **43/43**.
- Full regression: P48 26/26; P49 35/35; P50 27/27; P55 49/49; P56 27/27; P57–P62 15/15; P63–P67 18/18. P47 fixtures pass.
- Static audit: **91/91** inline scripts parse; **504/504** static IDs unique; zero duplicates; zero external script `src`.
- Smoke uses `about:blank` and storage shims. Clean-machine offline, native persistence, HTTPS/browser matrix, A/V sync, real Whisper, accessibility, provider/license, print and hosting gates remain OPEN.

**Final disposition:** P70 is a local CANVIO 1.0 Stable Release Candidate only. Do not label production Stable until all fourteen gate evidence items are reviewed and attached. No GitHub commit, PR, merge, hosted Actions run or deployment is claimed.


## Previous hosted verification — run #46 (2026-11-17)

- Node.js 24 workflow [#46](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44104323930): validation/package and Pages deployment jobs both completed successfully; all listed validation steps passed.
- Candidate workflow head: `d14096255e16dfad4ce70260914c837f4bd7dd5c`. Current `main` head after promotion: [`3e6be7e`](https://github.com/tovannghia27223-png/CANVIO/commit/3e6be7e2653a1f5d999ece355236a6bf4e8738e5).
- GitHub Pages [#91](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44104556386) completed successfully for current `main`.
- P47–P70 automated tests and Chromium smoke suites remain green. Fourteen manual acceptance gates remain OPEN; this refresh does not change the P70 release disposition.


## Latest hosted verification — run #47 (2026-11-17)

- Node.js 24 workflow [#47](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44110607967): validation/package and deployment jobs succeeded; all listed steps passed.
- Workflow-validated commit: `0217c253b36a145b979397cafa785fdd5232ec3d`. Current promoted `main`: [`93d4840`](https://github.com/tovannghia27223-png/CANVIO/commit/93d484037ca8a00f49cd07e44e702f03964e0b4e).
- Pages [#92](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44110606281) and final promoted deployment [#93](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44110828590) succeeded.
- P47–P70 automated suites and Chromium smokes remain green. Fourteen real-world release gates remain OPEN; the RC disposition is unchanged.


## Latest hosted verification — run #50 (2026-11-17)

- Workflow [#50](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44113215411) and Pages deployment [#98](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44113545232) completed successfully.
- P47–P70 automated regression suites passed; Chromium: P63–P67 43/43, P68–P70 16/16. Manifest: 57/57 file hashes and byte counts verified.
- Generated browser smoke reports are uploaded as run artifacts, not committed to `main`. Only the manifest is committed when checksums of tracked files change.
- Fourteen manual production gates remain OPEN. P70 stays a Stable Release Candidate.


## Báo cáo tích hợp Slideshow / Depth AI / 2.5D / Preset — 2026-11-18

Phạm vi: nhánh ứng viên `canvio/23-3-111-github-runtime-ci`; không thay thế trạng thái production/main.

| Hạng mục | Tích hợp trong mã nguồn | Kiểm thử đã xác nhận | Trạng thái / giới hạn |
|---|---|---|---|
| Slideshow / Ken Burns (P104) | Chọn ảnh từ Asset Library; tạo clip ảnh trong Video Engine canonical; keyframe zoom/pan có seed ổn định; fade; một lần Undo; giới hạn 24 ảnh, 5 MiB/ảnh, 40 MiB/lượt. | Có 16 local assertions trong `CANVIOKenBurnsSuite.tests()`; chưa có kết quả chạy riêng trong hosted browser ở run này. | Đã tích hợp mã. Chuyển động là 2D; GIF dùng frame đầu; khung xuất hiện khóa 16:9; chưa xác nhận nghiệm thu với media/dự án thực. |
| P105 Depth Anything AI | Worker riêng `assets/canvio-depth-worker.js`; Depth Anything V2 Small ONNX; user-triggered; backend WebGPU → WASM q8; runtime Transformers.js/ONNX WASM self-hosted; giới hạn ảnh 1 MP; ghi ảnh nguồn và depth map vào Asset Library. | Source-contract P105/P102 worker check PASS trong hosted run #45. Hosted browser real ONNX inference đang được chạy lại ở run #46. | Đã tích hợp mã; chưa kết luận inference thực tế cho đến khi run #46 hoàn tất. Model weights được tải khi người dùng chủ động bấm chạy; không tự tải lúc boot. |
| P106 2.5D Parallax | WebGL depth-displacement shader dùng ảnh nguồn + depth map; preview, điều chỉnh strength/duration, xuất WebM vào Video Engine; fallback Ken Burns 2D khi WebGL không sẵn sàng. | Source-contract tích hợp PASS trong run #45. | Đã tích hợp mã. Software WebGL/SwiftShader không chứng minh GPU vật lý; chưa nghiệm thu trên thiết bị/GPU mục tiêu. Fallback 2D không được ghi nhận là 2.5D. |
| P107 Asset Preset / chuyển preset | ZIP portable gồm đúng `manifest.json`, `source.png`, `depth.png`; kiểm tra CRC32, PNG chunks/dimensions, ZIP STORE, path traversal/encryption/extra entries; import vào Asset Library hiện có; rollback asset mới nếu ghi asset thứ hai thất bại. | Hosted Node round-trip PASS 6/6 trong run #45: parse ZIP, giữ strength=0, dimensions độc lập, reject ZIP sai, import Asset Library, rollback khi lỗi ghi. | Portable file transfer đã kiểm thử. Không có cloud sync/Project Vault server sync; chuyển sang thiết bị khác bằng xuất ZIP rồi nhập thủ công. |

### Bằng chứng hosted gần nhất

- Run #45: [GitHub Actions](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44306334901) — P47–P70 regression PASS; integrated source contracts PASS; P107 ZIP round-trip 6/6 PASS. Browser stage phát hiện lỗi thụt lề trong harness Python, không phải lỗi assertion của P107.
- Run #46: [GitHub Actions](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44306542913) — chạy lại hosted browser acceptance sau khi sửa indentation; trạng thái cần xác nhận từ kết quả cuối cùng.
- Không tuyên bố GPU vật lý, đồng bộ cloud/hai thiết bị hoặc production acceptance khi chưa có bằng chứng tương ứng.

## 23.3.111 — Hosted runtime and release continuation

- Vendor and test local Three.js r187, Draco, Meshopt, KTX2/Basis, PostFX, OpenCV, dotLottie, Rive and Transformers.js/ONNX WASM on the GitHub-hosted runner.
- Run true model inference smoke for Whisper, ORMBG and Depth Anything after explicit test invocation; keep model weights outside the repository and disclose first-use network requirements.
- Retain P107 as portable export/import through the canonical Asset Library. Cloud sync/Project Vault is not implemented without a secure backend; physical two-device acceptance remains separate.
- Keep P70 fail-closed; physical GPU, target-device performance, real footage/audio quality, production HTTPS/security headers, print workflow, accessibility review, and rollback/observability need separately recorded evidence.


## P108–P109 thực hiện trong GitHub main (2026-11-19)

### P108 · Kiểm kê và wireframe điều hướng
- Base được kiểm: GitHub `main` tại `6dc77e7a579d310c2ccd9ada1b997bd252a0e85b`, candidate source `23.3.111-github-runtime-ci`; file đính kèm đối chiếu SHA-256 riêng: `C0AA50BE0A34007B4AF94F2637C2DCC1D8C7E0D67F6C49603758316CC443F426`. Main có thay đổi mới hơn file đính kèm (P104 subtitle panel), nên triển khai trên main để giữ thay đổi đó.
- Hiện trạng dùng `CVWS` + `CV.go`; 5 workspace đã có (ngoài `home`) là `design`, `site`, `media`, `proj`, `ai`. P108 wireframe hợp nhất 4 mục đầu thành Tổng quan + ba studio; `proj`/`ai` vẫn truy cập bằng điều hướng cũ, Ctrl+K và trang Xuất.
- Luồng: Hub → Studio Switcher → `CVWS.open(studio)` → trang cuối trong `CVWS.state.last`; trang/engine cũ tiếp tục mở bằng `CV.go` và giữ nguyên ID. Không tạo store, timeline hoặc adapter đồng bộ mới.
- Mapping hiện có: Thiết kế: Poster, Layout Foundry, Vector Forge, Design Engine, Templates, Brand, Assets, Design System, Responsive; Website & hồ sơ: Auto Design, CV Studio, Website Builder, Web Engine, Portfolio Studio, HR Visual; Ảnh & video: Pixel Atelier, Luma Develop, Clarity Lab, AI ảnh, ArtCraft, Video Engine, Motion Lab, Video Studio, ShotCraft, Motion presets và MotionCut legacy; Dự án/xuất: Projects, Export, Collab, Asset Hub, Platform; AI/cài đặt: AI Studio, One-click, Prompt Forge, Creative Hub, Insight, Hallmark, Guide, Settings.
- Wireframe P108: trên cùng là nút chữ “Studio ▾”; menu bốn đích Tổng quan/Thiết kế/Website & hồ sơ/Ảnh & video; Hub giữ vùng bắt đầu nhanh hiện có; mỗi Studio sẽ dùng cùng trang/engine hiện hữu. Rail đặt bên trái theo mặc định trong roadmap; không sao chép nhãn hiệu hay tài sản tham chiếu.
- Việc tiếp: hoàn thiện Hub P110, rồi Studio Shell P111–P113, sau đó hợp nhất/lùi cũ P114. Screenshot và duyệt wireframe bằng chủ dự án chưa thực hiện trong môi trường này.

### P109 · Studio Switcher
- Đã thêm `canvio-lot109-css` và `canvio-lot109` vào cuối `index.html`; menu bàn phím hỗ trợ mũi tên/Home/End/Escape, trạng thái Studio hiện tại, focus và layout hẹp.
- Nút gọi `CVWS.open` cho ba studio và `CV.go('home')` cho Tổng quan; lệnh được thêm vào `CV.palette.build`; Alt+0…3 giữ nguyên ánh xạ gốc trong CVWS. Không tạo nguồn route hay dữ liệu song song.
- Kiểm: module syntax PASS; P109 API smoke 5/5, 4 tuyến/4 lệnh palette PASS; integrated source contracts 9/9; P107 round-trip 6/6; P68–P70 17/17 PASS; HTML audit 112 scripts, 533 IDs duy nhất, không lỗi cú pháp. Browser origin thật/screenshot và CI hosted chưa chạy.
- Giới hạn: chưa có Chrome origin thật/screenshot do môi trường không cho bind localhost; chức năng P85 cần runtime bundles riêng theo manifest. Không đánh dấu release gate P70 nào đạt.


### P110 · Hub Tổng quan (2026-11-19)
- Đã thêm `canvio-lot110-css` + `canvio-lot110`: rail Tổng quan/Dự án/Mẫu/Thương hiệu/AI/Xuất/Thêm; ô tìm kiếm gọi lại `CV.palette`; chip Poster/Thuyết trình/CV/Website/Video/Ảnh/In ấn; ba Studio; khối Gần đây và Đã gắn sao.
- Gần đây đọc `canvio15.recent` và ánh xạ tên qua `CVWS.spaces`; yêu thích đọc owner sẵn có `CVDesignSystem.state.favorites` + `CV.assets.list()`. Không tạo store mới. Bắt đầu nhanh cũ giữ bên dưới.
- Kiểm cục bộ: P110 smoke 5/5, P109 5/5, integrated contracts 10/10, P107 round-trip 6/6, P63–P67 18/18, P68–P70 17/17; `git diff --check` không có lỗi khoảng trắng.
- Chưa có ảnh Chrome 1280/390 hoặc browser origin thật; GitHub hosted workflow cho P109 còn chạy khi ghi chú này được tạo. P111–P144 còn lại; 14 cổng P70 vẫn pending, `releaseCertified:false`.


### P111 · Studio Shell + Thiết kế (đang làm cục bộ, 2026-11-19)
- Đã thêm `canvio-lot111-css` + `canvio-lot111`: rail lấy đủ trang từ `CVWS.spaces.design.p`, chuyển trang qua `CV.go`, cập nhật `aria-current` và gỡ shell khỏi trang khác. Không clone/di chuyển engine DOM.
- Kiểm cục bộ: P111 API smoke 4/4; rail map khớp đủ trang Thiết kế; chạy `node --check` module PASS. Chưa visual QA.
- Theo yêu cầu mới, chưa đẩy P111 riêng; sẽ gộp các P còn lại rồi mới đưa loạt hoàn chỉnh lên GitHub và chạy test tổng.


### P112 · Studio Website & hồ sơ (đang làm cục bộ, 2026-11-19)
- Đăng ký workspace `site` vào shell dùng chung P111; rail lấy toàn bộ sáu trang từ CVWS, gọi lại `CV.go`. CV Studio/A4 không bị sửa.
- Kiểm cục bộ: P112 API smoke 7/7; sáu route hợp lệ; shared shell cleanup/navigation PASS. Chưa visual QA. Sẽ đẩy cùng các P còn lại và chạy hosted workflow tổng.


### P113 · Studio Ảnh & video (đang làm cục bộ, 2026-11-19)
- Đăng ký workspace `media` vào shell dùng chung; nhóm rail lấy từ `CVWS.spaces` (`ẢNH`, `VIDEO`, `LEGACY`), route vẫn qua `CV.go`. Video Engine/owner không đổi.
- Kiểm cục bộ: P113 API smoke 8/8; 11 route đúng và nhãn nhóm đầy đủ. Chưa visual QA hoặc hosted test.


### P114 · Hợp nhất điều hướng & lùi giao diện (đang làm cục bộ, 2026-11-19)
- Thêm `data-nav=shell` mặc định và nút đổi về `v16` ở Hub/Settings; không xóa `#side`/`#ws-tabs`. Ghi lựa chọn ở khóa UI `canvio15.nav-mode`.
- Rail dùng thanh cuộn ngang trên desktop/tablet nhỏ và thanh fixed có safe-area trên mobile; tôn trọng reduced motion, labels và aria.
- Kiểm cục bộ: P114 smoke 5/5. Chưa Chrome/screen reader review; 14 gate P70 vẫn pending. Theo yêu cầu, chưa đẩy riêng từng P; sẽ push sau khi hoàn tất danh sách P còn làm được.


### P115 · PWA shell và vendor cục bộ (2026-11-19)
- Vendor pinned cùng giấy phép và SHA-256 manifest: GrapesJS 0.22.13, Konva 10.0.0, Lenis 1.1.13. GrapesJS/Konva lazy-load cùng origin, không fallback CDN; Lenis được giữ trong manifest nhưng cuộn mượt sinh trang chuyển sang native CSS/browser APIs.
- PWA app shell: `canvio.webmanifest`, icon SVG cục bộ, `canvio-sw.js`; chỉ xử lý GET same-origin, bỏ qua API/model; navigation network-first có app-shell fallback và asset tĩnh runtime cache. Không cache dữ liệu dự án/media.
- GSAP không đóng gói vào trình dựng animation trực quan khi chưa có quyền phù hợp theo license; đã thay phần reveal/parallax/scroll progress bằng IntersectionObserver/CSS/native browser APIs. FFmpeg.wasm không đóng gói trước khi xác minh đúng biến thể LGPL/GPL và artifact tuân thủ; nút storyboard MP4 báo rõ và xuất WebM qua owner hiện có.
- Kiểm cục bộ P115: 12/12. Giới hạn còn mở: chưa nghiệm thu offline trên Chrome origin thật; mô hình/provider vẫn cần mạng theo yêu cầu; trang website xuất có thể giữ runtime Three.js từ URL ngoài.

### P122.1 · Design Taste (một phần, 2026-11-19)
- `CVTasteP122.audit(html, css)` chấm heuristic 0–100 và đưa gợi ý có tên nhóm cho typography, màu, icon, motion, accessibility và layout. Áp preset tinh gọn là thao tác chủ động, thêm CSS vào website hiện tại.
- Kiểm pure fixture thuộc suite P122/P123: điểm bị giới hạn 0–100; mẫu lỗi bị trừ điểm và giải thích.
- Phạm vi hiện tại là Website Engine; heuristic không thay thế kiểm tương phản WCAG bằng trình duyệt, visual QA hoặc đánh giá người thiết kế. P122.2 Unslop theo từng lượt và P122.3 MCP chưa làm.

### P123 · Website Layout Library (2026-11-19)
- Thêm 12 khối responsive tĩnh: Bento, Command Palette, Canvas Editor, Mega Menu, Sticky Sidebar, Three-Pane Inbox, Kanban, Timeline, Zig-Zag, Map + List, Product Page, Chat + Artifact.
- Chèn thẳng vào GrapesJS instance hiện tại bằng `CVWeb.addComponents`; các khối dữ liệu minh họa không kết nối dịch vụ ngoài. Kiểm suite P122/P123 đạt 13/13.
- Chưa có Chrome screenshot/responsive keyboard review; nên thực hiện trên hosted Pages cùng lượt phát hành cuối.

### Trạng thái phần roadmap còn lại sau P123
- Nhiều chức năng đã hiện diện một phần: PDF/DOCX/PPTX raster (P116), Whisper và optical flow (P117), Logo Studio (P118), GLB/dotLottie runtime (P119), RMBG/Depth/Ken Burns (P120), mask/LUT (P121), provider registry/video engine/Studio shell. Báo cáo phạm vi cụ thể ở `CANVIO_PROGRESS_REPORT_2026-11-19.md`.
- P130/P130.A không được giả lập nếu không có dự án Supabase, credential và deployment/RLS để nghiệm thu. P142, Playwright real-origin và Pages deployment phải xác nhận sau lần push hợp nhất.
- P131–P145 còn một số mục lớn/chưa nghiệm thu (bảo mật nhập file tổng thể, OPFS/khôi phục, media quality, import/export chuyên nghiệp, offline content packs, full visual QA); P70 tiếp tục fail-closed với 14 cổng thủ công đang mở.

### P127.1 · JSON Edit Plan (phần đầu, 2026-11-19)
- `CVEditPlanP127` xuất timeline hiện tại hoặc nạp JSON rồi áp mốc `start`, `duration`, `trimIn` cho clip đang có. Kiểm định format/version, ID tồn tại, ID trùng, giới hạn 500 clip, số hữu hạn, thời lượng và clip/track khóa trước khi ghi.
- Gọi `CV.engines.video.commit()` của timeline canonical; nếu lưu lỗi, khôi phục mốc trước đó. Không thêm timeline, asset, clip mới hoặc gọi AI.
- Kiểm P127 suite: 13/13. Chưa hỗ trợ b-roll, chữ, SFX, zoom/keyframe, auto-director hoặc quality gate P127.4.


### P122.2 · Unslop theo từng lượt (một phần, 2026-11-19)
- Website Engine có `CVUnslopP1222`: 5 thao tác CSS an toàn (chữ, bố cục, màu, reduced motion, focus bàn phím) để preview tạm trên iframe, áp dụng hoặc bỏ qua, và hoàn tác có kiểm tra editor chưa bị sửa tiếp. Nếu lưu lỗi thì trả CSS về trước lượt.
- Kiểm `tests/p115/run-p1222-tests.cjs`: 14/14; integrated source contracts: 19/19. Chưa sửa nội dung HTML, emoji/icon, poster/slide; chưa nối Project Vault history nên P122.2 còn partial.
- Hosted workflow được tách inference ONNX/Whisper dài sang lựa chọn `workflow_dispatch`; push thường vẫn chạy runtime Chrome nhưng không chiếm hàng chục phút cho model inference.

### P131.1 · Security hub + 2 lỗi treo trang nền (2026-11-20)
- **Mới:** `CANVIOSecurity` (lô `canvio-lot131`, bản độc lập `canvio-p131-security.js`). Quét localStorage/sessionStorage tìm khóa/token (chỉ báo tên, độ dài, loại; không bao giờ in giá trị), chuyển khóa sang bộ nhớ phiên bằng một nút có xác nhận, ẩn khóa trong văn bản xuất (`redact`), bộ làm sạch SVG/HTML dạng allow-list bằng DOMParser (từ chối DTD/ENTITY, bỏ script/foreignObject/on*/href độc/CSS `@import`/`url()` ngoài/animate-set đổi href), kiểm SRI/CSP/secure-context. Mở bằng nút "Kiểm tra bảo mật khóa" cạnh ô khóa Gemini hoặc Ctrl+K → "Kiểm tra bảo mật · khóa API".
- **Sửa lỗi nền (có từ trước, làm app treo 100% CPU trên Chrome thật):** (1) P111 `install()` gọi `classList.remove/add` vô điều kiện nên `MutationObserver` tự kích hoạt vô hạn (Tổng quan và mọi trang Studio có rail); đã thêm điều kiện `contains` và chỉ ghi lại `innerHTML` của rail khi nội dung đổi. (2) `window.CVKit={...,CDN,...}` ném ReferenceError (`CDN` không tồn tại) nên `CVKit` không được xuất; đã bỏ `CDN` khỏi danh sách xuất (không nơi nào dùng `CVKit.CDN`).
- **Kiểm:** `tests/p131/run-p131-tests.cjs` (VM, 18 điều kiện), `run-p131-browser.py` (Chrome thật: 9 payload SVG + 9 payload HTML độc, không script nào chạy, luồng dialog/chuyển khóa/Escape/palette), `run-p131-app-smoke.py` (toàn app: boot, 0 lỗi trang, không bão observer, `CV.go` qua 48 trang, dialog ở 1280 và 390px). Toàn bộ 21 test nguồn cũ vẫn đạt; 123 script `node --check` sạch; ID trùng giữ 59 như baseline. `tests/p57` vẫn đỏ khi chạy trần như trước (CI áp override).
- **Chưa làm/giới hạn trung thực:** khóa Gemini mặc định vẫn lưu localStorage cho đến khi người dùng bấm chuyển (không đổi mặc định để tránh bắt nhập lại mỗi lần); các bộ làm sạch cũ trong từng module chưa được nối sang hub (hub chỉ thêm, chưa thay); `redact` chưa gắn vào từng đường xuất; chưa có lọc import PSD/PPTX/ZIP bomb tổng thể; 1 tài nguyên ngoài (phông) không SRI được; CSP meta chưa có (nên đặt header ở máy chủ). P131 còn mở các mục này.
- **P131.2:** đường nhập SVG của P66 (`CANVIOAICreativeWorkflow.sanitizeSvg`, dùng khi nạp ảnh/SVG vào editor) nay đi thêm qua `CANVIOSecurity.sanitizeSvg` (chặn `<animate>/<set>` đổi href sang `javascript:`, escape CSS, DTD). Có test toàn app `appSvgImportHardened`. Các bộ làm sạch khác (HTML website, PPTX, ZIP) vẫn chưa nối.

### P127.4 + P127.6 · Cổng chất lượng dựng và xuất EDL (2026-11-20)
- `CVEditQualityP127` (lô `canvio-lot127q`, bản độc lập `canvio-p127-quality.js`), thẻ "Cổng chất lượng dựng" ngay dưới Edit Plan trong Video Engine. Chỉ đọc timeline, không sửa clip. Kiểm: thời lượng 0, cảnh quá ngắn (<0.4 s), cảnh quá dài (ảnh >8 s, video >15 s), khoảng đen giữa các cảnh, tốc độ đọc chữ (≤17 ký tự/giây), chữ quá dài/rỗng/chồng nhau, có âm thanh, tổng thời lượng. Xuất EDL CMX3600 (chỉ mốc cắt hình video/ảnh, fps 1–60); SRT đã có sẵn từ trước nên không làm lại.
- Kiểm: `tests/p127/run-p127q-tests.cjs` (14 điều kiện, gồm "phân tích không đổi dữ liệu") và smoke toàn app (thẻ gắn đúng chỗ, nút chạy được, 0 lỗi trang).
- **Còn mở:** P127.2 (talking head bằng Whisper timestamp + jump cut + zoom nhấn), P127.3 (SFX/nhạc cục bộ, ducking, LUFS), P127.5 (mẫu Short/Reel...), và phần đo bố cục (headroom/safe area), tương phản chữ, glow/bloom, độ ồn của P127.4 (cần dữ liệu khung hình/âm thanh thật, chưa làm).
- **P127.2 (phần đầu, 2026-11-20):** hàng điều khiển hiển thị sẵn trong thẻ "Cổng chất lượng dựng": ngưỡng dB, khoảng lặng tối thiểu, tùy chọn "Xoá và dồn clip", nút "Cắt khoảng lặng clip đang chọn". Gọi thẳng `CV.engines.video.autoCut` hiện có (không viết lại logic, có Hoàn tác); trước đây chỉ chạy qua hộp thoại `prompt()`. Test toàn app xác nhận nút xử lý đúng khi chưa chọn clip; **chưa chạy với âm thanh thật trong sandbox**. Chưa có: cắt theo Whisper timestamp, jump cut tự động, zoom nhấn.

### P127.3 (phần đo) — Đo độ to LUFS
- Thêm `canvio-p127-loudness.js` (lot `canvio-lot127l`): `CVLoudnessP127.measure/measureClip/advice`, K-weighting + khối 400 ms + gate tuyệt đối -70 / tương đối -10 LU theo BS.1770-4.
- Nút "Đo LUFS clip đang chọn" trong thẻ `#cv127-quality`; chỉ đọc, gợi ý tăng/giảm dB tới -14 LUFS.
- Test: `node tests/p127/run-p127l-tests.cjs` (sine chuẩn -3,01 LUFS, stereo +3 dB, gate, im lặng).
- Giới hạn: chỉ đỉnh mẫu (chưa true-peak), tối đa 80 MB / 30 phút, chưa ducking/map SFX; chưa kiểm với audio thật trên Chrome.

### P127.5 — Mẫu dàn dựng
- `canvio-p127-templates.js` (lot `canvio-lot127t`): `CVTemplatesP127.apply(key)` với 4 mẫu: Short/Reel 9:16, YouTube dài, Recap sự kiện, Video vui. Chỉ THÊM khung chữ gợi ý trên track chữ (nối sau chữ hiện có), có undo, từ chối nếu track chữ khóa.
- Hàng nút trong thẻ `#cv127-quality`. Test: `node tests/p127/run-p127t-tests.cjs`.
- Giới hạn: engine chưa có trạng thái tỉ lệ khung, nên mẫu chỉ nhắc tỉ lệ trong ghi chú; chưa gắn media/nhạc tự động; chưa kiểm trên Chrome thật.

- Xác nhận trên Chrome thật (smoke test, 18/18): nút LUFS và 4 nút mẫu hiện đúng, mẫu Short thêm 5 khung và undo được. Đo LUFS với audio thật vẫn chưa kiểm.

### P125.1 — Video thành web cuộn
- `canvio-p125-scrollframes.js` (lot `canvio-lot125f`): thẻ trong Website Engine; chọn video, trích N khung (8–240) lên canvas, xuất 1 tệp HTML offline: khung chạy theo vị trí cuộn, nạp lười khung lân cận, `prefers-reduced-motion` chỉ hiện khung đầu, không gọi mạng.
- Test: `node tests/p127/run-p125f-tests.cjs` và Chrome thật `python3 tests/p127/run-p125f-browser.py` (ffmpeg tạo video thử, trích khung, cuộn đầu/giữa/cuối, reduced-motion).
- Giới hạn: khung nhúng base64 nên tệp nặng (cảnh báo >20 MB); chưa có editor storyboard cuộn (P125.2), preset (P125.3) hay tối ưu gói/di động (P125.4); chưa tách WebP/JPEG thành tệp riêng.



## Continuation checkpoint — 2026-11-20 (verified against GitHub main)

Inspection base: `9290d128ca553b06195500d37210c8ffcc45dbbb`. This checkpoint supplements (does not erase) the historical P70 and earlier progress entries.

| Area | Current evidence | Remaining work / truthful status |
|---|---|---|
| P131 Security | P131.1 Security Hub and P131.2 P66 SVG import hardening are present. Latest commit `9290d128ca553b06195500d37210c8ffcc45dbbb` updates `canvio-p63-p67.js` to call `CANVIOSecurity.sanitizeSvg`. | Partial. HTML website import, PPTX/ZIP import, archive-bomb limits, generic export redaction wiring, CSP response headers and all other legacy sanitizer paths still require owner-by-owner integration and tests. |
| P127 Video | P127.1 Edit Plan; P127.2 silence-cut controls (partial); P127.3 LUFS (partial); P127.4 quality gate; P127.5 four text templates; P127.6 EDL are documented as present. | Partial. Whisper timestamp-driven cuts, jump cuts, emphasis zoom, actual SFX/music/ducking, true-peak and real media/browser/device acceptance remain open. |
| P125 Website storytelling | P125.1 scroll-frame HTML export is present with local test/browser harness. | P125.2 storyboard editor, P125.3 reusable presets and P125.4 output/package/mobile optimization remain open. |
| P122 Design Intelligence | P122.1 heuristic taste audit; P122.2 CSS-only website polish preview/apply/undo. | Partial. Content/icon-level polish, poster/slide scope, Project Vault history integration and visual/accessibility review remain open. |
| P130 Cloud sync | No verified Supabase project, deployed schema/RLS, credentials or recovery proof in the repository evidence reviewed. | Explicitly blocked; do not fake login, cloud sync, encryption or cross-device sync. |
| P70 release gates | Manifest remains `releaseCertified:false`; fourteen real-world acceptance gates are still recorded as pending. | Keep release blocked until evidence is captured on the actual target environment and reviewed. |

No new code or tests are claimed by this documentation checkpoint. The current latest commit's combined status response contained no status entries; do not infer CI PASS from that response. The next code batch must add targeted tests alongside each integration and let hosted Actions refresh the manifest hashes.


## Hosted CI defect follow-up — 2026-11-20

Run #116 failed after the P85/GLB checks, P131 browser checks and full-app smoke had passed because the P125.1 browser harness invoked `ffmpeg` but the Ubuntu runner did not install it. The workflow now includes `ffmpeg` in its native test utility installation list (workflow commit `ccd4f2a0c9d17e617e4cfb09c4ff2cbaaff8e755`). The fix remains PENDING until the new run completes; run #116 remains FAILED in history.


## 2026-11-20 — CI verification checkpoint (candidate 23.3.111)

Hosted verification after the ffmpeg repair is complete:

- Runtime [workflow #125](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44692957703): success; all verify-job steps completed on `6a003524a1a46a9254035361303a779d9f4401b9`.
- Pages [workflow #145](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44692957814): success for the same source SHA.
- P125.1 hosted browser test is now unblocked and completed. P131 source/VM 18/18; P131 app smoke 18/18 with zero page errors; P127 Edit Plan 13/13, Quality Gate/EDL 14/14, P127 UI smoke 18/18; P107 ZIP round-trip 6/6.
- Three.js r187 + Draco/Meshopt/KTX2 vendor manifests and P85 vendor manifests passed SHA-256 verification. Hosted Chromium loaded the compressed GLB fixtures and initialized the listed P85 runtimes. SwiftShader is software rendering only.
- Workflow refreshed the manifest for `23.3.111-github-runtime-ci`: 184 files; index SHA-256 `a371b7ebbdfce8632c69e49ad836232fddf9734a41c86d0399cccaa5f1994cbf`.

**Roadmap disposition remains partial:** P122.2, P125.2–P125.4, P127.2 advanced director/audio functions, P130 real cloud sync and P131 broad import/export hardening remain open. The fourteen P70 real-world acceptance gates remain pending; no physical GPU, real-media quality, production security-header, accessibility, clean-machine offline, cross-origin recovery or two-device sync certification is implied.

### P125.3 + P125.4 (phần giảm dung lượng) — Mẫu chữ và ngân sách dung lượng
- Thẻ "Web cuộn từ video" thêm chọn mẫu: Không chữ, Hero video (3 dòng lộ theo tiến độ cuộn), Chữ lộ dần (4 ý), Marquee + ghim (băng chữ chạy theo cuộn). Chữ được làm sạch, tối đa 12 dòng, thoát `<` trong JSON nhúng.
- Ô "Tối đa MB": `decimate` bỏ khung xen kẽ cho tới khi vừa ngân sách (không dưới 8 khung, giữ khung cuối). Test đơn vị + Chrome thật (chữ giữa/cuối đúng theo cuộn).
- Còn mở: P125.2 editor storyboard cuộn (kéo thả mốc chữ, parallax, easing chung); tách khung thành tệp WebP riêng/gói zip; kiểm trên điện thoại thật.

### P145 core (P145.1, P145.9 phần cổng, P145.4b phần ghi chú, P141/P145.7 kiểm dấu, P137 data merge, P128.3 JSONL)
- `canvio-p145-core.js` (lot `canvio-lot145c`) + thẻ "Content Factory" ở trang Tài nguyên: gắn giấy phép/nguồn cho từng tài nguyên (lưu `canvio145:meta`), báo cáo + credit .txt, công tắc đăng công khai (mặc định tắt: chỉ cảnh báo; bật: chặn phi thương mại/chưa rõ).
- Nhạc giữ chỗ: dán link YouTube/SoundCloud/Spotify/khác (chỉ http/https), tên, BPM, giây vào; xuất cue sheet. KHÔNG tải/ghi âm, KHÔNG nhúng trình phát (chưa làm tự phát), xuất video không chứa tiếng từ link.
- Kiểm font tiếng Việt bằng canvas (134 ký tự có dấu; heuristic, font phải đã nạp). Data merge CSV→HTML (thoát HTML, báo trường thiếu). `toJsonl` cho bộ dữ liệu phong cách.
- Test: `node tests/p127/run-p145c-tests.cjs`, Chrome thật `python3 tests/p145/run-p145-browser.py`.
- Chưa làm: manifest cho gói tải offline (OPFS), băm/phát hiện trùng khi tải lên, template factory, SFX/nhạc tổng hợp, shader, pack icon/font/stock, trình phát nhúng tự phát.

### P132 (phần xuất GIF động)
- `canvio-p132-gif.js` (lot `canvio-lot132g`): bộ mã hoá GIF89a thuần JS (bảng 3-3-2 + dither Bayer, LZW, lặp vô hạn). Nút "Xuất GIF từ timeline" (FPS 1–15, rộng ≤ 640) trong thẻ Video Engine; chụp `#vtCanvas` bằng cách tua timeline rồi trả về vị trí cũ.
- Test: `node tests/p127/run-p132g-tests.cjs`; Chrome thật + ffprobe (`tests/p127/run-p132g-browser.py`): giải mã đúng codec gif, đúng rộng và số khung.
- Chưa làm: APNG/WebP động, nhập PDF/PPTX/PSD, xuất PPTX; bảng màu cố định 256 nên gradient có thể vân; chưa thử với timeline có media thật.

### P145.3 (phần SFX tổng hợp)
- `canvio-p145-sfx.js` (lot `canvio-lot145s`): 6 SFX bằng Web Audio offline (Whoosh, Hit, Riser, Click UI, Glitch, Pop), có seed, WAV 16-bit mono 44,1 kHz, đỉnh −1 dBFS. Hàng nút trong thẻ Video Engine: Nghe, Thêm vào timeline (qua `importFiles`), Tải WAV.
- Test: `node tests/p127/run-p145s-tests.cjs`; Chrome thật `tests/p145/run-p145s-browser.py` (không im lặng, đỉnh đúng, xác định theo seed, thêm clip audio, ffprobe giải mã WAV).
- Chưa làm: nhạc nền loop theo mood/BPM, stems, ducking, nhạc bằng model cục bộ; nút "Nghe" chưa được kiểm bằng tai thật (chỉ kiểm đường dữ liệu).

### P136 — Image Trace (ảnh → vector SVG)
- `canvio-p136-trace.js` (lot `canvio-lot136t`): thẻ "Ảnh → Vector" ở Image Studio. Median-cut 2–12 màu, tách lớp theo màu, dò đường biên theo cạnh điểm ảnh, đơn giản hoá Douglas-Peucker, tô evenodd (lỗ thủng đúng), nền tự nhận, bỏ pixel trong suốt, thu nhỏ ≤ 512 px. SVG xuất chỉ gồm rect/path (không script, không link ngoài).
- Test: `node tests/p127/run-p136t-tests.cjs`; Chrome thật `python3 tests/p145/run-p136-browser.py` (vẽ ảnh, trace qua giao diện, kết xuất lại và so pixel: lệch 0,15%).
- Chưa làm: làm mượt Bezier, tách nét đơn (stroke), pattern/brush/gradient mesh (phần còn lại của P136); ảnh chụp nhiều chuyển sắc ra dạng poster.

### P134 (phần đo màu) — Histogram, Waveform, Vectorscope
- `canvio-p134-scopes.js` (lot `canvio-lot134s`): ba đồng hồ đo cho khung đang xem của Video Engine (đọc `#vtCanvas`, BT.709), kèm nhận xét cháy sáng/đen kịt/khung tối. Cập nhật bằng nút và khi kéo thanh tua.
- Test: `node tests/p127/run-p134s-tests.cjs`; Chrome thật `tests/p145/run-p134-browser.py`.
- Chưa làm: Auto Reframe 16:9→9:16/1:1 (cần dò mặt/vật thể và tracking), đo trên clip video thật.

### P138 (phần khử ồn) — Spectral gating
- `canvio-p138-denoise.js` (lot `canvio-lot138d`): nút "Khử ồn clip đang chọn" (mức 0–100) trong thẻ Video Engine. STFT 1024/hop 512, hồ sơ ồn từ ~10% khung yên nhất, trừ phổ + sàn, làm mượt tần số; tạo clip MỚI mono, clip gốc giữ nguyên. Giới hạn 5 phút / 80 MB.
- Đo trên Chrome thật (ồn trắng 0,05 + tiếng 440 Hz ngắt quãng): ồn giảm ~16 dB, tiếng lệch −0,4 dB, độ dài giữ nguyên. Test: `node tests/p127/run-p138d-tests.cjs`, `tests/p145/run-p138-browser.py`.
- Giới hạn trung thực: KHÔNG phải RNNoise/AI. Tiếng/nhạc kéo dài đều (không có khoảng yên) bị coi là ồn; ồn thay đổi và tiếng người nền không xử lý được. RNNoise WASM và TTS tiếng Việt (Piper) chưa làm vì cần tải model/runtime.



## 23.3.111 continuation — P127.7 / P145 verification (2026-11-20)

### P127.7 — Ducking nhạc theo phụ đề (đã tích hợp, regression PASS)
- Source: `canvio-p127-duck.js`; embedded lot: `canvio-lot127k`; API: `window.CVDuckSubP127`.
- Lấy cue từ phụ đề track chữ 3 (ưu tiên `CVDirectorP127.cuesFromClips`), cho chọn một clip audio hiện có, tính envelope theo dB/attack/release/pad, gộp khoảng gần nhau, giới hạn 15 đoạn/64 điểm. Chỉ ghi vào `volumeEnvelope` của clip được chọn qua Video Engine canonical commit; kiểm clip/track khóa, undo checkpoint và rollback nếu commit lỗi.
- Không thêm timeline, asset, store hoặc API đồng bộ mới; không ghi/thu âm từ trình phát bên ngoài. Đây là ducking theo mốc phụ đề, không phải phân tích giọng nói trực tiếp.
- Test: `node tests/p127/run-p127k-tests.cjs` (7/7) và workflow hosted #136 thành công: https://github.com/tovannghia27223-png/CANVIO/actions/runs/44747203664. Inline syntax audit và các regression suite tích hợp cũng PASS.
- Còn mở: kiểm thử thao tác UI với dự án thật, nhiều track/clip, nghe A/B và xác minh envelope khi xuất media thật.

### P145 — trạng thái kiểm chứng trong workflow #136
- P145.1 Content Core/License & Credit: source + unit suite PASS; tiếp tục dùng Asset Library hiện có. Chế độ cá nhân cho phép CC-BY-NC và cảnh báo tài sản chưa rõ; công tắc công khai/kiếm tiền siết điều kiện.
- P145.3 SFX tổng hợp: 6 recipe Web Audio, WAV 16-bit mono 44.1 kHz, đỉnh chuẩn hóa −1 dBFS; unit suite + hosted browser test PASS. Đây là âm tự tổng hợp, chưa phải thư viện nhạc/SFX được tuyển chọn.
- Hosted browser acceptance trong workflow #136 cũng chạy P136, P134 và P138; toàn bộ job hoàn tất SUCCESS. P138 hiện là spectral gating, không phải RNNoise/AI.
- Chưa hoàn tất: P145.2 shader transitions; P145.4 thư viện nhạc/SFX cục bộ; P145.4b tự phát trình phát nhúng (hiện chỉ metadata/cue sheet, không capture); P145.5 Template Factory; P145.6 icon/stock offline packs; P145.7 font packs; P145.8 stock/AI media packs; P145.9/10 full quality gate/search integration. Không nhúng tài sản không rõ giấy phép.

### Release disposition
- Candidate marker vẫn `23.3.111-github-runtime-ci`; workflow #136 PASS chỉ chứng nhận các bước tự động đã chạy. P70 vẫn `releaseCertified:false`, 14 manual gates pending. Không tuyên bố production-ready, physical GPU, media thật hoặc đồng bộ cloud/hai thiết bị.

## 23.3.111 continuation — P145.2 shader transitions

- Integrated first P145.2 increment: nine shader transitions, eight shader FX plus the no-effect option, quality caps, local image input, PNG frame export and optional P79 WebCodecs video-only MP4 transition segment.
- Uses the existing Video Engine page as the UI host and existing P79 muxer as the export owner; no third-party dependency, external fetch, new timeline, store or media database.
- Canvas2D fallback preserves crossfade/wipe only and clearly disables shader-specific FX. Hosted browser coverage is SwiftShader/software rendering.
- Still open: 60 fps/performance acceptance on representative physical devices, WebCodecs H.264 support matrix, professional review on real project footage, full multi-track/timeline transition editing and audio-inclusive export through the existing canonical exporter.


## 23.3.111 continuation — P145.4b official music preview

- Added a standalone embedded preview panel to Asset Library using the existing P145 cue list; no new timeline, media store, server, API key or download mechanism.
- HTTPS allowlist: YouTube privacy-enhanced embed, Spotify official embed, SoundCloud official widget. Rejects unsupported hosts, non-HTTPS schemes and malformed provider paths.
- User-triggered only; autoplay disabled. Cue video position and source in/out are displayed. YouTube accepts start/end query parameters; Spotify/SoundCloud use provider controls and do not promise frame-accurate seeking.
- No capture, recording, ripping or download. Platform/network/browser restrictions remain external dependencies.


## 23.3.111 continuation — P145.4 local background music composer

- Added the missing mood/BPM background-loop generator using deterministic local Web Audio synthesis. Four moods (corporate/calm/uplifting/focus), BPM 60–140, 4/8 bars; output is mono 44.1 kHz WAV.
- Preview loops locally, stop, download WAV or add the generated result to the existing Video Engine timeline via \`importFiles\`. This complements P145.3 synthetic SFX and P145.4b official third-party previews; it is not a curated commercial music pack.
- Original oscillator synthesis only: no sample libraries, remote API or unverified assets. Does not claim stems, MIDI, live instrumental recording, or cross-device Project Vault sync.
- Added deterministic unit assertions and hosted browser checks for all four moods, duration, non-silence, peak normalization, WAV decode, preview/stop and timeline import. Human listening review remains a separate manual acceptance.


## 23.3.111 continuation — P125.2 Scroll Storyboard Editor

- Adds a two-stage P125 workflow: extract frames, then edit/export a scroll storyboard.
- Adds a visual frame preview, editable caption timeline (0–100% start/end), add/remove and native drag reorder, position (top/center/bottom), entrance effect (fade/slide/zoom), parallax, scroll easing and page length.
- Reuses P125.1 local extraction, decimation and standalone offline HTML builder; reduced-motion fallback remains first-frame only.
- Hosted unit/browser tests are in the candidate workflow. Touch-device drag, real project editorial review and physical mobile performance remain manual.

## 23.3.111 continuation — P136.2 optional Bezier smoothing

- Added optional closed-contour cubic Bezier smoothing (0–100%) to Image Trace. Default 0 retains prior polygon output; positive values smooth traced contours without changing quantization or contour extraction.
- Keeps evenodd fill and palette/layer/loop counts. Output remains static SVG with no script or external references.
- Unit suite and hosted browser test cover the default output, cubic smooth export, clamping, finite coordinates and SVG safety.
- Single-line stroke tracing, brush/pattern/gradient mesh and review on varied production artwork remain open.


## 23.3.111 continuation — P145.5 local Template Factory

- Five original local starter layouts: Business Brief, Finance Snapshot, HR Recruitment, Professional Profile and Social Story. Four local palettes; edit title/subtitle/body, three metrics/labels and footer.
- Sandboxed preview, save up to 20 browser-local templates, standalone offline HTML export, validated JSON import/export. User text is escaped and bounded; no remote fonts or images.
- Unit + hosted Chromium tests passed on feature run #44773327159. Native Poster/Slide bundles, manual typography/print proof and cloud sync remain open.

## 23.3.111 continuation — P131 export-boundary hardening

- Connected P131 HTML allow-list sanitization to P67 Print Production after its existing print-specific checks; safe inline CSS is cleaned and retained.
- Connected shared secret redaction to the P145 Content Factory text/HTML/JSONL Blob boundary; export is refused without the redactor.
- Connected redaction to P73 Offline Website HTML before ZIP packaging; missing redactor fails closed and package report records the redaction count.
- Hosted browser smoke and source-contract tests passed after DOMParser-scope correction.
- Still open: generic hostile HTML/PPTX/ZIP imports, complete archive expansion quotas, all binary export owners and server-side CSP/SRI response headers.

## 23.3.111 continuation — P136.3 Single-line Stroke Trace

- Added optional “Nét đơn (Stroke)” mode alongside existing filled multi-colour Image Trace. Uses Otsu thresholding, transparent-pixel exclusion, Zhang–Suen thinning, graph-based path extraction and static SVG stroke export.
- Added bounded stroke width and retained existing local processing/PNG→SVG flow. Does not use stock assets, remote font files, OpenCV download or external trace service.
- Unit and hosted Chrome acceptance extend existing P136 suites; P136.2 filled-mode and Bezier regression are retained.
- Still open: topology/branch editing, handwriting OCR, pattern/brush, gradient mesh and complex photographic edge cleanup. Stroke mode works best on high-contrast logos/line art.

 
## 23.3.111 continuation — P132.2 animated PNG (APNG)
- Extended the existing P132 export row with a distinct APNG download while retaining GIF. Frames come from the existing Video Engine canvas; the current playhead is restored after capture.
- Encodes PNG RGBA frames with APNG `acTL/fcTL/IDAT/fdAT`, per-chunk CRC-32, zlib stored DEFLATE and hundredth-second frame delay. No audio and no second timeline.
- Boundaries: 600 frames maximum, dimensions ≤4096×4096 and raw filtered frame data ≤64 MiB. Stored DEFLATE may produce larger files than optimized encoders; the UI reports file size.
- Tests extended in `run-p132g-tests.cjs` and hosted `run-p132g-browser.py` (Chromium download + FFprobe APNG decode).
- Still open: animated WebP, export with audio, real-media/performance and large-animation memory review. P132 is therefore still partial.


## 23.3.111 continuation — P127.2 Caption-guided Talking-head Director

- Adds a caption-aware director panel in the existing Video Engine, reusing subtitle text cues, canonical timeline and undo/commit owner.
- Provides caption/pause analysis, bounded punch-in keyframes and an AutoCut action delegated to the existing silence-cut implementation.
- Hosted tests cover a generated WebM fixture with deterministic audio bursts, cue markers, pause display, keyframe persistence, AutoCut and Undo. This validates the code path only; it does not certify Whisper transcription, real speech quality, face tracking or editorial quality.
- Manual validation on real talking-head footage remains required.


## 23.3.111 continuation — P125.4 Split-asset offline storyboard ZIP (2026-11-21)

- Rebased the P125.4 implementation onto the current main baseline rather than merging its stale conflicting branch. The existing single-file storyboard export remains unchanged; ZIP is a second export choice.
- ZIP contains offline index.html, manifest, README and separate relative frame images. Only generated local frame names are accepted; invalid paths fall back to embedded local data.
- Reuses P125.1 frame extraction, P125.2 caption/editor controls and the existing CVZip.build owner. No duplicate project state, server or cloud-sync dependency.
- Added Node and hosted Chromium + Python acceptance for parity, ZIP integrity, frame signatures and offline open/scroll. Hosted runtime run #271 (2026-11-20) passed the P125.4 Node package suite (14 assertions) and Chromium ZIP/offline checks, including decode of the last relative image (naturalWidth > 0); it supersedes earlier run #255.
- Still open: audio, real user-media review, touch/mobile editor acceptance and memory/performance on long high-resolution source video.


## 23.3.111 continuation — P145.6–P145.10 Asset Library tools (rebased to post-P125.4 main)

- P145.6 adds 25 first-party offline SVG icons, five categories, local search/filter, preview and single/sprite/contact-sheet exports.
- P145.7 adds six system-font typography presets with bounded layout controls, Vietnamese preview and CSS export. Uses a dedicated card shell to avoid the app-wide 3D tilt pointer-hit conflict.
- P145.8 adds eight first-party offline SVG illustrations, four palettes, filter/search, preview and vector exports.
- P145.9/.10 adds read-only local asset search and a shared license/source/size/hash quality gate. Uses the existing `CV.assets.list()` provider when present; full vault enumeration and binary hashing still require a canonical provider.
- All four modules are inserted into the candidate `index.html` by the runtime integration workflow. Node and hosted Chromium test commands are included for each module.
- Previous run #263 exposed the P145.7 pointer-interception defect; the non-`.card` fix is confirmed by current-main hosted run #298 (`44800999215`). P145.6–P145.10 Node and Chromium suites passed on the rebased PR.
- Free/offline implementation: no remote fonts, stock images, paid package or duplicate project/timeline store. Remaining work: inspect the live Asset Vault provider, real production metadata/hash coverage and human design review.


### P145.6–P145.10 prior run evidence and rebase gate (2026-11-21)
- Prior superseded branch CI run #276 completed success with P145.6 9/9, P145.7 7/7, P145.8 11/11 Node suites and all four browser suites clear of failures/page errors.
- P145.7 real pointer interaction now passes after removing the global `.card` tilt hook from its custom panel wrapper.
- Current-main rebase additionally orders P145.9/.10 after P145.8; this was included in successful hosted run #298 (`44800999215`). The older #276 remains historical.


### P145.6–P145.10 current-main acceptance — 2026-11-20
- Hosted runtime run #298 (`44800999215`) completed success on the post-P125.4 main baseline. P145.6–P145.10 integration, audit and browser tests are now included in the verified candidate.
- Node suites: P145.6 9/9; P145.7 7/7; P145.8 11/11; P145.9/.10 8/8. Chromium reports for all four suites returned no failed checks and no uncaught page errors.
- Run #298 also passed candidate HTML/JS audit, P47–P70 regression suites, source contracts, P107 ZIP round-trip, local Three.js r187/P85 runtime SHA verification, GLB Draco/Meshopt/KTX2 fixtures and synthetic P80/P102/P105 ONNX worker/browser acceptance.
- Boundaries remain: test provider is a fixture, not complete live Asset Vault coverage; no automatic hashing of every real uploaded binary; fonts are system fallbacks; SVG packs are starter assets. Physical GPU, real-media/mobile/print/accessibility and the 14 P70 manual gates remain open.


### 23.3.111 main-branch integration snapshot — 2026-11-21

- P125.4 was merged through PR #32 (merge commit `0f485fcfbdcc19cc19acf09320ee90eaefd46e17`). Hosted run #271 (`44798663309`) passed the 14-assertion Node package suite and Chromium offline ZIP acceptance, including integrity, manifest/README, separate image entries and final relative-image decoding.
- P145.6–P145.10 was merged through PR #33 (merge commit `4f56fcb002e4ef9f10c08b7fc920c50457ecc6e1`). Hosted run #298 (`44800999215`) passed Node suites P145.6 9/9, P145.7 7/7, P145.8 11/11 and P145.9/.10 8/8; all four Chromium suites reported no failed assertions or uncaught page errors. The P145.7 browser suite uses physical Playwright mouse interaction.
- The post-merge main build is `782aa562f5341172330d114ccb21a3269efbbb37`, retaining candidate `23.3.111-github-runtime-ci`. Mainline workflow #282 (`44799501341`) concluded success; the configured PR-event-only candidate-branch commit step was skipped, not failed.
- Integration does not imply full production acceptance. P145.9/.10 still needs the canonical live Asset Vault provider to prove complete enumeration and hash coverage. The icon/illustration sets remain starter packs and typography uses system-font fallbacks.
- P70 remains `releaseCertified:false` / `BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE`; fourteen real-world gates remain open. Do not label CANVIO 1.0 Stable or production-certified until each gate has evidence and sign-off.

## 23.3.111 continuation — P132.3 Animated WebP export (2026-11-21; hosted re-verification pending)

- Adds animated WebP to the existing Video Engine P132 export row beside GIF and APNG; retains the original formats and canonical timeline read path.
- Uses native browser canvas WebP frame encoding and a local RIFF animation muxer (VP8X/ANIM/ANMF). No paid dependency, external request, upload, second timeline or additional store.
- Bounds: 180 frames, 640 px maximum side, 64 MiB raw-frame budget and 64 MiB output; 20–60,000 ms frame delay. No audio.
- Initial hosted run #300 passed the integrated Node suites, GIF/APNG acceptance and P145 regressions, but its WebP browser checks failed: the Python test reversed RIFF FourCC/size offsets, and runner ffprobe did not report WebP dimensions/frame count. The rebased test corrects RIFF parsing, validates frame payloads and derives canvas output dimensions, then decodes the actual downloaded WebP with Chromium `createImageBitmap`. Await new hosted CI before acceptance.
- Real footage quality, target mobile browser support, alpha/profile handling, memory/performance and audio remain outside automated acceptance.


### P132.3 hosted test follow-up — run #303 (2026-11-21)
- RIFF parser, RIFF size, chunk boundaries, VP8X animation flag, ANIM, ten ANMF frames, each frame's VP8 payload, frame dimensions (200×113) and 200 ms durations all passed. Chromium `createImageBitmap` also decoded the downloaded file successfully at 200×113; pageErrors were empty.
- The remaining failing boolean was a stale fixed-height assertion (`200`) instead of the editor-derived height (`113`). The test now asserts the actual expected height. ffprobe on this runner reports WebP width 0 and “image data not found”, so it is retained as diagnostic only; browser decode + container structure are the acceptance checks. Re-run pending.


### P132.3 — hosted acceptance PASS (2026-11-21, run #304)
- PR #36 corrected the browser test's stale fixed-height expectation (200) to match the actual editor canvas-derived 113 px; output remained 200 px wide.
- Workflow #304 (`44809678883`) completed success. WebP browser checks all passed: RIFF length/chunks, VP8X animation feature, ANIM, 10 ANMF frames, valid VP8 payload per frame, 200×113 frame dimensions, 200 ms duration, Chromium native `createImageBitmap` decode. Browser report `failed: []`, `pageErrors: []`. GIF/APNG acceptance and full GLB/P85/ONNX same-origin browser checks also passed.
- Limits unchanged: no audio mux; target mobile browser matrix, real footage/visual quality, alpha/color-profile, and long timeline memory/performance need manual review. P70 remains blocked with fourteen real-world gates open.


## 23.3.111 continuation — P145.10 local Asset Library SHA-256 scan (rebased candidate, 2026-11-21)

- The canonical local owner already exists: `CV.assets.list()` / `CV.assets.addBlob()` backed by existing `LS('assets')`; P145.9/.10 reads it by default. This is local browser storage, not cloud sync.
- Adds explicit, read-only SHA-256 of decoded bytes from local base64 data URLs. Session-only hashes feed the shared P145.1 quality gate; no vault or metadata mutation.
- Limits: 40 rows, 25 MiB/file, 64 MiB total. Unsupported, missing, Web Crypto-unavailable or over-budget items remain unverified. No upload, external request, second store or background hashing.
- Original PR #37 hosted workflow #305 passed; this current-main rebase needs its own hosted rerun before acceptance.



## P136.4 — Local SVG pattern fills (2026-11-21; candidate)

- Extends the existing Image Trace owner only; no second vector editor or asset store. Six native SVG pattern presets are available per colour layer: dots, diagonal hatch, grid, cross, wave and checker.
- Existing no-pattern output is preserved exactly; pattern definitions are local SVG defs/pattern nodes with no remote references. The UI disables pattern selection in single-line Stroke mode; multicolour trace and optional Bezier remain intact.
- Node coverage includes embedded-source parity and static/self-contained SVG; Chromium coverage downloads the pattern SVG, checks local pattern references, decodes the preview and rechecks Stroke behavior. Current status: candidate pending hosted CI on this branch.
- P136 remains partial: no brush authoring, gradient mesh, topology/branch editor, handwriting OCR or reliable photo-to-vector cleanup. Real artwork/design review remains manual.



## 2026-11-21 verification correction — P136.4 PASS

- The earlier P136.4 entry that said hosted CI was pending is superseded. PR #39 merged into main (`1eb4129f4252b31c41f819d23f1cd9dd02948d68`); hosted workflow #312 (`44813838108`) completed success, 33 steps, no failed steps.
- P136.4 adds six local SVG pattern fills to the existing Image Trace multi-colour mode. Existing no-pattern SVG output, Bezier and single-line Stroke remain. Limits are unchanged: no brush authoring, gradient mesh, topology editor or photo-restoration quality claim.

## P131.3 — Safe local HTML import (candidate; 2026-11-21)

- Adds explicit `.html/.htm` import to the existing Website Engine. Import passes through `CANVIOSecurity.sanitizeHtml`, strips non-data image/source URLs, rejects files over 5 MiB and inserts through the existing `CVWeb.addComponents` + `CV.engines.web.save` owner. No new editor/store, upload or remote dependency.
- Adds Node API parity checks and Chromium tests for malicious markup, local raster retention, remote image removal, Vietnamese content, project save and user file picker.
- Current status: candidate PR #41; hosted CI required before merge. Real external-page fidelity, CSS/assets, third-party runtime, mobile and production accessibility remain separate manual acceptance items.




## P131.3 — Safe HTML import: mainline integration PASS (2026-11-21)

- PR #41 source/test/workflow merged at `1ac185d7aea7b14ad13a0517f51e72292cc42162`; hosted run #315 (`44816184861`) success. P131 Chromium: 31/31, zero page errors; app smoke: 21 passed across 48 pages.
- Mainline push build commit `4fdaae3219cde7ebc6c4c9358bf40b3d57812f16` updated canonical `index.html` and Manifest. Verified main index includes `prepareHtmlImport`, `131.3.0` and palette action **Nhập HTML an toàn · Website Studio**. Manifest index SHA-256 `e419b50f1bd459201ad19d94f6a2cd5ea08c03b539be3c0a3b7899b8b925a7ac`, 5,358,886 bytes; 237 files.
- Supersedes previous P131.3 pending/candidate notes. Import is limited to sanitized .html/.htm body fragment, ≤5 MiB, no scripts/forms/iframes/stylesheets/remote images/media or third-party runtime; uses existing Website Engine add/save path and creates no new store/backend.
- P70 stays blocked: 14/14 real-world acceptance gates remain open.

## 2026-11-21 — Mainline status reconciliation (supersedes older pending labels)

- **P145.10:** merged on main by PR #38, commit `c0ee9749dbfda84abcf43466a034dfa5539222c9`; hosted run #310 (`44812233871`) passed. Node 10/10 and Chromium 14/14; native `CV.assets.list()`, session-only SHA-256 from local bytes, duplicate detection and read-only Asset Library behavior passed. Artifact `CANVIO-23.3.111-GITHUB-RUNTIME-VERIFIED-310` (21,579,190 bytes; SHA-256 `302274465126dec415716d796981168ed96fc0d2091514581725557e67a22843`). Limits: 40 assets, 25 MiB each, 64 MiB total; unsupported/over-budget entries are unverified; no cloud inventory.
- **P136.4:** merged through PR #39 at `1eb4129f4252b31c41f819d23f1cd9dd02948d68`; hosted run #312 (`44813838108`) passed 33 workflow steps. Six local SVG pattern fills are available in multicolour Image Trace; existing none/Bezier/Stroke paths remain. No brush authoring, gradient mesh or topology editor is included.
- **P131.3:** merged through PR #41 at `1ac185d7aea7b14ad13a0517f51e72292cc42162`; hosted run #315 (`44816184861`) passed. Chromium import suite 31/31, zero page errors; app smoke 21 checks across 48 pages. Import is a sanitized local .html/.htm body fragment ≤5 MiB through the existing Website Engine add/save owner; external media, stylesheets, scripts, forms and iframes are intentionally excluded.
- Older entries above/below that label these three increments “candidate”, “pending” or “awaiting rerun” are historical snapshots and are superseded by this reconciliation. Their original history is retained.
- **P70 release gate is not closed:** `releaseCertified:false`, fourteen real-world acceptance gates remain pending. CI fixtures do not replace real-origin persistence, real-media, accessibility, HTTP-header, physical-device/GPU, clean-machine offline, cross-origin recovery or incident-drill evidence.
- Detailed state for all documented P families is consolidated in `CANVIO_ALL_P_COMPLETION_TRACKER.md`; it distinguishes merged/automated PASS, partial scope, not yet evidenced and external blockers.

## 2026-11-21 — Backlog audit correction (P122.3 / P124 / P133 / P142 / P143 / P144)

- P122.3 is explicitly listed as **MCP chưa làm** in the earlier P122 section. No separate source, test or transport/permission/threat-model contract was found. It remains unimplemented until a concrete safe acceptance contract is approved.
- P124 Auto Layout/Component remains partial/open; the 12 P123 static GrapesJS blocks do not implement auto-layout constraints, reusable variants or responsive component behavior.
- P133 OPFS/proxy is listed as backlog in `CANVIO_NEXT_AI_PROMPT.md`; no P133 source, worker or tests exist on main. It must be designed around current IndexedDB/Project Vault/media owners and quota/rollback behavior, not as an unrelated second store.
- P143 full source split/refactor remains open; standalone lots do not mean the entire large index has been modularized. Use staged extraction and embedded/source parity tests.
- P144 Command Palette is partially covered by P109's existing palette/command-search owner and tests. Do not create a second palette; first reconcile original P144 acceptance against P109.
- P142 GitHub Pages deployment on main succeeded in workflow #192 (`44819441586`), all three build/report/deploy jobs passed. This closes the Pages deployment step only; real-origin browser checks and Windows/GTX 1650/RAM 7 GB, Firefox/WebKit/touch/physical-GPU acceptance remain open.
- PR #44 documentation reconciliation passed hosted verify run #320 (`44859258258`); artifact SHA-256 `74cb03f31a7c55d94f69376b74f46a22bef1538b473aeca1165c42296f2e69ba`. This run does not change the P70 disposition.
### P140 (phần biểu đồ dữ liệu)
- `canvio-p140-charts.js` (lot `canvio-lot140c`): thẻ "Biểu đồ từ dữ liệu" ở trang Tài nguyên. CSV/TSV (hỗ trợ ô có dấu ngoặc kép, số kiểu 1.234,5 và 1,234.5) → SVG cột/đường/tròn/donut, có title/desc, văn bản được thoát; tải SVG hoặc lưu thẳng vào Tài nguyên. Test: `node tests/p127/run-p140c-tests.cjs`, Chrome thật `tests/p145/run-p140-browser.py` (4 kiểu vẽ được, lưu vào kho).
- Chưa làm: mockup thiết bị/QR (đã có sẵn một phần), chế độ trình chiếu mở rộng, biểu đồ xếp chồng/scatter.

### P133 (phần bền vững) — OPFS + tự lưu + phục hồi sự cố
- `canvio-p133-resilience.js` (lot `canvio-lot133r`): kho tệp OPFS (rơi về IndexedDB `CANVIO_133` nếu không hỗ trợ), tên tệp được làm sạch (chặn path traversal). Tự lưu bản phục hồi mỗi 30 giây và khi ẩn/đóng tab cho MỌI engine có `snapshotState`/`restoreState` (mỗi engine 1 bản, ≤ 8 MB, bỏ qua khi không đổi). Phiên trước đóng đột ngột (cờ phiên chưa sạch, nhịp tim quá 90 giây) → thanh khôi phục từng engine. Thẻ "Bộ nhớ & phục hồi" ở Cài đặt: dung lượng, lưu ngay, xin lưu trữ bền vững, xoá bản phục hồi.
- Test: `node tests/p127/run-p133r-tests.cjs`; Chrome thật `tests/p145/run-p133-browser.py` (OPFS ghi/đọc 3 MB, chặn `../`, mô phỏng crash → tải lại → banner → khôi phục clip).
- Chưa làm (phần còn lại của P133): proxy 720p cho video 4K, Web Worker/OffscreenCanvas cho xử lý nặng, chuyển tài sản lớn của Asset Vault/Video sang OPFS; chưa thử dựng 10 phút 1080p; chỉ Chromium được kiểm.

### P144 (phần Command Palette + phím tắt + trợ giúp)
- `canvio-p144-ux.js` (lot `canvio-lot144u`): bọc `CV.palette.build` — thêm 15 lệnh cho công cụ mới (phân tích chất lượng, LUFS, khử ồn, SFX, mẫu, GIF, đo màu, web cuộn, trace, biểu đồ, giấy phép, font/data merge, bộ nhớ/phục hồi, trợ giúp), đưa 5 lệnh dùng gần đây lên đầu (localStorage `canvio144:recent`). Lệnh đưa người dùng tới thẻ công cụ (cuộn + focus + viền nháy); chỉ 3 lệnh chỉ-đọc tự chạy (phân tích chất lượng, đo màu, lưu bản phục hồi), không lệnh nào tự sửa timeline.
- Phím: F1 = trợ giúp theo trang (mẹo + phím tắt, khoá focus, Esc đóng); Alt+Shift+V/W/P/A/I/H/S/D chuyển trang (không đụng phím T/R/C/G của Poster và không bị chặn khi đang gõ vì dùng tổ hợp Alt+Shift).
- Test: `node tests/p127/run-p144u-tests.cjs`; Chrome thật `tests/p145/run-p144-browser.py` (14 mục).
- Chưa làm: hướng dẫn lần đầu (tour), trợ giúp riêng cho từng Studio còn lại, tìm mờ (fuzzy) và tìm xuyên tài nguyên/mẫu (P145.10 thuộc AI kia).

### P133 (phần Web Worker) — Khử ồn chạy nền
- `CVDenoiseP138.denoiseAsync` chạy thuật toán trong Web Worker (nguồn worker dựng từ chính hàm `denoise`/`fft`, không phụ thuộc DOM), tự rơi về luồng chính nếu Worker lỗi/không có, giới hạn 120 giây. `processClip` và nút Khử ồn dùng đường này.
- Đo trên Chrome thật (30 giây audio): kết quả giống hệt luồng chính (lệch 0), trang vẫn nhận sự kiện trong lúc xử lý. Test: `tests/p145/run-p133w-browser.py`.
- Còn lại của P133: proxy 720p cho video 4K, OffscreenCanvas cho tách nền/upscale, chuyển tài sản lớn sang OPFS.

### P144 (hướng dẫn lần đầu)
- `CVUxP144.startTour/closeTour/tourDone`: tour 4 bước ở trang chủ (chào mừng, Ctrl+K, thẻ bắt đầu, F1/Alt+Shift/tự lưu), làm nổi bật mục tiêu bằng viền, phím Enter/Esc/Tab, lưu `canvio144:tour`; tự bật 3,5 giây sau khi vào trang chủ lần đầu (không bật khi có thanh khôi phục sự cố, khi palette mở, hoặc khi `navigator.webdriver` = true để không chặn test tự động). Lệnh palette "Xem lại hướng dẫn nhanh" bật lại. Test: `tests/p145/run-p144t-browser.py` (12 mục, ẩn webdriver để chạy đường tự bật).
- Chưa làm: trợ giúp riêng cho từng Studio còn lại.



## P134.2 — Auto Reframe bản nhẹ (2026-11-21 · candidate)

- Quét: P134 Scopes đã có (canvio-p134-scopes.js, canvio-lot134s); Auto Reframe trước đó chưa có owner riêng. P65 đã cung cấp ví dụ local grayscale/SAD tracking nhưng P134.2 không tạo timeline hay ghi đè tracking API.
- Đã làm: source canvio-p134-reframe.js, lot dự kiến canvio-lot134r, API CVAutoReframeP134. Dò vùng nổi bật từ độ tương phản cạnh + sai khác giữa frame, tìm crop theo tỷ lệ dọc 9:16 / vuông 1:1, làm mượt đường focus.
- Đã gộp: dùng trang Video Engine và thẻ chất lượng P127 hiện hữu; một nguồn video do người dùng chọn; không tạo timeline, store, Asset Library hay Project Vault riêng.
- Bỏ: nhận diện mặt/vật thể bằng model tải thêm; upload; cloud sync; MP4 muxer. Lý do: chưa cần thiết cho bản nhẹ, trái nguyên tắc offline-first/không request nền hoặc không có hạ tầng đã xác minh.
- Export: WebM Canvas + MediaRecorder; 720×1280 cho 9:16, 1080×1080 cho 1:1. Âm thanh chỉ có khi captureStream() lấy được audio track; không đảm bảo codec giống nhau trên mọi trình duyệt.
- Giới hạn: ≤100 MiB, ≤60 giây, tối đa 48 frame phân tích ở kích cỡ tối đa 192×108. Heuristic có thể bám vào vùng nhiều texture/contrast thay vì chủ thể; cảnh ít chi tiết sẽ kém ổn định. Không nhận diện mặt/AI object detection; chưa có manual focus override.
- Test bổ sung: Node tests/p127/run-p134r-tests.cjs (11 assertion); Chromium UI/export và ffprobe tests/p145/run-p134r-browser.py. Kết quả hosted CI phải được kiểm trước khi đánh dấu merged/PASS. Nếu localhost bị chặn trong sandbox, ghi rõ môi trường, không tính là test ứng dụng thất bại.
- Trạng thái: candidate trên branch riêng, chưa merge. Việc tiếp theo: hosted run xác nhận Node, same-origin app boot, UI analysis, WebM decode/duration/audio; sau đó rà lại bằng video thật dài hơn và điện thoại thật.

## P124 — Responsive Auto Layout & Component variants (2026-11-21 · candidate)

- canvio-p124-autolayout.js / canvio-lot124 trong Website Engine hiện có; 5 preset Stack/Row/Grid/Split/Card và 4 card variants. Dùng CVWeb.addComponents() và CV.engines.web.save().
- Node tests/p124/run-p124-tests.cjs và Chromium tests/p124/run-p124-browser.py. Còn thiếu arbitrary component conversion, visual breakpoint editor, nested variant sync, drag/resize constraint handles, accessibility và real GrapesJS screenshot review.

## P133.2 — Proxy 720p cục bộ cho clip 4K (2026-11-21 · candidate)

- canvio-p133-proxy.js / canvio-lot133p đọc media từ owner hiện hữu và thêm proxy thành clip mới qua Video Engine importFiles; giữ clip gốc.
- WebM 30 fps, cạnh dài tối đa 1280 px, nguồn 4K ≤500 MiB / ≤180 giây; audio phụ thuộc captureStream. Không tự relink/replace clip.
- Node tests/p127/run-p133p-tests.cjs và Chromium 4K fixture + ffprobe/full decode tests/p145/run-p133-proxy-browser.py. P133 còn OffscreenCanvas cho tác vụ phù hợp và migration media lớn sang OPFS có quota/rollback.

## P144.3 — Trợ giúp theo từng Studio (2026-11-21 · candidate)

- CVUxP144 144.3.0 mở rộng TIPS theo các route CVWS đã đăng ký trong ba workspace Design, Website/Profile, Media và các trang utility. F1, palette, tour và navigation owner giữ nguyên.
- Node route coverage + Chromium đối chiếu tất cả CVWS routes; pending CI. Manual keyboard/screen-reader/wording review vẫn mở.


### P144.3 route-coverage correction — CI #354 (2026-11-21)

- Hosted Chromium confirmed the workspace registry contains 38 routes, not only the 25 initially covered. It identified 13 missing help topics: templates, brand, designSystem, responsive, collab, hub, platform, one, promptForge, insight, hallmark, guide and shield.
- Added page-specific guidance for all 13, using Guide-documented behavior and explicit boundaries (e.g. collab is local notes/activity, Prompt Forge is prompt handoff, Shield does not certify server headers).
- P133.2 passed all 11 Chromium checks in the same run, including actual timeline import, clip duration, audio, full decode and original preservation. P124 passed 9/9.
- Rerun required to verify all 38 CVWS routes have contextual help; no merge claim until that coverage check passes.

## Mainline reconciliation — PR #51 merged (2026-11-21)

- PR #51 merged: e4e3647b8b49dcc931065c3f7893f68b48d9a071. Hosted workflow #360 on the candidate and mainline workflow #362 both completed PASS (39/39 steps).
- P124 Auto Layout is now integrated: 5 layout presets + 4 component variants using the existing Website Engine add/save path. Chromium 9/9. Advanced breakpoint/component editing remains partial.
- P133.2 local proxy is now integrated: selected 4K clip → WebM, longest edge ≤1280 px, new clip via canonical importFiles, original retained. Hosted 4K fixture confirmed video, Opus audio and full decode. OffscreenCanvas/large-media OPFS migration remains.
- P144.3 contextual help uses the existing CVUxP144 owner and covers all 38 registered CVWS routes; hosted Chromium route-coverage test PASS.
- P143 remains in Phase 1 candidate branch: a 20-module standalone/embedded parity audit has passed pre-browser hosted gates in run #363; wait for the full workflow result before merge. This is not full index modularization.
- P70 still has fourteen open manual gates; not production-certified.

## P143 Phase 1 — final current-main candidate (2026-11-21)

- Branch work/p143-parity-current-main-final-20261121 re-applies the 20-module source parity manifest/audit after main commit 6481d83.
- Previous candidate run #363 passed the P143 gate and all 39 steps; current branch reruns same-origin browser matrix and build against the latest main.
- Phase 1 is an integrity control for 20 sources, not a full index split. Full script/style inventory, dependency DAG and staged reversible extraction remain open.


## P134.2 browser duration assertion correction (2026-11-21)

- Root cause found in hosted rerun: WebM did not carry format/stream duration and ffprobe reported `r_frame_rate=60/1` while `avg_frame_rate=0/0`, producing an invalid calculated duration (2.05 s for a ~4.1 s output).
- Updated `tests/p145/run-p134r-browser.py` to prefer video packet PTS range + median packet duration, use actual format/stream duration when available, and reserve the exporter-configured 30 fps fallback for the case where packet timestamps are missing. Added PTS diagnostics.
- This changes test measurement, not the exporter or 3.5–4.5 s acceptance range. Current-main hosted rerun #373 pending.

## P143 Phase 2 — full inline script inventory (2026-11-21 · candidate)

- Added tests/p143/build-inline-source-inventory.cjs to enumerate all script tags from the rebuilt canonical index.html in exact browser order. Records each script's ID/type/src/async/defer flags, bytes, SHA-256, detected globals and heuristic known-global reads.
- Generates tests/p143/inline-source-inventory.json, packaged into the candidate ZIP and hosted evidence artifact.
- This is a full script-tag inventory, not semantic dependency graph. It does not inventory all CSS/template/dynamic script paths or change any loading order. Full P143 extraction remains open until dependencies/boot order are reviewed and extraction staged.

## Final reconciliation — P124 / P133.2 / P134.2 / P143 / P144 (2026-11-21)

- PR #51 merged P124/P133.2/P144.3. Candidate #360 and main #362 passed; post-P143 main run #385 passed 41/41. Pages #222 passed build/deploy/report.
- P124: five responsive layouts/four variants, existing Website Engine adapter, Chromium 9/9. Advanced component conversion, visual breakpoint editor, nested variants, drag/resize and accessibility remain partial.
- P133.2: 4K-to-720p WebM proxy inserted as new clip, original retained; hosted 4K fixture verified 1280×720, Opus, full decode, no page errors. OffscreenCanvas/large-media OPFS migration remains.
- P134.2: packet timestamps measured 4.063 s from 123 packets, VP9 720×1280 + Opus, full decode and no page errors.
- P144.3: contextual help covers all 38 CVWS routes; F1 and tour browser tests pass.
- P143 Phase 1/2: parity gate covers 20 standalone modules; canonical inventory committed at tests/p143/inline-source-inventory.json (150 inline script tags, zero external src, zero duplicate IDs). Full semantic dependency DAG and reversible project-wide extraction remain open.
- P70 is still NOT certified: fourteen manual real-world gates remain. P130 cloud sync needs real Supabase/RLS/two-device test; P122.3 MCP requires an approved security/transport contract.


## P143 parity map extension — 27 standalone modules (2026-11-21 · candidate)

- Central source map now covers 27 sources: the prior 20 plus P127 Loudness/Templates, P133 Resilience, P134 Scopes, P138 Denoise, P140 Charts and P145 SFX.
- These seven already have standalone/embedded comparison in individual module suites; the P143 gate centralizes the same check. No runtime change or script reordering.
- Hosted parity/Chromium workflow pending. Full dependency DAG, CSS/template/dynamic-loader inventory and reversible project-wide extraction remain open.

## P143 final parity expansion — 2026-11-21

- PR #55 merged (`d8b37533b5699bb495b88dea50da2a8f9e48e8d9`), expanding the central source parity gate from 20 to **27** standalone/embedded modules.
- Hosted candidate #386 and mainline #387 both passed **41/41**. Pages #224 and #225 completed successfully.
- The seven additions are P127 Loudness/Templates, P133 Resilience, P134 Scopes, P138 Denoise, P140 Charts and P145 SFX. No runtime script/order changes.
- P143 script-tag inventory: 150 tags, all inline, no external `src`, no module/async/defer, 147 unique IDs and zero duplicate IDs.
- This does not close full P143. Semantic dependencies/boot order, all CSS/templates/dynamic loader inventory, reversible project-wide extraction, offline/PWA/CSP and rollback remain open.
- P70 remains NOT certified (14 manual gates). P130 blocked on real Supabase/RLS and two-device tests. P122.3 waits for approved MCP security/transport contract.


## Engineering continuation — 2026-11-21 candidate P124.2 / P133.3 / P143.3

- P124.2 candidate: configurable breakpoint and column controls (mobile/tablet/desktop), title/description/gap/min-width controls and instance-scoped media queries. It remains on the existing Website Engine CVWeb.addComponents() → CV.engines.web.save() path. The increment does not add a store/editor.
- P133.3 candidate: adds Blob Worker + OffscreenCanvas scaling for the existing 4K-to-720p proxy pipeline, with single-frame backpressure, cleanup and main-thread fallback. The Video Engine remains the media/timeline owner; source clip is preserved. Large-media OPFS migration remains open.
- P143.3 candidate: adds CSS/style/template/dynamic-loader inventory and heuristic global producer/consumer candidate report to the hosted workflow. No runtime code order is changed and no source is extracted by this increment.
- Acceptance: Node and Chromium assertions are expanded. Status remains candidate / hosted verification pending until PR and mainline CI are inspected. Do not update completion rows to PASS before the workflow evidence exists.
- Still blocked or deferred: P130 Cloud Sync needs a deployed user-owned Supabase project/schema/RLS and credentials; P122.3 MCP needs an approved transport/auth/consent/permission/threat contract. P70's 14 production/manual gates are deliberately deferred by the user for later real-world testing.



## P119 shared easing editor + simple Lottie export (2026-11-21 · candidate)

- New `canvio-p119-easing.js` (CVEasingP119, embedded lot `canvio-lot119e`): draggable cubic-bezier graph in the Motion page card, six presets, spring approximation via CSS `linear()`, and Lottie JSON export (one rounded-rectangle layer, fade/slide/scale keyframes using the edited curve).
- Integrates through the existing `#motionEase` select by adding a "Tuỳ chỉnh (đồ thị)" option; no existing option or Motion function was removed.
- Tests: `tests/p127/run-p119e-tests.cjs` (Node, standalone + embedded parity) and `tests/p145/run-p119-browser.py` (real Chrome: mount, handle drag, preset, valid Lottie JSON, zero page errors). App smoke 21/21.
- Limits: Lottie output is not validated with lottie-web/dotLottie player; single layer only, no expressions/masks; graph editor is not yet shared with Video Engine keyframes or Website Motion Builder; `linear()` needs a recent browser.


## P118 Wordmark outline + real kerning (2026-11-21 · candidate)

- New `canvio-p118-wordmark.js` (CVWordmarkP118, embedded lot `canvio-lot118w`) on the Brand page: choose a local .ttf, type text, tracking and kerning toggle, preview, download SVG outlines, or save into the Asset Library via `CV.assets.addBlob`.
- Pure-JS TrueType reader: cmap 4/12, glyf (simple + composite), hmtx, `kern` format 0 and GPOS PairPos formats 1/2. Quadratic contours become SVG path.
- Tests: `tests/p127/run-p118w-tests.cjs` (Node; needs Liberation Sans or `CANVIO_TEST_TTF`) and `tests/p145/run-p118-browser.py` (real Chrome: outline raster vs Chrome's own text — ink width 476 vs 476 px, area within 0.5%; kerning narrows; bad font rejected; zero page errors). Smoke 21/21.
- Limits: .ttf only (no CFF .otf, .woff/.woff2, variable fonts); no GSUB ligatures, single line, no complex-script shaping; no Paper.js boolean ops/path editing; kerning from GPOS covers PairPos only (no mark/contextual).


## P141 Font manager + Vietnamese coverage check (2026-11-21 · candidate)

- New `canvio-p141-fonts.js` (CVFontsP141, embedded lot `canvio-lot141f`) on the Brand page, reusing the P118 TrueType reader. Choose up to 12 local .ttf files: family/style names, weight, serif/sans (OS/2 PANOSE), variable-font flag (fvar), kerning flag, and coverage of 146 precomposed Vietnamese characters with the missing list. Live preview line uses the loaded font; heading+body pair suggestions come only from fully covered serif+sans fonts; JSON report download.
- Tests: `tests/p127/run-p141f-tests.cjs` (Node; Liberation Sans = complete, Caladea Bold = partial, override with `CANVIO_TEST_TTF` / `CANVIO_TEST_TTF_PARTIAL`) and `tests/p145/run-p141-browser.py` (real Chrome: two fonts, complete vs partial rows, preview font applied, report JSON, bad file skipped, zero page errors). Smoke 21/21.
- Limits: .ttf only; "complete" means precomposed glyphs exist, not that mark placement is good; no license check; no bundled offline font pack (fonts must come from the user); pairing is heuristic.


## P128.1/.2/.4 AI task orchestrator (2026-11-21 · candidate)

- P128.1 (provider config) is merged into existing owners, not rebuilt: API Hub (`#cv11Provider`, `CVAIProviderAdapter`) and Local AI Studio (Ollama/LM Studio, loopback only) already provide URL/model/test-connection.
- New `canvio-p128-orchestrator.js` (CVOrchestratorP128, embedded lot `canvio-lot128o`), card `#cv128-card` in the Platform Hub → **API Hub** tab: text/caption/brief tasks go local → Gemini (order selectable: local-first / gemini-first / local-only / gemini-only), at most one call per tier per action, 45 s timeout, automatic fall-through on error/empty answer, per-tier latency/success stats, bounded in-memory cache (50 entries). Image/video kinds run only if a handler is registered (`register(kind,tier,fn)`, e.g. ComfyUI later); otherwise it honestly reports "chưa cấu hình".
- Tests: `tests/p127/run-p128o-tests.cjs` (Node, 17 checks incl. fallback, timeout, cache eviction, bad input) and `tests/p145/run-p128-browser.py` (real Chrome against a local mock OpenAI-compatible server: answer, stats, cache without 2nd call, 503 fall-through reported, image unconfigured, order persists, no key stored). Smoke 21/21.
- Limits: only latency/error rate is measured, not answer quality; no ComfyUI/image handler exists yet (P120/P126); Gemini tier needs the user's own key and network; not tested against real Ollama/LM Studio.
- P128.3 (JSONL export) was already delivered earlier in P145 core.


## P137 paragraph styles + automatic table of contents (2026-11-21 · candidate)

- New `canvio-p137-styles.js` (CVStylesP137, embedded lot `canvio-lot137s`): row `#cv137-row` under the Layout Foundry toolbar. Five named paragraph styles (Tiêu đề 1/2, Thân bài, Trích dẫn, Chú thích); apply to the selected block(s) via `data-cv137-style`; "Cập nhật kiểu từ đoạn này" redefines the style from a sample paragraph and restyles every block carrying it on all pages; "Mục lục" collects h1–h3 / heading styles from all pages with real document page numbers and inserts/refreshes a TOC block at the top of page 1 (never counted in itself, no duplicates); one-step Undo. Works through the existing `CVNativeEngines.layout.snapshotState/restoreState` owner.
- Style definitions: whitelisted CSS properties only, localStorage `canvio137:styles` (UI convenience, not in exported files).
- Tests: `tests/p127/run-p137s-tests.cjs` (Node, sanitising/escaping/fallback) and `tests/p145/run-p137-browser.py` (real Chrome, 11 checks: apply, switch clears old props, redefine → other page restyled, TOC entries+pages, rebuild without duplicate, undo, empty TOC message, zero page errors). Smoke 21/21.
- Limits: no multi-frame text flow, no nested character styles, tables stay with the existing Layout Foundry insert (no table styles); TOC page numbers are document page order, not print pagination; style set is fixed to the five defaults plus edits (no UI to create new names yet); TOC entries are static until rebuilt.


## Verified update — 2026-11-21 — P124.3

- PR #63 (selected Website Engine component responsive breakpoints) merged to `main` as `ed6679faec689483db62eb718aa55e068866618b` after hosted candidate workflow run #444 succeeded.
- Hosted Chromium evidence: P124 UI interaction **15/15**; selected component received a scoped class, desktop/tablet/mobile rules were written through GrapesJS CSS Manager, canonical `CV.engines.web.save()` was called, save failure was surfaced, mobile viewport had no overflow, and page errors were zero.
- The workflow also completed its existing regression/runtime steps successfully, including the P133.2 proxy and P133.4 OPFS checks in run #444. This does not close remaining P124 advanced component editing or P133 migration work.
- PR #64 P135.1 is NOT merged: its hosted run #467 failed at the unrelated P133.2 proxy gate with UI status `Tạo proxy vượt thời gian cho phép.`; no page errors were reported. Its head is now non-mergeable against the updated main and must be rebased/cleaned before another acceptance run. Do not mark P135 complete.
- PR #65 is a duplicate/stale P139 candidate (mergeable=false; no hosted run). PR #66 is the clean P139.1 candidate stacked on the P135 branch (no hosted run yet); keep P139 partial and do not merge before the P135 base is accepted.
- P135.1 remains a partial non-destructive adjustment stack; reload persistence, masks/local corrections, smart objects, clone/patch and liquify remain open. P139.1 remains partial; precomp, physical motion blur, word/range selector, expanded keyframe editor and real-project/export acceptance remain open.


## Verified mainline update — 2026-11-21 — P133/P135

- PR #68 merged P133 proxy reliability and P135.1 Pixel adjustments. Mainline workflow run 44912553516: 45/45 steps passed (with candidate branch runs #44911472539 44/44 and #44911475373 45/45).
- P133 fix now handles both a stalled createImageBitmap(video) capture and a stalled Worker frame. Separate watchdogs cause safe fallback to the existing Canvas2D renderer; end-of-range logic avoids requesting a new worker frame after the video ended. Original clip and Video Engine data owner remain unchanged.
- P135.1 supplies nine non-destructive adjustment types, ordered stack, enable/disable/rename/reorder/delete/reset, bounded undo/redo and derived canvas export through the existing Asset Library.
- P135 still lacks reload persistence for stack metadata because the current Pixel document snapshot is flattened PNG; masks/local corrections, smart objects, clone/patch and liquify remain open.
- P133 real long footage, unusual codecs, physical devices; P135 reload persistence/real edit documents remain follow-up.
- PR #70 P139.1 and PR #71 P120/P126 are separate candidates, not mainline-complete until their own CI and merge.


## P139.1 — Motion Lab live renderer continuation

- Parent/Null hierarchy and per-character Text Animator are now wired into the actual existing Motion Lab draw pass, instead of only persisting metadata.
- The renderer adapter uses the existing #mlCanvas context and the existing motionLab.draw/snapshot/restore owners; no extra timeline, rendering canvas or state store is introduced.
- Null parenting preserves world position; cycle checks and nested transforms are bounded. Animator modes: rise, fade, scale, wave, tracking; P119 easing presets are reused.
- Hosted Chromium tests must confirm a rendered output difference between active/inactive animator states. Keep real project/export, precomp, word/range selection, advanced keyframes, motion blur and physical GPU performance as open follow-up scope.


## Verified mainline update — P120/P126 — 2026-11-21

- PR #73 merged as edd18a7abbed57e2; hosted CI #44914277311 passed 48/48.
- Local ComfyUI bridge connects through existing P128, supports user-imported API-format workflow JSON, explicit prompt/media input mapping, optional image/video upload, queue/history polling, output retrieval and Asset Library addBlob handoff.
- Endpoint is strict loopback-only; no cloud API keys, auto model download, custom-node installer or second provider/store. Browser local-network permission and exact ComfyUI CORS origin may still be required.
- Mock CI validates connector plumbing, not actual ComfyUI, GPU inference, model compatibility/licensing, RIFE/Real-ESRGAN or video output quality. Keep P120/P126 partially complete until the real local model environment is tested.


## P120/P126 — Local ComfyUI workflow adapter

- Adds a free/local ComfyUI API bridge to the existing P128 orchestrator. The user imports an API-format workflow JSON, optionally uploads media, maps prompt/media node inputs, queues the workflow and saves output through the existing Asset Library.
- Supports image, upscale, video and interpolation routes, but the API workflow/model/custom-node graph remains user-provided. Real-ESRGAN, RIFE and AI video are not bundled; compatible free local nodes/models must be installed by the user.
- Strict loopback-only URL allowlist, explicit user action, no cloud provider/API keys, bounded polling and request/file sizes, safe workflow cloning and individual output retrieval.
- Hosted mock-server CI validates integration only. Actual ComfyUI/CORS, model licensing, GPU memory, speed and output quality remain real-environment acceptance.

## P137.2 — Character and table formatting

- Extended the existing Layout Foundry style module with five character styles (bold, italic, highlight, code, small-caps) applied to selection within one paragraph, and three reusable table presets (grid, report, minimal).
- Inline style metadata is stored inside existing page HTML; style definitions remain localStorage convenience. Rehydration reapplies paragraph, character and table definitions without adding another editor/store.
- Multi-block selection, nested character styles, table formulas/merged cells/sort/filter and print pagination remain outside this increment.

## P119.2 — Share easing with Video Engine transitions

- Extends the existing P119 CVEasingP119 presets and cubic-bezier solver to P145.2 shader transitions and video-only MP4 transition export. Default stays linear to preserve current output.
- Named presets and "custom from Motion" map to P119.PRESETS / P119.parse. The same derived easedProgress is used in WebGL and Canvas2D fallback; P79 export sequence passes the same options per frame.
- P139.1 and P145.2 now consume the shared P119 easing module. Video Engine clip/keyframe easing and Website Engine/CSS timeline remain open.

## P135.2 — Pixel adjustment snapshot persistence (2026-11-21 · hosted candidate)

- The existing Pixel snapshot API continues to return a PNG Data URL. P135.2 stores its bounded adjustment stack in a CRC-checked PNG tEXt metadata chunk, and restoreState() rehydrates it without a second database or changing raster pixels.
- Node and Chromium tests cover metadata round-trip, source-raster identity, preview, export, reload and native restore. Keep cloud/two-device sync, non-PNG re-encoding, masks, smart objects and advanced pixel tools as separate acceptance scopes.


## Verified mainline updates — 2026-11-21 — P137.2 / P119.2 / P135.2

- **P137.2** merged through PR #76 at `fa6c6c4372fff076a950fa2a17e693cbd058c55f`. Candidate workflow #534 and post-merge mainline #535 both passed 51/51. Hosted Chromium verified selected-character styling, three table presets and HTML rehydration; P143 parity was 31/31 at that point. Remaining: cross-paragraph character selection, nested style editing, advanced table semantics and print pagination.
- **P119.2** merged through PR #78 at `3b53b8d5128aa5b773bef725183b5151b029b612`. Candidate workflow #536 and post-merge mainline #538 both passed 52/52; Pages #271 passed build/report/deploy. Node reports `P119 OK` and `P145.2 OK`; Chromium confirms that the shared P119 preset/custom curve changes the actual P145.2 shader/Canvas2D output. Linear remains the default. Video Engine clip/keyframe easing and Website Engine/CSS timeline integration remain open.
- **P135.2** merged through PR #81 at `33f68481d52ca9445d0d3dae05d1cfb903b81487`. Candidate workflow #547 and post-merge mainline #549 both passed 53/53; Pages #273 and #274 passed deployment. P135.2 keeps the existing Pixel snapshot API as a PNG Data URL and stores a bounded, CRC-checked `CANVIO.P135` tEXt chunk with adjustment metadata. Chromium verified snapshot restore, reload/restore, unchanged raster, undo/redo and zero page errors. P143 parity is now 32/32 after registering P135.2.
- These are automated local/hosted-browser checks, not physical-device acceptance. P135.2 does not prove cloud/two-device sync; third-party PNG re-encoding may strip the ancillary metadata. P70 remains releaseCertified=false with fourteen manual gates open.

## P143.4 — lexical global-reference evidence candidate — 2026-11-21

- Candidate PR #83 is being rebuilt on the latest mainline after P135.2. The dependency-free scanner records static global writes, reads, simple top-level declarations, source order and SHA evidence; it adds no runtime code and moves no script/style/template or boot order.
- Its output is a lexical candidate map, not a semantic dependency/data-flow DAG. Template interpolation, destructured/aliased globals, computed names, eval, conditional execution and call-time ordering remain unproven. P143 Phase 3 staged extraction is still open until human-reviewed boundaries plus rollback, app regression, offline/PWA and CSP acceptance pass.


## Verified mainline update — P143.4 — 2026-11-21

- PR #83 merged to main as `29acd1192da8e42bad845248b1110d30a6cbfc44`. Post-merge workflow #551 passed 53/53; GitHub Pages #275 passed build/report/deploy.
- P143 standalone/inline parity 32/32; lexical scanner fixtures 14/14; style/template/loader inventory verifier 17/17. Inventory: 119 style blocks, 1,490 inline style attributes, 78 dynamic loader sites, 456 lexical dependency candidates, 33 unresolved references and 209 same-script references.
- The 456 edges are lexical order evidence, not semantic runtime dependencies or a reviewed AST/data-flow graph. Template interpolation, destructured/aliased names, computed properties, eval, conditional writes and call-time order remain unproven. P143 Phase 3 staged extraction/rollback/offline/PWA/CSP remains open.


## P119.3 Video Engine keyframe easing — candidate — 2026-11-21

- Adds the six existing `CVEasingP119.PRESETS` to the native Video Engine keyframe inspector and a safe "Lấy đường cong từ Motion" action for cubic-bezier values from the existing `#motionEase` control. `linear()` spring output is rejected as a non-Bezier curve rather than approximated silently.
- Writes only the existing `#vtKFEasing` and `#vtKFCurveX1/Y1/X2/Y2` controls. The user still commits through native `CV.engines.video.apply()`; existing `vPushUndo`, clip motion, timeline save, `snapshotState()` and `restoreState()` remain the owners.
- The canonical `vMotionEase` evaluator delegates to `CVEasingP119.bez` only when the stored values can be represented without P119 normalisation loss (Y >= -1 and at most three decimal places). Legacy Video Engine curves outside that domain use the original evaluator, preserving old projects.
- Candidate files: `canvio-p119-video.js` / `canvio-lot119v`, `tests/p127/run-p119v-tests.cjs`, `tests/p145/run-p119v-browser.py`; P143 parity is extended from 32 to 33 module pairs.
- No new timeline, project database, localStorage/IndexedDB key, history stack, editor or easing registry is introduced. Website Engine/CSS animation timeline integration, real footage, physical GPU and target-device frame-rate acceptance remain open pending hosted and manual checks.

## P119.3 — Video Engine keyframe easing (2026-11-21)

- Add the single P119 preset registry to the existing Video Engine motion inspector. Presets populate existing cubic-Bezier controls; user Apply persists via the existing canonical clip/timeline and undo path.
- Internal motion interpolation delegates to P119.bez where normalisation is lossless; unsupported legacy curve ranges retain the original evaluator. No second timeline or easing engine.
- Website Engine/CSS animation timeline integration remains a separate open P119 increment; hardware GPU/60 fps and real footage acceptance are not inferred from software Chromium.

## Verified P143.4 mainline — 2026-11-21

- PR #83 / commit 29acd119; post-merge workflow #551 53/53 and Pages #275 PASS. P143 parity 32/32, scanner 14/14, inventory verifier 17/17.
- 456 lexical provider/consumer candidates, 33 unresolved reads, 209 same-script references. Not a semantic dependency graph; Phase 3 extraction/rollback/offline/CSP remains open.

## P119.4 — P119 shared easing for Website Motion Builder

- Reuse CVEasingP119.PRESETS and the existing #motionEase cubic-Bezier graph in Website Motion Builder. A selected component receives the curve through the original P47 Apply/Save path and exports it through the original Website Publish QC runtime.
- There is one source of truth for named curves; CSS linear() spring remains a separate representation and is not coerced into Bezier. Reduced-motion fallback remains enabled.
- The graph remains in Motion; Website Engine intentionally shares the curve rather than opening a second graph or timeline. Manual author-project, deployed-host CSP and accessibility checks remain open.


## P146.1 — Home Guided Creative Workflows (2026-11-22)

- Nâng cấp Home CANVIO hiện hữu bằng bộ chọn 5 quy trình theo mục tiêu: HR, Business/Finance, Training/Internal, Marketing/Brand và Video/Content.
- Mỗi quy trình dùng brief mẫu có placeholder, đưa về `#homePrompt` / `#homeKind`, rồi điều hướng tới đúng trang và trường nhập hiện có. Shared Core được tái sử dụng; brief dự án hiện tại không bị ghi đè khi đã có nội dung khác.
- Đây là orchestration UI; không bổ sung editor, template database, provider AI, network request hoặc persistence namespace. Việc tạo sản phẩm vẫn do người dùng thực hiện trong Studio.
- Automated acceptance: P146 Node source/inline contract và hosted Chromium route/brief tests. Real user content, keyboard/screen reader, physical mobile and real-project acceptance remain manual.


## P114.1 Restore hidden entry points: "AI & cài đặt", "Dự án & xuất", Spatial Workspace (2026-11-22 · candidate)

- Reported by the owner: after the shell navigation (`data-nav=shell`, P114) the old sidebar (`#side`, `#ws-tabs`) is hidden, so only four spaces remained in the Studio menu and the "◈ Spatial" launcher (`#cv229-open`, Ctrl/⌘+Shift+I) was `display:none`. "Dự án & xuất" (Alt+4) and "AI & cài đặt" (Alt+5) were reachable only by hotkey, Ctrl+K or the Home cards.
- New `canvio-p114-nav-restore.js` (CVNavRestoreP114, embedded lot `canvio-lot114n` + `canvio-lot114n-css`): appends both spaces to the P109 Studio menu (same `data-route` handler → `CVWS.open`), marks them `aria-current`, updates footer to "Alt+0–5", adds palette entries, and shows the Spatial button in the top bar under shell mode. P109/P110 lots are untouched.
- Tests: `tests/p145/run-p114n-browser.py` (real Chrome, desktop 1440 and mobile 390: 20 checks incl. Spatial inspector opens, six routes, AI/Projects open, old routes still work, menu inside viewport, zero page errors); `tests/p109` and `tests/p110` still pass; smoke 21/21; screenshot checked.
- Limits: the classic sidebar itself stays hidden in shell mode (by design of P114); this only restores the entry points. Not checked on real touch devices.

- P114.1 addendum (2026-11-22): the three-dot "Thêm tuỳ chọn" button (`#l42-btn`) now shows an SVG sliders icon (theme-coloured via CSS mask; label/handlers untouched). On ≤560 px the top bar was already wider than the screen (this button sat off-screen at x≈412 of 390); the lot now keeps only the save-state dot, makes Spatial icon-only and tightens padding so the button is on-screen. Chrome test extended (icon is SVG, button still opens its menu; desktop + mobile).

## P150 · Tổng quan: 3 kiểu giao diện (đã làm, chờ nghiệm thu)
- `canvio-p150-home-sky.js` (lot `canvio-lot150h`), bộ chuyển `#cv150-skins` (localStorage `canvio.homeSkin` = tech | fashion | sky | classic).
- **Công nghệ (tech, mặc định):** nền tối có lưới + vệt sáng; hero HR "Thương hiệu nhân sự, dựng trong một phút": ô mô tả tự gõ, dựng 3 sản phẩm HR (poster tuyển dụng, banner, thẻ nhân viên) xếp lớp 3D nghiêng theo con trỏ; nút Dựng ngay chuyển mô tả sang ô Việc cần làm (#ws-jin/#ws-jgo); dải 5 không gian tối có ánh sáng theo con trỏ.
- **Bàn thiết kế (sky):** pasteboard + thước; hero có bàn thiết kế chạy thật (4 tab Poster/CV 3D/Website/Video, kéo chữ có đường gióng, 5 chấm màu, nút mở đúng Studio); 5 không gian là khung giấy kéo ngang.
- **Thời trang (fashion):** bìa tạp chí: chữ "canvio" serif khổng lồ đè lên vòm xanh Klein (mix-blend difference), 5 không gian là bìa dọc đặc màu kéo ngang.
- **Cổ điển:** giao diện cũ, không đổi.
- Test: `tests/p145/run-p150-browser.py` (43 check, desktop + mobile). Phần cũ (cvHero, ws-jobs, Hub, P146…) giữ nguyên chức năng.
- **Nút chính đồng bộ:** mọi kiểu (trừ Cổ điển) dùng nút vàng #FFD84A chữ đen; nút Xuất trên thanh menu cũng vàng đen ở mọi trang. Tab chọn của bộ chuyển kiểu cũng vàng đen.
- **Cập nhật (P150.13):** giao diện Tổng quan MẶC ĐỊNH lại là Cổ điển (khóa lưu mới `canvio.homeSkin.v2`, mọi máy về cổ điển). Các kiểu Công nghệ/Thời trang/Bàn thiết kế là tuỳ chọn thử ở bộ chuyển góc trên Tổng quan. Sửa lỗi rò rỉ: trang Tổng quan chỉ hiện khi `.active`, bộ chuyển kiểu chỉ hiện ở Tổng quan; bỏ ghi đè màu nút Xuất ngoài Tổng quan (các không gian giữ nút hồng gốc).

## P118.2 — Phông .woff (2026-11-22)
- Trang Thương hiệu đọc được .woff (WOFF1, giải nén zlib bằng DecompressionStream) qua `CVWordmarkP118.parseAsync`; `parse` đồng bộ vẫn từ chối woff. Kiểm bằng `tests/p127/run-p118w-tests.cjs`: WOFF dựng từ TTF cho SVG giống hệt TTF, tệp cắt cụt bị từ chối.
- Còn lại: .woff2 (Brotli), .otf/CFF, ligature, Paper.js boolean.

## P124.4 — Selected component layout application

- Apply Stack/Row/Grid/Split to the existing selected Website component through scoped CSS and data attributes; preserve its element and child tree.
- Apply the existing Surface/Outline/Elevated/Soft design variants to the same component via validated metadata and GrapesJS CSS Manager.
- Keep the existing breakpoint editor, component insertion, Website save and undo/project ownership. Nested variant graphs, drag/resize and arbitrary DOM conversion are not implied.

## P137.3 — Luồng chữ sang trang sau (2026-11-22)
- Dàn trang: nút "Chảy sang trang sau" (`#cv137-flow`, `CVStylesP137.flowNext`) đẩy các khối cuối tràn khỏi trang hiện tại sang đầu trang kế (tự tạo trang mới, tự chảy tiếp qua các trang sau), đo bằng bản sao ẩn theo khổ giấy `#lfSize`; hoàn tác bằng nút Hoàn tác hiện có.
- Kiểm: `run-p137s-tests.cjs`, `tests/p145/run-p137-browser.py` (40 đoạn tràn → giữ đúng thứ tự, thêm trang, hoàn tác). P137.4–6: đoạn văn dài được cắt theo từ giữa hai trang, kể cả đoạn có đậm/liên kết bên trong (giữ nguyên thẻ và kiểu; đoạn có ảnh/br/bảng chuyển nguyên khối). Chưa có: khung chữ tự do liên kết trên poster, kiểu tên mới.
- P119 (kiểm bằng lottie-web thật): chưa làm được trong môi trường này (không có lottie-web, Bash không có mạng); cần thêm bước `npm i lottie-web` trong CI hoặc tệp thư viện đính kèm.

## P137.5 — Tạo kiểu đoạn tên mới (2026-11-22)
- Dàn trang: ô "Tên kiểu mới" + nút "Tạo kiểu mới" (`CVStylesP137.createStyle`) lấy định dạng thật của đoạn đang đặt con trỏ, lưu vào bộ kiểu, gắn cho đoạn đó và thêm vào danh sách; từ chối tên trùng hoặc tên không hợp lệ. Kiểm trong `tests/p145/run-p137-browser.py`.

## P118.3 — Phông .otf (CFF) (2026-11-22)
- `CVWordmarkP118.parse` đọc OpenType CFF (OTTO, cả .otf bọc trong .woff): bộ thông dịch charstring Type 2 (lineto/curveto đủ biến thể, flex, subr cục bộ/toàn cục, hintmask), xuất đường cubic `C` trong SVG; kerning/GPOS dùng chung với TTF. Chưa hỗ trợ CFF2, CID-keyed, .woff2 (Brotli).
- Kiểm: `run-p118w-tests.cjs` với `tests/p127/fixtures/subset-cff.otf` (tập con TeX Gyre Termes, giấy phép GUST) so số đường/đường cong/bbox với fontTools cho A, a, g, o.
- P119: workflow riêng `canvio-lottie-web.yml` + `tests/p145/run-p119-lottie-web.py` chạy Lottie xuất bằng lottie-web thật (đã chạy xanh trên CI: lottie-web nạp được tệp xuất, 32 khung, vẽ SVG, hình đổi theo khung).

## P133.5 — Mọi chỗ đọc media đều hiểu OPFS (2026-11-22)
- Phát hiện: P133.4 chuyển media >32MB sang OPFS (bản ghi IndexedDB chỉ còn con trỏ `storage:'opfs'`), nhưng vài chỗ vẫn đọc thẳng `record.blob` nên không thấy tệp lớn: Audio Studio/waveform (`getBlob`, `blobFor`), khử ồn P138, đo âm lượng P127, tạo proxy preview và chuyển proxy/gốc. Đã vá tất cả để rơi về `CVMediaOPFSP133.get` khi bản ghi là con trỏ OPFS.
- Kiểm: `tests/p145/run-p133r2-browser.py` (34MB lưu OPFS → Audio Studio đọc đúng 34MB, xóa xong trả null); P138/P133 node + Chrome và smoke 21/21 vẫn qua.
- P133 còn: chuyển Asset Library/Project Vault (kho khác) sang OPFS — chưa làm, kho video là phần đã chuyển.

## P143 Phase 3 — đồ thị thứ tự nạp (2026-11-23)
- `tests/p143/build-boot-order-graph.cjs` dựng đồ thị phụ thuộc từ inventory 164 script: 39 script độc lập (leaf), 121 script phụ thuộc theo thứ tự (chỉ đọc global do script đứng trước cung cấp), 4 tham chiếu tiến (CV, LS, CVUnifiedLayers — chỉ an toàn khi đọc muộn). Kết quả ở `tests/p143/boot-order-graph.json`; CI chạy `--check` và đỏ nếu xuất hiện tham chiếu tiến MỚI.
- Đây vẫn là phân tích heuristic (như inventory), chưa phải trích tách mã. Việc tách thật ra tệp ngoài mâu thuẫn mục tiêu "một tệp HTML", nên giai đoạn tiếp theo chỉ nên trích các script `leaf-standalone` có parity test, và chỉ khi bạn muốn.

## P124.5 — Hiển thị theo thiết bị cho phần tử đang chọn (2026-11-23)
- Website Engine: ba ô "Hiện trên Desktop/Tablet/Mobile" + nút "Áp dụng hiển thị theo thiết bị" (`CVAutoLayoutP124.applyVisibilityToSelected`): ẩn phần tử bằng `display:none!important` trong đúng khoảng breakpoint (desktop > tablet, tablet giữa, mobile ≤ mobile), không chồng lấn, chặn ẩn cả ba, đặt `data-canvio-hide`, lưu qua `CV.engines.web.save`. Đọc breakpoint từ các ô responsive hiện có.
- Kiểm: `run-p124-tests.cjs` (29 kiểm), `run-p124-browser.py` (22). Chưa chạy trên GrapesJS thật (test dùng adapter giả như các bước P124 trước).

## P137.7 — Khung chữ liên kết trong Designer (2026-11-23)
- `canvio-p137-frames.js` (CVFramesP137, lot `canvio-lot137f`): hàng "Khung chữ liên kết" trong thanh công cụ Designer. Chọn một khung chữ (Konva Text) → "Thêm khung kế tiếp" tạo khung mới cùng kiểu bên dưới (hoặc bên cạnh nếu hết chỗ) và chữ tràn khỏi khung trước tự chảy sang; "Chảy lại chữ" sau khi sửa chữ ở bất kỳ khung nào; "Gỡ liên kết" giữ nguyên chữ. Chữ tràn khỏi khung cuối được giữ ở `cvChainTail` (không mất), thông báo "còn chữ tràn". Đo bằng `Konva.Text.measureSize` cùng font/độ rộng với hiển thị.
- Kiểm: `tests/p127/run-p137f-tests.cjs` (cắt dòng, mất chữ, đoạn, từ dài) và `tests/p145/run-p137f-browser.py` (Konva thật: 2→6 khung, không khung nào vượt sức chứa, sửa rồi chảy lại, gỡ liên kết).
- Giới hạn: khung liên kết chọn qua một khung (Designer chỉ chọn một nút một lúc); chưa có liên kết giữa Designer và Poster cũ, chưa kéo đổi kích thước khung tự chảy (bấm "Chảy lại chữ").

## Công cụ kiểm tra GPU/ComfyUI một lần (2026-11-23)
- `tools/canvio-gpu-check.html`: trang tự chứa, mở bằng Chrome/Edge trên máy có GPU. Đọc WebGL2/WebGPU (card, fallback phần mềm, shader-f16, giới hạn bộ đệm), chạy thử nhân ma trận WebGPU (GFLOPS, kiểm kết quả đúng), và (tùy chọn) gọi ComfyUI loopback `/system_stats` + `/object_info` để báo GPU/VRAM, node RIFE/ESRGAN/video, checkpoint. Chỉ chấp nhận địa chỉ 127.0.0.1/localhost, không gửi dữ liệu ra ngoài. Báo cáo JSON để dán lại làm bằng chứng nghiệm thu P120/P126.

## P133.6 — Kho Tài nguyên dùng IndexedDB (2026-11-23)
- Vấn đề: Asset Library lưu ảnh dạng dataURL trong localStorage (~5MB tổng, 40 mục, 5MB/tệp) nên "Bộ nhớ trình duyệt đã đầy" rất sớm.
- `canvio-p133-asset-store.js` (CVAssetStoreP133, lot `canvio-lot133a`): bọc `LS.get/set/del('assets')` giữ nguyên API đồng bộ; mục ≥48KB lưu trong IndexedDB `CANVIO_ASSET_STORE`, localStorage chỉ giữ siêu dữ liệu (`store:1`). An toàn dữ liệu: mục mới giữ đủ trong localStorage tới khi IndexedDB xác nhận ghi (nếu localStorage đầy thì giữ ở bộ nhớ tạm + IndexedDB); tài nguyên cũ tự chuyển; xóa mục thì dọn IndexedDB; sau tải lại tự nạp và vẽ lại trang Tài nguyên.
- Core: `window.LS = LS` ngay sau định nghĩa LS (trước đây `window.LS` chỉ là bản sao dự phòng nên module ngoài không thấy cùng đối tượng). Giới hạn nâng lên 25MB/tệp, 200 mục.
- Kiểm: `tests/p145/run-p133a-browser.py` (12 ảnh ~1MB vượt quota, qua tải lại, xóa, di chuyển dữ liệu cũ, tài nguyên nhỏ ở lại localStorage, trang Tài nguyên vẽ được), smoke 21/21, P150/P133/P137 vẫn qua.
- Chưa làm: Project Vault (kho khác), sao lưu JSON vẫn chứa dataURL đầy đủ (đúng như trước), nén ảnh.

## P120 / P126 — đóng "không áp dụng cho máy chính" (2026-11-23)
- Máy thử chính (ASUS, GTX 1650 4GB VRAM, 8GB RAM) đã đo bằng `tools/canvio-gpu-check.html`: WebGPU dùng GTX 1650 thật (nvidia·turing, shader-f16, buffer 2GB, ~186 GFLOPS) sau khi đặt Chrome sang "High performance" trong Windows Graphics (mặc định Chrome chọn Intel UHD, ~1.7 GFLOPS).
- Chủ dự án quyết định KHÔNG cài ComfyUI (tốn RAM, máy 8GB/4GB VRAM chỉ chạy việc nhẹ). P120 (nội suy khung RIFE qua ComfyUI) và P126 (cầu nối ComfyUI) giữ nguyên mã nhưng đóng nghiệm thu thật là "không áp dụng cho máy này"; đường chạy trong trình duyệt (WebGPU/WASM) là đường chính.
- Muốn mở lại: cài ComfyUI portable + `--enable-cors-header "*"`, chạy lại trang kiểm tra và dán báo cáo.

## P142 — đóng "không áp dụng" (2026-11-23)
- Chủ dự án chỉ dùng Chrome và Brave (nhân Chromium, đã kiểm trên cả hai); không dùng Firefox/Safari. P142 (kiểm thật trên Safari/Firefox) đóng là không áp dụng; các lỗi tương thích đã biết vẫn ghi trong mục P142 cũ. Muốn mở lại: chạy bộ test trên Firefox/Safari và gửi kết quả.

## P130 — Đồng bộ đám mây Supabase, mã hóa đầu-cuối (2026-11-23)
- `canvio-p130-cloud.js` (+ lot `canvio-lot130c`, bản sao giống hệt), `supabase/canvio-schema.sql`, giao diện thẻ "Đồng bộ đám mây" trong trang Dự án của tôi (nút luôn hiện: Đăng nhập, Tạo tài khoản, Mở khóa, Đồng bộ ngay, Tải khóa dự phòng, Sao chép SQL).
- Mô hình: Supabase Auth (email/mật khẩu) + cụm mật khẩu mã hóa riêng (PBKDF2-SHA256 600k vòng → AES-GCM 256, nén gzip trước khi mã hóa, AAD gắn khóa tài liệu). Máy chủ chỉ thấy bản mã; RLS `user_id = auth.uid()`; anon bị thu quyền.
- Đồng bộ "bản mới hơn thắng" trên Project Vault; bản cục bộ bị thay được giữ trong `versions` (lý do `trước-khi-đồng-bộ`); không xóa gì ở hai phía. Chặn khóa service_role, chỉ nhận URL *.supabase.co hoặc loopback.
- Test: `tests/p130/run-p130-tests.cjs` (33 kiểm tra, máy chủ giả `mock-supabase.cjs`: RLS, hoán đổi bản mã, hết hạn token, xác nhận email), `tests/p145/run-p130-browser.py` (2 hồ sơ Chrome, đồng bộ thật qua máy chủ giả). Cả hai đã vào CI.
- Chưa kiểm với dự án Supabase thật (cần tài khoản của chủ dự án). Quên cụm mật khẩu và mất tệp khóa dự phòng = không khôi phục được.

### P130.1 — Đồng bộ cả dữ liệu quan trọng khác (2026-11-23)
- Ngoài Project Vault, đồng bộ mọi khóa `canvio*` trong localStorage (tài nguyên, ghi chú, thương hiệu, cài đặt...) dưới dạng "unit" mã hóa `x:k|khóa` hoặc `x:i|khóa|id` (mảng có `id` tách theo mục). Bỏ qua khóa tạm/theo thiết bị. Khóa API/token chỉ đồng bộ khi bật ô riêng (mặc định tắt).
- Ba chiều theo băm lần đồng bộ trước; chỉ thêm/cập nhật, KHÔNG lan truyền việc xóa (mục xóa cục bộ được khôi phục từ đám mây). Xung đột: bản mới hơn thắng, bản thua lưu ở `canvio.p130.bak.<khóa>`. Tải lại trang sau khi kéo dữ liệu mới.
- Test Node 41 kiểm tra; Chrome 13 kiểm tra; version 130.1.0.

## P146 — Rà lỗi lặt vặt index.html (2026-11-23)
- Quét Chrome 48 trang: 0 lỗi JS, 0 ảnh thiếu alt, 0 `label[for]`/aria hỏng, không tràn ngang. Lỗi mạng duy nhất là CDN FontAwesome (môi trường kiểm không có Internet).
- Sửa: GrapesJS `telemetry:false` (trước đó gửi thống kê tới app.grapesjs.com); `canvio-p146-a11y-labels.js` (lot `canvio-lot146a`) gán aria-label cho ô nhập/lựa chọn thiếu tên. Cập nhật `boot-order-graph.json`.

## P147 — Rà màu chữ/nền & icon (2026-11-23)
- Quét 48 trang × (sáng mặc định Graffiti, Midnight) bằng tính toán tương phản WCAG + kiểm tra icon/con lệch khỏi nút. Chữ phụ xám `#77849a` (3,7:1) → `#586479` (≥5:1); chữ xanh "PASS/hoạt động" → `#0a7a55`; nhãn trường `.field>label` đậm hơn. Lỗi tương phản giao diện sáng giảm khoảng 70%.
- Midnight: thẻ nền trắng cố định + chữ sáng (Creative Hub, Design System, KPI...) đổi sang nền tối cùng tông; nhãn trường sáng hơn. Tổng lỗi Midnight giảm ~50%.
- File: `canvio-p147-contrast.css` (lot `canvio-lot147c`). Còn lại: một số mục sinh động/ẩn (opacity chuyển cảnh) báo giả; `data-theme=dark` kết hợp skin Graffiti vẫn là "nửa tối" (topbar tối, nội dung sáng) – dark thật dùng skin Midnight.
- Icon/lệch: chip model (ArtCraft) và nút emoji ShotCraft có phần tử con tràn khỏi nút ≤ vài px (chưa sửa).

## P148 — Đồng bộ màu sắc khi chuyển trang (2026-11-23)
- Huy hiệu thông tin (badgeSoft, cv223-pill, badge, cv11-chip, cs-tag, gd-chip.ai, cv218 brand/violet) dùng chung token thương hiệu (nền `--brand-soft`, chữ `--brand-ink`), thay cho trộn hồng/chàm/tím; chip xanh "LOCAL" chữ `#0a7a55`.
- Thanh trên cùng: các nút phụ dạng kính mờ trên nền tối; nút Xuất dùng gradient chính; select Studio cùng kiểu. Emoji ưu tiên dạng đơn sắc (`font-variant-emoji:text`). Chỉ trong skin Graffiti; lot `canvio-lot147c`.

## P149 — Hoàn thiện đồng bộ màu & icon (2026-11-23)
- Nút Xuất thanh trên cùng dùng gradient chính (thắng skin Holo); nút nổi đổi giao diện không còn che thanh chọn skin trang chủ.
- Nút nhiều dòng (chọn model ArtCraft, mẫu Assets/AutoDesign/WebEngine, ShotCraft) tự cao theo nội dung, không tràn khung; "Dùng"/"Xuất" ở Templates/Responsive không bị cắt chữ.
- Midnight: huy hiệu, nút thanh trên cùng, emoji đơn sắc cùng kiểu Graffiti. Còn lại: ô checkbox "Bloom" (VideoEngine) lệch trái 39px là thiết kế ô tùy biến, chưa đổi. Lot `canvio-lot147c`.

## P150 — Spatial Navigator: lỗi đè & lỗi chữ (2026-11-23)
- Thanh công cụ sticky (z-index 680–880) đè lên bảng Spatial (z 95) → bảng nâng lên 1000. Các mục "Workspace Layouts", "Live 3D Mockup" bị co còn 22px cắt chữ (flex shrink) → `flex-shrink:0`.
- Nhãn workspace lặp ký hiệu và dính chữ ("◈Shared Creative Core17.0", "Tạo trọn bộ1 NÚT") → `routeLabel` bỏ icon khỏi chữ và tách số phiên bản/nhãn.

## P151 — Sửa lỗi hiển thị trang chủ các skin & bảo vệ độ tương phản (2026-11-23)
- Skin Thời trang/Bàn thiết kế: thanh trên cùng sáng nên nút phụ (do P148 làm chữ sáng) bị vô hình → chữ tối khi skin sáng. Phông Bodoni/Didot trên Windows thiếu glyph tiếng Việt (dấu tách rời "Thiê´t kê´") → dùng Playfair/Cambria/Georgia. Icon thẻ không gian làm việc bị trắng trên nền trắng (do emoji đơn sắc) → icon màu đậm.
- `canvio-p151-contrast-guard.js` (lot `canvio-lot151g`): tự đổi màu chữ/icon có tương phản < 2,4 (icon < 3) khi nền xác định được; hoàn tác khi đổi giao diện/skin; quét ~15–35 ms/trang. Quét toàn bộ trang × skin: lỗi chữ/icon vô hình từ 52 xuống ~15 (chủ yếu trạng thái chuyển động của nút đang vô hiệu).

## P152 — Sanitizer srcdoc, drawer z-index, quét nút
- `clean()` giữ `srcdoc` cho iframe sandbox (không allow-same-origin/top-navigation) → Kho thành phần hiện lại preview.
- `#cv-pn.on{z-index:900}` → drawer "Mẫu" Poster không bị thanh nổi đè.
- Quét click toàn bộ ~48 trang: 0 nút chết (trừ "Hoàn tác" khi chưa có thao tác).

## Đối chiếu trạng thái "làm một phần" (2026-11-24)
- P137: đã xong — chữ chảy trang (137.3–6) và khung chữ liên kết trong Designer (137.7, `canvio-p137-frames.js`); `run-p137f-browser.py` đạt. Ghi chú cũ "chưa có khung chữ liên kết trên poster" đã lỗi thời.
- P133: đã xong — OPFS media >32MB (133.4/5), kho Tài nguyên IndexedDB (133.6), proxy 720p bằng OffscreenCanvas Worker (133.3), khử ồn Worker; `run-p133a/p133w` đạt (p133w từng fail một lần do đo thời gian, chạy lại đạt). Chưa làm: chuyển Project Vault sang OPFS (kho vault đang an toàn, để nguyên).
- P124: `run-p124-tests.cjs` đạt; còn mở: biến thể lồng nhau, kéo/đổi cỡ, chuyển cây component bất kỳ — cần đặc tả.
- P143: Phase 3 (tách mã thật) chưa làm vì rủi ro vỡ file đơn; chỉ làm khi người dùng đồng ý.

## P153–P158 — Gói "Cảnh nhất quán" + Bảng cảm hứng (kế hoạch, chưa làm · 2026-11-24)
Nguồn ý tưởng: 4 video người dùng gửi (Mewia, ZOZO Nghiện AI ×2, skill thiết kế AI). Nguyên tắc chung: miễn phí, chạy cục bộ, không thêm kho dữ liệu mới (dùng Kho Tài nguyên IndexedDB/OPFS P133 và Cloud Sync P130 sẵn có), chỉ thêm — không xóa/ghi đè chức năng cũ. Mỗi P là một file `canvio-pNNN-*.js` + lot riêng + test node/Chromium + cập nhật boot-order graph + parity P143.

### P153 · Bảng cảm hứng (Inspiration Board)
- Trang/khối trong Kho Tài nguyên: thả ảnh, dán link, ghi chú; tự tách bảng màu chủ đạo (dùng bộ tách màu sẵn có); lọc theo màu và theo loại (Poster, Web, Motion, Logo, Typography…); bấm ảnh → panel chi tiết với bảng màu, nút "Dùng màu này" (áp vào Poster/Brand).
- Lưu: ảnh lớn qua `CVAssetStoreP133`; siêu dữ liệu đồng bộ qua P130 (đơn vị `x:i|<lskey>|<id>`).
- Chấp nhận: thả 20 ảnh → có chip màu; lọc "Cam" chỉ còn ảnh cam; tải lại vẫn còn; xóa dọn IndexedDB; 0 lỗi console; không gọi mạng ngoài.

### P154 · Trình xem toàn cảnh (Panorama Capture)
- Nạp ảnh equirectangular 2:1; xoay yaw/pitch, zoom FOV; bấm "Chụp góc nhìn" → khung PNG theo tỉ lệ chọn (16:9/9:16/1:1) lưu vào Kho Tài nguyên kèm metadata (yaw, pitch, fov, ảnh gốc).
- Render bằng canvas/WebGL sẵn có trong app (không thêm thư viện); chạy trên máy GTX 1650 mượt.
- Chấp nhận: ảnh 4096×2048 → xoay mượt; chụp 3 góc → 3 khung đúng yaw/pitch (test so điểm ảnh tại tâm); tải lại giữ nguyên.

### P155 · Thẻ Nhân vật và Thẻ Không gian
- Thẻ Nhân vật: tên, mô tả ngoại hình/trang phục/đặc điểm riêng (ví dụ tàn nhang, sẹo), 1–3 ảnh tham chiếu. Thẻ Không gian: kiểu kiến trúc, ánh sáng, đồ vật, tông màu, ảnh tham chiếu (có thể lấy từ P154).
- Lưu/đồng bộ như P153; chèn thẻ vào Storyboard (P125/P127) theo cảnh.
- Chấp nhận: tạo thẻ, gắn vào 3 cảnh, sửa thẻ → cả 3 cảnh cập nhật; xuất/nhập JSON; tải lại còn.

### P156 · Prompt có phân công
- Biểu mẫu: chọn nguồn cho từng vai — ngoại hình nhân vật, xe cộ/môi trường, góc máy/chuyển động — rồi ghép prompt có đánh dấu vai rõ ràng; gửi qua P128 orchestrator hoặc ComfyUI adapter (P120/P126, chạy khi người dùng có máy thật). Có nút "Sao chép prompt" để dùng với công cụ ngoài.
- Chấp nhận: prompt sinh ra đúng cấu trúc theo test snapshot; thiếu vai báo lỗi tiếng Việt rõ; không tự gửi mạng.

### P157 · Thư viện góc máy dựng sẵn
- Mẫu: toàn cảnh bám theo, bám sát thân, trong xe/vai nhân vật, cận cảnh va chạm, quỹ đạo, dolly… Mỗi mẫu: tên, mô tả, thời lượng gợi ý, câu prompt, biểu tượng sơ đồ; chèn vào Storyboard bằng một nút.
- Kèm "kiểm tra nhất quán": so màu chủ đạo (histogram/vectorscope sẵn có P134) giữa khung cuối cảnh trước và khung đầu cảnh sau, cảnh báo "lệch tông" khi vượt ngưỡng chỉnh được.
- Chấp nhận: chèn 5 mẫu đúng thứ tự; cảnh giả lệch tông bị cảnh báo, cảnh cùng tông thì không.

### P158 · Landing page theo brief + Thiết kế → chuyển động (làm sau cùng)
- Website Engine: nút "Landing page theo brief" (vấn đề → cấu trúc trang → chữ chuyển đổi → design tokens font/màu/bán kính/chuyển động) dựa trên P123 Layout Library và Design Taste P122; mẫu trang 404/lỗi.
- "Thiết kế → chuyển động": biến khối tĩnh thành chuyển động vào/ra rồi xuất MP4/GIF 800×500 bằng bộ xuất GIF (P132) và MP4 sẵn có. Chi tiết nguồn (skill design-to-motion) suy từ hình nên cần xác nhận lại với người dùng trước khi làm.

### Thứ tự và phụ thuộc
P154 → P155 → P156 → P157 (gói "Cảnh nhất quán", làm liền); P153 độc lập, có thể làm trước nếu muốn thấy kết quả sớm; P158 cuối. Ước lượng mỗi P: 1 lượt làm + test + ghi 3 file MD.
Việc cần người dùng: duyệt thứ tự; cung cấp 1–2 ảnh toàn cảnh 2:1 mẫu để test P154; xác nhận chi tiết video skill thiết kế (P158).

## P153–P157 — ĐÃ LÀM (2026-11-24): Bảng cảm hứng + gói "Cảnh nhất quán"
- P153 `canvio-p153-board.js` (lot `canvio-lot153b`, 153.0.0): trang Tài nguyên có thẻ "Bảng cảm hứng": thêm ảnh (nhiều ảnh/kéo thả) và link, tự tách ≤5 màu chủ đạo, lọc theo 11 tên màu + 8 loại + tìm chữ, bấm chấm màu để sao chép mã, xem ảnh lớn, xóa. Siêu dữ liệu + thumb ở `canvio.p153.board` (Cloud Sync P130 đồng bộ từng mục); ảnh đầy đủ (≤1600px) ở IndexedDB `CANVIO_SCENE_STORE`.
- P154 `canvio-p154-panorama.js` (lot `canvio-lot154p`, 154.0.0): Video Studio có "Trình xem toàn cảnh": nạp ảnh 2:1, kéo/phím/slider xoay yaw-pitch, cuộn đổi FOV, "Chụp góc nhìn" (16:9, 9:16, 1:1, 4:3; 1280px cạnh dài) lưu vào Bảng cảm hứng loại "Cảnh" kèm yaw/pitch/FOV. Dựng hình CPU, không thêm thư viện.
- P155–P157 `canvio-p155-scene-pack.js` (lot `canvio-lot155s`, 155.0.0): thẻ "Cảnh nhất quán" với 4 tab — Thẻ Nhân vật/Không gian (≤3 ảnh tham chiếu, sửa/xóa, xuất/nhập JSON); Prompt phân công vai (nhân vật / không gian / góc máy + hành động, báo thiếu vai); thư viện 10 góc máy; kiểm tra lệch tông giữa hai ảnh (ngưỡng chỉnh được, mặc định 14/100).
- Kiểm: `tests/p153/run-p153-tests.cjs` (34 kiểm: tên màu, palette, lọc, link an toàn, hình học panorama yaw/pitch, thẻ, prompt, lệch tông), `tests/p145/run-p153-browser.py` (16 kiểm trong Chrome thật: thêm/lọc/tải lại/IndexedDB, panorama xoay đúng màu theo yaw, chụp 1280×720, thẻ→prompt→so tông, không tràn ngang ở 390px, 0 lỗi trang), smoke 21/21, P130 41/41, P143 parity 37/37, boot-order OK. Đã thêm 2 bước vào CI.
- Lưu ý đã gặp: hiệu ứng nghiêng 3D `data-tilt` của thẻ trong trang Tài nguyên làm lệch vùng bấm → tắt cho các thẻ mới bằng `#cv153-style`.
- Chưa làm: P156 chưa gửi thẳng sang ComfyUI/P128 (chỉ tạo và sao chép prompt); "Dùng màu này" mới sao chép mã màu và phát sự kiện `cv153:usecolor` (chưa nối vào Poster/Brand); P158 (Landing page + thiết kế→chuyển động) chưa làm; ảnh toàn cảnh thật của người dùng chưa thử (test dùng ảnh tổng hợp).

## P159–P166 — Nhóm ý tưởng bổ sung + NGUYÊN TẮC TÍCH HỢP (kế hoạch, 2026-11-24)
### Nguyên tắc bắt buộc (người dùng đặt)
Mọi module phải liên kết với **Studio**, **Image Library (Asset Library `CV.assets`)**, **AI Engine (`CVOrchestratorP128`)** và **Video Editor (Storyboard P125/P127, Motion Cut/Video Studio)**; không tạo công cụ riêng lẻ, không có kho dữ liệu riêng. Dữ liệu dùng chung đi qua **Shared Creative Core (`CVCreativeCore`: project, `assetIds`, brief, brand, `context()`)**.
Hợp đồng tích hợp cho mọi P mới: (1) ảnh/clip lưu vào `CV.assets` (không IndexedDB riêng) và gắn vào dự án bằng `CVCreativeCore.linkAsset`; (2) tác vụ AI đăng ký/chạy qua `CVOrchestratorP128`; (3) đọc brief/brand/dự án từ `CVCreativeCore.context()`; (4) có nút "Gửi sang…" Studio / Video / Website tương ứng; (5) có test kiểm dữ liệu xuất hiện ở module khác.

### P159 · SỬA NGAY P153–P157 cho đúng nguyên tắc (ưu tiên cao nhất)
Kiểm điểm trung thực: P153–P157 đang vi phạm nguyên tắc — dùng kho riêng `CANVIO_SCENE_STORE` + `canvio.p153.board`/`canvio.p155.cards`, chưa gắn dự án, chưa gọi P128, chưa gửi sang Video/Studio.
- Ảnh bảng cảm hứng và ảnh chụp toàn cảnh → `CV.assets.addBlob` (kèm metadata màu/loại/yaw-pitch trong bảng meta của Asset Library `cv201`), tự `linkAsset` vào dự án đang chọn; bỏ `CANVIO_SCENE_STORE`, có bước di chuyển dữ liệu cũ (không mất).
- Thẻ Nhân vật/Không gian lưu theo dự án trong Shared Core (hoặc namespace dự án) thay vì khóa riêng.
- Prompt P156 chạy qua `CVOrchestratorP128` (task `scene-prompt`), kết quả quay về Storyboard.
- Nút "Gán vào cảnh" đưa thẻ + góc máy + ảnh tham chiếu vào Storyboard P125/P127 của Video Studio.
- Chấp nhận: ảnh thêm ở Bảng cảm hứng hiện trong trang Tài nguyên, Image Studio và Video Studio; xóa ở một nơi → nơi khác cập nhật; dự án xuất/nhập (Project Vault, Cloud Sync) mang theo thẻ và ảnh.

### Ma trận nhóm ý tưởng → P → điểm nối bắt buộc
| Nhóm | P | Nội dung | Nối với |
|---|---|---|---|
| Inspiration | P160 | Bộ sưu tập cá nhân (mở rộng P153): bộ sưu tập/kênh, tag, xuất-nhập gói chia sẻ JSON/ZIP; bảng tham khảo cộng đồng = gói do người dùng tự nhập (không máy chủ); đồng bộ riêng tư qua P130 | Asset Library, Shared Core, Studio "Dùng làm moodboard" |
| Không gian 3D | P161 | Xem trước nội thất/không gian: nạp GLB/ảnh toàn cảnh, di chuyển (WASD/kéo), lưu nhiều góc quan sát thành "camera preset"; ghép P154 | Asset Library (ảnh), Video Editor (góc máy → shot), 3D engine sẵn có |
| Sáng tạo hình ảnh | P162 | Canvas bố cục nhiều ảnh tham chiếu: kéo ảnh từ thư viện, đặt vai (chủ thể/phong cách/bố cục), chỉnh từng thành phần (lớp) rồi gửi AI hoặc Designer | Image Library, Unified Layers, Image Studio, AI Engine |
| Nhân vật | P163 | Giữ nhận diện nhân vật nhiều ảnh/cảnh: bộ ảnh tham chiếu + checklist đặc điểm + kiểm tra nhất quán (màu/tóc/trang phục) giữa các ảnh sinh ra; mở rộng P155 | Asset Library, AI Engine, Storyboard |
| Sản xuất video | P164 | Shot list từ Storyboard: bảng shot (cảnh, góc máy, thời lượng, thẻ nhân vật/không gian), thư viện chuyển cảnh + camera movement, xuất shot list CSV/PDF; dùng lại P157 | Video Editor/Timeline, Asset Library, AI Engine |
| AI Workflow | P165 | Nhiều AI phối hợp: định nghĩa vai (viết kịch bản → dựng prompt → sinh → đánh giá → sửa), vòng đánh giá/sửa có điều kiện dừng, nhật ký từng bước; chạy cục bộ hoặc ComfyUI do người dùng bật | CVOrchestratorP128, Shared Core, mọi Studio |
| Website | P166 | Trang từ brief (= P158 + responsive, tương tác, animation, xuất): brief từ Shared Core, ảnh từ Asset Library, chuyển động từ Motion Lab, xuất ZIP offline | Website Engine, Asset Library, Motion Lab, Shared Core |

### Thứ tự đề xuất
P159 (sửa tích hợp) → P160 → P163 → P164 → P162 → P161 → P165 → P166 (gộp P158). Mỗi P: file module riêng nhưng **không kho riêng**, test node + Chromium kiểm luồng liên-module, cập nhật boot-order/parity/CI, ghi cả 3 file MD.
Việc cần người dùng: duyệt thứ tự; cho biết có muốn "kênh chia sẻ/cộng đồng" chỉ là gói file tự trao đổi (không máy chủ, miễn phí) hay cần máy chủ; ảnh/GLB nội thất mẫu để test P161.


## P159 — Shared Core integration for P153–P157 (2026-11-24 · candidate)

- P153 candidate now stores new inspiration metadata in `CVCreativeCore.active.documents.inspirationBoard`; source images and P154 captures are sent to the canonical `CV.assets.addBlob` and linked with `CVCreativeCore.linkAsset`. Asset metadata carries board ID, category, colour palette and panorama pose details.
- P155 candidate stores cards in `documents.scenePack`, while retaining the legacy `canvio.p155.cards` key for migration only. P153 migration reads old `canvio.p153.board` + `CANVIO_SCENE_STORE` bytes and does not delete the old records unless all image entries have verified Asset Library IDs.
- P156 composes role-tagged prompt text plus the current Shared Core brief and routes it through P128's deterministic local `scene-prompt` handler. This is orchestration/integration only, not remote or model-based generation.
- P156 and P157 append shots to the existing Video Studio project, preserve earlier shots, retain character/space/camera IDs and reference Asset IDs, and refresh the native Storyboard panels.
- Added `canvio-p159-integration.js` (inline lot `canvio-lot159i`), P159 Node tests, P143 source pair 38 and hosted workflow embedding/parity hooks. Candidate CI run #689 is the acceptance authority; run #688 is obsolete because it ran before the canonical embedding step was added.
- Still required before P159 is marked done: hosted run #689 or its corrected successor PASS; legacy profile migration check; real image deletion/reference reconciliation; real panorama sample; zero console/page errors; Asset Library/Image Studio/Video Studio visibility. P130 real Supabase/two-device sync remains blocked independently.

## P159–P166 — triển khai module tích hợp (2026-11-24 · candidate trên main)

> Các module độc lập và bước nhúng vào canonical `index.html` đã được thêm. Trạng thái “candidate” nghĩa là code đã có, chưa được nghiệm thu chỉ vì commit thành công. Workflow hosted cuối cùng cần PASS; dữ liệu/môi trường thật vẫn là gate riêng.

| P | Source / API | Owner dữ liệu và chức năng đã triển khai | Giới hạn còn mở |
|---|---|---|---|
| P159 | `canvio-p159-integration.js` · `CVSceneIntegrationP159` | Nối P153/P155 vào Shared Core; Asset Library `CV.assets`; migration cũ fail-safe; P156 chạy P128 local handler; P156/P157 nối Storyboard hiện có; reconciliation khi asset bị xóa. | P159 Node 13/13 đã PASS trong hosted run #697, nhưng full workflow #697 thất bại ở 5 kiểm tra màu nút P150, không phải assertion P159. Cần xác nhận run mới, thử migration profile cũ/ảnh panorama thật và xóa asset có tham chiếu dùng chung. |
| P160 | `canvio-p160-collections.js` · `CVInspirationCollectionsP160` | Bộ sưu tập theo dự án, kênh, tag, gắn `assetId` từ `CV.assets`; lọc, JSON và ZIP metadata export/import có kiểm CRC; nút gửi moodboard qua P128 sang Studio. | ZIP chỉ chứa metadata + README, không nhúng ảnh gốc; nhận Asset ID trên thiết bị khác yêu cầu asset tương ứng đã tồn tại/được nhập vào Asset Library. Bảng cộng đồng là gói người dùng tự trao đổi, không có server. |
| P161 | `canvio-p161-spatial-workspace.js` · `CVSpatialWorkspaceP161` | Camera preset theo dự án; panorama preview từ P154; xoay bằng kéo, WASD/phím mũi tên và wheel; gửi góc camera vào Storyboard; GLB handoff sang viewer P74/P81. | GLB dùng OrbitControls mặc định của viewer hiện hữu; pose preset GLB chưa được áp chính xác vào camera P74. Cần GLB/panorama người dùng và thiết bị thật để nghiệm thu. |
| P162 | `canvio-p162-reference-canvas.js` · `CVReferenceCanvasP162` | Canvas nhiều asset theo vai trò chủ thể/phong cách/bố cục/ánh sáng/không gian/chi tiết; Shared Core; kéo đổi thứ tự, chỉnh vai trò/ghi chú/tỷ lệ, xóa lớp, gửi prompt P128 tới Image Studio/Designer. | Chưa phải compositing canvas pixel/Unified Layers editor; vị trí x/y là metadata. Không tự sinh ảnh. |
| P163 | `canvio-p163-character-continuity.js` · `CVCharacterContinuityP163` | Hồ sơ nhân vật, đặc điểm/checklist, ảnh tham chiếu Asset Library, so sánh mô tả/palette, prompt P128 và gán profile vào shot hiện hữu. | Điểm nhất quán là heuristic checklist/màu, không phải nhận diện khuôn mặt hoặc thị giác AI. Cần kiểm thử nhiều cảnh/dự án thật. |
| P164 | `canvio-p164-shotlist.js` · `CVShotListP164` | Đọc Storyboard canonical; metadata góc máy/chuyển động/thời lượng/transition trên từng shot; xuất CSV, in/Lưu PDF qua browser Print; brief handoff P128. | PDF dùng print dialog, không phải PDF engine riêng; cần xác nhận round-trip với timeline thật, nhiều track và media dài. |
| P165 | `canvio-p165-ai-workflow.js` · `CVAiWorkflowP165` | Vai trò scriptwriter → prompt director → generation handoff → evaluator → reviser; log theo lần chạy, tối đa 2 vòng; lựa chọn local model qua P128 `tiers:['local']` hoặc deterministic fallback; có nút chuyển prompt thủ công sang P120/P126 ComfyUI hiện hữu. | Generation là handoff; P120 chỉ chạy sau khi người dùng cấu hình workflow API, kết nối localhost và tự bấm chạy. Không gọi Gemini/paid; cần kiểm tra model/local provider thật. |
| P166 | `canvio-p166-landing-studio.js` · `CVLandingStudioP166` | Brief/brand/project context + hero asset từ Image Library; responsive HTML, reduced-motion, preview, HTML và ZIP offline; lưu metadata vào Shared Core và mở Website Engine. | Hiện tạo static landing package và phát sự kiện/handoff; chưa chuyển thành component tree GrapesJS tự động. CTA không có backend/form service; cần duyệt nội dung, CSP và offline bằng dự án thật. |

### Tích hợp và kiểm thử
- P160–P166 được thêm vào `tests/p143/source-module-map.json` (45 cặp standalone/inline) và workflow `.github/workflows/canvio-candidate-runtime.yml`; workflow sẽ chép source vào các lot `canvio-lot160c` đến `canvio-lot166l`, chạy `node --check`, P143 parity, boot-order audit, Node suite `tests/p160/run-p160-166-tests.cjs` và Chromium suite `tests/p160/run-p160-166-browser.py`.
- P159 test riêng `tests/p159/run-p159-tests.cjs`; P153–P157 `tests/p153/run-p153-tests.cjs` + `tests/p145/run-p153-browser.py`.
- Source map P143 phải giữ `totalModules === modules.length`; hiện đã mở rộng thành 45. Không sửa riêng source mà quên lot hoặc map.
- Mọi metadata P mới nằm trong `CVCreativeCore.active.documents` theo namespace của module; ảnh chỉ tham chiếu `CV.assets` bằng `assetId`; các chức năng video đọc/ghi `canvio5:media_video_project_v1`. Không tạo DB/localStorage store mới cho P160–P166.
- Candidate hosted run sau khi mở rộng P160–P166: #727 (SHA bắt đầu `b8fdc528`) đang được CI xác nhận tại thời điểm ghi. Không gắn nhãn PASS trước khi đọc kết quả cuối.
- Release P70 vẫn fail-closed, 14 manual acceptance gates vẫn độc lập; các P này không làm CANVIO thành Stable/production-certified.



## P159–P166 · hosted verification correction (2026-11-24)

- Workflow #767 on `4efdb5d` passed P160–P166 Node contracts and 27/28 Chromium checks; no page errors. The only failure was P164 P128 prompt heading case sensitivity.
- Corrected P164 prompt heading and made the browser assertion case-insensitive. Hosted verification is required before marking the range accepted; real-media and P70 release gates remain separate.

## P159.1 — Kiểm tra chéo bản của AI khác + sửa chặn nghiệm thu (2026-11-24 tối)
- Phát hiện: trên `main` các file P159–P166 có đủ nhưng `index.html` CHƯA nhúng lot (trang chạy thật không có các module này; P153–P155 trong index vẫn là bản cũ) → parity P143 chỉ đạt 35/45 và Chromium P160–P166 hết thời gian chờ. Đã nhúng lot `canvio-lot159i/160c/161s/162r/163c/164s/165w/166l` và làm mới 153b/154p/155s theo nguồn → parity 46/46, Chromium P160–P166 28/28, P153 browser đạt, smoke 21/21, P130 41/41, node P160–P166 đạt, boot-order OK.
- UI: 4 thẻ (Shot list, Nhân vật, Toàn cảnh, Thẻ·Prompt·Góc máy) xếp dọc đẩy trình dựng xuống ~1500px → gom vào dock một thanh tab `canvio-p159u-dock.js` (lot `canvio-lot159u`, 159.1.0), thanh tab luôn hiện, mặc định gập, nhớ tab bằng sessionStorage; chỉ di chuyển DOM, không thêm dữ liệu.
- Còn lại: ô nhập của thẻ Nhân vật P163 thiếu nhãn chữ (chỉ placeholder/ô chọn trống) → cần chỉnh nhãn; ảnh/GLB thật, đồng bộ hai thiết bị, P70 chưa nghiệm thu.

## P167–P168 — ĐÃ LÀM (2026-11-24 tối)
- P167 `canvio-p167-blocking.js` (lot `canvio-lot167b`, 167.0.0): tab "Dựng khối" trong dock Video Studio. Khối trắng (khối/xe/người/nhà/đường), camera có vị trí/điểm nhìn/FOV/độ cao/thời lượng, bám đối tượng, camera chạy điểm đầu→cuối, xem qua camera (phối cảnh CPU, cắt mặt phẳng gần), mặt bằng kéo-thả (điểm đầu/cuối), xem thử chuyển động, mẫu "Rượt đuổi" và "Trong phòng". Lưu ở `CVCreativeCore.active.documents.blocking`; "Chụp khung" → Thư viện Tài nguyên (qua `CVBoardP153.addDataUrl`, tự `linkAsset`); "Gán vào Storyboard" → `CVScenePackP155.assignToStoryboard`; "Mô tả cho AI" → `CVOrchestratorP128` (`blocking-local`).
- P168 `canvio-p168-motion.js` (lot `canvio-lot168m`, 168.0.0): (1) tab "Ảnh → chuyển động": 8 hiệu ứng, 4 kích thước, xem thử, xuất GIF (P132) / WebM (MediaRecorder) → Tài nguyên + gắn dự án, hoặc gán shot Storyboard; (2) thẻ P165 trên trang Nền tảng có "Xuất/Nhập bản mẫu quy trình" (JSON `canvio:'p165-workflows'`, lọc vai hợp lệ, chống trùng, ≤50).
- P159.1 `canvio-p159u-dock.js`: dock có thêm tab "Dựng khối" và "Ảnh → chuyển động" (nay 6 tab).
- Kiểm: `tests/p167/run-p167-tests.cjs` (30), `tests/p167/run-p168-tests.cjs` (17), `tests/p145/run-p167-browser.py` (13), `tests/p145/run-p168-browser.py` (12), P153 browser, P160–P166 browser 28/28, smoke 21/21, parity 48/48, boot-order OK; đã thêm vào CI.
- Chưa làm / còn mở: chỉnh nhân vật trực quan (mặt/tóc/sẹo — hiện chỉ mô tả chữ + checklist P163); nối Google Drive giữ bản gốc; WebM mới kiểm trong Chromium headless (test chấp nhận trình duyệt không hỗ trợ); dựng khối chưa có xoay (yaw) bằng chuột/đổi cỡ trực tiếp, chưa có nhiều camera chạy đồng thời; "design-to-motion" mới nhận ảnh trong Tài nguyên (chưa lấy thẳng từ Poster/Designer); chưa thử ảnh/GLB thật, sinh video AI thật, đồng bộ hai thiết bị; P70 chưa qua.


## P150.11 continuation — restore original export button outside Home (2026-11-24)
- Fixed the CSS regression identified by hosted runs #769 and #770: late unscoped selectors for `html[data-home-skin=sky|fashion|tech] header.top #ws-export` and descendants leaked Home themes into other workspaces.
- Removed those unscoped overrides only. The existing Home-scoped theme behavior remains; design/site/media/projects/AI retain the original pink export control.
- `canvio-p150-home-sky.js` version: 150.11.0. The candidate CI workflow now embeds this exact standalone source into `canvio-lot150h` before the browser suite.
- Verification pending on branch `fix/p150-workspace-export-scope`: desktop/mobile P150 browser test (including all five non-Home workspaces), full candidate CI, Pages build/deploy, source/embedded parity and zero browser page errors. Do not mark PASS before the new run completes.
- Evidence from failed run #770 before the fix: P167 unit suite 30 assertions PASS; P168 unit suite 17 assertions PASS; P159 integration 13/13 PASS; P160–P166 Chromium integration 28/28 PASS. The run then failed five repeated P150 assertions because the export button was not pink outside Home. This evidence is bounded to that commit and must be re-run after the fix.


## P159.1–P169 — Canonical integration completion candidate · 2026-11-24

- The hosted build synchronizes P159.1 dock, P167 white-box blocking, P168 image-to-motion and P169 Character Studio into unique canonical inline lots. P167/P168 already have Node and Chromium acceptance; P169 adds a dedicated 8-control visual-profile round-trip suite. P143 tracks P150 and P169 alongside existing P159u/P167/P168 source pairs.
- P167: white-box scene and camera controls are interactive and project-backed; object position/size/yaw metadata and camera position/look/FOV/duration are bounded. Full 3D editor-grade transform gizmos, simultaneous multi-camera director and a full Three.js scene graph are not claimed.
- P168: eight image-to-motion presets with GIF/WebM handoff and P165 workflow JSON import/export. WebM depends on browser MediaRecorder support; AI generation remains an explicit handoff, not an included video inference model.
- P169: 2D vector Character Studio with eight appearance fields, preview, and save to P163 profile. It does not edit a rigged 3D character or infer identity from a face.
- P150.12 Home-only toolbar visibility fix is pending hosted desktop/mobile browser verification. Do not merge/release until the P150 five-workspace pink Export regression is green and the complete candidate workflow passes.


## P150.13 — Home skin root reset (candidate · 2026-11-24)

- P150.12 was insufficient: Home scope marker correctly turned off, but `data-home-skin=tech` remained on the document root and some inherited/legacy selectors still recolored Export. P150.13 resets root skin to `classic` whenever Home is hidden and restores the saved selection only when Home is visible.
- Acceptance adds a root-skin assertion plus the original pink Export check on all five non-Home workspaces; no merge until hosted browser and final-head verification pass.


## P150.13 — Tách biệt P47 Holo và P150 Home skin trong QA

- Nút Xuất nền hồng được kiểm tra dưới P47 `plain` để xác nhận không bị Home skin ghi đè. Thêm suite riêng cho P47 Holo: so sánh computed background/color/border của nút Xuất trước và sau khi P150 chuyển sang tech skin trong lúc Home đang ẩn, qua cả 5 workspace.
- Kết quả #783 cho thấy P150 root đã về `classic`; tuy vậy fixture còn bật P47 Holo mặc định, vốn có CSS gradient độc lập cho nút Xuất. Lượt tiếp theo phải pass cả 2 nhánh theme.


## P150.13 QA fixture isolation — 2026-11-24

- Separate P150 Home presentation skin from P47 global Holo and P229 workspace theme. The browser suite applies the intended baseline through the existing theme APIs and compares the computed Export style before/after route changes.
- Keep the P47 Holo case as a separate preservation test. Do not fix a test harness theme-state issue by changing global theme behavior in the P150 module.


## P150.13 — Baseline lấy sau khi rời Home (QA fixture)

- Run #785: P150 root skin fallback về classic; Holo-preservation pass 5/5; năm workspace Export không in diagnostic (computed background đúng hồng), nhưng test fail vì baseline được chụp khi Home-tech còn hiển thị.
- Test fixture mở Design trước khi chụp baseline màu hồng, rồi so sánh năm workspace. Đây là sửa thứ tự kiểm thử, không thay đổi CSS sản phẩm.


## P167.1 — Trình chỉnh đối tượng và đa camera (2026-11-24)

- `canvio-p167-blocking.js` nâng lên `167.1.0`; vẫn là chủ sở hữu duy nhất của `CVCreativeCore.active.documents.blocking`.
- Thêm inspector theo đối tượng đang chọn: tên, X/Z, rộng/sâu/cao, yaw và màu; thay đổi được chuẩn hóa theo giới hạn hiện có rồi lưu vào tài liệu dự án.
- Bổ sung camera position X/Z và look-at X/Z bên cạnh FOV, độ cao, thời lượng và follow target.
- Mặt bằng có chế độ kéo để xoay (yaw) và đổi cỡ (scale) đối tượng bằng chuột; chế độ di chuyển điểm đầu/điểm cuối cũ vẫn giữ.
- Bổ sung preview đồng thời tối đa 8 camera và xuất một PNG contact sheet gồm 4 mốc thời gian cho mỗi camera (tối đa 32 khung). Đây là bảng khung tĩnh, không phải render video/chuỗi file độc lập.
- Không thêm dependency, API, kho dữ liệu hoặc timeline mới. Renderer hiện vẫn là phép chiếu phối cảnh CPU trên Canvas 2D; P167.1 không được mô tả là scene graph/WebGL 3D đầy đủ.
- Trạng thái: candidate; chờ hosted Node/Chromium, P143 parity, full smoke và mainline verification. Không đóng các manual gates P70 bằng kết quả CI.
\n\n## P167.1 — QA correction and acceptance scope (2026-11-25)

- Inspector name now persists on the input event, so edits are committed immediately while typing; other numeric/color fields retain their bounded change handlers.
- Browser acceptance now checks the edited object name both immediately and after page reload, alongside object selection, mouse yaw/scale, camera position/look-at persistence, up to eight camera previews and PNG contact sheet export.
- This remains the existing CPU Canvas2D perspective blocker. It is not a full WebGL scene graph, skeletal character editor, photoreal 3D renderer or video renderer. The PNG export is a contact sheet, not individual frames or MP4.
- Hosted CI run #792 exposed only the immediate-name-save assertion (all other P167 checks and preceding P85/GLB/ONNX checks in the job passed). Source and regression test were corrected on this branch; final acceptance is pending the latest complete hosted run and canonical-index sync.


## P168.1 — Direct design handoff and animated text overlays (2026-11-25 · candidate)

- The existing Image → Motion panel keeps its Asset Library picker and adds direct handoff buttons for the currently open Poster and Designer. Poster uses the existing `CV.poster.doc` + `CV.export.svgString()` renderer; Designer accepts a locally rendered image/SVG from its existing `CV.engines.design.snapshotState()` payload, or a usable Canvas in its existing Designer page. It does not create an intermediate Asset Library item.
- Direct sources are restricted to local data-image/blob/SVG sources. External HTTP image references inside Poster SVG are rejected rather than fetched. If Designer has no image-like snapshot or accessible rendered Canvas, the panel reports that the current document cannot be captured; it does not pretend an arbitrary model snapshot is renderable.
- Add editable title/subtitle overlay (160-character bound), 5 motion modes (static, fade, slide, typewriter and pop), 3 positions, 3 styles (plain/banner/outline), color and bounded size. Text is composited in the shared Canvas frame path, so preview, GIF frames and MediaRecorder WebM all use the same text treatment.
- No new store, external API, paid service, package or timeline was added. Output remains saved through the current Asset Library and existing Storyboard owner.
- Added Node coverage for overlay normalization/rendering and design-source extraction; Chromium coverage verifies Poster SVG and Designer snapshot handoff without intermediate assets, overlay preview, plus the existing GIF/WebM/Storyboard/workflow/mobile checks.
- Status: candidate pending exact-head hosted CI, P143 standalone/inline parity, generated canonical `index.html`, and post-merge mainline verification. This is 2D image motion, not a full multi-track video editor or AI video generation.


## Mainline update — P167.1 and P168.1 (2026-11-25)

PR #91 is merged. Merge commit: `aca4f2846637b28532110f86d82ded2ef37cde03`. Canonical generated runtime commit: `5c54e93ebad19d59548d735fcbd0520ae6fe77e7`. Hosted workflow #796 / run `45459847567` completed successfully, including canonical-index restoration, P143 source parity/inventory, P47–P70 automated regression, source contracts, same-origin GLB/P85/ONNX/worker browser acceptance, and documentation/manifest refresh.

P167.1 and P168.1 are therefore mainline-integrated and hosted-CI verified, with their documented functional boundaries unchanged: P167.1 remains a Canvas2D blocking tool rather than a full WebGL scene editor; P168.1 remains 2D image motion and text compositing rather than a multi-track or AI-video editor. The 14 P70 real-world manual gates are not closed by CI and remain pending.


## P132.1 — Nhập từng trang PDF cục bộ vào Pixel Atelier (candidate · 2026-11-25)

- Thêm `canvio-p132-pdf-import.js` / `CVPdfImportP132` phiên bản 132.1.0; PDF.js 6.5.438, Apache-2.0, vendoring cục bộ với CMaps, standard fonts, worker và SHA manifest; không upload PDF, không runtime CDN.
- Luồng chọn trang → raster PNG trong giới hạn → bàn giao input `#pxFile` và owner Pixel Atelier hiện tại. Một trang/lần; không tạo editor/database/timeline mới.
- Giới hạn 30 MiB, 500 trang, cạnh dài 4096 px, 16 MP; tắt PDF JavaScript/XFA. Text/vector không còn editable; password, batch và PDF thật vẫn là gate mở.
- Assertion cũ đọc file picker sau cleanup của Pixel owner; đã sửa để chụp metadata file ở capture phase. Run #813 PASS 65/65 trên nhánh cũ; nhánh mainline v3 cần exact-head rerun.


## P163.1.1 — Nhãn hiển thị cho biểu mẫu nhất quán nhân vật (candidate · 2026-11-25)

- Bổ sung nhãn chữ nhìn thấy cho bảy control P163: tên, mô tả nhận diện, đặc điểm bắt buộc, ảnh tham chiếu, hồ sơ nhân vật, đặc điểm cảnh mới và cảnh Storyboard. Nhãn gắn trực tiếp với input/select hiện hữu, không đổi ID/API hay chủ sở hữu dữ liệu.
- Hosted Chromium mở rộng P169 để kiểm tra cả bảy nhãn liên kết đúng control và có kích thước hiển thị. Đây là kiểm tra DOM/layout, không thay thế rà soát keyboard, screen reader, zoom 200% hoặc chứng nhận WCAG thủ công.


## P161.2 — Đồng bộ camera preset GLB với viewer P74/P81 (candidate · 2026-11-25)

- Nối `CVSpatialWorkspaceP161.apply()` → nạp GLB bằng viewer P74/P81 hiện hữu → áp preset qua API mới `CANVIOThreeGLBViewerP74.applyCameraPose()`. Không tạo renderer/scene/OrbitControls thứ hai.
- Bổ sung X/Y/Z camera position trong P161; preset lưu và áp yaw/pitch/FOV/vị trí. P74 flush OrbitControls damping/inertia trước khi ghi pose tuyệt đối, tránh sai góc do kéo trước đó.
- Hosted test dùng GLB fixture tự chứa để kiểm tra API P74 và replay P161→Asset Library→P74, bao gồm vị trí khác 0. Exact-head CI còn chờ; GLB phức tạp, nhiều camera thật, GPU và kiểm tra trực quan thiết bị vẫn là gate thủ công.


## P166.2 — Gửi Landing Page thật sang Website Engine (candidate · 2026-11-25)

- Nâng `CVLandingStudioP166.sendToWebsite()`: điều hướng đến Website Engine, chờ tối đa 12 giây cho GrapesJS/CSS Manager/P131 sanitizer/canonical save lazy-load xong; trích body HTML, làm sạch bằng P131, bọc root scope riêng, chèn qua `CVWeb.addComponents`, thêm CSS cơ bản và media query mobile qua `CVWeb.Css.setRule`, cuối cùng lưu bằng `CV.engines.web.save`.
- Đã xử lý lỗi CI #817: test gọi `CVWeb` ngay sau điều hướng khi Website Engine chưa lazy-load xong. P166 hiện chờ readiness có giới hạn; Node test mô phỏng editor chỉ sẵn sàng sau 120 ms, Chromium kiểm tra insertion/CSS/save trên editor thật. Nếu timeout hoặc lỗi lưu, không báo thành công giả.
- Không tạo editor/database/CSS store/timeline thứ hai; selector chỉ tác động landing root. Chờ exact-head hosted workflow và full regression trước merge.
- Nội dung vẫn là trang tĩnh; CTA/form chưa có backend, CRM, hosting/publish service. Cần duyệt project thật, keyboard/screen-reader/zoom và thiết bị thật.

## Integrated roadmap acceptance — P132.1 / P163.1.1 / P161.2 / P166.2

- Integrated into main by PR #102 / commit 08efae63b9372fcf8941deac77decad99f3a5076; hosted same-tree run #836 passed 66/66.
- P132.1 local PDF.js import is bounded to one selected page rasterized to PNG and handed to existing Pixel Atelier. PDF.js 6.5.438 / Apache-2.0 is locally vendored and SHA-verified; text/vector editability, password and batch support remain open.
- P163.1.1 makes existing profile inputs visibly labelled without changing profile IDs, persistence, Asset Library or Storyboard ownership.
- P161.2 adds saved GLB camera-position replay through the existing P74/P81 viewer; the current acceptance fixture covers nonzero position and exact pose readback. Complex real-world animated GLBs and physical GPU review remain manual.
- P166.2 sends generated static landing content through P131 sanitizer into existing GrapesJS/CSS Manager and canonical Website save owner. No backend forms, CRM, hosting or publish service is claimed.
- P70 stays blocked until its fourteen real-world gates have independently reviewed evidence.
