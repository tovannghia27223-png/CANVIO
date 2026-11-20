#!/usr/bin/env python3
"""P145.2 Chromium smoke: verifies UI mount, shader/fallback renderer, transition endpoints and PNG export."""
import json, os, sys, threading, http.server, socketserver, functools, shutil
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
checks = {}; errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page = browser.new_context(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce', accept_downloads=True).new_page()
    page.on('pageerror', lambda e: errors.append(str(e)[:240]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && window.CVShaderP145)', timeout=90000, polling=500)
    page.evaluate("CV.go('videoEngine')"); page.wait_for_timeout(1200)
    checks['panel mounted'] = page.evaluate("!!document.getElementById('cv1452-card')")
    result = page.evaluate("""()=>{
      const api=CVShaderP145, from=document.createElement('canvas'), to=document.createElement('canvas'), out=document.createElement('canvas');
      from.width=to.width=64;from.height=to.height=64;
      let a=from.getContext('2d'),b=to.getContext('2d');a.fillStyle='#ff0000';a.fillRect(0,0,64,64);b.fillStyle='#0000ff';b.fillRect(0,0,64,64);
      const renderer=api.createRenderer(out);
      function pixel(p,transition){renderer.render(from,to,p,{transition,effect:'none',quality:'low'});const c=document.createElement('canvas');c.width=c.height=1;const x=c.getContext('2d');x.drawImage(out,0,0,1,1);return Array.from(x.getImageData(0,0,1,1).data)}
      const cases={};
      Object.keys(api.transitions).forEach(k=>{const s=pixel(0,k),e=pixel(1,k);cases[k]=s[0]>s[2]+80&&e[2]>e[0]+80;});
      const mid=pixel(.5,'fade');renderer.dispose();
      return {backend:renderer.backend,endpoints:cases,allEndpoints:Object.values(cases).every(Boolean),midpoint:mid[0]>40&&mid[2]>40&&Math.abs(mid[0]-mid[2])<40,apiTests:Object.values(api.tests()).every(Boolean),status:api.webCodecsStatus()};
    }""")
    checks['all transition endpoints show correct source/target'] = result['allEndpoints']
    checks['crossfade midpoint mixes both frames'] = result['midpoint']
    checks['module self-tests'] = result['apiTests']
    checks['WebCodecs P79 capability reported without exception'] = result['status']['owner']=='CANVIOWebCodecsExport P79'
    with page.expect_download(timeout=20000) as download:
        page.click('#cv1452-png')
    path = os.path.join('/tmp', 'canvio-p1452-smoke.png')
    download.value.save_as(path)
    with open(path, 'rb') as f:
        checks['PNG export produces a valid file'] = f.read(8) == b'\x89PNG\r\n\x1a\n'
    checks['WebGL or fallback backend selected'] = result['backend'] in ('webgl', '2d-fallback')
    browser.close()
report={'suite':'CANVIO_P145_2_CHROMIUM_SHADER_SMOKE','checks':checks,'backend':result.get('backend'),'webCodecs':result.get('status'),'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] or errors else 0)
