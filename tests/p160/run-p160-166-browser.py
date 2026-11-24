import json,threading,http.server,socketserver,functools,os,sys,shutil
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Handler,directory=ROOT));server.daemon_threads=True
threading.Thread(target=server.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%server.server_address[1]
checks={};page_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('google-chrome'),headless=True,args=['--no-sandbox','--disable-gpu'])
    page=browser.new_page(viewport={'width':1360,'height':900})
    page.on('pageerror',lambda e:page_errors.append(str(e)))
    page.goto(url,wait_until='load',timeout=90000)
    page.add_style_tag(content='html,body,*{scroll-behavior:auto!important}')
    page.wait_for_function("""()=>!!window.CV&&!!window.CVInspirationCollectionsP160&&!!window.CVSpatialWorkspaceP161&&!!window.CVReferenceCanvasP162&&!!window.CVCharacterContinuityP163&&!!window.CVShotListP164&&!!window.CVAiWorkflowP165&&!!window.CVLandingStudioP166""",timeout=90000)
    page.evaluate("""()=>[CVInspirationCollectionsP160,CVSpatialWorkspaceP161,CVReferenceCanvasP162,CVCharacterContinuityP163,CVShotListP164,CVAiWorkflowP165,CVLandingStudioP166].forEach(x=>x.mount())""")
    checks['allSevenModulesRegistered']=True
    checks['allSevenPanelsMounted']=page.evaluate("""()=>['#cv160-card','#cv161-card','#cv162-card','#cv163-card','#cv164-card','#cv165-card','#cv166-card'].every(s=>document.querySelector(s))""")
    page.evaluate("""async()=>{const c=document.createElement('canvas');c.width=400;c.height=200;const x=c.getContext('2d');x.fillStyle='#f97316';x.fillRect(0,0,400,200);x.fillStyle='#2563eb';x.fillRect(220,0,180,200);const it=await CVBoardP153.addDataUrl(c.toDataURL('image/png'),{name:'P160-P166 Browser fixture',kind:'Cảnh'});window.__p160asset=it.assetId;const col=CVInspirationCollectionsP160.create('Browser moodboard','HR',['campaign']);window.__p160collection=col.collection.id;CVInspirationCollectionsP160.add(col.collection.id,it.assetId,['orange','HR'],'Reference fixture');const board=CVReferenceCanvasP162.create('Campaign reference');window.__p162board=board.board.id;CVReferenceCanvasP162.addLayer(board.board.id,it.assetId,'subject','Hero subject');const sp=CVSpatialWorkspaceP161.savePreset('Pano front',it.assetId,{yaw:25,pitch:5,fov:85});window.__p161preset=sp.preset.id;const ch=CVCharacterContinuityP163.upsert({name:'Nhân vật Minh',description:'Tóc ngắn, áo khoác xanh',features:{hair:'short',coat:'blue'},checklist:['hair','coat'],referenceAssetIds:[it.assetId],palette:['#2563eb']});window.__p163profile=ch.profile.id;CVCharacterContinuityP163.compare(ch.profile.id,{features:{hair:'short',coat:'blue'},palette:['#2563eb']});const shot=CVShotListP164.addFromPreset('wide-follow');window.__p164shot=shot.shot&&shot.shot.id;const wf=CVAiWorkflowP165.create('Browser local workflow');window.__p165workflow=wf.workflow.id;const landing=CVLandingStudioP166.buildFromCore({name:'CANVIO Browser',headline:'Business design',heroAssetId:it.assetId});window.__p166html=landing.html;}""")
    checks['P160CollectionUsesAssetLibrary']=page.evaluate("CVInspirationCollectionsP160.read().some(c=>c.id===window.__p160collection&&c.items.some(i=>i.assetId===window.__p160asset))")
    checks['P162CanvasUsesAssetId']=page.evaluate("CVReferenceCanvasP162.board(window.__p162board).layers[0].assetId===window.__p160asset")
    checks['P161CameraStoredInProject']=page.evaluate("CVSpatialWorkspaceP161.read().presets.some(p=>p.id===window.__p161preset&&p.assetId===window.__p160asset)")
    checks['P163ConsistencyCheck']=page.evaluate("CVCharacterContinuityP163.compare(window.__p163profile,{features:{hair:'short',coat:'red'}}).missing.includes('coat')")
    checks['P164CanonicalStoryboardBridge']=page.evaluate("!!window.__p164shot&&CVShotListP164.list().some(s=>s.id===window.__p164shot)")
    checks['P166ResponsiveExport']=page.evaluate("window.__p166html.includes('@media(max-width:760px)')&&window.__p166html.includes('prefers-reduced-motion')")
    checks['SharedCoreAssetLinked']=page.evaluate("CVCreativeCore.context().assetIds.includes(window.__p160asset)")
    p161=page.evaluate("async()=>{const r=await CVSpatialWorkspaceP161.apply(window.__p161preset);return !!(r&&r.ok&&r.canvas&&r.canvas.width===1280)}")
    checks['P161PanoramaPreview']=p161
    p162=page.evaluate("async()=>{const r=await CVReferenceCanvasP162.send(window.__p162board,'image');return !!(r&&r.ok&&r.detail&&r.detail.prompt.includes('[SUBJECT]'))}")
    checks['P162P128LocalPrompt']=p162
    p163=page.evaluate("async()=>{const r=await CVCharacterContinuityP163.runPrompt(window.__p163profile,'Cảnh văn phòng');return !!(r&&r.ok&&String(r.text).includes('CHARACTER CONTINUITY'))}")
    checks['P163P128LocalPrompt']=p163
    p164=page.evaluate("async()=>{const r=await CVShotListP164.sendPrompt();return !!(r&&r.ok&&String(r.text).includes('Shot list'))}")
    checks['P164P128LocalPrompt']=p164
    p165=page.evaluate("async()=>{const r=await CVAiWorkflowP165.run(window.__p165workflow,'Brief HR, mục tiêu tuyển dụng, palette xanh, nhân vật nhất quán và CTA');return !!(r&&r.ok&&r.run.status==='completed')}")
    checks['P165WorkflowCompletes']=p165
    page.evaluate("CV.go('assets')")
    checks['P160UIPanelVisible']=page.locator('#cv160-card').count()==1
    page.evaluate("CV.go('videoStudio')")
    checks['P163P164PanelsVisible']=page.locator('#cv163-card').count()==1 and page.locator('#cv164-card').count()==1
    page.evaluate("CV.go('imageStudio')")
    checks['P162UIPanelVisible']=page.locator('#cv162-card').count()==1
    page.evaluate("CV.go('designEngine')")
    checks['P161UIPanelVisible']=page.locator('#cv161-card').count()==1
    page.evaluate("CV.go('platform')")
    checks['P165UIPanelVisible']=page.locator('#cv165-card').count()==1
    page.evaluate("CV.go('webEngine')")
    checks['P166UIPanelVisible']=page.locator('#cv166-card').count()==1
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(300)
    checks['MobileNoHorizontalOverflow']=page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2")
    browser.close()
server.shutdown()
failed=[k for k,v in checks.items() if not v]
print(json.dumps({'suite':'P160-P166 Chromium integrated acceptance','checks':checks,'passed':sum(1 for v in checks.values() if v),'total':len(checks),'failed':failed,'pageErrors':page_errors},ensure_ascii=False,indent=2))
sys.exit(1 if failed or page_errors else 0)
