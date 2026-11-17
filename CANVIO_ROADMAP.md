# CANVIO — Roadmap trạng thái tích hợp P70 (2026-11-17)

> Đây là bản roadmap trạng thái cho candidate P70. “Đã tích hợp” mô tả code path hiện diện; không thay thế nghiệm thu dự án thật, media thật, provider thật hoặc production. Không mở rộng feature giả để làm đẹp checklist.

## Tổng quan

- **Candidate:** `index.html` — `23.3.84-p70` application marker; PhaseSuite `70.0.0` (P68–P70 final milestone implementation on P67).
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


## Latest hosted verification — 2026-11-17

- Node.js 24 workflow [#46](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44104323930): validation/package and Pages deployment jobs both completed successfully; all listed validation steps passed.
- Candidate workflow head: `d14096255e16dfad4ce70260914c837f4bd7dd5c`. Current `main` head after promotion: [`3e6be7e`](https://github.com/tovannghia27223-png/CANVIO/commit/3e6be7e2653a1f5d999ece355236a6bf4e8738e5).
- GitHub Pages [#91](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44104556386) completed successfully for current `main`.
- P47–P70 automated tests and Chromium smoke suites remain green. Fourteen manual acceptance gates remain OPEN; this refresh does not change the P70 release disposition.
