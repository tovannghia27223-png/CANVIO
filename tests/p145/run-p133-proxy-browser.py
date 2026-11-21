#!/usr/bin/env python3
"""P133.2 Chromium acceptance: import a 4K synthetic clip, create 720p proxy, verify WebM streams and timeline import."""
import functools,http.server,json,os,shutil,socketserver,subprocess,sys,tempfile,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
FFMPEG=shutil.which('ffmpeg');FFPROBE=shutil.which('ffprobe')
if not CHROME or not FFMPEG or not FFPROBE: raise SystemExit('P133.2 requires Chromium, ffmpeg and ffprobe')
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
with tempfile.TemporaryDirectory(prefix='canvio-p133p-') as td:
    tmp=Path(td);fixture=tmp/'p133-proxy-fixture.webm'
    subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-f','lavfi','-i','testsrc2=size=3840x2160:rate=5:duration=3','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=3','-c:v','libvpx','-deadline','realtime','-cpu-used','8','-b:v','1500k','-c:a','libopus','-shortest',str(fixture)],check=True,capture_output=True)
    server=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT)));server.daemon_threads=True
    threading.Thread(target=server.serve_forever,daemon=True).start()
    checks={};errors=[];out=tmp/'proxy.webm';details={}
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
        context=browser.new_context(viewport={'width':1280,'height':900},reduced_motion='reduce',accept_downloads=True)
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)[:300]))
        page.route('**/p133-proxy-fixture.webm',lambda route:route.fulfill(path=str(fixture),content_type='video/webm'))
        page.goto('http://127.0.0.1:%d/index.html'%server.server_address[1],wait_until='commit',timeout=60000)
        page.wait_for_function('!!(window.CV&&CV.go&&window.CVProxyP133&&CV.engines&&CV.engines.video)',timeout=90000,polling=500)
        page.evaluate("CV.go('videoEngine')");page.wait_for_selector('#cv133p-panel',timeout=30000)
        checks['panelMounted']=page.locator('#cv133p-panel').count()==1
        before=page.evaluate("""async()=>{const r=await fetch('/p133-proxy-fixture.webm');const b=await r.blob();const f=new File([b],'4k-source.webm',{type:'video/webm'});const v=CV.engines.video;v.importFiles({target:{files:[f],value:''}});return true}""")
        page.wait_for_function("!!(CV.engines.video._state().clips||[]).some(c=>c.type==='video')",timeout=30000)
        selected=page.evaluate("""()=>{const s=CV.engines.video._state();const c=s.clips.filter(x=>x.type==='video').slice(-1)[0];s.selected=c.id;return{name:c.name,id:c.id,clipCount:s.clips.length}}""")
        checks['4kSourceImported']=bool(selected.get('id'))
        page.click('#cv133p-run')
        page.wait_for_function("document.querySelector('#cv133p-status').textContent.includes('Đã thêm')",timeout=90000)
        checks['proxyGeneratedAndImported']=True
        details=page.evaluate("""()=>{const clips=CV.engines.video._state().clips;const original=clips.find(c=>c.name==='4k-source.webm');const proxy=clips.find(c=>/proxy-720p\\.webm$/i.test(c.name||''));return{status:document.querySelector('#cv133p-status').textContent,count:clips.length,original:!!original,proxy:!!proxy,proxyDuration:proxy&&proxy.duration,renderPath:CVProxyP133.getLastRenderPath()}}""")
        checks['offscreenCanvasWorkerUsed']=details['renderPath']=='offscreen-worker'
        checks['workerFallbackIsAvailable']=page.evaluate("CVProxyP133.tests().offscreenWorkerHasSafeFallback && CVProxyP133.tests().offscreenScalerIsSelfContained")
        checks['timelineHasOriginalAndProxy']=details['count']>=selected['clipCount']+1 and details['original'] and details['proxy']
        checks['proxyDurationMatchesMedia']=details['proxyDuration'] is not None and abs(float(details['proxyDuration'])-3.0)<=0.5
        with page.expect_download(timeout=30000) as event:page.click('#cv133p-download')
        event.value.save_as(str(out))
        checks['downloadCreated']=out.exists() and out.stat().st_size>10000
        probe=subprocess.run([FFPROBE,'-v','error','-show_entries','stream=codec_type,codec_name,width,height:format=duration','-of','json',str(out)],check=True,capture_output=True,text=True)
        data=json.loads(probe.stdout);streams=data.get('streams',[])
        video=next((s for s in streams if s.get('codec_type')=='video'),{});audio=next((s for s in streams if s.get('codec_type')=='audio'),{})
        checks['720pDimensions']=video.get('codec_type')=='video' and video.get('width')==1280 and video.get('height')==720
        checks['audioPreserved']=audio.get('codec_type')=='audio'
        decode=subprocess.run([FFMPEG,'-v','error','-i',str(out),'-f','null','-'],capture_output=True,text=True)
        checks['fullDecode']=decode.returncode==0
        checks['originalUntouched']=page.evaluate("()=>CV.engines.video._state().clips.some(c=>c.name==='4k-source.webm')")
        checks['noPageErrors']=not errors
        browser.close()
    server.shutdown()
    result={'suite':'P133.2 4K-to-720p proxy Chromium acceptance','checks':checks,'selectedSource':selected,'timelineDetails':details,'downloadBytes':out.stat().st_size if out.exists() else 0,'videoStream':video,'audioStream':audio,'status':details.get('status',''),'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
    print(json.dumps(result,ensure_ascii=False,indent=2));sys.exit(1 if result['failed'] else 0)