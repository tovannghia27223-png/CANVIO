# CANVIO 23.3.111 patch notes

- Added GitHub-hosted build and acceptance for candidate source restoration, pinned vendor runtimes, module extraction, source contracts and runtime inference.
- Added local same-origin runtime packages and SHA-256 manifests for Three.js r187, Draco, Meshopt, Basis/KTX2, PostFX, OpenCV, dotLottie, Rive, Transformers.js and ONNX WASM.
- Corrected P80/P102/P105 workers to import the local Transformers.js runtime and preserve the application message contracts.
- Added portable P107 parser/import/rollback tests and explicit documentation that Project Vault cloud sync is not implemented.
- Added P145.2 local WebGL shader transitions/effects, Canvas2D fallback, PNG export and an optional P79-muxed video-only transition MP4 path with hosted Chromium coverage.
- Added P125.4 optional split-asset storyboard ZIP alongside the original self-contained HTML export; hosted Chromium verifies ZIP integrity and final relative-frame decoding offline. Audio and mobile/real-media acceptance remain open.
- Added P145.6–P145.10 Asset Library tools: 25 original SVG icons, six local typography presets, eight original SVG illustrations, and read-only asset search/quality gate, with Node and hosted Chromium acceptance.
- Stable release remains fail-closed at P70; no physical GPU or two-device certification is implied.

- P132.3 candidate: added bounded animated WebP beside GIF/APNG using native browser WebP encoding and local RIFF muxing; no external encoder or paid dependency. Corrected the hosted RIFF parser and added Chromium native decode checks after run #300 exposed test-verification defects; acceptance remains pending until the rebased workflow passes.

- P132.3 verification follow-up: run #303 confirmed 10 valid ANMF/VP8 frame chunks and Chromium decoded 200×113; fixed final browser assertion to use canvas-derived height (the prior test incorrectly expected 200 px). ffprobe WebP output remains diagnostic only on this runner; corrected hosted rerun pending.

- P132.3 animated WebP hosted acceptance passed in run #304 (`44809678883`): RIFF/VP8X/ANIM/10×ANMF validation, per-frame VP8 payloads, 200×113 canvas/frame dimensions, 200 ms delay and Chromium `createImageBitmap` decode; no browser failures/page errors. Full hosted candidate workflow passed. Manual real-media/mobile/color/memory checks remain open.

- P145.10 candidate: bounded, user-triggered SHA-256 over actual bytes in the canonical local `CV.assets.list()` data URLs; session-only duplicate detection, no asset mutation, no network or new store (40 rows / 25 MiB per row / 64 MiB per scan). Corrected earlier note: default provider already reads the existing local Asset Library; what was missing was automatic byte hashing. hosted verification PASS in run #308.

- Hosted acceptance run #308 (`44811157725`) passed: Node 10/10, Chromium 14/14; native `CV.assets.list()` provider, valid SHA-256, byte-level duplicate detection and zero Asset Library mutation confirmed; `pageErrors: []`, `failed: []`.

