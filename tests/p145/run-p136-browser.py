#!/usr/bin/env python3
"""P136 real-Chrome test: trace a canvas-drawn picture (circle + rect + text) through the UI, render the SVG back and compare with the source."""
import json, os, sys, threading, http.server, socketserver, functools, shutil, tempfile, base64
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
    page.wait_for_function('!!(window.CV && CV.go && window.CVTraceP136)', timeout=90000, polling=500)
    page.evaluate("CV.go('imageStudio')"); page.wait_for_timeout(1500)
    c['cardMounted'] = page.evaluate("!!document.getElementById('cv136-card')")
    page.click('#cv136-run'); c['noFileMessage'] = page.evaluate("/Chọn/.test(document.getElementById('cv136-out').textContent)")
    png = page.evaluate("""()=>{var c=document.createElement('canvas');c.width=300;c.height=200;var x=c.getContext('2d');x.fillStyle='#fff7e6';x.fillRect(0,0,300,200);x.fillStyle='#e63946';x.beginPath();x.arc(90,100,60,0,7);x.fill();x.fillStyle='#fff7e6';x.beginPath();x.arc(90,100,20,0,7);x.fill();x.fillStyle='#1d3557';x.fillRect(180,40,90,120);x.fillStyle='#f4a261';x.font='bold 40px sans-serif';x.fillText('Aa',190,110);return c.toDataURL('image/png')}""")
    path = os.path.join(tmp, 'in.png'); open(path, 'wb').write(base64.b64decode(png.split(',')[1]))
    page.set_input_files('#cv136-file', path); page.fill('#cv136-k', '4') if False else page.evaluate("document.getElementById('cv136-k').value=4")
    page.click('#cv136-run'); page.wait_for_function("!document.getElementById('cv136-run').disabled && document.getElementById('cv136-dl') && !document.getElementById('cv136-dl').disabled", timeout=30000)
    c['statusSummary'] = page.evaluate("/\\d+ màu, \\d+ lớp/.test(document.getElementById('cv136-out').textContent)")
    c['previewShown'] = page.evaluate("!!document.querySelector('#cv136-prev img')")
    with page.expect_download(timeout=15000) as d: page.click('#cv136-dl')
    sp = os.path.join(tmp, 'o.svg'); d.value.save_as(sp); svg = open(sp, encoding='utf-8').read()
    c['svgSafe'] = svg.startswith('<svg') and '<script' not in svg and 'http' not in svg.replace('http://www.w3.org/2000/svg', '')
    score = page.evaluate("""async(svg)=>{var src=new Image();await new Promise(r=>{src.onload=r;src.src=%s});
      var u=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),im=new Image();await new Promise(r=>{im.onload=r;im.src=u});
      function px(img){var c=document.createElement('canvas');c.width=300;c.height=200;var x=c.getContext('2d');x.drawImage(img,0,0,300,200);return x.getImageData(0,0,300,200).data}
      var a=px(src),b=px(im),bad=0;for(var i=0;i<a.length;i+=4){var dd=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);if(dd>150)bad++}return bad/(a.length/4)}""" % json.dumps(png), svg)
    c['roundTripClose'] = score < 0.04
    page.locator('#cv136-s').evaluate("(el)=>{el.value='65';el.dispatchEvent(new Event('input',{bubbles:true}))}")
    c['smoothnessControlUpdatesLabel'] = page.locator('#cv136-sv').inner_text() == '65%'
    page.click('#cv136-run'); page.wait_for_function("!document.getElementById('cv136-run').disabled", timeout=30000)
    with page.expect_download(timeout=15000) as d2: page.click('#cv136-dl')
    sp2 = os.path.join(tmp, 'smooth.svg'); d2.value.save_as(sp2); svg2 = open(sp2, encoding='utf-8').read()
    c['smoothExportContainsCubicSegments'] = bool(__import__('re').search(r'd="[^"]*C[-0-9.]', svg2))
    c['smoothExportKeepsSafeSvg'] = svg2.startswith('<svg') and '<script' not in svg2 and 'javascript:' not in svg2
    page.select_option('#cv136-mode', 'fill'); page.select_option('#cv136-pattern', 'diagonal')
    page.click('#cv136-run'); page.wait_for_function("!document.getElementById('cv136-run').disabled", timeout=30000)
    c['patternSummaryNamesChosenPreset'] = 'Họa tiết diagonal' in page.locator('#cv136-out').inner_text()
    c['patternPreviewShown'] = page.evaluate("!!document.querySelector('#cv136-prev img')")
    with page.expect_download(timeout=15000) as d3: page.click('#cv136-dl')
    pattern_path = os.path.join(tmp, 'pattern.svg'); d3.value.save_as(pattern_path); pattern_svg = open(pattern_path, encoding='utf-8').read()
    c['patternSVGHasLocalDefsAndReferences'] = '<defs><pattern' in pattern_svg and 'patternUnits="userSpaceOnUse"' in pattern_svg and 'fill="url(#cv136-pattern-' in pattern_svg
    c['patternSVGIsStaticAndSelfContained'] = pattern_svg.startswith('<svg') and '<script' not in pattern_svg and 'javascript:' not in pattern_svg and 'href=' not in pattern_svg
    c['patternPreviewDecodes'] = page.evaluate("""async()=>{const img=document.querySelector('#cv136-prev img');if(!img)return false;try{await img.decode();return img.naturalWidth>0&&img.naturalHeight>0}catch(e){return false}}""")
    page.select_option('#cv136-mode', 'stroke'); page.fill('#cv136-sw', '2.5')
    c['patternControlDisabledForStrokeMode'] = page.locator('#cv136-pattern').is_disabled()
    page.click('#cv136-run'); page.wait_for_function("!document.getElementById('cv136-run').disabled", timeout=30000)
    c['strokeModeSummary'] = 'Stroke:' in page.locator('#cv136-out').inner_text()
    c['strokePreviewShown'] = page.evaluate("!!document.querySelector('#cv136-prev img')")
    with page.expect_download(timeout=15000) as d4: page.click('#cv136-dl')
    stroke_path = os.path.join(tmp, 'stroke.svg'); d4.value.save_as(stroke_path); stroke_svg = open(stroke_path, encoding='utf-8').read()
    c['singleLineSVGUsesOpenStrokePaths'] = 'fill="none"' in stroke_svg and 'stroke-linecap="round"' in stroke_svg and '<path d="M' in stroke_svg and 'stroke-width="2.5"' in stroke_svg
    c['strokeSVGContainsNoFilledColorLayers'] = 'fill="#' not in stroke_svg and '<rect' not in stroke_svg
    b.close()
res = {'checks': c, 'mismatchRatio': score, 'svgKB': round(len(svg) / 1024, 1), 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
