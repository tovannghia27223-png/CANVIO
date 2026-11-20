#!/usr/bin/env python3
"""P145 core real-Chrome test: card mounts on the Assets page, music link -> cue sheet download, font Vietnamese check, CSV merge download."""
import json, os, sys, threading, http.server, socketserver, functools, shutil, tempfile
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
c = {}; errs = []; tmp = tempfile.mkdtemp()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    ctx = b.new_context(viewport={'width': 1200, 'height': 800}, reduced_motion='reduce', accept_downloads=True)
    page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVContentCoreP145)', timeout=90000, polling=500)
    page.evaluate("CV.go('assets')"); page.wait_for_timeout(1200)
    c['cardMounted'] = page.evaluate("!!document.getElementById('cv145-card')")
    page.fill('#cv145-mu-url', 'javascript:alert(1)'); page.click('#cv145-mu-add')
    c['badLinkRejected'] = page.evaluate("/không hợp lệ/.test(document.getElementById('cv145-out').textContent)")
    page.fill('#cv145-mu-url', 'https://soundcloud.com/a/b'); page.fill('#cv145-mu-title', 'Bài thử'); page.fill('#cv145-mu-at', '3'); page.click('#cv145-mu-add')
    c['goodLinkAdded'] = page.evaluate("/soundcloud/.test(document.getElementById('cv145-out').textContent)")
    with page.expect_download(timeout=15000) as d: page.click('#cv145-mu-cue')
    pth = os.path.join(tmp, 'cue.txt'); d.value.save_as(pth); t = open(pth, encoding='utf-8').read()
    c['cueSheetContent'] = 'Bài thử' in t and 'soundcloud.com' in t and 'không chứa' in t
    page.fill('#cv145-font', 'NoSuchFontXyz123'); page.click('#cv145-font-run')
    c['missingFontReported'] = page.evaluate("/thiếu/.test(document.getElementById('cv145-out').textContent)")
    page.fill('#cv145-font', 'DejaVu Sans'); page.click('#cv145-font-run')
    c['fontCheckRuns'] = page.evaluate("/(hiện đủ|thiếu)/.test(document.getElementById('cv145-out').textContent)")
    page.fill('#cv145-csv', 'ten,vi_tri\nAn,<b>Dev</b>\nBình,Designer'); page.fill('#cv145-tpl', '<h2>{{ten}}</h2><p>{{vi_tri}}</p>')
    with page.expect_download(timeout=15000) as d2: page.click('#cv145-merge')
    pth2 = os.path.join(tmp, 'm.html'); d2.value.save_as(pth2); m = open(pth2, encoding='utf-8').read()
    c['mergeOutput'] = m.count('<section') == 2 and '&lt;b&gt;Dev' in m and '<b>Dev' not in m and 'Bình' in m
    page.click('#cv145-report')
    c['reportNoAssets'] = page.evaluate("/OK 0/.test(document.getElementById('cv145-out').textContent)")
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
