/* P239 · Brief → five editable project documents. Reuses Shared Core and native editors. */
(function(w,d){
'use strict'; if(w.CVBriefPackP239)return;
function core(){return w.CVStudioProCore239||null;}
function project(create){var C=w.CVCreativeCore;if(!C)return null;var p=C.active||null;if(!p&&create&&C.create)p=C.create({name:'CANVIO Studio Pro'});return p;}
function text(v,n){return String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,n||1200);}
function build(brief,opts){
 opts=opts||{};var p=project(true);if(!p)return{ok:false,error:'Shared Core chưa sẵn sàng.'};
 var ctx={};try{ctx=w.CVCreativeCore.context?w.CVCreativeCore.context():{};}catch(e){}
 brief=text(brief||ctx.brief,5000);if(!brief)return{ok:false,error:'Cần nhập brief trước khi tạo bộ sản phẩm.'};
 var name=text(opts.name||ctx.projectName||p.name||'Chiến dịch mới',100),brand=opts.brand||p.brandKit||p.documents&&p.documents.brandKit||{};
 var primary=text(brand.primary||brand.primaryColor||getComputedStyle(d.documentElement).getPropertyValue('--cv-accent').trim()||'#F83E9F',32);
 var secondary=text(brand.secondary||brand.secondaryColor||'#20172B',32),font=text(brand.fontFamily||brand.font||'system-ui, sans-serif',80);
 var title=text(opts.title||brief.split(/[.!?\n]/)[0]||name,120),summary=text(opts.summary||brief,420);
 var id='bp239-'+Date.now().toString(36);
 var docs={
  poster:{id:id+'-poster',kind:'poster',title:title,format:'1080x1080',width:1080,height:1080,theme:{primary:primary,secondary:secondary,fontFamily:font},elements:[{id:id+'-p1',type:'eyebrow',text:text(opts.eyebrow||name,80),x:88,y:100,w:904,h:52,fontSize:24,weight:700,color:primary},{id:id+'-p2',type:'heading',text:title,x:88,y:250,w:904,h:250,fontSize:72,weight:800,color:secondary},{id:id+'-p3',type:'body',text:summary,x:88,y:570,w:850,h:190,fontSize:30,weight:400,color:secondary}],createdAt:new Date().toISOString()},
  social:{id:id+'-social',kind:'social',title:title,platforms:[{name:'Facebook',format:'1200x630',caption:title+'\n\n'+summary+'\n\n'+name},{name:'Instagram',format:'1080x1350',caption:title+'\n\n'+summary+'\n\n#'+name.replace(/\W/g,'')},{name:'LinkedIn',format:'1200x627',caption:title+'\n\n'+summary+'\n\nThông tin chi tiết: '+name}],hashtags:[],createdAt:new Date().toISOString()},
  slides:{id:id+'-slides',kind:'slides',title:title,slides:[{title:title,body:summary,layout:'title'},{title:'Vấn đề & cơ hội',body:'Bối cảnh\nĐối tượng\nNhu cầu cần giải quyết',layout:'content'},{title:'Giải pháp đề xuất',body:brief,layout:'content'},{title:'Kế hoạch triển khai',body:'Giai đoạn 1 · Chuẩn bị\nGiai đoạn 2 · Thực hiện\nGiai đoạn 3 · Đo lường',layout:'timeline'},{title:'Kết quả mong đợi',body:'Chỉ tiêu cần xác nhận\nNguồn lực\nBước tiếp theo',layout:'closing'}],createdAt:new Date().toISOString()},
  website:{id:id+'-website',kind:'website',title:title,meta:{description:summary.slice(0,155)},sections:[{id:'hero',type:'hero',heading:title,body:summary,cta:'Liên hệ'},{id:'about',type:'content',heading:'Bối cảnh',body:brief},{id:'benefits',type:'list',heading:'Giá trị chính',items:['Thông điệp rõ ràng','Triển khai nhất quán','Đo lường được kết quả']},{id:'contact',type:'contact',heading:'Bước tiếp theo',body:'Trao đổi để xác nhận phạm vi và kế hoạch'}],theme:{primary:primary,secondary:secondary,fontFamily:font},createdAt:new Date().toISOString()},
  storyboard:{id:id+'-storyboard',kind:'storyboard',title:title,shots:[{title:'Mở cảnh',duration:4,description:'Thiết lập bối cảnh và vấn đề',camera:'wide'},{title:'Nêu insight',duration:5,description:summary,camera:'medium'},{title:'Giải pháp',duration:6,description:'Trình bày thông điệp và lợi ích',camera:'close-up'},{title:'Kết thúc',duration:4,description:'CTA và nhận diện thương hiệu',camera:'hero'}],createdAt:new Date().toISOString()}
 };
 p.documents=p.documents||{};p.documents.briefPack={version:1,id:id,brief:brief,brand:{primary:primary,secondary:secondary,fontFamily:font},documents:docs,createdAt:new Date().toISOString()};
 try{if(w.CVCreativeCore.capture)w.CVCreativeCore.capture('project');}catch(e){}
 return{ok:true,id:id,documents:docs,projectId:p.id,brand:brand};
}
function read(){var p=project(false);return p&&p.documents&&p.documents.briefPack||null;}
function open(kind){var p=read(),doc=p&&p.documents&&p.documents[kind];if(!doc)return{ok:false,error:'Chưa có tài liệu '+kind+'.'};var route={poster:'poster',social:'poster',slides:'layoutFoundry',website:'website',storyboard:'videoEngine'}[kind]||'poster';try{if(w.CV&&CV.go)CV.go(route);}catch(e){}return{ok:true,kind:kind,document:doc,route:route};}
function mount(){
 var page=d.getElementById('page-projectVault');if(!page||d.getElementById('cvstudio-pro-p239'))return !!d.getElementById('cvstudio-pro-p239');
 var anchor=d.getElementById('cv170-card')||page.querySelector('.head')||page.firstElementChild;if(!anchor)return false;
 var card=d.createElement('section');card.id='cvstudio-pro-p239';card.className='card';card.style.cssText='margin:14px 0;padding:16px;border:1px solid var(--cv-accent-soft,rgba(248,62,159,.25))';
 card.innerHTML='<div class="cardTop"><div><h3>Studio Pro · Brief → Trọn bộ</h3><span class="sub">5 tài liệu có cấu trúc trong dự án · Local-first</span></div><span class="badgeSoft">P239–P248</span></div><label for="cv239-brief">Brief dự án</label><textarea id="cv239-brief" class="input" rows="4" maxlength="5000" style="width:100%;margin:6px 0" placeholder="Mục tiêu, đối tượng, thông điệp, kênh và yêu cầu…"></textarea><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn btn-primary" id="cv239-build" type="button">Tạo 5 sản phẩm</button><span id="cv239-status" class="tiny" role="status" aria-live="polite">Mỗi đầu ra được lưu trong documents của dự án hiện tại.</span></div><div id="cv239-docs" class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"></div><div id="cvstudio-pro-tools" style="display:grid;gap:12px;margin-top:14px"></div>';
 if(anchor===page.firstElementChild&&anchor.classList.contains('head'))anchor.insertAdjacentElement('afterend',card);else anchor.insertAdjacentElement('afterend',card);
 var inp=card.querySelector('#cv239-brief');try{var C=w.CVCreativeCore,ctx=C&&C.context?C.context():{};inp.value=ctx.brief||'';}catch(e){}
 card.querySelector('#cv239-build').addEventListener('click',function(){var b=this;b.disabled=true;var t=Date.now(),r=build(inp.value);card.querySelector('#cv239-status').textContent=r.ok?'Đã tạo 5 tài liệu trong '+Math.round((Date.now()-t))+' ms.':'Chưa tạo được: '+r.error;b.disabled=false;renderDocs();});
 renderDocs();return true;
}
function renderDocs(){var box=d.getElementById('cv239-docs'),p=read();if(!box)return;box.innerHTML='';['poster','social','slides','website','storyboard'].forEach(function(k){var doc=p&&p.documents&&p.documents[k],b=d.createElement('button');b.type='button';b.className='btn btn-soft sm';b.textContent=(doc? 'Mở ':'Tạo ') + ({poster:'Poster',social:'Bài đăng',slides:'Slide',website:'Website/CV',storyboard:'Storyboard'}[k]);b.disabled=!doc;b.addEventListener('click',function(){open(k);});box.appendChild(b);});}
var api={version:'239.1.0',build:build,read:read,open:open,mount:mount,tests:function(){var p=read();return{api:true,fiveKinds:['poster','social','slides','website','storyboard'].every(function(k){return !!(p&&p.documents&&p.documents[k]);}),projectScoped:!!(project(false)&&project(false).documents),noNetwork:true};}};
w.CVBriefPackP239=api;
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',function(){var n=0;(function r(){if(!mount()&&++n<80)setTimeout(r,250);})();},{once:true});else setTimeout(mount,0);
})(window,document);