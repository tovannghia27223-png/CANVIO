# CANVIO — Final Acceptance Matrix (`23.3.108-p85-studio-r2`)

**PhaseSuite:** `70.0.0` retained  
**Index:** `index.html` · **Bytes:** 4,921,610 · **SHA-256:** `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82`  
**Disposition:** local integration candidate. Current exact-source and browser suites pass within their disclosed synthetic/software scope. P74/P81/P85 generated vendor assets and real model inference remain unverified; P70 has 14 real-world gates open. Not merged, deployed or CANVIO 1.0 Stable.

## Current acceptance snapshot
- Static audit: **111/111** scripts parse; **525/525** unique IDs; zero duplicates; **21/21** modules synchronized; **3/3** workers parse.
- Source: P47 fixtures PASS; P48 **26/26**; P49 **35/35**; P50 **27/27**; P55 **49/49**; P56 **27/27**; P57–P62 **15/15**; P63–P67 **18/18**; P68–P70 **16/16**; P74/P81 **18/18** contract; P85 **13/13** contract; P102/P105 **19/19** worker contract; P107 **14/14**.
- Browser: P55 **24/24**; P56 **27/27**; P62 **32/32**; P63–P67 **43/43**; P68–P70 **17/17**; P72 **8/8**; P73 **9/9**; P102 **11/11**; P103 **10/10**; P105–P107 **18/18**; P82/P84 **28/28**; P85 lazy boot **10/10**; P87/P88 **14/14** each; P90–P96 **34/34**; P97–P101/P104 **35/35**; P106 **14/14** per rendering mode.
- P106 headed mode is ANGLE SwiftShader software WebGL, not physical GPU. P107 import is verified in a fresh isolated browser context, not on two physical devices or Project Vault.
- LibreOffice Writer/Impress 25.2.3.2 open/edit/save/reopen: PASS; not Microsoft Office or Google Workspace certification.
- SHA-256 manifest: **155/155** file entries verified; ZIP: **156** entries including manifest; CRC PASS.

The historical 23.3.107 matrix and prior run records remain below. The latest clean rerun details are in the final exact-current addendum and `tests/release/exact-current-refresh-report.json`.

---

## Historical 23.3.107 candidate details (superseded by the exact-current snapshot above)
- P74: Three.js r187 GLB viewer; reuses P72 file input, local dynamic imports after click, self-contained GLB preflight, 250 MiB cap, animation and cleanup.
- P81: local Draco/Meshopt/KTX2-Basis decoder integration; pinned provisioning script and SHA-256 vendor manifest.
- P107: portable depth/preset ZIP with strict allowlist/CRC/PNG validation and rollback; zero-strength value preserved in preview/save/load/export.

## Locally verified on this exact source

| Check | Result | Scope |
|---|---:|---|
| Inline JavaScript parse | 110/110 PASS | Node syntax |
| Static DOM IDs | 524 unique; 0 duplicates | HTML audit |
| External script `src` | 0 | Static audit |
| Startup Google Fonts stylesheet/preconnect/CSS import | 0/0/0 | Active startup styles |
| Standalone review modules | 20/20 synchronized | Exact source parity |
| Worker syntax | 3/3 PASS | Whisper, ORMBG, Depth |
| P74/P81 contract | 18/18 PASS | GLB preflight + mocked vendor byte-length/SHA-256 verification |
| P107 portable preset | 14/14 PASS | ZIP v1 compatibility + v2 independent PNG dimensions, CRC and rollback |
| P102/P105 worker contract | 17/17 PASS | Static worker wiring; inference NOT RUN |
| P106/P107 browser | 14/14 PASS × 2 modes | Headless 2D fallback plus Xvfb/ANGLE SwiftShader WebGL shader/animation/WebM export; ZIP imported in an isolated browser context |

## Inherited source regression matrix

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
| P68–P70 | 16/16 |

## Inherited Chromium / Office evidence

| Suite | Result | Boundary |
|---|---:|---|
| P55 browser | 24/24 | Chromium synthetic editor |
| P56 browser | 27/27 | ZIP restore preview |
| P62 browser | 32/32 | Fail-closed release dashboard |
| P63–P67 browser | 43/43 | Synthetic timeline/assets |
| P68–P70 browser | 17/17 | Geometry-only viewer and release gate |
| P72/P73/P102/P103/P105–P107 API smoke | 8/8, 9/9, 11/11, 10/10, 18/18 | Minimal DOM/API contract |
| P82/P84 PDF | 28/28 | Vector PDF fixtures |
| P87 DOCX | 14/14 | Synthetic export/OOXML |
| P88 PPTX | 14/14 | Synthetic export/OOXML |
| P90–P96 | 34/34 | UI/UX Chromium |
| P97–P101/P104 | 35/35 | Synthetic video/asset workflow |
| LibreOffice Writer/Impress round-trip | PASS | Not MS Office/Google Workspace certification |

The listed browser suites were executed individually on the 23.3.106 candidate lineage. The P74 runtime integrity routine was added after the general browser sweeps and was verified with isolated mocked manifest/asset fixtures; vendor-backed SwiftShader runtime test remains for hosted CI.

## P74/P81 runtime provisioning status

- `scripts/vendor-three-r187.sh` pins Three.js r187 commit `7e89746a687bb88271253698fa108b1dd59825d0`, includes required addons and local Draco/Meshopt/KTX2/Basis decoders, rewrites package imports to local relative paths and creates `assets/three/THREE-VENDOR-MANIFEST.json`.
- Local execution is BLOCKED because this container cannot resolve upstream GitHub hosts. The local vendor directory is absent. Candidate GitHub Node 24 workflow runs the provisioner online, validates the files, launches Chromium with SwiftShader/WebGL2, imports the local module graph and renders an uncompressed GLB fixture.
- The software-WebGL test is not physical-GPU certification and does not yet test sample GLBs that require Draco, Meshopt or KTX2 compression. These remain acceptance follow-ups.

## Current Chromium regression runs (local synthetic harness)

| Suite | Result | Boundary |
|---|---:|---|
| P55 / P56 / P62 | 24/24 / 27/27 / 32/32 | Chromium `about:blank` and test storage shims |
| P63–P67 / P68–P70 | 43/43 / 17/17 | Synthetic timeline, offline viewer and fail-closed release gate |
| P82/P84 / P87 / P88 | 28/28 / 14/14 / 14/14 | Synthetic PDF, DOCX and PPTX fixtures |
| P90–P96 / P97–P101/P104 | 34/34 / 35/35 | Synthetic editor workflows and media fixtures |
| P72 / P73 / P103 / P102 / P105–P107 API smoke | 8/8 / 9/9 / 10/10 / 11/11 / 18/18 | API contracts, not complete external/AI acceptance |

## Remaining real-world acceptance gates

1. P102 background-removal and P105 depth ONNX inference using real image sets on supported devices.
2. P106 physical GPU depth shader and P74 target-device performance/VRAM.
3. Representative compressed Draco/Meshopt/KTX2 GLB fixture decode, not only module import.
4. Project Vault native IndexedDB save/reopen and P107 transfer across two physical devices.
5. HTTPS, CSP, worker MIME, Service Worker/origin persistence and cross-origin restore.
6. Chrome/Edge/Safari target matrix; 200% reflow, keyboard, screen reader and WCAG review.
7. Real A/V synchronization, long-form export, codec/MIME and recovery on representative user media.
8. Microsoft Office/Google Workspace round-trip; print/font/bleed/CMYK proof.
9. Hosting security headers, rollback, production observability and support runbook.
10. P70's fourteen real-world gates remain OPEN until evidence is collected; `releaseCertified:false`.

**Not specified:** P108 has no defined requirement or implementation in this Roadmap.

**P85 current status:** Studio source/UI, lazy-load boundaries and pinned free/open-source provisioning scripts are integrated. The generated PostFX/OpenCV/dotLottie/Rive/Three.js/ONNX vendor runtime binaries are not in this local ZIP because upstream DNS is unavailable; real runtime initialization, WebGPU path tracing and model inference remain OPEN. Do not describe P85 as unimplemented, and do not describe its runtime as accepted.

## GitHub / deployment state

Last inspected `main`: `f681c1239dc56968dde338e1c33aa4b63002665a`. Pages run #105 (`44118610508`) succeeded for P70, not this candidate. The candidate workflow is configured so PR/push runs validate and package only; deploy requires a separate manual workflow dispatch with `deploy_candidate=true`. No merge or deployment of 23.3.106 is claimed.

## Continuation recheck — 2026-11-18

- Exact index remains `4,887,819` bytes / SHA-256 `86e9082ba718d49097645b5c5382ffcf4bf9c91ecd93bb6c44e2ea48812ff34b`.
- Latest local run: static audit 110/110 scripts, 524 unique IDs, 20/20 standalone modules, 3/3 workers; P74/P81 18/18; P107 11/11; P102/P105 worker contract 17/17; inherited Node source suites PASS; P97–P101/P104 browser smoke 35/35; P72/P73/P102/P103/P105–P107 API smoke PASS (8/8, 9/9, 11/11, 10/10, 18/18); P82/P84 PDF 28/28.
- Retained candidate browser reports: P55 24/24; P56 27/27; P62 32/32; P63–P67 43/43; P68–P70 17/17; P87 14/14; P88 14/14; P90–P96 34/34. Synthetic/opaque-origin limitations remain applicable.
- Local `scripts/vendor-three-r187.sh` provisioning failed before altering `assets/three`, because this container could not resolve `github.com`. Consequently P74/P81 SwiftShader runtime smoke was NOT RUN here, and the local ZIP does not include generated Three.js/Draco/Meshopt/Basis binaries. The hosted Node 24 workflow has not run for this candidate because no 23.3.106 branch/PR exists on the remote repository.
- Manifest regenerated and verified: 138/138 source-package files. Deterministic ZIP: 139 entries including manifest; CRC PASS. Refer to the `.sha256` sidecar for the archive digest.
- Remote `main` remains `f681c1239dc56968dde338e1c33aa4b63002665a` (P70 baseline). No merge/deployment is claimed. P70's fourteen real-world release gates remain OPEN.


## Continuation evidence — P106 and office — 2026-11-18

| Suite | Result | Exact boundary |
|---|---:|---|
| P106 depth-render smoke (superseded initial run) | 8/8 PASS | Earlier fallback-only test; superseded by current 14/14 dual-mode result below. |
| P87 DOCX LibreOffice round-trip | PASS | LibreOffice Writer 25.2.3.2 open/edit/save/reopen; Vietnamese text and marker retained; ZIP CRC PASS. |
| P88 PPTX LibreOffice round-trip | PASS | LibreOffice Impress 25.2.3.2 open/edit/save/reopen; Vietnamese title and editable marker retained; ZIP CRC PASS. |
| Candidate workflow YAML | PASS | PyYAML parse; new P106 smoke step and report artifact path included locally. Workflow has not run on GitHub for this candidate. |

The initial report above is retained as history. The current reports are `p106-depth-render-fallback-browser-smoke-report.json` and `p106-depth-render-webgl-browser-smoke-report.json`; each records 14/14. The WebGL report uses ANGLE SwiftShader software rendering, not a physical GPU.


## Current candidate verification — `23.3.107-p107-preset-v2-r2`

| Suite | Result | Boundary |
|---|---:|---|
| Static audit | 110/110 scripts; 524 IDs; 20/20 modules; 3/3 workers | Exact current index |
| P74/P81 source contract | 18/18 | Static, GLB preflight and mocked manifest/hash checks; vendor runtime absent locally |
| P107 source | 14/14 | v1 compatibility, v2 independent dimensions, security checks, rollback |
| P102/P105 worker contract | 17/17 | Wiring and worker contracts only; no model inference |
| P106/P107 browser | 14/14 per mode | Headless fallback and headed SwiftShader WebGL; animation pixels changed, WebM exported and passed to Video Engine |
| P82/P84 PDF | 28/28 | Vietnamese embedded font, text extraction, vector and image checks |
| P87 DOCX / P88 PPTX | 14/14 each | Browser OOXML/ZIP smoke |
| P90–P96 UX | 34/34 | Synthetic Chromium UI suite |
| P97–P101/P104 | 35/35 | Synthetic video editor/asset timeline suite |
| LibreOffice Writer/Impress | PASS | Open/edit/save/reopen; not Microsoft or Google certification |

P55/P56 browser rechecks each completed (24/24 and 27/27). A combined command timed out before completing the P62/P63/P68 browser sequence; those inherited earlier candidate reports are retained but are not counted as a fresh current-version rerun in this section.

## Current release blockers

- P74/P81 vendor bundle (`assets/three`) is not present in the local package: upstream GitHub DNS/network is unavailable. Therefore Three.js r187 browser rendering and representative Draco/Meshopt/KTX2 decoding remain unverified; only 18/18 source contracts passed.
- P102/P105 real model inference was not run; P106 headless fallback and SwiftShader WebGL both passed, but physical GPU acceptance is still open.
- P107 ZIP export/import passed in the same synthetic browser, but physical cross-device transfer and Project Vault restore were not tested.
- P85 path tracer/postprocessing/OpenCV.js/dotLottie/Rive is OPEN and unfinished. P70 release gate keeps all 14 real-world gates open.
- GitHub main is still P70; no hosted CI, merge or Pages deployment is claimed for this local candidate.


## Current exact-source verification — 23.3.107-p107-preset-v2-r2

- Index SHA-256 `ea758d17fa94bab1167e0a5792b0c806045b6102e1dfe5d4306603cbf8048687` · 4,890,301 bytes · PhaseSuite `70.0.0`.
- P107 ZIP v2: source/depth independent dimensions, v1 backward compatibility, strict ZIP validation and rollback **14/14**.
- P106/P107 Chromium dual-mode tests: **14/14 headless fallback** and **14/14 headed ANGLE SwiftShader WebGL**. Both export WebM to Asset Library/Video Engine and import actual three-entry preset ZIP into a fresh isolated browser context. SwiftShader is software rendering, not physical GPU; the depth Worker output is synthetic, not a real AI inference.
- Regression matrix: P55 24/24; P56 27/27; P62 32/32; P63–P67 43/43; P68–P70 17/17; P82/P84 28/28; P87 14/14; P88 14/14; P90–P96 34/34; P97–P101/P104 35/35. LibreOffice Writer/Impress round-trip passed.
- P82 HTTP localhost smoke is blocked by `ERR_BLOCKED_BY_ADMINISTRATOR`; no pass claimed for live origin. P74/P81 vendor files, compressed GLB fixtures, P102/P105 inference, physical GPU, P107 physical devices/Project Vault, HTTPS/security headers, browser/accessibility matrix and P70 14 gates remain open. P85 source/UI is integrated; vendor runtime acceptance remains OPEN.


## Current exact-source acceptance — `23.3.108-p85-studio-r2` (2026-11-18)

**Index:** 4,921,610 bytes · SHA-256 `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82` · PhaseSuite `70.0.0`. This section supersedes the `23.3.107` current-candidate sections above; they remain historical records.

| Check | Result | Scope / boundary |
|---|---:|---|
| Inline JS parse / static audit | 111/111 | Exact current source |
| Static DOM IDs | 525/525 unique | 0 duplicates |
| Standalone modules | 21/21 synchronized | Exact parity |
| Worker syntax | 3/3 | Whisper, RMBG, Depth |
| P74/P81 source contract | 18/18 | No local vendor runtime; browser load not run |
| P85 source contract | 13/13 | Source, lazy loading, SHA manifest contract |
| P85 lazy browser boot | 10/10 | Runtime not imported; no network at boot |
| P102/P105 worker contract | 19/19 | Worker/runtime wiring; no ONNX inference |
| P107 portable ZIP | 14/14 | v1/v2, security, dimensions, rollback |
| P106 browser fallback | 14/14 | Headless 2D mode only on this exact rerun |
| P55/P56/P62 browser | 24/24 / 27/27 / 32/32 | Synthetic Chromium / about:blank |
| P63–P67 / P68–P70 browser | 43/43 / 17/17 | Synthetic timeline and fail-closed release gate |
| P82/P84 PDF | 28/28 | Vietnamese text, vector/raster structure, reader parsing |
| P90–P96 / P87 / P88 | 34/34 / 14/14 / 14/14 | Synthetic UX and OOXML export |
| P97–P101/P104 | NOT COUNTED — exact-current rerun timed out | Prior 35/35 belongs to the preceding same-marker run, not this refresh |
| P72/P73/P102/P103/P105–P107 API | 8/8 / 9/9 / 11/11 / 10/10 / 18/18 | API contracts only |
| LibreOffice Writer/Impress | PASS | Open/edit/save/reopen; not Microsoft/Google certification |

### Exact-current blockers
- P74/P81 exact-current vendor smoke was attempted and stopped because the vendor manifest is absent; compressed Draco/Meshopt/KTX2 decoder fixtures are not present locally; the browser smoke stops because the Three.js manifest is missing. Container DNS cannot resolve GitHub/npm.
- P85 vendor runtime browser smoke was not run; `assets/p85` is not populated. Source contract/lazy boot do not prove actual renderer/OpenCV/dotLottie/Rive runtime behavior.
- P102/P105 model inference was not run.
- Current headed P106 Xvfb/SwiftShader test timed out and is not counted; the current 14/14 is headless fallback. No physical GPU result.
- P107 ZIP worked in a fresh browser context; physical two-device and Project Vault native restore are not verified.
- P70 reports 14/14 real-world gates OPEN. Production HTTPS/security headers, CSP/CORS/worker MIME, accessibility/browser matrix, A/V sync, long render, Office cross-application and print prepress remain open.

### Repository, CI and deployment
- Candidate workflow YAML parses, exact `index.html` SHA is pinned, P74/P81/P85 vendor steps are configured and workflow output blocks deploy unless P70 returns `releaseCertified:true` and `releaseStatus:CERTIFIED`.
- The P70 smoke currently returns `BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE`, `releaseCertified:false`; deploy should be skipped. No hosted Actions run, PR, merge or Pages deployment is claimed for this local candidate.
- P108 remains undefined. CANVIO is not Stable.


### P85 exact-source lifecycle refresh
- P85 source contract: **13/13 PASS**; exact-current lazy boot: **10/10 PASS**.
- `inspect().version` parity and OpenCV temporary Mat disposal are checked.
- Exact `index.html`: 4,921,610 bytes; SHA-256 `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82`.
- Runtime bundles/model inference/hardware acceptance are still NOT RUN; P97–P101/P104 exact-current browser rerun timed out and is not counted in this refresh.


### Browser/Office evidence refreshed after P85 fix
- P55 24/24; P56 27/27; P62 32/32; P63–P67 43/43; P68–P70 17/17; P82/P84 28/28; P85 lazy boot 10/10; P87 14/14; P88 14/14; P90–P96 34/34; P106/P107 14/14.
- P97–P101/P104 exact-current rerun timed out before final output and is not counted; the preceding same-marker 35/35 is historical evidence only.
- LibreOffice Writer/Impress 25.2.3.2 open/edit/save/reopen PASS with Vietnamese content and marker retained; post-save ZIP CRC PASS.


## Exact-current clean rerun addendum — 2026-11-18

The earlier timeout notes in this matrix are superseded by these clean reruns on the same exact index bytes; application source was unchanged.

| Check | Current result | Boundary |
|---|---:|---|
| P97–P101/P104 browser | **35/35 PASS** | Synthetic `about:blank`, test storage; no real A/V sync or long-form proof |
| P106 headed WebGL | **14/14 PASS** | Xvfb + ANGLE SwiftShader software backend; not physical GPU |
| P106 headless fallback | **14/14 PASS** | Explicit 2D Ken Burns fallback |
| P107 portable ZIP | PASS in both P106 modes | Exact three files, CRC and fresh isolated browser-context import; not physical devices / Project Vault |
| Source suite P74/P81 | **18/18 PASS** | Contract only; vendor runtime absent |
| Source suite P85 | **13/13 PASS** | Contract only; vendor runtime absent |
| Worker contract P102/P105 | **19/19 PASS** | No real ONNX/Whisper inference |
| P107 source/security suite | **14/14 PASS** | Parser, CRC, dimension, rollback contract |
| Static audit | **111/111 scripts; 525 IDs; 21/21 modules; 3/3 workers** | Exact current index |

**Unchanged release blockers:** actual P74/P81/P85 vendor runtime, compressed decoder fixtures, P80/P102/P105 inference, physical GPU, physical two-device/Project Vault restore, production HTTPS/CSP/CORS/worker MIME, accessibility/browser matrix, media A/V sync and all 14 P70 acceptance gates. `releaseCertified:false`; do not deploy or mark Stable.

GitHub `main` remains the P70 baseline (`f681c1239dc56968dde338e1c33aa4b63002665a`). The successful Actions run observed for this repository is against an older P70 commit; it is not evidence for this local 23.3.108 candidate. No PR/merge/deploy is claimed. Full evidence: `tests/release/exact-current-refresh-report.json`.


## Maintenance patch 23.3.109 — runtime provisioning safety

| Check | Result | Boundary |
|---|---:|---|
| Three.js/P85 provisioner shell syntax | PASS | Static shell parser only |
| Shared atomic vendor activator | PASS | Previous tree retained until new staged tree is ready |
| Activator success replacement | PASS | Regression fixture |
| Activator failure rollback | PASS | Injected second-move failure |
| P74/P81 source contract | 18/18 PASS | No vendor binaries/decoder fixture execution |
| P85 source contract | 13/13 PASS | No actual runtime bundle execution |
| P102/P105 worker contract | 19/19 PASS | No ONNX model inference |
| P107 ZIP contract | 14/14 PASS | No physical two-device/Project Vault test |
| P85 lazy browser boot | 10/10 PASS | Runtime capability absent; no external requests |
| P70 Stable acceptance | OPEN | Fourteen real-world gates still require evidence |

Application index is unchanged. Hosted CI, merge and production deployment are not verified for this patch.


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
