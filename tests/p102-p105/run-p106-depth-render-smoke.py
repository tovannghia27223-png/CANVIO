#!/usr/bin/env python3
"""P106 depth-render smoke with explicit WebGL-or-2D-fallback detection.
The worker result is synthetic; this validates UI/render and portable ZIP wiring,
not a real Depth Anything model inference or physical-GPU qualification.
"""
from __future__ import annotations
import json, os, re, shutil, tempfile, zipfile
from pathlib import Path
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = Path(__file__).parent
SHIM = r'''<script id="canvio-p106-test-shims">
(()=>{
 function makeStorage(){const m=new Map();return{get length(){return m.size},key(i){return [...m.keys()][i]??null},getItem(k){return m.has(String(k))?m.get(String(k)):null},setItem(k,v){m.set(String(k),String(v))},removeItem(k){m.delete(String(k))},clear(){m.clear()}}}
 Object.defineProperty(window,'localStorage',{configurable:true,value:makeStorage()});
 Object.defineProperty(window,'sessionStorage',{configurable:true,value:makeStorage()});
 class SyntheticDepthWorker{
  constructor(){this.handlers={message:[],error:[]};this.dead=false;window.__p106SyntheticWorkerCalls=(window.__p106SyntheticWorkerCalls||0)+1;}
  addEventListener(t,fn){(this.handlers[t]||(this.handlers[t]=[])).push(fn)}
  removeEventListener(t,fn){this.handlers[t]=(this.handlers[t]||[]).filter(x=>x!==fn)}
  postMessage(msg){if(this.dead||!msg||msg.type!=='estimate')return;const w=96,h=64,p=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)p[y*w+x]=Math.max(0,Math.min(255,Math.round(255*x/(w-1))));const b=p.buffer;setTimeout(()=>{if(this.dead)return;(this.handlers.message||[]).slice().forEach(fn=>fn({data:{type:'result',width:w,height:h,backend:'wasm-q8',buffer:b}}));},25)}
  terminate(){this.dead=true}
 }
 Object.defineProperty(window,'Worker',{configurable:true,writable:true,value:SyntheticDepthWorker});
})();</script>'''

def main():
    source=(ROOT/'index.html').read_text(encoding='utf-8')
    source=re.sub(r'^(\s*<!doctype[^>]*>)',lambda m:m.group(1)+SHIM,source,count=1,flags=re.I)
    img=Image.new('RGB',(160,100),(18,35,60)); d=ImageDraw.Draw(img)
    d.rectangle((0,0,79,99),fill=(220,70,50)); d.rectangle((80,0,159,99),fill=(40,150,220)); d.ellipse((45,20,115,90),fill=(230,210,80))
    import io
    buf=io.BytesIO(); img.save(buf,format='PNG'); png=buf.getvalue()
    checks=[]; errors=[]; console_errors=[]
    def record(name,ok,detail=''):
        checks.append({'id':name,'status':'pass' if ok else 'fail','detail':detail})
        print(('PASS' if ok else 'FAIL'),name,detail)
        if not ok: raise AssertionError(name+(': '+detail if detail else ''))
    with sync_playwright() as p:
        exe=os.environ.get('CHROMIUM_EXECUTABLE_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
        browser=p.chromium.launch(headless=(os.environ.get('CANVIO_HEADLESS','1')!='0'),executable_path=exe,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'])
        page=browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:console_errors.append(m.text[:500]) if m.type=='error' else None)
        page.route('https://fonts.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='text/css',body=''))
        page.route('https://fonts.gstatic.com/**',lambda r:r.fulfill(status=200,content_type='font/woff2',body=b''))
        page.set_content(source,wait_until='domcontentloaded',timeout=90000); page.wait_for_timeout(3500)
        page.evaluate("CV.go('videoEngine')"); page.wait_for_timeout(1000)
        record('P105/P106 panel mounted',page.locator('#cv105-depth-parallax').count()==1)
        webgl_available=page.evaluate("!!document.createElement('canvas').getContext('webgl')")
        print('WebGL available:',webgl_available)
        page.locator('#cv105-file').set_input_files({'name':'p106-synthetic-source.png','mimeType':'image/png','buffer':png})
        page.locator('#cv105-run').click()
        page.wait_for_function("document.querySelector('#cv105-status')?.textContent.includes('Depth map đã tạo')",timeout=30000)
        snap=page.evaluate('''() => {
          const canvas=document.querySelector('#cv105-parallax-canvas'), status=document.querySelector('#cv105-status').textContent;
          const gl=canvas.getContext('webgl'); let uniqueColors=0,nonzeroPixels=0,renderer='2d-fallback';
          if(gl){renderer=gl.getParameter(gl.RENDERER);const px=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,px);const u=new Set();for(let i=0;i<px.length;i+=4){u.add(px[i]+','+px[i+1]+','+px[i+2]);if(px[i]||px[i+1]||px[i+2])nonzeroPixels++;}uniqueColors=u.size;}
          else{const ctx=canvas.getContext('2d');if(ctx){const px=ctx.getImageData(0,0,canvas.width,canvas.height).data;const u=new Set();for(let i=0;i<px.length;i+=4){u.add(px[i]+','+px[i+1]+','+px[i+2]);if(px[i]||px[i+1]||px[i+2])nonzeroPixels++;}uniqueColors=u.size;}}
          return {status,renderMode:status.includes('preview WebGL depth parallax')?'webgl':status.includes('fallback Ken Burns 2D')?'2d-fallback':'other',workerCalls:window.__p106SyntheticWorkerCalls||0,renderer,canvasWidth:canvas.width,canvasHeight:canvas.height,uniqueColors,nonzeroPixels,runEnabled:!document.querySelector('#cv105-parallax-start').disabled,exportEnabled:!document.querySelector('#cv105-export').disabled};
        }''')
        record('depth worker invoked only after user action',snap['workerCalls']==1,str(snap['workerCalls']))
        if webgl_available:
            record('P106 WebGL depth shader selected',snap['renderMode']=='webgl',snap['status'][-180:])
            record('P106 WebGL draw produced visible pixels',snap['uniqueColors']>8 and snap['nonzeroPixels']>10000,json.dumps({'uniqueColors':snap['uniqueColors'],'nonzeroPixels':snap['nonzeroPixels'],'renderer':snap['renderer']}))
        else:
            record('P106 reports explicit 2D fallback rather than claiming 2.5D',snap['renderMode']=='2d-fallback',snap['status'][-180:])
            record('P106 2D fallback produces visible varied pixels',snap['uniqueColors']>8 and snap['nonzeroPixels']>10000,json.dumps({'uniqueColors':snap['uniqueColors'],'nonzeroPixels':snap['nonzeroPixels']}))
        expected_label='Xem trước 2.5D' if webgl_available else 'Xem trước Ken Burns 2D'
        actual_label=page.locator('#cv105-parallax-start').inner_text()
        record('P106 preview button labels the actual renderer mode',actual_label==expected_label,actual_label)
        record('preview and export actions enabled after depth processing',snap['runEnabled'] and snap['exportEnabled'])
        before_frame=page.evaluate('''() => {const c=document.querySelector('#cv105-parallax-canvas'),g=c.getContext('webgl');if(g){const p=new Uint8Array(c.width*c.height*4);g.readPixels(0,0,c.width,c.height,g.RGBA,g.UNSIGNED_BYTE,p);let n=0;for(let i=0;i<p.length;i+=97)n=(n+p[i]*(i+1))>>>0;return n;}const x=c.getContext('2d'),p=x.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<p.length;i+=97)n=(n+p[i]*(i+1))>>>0;return n;}''')
        page.locator('#cv105-parallax-start').click(); page.wait_for_timeout(900)
        after_frame=page.evaluate('''() => {const c=document.querySelector('#cv105-parallax-canvas'),g=c.getContext('webgl');if(g){const p=new Uint8Array(c.width*c.height*4);g.readPixels(0,0,c.width,c.height,g.RGBA,g.UNSIGNED_BYTE,p);let n=0;for(let i=0;i<p.length;i+=97)n=(n+p[i]*(i+1))>>>0;return n;}const x=c.getContext('2d'),p=x.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<p.length;i+=97)n=(n+p[i]*(i+1))>>>0;return n;}''')
        record('P106 preview animation changes rendered pixels over time',before_frame!=after_frame,json.dumps({'before':before_frame,'after':after_frame,'mode':snap['renderMode']}))
        page.locator('#cv105-parallax-stop').click()
        page.locator('#cv105-strength').evaluate("el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}")
        page.locator('#cv105-save-preset').click(); page.wait_for_timeout(200)
        record('preset metadata save preserves zero strength',page.evaluate("CV.assets.list().some(a=>a.canvioDepth&&a.canvioDepth.parallax&&a.canvioDepth.parallax.strength===0)"))
        with tempfile.TemporaryDirectory(prefix='canvio-p107-roundtrip-') as tmp:
            with page.expect_download(timeout=30000) as dl:
                page.locator('#cv105-export-preset').click()
            download=dl.value; zip_path=Path(tmp)/'CANVIO_DEPTH_PRESET.zip'; download.save_as(str(zip_path))
            with zipfile.ZipFile(zip_path) as z: names=sorted(z.namelist()); crc_ok=z.testzip() is None
            record('P107 actual browser export creates exact three-file ZIP',names==['depth.png','manifest.json','source.png'] and crc_ok,json.dumps({'entries':names,'crc':crc_ok,'bytes':zip_path.stat().st_size}))
            before=page.evaluate('CV.assets.list().length')
            page.locator('#cv105-import-preset-file').set_input_files(str(zip_path)); page.wait_for_timeout(2200)
            status=page.locator('#cv105-status').inner_text()
            imported=page.evaluate('''() => {const rows=CV.assets.list();const src=rows.find(a=>a.canvioDepth&&a.canvioDepth.parallax&&a.canvioDepth.parallax.portableImport);const dep=src&&rows.find(a=>a.id===src.canvioDepth.depthAssetId);return {count:rows.length,source:!!src,depth:!!dep,strength:src&&src.canvioDepth.parallax.strength,width:dep&&dep.canvioDepth.width,height:dep&&dep.canvioDepth.height,sourceWidth:src&&src.canvioDepth.sourceWidth,sourceHeight:src&&src.canvioDepth.sourceHeight,depthWidth:src&&src.canvioDepth.depthWidth,depthHeight:src&&src.canvioDepth.depthHeight};}''')
            ok=imported['count']==before+2 and imported['source'] and imported['depth'] and imported['strength']==0 and imported['width']==96 and imported['height']==64 and imported['sourceWidth']==160 and imported['sourceHeight']==100 and imported['depthWidth']==96 and imported['depthHeight']==64
            record('P107 browser import restores independent dimensions and zero-strength metadata',ok,json.dumps({'imported':imported,'status':status}))
            # A fresh isolated browser context simulates transferring the ZIP to a second client.
            page2=browser.new_page(viewport={'width':1440,'height':1000})
            page2.on('pageerror',lambda e:errors.append('second-client: '+str(e)))
            page2.on('console',lambda m:console_errors.append('second-client: '+m.text[:500]) if m.type=='error' else None)
            page2.route('https://fonts.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='text/css',body=''))
            page2.route('https://fonts.gstatic.com/**',lambda r:r.fulfill(status=200,content_type='font/woff2',body=b''))
            page2.set_content(source,wait_until='domcontentloaded',timeout=90000); page2.wait_for_timeout(1800)
            page2.locator('#cv105-import-preset-file').set_input_files(str(zip_path)); page2.wait_for_timeout(2200)
            imported2=page2.evaluate('''() => {const rows=CV.assets.list();const src=rows.find(a=>a.canvioDepth&&a.canvioDepth.parallax&&a.canvioDepth.parallax.portableImport);const dep=src&&rows.find(a=>a.id===src.canvioDepth.depthAssetId);return {count:rows.length,source:!!src,depth:!!dep,strength:src&&src.canvioDepth.parallax.strength,sourceWidth:src&&src.canvioDepth.sourceWidth,sourceHeight:src&&src.canvioDepth.sourceHeight,depthWidth:src&&src.canvioDepth.depthWidth,depthHeight:src&&src.canvioDepth.depthHeight};}''')
            status2=page2.locator('#cv105-status').inner_text()
            ok2=imported2['count']==2 and imported2['source'] and imported2['depth'] and imported2['strength']==0 and imported2['sourceWidth']==160 and imported2['sourceHeight']==100 and imported2['depthWidth']==96 and imported2['depthHeight']==64
            record('P107 ZIP transfers into a fresh isolated browser client with source/depth metadata intact',ok2,json.dumps({'imported':imported2,'status':status2}))
            page2.close()
        page.locator('#cv105-duration').select_option('4')
        page.locator('#cv105-export').click()
        page.wait_for_function("document.querySelector('#cv105-status')?.textContent.includes('Đã xuất')",timeout=30000)
        export_result=page.evaluate('''() => {const rows=CV.assets.list();const video=rows.find(a=>typeof a.mime==='string'&&a.mime.indexOf('video/webm')===0&&String(a.name||'').indexOf('CANVIO_2.5D_')===0);return {asset:!!video,mime:video&&video.mime,size:video&&video.size,name:video&&video.name,status:document.querySelector('#cv105-status').textContent,videoEngine:!!(CV.engines&&CV.engines.video&&typeof CV.engines.video.importFiles==='function')};}''')
        expected_mode='2.5D depth parallax' if webgl_available else 'Ken Burns 2D fallback'
        record('P106 exports real WebM media to Asset Library and Video Engine with truthful renderer label',export_result['asset'] and export_result['size']>0 and export_result['videoEngine'] and expected_mode in export_result['status'],json.dumps(export_result))
        record('no uncaught page errors',not errors,json.dumps(errors[:5]))
        record('no console errors',not console_errors,json.dumps(console_errors[:5]))
        report={'suite':'CANVIO_P106_DEPTH_RENDER_EXPORT_AND_P107_ZIP_ROUNDTRIP','candidate':'23.3.108-p85-studio-r2','passed':sum(c['status']=='pass' for c in checks),'total':len(checks),'checks':checks,'browser':browser.version,'headless':(os.environ.get('CANVIO_HEADLESS','1')!='0'),'origin':'about:blank','renderer':snap['renderer'],'renderBackend':'ANGLE_SWIFTSHADER_SOFTWARE_WEBGL (forced test backend)' if webgl_available else '2D_CANVAS_FALLBACK','webglAvailable':webgl_available,'depthWorker':'synthetic deterministic gradient; no model inference','p106WebglShaderAccepted':bool(webgl_available),'fallbackAccepted':snap['renderMode']=='2d-fallback','physicalGpuExecuted':False,'realDepthAnythingInferenceExecuted':False,'p107ActualSameBrowserZipRoundtrip':True,'p107IsolatedSecondClientRoundtrip':True,'physicalTwoDeviceRoundtripExecuted':False,'limitations':['Opaque about:blank and test-only storage shims.','Synthetic depth output validates wiring and fallback, not model quality.','Software SwiftShader is not a physical GPU; hosted origin and two-device round-trip remain open.']}
        report_name='p106-depth-render-webgl-browser-smoke-report.json' if webgl_available else 'p106-depth-render-fallback-browser-smoke-report.json'
        (REPORT_DIR/report_name).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        browser.close()
    print(f"P106/P107 Chromium smoke: {len(checks)}/{len(checks)} PASS")
if __name__=='__main__': main()
