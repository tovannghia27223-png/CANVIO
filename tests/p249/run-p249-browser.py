#!/usr/bin/env python3
"""P249 Chromium acceptance: poster art gallery, embedded Vietnamese fonts, photo slot, PNG export."""
import base64, functools, http.server, os, shutil, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
server = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT)); server.daemon_threads = True
threading.Thread(target=server.serve_forever, daemon=True).start()
checks = []; errors = []
def ck(name, ok):
    checks.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name)
BRIEF = 'Sữa tươi An Lành cho bé. Dành cho phụ huynh có con 2–6 tuổi. Giàu canxi, ít đường. Đặt hàng ngay'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium'), headless=True,
        args=['--no-sandbox', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
    page.on('pageerror', lambda e: errors.append(str(e))); page.on('dialog', lambda x: x.accept())
    page.goto('http://127.0.0.1:%d/index.html' % server.server_address[1], wait_until='domcontentloaded', timeout=120000)
    page.wait_for_function('!!(window.CVPosterArtP249&&window.CVStudioProUI239248&&window.CV&&CV.designer)', timeout=90000); page.wait_for_timeout(4000)
    page.evaluate('CVPosterArtP249.ready')
    ck('embedded Vietnamese fonts load offline', page.evaluate("['400 20px CVAnton','500 20px CVMont','800 20px CVMont','600 20px CVLora'].every(f=>document.fonts.check(f,'Sữa tươi'))"))
    page.evaluate("CV.go('projectVault')"); page.wait_for_selector('#cv239-brief', timeout=60000)
    page.locator('#cv239-brief').fill(BRIEF); page.locator('#cv239-build').click()
    page.wait_for_selector('#cv249 button.v', timeout=30000)
    ck('three design choices are shown', page.locator('#cv249 button.v:visible').count() == 3)
    ck('restore button is hidden until there is something to restore', not page.locator('#cv239-restore').is_visible())
    page.wait_for_timeout(2500)
    COLORS = """root=>{const brief=document.querySelector('#cv239-brief').value;const bad=[];[0,1,2].forEach(v=>{const els=[...document.querySelectorAll('#cv249 button.v[data-variant="'+v+'"] div')].filter(e=>!e.children.length&&e.textContent);
      CVPosterArtP249.make(brief,v).layers.filter(l=>l.type==='text').forEach(l=>{const e=els.find(x=>x.textContent===l.text);const p=document.createElement('i');p.style.color=l.color;if(!e||e.style.color!==p.style.color)bad.push([v,l.text,l.color,e&&e.style.color])})});return bad}"""
    bad = page.evaluate(COLORS, None); ck('thumbnails keep the design text colours', bad == [])
    if bad: print(bad)
    themes = page.evaluate("['Sữa tươi','Quán cà phê','Tuyển dụng nhân viên','Khoá học vẽ','Giảm 30% hôm nay','Phần mềm kế toán','Ngày hội'].map(CVPosterArtP249.detect)")
    ck('brief picks the matching theme', themes == ['milk','food','hr','edu','sale','tech','general'])
    ck('layers stay inside the canvas at both sizes', page.evaluate("""()=>['Tuyển dụng nhân viên kinh doanh toàn quốc cho hệ thống cửa hàng mới. Thu nhập hấp dẫn','x '.repeat(60),'Siêu sale giảm 50% toàn bộ sản phẩm'].every(b=>[0,1,2].every(v=>[false,true].every(sq=>{const d=CVPosterArtP249.make(b,v,{square:sq});
      return d.layers.filter(l=>l.type==='text').every(l=>l.x>=0&&l.y>=0&&l.x+l.w<=d.w+1&&l.y+l.h<=d.h+1)})))"""))
    page.locator('#cv249 button.v[data-variant="2"]').click(); page.wait_for_timeout(2500)
    ck('chosen design opens in Poster Studio', page.evaluate("document.querySelector('.page.active').id==='page-poster'&&CV.poster.doc.cvArt.variant===2&&CV.poster.doc.layers.some(l=>l.font==='cvDisplay'&&/SỮA/.test(l.text))"))
    page.wait_for_timeout(2500)
    ck('editor keeps the design text colours', page.evaluate("""()=>{const want=CV.poster.doc.layers.filter(l=>l.type==='text');const els=[...document.querySelectorAll('#page-poster .ly.text')];
      return els.length>0&&want.every(l=>{const e=els.find(x=>x.textContent.trim()===l.text.trim());if(!e)return false;const p=document.createElement('i');p.style.color=l.color;return getComputedStyle(e).color===(document.body.appendChild(p),getComputedStyle(p).color)+(p.remove(),'')})}"""))
    if os.environ.get('SHOT'): page.screenshot(path=os.environ['SHOT'].replace('.png', '_editor.png'))
    ck('text remains editable layers', page.evaluate("['tươi mới','sữa tươi','phụ huynh','đặt hàng'].every(k=>CV.poster.doc.layers.some(l=>l.type==='text'&&l.text.toLowerCase().replace(/\\n/g,' ').includes(k)))"))
    with page.expect_download(timeout=60000) as dl: page.evaluate('CV.export.png()')
    data = open(dl.value.path(), 'rb').read()
    ck('PNG export is a real image', data[:4] == b'\x89PNG' and len(data) > 40000)
    ck('exported SVG carries the fonts', page.evaluate("window.__cvImg(CV.poster.doc.layers[0]).includes('@font-face')"))
    page.evaluate("CV.go('projectVault')"); page.wait_for_selector('#cv249 button.v')
    png = base64.b64decode(page.evaluate("(()=>{const c=document.createElement('canvas');c.width=c.height=300;const x=c.getContext('2d');x.fillStyle='#0a0';x.fillRect(0,0,300,300);return c.toDataURL().split(',')[1]})()"))
    page.locator('#cv249-photo').set_input_files({'name': 'sp.png', 'mimeType': 'image/png', 'buffer': png}); page.wait_for_function("document.querySelector('#cv249-status').textContent.startsWith('Đã đưa')")
    ck('product photo is placed in all layouts', page.evaluate("[0,1,2].every(v=>CVPosterArtP249.make('Sữa',v).layers.find(l=>l.cvHero===v).src.startsWith('data:image/webp'))"))
    page.locator('#cv249-clear').click()
    ck('photo can be removed', page.evaluate("CVPosterArtP249.make('Sữa',0).layers.find(l=>l.cvHero===0).src.startsWith('data:image/svg')"))
    r = page.evaluate("CVBriefPackP239.open('social')")
    ck('social post uses the same design, square', r['ok'] and page.evaluate("CV.poster.doc.h===440&&!!CV.poster.doc.cvArt"))
    page.set_viewport_size({'width': 390, 'height': 844}); page.evaluate("CV.go('projectVault')"); page.wait_for_timeout(1200)
    ck('gallery fits a phone screen', page.evaluate("document.querySelector('#cv249').getBoundingClientRect().right<=innerWidth+1"))
    page.set_viewport_size({'width': 1440, 'height': 900}); page.wait_for_timeout(800)
    page.locator('#cv249').scroll_into_view_if_needed(); page.wait_for_timeout(500)
    if os.environ.get('SHOT'): page.screenshot(path=os.environ['SHOT'])
    ck('no uncaught JavaScript errors', not errors)
    if errors: print(errors)
    browser.close()
server.shutdown()
print('P249 Chromium assertions: %d/%d passed' % (sum(checks), len(checks)))
raise SystemExit(0 if all(checks) else 1)
