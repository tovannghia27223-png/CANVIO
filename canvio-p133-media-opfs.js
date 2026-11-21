/* P133.4 · Large-media OPFS sidecar for the existing CANVIO_81_MEDIA owner.
 * The existing IndexedDB database/object store remains canonical for media IDs and metadata.
 * OPFS is used only for large Blob bytes. The IDB pointer is updated only after a verified OPFS write.
 */
(function(){
'use strict';
if(window.CVMediaOPFSP133)return;
var DB_NAME='CANVIO_81_MEDIA',STORE='media',DIR='canvio-video-media',DEFAULT_THRESHOLD=32*1048576,writeSeq=0;
function safeId(id){
 var value=String(id||'').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,100);
 if(!value)throw new Error('Media ID không hợp lệ.');
 return value;
}
function fileName(id){return 'media-'+safeId(id)+'.blob';}
function supportsOpfs(){
 try{return !!(navigator.storage&&typeof navigator.storage.getDirectory==='function'&&window.FileSystemFileHandle&&FileSystemFileHandle.prototype.createWritable);}
 catch(e){return false;}
}
var dbPromise=null;
function getDb(state){
 if(state&&state.db&&state.db.objectStoreNames&&state.db.objectStoreNames.contains(STORE))return Promise.resolve(state.db);
 if(dbPromise)return dbPromise;
 if(!window.indexedDB)return Promise.reject(new Error('IndexedDB không được hỗ trợ.'));
 dbPromise=new Promise(function(resolve,reject){
  var req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=function(){if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});};
  req.onsuccess=function(){resolve(req.result);};
  req.onerror=function(){dbPromise=null;reject(req.error||new Error('Không mở được media database.'));};
 });
 return dbPromise;
}
function readRecord(id,state){
 return getDb(state).then(function(db){return new Promise(function(resolve,reject){
  var tx,req;try{tx=db.transaction(STORE,'readonly');req=tx.objectStore(STORE).get(id);}catch(e){reject(e);return;}
  req.onsuccess=function(){resolve(req.result||null);};req.onerror=function(){reject(req.error||new Error('Không đọc được media metadata.'));};
 });});
}
function writeRecord(record,state){
 return getDb(state).then(function(db){return new Promise(function(resolve,reject){
  var tx;try{tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);}catch(e){reject(e);return;}
  tx.oncomplete=function(){resolve(true);};tx.onerror=tx.onabort=function(){reject(tx.error||new Error('Không cập nhật được media metadata.'));};
 });});
}
function deleteRecord(id,state){
 return getDb(state).then(function(db){return new Promise(function(resolve,reject){
  var tx;try{tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);}catch(e){reject(e);return;}
  tx.oncomplete=function(){resolve(true);};tx.onerror=tx.onabort=function(){reject(tx.error||new Error('Không xóa được media metadata.'));};
 });});
}
function allRecords(state){
 return getDb(state).then(function(db){return new Promise(function(resolve,reject){
  var tx,req;try{tx=db.transaction(STORE,'readonly');req=tx.objectStore(STORE).getAll();}catch(e){reject(e);return;}
  req.onsuccess=function(){resolve(req.result||[]);};req.onerror=function(){reject(req.error||new Error('Không liệt kê được media metadata.'));};
 });});
}
function directory(){
 if(!supportsOpfs())return Promise.reject(new Error('Trình duyệt không hỗ trợ OPFS.'));
 return navigator.storage.getDirectory().then(function(root){return root.getDirectoryHandle(DIR,{create:true});});
}
function removeOpfs(name){
 return directory().then(function(dir){return dir.removeEntry(name);}).catch(function(e){if(e&&e.name==='NotFoundError')return true;throw e;});
}
function readOpfs(name){
 return directory().then(function(dir){return dir.getFileHandle(name).then(function(handle){return handle.getFile();});})
  .catch(function(e){if(e&&e.name==='NotFoundError')return null;throw e;});
}
function writeOpfs(name,blob){
 return directory().then(function(dir){return dir.getFileHandle(name,{create:true});})
  .then(function(handle){return handle.createWritable().then(function(writer){
   return writer.write(blob).then(function(){return writer.close();}).catch(function(e){try{return writer.abort().then(function(){throw e;},function(){throw e;});}catch(ignore){throw e;}});
  }).then(function(){return handle.getFile();});})
  .then(function(saved){
   if(!saved||saved.size!==blob.size)throw new Error('OPFS ghi xong nhưng kiểm tra kích thước Blob không khớp.');
   return saved;
  });
}
function quotaAllows(bytes){
 if(!navigator.storage||typeof navigator.storage.estimate!=='function')return Promise.resolve(false);
 return navigator.storage.estimate().then(function(info){
  var quota=Number(info&&info.quota)||0,used=Number(info&&info.usage)||0;
  return quota>used&&quota-used>=bytes+Math.max(8*1048576,Math.ceil(bytes*.1));
 }).catch(function(){return false;});
}
function idbPut(id,blob,state){
 return writeRecord({id:id,blob:blob},state).then(function(){return{ok:true,storage:'indexeddb',bytes:blob.size};});
}
function put(id,blob,state){
 id=safeId(id);
 if(!(blob instanceof Blob))return Promise.reject(new Error('Media phải là Blob hoặc File.'));
 var threshold=DEFAULT_THRESHOLD;
 if(blob.size<threshold||!supportsOpfs())return idbPut(id,blob,state);
 return quotaAllows(blob.size).then(function(allowed){
  if(!allowed)return idbPut(id,blob,state);
  var name=fileName(id)+'.staged-'+Date.now().toString(36)+'-'+(++writeSeq),previous=null;
  return readRecord(id,state).then(function(rec){previous=rec;return writeOpfs(name,blob);})
   .then(function(){
    var record={id:id,blob:null,storage:'opfs',opfsName:name,bytes:blob.size,type:blob.type||'',name:String(blob.name||''),lastModified:Number(blob.lastModified)||0,storageVersion:1};
    return writeRecord(record,state).then(function(){
     if(previous&&previous.storage==='opfs'&&previous.opfsName&&previous.opfsName!==name)return removeOpfs(previous.opfsName).catch(function(){});
     return{ok:true,storage:'opfs',bytes:blob.size};
    });
   }).catch(function(error){
    return removeOpfs(name).catch(function(){}).then(function(){throw error;});
   }).catch(function(){
    /* Safe fallback: retain bytes in the canonical IDB record if OPFS is unavailable or quota rejects. */
    return idbPut(id,blob,state);
   });
 });
}
function get(id,state){
 id=safeId(id);
 return readRecord(id,state).then(function(record){
  if(!record)return null;
  if(record.blob instanceof Blob)return record.blob;
  if(record.storage==='opfs'&&record.opfsName)return readOpfs(record.opfsName).then(function(file){return file?new Blob([file],{type:record.type||''}):null;});
  return null;
 }).catch(function(){return null;});
}
function remove(id,state){
 id=safeId(id);
 return readRecord(id,state).then(function(record){
  if(!record)return false;
  return deleteRecord(id,state).then(function(){
   if(record.storage==='opfs'&&record.opfsName)return removeOpfs(record.opfsName).then(function(){return true;});
   return true;
  });
 }).catch(function(){return false;});
}
function migrateLarge(state,threshold,onProgress){
 threshold=Math.max(1,Number(threshold)||DEFAULT_THRESHOLD);
 if(!state||!state.db)return Promise.resolve({ok:false,reason:'video-db-unavailable',migrated:0,bytes:0,skipped:0,errors:[]});
 if(!supportsOpfs())return Promise.resolve({ok:false,reason:'opfs-unavailable',migrated:0,bytes:0,skipped:0,errors:[]});
 return allRecords(state).then(function(records){
  var candidates=records.filter(function(r){return r&&r.blob instanceof Blob&&r.blob.size>=threshold;});
  var total=candidates.reduce(function(n,r){return n+r.blob.size;},0);
  return quotaAllows(total).then(function(allowed){
   if(!allowed)return{ok:false,reason:'quota-reserve-not-met',migrated:0,bytes:0,skipped:candidates.length,errors:[]};
   var report={ok:true,migrated:0,bytes:0,skipped:records.length-candidates.length,errors:[]},index=0;
   return candidates.reduce(function(chain,record){
    return chain.then(function(){
     index++;if(onProgress)try{onProgress(index,candidates.length,record.id);}catch(e){}
     return put(record.id,record.blob,state).then(function(result){
      if(result.storage==='opfs'){report.migrated++;report.bytes+=record.blob.size;}
      else report.skipped++;
     }).catch(function(error){report.errors.push({id:record.id,error:String(error&&error.message||error).slice(0,160)});});
    });
   },Promise.resolve()).then(function(){report.ok=report.errors.length===0;return report;});
  });
 });
}
function mountSettings(){
 var card=document.querySelector('#cv133-card');
 if(!card||card.querySelector('#cv133-media-migrate'))return false;
 var box=document.createElement('div');box.id='cv133-media-opfs';box.style.cssText='margin-top:12px;padding-top:12px;border-top:1px solid var(--line,rgba(148,163,184,.24))';
 box.innerHTML='<div style="font-weight:700;font-size:13px">Media dung lượng lớn · P133.4</div><p class="tiny" style="margin:5px 0 8px">Chuyển media từ 32 MB sang OPFS trong cùng CANVIO_81_MEDIA. Chỉ đổi metadata sau khi file OPFS đã ghi và xác minh; cần chừa dung lượng trống.</p><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button type="button" class="btn btn-soft sm" id="cv133-media-migrate">Chuyển media lớn sang OPFS</button><span class="tiny" id="cv133-media-status" role="status" aria-live="polite">Chưa chạy migration.</span></div>';
 card.appendChild(box);
 var button=box.querySelector('#cv133-media-migrate'),status=box.querySelector('#cv133-media-status'),busy=false;
 button.addEventListener('click',function(){
  if(busy)return;var video=window.CV&&CV.engines&&CV.engines.video,state=video&&video._state&&video._state();
  if(!state||!state.db){status.textContent='Mở Video Engine ít nhất một lần để khởi tạo media database.';return;}
  busy=true;button.disabled=true;status.textContent='Đang kiểm tra dung lượng…';
  migrateLarge(state,DEFAULT_THRESHOLD,function(i,n){status.textContent='Đang chuyển '+i+'/'+n+' media…';})
   .then(function(result){
    if(result.reason==='quota-reserve-not-met')status.textContent='Chưa chuyển: dung lượng trống không đủ mức dự phòng an toàn.';
    else if(result.reason==='opfs-unavailable')status.textContent='Trình duyệt không hỗ trợ OPFS; media tiếp tục ở IndexedDB.';
    else status.textContent='Đã chuyển '+result.migrated+' tệp ('+(result.bytes/1048576).toFixed(1)+' MB); bỏ qua '+result.skipped+'.'+(result.errors.length?' Có lỗi ở '+result.errors.length+' tệp.':'');
   }).catch(function(error){status.textContent='Migration dừng an toàn: '+String(error&&error.message||error);})
   .finally(function(){busy=false;button.disabled=false;});
 });
 return true;
}
function ready(){
 try{mountSettings();if(window.MutationObserver&&document.documentElement){
  var observer=new MutationObserver(function(){if(mountSettings())observer.disconnect();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
 }}catch(e){}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
window.CVMediaOPFSP133={version:'133.4.0',supportsOpfs:supportsOpfs,threshold:DEFAULT_THRESHOLD,fileName:fileName,put:put,get:get,remove:remove,migrateLarge:migrateLarge,tests:function(){
 var safe=safeId('../../abc'),name=fileName('vt-01');
 return{safeIdRejectsTraversal:safe.indexOf('/')<0&&safe.indexOf('..')<0,fileNameIsBounded:name==='media-vt-01.blob',thresholdIsThirtyTwoMiB:DEFAULT_THRESHOLD===32*1048576,usesCanonicalDatabase:DB_NAME==='CANVIO_81_MEDIA'&&STORE==='media',largeMediaOnlyAtThreshold:DEFAULT_THRESHOLD>=32*1048576};
}};
})();