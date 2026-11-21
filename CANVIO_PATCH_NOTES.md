# CANVIO 23.3.111 patch notes

- Added GitHub-hosted build and acceptance for candidate source restoration, pinned vendor runtimes, module extraction, source contracts and runtime inference.
- Added local same-origin runtime packages and SHA-256 manifests for Three.js r187, Draco, Meshopt, Basis/KTX2, PostFX, OpenCV, dotLottie, Rive, Transformers.js and ONNX WASM.
- Corrected P80/P102/P105 workers to import the local Transformers.js runtime and preserve the application message contracts.
- Added portable P107 parser/import/rollback tests and explicit documentation that Project Vault cloud sync is not implemented.
- Added P145.2 local WebGL shader transitions/effects, Canvas2D fallback, PNG export and an optional P79-muxed video-only transition MP4 path with hosted Chromium coverage.
- Added P125.4 optional split-asset storyboard ZIP alongside the original self-contained HTML export; hosted Chromium verifies ZIP integrity and final relative-frame decoding offline. Audio and mobile/real-media acceptance remain open.
- Added P145.6–P145.10 Asset Library tools: 25 original SVG icons, six local typography presets, eight original SVG illustrations, and read-only asset search/quality gate, with Node and hosted Chromium acceptance.
- Stable release remains fail-closed at P70; no physical GPU or two-device certification is implied.
 
## P135.1 — Pixel Atelier adjustment stack (current-main candidate · 2026-11-21)

- Candidate branch: `work/canvio-p135-mainline-20261121`; source `canvio-p135-adjustments.js`; embedded lot `canvio-lot135a`; API `window.CVPixelAdjustmentsP135`.
- Nine bounded adjustment types: brightness, contrast, saturation, hue, blur, grayscale, sepia, invert and opacity. Supports ordered stack, enable/disable, rename, reorder, delete, reset and stack-local undo/redo; maximum 32.
- Non-destructive preview uses CSS filters on the existing Pixel canvas. PNG/WebP exports render to a derived canvas; Asset Library saves a new flattened PNG via the existing `CV.assets.addBlob` owner. Original raster remains unchanged.
- The editable stack is tab-memory only in this first increment because Pixel `snapshotState()` currently returns a flattened PNG data URL. Page reload/new source clears the stack; flattened exports are not reversible adjustment projects. No second store/DB/timeline/provider/CDN was added.
- Node parity/model suite: `tests/p127/run-p135a-tests.cjs`; hosted same-origin browser suite: `tests/p145/run-p135-browser.py`. Current-main hosted result is pending; do not record PASS before reviewing its exact run.
- P135 remains PARTIAL. Editable stack project persistence, masks/local adjustments, smart objects, clone/patch and liquify remain OPEN.
