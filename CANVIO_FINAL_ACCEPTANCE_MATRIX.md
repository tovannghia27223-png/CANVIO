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

| P145.10 mainline local Asset Library SHA-256 (run #310) | PR #38 merged; hosted Node 10/10 and Chromium 14/14; native `CV.assets.list()`, 64-char SHA-256, duplicate detection from local bytes, read-only/no-mutation checks | Local base64 data URLs only; 40 rows / 25 MiB per asset / 64 MiB aggregate; unscannable rows remain unverified; no remote/cloud vault or cross-device sync |
| P136.4 local SVG pattern fill (run #312) | PR #39 merged; hosted workflow success; six SVG pattern presets in Image Trace multicolour fill mode | No brush authoring, gradient mesh, topology editing or physical GPU/performance certification |
| P131.3 safe local HTML body-fragment import (run #315) | PR #41 merged; Chromium 31/31 and app smoke 21 checks / 48 pages, zero page errors | .html/.htm only, ≤5 MiB, sanitized fragment; stylesheets/scripts/forms/iframes/remote media are excluded |
| P70 14 real-world release gates | **OPEN — 0/14 evidenced as passed in current manifest** | Must be separately reviewed on deployed origin, real media, supported physical devices and production infrastructure; CI success does not close these gates |

| P122.1 / P123 | Hosted source/Node suite 13/13 | Website Taste heuristic + 12 static layout blocks only; no WCAG/screenshot/keyboard certification or live map/inbox/Kanban/chat services |
| P122.2 | Hosted Node suite 14/14, including preview/apply/undo, stale-plan rejection and failed-save rollback | Website CSS-only; no content/icon editing, Poster/Slide, or Project Vault history integration |
| P122.3 / P124 / P133 / P143 | No dedicated source owner or tests on main; explicitly open in historical Roadmap/handoff | MCP contract/security; Auto Layout/Component; OPFS/proxy storage migration; complete code split remain unimplemented |
| P144 | Existing P109 palette/command search covers a basic subset | Parity audit required; no duplicate palette should be introduced |
| P142 | GitHub Pages build/report/deploy run #192 succeeded | Real-origin browser, Windows/GTX 1650, Firefox/WebKit, touch and physical GPU checks remain open |
| PR #44 docs verification | Hosted run #320 success; artifact SHA `74cb03f31a7c55d94f69376b74f46a22bef1538b473aeca1165c42296f2e69ba` | Documentation/status reconciliation, not proof all P complete |
