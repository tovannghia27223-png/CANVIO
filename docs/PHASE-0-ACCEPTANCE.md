# CANVIO Phase 0 — Acceptance Audit

**Audit date:** 2026-11-16  
**Baseline:** `main` at `85cdccc746d27df4effd99799c24d8606e5ae9fa`  
**Application build:** `23.3.60-r6`  
**Release posture:** Conditional — repository CI is green; production-origin and real-browser acceptance remain open.

## 1. Scope and safety

This audit documents verifiable release evidence and the remaining acceptance gates. It does not change `index.html`, application engines, user project data, storage schemas, or deployment settings.

The audit is intentionally conservative: a successful GitHub Actions deployment proves that the configured workflow completed. It does **not**, by itself, certify the live site's HTTP/TLS behavior, browser compatibility, persistence after a real browser restart, or all creative export paths.

## 2. Verified repository and CI evidence

| Check | Evidence | Result |
|---|---|---|
| Repository baseline | `main`, commit `85cdccc` | Verified |
| R6 application integrity | Workflow SHA-256 equals `11d1ba5394ee315e97909fba5efd99adc09a412227a443c94a3e3fdddbfed9dd` | PASS |
| Inline scripts | 79 script blocks found and checked with Node `--check` | 79/79 PASS |
| External script tags | Workflow requires zero external `src` scripts | 0 found |
| HTML IDs | 486 IDs, 486 unique | 0 duplicates |
| Build/package job | Run #14, job `Validate and package CANVIO P42 R6` | SUCCESS |
| Pages deploy job | Run #14, job `Deploy to GitHub Pages` | SUCCESS |
| Main workflow | [Run #14](https://github.com/tovannghia27223-png/CANVIO/actions/runs/43841204017) | SUCCESS |

The latest recorded run is the push to `main` for commit `85cdccc`. The prior failed Node 24 attempts are superseded by later successful runs, including the latest run above; they remain historical records, not current failures.

## 3. Release gates — status

| Gate | Current status | Acceptance evidence still required |
|---|---|---|
| P30 — hosting / HTTP / TLS | OPEN | From an external client, record final URL, status code, redirect chain, TLS certificate validity/expiry/hostname, and response headers. |
| P31 — website / SEO / accessibility acceptance | OPEN | Inspect the deployed page and rendered metadata; test navigation and key flows with keyboard and assistive technology. Existing isolated-fixture evidence is not a live-origin signoff. |
| P39 — creative persistence round-trip | CONDITIONAL | Run on the real HTTPS origin with a disposable test project: save, reload, close/reopen Chrome, recover, compare project/media state, and verify the temporary QA record is removed. Confirm native IndexedDB behavior; do not overwrite a real user project. |
| P40 — responsive / accessibility | CONDITIONAL | Verify 375, 768, 1280, and 1440 CSS-pixel viewports; test actual browser zoom at 200%, keyboard focus/operation, accessible names, and at least one screen reader. The 720px reflow proxy and automated heuristic are not WCAG certification. |
| P41 — performance / resource diagnostics | CONDITIONAL | Capture repeatable cold/warm load measurements and inspect memory, resource, and canvas behavior on target devices with representative project sizes. Record device/browser and test conditions. |
| P42 — production release candidate | CONDITIONAL | Re-run the P37–P41 evidence set on the target origin, resolve blockers, export the report, and obtain explicit human signoff. `READY_FOR_MANUAL_SIGNOFF` is not production certification. |

### Specific limitations already documented by P42

- Native IndexedDB persistence across a normal Chrome restart remains an external-origin acceptance item; isolated localStorage fallback tests do not replace it.
- Synthetic WebM playback does not certify project-specific timelines, audio sync, long media, MP4/H.264, print/PDF, or every motion-transfer path.
- A 720px viewport reflow proxy is not the same as actual browser zoom at 200%.
- Automated accessibility heuristics and Chromium accessibility-tree scans are not a substitute for real screen-reader and target-device tests.
- The existing P42 gate is fail-closed and explicitly reports missing local acceptance stages; keep this behavior.

## 4. Safe manual acceptance procedure

1. Open the deployed CANVIO URL in a clean Chrome profile and record the exact URL, Chrome version, OS, and date/time.
2. Complete P30 checks externally. Save command output or screenshots with the report; do not infer TLS or headers from a successful Actions run.
3. Create a clearly disposable test project. Never use a user's only/production project for destructive tests.
4. Exercise save → reload → close browser → reopen → recover. Verify project metadata and representative media/timeline state. Record whether the app used native IndexedDB or a fallback.
5. Test responsive layouts and keyboard-only operation; perform an actual 200% browser zoom check and a screen-reader smoke test.
6. Run performance checks with both an empty workspace and a representative non-sensitive test project. Record device details, measurements, and any regressions.
7. Export P42 evidence. Any FAIL blocks signoff; any WARN must have an owner, impact assessment, and explicit disposition.

## 5. Change-control decision

- Keep `23.3.60-r6` as the Phase 0 baseline.
- Do not modify engines, storage ownership, project schemas, or production user data as part of this evidence-only audit.
- Do not start UX unification or major Design/Video upgrades until the open Phase 0 gates have evidence and P42 has explicit manual signoff.
- This document is an audit record and test plan, not a claim that all gates are passed.

## 6. Next required inputs

A person with access to the production browser/device must perform the external-origin checks in section 4 and attach the resulting evidence. Once those results are available, update this matrix with dated outcomes and link the exported P42 report.