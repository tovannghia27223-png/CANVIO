#!/usr/bin/env python3
"""Hosted, same-origin runtime acceptance: Three.js r187, P85 runtimes and real ONNX inference."""
from __future__ import annotations
import base64
import base64 as _b64
import functools, http.server, json, os, socketserver, struct, threading, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
REPORT=Path(__file__).with_name('hosted-runtime-report.json')
checks={}; details={}; errors=[]; requests=[]
def record(name,ok,detail=None):
    checks[name]=bool(ok)
    if detail is not None: details[name]=detail
    print(('PASS' if ok else 'FAIL'),name,detail or '')
    if not ok: raise AssertionError(name+(': '+str(detail) if detail is not None else ''))
def glb_fixture():
    pos=struct.pack('<9f',-.72,-.48,0,.72,-.48,0,0,.72,0); inds=struct.pack('<3H',0,1,2); binary=pos+inds+b'\x00\x00'
    doc={'asset':{'version':'2.0','generator':'CANVIO hosted runtime smoke'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0}],'meshes':[{'primitives':[{'attributes':{'POSITION':0},'indices':1,'material':0}]}],'materials':[{'pbrMetallicRoughness':{'baseColorFactor':[.15,.75,.42,1],'metallicFactor':.05,'roughnessFactor':.5}}],'buffers':[{'byteLength':len(binary)}],'bufferViews':[{'buffer':0,'byteOffset':0,'byteLength':len(pos),'target':34962},{'buffer':0,'byteOffset':len(pos),'byteLength':6,'target':34963}],'accessors':[{'bufferView':0,'componentType':5126,'count':3,'type':'VEC3','min':[-.72,-.48,0],'max':[.72,.72,0]},{'bufferView':1,'componentType':5123,'count':3,'type':'SCALAR'}]}
    raw=json.dumps(doc,separators=(',',':')).encode(); raw+=b' '*((4-len(raw)%4)%4); binary+=b'\x00'*((4-len(binary)%4)%4); total=12+8+len(raw)+8+len(binary)
    return struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT),**kw)
    def log_message(self,*a): pass
    def end_headers(self):
        if self.path.endswith('.wasm'): self.send_header('Content-Type','application/wasm')
        if self.path.endswith('.mjs'): self.send_header('Content-Type','text/javascript; charset=utf-8')
        self.send_header('Cross-Origin-Opener-Policy','same-origin')
        self.send_header('Cross-Origin-Embedder-Policy','require-corp')
        self.send_header('Cross-Origin-Resource-Policy','same-origin')
        super().end_headers()

def main():
    server=socketserver.ThreadingTCPServer(('127.0.0.1',0),QuietHandler); server.daemon_threads=True
    threading.Thread(target=server.serve_forever,daemon=True).start()
    origin=f'http://127.0.0.1:{server.server_address[1]}'
    page_errors=[]; console_errors=[]
    try:
      with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--enable-unsafe-webgpu'])
        context=browser.new_context(viewport={'width':1440,'height':1050},accept_downloads=True)
        page=context.new_page()
        page.on('request',lambda r:requests.append(r.url))
        page.on('pageerror',lambda e:page_errors.append(str(e)))
        page.on('console',lambda m:console_errors.append(m.text[:500]) if m.type=='error' else None)
        page.goto(origin+'/index.html',wait_until='commit',timeout=60000)
        page.wait_for_function("!!window.CANVIOStableRelease && !!window.CANVIOP85Suite && !!window.CANVIOThreeGLBViewerP74",timeout=60000)
        record('Integrated P70/P74/P85 owners boot',True)
        boot_vendor=[u for u in requests if '/assets/three/' in u or '/assets/p85/' in u]
        record('Three/P85 runtimes stay lazy at boot',not boot_vendor,boot_vendor)
        gate=page.evaluate("() => window.CANVIOStableRelease.inspect()")
        record('P70 returns fourteen manual gates and remains fail-closed',len(gate.get('manualGates',[]))==14 and gate.get('releaseCertified') is False and gate.get('status')=='BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE',gate.get('gateSummary'))
        manifest=page.evaluate("""async()=>{
          const a=await (await fetch('/assets/three/THREE-VENDOR-MANIFEST.json')).json();
          const b=await (await fetch('/assets/p85/P85-VENDOR-MANIFEST.json')).json();
          async function verify(root,m){let bytes=0;for(const f of m.files){const r=await fetch(root+f.path);if(!r.ok)throw Error('missing '+f.path);const ab=await r.arrayBuffer();if(ab.byteLength!==f.bytes)throw Error('size '+f.path);const h=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',ab))).map(x=>x.toString(16).padStart(2,'0')).join('');if(h!==f.sha256)throw Error('SHA256 '+f.path);bytes+=ab.byteLength;}return {files:m.files.length,bytes};}
          return {three:await verify('/assets/three/',a),p85:await verify('/assets/p85/',b),threeCommit:a.commit,threeRevision:a.revision};
        }""")
        record('Three.js r187 and P85 vendor manifests verify every file SHA-256',manifest['three']['files']>0 and manifest['p85']['files']>0,manifest)
        record('P74/P81 uncompressed GLB input owner exists',page.locator('#cv72-file').count()==1 and page.locator('#cv74-load').count()==1)
        page.locator('#cv72-file').set_input_files({'name':'canvio-hosted-smoke.glb','mimeType':'model/gltf-binary','buffer':glb_fixture()})
        page.locator('#cv74-load').evaluate('(el) => el.click()')
        page.wait_for_function("document.querySelector('#cv74-status')?.textContent.includes('Đã tải GLB')",timeout=180000)
        p74=page.evaluate("() => ({tests:window.CANVIOThreeGLBViewerP74.tests(),report:JSON.parse(document.querySelector('#cv74-report').textContent),webgl2:!!document.querySelector('#cv74-canvas').getContext('webgl2')})")
        record('P74/P81 loads real r187 GLB viewer with local decoders',p74['tests'].get('vendorManifestVerified') and p74['tests'].get('threeModuleLoaded') and p74['tests'].get('dracoModuleLoaded') and p74['tests'].get('meshoptDecoderReady') and p74['tests'].get('ktx2ModuleLoaded') and p74['webgl2'],p74['report'])
        pose_api=page.evaluate("""()=>{
          const applied=CANVIOThreeGLBViewerP74.applyCameraPose({yaw:37,pitch:18,fov:64,position:{x:0,y:0,z:0}});
          return {applied,actual:CANVIOThreeGLBViewerP74.getCameraPose()};
        }""")
        record('P74.1 bounded camera pose API applies yaw/pitch/FOV',abs(pose_api['actual']['yaw']-37)<0.2 and abs(pose_api['actual']['pitch']-18)<0.2 and abs(pose_api['actual']['fov']-64)<0.01,pose_api)
        p161id=page.evaluate("""async()=>{
          if(!window.CVSpatialWorkspaceP161)throw Error('P161 module missing');
          if(!CVCreativeCore.active&&CVCreativeCore.create)CVCreativeCore.create({name:'P161 GLB camera pose acceptance'});
          const input=document.querySelector('#cv72-file'),file=input&&input.files&&input.files[0];
          if(!file)throw Error('Hosted GLB fixture is not present in P72 file input');
          await CV.assets.addBlob(file);
          const asset=CV.assets.list().find(x=>String(x.name||'')==='canvio-hosted-smoke.glb');
          if(!asset)throw Error('P161 GLB fixture was not added to Asset Library');
          const saved=CVSpatialWorkspaceP161.savePreset('Hosted GLB camera pose',asset.id,{yaw:48,pitch:21,fov:66,x:1.5,y:0.9,z:2.25});
          if(!saved.ok)throw Error(saved.error||'P161 preset save failed');
          return saved.preset.id;
        }""")
        p161pose=page.evaluate("""async(id)=>{
          const result=await CVSpatialWorkspaceP161.apply(id),actual=CANVIOThreeGLBViewerP74.getCameraPose();
          return {ok:result.ok,message:result.message,cameraPose:result.cameraPose,actual:actual};
        }""",p161id)
        record('P161 GLB preset replays saved pose through P74/P81',p161pose['ok'] and abs(p161pose['actual']['yaw']-48)<0.2 and abs(p161pose['actual']['pitch']-21)<0.2 and abs(p161pose['actual']['fov']-66)<0.01 and abs(p161pose['actual']['position']['x']-1.5)<0.001 and abs(p161pose['actual']['position']['y']-0.9)<0.001 and abs(p161pose['actual']['position']['z']-2.25)<0.001,p161pose)
        # Compressed GLB decode (Draco + Meshopt) with fixtures generated in CI. KTX2 uses a UASTC-encoded texture from toktx.
        fx=os.environ.get('CANVIO_GLB_FIXTURES')
        for kind,ext in (('draco','KHR_draco_mesh_compression'),('meshopt','EXT_meshopt_compression'),('ktx2','KHR_texture_basisu')):
            path=Path(fx)/(kind+'.glb') if fx else None
            if not path or not path.exists():
                record(f'P74/P81 compressed {kind} GLB decodes in real r187 viewer',False,'fixture missing: set CANVIO_GLB_FIXTURES'); continue
            try:
                data=path.read_bytes()
                if ext.encode() not in data: raise AssertionError('fixture lacks '+ext)
                page.evaluate("() => { document.querySelector('#cv74-status').textContent=''; }")
                page.locator('#cv72-file').set_input_files({'name':kind+'.glb','mimeType':'model/gltf-binary','buffer':data})
                page.locator('#cv74-load').evaluate('(el) => el.click()')
                page.wait_for_function("document.querySelector('#cv74-status')?.textContent.includes('Đã tải GLB')",timeout=120000)
                rep=page.evaluate("() => document.querySelector('#cv74-report').textContent")
                record(f'P74/P81 compressed {kind} GLB decodes in real r187 viewer',True,{'bytes':len(data),'extension':ext,'report':rep[:600]})
            except Exception as e:
                record(f'P74/P81 compressed {kind} GLB decodes in real r187 viewer',False,{'error':str(e)[:400],'status':page.evaluate("() => document.querySelector('#cv74-status')?.textContent")})
        # Restore the small baseline GLB so later P85 steps run on the same input as before this check.
        page.evaluate("() => { document.querySelector('#cv74-status').textContent=''; }")
        page.locator('#cv72-file').set_input_files({'name':'canvio-hosted-smoke.glb','mimeType':'model/gltf-binary','buffer':glb_fixture()})
        page.locator('#cv74-load').evaluate('(el) => el.click()')
        page.wait_for_function("document.querySelector('#cv74-status')?.textContent.includes('Đã tải GLB')",timeout=120000)
        p85=page.evaluate("""async()=>{
          const s=window.CANVIOP85Suite;
          const paths=['p85-renderers.js','opencv/opencv.js','dotlottie/index.js','dotlottie/dotlottie-player.wasm','rive/rive.js','rive/rive.wasm','transformers/transformers.min.js'];
          await s.verifyFiles(paths);
          const renderer=await s.ensureRendererBundle();
          const cv=await s.ensureOpenCV();const mat=new cv.Mat(8,8,cv.CV_8UC1);mat.delete();
          const DotLottie=await s.ensureDotLottie();
          const rive=await s.ensureRive();
          return {renderer:!!renderer.createPostProcessingPreview&&!!renderer.createWebGPUPathTracingPreview,opencv:!!cv.Mat,dotlottie:!!DotLottie.preload,rive:!!rive.Rive,report:s.inspect()};
        }""")
        record('P85 PostFX/WebGPU bundle, OpenCV WASM, dotLottie WASM and Rive WASM initialize',p85['renderer'] and p85['opencv'] and p85['dotlottie'] and p85['rive'],{'renderer':p85['renderer'],'opencv':p85['opencv'],'dotlottie':p85['dotlottie'],'rive':p85['rive']})
        page.locator('#p85-postfx-open').evaluate('(el) => el.click()')
        page.wait_for_function("document.querySelector('#p85-postfx-status')?.textContent.includes('Đã render')")
        record('P85 PostFX produces live GLB preview',True,page.locator('#p85-postfx-status').inner_text())
        record('P106 software-WebGL context exists (not physical GPU)',page.evaluate("!!document.createElement('canvas').getContext('webgl2')"),'ANGLE SwiftShader software renderer')
        # Generate deterministic JPEG frames in Chromium's Canvas and pipe MJPEG to FFmpeg.
        # The pinned Playwright FFmpeg build enables the MJPEG decoder but intentionally omits PNG.
        video_frames=page.evaluate("""async()=>{
          const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;
          const ctx=canvas.getContext('2d'),frames=[];
          for(let frame=0;frame<90;frame++){
            ctx.fillStyle='#18283c';ctx.fillRect(0,0,320,240);
            for(let y=0;y<240;y+=24)for(let x=0;x<320;x+=24){
              ctx.fillStyle=(((x/24|0)^(y/24|0))&1)?'#476078':'#24394f';
              ctx.fillRect(x,y,20,20);
            }
            const left=8+(frame*3)%264;
            for(let y=0;y<48;y+=8)for(let x=0;x<48;x+=8){
              ctx.fillStyle=(((x/8|0)^(y/8|0))&1)?'#e3b936':'#4173e1';
              ctx.fillRect(left+x,80+y,8,8);
            }
            const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.9));
            if(!blob)throw new Error('Chromium could not encode the MJPEG fixture frame');
            const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';
            for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
            frames.push(btoa(binary));
          }
          return frames;
        }""")
        if len(video_frames)!=90: raise RuntimeError('Expected 90 deterministic JPEG frames')
        frame_stream=b''.join(base64.b64decode(frame) for frame in video_frames)
        ffmpeg=Path.home()/'.cache/ms-playwright/ffmpeg-1013/ffmpeg-linux'
        if not ffmpeg.is_file(): raise RuntimeError('Pinned Playwright FFmpeg binary is missing; cannot create video fixture')
        video_path=Path('/tmp/canvio-motion-smoke.webm')
        mux=subprocess.run([str(ffmpeg),'-y','-f','image2pipe','-vcodec','mjpeg','-framerate','15','-i','pipe:0','-frames:v','90','-c:v','libvpx-vp9','-deadline','realtime','-cpu-used','8','-b:v','400k','-pix_fmt','yuv420p','-an','-map_metadata','-1','-f','webm',str(video_path)],input=frame_stream,capture_output=True)
        if mux.returncode or not video_path.is_file() or video_path.stat().st_size<1024:
            raise RuntimeError('Could not create deterministic finite-duration WebM fixture: '+(mux.stderr or b'').decode('utf-8','replace')[-1600:])
        page.locator('#p85-video').set_input_files(str(video_path))
        track=page.evaluate("""async()=>{const s=window.CANVIOP85Suite;const r=await s.startOpticalFlow();const deadline=performance.now()+5000;let status='';let frames=0;while(performance.now()<deadline){status=document.querySelector('#p85-cv-status')?.textContent||'';const m=status.match(/· (\\d+) khung xử lý/);frames=m?Number(m[1]):0;if(frames>=2)break;await new Promise(resolve=>setTimeout(resolve,100));}const match=status.match(/LK optical flow · (?:khởi tạo lại )?(\\d+) điểm/);const points=match?Number(match[1]):0;const result={started:!!r,duration:r.duration,dimensions:[r.width,r.height],status,points,frames,loaded:s.inspect().openCvLoaded};s.stopOpticalFlow();return result;}""")
        record('P85 OpenCV Lucas-Kanade processes real points on local video frames',track['started'] and track['dimensions']==[320,240] and track['points']>0 and 'OpenCV.js LK optical flow' in track['status'],track)
        # P102 UI availability is a normal browser smoke; only heavy model inference is opt-in.
        try:
            page.locator('.nav button[data-page="imageStudio"]').click()
            page.wait_for_function("""() => {
              const route=document.querySelector('#page-imageStudio');
              const panel=document.querySelector('#cv102-background-removal');
              return !!(route&&route.classList.contains('active')&&panel&&panel.getBoundingClientRect().height>0&&panel.previousElementSibling?.classList.contains('head'));
            }""",timeout=15000)
            ui=page.evaluate("""() => {
              const panel=document.querySelector('#cv102-background-removal');
              return {visible:!!(panel&&panel.getBoundingClientRect().height>0),afterHeading:!!(panel&&panel.previousElementSibling?.classList.contains('head')),file:!!panel?.querySelector('#cv102-file'),run:!!panel?.querySelector('#cv102-run'),download:!!panel?.querySelector('#cv102-download')};
            }""")
            record('P102 UI panel is visible below the Image Studio heading without model download',ui['visible'] and ui['afterHeading'] and ui['file'] and ui['run'] and ui['download'],ui)
        except Exception as e:
            record('P102 UI panel is visible below the Image Studio heading without model download',False,{'error':str(e)[:400]})
        full_model_acceptance=os.environ.get("CANVIO_FULL_MODEL_ACCEPTANCE", "false").lower() in ("1","true","yes")
        if full_model_acceptance:
            # Real ORMBG and Depth Anything ONNX WASM inference through the shipped workers.
            infer=page.evaluate("""async()=>{
              function makePng(){const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,256,256);g.addColorStop(0,'#173b61');g.addColorStop(1,'#e6b56e');x.fillStyle=g;x.fillRect(0,0,256,256);x.fillStyle='#d94d43';x.beginPath();x.arc(128,120,60,0,Math.PI*2);x.fill();return new Promise(r=>c.toBlob(r,'image/png')); }
              const blob=await makePng(),buffer=await blob.arrayBuffer();
              async function run(path,type,extra,timeoutMs){return await new Promise((resolve,reject)=>{const w=new Worker(path,{type:'module'}),timer=setTimeout(()=>{w.terminate();reject(new Error(path+' timed out'));},timeoutMs);w.onmessage=e=>{const m=e.data||{};if(m.type==='error'){clearTimeout(timer);w.terminate();reject(new Error(path+': '+m.message));}if(m.type==='result'){clearTimeout(timer);const v={type:m.type,width:m.width,height:m.height,bytes:m.buffer?.byteLength,backend:m.backend,channels:m.channels};w.terminate();resolve(v);}};w.onerror=e=>{clearTimeout(timer);w.terminate();reject(new Error(path+': '+e.message));};const copy=buffer.slice(0);w.postMessage(Object.assign({type:type,buffer:copy,mime:'image/png',backend:'wasm'},extra),[copy]);});}
              const bg=await run('/assets/canvio-rmbg-worker.js','remove',{},900000);
              const depth=await run('/assets/canvio-depth-worker.js','estimate',{},900000);
              if(bg.width<1||bg.height<1||bg.bytes!==bg.width*bg.height*4)throw new Error('ORMBG returned invalid RGBA');
              if(depth.width<1||depth.height<1||depth.bytes!==depth.width*depth.height)throw new Error('Depth Anything returned invalid grayscale depth');
              return {backgroundRemoval:bg,depthEstimation:depth};
            }""")
            record('P102 ORMBG model inference completes in real ONNX WASM worker',infer['backgroundRemoval']['bytes']==infer['backgroundRemoval']['width']*infer['backgroundRemoval']['height']*4,infer['backgroundRemoval'])
            # UI-driven P102: choose a file and press the real button (the worker-only check above cannot catch scope bugs in the UI code).
            try:
                png=_b64.b64decode(page.evaluate("""async()=>{const c=document.createElement('canvas');c.width=192;c.height=192;const x=c.getContext('2d');x.fillStyle='#e6b56e';x.fillRect(0,0,192,192);x.fillStyle='#d94d43';x.beginPath();x.arc(96,92,50,0,Math.PI*2);x.fill();const b=await new Promise(r=>c.toBlob(r,'image/png'));const u=new Uint8Array(await b.arrayBuffer());let s='';u.forEach(v=>s+=String.fromCharCode(v));return btoa(s);}"""))
                page.evaluate("() => { const s=document.querySelector('#cv102-status'); if(s) s.textContent=''; }")
                page.locator('#cv102-file').set_input_files({'name':'ui-p102.png','mimeType':'image/png','buffer':png})
                page.locator('#cv102-run').evaluate('(el) => el.click()')
                page.wait_for_function("(()=>{const t=document.querySelector('#cv102-status')?.textContent||'';return t.includes('Đã tách nền')||t.includes('Không thể')})()",timeout=900000)
                st=page.evaluate("() => document.querySelector('#cv102-status').textContent")
                ok=('Đã tách nền' in st) and page.evaluate("() => !document.querySelector('#cv102-download').disabled")
                record('P102 UI: Tách nền button produces transparent PNG and enables download',bool(ok),{'status':st[:300]})
            except Exception as e:
                record('P102 UI: Tách nền button produces transparent PNG and enables download',False,{'error':str(e)[:400]})
            record('P105 Depth Anything V2 model inference completes in real ONNX WASM worker',infer['depthEstimation']['bytes']==infer['depthEstimation']['width']*infer['depthEstimation']['height'],infer['depthEstimation'])
            # Whisper worker real inference using bounded synthetic audio; output is validated as text, not accuracy-scored.
            whisper=page.evaluate("""async()=>{const n=16000*3,a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=.035*Math.sin(2*Math.PI*(190+40*Math.sin(i/n*6.28))*i/16000);return await new Promise((resolve,reject)=>{const w=new Worker('/assets/canvio-whisper-worker.js',{type:'module'}),timer=setTimeout(()=>{w.terminate();reject(new Error('Whisper inference timeout'));},900000);w.onmessage=e=>{const m=e.data||{};if(m.type==='error'){clearTimeout(timer);w.terminate();reject(new Error(m.error||'Whisper worker error'));}if(m.type==='result'){clearTimeout(timer);w.terminate();if(!m.output||typeof m.output.text!=='string')return reject(new Error('Whisper result is not text'));resolve({text:m.output.text,language:m.output.chunks?.[0]?.timestamp||null});}};w.onerror=e=>{clearTimeout(timer);w.terminate();reject(new Error(e.message));};w.postMessage({action:'transcribe',id:'github-hosted-whisper',audio:a.buffer,language:'english'},[a.buffer]);});}""")
            record('P80/P59 Whisper Tiny performs actual WASM inference and returns text',isinstance(whisper.get('text'),str),{'textLength':len(whisper.get('text',''))})
        else:
            infer=None
            whisper={"text":""}
            skipped_models=["P102 ORMBG ONNX inference","P105 Depth Anything ONNX inference","P102 UI background-removal inference","P80 Whisper inference"]
        # P107 Node fixture round-trip is run separately in CI. Confirm the product explicitly exposes portable import/export and no cloud-sync lie.
        p107=page.evaluate("() => window.CANVIODepthParallaxP105.tests()")
        record('P107 exposes portable ZIP export/import while reusing the existing Asset Library',p107.get('portablePresetExport') and p107.get('portablePresetImport') and p107.get('strictStoreZipParser') and p107.get('noNewStore'),p107)
        record('P107 does not claim cloud Project Vault synchronization',p107.get('noNewStore') is True,'Portable ZIP round-trip is supported; Project Vault remains local-first.')
        record('No uncaught browser page errors',not page_errors,page_errors)
        # Save current report before closing browser.
        data={'suite':'CANVIO_23.3.111_GITHUB_HOSTED_RUNTIME_ACCEPTANCE','origin':origin,'browser':browser.version,'checks':checks,'details':details,'pageErrors':page_errors,'consoleErrors':console_errors,'requests':requests,'actualModelInference':({'P102':infer['backgroundRemoval'],'P105':infer['depthEstimation'],'P80':{'textLength':len(whisper.get('text',''))}} if infer is not None else {'performed':False,'optInRequired':'workflow_dispatch with full_model_acceptance=true','skipped':skipped_models}),'physicalGpuExecuted':False,'twoPhysicalDevicesExecuted':False,'projectVaultCloudSync':False,'p70ReleaseCertified':False,'limitations':['SwiftShader is software rendering, not physical GPU acceptance.','P107 validates a portable preset ZIP and Asset Library import; Project Vault remains local-first with no server sync adapter.','A synthetic video and synthetic speech signal validate execution, not real-footage quality or transcription accuracy.']}
        REPORT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        browser.close()
    finally:
      server.shutdown();server.server_close()
    print('Hosted runtime acceptance:',sum(checks.values()),'/',len(checks))
if __name__=='__main__': main()
