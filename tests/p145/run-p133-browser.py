#!/usr/bin/env python3
"""P133 real-Chrome test: OPFS store round-trip, recovery snapshot of the video engine, simulated crash (stale unclean session) -> reload -> banner -> restore."""
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
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(udir, executable_path=CHROME, headless=True, viewport={'width': 1200, 'height': 800}, reduced_motion='reduce', args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVResilienceP133 && CV.engines && CV.engines.video)', timeout=90000, polling=500)
    c['usesOpfs'] = page.evaluate("CVResilienceP133.store.kind()") == 'opfs'
    c['opfsRoundTrip'] = page.evaluate("""async()=>{var S=CVResilienceP133.store;await S.put('t1.txt','xin chào');var t=await S.getText('t1.txt');var L=await S.list();var big=new Blob([new Uint8Array(3*1048576)]);await S.put('big.bin',big);var g=await S.get('big.bin');await S.remove('t1.txt');await S.remove('big.bin');var after=await S.get('t1.txt');return t==='xin chào'&&L.some(f=>f.name==='t1.txt')&&g.size===3*1048576&&after===null}""")
    c['pathTraversalRejected'] = page.evaluate("""async()=>{var S=CVResilienceP133.store;var r=await S.put('../../evil.txt','x');var L=await S.list();var ok=r.name.indexOf('/')<0&&L.every(f=>f.name.indexOf('/')<0);await S.remove(r.name);return ok}""")
    c['enginesDiscovered'] = page.evaluate("CVResilienceP133.engineNames().indexOf('video')>=0")
    page.evaluate("var s=CV.engines.video._state();s.clips.push({id:'rec1',name:'Recovery test',type:'text',text:'giữ lại',start:0,duration:3,track:3})")
    saved = page.evaluate("CVResilienceP133.snapshotNow()"); c['snapshotSaved'] = 'video' in saved
    c['noRewriteWhenUnchanged'] = page.evaluate("CVResilienceP133.snapshotNow().then(s=>s.indexOf('video')<0)")
    c['recoveryListed'] = page.evaluate("CVResilienceP133.recoveries().then(L=>L.some(r=>r.engine==='video'))")
    page.evaluate("localStorage.setItem('canvio133:s:crashed1',JSON.stringify({id:'crashed1',clean:false,beat:Date.now()-600000}))")
    page.close()
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(url, wait_until='commit', timeout=60000)
    pg.wait_for_function('!!(window.CV && CV.engines && CV.engines.video)', timeout=90000, polling=500)
    pg.wait_for_selector('#cv133-banner', timeout=20000)
    c['bannerShown'] = True
    pg.evaluate("CV.engines.video._state().clips.length=0")
    pg.click('#cv133-banner button[data-eng=video]'); pg.wait_for_timeout(800)
    c['restored'] = pg.evaluate("CV.engines.video._state().clips.some(c=>c.id==='rec1')")
    c['bannerMessage'] = pg.evaluate("/Đã khôi phục/.test(document.getElementById('cv133-msg').textContent)")
    pg.click('#cv133-banner button[data-skip]'); c['bannerDismisses'] = pg.evaluate("!document.getElementById('cv133-banner')")
    pg.evaluate("CV.go('settings')"); pg.wait_for_timeout(1000)
    c['settingsCard'] = pg.evaluate("!!document.getElementById('cv133-card') && /OPFS/.test(document.getElementById('cv133-info').textContent)")
    ctx.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
