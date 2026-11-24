import json, threading, http.server, socketserver, functools, shutil, os, sys
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
h=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT)); h.daemon_threads=True
threading.Thread(target=h.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%h.server_address[1]; checks={}; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=shutil.which('google-chrome'),headless=True,args=['--no-sandbox','--disable-gpu'])
    pg=b.new_page(viewport={'width':1400,'height':900}); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(url,wait_until='load',timeout=90000); pg.add_style_tag(content='html,*{scroll-behavior:auto!important}')
    pg.wait_for_function("!!window.CVBlockingP167&&!!window.CVBoardP153&&!!window.CVScenePackP155&&!!window.CVCreativeCore",timeout=90000); pg.wait_for_timeout(1500)
    pg.evaluate("CVCreativeCore.create({name:'Thử dựng khối'})")
    pg.evaluate("CV.go('videoStudio')"); pg.wait_for_selector('#cv159u-dock',timeout=15000)
    pg.wait_for_function("document.querySelectorAll('#cv159u-dock [aria-label=\"Bộ công cụ cảnh\"]>[role=tab]').length>=5",timeout=15000)
    checks['dock_has_blocking']=pg.evaluate("[...document.querySelectorAll('#cv159u-dock [aria-label=\"Bộ công cụ cảnh\"]>[role=tab]')].some(b=>b.textContent==='Dựng khối')")
    pg.click('#cv159u-dock [data-id=cv167-card]'); pg.wait_for_selector('#cv167-view',state='visible',timeout=5000)
    def px():
        return pg.evaluate("(()=>{const c=document.querySelector('#cv167-view'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=0;i<d.length;i+=4*97)s=(s*31+d[i]+d[i+1]*3+d[i+2]*7)%1000003;return s})()")
    a=px(); checks['renders_scene']=a!=0
    pg.evaluate("document.querySelector('#cv167-t').value=60;document.querySelector('#cv167-t').dispatchEvent(new Event('input'))"); pg.wait_for_timeout(200); c2=px()
    checks['scrub_changes_view']=a!=c2
    pg.select_option('#cv167-cam',index=1); pg.wait_for_timeout(200); checks['camera_switch']=px()!=c2
    pg.click('#cv167-play'); pg.wait_for_timeout(700); checks['playing']=pg.evaluate("+document.querySelector('#cv167-t').value")>0
    pg.click('#cv167-play')
    # drag object on plan
    before=-14
    box=pg.evaluate("(()=>{const c=document.querySelector('#cv167-plan'),r=c.getBoundingClientRect();const k=r.width/c.width;return [r.left+(c.width/2+(-14)*3.2)*k,r.top+(c.height/2-(8)*3.2)*k,r.left+(c.width/2+(-8)*3.2)*k]})()")
    pg.mouse.move(box[0],box[1]); pg.mouse.down(); pg.mouse.move(box[2],box[1],steps=4); pg.mouse.up(); pg.wait_for_timeout(300)
    after=pg.evaluate("CVBlockingP167.readScene().objects.find(o=>o.id==='b1').x"); checks['drag_moves_object']=after>before
    # persists in project document
    checks['saved_in_core']=pg.evaluate("!!(CVCreativeCore.active.documents&&CVCreativeCore.active.documents.blocking&&CVCreativeCore.active.documents.blocking.objects.length>=5)")
    # snapshot to assets
    n0=pg.evaluate("CV.assets.list().length"); pg.click('#cv167-snap'); pg.wait_for_function("CV.assets.list().length===%d"%(n0+1),timeout=15000)
    aid=pg.evaluate("CV.assets.list()[0].id"); checks['snap_in_asset_library']=pg.evaluate("CV.assets.list()[0].mime.indexOf('image/')===0")
    checks['snap_linked_to_project']=pg.evaluate("(CVCreativeCore.active.assetIds||[]).indexOf('%s')>=0"%aid)
    # storyboard
    s0=pg.evaluate("JSON.parse(localStorage.getItem('canvio5:media_video_project_v1')||'{\"shots\":[]}').shots.length")
    pg.click('#cv167-story'); pg.wait_for_timeout(500)
    s1=pg.evaluate("JSON.parse(localStorage.getItem('canvio5:media_video_project_v1')).shots.length"); checks['storyboard_shot_added']=s1==s0+1
    # description via P128
    pg.click('#cv167-desc'); pg.wait_for_function("document.querySelector('#cv167-out').value.length>20",timeout=5000); checks['desc_via_p128']='Camera' in pg.input_value('#cv167-out')
    # reload keeps scene
    pg.reload(wait_until='load'); pg.wait_for_function("!!window.CVBlockingP167&&!!window.CVCreativeCore",timeout=90000); pg.wait_for_timeout(1200)
    checks['scene_survives_reload']=pg.evaluate("(()=>{const s=CVBlockingP167.readScene();return !!s&&s.objects.some(o=>o.id==='b1')})()")
    pg.evaluate("CV.go('videoStudio')"); pg.wait_for_selector('#cv159u-dock',timeout=15000); pg.set_viewport_size({'width':390,'height':800}); pg.wait_for_timeout(300)
    checks['mobile_no_overflow']=pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2")
    pg.set_viewport_size({'width':1280,'height':900}); pg.click('#cv159u-dock [data-id=cv167-card]'); pg.wait_for_timeout(500); pg.screenshot(path='/tmp/p167.png',clip={'x':0,'y':150,'width':1280,'height':750})
    b.close()
bad=[k for k,v in checks.items() if not v]
print(json.dumps({'checks':checks,'pageErrors':errs,'failed':bad},ensure_ascii=False,indent=1)); sys.exit(1 if bad or errs else 0)
