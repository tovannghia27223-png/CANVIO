#!/usr/bin/env python3
"""P133 Worker slice: denoise runs in a Web Worker, matches the main-thread result, and keeps the page responsive (event-loop ticks) while processing 30 s of audio."""
import json, os, sys, threading, http.server, socketserver, functools, shutil
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
c = {}; errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page = b.new_context(viewport={'width': 1200, 'height': 800}, reduced_motion='reduce').new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVDenoiseP138 && CVDenoiseP138.denoiseAsync)', timeout=90000, polling=500)
    r = page.evaluate("""async()=>{var sr=16000,n=sr*30,x=new Float32Array(n),s=5;for(var i=0;i<n;i++){s=(s*1664525+1013904223)>>>0;x[i]=(Math.floor(i/(sr/2))%2===0?0.4*Math.sin(2*Math.PI*440*i/sr):0)+0.05*(s/4294967296*2-1)}
      var ticks=0,t0=performance.now(),iv=setInterval(()=>ticks++,10);
      var a=await CVDenoiseP138.denoiseAsync(x,{strength:0.6});var dt=performance.now()-t0;clearInterval(iv);
      var m=CVDenoiseP138.denoise(x,{strength:0.6}),maxd=0;for(var i=0;i<m.length;i++){var d=Math.abs(m[i]-a.samples[i]);if(d>maxd)maxd=d}
      return {worker:a.worker,len:a.samples.length===n,maxDiff:maxd,ms:dt,ticks:ticks,expectedTicks:dt/10,inputUntouched:x[1000]===x[1000]}}""")
    c['usedWorker'] = r['worker'] is True
    c['sameLength'] = r['len']
    c['matchesMainThread'] = r['maxDiff'] < 1e-6
    c['pageStayedResponsive'] = r['ticks'] >= max(5, 0.25 * r['expectedTicks'])
    b.close()
res = {'checks': c, 'measure': r, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
