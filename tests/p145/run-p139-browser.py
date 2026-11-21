#!/usr/bin/env python3
"""P139.1 same-origin Chromium acceptance for parent/null and character text animator."""
import functools,http.server,json,os,shutil,socketserver,sys,threading
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
httpd=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Quiet,directory=ROOT));httpd.daemon_threads=True
threading.Thread(target=httpd.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%httpd.server_address[1]
checks={};errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
 page=b.new_context(viewport={'width':1280,'height':900},reduced_motion='reduce').new_page()
 page.on('pageerror',lambda e:errors.append(str(e)[:240]))
 page.goto(url,wait_until='commit',timeout=60000)
 page.wait_for_function("!!(window.CVNativeEngines?.motionLab && window.CVMotionLabP139)",timeout=90000,polling=500)
 page.evaluate("CV.go('motionLab')")
 page.click('[data-ml="text"]')
 page.wait_for_selector('#cv139-panel')
 checks['panelMounted']=page.locator('#cv139-panel').count()==1
 initial=page.evaluate("JSON.parse(CVNativeEngines.motionLab.snapshotState())")
 text_id=page.evaluate("CVNativeEngines.motionLab.getLayers().find(x=>x.selected)?.id")
 checks['textLayerCreated']=bool(text_id)
 page.click('#cv139-panel [data-cv139="create-parent"]')
 state=page.evaluate("JSON.parse(CVNativeEngines.motionLab.snapshotState())")
 child=next(x for x in state['objs'] if x['id']==text_id)
 parent=next((x for x in state['objs'] if x.get('id')==child.get('parentId')),None)
 checks['nullParentCreated']=bool(parent and parent.get('type')=='null' and parent.get('hidden') is True)
 if parent:
  page.evaluate("""([id])=>CVMotionLabP139.setNullTransform(id,{x:450,y:260,scale:1.4,rotation:20})""",[parent['id']])
  page.evaluate("""([id])=>CVMotionLabP139.configureTextAnimator(id,{enabled:true,mode:'rise',stagger:.06,duration:.8,strength:70,curve:[.2,.8,.3,1]})""",[text_id])
  enabled_png=page.evaluate("CVNativeEngines.motionLab.draw(.22);document.getElementById('mlCanvas').toDataURL('image/png')")
  page.evaluate("id=>CVMotionLabP139.configureTextAnimator(id,{enabled:false})",text_id)
  page.evaluate("CVNativeEngines.motionLab.draw(.22)")
  disabled_png=page.evaluate("document.getElementById('mlCanvas').toDataURL('image/png')")
  checks['textAnimatorChangesRender']=enabled_png!=disabled_png
  persisted=page.evaluate("JSON.parse(CVNativeEngines.motionLab.snapshotState())")
  child2=next(x for x in persisted['objs'] if x['id']==text_id)
  checks['parentAndAnimatorSavedInExistingSnapshot']=child2.get('parentId')==parent['id'] and child2.get('textAnimator',{}).get('mode')=='rise'
  page.evaluate("""([id])=>{const s=CVNativeEngines.motionLab.snapshotState();CVNativeEngines.motionLab.restoreState(s)}""",[text_id])
  roundtrip=page.evaluate("JSON.parse(CVNativeEngines.motionLab.snapshotState())")
  child3=next(x for x in roundtrip['objs'] if x['id']==text_id)
  checks['snapshotRestoreRetainsMetadata']=child3.get('parentId')==parent['id'] and isinstance(child3.get('textAnimator'),dict)
 checks['noDuplicateLayerIds']=page.evaluate("(()=>{const ids=JSON.parse(CVNativeEngines.motionLab.snapshotState()).objs.map(x=>x.id);return ids.length===new Set(ids).size})()")
 checks['zeroPageErrors']=len(errors)==0
 b.close()
httpd.shutdown()
result={'checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(result,ensure_ascii=False,indent=2));sys.exit(1 if result['failed'] or errors else 0)
