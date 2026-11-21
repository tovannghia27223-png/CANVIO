#!/usr/bin/env python3
"""P134.2: same-origin Chromium UI analysis/export smoke; inspect output with ffprobe and decode fully."""
import functools,http.server,json,math,os,re,shutil,socketserver,subprocess,sys,tempfile,threading
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
        # WebM duration/frame-rate metadata is inconsistent across Chromium/ffprobe:
        # r_frame_rate may report 60/1 while captured canvas video is ~30 fps.
        # Use packet presentation timestamps before any nominal-FPS fallback.
        packet_probe=subprocess.run([FFPROBE,'-v','error','-select_streams','v:0','-show_packets','-show_entries','packet=pts_time,duration_time','-of','json',str(out)],check=True,capture_output=True,text=True)
        video_packets=json.loads(packet_probe.stdout).get('packets',[])
        packet_pts=[]
        packet_durations=[]
        for packet in video_packets:
            try:
                pts=float(packet.get('pts_time'))
                if math.isfinite(pts):packet_pts.append(pts)
            except (TypeError,ValueError):pass
            try:
                duration=float(packet.get('duration_time'))
                if math.isfinite(duration) and duration>0:packet_durations.append(duration)
            except (TypeError,ValueError):pass
        packet_pts.sort()
        pts_deltas=[packet_pts[k]-packet_pts[k-1] for k in range(1,len(packet_pts)) if packet_pts[k]>packet_pts[k-1]]
        ordered_deltas=sorted(pts_deltas)
        median_frame_interval=ordered_deltas[len(ordered_deltas)//2] if ordered_deltas else 0
        ordered_durations=sorted(packet_durations)
        final_packet_duration=ordered_durations[len(ordered_durations)//2] if ordered_durations else median_frame_interval
        metadata_durations=[]
        try:
            value=float(fmt.get('duration',0) or 0)
            if math.isfinite(value) and value>0:metadata_durations.append(value)
        except (TypeError,ValueError):pass
        for stream in streams:
            try:
                value=float(stream.get('duration',0) or 0)
                if math.isfinite(value) and value>0:metadata_durations.append(value)
            except (TypeError,ValueError):pass
        measured=max(metadata_durations) if metadata_durations else 0
        if measured<=0 and len(packet_pts)>=2:
            measured=(packet_pts[-1]-packet_pts[0])+final_packet_duration
        if measured<=0:
            # Last resort only: exporter uses canvas.captureStream(30).
            video_meta=next((s for s in streams if s.get('codec_type')=='video'),{})
            try:count=int(video_meta.get('nb_read_frames',0) or 0)
            except (TypeError,ValueError):count=0
            measured=count/30 if count else 0
        checks['durationWithinTolerance']=3.5<=measured<=4.5
        checks['outputPreviewShown']=page.locator('#cv134r-result').evaluate("e => e.style.display !== 'none'")
        checks['localOnlyNoNetwork']=page.evaluate("() => window.CVAutoReframeP134.tests().noNetwork && window.CVAutoReframeP134.tests().noTimelineMutation")
        browser.close()
    server.shutdown()
    result={'checks':checks,'downloadBytes':out.stat().st_size if out.exists() else 0,'videoStream':video,'audioStream':audio,'measuredDurationSeconds':measured,'videoPacketCount':len(video_packets),'firstVideoPts':packet_pts[0] if packet_pts else None,'lastVideoPts':packet_pts[-1] if packet_pts else None,'medianFrameIntervalSeconds':median_frame_interval,'formatMetadata':fmt,'pageErrors':errors,'planSummary':details.get('plan',''),'failed':[k for k,v in checks.items() if not v]+(['pageErrors'] if errors else [])}
    print(json.dumps(result,ensure_ascii=False,indent=2));sys.exit(1 if result['failed'] else 0)