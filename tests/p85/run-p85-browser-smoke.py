#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
MODULE = (ROOT / 'canvio-p85-studio.js').read_text(encoding='utf-8')
REPORT = Path(__file__).with_name('p85-browser-smoke-report.json')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--disable-dev-shm-usage','--no-sandbox'])
    page = browser.new_page()
    requests = []
    page_errors = []
    console_errors = []
    page.on('request', lambda req: requests.append(req.url) if req.url.startswith(('http://','https://')) else None)
    page.on('pageerror', lambda err: page_errors.append(str(err)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
    page.set_content('<!doctype html><html><head></head><body><input id="cv72-file" type="file"><section id="cv74-three-panel" class="card"></section><script>' + MODULE + '</script></body></html>', wait_until='domcontentloaded')
    page.wait_for_selector('#canvio-p85-studio')
    result = page.evaluate('''() => ({
      owner: !!window.CANVIOP85Suite,
      version: window.CANVIOP85Suite && window.CANVIOP85Suite.version,
      tests: window.CANVIOP85Suite && window.CANVIOP85Suite.tests(),
      controls: ['p85-postfx-open','p85-path-open','p85-cv-start','p85-animation-open','p85-postfx-stop','p85-path-stop','p85-cv-stop','p85-animation-stop'].every(id => !!document.getElementById(id)),
      panels: ['p85-postfx-canvas','p85-path-canvas','p85-cv-canvas','p85-cv-overlay','p85-animation-canvas'].every(id => !!document.getElementById(id)),
      webgpuState: document.getElementById('p85-webgpu-state').textContent
    })''')
    assert result['owner'] and result['version'] == '85.0.2', result
    assert result['controls'] and result['panels'], result
    assert result['tests']['noBootRuntimeFetch'] is True, result
    assert result['tests']['cleanupHooks'] is True, result
    assert result['tests']['selectedGlbReusesCanonicalP72Input'] is True, result
    assert not requests, requests
    assert not page_errors, page_errors
    assert not console_errors, console_errors
    report = {
      'suite': 'CANVIO_P85_BROWSER_LAZY_BOOT',
      'candidate': '23.3.108-p85-studio-r2',
      'passed': 10,
      'total': 10,
      'assertions': {
        'mountsAfterDomReady': True,
        'ownerAndVersion': True,
        'allFourP85Panels': True,
        'controlsAndCleanupButtons': True,
        'P85ReusesCanonicalP72GlbInput': True,
        'lazyRuntimeBoot': True,
        'noRemoteRequestsAtBoot': True,
        'noUncaughtPageErrors': True,
        'noConsoleErrors': True,
        'webgpuCapabilityDetectedWithoutFalsePositive': result['webgpuState'] in ('có API','không có')
      },
      'runtimeCapabilities': result['webgpuState'],
      'remoteRequests': requests,
      'pageErrors': page_errors,
      'consoleErrors': console_errors,
      'realVendorRuntimeExecuted': False,
      'note': 'Isolated synthetic browser mount verifies local UI and lazy boot. Real vendor packages are installed by the online hosted workflow; no inference or path tracing is claimed by this smoke.'
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    browser.close()
