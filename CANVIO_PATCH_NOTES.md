# CANVIO 23.3.111 patch notes

- Added GitHub-hosted build and acceptance for candidate source restoration, pinned vendor runtimes, module extraction, source contracts and runtime inference.
- Added local same-origin runtime packages and SHA-256 manifests for Three.js r187, Draco, Meshopt, Basis/KTX2, PostFX, OpenCV, dotLottie, Rive, Transformers.js and ONNX WASM.
- Corrected P80/P102/P105 workers to import the local Transformers.js runtime and preserve the application message contracts.
- Added portable P107 parser/import/rollback tests and explicit documentation that Project Vault cloud sync is not implemented.
- Added P145.2 local WebGL shader transitions/effects, Canvas2D fallback, PNG export and an optional P79-muxed video-only transition MP4 path with hosted Chromium coverage.
- Added P125.4 optional split-asset storyboard ZIP alongside the original self-contained HTML export; hosted Chromium verifies ZIP integrity and final relative-frame decoding offline. Audio and mobile/real-media acceptance remain open.
- Added P145.6–P145.10 Asset Library tools: 25 original SVG icons, six local typography presets, eight original SVG illustrations, and read-only asset search/quality gate, with Node and hosted Chromium acceptance.
- Stable release remains fail-closed at P70; no physical GPU or two-device certification is implied.

 
## P135.1 — Pixel Atelier adjustment stack (candidate)

- Added source module canvio-p135-adjustments.js and embedded lot canvio-lot135a.
- Nine adjustment layers with enable/disable, ordering, rename, delete, reset and stack undo/redo.
- Non-destructive CSS preview on the existing canvas; derived-canvas PNG/WebP export; saves a new flattened Asset Library file without overwriting source.
- Editable stack is session-only; project snapshot/restore integration remains open.
- Node and hosted Chromium tests are wired; results pending.

## P139.1 — Motion Lab parent/null + text animator (candidate)

- Added canvio-p139-motionlab.js, embedded as canvio-lot139.
- Adds Null Controller hierarchy, parent/unparent and composed transforms; per-grapheme rise/fade/scale/wave/tracking with P119 easing.
- Metadata reuses existing Motion Lab snapshot/restore; no second timeline/store.
- Node contracts passed in an earlier hosted run; Chromium acceptance pending after DOM insertion fixes.
- Precomp, motion blur and advanced animator selectors remain OPEN.
