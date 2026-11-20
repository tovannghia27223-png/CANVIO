#!/usr/bin/env python3
"""P145.3 real-Chrome test: render all 6 SFX offline, check non-silent/peak/duration, add to timeline as an audio clip, download WAV and decode with ffprobe."""
import json, os, sys, threading, http.server, socketserver, functools, shutil, subprocess, tempfile
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
c = {}; errs = []; tmp = tempfile.mkdtemp()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    ctx = b.new_context(viewport={'width': 1200, 'height': 800}, reduced_motion='reduce', accept_downloads=True)
    page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVSfxP145 && window.CVLoudnessP127)', timeout=90000, polling=500)
    page.evaluate("CV.go('videoEngine')"); page.wait_for_timeout(1500)
    c['rowMounted'] = page.evaluate("!!document.getElementById('cv145s-row')")
    info = page.evaluate("""async()=>{var o={};for(var k of Object.keys(CVSfxP145.recipes)){var r=await CVSfxP145.render(k,{seed:3});var pk=0,e=0;for(var i=0;i<r.samples.length;i++){var a=Math.abs(r.samples[i]);if(a>pk)pk=a;e+=a*a}
      var m=CVLoudnessP127.measure([r.samples],r.sampleRate);o[k]={pk:pk,rms:Math.sqrt(e/r.samples.length),dur:r.duration,lufs:m.lufs,bytes:r.wav.length}}return o}""")
    c['allNonSilent'] = all(v['rms'] > 0.005 for v in info.values())
    c['peakNearMinus1dB'] = all(0.85 < v['pk'] <= 0.9 for v in info.values())
    c['durationsRight'] = abs(info['riser']['dur'] - 2.5) < 0.01 and abs(info['click']['dur'] - 0.12) < 0.01
    c['deterministic'] = page.evaluate("""async()=>{var a=await CVSfxP145.render('glitch',{seed:9}),b=await CVSfxP145.render('glitch',{seed:9}),d=await CVSfxP145.render('glitch',{seed:10});var same=true,diff=false;for(var i=0;i<a.samples.length;i++){if(a.samples[i]!==b.samples[i])same=false;if(a.samples[i]!==d.samples[i])diff=true}return same&&diff}""")
    page.select_option('#cv145s-kind', 'hit')
    n0 = page.evaluate("CV.engines.video._state().clips.length")
    page.click('#cv145s-add'); page.wait_for_timeout(1500)
    c['addedAudioClip'] = page.evaluate("CV.engines.video._state().clips.filter(c=>c.type==='audio').length") >= 1 and page.evaluate("CV.engines.video._state().clips.length") == n0 + 1
    with page.expect_download(timeout=20000) as d: page.click('#cv145s-dl')
    pth = os.path.join(tmp, 's.wav'); d.value.save_as(pth)
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,sample_rate,channels,duration', '-of', 'json', pth], capture_output=True, text=True)
    st = json.loads(r.stdout or '{}').get('streams', [{}])[0]
    c['wavDecodes'] = st.get('codec_name') == 'pcm_s16le' and st.get('sample_rate') == '44100' and st.get('channels') == 1 and abs(float(st.get('duration', 0)) - 0.7) < 0.05
    b.close()
res = {'checks': c, 'lufs': {k: round(v['lufs'], 1) if v['lufs'] is not None else None for k, v in info.items()}, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
