#!/usr/bin/env python3
"""P135.2 hosted Chromium acceptance: non-destructive preview and editable snapshot round-trip."""
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
    context=b.new_context(viewport={'width':1280,'height':900},reduced_motion='reduce',accept_downloads=True)
    page=context.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)[:240]))
    page.goto(url,wait_until='commit',timeout=60000)
    page.wait_for_function("!!(window.CVNativeEngines?.pixel && window.CVPixelAdjustmentsP135?.version==='135.2.0')",timeout=90000,polling=500)
    page.evaluate("CV.go('pixelStudio')")
    page.set_input_files('#pxFile',{'name':'p135-fixture.png','mimeType':'image/png','buffer':png_fixture()})
    page.wait_for_function("!!document.querySelector('#pxStatus')?.textContent.includes('×')",timeout=30000)
    page.wait_for_function("!!document.querySelector('#cv135-panel')",timeout=30000)
    checks['panelMounted']=page.locator('#cv135-panel').count()==1
    baseline=page.evaluate("CVNativeEngines.pixel.snapshotState()")
    baseline_clean=page.evaluate("(s)=>CVPixelAdjustmentsP135.unpackSnapshot(s).dataUrl",baseline)
    page.click('#cv135-panel [data-cv135="add"]')
    page.locator('#cv135-value').evaluate("(e)=>{e.value='150';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}")
    page.wait_for_timeout(150)
    checks['previewFilterApplied']='brightness(150%)' in page.locator('#pxCanvas').evaluate("(e)=>e.style.filter")
    snap=page.evaluate("CVNativeEngines.pixel.snapshotState()")
    page.evaluate("(s)=>{window.__p135Snapshot=s;window.__p135SnapshotInfo=CVPixelAdjustmentsP135.unpackSnapshot(s)}",snap)
    info=page.evaluate("window.__p135SnapshotInfo")
    snapshot_state=info.get('state') if isinstance(info,dict) else None
    snapshot_layers=snapshot_state.get('layers',[]) if isinstance(snapshot_state,dict) else []
    checks['projectSnapshotEmbedsEditableStack']=bool(info and info.get('embedded') is True and len(snapshot_layers)==1 and snapshot_layers[0].get('value')==150)
    checks['snapshotMetadataVersionIsOne']=bool(isinstance(snapshot_state,dict) and snapshot_state.get('version')==1)
    checks['snapshotKeepsOriginalRasterPNG']=bool(info and info.get('dataUrl')==baseline_clean)
    checks['snapshotSelectedLayerRoundTrip']=bool(snapshot_layers and snapshot_state.get('selectedId')==snapshot_layers[0].get('id'))
    page.evaluate("CVNativeEngines.pixel.restoreState(window.__p135Snapshot)")
    page.wait_for_function("window.CVPixelAdjustmentsP135.getState().layers.length===1 && window.CVNativeEngines.pixel.canvas.style.filter.includes('brightness(150%)')",timeout=30000)
    checks['projectSnapshotRestoreRehydratesStack']=page.evaluate("CVPixelAdjustmentsP135.getState().layers[0].value===150")
    page.click('#cv135-panel [data-cv135="undo"]')
    checks['stackUndoWorks']=page.locator('#cv135-layer-list .cv135-layer').count()==1 and page.locator('#cv135-value').input_value()=='100'
    page.click('#cv135-panel [data-cv135="redo"]')
    checks['stackRedoWorks']=page.locator('#cv135-layer-list .cv135-layer').count()==1 and page.locator('#cv135-value').input_value()=='150'
    with page.expect_download(timeout=30000) as info_download:
        page.click('#cv135-export-png')
    data=Path(info_download.value.path()).read_bytes()
    checks['pngSignature']=data[:8]==b'\x89PNG\r\n\x1a\n'
    checks['pngDimensions']=len(data)>=24 and struct.unpack('>II',data[16:24])==(48,32)
    encoded=base64.b64encode(data).decode('ascii')
    pixel=page.evaluate("""async (src)=>{const im=new Image();im.src='data:image/png;base64,'+src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return Array.from(x.getImageData(5,5,1,1).data)}""",encoded)
    checks['exportContainsAdjustedPixels']=pixel[0]>48 and pixel[1]>48 and pixel[2]>48
    page.evaluate("window.__p135AssetCalls=[];window.__p135OriginalAddBlob=CV.assets.addBlob;CV.assets.addBlob=async f=>{window.__p135AssetCalls.push({isFile:f instanceof File,name:f&&f.name,type:f&&f.type,size:f&&f.size});return {id:'p135-test'}};")
    page.click('#cv135-panel [data-cv135="asset"]')
    page.wait_for_function("window.__p135AssetCalls.some(x=>x.isFile && x.type==='image/png' && x.size>24)",timeout=30000)
    checks['assetSaveUsesExistingOwner']=page.evaluate("window.__p135AssetCalls.some(x=>x.isFile && x.type==='image/png' && x.size>24)")
    snap_after_export=page.evaluate("CVNativeEngines.pixel.snapshotState()")
    checks['sourceCanvasStillUnchangedAfterExport']=page.evaluate("(s)=>CVPixelAdjustmentsP135.unpackSnapshot(s).dataUrl===window.__p135SnapshotInfo.dataUrl",snap_after_export)
    page.wait_for_function("document.querySelector('#cv135-status')?.textContent.includes('Đã lưu bản raster')",timeout=30000)
    page.evaluate("sessionStorage.setItem('canvio.test.p135.snapshot',window.__p135Snapshot)")
    page.reload(wait_until='commit',timeout=60000)
    page.wait_for_function("!!(window.CVNativeEngines?.pixel?.restoreState && window.CVPixelAdjustmentsP135?.version==='135.2.0')",timeout=90000,polling=500)
    page.evaluate("()=>{CV.go('pixelStudio');return CVNativeEngines.pixel.restoreState(sessionStorage.getItem('canvio.test.p135.snapshot'))}")
    page.wait_for_function("window.CVPixelAdjustmentsP135.getState().layers.length===1 && window.CVNativeEngines.pixel.canvas.width===48 && window.CVNativeEngines.pixel.canvas.style.filter.includes('brightness(150%)')",timeout=30000)
    checks['snapshotSurvivesReloadAndProjectRestore']=page.evaluate("CVPixelAdjustmentsP135.getState().layers[0].value===150")
    checks['noPageErrors']=len(errors)==0
    b.close()
httpd.shutdown()
result={'suite':'CANVIO_P135_2_CHROMIUM_SNAPSHOT_PERSISTENCE','checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(result,ensure_ascii=False,indent=1));sys.exit(1 if result['failed'] else 0)
