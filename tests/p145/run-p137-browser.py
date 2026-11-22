#!/usr/bin/env python3
"""P137 real-Chrome test on Layout Foundry: apply paragraph style to selection, redefine style updates blocks on other pages, TOC built from all pages with real page numbers, no duplicate on rebuild, undo, zero page errors."""
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
PAGES = {'pages': [{'id': 'p1', 'html': '<h1>Giới thiệu</h1><p id="a">Đoạn một của trang một.</p><p>Đoạn hai.</p>'},
                   {'id': 'p2', 'html': '<h2>Phương pháp</h2><p data-cv137-style="Trích dẫn" style="font-size:17px">Một câu trích dẫn ở trang hai.</p>'},
                   {'id': 'p3', 'html': '<h1>Kết luận</h1><p>Hết.</p>'}], 'active': 0}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page = b.new_context(viewport={'width': 1300, 'height': 900}, reduced_motion='reduce').new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVStylesP137 && window.CVNativeEngines)', timeout=90000, polling=500)
    page.evaluate("CV.go('layoutFoundry')"); page.wait_for_timeout(1500)
    c['mounted'] = page.evaluate("!!document.getElementById('cv137-apply')")
    page.evaluate("(s)=>CVNativeEngines.layout.restoreState(s)", PAGES); page.wait_for_timeout(500)
    sel_js = "(()=>{const e=document.getElementById('a');const r=document.createRange();r.selectNodeContents(e);const s=getSelection();s.removeAllRanges();s.addRange(r);})()"
    page.evaluate(sel_js); page.wait_for_timeout(100)
    page.select_option('#cv137-sel', 'Chú thích'); page.click('#cv137-apply'); page.wait_for_timeout(300)
    c['styleApplied'] = page.evaluate("(()=>{const e=document.getElementById('a');return e.getAttribute('data-cv137-style')==='Chú thích'&&e.style.fontSize==='12px'&&e.style.opacity==='0.75'})()")
    page.evaluate(sel_js); page.select_option('#cv137-sel', 'Thân bài'); page.click('#cv137-apply'); page.wait_for_timeout(200)
    c['switchingStyleClearsOld'] = page.evaluate("(()=>{const e=document.getElementById('a');return e.getAttribute('data-cv137-style')==='Thân bài'&&e.style.fontSize==='15px'&&e.style.opacity===''})()")
    # redefine 'Trích dẫn' from a sample paragraph on page 1, expect page 2 block updated
    page.evaluate("document.getElementById('a').style.cssText='font-size:19px;font-style:italic;line-height:1.5;margin:14px 0;padding-left:14px;border-left:3px solid currentColor'; document.getElementById('a').setAttribute('data-cv137-style','Trích dẫn')")
    page.evaluate(sel_js); page.select_option('#cv137-sel', 'Trích dẫn'); page.click('#cv137-redef'); page.wait_for_timeout(500)
    st = page.evaluate("JSON.parse(localStorage.getItem('canvio137:styles')||'{}')['Trích dẫn']")
    c['definitionSaved'] = bool(st) and st.get('fontSize') == '19px'
    snap = page.evaluate("(()=>{const s=CVNativeEngines.layout.snapshotState();return typeof s==='string'?JSON.parse(s):s})()")
    c['otherPageRestyled'] = 'font-size: 19px' in snap['pages'][1]['html'] or 'font-size:19px' in snap['pages'][1]['html']
    page.click('#cv137-toc'); page.wait_for_timeout(500)
    snap = page.evaluate("(()=>{const s=CVNativeEngines.layout.snapshotState();return typeof s==='string'?JSON.parse(s):s})()")
    h1 = snap['pages'][0]['html']
    c['tocInserted'] = 'data-cv137-toc' in h1 and 'Mục lục' in h1
    import re
    rows = re.findall(r'<span>([^<]+)</span><span style="[^"]*"></span><span>(\d+)</span>', h1)
    c['tocEntriesAndPages'] = rows == [('Giới thiệu', '1'), ('Phương pháp', '2'), ('Kết luận', '3')]
    page.click('#cv137-toc'); page.wait_for_timeout(500)
    snap = page.evaluate("(()=>{const s=CVNativeEngines.layout.snapshotState();return typeof s==='string'?JSON.parse(s):s})()")
    c['tocNotDuplicated'] = snap['pages'][0]['html'].count('data-cv137-toc') == 1 and len(snap['pages']) == 3
    c['tocNotCountedInItself'] = len(re.findall(r'<span>(?:Giới thiệu|Phương pháp|Kết luận)</span><span', snap['pages'][0]['html'])) == 3
    page.click('#cv137-undo'); page.wait_for_timeout(400)
    snap = page.evaluate("(()=>{const s=CVNativeEngines.layout.snapshotState();return typeof s==='string'?JSON.parse(s):s})()")
    c['undoRestores'] = snap['pages'][0]['html'].count('data-cv137-toc') == 1 and len(snap['pages']) == 3
    page.evaluate("CVNativeEngines.layout.restoreState({pages:[{id:'z',html:'<p>Chỉ có đoạn.</p>'}],active:0})"); page.wait_for_timeout(300)
    page.click('#cv137-toc'); page.wait_for_timeout(400)
    c['emptyTocMessage'] = 'Chưa có tiêu đề' in page.evaluate("document.getElementById('lfDoc').innerHTML")
    c['characterAndTableControlsMounted'] = page.evaluate("!!(document.getElementById('cv137-char-sel')&&document.getElementById('cv137-char-apply')&&document.getElementById('cv137-table-sel')&&document.getElementById('cv137-table-apply'))")
    page.evaluate("CVNativeEngines.layout.restoreState({pages:[{id:'rich',html:'<p id=\\'char\\'>Vietnamese text for character formatting.</p><table id=\\'rich-table\\'><thead><tr><th>Category</th><th>Value</th></tr></thead><tbody><tr><td>Revenue</td><td>12</td></tr></tbody></table>'}],active:0})")
    page.wait_for_timeout(400)
    page.evaluate("(()=>{const t=document.querySelector('#char').firstChild,r=document.createRange();r.setStart(t,0);r.setEnd(t,10);const s=getSelection();s.removeAllRanges();s.addRange(r);})()")
    page.wait_for_timeout(100)
    page.select_option('#cv137-char-sel', 'Đậm'); page.click('#cv137-char-apply'); page.wait_for_timeout(200)
    c['characterStyleApplied'] = page.evaluate("(()=>{const p=document.getElementById('char'),s=p.querySelector('span[data-cv137-char=\\'Đậm\\']');return !!s&&s.textContent==='Vietnamese'&&s.style.fontWeight==='700'})()")
    page.evaluate("(()=>{const t=document.querySelector('#rich-table tbody td'),r=document.createRange();r.selectNodeContents(t);const s=getSelection();s.removeAllRanges();s.addRange(r);})()")
    page.wait_for_timeout(100)
    page.select_option('#cv137-table-sel', 'Lưới'); page.click('#cv137-table-apply'); page.wait_for_timeout(200)
    c['tableStyleApplied'] = page.evaluate("(()=>{const t=document.getElementById('rich-table'),td=t.querySelector('tbody td'),th=t.querySelector('thead th');return t.getAttribute('data-cv137-table')==='Lưới'&&t.style.borderCollapse==='collapse'&&td.style.border.indexOf('1px')>=0&&th.style.backgroundColor!==' '&&th.style.fontWeight==='700'})()")
    c['characterAndTableStylesRestyleFromHtml'] = page.evaluate("(()=>{const r=CVStylesP137.restyleHtml('<p><span data-cv137-char=\\'Tô sáng\\'>x</span></p><table data-cv137-table=\\'Báo cáo\\'><tr><th>H</th><td>D</td></tr></table>',CVStylesP137.load()),d=new DOMParser().parseFromString(r.html,'text/html'),s=d.querySelector('span'),t=d.querySelector('table'),th=t.querySelector('th');return r.n===2&&s.style.backgroundColor==='rgb(255, 243, 176)'&&t.style.borderCollapse==='collapse'&&th.style.fontWeight==='700'})()")
    # P137.3: chảy chữ sang trang sau
    long_html = ''.join('<p>Đoạn số %d. %s</p>' % (i, 'Chữ dài để tràn trang. ' * 14) for i in range(40))
    page.evaluate("(h)=>CVNativeEngines.layout.restoreState({pages:[{id:'f1',html:h},{id:'f2',html:'<p>Trang sau có sẵn.</p>'}],active:0})", long_html); page.wait_for_timeout(500)
    before = page.evaluate("document.getElementById('lfDoc').scrollHeight")
    page.click('#cv137-flow'); page.wait_for_timeout(600)
    st = page.evaluate("JSON.parse(CVNativeEngines.layout.snapshotState())")
    lim = page.evaluate("CVStylesP137.flowLimit(document.getElementById('lfDoc'))")
    after = page.evaluate("document.getElementById('lfDoc').scrollHeight")
    c['flowShrinksCurrentPage'] = before > lim and after <= lim + 2
    c['flowAddsPagesWhenNeeded'] = len(st['pages']) >= 3 and st['active'] == 0
    c['flowKeepsOrderAndAllText'] = ''.join(__import__('re').findall(r'Đoạn số (\d+)', ''.join(q['html'] for q in st['pages']))) == ''.join(str(i) for i in range(40)) and 'Trang sau có sẵn' in st['pages'][-1]['html']
    c['flowMessage'] = 'khối' in page.inner_text('#cv137-out')
    page.click('#cv137-flow'); page.wait_for_timeout(300)
    c['flowIdempotentWhenFits'] = 'chưa tràn' in page.inner_text('#cv137-out')
    page.click('#cv137-undo'); page.wait_for_timeout(300)
    c['flowUndo'] = len(page.evaluate("JSON.parse(CVNativeEngines.layout.snapshotState())")['pages']) == 2
    b.close()
res = {'checks': c, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
