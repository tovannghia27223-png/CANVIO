#!/usr/bin/env python3
"""Optional Chromium runtime smoke for CANVIO P62 Phase 1 candidate.

This runs the real index.html in a Chromium document created with Playwright
set_content(). A test-only local/sessionStorage shim is injected because the
sandbox blocks all URL navigation, including localhost and file://. The page
therefore has an opaque about:blank origin: native IndexedDB, secure-context,
worker URL and persistence acceptance are explicitly NOT covered here.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except Exception as exc:  # pragma: no cover - optional dependency
    raise SystemExit(
        "Missing optional dependency: install Playwright for Python and make "
        "a Chromium executable available. Original error: " + str(exc)
    )

ROOT = Path(__file__).resolve().parents[2]
REPORT_PATH = Path(__file__).with_name("browser-smoke-report.json")
EXPECTED_VERSION = "23.3.76-p62"
EXPECTED_TITLE = "CANVIO 23.3.76-p62 — Phase 1 Release Candidate"

STORAGE_SHIM = r"""<script id="canvio-p56-test-storage-shim">
(() => {
  function makeStorage() {
    const values = new Map();
    return {
      get length() { return values.size; },
      key(index) { return Array.from(values.keys())[index] ?? null; },
      getItem(key) { key = String(key); return values.has(key) ? values.get(key) : null; },
      setItem(key, value) { values.set(String(key), String(value)); },
      removeItem(key) { values.delete(String(key)); },
      clear() { values.clear(); }
    };
  }
  Object.defineProperty(window, 'localStorage', { configurable: true, value: makeStorage() });
  Object.defineProperty(window, 'sessionStorage', { configurable: true, value: makeStorage() });
})();
</script>"""


def require(condition: bool, label: str, detail: str = "") -> None:
    if not condition:
        raise AssertionError(label + (": " + detail if detail else ""))
    print("PASS", label, detail)


def main() -> int:
    source = (ROOT / "index.html").read_text(encoding="utf-8")
    if re.match(r"^\s*<!doctype", source, re.I):
        source = re.sub(
            r"^(\s*<!doctype[^>]*>)",
            lambda match: match.group(1) + STORAGE_SHIM,
            source,
            count=1,
            flags=re.I,
        )
    else:
        source = STORAGE_SHIM + source

    # Prefer an explicitly selected/system browser for local reproduction; fall
    # back to the browser binary installed by `python -m playwright install chromium`.
    executable = os.environ.get("CHROMIUM_EXECUTABLE_PATH")

    results: dict[str, object] = {
        "format": "CANVIO_P62_CHROMIUM_RUNTIME_SMOKE",
        "version": 1,
        "candidate": "P62",
        "browser": None,
        "origin": "about:blank",
        "testOnlyStorageShim": True,
        "limitations": [
            "Opaque about:blank origin; native IndexedDB and secure-context acceptance are not covered.",
            "Navigation to localhost, file:// and other URLs is blocked by the host browser policy.",
            "No Safari/Edge, real Whisper model download/inference, screen-reader or hosting acceptance in this run."
        ],
        "checks": [],
    }
    errors: list[str] = []
    console_errors: list[str] = []
    passed = 0

    with sync_playwright() as playwright:
        if not executable:
            bundled = Path(playwright.chromium.executable_path)
            if bundled.is_file():
                executable = str(bundled)
            else:
                executable = shutil.which("chromium") or shutil.which("chromium-browser")
        if not executable or not Path(executable).is_file():
            raise SystemExit("Chromium executable not found. Install it with `python -m playwright install chromium` or set CHROMIUM_EXECUTABLE_PATH.")
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=executable,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        page = browser.new_page(viewport={"width": 1440, "height": 1000}, accept_downloads=True)
        results["browser"] = browser.version
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: console_errors.append(message.text[:1000]) if message.type == "error" else None)

        # The sandbox has no external font access. Fulfill those stylesheet requests
        # with an empty stylesheet so font networking does not mask app runtime errors.
        page.route("https://fonts.googleapis.com/**", lambda route: route.fulfill(status=200, content_type="text/css", body=""))
        page.route("https://fonts.gstatic.com/**", lambda route: route.fulfill(status=200, content_type="font/woff2", body=b""))

        page.set_content(source, wait_until="load", timeout=120_000)
        page.wait_for_timeout(4_200)  # includes the legacy P42 title-observer timer

        title = page.title()
        version = page.evaluate("window.CANVIO_BUILD && window.CANVIO_BUILD.version")
        require(version == EXPECTED_VERSION, "P62 app build marker is active", str(version))
        results["checks"].append({"id": "build-marker", "status": "pass", "value": version})
        passed += 1
        require(title == EXPECTED_TITLE, "P62 title survives inherited title observers", title)
        results["checks"].append({"id": "document-title", "status": "pass", "value": title})
        passed += 1

        # Exercise core SPA navigation and lazy Video Engine initialization.
        visited: list[str] = []
        for name in ["home", "poster", "web", "videoEngine", "assets", "motion", "insight", "export", "settings"]:
            page.evaluate("name => CV.go(name)", name)
            page.wait_for_timeout(200)
            active = page.locator(".page.active").first.get_attribute("id") if page.locator(".page.active").count() else ""
            require(active == "page-" + name, "SPA route mounts " + name, str(active))
            visited.append(name)
            passed += 1
        results["checks"].append({"id": "spa-navigation", "status": "pass", "pages": visited})

        page.evaluate("CV.go('videoEngine')")
        page.wait_for_timeout(800)
        phase_tests = page.evaluate("CANVIOPhaseSuite.tests()")
        phase_failed = [key for key, value in phase_tests.items() if value is not True]
        require(not phase_failed, "P47–P62 runtime PhaseSuite flags all true after Video Engine mount", ", ".join(phase_failed))
        results["checks"].append({"id": "phase-suite", "status": "pass", "flags": phase_tests})
        passed += 1

        phase1 = page.evaluate("""async () => {
          const storage = await CANVIOPersistenceAudit.inspect();
          const a11y = CANVIOAccessibilityAudit.inspect(document);
          const hosting = CANVIOHostingSecurityAudit.inspect();
          const worker = await CANVIOWhisperAcceptance.inspectWorker();
          const gate = await CANVIOPhase1ReleaseGate.run();
          return {
            p57: {api:true, databaseAvailable:storage.databaseAvailable, readOnly:storage.scope.readOnly, schemaChanged:storage.scope.schemaChanged},
            p58: !!CANVIOExportAcceptance.inspectFile,
            p59: {api:true, workerChecked:worker.checked, inferenceNotClaimed:worker.modelInferenceTested===false},
            p60: {api:true, issueCount:a11y.issueCount, wcagCertified:a11y.scope.wcagCertified},
            p61: {api:true, serverHeadersVerified:hosting.serverSecurityHeadersVerified},
            p62: {candidate:gate.candidate, implementation:gate.implementation, gateCount:gate.manualGates.length, releaseCertified:gate.releaseCertified, status:gate.status},
            dashboard:!!document.getElementById('cv-phase1-acceptance')
          };
        }""")
        require(phase1["p57"]["api"] and phase1["p57"]["readOnly"] and phase1["p57"]["schemaChanged"] is False, "P57 storage audit runs read-only without schema migration", json.dumps(phase1))
        passed += 1
        require(phase1["p58"] and phase1["p59"]["api"] and phase1["p59"]["inferenceNotClaimed"], "P58 export acceptance and P59 Whisper worker diagnostics are wired", json.dumps(phase1))
        passed += 1
        require(phase1["p60"]["api"] and phase1["p60"]["wcagCertified"] is False and phase1["p61"]["api"] and phase1["p61"]["serverHeadersVerified"] is False, "P60/P61 screening APIs preserve manual-audit boundaries", json.dumps(phase1))
        passed += 1
        require(phase1["p62"]["candidate"] == "P62" and phase1["p62"]["gateCount"] == 6 and phase1["p62"]["releaseCertified"] is False and phase1["dashboard"], "P62 dashboard/report remains fail-closed with six manual gates", json.dumps(phase1))
        results["checks"].append({"id":"phase1-p57-p62-apis","status":"pass","value":phase1})
        passed += 1

        # P56 archive integrity preflight (retained): validate a real CANVIO CVZip output,
        # reject a local/central CRC mismatch, and prove the preview omits values.
        p56_archive = page.evaluate("""async () => {
          const payload = {format:'CANVIO_FULL_BACKUP', createdAt:'2026-11-17T10:00:00.000Z', schema:2,
            localStorage:{'canvio:project:smoke':'safe-value','canvio:provider:token':'DO_NOT_SHOW'},
            indexedDB:[], excludedKeys:['canvio:provider:token'], warnings:[]};
          const blob = await CVZip.build([{name:'manifest.json',data:'{}'},{name:'full-backup.json',data:JSON.stringify(payload)}]);
          const valid = await CANVIOArchivePreflight.inspect(blob);
          const before = localStorage.length;
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const view = new DataView(bytes.buffer);
          let eocd = -1;
          for (let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--) if(view.getUint32(i,true)===0x06054b50){eocd=i;break;}
          if(eocd<0) throw new Error('Test ZIP missing EOCD');
          const cdOffset=view.getUint32(eocd+16,true);
          const bad=bytes.slice();
          new DataView(bad.buffer).setUint32(cdOffset+16,0x12345678,true);
          let mismatchRejected=false;
          try { await CANVIOArchivePreflight.inspect(new Blob([bad],{type:'application/zip'})); }
          catch(e) { mismatchRejected=/không khớp/.test(String(e.message||e)); }
          const preview=CANVIOArchivePreflight.summarizePayload(payload,{status:'verified'});
          return {valid:valid.valid,entries:valid.entryCount,central:valid.scope.centralDirectoryVerified,localHeaders:valid.scope.localHeadersMatched,
            mismatchRejected,preview,previewLeaksSecret:JSON.stringify(preview).includes('DO_NOT_SHOW')||JSON.stringify(preview).includes('canvio:provider:token'),
            storageUnchanged:localStorage.length===before};
        }""")
        require(p56_archive["valid"] and p56_archive["central"] and p56_archive["localHeaders"], "P56 accepts real CVZip output after Central Directory/Local Header verification", json.dumps(p56_archive))
        passed += 1
        require(p56_archive["mismatchRejected"], "P56 rejects tampered Central Directory CRC metadata", json.dumps(p56_archive))
        passed += 1
        require(not p56_archive["previewLeaksSecret"] and p56_archive["preview"]["localStorageKeys"] == 1 and p56_archive["storageUnchanged"], "P56 restore preview omits secret values and leaves storage unchanged", json.dumps(p56_archive))
        results["checks"].append({"id": "p56-archive-integrity-preview", "status": "pass", "value": p56_archive})
        passed += 1

        duplicates = page.evaluate("""() => {
          const counts = new Map();
          for (const node of document.querySelectorAll('[id]')) counts.set(node.id, (counts.get(node.id) || 0) + 1);
          return [...counts.entries()].filter(([, count]) => count > 1);
        }""")
        require(not duplicates, "No duplicate IDs after runtime navigation", json.dumps(duplicates[:20]))
        results["checks"].append({"id": "runtime-duplicate-ids", "status": "pass", "count": 0})
        passed += 1

        # Exercise effective track state and WebVTT logic through the real public API.
        track_result = page.evaluate("""() => {
          const video = CV.engines.video;
          const before = video.trackState(1).hidden;
          video.toggleTrack(1, 'hidden');
          const during = video.trackState(1).hidden;
          video.toggleTrack(1, 'hidden');
          const after = video.trackState(1).hidden;
          const parsed = video.vttParse('WEBVTT\\n\\n00:00:00.000 --> 00:00:01.200\\nCANVIO QA');
          return {before, during, after, parsed: Array.isArray(parsed) ? parsed.length : (parsed && parsed.cues ? parsed.cues.length : null)};
        }""")
        require(track_result["during"] is True and track_result["after"] is False, "Video track visibility toggles and restores", str(track_result))
        passed += 1
        require(track_result["parsed"] == 1, "WebVTT parser accepts one valid cue", str(track_result))
        passed += 1
        results["checks"].append({"id": "video-track-vtt", "status": "pass", "value": track_result})

        # Create a short deterministic text-only timeline; no user media is touched.
        setup = page.evaluate("""() => {
          const api = CV.engines.video, state = api._state();
          state.clips = [{id:'p62-browser-smoke', name:'P62 browser smoke', type:'text', text:'CANVIO P55 MEDIA TEST', start:0, duration:0.9, track:3, captionStyle:{fontSize:48, position:'center', bgOpacity:35}}];
          state.selected = 'p62-browser-smoke'; state.duration = 0.9; state.time = 0;
          api.commit();
          const originalClick = HTMLAnchorElement.prototype.click;
          HTMLAnchorElement.prototype.click = function() {
            if (this.download && /\\.(webm|mp4)$/i.test(this.download)) {
              window.__canvioP56SmokeDownload = {name:this.download, href:this.href};
              return;
            }
            return originalClick.call(this);
          };
          return {canvasWidth:document.getElementById('vtCanvas').width, canvasHeight:document.getElementById('vtCanvas').height};
        }""")
        results["timelineFixture"] = setup

        def export_and_decode(method: str, extension: str) -> dict:
            return page.evaluate(
                """async ({method, extension}) => {
                  const api = CV.engines.video;
                  const blob = await api[method]();
                  if (!blob || !blob.size) throw new Error(method + ' returned no video data');
                  const mime = String(blob.type || '');
                  if (extension === 'mp4' && (!/^video\\/mp4(?:;|$)/i.test(mime) || !/(?:avc1|avc3)/i.test(mime))) {
                    throw new Error('Unexpected MP4/H.264 MIME: ' + mime);
                  }
                  if (extension === 'webm' && !/^video\\/webm(?:;|$)/i.test(mime)) throw new Error('Unexpected WebM MIME: ' + mime);
                  const url = URL.createObjectURL(blob), video = document.createElement('video');
                  video.preload = 'metadata'; video.src = url; document.body.appendChild(video);
                  try {
                    await new Promise((resolve, reject) => {
                      video.onloadedmetadata = resolve;
                      video.onerror = () => reject(new Error('browser could not decode ' + extension));
                    });
                    const selected = new File([blob], 'canvio-smoke.' + extension, {type:mime});
                    const accepted = await CANVIOExportAcceptance.inspectFile(selected, {timeoutMs:10000});
                    return {size:blob.size, mime, duration:video.duration, width:video.videoWidth, height:video.videoHeight, readyState:video.readyState, p58:{metadataReadable:accepted.metadataReadable,decodeReadiness:accepted.decodeReadiness,avSyncCertified:accepted.scope.avSyncCertified}, download:window.__canvioP56SmokeDownload || null};
                  } finally { URL.revokeObjectURL(url); video.remove(); }
                }""",
                {"method": method, "extension": extension},
            )

        webm_result = export_and_decode("exportWebM", "webm")
        require(webm_result["size"] > 0 and webm_result["duration"] >= 0.7 and webm_result["width"] == 960, "CANVIO WebM render produces browser-decodable media", json.dumps(webm_result))
        results["checks"].append({"id": "real-webm-export-decode", "status": "pass", "value": webm_result})
        passed += 1
        require(webm_result.get("p58", {}).get("metadataReadable") and webm_result.get("p58", {}).get("decodeReadiness") and webm_result.get("p58", {}).get("avSyncCertified") is False, "P58 independently reads metadata/decode-readiness of the generated file", json.dumps(webm_result.get("p58")))
        passed += 1

        caps = page.evaluate("CV.engines.video.exportCapabilities()")
        results["codecCapabilities"] = caps
        if caps.get("mp4Mime"):
            mp4_result = export_and_decode("exportMP4", "mp4")
            require(mp4_result["size"] > 0 and mp4_result["duration"] >= 0.7 and mp4_result["width"] == 960, "CANVIO MP4/H.264 render produces browser-decodable media", json.dumps(mp4_result))
            results["checks"].append({"id": "real-mp4-h264-export-decode", "status": "pass", "value": mp4_result})
            passed += 1
        else:
            results["checks"].append({"id": "real-mp4-h264-export-decode", "status": "skip", "reason": "This Chromium build does not report a supported AVC MIME."})

        # Cancel an in-flight export and prove the engine can export again afterwards.
        cancel_result = page.evaluate("""async () => {
          const state = CV.engines.video._state(); state.duration = 5; state.time = 0;
          const pending = CV.engines.video.exportWebM();
          setTimeout(() => CV.engines.video.cancelExport(), 250);
          const blob = await pending;
          return {returnedBlob:!!blob, recovery:CANVIOReleaseGate.renderRecovery.recover()?.status, cancelButtonDisabled:document.getElementById('vtExportCancel')?.disabled};
        }""")
        require(not cancel_result["returnedBlob"] and cancel_result["recovery"] == "cancelled" and cancel_result["cancelButtonDisabled"] is True, "In-flight WebM render can be cancelled and cleans up UI", json.dumps(cancel_result))
        results["checks"].append({"id": "render-cancel", "status": "pass", "value": cancel_result})
        passed += 1
        page.evaluate("const s=CV.engines.video._state();s.duration=.8;s.time=0")
        retry = export_and_decode("exportWebM", "webm")
        require(retry["size"] > 0, "A new WebM render succeeds after cancellation", json.dumps(retry))
        results["checks"].append({"id": "render-retry-after-cancel", "status": "pass", "value": retry})
        passed += 1

        # Responsive overflow check; 720 CSS px is a 200%-zoom reflow proxy only.
        viewport_checks = []
        for width in [1440, 768, 720, 375, 320]:
            page.set_viewport_size({"width": width, "height": 900})
            page.wait_for_timeout(100)
            metric = page.evaluate("({width:innerWidth, documentWidth:document.documentElement.scrollWidth, bodyWidth:document.body.scrollWidth})")
            metric["overflow"] = metric["documentWidth"] > width
            viewport_checks.append(metric)
        require(all(not item["overflow"] for item in viewport_checks), "No horizontal document overflow at 1440/768/720/375/320 px", json.dumps(viewport_checks))
        results["checks"].append({"id": "responsive-widths", "status": "pass", "value": viewport_checks})
        passed += 1

        # Release report should block in this harness because about:blank is not a secure origin.
        release = page.evaluate("CANVIOReleaseGate.run()")
        require(release["releaseCertified"] is False, "P56 inherited release gate never self-certifies", str(release["releaseCertified"]))
        require(release["status"] == "BLOCKED" and any("secure-context" in item for item in release["failures"]), "Release report correctly records opaque-origin blocker", json.dumps(release["failures"]))
        results["checks"].append({"id": "release-gate-fail-closed", "status": "pass", "value": {"status":release["status"],"failures":release["failures"],"manualAcceptance":release["manualAcceptance"]}})
        passed += 2

        require(not errors, "Zero uncaught JavaScript page errors", json.dumps(errors))
        results["checks"].append({"id": "uncaught-page-errors", "status": "pass", "count": len(errors)})
        passed += 1
        require(not console_errors, "Zero browser console errors after font requests are stubbed", json.dumps(console_errors))
        results["checks"].append({"id": "console-errors", "status": "pass", "count": len(console_errors)})
        passed += 1

        browser.close()

    results["summary"] = {"passed": passed, "failed": 0, "status": "PASS_WITH_ORIGIN_LIMITATIONS"}
    REPORT_PATH.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nP62 Chromium browser smoke: {passed} checks passed; origin-dependent acceptance remains pending.")
    print("Report:", REPORT_PATH)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print("P56 browser smoke failed:", repr(error), file=sys.stderr)
        raise
