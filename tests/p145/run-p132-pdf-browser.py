#!/usr/bin/env python3
"""P132.1: local PDF.js -> selected page PNG -> existing Pixel Atelier owner."""
import functools
import http.server
import json
import os
import shutil
import socketserver
import sys
import threading
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
if not CHROME: raise SystemExit('P132.1 requires Chromium')
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
server.daemon_threads=True
threading.Thread(target=server.serve_forever,daemon=True).start()
origin='http://127.0.0.1:%d'%server.server_address[1]
errors=[]
requests=[]
checks={}
def make_pdf():
    def stream(content):
        return (b'<< /Length '+str(len(content)).encode('ascii')+b' >>\nstream\n'+content+b'\nendstream')
    objects=[
      b'<< /Type /Catalog /Pages 2 0 R >>',
      b'<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
      b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>',
      stream(b'BT /F1 12 Tf 20 60 Td (PAGE ONE) Tj ET'),
      b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>',
      stream(b'1 0 0 rg 20 20 100 50 re f'),
      b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
    ]
    data=bytearray(b'%PDF-1.7\n%\xe2\xe3\xcf\xd3\n')
    offsets=[0]
    for i,obj in enumerate(objects,1):
        offsets.append(len(data))
        data.extend(('%d 0 obj\n'%i).encode('ascii'))
        data.extend(obj)
        data.extend(b'\nendobj\n')
    xref=len(data)
    data.extend(('xref\n0 %d\n'% (len(objects)+1)).encode('ascii'))
    data.extend(b'0000000000 65535 f \n')
    for offset in offsets[1:]:
        data.extend(('%010d 00000 n \n'%offset).encode('ascii'))
    data.extend(('trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n'%(len(objects)+1,xref)).encode('ascii'))
    return bytes(data)

details={}
try:
  with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1280,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)[:250]))
    page.on('request',lambda r:requests.append(r.url))
    page.goto(origin+'/index.html',wait_until='commit',timeout=60000)
    page.wait_for_function("!!(window.CVNativeEngines&&CVNativeEngines.pixel&&window.CVPdfImportP132&&CVPdfImportP132.version==='132.1.0')",timeout=90000)
    page.evaluate("CV.go('pixelStudio')")
    page.wait_for_selector('#cv132pdf-panel',timeout=30000)
    page.set_input_files('#cv132pdf-file',{'name':'two-pages.pdf','mimeType':'application/pdf','buffer':make_pdf()})
    page.wait_for_function("document.querySelector('#cv132pdf-pages').textContent.includes('2 trang')",timeout=30000)
    checks['opensLocalPdfAndReadsPageCount']=True
    page.locator('#cv132pdf-page').fill('3')
    page.locator('#cv132pdf-import').click()
    page.wait_for_function("document.querySelector('#cv132pdf-status').textContent.includes('không hợp lệ')",timeout=5000)
    checks['invalidPageRejected']=True
    page.locator('#cv132pdf-page').fill('2')
    page.locator('#cv132pdf-import').click()
    page.wait_for_function("document.querySelector('#cv132pdf-status').textContent.includes('Đã đưa trang 2')",timeout=30000)
    checks['pageTwoRasterizedAndHandedOff']=True
    details=page.evaluate("""()=>{
      const input=document.querySelector('#pxFile'),c=CVNativeEngines.pixel.canvas;
      const ctx=c.getContext('2d'),px=ctx.getImageData(75,75,1,1).data;
      return {name:input.files&&input.files[0]&&input.files[0].name,type:input.files&&input.files[0]&&input.files[0].type,
        width:c.width,height:c.height,red:Array.from(px),status:document.querySelector('#pxStatus').textContent};
    }""")
    checks['usesExistingPixelFileInput']=bool(details['name'] and 'page-2.png' in details['name'] and details['type']=='image/png')
    checks['existingPixelCanvasRendersPdfPage']=details['width']==300 and details['height']==150 and details['red'][0]>180 and details['red'][1]<100 and details['red'][2]<100
    checks['pdfRuntimeAndWorkerAreSameOrigin']=any('/assets/vendor/pdfjs/pdf.mjs' in u for u in requests) and any('/assets/vendor/pdfjs/pdf.worker.mjs' in u for u in requests)
    checks['noPageErrors']=not errors
    checks['noExternalPdfRuntimeRequests']=not [u for u in requests if ('pdf.mjs' in u or 'pdf.worker' in u) and not u.startswith(origin+'/')]
    browser.close()
finally:
  server.shutdown()
failed=[k for k,v in checks.items() if not v]
print(json.dumps({'suite':'P132.1 local PDF import Chromium acceptance','checks':checks,'details':details,'pageErrors':errors,'failed':failed},ensure_ascii=False,indent=2))
sys.exit(1 if failed else 0)
