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
        pg=b.new_page(viewport=vp,reduced_motion='reduce');errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('http://127.0.0.1:%d/index.html'%h.server_address[1],wait_until='commit');pg.wait_for_function('!!(window.CVHomeSkyP150&&document.getElementById("cv150-sky"))',timeout=90000);pg.wait_for_timeout(1500)
        ck(name+' skin sky mặc định',pg.evaluate('document.documentElement.dataset.homeSkin')=='sky')
        ck(name+' tiêu đề hiện',pg.is_visible('#cv150-sky h2'))
        ck(name+' wordmark hiện',pg.is_visible('#cv150-word'))
        ck(name+' giữ đủ phần cũ',all(pg.query_selector(s) for s in ['#cvHero','#ws-jobs','#ws-cards','#l43-recent','#cv-hub110']))
        ck(name+' không tràn ngang',pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        ck(name+' nền trời xanh',pg.evaluate('getComputedStyle(document.getElementById("page-home")).backgroundImage.includes("gradient")'))
        ck(name+' dải 5 thẻ',pg.evaluate('document.querySelectorAll("#ws-cards .ws-grid>*").length>=5'))
        if name=='desktop':
            g=pg.query_selector('#ws-cards .ws-grid');bx=g.bounding_box();sl0=pg.evaluate('document.querySelector("#ws-cards .ws-grid").scrollLeft')
            pg.mouse.move(bx['x']+bx['width']-40,bx['y']+60);pg.mouse.down();pg.mouse.move(bx['x']+bx['width']-340,bx['y']+60,steps=8);pg.mouse.up();pg.wait_for_timeout(200)
            ck('kéo chuột cuộn dải thẻ',pg.evaluate('document.querySelector("#ws-cards .ws-grid").scrollLeft')>sl0)
        pg.click('#cv150-sky [data-go=media]');pg.wait_for_timeout(600)
        ck(name+' nút chip mở không gian',pg.evaluate('!!document.querySelector("#page-home")') )
        pg.evaluate('CV.go("home");scrollTo(0,0)');pg.wait_for_timeout(600)
        pg.screenshot(path='/tmp/p150_%s.png'%name,full_page=(name=='mobile'))
        pg.click('#cv150-toggle');pg.wait_for_timeout(300)
        ck(name+' quay lại cổ điển',pg.evaluate('document.documentElement.dataset.homeSkin')=='classic' and not pg.is_visible('#cv150-word'))
        ck(name+' còn nút đổi lại',pg.is_visible('#cv150-toggle'))
        pg.click('#cv150-toggle');pg.wait_for_timeout(300)
        ck(name+' bật lại sky',pg.evaluate('document.documentElement.dataset.homeSkin')=='sky')
        pg.click('#cv150-pal [data-pal=aurora]');ck(name+' đổi bảng màu',pg.evaluate('document.documentElement.dataset.homePal')=='aurora' and 'rgb(4, 26, 51)' in pg.evaluate('getComputedStyle(document.getElementById("page-home")).backgroundImage'))
        pg.click('#cv150-pal [data-pal=sunset]')
        ck(name+' 0 lỗi trang',not errs)
        pg.close()
    b.close()
bad=[n for n,c in res if not c];print('%d/%d'%(len(res)-len(bad),len(res)));sys.exit(1 if bad else 0)
