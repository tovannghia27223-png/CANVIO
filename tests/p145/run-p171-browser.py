import json, threading, http.server, socketserver, functools, shutil, os
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
h=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT)); h.daemon_threads=True
threading.Thread(target=h.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%h.server_address[1]; checks={}; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=shutil.which('google-chrome'),headless=True,args=['--no-sandbox','--disable-gpu'])
    pg=b.new_context(viewport={'width':1400,'height':900}).new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(url,wait_until='load',timeout=90000); pg.add_style_tag(content='html,*{scroll-behavior:auto!important}')
    pg.wait_for_function("!!window.CVNavDrawerP171&&!!document.querySelector('#side .cv171-shield')",timeout=60000); pg.wait_for_timeout(1000)
    checks['shell_mode_default']=pg.evaluate("document.documentElement.getAttribute('data-nav')==='shell'")
    checks['side_hidden_before']=not pg.is_visible('#side')
    pg.click('header.top .railBtn'); pg.wait_for_timeout(300)
    checks['button_opens_menu']=pg.is_visible('#side') and pg.evaluate("document.querySelector('header.top .railBtn').getAttribute('aria-expanded')==='true'")
    checks['menu_has_many_items']=pg.evaluate("document.querySelectorAll('#side .nav button').length>=40")
    checks['shield_entry_visible']=pg.is_visible('#side .cv171-shield')
    pg.click('#side .cv171-shield'); pg.wait_for_timeout(600)
    checks['shield_page_opens']=pg.evaluate("document.querySelector('#page-shield').classList.contains('active')")
    checks['menu_closes_after_choice']=not pg.is_visible('#side')
    checks['shield_has_ai_tab']=pg.evaluate("/Chống AI cào/.test(document.querySelector('#page-shield').textContent)")
    pg.click('header.top .railBtn'); pg.wait_for_timeout(200); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    checks['escape_closes']=not pg.is_visible('#side')
    pg.click('header.top .railBtn'); pg.wait_for_timeout(200); pg.mouse.click(900,500); pg.wait_for_timeout(300)
    checks['backdrop_click_closes']=not pg.is_visible('#side')
    pg.evaluate("CVNavShellP114.setMode('v16')"); pg.wait_for_timeout(300)
    before=pg.evaluate("document.body.classList.contains('rail')"); pg.click('header.top .railBtn'); pg.wait_for_timeout(300)
    checks['classic_mode_keeps_rail_toggle']=pg.evaluate("document.body.classList.contains('rail')")!=before and pg.is_visible('#side')
    b.close()
bad=[k for k,v in checks.items() if not v]; print(json.dumps({'checks':checks,'pageErrors':errs,'failed':bad},ensure_ascii=False,indent=1)); raise SystemExit(1 if bad or errs else 0)
