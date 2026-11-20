#!/usr/bin/env python3
"""P125.4 hosted Chromium: downloads split-asset ZIP, validates its entries and opens it offline."""
import json,os,sys,threading,http.server,socketserver,functools,shutil,subprocess,tempfile,zipfile
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
tmp=tempfile.mkdtemp();vid=os.path.join(tmp,'story.webm')
subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i','testsrc=size=320x180:rate=15:duration=3','-c:v','libvpx','-b:v','300k',vid],check=True)
class Q(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
httpd=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT));httpd.daemon_threads=True
threading.Thread(target=httpd.serve_forever,daemon=True).start();url='http://127.0.0.1:%d/index.html'%httpd.server_address[1]
checks={};errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
 ctx=b.new_context(viewport={'width':1000,'height':700},reduced_motion='reduce',accept_downloads=True)
 page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)[:200]))
 page.goto(url,wait_until='commit',timeout=60000)
 page.wait_for_function('!!(window.CV&&CV.go&&window.CVScrollFramesP125&&window.CVScrollStoryboardP1252&&window.CVZip)',timeout=90000,polling=500)
 page.evaluate("CV.go('webEngine')");page.wait_for_timeout(1200)
 page.set_input_files('#cv125-file',vid);page.fill('#cv125-n','20');page.fill('#cv125-w','320');page.select_option('#cv125-preset','hero');page.click('#cv125-run')
 page.wait_for_function("document.querySelector('#cv1252-editor')&&document.querySelector('#cv1252-editor').style.display==='block'",timeout=90000)
 checks['ZIP export control appears after extraction']=page.locator('#cv1252-zip').is_visible() and not page.locator('#cv1252-zip').is_disabled()
 with page.expect_download(timeout=90000) as d:page.click('#cv1252-zip')
 zpath=os.path.join(tmp,'storyboard.zip');d.value.save_as(zpath)
 checks['download status reports split image assets']='ảnh rời' in page.locator('#cv125-out').inner_text()
 with zipfile.ZipFile(zpath,'r') as z:
  names=z.namelist();manifest=json.loads(z.read('CANVIO-STORYBOARD-MANIFEST.json').decode('utf-8'));html=z.read('index.html').decode('utf-8')
  frame_names=[n for n in names if n.startswith('frames/')]
  checks['ZIP integrity passes']=z.testzip() is None
  checks['index manifest and README included']=all(n in names for n in ['index.html','CANVIO-STORYBOARD-MANIFEST.json','README.md'])
  checks['frame assets stored separately']=len(frame_names)==manifest['frameCount']>=2
  checks['HTML references relative frame files']='frames/frame-001.' in html and 'data:image/' not in html
  checks['manifest records split package and size']=manifest['embeddedHtml'] is False and manifest['encodedFrameBytes']<=8*1024*1024
  sig_ok=True
  for name in frame_names:
   data=z.read(name)
   if name.endswith('.jpg'):sig_ok=sig_ok and data.startswith(bytes([255,216,255]))
   elif name.endswith('.webp'):sig_ok=sig_ok and data[:4]==b'RIFF' and data[8:12]==b'WEBP'
   elif name.endswith('.png'):sig_ok=sig_ok and data.startswith(bytes([137,80,78,71,13,10,26,10]))
   else:sig_ok=False
  checks['every image payload matches its extension']=sig_ok
  extracted=os.path.join(tmp,'extracted');z.extractall(extracted)
 c=b.new_context(viewport={'width':800,'height':500},reduced_motion='no-preference');pg=c.new_page();pg.on('pageerror',lambda e:errors.append(str(e)[:200]))
 pg.goto('file://'+os.path.join(extracted,'index.html'));pg.wait_for_function('window.__scrollFrames&&window.__scrollFrames.count>=2',timeout=20000)
 pg.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)')
 pg.wait_for_function('window.__scrollFrames&&window.__scrollFrames.current()===window.__scrollFrames.count-1',timeout=15000)
 pg.wait_for_function('window.__scrollFrames&&window.__scrollFrames.ready(window.__scrollFrames.count-1)',timeout=20000)
 checks['split asset package opens and scrolls offline']=pg.evaluate('__scrollFrames.current()')==manifest['frameCount']-1
 checks['last relative frame image is decoded offline']=pg.evaluate('__scrollFrames.ready(__scrollFrames.count-1)') is True
 checks['no uncaught page errors']=len(errors)==0
 b.close()
report={'suite':'CANVIO_P125_4_SPLIT_ASSET_PACKAGE','checks':checks,'manifest':manifest,'zipBytes':os.path.getsize(zpath),'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] or errors else 0)
