import threading,http.server,socketserver,functools,shutil,sys
from playwright.sync_api import sync_playwright
ROOT=__file__.rsplit('/tests/',1)[0] if '/tests/' in __file__ else '.'
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
h=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT));threading.Thread(target=h.serve_forever,daemon=True).start()
res=[]
def ck(n,c): res.append((n,bool(c))); print(('PASS ' if c else 'FAIL ')+n)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=shutil.which('google-chrome') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-gpu','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    for name,vp in (('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})):
        pg=b.new_page(viewport=vp,reduced_motion='reduce');pg.add_init_script("try{localStorage.setItem('canvio.homeSkin.v2','sky')}catch(e){}");errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('http://127.0.0.1:%d/index.html'%h.server_address[1],wait_until='commit');pg.wait_for_function('!!(window.CVHomeSkyP150&&document.getElementById("cv150-sky"))',timeout=90000);pg.wait_for_timeout(1500)
        ck(name+' skin sky mặc định',pg.evaluate('document.documentElement.dataset.homeSkin')=='sky')
        ck(name+' tiêu đề hiện',pg.is_visible('#cv150-sky h2'))
        ck(name+' khung poster hiện',pg.is_visible('#cv150-art .fr'))
        ck(name+' giữ đủ phần cũ',all(pg.query_selector(s) for s in ['#cvHero','#ws-jobs','#ws-cards','#l43-recent','#cv-hub110']))
        ck(name+' không tràn ngang',pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        ck(name+' nền pasteboard',pg.evaluate('getComputedStyle(document.getElementById("page-home")).backgroundColor=="rgb(228, 230, 238)"'))
        ck(name+' dải 5 thẻ',pg.evaluate('document.querySelectorAll("#ws-cards .ws-grid>*").length>=5'))
        if name=='desktop':
            pg.evaluate('document.querySelector("#ws-cards .ws-grid").scrollIntoView({block:"center"})');pg.wait_for_timeout(300);g=pg.query_selector('#ws-cards .ws-grid');bx=g.bounding_box();sl0=pg.evaluate('document.querySelector("#ws-cards .ws-grid").scrollLeft')
            pg.mouse.move(bx['x']+bx['width']-40,bx['y']+60);pg.mouse.down();pg.mouse.move(bx['x']+bx['width']-340,bx['y']+60,steps=8);pg.mouse.up();pg.wait_for_timeout(200)
            ck('kéo chuột cuộn dải thẻ',pg.evaluate('document.querySelector("#ws-cards .ws-grid").scrollLeft')>sl0)
        pg.wait_for_timeout(2800)
        pg.evaluate('document.querySelector(".tx-poster").scrollIntoView({block:"center"})');pg.wait_for_timeout(300);tx=pg.query_selector('.tx-poster');b0=tx.bounding_box();pg.mouse.move(b0['x']+20,b0['y']+20);pg.mouse.down();pg.mouse.move(b0['x']+60,b0['y']+70,steps=6);pg.mouse.up();b1=tx.bounding_box()
        ck(name+' kéo được khối chữ poster',abs(b1['x']-b0['x'])>10 or abs(b1['y']-b0['y'])>10)
        for tt in ['cv','web','video','poster']:
            pg.click('#cv150-art .tabs [data-t=%s]'%tt);ck(name+' tab '+tt,pg.evaluate('document.querySelector("#cv150-art .fr").dataset.t')==tt and pg.is_visible('.tx-'+tt))
        pg.click('#cv150-art .sw [data-c="#7C4DFF"]');ck(name+' đổi màu chủ đạo',pg.evaluate('document.querySelector("#cv150-art .fr").style.getPropertyValue("--acc")')=='#7C4DFF')
        pg.click('#cv150-sky [data-go=design]');pg.wait_for_timeout(600)
        ck(name+' nút chip mở không gian',pg.evaluate('!!document.querySelector("#page-home")') )
        pg.evaluate('CV.go("home");scrollTo(0,0)');pg.wait_for_timeout(600)
        pg.screenshot(path='/tmp/p150_%s.png'%name,full_page=(name=='mobile'))
        pg.click('#cv150-skins [data-skin=classic]');pg.wait_for_timeout(300)
        ck(name+' quay lại cổ điển',pg.evaluate('document.documentElement.dataset.homeSkin')=='classic' and not pg.is_visible('#cv150-art'))
        ck(name+' còn nút đổi lại',pg.is_visible('#cv150-skins'))
        pg.click('#cv150-skins [data-skin=sky]');pg.wait_for_timeout(300)
        ck(name+' bật lại sky',pg.evaluate('document.documentElement.dataset.homeSkin')=='sky')
        pg.click('#cv150-skins [data-skin=fashion]');pg.wait_for_timeout(300)
        ck(name+' kiểu thời trang',pg.evaluate('document.documentElement.dataset.homeSkin')=='fashion' and pg.is_visible('#cv150-fa .fa-word') and not pg.is_visible('#cv150-sky'))
        ck(name+' thời trang không tràn ngang',pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        ck(name+' thời trang giữ 5 thẻ',pg.evaluate('document.querySelectorAll("#ws-cards .ws-grid>*").length>=5'))
        pg.screenshot(path='/tmp/p150_fashion_%s.png'%name)
        pg.click('#cv150-skins [data-skin=sky]')
        ck(name+' 0 lỗi trang',not errs)

    # ---- kiểu Công nghệ (mặc định)
    for name,vp in (('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})):
        pg=b.new_page(viewport=vp);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('http://127.0.0.1:%d/index.html'%h.server_address[1],wait_until='commit');pg.wait_for_function('!!(window.CVHomeSkyP150&&document.getElementById("cv150-tech"))',timeout=90000);pg.wait_for_timeout(1200)
        ck(name+' mặc định là giao diện cổ điển',pg.evaluate('document.documentElement.dataset.homeSkin')=='classic')
        pg.click('#cv150-skins [data-skin=tech]');pg.wait_for_timeout(500)
        ck(name+' tech hero hiện',pg.is_visible('#cv150-tech h2') and pg.is_visible('#cv150t-in') and not pg.is_visible('#cv150-sky'))
        pg.wait_for_timeout(1500)
        ck(name+' tech gõ prompt tự động',len(pg.input_value('#cv150t-in'))>10)
        pg.wait_for_timeout(5500)
        ck(name+' tech dựng đủ 3 sản phẩm',pg.evaluate('document.getElementById("cv150t-stage").classList.contains("done")') and pg.is_visible('.tc.po') and pg.is_visible('.tc.bn') and pg.is_visible('.tc.bd'))
        ck(name+' tech không tràn ngang',pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        ck(name+' tech giữ phần cũ',all(pg.query_selector(s) for s in ['#cvHero','#ws-jobs','#ws-cards','#cv-hub110']))
        if name=='desktop':
            bx=pg.query_selector('#cv150t-stage').bounding_box();pg.mouse.move(bx['x']+bx['width']*.9,bx['y']+bx['height']*.2);pg.wait_for_timeout(400)
            ck('tech nghiêng theo con trỏ',pg.evaluate('document.querySelector("#cv150t-stage .t-in").style.getPropertyValue("--ry")')!='')
            pg.fill('#cv150t-in','poster thử nghiệm');pg.click('#cv150t-go');pg.wait_for_timeout(500)
            transfer=pg.evaluate("""() => { const input=document.getElementById('ws-jin'), note=document.getElementById('ws-jnote'); return {value:input?.value||'',note:note?.textContent||''}; }""")
            ck('tech gửi mô tả sang việc cần làm và kích hoạt định tuyến',transfer['value']=='poster thử nghiệm' and transfer['note'].startswith('Mở:'))
        pg.screenshot(path='/tmp/p150_tech_%s.png'%name)
        ck(name+' tech 0 lỗi trang',not errs)
        pg.close()

    # ---- không rò rỉ sang các không gian khác
    pg=b.new_page(viewport={'width':1440,'height':900});pg.add_init_script("try{localStorage.setItem('canvio.homeSkin.v2','tech');localStorage.setItem('canvio16:skin','plain')}catch(e){}")
    pg.goto('http://127.0.0.1:%d/index.html'%h.server_address[1],wait_until='commit');pg.wait_for_function('!!(window.CVHomeSkyP150&&window.CVWS&&window.CVLot47&&window.CV229)',timeout=90000);pg.wait_for_timeout(1500)
    # Establish the existing, intended baseline through the owning theme APIs.
    # Merely writing localStorage does not prove the runtime has applied the skin.
    pg.evaluate("CVLot47.set('plain');CV229.setTheme('graffiti')")
    pg.wait_for_function("""!document.documentElement.hasAttribute('data-skin')&&document.getElementById('cv229-inspector').classList.contains('cv229-theme-graffiti')&&!document.body.classList.contains('cv229-theme-graffiti')""",timeout=10000)
    # P150 tech intentionally changes the toolbar while Home is active.
# Capture the workspace's own Export baseline; Spatial palette must not set it.
    pg.evaluate("CVWS.open('design')");pg.wait_for_timeout(900)
    baseline=pg.evaluate('getComputedStyle(document.getElementById("ws-export")).backgroundColor')
ck('theme fixture captures a real workspace Export baseline',baseline not in ('rgba(0, 0, 0, 0)','transparent'))
    for sp in ['design','site','media','proj','ai']:
        pg.evaluate("CVWS.open('%s')"%sp);pg.wait_for_timeout(900)
        ck('không gian '+sp+' không lẫn trang Tổng quan',pg.evaluate('document.getElementById("page-home").offsetHeight')==0 and not pg.is_visible('#cv150-skins'))
        ck('không gian '+sp+' tắt Home-only toolbar scope',pg.evaluate('document.documentElement.getAttribute("data-cv150-home-active")!=="true"'))
        ck('không gian '+sp+' đưa skin gốc về classic ở root',pg.evaluate('document.documentElement.getAttribute("data-home-skin")==="classic"'))
        state=pg.evaluate("""()=>{const e=document.getElementById('ws-export'),s=getComputedStyle(e);return {home:document.documentElement.getAttribute('data-home-skin'),active:document.documentElement.getAttribute('data-cv150-home-active'),skin:document.documentElement.getAttribute('data-skin'),bodyTheme:[...document.body.classList].filter(x=>x.indexOf('cv229-theme-')===0),spatialTheme:[...document.getElementById('cv229-inspector').classList].filter(x=>x.indexOf('cv229-theme-')===0),background:s.backgroundColor,backgroundImage:s.backgroundImage,color:s.color,border:s.borderColor}}""")
if state['background']!=baseline: print('P150_EXPORT_DIAGNOSTIC '+sp+' '+str(state))
ck('không gian '+sp+' giữ màu Xuất gốc',state['background']==baseline)
    pg.close()

    # P229 theme ownership: Spatial palette must not recolor shell navigation or other workspace controls.
    pg.evaluate("CV229.setTheme('graffiti');CVWS.open('design')");pg.wait_for_timeout(500)
    navBefore=pg.evaluate("""()=>{const pick=e=>{const s=getComputedStyle(e);return [s.backgroundColor,s.backgroundImage,s.color,s.borderColor].join('|')};return {menu:pick(document.querySelector('#cv-studio-menu [data-route]')),launcher:pick(document.getElementById('cv229-open')),export:pick(document.getElementById('ws-export'))}}""")
    pg.evaluate("CV229.setTheme('midnight')");pg.wait_for_timeout(500)
    navAfter=pg.evaluate("""()=>{const pick=e=>{const s=getComputedStyle(e);return [s.backgroundColor,s.backgroundImage,s.color,s.borderColor].join('|')};return {menu:pick(document.querySelector('#cv-studio-menu [data-route]')),launcher:pick(document.getElementById('cv229-open')),export:pick(document.getElementById('ws-export'))}}""")
    ck('P229 đổi theme chỉ trong Spatial Inspector, không đổi body class',pg.evaluate("document.getElementById('cv229-inspector').classList.contains('cv229-theme-midnight')&&!document.body.classList.contains('cv229-theme-midnight')"))
    audit=pg.evaluate('CV229ThemeIsolationP229.audit()')
    ck('P229 không còn CSS theme toàn cục hoặc class rò ra body',audit['globalThemeSelectors']==0 and audit['bodyThemeClasses']==[] and 'midnight' in audit['inspectorThemeClasses'])
    ck('P229 không đổi màu menu, launcher và nút workspace',navBefore==navAfter)
    pg.evaluate("CV229.setTheme('graffiti');CV229.open()");pg.wait_for_timeout(500)
    pg.evaluate("CVContrastGuardP151.scan()")
    ck('P151 không ghi đè màu menu hoặc Spatial Inspector',pg.evaluate("!document.querySelector('#cv-studio-menu [data-route][data-cvg]')&&!document.querySelector('#cv229-inspector [data-cvg]')"))
    pg.evaluate("CV229.close()")
    pg.close()

    # ---- Holographic Ocean remains independent of the Home presentation skin.
    pg=b.new_page(viewport={'width':1440,'height':900})
    pg.add_init_script("try{localStorage.setItem('canvio.homeSkin.v2','classic');localStorage.setItem('canvio16:skin','holo')}catch(e){}")
    pg.goto('http://127.0.0.1:%d/index.html'%h.server_address[1],wait_until='commit')
    pg.wait_for_function('!!(window.CVHomeSkyP150&&window.CVWS)',timeout=90000);pg.wait_for_timeout(900)
    pg.evaluate("CVWS.open('design')");pg.wait_for_timeout(700)
    baseline=pg.evaluate("""()=>{const s=getComputedStyle(document.getElementById('ws-export'));return JSON.stringify([s.backgroundColor,s.backgroundImage,s.color,s.borderColor])}""")
    ck('Holo fixture uses independent Holographic skin',pg.evaluate('document.documentElement.getAttribute("data-skin")==="holo"') and 'linear-gradient' in baseline)
    pg.evaluate("CVHomeSkyP150.set('tech')");pg.wait_for_timeout(300)
    for sp in ['design','site','media','proj','ai']:
        pg.evaluate("CVWS.open('%s')"%sp);pg.wait_for_timeout(400)
        state=pg.evaluate("""()=>{const s=getComputedStyle(document.getElementById('ws-export'));return {skin:document.documentElement.getAttribute('data-skin'),home:document.documentElement.getAttribute('data-home-skin'),style:JSON.stringify([s.backgroundColor,s.backgroundImage,s.color,s.borderColor])}}""")
        ck('Holo giữ nguyên nút Xuất ở '+sp,state['skin']=='holo' and state['home']=='classic' and state['style']==baseline)
    pg.close()
    b.close()
bad=[n for n,c in res if not c];print('%d/%d'%(len(res)-len(bad),len(res)));sys.exit(1 if bad else 0)
