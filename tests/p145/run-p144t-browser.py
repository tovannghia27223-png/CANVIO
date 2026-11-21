#!/usr/bin/env python3
"""P144 first-run tour in real Chrome (navigator.webdriver hidden so the auto-start path runs): auto appears on home after the delay, walks 4 steps, highlights targets, Escape/skip persists, not shown again after reload, palette command restarts it."""
import json, os, sys, threading, http.server, socketserver, functools, shutil, tempfile
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
c = {}; errs = []; udir = tempfile.mkdtemp()
INIT = "Object.defineProperty(navigator,'webdriver',{get:()=>false})"
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(udir, executable_path=CHROME, headless=True, viewport={'width': 1200, 'height': 800}, reduced_motion='reduce', args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    ctx.add_init_script(INIT)
    page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVUxP144)', timeout=90000, polling=500)
    page.wait_for_selector('#cv144-tour', timeout=15000); c['autoStarts'] = True
    c['step1'] = page.evaluate("/Chào mừng/.test(document.getElementById('cv144-tour').textContent)")
    c['focusOnNext'] = page.evaluate("document.activeElement.dataset.a==='next'")
    page.keyboard.press('Enter'); page.wait_for_timeout(300)
    c['step2HighlightsSearch'] = page.evaluate("/Ctrl\\+K/.test(document.getElementById('cv144-tour').textContent) && getComputedStyle(document.querySelector('.qbar')).outlineStyle==='solid'")
    page.click('#cv144-tour [data-a=next]'); page.wait_for_timeout(300)
    c['step3'] = page.evaluate("/Bắt đầu từ đây/.test(document.getElementById('cv144-tour').textContent)")
    c['prevHighlightRemoved'] = page.evaluate("getComputedStyle(document.querySelector('.qbar')).outlineStyle!=='solid'")
    page.click('#cv144-tour [data-a=next]'); page.wait_for_timeout(300)
    c['lastStepSaysDone'] = page.evaluate("document.querySelector('#cv144-tour [data-a=next]').textContent==='Xong'")
    page.click('#cv144-tour [data-a=next]'); page.wait_for_timeout(300)
    c['closedAndPersisted'] = page.evaluate("!document.getElementById('cv144-tour') && CVUxP144.tourDone()")
    page.reload(wait_until='commit'); page.wait_for_function('!!(window.CV && CV.go && window.CVUxP144)', timeout=90000, polling=500); page.wait_for_timeout(5000)
    c['notShownAgain'] = page.evaluate("!document.getElementById('cv144-tour')")
    page.keyboard.press('Control+k'); page.wait_for_selector('#palette.open'); page.fill('#paletteInput', 'xem lại hướng dẫn nhanh'); page.wait_for_timeout(200); page.keyboard.press('Enter'); page.wait_for_selector('#cv144-tour', timeout=5000)
    c['restartFromPalette'] = True
    page.keyboard.press('Escape'); page.wait_for_timeout(200)
    c['escapeSkips'] = page.evaluate("!document.getElementById('cv144-tour')")
    ctx.close()
    # automation (webdriver=true) must NOT auto-start the tour
    ctx2 = p.chromium.launch_persistent_context(tempfile.mkdtemp(), executable_path=CHROME, headless=True, viewport={'width': 1200, 'height': 800}, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    pg = ctx2.new_page(); pg.goto(url, wait_until='commit', timeout=60000); pg.wait_for_function('!!(window.CV && CV.go && window.CVUxP144)', timeout=90000, polling=500); pg.wait_for_timeout(5500)
    c['automationSkipsTour'] = pg.evaluate("!document.getElementById('cv144-tour')")
    ctx2.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
