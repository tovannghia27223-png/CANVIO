# CANVIO P70 — QA & Stable Release Candidate Report

**Date:** 2026-11-17  
**Candidate:** `23.3.84-p70` · **PhaseSuite:** `70.0.0` · **Base:** P67 / `23.3.81-p67`  
**Disposition:** P68–P70 source and Chromium checks pass. Fourteen manual gates remain OPEN. P70 is not CANVIO 1.0 Stable and is not production-certified.

## 1. Architecture / mutation boundaries

P68–P70 are additive. P68 builds a standalone HTML from user-selected OBJ geometry; it does not mutate the active project. P69 is read-only. P70 is a report-only fail-closed candidate gate. The existing Video Engine timeline, Project Vault, Asset Library, Layout Foundry, `CANVIO_81_MEDIA`, `CVZip` and restore parser remain the owners. No project database, alternate timeline, cloud service or background worker was added.

## 2. Static checks

| Check | Result |
|---|---:|
| Inline JavaScript syntax | **91/91 PASS** |
| Static HTML IDs | **504/504 unique** |
| Duplicate IDs | 0 |
| External `<script src>` references | 0 |
| P63–P67 module syntax + index synchronization | PASS |
| P68–P70 module syntax + index synchronization | PASS |
| Whisper worker syntax | PASS |
| Workflow YAML parse | PASS |
| P70 marker/title | `23.3.84-p70` |

The 504 IDs count includes the `canvio-p68-p70-main` inline script ID. Panel control IDs are created dynamically at runtime and are checked in browser smoke.

## 3. Regression evidence

| Suite | Result |
|---|---:|
| P47 integration / Bezier / restore / CRC fixtures | PASS |
| P48 | 26/26 |
| P49 | 35/35 |
| P50 | 27/27 |
| P55 | 49/49 |
| P56 | 27/27 |
| P57–P62 | 15/15 |
| P63–P67 | 18/18 |
| P68–P70 | **16/16** |

P55's standalone VM fixture reports some runtime-only flags unavailable in the isolated test context; the full browser smoke runs the integrated application and confirms the inherited runtime PhaseSuite flags.

## 4. Inherited browser regression

`tests/p63-p67/run-p63-p67-browser-smoke.py` runs the actual P70 `index.html` while exercising the P63–P67 paths. Chromium 144.0.7559.96: **43/43 PASS**. It covers SPA routing, P57–P62 diagnostics/gates, archive preflight, track controls/WebVTT, synthetic WebM/MP4 encode/decode and cancel/retry, canonical timeline bridges/group/ripple/snap, local tracking fixtures, SVG asset transfer, typography/print preflight and viewport widths. The P70 title observer is verified not to revert to P42.

## 5. P68–P70 browser smoke

`tests/p68-p70/run-p68-p70-browser-smoke.py` runs actual P70 source in Chromium 144.0.7559.96. **16/16 PASS**, including:

- P70 build marker and title survive legacy title observers.
- P68–P70 control panel mounts on Video Engine; PhaseSuite flags are all true.
- A tetrahedron OBJ fixture parses and packages into single HTML with all six offline preflight checks passing.
- P69 read-only DOM/resource audit and browser frame sample complete. The observed P70 DOM scan was 13,466 nodes in this test fixture; this is a diagnostic count, not a performance failure by itself.
- P70 report lists fourteen pending gates; `releaseCertified:false`; the asynchronous P62 check is not auto-run by the summary.
- Exported offline viewer renders visible mesh pixels, toggles wireframe, resets view and emits zero browser errors or network requests.
- 375 px viewport has no horizontal overflow; zero uncaught page errors and zero console errors.

## 6. P68 / P69 scope limitations

P68 accepts only geometry-only Wavefront OBJ, up to 5 MiB, 100,000 vertices and 12,000 triangles. MTL, materials, textures, GLB/GLTF, FBX, STL, rigged animation and full Three.js Website scene packaging are not supported. Chromium smoke verifies a generated package in an isolated browser document; a clean-machine test with the network physically disabled remains pending.

P69's canvas/image/video bytes are estimates based on surface dimensions. Resource Timing and `performance.memory` may be missing or incomplete. The frame sample is short and device-specific. It is not a profiling suite and does not automatically change cache, media, project or DOM state.

## 7. Fourteen manual acceptance gates — OPEN

| Gate | Evidence required |
|---|---|
| HTTPS browser matrix | Chrome, Edge and Safari on production-like HTTPS |
| Native persistence | IndexedDB save/close/reopen, quota and ZIP restore |
| Real media | Full export decode, duration, real audio/video synchronization |
| Whisper | Real Vietnamese/English inference, cancel, retry, unload |
| Accessibility | Keyboard, screen reader, contrast, focus, true 200% zoom/reflow |
| Hosting/security | Pages, CSP, CORS, HSTS, MIME/cache headers and worker path |
| Real timeline project | MotionCut/Shape transfer, ripple/group/undo/redo and locks |
| Real tracking | Representative footage, occlusion, camera motion and stabilization quality |
| AI/provider | Real provider output, CORS/rate limits, provenance and licensing |
| Typography/print | Target fonts, pagination, physical bleed/crop and printer/PDF workflow |
| Offline 3D | Open OBJ HTML on a clean machine with network disabled |
| Target performance | Large projects and minimum supported hardware |
| Cross-origin recovery | Backup/restore on same and new origin with value checks |
| Release operations | Rollback, error logging and post-release observability |

## 8. CI / delivery

The hosted workflow pins Node.js 24 and Actions by immutable commit, verifies the exact P70 `index.html` SHA, audits scripts/IDs, runs retained regressions and both Chromium smoke suites.

- PR [#8](https://github.com/tovannghia27223-png/CANVIO/pull/8) was merged into `main` (merge commit `917792742d1a8e3b13307162eebb5bc3cbe20e40`).
- Main release workflow [run #47](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44110607967) completed successfully. Both validation/package and deployment jobs succeeded; all listed validation, regression and Chromium smoke steps passed.
- Workflow #47 validated commit `0217c253b36a145b979397cafa785fdd5232ec3d`; the workflow promotion produced current `main` head [`93d4840`](https://github.com/tovannghia27223-png/CANVIO/commit/93d484037ca8a00f49cd07e44e702f03964e0b4e).
- GitHub Pages [run #92](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44110606281) succeeded for the validated commit; final deployment [run #93](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44110828590) succeeded for current `main`.

The green workflow/deployment result confirms the hosted pipeline completed. It does not establish real-browser runtime acceptance, real media/Whisper behavior, accessibility, production security headers or the other manual gates listed above. Those remain open pending evidence on the target environment.

## 9. Final disposition

P70 is the CANVIO 1.0 Stable Release Candidate integrated on `main` and deployed through the successful GitHub Pages workflow described above. `window.CANVIOStableRelease.inspect().releaseCertified` remains `false` by design. Fourteen manual gates remain open. Do not label the product CANVIO 1.0 Stable or production-certified until those gates are evidenced, reviewed and approved.


### 2026-11-17 — Previous hosted verification (run #46)

- CANVIO Node.js 24 workflow [run #46](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44104323930) completed successfully for validation and deployment jobs. The validation job completed every listed step, including exact P70 source verification, retained regression suites, both Chromium smoke suites and source promotion.
- Workflow #46 validated the candidate at head SHA `d14096255e16dfad4ce70260914c837f4bd7dd5c`. The current `main` head is [`3e6be7e`](https://github.com/tovannghia27223-png/CANVIO/commit/3e6be7e2653a1f5d999ece355236a6bf4e8738e5).
- GitHub Pages [run #91](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44104556386) completed successfully for that current `main` head.
- This updates hosted pipeline evidence only. It does not close any of the fourteen real-world acceptance gates or certify CANVIO 1.0 Stable.


### 2026-11-17 — Latest hosted verification (run #47)

- CANVIO Node.js 24 workflow [run #47](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44110607967) completed successfully. Both jobs succeeded and every listed validation/package and deployment step completed successfully.
- Current `main` is [`93d4840`](https://github.com/tovannghia27223-png/CANVIO/commit/93d484037ca8a00f49cd07e44e702f03964e0b4e). GitHub Pages [run #93](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44110828590) completed successfully for this promoted commit.
- Pages [run #92](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44110606281) also completed successfully for the workflow-validated documentation commit. Application version remains `23.3.84-p70`.
- Fourteen real-world acceptance gates remain OPEN. Workflow success does not certify native persistence, real A/V sync, real Whisper inference, WCAG acceptance, production headers or target-device/project acceptance.


### 2026-11-17 — Latest hosted verification (run #50)

- CANVIO Node.js 24 workflow [run #50](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44113215411) completed successfully. Build and deploy jobs both passed. P47 fixtures; P48 26/26; P49 35/35; P50 27/27; P55 49/49; P56 27/27; P57–P62 15/15; P63–P67 18/18; and P68–P70 16/16 all passed.
- Chromium smoke: inherited P63–P67 43/43; P68–P70 16/16. Static audit: 91/91 inline scripts parse; 504/504 IDs unique; zero duplicate IDs or external script sources.
- The workflow verified all 57 manifest entries, including SHA-256 and byte counts. Main promotion is `b1c0ecf8e080beafc5f96f357efbbcaddad1444c`; GitHub Pages deployment [run #98](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44113545232) succeeded for that promoted `main`.
- Browser regression reports are now uploaded as GitHub Actions artifacts; the tracked reports are restored before manifest calculation. Only a changed manifest can be committed by the workflow, so smoke output does not create repeated source commits.
- Fourteen real-world acceptance gates remain OPEN. P70 remains a Stable Release Candidate, not production-certified.


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

## Hosted runtime verification — CANVIO 23.3.111

The GitHub-hosted Node 24 runner provisions same-origin Three.js r187 and P85 runtimes, verifies every vendored file against SHA-256 manifests, checks extracted module/worker syntax, runs P47–P70 regressions, validates P107 ZIP import rollback and runs Chromium against a same-origin HTTP origin. Browser inference checks execute actual P80 Whisper Tiny, P102 ORMBG and P105 Depth Anything ONNX WASM workers using synthetic test data; this verifies execution plumbing, not accuracy on real user data. SwiftShader is software, not a physical GPU. Real two-device Project Vault synchronization is not claimed. P70 remains releaseCertified:false with fourteen manual acceptance gates open.


## 2026-11-20 continuation audit — documentation checkpoint

- Reviewed current GitHub main commit `9290d128ca553b06195500d37210c8ffcc45dbbb` and the current Guide, Roadmap, Progress Report, QA Report and Manifest.
- Confirmed P131.2's latest source change is limited to the P66 SVG ingestion path delegating to `CANVIOSecurity.sanitizeSvg`. This does not establish that every import/export path is sanitized.
- Confirmed P127 capabilities and limitations as recorded in the Roadmap: edit plan, quality gate/EDL, silence-cut UI, LUFS measurement and text templates are partial implementations; real-media/audio acceptance and advanced director behavior remain open.
- No new runtime tests were executed in this checkpoint. The combined status response for commit `9290d128ca553b06195500d37210c8ffcc45dbbb` returned an empty status list; therefore no new CI PASS is claimed.
- Manifest was not manually rewritten because a trustworthy full-file SHA-256/package rebuild was not performed. The repository workflow must refresh manifest entries after any subsequent tracked-file update.
- Release disposition remains BLOCKED pending real-world acceptance; do not call CANVIO 1.0 Stable or production-certified.


## CI follow-up — missing ffmpeg dependency (2026-11-20)

- Root cause from failed hosted run [#116](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44689280423): all preceding source contracts, P131 browser security checks, 48-page navigation smoke, P127 UI smoke and P85/GLB runtime checks passed; the job failed only when `tests/p127/run-p125f-browser.py` attempted to spawn `ffmpeg`, which was not installed on the Ubuntu runner.
- Workflow fix committed at `ccd4f2a0c9d17e617e4cfb09c4ff2cbaaff8e755`: add `ffmpeg` to the existing apt-provisioned native test utilities alongside `zip`. This should unblock the P125.1 real-browser test; it is not yet a PASS until the new hosted run completes.
- Existing run #116 remains FAILED. Do not rewrite its conclusion or report the workflow fix as validated before the rerun.


## 2026-11-20 — Hosted runtime verification after ffmpeg repair

- Candidate: `23.3.111-github-runtime-ci`; runtime workflow [#125](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44692957703) completed **success** on source SHA `6a003524a1a46a9254035361303a779d9f4401b9`. All steps in the `verify` job completed successfully, including native test utility provisioning, source/module audits, P47–P70 regressions, P107 ZIP round-trip, Chromium runtime checks, documentation/manifest refresh and artifact upload.
- P125.1 browser acceptance completed after provisioning `ffmpeg`; the earlier run #116 remains failed in history, but the dependency repair is now verified by run #125.
- P131: source/VM suite 18/18; browser sanitizer/app smoke completed, with 18/18 app-smoke assertions and no page errors. This is evidence for the tested SVG/HTML payloads and current UI path, not blanket certification of every legacy import/export format.
- P127: Edit Plan 13/13; Quality Gate/EDL 14/14; P127.3 LUFS, P127.5 templates and P125.1 source tests report OK; P127 browser UI smoke 18/18 with no page/console/navigation errors. Real user audio/video quality, true peak and Whisper-directed editing remain unverified.
- P107 portable ZIP round-trip 6/6, including strict ZIP rejection, Asset Library import and rollback.
- Three.js r187 vendor set (29 files) and P85 vendor set (23 files) passed SHA-256 manifest verification. Hosted Chromium decoded uncompressed, Draco, Meshopt and KTX2 GLB fixtures; initialized P85 renderer/OpenCV/dotLottie/Rive runtimes; rendered PostFX; and processed a short synthetic/local optical-flow clip. P106 used ANGLE SwiftShader software rendering, not a physical GPU.
- Manifest generated by the workflow: candidate `23.3.111-github-runtime-ci`, 184 files, index SHA-256 `a371b7ebbdfce8632c69e49ad836232fddf9734a41c86d0399cccaa5f1994cbf`, `releaseCertified:false`, 14/14 P70 manual gates pending. Artifact `CANVIO-23.3.111-GITHUB-RUNTIME-VERIFIED-125` (21,310,667 bytes; SHA-256 `7f912f905db6158f77671b91205d912cfd8d72a0d5d4d80d8c61acaaaa0815d2`).
- GitHub Pages workflow [#145](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44692957814) completed **success** for source SHA `6a003524a1a46a9254035361303a779d9f4401b9`. The hosted runtime workflow subsequently committed its verified build/QA output as `ebc7331361f4215bdd14366c07e4748a955b233d` (`build: commit verified CANVIO 23.3.111 runtimes and QA`).
- Release remains **BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE**. Do not close the fourteen manual gates or claim CANVIO 1.0 Stable / production-certified from this CI result.


## P127.7 / P145 continuation — hosted verification #136

- Candidate branch added `canvio-p127-duck.js` and embedded lot `canvio-lot127k` into canonical `index.html`. P127.7 unit regression passed 7/7; it uses subtitle cues from text track 3 and writes a bounded volume envelope to one existing audio clip using the canonical Video Engine commit/undo path. Lock refusal and commit rollback are covered.
- Workflow #136 completed SUCCESS: integration step, inline JavaScript syntax/HTML audit, established P47–P70 regressions, integrated source contracts, P107 ZIP round-trip, hosted Chromium same-origin acceptance, P85/ONNX runtime acceptance, P145 core/SFX browser checks, P136/P134/P138 browser checks, manifest refresh and source package.
- P145.1 core and P145.3 synthetic SFX are verified within the exercised tests. This does not mean the entire P145 Content Factory is complete. Shader transitions, curated offline music/SFX, template factory, icon/font/stock packs, full quality gate and unified search remain open.
- P127.7 still needs hands-on review with real subtitle/music projects and listening tests. P70 release certification remains false; fourteen manual gates are pending. No cloud/two-device sync, physical GPU or production certification is claimed.

Workflow: https://github.com/tovannghia27223-png/CANVIO/actions/runs/44747203664


## Documentation refresh verification — workflow #137

- Workflow #137 completed SUCCESS after the Guide, Roadmap, QA and acceptance documentation were updated. The source/index candidate remains the same P127.7-integrated build already validated by workflow #136; this second run re-executed the hosted candidate pipeline and regenerated the manifest/package.
- Keep P70 release certification false and all fourteen manual gates pending until real-world evidence is reviewed.

Workflow: https://github.com/tovannghia27223-png/CANVIO/actions/runs/44747930420

## P145.2 shader verification

The candidate workflow runs standalone/embedded source parity and API tests for the nine transitions, eight shader FX plus the no-effect option, bounded resolution and P79 muxer handoff. Hosted Chromium smoke verifies the Video Engine panel, all transition start/end frames, crossfade midpoint, module checks and PNG download. This exercises WebGL through CI SwiftShader or the documented Canvas2D fallback; it does not certify physical GPU performance, a 60 fps target on mid-range hardware, user-footage visual quality or MP4 H.264 availability on every browser. MP4 output is a short video-only transition segment with no audio.


## P145.4b — Official embedded music preview

- Added standalone/embedded parity and unit assertions for YouTube, Spotify, SoundCloud, unsafe protocol rejection, host/path validation, cue formatting and no-autoplay defaults.
- Added hosted Chromium smoke for Asset Library mounting, saved cue selection, official privacy embed host, sandbox/referrer policy, cue display, stop/teardown and uncaught page errors.
- Limits: no provider network playback is asserted in offline CI; the test validates the generated official iframe URL and local integration only. Provider availability, user account restrictions and actual playback/listening remain manual checks.


## P145.4 local background music composer — hosted candidate checks added

- Unit suite covers four presets, BPM/bar clamps, chord progression, deterministic mood plans, PCM WAV header/format and peak normalization.
- Hosted browser suite renders all four moods with OfflineAudioContext, checks non-silent output, -1 dBFS peak normalization, 4-bar duration at 96 BPM, imports WAV via the canonical Video Engine importer, downloads/decodes WAV using ffprobe, and exercises loop preview/stop.
- This is procedural synthesized music, not a curated/licensed music library. Listening quality, musical suitability and mix review on actual user projects remain manual.


## P125.2 Scroll Storyboard — hosted acceptance

- Unit tests cover caption range clamping, text limit, position/animation allow-lists and drag-order data behavior.
- Chromium test extracts a generated video, opens editor, edits/adds captions, sets position/animation, parallax/easing and exports standalone HTML. It checks scroll mapping, caption settings and reduced-motion fallback.
- P125.1 browser test now follows the two-stage extraction/editor/export flow. Real-project and physical touch/mobile review remain manual.

## P136.2 Bezier smoothing — hosted acceptance

- Unit checks cover optional cubic output, default compatibility, finite/clamped coordinates and preserved layer/loop counts.
- Chromium smoke keeps the existing unsmoothed pixel round-trip baseline and exports a second 65% smooth SVG; checks the slider, cubic paths and script-free safe SVG.
- Review on diverse production artwork remains manual.


## P145.5 Template Factory — hosted acceptance

- Unit checks cover five template types, rendering, XSS-like text escaping, field bounds, palette allow-list, offline output and validated JSON round-trip/rejection.
- Hosted Chromium run #44773327159 passed its candidate workflow, including Template Factory browser coverage for Asset Library mount, presets, escaped preview, local save, standalone HTML export, JSON import/export and local persistence.
- Manual typography/print proof and native Poster/Slide document integration remain open. Browser-local template persistence is not cloud synchronization.

## P131 — export-boundary hardening hosted acceptance

- P67: tested script/iframe/event-handler/javascript URL removal while retaining safe visible text, safe HTTPS links and cleaned inline CSS.
- P145 Content Factory: tested shared P131 key redaction before text/HTML/JSONL Blob creation, fail-closed behavior and redaction count.
- P73 Offline Website: tested final HTML redaction and refusal to package without P131 redactor; package report includes redacted count.
- Source-contract test validates P67/P73/P145 standalone owners and sync configuration. Hosted workflow run #44774969271 passed before the merge-base-only refresh.
- Manual acceptance remains for hostile HTML/PPTX/ZIP importers, archive-bomb quotas on every import route and deployment HTTP CSP headers.

## P136.3 — Single-line Stroke Trace tests added

- Unit suite now checks optional filled Bezier output plus stroke-only output (fill="none"), rounded line ends, reduced skeleton pixel count, stroke-width clamp and invalid-input rejection.
- Hosted Chrome suite runs existing filled trace round-trip, checks Bezier export, then selects Stroke mode, verifies preview/status and downloads a static open-path SVG without filled colour layers.
- Synthetic fixture demonstrates the code path on high-contrast artwork only; complex illustrations, photographs, handwriting and print production remain manual review items.

 
## P132.2 APNG — automated coverage added
- Unit checks cover PNG signature/IEND, APNG frame/play counts, sequence layout, IDAT/fdAT placement, CRC-32 on every chunk, frame delay and invalid/oversize rejection.
- Hosted Chromium test downloads both GIF and APNG from the Video Engine UI; FFprobe checks codec, width and decoded frame count for each.
- Synthetic timeline fixture only. Real timeline footage, transparency gradients, long animations and memory/performance on ordinary devices remain manual.


## P127.2 — Caption-guided Director hosted acceptance

- Node checks cover subtitle cue filtering, pause-boundary analysis, valid/invalid clip selection and bounded motion/keyframe output.
- Hosted Chromium test imports a generated 5-second WebM with deterministic 440 Hz audio bursts separated by silence, seeds caption cues, verifies the pause report, applies/persists punch-in keyframes, runs the canonical AutoCut route and checks Undo availability.
- The synthetic audio fixture is a deterministic UI/code-path test only. Whisper transcription accuracy, real speech, face tracking, multi-speaker editorial decisions and human review on project footage remain manual acceptance.


## P125.4 — Split-asset ZIP acceptance (rebased to current main)

- Added a dedicated Node suite for P125.1 source/embedded parity, allow-listed relative image paths, unsafe-path fallback, manifest creation and separate binary image entries.
- Added hosted Chromium acceptance using a generated synthetic WebM. The test exports ZIP, checks ZIP integrity and image signatures, extracts the package and opens the HTML via file://, scrolls to the last frame and waits for its relative image to decode (naturalWidth > 0).
- The current 1–50 MB control is explicitly documented as an encoded-frame data budget. Final ZIP bytes are reported separately; manifest records frame bytes and package structure.
- Hosted runtime run #271 (2026-11-20, GitHub Actions run 44798663309) passed the P125.4 Node package suite (14 assertions) and Chromium acceptance. Browser checks passed ZIP integrity, manifest/README presence, separate image files and image signatures, relative frame references, final-frame scroll and final relative-image decode; no page errors were reported. This later run supersedes the initial #255 confirmation. The synthetic WebM/desktop browser scope does not replace real-media/mobile acceptance.
- Manual acceptance remains for real user footage, audio requirements, mobile/touch controls and large-file memory/performance.


## P145.6–P145.10 — Asset Library candidate test plan (rebased to current main)

- P145.6 Node/browser tests: 25 icon catalogue and unique IDs, category/search, preview, safe standalone SVG, sprite and contact sheet; verifies no remote assets and no uncaught page errors.
- P145.7 Node/browser tests: six presets, numeric bounds, local font support reporting, CSS output without remote fonts, live preview and physical Playwright mouse clicks on Apply/preset controls. The card is intentionally excluded from the global `.card` tilt observer.
- P145.8 Node/browser tests: eight illustrations, four categories/themes, SVG palette resolution, category/search, preview, individual export, sprite and contact-sheet output.
- P145.9/.10 Node/browser tests: shared license/source/size/hash gate, duplicate hash behavior, search/type/status filters, read-only behavior and local provider fixture.
- Root-cause history: run #263 failed P145.7 because the global MutationObserver tagged every `.card` under `#page-assets` with `data-tilt`; pointer movement rotated the typography panel and caused the real Playwright click to be intercepted. A z-index-only patch failed. Current branch removes the `.card` class from the P145.7 shell and the regression test asserts no `data-tilt`/transform while still using a physical click.
- Status: hosted runtime run #298 (`44800999215`) completed success on the current-main rebase. P145.6 9/9, P145.7 7/7, P145.8 11/11, P145.9/.10 8/8 Node suites passed; the four Chromium suites returned `failed: []` and `pageErrors: []`.
- Live vault boundary: browser fixtures use a test provider. Production asset listing and hash coverage are not certified until a canonical live provider is wired and reviewed.


### P145.6–P145.10 — prior hosted run #276 evidence (2026-11-20)
- Superseded pre-rebase branch run #276 (`44799265880`) completed success. Node suites passed: P145.6 9/9, P145.7 7/7, P145.8 11/11 and P145.9/.10 PASS. All four hosted Chromium suites returned no failed assertions and no uncaught page errors.
- P145.7 specifically passed the real Playwright pointer interaction after replacing the `.card` shell with the dedicated `cv1457-card` wrapper. This confirms the global tilt pointer-interception fix on that branch.
- The newer current-main run #298 includes the P145.9/.10 insertion-order correction after P145.8 and supersedes this historical pre-rebase result.


### P145.6–P145.10 current-main hosted QA — run #298 (2026-11-20)
- Workflow #298 (`44800999215`) completed success (all 33 job steps closed; commit-on-branch is skipped for pull_request events by design). Candidate restoration, source/module integration, Three.js r187 and P85 SHA manifests, module extraction, full HTML/inline-JS audit, P47–P70 regression suites and P107 portable ZIP tests passed.
- Node results: P145.6 9/9, P145.7 7/7, P145.8 11/11, P145.9/.10 8/8.
- Chromium results: P145.6 icon preview/search/download/sprite/contact sheet; P145.7 system typography presets, live controls, CSS export and real mouse interaction; P145.8 eight illustration cards/theme/search/vector exports; P145.9/.10 read-only search, provider fixture, license/hash gate and filter behavior. All four suites reported `failed: []`, `pageErrors: []`.
- Same-origin GLB Draco/Meshopt/KTX2, P85 runtime and synthetic P80 Whisper/P102 ORMBG/P105 Depth Anything ONNX worker inference completed successfully. This validates execution plumbing on synthetic data and CI renderer only, not production model accuracy or physical GPU/performance.


## Main-branch consolidation — PR #32 and #33 (2026-11-21)

- PR #32 merged P125.4 to `main` (merge commit `0f485fcfbdcc19cc19acf09320ee90eaefd46e17`). Hosted run #271 (`44798663309`) passed 14 Node assertions and the offline Chromium ZIP round-trip, including the final relative-image decode check.
- PR #33 merged P145.6–P145.10 to `main` (merge commit `4f56fcb002e4ef9f10c08b7fc920c50457ecc6e1`). Hosted run #298 (`44800999215`) passed P145.6 9/9, P145.7 7/7, P145.8 11/11, P145.9/.10 8/8; all four Chromium suites had `failed: []` and `pageErrors: []`.
- Current post-merge main build commit: `782aa562f5341172330d114ccb21a3269efbbb37`. Mainline workflow #282 (`44799501341`) concluded success. The candidate-branch commit step was skipped because the run was PR-triggered; it is not counted as a failure.
- Remaining non-automated scope: canonical live Asset Vault provider coverage/hash verification, real user media, mobile/touch, OS font/print review and the fourteen P70 production acceptance gates. None is certified by synthetic CI fixtures.

## P132.3 Animated WebP — corrective verification in progress (2026-11-21)

- Original run #300 (`44804824106`) failed only at the WebP browser assertions: the test interpreted RIFF chunks as size-then-FourCC instead of FourCC-then-size; ffprobe recognized the WebP codec but did not provide dimensions or frame count. GIF/APNG and all P145 browser suites in that same run passed with no page errors.
- Corrective branch fixes RIFF chunk parsing, validates RIFF byte length, VP8X animation/canvas flags, ANIM and exactly ten ANMF chunks, checks each frame contains a VP8/VP8L image subchunk with matching dimensions and positive duration, and asks Chromium `createImageBitmap` to decode the downloaded WebP.
- The test derives expected output height from the actual `#vtCanvas` aspect ratio. ffprobe output is retained as diagnostic metadata only, not used as a pass/fail check where the runner cannot report animated WebP frame count.
- Status: implementation and browser test are rebased to current main; corrected hosted result pending. Do not mark P132.3 accepted until the full hosted workflow succeeds.


### P132.3 run #303 diagnosis
- The corrected parser verified valid RIFF size/chunk traversal, VP8X animation flag, ANIM, 10 ANMF frames, 10 VP8 frame payloads, dimensions 200×113 and 200 ms per frame. Chromium `createImageBitmap` returned `ok:true`, width 200, height 113; no page errors.
- CI failed only because `webpChromiumDecoder` still compared height with 200 instead of the already-derived `expected_height` (113). That assertion is corrected. ffprobe logs “image data not found” and width 0 for WebP on this runner, while Chromium decodes it; ffprobe is no longer a required pass/fail check. Corrected rerun pending.


## P132.3 final verification — hosted run #304 PASS (2026-11-21)

- Corrected candidate on PR #36 completed workflow #304 (`44809678883`) with job `verify` conclusion `success`; browser/runtime acceptance passed.
- WebP checks: download/status/button reset, RIFF+WEBP signature and declared RIFF size, chunk walk and padding, VP8X animation flag/canvas dimensions, ANIM, exactly 10 ANMF frames, each with VP8 payload, 200×113 per-frame dimensions, 200 ms delay and Chromium `createImageBitmap` decode all true. Browser report ended with `pageErrors: []` and `failed: []`.
- GIF and APNG controls, signatures and decoding also passed. Workflow-wide HTML/JS audit, P47–P70 regressions, integrated source contracts/P107 ZIP round-trip, vendor SHA verification, compressed GLB fixtures and same-origin P85/ONNX/worker browser acceptance passed.
- Hosted artifact `CANVIO-23.3.111-GITHUB-RUNTIME-VERIFIED-304` uploaded (21,573,301 bytes). Human acceptance still needed for actual footage, alpha/color profile, mobile browser support and long-form memory/performance; P70 remains uncertified.


## P145.10 — local Asset Library SHA-256 (rebased candidate; 2026-11-21)

- Confirms native local owner `CV.assets.list()` / `CV.assets.addBlob()` and existing `LS('assets')` persistence; earlier wording that the provider itself was missing is corrected.
- Adds manual byte-level SHA-256 for base64 data URLs. Results are session-only and passed into the shared quality gate; no asset mutation or metadata write.
- Bounded at 40 rows, 25 MiB per file and 64 MiB aggregate. Unsupported or over-budget items remain unverified. No network/upload/background scan.
- Original PR #37 run #305 (`44811157725`) passed full hosted runtime and Chromium acceptance. Rebased current-main run pending.



## P136.4 — SVG pattern fill test coverage (candidate; 2026-11-21)

- Added six local SVG pattern fills (dots, diagonal, grid, cross, wave, checker) per traced colour layer; default none preserves the prior vector SVG. Pattern is disabled in single-line Stroke mode.
- Node test suite extends CVTraceP136.tests() while retaining standalone/embedded parity; assertions cover exact default output parity, one local pattern definition/reference per colour path, static/self-contained SVG and invalid preset fallback.
- Hosted Chromium test exercises the actual Image Studio control, downloads SVG, checks defs/pattern and local fragment references, awaits preview decode, and verifies single-line Stroke remains usable with pattern disabled.
- Status: source and test changes are on work/p136-pattern-fill-20261121; hosted workflow result pending. Do not mark accepted until both Node and Chromium checks pass.



## P136.4 — final hosted verification PASS (run #312, 2026-11-21)

- PR #39 merged at `1eb4129f4252b31c41f819d23f1cd9dd02948d68`. Workflow #312 (`44813838108`) completed success; 33 steps, no failures.
- Node P136 tests and Chromium pattern-preview/download checks passed. Full workflow also passed source extraction/syntax, complete HTML/inline-JS audit, P47–P70 regression, integrated source contracts, genuine P107 ZIP round-trip, pinned Three.js r187/Draco/Meshopt/KTX2 and P85 vendor checks, and same-origin GLB/P85/ONNX worker browser acceptance.
- Artifact `CANVIO-23.3.111-GITHUB-RUNTIME-VERIFIED-312` uploaded at 21,583,636 bytes. Browser uses software SwiftShader, not physical GPU; model inference workflow_dispatch tests were not run. P70 remains blocked with 14 manual gates pending.

## P131.3 — Safe HTML import candidate (2026-11-21)

- Standalone security hub adds bounded `prepareHtmlImport` and async `importHtmlText`; local user file picker restricted to .html/.htm and text/html/application/xhtml+xml. Hard cap 5 MiB.
- Uses existing allow-list sanitizer, removes remote image/source URLs but keeps local raster data URLs, strips active HTML and confirms before adding to current Website Engine. Uses only `CVWeb.addComponents` and `CV.engines.web.save`.
- Workflow explicitly syncs standalone/embedded lot before P131 parity tests. New browser assertions cover safe content, removed scripts/handlers/forms/iframes, remote asset stripping, save result, save failure reporting and actual file picker path. Hosted result pending; do not merge until full P131 workflow passes.



## P131.3 — final hosted and mainline verification PASS (2026-11-21)

- PR #41 merged at `1ac185d7aea7b14ad13a0517f51e72292cc42162`; workflow #315 (`44816184861`) completed success. P131 Chromium suite: 31 passed, zero failures, zero page errors. P131 app smoke: 21 passed across 48 pages, no console/navigation errors.
- Mainline push build commit `4fdaae3219cde7ebc6c4c9358bf40b3d57812f16` wrote generated `index.html` and Manifest. The main blob was re-read and verified to include P131.3's `prepareHtmlImport`, version `131.3.0` and **Nhập HTML an toàn · Website Studio** action. Manifest index SHA-256 `e419b50f1bd459201ad19d94f6a2cd5ea08c03b539be3c0a3b7899b8b925a7ac`; bytes 5,358,886; 237 files.
- All P131 browser assertions passed: dangerous active elements and unsafe attributes removed, Vietnamese content and normal hyperlinks retained, local base64 raster retained, remote image source removed, cap enforced, canonical Website Engine add/save used, imported script not executed, no remote image request, save failure warning, actual file-picker flow.
- Run #315 also passed full source/syntax, HTML/inline-JS audit, P47–P70 regressions, integrated source contracts/all Node suites, P107 ZIP round-trip, pinned Three.js r187/P85 vendor manifests, compressed Draco/Meshopt/KTX2 GLB runtime, OpenCV Lucas–Kanade, and full Chromium browser smoke. SwiftShader software rendering was used, not a physical GPU; full model inference was not performed.
- Artifact `CANVIO-23.3.111-GITHUB-RUNTIME-VERIFIED-315`: 21,590,752 bytes; SHA-256 `12305d7990ed16b93d6d653cd3fd1d662a3cd90144b9800773e560a5a55fa06c`.
- Previous “P131.3 pending/candidate/main-index promotion pending” entries are superseded by this PASS. P70 remains fail-closed with 14 manual gates pending and release certification false.

## P145.10 — hosted mainline verification (run #310, 2026-11-21)

- PR #38 merged as `c0ee9749dbfda84abcf43466a034dfa5539222c9`. Hosted workflow #310 (`44812233871`) completed successfully.
- Node P145.9/.10: **10/10**. Chromium P145.9/.10: **14/14**, `failed: []`, `pageErrors: []`. Browser assertions confirmed the default native provider is `CV.assets.list()`, the panel lists real local-provider fixture rows, shared Quality Gate status/search/type filters work, computed SHA-256 is 64 lowercase hex characters, duplicate detection uses local bytes, transient hashes do not mutate vault records and the module remains read-only.
- Full verify job also passed candidate source restoration, integration of P125/P136/P145/P127/P131/P132 modules, source extraction and syntax checks, full HTML/inline-JS audit, P47–P70 regression suites, source-contract tests, P107 strict ZIP round-trip, Three.js r187/P85 manifest SHA checks, compressed Draco/Meshopt/KTX2 GLB runtime fixtures, same-origin P85/ONNX worker/browser acceptance and app smoke. The PR-only commit-to-feature-branch step was skipped by design.
- Artifact `CANVIO-23.3.111-GITHUB-RUNTIME-VERIFIED-310`: 21,579,190 bytes; SHA-256 `302274465126dec415716d796981168ed96fc0d2091514581725557e67a22843`.
- Bounds: explicit user-triggered local scan; only eligible local base64 data URLs; hashes session-only; 40 rows / 25 MiB per asset / 64 MiB aggregate. Unsupported, unavailable-Web-Crypto and over-budget entries remain unverified. No remote/cloud inventory or cross-device sync is verified.
- P70 remains fail-closed with fourteen real-world gates pending. SwiftShader/software rendering, synthetic media and fixture contexts are not physical GPU, production media, accessibility or release certification.

## PR #44 documentation reconciliation — hosted workflow #320

- Workflow #320 (`44859258258`) completed successfully. The verify job finished with `conclusion: success`; module integration, Node test utilities, vendor provisioning, extraction/syntax, full HTML/inline-JS audit, P47–P70 regression, source contracts/P107 ZIP round-trip and same-origin GLB/P85/ONNX/worker Chromium acceptance all passed.
- The workflow refreshed the Guide/Roadmap/QA/Acceptance Matrix/Manifest in the candidate workspace and uploaded `CANVIO-23.3.111-GITHUB-RUNTIME-VERIFIED-320`: 21,602,814 bytes; SHA-256 `74cb03f31a7c55d94f69376b74f46a22bef1538b473aeca1165c42296f2e69ba`.
- PR-only commit step was skipped by design; the CI artifact is verification output and does not imply every backlog item is implemented.
- P122.3 MCP, P124 Auto Layout/Component, P133 OPFS/proxy and P143 full code split have no source/test owner in the current main tree; P144 overlaps P109's existing palette and needs scope parity review. P130 remains blocked on real backend/RLS/two-device infrastructure.
- P142 Pages deployment main run #192 (`44819441586`) passed build, report and deploy jobs; real-origin/browser/physical-device matrix remains manual.
- P70 remains fail-closed with 14/14 real-world gates open.

## Consolidated candidate — P124 / P133.2 / P144.3 (2026-11-21)

- P124 responsive Auto Layout; P133.2 4K-to-720p local proxy; P144.3 contextual Studio help are staged together on work/canvio-p124-p133-p144-final-20261121.
- Hosted workflow integrates all three modules and runs Node/Chromium tests; P133 proxy also uses ffmpeg/ffprobe decode validation.
- Disposition: pending hosted CI. Advanced P124 editor controls, remaining P133 OffscreenCanvas/OPFS migration, and human accessibility/real-media acceptance remain open.


### P133.2 QA correction — CI #347 (2026-11-21)

- First hosted Chromium run successfully generated a 1280×720 WebM, preserved Opus audio, fully decoded the file and confirmed the original clip remained unchanged.
- It caught an actual integration race: the UI did not await the asynchronous Video Engine importFiles() promise, so the proxy download existed but the new timeline clip was not yet present when reported. Updated the module to await importFiles(), verify clip-count increase and retain the download link if timeline ingestion fails.
- CI must be rerun on the corrected commit; no proxy acceptance/merge claim until timeline import passes.


### P144.3 route-coverage correction — CI #354 (2026-11-21)

- Hosted Chromium confirmed the workspace registry contains 38 routes, not only the 25 initially covered. It identified 13 missing help topics: templates, brand, designSystem, responsive, collab, hub, platform, one, promptForge, insight, hallmark, guide and shield.
- Added page-specific guidance for all 13, using Guide-documented behavior and explicit boundaries (e.g. collab is local notes/activity, Prompt Forge is prompt handoff, Shield does not certify server headers).
- P133.2 passed all 11 Chromium checks in the same run, including actual timeline import, clip duration, audio, full decode and original preservation. P124 passed 9/9.
- Rerun required to verify all 38 CVWS routes have contextual help; no merge claim until that coverage check passes.

## 2026-11-21 mainline regression after PR #51

- Main commit e4e3647b8b49dcc931065c3f7893f68b48d9a071; hosted workflow #362 completed PASS 39/39. Candidate run #360 also PASS 39/39.
- P124 Auto Layout Chromium acceptance: 9/9 (preset panel, 5 controls, 4 variants, responsive grid insert, selected variant, canonical save, save failure reporting, mobile viewport and no page errors).
- P133.2 proxy acceptance: synthetic 4K source imported, proxy added as a second timeline clip, original preserved, 1280×720 WebM, Opus audio, complete ffmpeg decode, zero page errors.
- P144.3 F1 contextual help: 38 registered CVWS routes, 0 missing; focus trap/Escape and shortcut tests pass.
- P70 is still NOT certified. Fourteen manual gates listed in §7 remain open.

## P143 Phase 1 — current-main candidate

- Branch work/p143-parity-current-main-final-20261121 is based on main 6481d83 and runs the 20-module standalone/embedded source parity gate before the full HTML audit.
- Prior candidate #363 passed 39/39 including the parity gate and same-origin browser acceptance. Current-main CI pending.
- Full P143 source split remains open.


## P134.2 WebM duration measurement correction — candidate

- Hosted run #371 showed the previous test divided video frame count by inaccurate `r_frame_rate=60/1` because WebM format duration and `avg_frame_rate` were missing. It recorded 2.05 s for output whose expected length is ~4.1 s; all other P134 checks (moving subject, 720×1280, audio, full decode, local-only, preview) passed.
- The test now measures video packet PTS span plus median packet duration and emits packet diagnostics. The 3.5–4.5 s assertion remains unchanged. Latest-main rerun #373 pending.
## P143 Phase 2 — inline script inventory gate (candidate)

- Hosted workflow runs tests/p143/build-inline-source-inventory.cjs after integrations and before full HTML/JS audit.
- Generates tests/p143/inline-source-inventory.json for all canonical script tags in execution order; the report is included in the source ZIP and evidence artifact.
- Records script identity/attributes, bytes, SHA-256 and heuristic global references. This is not a semantic dependency graph or CSS/template inventory. Current hosted result pending.

## Final hosted verification — 2026-11-21

- PR #54 candidate run #384: SUCCESS 41/41. Mainline merge run #385: SUCCESS 41/41. Pages #222: SUCCESS build, deploy and report.
- P143 parity gate: 20 standalone modules have exactly one canonical inline lot, syntax and normalized content parity pass. Complete script inventory committed: 150 tags, 150 inline, 0 external src, 0 module/async/defer, 147 script IDs, 0 duplicate IDs. Canonical HTML size 5,459,631 bytes.
- P134 Auto Reframe: 123 video packets, measured duration 4.063 s using PTS, within unchanged 3.5–4.5 s assertion; 720×1280 VP9 + Opus, full decode, moving subject tracking, local-only and no page errors.
- P133.2 Proxy: 4K fixture imported; timeline contains source and proxy; proxy duration 3.008 s, 1280×720 VP9 + Opus, full decode; source unchanged, no page errors.
- P124 Auto Layout: Chromium 9/9, mobile viewport without overflow, canonical save and save-failure reporting.
- P144.3 contextual help: all 38/38 CVWS routes have tips; palette, keyboard, F1 focus trap/Escape and first-run tour pass.
- P133 resilience: OPFS 3 MB round-trip, path traversal rejection, crash banner, restore and settings pass. P133 denoise Worker parity maxDiff=0 and UI remains responsive.
- P70 release disposition remains NOT CERTIFIED. Fourteen real-world gates in the original QA section are OPEN; hosted fixtures do not replace target hardware/media, provider, accessibility, hosting-header, cross-origin restore or operations evidence.


## P143 parity extension — 27 module candidate (2026-11-21)

- Central parity map expanded from 20 to 27 standalone/embedded module pairs, adding P127 Loudness/Templates, P133 Resilience, P134 Scopes, P138 Denoise, P140 Charts and P145 SFX.
- Each added module already has an individual source/embedded parity suite; central P143 gate now includes them. No runtime behavior change.
- Hosted run pending. Full script/style dependency DAG and project-wide extraction remain open.

## Final QA — 2026-11-21 after PR #55

- Candidate workflow #386: **SUCCESS 41/41**. Mainline workflow #387: **SUCCESS 41/41**. Pages #224 and #225 completed successfully.
- P143 source/embedded central parity: **27/27 passed, 0 failed**. Includes the seven new source pairs listed in the tracker.
- P143 canonical inventory: HTML 5,459,631 bytes; 150 script tags, all inline; 0 external src, 0 module/async/defer; 147 unique IDs; 0 duplicate IDs. Inventory committed at `tests/p143/inline-source-inventory.json`.
- P134 Auto Reframe: 123 video packets; measured duration 4.076 s from packet PTS, within unchanged 3.5–4.5 s assertion; VP9 720×1280 + Opus, full decode, moving-subject tracking, local-only, no page errors.
- P133.2: 4K synthetic input imported; timeline holds original and proxy; 1280×720 VP9 + Opus; 3.008 s proxy duration; full decode; original unchanged and no page errors.
- P124 Auto Layout: Chromium 9/9, mobile viewport without overflow, canonical save and save-failure reporting.
- P144.3: 38/38 CVWS route help; palette, keyboard, F1 focus trap/Escape and first-run tour pass.
- P133 resilience and denoise Worker acceptance pass (OPFS round-trip/recovery; Worker matches main-thread output with maxDiff=0 and page responsive).
- **P70 remains NOT CERTIFIED**: fourteen real-world gates are still open. Hosted fixtures do not prove physical target hardware, production provider, all media, screen-reader/accessibility, security headers, cross-origin restore or release operations.


## Follow-on engineering candidate — 2026-11-21 (P124.2 / P133.3 / P143.3)

Status: pending hosted PR verification. Do not treat this section as a PASS report.

- P124.2: source now exposes five layouts, four surface variants and configurable title/description/gap/minimum-width/mobile/tablet breakpoints and column counts. Node suite updated to 16 module checks plus direct CSS and save-path assertions; Chromium suite updated to 12 UI checks.
- P133.3: proxy scaler attempts a same-origin Blob Worker with OffscreenCanvas and ImageBitmap transfer; it falls back to main-thread canvas when unavailable or failed. Browser acceptance now explicitly expects renderPath === 'offscreen-worker' in hosted Chromium and checks fallback API, 720p dimensions, audio, full decode, source preservation and timeline insertion.
- P143.3: new style/template/dynamic-loader report generator and validator are wired into the candidate workflow and artifact. CSS/global dependency candidates are heuristic, not semantic.
- No hosted test result has been observed for this branch at the time of this note. First candidate workflow must be inspected before merge. P70 remains uncertified; its fourteen real-world gates are deferred, not passed.



## Verified update — 2026-11-21 — P124.3

- PR #63 (selected Website Engine component responsive breakpoints) merged to `main` as `ed6679faec689483db62eb718aa55e068866618b` after hosted candidate workflow run #444 succeeded.
- Hosted Chromium evidence: P124 UI interaction **15/15**; selected component received a scoped class, desktop/tablet/mobile rules were written through GrapesJS CSS Manager, canonical `CV.engines.web.save()` was called, save failure was surfaced, mobile viewport had no overflow, and page errors were zero.
- The workflow also completed its existing regression/runtime steps successfully, including the P133.2 proxy and P133.4 OPFS checks in run #444. This does not close remaining P124 advanced component editing or P133 migration work.
- PR #64 P135.1 is NOT merged: its hosted run #467 failed at the unrelated P133.2 proxy gate with UI status `Tạo proxy vượt thời gian cho phép.`; no page errors were reported. Its head is now non-mergeable against the updated main and must be rebased/cleaned before another acceptance run. Do not mark P135 complete.
- PR #65 is a duplicate/stale P139 candidate (mergeable=false; no hosted run). PR #66 is the clean P139.1 candidate stacked on the P135 branch (no hosted run yet); keep P139 partial and do not merge before the P135 base is accepted.
- P135.1 remains a partial non-destructive adjustment stack; reload persistence, masks/local corrections, smart objects, clone/patch and liquify remain open. P139.1 remains partial; precomp, physical motion blur, word/range selector, expanded keyframe editor and real-project/export acceptance remain open.


## Verified mainline QA — P133/P135 — 2026-11-21

- P133 branch #67 CI run 44911472539: 44/44 passed; P135 branch #68 CI run 44911475373: 45/45 passed; post-merge main run 44912553516: 45/45 passed.
- P133 browser fixture acceptance exercised a 4K-to-720p proxy, OffscreenCanvas Worker path, independent bitmap-capture watchdog, fallback availability, video end handling, output WebM streams/full decode and timeline insertion while preserving the original clip.
- P135 Node/Chromium checks exercised nine adjustment types, ordered stack behavior, enable/disable, rename/reorder/delete/reset, stack undo/redo, derived-canvas export and Asset Library handoff. Original raster remains unchanged.
- P135 persistent editable stack state is not claimed: source document remains flattened PNG; adjustments reset on reload/new image. Masks/local adjustments, smart objects, clone/patch and liquify are not covered.
- CI uses a generated short synthetic video and headless Chromium. This is not long real-footage compatibility, real multi-hour export, physical GPU throughput or cross-device acceptance.


## P139.1 live renderer adapter QA

Automated checks validate source/embedded parity and the existing Motion Lab canvas render path. The browser acceptance creates a real text layer, adds a Null parent, applies an animator, compares rendered PNG output with the animator enabled/disabled, and confirms object metadata survives the existing Motion Lab snapshot/restore. This validates adapter execution in headless Chromium, not physical GPU frame-rate performance, production footage quality, complex font shaping, precomp or motion blur.


## Verified P120/P126 QA — local ComfyUI connector — 2026-11-21

- Hosted workflow run #44914277311 passed 48/48 after clean-main PR #73 merge. Browser mock server confirms successful workflow completion, optional media upload, explicit prompt/media node replacement, ComfyUI queue/history polling, output retrieval, Asset Library handoff and download link; zero page errors.
- API boundary checks enforce local loopback origin only, API workflow graph validation, node/input allowlists through user-selected fields, bounded payload/file sizes and bounded polling.
- Not tested: actual ComfyUI process, model/custom-node availability, free model licensing, GPU/VRAM pressure, real inference speed, image/video quality, CORS configuration on the user's PC or browser local-network prompt. These remain real-environment acceptance.


## P120/P126 ComfyUI connector hosted checks

Candidate CI runs Node contract/security tests and Chromium against a local mock ComfyUI server. The checks cover loopback URL restrictions, API workflow JSON validation, bounded node/input overrides, /system_stats connection, optional file upload, /prompt submission, /history polling, /view retrieval, output caps and Asset Library addBlob handoff. This verifies connector plumbing only; no actual ComfyUI installation, GPU inference, model accuracy, RIFE or Real-ESRGAN output quality is certified.

## P137.2 character/table style QA

Hosted Node and Chromium checks cover five named character styles, three table presets, selection inside one paragraph, persisted data-cv137-char/data-cv137-table metadata, inline styles and restyleHtml reapplication. Table rows/cells are not replaced and use the existing Layout Foundry page HTML owner. Cross-paragraph character selection and advanced table editing remain out of scope.

## P119.2 shared easing transition QA

Hosted Node tests load both P119 and P145.2 and verify actual preset/custom curve resolution. Hosted Chromium checks the P145.2 easing selector and compares the output frame at equal raw progress with linear and custom P119 curves, verifying that the derived easing value affects both renderer paths. Video Engine clip/keyframe easing and Website Engine motion remain unverified and are not part of this increment.

## P135.2 editable project snapshot QA

Node tests round-trip the private PNG tEXt metadata and enforce CRC/version/safe layer limits. Hosted Chromium applies a non-destructive adjustment, confirms the underlying PNG snapshot bytes are unchanged, restores the stack using the existing Pixel restoreState() API, then reloads and restores the saved snapshot again. The test verifies ordered layer values and preview filter state with no page errors. It does not certify independent cloud sync or third-party PNG re-encoding.


## Verified hosted mainline — P137.2 / P119.2 / P135.2 — 2026-11-21

- P137.2: PR #76 candidate #534 and post-merge #535 passed 51/51. Chromium verified character/table controls, application and rehydration.
- P119.2: PR #78 candidate #536 and post-merge #538 passed 52/52; P119/P145.2 Node suites passed and Chromium confirmed eased progress changes the actual transition frame. Pages #271 passed.
- P135.2: PR #81 candidate #547 and post-merge #549 passed 53/53; Node PNG metadata/CRC checks and Chromium snapshot→reload→restore suite passed with zero page errors. Pages #273/#274 passed. P143 parity after P135 registration: 32/32.
- Limits: software Chromium does not certify physical GPU/image performance; P135.2 ancillary PNG metadata can be stripped by third-party re-encoding and does not prove two-device/cloud sync. P70 remains blocked with 14 manual gates.

## P143.4 candidate QA — lexical global-reference evidence — 2026-11-21

- Candidate adds static lexical evidence only; scanner fixture and generated dependency map will be accepted only after current-main hosted CI. It is not an AST or semantic runtime dependency graph and does not change application execution order.


## Verified hosted mainline — P137.2 / P119.2 / P135.2 — 2026-11-21

- P137.2: PR #76 candidate #534 and post-merge #535 passed 51/51. Chromium verified character/table controls, application and rehydration.
- P119.2: PR #78 candidate #536 and post-merge #538 passed 52/52; P119/P145.2 Node suites passed and Chromium confirmed eased progress changes the actual transition frame. Pages #271 passed.
- P135.2: PR #81 candidate #547 and post-merge #549 passed 53/53; Node PNG metadata/CRC checks and hosted Chromium snapshot→reload→restore suite passed with zero page errors. Pages #273/#274 passed. P143 parity after P135 registration: 32/32.
- Limits: software Chromium does not certify physical GPU/image performance; P135.2 ancillary PNG metadata can be stripped by third-party re-encoding and does not prove two-device/cloud sync. P70 remains blocked with 14 manual gates.

## P143.4 candidate QA — lexical global-reference evidence — 2026-11-21

- Candidate adds static lexical evidence only; scanner fixtures and generated ordering map will be accepted only after current-main hosted CI. It is not an AST or semantic runtime dependency graph and does not change application execution order.


## Verified P143.4 post-merge QA — 2026-11-21

- Mainline #551 passed 53/53 and Pages #275 passed. P143 parity 32/32, scanner fixtures 14/14, inventory validation 17/17; 119 style blocks, 1,490 inline style attributes and 78 dynamic-loader sites. Its 456 lexical edges are candidates only; 33 references remain unresolved.

## P119.3 candidate QA — Video Engine shared keyframe easing

- Node tests verify the six P119 presets, curve matching, native custom-Bezier field mapping, Motion cubic-bezier import and rejection of linear() spring strings. The source is a UI adapter only; it creates no second timeline/store.
- Hosted Chromium uses a real image clip through CV.engines.video.importFiles(), applies a preset via the existing keyframe inspector and native Apply path, checks motionAt against CVEasingP119.bez, round-trips the existing Video Engine snapshot, then imports a Motion curve. Website CSS timeline and physical GPU/performance remain open until separately verified.

## P119.3 Video Engine easing QA

- Node suite checks the six original P119 presets, custom Motion cubic-bezier parsing, rejection of linear() spring strings, native field mapping and absence of new storage/timeline owners.
- Chromium creates a real image clip on the canonical Video Engine, applies a P119 preset through existing keyframe fields, verifies vMotionAt against CVEasingP119.bez, round-trips the existing snapshot, imports a Motion custom curve and verifies invalid spring import does not mutate the clip.
- Shared evaluator delegates supported legacy curves to P119.bez; curves outside P119's normalisation domain or with greater stored precision retain the previous Video Engine solver. Website CSS timeline and target GPU/performance remain unverified.

## Verified P143.4 hosted mainline QA

Mainline workflow #551 passed 53/53; Pages #275 passed build/deploy. P143 parity 32/32, lexical scanner 14/14 and inventory validator 17/17. The 456 edges are lexical candidates, not semantic runtime dependencies; 33 unresolved reads and 209 same-script references remain visible for human review.

## P119.4 Website Motion shared easing QA

- Node contract suite verifies all six preset options are derived from CVEasingP119.PRESETS, each value is canonical CSS cubic-bezier, arbitrary CSS and spring linear() are rejected, and the module has no independent persistence owner.
- Hosted Chromium verifies the existing Website Motion Builder panel receives six P119 options, a custom cubic-Bezier can be staged from Motion, the existing Apply/Clear callbacks write/remove component attributes/styles and use CV.engines.web.save(), and exported HTML retains the easing CSS variable plus prefers-reduced-motion fallback.
- The browser component is a deterministic GrapesJS-compatible fixture; this is an adapter-contract test, not manual review of an authored user project, deployed publish origin, or physical mobile accessibility.


## P146.1 Home Guided Creative Workflows — candidate test scope

- Node source-contract checks exactly one canonical inline P146 lot, byte-normalized standalone/embedded parity, syntax, five flow definitions, existing destination fields, Shared Core API reuse and absence of a new network/storage owner.
- Chromium acceptance covers five workflow entries, brief prefill through the existing Home prompt, HR Visual and Video Studio handoff, Shared Core ownership and no-overwrite behavior for a non-empty project brief. HR Visual’s optional AI tab is activated only to reveal `#hrPrompt`; the test asserts no Pollinations request and does not click the image-generation action.
- Successful automated checks validate deterministic local routing only; they do not certify content quality, accessibility, physical-device UX or cloud sync.

## P124.4 selected component layout QA

- Node suite checks bounded responsive CSS, whitelisted selected-layout kinds, safe selectors, four design variants, metadata ownership, selected GrapesJS component class/attributes, CSS rule registration and the existing Website save hook.
- Hosted Chromium reuses the P124 UI fixture and tests existing layout insertion/breakpoint flow, then applies Grid and a Surface/Soft variant to the selected component. The component tag/content/child model is not replaced; responsive CSS is scoped through the existing CSS Manager.
- This is automated component-contract/browser evidence, not a manual review of user-authored nested component trees or full drag/resize behavior. Nested variants, visual breakpoint authoring, keyboard/screen-reader and physical-device review remain open.


## P159 Shared Core integration — candidate QA (2026-11-24)
- Node acceptance file: `tests/p159/run-p159-tests.cjs`. It exercises P153 Asset Library insertion/metadata, Core asset linking, project-scoped character/space cards, P156 P128 local handler and Storyboard append/preservation, plus P157 camera preset assignment.
- Hosted workflow now re-embeds standalone P153/P155/P159 modules in canonical `index.html` before P143 parity and syntax audits. Run #688 is pre-embedding and expected to fail parity; run #689 includes the embedding step and is pending at report time.
- No human acceptance claim: migration against an existing browser profile, real panorama footage, global deletion with reused assets, and real Supabase/two-device sync remain separate gates.
