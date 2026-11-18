#!/usr/bin/env python3
"""Hosted CI acceptance for the pinned, same-origin P85 vendor runtimes.

This test is intentionally not runnable on the offline local authoring container: it requires
assets/p85/P85-VENDOR-MANIFEST.json and the exact npm/WASM artifacts created by the pinned
vendor script. A missing vendor runtime is a hard failure in hosted CI, never a synthetic PASS.
"""
from __future__ import annotations
import functools
import http.server
import json
from pathlib import Path
import socketserver
import struct
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'assets' / 'p85'
REPORT = Path(__file__).with_name('p85-vendor-runtime-browser-smoke-report.json')


def make_glb() -> bytes:
    positions = struct.pack('<9f', -0.72, -0.48, 0.0, 0.72, -0.48, 0.0, 0.0, 0.72, 0.0)
    indices = struct.pack('<3H', 0, 1, 2)
    binary = positions + indices + b'\x00\x00'
    doc = {
        'asset': {'version': '2.0', 'generator': 'CANVIO P85 runtime smoke'},
        'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}],
        'meshes': [{'primitives': [{'attributes': {'POSITION': 0}, 'indices': 1,
                                    'material': 0}]}],
        'materials': [{'pbrMetallicRoughness': {'baseColorFactor': [0.15, 0.75, 0.42, 1.0],
                                                  'metallicFactor': 0.05, 'roughnessFactor': 0.5}}],
        'buffers': [{'byteLength': len(binary)}],
        'bufferViews': [
            {'buffer': 0, 'byteOffset': 0, 'byteLength': len(positions), 'target': 34962},
            {'buffer': 0, 'byteOffset': len(positions), 'byteLength': 6, 'target': 34963},
        ],
        'accessors': [
            {'bufferView': 0, 'componentType': 5126, 'count': 3, 'type': 'VEC3',
             'min': [-0.72, -0.48, 0], 'max': [0.72, 0.72, 0]},
            {'bufferView': 1, 'componentType': 5123, 'count': 3, 'type': 'SCALAR'},
        ],
    }
    raw = json.dumps(doc, separators=(',', ':')).encode()
    raw += b' ' * ((4 - len(raw) % 4) % 4)
    binary += b'\x00' * ((4 - len(binary) % 4) % 4)
    total = 12 + 8 + len(raw) + 8 + len(binary)
    return (struct.pack('<III', 0x46546C67, 2, total)
            + struct.pack('<II', len(raw), 0x4E4F534A) + raw
            + struct.pack('<II', len(binary), 0x004E4942) + binary)


def main() -> None:
    manifest_file = ASSETS / 'P85-VENDOR-MANIFEST.json'
    if not manifest_file.is_file():
        raise SystemExit('P85 local vendor manifest missing. Run scripts/vendor-p85-runtimes.sh first.')
    manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
    required = [
        'p85-renderers.js', 'opencv/opencv.js', 'dotlottie/index.js',
        'dotlottie/dotlottie-player.wasm', 'rive/rive.js', 'rive/rive.wasm',
        'transformers/transformers.min.js',
    ]
    for rel in required:
        if not (ASSETS / rel).is_file():
            raise SystemExit('Missing P85 runtime asset: ' + rel)
        if rel not in {entry.get('path') for entry in manifest.get('files', [])}:
            raise SystemExit('P85 runtime asset is not SHA-pinned: ' + rel)
    for rel in required:
        entry = next(x for x in manifest['files'] if x['path'] == rel)
        file = ASSETS / rel
        if file.stat().st_size != entry['bytes']:
            raise SystemExit('P85 vendor size mismatch: ' + rel)

    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    server = socketserver.ThreadingTCPServer(('127.0.0.1', 0), handler)
    server.daemon_threads = True
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f'http://127.0.0.1:{server.server_address[1]}'
    checks: dict[str, bool] = {}
    details: dict[str, object] = {}
    requests: list[str] = []
    page_errors: list[str] = []
    console_errors: list[str] = []

    def record(name: str, value: bool, detail: object = None) -> None:
        checks[name] = bool(value)
        if detail is not None:
            details[name] = detail
        print(('PASS' if value else 'FAIL'), name, detail if detail is not None else '')
        if not value:
            raise AssertionError(name + (': ' + str(detail) if detail is not None else ''))

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=[
                '--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle',
                '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist',
                '--enable-unsafe-swiftshader', '--enable-unsafe-webgpu',
            ])
            page = browser.new_page(viewport={'width': 1440, 'height': 1050})
            page.on('request', lambda req: requests.append(req.url))
            page.on('pageerror', lambda error: page_errors.append(str(error)))
            page.on('console', lambda msg: console_errors.append(msg.text[:600]) if msg.type == 'error' else None)
            page.goto(origin + '/index.html', wait_until='load', timeout=120000)
            page.wait_for_function('!!window.CANVIOP85Suite && !!document.querySelector("#canvio-p85-studio")', timeout=30000)
            record('P85 panel and owner mount', True)
            record('P85 runtimes stay unloaded at boot', not any('/assets/p85/' in u for u in requests))

            runtime = page.evaluate('''async (glbB64) => {
              const out = { versions: {}, errors: [], checks: {}, webgpu: !!navigator.gpu };
              const suite = window.CANVIOP85Suite;
              const digestAssets = await suite.verifyFiles(['p85-renderers.js','opencv/opencv.js','dotlottie/index.js','dotlottie/dotlottie-player.wasm','rive/rive.js','rive/rive.wasm']);
              out.checks.allRequiredRuntimeHashesVerified = digestAssets === true;

              // Import both renderer packages and instantiate the actual postprocessing pipeline.
              const renderer = await suite.ensureRendererBundle();
              out.versions.renderer = renderer.P85_RENDERER_VERSION;
              out.checks.rendererBundleImported = !!renderer.createPostProcessingPreview && !!renderer.createWebGPUPathTracingPreview;
              const binary = Uint8Array.from(atob(glbB64), c => c.charCodeAt(0));
              const file = new File([binary], 'canvio-p85-runtime-smoke.glb', { type: 'model/gltf-binary' });
              const canvas = document.createElement('canvas'); canvas.width=512; canvas.height=320;
              canvas.style.cssText='width:512px;height:320px;position:fixed;left:-2000px;top:0'; document.body.appendChild(canvas);
              const post = await renderer.createPostProcessingPreview(canvas, file, { bloom: 0.45 });
              await new Promise(resolve => setTimeout(resolve, 1400));
              const gl = canvas.getContext('webgl2');
              let pixelDiversity = 0;
              if (gl) {
                const bytes = new Uint8Array(128*80*4);
                gl.readPixels(0,0,128,80,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
                const bins = new Set(); for(let i=0;i<bytes.length;i+=4) bins.add(bytes[i]+','+bytes[i+1]+','+bytes[i+2]);
                pixelDiversity = bins.size;
              }
              out.checks.postFxWebGL2RendererReady = !!gl;
              out.checks.postFxProducedRenderedPixels = pixelDiversity > 4;
              out.pixelDiversity = pixelDiversity;
              post.dispose(); canvas.remove();

              // OpenCV WASM runtime and real Lucas-Kanade calculation with two shifted test frames.
              const cv = await suite.ensureOpenCV();
              out.checks.openCvMatApiReady = !!(cv && cv.Mat && cv.calcOpticalFlowPyrLK && cv.goodFeaturesToTrack);
              const c = document.createElement('canvas'); c.width=160; c.height=128;
              const ctx=c.getContext('2d');
              const draw=(shift)=>{ctx.fillStyle='#000';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#fff';for(let y=10;y<112;y+=18)for(let x=10;x<145;x+=18)ctx.fillRect(x+shift,y+Math.floor(shift/2),8,8);};
              draw(0); const a=cv.imread(c), ga=new cv.Mat();cv.cvtColor(a,ga,cv.COLOR_RGBA2GRAY);
              const points=new cv.Mat();cv.goodFeaturesToTrack(ga,points,80,0.01,5);
              draw(4); const b=cv.imread(c),gb=new cv.Mat();cv.cvtColor(b,gb,cv.COLOR_RGBA2GRAY);
              const next=new cv.Mat(),status=new cv.Mat(),err=new cv.Mat();
              cv.calcOpticalFlowPyrLK(ga,gb,points,next,status,err,new cv.Size(21,21),3,new cv.TermCriteria(cv.TERM_CRITERIA_EPS|cv.TERM_CRITERIA_COUNT,30,0.01),0,0.001);
              let valid=0,dx=0;for(let i=0;i<status.rows;i++)if(status.data[i]){valid++;dx+=next.data32F[i*2]-points.data32F[i*2];}
              const avg=valid?dx/valid:0;
              out.checks.openCvLucasKanadeRealCalculation = points.rows>0 && valid>0 && avg>0.5 && avg<8;
              out.opticalFlow = { detectedFeatures:points.rows, validTracks:valid, averageDeltaX:avg };
              [a,ga,points,b,gb,next,status,err].forEach(x=>x.delete());

              // dotLottie: configure a same-origin WASM file, initialize it, and load a minimal JSON animation.
              const DotLottie=await suite.ensureDotLottie();
              out.checks.dotLottieWasmPreloaded = suite.inspect().dotLottieWasmReady===true;
              const lcanvas=document.createElement('canvas');lcanvas.width=128;lcanvas.height=128;lcanvas.style.cssText='position:fixed;left:-2000px';document.body.appendChild(lcanvas);
              const player=new DotLottie({canvas:lcanvas,autoplay:false,loop:false});
              const loaded=await new Promise((resolve,reject)=>{
                const timer=setTimeout(()=>reject(new Error('dotLottie ready timeout')),30000);
                player.addEventListener('ready',()=>{
                  player.load({data:{v:'5.7.4',fr:60,ip:0,op:60,w:128,h:128,nm:'CANVIO P85 runtime fixture',ddd:0,assets:[],layers:[{ddd:0,ind:1,ty:1,nm:'Solid',sr:1,ks:{o:{a:0,k:100},r:{a:0,k:0},p:{a:0,k:[64,64,0]},a:{a:0,k:[0,0,0]},s:{a:0,k:[100,100,100]}},ao:0,sw:128,sh:128,sc:'#f25f5c',ip:0,op:60,st:0,bm:0}]},autoplay:false});
                });
                player.addEventListener('load',()=>{clearTimeout(timer);resolve(true)});
                player.addEventListener('loadError',e=>{clearTimeout(timer);reject(e.error||new Error('dotLottie loadError'))});
              });
              out.checks.dotLottieJsonAnimationLoaded = loaded===true;
              player.destroy();lcanvas.remove();

              // Rive: wait for the pinned same-origin WASM runtime, not just the JS wrapper.
              const rive=await suite.ensureRive();
              out.checks.riveWasmRuntimeLoaded = !!(rive && rive.RuntimeLoader && rive.RuntimeLoader.getWasmUrl().startsWith(location.origin+'/assets/p85/rive/') && rive.RuntimeLoader.getWasmFallbackUrl?.()===null);
              out.riveVersion = rive.Rive ? 'Rive API available' : 'Rive API missing';

              // WebGPU path tracing is only tested when the browser genuinely exposes an adapter.
              if (navigator.gpu) {
                const adapter=await navigator.gpu.requestAdapter();
                out.webgpuAdapter=!!adapter;
                if(adapter){
                  const pc=document.createElement('canvas');pc.width=256;pc.height=160;pc.style.cssText='position:fixed;left:-2000px';document.body.appendChild(pc);
                  const path=await renderer.createWebGPUPathTracingPreview(pc,file,{maxSamples:8,renderScale:0.25});
                  await new Promise(resolve=>setTimeout(resolve,1200));
                  out.checks.webGpuPathTracerProducedSamples=path.frames>0;
                  out.pathTracerFrames=path.frames;path.dispose();pc.remove();
                } else out.checks.webGpuPathTracerProducedSamples=null;
              } else { out.webgpuAdapter=false; out.checks.webGpuPathTracerProducedSamples=null; }
              return out;
            }''', __import__('base64').b64encode(make_glb()).decode())
            for name, value in runtime['checks'].items():
                if value is None:
                    print('SKIP', name, '(no WebGPU adapter in this CI browser)')
                else:
                    record(name, bool(value), runtime.get('opticalFlow') if name.startswith('openCv') else None)
            record('runtime bundles stayed same-origin', all(u.startswith(origin + '/') for u in requests), requests)
            record('no page errors after real runtime loading', not page_errors, page_errors)
            record('no console errors after real runtime loading', not console_errors, console_errors)
            report = {
                'suite': 'CANVIO_P85_VENDOR_RUNTIME_BROWSER_SMOKE',
                'candidate': '23.3.108-p85-studio-r2',
                'checks': checks,
                'passed': sum(checks.values()), 'total': len(checks),
                'runtime': runtime, 'browser': browser.version, 'origin': origin,
                'runtimeFiles': len(manifest.get('files', [])),
                'remoteRequests': [u for u in requests if not u.startswith(origin + '/')],
                'pageErrors': page_errors, 'consoleErrors': console_errors,
                'physicalGpu': False,
                'limitations': [
                    'Software WebGL/SwiftShader only in hosted browser smoke.',
                    'WebGPU path tracing is skipped when Chromium exposes no WebGPU adapter; physical GPU certification remains separate.',
                    'Rive WASM runtime is initialized; the app-specific .riv file acceptance remains dependent on supplied user animation assets.',
                    'No model weights are downloaded or real P102/P105 inference executed by this P85 runtime suite.'
                ]
            }
            REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            browser.close()
    finally:
        server.shutdown(); server.server_close()
    print('P85 vendor runtime browser smoke PASS')


if __name__ == '__main__':
    main()
