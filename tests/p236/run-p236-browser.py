import os, json, shutil
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
checks=[]; errors=[]
def ck(name,ok):
    checks.append((name,bool(ok))); print(('PASS ' if ok else 'FAIL ')+name)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('google-chrome') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-gpu'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    html=open(os.path.join(ROOT,'index.html'),encoding='utf-8').read()
    shim="""<script>(function(){const s={};const st={getItem:k=>Object.prototype.hasOwnProperty.call(s,k)?s[k]:null,setItem:(k,v)=>s[k]=String(v),removeItem:k=>delete s[k],clear:()=>Object.keys(s).forEach(k=>delete s[k]),key:i=>Object.keys(s)[i]||null,get length(){return Object.keys(s).length}};try{Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true})}catch(e){}})();</script>"""
    html=html.replace('<head>','<head>'+shim,1)
    page.set_content(html,wait_until='domcontentloaded',timeout=120000)
    page.wait_for_function("!!window.CVEditorExperienceP236 && !!document.querySelector('#cv231-shell-poster .cv236-focus-exit')",timeout=90000)
    page.evaluate("CV.go('poster')")
    shell=page.locator('#cv231-shell-poster')
    shell.locator('[data-cv236-action="focus"]').click()
    ck('Focus mode hides the top bar',shell.evaluate("e=>e.classList.contains('cv236-focus') && getComputedStyle(e.querySelector('.cv231-top')).display==='none'"))
    shell.locator('.cv236-focus-exit').click()
    ck('Focus mode can be exited without losing editor controls',shell.evaluate("e=>!e.classList.contains('cv236-focus') && getComputedStyle(e.querySelector('.cv231-top')).display!=='none'"))
    shell.locator('[data-cv236-action="guide"]').click()
    ck('Three-step onboarding opens as an accessible dialog',shell.locator('[role="dialog"].cv236-tour').count()==1)
    shell.locator('.cv236-tour button.primary').click()
    ck('Onboarding advances to the next step',shell.locator('.cv236-tour-title').inner_text().startswith('2'))
    shell.locator('.cv236-tour button.primary').click()
    shell.locator('.cv236-tour button.primary').click()
    ck('Onboarding completes and closes',shell.locator('.cv236-tour').count()==0)
    shell.locator('[data-cv231-action="toggle-rail"]').click()
    page.wait_for_timeout(120)
    pref=page.evaluate("JSON.parse(localStorage.getItem('canvio.p236.shell.poster')||'{}')")
    ck('Collapsed rail state persists under the Poster editor key',pref.get('rail') is True)
    # Layout acceptance matrix: five widths x four editors.
    matrix=['poster','videoEngine','pixelStudio','layoutFoundry']
    sizes=[(1920,1080),(1440,900),(1280,720),(1024,768),(390,844)]
    for width,height in sizes:
        page.set_viewport_size({'width':width,'height':height})
        for pid in matrix:
            page.evaluate("id=>CV.go(id)",pid)
            page.wait_for_timeout(60)
            ok=page.evaluate("""id=>{const s=document.querySelector('#cv231-shell-'+id),l=s&&s.querySelector('.cv231-layout'),c=s&&s.querySelector('.cv231-canvas');return !!(s&&!s.hidden&&s.clientWidth>=s.scrollWidth-2&&l.clientWidth>0&&c.clientWidth>0&&l.clientWidth>=l.scrollWidth-2)}""",pid)
            ck('%dpx %s shell/canvas fits viewport'%(width,pid),ok)
    ck('P236 exposes per-editor experience and tour checks',page.evaluate("CVEditorExperienceP236.tests().threeStepTour===true"))
    ck('No uncaught JavaScript page errors',len(errors)==0)
    if errors: print('PAGE_ERRORS '+repr(errors))
    browser.close()
failed=[n for n,v in checks if not v]
print('%d/%d P236 browser assertions passed'%(len(checks)-len(failed),len(checks)))
if failed: raise SystemExit('Failures: '+', '.join(failed))
if errors: raise SystemExit('Uncaught page errors: '+repr(errors))
