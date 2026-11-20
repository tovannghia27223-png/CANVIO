#!/usr/bin/env python3
"""P140 real-Chrome test: build a chart of each type from CSV through the UI, render the SVG in an <img>, confirm it paints, download it, and save to the Asset Library."""
import json, os, sys, threading, http.server, socketserver, functools, shutil, tempfile
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
    ctx = b.new_context(viewport={'width': 1200, 'height': 900}, reduced_motion='reduce', accept_downloads=True)
    page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVChartsP140)', timeout=90000, polling=500)
    page.evaluate("CV.go('assets')"); page.wait_for_timeout(1200)
    c['mounted'] = page.evaluate("!!document.getElementById('cv140-card')")
    page.click('#cv140-run'); c['emptyMessage'] = page.evaluate("/Cần dòng tiêu đề/.test(document.getElementById('cv140-out').textContent)")
    page.fill('#cv140-csv', 'thang,Doanh thu,Chi phí\nT1,120,80\nT2,150,90\nT3,180,95\nT4,"1.200,5",110'); page.fill('#cv140-title', 'Doanh thu <Q1>')
    paint = """async()=>{var im=document.querySelector('#cv140-prev img');await new Promise(r=>{if(im.complete&&im.naturalWidth)r();else im.onload=r});var c=document.createElement('canvas');c.width=320;c.height=200;var x=c.getContext('2d');x.drawImage(im,0,0,320,200);var d=x.getImageData(0,0,320,200).data,col=0,seen={};for(var i=0;i<d.length;i+=4){if(d[i]+d[i+1]+d[i+2]<700){col++}}return {w:im.naturalWidth,colored:col}}"""
    for t in ['bar', 'line', 'pie', 'donut']:
        page.select_option('#cv140-type', t); page.click('#cv140-run'); page.wait_for_timeout(200)
        r = page.evaluate(paint); c['renders_' + t] = r['w'] == 640 and r['colored'] > 800
    with page.expect_download(timeout=15000) as d: page.click('#cv140-dl')
    pth = os.path.join(tmp, 'c.svg'); d.value.save_as(pth); svg = open(pth, encoding='utf-8').read()
    c['downloadSafe'] = svg.startswith('<svg') and '<script' not in svg and '&lt;Q1&gt;' in svg
    n0 = page.evaluate("CV.assets.list().length"); page.click('#cv140-save'); page.wait_for_timeout(500)
    c['savedToAssets'] = page.evaluate("CV.assets.list().length") == n0 + 1 and page.evaluate("/Đã lưu/.test(document.getElementById('cv140-out').textContent)")
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
