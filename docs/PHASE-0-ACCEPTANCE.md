# CANVIO Phase 0 — Acceptance Audit

**Audit date:** 2026-11-16  
**Application baseline:** `main` at `85cdccc746d27df4effd99799c24d8606e5ae9fa`  
**Application build:** `23.3.60-r6`  
**Audit branch:** `docs/phase-0-acceptance-audit-2026-11-16`  
**Release posture:** CONDITIONAL — automated live-origin acceptance is green, but P42 retains host-policy and project-context warnings plus human signoff items.

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
| PR branch Node 24 validation | [Latest PR validation](https://github.com/tovannghia27223-png/CANVIO/actions/runs/43847482739) | SUCCESS |
| Live-origin acceptance workflow | [Run 43847482763](https://github.com/tovannghia27223-png/CANVIO/actions/runs/43847482763) | SUCCESS |

The audit changes are limited to this file and `.github/workflows/phase0-live-acceptance.yml`. The PR build is validation-only; its Pages deployment job is skipped by design.

## 3. Live-origin results

Latest verified live run: [CANVIO Phase 0 Live Acceptance](https://github.com/tovannghia27223-png/CANVIO/actions/runs/43847482763).

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
| P37 reliability | 9 PASS · 0 WARN · 0 FAIL · 2 INFO | No runtime event errors observed after instrumentation. |
| P38 website acceptance | 2 PASS · 1 WARN · 0 FAIL · 1 INFO | Same-origin P30/P31 reports were collected; P30 remains WARN because the five host headers are absent. |
| P39 creative persistence | 4 PASS · 0 WARN · 0 FAIL · 2 INFO | Native IndexedDB temporary write/read/delete passed; separate Chromium-process restart test passed and test DB was cleaned up. |
| P40 responsive/accessibility | 6 PASS · 0 WARN · 0 FAIL · 1 INFO | Five viewport widths below; 80 Tab presses, 79 focus stops, 0 unnamed focus stops. |
| P41 performance diagnostics | 5 PASS · 0 WARN · 0 FAIL · 1 INFO | DOM/resource/canvas/heap checks passed. A real project export benchmark is still outstanding. |

**P41 version-provenance caveat:** the live P41 module report self-identifies as build `23.3.58-r1`, while the tested page and P42 release envelope are `23.3.60-r6`. P41 reported no failed checks, but the version attribution is not aligned. Retain these figures as diagnostic observations only until the P41 module version is confirmed or its independent versioning is documented.
| System QA | 17 PASS · 1 WARN · 0 FAIL | The one warning is one external stylesheet declaration. |
| Ops diagnostics | 22/22 PASS · 0 FAIL | Core system diagnostics passed. |

Responsive sweep:

| CSS viewport | Document width | Body width | Horizontal overflow |
|---:|---:|---:|---|
| 375 | 375 | 375 | No |
| 720 | 720 | 720 | No |
| 768 | 768 | 768 | No |
| 1280 | 1280 | 1280 | No |
| 1440 | 1440 | 1440 | No |

Keyboard smoke test: 80 Tab presses, 79 actual focusable stops observed, 0 unnamed focus stops. This test checks focus traversal and accessible names; it does not test every control's activation semantics or screen-reader announcements.

External stylesheet detail: the page declares Google Fonts CSS; the two observed stylesheet requests returned HTTP 200. System QA flags the existence of an external stylesheet as a dependency warning even though the captured requests loaded. Keep the dependency visible; do not remove or silently reclassify it without an explicit privacy/performance decision.

Latest browser performance snapshot (one isolated runner, not a device benchmark): DOMContentLoaded 1,096 ms; load event 1,108 ms; response start 232 ms; Resource Timing reported 4 resources and 1,587,215 transferred bytes; JavaScript heap used approximately 26 MB; 13 canvases with approximately 3.95 million aggregate canvas pixels. Resource Timing can omit cross-origin transfer sizes, and these measurements are not a target-device SLA.

## 4. Remaining P42 warnings and manual acceptance

The live acceptance run had **0 FAIL**, but P42 remains **CONDITIONAL** with **2 PASS · 3 WARN · 0 FAIL · 4 INFO**. Its warnings aggregate:
1. P36's previous gate (8 PASS · 2 WARN · 0 FAIL);
2. P8 Professional QC (14 PASS · 6 WARN · 0 FAIL · 2 INFO);
3. P38 website acceptance (2 PASS · 1 WARN · 0 FAIL · 1 INFO).

The P8 report was run from the home workspace, without a selected Command Center project or an initialized Website/GrapesJS editing session. Its warnings included: no active project brief; the System QA external stylesheet warning; asset/font/stock-media usage rights requiring owner confirmation; Website editor checks not mounted; and social metadata checks with three warnings. The project-selection and editor-mount warnings are context-specific. Rights confirmation cannot be inferred by automation and must be made by the content owner. Do not create a fake user project or fabricate rights evidence to make QC green.

Manual acceptance still required before calling Phase 0 fully signed off:
1. On an actual target Chrome installation, set browser zoom to 200% and inspect all critical controls and page reflow. The 720 CSS-pixel emulation above is only a reflow proxy.
2. Use at least one real screen reader (NVDA, JAWS, or VoiceOver) to smoke-test navigation, names, state announcements, dialogs, and primary workflows.
3. With a clearly disposable test project and non-sensitive media, test project save/reopen/restore and real export paths: representative timeline/audio sync, MP4/H.264 if supported, WebM, print/PDF, and motion transfer. Never use a user's only project as a test target.
4. Record target device/OS/browser and repeat a cold/warm load plus real media encode/export timing. The current P41 snapshot is a headless runner observation, not a real-device performance certification.
5. Review and approve the GitHub Pages header limitation. If those five headers are mandatory, choose and authorize a host/CDN capable of response-header configuration, then run the live workflow against that approved origin. No DNS, provider, or production route change is authorized by this PR.

## 5. Change-control decision

- Keep `23.3.60-r6` as the application baseline.
- Keep the PR draft until the documented manual signoffs and header-policy decision are recorded.
- Do not alter the app engine, schema, storage owner, project data, or main deployment to suppress QA warnings.
- Do not begin UX unification or major Design/Video upgrades until P42 is no longer conditional and the Phase 0 owner signs off the remaining manual items.

This document records the current evidence and remaining blockers. It does not claim Phase 0 is complete yet.
