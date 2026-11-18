#!/usr/bin/env python3
"""Chromium runtime smoke for CANVIO P63–P67 Creative Production candidate.

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
EXPECTED_VERSION = "23.3.108-p85-studio-r2"
EXPECTED_TITLE = "CANVIO 23.3.108 — Creative Runtime Lab · P85 Runtime Hardening r2"

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
        "format": "CANVIO_P63_P67_INHERITED_CHROMIUM_RUNTIME_SMOKE",
        "version": 1,
        "candidate": EXPECTED_VERSION,
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
        require(version == EXPECTED_VERSION, "Current candidate build marker is active", str(version))
        results["checks"].append({"id": "build-marker", "status": "pass", "value": version})
        passed += 1
        require(title == EXPECTED_TITLE, "Current candidate title survives inherited title observers", title)
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
        require(not phase_failed, "P47–P67 runtime PhaseSuite flags all true after Video Engine mount", ", ".join(phase_failed))
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

        # P63–P67 runtime APIs and UI controls are exercised on the real app source.
        page.evaluate("CV.go('videoEngine')")
        page.wait_for_timeout(400)
        p63_p64 = page.evaluate("""() => {
          const api = CV.engines.video, state = api._state();
          const base = {clips:state.clips, selected:state.selected, duration:state.duration, time:state.time};
          state.clips = [
            {id:'p67-a',name:'A',type:'text',text:'A',track:3,start:0,duration:2},
            {id:'p67-b',name:'B',type:'text',text:'B',track:3,start:3,duration:1},
            {id:'p67-c',name:'C',type:'text',text:'C',track:3,start:5,duration:1}
          ]; state.selected = 'p67-a'; state.duration = 8; state.time = 2; api.commit();
          const inspect = CANVIOUnifiedTimeline.inspect();
          const validation = CANVIOUnifiedTimeline.validate();
          const grouped = CANVIOAdvancedTimeline.group(['p67-a','p67-b'],'P67 smoke group');
          const ids = CANVIOAdvancedTimeline.selectedGroup(grouped.groupId);
          const moved = CANVIOAdvancedTimeline.moveGroup(ids, 0.5);
          const duplicate = CANVIOAdvancedTimeline.duplicateGroup(ids, 2);
          const snap = CANVIOAdvancedTimeline.snap(5.02, 0.1);
          const lock = api.trackState(3); api.toggleTrack(3,'locked');
          const blocked = CANVIOAdvancedTimeline.planRippleDelete(0, 0.5);
          api.toggleTrack(3,'locked');
          const mounted = !!document.getElementById('cv-p63-67-timeline') && !!document.getElementById('cv65-track');
          state.clips = base.clips; state.selected = base.selected; state.duration = base.duration; state.time = base.time; api.commit();
          return {inspect,validation,grouped,moved,duplicate,snap,blocked,mounted,previousLock:lock.locked};
        }""")
        require(p63_p64["inspect"]["canonicalOwner"] == "CV.engines.video._state()" and p63_p64["inspect"]["mutationBoundary"]["noSecondTimelineCreated"], "P63 uses canonical Video Engine owner without creating a second timeline", json.dumps(p63_p64["inspect"]))
        passed += 1
        require(p63_p64["validation"]["fail"] == 0 and p63_p64["mounted"], "P63/P64 timeline panel and source bridges mount on Video Engine", json.dumps(p63_p64))
        passed += 1
        require(p63_p64["grouped"]["ok"] and p63_p64["moved"]["ok"] and p63_p64["duplicate"]["duplicated"] == 2 and p63_p64["snap"]["snapped"], "P64 group, move, duplicate and snap mutate canonical timeline", json.dumps({k:p63_p64[k] for k in ["grouped","moved","duplicate","snap"]}))
        passed += 1
        require(not p63_p64["blocked"]["ok"] and p63_p64["blocked"]["reason"] == "locked-clips-would-be-affected", "P64 ripple planner blocks a locked affected track before mutation", json.dumps(p63_p64["blocked"]))
        results["checks"].append({"id":"p63-p64-canonical-timeline", "status":"pass", "value":p63_p64})
        passed += 1

        p65 = page.evaluate("""() => {
          function frameAt(cx,cy,time){const w=80,h=80,d=new Uint8ClampedArray(w*h*4);for(let i=3;i<d.length;i+=4)d[i]=255;for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++){const n=((cy+y)*w+cx+x)*4,v=(Math.abs(x*37+y*71+x*y*13)*19)%256;d[n]=d[n+1]=d[n+2]=v}return {width:w,height:h,data:d,time}}
          const r=CANVIOMotionTracking.trackFrames([frameAt(30,30,0),frameAt(33,32,1),frameAt(36,34,2)],{x:30,y:30},{patchRadius:5,searchRadius:8});
          const api=CV.engines.video,s=api._state(),prior={clips:s.clips,selected:s.selected,duration:s.duration,time:s.time};
          s.clips=[{id:'p67-track',name:'Track',type:'video',track:1,start:0,duration:3}];s.selected='p67-track';s.duration=3;api.commit();
          const applied=CANVIOMotionTracking.applyToSelected(r,'stabilize');
          const keys=s.clips[0].motion&&s.clips[0].motion.keyframes||[];
          s.clips=prior.clips;s.selected=prior.selected;s.duration=prior.duration;s.time=prior.time;api.commit();
          return {samples:r.sampleCount,points:r.points.map(p=>[p.x,p.y]),localOnly:r.upload===false&&r.machineLearning===false,applied,keyframes:keys.length,api:!!document.getElementById('cv65-preview')};
        }""")
        require(p65["samples"] == 3 and p65["points"][1] == [33,32] and p65["points"][2] == [36,34], "P65 local feature tracker follows deterministic translated patch", json.dumps(p65))
        passed += 1
        require(p65["applied"]["ok"] and 2 <= p65["keyframes"] <= 8 and p65["localOnly"] and p65["api"], "P65 writes bounded transform keyframes into selected canonical clip; no model/network", json.dumps(p65))
        results["checks"].append({"id":"p65-local-tracking", "status":"pass", "value":p65})
        passed += 1

        p66 = page.evaluate("""async () => {
          CV.go('promptForge'); await new Promise(r=>setTimeout(r,250));
          const prompt=CANVIOAICreativeWorkflow.buildPrompt({brief:'Product bottle on warm stone',output:'product',ratio:'4:5'});
          const unsafe='<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><image href="https://bad.example/x"/><rect width="10" height="10"/></svg>';
          const cleaned=CANVIOAICreativeWorkflow.sanitizeSvg(unsafe);
          const f=new File(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e23"/></svg>'],'p67-smoke.svg',{type:'image/svg+xml'});
          const imported=await CANVIOAICreativeWorkflow.ingest(f,{license:'unverified',source:'P67 smoke fixture'});
          const stored=CV.assets.list().find(x=>x.id===imported.asset.id);
          await CANVIOAICreativeWorkflow.openInEditor(imported.asset.id,'vectorForge');
          const vectorLayers=document.querySelectorAll('#vfSvg g.vf-object image').length;
          return {promptHasBrief:prompt.includes('Product bottle'),sanitized:!/<script|onload|https:\\/\\//i.test(cleaned),imported:imported.ok,provenance:imported.provenancePersisted&&stored&&stored.provenance&&stored.provenance.source==='P67 smoke fixture',vectorLayers};
        }""")
        require(p66["promptHasBrief"] and p66["sanitized"], "P66 builds prompt and sanitizes active/external SVG content", json.dumps(p66))
        passed += 1
        require(p66["imported"] and p66["provenance"] and p66["vectorLayers"] >= 1, "P66 imports SVG to existing Asset Library with persisted provenance and a real Vector Forge layer", json.dumps(p66))
        results["checks"].append({"id":"p66-ai-asset-workflow", "status":"pass", "value":p66})
        passed += 1

        p67 = page.evaluate("""() => {
          CV.go('layoutFoundry');
          const before=CVNativeEngines.layout.snapshotState();
          const master=CANVIOPrintProduction.applyMaster({header:'CANVIO P67 Smoke',footer:'Internal QA',folio:true});
          const type=CANVIOPrintProduction.applyTypography({fontFamily:'Arial',letterSpacing:0.2,kerning:true,ligatures:true});
          const report=CANVIOPrintProduction.inspect({format:'A4',bleedMm:3,safeMarginMm:5});
          const html=report.summary.fail===0?CANVIOPrintProduction.buildPrintHtml({format:'A4',bleedMm:3,safeMarginMm:5}):'';
          CVNativeEngines.layout.restoreState(before);
          return {master,type,report:{status:report.status,pages:report.metrics.pages,pass:report.summary.pass,warn:report.summary.warn,fail:report.summary.fail},html:html.includes('@page{size:210mm 297mm'),layoutPanel:!!document.getElementById('cv-p67-print-production')};
        }""")
        require(p67["master"]["ok"] and p67["type"]["ok"] and p67["layoutPanel"], "P67 master elements and typography persist through existing Layout Foundry", json.dumps(p67))
        passed += 1
        require(p67["report"]["pages"] >= 1 and p67["report"]["fail"] == 0 and p67["html"], "P67 print preflight and sanitized print HTML export run on Layout Foundry snapshot", json.dumps(p67))
        results["checks"].append({"id":"p67-print-production", "status":"pass", "value":p67})
        passed += 1

        # Release gate remains fail-closed, including its inherited six manual gates.
        p2_report = page.evaluate("CANVIOPhase2.report()")
        require(p2_report["candidate"] == "P67" and p2_report["releaseCertified"] is False and p2_report["summary"]["fail"] == 0, "P63–P67 implementation report passes but never self-certifies", json.dumps(p2_report["summary"]))
        results["checks"].append({"id":"phase2-release-candidate-gate", "status":"pass", "value":{"candidate":p2_report["candidate"],"releaseCertified":p2_report["releaseCertified"],"manualGates":p2_report["manualGates"]}})
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
        require(release["releaseCertified"] is False, "P56 inherited archive/release gate never self-certifies", str(release["releaseCertified"]))
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
    print(f"\nP63–P67 inherited Chromium regression on current candidate: {passed} checks passed; origin-dependent acceptance remains pending.")
    print("Report:", REPORT_PATH)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print("P63–P67 inherited regression on current candidate failed:", repr(error), file=sys.stderr)
        raise
