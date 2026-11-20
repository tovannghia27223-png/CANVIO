#!/usr/bin/env python3
"""P145.9/.10 hosted Chromium: local asset search, license/hash Quality Gate and read-only behavior."""
import json,os,sys,threading,http.server,socketserver,functools,shutil
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
httpd=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT));httpd.daemon_threads=True
threading.Thread(target=httpd.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%httpd.server_address[1]
checks={};errors=[]
live_owner_ok=False
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
 page=b.new_context(viewport={'width':1280,'height':900}).new_page()
 page.on('pageerror',lambda e:errors.append(str(e)[:220]))
 page.goto(url,wait_until='commit',timeout=60000)
 page.wait_for_function('!!(window.CV&&CV.go&&window.CVContentCoreP145&&window.CVAssetSearchGateP145910)',timeout=90000,polling=500)
 live_owner_ok=page.evaluate("""()=>Array.isArray(CV.assets.list()) && Array.isArray(CVAssetSearchGateP145910.getAssets()) && CVAssetSearchGateP145910.getAssets().length===CV.assets.list().length && (!CV.assets.list().length || CVAssetSearchGateP145910.getAssets()[0].id===CV.assets.list()[0].id)""")
 page.evaluate("""()=>{
   window.__cv145910Assets=[
    {id:'a1',name:'Finance-Report.pdf',type:'application/pdf',size:5,data:'data:application/pdf;base64,SGVsbG8='},
    {id:'a2',name:'Brand-Logo.svg',type:'image/svg+xml',size:44,data:'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4='},
    {id:'a3',name:'Duplicate-Clip.mp4',type:'video/mp4',size:5,data:'data:video/mp4;base64,SGVsbG8='}
   ];
   CVAssetSearchGateP145910.setAssetProvider(()=>window.__cv145910Assets);
   localStorage.setItem('canvio145:meta',JSON.stringify({
    a1:{license:'cc0',source:'Public domain reference'},a2:{license:'own'},a3:{license:'unknown'}
   }));
 }""")
 page.evaluate("CV.go('assets')");page.wait_for_timeout(1000)
 panel=page.locator('#cv145910-card')
 checks['native live provider defaults to CV.assets.list']=live_owner_ok
 checks['search and gate panel mounts']=panel.is_visible()
 # The module may mount before the fixture provider is installed. Explicitly refresh
 # after injection so the assertions inspect the seeded fixture, not the host's
 # initial/previous Asset Vault snapshot.
 if panel.is_visible():
  previous_scan=panel.locator('#cv145910-hash-note').get_attribute('data-scan-id')
  page.locator('#cv145910-refresh').click()
  page.wait_for_function("""prev => { const e=document.querySelector('#cv145910-hash-note'); return e && e.dataset.state==='done' && e.dataset.scanId!==prev && e.textContent.includes('SHA-256 tạm tính trong phiên'); }""",arg=previous_scan,timeout=15000)
 items=page.locator('#cv145910-list button')
 count=items.count()
 item_texts=[items.nth(i).inner_text() for i in range(count)]
 checks['three local assets are listed']=count==3
 checks['shared qualityGate marks two ready one warning']=page.locator('#cv145910-summary').inner_text().startswith('Tổng 3 · Đạt 2 · Cần xử lý 1')
 checks['duplicate hash is detected']=any('trùng nội dung' in t for t in item_texts)
 page.fill('#cv145910-q','finance')
 checks['text search finds finance asset']=page.locator('#cv145910-list button').count()==1 and 'Finance-Report' in page.locator('#cv145910-list').inner_text()
 page.fill('#cv145910-q','');page.select_option('#cv145910-kind','image')
 checks['type filter shows only images']=page.locator('#cv145910-list button').count()==1 and 'Brand-Logo' in page.locator('#cv145910-list').inner_text()
 page.select_option('#cv145910-kind','all');page.select_option('#cv145910-status','warning')
 checks['quality filter shows only non-passing assets']=page.locator('#cv145910-list button').count()==1 and 'Duplicate-Clip' in page.locator('#cv145910-list').inner_text()
 page.select_option('#cv145910-status','all')
 if page.locator('#cv145910-list button').count()>=3:
  page.locator('#cv145910-list button').nth(2).evaluate('(el)=>el.click()')
 detail=page.locator('#cv145910-detail').inner_text()
 checks['selected asset detail lists missing license and session SHA']=('chưa khai báo' in detail or 'unknown' in detail) and 'SHA-256 tạm tính trong phiên' in detail and len(detail.split('SHA-256'))>1
 checks['SHA-256 duplicate detection uses local bytes']=any('trùng nội dung' in t for t in item_texts)
 checks['transient hashes do not mutate Asset Library records']=page.evaluate('window.__cv145910Assets.every(x=>!Object.prototype.hasOwnProperty.call(x,"hash"))')
 checks['module is read-only']=page.locator('#cv145910-card button').count()==4 and page.locator('#cv145910-card input[type=file]').count()==0
 checks['no uncaught host page errors']=len(errors)==0
 b.close()
report={'suite':'CANVIO_P145_9_10_ASSET_SEARCH_GATE','checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] or errors else 0)
