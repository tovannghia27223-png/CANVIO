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
        pg=b.new_page(viewport=vp);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('http://127.0.0.1:%d/index.html'%h.server_address[1],wait_until='commit')
        pg.wait_for_function('!!(window.CVUnifiedThemeP230&&window.CVWS&&window.CV229)',timeout=90000);pg.wait_for_timeout(1000)
        ck(name+' P230 gắn đúng một style',pg.locator('#canvio-p230-unified-accent-css').count()==1)
        for theme in ['graffiti','glass','midnight','aurora','cyber','neonlight']:
            pg.evaluate('t=>CV229.setTheme(t)',theme);pg.wait_for_timeout(100)
            state=pg.evaluate("""()=>{const root=getComputedStyle(document.body),brand=root.getPropertyValue('--brand').trim(),accent=root.getPropertyValue('--cv-accent').trim();const p=document.querySelector('.btn-primary');const s=document.querySelector('.btn-soft');const menu=document.querySelector('.side button.active');const norm=x=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=x;return c.fillStyle};return {brand:norm(brand),accent:norm(accent),primary:p&&norm(getComputedStyle(p).backgroundColor),menu:menu&&norm(getComputedStyle(menu).backgroundColor),soft:s&&getComputedStyle(s).backgroundColor,activeTheme:document.body.className.includes('cv229-theme-'+(window.CV229.state().theme))}}""")
            ck(name+' '+theme+' accent bám brand',state['brand']==state['accent'])
            ck(name+' '+theme+' nút chính cùng màu accent',state['primary'] and state['primary']==state['accent'])
            ck(name+' '+theme+' menu active cùng màu accent',!state['menu']||state['menu']==state['accent'])
            ck(name+' '+theme+' class theme được giữ',state['activeTheme'])
        pg.evaluate("if(window.CVLot47)window.CVLot47.set('plain');CV229.setTheme('graffiti')")
        pg.evaluate("CVWS.open('design')");pg.wait_for_timeout(300)
        pg.evaluate("CV.go('assets')");pg.wait_for_function("!!document.querySelector('.cv-pwf')",timeout=15000);pg.wait_for_timeout(150)
        pwf=pg.evaluate("""()=>{const a=getComputedStyle(document.querySelector('.cv-pwf button[data-pwf-open]')).backgroundColor;const s=getComputedStyle(document.getElementById('cv-pwf-save')).backgroundColor;const n=getComputedStyle(document.getElementById('cv-pwf-refresh')).backgroundColor;const accent=getComputedStyle(document.body).getPropertyValue('--cv-accent').trim();const c=document.createElement('canvas').getContext('2d');c.fillStyle=accent;return {accent:c.fillStyle,open:a,save:s,refresh:n}}""")
        ck(name+' Photo Workflow nút Mở Luma cùng màu accent',pwf['open']==pwf['accent'])
        ck(name+' Photo Workflow nút Lưu cùng màu accent',pwf['save']==pwf['accent'])
        ck(name+' Photo Workflow nút phụ cùng hue',bool(pwf['refresh']))
        for sp in ['design','site','media','proj','ai']:
            pg.evaluate('s=>CVWS.open(s)',sp);pg.wait_for_timeout(450)
            state=pg.evaluate("""()=>{const e=document.querySelector('.btn-primary'),m=document.querySelector('.side button.active');const s=getComputedStyle(document.body);return {api:!!window.CVUnifiedThemeP230,accent:s.getPropertyValue('--cv-accent').trim(),button:e&&getComputedStyle(e).backgroundColor,menu:m&&getComputedStyle(m).backgroundColor,style:!!document.getElementById('canvio-p230-unified-accent-css')}}""")
            ck(name+' workspace '+sp+' vẫn giữ unified accent',state['api'] and state['style'] and bool(state['accent']) and (not state['button'] or state['button']==state['accent']))
        ck(name+' không lỗi JavaScript',not errs)
        pg.close()
    b.close()
h.shutdown()
bad=[n for n,c in res if not c];print('%d/%d'%(len(res)-len(bad),len(res)));sys.exit(1 if bad else 0)
