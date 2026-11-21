#!/usr/bin/env python3
"""P134.2: same-origin Chromium UI analysis/export smoke; inspect output with ffprobe and decode fully."""
import functools,http.server,json,os,re,shutil,socketserver,subprocess,sys,tempfile,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
FFMPEG=shutil.which('ffmpeg');FFPROBE=shutil.which('ffprobe')
if not CHROME or not FFMPEG or not FFPROBE: raise SystemExit('P134.2 browser test requires Chromium, ffmpeg and ffprobe')
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_): pass
with tempfile.TemporaryDirectory(prefix='canvio-p134r-') as td:
    tmp=Path(td);fixture=tmp/'moving-subject.webm'
    for fi in range(20):
        pixels=bytearray(640*360*3);x0=20+fi*26
        for y in range(125,215):
            row=y*640*3
            for x in range(x0,x0+90):
                p=row+x*3;pixels[p:p+3]=b'\xff\xff\xff'
        (tmp/('frame-%03d.ppm'%fi)).write_bytes(b'P6\n640 360\n255\n'+pixels)
    cmd=[FFMPEG,'-hide_banner','-loglevel','error','-y','-framerate','5','-i',str(tmp/'frame-%03d.ppm'),
         '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=4',
         '-c:v','libvpx','-deadline','realtime','-cpu-used','8','-b:v','700k','-c:a','libopus','-shortest',str(fixture)]
    subprocess.run(cmd,check=True,capture_output=True)
    server=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT)));server.daemon_threads=True
    threading.Thread(target=server.serve_forever,daemon=True).start()
    checks={};errors=[];video={};audio={};details={}
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
        page=browser.new_context(viewport={'width':1280,'height':900},reduced_motion='reduce',accept_downloads=True).new_page()
        page.on('pageerror',lambda e:errors.append(str(e)[:300]))
        page.goto('http://127.0.0.1:%d/index.html'%server.server_address[1],wait_until='commit',timeout=60000)
        page.wait_for_function('!!(window.CV && CV.go && window.CVAutoReframeP134)',timeout=90000,polling=500)
        page.evaluate("CV.go('videoEngine')");page.wait_for_selector('#cv134r-panel',timeout=30000)
        checks['panelMounted']=page.locator('#cv134r-panel').count()==1
        page.set_input_files('#cv134r-file',str(fixture))
        page.wait_for_function("!!(document.querySelector('#cv134r-analyze') && !document.querySelector('#cv134r-analyze').disabled)",timeout=20000)
        page.click('#cv134r-analyze')
        page.wait_for_function("document.querySelector('#cv134r-status').textContent.includes('Đã phân tích')",timeout=60000)
        checks['analysisCompleted']=True;checks['exportEnabledAfterAnalysis']=page.locator('#cv134r-export').is_enabled()
        details=page.evaluate("() => ({plan:document.querySelector('#cv134r-status').textContent})")
        focus=re.search(r'dịch từ (\d+)% đến (\d+)%',details['plan'])
        checks['movingSubjectTracked']=bool(focus and int(focus.group(2))-int(focus.group(1))>=15)
        page.click('#cv134r-export')
        page.wait_for_function("document.querySelector('#cv134r-status').textContent.includes('Đã xuất WebM')",timeout=90000)
        with page.expect_download(timeout=30000) as event:
            page.click('#cv134r-download')
        download=event.value;out=tmp/'reframed.webm';download.save_as(str(out))
        checks['downloadCreated']=out.exists() and out.stat().st_size>10000
        probe=subprocess.run([FFPROBE,'-v','error','-count_frames','-show_entries','stream=codec_type,codec_name,width,height,duration,nb_read_frames,avg_frame_rate,r_frame_rate:format=duration','-of','json',str(out)],check=True,capture_output=True,text=True)
        probe_data=json.loads(probe.stdout)
        streams=probe_data.get('streams',[])
        video=next((s for s in streams if s.get('codec_type')=='video'),{});audio=next((s for s in streams if s.get('codec_type')=='audio'),{})
        checks['videoStreamDecodes']=video.get('codec_type')=='video' and video.get('width')==720 and video.get('height')==1280
        checks['audioPreserved']=bool(audio)
        decode=subprocess.run([FFMPEG,'-v','error','-i',str(out),'-f','null','-'],capture_output=True,text=True)
        checks['fullDecode']=decode.returncode==0
        fmt=probe_data.get('format',{})
        def stream_duration(stream):
            try:
                if float(stream.get('duration',0))>0:return float(stream['duration'])
            except (TypeError,ValueError):pass
            try:
                rates=[stream.get('avg_frame_rate','0/1'),stream.get('r_frame_rate','0/1')]
                fps=0
                for value in rates:
                    rate=value.split('/')
                    candidate=float(rate[0])/max(float(rate[1]),1e-9)
                    if candidate>0:
                        fps=candidate
                        break
                # Canvas.captureStream(FPS) requests a 30 fps track; Chromium may report 0/0 for WebM.
                if fps<=0 and stream.get('codec_type')=='video':
                    fps=30
                return int(stream.get('nb_read_frames',0))/fps if fps>0 else 0
            except (TypeError,ValueError,ZeroDivisionError):return 0
        measured=max([float(fmt.get('duration',0) or 0)]+[stream_duration(s) for s in streams])
        checks['durationWithinTolerance']=3.5<=measured<=4.5
        checks['outputPreviewShown']=page.locator('#cv134r-result').evaluate("e => e.style.display !== 'none'")
        checks['localOnlyNoNetwork']=page.evaluate("() => window.CVAutoReframeP134.tests().noNetwork && window.CVAutoReframeP134.tests().noTimelineMutation")
        browser.close()
    server.shutdown()
    result={'checks':checks,'downloadBytes':out.stat().st_size if out.exists() else 0,'videoStream':video,'audioStream':audio,'measuredDurationSeconds':measured,'formatMetadata':fmt,'pageErrors':errors,'planSummary':details.get('plan',''),'failed':[k for k,v in checks.items() if not v]+(['pageErrors'] if errors else [])}
    print(json.dumps(result,ensure_ascii=False,indent=2));sys.exit(1 if result['failed'] else 0)