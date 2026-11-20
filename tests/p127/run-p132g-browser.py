#!/usr/bin/env python3
"""P132 real-Chrome test: export GIF from the (empty) timeline, verify with ffprobe that it decodes, loops and has the expected frame count."""
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
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    ctx = b.new_context(viewport={'width': 1200, 'height': 800}, reduced_motion='reduce', accept_downloads=True)
    page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVGifP132)', timeout=90000, polling=500)
    page.evaluate("CV.go('videoEngine')"); page.wait_for_timeout(1500)
    c['buttonMounted'] = page.evaluate("!!document.getElementById('cv132-gif')")
    page.evaluate("var s=CV.engines.video._state();s.duration=2;CV.engines.video.commit&&0"); 
    page.fill('#cv132-fps', '5'); page.fill('#cv132-w', '200')
    with page.expect_download(timeout=60000) as d: page.click('#cv132-gif')
    pth = os.path.join(tmp, 'o.gif'); d.value.save_as(pth)
    c['statusOk'] = page.evaluate("/Đã xuất GIF 10 khung/.test(document.getElementById('cv132-out').textContent)")
    c['buttonReenabled'] = page.evaluate("!document.getElementById('cv132-gif').disabled")
    r = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,nb_read_frames', '-of', 'json', pth], capture_output=True, text=True)
    info = json.loads(r.stdout or '{}').get('streams', [{}])[0]
    c['ffprobeDecodes'] = info.get('codec_name') == 'gif' and info.get('width') == 200 and int(info.get('nb_read_frames', 0)) == 10
    c['headerIsGif89a'] = open(pth, 'rb').read(6) == b'GIF89a'
    with page.expect_download(timeout=60000) as d2: page.click('#cv132-apng')
    apng = os.path.join(tmp, 'o.apng'); d2.value.save_as(apng)
    c['apngStatusOk'] = page.evaluate("/Đã xuất APNG 10 khung/.test(document.getElementById('cv132-out').textContent)")
    c['apngButtonReenabled'] = page.evaluate("!document.getElementById('cv132-apng').disabled")
    ar = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,nb_read_frames', '-of', 'json', apng], capture_output=True, text=True)
    ainfo = json.loads(ar.stdout or '{}').get('streams', [{}])[0]
    c['ffprobeDecodesApng'] = ainfo.get('codec_name') == 'apng' and ainfo.get('width') == 200 and int(ainfo.get('nb_read_frames', 0)) == 10
    c['headerIsPng'] = open(apng, 'rb').read(8) == bytes([137,80,78,71,13,10,26,10])
    c['apngAnimationControlPresent'] = b'acTL' in open(apng, 'rb').read()
    with page.expect_download(timeout=60000) as d3: page.click('#cv132-webp')
    webp = os.path.join(tmp, 'o.webp'); d3.value.save_as(webp)
    c['webpStatusOk'] = page.evaluate("/Đã xuất WEBP 10 khung/.test(document.getElementById('cv132-out').textContent)")
    c['webpButtonReenabled'] = page.evaluate("!document.getElementById('cv132-webp').disabled")
    wdata = open(webp, 'rb').read()
    c['webpRiffHeader'] = len(wdata) > 32 and wdata[:4] == b'RIFF' and wdata[8:12] == b'WEBP'
    c['webpAnimationFlag'] = c['webpRiffHeader'] and bool(wdata[20] & 2)
    pos = 12; anmf = 0
    while pos + 8 <= len(wdata):
        tag = wdata[pos + 4:pos + 8]; size = int.from_bytes(wdata[pos:pos + 4], 'little')
        if pos + 8 + size > len(wdata): break
        if tag == b'ANMF': anmf += 1
        pos += 8 + size + (size & 1)
    c['webpFrameCount'] = anmf == 10
    wr = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,nb_read_frames', '-of', 'json', webp], capture_output=True, text=True)
    winfo = json.loads(wr.stdout or '{}').get('streams', [{}])[0]
    c['ffprobeDecodesAnimatedWebp'] = winfo.get('codec_name') == 'webp' and winfo.get('width') == 200 and int(winfo.get('nb_read_frames', 0)) == 10
    info['apng'] = ainfo; info['webp'] = winfo
    b.close()
res = {'checks': c, 'ffprobe': info, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
