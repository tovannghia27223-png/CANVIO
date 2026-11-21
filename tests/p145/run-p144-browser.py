#!/usr/bin/env python3
"""P144 real-Chrome test: palette lists new commands, Enter navigates+focuses the tool card, read-only commands auto-run, recents float to top, Alt+Shift+V navigation, F1 contextual help (focus trap, Escape), shortcuts ignored while typing."""
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
    page.wait_for_function('!!(window.CV && CV.go && CV.palette && CV.palette.__p144)', timeout=90000, polling=500)
    c['wrapped'] = True
    page.keyboard.press('Control+k'); page.wait_for_selector('#palette.open', timeout=5000)
    page.fill('#paletteInput', 'gif'); page.wait_for_timeout(200)
    c['gifCommandListed'] = page.evaluate("[...document.querySelectorAll('#paletteList .palItem')].some(e=>/Xuất GIF/.test(e.textContent))")
    page.keyboard.press('Enter'); page.wait_for_timeout(1800)
    c['navigatedToVideo'] = page.evaluate("!!document.querySelector('#page-videoEngine.active')")
    c['focusedTool'] = page.evaluate("document.activeElement && document.activeElement.id==='cv132-gif'")
    c['paletteClosed'] = page.evaluate("!document.querySelector('#palette.open')")
    page.keyboard.press('Control+k'); page.wait_for_selector('#palette.open'); page.fill('#paletteInput', 'đo màu'); page.wait_for_timeout(200); page.keyboard.press('Enter'); page.wait_for_timeout(1500)
    c['readOnlyAutoRuns'] = page.evaluate("document.getElementById('cv134-out') && !/Histogram, waveform và vectorscope của khung hiện tại\\./.test(document.getElementById('cv134-out').textContent)")
    page.keyboard.press('Control+k'); page.wait_for_selector('#palette.open'); page.fill('#paletteInput', ''); page.wait_for_timeout(200)
    first = page.evaluate("[...document.querySelectorAll('#paletteList .palItem')].slice(0,2).map(e=>e.textContent)")
    c['recentsFloat'] = any('đo màu' in t.lower() or 'Đo màu' in t for t in first) and any('GIF' in t for t in first)
    page.keyboard.press('Escape'); page.wait_for_timeout(200)
    page.keyboard.press('Alt+Shift+W'); page.wait_for_timeout(1200)
    c['altShiftNav'] = page.evaluate("!!document.querySelector('#page-webEngine.active')")
    page.keyboard.press('F1'); page.wait_for_selector('#cv144-help', timeout=3000)
    c['helpOpens'] = page.evaluate("/Website|Kéo thả block/.test(document.getElementById('cv144-help').textContent)")
    c['helpFocused'] = page.evaluate("document.activeElement.id==='cv144-x'")
    page.keyboard.press('Tab'); c['focusTrap'] = page.evaluate("document.activeElement.id==='cv144-x'")
    page.keyboard.press('Escape'); page.wait_for_timeout(150); c['escapeCloses'] = page.evaluate("!document.getElementById('cv144-help')")
    page.evaluate("CV.go('assets')"); page.wait_for_timeout(1000)
    page.focus('#cv145-src'); page.keyboard.press('Alt+Shift+V'); page.wait_for_timeout(500)
    c['altShiftStillWorksFromInput'] = page.evaluate("!!document.querySelector('#page-videoEngine.active')")
    page.evaluate("CV.go('assets')"); page.wait_for_timeout(800); page.focus('#cv145-src'); page.keyboard.type('f1?'); 
    c['typingNotHijacked'] = page.evaluate("document.getElementById('cv145-src').value==='f1?'") and page.evaluate("!document.getElementById('cv144-help')")
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
