/* P120/P126 · ComfyUI local workflow bridge.
 * Runs user-selected API-format ComfyUI workflows against a loopback ComfyUI instance.
 * The workflow defines its own models/custom nodes; this bridge does not download models,
 * install custom nodes, call a cloud provider, or embed credentials.
 */
(function(){
'use strict';
if(window.CVComfyP120P126)return;
var MAX_WORKFLOW=10*1048576,MAX_MEDIA=100*1048576,MAX_OUTPUT=150*1048576;
var prepared=null,registered=false,runBusy=false,links=[];
function normalizeBase(value){
 var u;try{u=new URL(String(value||'').trim());}catch(e){throw new Error('Địa chỉ ComfyUI không hợp lệ.');}
 var host=String(u.hostname||'').toLowerCase();
 if(u.protocol!=='http:'&&u.protocol!=='https:')throw new Error('Chỉ cho phép HTTP/HTTPS.');
 if(u.username||u.password||u.search||u.hash)throw new Error('Không đặt thông tin đăng nhập hoặc tham số URL ở đây.');
 if(u.pathname&&u.pathname!=='/')throw new Error('Địa chỉ ComfyUI chỉ nhận origin, không nhận đường dẫn.');
 if(host!=='localhost'&&host!=='127.0.0.1'&&host!=='[::1]'&&host!=='::1')throw new Error('Bản an toàn này chỉ kết nối ComfyUI trên máy hiện tại (localhost/127.0.0.1/::1).');
 return u.origin;
}
function validateWorkflow(w){
 if(!w||typeof w!=='object'||Array.isArray(w))throw new Error('Workflow phải là JSON API dạng object.');
 var keys=Object.keys(w);if(!keys.length||keys.length>2500)throw new Error('Workflow cần có từ 1 đến 2500 node.');
 var bytes;try{bytes=JSON.stringify(w).length;}catch(e){throw new Error('Workflow JSON không hợp lệ.');}
 if(bytes>MAX_WORKFLOW)throw new Error('Workflow vượt giới hạn 10 MB.');
 keys.forEach(function(id){
  if(!/^[A-Za-z0-9_-]{1,64}$/.test(id))throw new Error('ID node không hợp lệ: '+id);
  var n=w[id];if(!n||typeof n!=='object'||Array.isArray(n)||typeof n.class_type!=='string'||!n.inputs||typeof n.inputs!=='object'||Array.isArray(n.inputs))throw new Error('Node '+id+' không đúng định dạng API.');
 });
 return w;
}
function cloneWorkflow(w){return JSON.parse(JSON.stringify(validateWorkflow(w)));}
function replaceInput(w,nodeId,inputKey,value){
 if(!nodeId&&!inputKey)return w;
 if(!nodeId||!inputKey)throw new Error('Cần nhập đủ ID node và tên input.');
 var n=w[String(nodeId)];if(!n)throw new Error('Không tìm thấy node '+nodeId+' trong workflow.');
 if(!Object.prototype.hasOwnProperty.call(n.inputs,String(inputKey)))throw new Error('Node '+nodeId+' không có input "'+inputKey+'".');
 n.inputs[String(inputKey)]=value;return w;
}
function collectFiles(history){
 var out=[],seen={};if(!history||!history.outputs||typeof history.outputs!=='object')return out;
 Object.keys(history.outputs).forEach(function(id){
  var node=history.outputs[id]||{};
  ['images','gifs','videos','audio','files'].forEach(function(k){
   var arr=node[k];if(!Array.isArray(arr))return;
   arr.forEach(function(f){
    if(!f||typeof f.filename!=='string'||!f.filename||f.filename.indexOf('..')>=0||f.filename.indexOf('/')>=0||f.filename.indexOf('\\')>=0)return;
    var type=String(f.type||'output'),sub=String(f.subfolder||'');
    if(type!=='output'&&type!=='temp'&&type!=='input')return;
    if(sub.indexOf('..')>=0||sub.indexOf('\\')>=0)return;
    var key=type+'|'+sub+'|'+f.filename;if(seen[key])return;seen[key]=1;
    out.push({filename:f.filename,subfolder:sub,type:type,nodeId:id,kind:k});
   });
  });
 });
 return out.slice(0,80);
}
function mimeFor(name){
 var x=String(name||'').toLowerCase().split('.').pop();
 return ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',wav:'audio/wav',mp3:'audio/mpeg',flac:'audio/flac'})[x]||'application/octet-stream';
}
async function request(base,path,options,timeout){
 var ctl=typeof AbortController==='function'?new AbortController():null,timer=0;
 var init=Object.assign({mode:'cors',credentials:'omit',cache:'no-store'},options||{});
 if(ctl){init.signal=ctl.signal;timer=setTimeout(function(){ctl.abort();},timeout||30000);}
 try{
  var res=await fetch(base+path,init);
  if(!res.ok){var msg='HTTP '+res.status;try{var body=await res.clone().json();msg=body.error||body.message||msg;}catch(e){}throw new Error('ComfyUI trả lỗi '+msg+'.');}
  return res;
 }catch(e){
  if(e&&e.name==='AbortError')throw new Error('ComfyUI không phản hồi trong thời gian cho phép.');
  if(e instanceof TypeError)throw new Error('Không kết nối được ComfyUI. Kiểm tra server đang chạy và CORS allowlist cho origin CANVIO.');
  throw e;
 }finally{if(timer)clearTimeout(timer);}
}
async function connect(baseValue){
 var base=normalizeBase(baseValue);
 var res=await request(base,'/system_stats',{},12000),data=await res.json();
 if(!data||typeof data!=='object')throw new Error('ComfyUI trả dữ liệu trạng thái không hợp lệ.');
 return {base:base,stats:data};
}
async function uploadMedia(base,file){
 if(!file)return null;
 if(file.size>MAX_MEDIA)throw new Error('Tệp đầu vào vượt giới hạn 100 MiB.');
 var form=new FormData();form.append('image',file,file.name);form.append('type','input');
 var res=await request(base,'/upload/image',{method:'POST',body:form},60000),d=await res.json();
 if(!d||!d.name)throw new Error('ComfyUI không xác nhận việc tải tệp đầu vào lên.');
 return d;
}
function uid(){
 try{if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();}catch(e){}
 return 'canvio-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
}
async function queue(base,w){
 var clientId=uid(),res=await request(base,'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:w,client_id:clientId})},30000),d=await res.json();
 if(d&&d.node_errors&&Object.keys(d.node_errors).length)throw new Error('ComfyUI từ chối node: '+JSON.stringify(d.node_errors).slice(0,700));
 if(!d||typeof d.prompt_id!=='string'||!d.prompt_id)throw new Error('ComfyUI không trả prompt_id hợp lệ.');
 return {promptId:d.prompt_id,clientId:clientId,queueNumber:d.number};
}
async function poll(base,promptId,maxWait,onProgress){
 var start=Date.now(),delay=1200,last=null;
 while(Date.now()-start<(maxWait||600000)){
  var res=await request(base,'/history/'+encodeURIComponent(promptId),{},30000),d=await res.json();
  var rec=d&&d[promptId] ? d[promptId] : (d&&d.prompt_id===promptId?d:null);
  if(rec){
   last=rec;
   var status=rec.status||{};
   if(status.status_str==='error'||status.completed===false&&status.messages&&status.messages.some(function(m){return m&&m[0]==='execution_error';})){
    throw new Error('Workflow ComfyUI lỗi khi thực thi: '+JSON.stringify(status).slice(0,600));
   }
   if(rec.outputs&&Object.keys(rec.outputs).length){
    var files=collectFiles(rec);if(files.length)return {record:rec,files:files,elapsedMs:Date.now()-start};
    if(status.completed===true)return {record:rec,files:[],elapsedMs:Date.now()-start};
   }
   if(status.completed===true)return {record:rec,files:collectFiles(rec),elapsedMs:Date.now()-start};
  }
  if(onProgress)onProgress(Math.round((Date.now()-start)/1000));
  await new Promise(function(resolve){setTimeout(resolve,delay);});
  delay=Math.min(3000,delay+300);
 }
 throw new Error('ComfyUI chạy quá 10 phút; hãy kiểm tra hàng đợi trong ComfyUI. '+(last?'Đã nhận dữ liệu trạng thái.':''));
}
async function downloadFile(base,f){
 var q=new URLSearchParams({filename:f.filename,subfolder:f.subfolder||'',type:f.type||'output'});
 var res=await request(base,'/view?'+q.toString(),{},60000);
 var blob=await res.blob();if(!blob.size||blob.size>MAX_OUTPUT)throw new Error('Tệp đầu ra rỗng hoặc vượt giới hạn 150 MiB: '+f.filename);
 var mime=res.headers.get('content-type')||mimeFor(f.filename);
 return {blob:new Blob([blob],{type:mime}),filename:f.filename,mime:mime,kind:f.kind,nodeId:f.nodeId};
}
async function saveAssets(files){
 var saved=0,items=[];
 for(var i=0;i<files.length;i++){
  var f=await downloadFile(files[i].base,files[i].meta),ok=false;
  if(window.CV&&CV.assets&&typeof CV.assets.addBlob==='function'){
   try{await CV.assets.addBlob(f.blob,f.filename);ok=true;saved++;}catch(e){}
  }
  items.push(Object.assign(f,{saved:ok}));
 }
 return {items:items,saved:saved};
}
async function execute(payload,onProgress){
 var base=normalizeBase(payload.base),workflow=cloneWorkflow(payload.workflow),input=null;
 if(payload.file)input=await uploadMedia(base,payload.file);
 if(payload.promptNode)replaceInput(workflow,payload.promptNode,payload.promptKey,payload.prompt||'');
 if(input)replaceInput(workflow,payload.mediaNode,payload.mediaKey,input.name);
 var q=await queue(base,workflow),done=await poll(base,q.promptId,payload.timeoutMs||600000,onProgress);
 var files=done.files.map(function(f){return {base:base,meta:f};}),stored=await saveAssets(files);
 return {promptId:q.promptId,elapsedMs:done.elapsedMs,total:stored.items.length,saved:stored.saved,items:stored.items};
}
function register(){
 var O=window.CVOrchestratorP128;if(!O||typeof O.register!=='function')return false;
 ['image','video','upscale','interpolate'].forEach(function(kind){
  O.register(kind,'comfyui-local',async function(task){
   if(!prepared)throw new Error('Chưa nạp workflow ComfyUI và tệp đầu vào.');
   var payload=Object.assign({},prepared,{prompt:task.prompt||prepared.prompt});
   var r=await execute(payload,function(sec){if(prepared.onProgress)prepared.onProgress(sec);});
   prepared.lastResult=r;
   return 'ComfyUI hoàn tất '+kind+'. '+r.total+' tệp đầu ra; đã thêm '+r.saved+' vào Thư viện. Thời gian '+Math.round(r.elapsedMs/1000)+' giây. Prompt ID: '+r.promptId;
  });
 });
 registered=true;return true;
}
function clearLinks(){
 links.forEach(function(x){try{URL.revokeObjectURL(x.url);}catch(e){}});
 links=[];
}
function mount(){
 var page=document.getElementById('page-platform'),anchor=page&&page.querySelector('#cv128-card');
 if(!page||!anchor||page.querySelector('#cv120-card'))return false;
 var card=document.createElement('section');card.className='card';card.id='cv120-card';card.style.marginTop='14px';
 card.innerHTML='<div class="cardTop"><h3>ComfyUI cục bộ · P120/P126</h3><span class="sub">workflow mở rộng · không dùng cloud</span></div>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><input class="input" id="cv120-url" aria-label="Địa chỉ ComfyUI" value="http://127.0.0.1:8188" style="min-width:220px;max-width:310px"><button type="button" class="btn btn-soft sm" id="cv120-connect">Kiểm tra kết nối</button><span class="tiny" id="cv120-connection" role="status" aria-live="polite">Chưa kết nối</span></div>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><label class="tiny">Workflow API JSON <input type="file" id="cv120-workflow" accept=".json,application/json"></label><label class="tiny">Ảnh/video đầu vào (tuỳ chọn) <input type="file" id="cv120-media" accept="image/*,video/mp4,video/webm,video/quicktime"></label></div>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><select class="input" id="cv120-kind" aria-label="Tác vụ ComfyUI"><option value="image">Ảnh / Image workflow · P120</option><option value="upscale">Upscale / Real-ESRGAN workflow · P120</option><option value="video">AI video / video workflow · P126</option><option value="interpolate">Nội suy khung hình / RIFE workflow · P126</option></select></div>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><input class="input" id="cv120-prompt-node" placeholder="ID node prompt (tuỳ chọn)" aria-label="ID node prompt" style="max-width:170px"><input class="input" id="cv120-prompt-key" placeholder="Input prompt, ví dụ text" aria-label="Tên input prompt" style="max-width:190px"><input class="input" id="cv120-media-node" placeholder="ID node media (tuỳ chọn)" aria-label="ID node media" style="max-width:170px"><input class="input" id="cv120-media-key" placeholder="Input media, ví dụ image/video" aria-label="Tên input media" style="max-width:190px"></div>'+
 '<textarea class="input" id="cv120-prompt" rows="2" maxlength="4000" placeholder="Prompt / mô tả đầu ra (được ghi vào input node đã chọn)" style="margin-top:8px;width:100%" aria-label="Prompt workflow"></textarea>'+
 '<div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn btn-soft sm" id="cv120-run" disabled>Chạy qua AI Orchestrator</button><span class="tiny" id="cv120-status" role="status" aria-live="polite">Nạp workflow API JSON để bắt đầu.</span></div><div id="cv120-results" style="display:grid;gap:6px;margin-top:8px"></div>'+
 '<p class="tiny" style="opacity:.75;margin-top:8px">Chỉ kết nối localhost/127.0.0.1. Cần ComfyUI đang chạy và CORS cho phép đúng origin CANVIO. Workflow/model/custom nodes do bạn tự cài và chọn; tệp gửi tới ComfyUI trên máy bạn, không gửi tới dịch vụ cloud. File đầu ra tự thêm vào Thư viện nếu Asset Library đang sẵn sàng.</p>';
 anchor.parentNode.insertBefore(card,anchor.nextSibling);
 var $=function(s){return card.querySelector(s);},status=$('#cv120-status'),connection=$('#cv120-connection'),url=$('#cv120-url'),btn=$('#cv120-run'),workflowInput=$('#cv120-workflow');
 function say(s){status.textContent=s;}
 function canRun(){btn.disabled=!(prepared&&registered&&!runBusy);}
 $('#cv120-connect').addEventListener('click',async function(){
  connection.textContent='Đang kiểm tra…';try{var r=await connect(url.value);url.value=r.base;connection.textContent='Đã kết nối ComfyUI';}catch(e){connection.textContent=String(e.message||e);}
 });
 workflowInput.addEventListener('change',async function(){
  prepared=null;canRun();var file=this.files&&this.files[0];if(!file)return;
  try{
   if(file.size>MAX_WORKFLOW)throw new Error('Workflow vượt 10 MB.');
   var data=JSON.parse(await file.text());validateWorkflow(data);
   prepared={base:normalizeBase(url.value),workflow:data,file:null,prompt:'',promptNode:'',promptKey:'',mediaNode:'',mediaKey:'',timeoutMs:600000,lastResult:null,onProgress:function(sec){say('ComfyUI đang xử lý ('+sec+' giây)…');}};
   say('Đã nạp '+Object.keys(data).length+' node API. Kiểm tra kết nối rồi chạy tác vụ.');
  }catch(e){prepared=null;say(String(e.message||e));}
  register();canRun();
 });
 $('#cv120-run').addEventListener('click',async function(){
  if(runBusy||!prepared)return;
  try{
   prepared.base=normalizeBase(url.value);
   prepared.prompt=$('#cv120-prompt').value;
   prepared.promptNode=$('#cv120-prompt-node').value.trim();
   prepared.promptKey=$('#cv120-prompt-key').value.trim();
   prepared.mediaNode=$('#cv120-media-node').value.trim();
   prepared.mediaKey=$('#cv120-media-key').value.trim();
   prepared.file=$('#cv120-media').files&&$('#cv120-media').files[0]||null;
   if(prepared.promptNode&&!prepared.promptKey)throw new Error('Nhập tên input prompt.');
   if(prepared.file&&(!prepared.mediaNode||!prepared.mediaKey))throw new Error('Đã chọn media thì cần chỉ rõ node ID và input key của LoadImage/LoadVideo tương ứng.');
   register();if(!registered||!window.CVOrchestratorP128)throw new Error('AI Orchestrator P128 chưa sẵn sàng.');
   clearLinks();$('#cv120-results').innerHTML='';runBusy=true;canRun();say('Đang gửi workflow tới ComfyUI cục bộ…');
   var kind=$('#cv120-kind').value,task=await window.CVOrchestratorP128.run({kind:kind,prompt:prepared.prompt,tiers:['comfyui-local'],timeoutMs:600000,cache:false});
   if(!task.ok)throw new Error(task.message||'ComfyUI không trả kết quả.');
   say(String(task.text||'Hoàn tất.'));
   var r=prepared.lastResult;
   if(r&&r.items){r.items.forEach(function(item){
    var a=document.createElement('a'),u=URL.createObjectURL(item.blob);links.push({url:u});a.href=u;a.download=item.filename;a.textContent=(item.saved?'Đã lưu · ':'Tải xuống · ')+item.filename;a.className='btn btn-ghost sm';$('#cv120-results').appendChild(a);
   });}
  }catch(e){say(String(e&&e.message||e));}
  finally{runBusy=false;canRun();}
 });
 register();return true;
}
function ready(){
 try{register();mount();var p=document.getElementById('page-platform');if(p&&!p.__cv120&&window.MutationObserver){p.__cv120=true;new MutationObserver(function(){if(!p.querySelector('#cv120-card'))mount();register();}).observe(p,{childList:true,subtree:true});}}catch(e){}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){
 var valid={'1':{class_type:'CLIPTextEncode',inputs:{text:'old'}},'2':{class_type:'LoadImage',inputs:{image:'old.png'}}};
 var c=cloneWorkflow(valid);replaceInput(c,'1','text','new');replaceInput(c,'2','image','input.png');
 var files=collectFiles({outputs:{'9':{images:[{filename:'a.png',subfolder:'',type:'output'}],gifs:[{filename:'anim.gif',subfolder:'',type:'output'}]}}});
 var duplicate=collectFiles({outputs:{'1':{images:[{filename:'a.png',type:'output'},{filename:'a.png',type:'output'}]}}});
 var accepted=true;try{normalizeBase('https://example.com');accepted=false;}catch(e){}
 return {
  loopbackHttp:normalizeBase('http://127.0.0.1:8188')==='http://127.0.0.1:8188',
  loopbackHttps:normalizeBase('https://localhost:8188')==='https://localhost:8188',
  rejectsRemote:accepted,
  rejectsCredentials:(function(){try{normalizeBase('http://user:pass@127.0.0.1:8188');return false;}catch(e){return true;}})(),
  rejectsPath:(function(){try{normalizeBase('http://127.0.0.1:8188/prompt');return false;}catch(e){return true;}})(),
  validatesApiNodes:!!validateWorkflow(valid)['1'].inputs,
  promptAndMediaOverrides:c['1'].inputs.text==='new'&&c['2'].inputs.image==='input.png',
  rejectsMissingNode:(function(){try{replaceInput(cloneWorkflow(valid),'7','text','x');return false;}catch(e){return true;}})(),
  rejectsMissingInput:(function(){try{replaceInput(cloneWorkflow(valid),'1','unknown','x');return false;}catch(e){return true;}})(),
  collectsImageAndVideoOutputs:files.length===2&&files.some(function(x){return x.filename==='a.png';})&&files.some(function(x){return x.filename==='anim.gif';}),
  deduplicatesOutputs:duplicate.length===1,
  outputMime:mimeFor('clip.mp4')==='video/mp4'&&mimeFor('image.png')==='image/png'
 };
}
window.CVComfyP120P126={version:'120.126.1',normalizeBase:normalizeBase,validateWorkflow:validateWorkflow,replaceInput:replaceInput,collectFiles:collectFiles,mimeFor:mimeFor,connect:connect,uploadMedia:uploadMedia,queue:queue,poll:poll,execute:execute,register:register,mount:mount,tests:tests};
})();