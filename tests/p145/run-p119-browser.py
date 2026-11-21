#!/usr/bin/env python3
"""P119 real-Chrome test: easing graph mounts in Motion page, dragging a handle changes #motionEase, Lottie export is valid JSON."""
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
    ctx = b.new_context(viewport={'width': 1200, 'height': 900}, reduced_motion='reduce', accept_downloads=True); page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVEasingP119)', timeout=90000, polling=500)
    page.evaluate("CV.go('motion')"); page.wait_for_timeout(1200)
    c['mounted'] = page.evaluate("!!document.getElementById('cv119-cv')")
    before = page.evaluate("document.getElementById('motionEase').value")
    box = page.locator('#cv119-cv'); box.scroll_into_view_if_needed(); bb = box.bounding_box()
    sx = bb['width'] / 300; sy = bb['height'] / 190
    # handle 1 for default (.2,.8): x=22+.2*256, y=190-22-(.8*.5+.25)*146
    hx = bb['x'] + (22 + .2 * 256) * sx; hy = bb['y'] + (190 - 22 - (.8 * .5 + .25) * 146) * sy
    page.mouse.move(hx, hy); page.mouse.down(); page.mouse.move(hx + 60 * sx, hy + 40 * sy, steps=6); page.mouse.up(); page.wait_for_timeout(200)
    after = page.evaluate("document.getElementById('motionEase').value")
    c['dragChangesEase'] = after != before and after.startswith('cubic-bezier(')
    c['graphPainted'] = page.evaluate("(()=>{var c=document.getElementById('cv119-cv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(var i=0;i<d.length;i+=4)if(d[i+2]>200&&d[i]<120)return true;return false})()")
    page.select_option('#cv119-pre', 'Nảy nhẹ'); page.wait_for_timeout(150)
    c['presetApplies'] = page.evaluate("document.getElementById('motionEase').value") == 'cubic-bezier(0.34,1.56,0.64,1)'
    with page.expect_download() as dl: page.click('#cv119-lottie')
    path = dl.value.path(); d = json.load(open(path))
    c['lottieValid'] = d.get('v') and len(d['layers']) == 1 and d['op'] > 2 and d['layers'][0]['shapes'][0]['it'][0]['ty'] == 'rc'
    c['lottieUsesPreset'] = abs(d['layers'][0]['ks']['o']['k'][0]['o']['x'][0] - 0.34) < 1e-6 or abs(d['layers'][0]['ks']['o']['k'][0]['o']['y'][0] - 1.56) < 1e-6
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
