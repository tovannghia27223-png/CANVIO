#!/usr/bin/env python3
"""P133.4 Chromium verification: same-owner large media OPFS write/read/migration and rollback on IDB metadata failure."""
import functools,http.server,json,os,shutil,socketserver,sys,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
if not CHROME:raise SystemExit('P133.4 requires Chromium')
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
server=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT)));server.daemon_threads=True
threading.Thread(target=server.serve_forever,daemon=True).start()
checks={};details={};errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1280,'height':900});page.on('pageerror',lambda e:errors.append(str(e)[:250]))
    page.goto('http://127.0.0.1:%d/index.html'%server.server_address[1],wait_until='commit',timeout=60000)
    page.wait_for_function("!!(window.CV&&window.CVMediaOPFSP133&&CV.engines&&CV.engines.video)",timeout=90000)
    page.evaluate("CV.go('videoEngine')")
    page.wait_for_function("!!CV.engines.video._state().db",timeout=30000)
    details=page.evaluate("""async()=>{
      const api=CVMediaOPFSP133,state=CV.engines.video._state(),db=state.db;
      const blob=new Blob([new Uint8Array(34*1048576)],{type:'video/webm'});
      const id='p133-opfs-roundtrip';
      const stored=await api.put(id,blob,state);
      const record=await new Promise((ok,no)=>{const r=db.transaction('media').objectStore('media').get(id);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
      const restored=await api.get(id,state);
      const proxyBlob=await CVProxyP133.getBlob(state,{id,mediaId:id});
      const roundtrip={storage:stored.storage,metadataHasNoBlob:record.blob===null&&record.storage==='opfs',bytes:restored&&restored.size,proxyReaderBytes:proxyBlob&&proxyBlob.size};
      const smallReplacement=new Blob([new Uint8Array(2*1048576)],{type:'video/webm'});
      const replaced=await api.put(id,smallReplacement,state);
      const replacementRecord=await new Promise((ok,no)=>{const r=db.transaction('media').objectStore('media').get(id);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
      const replacementBlob=await api.get(id,state);
      const dir=await (await navigator.storage.getDirectory()).getDirectoryHandle('canvio-video-media',{create:true});
      let oldSidecarExists=false;
      try{await dir.getFileHandle(record.opfsName);oldSidecarExists=true;}catch(e){if(!e||e.name!=='NotFoundError')throw e;}
      const replacement={storage:replaced.storage,bytes:replacementBlob&&replacementBlob.size,metadataPointsToIndexedDb:replacementRecord.storage!=='opfs'&&replacementRecord.blob instanceof Blob,cleanup:replaced.sidecarCleanup,oldSidecarExists};
      await api.remove(id,state);
      const legacyId='p133-opfs-migrate';
      const legacy=new Blob([new Uint8Array(33*1048576)],{type:'video/webm'});
      await new Promise((ok,no)=>{const tx=db.transaction('media','readwrite');tx.objectStore('media').put({id:legacyId,blob:legacy});tx.oncomplete=ok;tx.onerror=()=>no(tx.error)});
      const report=await api.migrateLarge(state,32*1048576);
      const migrated=await new Promise((ok,no)=>{const r=db.transaction('media').objectStore('media').get(legacyId);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
      const migratedBlob=await api.get(legacyId,state);
      await api.remove(legacyId,state);
      return{roundtrip,replacement,report,migratedStorage:migrated&&migrated.storage,migratedBlobBytes:migratedBlob&&migratedBlob.size};
    }""")
    checks['largeBlobStoredInOpfs']=details['roundtrip']['storage']=='opfs' and details['roundtrip']['metadataHasNoBlob']
    checks['largeBlobRoundTripVerified']=details['roundtrip']['bytes']==34*1048576
    checks['proxyReaderSupportsOpfs']=details['roundtrip']['proxyReaderBytes']==34*1048576
    checks['smallReplacementFallsBackToIndexedDb']=details['replacement']['storage']=='indexeddb' and details['replacement']['metadataPointsToIndexedDb'] and details['replacement']['bytes']==2*1048576
    checks['replacedOpfsSidecarIsDeleted']=details['replacement']['cleanup']=='removed' and not details['replacement']['oldSidecarExists']
    checks['legacyIdbMediaMigrates']=details['report']['migrated']>=1 and details['migratedStorage']=='opfs'
    checks['migratedBlobCanBeRead']=details['migratedBlobBytes']==33*1048576
    rollback=page.evaluate("""async()=>{
      const api=CVMediaOPFSP133;
      const dir=await (await navigator.storage.getDirectory()).getDirectoryHandle('canvio-video-media',{create:true});
      async function names(){const a=[];for await(const [n] of dir.entries())a.push(n);return a.sort().join('|')}
      const before=await names(),original=new Blob(['keep-original']);
      let record={id:'p133-rollback',blob:original};
      const fakeDb={objectStoreNames:{contains:n=>n==='media'},transaction:(store,mode)=>{
        if(mode==='readwrite')throw new Error('simulated metadata commit failure');
        return{objectStore:()=>({get:()=>{const req={};Promise.resolve().then(()=>{req.result=record;if(req.onsuccess)req.onsuccess()});return req;}})};
      }};
      let failed=false;try{await api.put('p133-rollback',new Blob([new Uint8Array(34*1048576)],{type:'video/webm'}),{db:fakeDb});}catch(e){failed=true;}
      const after=await names(),kept=await api.get('p133-rollback',{db:fakeDb});
      return{failed,originalKept:!!kept&&await kept.text()==='keep-original',stagingCleaned:before===after};
    }""")
    details['rollback']=rollback
    checks['metadataFailureKeepsOriginal']=rollback['failed'] and rollback['originalKept']
    checks['metadataFailureCleansStagedFile']=rollback['stagingCleaned']
    page.evaluate("CV.go('settings')")
    page.wait_for_function("!!document.querySelector('#cv133-media-migrate')",timeout=30000)
    checks['migrationControlMounted']=page.locator('#cv133-media-migrate').count()==1
    checks['noPageErrors']=not errors
    browser.close()
server.shutdown()
result={'suite':'P133.4 OPFS media sidecar Chromium acceptance','checks':checks,'details':details,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(result,ensure_ascii=False,indent=2));sys.exit(1 if result['failed'] else 0)
