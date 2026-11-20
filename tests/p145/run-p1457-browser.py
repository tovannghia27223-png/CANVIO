#!/usr/bin/env python3
"""P145.7 hosted Chromium: system font presets, preview, font availability and CSS export."""
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
 page.wait_for_function('!!(window.CV&&CV.go&&window.CVTypographyPresetsP1457)',timeout=90000,polling=500)
 page.evaluate("CV.go('assets')");page.wait_for_timeout(800)
 checks['typography panel mounts']=page.locator('#cv1457-card').is_visible()
 checks['six presets available']=page.locator('#cv1457-preset option').count()==6
 checks['unit suite passes']=page.evaluate("Object.values(CVTypographyPresetsP1457.tests()).every(Boolean)")
 page.select_option('#cv1457-preset','editorial')
 page.click('#cv1457-apply')
 # Validate the user-facing preset-to-preview action through the explicit Apply control.
 # Font availability varies by runner, so assert the declared CSS stack and status, not the physical font selected by the OS.
 checks['preset updates typography preview']=page.locator('#cv1457-heading').evaluate("(el)=>el.style.fontFamily.toLowerCase().includes('georgia')") and 'Editorial Serif' in page.locator('#cv1457-status').inner_text()
 page.fill('#cv1457-hsize','52');page.fill('#cv1457-bsize','18');page.fill('#cv1457-line','1.8');page.fill('#cv1457-track','-.03')
 page.click('#cv1457-apply')
 checks['custom controls update live preview']=page.locator('#cv1457-heading').evaluate("(el)=>parseFloat(getComputedStyle(el).fontSize)===52") and page.locator('#cv1457-body').evaluate("(el)=>parseFloat(getComputedStyle(el).fontSize)===18")
 page.locator('#cv1457-check').evaluate('(el)=>el.click()')
 checks['font availability check reports local/system fallback']= 'Font-family được trình duyệt xác nhận' in page.locator('#cv1457-status').inner_text()
 with page.expect_download(timeout=15000) as d:page.locator('#cv1457-css').evaluate("(el)=>el.click()")
 path=os.path.join(tmp,'typography.css');d.value.save_as(path);css=open(path,encoding='utf-8').read()
 checks['CSS download contains presets without remote fonts']='--cv-heading-font' in css and '--cv-body-font' in css and '@import' not in css and 'https://' not in css
 checks['no uncaught host page errors']=len(errors)==0
 b.close()
report={'suite':'CANVIO_P145_7_SYSTEM_TYPOGRAPHY','checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] or errors else 0)
