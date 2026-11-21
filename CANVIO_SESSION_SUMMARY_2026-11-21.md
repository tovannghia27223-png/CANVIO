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


### P133.2 QA correction — CI #347 (2026-11-21)

- First hosted Chromium run successfully generated a 1280×720 WebM, preserved Opus audio, fully decoded the file and confirmed the original clip remained unchanged.
- It caught an actual integration race: the UI did not await the asynchronous Video Engine importFiles() promise, so the proxy download existed but the new timeline clip was not yet present when reported. Updated the module to await importFiles(), verify clip-count increase and retain the download link if timeline ingestion fails.
- CI must be rerun on the corrected commit; no proxy acceptance/merge claim until timeline import passes.


### P144.3 route-coverage correction — CI #354 (2026-11-21)

- Hosted Chromium confirmed the workspace registry contains 38 routes, not only the 25 initially covered. It identified 13 missing help topics: templates, brand, designSystem, responsive, collab, hub, platform, one, promptForge, insight, hallmark, guide and shield.
- Added page-specific guidance for all 13, using Guide-documented behavior and explicit boundaries (e.g. collab is local notes/activity, Prompt Forge is prompt handoff, Shield does not certify server headers).
- P133.2 passed all 11 Chromium checks in the same run, including actual timeline import, clip duration, audio, full decode and original preservation. P124 passed 9/9.
- Rerun required to verify all 38 CVWS routes have contextual help; no merge claim until that coverage check passes.

## Mainline verification after PR #51

- PR #51 merged at e4e3647b8b49dcc931065c3f7893f68b48d9a071. Hosted candidate run #360 and mainline run #362 both PASS 39/39.
- P124 Auto Layout: five presets/four variants; Chromium 9/9. P133.2 proxy: 4K synthetic clip generates 1280×720 WebM with Opus audio, full decode, new timeline clip and untouched original. P144.3 contextual help: all 38 CVWS routes covered; tour and keyboard smoke pass.
- Began P143 Phase 1: 20-module standalone/inline-lot source registry and parity test. Hosted run #363 passed source integration, syntax, P143 parity audit, full HTML audit, P47–P70 regressions, integration source contracts and P107 ZIP round-trip; same-origin browser phase was still running.
- Updated Guide, Roadmap, tracker, QA, acceptance matrix, handoff prompt and this summary.

## P143 current-main final rebase

- Main advanced to 6481d83 after hosted build artifact commit; previous P143 branches became stale.
- Created work/p143-parity-current-main-final-20261121 from latest main, copied the 20-module registry/audit and split plan, and re-added the hosted workflow gate.
- Documentation updated; hosted CI pending. Prior candidate #363 had full success 39/39, including parity audit and browser matrix.


## P134.2 CI regression correction — 2026-11-21

- P143 rebased run #371 failed only at P134.2 `durationWithinTolerance`: WebM had 123 frames but no format/stream duration and incorrect 60 fps nominal metadata, so the old test derived 2.05 s instead of ~4.1 s.
- Updated browser test to measure packet presentation timestamp range plus median packet duration, with 30 fps fallback only when PTS missing. Added packet diagnostics. No tolerance was relaxed and exporter code was unchanged.
- Latest-main rerun #373 is pending; PR #54 must remain open until full CI succeeds.

## P143 Phase 2 — complete inline script inventory added

- Added inventory generator tests/p143/build-inline-source-inventory.cjs to list every script tag from the restored canonical index.html in execution order, with IDs, type/src, async/defer, byte size, SHA-256 and heuristic known-global reads/exports.
- It writes tests/p143/inline-source-inventory.json, included in the ZIP and uploaded evidence artifact. Hosted validation for this new step is pending.
- Does not yet map CSS/templates or establish the full semantic dependency/boot-order DAG; no script reorder/extraction performed.

## Final verified mainline state — 2026-11-21

- PR #51 merged P124 Auto Layout, P133.2 4K proxy and P144.3 contextual help. PR #46 merged P134.2 Auto Reframe. PR #54 merged P143 Phase 1 parity and Phase 2 inline script inventory.
- Hosted PR run #384 SUCCESS 41/41 and mainline run #385 SUCCESS 41/41. Pages #222 SUCCESS across build/deploy/report.
- P134.2: 123 video packets; first PTS 0.049, last PTS 4.096, median packet interval 0.033; measured 4.063 s; 720×1280 VP9 + Opus, full decode, no page errors.
- P133.2: 4K source → 1280×720 WebM; timeline contains source and proxy (2 clips), original untouched, proxy 3.008 s with Opus and full decode.
- P144.3 help covers 38/38 registered CVWS routes; F1 focus trap/Escape and first-run tour pass.
- P143 source parity: 20 standalone/embedded pairs. Inventory tests/p143/inline-source-inventory.json: canonical HTML 5,459,631 bytes, 150 inline scripts, 0 external, 147 script IDs, 0 duplicates, no async/defer/module scripts.
- Artifact #384: 21,748,431 bytes, SHA-256 d07e7aa93e09357fae6c027578d6ece7d8d011f0e2019852ee72ece4d89dc17a.
- Remaining external/manual limits: fourteen P70 acceptance gates, P130 Supabase/RLS/two-device sync, P122.3 MCP security/transport contract, P133 OffscreenCanvas/OPFS migration, advanced P124 controls and full P143 dependency/style/template extraction.


## P143 parity extension — 27 standalone modules (candidate)

- Created work/p143-parity-27-modules-20261121 from current main and extended source-module-map.json from 20 to 27 module pairs.
- Added seven previously individually tested sources: P127 Loudness/Templates, P133 Resilience, P134 Scopes, P138 Denoise, P140 Charts, P145 SFX. No runtime code or script order changed.
- Guide, Roadmap, tracker, handoff, QA, acceptance matrix and this summary updated. Hosted validation pending.

## Final session closure — 2026-11-21

- PR #51 merged P124 Auto Layout, P133.2 proxy and P144.3 Studio help.
- PR #54 merged P143 central parity for 20 modules plus full canonical script inventory.
- PR #55 merged parity coverage expansion to **27 modules**: P127 Loudness/Templates, P133 Resilience, P134 Scopes, P138 Denoise, P140 Charts and P145 SFX.
- Candidate #386 SUCCESS 41/41; source parity 27/27, zero failures. Mainline #387 SUCCESS 41/41. Pages #224 and #225 SUCCESS.
- Canonical index: 5,459,631 bytes, 150 inline script tags, no external src, no module/async/defer, 147 unique script IDs, zero duplicate IDs.
- P134 duration acceptance uses actual packet timestamps: 4.076 s, 123 video packets, VP9 720×1280 plus Opus, full decode and no page errors. The 3.5–4.5 s threshold was not relaxed.
- P133.2 4K proxy acceptance: source and proxy both remain in timeline, 1280×720 VP9 plus Opus, full decode, original unchanged.
- Artifact #387: 21,753,092 bytes, SHA-256 `31a2ba6e7494fd8e6fdf65210ef2714e43bf49dae399d910b8f4fe5e84b1f958`.
- Still externally/manual: P70 14 gates, P130 Supabase/RLS/two-device sync, P122.3 MCP security/transport contract, P124 advanced editor controls, P133 OffscreenCanvas/large media OPFS and full P143 semantic dependency/style/template extraction.


## Follow-on work started — 2026-11-21 (candidate branch; not merged)

- Branched from main at f8e476cc33c726c8c5a8ff6d5292e4b8ef1f270f into work/p133-offscreen-p143-style-audit-20261121.
- P133.3: added OffscreenCanvas Worker scaling into the existing 4K proxy pipeline; worker uses transferred ImageBitmap frames, single-frame backpressure, cleanup and fallback. Updated Node/browser tests to require actual Worker usage and output integrity.
- P124.2: added configurable responsive breakpoints and mobile/tablet/desktop columns plus content/gap/min-width controls; expanded source and Chromium tests.
- P143.3: added stylesheet/inline-style/template/dynamic-loader inventory and heuristic dependency candidates, with validation wired into hosted CI and artifact upload.
- Changes are not merged and no CI PASS is claimed yet. The next step is hosted PR verification, fix any failing assertions, then merge only if the full candidate suite passes.
- Real-world manual testing is deferred as requested. P70's fourteen gates remain OPEN. P130 Supabase sync and P122.3 MCP remain blocked on the necessary real infrastructure/security contract.



## Verified update — 2026-11-21 — P124.3

- PR #63 (selected Website Engine component responsive breakpoints) merged to `main` as `ed6679faec689483db62eb718aa55e068866618b` after hosted candidate workflow run #444 succeeded.
- Hosted Chromium evidence: P124 UI interaction **15/15**; selected component received a scoped class, desktop/tablet/mobile rules were written through GrapesJS CSS Manager, canonical `CV.engines.web.save()` was called, save failure was surfaced, mobile viewport had no overflow, and page errors were zero.
- The workflow also completed its existing regression/runtime steps successfully, including the P133.2 proxy and P133.4 OPFS checks in run #444. This does not close remaining P124 advanced component editing or P133 migration work.
- PR #64 P135.1 is NOT merged: its hosted run #467 failed at the unrelated P133.2 proxy gate with UI status `Tạo proxy vượt thời gian cho phép.`; no page errors were reported. Its head is now non-mergeable against the updated main and must be rebased/cleaned before another acceptance run. Do not mark P135 complete.
- PR #65 is a duplicate/stale P139 candidate (mergeable=false; no hosted run). PR #66 is the clean P139.1 candidate stacked on the P135 branch (no hosted run yet); keep P139 partial and do not merge before the P135 base is accepted.
- P135.1 remains a partial non-destructive adjustment stack; reload persistence, masks/local corrections, smart objects, clone/patch and liquify remain open. P139.1 remains partial; precomp, physical motion blur, word/range selector, expanded keyframe editor and real-project/export acceptance remain open.


## Verified mainline delivery — P133/P135 — 2026-11-21

- PR #68 merged to main as 256c5f8d7fbed2159f5deff5ca1e065db8d8d14a.
- P133 proxy reliability tests passed in candidate run #44911472539 (44/44). The branch includes an 8-second bitmap-capture watchdog in addition to the 3-second worker-frame watchdog; on timeout the renderer switches to the existing Canvas2D fallback and safely ends at the last frame.
- P135.1 candidate run #44911475373 passed 45/45; adds nine ordered non-destructive Pixel adjustments, layer management, bounded undo/redo, derived canvas export and Asset Library handoff.
- Mainline post-merge run #44912553516 passed 45/45. PR #67 was closed as superseded because PR #68 carried the P133 reliability patch and P135 module together.
- P135 adjustment stack metadata remains memory-only because the existing Pixel source snapshot is flattened PNG. This is documented, not represented as persistent editable adjustment layers.
- P139.1 and P120/P126 are follow-on PR candidates #70/#71; no merge or full feature completion claimed yet.


## P139.1 renderer bridge — candidate 2026-11-21

- Added the first live rendering adapter for P139: wraps existing Motion Lab draw, applies Null parent transforms and runs grapheme Text Animator through the current #mlCanvas context, restoring the original fillText method after each draw.
- Node/browser/source-parity tests are included in hosted candidate CI. P139 remains partial until real projects, exports, precomp, advanced selectors and physical target-device performance receive review.


## Verified delivery — P120/P126 local ComfyUI — 2026-11-21

- PR #73 merged to main as edd18a7abbed57e2; hosted CI run #44914277311 passed 48/48.
- Adds loopback-only ComfyUI API workflow bridge through existing P128 for image/video/upscale/interpolate; optional media upload, prompt/media mapping, queue/history, /view output and existing Asset Library addBlob handoff.
- Browser assertions all passed: workflowCompleted, inputMediaUploaded, promptNodeOverridden, mediaNodeOverridden, historyPolled, savedToAssetLibrary and outputDownloadLink; zero page errors.
- PR #71 closed as superseded by clean-main PR #73. No paid/cloud API, key, model download or custom-node installer.
- Real ComfyUI/model/GPU inference and output quality remain untested and must not be represented as certified.


## P120/P126 ComfyUI bridge — candidate 2026-11-21

- Added the loopback-only local ComfyUI bridge, Node contract tests and Chromium mock-server acceptance. It registers image/video/upscale/interpolate handlers with P128 and imports result blobs through the existing Asset Library owner.
- Model/custom-node execution and output quality remain unverified until the user's actual free local ComfyUI environment is available. This is not cloud sync or an AI model bundle.

## P120/P126 ComfyUI bridge — candidate 2026-11-21

- Added the loopback-only local ComfyUI bridge, Node contract tests and Chromium mock-server acceptance. It registers image/video/upscale/interpolate handlers with P128 and imports result blobs through the existing Asset Library owner.
- Model/custom-node execution and output quality remain unverified until the user's actual free local ComfyUI environment is available. This is not cloud sync or an AI model bundle.

## P137.2 rich text and table styles — candidate 2026-11-21

- Added five character-style presets applied to a selected text range within one paragraph, three reusable table presets, and HTML rehydration for data-cv137-char/data-cv137-table metadata. Reuses Layout Foundry page HTML.
- Automated P137 Node/Chromium tests and P143 source parity are the merge gate; cross-paragraph styling, advanced table semantics and real print pagination remain open.

## P120/P126 ComfyUI bridge — candidate 2026-11-21

- Added the loopback-only local ComfyUI bridge, Node contract tests and Chromium mock-server acceptance. It registers image/video/upscale/interpolate handlers with P128 and imports result blobs through the existing Asset Library owner.
- Model/custom-node execution and output quality remain unverified until the user's actual free local ComfyUI environment is available. This is not cloud sync or an AI model bundle.

## P119.2 Motion easing shared with P145.2 — candidate 2026-11-21

- P145.2 now consumes P119 easing presets and custom Motion cubic-bezier via the existing CVEasingP119 owner. The easing value affects shader and Canvas2D render progress, preview, PNG and P79 MP4 transition frames; default remains linear.
- Node/Chromium acceptance is added; Video Engine clip/keyframe easing and Website Engine animation timeline are still open.

## P120/P126 ComfyUI bridge — candidate 2026-11-21

- Added the loopback-only local ComfyUI bridge, Node contract tests and Chromium mock-server acceptance. It registers image/video/upscale/interpolate handlers with P128 and imports result blobs through the existing Asset Library owner.
- Model/custom-node execution and output quality remain unverified until the user's actual free local ComfyUI environment is available. This is not cloud sync or an AI model bundle.

## P135.2 Pixel snapshot restore — candidate 2026-11-21

- Adjustment metadata is now embedded in the existing Pixel PNG snapshot string and restored through the existing native Pixel API. Preview remains non-destructive; exports remain flattened copies.
- Hosted Node/Chromium and P143 parity are the merge gate. Cross-device sync and advanced Photoshop-like tools remain open.


## Additional verified work — P137.2 / P119.2 / P135.2 — 2026-11-21

- Merged P137.2 (#76, `fa6c6c4`), P119.2 (#78, `3b53b8d`) and P135.2 (#81, `33f6848`). Candidate and post-merge mainline workflows passed: P137.2 51/51, P119.2 52/52, P135.2 53/53.
- P135.2 preserves the Pixel snapshot API while storing the editable adjustment stack in a CRC-checked PNG tEXt chunk. Chromium validated snapshot, restore, reload and unchanged source raster. P143 parity reached 32/32.
- P143.4 lexical global evidence scanner is being carried to a fresh branch based on the P135.2-verified mainline; it does not change app runtime or complete the semantic dependency graph/Phase 3 refactor.

## P120/P126 ComfyUI bridge — candidate 2026-11-21

- Added the loopback-only local ComfyUI bridge, Node contract tests and Chromium mock-server acceptance. It registers image/video/upscale/interpolate handlers with P128 and imports result blobs through the existing Asset Library owner.
- Model/custom-node execution and output quality remain unverified until the user's actual free local ComfyUI environment is available. This is not cloud sync or an AI model bundle.


## P143.4 verified mainline and P119.3 follow-up — 2026-11-21

- P143.4 merged PR #83 (29acd119); post-merge #551 passed 53/53 and Pages #275 passed. Parity 32/32, lexical scanner 14/14 and inventory validator 17/17. This is lexical evidence, not a semantic dependency graph.
- Started P119.3: native Video Engine keyframe inspector now receives a shared P119 preset adapter; writes into existing vtKFEasing/Bezier fields and relies on existing Apply/Undo/snapshot path. Candidate Node/Chromium suites added; awaiting full hosted result.

## P120/P126 ComfyUI bridge — candidate 2026-11-21

- Added the loopback-only local ComfyUI bridge, Node contract tests and Chromium mock-server acceptance. It registers image/video/upscale/interpolate handlers with P128 and imports result blobs through the existing Asset Library owner.
- Model/custom-node execution and output quality remain unverified until the user's actual free local ComfyUI environment is available. This is not cloud sync or an AI model bundle.

## P119.3 Video Engine keyframe easing — candidate

- Shared P119 presets/custom curve are presented inside existing Video Engine keyframe inspector; selected values are written into the native cubic-Bezier controls and saved only by native Apply. Existing timeline undo/snapshot path remains owner.
- Node + Chromium acceptance and P143 parity are required before merge; CSS Website Engine timeline and hardware/GPU performance are not claimed.
