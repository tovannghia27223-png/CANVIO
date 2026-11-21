#!/usr/bin/env python3
"""P119.4 hosted Chromium checks for the existing Website Motion Builder and shared P119 easing owner."""
import json, os, sys, threading, http.server, socketserver, functools, shutil
from playwright.sync_api import sync_playwright

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Quiet,directory=ROOT))
server.daemon_threads=True
threading.Thread(target=server.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%server.server_address[1]
checks={};errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page=browser.new_page(viewport={'width':1280,'height':900},reduced_motion='reduce')
    page.on('pageerror',lambda e:errors.append(str(e)[:240]))
    page.goto(url,wait_until='commit',timeout=60000)
    page.wait_for_function("!!(window.CV&&CV.go&&window.CVEasingP119&&window.CVWebsiteEasingP119&&window.CVWebsiteMotionBuilder)",timeout=90000,polling=500)
    page.evaluate("CV.go('motion')")
    page.wait_for_selector('#motionEase',timeout=30000)
    page.evaluate("""()=>{
      const sel=document.getElementById('motionEase'),value='cubic-bezier(0.1,0.2,0.3,0.4)';
      let option=Array.from(sel.options).find(x=>x.value===value);
      if(!option){option=document.createElement('option');option.value=value;option.textContent='P119.4 browser fixture';sel.appendChild(option);}
      sel.value=value;sel.dispatchEvent(new Event('change',{bubbles:true}));
    }""")
    page.evaluate("CV.go('webEngine')")
    page.wait_for_selector('#canvio-web-motion',timeout=45000)
    page.wait_for_selector('#cv119w-from-motion',timeout=15000)
    checks['adapterMountsOnExistingWebsiteMotionPanel']=page.locator('#cv119w-from-motion').count()==1
    checks['allSixP119PresetsAreAddedFromSharedRegistry']=page.locator('#canvio-motion-easing optgroup[data-cv119w-presets] option').count()==6
    state=page.evaluate("""()=>{
      const api=CVWebsiteEasingP119;
      return api.presetOptions().every(x=>CVEasingP119.css(CVEasingP119.PRESETS[x.name])===x.value);
    }""")
    checks['websitePresetValuesMatchMotionRegistryExactly']=bool(state)
    page.evaluate("""()=>{
      const current=CV.engines&&CV.engines.web;
      window.__p1194Saved=0;
      if(current){window.__p1194OriginalSave=current.save;current.save=function(){window.__p1194Saved++;return true;};}
      const data={};
      const component={
        addAttributes(values){for(const [key,value] of Object.entries(values)){if(value===null)delete data[key];else data[key]=value;}},
        addStyle(values){data.style=Object.assign(data.style||{},values);for(const [key,value] of Object.entries(values)){if(value===null)delete data.style[key];}},
        getAttributes(){return Object.assign({},data);},
        getStyle(){return Object.assign({},data.style||{});}
      };
      window.__p1194Component=component;
      window.__p1194OldCVWeb=window.CVWeb;
      window.CVWeb={getSelected:()=>component,trigger:()=>{}};
    }""")
    page.select_option('#canvio-motion-easing','cubic-bezier(0.2,0.8,0.3,1)')
    checks['presetCanBeSelectedInWebsiteBuilder']=page.locator('#canvio-motion-easing').input_value()=='cubic-bezier(0.2,0.8,0.3,1)'
    page.click('#canvio-motion-apply')
    applied=page.evaluate("""()=>{
      const a=__p1194Component.getAttributes(),s=__p1194Component.getStyle();
      return a['data-canvio-motion-easing']==='cubic-bezier(0.2,0.8,0.3,1)'&&s['--canvio-motion-easing']==='cubic-bezier(0.2,0.8,0.3,1)';
    }""")
    checks['applyUsesExistingGrapesJSComponentAttributesAndStyles']=bool(applied)
    checks['applyUsesExistingWebsiteSaveOwner']=page.evaluate("window.__p1194Saved>0")
    injected=page.evaluate("""()=>{
      const html='<!doctype html><html><head></head><body><div data-canvio-motion="fade" style="--canvio-motion-easing:cubic-bezier(0.2,0.8,0.3,1)"></div></body></html>';
      return CVWebsiteMotionBuilder.inject(html);
    }""")
    checks['exportKeepsSharedEasingVariableAndReducedMotionFallback']='--canvio-motion-easing' in injected and 'prefers-reduced-motion:reduce' in injected
    # The Motion panel can be remounted when switching Studio tools. Set the active
    # Motion curve after Website Builder is mounted, then import it without applying.
    page.click('#canvio-motion-clear')
    page.evaluate("""()=>{
      const sel=document.getElementById('motionEase'),value='cubic-bezier(0.1,0.2,0.3,0.4)';
      if(!sel)throw new Error('Existing Motion easing control is unavailable');
      let option=Array.from(sel.options).find(x=>x.value===value);
      if(!option){option=document.createElement('option');option.value=value;option.textContent='P119.4 browser fixture';sel.appendChild(option);}
      sel.value=value;sel.dispatchEvent(new Event('change',{bubbles:true}));
    }""")
    page.click('#cv119w-from-motion')
    checks['customMotionCurveImportedWithoutPrematureApply']=page.locator('#canvio-motion-easing').input_value()=='cubic-bezier(0.1,0.2,0.3,0.4)' and page.evaluate("!__p1194Component.getAttributes()['data-canvio-motion-easing']")
    page.click('#canvio-motion-apply')
    checks['importedMotionCurveCommitsThroughWebsiteApply']=page.evaluate("__p1194Component.getAttributes()['data-canvio-motion-easing']==='cubic-bezier(0.1,0.2,0.3,0.4)'")
    page.click('#canvio-motion-clear')
    checks['clearRemovesExistingMotionMetadata']=page.evaluate("!__p1194Component.getAttributes()['data-canvio-motion-easing']&&!__p1194Component.getStyle()['--canvio-motion-easing']")
    before=page.locator('#canvio-motion-easing').input_value()
    page.evaluate("""()=>{
      const sel=document.getElementById('motionEase'),value='linear(0,0.5,1)';
      let option=Array.from(sel.options).find(x=>x.value===value);
      if(!option){option=document.createElement('option');option.value=value;option.textContent='Invalid spring fixture';sel.appendChild(option);}
      sel.value=value;sel.dispatchEvent(new Event('change',{bubbles:true}));
    }""")
    page.click('#cv119w-from-motion')
    checks['springLinearSyntaxRejectedWithoutChangingWebsiteSelection']=page.locator('#canvio-motion-easing').input_value()==before and 'linear()' in page.locator('#canvio-motion-status').inner_text()
    checks['zeroPageErrors']=len(errors)==0
    browser.close()
server.shutdown()
result={'suite':'CANVIO_P119_4_SHARED_WEBSITE_EASING_CHROMIUM','checks':checks,'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(result,ensure_ascii=False,indent=1))
sys.exit(1 if result['failed'] else 0)
