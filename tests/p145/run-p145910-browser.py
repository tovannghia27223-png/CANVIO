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
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
 page=b.new_context(viewport={'width':1280,'height':900}).new_page()
 page.on('pageerror',lambda e:errors.append(str(e)[:220]))
 page.goto(url,wait_until='commit',timeout=60000)
 page.wait_for_function('!!(window.CV&&CV.go&&window.CVContentCoreP145&&window.CVAssetSearchGateP145910)',timeout=90000,polling=500)
 page.evaluate("""()=>{
   window.__cv145910Assets=[
    {id:'a1',name:'Finance-Report.pdf',type:'application/pdf',size:1024,hash:'hash-one'},
    {id:'a2',name:'Brand-Logo.svg',type:'image/svg+xml',size:512,hash:'hash-two'},
    {id:'a3',name:'Duplicate-Clip.mp4',type:'video/mp4',size:2048,hash:'hash-one'}
   ];
   CVAssetSearchGateP145910.setAssetProvider(()=>window.__cv145910Assets);
   localStorage.setItem('canvio145:meta',JSON.stringify({
    a1:{license:'cc0',source:'Public domain reference'},a2:{license:'own'},a3:{license:'unknown'}
   }));
 }""")
 page.evaluate("CV.go('assets')");page.wait_for_timeout(1000)
 checks['search and gate panel mounts']=page.locator('#cv145910-card').is_visible()
 checks['three local assets are listed']=page.locator('#cv145910-list button').count()==3
 checks['shared qualityGate marks two ready one warning']=page.locator('#cv145910-summary').inner_text().startswith('Tổng 3 · Đạt 2 · Cần xử lý 1')
 checks['duplicate hash is detected']='trùng nội dung' in page.locator('#cv145910-list button').nth(2).inner_text()
 page.fill('#cv145910-q','finance')
 checks['text search finds finance asset']=page.locator('#cv145910-list button').count()==1 and 'Finance-Report' in page.locator('#cv145910-list').inner_text()
 page.fill('#cv145910-q','');page.select_option('#cv145910-kind','image')
 checks['type filter shows only images']=page.locator('#cv145910-list button').count()==1 and 'Brand-Logo' in page.locator('#cv145910-list').inner_text()
 page.select_option('#cv145910-kind','all');page.select_option('#cv145910-status','warning')
 checks['quality filter shows only non-passing assets']=page.locator('#cv145910-list button').count()==1 and 'Duplicate-Clip' in page.locator('#cv145910-list').inner_text()
 page.select_option('#cv145910-status','all');page.locator('#cv145910-list button').nth(2).evaluate('(el)=>el.click()')
 detail=page.locator('#cv145910-detail').inner_text()
 checks['selected asset detail lists missing license and hash']=('chưa khai báo' in detail or 'unknown' in detail) and 'hash-one' in detail
 checks['module is read-only']=page.locator('#cv145910-card button').count()==4 and page.locator('#cv145910-card input[type=file]').count()==0
 checks['no uncaught host page errors']=len(errors)==0
 b.close()
report={'suite':'CANVIO_P145_9_10_ASSET_SEARCH_GATE','checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] or errors else 0)