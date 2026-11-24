import json, threading, http.server, socketserver, functools, shutil, os, sys, tempfile
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
h=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT)); h.daemon_threads=True
threading.Thread(target=h.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%h.server_address[1]; checks={}; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=shutil.which('google-chrome'),headless=True,args=['--no-sandbox','--disable-gpu'])
    ctx=b.new_context(viewport={'width':1400,'height':900},accept_downloads=True); pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(url,wait_until='load',timeout=90000); pg.add_style_tag(content='html,*{scroll-behavior:auto!important}')
    pg.wait_for_function("!!window.CVMotionTemplatesP168&&!!window.CVGifP132&&!!window.CVCreativeCore&&!!window.CVAiWorkflowP165",timeout=90000); pg.wait_for_timeout(1500)
    pg.evaluate("CVCreativeCore.create({name:'Thử chuyển động'})")
    pg.evaluate("""async()=>{const c=document.createElement('canvas');c.width=640;c.height=400;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,640,0);g.addColorStop(0,'#f97316');g.addColorStop(1,'#2563eb');x.fillStyle=g;x.fillRect(0,0,640,400);x.fillStyle='#fff';x.fillRect(200,120,240,160);
      const b=await new Promise(r=>c.toBlob(r,'image/png'));await CV.assets.addBlob(new File([b],'anh-thu.png',{type:'image/png'}))}""")
    pg.evaluate("CV.go('videoStudio')"); pg.wait_for_selector('#cv159u-dock',timeout=15000)
    pg.wait_for_function("document.querySelectorAll('#cv159u-dock [aria-label=\"Bộ công cụ cảnh\"]>[role=tab]').length>=6",timeout=15000)
    pg.click('#cv159u-dock [data-id=cv168-card]'); pg.wait_for_selector('#cv168-view',state='visible',timeout=5000)
    # Pull the active Poster SVG directly into P168 without creating an Asset Library intermediate.
    pg.evaluate("""()=>{CV.poster=CV.poster||{};CV.poster.doc={name:'Poster fixture'};CV.export=CV.export||{};CV.export.svgString=()=>'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#7c3aed"/><text x="320" y="200" text-anchor="middle" font-size="40" fill="#ffffff">Poster fixture</text></svg>'}""")
    beforeDirect=pg.evaluate("CV.assets.list().length")
    pg.click('#cv168-poster-source'); pg.wait_for_function("document.querySelector('#cv168-msg').textContent.includes('Poster')",timeout=10000)
    checks['poster_direct_handoff']=pg.evaluate("CV.assets.list().length===%d"%beforeDirect)
    # Designer adapter accepts a rendered preview data URL from its existing snapshotState owner.
    pg.evaluate("""()=>{const c=document.createElement('canvas');c.width=640;c.height=400;const x=c.getContext('2d');x.fillStyle='#00ff00';x.fillRect(0,0,640,400);const previewDataUrl=c.toDataURL('image/png');CV.engines=CV.engines||{};CV.engines.design={snapshotState:()=>({previewDataUrl})}}""")
    pg.click('#cv168-designer-source'); pg.wait_for_function("document.querySelector('#cv168-msg').textContent.includes('Designer')",timeout=10000)
    checks['designer_direct_handoff']=pg.evaluate("CV.assets.list().length===%d"%beforeDirect)
    pg.select_option('#cv168-preset','pan-right'); pg.fill('#cv168-sec','1'); pg.select_option('#cv168-fps','10'); pg.wait_for_timeout(300)
    checks['designer_source_survives_preset']=pg.evaluate("(()=>{const d=document.querySelector('#cv168-view').getContext('2d').getImageData(32,32,1,1).data;return d[1]>230&&d[0]<30&&d[2]<30})()")
    nDirect=pg.evaluate("CV.assets.list().length"); pg.click('#cv168-gif'); pg.wait_for_function("CV.assets.list().length===%d"%(nDirect+1),timeout=60000)
    checks['designer_source_survives_gif_export']=pg.evaluate("(()=>{const d=document.querySelector('#cv168-view').getContext('2d').getImageData(32,32,1,1).data;return d[1]>230&&d[0]<30&&d[2]<30})()")
    pg.evaluate("document.querySelector('#cv168-asset').dispatchEvent(new Event('focus'));document.querySelector('#cv168-card').dispatchEvent(new Event('mouseenter'))"); pg.wait_for_timeout(600)
    checks['asset_listed']=pg.evaluate("[...document.querySelectorAll('#cv168-asset option')].some(o=>o.textContent==='anh-thu.png')")
    asset_id=pg.evaluate("[...document.querySelectorAll('#cv168-asset option')].find(o=>o.textContent==='anh-thu.png').value")
    pg.select_option('#cv168-asset',asset_id); pg.wait_for_timeout(400)
    def px():
        return pg.evaluate("(()=>{const c=document.querySelector('#cv168-view'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=0;i<d.length;i+=4*101)s=(s*31+d[i]+d[i+1]*3+d[i+2]*7)%1000003;return s})()")
    pg.wait_for_timeout(500); a=px(); checks['still_rendered']=a!=0
    pg.fill('#cv168-text','CANVIO Motion'); pg.select_option('#cv168-text-effect','none'); pg.select_option('#cv168-text-style','banner'); pg.select_option('#cv168-text-position','bottom'); pg.wait_for_timeout(150)
    checks['text_overlay_preview']=px()!=a
    pg.select_option('#cv168-preset','pan-right'); pg.fill('#cv168-sec','1'); pg.wait_for_timeout(400); base=px(); pg.click('#cv168-play'); pg.wait_for_timeout(350); mid=px(); checks['preview_animates']=mid!=base
    pg.wait_for_timeout(900)
    n0=pg.evaluate("CV.assets.list().length"); pg.click('#cv168-gif'); pg.wait_for_function("CV.assets.list().length===%d"%(n0+1),timeout=60000)
    g=pg.evaluate("(()=>{const a=CV.assets.list()[0];return {mime:a.mime,name:a.name,head:(a.data||'').slice(0,40),size:a.size}})()")
    checks['gif_saved']=g['mime']=='image/gif' and g['name'].endswith('.gif') and g['size']>500
    checks['gif_magic']=pg.evaluate("(()=>{const d=CV.assets.list()[0].data;const b=atob(d.split(',')[1].slice(0,16));return b.slice(0,6)==='GIF89a'||b.slice(0,6)==='GIF87a'})()")
    aid=pg.evaluate("CV.assets.list()[0].id"); checks['gif_linked_to_project']=pg.evaluate("(CVCreativeCore.active.assetIds||[]).indexOf('%s')>=0"%aid)
    n1=pg.evaluate("CV.assets.list().length"); pg.click('#cv168-webm')
    try:
        pg.wait_for_function("CV.assets.list().length===%d"%(n1+1),timeout=20000); checks['webm_saved']=pg.evaluate("CV.assets.list()[0].name.endsWith('.webm')")
    except Exception:
        checks['webm_saved']='không hỗ trợ ghi' in pg.inner_text('#cv168-msg') or 'Không có bộ mã hoá' in pg.inner_text('#cv168-msg')
    s0=pg.evaluate("JSON.parse(localStorage.getItem('canvio5:media_video_project_v1')||'{\"shots\":[]}').shots.length")
    pg.click('#cv168-story'); pg.wait_for_timeout(500); checks['storyboard_shot']=pg.evaluate("JSON.parse(localStorage.getItem('canvio5:media_video_project_v1')).shots.length")==s0+1
    # workflow templates
    pg.evaluate("CVAiWorkflowP165.create('Quy trình thử',['scriptwriter','evaluator'])")
    pg.evaluate("CV.go('platform')"); pg.wait_for_selector('#cv165-card',timeout=15000); pg.wait_for_selector('#cv168-wf',timeout=15000); checks['wf_buttons']=True
    with pg.expect_download(timeout=10000) as dl: pg.click('#cv168-wfexp')
    path=dl.value.path(); data=json.load(open(path,encoding='utf8')); checks['wf_export']=data['canvio']=='p165-workflows' and any(w['name']=='Quy trình thử' for w in data['workflows'])
    data['workflows'].append({'name':'Quy trình nhập','steps':['prompt-director','reviser']}); tmp=tempfile.NamedTemporaryFile('w',suffix='.json',delete=False,encoding='utf8'); json.dump(data,tmp); tmp.close()
    pg.set_input_files('#cv168-wff',tmp.name); pg.wait_for_timeout(500)
    checks['wf_import']=pg.evaluate("CVAiWorkflowP165.read().workflows.filter(w=>w.name==='Quy trình nhập').length")==1 and 'Đã nhập 1' in pg.inner_text('#cv168-wfmsg')
    pg.evaluate("CV.go('videoStudio')"); pg.set_viewport_size({'width':390,'height':800}); pg.wait_for_timeout(300); checks['mobile_no_overflow']=pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2")
    b.close()
bad=[k for k,v in checks.items() if not v]
print(json.dumps({'checks':checks,'pageErrors':errs,'failed':bad},ensure_ascii=False,indent=1)); sys.exit(1 if bad or errs else 0)
