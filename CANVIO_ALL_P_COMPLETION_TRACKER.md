# CANVIO — All-P Completion & Acceptance Tracker
**Snapshot:** 2026-11-21 · **Repository:** `tovannghia27223-png/CANVIO` · **Base audited:** `main` at `40c27e9eed21ee00493955373f452f18bf33405d`

> This file is a status and release-control document, not a claim that every roadmap item is complete. “Implemented” means the named code path exists on GitHub main. “Automated PASS” means its recorded tests passed on the stated fixtures. Neither means real-world production acceptance.

## Status definitions

- **Merged / automated PASS:** source is on main and recorded Node/Chromium/hosted evidence passed.
- **Integrated / partial:** useful code exists, but the requested feature scope or real-media acceptance is incomplete.
- **Blocked by external prerequisite:** cannot safely finish without a real service/account, credentials, target device, real media, or production environment.
- **Needs scope audit:** current Guide/Roadmap does not provide a clear, independently testable acceptance contract; do not invent one or mark it done.

## P-family inventory

| P range / item | Current evidenced state on main | What remains before “complete” |
|---|---|---|
| P1–P46 | Historical foundation and legacy modules are retained; specific owner/API history is documented in the Guide. | Do not infer every historical sub-item is fully accepted from later P suites. Perform a per-owner audit against the original Roadmap and current source/tests when a specific P is selected. |
| P47–P56 | Integrated reliability, motion, media/track, diagnostics, recovery and ZIP preflight work. Hosted regression runs record the corresponding suites passing. | Real-origin persistence, real project data, production media/codec, independent restore and target-browser acceptance remain separate from fixture tests. |
| P57–P62 | Phase 1 reliability modules integrated; Node/browser suites pass in the historical P70/23.3.111 pipeline. | Native IndexedDB save/reload/reopen, real A/V export, real Whisper, screen-reader/accessibility, deployed HTTPS and security headers remain manual release gates. |
| P63–P67 | Canonical timeline contract, advanced timeline operations, local tracking/stabilization, creative asset flow and design/print production are integrated; recorded source/browser regression passed. | Real footage tracking quality, user-selected AI/provider provenance, full project round-trip, font shaping, bleed and physical print/PDF review remain open. |
| P68 | Bounded geometry-only OBJ offline HTML viewer integrated. | MTL/material/texture and other formats are outside current profile; clean disconnected-machine acceptance is still a P70 gate. |
| P69 | Read-only system/resource/frame inspection integrated. | Estimates are heuristic; target-device memory/FPS and long-session profiling remain open. |
| P70 | Fail-closed release gate integrated. | **Not complete:** manifest says `releaseCertified:false`; fourteen real-world gates remain pending. |
| P71–P73 | Later production/runtime owners and offline website path are present in the integrated source tree; P73 export uses P131 redaction boundary. | Audit each owner against its own spec and production deployment. Do not treat presence in index as full acceptance. |
| P74 / P81 | Three.js r187 GLB viewer and local Draco/Meshopt/KTX2 decoder path are pinned; run #310 loaded uncompressed and compressed fixtures. | Real customer GLB/texture/performance compatibility and target hardware review. |
| P75–P80 | Creative/runtime owners and local model-worker paths are represented in the source/runtime integration; model weights remain explicit first-use downloads. | Per-model accuracy, latency, licensing/provenance and target-device model inference require labelled real inputs. |
| P82–P84 / P87 / P90–P107 | Vector/PDF/DOCX, local media/editor, depth/background-removal and portable preset owners are represented; P85 vendor/runtime SHA manifests and P107 strict ZIP round-trip are hosted-tested. | P105 real model accuracy, P106 physical GPU performance, broader format fidelity and clean second-device import remain open. P107 is portable manual file transfer, not cloud sync. |
| P108–P109 | Navigation inventory/wireframe and Studio Switcher integrated. | Visual review and route parity on supported devices. |
| P110–P114 | Overview Hub, shared studio shells/rails, responsive navigation and legacy fallback integrated. Run #310 app smoke navigated 48 pages with 21 assertions and no page/console/navigation errors. | Accessibility, screen-reader behavior, focus management and physical mobile review remain required. |
| P115 | Local vendor provisioning, PWA metadata and optional same-origin service worker integrated. | Not certified as a complete offline app: model/provider traffic is on-demand, some exported 3D pages may still reference external Three.js; clean-airplane-mode browser/device acceptance is pending. |
| P116 | PDF/DOCX/PPTX routes and browser video export capabilities exist. | PPTX pages are rasterized; codec/browser export compatibility and real file quality require independent checks. |
| P117 | Whisper tiny/base/small model routes and P85 optical-flow paths exist. | Representative Vietnamese/English speech transcription quality, timestamp accuracy and real footage tracking remain unverified. |
| P118 | Logo Studio output path exists. | Paper.js/opentype outline/kerning and round-trip depth are not evidenced as completed. |
| P119 | GLB viewer, dotLottie and Rive player paths exist. | Lottie authoring/round-trip and a shared easing editor remain open. |
| P120 / P126 | Local background-removal, depth-estimation, Ken Burns and 2.5D paths exist. | ComfyUI, AI video, Real-ESRGAN and RIFE are not implemented in the reviewed evidence; physical GPU/model quality remains open. |
| P121 | Raster masks/LUT and current asset/project owners exist. | Multi-file crash recovery and a packaged, fully curated/licensed stock library remain open. |
| P122.1 | Local Website Engine taste audit and opt-in preset exist. | Heuristic only; not WCAG certification and not a cross-studio design audit. |
| P122.2 | `CVUnslopP1222.plan/preview/apply/cancel/undo` exists; CSS-only, one group per action, uses existing Website Engine save path and rollback. | Content/icon-level polish, Poster/Slide scope and Project Vault version-history integration remain open. |
| P122.3 | No independently specified/verified P122.3 acceptance contract found in the reviewed current Guide/Roadmap. | Define scope, owner, tests and UX before implementation; do not invent a “PASS”. |
| P123 | Twelve static Website Engine layout starters integrated; recorded P122/P123 suite passed. | Map/inbox/Kanban/chat are visual examples only, not live services. |
| P124 | Partial foundation in production/editor workflows. | The reviewed Roadmap does not show an independent completion record; map exact requested scope and acceptance owner. |
| P125.1 | Scroll-frame extraction/export implemented and hosted tested. | Real long footage, device memory/touch and responsive review remain. |
| P125.2 | Scroll Storyboard Editor merged; actual browser UI/editor interactions and exports covered by hosted tests. | Production footage, touch/mobile, editing accessibility and large timelines need human review. |
| P125.3 | Caption presets, decimation and size-budget options integrated in the existing P125 owner. | Visual design review and real content testing. |
| P125.4 | Split-asset ZIP export merged (PR #32); run #271 passed 14 package assertions and offline Chromium relative-frame decode. | No audio in package; mobile/touch and long/high-resolution real footage remain manual. |
| P127.1–P127.6 | JSON Edit Plan, quality gate, LUFS measurement, text templates and EDL/silence-cut foundations integrated; hosted unit/browser suites pass for their tested scope. | True-peak, real spoken-word media, editorial quality and safe-area/headroom/contrast on real projects remain. |
| P127.2 | Caption/pause-guided director merged; browser fixture verified pause report, punch-in keyframes, AutoCut and Undo. | Fixture used a short synthetic 440 Hz burst/silence clip; Whisper transcript quality, face tracking, multi-speaker and real editorial review remain. |
| P127.7 | Subtitle-led audio ducking is integrated via the canonical Video Engine envelope/undo path; recorded unit regression passed. | Real music/voice-over mix review, loudness/true-peak and multi-track projects remain. |
| P128 / P129 | P128.3 JSONL and related Content Factory utilities are noted in the Guide; no full independent P128/P129 acceptance matrix is recorded here. | Complete owner/spec/test inventory before declaring these P numbers closed. |
| P130 / P130.A | **Blocked by external prerequisite.** No verified Supabase project, deployed schema/RLS, credentials or two-device recovery proof in this repo. | Requires an actual user-controlled backend project, RLS/schema deployment, secret-safe configuration and independent-device backup/restore. Do not fake auth/cloud sync or store secrets in source. |
| P131.1–P131.2 | Security hub, storage/key scan/redaction, SVG/HTML/CSS sanitizer and P66 SVG ingestion hardening integrated. | Generic hostile-format import paths and server response headers are not thereby secured. |
| P131 export-boundary work | Shared redaction/sanitizer integrated for Print, Content Factory text exports and P73 Offline Website export. | Every remaining legacy/binary export must be inventoried; fail-closed ZIP quotas and server CSP/CORS/COOP/COEP/worker MIME headers need production-origin validation. |
| P131.3 | Safe local HTML body-fragment import merged (PR #41); run #315: 31 Chromium checks, app smoke 21 checks across 48 routes, zero page errors. | Deliberately not a complete-page/site importer: stylesheets/scripts/forms/iframes/remote media/third-party runtimes are excluded; max 5 MiB. |
| P132 | GIF89a timeline export and APNG export integrated. | GIF palette banding, large-file memory and real media need visual/device review; no audio. |
| P132.3 | Animated WebP merged; run #304 validated RIFF/VP8X/ANIM/10 ANMF frames and Chromium decode 200×113. | No audio; alpha/color profile, real footage, mobile and long-animation memory/performance remain. |
| P134 | Histogram/waveform/vectorscope scopes integrated and browser tested. | Real clip monitoring and colorist review remain; current view is based on the frame/canvas owner. |
| P136.1–P136.4 | Image Trace, Bezier contour smoothing, single-line Stroke and six SVG pattern fills integrated. P136.4 merged via PR #39; run #312 passed. | No brush authoring, gradient mesh, topology/branch editing, handwriting OCR or reliable photo restoration. Review production artwork manually. |
| P137 | CSV-to-HTML data merge and JSONL utilities are included in P145 Content Core/Factory lineage. | Full separate P137 source/coverage matrix not established; verify against original P137 requirements. |
| P138 | Local spectral-gating denoise integrated; synthetic browser fixture reported ~16 dB noise reduction with tone within ~0.4 dB. | Not RNNoise/AI. Continuous noise, changing noise and background speech are weak cases; real voice quality listening remains. |
| P141 | A P141 marker/check is referenced around Content Factory metadata/typography in historical notes, but no separate end-to-end acceptance contract is present in the reviewed current Guide/Roadmap. | Define and map its independent required scope/tests before marking complete. |
| P142 | No independently testable P142 completion record was identified in the current Guide/Roadmap snapshot. | Resolve the original P142 requirement and its owner/test/deployment evidence; do not mark it done on inference. |
| P145.1–P145.5 | Content Factory/License & Credit, synthetic SFX, shader transitions, official music preview, local music composer and local Template Factory are integrated; Node/Chromium evidence is recorded in workflow #310. | Starter/local tools; not a licensed music catalogue, AI audio generation service or full audio mixing replacement. Shader performance uses CI software rendering. |
| P145.6 | 25 original offline SVG icons, categories/search/preview/export; Node 9/9 and Chromium suite passed. | Starter icon pack only, not a commercial stock library. |
| P145.7 | Six system typography presets; Node 7/7 and Chromium mouse-hit tests passed. | System-font fallbacks; no bundled font binaries or cross-platform print certification. |
| P145.8 | Eight original vector illustrations/four palettes; Node 11/11 and Chromium suite passed. | Original starter set, not a large stock catalogue/photo library. |
| P145.9 | Local Asset Library search/filter and shared Quality Gate; existing `CV.assets.list()` owner. | Only local inventory exposed by the current host; no cloud catalogue. |
| P145.10 | Manual SHA-256 of eligible local base64 asset bytes, in-memory only; merged PR #38; run #310 Node 10/10 and Chromium 14/14. | Limits: 40 assets, 25 MiB/file, 64 MiB aggregate. Skipped/unreadable items remain unverified; no cloud inventory or automatic background scan. |

## Current P70 release blockers — 14/14 remain OPEN

1. HTTPS and supported browser matrix on the deployed origin.
2. Native IndexedDB persistence, restore and quota behavior on real origin.
3. Real-media recording/export and audio/video synchronization.
4. Whisper inference/transcription quality on labelled Vietnamese and English audio.
5. Keyboard, screen-reader and 200% reflow accessibility review.
6. Production CSP/CORS/COOP/COEP, worker MIME and security response headers.
7. Real multi-track timeline save/reload, undo/redo and recovery.
8. Tracking and stabilization quality on real footage.
9. User-selected AI provider output, licensing and provenance review.
10. Typography/font fallback, pagination, bleed and physical print/PDF review.
11. Offline OBJ package opened on a clean disconnected machine.
12. Physical target-device GPU/VRAM, performance and long-render testing.
13. Cross-origin backup/restore and independent-device recovery.
14. Rollback, release observability, alerting and production incident drill.

## Immediate engineering order

1. Keep the existing mainline feature set stable; do not merge stale PR #43 (closed as duplicate of merged PR #38).
2. Close P122 scope only after a defined content/icon + Poster/Slide + Project Vault history acceptance matrix exists.
3. Finish P127 real-speech/true-peak/safe-area workflows only with representative user-approved audio/video fixtures and listening review.
4. Finish P131 only by enumerating every remaining importer/exporter and enforcing per-format byte/entry/expanded-size/decompression-ratio limits with adversarial tests; production headers require deployed-origin evidence.
5. Keep P130 blocked until a real backend and two-device recovery environment is supplied.
6. Work P70 gates with actual deployed origin, hardware, media and reviewer evidence. No automated synthetic test can substitute for these gates.

## Snapshot decision

CANVIO is a broad, integrated **23.3.111 candidate**, not “all P complete” and not production-certified. Mainline feature/code work and several hosted test suites are green, but partial roadmap scopes and external/manual P70 acceptance are still open. Update this tracker append-only after each verified increment.

## Scope correction and final CI snapshot — 2026-11-21

The following backlog entries were omitted or understated in the first inventory. This correction is append-only and supersedes the corresponding rows above:

| P item | Corrected status from current mainline evidence | Remaining work |
|---|---|---|
| P122.1 / P123 | Automated unit/source suite **13/13 PASS** in hosted run #310. P122.1 is a local heuristic Website Taste audit; P123 provides 12 static layout blocks inserted through the existing GrapesJS editor. | No screenshot/keyboard/responsive visual acceptance; map/inbox/Kanban/chat are sample blocks, not connected services. This is not WCAG or professional design certification. |
| P122.2 | Automated suite **14/14 PASS** in run #310: safe CSS-only preview/apply/undo, stale-plan rejection and rollback on save failure. | Still **partial**: Website Engine only; no HTML content/icon editing, Poster/Slide workflow or Project Vault version-history integration. |
| P122.3 MCP | The Roadmap explicitly says “P122.3 MCP chưa làm”; there is no P122.3/MCP source module, test or implementation path in the current main tree. | **Not implemented.** The exact MCP feature contract, transport, authentication/consent boundary, permissions, threat model and acceptance tests are not specified. Do not invent a remote MCP server or expose local project data without a defined security contract. |
| P124 Auto Layout / Component | Prior handoff calls P124–P129 partial and lists Auto Layout/Component depth as open. No P124 source module/test appears in the main tree. | **Not implemented as a distinct feature.** P123 static starter blocks do not satisfy Auto Layout/component constraints, responsive rules, reusable component variants or editor round-trip. |
| P133 OPFS / proxy | Named as open in `CANVIO_NEXT_AI_PROMPT.md`; no P133/OPFS source, worker, owner or tests appear in the main tree. | **Not implemented.** Define relationship to current IndexedDB/Project Vault/media owners, migration/rollback and quota policy before adding a second persistence path. |
| P142 target-device/browser acceptance | GitHub Pages deployment on main succeeded in run #192 (`44819441586`): build, report-build-status and deploy jobs all passed. | Pages deployment is **PASS**, but real-origin Playwright acceptance, Windows/GTX 1650/RAM 7 GB testing, Firefox/WebKit, touch and physical GPU/AI performance remain unverified. |
| P143 code split | Next-AI handoff lists P143 as an open “tách mã” task; no P143 module or migration test exists in main. Some feature lots have standalone source copies, but the canonical app is still a large `index.html`. | **Not implemented as a full refactor.** Needs dependency/ID/boot-order map, extraction in small reversible stages, and parity/syntax/build tests; avoid a risky all-at-once rewrite. |
| P144 Command Palette | P109 already implements a basic shared command palette and tests existing command/search/route ownership. No P144 source/test exists as a separate item. | **Partially covered by P109; not independently closed as P144.** Compare P144’s original expected shortcuts, command registry, fuzzy search, accessibility and context actions against P109 before extending the existing palette; do not add a duplicate. |

### PR #44 hosted verification

- PR #44 documentation reconciliation passed GitHub Actions hosted workflow **#320** (`44859258258`), verify job conclusion `success`; source restoration, integrated module steps, test utilities, vendor provisioning, JavaScript/HTML audit, P47–P70 regressions, integration contracts, P107 ZIP round-trip and same-origin GLB/P85/ONNX/worker browser acceptance all completed successfully.
- Artifact: `CANVIO-23.3.111-GITHUB-RUNTIME-VERIFIED-320`, 21,602,814 bytes, SHA-256 `74cb03f31a7c55d94f69376b74f46a22bef1538b473aeca1165c42296f2e69ba`.
- The workflow's final “commit complete verified candidate to working branch” step was skipped on the PR event by design; the verified package is attached as a workflow artifact.
- Mainline Pages deployment #192 (`44819441586`) completed build, report and deploy jobs successfully. This is deployment pipeline evidence, not the P70 manual release certification.

## Updated completion decision

No honest all-P completion claim is possible yet. In addition to P70's 14 open real-world gates, P122.3 MCP, P124 Auto Layout/Component is partial in the current candidate; P130 cloud sync is blocked on real Supabase infrastructure; P133 OPFS/recovery and denoise Worker exist with proxy/OffscreenCanvas/media migration still open; P143 full code split remains open; P144 palette/shortcuts/F1/tour exist with contextual help expanded in the current candidate; P142 is deployed but not target-device certified. Work on these needs defined contracts and/or real infrastructure rather than placeholder modules.


## P134.2 incremental update — Auto Reframe (2026-11-21)

- Candidate branch work/p134-auto-reframe-20261121: local lightweight Auto Reframe source/API, Node regression suite (11 assertions) and hosted same-origin Chromium export harness added.
- P134 base scopes remain the existing histogram/waveform/vectorscope implementation; this increment adds a separate aspect-ratio workflow inside the existing Video Engine quality card.
- Scope boundary: 9:16 / 1:1 saliency crop from edge contrast + frame difference; WebM export; no face-recognition model, no upload, no timeline or store mutation.
- Acceptance status: pending hosted PR verification. Do not mark merged/automated PASS until the workflow result is inspected. Real footage, mobile/browser matrix and audio listening remain manual.

## Consolidated P124 / P133.2 / P144.3 candidate update — 2026-11-21

- P124: rebased Auto Layout source and tests carried onto current main. Five responsive presets/four variants, existing Website Engine adapter/save path. Still partial: arbitrary component conversion, visual breakpoint editor, nested variants, drag/resize and accessibility/real-editor acceptance.
- P133: OPFS/recovery and denoise Worker already exist on main. P133.2 adds 4K-to-720p WebM proxy as a new clip using existing media store/import path; original remains unchanged. Node + hosted Chromium/ffmpeg/ffprobe acceptance wired; pending.
- P144: palette/shortcuts/F1/tour already exist. P144.3 expands contextual help across registered CVWS routes and utility pages, preserving the existing CVUxP144 owner. Node + hosted Chromium route-coverage tests wired; pending.
- Do not mark any of these increments merged/PASS until the consolidated hosted workflow completes. P133 OffscreenCanvas/large-media migration and P124 advanced editor controls remain open.


### P133.2 QA correction — CI #347 (2026-11-21)

- First hosted Chromium run successfully generated a 1280×720 WebM, preserved Opus audio, fully decoded the file and confirmed the original clip remained unchanged.
- It caught an actual integration race: the UI did not await the asynchronous Video Engine importFiles() promise, so the proxy download existed but the new timeline clip was not yet present when reported. Updated the module to await importFiles(), verify clip-count increase and retain the download link if timeline ingestion fails.
- CI must be rerun on the corrected commit; no proxy acceptance/merge claim until timeline import passes.


### P144.3 route-coverage correction — CI #354 (2026-11-21)

- Hosted Chromium confirmed the workspace registry contains 38 routes, not only the 25 initially covered. It identified 13 missing help topics: templates, brand, designSystem, responsive, collab, hub, platform, one, promptForge, insight, hallmark, guide and shield.
- Added page-specific guidance for all 13, using Guide-documented behavior and explicit boundaries (e.g. collab is local notes/activity, Prompt Forge is prompt handoff, Shield does not certify server headers).
- P133.2 passed all 11 Chromium checks in the same run, including actual timeline import, clip duration, audio, full decode and original preservation. P124 passed 9/9.
- Rerun required to verify all 38 CVWS routes have contextual help; no merge claim until that coverage check passes.

## P143 source split — Phase 1 candidate (2026-11-21)

- Added a 20-module standalone source registry and parity/syntax audit. Integrated in hosted runtime workflow after source integration and before full HTML audit.
- Added CANVIO_P143_SOURCE_SPLIT_PLAN.md with staged extraction and dependency/boot-order safeguards.
- Status: Phase 1 candidate pending hosted CI. Full P143 remains OPEN until all inline script/style blocks are inventoried, dependency DAG documented and staged extractions pass application/rollback/offline/CSP acceptance.
