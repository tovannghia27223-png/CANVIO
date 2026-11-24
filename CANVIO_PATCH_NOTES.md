# CANVIO 23.3.111 patch notes

- Added GitHub-hosted build and acceptance for candidate source restoration, pinned vendor runtimes, module extraction, source contracts and runtime inference.
- Added local same-origin runtime packages and SHA-256 manifests for Three.js r187, Draco, Meshopt, Basis/KTX2, PostFX, OpenCV, dotLottie, Rive, Transformers.js and ONNX WASM.
- Corrected P80/P102/P105 workers to import the local Transformers.js runtime and preserve the application message contracts.
- Added portable P107 parser/import/rollback tests and explicit documentation that Project Vault cloud sync is not implemented.
- Added P145.2 local WebGL shader transitions/effects, Canvas2D fallback, PNG export and an optional P79-muxed video-only transition MP4 path with hosted Chromium coverage.
- Added P125.4 optional split-asset storyboard ZIP alongside the original self-contained HTML export; hosted Chromium verifies ZIP integrity and final relative-frame decoding offline. Audio and mobile/real-media acceptance remain open.
- Added P145.6–P145.10 Asset Library tools: 25 original SVG icons, six local typography presets, eight original SVG illustrations, and read-only asset search/quality gate, with Node and hosted Chromium acceptance.
- Added P132.1 local PDF page-to-PNG import using locally vendored PDF.js 6.5.438 (Apache-2.0), same-origin worker/CMaps/fonts, SHA-256 manifest, bounded one-page raster handoff into the existing Pixel Atelier owner, and Node/Chromium coverage.
- Added P163.1.1 visible labels for existing character-profile controls, preserving Shared Core, Asset Library and Storyboard ownership; P169 browser coverage checks visible field labels and profile round-trip.
- Added P161.2/P74.1 saved GLB camera-pose replay in the existing Three.js r187 viewer, including yaw/pitch/FOV/X-Y-Z, OrbitControls damping flush and same-origin GLB fixture checks.
- Added P166.2 brief-to-GrapesJS Website Engine handoff through P131 sanitization, scoped responsive CSS and the canonical save owner, with lazy-engine readiness and Chromium integration tests.
- Stable release remains fail-closed at P70; no physical GPU or two-device certification is implied.
