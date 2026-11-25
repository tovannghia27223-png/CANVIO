#!/usr/bin/env python3
"""P119.3 hosted Chromium acceptance: P119 presets/custom Motion curve are saved through the existing Video Engine keyframe Apply/snapshot path."""
import json, os, sys, threading, http.server, socketserver, functools, shutil, struct, zlib, base64
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
CHROME=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
def png_fixture():
    w,h=48,32
    raw=bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            raw.extend((48+x%2*24,80,120,255))
    def chunk(t,d):
        return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(raw)))+chunk(b'IEND',b'')
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Quiet,directory=ROOT));server.daemon_threads=True
threading.Thread(target=server.serve_forever,daemon=True).start()
url='http://127.0.0.1:%d/index.html'%server.server_address[1]
checks={};errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    page=browser.new_context(viewport={'width':1280,'height':900},reduced_motion='reduce').new_page()
    page.on('pageerror',lambda e:errors.append(str(e)[:240]))
    page.goto(url,wait_until='commit',timeout=60000)
    page.wait_for_function("!!(window.CV&&CV.go&&window.CVEasingP119&&window.CVVideoEasingP119)",timeout=90000,polling=500)
    page.evaluate("CV.go('videoEngine')")
    page.wait_for_function("!!(CV.engines&&CV.engines.video&&typeof CV.engines.video.importFiles==='function')",timeout=60000)
    image64=base64.b64encode(png_fixture()).decode('ascii')
    page.evaluate("""(encoded)=>{
      const raw=atob(encoded),bytes=new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      const file=new File([bytes],'p119-motion-fixture.png',{type:'image/png'});
      CV.engines.video.importFiles({target:{files:[file],value:''}});
      return true;
    }""",image64)
    page.wait_for_function("!!CV.engines.video._state().clips.some(c=>c.type==='image')",timeout=45000)
    clip_id=page.evaluate("CV.engines.video._state().clips.find(c=>c.type==='image').id")
    page.evaluate("(id)=>CV.engines.video.select(id)",clip_id)
    details=page.locator('#vtProps details').first
    if not details.evaluate('(el)=>el.open'):
        details.locator('summary').click()
    page.locator('#cv119v-select').wait_for(state='visible',timeout=30000)
    page.wait_for_selector('#vtKFEasing',timeout=30000)
    page.wait_for_selector('#cv119v-select',timeout=30000)
    checks['presetAdapterMounted']=page.locator('#cv119v-select').count()==1
    checks['presetOptionsFromP119']=page.locator('#cv119v-select option').count()>=8
    page.evaluate("""()=>{
      document.getElementById('vtKFStartOpacity').value='0';
      document.getElementById('vtKFEndOpacity').value='1';
      document.getElementById('vtKFStartOpacity').dispatchEvent(new Event('input',{bubbles:true}));
      document.getElementById('vtKFEndOpacity').dispatchEvent(new Event('input',{bubbles:true}));
    }""")
    page.select_option('#cv119v-select','preset:Mượt')
    checks['presetMapsToExistingCustomBezier']=page.evaluate("""()=>{
      const v=CV.engines.video._state(),e=document.getElementById('vtKFEasing').value;
      const c=['vtKFCurveX1','vtKFCurveY1','vtKFCurveX2','vtKFCurveY2'].map(id=>Number(document.getElementById(id).value));
      return e==='custom'&&c.every((x,i)=>Math.abs(x-[.2,.8,.3,1][i])<.001)
    }""")
    applied=page.evaluate("CV.engines.video.apply()")
    checks['nativeApplyAcceptedPreset']=applied is True
    saved=page.evaluate("""()=>{
      const s=CV.engines.video._state(),c=s.clips.find(x=>x.id===s.selected);
      return c&&c.motion&&c.motion.bezier?{curve:c.motion.bezier.slice(),opacity:CV.engines.video.motionAt(c,.5).opacity,clipId:c.id}:null
    }""")
    checks['curveSavedOnCanonicalClip']=bool(saved and all(abs(saved['curve'][i]-[.2,.8,.3,1][i])<.001 for i in range(4)))
    checks['P119SolverDrivesVideoKeyframes']=bool(saved and abs(saved['opacity']-page.evaluate("CVEasingP119.bez([.2,.8,.3,1],.5)"))<.003)
    snap=page.evaluate("CV.engines.video.snapshotState()")
    restored=page.evaluate("(s)=>CV.engines.video.restoreState(s)",snap)
    checks['existingVideoSnapshotKeepsPresetCurve']=restored is True and page.evaluate("""(id)=>{
      const c=CV.engines.video._state().clips.find(x=>x.id===id);
      return !!(c&&c.motion&&c.motion.bezier&&Math.abs(c.motion.bezier[1]-.8)<.001)
    }""",clip_id)
    page.evaluate("CV.go('motion')")
    page.wait_for_selector('#motionEase',timeout=30000)
    page.evaluate("""()=>{
      const el=document.getElementById('motionEase'),v='cubic-bezier(0.1,0.2,0.3,0.4)';
      let o=Array.from(el.options).find(x=>x.value===v);
      if(!o){o=document.createElement('option');o.value=v;o.textContent='P119.3 test curve';el.appendChild(o);}
      el.value=v;el.dispatchEvent(new Event('change',{bubbles:true}));
    }""")
    page.evaluate("CV.go('videoEngine')")
    page.evaluate("(id)=>CV.engines.video.select(id)",clip_id)
    page.wait_for_selector('#vtProps details',timeout=30000)
    details=page.locator('#vtProps details').first
    if not details.evaluate('(el)=>el.open'):
        details.locator('summary').click()
    page.locator('#cv119v-select').wait_for(state='visible',timeout=30000)
    page.select_option('#cv119v-select','motion')
    checks['customMotionCurveLoaded']=page.evaluate("""()=>{
      const v=document.getElementById('vtKFEasing').value;
      const c=['vtKFCurveX1','vtKFCurveY1','vtKFCurveX2','vtKFCurveY2'].map(id=>Number(document.getElementById(id).value));
      return v==='custom'&&c.every((x,i)=>Math.abs(x-[.1,.2,.3,.4][i])<.001)
    }""")
    custom_motion_before_apply=page.evaluate("""()=>{
      const get=id=>document.getElementById(id),s=CV.engines.video._state();
      return {selected:s&&s.selected,easing:get('vtKFEasing')&&get('vtKFEasing').value,
        curve:['vtKFCurveX1','vtKFCurveY1','vtKFCurveX2','vtKFCurveY2'].map(id=>get(id)?Number(get(id).value):null),
        required:['vtName','vtStart','vtLen','vtTrack'].map(id=>({id,present:!!get(id),value:get(id)&&get(id).value}))};
    }""")
    custom_motion_apply_result=page.evaluate("CV.engines.video.apply()")
    checks['customMotionApplyAccepted']=custom_motion_apply_result is True
    custom_motion_debug=page.evaluate("""(id)=>{
      const c=CV.engines.video._state().clips.find(x=>x.id===id);
      const m=c&&c.motion;
      return {
        clipFound:!!c,
        motionKeys:m?Object.keys(m):[],
        topLevelBezier:m&&Array.isArray(m.bezier)?m.bezier.slice():null,
        easing:m&&m.easing||null,
        keyframes:m&&Array.isArray(m.keyframes)?m.keyframes.map(k=>({
          t:k&&k.t, time:k&&k.time, property:k&&k.property, value:k&&k.value,
          opacity:k&&k.opacity, bezier:k&&Array.isArray(k.bezier)?k.bezier.slice():null,
          easing:k&&k.easing
        })):null,
        evaluatedMidOpacity:c&&CV.engines.video.motionAt?CV.engines.video.motionAt(c,.5).opacity:null
      };
    }""",clip_id)
    custom_motion_debug['applyResult']=custom_motion_apply_result
    custom_motion_debug['beforeApply']=custom_motion_before_apply
    checks['customMotionCurveSaved']=page.evaluate("""(id)=>{
      const c=CV.engines.video._state().clips.find(x=>x.id===id);
      return !!(c&&c.motion&&c.motion.bezier&&c.motion.bezier.every((x,i)=>Math.abs(x-[.1,.2,.3,.4][i])<.001))
    }""",clip_id)
    page.evaluate("""()=>{
      const el=document.getElementById('motionEase'),v='linear(0,0.5,1)';
      let o=Array.from(el.options).find(x=>x.value===v);
      if(!o){o=document.createElement('option');o.value=v;o.textContent='Spring test';el.appendChild(o);}
      el.value=v;el.dispatchEvent(new Event('change',{bubbles:true}));
    }""")
    page.evaluate("(id)=>CV.engines.video.select(id)",clip_id)
    page.wait_for_selector('#vtProps details',timeout=30000)
    details=page.locator('#vtProps details').first
    if not details.evaluate('(el)=>el.open'):
        details.locator('summary').click()
    page.locator('#cv119v-select').wait_for(state='visible',timeout=30000)
    before=page.locator('#vtKFCurveX1').input_value()
    page.select_option('#cv119v-select','motion')
    checks['springCurveRejectedWithoutMutation']=page.locator('#vtKFCurveX1').input_value()==before and 'linear()' in page.locator('#cv119v-status').inner_text()
    checks['existingTimelineOwnerUnchanged']=page.evaluate("id=>!!(CV.engines.video._state().clips.some(c=>c.id===id)&&typeof CV.engines.video.undo==='function'&&typeof CV.engines.video.snapshotState==='function')",clip_id)
    checks['zeroPageErrors']=len(errors)==0
    browser.close()
server.shutdown()
result={'suite':'CANVIO_P119_3_VIDEO_ENGINE_SHARED_EASING_CHROMIUM','checks':checks,'diagnostics':{'customMotionAfterApply':custom_motion_debug} if not (checks.get('customMotionCurveSaved',True) and checks.get('customMotionApplyAccepted',True)) else {},'pageErrors':errors,'failed':[k for k,v in checks.items() if not v]}
print(json.dumps(result,ensure_ascii=False,indent=1));sys.exit(1 if result['failed'] else 0)
