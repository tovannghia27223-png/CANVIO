/* CANVIO P135.2 — non-destructive adjustment stack with Project Vault round-trip.
 * The editable stack is serialized beside the canonical Pixel raster snapshot.
 * Project Vault remains the single persistence owner; no second project store is created.
 * Export applies the stack to a derived canvas; the original raster canvas remains unchanged.
 */
(function(root){
'use strict';
const doc=root.document,LIMIT=32;
const SPECS={
 brightness:{label:'Độ sáng',min:0,max:200,step:1,initial:100,unit:'%'},
 contrast:{label:'Tương phản',min:0,max:200,step:1,initial:100,unit:'%'},
 saturate:{label:'Bão hòa',min:0,max:200,step:1,initial:100,unit:'%'},
 hue:{label:'Dịch màu',min:-180,max:180,step:1,initial:0,unit:'°'},
 blur:{label:'Làm mờ',min:0,max:12,step:.1,initial:0,unit:'px'},
 grayscale:{label:'Đen trắng',min:0,max:100,step:1,initial:0,unit:'%'},
 sepia:{label:'Sepia',min:0,max:100,step:1,initial:0,unit:'%'},
 invert:{label:'Đảo màu',min:0,max:100,step:1,initial:0,unit:'%'},
 opacity:{label:'Độ mờ',min:0,max:100,step:1,initial:100,unit:'%'}
};
let seq=0,layers=[],selectedId=null,undo=[],redo=[],panel=null,canvas=null,status=null,px=null;
let originalDraw=null,originalAct=null,originalLoad=null,originalSnapshotState=null,originalRestoreState=null,inputEditing=false,mounted=false;
const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function normalizeLayer(raw,index){
 raw=raw&&typeof raw==='object'?raw:{};
 const type=Object.prototype.hasOwnProperty.call(SPECS,raw.type)?raw.type:'brightness',spec=SPECS[type];
 return {id:String(raw.id||('p135-'+(++seq))).slice(0,80),type:type,
  name:String(raw.name||spec.label).replace(/[<>]/g,'').slice(0,64)||spec.label,
  value:clamp(raw.value,spec.min,spec.max,spec.initial),enabled:raw.enabled!==false,order:index};
}
function normalizeLayers(input){
 const seen=new Set();
 return (Array.isArray(input)?input.slice(0,LIMIT):[]).map((x,i)=>normalizeLayer(x,i)).filter(x=>{
  if(seen.has(x.id))return false;seen.add(x.id);return true;
 }).map((x,i)=>Object.assign({},x,{order:i}));
}
function filterFor(input){
 const parts=[];
 normalizeLayers(input).forEach(layer=>{
  if(!layer.enabled)return;
  const v=layer.value;
  if(layer.type==='brightness')parts.push('brightness('+v+'%)');
  else if(layer.type==='contrast')parts.push('contrast('+v+'%)');
  else if(layer.type==='saturate')parts.push('saturate('+v+'%)');
  else if(layer.type==='hue')parts.push('hue-rotate('+v+'deg)');
  else if(layer.type==='blur')parts.push('blur('+v+'px)');
  else if(layer.type==='grayscale')parts.push('grayscale('+v+'%)');
  else if(layer.type==='sepia')parts.push('sepia('+v+'%)');
  else if(layer.type==='invert')parts.push('invert('+v+'%)');
  else if(layer.type==='opacity')parts.push('opacity('+v+'%)');
 });
 return parts.length?parts.join(' '):'none';
}
function hasAdjustments(){return layers.some(x=>x.enabled&&Math.abs(x.value-SPECS[x.type].initial)>.0001);}
function snapshot(){return {layers:clone(layers),selectedId:selectedId};}
function checkpoint(){undo.push(snapshot());if(undo.length>40)undo.shift();redo=[];}
function setStatus(message){if(status)status.textContent=message;}
function selected(){return layers.find(x=>x.id===selectedId)||null;}
function renderPreview(){
 if(!canvas&&px)canvas=px.canvas||doc.getElementById('pxCanvas');
 if(!canvas)return;
 canvas.style.filter=filterFor(layers);
 if(canvas.style.filter==='none')canvas.style.removeProperty('filter');
 const count=layers.length,enabled=layers.filter(x=>x.enabled).length;
 setStatus(count?count+' lớp · '+enabled+' đang bật'+(hasAdjustments()?' · xem trước không phá hủy':''):'Chưa có lớp điều chỉnh');
}
function render(){
 if(!panel)return;
 const list=panel.querySelector('#cv135-layer-list'),sel=selected();
 if(list){
  list.innerHTML=layers.length?layers.map(x=>'<div class="cv135-layer '+(x.id===selectedId?'is-selected':'')+'">'+
   '<button type="button" class="cv135-layer-main" data-cv135-select="'+esc(x.id)+'" aria-pressed="'+(x.id===selectedId)+'">'+
   '<span class="cv135-layer-state">'+(x.enabled?'●':'○')+'</span><span class="cv135-layer-label">'+esc(x.name)+'</span>'+
   '<small>'+esc(SPECS[x.type].label)+' · '+x.value+esc(SPECS[x.type].unit)+'</small></button>'+
   '<button type="button" class="cv135-mini" data-cv135-toggle="'+esc(x.id)+'" aria-label="'+(x.enabled?'Tắt':'Bật')+' '+esc(x.name)+'">'+(x.enabled?'Ẩn':'Hiện')+'</button></div>').join(''):
   '<div class="cv135-empty">Chưa có lớp. Thêm một điều chỉnh để bắt đầu chỉnh sửa không phá hủy.</div>';
 }
 const type=panel.querySelector('#cv135-type'),name=panel.querySelector('#cv135-name'),value=panel.querySelector('#cv135-value'),valueOut=panel.querySelector('#cv135-value-out');
 const remove=panel.querySelector('[data-cv135="remove"]'),up=panel.querySelector('[data-cv135="up"]'),down=panel.querySelector('[data-cv135="down"]');
 if(type)type.value=sel?sel.type:'brightness';
 if(name)name.value=sel?sel.name:'';
 if(value&&valueOut){const spec=SPECS[sel?sel.type:'brightness'];value.min=spec.min;value.max=spec.max;value.step=spec.step;value.value=sel?sel.value:spec.initial;value.disabled=!sel;valueOut.textContent=(sel?sel.value:spec.initial)+spec.unit;}
 if(remove)remove.disabled=!sel;
 const idx=sel?layers.findIndex(x=>x.id===sel.id):-1;
 if(up)up.disabled=idx<=0;if(down)down.disabled=idx<0||idx>=layers.length-1;
 renderPreview();
}
function resetStack(message){layers=[];selectedId=null;undo=[];redo=[];inputEditing=false;render();if(message)setStatus(message);}
function addLayer(type){
 if(layers.length>=LIMIT){setStatus('Đã đạt giới hạn 32 lớp điều chỉnh.');return false;}
 type=Object.prototype.hasOwnProperty.call(SPECS,type)?type:'brightness';checkpoint();
 const spec=SPECS[type],layer=normalizeLayer({id:'p135-'+(++seq),type:type,name:spec.label,value:spec.initial,enabled:true},layers.length);
 layers.push(layer);selectedId=layer.id;render();setStatus('Đã thêm '+spec.label+'.');return true;
}
function changeSelected(patch,record){
 const item=selected();if(!item)return false;if(record)checkpoint();
 if(patch.name!==undefined)item.name=String(patch.name).replace(/[<>]/g,'').slice(0,64)||SPECS[item.type].label;
 if(patch.value!==undefined)item.value=clamp(patch.value,SPECS[item.type].min,SPECS[item.type].max,SPECS[item.type].initial);
 if(patch.enabled!==undefined)item.enabled=!!patch.enabled;
 render();return true;
}
function moveSelected(delta){
 const item=selected();if(!item)return false;const from=layers.findIndex(x=>x.id===item.id),to=from+delta;
 if(to<0||to>=layers.length)return false;checkpoint();layers.splice(from,1);layers.splice(to,0,item);layers=layers.map((x,i)=>Object.assign({},x,{order:i}));render();return true;
}
function removeSelected(){
 const item=selected();if(!item)return false;checkpoint();const i=layers.findIndex(x=>x.id===item.id);
 layers=layers.filter(x=>x.id!==item.id);selectedId=layers[Math.min(i,layers.length-1)]?.id||null;render();return true;
}
function historyMove(from,to){
 if(!from.length)return false;to.push(snapshot());const prev=from.pop();layers=normalizeLayers(prev.layers);
 selectedId=prev.selectedId&&layers.some(x=>x.id===prev.selectedId)?prev.selectedId:(layers[0]?.id||null);render();return true;
}
function canvasBlob(type){
 if(!px||!px.canvas||!px.canvas.width)throw new Error('Mở ảnh trong Pixel Atelier trước.');
 const source=px.canvas,out=doc.createElement('canvas');out.width=source.width;out.height=source.height;
 const ctx=out.getContext('2d');if(!ctx)throw new Error('Không tạo được canvas xuất.');
 ctx.filter=filterFor(layers);ctx.drawImage(source,0,0);ctx.filter='none';
 return new Promise((resolve,reject)=>out.toBlob(blob=>blob?resolve(blob):reject(new Error('Trình duyệt không tạo được tệp ảnh.')),type,.94));
}
function download(blob,name){
 const url=root.URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download=name;a.style.display='none';doc.body.appendChild(a);a.click();a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),1500);
}
async function exportApplied(type){
 try{const blob=await canvasBlob(type),ext=blob.type==='image/webp'?'webp':'png';download(blob,'CANVIO_Pixel_Atelier_Adjusted.'+ext);setStatus('Đã xuất bản ảnh áp dụng '+layers.length+' lớp. Ảnh nguồn vẫn giữ nguyên.');return true;}
 catch(e){setStatus('Không thể xuất ảnh: '+e.message);return false;}
}
async function saveAppliedAsset(){
 try{
  if(!root.CV||!root.CV.assets||typeof root.CV.assets.addBlob!=='function')throw new Error('Asset Library hiện chưa sẵn sàng.');
  const blob=await canvasBlob('image/png'),file=new File([blob],'CANVIO_Pixel_Atelier_Adjusted.png',{type:'image/png'});
  await root.CV.assets.addBlob(file);setStatus('Đã lưu bản raster áp dụng điều chỉnh vào Asset Library. Ảnh nguồn không bị ghi đè.');return true;
 }catch(e){setStatus('Không thể lưu Asset Library: '+e.message);return false;}
}
function bind(){
 if(!panel||panel.dataset.bound==='1')return;panel.dataset.bound='1';
 panel.addEventListener('click',e=>{
  const t=e.target.closest('[data-cv135-select]');if(t){selectedId=t.dataset.cv135Select;render();return;}
  const tog=e.target.closest('[data-cv135-toggle]');if(tog){const l=layers.find(x=>x.id===tog.dataset.cv135Toggle);if(l){checkpoint();l.enabled=!l.enabled;render();}return;}
  const b=e.target.closest('[data-cv135]');if(!b)return;const action=b.dataset.cv135;
  if(action==='add')addLayer(panel.querySelector('#cv135-type').value);
  else if(action==='up')moveSelected(-1);else if(action==='down')moveSelected(1);
  else if(action==='remove')removeSelected();else if(action==='undo')historyMove(undo,redo);
  else if(action==='redo')historyMove(redo,undo);
  else if(action==='reset'){if(layers.length){checkpoint();layers=[];selectedId=null;render();setStatus('Đã xóa toàn bộ lớp điều chỉnh.');}}
  else if(action==='export-png')exportApplied('image/png');else if(action==='export-webp')exportApplied('image/webp');
  else if(action==='asset')saveAppliedAsset();
 });
 panel.addEventListener('input',e=>{
  const el=e.target;
  if(el.id==='cv135-value'){if(!inputEditing){checkpoint();inputEditing=true;}changeSelected({value:el.value},false);}
  else if(el.id==='cv135-name'){if(!inputEditing){checkpoint();inputEditing=true;}changeSelected({name:el.value},false);}
 });
 panel.addEventListener('change',e=>{if(e.target.id==='cv135-value'||e.target.id==='cv135-name')inputEditing=false;});
 panel.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key==='Escape')&&e.target.id==='cv135-name'){inputEditing=false;e.target.blur();}});
 const page=doc.getElementById('page-pixelStudio');
 page.addEventListener('change',e=>{if(e.target&&e.target.id==='pxFile')resetStack('Đã mở ảnh mới · stack cũ được đóng để tránh áp nhầm ảnh.');},true);
 page.addEventListener('drop',e=>{if(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length)resetStack('Đã mở ảnh mới · stack cũ được đóng để tránh áp nhầm ảnh.');},true);
 page.addEventListener('input',e=>{if(e.target&&/^px-/.test(e.target.id||''))renderPreview();});
 if(canvas)['pointerup','pointercancel'].forEach(name=>canvas.addEventListener(name,()=>root.requestAnimationFrame(renderPreview)));
 const statusNode=doc.getElementById('pxStatus');
 if(statusNode&&root.MutationObserver){const observer=new root.MutationObserver(()=>root.requestAnimationFrame(renderPreview));observer.observe(statusNode,{childList:true,characterData:true,subtree:true});}
}
const PROJECT_MARKER='__canvioPixelAdjustmentProject';
function createProjectSnapshot(raster,state){
 if(typeof raster!=='string'||!/^data:image\//i.test(raster))return null;
 state=state&&typeof state==='object'?state:{};
 const projectLayers=normalizeLayers(state.layers);
 const activeId=state.selectedId&&projectLayers.some(x=>x.id===state.selectedId)?state.selectedId:(projectLayers[0]?.id||null);
 return {__canvioPixelAdjustmentProject:1,version:1,raster:raster,adjustments:{version:1,layers:projectLayers,selectedId:activeId}};
}
function isProjectSnapshot(value){
 return !!(value&&typeof value==='object'&&value.__canvioPixelAdjustmentProject===1&&value.version===1&&
  typeof value.raster==='string'&&/^data:image\//i.test(value.raster)&&value.adjustments&&
  value.adjustments.version===1&&Array.isArray(value.adjustments.layers));
}
function restoreRasterForProject(raster){
 return new Promise(resolve=>{
  const probe=new root.Image();probe.onerror=()=>resolve(false);
  probe.onload=()=>{
   const width=probe.naturalWidth||probe.width,height=probe.naturalHeight||probe.height,target=px&&px.canvas||canvas;
   if(!target||!width||!height){resolve(false);return}
   let expected=null;
   try{const sample=doc.createElement('canvas');sample.width=width;sample.height=height;const x=sample.getContext('2d',{willReadFrequently:true});x.drawImage(probe,0,0);expected=x.getImageData(0,0,width,height).data.slice()}catch(e){resolve(false);return}
   const ready=()=>{if(target.width!==width||target.height!==height)return false;try{const actual=target.getContext('2d',{willReadFrequently:true}).getImageData(0,0,width,height).data;if(actual.length!==expected.length)return false;for(let i=0;i<expected.length;i++)if(actual[i]!==expected[i])return false;return true}catch(e){return false}};
   let finished=false,observer=null,timer=null;
   const finish=ok=>{if(finished)return;finished=true;if(observer)observer.disconnect();if(timer)root.clearTimeout(timer);resolve(!!ok)};
   if(root.MutationObserver){observer=new root.MutationObserver(()=>{if(ready())finish(true)});observer.observe(target,{attributes:true,attributeFilter:['width','height']});const statusNode=doc.getElementById('pxStatus');if(statusNode)observer.observe(statusNode,{childList:true,characterData:true,subtree:true})}
   try{const result=originalRestoreState&&originalRestoreState.call(px,raster);if(result===false){finish(false);return}}catch(e){finish(false);return}
   const started=Date.now();
   const poll=()=>{if(finished)return;if(ready()){finish(true);return}if(Date.now()-started>=12000){finish(false);return}timer=root.setTimeout(poll,40)};
   poll();
  };
  probe.src=raster;
 });
}
async function restoreProjectSnapshot(pack){
 if(!isProjectSnapshot(pack))return false;
 const restored=await restoreRasterForProject(pack.raster);if(!restored)return false;
 const state=pack.adjustments||{};layers=normalizeLayers(state.layers);
 selectedId=state.selectedId&&layers.some(x=>x.id===state.selectedId)?state.selectedId:(layers[0]?.id||null);
 undo=[];redo=[];inputEditing=false;render();
 setStatus('Đã khôi phục '+layers.length+' lớp điều chỉnh cùng dự án Pixel Atelier.');return true;
}
let projectBridgeAttempts=0;
function installProjectVaultBridge(){
 if(!px||!originalSnapshotState||!originalRestoreState)return false;
 px.snapshotProjectState=function(){const raster=originalSnapshotState.call(px);return createProjectSnapshot(raster,{layers:layers,selectedId:selectedId})};
 px.restoreProjectState=restoreProjectSnapshot;
 const nativeRestore=px.restoreState;
 if(typeof nativeRestore==='function'&&!nativeRestore.__p135ProjectAware){
  const wrappedRestore=function(value){if(isProjectSnapshot(value))return restoreProjectSnapshot(value);resetStack('Đã khôi phục ảnh raster cũ; stack điều chỉnh được đặt lại.');const result=nativeRestore.apply(this,arguments);root.requestAnimationFrame(renderPreview);return result};
  wrappedRestore.__p135ProjectAware=true;px.restoreState=wrappedRestore;
 }
 const unified=root.CVUnifiedLayers;
 if(!unified)return false;
 if(!unified.__p135ProjectBridge&&typeof unified.snapshotState==='function'&&typeof unified.restoreState==='function'){
  const snapshot=unified.snapshotState,restore=unified.restoreState;
  const snapshotBridge=function(editor){if(editor==='pixelStudio'&&typeof px.snapshotProjectState==='function')return px.snapshotProjectState();return snapshot.apply(this,arguments)};
  snapshotBridge.__p135ProjectBridge=true;
  const restoreBridge=async function(editor,state){if(editor==='pixelStudio'&&isProjectSnapshot(state))return px.restoreProjectState(state);return restore.apply(this,arguments)};
  restoreBridge.__p135ProjectBridge=true;unified.snapshotState=snapshotBridge;unified.restoreState=restoreBridge;unified.__p135ProjectBridge=true;
 }
 return !!unified.__p135ProjectBridge;
}
function scheduleProjectVaultBridge(){
 if(installProjectVaultBridge())return true;
 projectBridgeAttempts++;
 if(projectBridgeAttempts<40)root.setTimeout(scheduleProjectVaultBridge,50);
 return false;
}
function installPixelHooks(){
 px=root.CVNativeEngines&&root.CVNativeEngines.pixel;if(!px||px.__p135Wrapped)return false;
 originalDraw=px.draw;originalAct=px.act;originalLoad=px.load;originalSnapshotState=px.snapshotState;originalRestoreState=px.restoreState;
 if(typeof originalDraw==='function')px.draw=function(){const result=originalDraw.apply(this,arguments);renderPreview();return result;};
 if(typeof originalLoad==='function')px.load=function(){resetStack('Ảnh mới đã mở · stack điều chỉnh được làm mới.');return originalLoad.apply(this,arguments);};
 if(typeof originalAct==='function')px.act=function(action){
  if((action==='export'||action==='webp'||action==='asset')&&hasAdjustments()){
   if(action==='asset')return saveAppliedAsset();return exportApplied(action==='webp'?'image/webp':'image/png');
  }
  const result=originalAct.apply(this,arguments);
  if(action==='clear')resetStack('Đã làm mới ảnh và stack điều chỉnh.');else root.requestAnimationFrame(renderPreview);
  return result;
 };
 scheduleProjectVaultBridge();px.__p135Wrapped=true;return true;
}
function mount(){
 if(mounted)return true;if(!doc||!root.CVNativeEngines||!root.CVNativeEngines.pixel)return false;
 const page=doc.getElementById('page-pixelStudio');if(!page)return false;
 px=root.CVNativeEngines.pixel;canvas=px.canvas||doc.getElementById('pxCanvas');if(!canvas)return false;
 panel=doc.createElement('section');panel.id='cv135-panel';panel.className='cv135-panel';panel.setAttribute('aria-labelledby','cv135-title');
 panel.innerHTML=[
 '<div class="cv135-head"><div><span class="cv135-kicker">PIXEL ATELIER · P135</span><h3 id="cv135-title">Adjustment Layers · Lớp điều chỉnh</h3><p>Chồng hiệu ứng theo thứ tự, bật/tắt và hoàn tác mà không ghi vào ảnh raster gốc.</p></div><span class="cv135-count" id="cv135-status">Chưa có lớp điều chỉnh</span></div>',
 '<div class="cv135-toolbar"><select id="cv135-type" aria-label="Loại lớp điều chỉnh"><option value="brightness">Độ sáng</option><option value="contrast">Tương phản</option><option value="saturate">Bão hòa</option><option value="hue">Dịch màu</option><option value="blur">Làm mờ</option><option value="grayscale">Đen trắng</option><option value="sepia">Sepia</option><option value="invert">Đảo màu</option><option value="opacity">Độ mờ</option></select><button type="button" data-cv135="add" class="cv135-primary">＋ Thêm lớp</button><button type="button" data-cv135="undo">↶ Hoàn tác</button><button type="button" data-cv135="redo">↷ Làm lại</button></div>',
 '<div class="cv135-body"><div class="cv135-list-wrap"><div class="cv135-section-label">STACK · TRÊN CÙNG ĐƯỢC ÁP DỤNG SAU</div><div id="cv135-layer-list" class="cv135-layer-list"></div></div>',
 '<div class="cv135-inspector"><div class="cv135-section-label">THUỘC TÍNH LỚP</div><label for="cv135-name">Tên lớp</label><input id="cv135-name" maxlength="64" placeholder="Chọn một lớp để chỉnh sửa"><label for="cv135-value">Cường độ <output id="cv135-value-out">100%</output></label><input id="cv135-value" type="range" min="0" max="200" value="100" disabled><div class="cv135-toolbar cv135-inspector-actions"><button type="button" data-cv135="up" aria-label="Đưa lớp lên">↑ Lên</button><button type="button" data-cv135="down" aria-label="Đưa lớp xuống">↓ Xuống</button><button type="button" data-cv135="remove" class="cv135-danger">Xóa lớp</button><button type="button" data-cv135="reset">Xóa stack</button></div></div></div>',
 '<div class="cv135-export"><div><b>Xuất kết quả đã áp dụng</b><small>Xuất PNG/WebP hoặc lưu một bản raster mới vào Asset Library; không ghi đè ảnh gốc.</small></div><div class="cv135-toolbar"><button type="button" id="cv135-export-png" data-cv135="export-png" class="cv135-primary">Xuất PNG</button><button type="button" id="cv135-export-webp" data-cv135="export-webp">Xuất WebP</button><button type="button" data-cv135="asset">Lưu bản mới vào Asset Library</button></div></div>',
 '<p class="cv135-note"><b>Lưu dự án:</b> stack điều chỉnh được lưu cùng raster snapshot qua Project Vault hiện có (IndexedDB trên thiết bị này) và khôi phục khi mở lại workspace. Dùng Xuất bản sao lưu trong Project Vault để chuyển dự án sang thiết bị khác; chưa có đồng bộ đám mây. Xuất/Lưu ảnh tạo raster mới, ảnh nguồn vẫn được giữ nguyên.</p>'
 ].join('');
 const style=doc.createElement('style');style.id='canvio-lot135-css';
 style.textContent='#cv135-panel{margin:18px 0;padding:18px;border:1px solid var(--border,#dce3ee);border-radius:16px;background:var(--card,#fff);color:var(--text,#182230);box-shadow:0 8px 24px rgba(20,34,55,.055)}'+
 '#cv135-panel .cv135-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}#cv135-panel .cv135-kicker{font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--brand,#1769e0)}#cv135-panel h3{margin:5px 0;font-size:18px}#cv135-panel p{margin:4px 0;color:var(--muted,#657184);font-size:12px;line-height:1.55}#cv135-panel .cv135-count{font-size:11px;border-radius:999px;background:var(--surface,#f2f5fa);padding:7px 10px}'+
 '#cv135-panel .cv135-toolbar{display:flex;gap:7px;align-items:center;flex-wrap:wrap}#cv135-panel button,#cv135-panel select,#cv135-panel input{font:inherit}#cv135-panel button{border:1px solid var(--border,#dce3ee);border-radius:9px;background:var(--surface,#f7f9fc);padding:7px 10px;font-size:12px;cursor:pointer;color:inherit}#cv135-panel button:disabled{opacity:.4;cursor:not-allowed}#cv135-panel button:focus-visible,#cv135-panel input:focus-visible,#cv135-panel select:focus-visible{outline:2px solid var(--brand,#1769e0);outline-offset:2px}#cv135-panel .cv135-primary{background:var(--brand,#1769e0);color:#fff;border-color:transparent}#cv135-panel .cv135-danger{color:#b42318}'+
 '#cv135-panel select,#cv135-panel input:not([type=range]){border:1px solid var(--border,#dce3ee);border-radius:8px;padding:7px 9px;min-width:0;max-width:100%;background:var(--input,#fff);color:inherit}#cv135-panel .cv135-body{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:14px;margin-top:16px}#cv135-panel .cv135-list-wrap,#cv135-panel .cv135-inspector{border:1px solid var(--border,#e3e8f0);border-radius:12px;padding:12px;min-width:0}#cv135-panel .cv135-section-label{font-size:10px;letter-spacing:.1em;font-weight:800;color:var(--muted,#657184);margin-bottom:10px}'+
 '#cv135-panel .cv135-layer-list{display:grid;gap:7px}#cv135-panel .cv135-layer{display:flex;gap:7px;align-items:stretch}#cv135-panel .cv135-layer-main{display:grid;grid-template-columns:18px 1fr;align-items:center;text-align:left;gap:2px 7px;flex:1;min-width:0}#cv135-panel .cv135-layer-main small{grid-column:2;color:var(--muted,#657184);font-size:10px}#cv135-panel .cv135-layer-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}#cv135-panel .cv135-layer-state{color:var(--brand,#1769e0)}#cv135-panel .cv135-mini{min-width:48px}#cv135-panel .is-selected .cv135-layer-main{border-color:var(--brand,#1769e0);background:rgba(23,105,224,.08)}'+
 '#cv135-panel .cv135-empty{padding:18px;color:var(--muted,#657184);font-size:12px;border:1px dashed var(--border,#dce3ee);border-radius:9px}#cv135-panel .cv135-inspector label{display:flex;justify-content:space-between;gap:8px;margin:10px 0 5px;font-size:11px;font-weight:700}#cv135-panel .cv135-inspector input[type=range]{width:100%;accent-color:var(--brand,#1769e0)}#cv135-panel .cv135-inspector-actions{margin-top:12px}'+
 '#cv135-panel .cv135-export{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:1px solid var(--border,#e3e8f0);margin-top:14px;padding-top:14px}#cv135-panel .cv135-export small{display:block;color:var(--muted,#657184);font-size:10px;margin-top:3px;max-width:430px}#cv135-panel .cv135-note{margin-top:12px;padding:10px 12px;background:var(--surface,#f4f6fa);border-radius:9px}@media(max-width:760px){#cv135-panel .cv135-body{grid-template-columns:1fr}#cv135-panel .cv135-export{align-items:flex-start}#cv135-panel .cv135-export .cv135-toolbar{width:100%}}@media(prefers-reduced-motion:reduce){#cv135-panel *{scroll-behavior:auto!important;transition:none!important}}';
 if(!doc.getElementById('canvio-lot135-css'))doc.head.appendChild(style);
 const note=page.querySelector('.ne-note');if(note&&note.parentNode)note.parentNode.insertBefore(panel,note);else page.appendChild(panel);
 canvas=px.canvas||doc.getElementById('pxCanvas');status=panel.querySelector('#cv135-status');
 bind();installPixelHooks();render();mounted=true;return true;
}
function tests(){
 const normalized=normalizeLayers([{id:'a',type:'brightness',value:999},{id:'b',type:'hue',value:-999},{id:'bad',type:'not-real',value:1}]);
 const filters=filterFor([{id:'x',type:'brightness',value:125},{id:'y',type:'blur',value:2,enabled:false},{id:'z',type:'hue',value:30}]);
 const raster='data:image/png;base64,AAAA';
 const project=createProjectSnapshot(raster,{layers:[{id:'persisted',type:'brightness',value:150}],selectedId:'persisted'});
 return {clampsUpperBound:normalized[0].value===200,clampsLowerBound:normalized[1].value===-180,
  unknownTypeFallsBackSafely:normalized[2].type==='brightness',preservesLayerOrder:normalized[0].order===0&&normalized[1].order===1,
  ignoresDisabledLayers:filters==='brightness(125%) hue-rotate(30deg)',supportsNineAdjustmentTypes:Object.keys(SPECS).length===9,
  enforcesMaximumLayerCount:normalizeLayers(Array.from({length:40},(_,i)=>({id:'l'+i,type:'brightness'}))).length===LIMIT,
  usesStableUniqueIds:normalizeLayers([{id:'same',type:'brightness'},{id:'same',type:'contrast'}]).length===1,
  createsVersionedProjectPayload:!!project&&project.__canvioPixelAdjustmentProject===1&&project.version===1,
  preservesProjectLayerValue:!!project&&project.adjustments.layers[0].value===150,
  preservesProjectSelection:!!project&&project.adjustments.selectedId==='persisted',
  leavesLegacyRasterOutsideProjectSchema:!isProjectSnapshot(raster)};
}
const api={version:'135.2.0',specs:clone(SPECS),normalizeLayer:normalizeLayer,normalizeLayers:normalizeLayers,filterFor:filterFor,createProjectSnapshot:createProjectSnapshot,isProjectSnapshot:isProjectSnapshot,restoreProjectSnapshot:restoreProjectSnapshot,tests:tests,mount:mount,
 getState:()=>({layers:clone(layers),selectedId:selectedId,sessionOnly:false,projectPersistenceAvailable:!!(px&&px.snapshotProjectState&&root.CVUnifiedLayers&&root.CVUnifiedLayers.__p135ProjectBridge)}),reset:()=>resetStack('Đã xóa stack điều chỉnh.')};
window.CVPixelAdjustmentsP135=api;
if(doc){if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mount,{once:true});else mount();}
})(window);
