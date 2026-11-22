#!/usr/bin/env python3
"""P137.7 Chrome: khung chữ liên kết trong Designer (Konva thật): thêm khung kế tiếp, chữ chảy, chỉnh khung → chảy lại, gỡ liên kết."""
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
LONG = ' '.join('từ%d' % i for i in range(120))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page = b.new_context(viewport={'width': 1300, 'height': 900}, reduced_motion='reduce').new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVFramesP137)', timeout=90000, polling=500)
    page.evaluate("CV.go('designEngine')"); page.wait_for_function("!!(window.Konva&&Konva.stages.find(s=>s.container().id==='konvaStage'))", timeout=30000); page.wait_for_timeout(800)
    c['panelMounted'] = page.evaluate("!!document.getElementById('cv137f-add')")
    page.evaluate("CV.engines.design.addText()"); page.wait_for_timeout(300)
    page.evaluate("""(t)=>{const st=Konva.stages.find(s=>s.container().id==='konvaStage'),L=st.getLayers()[0],n=L.findOne('Text');n.text(t);n.width(220);n.fontSize(16);n.height(80);L.draw();
      const tr=L.findOne('Transformer');tr.nodes([n]);window.__n=n}""", LONG)
    page.click('#cv137f-add'); page.wait_for_timeout(300)
    r = page.evaluate("""()=>{const L=Konva.stages.find(s=>s.container().id==='konvaStage').getLayers()[0],ts=L.find('Text').filter(n=>n.getAttr('cvChain')).sort((a,b)=>a.getAttr('cvChainIdx')-b.getAttr('cvChainIdx'));
      return{n:ts.length,texts:ts.map(t=>t.text()),tail:ts[ts.length-1].getAttr('cvChainTail')||'',h:ts.map(t=>t.height()),lines:ts.map(t=>t.textArr.length),cap:ts.map(t=>Math.floor(t.height()/(t.fontSize()*t.lineHeight())))}}""")
    allw = ' '.join(r['texts'] + ([r['tail']] if r['tail'] else [])).split()
    c['twoFramesChained'] = r['n'] == 2
    c['textSplitInOrderNothingLost'] = allw == LONG.split()
    c['firstFrameFilled'] = len(r['texts'][0].split()) > 0 and len(r['texts'][1].split()) > 0
    c['noFrameRendersMoreLinesThanCapacity'] = all(l <= cap for l, cap in zip(r['lines'], r['cap']))
    c['overflowReportedWhenNeeded'] = ('tràn' in page.inner_text('#cv137f-out')) == bool(r['tail'])
    for _ in range(4):
        page.evaluate("()=>{const L=Konva.stages.find(s=>s.container().id==='konvaStage').getLayers()[0],ts=L.find('Text').filter(n=>n.getAttr('cvChain')).sort((a,b)=>a.getAttr('cvChainIdx')-b.getAttr('cvChainIdx'));Konva.stages[0].getLayers()[0].findOne('Transformer').nodes([ts[ts.length-1]])}"); page.click('#cv137f-add'); page.wait_for_timeout(150)
    r2 = page.evaluate("""()=>{const L=Konva.stages.find(s=>s.container().id==='konvaStage').getLayers()[0],ts=L.find('Text').filter(n=>n.getAttr('cvChain')).sort((a,b)=>a.getAttr('cvChainIdx')-b.getAttr('cvChainIdx'));
      return{n:ts.length,texts:ts.map(t=>t.text()),tail:ts[ts.length-1].getAttr('cvChainTail')||''}}""")
    placed = sum(len(t.split()) for t in r2['texts']); c['moreFramesPullTextForward'] = r2['n'] == 6 and ' '.join(r2['texts'] + ([r2['tail']] if r2['tail'] else [])).split() == LONG.split() and placed > sum(len(t.split()) for t in r['texts']) * 2
    # sửa chữ ở khung đầu rồi chảy lại
    page.evaluate("()=>{const L=Konva.stages[0].getLayers()[0],ts=L.find('Text').filter(n=>n.getAttr('cvChain')).sort((a,b)=>a.getAttr('cvChainIdx')-b.getAttr('cvChainIdx'));ts[0].text('MỞ ĐẦU MỚI '+ts[0].text());L.findOne('Transformer').nodes([ts[0]])}")
    page.click('#cv137f-flow'); page.wait_for_timeout(200)
    r3 = page.evaluate("()=>{const L=Konva.stages[0].getLayers()[0],ts=L.find('Text').filter(n=>n.getAttr('cvChain')).sort((a,b)=>a.getAttr('cvChainIdx')-b.getAttr('cvChainIdx'));return ts.map(t=>t.text()).join(' ')+' '+(ts[ts.length-1].getAttr('cvChainTail')||'')}")
    c['editThenReflowKeepsAllWords'] = r3.split()[:3] == ['MỞ', 'ĐẦU', 'MỚI'] and all(('từ%d' % i) in r3.split() for i in range(120))
    page.click('#cv137f-unlink'); page.wait_for_timeout(200)
    r4 = page.evaluate("()=>{const L=Konva.stages[0].getLayers()[0];const ts=L.find('Text');return{linked:ts.filter(n=>n.getAttr('cvChain')).length,total:ts.length}}")
    c['unlinkKeepsFramesAndText'] = r4['linked'] == 0 and r4['total'] >= 6
    page.click('#cv137f-flow'); page.wait_for_timeout(100)
    c['flowWithoutChainIsRefused'] = 'Chọn' in page.inner_text('#cv137f-out')
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
