#!/usr/bin/env python3
"""P119: Lottie xuất từ CANVIO phải chạy được bằng lottie-web thật (renderer svg). Cần: npm i lottie-web (node_modules/lottie-web)."""
import json, os, sys, threading, http.server, socketserver, functools, shutil
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LW = os.path.join(ROOT, 'node_modules', 'lottie-web', 'build', 'player', 'lottie.min.js')
if not os.path.exists(LW): print('SKIP: thiếu node_modules/lottie-web'); sys.exit(0 if os.environ.get('CANVIO_LOTTIE_OPTIONAL') else 2)
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
base = 'http://127.0.0.1:%d' % httpd.server_address[1]
c = {}; errs = []
with sync_playwright() as p:
    kw = {'headless': True, 'args': ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']}
    if CHROME: kw['executable_path'] = CHROME
    b = p.chromium.launch(**kw); page = b.new_context(viewport={'width': 900, 'height': 700}).new_page()
    page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(base + '/index.html', wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVEasingP119)', timeout=90000, polling=500)
    data = page.evaluate("JSON.stringify(CVEasingP119.lottie({curve:[.2,.8,.3,1],durationMs:700,mode:'slide'}))")
    page.goto(base + '/node_modules/lottie-web/README.md', wait_until='commit')
    page.set_content('<div id="box" style="width:300px;height:300px"></div>')
    page.add_script_tag(path=LW)
    r = page.evaluate("""(j)=>new Promise(res=>{const d=JSON.parse(j),out={};
      try{const a=lottie.loadAnimation({container:document.getElementById('box'),renderer:'svg',loop:false,autoplay:false,animationData:d});
      a.addEventListener('DOMLoaded',()=>{out.loaded=true;out.frames=a.totalFrames;out.hasSvg=!!document.querySelector('#box svg');
        const g=()=>[...document.querySelectorAll('#box svg g')].map(x=>x.getAttribute('transform')||'').join('|')+[...document.querySelectorAll('#box svg g')].map(x=>x.style.opacity||'').join('|');
        a.goToAndStop(0,true);out.s0=g();a.goToAndStop(Math.floor(a.totalFrames/2),true);out.s1=g();a.goToAndStop(a.totalFrames-1,true);out.s2=g();res(out)});
      a.addEventListener('data_failed',()=>{out.failed=true;res(out)});
      }catch(e){out.err=String(e);res(out)};setTimeout(()=>res(Object.assign(out,{timeout:true})),8000)})""", data)
    c['lottieWebLoadsExport'] = bool(r.get('loaded')) and not r.get('failed') and not r.get('err')
    c['totalFramesMatchesDuration'] = abs((r.get('frames') or 0) - (json.loads(data)['op'] - json.loads(data)['ip'])) <= 1
    c['rendersSvg'] = bool(r.get('hasSvg'))
    c['animationChangesOverTime'] = bool(r.get('s0')) and r.get('s0') != r.get('s1') and r.get('s1') != r.get('s2')
    b.close()
res = {'checks': c, 'detail': {k: r.get(k) for k in ('frames',)}, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
