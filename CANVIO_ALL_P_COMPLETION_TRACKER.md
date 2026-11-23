# CANVIO — All-P Completion & Acceptance Tracker
**Snapshot:** 2026-11-23 · **Repository:** `tovannghia27223-png/CANVIO` · **Base reconciled:** `main` at `7df9865c272dfd03dc3b4a6996951b89927066b8`

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
| P115 | Same-origin pinned vendor assets, local vendor SHA manifest, PWA metadata and optional HTTPS/localhost service-worker registration are integrated; `tests/p115/run-p115-tests.cjs` checks these contracts and hosted HTML audit rejects external script `src` tags/duplicate IDs. | **Partial:** model/provider downloads remain on-demand; exported 3D pages may retain external runtime references; full airplane-mode, install/update and physical-device acceptance remain open. |
| P116 | DOCX, vector PDF (font subset), raster poster PDF and editable PPTX passed the 2026-11-23 bounded self-test; see `CANVIO_P116_REPORT.md`. PDF title/layout defects were fixed. | **Partial real-world acceptance:** H.264/audio requires real Chrome/codec validation; PPTX still needs Microsoft PowerPoint/Google Slides open/edit acceptance. Do not describe PPTX as raster. |
| P117 | Whisper tiny/base/small model routes and P85 optical-flow paths exist. | Representative Vietnamese/English speech transcription quality, timestamp accuracy and real footage tracking remain unverified. |
| P118 | Custom `CVWordmarkP118` TTF/OpenType outline/kerning parser and SVG path output integrated; Node + hosted Chromium test owners exist. | Not Paper.js. WOFF2, complex shaping/ligatures and full authoring/round-trip acceptance remain unsupported/open. |
| P119 | GLB viewer, dotLottie and Rive player paths exist. | Lottie authoring/round-trip and a shared easing editor remain open. |
| P120 / P126 | Local background-removal, depth-estimation, Ken Burns and 2.5D paths exist. | ComfyUI, AI video, Real-ESRGAN and RIFE are not implemented in the reviewed evidence; physical GPU/model quality remains open. |
| P121 | Existing Pixel/Luma/photo owners and partial masks/LUT/adjustment capabilities are present. | **Open for requested scope:** brush authoring, layer-mask workflow, raster selection operations, curated free/licensed source library, batch 10+ files and multi-file recovery are not established as an end-to-end accepted workflow. P135 adjustment stack is not smart selection. |
| P122.1 | Local Website Engine taste audit and opt-in preset exist. | Heuristic only; not WCAG certification and not a cross-studio design audit. |
| P122.2 | `CVUnslopP1222.plan/preview/apply/cancel/undo` exists; CSS-only, one group per action, uses existing Website Engine save path and rollback. | Content/icon-level polish, Poster/Slide scope and Project Vault version-history integration remain open. |
| P122.3 | **Not implemented by design.** No accepted MCP feature/security contract or implementation exists. | Requires explicit scope, transport, authentication, consent, allow-listed tools/resources, permission model, threat model and acceptance tests before implementation. |
| P123 | Twelve static Website Engine layout starters integrated; recorded P122/P123 suite passed. | Map/inbox/Kanban/chat are visual examples only, not live services. |
| P124 | P124.4 `CVAutoLayoutP124` is integrated: responsive presets, selected-component Stack/Row/Grid/Split layout and four visual variants; Node + hosted Chromium tests cover the existing Website Engine/save owner. | **Partial:** nested variants, arbitrary structural conversion, drag/resize, complex real project, keyboard/screen-reader and device acceptance remain open. |
| P125.1 | Scroll-frame extraction/export implemented and hosted tested. | Real long footage, device memory/touch and responsive review remain. |
| P125.2 | Scroll Storyboard Editor merged; actual browser UI/editor interactions and exports covered by hosted tests. | Production footage, touch/mobile, editing accessibility and large timelines need human review. |
| P125.3 | Caption presets, decimation and size-budget options integrated in the existing P125 owner. | Visual design review and real content testing. |
| P125.4 | Split-asset ZIP export merged (PR #32); run #271 passed 14 package assertions and offline Chromium relative-frame decode. | No audio in package; mobile/touch and long/high-resolution real footage remain manual. |
| P127.1–P127.6 | JSON Edit Plan, editorial quality gate, LUFS integrated loudness, text templates and EDL/silence-cut foundations are integrated with hosted tests. | **Partial:** LUFS reports sample peak, not oversampled true-peak; real Vietnamese speech, real music/voice mix, listening review and safe-area/headroom/contrast on real projects remain. |
| P127.2 | Caption/pause-guided director merged; browser fixture verified pause report, punch-in keyframes, AutoCut and Undo. | Fixture used a short synthetic 440 Hz burst/silence clip; Whisper transcript quality, face tracking, multi-speaker and real editorial review remain. |
| P127.7 | Subtitle-led audio ducking is integrated via the canonical Video Engine envelope/undo path; recorded unit regression passed. | Real music/voice-over mix review, loudness/true-peak and multi-track projects remain. |
| P128 / P129 | P128.3 utilities are documented. A focused `CANVIO_P129_COVERAGE_MATRIX.md` reconciles the 15-item continuation audit. | This is not a complete global P1–P150 coverage matrix. Full P129 scope needs the original acceptance contract and owner-by-owner mapping before global closure. |
| P130 / P130.A | `CVCloudP130` includes P130.1 encrypted units for additional local `canvio*` data; Node and two-profile Chromium tests use a mock Supabase service. | **Blocked externally:** no verified user-owned Supabase project, deployed schema/RLS, real credentials, physical two-device sync or restore proof. Mock-server tests are not real backend acceptance. |
| P131.1–P131.2 | Security hub, storage/key scan/redaction, SVG/HTML/CSS sanitizer and P66 SVG ingestion hardening integrated. | Generic hostile-format import paths and server response headers are not thereby secured. |
| P131 export-boundary work | Shared redaction/sanitizer integrated for Print, Content Factory text exports and P73 Offline Website export. | Every remaining legacy/binary export must be inventoried; fail-closed ZIP quotas and server CSP/CORS/COOP/COEP/worker MIME headers need production-origin validation. |
| P131.3 | Safe local HTML body-fragment import merged (PR #41); run #315: 31 Chromium checks, app smoke 21 checks across 48 routes, zero page errors. | Deliberately not a complete-page/site importer: stylesheets/scripts/forms/iframes/remote media/third-party runtimes are excluded; max 5 MiB. |
| P132 | GIF/APNG/WebP timeline export is integrated. P132.1 local PDF selected-page → PNG → existing Pixel Atelier import is a candidate on `work/p132-pdf-import-20261123`; PDF.js is locally vendored with SHA manifest and Node/Chromium/P143 tests are wired into CI. | P132.1 awaits hosted acceptance; PDF import rasterizes (not editable vector/text). PPTX/PSD import, broad SVG import, large/complex PDF and real project review remain open. |
| P132.3 | Animated WebP merged; run #304 validated RIFF/VP8X/ANIM/10 ANMF frames and Chromium decode 200×113. | No audio; alpha/color profile, real footage, mobile and long-animation memory/performance remain. |
| P133 | P133.2/.3 proxy uses OffscreenCanvas Worker scaling with bounded frame handling and main-thread fallback; P133.4 hosted Chromium verifies OPFS write/read, proxy read, IDB→OPFS migration, metadata-failure rollback and (this PR) forced insufficient-quota fallback to IDB. | **Partial:** browser/OS termination during write, real device storage pressure, long-media migration and multi-device recovery remain open. |
| P134 | Histogram/waveform/vectorscope scopes integrated and browser tested. | Real clip monitoring and colorist review remain; current view is based on the frame/canvas owner. |
| P135.2 | Nine non-destructive Pixel adjustments are retained in existing PNG snapshot metadata (CRC-checked) and restore through the native Pixel owner; hosted snapshot/reload tests verify raster identity. | Not SAM or brush/layer-mask selection; smart objects, content-aware selection, clone/heal/liquify and third-party PNG re-encoding remain open. |
| P136.1–P136.4 | Image Trace, Bezier contour smoothing, single-line Stroke and six SVG pattern fills integrated. P136.4 merged via PR #39; run #312 passed. | No brush authoring, gradient mesh, topology/branch editing, handwriting OCR or reliable photo restoration. Review production artwork manually. |
| P137 | CSV-to-HTML data merge and JSONL utilities are included in P145 Content Core/Factory lineage. | Full separate P137 source/coverage matrix not established; verify against original P137 requirements. |
| P138 | Local spectral-gating denoise and worker path are integrated with synthetic browser checks. | Not RNNoise/AI. Vietnamese Piper TTS is not implemented; real voice-quality listening, changing noise/background speech and licensed model packaging remain open. |
| P141 | A P141 marker/check is referenced around Content Factory metadata/typography in historical notes, but no separate end-to-end acceptance contract is present in the reviewed current Guide/Roadmap. | Define and map its independent required scope/tests before marking complete. |
| P142 | GitHub Pages deployment and hosted Chromium same-origin CI are recorded; browser smoke covers its tested fixture. | **Not hardware/browser-matrix certified:** Windows/GTX 1650, Firefox/WebKit, touch/mobile, physical GPU, real project/media, screen-reader and two-device recovery are not verified. |
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

## Mainline status reconciliation after PR #51 — 2026-11-21

| Item | Current verified status | Remaining |
|---|---|---|
| P124 | **Merged** via PR #51 / main commit e4e3647. Hosted #360 and main #362 PASS 39/39; Chromium interaction 9/9. | Advanced component conversion, breakpoint editor, nested variants, drag/resize and accessibility remain partial. |
| P133.2 | **Merged** via PR #51. 4K → WebM proxy passed hosted Chromium: original + new proxy clip, 1280×720, Opus audio, full decode, zero page errors. | OffscreenCanvas use cases and large-media OPFS migration with quota/rollback are open. |
| P144.3 | **Merged** via PR #51. Existing CVUxP144 covers 38/38 CVWS routes in Chromium; first-run tour tests also pass. | Human wording, keyboard/screen-reader review and additional fuzzy/global search remain partial. |
| P143 Phase 1 | Candidate PR #52. 20-module source parity, inline HTML audit, P47–P70 regressions and P107 round-trip all passed pre-browser gates in hosted run #363; run still in progress at time of this note. | Full script/style inventory, dependency/boot-order graph, staged extraction, offline/CSP/rollback acceptance remain open. |
| P130 | **Blocked externally**: no verified Supabase project/schema/RLS/credentials/two-device environment. | Requires a user-owned deployed backend and independent-device restore test. |
| P122.3 | **Not implemented**: roadmap has no feature/security/transport/permission contract. | Define and approve exact MCP contract/threat model before implementation. |
| P70 | **Not certified**: fourteen real-world acceptance gates remain open. | Actual browser/device/media/provider/hosting/accessibility/recovery/release-operation evidence and review. |

## P143 Phase 1 — candidate based on main 6481d83 (2026-11-21)

- Carries the 20-module source registry/parity gate onto current main after the hosted package/manifest bot commit. Prior run #363 passed 39/39, including source parity and same-origin browser acceptance; new current-main hosted run is pending.
- Full P143 remains OPEN until all inline JS/CSS is inventoried, dependencies/boot order mapped and staged extraction passes app/rollback/offline/CSP acceptance.


## P134.2 duration test reliability fix — 2026-11-21

- Hosted rerun #371 exposed a bad WebM test assumption: `r_frame_rate=60/1` was used when container duration and avg frame rate were missing, under-measuring a 4.1 s synthetic output as 2.05 s. Video decode/audio preservation remained PASS; only durationWithinTolerance failed.
- Updated P134 browser acceptance to use actual ffprobe packet PTS and median frame duration, with metadata and 30 fps configured fallback. Run #373 on latest-main PR #54 is pending; keep P143/overall CI unmerged until result.

## P143 Phase 2 — script inventory candidate (2026-11-21)

- Added hosted inventory generator tests/p143/build-inline-source-inventory.cjs and JSON output tests/p143/inline-source-inventory.json covering all canonical script tags in execution order, with ID/type/src/async/defer/bytes/SHA256 and heuristic global references.
- Report is included in packaged source and upload artifact. Current hosted run will verify generation.
- Remaining P143: inline CSS/HTML templates/dynamic loaders inventory, semantic dependency DAG, initialization/DOM order review, staged reversible extraction, CSP/offline/rollback.

## Final mainline verification snapshot — 2026-11-21

| Item | Verified state | Remaining |
|---|---|---|
| P124 Auto Layout | MERGED PR #51. Candidate #360/main #362 and final main #385 PASS; final main 41/41. Chromium 9/9. | Selected-component conversion, breakpoint editor, nested variants, drag/resize and accessibility. |
| P133.2 4K proxy | MERGED PR #51. 4K fixture: new 1280×720 WebM clip, Opus, full decode, original retained. | OffscreenCanvas and selected large-media OPFS migration with quota/rollback. |
| P134.2 Auto Reframe | MERGED PR #46. Duration test corrected to use packet PTS; hosted measured 4.063 s, 123 packets, VP9 720×1280, Opus, full decode. | Real footage/occlusion/camera motion and physical-device review. |
| P144.3 contextual help | MERGED PR #51. 38/38 CVWS routes; F1/tour/keyboard tests. | Human wording and screen-reader review. |
| P143 Phase 1/2 | MERGED PR #54. Candidate #384 and main #385 PASS 41/41. 20 source/lot pairs; inventory: 150 script tags, 0 external src, 0 duplicates. | Full semantic dependency/boot-order DAG, CSS/template/dynamic-loader inventory, staged extraction/rollback/offline/CSP. |
| P130 cloud sync | BLOCKED EXTERNAL | Real Supabase project, schema/RLS, credentials and two-device recovery. |
| P122.3 MCP | NOT IMPLEMENTED BY DESIGN | Requires approved feature, transport, auth, consent, permission and threat-model contract. |
| P70 release | NOT CERTIFIED | Fourteen real-world device, service, media, accessibility, hosting, recovery and operations gates remain open. |


## P143 parity coverage extension — 27 modules candidate (2026-11-21)

- Manifest tests/p143/source-module-map.json expanded from 20 to 27 standalone/inline-lot pairs. Seven new pairs: P127 Loudness/Templates, P133 Resilience, P134 Scopes, P138 Denoise, P140 Charts, P145 SFX.
- Each added pair already has its own module parity test. Central P143 gate applies source/embedded syntax and parity checks to the larger set. No runtime code changed; hosted run pending.
- Full project-wide source refactor remains open.

## Final mainline status after PR #55 — 2026-11-21

| Item | Verified state | Remaining |
|---|---|---|
| P124 Auto Layout | **MERGED** PR #51. Chromium 9/9; hosted/mainline runtime workflows pass. | Advanced selected-component conversion, breakpoint editor, nested variants, drag/resize and accessibility. |
| P133.2 proxy | **MERGED** PR #51. 4K fixture generated 1280×720 WebM with Opus, full decode, original preserved and proxy clip on timeline. | Real long-footage/browser/device checks; remaining OffscreenCanvas and selected large-media OPFS migration. |
| P134.2 Auto Reframe | **MERGED** PR #46. 123 packets; measured 4.076 s via PTS in latest 27-module candidate; VP9 720×1280 + Opus; full decode. | Real footage, occlusion, rapid camera motion and physical-device quality review. |
| P144.3 contextual help | **MERGED** PR #51. 38/38 CVWS routes; F1/tour/keyboard smoke passes. | Human wording and screen-reader review. |
| P143 parity/inventory | **MERGED** PR #54 + parity expansion PR #55. Central parity **27/27 PASS**; candidate #386 and main #387 PASS 41/41. Inventory: 150 inline script tags, 0 external src, 0 duplicate IDs. | Full semantic dependency/boot-order DAG, CSS/template/dynamic loader inventory, staged extraction/rollback/offline/CSP. |
| P130 cloud sync | **BLOCKED EXTERNAL** | Real Supabase project, schema/RLS, credentials and two-device recovery acceptance. |
| P122.3 MCP | **NOT IMPLEMENTED** | Requires approved feature, transport, auth, consent, permission and threat-model contract. |
| P70 release | **NOT CERTIFIED** | Fourteen real-world gates remain open. |


## 2026-11-21 — follow-on implementation candidate (not yet accepted)

| P item | Candidate implementation on work/p133-offscreen-p143-style-audit-20261121 | Acceptance boundary / remaining |
|---|---|---|
| P124.2 | Added editable breakpoints, mobile/tablet/desktop column counts, content/gap/min-width controls and scoped responsive CSS in the existing Website Engine panel. | Candidate only until Node + Chromium hosted checks pass. Arbitrary selected-component conversion, nested variants, drag/resize and accessibility review remain. |
| P133.3 | Added Blob-backed OffscreenCanvas Worker scaler to the local 4K proxy, with one-frame backpressure and main-canvas fallback. Preserves canonical Video Engine import and source clip. | Candidate only until Chromium proves Worker use and full proxy decode/import. Does not migrate large media into OPFS; real long media and target hardware are deferred. |
| P143.3 | Added style/inline-attribute/template/dynamic-loader inventory plus heuristic global producer-consumer candidates and validation. | Candidate only until hosted workflow passes. The report is not a semantic dependency DAG and does not extract/reorder application code. |
| P130 | No code change. | Blocked on user-owned deployed Supabase, schema/RLS, secrets configuration and two-device restore proof. |
| P122.3 MCP | No connector/service fabricated. | Not implementable safely without approved feature contract, transport, authentication, consent, permissions and threat model. |
| P70 / P142 real-world gates | Deliberately deferred per user request. | Keep all fourteen P70 manual gates open until a later real browser/device/media/provider/accessibility/hosting/recovery/operations review. |

These are branch candidates, not merged or PASS. Previous mainline status remains the accepted baseline until CI and merge are verified.



## Verified update — 2026-11-21 — P124.3

- PR #63 (selected Website Engine component responsive breakpoints) merged to `main` as `ed6679faec689483db62eb718aa55e068866618b` after hosted candidate workflow run #444 succeeded.
- Hosted Chromium evidence: P124 UI interaction **15/15**; selected component received a scoped class, desktop/tablet/mobile rules were written through GrapesJS CSS Manager, canonical `CV.engines.web.save()` was called, save failure was surfaced, mobile viewport had no overflow, and page errors were zero.
- The workflow also completed its existing regression/runtime steps successfully, including the P133.2 proxy and P133.4 OPFS checks in run #444. This does not close remaining P124 advanced component editing or P133 migration work.
- PR #64 P135.1 is NOT merged: its hosted run #467 failed at the unrelated P133.2 proxy gate with UI status `Tạo proxy vượt thời gian cho phép.`; no page errors were reported. Its head is now non-mergeable against the updated main and must be rebased/cleaned before another acceptance run. Do not mark P135 complete.
- PR #65 is a duplicate/stale P139 candidate (mergeable=false; no hosted run). PR #66 is the clean P139.1 candidate stacked on the P135 branch (no hosted run yet); keep P139 partial and do not merge before the P135 base is accepted.
- P135.1 remains a partial non-destructive adjustment stack; reload persistence, masks/local corrections, smart objects, clone/patch and liquify remain open. P139.1 remains partial; precomp, physical motion blur, word/range selector, expanded keyframe editor and real-project/export acceptance remain open.


## Verified mainline update — P133/P135 — 2026-11-21

| Item | Mainline evidence | Current status / remaining |
|---|---|---|
| P133.2/P133.3 proxy reliability | PR #68 merged; candidate #44911472539 44/44, combined #44911475373 45/45, post-merge mainline #44912553516 45/45. | Implemented in main for bounded Worker/bitmap failure handling and Canvas2D fallback. Real long-footage/browser/target-device tests remain open; OPFS large-media migration remains separate. |
| P135.1 Pixel adjustment stack | PR #68 merged; same candidate and mainline runs passed Node + Chromium. | Implemented nine non-destructive stack adjustments and derived export. Adjustment metadata is memory-only over flattened PNG snapshots; reload persistence, masks/local edits, smart objects, clone/patch and liquify remain open. |
| P139.1 Motion Lab | PR #70 | Candidate only; waiting for hosted live-renderer assertion. |
| P120/P126 ComfyUI | PR #71 | Candidate only; mock-server acceptance and actual local ComfyUI/model/GPU acceptance must remain distinct. |

PR #67 was closed as superseded after PR #68 brought its verified P133 fix into main. P70 remains fail-closed with fourteen manual real-world gates.


## P139.1 live renderer integration candidate — 2026-11-21

- Candidate module `canvio-p139-motionlab.js` wraps the existing Motion Lab draw pass so per-grapheme Text Animator reaches the existing #mlCanvas renderer. Null-parent and animator data stay in existing Motion Lab snapshot objects.
- Keep P139.1 partial until the updated hosted browser render-difference assertion passes. Precomp, physical motion blur, word/range selectors, expanded keyframe editor and real-project export/target-device review remain open.


## Verified mainline update — P120/P126 — 2026-11-21

| Item | Evidence | Current status / remaining |
|---|---|---|
| P120/P126 local ComfyUI connector | PR #73 merged (edd18a7abbed57e2); hosted run #44914277311 48/48. Mock browser reports workflow completion, media upload, prompt/media mapping, history polling, output download, Asset Library handoff and zero page errors. | Connector implementation is in main. Real ComfyUI/CORS, locally installed free models/custom nodes, model licensing, GPU/VRAM, inference latency and output quality remain open acceptance. Do not mark P120/P126 fully complete from mock tests alone. |

PR #71 was closed as superseded by clean-main PR #73; the latter carries the corrected nested-prompt graph assertion and null-safe Asset Library test mock.


## P120/P126 connector scope correction — 2026-11-21

- Candidate implementation: local ComfyUI API workflow bridge in `canvio-p120-p126-comfyui.js`, registered with existing P128 orchestrator. Supports image/video/upscale/interpolate routes with user-provided API-format graph and explicit input mapping.
- Automated acceptance uses a mock local ComfyUI HTTP server; it does not claim an installed ComfyUI server, Real-ESRGAN/RIFE custom nodes, model weights, GPU inference or visual accuracy. Keep P120/P126 **partial** until real user-installed free models and representative media are tested.
- No paid API, cloud provider, model download, third-party dependency or secret is added. Only loopback URLs are accepted.

## P137.2 character and table styles candidate — 2026-11-21

- Extends P137.1 in the existing Layout Foundry module with selected-character style spans and three table presets. Applied metadata stays in existing page HTML; no second store.
- Candidate only until Node/Chromium and P143 source parity checks pass. Multi-block text styling and advanced table behavior remain open.

## P119.2 shared easing in P145.2 candidate — 2026-11-21

- P145.2 now reads the original P119 named presets and custom cubic-bezier from Motion; linear remains the default. Applies the same easedProgress to shader, Canvas2D preview and P79 video-only transition export.
- Keep P119 partial for Video Engine clip/keyframe and Website Engine timeline integration; merge only after Node/Chromium verification on current main.

## P135.2 Pixel snapshot metadata candidate — 2026-11-21

- P135.2 carries the existing adjustment stack through Pixel snapshotState() / restoreState() using a bounded PNG tEXt metadata chunk. The snapshot string remains a PNG Data URL and existing raster pixels are not changed by preview.
- Acceptance gate: Node metadata/CRC/32-layer checks, Chromium snapshot→reload→restore, P143 standalone/embedded parity. Not a claim of cloud sync or independent-device Project Vault validation.


## Verified mainline updates — 2026-11-21 — P137.2 / P119.2 / P135.2

- **P137.2** merged through PR #76 at `fa6c6c4372fff076a950fa2a17e693cbd058c55f`. Candidate workflow #534 and post-merge mainline #535 both passed 51/51. Hosted Chromium verified selected-character styling, three table presets and HTML rehydration; P143 parity was 31/31 at that point. Remaining: cross-paragraph character selection, nested style editing, advanced table semantics and print pagination.
- **P119.2** merged through PR #78 at `3b53b8d5128aa5b773bef725183b5151b029b612`. Candidate workflow #536 and post-merge mainline #538 both passed 52/52; Pages #271 passed build/report/deploy. Node reports `P119 OK` and `P145.2 OK`; Chromium confirms that the shared P119 preset/custom curve changes the actual P145.2 shader/Canvas2D output. Linear remains the default. Video Engine clip/keyframe easing and Website Engine/CSS timeline integration remain open.
- **P135.2** merged through PR #81 at `33f68481d52ca9445d0d3dae05d1cfb903b81487`. Candidate workflow #547 and post-merge mainline #549 both passed 53/53; Pages #273 and #274 passed deployment. P135.2 keeps the existing Pixel snapshot API as a PNG Data URL and stores a bounded, CRC-checked `CANVIO.P135` tEXt chunk with adjustment metadata. Chromium verified snapshot restore, reload/restore, unchanged raster, undo/redo and zero page errors. P143 parity is now 32/32 after registering P135.2.
- These are automated local/hosted-browser checks, not physical-device acceptance. P135.2 does not prove cloud/two-device sync; third-party PNG re-encoding may strip the ancillary metadata. P70 remains releaseCertified=false with fourteen manual gates open.

## P143.4 — lexical global-reference evidence candidate — 2026-11-21

- Candidate PR #83 is being rebuilt on the latest mainline after P135.2. The dependency-free scanner records static global writes, reads, simple top-level declarations, source order and SHA evidence; it adds no runtime code and moves no script/style/template or boot order.
- Its output is a lexical candidate map, not a semantic dependency/data-flow DAG. Template interpolation, destructured/aliased globals, computed names, eval, conditional execution and call-time ordering remain unproven. P143 Phase 3 staged extraction is still open until human-reviewed boundaries plus rollback, app regression, offline/PWA and CSP acceptance pass.


## Verified mainline update — P143.4 — 2026-11-21

- PR #83 merged to main as `29acd1192da8e42bad845248b1110d30a6cbfc44`. Post-merge workflow #551 passed 53/53; GitHub Pages #275 passed build/report/deploy.
- P143 standalone/inline parity 32/32; lexical scanner fixtures 14/14; style/template/loader inventory verifier 17/17. Inventory: 119 style blocks, 1,490 inline style attributes, 78 dynamic loader sites, 456 lexical dependency candidates, 33 unresolved references and 209 same-script references.
- The 456 edges are lexical order evidence, not semantic runtime dependencies or a reviewed AST/data-flow graph. Template interpolation, destructured/aliased names, computed properties, eval, conditional writes and call-time order remain unproven. P143 Phase 3 staged extraction/rollback/offline/PWA/CSP remains open.


## P119.3 Video Engine keyframe easing — candidate — 2026-11-21

- Adds the six existing `CVEasingP119.PRESETS` to the native Video Engine keyframe inspector and a safe "Lấy đường cong từ Motion" action for cubic-bezier values from the existing `#motionEase` control. `linear()` spring output is rejected as a non-Bezier curve rather than approximated silently.
- Writes only the existing `#vtKFEasing` and `#vtKFCurveX1/Y1/X2/Y2` controls. The user still commits through native `CV.engines.video.apply()`; existing `vPushUndo`, clip motion, timeline save, `snapshotState()` and `restoreState()` remain the owners.
- The canonical `vMotionEase` evaluator delegates to `CVEasingP119.bez` only when the stored values can be represented without P119 normalisation loss (Y >= -1 and at most three decimal places). Legacy Video Engine curves outside that domain use the original evaluator, preserving old projects.
- Candidate files: `canvio-p119-video.js` / `canvio-lot119v`, `tests/p127/run-p119v-tests.cjs`, `tests/p145/run-p119v-browser.py`; P143 parity is extended from 32 to 33 module pairs.
- No new timeline, project database, localStorage/IndexedDB key, history stack, editor or easing registry is introduced. Website Engine/CSS animation timeline integration, real footage, physical GPU and target-device frame-rate acceptance remain open pending hosted and manual checks.

## P119.3 shared easing with Video Engine — 2026-11-21

- Candidate integrates the six P119 named presets and custom cubic-Bezier import from Motion into the existing Video Engine keyframe inspector.
- It reuses vtKFEasing/Bezier inputs and existing native Apply/Undo/snapshot contracts. The vMotionEase evaluator shares P119.bez for compatible normalized curves; legacy curves outside P119's exact normalisation domain retain the previous evaluator.
- Acceptance: Node P119.3 contract tests, real Chromium image clip → preset/custom Motion → motionAt output → existing snapshot restore, P143 33-module parity. Website Engine/CSS timeline remains open.

## P143.4 verified mainline — 2026-11-21

- PR #83 mainline workflow #551 passed 53/53; Pages #275 deployed. P143 parity 32/32, scanner 14/14, verifier 17/17. Lexical 456 candidates are not a semantic DAG.

## P119.4 shared easing with Website Engine

- Adds six P119 preset options and explicit Motion cubic-Bezier import to the existing P47 Website Motion Builder. Apply/Clear still target the selected GrapesJS component and canonical Website Engine save/export owner.
- Candidate acceptance: P119.4 Node contract, hosted Chromium adapter/export test, P143 35-pair source parity and full hosted runtime workflow.
- No second easing registry, graph, animation timeline, store, local persistence or paid dependency is added. The UI reuses the Motion graph and original reduced-motion export.
- Real authored project, external publish host CSP/headers, keyboard/screen-reader and physical-device checks remain manual.


| P146.1 | **Integrated candidate — QA added** | Home guided workflow panel with five HR/business/training/marketing/video routes, existing Home prompt + Shared Core handoff; Node source-parity and hosted Chromium tests added. | Await hosted CI result after commit; human keyboard/screen-reader/mobile review and real-project acceptance remain. |

## P124.4 selected layout and variant application

- Adds selected-component Stack/Row/Grid/Split CSS layout and whitelisted visual variants to existing P124 Website Engine. No component tree rebuild, new editor, data store or dependency.
- Candidate verification: 24 source contract checks, Node apply/save tests, hosted Chromium selected layout/variant and responsive CSS; P143 standalone/inline parity; integrated HTML audit and complete runtime suite.
- Remaining P124 scope: nested variants, arbitrary structural conversion, drag/resize, user-authored complex projects, accessibility and device/browser review.

## Reconciliation against main — 2026-11-23 (`7df9865`)

- Snapshot refreshed from the latest mainline commit and manifest. The previous P116 row incorrectly described PPTX as rasterized; the 2026-11-23 external-file checks show eight editable PowerPoint objects. P116 is now recorded as self-accepted with real Chrome H.264/audio and PowerPoint/Slides still open.
- P118 now distinguishes the custom font-outline parser from Paper.js. P124 status includes P124.4 selected-component layout while preserving its advanced interaction gaps.
- P130.1 expanded encrypted local-data-unit sync, but browser-to-browser tests run against a mock service; real Supabase deployment, RLS and physical two-device restore remain blocked.
- P133 has proxy/OffscreenCanvas and OPFS migration code. Remaining acceptance is focused on quota exhaustion, interrupted writes/rollback and long real-media behavior, not an absent OPFS module.
- P143 has a 167-script inventory and a 187-edge heuristic boot-order artifact with two forward references. This is not a semantic dependency DAG or completion of Phase 3 source extraction.
- P121, P122.3, P127 true-peak/real speech, P138 RNNoise/Piper and P142 hardware/browser matrix remain open. The focused matrix does not certify the entire historical P roadmap.
- Release gate is unchanged: manifest `releaseCertified:false`, 14/14 real-world P70 gates pending, 0 passed.


## P132.1 — PDF page import candidate (2026-11-23)

- New owner `canvio-p132-pdf-import.js` / `canvio-lot132pdf` / `window.CVPdfImportP132` 132.1.0. It renders one selected PDF page as PNG and sends it through the existing Pixel Atelier `#pxFile` input and native pixel owner.
- Local runtime: `pdfjs-dist@6.5.438`, pinned by `scripts/vendor-p132-pdf.sh`; PDF.js main/worker/CMaps/standard fonts are local, versioned and SHA-256 checked. License/notice retained.
- Bounds: PDF ≤30 MiB, ≤500 pages, one page per import, ≤4096 px per side and ≤16 MP. `isEvalSupported:false`, XFA off. Unit + same-origin Chromium + P143 parity are pending hosted CI.
- This is a raster import path, not editable PDF text/vector import. PPTX/PSD and other P132 formats remain separate; P132 is not closed by this increment.
