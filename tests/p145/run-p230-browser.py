import threading,http.server,socketserver,functools,shutil,sys,json
from playwright.sync_api import sync_playwright
ROOT=__file__.rsplit('/tests/',1)[0] if '/tests/' in __file__ else '.'
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
h=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT));threading.Thread(target=h.serve_forever,daemon=True).start()
res=[]
def ck(n,c): res.append((n,bool(c))); print(('PASS ' if c else 'FAIL ')+n)
def debug(n,d): print('DEBUG '+n+' '+json.dumps(d,ensure_ascii=False,default=str))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=shutil.which('google-chrome') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-gpu','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    for name,vp in (('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})):
        pg=b.new_page(viewport=vp);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('http://127.0.0.1:%d/index.html'%h.server_address[1],wait_until='commit')
        pg.mouse.move(vp['width']-2,vp['height']-2)
        pg.wait_for_function('!!(window.CVUnifiedThemeP230&&window.CVWS&&window.CV229)',timeout=90000);pg.wait_for_timeout(1000)
        ck(name+' P230 gắn đúng một style',pg.locator('#canvio-p230-unified-accent-css').count()==1)
        for theme in ['graffiti','glass','midnight','aurora','cyber','neonlight']:
            pg.mouse.move(vp['width']-2,vp['height']-2);pg.evaluate('t=>CV229.setTheme(t)',theme);pg.wait_for_timeout(700)
            state=pg.evaluate("""()=>{const root=getComputedStyle(document.body),brand=root.getPropertyValue('--brand').trim(),accent=root.getPropertyValue('--cv-accent').trim();const p=document.querySelector('.btn-primary');const s=document.querySelector('.btn-soft');const menu=document.querySelector('.side button.active');const norm=x=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=x;return c.fillStyle};const info=e=>{if(!e)return null;const q=getComputedStyle(e),r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,cls:e.className,text:(e.innerText||'').slice(0,70),bg:q.backgroundColor,bgImage:q.backgroundImage,border:q.borderColor,color:q.color,visible:!!(r.width&&r.height&&q.display!=='none'&&q.visibility!=='hidden'),inline:e.getAttribute('style'),parent:e.parentElement&&e.parentElement.id,grand:e.parentElement&&e.parentElement.parentElement&&e.parentElement.parentElement.id}};const primaries=[...document.querySelectorAll('.top .btn-primary,.page.active .btn-primary')].filter(e=>{const q=getComputedStyle(e),r=e.getBoundingClientRect();return !!(r.width&&r.height&&q.display!=='none'&&q.visibility!=='hidden')});const primaryColors=primaries.map(e=>norm(getComputedStyle(e).backgroundColor));return {brand:norm(brand),accent:norm(accent),primary:primaryColors[0]||null,primaryColors,primaryInfos:primaries.map(info),primaryInfo:info(p),candidates:[...document.querySelectorAll('.btn-primary')].slice(0,12).map(info),menu:menu&&norm(getComputedStyle(menu).backgroundColor),soft:s&&getComputedStyle(s).backgroundColor,body:document.body.className,rootSkin:document.documentElement.getAttribute('data-home-skin'),activeTheme:document.body.className.includes('cv229-theme-'+(window.CV229.state().theme))}}""")
            ck(name+' '+theme+' accent bám brand',state['brand']==state['accent'])
            primary_ok=bool(state['primaryColors']) and all(c==state['accent'] for c in state['primaryColors'])
            if theme=='graffiti' and not primary_ok: debug(name+' graffiti primary',state)
            ck(name+' '+theme+' nút chính cùng màu accent',primary_ok)
            ck(name+' '+theme+' menu active cùng màu accent',(not state['menu']) or state['menu']==state['accent'])
            ck(name+' '+theme+' class theme được giữ',state['activeTheme'])
        pg.evaluate("if(window.CVLot47)window.CVLot47.set('plain');CV229.setTheme('graffiti')")
        pg.evaluate("CVWS.open('design')");pg.wait_for_timeout(300)
        pg.evaluate("CV.go('assets')");pg.wait_for_function("!!document.querySelector('.cv-pwf')",timeout=15000);pg.wait_for_timeout(150)
        pwf=pg.evaluate("""()=>{const a=getComputedStyle(document.querySelector('.cv-pwf button[data-pwf-open]')).backgroundColor;const s=getComputedStyle(document.getElementById('cv-pwf-save')).backgroundColor;const n=getComputedStyle(document.getElementById('cv-pwf-refresh')).backgroundColor;const accent=getComputedStyle(document.body).getPropertyValue('--cv-accent').trim();const norm=x=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=x;return c.fillStyle};return {accent:norm(accent),open:norm(a),save:norm(s),refresh:norm(n)}}""")
        ck(name+' Photo Workflow nút Mở Luma cùng màu accent',pwf['open']==pwf['accent'])
        ck(name+' Photo Workflow nút Lưu cùng màu accent',pwf['save']==pwf['accent'])
        ck(name+' Photo Workflow nút phụ cùng hue',bool(pwf['refresh']))
        for sp in ['design','site','media','proj','ai']:
            pg.mouse.move(vp['width']-2,vp['height']-2);pg.evaluate('s=>CVWS.open(s)',sp);pg.wait_for_timeout(450)
            state=pg.evaluate("""()=>{const e=document.querySelector('.btn-primary'),m=document.querySelector('.side button.active');const s=getComputedStyle(document.body),norm=x=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=x;return c.fillStyle},info=x=>{if(!x)return null;const q=getComputedStyle(x),r=x.getBoundingClientRect();return {tag:x.tagName,id:x.id,cls:x.className,text:(x.innerText||'').slice(0,60),bg:q.backgroundColor,bgImage:q.backgroundImage,border:q.borderColor,visible:!!(r.width&&r.height&&q.display!=='none'&&q.visibility!=='hidden'),parent:x.parentElement&&x.parentElement.id,grand:x.parentElement&&x.parentElement.parentElement&&x.parentElement.parentElement.id}};const primaries=[...document.querySelectorAll('.top .btn-primary,.page.active .btn-primary')].filter(x=>{const q=getComputedStyle(x),r=x.getBoundingClientRect();return !!(r.width&&r.height&&q.display!=='none'&&q.visibility!=='hidden')});const primaryColors=primaries.map(x=>norm(getComputedStyle(x).backgroundColor));return {api:!!window.CVUnifiedThemeP230,accent:norm(s.getPropertyValue('--cv-accent').trim()),button:e&&norm(getComputedStyle(e).backgroundColor),primaryColors,primaryInfos:primaries.map(info),buttonInfo:info(e),candidates:[...document.querySelectorAll('.btn-primary')].slice(0,12).map(info),menu:m&&norm(getComputedStyle(m).backgroundColor),style:!!document.getElementById('canvio-p230-unified-accent-css'),body:document.body.className}}""")
            workspace_ok=bool(state['api'] and state['style'] and state['accent'] and state['primaryColors'] and all(c==state['accent'] for c in state['primaryColors']))
            if not workspace_ok: debug(name+' workspace '+sp,state)
            ck(name+' workspace '+sp+' vẫn giữ unified accent',workspace_ok)
        ck(name+' không lỗi JavaScript',not errs)
        pg.close()
    b.close()
h.shutdown()
bad=[n for n,c in res if not c];print('%d/%d'%(len(res)-len(bad),len(res)));sys.exit(1 if bad else 0)
