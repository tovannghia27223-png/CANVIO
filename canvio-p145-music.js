/* P145.4 — deterministic local background music composer. Original synthesis only; no samples, network or licensed packs. */
(function(){
'use strict';
if(window.CVMusicComposerP1454)return;
var SR=44100,MOODS={
 calm:{label:'Thư thái',progressions:[[57,60,64,67],[53,57,60,64],[48,52,55,60],[55,59,62,67]],volume:0.75,percussion:false},
 corporate:{label:'Doanh nghiệp',progressions:[[48,52,55,59],[43,47,50,55],[45,48,52,57],[41,45,48,53]],volume:0.82,percussion:true},
 uplifting:{label:'Tích cực',progressions:[[53,57,60,64],[55,59,62,67],[52,55,59,64],[48,52,55,60]],volume:0.84,percussion:true},
 focus:{label:'Tập trung',progressions:[[45,48,52,55],[50,53,57,60],[55,59,62,65],[48,52,55,59]],volume:0.68,percussion:false}
};
function clamp(v,a,b,d){v=Number(v);return isFinite(v)?Math.max(a,Math.min(b,v)):d;}
function options(mood,input){input=input||{};return{mood:MOODS[mood]?mood:'corporate',bpm:Math.round(clamp(input.bpm,60,140,96)),bars:[4,8].indexOf(Number(input.bars))>=0?Number(input.bars):4,seed:Math.floor(clamp(input.seed,1,2147483647,17))};}
function plan(mood,input){
 var o=options(mood,input),dur=o.bars*4*60/o.bpm,chords=MOODS[o.mood].progressions;
 return{mood:o.mood,label:MOODS[o.mood].label,bpm:o.bpm,bars:o.bars,seed:o.seed,duration:dur,sampleRate:SR,progression:Array.from({length:o.bars},function(_,i){return chords[i%chords.length].slice();})};
}
function rng(seed){var s=(seed>>>0)||1;return function(){s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function hz(midi){return 440*Math.pow(2,(midi-69)/12);}
function tone(ctx,dest,freq,start,duration,peak,type,attack,release){
 var o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(freq,start);
 g.gain.setValueAtTime(0.0001,start);g.gain.linearRampToValueAtTime(peak,start+Math.min(attack,duration*.35));
 var end=Math.max(start+Math.min(attack,duration*.35),start+duration-release);g.gain.setValueAtTime(peak,end);g.gain.linearRampToValueAtTime(0.0001,start+duration);
 o.connect(g);g.connect(dest);o.start(start);o.stop(start+duration+.005);
}
function build(ctx,p){
 var master=ctx.createGain(),barSec=4*60/p.bpm,beat=60/p.bpm,random=rng(p.seed);
 master.gain.value=MOODS[p.mood].volume*.55;master.connect(ctx.destination);
 p.progression.forEach(function(chord,bar){
  var start=bar*barSec;
  chord.forEach(function(note,i){tone(ctx,master,hz(note),start,barSec,.028,i%2?'sine':'triangle',.45,.18);});
  tone(ctx,master,hz(chord[0]-12),start,Math.min(1.05,barSec*.75),.085,'sine',.025,.22);
  var seq=[0,1,2,3,2,1,2,3],offset=Math.floor(random()*4);
  for(var k=0;k<8;k++){var idx=(seq[k]+offset)%4,t=start+k*beat*.5+.015,note=chord[idx]+12+(k%4===3?12:0);tone(ctx,master,hz(note),t,Math.min(.24,beat*.42),.026,'triangle',.006,.17);}
  if(MOODS[p.mood].percussion){
   [0,2].forEach(function(b){var t=start+b*beat,o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(48,t+.13);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.095,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.19);o.connect(g);g.connect(master);o.start(t);o.stop(t+.2);});
  }
 });
 return master;
}
function normalize(data,peakDb){var peak=0;for(var i=0;i<data.length;i++)peak=Math.max(peak,Math.abs(data[i]));if(peak<1e-7)return new Float32Array(data);var gain=Math.pow(10,(peakDb==null?-1:peakDb)/20)/peak,out=new Float32Array(data.length);for(var j=0;j<data.length;j++)out[j]=Math.max(-1,Math.min(1,data[j]*gain));return out;}
function wav(data,sr){
 var n=data.length,b=new ArrayBuffer(44+n*2),v=new DataView(b);
 function str(at,s){for(var k=0;k<s.length;k++)v.setUint8(at+k,s.charCodeAt(k));}
 str(0,'RIFF');v.setUint32(4,36+n*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,n*2,true);
 for(var i=0;i<n;i++){var x=Math.max(-1,Math.min(1,data[i]));v.setInt16(44+i*2,x<0?x*32768:x*32767,true);}return new Uint8Array(b);
}
function render(mood,input){
 var p=plan(mood,input),AC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 if(!AC)return Promise.reject(new Error('Trình duyệt không hỗ trợ OfflineAudioContext.'));
 var frames=Math.ceil(p.duration*SR),ctx=new AC(1,frames,SR);
 build(ctx,p);
 return ctx.startRendering().then(function(buf){var samples=normalize(buf.getChannelData(0),-1);return{samples:samples,wav:wav(samples,SR),sampleRate:SR,duration:samples.length/SR,bpm:p.bpm,bars:p.bars,mood:p.mood,plan:p};});
}
function mount(){
 var page=document.querySelector('#page-videoEngine'),card=page&&page.querySelector('#cv127-quality');if(!card||card.querySelector('#cv1454-music'))return false;
 var box=document.createElement('div');box.id='cv1454-music';box.className='card';box.style.cssText='margin-top:12px;padding:12px';
 box.innerHTML='<div class="cardTop"><h3>Nhạc nền tự tạo · Loop Composer (P145.4)</h3><span class="sub">100% tổng hợp tại máy · không dùng sample ngoài</span></div><div class="row" style="gap:8px;flex-wrap:wrap;align-items:end"><label class="tiny">Phong cách <select class="input" id="cv1454-mood"><option value="corporate">Doanh nghiệp</option><option value="calm">Thư thái</option><option value="uplifting">Tích cực</option><option value="focus">Tập trung</option></select></label><label class="tiny">BPM <input class="input" type="number" min="60" max="140" value="96" id="cv1454-bpm" style="width:76px"></label><label class="tiny">Độ dài <select class="input" id="cv1454-bars"><option value="4">4 ô nhịp</option><option value="8">8 ô nhịp</option></select></label><button type="button" class="btn btn-soft sm" id="cv1454-preview">Nghe loop</button><button type="button" class="btn btn-ghost sm" id="cv1454-stop">Dừng</button><button type="button" class="btn btn-ghost sm" id="cv1454-download">Tải WAV</button><button type="button" class="btn btn-primary sm" id="cv1454-add">Thêm vào timeline</button></div><div class="tiny" id="cv1454-status" role="status" aria-live="polite" style="margin-top:8px">Nhạc được tạo theo mood/BPM; không sử dụng nhạc thương mại hoặc thư viện bên ngoài.</div>';
 card.parentNode.insertBefore(box,card.nextSibling);
 var $=function(s){return box.querySelector(s);},playing=null,audioCtx=null;
 function say(t){$('#cv1454-status').textContent=t;}
 function read(){return{bpm:$('#cv1454-bpm').value,bars:$('#cv1454-bars').value};}
 function stop(){try{if(playing){playing.stop();playing.disconnect();}}catch(e){}playing=null;if(audioCtx){try{audioCtx.close();}catch(e){}audioCtx=null;}}
 function go(fn){var mood=$('#cv1454-mood').value;say('Đang tạo nhạc…');render(mood,read()).then(fn).catch(function(e){say(String(e&&e.message||e).slice(0,160));});}
 $('#cv1454-preview').addEventListener('click',function(){stop();go(function(r){try{var AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('AudioContext không khả dụng.');audioCtx=new AC();var buf=audioCtx.createBuffer(1,r.samples.length,r.sampleRate);buf.getChannelData(0).set(r.samples);playing=audioCtx.createBufferSource();playing.buffer=buf;playing.loop=true;playing.connect(audioCtx.destination);playing.start();say('Đang phát loop '+r.mood+' · '+r.bpm+' BPM · '+r.bars+' ô nhịp · '+r.duration.toFixed(1)+' giây.');}catch(e){say('Không phát được: '+String(e.message||e));}});});
 $('#cv1454-stop').addEventListener('click',function(){stop();say('Đã dừng loop.');});
 $('#cv1454-download').addEventListener('click',function(){go(function(r){var u=URL.createObjectURL(new Blob([r.wav],{type:'audio/wav'})),a=document.createElement('a');a.href=u;a.download='canvio-music-'+r.mood+'-'+r.bpm+'bpm.wav';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},5000);say('Đã xuất WAV loop '+r.duration.toFixed(1)+' giây.');});});
 $('#cv1454-add').addEventListener('click',function(){var v=window.CV&&CV.engines&&CV.engines.video;if(!v||!v.importFiles){say('Mở Video Engine trước khi thêm audio.');return;}go(function(r){try{var f=new File([r.wav],'canvio-music-'+r.mood+'-'+r.bpm+'bpm.wav',{type:'audio/wav'});v.importFiles({target:{files:[f],value:''}});say('Đã thêm nhạc nền vào timeline ('+r.duration.toFixed(1)+' giây).');}catch(e){say('Không thêm được: '+String(e.message||e));}});});
 $('#cv1454-mood').addEventListener('change',function(){stop();say('Đã chọn mood '+MOODS[this.value].label+'.');});
 return true;
}
function ready(){try{mount();var p=document.querySelector('#page-videoEngine');if(p&&!p.__cv1454Obs&&window.MutationObserver){p.__cv1454Obs=new MutationObserver(function(){if(!p.querySelector('#cv1454-music'))mount();});p.__cv1454Obs.observe(p,{childList:true,subtree:true});}}catch(e){if(window.console)console.warn('P145.4 music mount',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){
 var a=plan('corporate',{bpm:96,bars:4}),b=plan('calm',{bpm:90,bars:8}),c=plan('bad',{bpm:500,bars:3});
 var samples=new Float32Array([0,.5,-.5,1,-1]),n=normalize(samples,-1),w=wav(n,SR),d=new DataView(w.buffer);
 return{fourMoodPresets:Object.keys(MOODS).length===4,clampsBpmAndBars:c.bpm===140&&c.bars===4,planDuration:Math.abs(a.duration-10)<1e-9&&Math.abs(b.duration-8*4*60/90)<1e-9,progressionRepeats: a.progression.length===4&&a.progression.every(function(x){return x.length===4;}),distinctMoodProgressions:plan('corporate',{bpm:96,bars:4}).progression.map(String).join('|')!==plan('calm',{bpm:96,bars:4}).progression.map(String).join('|'),wavHeader:String.fromCharCode(w[0],w[1],w[2],w[3])==='RIFF'&&String.fromCharCode(w[8],w[9],w[10],w[11])==='WAVE',wavFormat:d.getUint16(20,true)===1&&d.getUint16(22,true)===1&&d.getUint32(24,true)===SR&&d.getUint32(40,true)===samples.length*2,peakLimited:Math.abs(Math.max.apply(null,Array.from(n).map(Math.abs))-Math.pow(10,-1/20))<1e-6};
}
window.CVMusicComposerP1454={version:'145.4.1',moods:MOODS,plan:plan,render:render,normalize:normalize,wav:wav,mount:mount,tests:tests};
})();