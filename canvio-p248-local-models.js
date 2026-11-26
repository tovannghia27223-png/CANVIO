/* P248 · User-managed local model catalogue; no model downloads, credentials or cloud model calls. */
(function(w,d){
'use strict';if(w.CVLocalModelsP248)return;
function project(create){var C=w.CVCreativeCore,p=C&&C.active;if(!p&&create&&C&&C.create)p=C.create({name:'Model Workspace'});return p||null;}
function rows(){var p=project(false);return p&&p.documents&&p.documents.localModels&&Array.isArray(p.documents.localModels.items)?p.documents.localModels.items:[];}
async function add(file,meta){
 if(!file||file.size<=0||file.size>20*1024*1024*1024)throw new Error('Model file không hợp lệ hoặc vượt 20 GiB.');
 var p=project(true);if(!p)throw new Error('Shared Core chưa sẵn sàng.');
 var hash=null,integrity='not-hashed-large-file';
 if(file.size<=256*1024*1024){hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).map(function(x){return x.toString(16).padStart(2,'0');}).join('');integrity='sha256-full-file';}
 p.documents=p.documents||{};p.documents.localModels=p.documents.localModels||{version:1,items:[]};
 var item={id:'model-'+(hash||Date.now().toString(36)).slice(0,16),name:String(meta&&meta.name||file.name).slice(0,120),fileName:file.name,size:file.size,sha256:hash,integrity:integrity,format:String(meta&&meta.format||file.name.split('.').pop()).slice(0,24),role:String(meta&&meta.role||'general').slice(0,40),registeredAt:new Date().toISOString(),binaryStored:false};
 var list=p.documents.localModels.items;if(!list.some(function(x){return hash&&x.sha256===hash;}))list.push(item);
 try{w.CVCreativeCore.capture('project');}catch(e){}return item;
}
function recommend(ramGB,vramGB){ramGB=Number(ramGB)||7;vramGB=Number(vramGB)||0;if(ramGB<8)return{tier:'tiny / quantized',reason:'RAM dưới 8 GB: ưu tiên model nhỏ, quantized và xử lý tuần tự.'};if(vramGB&&vramGB<6)return{tier:'small / low-VRAM',reason:'VRAM hạn chế: tránh model lớn và batch cao.'};if(ramGB<16)return{tier:'small–medium',reason:'Máy phổ thông: kiểm tra peak RAM/VRAM trước khi inference.'};return{tier:'medium–large (test first)',reason:'Đủ tài nguyên hơn nhưng vẫn cần benchmark thực tế.'};}
async function connect(base){var c=w.CVComfyP120P126;if(!c||!c.connect)throw new Error('ComfyUI connector P120/P126 chưa sẵn sàng.');return c.connect(base);}
function mount(){var root=d.getElementById('cvstudio-pro-tools');if(!root||d.getElementById('cv248-card'))return false;var c=d.createElement('section');c.id='cv248-card';c.className='card';c.innerHTML='<h4>Model Manager · Local / ComfyUI</h4><p class="tiny">Đăng ký metadata + SHA-256 khi file ≤256 MiB. File lớn hơn chỉ lưu tên/kích thước; không đọc toàn bộ vào RAM, không upload hay sao chép binary. ComfyUI chỉ kết nối localhost khi bạn bấm kiểm tra.</p><input id="cv248-file" type="file" class="input" aria-label="Chọn model đã có trên máy"><div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-soft sm" id="cv248-add" type="button">Đăng ký model</button><input class="input" id="cv248-url" value="http://127.0.0.1:8188" style="max-width:220px" aria-label="Địa chỉ ComfyUI"><button class="btn btn-ghost sm" id="cv248-connect" type="button">Kiểm tra ComfyUI</button><span id="cv248-status" class="tiny" role="status"></span></div><div class="tiny" id="cv248-list"></div>';root.appendChild(c);
 function draw(){c.querySelector('#cv248-list').textContent=rows().map(function(x){return x.name+' · '+(x.size/1048576).toFixed(1)+' MiB · '+(x.sha256?'SHA '+x.sha256.slice(0,12):'chưa hash')+' · chỉ metadata';}).join('\n')||'Chưa có model nào đăng ký.';}
 c.querySelector('#cv248-add').onclick=async function(){try{var f=c.querySelector('#cv248-file').files[0];var r=await add(f);c.querySelector('#cv248-status').textContent='Đã đăng ký metadata; binary vẫn ở vị trí ban đầu.';draw();}catch(e){c.querySelector('#cv248-status').textContent=e.message;}};
 c.querySelector('#cv248-connect').onclick=async function(){var b=this;b.disabled=true;try{await connect(c.querySelector('#cv248-url').value);c.querySelector('#cv248-status').textContent='ComfyUI online · loopback OK. Model/node có sẵn phải kiểm tra trong workflow.';}catch(e){c.querySelector('#cv248-status').textContent=e.message;}finally{b.disabled=false;}};
 draw();return true;}
var api={version:'248.1.1',rows:rows,add:add,recommend:recommend,connect:connect,mount:mount,tests:function(){var r=recommend(7,4);return{projectScoped:!!w.CVCreativeCore,metadataOnly:true,sevenGbRecommendation:r.tier==='tiny / quantized',doesNotDownload:true,largeFileNotReadIntoMemory:true,comfyBridgeAvailable:!!w.CVComfyP120P126};}};
w.CVLocalModelsP248=api;
})(window,document);