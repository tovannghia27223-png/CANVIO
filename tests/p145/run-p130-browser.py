#!/usr/bin/env python3
"""P130 Chrome: giao diện đồng bộ Supabase trong "Dự án của tôi" + đồng bộ thật giữa 2 hồ sơ trình duyệt qua máy chủ giả."""
import json, os, sys, subprocess, threading, http.server, socketserver, functools, shutil, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
# máy chủ giả chạy bằng node, có CORS
srv = subprocess.Popen(['node', '-e', """
const m=require('%s/tests/p130/mock-supabase.cjs'),http=require('http');
m.start({}).then(S=>{const orig=S;console.log(JSON.stringify({url:S.url,anon:S.anon}));});
""" % ROOT.replace('\\', '/')], stdout=subprocess.PIPE, text=True)
info = json.loads(srv.stdout.readline())
# proxy CORS đơn giản: Chrome gọi 127.0.0.1 khác cổng -> cần CORS; bọc bằng máy chủ trung gian
import urllib.request
class P(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', '*'); self.send_header('Access-Control-Allow-Methods', '*')
    def do_OPTIONS(self): self.send_response(204); self._cors(); self.end_headers()
    def _go(self):
        n = int(self.headers.get('content-length') or 0); body = self.rfile.read(n) if n else None
        rq = urllib.request.Request(info['url'] + self.path, data=body, method=self.command, headers={k: v for k, v in self.headers.items() if k.lower() not in ('host', 'origin', 'content-length')})
        try: r = urllib.request.urlopen(rq); code = r.status; data = r.read()
        except urllib.error.HTTPError as e: code = e.code; data = e.read()
        self.send_response(code); self._cors(); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(data)
    do_GET = do_POST = do_PATCH = do_DELETE = _go
px = socketserver.ThreadingTCPServer(('127.0.0.1', 0), P); px.daemon_threads = True; threading.Thread(target=px.serve_forever, daemon=True).start()
SB = 'http://127.0.0.1:%d' % px.server_address[1]
c = {}; errs = []
def load(pg):
    pg.goto(url, wait_until='commit', timeout=60000)
    pg.wait_for_function("!!(window.CV&&window.CANVIOPersistentProjects&&window.CVCloudP130)", timeout=90000, polling=300)
    pg.evaluate("CV.go('projectVault')"); pg.wait_for_selector('#cv130-card', timeout=20000)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'])
    ctxA = b.new_context(viewport={'width': 1200, 'height': 900}); A = ctxA.new_page(); A.on('pageerror', lambda e: errs.append(str(e)[:200]))
    load(A)
    c['cardVisible'] = A.is_visible('#cv130-card') and A.is_visible('#cv130-sync') and A.is_visible('#cv130-unlock')
    # cấu hình sai bị từ chối
    A.fill('#cv130-url', 'http://evil.com'); A.fill('#cv130-anon', info['anon']); A.fill('#cv130-email', 'a@x.vn'); A.fill('#cv130-pw', 'matkhau123'); A.click('#cv130-up')
    c['rejectsBadUrl'] = 'Supabase' in A.inner_text('#cv130-st')
    A.fill('#cv130-url', SB); A.click('#cv130-up'); A.wait_for_function("document.querySelector('#cv130-st').textContent.indexOf('Đã đăng nhập')>=0", timeout=15000)
    c['signedIn'] = 'a@x.vn' in A.inner_text('#cv130-st')
    A.fill('#cv130-pass', 'cum-mat-khau-dai'); A.click('#cv130-unlock'); A.wait_for_function("document.querySelector('#cv130-st').textContent.indexOf('khóa mã hóa mới')>=0||document.querySelector('#cv130-st').textContent.indexOf('mở khóa')>=0", timeout=30000)
    c['unlockedNewKey'] = 'khóa dự phòng' in A.inner_text('#cv130-st')
    # tạo một bản ghi Vault thật rồi đồng bộ
    A.evaluate("""()=>new Promise((ok,no)=>{const q=indexedDB.open('CANVIO_PROJECT_VAULT_18_7');q.onsuccess=()=>{const d=q.result;const tx=d.transaction('documents','readwrite');tx.objectStore('documents').put({key:'demo:poster',projectId:'demo',projectName:'Poster thử',editor:'poster',savedAt:new Date().toISOString(),state:{layers:['Bí mật Một']},versions:[]});tx.oncomplete=ok;tx.onerror=()=>no(tx.error)}})""")
    A.click('#cv130-sync'); A.wait_for_function("document.querySelector('#cv130-st').textContent.indexOf('Xong:')>=0", timeout=30000)
    c['pushedFromUi'] = 'gửi lên 1' in A.inner_text('#cv130-st') or 'gửi lên' in A.inner_text('#cv130-st')
    # trình duyệt thứ hai (hồ sơ riêng) kéo về
    ctxB = b.new_context(viewport={'width': 1200, 'height': 900}); B = ctxB.new_page(); B.on('pageerror', lambda e: errs.append(str(e)[:200]))
    load(B)
    B.fill('#cv130-url', SB); B.fill('#cv130-anon', info['anon']); B.fill('#cv130-email', 'a@x.vn'); B.fill('#cv130-pw', 'matkhau123'); B.click('#cv130-in')
    B.wait_for_function("document.querySelector('#cv130-st').textContent.indexOf('Đã đăng nhập')>=0", timeout=15000)
    B.fill('#cv130-pass', 'sai-cum-mat-khau'); B.click('#cv130-unlock'); B.wait_for_function("document.querySelector('#cv130-st').textContent.indexOf('Giải mã thất bại')>=0", timeout=30000)
    c['wrongPassphraseRejected'] = True
    B.fill('#cv130-pass', 'cum-mat-khau-dai'); B.click('#cv130-unlock'); B.wait_for_function("document.querySelector('#cv130-st').textContent.indexOf('đã mở khóa')>=0", timeout=30000)
    B.click('#cv130-sync'); B.wait_for_function("document.querySelector('#cv130-st').textContent.indexOf('Xong:')>=0", timeout=30000)
    got = B.evaluate("""()=>new Promise((ok,no)=>{const q=indexedDB.open('CANVIO_PROJECT_VAULT_18_7');q.onsuccess=()=>{const r=q.result.transaction('documents').objectStore('documents').get('demo:poster');r.onsuccess=()=>ok(r.result)}})""")
    c['deviceBReceived'] = bool(got) and got['state']['layers'][0] == 'Bí mật Một' and got['projectName'] == 'Poster thử'
    # token không nằm trong localStorage dưới dạng cụm mật khẩu / khóa
    ls = B.evaluate("JSON.stringify(Object.assign({},localStorage))")
    c['noPassphraseStored'] = 'cum-mat-khau-dai' not in ls and 'matkhau123' not in ls
    # tải khóa dự phòng
    with B.expect_download() as d: B.click('#cv130-key')
    kf = json.load(open(d.value.path()))
    c['keyBackupDownloaded'] = kf.get('format') == 'CANVIO_P130_KEY'
    B.click('#cv130-out'); B.wait_for_function("document.querySelector('#cv130-st').textContent.indexOf('Chưa đăng nhập')>=0", timeout=10000)
    c['signOutWorks'] = True
    b.close()
srv.terminate()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
