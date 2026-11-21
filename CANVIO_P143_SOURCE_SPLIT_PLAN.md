# P143 — Source split and modularization plan

## Goal

Reduce CANVIO's single-file authoring burden without breaking the canonical app boot order, old workspace behavior, same-origin offline support, or the P70 requirement for a self-contained delivered HTML candidate.

## Current architecture observations

- CANVIO's canonical browser artifact remains a large `index.html` reconstructed by the hosted candidate workflow from verified source chunks.
- A growing set of feature modules already have tracked standalone `canvio-p*.js` sources and are embedded into stable inline script lots during the build.
- The application has real cross-module ordering and global owners (`CV`, `CVWS`, editors, timeline, stores and export adapters). Moving all scripts to asynchronous external `src` tags in one pass could change boot order and undermine the existing no-external-script/offline acceptance contract.

## Phase 1 — standalone source parity gate (this increment)

- Add `tests/p143/source-module-map.json` for 20 workflow-managed standalone modules and canonical inline lot IDs.
- Add `tests/p143/run-p143-source-parity.cjs`: checks exactly one lot per module, Node syntax in both forms, normalized standalone/embedded content parity, and rejects classic-script import statements or literal `</script` in source text.
- Run the parity gate after all candidate integration steps and before the full inline HTML audit.
- The gate verifies these 20 paired modules only. It does not certify every inline block or claim full modularization.

## Phase 2 — complete source inventory

- Enumerate every inline script/style block from the reconstructed canonical artifact.
- Map each block to its current functional owner, global dependencies, initialization timing, DOM/page dependencies, storage/API surface and event listeners.
- Identify which blocks already have standalone source, which are embedded-only, and which have multiple historical copies.
- Record the inventory and dependency DAG before choosing extraction boundaries.

## Phase 3 — reversible extraction

- Extract one dependency-bounded module at a time to tracked source files.
- Keep a stable inline build-lot in the canonical HTML until parity, syntax, runtime and rollback tests pass.
- Never create duplicate state/store/router/timeline owners.
- Preserve deterministic initialization order; do not switch legacy code to async/defer without a dependency and boot-order test.
- Add source/embedded parity tests for every extracted module and keep historical implementations available until acceptance closes.

## Phase 4 — stylesheet and asset boundaries

- Inventory inline CSS and embedded templates/assets separately.
- Preserve theme tokens, CSP, offline cache rules, reduced-motion behavior and print styles.
- Any external same-origin asset needs an offline/PWA test and production-origin CSP validation before acceptance.

## Acceptance boundaries

- Phase 1 is complete only when the 20-module parity test passes in hosted CI.
- P143 as a full project-wide source split remains open until the full inventory, dependency DAG, staged extraction and app/rollback/browser acceptance are completed.
## Phase 2 — canonical inline script inventory (added 2026-11-21)

- Generate tests/p143/inline-source-inventory.json from the final rebuilt canonical index.html after workflow-managed integrations.
- Record script order, ID/type/src/async/defer/nomodule, byte length, SHA-256, obvious window.* exports and heuristic references to known global owners.
- Package the JSON with candidate source/evidence.
- The report is an exhaustive script-tag inventory only. Heuristic references do not establish a semantic dependency DAG. CSS, inline styles, HTML template payloads and dynamically constructed script paths must be separately catalogued before extraction.
- Do not move/reorder scripts based on this report alone. Next step is human-reviewed boot-order and dependency analysis.

## Phase 1 parity coverage extension — 27 pairs (2026-11-21)

- The source registry now lists 27 standalone feature modules and canonical inline lot IDs.
- Added P127 Loudness, P127 Templates, P133 Resilience, P134 Scopes, P138 Denoise, P140 Charts and P145 SFX; each already has its own individual parity test.
- No runtime code or script order changed. Central gate remains data-driven from source-module-map.json; hosted acceptance required before merge.

## Phase 1 — final parity coverage (27 modules, 2026-11-21)

- PR #55 merged. The central registry contains 27 standalone feature sources paired with their canonical inline lots.
- Hosted candidate run #386 and post-merge mainline run #387 both passed 41/41. P143 parity report: 27 passed, 0 failed.
- Added P127 Loudness, P127 Templates, P133 Resilience, P134 Scopes, P138 Denoise, P140 Charts and P145 SFX to the prior 20-module registry.
- No runtime code or browser script order changed in the expansion.

## Remaining P143 phases

- Phase 2 script-tag inventory is complete: 150 tags in exact source order, all inline; zero external src, module, async or defer; 147 unique IDs and no duplicate IDs.
- Still required: inventory CSS and inline styles, HTML template payloads and dynamic script construction; human-reviewed semantic dependency/boot-order graph; then incremental reversible extraction with application regression, offline/PWA, CSP and rollback tests.
- The global-reference list in the script inventory is heuristic only and must not be treated as a semantic dependency graph.


## Phase 2.1 — styles, templates and dynamic loader inventory (candidate, 2026-11-21)

- Added tests/p143/build-styles-template-inventory.cjs to inspect the reconstructed canonical index.html after all workflow integration steps.
- Captures style block order/IDs/media/byte sizes/SHA and approximate selector samples; records inline style-attribute order/element/byte size/SHA; inventories literal template elements; detects common dynamic loader call sites (createElement('script'), script .src, importScripts, Worker/SharedWorker, dynamic import(), fetch, document.write, iframe .src).
- Produces heuristic candidate dependency edges by linking knownGlobalReads to exportedGlobals in the P143 script inventory and preserves script order. Every edge is explicitly labeled heuristic.
- Added tests/p143/verify-style-template-inventory.cjs to check the report against the canonical HTML and validate scope/limitations. Candidate workflow executes both and uploads the JSON report.
- This step does not claim semantic dependency resolution: dynamically assembled markup/code, data flow, runtime listener registrations and call-time ordering still require review. No runtime code was moved or reordered.

## Remaining P143 phases

- Human-review and correct the candidate dependency pairs into a semantic boot-order/data-flow graph.
- Inventory HTML templates embedded in JavaScript strings, runtime-created stylesheets and other dynamic asset construction that regex inspection cannot prove complete.
- Choose dependency-bounded extraction units, add source/embedded parity for each, then extract one at a time with rollback, app regression, offline/PWA, CSP and deployment checks.

