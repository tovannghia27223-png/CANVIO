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
