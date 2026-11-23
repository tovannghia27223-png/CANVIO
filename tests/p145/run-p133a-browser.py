#!/usr/bin/env python3
"""P133.6 Chrome: Asset Library lưu ảnh lớn vào IndexedDB — vượt quota localStorage, sống qua tải lại, di chuyển dữ liệu cũ, dọn khi xóa."""
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
def load(pg):
    pg.goto(url, wait_until='commit', timeout=60000)
    pg.wait_for_function("!!(window.CV&&CV.assets&&window.CVAssetStoreP133&&CVAssetStoreP133.installed)", timeout=90000, polling=300)
    pg.evaluate("CVAssetStoreP133.ready()"); pg.wait_for_timeout(300)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'])
    ctx = b.new_context(viewport={'width': 1200, 'height': 800}); page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    load(page)
    # 12 ảnh ~1MB mỗi ảnh = 12MB > quota localStorage
    r = page.evaluate("""async()=>{
      const mk=(i)=>({id:'big'+i,name:'a'+i+'.png',mime:'image/png',size:1000000,cat:'image',data:'data:image/png;base64,'+('QUJD'.repeat(262144)).slice(0,1000000-i),at:'x'});
      let arr=[];for(let i=0;i<12;i++){arr.unshift(mk(i));var ok=LS.set('assets',arr);if(!ok)return{fail:i}}
      await new Promise(r=>setTimeout(r,1500));
      const s=CVAssetStoreP133.status();const raw=localStorage.getItem('canvio5:assets');
      return{ok:true,status:s,rawBytes:raw.length,listLen:LS.get('assets',[]).length,firstLen:LS.get('assets',[])[0].data.length}}""")
    c['tooBigForLocalStorageButAccepted'] = bool(r.get('ok'))
    c['allPersistedToIdb'] = r['status']['persisted'] == 12 and r['status']['pending'] == 0 and not r['status']['error']
    c['localStorageHoldsOnlyMetadata'] = r['rawBytes'] < 20000
    c['listStillReturnsFullData'] = r['listLen'] == 12 and r['firstLen'] > 900000
    page.reload(); load(page)
    r2 = page.evaluate("()=>{const l=LS.get('assets',[]);return{n:l.length,lens:l.map(a=>a.data.length),ids:l.map(a=>a.id)}}")
    c['survivesReload'] = r2['n'] == 12 and all(x > 900000 for x in r2['lens'])
    # xóa một mục → dọn IDB
    page.evaluate("CV.assets.remove('big3')"); page.wait_for_timeout(800)
    r3 = page.evaluate("async()=>{await CVAssetStoreP133.ready();return{n:LS.get('assets',[]).length,st:CVAssetStoreP133.status()}}")
    c['removeDropsItem'] = r3['n'] == 11 and r3['st']['cached'] == 11
    page.reload(); load(page)
    c['removeSurvivesReload'] = page.evaluate("LS.get('assets',[]).length===11 && !LS.get('assets',[]).some(a=>a.id==='big3')")
    # dữ liệu kiểu cũ (đầy đủ trong localStorage) tự chuyển
    ctx2 = b.new_context(); pg2 = ctx2.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg2.goto(url, wait_until='commit'); pg2.wait_for_function("!!(window.CVAssetStoreP133)", timeout=90000, polling=300)
    pg2.evaluate("""()=>{localStorage.setItem('canvio5:assets',JSON.stringify([{id:'old1',name:'old.png',mime:'image/png',size:300000,cat:'image',data:'data:image/png;base64,'+'QUJD'.repeat(100000),at:'x'},{id:'tiny',name:'t.png',mime:'image/png',size:10,cat:'image',data:'data:image/png;base64,AAAA',at:'x'}]))}""")
    load(pg2)
    r4 = pg2.evaluate("()=>{const raw=JSON.parse(localStorage.getItem('canvio5:assets'));const l=LS.get('assets',[]);return{rawOld:raw[0],rawTinyData:raw[1].data,l:l.map(a=>[a.id,a.data.length])}}")
    c['legacyMigratedToIdb'] = r4['rawOld'].get('store') == 1 and r4['rawOld']['data'] == '' and r4['l'][0][1] == 400000 + 22
    c['smallAssetsStayInLocalStorage'] = r4['rawTinyData'] == 'data:image/png;base64,AAAA'
    # trang Tài nguyên vẫn mở được
    pg2.evaluate("CV.go('assets')"); pg2.wait_for_timeout(500)
    c['assetsPageRenders'] = pg2.evaluate("document.querySelectorAll('#page-assets .assetCard').length")>=1
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
