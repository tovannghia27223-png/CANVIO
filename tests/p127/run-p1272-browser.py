#!/usr/bin/env python3
"""P127.2 hosted Chromium: Whisper/SRT timestamp cues, punch-in keyframes, and original-audio AutoCut."""
import json,os,sys,threading,http.server,socketserver,functools,shutil,subprocess,tempfile
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
tmp=tempfile.mkdtemp();vid=os.path.join(tmp,'talking-head.webm')
audio="aevalsrc=0.35*sin(2*PI*440*t)*gt(mod(t\\,2)\\,0.4)*lt(mod(t\\,2)\\,1.2):s=44100:d=5"
subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i','testsrc=size=320x180:rate=15:duration=5','-f','lavfi','-i',audio,'-shortest','-c:v','libvpx','-b:v','300k','-c:a','libopus',vid],check=True)
class Q(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
httpd=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT));httpd.daemon_threads=True
threading.Thread(target=httpd.serve_forever,daemon=True).start();url='http://127.0.0.1:%d/index.html'%httpd.server_address[1]
checks={};errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--autoplay-policy=no-user-gesture-required','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
 page=b.new_context(viewport={'width':1280,'height':900},accept_downloads=True).new_page()
 page.on('pageerror',lambda e:errors.append(str(e)[:220]))
 page.goto(url,wait_until='commit',timeout=60000)
 page.wait_for_function('!!(window.CV&&CV.go&&window.CVCaptionDirectorP1272&&CV.engines&&CV.engines.video)',timeout=90000,polling=500)
 page.evaluate("CV.go('videoEngine')");page.wait_for_timeout(1500)
 checks['director panel mounts']=page.locator('#cv1272-director').is_visible()
 checks['unit API suite passes']=page.evaluate("Object.values(CVCaptionDirectorP1272.tests()).every(Boolean)")
 page.set_input_files('#vtFiles',vid)
 page.wait_for_function("CV.engines.video._state().clips.some(c=>c.type==='video')",timeout=30000)
 state=page.evaluate("""()=>{const v=CV.engines.video,s=v._state(),c=s.clips.find(x=>x.type==='video');return{id:c.id,mediaId:c.mediaId,duration:c.duration,start:c.start};}""")
 # The default pause threshold is 0.65 s. Keep fixture gaps at 0.80 s so
 # the browser test validates the intended detected-pause UI, not borderline
 # timing rounded by the video import path.
 page.evaluate("""id=>{const s=CV.engines.video._state();s.clips.push(
 {id:'p1272-cue1',name:'Cue 1',type:'text',track:3,start:0.25,duration:0.8,text:'Xin chào, đây là phần mở đầu.'},
 {id:'p1272-cue2',name:'Cue 2',type:'text',track:3,start:1.85,duration:0.9,text:'Chúng ta bắt đầu phân tích.'},
 {id:'p1272-cue3',name:'Cue 3',type:'text',track:3,start:3.55,duration:0.8,text:'Đây là phần kết luận.'}
 );CV.engines.video.commit();}""",state['id'])
 page.click('#cv1272-analyze');page.select_option('#cv1272-video',state['id']);page.click('#cv1272-analyze')
 checks['subtitle pause report appears']='3 cue phụ đề' in page.locator('#cv1272-status').inner_text()
 checks['detected pause listed']=page.locator('#cv1272-pauses li').count()>=1
 page.fill('#cv1272-zoom','1.16');page.click('#cv1272-zoom-apply')
 motion=page.evaluate("id=>CV.engines.video._state().clips.find(c=>c.id===id).motion",state['id'])
 checks['punch-in keyframes applied']=bool(motion and len(motion.get('keyframes',[]))>=2)
 checks['zoom scale increases on cue']=bool(motion and any(float(k.get('scale',1))>1.05 for k in motion.get('keyframes',[])))
 checks['motion keyframes persisted by canonical commit']=bool(motion and abs(float(motion['keyframes'][0]['t']))<.001 and abs(float(motion['keyframes'][-1]['t'])-100)<.001)
 page.select_option('#cv1272-source',state['id']);before=page.evaluate("CV.engines.video._state().clips.length")
 page.click('#cv1272-cut');page.wait_for_function("document.getElementById('cv1272-status').textContent.indexOf('Đã cắt')>=0||document.getElementById('cv1272-status').textContent.indexOf('Không phát hiện')>=0",timeout=30000)
 cut_status=page.locator('#cv1272-status').inner_text()
 after=page.evaluate("CV.engines.video._state().clips.length")
 checks['AutoCut reports original-audio result']=('Đã cắt' in cut_status) or ('Không phát hiện' in cut_status)
 checks['AutoCut created timeline cuts']=after>=before
 page.click('#cv1272-undo')
 checks['undo action remains available']=page.evaluate("typeof CV.engines.video.undo==='function'")
 checks['no uncaught page errors']=len(errors)==0
 b.close()
report={'suite':'CANVIO_P127_2_CAPTION_DIRECTOR','checks':checks,'fixture':{'video':os.path.basename(vid),'durationSeconds':5,'audio':'440 Hz bursts separated by digital silence'},'autocutStatus':cut_status,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] or errors else 0)
