/* P145.4b — official embedded music preview; cue metadata only, no capture/download. */
(function(){
'use strict';
if(window.CVMusicPreviewP1454B)return;
var KEY='canvio145:music';
function readTracks(){try{var v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.slice(-50):[];}catch(e){return[];}}
function parse(u){
  try{
    var x=new URL(String(u||'').trim()),h=x.hostname.toLowerCase().replace(/^www\./,'');
    if(x.protocol!=='https:')return null;
    if(h==='youtu.be'||h==='youtube.com'||h==='m.youtube.com'||h==='music.youtube.com'){
      var id='',list=x.searchParams.get('list')||'';
      if(h==='youtu.be')id=x.pathname.split('/').filter(Boolean)[0]||'';
      else if(x.pathname==='/watch')id=x.searchParams.get('v')||'';
      else {var m=x.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{6,20})/);id=m?m[1]:'';}
      if(!/^[A-Za-z0-9_-]{6,20}$/.test(id))return null;
      var start=Math.max(0,Math.min(86400,Math.floor(Number(x.searchParams.get('t'))||0)));
      var end=Math.max(0,Math.min(86400,Math.floor(Number(x.searchParams.get('end'))||0)));
      var q=new URLSearchParams({rel:'0',playsinline:'1'});if(start)q.set('start',String(start));if(end>start)q.set('end',String(end));if(list)q.set('list',list);
      return{platform:'youtube',src:'https://www.youtube-nocookie.com/embed/'+id+'?'+q.toString(),seek:'start/end'};
    }
    if(h==='open.spotify.com'){
      var sm=x.pathname.match(/^\/(track|album|playlist|episode|show)\/([A-Za-z0-9]{10,40})\/?$/);
      if(!sm)return null;
      return{platform:'spotify',src:'https://open.spotify.com/embed/'+sm[1]+'/'+sm[2]+'?utm_source=generator',seek:'platform controls'};
    }
    if(h==='soundcloud.com'){
      if(!/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(x.pathname))return null;
      var clean='https://soundcloud.com'+x.pathname;
      return{platform:'soundcloud',src:'https://w.soundcloud.com/player/?url='+encodeURIComponent(clean)+'&auto_play=false&hide_related=true&show_comments=false&visual=true',seek:'platform controls'};
    }
    return null;
  }catch(e){return null;}
}
function cue(t){var n=Math.max(0,Math.floor(Number(t)||0)),m=Math.floor(n/60),s=n%60;return('0'+m).slice(-2)+':'+('0'+s).slice(-2);}
function describe(t){var p=parse(t&&t.url);if(!p)return null;return{platform:p.platform,src:p.src,title:String(t.title||'Không tên').slice(0,120),artist:String(t.artist||'').slice(0,120),videoAt:Math.max(0,Number(t.videoAt)||0),start:Math.max(0,Number(t.start)||0),end:Math.max(0,Number(t.end)||0),seek:p.seek};}
function mount(){
 var page=document.querySelector('#page-assets');if(!page||page.querySelector('#cv1454b-card'))return false;
 var card=document.createElement('section');card.className='card';card.id='cv1454b-card';card.style.marginTop='12px';
 card.innerHTML='<div class="cardTop"><h3>Music Preview · trình phát chính thức (P145.4b)</h3><span class="sub">Chỉ nghe thử · không tải hoặc ghi âm</span></div><div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><select class="input" id="cv1454b-track" aria-label="Chọn bài nhạc" style="min-width:220px;flex:1"></select><button type="button" class="btn btn-soft sm" id="cv1454b-play">Nghe thử</button><button type="button" class="btn btn-ghost sm" id="cv1454b-stop">Đóng trình phát</button></div><div class="tiny" id="cv1454b-cue" role="status" aria-live="polite" style="margin:8px 0">Chọn bài đã lưu trong Content Factory.</div><div id="cv1454b-frame" style="width:100%;max-width:640px"></div><p class="tiny">YouTube dùng chế độ privacy-enhanced; Spotify/SoundCloud dùng trình phát nhúng chính thức. Cần kết nối mạng và tuân theo điều khoản nền tảng. Mốc cue được giữ trong CANVIO; khả năng tua chính xác phụ thuộc nền tảng.</p>';
 var tgt=page.querySelector('#cv145-card');if(tgt&&tgt.parentNode)tgt.parentNode.appendChild(card);else page.appendChild(card);
 var $=function(s){return card.querySelector(s);};
 function refresh(){
  var list=readTracks(),sel=$('#cv1454b-track'),keep=sel.value;
  sel.replaceChildren();
  list.forEach(function(t,i){var d=describe(t);if(!d)return;var o=document.createElement('option');o.value=String(i);o.textContent=(d.title||'Không tên')+(d.artist?' — '+d.artist:'')+' · '+d.platform;sel.appendChild(o);});
  if(keep&&Array.from(sel.options).some(function(o){return o.value===keep;}))sel.value=keep;
  if(!sel.options.length){var o=document.createElement('option');o.value='';o.textContent='Chưa có bài hợp lệ — thêm link trong Content Factory';sel.appendChild(o);}
 }
 function stop(){var box=$('#cv1454b-frame');box.replaceChildren();}
 $('#cv1454b-play').addEventListener('click',function(){
  var list=readTracks(),i=Number($('#cv1454b-track').value),t=list[i],d=describe(t);
  if(!d){$('#cv1454b-cue').textContent='Link không thuộc nền tảng hỗ trợ hoặc URL không hợp lệ.';stop();return;}
  stop();var f=document.createElement('iframe');f.src=d.src;f.title='Trình phát nhạc '+d.platform;f.loading='lazy';f.referrerPolicy='no-referrer';f.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation allow-popups');f.setAttribute('allow','encrypted-media; picture-in-picture; fullscreen');f.allowFullscreen=true;f.width='100%';f.height=d.platform==='spotify'?'152':'166';f.style.border='0';f.style.borderRadius='10px';f.style.background='#111827';$('#cv1454b-frame').appendChild(f);
  $('#cv1454b-cue').textContent='Cue video '+cue(d.videoAt)+' · đoạn nguồn '+cue(d.start)+'–'+cue(d.end)+' · '+d.platform+'. '+(d.seek==='start/end'?'YouTube nhận mốc bắt đầu/kết thúc qua URL.':'Tua đoạn nguồn bằng điều khiển của nền tảng.');
 });
 $('#cv1454b-stop').addEventListener('click',function(){stop();$('#cv1454b-cue').textContent='Đã đóng trình phát.';});
 refresh();return true;
}
function ready(){try{mount();var p=document.querySelector('#page-assets');if(p&&!p.__cv1454bObs&&window.MutationObserver){p.__cv1454bObs=new MutationObserver(function(){if(!p.querySelector('#cv1454b-card'))mount();});p.__cv1454bObs.observe(p,{childList:true});}}catch(e){if(window.console)console.warn('P145.4b mount',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){
 var y=parse('https://www.youtube.com/watch?v=AbCdEf12345&t=12&end=30'),short=parse('https://youtu.be/AbCdEf12345'),sp=parse('https://open.spotify.com/track/1234567890abcdefghij'),sc=parse('https://soundcloud.com/artist/track'),bad=parse('https://example.com/a'),unsafe=parse('javascript:alert(1)'),ftp=parse('http://youtu.be/AbCdEf12345');
 return{youtubePrivacyEmbed:!!y&&y.src.indexOf('https://www.youtube-nocookie.com/embed/AbCdEf12345')===0&&y.src.indexOf('start=12')>0&&y.src.indexOf('end=30')>0,youtubeShortLink:!!short&&short.platform==='youtube',spotifyOfficialEmbed:!!sp&&sp.src.indexOf('https://open.spotify.com/embed/track/')===0,soundcloudOfficialWidget:!!sc&&sc.src.indexOf('https://w.soundcloud.com/player/')===0&&sc.src.indexOf('auto_play=false')>0,unsupportedHostRejected:bad===null,unsafeProtocolRejected:unsafe===null&&ftp===null,cueFormatting:cue(125)==='02:05',cueMetadata:describe({url:'https://youtu.be/AbCdEf12345',videoAt:62,start:4,end:18}).videoAt===62,noAutoplayByDefault:!!sc&&!/auto_play=true/.test(sc.src),noCaptureOrDownload:!(/MediaRecorder|captureStream|download\s*=|fetch\s*\(/.test(mount.toString()))};
}
window.CVMusicPreviewP1454B={version:'145.4b.1',parse:parse,describe:describe,cue:cue,readTracks:readTracks,mount:mount,tests:tests};
})();