/* P145.5 — local Template Factory. Original HTML/CSS only; no remote assets or bundled stock. */
(function(){
'use strict';
if(window.CVTemplateFactoryP1455)return;
var KEY='canvio145:templates',MAX_SAVED=20,MAX_TEXT=500,FORMAT='CANVIO_TEMPLATE_V1';
var PALETTES={
 navy:{label:'Navy / chuyên nghiệp',bg:'#eef2f8',ink:'#14243a',accent:'#2457a7',muted:'#60718a',panel:'#ffffff'},
 teal:{label:'Teal / hiện đại',bg:'#eaf5f3',ink:'#153a3a',accent:'#16877e',muted:'#597978',panel:'#ffffff'},
 amber:{label:'Amber / năng lượng',bg:'#fbf3e7',ink:'#392a18',accent:'#c77719',muted:'#80634a',panel:'#ffffff'},
 plum:{label:'Plum / sáng tạo',bg:'#f3eef8',ink:'#30213f',accent:'#7546a4',muted:'#78658a',panel:'#ffffff'}
};
var TPL={
 business:{label:'Báo cáo kinh doanh',kicker:'BUSINESS BRIEF',footer:'TÓM TẮT ĐIỀU HÀNH',layout:'wide'},
 finance:{label:'Bảng chỉ số tài chính',kicker:'FINANCE SNAPSHOT',footer:'DỮ LIỆU MINH HỌA · CẬP NHẬT THEO NGUỒN THỰC',layout:'metrics'},
 hr:{label:'Tuyển dụng nhân sự',kicker:'CAREER OPPORTUNITY',footer:'ỨNG TUYỂN · LIÊN HỆ BỘ PHẬN NHÂN SỰ',layout:'wide'},
 cv:{label:'Hồ sơ chuyên nghiệp',kicker:'PROFESSIONAL PROFILE',footer:'HỒ SƠ NĂNG LỰC',layout:'profile'},
 social:{label:'Bìa video / Social',kicker:'SOCIAL STORY',footer:'THÔNG ĐIỆP NGẮN · DỄ GHI NHỚ',layout:'poster'}
};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function text(v,d){v=String(v==null?'':v).replace(/\u0000/g,'').trim();return(v||d||'').slice(0,MAX_TEXT);}
function normFields(input){
 input=input||{};
 return{
  title:text(input.title,'Tiêu đề của bạn'),
  subtitle:text(input.subtitle,'Một dòng mô tả ngắn'),
  body:text(input.body,'Bổ sung nội dung chính tại đây.'),
  footer:text(input.footer,'CANVIO · CREATIVE WORKSPACE'),
  stat1:text(input.stat1,'12.8%'),stat2:text(input.stat2,'24'),stat3:text(input.stat3,'03'),
  label1:text(input.label1,'Tăng trưởng'),label2:text(input.label2,'Dự án'),label3:text(input.label3,'Ưu tiên')
 };
}
function normalize(key,input,palette){
 if(!TPL[key])throw new Error('Mẫu không tồn tại.');
 return{format:FORMAT,version:1,key:key,name:text(input&&input.name,TPL[key].label),palette:PALETTES[palette]?palette:'navy',fields:normFields(input&&input.fields||input)};
}
function cardLayout(t,f,p){
 var stats='<div class="stats"><div><strong>'+esc(f.stat1)+'</strong><span>'+esc(f.label1)+'</span></div><div><strong>'+esc(f.stat2)+'</strong><span>'+esc(f.label2)+'</span></div><div><strong>'+esc(f.stat3)+'</strong><span>'+esc(f.label3)+'</span></div></div>';
 if(t.layout==='poster')return'<main class="poster"><div class="orb"></div><div class="kicker">'+esc(t.kicker)+'</div><h1>'+esc(f.title)+'</h1><p class="subtitle">'+esc(f.subtitle)+'</p><p class="body">'+esc(f.body)+'</p><div class="footer">'+esc(f.footer||t.footer)+'</div></main>';
 if(t.layout==='profile')return'<main class="profile"><div class="avatar">CV</div><div class="kicker">'+esc(t.kicker)+'</div><h1>'+esc(f.title)+'</h1><h2>'+esc(f.subtitle)+'</h2><p>'+esc(f.body)+'</p>'+stats+'<div class="footer">'+esc(f.footer||t.footer)+'</div></main>';
 return'<main class="sheet"><div class="bar"></div><div class="kicker">'+esc(t.kicker)+'</div><h1>'+esc(f.title)+'</h1><p class="subtitle">'+esc(f.subtitle)+'</p><div class="body">'+esc(f.body)+'</div>'+stats+'<div class="footer">'+esc(f.footer||t.footer)+'</div></main>';
}
function renderHtml(key,input,palette){
 var item=normalize(key,{fields:input},palette),t=TPL[item.key],p=PALETTES[item.palette],f=item.fields;
 var css=':root{color-scheme:light}*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Inter,"Segoe UI",Arial,sans-serif;background:'+p.bg+';color:'+p.ink+'}body{display:grid;place-items:center;padding:clamp(16px,4vw,48px)}main{position:relative;isolation:isolate;width:min(100%,1120px);min-height:660px;padding:clamp(28px,6vw,76px);background:'+p.panel+';border-radius:28px;box-shadow:0 24px 70px rgba(20,36,58,.12);overflow:hidden}.bar{position:absolute;z-index:-1;inset:0 auto 0 0;width:12px;background:'+p.accent+'}.kicker{font-size:12px;font-weight:800;letter-spacing:.2em;color:'+p.accent+'}h1{font-size:clamp(36px,6vw,72px);line-height:1.02;letter-spacing:-.045em;max-width:900px;margin:26px 0 14px}.subtitle{font-size:clamp(18px,2.4vw,25px);line-height:1.45;color:'+p.muted+';max-width:820px}.body{font-size:clamp(16px,2vw,20px);line-height:1.75;white-space:pre-wrap;max-width:850px;margin-top:36px}.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:52px}.stats div{padding:20px;border-radius:16px;background:'+p.bg+';min-height:104px}.stats strong,.stats span{display:block}.stats strong{font-size:clamp(24px,4vw,36px);color:'+p.accent+'}.stats span{font-size:12px;color:'+p.muted+';margin-top:8px}.footer{margin-top:56px;padding-top:18px;border-top:1px solid '+p.bg+';font-size:11px;font-weight:700;letter-spacing:.12em;color:'+p.muted+'}.poster{display:flex;min-height:720px;flex-direction:column;justify-content:center;background:'+p.ink+';color:#fff}.poster:before{content:"";position:absolute;z-index:-1;width:48vw;height:48vw;right:-12vw;top:-14vw;border-radius:50%;background:'+p.accent+';opacity:.72}.poster .kicker,.poster .subtitle{color:#fff;opacity:.82}.poster h1{font-size:clamp(52px,10vw,116px);max-width:820px}.poster .body{font-weight:600;max-width:640px}.poster .footer{border-color:rgba(255,255,255,.2);color:#fff}.profile{max-width:960px}.avatar{display:grid;place-items:center;width:76px;height:76px;border-radius:22px;background:'+p.accent+';color:#fff;font-weight:900;font-size:28px;margin-bottom:30px}.profile h1{font-size:clamp(38px,6vw,68px)}.profile h2{font-size:clamp(18px,2.4vw,24px);font-weight:500;color:'+p.muted+'}.profile p{font-size:18px;line-height:1.8;max-width:780px;margin-top:28px}@media(max-width:640px){main{min-height:560px;padding:28px 22px;border-radius:18px}.stats{grid-template-columns:1fr;gap:8px;margin-top:30px}.stats div{min-height:78px}.footer{margin-top:34px}.poster{min-height:620px}}@media print{body{padding:0;background:#fff}main{width:100%;min-height:100vh;box-shadow:none;border-radius:0}}';
 return'<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="'+esc(f.subtitle)+'"><title>'+esc(f.title)+'</title><style>'+css+'</style></head><body>'+cardLayout(t,f,p)+'</body></html>';
}
function exportItem(key,input,palette,name){var it=normalize(key,{fields:input,name:name},palette);return{format:FORMAT,version:1,name:it.name,key:it.key,palette:it.palette,fields:it.fields};}
function parseImport(raw){
 var s=String(raw==null?'':raw);if(s.length>65536)throw new Error('Tệp mẫu vượt giới hạn 64 KB.');
 var o;try{o=JSON.parse(s);}catch(e){throw new Error('JSON mẫu không hợp lệ.');}
 if(!o||o.format!==FORMAT||Number(o.version)!==1)throw new Error('Sai định dạng CANVIO_TEMPLATE_V1.');
 var it=normalize(o.key,{name:o.name,fields:o.fields},o.palette);
 return{format:FORMAT,version:1,name:it.name,key:it.key,palette:it.palette,fields:it.fields};
}
function readSaved(){
 try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(a))return[];return a.filter(function(x){try{parseImport(JSON.stringify(x));return true;}catch(e){return false;}}).slice(-MAX_SAVED);}catch(e){return[];}
}
function saveItem(item){
 var clean=parseImport(JSON.stringify(item)),a=readSaved(),id=String(item.id||'').slice(0,80);
 if(!id)id='tpl-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
 clean.id=id;var found=-1;
 for(var i=0;i<a.length;i++)if(a[i].id===id){found=i;break;}
 if(found>=0)a.splice(found,1);a.push(clean);if(a.length>MAX_SAVED)a=a.slice(-MAX_SAVED);
 try{localStorage.setItem(KEY,JSON.stringify(a));return{ok:true,item:clean,count:a.length};}catch(e){return{ok:false,reason:'Không lưu được: bộ nhớ cục bộ có thể đã đầy.'};}
}
function mount(){
 var page=document.querySelector('#page-assets');if(!page||page.querySelector('#cv1455-card'))return false;
 var card=document.createElement('section');card.className='card';card.id='cv1455-card';card.style.marginTop='12px';
 card.innerHTML='<div class="cardTop"><h3>Template Factory · xưởng mẫu cá nhân (P145.5)</h3><span class="sub">Mẫu gốc CANVIO · làm việc offline · không dùng stock ngoài</span></div>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:end"><label class="tiny">Loại mẫu<select class="input" id="cv1455-key">'+Object.keys(TPL).map(function(k){return'<option value="'+k+'">'+TPL[k].label+'</option>';}).join('')+'</select></label><label class="tiny">Bảng màu<select class="input" id="cv1455-palette">'+Object.keys(PALETTES).map(function(k){return'<option value="'+k+'">'+PALETTES[k].label+'</option>';}).join('')+'</select></label><label class="tiny">Tên lưu<input class="input" id="cv1455-name" maxlength="100" value="Mẫu của tôi"></label><label class="tiny">Mẫu đã lưu<select class="input" id="cv1455-saved"><option value="">— Chưa chọn —</option></select></label><button type="button" class="btn btn-soft sm" id="cv1455-load">Nạp mẫu</button></div>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-start;margin-top:10px"><label class="tiny" style="flex:1;min-width:180px">Tiêu đề<input class="input" id="cv1455-title" maxlength="500" value="Tổng quan kinh doanh quý II"></label><label class="tiny" style="flex:1;min-width:180px">Dòng mô tả<input class="input" id="cv1455-subtitle" maxlength="500" value="Từ dữ liệu đến quyết định"></label></div>'+
 '<label class="tiny" style="display:block;margin-top:8px">Nội dung chính<textarea class="input" id="cv1455-body" rows="3" maxlength="500" style="width:100%">Tập trung vào kết quả, xu hướng và hành động tiếp theo. Thay nội dung mẫu bằng dữ liệu đã được xác minh trước khi phát hành.</textarea></label>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><label class="tiny">Chỉ số 1<input class="input" id="cv1455-stat1" maxlength="500" value="12.8%"></label><label class="tiny">Chỉ số 2<input class="input" id="cv1455-stat2" maxlength="500" value="24"></label><label class="tiny">Chỉ số 3<input class="input" id="cv1455-stat3" maxlength="500" value="03"></label><label class="tiny">Nhãn 1<input class="input" id="cv1455-label1" maxlength="500" value="Tăng trưởng"></label><label class="tiny">Nhãn 2<input class="input" id="cv1455-label2" maxlength="500" value="Dự án"></label><label class="tiny">Nhãn 3<input class="input" id="cv1455-label3" maxlength="500" value="Ưu tiên"></label></div>'+
 '<label class="tiny" style="display:block;margin-top:8px">Chân trang<input class="input" id="cv1455-footer" maxlength="500" style="width:100%" value="CANVIO · CREATIVE WORKSPACE"></label>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn btn-soft sm" id="cv1455-preview">Cập nhật xem trước</button><button type="button" class="btn btn-soft sm" id="cv1455-save">Lưu mẫu</button><button type="button" class="btn btn-primary sm" id="cv1455-html">Xuất HTML offline</button><button type="button" class="btn btn-ghost sm" id="cv1455-json">Xuất JSON mẫu</button><label class="btn btn-ghost sm" for="cv1455-import">Nhập JSON</label><input type="file" id="cv1455-import" accept=".json,application/json" hidden></div>'+
 '<div id="cv1455-preview-wrap" style="margin-top:12px"><iframe id="cv1455-frame" title="Xem trước mẫu" sandbox="" style="width:100%;height:560px;border:1px solid var(--line,rgba(128,140,160,.2));border-radius:12px;background:#eef2f8"></iframe></div>'+
 '<div class="tiny" id="cv1455-out" role="status" aria-live="polite" style="margin-top:8px">Dữ liệu mẫu được lưu trên trình duyệt này; không tự đồng bộ qua thiết bị khác.</div>';
 var existing=page.querySelector('#cv145-card');if(existing&&existing.parentNode)existing.parentNode.insertBefore(card,existing.nextSibling);else page.appendChild(card);
 var $=function(sel){return card.querySelector(sel);},out=function(m){$('#cv1455-out').textContent=m;};
 function current(){
  var fields={};['title','subtitle','body','footer','stat1','stat2','stat3','label1','label2','label3'].forEach(function(k){fields[k]=$('#cv1455-'+k).value;});
  return exportItem($('#cv1455-key').value,fields,$('#cv1455-palette').value,$('#cv1455-name').value);
 }
 function refreshSaved(choose){
  var list=readSaved(),sel=$('#cv1455-saved'),keep=choose||sel.value;sel.replaceChildren();
  var first=document.createElement('option');first.value='';first.textContent='— Chưa chọn —';sel.appendChild(first);
  list.forEach(function(it){var o=document.createElement('option');o.value=it.id;o.textContent=it.name+' · '+TPL[it.key].label;sel.appendChild(o);});
  if(keep)sel.value=keep;
 }
 function loadItem(it){
  it=parseImport(JSON.stringify(it));$('#cv1455-key').value=it.key;$('#cv1455-palette').value=it.palette;$('#cv1455-name').value=it.name;
  Object.keys(it.fields).forEach(function(k){var el=$('#cv1455-'+k);if(el)el.value=it.fields[k];});
  preview();
 }
 function preview(){
  try{$('#cv1455-frame').srcdoc=renderHtml($('#cv1455-key').value,(function(){var x={};['title','subtitle','body','footer','stat1','stat2','stat3','label1','label2','label3'].forEach(function(k){x[k]=$('#cv1455-'+k).value;});return x;})(),$('#cv1455-palette').value);out('Đã cập nhật bản xem trước. Chưa lưu thay đổi.');return true;}
  catch(e){out(String(e&&e.message||e));return false;}
 }
 function dl(name,content,type){var u=URL.createObjectURL(new Blob([content],{type:type})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},4000);}
 $('#cv1455-preview').addEventListener('click',preview);
 ['key','palette'].forEach(function(k){$('#cv1455-'+k).addEventListener('change',preview);});
 $('#cv1455-save').addEventListener('click',function(){var item=current(),old=$('#cv1455-saved').value;if(old)item.id=old;var r=saveItem(item);if(!r.ok){out(r.reason);return;}refreshSaved(r.item.id);out('Đã lưu mẫu "'+r.item.name+'" trên trình duyệt này ('+r.count+'/'+MAX_SAVED+').');});
 $('#cv1455-load').addEventListener('click',function(){var id=$('#cv1455-saved').value;if(!id){out('Chọn một mẫu đã lưu trước.');return;}var a=readSaved(),it=a.filter(function(x){return x.id===id;})[0];if(!it){out('Không tìm thấy mẫu đã lưu.');refreshSaved();return;}loadItem(it);out('Đã nạp mẫu "'+it.name+'".');});
 $('#cv1455-html').addEventListener('click',function(){var it=current();dl('canvio-template-'+it.key+'.html',renderHtml(it.key,it.fields,it.palette),'text/html;charset=utf-8');out('Đã xuất HTML độc lập, không cần mạng.');});
 $('#cv1455-json').addEventListener('click',function(){var it=current();dl('canvio-template-'+it.key+'.json',JSON.stringify(it,null,2),'application/json');out('Đã xuất JSON mẫu để sao lưu/chia sẻ.');});
 $('#cv1455-import').addEventListener('change',function(){
  var file=this.files&&this.files[0];if(!file)return;if(file.size>65536){out('Tệp JSON vượt giới hạn 64 KB.');this.value='';return;}
  var reader=new FileReader();reader.onload=function(){try{var it=parseImport(reader.result);loadItem(it);var r=saveItem(it);if(r.ok){refreshSaved(r.item.id);out('Đã nhập và lưu mẫu "'+it.name+'".');}else out(r.reason);}catch(e){out(String(e&&e.message||e));}};
  reader.onerror=function(){out('Không đọc được tệp JSON.');};reader.readAsText(file);this.value='';
 });
 refreshSaved();preview();return true;
}
function ready(){try{mount();var p=document.querySelector('#page-assets');if(p&&!p.__cv1455Obs&&window.MutationObserver){p.__cv1455Obs=new MutationObserver(function(){if(!p.querySelector('#cv1455-card'))mount();});p.__cv1455Obs.observe(p,{childList:true});}}catch(e){if(window.console)console.warn('P145.5 mount',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){
 var html=renderHtml('business',{title:'<scr'+'ipt>alert(1)</scr'+'ipt>',body:'" onload="bad',subtitle:'Revenue & risk'},'navy');
 var smooth=renderHtml('social',{title:'A<>'},'invalid'),item=exportItem('hr',{title:'Hiring <b>'},'teal','Hiring pack'),parsed=parseImport(JSON.stringify(item)),bad=false;
 try{parseImport('{"format":"bad","version":1}');}catch(e){bad=true;}
 var long=normFields({title:'x'.repeat(700)}),hasNoRemote=!/(?:src|href)=["']?https?:|@import|url\(/i.test(html+smooth);
 return{
  fiveBuiltInTemplates:Object.keys(TPL).length===5,
  allTemplatesRenderHtml:Object.keys(TPL).every(function(k){return renderHtml(k,{},'navy').indexOf('<!doctype html>')===0;}),
  userHtmlEscaped:html.indexOf('&lt;script&gt;')>0&&html.indexOf('<scr'+'ipt')<0&&html.indexOf('onload=')<0,
  textEscapedAndBounded:html.indexOf('&amp;')>0&&long.title.length===MAX_TEXT,
  paletteWhitelisted:smooth.indexOf(PALETTES.navy.accent)>0,
  noExternalAssetsOrScripts:hasNoRemote&&html.indexOf('<script')<0&&smooth.indexOf('<scr'+'ipt')<0,
  portableSchemaRoundTrip:parsed.format===FORMAT&&parsed.key==='hr'&&parsed.palette==='teal'&&parsed.fields.title==='Hiring <b>',
  rejectsUnknownSchema:bad,
  htmlContainsVietnameseAndPrintCss:html.indexOf('lang="vi"')>0&&html.indexOf('@media print')>0
 };
}
window.CVTemplateFactoryP1455={version:'145.5.0',templates:TPL,palettes:PALETTES,renderHtml:renderHtml,exportItem:exportItem,parseImport:parseImport,readSaved:readSaved,saveItem:saveItem,mount:mount,tests:tests};
})();