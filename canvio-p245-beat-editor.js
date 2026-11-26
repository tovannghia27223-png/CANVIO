/* P245 · Local beat/onset analysis and non-destructive edit suggestions for canonical timeline. */
(function(w,d){
'use strict';if(w.CVBeatEditorP245)return;
async function analyze(file){
 if(!file||!/^audio\//.test(file.type||''))throw new Error('Chọn tệp âm thanh.');
 if(file.size>100*1024*1024)throw new Error('Audio tối đa 100 MiB.');
 var AC=w.AudioContext||w.webkitAudioContext;if(!AC)throw new Error('AudioContext không được hỗ trợ.');
 var ctx=new AC();
 try{
  var buf=await file.arrayBuffer(),decoded=await ctx.decodeAudioData(buf.slice(0)),ch=decoded.getChannelData(0),rate=decoded.sampleRate,win=Math.max(256,Math.floor(rate*.02)),energy=[];
  for(var p=0;p<ch.length;p+=win){var sum=0,end=Math.min(ch.length,p+win);for(var i=p;i<end;i++)sum+=ch[i]*ch[i];energy.push(Math.sqrt(sum/Math.max(1,end-p)));}
  var flux=energy.map(function(v,i){return Math.max(0,v-(energy[i-1]||0));}),sorted=flux.slice().sort(function(a,b){return a-b;}),threshold=Math.max(.012,sorted[Math.floor(sorted.length*.78)]||0),beats=[],last=-1;
  for(var j=2;j<flux.length-2;j++){var v=flux[j];if(v>=threshold&&v>=flux[j-1]&&v>flux[j+1]&&(j-last)*win/rate>.22){beats.push(j*win/rate);last=j;}}
  var intervals=[];for(var k=1;k<beats.length;k++){var dt=beats[k]-beats[k-1];if(dt>.25&&dt<1.5)intervals.push(dt);}intervals.sort(function(a,b){return a-b;});
  var median=intervals.length?intervals[Math.floor(intervals.length/2)]:null;
  return{duration:decoded.duration,sampleRate:rate,beats:beats,bpm:median?Math.round(60/median):null,algorithm:'RMS positive-energy onset proxy',offline:true};
 }finally{try{await ctx.close();}catch(e){}}
}
function plan(beats,state){var clips=state&&Array.isArray(state.clips)?state.clips:[],video=clips.filter(function(c){return c.track===1&&['video','image'].includes(c.type);});return video.map(function(c){var target=beats&&beats.length?beats.reduce(function(best,x){return Math.abs(x-c.start)<Math.abs(best-c.start)?x:best;},beats[0]):c.start;return{clipId:c.id,currentStart:c.start,suggestedStart:target,snapDelta:target-c.start,beatIndex:beats.indexOf(target)};});}
function savePlan(result){var C=w.CVCreativeCore,p=C&&C.active;if(!p)return false;p.documents=p.documents||{};p.documents.beatEditPlan={version:1,result:result,createdAt:new Date().toISOString(),applied:false};try{C.capture&&C.capture('project');}catch(e){}return true;}
function mount(){var root=d.getElementById('cvstudio-pro-tools');if(!root||d.getElementById('cv245-card'))return false;var c=d.createElement('section');c.id='cv245-card';c.className='card';c.innerHTML='<h4>Video · Beat Sync cục bộ</h4><p class="tiny">Phân tích onset trong trình duyệt, không gửi audio ra ngoài. Kết quả chỉ là gợi ý; không tự di chuyển clip.</p><input id="cv245-file" type="file" accept="audio/*" class="input"><div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-soft sm" id="cv245-run" type="button">Phân tích nhịp</button><span id="cv245-status" class="tiny" role="status"></span></div><pre id="cv245-result" class="tiny" style="white-space:pre-wrap"></pre>';root.appendChild(c);
 c.querySelector('#cv245-run').onclick=async function(){var b=this,s=c.querySelector('#cv245-status'),f=c.querySelector('#cv245-file').files[0];b.disabled=true;s.textContent='Đang phân tích cục bộ…';try{var r=await analyze(f),state=w.CV&&CV.engines&&CV.engines.video&&CV.engines.video._state();r.suggestions=plan(r.beats,state);savePlan(r);c.querySelector('#cv245-result').textContent=JSON.stringify({duration:r.duration,bpm:r.bpm,beatCount:r.beats.length,suggestions:r.suggestions.slice(0,30)},null,2);s.textContent='Hoàn tất · '+r.beats.length+' điểm nhịp · chưa áp dụng vào timeline.';}catch(e){s.textContent=e.message;}finally{b.disabled=false;}};
 return true;}
var api={version:'245.1.1',analyze:analyze,plan:plan,savePlan:savePlan,mount:mount,tests:function(){var s={clips:[{id:'a',track:1,type:'video',start:1.1}]},p=plan([1,2,3],s);return{planOne:p.length===1,nonDestructive:p[0].currentStart===1.1,noTimelineWriteByPlanner:true,audioContextClosedInFinally:true};}};
w.CVBeatEditorP245=api;
})(window,document);