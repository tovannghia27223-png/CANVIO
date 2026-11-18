#!/usr/bin/env python3
"""Optional P82 real localhost-origin font and PDF smoke (not hosted HTTPS acceptance)."""
from __future__ import annotations
import json, os, shutil, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import fitz
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).with_name('http-origin-smoke-report.json')
PDF = Path(__file__).with_name('p82-http-origin-synthetic.pdf')
checks=[]

def check(ok, name, detail=''):
    checks.append({'id':name,'status':'pass' if ok else 'fail','detail':detail})
    print(('PASS' if ok else 'FAIL'),name,detail)
    if not ok: raise AssertionError(name+(': '+detail if detail else ''))

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass


def main():
    handler = lambda *a, **kw: QuietHandler(*a, directory=str(ROOT), **kw)
    server = ThreadingHTTPServer(('127.0.0.1',0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
    url=f'http://127.0.0.1:{server.server_port}/index.html'
    errors=[]; console=[]; font_responses=[]
    try:
        with sync_playwright() as p:
            exe=os.environ.get('CHROMIUM_EXECUTABLE_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
            browser=p.chromium.launch(headless=True, executable_path=exe, args=['--no-sandbox','--disable-dev-shm-usage'])
            page=browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('console',lambda m:console.append(m.text[:400]) if m.type=='error' else None)
            page.on('response',lambda r:font_responses.append({'url':r.url,'status':r.status}) if 'NotoSans-Regular.ttf' in r.url else None)
            page.route('https://fonts.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='text/css',body=''))
            page.route('https://fonts.gstatic.com/**',lambda r:r.fulfill(status=200,content_type='font/woff2',body=b''))
            nav=page.goto(url,wait_until='domcontentloaded',timeout=60000)
            check(nav is not None and nav.status==200,'Localhost HTTP origin serves the candidate',f'{url} · HTTP {nav.status if nav else "no response"}')
            page.wait_for_function("window.CANVIO_BUILD && CANVIO_BUILD.version === '23.3.108-p85-studio-r2'",timeout=45000)
            check(page.evaluate('!!window.CANVIOVectorPDF'),'P82 module boots on actual HTTP origin')
            page.evaluate("CV.go('poster'); CV.poster.newDesign(); CV.poster.setDoc({id:'p82-http',name:'CANVIO HTTP PDF',w:794,h:1123,layers:[{type:'text',x:60,y:90,w:650,h:80,text:'Kiểm tra PDF trên localhost · Tiếng Việt',size:30,font:'sans',color:'#14264b',visible:true}]})")
            page.evaluate('CVPages.pages')
            loaded=page.evaluate('CANVIOVectorPDF.loadFont().then(x=>({font:x.bytes.length,checks:CANVIOVectorPDF.tests()}))')
            check(loaded['font']>500000 and loaded['checks']['vietnameseGlyphCoverage'],'Bundled font loads over same-origin HTTP and covers Vietnamese',json.dumps({'bytes':loaded['font'],'glyphCoverage':loaded['checks']['vietnameseGlyphCoverage']}))
            check(any(x['status']==200 for x in font_responses),'Browser received HTTP 200 for same-origin font',json.dumps(font_responses))
            with page.expect_download(timeout=30000) as info: page.locator('#cv-p82-vector-pdf').click()
            info.value.save_as(str(PDF))
            check(PDF.exists() and PDF.stat().st_size>1000,'PDF downloads from the localhost-origin app',f'{PDF.stat().st_size} bytes')
            check(not errors,'No uncaught browser errors',json.dumps(errors[:5]))
            check(not console,'No browser console errors',json.dumps(console[:5]))
            browser.close()
        doc=fitz.open(PDF)
        text='\n'.join(p.get_text() for p in doc)
        check(len(doc)==1,'Localhost PDF contains one page',str(len(doc)))
        check('Kiểm tra PDF trên localhost' in text and 'Tiếng Việt' in text,'Localhost PDF preserves Vietnamese text extraction',text[:250])
        result={'candidate':'23.3.108-p85-studio-r2','origin':'http://127.0.0.1','status':'PASS_LOCALHOST_HTTP_FONT_AND_PDF','checks':checks,'fontResponses':font_responses,'pdfBytes':PDF.stat().st_size,'limitations':['Localhost only; not hosted HTTPS, browser matrix or production origin.','Single synthetic Poster page; does not validate real user project persistence or print-prepress.']}
        OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        print(f'P82 localhost HTTP smoke: {len(checks)}/{len(checks)} PASS')
    except Exception as exc:
        result={'candidate':'23.3.108-p85-studio-r2','origin':'http://127.0.0.1','status':'BLOCKED_OR_FAILED_LOCALHOST_ORIGIN','error':str(exc),'checks':checks,'fontResponses':font_responses}
        OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        raise
    finally:
        server.shutdown();server.server_close();PDF.unlink(missing_ok=True)

if __name__=='__main__': main()
