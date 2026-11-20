/* P145.8 — original offline SVG illustration starter pack; no stock, model download or network. */
(function(){
'use strict';
if(window.CVOriginalVectorAssetsP1458)return;
var THEMES={
 ocean:{label:'Ocean',bg:'#eef5fb',ink:'#18344d',primary:'#337bb8',secondary:'#80b9cb',accent:'#f2b45b',soft:'#d7e8f2'},
 jade:{label:'Jade',bg:'#edf6f2',ink:'#183d35',primary:'#2d8873',secondary:'#8bc6ad',accent:'#e3a15a',soft:'#d6eee4'},
 plum:{label:'Plum',bg:'#f4eff8',ink:'#38294a',primary:'#8159a7',secondary:'#c2a7d8',accent:'#e6a56e',soft:'#e9def2'},
 ember:{label:'Ember',bg:'#fbf2eb',ink:'#493022',primary:'#c06b3c',secondary:'#e0ab83',accent:'#e6c45e',soft:'#f3dfcf'}
};
var GROUPS={
 business:{label:'Business',ids:['business-growth','strategy-target']},
 finance:{label:'Finance',ids:['finance-dashboard','budget-planning']},
 hr:{label:'People & HR',ids:['team-collaboration','talent-search']},
 creative:{label:'Creative & Social',ids:['social-campaign','remote-work']}
};
var ART=[
 {id:'business-growth',title:'Business Growth',group:'business',desc:'Bảng tăng trưởng và xu hướng tích cực',
  art:'<ellipse cx="326" cy="370" rx="218" ry="36" fill="var(--soft)"/><rect x="126" y="190" width="74" height="170" rx="14" fill="var(--secondary)"/><rect x="235" y="142" width="74" height="218" rx="14" fill="var(--primary)" opacity=".78"/><rect x="344" y="92" width="74" height="268" rx="14" fill="var(--primary)"/><path d="M118 220L235 155 300 184 448 68" fill="none" stroke="var(--ink)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M409 68h39v39" fill="none" stroke="var(--ink)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><circle cx="118" cy="220" r="13" fill="var(--accent)"/><circle cx="235" cy="155" r="13" fill="var(--accent)"/><circle cx="300" cy="184" r="13" fill="var(--accent)"/><circle cx="448" cy="68" r="13" fill="var(--accent)"/><rect x="468" y="144" width="94" height="126" rx="18" fill="var(--soft)"/><path d="M492 230l23-30 19 13 16-30" fill="none" stroke="var(--primary)" stroke-width="9" stroke-linecap="round"/>'
 },
 {id:'strategy-target',title:'Strategy Target',group:'business',desc:'Mục tiêu, định hướng và bước tiến',
  art:'<circle cx="310" cy="238" r="174" fill="var(--soft)"/><circle cx="310" cy="238" r="132" fill="none" stroke="var(--secondary)" stroke-width="20"/><circle cx="310" cy="238" r="84" fill="none" stroke="var(--primary)" stroke-width="20"/><circle cx="310" cy="238" r="34" fill="var(--accent)"/><path d="M308 238L498 48" stroke="var(--ink)" stroke-width="16" stroke-linecap="round"/><path d="M448 48h50v50" fill="none" stroke="var(--ink)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="M115 372h390" stroke="var(--ink)" stroke-width="14" stroke-linecap="round"/><rect x="115" y="400" width="390" height="28" rx="14" fill="var(--secondary)" opacity=".55"/>'
 },
 {id:'finance-dashboard',title:'Finance Dashboard',group:'finance',desc:'Báo cáo tài chính và phân bổ',
  art:'<rect x="86" y="74" width="468" height="324" rx="28" fill="var(--soft)" stroke="var(--ink)" stroke-width="10"/><path d="M86 140h468" stroke="var(--ink)" stroke-width="10"/><circle cx="126" cy="108" r="10" fill="var(--accent)"/><circle cx="160" cy="108" r="10" fill="var(--secondary)"/><circle cx="194" cy="108" r="10" fill="var(--primary)"/><path d="M168 300a92 92 0 0 1 184 0" fill="none" stroke="var(--secondary)" stroke-width="34" stroke-linecap="round"/><path d="M168 300a92 92 0 0 1 133-82" fill="none" stroke="var(--primary)" stroke-width="34" stroke-linecap="round"/><path d="M260 300l75-82" stroke="var(--ink)" stroke-width="12" stroke-linecap="round"/><circle cx="260" cy="300" r="17" fill="var(--accent)"/><rect x="390" y="212" width="24" height="108" rx="9" fill="var(--primary)"/><rect x="434" y="176" width="24" height="144" rx="9" fill="var(--secondary)"/><rect x="478" y="150" width="24" height="170" rx="9" fill="var(--accent)"/>'
 },
 {id:'budget-planning',title:'Budget Planning',group:'finance',desc:'Ngân sách và kế hoạch chi tiêu',
  art:'<rect x="100" y="100" width="440" height="286" rx="28" fill="var(--soft)" stroke="var(--ink)" stroke-width="10"/><rect x="100" y="142" width="440" height="68" fill="var(--primary)"/><path d="M100 210h440" stroke="var(--ink)" stroke-width="8"/><rect x="350" y="238" width="190" height="82" rx="15" fill="var(--accent)"/><circle cx="390" cy="279" r="12" fill="var(--ink)"/><path d="M138 258h152M138 300h110M138 342h188" stroke="var(--secondary)" stroke-width="15" stroke-linecap="round"/><circle cx="455" cy="92" r="48" fill="var(--secondary)"/><path d="M455 66v28l20 13" stroke="var(--ink)" stroke-width="8" stroke-linecap="round"/>'
 },
 {id:'team-collaboration',title:'Team Collaboration',group:'hr',desc:'Đội ngũ cùng làm việc và phối hợp',
  art:'<ellipse cx="320" cy="400" rx="230" ry="28" fill="var(--soft)"/><circle cx="207" cy="150" r="52" fill="var(--accent)"/><circle cx="320" cy="118" r="58" fill="var(--secondary)"/><circle cx="435" cy="153" r="52" fill="var(--primary)"/><path d="M118 342c0-82 36-128 89-128s89 46 89 128" fill="var(--secondary)"/><path d="M218 350c0-98 40-154 102-154s102 56 102 154" fill="var(--primary)"/><path d="M346 342c0-82 36-128 89-128s89 46 89 128" fill="var(--accent)"/><path d="M242 270l55 38 83-83" fill="none" stroke="var(--ink)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><circle cx="380" cy="225" r="20" fill="var(--ink)"/>'
 },
 {id:'talent-search',title:'Talent Search',group:'hr',desc:'Tìm kiếm và kết nối nhân tài',
  art:'<circle cx="280" cy="204" r="112" fill="var(--soft)"/><circle cx="280" cy="165" r="46" fill="var(--accent)"/><path d="M190 315c10-67 42-101 90-101s80 34 90 101" fill="var(--primary)"/><circle cx="420" cy="290" r="76" fill="none" stroke="var(--ink)" stroke-width="18"/><path d="M474 346l66 66" stroke="var(--ink)" stroke-width="22" stroke-linecap="round"/><path d="M389 290l21 21 42-48" fill="none" stroke="var(--secondary)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>'
 },
 {id:'social-campaign',title:'Social Campaign',group:'creative',desc:'Truyền thông và nội dung sáng tạo',
  art:'<rect x="124" y="90" width="330" height="290" rx="26" fill="var(--soft)" stroke="var(--ink)" stroke-width="10"/><path d="M124 158h330" stroke="var(--ink)" stroke-width="10"/><circle cx="164" cy="124" r="9" fill="var(--accent)"/><circle cx="194" cy="124" r="9" fill="var(--secondary)"/><path d="M200 298l73-82 50 48 70-88" fill="none" stroke="var(--primary)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="M370 176h23v24" fill="none" stroke="var(--primary)" stroke-width="12" stroke-linecap="round"/><path d="M190 338h194" stroke="var(--secondary)" stroke-width="14" stroke-linecap="round"/><circle cx="486" cy="134" r="58" fill="var(--accent)"/><path d="M464 105l48 29-48 29z" fill="var(--ink)"/>'
 },
 {id:'remote-work',title:'Remote Work',group:'creative',desc:'Không gian làm việc số từ xa',
  art:'<rect x="110" y="84" width="420" height="260" rx="24" fill="var(--soft)" stroke="var(--ink)" stroke-width="12"/><rect x="136" y="112" width="368" height="204" rx="12" fill="var(--secondary)" opacity=".6"/><path d="M64 384h512l-42 42H106z" fill="var(--ink)"/><circle cx="320" cy="204" r="49" fill="var(--accent)"/><path d="M236 290c12-52 39-76 84-76s72 24 84 76" fill="var(--primary)"/><path d="M190 158l38-22 25 25M450 156l-32-22-26 25" fill="none" stroke="var(--ink)" stroke-width="10" stroke-linecap="round"/>'
 }
};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function svg(id,theme){
 var a=ART.filter(function(x){return x.id===id;})[0],p=THEMES[theme]||THEMES.ocean;
 if(!a)throw new Error('Minh họa không tồn tại.');
 var inner=a.art.replace(/var\(--([a-z]+)\)/g,function(m,k){return p[k]||p.ink;});
 return '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" role="img" aria-label="'+esc(a.title)+'"><rect width="640" height="480" rx="24" fill="'+p.bg+'"/>'+inner+'</svg>';
}
function sprite(theme){
 var p=THEMES[theme]||THEMES.ocean;
 return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none">'+ART.map(function(a){return'<symbol id="canvio-art-'+a.id+'" viewBox="0 0 640 480">'+a.art.replace(/var\(--([a-z]+)\)/g,function(m,k){return p[k]||p.ink;})+'</symbol>';}).join('')+'</svg>';
}
function contactSheet(theme){
 var p=THEMES[theme]||THEMES.ocean,cellW=320,cellH=264,width=cellW*2,height=cellH*4+54;
 var nodes=ART.map(function(a,i){var x=(i%2)*cellW,y=Math.floor(i/2)*cellH+48,inner=a.art.replace(/var\(--([a-z]+)\)/g,function(m,k){return p[k]||p.ink;});return'<g transform="translate('+x+' '+y+')"><rect x="12" y="8" width="296" height="238" rx="18" fill="'+p.panel+'"/><g transform="translate(28 22) scale(.41 .41)">'+inner+'</g><text x="160" y="232" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="'+p.ink+'">'+esc(a.title)+'</text></g>';}).join('');
 return'<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><rect width="100%" height="100%" fill="'+p.bg+'"/><text x="24" y="32" font-family="Arial,sans-serif" font-size="20" font-weight="700" fill="'+p.ink+'">CANVIO Original Vector Pack · P145.8</text>'+nodes+'</svg>';
}
function download(name,value){var u=URL.createObjectURL(new Blob([value],{type:'image/svg+xml;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},4000);}
function mount(){
 var page=document.querySelector('#page-assets');if(!page||page.querySelector('#cv1458-card'))return false;
 var card=document.createElement('section');card.id='cv1458-card';card.className='card';card.style.marginTop='12px';
 card.innerHTML='<div class="cardTop"><h3>Original Vector Assets · bộ minh họa SVG CANVIO (P145.8)</h3><span class="sub">8 minh họa gốc · offline · không phải stock</span></div>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:end"><label class="tiny">Danh mục<select class="input" id="cv1458-cat"><option value="all">Tất cả</option>'+Object.keys(GROUPS).map(function(k){return'<option value="'+k+'">'+GROUPS[k].label+'</option>';}).join('')+'</select></label><label class="tiny">Bảng màu<select class="input" id="cv1458-theme">'+Object.keys(THEMES).map(function(k){return'<option value="'+k+'">'+THEMES[k].label+'</option>';}).join('')+'</select></label><label class="tiny">Tìm minh họa<input class="input" id="cv1458-search" placeholder="Tìm tên minh họa…"></label><button type="button" class="btn btn-soft sm" id="cv1458-sprite">Tải Sprite</button><button type="button" class="btn btn-ghost sm" id="cv1458-sheet">Tải bảng tổng hợp</button></div>'+
 '<div id="cv1458-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-top:12px"></div>'+
 '<div class="row" style="gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px;padding:10px;border:1px solid var(--line,rgba(128,140,160,.2));border-radius:10px"><div id="cv1458-selected" style="width:min(100%,320px);aspect-ratio:4/3;display:grid;place-items:center;background:#f4f6fa;border-radius:10px;overflow:hidden"></div><div style="flex:1;min-width:170px"><b id="cv1458-title">Chọn minh họa</b><div class="tiny" id="cv1458-desc">Tải SVG để nhập vào các bề mặt thiết kế hỗ trợ.</div></div><button type="button" class="btn btn-primary sm" id="cv1458-one" disabled>Tải SVG</button></div>'+
 '<div class="tiny" id="cv1458-out" role="status" aria-live="polite" style="margin-top:8px">Tài sản vector gốc CANVIO; không chứa ảnh ngoài, font nhúng, script hoặc yêu cầu tải từ xa.</div>';
 var after=page.querySelector('#cv1457-card')||page.querySelector('#cv1456-card')||page.querySelector('#cv1455-card')||page.querySelector('#cv145-card');
 if(after&&after.parentNode)after.parentNode.insertBefore(card,after.nextSibling);else page.appendChild(card);
 var $=function(s){return card.querySelector(s);},selected=null;
 function filtered(){
  var cat=$('#cv1458-cat').value,q=$('#cv1458-search').value.trim().toLowerCase();
  return ART.filter(function(a){return(cat==='all'||a.group===cat)&&(!q||(a.title+' '+a.id+' '+a.desc+' '+GROUPS[a.group].label).toLowerCase().indexOf(q)>=0);});
 }
 function draw(){
  var root=$('#cv1458-grid'),theme=$('#cv1458-theme').value;root.replaceChildren();
  filtered().forEach(function(a){
   var button=document.createElement('button');button.type='button';button.className='btn btn-ghost';button.style.cssText='display:grid;gap:6px;text-align:left;padding:8px;border:1px solid var(--line,rgba(128,140,160,.2));border-radius:12px';
   var im=document.createElement('div');im.style.cssText='width:100%;aspect-ratio:4/3;overflow:hidden;border-radius:8px';im.innerHTML=svg(a.id,theme);
   var name=document.createElement('b');name.textContent=a.title;
   var desc=document.createElement('span');desc.className='tiny';desc.textContent=a.desc;
   button.appendChild(im);button.appendChild(name);button.appendChild(desc);
   button.setAttribute('data-cv1458-id',a.id);button.addEventListener('click',function(){selected=a;$('#cv1458-selected').innerHTML=svg(a.id,$('#cv1458-theme').value);$('#cv1458-title').textContent=a.title;$('#cv1458-desc').textContent=a.desc+' · '+GROUPS[a.group].label;$('#cv1458-one').disabled=false;});
   root.appendChild(button);
  });
 }
 $('#cv1458-cat').addEventListener('change',draw);$('#cv1458-search').addEventListener('input',draw);
 $('#cv1458-theme').addEventListener('change',function(){draw();if(selected)$('#cv1458-selected').innerHTML=svg(selected.id,this.value);});
 $('#cv1458-one').addEventListener('click',function(){if(!selected)return;download('canvio-illustration-'+selected.id+'.svg',svg(selected.id,$('#cv1458-theme').value));$('#cv1458-out').textContent='Đã xuất '+selected.title+'.svg';});
 $('#cv1458-sprite').addEventListener('click',function(){download('canvio-original-vector-sprite.svg',sprite($('#cv1458-theme').value));$('#cv1458-out').textContent='Đã xuất sprite gồm '+ART.length+' symbol.';});
 $('#cv1458-sheet').addEventListener('click',function(){download('canvio-original-vector-contact-sheet.svg',contactSheet($('#cv1458-theme').value));$('#cv1458-out').textContent='Đã xuất bảng tổng hợp vector.';});
 draw();return true;
}
function ready(){try{mount();var p=document.querySelector('#page-assets');if(p&&!p.__cv1458Obs&&window.MutationObserver){p.__cv1458Obs=new MutationObserver(function(){if(!p.querySelector('#cv1458-card'))mount();});p.__cv1458Obs.observe(p,{childList:true});}}catch(e){if(window.console)console.warn('P145.8 vector pack',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){
 var ids=ART.map(function(x){return x.id;}),one=svg(ids[0]),sp=sprite('jade'),sheet=contactSheet('plum'),bad=false;
 try{svg('unknown');}catch(e){bad=true;}
 return{eightOriginalIllustrations:ART.length===8,uniqueAssetIds:new Set(ids).size===ART.length,fourCategories:Object.keys(GROUPS).length===4,fourThemes:Object.keys(THEMES).length===4,eachCategoryHasTwoAssets:Object.keys(GROUPS).every(function(k){return GROUPS[k].ids.length===2;}),standaloneSvgSafe:one.indexOf('<svg')===0&&one.indexOf('<script')<0&&one.indexOf('https://')<0,spriteContainsAllSymbols:ids.every(function(id){return sp.indexOf('id="canvio-art-'+id+'"')>=0;}),contactSheetContainsAllTitles:ART.every(function(a){return sheet.indexOf(esc(a.title))>=0;}),paletteResolvesNoPlaceholders:!/(?:var\(--|undefined)/.test(one),unknownIllustrationRejected:bad,noRemoteAssets:!/(?:href|src)=["']?https?:|@import|url\(/i.test(one+sp+sheet)};
}
window.CVOriginalVectorAssetsP1458={version:'145.8.0',themes:THEMES,groups:GROUPS,assets:ART,svg:svg,sprite:sprite,contactSheet:contactSheet,mount:mount,tests:tests};
})();