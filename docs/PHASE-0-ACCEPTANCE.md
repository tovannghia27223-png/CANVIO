# CANVIO Phase 0 — Acceptance Audit

**Audit date:** 2026-11-16  
**Application baseline:** `main` at `85cdccc746d27df4effd99799c24d8606e5ae9fa`  
**Application build:** `23.3.60-r6`  
**Audit branch:** `docs/phase-0-acceptance-audit-2026-11-16`  
**Release posture:** BLOCKED — the latest live rerun (2026-11-16, run `43858132865`) mounted the Website/GrapesJS editor and exposed runtime DOM-ID and accessibility-QC failures. Do not merge this audit or start UX/Design/Video expansion until the editor findings are resolved and the live gate passes.

## 1. Scope and safety

This is an evidence-only audit of the existing R6 release. It does not change `index.html`, engines, project schemas, user project data, storage ownership, or production deployment settings.

All browser acceptance runs use a new isolated Playwright/Chromium profile. The IndexedDB restart check creates one uniquely named temporary database, writes a marker, closes the Chromium process, reopens the same test profile, verifies the marker, and deletes the database. It does not access a user's browser profile or project.

A successful CI or headless browser run is not represented as full production certification. User-created projects, actual media exports, assistive-technology use, and target hardware still require the appropriate acceptance procedure.

## 2. Verified baseline and CI

| Check | Evidence | Result |
|---|---|---|
| Production baseline | `main`, `85cdccc`, build `23.3.60-r6` | Verified |
| R6 artifact integrity | SHA-256 `11d1ba5394ee315e97909fba5efd99adc09a412227a443c94a3e3fdddbfed9dd` | PASS |
| Inline JavaScript | 79 blocks checked by Node `--check` | 79/79 PASS |
| External script tags | No inline HTML script `src` declarations | 0 |
| HTML IDs | 486 IDs, all unique | 0 duplicates |
| Main branch Pages deploy | [Actions run #14](https://github.com/tovannghia27223-png/CANVIO/actions/runs/43841204017) | SUCCESS |
| PR branch Node 24 validation | [Run 43858132875](https://github.com/tovannghia27223-png/CANVIO/actions/runs/43858132875) | SUCCESS · deploy skipped by design |
| Earlier live-origin acceptance | [Run 43847482763](https://github.com/tovannghia27223-png/CANVIO/actions/runs/43847482763) | SUCCESS · earlier coverage | 
| Latest live-origin rerun | [Run 43858132865](https://github.com/tovannghia27223-png/CANVIO/actions/runs/43858132865) | P30/P31 SUCCESS · P37–P42 FAILED |

The PR changes are limited to `docs/PHASE-0-ACCEPTANCE.md` and `.github/workflows/phase0-live-acceptance.yml`; `index.html`, application engines, project schemas, and user project data are unchanged. The PR build is validation-only; its Pages deployment job is skipped by design.

## 3. Live-origin results

Earlier successful live run: [43847482763](https://github.com/tovannghia27223-png/CANVIO/actions/runs/43847482763). The latest rerun is [43858132865](https://github.com/tovannghia27223-png/CANVIO/actions/runs/43858132865): external P30/P31 passed, but the Chromium P37–P42 job failed after exercising the Website editor. Treat the latest run as the current release gate.

### P30 — HTTPS / hosting response

**External runner:** HTTP 200, final URL remained HTTPS, 0 redirects, curl TLS verification result 0, OpenSSL certificate verification passed, HTTP/2, and the response carried `Content-Type: text/html; charset=utf-8`. HSTS was present as `max-age=31556952`.

The response did not include these headers: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`. The P30 in-app report therefore records **7 PASS · 5 WARN · 0 FAIL · 2 INFO**. These are actual host-response observations, not TLS or HTTP availability failures.

The raw HTML had a CANVIO R6 title, Vietnamese document language, viewport metadata, a meta description, 486 unique IDs, and no duplicate IDs. A canonical link was not present; record this as an SEO advisory rather than claim it passed a canonical check.

GitHub Pages served the site successfully but the tested response did not expose the five listed security headers. Adding HTML meta tags is not equivalent to setting response headers; do not add a speculative CSP that could block the app's inline scripts, media, or integrations. A hosting/CDN layer with explicit response-header configuration is a possible future route (for example, [Cloudflare Pages custom headers](https://developers.cloudflare.com/pages/configuration/headers/)), but changing providers, DNS, or production routing is outside this audit and needs explicit owner approval.

### P31 — live HTML / accessibility heuristic

The production-origin HTML audit returned **12 PASS · 0 WARN · 0 FAIL · 0 INFO**:
- title and 160-character meta description present;
- `lang="vi"` and viewport metadata present;
- one H1 in the active SPA page and no heading-level skip;
- no duplicate IDs, unnamed buttons, unlabeled fields, empty links, or unnamed links in the audited active page;
- a main landmark is present.

This is an HTML/accessibility heuristic. It is not a WCAG conformance declaration or a replacement for NVDA/JAWS/VoiceOver testing.

### P37–P42 — isolated live Chromium

| Module / check | Latest result | Notes |
|---|---:|---|
| P37 reliability | 8 PASS · 0 WARN · 1 FAIL · 2 INFO | Runtime JavaScript errors remain 0; P37 fails because the mounted Website editor leaves duplicate `gjs-sm-input-holder` IDs in the live DOM. |
| P38 website acceptance | 2 PASS · 1 WARN · 0 FAIL · 1 INFO | Same-origin P30/P31 reports were collected; P30 remains WARN because the five host headers are absent. |
| P39 creative persistence | 4 PASS · 0 WARN · 0 FAIL · 2 INFO | Native IndexedDB temporary write/read/delete passed; separate Chromium-process restart test passed and test DB was cleaned up. |
| P40 responsive/accessibility | 6 PASS · 0 WARN · 0 FAIL · 1 INFO | Scope is `page-home` only (47 inactive SPA pages excluded); 80 Tab presses, 79 focus stops, 0 unnamed focus stops on Home. This does not certify the Website editor. |
| P41 performance diagnostics | 5 PASS · 0 WARN · 0 FAIL · 1 INFO | Diagnostic budgets passed; real project export benchmark remains outstanding. The module reports build `23.3.58-r1`, not the page/P42 build `23.3.60-r6`. |

**P41 version-provenance caveat:** the live P41 module report self-identifies as build `23.3.58-r1`, while the tested page and P42 release envelope are `23.3.60-r6`. P41 reported no failed checks, but the version attribution is not aligned. Retain these figures as diagnostic observations only until the P41 module version is confirmed or its independent versioning is documented.

| System QA (editor mounted) | 15 PASS · 1 FAIL · 2 WARN | The sole fail is duplicate DOM ID `gjs-sm-input-holder`; the warning includes external dependencies. |
| Ops diagnostics (editor mounted) | 21/22 PASS · 1 FAIL | The fail is the same duplicate DOM ID finding. |

Responsive sweep:

| CSS viewport | Document width | Body width | Horizontal overflow |
|---:|---:|---:|---|
| 375 | 375 | 375 | No |
| 720 | 720 | 720 | No |
| 768 | 768 | 768 | No |
| 1280 | 1280 | 1280 | No |
| 1440 | 1440 | 1440 | No |

Keyboard smoke test: 80 Tab presses, 79 actual focusable stops observed, 0 unnamed focus stops on `page-home`. P40 explicitly scoped to Home and excluded the other 47 SPA pages; it does not test the Website editor's controls. This test checks focus traversal and accessible names on its scope; it does not test every control's activation semantics or screen-reader announcements.

External stylesheet detail: the page declares Google Fonts CSS; the two observed stylesheet requests returned HTTP 200. System QA flags the existence of an external stylesheet as a dependency warning even though the captured requests loaded. Keep the dependency visible; do not remove or silently reclassify it without an explicit privacy/performance decision.

Latest browser performance snapshot (one isolated runner, not a device benchmark): DOMContentLoaded 1,096 ms; load event 1,108 ms; response start 232 ms; Resource Timing reported 4 resources and 1,587,215 transferred bytes; JavaScript heap used approximately 26 MB; 13 canvases with approximately 3.95 million aggregate canvas pixels. Resource Timing can omit cross-origin transfer sizes, and these measurements are not a target-device SLA.

## 4. Latest rerun findings and remaining acceptance gates

The earlier live run `43847482763` reported **0 FAIL** and P42 **CONDITIONAL**. The latest run `43858132865` is authoritative for this audit because it opened the Website editor before re-running QC. Its P42 result is **BLOCKED** with **2 PASS · 1 WARN · 3 FAIL · 3 INFO**. The separate PR Node 24 validation (`43858132875`) passed; its deployment job is skipped by design. The three failing gates are P36, P8 Professional QC, and P37 reliability; P38 remains a warning. P30/P31 external-origin checks passed.

### Confirmed runtime finding

- The live page starts as R6 and the static source HTML still has 486 unique IDs. After navigating to `page-webEngine`, the editor mounts (`#gjs`, one `.gjs-editor`, one canvas, one iframe).
- The GrapesJS Style Manager then renders eight elements with the same ID `gjs-sm-input-holder`. P37 reports this as `runtime-duplicate-ids`; System QA reports it as its single failed check; P8 DOM ID integrity fails for the same reason. The duplicate is in the editor-generated DOM, not in the original 486-ID static HTML.
- P19 Accessibility & Keyboard QC, captured immediately after both P8 and P36, reproducibly reports **37 FAIL · 38 WARN · 0 PASS** across 1,390 DOM nodes / 146 interactive controls. The 37 failures are `missing-accessible-name`; the 38 warnings are not 38 additional defects: 37 repeat `form-control-unlabelled` on those same controls and one flags an H1→H3 heading jump. Examples include the P31 URL input (`cv31-url`, placeholder only), GrapesJS selector/style controls (`gjs-clm-states` and generated controls), and the Website code textarea (`we-ta`). The P19 implementation currently detects hidden ancestors using `hidden`, `aria-hidden`, and inline style text; it does not inspect computed CSS visibility, so CSS-class-hidden controls may also be included and require a scoped recheck. The browser run recorded **0 page errors and 0 console errors**, so this is not evidence of a JavaScript crash.
- Upstream GrapesJS `v0.22.13` source confirms that both [PropertySelectView](https://github.com/GrapesJS/grapesjs/blob/v0.22.13/packages/core/src/style_manager/view/PropertySelectView.ts) and [PropertyCompositeView](https://github.com/GrapesJS/grapesjs/blob/v0.22.13/packages/core/src/style_manager/view/PropertyCompositeView.ts) render `<span id="${pfx}input-holder">` for each property. Their internal render/update methods query that ID within each property view. This explains how eight duplicate global IDs appear while the editor still renders; a blind post-render rename can break select/composite rerenders. A separate probe substituting GrapesJS `0.23.9` also produced repeated generated IDs (including Class Manager IDs), so a dependency upgrade alone is not a proven fix.
- The PR Node 24 validation still succeeds; its deployment job is skipped as intended. The live Chromium workflow fails because the application QA gates detect the editor findings.

Do not suppress the duplicate-ID check, exclude the editor DOM from QA, or mark the accessibility report as passed merely to make CI green. Do not patch vendor-generated IDs blindly: GrapesJS uses the holder ID in its scoped view render/update methods. The next engineering task is a focused Website/GrapesJS integration fix: first correct P19's computed-visibility filtering and duplicate warning reporting, then add accessible names to Website/GrapesJS controls without changing editor model behavior, and resolve the vendor-generated duplicate IDs through a tested view integration or maintained patch. Regression coverage must include select/composite rerender, keyboard operation, editor navigation/unmount, and stable export/save. Re-run P37, P8, System QA, and P42 after the fix.

P8 in the same run also retains context/owner warnings: no active Command Center brief, usage-rights confirmation needed for fonts/stock media, and website social metadata checks. These should not be fabricated. The older report's statement that GrapesJS was not mounted is superseded by this newer run, which explicitly observed the mounted editor.

### Manual acceptance still required before Phase 0 signoff
1. On an actual target Chrome installation, set browser zoom to 200% and inspect all critical controls and page reflow. The 720 CSS-pixel emulation above is only a reflow proxy.
2. Use at least one real screen reader (NVDA, JAWS, or VoiceOver) to smoke-test navigation, names, state announcements, dialogs, and primary workflows.
3. With a clearly disposable test project and non-sensitive media, test project save/reopen/restore and real export paths: representative timeline/audio sync, MP4/H.264 if supported, WebM, print/PDF, and motion transfer. Never use a user's only project as a test target.
4. Record target device/OS/browser and repeat a cold/warm load plus real media encode/export timing. The current P41 snapshot is a headless runner observation, not a real-device performance certification.
5. Review and approve the GitHub Pages header limitation. If those five headers are mandatory, choose and authorize a host/CDN capable of response-header configuration, then run the live workflow against that approved origin. No DNS, provider, or production route change is authorized by this PR.

## 5. Change-control decision

- Keep `23.3.60-r6` as the application baseline.
- Keep PR #4 in Draft; do not merge while the latest P42 result is BLOCKED.
- Fix the Website/GrapesJS runtime DOM and accessibility findings first; do not change engine ownership, project schema, storage ownership, or production project data as a shortcut.
- After the editor fix, rerun the live acceptance workflow and complete the real-browser, screen-reader, disposable-project media/export, target-device performance, and hosting-header policy signoffs.
- Do not begin UX unification or major Design/Video upgrades until the latest P42 result is no longer BLOCKED/CONDITIONAL and the Phase 0 owner signs off.

This document records the current evidence and remaining blockers. It does not claim Phase 0 is complete yet.
