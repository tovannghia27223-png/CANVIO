# CANVIO — Roadmap trạng thái tích hợp P70 (2026-11-17)

> Đây là bản roadmap trạng thái cho candidate P70. “Đã tích hợp” mô tả code path hiện diện; không thay thế nghiệm thu dự án thật, media thật, provider thật hoặc production. Không mở rộng feature giả để làm đẹp checklist.

## Tổng quan

- **Candidate:** `index.html` — `23.3.84-p70` application marker; PhaseSuite `70.0.0` (P68–P70 final milestone implementation on P67).
- **SHA-256:** See `CANVIO_MANIFEST.json` for final P70 source and package hashes.
- **Trạng thái phát hành:** P70 local Stable Release Candidate; P47–P70 source/regression/Chromium synthetic smoke pass; fourteen real-world gates remain OPEN. Not CANVIO 1.0 Stable; no merge/deploy/production certification.
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
| P85 | **Tùy chọn nặng** | pathtracer, postprocessing, OpenCV.js, dotlottie/Rive — chỉ làm khi có nhu cầu cụ thể | Nạp lười; đo thời gian khởi động và RAM trước/sau |

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
