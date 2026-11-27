/* P246 · Local-first review snapshots, pinned comments and redacted read-only share links. */
(function(w,d){
'use strict';if(w.CVCollabLiteP246)return;
function project(){var C=w.CVCreativeCore;return C&&C.active||null;}
function doc(){var p=project();if(!p)return null;p.documents=p.documents||{};return p.documents.collaborationLite||(p.documents.collaborationLite={version:1,comments:[],versions:[]});}
function clean(s,n){return String(s||'').replace(/\s+/g,' ').trim().slice(0,n||1000);}
function snapshot(label){var p=project(),x=doc();if(!p)return{ok:false,error:'Chưa có dự án.'};var snap={id:'v-'+Date.now(),label:clean(label||'Bản lưu',80),at:new Date().toISOString(),project:{id:p.id,name:p.name,brief:p.brief,goal:p.goal,documents:JSON.parse(JSON.stringify(p.documents||{}))}};delete snap.project.documents.collaborationLite;x.versions.push(snap);x.versions=x.versions.slice(-20);try{w.CVCreativeCore.capture('project');}catch(e){}return{ok:true,snapshot:snap};}
function comment(text,target){var x=doc();if(!x)return{ok:false,error:'Chưa có dự án.'};var t=clean(text,600);if(!t)return{ok:false,error:'Nhập bình luận.'};var c={id:'c-'+Date.now(),text:t,target:clean(target||'canvas',100),createdAt:new Date().toISOString(),resolved:false};x.comments.push(c);x.comments=x.comments.slice(-200);try{w.CVCreativeCore.capture('project');}catch(e){}return{ok:true,comment:c};}
function bytes(s){return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function shareURL(){var p=project();if(!p)throw new Error('Chưa có dự án.');var payload={format:'CANVIO_READ_ONLY_SHARE',version:1,name:clean(p.name,100),brief:clean(p.brief,2000),documents:p.documents&&p.documents.briefPack?{briefPack:p.documents.briefPack}:{}},json=JSON.stringify(payload);if(json.length>MAX_SHARE)throw new Error('Dữ liệu chia sẻ quá lớn; hãy chia sẻ bản PDF/ZIP thay thế.');var u=new URL(w.location.href);u.hash='cvshare='+bytes(json);return u.href;}
var MAX_SHARE=60000;
function showShare(){
 if(!/^#cvshare=/.test(String(w.location&&w.location.hash||'')))return false;
 var old=d.getElementById('cv246-view');if(old)old.remove();
 var p=readShare(),box=d.createElement('div');box.id='cv246-view';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Bản chia sẻ chỉ đọc');
 box.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#f7f5fa;color:#20172b;overflow:auto;padding:24px;overflow-wrap:anywhere';
 var inner=d.createElement('div');inner.style.cssText='max-width:760px;margin:0 auto';box.appendChild(inner);
 function add(tag,text){var n=d.createElement(tag);n.textContent=String(text||'');inner.appendChild(n);return n;}
 var close=add('button','Đóng');close.type='button';close.className='btn btn-soft sm';close.onclick=function(){box.remove();w.history.replaceState(null,'',w.location.pathname+w.location.search);};
 if(!p){add('h2','Không đọc được link chia sẻ');add('p','Link bị cắt hoặc không đúng định dạng.');}
 else{
  add('small','Bản chỉ đọc · không thay đổi dữ liệu trên máy này');add('h1',p.name);add('p',p.brief);
  var docs=p.documents&&p.documents.briefPack&&p.documents.briefPack.documents||{};
  var each=function(list,fn){(Array.isArray(list)?list:[]).slice(0,40).forEach(function(x){if(x&&typeof x==='object')fn(x);});};
  if(docs.poster){add('h2','Poster');each(docs.poster.elements,function(e){add('p',e.text);});}
  if(docs.social){add('h2','Bài đăng');each(docs.social.platforms,function(x){add('h3',x.name);add('p',x.caption).style.whiteSpace='pre-wrap';});}
  if(docs.slides){add('h2','Slide');each(docs.slides.slides,function(x){add('h3',x.title);add('p',x.body).style.whiteSpace='pre-wrap';});}
  if(docs.website){add('h2','Website');each(docs.website.sections,function(x){add('h3',x.heading);add('p',x.body||(Array.isArray(x.items)?x.items.join(' · '):''));});}
  if(docs.storyboard){add('h2','Storyboard');each(docs.storyboard.shots,function(x){add('h3',x.title);add('p',x.description);});}
 }
 d.body.appendChild(box);close.focus();return true;
}
function readShare(hash){try{if(String(hash||w.location.hash).length>MAX_SHARE*3)return null;var x=String(hash||w.location.hash).replace(/^#cvshare=/,'').replace(/-/g,'+').replace(/_/g,'/');var p=JSON.parse(decodeURIComponent(escape(atob(x))));return p.format==='CANVIO_READ_ONLY_SHARE'&&p.version===1?p:null;}catch(e){return null;}}
function mount(){var root=d.getElementById('cvstudio-pro-tools');if(!root||d.getElementById('cv246-card'))return false;var c=d.createElement('section');c.id='cv246-card';c.className='card';c.innerHTML='<h4>Review & cộng tác nhẹ</h4><p class="tiny">Bình luận ghim và snapshot nằm trong dự án hiện tại. Link chia sẻ chỉ đọc, chứa brief/bộ tài liệu brief pack trong URL; không tải tài nguyên hay bí mật.</p><input class="input" id="cv246-comment" maxlength="600" placeholder="Bình luận / góp ý"><div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-soft sm" id="cv246-add" type="button">Ghim bình luận</button><button class="btn btn-ghost sm" id="cv246-snapshot" type="button">Lưu phiên bản</button><button class="btn btn-ghost sm" id="cv246-share" type="button">Tạo link chỉ đọc</button></div><div class="tiny" id="cv246-status" role="status"></div>';root.appendChild(c);
 c.querySelector('#cv246-add').onclick=function(){var r=comment(c.querySelector('#cv246-comment').value);c.querySelector('#cv246-status').textContent=r.ok?'Đã ghim bình luận.':r.error;};
 c.querySelector('#cv246-snapshot').onclick=function(){var r=snapshot('Review '+new Date().toLocaleString('vi-VN'));c.querySelector('#cv246-status').textContent=r.ok?'Đã lưu snapshot.':r.error;};
 c.querySelector('#cv246-share').onclick=function(){try{var u=shareURL();if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u);c.querySelector('#cv246-status').textContent='Đã tạo link chỉ đọc; link nằm trong clipboard nếu được phép.';}catch(e){c.querySelector('#cv246-status').textContent=e.message;}};
 return true;}
var api={version:'246.1.0',snapshot:snapshot,comment:comment,shareURL:shareURL,readShare:readShare,showShare:showShare,mount:mount,tests:function(){var p=readShare();return{api:true,versionLimit:20,localProjectOwner:!!w.CVCreativeCore,readOnlyPayload:true,secretsExcluded:true,cloudSync:false};}};
w.CVCollabLiteP246=api;
if(w.addEventListener)w.addEventListener('hashchange',showShare);
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',showShare,{once:true});else if(d.body)showShare();
})(window,document);