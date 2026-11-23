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

| P139.1 Motion Lab hierarchy/text animator | Node contract + centralized P143 source parity + hosted Chromium rendered-PNG comparison and snapshot round-trip | Real project/export review, precomp, word/range selection, advanced keyframes, motion blur and physical GPU/device performance remain manual. |

| P120/P126 local ComfyUI bridge | Node contract tests + hosted Chromium with local mock HTTP server (API workflow, upload, queue/history/view, Asset Library handoff) | Connector plumbing only; real ComfyUI, free custom-node/model licensing, GPU inference, RIFE/Real-ESRGAN/video quality and browser CORS remain manual. |

| P137.2 character/table styles | P137 Node + Chromium checks for one-paragraph text selection, five character presets, three table presets, HTML metadata and rehydration; P143 standalone/embedded parity | Cross-paragraph selection, nested character styles, formulas/merged tables/sort/filter and print pagination remain manual/out of scope. |

| P119.2 shared easing in P145.2 | Node loads actual P119 and P145.2 sources; Chromium verifies preset/custom Motion curve changes equal-progress transition output | Video Engine clip/keyframe easing, Website Engine/CSS timeline, real GPU and target-device export performance remain open. |

| P119.3 Video Engine keyframe easing | Node P119 preset/custom-Motion contracts; Chromium applies P119 to a real image clip, verifies motionAt output and existing snapshot restore; P143 source parity | Website Engine/CSS timeline, legacy curves outside P119 normalisation range, physical GPU and 60 fps target-device acceptance remain open. |
| P143.4 lexical global evidence | PR #83 post-merge #551 53/53; Pages #275; 32/32 parity, 14/14 scanner, 17/17 inventory verifier | Lexical candidates only; semantic data flow and Phase 3 staged extraction/rollback/offline/CSP remain open. |

| P119.4 Website Motion shared easing | Node derives six curves from CVEasingP119; Chromium checks import/apply/clear, canonical component attributes/styles, Website save hook and reduced-motion export; P143 35-pair parity | Real authored projects, production publish host/CSP, keyboard/screen-reader and physical device review remain manual. |

| P124.4 selected component layouts | Node/Chromium selected Grid/Stack/Row/Split, responsive CSS, whitelisted variants, existing CSS Manager/save path, P143 parity | No structural tree conversion, nested variants, drag/resize, complex user-project or assistive-technology certification. |

| P135.2 editable Pixel adjustment stack | Node PNG metadata/CRC/32-layer round-trip; hosted Chromium snapshot → reload → native restore and unchanged raster check; P143 standalone/embedded parity | Independent two-device/cloud sync, third-party PNG re-encoding, masks/local corrections, smart objects, clone/patch and liquify remain unverified/out of scope. |

## Focused continuation matrix — 2026-11-23

The detailed reconciliation is maintained in [`CANVIO_P129_COVERAGE_MATRIX.md`](CANVIO_P129_COVERAGE_MATRIX.md). This focused matrix does not replace a complete global P1–P150 audit.

| Item | Automated/source evidence | Acceptance boundary still open |
|---|---|---|
| P115 | Local vendor SHA manifest, PWA/service-worker contract tests and hosted HTML audit. | Airplane-mode/install/update acceptance; exported 3D external runtime exceptions; physical devices. |
| P116 | DOCX, vector PDF subset, raster poster PDF and editable PPTX passed bounded external-tool self-test; see `CANVIO_P116_REPORT.md`. | Real Chrome H.264/audio and MS PowerPoint/Google Slides acceptance. |
| P118 | Custom TTF/OpenType wordmark parser and SVG outline export; Node + Chromium tests. | Paper.js not integrated; WOFF2 and complex shaping unsupported. |
| P121 | Partial existing raster/photo owners only. | Brush, layer masks, raster selections, licensed stock, 10+ batch and recovery workflow. |
| P122.3 | Not implemented; no MCP endpoint or connector fabricated. | Approved transport/auth/consent/permissions/threat-model contract. |
| P124.4 | Selected component layout/variants via existing GrapesJS CSS/save owner; Node + Chromium. | Nested variants, drag/resize, arbitrary structural conversion and accessibility. |
| P127 | Integrated LUFS/silence/quality/ducking foundations. | Oversampled true peak, real voice/music projects and human editorial/safe-area review. |
| P129 | Focused matrix recorded in `CANVIO_P129_COVERAGE_MATRIX.md`. | Full global roadmap-to-source/test coverage still needs owner-by-owner audit. |
| P130.1 | Additional local-data units encrypted/synced through existing client; mock Supabase/two-profile tests. | Real Supabase project/schema/RLS/credentials and physical two-device restore. |
| P133 | OffscreenCanvas proxy + OPFS large-media sidecar with quota guard/fallback. | Exhaustive quota/crash/rollback and long real media/device migration. |
| P135.2 | Editable adjustment stack metadata round-trips in existing PNG project snapshot. | SAM/object selection, brush masks and advanced raster authoring. |
| P138 | JS spectral-gating and worker path. | Genuine RNNoise and Vietnamese Piper inference, real listening. |
| P142 | Hosted Chromium/Pages results for bounded CI. | Windows/GTX 1650, Firefox/WebKit, touch and physical GPU. |
| P143 | 167-script heuristic boot graph and lexical/style/template inventory. | Semantic DAG, staged extraction, rollback, offline/PWA/CSP. |
| P70 | Fail-closed release gate in manifest. | 14/14 real-world gates open; releaseCertified remains false. |

| P132.1 local PDF import | Candidate: local PDF.js 6.5.438 vendor manifest, one-page PDF→PNG handoff to existing Pixel Atelier owner; Node + hosted Chromium + P143 parity wired | Await CI; raster-only page import, not editable PDF text/vector. PPTX/PSD and full SVG/PDF workflows remain open. |
