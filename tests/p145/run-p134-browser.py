#!/usr/bin/env python3
"""P134 real-Chrome test: scopes panel mounts, updates on the preview canvas, flags a blown-out frame, and paints non-empty scope canvases."""
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
    page.wait_for_function('!!(window.CV && CV.go && window.CVScopesP134)', timeout=90000, polling=500)
    page.evaluate("CV.go('videoEngine')"); page.wait_for_timeout(1500)
    c['mounted'] = page.evaluate("!!document.getElementById('cv134-row')")
    page.click('#cv134-run'); page.wait_for_timeout(300)
    c['dark default frame reported'] = page.evaluate("/tối|cân bằng|đen kịt/.test(document.getElementById('cv134-out').textContent)")
    page.evaluate("var cv=document.getElementById('vtCanvas'),x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#e63946';x.fillRect(0,0,cv.width/4,cv.height)")
    page.click('#cv134-run'); page.wait_for_timeout(300)
    c['flagsBlownWhites'] = page.evaluate("/cháy/.test(document.getElementById('cv134-out').textContent)")
    lit = lambda id: page.evaluate("(id)=>{var c=document.getElementById(id),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(var i=0;i<d.length;i+=4)if(d[i+1]>120)return true;return false}", id)
    c['histogramPainted'] = lit('cv134-h') or page.evaluate("(()=>{var c=document.getElementById('cv134-h'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;var s=0;for(var i=0;i<d.length;i+=4)s+=d[i]+d[i+1]+d[i+2];return s>0})()")
    c['waveformPainted'] = lit('cv134-w'); c['vectorscopePainted'] = lit('cv134-v')
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
