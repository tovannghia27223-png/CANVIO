#!/usr/bin/env python3
"""P145.4 hosted Chrome: synthesize all moods, check output, loop preview, WAV and canonical timeline import."""
import json,os,sys,threading,http.server,socketserver,functools,shutil,subprocess,tempfile
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
httpd=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT));httpd.daemon_threads=True
threading.Thread(target=httpd.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%httpd.server_address[1]
checks={};errors=[];tmp=tempfile.mkdtemp()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--autoplay-policy=no-user-gesture-required','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
 page=b.new_context(viewport={'width':1280,'height':900},accept_downloads=True).new_page()
 page.on('pageerror',lambda e:errors.append(str(e)[:220]))
 page.goto(url,wait_until='commit',timeout=60000)
 page.wait_for_function('!!(window.CV && CV.go && window.CVMusicComposerP1454)',timeout=90000,polling=500)
 page.evaluate("CV.go('videoEngine')");page.wait_for_timeout(1500)
 checks['composer panel mounts']=page.evaluate("!!document.getElementById('cv1454-music')")
 checks['module unit suite']=page.evaluate("Object.values(CVMusicComposerP1454.tests()).every(Boolean)")
 data=page.evaluate("""async()=>{const out={};for(const mood of Object.keys(CVMusicComposerP1454.moods)){const r=await CVMusicComposerP1454.render(mood,{bpm:96,bars:4,seed:23});let peak=0,rms=0;for(const x of r.samples){peak=Math.max(peak,Math.abs(x));rms+=x*x;}out[mood]={duration:r.duration,peak,rms:Math.sqrt(rms/r.samples.length),bytes:r.wav.length,head:Array.from(r.wav.slice(0,12))};}return out;}""")
 checks['all moods render non-silent']=all(x['rms']>.003 for x in data.values())
 checks['normalized peak within bounds']=all(.85<x['peak']<=.9 for x in data.values())
 checks['duration matches 4 bars at 96 BPM']=all(abs(x['duration']-10)<.05 for x in data.values())
 checks['moods are distinct']=len({tuple(x['head']) for x in data.values()})==1 and len({x['rms'] for x in data.values()})>1
 page.select_option('#cv1454-mood','calm');page.fill('#cv1454-bpm','90');page.select_option('#cv1454-bars','4')
 before=page.evaluate("CV.engines.video._state().clips.length")
 page.click('#cv1454-add');page.wait_for_timeout(1300)
 checks['generated WAV imports to canonical timeline']=page.evaluate("CV.engines.video._state().clips.length")>=before+1 and page.evaluate("CV.engines.video._state().clips.filter(c=>c.type==='audio').length")>=1
 with page.expect_download(timeout=20000) as dl:page.click('#cv1454-download')
 wavpath=os.path.join(tmp,'music.wav');dl.value.save_as(wavpath)
 r=subprocess.run(['ffprobe','-v','error','-show_entries','stream=codec_name,sample_rate,channels,duration','-of','json',wavpath],capture_output=True,text=True)
 stream=json.loads(r.stdout or '{}').get('streams',[{}])[0]
 checks['WAV decodes as PCM 44.1 kHz mono']=stream.get('codec_name')=='pcm_s16le' and stream.get('sample_rate')=='44100' and stream.get('channels')==1
 page.click('#cv1454-preview');page.wait_for_timeout(500)
 checks['loop preview enters playing state']=page.locator('#cv1454-status').inner_text().startswith('Đang phát loop')
 page.click('#cv1454-stop');checks['stop ends preview']=page.locator('#cv1454-status').inner_text()=='Đã dừng loop.'
 checks['no uncaught page errors']=len(errors)==0
 b.close()
report={'suite':'CANVIO_P145_4_LOCAL_MUSIC_COMPOSER','checks':checks,'render':{k:{'duration':round(v['duration'],3),'peak':round(v['peak'],4),'rms':round(v['rms'],4),'wavBytes':v['bytes']} for k,v in data.items()},'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] else 0)