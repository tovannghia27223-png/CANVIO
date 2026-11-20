/* P127.2 — transcript-guided talking-head director. Reuses existing Whisper/SRT captions, motion keyframes and AutoCut. */
(function(){
'use strict';
if(window.CVCaptionDirectorP1272)return;
function clamp(v,lo,hi,d){v=Number(v);return Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):d;}
function cuesFrom(clips,clip){
 var start=Number(clip&&clip.start)||0,end=start+Math.max(.2,Number(clip&&clip.duration)||.2);
 return(Array.isArray(clips)?clips:[]).filter(function(c){
  return c&&c.type==='text'&&Number(c.track)===3&&String(c.text||'').trim()&&Number.isFinite(Number(c.start))&&Number(c.duration)>0;
 }).map(function(c){var a=Math.max(start,Number(c.start)),b=Math.min(end,Number(c.start)+Number(c.duration));return{id:String(c.id||''),start:a,end:b,duration:Math.max(0,b-a),text:String(c.text||'').slice(0,500)};})
 .filter(function(c){return c.end-c.start>=.12;}).sort(function(a,b){return a.start-b.start;}).slice(0,500);
}
function analyze(clips,clip,opts){
 opts=opts||{};if(!clip||clip.type!=='video'||!Number.isFinite(Number(clip.duration))||clip.duration<.2)return{ok:false,reason:'Chọn clip video talking-head trước.',cues:[],pauses:[]};
 var cues=cuesFrom(clips,clip),minPause=clamp(opts.minPause,.25,3,0.65),pauses=[];
 for(var i=1;i<cues.length;i++){
  var gap=cues[i].start-cues[i-1].end;
  if(gap>=minPause)pauses.push({start:cues[i-1].end,end:cues[i].start,duration:gap,fromCue:cues[i-1].id,toCue:cues[i].id});
 }
 return{ok:true,clipId:clip.id,cueCount:cues.length,pauses:pauses,minPause:minPause,coverage:cues.length?Math.round((cues.reduce(function(s,c){return s+c.duration;},0)/clip.duration)*1000)/10:0};
}
function pickCues(cues,max){
 var ranked=(Array.isArray(cues)?cues:[]).filter(function(c){return c&&c.duration>=.3;}).map(function(c){return{cue:c,score:Math.min(8,c.duration)+Math.min(2,String(c.text||'').length/80)};}).sort(function(a,b){return b.score-a.score;});
 var chosen=ranked.slice(0,max).map(function(x){return x.cue;}).sort(function(a,b){return a.start-b.start;});
 return chosen;
}
function buildMotion(clip,cues,opts,clean){
 opts=opts||{};if(!clip||clip.type!=='video'||!Number.isFinite(Number(clip.duration))||clip.duration<.2)return null;
 var base=clean?clean(clip.motion):((clip.motion&&typeof clip.motion==='object')?clip.motion:{});
 var from=base.from||{},to=base.to||{},baseScale=clamp(from.scale,0.05,5,1),toScale=clamp(to.scale,0.05,5,baseScale);
 var zoom=clamp(opts.zoom,1.03,1.4,1.14),span=clamp(opts.span,.15,.7,.32),selected=pickCues(cues,2),d=Number(clip.duration),start=Number(clip.start)||0;
 var frameBase={x:clamp(from.x,-4800,4800,0),y:clamp(from.y,-2700,2700,0),scale:baseScale,opacity:clamp(from.opacity,0,1,1),rotation:clamp(from.rotation,-3600,3600,0),color:from.color||null,easing:'ease-in-out'};
 var frames=[Object.assign({t:0},frameBase)];
 selected.forEach(function(c){
  var mid=(c.start+c.end)/2,half=Math.max(.08,Math.min(c.duration*.35,d*span/2)),a=clamp((mid-half-start)/d*100,0.5,99,0.5),b=clamp((mid-start)/d*100,1,99,50),z=clamp((mid+half-start)/d*100,1,99.5,99.5);
  if(a<=frames[frames.length-1].t+1.25)return;
  frames.push(Object.assign({t:a},frameBase));
  var punch=Object.assign({},frameBase,{t:b,scale:clamp(baseScale*zoom,.05,5,baseScale*zoom)});
  frames.push(punch);
  if(z>b+1)frames.push(Object.assign({t:z},frameBase));
 });
 if(frames.length===1)frames.push(Object.assign({t:100},frameBase));
 if(frames.length>7)frames=frames.slice(0,7);
 if(frames[frames.length-1].t<99.99)frames.push(Object.assign({t:100},frameBase));else frames[frames.length-1].t=100;
 if(frames.length>8)frames=frames.slice(0,8);
 var result={from:frames[0],to:frames[frames.length-1],keyframes:frames,easing:'ease-in-out'};
 return clean?clean(result):result;
}
function applyZoom(video,clipId,opts){
 var st=video&&video._state&&video._state(),clip=st&&Array.isArray(st.clips)&&st.clips.find(function(c){return c.id===clipId;});
 if(!clip||clip.type!=='video')return{ok:false,reason:'Không tìm thấy clip video đang chọn.'};
 if(video.isClipLocked&&video.isClipLocked(clip))return{ok:false,reason:'Clip hoặc track video đang khóa.'};
 var cues=cuesFrom(st.clips,clip);if(!cues.length)return{ok:false,reason:'Chưa có phụ đề Whisper/SRT nằm trong clip này.'};
 var motion=buildMotion(clip,cues,opts,video.cleanMotion);if(!motion||!motion.keyframes||motion.keyframes.length<2)return{ok:false,reason:'Không tạo được motion keyframes.'};
 var before=video.snapshotState?video.snapshotState():null,old=clip.motion;
 try{
  if(video._pro&&video._pro.pushUndo)video._pro.pushUndo();
  clip.motion=motion;video.commit();
  return{ok:true,cues:cues.length,keyframes:motion.keyframes.length,zoom:clamp(opts&&opts.zoom,1.03,1.4,1.14),msg:'Đã áp dụng punch-in theo mốc phụ đề. Có thể Hoàn tác.'};
 }catch(e){
  clip.motion=old;
  if(before&&video.restoreState)video.restoreState(before);
  return{ok:false,reason:'Không lưu được motion; dữ liệu trước đã được khôi phục.'};
 }
}
function autoCut(video,sourceId,opts){
 if(!video||typeof video.autoCut!=='function'||typeof video.select!=='function')return Promise.resolve({ok:false,reason:'Video Engine chưa sẵn sàng hoặc thiếu AutoCut.'});
 var st=video._state&&video._state(),src=st&&st.clips.find(function(c){return c.id===sourceId&&(c.type==='video'||c.type==='audio');});
 if(!src)return Promise.resolve({ok:false,reason:'Chọn clip video/audio có tiếng để phân tích khoảng lặng.'});
 if(video.isClipLocked&&video.isClipLocked(src))return Promise.resolve({ok:false,reason:'Clip nguồn hoặc track đang khóa.'});
 try{video.select(sourceId);return Promise.resolve(video.autoCut({thr:clamp(opts&&opts.threshold,-60,-10,-35),min:clamp(opts&&opts.minSilence,.2,5,.5),remove:true})).then(function(n){return{ok:Number(n)>0,cuts:Number(n)||0,reason:Number(n)>0?'Đã cắt theo khoảng lặng âm thanh. Có thể Hoàn tác.':'Không phát hiện khoảng lặng phù hợp; thử chỉnh ngưỡng hoặc độ dài tối thiểu.'};});}
 catch(e){return Promise.resolve({ok:false,reason:String(e&&e.message||e).slice(0,160)});}
}
function mount(){
 var page=document.querySelector('#page-videoEngine'),anchor=page&&page.querySelector('#cv127-quality');
 if(!page||!anchor||page.querySelector('#cv1272-director'))return false;
 var card=document.createElement('section');card.id='cv1272-director';card.className='card';card.style.marginTop='12px';
 card.innerHTML='<div class="cardTop"><div><h3>Talking-head Director · P127.2</h3><span class="sub">Whisper/SRT → Jump Cut → Punch-in Zoom</span></div><span class="badgeSoft">DÙNG TIMELINE HIỆN CÓ</span></div>'+
 '<p class="tiny">Dùng phụ đề trên track chữ 3 để phát hiện khoảng nghỉ và đặt zoom nhấn tại câu nói. Cắt khoảng lặng dựa trên phân tích âm thanh gốc của AutoCut; không tự suy đoán lời nói hoặc thay thế Whisper.</p>'+
 '<div class="row" style="gap:8px;align-items:end;flex-wrap:wrap"><label class="tiny">Clip hình <select class="input" id="cv1272-video" aria-label="Clip hình talking head"></select></label><label class="tiny">Khoảng nghỉ từ <input class="input" id="cv1272-pause" type="number" min=".25" max="3" step=".05" value=".65" style="width:70px"> s</label><button type="button" class="btn btn-soft sm" id="cv1272-analyze">Phân tích phụ đề</button></div>'+
 '<div class="row" style="gap:8px;align-items:end;flex-wrap:wrap;margin-top:8px"><label class="tiny">Punch-in <input class="input" id="cv1272-zoom" type="number" min="1.03" max="1.4" step=".01" value="1.14" style="width:72px">×</label><label class="tiny">Clip nguồn để cắt lặng <select class="input" id="cv1272-source" aria-label="Nguồn audio/video"></select></label><label class="tiny">Ngưỡng <input class="input" id="cv1272-threshold" type="number" min="-60" max="-10" value="-35" style="width:70px"> dB</label><label class="tiny">Lặng tối thiểu <input class="input" id="cv1272-min" type="number" min=".2" max="5" step=".1" value=".5" style="width:70px"> s</label></div>'+
 '<div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn btn-primary sm" id="cv1272-zoom-apply">Áp dụng Punch-in theo phụ đề</button><button type="button" class="btn btn-soft sm" id="cv1272-cut">Cắt &amp; dồn khoảng lặng</button><button type="button" class="btn btn-ghost sm" id="cv1272-undo">Hoàn tác</button></div>'+
 '<div class="tiny" id="cv1272-status" role="status" aria-live="polite" style="margin-top:9px">Chưa phân tích.</div><ul id="cv1272-pauses" class="tiny" style="padding-left:18px;margin-top:6px;display:grid;gap:4px"></ul>';
 anchor.insertAdjacentElement('afterend',card);
 var $=function(q){return card.querySelector(q);};
 function engine(){return window.CV&&CV.engines&&CV.engines.video;}
 function fill(){
  var v=engine(),st=v&&v._state&&v._state();if(!st)return;
  var vids=st.clips.filter(function(c){return c&&c.type==='video';}),srcs=st.clips.filter(function(c){return c&&(c.type==='video'||c.type==='audio');});
  function put(sel,list,keep){sel.replaceChildren();list.forEach(function(c){var o=document.createElement('option');o.value=c.id;o.textContent=String(c.name||c.type).slice(0,50)+' · '+Number(c.start||0).toFixed(1)+'s';sel.appendChild(o);});if(keep&&list.some(function(c){return c.id===keep;}))sel.value=keep;if(!list.length){var o=document.createElement('option');o.value='';o.textContent='Không có clip phù hợp';sel.appendChild(o);}}
  var vs=$('#cv1272-video'),ss=$('#cv1272-source'),vk=vs.value,sk=ss.value;put(vs,vids,vk);put(ss,srcs,sk);
 }
 function selected(){var v=engine(),st=v&&v._state&&v._state(),id=$('#cv1272-video').value;return st&&st.clips.find(function(c){return c.id===id;});}
 function analyzeNow(){
  fill();var v=engine(),st=v&&v._state&&v._state(),clip=selected(),r=analyze(st&&st.clips,clip,{minPause:$('#cv1272-pause').value}),ul=$('#cv1272-pauses');ul.replaceChildren();
  if(!r.ok){$('#cv1272-status').textContent=r.reason;return r;}
  if(!r.cueCount){$('#cv1272-status').textContent='Chưa có phụ đề Whisper/SRT trong clip này.';return r;}
  r.pauses.forEach(function(p,i){var li=document.createElement('li');li.textContent='Nghỉ '+(i+1)+': '+p.start.toFixed(2)+'–'+p.end.toFixed(2)+' s ('+p.duration.toFixed(2)+' s)';ul.appendChild(li);});
  $('#cv1272-status').textContent=r.cueCount+' cue phụ đề · phủ '+r.coverage+'% clip · '+r.pauses.length+' khoảng nghỉ đủ ngưỡng. Phân tích chỉ đọc timeline.';
  return r;
 }
 $('#cv1272-analyze').addEventListener('click',analyzeNow);
 $('#cv1272-zoom-apply').addEventListener('click',function(){
  var v=engine(),clip=selected();if(!v||!clip){$('#cv1272-status').textContent='Chọn clip video trước.';return;}
  var r=applyZoom(v,clip.id,{zoom:$('#cv1272-zoom').value});
  $('#cv1272-status').textContent=r.ok?r.msg:r.reason; 
 });
 $('#cv1272-cut').addEventListener('click',function(){
  var v=engine(),id=$('#cv1272-source').value,btn=this;if(!v||!id){$('#cv1272-status').textContent='Chọn clip audio/video trước.';return;}
  btn.disabled=true;$('#cv1272-status').textContent='Đang phân tích waveform…';
  autoCut(v,id,{threshold:$('#cv1272-threshold').value,minSilence:$('#cv1272-min').value}).then(function(r){$('#cv1272-status').textContent=r.ok?r.reason:r.reason;fill();}).catch(function(e){$('#cv1272-status').textContent=String(e&&e.message||e);}).finally(function(){btn.disabled=false;});
 });
 $('#cv1272-undo').addEventListener('click',function(){var v=engine();if(v&&v.undo)v.undo();$('#cv1272-status').textContent='Đã gửi lệnh Hoàn tác.';});
 fill();return true;
}
function ready(){try{mount();var p=document.querySelector('#page-videoEngine');if(p&&!p.__cv1272Obs&&window.MutationObserver){p.__cv1272Obs=new MutationObserver(function(){if(!p.querySelector('#cv1272-director'))mount();});p.__cv1272Obs.observe(p,{childList:true,subtree:true});}}catch(e){if(window.console)console.warn('P127.2 director',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){
 var clip={id:'v',type:'video',start:10,duration:20,motion:{from:{x:0,y:0,scale:1,opacity:1,rotation:0},to:{x:0,y:0,scale:1,opacity:1,rotation:0}}};
 var timeline=[{id:'c1',type:'text',track:3,start:11,duration:2,text:'Câu mở đầu'},{id:'c2',type:'text',track:3,start:13.8,duration:2.5,text:'Câu tiếp theo'},{id:'c3',type:'text',track:3,start:18,duration:2,text:'Kết luận'},{id:'audio',type:'audio',track:2,start:0,duration:40}];
 var r=analyze(timeline,clip,{minPause:.6}),z=buildMotion(clip,cuesFrom(timeline,clip),{zoom:1.16},function(x){return x||{from:{x:0,y:0,scale:1,opacity:1,rotation:0},to:{x:0,y:0,scale:1,opacity:1,rotation:0}};});
 var no=analyze(timeline,{id:'a',type:'image',start:0,duration:20},{});
 var bad=buildMotion({id:'bad',type:'audio',start:0,duration:10},[],{});
 return{readsOnlySubtitleTrack:r.ok&&r.cueCount===3,detectsPauseBetweenCues:r.pauses.length===2&&Math.abs(r.pauses[0].duration-.8)<.001,ignoresNonVideoTarget:!no.ok,zoomKeyframesBounded:!!z&&z.keyframes.length>=2&&z.keyframes.length<=8,zoomScaleIncreases:!!z&&z.keyframes.some(function(f){return f.scale>1.1;}),motionPlanDoesNotMutateSource:clip.motion.keyframes===undefined,invalidTargetRejected:bad===null,thresholdClamped:analyze(timeline,clip,{minPause:99}).pauses.length===0};
}
window.CVCaptionDirectorP1272={version:'127.2.1',cuesFrom:cuesFrom,analyze:analyze,buildMotion:buildMotion,applyZoom:applyZoom,autoCut:autoCut,mount:mount,tests:tests};
})();