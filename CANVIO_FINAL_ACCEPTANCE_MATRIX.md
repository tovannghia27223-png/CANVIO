# CANVIO 23.3.111 final acceptance matrix

| Gate | Automated evidence | Current acceptance boundary |
|---|---|---|
| P74/P81 Three.js r187/Draco/Meshopt/KTX2 | Vendor manifest SHA + hosted GLB load | Compression fixtures must pass hosted runner before marking decoder acceptance |
| P85 PostFX/OpenCV/dotLottie/Rive | P85 vendor manifest, WASM initialization, PostFX render, optical-flow clip | Experimental WebGPU Path Tracing; player runtime, not animation authoring |
| P80/P102/P105 inference | Hosted model inference reports | Synthetic inputs prove pipeline execution only, not model accuracy |
| P106 rendering | Chromium WebGL/SwiftShader | Software GPU only; physical GPU and target-device performance remain open |
| P107 portability | ZIP CRC, independent Asset Library import and rollback tests | No cloud Project Vault sync or physical two-device acceptance claimed |
| P70 Stable release | Fourteen fail-closed manual gates | releaseCertified:false until every gate has reviewed production evidence |

## Required manual gates
1. HTTPS and supported browser matrix on deployed origin.
2. Native IndexedDB persistence, restore and quota behavior.
3. Real media recording/export A/V synchronization.
4. Whisper inference and transcription quality on representative labelled Vietnamese/English audio.
5. Keyboard, screen-reader and 200% reflow accessibility review.
6. Production CSP/CORS/COOP/COEP, worker MIME and security headers.
7. Real multi-track project timeline round-trip, undo/redo and recovery.
8. Real footage tracking and stabilization quality review.
9. User-selected AI provider output, licensing and provenance review.
10. Typography, font fallback, pagination, bleed and physical print/PDF review.
11. Offline OBJ package opened on a clean disconnected machine.
12. Physical target-device GPU/VRAM, performance and long-render testing.
13. Cross-origin backup/restore and independent-device recovery.
14. Rollback, release observability, alerting and production incident drill.


## Hosted evidence update — 2026-11-20 (23.3.111)

| Area | Latest hosted result | What remains unaccepted |
|---|---|---|
| P125.1 scroll-frame export | Runtime workflow #125 passed after ffmpeg was added to the runner; browser harness completed. | Real user codec/device matrix, mobile package optimization, storyboard editor and presets (P125.2–P125.4). |
| P127 video tools | Edit Plan 13/13; quality gate/EDL 14/14; LUFS/templates source tests OK; browser UI smoke 18/18. | Real media/audio quality, true peak, Whisper-timestamp director, jump cuts, emphasis zoom, SFX/music/ducking. |
| P131 security | Source/VM 18/18; browser/app smoke 18/18 with no page errors for tested paths. | All legacy HTML/PPTX/ZIP import routes, archive bomb policy, export redaction wiring, production CSP/security headers. |
| P107 portable assets | ZIP round-trip 6/6 including validation and rollback. | Physical two-device transfer/recovery; no cloud sync claim. |
| Three.js r187 / P85 | SHA-256 vendor manifests verified; hosted Chromium loaded uncompressed/Draco/Meshopt/KTX2 GLB fixtures and initialized P85 runtime paths. | Physical GPU, target hardware/performance, real production scenes and quality review. |
| P70 release | Manifest generated with 14 gates pending, 0 passed, `releaseCertified:false`. | All fourteen gates require actual target-environment evidence and review. |

Runtime workflow [#125](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44692957703), Pages workflow [#145](https://github.com/tovannghia27223-png/CANVIO/actions/runs/44692957814). Both completed successfully for source SHA `6a003524a1a46a9254035361303a779d9f4401b9`.
