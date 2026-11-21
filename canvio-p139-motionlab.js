/* CANVIO P139.1 — Motion Lab parent/null hierarchy + per-character text animator.
 * Uses the existing Motion Lab objects and snapshotState/restoreState owner.
 * No second timeline or persistence store is introduced.
 */
(function(root){
'use strict';
const doc=root.document;
const clamp=(v,a,b,d)=>{const n=Number(v);return Number.isFinite(n)?Math.max(a,Math.min(b,n)):d;};
const deg=v=>Number(v||0)*Math.PI/180;
const idFor=()=> 'p139-'+(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
const CURVE_FALLBACK=[.2,.8,.3,1];
const MODES=['rise','fade','scale','wave','tracking'];
function normalizeCurve(value){
 const api=root.CVEasingP119;
 try{if(api&&typeof api.norm==='function')return api.norm(value);}catch(e){}
 const a=Array.isArray(value)?value.map(Number):CURVE_FALLBACK.slice();
 if(a.length!==4||a.some(x=>!Number.isFinite(x)))return CURVE_FALLBACK.slice();
 return [clamp(a[0],0,1,.2),clamp(a[1],-1,2,.8),clamp(a[2],0,1,.3),clamp(a[3],-1,2,1)];
}
function normalizeAnimator(raw){
 raw=raw&&typeof raw==='object'?raw:{};
 return {
  enabled:raw.enabled===true,
  mode:MODES.includes(raw.mode)?raw.mode:'rise',
  stagger:clamp(raw.stagger,0,1,.07),
  duration:clamp(raw.duration,.1,10,.8),
  strength:clamp(raw.strength,0,200,24),
  curve:normalizeCurve(raw.curve)
 };
}
function normalizeNull(raw){
 raw=raw&&typeof raw==='object'?raw:{};
 return {id:String(raw.id||idFor()).slice(0,100),type:'null',name:String(raw.name||'Null Controller').replace(/[<>]/g,'').slice(0,100),
  x:clamp(raw.x,-100000,100000,0),y:clamp(raw.y,-100000,100000,0),
  groupScale:clamp(raw.groupScale,.05,20,1),groupRotation:clamp(raw.groupRotation,-36000,36000,0),
  hidden:true,locked:false,motion:'none',delay:0,duration:5,ease:'linear'};
}
function mapObjects(state){
 const objs=Array.isArray(state)?state:(state&&Array.isArray(state.objs)?state.objs:[]);
 return new Map(objs.filter(x=>x&&typeof x.id==='string').map(x=>[x.id,x]));
}
function parentChain(parentId,map){
 const chain=[],seen=new Set();let id=parentId;
 while(id){
  if(seen.has(id))return null;
  seen.add(id);
  const p=map.get(id);if(!p||p.type!=='null')return null;
  chain.unshift(p);id=p.parentId||null;
 }
 return chain;
}
function wouldCycle(childId,parentId,map){
 if(!parentId)return false;
 if(childId===parentId)return true;
 const seen=new Set();let id=parentId;
 while(id){
  if(id===childId)return true;
  if(seen.has(id))return true;
  seen.add(id);
  const p=map.get(id);if(!p)return false;
  id=p.parentId||null;
 }
 return false;
}
function parentMatrixForObject(obj,map){
 if(!obj||!obj.parentId)return {x:0,y:0,scale:1,rotation:0};
 const chain=parentChain(obj.parentId,map);
 if(!chain)return {x:0,y:0,scale:1,rotation:0};
 let x=0,y=0,scale=1,rotation=0;
 chain.forEach(p=>{
  const lx=Number.isFinite(Number(p.x))?Number(p.x):0;
  const ly=Number.isFinite(Number(p.y))?Number(p.y):0;
  const c=Math.cos(rotation),s=Math.sin(rotation);
  x+=((lx*c)-(ly*s))*scale;
  y+=((lx*s)+(ly*c))*scale;
  scale*=clamp(p.groupScale,.05,20,1);
  rotation+=deg(p.groupRotation);
 });
 return {x,y,scale,rotation};
}
function transformPoint(m,x,y){
 const c=Math.cos(m.rotation||0),s=Math.sin(m.rotation||0),k=Number(m.scale)||1;
 return {x:m.x+(x*c-y*s)*k,y:m.y+(x*s+y*c)*k};
}
function inversePoint(m,x,y){
 const k=Math.max(.0001,Number(m.scale)||1),dx=(x-m.x)/k,dy=(y-m.y)/k,c=Math.cos(-(m.rotation||0)),s=Math.sin(-(m.rotation||0));
 return {x:dx*c-dy*s,y:dx*s+dy*c};
}
function worldPoint(obj,map){
 const m=parentMatrixForObject(obj,map);
 return transformPoint(m,Number(obj.x)||0,Number(obj.y)||0);
}
function textProgress(anim,time,delay,index){
 const local=(time-(Number(delay)||0)-index*anim.stagger)/Math.max(.1,anim.duration);
 const p=clamp(local,0,1,0),api=root.CVEasingP119;
 try{if(api&&typeof api.bez==='function')return clamp(api.bez(anim.curve,p),0,1,p);}catch(e){}
 return p*p*(3-2*p);
}
function tests(){
 const state={objs:[
  {id:'n1',type:'null',x:100,y:50,groupScale:2,groupRotation:90},
  {id:'n2',type:'null',x:10,y:0,groupScale:1,groupRotation:0,parentId:'n1'},
  {id:'t',type:'text',x:5,y:0,parentId:'n2'}
 ]},map=mapObjects(state),m=parentMatrixForObject(map.get('t'),map),pt=transformPoint(m,5,0);
 const anim=normalizeAnimator({enabled:true,mode:'flash',stagger:99,duration:0,strength:900,curve:[8,8,8,8]});
 return {
  parentTranslationAndRotation:Math.abs(pt.x-100)<.001&&Math.abs(pt.y-80)<.001,
  nestedScaleComposes:Math.abs(m.scale-2)<.001,
  cycleRejected:wouldCycle('n1','n2',map),
  selfParentRejected:wouldCycle('t','t',map),
  invalidAnimatorModeFallsBack:anim.mode==='rise',
  animatorValuesAreBounded:anim.stagger===1&&anim.duration===.1&&anim.strength===200,
  curveIsNormalized:anim.curve[0]===1&&anim.curve[1]===2,
  missingParentFailsClosed:parentMatrixForObject({parentId:'missing'},map).scale===1
 };
}
let ml=null,panel=null,mounted=false,frameMap=new Map(),frameTime=0;
function state(){try{return JSON.parse(ml.snapshotState());}catch(e){return {objs:[],duration:5};}}
function getMap(){return mapObjects(state());}
function selectedLayer(){const a=ml.getLayers();return a.find(x=>x.selected)||null;}
function safeRestore(s,selectId){
 const ok=ml.restoreState(s);
 if(ok&&selectId)ml.selectLayer(selectId);
 renderPanel();return ok;
}
function beginFrame(objs,time){frameMap=mapObjects(Array.isArray(objs)?objs:[]);frameTime=Number(time)||0;}
function applyParentTransform(obj,time,ctx){
 if(!obj||!obj.parentId||!ctx)return false;
 const m=parentMatrixForObject(obj,frameMap);
 if(m.scale===1&&m.rotation===0&&m.x===0&&m.y===0)return false;
 ctx.translate(m.x,m.y);ctx.rotate(m.rotation);ctx.scale(m.scale,m.scale);return true;
}
function drawText(ctx,obj,time){
 const a=normalizeAnimator(obj&&obj.textAnimator),value=String(obj&&obj.text||'');
 if(!a.enabled||!ctx||value.length>2000)return ctx.fillText(value,0,0);
 const chars=(root.Intl&&root.Intl.Segmenter)?Array.from(new root.Intl.Segmenter('vi',{granularity:'grapheme'}).segment(value),x=>x.segment):Array.from(value);
 if(chars.length<2)return ctx.fillText(value,0,0);
 const widths=chars.map(ch=>ctx.measureText(ch).width),total=widths.reduce((sum,w)=>sum+w,0);
 const align=ctx.textAlign||'start';let cursor=align==='center'?-total/2:(align==='right'||align==='end'?-total:0);
 const baseAlpha=ctx.globalAlpha,timeNow=Number(time)||frameTime;
 chars.forEach((ch,i)=>{
  const width=widths[i],p=textProgress(a,timeNow,obj&&obj.delay||0,i);
  let dx=0,dy=0,sc=1,alpha=1;
  if(a.mode==='rise')dy=(1-p)*a.strength;
  else if(a.mode==='fade')alpha=p;
  else if(a.mode==='scale')sc=.25+.75*p;
  else if(a.mode==='wave')dy=Math.sin((timeNow-(obj&&obj.delay||0))*7+i*.65)*a.strength*(1-p);
  else if(a.mode==='tracking')dx=i*a.strength/Math.max(1,chars.length-1);
  ctx.save();ctx.translate(cursor+width/2+dx,dy);ctx.scale(sc,sc);ctx.globalAlpha=baseAlpha*alpha;
  ctx.fillText(ch,0,0);ctx.restore();cursor+=width;
 });
 return undefined;
}
function readSelectedObject(){
 const sel=selectedLayer();if(!sel)return null;
 return state().objs.find(o=>o.id===sel.id)||null;
}
function createNullAsParent(childId){
 const s=state(),objs=s.objs||[],child=objs.find(o=>o.id===childId)||objs.find(o=>ml.getLayers().some(l=>l.id===o.id&&l.selected));
 if(!child||child.type==='null'||child.locked)return false;
 const map=mapObjects(s),world=worldPoint(child,map),parent=normalizeNull({id:idFor(),name:'Null · '+(child.name||child.text||child.type),x:world.x,y:world.y});
 child.x=0;child.y=0;child.parentId=parent.id;objs.push(parent);
 return safeRestore(s,child.id)?parent.id:false;
}
function addNull(){
 const s=state(),objs=s.objs||[],sel=readSelectedObject(),canvasEl=doc&&doc.getElementById('mlCanvas');
 const parent=normalizeNull({id:idFor(),name:'Null Controller',x:sel?(Number(sel.x)||canvasEl.width/2):(canvasEl?canvasEl.width/2:480),y:sel?(Number(sel.y)||canvasEl.height/2):(canvasEl?canvasEl.height/2:270)});
 objs.push(parent);return safeRestore(s,sel&&sel.id)?parent.id:false;
}
function setParent(childId,parentId){
 const s=state(),objs=s.objs||[],map=mapObjects(s),child=map.get(childId),parent=map.get(parentId);
 if(!child||!parent||parent.type!=='null'||child.locked||wouldCycle(childId,parentId,map))return false;
 const currentWorld=worldPoint(child,map);
 const newM=parentMatrixForObject({parentId:parentId},map),local=inversePoint(newM,currentWorld.x,currentWorld.y);
 child.parentId=parentId;child.x=local.x;child.y=local.y;
 return safeRestore(s,childId);
}
function unparent(childId){
 const s=state(),map=mapObjects(s),child=map.get(childId);if(!child||!child.parentId||child.locked)return false;
 const world=worldPoint(child,map);child.x=world.x;child.y=world.y;delete child.parentId;return safeRestore(s,childId);
}
function setNullTransform(id,patch){
 const s=state(),obj=mapObjects(s).get(id);if(!obj||obj.type!=='null')return false;
 patch=patch&&typeof patch==='object'?patch:{};
 if(patch.x!==undefined)obj.x=clamp(patch.x,-100000,100000,Number(obj.x)||0);
 if(patch.y!==undefined)obj.y=clamp(patch.y,-100000,100000,Number(obj.y)||0);
 if(patch.scale!==undefined)obj.groupScale=clamp(patch.scale,.05,20,Number(obj.groupScale)||1);
 if(patch.rotation!==undefined)obj.groupRotation=clamp(patch.rotation,-36000,36000,Number(obj.groupRotation)||0);
 return safeRestore(s,selectedLayer()?.id||null);
}
function configureTextAnimator(id,raw){
 const s=state(),obj=mapObjects(s).get(id);if(!obj||obj.type!=='text'||obj.locked)return false;
 obj.textAnimator=normalizeAnimator(Object.assign({},obj.textAnimator||{},raw||{}));
 return safeRestore(s,id);
}
function removeNull(id){
 const s=state(),map=mapObjects(s),parent=map.get(id);if(!parent||parent.type!=='null'||parent.locked)return false;
 const children=(s.objs||[]).filter(o=>o.parentId===id);
 children.forEach(child=>{const w=worldPoint(child,map);child.x=w.x;child.y=w.y;delete child.parentId;});
 s.objs=s.objs.filter(o=>o.id!==id);return safeRestore(s,children[0]?.id||null);
}
function renderPanel(){
 if(!panel||!ml)return;
 const s=state(),objs=s.objs||[],layers=ml.getLayers(),sel=selectedLayer(),selected=sel&&objs.find(o=>o.id===sel.id);
 const list=panel.querySelector('#cv139-layers'),parentSel=panel.querySelector('#cv139-parent');
 if(list)list.innerHTML=layers.map(l=>'<button type="button" class="cv139-layer '+(l.selected?'is-selected':'')+'" data-cv139-select="'+String(l.id).replace(/["&<>]/g,'')+'">'+(l.type==='null'?'◉ ':'')+String(l.name||l.type).replace(/[&<>]/g,'')+(l.type==='null'?' · Null':'')+(l.locked?' · Khóa':'')+'</button>').join('')||'<p class="cv139-empty">Chưa có layer. Thêm chữ/hình trong Motion Lab.</p>';
 if(parentSel){
  const current=selected&&selected.parentId||'';
  parentSel.innerHTML='<option value="">Không có parent</option>'+objs.filter(o=>o.type==='null'&&o.id!==selected?.id).map(o=>'<option value="'+String(o.id).replace(/["&<>]/g,'')+'">'+String(o.name||'Null').replace(/[&<>]/g,'')+'</option>').join('');
  parentSel.value=current;
 }
 const nullPanel=panel.querySelector('#cv139-null-controls'),textPanel=panel.querySelector('#cv139-text-controls');
 if(nullPanel)nullPanel.hidden=!(selected&&selected.type==='null');
 if(textPanel)textPanel.hidden=!(selected&&selected.type==='text');
 if(selected&&selected.type==='null'){
  panel.querySelector('#cv139-x').value=Number(selected.x)||0;panel.querySelector('#cv139-y').value=Number(selected.y)||0;
  panel.querySelector('#cv139-scale').value=Number(selected.groupScale)||1;panel.querySelector('#cv139-rotation').value=Number(selected.groupRotation)||0;
 }
 if(selected&&selected.type==='text'){
  const a=normalizeAnimator(selected.textAnimator);
  panel.querySelector('#cv139-enabled').checked=a.enabled;panel.querySelector('#cv139-mode').value=a.mode;
  panel.querySelector('#cv139-stagger').value=a.stagger;panel.querySelector('#cv139-duration').value=a.duration;
  panel.querySelector('#cv139-strength').value=a.strength;
  panel.querySelector('#cv139-stagger-value').textContent=a.stagger.toFixed(2)+'s';
  panel.querySelector('#cv139-duration-value').textContent=a.duration.toFixed(1)+'s';
  panel.querySelector('#cv139-strength-value').textContent=Math.round(a.strength)+'px';
 }
}
function applyNullInputs(){
 const sel=selectedLayer();if(!sel)return false;
 return setNullTransform(sel.id,{x:panel.querySelector('#cv139-x').value,y:panel.querySelector('#cv139-y').value,
  scale:panel.querySelector('#cv139-scale').value,rotation:panel.querySelector('#cv139-rotation').value});
}
function applyTextInputs(){
 const sel=selectedLayer();if(!sel)return false;
 const curveName=panel.querySelector('#cv139-curve').value,api=root.CVEasingP119,curve=api&&api.PRESETS&&api.PRESETS[curveName]||CURVE_FALLBACK;
 return configureTextAnimator(sel.id,{enabled:panel.querySelector('#cv139-enabled').checked,mode:panel.querySelector('#cv139-mode').value,
  stagger:panel.querySelector('#cv139-stagger').value,duration:panel.querySelector('#cv139-duration').value,
  strength:panel.querySelector('#cv139-strength').value,curve:curve});
}
function bind(){
 if(!panel||panel.dataset.bound)return;panel.dataset.bound='1';
 panel.addEventListener('click',e=>{
  const select=e.target.closest('[data-cv139-select]');if(select){ml.selectLayer(select.dataset.cv139Select);renderPanel();return;}
  const b=e.target.closest('[data-cv139]');if(!b)return;
  const action=b.dataset.cv139,sel=selectedLayer(),parent=panel.querySelector('#cv139-parent').value;
  if(action==='add-null')addNull();
  else if(action==='create-parent'){if(sel)createNullAsParent(sel.id);}
  else if(action==='set-parent'){if(sel&&parent)setParent(sel.id,parent);}
  else if(action==='unparent'){if(sel)unparent(sel.id);}
  else if(action==='delete-null'){if(sel)removeNull(sel.id);}
  else if(action==='apply-null')applyNullInputs();
  else if(action==='apply-text')applyTextInputs();
  else if(action==='reset-text'){if(sel)configureTextAnimator(sel.id,{enabled:false});}
  renderPanel();
 });
 panel.addEventListener('input',e=>{
  if(e.target.id==='cv139-stagger')panel.querySelector('#cv139-stagger-value').textContent=Number(e.target.value).toFixed(2)+'s';
  if(e.target.id==='cv139-duration')panel.querySelector('#cv139-duration-value').textContent=Number(e.target.value).toFixed(1)+'s';
  if(e.target.id==='cv139-strength')panel.querySelector('#cv139-strength-value').textContent=Math.round(Number(e.target.value))+'px';
 });
 panel.addEventListener('change',e=>{
  if(['cv139-x','cv139-y','cv139-scale','cv139-rotation'].includes(e.target.id))applyNullInputs();
 });
}
function mount(){
 if(mounted)return true;if(!doc||!root.CVNativeEngines||!root.CVNativeEngines.motionLab)return false;
 const page=doc.getElementById('page-motionLab'),canvasEl=doc.getElementById('mlCanvas');if(!page||!canvasEl)return false;
 ml=root.CVNativeEngines.motionLab;if(!canvasEl.getContext('2d'))return false;
 if(ml.__p139Wrapped)return false;
 if(typeof ml.draw!=='function'||typeof ml.snapshotState!=='function'||typeof ml.restoreState!=='function')return false;
 panel=doc.createElement('section');panel.id='cv139-panel';panel.className='cv139-panel';panel.setAttribute('aria-labelledby','cv139-title');
 const curves=root.CVEasingP119&&root.CVEasingP119.PRESETS||{'Mượt':CURVE_FALLBACK};
 panel.innerHTML='<div class="cv139-head"><div><span class="cv139-kicker">MOTION LAB · P139</span><h3 id="cv139-title">Parent / Null & Text Animator</h3><p>Gắn đối tượng vào Null Controller và tạo hoạt ảnh theo từng ký tự bằng easing P119.</p></div><span class="cv139-status">Dùng chung snapshot Motion Lab</span></div>'+
 '<div class="cv139-grid"><div class="cv139-box"><b>HỆ PHÂN CẤP LAYER</b><div id="cv139-layers" class="cv139-layers"></div><div class="cv139-actions"><button type="button" data-cv139="add-null">＋ Thêm Null</button><button type="button" class="cv139-primary" data-cv139="create-parent">Tạo Null làm parent cho layer chọn</button></div><div class="cv139-parent"><select id="cv139-parent" aria-label="Chọn Null parent"><option value="">Không có parent</option></select><button type="button" data-cv139="set-parent">Gán parent</button><button type="button" data-cv139="unparent">Bỏ parent</button></div></div>'+
 '<div class="cv139-box" id="cv139-null-controls" hidden><b>NULL TRANSFORM</b><div class="cv139-fields"><label>X <input id="cv139-x" type="number" step="1"></label><label>Y <input id="cv139-y" type="number" step="1"></label><label>Scale <input id="cv139-scale" type="number" min="0.05" max="20" step="0.05"></label><label>Rotation ° <input id="cv139-rotation" type="number" step="1"></label></div><div class="cv139-actions"><button type="button" data-cv139="apply-null">Áp dụng transform</button><button type="button" data-cv139="delete-null">Xóa Null</button></div></div>'+
 '<div class="cv139-box" id="cv139-text-controls" hidden><b>TEXT ANIMATOR · THEO KÝ TỰ</b><label class="cv139-check"><input id="cv139-enabled" type="checkbox"> Bật Text Animator</label><label>Kiểu <select id="cv139-mode"><option value="rise">Rise · Trượt lên</option><option value="fade">Fade · Mờ dần</option><option value="scale">Scale · Phóng to</option><option value="wave">Wave · Sóng</option><option value="tracking">Tracking · Giãn chữ</option></select></label><label>Stagger <output id="cv139-stagger-value">0.07s</output><input id="cv139-stagger" type="range" min="0" max=".5" step=".01" value=".07"></label><label>Duration <output id="cv139-duration-value">0.8s</output><input id="cv139-duration" type="range" min=".1" max="3" step=".1" value=".8"></label><label>Strength <output id="cv139-strength-value">24px</output><input id="cv139-strength" type="range" min="0" max="100" step="1" value="24"></label><label>Easing P119 <select id="cv139-curve">'+Object.keys(curves).map(k=>'<option value="'+String(k).replace(/["&<>]/g,'')+'">'+String(k).replace(/[&<>]/g,'')+'</option>').join('')+'</select></label><div class="cv139-actions"><button type="button" class="cv139-primary" data-cv139="apply-text">Áp dụng Text Animator</button><button type="button" data-cv139="reset-text">Tắt Animator</button></div></div></div>'+
 '<p class="cv139-note"><b>Giới hạn P139.1:</b> hỗ trợ parent/null phân cấp và text animator theo ký tự. Metadata nằm trực tiếp trong đối tượng Motion Lab nên đi theo snapshot/local project hiện có. Precomp, motion blur vật lý và animator theo word/range nâng cao chưa có trong increment này.</p>';
 const style=doc.createElement('style');style.id='canvio-lot139-css';style.textContent='#cv139-panel{margin:18px 0;padding:18px;border:1px solid var(--border,#dce3ee);border-radius:16px;background:var(--card,#fff);color:var(--text,#182230);box-shadow:0 8px 24px rgba(20,34,55,.05)}#cv139-panel .cv139-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}#cv139-panel .cv139-kicker{font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--brand,#1769e0)}#cv139-panel h3{margin:5px 0;font-size:18px}#cv139-panel p{color:var(--muted,#657184);font-size:12px;line-height:1.55}#cv139-panel .cv139-status{font-size:11px;color:var(--muted,#657184)}#cv139-panel .cv139-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}#cv139-panel .cv139-box{border:1px solid var(--border,#e3e8f0);padding:12px;border-radius:12px;min-width:0}#cv139-panel .cv139-box>b{display:block;font-size:10px;letter-spacing:.1em;color:var(--muted,#657184);margin-bottom:10px}#cv139-panel .cv139-box[hidden]{display:none}#cv139-panel .cv139-layers{display:grid;gap:6px;max-height:180px;overflow:auto}#cv139-panel .cv139-layer{font:inherit;text-align:left;border:1px solid var(--border,#dce3ee);background:var(--surface,#f7f9fc);border-radius:8px;padding:7px 9px;font-size:11px;color:inherit;cursor:pointer}#cv139-panel .cv139-layer.is-selected{border-color:var(--brand,#1769e0);background:rgba(23,105,224,.08)}#cv139-panel .cv139-empty{padding:10px;border:1px dashed var(--border,#dce3ee)}#cv139-panel .cv139-actions,#cv139-panel .cv139-parent{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}#cv139-panel button,#cv139-panel input,#cv139-panel select{font:inherit}#cv139-panel button{border:1px solid var(--border,#dce3ee);background:var(--surface,#f7f9fc);border-radius:8px;padding:7px 9px;font-size:11px;cursor:pointer;color:inherit}#cv139-panel button:focus-visible,#cv139-panel input:focus-visible,#cv139-panel select:focus-visible{outline:2px solid var(--brand,#1769e0);outline-offset:2px}#cv139-panel .cv139-primary{background:var(--brand,#1769e0);border-color:transparent;color:#fff}#cv139-panel select,#cv139-panel input[type=number]{border:1px solid var(--border,#dce3ee);border-radius:8px;background:var(--input,#fff);color:inherit;padding:6px 7px;min-width:0;max-width:100%}#cv139-panel .cv139-parent select{flex:1}#cv139-panel .cv139-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}#cv139-panel .cv139-fields label,#cv139-panel #cv139-text-controls>label{display:grid;gap:5px;font-size:11px;margin:8px 0}#cv139-panel #cv139-text-controls input[type=range]{width:100%;accent-color:var(--brand,#1769e0)}#cv139-panel .cv139-check{display:flex;align-items:center;gap:8px;font-size:11px;margin:6px 0}#cv139-panel output{font-weight:700;color:var(--brand,#1769e0)}#cv139-panel .cv139-note{margin-top:12px;background:var(--surface,#f4f6fa);border-radius:9px;padding:10px 12px}#cv139-panel button:disabled{opacity:.5;cursor:not-allowed}@media(max-width:760px){#cv139-panel .cv139-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){#cv139-panel *{transition:none!important;scroll-behavior:auto!important}}';
 if(!doc.getElementById('canvio-lot139-css'))doc.head.appendChild(style);
 const note=page.querySelector('.ne-note');if(note&&note.parentNode)note.parentNode.insertBefore(panel,note);else page.appendChild(panel);
 const nativeAction=ml.action,nativeSelect=ml.selectLayer,nativeRestore=ml.restoreState;
 ml.action=function(){const r=nativeAction.apply(ml,arguments);renderPanel();return r;};
 ml.selectLayer=function(id){const r=nativeSelect.call(ml,id);renderPanel();return r;};
 ml.restoreState=function(raw){const r=nativeRestore.call(ml,raw);renderPanel();return r;};
 ml.__p139Wrapped=true;bind();renderPanel();mounted=true;return true;
}
const api={version:'139.1.0',normalizeAnimator,normalizeNull,normalizeCurve,parentMatrixForObject,transformPoint,inversePoint,wouldCycle,beginFrame,applyParentTransform,drawText,tests,mount,
 addNull,createNullAsParent,setParent,unparent,setNullTransform,configureTextAnimator,removeNull,
 getState:()=>state()};
root.CVMotionLabP139=api;
if(doc){if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mount,{once:true});else mount();}
})(window);
