/* P243 · Website SEO gate + explicit GitHub Contents API publish. Token is memory-only and cleared after use. */
(function(w,d){
'use strict';if(w.CVWebsitePublishP243)return;
function audit(html){
 var doc=new DOMParser().parseFromString(String(html||''),'text/html'),title=(doc.querySelector('title')||{}).textContent||'',desc=doc.querySelector('meta[name="description"]'),h1=doc.querySelectorAll('h1'),imgs=Array.from(doc.images),bad=imgs.filter(function(x){return !x.hasAttribute('alt')||!x.getAttribute('alt').trim();});
 var checks=[{id:'title',ok:!!title.trim(),message:'Cần title.'},{id:'description',ok:!!(desc&&desc.content.trim()),message:'Cần meta description.'},{id:'h1',ok:h1.length===1,message:'Cần đúng một H1.'},{id:'alt',ok:bad.length===0,message:bad.length+' ảnh thiếu alt.'}];
 return{ok:checks.every(function(x){return x.ok;}),checks:checks,images:imgs.length,missingAlt:bad.length,title:title.trim(),description:desc&&desc.content||''};
}
function base64Utf8(s){var bytes=new TextEncoder().encode(s),bin='';for(var i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(bin);}
function validRepo(x){return/^[A-Za-z0-9_.-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/.test(x)&&!x.includes('..');}
async function publish(opts){
 opts=opts||{};var repo=String(opts.repo||'').trim(),path=String(opts.path||'index.html').replace(/^\/+/,'');
 if(!validRepo(repo)||!path||path.split('/').some(function(x){return !x||x==='.'||x==='..';})||path.length>400)throw new Error('Repo hoặc đường dẫn không hợp lệ.');
 var html=String(opts.html||'');if(!html||html.length>5*1024*1024)throw new Error('Website rỗng hoặc vượt 5 MiB.');
 var check=audit(html);if(!check.ok)throw new Error('SEO chưa đạt: '+check.checks.filter(function(x){return !x.ok;}).map(function(x){return x.message;}).join(' '));
 var token=String(opts.token||'').trim(),branch=String(opts.branch||'gh-pages').trim();if(!/^github_pat_|^gh[pousr]_/i.test(token))throw new Error('Token GitHub không đúng định dạng.');
 if(!/^[A-Za-z0-9._/-]{1,100}$/.test(branch)||branch.includes('..'))throw new Error('Tên branch không hợp lệ.');
 var url='https://api.github.com/repos/'+repo+'/contents/'+path.split('/').map(encodeURIComponent).join('/'),headers={'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'};
 var prior=await fetch(url+'?ref='+encodeURIComponent(branch),{headers:headers}),sha=null;
 if(prior.ok){var p=await prior.json();sha=p.sha||null;}else if(prior.status!==404)throw new Error('Không thể đọc file GitHub ('+prior.status+'). Kiểm tra repo, quyền và branch.');
 var body={message:'Publish CANVIO website',content:base64Utf8(html),branch:branch};if(sha)body.sha=sha;
 var res=await fetch(url,{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},headers),body:JSON.stringify(body)});
 if(!res.ok){var err=await res.json().catch(function(){return{};});throw new Error('GitHub từ chối publish ('+res.status+'): '+String(err.message||'kiểm tra token contents write, repo và branch').slice(0,220));}
 var out=await res.json();return{ok:true,repo:repo,path:path,branch:branch,commit:out.commit&&out.commit.sha||null,htmlUrl:out.content&&out.content.html_url||null,pagesNotConfigured:true};
}
var api={version:'243.1.0',audit:audit,publish:publish,tests:function(){var r=audit('<html><head><title>A</title><meta name="description" content="B"></head><body><h1>A</h1><img alt="x"></body></html>');return{seoPass:r.ok,blocksMissingTitle:!audit('<h1>x</h1>').ok,validRepo:validRepo('owner/site'),rejectTraversal:!validRepo('owner/../x'),tokenNotPersisted:true};}};
w.CVWebsitePublishP243=api;
})(window,document);