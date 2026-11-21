# CANVIO 23.3.111 final acceptance matrix

| Gate | Automated evidence | Current acceptance boundary |
|---|---|---|
| P74/P81 Three.js r187/Draco/Meshopt/KTX2 | Vendor manifest SHA + hosted GLB load | Compression fixtures must pass hosted runner before marking decoder acceptance |
| P85 PostFX/OpenCV/dotLottie/Rive | P85 vendor manifest, WASM initialization, PostFX render, optical-flow clip | Experimental WebGPU Path Tracing; player runtime, not animation authoring |
| P80/P102/P105 inference | Hosted model inference reports | Synthetic inputs prove pipeline execution only, not model accuracy |
| P106 rendering | Chromium WebGL/SwiftShader | Software GPU only; physical GPU and target-device performance remain open |
| P107 portability | ZIP CRC, independent Asset Library import and rollback tests | No cloud Project Vault sync or physical two-device acceptance claimed |
| P125.4 split-asset storyboard ZIP | Node package/path/manifest checks + hosted Chromium ZIP integrity, image signatures and offline final-frame decode | Hosted synthetic WebM/desktop browser only; no audio, touch/mobile and long real-media performance remain manual |
| P145.2 shader transitions/FX | Standalone/embedded parity + hosted Chromium render endpoints and PNG smoke | SwiftShader/software rendering only; physical 60 fps and real-footage acceptance remain open; optional MP4 is video-only |
| P145.6 Offline SVG icons | 25 original icons, category/search/filter, preview, SVG/sprite/contact-sheet exports; Node + Chromium | Larger stock catalogue and creative review remain open |
| P145.7 Typography presets | Six system-font presets, bounded controls, CSS export and physical Playwright hit-test | No bundled commercial fonts; OS typography review remains manual |
| P145.8 Vector illustrations | Eight original SVG illustrations, four palettes, filter/preview/vector export; Node + Chromium | Starter pack only; not stock photography or a large illustration catalogue |
| P145.9/.10 Asset Search & Quality Gate | Read-only local search/filter and shared license/source/size/hash gate | Full live Asset Vault enumeration and hashing every uploaded binary require canonical provider |
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

## Final mainline evidence — 2026-11-21

| P124 Auto Layout | Main #385 PASS 41/41; Chromium 9/9 | Merged PR #51. Advanced breakpoint/selected-component/nested variants/drag-resize/accessibility remain partial. |
| P133.2 proxy 4K→720p | 1280×720 VP9 + Opus; 3.008 s; source+proxy on timeline; original unchanged; full decode | Merged PR #51. Long real media, mobile/browser matrix and remaining OffscreenCanvas/OPFS migration open. |
| P134.2 Auto Reframe | 4.063 s measured via packet PTS; 123 packets; VP9 720×1280 + Opus; full decode | Merged PR #46. Real footage/occlusion and physical-device review remain manual. |
| P144.3 contextual help | 38/38 CVWS routes; F1 focus trap/Escape, palette and tour tests | Merged PR #51. Human wording/accessibility review remains manual. |
| P143 Phase 1/2 | PR #54; candidate #384 and main #385 PASS 41/41; 20 module pairs; 150 inline script tags, zero external src/duplicate IDs | Source inventory complete. Semantic dependency/boot-order DAG, CSS/template/dynamic-loader inventory and staged project-wide extraction remain open. |
| P70 release gate | Fail-closed | Fourteen real-world acceptance gates remain OPEN; CANVIO 1.0 Stable/production certification not granted. |
