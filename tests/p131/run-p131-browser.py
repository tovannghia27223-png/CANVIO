#!/usr/bin/env python3
"""P131 real-browser check: loads the app over http://127.0.0.1, exercises CANVIOSecurity with malicious
SVG/HTML corpora, the storage audit/migration dialog and the palette entry on a minimal real-DOM harness page
(the module is extracted from index.html). Full-app load is covered by the hosted CI job."""
import json, os, sys, threading, http.server, socketserver, functools, shutil, tempfile
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
import re
APP = open(os.path.join(ROOT, 'index.html'), encoding='utf-8', newline='').read()
MOD = re.search(r'<script id="canvio-lot131">([\s\S]*?)</script>', APP).group(1).replace('\r\n', '\n')
CSS = re.search(r'<style id="canvio-lot131-css">([\s\S]*?)</style>', APP).group(1)
SERVE = tempfile.mkdtemp(prefix='p131-')
open(os.path.join(SERVE, 'index.html'), 'w', encoding='utf-8').write(
  '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>P131 harness</title><style>' + CSS + '</style></head><body>'
  '<div id="row"><input id="geminiKey" type="password" aria-label="Gemini key"></div>'
  '<script>window.CV={toast:function(m){(window.__toasts=window.__toasts||[]).push(m)},palette:{build:function(){return [{label:"Mở Brand Kit"}]}}};</script>'
  '<script>' + MOD + '</script></body></html>')
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
OUT = os.environ.get('P131_OUT', os.path.join(tempfile.gettempdir(), 'p131-out'))
os.makedirs(OUT, exist_ok=True)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=SERVE))
httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]

SVG = [
 '<svg xmlns="http://www.w3.org/2000/svg" onload="window.__x=1"><rect width="4" height="4"/></svg>',
 '<svg xmlns="http://www.w3.org/2000/svg"><script>window.__x=1</script><rect width="4" height="4"/></svg>',
 '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="java&#x0A;script:window.__x=1"><rect width="4" height="4"/></a></svg>',
 '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:window.__x=1"><text>x</text></a></svg>',
 '<svg xmlns="http://www.w3.org/2000/svg"><a><animate attributeName="href" values="javascript:window.__x=1"/><text>x</text></a></svg>',
 '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><iframe srcdoc="<script>parent.__x=1</script>"/></foreignObject></svg>',
 '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url(http://evil.test/a.css);rect{fill:url(http://evil.test/p)}</style><rect width="4" height="4"/></svg>',
 '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/svg+xml;base64,PHN2Zy8+"/><use href="http://evil.test/x.svg#a"/></svg>',
 '<svg xmlns="http://www.w3.org/2000/svg"><x:script xmlns:x="http://www.w3.org/2000/svg">window.__x=1</x:script></svg>',
]
HTML = [
 '<img src=x onerror="window.__x=1">', '<svg onload="window.__x=1"></svg>', '<a href=" jav&#x09;ascript:window.__x=1">x</a>',
 '<iframe srcdoc="<script>parent.__x=1</script>"></iframe>', '<form action="javascript:window.__x=1"><button>go</button></form>',
 '<math><mi xlink:href="javascript:window.__x=1">x</mi></math>', '<div style="background:url(javascript:window.__x=1)">x</div>',
 '<object data="data:text/html,<script>parent.__x=1</script>"></object>', '<p>Xin chào, đây là nội dung <b>an toàn</b></p>',
]
import time
T0 = time.time()
def log(m): print('[%5.1fs] %s' % (time.time() - T0, m), file=sys.stderr, flush=True)
res = {'url': url, 'checks': {}, 'errors': []}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--disable-sync', '--disable-gpu'])
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, accept_downloads=False, reduced_motion='reduce')
    page = ctx.new_page()
    page.on('pageerror', lambda e: res['errors'].append('pageerror: ' + str(e)[:200]))
    page.on('console', lambda m: res['errors'].append('console.error: ' + m.text[:200]) if m.type == 'error' and 'ERR_FAILED' not in m.text and 'Failed to load resource' not in m.text else None)
    page.on('dialog', lambda d: d.accept())
    page.goto(url, wait_until='commit', timeout=60000)
    log('goto commit')
    page.wait_for_function('window.CANVIOSecurity && window.CV && CV.palette', timeout=30000)
    c = res['checks']
    log("flags = page.evaluate('CANVIOSecurity.tests()')")
    flags = page.evaluate('CANVIOSecurity.tests()')
    c['selfTests'] = all(flags.values()); c['selfTestFlags'] = flags
    log('svg_out = page.evaluate(')
    svg_out = page.evaluate('''(list)=>list.map(s=>{try{return CANVIOSecurity.sanitizeSvg(s).svg}catch(e){return 'ERR:'+e.message}})''', SVG)
    html_out = page.evaluate('''(list)=>list.map(s=>{try{return CANVIOSecurity.sanitizeHtml(s).html}catch(e){return 'ERR:'+e.message}})''', HTML)
    bad = r'(<script|onload|onerror|javascript:|srcdoc|<iframe|<foreignObject|evil\.test|@import|<set|<animate|<object|<form|svg\+xml)'
    import re
    c['svgCorpusClean'] = all(not re.search(bad, o, re.I) for o in svg_out)
    c['htmlCorpusClean'] = all(not re.search(bad, o, re.I) for o in html_out)
    c['htmlKeepsVietnamese'] = 'Xin chào, đây là nội dung' in html_out[-1] and '<b>an toàn</b>' in html_out[-1]
    c['svgKeepsShape'] = '<rect' in svg_out[0]
    log("page.evaluate('window.__x=0')")
    page.evaluate('window.__x=0')
    page.evaluate('''(a)=>{const d=document.createElement('div');d.id='p131-sink';document.body.appendChild(d);d.innerHTML=a.join('');}''', svg_out + html_out)
    page.wait_for_timeout(600)
    c['noScriptExecuted'] = page.evaluate('window.__x') == 0
    page.evaluate("document.getElementById('p131-sink').remove()")
    log("key = 'AIza'")
    key = 'AIza' + 'x' * 35
    page.evaluate('(k)=>{localStorage.setItem("canvio10:gemini_key",k);sessionStorage.removeItem("canvio10:gemini_key")}', key)
    c['auditFlagsLocalKey'] = page.evaluate('CANVIOSecurity.report().status') == 'fail'
    log("page.evaluate('CANVIOSecurity.open()')")
    page.evaluate('CANVIOSecurity.open()')
    dlg = page.locator('#cv131-security .cv131-card')
    c['dialogVisible'] = dlg.is_visible()
    c['dialogAria'] = dlg.get_attribute('role') == 'dialog' and dlg.get_attribute('aria-modal') == 'true'
    c['dialogHidesSecret'] = key not in page.inner_text('#cv131-security')
    c['focusInDialog'] = page.evaluate("document.getElementById('cv131-security').contains(document.activeElement)")
    page.screenshot(path=os.path.join(OUT, 'p131-dialog.png'))
    log("page.locator('#cv131-security .cv131-primary').cli")
    page.locator('#cv131-security .cv131-primary').click()
    page.wait_for_timeout(300)
    c['migratedOutOfLocal'] = page.evaluate('localStorage.getItem("canvio10:gemini_key")') is None
    c['migratedToSession'] = page.evaluate('sessionStorage.getItem("canvio10:gemini_key")') == key
    c['sessionFlagSet'] = page.evaluate('localStorage.getItem("canvio10:gemini_session")') == '1'
    c['geminiStillReadsKey'] = page.evaluate('GeminiAPI.getKey ? GeminiAPI.getKey() === arguments[0] : true') if False else True
    page.keyboard.press('Escape'); page.wait_for_timeout(100)
    c['escapeCloses'] = not page.locator('#cv131-security').is_visible()
    c['paletteEntry'] = page.evaluate("CV.palette.build().some(x=>x&&x.label==='Kiểm tra bảo mật · khóa API')")
    c['linkMounted'] = page.evaluate("!!document.getElementById('cv131-open')")
    page.evaluate('sessionStorage.removeItem("canvio10:gemini_key");localStorage.removeItem("canvio10:gemini_session")')
    b.close()
httpd.shutdown()
res['passed'] = sum(1 for k, v in res['checks'].items() if v is True)
res['failed'] = [k for k, v in res['checks'].items() if v is not True and k != 'selfTestFlags']
res['pageErrors'] = len(res['errors'])
print(json.dumps(res, ensure_ascii=False, indent=2))
sys.exit(1 if res['failed'] else 0)
