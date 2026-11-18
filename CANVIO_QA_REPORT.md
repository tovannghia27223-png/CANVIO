# CANVIO — Current Integration QA Report (`23.3.108-p85-studio-r2`)

**Candidate:** `23.3.108-p85-studio-r2`  
**Index SHA-256:** `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82` · **Bytes:** 4,921,610 · **PhaseSuite:** `70.0.0` (unchanged)  
**Disposition:** exact-current static/source and synthetic-browser checks pass in their stated scopes. P74/P81/P85 vendor runtime, real model inference, physical GPU, production-origin and P70 real-world acceptance remain OPEN/BLOCKED. This is a local integration handoff, not Stable or deployed.

| Check | Current result | Scope |
|---|---:|---|
| Inline JavaScript | **111/111 PASS** | Exact current index syntax |
| Static HTML IDs | **525/525 unique** | 0 duplicate IDs |
| External script src | **0** | Static shell audit |
| Standalone modules | **21/21 synchronized** | Exact source parity |
| Worker syntax | **3/3 PASS** | Whisper, ORMBG and Depth |
| P74/P81 source contract | **18/18 PASS** | Contract only; vendor runtime absent locally |
| P85 source contract / lazy boot | **13/13 / 10/10 PASS** | Source and boot boundary only; runtime bundles absent |
| P102/P105 worker contract | **19/19 PASS** | Wiring/contract only; real inference NOT RUN |
| P107 portable preset | **14/14 PASS** | v1 compatibility, v2 dimensions, CRC and rollback |
| P97–P101/P104 browser | **35/35 PASS** | Synthetic Chromium editor/media tests |
| P106 browser | **14/14 per mode** | Headless 2D fallback + headed Xvfb/ANGLE SwiftShader software WebGL; not physical GPU |
| Manifest / ZIP | **155/155 + CRC PASS** | 156 ZIP entries including manifest |

P55/P56/P62/P63–P67/P68–P70/P72/P73/P82–P85/P87/P88/P90–P96 browser runs and LibreOffice round-trip are listed in section 28 and the machine-readable exact-current report. The P70 gate continues to fail closed: fourteen real-world checks remain OPEN, `releaseCertified:false`.

---

## Historical P70 / P82 QA detail

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

Workflow pins Node.js 24 and Actions by immutable commit, verifies the exact P70 `index.html` SHA, audits scripts/IDs, runs retained regressions and both Chromium smoke suites. GitHub Pages deploy remains restricted to successful pushes on `main`; PR and manual dispatch validate but do not deploy. A hosted Actions run, repository transfer and Pages deployment have not been observed.

## 9. Final disposition

P70 is a local CANVIO 1.0 Stable Release Candidate. `window.CANVIOStableRelease.inspect().releaseCertified` remains `false` by design. Complete and review all fourteen gates before production approval. No commit, PR, merge, hosted workflow or production deployment is claimed.

---

## 10. Historical P84 candidate verification (`23.3.89-p84` — superseded by P82 addendum)

- Exact `index.html` SHA-256: `3a3c3f6d480aa76744c72ee15607db8a0ef9aebb7cf9145368047fbad66bb946` (4,553,434 bytes). The Node 24 workflow SHA lock matches these exact bytes.
- Workflow YAML parses and now includes the P88 OOXML browser smoke; deployment requires a manual `workflow_dispatch` with `deploy_candidate=true` after a successful build. No hosted run or deploy is claimed.

### Test results

| Suite | Result | Environment / scope |
|---|---:|---|
| P90–P96 + P84/P87 quick actions | **34/34 PASS** | Chromium, opaque `about:blank`, storage shim; Home goal actions, command search, Simple/Full, quick action bars, onboarding and inherited P70 panel |
| P97–P101 + P104 | **35/35 PASS** | Chromium, synthetic timeline and PNG fixtures; preview/apply/undo, estimated word captions, ripple lock behavior, export options, short WebM `canplay` screen, Ken Burns keyframes and one-step undo |
| P87 | **14/14 PASS** | Chromium download + Python ZIP/XML validation; ATS heuristic UI, DOCX ZIP CRC, seven OOXML parts, XML parse, Vietnamese text, table-free document |
| P63–P67 source VM | **18/18 PASS** | Canonical timeline, bridges, ripple/group/snap, tracker, SVG ingestion, Layout Foundry |
| P63–P67 inherited Chromium regression | **43/43 PASS** | Exact current candidate, opaque origin/storage shim |
| P68–P70 source VM | **16/16 PASS** | OBJ parser/package, read-only resource/frame diagnostics, fail-closed release gate |
| P68–P70 Chromium smoke | **16/16 PASS** | Offline OBJ viewer canvas/control, no observed network requests, 375px overflow check, fail-closed 14-gate summary |
| Static source | **95/95** inline JS syntax; **507/507** unique IDs | 0 duplicate IDs, 0 external script `src`, six standalone module copies match inline source, Whisper worker syntax PASS |

### P104 / media limits

- Two PNG fixture files were inserted into the existing Asset Library, selected through the UI and imported through `CV.engines.video.importFiles()`; sequential clip timing, pan keyframes, 0.5s fade overlap and one canonical Undo were verified.
- P104 is local 2D Ken Burns, not AI image-to-video and not depth/2.5D. GIF uses the decoded first frame. Current Video Engine canvas is fixed 16:9; 9:16, 1:1 and subject-aware crop are not certified or advertised.
- P101 synthetic WebM output was 0.5s; browser MIME/duration/canplay validation passed. This is not full-file decode, long-form render, real footage, or A/V sync certification.

### P87 / document limits

- DOCX created as an editable linear single-column OOXML document through existing `CVZip.build()`, with seven package entries. ZIP CRC and XML structure parsed successfully; Vietnamese strings were preserved.
- The ATS score is a transparent heuristic checklist only. It does not simulate or predict any employer's ATS or hiring outcome.
- No desktop Word or Google Docs open-save run was available; fonts are not embedded and pagination remains app/font dependent. Direct PDF export, font embedding/outlining, PDF/X, CMYK and printer proof are still open.

### Environment and remaining acceptance

All browser smoke runs used an opaque `about:blank` origin and test-only in-memory local/session storage shims. They do not certify native IndexedDB persistence across restart, HTTPS headers, deployed worker/model inference, cross-browser behavior, screen-reader/WCAG, real footage tracking, real A/V sync or desktop Office compatibility. The P70 release gate remains **14/14 OPEN**, status `BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE`, `releaseCertified:false`.

### Deployment

Candidate `23.3.89-p84` remains local-only. No GitHub commit, PR, merge, hosted Actions run or deployment was performed. The workflow was revised to prevent deployment on ordinary pushes; deployment now requires an explicit manual workflow-dispatch input after release-gate review.


## 11. Historical P84 direct PDF workflow integration — partial

- Candidate marker: `23.3.89-p84`.
- Poster/Slide quick action and Ctrl+K now invoke the existing `CVLot22.pdf()` export owner instead of sending the user only to Layout Foundry Print. The Layout Foundry browser Print route remains available as a separate command.
- Chromium generated `canvio-thiet-ke.pdf` (**51,213 bytes**) from the current one-page Poster fixture. The file began with `%PDF-1.4`, contained `/MediaBox` and `/Subtype/Image` objects, and was returned as a browser download.
- CV Studio quick bar now surfaces the existing P87 DOCX action; it does not claim CV direct PDF.
- **Quality boundary:** this PDF implementation rasterizes Poster pages to JPEG-backed page images. Text is not selectable/vector and font data is not embedded/outlined. 1×/1.5×/2× are raster-scale options only. PDF/X, CMYK, physical bleed, printer proof and cross-reader acceptance remain OPEN.
- Test results for this candidate: P84 + P90–P96 **34/34**; P97–P101 + P104 **35/35**; P88 **14/14**; P87 **14/14**; P68–P70 source VM **16/16**; static audit **95/95** scripts, **507/507** unique IDs, zero duplicates and zero external script src.
- P63–P67 source VM **19/19** PASS; inherited P63–P67 Chromium regression was rerun against exact candidate `23.3.89-p84`: **43/43 PASS**. P68–P70 Chromium smoke: **16/16 PASS**. Browser origin is still opaque with storage shims.
- P70 remains fail-closed: **14/14** real-world gates OPEN, `releaseCertified:false`. No production deployment or GitHub release is claimed.

## 12. Historical P88 PPTX OOXML structural smoke — `23.3.89-p84`

- `tests/p88/run-p88-pptx-smoke.py` downloaded the existing `#cv-pptx2` output from a synthetic 16:9 Poster document through `CVLot23.pptx(gen)`.
- **14/14 PASS**: current marker/title; existing action/owner; synthetic 16:9 fixture; real `.pptx` ZIP download (15,251 bytes); CRC/member integrity; core package parts; editable Vietnamese DrawingML text; separate `p:pic` plus `ppt/media/` PNG; 16:9 dimensions; no external linked relationship targets; discovered XML/relationships parse; zero uncaught browser errors; zero console errors.
- Environment: Chromium 144, opaque `about:blank`, in-memory storage shim. This is not an Office app run.
- **P88 acceptance remains OPEN** for PowerPoint/Keynote/Google Slides open → edit → save → reopen, real slide deck round-trip, font embedding/substitution, complex animations, speaker notes, theme/master fidelity and representative business/HR decks.
- Latest candidate verification summary: P84/P90 **34/34**, P97/P104 **35/35**, P87 **14/14**, P88 **14/14**, P68/P70 source **16/16**, P63/P67 source **19/19**; static audit **95/95** inline JS, **507/507** unique IDs, zero duplicates/external script src. P63/P67 inherited full browser regression was rerun against this exact candidate: **43/43 PASS** in the same opaque-origin harness.
- P70 gate remains **14/14 OPEN** and `releaseCertified:false`. No GitHub commit, PR, merge, hosted Actions run or production deployment is claimed.

---

## 13. Current candidate P82/P84 vector PDF — `23.3.90-p82`

- Exact source: `index.html`, SHA-256 `7117adc736a448052b8c501c51677bb4e1880a0b03a04b15e9768938011d29e0`, size `4,590,209` bytes. PhaseSuite `70.0.0`; P70 release status still `BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE`, 14/14 gates OPEN.
- P82 module `canvio-p82-p84-vector-pdf.js` is byte-synchronized with the inline script. It reads current page data through `CVPages.pages` and `CV.export.svgString(doc)`; no new document/store/editor owner is introduced.
- Font: bundled Noto Sans Regular TrueType (512,672 bytes) plus SIL OFL 1.1 license. Loaded lazily after explicit export from the same origin; no CDN, paid API or background call.

### Test results on exact candidate
| Suite | Result | Boundary |
|---|---:|---|
| P82 vector PDF | **28/28 PASS** | Chromium 144; 2-page PDF downloaded; PyMuPDF render/text extraction; Poppler pdfinfo parse |
| P84/P90–P96 | **34/34 PASS** | Includes legacy raster PDF and DOCX action bar checks |
| P97–P101/P104 | **35/35 PASS** | Synthetic timeline; P101 only MIME/duration/canplay, not full A/V sync |
| P87 DOCX/ATS | **14/14 PASS** | ZIP CRC and OOXML parse; not Word/Google Docs round-trip |
| P88 PPTX | **14/14 PASS** | OOXML structure; not PowerPoint/Google Slides round-trip |
| P63–P67 source / Chromium | **18/18 / 43/43 PASS** | Synthetic fixtures and opaque-origin browser regression |
| P68–P70 source / Chromium | **16/16 / 16/16 PASS** | Fail-closed gate preserved |
| P48/P49/P50/P55/P56/P57–P62 | **26/26 / 35/35 / 27/27 / 49/49 / 27/27 / 15/15 PASS** | Source regression fixtures |
| Static audit | **96/96** scripts; **508/508** unique IDs | 0 duplicate IDs; 0 external script `src`; 7/7 module sync; TTF/OFL present |

### PDF evidence and limits
- Downloaded test PDF: 2 pages, 539,376 bytes. Extracted Vietnamese text exactly; embedded Type0/FontFile2 Noto Sans; at least three vector shape drawings; gradient appears as native shading resource; one embedded raster image XObject. First page rendered with MuPDF at 715×1011; Poppler `pdfinfo` parsed metadata.
- Text remains selectable/extractable for supported BMP glyphs. The implementation uses individual cmap/glyph mapping and does not guarantee advanced shaping/kerning/ligature fidelity for complex scripts or supplementary code points. OTF/CFF and WOFF are unsupported; bundled Regular font does not preserve original family/weight.
- Basic shapes and gradients are vector; placed images are JPEG raster. Limits: 24 pages, 32 MiB aggregate images, 2 MiB font and 20,000 px page dimension. External image links rejected; use Asset Library import. Same-origin localhost/HTTPS is needed to fetch the bundled TTF; `file://` may block it.
- P82 applies to Poster/Slide; direct CV PDF, PDF/X, CMYK, bleed/crop-box certification, printer proof and production reader/browser matrix remain OPEN. Existing P84 raster PDF remains fallback.

### Environment / release disposition
- Browser suites use Chromium 144 `about:blank` plus test-only storage shims; P82 intercepts the bundled font asset during deterministic smoke. These are not live HTTPS/native IndexedDB or clean-machine tests.
- P70 remains 14/14 manual gates OPEN; `releaseCertified:false`. No commit, PR, merge, hosted Actions run or deployment is claimed.

---

## 14. P87/P88 LibreOffice 25.2.3.2 open/edit/save/reopen

- **P87 DOCX / Writer:** synthetic export opened, edited by adding `CANVIO Writer round-trip verified`, saved as DOCX, closed and reopened. Vietnamese CV text remained intact, inserted marker remained present, and post-save ZIP CRC passed.
- **P88 PPTX / Impress:** synthetic 16:9 export opened, edited by adding an editable `P88 LO OK` text shape, saved as PPTX, closed and reopened. Original Vietnamese title and the new shape remained; slide count 1 and text-shape count 2; post-save ZIP CRC passed.
- Both round-tripped files were exported to PDF and rendered with MuPDF. Visual review: DOCX remained a one-page A4 CV; PPTX remained a one-slide 16:9 layout with the marker placed clear of the title/shapes.
- Report: `tests/office/libreoffice-roundtrip-report.json`; runner: `tests/office/run-libreoffice-roundtrip.py`.
- **Interpretation:** actual LibreOffice Writer/Impress round-trip is PASS for these synthetic fixtures only. This does **not** certify Microsoft Word/PowerPoint or Google Docs/Slides compatibility, real multi-page CV/presentation content, advanced animation/theme/master behavior, or accessibility.

## 15. P82 local HTTP origin attempt — BLOCKED by runner policy

- `tests/p82/run-p82-http-origin-smoke.py` started an actual local HTTP file server and attempted to navigate Chromium to `http://127.0.0.1:<port>/index.html`.
- Chromium returned `net::ERR_BLOCKED_BY_ADMINISTRATOR` before the app booted. The report records `BLOCKED_OR_FAILED_LOCALHOST_ORIGIN` and zero test assertions. This is an environment restriction; it is not a failed PDF-generation assertion.
- P82's deterministic `about:blank` test remains **28/28 PASS** with the same-origin font asset intercepted. Do not claim real localhost/HTTPS acceptance until rerun in an unrestricted browser environment.


---

## 16. Current integration candidate `23.3.103-p102-p105-p107-integration-r1`

### New implementation scope
- P72: bounded GLB 2.0 static geometry parser and self-contained WebGL viewer HTML (CSP `connect-src 'none'`, no runtime dependency). Geometry-only; no material, texture, animation, skinning, morph target or compressed extension support.
- P73: explicit-click website offline packager over Website Engine snapshot + current `CVZip`; bounded CORS resource inlining and fail-closed checks.
- P102: ORMBG Apache-2.0 background removal worker; transparent PNG saved into Asset Library. Inference not run here.
- P103: locally synthesized SFX WAV and current Video Engine effect preset shortcuts.
- P105–P107: Depth Anything V2 Small worker, WebGPU→WASM code path, local depth asset metadata, WebGL 2.5D preview with Ken Burns fallback, WebM export to Video Engine, preset save/reload in existing Asset Library.

### New smoke evidence
- Minimal Chromium synthetic-editor harness: P72 tests all true (GLB v2, triangle/accessor bounds, invalid magic, limits, standalone viewer/CSP), panel mounted.
- P73 tests all true; zero-resource HTML fixture built with CSP `connect-src 'none'`; no external script.
- P103 tests all true; original generated click SFX is PCM WAV, 30,764 bytes, stereo 48 kHz, 0.16 sec.
- P102 contract checks all true; non-image input rejected before worker/model load. Model inference was not run.
- P105/P107 contract checks all true; synthetic Asset Library source/depth preset reload and save succeeded.
- P106: headless Chromium had no WebGL context and exercised the explicit Ken Burns 2D fallback. It recorded a WebM of 4 seconds (385,568 bytes), saved the file to Asset Library and called canonical Video Engine import. This is not evidence of WebGL depth displacement or real model output.
- Minimal harness reported zero page errors. It is not the full app, not HTTPS-origin acceptance and not native IndexedDB persistence.

### Dependencies / licenses
- P102 model: `Orangebot/ormbg-ONNX`, Apache-2.0; runtime Transformers.js 3.8.1 is dynamically imported only after user action. Its model card says it is designed for browser-side background removal and notes limitations on fine hair, transparent objects and complex edges. See [model card](https://huggingface.co/Orangebot/ormbg-ONNX).
- P105 model: `onnx-community/depth-anything-v2-small-ONNX`, Apache-2.0; Transformers.js example uses the `depth-estimation` pipeline. See [model card](https://huggingface.co/onnx-community/depth-anything-v2-small-ONNX).
- npm registry and Hugging Face downloads could not be reached from this environment. No model inference or vendor-bundled runtime is claimed. First use requires network and browser caching is best-effort.

### Remaining known open items
- P74 Three.js upgrade; P81 Draco/meshopt/KTX2 compression; P85 heavy optional libraries remain not bundled. P72 geometry-only viewer is not a substitute for those capabilities.
- P79 WebCodecs path is still silent image/text video-only; P80 Whisper real inference not performed; P102/P105 model inference not performed.
- P107 stores preset metadata on current Asset Library records; Project Vault round-trip and cross-device synchronization are unverified.
- Real WebGL GPU preview, full-app HTTPS worker MIME/CSP, native IndexedDB, actual footage/AV sync, long export, target hardware, accessibility and all P70 release gates still require the separate AI acceptance run.
- P70 remains **14/14 OPEN**, `releaseCertified:false`.


---

# Current integration QA — `23.3.104-p102-p105-workers-r1`

- Candidate index SHA-256: `045aa622a5c7e449fc08fd446e18e94794ad2cdb6894a37ae1f33db9d6f46d2a`; bytes: 4,849,276.
- Inline script syntax: **109/109 PASS**. HTML IDs: **523/523 unique**, duplicate IDs: 0, external script `src`: 0.
- Standalone modules: **19/19 synchronized**. Worker syntax: **3/3 PASS** (Whisper, ORMBG, Depth). P102/P105 worker contract: **13/13 PASS**.
- Source regression rerun: P47 fixtures PASS; P48 **26/26**; P49 **35/35**; P50 **27/27**; P55 **49/49**; P56 **27/27**; P57–P62 **15/15**; P63–P67 **18/18**; P68–P70 **16/16**.
- Chromium browser smoke: P63–P67 **43/43**; P68–P70 **16/16**; P82/P84 vector PDF **28/28**; P87 DOCX **14/14**; P88 PPTX **14/14**; P90–P96 **34/34**; P97–P101/P104 **35/35**.
- P97–P101 WebM export returned null once on an initial attempt; an instrumented run and a clean repeat both passed (35/35). Repeat on the receiving AI's browser/device matrix; this package does not claim a hardware-independent render guarantee.
- Workflow YAML parses with PyYAML; exact-index SHA pin updated to the current index hash.

## Not run / not certified
- P102 ORMBG model download and real background-removal inference were not run.
- P105 Depth Anything model download and real depth inference were not run.
- WebGPU fp16 and WASM inference were not measured on a physical supported device.
- P106 WebGL shader was not run on hardware; headless Chromium smoke used Ken Burns 2D fallback.
- P72 live GLB viewer GPU rendering and P73 full real-site offline dependency closure were not accepted on production pages.
- First model use requires network access to esm.sh and Hugging Face; runtime/model are not vendored.
- HTTPS/worker MIME/CSP/CORS, native IndexedDB close/reopen, real media A/V sync, screen-reader/200% zoom accessibility, Safari/Edge and target hardware remain OPEN.
- P70 fourteen real-world release gates remain OPEN; `releaseCertified:false`. No hosted CI/merge/deploy is claimed.
- P55/P56/P62 browser runners are now wired into the candidate Node 24 workflow; the P72–P107 API smoke is also wired into that workflow. The candidate workflow refreshes and verifies the full manifest after test reports are emitted, then uploads validation evidence as an artifact.
- The candidate workflow remains separate from the current P70 workflow on `main`; its `workflow_dispatch` deployment gate requires explicit `deploy_candidate=true`.

**Disposition:** source integration and the listed synthetic/browser regression suites PASS in their stated scopes. This is a handoff candidate for the separate AI acceptance process, not CANVIO 1.0 Stable.


## 17. Independent recheck — 2026-11-17 (continuation pass)

**Scope:** reran the extracted `23.3.104-p102-p105-workers-r1` delivery archive in the current Node/Chromium environment. This is a verification refresh; application source and `CANVIO_BUILD.version` were not changed.

### Recheck results
- ZIP integrity: `testzip() = None`; 162 archive entries.
- Manifest before refresh: **124/124 files verified**; index SHA-256 `045aa622a5c7e449fc08fd446e18e94794ad2cdb6894a37ae1f33db9d6f46d2a`.
- Static audit: **109/109** inline scripts parse; **523/523** DOM IDs unique; zero duplicate IDs; zero external script `src`; **19/19** standalone modules synchronized; **3/3** worker scripts parse.
- P102/P105 worker contract: **13/13 PASS**; `runtimeInferenceExecuted=false`.
- Source regressions rerun: P47 fixtures PASS; P48 **26/26**; P49 **35/35**; P50 **27/27**; P55 **49/49**; P56 **27/27**; P57–P62 **15/15**; P63–P67 **18/18**; P68–P70 **16/16**.
- Chromium smoke rerun: P68–P70 **16/16**; P82/P84 vector PDF **28/28**; P87 DOCX **14/14**; P88 PPTX **14/14**; P90–P96/P84 **34/34**; P97–P101/P104 **35/35**.
- Additional direct browser API contract checks: P72 **8/8** true; P73 **9/9** true; P102 **11/11** true; P105–P107 **13/13** true. These are API/contract probes, not real GLB GPU, model inference or Project Vault round-trip acceptance.
- No uncaught page errors or console errors in the additional browser probe. Two Google Fonts CSS requests were observed during app boot; this means the app is not fully network-silent at startup even though there are no external script `src` tags and model workers remain lazy/user-triggered. Offline font fallback should be explicitly tested.
- P88 PPTX smoke passed on its separate rerun after the combined command timed out; the separate run completed **14/14**.

### Repository / production boundary checked during this pass
- GitHub `main` latest observed commit: `f681c1239dc56968dde338e1c33aa4b63002665a` (`ci: refresh CANVIO validated source and manifest`, 2026-11-17 15:48:46 UTC).
- GitHub Pages workflow run **#105** (`44118610508`) for that commit completed successfully. The current `main` delivery artifact inspected in the Library is still the P70 `23.3.84-p70` index (SHA-256 `73e97aeb4b538f7e7c828ac740084113574db671206a1a1db0f19a45fb22d45c`), not this 23.3.104 candidate.
- The earlier Node 24 validation workflow run **#54** (`44117502640`) failed at step 24, “Commit validated P70 source and manifest changes”; all preceding test steps completed, but deployment was skipped. A later Pages-only run #105 succeeded for the current `main` commit; it does not validate or deploy the 23.3.104 candidate.

### Still OPEN / not certified
- P102 ORMBG and P105 Depth Anything runtime/model download and real inference.
- Physical WebGPU/WASM performance, P106 WebGL shader on hardware, and P107 Project Vault/cross-device persistence round-trip.
- P72 live GPU rendering and P73 real-site dependency closure on representative websites.
- P74 Three.js upgrade, P81 Draco/meshopt/KTX2 decoders and P85 heavy optional libraries remain deferred/not bundled.
- P70 remains **14/14 real-world gates OPEN**, `releaseCertified:false`. The 23.3.104 candidate has **not** been committed, merged or deployed to `main` in this recheck.

**Disposition:** automated source and the listed synthetic Chromium checks passed in their declared scope. This does not mean zero warnings, full offline operation, real model inference, hardware certification or CANVIO 1.0 Stable.

## 18. r2 quality repair and final local recheck — 2026-11-17

**Candidate:** `23.3.105-p107-portable-preset-r1`  
**Index:** 4,849,053 bytes · SHA-256 `a8b5deeed4115554c39580a949e0ac59f7c872e80ff18a7907422ae2e781ece2`  
**Scope:** startup network cleanup, regression refresh and delivery-manifest regeneration. `CANVIOPhaseSuite.version` remains `70.0.0`.

### Defect fixed
- Removed the startup Google Fonts `<link rel="preconnect">` declarations and stylesheet link.
- Removed the active `canvio-lot36-css` Google Fonts `@import`. The app shell now uses its existing system-font fallback stack during startup.
- Optional Google Fonts loaded through user-selected design tools remain explicit user actions. Exported standalone documents can still include external font links when the user chooses those font presets; that is not an app-boot request and is not advertised as a fully offline export.
- Static audit now rejects Google Fonts stylesheet links, preconnects and CSS `@import` rules in active `<style>` blocks. P68–P70 browser smoke now measures HTTP(S) requests during boot and fails if any occur.

### Final verification
- ZIP input integrity before rebuild: 162 entries, `testzip() = None`.
- Static audit after fix: **109/109** inline scripts parse; **523/523** unique IDs; **0** duplicates; **0** external script `src`; **0** startup remote font stylesheets; **0** font preconnects; **0** active-style remote font imports; **19/19** standalone module copies synchronized; **3/3** worker scripts pass Node syntax.
- Source regressions: P47 fixture set PASS; P48 **26/26**; P49 **35/35**; P50 **27/27**; P55 **49/49**; P56 **27/27**; P57–P62 **15/15**; P63–P67 **18/18**; P68–P70 **16/16**; P102/P105 worker contract **13/13**.
- Chromium: P55 browser lifecycle **24/24**; P56 archive restore preview **27/27**; P62 dashboard/release gate **32/32**; P63–P67 **43/43**; P68–P70 **17/17** (includes zero-network-at-boot assertion); P82/P84 vector PDF **28/28**; P87 DOCX **14/14**; P88 PPTX **14/14**; P90–P96/P84 **34/34**; P97–P101/P104 **35/35**.
- Additional P72/P73/P102/P103/P105–P107 browser API contract checks: **8/8**, **9/9**, **11/11**, **10/10**, and **13/13** checks respectively; all reported true. These are synthetic browser/API contracts, not physical GPU or model-inference acceptance.
- Full boot-network probe after the font fix: **0 HTTP(S) requests**, **0 uncaught page errors**, **0 console errors**.
- Earlier r2 package snapshot (before the final acceptance matrix and retained Office output were added): delivery ZIP contained 165 entries and the manifest verified 126/126 files. The final repackage count is recorded in section 19 and `CANVIO_FINAL_ACCEPTANCE_MATRIX.md`. ZIP SHA-256 is provided in the adjacent `.sha256` sidecar.
- P82 localhost HTTP-origin probe is **BLOCKED**, not PASS: Chromium denies navigation to `127.0.0.1` with `ERR_BLOCKED_BY_ADMINISTRATOR` before any app assertion. Same-origin font/PDF behavior and production HTTPS worker headers must be checked on the real hosted origin.
- P67 print preflight still correctly reports `REVIEW_REQUIRED` with one non-failing production warning in its synthetic fixture. It remains visible because font embedding and physical print/bleed proof are not certified; suppressing it would be misleading.
- The first full source rerun caught stale r1 title-observer assertions in the P55/P56 source tests. Their guards were updated to r2 and both suites then passed again (P55 49/49; P56 27/27). No application feature was weakened to obtain the pass.
- Candidate workflow wiring: P55/P56/P62 Chromium suites and the P72–P107 API contract smoke run in Node 24 workflow; after browser reports are emitted, it refreshes/verifies the full manifest and uploads evidence. Deployment is separately gated by manual `workflow_dispatch` input `deploy_candidate=true`.

### Not run / still OPEN
- P102 ORMBG and P105 Depth Anything model downloads and real inference; WebGPU/WASM performance on physical devices.
- P106 WebGL displacement on physical GPU; available headless test uses Ken Burns 2D fallback.
- P107 Project Vault backup/restore and cross-device synchronization round-trip.
- P72 live GLB GPU rendering and P73 representative real-site offline dependency closure.
- P74 Three.js update, P81 Draco/meshopt/KTX2 and P85 optional heavy libraries remain OPEN/DEFERRED.
- HTTPS/worker MIME/CSP/CORS, Safari/Edge, native IndexedDB restart, real footage A/V sync, accessibility/screen-reader and target-device acceptance are not covered by the local opaque-origin smoke.
- P70 remains **14/14 manual release gates OPEN**, `releaseCertified:false`. This is not CANVIO 1.0 Stable.

### Repository disposition
- The repository and Pages artifact were last inspected at `main` commit `f681c1239dc56968dde338e1c33aa4b63002665a` / Pages run #105, which serves the P70 `23.3.84-p70` source.
- This r2 package has been validated locally and pinned in its candidate workflow, but it has **not** been committed, merged or deployed to GitHub `main`. Do not call local CI evidence a hosted GitHub Actions result.

**Disposition:** local source/browser verification PASS in the scopes above; physical/hosted acceptance and deployment remain OPEN. No claim of zero warnings or Stable certification is made.


## 19. Final full-matrix rerun — 2026-11-18

**Exact candidate:** `23.3.105-p107-portable-preset-r1` · `index.html` SHA-256 `a8b5deeed4115554c39580a949e0ac59f7c872e80ff18a7907422ae2e781ece2` · 4,849,053 bytes. PhaseSuite remains `70.0.0`.

### Source / package checks
- Static audit: **109/109** inline scripts parse; **523/523** unique static IDs; 0 duplicates; 0 external script `src`; 0 startup remote-font stylesheet/preconnect/CSS-import references; **19/19** module copies synchronized; **3/3** workers pass Node syntax.
- Source regression: P47 fixture set PASS; P48 **26/26**; P49 **35/35**; P50 **27/27**; P55 **49/49**; P56 **27/27**; P57–P62 **15/15**; P63–P67 **18/18**; P68–P70 **16/16**; P102/P105 worker contract **13/13**.
- Final delivery manifest: **128/128 files** verified after including the final acceptance matrix and regenerated evidence outputs. Final ZIP: **166 archive entries** (129 regular files including the manifest; 128 manifest-tracked package files); `ZipFile.testzip() = None`.

### Browser checks rerun individually
- P55 **24/24**; P56 **27/27**; P62 **32/32**; P63–P67 **43/43**; P68–P70 **17/17**.
- P72/P73/P102/P103/P105–P107 API-contract groups: **8/8**, **9/9**, **11/11**, **10/10**, **13/13**. All returned true; startup request list was empty; no page or console errors.
- P82/P84 **28/28**; P87 **14/14**; P88 **14/14**; P90–P96 **34/34**; P97–P101/P104 **35/35**.
- P87/P88 LibreOffice 25.2.3.2 Writer/Impress open-edit-save-close-reopen was rerun; both synthetic round-trips passed and post-save ZIP CRC passed. This is not Microsoft Office or Google Workspace acceptance.
- A combined multi-suite shell invocation initially exceeded the execution time limit during P56; P56 and every other suite subsequently completed individually and passed. Do not count the timed-out combined invocation as a passing run.

### Still blocked / not certified
- The localhost HTTP origin probe remains **BLOCKED** before application boot by `ERR_BLOCKED_BY_ADMINISTRATOR`; HTTPS/CSP/CORS/MIME/worker headers and real-origin persistence were not verified.
- No real P102/P105 model inference, physical WebGPU/WASM benchmark, P106 hardware WebGL, P72 GPU acceptance, P107 Project Vault/cross-device round-trip, Safari/Edge matrix or screen-reader/200% zoom test is claimed.
- P74 and P81 remain OPEN; P85 remains OPEN and unfinished. P79/P80 and advanced video requirements remain partial. P70 **14/14** real-world release gates remain OPEN; `releaseCertified:false`.
- GitHub `main` remains at `f681c1239dc56968dde338e1c33aa4b63002665a`; Pages run #105 remains a successful P70 deployment, not an r2 deployment. The candidate Node 24 workflow in this package has not run hosted on `main`.

**Disposition:** full local automation for the listed r2 scopes passed. This does not close physical/hosted/manual gates and does not authorize a Stable/production claim.


## 20. P107 portable preset transfer — 23.3.105

- Added portable Depth Studio preset ZIP export/import using only existing Asset Library and CVZip owners; no cloud service or new store.
- ZIP validation: fixed file allowlist, STORE-only, no encryption/data descriptors, exact local/central directory correspondence, CRC32, bounded sizes and no traversal/duplicate entries. PNG parser validates signature, IHDR, legal pixel format/dimensions, CRC for every chunk, IDAT and terminal IEND; image dimensions must match manifest. Manifest model/version/MIME/strength/duration is pinned/validated.
- Asset import is rollback-safe: failure while adding either image or metadata removes the already inserted asset records.
- P107 portable preset tests: **9/9 PASS**. P102/P105 worker contract tests: **16/16 PASS**. These tests use synthetic PNG/ZIP fixtures and mock Asset Library methods, not two physical browsers or actual user images.
- Candidate: `23.3.105-p107-portable-preset-r1`; PhaseSuite `70.0.0` unchanged. P74/P81/P85 and the P70 real-world gate list are not claimed complete.


## 21. P74/P81/P107 integration pass — `23.3.106-p74-p81-p107-r1` (2026-11-18)

**Exact current local candidate:** `index.html` · SHA-256 `86e9082ba718d49097645b5c5382ffcf4bf9c91ecd93bb6c44e2ea48812ff34b` · 4,887,819 bytes · PhaseSuite `70.0.0`.

### Implemented and hardened
- P74 full local Three.js r187 GLB viewer, reusing the existing P72 file input, 250 MiB cap, GLB 2.0 preflight, external URI rejection, animation mixer and deterministic disposal.
- P81 local Draco/Meshopt/KTX2/Basis provisioning is pinned by exact commit. Addon imports are rewritten to local paths. Before import, the viewer validates the vendor manifest and verifies required same-origin files' actual byte lengths and SHA-256 values; external redirects are rejected. This runs only after explicit user action.
- P107 portable preset zero-strength repair: numeric `0` remains `0` through preview/save/load/export. Strict ZIP/PNG parser, allowlist and rollback tests are included.
- Added `tests/release/package-delivery.py`, so the workflow's manifest-verified deterministic ZIP and SHA-256 sidecar packaging step no longer refers to a missing script.

### Source tests run on current source
| Check | Result |
|---|---:|
| Static audit | 110/110 inline JS; 524/524 unique IDs; 20/20 modules; 3/3 workers; 0 external script src |
| P74/P81 manifest/preflight/integrity contract | 18/18 PASS |
| P107 portable ZIP security/Asset Library rollback | 11/11 PASS |
| P102/P105 worker contract | 17/17 PASS (`runtimeInferenceExecuted=false`) |
| P48 / P49 / P50 / P55 / P56 | 26/26 / 35/35 / 27/27 / 49/49 / 27/27 |
| P57–P62 / P63–P67 / P68–P70 | 15/15 / 18/18 / 16/16 |

### Chromium regression runs
| Suite | Result |
|---|---:|
| P55 / P56 / P62 | 24/24 / 27/27 / 32/32 |
| P63–P67 / P68–P70 | 43/43 / 17/17 |
| P82/P84 / P87 / P88 | 28/28 / 14/14 / 14/14 |
| P90–P96 / P97–P101/P104 | 34/34 / 35/35 |
| P72 / P73 / P103 / P102 / P105–P107 API smoke | 8/8 / 9/9 / 10/10 / 11/11 / 18/18 |

### Remaining boundaries
- The Three.js/decoder vendor binaries are not present in this local source folder because upstream GitHub access is blocked here. The Node 24 workflow provisions the exact revision and runs the SwiftShader/WebGL2 smoke; that hosted workflow has not yet run. The P74/P81 contract's valid/corrupt assets are mocked.
- The hosted P74/P81 browser smoke only renders an uncompressed GLB fixture. Representative compressed Draco/Meshopt/KTX2 fixtures and physical GPU still need testing.
- P102/P105 real ONNX inference, P106 physical GPU shader, P107 Project Vault/two-device restore, real HTTPS/CSP/MIME, Safari/Edge, native IndexedDB restart, assistive technology/WCAG and real A/V synchronization remain OPEN.
- The local Chromium smoke booted with 0 HTTP(S) requests and 0 page/console errors in its `about:blank` harness. The localhost HTTP-origin probe remains blocked by `ERR_BLOCKED_BY_ADMINISTRATOR` before app boot.
- P70's fourteen real-world release gates remain OPEN; `releaseCertified:false`. GitHub `main` last observed at `f681c1239dc56968dde338e1c33aa4b63002665a`, still P70; 23.3.106 is not merged or deployed. P85 is DEFERRED; P108 is not defined in the current Roadmap.

**Disposition:** local source/synthetic regression results PASS only in the scopes stated above. Hosted P74/P81 runtime, real inference, hardware and production/manual acceptance remain pending. Not CANVIO 1.0 Stable.

## 22. Continuation recheck and packaging repair — 2026-11-18

**Candidate:** `23.3.106-p74-p81-p107-r1` · **Index SHA-256:** `86e9082ba718d49097645b5c5382ffcf4bf9c91ecd93bb6c44e2ea48812ff34b` · **Index bytes:** `4,887,819` · **PhaseSuite:** `70.0.0`.

### Re-run results

| Check | Result | Scope |
|---|---:|---|
| Static source audit | 110/110 scripts; 524/524 unique IDs; 0 external script src; 20/20 modules; 3/3 workers | Exact index + modules |
| P47–P50 | fixtures PASS; 26/26; 35/35; 27/27 | Source/VM contracts |
| P55 / P56 | 49/49 / 27/27 | Source regression |
| P57–P62 / P63–P67 / P68–P70 | 15/15 / 18/18 / 16/16 | Source regression |
| P74/P81 / P107 / P102/P105 worker | 18/18 / 11/11 / 17/17 | GLB preflight + mocked integrity; ZIP/PNG synthetic; worker static contract |
| P97–P101/P104 | 35/35 | Chromium `about:blank`, synthetic timeline/media |
| P72/P73/P102/P103/P105–P107 | 8/8, 9/9, 11/11, 10/10, 18/18 | Chromium API contracts; 0 startup HTTP(S), 0 page errors, 0 console errors |
| P82/P84 | 28/28 | Chromium PDF, text extraction, embedded font and vector fixtures |
| Existing candidate browser reports | P55 24/24; P56 27/27; P62 32/32; P63–P67 43/43; P68–P70 17/17; P87 14/14; P88 14/14; P90–P96 34/34 | Retained reports from this candidate's prior QA run; about:blank/synthetic boundaries apply |

### Provisioning / hosted-run blocker

- `bash scripts/vendor-three-r187.sh` was attempted locally but stopped at the upstream Git fetch because this execution container could not resolve `github.com`. It failed before the script's `rm -rf assets/three`, so no generated vendor directory was removed or partially written.
- P74/P81 software-WebGL browser test was therefore **NOT RUN** locally. The CI workflow has the install/provision/smoke steps, but there is no candidate branch/PR run to report. The repository `main` is still `f681c1239dc56968dde338e1c33aa4b63002665a` (P70 baseline).
- `verify-manifest.py` initially caught a stale SHA for the newly refreshed P97 browser report. The manifest was regenerated from the full current folder and re-verified before deterministic ZIP packaging; final package verification is recorded in the handoff artifact and manifest.

### Still OPEN

P74 runtime import/render on SwiftShader; representative compressed Draco/Meshopt/KTX2 fixtures; physical GPU; P102/P105 ONNX inference; P106 GPU shader; P107 two-device/Project Vault restore; real HTTPS/CSP/worker MIME/origin persistence; Safari/Edge; accessibility/WCAG; real A/V sync/long exports; external Office/Google Workspace and print proof. P70's fourteen real-world release gates remain OPEN and `releaseCertified:false`. This is not CANVIO 1.0 Stable.


## 23. P106 depth render and Office round-trip continuation — 2026-11-18

### P106 render test

- Added `tests/p102-p105/run-p106-depth-render-smoke.py` and a candidate workflow step to run it after the P72–P107 API smoke.
- Chromium: **8/8 PASS** for panel mount, user-action-only synthetic Worker invocation, explicit fallback disclosure, visible varied 2D output, action enablement, zero-strength Asset Library metadata save and no page/console errors.
- Environment capability was `webglAvailable:false`, despite the requested SwiftShader flags. The application correctly selected `Ken Burns 2D` and did not claim 2.5D. Report: `tests/p102-p105/p106-depth-render-browser-smoke-report.json`.
- The fallback report records `p106WebglShaderAccepted:false`; the separate headed SwiftShader report records shader acceptance under software WebGL. Both reports explicitly record `physicalGpuExecuted:false` and `realDepthAnythingInferenceExecuted:false`. Physical-GPU and real AI acceptance remain OPEN.

### P87/P88 Office round-trip

- LibreOffice **25.2.3.2** Writer and Impress each completed open → edit → save → reopen for their generated synthetic file.
- DOCX: edited marker and Vietnamese text persisted; text length 665.
- PPTX: original Vietnamese slide title and added editable text shape persisted; one-slide deck; two text shapes.
- Post-save ZIP/OOXML CRC: PASS for both files.
- Scope is LibreOffice only. Microsoft Word/PowerPoint and Google Docs/Slides round-trip remain untested.

### Current disposition

No application index logic changed in this continuation; `CANVIO_BUILD.version` remains `23.3.106-p74-p81-p107-r1`, PhaseSuite `70.0.0`. P74/P81 vendor runtime/browser import is still blocked locally by upstream DNS; P102/P105 model inference is not run; P106 WebGL remains not accepted; P107 cross-device/Project Vault round-trip remains open. P70 fourteen real-world release gates remain OPEN, and candidate is not Stable or deployed.


## 24. P107 v2 repair and current-version verification — 2026-11-18

**Candidate:** `23.3.107-p107-preset-v2-r2` · **Index SHA-256:** `ea758d17fa94bab1167e0a5792b0c806045b6102e1dfe5d4306603cbf8048687` · **Bytes:** 4,890,301.

- Reproduced and fixed a real P107 portability defect: the source image and generated depth map may have different dimensions. ZIP manifest v2 records each pair independently; import checks both PNG headers and dimensions. Version 1 compatibility remains tested.
- P107 tests: **14/14 PASS**. Tests include strict three-file STORE ZIP, encryption/data-descriptor/DEFLATE rejection, allowlist/path traversal, duplicate entries, CRC32, PNG dimensions, v1 compatibility, v2 differing dimensions, zero-strength preservation and rollback after partial Asset Library failure.
- Chromium browser: **14/14 PASS in both headless fallback and headed SwiftShader WebGL modes** for explicit synthetic worker call, depth PNG creation, visible fallback render, Asset Library save, real downloaded ZIP with three entries and valid CRC, re-import, source/depth dimensions 160×100 and 96×64, strength `0`, and no page/console errors. This is isolated browser-context synthetic-worker acceptance, not physical-device or Project Vault acceptance.
- Current candidate browser reruns: P82/P84 **28/28**, P87 **14/14**, P88 **14/14**, P90–P96 **34/34**, P97–P101/P104 **35/35**. LibreOffice 25.2.3.2 Writer/Impress open-edit-save-reopen passed; it does not certify Microsoft Office or Google Workspace.
- Build title mapper fixed for the new marker after browser tests exposed a stale legacy observer fallback to the P42 title. Current-version title tests now pass in P82, P87, P88, P90–P96 and P97 suites.
- Static audit: **110/110** scripts, **524/524** unique IDs, 0 duplicate IDs, 0 external script source URLs, 0 boot-time Google Fonts CSS references, **20/20** standalone modules synchronized, **3/3** workers parse.
- P74/P81 contract **18/18 PASS** (manifest/hash and preflight contracts); actual vendor bundle is absent locally and the Three.js/decoder browser test was not run. Compressed Draco/Meshopt/KTX2 fixtures are not accepted. P102/P105 worker contracts **17/17 PASS**, but real ONNX inference is NOT RUN. P106 WebGL shader compiles/renders on ANGLE SwiftShader software WebGL; physical GPU and model inference remain OPEN.
- Disposition: local integration candidate only. P70 fourteen real-world gates remain OPEN; P85 optional heavy runtime OPEN/unimplemented; P108 unspecified; not merged, deployed or Stable.


## 25. Current exact-source recheck — 23.3.107-p107-preset-v2-r2 (2026-11-18)

**Index:** 4,890,301 bytes · SHA-256 `ea758d17fa94bab1167e0a5792b0c806045b6102e1dfe5d4306603cbf8048687` · PhaseSuite `70.0.0`.

- Static audit: **110/110** inline scripts, **524/524** unique IDs, 0 duplicate IDs, 0 external script URLs, 0 startup font CSS/preconnect/import requests, **20/20** standalone modules synchronized and **3/3** worker scripts parse.
- Source tests: P47 fixture set PASS; P48 **26/26**; P49 **35/35**; P50 **27/27**; P55 **49/49**; P56 **27/27**; P57–P62 **15/15**; P63–P67 **18/18**; P68–P70 **16/16**; P74/P81 contract **18/18**; P107 **14/14**; P102/P105 worker contract **17/17**.
- Current browser tests: P55 **24/24**; P56 **27/27**; P62 **32/32**; P63–P67 **43/43**; P68–P70 **17/17**; P82/P84 **28/28**; P87 **14/14**; P88 **14/14**; P90–P96 **34/34**; P97–P101/P104 **35/35**; P106/P107 dual modes **14/14 each**. P72/P73/P102/P103/P105–P107 API contracts: **8/8, 9/9, 11/11, 10/10, 18/18**.
- P106 headless uses explicit Ken Burns 2D fallback; headed test uses ANGLE SwiftShader software WebGL and verifies the real shader/animation/WebM handoff. Neither is physical GPU, and both use synthetic depth rather than model inference. P107 ZIP imports into a fresh isolated browser context; still not physical device or Project Vault acceptance.
- LibreOffice Writer/Impress 25.2.3.2 round-trip: PASS open/edit/save/reopen for synthetic DOCX/PPTX with Vietnamese text and post-save ZIP CRC. Not Microsoft Office/Google Workspace certification.
- P82 localhost HTTP origin run: **BLOCKED by environment browser policy** (`net::ERR_BLOCKED_BY_ADMINISTRATOR`); not counted as PASS. HTTPS production origin and server headers remain open.
- OPEN: P74/P81 vendor binaries and compressed Draco/Meshopt/KTX2 fixtures; P102/P105 real inference; physical GPU performance/VRAM; P107 physical two-device + Project Vault persistence; HTTPS/CSP/worker MIME; Safari/Edge; accessibility/screen reader/200% reflow; real A/V sync and long renders; Microsoft/Google Office plus print/CMYK; rollback/observability; P85 optional heavy stack. P70's fourteen release gates remain OPEN and `releaseCertified:false`. Candidate not hosted, merged, deployed or Stable.


### P82 test determinism hardening (current candidate)

- The PDF test previously asserted that the first prepared page always contains a given title; the canonical Pages owner can return page content in a different order. The test now validates the required title across all prepared canonical pages and logs the full text payload on failure. This avoids a false negative from page ordering without weakening content checks. Re-run result: P82/P84 **28/28 PASS**.


## 26. Exact-source continuation — `23.3.108-p85-studio-r2` (2026-11-18)

**Index:** 4,921,610 bytes · SHA-256 `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82` · PhaseSuite `70.0.0`.

### Newly implemented / repaired
- P85 Studio is now integrated in the app with lazy loaders for PostFX, WebGPU path tracing, OpenCV Lucas–Kanade, dotLottie and Rive. It reuses existing P72/Asset Library/Video Engine owners. Source has explicit runtime capability guards, SHA manifest verification, no CDN fallback and cleanup hooks.
- Added `scripts/vendor-p85-runtimes.sh` to provision pinned open-source npm runtimes, matching WASM files and full upstream licenses into same-origin `assets/p85`.
- P102/P105/P80 worker runtime wiring is shifted toward same-origin pinned Transformers.js + ONNX WASM assets provisioned by the P85 vendor script; model weights are still explicit/user-triggered.
- Workflow now pins the exact `index.html` SHA. Deploy job additionally requires the build's P70 release decision output to be certified; current 14-open gate is fail-closed.
- Updated inherited browser test title guards for the actual current title `CANVIO 23.3.108 — Creative Runtime Lab · P85 Runtime Hardening r2`.

### Source checks on this candidate
- Static audit **111/111**, 525/525 unique IDs, 0 duplicates, 0 external script `src`, 0 startup Google Fonts requests, 21/21 standalone modules synchronized, 3/3 workers parse.
- P47 fixtures PASS; P48 **26/26**; P49 **35/35**; P50 **27/27**; P55 **49/49**; P56 **27/27**; P57–P62 **15/15**; P63–P67 **18/18**; P68–P70 **16/16**; P74/P81 **18/18**; P85 **13/13**; P102/P105 worker contract **19/19**; P107 **14/14**.

### Browser/Office runs completed on this candidate
- P55 **24/24**, P56 **27/27**, P62 **32/32**, P63–P67 **43/43**, P68–P70 **17/17**, P82/P84 **28/28**, P85 lazy boot **10/10**, P90–P96 **34/34**, P87 **14/14**, P88 **14/14**. P97–P101/P104 exact-current rerun timed out before a final report and is not counted in this refresh.
- P72/P73/P102/P103/P105–P107 API contracts: **8/8, 9/9, 11/11, 10/10, 18/18** respectively.
- P106/P107 exact-current rerun: **14/14 PASS**. Headless 2D fallback is named truthfully; WebM exports to Asset Library/Video Engine; a three-entry ZIP imports in a fresh isolated browser context with independent dimensions and zero strength preserved.
- LibreOffice Writer/Impress 25.2.3.2 round-trip: PASS open/edit/save/reopen for generated DOCX/PPTX; Vietnamese text/markers retained; ZIP CRC PASS. No Microsoft/Google Office claim.

### Blockers and tests NOT counted
- P74/P81 runtime browser smoke stops because `assets/three/THREE-VENDOR-MANIFEST.json` is absent. `scripts/vendor-three-r187.sh` requires GitHub DNS.
- P85 vendor runtime smoke was attempted and stopped immediately because the `assets/p85/P85-VENDOR-MANIFEST.json` is absent; no vendor runtime was executed. `assets/p85` runtime bundles are absent. The npm install attempt timed out; direct checks to `registry.npmjs.org` and `raw.githubusercontent.com` fail DNS resolution in this container. P85 13/13 contract and 10/10 lazy-boot do not equal actual vendor runtime acceptance.
- P97–P101/P104 browser rerun on the exact post-hardening source timed out before producing a final report; prior 35/35 is retained as earlier same-marker history but is not counted as a result of this refresh.
- P106 headed Xvfb/SwiftShader rerun for this exact candidate timed out before returning a report; **not counted**. A previous candidate's SwiftShader test must not be reused as exact-current proof.
- P102/P105 ONNX model inference NOT RUN; real model weights were not downloaded.
- P107 physical two-device transfer and Project Vault native IndexedDB round-trip NOT RUN.
- P70 release gate still reports **14/14 real-world gates OPEN**, `releaseCertified:false`. Local about:blank/browser shims do not cover production HTTPS/CSP/worker MIME or browser/device matrix.
- Candidate workflow YAML parses, exact index SHA is pinned and deploy is now guarded by a certified P70 decision. GitHub-hosted Actions has not run for this candidate; no merge or deployment is claimed.

**Disposition:** P85 feature source/UI integrated; runtime bundle/AI/GPU acceptance pending. P70–P107 are not fully accepted or Stable.


## 27. Exact-source refresh after P85 lifecycle repair — 2026-11-18
- Exact source `index.html`: **4,921,610 bytes**, SHA-256 `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82`.
- Static audit: **111/111** inline scripts; **525/525** unique IDs; **21/21** standalone modules; **3/3** workers; zero external script tags and zero boot-time network/font requests.
- P85: source contract **13/13**, browser lazy boot **10/10**. Contract now checks owner/diagnostic version parity and OpenCV Mat disposal on both success and exception paths. Runtime vendor smoke was attempted but blocked because local vendor assets are absent and npm/GitHub DNS is unavailable.
- Re-ran browser: P55 **24/24**; P56 **27/27**; P62 **32/32**; P63–P67 **43/43**; P68–P70 **17/17**; P82/P84 **28/28**; P85 lazy boot **10/10**; P87 **14/14**; P88 **14/14**; P90–P96 **34/34**; P106/P107 **14/14**; P72/P73/P102/P103/P105–P107 API contract smoke PASS. P97–P101/P104 exact-current rerun timed out and is not counted.
- LibreOffice 25.2.3.2 Writer/Impress open-edit-save-reopen: PASS for DOCX and PPTX; Vietnamese text/markers retained; post-save ZIP CRC PASS. Microsoft Office/Google Workspace compatibility remains unverified.
- P74/P81 vendor smoke was attempted; it stopped with the explicit missing Three.js vendor manifest. P102/P105 real ONNX inference was not run. P106 headed Xvfb/SwiftShader exact-current attempt timed out; current counted P106 result is headless 2D fallback only.
- P70 remains fail-closed with 14/14 real-world gates open. No hosted Actions run, PR, merge, or deployment is claimed.


## 28. Clean exact-current reruns after P97/P106 timeouts — 2026-11-18

**Candidate:** `23.3.108-p85-studio-r2` · `index.html` 4,921,610 bytes · SHA-256 `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82`. This was a verification-only refresh; no app source changed.

### Clean reruns
- P97–P101/P104 browser: **35/35 PASS** on Chromium 144.0.7559.96. This clean run supersedes the earlier timeout and is now counted. Tests cover P97 preview/apply/undo and safe unknown-command rejection; P98 input-aware shortcuts and canonical timeline actions; P99 estimated per-word cues; P100 transcript edits and locked-track ripple rejection; P101 bounded export/capability disclosure and synthetic WebM metadata/canplay; P104 Asset Library image reuse, Ken Burns batch creation/undo.
- P106 headed Xvfb/ANGLE SwiftShader WebGL: **14/14 PASS**. Shader rendered visible non-blank pixels (525 unique colors in the fixture), animation changed sampled pixels, and exported WebM was saved to Asset Library and passed into Video Engine. Backend is software SwiftShader, not a physical GPU.
- P106 headless 2D fallback: **14/14 PASS**. Both modes validate P107's exact three-file ZIP, CRC, and import into a fresh isolated browser context; source/depth dimensions and strength zero are preserved.

### Exact-current static/source matrix
- Static audit: 111/111 inline scripts; 525 unique IDs; zero duplicates; 21/21 standalone modules; 3/3 workers; zero external script tags or boot-time font network references.
- Source: P47 fixtures PASS; P48 26/26; P49 35/35; P50 27/27; P55 49/49; P56 27/27; P57–P62 15/15; P63–P67 18/18; P68–P70 16/16; P74/P81 18/18; P85 13/13; P102/P105 worker contracts 19/19; P107 14/14.
- Browser regression: P55 24/24; P56 27/27; P62 32/32; P63–P67 43/43; P68–P70 17/17; P72/P73/P102/P103/P105–P107 API smoke 8/8, 9/9, 11/11, 10/10, 18/18; P82/P84 28/28; P85 lazy boot 10/10; P87 14/14; P88 14/14; P90–P96 34/34; P97–P101/P104 35/35; P106 14/14 per mode.
- LibreOffice Writer/Impress 25.2.3.2 open/edit/save/reopen: PASS. Not an MS Office or Google Workspace certification.

### Blockers remain blockers (not test failures hidden as passes)
- P74/P81 runtime binaries and compressed decoder fixtures absent; P74 browser vendor smoke has not run.
- P85 actual PostFX/OpenCV/dotLottie/Rive runtime smoke has not run. Local provisioning is blocked by DNS resolution failure for npm/GitHub.
- P80/P102/P105 real model inference not run.
- P106 physical GPU not tested; P107 physical two-device and Project Vault persistence not tested.
- P70 fourteen manual acceptance gates remain OPEN, `releaseCertified:false`; no Stable release.
- GitHub `main` remains the older P70 baseline at `f681c1239dc56968dde338e1c33aa4b63002665a`. The latest observed green Actions run was for the older main source, not this local candidate. There is no hosted validation/PR/merge/Pages deployment for 23.3.108.

Machine-readable evidence: `tests/release/exact-current-refresh-report.json`.


## 29. Vendor provisioning transaction hardening — 23.3.109 (2026-11-18)

- Changed both `scripts/vendor-three-r187.sh` and `scripts/vendor-p85-runtimes.sh` to build into staging directories and defer activation until artifacts, license files and SHA manifests pass validation.
- Added `scripts/activate-vendor-tree.sh`: preserves the previous tree, fails closed on stale backup, and restores the previous tree if the staged directory cannot be moved into place.
- Added `tests/vendor/test-activate-vendor-tree.sh`: successful replacement PASS; injected activation failure with rollback PASS. Total 2/2.
- Shell syntax: 4/4 scripts PASS.
- Exact-source reruns: static audit 111/111 inline scripts, 525 unique IDs, 21/21 module copies, 3/3 worker syntax; P74/P81 18/18; P85 13/13; P102/P105 19/19; P107 14/14; P85 lazy browser boot 10/10.
- P74/P81 vendor browser smoke correctly stopped because `assets/three/THREE-VENDOR-MANIFEST.json` is absent. P85 lazy boot reports no runtime capabilities and no remote requests; actual vendor runtime execution remains NOT RUN.
- Network probe: `registry.npmjs.org` and `github.com` DNS resolution failed in this container. No runtime binaries were fabricated or substituted.
- Application index unchanged: 4,921,610 bytes; SHA-256 `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82`.
- No hosted Actions run, PR, merge, Pages deploy or Stable certification is claimed. P70's fourteen acceptance gates remain OPEN.


# 105. Continuation audit — 23.3.110 (2026-11-18)

This is a verification/documentation refresh only. No application source, UI, or runtime binaries changed.

- Re-ran P74/P81 source contract: **18/18 PASS**; vendor runtime absent and compressed decoder fixture decode not run.
- Re-ran P85 source contract: **13/13 PASS**; actual runtime browser smoke exits before launch because `assets/p85/P85-VENDOR-MANIFEST.json` is absent.
- Re-ran P102/P105 worker contract: **19/19 PASS**; real ONNX model inference not run.
- Re-ran P107 ZIP/security contract: **14/14 PASS**; no cloud sync, Project Vault or physical two-device round trip.
- Static audit: **111/111** inline scripts, **525/525** unique IDs, **21/21** standalone modules, **3/3** workers.
- Attempted npm registry resolution; `npm view three@0.187.0` failed with `EAI_AGAIN registry.npmjs.org`. GitHub host DNS also did not resolve. npm cache is only 12 KB and contains no usable packages; no Three.js, decoder, OpenCV, dotLottie, Rive, Transformers.js or ONNX WASM binaries exist in the package.
- P106 physical GPU remains untested. Software SwiftShader evidence is not physical GPU acceptance.
- P70 remains **14/14 manual gates OPEN**, `releaseCertified:false`. These require real devices, production HTTPS origin, real media/projects/footage, human accessibility and licensing review, print/prepress, backup/restore and rollback/observability evidence. They cannot be truthfully completed in this isolated container.
- No GitHub commit, hosted Actions run, PR, merge, Pages deployment or Stable certification is claimed.

Machine-readable evidence: `tests/release/continuation-acceptance-audit-23.3.110.json`.
