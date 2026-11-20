/* P145.9/.10 — read-only Asset Library quality gate + local search, reuses existing assets and license metadata. */
(function(){
'use strict';
if(window.CVAssetSearchGateP145910)return;
var META_KEY='canvio145:meta',assetProvider=null;
function setAssetProvider(fn){assetProvider=typeof fn==='function'?fn:null;return !!assetProvider;}
function safeMeta(){
 try{var x=JSON.parse(localStorage.getItem(META_KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}catch(e){return{};}
}
function getAssets(input){
 if(Array.isArray(input))return input.slice(0,10000);
 try{var a=assetProvider?assetProvider():(window.CV&&CV.assets&&typeof CV.assets.list==='function'?CV.assets.list():[]);return Array.isArray(a)?a.slice(0,10000):[];}catch(e){return[];}
}
function kindOf(a){
 var t=String(a&& (a.type||a.mime||a.mimeType)||'').toLowerCase(),n=String(a&&(a.name||a.filename)||'').toLowerCase();
 if(t.indexOf('image/')===0||/\.(png|jpe?g|gif|webp|svg|avif)$/.test(n))return'image';
 if(t.indexOf('video/')===0||/\.(mp4|mov|webm|mkv)$/.test(n))return'video';
 if(t.indexOf('audio/')===0||/\.(mp3|wav|m4a|ogg|flac)$/.test(n))return'audio';
 if(/pdf|word|officedocument|text\//.test(t)||/\.(pdf|docx?|pptx?|xlsx?|txt|md|csv)$/.test(n))return'document';
 return'other';
}
function textOf(a,m){
 return[a&&a.id,a&&a.name,a&&a.filename,a&&a.type,a&&a.mime,a&&a.mimeType,m&&m.license,m&&m.author,m&&m.source,m&&m.url].map(function(x){return String(x==null?'':x);}).join(' ').toLowerCase();
}
function evaluateAssets(assets,meta,gate,transientHashes){
 var list=getAssets(assets),m=meta||{},hashes=transientHashes||{},seen=[],out=[];
 list.forEach(function(a){
  var id=String(a&&a.id||''),am=m[id]||{},stored=String(a&&a.hash||'').trim(),computed=String(hashes[id]||'').trim(),hash=stored||computed,effective=a;
  if(!stored&&computed)effective=Object.assign({},a,{hash:computed});
  var result=typeof gate==='function'?gate(effective,am,seen.slice()):{pass:false,issues:['Quality Gate P145 chưa khả dụng']};
  out.push({asset:a,meta:am,gate:result||{pass:false,issues:['Không có kết quả kiểm tra']},kind:kindOf(a),hasHash:!!hash,hash:hash,hashSource:stored?'metadata':computed?'session':'missing'});
  if(hash)seen.push(hash);
 });
 return{items:out,total:out.length,ready:out.filter(function(x){return x.gate.pass;}).length,warn:out.filter(function(x){return !x.gate.pass;}).length,withoutHash:out.filter(function(x){return !x.hasHash;}).length,sessionHashes:out.filter(function(x){return x.hashSource==='session';}).length};
}
/* Read-only SHA-256 scan of local Asset Library data URLs. Hashes stay in memory for this page session. */
var MAX_HASH_BYTES=64*1024*1024,MAX_HASH_ASSETS=40,MAX_HASH_FILE_BYTES=25*1024*1024;
function dataUrlBase64(a){
 var data=String(a&&a.data||''),comma=data.indexOf(',');
 if(comma<5||!/^data:/i.test(data.slice(0,5))||!/;base64/i.test(data.slice(0,comma)))return null;
 var payload=data.slice(comma+1).replace(/\s/g,'');
 if(!payload||payload.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(payload))return null;
 return payload;
}
function estimatedBytes(payload){
 if(!payload)return 0;
 return Math.max(0,Math.floor(payload.length*3/4)-(payload.endsWith('==')?2:payload.endsWith('=')?1:0));
}
function sha256DataUrl(a){
 var payload=dataUrlBase64(a);
 if(!payload||!window.crypto||!window.crypto.subtle||typeof window.atob!=='function')return Promise.resolve('');
 return Promise.resolve().then(function(){
  var raw=window.atob(payload),bytes=new Uint8Array(raw.length);
  for(var i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  return window.crypto.subtle.digest('SHA-256',bytes);
 }).then(function(buffer){
  return Array.prototype.map.call(new Uint8Array(buffer),function(x){return('0'+x.toString(16)).slice(-2);}).join('');
 });
}
function hashMissingAssets(assets,onProgress){
 var list=getAssets(assets),hashes=Object.create(null),used=0,computed=0,skipped=0,attempted=0;
 return list.reduce(function(chain,a,index){
  return chain.then(function(){
   if(a&&String(a.hash||'').trim())return;
   var id=String(a&&a.id||''),payload=dataUrlBase64(a),bytes=estimatedBytes(payload);
   if(!id||!payload||!bytes||bytes>MAX_HASH_FILE_BYTES||used+bytes>MAX_HASH_BYTES||attempted>=MAX_HASH_ASSETS){skipped++;if(onProgress)onProgress(index+1,list.length,computed,skipped);return;}
   attempted++;used+=bytes;
   return sha256DataUrl(a).then(function(hash){if(hash){hashes[id]=hash;computed++;}else skipped++;}).catch(function(){skipped++;}).then(function(){if(onProgress)onProgress(index+1,list.length,computed,skipped);});
  });
 },Promise.resolve()).then(function(){return{hashes:hashes,computed:computed,skipped:skipped,bytes:used};});
}
function searchAssets(report,query,kind,status){
 var q=String(query||'').trim().toLowerCase();
 return(report&&report.items||[]).filter(function(x){
  if(kind&&kind!=='all'&&x.kind!==kind)return false;
  if(status==='ready'&&!x.gate.pass)return false;
  if(status==='warning'&&x.gate.pass)return false;
  return !q||textOf(x.asset,x.meta).indexOf(q)>=0;
 });
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function mount(){
 var page=document.querySelector('#page-assets');if(!page||page.querySelector('#cv145910-card'))return false;
 var core=window.CVContentCoreP145;if(!core||typeof core.qualityGate!=='function')return false;
 var card=document.createElement('section');card.id='cv145910-card';card.className='card';card.style.marginTop='12px';
 card.innerHTML='<div class="cardTop"><h3>Asset Search &amp; Quality Gate · P145.9/10</h3><span class="sub">Tìm kiếm cục bộ · rà soát chỉ đọc</span></div>'+
 '<div class="row" style="gap:8px;align-items:end;flex-wrap:wrap"><label class="tiny" style="flex:1;min-width:190px">Tìm tài nguyên<input class="input" id="cv145910-q" placeholder="Tên, ID, loại, giấy phép, nguồn…"></label><label class="tiny">Loại<select class="input" id="cv145910-kind"><option value="all">Tất cả</option><option value="image">Ảnh / SVG</option><option value="video">Video</option><option value="audio">Âm thanh</option><option value="document">Tài liệu</option><option value="other">Khác</option></select></label><label class="tiny">Quality Gate<select class="input" id="cv145910-status"><option value="all">Tất cả</option><option value="ready">Đạt</option><option value="warning">Cần xử lý</option></select></label><button type="button" class="btn btn-soft sm" id="cv145910-refresh">Làm mới &amp; rà soát</button></div>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;margin:10px 0"><span class="tiny" id="cv145910-summary" role="status" aria-live="polite">Chưa rà soát.</span><span class="tiny" id="cv145910-hash-note"></span></div>'+
 '<div id="cv145910-list" style="display:grid;gap:6px"></div><div class="tiny" id="cv145910-detail" role="status" aria-live="polite" style="margin-top:10px">Chọn tài nguyên để xem kết quả Quality Gate. Không có thao tác sửa, xóa hoặc tải lên ở đây.</div>';
 var after=page.querySelector('#cv1458-card')||page.querySelector('#cv1457-card')||page.querySelector('#cv1456-card')||page.querySelector('#cv1455-card')||page.querySelector('#cv145-card');
 if(after&&after.parentNode)after.parentNode.insertBefore(card,after.nextSibling);else page.appendChild(card);
 var $=function(sel){return card.querySelector(sel);},report=null,visible=[],selected=null,scanSeq=0;
 function run(shouldHash){
  var assets=getAssets(null),meta=safeMeta(),button=$('#cv145910-refresh'),note=$('#cv145910-hash-note'),seq=++scanSeq;
  function show(hashes,stats){
   report=evaluateAssets(assets,meta,core.qualityGate,hashes||{});
   visible=searchAssets(report,$('#cv145910-q').value,$('#cv145910-kind').value,$('#cv145910-status').value);
   $('#cv145910-summary').textContent='Tổng '+report.total+' · Đạt '+report.ready+' · Cần xử lý '+report.warn+' · Đang hiển thị '+visible.length;
   var parts=[];
   if(stats&&stats.computed)parts.push(stats.computed+' SHA-256 tạm tính trong phiên (không ghi vào kho)');
   if(report.withoutHash)parts.push(report.withoutHash+' mục chưa có hash');
   if(stats&&stats.skipped)parts.push(stats.skipped+' mục bỏ qua do thiếu data URL, vượt giới hạn hoặc Web Crypto không khả dụng');
   note.textContent=parts.join(' · ')||'Tất cả mục có hash trong metadata.';
   note.dataset.state='done';note.dataset.scanId=String(seq);
   draw();
  }
  if(!shouldHash){show({},null);return;}
  button.disabled=true;note.dataset.state='busy';note.dataset.scanId=String(seq);note.textContent='Đang tính SHA-256 cục bộ…';
  hashMissingAssets(assets,function(done,total,computed,skipped){note.textContent='SHA-256 '+done+'/'+total+' · đã tính '+computed+' · bỏ qua '+skipped;})
   .then(function(result){show(result.hashes,result);})
   .catch(function(error){show({}, {computed:0,skipped:assets.length});note.textContent='Không thể tính hash: '+String(error&&error.message||error).slice(0,120);})
   .then(function(){button.disabled=false;});
 }
 function draw(){
  var root=$('#cv145910-list');root.replaceChildren();
  visible.slice(0,500).forEach(function(x){
   var a=x.asset||{},b=document.createElement('button');b.type='button';b.className='btn btn-ghost';b.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left;flex-wrap:wrap;padding:9px;border:1px solid var(--line,rgba(128,140,160,.18))';
   var left=document.createElement('span');left.textContent=String(a.name||a.filename||a.id||'Tài nguyên không tên')+' · '+x.kind;
   var right=document.createElement('span');right.className='tiny';right.textContent=x.gate.pass?'Đạt':'Cần xử lý: '+(x.gate.issues||[]).join('; ');
   b.appendChild(left);b.appendChild(right);b.addEventListener('click',function(){selected=x;showDetail();});
   root.appendChild(b);
  });
  if(!visible.length){var empty=document.createElement('p');empty.className='tiny';empty.textContent='Không tìm thấy tài nguyên khớp bộ lọc.';root.appendChild(empty);}
  if(visible.length>500){var more=document.createElement('p');more.className='tiny';more.textContent='Đang giới hạn hiển thị 500 kết quả; thu hẹp tìm kiếm để xem các mục tiếp theo.';root.appendChild(more);}
 }
 function showDetail(){
  if(!selected){$('#cv145910-detail').textContent='Chọn tài nguyên để xem kết quả.';return;}
  var a=selected.asset||{},g=selected.gate||{},m=selected.meta||{};
  $('#cv145910-detail').textContent=(a.name||a.id||'Tài nguyên')+' — '+(g.pass?'QUALITY GATE: PASS':'QUALITY GATE: CẦN XỬ LÝ')+
   (g.issues&&g.issues.length?'\n'+g.issues.join('\n'):'\nĐủ các trường kiểm tra hiện có.')+
   '\nGiấy phép: '+(m.license||'chưa khai báo')+' · Nguồn: '+(m.source||m.author||'chưa khai báo')+
   '\nDung lượng: '+(Number(a.size)>0?(Number(a.size)/1048576).toFixed(2)+' MB':'chưa có')+
   '\nHash: '+(a.hash||'chưa có; không khẳng định đã kiểm trùng');
 }
 ['input','change'].forEach(function(ev){$('#cv145910-q').addEventListener(ev,function(){run(false);});$('#cv145910-kind').addEventListener(ev,function(){run(false);});$('#cv145910-status').addEventListener(ev,function(){run(false);});});
 $('#cv145910-refresh').addEventListener('click',function(){run(true);});
 run();return true;
}
function ready(){try{mount();var p=document.querySelector('#page-assets');if(p&&!p.__cv145910Obs&&window.MutationObserver){p.__cv145910Obs=new MutationObserver(function(){if(!p.querySelector('#cv145910-card'))mount();});p.__cv145910Obs.observe(p,{childList:true});}}catch(e){if(window.console)console.warn('P145.9/10 Search Gate',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){
 var a=[{id:'1',name:'Finance Report.PDF',type:'application/pdf',size:10,hash:'a'},{id:'2',name:'Brand.svg',type:'image/svg+xml',size:20,hash:'b'},{id:'3',name:'Duplicate.svg',type:'image/svg+xml',size:20,hash:'b'}];
 var m={1:{license:'cc0'},2:{license:'own'},3:{license:'unknown'}};
 var r=evaluateAssets(a,m,function(x,meta,seen){var issues=[];if(!meta.license||meta.license==='unknown')issues.push('thiếu giấy phép');if(x.size<=0)issues.push('tệp rỗng');if(x.hash&&seen.indexOf(x.hash)>=0)issues.push('trùng nội dung');return{pass:!issues.length,issues:issues};});
 return{
  assetListCappedAndStable:getAssets(a).length===3,
  typeDetectionWorks:r.items[0].kind==='document'&&r.items[1].kind==='image',
  duplicateHashDetectedOnlyAfterFirstOccurrence:r.items[1].gate.pass&&r.items[2].gate.issues.indexOf('trùng nội dung')>=0,
  unknownLicenseFailsGate:r.items[2].gate.pass===false,
  searchMatchesName:r.total===3&&searchAssets(r,'finance','all','all').length===1,
  typeFilterWorks:searchAssets(r,'','image','all').length===2,
  gateFiltersWork:searchAssets(r,'','all','ready').length===2&&searchAssets(r,'','all','warning').length===1,
  invalidInputSafe:searchAssets(null,'x').length===0,
  transientShaParticipatesInDuplicateGate:(function(){var rows=[{id:'h1',name:'one',size:5},{id:'h2',name:'two',size:5}],r=evaluateAssets(rows,{},function(a,m,seen){var issues=a.hash&&seen.indexOf(a.hash)>=0?['trùng nội dung']:[];return{pass:!issues.length,issues:issues};},{h1:'sha-test',h2:'sha-test'});return r.items[0].gate.pass&&r.items[1].gate.issues.indexOf('trùng nội dung')>=0&&r.sessionHashes===2;})(),
  transientShaDoesNotMutateVaultRecords:(function(){var rows=[{id:'h1',name:'one',size:5},{id:'h2',name:'two',size:5}];evaluateAssets(rows,{},function(){return{pass:true,issues:[]};},{h1:'sha-test'});return rows.every(function(a){return !Object.prototype.hasOwnProperty.call(a,'hash');});})()
 };
}
window.CVAssetSearchGateP145910={version:'145.10.0',getAssets:getAssets,setAssetProvider:setAssetProvider,kindOf:kindOf,evaluateAssets:evaluateAssets,searchAssets:searchAssets,hashMissingAssets:hashMissingAssets,mount:mount,tests:tests};
})();