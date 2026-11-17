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
- Main release workflow [run #46](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44104323930) completed successfully for validation and deployment jobs, including P47–P70 automated regressions, inherited Chromium 43/43, P68–P70 Chromium 16/16, and source promotion.
- Workflow #46 validated candidate head `d14096255e16dfad4ce70260914c837f4bd7dd5c`; the current `main` head is [`3e6be7e`](https://github.com/tovannghia27223-png/CANVIO/commit/3e6be7e2653a1f5d999ece355236a6bf4e8738e5).
- GitHub Pages deployment [run #91](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44104556386) completed successfully for the current `main` commit.

The green workflow/deployment result confirms the hosted pipeline completed. It does not establish real-browser runtime acceptance, real media/Whisper behavior, accessibility, production security headers or the other manual gates listed above. Those remain open pending evidence on the target environment.

## 9. Final disposition

P70 is the CANVIO 1.0 Stable Release Candidate integrated on `main` and deployed through the successful GitHub Pages workflow described above. `window.CANVIOStableRelease.inspect().releaseCertified` remains `false` by design. Fourteen manual gates remain open. Do not label the product CANVIO 1.0 Stable or production-certified until those gates are evidenced, reviewed and approved.


### 2026-11-17 — Latest hosted verification

- CANVIO Node.js 24 workflow [run #46](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44104323930) completed successfully for validation and deployment jobs. The validation job completed every listed step, including exact P70 source verification, retained regression suites, both Chromium smoke suites and source promotion.
- Workflow #46 validated the candidate at head SHA `d14096255e16dfad4ce70260914c837f4bd7dd5c`. The current `main` head is [`3e6be7e`](https://github.com/tovannghia27223-png/CANVIO/commit/3e6be7e2653a1f5d999ece355236a6bf4e8738e5).
- GitHub Pages [run #91](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44104556386) completed successfully for that current `main` head.
- This updates hosted pipeline evidence only. It does not close any of the fourteen real-world acceptance gates or certify CANVIO 1.0 Stable.
