# CANVIO — Roadmap trạng thái tích hợp (P70 baseline + 23.3.111 continuation; 2026-11-20)

> Tài liệu này giữ nguyên trạng thái nền P70 và lịch sử nghiệm thu. Các cập nhật mới hơn nằm trong phần continuation ở cuối file (hiện tới 23.3.111/P127.7). “Đã tích hợp” mô tả code path hiện diện; không thay thế nghiệm thu dự án thật, media thật, provider thật hoặc production. Không mở rộng feature giả để làm đẹp checklist.

## Tổng quan

- **P70 baseline:** `index.html` — `23.3.84-p70` application marker; PhaseSuite `70.0.0` (P68–P70 final milestone implementation on P67).
- **Latest hosted continuation:** `23.3.111-github-runtime-ci`; P127.7 and P145 verification details are recorded in the continuation section below.
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
