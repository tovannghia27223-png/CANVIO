#!/usr/bin/env python3
"""P135.1 hosted Chromium acceptance: preview is non-destructive and exported PNG applies adjustment stack."""
import base64, functools, http.server, json, os, shutil, socketserver, struct, sys, threading, zlib
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
def png_fixture():
    w,h=48,32
    raw=bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            v=48 if x<w//2 else 88
            raw.extend((v,v,v,255))
    def chunk(t,d):
        return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(raw)))+chunk(b'IEND',b'')
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
httpd=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Quiet,directory=ROOT));httpd.daemon_threads=True
threading.Thread(target=httpd.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%httpd.server_address[1]
checks={};errors=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page=b.new_context(viewport={'width':1280,'height':900},reduced_motion='reduce',accept_downloads=True).new_page()
    page.on('pageerror',lambda e:errors.append(str(e)[:240]))
    page.goto(url,wait_until='commit',timeout=60000)
    page.wait_for_function("!!(window.CVNativeEngines?.pixel && window.CVPixelAdjustmentsP135)",timeout=90000,polling=500)
    page.evaluate("CV.go('pixelStudio')")
    page.set_input_files('#pxFile',{'name':'p135-fixture.png','mimeType':'image/png','buffer':png_fixture()})
    page.wait_for_function("!!document.querySelector('#pxStatus')?.textContent.includes('×')",timeout=30000)
    page.wait_for_function("!!document.querySelector('#cv135-panel')",timeout=30000)
    checks['panelMounted']=page.locator('#cv135-panel').count()==1
    before=page.evaluate("CVNativeEngines.pixel.snapshotState()")
    page.click('#cv135-panel [data-cv135="add"]')
    page.locator('#cv135-value').evaluate("(e)=>{e.value='150';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}")
    page.wait_for_timeout(150)
    checks['previewFilterApplied']='brightness(150%)' in page.locator('#pxCanvas').evaluate("(e)=>e.style.filter")
    after=page.evaluate("CVNativeEngines.pixel.snapshotState()")
    checks['sourceCanvasUnchanged']=before==after
    page.click('#cv135-panel [data-cv135="undo"]')
    checks['stackUndoWorks']=page.locator('#cv135-layer-list .cv135-layer').count()==0
    page.click('#cv135-panel [data-cv135="redo"]')
    checks['stackRedoWorks']=page.locator('#cv135-layer-list .cv135-layer').count()==1
    with page.expect_download(timeout=30000) as info:
        page.click('#cv135-export-png')
    path=Path(info.value.path());data=path.read_bytes()
    checks['pngSignature']=data[:8]==b'\x89PNG\r\n\x1a\n'
    checks['pngDimensions']=len(data)>=24 and struct.unpack('>II',data[16:24])==(48,32)
    encoded=base64.b64encode(data).decode('ascii')
    pixel=page.evaluate("""async (src)=>{const im=new Image();im.src='data:image/png;base64,'+src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return Array.from(x.getImageData(5,5,1,1).data)}""",encoded)
    checks['exportContainsAdjustedPixels']=pixel[0]>48 and pixel[1]>48 and pixel[2]>48
    # Stub only the existing Asset Library write owner in this isolated browser run.
    page.evaluate("window.__p135AssetCalls=[];window.__p135OriginalAddBlob=CV.assets.addBlob;CV.assets.addBlob=async f=>{window.__p135AssetCalls.push({isFile:f instanceof File,name:f&&f.name,type:f&&f.type,size:f&&f.size});return {id:'p135-test'}};")
    page.click('#cv135-panel [data-cv135="asset"]')
    page.wait_for_function("!!window.__p135AssetWrite",timeout=30000)
    checks['assetSaveUsesExistingOwner']=page.evaluate("window.__p135AssetWrite.type==='image/png' && window.__p135AssetWrite.size>24")
    checks['sourceCanvasStillUnchangedAfterExport']=before==page.evaluate("CVNativeEngines.pixel.snapshotState()")
    page.evaluate("CV.assets.addBlob=CV.assets.addBlob")
    b.close()
httpd.shutdown()
result={'checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(result,ensure_ascii=False,indent=1));sys.exit(1 if result['failed'] or errors else 0)
