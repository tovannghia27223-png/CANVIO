#!/usr/bin/env python3
"""P237 Chromium acceptance: Vietnamese commands in the existing Ctrl+K palette."""
import functools, http.server, os, shutil, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
server = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT)); server.daemon_threads = True
threading.Thread(target=server.serve_forever, daemon=True).start()
checks = []; errors = []
def ck(name, ok):
    checks.append((name, bool(ok))); print(('PASS ' if ok else 'FAIL ') + name)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium'), headless=True,
        args=['--no-sandbox', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:%d/index.html' % server.server_address[1], wait_until='domcontentloaded', timeout=120000)
    page.wait_for_function("!!(window.CVCommandP237&&CVCommandP237.tests().installed&&window.CVNativeStudioShellP234&&CVNativeStudioShellP234.tests().allFourMounted)", timeout=90000)
    t = page.evaluate("CVCommandP237.tests()")
    for k, v in t.items(): ck('contract ' + k, v)
    # Natural phrasing, with and without diacritics
    cases = {'đổi sang 9:16': 'p-ratio-story', 'DOI KHO THANH A4': 'p-ratio-a4', 'hãy thêm tiêu đề nhé': 'p-text', 'xuat png': 'x-png', 'mở video': 'go-videoEngine', 'hoàn tác': 'g-undo'}
    for text, want in cases.items(): ck('match ' + text, page.evaluate("t=>CVCommandP237.match(t)", text) == want)
    for text in ['to hơn', 'màu đỏ', 'xoá hết dữ liệu', 'thêm', '', '<img src=x onerror=1>']:
        ck('unknown text is not executed: ' + repr(text), page.evaluate("t=>CVCommandP237.match(t)", text) is None)
    page.evaluate("CV.go('poster')"); page.wait_for_timeout(500); page.evaluate("CV.palette.open()"); page.wait_for_timeout(250)
    ck('palette overlay covers the editor tool rail', page.evaluate("(()=>{const r=document.querySelector('#cv231-shell-poster .toolbar .tbtn').getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!e.closest('#palette')})()"))
    page.evaluate("CV.palette.close()")
    def palette(text):
        page.evaluate("CV.palette.open()"); page.wait_for_timeout(150)
        page.locator('#paletteInput').fill(text); page.wait_for_timeout(150)
        page.locator('#paletteInput').press('Enter'); page.wait_for_timeout(900)
    count = "CV.poster.doc.layers.length"
    palette('mở poster'); ck('keyboard command opens Poster', page.evaluate("document.querySelector('#page-poster').classList.contains('active')"))
    n = page.evaluate(count); palette('thêm chữ')
    ck('Enter adds exactly one layer', page.evaluate(count) == n + 1)
    ck('palette closes after a command', not page.evaluate("document.getElementById('palette').classList.contains('open')"))
    palette('hoàn tác'); ck('undo command restores the layer count', page.evaluate(count) == n)
    palette('làm lại'); ck('redo command re-adds the layer', page.evaluate(count) == n + 1)
    palette('đổi sang 9:16'); ck('ratio command changes the document and selector', page.evaluate("CV.poster.doc.ratio==='story'&&document.getElementById('posterRatio').value==='story'"))
    palette('hoàn tác'); ck('ratio change is undoable', page.evaluate("CV.poster.doc.ratio!=='story'"))
    page.evaluate("CV.poster.select(null)")
    r = page.evaluate("CVCommandP237.run('xoá đối tượng')"); ck('delete without selection changes nothing', not r['ok'])
    page.once('dialog', lambda dlg: dlg.dismiss())
    before = page.evaluate("JSON.stringify(CV.poster.doc)")
    r = page.evaluate("CVCommandP237.run('poster mới')"); ck('new design can be cancelled without loss', not r['ok'] and page.evaluate("JSON.stringify(CV.poster.doc)") == before)
    with page.expect_download(timeout=30000) as dl: palette('xuất PNG')
    ck('PNG export command produces a download', dl.value.suggested_filename.lower().endswith('.png'))
    palette('mở video'); ck('command opens Video Engine', page.evaluate("document.querySelector('#page-videoEngine').classList.contains('active')"))
    v = "CV.engines.video._state().clips.length"; n = page.evaluate(v)
    palette('thêm chữ vào video'); ck('video text command adds one clip', page.evaluate(v) == n + 1)
    palette('hoàn tác'); ck('video command is undoable', page.evaluate(v) == n)
    palette('mở dàn trang'); pages = "document.querySelectorAll('#lfPages>*').length"; n = page.evaluate(pages)
    palette('thêm trang'); ck('layout command uses the native page button', page.evaluate(pages) == n + 1)
    page.evaluate("CV.palette.open()"); page.wait_for_timeout(150)
    ck('recent commands appear on an empty palette', page.locator('#paletteList .palItem.l237').count() >= 1)
    page.locator('#paletteInput').fill('them'); page.wait_for_timeout(150)
    ck('partial text shows suggestions', page.locator('#paletteList .palItem.l237').count() >= 2)
    page.evaluate("CV.palette.close()")
    # every command resolves to a result object and never throws
    broken = page.evaluate("""async()=>{window.confirm=()=>false;const out=[];for(const c of CVCommandP237.list()){if(/^(v-webm|v-mp4|v-srt|x-|p-image|v-play)/.test(c.id))continue;try{const r=await CVCommandP237.run(c.example);if(!r||typeof r.ok!=='boolean'||!r.msg)out.push(c.id)}catch(e){out.push(c.id+':'+e.message)}}CV.engines.video.pause();return out}""")
    ck('all non-export commands return a message without throwing', broken == [])
    if broken: print(broken)
    page.set_viewport_size({'width': 390, 'height': 844}); page.evaluate("CV.go('poster')"); page.wait_for_timeout(700)
    m = page.evaluate("""()=>{const s=document.querySelector('#cv231-shell-poster'),b=[...s.querySelectorAll('.cv231-tools .cv231-action')].filter(x=>x.offsetWidth);return {labels:b.every(x=>getComputedStyle(x,'::after').content.length>2),size:b.every(x=>x.offsetWidth>=40&&x.offsetHeight>=40),inside:b.every(x=>x.getBoundingClientRect().right<=innerWidth),wide:document.documentElement.scrollWidth<=innerWidth+1,n:b.length}}""")
    ck('mobile editor tools show names', m['n'] >= 5 and m['labels'])
    ck('mobile editor tools stay touchable and on screen', m['size'] and m['inside'] and m['wide'])
    ck('No uncaught JavaScript page errors', not errors)
    if errors: print('PAGE_ERRORS ' + repr(errors))
    browser.close()
server.shutdown(); server.server_close()
failed = [n for n, v in checks if not v]
print('%d/%d P237 browser assertions passed' % (len(checks) - len(failed), len(checks)))
if failed: raise SystemExit('Failures: ' + ', '.join(failed))
