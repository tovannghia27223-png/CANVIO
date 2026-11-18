#!/usr/bin/env python3
"""Chromium smoke for CANVIO P68–P70 and the generated offline OBJ viewer.
Runs the real app source through Playwright set_content() on opaque about:blank.
A storage shim is test-only; this does NOT certify native persistence/HTTPS or Stable release.
"""
from __future__ import annotations
import json, os, re, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
REPORT = Path(__file__).with_name('p90-p96-browser-smoke-report.json')
EXPECTED_VERSION = '23.3.108-p85-studio-r2'
EXPECTED_TITLE = 'CANVIO 23.3.108 — Creative Runtime Lab · P85 Runtime Hardening r2'
SHIM = r'''<script id="canvio-p70-test-storage-shim">(()=>{function make(){const m=new Map();return{get length(){return m.size},key(i){return Array.from(m.keys())[i]??null},getItem(k){return m.has(String(k))?m.get(String(k)):null},setItem(k,v){m.set(String(k),String(v))},removeItem(k){m.delete(String(k))},clear(){m.clear()}}}Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});})();</script>'''

checks=[]
def require(ok, name, detail=''):
    if not ok: raise AssertionError(name + (': '+detail if detail else ''))
    checks.append({'id':name,'status':'pass','detail':detail})
    print('PASS',name,detail)

def main():
    source=(ROOT/'index.html').read_text(encoding='utf-8')
    source=re.sub(r'^(\s*<!doctype[^>]*>)', lambda m:m.group(1)+SHIM, source, count=1, flags=re.I)
    errors=[]; console_errors=[]
    with sync_playwright() as p:
        executable=os.environ.get('CHROMIUM_EXECUTABLE_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
        browser=p.chromium.launch(headless=True,executable_path=executable,args=['--no-sandbox','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:console_errors.append(m.text[:500]) if m.type=='error' else None)
        page.route('https://fonts.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='text/css',body=''))
        page.route('https://fonts.gstatic.com/**',lambda r:r.fulfill(status=200,content_type='font/woff2',body=b''))
        page.set_content(source,wait_until='domcontentloaded',timeout=90000)
        page.wait_for_timeout(4400)
        version=page.evaluate('window.CANVIO_BUILD && CANVIO_BUILD.version')
        require(version==EXPECTED_VERSION,'P84 latest candidate marker active',str(version))
        title=page.title()
        require(title==EXPECTED_TITLE,'P84 document title survives legacy observers',title)
        ux=page.evaluate('window.CANVIOUXSuite && CANVIOUXSuite.tests()')
        require(bool(ux),'P90–P96 UX suite is exposed')
        require(ux.get('status')=='PASS_LOCAL_UI_ASSERTIONS','P90–P96 internal UX assertions pass',json.dumps(ux.get('checks',{}),ensure_ascii=False))
        page.evaluate("CV.go('home')")
        page.wait_for_timeout(350)
        launch_count=page.locator('#cvux-home-launch [data-cvux-go]').count()
        require(launch_count==5,'P92 five goal-oriented Home launches mounted',str(launch_count))
        require(page.locator('#cvux-mode-toggle').count()==1,'P93 reversible Simple/Full mode toggle mounted')
        page.locator('#cvux-mode-toggle').evaluate('(b) => b.click()')
        require(page.locator('body.cvux-simple').count()==1,'P93 simple mode applies reversible nav filter')
        page.locator('#cvux-mode-toggle').evaluate('(b) => b.click()')
        require(page.locator('body.cvux-simple').count()==0,'P93 Show all returns to full mode')
        page.evaluate("CV.go('poster')")
        page.wait_for_timeout(150)
        require(page.locator('[data-cvux-bar="poster"]').count()==1,'P94 Poster/Slide action bar mounts')
        require(page.locator('[data-cvux-bar="poster"] [data-cvux-act="pdf-direct"]').count()==1,'P84 direct PDF action is surfaced on Poster/Slide')
        with page.expect_download(timeout=45000) as download_info:
            page.locator('[data-cvux-bar="poster"] [data-cvux-act="pdf-direct"]').click()
        pdf_download = download_info.value
        pdf_bytes = Path(pdf_download.path()).read_bytes()
        require(pdf_download.suggested_filename.endswith('.pdf') and pdf_bytes.startswith(b'%PDF-1.4'),'P84 direct PDF route generates a downloadable PDF',f'{pdf_download.suggested_filename} · {len(pdf_bytes)} bytes')
        require(b'/Subtype/Image' in pdf_bytes and b'/MediaBox' in pdf_bytes,'P84 PDF contains raster page image and page geometry',f'{len(pdf_bytes)} bytes')
        page.evaluate("CV.go('cvstudio')")
        page.wait_for_timeout(300)
        require(page.locator('[data-cvux-bar="cv"]').count()==1,'P94 CV action bar mounts')
        require(page.locator('[data-cvux-bar="cv"] [data-cvux-act="cv-docx"]').count()==1,'P87 editable DOCX action is surfaced in CV quick bar')
        for field, value in {'name':'CANVIO Smoke','title':'HR Specialist','headline':'HR Operations','summary':'Synthetic CV export check','email':'smoke@example.com','phone':'0900000000','exp':'HR Specialist | CANVIO | 2024–2026','edu':'Business Administration','skills':'Recruitment, Excel'}.items():
            field_input = page.locator('#page-cvstudio [data-k="' + field + '"]')
            if field_input.count(): field_input.fill(value)
        with page.expect_download(timeout=45000) as docx_download_info:
            page.locator('[data-cvux-bar="cv"] [data-cvux-act="cv-docx"]').click()
        docx_download = docx_download_info.value
        docx_bytes = Path(docx_download.path()).read_bytes()
        require(docx_download.suggested_filename.endswith('.docx') and docx_bytes[:2] == b'PK','P87 quick-bar action launches the existing editable DOCX export',f'{docx_download.suggested_filename} · {len(docx_bytes)} bytes')
        page.evaluate("CV.go('videoEngine')")
        page.wait_for_timeout(250)
        require(page.locator('[data-cvux-bar="video"]').count()==1,'P94 Video action bar mounts')
        palette_items=page.evaluate("CV.palette.build().filter(x=>x&&x.label).map(x=>x.label)")
        require('Xuất PDF trực tiếp · Poster / Slide' in palette_items and 'Mở Layout Foundry · in / lưu PDF' in palette_items and 'Tạo phụ đề bằng Whisper' in palette_items,'P84 direct PDF, browser-print PDF and subtitle commands are searchable')
        page.evaluate('CV.palette.open()')
        palette=page.locator('#palette')
        page.locator('#paletteInput').fill('xuat phu de')
        page.wait_for_timeout(100)
        require(page.locator('#paletteList .palItem').count()>0,'P91 accent-insensitive command search works')
        page.locator('#paletteInput').press('ArrowDown')
        page.locator('#paletteInput').press('Escape')
        require(page.locator('#palette').get_attribute('role')=='dialog','P95 command palette has dialog semantics')
        page.evaluate("localStorage.setItem('canvio:ux:onboarding-dismissed-v1','1')")
        page.evaluate("CV.go('home')")
        page.wait_for_timeout(100)
        require(page.locator('#cvux-onboarding').count()==0,'P96 onboarding dismissal persists in test storage')
        page.evaluate("CV.go('videoEngine')")
        page.wait_for_timeout(1000)
        require(page.locator('#cv-p68-p70-panel').count()==1,'P68–P70 control panel mounted in Video Engine')
        suite=page.evaluate('CANVIOPhaseSuite.tests()')
        failed={k:v for k,v in suite.items() if v is not True}
        require(not failed,'P47–P70 PhaseSuite flags all true',json.dumps(failed,ensure_ascii=False))
        api=page.evaluate('''() => ({p68:!!CANVIOOffline3D,p69:!!CANVIOSystemOptimizer,p70:!!CANVIOStableRelease,build:CANVIO_BUILD.version,phase:CANVIOPhase3.version})''')
        require(api['p68'] and api['p69'] and api['p70'] and api['phase']=='70.0.0','P68/P69/P70 APIs exposed',json.dumps(api))
        fixture='''# tetra-ish model\nv -1 -1 0\nv 1 -1 0\nv 0 1 0\nv 0 0 1\nf 1 2 3\nf 1 4 2\nf 2 4 3\nf 3 4 1'''
        package=page.evaluate('''obj => { const p=CANVIOOffline3D.buildFromOBJ(obj,{title:'Offline Smoke'}); return {html:p.html,triangles:p.mesh.triangleCount,preflight:p.preflight}; }''',fixture)
        require(package['triangles']==4 and package['preflight']['status']=='PASS','P68 packages real tetra OBJ geometry',json.dumps(package['preflight']))
        require('connect-src \'none\'' in package['html'] and 'mesh-data' in package['html'] and '<script src=' not in package['html'],'P68 viewer package embeds geometry and forbids external runtime')
        report=page.evaluate('''() => {const p=CANVIOSystemOptimizer.inspect();const gates=CANVIOStableRelease.inspect();return {nodes:p.scannedNodes,readOnly:p.readOnly,totals:p.totals,resourceCount:p.resources.count,phase1:gates.inheritedPhase1,phase2:gates.inheritedPhase2,gates:gates.manualGates.length,pending:gates.gateSummary.pending,status:gates.status,certified:gates.releaseCertified};}''')
        require(report['readOnly'] and report['gates']==14 and report['pending']==14 and report['certified'] is False and report['status']=='BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE','P69 audit + P70 release gate remain read-only and fail-closed',json.dumps(report,ensure_ascii=False))
        require(report['phase1']['invoked'] is False,'P70 summary does not auto-run asynchronous Phase 1 media probe')
        frame=page.evaluate('CANVIOSystemOptimizer.sampleFrames(300).then(x=>x)')
        require(frame['supported'] and frame['frames']>=5 and frame['noProjectMutation'],'P69 browser frame sampler runs',json.dumps(frame))
        # Open the generated package in a second isolated document and verify the viewer draws without network.
        viewer=browser.new_page(viewport={'width':1024,'height':768})
        viewer_errors=[]; viewer_requests=[]
        viewer.on('pageerror',lambda e:viewer_errors.append(str(e)))
        viewer.on('request',lambda r:viewer_requests.append(r.url))
        viewer.set_content(package['html'],wait_until='load')
        viewer.wait_for_timeout(150)
        canvas=viewer.locator('#view')
        canvas_size=canvas.evaluate('(c)=>({w:c.width,h:c.height})')
        pixels=canvas.evaluate('''c=>{const x=c.getContext('2d');const a=x.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<a.length;i+=4)if(a[i]||a[i+1]||a[i+2])n++;return n;}''')
        require(canvas_size['w']>0 and canvas_size['h']>0 and pixels>20,'Offline viewer renders mesh to canvas',f'{canvas_size}, nonblank pixels={pixels}')
        viewer.locator('#wire').click()
        require(viewer.locator('#wire').get_attribute('aria-pressed')=='true','Offline viewer wireframe control works')
        viewer.locator('#home').click()
        require(not viewer_errors and not viewer_requests,'Offline viewer runs without errors or network requests',json.dumps({'errors':viewer_errors,'requests':viewer_requests}))
        # Small viewport no-overflow check in CANVIO app.
        await_result=page.set_viewport_size({'width':375,'height':812})
        page.wait_for_timeout(250)
        overflow=page.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth')
        require(not overflow,'P70 panel has no horizontal overflow at 375px')
        require(not errors,'No uncaught application page errors',json.dumps(errors[:5]))
        require(not console_errors,'No console errors in app boot/smoke',json.dumps(console_errors[:5]))
        results={'format':'CANVIO_P84_P90_P96_CHROMIUM_SMOKE','candidate':'P84 partial + P90-P96','version':EXPECTED_VERSION,'browser':browser.version,'origin':'about:blank','testOnlyStorageShim':True,'limitations':['Opaque about:blank; native IndexedDB/HTTPS are not covered.','OBJ offline viewer smoke is an in-memory document, not a clean-machine offline acceptance test.','No Chrome/Edge/Safari matrix, real project restore, real A/V sync, Whisper inference, WCAG review or deployed hosting certificate.'],'summary':{'pass':len(checks),'fail':0},'uxSuite':ux,'checks':checks,'releaseCertified':False,'releaseStatus':report['status']}
        REPORT.write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
        browser.close()
    print(f'P84 + P90–P96 Chromium smoke: {len(checks)}/{len(checks)} PASS')

if __name__=='__main__': main()
