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
