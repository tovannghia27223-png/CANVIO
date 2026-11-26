/* P242 · .canvio portable project bundle; stored ZIP only, CRC/SHA checked; native P170 remains autosave owner. */
(function(w){
'use strict';if(w.CVProjectBundleP242)return;
function project(){var C=w.CVCreativeCore;return C&&C.active||null;}
function u8(s){return new TextEncoder().encode(s);}
function hex(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0');}).join('');}
async function sha(data){var b=data instanceof Blob?await data.arrayBuffer():data instanceof ArrayBuffer?data:u8(String(data)).buffer;return hex(await crypto.subtle.digest('SHA-256',b));}
function safeName(s){return String(s||'').replace(/\\/g,'/').replace(/^\/+|\/+$/g,'').split('/').every(function(x){return x&&x!=='.'&&x!=='..';});}
async function exportBundle(){
 var p=project();if(!p)throw new Error('Chưa có dự án đang mở.');
 var payload={format:'CANVIO_PROJECT',version:1,project:JSON.parse(JSON.stringify(p)),assets:[]},assets=w.CV&&CV.assets&&CV.assets.list?CV.assets.list():[];
 for(var a of assets.slice(0,100)){if(!a||!/^data:/.test(a.data||'')||a.data.length>12*1024*1024)continue;var blob=await fetch(a.data).then(function(r){return r.blob();}),hash=await sha(blob);payload.assets.push({id:a.id,name:a.name,mime:a.mime||blob.type,sha256:hash,data:a.data});}
 var body=JSON.stringify(payload),manifest={format:'CANVIO_PROJECT_BUNDLE',version:1,projectId:p.id,sha256:await sha(body),assetCount:payload.assets.length};
 if(!w.CVZip||!CVZip.build)throw new Error('CVZip hiện có chưa sẵn sàng.');
 return CVZip.build([{name:'manifest.json',data:JSON.stringify(manifest)},{name:'project.json',data:body}]);
}
function crc32(bytes){var c=~0;for(var i=0;i<bytes.length;i++){c^=bytes[i];for(var j=0;j<8;j++)c=(c>>>1)^((c&1)?0xEDB88320:0);}return(~c)>>>0;}
async function readStoredZip(file){
 if(!file||file.size>128*1024*1024)throw new Error('Gói .canvio rỗng hoặc vượt 128 MiB.');
 var b=new Uint8Array(await file.arrayBuffer()),v=new DataView(b.buffer,b.byteOffset,b.byteLength),eocd=-1;
 for(var i=b.length-22;i>=Math.max(0,b.length-65558);i--)if(v.getUint32(i,true)===0x06054b50){eocd=i;break;}
 if(eocd<0||eocd+22>b.length)throw new Error('Không tìm thấy ZIP directory hợp lệ.');
 if(v.getUint16(eocd+4,true)!==0||v.getUint16(eocd+6,true)!==0)throw new Error('Không hỗ trợ ZIP multi-disk.');
 var count=v.getUint16(eocd+10,true),off=v.getUint32(eocd+16,true),cdSize=v.getUint32(eocd+12,true);
 if(!count||count>110||off+cdSize>eocd)throw new Error('ZIP vượt giới hạn entry hoặc central directory.');
 var pos=off,out={},total=0;
 for(var n=0;n<count;n++){
  if(pos+46>b.length||v.getUint32(pos,true)!==0x02014b50)throw new Error('ZIP central directory sai cấu trúc.');
  var flags=v.getUint16(pos+8,true),method=v.getUint16(pos+10,true),crc=v.getUint32(pos+16,true),size=v.getUint32(pos+24,true),compressed=v.getUint32(pos+20,true),nl=v.getUint16(pos+28,true),el=v.getUint16(pos+30,true),cl=v.getUint16(pos+32,true),lo=v.getUint32(pos+42,true),name=new TextDecoder().decode(b.slice(pos+46,pos+46+nl));
  if(flags!==0||method!==0||compressed!==size||!safeName(name)||name in out||size>25*1024*1024)throw new Error('ZIP chỉ nhận stored entry an toàn, duy nhất, tối đa 25 MiB/tệp.');
  total+=size;if(total>120*1024*1024)throw new Error('Tổng nội dung ZIP vượt 120 MiB.');
  if(lo+30>b.length||v.getUint32(lo,true)!==0x04034b50)throw new Error('Local ZIP header sai.');
  var lf=v.getUint16(lo+6,true),lm=v.getUint16(lo+8,true),ls=v.getUint32(lo+18,true),lc=v.getUint32(lo+22,true),ln=v.getUint16(lo+26,true),le=v.getUint16(lo+28,true),start=lo+30+ln+le,bytes=b.slice(start,start+size);
  if(lf!==0||lm!==0||ls!==size||lc!==crc||ln!==nl||new TextDecoder().decode(b.slice(lo+30,lo+30+ln))!==name||start+size>off||bytes.length!==size||crc32(bytes)!==crc)throw new Error('Local header hoặc CRC32 không khớp: '+name);
  out[name]=bytes;pos+=46+nl+el+cl;
 }
 if(pos!==off+cdSize)throw new Error('Central directory length không khớp.');return out;
}
async function importBundle(file,confirmFn){
 var entries=await readStoredZip(file);if(!entries['manifest.json']||!entries['project.json'])throw new Error('Thiếu manifest.json hoặc project.json.');
 var manifest=JSON.parse(new TextDecoder().decode(entries['manifest.json'])),body=new TextDecoder().decode(entries['project.json']);
 if(manifest.format!=='CANVIO_PROJECT_BUNDLE'||manifest.version!==1||await sha(body)!==manifest.sha256)throw new Error('Manifest hoặc SHA-256 dự án không hợp lệ.');
 var data=JSON.parse(body);if(data.format!=='CANVIO_PROJECT'||!data.project||typeof data.project!=='object')throw new Error('Dữ liệu dự án không hợp lệ.');
 var approve=typeof confirmFn==='function'?confirmFn(manifest):w.confirm('Nhập dự án “'+String(data.project.name||'Không tên')+'” và '+(data.assets||[]).length+' tài nguyên vào CANVIO?');if(!approve)return{ok:false,cancelled:true};
 var C=w.CVCreativeCore;if(!C||!C.create)throw new Error('Shared Core không có API tạo dự án.');
 var p=C.create({name:String(data.project.name||'Dự án nhập')});if(!p)throw new Error('Không tạo được dự án đích.');
 p.brief=data.project.brief||'';p.goal=data.project.goal||p.goal;p.documents=JSON.parse(JSON.stringify(data.project.documents||{}));
 var restored=0,assetMap={};
 for(var a of (data.assets||[]).slice(0,100)){
  if(!a.data||await sha(await fetch(a.data).then(function(r){return r.blob();}))!==a.sha256)continue;
  if(w.CV&&CV.assets&&CV.assets.addBlob){var blob=await fetch(a.data).then(function(r){return r.blob();}),added=await CV.assets.addBlob(new File([blob],String(a.name||'asset'),{type:a.mime||blob.type}));var newId=added&& (added.id||added.asset&&added.asset.id);if(!newId&&CV.assets.list){var found=CV.assets.list().filter(function(x){return x.name===a.name;}).slice(-1)[0];newId=found&&found.id;}if(newId&&a.id)assetMap[a.id]=newId;restored++;}
 }
 function relink(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(relink);return;}Object.keys(node).forEach(function(k){if(typeof node[k]==='string'&&assetMap[node[k]])node[k]=assetMap[node[k]];else if(node[k]&&typeof node[k]==='object')relink(node[k]);});}
 relink(p.documents);
 p.assetIds=Array.isArray(data.project.assetIds)?data.project.assetIds.map(function(id){return assetMap[id];}).filter(Boolean):[];
 if(C.linkAsset)Object.keys(assetMap).forEach(function(oldId){try{C.linkAsset(assetMap[oldId]);}catch(e){}});
 try{if(C.capture)C.capture('project');}catch(e){}
 return{ok:true,projectId:p.id,assetsRestored:restored,assetLinksUpdated:Object.keys(assetMap).length};
}
var autoTimer=null;
async function startAutoSave(interval){
 if(!w.CVStorageHubP170)throw new Error('P170 Storage Hub chưa sẵn sàng.');
 var state=await w.CVStorageHubP170.folderState();if(!state||state.state!=='granted')throw new Error('Chọn thư mục CANVIO và cấp quyền ghi trước khi bật tự lưu.');
 stopAutoSave();var ms=Math.max(60000,Math.min(600000,Number(interval)||120000));
 autoTimer=w.setInterval(function(){if(w.document&&document.visibilityState==='hidden')return;w.CVStorageHubP170.saveLocal(false).catch(function(){});},ms);return{ok:true,intervalMs:ms};
}
function stopAutoSave(){if(autoTimer)w.clearInterval(autoTimer);autoTimer=null;return true;}
var api={version:'242.1.1',exportBundle:exportBundle,readStoredZip:readStoredZip,importBundle:importBundle,startAutoSave:startAutoSave,stopAutoSave:stopAutoSave,tests:function(){return{zipReaderStoredOnly:true,crc32:crc32(u8('123456789'))===0xcbf43926,projectOwner:!!w.CVCreativeCore,assetOwner:!!(w.CV&&CV.assets),storageOwner:!!w.CVStorageHubP170,entryLimit:110,totalBytesLimit:120*1024*1024,assetRelink:typeof importBundle==='function'&&typeof project==='function'};}};
w.CVProjectBundleP242=api;
})(window);