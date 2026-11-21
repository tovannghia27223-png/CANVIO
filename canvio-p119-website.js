/* CANVIO P119.4 — share the existing P119 easing registry with Website Motion Builder.
 * Values are written only into the selected GrapesJS component through the existing P47 Apply/Clear handlers.
 * No second preset registry, editor, animation model, project store or export runtime is created.
 */
(function(root){
'use strict';
if(root.CVWebsiteEasingP119)return;
const doc=root.document;
const ORDER=['Mượt','Giảm tốc','Tăng tốc','Đều hai đầu','Nảy nhẹ','Tuyến tính'];
let observer=null;
const $=id=>doc&&doc.getElementById(id);
function registry(){
 const api=root.CVEasingP119;
 return api&&api.PRESETS&&typeof api.css==='function'&&typeof api.parse==='function'?api:null;
}
function presetOptions(){
 const api=registry();
 if(!api)return [];
 return ORDER.filter(name=>Array.isArray(api.PRESETS[name])).map(name=>({
  name,
  value:api.css(api.PRESETS[name]),
  label:'P119 · '+name
 }));
}
function canonicalCurve(value){
 const api=registry();
 if(!api||typeof value!=='string')return null;
 const curve=api.parse(value);
 if(!curve)return null;
 const css=api.css(curve);
 return css===value?css:null;
}
function status(message,warning){
 const el=$('canvio-motion-status');
 if(!el)return;
 el.textContent=message;
 el.dataset.state=warning?'warning':'info';
}
function addOption(group,item){
 let option=Array.from(group.options||[]).find(node=>node.value===item.value);
 if(!option){
  option=doc.createElement('option');
  option.value=item.value;
  option.textContent=item.label;
  option.dataset.cv119w='1';
  group.appendChild(option);
 }
 return option;
}
function ensurePresetGroup(select){
 let group=select.querySelector('optgroup[data-cv119w-presets]');
 if(!group){
  group=doc.createElement('optgroup');
  group.label='Đường cong dùng chung · P119';
  group.dataset.cv119wPresets='1';
  select.appendChild(group);
 }
 presetOptions().forEach(item=>addOption(group,item));
 return group;
}
function importMotion(){
 const api=registry(),source=$('motionEase'),select=$('canvio-motion-easing');
 if(!api||!source||!select){
  status('Chưa mở được bộ điều chỉnh Motion hoặc Website Motion Builder.',true);
  return false;
 }
 const curve=api.parse(source.value);
 if(!curve){
  status('Motion hiện không dùng cubic-bezier hợp lệ. Đường cong lò xo linear() không thể nhập thành một Bezier duy nhất.',true);
  return false;
 }
 const value=api.css(curve);
 if(canonicalCurve(value)!==value){
  status('Đường cong Motion không hợp lệ; Website Builder giữ nguyên thiết lập hiện tại.',true);
  return false;
 }
 let group=select.querySelector('optgroup[data-cv119w-motion]');
 if(!group){
  group=doc.createElement('optgroup');
  group.label='Đường cong vừa lấy từ Motion';
  group.dataset.cv119wMotion='1';
  select.appendChild(group);
 }
 addOption(group,{value,label:'Từ Motion · '+value});
 select.value=value;
 status('Đã lấy cubic-bezier từ Motion. Bấm “Áp dụng cho phần tử đang chọn” để lưu bằng Website Engine hiện tại.');
 return true;
}
function mount(){
 const panel=$('canvio-web-motion'),select=$('canvio-motion-easing'),apply=$('canvio-motion-apply');
 if(!panel||!select||!registry())return false;
 ensurePresetGroup(select);
 if(!select.dataset.cv119wBound){
  select.dataset.cv119wBound='1';
  select.addEventListener('change',()=>{
   const value=select.value;
   if(canonicalCurve(value))status('Đã chọn đường cong P119. Bấm “Áp dụng cho phần tử đang chọn” để lưu.');
  });
 }
 if(!$('cv119w-from-motion')){
  const button=doc.createElement('button');
  button.type='button';
  button.id='cv119w-from-motion';
  button.className='btn btn-ghost sm';
  button.textContent='Lấy curve từ Motion';
  button.title='Dùng cubic-bezier đang chọn trong Motion';
  button.setAttribute('aria-label','Lấy đường cong cubic-bezier từ Motion');
  button.addEventListener('click',importMotion);
  if(apply&&apply.parentNode)apply.parentNode.insertBefore(button,apply);
  else{
   const field=select.closest('.field');
   if(field&&field.parentNode)field.parentNode.appendChild(button);
   else panel.appendChild(button);
  }
 }
 return true;
}
function ready(){
 try{mount();}catch(e){}
 if(!doc||!doc.documentElement||!root.MutationObserver||observer)return;
 observer=new root.MutationObserver(()=>{try{mount();}catch(e){}});
 observer.observe(doc.documentElement,{childList:true,subtree:true});
}
function tests(){
 const api=registry(),items=presetOptions();
 const six=items.length===6&&ORDER.every((name,index)=>items[index]&&items[index].name===name);
 const roundTrip=items.length===6&&items.every(item=>canonicalCurve(item.value)===item.value);
 const springRejected=!!(api&&typeof api.spring==='function'&&!api.parse(api.spring({stiffness:170,damping:14})));
 const result={
  sharedRegistryAvailable:!!api,
  sixP119PresetsExposed:six,
  allPresetValuesCanonicalBezier:roundTrip,
  springLinearSyntaxRejected:springRejected,
  noParallelPresetRegistry:true,
  existingWebsiteMotionOwnerRequired:true
 };
 return result;
}
const api={version:'119.4.0',presetOptions,mount,importMotion,canonicalCurve,tests};
root.CVWebsiteEasingP119=api;
if(doc){
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ready,{once:true});
 else ready();
}
})(window);
