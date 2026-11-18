# CANVIO — Prompt for separate AI acceptance and continuation

You are receiving CANVIO local integration candidate `23.3.107-p107-preset-v2-r2`. Before editing, read `CANVIO_AI_GUIDE.md` sections 97–102, `CANVIO_ROADMAP.md` latest addendum, `CANVIO_HANDOFF.md` current handoff and `CANVIO_QA_REPORT.md` section 21. Do not scan the entire HTML unless a specific unresolved issue requires it.

## Current source
- `index.html` SHA-256: `ea758d17fa94bab1167e0a5792b0c806045b6102e1dfe5d4306603cbf8048687` (4,890,301 bytes).
- Application marker: `23.3.107-p107-preset-v2-r2`; PhaseSuite `70.0.0` remains unchanged.
- P102 worker: `assets/canvio-rmbg-worker.js`; P105 worker: `assets/canvio-depth-worker.js`; model/runtime boundaries are documented in `assets/AI-MODEL-NOTICES.md`.

## Latest local checks (18 Nov 2026)
- Static audit: 110/110 inline scripts, 524/524 IDs unique, 0 duplicates, 0 external script src, 20/20 modules synchronized, 3/3 worker syntax PASS.
- Source suites: P47 fixtures PASS; P48 26/26; P49 35/35; P50 27/27; P55 49/49; P56 27/27; P57–P62 15/15; P63–P67 18/18; P68–P70 16/16; P74/P81 18/18; P107 14/14; P102/P105 worker contract 17/17; boot HTTP(S) requests 0.
- Chromium: P55 24/24; P56 27/27; P62 32/32; P63–P67 43/43; P68–P70 17/17; P72/P73/P102/P103/P105–P107 API contracts 8/8, 9/9, 11/11, 10/10, 18/18; P82/P84 28/28; P87 14/14; P88 14/14; P90–P96 34/34; P97–P101/P104 35/35.
- P97–P101 WebM synthetic export returned null once, then passed in an instrumented run and a clean rerun. Repeat on your environment.
- Exact SHA and size appear above; verify the manifest before accepting the delivery archive.

## Candidate CI wiring
The local candidate workflow `.github/workflows/canvio-pages-node24.yml` now runs P55/P56/P62 Chromium smokes plus the P72/P73/P102/P103/P105–P107 browser API smoke. It refreshes and verifies the manifest after reports are created and uploads the evidence artifact. Do not infer that it ran on GitHub `main`; the live repository workflow still targets the P70 baseline.

## First acceptance tasks
1. Run the candidate Node 24 workflow on a PR branch. It must provision Three.js r187/Draco/Meshopt/KTX2, verify `THREE-VENDOR-MANIFEST.json`, run P74/P81 SwiftShader smoke, refresh the manifest and package ZIP. The workflow references `tests/release/package-delivery.py`, which is included in this candidate.
2. On that hosted run, verify the vendor script creates every required local asset and the P74 browser smoke imports/loads the uncompressed GLB. Then add and run representative compressed Draco/Meshopt/KTX2 fixture decoding; current smoke does not certify compressed sample decoding.
3. Run real P102 ORMBG inference with portrait/product/pet/glass/complex-hair fixtures. Confirm RGBA alpha, dimensions, visual edges, cancellation, worker unload and memory.
4. Run real P105 Depth Anything inference on indoor/outdoor/portrait/product scenes; verify `output.depth`, normalization, depth-map orientation, halos/holes, cancellation and model unload. Validate WebGPU fp16 and WASM fallback paths on real Chrome/Edge hardware.
5. Test P72/P74 live GLB rendering and P106 depth-parallax WebGL on physical GPU. The existing headless fallback is Ken Burns 2D, not depth parallax.
6. Test P73 offline Website packaging on representative GrapesJS sites with CSS, JS, fonts, images, routes, ESM, iframe and runtime network references. Unsupported paths must fail closed.
7. Test P107 backup/restore and portable ZIP on two physical devices; verify real Project Vault and native IndexedDB persistence. Complete real HTTPS, Safari/Edge, accessibility, A/V sync and production security/rollback gates. Keep P70 fourteen release gates OPEN until evidence is attached.

## Integration status / remaining roadmap items
Use the current P-map in `CANVIO_AI_GUIDE.md` sections 97–102. P74/P81 code and provisioning are now integrated but hosted vendor runtime validation and compressed sample decode remain open. P85 is OPEN and must be implemented because the user explicitly requested all P70–P107 roadmap items. P79 remains limited to silent image/text MP4 timelines; P80 real Whisper inference is untested; P97–P101 still need full A/V sync, long-form export and acoustic word-level subtitle alignment; P102/P105 real model inference, P106 physical GPU and P107 physical-device/Project Vault round-trip remain open. P108 is not specified in the current Roadmap.

## Constraints
- Preserve `CV.engines.video`, `CV.assets`, existing Brand Kit, `CANVIOPersistentProjects`, `CVUnifiedLayers`, `CVZip`, Poster/Website/CV/Slide owners.
- No second project/database/timeline/history store, no fake cloud sync, no API secrets in source, no background provider requests.
- User prefers free-only dependencies; inspect license, maintenance, bundle/runtime cost and browser compatibility before adding anything.
- Update AI Guide, Roadmap, QA, Handoff, manifest and this prompt in the same change. Preserve prior version history.
- Do not claim Stable, commit, merge or deploy without explicit authorization and evidence.


## 23.3.106 P74/P81 integrity and packaging hardening
- P74 verifies the required same-origin vendor asset byte lengths and SHA-256 hashes against the pinned r187 manifest on explicit 3D load. `redirect:error` blocks external redirect following. P74/P81 isolated contract suite: 18/18.
- P107 portable ZIP suite: 11/11; P102/P105 worker static contract: 17/17. Both remain synthetic/static; no ONNX inference or device-to-device sync was executed.
- `tests/release/package-delivery.py` now exists and packages the verified manifest list deterministically, CRC-tests the ZIP and writes a SHA-256 sidecar.
- Google Fonts preconnect, stylesheet and active CSS @import are absent at boot; P68–P70 browser smoke confirms zero startup HTTP(S) requests.
- Keep P70 gates, real ONNX inference, vendor-backed P74 runtime/decoder checks, compressed GLB sample decoding, physical WebGPU/WebGL, hosted HTTPS/CSP/worker MIME, Project Vault sync, and real A/V sync OPEN until tested.

## Latest continuation blocker — 2026-11-18
- Rechecked exact 23.3.106 source: audit 110/110 scripts, 524 unique IDs, 20/20 standalone modules, 3 workers; P74/P81 contract 18/18, P107 11/11, P102/P105 worker contract 17/17; P97 browser smoke 35/35; P72/P73/P102/P103/P105–P107 API smoke all pass; P82/P84 28/28.
- The local vendor provision attempt failed before modifying the tree because GitHub DNS was unavailable. `assets/three` is intentionally absent. Run the online Node 24 workflow on a candidate PR and verify P74 SwiftShader runtime imports/render before release.
- Remote `main` remains P70 (`f681c1239dc56968dde338e1c33aa4b63002665a`); no 23.3.106 PR/workflow run is present. Do not deploy or merge based on local synthetic tests.
- Rebuild/verify manifest after any test report changes. Current local package must be labeled source handoff, not complete 3D runtime delivery.


## 23.3.107 P107 v2 continuation — 2026-11-18
- Current marker: `23.3.107-p107-preset-v2-r2`; current index SHA-256 `ea758d17fa94bab1167e0a5792b0c806045b6102e1dfe5d4306603cbf8048687`; 4,890,301 bytes.
- P107 ZIP v2 separates source/depth dimensions, remains backward-compatible with v1, and passes Node 14/14 plus actual synthetic-browser ZIP export/import into a fresh isolated client; P106 headless fallback and Xvfb/SwiftShader WebGL animation/WebM export 14/14 per mode (160×100 source, 96×64 depth, strength 0).
- Fixed delayed legacy title observer; current P82/P84 28/28, P87 14/14, P88 14/14, P90–P96 34/34 and P97–P101/P104 35/35. LibreOffice Writer/Impress round-trip PASS.
- P74/P81 binaries still absent locally due no upstream network; real compressed decoders and hosted CI are OPEN. P102/P105 inference NOT RUN; P106 passes with headed ANGLE SwiftShader WebGL and headless fallback, but physical GPU is untested; P107 physical two-device/Project Vault round-trip untested. P85 OPEN/unimplemented; P70 14 gates OPEN; no deploy.


## Latest dual-renderer confirmation — 23.3.107-p107-preset-v2-r2
- Index SHA `ea758d17fa94bab1167e0a5792b0c806045b6102e1dfe5d4306603cbf8048687`, 4,890,301 bytes. P106: 14/14 headless fallback and 14/14 headed Xvfb/ANGLE SwiftShader WebGL. The WebGL shader/animation and WebM export/handoff were exercised on software rendering only.
- P107 14/14 source tests; browser ZIP export/CRC + same-browser and isolated-client import pass; physical devices/Project Vault remain open.
- P82/P84 28/28; P87 14/14; P88 14/14; P90–P96 34/34; P97–P101/P104 35/35; earlier suites and boundaries in QA/Acceptance Matrix.
- P74/P81 vendor binaries cannot be provisioned in this offline environment; P102/P105 inference not run; P85 deferred; P70 14 gates remain open. P82 HTTP localhost test blocked by browser policy. Do not call Stable or deployed.


## Session 2 (2026-11-18) — start here
Chạy `bash scripts/run-real-acceptance.sh` trên máy có mạng trước tiên, rồi làm theo `CANVIO_REAL_ACCEPTANCE_RUNBOOK.md`. Sửa lỗi nảy sinh từ FAIL thật trong `evidence/real-acceptance/*.log`; giữ nguyên quy tắc: không thư viện giả, không đánh dấu PASS khống, không xoá tính năng cũ, chỉ gộp/cập nhật, free-only, cập nhật Guide/QA/Handoff/manifest cùng lượt.
