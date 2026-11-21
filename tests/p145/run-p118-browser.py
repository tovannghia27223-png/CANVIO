#!/usr/bin/env python3
"""P118 real-Chrome test: choose a local TTF, wordmark SVG renders as outlines (pixels match browser text bbox roughly), kerning narrows AV, download works."""
import json, os, sys, threading, http.server, socketserver, functools, shutil
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
FONT = os.environ.get('CANVIO_TEST_TTF') or '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
c = {}; errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    ctx = b.new_context(viewport={'width': 1200, 'height': 900}, reduced_motion='reduce', accept_downloads=True); page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVWordmarkP118)', timeout=90000, polling=500)
    page.evaluate("CV.go('brand')"); page.wait_for_timeout(1000)
    c['mounted'] = page.evaluate("!!document.getElementById('cv118-font')")
    page.set_input_files('#cv118-font', FONT); page.wait_for_timeout(600)
    c['svgRendered'] = page.evaluate("!!document.querySelector('#cv118-prev svg path[d^=\"M\"]')")
    c['kernReported'] = 'có bảng kerning' in page.inner_text('#cv118-out')
    w1 = page.evaluate("document.querySelector('#cv118-prev svg').viewBox.baseVal.width")
    page.fill('#cv118-text', 'AVAVAV'); page.wait_for_timeout(150); wk = page.evaluate("document.querySelector('#cv118-prev svg').viewBox.baseVal.width")
    page.uncheck('#cv118-kern'); page.wait_for_timeout(150); wn = page.evaluate("document.querySelector('#cv118-prev svg').viewBox.baseVal.width")
    c['kerningNarrowsInUi'] = wk < wn - 5
    # raster check: ink bbox of outline vs the same font drawn by Chrome's own text engine
    r = page.evaluate("""async ()=>{
      const FONT=await fetch('/__font').then(r=>r.arrayBuffer()).catch(()=>null); return null }""")
    page.evaluate("""async (b64)=>{const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const ff=new FontFace('T118',u.buffer);await ff.load();document.fonts.add(ff);}""", __import__('base64').b64encode(open(FONT,'rb').read()).decode())
    page.fill('#cv118-text', 'Hamburg'); page.check('#cv118-kern'); page.wait_for_timeout(200)
    res = page.evaluate("""async ()=>{
      const svg=document.querySelector('#cv118-prev svg').outerHTML, vb=document.querySelector('#cv118-prev svg').viewBox.baseVal;
      const img=new Image(); img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); await img.decode();
      const ink=(draw,W,H)=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);draw(x);const d=x.getImageData(0,0,W,H).data;let a=1e9,z=-1,n=0;for(let y=0;y<H;y++)for(let i=0;i<W;i++){if(d[(y*W+i)*4]<128){n++;if(i<a)a=i;if(i>z)z=i}}return {w:z-a+1,n}};
      const A=ink(x=>x.drawImage(img,0,0,vb.width,vb.height),Math.ceil(vb.width),Math.ceil(vb.height));
      const B=ink(x=>{x.fillStyle='#000';x.font='120px T118';x.textBaseline='alphabetic';x.fillText('Hamburg',10,140)},900,220);
      return {A,B}}""")
    c['inkWidthMatchesBrowserText'] = abs(res['A']['w'] - res['B']['w']) <= 6
    c['inkAreaMatchesBrowserText'] = abs(res['A']['n'] - res['B']['n']) / max(1, res['B']['n']) < 0.06
    with page.expect_download() as dl: page.click('#cv118-dl')
    c['downloadIsSvg'] = open(dl.value.path()).read().startswith('<svg')
    page.set_input_files('#cv118-font', {'name': 'x.ttf', 'mimeType': 'font/ttf', 'buffer': b'notafont-notafont'}); page.wait_for_timeout(300)
    c['badFontMessage'] = 'TrueType' in page.inner_text('#cv118-out') or 'nhỏ' in page.inner_text('#cv118-out')
    b.close()
res = {'checks': c, 'ink': res, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
