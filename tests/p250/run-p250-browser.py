#!/usr/bin/env python3
"""P250 Chromium acceptance: completion features of Studio Pro."""
import base64, functools, http.server, io, json, os, re, shutil, socketserver, struct, threading, wave, math, zipfile
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
server = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT)); server.daemon_threads = True
threading.Thread(target=server.serve_forever, daemon=True).start()
checks = []; errors = []
def ck(name, ok):
    checks.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name, flush=True)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium'), headless=True,
        args=['--no-sandbox', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
    page.on('pageerror', lambda e: errors.append(str(e))); page.on('dialog', lambda x: x.accept())
    page.goto('http://127.0.0.1:%d/index.html' % server.server_address[1], wait_until='domcontentloaded', timeout=120000)
    page.wait_for_function('!!(window.CVStudioCompleteP250&&window.CVStudioProUI239248&&window.CVPosterArtP249&&CV.export&&document.querySelector("#cv250-home"))', timeout=90000); page.wait_for_timeout(4000)
    def dl(selector):
        with page.expect_download(timeout=90000) as d: page.locator(selector).click()
        return open(d.value.path(), 'rb').read()
    def text(selector): return page.locator(selector).inner_text()
    page.locator('#ws-jin').fill('Sữa tươi An Lành cho bé. Giàu canxi. Đặt hàng ngay'); page.locator('#cv250-home').click(); page.wait_for_selector('#cv250-device-run', timeout=30000)
    ck('home button opens Studio Pro with the brief', page.evaluate("document.querySelector('.page.active').id==='page-projectVault'&&document.querySelector('#cv239-brief').value.startsWith('Sữa')"))
    page.wait_for_timeout(1500)
    top = page.evaluate("document.querySelector('#cvstudio-pro-p239').getBoundingClientRect().top")
    ck('Studio Pro card is scrolled into view', -5 <= top < 300); print('top', top)
    page.locator('#cv239-build').click(); page.wait_for_selector('#cv249 button.v')
    ids = ['cv250-sizes','cv250-bulk','cv250-full','cv250-site','cv250-cap','cv250-beat','cv250-review','cv250-app','cv250-device','cv250-decks']
    ck('every panel is mounted once', page.evaluate('ids=>ids.every(i=>document.querySelectorAll("#"+i).length===1)', ids))
    # bulk
    page.locator('#cv241-csv').fill('name,role,company\n"Nguyễn Văn A",Nhân sự,"Công ty A, B"\n,Thiếu tên,X\n"Trần Thị Bích Ngọc",Kế toán,Công ty C')
    page.locator('#cv250-prev').click(); page.wait_for_selector('#cv250-preview div')
    ck('preview shows a row and reports the bad line', 'Dòng 2' in text('#cv250-bulk .cv250-status') and 'Dòng 3' in text('#cv250-bulk .cv250-status'))
    z = zipfile.ZipFile(io.BytesIO(dl('#cv250-png'))); pngs = [n for n in z.namelist() if n.endswith('.png')]
    ck('batch PNG has one image per valid row plus an error list', len(pngs) == 2 and 'loi.txt' in z.namelist() and all(z.read(n)[:4] == b'\x89PNG' and len(z.read(n)) > 15000 for n in pngs))
    doc = dl('#cv250-pdf'); xref = int(doc.rsplit(b'startxref', 1)[1].split()[0])
    ck('batch PDF has two pages and a valid xref', doc.startswith(b'%PDF-1.4') and b'/Count 2' in doc and doc[xref:xref+4] == b'xref' and all(doc[int(l[:10]):].startswith(b'%d 0 obj' % (i+1)) for i, l in enumerate(doc[xref:].split(b'\n')[3:3+8])))
    r = page.evaluate("""async()=>{const rows=['name'].concat(Array.from({length:100},(_,i)=>'Người '+i)).join('\\n');const x=await CVStudioCompleteP250.exportBatch(rows,'png');return {n:x.count,e:x.errors.length}}""")
    ck('100 rows give 100 files', r == {'n': 100, 'e': 0})
    page.evaluate("""()=>{const d=CVPosterArtP249.make('Hội thảo',0);d.layers.filter(l=>l.type==='text')[1].text='Mời {{name}}';CV.go('poster');CV.poster.setDoc(d)}""")
    ck('poster placeholders become the template', page.evaluate("(()=>{const s=CVStudioCompleteP250.batch('name\\nLan');return s.source==='poster'&&s.items[0].doc.layers.some(l=>(l.text||'').replace(/\\n/g,' ')==='Mời Lan')&&CV.poster.doc.layers.some(l=>l.text==='Mời {{name}}')})()"))
    ck('missing column is refused clearly', page.evaluate("(()=>{try{CVStudioCompleteP250.batch('x\\n1');return false}catch(e){return /name/.test(e.message)}})()"))
    page.evaluate("CVStudioCompleteP250.openStudio()"); page.wait_for_timeout(800)
    z = zipfile.ZipFile(io.BytesIO(dl('#cv250-sizes-run')))
    dims = {n: struct.unpack('>II', z.read(n)[16:24]) for n in z.namelist()}
    ck('six sizes export at their exact pixels', len(dims) == 6 and all(n.endswith('-%dx%d.png' % dims[n]) for n in dims))
    ck('resized layers stay inside the frame', page.evaluate("CVMagicResizeP240.presets.every(([n,W,H])=>CVStudioCompleteP250.resizeDoc(CVPosterArtP249.make('Sữa',0),W,H).layers.filter(l=>l.type==='text').every(l=>l.x>=-1&&l.y>=-1&&l.x+l.w<=W+1&&l.y+(l.h||0)<=H+1))"))
    a = dl('#cv250-slides'); b = dl('#cv250-board')
    ck('designed slides and storyboard export as PDF', b'/Count 5' in a and b'/Count 1' in b and len(a) > 80000)
    html = dl('#cv250-web').decode('utf-8')
    ck('designed website passes the SEO gate offline', page.evaluate('h=>CVWebsitePublishP243.audit(h).ok', html) and 'CVAnton' in html and '<form' not in html)
    anon = 'x.' + base64.urlsafe_b64encode(json.dumps({'role':'anon'}).encode()).decode().rstrip('=') + '.y'
    secret = 'x.' + base64.urlsafe_b64encode(json.dumps({'role':'service_role'}).encode()).decode().rstrip('=') + '.y'
    ck('contact form refuses secret keys and foreign hosts', page.evaluate("""([s])=>[[ 'https://abc.supabase.co',s],['https://abc.supabase.co','sb_secret_123'],['https://evil.test','sb_publishable_1']].every(a=>{try{CVStudioCompleteP250.formConfig(...a);return false}catch(e){return true}})""", [secret]))
    page.locator('#cv250-sb-url').fill('https://abc.supabase.co'); page.locator('#cv250-sb-key').fill(anon); page.locator('#cv250-site-fill').click()
    site = page.locator('#cv243-html').input_value()
    ck('contact form is added for a public key', 'rest/v1/cv_leads' in site and 'đạt kiểm tra SEO' in text('#cv250-site .cv250-status'))
    sent = []
    form = browser.new_page()
    form.route('**/rest/v1/cv_leads', lambda route: (sent.append((route.request.method, route.request.post_data)), route.fulfill(status=201, headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'}, body='')))
    form.route('https://site.test/', lambda route: route.fulfill(content_type='text/html', body=site))
    form.goto('https://site.test/'); form.fill('input[name=name]', 'Lan'); form.fill('input[name=contact]', '0900'); form.click('#lead button'); form.wait_for_function("document.querySelector('#sent').textContent.startsWith('Đã gửi')", timeout=15000)
    ck('published form posts the lead', any(m == 'POST' and '"Lan"' in (d or '') for m, d in sent)); form.close()
    # review
    page.evaluate("CVStudioCompleteP250.openStudio()")
    page.locator('#cv246-comment').fill('Đổi tiêu đề ngắn hơn'); page.locator('#cv250-pin').click(); page.wait_for_selector('#cv250-review-list [data-comment]')
    page.locator('#cv250-review-list [data-comment] button').click()
    ck('comment can be pinned and resolved', text('#cv250-review-list [data-comment]').startswith('✓'))
    r = page.evaluate("""()=>{const v=CVCollabLiteP246.snapshot('v1').snapshot;const p=CVCreativeCore.active;const old=p.documents.briefPack.documents.slides.slides[0].title;p.documents.briefPack.documents.slides.slides[0].title='Mới';
      const diff=CVStudioCompleteP250.compare(v.id);const ok=CVStudioCompleteP250.restoreVersion(v.id);return {n:diff.length,hit:diff.some(x=>x.after==='Mới'),ok,back:p.documents.briefPack.documents.slides.slides[0].title===old,kept:p.documents.collaborationLite.versions.some(x=>x.label==='Trước khi khôi phục')}}""")
    ck('versions compare and restore with a safety copy', r['n'] >= 1 and r['hit'] and r['ok'] and r['back'] and r['kept'])
    ck('review file round-trips without duplicates and rejects junk', page.evaluate("""async()=>{const t=await CVStudioCompleteP250.exportReview().text();const a=CVStudioCompleteP250.importReview(t);const b=CVStudioCompleteP250.importReview(JSON.stringify({format:'CANVIO_REVIEW',comments:[{id:'z',text:'<img src=x onerror=1>'}]}));let junk=false;try{CVStudioCompleteP250.importReview('{}')}catch(e){junk=true}return a===0&&b===1&&junk}"""))
    page.locator('#cv250-review-show').click()
    ck('imported text is shown as text only', page.evaluate("document.querySelector('#cv250-review-list img')===null"))
    # device
    page.locator('#cv250-device-run').click(); page.wait_for_function("/Gợi ý/.test(document.querySelector('#cv250-device .cv250-status').textContent)", timeout=30000)
    ck('device check reports measurements', 'ms' in text('#cv250-device .cv250-status'))
    # video: captions, beat arrangement, full bundle
    wav = io.BytesIO()
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(8000)
        w.writeframes(b''.join(struct.pack('<h', int(26000*math.sin(i*0.7)) if (i % 4000) < 600 else 0) for i in range(8000*12)))
    png = base64.b64decode(page.evaluate("(()=>{const c=document.createElement('canvas');c.width=c.height=64;c.getContext('2d').fillRect(0,0,64,64);return c.toDataURL().split(',')[1]})()"))
    page.evaluate("CV.go('videoEngine')"); page.wait_for_timeout(2500)
    ids = page.evaluate("""async b=>{const v=CV.engines.video,s=v._state(),bytes=Uint8Array.from(atob(b),c=>c.charCodeAt(0));
      v.restoreState({clips:[1,2,3].map(i=>({id:'c'+i,mediaId:'m'+i,type:'image',name:'Ảnh '+i,track:1,start:(i-1)*5,duration:5})).concat([{id:'cap',type:'text',track:3,name:'Caption',text:'Xin chào',start:0,duration:2}]),selected:null,duration:20,time:0,tracks:s.tracks});
      for(const i of [1,2,3])await CVStudioCompleteP250.putMedia('m'+i,new Blob([bytes,new Uint8Array([i])],{type:'image/png'}));v.commit();return s.clips.length}""", base64.b64encode(png).decode())
    page.evaluate("CVStudioCompleteP250.openStudio()")
    page.locator('#cv250-cue-list').click(); cue = page.locator('#cv250-cues input[data-cue=cap]'); cue.fill('Chào bạn'); cue.dispatch_event('change')
    ck('caption lines are edited through the Video owner', page.evaluate("CV.engines.video._state().clips.find(c=>c.id==='cap').text==='Chào bạn'"))
    page.evaluate("CV.engines.video.undo()")
    ck('caption edit can be undone', page.evaluate("CV.engines.video._state().clips.find(c=>c.id==='cap').text==='Xin chào'"))
    page.evaluate("CVStudioCompleteP250.openStudio()")
    page.locator('#cv245-file').set_input_files({'name': 'beat.wav', 'mimeType': 'audio/wav', 'buffer': wav.getvalue()}); page.locator('#cv250-every').select_option('4'); page.locator('#cv250-arrange').click()
    page.wait_for_function("/Đã xếp|Cần|Có clip/.test(document.querySelector('#cv250-beat .cv250-status').textContent)", timeout=40000)
    clips = page.evaluate("CV.engines.video._state().clips.filter(c=>c.track===1).sort((a,b)=>a.start-b.start).map(c=>[c.start,c.duration])")
    print('beat', clips, text('#cv250-beat .cv250-status'))
    ck('scenes are placed back to back on the beat', len(clips) == 3 and all(abs(clips[i][0]+clips[i][1]-clips[i+1][0]) < .01 for i in range(2)) and all(abs(c[1]-2) < .15 for c in clips))
    page.evaluate("CV.engines.video.undo()")
    ck('arrangement is one undo step', page.evaluate("CV.engines.video._state().clips.find(c=>c.id==='c2').start===5"))
    r = page.evaluate("""async()=>{const x=await CVStudioCompleteP250.exportFull();const v=CV.engines.video;const before=JSON.stringify(v.snapshotState().clips);
      v.restoreState({clips:[],selected:null,duration:20,time:0,tracks:v._state().tracks});v.commit();v._state().fileRefs={};
      await new Promise(res=>{const q=indexedDB.open('CANVIO_81_MEDIA',1);q.onsuccess=()=>{const t=q.result.transaction('media','readwrite');t.objectStore('media').clear();t.oncomplete=()=>{q.result.close();res()}}});
      const y=await CVStudioCompleteP250.importFull(x.blob,()=>true);const m=await CVStudioCompleteP250.getMedia('m2');
      const bytes=new Uint8Array(await x.blob.arrayBuffer());bytes[bytes.length>>1]^=1;let tampered=false;try{await CVStudioCompleteP250.importFull(new Blob([bytes]),()=>true)}catch(e){tampered=true}
      return {n:x.media,skip:x.skipped,ok:y.ok,same:JSON.stringify(v.snapshotState().clips)===before,media:!!m&&m.size>0,tampered}}""")
    print('bundle', r)
    ck('full bundle restores timeline and media after wipe', r['n'] == 3 and r['ok'] and r['same'] and r['media'])
    ck('damaged bundle is rejected', r['tampered'])
    page.set_viewport_size({'width': 390, 'height': 844}); page.evaluate("CVStudioCompleteP250.openStudio()"); page.wait_for_timeout(1200)
    wide = page.evaluate("[...document.querySelectorAll('.cv250')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.id)")
    ck('panels fit a phone screen', not wide); print(wide) if wide else None
    page.set_viewport_size({'width': 1440, 'height': 900}); page.wait_for_timeout(600)
    if os.environ.get('SHOT'):
        page.evaluate("document.querySelector('#cv250-decks').scrollIntoView()"); page.screenshot(path=os.environ['SHOT'])
        open(os.environ['SHOT'] + '.slides.pdf', 'wb').write(a); open(os.environ['SHOT'] + '.board.pdf', 'wb').write(b); open(os.environ['SHOT'] + '.html', 'w').write(site)
    ck('no uncaught JavaScript errors', not errors)
    if errors: print(errors)
    browser.close()
server.shutdown()
print('P250 Chromium assertions: %d/%d passed' % (sum(checks), len(checks)))
raise SystemExit(0 if all(checks) else 1)
