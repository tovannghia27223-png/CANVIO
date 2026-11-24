import json, threading, http.server, socketserver, functools, shutil, os, sys
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
h=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT)); h.daemon_threads=True
threading.Thread(target=h.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%h.server_address[1]
checks={}; errs=[]
MK="""(w,h,fn)=>new Promise(r=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');fn(x,w,h);c.toBlob(b=>r(b),'image/png')})"""
def put(pg,sel,name,w,h,kind):
    pg.evaluate("""async([sel,name,w,h,kind])=>{const mk=%s;
      const b=await mk(w,h,(x,w,h)=>{ if(kind==='orange'){x.fillStyle='#f97316';x.fillRect(0,0,w,h);x.fillStyle='#1d4ed8';x.fillRect(0,0,w/5,h)} else if(kind==='blue'){x.fillStyle='#2563eb';x.fillRect(0,0,w,h)} else {const q=['#dc2626','#16a34a','#2563eb','#eab308'];for(let i=0;i<4;i++){x.fillStyle=q[i];x.fillRect(i*w/4,0,w/4,h)}}});
      const f=new File([b],name,{type:'image/png'});const dt=new DataTransfer();dt.items.add(f);const i=document.querySelector(sel);i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))}"""%MK,[sel,name,w,h,kind])
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=shutil.which('google-chrome'),headless=True,args=['--no-sandbox','--disable-gpu'])
    pg=b.new_page(viewport={'width':1400,'height':900}); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(url,wait_until='load',timeout=90000); pg.add_style_tag(content='html,body,*{scroll-behavior:auto!important}'); pg.wait_for_function("!!window.CV&&!!window.CVBoardP153&&!!window.CVPanoramaP154&&!!window.CVScenePackP155",timeout=90000); pg.wait_for_timeout(1500)
    pg.evaluate("CV.go('assets')"); pg.wait_for_selector('#cv153-card',timeout=15000)
    checks['boardMounted']=True
    put(pg,'#cv153-file','cam.png',400,300,'orange'); put(pg,'#cv153-file','xanh.png',400,300,'blue')
    pg.wait_for_function("document.querySelectorAll('#cv153-grid .card').length===2",timeout=15000)
    checks['two_items']=True
    names=pg.evaluate("CVBoardP153.list().map(i=>i.names.join('/'))")
    checks['palette_names']=any('Cam' in n for n in names) and any('Xanh dương' in n for n in names)
    pg.click('.cv153-chip[data-c="Cam"]'); pg.wait_for_timeout(200)
    checks['filter_cam']=pg.evaluate("document.querySelectorAll('#cv153-grid .card').length")==1
    pg.click('#cv153-clear'); pg.fill('#cv153-link','example.com'); pg.click('#cv153-addlink'); pg.wait_for_function("document.querySelectorAll('#cv153-grid .card').length===3",timeout=5000)
    checks['link_added']=True
    pg.reload(wait_until='load'); pg.wait_for_function("!!window.CVBoardP153",timeout=90000); pg.evaluate("CV.go('assets')"); pg.wait_for_selector('#cv153-grid .card',timeout=15000)
    checks['persist_reload']=pg.evaluate("document.querySelectorAll('#cv153-grid .card').length")==3
    full=pg.evaluate("CVBoardP153.list().filter(i=>i.type==='img')[0].id"); 
    checks['full_in_idb']=pg.evaluate("async id=>{const d=await CVSceneStoreP153.get(id);return typeof d==='string'&&d.indexOf('data:image')===0}",full)
    # panorama
    pg.evaluate("CV.go('videoStudio')"); pg.wait_for_selector('#cv154-card',timeout=15000)
    put(pg,'#cv154-file','pano.png',1024,512,'quad'); pg.wait_for_function("!document.querySelector('#cv154-shot').disabled",timeout=15000)
    def centre():
        return pg.evaluate("(()=>{const c=document.querySelector('#cv154-view'),d=c.getContext('2d').getImageData(c.width/2,c.height/2,1,1).data;return [d[0],d[1],d[2]]})()")
    pg.wait_for_timeout(500); c0=centre()
    pg.fill('#cv154-yaw','90'); pg.dispatch_event('#cv154-yaw','input'); pg.wait_for_timeout(500); c90=centre()
    checks['pano_rotates']=c0!=c90
    # quadrants: yaw 0 -> boundary green/blue; yaw -90 -> red/green boundary area; yaw 135 -> yellow
    pg.evaluate("document.querySelector('#cv154-yaw').value=135;document.querySelector('#cv154-yaw').dispatchEvent(new Event('input'))"); pg.wait_for_timeout(500); cy=centre()
    checks['pano_yellow_at_135']=cy[0]>200 and cy[1]>150 and cy[2]<100
    n0=pg.evaluate("CVBoardP153.list().length"); pg.click('#cv154-shot'); pg.wait_for_function("CVBoardP153.list().length===%d"%(n0+1),timeout=15000)
    cap=pg.evaluate("CVBoardP153.list()[0]")
    checks['capture_saved']=cap['kind']=='Cảnh' and cap['extra']['yaw']==135 and cap['w']==1280 and cap['h']==720
    # cards / prompt / tone
    pg.wait_for_selector('#cv155-card',timeout=15000)
    pg.fill('#cv155-name','Minh'); pg.fill('#cv155-desc','nam 30 tuổi áo nâu'); pg.click('#cv155-save'); pg.wait_for_timeout(200)
    pg.select_option('#cv155-type','space'); pg.fill('#cv155-name','Văn phòng'); pg.fill('#cv155-desc','tường gạch đèn vàng'); pg.click('#cv155-save'); pg.wait_for_timeout(200)
    checks['two_cards']=pg.evaluate("CVScenePackP155.readCards().length")==2
    pg.click('.cv155-tab[data-t="prompt"]')
    pg.select_option('#cv156-ch',index=1); pg.select_option('#cv156-sp',index=1); pg.select_option('#cv156-sh',index=1); pg.fill('#cv156-ac','chạy qua ngã tư'); pg.click('#cv156-go')
    out=pg.input_value('#cv156-out'); checks['prompt']=('[Nhân vật]' in out and '[Không gian]' in out and '[Góc máy]' in out)
    pg.click('.cv155-tab[data-t="tone"]'); opts=pg.evaluate("[...document.querySelectorAll('#cv157-a option')].map(o=>o.value).filter(Boolean)")
    checks['tone_options']=len(opts)>=3
    ids=pg.evaluate("CVBoardP153.list().filter(i=>i.type==='img').map(i=>[i.id,i.names.join('/')])")
    cam=[i for i,n in ids if n.startswith('Cam') or 'Cam' in n][0]; blue=[i for i,n in ids if n=='Xanh dương'][0]
    pg.select_option('#cv157-a',cam); pg.select_option('#cv157-b',blue); pg.click('#cv157-go'); checks['tone_flags']='Lệch tông' in pg.inner_text('#cv157-r')
    pg.select_option('#cv157-a',cam); pg.select_option('#cv157-b',cam); pg.click('#cv157-go'); checks['tone_same']='Cùng tông' in pg.inner_text('#cv157-r')
    # layout: no horizontal overflow at 390px
    pg.set_viewport_size({'width':390,'height':800}); pg.wait_for_timeout(300)
    checks['mobile_no_overflow']=pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2")
    pg.screenshot(path='/tmp/p153-video.png',full_page=False)
    b.close()
bad=[k for k,v in checks.items() if not v]
print(json.dumps({'checks':checks,'pageErrors':errs,'failed':bad},ensure_ascii=False,indent=1))
sys.exit(1 if bad or errs else 0)
