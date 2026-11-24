import json, threading, http.server, socketserver, functools, shutil, os, sys
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
h=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT)); h.daemon_threads=True
threading.Thread(target=h.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%h.server_address[1]
checks={}; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=shutil.which('google-chrome') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-gpu'])
    pg=b.new_page(viewport={'width':1400,'height':900}); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(url,wait_until='load',timeout=90000)
    pg.wait_for_function("!!window.CVCharacterStudioP169&&!!window.CVCharacterContinuityP163&&!!window.CVCreativeCore",timeout=90000)
    pg.evaluate("CVCreativeCore.create({name:'P169 character visual acceptance'})")
    pg.evaluate("CV.go('videoStudio')")
    pg.wait_for_selector('#cv159u-dock',timeout=15000)
    pg.click('#cv159u-dock [data-id=cv163-card]')
    pg.wait_for_selector('#cv163-card',state='visible',timeout=15000)
    pg.wait_for_selector('#cv169-panel',state='visible',timeout=15000)
    checks['panel_mounted']=pg.is_visible('#cv169-panel')
    checks['eight_labeled_controls']=pg.locator('#cv169-controls label').count()==8 and pg.locator('#cv169-controls label select').count()==8
    pg.fill('#cv163-name','Nhân vật nghiệm thu')
    pg.fill('#cv163-desc','Nhân vật thử nghiệm cho kiểm tra ngoại hình P169')
    pg.fill('#cv163-features','role=lead;hair=short;outfit=navy')
    pg.click('#cv163-save')
    pg.wait_for_function("document.querySelectorAll('#cv163-profile option').length>=1",timeout=10000)
    pg.select_option('#cv163-profile',index=0)
    pg.select_option('#cv169-controls select[data-field=face]','square')
    pg.select_option('#cv169-controls select[data-field=skin]','tan')
    pg.select_option('#cv169-controls select[data-field=hair]','long')
    pg.select_option('#cv169-controls select[data-field=hairColor]','brown')
    pg.select_option('#cv169-controls select[data-field=mark]','scar-right')
    pg.select_option('#cv169-controls select[data-field=outfit]','jacket')
    pg.select_option('#cv169-controls select[data-field=outfitColor]','red')
    pg.select_option('#cv169-controls select[data-field=accessory]','glasses')
    checks['preview_updates']=pg.locator('#cv169-preview svg').count()==1 and 'stroke="#8c5148"' in pg.inner_html('#cv169-preview')
    pg.click('#cv169-save')
    pg.wait_for_function("'Đã lưu vào hồ sơ nhân vật P163.'===document.querySelector('#cv169-msg').textContent",timeout=10000)
    checks['save_acknowledged']=True
    saved=pg.evaluate("""()=>{const id=document.querySelector('#cv163-profile').value;const p=CVCharacterContinuityP163.profile(id);const v=CVCharacterStudioP169.fromProfile(p);return {face:v.face,skin:v.skin,hair:v.hair,hairColor:v.hairColor,mark:v.mark,outfit:v.outfit,outfitColor:v.outfitColor,accessory:v.accessory,checks:p.checklist.filter(x=>x.indexOf('visual:')===0).length}}""")
    checks['P163_shared_profile_roundtrip']=saved=={'face':'square','skin':'tan','hair':'long','hairColor':'brown','mark':'scar-right','outfit':'jacket','outfitColor':'red','accessory':'glasses','checks':8}
    pg.click('#cv169-reset')
    checks['reset_is_visual_only']=pg.input_value('#cv169-controls select[data-field=face]')=='oval' and pg.evaluate("CVCharacterContinuityP163.profile(document.querySelector('#cv163-profile').value).features['visual:face']==='square'")
    pg.set_viewport_size({'width':390,'height':844}); pg.wait_for_timeout(300)
    checks['mobile_no_horizontal_overflow']=pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2")
    b.close()
bad=[k for k,v in checks.items() if not v]
print(json.dumps({'suite':'P169 Character Studio Chromium acceptance','checks':checks,'saved':saved,'pageErrors':errs,'failed':bad},ensure_ascii=False,indent=1))
sys.exit(1 if bad or errs else 0)
