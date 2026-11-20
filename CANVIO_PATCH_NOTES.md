# CANVIO 23.3.111 patch notes

- Added GitHub-hosted build and acceptance for candidate source restoration, pinned vendor runtimes, module extraction, source contracts and runtime inference.
- Added local same-origin runtime packages and SHA-256 manifests for Three.js r187, Draco, Meshopt, Basis/KTX2, PostFX, OpenCV, dotLottie, Rive, Transformers.js and ONNX WASM.
- Corrected P80/P102/P105 workers to import the local Transformers.js runtime and preserve the application message contracts.
- Added portable P107 parser/import/rollback tests and explicit documentation that Project Vault cloud sync is not implemented.
- Added P145.2 local WebGL shader transitions/effects, Canvas2D fallback, PNG export and an optional P79-muxed video-only transition MP4 path with hosted Chromium coverage.
- Added P125.4 optional split-asset storyboard ZIP alongside the original self-contained HTML export; hosted Chromium verifies ZIP integrity and final relative-frame decoding offline. Audio and mobile/real-media acceptance remain open.
- Added P145.6–P145.10 Asset Library tools: 25 original SVG icons, six local typography presets, eight original SVG illustrations, and read-only asset search/quality gate, with Node and hosted Chromium acceptance.
- Stable release remains fail-closed at P70; no physical GPU or two-device certification is implied.



- P136.4 SVG pattern fills merged and hosted verified in workflow #312: six local pattern presets for the existing Image Trace multicolour mode; no paid dependency or external asset.
- P131.3 candidate adds bounded, sanitized local HTML import to Website Studio through the existing editor/save owner; 5 MiB cap, active content and remote image URLs removed. Hosted verification pending.



- P131.3 source/security import tests merged via PR #41; hosted run #315 PASS (31 Chromium checks, 0 page errors; app smoke 21/21 across 48 pages; full runtime workflow success). The generated mainline `index.html` embed is being promoted in the follow-up build PR.
