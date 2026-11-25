import json, threading, http.server, socketserver, functools, shutil, os
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
h=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT)); h.daemon_threads=True
threading.Thread(target=h.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%h.server_address[1]; checks={}; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=shutil.which('google-chrome'),headless=True,args=['--no-sandbox','--disable-gpu'])
    ctx=b.new_context(viewport={'width':1400,'height':900}); pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(url,wait_until='load',timeout=90000); pg.add_style_tag(content='html,*{scroll-behavior:auto!important}')
    pg.wait_for_function("!!window.CVStorageHubP170&&!!window.CVCloudP130&&!!window.CVCreativeCore",timeout=90000); pg.wait_for_timeout(1500)
    pg.evaluate("CVCreativeCore.create({name:'Dự án lưu kép'})")
    pg.evaluate("""async()=>{const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');x.fillStyle='#e11';x.fillRect(0,0,64,64);
      const b=await new Promise(r=>c.toBlob(r,'image/png'));await CV.assets.addBlob(new File([b],'do.png',{type:'image/png'}))}""")
    pg.evaluate("CV.go('projectVault')"); pg.wait_for_selector('#cv170-card',timeout=15000)
    checks['card_under_cloud_card']=pg.evaluate("document.querySelector('#cv130-card').nextElementSibling.id==='cv170-card'")
    checks['main_buttons_visible']=all(pg.is_visible(s) for s in ['#cv170-both','#cv170-pick','#cv170-local','#cv170-cloud','#cv170-rlocal','#cv170-rcloud','#cv170-sql','#cv170-cloud-list','#cv170-cloud-assets','#cv170-cloud-delete'])
    checks['sql_matches_file']=pg.evaluate("CVStorageHubP170.sql.length>400&&CVStorageHubP170.sql.includes(\"'cv-assets'\")")
    checks['cloud_asset_management_api']=pg.evaluate("typeof CVStorageHubP170.listCloudAssets==='function'&&typeof CVStorageHubP170.deleteCloudAsset==='function'")
    # Dùng thư mục riêng của trình duyệt (OPFS) thay cho hộp thoại chọn thư mục
    pg.evaluate("""async()=>{const r=await navigator.storage.getDirectory();CVStorageHubP170._setHandle(r);}""")
    st=pg.evaluate("CVStorageHubP170.folderState().then(x=>x.state)"); checks['folder_remembered']=st=='granted'
    r=pg.evaluate("CVStorageHubP170.saveLocal(false)"); checks['local_save_writes_asset']=r['saved']>=1 and r['project']=='Dự án lưu kép'
    r2=pg.evaluate("CVStorageHubP170.saveLocal(false)"); checks['local_resave_dedupes']=r2['saved']==0 and r2['kept']>=1
    mf=pg.evaluate("""async()=>{const r=await navigator.storage.getDirectory();const d=await r.getDirectoryHandle('CANVIO');const t=await (await (await d.getFileHandle('manifest.json')).getFile()).text();return JSON.parse(t)}""")
    checks['manifest_valid']=mf['canvio']=='p170-manifest' and len(mf['assets'])>=1 and len(mf['assets'][0]['sha'])==64
    n0=pg.evaluate("CV.assets.list().length")
    pg.evaluate("""()=>{const a=CV.assets.list().filter(x=>x.name==='do.png').map(x=>x.id);CV.assets.remove&&a.forEach(id=>CV.assets.remove(id));}""")
    pg.wait_for_timeout(300)
    rr=pg.evaluate("CVStorageHubP170.restoreLocal(false)"); checks['restore_from_computer']=rr['restored']>=1 and rr['failed']==0
    checks['cloud_needs_login_message']=pg.evaluate("CVStorageHubP170.saveCloud().then(()=>false,e=>/mở khóa/.test(e.message))")
    both=pg.evaluate("CVStorageHubP170.saveBoth(false)"); checks['one_side_failing_keeps_other']=both['local']['ok'] and not both['cloud']['ok']
    pg.click('#cv170-both'); pg.wait_for_function("document.querySelector('#cv170-msg').textContent.includes('Máy')",timeout=10000)
    checks['button_reports_both_sides']=pg.evaluate("/Cloud/.test(document.querySelector('#cv170-msg').textContent)")
    checks['default_supabase_prefilled']=pg.evaluate("CVCloudP130.client.cfg().url==='https://szdyeqzqyyxmenoiiqxe.supabase.co'")
    b.close()
bad=[k for k,v in checks.items() if not v]; print(json.dumps({'checks':checks,'pageErrors':errs,'failed':bad},ensure_ascii=False,indent=1)); raise SystemExit(1 if bad or errs else 0)
