/* P169 · Character Studio — chỉnh ngoại hình nhân vật bằng điều khiển trực quan, dùng hồ sơ P163/Shared Core. */
(function(){
'use strict';
if(window.CVCharacterStudioP169)return;
var FIELDS=[
 ['face','Dáng mặt',['oval','round','square','heart'],'oval'],
 ['skin','Tông da',['light','medium','tan','deep'],'medium'],
 ['hair','Kiểu tóc',['short','long','bob','curly','ponytail','bald'],'short'],
 ['hairColor','Màu tóc',['black','brown','blonde','red','silver','blue'],'black'],
 ['mark','Dấu nhận diện',['none','scar-left','scar-right','freckles','mole'],'none'],
 ['outfit','Trang phục',['casual','formal','uniform','jacket','sport'],'casual'],
 ['outfitColor','Màu trang phục',['navy','black','white','red','green','beige'],'navy'],
 ['accessory','Phụ kiện',['none','glasses','earring','hat','scarf'],'none']
];
var LABEL={oval:'Oval',round:'Tròn',square:'Vuông',heart:'Trái tim',light:'Sáng',medium:'Trung bình',tan:'Nâu ấm',deep:'Đậm',short:'Ngắn',long:'Dài',bob:'Bob',curly:'Xoăn',ponytail:'Buộc cao',bald:'Không tóc',black:'Đen',brown:'Nâu',blonde:'Vàng',red:'Đỏ',silver:'Bạc',blue:'Xanh',none:'Không', 'scar-left':'Sẹo trái','scar-right':'Sẹo phải',freckles:'Tàn nhang',mole:'Nốt ruồi',casual:'Thường ngày',formal:'Trang trọng',uniform:'Đồng phục',jacket:'Áo khoác',sport:'Thể thao',navy:'Xanh navy',white:'Trắng',green:'Xanh lá',beige:'Be',glasses:'Kính',earring:'Khuyên tai',hat:'Mũ',scarf:'Khăn'};
function clean(v){return String(v||'').replace(/[^a-z0-9-]/gi,'').slice(0,24);}
function normalize(v){var out={};FIELDS.forEach(function(f){var x=clean(v&&v[f[0]]);out[f[0]]=f[2].indexOf(x)>=0?x:f[3];});return out;}
function fromProfile(p){var f=p&&p.features||{},v={};FIELDS.forEach(function(x){v[x[0]]=f['visual:'+x[0]]||x[3];});return normalize(v);}
function featureMap(v){var f={};FIELDS.forEach(function(x){f['visual:'+x[0]]=v[x[0]];});return f;}
function renderSVG(input){
 var v=normalize(input),skin={light:'#f2d5c0',medium:'#c88f68',tan:'#9b6347',deep:'#613b32'}[v.skin],hair={black:'#252329',brown:'#51352b',blonde:'#c9a34c',red:'#8e3d32',silver:'#a7a9b0',blue:'#405f91'}[v.hairColor],shirt={navy:'#263c62',black:'#272a30',white:'#e8e9eb',red:'#a64040',green:'#416c57',beige:'#b9a88d'}[v.outfitColor];
 var face=v.face==='round'?'rx="69"':v.face==='square'?'rx="38"':v.face==='heart'?'rx="48"':'rx="57"';
 var hairShape=v.hair==='bald'?'':v.hair==='long'?'<path d="M91 92 Q70 8 150 12 Q230 8 209 92 L220 230 L80 230Z" fill="'+hair+'"/>':v.hair==='ponytail'?'<path d="M187 54 Q250 45 230 120 Q211 133 198 96Z" fill="'+hair+'"/><path d="M91 93 Q80 12 150 12 Q220 12 209 93Z" fill="'+hair+'"/>':v.hair==='curly'?'<path d="M83 89 Q67 10 111 25 Q130 -2 151 22 Q185 0 202 35 Q232 38 211 99Z" fill="'+hair+'"/>':v.hair==='bob'?'<path d="M83 91 Q67 10 150 12 Q232 10 217 105 L211 160 Q185 135 89 160Z" fill="'+hair+'"/>':'<path d="M88 94 Q75 10 150 12 Q225 10 212 94 Q178 58 150 70 Q117 58 88 94Z" fill="'+hair+'"/>';
 var mark=v.mark==='scar-left'?'<path d="M112 119l-9 24" stroke="#8c5148" stroke-width="4"/>':v.mark==='scar-right'?'<path d="M188 119l9 24" stroke="#8c5148" stroke-width="4"/>':v.mark==='freckles'?'<g fill="#805447"><circle cx="115" cy="145" r="2"/><circle cx="125" cy="151" r="2"/><circle cx="185" cy="145" r="2"/><circle cx="175" cy="151" r="2"/></g>':v.mark==='mole'?'<circle cx="185" cy="151" r="3" fill="#5c332d"/>':'';
 var accessory=v.accessory==='glasses'?'<g fill="none" stroke="#30343b" stroke-width="4"><circle cx="119" cy="126" r="19"/><circle cx="181" cy="126" r="19"/><path d="M138 126h24"/></g>':v.accessory==='earring'?'<circle cx="82" cy="158" r="5" fill="#d6b15e"/><circle cx="218" cy="158" r="5" fill="#d6b15e"/>':v.accessory==='hat'?'<path d="M80 50 Q150 -4 220 50 L232 63H68Z" fill="#394b64"/>':v.accessory==='scarf'?'<path d="M111 194 Q150 215 189 194 L180 245H120Z" fill="#b54d4d"/>':'';
 var outfit=v.outfit==='formal'?'<path d="M93 207L150 187L207 207L230 310H70Z" fill="'+shirt+'"/><path d="M150 190l-15 35 15 18 15-18Z" fill="#e8e8e8"/>':v.outfit==='uniform'?'<path d="M93 207L150 187L207 207L230 310H70Z" fill="'+shirt+'"/><path d="M110 218h80" stroke="#fff" stroke-width="7"/>':v.outfit==='sport'?'<path d="M93 207L150 187L207 207L230 310H70Z" fill="'+shirt+'"/><path d="M85 236h130" stroke="#fff" stroke-width="8"/>':'<path d="M93 207L150 187L207 207L230 310H70Z" fill="'+shirt+'"/>';
 return '<svg viewBox="0 0 300 330" role="img" aria-label="Bản xem trước ngoại hình nhân vật" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="330" rx="18" fill="#f1f3f6"/><ellipse cx="150" cy="310" rx="95" ry="10" fill="#d7dce4"/>'+outfit+'<rect x="133" y="174" width="34" height="36" rx="12" fill="'+skin+'"/><rect x="72" y="54" width="156" height="154" '+face+' fill="'+skin+'"/>'+hairShape+'<path d="M116 127h12m44 0h12" stroke="#302d2b" stroke-width="5" stroke-linecap="round"/><path d="M137 165q13 9 26 0" fill="none" stroke="#7b4640" stroke-width="3" stroke-linecap="round"/>'+mark+accessory+'</svg>';
}
function api(){return window.CVCharacterContinuityP163||null;}
function save(profileId,values){
 var A=api();if(!A)return{ok:false,error:'P163 chưa sẵn sàng.'};
 var p=profileId?A.profile(profileId):null;if(!p)return{ok:false,error:'Hãy chọn hoặc tạo hồ sơ nhân vật ở P163 trước.'};
 var features=Object.assign({},p.features||{},featureMap(normalize(values)));
 return A.upsert({id:p.id,name:p.name,description:p.description,features:features,checklist:(p.checklist||[]).concat(FIELDS.map(x=>'visual:'+x[0])),referenceAssetIds:p.referenceAssetIds||[],palette:p.palette||[]});
}
function mount(){
 var host=document.getElementById('cv163-card');if(!host||host.querySelector('#cv169-panel'))return false;
 var panel=document.createElement('section');panel.id='cv169-panel';panel.style.cssText='margin-top:14px;padding-top:14px;border-top:1px solid var(--line,#ddd)';
 panel.innerHTML='<div class="cardTop"><div><h3>Character Studio · P169</h3><span class="sub">Chỉnh ngoại hình trực quan, lưu thẳng vào hồ sơ P163</span></div></div><div class="row" style="gap:14px;align-items:flex-start;flex-wrap:wrap"><div id="cv169-preview" style="width:190px;max-width:100%">'+renderSVG({})+'</div><div id="cv169-controls" style="flex:1;min-width:220px;display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px"></div></div><div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" class="btn btn-primary sm" id="cv169-save">Lưu ngoại hình vào hồ sơ</button><button type="button" class="btn btn-ghost sm" id="cv169-reset">Đặt lại mặc định</button><span class="tiny" id="cv169-msg" role="status" aria-live="polite"></span></div><p class="tiny" style="margin-top:6px">Bản xem trước là minh họa vector 2D, không phải mô hình 3D, nhận diện khuôn mặt hay công cụ sculpt. Ảnh tham chiếu vẫn do người dùng chọn trong P163.</p>';
 host.appendChild(panel);
 var controls=panel.querySelector('#cv169-controls'),values=normalize({}),profile=panel.closest('#cv163-card').querySelector('#cv163-profile');
 FIELDS.forEach(function(f){var wrap=document.createElement('label');wrap.className='tiny';wrap.textContent=f[1];var sel=document.createElement('select');sel.className='input';sel.dataset.field=f[0];f[2].forEach(function(x){var o=document.createElement('option');o.value=x;o.textContent=LABEL[x]||x;sel.appendChild(o);});sel.value=values[f[0]];sel.addEventListener('change',function(){values[f[0]]=sel.value;panel.querySelector('#cv169-preview').innerHTML=renderSVG(values);});wrap.appendChild(sel);controls.appendChild(wrap);});
 function load(){var A=api(),p=A&&A.profile(profile&&profile.value);values=fromProfile(p);Array.from(controls.querySelectorAll('select')).forEach(function(s){s.value=values[s.dataset.field];});panel.querySelector('#cv169-preview').innerHTML=renderSVG(values);}
 if(profile)profile.addEventListener('change',load);
 panel.querySelector('#cv169-reset').onclick=function(){values=normalize({});Array.from(controls.querySelectorAll('select')).forEach(function(s){s.value=values[s.dataset.field];});panel.querySelector('#cv169-preview').innerHTML=renderSVG(values);};
 panel.querySelector('#cv169-save').onclick=function(){var r=save(profile&&profile.value,values);panel.querySelector('#cv169-msg').textContent=r.ok?'Đã lưu vào hồ sơ nhân vật P163.':r.error;};
 load();return true;
}
function tests(){var a=normalize({face:'round',hair:'curly',mark:'scar-left',skin:'deep'});return{bounded:a.face==='round'&&a.hair==='curly'&&a.skin==='deep',svg:renderSVG(a).indexOf('<svg')===0&&renderSVG(a).indexOf('scar')<0,featureRoundTrip:fromProfile({features:featureMap(a)}).hair==='curly',fieldCount:FIELDS.length};}
window.CVCharacterStudioP169={version:'169.0.0',fields:FIELDS,normalize:normalize,renderSVG:renderSVG,fromProfile:fromProfile,save:save,mount:mount,tests:tests};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
