/* P145.7 — local system-font typography presets; no bundled font binaries or remote requests. */
(function(){
'use strict';
if(window.CVTypographyPresetsP1457)return;
var FONTS={
 system:'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
 editorial:'Georgia,"Times New Roman",serif',
 corporate:'"Segoe UI",Arial,sans-serif',
 humanist:'"Trebuchet MS",Verdana,sans-serif',
 modern:'Arial,Helvetica,sans-serif',
 mono:'ui-monospace,SFMono-Regular,Consolas,monospace'
};
var PRESETS={
 business:{label:'Business Clarity',heading:'system',body:'corporate',headingWeight:750,bodyWeight:400,headingSize:42,bodySize:16,lineHeight:1.65,tracking:-.025},
 finance:{label:'Financial Editorial',heading:'editorial',body:'system',headingWeight:700,bodyWeight:400,headingSize:44,bodySize:16,lineHeight:1.7,tracking:-.02},
 hr:{label:'People First',heading:'humanist',body:'system',headingWeight:700,bodyWeight:400,headingSize:40,bodySize:17,lineHeight:1.7,tracking:-.015},
 social:{label:'Modern Social',heading:'modern',body:'system',headingWeight:800,bodyWeight:500,headingSize:46,bodySize:16,lineHeight:1.55,tracking:-.035},
 editorial:{label:'Editorial Serif',heading:'editorial',body:'editorial',headingWeight:700,bodyWeight:400,headingSize:48,bodySize:17,lineHeight:1.8,tracking:-.02},
 dashboard:{label:'Data Dashboard',heading:'system',body:'system',headingWeight:700,bodyWeight:450,headingSize:32,bodySize:14,lineHeight:1.5,tracking:-.01}
};
function clamp(v,a,b,d){v=Number(v);return isFinite(v)?Math.max(a,Math.min(b,v)):d;}
function normalize(key,input){
 if(!PRESETS[key])throw new Error('Preset typography không tồn tại.');
 var base=PRESETS[key],o=input||{},heading=FONTS[base.heading],body=FONTS[base.body];
 return{
  id:key,label:base.label,headingFont:heading,bodyFont:body,
  headingSize:clamp(o.headingSize,24,72,base.headingSize),
  bodySize:clamp(o.bodySize,12,24,base.bodySize),
  headingWeight:Math.round(clamp(o.headingWeight,400,900,base.headingWeight)),
  bodyWeight:Math.round(clamp(o.bodyWeight,300,800,base.bodyWeight)),
  lineHeight:clamp(o.lineHeight,1.2,2.2,base.lineHeight),
  tracking:clamp(o.tracking,-.06,.12,base.tracking)
 };
}
function css(key,input){
 var p=normalize(key,input);
 return ':root{--cv-heading-font:'+p.headingFont+';--cv-body-font:'+p.bodyFont+';--cv-heading-size:'+p.headingSize+'px;--cv-body-size:'+p.bodySize+'px;--cv-heading-weight:'+p.headingWeight+';--cv-body-weight:'+p.bodyWeight+';--cv-line-height:'+p.lineHeight+';--cv-heading-tracking:'+p.tracking+'em}'+
 '.cv-typography h1,.cv-typography h2,.cv-typography .heading{font-family:var(--cv-heading-font);font-size:var(--cv-heading-size);font-weight:var(--cv-heading-weight);letter-spacing:var(--cv-heading-tracking);line-height:1.12}'+
 '.cv-typography p,.cv-typography li,.cv-typography .body{font-family:var(--cv-body-font);font-size:var(--cv-body-size);font-weight:var(--cv-body-weight);line-height:var(--cv-line-height)}';
}
function supportMap(doc){
 doc=doc||document;var out={};
 Object.keys(FONTS).forEach(function(k){
  var family=FONTS[k].split(',')[0].replace(/^["']|["']$/g,'');
  try{out[k]=!!(doc.fonts&&doc.fonts.check('16px "'+family+'"'));}catch(e){out[k]=null;}
 });
 return out;
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function mount(){
 var page=document.querySelector('#page-assets');if(!page||page.querySelector('#cv1457-card'))return false;
 var card=document.createElement('section');card.id='cv1457-card';card.className='card';card.style.marginTop='12px';card.style.position='relative';card.style.zIndex='40';card.style.isolation='isolate';
 card.innerHTML='<div class="cardTop"><h3>Typography Presets · bộ kiểu chữ hệ thống (P145.7)</h3><span class="sub">Font local có sẵn · không tải font từ xa</span></div>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:end"><label class="tiny">Phong cách<select class="input" id="cv1457-preset">'+Object.keys(PRESETS).map(function(k){return'<option value="'+k+'">'+PRESETS[k].label+'</option>';}).join('')+'</select></label><label class="tiny">Cỡ tiêu đề <input class="input" id="cv1457-hsize" type="number" min="24" max="72" value="42" style="width:76px"></label><label class="tiny">Cỡ nội dung <input class="input" id="cv1457-bsize" type="number" min="12" max="24" value="16" style="width:76px"></label><label class="tiny">Giãn dòng <input class="input" id="cv1457-line" type="number" min="1.2" max="2.2" step=".05" value="1.65" style="width:76px"></label><label class="tiny">Tracking <input class="input" id="cv1457-track" type="number" min="-.06" max=".12" step=".005" value="-.025" style="width:76px"></label></div>'+
 '<div id="cv1457-preview" class="cv-typography" style="margin-top:12px;padding:22px;border:1px solid var(--line,rgba(128,140,160,.2));border-radius:12px;background:#fff;color:#17243a"><div class="tiny" id="cv1457-kicker">CANVIO · TYPOGRAPHY SAMPLE</div><h2 class="heading" id="cv1457-heading" style="margin:10px 0">Thiết kế rõ ràng, quyết định tự tin</h2><p class="body" id="cv1457-body">Dữ liệu kinh doanh cần được trình bày mạch lạc. Kết hợp nhịp điệu chữ, khoảng trắng và độ tương phản để người đọc tập trung vào điều quan trọng.</p><div class="tiny" id="cv1457-note" style="margin-top:12px">Mẫu hiển thị sử dụng font hệ thống; máy khác có thể thay font fallback.</div></div>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn btn-soft sm" id="cv1457-apply">Cập nhật xem trước</button><button type="button" class="btn btn-primary sm" id="cv1457-css">Tải CSS</button><button type="button" class="btn btn-ghost sm" id="cv1457-copy">Sao chép CSS</button><button type="button" class="btn btn-ghost sm" id="cv1457-check">Kiểm tra font hệ thống</button></div>'+
 '<div class="tiny" id="cv1457-status" role="status" aria-live="polite" style="margin-top:8px;pointer-events:none">Không chứa font binary, không yêu cầu font online. Chỉ xuất CSS preset.</div>';
 // The app's global card-tilt decoration can cover controls on this dynamic panel.
 // Keep the card visual but let the real form controls receive pointer events.
 card.style.pointerEvents='none';
 var after=page.querySelector('#cv1456-card')||page.querySelector('#cv1455-card')||page.querySelector('#cv145-card');
 if(after&&after.parentNode)after.parentNode.insertBefore(card,after.nextSibling);else page.appendChild(card);
 card.querySelectorAll('button,input,select,textarea,a,label').forEach(function(el){el.style.pointerEvents='auto';el.style.position='relative';el.style.zIndex='2';});

 var $=function(s){return card.querySelector(s);},lastCss='';
 function current(){
  var p=normalize($('#cv1457-preset').value,{headingSize:$('#cv1457-hsize').value,bodySize:$('#cv1457-bsize').value,lineHeight:$('#cv1457-line').value,tracking:$('#cv1457-track').value});
  lastCss=css(p.id,p);return p;
 }
 function apply(){
  var p=current(),h=$('#cv1457-heading'),b=$('#cv1457-body');
  h.style.fontFamily=p.headingFont;h.style.fontSize=p.headingSize+'px';h.style.fontWeight=p.headingWeight;h.style.letterSpacing=p.tracking+'em';
  b.style.fontFamily=p.bodyFont;b.style.fontSize=p.bodySize+'px';b.style.fontWeight=p.bodyWeight;b.style.lineHeight=p.lineHeight;
  $('#cv1457-status').textContent='Đã áp dụng preset '+PRESETS[p.id].label+' cho bản xem trước. CSS có thể nhập vào vùng thiết kế hỗ trợ class .cv-typography.';
  return lastCss;
 }
 function download(name,value){var u=URL.createObjectURL(new Blob([value],{type:'text/css;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},4000);}
 $('#cv1457-preset').addEventListener('change',function(){var p=normalize(this.value);$('#cv1457-hsize').value=p.headingSize;$('#cv1457-bsize').value=p.bodySize;$('#cv1457-line').value=p.lineHeight;$('#cv1457-track').value=p.tracking;apply();});
 $('#cv1457-apply').addEventListener('click',apply);
 $('#cv1457-css').addEventListener('click',function(){var p=normalize($('#cv1457-preset').value);download('canvio-typography-'+p.id+'.css',apply());$('#cv1457-status').textContent='Đã xuất CSS cho preset '+p.label+'.';});
 $('#cv1457-copy').addEventListener('click',function(){var value=apply();if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(value).then(function(){$('#cv1457-status').textContent='Đã sao chép CSS.';},function(){$('#cv1457-status').textContent='Không sao chép được; hãy tải CSS.';});else $('#cv1457-status').textContent='Clipboard không khả dụng; hãy tải CSS.';});
 $('#cv1457-check').addEventListener('click',function(){var map=supportMap(),ok=Object.keys(map).filter(function(k){return map[k]===true;});$('#cv1457-status').textContent='Font-family được trình duyệt xác nhận có sẵn: '+ok.join(', ')+'. Font không được xác nhận sẽ dùng fallback của hệ thống.';});
 apply();return true;
}
function ready(){try{mount();var p=document.querySelector('#page-assets');if(p&&!p.__cv1457Obs&&window.MutationObserver){p.__cv1457Obs=new MutationObserver(function(){if(!p.querySelector('#cv1457-card'))mount();});p.__cv1457Obs.observe(p,{childList:true});}}catch(e){if(window.console)console.warn('P145.7 typography',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){
 var p=normalize('business',{headingSize:99,bodySize:5,tracking:1,lineHeight:4}),t=normalize('editorial'),out=css('finance');
 var bad=false;try{normalize('unknown');}catch(e){bad=true;}
 return{
  sixPresets:Object.keys(PRESETS).length===6,
  fontStacksAreAllowListed:Object.keys(PRESETS).every(function(k){return !!FONTS[PRESETS[k].heading]&&!!FONTS[PRESETS[k].body];}),
  controlsClamped:p.headingSize===72&&p.bodySize===12&&p.tracking===.12&&p.lineHeight===2.2,
  fontStackFallbackExists:t.headingFont.indexOf('serif')>=0,
  cssContainsNoRemoteResources:!/(?:src|href)=["']?https?:|@import|url\(/i.test(out),
  exportsResponsiveCustomProperties:out.indexOf('--cv-heading-font')>=0&&out.indexOf('--cv-body-font')>=0&&out.indexOf('.cv-typography')>=0,
  unknownPresetRejected:bad
 };
}
window.CVTypographyPresetsP1457={version:'145.7.0',fonts:FONTS,presets:PRESETS,normalize:normalize,css:css,supportMap:supportMap,mount:mount,tests:tests};
})();