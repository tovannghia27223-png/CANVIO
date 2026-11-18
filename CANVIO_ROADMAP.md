# CANVIO — Roadmap gốc và trạng thái tích hợp tới `23.3.108-p85-studio-r2` (2026-11-18)

> **Current local candidate:** `index.html` — `23.3.108-p85-studio-r2`; SHA-256 `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82`; 4,921,610 bytes. PhaseSuite `70.0.0` remains unchanged. P70's fourteen real-world gates remain OPEN. This is a local integration candidate, not a Stable release or a live Pages deployment.
>
> **Newly integrated in this pass:** P85 Creative Runtime Studio source/UI, lazy runtime loaders for WebGL postprocessing, WebGPU path tracing, OpenCV Lucas–Kanade, dotLottie and Rive; P85 npm vendor provisioning script; P102/P105 worker references moved to the same-origin packaged Transformers.js/ONNX runtime; P107 ZIP v2 remains. P74/P81 viewer/decoder bridge and pinned vendor scripts remain in source. Vendor bundles are not present in this local container because npm/GitHub DNS is unavailable.
>
> **Static/source evidence:** 111/111 inline JavaScript blocks parse; 525/525 static HTML IDs are unique; zero duplicate IDs; zero external `<script src>` tags; 21/21 standalone modules synchronized; 3/3 workers parse. P74/P81 source contract 18/18; P85 source contract 13/13 + lazy boot 10/10; P102/P105 worker contract 19/19; P107 portable ZIP 14/14. P97–P101/P104 browser rerun is 35/35. P106 headless fallback and headed Xvfb/ANGLE SwiftShader WebGL are 14/14 each. SwiftShader is software rendering, not physical GPU; vendor runtime files and real model inference remain unverified.

## Tổng quan

- **Historical candidate at roadmap creation:** `23.3.90-p82`. **Current candidate:** `23.3.108-p85-studio-r2` (SHA-256 `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82`); `CANVIOPhaseSuite.version = 70.0.0` remains unchanged. The latest integration addendum is at the end of this file.
- **SHA-256:** See `CANVIO_MANIFEST.json` for current package file hashes and the 23.3.108 handoff ZIP sidecar after package creation.
- **Trạng thái phát hành:** local candidate only. P70 release disposition remains BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE; fourteen real-world gates remain OPEN. Not CANVIO 1.0 Stable; no merge/deploy/production certification.
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


## P71+ — Đối chiếu Skill/Công nghệ & Kế hoạch tiếp theo (2026-11-17)

> **Phạm vi:** đây là bản **audit + kế hoạch**, không phải bản tích hợp. Mọi mục "Kế hoạch" có trạng thái **OPEN/CHƯA LÀM** cho đến khi có code, test và bằng chứng. Không thay đổi marker `23.3.84-p70`, không nâng trạng thái phát hành. Nguyên tắc giữ nguyên: không xóa chức năng hiện có, chỉ gộp/bổ sung; không cloud giả, không API key trong source, không request nền; ưu tiên miễn phí.
>
> **Phương pháp:** quét tĩnh `index.html` (candidate P70) và `CANVIO_AI_GUIDE` bằng tìm chuỗi (three/THREE, gsap, lottie, webgl, GLTF, Brand Kit, getImageData, cubic-bezier, CDN). Đây là bằng chứng **code path hiện diện**, chưa phải nghiệm thu chạy thật.

### A. Làm rõ bản chất "skill"

Mười skill được đối chiếu (Brand Identity, Logo Design, Brand Building, Canvas Design, Theme Factory, Frontend Design, Three.js, GSAP, Design DNA, Motion Design) là **skill cho agent lập trình** (file SKILL.md cài bằng `npx skills add`). Chúng **không** phải module chạy trong CANVIO. Có hai hướng sử dụng, tách bạch:

| Hướng | Ý nghĩa | Ảnh hưởng tới app |
|---|---|---|
| A. Skill cho agent (Claude Code) | Agent viết/sửa code CANVIO đúng chuẩn thư viện hơn | Không thêm dòng nào vào `index.html`; không tốn runtime |
| B. Chức năng tương đương trong app | Người dùng cuối nhận tính năng | Phải có code path, test, và nghiệm thu |

### B. Bảng đối chiếu hiện trạng (hướng B)

| Skill | Hiện trạng trong CANVIO | Mức | Còn thiếu |
|---|---|---|---|
| Brand Identity | Brand Kit (palette, font, quy tắc, preview, kiểm tra tuân thủ), `CVBrandIntegrityQC`, Style DNA, Design System | Khá đủ | Hệ icon, nguyên tắc chuyển động thương hiệu, xuất bộ file brand có cấu trúc |
| Logo Design | Chỉ Asset Library (nhập logo) + Vector Forge (SVG, textPath) | **Thiếu** | Wordmark/monogram/biến thể, thử favicon/nhỏ/nền sáng-tối, xuất bộ logo |
| Brand Building | Không có tầng chiến lược/voice | **Thiếu** | Brief định vị, brand voice, guidelines (có thể chỉ là prompt builder + lưu vào Brand Kit) |
| Canvas Design | Poster, Layout Foundry master, print preflight P67 | Một phần | PDF/X, CMYK, nhúng/outline font, bleed vật lý, crop marks |
| Theme Factory | Brand Kit áp màu/font; Design System | Một phần | Áp đồng bộ một nút sang web/poster/slide/doc; kiểm chứng end-to-end |
| Frontend Design | Website Engine (GrapesJS), AI viết website, Website Motion | Có | Kiểm tra output thật Chrome/Safari; chống giao diện "web AI chung chung" bằng preset phong cách |
| Three.js | Nạp `three r128` qua CDN; hero nền WebGL (Icosahedron, TorusKnot, Points, đèn Point/Ambient), preset orbit/rings/wave/chrome-star, fallback CSS khi WebGL lỗi | **Chỉ hero trang trí** | GLB/GLTF, OrbitControls, vật liệu/texture, bóng, post-processing |
| GSAP | `gsap 3.12.5` + ScrollTrigger + Lenis (CDN), dùng trong Website Motion/export | Có (website) | Đóng gói offline; không chia sẻ editor easing với Video Engine |
| Design DNA | Trích màu từ ảnh (`getImageData`), Style DNA | Một phần | Đo "ADN thiết kế" (màu, chữ, khoảng cách, chuyển động) từ ảnh/link rồi dựng lại |
| Motion Design | Cubic-bezier editor (P47), Motion Lab, easing preset, reduced-motion | Có phần cốt lõi | Checklist tư duy chuyển động (thời lượng, easing, thứ tự); không có Lottie player/export |

Ghi chú Lottie: chỉ xuất hiện như liên kết tham khảo tới LottieFiles; **không** có trình phát hay xuất Lottie.

### C. Công nghệ CGI 3D — đánh giá năng lực

**Đã có (đúng như code path hiện diện):**
- Hero 3D WebGL cho Website Engine bằng three r128 (CDN), có fallback khi không có WebGL.
- P68 Offline 3D: OBJ geometry-only → một file HTML, Canvas 2D (không WebGL), CSP `connect-src 'none'`, giới hạn 5 MiB / 100k đỉnh / 12k tam giác.
- Giao diện 22.8/22.9 và Live 3D Mockup Preview là **CSS 3D transform**, không phải scene WebGL (AI Guide ghi rõ).

**Chưa có (không được tuyên bố):**
- GLB/GLTF loader, FBX, STL, MTL/texture; OrbitControls; camera/ánh sáng 3D trong timeline; compositing 3D; particle system; rigged animation; shader tùy biến; post-processing; render chất lượng cao.
- Motion Lab: không expression, không particle, không tracking/roto, không full 3D.

**Kết luận:** CANVIO **chưa phải công cụ CGI 3D**. Dùng được cho nền 3D trang trí website và xem mesh OBJ đơn giản. Dự án CGI thật (dựng model, vật liệu, ánh sáng, render, ghép video) cần công cụ ngoài (ví dụ Blender), sau đó nhập kết quả (video/ảnh/GLB đã tối ưu) vào CANVIO.

### D. Rủi ro đã xác định

1. **Phụ thuộc CDN:** three, GSAP, ScrollTrigger, Lenis, GrapesJS, Konva, FFmpeg core tải từ CDN. Xung đột nguyên tắc offline; chưa kiểm tra CSP/SRI; mất mạng là mất tính năng. (Trùng mục "Offline/PWA" đã mở.)
2. **three r128 cũ:** skill tham chiếu nhắm bản mới hơn (r186). Nâng bản sẽ có thay đổi API; cần test hồi quy hero trước khi nâng.
3. **Độ tin cậy runtime:** 14 cổng nghiệm thu thật (P70) vẫn OPEN; smoke chạy trên `about:blank` với storage shim, chưa phải Chrome origin thật/IndexedDB native.
4. **Chống phình code:** file đã ~4.2 MB / hơn 21k dòng; thêm engine 3D đầy đủ sẽ làm tăng bộ nhớ, thời gian boot và bề mặt lỗi.

### E. Kế hoạch đề xuất (OPEN — chưa làm)

Thứ tự theo giá trị/chi phí, thân thiện giới hạn usage 5 giờ/tuần (mỗi hạng mục là một lượt nhỏ, chỉ đụng module liên quan):

| # | Hạng mục | Nội dung | Ràng buộc | Tiêu chí hoàn thành |
|---|---|---|---|---|
| P71 | Skill cho agent (hướng A) | Cài Three.js, GSAP, Motion Design, Frontend Design cho Claude Code; ghi chú trong guide | Không sửa `index.html` | Guide ghi rõ skill nào dùng khi nào |
| P72 | GLB/GLTF viewer (mở rộng P68) | Nhập GLB người dùng chọn → xem orbit/zoom/wireframe, giới hạn kích thước/tam giác, xuất HTML đơn | Dùng bản three đóng gói cục bộ, không CDN lúc chạy; giữ OBJ viewer cũ | Test VM + Chromium với GLB mẫu; từ chối file quá giới hạn; báo rõ phần chưa hỗ trợ (animation/rig) |
| P73 | Đóng gói offline thư viện | Nhúng/bundle three, GSAP, ScrollTrigger vào gói xuất website thay vì CDN; CSP kiểm tra | Giữ nguyên chức năng hiện tại; có fallback | Website export chạy khi tắt mạng; kiểm CSP |
| P74 | Nâng three r128 → bản mới | Nâng có kiểm hồi quy hero (preset orbit/rings/wave/chrome-star) | Chỉ sau P72/P73; có đường quay lại | Hero hiển thị đúng; fallback còn hoạt động |
| P75 | Logo Studio (SVG) | Wordmark + monogram từ Brand Kit, biến thể (ngang/dọc/mono/đảo), thử favicon 16–32 px, xuất bộ SVG/PNG | Dùng Vector Forge/Asset Library hiện có; không thêm store mới | Xuất bộ file; kiểm đọc được ở cỡ nhỏ |
| P76 | Brand voice & guidelines | Prompt builder cho định vị/voice; lưu vào Brand Kit; xuất guidelines | Không gọi provider tự động; không lưu key | Guidelines xuất được; chạy offline |
| P77 | Design DNA từ ảnh | Trích màu/chữ/khoảng cách từ ảnh người dùng chọn → áp vào Brand Kit | Cục bộ, không gửi ảnh ra ngoài; ghi rõ độ sai lệch | Báo cáo kèm số đo; không tuyên bố "dựng lại y hệt" |
| P78 | Checklist chuyển động | Gợi ý thời lượng/easing/thứ tự theo ngữ cảnh trong Video/Web Motion | Gợi ý, không tự đổi dữ liệu | Hiển thị trong inspector hiện có |

**Không đưa vào kế hoạch gần:** engine CGI đầy đủ (camera/ánh sáng/render trong timeline), FBX/rig, path-tracing, Lottie authoring, đồng bộ Canva/Figma. Lý do: ngoài phạm vi của một app một-file HTML miễn phí và trái nguyên tắc không mở rộng feature giả.

### F. Điều kiện chuyển trạng thái

- Mỗi mục P71–P78 chỉ được ghi "Đã tích hợp" khi có: thay đổi code cụ thể, test source VM, smoke Chromium, kiểm tĩnh (script parse, ID duy nhất, không `src` ngoài nếu thuộc phạm vi offline), và đoạn "Còn mở" trung thực.
- Mọi hạng mục vẫn phải qua các release gate bắt buộc ở trên; **P70 vẫn là local Release Candidate, không phải CANVIO 1.0 Stable.**
- Không commit/merge/deploy được tuyên bố trong bản cập nhật này.

### G. Disposition

P71+ là cập nhật tài liệu (audit + kế hoạch). Không có thay đổi mã nguồn, không có kết quả test mới, không thay đổi SHA/marker candidate. Cần cập nhật `CANVIO_MANIFEST.json` chỉ khi có bản code mới.


## P79+ — Kế hoạch ưu tiên Hiệu năng & Chất lượng (2026-11-17)

> **Phạm vi:** bổ sung cho P71+; **không thay thế, không xóa** mục nào ở trên. Chủ dự án chọn tiêu chí **hiệu năng + chất lượng, miễn phí, không ràng buộc giấy phép** khi chọn thư viện. Vì vậy các lựa chọn dưới đây ưu tiên bản mạnh hơn (kể cả GPL/AGPL) so với các lựa chọn thận trọng về giấy phép ở P75/P77. Toàn bộ là **OPEN / CHƯA LÀM**; số sao, phiên bản, kích thước chưa được kiểm chứng và phải xác nhận trước khi tích hợp.

### A. Nguyên tắc kỹ thuật bắt buộc cho mọi hạng mục P79+

1. **Nạp lười (lazy-load):** chỉ tải thư viện khi người dùng bấm tính năng; không tăng thời gian boot (candidate hiện ~4.2 MB).
2. **Bundle cục bộ:** không phụ thuộc CDN lúc chạy; ghi rõ kích thước từng gói. Giữ nguyên nguyên tắc không request nền.
3. **Đường lùi:** tính năng cần WebGPU/WebCodecs phải phát hiện khả năng và lùi về đường hiện có (WebGL, MediaRecorder, whisper-tiny) — không xóa đường cũ.
4. **Không thêm store/timeline thứ hai;** ghi qua owner hiện hữu (Video Engine, Asset Library, Project Vault, Unified Layers).
5. **Giấy phép:** chủ dự án chấp nhận rủi ro. Ghi chú: nếu sau này **bán/phát hành** app, thành phần **AGPL (MuPDF)** và **GPL (Potrace)** có thể buộc công khai mã nguồn; cần rà lại trước khi phát hành thương mại.

### B. Danh mục lựa chọn (theo mảng)

| Mảng | Lựa chọn | Lợi ích | Chi phí/rủi ro |
|---|---|---|---|
| Video export | WebCodecs + muxer MP4 (mp4-muxer/mediabunny); giữ FFmpeg.wasm | Encode phần cứng, nhanh hơn thời gian thực; MP4/H.264 ổn định | Viết lại đường export; phụ thuộc hỗ trợ trình duyệt |
| ASR | Transformers.js + WebGPU hoặc whisper.cpp WASM; model `base`/`small` | Chính xác hơn `whisper-tiny` với tiếng Việt; WebGPU nhanh | Tải model lớn hơn; cần đường lùi WASM/CPU |
| 3D hiển thị | three.js bản mới + GLTFLoader + DRACO/meshopt + KTX2 | Giảm mạnh dung lượng model/texture | Bundle cục bộ; hồi quy hero r128 |
| 3D chất lượng | three-gpu-pathtracer (tùy chọn) | Ánh sáng gần Blender | Cần GPU khá; render chậm |
| Hậu kỳ 3D | pmndrs/postprocessing | Bloom/DOF/SSAO hiệu quả | Chỉ khi cần |
| CGI thật | Blender (ngoài app) → GLB → nhập CANVIO | Dựng model/ánh sáng/render thật | Không nhúng được vào app |
| Motion vector | dotlottie-web (WASM) hoặc Rive | Phát Lottie/hoạt ảnh nhẹ | Thêm trình phát; chưa có authoring |
| Chữ/shaping | HarfBuzz WASM hoặc opentype.js | Shaping và dấu tiếng Việt chuẩn; outline font cho logo/in | HarfBuzz nặng hơn |
| Logo trace | Potrace (WASM/JS) | Trace sạch hơn imagetracerjs | GPL |
| PDF | pdf-lib + MuPDF.js | Xuất/đọc PDF chất lượng cao | MuPDF AGPL, vài MB; vẫn chưa là PDF/X/CMYK |
| Tracking | OpenCV.js (tùy chọn) | Optical flow/feature tracking mạnh hơn SAD | Rất nặng (~8–10 MB); chỉ nạp lười |
| Màu | colorjs.io | ΔE chuẩn, nhiều không gian màu (phục vụ Design DNA) | Nhỏ |
| Animation web | GSAP (giữ, bundle cục bộ) | Mượt, ổn định | Giấy phép riêng, không phải OSI |

### C. Thứ tự thực hiện đề xuất

| # | Hạng mục | Nội dung | Điều kiện hoàn thành |
|---|---|---|---|
| P79 | **WebCodecs export** | Đường export mới qua WebCodecs + muxer MP4; giữ WebM/MediaRecorder làm fallback; tôn trọng hủy render (P50) và recovery ledger (P52) | Test source VM + Chromium: MIME/duration/decode đúng; hủy/thử lại không để file dở; trình duyệt không hỗ trợ tự lùi |
| P80 | **Whisper WebGPU + model lớn hơn** | Chọn `base`/`small`, phát hiện WebGPU, lùi WASM/CPU; giữ giới hạn 8 phút/100 MB, hủy/unload (P50), kiểm worker (P59) | Chạy clip tiếng Việt/Anh thật; so lỗi với `tiny`; không ghi cue khi hủy |
| P81 | **3D nén (liên kết P72–P74)** | GLB + DRACO/meshopt + KTX2, three bản mới bundle cục bộ; giữ OBJ viewer P68 và hero cũ | GLB mẫu nhẹ tải đúng; từ chối vượt giới hạn; hero hồi quy đạt |
| P82 | **Chữ & logo** | HarfBuzz/opentype outline cho tiếng Việt; Logo Studio (liên kết P75) dùng Potrace | Dấu không lệch ở cỡ nhỏ; xuất bộ SVG/PNG; thử favicon |
| P83 | **Màu & Design DNA** | colorjs.io đo ΔE (liên kết P77) | Báo cáo kèm số đo thật, không tuyên bố "y hệt" |
| P84 | **PDF chất lượng cao** | pdf-lib (+ MuPDF.js nếu cần); outline font từ P82 | PDF mở đúng ở khổ thật; ghi rõ vẫn chưa PDF/X/CMYK |
| P85 | **Đã tích hợp source/UI; runtime acceptance OPEN** | Creative Runtime Studio có PostFX, WebGPU Path Tracing (fail-closed), OpenCV Lucas–Kanade, dotLottie và Rive; tải lười, kiểm SHA-256 và cùng-origin. | P85 source 13/13 + browser lazy boot 10/10; runtime binaries chưa được provision/local smoke; WebGPU/AI/device acceptance vẫn mở |

### D. Ngân sách hiệu năng (để tránh phình)

- Mỗi hạng mục phải báo cáo: kích thước gói thêm, thời gian nạp lần đầu, RAM đỉnh, ảnh hưởng boot. Dùng P69 (System Health & Performance Budget) làm công cụ đo.
- Không hạng mục nào được làm tăng thời gian boot khi chưa bấm tính năng.
- Hạng mục không đạt ngân sách phải bị loại hoặc chuyển thành tùy chọn tải thêm.

### E. Điều kiện chuyển trạng thái & disposition

- Chỉ ghi "Đã tích hợp" khi có code cụ thể, test source VM, smoke Chromium, kiểm tĩnh và đoạn "Còn mở" trung thực; giữ nguyên các release gate bắt buộc.
- Hiệu năng WebCodecs/WebGPU phụ thuộc phần cứng thật; smoke trên `about:blank` không chứng nhận được — cần nghiệm thu trên Chrome/Edge thật.
- **P70 vẫn là local Release Candidate, không phải CANVIO 1.0 Stable.** Không có commit/PR/merge/deploy nào được tuyên bố. Bản cập nhật này chỉ là tài liệu; không đổi marker `23.3.84-p70`, SHA hay `CANVIO_MANIFEST.json`.


## P86+ — Hướng sản phẩm ưu tiên: Web · Poster · CV · PPT · Canva-like · Video (2026-11-17)

> **Quyết định của chủ dự án:** mục tiêu chính là **làm web, poster, CV, PPT, thiết kế kiểu Canva và video**; **không** ưu tiên game hay CGI 3D. Mục này **đặt thứ tự ưu tiên** cho P71–P85 mà **không xóa** mục nào; nó ghi đè thứ tự thực hiện ở P71+ và P79+ khi có xung đột. Mọi hạng mục vẫn **OPEN/CHƯA LÀM** cho đến khi có code, test và bằng chứng. Marker `23.3.84-p70` và trạng thái Release Candidate không đổi.

### A. Hiện trạng theo mục tiêu (quét tĩnh `index.html` + AI Guide, chưa nghiệm thu chạy thật)

| Mục tiêu | Có gì (code path hiện diện) | Khoảng trống |
|---|---|---|
| **Web** | Website Builder, Website Engine (GrapesJS), AI viết website, Website Motion, hero WebGL tùy chọn, Portfolio Studio | Kiểm output thật Chrome/Safari; phụ thuộc CDN; chưa cùng phong cách bằng một nút |
| **Poster** | Poster Studio, Designer Workspace (Konva), Layout Foundry, print preflight P67, Đa kích thước | Xuất PDF mới là **hộp thoại in** (`window.print`), chưa có PDF dựng trực tiếp; chưa nhúng/outline font, bleed vật lý, CMYK |
| **CV** | Mẫu website CV: Résumé 2 cột in A4, CV 3D, Card, Bento, Portfolio | Chưa thấy xuất **DOCX** thật cho CV; PDF phụ thuộc hộp thoại in; kiểm tra ATS chưa có |
| **PPT** | Có nút xuất **PPTX** và **PPTX sửa được** (chữ/hình/ảnh), xuất tất cả (ZIP, Behance, font nhúng) | Chưa nghiệm thu mở bằng PowerPoint/Keynote/Google Slides thật; font, hoạt ảnh, tỷ lệ chưa chứng nhận |
| **Canva-like** | Brand Kit, Template/Component Library, Asset Library, Creative Hub, Đa kích thước | Áp Brand/Theme đồng bộ một nút chưa chứng nhận; tìm/tag template còn mở |
| **Video** | Video Engine multitrack, WebM/MP4 (MediaRecorder, tùy trình duyệt), Whisper tiny, SRT/WebVTT, ripple/group/snap, tracking SAD | Export phụ thuộc MediaRecorder; ASR `tiny` kém với tiếng Việt; A/V sync thật chưa kiểm |

### B. Thứ tự ưu tiên mới (theo mục tiêu)

| Ưu tiên | Hạng mục | Liên kết | Vì sao |
|---|---|---|---|
| 1 | **PDF dựng trực tiếp + outline/nhúng font** (pdf-lib; opentype.js hoặc HarfBuzz) | P82, P84 | Poster/CV/slide in được, chữ tiếng Việt không lệch dấu; thay hộp thoại in |
| 2 | **CV: xuất DOCX + PDF; kiểm tra ATS** (docx của dolanmiu) | mới (P87) | CV là mục tiêu chính; hiện chưa thấy DOCX |
| 3 | **Nghiệm thu PPTX** (PptxGenJS hoặc giữ đường hiện có; mở bằng PowerPoint/Google Slides) | mới (P88) | Đã có xuất PPTX; cần chứng minh dùng được thật trước khi thêm tính năng |
| 4 | **Brand/Theme áp một nút** sang web, poster, CV, slide (+ colorjs.io) | P76, P77, P83 | Cốt lõi của trải nghiệm kiểu Canva: một bộ nhận diện, mọi sản phẩm cùng diện mạo |
| 5 | **WebCodecs export** (+ MP4 ổn định, giữ fallback MediaRecorder) | P79 | Video xuất nhanh, đáng tin |
| 6 | **Whisper WebGPU + model `base`/`small`** | P80 | Phụ đề tiếng Việt chính xác hơn |
| 7 | **Logo Studio** (wordmark/monogram, favicon, bộ biến thể; Potrace) | P75, P82 | Thương hiệu cho cả bộ sản phẩm |
| 8 | **Đóng gói offline** website/export (three/GSAP bundle cục bộ, CSP) | P73 | Không phụ thuộc CDN; website xuất chạy khi mất mạng |
| 9 | **Template tìm/tag + Đa kích thước** hoàn thiện | mới (P89) | Tốc độ làm việc kiểu Canva |

### C. Hạ ưu tiên (không xóa, chỉ để sau cùng)

- **Game, CGI/3D nặng:** three-gpu-pathtracer, postprocessing, Matter.js, GLB/DRACO/KTX2 đầy đủ (P72, P74, P81, P85) — chỉ giữ hero 3D nền website và viewer OBJ hiện có.
- **OpenCV.js tracking, Rive/Lottie authoring:** chỉ khi có nhu cầu video cụ thể.
- Skill agent liên quan 3D (Three.js skill) vẫn có thể cài ở P71 vì không làm nặng app.

### D. Tiêu chí hoàn thành cho nhóm ưu tiên 1–4

- **PDF:** mở bằng trình đọc thật ở khổ thật (A4/poster); chữ tiếng Việt đúng dấu; font nhúng/outline; ghi rõ vẫn **chưa PDF/X/CMYK** nếu chưa làm.
- **CV DOCX:** mở đúng trong Word/Google Docs; văn bản chọn/sao chép được; có báo cáo kiểm ATS dạng gợi ý (không bảo đảm kết quả tuyển dụng).
- **PPTX:** mở bằng PowerPoint và Google Slides; kiểm font, tỷ lệ 16:9, chữ chỉnh sửa được; ghi rõ phần không hỗ trợ (hoạt ảnh phức tạp).
- **Brand một nút:** áp lên ít nhất web + poster + CV + slide; có nút hoàn tác và báo cáo thay đổi; không đổi nội dung người dùng ngoài màu/font đã chọn.
- Mỗi hạng mục báo cáo kích thước thêm, RAM đỉnh, ảnh hưởng boot (dùng P69); nạp lười; có đường lùi; không thêm store/timeline thứ hai.

### E. Disposition

Tài liệu ưu tiên, không đổi mã nguồn, không có test mới, không đổi SHA/marker/`CANVIO_MANIFEST.json`. Phát hiện "chưa có DOCX" và "PDF = hộp thoại in" dựa trên quét chuỗi và cần xác nhận trong ứng dụng trước khi làm. **P70 vẫn là local Release Candidate, không phải CANVIO 1.0 Stable;** không có commit/PR/merge/deploy nào được tuyên bố.


## P90+ — UI/UX: Dễ tìm, dễ dùng, không giấu chức năng (2026-11-17) — **ƯU TIÊN CAO NHẤT**

> **Quyết định của chủ dự án:** UI/UX được làm **trước** P79+ và P86+ (các mục đó giữ nguyên, chỉ lùi sau). Vấn đề cần giải quyết: công cụ có nhiều chức năng nhưng **bị giấu hoặc khó tìm, khó dùng**. Phạm vi: **chỉ thêm lớp điều hướng/hiển thị**, không xóa nút/trang/chức năng cũ, không đổi engine, state owner, schema, storage. Mọi mục **OPEN/CHƯA LÀM** đến khi có code, test và nghiệm thu; marker `23.3.84-p70` không đổi.

### A. Hiện trạng (quét tĩnh, chưa nghiệm thu chạy thật)

- Menu có hơn 20 trang/công cụ (Poster, Website, Brand, Templates, Assets, Motion, Video Studio, Video Engine, Designer Workspace, Website Engine, Platform, ArtCraft, ShotCraft, HR Visual, v.v.). Số lượng công cụ chồng lấn là nguyên nhân chính khiến khó tìm.
- **Đã có** điều hướng bàn phím/Ctrl+K (AI Guide có nêu "Sidebar · Ctrl+K · Điều hướng"; mã có nhiều chỗ bắt tổ hợp Ctrl/Meta+K). Mức phủ lệnh (bao nhiêu chức năng tìm được) **chưa được xác minh** — việc đầu tiên là kiểm kê, không viết mới.
- Phong cách hiện tại (bản 23.2): nền sáng, nút chính hồng neon, viền đen, lớp 3D CSS; có `prefers-reduced-motion` và focus outline. Giữ nguyên tokens, không dựng theme thứ hai.

### B. Nguyên tắc (thay cho "ẩn sau nút")

1. **Việc hay dùng luôn hiện sẵn:** mỗi công cụ có thanh hành động cố định cho tác vụ chính; không bắt mở menu sâu.
2. **Nâng cao = khu "Nâng cao" luôn nhìn thấy nhưng thu gọn**, mỗi mục có nhãn chữ và một dòng "làm gì / khi nào dùng". Không giấu hoàn toàn.
3. **Mở rộng Ctrl+K hiện có** (không tạo bảng lệnh thứ hai): phủ mọi chức năng chính, tìm theo từ khóa tiếng Việt/Anh không dấu ("xuat pdf", "phu de", "ap mau").
4. **Chế độ Đơn giản / Đầy đủ:** Đơn giản chỉ hiện việc chính cho web, poster, CV, PPT, video; Đầy đủ hiện tất cả. Công tắc rõ ở đầu trang, nhớ lựa chọn (localStorage có try/catch, không phải dữ liệu dự án).
5. **Lối tắt theo mục tiêu ở trang chủ:** Làm CV · Làm poster · Làm slide · Làm website · Làm video → vào đúng công cụ kèm template.
6. **Nhãn chữ cho mọi nút quan trọng** (không chỉ icon), gợi ý khi di chuột; trạng thái giới hạn nói thẳng (ví dụ "Trình duyệt chưa hỗ trợ MP4, đang dùng WebM"; "PDF chưa phải CMYK/PDF-X").
7. **Một nơi cho mỗi việc:** không thêm trang mới nếu panel hiện có đặt được; công cụ chồng lấn chỉ **gắn nhãn và liên kết**, không xóa.

### C. Hạng mục

| # | Hạng mục | Nội dung | Điều kiện hoàn thành |
|---|---|---|---|
| P90 | **Kiểm kê UX** | Liệt kê mọi trang/nút chính, chỗ chức năng nằm sâu, trùng lặp; đo số bước từ trang chủ tới tác vụ (xuất PDF, xuất PPTX, áp thương hiệu, tạo phụ đề) | Bảng kiểm kê trong báo cáo; xác định 5–10 chỗ khó dùng nhất theo bằng chứng, kết hợp phản hồi của chủ dự án |
| P91 | **Mở rộng Ctrl+K** | Đăng ký lệnh cho mọi chức năng chính trên cùng bảng lệnh hiện có; tìm không dấu; phím tắt hiển thị cạnh lệnh | Test: mọi tác vụ mục tiêu mở được trong ≤2 thao tác; bàn phím-only; không lỗi khi lệnh trỏ tới engine chưa nạp |
| P92 | **Lối tắt theo mục tiêu** | Thẻ "Làm CV/poster/slide/website/video" ở trang chủ, mở công cụ + template phù hợp | Mỗi thẻ vào đúng công cụ; không đổi engine; có hoàn tác khi áp template |
| P93 | **Chế độ Đơn giản / Đầy đủ** | Lọc menu và thanh công cụ theo mục tiêu; nhớ lựa chọn; mặc định hiển thị rõ cách chuyển | Không mất chức năng ở chế độ Đầy đủ; Đơn giản vẫn có nút "Hiện tất cả" |
| P94 | **Thanh hành động cố định + khu Nâng cao** | Chuẩn hóa vị trí Xuất/Áp thương hiệu/Đa kích thước/Hoàn tác ở Poster, CV, Slide, Video | Nút chính nhìn thấy không cuộn; khu Nâng cao có mô tả từng mục |
| P95 | **Nhãn, gợi ý, trạng thái lỗi** | Nhãn chữ cho nút quan trọng; thông báo giới hạn/lùi đường (WebM, PDF, WebGPU) bằng ngôn ngữ dễ hiểu | Rà theo P60 (accessibility screening): tên truy cập, focus, tương phản |
| P96 | **Onboarding nhẹ** | Gợi ý một lần cho lối tắt và Ctrl+K; có nút bỏ qua; không chặn thao tác | Không popup lặp; tắt được vĩnh viễn |

### D. Ràng buộc

- **Không xóa/ẩn vĩnh viễn** trang hoặc chức năng cũ; không đổi ID/đường dẫn mà test hiện có phụ thuộc (kiểm tĩnh 504 ID unique phải còn đạt); cập nhật guide cùng lúc nếu đổi ID/trang.
- Không thêm store dữ liệu dự án, không CDN/thư viện mới cho phần UI, không polling.
- Tuân thủ `prefers-reduced-motion`, focus nhìn thấy, bàn phím-only, thu phóng 200%; hiệu năng: không tăng thời gian boot đáng kể (đo bằng P69).
- Thiết kế theo yêu cầu của chủ dự án: chuyên nghiệp, tinh gọn, dễ dùng.

### E. Nghiệm thu

- Kiểm theo kịch bản thật: người dùng mới làm CV, poster, slide, xuất PDF/PPTX, tạo phụ đề trong ≤ số bước đã đặt; đo số bước trước/sau.
- Smoke Chromium + source VM + kiểm tĩnh; accessibility thật (bàn phím, trình đọc màn hình, 200%) vẫn nằm trong release gate, không thay bằng heuristic.
- **P70 vẫn là local Release Candidate, không phải CANVIO 1.0 Stable.** Không có commit/PR/merge/deploy được tuyên bố; mục này không đổi mã nguồn, SHA hay `CANVIO_MANIFEST.json`.

### F. Thứ tự tổng sau cập nhật

P90–P96 (UI/UX) → P86+ nhóm ưu tiên 1–4 (PDF, CV DOCX, PPTX, Brand một nút) → P79/P80 (WebCodecs, Whisper) → P75/P82 (Logo, chữ) → P73 (offline) → phần 3D/game cuối cùng. Mọi mục trước đó giữ nguyên, chỉ đổi thứ tự thực hiện.


## P97+ — Video Editor UX & Đạo diễn AI (đối chiếu trình dựng tham chiếu) (2026-11-17)

> **Thứ tự:** thực hiện **sau P90–P96** (UI/UX) và trước/song song với P79–P80 (WebCodecs, Whisper) khi chúng chạm cùng module. Không xóa/đổi owner của Video Engine; mọi thay đổi commit qua Video Engine owner hiện có. Tất cả **OPEN/CHƯA LÀM**; marker `23.3.84-p70` không đổi.
>
> **Nguồn đối chiếu:** ba ảnh chụp trình dựng video tham chiếu do chủ dự án cung cấp (có Đạo diễn AI, thanh công cụ, hộp xuất, thư viện hiệu ứng). `goodmotion.vercel.app` **không phải trình dựng video** mà là thư viện component animation GSAP (cần đăng nhập miễn phí để chép; có repo công khai); chỉ dùng làm **nguồn ý tưởng cho Website Motion**, không tích hợp, và phải xem điều khoản repo trước khi dùng mã.
>
> **Phương pháp:** quét tĩnh chuỗi trong `index.html` (candidate đã nộp). Là bằng chứng **mã có hiện diện**, không phải nghiệm thu chạy thật. Số ước lượng bên dưới là thô, không phải phép đo.

### A. Hiện trạng đã xác minh bằng quét mã

**Có (chính):** timeline nhiều track với ẩn/khóa/mute (P48); snap, ripple, nhóm clip, dọn khoảng trống (P64); AutoCut silence, beat sync, speed ramp; LUT/đường cong/Selective HSL/scopes; chuyển cảnh, crossfade, PiP; Audio Mixer Pro (envelope, sidechain ducking, loudness), waveform, marker; **Media Recovery & Proxy Desk** (tạo proxy cho clip đang chọn, chọn proxy profile); phụ đề SRT/WebVTT, Whisper, QC phụ đề; chroma key; ổn định hình (P65, SAD); preset 9:16; xuất MP4/WebM, hủy render, phục hồi, QC sau xuất.

**Có nhưng yếu (phụ):**
- Tách nền chỉ **theo màu mẫu**, chưa tách người bằng AI.
- Bitrate xuất **cố định trong mã** (6 Mbps ở một đường; 1.2/2.5 Mbps ở đường khác theo chiều cao), người dùng chưa chọn được.
- Kho SFX chỉ là **liên kết ngoài** (YouTube Audio Library), chưa phải kho tích hợp.

**Không có / không thấy:** Đạo diễn AI điều khiển timeline bằng chat; bộ công cụ slip/slide/blade/pen đầy đủ và phím tắt V/B/C/Y/P/H/T; phụ đề từng từ (karaoke); sửa video theo transcript; Extension Center; hộp xuất chọn 4K/fps/độ phân giải/bitrate và xuất kèm tách nhạc/lớp motion/file phụ đề.

**Ước lượng thô:** phần kỹ thuật dựng cơ bản–trung cấp đã có phần lớn; khoảng trống chủ yếu nằm ở **cách dùng** (điều khiển bằng chat, công cụ/phím tắt, hộp xuất, transcript).

> Chỉnh sửa đối với nhận định trước đó trong phiên: "Proxy: chưa chắc" → **xác nhận có**; "Đạo diễn AI: chưa rõ" → **xác nhận không có**.

### B. Hạng mục

| # | Hạng mục | Nội dung | Ràng buộc | Điều kiện hoàn thành |
|---|---|---|---|---|
| P97 | **Đạo diễn AI (chat điều khiển timeline)** | Ô chat tiếng Việt + nút gợi ý ("Cắt im lặng", "Dọn khoảng trống", "Phụ đề từng từ", "Zoom 1,3 lần", "Clip nhanh gấp đôi", "Màu ấm kiểu điện ảnh"). Chuyển lời lệnh thành **kế hoạch lệnh có xem trước** rồi áp bằng API Video Engine sẵn có (AutoCut, speed, keyframe, LUT) | Chỉ chạy sau khi người dùng bấm xác nhận; có **Hoàn tác lượt này**; không gọi provider tự động; không lưu API key; có chế độ không-AI dùng khớp từ khóa/quy tắc (miễn phí, offline); khóa track/clip bị tôn trọng | Test: mỗi lệnh mẫu tạo đúng kế hoạch và áp đúng; hoàn tác trả đúng trạng thái; lệnh không hiểu bị từ chối an toàn |
| P98 | **Thanh công cụ + phím tắt chuẩn** | Chọn, chọn track, ripple, blade/cắt, slip, pen, hand, text; phím V/A/B/C/Y/P/H/T; hiển thị dải gợi ý phím ở đáy | Dùng lại thao tác hiện có; thêm slip/slide qua owner Video Engine; không xung đột phím với ô nhập liệu | Mỗi công cụ có nhãn và phím; bàn phím-only; Undo/Redo đúng |
| P99 | **Phụ đề từng từ** | Dùng timestamp từ Whisper để tạo cue theo từ, highlight theo giọng; kiểu karaoke | Chỉ ghi vào track chữ canonical; QC phụ đề (P49) vẫn chạy; ghi rõ độ chính xác phụ thuộc model | Cue từng từ khớp thời gian trên clip thật; không ghi cue khi hủy |
| P100 | **Sửa theo transcript** | Hiển thị transcript từ Whisper; xóa/chọn đoạn chữ → cắt đoạn tương ứng (ripple) | Qua ripple planner P64; tôn trọng khóa; có hoàn tác; nhắc rà lại vì có thể nhận dạng sai | Xóa một câu cắt đúng đoạn hình/tiếng; hoàn tác đúng |
| P101 | **Hộp xuất chi tiết** | Chọn độ phân giải (480p–4K tùy hỗ trợ), fps, bitrate, chất lượng; xuất kèm file phụ đề, tách nhạc, lớp motion; QC tự động sau xuất | Dựa P79 (WebCodecs) khi có; lùi về MediaRecorder; thông báo rõ giới hạn trình duyệt (MP4/4K) | Blob MIME/duration/decode đúng; hủy/thử lại đúng; không hứa 4K nếu máy không hỗ trợ |
| P102 | **Tách nền người (tùy chọn)** | Tách nền người cục bộ bằng model nhẹ (ví dụ MediaPipe selfie segmentation), nạp lười | Nặng: chỉ tải khi bấm; đo RAM/boot bằng P69; giữ chroma key cũ | Mặt nạ ổn định trên clip thật; có nút tắt; không gửi dữ liệu ra ngoài |
| P103 | **Kho hiệu ứng/âm tích hợp (tùy chọn)** | Thư viện hiệu ứng và SFX miễn phí nhúng cục bộ, có tìm kiếm | Chỉ nguồn có giấy phép dùng được; ghi attribution vào metadata Asset Library | Mỗi mục có nguồn/giấy phép; tìm và kéo vào timeline được |

### C. Nguyên tắc UX áp dụng (đồng bộ P90–P96)

- Việc chính của video hiện ở **thanh hành động cố định** và **ô Đạo diễn AI**; chức năng nâng cao nằm trong khu "Nâng cao" luôn nhìn thấy, không giấu.
- Mọi lệnh AI phải **xem trước, xác nhận, hoàn tác được**; không sửa timeline âm thầm.
- Giữ phong cách hiện tại; không thêm store/timeline thứ hai; không CDN mới; không request nền.

### D. Nghiệm thu & disposition

- Mỗi hạng mục cần source VM + smoke Chromium + kiểm tĩnh; hiệu năng/độ chính xác (Whisper từng từ, tách nền, WebCodecs, xuất 4K) cần **nghiệm thu trên Chrome/Edge thật với media thật** — smoke trên `about:blank` không chứng nhận được.
- Tài liệu này không đổi mã nguồn, SHA, `CANVIO_MANIFEST.json`. **P70 vẫn là local Release Candidate, không phải CANVIO 1.0 Stable;** không có commit/PR/merge/deploy nào được tuyên bố.

### E. Thứ tự tổng cập nhật

P90–P96 (UI/UX) → **P97–P101 (Video Editor UX)** → P86+ nhóm 1–4 (PDF, CV DOCX, PPTX, Brand một nút) → P79/P80 (WebCodecs, Whisper; làm cùng P101/P99 khi chạm cùng module) → P75/P82 (Logo, chữ) → P73 (offline) → P102–P103 (tùy chọn) → 3D/game cuối cùng.


## P104+ — Ảnh → Video & Ảnh nổi 2.5D (2026-11-17)

> **Thứ tự:** sau P97–P101 (Video Editor UX); bước 1 có thể làm sớm vì nhẹ. Không xóa/đổi owner Video Engine, Asset Library, Project Vault; mọi clip tạo ra commit qua Video Engine owner. Tất cả **OPEN/CHƯA LÀM**; marker `23.3.84-p70` không đổi.

### A. Hiện trạng (quét tĩnh `index.html` + AI Guide; chưa nghiệm thu chạy thật)

- **Không có** ảnh → video AI (AI Guide: tự gọi model sinh ảnh/video thật nằm ngoài phạm vi; Prompt Forge chỉ viết prompt).
- **Không có** ảnh → model 3D, **không có** 2.5D bằng bản đồ độ sâu. Parallax chỉ có ở website (cuộn trang, mặc định tắt), không áp cho ảnh người dùng.
- **Không thấy** Ken Burns tự động hay trình chiếu ảnh tự động.
- **Có thể làm thủ công:** đưa ảnh vào Video Engine, dùng `CVKeyframeStudio` (keyframe), chuyển cảnh, nhạc, xuất WebM/MP4.

### B. Nguồn tham khảo (mã nguồn mở; chưa đọc giấy phép/mã chi tiết — phải kiểm trước khi dùng mã)

| Nguồn | Giá trị | Giới hạn |
|---|---|---|
| Bài dev.to "cinematic depth in the browser with Depth Anything V2 Small + WebGPU" và repo `MartinDelophy/ai-video-editor` | Mẫu kiến trúc đúng nhất: `@huggingface/transformers`, Depth Anything V2 Small (Q4F16), WebGPU, chạy cục bộ; lấy mẫu depth theo timestamp, **lưu và tái dùng** cho preview/export; đổi hiệu ứng không tính lại model | Bài dùng **blur theo độ sâu**, không dịch mesh; cần WebGPU; depth chỉ tương đối; video có thể lệch khi chuyển động nhanh; chưa xem giấy phép repo |
| DepthFlow (BrokenSource/DepthFlow) | Shader parallax 2.5D từ depth map (DepthAnything); xuất H.264/HEVC/AV1; các kiểu chuyển động camera | Python + GPU (tối ưu NVIDIA); **không nhúng được** vào HTML; chỉ tham khảo thuật toán/kiểu chuyển động; xem `License.md` |
| kburns (remko), editly | Cách ghép Ken Burns, slideshow, chuyển cảnh | Node/FFmpeg; chỉ tham khảo |
| 3D Ken Burns (nhiều repo, dựa bài báo 2019), Parallax Maker, depthlift | Chuyển động camera 3D, inpainting, tạo lớp | Python/PyTorch/Flutter, nặng; không nhúng |

### C. Hạng mục (từ nhẹ tới nặng)

| # | Hạng mục | Nội dung | Ràng buộc | Điều kiện hoàn thành |
|---|---|---|---|---|
| P104 | **Ken Burns một nút + trình chiếu ảnh** | Chọn nhiều ảnh, chọn kiểu zoom/pan (vào/ra/trái/phải, ngẫu nhiên có seed), thời lượng, chuyển cảnh, nhạc → tạo clip/keyframe trên timeline canonical. Hỗ trợ tỷ lệ 9:16/16:9/1:1; tự cắt khung giữ chủ thể ở mức cơ bản | Không model, không mạng; dùng keyframe/transition sẵn có; xem trước, xác nhận, **hoàn tác một lượt**; tôn trọng khóa track; giới hạn số ảnh/kích thước | Test: sinh đúng số clip/keyframe; xuất qua Video Engine; hoàn tác đúng; ảnh lỗi bị từ chối an toàn |
| P105 | **Bản đồ độ sâu cục bộ** | Depth Anything V2 Small (lượng tử hóa) qua Transformers.js: ưu tiên WebGPU, lùi WASM/CPU; chạy trong worker; **lưu depth theo ảnh/timestamp** để dùng lại; nút hủy, giải phóng model; xem trước depth | Nạp lười, chỉ sau thao tác người dùng; thông báo dung lượng và lần tải đầu; không gửi ảnh ra ngoài; lưu qua Asset Library (không store mới); giới hạn độ phân giải/kích thước | Chạy trên ảnh thật; hủy không để dữ liệu dở; báo rõ khi máy không hỗ trợ; đo RAM/thời gian bằng P69 |
| P106 | **Ảnh nổi 2.5D (parallax bằng depth)** | Shader/three.js dịch lớp theo depth cho chuyển động camera (dolly, orbit nhẹ, zoom), loop mượt; chỉnh cường độ, điểm lấy nét, làm mờ nền theo độ sâu; ghi ra clip video qua Video Engine | Giữ trong giới hạn artefact (viền/lỗ hổng): có nút giảm cường độ; dùng bản three đóng gói cục bộ (xem P73/P81); có fallback 2D (Ken Burns) nếu không có WebGL/WebGPU; reduced-motion | Preview mượt trên máy thật; xuất MP4/WebM đúng thời lượng; so với ảnh gốc không méo nặng ở cường độ mặc định |
| P107 | **Lưu/áp lại cài đặt** | Preset chuyển động và depth đã tính nằm trong project, chỉnh cường độ **không chạy lại model** | Ghi qua Project Vault hiện có; không thêm store | Mở lại dự án thấy đúng hiệu ứng; không tính lại depth |

### D. Không đưa vào kế hoạch

- **Ảnh → model 3D thật** (kiểu TripoSR/Meshy): quá nặng cho app một file; dùng công cụ ngoài rồi nhập GLB (liên kết P72/P81).
- **Ảnh → video AI sinh nội dung** (kiểu image-to-video diffusion): cần dịch vụ ngoài/GPU lớn; chỉ hỗ trợ **quy trình thủ công** — Prompt Forge viết prompt, người dùng chạy ở dịch vụ ngoài, nhập video về Asset Library.

### E. Giới hạn trung thực phải hiển thị ở UI

- Depth là **tương đối**, không phải khoảng cách thật; ở cạnh vật thể có thể có viền/méo.
- Cần WebGPU để nhanh; máy yếu/di động có thể chậm hoặc thiếu bộ nhớ; lần đầu phải tải model.
- Video (nếu về sau lấy mẫu depth theo thời gian) có thể lệch khi chuyển động nhanh.
- Đây là **hiệu ứng 2.5D**, không phải mô hình 3D.

### F. Nghiệm thu & disposition

- Mỗi hạng mục cần source VM + smoke Chromium + kiểm tĩnh; chất lượng depth, hiệu năng WebGPU và xuất video cần **nghiệm thu trên Chrome/Edge thật với ảnh/máy thật**; smoke `about:blank` không chứng nhận được.
- Phải kiểm giấy phép từng mã/model tham khảo trước khi sao chép; chủ dự án đã chấp nhận rủi ro giấy phép nhưng cần ghi nguồn.
- Tài liệu này không đổi mã nguồn, SHA, `CANVIO_MANIFEST.json`. **P70 vẫn là local Release Candidate, không phải CANVIO 1.0 Stable;** không có commit/PR/merge/deploy nào được tuyên bố.

### G. Thứ tự tổng cập nhật

P90–P96 (UI/UX) → P97–P101 (Video Editor UX) → **P104 (Ken Burns, nhẹ)** → P86+ nhóm 1–4 (PDF, CV DOCX, PPTX, Brand một nút) → P79/P80 (WebCodecs, Whisper) → **P105–P107 (depth, 2.5D)** → P75/P82 (Logo, chữ) → P73 (offline) → P102–P103 (tùy chọn) → 3D/game cuối cùng.

---

## Implementation addendum — P90–P96, P97–P101, P104, P87 (2026-11-17)

> **Historical candidate snapshot:** `23.3.88-p87` · base chain `23.3.84-p70` → P90–P96 → P97–P101 → P104 → P87. `CANVIOPhaseSuite.version` remains `70.0.0`. This records local implementation and synthetic evidence, not production release approval.

### Completed locally in this candidate

| Roadmap item | Candidate implementation | Validation | Open boundary |
|---|---|---|---|
| P90–P96 | Home goal shortcuts, expanded accent-insensitive Ctrl+K command search, Simple/Full mode, editor action bars, advanced disclosures and dismissible onboarding | Chromium smoke **34/34** (latest combined P84/P90 smoke) | WCAG, screen reader, true 200% zoom and real-user navigation review |
| P97 | Local video director with command plan/preview, explicit apply and undo; no provider call | Included in P97–P101 smoke **35/35** | Command coverage and real project acceptance |
| P98 | Truthful tool availability and V/B shortcuts; unsupported slip/slide/pen/hand tools remain disabled with explanation | Included in P97–P101 smoke | Keyboard-only acceptance across browsers; missing tools remain unbuilt |
| P99 | Per-word subtitle cue creation from existing cue timing | Included in P97–P101 smoke | Proportional timing is estimated, not acoustic alignment; test with real Vietnamese audio |
| P100 | Transcript text edit and ripple planner via P64; respects locked tracks | Included in P97–P101 smoke | Real footage/transcript and complex lock interactions |
| P101 | Resolution/FPS/bitrate normalization, MP4 option matches native H.264 capability, subtitle sidecars, export MIME/duration/canplay screen | Synthetic WebM generated and decoded to `canplay` in smoke | Full-file decode, real A/V sync, cancel/retry, target hardware and long renders |
| P104 | Local image slideshow/Ken Burns using current Asset Library + canonical Video Engine; max 24 images, 5 MiB/image, 40 MiB/batch; preview/confirm/single undo; deterministic seeded movement | Two actual PNG fixtures imported; clip/fade/keyframes checked; one undo restored state | 9:16/1:1 and subject-aware crop intentionally not claimed; fixed 16:9 engine, real asset/media/persistence acceptance open |
| P87 | Editable single-column DOCX from CV Studio fields, built with existing `CVZip`; local ATS checklist | Browser + OOXML validation **14/14**; ZIP CRC and all 7 XML/package parts verified | Desktop Word/Google Docs, font embedding and pagination acceptance; ATS heuristic is not a hiring guarantee |
| P88 | Existing editable PPTX serializer for supported text/basic shapes and separate PNG media objects | OOXML structure smoke **14/14**; ZIP CRC, XML, 16:9 and no external links | Desktop PowerPoint/Google Slides open-edit-save-reopen, font substitution/embedding, complex animations, notes and master/theme fidelity |

### Updated static/browser verification

- Static source: **95/95** inline JavaScript blocks pass `node --check`; **507/507** static IDs unique; no duplicate IDs; no external `<script src>`.
- P90–P96 + P84/P87 quick-action routing Chromium smoke: **34/34 PASS**.
- P97–P101 + P104 Chromium smoke: **35/35 PASS**. This includes synthetic image import, timeline keyframes, fade and single Undo; WebM validation is a MIME/duration/`canplay` screen only.
- P87 CV DOCX/ATS smoke: **14/14 PASS**. Python ZIP CRC and XML parsing confirm structurally valid OOXML; no installed desktop Office was used.
- P63–P67 inherited Chromium regression on exact candidate: **43/43 PASS**; P63–P67 source VM: **18/18 PASS**.
- P68–P70 source VM: **16/16 PASS**. Release gate still reports **14/14 OPEN**, `releaseCertified:false`.
- All browser fixtures use opaque `about:blank` and test-only in-memory storage shims. No live HTTPS, native IndexedDB restart, cross-origin restore or deployment acceptance is claimed.

### Priority continuation

P86 priority 1 now has a local implementation: **P82/P84 direct mixed vector/raster PDF with embedded Vietnamese-capable Noto Sans** for Poster/Slide. The remaining acceptance is real HTTPS/origin testing, broader PDF reader/printer review and a separate CV direct-PDF route. P87/P88 have synthetic LibreOffice open/edit/save/reopen evidence, but Word/PowerPoint and Google Workspace acceptance remain open. The next implementation tranche is **P76/P77/P83 one-click Brand/Theme propagation** across Web + Poster + CV + Slide with preview and canonical Undo. P79/P80 and P105–P107 stay later according to the user's product priorities.

### Release and deployment disposition

Historical candidate `23.3.88-p87` was local only; current candidate is `23.3.89-p84`. Do not label CANVIO 1.0 Stable or merge/deploy solely from the listed smoke tests. The inherited P70 gate is intentionally fail-closed with fourteen real-world checks pending. No GitHub commit, PR, merge, hosted Actions run or deployment was performed in this turn.


## Implementation addendum — P84 partial direct PDF workflow (2026-11-17)

> **Historical candidate:** `23.3.89-p84` · base: `23.3.88-p87` · PhaseSuite remains `70.0.0`. This section records the original local workflow integration over the existing Poster PDF exporter; it is not completion of the full P82/P84 PDF-quality objective.

### Implemented
- Poster/Slide sticky action bar now exposes **Xuất PDF trực tiếp** and calls the existing `CVLot22.pdf()` / `#cv-pdf` owner after routing to Poster Studio.
- Ctrl+K now exposes separate commands for **Xuất PDF trực tiếp · Poster / Slide** and **Mở Layout Foundry · in / lưu PDF**. This distinguishes a direct generated raster PDF from the browser Print workflow.
- CV Studio quick action surfaces the existing P87 **Xuất CV DOCX** button. CV direct PDF is still not implemented.
- No new PDF engine, dependency, CDN, network request, project store, document store or second editor was introduced.

### Verified
- Actual browser download: `canvio-thiet-ke.pdf`, 51,213 bytes, `%PDF-1.4`; the generated page has a MediaBox and a JPEG image XObject.
- P84 + P90–P96 Chromium: **34/34 PASS**.
- P97–P101 + P104 Chromium: **35/35 PASS**.
- P87 DOCX/ATS/OOXML Chromium: **14/14 PASS**.
- P68–P70 source VM: **16/16 PASS**.
- Static audit: **95/95** inline scripts parse, **507/507** unique static IDs, no duplicates/external script src, six standalone modules synchronized.

### P84 is still PARTIAL — limitations
- Poster/Slide PDF currently rasterizes each page into an image-backed PDF. Text is not selectable or vector; fonts are not embedded or outlined.
- Current 1×/1.5×/2× choices adjust raster resolution only.
- No PDF/X, CMYK, physical bleed/crop-box, printer-proof or font-license certification.
- CV PDF is still browser Print; DOCX is the existing editable OOXML path.
- Word/Google Docs and actual PDF reader/printer acceptance remain OPEN. All browser tests here are opaque-origin synthetic fixtures.
- P70's fourteen real-world gates stay OPEN; this local candidate is not Stable and has not been committed, merged or deployed.

### Next priority
Continue P84/P82 by reviewing a free, locally bundled PDF/vector/font pipeline only after license, package-size and offline review; prefer selectable text with Vietnamese shaping and safe font embedding/outline. Extend to CV/Slide only through existing owners. Do not replace the present raster exporter until the new path passes comparison and has a reliable fallback.

## Implementation / verification addendum — P88 editable PPTX structure (2026-11-17)

> **Historical source marker:** `23.3.89-p84` · PhaseSuite `70.0.0`. P88 work in this addendum verifies the existing PPTX serializer; it does not claim desktop Office acceptance or a full new PPTX implementation.

- The existing action `#cv-pptx2` calls `CVLot23.pptx(gen)` from the Poster/Slide layer owner. It emits supported text/basic shapes as editable DrawingML objects and raster images as separate picture/media entries.
- `tests/p88/run-p88-pptx-smoke.py`: **14/14 PASS** in Chromium 144 `about:blank`. The synthetic 16:9 package (15,251 bytes) passed ZIP CRC, required core package parts, XML parsing, editable Vietnamese text, separate picture/media, 16:9 dimensions and no external linked relationships.
- P88 has **not** been opened/edited/saved/reopened in Microsoft PowerPoint, Keynote or Google Slides. Font substitution/embedding, complex animation, notes, master/theme fidelity and full real-project round-trip remain OPEN.
- Latest candidate checks: P84/P90 **34/34**; P97/P104 **35/35**; P87 **14/14**; P88 **14/14**; P68/P70 source VM **16/16**; P63/P67 source VM **18/18**; static **95/95** inline scripts, **507/507** unique IDs, zero duplicate IDs/external script src.
- P63–P67 inherited Chromium regression was rerun on exact current candidate `23.3.89-p84`: **43/43 PASS**. The harness still uses `about:blank` and in-memory shims, so origin-dependent gates remain OPEN.
- Next: P82/P84 vector/selectable Vietnamese PDF + legal font embedding/outline review; then DOCX/PPTX cross-application acceptance; next implement P76/P77/P83 Brand/Theme propagation with preview and undo. Keep P70's fourteen real-world gates OPEN and never self-certify Stable.

---

## Implementation addendum — P82/P84 Vietnamese vector PDF (2026-11-17)

> **Candidate:** `23.3.90-p82` · base `23.3.89-p84` · PhaseSuite `70.0.0` unchanged. This is additive; old raster export remains as fallback. It is not production certification.

### Implemented
- New local module `canvio-p82-p84-vector-pdf.js` + inline block `#canvio-p82-p84-vector-pdf`, public API `window.CANVIOVectorPDF` v82.1.0.
- Uses existing `CVPages.pages` and `CV.export.svgString(doc)`; does not add a parallel page/document/project/asset/history owner.
- Poster/Slide action bar adds `#cv-p82-vector-pdf`; existing Ctrl+K palette gets `Xuất PDF vector · chữ tiếng Việt chọn được`.
- Bundles Noto Sans Regular TTF and full SIL OFL 1.1 license at `assets/pdf-fonts/`. Font loads lazily from same origin only after explicit export; no CDN/API/key or background job. The previous `CVLot22.pdf()` raster path remains available.
- PDF supports selectable/extractable supported Unicode text with ToUnicode CMap and embedded TrueType FontFile2, basic vector geometry, linear/radial PDF shading, and embedded JPEG image objects. Mixed vector/raster output is the accurate description.

### Verified
- P82 direct browser PDF smoke: **28/28 PASS**. Two pages generated, 539,376 bytes; PyMuPDF opens/renders; Poppler `pdfinfo` parses. Text extraction preserved Vietnamese HR strings and diacritics; font embedding, image XObject, vector drawings and native shading resources were checked.
- P84/P90–P96 **34/34**; P97–P101/P104 **35/35**; P87 **14/14**; P88 **14/14**; P63–P67 source **18/18** and Chromium **43/43**; P68–P70 source **16/16** and Chromium **16/16**.
- P48 **26/26**; P49 **35/35**; P50 **27/27**; P55 **49/49**; P56 **27/27**; P57–P62 **15/15**; P47 Bezier/restore/CRC/integration fixtures pass.
- Static audit: **96/96** inline script syntax; **508/508** unique HTML IDs; zero duplicate IDs; zero external script src; **7/7** standalone modules synchronized; font and OFL license present.

### Boundaries
- P82 currently covers Poster/Slide, not direct CV PDF. Bundled Noto Sans Regular is a fallback; original font family/weight is not preserved. TrueType sfnt only; no OTF/CFF/WOFF. Per-codepoint Unicode mapping is used; advanced complex-script shaping/kerning/ligatures and supplementary code points are not promised. Missing glyphs are rejected rather than silently replaced.
- Basic geometry/gradients are vector; photos/placed images are JPEG raster. Maximum 24 pages, 32 MiB input images, 2 MiB font, 20,000 px page dimension. External linked images rejected. Font fetch requires a same-origin HTTP(S)/localhost context; `file://` can block it.
- No PDF/X, CMYK, physical bleed/crop-box or printer proof. No real HTTPS PDF reader/browser matrix, cross-origin persistence or printer acceptance.

### Next priority
1. Implement P76/P77/P83 Brand/Theme propagation across Web/Poster/CV/Slide with explicit preview and canonical undo, reusing the existing Brand Kit and design-token owner.
2. Extend CV PDF via the existing canonical CV owner (not a duplicated document store), keeping PDF/vector limitations explicit.
3. Run DOCX/PPTX open-edit-save-reopen in Word/PowerPoint or Google Docs/Slides; LibreOffice evidence is not a substitute.
4. Verify P82 PDF on a real hosted HTTPS origin and representative reader/printer matrix; keep PDF/X, CMYK and prepress out of scope until implemented.
5. Keep the P70 14/14 release gates OPEN until real evidence is attached and reviewed.

---

## Office round-trip follow-up — P87/P88 (2026-11-17)

- LibreOffice 25.2.3.2 Writer/Impress UNO test now performs actual open → edit → save → close → reopen on the synthetic P87 DOCX and P88 PPTX outputs. P87 preserves Vietnamese CV text and the inserted Writer marker; P88 preserves the original Vietnamese slide title and inserted editable text shape. Both post-save ZIP CRC checks pass.
- Both round-tripped files were exported to PDF and rendered with MuPDF for a visual check. Synthetic DOCX remained A4 single-page and PPTX remained 16:9 single-slide.
- Evidence: `tests/office/run-libreoffice-roundtrip.py`, `tests/office/libreoffice-roundtrip-report.json`, round-tripped files and render evidence in `tests/office/`.
- **Scope is LibreOffice only.** No Microsoft Word, PowerPoint, Google Docs or Slides run is available; do not promote this to full Office compatibility. Test documents are synthetic, not user projects.

## P82 same-origin acceptance probe

- A dedicated test serves CANVIO through Python HTTP on `127.0.0.1`, intending to validate the actual same-origin Noto Sans fetch and PDF download. Chromium is blocked at navigation with `net::ERR_BLOCKED_BY_ADMINISTRATOR` before application boot.
- This is recorded as an environment blocker, not a product failure or PASS. P82 remains 28/28 on the deterministic intercepted-font browser fixture; hosted HTTPS and ordinary local Chrome remain open.


---

## Integration-first update — `23.3.103-p102-p105-p107-integration-r1` (2026-11-17)

> Owner instruction: integrate remaining roadmap code paths first; a separate AI will perform deeper acceptance. Do not treat code-path integration or synthetic fixtures as release certification. Keep unsupported work items visible.

### Newly integrated in this candidate

| P | Integration | Existing owner / asset | State after integration |
|---|---|---|---|
| P72 | GLB 2.0 parser + self-contained WebGL offline mesh viewer; orbit/zoom/reset | Video Engine page; geometry converted from embedded GLB BIN | **Integrated — geometry only**; materials/textures/animation/skin/Draco/meshopt/KTX2 remain unsupported |
| P73 | Explicit-click offline website dependency packager; CORS fetch, inline resources, CSP and ZIP manifest | `CV.engines.web.snapshotWebsite()`, `CVZip.build()` | **Integrated — bounded/partial**; unsupported ESM/iframe/dynamic networking fail closed; real website dependency acceptance OPEN |
| P102 | Local background remover using ORMBG worker and transparent PNG output | `CV.assets.addBlob()` | **Integrated code path — inference OPEN**; model not downloaded/run in this environment |
| P103 | Seven procedural original SFX presets + filter shortcut | `CV.assets`, canonical Video Engine Audio track and Inspector | **Integrated code path**; SFX sample synthesis tested; full timeline media acceptance OPEN |
| P105 | Depth Anything V2 Small depth-map worker with WebGPU/WASM fallback | existing Asset Library metadata | **Integrated code path — inference OPEN**; no real model load/inference yet |
| P106 | WebGL depth-displacement shader + WebM capture; Ken Burns 2D fallback | Canvas capture → Asset Library → canonical Video Engine | **Integrated — dual-path tested**: headless 2D 14/14 and Xvfb/ANGLE SwiftShader WebGL 14/14; physical GPU acceptance remains OPEN |
| P107 | Save/reload depth map and parallax preset from existing Asset Library metadata | existing `LS('assets')` / `CV.assets` | **Integrated — portable transfer added**; ZIP import/export is locally tested; real-device round-trip and automatic sync still OPEN |

### Other P status that remains intentionally open

- **P71:** agent skills are documented in `CANVIO_AGENT_SKILLS.md`; they are instructions for coding agents, not CANVIO runtime modules. External skill installation is optional and not bundled.
- **P74:** Three.js r187 GLB viewer and pinned local vendor provisioning are now implemented in source/CI. Runtime files are absent locally because upstream DNS is blocked; hosted provisioning + browser validation is not yet run. This is separate from the P72 geometry-only viewer.
- **P79:** WebCodecs path remains video-only for silent image/text timelines; timelines with audible audio or footage keep the existing MediaRecorder MP4 route. WebCodecs hardware encode is not available in this headless runtime.
- **P80:** Tiny/Base/Small Whisper profiles and WebGPU→WASM contract exist; runtime/model are still fetched after explicit action and were not exercised with real Vietnamese/English samples.
- **P81:** local Draco/Meshopt/KTX2/Basis decoder wiring + pinned provisioning script/CI step are integrated; decoder binaries and compressed GLB fixture acceptance remain OPEN. Unsupported extensions fail closed until runtimes exist.
- **P85:** OPEN and not implemented: path tracing, postprocessing, OpenCV.js, dotLottie and Rive still require free/local runtime integration and browser/GPU acceptance; the user has explicitly requested completion of all P70–P107 items.
- **P98–P101:** editor workflow UX is integrated, but missing advanced tools and real word-level acoustic alignment, real A/V sync, full-file decode and long render acceptance remain partial/open.

### Minimal integration smoke evidence

- P72 parser fixture and standalone viewer build; P73 clean offline package fixture; P103 real WAV synthesis; P102 unsupported input rejected before model load; P105/P107 metadata restore/save; P106 headless fallback and headed software-WebGL shader tests both passed, including WebM handoff. Synthetic worker output is not real model inference and the browser origin is not production.
- Headless Chromium uses the explicit 2D fallback; headed Xvfb/ANGLE SwiftShader provides software WebGL and validates the P106 shader. Neither validates physical GPU. No model inference was run because remote runtime/model downloads were unavailable.
- Do not mark P70 release gates closed. No commit, PR, merge, CI hosted run or deployment is claimed.

### Agent handoff

`CANVIO_AGENT_SKILLS.md`, `CANVIO_AI_GUIDE.md`, `CANVIO_QA_REPORT.md` and `CANVIO_HANDOFF.md` describe owners, new modules, exact test scope and remaining gates for the next AI acceptance pass.


---

## Integration-first update — `23.3.104-p102-p105-workers-r1`

### Current integration index
- The complete roadmap-to-code status table is in `CANVIO_AI_GUIDE.md` section 93 and the quick matrix at the top of `README.md`. It includes P71–P107, including items that remain OPEN or PARTIAL.
- Static audit: 109/109 inline scripts parse; 523/523 IDs unique; 0 duplicate IDs; 0 external script `src`; 19/19 standalone copies synchronized. P102/P105 worker contract: 13/13 static checks.
- This package build is for separate AI acceptance, not a claim that every P or production gate is complete.

### Added/finished package wiring
- Added and included `assets/canvio-rmbg-worker.js` for P102. It uses the Transformers.js 3.8.1 `background-removal` task with `Orangebot/ormbg-ONNX`; WebGPU fp16 is attempted before WASM uint8. The result contract requires four-channel RGBA before returning pixels to the UI.
- Added and included `assets/canvio-depth-worker.js` for P105. It uses the Transformers.js 3.8.1 `depth-estimation` task with `onnx-community/depth-anything-v2-small-ONNX`; depth output is normalized to a grayscale byte map. WebGPU fp16 is attempted before WASM q8.
- Both workers lazy-load runtime/model only after explicit user action. No request starts during application boot. The runtime is loaded from esm.sh and model weights from Hugging Face; model files and runtime are not vendored, so first-run offline use is not supported.
- Added `assets/AI-MODEL-NOTICES.md` with model source/license and known quality/runtime boundaries.
- Updated build marker to `23.3.104-p102-p105-workers-r1`; updated central title map.

### Evidence
- Inline JavaScript syntax: **109/109 PASS**. Static IDs: **523/523 unique**, duplicate IDs 0, external script `src` 0.
- New worker JavaScript syntax: **2/2 PASS**. P102/P105 worker contract: **13/13 PASS**.
- No model downloads/inference were executed. GPU model behavior, WASM fallback, full app worker MIME/CSP/CORS and real user images still need the separate AI acceptance.
- P70 fourteen release gates remain OPEN; no commit/PR/merge/hosted Actions/deploy is claimed.


## Final integration smoke refresh — `23.3.104-p102-p105-workers-r1` (2026-11-17)

- Static audit: 109/109 inline scripts parse; 523/523 IDs unique; 0 duplicates; 0 external script src; 19/19 standalone modules synchronized; all three worker files parse.
- Source suites rerun: P47 fixtures; P48 26/26; P49 35/35; P50 27/27; P55 49/49; P56 27/27; P57–P62 15/15; P63–P67 18/18; P68–P70 16/16; P102/P105 worker contract 13/13.
- Chromium smoke rerun: P63–P67 43/43; P68–P70 16/16; P82/P84 28/28; P87 14/14; P88 14/14; P90–P96 34/34; P97–P101/P104 35/35.
- One initial P97 WebM attempt returned null, but an instrumented repeat and a clean repeat both passed. Repeat real media export on target browser/device.
- No real P102/P105 inference, physical WebGPU/WebGL, HTTPS deployment, native IndexedDB restart or real A/V sync is claimed. P70 remains 14/14 OPEN; not Stable.


## Recheck addendum — 23.3.104 continuation pass (2026-11-17)

- Re-ran the delivered ZIP, manifest, static audit, source suites and Chromium suites. Current detailed counts and exact limitations are recorded in `CANVIO_QA_REPORT.md` section 17.
- P72/P73/P102/P105–P107 API contract probes all returned true in a synthetic Chromium page; these probes do not substitute for real GLB GPU rendering, representative offline-site dependency closure, model inference, hardware WebGPU/WebGL or Project Vault/cross-device round-trip.
- Newly observed boot caveat: two Google Fonts CSS requests occur during app startup. There are still zero external script `src` tags, but startup is not fully network-silent; validate offline font fallback or bundle approved free fonts locally before claiming a fully offline app.
- Production/repository distinction: `main` at `f681c1239dc56968dde338e1c33aa4b63002665a` has a successful Pages run #105, but the deployed artifact inspected remains P70 `23.3.84-p70`. The `23.3.104-p102-p105-workers-r1` delivery remains a separate candidate and has not been committed/deployed by this pass.
- Do not close P74/P81/P85 or P70's 14 manual gates without their specific implementation and evidence.

## Quality repair addendum — `23.3.105-p107-portable-preset-r1` (2026-11-17)

- Removed both app-shell Google Fonts startup sources: the preconnect/stylesheet `<link>` and the active CSS `@import`. System font fallback remains; optional font loading is user-triggered.
- The static audit now fails on any startup Google Fonts stylesheet/preconnect/import. The P68–P70 Chromium smoke verifies zero HTTP(S) boot requests.
- `index.html`: 4,849,053 bytes, SHA-256 `a8b5deeed4115554c39580a949e0ac59f7c872e80ff18a7907422ae2e781ece2`. Build marker is pinned to r2; PhaseSuite remains 70.0.0.
- Source, worker-contract and browser results are recorded in QA Report section 18. P68–P70 browser checks rise to 17/17 due to the new network guard.
- Full recheck also found and fixed stale r1 version assertions in P55/P56 source test guards. The corrected source suites pass P55 49/49 and P56 27/27; their Chromium browser smokes pass 24/24 and 27/27. P62 browser smoke passes 32/32; the P72–P107 API smoke passes all grouped checks.
- Candidate Node 24 workflow now runs those browser/API suites, refreshes/verifies the package manifest after browser reports are emitted, and uploads evidence. Its deployment job is explicitly manual (`workflow_dispatch` + `deploy_candidate=true`) and is still only a candidate workflow file, not a hosted run on `main`.
- P72/P73/P102/P103/P105–P107 synthetic API contracts pass; actual GLB GPU rendering, representative offline website closure, real model inference, P106 hardware WebGL and P107 Project Vault/cross-device sync remain OPEN.
- P74/P81 runtime validation and P85 implementation remain OPEN. P70 fourteen real-world gates remain OPEN; no Stable certification.
- GitHub `main` and Pages still refer to the last inspected P70 source; r2 is a local delivery candidate and is not claimed as deployed.


## Final acceptance addendum — `23.3.105-p107-portable-preset-r1` (2026-11-18)

- Exact candidate source and full local regression matrix are recorded in `CANVIO_FINAL_ACCEPTANCE_MATRIX.md` and `CANVIO_QA_REPORT.md` section 19.
- Reconfirmed: static audit 109/109 scripts, 523 unique IDs, no duplicate IDs/external script src/startup Google Fonts refs, 19/19 module copies synchronized, three worker syntax checks pass.
- Reconfirmed source suites: P47 fixtures, P48 26/26, P49 35/35, P50 27/27, P55 49/49, P56 27/27, P57–P62 15/15, P63–P67 18/18, P68–P70 16/16 and worker contract 13/13. Browser suite counts are in the acceptance matrix.
- P87/P88 synthetic outputs additionally passed LibreOffice 25.2.3.2 Writer/Impress open-edit-save-reopen; this does not certify Microsoft Office or Google Workspace.
- No release scope changed in this historical addendum: P74/P81 runtime and P85 implementation remain OPEN; P102/P105 inference, physical WebGPU/WASM, P106 physical GPU, P72 GPU, P107 physical-device/Project Vault, HTTPS/worker hosting and the 14 P70 real-world gates remain open.
- GitHub `main` last observed at `f681c1239dc56968dde338e1c33aa4b63002665a`; Pages run #105 succeeded for P70 only. The r2 candidate is not represented as merged or deployed.


## Implementation addendum — P107 portable cross-device preset transfer (`23.3.105`)

- Added Export Preset ZIP / Import Preset ZIP to Depth Studio. Bundle format is fixed to `manifest.json`, `source.png`, `depth.png`; import is a manual file-transfer path between devices, not cloud sync.
- Parser rejects encrypted/unsupported ZIP flags, compression/data descriptors, duplicate/unknown/traversal filenames, incorrect central directory, invalid CRCs, oversized entries and malformed PNG structure. PNG IHDR/dimensions and parallax ranges are validated against the manifest.
- Import writes to the existing Asset Library, annotates the existing source/depth asset metadata and rolls back partial writes through the existing remove owner. No second storage owner was introduced.
- Tests: 9/9 portable transfer tests; worker contract increased to 16/16.
- P107 status improved from metadata-only to metadata + portable transfer (manual). Automatic cross-device synchronization and real-device backup/restore evidence remain OPEN.
- P74/P81 still cannot honestly be marked complete here: the app requires bundled modern Three.js plus compatible binary Draco/meshopt/KTX2 decoder assets; the current environment's upstream binary fetch/runtime validation is blocked. P85 remains deferred because it is an optional heavy stack outside the core web/poster/CV/PPT/video release path.


## Current implementation / hosted-validation addendum — `23.3.106-p74-p81-p107-r1` (2026-11-18)

- **P74:** The full Three.js r187 viewer is a separate additive panel beside P72. It reuses `#cv72-file`, supports self-contained GLB 2.0 only, rejects external buffer/image URIs before loader execution, bounds file size at 250 MiB, and disposes model/decoder resources. The app dynamically imports local modules only after an explicit user click.
- **P81:** GLTFLoader is wired to local Draco, Meshopt and KTX2/Basis decoders. `scripts/vendor-three-r187.sh` provisions an exact Three.js r187 commit, rewrites addon imports to local relative imports and emits a per-file SHA-256 manifest. It has not run successfully in this offline container because upstream DNS access is blocked. The candidate Node 24 workflow provisions these files on the GitHub runner and then runs the P74/P81 Chromium SwiftShader smoke.
- **P107:** Portable ZIP remains a manual transfer route. A defect where strength `0` was coerced to the default was fixed in the preview/save/load paths. P107 functional tests now pass 11/11; the full ZIP import/export path still needs acceptance with real user images and two physical devices.
- **Current local tests:** static audit 110/110 scripts, 524 unique IDs, 20/20 synchronized modules, 3/3 worker syntax; P74/P81 contract 18/18; P107 portable transfer 11/11; P102/P105 worker contract 17/17. The earlier source and browser matrix remains recorded below and in the Acceptance Matrix; this final candidate's hosted CI must rerun it.
- **Packaging:** the CI workflow is designed to upload a full archive containing the runtime/decoder assets after they are provisioned, plus the manifest and SHA-256 sidecar. The local archive without `assets/three` is not the complete 3D runtime delivery.
- **Status:** P74/P81 implementation and CI provisioning are present; runtime/browser execution remains pending hosted workflow. Physical GPU, compressed Draco/Meshopt/KTX2 fixtures, HTTPS/Safari/Edge, real model inference and Project Vault/cross-device sync remain OPEN. P85 is OPEN/unimplemented. P70 remains 14/14 real-world gates OPEN; `releaseCertified:false`.
- **Repository boundary:** last inspected `main` was `f681c1239dc56968dde338e1c33aa4b63002665a`; Pages run #105 served P70. The 23.3.106 candidate must not be described as deployed before PR/CI and a separately authorized deployment.


## Final local regression recheck — `23.3.106-p74-p81-p107-r1` (2026-11-18)

- Candidate index SHA-256 `86e9082ba718d49097645b5c5382ffcf4bf9c91ecd93bb6c44e2ea48812ff34b`; 4,887,819 bytes; PhaseSuite `70.0.0`.
- P74 explicit-load now verifies actual same-origin vendor bytes against SHA-256 manifest entries before import; `redirect:error` prevents following external redirects. The check is mocked in local tests; actual vendor assets remain hosted-CI provisioned.
- Exact test results: static 110/110, IDs 524 unique, modules 20/20, workers 3/3; P74/P81 18/18, P107 11/11, P102/P105 worker 17/17. Browser suites: P55 24/24, P56 27/27, P62 32/32, P63–P67 43/43, P68–P70 17/17, P82/P84 28/28, P87 14/14, P88 14/14, P90–P96 34/34, P97–P101/P104 35/35. API smoke: P72 8/8, P73 9/9, P103 10/10, P102 11/11, P105–P107 18/18.
- `tests/release/package-delivery.py` now exists, is referenced by workflow, performs manifest verification, deterministic archive creation, CRC verification and SHA-256 sidecar creation.
- P102/P105 real model inference, P74/P81 hosted runtime/browser smoke, compressed media fixtures, physical GPU, P107 physical two-device round-trip, HTTPS/browser/accessibility and P70's fourteen manual gates remain open. P85 is OPEN/unimplemented. P108 has no defined requirement in this Roadmap.

## Continuation verification addendum — 2026-11-18

- Re-ran source checks and browser contracts for the exact `23.3.106-p74-p81-p107-r1` candidate; the precise counts and limitations are recorded in QA Report section 22 and `CANVIO_FINAL_ACCEPTANCE_MATRIX.md`.
- The latest P97 browser report changed during the test rerun; manifest has therefore been rebuilt from the complete current folder and verified before packaging.
- Local Three.js r187 provisioning remains blocked by DNS access to `github.com`; no vendor directory is present locally. The P74 SwiftShader run must be executed on the online GitHub runner before considering P74/P81 runtime accepted.
- GitHub `main` is unchanged at `f681c1239dc56968dde338e1c33aa4b63002665a`; no candidate branch/PR or Pages deployment exists for 23.3.106. Deployment remains disabled pending review and all P70 gates.


## Continuation addendum — P106 fallback and office round-trip (2026-11-18)

- Added and CI-wired `tests/p102-p105/run-p106-depth-render-smoke.py`.
- Chromium 144 in this environment denies WebGL context creation; P106 therefore selected its explicit Ken Burns 2D fallback. Synthetic worker-driven flow and fallback output passed **8/8** checks, including PNG conversion, Asset Library write, zero-strength save and clean console/page-error checks.
- This is **fallback acceptance only**. It does not close P106 WebGL shader, physical GPU or real Depth Anything inference.
- LibreOffice 25.2.3.2 Writer/Impress opened, edited, saved and reopened the generated P87 DOCX and P88 PPTX. Vietnamese text and inserted markers survived; post-save OOXML ZIP CRC passed. Microsoft Office/Google Workspace compatibility is still unverified.
- P74/P81 remains blocked by missing locally provisioned Three.js/Draco/Meshopt/Basis vendor files; model inference for P102/P105 remains unrun; P107 portable ZIP has not yet been round-tripped across two physical devices. P70's fourteen release gates remain OPEN; P85 remains OPEN and unfinished; P108 is unspecified.


## Current integration repair — `23.3.107-p107-preset-v2-r2` (2026-11-18)

- P107 preset ZIP upgraded to manifest v2 after a reproduced import failure for source/depth images with different dimensions. The exporter writes both dimension pairs; the importer validates each PNG against its corresponding pair and continues to read v1 bundles.
- P107 Node suite **14/14 PASS**; Chromium ZIP export/import into an isolated second browser context, 2D fallback and SwiftShader WebGL animation/export **14/14 PASS** in both renderer modes with source 160×100 and depth map 96×64, retaining strength `0`. ZIP transfer is verified across two isolated browser contexts; physical devices and Project Vault persistence remain OPEN.
- Legacy title observer now recognizes `23.3.107-p107-preset-v2-r2`. Current-version browser regressions: P82/P84 **28/28**, P87 **14/14**, P88 **14/14**, P90–P96 **34/34**, P97–P101/P104 **35/35**. LibreOffice Writer/Impress open-edit-save-reopen passed.
- P106 dual-renderer validation: headless fallback **14/14 PASS** and headed Xvfb/ANGLE SwiftShader WebGL **14/14 PASS**, including shader compile/render, animation frame change, WebM export, Asset Library + Video Engine handoff and isolated-client P107 ZIP import. SwiftShader is a software renderer, not a physical GPU. Real Depth Anything inference remains OPEN.
- Static audit **110/110 scripts**, **524/524 IDs**, **20/20 modules**, **3/3 workers**; P74/P81 contract **18/18** and P102/P105 worker contract **17/17**.
- Still OPEN: P74/P81 runtime vendor provisioning, actual Draco/Meshopt/KTX2 compressed decode, P102/P105 inference, P106 physical-GPU acceptance, P107 physical-device/Project Vault round-trip, P85 optional heavy stack implementation, and P70 fourteen real-world release gates. P82 localhost HTTP smoke was blocked by this environment (`ERR_BLOCKED_BY_ADMINISTRATOR`), so live-origin verification is still open. Candidate is local only; no hosted CI, merge or deployment is claimed.


## P106 dual-renderer and P107 isolated-client confirmation — 23.3.107-p107-preset-v2-r2 (2026-11-18)

- Headless Chromium 2D fallback: **14/14 PASS**. Headed Chromium via Xvfb/ANGLE SwiftShader WebGL: **14/14 PASS**. The latter successfully compiles/renders the P106 depth shader and checks animation pixels, then exports WebM to the existing Asset Library and canonical Video Engine. Software SwiftShader is not physical GPU.
- Each run also tests P107 actual three-entry ZIP download/CRC and import in a fresh isolated browser context, preserving source 160×100, depth map 96×64 and strength 0. This is stronger than same-context import but does not prove two physical devices or Project Vault persistence.
- Actual Depth Anything inference is not run; the synthetic worker only validates the worker→depth image→render pipeline. P74/P81 vendor runtime/compressed decoders remain unverified; P70's fourteen real-world gates remain open.
- P82 same-origin HTTP attempt was blocked by the environment's browser policy (`net::ERR_BLOCKED_BY_ADMINISTRATOR`), not counted as PASS. HTTPS/worker headers and production-origin acceptance remain open.


## Current integration addendum — `23.3.108-p85-studio-r2` (2026-11-18)

**Exact application source:** `index.html` · 4,921,610 bytes · SHA-256 `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82` · PhaseSuite `70.0.0`.

### Newly integrated source and controls
- **P85:** `canvio-p85-studio.js` adds one owner/panel with PostFX preview, WebGPU path-tracing preview, OpenCV Lucas–Kanade optical-flow operation, dotLottie playback and Rive playback. The panel reuses the existing P72 GLB input and does not create a second project store, Asset Library or timeline. Runtime files are verified against a same-origin SHA-256 manifest and loaded only after explicit user action.
- **P85 runtime provisioning:** `scripts/vendor-p85-runtimes.sh` pins Three.js 0.187.0, three-mesh-bvh 0.9.18, three-gpu-pathtracer 0.0.28, postprocessing 6.39.6, OpenCV.js 5.0.0-release.1, dotLottie 0.83.2, Rive 2.51.0 and Transformers.js 3.8.1. It retains upstream license notices. WebGPU path tracing is explicitly WebGPU-only and fails closed if `navigator.gpu` is absent.
- **P102/P105/P80:** worker contracts now point at a pinned same-origin Transformers.js + ONNX WASM runtime provisioned by the P85 vendor script. Model weights remain explicit, user-triggered downloads from their pinned model repositories; real inference was not run.
- **Workflow:** exact `index.html` SHA is pinned; P85/P74/P81 provisioning and runtime browser smoke steps are configured. Deployment additionally requires an affirmative P70 release certificate from the build job; the current fail-closed report will not authorize deploy.

### Latest local verification
- Static audit: **111/111** inline scripts, **525/525** unique IDs, zero duplicate IDs, zero external script `src`, zero startup Google Fonts references, **21/21** standalone modules synchronized and **3/3** worker scripts parse.
- Source suites: P47 fixtures PASS; P48 **26/26**; P49 **35/35**; P50 **27/27**; P55 **49/49**; P56 **27/27**; P57–P62 **15/15**; P63–P67 **18/18**; P68–P70 **16/16**; P74/P81 **18/18**; P85 **13/13**; P102/P105 **19/19**; P107 **14/14**.
- Chromium: P55 **24/24**; P56 **27/27**; P62 **32/32**; P63–P67 **43/43**; P68–P70 **17/17**; P82/P84 **28/28**; P85 lazy boot **10/10**; P90–P96 **34/34**; P87 **14/14**; P88 **14/14**; P97–P101/P104 exact-current rerun timed out before a final report and is not counted in this refresh; P106 headless 2D fallback/P107 isolated-browser ZIP transfer **14/14**. P72/P73/P102/P103/P105–P107 API smoke passes in its respective synthetic contracts (8/8, 9/9, 11/11, 10/10, 18/18).
- Office: LibreOffice Writer/Impress 25.2.3.2 open/edit/save/reopen passed for generated DOCX/PPTX; Vietnamese text and markers retained; ZIP CRC passed. Not Microsoft Office or Google Workspace certification.

### Still not accepted / blockers
- P74/P81 vendor runtime files and compressed Draco/Meshopt/KTX2 fixture decoding: not run. `tests/p74-p81/run-p74-p81-browser-smoke.py` requires `assets/three/THREE-VENDOR-MANIFEST.json`; the vendor script cannot fetch from GitHub/npm here because DNS is blocked.
- P85 vendor runtime smoke (PostFX actual WebGL, OpenCV WASM optical flow, dotLottie WASM playback, Rive WASM initialization): not run because `assets/p85` bundles are not provisioned locally. The P85 source contract and lazy-boot suite do not prove these runtimes.
- P102/P105 real model inference: NOT RUN; model weights are remote and require user-triggered retrieval.
- P97–P101/P104 exact-current browser rerun timed out before a final report; the previous same-marker 35/35 remains in earlier QA history but is not recounted in this refresh. P106 current-candidate WebGL rerun under Xvfb timed out; only the current 14/14 headless Ken Burns fallback is counted. No physical GPU acceptance.
- P107 isolated browser-context ZIP import passed; physical two-device transfer and Project Vault save/reopen remain open.
- P70 still reports **14/14 real-world gates OPEN**, `releaseCertified:false`. HTTPS/CSP/worker MIME, Safari/Edge, accessibility, native IndexedDB recovery, real A/V sync/long render, Office cross-application and print/prepress validation remain open.
- No hosted GitHub Actions run, merge or Pages deployment is claimed. Local source candidate only; not Stable. P108 remains unspecified.


## Exact-current regression continuation — `23.3.108-p85-studio-r2` (2026-11-18)

This addendum supersedes the earlier timeout notes for the P97–P101/P104 exact-source run and the headed P106 SwiftShader run.

- Exact source remains `4,921,610` bytes, SHA-256 `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82`. No application JavaScript or HTML changed during this verification-only pass.
- Re-ran P97–P101/P104 on Chromium: **35/35 PASS**. Re-ran P106 in both modes: **14/14** headless 2D fallback and **14/14** headed ANGLE SwiftShader WebGL. Both P106 modes also complete the portable P107 ZIP export/import into an isolated browser context.
- Source suites: P47 fixtures PASS; P48 26/26; P49 35/35; P50 27/27; P55 49/49; P56 27/27; P57–P62 15/15; P63–P67 18/18; P68–P70 16/16; P74/P81 18/18; P85 13/13; P102/P105 19/19; P107 14/14. Static audit remains 111 scripts, 525 unique IDs, 21/21 modules and 3/3 workers.
- **Still blocked:** local package downloads cannot resolve npm/GitHub DNS; `assets/three` and `assets/p85` vendor manifests/binaries remain absent. Therefore actual P74/P81 and P85 vendor-runtime smoke, compressed decoder fixture tests, and P80/P102/P105 AI inference are NOT RUN.
- **Still open:** P106 physical GPU qualification; P107 real two-device/Project Vault round-trip; P70 fourteen real-world acceptance gates. P70 remains `releaseCertified:false`.
- GitHub `main` is still `f681c1239dc56968dde338e1c33aa4b63002665a` (older P70 baseline). Latest observed green workflow run 44118368800 applies to older commit 3602e9b76918bf1f40f6cd4ffd2a3024ec60bb8a, not this local candidate. No remote PR/merge/deploy is claimed.
- Detailed evidence is in `tests/release/exact-current-refresh-report.json` and Guide section 104.


## Continuation patch 23.3.109 — vendor provisioning safety (2026-11-18)

**Completed locally:**
- P74/P81 Three.js r187 and P85 runtime provisioning now use isolated staging trees.
- A shared transactional activator preserves the last known-good vendor tree and rolls it back if the staged tree cannot be activated.
- Added a regression test for successful replacement and forced activation failure rollback (2/2 PASS).
- Re-ran source contracts: P74/P81 18/18; P85 13/13; P102/P105 19/19; P107 14/14; P85 lazy boot 10/10; static audit 111/111 scripts, 525 unique IDs, 21/21 synchronized module copies, 3/3 workers.

**Still OPEN/BLOCKED:**
- Vendor binaries cannot be downloaded from this container because DNS to npm/GitHub fails. Hosted workflow includes vendor provisioning steps, but no hosted run for this candidate has been observed.
- Real ONNX inference, physical GPU, compressed GLB decoder fixtures, physical two-device/Project Vault sync, production-origin/security headers and all fourteen P70 acceptance gates remain unaccepted.
- This patch does not change application UI/index.html; it is a build/release safety improvement only. Do not mark P70 Stable or deploy the candidate as production-certified.


# 105. Continuation audit — 23.3.110 (2026-11-18)

This is a verification/documentation refresh only. No application source, UI, or runtime binaries changed.

- Re-ran P74/P81 source contract: **18/18 PASS**; vendor runtime absent and compressed decoder fixture decode not run.
- Re-ran P85 source contract: **13/13 PASS**; actual runtime browser smoke exits before launch because `assets/p85/P85-VENDOR-MANIFEST.json` is absent.
- Re-ran P102/P105 worker contract: **19/19 PASS**; real ONNX model inference not run.
- Re-ran P107 ZIP/security contract: **14/14 PASS**; no cloud sync, Project Vault or physical two-device round trip.
- Static audit: **111/111** inline scripts, **525/525** unique IDs, **21/21** standalone modules, **3/3** workers.
- Attempted npm registry resolution; `npm view three@0.187.0` failed with `EAI_AGAIN registry.npmjs.org`. GitHub host DNS also did not resolve. npm cache is only 12 KB and contains no usable packages; no Three.js, decoder, OpenCV, dotLottie, Rive, Transformers.js or ONNX WASM binaries exist in the package.
- P106 physical GPU remains untested. Software SwiftShader evidence is not physical GPU acceptance.
- P70 remains **14/14 manual gates OPEN**, `releaseCertified:false`. These require real devices, production HTTPS origin, real media/projects/footage, human accessibility and licensing review, print/prepress, backup/restore and rollback/observability evidence. They cannot be truthfully completed in this isolated container.
- No GitHub commit, hosted Actions run, PR, merge, Pages deployment or Stable certification is claimed.

Machine-readable evidence: `tests/release/continuation-acceptance-audit-23.3.110.json`.
