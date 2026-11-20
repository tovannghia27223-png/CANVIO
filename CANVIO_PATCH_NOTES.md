# CANVIO 23.3.111 patch notes

- Added GitHub-hosted build and acceptance for candidate source restoration, pinned vendor runtimes, module extraction, source contracts and runtime inference.
- Added local same-origin runtime packages and SHA-256 manifests for Three.js r187, Draco, Meshopt, Basis/KTX2, PostFX, OpenCV, dotLottie, Rive, Transformers.js and ONNX WASM.
- Corrected P80/P102/P105 workers to import the local Transformers.js runtime and preserve the application message contracts.
- Added portable P107 parser/import/rollback tests and explicit documentation that Project Vault cloud sync is not implemented.
- Added P145.2 local WebGL shader transitions/effects, Canvas2D fallback, PNG export and an optional P79-muxed video-only transition MP4 path with hosted Chromium coverage.
- Added P125.4 optional split-asset storyboard ZIP alongside the original self-contained HTML export; hosted Chromium verifies ZIP integrity and final relative-frame decoding offline. Audio and mobile/real-media acceptance remain open.
- Added P145.6–P145.10 Asset Library tools: 25 original SVG icons, six local typography presets, eight original SVG illustrations, and read-only asset search/quality gate, with Node and hosted Chromium acceptance.
- Stable release remains fail-closed at P70; no physical GPU or two-device certification is implied.

- Mainline consolidation (2026-11-21): P125.4 merged via PR #32 and P145.6–P145.10 via PR #33; their hosted Node/Chromium acceptance evidence is recorded in QA and the AI Guide. P70 remains fail-closed with fourteen manual production gates open.

- P132.3 candidate: added bounded animated WebP beside GIF/APNG using native browser WebP encoding and local RIFF muxing; no external encoder or paid dependency. Corrected the hosted RIFF parser and added Chromium native decode checks after run #300 exposed test-verification defects; acceptance remains pending until the rebased workflow passes.
