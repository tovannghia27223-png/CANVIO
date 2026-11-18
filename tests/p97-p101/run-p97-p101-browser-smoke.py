#!/usr/bin/env python3
"""Chromium functional smoke for CANVIO P97–P101 on opaque about:blank.
Storage shims are test-only. This is not real-origin/media production acceptance.
"""
from __future__ import annotations
import json, os, re, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
REPORT = Path(__file__).with_name('browser-smoke-report.json')
EXPECTED_VERSION = '23.3.108-p85-studio-r2'
EXPECTED_TITLE = 'CANVIO 23.3.108 — Creative Runtime Lab · P85 Runtime Hardening r2'
SHIM = r'''<script id="canvio-p101-test-storage-shim">(()=>{function make(){const m=new Map();return{get length(){return m.size},key(i){return Array.from(m.keys())[i]??null},getItem(k){return m.has(String(k))?m.get(String(k)):null},setItem(k,v){m.set(String(k),String(v))},removeItem(k){m.delete(String(k))},clear(){m.clear()}}}Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});})();</script>'''
checks=[]
def require(ok,name,detail=''):
    if not ok: raise AssertionError(name + (': '+detail if detail else ''))
    checks.append({'id':name,'status':'pass','detail':detail})
    print('PASS',name,detail)

def main():
    source=(ROOT/'index.html').read_text(encoding='utf-8')
    source=re.sub(r'^(\s*<!doctype[^>]*>)',lambda m:m.group(1)+SHIM,source,count=1,flags=re.I)
    errors=[]; console_errors=[]
    with sync_playwright() as p:
        exe=os.environ.get('CHROMIUM_EXECUTABLE_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
        browser=p.chromium.launch(headless=True,executable_path=exe,args=['--no-sandbox','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:console_errors.append(m.text[:500]) if m.type=='error' else None)
        page.route('https://fonts.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='text/css',body=''))
        page.route('https://fonts.gstatic.com/**',lambda r:r.fulfill(status=200,content_type='font/woff2',body=b''))
        page.set_content(source,wait_until='domcontentloaded',timeout=90000)
        page.wait_for_timeout(4000)
        build=page.evaluate('window.CANVIO_BUILD && CANVIO_BUILD.version')
        require(build==EXPECTED_VERSION,'P84 final candidate build marker',str(build))
        require(page.title()==EXPECTED_TITLE,'Latest candidate document title',page.title())
        page.evaluate("CV.go('videoEngine')")
        page.wait_for_timeout(1300)
        require(page.locator('#cv97-p101-panel').count()==1,'P97–P101 panel mounts')
        suite=page.evaluate('CANVIOVideoUXSuite.tests()')
        failed={k:v for k,v in suite.get('checks',{}).items() if v is not True}
        require(suite.get('status')=='PASS_LOCAL_ASSERTIONS' and suite.get('passed')==suite.get('total'),'P97–P101 source assertions',json.dumps(failed,ensure_ascii=False))
        require(not page.evaluate('''() => {const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return ids.filter((x,i)=>ids.indexOf(x)!==i)}'''),'No duplicate DOM IDs after Video page mount')
        # Seed a synthetic local timeline through the canonical Video Engine owner.
        seeded=page.evaluate('''() => {
          const v=CV.engines.video;
          return v.restoreState({clips:[
            {id:'p101-video',name:'Synthetic footage',type:'video',start:0,duration:12,track:1,speed:1,mediaId:'missing-video-blob'},
            {id:'p101-caption',name:'Synthetic Whisper caption',type:'text',text:'Hello world from CANVIO',start:1,duration:4,track:3},
            {id:'p101-audio',name:'Synthetic audio',type:'audio',start:14,duration:5,track:2,mediaId:'missing-audio-blob'}
          ],selected:'p101-video',duration:30,time:0,tracks:{}});
        }''')
        require(seeded,'Seed synthetic timeline through canonical Video Engine')
        # P97 planner, preview, explicit apply, guarded undo.
        page.locator('#cv97-command').fill('Tốc độ 2x')
        page.locator('#cv97-plan').click()
        require(not page.locator('#cv97-apply').is_disabled(),'P97 creates a preview before mutation')
        preview=page.locator('#cv97-preview').inner_text()
        require('2×' in preview and 'Chưa có thay đổi nào' in preview,'P97 preview describes planned speed change',preview[:180])
        page.locator('#cv97-apply').click()
        speed=page.evaluate("CV.engines.video._state().clips.find(c=>c.id==='p101-video').speed")
        require(speed==2,'P97 applies requested 2x speed to selected canonical clip',str(speed))
        page.locator('#cv97-undo').click()
        speed=page.evaluate("CV.engines.video._state().clips.find(c=>c.id==='p101-video').speed")
        require(speed==1,'P97 undo restores previous clip speed',str(speed))
        page.locator('#cv97-command').fill('lệnh không có thật')
        page.locator('#cv97-plan').click()
        require(page.locator('#cv97-apply').is_disabled(),'P97 rejects an unknown command safely')
        # P98 shortcuts respect editor input and only dispatch implemented tools.
        page.locator('#cv97-command').focus()
        page.keyboard.press('b')
        count_input=page.evaluate("CV.engines.video._state().clips.length")
        require(count_input==3,'P98 ignores shortcuts while an input is focused')
        page.locator('body').click(position={'x':5,'y':5})
        page.evaluate("CV.engines.video.seek(4)")
        page.keyboard.press('b')
        count_split=page.evaluate("CV.engines.video._state().clips.length")
        require(count_split==4,'P98 B shortcut invokes canonical Video Engine split',str(count_split))
        page.locator('body').click(position={'x':5,'y':5})
        page.keyboard.press('v')
        require(page.evaluate("document.activeElement && document.activeElement.id==='vtTimeline'"),'P98 V shortcut focuses canonical timeline')
        require(page.locator('[data-cv98-tool="select"]').count()==1 and page.locator('#cv97-p101-panel button[disabled][title]').count()==3,'P98 labels available tools and truthfully disables unsupported modes',json.dumps({'select':page.locator('[data-cv98-tool="select"]').count(),'disabled':page.locator('#cv97-p101-panel button[disabled][title]').count(),'titles':page.locator('#cv97-p101-panel button[disabled]').evaluate_all('(xs)=>xs.map(x=>x.title)')}))
        # Re-seed a clean subtitle cue and test P99 word cue output.
        page.evaluate('''() => CV.engines.video.restoreState({clips:[
          {id:'p101-video',name:'Synthetic footage',type:'video',start:0,duration:12,track:1,speed:1,mediaId:'missing-video-blob'},
          {id:'p101-caption',name:'Synthetic Whisper caption',type:'text',text:'Hello world from CANVIO',start:1,duration:4,track:3},
          {id:'p101-audio',name:'Synthetic audio',type:'audio',start:14,duration:5,track:2,mediaId:'missing-audio-blob'}
        ],selected:'p101-caption',duration:30,time:0,tracks:{}})''')
        page.locator('#cv99-refresh').click()
        page.locator('#cv99-cue-select').select_option('p101-caption')
        page.locator('#cv99-preview-btn').click()
        word_preview=page.locator('#cv99-preview').inner_text()
        require('4 cue từ sẽ được tạo' in word_preview and 'ước lượng' in word_preview.lower(),'P99 previews estimated per-word captions',word_preview[:220])
        page.locator('#cv99-apply').click()
        words=page.evaluate("CV.engines.video._state().clips.filter(c=>c.type==='text').map(c=>({text:c.text,accuracy:c.timingAccuracy}))")
        require([x['text'] for x in words]==['Hello','world','from','CANVIO'] and all(x['accuracy']=='estimated-segment-proportional' for x in words),'P99 inserts word cues into canonical text track with estimate metadata',json.dumps(words,ensure_ascii=False))
        # P100 transcript edit via current text track.
        first_word=page.evaluate("CV.engines.video._state().clips.find(c=>c.type==='text').id")
        page.locator('#cv100-refresh').click()
        page.locator('#cv100-cue-select').select_option(first_word)
        page.locator('#cv100-transcript-text').fill('Hello updated')
        page.locator('#cv100-save-text').click()
        edited=page.evaluate("(id)=>CV.engines.video._state().clips.find(c=>c.id===id).text",first_word)
        require(edited=='Hello updated','P100 saves transcript edits to canonical cue',str(edited))
        # P100 ripple plan is routed through P64 and refuses locked tracks.
        page.locator('#cv100-ripple-start').fill('2.00')
        page.locator('#cv100-ripple-end').fill('3.00')
        page.locator('#cv100-ripple-preview-btn').click()
        require(not page.locator('#cv100-ripple-apply').is_disabled(),'P100 creates ripple preview through P64',page.locator('#cv100-ripple-preview').inner_text()[:180])
        page.evaluate("CV.engines.video.toggleTrack(3, 'locked')")
        page.locator('#cv100-ripple-preview-btn').click()
        blocked=page.locator('#cv100-ripple-preview').inner_text()
        require(page.locator('#cv100-ripple-apply').is_disabled() and ('khóa' in blocked.lower() or 'locked' in blocked.lower()),'P100 blocks ripple affecting a locked track',blocked[:180])
        # P101 bounded export options and codec disclosure.
        options=page.evaluate("CANVIOVideoUXSuite.normalizeExportOptions({resolution:'2160',fps:60,bitrateMbps:40})")
        require(options=={'width':3840,'height':2160,'fps':60,'videoBitsPerSecond':20000000,'resolution':'2160'},'P101 clamps export controls to supported range',json.dumps(options))
        caps=page.evaluate('CV.engines.video.exportCapabilities()')
        require(page.locator('#cv101-format option[value="mp4"]').is_disabled() == (not caps['h264Supported']),'P101 MP4 option matches browser H.264 capability',json.dumps(caps))
        require(page.locator('#cv101-srt').count()==1 and page.locator('#cv101-vtt').count()==1,'P101 exposes optional subtitle sidecars')
        # P104: seed two actual PNG files into the existing Asset Library, then create a Ken Burns slideshow.
        seed_assets=page.evaluate('''async () => {
          const canvas=document.createElement('canvas');canvas.width=16;canvas.height=16;
          const ctx=canvas.getContext('2d');ctx.fillStyle='#e25b48';ctx.fillRect(0,0,8,16);ctx.fillStyle='#2466ca';ctx.fillRect(8,0,8,16);
          const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
          if(!blob) throw new Error('PNG fixture failed');
          await CV.assets.addBlob(new File([blob],'KenBurns A.png',{type:'image/png'}));
          await CV.assets.addBlob(new File([blob],'KenBurns B.png',{type:'image/png'}));
          return CV.assets.list().filter(a=>String(a.mime||'').indexOf('image/')===0&&a.data).slice(0,2).map(a=>({id:a.id,name:a.name,size:a.size}));
        }''')
        require(len(seed_assets)==2,'P104 reuses two images in existing Asset Library',json.dumps(seed_assets,ensure_ascii=False))
        page.locator('#cv104-refresh').click()
        require(page.locator('#cv104-assets [data-cv104-asset]').count()==2,'P104 displays Asset Library image checkboxes')
        page.locator('#cv104-assets [data-cv104-asset]').nth(0).check()
        page.locator('#cv104-assets [data-cv104-asset]').nth(1).check()
        page.locator('#cv104-duration').select_option('3')
        page.locator('#cv104-transition').select_option('0.5')
        page.locator('#cv104-mode').select_option('pan-left')
        page.evaluate("CV.engines.video.toggleTrack(1, 'locked')")
        page.locator('#cv104-preview-btn').click()
        locked_preview=page.locator('#cv104-preview').inner_text()
        require(page.locator('#cv104-apply').is_disabled() and 'khóa' in locked_preview.lower(),'P104 refuses slideshow creation when image/video track is locked',locked_preview[:180])
        page.evaluate("CV.engines.video.toggleTrack(1, 'locked')")
        page.locator('#cv104-preview-btn').click()
        p104_preview=page.locator('#cv104-preview').inner_text()
        require('2 ảnh' in p104_preview and '3.00 giây/ảnh' in p104_preview,'P104 previews image count, clip duration and transition',p104_preview[:220])
        page.locator('#cv104-apply').click()
        page.wait_for_timeout(1200)
        slideshow=page.evaluate('''() => CV.engines.video._state().clips.filter(c=>c.type==='image'&&/^KenBurns/.test(c.name)).sort((a,b)=>a.start-b.start).map(c=>({name:c.name,start:c.start,duration:c.duration,from:c.motion&&c.motion.from,to:c.motion&&c.motion.to,transition:c.fx&&c.fx.trans}))''')
        require(len(slideshow)==2 and all(x['duration']==3 and x['from']['x']==72 and x['to']['x']==-72 for x in slideshow),'P104 imports images and applies local Ken Burns keyframes',json.dumps(slideshow,ensure_ascii=False))
        require(abs(slideshow[1]['start']-slideshow[0]['start']-2.5)<0.01 and all(x['transition']=='fade' for x in slideshow),'P104 creates sequential slideshow with 0.5s overlap fade',json.dumps(slideshow,ensure_ascii=False))
        p104_undo=page.evaluate('''() => {const v=CV.engines.video;const before=v._state().clips.filter(c=>c.type==='image').length;const ok=v.undoAuto();const after=v._state().clips.filter(c=>c.type==='image').length;return {ok,before,after}}''')
        require(p104_undo['ok'] and p104_undo['after']==0,'P104 one canonical Undo removes the slideshow batch',json.dumps(p104_undo))
        # Attempt a short synthetic WebM render at 480p; report actual browser result only.
        page.evaluate("() => {const s=CV.engines.video._state();s.duration=0.5;s.time=0;CV.engines.video.commit();}")
        blob_info=page.evaluate('''async () => {
          const v=CV.engines.video; const b=await v.exportWebM({width:854,height:480,fps:24,videoBitsPerSecond:1000000,download:false});
          if(!b) return {ok:false,reason:'export returned null'};
          const q=await CANVIOVideoUXSuite.inspectExportBlob(b,'webm',0.5);
          return {ok:!!q.ok,mime:b.type,bytes:b.size,qc:q};
        }''')
        require(blob_info['ok'] and blob_info['mime'].startswith('video/webm') and blob_info['bytes']>0,'P101 synthetic WebM render, MIME and canplay QC',json.dumps(blob_info,ensure_ascii=False)[:1000])
        # P104 static/owner assertions remain green after the functional import test.
        p104=page.evaluate('CANVIOKenBurnsSuite.tests()')
        p104_failed={k:v for k,v in p104.get('checks',{}).items() if v is not True}
        require(p104.get('status')=='PASS_LOCAL_ASSERTIONS','P104 Ken Burns owner/source assertions',json.dumps(p104_failed,ensure_ascii=False))
        # Inherited P68-P70 fail-closed gate must remain blocked with 14 open real-world gates.
        gate=page.evaluate('''() => {const g=CANVIOStableRelease.inspect();return {pending:g.gateSummary.pending,total:g.manualGates.length,certified:g.releaseCertified,status:g.status}}''')
        require(gate=={'pending':14,'total':14,'certified':False,'status':'BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE'},'P70 release gate remains fail-closed',json.dumps(gate))
        require(not errors,'No uncaught application errors',json.dumps(errors[:5]))
        require(not console_errors,'No console errors in P97-P101 smoke',json.dumps(console_errors[:5]))
        results={'format':'CANVIO_P97_P101_P104_P87_CHROMIUM_SMOKE','candidate':'23.3.108-p85-studio-r2','browser':browser.version,'origin':'about:blank','testOnlyStorageShim':True,'checks':checks,'passed':len(checks),'total':len(checks),'status':'PASS_SYNTHETIC_BROWSER_SMOKE','limitations':['Opaque about:blank with test storage shims; no native IndexedDB/browser restart acceptance.','Synthetic media only; no real footage, Whisper model inference, A/V sync or long-form export acceptance.','No HTTPS, CSP, hosting, Safari/Edge or target-device acceptance.','P99 word timings are proportional estimates, not acoustic alignment.','P101 QC is MIME/metadata/canplay only, not full-file or A/V sync certification.','P70 remains fail-closed with fourteen real-world gates open.']}
        REPORT.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
        print(f"P97–P101 Chromium smoke: {len(checks)}/{len(checks)} PASS")
        browser.close()
if __name__=='__main__': main()
