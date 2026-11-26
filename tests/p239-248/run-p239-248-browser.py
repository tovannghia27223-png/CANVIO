#!/usr/bin/env python3
import functools,http.server,os,shutil,socketserver,threading
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Quiet,directory=ROOT));threading.Thread(target=srv.serve_forever,daemon=True).start()
checks=[];errors=[]
def ck(n,v): checks.append((n,bool(v)));print(('PASS ' if v else 'FAIL ')+n)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-gpu'])
    page=b.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:%d/index.html'%srv.server_address[1],wait_until='domcontentloaded',timeout=120000)
    page.wait_for_function("!!(window.CVBriefPackP239&&window.CVMagicResizeP240&&window.CVBulkP241&&window.CVProjectRecoveryP242&&window.CVWebPublisherP243&&window.CVVideoVoiceP244&&window.CVBeatEditorP245&&window.CVReviewCollabP246&&window.CVPerformanceP247&&window.CVModelManagerP248)",timeout=90000)
    ck('Project Vault Studio Pro panel mounts',page.locator('#cv239-248-hub').count()==1)
    x=page.evaluate("""()=>({pack:CVBriefPackP239.build({brief:'Recruitment'}).count,sizes:CVMagicResizeP240.build({}).length,csv:CVBulkP241.process('name,role\\n\"An, A\",HR',{title:'{{name}}'}).items[0].title,srt:typeof CVVideoVoiceP244.srt()==='string',shots:CVBeatEditorP245.plan({beats:[{time:1,strength:1}]}).length,mono:CVPerformanceP247.measure().indexMonolithic,hardware:CVModelManagerP248.hardware().profile})""")
    ck('P239 generates five documents',x['pack']==5);ck('P240 exposes six formats',x['sizes']==6);ck('P241 preserves quoted CSV',x['csv']=='An, A');ck('P244 exports SRT from native timeline',x['srt']);ck('P245 produces shot plan',x['shots']==1);ck('P247 reports monolith honestly',x['mono']);ck('P248 returns hardware profile',x['hardware'] in ('conservative','balanced','capable'))
    ck('No uncaught browser errors',not errors)
    if errors: print('PAGE_ERRORS',errors)
    b.close()
srv.shutdown();srv.server_close()
failed=[n for n,v in checks if not v];print('%d/%d P239-P248 Chromium checks passed'%(len(checks)-len(failed),len(checks)))
if failed: raise SystemExit('Failed: '+', '.join(failed))
