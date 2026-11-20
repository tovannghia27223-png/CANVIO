#!/usr/bin/env python3
"""P125.2 hosted Chrome: storyboard extraction, caption editing, parallax/easing export and scroll runtime."""
import json,os,sys,threading,http.server,socketserver,functools,shutil,subprocess,tempfile
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
 page.wait_for_function('!!(window.CV&&CV.go&&window.CVScrollFramesP125&&window.CVScrollStoryboardP1252)',timeout=90000,polling=500)
 page.evaluate("CV.go('webEngine')");page.wait_for_timeout(1500)
 checks['P125.2 editor module and P125.1 card mounted']=page.evaluate("!!document.querySelector('#cv125-card')&&!!window.CVScrollStoryboardP1252")
 checks['unit API tests pass']=page.evaluate("Object.values(CVScrollStoryboardP1252.tests()).every(Boolean)")
 page.set_input_files('#cv125-file',vid);page.fill('#cv125-n','20');page.fill('#cv125-w','320');page.select_option('#cv125-preset','hero');page.click('#cv125-run')
 page.wait_for_function("document.querySelector('#cv1252-editor')&&document.querySelector('#cv1252-editor').style.display==='block'",timeout=90000)
 checks['frame extraction opens storyboard editor']=page.locator('#cv1252-editor').is_visible()
 checks['caption markers created from preset']=page.locator('#cv1252-captions .cv1252-row').count()==3
 page.click('#cv1252-add');checks['add caption marker works']=page.locator('#cv1252-captions .cv1252-row').count()==4
 row=page.locator('#cv1252-captions .cv1252-row').nth(0)
 row.locator('input[type=text]').fill('Tiêu đề CANVIO')
 row.locator('select').nth(0).select_option('top')
 row.locator('select').nth(1).select_option('zoom')
 page.locator('#cv1252-parallax').evaluate("(el)=>{el.value='12';el.dispatchEvent(new Event('input',{bubbles:true}))}")
 page.select_option('#cv1252-easing','ease-out')
 page.locator('#cv1252-progress').evaluate("(el)=>{el.value='12';el.dispatchEvent(new Event('input',{bubbles:true}))}")
 checks['preview reflects caption text']=page.locator('#cv1252-preview-caption').inner_text()=='Tiêu đề CANVIO'
 with page.expect_download(timeout=90000) as d:page.click('#cv1252-export')
 path=os.path.join(tmp,'storyboard.html');d.value.save_as(path);html=open(path,encoding='utf-8').read()
 checks['export contains parallax/easing settings']='PARALLAX=12,EASING="ease-out"' in html
 checks['export contains caption position/animation']='"position":"top","animation":"zoom"' in html
 checks['export has no external requests']='https://' not in html and 'http://' not in html
 c=b.new_context(viewport={'width':800,'height':500},reduced_motion='no-preference');pg=c.new_page();pg.on('pageerror',lambda e:errors.append(str(e)[:200]));pg.goto('file://'+path);pg.wait_for_function('window.__scrollFrames',timeout=15000)
 pg.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');pg.wait_for_timeout(600)
 checks['scroll reaches last frame']=pg.evaluate('__scrollFrames.current()')==19
 pg.evaluate('window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*.5)');pg.wait_for_timeout(600)
 mid=pg.evaluate('__scrollFrames.current()');checks['eased scroll reaches expected middle-late frame']=12<=mid<=17
 pg.evaluate('window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*.1)');pg.wait_for_timeout(500)
 checks['caption position/animation reaches exported page']=pg.evaluate("document.getElementById('cap').dataset.pos==='top'&&document.getElementById('cap').dataset.anim==='zoom'")
 c2=b.new_context(viewport={'width':800,'height':500},reduced_motion='reduce');pg2=c2.new_page();pg2.goto('file://'+path);pg2.wait_for_function('window.__scrollFrames',timeout=15000)
 pg2.evaluate('window.scrollTo(0,9999)');pg2.wait_for_timeout(300)
 checks['reduced motion stays on first frame']=pg2.evaluate('__scrollFrames.current()')==0 and pg2.evaluate('document.documentElement.scrollHeight')<=760
 checks['no uncaught page errors']=len(errors)==0
 b.close()
report={'suite':'CANVIO_P125_2_SCROLL_STORYBOARD','checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] or errors else 0)