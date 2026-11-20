#!/usr/bin/env python3
"""P145.6 hosted Chromium: verifies 25 original local SVG icons, category/search filters and safe downloads."""
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
 page.wait_for_function('!!(window.CV&&CV.go&&window.CVOriginalIconPackP1456)',timeout=90000,polling=500)
 page.evaluate("CV.go('assets')");page.wait_for_timeout(1000)
 checks['icon pack mounts in Asset Library']=page.locator('#cv1456-card').is_visible()
 checks['25 icon cards are visible']=page.locator('#cv1456-grid button[data-cv1456-id]').count()==25
 checks['five categories available']=page.locator('#cv1456-cat option').count()==6
 checks['unit API suite passes']=page.evaluate("Object.values(CVOriginalIconPackP1456.tests()).every(Boolean)")
 page.locator('#cv1456-cat').select_option('finance')
 checks['category filter returns finance icons']=page.locator('#cv1456-grid button[data-cv1456-id]').count()==5
 page.locator('#cv1456-cat').select_option('all');page.fill('#cv1456-search','wallet')
 checks['search narrows to one icon']=page.locator('#cv1456-grid button[data-cv1456-id]').count()==1
 page.locator('#cv1456-grid button[data-cv1456-id=wallet]').evaluate("(el)=>el.click()")
 checks['selected icon preview is updated']=page.locator('#cv1456-title').inner_text()=='Ví' and page.locator('#cv1456-selected svg').count()==1
 with page.expect_download(timeout=15000) as d:page.locator('#cv1456-one').evaluate("(el)=>el.click()")
 pth=os.path.join(tmp,'icon.svg');d.value.save_as(pth);svg=open(pth,encoding='utf-8').read()
 checks['single icon SVG download is static and self-contained']='<svg' in svg and '<path' in svg and '<script' not in svg and 'https://' not in svg
 with page.expect_download(timeout=15000) as d2:page.locator('#cv1456-sprite').evaluate("(el)=>el.click()")
 sp=os.path.join(tmp,'sprite.svg');d2.value.save_as(sp);sprite=open(sp,encoding='utf-8').read()
 checks['sprite includes all named symbols']=all('id="canvio-'+k+'"' in sprite for k in ['briefcase','chart','people','video','shield-check'])
 with page.expect_download(timeout=15000) as d3:page.locator('#cv1456-sheet').evaluate("(el)=>el.click()")
 sheet=os.path.join(tmp,'sheet.svg');d3.value.save_as(sheet);content=open(sheet,encoding='utf-8').read()
 checks['contact sheet is vector-only']=content.count('<g transform=')==25 and '<image' not in content and '<script' not in content
 checks['no uncaught page errors']=len(errors)==0
 b.close()
report={'suite':'CANVIO_P145_6_ORIGINAL_ICON_PACK','checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] or errors else 0)