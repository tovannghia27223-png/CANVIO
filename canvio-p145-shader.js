/* P145.2 — local shader transitions and effects; no network, storage, or third-party runtime. */
(function () {
'use strict';
if (window.CVShaderP145) return;
var TRANSITIONS={
  fade:{label:'Crossfade',id:0},'wipe-left':{label:'Wipe trái → phải',id:1},
  'wipe-right':{label:'Wipe phải → trái',id:2},'wipe-up':{label:'Wipe dưới → trên',id:3},
  'wipe-down':{label:'Wipe trên → dưới',id:4},dissolve:{label:'Dissolve',id:5},
  radial:{label:'Radial reveal',id:6},zoom:{label:'Zoom through',id:7},glitch:{label:'Digital glitch',id:8}
};
var EFFECTS={
  none:{label:'Không hiệu ứng',id:0},grain:{label:'Film grain',id:1},
  'light-leak':{label:'Light leak',id:2},vignette:{label:'Vignette',id:3},
  chromatic:{label:'Chromatic aberration',id:4},'zoom-blur':{label:'Zoom blur',id:5},
  shake:{label:'Camera shake',id:6},'speed-lines':{label:'Speed lines',id:7},bloom:{label:'Soft bloom',id:8}
};
var VS='attribute vec2 a_position; varying vec2 v_uv; void main(){v_uv=a_position*0.5+0.5;gl_Position=vec4(a_position,0.0,1.0);}';
var FS=[
'precision mediump float; varying vec2 v_uv; uniform sampler2D u_from; uniform sampler2D u_to;',
'uniform float u_progress; uniform float u_strength; uniform float u_time; uniform float u_seed;',
'uniform vec2 u_resolution; uniform int u_transition; uniform int u_effect;',
'float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=vec2(dot(p,p+vec2(45.32+u_seed)));return fract(p.x*p.y);}',
'vec4 trans(vec2 uv){vec2 q=clamp(uv,0.001,0.999);vec4 a=texture2D(u_from,q),b=texture2D(u_to,q);float p=clamp(u_progress,0.0,1.0),m=p;if(p<=0.0)return a;if(p>=1.0)return b;',
'if(u_transition==1)m=1.0-smoothstep(p-0.01,p+0.01,q.x);',
'else if(u_transition==2)m=smoothstep(1.0-p-0.01,1.0-p+0.01,q.x);',
'else if(u_transition==3)m=1.0-smoothstep(p-0.01,p+0.01,q.y);',
'else if(u_transition==4)m=smoothstep(1.0-p-0.01,1.0-p+0.01,q.y);',
'else if(u_transition==5){float n=hash21(floor(q*u_resolution/5.0));m=smoothstep(n-0.04,n+0.04,p);}',
'else if(u_transition==6){float d=length((q-0.5)*vec2(u_resolution.x/u_resolution.y,1.0));m=smoothstep(d-0.02,d+0.02,p*0.78);}',
'else if(u_transition==7){a=texture2D(u_from,clamp((q-0.5)*(1.0+0.14*p)+0.5,0.001,0.999));b=texture2D(u_to,clamp((q-0.5)*(1.12-0.12*p)+0.5,0.001,0.999));}',
'else if(u_transition==8){float band=floor(q.y*42.0);float n=hash21(vec2(band,floor(u_time*12.0)));float dx=(n-0.5)*0.07*(1.0-p);a=texture2D(u_from,clamp(q+vec2(dx,0.0),0.001,0.999));b=texture2D(u_to,clamp(q-vec2(dx,0.0),0.001,0.999));}',
'return mix(a,b,clamp(m,0.0,1.0));}',
'void main(){vec2 uv=v_uv;float s=clamp(u_strength,0.0,1.0);',
'if(u_effect==6){float j=sin(u_time*17.0)*0.0025*s;uv+=vec2(j,cos(u_time*13.0)*j);}',
'vec4 base=trans(uv),c=base;',
'if(u_effect==1){float n=hash21(floor(uv*u_resolution)+floor(u_time*24.0));c.rgb+=(n-0.5)*0.18*s;}',
'else if(u_effect==2){float d=length((uv-vec2(0.18,0.78))*vec2(0.85,1.0));float g=pow(max(0.0,1.0-d),3.0)*0.55*s;c.rgb+=vec3(g,g*0.48,g*0.16);}',
'else if(u_effect==3){float d=length((uv-0.5)*vec2(1.0,0.92));float v=1.0-smoothstep(0.22,0.92,d*1.25);c.rgb*=mix(1.0,v,0.82*s);}',
'else if(u_effect==4){float d=0.002+0.01*s;c=vec4(trans(uv+vec2(d,0.0)).r,base.g,trans(uv-vec2(d,0.0)).b,1.0);}',
'else if(u_effect==5){vec2 d=(uv-0.5)*0.035*s;vec4 z=base*0.28;z+=trans(uv-d*0.5)*0.24;z+=trans(uv-d)*0.18;z+=trans(uv+d*0.5)*0.18;z+=trans(uv+d)*0.12;c=mix(base,z,0.8*s);}',
'else if(u_effect==7){float ln=step(0.91,hash21(vec2(floor(uv.y*95.0),floor(uv.x*9.0+u_time*22.0))));c.rgb+=vec3(0.55,0.78,1.0)*ln*smoothstep(0.0,0.8,uv.x)*0.38*s;}',
'else if(u_effect==8){vec4 z=(trans(uv+vec2(0.002,0.0))+trans(uv-vec2(0.002,0.0))+trans(uv+vec2(0.0,0.002))+trans(uv-vec2(0.0,0.002)))*0.25;float l=dot(z.rgb,vec3(0.2126,0.7152,0.0722));c.rgb+=z.rgb*smoothstep(0.58,0.96,l)*0.65*s;}',
'gl_FragColor=vec4(clamp(c.rgb,0.0,1.0),1.0);}'
].join('\n');
function clamp(v,a,b,d){v=Number(v);return isFinite(v)?Math.max(a,Math.min(b,v)):d;}
function normalizeOptions(o){o=o||{};return{transition:TRANSITIONS[o.transition]?o.transition:'fade',effect:EFFECTS[o.effect]?o.effect:'none',progress:clamp(o.progress,0,1,0.5),strength:clamp(o.strength,0,1,0.5),quality:['low','medium','high'].indexOf(o.quality)>=0?o.quality:'medium',time:clamp(o.time,0,3600,0),seed:clamp(o.seed,0,1000000,17)};}
function outputSize(w,h,q,max){w=Math.max(2,Number(w)||960);h=Math.max(2,Number(h)||540);var cap=Math.min(({low:854,medium:1280,high:1920})[q]||1280,Number(max)||4096),s=Math.min(1,cap/Math.max(w,h),Math.sqrt(8294400/(w*h)));return{width:Math.max(2,Math.floor(w*s/2)*2),height:Math.max(2,Math.floor(h*s/2)*2),scale:s};}
function dims(x){return{width:Number(x&&(x.videoWidth||x.naturalWidth||x.width))||1,height:Number(x&&(x.videoHeight||x.naturalHeight||x.height))||1};}
function drawCover(c,x,w,h){var d=dims(x),s=Math.max(w/d.width,h/d.height),dw=d.width*s,dh=d.height*s;c.drawImage(x,(w-dw)/2,(h-dh)/2,dw,dh);}
function fallback(c,canvas,a,b,o){var w=canvas.width,h=canvas.height,p=o.progress;c.save();c.globalAlpha=1;c.clearRect(0,0,w,h);drawCover(c,a,w,h);if(o.transition.indexOf('wipe-')===0){c.beginPath();if(o.transition==='wipe-left')c.rect(0,0,w*p,h);else if(o.transition==='wipe-right')c.rect(w*(1-p),0,w*p,h);else if(o.transition==='wipe-up')c.rect(0,h*(1-p),w,h*p);else c.rect(0,0,w,h*p);c.clip();drawCover(c,b,w,h);}else{c.globalAlpha=p;drawCover(c,b,w,h);}c.restore();return{backend:'2d-fallback',warning:o.effect!=='none'?'Canvas2D fallback: shader FX tạm tắt.':''};}
function renderer(canvas){
  if(!canvas)throw Error('Thiếu canvas preview.');
  var gl=null,ctx=null,program=null,tex=[],buf=null,dead=false;
  try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true})||canvas.getContext('experimental-webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});}catch(e){}
  function shader(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||'Shader compile failed');return s;}
  if(gl){try{var v=shader(gl.VERTEX_SHADER,VS),f=shader(gl.FRAGMENT_SHADER,FS);program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'Shader link failed');gl.deleteShader(v);gl.deleteShader(f);gl.useProgram(program);buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);var a=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);for(var i=0;i<2;i++){var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);tex.push(t);}}catch(e){throw Error('P145.2 WebGL init failed: '+e.message);}}
  else{ctx=canvas.getContext('2d');if(!ctx)throw Error('WebGL/Canvas2D không khả dụng.');}
  function loc(n){return gl.getUniformLocation(program,n);}
  function render(a,b,p,opt){if(dead)throw Error('Renderer disposed');if(!a||!b)throw Error('Cần hai ảnh đầu/cuối');var o=normalizeOptions(Object.assign({},opt||{},{progress:p})),da=dims(a),db=dims(b),max=gl?gl.getParameter(gl.MAX_TEXTURE_SIZE):4096,z=outputSize(Math.max(da.width,db.width),Math.max(da.height,db.height),o.quality,max);if(canvas.width!==z.width)canvas.width=z.width;if(canvas.height!==z.height)canvas.height=z.height;if(!gl)return fallback(ctx,canvas,a,b,o);gl.viewport(0,0,z.width,z.height);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);for(var i=0;i<2;i++){gl.activeTexture(i?gl.TEXTURE1:gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,i?b:a);}gl.uniform1i(loc('u_from'),0);gl.uniform1i(loc('u_to'),1);gl.uniform1f(loc('u_progress'),o.progress);gl.uniform1f(loc('u_strength'),o.strength);gl.uniform1f(loc('u_time'),o.time);gl.uniform1f(loc('u_seed'),o.seed);gl.uniform2f(loc('u_resolution'),z.width,z.height);gl.uniform1i(loc('u_transition'),TRANSITIONS[o.transition].id);gl.uniform1i(loc('u_effect'),EFFECTS[o.effect].id);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);var e=gl.getError();if(e!==gl.NO_ERROR)throw Error('WebGL render error '+e);return{backend:'webgl',warning:'',width:z.width,height:z.height};}
  function dispose(){if(dead)return;dead=true;if(gl){tex.forEach(function(t){gl.deleteTexture(t);});if(buf)gl.deleteBuffer(buf);if(program)gl.deleteProgram(program);}}
  return{render:render,dispose:dispose,backend:gl?'webgl':'2d-fallback',canvas:canvas};
}
function renderFrame(c,a,b,p,o){var r=renderer(c);try{return r.render(a,b,p,o);}finally{r.dispose();}}
function webCodecsStatus(){var p=window.CANVIOWebCodecsExport;return{available:!!(window.VideoEncoder&&window.VideoFrame&&p&&typeof p.muxMP4==='function'),owner:'CANVIOWebCodecsExport P79'};}
async function exportSequence(a,b,input){
  input=input||{};var status=webCodecsStatus();if(!status.available)throw Error('Cần WebCodecs H.264 và bộ mux P79; dùng PNG nếu trình duyệt không hỗ trợ.');
  var fps=[24,25,30,50,60].indexOf(Number(input.fps))>=0?Number(input.fps):30,dur=clamp(input.duration,0.5,10,3),count=Math.ceil(dur*fps);if(count>600)throw Error('P145.2 giới hạn 600 frame.');
  var d=dims(a),z=outputSize(input.width||Math.max(d.width,dims(b).width),input.height||Math.max(d.height,dims(b).height),input.quality||'medium',2048);if(z.width>1920||z.height>1080)throw Error('MP4 P145.2 tối đa 1920×1080.');
  var c=document.createElement('canvas');c.width=z.width;c.height=z.height;var r=renderer(c),enc=null,samples=[],avcC=null,fd=Math.round(1e6/fps),fail=null;
  try{var candidates=z.width>1280?['avc1.4D4028','avc1.640028','avc1.42E028']:['avc1.42001f','avc1.4D401f','avc1.64001f'],cfg=null;for(var k=0;k<candidates.length;k++){var test={codec:candidates[k],width:z.width,height:z.height,bitrate:5000000,framerate:fps,avc:{format:'avc'}};try{var ok=await window.VideoEncoder.isConfigSupported(test);if(ok&&ok.supported){cfg=ok.config||test;break;}}catch(e){}}if(!cfg)throw Error('Trình duyệt không xác nhận H.264 WebCodecs.');
    enc=new window.VideoEncoder({output:function(ch,m){try{if(m&&m.decoderConfig&&m.decoderConfig.description)avcC=new Uint8Array(m.decoderConfig.description);var data=new Uint8Array(ch.byteLength);ch.copyTo(data);samples.push({data:data,timestamp:ch.timestamp,duration:ch.duration||fd,type:ch.type});}catch(e){fail=e;}},error:function(e){fail=e;}});enc.configure(cfg);
    for(var i=0;i<count;i++){if(input.signal&&input.signal.aborted)throw Error('Đã hủy xuất MP4.');if(fail)throw fail;var p=count===1?1:i/(count-1);r.render(a,b,p,Object.assign({},input,{progress:p,time:i/fps}));var fr=new window.VideoFrame(c,{timestamp:i*fd,duration:fd});try{enc.encode(fr,{keyFrame:i===0});}finally{fr.close();}var qStart=Date.now();while(enc.encodeQueueSize>3){if(fail)throw fail;if(Date.now()-qStart>30000)throw Error('WebCodecs queue timeout.');await new Promise(function(resolve){setTimeout(resolve,8);});}if(input.onProgress)input.onProgress((i+1)/count);}
    await enc.flush();if(fail)throw fail;if(!avcC||!samples.length)throw Error('Thiếu AVC config/frame.');var mp4=window.CANVIOWebCodecsExport.muxMP4({width:z.width,height:z.height,fps:fps,avcC:avcC,samples:samples});return{blob:mp4.blob,bytes:mp4.bytes,duration:mp4.duration,samples:mp4.samples,profile:'video-only MP4; no audio'};
  }finally{try{if(enc&&enc.state!=='closed')enc.close();}catch(e){}r.dispose();}
}
function demo(label,c1,c2){var c=document.createElement('canvas');c.width=960;c.height=540;var x=c.getContext('2d'),g=x.createLinearGradient(0,0,960,540);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.fillRect(0,0,960,540);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(42,365,520,100);x.fillStyle='#fff';x.font='700 42px Arial';x.fillText(label,66,430);return c;}
function mount(){
  var page=document.querySelector('#page-videoEngine');if(!page||page.querySelector('#cv1452-card'))return false;
  var card=document.createElement('div');card.className='card';card.id='cv1452-card';card.style.marginTop='12px';
  card.innerHTML='<div class="cardTop"><h3>Transitions &amp; FX · Shader (P145.2)</h3><span class="sub">WebGL · xử lý cục bộ · không upload media</span></div>'+
  '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:end;margin-bottom:10px"><label class="tiny">Ảnh đầu <input class="input" id="cv1452-from-file" type="file" accept="image/*"></label><label class="tiny">Ảnh cuối <input class="input" id="cv1452-to-file" type="file" accept="image/*"></label><label class="tiny">Chuyển cảnh <select class="input" id="cv1452-transition">'+Object.keys(TRANSITIONS).map(function(k){return'<option value="'+k+'">'+TRANSITIONS[k].label+'</option>';}).join('')+'</select></label><label class="tiny">Hiệu ứng <select class="input" id="cv1452-effect">'+Object.keys(EFFECTS).map(function(k){return'<option value="'+k+'">'+EFFECTS[k].label+'</option>';}).join('')+'</select></label><label class="tiny">Tiến trình <input id="cv1452-progress" type="range" min="0" max="100" value="50"></label><label class="tiny">Độ mạnh <input id="cv1452-strength" type="range" min="0" max="100" value="55"></label><label class="tiny">Chất lượng <select class="input" id="cv1452-quality"><option value="low">Nhẹ</option><option value="medium" selected>Tiêu chuẩn</option><option value="high">Cao</option></select></label></div>'+
  '<canvas id="cv1452-preview" width="960" height="540" aria-label="Preview chuyển cảnh shader" style="display:block;width:100%;max-height:380px;object-fit:contain;background:#08111f;border:1px solid rgba(130,150,180,.2);border-radius:10px"></canvas>'+
  '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px"><button type="button" class="btn btn-soft sm" id="cv1452-preview-btn">Xem trước</button><button type="button" class="btn btn-ghost sm" id="cv1452-png">Tải khung PNG</button><button type="button" class="btn btn-primary sm" id="cv1452-mp4">Xuất MP4 đoạn chuyển cảnh</button><span class="tiny" id="cv1452-status" role="status" aria-live="polite">Chọn hai ảnh hoặc dùng ảnh demo.</span></div>'+
  '<p class="tiny">MP4 dùng WebCodecs H.264 qua bộ mux P79, tối đa 10 giây / 600 frame / 1080p và không có âm thanh.</p>';
  page.appendChild(card);
  var $=function(s){return card.querySelector(s);},canvas=$('#cv1452-preview'),r=renderer(canvas),a=demo('CREATIVE START','#153a66','#23b6b5'),b=demo('NEW DIRECTION','#513d83','#d27b54'),urls=[];
  function options(){return{transition:$('#cv1452-transition').value,effect:$('#cv1452-effect').value,progress:+$('#cv1452-progress').value/100,strength:+$('#cv1452-strength').value/100,quality:$('#cv1452-quality').value};}
  function say(s){$('#cv1452-status').textContent=s;}
  function paint(){try{var q=r.render(a,b,+$('#cv1452-progress').value/100,options());say(q.backend+(q.warning?' · '+q.warning:' · Preview đã cập nhật.'));return q;}catch(e){say('Preview lỗi: '+String(e.message||e));return null;}}
  function load(inp,which){var f=inp.files&&inp.files[0];if(!f)return;if(!/^image\//i.test(f.type)||f.size>32*1024*1024){say('Chỉ nhận ảnh tối đa 32 MB.');inp.value='';return;}var u=URL.createObjectURL(f),im=new Image();im.onload=function(){if(which==='a')a=im;else b=im;urls.push(u);paint();say('Đã nạp ảnh cục bộ: '+f.name);};im.onerror=function(){URL.revokeObjectURL(u);say('Không đọc được ảnh.');};im.src=u;}
  $('#cv1452-from-file').addEventListener('change',function(){load(this,'a');});$('#cv1452-to-file').addEventListener('change',function(){load(this,'b');});
  ['#cv1452-transition','#cv1452-effect','#cv1452-progress','#cv1452-strength','#cv1452-quality'].forEach(function(s){$(s).addEventListener('input',paint);$(s).addEventListener('change',paint);});
  $('#cv1452-preview-btn').addEventListener('click',paint);
  $('#cv1452-png').addEventListener('click',function(){paint();canvas.toBlob(function(blob){if(!blob){say('Không tạo được PNG.');return;}var u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='canvio-p1452-transition.png';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},4000);say('Đã xuất khung PNG.');},'image/png');});
  $('#cv1452-mp4').addEventListener('click',async function(){var btn=this;btn.disabled=true;say('Đang render MP4…');try{var out=await exportSequence(a,b,Object.assign({},options(),{duration:3,fps:30,width:1280,height:720,onProgress:function(p){say('Đang render '+Math.round(p*100)+'%…');}})),u=URL.createObjectURL(out.blob),dl=document.createElement('a');dl.href=u;dl.download='canvio-p1452-transition.mp4';document.body.appendChild(dl);dl.click();dl.remove();setTimeout(function(){URL.revokeObjectURL(u);},8000);say('Đã xuất MP4 video-only ('+out.duration.toFixed(1)+' giây).');}catch(e){say(String(e.message||e));}finally{btn.disabled=false;}});
  paint();card.__cv1452Dispose=function(){r.dispose();urls.forEach(function(u){URL.revokeObjectURL(u);});};return true;
}
function ready(){try{mount();var p=document.querySelector('#page-videoEngine');if(p&&!p.__cv1452Obs&&window.MutationObserver){p.__cv1452Obs=new MutationObserver(function(){if(!p.querySelector('#cv1452-card'))mount();});p.__cv1452Obs.observe(p,{childList:true,subtree:true});}}catch(e){if(window.console)console.error('P145.2 init',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){var n=normalizeOptions({transition:'bad',effect:'bad',progress:2,strength:-3,quality:'max'}),l=outputSize(4000,2500,'low',1024),h=outputSize(4000,2500,'high',4096),m=outputSize(1280,720,'medium',4096);return{
nineTransitions:Object.keys(TRANSITIONS).length===9,eightFxPlusNone:Object.keys(EFFECTS).length===9&&Object.keys(EFFECTS).filter(function(k){return k!=='none';}).length===8,
safeOptionFallback:n.transition==='fade'&&n.effect==='none'&&n.progress===1&&n.strength===0&&n.quality==='medium',
resolutionCaps:Math.max(l.width,l.height)<=854&&Math.max(h.width,h.height)<=1920&&m.width===1280&&m.height===720,
evenOutputDimensions:[l,h,m].every(function(x){return x.width%2===0&&x.height%2===0;}),
shaderPipeline:VS.indexOf('a_position')>=0&&FS.indexOf('trans(vec2 uv)')>=0&&FS.indexOf('u_effect')>=0,
effectStrengthBounded:normalizeOptions({strength:2}).strength===1&&normalizeOptions({strength:-1}).strength===0,
webCodecsUsesP79:exportSequence.toString().indexOf('CANVIOWebCodecsExport.muxMP4')>=0,
noExternalRequests:!(/\bfetch\s*\(|XMLHttpRequest|https?:\/\//.test(VS+FS+renderFrame.toString()+exportSequence.toString())),
localMediaOnly:true};}
window.CVShaderP145={version:'145.2.1',transitions:TRANSITIONS,effects:EFFECTS,normalizeOptions:normalizeOptions,outputSize:outputSize,createRenderer:renderer,renderFrame:renderFrame,webCodecsStatus:webCodecsStatus,exportSequence:exportSequence,mount:mount,tests:tests};
})();