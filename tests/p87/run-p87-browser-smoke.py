#!/usr/bin/env python3
"""P87 CV DOCX/ATS smoke on an opaque about:blank Chromium fixture."""
from __future__ import annotations
import json, os, re, shutil, zipfile
from pathlib import Path
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).with_name('browser-smoke-report.json')
DOCX=Path(__file__).with_name('canvio-p87-synthetic-test.docx')
SHIM=r'''<script id="canvio-p87-test-storage-shim">(()=>{function make(){const m=new Map();return{get length(){return m.size},key(i){return Array.from(m.keys())[i]??null},getItem(k){return m.has(String(k))?m.get(String(k)):null},setItem(k,v){m.set(String(k),String(v))},removeItem(k){m.delete(String(k))},clear(){m.clear()}}}Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});})();</script>'''
checks=[]
def require(ok,name,detail=''):
 if not ok: raise AssertionError(name+(': '+detail if detail else ''))
 checks.append({'id':name,'status':'pass','detail':detail});print('PASS',name,detail)
def main():
 src=(ROOT/'index.html').read_text(encoding='utf-8')
 src=re.sub(r'^(\s*<!doctype[^>]*>)',lambda m:m.group(1)+SHIM,src,count=1,flags=re.I)
 errors=[];console_errors=[]
 with sync_playwright() as p:
  exe=os.environ.get('CHROMIUM_EXECUTABLE_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
  browser=p.chromium.launch(headless=True,executable_path=exe,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:console_errors.append(m.text[:500]) if m.type=='error' else None)
  page.route('https://fonts.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='text/css',body=''))
  page.route('https://fonts.gstatic.com/**',lambda r:r.fulfill(status=200,content_type='font/woff2',body=b''))
  page.set_content(src,wait_until='domcontentloaded',timeout=90000);page.wait_for_timeout(3500)
  require(page.evaluate('CANVIO_BUILD.version')=='23.3.108-p85-studio-r2','P87 build marker',page.evaluate('CANVIO_BUILD.version'))
  require(page.title()=='CANVIO 23.3.108 — Creative Runtime Lab · P85 Runtime Hardening r2','Latest candidate title guard',page.title())
  page.evaluate("CV.go('cvstudio')");page.wait_for_timeout(700)
  require(page.locator('#cv87-panel').count()==1,'P87 panel mounted in canonical CV Studio')
  suite=page.evaluate('CVATSExport.tests()')
  failed={k:v for k,v in suite.items() if v is not True}
  require(not failed,'P87 module assertions',json.dumps(failed,ensure_ascii=False))
  fields={
   'name':'Nguyễn Thị An','title':'Chuyên viên Nhân sự','headline':'HR Operations | Talent Acquisition',
   'summary':'Có kinh nghiệm trong tuyển dụng và vận hành nhân sự. Tập trung quy trình rõ ràng và trải nghiệm ứng viên.',
   'email':'an@example.com','phone':'+84 912 345 678','loc':'TP. Hồ Chí Minh','link':'linkedin.com/in/an-example',
   'hl':'120% | KPI tuyển dụng trong 4 tháng','exp':'Chuyên viên tuyển dụng | ABC Company | 2023 – 2025\n- Triển khai quy trình tuyển dụng\n- Tối ưu thời gian tuyển dụng 20%',
   'edu':'Đại học Kinh tế | Quản trị nhân lực | 2019 – 2023','skills':'Chuyên môn: Excel, HRIS, Recruitment\nKỹ năng mềm: Giao tiếp, Điều phối',
   'certs':'Excel Advanced','acts':'','refs':'','interests':''}
  for k,v in fields.items():
   loc=page.locator('#page-cvstudio [data-k="'+k+'"]')
   if loc.count(): loc.fill(v)
  page.locator('#cv87-ats').click()
  report=page.locator('#cv87-report').inner_text()
  require('Điểm checklist:' in report and 'ATS thật' in report,'P87 ATS checklist displays score and limitations',report[:250])
  require(page.evaluate("CVATSExport.analyze(CVATSExport.readFields()).score")>=70,'P87 sample CV scores using declared heuristics')
  with page.expect_download(timeout=15000) as info: page.locator('#cv87-docx').click()
  dl=info.value;dl.save_as(str(DOCX))
  require(DOCX.exists() and DOCX.stat().st_size>500,'P87 DOCX download generated',f'{DOCX.stat().st_size} bytes')
  with zipfile.ZipFile(DOCX) as z:
   bad=z.testzip();names=set(z.namelist())
   require(bad is None,'P87 ZIP CRC and member integrity')
   required={'[Content_Types].xml','_rels/.rels','word/document.xml','word/styles.xml','word/_rels/document.xml.rels','docProps/core.xml','docProps/app.xml'}
   require(required.issubset(names),'P87 OOXML package has all required parts',json.dumps(sorted(names),ensure_ascii=False))
   for n in names:
    if n.endswith('.xml') or n.endswith('.rels'): ET.fromstring(z.read(n))
   doc=z.read('word/document.xml').decode('utf-8')
   require('Nguyễn Thị An' in doc and 'Tối ưu thời gian tuyển dụng 20%' in doc,'P87 keeps Vietnamese text and editable content')
   require('<w:tbl' not in doc,'P87 export is linear, table-free, ATS-oriented layout')
  require('DOCX' in page.locator('#cv87-status').inner_text(),'P87 UI reports download result',page.locator('#cv87-status').inner_text())
  require(not errors,'No uncaught application errors',json.dumps(errors[:5]))
  require(not console_errors,'No console errors',json.dumps(console_errors[:5]))
  result={'format':'CANVIO_P87_CV_DOCX_ATS_CHROMIUM_SMOKE','candidate':'23.3.108-p85-studio-r2','browser':browser.version,'origin':'about:blank','testOnlyStorageShim':True,'passed':len(checks),'total':len(checks),'status':'PASS_SYNTHETIC_BROWSER_AND_OOXML_VALIDATION','checks':checks,'limitations':['ATS score is a local heuristic, not an employer ATS prediction.','DOCX OOXML ZIP/XML structure validated; not opened in desktop Microsoft Word or Google Docs here.','Aptos is a font preference; fonts are not embedded. Pagination may vary by installed fonts and Office implementation.','P87 DOCX remains a separate OOXML export; P82/P84 vector PDF is a separate Poster/Slide path with its own limitations.']}
  OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
  print(f"P87 smoke: {len(checks)}/{len(checks)} PASS")
  browser.close()
 if not os.environ.get('CANVIO_KEEP_OFFICE_FIXTURES'): DOCX.unlink(missing_ok=True)
if __name__=='__main__': main()
