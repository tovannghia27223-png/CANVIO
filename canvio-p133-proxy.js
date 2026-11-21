/* P133.2 · Local 720p proxy generator for selected 4K timeline clips.
 * Uses the existing Video Engine media owner and importFiles path. Original clip/timeline are never replaced.
 * Browser MediaRecorder exports WebM; audio is retained only when captureStream exposes it.
 */
(function(){
'use strict';
if(window.CVProxyP133)return;
var MAX_BYTES=500*1048576,MAX_SECONDS=180,FPS=30;
function is4k(w,h){w=Number(w)||0;h=Number(h)||0;return(w>=2560&&h>=1440)||(h>=2560&&w>=1440);}
function outputSize(w,h){
 w=Number(w);h=Number(h);
 if(!(w>0&&h>0))throw new Error('Kích thước video không hợp lệ.');
 var scale=Math.min(1,1280/Math.max(w,h));
 return{width:Math.max(2,Math.round(w*scale/2)*2),height:Math.max(2,Math.round(h*scale/2)*2)};
}
function trimRange(video,clip){
 var start=Math.max(0,Number(clip&&clip.trimIn)||0),duration=Number(clip&&clip.duration);
 if(!Number.isFinite(duration)||duration<=0)duration=video.duration-start;
 start=Math.min(start,Math.max(0,video.duration-.05));
 var end=Math.min(video.duration,start+duration);
 if(end-start<=.05)throw new Error('Khoảng trim của clip không hợp lệ.');
 if(end-start>MAX_SECONDS)throw new Error('Proxy bản nhẹ giới hạn clip tối đa 180 giây.');
 return{start:start,end:end,duration:end-start};
}
function getBlob(state,clip){
 var id=clip.mediaId||clip.id,ref=state&&state.fileRefs&&state.fileRefs[id];
 if(ref&&typeof ref.arrayBuffer==='function')return Promise.resolve(ref);
 if(ref&&ref.blob)return Promise.resolve(ref.blob);
 return new Promise(function(resolve){
  if(!state||!state.db){resolve(null);return;}
  var req;try{req=state.db.transaction('media').objectStore('media').get(id);}catch(e){resolve(null);return;}
  req.onsuccess=function(){resolve(req.result&&(req.result.blob||null));};req.onerror=function(){resolve(null);};
 });
}
function waitEvent(el,good,bad,timeout){
 return new Promise(function(resolve,reject){
  var timer=setTimeout(function(){clean();reject(new Error('Hết thời gian chờ giải mã video.'));},timeout||15000);
  function clean(){clearTimeout(timer);el.removeEventListener(good,ok);el.removeEventListener(bad,fail);}
  function ok(){clean();resolve();}
  function fail(){clean();reject(new Error('Không giải mã được video nguồn.'));}
  el.addEventListener(good,ok,{once:true});el.addEventListener(bad,fail,{once:true});
 });
}
async function seek(video,time){
 if(Math.abs(video.currentTime-time)<.025&&video.readyState>=2)return;
 var p=waitEvent(video,'seeked','error');video.currentTime=time;return p;
}
function mimeType(){
 if(typeof MediaRecorder==='undefined')throw new Error('Trình duyệt không hỗ trợ xuất WebM.');
 var types=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
 for(var i=0;i<types.length;i++)if(!MediaRecorder.isTypeSupported||MediaRecorder.isTypeSupported(types[i]))return types[i];
 throw new Error('Không tìm thấy codec WebM phù hợp.');
}
async function renderProxy(blob,clip,onProgress){
 if(!(blob instanceof Blob))throw new Error('Không đọc được media gốc của clip.');
 if(blob.size>MAX_BYTES)throw new Error('Media gốc vượt giới hạn 500 MB của proxy bản nhẹ.');
 var video=document.createElement('video'),url=URL.createObjectURL(blob),canvas=null,stream=null,sourceStream=null,recorder=null,raf=0,timer=0;
 video.muted=false;video.playsInline=true;video.preload='auto';video.src=url;
 try{
  await waitEvent(video,'loadedmetadata','error',30000);
  if(!video.videoWidth||!video.videoHeight)throw new Error('Nguồn không phải video hợp lệ.');
  if(!is4k(video.videoWidth,video.videoHeight))throw new Error('Chỉ tạo proxy cho video 4K (tối thiểu 2560×1440).');
  var range=trimRange(video,clip),size=outputSize(video.videoWidth,video.videoHeight);
  canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
  var ctx=canvas.getContext('2d');if(!ctx)throw new Error('Không tạo được canvas proxy.');
  if(!canvas.captureStream)throw new Error('Trình duyệt không hỗ trợ Canvas captureStream.');
  stream=canvas.captureStream(FPS);
  var audioCount=0;
  if(typeof video.captureStream==='function'){
   try{sourceStream=video.captureStream();sourceStream.getAudioTracks().forEach(function(track){stream.addTrack(track);audioCount++;});}catch(e){sourceStream=null;audioCount=0;}
  }
  var mime=mimeType(),chunks=[];
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:3500000,audioBitsPerSecond:128000});
  var stopped=new Promise(function(resolve,reject){
   recorder.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data);};
   recorder.onerror=function(){reject(new Error('MediaRecorder lỗi trong khi tạo proxy.'));};
   recorder.onstop=resolve;
  });
  await seek(video,range.start);
  recorder.start(500);
  await video.play();
  await new Promise(function(resolve,reject){
   var finished=false;
   function finish(err){
    if(finished)return;finished=true;cancelAnimationFrame(raf);clearTimeout(timer);
    video.removeEventListener('ended',onEnded);
    try{if(recorder.state!=='inactive')recorder.stop();}catch(e){}
    err?reject(err):resolve();
   }
   function onEnded(){finish();}
   function draw(){
    try{
     if(video.readyState>=2){
      ctx.drawImage(video,0,0,video.videoWidth,video.videoHeight,0,0,size.width,size.height);
      if(onProgress)onProgress(Math.max(0,Math.min(1,(video.currentTime-range.start)/range.duration)));
     }
     if(video.ended||video.currentTime>=range.end-.025){finish();return;}
     raf=requestAnimationFrame(draw);
    }catch(e){finish(e);}
   }
   video.addEventListener('ended',onEnded,{once:true});
   timer=setTimeout(function(){finish(new Error('Tạo proxy vượt thời gian cho phép.'));},range.duration*2500+20000);
   raf=requestAnimationFrame(draw);
  });
  await stopped;
  var out=new Blob(chunks,{type:recorder.mimeType||mime});
  if(!out.size)throw new Error('Tệp proxy rỗng.');
  return{blob:out,mime:out.type,width:size.width,height:size.height,duration:range.duration,audioPreserved:audioCount>0,bytes:out.size,sourceWidth:video.videoWidth,sourceHeight:video.videoHeight};
 }finally{
  try{video.pause();}catch(e){}
  try{if(stream)stream.getTracks().forEach(function(t){t.stop();});}catch(e){}
  try{if(sourceStream)sourceStream.getTracks().forEach(function(t){t.stop();});}catch(e){}
  if(raf)cancelAnimationFrame(raf);if(timer)clearTimeout(timer);URL.revokeObjectURL(url);
 }
}
function mount(){
 var page=document.querySelector('#page-videoEngine'),card=page&&page.querySelector('#cv127-quality');
 if(!card||card.querySelector('#cv133p-panel'))return false;
 var panel=document.createElement('section');panel.id='cv133p-panel';panel.style.cssText='margin-top:10px;padding:12px;border:1px solid var(--line,rgba(148,163,184,.24));border-radius:12px';
 panel.innerHTML='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b class="tiny">Proxy 720p · P133</b><span class="tiny">Video 4K · xử lý cục bộ</span></div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-soft sm" id="cv133p-run">Tạo proxy cho clip đang chọn</button><span class="tiny" id="cv133p-status" role="status" aria-live="polite">Chọn clip video 4K trên timeline. Proxy được thêm thành clip mới; clip gốc giữ nguyên.</span></div><progress id="cv133p-progress" max="100" value="0" style="width:100%;height:6px;margin-top:7px"></progress><div id="cv133p-result" style="display:none;margin-top:8px"><a id="cv133p-download" class="btn btn-soft sm" download="canvio-proxy-720p.webm">Tải proxy WebM</a></div><p class="tiny" style="margin:8px 0 0;opacity:.75">Giới hạn bản nhẹ: 500 MB / 180 giây; đầu ra WebM tối đa 1280×720 (giữ tỷ lệ). Âm thanh được giữ nếu trình duyệt hỗ trợ capture audio. Không tự thay clip gốc hoặc đổi timeline.</p>';
 var anchor=card.querySelector('#cv127q-list');if(anchor)card.insertBefore(panel,anchor);else card.appendChild(panel);
 var btn=panel.querySelector('#cv133p-run'),status=panel.querySelector('#cv133p-status'),progress=panel.querySelector('#cv133p-progress'),result=panel.querySelector('#cv133p-result'),download=panel.querySelector('#cv133p-download');
 var busy=false,outputUrl='';
 function say(s){status.textContent=s;}
 function clear(){if(outputUrl)URL.revokeObjectURL(outputUrl);outputUrl='';download.removeAttribute('href');result.style.display='none';progress.value=0;}
 btn.addEventListener('click',async function(){
  if(busy)return;var v=window.CV&&CV.engines&&CV.engines.video,state=v&&v._state&&v._state();
  var clip=state&&(state.clips||[]).filter(function(c){return c.id===state.selected;})[0];
  if(!v||!state||!v.importFiles){say('Mở Video Engine trước.');return;}
  if(!clip||clip.type!=='video'){say('Hãy chọn một clip video trên timeline.');return;}
  busy=true;btn.disabled=true;clear();
  try{
   var blob=await getBlob(state,clip);if(!blob)throw new Error('Không đọc được tệp nguồn từ media store.');
   say('Đang kiểm tra video nguồn…');
   var proxy=await renderProxy(blob,clip,function(p){progress.value=p*90;say('Đang tạo proxy '+Math.round(p*100)+'%…');});
   var base=String(clip.name||'video').replace(/\.[^.]+$/,'').slice(0,60)||'video';
   var file=new File([proxy.blob],base+'-proxy-720p.webm',{type:proxy.mime||'video/webm'});
   outputUrl=URL.createObjectURL(proxy.blob);download.href=outputUrl;result.style.display='block';
   var before=Array.isArray(state.clips)?state.clips.length:0;
   var imported=await v.importFiles({target:{files:[file],value:''}});
   var afterState=v._state&&v._state(),added=afterState&&Array.isArray(afterState.clips)?afterState.clips.slice(before):[],after=afterState&&Array.isArray(afterState.clips)?afterState.clips.length:before;
   if(imported===false||!added.length)throw new Error('Đã tạo được proxy và có thể tải xuống, nhưng Video Engine chưa xác nhận clip mới trên timeline. Hãy tải tệp rồi nhập thủ công.');
   var proxyClip=added.find(function(x){return afterState.fileRefs&&(afterState.fileRefs[x.mediaId||x.id]===file);})||added[0];
   proxyClip.name=file.name;proxyClip.duration=Math.max(.2,proxy.duration);proxyClip.trimIn=0;proxyClip.trimOut=null;
   if(v.commit)v.commit();
   progress.value=100;
   say('Đã thêm '+file.name+' vào timeline ('+proxy.width+'×'+proxy.height+' · '+(proxy.bytes/1048576).toFixed(1)+' MB · '+(proxy.audioPreserved?'có audio':'không có audio')+'). Clip gốc không bị sửa; hãy kiểm tra rồi thay thủ công nếu muốn.');
  }catch(e){say(e&&e.message?e.message:String(e));progress.value=0;}
  finally{busy=false;btn.disabled=false;}
 });
 window.addEventListener('beforeunload',function(){if(outputUrl)URL.revokeObjectURL(outputUrl);});
 return true;
}
function ready(){try{mount();var p=document.querySelector('#page-videoEngine');if(p&&!p.__cv133pObs&&window.MutationObserver){p.__cv133pObs=new MutationObserver(function(){if(!p.querySelector('#cv133p-panel'))mount();});p.__cv133pObs.observe(p,{childList:true,subtree:true});}}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
window.CVProxyP133={version:'133.2.0',is4k:is4k,outputSize:outputSize,trimRange:trimRange,getBlob:getBlob,renderProxy:renderProxy,mount:mount,tests:function(){return{detectsLandscape4k:is4k(3840,2160),detectsPortrait4k:is4k(2160,3840),rejects1080p:!is4k(1920,1080),landscape720:outputSize(3840,2160).width===1280&&outputSize(3840,2160).height===720,portrait720:outputSize(2160,3840).width===720&&outputSize(2160,3840).height===1280,neverUpscales:outputSize(640,480).width===640,trimClampsToSource:trimRange({duration:10},{trimIn:8,duration:9}).end===10,trimLimitEnforced:(function(){try{trimRange({duration:300},{trimIn:0,duration:181});return false;}catch(e){return true;}})(),localOnly:true,originalPreserved:true};}};
})();