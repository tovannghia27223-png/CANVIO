#!/usr/bin/env python3
"""P145.5 hosted Chromium: edit, preview, save, export, import and verify HTML safety."""
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
 page.wait_for_function('!!(window.CV&&CV.go&&window.CVTemplateFactoryP1455)',timeout=90000,polling=500)
 page.evaluate("CV.go('assets')");page.wait_for_timeout(1200)
 checks['factory panel mounts in Asset Library']=page.locator('#cv1455-card').is_visible()
 checks['five built-in templates available']=page.locator('#cv1455-key option').count()==5
 checks['unit API suite passes']=page.evaluate("Object.values(CVTemplateFactoryP1455.tests()).every(Boolean)")
 page.select_option('#cv1455-key','hr')
 page.select_option('#cv1455-palette','teal')
 page.fill('#cv1455-name','Bộ tuyển dụng')
 page.fill('#cv1455-title','<script>window.bad=1</script> Chuyên viên nhân sự')
 page.fill('#cv1455-subtitle','Cơ hội nghề nghiệp · HCM')
 page.fill('#cv1455-body','Tuyển dụng nhân sự có tư duy dữ liệu và tinh thần hợp tác.')
 page.click('#cv1455-preview')
 frame=page.frame_locator('#cv1455-frame')
 checks['preview renders escaped title as text']=frame.locator('h1').inner_text()=='<script>window.bad=1</script> Chuyên viên nhân sự' and frame.locator('script').count()==0
 checks['preview shows correct palette and text']=frame.locator('body').evaluate("(el)=>getComputedStyle(el).backgroundColor") in ('rgb(234, 245, 243)','rgb(255, 255, 255)') and 'Cơ hội nghề nghiệp' in frame.locator('p').all_inner_texts()[0]
 page.click('#cv1455-save')
 checks['local template saves']=page.locator('#cv1455-saved option').count()==2 and page.locator('#cv1455-out').inner_text().startswith('Đã lưu mẫu')
 with page.expect_download(timeout=20000) as dl:page.click('#cv1455-html')
 htmlpath=os.path.join(tmp,'template.html');dl.value.save_as(htmlpath);html=open(htmlpath,encoding='utf-8').read()
 checks['HTML export is standalone and safe']='<!doctype html>' in html.lower() and '<script' not in html.lower() and 'https://' not in html and '&lt;script&gt;' in html
 with page.expect_download(timeout=20000) as dj:page.click('#cv1455-json')
 jsonpath=os.path.join(tmp,'template.json');dj.value.save_as(jsonpath)
 page.select_option('#cv1455-key','business');page.fill('#cv1455-title','Changed')
 page.set_input_files('#cv1455-import',jsonpath);page.wait_for_timeout(500)
 checks['JSON import restores selected template and fields']=page.locator('#cv1455-key').input_value()=='hr' and page.locator('#cv1455-title').input_value()=='<script>window.bad=1</script> Chuyên viên nhân sự'
 checks['import persisted in local template list']=page.locator('#cv1455-saved option').count()==3
 checks['no uncaught host page errors']=len(errors)==0
 b.close()
report={'suite':'CANVIO_P145_5_TEMPLATE_FACTORY','checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] or errors else 0)