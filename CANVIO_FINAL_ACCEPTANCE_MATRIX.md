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

| P119.4 Website Motion shared easing | Node derives six curves from CVEasingP119; Chromium checks import/apply/clear, canonical component attributes/styles, Website save hook and reduced-motion export; P143 34-pair parity | Real authored projects, production publish host/CSP, keyboard/screen-reader and physical device review remain manual. |

| P124.4 selected component layouts | Node/Chromium selected Grid/Stack/Row/Split, responsive CSS, whitelisted variants, existing CSS Manager/save path, P143 parity | No structural tree conversion, nested variants, drag/resize, complex user-project or assistive-technology certification. |

| P135.2 editable Pixel adjustment stack | Node PNG metadata/CRC/32-layer round-trip; hosted Chromium snapshot → reload → native restore and unchanged raster check; P143 standalone/embedded parity | Independent two-device/cloud sync, third-party PNG re-encoding, masks/local corrections, smart objects, clone/patch and liquify remain unverified/out of scope. |


| P132.1 local PDF page import | Local PDF.js 6.5.438 with SHA-verified vendor assets; one-page PDF→PNG into existing Pixel Atelier; Node contracts, same-origin Chromium and P143 51-pair parity | Combined exact-head hosted workflow pending; password/customer PDFs, batch pages, editable vector/text and device review remain open. |
| P163.1.1 visible profile field labels | P169 Chromium asserts seven existing P163 controls have visible associated labels; existing character profile round-trip and mobile overflow suite | Combined exact-head hosted CI pending; keyboard/screen-reader/200% zoom and physical-device review remain open; no WCAG certification claimed. |
| P161.2 / P74.1 GLB camera-pose replay | Hosted same-origin GLB fixture, bounded P74 apply/readback, P161 Asset Library preset load, yaw/pitch/FOV and nonzero X/Y/Z round-trip on the existing Three.js viewer | Combined exact-head workflow pending; complex production GLBs, animation/camera paths, GPU/device and visual acceptance remain open. |
| P166.2 Brief-to-Website Engine handoff | Bounded lazy engine readiness; P131 sanitized body; actual GrapesJS `CVWeb.addComponents`; scoped responsive CSS via `CVWeb.Css.setRule`; Shared Core metadata and canonical `CV.engines.web.save`; Node delayed-readiness + Chromium integration assertions | Combined exact-head workflow pending; real authored Website project, keyboard/screen-reader/zoom and device review remain open. Static CTA/forms have no backend/CRM/hosting. |
