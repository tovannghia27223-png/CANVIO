import re,os,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
s=(ROOT/'index.html').read_text()
shim='''<script>(()=>{function make(){const m=new Map();return{get length(){return m.size},key(i){return [...m.keys()][i]??null},getItem(k){return m.has(String(k))?m.get(String(k)):null},setItem(k,v){m.set(String(k),String(v))},removeItem(k){m.delete(String(k))},clear(){m.clear()}}}Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});})();</script>'''
s=re.sub(r'^(	*<!doctype[^>]*>)',lambda m:m.group(1)+shim,s,count=1,flags=re.I)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page()
 page.set_default_timeout(10000)
 page.on('console',lambda m: print('console',m.type,m.text[:180],flush=True) if m.type=='error' else None)
 page.on('pageerror',lambda e:print('pageerror',e,flush=True))
 page.route('https://fonts.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='text/css',body=''))
 page.route('https://fonts.gstatic.com/**',lambda r:r.fulfill(status=200,content_type='font/woff2',body=b''))
 print('set content',flush=True);page.set_content(s,wait_until='domcontentloaded',timeout=60000);print('dom loaded',flush=True)
 page.wait_for_timeout(4400); print('loaded wait',flush=True)
 print('cv',page.evaluate('!!window.CV'),flush=True)
 btn=page.locator('#cvux-mode-toggle'); print('btn',btn.count(),flush=True)
 print('click1',flush=True);btn.click(timeout=10000);print('click1 done',flush=True)
 print('class',page.locator('body').get_attribute('class'),flush=True)
 print('click2',flush=True);btn.click(timeout=10000);print('click2 done',flush=True)
 print('class2',page.locator('body').get_attribute('class'),flush=True)
 b.close()
