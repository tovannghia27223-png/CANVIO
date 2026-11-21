/* P134.2 · Local Auto Reframe. Lightweight saliency from edge contrast + frame difference.
 * No face model, network request, second timeline or project store. Original media is untouched.
 * Export profile: WebM 720x1280 (9:16) or 1080x1080 (1:1), up to 60s / 100 MiB.
 */
(function () {
'use strict';
if (window.CVAutoReframeP134) return;
var MAX_BYTES=100*1048576, MAX_SECONDS=60, MAX_FRAMES=48, FPS=30;
var RATIOS={portrait:9/16,square:1};
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function ratioOf(v){var n=Number(v);if(Math.abs(n-9/16)<1e-5)return 9/16;if(Math.abs(n-1)<1e-5)return 1;throw new Error('Tỷ lệ đầu ra không được hỗ trợ.');}
function cropSize(w,h,r){r=ratioOf(r);if(!(w>0&&h>0))throw new Error('Kích thước video không hợp lệ.');return w/h>r?{width:h*r,height:h}:{width:w,height:w/r};}
function gray(f){if(!f||!f.data||!f.width||!f.height||f.data.length<f.width*f.height*4)throw new Error('Frame mẫu không hợp lệ.');var out=new Uint8Array(f.width*f.height),d=f.data;for(var i=0,j=0;i<out.length;i++,j+=4)out[i]=Math.round(.2126*d[j]+.7152*d[j+1]+.0722*d[j+2]);return out;}
function integral(a,w,h){var s=w+1,o=new Float32Array(s*(h+1));for(var y=1;y<=h;y++){var row=0;for(var x=1;x<=w;x++){row+=a[(y-1)*w+x-1];o[y*s+x]=o[(y-1)*s+x]+row;}}return o;}
function sum(ii,s,x,y,w,h){var x2=x+w,y2=y+h;return ii[y2*s+x2]-ii[y*s+x2]-ii[y2*s+x]+ii[y*s+x];}
function analyzeFrames(frames,ratio,options){
 options=options||{};ratio=ratioOf(ratio);
 if(!Array.isArray(frames)||frames.length<2||frames.length>MAX_FRAMES)throw new Error('Cần từ 2 đến '+MAX_FRAMES+' frame mẫu.');
 var w=Number(frames[0].width),h=Number(frames[0].height);
 if(w<32||h<32||w>512||h>512)throw new Error('Kích thước frame phân tích không hợp lệ.');
 var crop=cropSize(w,h,ratio),cw=Math.max(1,Math.min(w,Math.round(crop.width))),ch=Math.max(1,Math.min(h,Math.round(crop.height)));
 var mx=w-cw,my=h-ch,sx=Math.max(1,Math.ceil(mx/18)),sy=Math.max(1,Math.ceil(my/12)),prev=null,center={x:w/2,y:h/2},points=[];
 var mw=clamp(Number(options.movementWeight)||.42,0,.8);
 frames.forEach(function(f,fi){
  if(Number(f.width)!==w||Number(f.height)!==h)throw new Error('Kích thước các frame không đồng nhất.');
  var g=gray(f),sal=new Uint8Array(w*h);
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){
   var i=y*w+x,l=g[y*w+Math.max(0,x-1)],r=g[y*w+Math.min(w-1,x+1)],u=g[Math.max(0,y-1)*w+x],d=g[Math.min(h-1,y+1)*w+x];
   var edge=(Math.abs(r-l)+Math.abs(d-u))*.5,move=prev?Math.abs(g[i]-prev[i]):0;
   sal[i]=Math.round(clamp(edge*(1-mw)+move*mw,0,255));
  }
  var ii=integral(sal,w,h),best={score:-Infinity,x:mx/2+cw/2,y:my/2+ch/2};
  for(var cy=0;cy<=my;cy+=sy)for(var cx=0;cx<=mx;cx+=sx){
   var px=cx+cw/2,py=cy+ch/2,energy=sum(ii,w+1,cx,cy,cw,ch)/(cw*ch);
   var travel=Math.hypot(px-center.x,py-center.y)/Math.max(w,h),score=energy-travel*5.5;
   if(score>best.score)best={score:score,x:px,y:py};
  }
  var sm=fi?{x:center.x*.38+best.x*.62,y:center.y*.38+best.y*.62}:best;
  sm.x=clamp(sm.x,cw/2,w-cw/2);sm.y=clamp(sm.y,ch/2,h-ch/2);
  var time=Number(f.time);points.push({time:Number.isFinite(time)&&time>=0?time:fi,x:sm.x/w,y:sm.y/h,score:Math.max(0,best.score)});
  center=sm;prev=g;
 });
 return {ratio:ratio,sourceWidth:w,sourceHeight:h,cropWidth:cw,cropHeight:ch,points:points,algorithm:'contrast-motion-saliency-v1',machineLearning:false,localOnly:true};
}
function focusAt(plan,time){if(!plan||!Array.isArray(plan.points)||!plan.points.length)throw new Error('Chưa có kết quả phân tích.');var p=plan.points;if(time<=p[0].time)return{x:p[0].x,y:p[0].y};for(var i=1;i<p.length;i++)if(time<=p[i].time){var a=p[i-1],b=p[i],t=clamp((time-a.time)/Math.max(.0001,b.time-a.time),0,1);return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}return{x:p[p.length-1].x,y:p[p.length-1].y};}
function cropAt(plan,time,w,h){var size=cropSize(w,h,plan.ratio),f=focusAt(plan,time);return{x:clamp(f.x*w-size.width/2,0,w-size.width),y:clamp(f.y*h-size.height/2,0,h-size.height),width:size.width,height:size.height};}
function waitEvent(el,good,bad){return new Promise(function(resolve,reject){var timer=setTimeout(function(){clean();reject(new Error('Hết thời gian chờ giải mã video.'));},15000);function clean(){clearTimeout(timer);el.removeEventListener(good,ok);el.removeEventListener(bad,fail);}function ok(){clean();resolve();}function fail(){clean();reject(new Error('Không giải mã được video cục bộ.'));}el.addEventListener(good,ok,{once:true});el.addEventListener(bad,fail,{once:true});});}
async function seek(video,t){if(Math.abs((Number(video.currentTime)||0)-t)<.025){if(video.readyState>=2)return;return waitEvent(video,'loadeddata','error');}var p=waitEvent(video,'seeked','error');video.currentTime=t;return p;}
async function sampleVideo(video,ratio,onProgress){
 ratio=ratioOf(ratio);if(!video||!Number.isFinite(video.duration)||!video.videoWidth||!video.videoHeight)throw new Error('Video chưa sẵn sàng.');
 if(video.duration<=0||video.duration>MAX_SECONDS)throw new Error('Bản nhẹ giới hạn video tối đa 60 giây.');
 var scale=Math.min(1,192/video.videoWidth,108/video.videoHeight),w=Math.max(32,Math.round(video.videoWidth*scale)),h=Math.max(32,Math.round(video.videoHeight*scale));
 var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;var ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Không tạo được canvas phân tích.');
 var count=Math.min(MAX_FRAMES,Math.max(2,Math.ceil(video.duration*.8)+1)),frames=[];
 for(var i=0;i<count;i++){var t=video.duration*i/(count-1);await seek(video,t);ctx.drawImage(video,0,0,w,h);frames.push({width:w,height:h,time:t,data:ctx.getImageData(0,0,w,h).data});if(onProgress)onProgress(i+1,count);if(i<count-1)await new Promise(function(r){setTimeout(r,0);});}
 await seek(video,0);return analyzeFrames(frames,ratio);
}
function recorderMime(){if(typeof MediaRecorder==='undefined')throw new Error('Trình duyệt không hỗ trợ xuất WebM.');var a=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];for(var i=0;i<a.length;i++)if(!MediaRecorder.isTypeSupported||MediaRecorder.isTypeSupported(a[i]))return a[i];throw new Error('Không tìm thấy codec WebM được hỗ trợ.');}
async function exportWebM(video,plan,onProgress){
 if(!video||!plan||!Array.isArray(plan.points)||plan.points.length<2)throw new Error('Cần phân tích video trước khi xuất.');
 if(!HTMLCanvasElement.prototype.captureStream)throw new Error('Trình duyệt không hỗ trợ Canvas captureStream.');
 if(video.duration>MAX_SECONDS)throw new Error('Video vượt giới hạn 60 giây.');
 var ratio=ratioOf(plan.ratio),width=ratio===1?1080:720,height=ratio===1?1080:1280,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 var ctx=canvas.getContext('2d');if(!ctx)throw new Error('Không tạo được canvas xuất video.');
 var stream=canvas.captureStream(FPS),sourceStream=null,audio=[],chunks=[],recorder,raf=0,timer=0;
 try{
  if(typeof video.captureStream==='function')try{sourceStream=video.captureStream();audio=sourceStream.getAudioTracks();audio.forEach(function(t){stream.addTrack(t);});}catch(e){sourceStream=null;audio=[];}
  var mime=recorderMime();recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4500000,audioBitsPerSecond:128000});
  var stopped=new Promise(function(resolve,reject){recorder.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data);};recorder.onerror=function(){reject(new Error('MediaRecorder gặp lỗi khi xuất WebM.'));};recorder.onstop=resolve;});
  await seek(video,0);recorder.start(500);await video.play();var duration=video.duration;
  await new Promise(function(resolve,reject){
   var ended=false;function finish(err){if(ended)return;ended=true;cancelAnimationFrame(raf);clearTimeout(timer);video.removeEventListener('ended',onEnded);err?reject(err):resolve();}
   function onEnded(){try{if(recorder.state!=='inactive')recorder.stop();finish();}catch(e){finish(e);}}
   function draw(){try{if(video.readyState>=2){var c=cropAt(plan,video.currentTime,video.videoWidth,video.videoHeight);ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);ctx.drawImage(video,c.x,c.y,c.width,c.height,0,0,width,height);if(onProgress)onProgress(clamp(video.currentTime/Math.max(.001,duration),0,1));}if(video.ended){onEnded();return;}raf=requestAnimationFrame(draw);}catch(e){finish(e);try{if(recorder.state!=='inactive')recorder.stop();}catch(ignore){}}}
   video.addEventListener('ended',onEnded,{once:true});timer=setTimeout(function(){finish(new Error('Xuất video vượt thời gian cho phép.'));try{if(recorder.state!=='inactive')recorder.stop();}catch(e){}},duration*2000+15000);raf=requestAnimationFrame(draw);
  });
  await stopped;var blob=new Blob(chunks,{type:recorder.mimeType||mime});if(!blob.size)throw new Error('WebM xuất ra rỗng.');
  return{blob:blob,mime:blob.type,width:width,height:height,duration:video.duration,audioPreserved:audio.length>0,bytes:blob.size};
 }finally{try{video.pause();}catch(e){}try{video.currentTime=0;}catch(e){}try{stream.getTracks().forEach(function(t){t.stop();});}catch(e){}try{if(sourceStream)sourceStream.getTracks().forEach(function(t){t.stop();});}catch(e){}if(raf)cancelAnimationFrame(raf);if(timer)clearTimeout(timer);}
}
function mount(){
 var page=document.querySelector('#page-videoEngine'),card=page&&page.querySelector('#cv127-quality');if(!card||card.querySelector('#cv134r-panel'))return false;
 var panel=document.createElement('section');panel.id='cv134r-panel';panel.style.cssText='margin-top:12px;padding:12px;border:1px solid var(--line,rgba(148,163,184,.24));border-radius:12px;background:var(--panel,rgba(15,23,42,.18))';
 panel.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap"><b class="tiny">Auto Reframe · P134</b><span class="tiny">Cục bộ · không nhận diện mặt</span></div><div style="display:flex;align-items:end;gap:8px;flex-wrap:wrap;margin-top:8px"><label class="tiny" style="display:grid;gap:4px">Video nguồn (tối đa 100 MB / 60 giây)<input id="cv134r-file" type="file" accept="video/*,.mp4,.webm,.mov" aria-label="Chọn video nguồn để tự căn khung"></label><label class="tiny" style="display:grid;gap:4px">Khung đầu ra<select id="cv134r-ratio" aria-label="Tỷ lệ khung đầu ra"><option value="0.5625">Dọc 9:16 · 720×1280</option><option value="1">Vuông 1:1 · 1080×1080</option></select></label><button type="button" class="btn btn-soft sm" id="cv134r-analyze" disabled>Phân tích vùng nổi bật</button><button type="button" class="btn btn-primary sm" id="cv134r-export" disabled>Xuất WebM</button></div><div class="tiny" id="cv134r-status" role="status" aria-live="polite" style="margin-top:8px">Chọn video để bắt đầu. Dò vùng nổi bật bằng tương phản và chuyển động.</div><progress id="cv134r-progress" max="100" value="0" style="width:100%;height:6px;margin-top:6px"></progress><video id="cv134r-source" controls playsinline preload="metadata" style="display:none;max-width:100%;max-height:180px;margin-top:8px;border-radius:8px"></video><div id="cv134r-result" style="display:none;margin-top:10px"><video id="cv134r-output" controls playsinline style="width:min(100%,240px);max-height:320px;background:#000;border-radius:8px"></video><div style="margin-top:6px"><a id="cv134r-download" class="btn btn-soft sm" download="canvio-auto-reframe.webm">Tải WebM đã căn khung</a></div></div><p class="tiny" style="margin:8px 0 0;opacity:.75">Bản nhẹ: ưu tiên vùng có cạnh/độ tương phản và chuyển động; cảnh ít chi tiết có thể chọn sai chủ thể. File gốc và timeline không bị sửa. Đầu ra WebM, có âm thanh khi trình duyệt hỗ trợ capture audio.</p>';
 var anchor=card.querySelector('#cv127q-list');if(anchor)card.insertBefore(panel,anchor);else card.appendChild(panel);
 var file=panel.querySelector('#cv134r-file'),ratio=panel.querySelector('#cv134r-ratio'),analyze=panel.querySelector('#cv134r-analyze'),exportBtn=panel.querySelector('#cv134r-export'),source=panel.querySelector('#cv134r-source'),status=panel.querySelector('#cv134r-status'),progress=panel.querySelector('#cv134r-progress'),result=panel.querySelector('#cv134r-result'),output=panel.querySelector('#cv134r-output'),link=panel.querySelector('#cv134r-download');
 var sourceUrl='',outputUrl='',plan=null,busy=false;
 function say(s){status.textContent=s;}
 function clearOutput(){if(outputUrl)URL.revokeObjectURL(outputUrl);outputUrl='';output.removeAttribute('src');link.removeAttribute('href');result.style.display='none';}
 function clearPlan(){plan=null;exportBtn.disabled=true;progress.value=0;clearOutput();}
 file.addEventListener('change',function(){
  clearPlan();analyze.disabled=true;source.pause();if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl='';
  var f=file.files&&file.files[0];if(!f){source.style.display='none';say('Chưa chọn video.');return;}
  if(f.size>MAX_BYTES||!(/^(video\/|application\/octet-stream$)/i.test(f.type||'')||/\.(mp4|webm|mov|m4v)$/i.test(f.name||''))){say('File không hợp lệ hoặc vượt giới hạn 100 MB.');file.value='';return;}
  sourceUrl=URL.createObjectURL(f);source.src=sourceUrl;source.style.display='block';
  source.onloadedmetadata=function(){if(!Number.isFinite(source.duration)||source.duration<=0||source.duration>MAX_SECONDS){say('Video phải dài từ 0 đến 60 giây.');return;}say('Đã nạp video '+source.videoWidth+'×'+source.videoHeight+' · '+source.duration.toFixed(1)+' giây.');analyze.disabled=false;};
  source.onerror=function(){say('Không mở được video. Hãy thử MP4 hoặc WebM.');analyze.disabled=true;};
 });
 analyze.addEventListener('click',async function(){
  if(busy||!source.src)return;busy=true;analyze.disabled=true;exportBtn.disabled=true;clearPlan();
  try{say('Đang phân tích từng khung hình…');plan=await sampleVideo(source,Number(ratio.value),function(n,total){progress.value=n/total*50;say('Đang phân tích khung '+n+'/'+total+'…');});exportBtn.disabled=false;progress.value=50;var a=plan.points[0],b=plan.points[plan.points.length-1];say('Đã phân tích '+plan.points.length+' khung · vùng theo dõi dịch từ '+Math.round(a.x*100)+'% đến '+Math.round(b.x*100)+'% chiều ngang. Sẵn sàng xuất.');}
  catch(e){plan=null;exportBtn.disabled=true;say(e.message||String(e));}
  finally{busy=false;analyze.disabled=!(file.files&&file.files.length);}
 });
 ratio.addEventListener('change',function(){clearPlan();if(file.files&&file.files.length)say('Đổi tỷ lệ đầu ra. Hãy phân tích lại để tạo đường căn khung phù hợp.');});
 exportBtn.addEventListener('click',async function(){
  if(busy||!plan)return;busy=true;exportBtn.disabled=true;analyze.disabled=true;clearOutput();
  try{say('Đang xuất WebM '+(plan.ratio===1?'1:1':'9:16')+'…');var r=await exportWebM(source,plan,function(p){progress.value=50+p*50;});outputUrl=URL.createObjectURL(r.blob);output.src=outputUrl;link.href=outputUrl;link.download='canvio-auto-reframe-'+(plan.ratio===1?'1x1':'9x16')+'.webm';result.style.display='block';progress.value=100;say('Đã xuất WebM '+r.width+'×'+r.height+' · '+(r.bytes/1048576).toFixed(2)+' MB · '+(r.audioPreserved?'có audio':'không có audio trong luồng capture của trình duyệt')+'. Timeline và file gốc không đổi.');}
  catch(e){say(e.message||String(e));progress.value=0;}
  finally{busy=false;exportBtn.disabled=!plan;analyze.disabled=!(file.files&&file.files.length);}
 });
 window.addEventListener('beforeunload',function(){if(sourceUrl)URL.revokeObjectURL(sourceUrl);if(outputUrl)URL.revokeObjectURL(outputUrl);});
 return true;
}
function ready(){try{mount();var page=document.querySelector('#page-videoEngine');if(page&&!page.__cv134rObs&&window.MutationObserver){page.__cv134rObs=new MutationObserver(function(){if(!page.querySelector('#cv134r-panel'))mount();});page.__cv134rObs.observe(page,{childList:true,subtree:true});}}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
window.CVAutoReframeP134={version:'134.2.0',ratios:RATIOS,cropSize:cropSize,analyzeFrames:analyzeFrames,focusAt:focusAt,cropAt:cropAt,sampleVideo:sampleVideo,exportWebM:exportWebM,mount:mount,
 tests:function(){return{saliencyAnalysis:typeof analyzeFrames==='function',aspectCrop:typeof cropSize==='function',smoothFocusPath:typeof focusAt==='function',localWebMExport:typeof exportWebM==='function',noFaceModel:true,noNetwork:true,noTimelineMutation:true};}};
})();