/* P146.1 — Guided Creative Workflows for the existing Home page.
   Reuses Home prompt, Shared Creative Core and existing Studio routes. No new store,
   editor engine, AI provider, network request or background generation. */
(function(){
'use strict';
if(window.CVHomeCreativeFlowP146)return;
var FLOWS=[
{id:'hr',icon:'♙',name:'HR & tuyển dụng',summary:'JD · employer branding · onboarding',deliverable:'Poster tuyển dụng, banner và avatar team',studio:'HR Visual Studio',page:'hrvisual',field:'hrPrompt',kind:'poster',goal:'HR & Tuyển dụng',project:'Bộ ấn phẩm tuyển dụng',brief:'Thiết kế bộ ấn phẩm tuyển dụng cho [CÔNG TY] — vị trí [VỊ TRÍ]. Đối tượng ứng viên: [ĐỐI TƯỢNG]. Nêu rõ trách nhiệm, yêu cầu, quyền lợi, địa điểm và cách ứng tuyển. Phong cách chuyên nghiệp, hiện đại, dễ đọc trên điện thoại; ưu tiên màu thương hiệu và hình ảnh nhân sự chân thực.',next:'HR Visual Studio → Poster Studio → Hallmark / Insight → Export'},
{id:'business',icon:'▥',name:'Kinh doanh & tài chính',summary:'Báo cáo · KPI · infographic',deliverable:'Infographic kết quả kinh doanh và bảng chỉ số',studio:'AI Studio',page:'studio',field:'studioPrompt',kind:'poster',goal:'Kinh doanh & Tài chính',project:'Báo cáo kinh doanh',brief:'Thiết kế infographic báo cáo kinh doanh cho [DOANH NGHIỆP] trong kỳ [THỜI GIAN]. Đối tượng đọc: [BAN LÃNH ĐẠO / ĐỘI NGŨ]. Làm nổi bật các KPI đã xác minh: [SỐ LIỆU], xu hướng, nguyên nhân và hành động tiếp theo. Bố cục rõ thứ bậc, biểu đồ dễ đọc, không tự bịa số liệu.',next:'AI Studio → Asset Library / Charts → Hallmark / Insight → Export'},
{id:'training',icon:'▤',name:'Đào tạo & nội bộ',summary:'Tài liệu · quy trình · truyền thông',deliverable:'Bộ tài liệu đào tạo và truyền thông nội bộ',studio:'Creative Hub',page:'creativeHub',field:'chBrief',kind:'identity',goal:'Đào tạo & Truyền thông nội bộ',project:'Bộ tài liệu đào tạo',task:'design',brief:'Xây dựng bộ tài liệu đào tạo nội bộ về [CHỦ ĐỀ] cho [NHÓM NHÂN SỰ]. Mục tiêu sau đào tạo: [KẾT QUẢ]. Chia nội dung thành các phần ngắn, có ví dụ tình huống, quy trình từng bước, điểm cần nhớ và phần hành động. Thiết kế chuyên nghiệp, dễ trình chiếu và dễ đọc.',next:'Creative Hub → Layout Foundry / Poster Studio → Insight → Export'},
{id:'marketing',icon:'◈',name:'Marketing & thương hiệu',summary:'Campaign · website · social',deliverable:'Key visual chiến dịch và nội dung đa kênh',studio:'Creative Hub',page:'creativeHub',field:'chBrief',kind:'web',goal:'Marketing & Thương hiệu',project:'Chiến dịch thương hiệu',task:'web',brief:'Xây dựng concept marketing cho [THƯƠNG HIỆU / SẢN PHẨM]. Mục tiêu chiến dịch: [MỤC TIÊU]; khách hàng mục tiêu: [ĐỐI TƯỢNG]; thông điệp chính: [THÔNG ĐIỆP]; kênh triển khai: [KÊNH]. Đề xuất hướng hình ảnh, màu sắc, tiêu đề, CTA và cách chuyển thể nhất quán giữa website, banner và social.',next:'Creative Hub → Website / Poster / HR Visual → Hallmark / Insight → Export'},
{id:'video',icon:'▶',name:'Video & nội dung',summary:'Kịch bản · storyboard · social video',deliverable:'Kịch bản video, shot list và dựng timeline',studio:'Video Studio',page:'videoStudio',field:'vidScript',kind:'set',goal:'Video & Nội dung',project:'Sản xuất video',brief:'Lập kế hoạch video về [CHỦ ĐỀ] cho [ĐỐI TƯỢNG] trên [NỀN TẢNG]. Mục tiêu: [MỤC TIÊU]. Độ dài dự kiến: [THỜI LƯỢNG]. Tạo hook mở đầu, thông điệp chính, lời dẫn, storyboard theo từng cảnh, gợi ý hình/âm thanh và CTA. Ghi rõ phần nào cần footage thật, không giả định đã có video được tạo.',next:'Video Studio → ShotCraft → Video Engine → Quality / Export'}
];
var selected='hr';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function flow(id){return FLOWS.filter(function(x){return x.id===id})[0]||FLOWS[0]}
function coreContext(){try{return window.CVCreativeCore&&CVCreativeCore.context?CVCreativeCore.context():null}catch(e){return null}}
function addStyles(){
 if($('#cvhs-style'))return;
 var s=document.createElement('style');s.id='cvhs-style';
 s.textContent='#cvhs-workflows{margin:0 0 18px;padding:18px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,var(--surface),var(--surface-2));box-shadow:var(--sh-1)}'+
 '#cvhs-workflows *{box-sizing:border-box}.cvhs-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:13px}'+
 '.cvhs-head h3{font-size:16px;letter-spacing:-.3px;margin:3px 0 4px;color:var(--ink)}.cvhs-head p{font-size:11.5px;color:var(--ink-3);margin:0;line-height:1.6}'+
 '.cvhs-kicker{font-size:9px;font-weight:850;letter-spacing:1.15px;color:var(--brand)}'+
 '.cvhs-core{display:inline-flex;align-items:center;gap:6px;max-width:42%;padding:6px 9px;border:1px solid var(--line);border-radius:99px;background:var(--surface);font-size:10px;font-weight:700;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
 '.cvhs-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr);gap:12px;align-items:stretch}.cvhs-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}'+
 '.cvhs-choice{display:flex;flex-direction:column;align-items:flex-start;gap:7px;min-height:94px;padding:12px;text-align:left;border:1px solid var(--line);border-radius:13px;background:var(--surface);color:var(--ink);cursor:pointer;transition:border-color .16s,background .16s,transform .16s}'+
 '.cvhs-choice:hover{border-color:var(--brand-line);transform:translateY(-2px)}.cvhs-choice[aria-pressed=true]{border-color:var(--brand);background:var(--brand-soft);box-shadow:inset 0 0 0 1px var(--brand-line)}'+
 '.cvhs-choice b{font-size:11.5px;line-height:1.3}.cvhs-choice small{font-size:9.5px;line-height:1.45;color:var(--ink-3)}'+
 '.cvhs-icon{display:grid;place-items:center;width:29px;height:29px;border-radius:9px;background:var(--brand-soft);color:var(--brand);font-size:15px;font-weight:800}'+
 '.cvhs-detail{display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid var(--brand-line);border-radius:14px;background:var(--surface)}'+
 '.cvhs-detail-label{font-size:9px;font-weight:850;letter-spacing:.8px;color:var(--brand);text-transform:uppercase}.cvhs-detail h4{font-size:13px;margin:0;color:var(--ink)}'+
 '.cvhs-detail p{font-size:10.5px;color:var(--ink-2);line-height:1.65;margin:0}.cvhs-meta{display:grid;gap:5px;padding:9px 10px;border-radius:10px;background:var(--surface-2);font-size:9.5px;color:var(--ink-3);line-height:1.5}'+
 '.cvhs-meta b{color:var(--ink-2)}.cvhs-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:auto}.cvhs-actions button{min-height:34px;font-size:10.5px}'+
 '.cvhs-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:2px}.cvhs-step{display:flex;align-items:center;gap:6px;padding:7px 8px;border-radius:9px;background:var(--surface-2);font-size:9px;font-weight:700;color:var(--ink-2)}'+
 '.cvhs-step i{font-style:normal;display:grid;place-items:center;width:19px;height:19px;border-radius:6px;background:var(--brand-soft);color:var(--brand);font-weight:850}#cvhs-status{min-height:15px;margin:0;font-size:9.5px;color:var(--ink-3)}'+
 '@media(max-width:950px){.cvhs-layout{grid-template-columns:1fr}.cvhs-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}'+
 '@media(max-width:600px){#cvhs-workflows{padding:13px}.cvhs-head{flex-direction:column}.cvhs-core{max-width:100%}.cvhs-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cvhs-choice{min-height:90px}.cvhs-steps{grid-template-columns:1fr}.cvhs-actions{display:grid;grid-template-columns:1fr 1fr}}'+
 '@media(prefers-reduced-motion:reduce){.cvhs-choice{transition:none}.cvhs-choice:hover{transform:none}}';
 document.head.appendChild(s);
}
function mount(){
 var home=$('#page-home');if(!home)return false;
 if($('#cvhs-workflows'))return true;
 var anchor=$('.cvQuick',home)||$('#cvHero',home)||$('.hero',home);if(!anchor)return false;
 addStyles();
 var section=document.createElement('section');section.id='cvhs-workflows';section.setAttribute('aria-labelledby','cvhs-title');
 section.innerHTML='<div class="cvhs-head"><div><span class="cvhs-kicker">CANVIO · GUIDED WORKFLOWS</span><h3 id="cvhs-title">Bắt đầu theo mục tiêu</h3><p>Chọn nhu cầu thực tế để nhận brief mẫu và mở đúng Studio đang có.</p></div><span class="cvhs-core" id="cvhs-core">◈ Shared Core · sẵn sàng</span></div>'+
 '<div class="cvhs-layout"><div class="cvhs-grid" role="group" aria-label="Chọn quy trình sáng tạo">'+FLOWS.map(function(x){return '<button type="button" class="cvhs-choice" data-cvhs-flow="'+x.id+'" aria-pressed="'+(x.id===selected?'true':'false')+'"><span class="cvhs-icon" aria-hidden="true">'+x.icon+'</span><b>'+esc(x.name)+'</b><small>'+esc(x.summary)+'</small></button>'}).join('')+'</div>'+
 '<article class="cvhs-detail" aria-live="polite"><span class="cvhs-detail-label">Luồng được đề xuất</span><h4 id="cvhs-deliverable"></h4><p id="cvhs-description"></p><div class="cvhs-meta"><span>Studio đề xuất: <b id="cvhs-studio"></b></span><span>Luồng tiếp theo: <b id="cvhs-next"></b></span></div><div class="cvhs-actions"><button type="button" class="btn btn-soft" data-cvhs-action="apply">Điền brief mẫu</button><button type="button" class="btn btn-primary" data-cvhs-action="open">Điền brief &amp; mở Studio</button></div><div class="cvhs-steps"><div class="cvhs-step"><i>1</i> Brief &amp; mục tiêu</div><div class="cvhs-step"><i>2</i> Studio phù hợp</div><div class="cvhs-step"><i>3</i> QA → Xuất bản</div></div><p id="cvhs-status" role="status" aria-live="polite">Không tự gọi AI hoặc gửi dữ liệu nền.</p></article></div>';
 anchor.insertAdjacentElement('afterend',section);section.addEventListener('click',onClick);render();return true;
}
function render(){
 var x=flow(selected),ctx=coreContext();
 $$('[data-cvhs-flow]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-cvhs-flow')===selected?'true':'false')});
 var set=function(id,value){var e=$('#'+id);if(e)e.textContent=value};
 set('cvhs-deliverable',x.deliverable);set('cvhs-description',x.summary+'. Brief mẫu có chỗ trống để bạn thay bằng dữ liệu thật trước khi sử dụng.');
 set('cvhs-studio',x.studio);set('cvhs-next',x.next);
 set('cvhs-core',ctx&&ctx.projectName?'◈ Shared Core · '+ctx.projectName:'◈ Shared Core · dùng dữ liệu dự án hiện có');
}
function setHomeKind(kind){
 var btn=$('#homeKind [data-kind="'+kind+'"]');
 if(btn){if(!btn.classList.contains('on'))btn.click();return}
 var fallback=$('#homeKind [data-kind="poster"]');if(fallback&&!fallback.classList.contains('on'))fallback.click();
}
function fillHome(x){
 var el=$('#homePrompt');if(!el)return false;
 el.value=x.brief;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
 setHomeKind(x.kind);el.focus();el.scrollIntoView({behavior:'smooth',block:'center'});return true;
}
function syncExistingCore(x){
 var core=window.CVCreativeCore;if(!core)return 'Shared Core chưa sẵn sàng; brief vẫn được chuyển vào Studio.';
 var ctx=coreContext();
 try{
  if(ctx&&ctx.projectId){
   if(!String(ctx.brief||'').trim()){core.setBrief(x.brief);return 'Brief đã được lưu vào dự án Shared Core đang chọn.';}
   if(String(ctx.brief||'')===x.brief)return 'Brief đã đồng bộ với dự án Shared Core hiện tại.';
   return 'Giữ nguyên brief đang có trong Shared Core để tránh ghi đè; brief mới chỉ được chuyển vào Studio.';
  }
  if(core.create){core.create({name:x.project,brief:x.brief,goal:x.goal,channel:'Đa kênh'});return 'Đã tạo dự án trong Shared Core bằng dữ liệu sẵn có.';}
 }catch(e){return 'Không cập nhật được Shared Core; brief vẫn được chuyển vào Studio.'}
 return 'Brief được chuyển vào Studio; Shared Core hiện không khả dụng.';
}
function fillDestination(x,attempt){
 var el=$('#'+x.field);
 if(el){
  el.value=x.brief;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
  if(x.page==='creativeHub'&&x.task){var task=$('#chTask');if(task){task.value=x.task;task.dispatchEvent(new Event('change',{bubbles:true}))}}
  if(x.page==='studio'){var kind=$('#studioKind');if(kind){kind.value=x.kind;kind.dispatchEvent(new Event('change',{bubbles:true}))}}
  var st=$('#cvhs-status');if(st)st.textContent='Đã chuyển brief vào '+x.studio+'. Chưa tự chạy AI; bạn chủ động bấm tạo trong Studio.';return true;
 }
 if(attempt<12){window.setTimeout(function(){fillDestination(x,attempt+1)},140);return false}
 var st2=$('#cvhs-status');if(st2)st2.textContent='Đã mở '+x.studio+'. Ô brief chưa sẵn sàng; nội dung vẫn còn trong Home và Shared Core nếu đã lưu.';return false;
}
function openStudio(x){
 if(!window.CV||typeof CV.go!=='function'){setStatus('Điều hướng CANVIO chưa sẵn sàng.');return false}
 fillHome(x);var coreNote=syncExistingCore(x);
 try{CV.go(x.page)}catch(e){setStatus('Không mở được '+x.studio+': '+e.message);return false}
 setStatus(coreNote+' Đang mở '+x.studio+'…');window.setTimeout(function(){fillDestination(x,0)},160);return true;
}
function setStatus(v){var e=$('#cvhs-status');if(e)e.textContent=v}
function onClick(e){
 var choice=e.target.closest('[data-cvhs-flow]');
 if(choice){selected=choice.getAttribute('data-cvhs-flow');render();return}
 var action=e.target.closest('[data-cvhs-action]');if(!action)return;
 var x=flow(selected);
 if(action.getAttribute('data-cvhs-action')==='apply'){
  if(fillHome(x))setStatus('Brief mẫu đã được điền vào ô mô tả Home. Hãy thay các phần trong [ngoặc] bằng dữ liệu thật.');
  else setStatus('Không tìm thấy ô mô tả Home.');
 }else if(action.getAttribute('data-cvhs-action')==='open')openStudio(x);
}
var api={version:'146.1.0',flows:FLOWS.map(function(x){return{id:x.id,name:x.name,studio:x.studio,page:x.page,field:x.field}}),mount:mount,render:render,select:function(id){if(!FLOWS.some(function(x){return x.id===id}))return false;selected=id;render();return true},apply:function(){return fillHome(flow(selected))},open:function(){return openStudio(flow(selected))},tests:function(){return{mounted:!!$('#cvhs-workflows'),workflowCount:FLOWS.length,homePrompt:!!$('#homePrompt'),sharedCoreOwner:!!window.CVCreativeCore,noIndependentStore:true,noAutomaticAI:true}}};
window.CVHomeCreativeFlowP146=api;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

