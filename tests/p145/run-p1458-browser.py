#!/usr/bin/env python3
"""P145.8 hosted Chromium: original vector asset categories, search, theme, preview, individual/SVG sprite downloads."""
import json,os,sys,threading,http.server,socketserver,functools,shutil,tempfile
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
httpd=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT));httpd.daemon_threads=True
threading.Thread(target=httpd.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%httpd.server_address[1]
checks={};errors=[];tmp=tempfile.mkdtemp()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
 ctx=b.new_context(viewport={'width':1280,'height':900},accept_downloads=True)
 page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)[:220]))
 page.goto(url,wait_until='commit',timeout=60000)
 page.wait_for_function('!!(window.CV&&CV.go&&window.CVOriginalVectorAssetsP1458)',timeout=90000,polling=500)
 page.evaluate("CV.go('assets')");page.wait_for_timeout(800)
 checks['vector pack mounts']=page.locator('#cv1458-card').is_visible()
 checks['eight original vector cards shown']=page.locator('#cv1458-grid button[data-cv1458-id]').count()==8
 checks['unit suite passes']=page.evaluate("Object.values(CVOriginalVectorAssetsP1458.tests()).every(Boolean)")
 page.select_option('#cv1458-cat','hr')
 checks['category filter shows two HR illustrations']=page.locator('#cv1458-grid button[data-cv1458-id]').count()==2
 page.select_option('#cv1458-cat','all');page.fill('#cv1458-search','Finance')
 checks['search finds financial illustration']=page.locator('#cv1458-grid button[data-cv1458-id]').count()==2 and 'Finance' in page.locator('#cv1458-grid').inner_text()
 page.fill('#cv1458-search','');page.locator('#cv1458-grid button[data-cv1458-id=remote-work]').evaluate('(el)=>el.click()')
 checks['selected illustration preview updates']=page.locator('#cv1458-title').inner_text()=='Remote Work' and page.locator('#cv1458-selected svg').count()==1
 page.select_option('#cv1458-theme','plum')
 checks['theme updates selected preview']=page.locator('#cv1458-selected svg rect').first.get_attribute('fill')=='#f4eff8'
 with page.expect_download(timeout=15000) as d:page.locator('#cv1458-one').evaluate('(el)=>el.click()')
 path=os.path.join(tmp,'asset.svg');d.value.save_as(path);svg=open(path,encoding='utf-8').read()
 checks['single SVG is self contained']='<svg' in svg and '<script' not in svg and 'https://' not in svg and 'var(--' not in svg
 with page.expect_download(timeout=15000) as d2:page.locator('#cv1458-sprite').evaluate('(el)=>el.click()')
 pth=os.path.join(tmp,'sprite.svg');d2.value.save_as(pth);sprite=open(pth,encoding='utf-8').read()
 checks['sprite includes all eight symbols']=all('id="canvio-art-'+k+'"' in sprite for k in ['business-growth','finance-dashboard','team-collaboration','social-campaign','remote-work','budget-planning','talent-search','strategy-target'])
 with page.expect_download(timeout=15000) as d3:page.locator('#cv1458-sheet').evaluate('(el)=>el.click()')
 sh=os.path.join(tmp,'sheet.svg');d3.value.save_as(sh);sheet=open(sh,encoding='utf-8').read()
 checks['contact sheet includes all artwork labels']=sheet.count('<text ')==9 and all(k in sheet for k in ['Business Growth','Strategy Target','Finance Dashboard','Budget Planning','Team Collaboration','Talent Search','Social Campaign','Remote Work'])
 checks['no uncaught host page errors']=len(errors)==0
 b.close()
report={'suite':'CANVIO_P145_8_ORIGINAL_VECTOR_ASSETS','checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] or errors else 0)