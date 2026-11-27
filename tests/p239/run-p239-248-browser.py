#!/usr/bin/env python3
"""P239–P248 real Chromium smoke for Studio Pro integration, document creation and safe local utilities."""
import functools,http.server,os,shutil,socketserver,threading
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Quiet,directory=ROOT));server.daemon_threads=True
threading.Thread(target=server.serve_forever,daemon=True).start()
checks=[];errors=[]
def ck(name,ok):
 checks.append((name,bool(ok)));print(('PASS ' if ok else 'FAIL ')+name)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-gpu'])
 page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:%d/index.html'%server.server_address[1],wait_until='domcontentloaded',timeout=120000)
 page.wait_for_function("!!(window.CVBriefPackP239&&window.CVMagicResizeP240&&window.CVBulkP241&&window.CVProjectBundleP242&&window.CVWebsitePublishP243&&window.CVCaptionVoiceP244&&window.CVBeatEditorP245&&window.CVCollabLiteP246&&window.CVPerformanceP247&&window.CVLocalModelsP248&&window.CVStudioProUI239248)",timeout=90000)
 page.evaluate("CV.go('projectVault')");page.wait_for_selector('#cvstudio-pro-p239',timeout=30000);page.evaluate("CVStudioProUI239248.mountNow()");
 try:
  page.wait_for_selector('#cv240-card',timeout=10000);page.wait_for_selector('#cv248-card',timeout=10000)
 except Exception:
  print('STUDIO_PRO_MOUNT_DIAGNOSTICS',page.evaluate("CVStudioProUI239248Diagnostics||CVStudioProUI239248.tests()"))
  raise
 page.locator('#cv239-brief').fill('Chiến dịch tuyển dụng nhân tài cho doanh nghiệp Việt Nam')
 page.locator('#cv239-build').click();page.wait_for_timeout(300)
 ck('Studio Pro mount diagnostics report all nine panels without errors',page.evaluate("(()=>{const r=CVStudioProUI239248Diagnostics;return !!r&&r.ok&&Object.values(r.cards).every(Boolean)&&r.errors.length===0})()"));
 ck('Studio Pro panel IDs are unique',page.evaluate("['cv240-card','cv241-card','cv242-card','cv243-card','cv244-card','cv245-card','cv246-card','cv247-card','cv248-card'].every(id=>document.querySelectorAll('#'+id).length===1)"));
 ck('P239 generates five project-scoped editable documents',page.evaluate("(()=>{const p=CVCreativeCore.active.documents.briefPack;return !!p&&Object.keys(p.documents).length===5&&['poster','social','slides','website','storyboard'].every(k=>!!p.documents[k])})()"))
 ck('P240 produces six constrained formats',page.evaluate("CVMagicResizeP240.buildSet(CVBriefPackP239.read().documents.poster).length===6"))
 ck('P241 parses Vietnamese CSV and quoted commas',page.evaluate("CVBulkP241.parseCSV('name,role\\n\\\"Nguyễn, A\\\",HR').rows[0].name==='Nguyễn, A'"))
 ck('P242 validates stored ZIP CRC fixture',page.evaluate("CVProjectBundleP242.tests().crc32"))
 ck('P242 exports a bounded real stored .canvio ZIP with verified manifest and project payload',page.evaluate("""async () => {
 const z=await CVProjectBundleP242.exportBundle(),b=new Uint8Array(await z.arrayBuffer()),v=new DataView(b.buffer),sig=0x06054b50;let eocd=-1;
 for(let i=b.length-22;i>=Math.max(0,b.length-65558);i--)if(v.getUint32(i,true)===sig){eocd=i;break;}
 if(eocd<0)return false;let pos=v.getUint32(eocd+16,true),count=v.getUint16(eocd+10,true),entries={};
 for(let n=0;n<count;n++){if(v.getUint32(pos,true)!==0x02014b50)return false;const flags=v.getUint16(pos+8,true),method=v.getUint16(pos+10,true),size=v.getUint32(pos+24,true),nl=v.getUint16(pos+28,true),el=v.getUint16(pos+30,true),cl=v.getUint16(pos+32,true),name=new TextDecoder().decode(b.slice(pos+46,pos+46+nl));entries[name]={flags,method,size};pos+=46+nl+el+cl;}
 const meta=entries['project.json'];if(!meta||meta.flags!==0||meta.method!==0||meta.size>CVProjectBundleP242.MAX_PROJECT_JSON_BYTES)return false;
 const e=await CVProjectBundleP242.readStoredZip(z),m=JSON.parse(new TextDecoder().decode(e['manifest.json'])),body=new TextDecoder().decode(e['project.json']),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 return m.format==='CANVIO_PROJECT_BUNDLE'&&m.sha256===hash&&m.projectJsonBytes===meta.size&&JSON.parse(body).format==='CANVIO_PROJECT'&&z.size<=CVProjectBundleP242.MAX_BUNDLE_BYTES;
 }"""));
 ck('P242 export removes token-like keys before bundling',page.evaluate("(()=>{const r=CVProjectBundleP242.sanitizeProject({apiKey:'x',documents:{refreshToken:'y',title:'safe'}});return r.excludedSecretFields===2&&!r.project.apiKey&&!r.project.documents.refreshToken&&r.project.documents.title==='safe'})()"));
 ck('P245 analysis limits audio duration and file bytes',page.evaluate("CVBeatEditorP245.MAX_DURATION_SECONDS===300&&CVBeatEditorP245.MAX_FILE_BYTES===40*1024*1024"));
 ck('P243 SEO gate blocks missing title/alt',page.evaluate("!CVWebsitePublishP243.audit('<h1>Thiếu metadata</h1><img>').ok"))
 ck('P244 exports native timeline subtitles as SRT',page.evaluate("CVCaptionVoiceP244.toSRT([{start:1.25,duration:2,text:'Xin chào'}]).includes('00:00:01,250 --> 00:00:03,250')"))
 ck('P245 beat planner leaves canonical clip starts unchanged',page.evaluate("(()=>{const a={clips:[{id:'a',track:1,type:'video',start:1.2}]},r=CVBeatEditorP245.plan([1,2],a);return r.length===1&&a.clips[0].start===1.2})()"))
 ck('P246 share payload remains read-only and excludes secrets',page.evaluate("CVCollabLiteP246.tests().secretsExcluded"))
 ck('P247 reports full-index split honestly as open',page.evaluate("CVPerformanceP247.measure().fullIndexCodeSplit===false"))
 ck('P248 hardware profile recommends bounded model tier',page.evaluate("CVLocalModelsP248.recommend(7,4).tier==='tiny / quantized'"))
 ck('All ten modules and UI are mounted without duplicate root',page.evaluate("document.querySelectorAll('#cvstudio-pro-p239').length===1&&['cv240-card','cv241-card','cv242-card','cv243-card','cv244-card','cv245-card','cv246-card','cv247-card','cv248-card'].every(id=>!!document.getElementById(id))"))
 page.on('dialog',lambda x:x.accept())
 ck('P242 re-imports the bundle it exported',page.evaluate("(async()=>{const id=CVCreativeCore.active.id,z=await CVProjectBundleP242.exportBundle(),r=await CVProjectBundleP242.importBundle(z,()=>true);const ok=r.ok&&r.projectId!==id&&!!CVCreativeCore.active.documents.briefPack;return ok})()"))
 ck('P240 exported text stays inside every canvas',page.evaluate("""(()=>{CVBriefPackP239.build('Chiến dịch tuyển dụng nhân tài cho doanh nghiệp Việt Nam với nhiều vị trí hấp dẫn và chế độ đãi ngộ cạnh tranh trong năm tới '.repeat(3));
 return CVMagicResizeP240.buildSet(CVBriefPackP239.read().documents.poster).every(r=>{if(r.result.overflow)return false;const h=document.createElement('div');h.innerHTML=CVMagicResizeP240.svg(r.result.document);document.body.appendChild(h);const ok=[...h.querySelectorAll('text')].every(t=>{const b=t.getBBox();return b.x>=-1&&b.y>=-1&&b.x+b.width<=r.width+1&&b.y+b.height<=r.height+1});h.remove();return ok})})()"""))
 page.evaluate("CVBriefPackP239.build('Tuyển dụng ZZQX 2027. Mời ứng tuyển')")
 for kind in ('poster','social'):
  ck('P239 opens '+kind+' content in Poster Studio',page.evaluate("async k=>{const r=await CVBriefPackP239.open(k);return r.ok&&JSON.stringify(CV.poster.doc).toUpperCase().includes('ZZQX')}",kind))
 ck('P239 opens slides in the layout editor and can restore',page.evaluate("(async()=>{const r=await CVBriefPackP239.open('slides');const has=CVNativeEngines.layout.snapshotState().includes('ZZQX');return r.ok&&has&&CVBriefPackP239.restoreLayout()&&!CVNativeEngines.layout.snapshotState().includes('ZZQX')})()"))
 r=page.evaluate("CVBriefPackP239.open('website')");ck('P239 sends the page to Website Engine',r['ok'])
 ck('P239 opens the storyboard in Video Studio',page.evaluate("(async()=>{const r=await CVBriefPackP239.open('storyboard');return r.ok&&localStorage.getItem('canvio5:media_video_project_v1').includes('ZZQX')})()"))
 link=page.evaluate("CVBriefPackP239.build('Tuyển dụng ZZQX <img src=x onerror=window.pwned=1> 2027. '+'Nội dung dài '.repeat(150)),CVCollabLiteP246.shareURL()")
 other=browser.new_context().new_page();other.on('pageerror',lambda e:errors.append(str(e)));other.goto(link,wait_until='domcontentloaded',timeout=120000);other.wait_for_selector('#cv246-view',timeout=90000)
 ck('P246 share link shows read-only content without running markup',other.evaluate("document.querySelector('#cv246-view').innerText.includes('ZZQX')&&!document.querySelector('#cv246-view img')&&!window.pwned"))
 ck('No uncaught JavaScript errors',not errors)
 if errors:print('PAGE_ERRORS '+repr(errors))
 browser.close()
server.shutdown();server.server_close()
failed=[n for n,v in checks if not v]
print('%d/%d P239–P248 Chromium assertions passed'%(len(checks)-len(failed),len(checks)))
if failed:raise SystemExit('Failures: '+', '.join(failed))
