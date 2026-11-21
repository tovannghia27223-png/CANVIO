#!/usr/bin/env python3
"""P120/P126 Chromium acceptance: local ComfyUI workflow upload/queue/history/view and Asset Library handoff."""
import base64, json, os, sys, threading, http.server, socketserver, functools, shutil, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pZ8AAAAASUVORK5CYII=')
state={'workflow':None,'uploads':0,'history':0,'views':0}
class Site(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
site=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Site,directory=ROOT));site.daemon_threads=True
threading.Thread(target=site.serve_forever,daemon=True).start()
origin='http://127.0.0.1:%d'%site.server_address[1]
class Comfy(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def cors(self):
        o=self.headers.get('Origin') or '*'
        self.send_header('Access-Control-Allow-Origin',o)
        self.send_header('Access-Control-Allow-Headers','content-type')
        self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS')
        self.send_header('Vary','Origin')
    def send_json(self,obj,status=200):
        body=json.dumps(obj).encode()
        self.send_response(status);self.cors();self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    def do_OPTIONS(self):
        self.send_response(204);self.cors();self.send_header('Access-Control-Max-Age','600');self.end_headers()
    def do_GET(self):
        if self.path=='/system_stats':
            self.send_json({'system':{'os':'test'},'devices':[]});return
        if self.path=='/history/mock-prompt-120':
            state['history']+=1
            self.send_json({'mock-prompt-120':{'status':{'status_str':'success','completed':True},'outputs':{'9':{'images':[{'filename':'canvio-result.png','subfolder':'','type':'output'}]}}}});return
        if self.path.startswith('/view?'):
            state['views']+=1
            self.send_response(200);self.cors();self.send_header('Content-Type','image/png');self.send_header('Content-Length',str(len(PNG)));self.end_headers();self.wfile.write(PNG);return
        self.send_json({'error':'not found'},404)
    def do_POST(self):
        n=int(self.headers.get('Content-Length') or 0);body=self.rfile.read(n)
        if self.path=='/upload/image':
            state['uploads']+=1
            self.send_json({'name':'canvio-input.png','subfolder':'','type':'input'});return
        if self.path=='/prompt':
            try: state['workflow']=json.loads(body)
            except Exception: self.send_json({'error':'bad json'},400);return
            self.send_json({'prompt_id':'mock-prompt-120','number':1});return
        self.send_json({'error':'not found'},404)
mock=socketserver.ThreadingTCPServer(('127.0.0.1',0),Comfy);mock.daemon_threads=True
threading.Thread(target=mock.serve_forever,daemon=True).start()
c={};errs=[]
with tempfile.TemporaryDirectory() as td:
    wf=Path(td)/'api-workflow.json'
    wf.write_text(json.dumps({'1':{'class_type':'CLIPTextEncode','inputs':{'text':'old prompt'}},'2':{'class_type':'LoadImage','inputs':{'image':'old.png'}},'9':{'class_type':'SaveImage','inputs':{'images':['2',0]}}}),encoding='utf-8')
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
        page=b.new_context(viewport={'width':1300,'height':900},reduced_motion='reduce').new_page()
        page.on('pageerror',lambda e:errs.append(str(e)[:200]))
        page.goto(origin+'/index.html',wait_until='commit',timeout=60000)
        page.wait_for_function('!!(window.CV&&CV.go&&window.CVOrchestratorP128&&window.CVComfyP120P126)',timeout=90000,polling=500)
        page.evaluate("CV.go('platform')");page.wait_for_timeout(700)
        page.click('button[data-tab="api"]');page.wait_for_selector('#cv120-card',timeout=30000)
        page.evaluate("window.__cv120Saved=[];CV.assets.addBlob=async function(blob,name){if(!blob||typeof blob.size!=='number')return false;window.__cv120Saved.push({name:name,type:blob.type,size:blob.size});return true;}")
        c['mounted']=page.evaluate("!!(document.querySelector('#cv120-connect')&&document.querySelector('#cv120-run'))")
        page.fill('#cv120-url','http://127.0.0.1:%d'%mock.server_address[1])
        page.click('#cv120-connect');page.wait_for_function("document.querySelector('#cv120-connection').textContent.includes('Đã kết nối')",timeout=10000)
        c['connectsToLoopbackComfy']=True
        page.set_input_files('#cv120-workflow',str(wf));page.wait_for_function("document.querySelector('#cv120-status').textContent.includes('Đã nạp')",timeout=10000)
        page.set_input_files('#cv120-media',{'name':'input.png','mimeType':'image/png','buffer':PNG})
        page.fill('#cv120-prompt-node','1');page.fill('#cv120-prompt-key','text')
        page.fill('#cv120-media-node','2');page.fill('#cv120-media-key','image')
        page.fill('#cv120-prompt','Business editorial image, clean desk, natural light')
        page.select_option('#cv120-kind','image')
        page.click('#cv120-run')
        page.wait_for_function("document.querySelector('#cv120-status').textContent.includes('ComfyUI hoàn tất')",timeout=30000)
        c['workflowCompleted']=True
        c['inputMediaUploaded']=state['uploads']==1
        sent_graph=(state['workflow'] or {}).get('prompt',{})
        c['promptNodeOverridden']=bool(sent_graph.get('1',{}).get('inputs',{}).get('text')=='Business editorial image, clean desk, natural light')
        c['mediaNodeOverridden']=bool(sent_graph.get('2',{}).get('inputs',{}).get('image')=='canvio-input.png')
        c['historyPolled']=state['history']>=1 and state['views']==1
        c['savedToAssetLibrary']=page.evaluate("window.__cv120Saved.length===1&&window.__cv120Saved[0].name==='canvio-result.png'&&window.__cv120Saved[0].size>0")
        c['outputDownloadLink']=page.locator('#cv120-results a').count()==1
        c['noCloudKeysOrRemoteEndpoint']=page.evaluate("!Object.keys(localStorage).some(k=>/cv120.*key/i.test(k))")
        b.close()
result={'suite':'P120/P126 ComfyUI local workflow bridge','checks':c,'comfyState':{k:v for k,v in state.items() if k!='workflow'},'queuedWorkflow':state['workflow'],'pageErrors':errs,'failed':[k for k,v in c.items() if not v]}
print(json.dumps(result,ensure_ascii=False,indent=1));sys.exit(1 if result['failed'] or errs else 0)
