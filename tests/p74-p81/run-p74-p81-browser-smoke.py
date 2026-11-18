#!/usr/bin/env python3
"""Hosted CI smoke for the local Three.js r187 viewer using SwiftShader/WebGL2.
This validates an uncompressed self-contained GLB. It does not claim compressed decoder or physical GPU acceptance.
"""
from __future__ import annotations
import functools
import http.server
import json
import os
from pathlib import Path
import socketserver
import struct
import threading
import time
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
REPORT = Path(__file__).with_name('p74-p81-browser-smoke-report.json')
COMMIT = '7e89746a687bb88271253698fa108b1dd59825d0'


def make_glb() -> bytes:
    # Small triangle with embedded buffer. Geometry is intentionally uncompressed.
    positions = struct.pack('<9f', -0.7, 0.0, 0.0, 0.7, 0.0, 0.0, 0.0, 1.0, 0.0)
    indices = struct.pack('<3H', 0, 1, 2)
    binary = positions + indices + b'\x00\x00'
    doc = {
        'asset': {'version': '2.0', 'generator': 'CANVIO P74 smoke fixture'},
        'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}],
        'meshes': [{'primitives': [{'attributes': {'POSITION': 0}, 'indices': 1}]}],
        'buffers': [{'byteLength': len(binary)}],
        'bufferViews': [
            {'buffer': 0, 'byteOffset': 0, 'byteLength': len(positions), 'target': 34962},
            {'buffer': 0, 'byteOffset': len(positions), 'byteLength': 6, 'target': 34963},
        ],
        'accessors': [
            {'bufferView': 0, 'componentType': 5126, 'count': 3, 'type': 'VEC3', 'min': [-0.7, 0.0, 0.0], 'max': [0.7, 1.0, 0.0]},
            {'bufferView': 1, 'componentType': 5123, 'count': 3, 'type': 'SCALAR'},
        ],
    }
    raw_json = json.dumps(doc, separators=(',', ':')).encode('utf-8')
    raw_json += b' ' * ((4 - len(raw_json) % 4) % 4)
    binary += b'\x00' * ((4 - len(binary) % 4) % 4)
    total = 12 + 8 + len(raw_json) + 8 + len(binary)
    return (struct.pack('<III', 0x46546C67, 2, total)
            + struct.pack('<II', len(raw_json), 0x4E4F534A) + raw_json
            + struct.pack('<II', len(binary), 0x004E4942) + binary)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def main() -> None:
    manifest_path = ROOT / 'assets/three/THREE-VENDOR-MANIFEST.json'
    if not manifest_path.is_file():
        raise SystemExit('Three.js vendor manifest missing; run scripts/vendor-three-r187.sh first.')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if manifest.get('revision') != 'r187' or manifest.get('commit') != COMMIT:
        raise SystemExit('Unexpected Three.js vendor manifest revision/commit.')
    required = [
        'build/three.module.js', 'build/three.core.js',
        'examples/jsm/loaders/GLTFLoader.js', 'examples/jsm/loaders/DRACOLoader.js',
        'examples/jsm/loaders/KTX2Loader.js', 'examples/jsm/controls/OrbitControls.js',
        'examples/jsm/libs/meshopt_decoder.module.js',
        'examples/jsm/libs/draco/gltf/draco_decoder.wasm',
        'examples/jsm/libs/basis/basis_transcoder.wasm',
    ]
    for rel in required:
        if not (ROOT / 'assets/three' / rel).is_file():
            raise SystemExit('Required local runtime file missing: ' + rel)

    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = socketserver.ThreadingTCPServer(('127.0.0.1', 0), handler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = f'http://127.0.0.1:{server.server_address[1]}'
    requests: list[str] = []
    page_errors: list[str] = []
    console_errors: list[str] = []
    checks: dict[str, bool] = {}

    def record(name: str, ok: bool, detail: str = '') -> None:
        checks[name] = bool(ok)
        if not ok:
            raise AssertionError(name + (': ' + detail if detail else ''))
        print('PASS', name, detail)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=[
                '--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle',
                '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist',
                '--enable-unsafe-swiftshader',
            ])
            page = browser.new_page(viewport={'width': 1440, 'height': 1000})
            page.on('request', lambda req: requests.append(req.url))
            page.on('pageerror', lambda error: page_errors.append(str(error)))
            page.on('console', lambda msg: console_errors.append(msg.text[:500]) if msg.type == 'error' else None)
            page.goto(origin + '/index.html', wait_until='load', timeout=120000)
            page.wait_for_timeout(3500)
            record('app exposes P74 owner', page.evaluate('!!window.CANVIOThreeGLBViewerP74'))
            record('P74 panel mounted beside P72', page.locator('#cv74-three-panel').count() == 1)
            record('vendor modules remain unloaded at boot', not any('/assets/three/' in url for url in requests))
            record('P72 shared GLB file input exists', page.locator('#cv72-file').count() == 1)
            page.locator('#cv72-file').set_input_files({'name': 'canvio-p74-smoke.glb', 'mimeType': 'model/gltf-binary', 'buffer': make_glb()})
            page.locator('#cv74-load').click()
            page.wait_for_function("document.querySelector('#cv74-status')?.textContent.includes('Đã tải GLB')", timeout=120000)
            snapshot = page.evaluate('''() => ({
              tests: window.CANVIOThreeGLBViewerP74.tests(),
              report: JSON.parse(document.querySelector('#cv74-report').textContent),
              webgl2: !!document.querySelector('#cv74-canvas').getContext('webgl2')
            })''')
            record('P74 verifies local vendor manifest', snapshot['tests']['vendorManifestVerified'])
            record('P74 imports Three.js r187', snapshot['tests']['threeModuleLoaded'])
            record('P81 imports local Draco loader', snapshot['tests']['dracoModuleLoaded'])
            record('P81 loads Meshopt decoder', snapshot['tests']['meshoptDecoderReady'])
            record('P81 imports local KTX2/Basis loader', snapshot['tests']['ktx2ModuleLoaded'])
            record('P74 renderer has WebGL2 context', snapshot['webgl2'])
            record('uncompressed embedded GLB scene loaded', snapshot['report']['scenes'] >= 1 and snapshot['report']['source'] == 'canvio-p74-smoke.glb')
            record('no network requests escape local origin', all(url.startswith(origin + '/') for url in requests))
            record('no uncaught page errors', not page_errors, json.dumps(page_errors))
            record('no console errors', not console_errors, json.dumps(console_errors))
            report = {
                'suite': 'CANVIO_P74_P81_SWIFTshader_BROWSER_SMOKE', 'candidate': '23.3.108-p85-studio-r2',
                'passed': sum(checks.values()), 'total': len(checks), 'checks': checks,
                'browser': browser.version, 'origin': origin, 'vendorCommit': COMMIT,
                'runtimeFiles': len(manifest.get('files', [])), 'uncompressedGlbFixture': True,
                'compressedDracoMeshoptKtx2FixturesExecuted': False, 'physicalGpuExecuted': False,
                'requests': requests, 'pageErrors': page_errors, 'consoleErrors': console_errors,
                'limitations': ['SwiftShader/software WebGL only.', 'GLB fixture is uncompressed; compressed Draco/Meshopt/KTX2 sample decoding remains OPEN.', 'No physical GPU or Safari/Edge certification.'],
            }
            REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            browser.close()
    finally:
        server.shutdown(); server.server_close()
    print('P74/P81 SwiftShader browser smoke: PASS')


if __name__ == '__main__':
    main()
