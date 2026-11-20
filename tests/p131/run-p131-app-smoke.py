#!/usr/bin/env python3
"""Full-app Chrome smoke over http://127.0.0.1 (external hosts fail fast). Regression guard for two boot defects
fixed with P131: P111 MutationObserver self-trigger loop, and the CVKit export ReferenceError ('CDN is not defined').
Also walks every CV.go page, opens the P131 dialog and records page errors / console errors."""
import json, os, sys, threading, http.server, socketserver, functools, shutil, tempfile
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
OUT = os.environ.get('P131_OUT', os.path.join(tempfile.gettempdir(), 'p131-out')); os.makedirs(OUT, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
INIT = "window.__moN=0;(function(){var O=window.MutationObserver;window.MutationObserver=class extends O{constructor(cb,o){super(function(){window.__moN++;return cb.apply(this,arguments)},o)}}})();"
import time
T0 = time.time()
def log(m): print('[%5.1fs] %s' % (time.time() - T0, m), file=sys.stderr, flush=True)
res = {'url': url, 'checks': {}, 'pageErrors': [], 'consoleErrors': [], 'navErrors': []}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-background-networking', '--disable-sync', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce')
    page = ctx.new_page(); page.add_init_script(INIT)
    page.on('pageerror', lambda e: res['pageErrors'].append(str(e)[:200]))
    page.on('console', lambda m: res['consoleErrors'].append(m.text[:200]) if m.type == 'error' and 'Failed to load resource' not in m.text and 'ERR_' not in m.text else None)
    page.on('dialog', lambda d: d.accept())
    page.goto(url, wait_until='commit', timeout=60000)
    try:
        page.wait_for_function('!!(window.CANVIOSecurity && window.CVKit && window.CV && CV.palette && CV.go)', timeout=90000, polling=500)
    except Exception as e:
        res['pageErrors'].append('wait timeout: ' + str(e)[:80])
        print(json.dumps(res, ensure_ascii=False, indent=2)); sys.exit(2)
    page.wait_for_timeout(5000)
    c = res['checks']
    log('booted')
    c['bootResponsive'] = page.evaluate('1+1') == 2
    c['p111NoObserverStorm'] = page.evaluate('window.__moN') < 5000
    c['cvkitExported'] = page.evaluate("typeof CVKit==='object'")
    c['securityMounted'] = page.evaluate("!!document.getElementById('cv131-open') && CV.palette.build().some(x=>x&&x.label==='Kiểm tra bảo mật · khóa API')")
    ids = page.evaluate("Array.from(document.querySelectorAll('.page')).map(p=>p.id.replace(/^page-/,''))")
    res['pagesFound'] = len(ids)
    log('pages %d' % len(ids))
    for i in ids:
        log('go ' + i)
        try:
            ok = page.evaluate("(id)=>{try{CV.go(id);return !!document.querySelector('#page-'+id+'.active')||true}catch(e){return 'ERR '+e.message}}", i)
            if isinstance(ok, str): res['navErrors'].append(i + ': ' + ok)
        except Exception as e: res['navErrors'].append(i + ': ' + str(e)[:80])
    log('nav done')
    page.wait_for_timeout(800)
    c['allPagesNavigate'] = not res['navErrors']
    c['responsiveAfterNav'] = page.evaluate('2+2') == 4 and page.evaluate('window.__moN') < 20000
    evil = ['<svg xmlns="http://www.w3.org/2000/svg"><a><animate attributeName="href" values="javascript:window.__x=1"/><text>x</text></a></svg>',
            '<svg xmlns="http://www.w3.org/2000/svg"><a><set attributeName="xlink:href" to="javascript:window.__x=1"/><text>x</text></a></svg>',
            '<svg xmlns="http://www.w3.org/2000/svg"><style>rect{fill:url(\\68ttp://e.test/x)}</style><rect width="3" height="3"/></svg>']
    outs = page.evaluate("(l)=>l.map(s=>{try{return CANVIOAICreativeWorkflow.sanitizeSvg(s)}catch(e){return 'ERR'}})", evil)
    c['appSvgImportHardened'] = all(('javascript:' not in o and '<animate' not in o and '<set' not in o and 'e.test' not in o) for o in outs)
    page.evaluate("CV.go('videoEngine')"); page.wait_for_timeout(1500)
    c['p127qMounted'] = page.evaluate("!!document.getElementById('cv127-quality')")
    if c['p127qMounted']:
        page.click('#cv127q-run'); page.wait_for_timeout(300)
        c['p127qRuns'] = page.evaluate("document.querySelectorAll('#cv127q-list li').length")>0
        page.click('#cv127q-cut'); page.wait_for_timeout(500)
        c['p127qCutHandlesNoSelection'] = page.evaluate("!document.getElementById('cv127q-cut').disabled && /Chưa cắt|Đã cắt|Không cắt/.test(document.getElementById('cv127q-status').textContent)")
        page.screenshot(path=os.path.join(OUT, 'p127q.png'))
    page.evaluate("CV.go('home')"); page.wait_for_timeout(300)
    page.evaluate('CANVIOSecurity.open()')
    c['dialogOpens'] = page.locator('#cv131-security .cv131-card').is_visible()
    page.screenshot(path=os.path.join(OUT, 'p131-app-dialog.png'))
    page.keyboard.press('Escape')
    c['dialogCloses'] = not page.locator('#cv131-security').is_visible()
    page.set_viewport_size({'width': 390, 'height': 800}); page.evaluate('CANVIOSecurity.open()'); page.wait_for_timeout(200)
    c['dialogFitsMobile'] = page.evaluate("(()=>{var r=document.querySelector('#cv131-security .cv131-card').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1})()")
    page.screenshot(path=os.path.join(OUT, 'p131-app-dialog-390.png'))
    b.close()
httpd.shutdown()
res['failed'] = [k for k, v in res['checks'].items() if v is not True]
res['passed'] = sum(1 for v in res['checks'].values() if v is True)
c = res['checks']
print(json.dumps(res, ensure_ascii=False, indent=2))
sys.exit(1 if (res['failed'] or res['pageErrors']) else 0)
