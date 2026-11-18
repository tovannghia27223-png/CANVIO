#!/usr/bin/env python3
"""Chromium API-contract smoke for CANVIO P72/P73/P102/P103/P105–P107.
Runs the real app source on opaque about:blank with test-only storage shims.
It validates exposed API contracts only; it does not download models or certify physical GPU behavior.
"""
from __future__ import annotations
import json
import os
import re
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
REPORT = Path(__file__).with_name('api-smoke-report.json')
EXPECTED_VERSION = '23.3.108-p85-studio-r2'
SHIM = r'''<script id="canvio-p72-p107-test-storage-shim">(()=>{function make(){const m=new Map();return{get length(){return m.size},key(i){return Array.from(m.keys())[i]??null},getItem(k){return m.has(String(k))?m.get(String(k)):null},setItem(k,v){m.set(String(k),String(v))},removeItem(k){m.delete(String(k))},clear(){m.clear()}}}Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});})();</script>'''


def require(condition: bool, name: str, detail: str = '') -> None:
    if not condition:
        raise AssertionError(name + (': ' + detail if detail else ''))
    print('PASS', name, detail)


def main() -> None:
    source = (ROOT / 'index.html').read_text(encoding='utf-8')
    source = re.sub(r'^(\s*<!doctype[^>]*>)', lambda m: m.group(1) + SHIM, source, count=1, flags=re.I)
    requests: list[str] = []
    page_errors: list[str] = []
    console_errors: list[str] = []
    with sync_playwright() as p:
        executable = os.environ.get('CHROMIUM_EXECUTABLE_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
        if not executable:
            raise SystemExit('Chromium executable not found; set CHROMIUM_EXECUTABLE_PATH.')
        browser = p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'])
        page = browser.new_page(viewport={'width': 1365, 'height': 900})
        page.on('request', lambda request: requests.append(request.url) if request.url.startswith(('http://', 'https://')) else None)
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('console', lambda message: console_errors.append(message.text[:500]) if message.type == 'error' else None)

        def block_remote(route):
            if route.request.url.startswith(('http://', 'https://')):
                route.abort()
            else:
                route.continue_()

        page.route('**/*', block_remote)
        page.set_content(source, wait_until='load', timeout=120000)
        page.wait_for_timeout(3500)
        snapshot = page.evaluate('''() => ({
          version: window.CANVIO_BUILD && CANVIO_BUILD.version,
          phase: window.CANVIOPhaseSuite && CANVIOPhaseSuite.version,
          p72: window.CANVIOGLBViewerP72 && window.CANVIOGLBViewerP72.tests(),
          p73: window.CANVIOOfflineSiteP73 && window.CANVIOOfflineSiteP73.tests(),
          p103: window.CANVIOP103Sfx && window.CANVIOP103Sfx.tests(),
          p102: window.CANVIOBackgroundRemovalP102 && window.CANVIOBackgroundRemovalP102.tests(),
          p105p107: window.CANVIODepthParallaxP105 && window.CANVIODepthParallaxP105.tests()
        })''')
        require(snapshot['version'] == EXPECTED_VERSION, 'Candidate marker is active', str(snapshot['version']))
        require(snapshot['phase'] == '70.0.0', 'Inherited PhaseSuite is preserved', str(snapshot['phase']))
        suites = {'P72': snapshot['p72'], 'P73': snapshot['p73'], 'P103': snapshot['p103'], 'P102': snapshot['p102'], 'P105–P107': snapshot['p105p107']}
        totals: dict[str, dict[str, bool]] = {}
        for name, checks in suites.items():
            require(isinstance(checks, dict) and bool(checks), name + ' API exposes contract checks')
            failed = [key for key, value in checks.items() if value is not True]
            require(not failed, name + ' API contract checks all pass', json.dumps(failed, ensure_ascii=False))
            totals[name] = checks
        require(not requests, 'Application boot makes zero HTTP(S) requests', json.dumps(requests, ensure_ascii=False))
        require(not page_errors, 'No uncaught application errors', json.dumps(page_errors, ensure_ascii=False))
        require(not console_errors, 'No browser console errors', json.dumps(console_errors, ensure_ascii=False))
        report = {
            'format': 'CANVIO_P72_P73_P102_P103_P105_P107_API_CONTRACT_SMOKE',
            'candidate': EXPECTED_VERSION,
            'browser': browser.version,
            'origin': 'about:blank',
            'testOnlyStorageShim': True,
            'apiChecks': {name: {'pass': sum(value is True for value in checks.values()), 'total': len(checks), 'allPass': all(value is True for value in checks.values())} for name, checks in totals.items()},
            'startupHttpRequests': requests,
            'pageErrors': page_errors,
            'consoleErrors': console_errors,
            'runtimeInferenceExecuted': False,
            'limitations': [
                'No ORMBG or Depth Anything model was downloaded or executed.',
                'No physical WebGPU/WASM benchmark or WebGL hardware validation.',
                'P72 GPU rendering and P73 full real-site dependency closure remain separate acceptance tasks.',
                'P107 Project Vault and cross-device synchronization round-trip are not tested.',
            ],
        }
        REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        browser.close()
    print('P72/P73/P102/P103/P105–P107 API contract smoke: PASS')


if __name__ == '__main__':
    main()
