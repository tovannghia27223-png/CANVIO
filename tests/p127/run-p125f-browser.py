#!/usr/bin/env python3
"""P125.1 real-Chrome test: generate a 3 s test video with ffmpeg, extract frames in the app UI, build the HTML, then scroll it
and check the canvas frame index follows the scroll, reduced-motion falls back to frame 0, and no page errors."""
import json, os, sys, threading, http.server, socketserver, functools, shutil, subprocess, tempfile
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
tmp = tempfile.mkdtemp(); vid = os.path.join(tmp, 't.webm')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=320x180:rate=15:duration=3', '-c:v', 'libvpx', '-b:v', '300k', vid], check=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
c = {}; errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    ctx = b.new_context(viewport={'width': 1000, 'height': 700}, reduced_motion='reduce', accept_downloads=True)
    page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVScrollFramesP125)', timeout=90000, polling=500)
    page.evaluate("CV.go('webEngine')"); page.wait_for_timeout(1500)
    c['cardMounted'] = page.evaluate("!!document.getElementById('cv125-card')")
    page.click('#cv125-run'); page.wait_for_timeout(200)
    c['noFileMessage'] = page.evaluate("/Chọn/.test(document.getElementById('cv125-out').textContent)")
    page.set_input_files('#cv125-file', vid); page.fill('#cv125-n', '20'); page.fill('#cv125-w', '320'); page.select_option('#cv125-preset', 'hero')
    page.click('#cv125-run')
    page.wait_for_function("document.querySelector('#cv1252-editor')&&document.querySelector('#cv1252-editor').style.display==='block'", timeout=90000)
    c['storyboardEditorOpened'] = page.locator('#cv1252-editor').is_visible()
    c['statusReportsFrames'] = 'Đã trích 20 khung' in page.locator('#cv125-out').inner_text()
    with page.expect_download(timeout=90000) as d: page.click('#cv1252-export')
    path = os.path.join(tmp, 'out.html'); d.value.save_as(path)
    c['exported'] = os.path.getsize(path) > 2000
    html = open(path, encoding='utf-8').read()
    c['noExternalRefs'] = 'http://' not in html.replace('http://www.w3.org', '') and 'https://' not in html
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    ctx2 = b.new_context(viewport={'width': 800, 'height': 500}, reduced_motion='no-preference'); pg2 = ctx2.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg2.goto('file://' + path); pg2.wait_for_function('window.__scrollFrames', timeout=15000)
    c['startsAtFrame0'] = pg2.evaluate('__scrollFrames.current()') == 0
    pg2.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)'); pg2.wait_for_timeout(600)
    last = pg2.evaluate('__scrollFrames.current()')
    c['scrollReachesLastFrame'] = last == 19
    pg2.evaluate('window.scrollTo(0, (document.documentElement.scrollHeight-innerHeight)/2)'); pg2.wait_for_timeout(600)
    mid = pg2.evaluate('__scrollFrames.current()')
    c['scrollMidIsMid'] = 7 <= mid <= 12
    c['midCaptionShown'] = pg2.evaluate("document.getElementById('cap').textContent") == 'Một câu mô tả ngắn'
    pg2.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)'); pg2.wait_for_timeout(500)
    c['endCaptionShown'] = pg2.evaluate("document.getElementById('cap').textContent") == 'Bắt đầu ngay'
    c['canvasDrawn'] = pg2.evaluate("(()=>{var x=document.getElementById('c').getContext('2d').getImageData(10,10,40,40).data;var s=0;for(var i=0;i<x.length;i+=4)s+=x[i]+x[i+1]+x[i+2];return s>0})()")
    pg3 = ctx.new_page(); pg3.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg3.goto('file://' + path); pg3.wait_for_function('window.__scrollFrames', timeout=15000)
    pg3.evaluate('window.scrollTo(0, 9999)'); pg3.wait_for_timeout(400)
    c['reducedMotionStaysFrame0'] = pg3.evaluate('__scrollFrames.current()') == 0 and pg3.evaluate('document.documentElement.scrollHeight') <= 760
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
