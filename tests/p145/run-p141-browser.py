#!/usr/bin/env python3
"""P141 real-Chrome test: choose two local TTFs, Vietnamese coverage rows render (complete vs partial), preview uses loaded font, JSON report downloads."""
import json, os, sys, threading, http.server, socketserver, functools, shutil
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
FULL = os.environ.get('CANVIO_TEST_TTF') or '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
PART = os.environ.get('CANVIO_TEST_TTF_PARTIAL') or '/usr/share/fonts/truetype/crosextra/Caladea-Bold.ttf'
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
c = {}; errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    ctx = b.new_context(viewport={'width': 1200, 'height': 900}, reduced_motion='reduce', accept_downloads=True); page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVFontsP141 && window.CVWordmarkP118)', timeout=90000, polling=500)
    page.evaluate("CV.go('brand')"); page.wait_for_timeout(1000)
    c['mounted'] = page.evaluate("!!document.getElementById('cv141-files')")
    page.set_input_files('#cv141-files', [FULL, PART]); page.wait_for_timeout(1200)
    txt = page.inner_text('#cv141-list')
    c['twoRows'] = page.evaluate("document.querySelectorAll('#cv141-list > div').length") == 2
    c['completeAndPartialShown'] = 'Đủ dấu' in txt and 'Thiếu' in txt
    c['summaryCounts'] = '2 font · 1 đủ dấu' in page.inner_text('#cv141-out')
    c['previewFontApplied'] = page.evaluate("document.fonts.check('20px cv141f0')")
    with page.expect_download() as dl: page.click('#cv141-json')
    rep = json.load(open(dl.value.path()))
    c['reportJson'] = rep['vnCharset'] == 146 and rep['completeFonts'] == 1 and len(rep['fonts']) == 2 and 'cssFamily' not in rep['fonts'][0]
    page.set_input_files('#cv141-files', {'name': 'x.ttf', 'mimeType': 'font/ttf', 'buffer': b'garbage-garbage-garbage'}); page.wait_for_timeout(500)
    c['badFileSkipped'] = 'bỏ qua' in page.inner_text('#cv141-out')
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
