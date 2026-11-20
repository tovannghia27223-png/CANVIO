/* P127.7 · Ducking nhạc theo phụ đề, dùng timeline và volumeEnvelope hiện hữu. */
(function () {
'use strict';
if (window.CVDuckSubP127) return;
var DEF={depthDb:-12,attack:.25,release:.5,pad:.1},MAX_POINTS=64,MAX_INTERVALS=15;
function clamp(v,d,a,b){v=Number(v);if(!isFinite(v))v=d;return Math.max(a,Math.min(b,v));}
function options(o){o=o||{};return {depthDb:clamp(o.depthDb,DEF.depthDb,-36,-3),attack:clamp(o.attack,DEF.attack,.05,1),release:clamp(o.release,DEF.release,.05,2),pad:clamp(o.pad,DEF.pad,0,1)};}
function cuesFromClips(clips){
 var d=window.CVDirectorP127;
 if(d&&typeof d.cuesFromClips==='function')return d.cuesFromClips(clips);
 return (Array.isArray(clips)?clips:[]).filter(function(c){return c&&c.type==='text'&&Number(c.track)===3&&String(c.text||'').trim()&&Number(c.duration)>0&&isFinite(Number(c.start));})
 .map(function(c){return {start:Number(c.start),end:Number(c.start)+Number(c.duration)};}).sort(function(a,b){return a.start-b.start;});
}
function intervals(cues,target,o){
 var start=Number(target.start)||0,duration=Math.max(.2,Number(target.duration)||.2),a=[];
 (cues||[]).forEach(function(c){var x=Math.max(0,Number(c.start)-start-o.pad),y=Math.min(duration,Number(c.end)-start+o.pad);if(y-x>.01)a.push({a:x,b:y});});
 a.sort(function(x,y){return x.a-y.a;});var out=[],gap=o.attack+o.release;
 a.forEach(function(x){var last=out[out.length-1];if(last&&x.a-last.b<gap)last.b=Math.max(last.b,x.b);else out.push({a:x.a,b:x.b});});
 while(out.length>MAX_INTERVALS){var at=0,best=Infinity;for(var i=0;i<out.length-1;i++){var g=out[i+1].a-out[i].b;if(g<best){best=g;at=i;}}out[at].b=out[at+1].b;out.splice(at+1,1);}
 return out;
}
function envelope(cues,target,opts){
 var o=options(opts),duration=Math.max(.2,Number(target&&target.duration)||.2),duck=Math.pow(10,o.depthDb/20),iv=intervals(cues,target||{},o);
 if(!iv.length)return {points:[],intervals:0,duck:duck};
 var raw=[];iv.forEach(function(x){raw.push({t:x.a-o.attack,v:1},{t:x.a,v:duck},{t:x.b,v:duck},{t:x.b+o.release,v:1});});
 var first=raw[0],last=raw[raw.length-1],points=[{t:0,v:first.t<0?1-(1-duck)*Math.min(1,-first.t/o.attack):1}];
 raw.forEach(function(p){if(p.t>0&&p.t<duration)points.push(p);});
 points.push({t:duration,v:last.t>duration?1-(1-duck)*Math.min(1,(last.t-duration)/o.release):1});
 var clean=[];points.forEach(function(p){var q={t:Math.round(Math.max(0,Math.min(duration,p.t))*1000)/1000,v:Math.round(Math.max(0,Math.min(1,p.v))*10000)/10000},prev=clean[clean.length-1];if(prev&&q.t<=prev.t)clean[clean.length-1]=q;else clean.push(q);});
 if(clean.length>MAX_POINTS){var sampled=[clean[0]];for(var j=1;j<MAX_POINTS-1;j++)sampled.push(clean[Math.round(j*(clean.length-1)/(MAX_POINTS-1))]);sampled.push(clean[clean.length-1]);clean=sampled;}
 return {points:clean,intervals:iv.length,duck:duck};
}
function preview(video,targetId,opts){
 var st=video&&video._state&&video._state();if(!st||!Array.isArray(st.clips))return {ok:false,msg:'Mở Video Engine trước.'};
 var target=st.clips.find(function(c){return c&&c.id===targetId&&c.type==='audio';});if(!target)return {ok:false,msg:'Chọn clip nhạc (audio) cần hạ âm lượng.'};
 var cues=cuesFromClips(st.clips);if(!cues.length)return {ok:false,msg:'Chưa có phụ đề ở track chữ. Chạy Whisper hoặc nhập SRT trước.'};
 var env=envelope(cues,target,opts);if(!env.points.length)return {ok:false,msg:'Không có phụ đề nằm trong clip nhạc đã chọn.'};
 return {ok:true,target:target,env:env,cueCount:cues.length};
}
function apply(video,targetId,opts){
 var p=preview(video,targetId,opts);if(!p.ok)return p;
 if(video.isClipLocked&&video.isClipLocked(p.target))return {ok:false,msg:'Clip nhạc hoặc track đang khóa.'};
 var old=p.target.volumeEnvelope,pushed=false;
 try{if(video._pro&&video._pro.pushUndo){video._pro.pushUndo();pushed=true;}p.target.volumeEnvelope=p.env.points;video.commit();return {ok:true,intervals:p.env.intervals,points:p.env.points.length,msg:'Đã áp dụng ducking theo '+p.env.intervals+' đoạn phụ đề. Có thể Hoàn tác.'};}
 catch(e){if(old===undefined)delete p.target.volumeEnvelope;else p.target.volumeEnvelope=old;if(pushed&&video.undo)try{video.undo();}catch(_){}return {ok:false,msg:'Không lưu được; envelope trước đã được khôi phục.'};}
}
function mount(){
 var page=document.querySelector('#page-videoEngine');if(!page||page.querySelector('#cv127-duck'))return false;
 var anchor=page.querySelector('#cv127-director')||page.querySelector('#cv127-quality')||page.querySelector('#cv127-edit-plan');if(!anchor)return false;
 var card=document.createElement('section');card.id='cv127-duck';card.className='card';card.style.marginTop='12px';
 card.innerHTML='<div class="cardTop"><div><h3>Hạ nhạc theo lời thoại · P127.7</h3><span class="sub">Tự hạ nhạc khi có phụ đề, trả âm lượng khi hết lời</span></div><span class="badgeSoft">CÓ HOÀN TÁC</span></div><p class="tiny">Dựa trên phụ đề track chữ 3 (Whisper/SRT). Chỉ ghi volume envelope lên clip audio đang chọn.</p><div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><label class="tiny">Clip nhạc <select id="cv127k-target" class="input" aria-label="Clip nhạc"></select></label><label class="tiny">Hạ <input id="cv127k-depth" type="number" class="input" value="12" min="3" max="36" style="width:58px"> dB</label><label class="tiny">Hạ dần <input id="cv127k-att" type="number" class="input" value=".25" min=".05" max="1" step=".05" style="width:64px"> s</label><label class="tiny">Trả lại <input id="cv127k-rel" type="number" class="input" value=".5" min=".05" max="2" step=".05" style="width:64px"> s</label></div><div class="row" style="margin-top:8px;gap:8px"><button type="button" class="btn btn-soft sm" id="cv127k-prev">Xem trước</button><button type="button" class="btn btn-primary sm" id="cv127k-run" disabled>Áp dụng</button><button type="button" class="btn btn-ghost sm" id="cv127k-undo">Hoàn tác</button></div><div id="cv127k-status" class="tiny" role="status" aria-live="polite" style="margin-top:8px">Chưa xem trước.</div>';
 anchor.insertAdjacentElement('afterend',card);
 var $=function(q){return card.querySelector(q);},sel=$('#cv127k-target'),run=$('#cv127k-run'),status=$('#cv127k-status');
 function engine(){return window.CV&&CV.engines&&CV.engines.video;}
 function opts(){return {depthDb:-Math.abs(Number($('#cv127k-depth').value)||12),attack:$('#cv127k-att').value,release:$('#cv127k-rel').value};}
 function fill(){var v=engine(),st=v&&v._state&&v._state(),keep=sel.value;sel.textContent='';var list=st&&Array.isArray(st.clips)?st.clips.filter(function(c){return c&&c.type==='audio';}):[];if(!list.length){var z=document.createElement('option');z.value='';z.textContent='Chưa có clip audio';sel.appendChild(z);return;}list.forEach(function(c){var o=document.createElement('option');o.value=c.id;o.textContent=String(c.name||'Audio').slice(0,36)+' · '+(Number(c.start)||0).toFixed(1)+'s';sel.appendChild(o);});if(list.some(function(c){return c.id===keep;}))sel.value=keep;}
 fill();sel.addEventListener('focus',fill);
 $('#cv127k-prev').addEventListener('click',function(){fill();var p=preview(engine(),sel.value,opts());run.disabled=!p.ok;status.textContent=p.ok?'Sẽ duck '+p.env.intervals+' đoạn từ '+p.cueCount+' phụ đề, '+p.env.points.length+' điểm envelope.':p.msg;});
 run.addEventListener('click',function(){var r=apply(engine(),sel.value,opts());status.textContent=r.msg;run.disabled=true;});
 $('#cv127k-undo').addEventListener('click',function(){var v=engine();if(v&&v.undo){v.undo();status.textContent='Đã gửi lệnh hoàn tác.';}else status.textContent='Không có API hoàn tác.';});
 return true;
}
function ready(){try{mount();var p=document.querySelector('#page-videoEngine');if(p&&!p.__cv127kObserver&&window.MutationObserver){p.__cv127kObserver=new MutationObserver(mount);p.__cv127kObserver.observe(p,{childList:true,subtree:true});}}catch(e){if(window.console)console.error('P127.7 init:',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){
 var target={start:0,duration:20},cues=[{start:2,end:4},{start:4.3,end:5},{start:10,end:12}],e=envelope(cues,target,{depthDb:-12}),v=function(t){var p=e.points;for(var i=1;i<p.length;i++)if(t<=p[i].t){var a=p[i-1],b=p[i],w=(t-a.t)/(b.t-a.t);return a.v+(b.v-a.v)*w;}return p[p.length-1].v;};
 var many=[];for(var j=0;j<80;j++)many.push({start:j*.2,end:j*.2+.1});var big=envelope(many,target,{});
 function fake(clips,fail){var st={clips:clips},x={_state:function(){return st;},isClipLocked:function(c){return !!c.locked;},_pro:{pushUndo:function(){}},commit:function(){if(fail)throw Error('fail');},undo:function(){}};return x;}
 var clips=[{id:'t',type:'text',track:3,start:2,duration:2,text:'hello'},{id:'m',type:'audio',start:0,duration:20}],f=fake(clips),r=apply(f,'m',{});
 var old=[{t:0,v:.5}],bad=fake([{id:'t',type:'text',track:3,start:2,duration:2,text:'hello'},{id:'m',type:'audio',start:0,duration:20,volumeEnvelope:old}],true),rb=apply(bad,'m',{});
 return {mergedIntervals:e.intervals===2,duckDepth:Math.abs(v(3)-Math.pow(10,-12/20))<.002,fullLevelBetween:Math.abs(v(8)-1)<.001,pointCap:big.points.length<=MAX_POINTS,monotonic:e.points.every(function(p,i,a){return !i||p.t>a[i-1].t;}),writesCanonicalEnvelope:r.ok&&Array.isArray(clips[1].volumeEnvelope),rollback:!rb.ok&&bad._state().clips[1].volumeEnvelope===old};
}
window.CVDuckSubP127={version:'127.7.0',cuesFromClips:cuesFromClips,envelope:envelope,preview:preview,apply:apply,mount:mount,tests:tests};
})();
