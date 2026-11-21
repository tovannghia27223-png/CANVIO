/* CANVIO P119.3 — shared P119 presets for the existing Video Engine keyframe inspector.
 * Uses the current CVEasingP119 registry and the canonical vtKFEasing/Bezier fields.
 * The user still commits through CV.engines.video.apply(); no timeline, history or store is created.
 */
(function(root){
'use strict';
if(root.CVVideoEasingP119)return;
const doc=root.document;
const PRESET_ORDER=['Mượt','Giảm tốc','Tăng tốc','Đều hai đầu','Nảy nhẹ','Tuyến tính'];
const BUILTIN={
 linear:[0,0,1,1],
 'ease-in':[.42,0,1,1],
 'ease-out':[0,0,.58,1],
 'ease-in-out':[.42,0,.58,1]
};
let observer=null,applying=false,mountedNode=null;
const $=id=>doc&&doc.getElementById(id);
const copy=c=>Array.isArray(c)?c.map(Number):null;
function validCurve(c){
 if(!Array.isArray(c)||c.length!==4)return false;
 const n=c.map(Number);
 return n.every(Number.isFinite)&&n[0]>=0&&n[0]<=1&&n[2]>=0&&n[2]<=1&&n[1]>=-2&&n[1]<=2&&n[3]>=-2&&n[3]<=2;
}
function normalized(c){
 if(!validCurve(c))return null;
 const api=root.CVEasingP119;
 return api&&typeof api.norm==='function'?api.norm(c):c.map(v=>Math.round(Number(v)*1000)/1000);
}
function equalCurve(a,b,epsilon){
 if(!validCurve(a)||!validCurve(b))return false;
 epsilon=Number.isFinite(epsilon)?epsilon:0.0011;
 return a.every((v,i)=>Math.abs(Number(v)-Number(b[i]))<=epsilon);
}
function presetMap(){
 const api=root.CVEasingP119;
 if(!api||!api.PRESETS)return {};
 return api.PRESETS;
}
function curveForBuiltin(name){return copy(BUILTIN[name]||BUILTIN.linear);}
function findPreset(curve){
 const map=presetMap();
 for(const name of PRESET_ORDER){
  if(map[name]&&equalCurve(curve,map[name]))return name;
 }
 return null;
}
function parseMotionCurve(){
 const api=root.CVEasingP119,select=$('motionEase');
 if(!api||typeof api.parse!=='function'||!select)return null;
 return api.parse(select.value);
}
function selectedClip(){
 const video=root.CV&&root.CV.engines&&root.CV.engines.video;
 const state=video&&typeof video._state==='function'?video._state():null;
 if(!state||!Array.isArray(state.clips))return null;
 return state.clips.find(c=>c&&c.id===state.selected)||null;
}
function motionSegments(motion){
 if(!motion||!Array.isArray(motion.keyframes)||motion.keyframes.length<2)return null;
 return motion.keyframes.slice(0,-1).map(frame=>{
  if(frame&&validCurve(frame.bezier))return copy(frame.bezier);
  if(validCurve(motion.bezier))return copy(motion.bezier);
  return curveForBuiltin((frame&&frame.easing)||motion.easing||'linear');
 });
}
function motionCurveState(clip){
 const motion=clip&&clip.motion;
 if(!motion)return {curve:curveForBuiltin('linear'),kind:'linear',mixed:false};
 const segments=motionSegments(motion);
 if(segments&&segments.length){
  const first=segments[0];
  if(segments.some(c=>!equalCurve(c,first,1e-7)))return {curve:null,kind:'mixed',mixed:true};
  const preset=findPreset(first);
  return {curve:first,kind:preset?'preset':'custom',preset:preset,mixed:false};
 }
 const curve=validCurve(motion.bezier)?copy(motion.bezier):curveForBuiltin(motion.easing||'linear');
 const preset=findPreset(curve);
 if(!motion.bezier&&BUILTIN[motion.easing||'linear'])return {curve:curve,kind:'builtin',builtin:motion.easing||'linear',preset:preset,mixed:false};
 return {curve:curve,kind:preset?'preset':'custom',preset:preset,mixed:false};
}
function nativeCurveState(){
 const easing=$('vtKFEasing');
 if(!easing)return {curve:curveForBuiltin('linear'),kind:'linear'};
 if(easing.value!=='custom')return {curve:curveForBuiltin(easing.value),kind:easing.value};
 const ids=['vtKFCurveX1','vtKFCurveY1','vtKFCurveX2','vtKFCurveY2'];
 const values=ids.map(id=>{const n=$(id);return n?Number(n.value):NaN;});
 return validCurve(values)?{curve:values,kind:findPreset(values)?'preset':'custom',preset:findPreset(values)}:{curve:null,kind:'invalid'};
}
function setStatus(message,warning){
 const out=$('cv119v-status');if(!out)return;
 const next=message||'Chọn preset rồi bấm Áp dụng để lưu vào clip.';
 if(out.textContent!==next)out.textContent=next;
 out.dataset.state=warning?'warning':'info';
}
function dispatch(node,type){
 if(!node)return;
 try{node.dispatchEvent(new root.Event(type,{bubbles:true}));}catch(e){}
}
function setNativeCurve(curve){
 if(!validCurve(curve))return false;
 const easing=$('vtKFEasing'),ids=['vtKFCurveX1','vtKFCurveY1','vtKFCurveX2','vtKFCurveY2'];
 if(!easing||ids.some(id=>!$(id)))return false;
 const n=normalized(curve);
 applying=true;
 try{
  easing.value=equalCurve(n,BUILTIN.linear)?'linear':'custom';
  ids.forEach((id,i)=>{const input=$(id);input.value=String(n[i]);dispatch(input,'input');dispatch(input,'change');});
  dispatch(easing,'change');
 }finally{applying=false;}
 return true;
}
function choosePreset(name){
 const map=presetMap(),curve=map[name];
 if(!curve||!setNativeCurve(curve)){setStatus('Không thể áp dụng preset: Video Engine chưa mở clip hình/video.',true);return false;}
 setStatus('Đã chọn preset “'+name+'”. Bấm Áp dụng để lưu vào clip bằng lịch sử hiện tại.');
 return true;
}
function chooseMotion(){
 const curve=parseMotionCurve();
 if(!curve){setStatus('Motion hiện không dùng cubic-bezier hợp lệ. Preset lò xo linear() không thể chuyển thành một đường Bezier duy nhất.',true);return false;}
 if(!setNativeCurve(curve)){setStatus('Chưa thể nhận đường cong từ Motion: hãy chọn clip hình/video trước.',true);return false;}
 const name=findPreset(curve);
 setStatus(name?'Đã lấy preset “'+name+'” từ Motion. Bấm Áp dụng để lưu.':'Đã lấy cubic-bezier tùy chỉnh từ Motion. Bấm Áp dụng để lưu.');
 return true;
}
function populate(select){
 select.replaceChildren();
 const placeholder=doc.createElement('option');placeholder.value='';placeholder.textContent='Preset easing P119…';select.appendChild(placeholder);
 PRESET_ORDER.forEach(name=>{
  if(!presetMap()[name])return;
  const option=doc.createElement('option');option.value='preset:'+name;option.textContent=name;select.appendChild(option);
 });
 const motion=doc.createElement('option');motion.value='motion';motion.textContent='Lấy đường cong từ Motion';select.appendChild(motion);
 const current=doc.createElement('option');current.value='current-custom';current.textContent='Tuỳ chỉnh hiện tại';select.appendChild(current);
}
function refreshSelection(panel){
 const select=panel&&panel.querySelector('#cv119v-select');if(!select)return;
 const clip=selectedClip(),locked=!!(clip&&clip.locked);
 select.disabled=!clip||locked;
 if(locked){setStatus('Clip đang khóa. Mở khóa trong Video Engine trước khi đổi easing.',true);return;}
 const state=clip?motionCurveState(clip):nativeCurveState();
 if(state.mixed){select.value='current-custom';setStatus('Clip có nhiều đường cong theo từng đoạn keyframe; preset không đồng nhất nên đang giữ nguyên.');return;}
 if(state.preset&&select.querySelector('option[value="preset:'+state.preset+'"]'))select.value='preset:'+state.preset;
 else if(state.kind==='linear'||state.kind==='ease-in'||state.kind==='ease-out'||state.kind==='ease-in-out'){
  const map={'linear':'Tuyến tính','ease-in':'Tăng tốc','ease-out':'Giảm tốc','ease-in-out':'Đều hai đầu'};
  const name=map[state.kind];select.value=name&&select.querySelector('option[value="preset:'+name+'"]')?'preset:'+name:'current-custom';
 }else select.value='current-custom';
}
function mount(){
 if(!doc)return false;
 const native=$('vtKFEasing'),box=$('vtProps');
 if(!native||!box||!native.parentElement)return false;
 const existing=$('cv119v-preset-field');
 if(existing){mountedNode=existing;refreshSelection(existing);return true;}
 const field=doc.createElement('div');
 field.id='cv119v-preset-field';
 field.className='field';
 field.style.cssText='margin-top:8px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2,transparent)';
 field.innerHTML='<label for="cv119v-select" style="font-weight:700">Preset easing dùng chung · P119</label><select id="cv119v-select" style="width:100%;margin-top:5px"></select><small id="cv119v-status" role="status" aria-live="polite" style="display:block;margin-top:6px;color:var(--muted);line-height:1.45">Chọn preset rồi bấm Áp dụng để lưu vào clip.</small>';
 const nativeField=native.closest('.field')||native.parentElement;
 nativeField.parentNode.insertBefore(field,nativeField.nextSibling);
 const select=field.querySelector('#cv119v-select');populate(select);
 select.addEventListener('change',()=>{
  if(applying)return;
  const value=select.value;
  if(value.indexOf('preset:')===0)choosePreset(value.slice(7));
  else if(value==='motion')chooseMotion();
  else if(value==='current-custom')setStatus('Giữ nguyên curve tùy chỉnh trong các trường X1/Y1/X2/Y2.');
 });
 ['vtKFCurveX1','vtKFCurveY1','vtKFCurveX2','vtKFCurveY2'].forEach(id=>{
  const input=$(id);if(input)input.addEventListener('input',()=>{
   if(applying)return;
   const s=field.querySelector('#cv119v-select');if(s)s.value='current-custom';
   setStatus('Đang dùng curve tùy chỉnh. Bấm Áp dụng để lưu.');
  });
 });
 native.addEventListener('change',()=>{if(!applying)refreshSelection(field);});
 mountedNode=field;refreshSelection(field);return true;
}
function start(){
 if(mount())return;
 if(observer||!doc||!root.MutationObserver)return;
 observer=new root.MutationObserver(()=>{if(mount()&&mountedNode&&mountedNode.isConnected)refreshSelection(mountedNode);});
 observer.observe(doc.documentElement||doc,{childList:true,subtree:true});
}
function stop(){
 if(observer){observer.disconnect();observer=null;}
}
function tests(){
 const api=root.CVEasingP119,map=presetMap(),keys=PRESET_ORDER.filter(k=>validCurve(map[k]));
 const motionValid=!!api&&typeof api.parse==='function'&&!!api.parse('cubic-bezier(.2,.8,.3,1)');
 const motionSpringRejected=!!api&&api.parse('linear(0,0.5,1)')===null;
 const builtinMapping=['linear','ease-in','ease-out','ease-in-out'].map(k=>validCurve(curveForBuiltin(k))).every(Boolean);
 const presetRoundTrip=keys.length===6&&keys.every(k=>findPreset(map[k])===k);
 const curveMatchesUseTolerance=equalCurve([.2001,.8001,.3001,1],[.2,.8,.3,1]);
 const multipleSegmentCurvesDetected=motionCurveState({motion:{keyframes:[{t:0,bezier:[.2,.8,.3,1]},{t:50,bezier:[.4,0,1,1]},{t:100}]}}).mixed===true;
 return {sixP119PresetsAvailable:keys.length===6,customMotionCubicBezierParsed:motionValid,motionSpringNotMisreadAsBezier:motionSpringRejected,builtinMotionMappingsValid:builtinMapping,presetRoundTrip,presetMatchingTolerance:curveMatchesUseTolerance,mixedKeyframeCurvesRemainUnchanged:multipleSegmentCurvesDetected};
}
const api={version:'119.3.0',presets:()=>Object.assign({},presetMap()),curveFromMotion:parseMotionCurve,findPreset:findPreset,motionCurveState:motionCurveState,setNativeCurve:setNativeCurve,choosePreset:choosePreset,chooseMotion:chooseMotion,mount:mount,start:start,stop:stop,tests:tests};
root.CVVideoEasingP119=api;
if(doc){if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(window);
