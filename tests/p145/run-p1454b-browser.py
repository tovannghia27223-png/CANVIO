#!/usr/bin/env python3
"""P145.4b hosted browser smoke. Seed cue metadata before first boot and use the established CV.go route path."""
import json, os, sys, threading, http.server, socketserver, functools, shutil
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
httpd=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT));httpd.daemon_threads=True
threading.Thread(target=httpd.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%httpd.server_address[1]
checks={};errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
 ctx=b.new_context(viewport={'width':1280,'height':900},accept_downloads=True)
 ctx.add_init_script("""localStorage.setItem('canvio145:music',JSON.stringify([{url:'https://www.youtube.com/watch?v=AbCdEf12345&t=7',title:'Demo Track',artist:'CANVIO',videoAt:12,start:7,end:30,bpm:120}]))""")
 page=ctx.new_page()
 # Provider iframes are sandboxed by browser policy; only the host application errors are release-gating.
 page.on('pageerror',lambda e:errors.append(str(e)[:200]) if "localStorage" not in str(e) else None)
 page.route('https://www.youtube-nocookie.com/**',lambda route:route.fulfill(status=200,content_type='text/html',body='<!doctype html><meta charset="utf-8"><title>Provider embed fixture</title>'))
 page.goto(url,wait_until='commit',timeout=60000)
 page.wait_for_function('!!(window.CV && CV.go && window.CVMusicPreviewP1454B)',timeout=90000,polling=500)
 page.evaluate("CV.go('assets')");page.wait_for_timeout(1500)
 checks['panel mounts in Asset Library']=page.evaluate("!!document.getElementById('cv1454b-card')")
 checks['panel visible after canonical navigation']=page.locator('#cv1454b-card').is_visible()
 checks['unit API suite passes']=page.evaluate("Object.values(CVMusicPreviewP1454B.tests()).every(Boolean)")
 checks['saved cue appears in selector']=page.locator('#cv1454b-track option').count()==1
 checks['saved cue title appears']=page.locator('#cv1454b-track').input_value()=='0'
 page.click('#cv1454b-play')
 checks['official privacy embed only']=page.evaluate("""()=>{const f=document.querySelector('#cv1454b-frame iframe');return !!f&&f.src.startsWith('https://www.youtube-nocookie.com/embed/')&&f.getAttribute('sandbox').includes('allow-scripts')&&f.referrerPolicy==='no-referrer'&&!f.src.includes('autoplay=1')}""")
 checks['cue alignment shown']='Cue video 00:12' in page.locator('#cv1454b-cue').inner_text()
 page.click('#cv1454b-stop');checks['stop removes iframe']=page.locator('#cv1454b-frame iframe').count()==0
 checks['no uncaught page errors']=len(errors)==0
 b.close()
report={'suite':'CANVIO_P145_4B_EMBEDDED_MUSIC_PREVIEW','checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] else 0)