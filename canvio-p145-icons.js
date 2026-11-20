/* P145.6 — Original offline SVG icon pack. All paths are first-party CANVIO vector work; no remote assets. */
(function(){
'use strict';
if(window.CVOriginalIconPackP1456)return;
var CATS={
 business:{label:'Kinh doanh',glyphs:['briefcase','handshake','target','calendar','clipboard']},
 finance:{label:'Tài chính',glyphs:['chart','wallet','receipt','calculator','coins']},
 hr:{label:'Nhân sự',glyphs:['people','user-plus','award','id-card','heart']},
 social:{label:'Social / Media',glyphs:['megaphone','video','image','play','layout']},
 utility:{label:'Tiện ích',glyphs:['search','settings','check','shield-check','file-text']}
};
var ICONS=[
 {id:'briefcase',label:'Cặp công việc',cat:'business',d:'M3 8.5h18v11H3z M8 8.5V5h8v3.5 M3 12h18 M10 12v2h4v-2'},
 {id:'handshake',label:'Hợp tác',cat:'business',d:'M3 9l4-3 4 2 2-1 4 1 4 3-3 4-3-1-3 2-3-2-3 1-3-3z M7 6l-2-2-3 3 2 2 M17 6l2-2 3 3-2 2 M8 12l3 3 2-1 2 1 3-3'},
 {id:'target',label:'Mục tiêu',cat:'business',d:'M12 3a9 9 0 1 0 9 9 M12 7a5 5 0 1 0 5 5 M12 12l8-8 M17 4h3v3'},
 {id:'calendar',label:'Lịch',cat:'business',d:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 9h16 M8 13h3 M8 17h3 M14 13h2'},
 {id:'clipboard',label:'Bảng công việc',cat:'business',d:'M8 5H5v16h14V5h-3 M9 3h6v4H9z M8 12h8 M8 16h8'},
 {id:'chart',label:'Biểu đồ tăng trưởng',cat:'finance',d:'M4 20V4 M4 20h17 M7 16l4-5 3 2 6-8 M16 5h4v4'},
 {id:'wallet',label:'Ví',cat:'finance',d:'M4 6h15a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M3 8l2-3h12 M15 11h6v4h-6a2 2 0 0 1 0-4z M17 13h.01'},
 {id:'receipt',label:'Hóa đơn',cat:'finance',d:'M6 3l2 2 2-2 2 2 2-2 2 2 2-2v18l-2-2-2 2-2-2-2 2-2-2-2 2z M9 9h6 M9 13h6 M9 17h3'},
 {id:'calculator',label:'Máy tính',cat:'finance',d:'M5 3h14v18H5z M8 7h8v3H8z M8 14h2 M14 14h2 M8 18h2 M14 18h2'},
 {id:'coins',label:'Đồng xu',cat:'finance',d:'M12 4c4 0 7 1.3 7 3s-3 3-7 3-7-1.3-7-3 3-3 7-3z M5 7v5c0 1.7 3 3 7 3s7-1.3 7-3V7 M5 12v5c0 1.7 3 3 7 3s7-1.3 7-3v-5'},
 {id:'people',label:'Đội ngũ',cat:'hr',d:'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M17 10a2.5 2.5 0 1 0 0-5 M3 20c0-3.2 2.5-5 6-5s6 1.8 6 5 M15 15c3.5-.2 6 1.5 6 4'},
 {id:'user-plus',label:'Thêm nhân sự',cat:'hr',d:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M3 20c0-3.4 2.5-5.5 6-5.5s6 2.1 6 5.5 M18 8v6 M15 11h6'},
 {id:'award',label:'Thành tích',cat:'hr',d:'M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M8 14l-2 7 6-3 6 3-2-7'},
 {id:'id-card',label:'Thẻ nhân sự',cat:'hr',d:'M3 5h18v14H3z M8 12a2.3 2.3 0 1 0 0-4.6A2.3 2.3 0 0 0 8 12z M5 16c.7-1.5 1.7-2 3-2s2.3.5 3 2 M13 9h5 M13 13h5'},
 {id:'heart',label:'Phúc lợi',cat:'hr',d:'M12 20S4 15 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11z'},
 {id:'megaphone',label:'Truyền thông',cat:'social',d:'M3 10v4h4l11 5V5L7 10z M7 14l2 6h4l-3-5 M18 9h3 M18 12h3 M18 15h3'},
 {id:'video',label:'Video',cat:'social',d:'M3 6h13v12H3z M16 10l5-3v10l-5-3z M7 10h4'},
 {id:'image',label:'Hình ảnh',cat:'social',d:'M3 4h18v16H3z M4 17l5-5 4 4 3-3 4 4 M8 9h.01 M15 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'},
 {id:'play',label:'Phát',cat:'social',d:'M6 4l13 8-13 8z'},
 {id:'layout',label:'Bố cục',cat:'social',d:'M3 4h18v16H3z M3 10h18 M10 10v10 M15 10v10'},
 {id:'search',label:'Tìm kiếm',cat:'utility',d:'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15z M16 16l5 5'},
 {id:'settings',label:'Thiết lập',cat:'utility',d:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9L7 7 M17 17l2.1 2.1 M19.1 4.9L17 7 M7 17l-2.1 2.1'},
 {id:'check',label:'Hoàn tất',cat:'utility',d:'M4 12l5 5L20 6'},
 {id:'shield-check',label:'Bảo mật',cat:'utility',d:'M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z M8 12l3 3 5-6'},
 {id:'file-text',label:'Tài liệu',cat:'utility',d:'M6 3h8l4 4v14H6z M14 3v5h5 M9 12h6 M9 16h6'}
];
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function iconSvg(id,color){
 var item=ICONS.filter(function(x){return x.id===id;})[0];if(!item)throw new Error('Icon không tồn tại.');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="'+(color==='ink'?'#14243a':'#2457a7')+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="'+esc(item.label)+'"><path d="'+item.d+'"/></svg>';
}
function sprite(){
 return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none">'+ICONS.map(function(x){return'<symbol id="canvio-'+x.id+'" viewBox="0 0 24 24"><path d="'+x.d+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>';}).join('')+'</svg>';
}
function standaloneSheet(){
 var cols=4,cellW=180,cellH=118,rows=Math.ceil(ICONS.length/cols),width=cols*cellW,height=rows*cellH+50;
 var body=ICONS.map(function(x,i){var cx=(i%cols)*cellW+cellW/2,cy=Math.floor(i/cols)*cellH+46;return'<g transform="translate('+cx+' '+cy+')"><g transform="translate(-12 -18)"><path d="'+x.d+'" fill="none" stroke="#2457a7" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g><text y="34" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#14243a">'+esc(x.label)+'</text></g>';}).join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><rect width="100%" height="100%" fill="#f4f6fa"/><text x="24" y="30" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#14243a">CANVIO Original Icon Pack · P145.6</text>'+body+'</svg>';
}
function download(name,text){
 var url=URL.createObjectURL(new Blob([text],{type:'image/svg+xml;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},4000);
}
function mount(){
 var page=document.querySelector('#page-assets');if(!page||page.querySelector('#cv1456-card'))return false;
 var card=document.createElement('section');card.id='cv1456-card';card.className='card';card.style.marginTop='12px';
 card.innerHTML='<div class="cardTop"><h3>Original Icon Pack · bộ SVG CANVIO (P145.6)</h3><span class="sub">25 biểu tượng vector tự tạo · offline · không dùng stock</span></div>'+
 '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:end"><label class="tiny">Danh mục<select class="input" id="cv1456-cat"><option value="all">Tất cả</option>'+Object.keys(CATS).map(function(k){return'<option value="'+k+'">'+CATS[k].label+'</option>';}).join('')+'</select></label><label class="tiny">Tìm biểu tượng<input class="input" id="cv1456-search" placeholder="Tìm tên biểu tượng…"></label><button type="button" class="btn btn-soft sm" id="cv1456-sprite">Tải SVG Sprite</button><button type="button" class="btn btn-ghost sm" id="cv1456-sheet">Tải bảng tổng hợp</button></div>'+
 '<div id="cv1456-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px;margin-top:12px"></div>'+
 '<div class="row" style="gap:12px;align-items:center;flex-wrap:wrap;margin-top:12px;padding:10px;border:1px solid var(--line,rgba(128,140,160,.2));border-radius:10px"><div id="cv1456-selected" style="width:68px;height:68px;display:grid;place-items:center;background:#f4f6fa;border-radius:10px"></div><div style="flex:1;min-width:160px"><b id="cv1456-title">Chọn một biểu tượng</b><div class="tiny" id="cv1456-meta">Có thể tải từng SVG để nhập vào Asset Library.</div></div><button type="button" class="btn btn-soft sm" id="cv1456-one" disabled>Tải SVG này</button><button type="button" class="btn btn-ghost sm" id="cv1456-copy" disabled>Sao chép SVG</button></div>'+
 '<div class="tiny" id="cv1456-out" role="status" aria-live="polite" style="margin-top:8px">SVG không có script, font nhúng, ảnh ngoài hoặc URL từ xa. Tải SVG để dùng trong các thiết kế khác.</div>';
 var after=page.querySelector('#cv1455-card')||page.querySelector('#cv145-card');
 if(after&&after.parentNode)after.parentNode.insertBefore(card,after.nextSibling);else page.appendChild(card);
 var $=function(sel){return card.querySelector(sel);},selected=null;
 function filtered(){
  var cat=$('#cv1456-cat').value,q=$('#cv1456-search').value.trim().toLowerCase();
  return ICONS.filter(function(x){return(cat==='all'||x.cat===cat)&&(!q||(x.label+' '+x.id+' '+CATS[x.cat].label).toLowerCase().indexOf(q)>=0);});
 }
 function draw(){
  var root=$('#cv1456-grid');root.replaceChildren();
  filtered().forEach(function(x){
   var b=document.createElement('button');b.type='button';b.className='btn btn-ghost';b.style.cssText='display:grid;gap:6px;justify-items:center;padding:10px;min-height:82px';
   b.setAttribute('data-cv1456-id',x.id);b.setAttribute('aria-label',x.label);
   b.innerHTML=iconSvg(x.id)+'<span class="tiny">'+esc(x.label)+'</span>';
   if(selected===x.id)b.style.outline='2px solid var(--accent,#2457a7)';
   b.addEventListener('click',function(){selected=x.id;$('#cv1456-selected').innerHTML=iconSvg(x.id);$('#cv1456-title').textContent=x.label;$('#cv1456-meta').textContent=CATS[x.cat].label+' · 24×24 · SVG path';$('#cv1456-one').disabled=false;$('#cv1456-copy').disabled=false;draw();});
   root.appendChild(b);
  });
 }
 $('#cv1456-cat').addEventListener('change',draw);$('#cv1456-search').addEventListener('input',draw);
 $('#cv1456-one').addEventListener('click',function(){if(!selected)return;download('canvio-'+selected+'.svg',iconSvg(selected));$('#cv1456-out').textContent='Đã xuất SVG: canvio-'+selected+'.svg';});
 $('#cv1456-copy').addEventListener('click',function(){if(!selected)return;var s=iconSvg(selected);if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(function(){$('#cv1456-out').textContent='Đã sao chép SVG.';},function(){$('#cv1456-out').textContent='Không thể sao chép tại ngữ cảnh này; hãy tải SVG.';});else $('#cv1456-out').textContent='Clipboard không khả dụng; hãy tải SVG.';});
 $('#cv1456-sprite').addEventListener('click',function(){download('canvio-original-icons-sprite.svg',sprite());$('#cv1456-out').textContent='Đã xuất SVG Sprite gồm '+ICONS.length+' symbol. Dùng <use href="#canvio-id"> trong tài liệu cùng sprite.';});
 $('#cv1456-sheet').addEventListener('click',function(){download('canvio-original-icons-sheet.svg',standaloneSheet());$('#cv1456-out').textContent='Đã xuất bảng tổng hợp SVG.';});
 draw();return true;
}
function ready(){try{mount();var p=document.querySelector('#page-assets');if(p&&!p.__cv1456Obs&&window.MutationObserver){p.__cv1456Obs=new MutationObserver(function(){if(!p.querySelector('#cv1456-card'))mount();});p.__cv1456Obs.observe(p,{childList:true});}}catch(e){if(window.console)console.warn('P145.6 icon pack',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){
 var ids=ICONS.map(function(x){return x.id;}),svg=iconSvg('briefcase'),sp=sprite(),sheet=standaloneSheet();
 return{twentyFiveOriginalIcons:ICONS.length===25,allIdsUnique:new Set(ids).size===ids.length,fiveCategories:Object.keys(CATS).length===5,allPathsPresent:ICONS.every(function(x){return /^[a-z0-9-]+$/.test(x.id)&&/^[A-Za-z0-9 .,+\-]+$/.test(x.d);}),standaloneSvgValid:svg.indexOf('<svg')===0&&svg.indexOf('<path')>0&&svg.indexOf('https://')<0&&svg.indexOf('<script')<0,spriteHasEverySymbol:ids.every(function(id){return sp.indexOf('id="canvio-'+id+'"')>=0;}),sheetIncludesAllLabels:ICONS.every(function(x){return sheet.indexOf(esc(x.label))>=0;}),noExternalAssets:!/(?:href|src)=["']?https?:|@import|url\(/i.test(svg+sp+sheet),unknownIconRejected:(function(){try{iconSvg('nope');return false;}catch(e){return true;}})()};
}
window.CVOriginalIconPackP1456={version:'145.6.0',categories:CATS,icons:ICONS,iconSvg:iconSvg,sprite:sprite,standaloneSheet:standaloneSheet,mount:mount,tests:tests};
})();