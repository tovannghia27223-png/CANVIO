import threading, http.server, socketserver, functools, os, shutil
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
server=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Quiet,directory=ROOT));server.daemon_threads=True
threading.Thread(target=server.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%server.server_address[1]
checks=[]; errors=[]
def ck(name,ok):
    checks.append((name,bool(ok))); print(('PASS ' if ok else 'FAIL ')+name)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('google-chrome') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-gpu'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.add_init_script("(function(){const s={};const st={getItem:k=>Object.prototype.hasOwnProperty.call(s,k)?s[k]:null,setItem:(k,v)=>s[k]=String(v),removeItem:k=>delete s[k],clear:()=>Object.keys(s).forEach(k=>delete s[k]),key:i=>Object.keys(s)[i]||null,get length(){return Object.keys(s).length}};try{Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true})}catch(e){}})();")
    page.goto(url,wait_until='domcontentloaded',timeout=120000)
    page.wait_for_function("window.CVNativeStudioShellP234 && CVNativeStudioShellP234.tests().allFourMounted",timeout=90000)
    matrix={
      'pixelStudio':['#pxCanvas','.cv231-canvas','#pxFile','.cv231-rail','#px-brightness','.cv231-props','[data-px="export"]','.cv231-bottom'],
      'colorStudio':['#clCanvas','.cv231-canvas','#clFile','.cv231-rail','#clControls','.cv231-props','[data-cl="export"]','.cv231-bottom'],
      'clarityLab':['#cyCanvas','.cv231-canvas','#cyFile','.cv231-rail','#cyScale','.cv231-props','[data-cy="export"]','.cv231-bottom'],
      'layoutFoundry':['#lfDoc','.cv231-canvas','#lfPages','.cv231-rail','#lfMargin','.cv231-props','.ne-toolbar','.cv231-actions']
    }
    for pid,parts in matrix.items():
        page.evaluate("id=>CV.go(id)",pid)
        page.wait_for_function("id=>document.querySelector('#page-'+id).classList.contains('active')",arg=pid)
        ok=page.evaluate("""p=>{const q=s=>document.querySelector('#cv231-shell-'+p+' '+s);return !!(q(parts[0])&&q(parts[1]+' '+parts[0])&&q(parts[2])&&q(parts[3]+' '+parts[2])&&q(parts[4])&&q(parts[5]+' '+parts[4])&&q(parts[6])&&q(parts[7]+' '+parts[6]))}""",{'parts':parts,'id':pid}) if False else page.evaluate("""x=>{const q=s=>document.querySelector('#cv231-shell-'+x.id+' '+s);return !!(q(x.parts[0])&&q(x.parts[1]+' '+x.parts[0])&&q(x.parts[2])&&q(x.parts[3]+' '+x.parts[2])&&q(x.parts[4])&&q(x.parts[5]+' '+x.parts[4])&&q(x.parts[6])&&q(x.parts[7]+' '+x.parts[6]))}""",{'id':pid,'parts':parts})
        ck(pid+' routes native tools, canvas, inspector and export to the shared shell',ok)
        page.locator('#cv231-shell-'+pid+' [data-cv231-action="legacy"]').click()
        page.wait_for_function("id=>document.querySelector('#cv231-shell-'+id).hidden",arg=pid)
        ck(pid+' retains a reversible legacy layout',page.evaluate("id=>!!document.querySelector('#page-'+id)",pid))
        page.evaluate("id=>CVEditorShellP231.toggle(id)",pid)
        page.wait_for_function("id=>!document.querySelector('#cv231-shell-'+id).hidden",arg=pid)
    ck('P234 exposes all four native studio adapters',page.evaluate("CVNativeStudioShellP234.tests().allFourMounted"))
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(250)
    mobile=page.evaluate("""()=>['pixelStudio','colorStudio','clarityLab','layoutFoundry'].every(id=>{const s=document.querySelector('#cv231-shell-'+id);return s&&s.clientWidth>=s.scrollWidth-1&&s.querySelector('.cv231-canvas').clientWidth>0&&s.querySelector('.cv231-canvas').scrollWidth>=s.querySelector('.cv231-canvas').clientWidth})""")
    ck('390px native editors have no horizontal shell/canvas overflow',mobile)
    ck('No uncaught JavaScript page errors',len(errors)==0)
    if errors: print('PAGE_ERRORS '+repr(errors))
    browser.close()
    server.shutdown();server.server_close()
failed=[n for n,v in checks if not v]
print('%d/%d P234 browser assertions passed'%(len(checks)-len(failed),len(checks)))
if failed: raise SystemExit('Failures: '+', '.join(failed))
if errors: raise SystemExit('Uncaught page errors: '+repr(errors))
