/* P166 · Brief-to-Landing: HTML responsive tự chứa từ Shared Core + Asset Library, xuất HTML/ZIP offline; không phải dịch vụ hosting hay AI generation. */
(function(){
'use strict';
if(window.CVLandingStudioP166)return;
var KEY='websiteLanding';
function project(create){var C=window.CVCreativeCore;if(!C)return null;var p=C.active||null;if(!p&&create&&C.create)p=C.create({name:'Landing Page'});return p;}
function read(){var p=project(false);return p&&p.documents&&p.documents[KEY]||null;}
function save(meta){var p=project(true),C=window.CVCreativeCore;if(!p)return false;p.documents=p.documents||{};p.documents[KEY]=meta;try{C.capture&&C.capture('project');}catch(e){}return true;}
function clean(s,n){return String(s==null?'':s).replace(/\s+/g,' ').trim().slice(0,n);}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function context(){try{return window.CVCreativeCore&&CVCreativeCore.context?CVCreativeCore.context():{};}catch(e){return{};}}
function assets(){try{return window.CV&&CV.assets&&CV.assets.list?CV.assets.list():[];}catch(e){return[];}}
function safeImageData(value){value=String(value||'');if(value.length>12*1024*1024)return'';return /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value)?value:'';}
function build(options){options=options||{};var ctx=context(),brief=clean(options.brief||ctx.brief,1600),name=clean(options.name||ctx.projectName||'Landing Page',80),headline=clean(options.headline||brief.split(/[.!?\n]/)[0]||name,100),sub=clean(options.subheadline||brief,300),cta=clean(options.cta||'Bắt đầu ngay',40),color=/^#[0-9a-f]{6}$/i.test(options.color||'')?options.color:'#2456d8',selected=assets().find(a=>String(a.id)===String(options.heroAssetId)),hero=safeImageData(selected&&selected.data);if(!hero)selected=null;var html='<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="'+esc(sub.slice(0,155))+'"><title>'+esc(name)+'</title><style>:root{--brand:'+color+';font-family:Inter,system-ui,Arial,sans-serif;color:#172033;background:#f7f8fb}*{box-sizing:border-box}body{margin:0}header{display:flex;justify-content:space-between;align-items:center;padding:22px max(6vw,20px)}.logo{font-weight:800}a{color:inherit;text-decoration:none}.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:36px;align-items:center;padding:8vh max(6vw,20px);min-height:68vh}.eyebrow{color:var(--brand);font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:12px}h1{font-size:clamp(38px,6vw,72px);line-height:1.03;letter-spacing:-.045em;margin:14px 0}p{line-height:1.7;color:#586174}.cta{display:inline-block;background:var(--brand);color:#fff;padding:14px 22px;border-radius:999px;font-weight:700;margin-top:14px}.visual{min-height:320px;border-radius:28px;background:linear-gradient(135deg,#dbeafe,#f5eafe);overflow:hidden;display:grid;place-items:center}.visual img{width:100%;height:100%;min-height:320px;object-fit:cover}.features{padding:65px max(6vw,20px);background:#fff}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.tile{padding:24px;border:1px solid #e8eaf0;border-radius:18px}@media(max-width:760px){.hero{grid-template-columns:1fr;padding-top:40px}.grid{grid-template-columns:1fr}.visual{min-height:230px}}@media(prefers-reduced-motion:no-preference){.hero{animation:rise .55s ease both}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}}</style></head><body><header><a class="logo" href="#">'+esc(name)+'</a><a href="#contact">Liên hệ</a></header><main><section class="hero"><div><div class="eyebrow">Giới thiệu</div><h1>'+esc(headline)+'</h1><p>'+esc(sub)+'</p><a class="cta" href="#contact">'+esc(cta)+'</a></div><div class="visual">'+(hero?'<img alt="" src="'+hero+'">':'<div style="padding:36px;text-align:center"><strong>'+esc(name)+'</strong><p>Thêm ảnh hero từ Image Library để hoàn thiện trang</p></div>')+'</div></section><section class="features"><div class="eyebrow">Giá trị chính</div><h2>'+esc(name)+'</h2><div class="grid"><article class="tile"><b>01 · Mục tiêu</b><p>'+esc(clean(ctx.goal||'Truyền tải thông điệp rõ ràng',180))+'</p></article><article class="tile"><b>02 · Kênh</b><p>'+esc(clean(ctx.channel||'Web / đa kênh',100))+'</p></article><article class="tile"><b>03 · Hành động</b><p>'+esc(brief||'Cập nhật nội dung từ brief dự án.')+'</p></article></div></section><section id="contact" class="features"><h2>Sẵn sàng bắt đầu?</h2><p>'+esc(cta)+'</p></section></main><footer style="padding:24px max(6vw,20px);color:#667085">© '+new Date().getFullYear()+' '+esc(name)+' · Created with CANVIO</footer></body></html>';var meta={version:1,name:name,headline:headline,cta:cta,color:color,heroAssetId:selected?String(selected.id):null,updatedAt:Date.now(),brief:brief};return{html:html,meta:meta,assetIds:selected?[String(selected.id)]:[]};}
function buildFromCore(options){var r=build(options);if(!save(r.meta))throw new Error('Không lưu được website brief vào Shared Core.');r.assetIds.forEach(id=>{try{window.CVCreativeCore.linkAsset&&window.CVCreativeCore.linkAsset(id);}catch(e){}});return r;}
async function exportZip(options){if(!window.CVZip||typeof window.CVZip.build!=='function')throw new Error('CVZip chưa sẵn sàng; có thể xuất HTML thay thế.');var r=buildFromCore(options),files=[{name:'index.html',data:r.html},{name:'CANVIO-LANDING-MANIFEST.json',data:JSON.stringify({format:'CANVIO_P166_LANDING',version:1,project:context().projectName||'',assetIds:r.assetIds,updatedAt:r.meta.updatedAt},null,2)},{name:'README.md',data:'# CANVIO Landing Package\n\nMở index.html. Gói này không chứa backend/form service; liên kết CTA cần cấu hình trước khi phát hành.'}];return{blob:await window.CVZip.build(files),html:r.html,meta:r.meta};}
function landingCssRules(scope,color){
  scope=String(scope||'');
  if(!/^cv-p166-[a-z0-9-]{6,48}$/.test(scope))throw new Error('Phạm vi CSS Landing Page không hợp lệ.');
  color=/^#[0-9a-f]{6}$/i.test(color||'')?color:'#2456d8';
  var root='.'+scope,media='(max-width: 760px)';
  return [
    {selector:root,style:{'font-family':'Inter,system-ui,Arial,sans-serif',color:'#172033',background:'#f7f8fb','min-width':'0'}},
    {selector:root+' *',style:{'box-sizing':'border-box'}},
    {selector:root+' header',style:{display:'flex','justify-content':'space-between','align-items':'center',padding:'22px max(6vw,20px)'}},
    {selector:root+' .logo',style:{'font-weight':'800'}},
    {selector:root+' a',style:{color:'inherit','text-decoration':'none'}},
    {selector:root+' .hero',style:{display:'grid','grid-template-columns':'1.05fr .95fr',gap:'36px','align-items':'center',padding:'8vh max(6vw,20px)','min-height':'68vh'}},
    {selector:root+' .eyebrow',style:{color:color,'font-weight':'700','letter-spacing':'.1em','text-transform':'uppercase','font-size':'12px'}},
    {selector:root+' h1',style:{'font-size':'clamp(38px,6vw,72px)','line-height':'1.03','letter-spacing':'-.045em',margin:'14px 0'}},
    {selector:root+' p',style:{'line-height':'1.7',color:'#586174'}},
    {selector:root+' .cta',style:{display:'inline-block',background:color,color:'#fff',padding:'14px 22px','border-radius':'999px','font-weight':'700','margin-top':'14px'}},
    {selector:root+' .visual',style:{'min-height':'320px','border-radius':'28px',background:'linear-gradient(135deg,#dbeafe,#f5eafe)',overflow:'hidden',display:'grid','place-items':'center'}},
    {selector:root+' .visual img',style:{width:'100%',height:'100%','min-height':'320px','object-fit':'cover'}},
    {selector:root+' .features',style:{padding:'65px max(6vw,20px)',background:'#fff'}},
    {selector:root+' .grid',style:{display:'grid','grid-template-columns':'repeat(3,minmax(0,1fr))',gap:'18px'}},
    {selector:root+' .tile',style:{padding:'24px',border:'1px solid #e8eaf0','border-radius':'18px'}},
    {selector:root+' footer',style:{padding:'24px max(6vw,20px)',color:'#667085'}},
    {selector:root+' .hero',style:{'grid-template-columns':'1fr','padding-top':'40px'},media:media},
    {selector:root+' .grid',style:{'grid-template-columns':'1fr'},media:media},
    {selector:root+' .visual',style:{'min-height':'230px'},media:media},
    {selector:root+' .visual img',style:{'min-height':'230px'},media:media}
  ];
}
function bodyMarkup(html){
  var m=String(html||'').match(/<body[^>]*>([\\s\\S]*?)<\\/body>/i);
  if(!m)throw new Error('Không trích xuất được phần nội dung Landing Page.');
  return m[1];
}
async function sendToWebsite(options){
  if(window.CV&&CV.go)CV.go('webEngine');
  var ed=window.CVWeb,engine=window.CV&&CV.engines&&CV.engines.web,security=window.CANVIOSecurity;
  if(!ed||typeof ed.addComponents!=='function')return{ok:false,inserted:false,saved:false,error:'Website Engine chưa sẵn sàng. Hãy mở Website Engine rồi thử lại.'};
  if(!ed.Css||typeof ed.Css.setRule!=='function')return{ok:false,inserted:false,saved:false,error:'Website Engine không cung cấp CSS Manager; không chèn để tránh mất responsive.'};
  if(!engine||typeof engine.save!=='function')return{ok:false,inserted:false,saved:false,error:'Không tìm thấy bộ lưu Website Engine; không chèn nội dung.'};
  if(!security||typeof security.prepareHtmlImport!=='function')return{ok:false,inserted:false,saved:false,error:'P131 Security chưa sẵn sàng để làm sạch nội dung.'};
  var r=buildFromCore(options),scope='cv-p166-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  var prepared=security.prepareHtmlImport(bodyMarkup(r.html),{maxBytes:5*1024*1024});
  if(!prepared||!prepared.html)throw new Error('Bộ làm sạch không trả về nội dung Landing Page hợp lệ.');
  var markup='<div class="'+scope+'">'+prepared.html+'</div>';
  var rules=landingCssRules(scope,r.meta.color);
  var added=await Promise.resolve(ed.addComponents(markup));
  if(added===false)return{ok:false,inserted:false,saved:false,error:'Website Engine từ chối Landing Page đã làm sạch.'};
  try{
    rules.forEach(function(rule){
      var opts=rule.media?{atRuleType:'media',atRuleParams:rule.media}:undefined;
      ed.Css.setRule(rule.selector,rule.style,opts);
    });
  }catch(e){
    return{ok:false,inserted:true,saved:false,scope:scope,error:'Đã chèn nội dung nhưng không thể áp dụng đầy đủ responsive CSS: '+clean(e&&e.message,140)};
  }
  try{
    var saved=await Promise.resolve(engine.save());
    if(saved===false)return{ok:false,inserted:true,saved:false,scope:scope,error:'Đã chèn Landing Page vào phiên hiện tại nhưng Website Engine từ chối lưu. Hãy kiểm tra và Hoàn tác nếu cần.'};
  }catch(e){
    return{ok:false,inserted:true,saved:false,scope:scope,error:'Đã chèn Landing Page nhưng lưu thất bại. Hãy kiểm tra và Hoàn tác nếu cần.'};
  }
  var result={ok:true,inserted:true,saved:true,scope:scope,rules:rules.length,removedElements:Number(prepared.removed&&prepared.removed.elements)||0,removedAttributes:Number(prepared.removed&&prepared.removed.attrs)||0,remoteSourcesRemoved:Number(prepared.remoteSourcesRemoved)||0,owner:'CANVIOSecurity.prepareHtmlImport / CVWeb.addComponents / CVWeb.Css.setRule / CV.engines.web.save',noNewStore:true};
  try{document.dispatchEvent(new CustomEvent('canvio:p166-send-website',{detail:{result:result,meta:r.meta,assetIds:r.assetIds}}));}catch(e){}
  return result;
}
function download(name,data,type){var u=URL.createObjectURL(new Blob([data],{type:type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function mount(){var page=document.getElementById('page-webEngine');if(!page||page.querySelector('#cv166-card'))return false;var box=document.createElement('section');box.id='cv166-card';box.className='card';box.style.margin='14px 0';box.innerHTML='<div class="cardTop"><div><h3>Brief → Landing Page · P166</h3><span class="sub">Dùng brief Shared Core, ảnh Asset Library, responsive và xuất HTML/ZIP offline</span></div></div><div class="row" style="gap:6px;flex-wrap:wrap"><input id="cv166-name" class="input" placeholder="Tên thương hiệu / chiến dịch"><input id="cv166-headline" class="input" placeholder="Tiêu đề chính"><input id="cv166-cta" class="input" placeholder="CTA" value="Bắt đầu ngay"></div><div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><select id="cv166-asset" class="input" aria-label="Ảnh hero từ Asset Library"></select><input id="cv166-color" type="color" value="#2456d8" aria-label="Màu thương hiệu"><button id="cv166-preview" class="btn btn-soft sm" type="button">Tạo bản xem trước</button><button id="cv166-html" class="btn btn-ghost sm" type="button">Xuất HTML</button><button id="cv166-zip" class="btn btn-primary sm" type="button">Xuất ZIP</button><button id="cv166-web" class="btn btn-ghost sm" type="button">Gửi sang Website Engine</button></div><div id="cv166-status" class="tiny" aria-live="polite" style="margin-top:8px"></div><iframe id="cv166-preview-frame" title="Landing page preview" sandbox="" style="width:100%;height:480px;border:1px solid var(--line,rgba(128,128,128,.3));border-radius:10px;margin-top:10px;background:#fff"></iframe>';var anchor=page.querySelector('.head');if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);else page.insertBefore(box,page.firstChild);var $=s=>box.querySelector(s),status=$('#cv166-status');function options(){return{name:$('#cv166-name').value,headline:$('#cv166-headline').value,cta:$('#cv166-cta').value,color:$('#cv166-color').value,heroAssetId:$('#cv166-asset').value};}function refresh(){var as=assets().filter(a=>!!safeImageData(a&&a.data));$('#cv166-asset').innerHTML='<option value="">Không dùng ảnh hero</option>'+as.map(a=>'<option value="'+a.id+'">'+clean(a.name||a.id,80).replace(/[&<>"']/g,'')+'</option>').join('');}$('#cv166-preview').onclick=()=>{try{var r=buildFromCore(options());$('#cv166-preview-frame').srcdoc=r.html;status.textContent='Đã dựng preview responsive từ brief dự án. CTA mẫu chưa nối backend.';}catch(e){status.textContent=e.message;}};$('#cv166-html').onclick=()=>{try{var r=buildFromCore(options());download('CANVIO-Landing.html',r.html,'text/html;charset=utf-8');status.textContent='Đã xuất HTML.';}catch(e){status.textContent=e.message;}};$('#cv166-zip').onclick=()=>exportZip(options()).then(r=>{download('CANVIO-Landing-Offline.zip',r.blob,'application/zip');status.textContent='Đã xuất ZIP offline.';}).catch(e=>status.textContent=e.message);$('#cv166-web').onclick=()=>{var button=$('#cv166-web');button.disabled=true;sendToWebsite(options()).then(r=>{status.textContent=r.ok?'Đã chèn Landing Page vào GrapesJS và lưu bằng Website Engine · '+r.rules+' quy tắc CSS responsive.':'Không thể chuyển Landing Page: '+r.error;}).catch(e=>{status.textContent='Không thể chuyển Landing Page: '+(e&&e.message||String(e));}).finally(()=>{button.disabled=false;});};refresh();return true;}
function tests(){var r=build({name:'CANVIO test',headline:'Business design',brief:'HR campaign',color:'#123456'}),stored=buildFromCore({name:'P166 Shared Core test'});return{responsive:r.html.includes('@media(max-width:760px)'),reducedMotion:r.html.includes('prefers-reduced-motion'),escapedContent:!r.html.includes('<script>'),metadata:r.meta.name==='CANVIO test',savedToSharedCore:!!stored.meta&&!!read(),noBackendClaim:!r.html.includes('action='),safePngAccepted:safeImageData('data:image/png;base64,AA==')==='data:image/png;base64,AA==',rejectsSvg:safeImageData('data:image/svg+xml;base64,PHN2Zy8+')==='',rejectsAttributeInjection:safeImageData('data:image/png;base64,AA==\" onerror=\"x')===''};}
window.CVLandingStudioP166={version:'166.2.0',read:read,build:build,buildFromCore:buildFromCore,exportZip:exportZip,sendToWebsite:sendToWebsite,landingCssRules:landingCssRules,bodyMarkup:bodyMarkup,mount:mount,tests:tests};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();