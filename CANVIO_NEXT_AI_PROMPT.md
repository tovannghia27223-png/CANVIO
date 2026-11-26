# Prompt bàn giao cho AI tiếp theo (CANVIO)

Bạn là Senior Product Designer kiêm Frontend Engineer của CANVIO (một file `index.html`, miễn phí, không API trả phí). Người dùng viết tiếng Việt, muốn giao diện tinh tế, dễ dùng, nút chính luôn nhìn thấy, ít tốn usage.

## Trước khi làm
1. Đọc `CANVIO_AI_GUIDE.md` (kiến trúc) rồi các mục P131.1, P131.2, P127.1, P127.4 cuối `CANVIO_ROADMAP.md`. Không quét lại toàn bộ `index.html`; dùng `grep -n` có ngữ cảnh.
2. `index.html` dùng đuôi dòng CRLF. Khi sửa bằng script, đọc/ghi nhị phân (`rb`/`wb`) và giữ `\r\n`, nếu không `git diff` sẽ đổi cả file.
3. Quy tắc: chỉ thêm hoặc bọc, không xóa tính năng; mỗi lô là một `<script id="canvio-lotNNN">` kèm bản độc lập `canvio-pNNN-*.js` (test kiểm hai bản khớp).

## Cách kiểm (đã chạy được trong sandbox không có mạng)
- `node tests/p131/run-p131-tests.cjs`, `node tests/p127/run-p127q-tests.cjs`, và các test nguồn trong `.github/workflows/canvio-candidate-runtime.yml`.
- Chrome thật: `python3 tests/p131/run-p131-browser.py` và `run-p131-app-smoke.py`. Cờ cần thiết: `--disable-gpu`, `--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1`, `reduced_motion='reduce'`. `wait_for_function` phải bọc `!!(...)` (Playwright tự gọi nếu kết quả là hàm).
- Cạm bẫy đã gặp: `classList.add/remove` và `setAttribute` cùng giá trị vẫn tạo bản ghi `MutationObserver`; callback ghi lại đúng thuộc tính đang quan sát sẽ lặp vô hạn. Luôn kiểm `contains`/so sánh trước khi ghi.
- `tests/p57` đỏ khi chạy trần từ trước (CI áp override); không phải lỗi mới.

## Việc còn mở, theo thứ tự đề xuất
1. **P131 còn lại:** nối `CANVIOSecurity.sanitizeHtml` vào đường nhập HTML website/Content Factory; giới hạn kích thước/độ sâu khi giải nén ZIP/PPTX/PSD (chống zip bomb); gắn `redact` vào các đường xuất; cân nhắc mặc định khóa Gemini vào bộ nhớ phiên có thông báo.
2. **P127.2/P127.3/P127.5:** AutoCut theo Whisper timestamp, jump cut, zoom nhấn; SFX/nhạc cục bộ, ducking, đo LUFS; mẫu Short/Reel, YouTube dài, Event recap. Mở rộng cổng chất lượng P127.4 với headroom/safe area, tương phản chữ, glow/bloom khi có dữ liệu khung hình.
3. **P142:** kiểm thử trên Chrome thật của người dùng (Windows, GTX 1650, RAM 7 GB) cho các tính năng GPU/AI.
4. Các mục P116–P145 chưa có trạng thái "Đã nghiệm thu" trong `CANVIO_ROADMAP.md`.

## Báo cáo
Sau mỗi lô: cập nhật `CANVIO_ROADMAP.md` (Đã có / Một phần / Chưa, kèm giới hạn trung thực), thêm 1–2 dòng vào `CANVIO_AI_GUIDE.md`, commit nhỏ có thông điệp rõ, đẩy lên `main`. Không khẳng định đã kiểm nếu chưa chạy.

## Cập nhật 2026-11-20 (sau P145 core)
Đã có thêm: P127.3 (LUFS), P127.5 (mẫu), P125.1/P125.3/P125.4-phần giảm dung lượng (web cuộn từ video), P145 core (giấy phép, cue sheet, kiểm font, data merge, JSONL).
Pull trước khi làm: CI bot hay push commit "build: commit verified ..." lên main; dùng `git pull --rebase origin main`.
Việc còn mở theo thứ tự gợi ý: P125.2 editor cuộn; P132 xuất GIF/APNG/WebP động; P136 Image Trace; P137 kiểu đoạn/bảng/luồng chữ; P138 khử ồn + TTS; P145.3 SFX Web Audio; P145.2 shader chuyển cảnh; P134 waveform/vectorscope; P124 Auto Layout/Component; P133 OPFS/proxy; P143 tách mã; P144 Command Palette; P145.4b trình phát nhúng tự phát; P130 (chặn: cần Supabase thật); P142 kiểm Firefox/WebKit/cảm ứng.
Quy tắc nhúng: mỗi lot là `<script id="canvio-lotNNN">` + bản độc lập `canvio-pNNN-*.js`; không viết chuỗi `</script>` thật trong mã (dùng `<\/script>`); index.html dùng CRLF, sửa bằng đọc/ghi nhị phân.



## Cập nhật tiếp tục 2026-11-21 — P134.2 candidate

- P134.2 Auto Reframe bản nhẹ đã có source canvio-p134-reframe.js, Node test tests/p127/run-p134r-tests.cjs (11 assertions), Chromium/ffprobe test tests/p145/run-p134r-browser.py trên branch work/p134-auto-reframe-20261121.
- Dò tương phản cạnh + sai khác frame; 9:16/1:1; WebM; giới hạn 60 giây/100 MiB. Không phải face/object AI; không upload/đụng timeline.
- Đọc kết quả PR/hosted CI trước khi merge. Không sửa PR #45. Nếu CI pass, kiểm source parity/index build/manifest trước khi xác nhận main.
- P133 trên main đã có OPFS/recovery + denoise Worker; chỉ còn proxy 720p, OffscreenCanvas use-case cụ thể và migration tài sản lớn có quota/rollback. P143 vẫn là tách mã theo từng lot và parity test.

## Consolidated continuation 2026-11-21 — P124 / P133.2 / P144.3

- P124: canvio-p124-autolayout.js + tests/p124; five layout presets/four variants, existing Website Engine adapter. Advanced breakpoint/component conversion remains partial.
- P133.2: canvio-p133-proxy.js + tests/p127/run-p133p-tests.cjs and tests/p145/run-p133-proxy-browser.py; 4K local WebM proxy, longest edge 1280 px, ≤500 MiB/180 s, new clip only. OffscreenCanvas/OPFS migration still open.
- P144.3: canvio-p144-ux.js 144.3.0; TIPS for all registered CVWS routes, existing F1/palette/tour owner; route coverage tests added.
- Consolidated branch work/canvio-p124-p133-p144-final-20261121. Wait for hosted CI before merge. P134.2 Auto Reframe is already merged to main through PR #46 (run #340 PASS).
- P143 remains staged code extraction; P122.3 MCP has no approved threat/transport/permission contract; P130 needs a real Supabase project/RLS/two-device test; P70 retains 14 manual release gates.


### P133.2 QA correction — CI #347 (2026-11-21)

- First hosted Chromium run successfully generated a 1280×720 WebM, preserved Opus audio, fully decoded the file and confirmed the original clip remained unchanged.
- It caught an actual integration race: the UI did not await the asynchronous Video Engine importFiles() promise, so the proxy download existed but the new timeline clip was not yet present when reported. Updated the module to await importFiles(), verify clip-count increase and retain the download link if timeline ingestion fails.
- CI must be rerun on the corrected commit; no proxy acceptance/merge claim until timeline import passes.


### P144.3 route-coverage correction — CI #354 (2026-11-21)

- Hosted Chromium confirmed the workspace registry contains 38 routes, not only the 25 initially covered. It identified 13 missing help topics: templates, brand, designSystem, responsive, collab, hub, platform, one, promptForge, insight, hallmark, guide and shield.
- Added page-specific guidance for all 13, using Guide-documented behavior and explicit boundaries (e.g. collab is local notes/activity, Prompt Forge is prompt handoff, Shield does not certify server headers).
- P133.2 passed all 11 Chromium checks in the same run, including actual timeline import, clip duration, audio, full decode and original preservation. P124 passed 9/9.
- Rerun required to verify all 38 CVWS routes have contextual help; no merge claim until that coverage check passes.

## Mainline handoff update — 2026-11-21 after PR #51

- Main commit e4e3647b8b49dcc931065c3f7893f68b48d9a071. PR #51 merged; candidate workflow #360 and mainline workflow #362 PASS 39/39.
- P124 Auto Layout and P133.2 4K proxy are integrated; P144.3 contextual help covers all 38 CVWS routes. P133 remaining scope: OffscreenCanvas and selected large-media OPFS migration.
- P143 PR #52 branch work/p143-source-parity-audit-20261121 adds phase-1 parity gate for 20 workflow-managed standalone source modules. Pre-browser gates passed in run #363, full same-origin browser acceptance still pending.
- Do not mark P143 full source split closed until script/style inventory, dependency/boot-order DAG and staged extraction are complete.
- P122.3 cannot be invented without MCP feature/transport/authentication/permission/threat contract. P130 remains blocked without real Supabase + RLS/two-device test. P70 fourteen manual acceptance gates remain open.

## P143 current-main branch

- Use work/p143-parity-current-main-final-20261121 (based on main 6481d83), not old branches #52/#53.
- Phase 1 source parity manifest/tests and plan are present. Prior run #363 passed all 39 steps; rerun current-main CI before merge.
- Full source split remains open; don't claim every inline script/style has been modularized.


## P134 test fix for P143 hosted validation

- Run #371 exposed a WebM metadata issue, not an exporter failure: `r_frame_rate` falsely indicated 60 fps when avg rate/format duration were missing, measuring ~4.1 seconds as 2.05 seconds.
- `tests/p145/run-p134r-browser.py` now reads packet presentation timestamps/durations and reports PTS diagnostics; fallback is the explicit canvas.captureStream(30) only when timestamps are unavailable.
- New latest-main run #373 pending on PR #54. Do not merge until success.

## P143 Phase 2 — canonical inline inventory

- Added tests/p143/build-inline-source-inventory.cjs. It runs after module integration and before full HTML audit, writes tests/p143/inline-source-inventory.json, and the JSON is included in package/evidence artifact.
- Report enumerates script tags in source order and records ids/types/src/async/defer/bytes/SHA256 plus heuristic global dependencies. It is not a semantic dependency DAG; CSS, HTML templates and dynamic imports/loaders still need separate inventory.
- Current hosted workflow must pass before treating this report as verified.

## Final verified handoff — 2026-11-21

- Main commit at handoff: c5dd364d057173a3e851e3cf4379b741e53dd8b6. PR #54 merged at 0523a8c9691fd7d10436377c53b0e489d4c0f47b.
- PR candidate run #384 and mainline run #385 both PASS 41/41. Pages #222 PASS build/deploy/report.
- P124 Auto Layout, P133.2 4K proxy and P144.3 contextual Studio help are merged (PR #51); P134.2 Auto Reframe is merged (PR #46). P134 duration QA uses packet timestamps.
- P143 parity/inventory merged (PR #54). 20 standalone modules match canonical lots; tests/p143/inline-source-inventory.json records 150 inline script tags, 0 external src, 0 duplicate IDs. Full dependency DAG, style/template inventory and project-wide extraction remain open.
- P133 OffscreenCanvas/media-to-OPFS migration and P124 advanced breakpoint/component interactions remain partial.
- P130 cannot be completed without a real Supabase backend/schema/RLS and two-device test. P122.3 MCP must not be invented without an approved threat/transport/auth/consent contract.
- P70 remains fail-closed with fourteen manual real-world gates; do not claim Stable/production-certified.


## P143 follow-up — 27 module parity candidate

- Branch work/p143-parity-27-modules-20261121 extends tests/p143/source-module-map.json from 20 to 27 pairs, adding P127 Loudness/Templates, P133 Resilience, P134 Scopes, P138 Denoise, P140 Charts and P145 SFX.
- No runtime code or script order changed. Each added pair already has an individual parity suite. Hosted CI required before merge.
- Full P143 still needs a semantic dependency/boot-order DAG, CSS/template/dynamic-loader inventory and staged extraction/rollback/offline/CSP acceptance.

## Final verified handoff — 2026-11-21

- Latest main at handoff: `9624e38540458c523e2ab8a354e3d7592b27eeb8`.
- PR #55 merged at `d8b37533b5699bb495b88dea50da2a8f9e48e8d9`; expands central P143 parity from 20 to **27** module pairs.
- Candidate workflow #386 and mainline workflow #387: **SUCCESS 41/41** each. GitHub Pages #224 and #225: SUCCESS.
- P143 additions: P127 Loudness/Templates, P133 Resilience, P134 Scopes, P138 Denoise, P140 Charts and P145 SFX. Source parity result 27 passed / 0 failed.
- Canonical index inventory: 150 script tags (all inline), 0 external src, 0 module/async/defer, 147 unique IDs, 0 duplicates; HTML 5,459,631 bytes.
- Latest verified artifact #387: 21,753,092 bytes, SHA-256 `31a2ba6e7494fd8e6fdf65210ef2714e43bf49dae399d910b8f4fe5e84b1f958`.
- P124 advanced component/breakpoint editing and P133 OffscreenCanvas/large-media OPFS remain partial. Full P143 semantic dependency/style/template extraction is not complete.
- P70 remains fail-closed (14 manual gates); P130 needs real Supabase/RLS/two-device validation; P122.3 needs approved MCP threat/security/transport contract. Do not claim CANVIO 1.0 Stable or production certification.


## Handoff — follow-on candidate branch 2026-11-21

- Start from branch work/p133-offscreen-p143-style-audit-20261121, based on main f8e476cc33c726c8c5a8ff6d5292e4b8ef1f270f.
- Candidate changes: P124.2 configurable breakpoint/column panel; P133.3 OffscreenCanvas Worker proxy scaling with main-thread fallback; P143.3 CSS/style/template/dynamic-loader inventory and heuristic dependency candidate report.
- Before merging, inspect candidate GitHub Actions. P124 expected Node API check count 16 and Chromium UI 12; P133 browser test requires renderPath === 'offscreen-worker'; P143 style inventory generator + validator run before HTML audit. These are planned checks, not yet PASS.
- Do not claim that P143 is fully modularized: semantic dependency/boot-order review and reversible source extraction remain. Do not claim large-media OPFS migration: the canonical Video Engine media store is unchanged.
- Continue updating this Guide, Roadmap, Tracker, QA report, acceptance matrix and session summary in the same branch/turn after each verified increment.
- Defer P70 real-world gates until the user schedules them. P130 still needs the user's Supabase project/schema/RLS/credentials and cross-device restore proof. P122.3 MCP still needs an approved transport/authentication/consent/permissions/threat model before implementation.



## Bàn giao cập nhật — 2026-11-21 (sau commit 76711cb)

### Đã làm trong phiên này (mỗi mục: module standalone + lot nhúng `canvio-lotNNN` + test Node + test Chrome + docs; smoke 21/21, 0 page error)
| P | Module | Lot | Vị trí UI | Test |
|---|---|---|---|---|
| P119 | `canvio-p119-easing.js` (CVEasingP119) | `canvio-lot119e` | Trang Chuyển động, cạnh `#motionEase`: đồ thị bezier kéo được, preset, lò xo `linear()`, xuất Lottie JSON 1 lớp | `run-p119e-tests.cjs`, `run-p119-browser.py` |
| P118 | `canvio-p118-wordmark.js` (CVWordmarkP118) | `canvio-lot118w` | Trang Thương hiệu: .ttf → outline SVG, kerning thật (kern + GPOS PairPos), tải SVG / lưu Asset Library | `run-p118w-tests.cjs`, `run-p118-browser.py` (so với chữ Chrome: lệch 0 px bề rộng) |
| P141 | `canvio-p141-fonts.js` (CVFontsP141) | `canvio-lot141f` | Trang Thương hiệu: kiểm 146 ký tự tiếng Việt, font biến thiên, gợi ý cặp font, báo cáo JSON (dùng bộ đọc của P118, P118 phải nạp trước) | `run-p141f-tests.cjs`, `run-p141-browser.py` |
| P128.2/.4 | `canvio-p128-orchestrator.js` (CVOrchestratorP128) | `canvio-lot128o` | Platform → tab **API Hub**: điều phối local → Gemini, 1 lần gọi/tầng, timeout, cache, thống kê độ trễ; ảnh/video báo "chưa cấu hình" (P128.1 đã có sẵn ở API Hub/Local AI Studio) | `run-p128o-tests.cjs`, `run-p128-browser.py` (server OpenAI giả) |
| P137 | `canvio-p137-styles.js` (CVStylesP137) | `canvio-lot137s` | Dàn trang: kiểu đoạn (5 kiểu), cập nhật kiểu cho mọi trang, mục lục tự động có số trang, Hoàn tác (qua `CVNativeEngines.layout.snapshotState/restoreState`) | `run-p137s-tests.cjs`, `run-p137-browser.py` |
Bỏ lại: bản Auto Reframe của mình (trùng P134.2 do AI khác đã merge, PR #46). Tất cả dòng CI đã thêm vào `.github/workflows/canvio-candidate-runtime.yml`; hosted CI chưa quan sát cho 5 commit này.

### Việc còn lại (theo thứ tự đề xuất)
1. **Kiểm CI hosted** cho các commit P119/P118/P141/P128/P137 (`gh api repos/tovannghia27223-png/CANVIO/actions/runs`); nếu đỏ thì sửa trước khi làm mới. Lưu ý test P118/P141 cần Liberation Sans và Caladea (gói `fonts-liberation`, `fonts-crosextra-caladea`) hoặc biến môi trường `CANVIO_TEST_TTF`, `CANVIO_TEST_TTF_PARTIAL`.
2. **P135** lớp điều chỉnh không phá hủy cho Pixel Atelier (chưa bắt đầu; quét trước xem có `CVNativeEngines.pixel` API nào).
3. **P139** lớp hình, parent/null, text animator cho Motion Lab (dùng chung easing của P119).
4. Phần dở của P133 (PR #58 OPFS), P124.2 (PR #59): merge khi CI xanh; PR #56 là nhánh cũ `mergeable=false`, không merge.
5. P137 còn thiếu: luồng chữ nhiều khung, kiểu ký tự, tạo kiểu tên mới, kiểu bảng. P118: .otf/CFF, woff, ligature, Paper.js boolean. P119: kiểm Lottie với lottie-web thật, dùng chung easing với Video Engine.
6. P120/P126 (ComfyUI, RIFE, Real-ESRGAN) cần GPU: chỉ làm adapter; đăng ký qua `CVOrchestratorP128.register(kind,tier,fn)`.

### Bị chặn (cần người dùng / môi trường thật)
P130 Cloud Sync (Supabase thật + RLS + 2 thiết bị); P122.3 MCP (cần hợp đồng bảo mật được duyệt); P142 đa trình duyệt (Safari/Firefox thật); 14 cổng P70 (nghiệm thu thiết bị/media thật); P143 tách mã (đã giao AI khác, tránh xung đột).

### Cách làm đã dùng (giữ nguyên)
Đọc `CANVIO_AI_GUIDE.md`, không dò cả `index.html`. Chỉ thêm. Lot mới chèn trước `<style id="canvio-lot131-css">`, nội dung CRLF, không chứa `</script>` thật (dùng `<\/script>`); khi sửa module phải nhúng lại lot (thay từ `<script id="…">` đến `</script>`) và test kiểm bản nhúng == bản standalone. Chrome test: Playwright python trên http.server localhost, cờ `--no-sandbox --disable-gpu --disable-dev-shm-usage --host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1`, `reduced_motion='reduce'`. `gh` GraphQL bị chặn: dùng REST `gh api`. Trước khi push: `git pull --rebase origin main`; xung đột docs giữ cả hai phía; xung đột workflow lấy upstream rồi thêm lại dòng của mình.

### Giới hạn trung thực chung
Chỉ kiểm bằng tín hiệu/tệp tổng hợp và Chromium headless; chưa kiểm footage dài, thiết bị thật, Safari/Firefox, Lottie player thật, Ollama/LM Studio thật. Không ghi "đạt nghiệm thu" cho bất kỳ mục nào trong danh sách trên.


## Verified update — 2026-11-21 — P124.3

- PR #63 (selected Website Engine component responsive breakpoints) merged to `main` as `ed6679faec689483db62eb718aa55e068866618b` after hosted candidate workflow run #444 succeeded.
- Hosted Chromium evidence: P124 UI interaction **15/15**; selected component received a scoped class, desktop/tablet/mobile rules were written through GrapesJS CSS Manager, canonical `CV.engines.web.save()` was called, save failure was surfaced, mobile viewport had no overflow, and page errors were zero.
- The workflow also completed its existing regression/runtime steps successfully, including the P133.2 proxy and P133.4 OPFS checks in run #444. This does not close remaining P124 advanced component editing or P133 migration work.
- PR #64 P135.1 is NOT merged: its hosted run #467 failed at the unrelated P133.2 proxy gate with UI status `Tạo proxy vượt thời gian cho phép.`; no page errors were reported. Its head is now non-mergeable against the updated main and must be rebased/cleaned before another acceptance run. Do not mark P135 complete.
- PR #65 is a duplicate/stale P139 candidate (mergeable=false; no hosted run). PR #66 is the clean P139.1 candidate stacked on the P135 branch (no hosted run yet); keep P139 partial and do not merge before the P135 base is accepted.
- P135.1 remains a partial non-destructive adjustment stack; reload persistence, masks/local corrections, smart objects, clone/patch and liquify remain open. P139.1 remains partial; precomp, physical motion blur, word/range selector, expanded keyframe editor and real-project/export acceptance remain open.


## Latest verified continuation — 2026-11-21 (P133/P135)

- Main now includes P133 bitmap/Worker watchdog and Canvas2D fallback plus P135.1's nine non-destructive Pixel adjustment stack; PR #68 merged.
- CI evidence: P133 #44911472539 44/44, P135 #44911475373 45/45, post-merge main #44912553516 45/45.
- For P135 keep the flattened-PNG persistence limitation explicit: adjustment metadata is tab-memory only and resets on reload/new source. Do not claim masks, smart objects, clone/patch or liquify.
- Next candidate PR #70: wire P139.1 text animator into the actual Motion Lab draw path. PR #71: local-only ComfyUI API workflow bridge through P128 for P120/P126. Validate both on current main and keep actual ComfyUI/GPU/model and P70 real-world acceptance open until tested.
- Continue to preserve AI Guide/Roadmap/tracker/session/QA/acceptance history on every merge; no full P70 release certification unless all fourteen gates have evidence.


## P139.1 live renderer bridge — 2026-11-21

- P139.1 now wraps existing Motion Lab draw and routes matching text-layer Canvas2D fillText calls through the per-character animator; verify P139 Node + Chromium CI before merge.
- P139 is partial until real project/export/target device review. Do not add a second canvas/timeline/store; preserve existing Motion Lab snapshot/restore as owner.


## Latest verified continuation — 2026-11-21 — P120/P126

- Main includes P120/P126 local ComfyUI connector via existing P128; PR #73 merge edd18a7abbed57e2, hosted CI #44914277311 48/48.
- It connects to loopback ComfyUI, imports API graph, supports explicit prompt/media input mapping and optional media upload, polls job history, downloads output and saves to current Asset Library. No cloud/key/auto-installer.
- Keep P120/P126 partial until real free local ComfyUI models/nodes are tested on target hardware, with CORS, licensing and output quality checked.
- Continue P137.2 and P119.2 clean-main PRs, verify CI, merge and append exact results to this Guide/Roadmap/Tracker/QA/Session Summary/Acceptance Matrix. P70 still has 14 open real-world gates.


## P120/P126 ComfyUI workflow bridge — 2026-11-21

- Candidate branch adds a local-only ComfyUI API bridge via P128: import API-format workflow JSON, optional media upload, map prompt/media node inputs, queue/poll, retrieve output through /view and save via existing CV.assets.addBlob.
- Verify hosted Node/Chromium CI before merge. Keep P120/P126 partial until real user-installed free ComfyUI models/custom nodes and representative GPU media are exercised. No cloud APIs, API keys, background jobs or auto-installers.

## P137.2 rich formatting — 2026-11-21

- Adds selected-character styling and table presets to the existing P137 Layout Foundry owner. Check P137 Node + Chromium and P143 source parity before merge. Keep selection restricted to one paragraph and do not create a second document store.

## P119.2 shared easing integration — 2026-11-21

- Candidate shares CVEasingP119 with P145.2 transitions and P79 video-only segment export. Default linear is backward compatible; named presets/custom curve from #motionEase use the original P119 API.
- Verify P145.2 Node+Chromium and P143 source parity; P119 remains partial for Video Engine clip/keyframe and Website Engine timelines.

## P135.2 project snapshot persistence — 2026-11-21

- New P135.2 candidate stores the editable adjustment stack inside the existing Pixel PNG snapshot via a CRC-checked tEXt chunk; it wraps native snapshotState/restoreState, adds no second database and keeps the image raster unchanged.
- Verify P135 Node/Chromium tests and P143 parity before merge. Do not claim cloud/two-device sync; third-party PNG re-encoding can discard ancillary metadata.


## Current mainline handoff — 2026-11-21

- Mainline includes P137.2 (PR #76, #535 51/51), P119.2 (PR #78, #538 52/52) and P135.2 (PR #81, #549 53/53). P143 parity now covers 32 standalone/embedded pairs.
- Continue P143.4 from the clean current-main branch: run current CI, inspect lexical scanner evidence and keep semantic-DAG / Phase 3 claims bounded. No runtime script reordering.
- P135.2 embeds the editable adjustment stack in the existing Pixel PNG snapshot; this is local snapshot persistence, not a two-device/cloud sync claim.
- Keep P70 fail-closed (14 manual gates), P130 blocked on real Supabase/two-device evidence, P122.3 unimplemented pending approved security contract.


## Current mainline and candidate handoff — 2026-11-21

- P143.4 is merged at #83 / 29acd119; post-merge #551 passed 53/53, Pages #275 passed. P143 parity 32/32, scanner 14/14, verifier 17/17. The lexical dependency map is not semantic dependency resolution; Phase 3 extraction remains open.
- P119.3 candidate integrates the existing CVEasingP119 preset registry with native Video Engine keyframe controls and Motion custom cubic-bezier. Verify candidate CI before merge. Do not create a second timeline/store; commit through the native Apply/Undo/snapshot owner.

## P119.3 Video Engine keyframe easing — 2026-11-21

- P119.3 adds the shared six-preset registry to the existing Video Engine motion inspector; custom cubic-bezier from #motionEase maps into the native vtKFEasing/Bezier inputs. Use native Apply/Undo/snapshot only.
- The evaluator delegates to CVEasingP119.bez only when its three-decimal normalisation is lossless and its Y range is representable; older curves use the original solver. Spring linear() is not treated as a cubic-Bezier.
- Verify Node P119.3 and real Chromium image-clip acceptance; keep Website Engine/CSS timeline open.

## P119.4 Website Motion shared easing — candidate

- Share CVEasingP119.PRESETS and Motion cubic-Bezier with the existing P47 Website Motion Builder. Apply only via existing selected GrapesJS component and Website Engine save/export handlers; do not create a second timeline/store.
- Accept only canonical cubic-bezier from CVEasingP119.css(); do not treat spring linear() as Bezier.
- Re-run Node, Chromium and P143 34-pair parity. Manual authored-project, published-host CSP/headers, keyboard/screen-reader and physical-device acceptance remain open.


## P146.1 Home Guided Creative Workflows — follow-up scope

- Home now offers five goal-based brief/workflow starters using existing Home fields and Studio destinations. Preserve the single Shared Core and existing persistence owners; do not add a duplicate project/asset/prompt store.
- Inspect hosted Node/Chromium evidence before final acceptance and manually review keyboard/focus, screen-reader, small-screen layout, user-authored project behavior and whether the five sample briefs fit real HR/business workflows.

## P124.4 selected component layouts — candidate

- Use the existing CVAutoLayoutP124 API and selected GrapesJS component. Layout applies scoped CSS/data attributes to the existing node without replacing its tag/content/children.
- The four visual variants remain whitelisted; persist through the existing Website CSS Manager/save owner. No duplicate store/editor or external dependency.
- Verify Node, Chromium, P143 parity and hosted integration. Keep nested variants, drag/resize, arbitrary component-tree conversion, accessibility and device review open.

## Cập nhật 2026-11-23 — P118.2/.3, P119 (lottie-web), P137.3–6, P150
- P118: `CVWordmarkP118` đọc .ttf, .woff (parseAsync) và .otf CFF Type 2; fixture `tests/p127/fixtures/subset-cff.otf` so với fontTools. Còn: .woff2 (Brotli), CFF2/CID, ligature.
- P119: workflow riêng `.github/workflows/canvio-lottie-web.yml` chạy `tests/p145/run-p119-lottie-web.py` với lottie-web thật (xanh).
- P137 (hiện 137.6.0): nút "Chảy sang trang sau" (cắt đoạn theo từ, giữ đậm/liên kết), "Tạo kiểu mới". Khi nâng phiên bản phải sửa chuỗi `version: '137.x.0'` trong `.github/workflows/canvio-candidate-runtime.yml` (dòng kiểm nguồn P137) — quên bước này làm CI đỏ.
- P150: Tổng quan mặc định là giao diện cổ điển; 3 kiểu phụ (sky/fashion/tech) chọn bằng `#cv150-skins`, lưu `canvio.homeSkin.v2`.
- Còn mở (code): P133 OffscreenCanvas + chuyển media lớn sang OPFS; P143 tách mã theo lot; P124 tương tác thành phần/breakpoint nâng cao (cần đặc tả cụ thể); P137 khung chữ liên kết trên poster. Bị chặn: P130, P122.3, P142, P70, P120, P126.
- P130–P152 (2026-11-24): xem mục cuối CANVIO_AI_GUIDE.md. Việc dở: đồng bộ màu Spatial (panel/rail theo token + Midnight), icon toggle sidebar tương phản thấp trên topbar tối, rà lỗi lặt vặt, kiểm tra drawer/panel đè ở các editor khác ngoài Poster, kiểm tra preview iframe diff/variants. Người dùng cần tự xác nhận P130 trên Supabase thật. Mỗi thay đổi phải ghi cả ROADMAP, AI_GUIDE và file này.
- 2026-11-24 đối chiếu: P137, P133 đã hoàn tất (bỏ khỏi danh sách "còn mở" phía trên). Chỉ còn P124 nâng cao (cần đặc tả), P143 Phase 3 (cần người dùng đồng ý), cùng các mục bị chặn.

## P153–P158 — việc kế tiếp đã lên kế hoạch (2026-11-24)
- Chưa có dòng code nào. Đọc mục "P153–P158" trong CANVIO_ROADMAP.md trước khi làm. Thứ tự đề xuất: P154 → P155 → P156 → P157 (một gói), P153 độc lập, P158 cuối.
- Cần hỏi người dùng: duyệt thứ tự; ảnh toàn cảnh 2:1 mẫu để test P154; xác nhận chi tiết skill "design-to-motion" (MP4/GIF 800×500) vì chỉ suy từ hình.
- Mỗi P: test node + Chromium, boot-order graph, parity P143, rồi ghi cả ROADMAP, AI_GUIDE và file này; push thẳng `main`.

## P153–P157 đã làm (2026-11-24) — cập nhật cho AI kế tiếp
- Đã xong và có test: Bảng cảm hứng (P153), Trình xem toàn cảnh (P154), Thẻ/Prompt phân công/Góc máy/Kiểm tra tông (P155–P157). Xem ROADMAP mục "P153–P157 — ĐÃ LÀM".
- Còn mở: P158; nối prompt P156 vào P128/ComfyUI; nối sự kiện `cv153:usecolor` vào Poster/Brand; thử với ảnh toàn cảnh thật của người dùng; đồng bộ ảnh đầy đủ lên cloud nếu cần.
- Khi sửa module: sửa file standalone rồi chép y hệt vào lot trong index.html (parity P143), chạy `tests/p153/run-p153-tests.cjs`, `tests/p145/run-p153-browser.py`, smoke, boot-order `--check`.

## NGUYÊN TẮC TÍCH HỢP + P159–P166 (2026-11-24)
- Làm P159 trước: chuyển P153–P157 sang `CV.assets` + `CVCreativeCore` + `CVOrchestratorP128`, nối Storyboard; di chuyển dữ liệu cũ từ `CANVIO_SCENE_STORE`/`canvio.p153.board`/`canvio.p155.cards` mà không mất. Sau đó P160→P166 theo ma trận trong ROADMAP.
- Mọi P mới: không kho riêng; có test kiểm dữ liệu xuất hiện ở module khác; nút "Gửi sang…". Hỏi người dùng về "kênh chia sẻ" (gói file hay máy chủ).


## P159 integration candidate — 2026-11-24
- P153 writes board metadata to Shared Core project documents and sends image bytes to the Asset Library; legacy `CANVIO_SCENE_STORE` / `canvio.p153.board` migration is fail-safe and must leave legacy data when any image has no verified asset ID.
- P155 cards are project-scoped; P156 runs through P128 deterministic local prompt assembly; P156/P157 append to the canonical Video Studio Storyboard without replacing existing shots. No new database, timeline or model API.
- CI now embeds P153/P155/P159 standalone sources into `index.html` before P143 parity, and runs `tests/p159/run-p159-tests.cjs`. Inspect workflow #689/successor and fix any red checks before claiming completion. Only after Node/Chromium/P143/boot-order pass should docs be changed from candidate to PASS.
- Continue with P158 only after clarifying its design-to-motion scope; then P160–P166 from ROADMAP. Do not begin P143 Phase 3 extraction without explicit user approval.

## P159.1 (2026-11-24 tối)
- P159–P166 giờ đã nhúng trong index.html và qua parity/Chromium/smoke. Việc còn: nhãn chữ cho form P163, thử ảnh/GLB thật, đồng bộ hai thiết bị, thêm test P160–P166 vào CI nếu chưa có, dock thêm tab cho P161/P162/P165/P166 nếu chúng gắn thẻ vào Video Studio.

## BÀN GIAO CHO AI TIẾP THEO (2026-11-24, sau P168) — ĐỌC KỸ TRƯỚC KHI LÀM

**Vai trò:** Senior Product Designer + Frontend Engineer cho CANVIO (một file `index.html` ~6MB, người dùng nói tiếng Việt). Trả lời và ghi chú bằng tiếng Việt. Mọi thứ miễn phí, chạy cục bộ, tối thiểu tài nguyên; KHÔNG xóa chức năng cũ (chỉ gộp/thêm); giao diện tinh tế, thao tác chính luôn thấy ngay; push thẳng `main` của `https://github.com/tovannghia27223-png/CANVIO` (AI khác có thể làm qua PR → luôn `git pull --rebase origin main` trước khi push). Sau mỗi thay đổi ghi cả 3 file: `CANVIO_ROADMAP.md`, `CANVIO_AI_GUIDE.md`, `CANVIO_NEXT_AI_PROMPT.md`.

**Nguyên tắc tích hợp (người dùng đặt, bắt buộc):** mọi module liên kết với Studio, Thư viện Tài nguyên (`CV.assets`), AI Engine (`CVOrchestratorP128`), Video Editor/Storyboard; dữ liệu dùng chung qua `CVCreativeCore` (`active.documents.<key>`, `linkAsset`, `context()`). Không tạo kho dữ liệu riêng, không làm công cụ đứng một mình.

**Trạng thái:** P108–P145 xong phần code (trừ P124 nâng cao, P143 Phase 3, Project Vault→OPFS). P153–P157 (Bảng cảm hứng, Toàn cảnh, Thẻ/Prompt/Góc máy/Kiểm tra tông), P159–P166 (tích hợp, Collections, Spatial, Reference Canvas, Character Continuity, Shot List, AI Workflow, Landing), P167 (Dựng khối 3D trắng), P168 (Ảnh→chuyển động + bản mẫu quy trình) đã nhúng vào index.html và có test. Dock "Bộ công cụ cảnh" trong Video Studio gom các thẻ.

**Quy trình thêm module (bắt buộc đủ 5 bước, AI trước từng bỏ sót bước 2):**
1. Tạo `canvio-pNNN-*.js` (IIFE, không có chuỗi `</script`).
2. Nhúng `<script id="canvio-lotXXX">` (CRLF) vào index.html TRƯỚC `<style id="canvio-lot131-css">` và thêm `{source, scriptId}` vào `tests/p143/source-module-map.json`.
3. Chạy: `node tests/p143/run-p143-source-parity.cjs` (phải đạt hết), `node tests/p143/build-boot-order-graph.cjs` rồi `--check`, `node tests/p143/build-inline-source-inventory.cjs`.
4. Viết test Node (phần thuần) + test Chromium (`tests/p145/run-pNNN-browser.py`, dùng Playwright + `google-chrome`, chèn `html,*{scroll-behavior:auto!important}`), chạy cả smoke `tests/p131/run-p131-app-smoke.py` (21/21) và `tests/p130/run-p130-tests.cjs` (41).
5. Thêm test vào `.github/workflows/canvio-candidate-runtime.yml`, commit, push, rồi kiểm CI (`gh run list`).
Khi sửa module: sửa file standalone rồi chép y hệt vào lot (parity so từng byte, bỏ khác biệt CRLF).

**Việc còn mở (ưu tiên từ trên xuống):**
1. Chỉnh nhân vật trực quan (mặt, tóc, sẹo, trang phục) cho P163 — hiện chỉ mô tả chữ + checklist; form P163 còn thiếu nhãn chữ cho ô nhập/ô chọn.
2. Nối Google Drive để giữ bản gốc ảnh (ý từ video Mewia) — dùng connector/đường dẫn người dùng tự cấp, không bắt buộc.
3. P167: xoay (yaw)/đổi cỡ đối tượng bằng chuột, nhiều camera xem cùng lúc, xuất chuỗi khung/ảnh từng camera; P168: lấy ảnh thẳng từ Poster/Designer (không chỉ Tài nguyên), thêm hiệu ứng chữ.
4. Nối "Dùng màu này" của Bảng cảm hứng vào Poster/Brand; gửi prompt P156/P165 sang ComfyUI (P120/P126) khi người dùng bật.
5. Đồng bộ Màu Spatial (panel/rail theo token + Midnight) và icon nút bật/tắt sidebar tương phản thấp trên topbar tối (người dùng đã báo, chưa làm).
6. P124 nâng cao (biến thể lồng, kéo/đổi cỡ) — cần hỏi đặc tả; P143 Phase 3 (tách mã thật) — chỉ khi người dùng đồng ý, rủi ro vỡ file đơn.
7. Rà lỗi lặt vặt: quét nút bấm toàn bộ ~48 trang đã 0 nút chết (P152) nhưng nên quét lại sau khi thêm module; kiểm tra drawer/panel đè ở các editor ngoài Poster.

**Bị chặn bởi bên ngoài (đừng giả vờ xong):** P130 cần người dùng thử trên Supabase thật (hai thiết bị); P70 cần 14 cổng kiểm thử thiết bị thật; P120/P126 cần ComfyUI + GPU + model thật; P122.3 chờ hợp đồng bảo mật được duyệt; chưa thử ảnh toàn cảnh/GLB thật và sinh video AI thật. Người dùng nên đổi mật khẩu DB nếu từng chia sẻ (publishable key thì không sao).

**Cạm bẫy đã gặp:** sanitizer `clean()` từng xóa `srcdoc` iframe (đã whitelist iframe sandbox); `.card` trong `#page-assets` có hiệu ứng nghiêng 3D `data-tilt` làm lệch vùng bấm; Asset Library chỉ nhận qua `CV.assets.addBlob` (không trả id; lấy `list()[0]`); không ghi vào `CVCreativeCore` khi chưa có dự án; thêm file nguồn mà không nhúng lot thì parity hỏng và trang thật không có module; `html[data-theme=dark]` không ép lên skin graffiti (làm nút trắng chữ trắng — dark thật là skin Midnight).

**Báo cáo trung thực:** chỉ nói "xong" khi có test chạy thật; nêu rõ phần chưa thử bằng dữ liệu thật; không tuyên bố nghiệm thu khi CI chưa xanh.


## Handoff — P150.11 export styling regression (2026-11-24)
- Review branch: `fix/p150-workspace-export-scope`.
- Changed `canvio-p150-home-sky.js` to remove broad unscoped export-button selectors that leaked Home theme styling into other workspaces; module version 150.11.0.
- Changed `.github/workflows/canvio-candidate-runtime.yml` to embed the standalone P150 source into canonical `canvio-lot150h` before browser acceptance.
- Root cause is supported by run #769/#770 logs: five failures, one per non-Home route, all checking original pink export button; surrounding route-isolation checks passed.
- Next: open PR to main, wait for full hosted runtime + Pages workflow, inspect logs and verify all P150 desktop/mobile checks, parity, no page errors, and no warnings. If any check fails, fix the cause and rerun. Do not merge or report complete on a red/in-progress run. Preserve all fourteen P70 real-world gates as OPEN.


## P169 — Character Studio integration handoff

- Embed `canvio-p169-character-studio.js` as `canvio-lot169c` after P163 is available; preserve P163 as the sole character profile owner. P169 writes `visual:*` fields using `CVCharacterContinuityP163.upsert`.
- Keep P150.12 scoped to actual visible Home, not merely a retained `.active` class. The non-Home export button must remain the original pink in all five workspaces.
- CI must run `tests/p169/run-p169-tests.cjs` and `tests/p145/run-p169-browser.py`, P143 source parity, full HTML/inline JS syntax audit, and the existing P47–P70, P153, P159–P168 suites.
- Keep limitations explicit: P169 is 2D SVG, P163 consistency is heuristic, P167 is white-box blocking (not a full scene graph), P168 WebM depends on MediaRecorder; no model inference/cloud sync or P70 release certification unless separately evidenced.


## P150.13 handoff

- Keep the Home-skin root token at `classic` whenever Home is not visibly active. Restore the locally stored selected skin only when `#page-home` is actually visible.
- P150.13 Chromium must pass the root-skin fallback and pink Export checks in all five workspaces at desktop/mobile. Do not merge based on the P150.12 run (#782), which failed those five color assertions.
- Other scene and character suites were green in #782: P167 browser, P168 browser, P169 7/7, and P160–P166 28/28.


## P150.13 QA fixture note

- Keep P47's Holographic theme separate from P150 Home skins. Test original pink Export under P47 `plain`; separately assert P47 Holo's gradient appearance remains unchanged across all five workspaces.
- Do not merge until a new hosted run passes both theme modes plus the complete regression/browser suite.


## P150.13 — independent theme test isolation follow-up

- Test baseline through the real owners: wait for CVLot47/CV229, call `CVLot47.set('plain')`, `CV229.setTheme('graffiti')`, then assert pink Export before workspace changes.
- For each Design/Site/Media/Project/AI route, log `data-home-skin`, Home-active flag, P47 skin, P229 body theme classes, computed background/backgroundImage/color/border. Compare to the captured baseline; do not change P47 or P229 in the P150 runtime.
- Keep a separate Holo fixture proving P47 Holo button styling is preserved when Home skin changes.


## P150.13 test fixture baseline

- Do not capture the original pink Export baseline while the Home tech skin is active. First open the Design workspace and wait for Home scope to switch to classic, then capture the non-Home pink background.
- Run #785 showed Holo preservation passed 5/5; P150 non-Home computed backgrounds were pink (no diagnostic emitted) but comparisons failed against the Home-tech baseline. Re-run full Chromium acceptance after this test-only change.


## P167.1 handoff (2026-11-24)

- P167 source branch `feat/p167-object-inspector-multicam`; module version `167.1.0` adds selected-object inspector, camera position/look-at fields, mouse yaw/scale, simultaneous camera preview (up to 8), and a PNG contact sheet with four time samples per camera.
- `tests/p145/run-p167-browser.py` now verifies object selection/editing, mouse rotation/scale, camera coordinate persistence, multi-camera preview, and downloadable PNG sequence sheet. Existing P167 Node/browser tests remain in the hosted workflow.
- Workflow must sync `canvio-p167-blocking.js` into `canvio-lot167b` in `index.html`, pass P143 parity and full Chromium suite before merge.
- Scope limitation: CPU perspective projection on Canvas 2D, not a full WebGL scene graph or rendered 3D asset pipeline. Do not claim video rendering; the new export is a PNG contact sheet (four keyframes per camera).
\n\n## P167.1 + P168.1 handoff (2026-11-25)\n\n- P167.1 fix: selected object name is committed on `input`; browser test checks persisted name after reload. Preserve the Canvas2D renderer limitation and PNG contact-sheet export wording.\n- P168.1 candidate: add direct current Poster SVG handoff and Designer image-like `snapshotState()` / existing rendered-Canvas fallback to the P168 motion panel; do not create an Asset Library intermediate. Local-only source validation rejects remote image references.\n- P168.1 adds a bounded text overlay with static/fade/slide/typewriter/pop, top/middle/bottom placement, plain/banner/outline styles, color and size. Preview, GIF frames and WebM record the same Canvas-composited text.\n- Node and Chromium tests were expanded. Await the exact final hosted run and generated canonical `index.html` before calling this accepted; mainline and manual P70 gates remain separate.\n

## P132.1 PDF import — current-mainline v3 (2026-11-25)

- Branch: `feat/p132-pdf-import-mainline-v3`; module `canvio-p132-pdf-import.js` / `canvio-lot132pdf`; PDF.js 6.5.438 Apache-2.0 local vendor and SHA manifest.
- Verify workflow embeds the inline lot with real line breaks, validates the vendor manifest, runs P132 Node/Chromium, P143 51-pair parity and full regressions. Browser handoff assertion captures file metadata during capture phase before Pixel's picker cleanup.
- Do not use old-branch #813 as acceptance for this v3 head. Require exact-head green CI before merge. One raster page per import; password, batch and editable vector/text are out of scope.


## P163.1.1 — Visible profile labels (2026-11-25)

- Branch: `feat/p163-visible-field-labels-mainline-v3`; `canvio-p163-character-continuity.js` version 163.1.1. Seven existing P163 controls have visible associated labels; IDs, event handlers, data owner and synchronization are unchanged.
- `tests/p145/run-p169-browser.py` checks visible label/control association in addition to P169 profile round-trip and mobile overflow.
- Verify exact-head hosted runtime, P143 parity, P163/P169 Chromium and full regressions before merge. Manual keyboard/screen-reader/200% zoom review remains; do not claim WCAG certification.


## P161.2 / P74.1 — GLB camera pose continuation (2026-11-25)

- Branch: `feat/p161-glb-camera-pose-mainline-v3`; P161 version 161.2.0 and P74 viewer 74.1.0. P161 awaits `viewer.load(file)` then applies the saved pose through P74's `applyCameraPose()`; same camera/renderer/OrbitControls owner.
- Workflow step embeds P74 standalone source into canonical `canvio-p74-p81-three-viewer` before the extract step; P161 is synchronized by the existing P159 step. Verify exact-source parity, syntax, P143 and hosted tests.
- Hosted GLB fixture checks both P74 direct pose and P161 preset replay including nonzero X/Y/Z. Previous #812 caught pending damping drift; P74 now flushes inertia before absolute pose. Require new exact-head PASS before merge. Complex GLBs and physical-device GPU/frame-rate review remain open.


## P166.2 — GrapesJS Website Engine handoff (latest mainline · 2026-11-25)

- Branch: `feat/p166-website-engine-handoff-mainline-v3`; module `CVLandingStudioP166` version 166.2.0. `sendToWebsite()` navigates to webEngine, waits up to 12s for lazy `CVWeb`/CSS Manager/P131/save availability, sanitizes body, inserts scoped root, applies base/mobile rules and saves through canonical Website Engine.
- #817 showed a test race: `CVWeb` wasn't yet defined immediately after navigation. The source and Node suite now cover a 120 ms delayed engine; Chromium still requires real GrapesJS root, CSS Manager mobile rule, Shared Core metadata and native save. Do not mock or bypass the browser integration check.
- Verify exact-head hosted runtime, P160–P166 Node/Chromium, P143 parity and full regression before merge. Static landing page only: no backend form submission/CRM/hosting/publish. Real design/accessibility/device review remains open.


### P166.2.1 — Node fixture retry note (2026-11-25)

- Run #827 reached P160–P166 Node checks and failed at `waitForWebsiteEngine`: the test removed `CVWeb` before it had initialized the P131 security/save mocks. This is a fixture ordering issue, not a product timeout defect.
- Updated `tests/p160/run-p160-166-tests.cjs` to establish P131/CVWeb/save mocks first, remove only `CVWeb`, restore it after 120 ms, and await readiness. Re-run the exact current head; P166 Chromium still must exercise real GrapesJS.


## P153.1 hosted test correction (2026-11-25)

- Full hosted run #830 stopped in `tests/p145/run-p153-browser.py` after reload, before P160–P166 tests. Log: three cards existed in `#cv153-grid` but the default Playwright locator wait required visibility. The assertion being tested is persistence after reload, not a pointer interaction.
- On combined branch `feat/canvio-final-integration-p132-p163-p161-p166`, replaced the visible-state wait with `wait_for_function(document.querySelectorAll('#cv153-grid .card').length===3)`. Subsequent DB/image and user-action checks remain intact. Re-run exact-head hosted acceptance; do not attribute #830 failure to P166.

## Current mainline handoff — PR #102 merged

- Main branch contains squash commit 08efae63b9372fcf8941deac77decad99f3a5076 from PR #102. P132.1, P163.1.1, P161.2/P74.1 and P166.2 are integrated; do not reopen superseded component PRs #98–#101.
- Exact same-tree hosted run #836 passed 66/66. Artifact CANVIO-23.3.111-GITHUB-RUNTIME-VERIFIED-836 contains the source ZIP and reports; PDF.js vendor is 6.5.438 / Apache-2.0 / 189 SHA-verified files. CANVIO_MANIFEST.json certifies the index hash/byte size but keeps releaseCertified:false.
- P132: one-page PDF raster handoff into existing Pixel Atelier; P163: visible labels only; P161: camera pose replay on existing r187 viewer; P166: P131-sanitized static landing handoff to existing GrapesJS/CSS/Website save owners.
- Preserve explicit limits: no editable PDF vector/text/password/batch import; no WCAG certification; no universal complex-GLB/physical-GPU certification; no backend forms, CRM, hosting or publishing.
- P70 remains blocked with fourteen manual gates pending. Never mark release certified until all have independently reviewed evidence.


## P130.2 — Điền sẵn Supabase mặc định (2026-11-25)
- `cfg()` trong `canvio-p130-cloud.js` và lot trong `index.html` (giữ parity) trả về URL `https://szdyeqzqyyxmenoiiqxe.supabase.co` + publishable key (`sb_publishable_…`, an toàn công khai) khi máy chưa lưu cấu hình; cấu hình người dùng nhập vẫn ưu tiên.
- Việc còn lại của người dùng: chạy `supabase/canvio-schema.sql` (nút "Sao chép SQL" ở thẻ P130) trong Supabase SQL Editor, rồi đăng ký/đăng nhập và đặt cụm mật khẩu. Chưa test được với project thật.
- Không dùng 2 schema `canvio_*` (Foundation 1.0) và "Studio 4.0" (không RLS, không mã hóa) cho P130; nếu muốn làm việc nhóm thì cần quyết định riêng. Không bao giờ đưa secret/service_role key vào repo.


## P170 — Kho lưu trữ kép: máy tính + Supabase (2026-11-25)
- Module `canvio-p170-storage-hub.js` (`CVStorageHubP170`, lot `canvio-lot170h`, thẻ `#cv170-card` ngay dưới thẻ P130 trong `#page-projectVault`). Một nút "Lưu cả máy và cloud" gọi `saveBoth()`; mỗi bên độc lập, lỗi một bên không chặn bên kia.
- Máy: File System Access API (Chrome/Edge) → thư mục `CANVIO/{manifest.json, projects/<id>.json, assets/<sha12>-<tên>}`; tay cầm thư mục nhớ trong IndexedDB `CANVIO_P170` (cần cấp lại quyền sau khi mở lại trình duyệt: bấm nút lưu một lần). Cloud: bucket riêng tư `cv-assets/<uid>/…`, mỗi tài nguyên mã hóa AES-GCM bằng khóa P130 + `manifest.enc` mã hóa; trùng nội dung (SHA-256) không lưu lại; tệp > ~48MB không lên cloud (chỉ ở máy).
- Nối với: `CV.assets` (đọc `list()`, khôi phục bằng `addBlob`), `CVCreativeCore.active` (là THUỘC TÍNH getter, không phải hàm), P130 (thêm `_key()` và `_token` vào client). Không có kho dữ liệu riêng.
- SQL kho tài nguyên: `supabase/canvio-storage.sql` (cũng trong thẻ, nút "Sao chép SQL kho tài nguyên"); người dùng phải chạy MỘT LẦN sau SQL của P130. Test kiểm tra tệp khớp chuỗi trong module.
- Test: `tests/p170/run-p170-tests.cjs` (28; thư mục giả + Storage giả + P130 thật bằng WebCrypto), `tests/p145/run-p170-browser.py` (12; dùng OPFS thay hộp thoại chọn thư mục). Lưu ý: đọc tay cầm OPFS từ IndexedDB làm sập Chromium headless → module giữ tay cầm trong bộ nhớ, test dùng `_setHandle`.
- Chưa làm / chưa test: sao lưu video lớn và dữ liệu Project Vault/localStorage ra thư mục máy; khôi phục dự án (`projects/*.json`) về lại app (hiện chỉ khôi phục tài nguyên); xóa tài nguyên trên cloud; tự động lưu định kỳ; chọn thư mục thật và Supabase thật chưa được thử với tài khoản người dùng.


## P230 — Tiếp tục nghiệm thu unified accent (2026-11-25)

- Branch `fix/unified-global-accent-p230`; source `canvio-p230-unified-accent.js`; embedded lot `canvio-lot230`; API `CVUnifiedThemeP230 230.1.0`.
- P230 uses the currently selected P229 `--brand` as the sole accent hue. Primary actions solid accent; secondary controls accent tint/outline; active sidebar/menu/workspace states solid accent. Removes separate primary gradients/pink/cyan/yellow overrides without recoloring semantic success/error/warning states.
- CI workflow injects P230 after candidate index reconstruction and runs `tests/p145/run-p230-tests.cjs` plus `tests/p145/run-p230-browser.py`. Browser test exercises P229 themes graffiti/glass/midnight/aurora/cyber/neonlight, Design/Site/Media/Project/AI routes and desktop/mobile.
- Acceptance: inspect computed styles for Photo Workflow Luma/open/save controls, sidebar active state, P229 Spatial routes and P47 Holo. Confirm no contrast regressions, page errors or duplicate style. Do not claim full synchronization until hosted workflow passes.


## P171 + hoàn tất P230 (2026-11-25)
- **P171** (`canvio-p171-nav-drawer.js`, lot `canvio-lot171n`): ở giao diện shell (`data-nav=shell`, P114) menu trái `#side` bị ẩn nên nút `.railBtn` ở thanh trên (biểu tượng ô vuông tách đôi) bấm không thấy gì. Nay nút mở menu đầy đủ dạng ngăn kéo (Esc, bấm nền hoặc chọn mục để đóng; scrim là `#cv171-scrim` đặt trong `.app` để không đè lên menu); chế độ cổ điển giữ hành vi rail cũ. Thêm nút "Cổng bảo vệ" (khóa truy cập, chống AI cào, bảo vệ tác phẩm) dưới nút Spatial Workspace; trước đó trang chỉ vào được qua không gian "AI & cài đặt"/Ctrl+K. Test `tests/p145/run-p171-browser.py` (11).
- **P230** hoàn tất phần còn dở: nhúng `canvio-lot230` vào `index.html` (cuối `</body>`, CI vẫn ghi đè idempotent), thêm vào map parity. Sửa CSS: nút chính `.cvExport` trong `header.top` bị rule Graffiti (`.top :is(...)`) ghi đè → thêm rule cùng accent. Sửa test: chọn nút chính ĐANG HIỂN THỊ (trước đó lấy nút ẩn `.cvExport`), chờ 700ms sau `setTheme` để màu hết chuyển tiếp. Kết quả cục bộ: node OK, Chromium 68 PASS / 0 FAIL.
- Bài học: z-index trong `.app` không vượt được phần tử gắn ở cấp `body`; test màu phải đợi hết transition.
- Chưa làm: xem ảnh thực tế các theme sau P230 trên máy người dùng; xác nhận CI đúng head.


## P230.2 — Graffiti dùng hồng #F83E9F, bỏ tím (2026-11-25)
- Theo yêu cầu người dùng: nút chính theme Graffiti không còn gradient hồng→tím. `canvio-p230-unified-accent.js` đặt `--brand/--cv-accent` của `body.cv229-theme-graffiti` = `#F83E9F` (ink `#C91F7A`, soft `#FFE6F2`), nút chính nền `#F83E9F` + gradient cùng tông `#F83E9F→#FF63B1`, `.ws-ic/.cc-dock-mark` cũng hồng→hồng nhạt. Các theme khác (glass, midnight, aurora, cyber, neonlight) giữ màu riêng; nếu muốn tất cả theme cùng hồng thì đổi `--brand` của từng theme.
- Chưa đổi: hình minh họa trang chủ (chip "Offer accepted" màu tím) và vài icon trang trí Graffiti.
- Test: Chromium P230 68 PASS / 0 FAIL.


## P230.3 — Mọi theme dùng hồng #F83E9F (2026-11-25)
- Người dùng dùng theme khác Graffiti và vẫn thấy tím nên P230.2 mở rộng: `canvio-p230-unified-accent.js` đặt `--brand/--cv-accent/--violet/--primary/--accent` = `#F83E9F` (!important) cho MỌI theme, nút chính gradient hồng `#F83E9F→#FF63B1`. Màu theo theme riêng (xanh glass, midnight…) không còn ở nút/menu/chip; nếu cần trả lại hue riêng theo theme thì sửa dòng P230.2 trong file này.
- Còn lại ít màu tím/xanh không phải accent: chip "POSTER OWNER", thanh công cụ editor xanh, icon trang trí sidebar Graffiti (`#7b3fe4` cố định), ảnh minh họa trang chủ.
- Test: Chromium P230 68 PASS, smoke 21/21, parity 54/54.


## P230.4 — Hồng neon Graffiti cho chữ nhỏ, chip, thanh editor (2026-11-25)
- `canvio-p230-unified-accent.js` thêm quy tắc: `.eyebrow`, `.cv-pwf-kicker/.cv-pwf-count/.cv-pwf-steps article>span`, `.badgeSoft`, `.cv11-chip`, `.cvh-ic` dùng `--cv-accent-ink`/`--cv-accent-soft`; vạch `.eyebrow::before` gradient hồng; thanh editor `#cv-top.cv189-sticky` nền đen→tím đậm `#0B0B10→#2A1030` + viền dưới hồng `#F83E9F`.
- Cố ý KHÔNG đổi: nội dung mẫu trên canvas (`.ly`), chữ xám-xanh trung tính (`63,88,115`), hero trang chủ (cyan), chip lọc kind của Bảng cảm hứng (`.cv153-chip`), avatar HR. Nếu người dùng muốn đổi thêm thì thêm quy tắc P230.5.
- Test: Chromium P230 68 PASS, smoke 21/21, P171 11/11.


## ROADMAP P231–P236 — Editor vừa khít màn hình, không cần cuộn (kiểu Canva / CapCut) · kế hoạch 2026-11-25

**Vấn đề (người dùng báo):** các công cụ xếp thẻ chồng dọc nên khung vẽ/timeline nằm dưới màn hình, phải kéo xuống mới dùng được. Poster Studio: hàng nút xuất + bảng P34 + thanh editor chiếm ~550px trước khi tới canvas; Video Studio, Pixel Atelier, Dàn trang tương tự.

**Mục tiêu:** mỗi công cụ có "Chế độ Editor" cao đúng bằng cửa sổ (`100dvh` trừ thanh trên), KHÔNG cuộn cả trang; mọi thao tác chính nhìn thấy ngay.

**Bố cục chuẩn (dùng chung mọi công cụ, một shell duy nhất):**
```
┌ thanh trên: Tên dự án · Hoàn tác/Làm lại · Lưu · Xuất (luôn hiện) ┐
│ rail trái │         khung vẽ (tự fit)          │ Thuộc tính phải │
│ Mẫu       │                                    │ (theo đối tượng) │
│ Thành phần├────────────────────────────────────┤                  │
│ Chữ/Ảnh…  │ Video: timeline · Poster: trang/zoom│                  │
└───────────┴────────────────────────────────────┴──────────────────┘
```
Cột rail và bảng phải thu gọn được; ≤900px thành thanh dưới + ngăn kéo.

**Nguyên tắc bắt buộc (giữ nguyên):** chỉ THÊM, không xóa chức năng/thẻ cũ — thẻ cũ được DỜI vào ngăn kéo/tab của shell (`adopt` như dock P159u `canvio-p159u-dock.js`), có nút "Bố cục cũ" để quay lại; không kho dữ liệu mới; vẫn nối Studio, `CV.assets`, `CVOrchestratorP128`, Video/Storyboard, `CVCreativeCore`; miễn phí; test bằng trình duyệt thật.

**Việc đã có để tái dùng:** `body.cv229-focus` và `CV229` (Spatial Workspace, inspector, floating launch), `CVWS` (không gian làm việc), `cv189-sticky` (thanh editor Poster), dock P159u (mẫu adopt thẻ), shell điều hướng P114, ngăn kéo menu P171, accent hồng P230.

| P | Nội dung | Tiêu chí nghiệm thu (test trình duyệt) |
|---|---|---|
| **P231** | **EditorShell dùng chung** `canvio-p231-editor-shell.js` (`CVEditorShellP231`): API `mount(pageId,{rail,canvas,props,bottom,topActions})`, `adopt(selector,slot)`, `toggle()`, lưu bố cục `sessionStorage`; lưới CSS `100dvh`, `overflow:hidden` ở vùng editor, canvas tự fit; nút "Bố cục cũ". | Ở 1440×900 và 1280×720: `document.scrollingElement.scrollHeight <= innerHeight` trong chế độ editor; canvas hiện đủ; Lưu/Xuất/Hoàn tác nhìn thấy không cuộn; không pageerror. |
| **P232** | **Poster Studio trong shell**: rail (Mẫu, Thành phần, Chữ, Ảnh/Tài nguyên, Brand), thuộc tính phải theo đối tượng đang chọn, hàng xuất + P34 workbench dời vào ngăn kéo "Công cụ" và "Xuất". | Chọn đối tượng → bảng phải đổi; kéo thả từ rail vào canvas; mọi nút cũ (PDF/PPTX/PNG/SVG, Layers & History) vẫn gọi được; Asset Library chèn ảnh vào canvas. |
| **P233** | **Video Studio trong shell** kiểu CapCut: khung xem trước giữa, media/asset trái, thuộc tính phải, **timeline cố định dưới**, phát/tạm dừng bằng Space, thanh Xuất trên. Nối Storyboard (`CVScenePackP155`), ảnh→chuyển động (P168), shot list (P164). | Timeline luôn hiện không cuộn; thêm clip từ `CV.assets`; xuất vẫn chạy; project `canvio5:media_video_project_v1` không đổi định dạng. |
| **P234** | **Pixel Atelier / Ảnh & Clarity / Luma / Dàn trang** vào shell (rail công cụ + bảng điều chỉnh phải + canvas giữa). | Cùng tiêu chí P231 cho từng trang; lưu kết quả vào Assets vẫn hoạt động. |
| **P235** | **Di động & phím tắt**: ≤900px rail → thanh dưới, bảng phải → ngăn kéo dưới; phím tắt chuẩn (Ctrl+Z/Y/S/D, Space, Del, +/−, Alt+1…5); chạm hai ngón zoom. | 390×844 không tràn ngang, mọi hành động chính chạm được ≥40px; Lighthouse/axe không lỗi nghiêm trọng mới. |
| **P236** | **Nghiệm thu & thói quen**: ghi nhớ trạng thái cột (mở/thu), "Tập trung" ẩn thanh trên, onboarding 3 bước, tổng hợp lỗi bố cục theo màn hình (1920/1440/1280/1024/390). | Bộ ảnh chụp 5 cỡ × 4 công cụ so sánh được; không công cụ nào cần cuộn trang để dùng chức năng chính. |

**Thứ tự đề xuất:** P231 → P232 (Poster, người dùng dùng nhiều nhất) → P233 (Video) → P234 → P235 → P236. Mỗi bước: đưa vào lot `canvio-lotNNN` + file độc lập (parity P143), cập nhật CI (`.github/workflows/canvio-candidate-runtime.yml`), ghi cả 3 file MD.

**Rủi ro / lưu ý cho AI làm tiếp:**
- Đừng đặt phần tử ở cấp `body` rồi mong z-index đè lên phần tử trong `.app` (đã gặp ở P171: scrim phải nằm TRONG `.app`).
- `.card[data-tilt]` làm lệch vị trí click; thẻ dời vào shell cần tắt tilt.
- Test màu/vị trí phải tắt `transition` hoặc chờ ≥700ms; chèn style sau `goto` có thể mất nếu trang nạp lại.
- Đọc lại tay cầm OPFS từ IndexedDB làm sập Chromium headless (P170).
- Theme hiện nay: accent hồng `#F83E9F` cho mọi theme (P230.3); shell mới phải dùng `--cv-accent*`, không viết màu cứng.
- Chưa xác nhận với người dùng: có muốn shell áp dụng cho TẤT CẢ công cụ hay chỉ Poster/Video trước; mặc định làm Poster → Video trước.

**Việc còn mở từ trước (không thuộc P231+):** "Dùng màu này" → Poster/Brand; P156/P165 → ComfyUI; đồng bộ màu Spatial; P167 yaw/đa camera nâng cao; khôi phục dự án từ thư mục máy (P170); lưu định kỳ tự động; xác nhận CI mới nhất và ảnh thực tế các theme sau P230.


## ROADMAP P237–P248 — BIG UPDATE "CANVIO Studio Pro" · kế hoạch 2026-11-25
Nối tiếp P231–P236 (editor vừa khít màn hình). Người dùng muốn một bản cập nhật lớn; chọn **bản gọn trước (Đợt A)**, các phần nâng cao là **Đợt B**. Mọi mục tuân thủ nguyên tắc: chỉ THÊM không xóa; nối Studio · `CV.assets` · `CVOrchestratorP128` · Video/Storyboard · `CVCreativeCore`; miễn phí (không API trả phí); local-first; test bằng trình duyệt thật; ghi cả 3 file MD; mỗi module = lot `canvio-lotNNN` + file độc lập (parity P143) + bước CI.

### ĐỢT A — cốt lõi (làm theo thứ tự)
| P | Nội dung | Nối với | Nghiệm thu |
|---|---|---|---|
| **P231–P233** | Editor vừa khít màn hình: shell dùng chung, Poster, Video (xem mục trước). | CVWS, dock P159u, P114 | Không cuộn trang ở 1440×900 / 1280×720; nút chính luôn thấy. |
| **P237** | **Thanh lệnh thông minh** `CVCommandP237`: một ô Ctrl+K hiểu lệnh tiếng Việt ("đổi sang 9:16", "thêm tiêu đề", "xuất PNG", "mở Video") → chạy trên khung đang mở; có lịch sử, gợi ý, hoàn tác. Quy tắc từ khóa chạy local trước, AI (Orchestrator) chỉ khi quy tắc không hiểu. | Palette hiện có (`#ws-cmdbtn`), CVWS, shell P231 | ≥30 lệnh qua test; lệnh sai không làm hỏng tài liệu; Hoàn tác khôi phục. |
| **P238** | **AI trợ lý trong editor** `CVAssistantP238`: khung chat bên phải shell, biết đối tượng đang chọn + Brand Kit, trả về "kế hoạch thao tác" (JSON hành động: đổi màu/cỡ chữ/bố cục/viết lại) hiển thị để duyệt rồi áp dụng; mọi thao tác nằm trong một bước hoàn tác. | Orchestrator tiers (local → miễn phí), `CVCreativeCore`, P231 | Hành động chỉ chạm đối tượng được phép; kế hoạch lỗi bị từ chối an toàn; chạy được khi không có mạng ở chế độ quy tắc. |
| **P239** | **Brief → trọn bộ** `CVBriefPackP239` (mở rộng "Tạo trọn bộ" hiện có): một brief + Brand Kit → poster, bài đăng, slide, trang CV/website, storyboard video; mỗi sản phẩm là tài liệu thật trong dự án (`documents.*`), không phải ảnh tĩnh. | `CVCreativeCore`, Brand, Storyboard P155, Orchestrator | Bộ 5 sản phẩm tạo xong < 60s ở chế độ local; mở được từng thứ trong editor; Brand Kit áp dụng nhất quán. |
| **P240** | **Đổi kích thước thông minh** `CVMagicResizeP240`: một thiết kế → nhiều khổ (FB, IG post/story, A4, banner) bằng ràng buộc (neo cạnh, co giãn chữ, giữ vùng an toàn), xem trước lưới và xuất cả bộ ZIP. | Responsive (P hiện có), Poster doc, `CV.assets` | 6 khổ chuẩn không tràn lề/đè nhau (kiểm tra va chạm hộp); xuất ZIP đủ tệp. |
| **P241** | **Tạo hàng loạt từ CSV** `CVBulkP241` (data-merge): dán/tải CSV → ghép cột vào chỗ giữ `{{tên}}`, xem trước từng dòng, xuất PNG/PDF cả lô (thẻ tên, chứng nhận, thư mời, lịch phỏng vấn). Dùng web worker, giới hạn 500 dòng/lần. | Poster doc, `CV.assets`, P170 (lưu lô vào thư mục) | CSV 100 dòng xuất đúng 100 tệp; ký tự tiếng Việt/dấu phẩy trong ngoặc kép đúng; dòng lỗi báo rõ, không dừng cả lô. |
| **P242** | **Lưu kép hoàn thiện** (nâng P170): tự lưu định kỳ khi có quyền thư mục; **khôi phục cả dự án** từ `projects/*.json`; **đóng gói `.canvio`** (ZIP: dự án + tài nguyên + manifest) xuất/nhập; hiện dung lượng đã dùng. | P170, P130, Project Vault, `CV.assets` | Xuất `.canvio` → xoá dữ liệu → nhập lại giống hệt (so sha256); tự lưu không chạy khi chưa được cấp quyền. |
| **P243** | **Phát hành website một nút**: đưa trang CV/website đang mở lên GitHub Pages của người dùng (dùng token cá nhân do người dùng tự dán, lưu máy), kiểm tra SEO cơ bản (title, meta, alt, H1), form liên hệ gửi về Supabase. | Website engine, P130 (Supabase), Brand | Bước kiểm tra SEO chặn khi thiếu title/alt; không lưu token vào repo/Cloud Sync; trang xuất mở được offline. |

### ĐỢT B — nâng cao (sau khi Đợt A nghiệm thu)
| P | Nội dung |
|---|---|
| **P244** | Video: **phụ đề tự động cục bộ** (Whisper WASM/WebGPU, tải model một lần, có thanh tiến độ, chỉnh sửa từng dòng, xuất SRT + ghi vào timeline); **đọc văn bản thành giọng** (SpeechSynthesis, có chọn giọng vi-VN). |
| **P245** | Video: **ghép cảnh theo nhịp nhạc** (phát hiện beat trong trình duyệt), keyframe, đổi tốc độ, chuyển cảnh, mẫu video có sẵn; dùng P168 ảnh→chuyển động và shot list P164. |
| **P246** | **Cộng tác nhẹ**: link xem chia sẻ (chỉ đọc), bình luận ghim trên thiết kế, lịch sử phiên bản có so sánh — dùng Supabase miễn phí (RLS theo `auth.uid()`), dữ liệu nhạy cảm vẫn mã hoá đầu cuối. |
| **P247** | **Hiệu năng**: chia nhỏ `index.html` ~6MB nạp theo nhu cầu (lot nặng chỉ nạp khi vào trang), PWA cài đặt/ngoại tuyến, đo thời gian mở app trước/sau, kiểm tra hồi quy ảnh chụp 5 cỡ × 4 công cụ. |
| **P248** | **Quản lý mô hình cục bộ + ComfyUI**: danh sách model đã tải, dung lượng, chạy thử, tự chọn mức theo máy (GTX 1650 / 7GB RAM là máy thử chính), nối P156/P165 → ComfyUI cục bộ. |

### Mục tiêu "cảm giác" của bản update
1. Mở app thấy ngay việc cần làm, không cuộn. 2. Gõ một câu là chạy được. 3. Một brief ra cả bộ sản phẩm. 4. Không bao giờ mất dữ liệu (lưu kép + `.canvio`). 5. Giao diện hồng neon Graffiti nhất quán (`--cv-accent*`, không dùng màu cứng).

### Rủi ro / ràng buộc cho AI làm tiếp
- Không đặt "kế hoạch AI" tự áp dụng khi chưa được duyệt; mọi hành động phải hoàn tác được.
- Token GitHub/khóa người dùng tự dán chỉ lưu trên máy, loại khỏi Cloud Sync (`canvio.p130.*` bị bỏ qua khi đồng bộ) và không ghi vào repo.
- Whisper/model lớn: kiểm tra RAM, tải theo yêu cầu, có nút huỷ; không tải mặc định.
- Giữ giới hạn Supabase miễn phí (≈1GB file, ≈50MB/tệp); video lớn ở lại máy.
- Mọi bước dùng theo thứ tự: parity P143 → inventory → boot-order → CI; đọc mục "Bài học" các P170/P171/P230 trước khi làm giao diện.
- Cần người dùng chốt: Đợt A có đúng thứ tự mong muốn không; có cần P243 (token GitHub) trong Đợt A hay chuyển sang Đợt B.


## Next handoff — P239–P248 exact-head CI

- Branch: feat/p239-p248-studio-pro.
- Before merge, run exact-head .github/workflows/canvio-candidate-runtime.yml; check P239–P248 Node/Chromium, P143 source parity, inline script inventory, boot order, full smoke and manifest refresh.
- Fix every failing assertion without weakening thresholds. Inspect P242 ZIP round-trip and imported asset references; P243 must use a disposable test repository/token only in a controlled manual test; never add a real token to code or CI.
- Keep documented scope limits honest: P241 SVG-only batch, P243 Pages configuration/form backend, P246 lack of Supabase collaboration, P247 full-index code split and P248 real model/GPU inventory are still open.
- Do not deploy or mark Stable; retain P70's independent real-world acceptance gates.
