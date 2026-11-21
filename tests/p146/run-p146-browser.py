#!/usr/bin/env python3
"""P146.1 Home guided workflow browser acceptance; no AI calls or external services."""
import functools, http.server, json, os, shutil, socketserver, sys, threading
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Quiet,directory=ROOT));server.daemon_threads=True
threading.Thread(target=server.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%server.server_address[1]
checks,errors,provider_requests={},{},[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 context=browser.new_context(viewport={'width':1360,'height':900},reduced_motion='reduce')
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)[:240]));page.on('request',lambda req:provider_requests.append(req.url) if 'pollinations' in req.url.lower() else None)
 page.goto(url,wait_until='domcontentloaded',timeout=90000)
 page.wait_for_function("!!(window.CV&&CV.go&&window.CVHomeCreativeFlowP146&&document.querySelector('#cvhs-workflows'))",timeout=90000)
 checks['fiveWorkflows']=page.locator('#cvhs-workflows [data-cvhs-flow]').count()==5
 checks['moduleContract']=page.evaluate("CVHomeCreativeFlowP146.tests().mounted&&CVHomeCreativeFlowP146.tests().workflowCount===5&&CVHomeCreativeFlowP146.tests().noIndependentStore&&CVHomeCreativeFlowP146.tests().noAutomaticAI")
 page.click('#cvhs-workflows [data-cvhs-flow=\"hr\"]');page.click('#cvhs-workflows [data-cvhs-action=\"apply\"]')
 brief=page.locator('#homePrompt').input_value()
 checks['hrBriefPrefilled']='tuyển dụng' in brief.lower() and '[VỊ TRÍ]' in brief
 checks['homeKindReused']=page.locator('#homeKind button.on').get_attribute('data-kind')=='poster'
 page.click('#cvhs-workflows [data-cvhs-action=\"open\"]')
 page.wait_for_function("document.querySelector('#page-hrvisual.active')&&document.querySelector('#hrTabs [data-t=ai]')",timeout=20000)
 page.wait_for_function("document.querySelector('#hrPrompt')&&document.querySelector('#hrPrompt').value.includes('[VỊ TRÍ]')",timeout=10000)
 checks['hrStudioHandoff']=page.locator('#hrPrompt').input_value()==brief
 checks['hrPromptTabOpened']= 'btn-primary' in (page.locator('#hrTabs button[data-t=ai]').get_attribute('class') or '')
 checks['noPollinationsCall']=len(provider_requests)==0
 checks['noImageGenerationTriggered']=page.locator('#hrGo').count()==1 and page.locator('#hrGo').is_visible()
 checks['hrStatusExplainsOptionalTab']='chưa gọi Pollinations' in page.locator('#cvhs-status').inner_text().lower()
 core_brief=page.evaluate('CVCreativeCore.context().brief')
 checks['sharedCoreOwner']=bool(core_brief) and core_brief==brief
 page.evaluate("CV.go('home')");page.wait_for_function("document.querySelector('#page-home.active')",timeout=10000)
 page.click('#cvhs-workflows [data-cvhs-flow=\"video\"]');page.click('#cvhs-workflows [data-cvhs-action=\"open\"]')
 page.wait_for_function("document.querySelector('#page-videoStudio.active')&&document.querySelector('#vidScript')&&document.querySelector('#vidScript').value.includes('[CHỦ ĐỀ]')",timeout=20000)
 checks['videoStudioHandoff']='[CHỦ ĐỀ]' in page.locator('#vidScript').input_value()
 checks['existingCoreBriefNotOverwritten']=page.evaluate('CVCreativeCore.context().brief')==brief
 checks['noNewStorageNamespace']=page.evaluate("Object.keys(localStorage).filter(k=>/cvhs|creative-flow-p146/i.test(k)).length===0")
 checks['noPageErrors']=len(errors)==0
 browser.close()
server.shutdown();server.server_close()
result={'checks':checks,'pageErrors':errors,'providerRequests':provider_requests,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(result,ensure_ascii=False,indent=2));sys.exit(1 if result['failed'] else 0)
