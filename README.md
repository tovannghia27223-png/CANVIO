# CANVIO — Current Integration Candidate 23.3.108

**Application:** `23.3.108-p85-studio-r2` · **PhaseSuite:** `70.0.0` (retained)  
**Index:** `index.html` · **Bytes:** `4,921,610` · **SHA-256:** `1736457b13aa9db40d847ea065ea521328d247709664dde6b1d3781088869b82`  
**Disposition:** local integration candidate. P85 Studio source/UI and same-origin lazy runtime/provisioning path are integrated; generated vendor binaries are not present because this container cannot resolve npm/GitHub DNS. Candidate has not passed hosted Node 24 CI, is not on `main`, and is not deployed or production-certified. P70 has fourteen real-world acceptance gates open.

## What changed in 23.3.108
- **P85 Studio:** a single integrated panel adds postprocessing preview, true WebGPU-only path-tracing preview, OpenCV Lucas–Kanade optical flow, dotLottie playback and Rive playback. It reuses existing P72 model input, Asset Library and Video Engine ownership; it does not create another project store or timeline.
- **P85 lifecycle repair:** public/diagnostic version parity is checked; OpenCV `Mat` cleanup runs on success and error paths. Source contract **13/13**; Chromium lazy boot **10/10**.
- **P102/P105/P80:** workers use same-origin Transformers.js/ONNX WASM files provisioned by the pinned P85 script; model weights remain user-triggered and real inference is NOT RUN.
- **P106/P107 evidence:** P106 passes **14/14** in headless 2D fallback and **14/14** in headed Xvfb/ANGLE SwiftShader software WebGL. P107's exact portable ZIP imports in a fresh isolated browser context. No physical GPU or two-device Project Vault test is claimed.
- **P97–P101/P104:** exact-current Chromium rerun **35/35 PASS**, superseding the earlier timeout disposition.

## Architecture constraints retained

The candidate preserves the existing canonical Project Vault, Asset Library, Video Engine timeline, Unified Layers/history and existing backup owners. It adds no second project database, no fake cloud synchronization, no embedded API credentials and no automatic AI-provider requests.

## Current validation evidence

| Validation | Result | Boundary |
|---|---:|---|
| Inline JS parse | 111/111 | Static syntax only |
| Static DOM IDs | 525 unique | 0 duplicates |
| Standalone modules | 21/21 synchronized | Exact source/module check |
| Workers | 3/3 syntax | Not model inference |
| P74/P81 contract | 18/18 | Source contract only; vendor runtime absent locally |
| P85 source / lazy boot | 13/13 / 10/10 | Source and lazy-boot scope only; vendor runtimes absent |
| P107 preset transfer | 14/14 | ZIP v1 compatibility + v2 independent image dimensions and rollback |
| P102/P105 worker contract | 19/19 | Worker contract only; no ONNX inference |
| P97–P101/P104 browser | 35/35 | Exact-current Chromium editor/media suite |
| P106/P107 browser path | 14/14 per mode | Headless 2D fallback and headed Xvfb/SwiftShader WebGL; animated render, WebM handoff and isolated-client ZIP import |
| Manifest / ZIP | 155/155 + CRC PASS | 156 ZIP entries including manifest |
| Earlier source/browser regressions | See `CANVIO_FINAL_ACCEPTANCE_MATRIX.md` | Synthetic Chromium scopes; not production acceptance |

The hosted workflow must provision Three.js/decoder assets, run the local software-WebGL browser smoke, refresh and verify the manifest, and upload a complete delivery ZIP before this candidate is eligible for acceptance. That workflow has not yet been executed. The local package deliberately does not contain generated runtime binaries because this environment cannot reach upstream GitHub.

## Remaining acceptance gates (not waived)

- Real P102 background-removal and P105 depth-model inference on target browsers/devices.
- P106 depth-displacement WebGL on physical GPU; P74 software-WebGL is not physical GPU certification.
- Draco/Meshopt/KTX2 compressed-model fixture acceptance beyond module import and decoder wiring.
- Project Vault and true cross-device persistence. P107 portable ZIP is a manual transfer path.
- Real HTTPS origin, MIME/CSP/worker behavior, Safari/Edge, accessibility/assistive technology, native IndexedDB restart, A/V sync and production rollback/observability.
- P70 fourteen real-world release gates remain OPEN; `releaseCertified:false`. P85 source/UI and lazy-load/provisioning paths are integrated; generated vendor runtime initialization, WebGPU path tracing and model inference remain unverified.

## Build and test

```bash
bash scripts/vendor-three-r187.sh
python3 tests/release/run-static-audit.py
node tests/p74-p81/run-p74-p81-contract-tests.cjs
node tests/p102-p105/run-p107-portable-preset-tests.cjs
node tests/p102-p105/run-worker-contract-tests.cjs
python3 tests/p74-p81/run-p74-p81-browser-smoke.py
python3 tests/release/build-manifest.py --candidate 23.3.108-p85-studio-r2 --base 23.3.107-p107-preset-v2-r2 --release-base 23.3.84-p70
python3 tests/release/verify-manifest.py
```

The full inherited source/browser matrix is documented in `CANVIO_FINAL_ACCEPTANCE_MATRIX.md` and `CANVIO_QA_REPORT.md`. `CANVIO_AI_GUIDE.md` preserves the architecture and version history; read its latest section before making changes. `CANVIO_HANDOFF.md` identifies the exact current boundary.

P108 is not defined as a deliverable in the current Roadmap; no feature is claimed for it. P85 source/UI is integrated; actual vendor runtime loading and model inference remain OPEN because generated local runtime assets are not yet present.

## Deployment status

At last live repository inspection, GitHub `main` was still `f681c1239dc56968dde338e1c33aa4b63002665a`, and Pages run #105 deployed the P70 source. This 23.3.108 candidate is not yet on `main` and not live. The candidate workflow is designed to deploy only through a manual `workflow_dispatch` with `deploy_candidate=true`; do not treat CI validation as approval to deploy.

## Continuation verification — 2026-11-18

The latest local recheck and packaging repair are recorded in `CANVIO_QA_REPORT.md` section 28 and `CANVIO_AI_GUIDE.md` section 104. Static/source regressions and the runnable synthetic browser suites passed in their declared scopes. Upstream vendor provisioning failed locally due to unavailable DNS for `github.com`; therefore this source archive does not contain `assets/three` and P74 software-WebGL runtime acceptance remains pending the online Node 24 workflow. The repository's `main` branch remains at the P70 baseline; no production deployment is claimed.


## Continuation validation — 2026-11-18

- This earlier 8/8 fallback-only note is superseded by the latest dual-renderer tests: **14/14 headless 2D fallback** and **14/14 headed ANGLE SwiftShader WebGL**. The shader and animation were exercised in software WebGL; this is not physical-GPU certification.
- P87/P88 synthetic DOCX/PPTX passed LibreOffice Writer/Impress 25.2.3.2 open/edit/save/reopen with Vietnamese text/marker persistence and valid ZIP CRC. This is not Microsoft Office/Google Workspace certification.
- P74/P81 vendor binaries, P102/P105 real inference, physical GPU, P107 cross-device restore and P70 real-world gates remain open. This candidate is not Stable or deployed.


## Historical version notes — 23.3.107 and earlier

The following sections preserve earlier release snapshots. Their old counts and OPEN states are historical, superseded by the 23.3.108 snapshot and `CANVIO_AI_GUIDE.md` section 104 above.

### 23.3.107 — P107 portable preset ZIP v2 repair

- Portable preset manifest v2 separates source-image and depth-map dimensions; v1 bundles remain importable. Strict archive checks, CRC32, PNG validation, allowlist and rollback remain.
- Reproduced browser round-trip with 160×100 source and 96×64 depth PNG: actual ZIP export/import passed, three entries and CRC valid, strength `0` retained. P107 source 14/14; P106/P107 browser flow 14/14 in both headless fallback and SwiftShader WebGL modes, including animation, WebM handoff and second isolated client ZIP import.
- Updated the delayed title observer so it recognizes the current build marker. P82/P84 28/28; P87 14/14; P88 14/14; P90–P96 34/34; P97–P101/P104 35/35; LibreOffice Writer/Impress round-trip passed.
- P74/P81 vendor runtime still absent locally; P102/P105 real inference not run; P106 physical GPU not tested (SwiftShader only); P107 physical-device/Project Vault round-trip remains untested. P85 remains OPEN/unimplemented.
- GitHub `main` remains P70; not merged, not deployed, not Stable. P70's 14 real-world gates remain OPEN.


## Latest continuation — 23.3.107-p107-preset-v2-r2

- Index SHA-256 `ea758d17fa94bab1167e0a5792b0c806045b6102e1dfe5d4306603cbf8048687` (4,890,301 bytes).
- P106/P107 browser tests now pass **14/14 in each mode**: explicit Ken Burns 2D fallback and headed SwiftShader WebGL shader/animation; actual WebM handoff to Asset Library/Video Engine and portable ZIP import into a fresh isolated browser context. The WebGL backend is software-rendered, not physical GPU, and depth data is synthetic.
- P107 source suite 14/14; P74/P81 contract 18/18; P102/P105 worker contract 17/17; static audit 110/110 scripts, 524 IDs, 20/20 modules and 3/3 workers.
- P82 localhost HTTP test is blocked by browser sandbox policy; vendor Three.js runtime, real AI inference, physical GPU, physical two-device/Project Vault, production HTTPS and remaining P70 gates are open. Not Stable, not merged and not deployed.


## Latest continuation — `23.3.108-p85-studio-r2`

P85 Creative Runtime Studio is now integrated in source: lazy PostFX, WebGPU path tracing, OpenCV optical flow, dotLottie and Rive loaders. `scripts/vendor-p85-runtimes.sh` provisions pinned same-origin packages/WASM with SHA-256 manifest and upstream licenses. P102/P105/P80 workers now use the self-hosted Transformers.js/ONNX assets provisioned by that script; model weights are still user-triggered.

Latest exact-source results: static 111/111 scripts, 525 unique DOM IDs, 21/21 modules and 3/3 workers; P85 contract 13/13 + lazy boot 10/10; P102/P105 worker contract 19/19; P107 ZIP 14/14. Browser regressions: P55 24/24, P56 27/27, P62 32/32, P63–P67 43/43, P68–P70 17/17, P82/P84 28/28, P90–P96 34/34, P87/P88 14/14 each; P97–P101/P104 exact-current rerun 35/35 PASS; P106 headless fallback and headed SwiftShader WebGL 14/14 per mode; P107 ZIP import passes in an isolated browser context. LibreOffice Writer/Impress round-trip passed.

**Not accepted:** vendor runtime binaries could not be installed because this environment cannot resolve npm/GitHub DNS. P74/P81 runtime tests, P85 actual runtimes, P102/P105 model inference, current P106 headed software SwiftShader WebGL (14/14 PASS; not physical GPU), P107 physical two-device Project Vault and production-origin acceptance remain open. P70's fourteen release gates remain open; CI deploy is fail-closed until `releaseCertified:true` and `releaseStatus:CERTIFIED`. This is not a Stable or deployed release. Full evidence is in `CANVIO_QA_REPORT.md` section 28, `CANVIO_AI_GUIDE.md` section 104 and `tests/release/exact-current-refresh-report.json`.


### P85 lifecycle refresh
P85 contract is now 13/13 and the exact-current lazy-boot suite is 10/10. The latest hardening fixes version-report parity and OpenCV Mat cleanup on exceptions. Runtime binaries and model inference remain pending; no Stable or hosted deployment claim is made.


## Exact-current test rerun — 2026-11-18

The previous P97 and headed P106 timeout notes are superseded by clean exact-source reruns: P97–P101/P104 **35/35 PASS**, P106 headless fallback **14/14 PASS**, P106 headed SwiftShader WebGL **14/14 PASS**. P106 exports WebM to the existing Asset Library/Video Engine and verifies P107 ZIP import in a fresh isolated browser context. SwiftShader is a software renderer, not a physical GPU.

The static/source regression matrix also passed on this exact candidate: 111 inline scripts, 525 unique IDs, 21/21 standalone modules, 3/3 workers; P74/P81 source 18/18, P85 source 13/13, P102/P105 worker contract 19/19 and P107 14/14. All limits remain explicit: vendor runtime binaries are not locally provisioned due to npm/GitHub DNS failure; real model inference and physical GPU are not tested; P70's fourteen real-world gates remain open.

GitHub `main` remains the older P70 baseline; the green hosted run is for that earlier source, not this local candidate. This build is not merged, deployed or Stable. See `CANVIO_AI_GUIDE.md` section 104 and `tests/release/exact-current-refresh-report.json`.

### Vendor provisioning safety patch (23.3.109)
The Three.js r187 and P85 runtime provisioning scripts build into staging directories and activate only after their files, licenses and SHA manifests validate. `scripts/activate-vendor-tree.sh` retains the previous known-good runtime tree and rolls back a failed activation. Run `bash tests/vendor/test-activate-vendor-tree.sh` to verify replacement and rollback behavior.
