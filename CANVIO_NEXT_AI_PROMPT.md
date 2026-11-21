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
