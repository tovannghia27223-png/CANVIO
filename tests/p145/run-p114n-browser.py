#!/usr/bin/env python3
"""P114.1 real-Chrome test: Studio menu lists Dự án & xuất / AI & cài đặt and opens them; Spatial launcher is visible and opens the inspector; existing four routes unaffected."""
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
    for label, vp in (('desktop', {'width': 1440, 'height': 900}), ('mobile', {'width': 390, 'height': 800})):
        page = b.new_context(viewport=vp, reduced_motion='reduce').new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
        page.goto(url, wait_until='commit', timeout=60000)
        page.wait_for_function('!!(window.CV && CV.go && window.CVWS && window.CVNavRestoreP114 && document.querySelector("#cv-studio-menu [data-route=ai]"))', timeout=90000, polling=500)
        page.wait_for_timeout(1500)
        c[label + ': shell mode on'] = page.evaluate("document.documentElement.dataset.nav") == 'shell'
        c[label + ': spatial button visible'] = page.evaluate("(()=>{const e=document.getElementById('cv229-open');const r=e.getBoundingClientRect();return getComputedStyle(e).display!=='none'&&r.width>20&&r.height>15&&r.right<=innerWidth+1&&r.left>=0})()")
        c[label + ': more-options icon is SVG, not dots'] = page.evaluate("(()=>{const b=document.getElementById('l42-btn');const cs=getComputedStyle(b,'::before');return b.textContent.trim()==='⋯'&&cs.content!=='none'&&(cs.webkitMaskImage||cs.maskImage||'').indexOf('svg')>0&&parseFloat(getComputedStyle(b).fontSize)===0&&b.getAttribute('aria-label')==='Thêm tuỳ chọn'})()")
        page.click('#l42-btn'); page.wait_for_timeout(300)
        c[label + ': more-options button still opens its menu'] = page.evaluate("(()=>{const m=document.getElementById('l42-more');return !!m&&[...m.querySelectorAll('*')].some(e=>e!==document.getElementById('l42-btn')&&e.offsetHeight>0&&/\\S/.test(e.textContent))})()")
        page.keyboard.press('Escape'); page.mouse.click(5, 450); page.wait_for_timeout(200)
        page.evaluate("document.getElementById('cv229-open').click()"); page.wait_for_timeout(600)
        c[label + ': spatial inspector opens'] = page.evaluate("(()=>{const i=document.getElementById('cv229-inspector');return !!i&&getComputedStyle(i).display!=='none'&&i.getBoundingClientRect().width>100})()")
        page.keyboard.press('Escape'); page.evaluate("window.CV229&&CV229.close&&CV229.close()"); page.wait_for_timeout(300)
        page.click('[data-cv-studio-trigger]'); page.wait_for_timeout(300)
        c[label + ': menu has 6 routes'] = page.evaluate("[...document.querySelectorAll('#cv-studio-menu [data-route]')].map(b=>b.dataset.route).join()") == 'home,design,site,media,proj,ai'
        c[label + ': footer says Alt+0-5'] = 'Alt+0–5' in page.inner_text('#cv-studio-menu')
        page.click('#cv-studio-menu [data-route=ai]'); page.wait_for_timeout(700)
        c[label + ': AI & cài đặt opens'] = page.evaluate("CVWS.pageToSpace[(document.querySelector('.page.active')||{}).id.replace('page-','')]") == 'ai'
        page.click('[data-cv-studio-trigger]'); page.wait_for_timeout(300)
        c[label + ': ai marked current'] = page.evaluate("document.querySelector('#cv-studio-menu [data-route=ai]').getAttribute('aria-current')") == 'page' and page.evaluate("document.querySelector('#cv-studio-menu [data-route=home]').getAttribute('aria-current')") is None
        page.click('#cv-studio-menu [data-route=proj]'); page.wait_for_timeout(700)
        c[label + ': Dự án & xuất opens'] = page.evaluate("CVWS.pageToSpace[(document.querySelector('.page.active')||{}).id.replace('page-','')]") == 'proj'
        page.click('[data-cv-studio-trigger]'); page.wait_for_timeout(300); page.click('#cv-studio-menu [data-route=design]'); page.wait_for_timeout(600)
        c[label + ': old route design still works'] = page.evaluate("CVWS.pageToSpace[(document.querySelector('.page.active')||{}).id.replace('page-','')]") == 'design'
        page.click('[data-cv-studio-trigger]'); page.wait_for_timeout(200)
        c[label + ': menu inside viewport'] = page.evaluate("(()=>{const r=document.getElementById('cv-studio-menu').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth})()")
        page.close()
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
