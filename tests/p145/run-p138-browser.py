#!/usr/bin/env python3
"""P138 real-Chrome test: import a noisy WAV (tone bursts + white noise) onto the timeline, run Denoise from the UI, decode the NEW clip's media and check noise dropped while tone stayed and the original clip is untouched."""
import json, os, sys, threading, http.server, socketserver, functools, shutil
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
c = {}; errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page = b.new_context(viewport={'width': 1200, 'height': 800}, reduced_motion='reduce').new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVDenoiseP138 && window.CVSfxP145)', timeout=90000, polling=500)
    page.evaluate("CV.go('videoEngine')"); page.wait_for_timeout(1500)
    c['mounted'] = page.evaluate("!!document.getElementById('cv138-row')")
    page.click('#cv138-run'); page.wait_for_timeout(200)
    c['noSelectionMessage'] = page.evaluate("/Chọn/.test(document.getElementById('cv138-out').textContent)")
    page.evaluate("""()=>{var sr=44100,n=sr*6,x=new Float32Array(n),s=7;for(var i=0;i<n;i++){s=(s*1664525+1013904223)>>>0;var r=s/4294967296*2-1,on=Math.floor(i/(sr/2))%2===0;x[i]=(on?0.4*Math.sin(2*Math.PI*440*i/sr):0)+0.05*r}
      var f=new File([CVSfxP145.wav(x,sr)],'noisy.wav',{type:'audio/wav'});CV.engines.video.importFiles({target:{files:[f],value:''}})}""")
    page.wait_for_function("CV.engines.video._state().clips.some(c=>c.type==='audio')", timeout=15000)
    page.evaluate("var s=CV.engines.video._state();s.selected=s.clips.filter(c=>c.type==='audio')[0].id;s.clips.filter(c=>c.type==='audio')[0].duration=6")
    page.click('#cv138-run')
    page.wait_for_function("CV.engines.video._state().clips.filter(c=>c.type==='audio').length>=2", timeout=60000)
    c['statusAdded'] = page.evaluate("/khu-on/.test(document.getElementById('cv138-out').textContent)")
    c['buttonReenabled'] = page.evaluate("!document.getElementById('cv138-run').disabled")
    r = page.evaluate("""async()=>{var s=CV.engines.video._state(),a=s.clips.filter(c=>c.type==='audio'),orig=a[0],nw=a[a.length-1];
      async function dec(cl){var blob=s.fileRefs&&s.fileRefs[cl.mediaId||cl.id];if(!blob)return null;var ab=await blob.arrayBuffer(),ctx=new OfflineAudioContext(1,1,44100),buf=await new Promise((ok,no)=>ctx.decodeAudioData(ab,ok,no));return buf.getChannelData(0)}
      var A=await dec(orig),B=await dec(nw);if(!A||!B)return {err:'no blob'};var sr=44100;function rms(x,a,b){var t=0;for(var i=a;i<b;i++)t+=x[i]*x[i];return Math.sqrt(t/(b-a))}
      var offA=0,offB=0,onA=rms(A,sr*0.1,sr*0.4),onB=rms(B,sr*0.1,sr*0.4);for(var sec of [2,4]){offA+=rms(A,sec*sr+sr*0.6,sec*sr+sr*0.9);offB+=rms(B,sec*sr+sr*0.6,sec*sr+sr*0.9)}
      return {origSameName:orig.name,newName:nw.name,noiseDropDb:20*Math.log10(offA/offB),toneDiffDb:20*Math.log10(onB/onA),lenA:A.length,lenB:B.length}}""")
    c['decoded'] = 'err' not in r
    if c['decoded']:
        c['noiseDropsOver8dB'] = r['noiseDropDb'] >= 8
        c['toneKeptWithin2dB'] = abs(r['toneDiffDb']) <= 2
        c['originalUntouched'] = r['origSameName'] == 'noisy.wav' and abs(r['lenA'] - 44100 * 6) < 100 and abs(r['lenB'] - r['lenA']) < 100
    b.close()
res = {'checks': c, 'measure': r, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
