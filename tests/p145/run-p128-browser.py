#!/usr/bin/env python3
"""P128 real-Chrome test: orchestrator card runs a task through the existing CVAIProviderAdapter against a local mock OpenAI-compatible server; cache hit; failure falls through and is reported; image kind reports 'unconfigured'."""
import json, os, sys, threading, http.server, socketserver, functools, shutil
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
hits = {'n': 0, 'fail': False}
class M(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', '*'); self.send_header('Access-Control-Allow-Methods', 'POST,OPTIONS')
    def do_OPTIONS(self): self.send_response(204); self._cors(); self.end_headers()
    def do_POST(self):
        hits['n'] += 1; n = int(self.headers.get('Content-Length') or 0); body = json.loads(self.rfile.read(n) or b'{}')
        if hits['fail']:
            self.send_response(503); self._cors(); self.end_headers(); self.wfile.write(b'{"error":{"message":"down"}}'); return
        out = json.dumps({'choices': [{'message': {'content': 'Xin chào từ model cục bộ: ' + body['messages'][0]['content'][:30]}}]}).encode()
        self.send_response(200); self._cors(); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(out)
mock = socketserver.ThreadingTCPServer(('127.0.0.1', 0), M); mock.daemon_threads = True; threading.Thread(target=mock.serve_forever, daemon=True).start()
mport = mock.server_address[1]
c = {}; errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page = b.new_context(viewport={'width': 1200, 'height': 900}, reduced_motion='reduce').new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVOrchestratorP128 && window.CVAIProviderAdapter)', timeout=90000, polling=500)
    page.evaluate("(port)=>localStorage.setItem('canvio11:platform',JSON.stringify({providers:[{provider:'local',endpoint:'http://127.0.0.1:'+port+'/v1',model:'test-model'}]}))", mport)
    page.evaluate("CV.go('platform')"); page.wait_for_timeout(800); page.click('button[data-tab=\"api\"]'); page.wait_for_timeout(400)
    c['mounted'] = page.evaluate("!!document.getElementById('cv128-run')")
    page.fill('#cv128-prompt', 'Viết một dòng giới thiệu quán cà phê'); page.click('#cv128-run'); page.wait_for_timeout(1500)
    t = page.inner_text('#cv128-res')
    c['localAnswered'] = t.startswith('[local') and 'Xin chào từ model cục bộ' in t and hits['n'] == 1
    c['statsShown'] = 'local: 1/1 OK' in page.inner_text('#cv128-stats')
    page.click('#cv128-run'); page.wait_for_timeout(500)
    c['cacheNoSecondCall'] = 'bộ nhớ đệm' in page.inner_text('#cv128-res') and hits['n'] == 1
    hits['fail'] = True; page.fill('#cv128-prompt', 'Một tác vụ khác'); page.click('#cv128-run'); page.wait_for_timeout(1500)
    t = page.inner_text('#cv128-res')
    c['failureReported'] = 'Mọi tầng đều lỗi' in t and 'local' in t and 'gemini' in t and hits['n'] == 2
    page.select_option('#cv128-kind', 'image'); page.click('#cv128-run'); page.wait_for_timeout(300)
    c['imageUnconfigured'] = 'Chưa cấu hình' in page.inner_text('#cv128-res') and hits['n'] == 2
    page.select_option('#cv128-order', 'gemini-only'); page.reload(wait_until='commit'); page.wait_for_function('!!window.CVOrchestratorP128', timeout=90000, polling=500)
    c['orderPersists'] = page.evaluate("CVOrchestratorP128.order()") == 'gemini-only'
    c['noKeyInStorage'] = not page.evaluate("Object.keys(localStorage).some(k=>/key/i.test(k)&&/128/.test(k))")
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
