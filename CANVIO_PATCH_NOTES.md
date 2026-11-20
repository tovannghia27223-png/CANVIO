# CANVIO 23.3.111 patch notes

- Added GitHub-hosted build and acceptance for candidate source restoration, pinned vendor runtimes, module extraction, source contracts and runtime inference.
- Added local same-origin runtime packages and SHA-256 manifests for Three.js r187, Draco, Meshopt, Basis/KTX2, PostFX, OpenCV, dotLottie, Rive, Transformers.js and ONNX WASM.
- Corrected P80/P102/P105 workers to import the local Transformers.js runtime and preserve the application message contracts.
- Added portable P107 parser/import/rollback tests and explicit documentation that Project Vault cloud sync is not implemented.
- Added P145.2 local WebGL shader transitions/effects, Canvas2D fallback, PNG export and an optional P79-muxed video-only transition MP4 path with hosted Chromium coverage.
- Stable release remains fail-closed at P70; no physical GPU or two-device certification is implied.

- P145.4b: add user-triggered official YouTube/Spotify/SoundCloud music preview using existing cue metadata; HTTPS allowlist, sandboxed iframe, no autoplay/capture/download; add hosted acceptance.
