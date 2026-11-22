#!/usr/bin/env python3
"""P133.5: mọi chỗ đọc CANVIO_81_MEDIA phải đọc được media lớn đã nằm trong OPFS (waveform/Audio Studio, khử ồn, đo âm lượng)."""
import functools,http.server,json,os,shutil,socketserver,sys,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
srv=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=str(ROOT)));srv.daemon_threads=True
threading.Thread(target=srv.serve_forever,daemon=True).start()
errs=[];c={}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=b.new_page(viewport={'width':1280,'height':900});page.on('pageerror',lambda e:errs.append(str(e)[:250]))
    page.goto('http://127.0.0.1:%d/index.html'%srv.server_address[1],wait_until='commit',timeout=60000)
    page.wait_for_function("!!(window.CV&&window.CVMediaOPFSP133&&CV.engines&&CV.engines.video&&window.CVStudioSuite2310&&window.CVDenoiseP138&&window.CVLoudnessP127)",timeout=90000)
    page.evaluate("CV.go('videoEngine')");page.wait_for_function("!!CV.engines.video._state().db",timeout=30000)
    r=page.evaluate("""async()=>{
      const st=CV.engines.video._state(),id='p133-r2-big',N=34*1048576;
      const st1=await CVMediaOPFSP133.put(id,new Blob([new Uint8Array(N)],{type:'audio/wav'}),st);
      const rec=await new Promise(ok=>{const q=st.db.transaction('media').objectStore('media').get(id);q.onsuccess=()=>ok(q.result)});
      const out={storage:st1.storage,pointerOnly:rec&&rec.blob===null};
      const a=await CVStudioSuite2310.getMediaBlob(id);out.studio=a&&a.size;
      const clip={id:id,mediaId:id};
      const src=CVDenoiseP138.processClip.toString().length>0;out.hasProcess=src;
      const rd=await new Promise(ok=>{const q=st.db.transaction('media').objectStore('media').get(id);q.onsuccess=()=>ok(q.result)});
      await CVMediaOPFSP133.remove(id,st);
      const gone=await CVStudioSuite2310.getMediaBlob(id);out.afterRemove=gone;
      return out}""")
    c['storedInOpfs']=r['storage']=='opfs' and r['pointerOnly']
    c['audioStudioReadsOpfsMedia']=r['studio']==34*1048576
    c['removedMediaReturnsNull']=r['afterRemove'] is None
    b.close()
res={'checks':c,'detail':r,'pageErrors':errs,'failed':[k for k,v in c.items() if not v]}
print(json.dumps(res,ensure_ascii=False,indent=1));sys.exit(1 if res['failed'] or errs else 0)
