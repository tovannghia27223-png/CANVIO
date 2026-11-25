import os, shutil
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
    page.wait_for_function("!!window.CVVideoShellP233 && CVVideoShellP233.state().mounted",timeout=90000)
    page.evaluate("CV.go('videoEngine')")
    page.wait_for_function("!!document.querySelector('#cv231-shell-videoEngine:not([hidden])')",timeout=30000)
    mapped=page.evaluate("""()=>({
      toolbar:!!document.querySelector('#cv231-shell-videoEngine .cv231-actions>.engine-toolbar'),
      preview:!!document.querySelector('#cv231-shell-videoEngine .cv231-canvas #vtCanvas'),
      props:!!document.querySelector('#cv231-shell-videoEngine .cv231-props #vtProps'),
      assets:!!document.querySelector('#cv231-shell-videoEngine .cv231-rail #vtAssetPicker'),
      externalEditor:!!document.querySelector('#cv231-shell-videoEngine .cv231-props a[href^="https://reframe-os.netlify.app/"]'),
      timeline:!!document.querySelector('#cv231-shell-videoEngine .cv231-bottom #vtTimeline'),
      bottomVisible:!document.querySelector('#cv231-shell-videoEngine .cv231-bottom').hidden
    })""")
    for k,v in mapped.items(): ck('Video shell native '+k+' is mounted',v)
    ck('P233 state reports mounted and preserves native engine',page.evaluate("CVVideoShellP233.state().mounted && CV.engines.video._state()!==null"))
    page.locator('#cv231-shell-videoEngine [data-cv231-action="legacy"]').click()
    page.wait_for_function("document.querySelector('#cv231-shell-videoEngine').hidden")
    restored=page.evaluate("""()=>({
      canvasBack:document.querySelector('#page-videoEngine #vtCanvas')?.closest('.grid.g2')?.parentElement===document.querySelector('#page-videoEngine'),
      timelineBack:!!document.querySelector('#page-videoEngine>#vtTimeline') || !!document.querySelector('#page-videoEngine .card #vtTimeline'),
      pageActive:document.querySelector('#page-videoEngine').classList.contains('active')
    })""")
    ck('Legacy layout restores the original video preview DOM',restored['canvasBack'])
    ck('Legacy layout restores the External editor card',!!document.querySelector('#page-videoEngine .grid.g2 a[href^="https://reframe-os.netlify.app/"]'))
    page.locator('#page-videoEngine [data-cv231-launch]').click()
    page.wait_for_function("!document.querySelector('#cv231-shell-videoEngine').hidden")
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(250)
    mobile=page.evaluate("""()=>{const s=document.querySelector('#cv231-shell-videoEngine'),l=s.querySelector('.cv231-layout'),b=s.querySelector('.cv231-bottom');return {shell:s.clientWidth>=s.scrollWidth-1,layout:l.clientWidth>=l.scrollWidth-1,bottom:b.getBoundingClientRect().height>=100,canvas:!!s.querySelector('.cv231-canvas #vtCanvas')}}""")
    ck('390px Video shell does not overflow horizontally',mobile['shell'] and mobile['layout'])
    ck('390px Video preview and fixed bottom timeline remain visible',mobile['bottom'] and mobile['canvas'])
    ck('No uncaught JavaScript page errors',len(errors)==0)
    if errors: print('PAGE_ERRORS '+repr(errors))
    browser.close()
failed=[n for n,v in checks if not v]
print('%d/%d P233 browser assertions passed'%(len(checks)-len(failed),len(checks)))
if failed: raise SystemExit('Failures: '+', '.join(failed))
if errors: raise SystemExit('Uncaught page errors: '+repr(errors))
