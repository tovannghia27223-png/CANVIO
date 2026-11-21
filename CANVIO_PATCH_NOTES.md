# CANVIO 23.3.111 patch notes

- Added GitHub-hosted build and acceptance for candidate source restoration, pinned vendor runtimes, module extraction, source contracts and runtime inference.
- Added local same-origin runtime packages and SHA-256 manifests for Three.js r187, Draco, Meshopt, Basis/KTX2, PostFX, OpenCV, dotLottie, Rive, Transformers.js and ONNX WASM.
- Corrected P80/P102/P105 workers to import the local Transformers.js runtime and preserve the application message contracts.
- Added portable P107 parser/import/rollback tests and explicit documentation that Project Vault cloud sync is not implemented.
- Added P145.2 local WebGL shader transitions/effects, Canvas2D fallback, PNG export and an optional P79-muxed video-only transition MP4 path with hosted Chromium coverage.
- Added P125.4 optional split-asset storyboard ZIP alongside the original self-contained HTML export; hosted Chromium verifies ZIP integrity and final relative-frame decoding offline. Audio and mobile/real-media acceptance remain open.
- Added P145.6–P145.10 Asset Library tools: 25 original SVG icons, six local typography presets, eight original SVG illustrations, and read-only asset search/quality gate, with Node and hosted Chromium acceptance.
- Stable release remains fail-closed at P70; no physical GPU or two-device certification is implied.

- P145.10 mainline acceptance: PR #38 merged; hosted run #310 PASS. Node 10/10; Chromium 14/14; actual local-byte SHA-256, duplicate detection and read-only/no-vault-mutation assertions passed. Artifact 21,579,190 bytes; SHA-256 `302274465126dec415716d796981168ed96fc0d2091514581725557e67a22843`. Scan remains user-triggered and bounded (40 assets / 25 MiB per asset / 64 MiB total).
- P136.4 superseding status: merged PR #39; hosted run #312 PASS. Six static SVG pattern fills, limited to multicolour Image Trace.
- P131.3 superseding status: merged PR #41; hosted run #315 PASS. Safe local HTML body-fragment import, max 5 MiB, with the existing sanitizer/Website Engine save path.
- All three updates retain their stated scope limits. P70 remains fail-closed with fourteen manual real-world gates open.

- PR #44 docs/release reconciliation: hosted workflow #320 PASS (all verify job steps succeeded; final PR-only commit step skipped by design). Artifact 21,602,814 bytes; SHA-256 `74cb03f31a7c55d94f69376b74f46a22bef1538b473aeca1165c42296f2e69ba`.
- Scope audit correction: Roadmap explicitly says P122.3 MCP is not done; P124 Auto Layout/Component, P133 OPFS/proxy and P143 full modularization have no owner/tests in main; P144 is partly covered by P109 and needs parity review, not a duplicate palette.
- P142 Pages deployment on main run #192 succeeded (build, status, deploy jobs); real-origin and target-device acceptance remain open.
- P70 remains fail-closed; fourteen real-world gates are still pending.
