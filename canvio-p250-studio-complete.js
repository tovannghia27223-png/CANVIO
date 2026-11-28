/* P250 · Studio Pro completion: batch PNG/PDF, six-size PNG, designed decks and sites, caption and beat tools,
   full bundle with video media, contact form, review tools, device checks. Writes go through the existing owners. */
(function(w,d){
'use strict';if(w.CVStudioCompleteP250)return;
var $=function(id){return d.getElementById(id);};
function copy(v){return JSON.parse(JSON.stringify(v));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function sleep(ms){return new Promise(function(r){w.setTimeout(r,ms);});}
async function waitFor(test){for(var i=0;i<100;i++){try{if(test())return true;}catch(e){}await sleep(100);}return false;}
function el(tag,props,kids){var n=d.createElement(tag);Object.keys(props||{}).forEach(function(k){if(k==='text')n.textContent=props[k];else if(k==='on')n.onclick=props[k];else n.setAttribute(k,props[k]);});(kids||[]).forEach(function(c){n.appendChild(c);});return n;}
function download(blob,name){var u=URL.createObjectURL(blob),a=el('a',{href:u,download:name});d.body.appendChild(a);a.click();a.remove();w.setTimeout(function(){URL.revokeObjectURL(u);},15000);}
function project(){var C=w.CVCreativeCore;return C&&C.active||null;}
function pack(){return w.CVBriefPackP239&&CVBriefPackP239.read()||null;}
function video(){return w.CV&&CV.engines&&CV.engines.video;}
function slug(s){return String(s||'canvio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'canvio';}

/* ---------- rendering: the Poster export owner draws every page ---------- */
function toCanvas(doc,scale){
 return new Promise(function(res,rej){
  CV.export.toBlob(doc,scale||1,function(blob){
   if(!blob)return rej(new Error('Không kết xuất được trang.'));
   var u=URL.createObjectURL(blob),im=new Image();
   im.onload=function(){var c=d.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);URL.revokeObjectURL(u);res({canvas:c,png:blob});};
   im.onerror=function(){URL.revokeObjectURL(u);rej(new Error('Không đọc được ảnh vừa kết xuất.'));};im.src=u;
  });
 });
}
function jpegPage(canvas,w0,h0){var bin=atob(canvas.toDataURL('image/jpeg',.9).split(',')[1]),b=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);return{bytes:b,px:canvas.width,py:canvas.height,w:w0*.75,h:h0*.75};}
/* Image-only PDF: one JPEG per page, offsets recorded for a valid xref table. */
function pdf(pages){
 if(!pages.length)throw new Error('Không có trang để tạo PDF.');
 var enc=new TextEncoder(),parts=[],offs=[],len=0,add=function(x){var b=typeof x==='string'?enc.encode(x):x;parts.push(b);len+=b.length;},obj=function(n,body){offs[n]=len;add(n+' 0 obj\n');body();add('\nendobj\n');};
 add('%PDF-1.4\n');obj(1,function(){add('<</Type/Catalog/Pages 2 0 R>>');});
 obj(2,function(){add('<</Type/Pages/Count '+pages.length+'/Kids['+pages.map(function(_,i){return(3+i*3)+' 0 R';}).join(' ')+']>>');});
 pages.forEach(function(p,i){var n=3+i*3,stream='q '+p.w+' 0 0 '+p.h+' 0 0 cm /I Do Q';
  obj(n,function(){add('<</Type/Page/Parent 2 0 R/MediaBox[0 0 '+p.w+' '+p.h+']/Resources<</XObject<</I '+(n+1)+' 0 R>>>>/Contents '+(n+2)+' 0 R>>');});
  obj(n+1,function(){add('<</Type/XObject/Subtype/Image/Width '+p.px+'/Height '+p.py+'/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length '+p.bytes.length+'>>\nstream\n');add(p.bytes);add('\nendstream');});
  obj(n+2,function(){add('<</Length '+stream.length+'>>\nstream\n'+stream+'\nendstream');});
 });
 var xref=len,count=3+pages.length*3;add('xref\n0 '+count+'\n0000000000 65535 f \n');for(var k=1;k<count;k++)add(String(offs[k]).padStart(10,'0')+' 00000 n \n');
 add('trailer\n<</Size '+count+'/Root 1 0 R>>\nstartxref\n'+xref+'\n%%EOF');
 return new Blob(parts,{type:'application/pdf'});
}
var meter;
function lines(text,size,weight,family,width){
 meter=meter||d.createElement('canvas').getContext('2d');meter.font=weight+' '+size+'px '+family;var out=[];
 String(text||'').split('\n').forEach(function(par){var line='';par.split(/\s+/).filter(Boolean).forEach(function(word){
  var next=line?line+' '+word:word;if(meter.measureText(next).width<=width){line=next;return;}
  if(line)out.push(line);line='';Array.from(word).forEach(function(ch){if(line&&meter.measureText(line+ch).width>width){out.push(line);line='';}line+=ch;});
 });out.push(line);});
 return out;
}
var FAMILY={cvDisplay:'CVAnton',cvText:'CVMont',cvAccent:'CVLora'};
/* Shrinks text until it fits its box; reports when even the smallest size is not enough. */
function fit(layer){
 var L=Object.assign({},layer),size=L.size||14,out,lh=L.lineHeight||1.2,room=L.h||size*lh*3;
 for(;;){out=lines(L.text,size,L.weight||700,FAMILY[L.font]||'sans-serif',L.w*.97);if(out.length*size*lh<=room+1||size<=9)break;size=Math.max(9,Math.floor(size*.92));}
 var over=out.length*size*lh>room+1;if(over)out=out.slice(0,Math.max(1,Math.floor(room/(size*lh))));
 L.size=size;L.text=out.join('\n');return{layer:L,overflow:over,shrunk:size<(layer.size||14)};
}
function theme(){
 var art=w.CVPosterArtP249,p=pack();if(!art)return null;var doc=art.make(p?p.brief:'CANVIO',0,{color:p&&p.brand.custom?p.brand.primary:''}),key=doc.cvArt.theme;
 var pic=doc.layers.filter(function(L){return L.cvHero!=null;})[0]||doc.layers.filter(function(L){return L.type==='image';})[0];
 var c=art.copy(p?p.brief:'CANVIO').theme;return{key:key,a:p&&p.brand.custom?p.brand.primary:c.a,deep:c.deep,pop:c.pop,cream:c.cream,art:pic};
}
var uid=0;
function box(type,x,y,w0,h0,extra){return Object.assign({id:'p250-'+(++uid),type:type,x:x,y:y,w:w0,h:h0,opacity:1,rotate:0},extra);}
function words(x,y,w0,h0,text,size,color,extra){return fit(box('text',x,y,w0,h0,Object.assign({text:text,size:size,color:color,font:'cvText',weight:500,align:'left',lineHeight:1.3},extra))).layer;}
function hero(t,x,y,s){return box('image',x,y,s,s,{src:t.art.src,cvFonts:true});}

/* ---------- P241: batch PNG and PDF ---------- */
var CARD='name,role,company';
function cardDoc(row,keys,t){
 var rest=keys.slice(1).map(function(k){return row[k];}).filter(Boolean);
 return{w:720,h:440,name:'Thẻ',layers:[box('rect',0,0,720,440,{bg:t.deep}),box('rect',24,24,672,392,{bg:t.cream,radius:26}),box('rect',24,24,16,392,{bg:t.a,radius:8}),
  hero(t,478,196,210),
  words(76,72,600,150,row[keys[0]]||'',58,t.deep,{font:'cvDisplay',weight:400,lineHeight:1.2}),
  words(76,238,390,70,rest[0]||'',28,t.a,{weight:800}),words(76,318,390,70,rest.slice(1).join(' · '),22,t.deep)]};
}
function templateKeys(doc){var found={};(doc&&doc.layers||[]).forEach(function(L){String(L.text||'').replace(/\{\{\s*([A-Za-z0-9_.-]{1,80})\s*\}\}/g,function(a,k){found[k]=1;});});return Object.keys(found);}
function batch(csv){
 var B=w.CVBulkP241,parsed=B.parseCSV(csv);if(!parsed.headers.length||!parsed.rows.length)throw new Error(parsed.errors.join(' ')||'Không có dòng dữ liệu.');
 var current=w.CV&&CV.poster&&CV.poster.doc,keys=templateKeys(current),use=keys.length?copy(current):null,t=theme();if(!use&&!t)throw new Error('Mẫu poster chưa sẵn sàng.');
 var missing=keys.filter(function(k){return parsed.headers.indexOf(k)<0;});if(missing.length)throw new Error('CSV thiếu cột mà mẫu đang cần: '+missing.join(', '));
 var errors=[],items=[];
 parsed.rows.forEach(function(row,i){
  var line=i+2,empty=(use?keys:[parsed.headers[0]]).filter(function(k){return!String(row[k]||'').trim();});
  if(empty.length){errors.push('Dòng '+line+': trống cột '+empty.join(', ')+', đã bỏ qua.');return;}
  var doc;if(use){doc=copy(use);doc.layers=doc.layers.map(function(L){if(!/\{\{/.test(L.text||''))return L;var r=fit(Object.assign({},L,{text:B.merge(L.text,row)}));if(r.overflow)errors.push('Dòng '+line+': chữ quá dài, đã cắt bớt.');return r.layer;});}
  else doc=cardDoc(row,parsed.headers,t);
  items.push({line:line,doc:doc,label:String(row[parsed.headers[0]]||'')});
 });
 parsed.errors.forEach(function(e){errors.push(e);});
 return{items:items,errors:errors,source:use?'poster':'card'};
}
var cancelled=false;
async function exportBatch(csv,format,progress){
 var set=batch(csv);cancelled=false;if(!set.items.length)throw new Error('Không có dòng hợp lệ. '+set.errors.join(' '));
 var files=[],pages=[],total=0;
 for(var i=0;i<set.items.length;i++){
  if(cancelled)throw new Error('Đã huỷ xuất lô.');
  var item=set.items[i],r=await toCanvas(item.doc,format==='pdf'?2:1);
  if(format==='pdf'){var pg=jpegPage(r.canvas,item.doc.w,item.doc.h);total+=pg.bytes.length;pages.push(pg);}
  else{total+=r.png.size;files.push({name:String(i+1).padStart(3,'0')+'-'+slug(item.label)+'.png',data:r.png});}
  if(total>250*1024*1024)throw new Error('Lô vượt 250 MB. Hãy chia CSV thành nhiều phần.');
  if(progress)progress(i+1,set.items.length);await sleep(0);
 }
 if(format==='pdf')return{blob:pdf(pages),name:'CANVIO_lo.pdf',count:pages.length,errors:set.errors};
 if(set.errors.length)files.push({name:'loi.txt',data:set.errors.join('\n')});
 return{blob:await CVZip.build(files),name:'CANVIO_lo_PNG.zip',count:set.items.length,errors:set.errors};
}

/* ---------- P240: six sizes as PNG, keeping fonts and illustrations ---------- */
function resizeDoc(doc,width,height){
 var s=Math.min(width/doc.w,height/doc.h),ox=(width-doc.w*s)/2,oy=(height-doc.h*s)/2;
 return{w:width,h:height,name:doc.name,layers:doc.layers.map(function(L){
  var h0=L.h||L.w,n=Object.assign({},L);
  if(L.type!=='text'&&L.x<=1&&L.y<=1&&L.w>=doc.w-2&&h0>=doc.h-2){n.x=0;n.y=0;n.w=width;n.h=height;return n;}
  n.x=L.x*s+ox;n.y=L.y*s+oy;n.w=L.w*s;if(L.h!=null)n.h=L.h*s;if(L.size)n.size=L.size*s;if(L.spacing)n.spacing=L.spacing*s;if(L.radius&&L.radius!==999)n.radius=L.radius*s;return n;
 })};
}
function posterSource(){var p=pack(),art=w.CVPosterArtP249,cur=w.CV&&CV.poster&&CV.poster.doc;if(cur&&cur.layers&&cur.layers.length)return cur;if(p&&art)return art.make(p.brief,art.selected(),{color:p.brand.custom?p.brand.primary:''});throw new Error('Tạo bộ sản phẩm hoặc mở một poster trước.');}
async function exportSizes(progress){
 var src=copy(posterSource()),list=CVMagicResizeP240.presets,files=[];
 for(var i=0;i<list.length;i++){var r=await toCanvas(resizeDoc(src,list[i][1],list[i][2]),1);files.push({name:slug(list[i][0])+'-'+list[i][1]+'x'+list[i][2]+'.png',data:r.png});if(progress)progress(i+1,list.length);}
 return{blob:await CVZip.build(files),count:files.length};
}

/* ---------- designed slides and storyboard ---------- */
function deckPages(kind){
 var p=pack(),t=theme();if(!p||!t)throw new Error('Hãy tạo bộ sản phẩm trước.');
 if(kind==='slides')return p.documents.slides.slides.map(function(s,i){
  var cover=i===0||s.layout==='closing',bg=cover?t.deep:t.cream,ink=cover?'#ffffff':t.deep;
  return{w:960,h:540,name:'Slide '+(i+1),layers:[box('rect',0,0,960,540,{bg:bg}),box('ellipse',cover?560:690,cover?60:270,440,440,{bg:t.a,opacity:cover?.9:.16}),
   hero(t,cover?600:730,cover?100:300,cover?340:220),box('rect',64,64,72,8,{bg:cover?t.pop:t.a,radius:4}),
   words(64,98,cover?520:830,cover?220:110,s.title,cover?62:46,ink,{font:'cvDisplay',weight:400,lineHeight:1.2}),
   words(64,cover?338:230,cover?500:620,cover?140:250,s.body,cover?22:24,ink,{lineHeight:1.5}),
   words(64,492,70,24,String(i+1).padStart(2,'0'),16,cover?t.pop:t.a,{weight:800})]};
 });
 var shots=p.documents.storyboard.shots,doc={w:960,h:700,name:'Storyboard',layers:[box('rect',0,0,960,700,{bg:t.cream}),words(40,26,880,60,p.documents.storyboard.title,32,t.deep,{font:'cvDisplay',weight:400,lineHeight:1.2})]};
 shots.slice(0,4).forEach(function(s,i){var x=40+(i%2)*450,y=104+Math.floor(i/2)*292;
  doc.layers.push(box('rect',x,y,430,176,{bg:i%2?t.a:t.deep,radius:16}),hero(t,x+[130,40,230,150][i],y+[8,24,4,0][i],[170,140,150,176][i]),
   box('rect',x+12,y+12,52,28,{bg:t.pop,radius:14}),words(x+12,y+17,52,20,String(i+1),15,t.deep,{weight:800,align:'center'}),
   words(x,y+186,430,28,s.title+' · '+s.duration+'s · '+s.camera,18,t.deep,{weight:800}),words(x,y+216,430,62,s.description,15,t.deep));
 });
 return[doc];
}
async function exportDeck(kind){var docs=deckPages(kind),pages=[];for(var i=0;i<docs.length;i++){var r=await toCanvas(docs[i],2);pages.push(jpegPage(r.canvas,docs[i].w,docs[i].h));}return{blob:pdf(pages),count:pages.length};}

/* ---------- P243: designed one-file website with an optional Supabase contact form ---------- */
var LEADS_SQL="create table if not exists public.cv_leads(id bigint generated always as identity primary key, name text not null check(char_length(name)<=120), contact text not null check(char_length(contact)<=160), message text check(char_length(message)<=2000), created_at timestamptz default now());\nalter table public.cv_leads enable row level security;\ndrop policy if exists cv_leads_insert on public.cv_leads;\ncreate policy cv_leads_insert on public.cv_leads for insert to anon with check (true);\ngrant insert on public.cv_leads to anon;";
function formConfig(url,key){
 url=String(url||'').trim().replace(/\/+$/,'');key=String(key||'').trim();if(!url&&!key)return null;
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url))throw new Error('URL Supabase phải có dạng https://xxxx.supabase.co');
 var secret=/^sb_secret_/i.test(key);try{secret=secret||JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role!=='anon';}catch(e){if(!/^sb_publishable_/i.test(key))secret=true;}
 if(secret)throw new Error('Chỉ dán khoá công khai (anon hoặc publishable). Không bao giờ đưa khoá service_role hay secret vào trang web.');
 return{url:url,key:key};
}
function siteHTML(form){
 var p=pack(),t=theme();if(!p||!t)throw new Error('Hãy tạo bộ sản phẩm trước.');
 var s=p.documents.website,hero0=s.sections[0],css=w.CVPosterArtP249.fonts||'';
 var parts=s.sections.slice(1).map(function(x){return'<section><div class="in"><h2>'+esc(x.heading)+'</h2>'+(x.body?'<p>'+esc(x.body)+'</p>':'')+(x.items?'<ul>'+x.items.map(function(i){return'<li>'+esc(i)+'</li>';}).join('')+'</ul>':'')+'</div></section>';}).join('');
 var contact='';
 if(form)contact='<section id="lien-he"><div class="in"><h2>Gửi liên hệ</h2><form id="lead"><label>Họ tên<input name="name" required maxlength="120"></label><label>Điện thoại hoặc email<input name="contact" required maxlength="160"></label><label>Lời nhắn<textarea name="message" rows="4" maxlength="2000"></textarea></label><button>Gửi</button><p id="sent" role="status"></p></form></div></section><script>(function(){var f=document.getElementById("lead"),s=document.getElementById("sent"),U='+JSON.stringify(form.url).replace(/</g,'\\u003c')+',K='+JSON.stringify(form.key).replace(/</g,'\\u003c')+';f.onsubmit=function(e){e.preventDefault();s.textContent="Đang gửi…";var h={apikey:K,"Content-Type":"application/json",Prefer:"return=minimal"};if(K.indexOf("sb_")!==0)h.Authorization="Bearer "+K;fetch(U+"/rest/v1/cv_leads",{method:"POST",headers:h,body:JSON.stringify(Object.fromEntries(new FormData(f)))}).then(function(r){if(!r.ok)throw 0;f.reset();s.textContent="Đã gửi. Cảm ơn bạn."}).catch(function(){s.textContent="Chưa gửi được, hãy thử lại."})}})()<\/script>';
 return'<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(s.title)+'</title><meta name="description" content="'+esc(s.meta.description||s.title)+'"><style>'+css+'*{box-sizing:border-box}body{margin:0;font-family:CVMont,system-ui,sans-serif;background:'+t.cream+';color:'+t.deep+';line-height:1.65}.in{max-width:980px;margin:0 auto;padding:56px 24px}header{background:linear-gradient(135deg,'+t.deep+','+t.a+');color:#fff}header .in{display:flex;gap:32px;align-items:center;flex-wrap:wrap}header .tx{flex:1 1 380px}header img{flex:0 1 340px;width:100%;max-width:340px}h1{font:400 clamp(36px,6vw,64px)/1.2 CVAnton,Impact,sans-serif;margin:0 0 16px}h2{font:400 34px/1.25 CVAnton,Impact,sans-serif;margin:0 0 14px}.cta,button{display:inline-block;background:'+t.pop+';color:'+t.deep+';border:0;border-radius:999px;padding:14px 28px;font:800 15px CVMont,sans-serif;text-decoration:none;cursor:pointer}section:nth-of-type(even){background:#fff}ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;list-style:none;padding:0}li{background:#fff;border-radius:16px;padding:20px;border-top:5px solid '+t.a+';font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.08)}form{display:grid;gap:12px;max-width:520px}input,textarea{display:block;width:100%;padding:12px;border:1px solid #c9c4d4;border-radius:10px;font:inherit}p{overflow-wrap:anywhere}</style></head><body><header><div class="in"><div class="tx"><h1>'+esc(s.title)+'</h1><p>'+esc(hero0.body)+'</p><a class="cta" href="#'+(form?'lien-he':'noi-dung')+'">'+esc(hero0.cta||'Liên hệ')+'</a></div><img src="'+esc(t.art.src)+'" alt="Hình minh hoạ '+esc(s.title)+'"></div></header><main id="noi-dung">'+parts+contact+'</main></body></html>';
}

/* ---------- P244/P245: captions and beat arrangement on the Video Engine owner ---------- */
async function videoPage(){var v=video();if(!v)throw new Error('Video Engine chưa sẵn sàng.');CV.go('videoEngine');if(!await waitFor(function(){return v._state()&&$('vtCaptionNow');}))throw new Error('Video Engine chưa mở được.');return v;}
function beatPlan(beats,clips,every){
 every=Math.max(1,Math.min(16,Math.round(every)||4));var v=video(),list=(clips||[]).filter(function(c){return c.track===1&&c.type!=='audio'&&!(v&&v.isClipLocked&&v.isClipLocked(c));}).sort(function(a,b){return a.start-b.start;});
 var marks=(beats||[]).filter(function(_,i){return i%every===0;}),out=[],at=0,m=1;
 if(marks.length<2)return out;at=marks[0];
 list.forEach(function(c){while(m<marks.length&&marks[m]-at<.3)m++;if(m>=marks.length)return;var span=marks[m]-at,dur=c.type==='video'?Math.min(span,c.duration):span;out.push({id:c.id,start:+at.toFixed(3),duration:+dur.toFixed(3)});at=c.type==='video'&&dur<span?+(at+dur).toFixed(3):marks[m++];});
 return out;
}
function applyBeatPlan(plan){
 var v=video(),st=v&&v._state();if(!st||!plan.length)return 0;
 var used={};plan.forEach(function(p){used[p.id]=p;});
 var end=plan[plan.length-1].start+plan[plan.length-1].duration;
 var clash=st.clips.some(function(c){return c.track===1&&c.type!=='audio'&&!used[c.id]&&c.start<end&&c.start+c.duration>plan[0].start;});
 if(clash)throw new Error('Có clip khoá hoặc clip chưa được xếp nằm trong đoạn này. Hãy chuyển clip đó ra sau rồi thử lại.');
 v._pro.pushUndo();st.clips.forEach(function(c){var p=used[c.id];if(p){c.start=p.start;c.duration=p.duration;}});v.commit();return plan.length;
}

/* ---------- P242: full bundle with video timeline and media ---------- */
function mediaDB(){return new Promise(function(res){var q=indexedDB.open('CANVIO_81_MEDIA',1);q.onupgradeneeded=function(){if(!q.result.objectStoreNames.contains('media'))q.result.createObjectStore('media',{keyPath:'id'});};q.onsuccess=function(){res(q.result);};q.onerror=function(){res(null);};});}
async function getMedia(id){var v=video(),st=v._state();if(st.fileRefs&&st.fileRefs[id])return st.fileRefs[id];var side=w.CVMediaOPFSP133;if(side&&side.get){var b=await side.get(id,st);if(b)return b;}var db=await mediaDB();if(!db)return null;return new Promise(function(res){var q=db.transaction('media').objectStore('media').get(id);q.onsuccess=function(){db.close();res(q.result&&q.result.blob||null);};q.onerror=function(){db.close();res(null);};});}
async function putMedia(id,blob){var st=video()._state(),side=w.CVMediaOPFSP133;(st.fileRefs=st.fileRefs||{})[id]=blob;if(side&&side.put)return side.put(id,blob,st);var db=await mediaDB();if(!db)throw new Error('Không mở được kho media.');return new Promise(function(res,rej){var tx=db.transaction('media','readwrite');tx.objectStore('media').put({id:id,blob:blob});tx.oncomplete=function(){db.close();res(true);};tx.onerror=function(){db.close();rej(tx.error);};});}
async function sha(blob){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(function(x){return x.toString(16).padStart(2,'0');}).join('');}
/* the strict .canvio reader requires ASCII names without the UTF-8 flag */
async function asciiZip(files){var b=new Uint8Array(await(await CVZip.build(files)).arrayBuffer()),v=new DataView(b.buffer),end=b.length-22,pos=v.getUint32(end+16,true),n=v.getUint16(end+10,true);for(var i=0;i<n;i++){v.setUint16(v.getUint32(pos+42,true)+6,0,true);v.setUint16(pos+8,0,true);pos+=46+v.getUint16(pos+28,true)+v.getUint16(pos+30,true)+v.getUint16(pos+32,true);}return new Blob([b],{type:'application/zip'});}
async function exportFull(){
 var v=video();if(!v)throw new Error('Video Engine chưa sẵn sàng.');
 var core=await CVProjectBundleP242.exportBundle(),timeline=v.snapshotState(),seen={},media=[],skipped=[],total=core.size,files=[];
 for(var c of timeline.clips){var id=c.mediaId||(c.type!=='text'?c.id:null);if(!id||seen[id])continue;seen[id]=1;
  var blob=await getMedia(id);if(!blob){skipped.push((c.name||id)+' (không còn tệp)');continue;}
  if(blob.size>25*1024*1024||total+blob.size>110*1024*1024||media.length>=100){skipped.push((c.name||id)+' (vượt giới hạn 25 MB/tệp hoặc 110 MB/gói)');continue;}
  total+=blob.size;var name='media/'+media.length+'.bin';media.push({id:id,file:name,type:blob.type,sha256:await sha(blob),size:blob.size});files.push({name:name,data:blob});}
 var manifest={format:'CANVIO_FULL_BUNDLE',version:1,core:await sha(core),timeline:timeline,media:media,skipped:skipped};
 files.unshift({name:'full.json',data:JSON.stringify(manifest)},{name:'core.canvio',data:core});
 return{blob:await asciiZip(files),media:media.length,skipped:skipped};
}
async function importFull(file,confirmFn){
 var e=await CVProjectBundleP242.readStoredZip(file);if(!e['full.json']||!e['core.canvio'])throw new Error('Đây không phải gói đầy đủ .canvio.');
 var m=JSON.parse(new TextDecoder().decode(e['full.json']));if(m.format!=='CANVIO_FULL_BUNDLE'||!m.timeline||!Array.isArray(m.timeline.clips)||!Array.isArray(m.media))throw new Error('Manifest không hợp lệ.');
 var core=new Blob([e['core.canvio']]);if(await sha(core)!==m.core)throw new Error('Dữ liệu dự án đã bị thay đổi (sai SHA-256).');
 var blobs=[];for(var x of m.media){var bytes=e[x.file];if(!bytes)throw new Error('Thiếu tệp media '+x.file);var b=new Blob([bytes],{type:x.type});if(await sha(b)!==x.sha256)throw new Error('Media sai SHA-256: '+x.file);blobs.push({id:String(x.id),blob:b});}
 var ask=confirmFn||function(){return w.confirm('Nhập dự án này và thay timeline video đang mở? ('+blobs.length+' tệp media)');};
 if(!ask(m))return{ok:false,cancelled:true};
 var v=await videoPage(),st=v._state();
 for(var y of blobs){if(await getMedia(y.id))continue;await putMedia(y.id,y.blob);}
 var r=await CVProjectBundleP242.importBundle(new File([core],'core.canvio'),function(){return true;});
 v._pro.pushUndo();blobs.forEach(function(y){(st.fileRefs=st.fileRefs||{})[y.id]=y.blob;});
 if(!v.restoreState(m.timeline))throw new Error('Video Engine từ chối timeline.');v.commit();
 return{ok:true,media:blobs.length,projectId:r.projectId,skipped:m.skipped||[]};
}

/* ---------- P246: review notes and version comparison ---------- */
function review(){var p=project();return p&&p.documents&&p.documents.collaborationLite||{comments:[],versions:[]};}
function capture(){try{CVCreativeCore.capture('project');}catch(e){}}
function flatten(v,path,out){if(v&&typeof v==='object'){Object.keys(v).forEach(function(k){if(!/^(createdAt|updated|id)$/.test(k))flatten(v[k],path?path+'.'+k:k,out);});}else out[path]=String(v);return out;}
function compare(versionId){
 var p=project(),ver=review().versions.filter(function(v){return v.id===versionId;})[0];if(!p||!ver)return null;
 var now=copy(p.documents||{});delete now.collaborationLite;var a=flatten(ver.project.documents,'',{}),b=flatten(now,'',{}),keys=Object.keys(Object.assign({},a,b)),out=[];
 keys.forEach(function(k){if(a[k]!==b[k])out.push({path:k,before:a[k]==null?null:a[k],after:b[k]==null?null:b[k]});});return out;
}
function restoreVersion(versionId){
 var p=project(),ver=review().versions.filter(function(v){return v.id===versionId;})[0];if(!p||!ver)return false;
 CVCollabLiteP246.snapshot('Trước khi khôi phục');var keep=p.documents.collaborationLite;p.documents=copy(ver.project.documents);p.documents.collaborationLite=keep;p.brief=ver.project.brief;capture();return true;
}
function exportReview(){var p=project();if(!p)throw new Error('Chưa có dự án.');return new Blob([JSON.stringify({format:'CANVIO_REVIEW',version:1,project:p.name,comments:review().comments})],{type:'application/json'});}
function importReview(text){
 var x=JSON.parse(text);if(!x||x.format!=='CANVIO_REVIEW'||!Array.isArray(x.comments))throw new Error('Không phải tệp góp ý CANVIO.');
 var p=project();if(!p)throw new Error('Chưa có dự án.');p.documents=p.documents||{};var r=p.documents.collaborationLite||(p.documents.collaborationLite={version:1,comments:[],versions:[]}),have={},added=0;
 r.comments.forEach(function(c){have[c.id+c.text]=1;});
 x.comments.slice(0,200).forEach(function(c){if(!c||typeof c.text!=='string')return;var n={id:String(c.id||'c').slice(0,40),text:c.text.slice(0,600),target:String(c.target||'canvas').slice(0,100),createdAt:String(c.createdAt||'').slice(0,40),resolved:!!c.resolved};if(!have[n.id+n.text]){r.comments.push(n);have[n.id+n.text]=1;added++;}});
 r.comments=r.comments.slice(-200);capture();return added;
}

/* ---------- P248: honest device check ---------- */
async function deviceCheck(comfy){
 var out={cores:navigator.hardwareConcurrency||null,memoryGB:navigator.deviceMemory||null,gpu:null,vramGB:null,computeMs:null,comfy:null};
 var t=performance.now(),a=new Float32Array(4e6),s=0;for(var i=0;i<a.length;i++){a[i]=Math.sin(i);s+=a[i]*a[i];}out.computeMs=Math.round(performance.now()-t);
 try{var gl=d.createElement('canvas').getContext('webgl'),x=gl&&gl.getExtension('WEBGL_debug_renderer_info');out.gpu=gl?String(gl.getParameter(x?x.UNMASKED_RENDERER_WEBGL:gl.RENDERER)):null;}catch(e){}
 if(comfy){try{var base=CVComfyP120P126.normalizeBase(comfy),j=await(await fetch(base+'/system_stats')).json(),dev=j.devices&&j.devices[0];if(dev&&dev.vram_total){out.vramGB=+(dev.vram_total/1073741824).toFixed(1);out.gpu=String(dev.name||out.gpu).slice(0,120);}out.comfy='kết nối được';}catch(e){out.comfy='không kết nối được';}}
 var r=CVLocalModelsP248.recommend(out.memoryGB||7,out.vramGB||0);out.tier=r.tier;out.reason=r.reason+(out.memoryGB>=8?' (trình duyệt chỉ báo tối đa 8 GB RAM).':'');
 return out;
}

/* ---------- UI: extends the existing Studio Pro cards ---------- */
function panel(card,id,title){var host=$(card);if(!host||$(id))return null;var box0=el('div',{id:id,'class':'cv250'});if(title)box0.appendChild(el('strong',{text:title}));host.appendChild(box0);return box0;}
function row(parent){var r=el('div',{'class':'row cv250-row'});parent.appendChild(r);return r;}
function status(parent){var s=el('div',{'class':'tiny cv250-status',role:'status','aria-live':'polite'});parent.appendChild(s);return s;}
function button(parent,id,label,out,fn){var b=el('button',{id:id,type:'button','class':'btn btn-soft sm',text:label});b.onclick=async function(){b.disabled=true;out.textContent='Đang xử lý…';try{var msg=await fn();out.textContent=msg||'Xong.';}catch(e){out.textContent=String(e&&e.message||e);}finally{b.disabled=false;}};parent.appendChild(b);return b;}
function input(parent,id,label,attrs){var i=el(attrs.tag||'input',Object.assign({id:id,'class':'input','aria-label':label,placeholder:label},attrs));i.removeAttribute('tag');parent.appendChild(i);return i;}
function select(parent,id,label,options){var s=el('select',{id:id,'class':'input','aria-label':label},options.map(function(o){return el('option',{value:o[0],text:o[1]});}));parent.appendChild(s);return s;}
function progress(out){return function(i,n){out.textContent='Đang kết xuất '+i+'/'+n+'…';};}
function homeButton(){var field=$('ws-jin');if(!field||$('cv250-home'))return;var b=el('button',{id:'cv250-home',type:'button','class':'btn btn-soft',text:'✦ Trọn bộ từ brief'});b.onclick=openStudio;field.parentNode.appendChild(b);}
var mounts=[
 function(){var p=panel('cv240-card','cv250-sizes','Ảnh PNG giữ nguyên phông và hình');if(!p)return;var r=row(p),s=status(p);button(r,'cv250-sizes-run','Xuất 6 khổ PNG',s,async function(){var x=await exportSizes(progress(s));download(x.blob,'CANVIO_6_kho.zip');return'Đã xuất '+x.count+' ảnh. Khổ khác tỉ lệ được canh giữa trên nền kéo giãn.';});},
 function(){var p=panel('cv241-card','cv250-bulk','Xuất ảnh hoặc PDF');if(!p)return;p.appendChild(el('div',{'class':'tiny',text:'Muốn dùng thiết kế của bạn: mở poster và gõ {{name}} hoặc {{tên_cột}} vào chữ. Nếu không, CANVIO dùng mẫu thẻ có sẵn.'}));
  var r=row(p),s=status(p),view=el('div',{id:'cv250-preview','data-cvg-skip':''}),at=0;
  var csv=function(){return $('cv241-csv').value;},show=function(step){var set=batch(csv());if(!set.items.length)throw new Error(set.errors.join(' '));at=(at+step+set.items.length)%set.items.length;view.innerHTML=CV.preview.thumb(set.items[at].doc,320,220,10);return'Dòng '+set.items[at].line+' · '+(at+1)+'/'+set.items.length+(set.errors.length?'\n'+set.errors.slice(0,8).join('\n'):'');};
  button(r,'cv250-prev','Xem trước',s,function(){at=0;return show(0);});button(r,'cv250-next','Dòng sau ›',s,function(){return show(1);});
  ['png','pdf'].forEach(function(f){button(r,'cv250-'+f,f==='png'?'Xuất PNG (ZIP)':'Xuất PDF',s,async function(){var x=await exportBatch(csv(),f,progress(s));download(x.blob,x.name);return'Đã xuất '+x.count+' trang.'+(x.errors.length?'\n'+x.errors.slice(0,8).join('\n'):'');});});
  r.appendChild(el('button',{id:'cv250-cancel',type:'button','class':'btn btn-ghost sm',text:'Huỷ',on:function(){cancelled=true;}}));p.appendChild(view);},
 function(){var p=panel('cv242-card','cv250-full','Gói đầy đủ kèm video');if(!p)return;var r=row(p),s=status(p),f=el('input',{id:'cv250-full-file',type:'file',accept:'.canvio',hidden:''});
  button(r,'cv250-full-export','Xuất gói đầy đủ',s,async function(){var x=await exportFull();download(x.blob,'CANVIO_day_du.canvio');return'Đã đóng gói '+x.media+' tệp media.'+(x.skipped.length?' Bỏ qua: '+x.skipped.join('; '):'');});
  r.appendChild(el('button',{type:'button','class':'btn btn-ghost sm',text:'Nhập gói đầy đủ',on:function(){f.click();}}));r.appendChild(f);
  f.onchange=function(){var file=f.files[0];f.value='';if(!file)return;s.textContent='Đang kiểm tra gói…';importFull(file).then(function(x){s.textContent=x.ok?'Đã khôi phục dự án và '+x.media+' tệp media.':'Đã huỷ.';}).catch(function(e){s.textContent=e.message;});};
  button(r,'cv250-space','Dung lượng đã dùng',s,async function(){var q=await navigator.storage.estimate();return'Đã dùng '+(q.usage/1048576).toFixed(1)+' MB trên khoảng '+(q.quota/1048576/1024).toFixed(1)+' GB trình duyệt cho phép.';});},
 function(){var p=panel('cv243-card','cv250-site','Trang đẹp từ bộ sản phẩm');if(!p)return;var url=input(row(p),'cv250-sb-url','URL Supabase (tuỳ chọn, cho biểu mẫu liên hệ)',{}),key=input(url.parentNode,'cv250-sb-key','Khoá công khai anon',{autocomplete:'off'}),r=row(p),s=status(p);
  var make=function(){return siteHTML(formConfig(url.value,key.value));};
  button(r,'cv250-site-fill','Tạo trang',s,function(){var html=make();$('cv243-html').value=html;var a=CVWebsitePublishP243.audit(html);return a.ok?'Đã điền trang đạt kiểm tra SEO vào ô bên trên.':a.checks.filter(function(c){return!c.ok;}).map(function(c){return c.message;}).join(' ');});
  button(r,'cv250-site-save','Tải file HTML',s,function(){var html=$('cv243-html').value||make();download(new Blob([html],{type:'text/html'}),'index.html');});
  button(r,'cv250-site-engine','Lấy từ Website Engine',s,function(){var x=video()&&CV.engines.web.snapshotWebsite();if(!x||!x.ready)throw new Error('Hãy mở Website Engine và tạo trang trước.');$('cv243-html').value='<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title></title><meta name="description" content=""><style>'+x.css+'</style></head><body>'+x.html+'</body></html>';return'Đã lấy trang. Điền title và description trong mã rồi kiểm tra SEO.';});
  button(r,'cv250-sql','Chép SQL biểu mẫu',s,async function(){await navigator.clipboard.writeText(LEADS_SQL);return'Đã chép. Dán vào Supabase → SQL Editor rồi bấm Run.';});},
 function(){var p=panel('cv244-card','cv250-cap','Phụ đề tự động và giọng đọc');if(!p)return;var r=row(p),s=status(p),list=el('div',{id:'cv250-cues'});
  button(r,'cv250-whisper','Tạo phụ đề tự động',s,async function(){var v=await videoPage();v.whisperCaption();return'Chọn tệp trong Video Engine. Lần đầu cần mạng để tải mô hình Whisper.';});
  var draw=function(){list.textContent='';CVCaptionVoiceP244.captions().forEach(function(c){var i=el('input',{'class':'input','data-cue':c.id,'aria-label':'Phụ đề tại giây '+c.start});i.value=c.text||'';i.onchange=function(){s.textContent=video().captionEdit(c.id,i.value)?'Đã sửa, có thể hoàn tác trong Video.':'Clip đang khoá.';};list.appendChild(el('label',{'class':'row cv250-row'},[el('span',{'class':'tiny',text:(+c.start).toFixed(1)+'s'}),i]));});return CVCaptionVoiceP244.captions().length+' dòng phụ đề.';};
  button(r,'cv250-cue-list','Sửa từng dòng',s,draw);
  var voices=select(r,'cv250-voice','Giọng đọc',[['','Giọng mặc định']]);var fill=function(){if(!w.speechSynthesis)return;speechSynthesis.getVoices().forEach(function(v){if(![].some.call(voices.options,function(o){return o.value===v.name;}))voices.appendChild(el('option',{value:v.name,text:v.name+' · '+v.lang}));});};fill();if(w.speechSynthesis)speechSynthesis.onvoiceschanged=fill;
  button(r,'cv250-speak','Đọc bằng giọng đã chọn',s,function(){var text=CVCaptionVoiceP244.captions().map(function(c){return c.text;}).join('. ');if(!text)throw new Error('Chưa có phụ đề.');var u=new SpeechSynthesisUtterance(text.slice(0,3000));u.lang='vi-VN';var v=speechSynthesis.getVoices().filter(function(x){return x.name===voices.value;})[0];if(v){u.voice=v;u.lang=v.lang;}speechSynthesis.cancel();speechSynthesis.speak(u);return'Đang đọc.';});p.appendChild(list);},
 function(){var p=panel('cv245-card','cv250-beat','Dựng theo nhạc');if(!p)return;var r=row(p),s=status(p),every=select(r,'cv250-every','Nhịp mỗi cảnh',[['2','Nhanh · 2 nhịp'],['4','Vừa · 4 nhịp'],['8','Chậm · 8 nhịp']]);every.value='4';
  button(r,'cv250-arrange','Xếp cảnh theo nhạc',s,async function(){var f=$('cv245-file').files[0];if(!f)throw new Error('Chọn tệp nhạc ở ô phía trên.');var a=await CVBeatEditorP245.analyze(f),v=await videoPage(),plan=beatPlan(a.beats,v._state().clips,+every.value);if(!plan.length)throw new Error('Cần clip hình trên timeline và nhạc có nhịp rõ.');if(!w.confirm('Xếp lại '+plan.length+' cảnh theo nhịp ('+(a.bpm||'?')+' BPM)?'))return'Đã huỷ.';return'Đã xếp '+applyBeatPlan(plan)+' cảnh. Có thể hoàn tác.';});
  button(r,'cv250-cutbeat','Cắt clip đang chọn theo nhịp',s,async function(){var v=await videoPage();var n=await v.beatSync({beats:+every.value});return n?'Đã cắt '+n+' điểm.':'Chưa cắt được: chọn clip có nhạc trên timeline.';});
  button(r,'cv250-silence','Cắt khoảng lặng',s,async function(){var v=await videoPage();var n=await v.autoCut({thr:-35,min:.5,remove:false});return n?'Đã đặt '+n+' điểm cắt.':'Chưa cắt: chọn clip có tiếng và khoảng lặng.';});
  button(r,'cv250-undo','Hoàn tác',s,function(){return video().undoAuto()?'Đã hoàn tác.':'Không còn gì để hoàn tác.';});},
 function(){var p=panel('cv246-card','cv250-review','Danh sách góp ý và phiên bản');if(!p)return;var r=row(p),s=status(p),list=el('div',{id:'cv250-review-list'}),f=el('input',{id:'cv250-review-file',type:'file',accept:'.json',hidden:''});
  var draw=function(){list.textContent='';review().comments.slice().reverse().forEach(function(c){var line=el('div',{'class':'row cv250-row','data-comment':c.id},[el('span',{text:(c.resolved?'✓ ':'• ')+c.text+(c.target&&c.target!=='canvas'?' ['+c.target+']':'')})]);line.appendChild(el('button',{type:'button','class':'btn btn-ghost sm',text:c.resolved?'Mở lại':'Đã xử lý',on:function(){c.resolved=!c.resolved;capture();draw();}}));list.appendChild(line);});
   review().versions.slice().reverse().forEach(function(v){var line=el('div',{'class':'row cv250-row','data-version':v.id},[el('span',{text:'⟲ '+v.label})]);line.appendChild(el('button',{type:'button','class':'btn btn-ghost sm',text:'So sánh',on:function(){var x=compare(v.id);s.textContent=x.length?x.length+' thay đổi:\n'+x.slice(0,12).map(function(y){return y.path+': '+(y.before||'∅').slice(0,50)+' → '+(y.after||'∅').slice(0,50);}).join('\n'):'Giống hệt hiện tại.';}}));line.appendChild(el('button',{type:'button','class':'btn btn-ghost sm',text:'Khôi phục',on:function(){if(w.confirm('Khôi phục “'+v.label+'”? Bản hiện tại được lưu lại trước.')){restoreVersion(v.id);draw();s.textContent='Đã khôi phục.';}}}));list.appendChild(line);});
   return review().comments.length+' góp ý · '+review().versions.length+' phiên bản.';};
  button(r,'cv250-review-show','Xem danh sách',s,draw);
  button(r,'cv250-pin','Ghim vào lớp poster đang chọn',s,function(){var L=CV.poster&&CV.poster.selected,x=CVCollabLiteP246.comment($('cv246-comment').value,L?(L.text||L.type).slice(0,40):'canvas');if(!x.ok)throw new Error(x.error);draw();return'Đã ghim.';});
  button(r,'cv250-review-export','Xuất tệp góp ý',s,function(){download(exportReview(),'CANVIO_gop_y.json');});
  r.appendChild(el('button',{type:'button','class':'btn btn-ghost sm',text:'Nhập góp ý',on:function(){f.click();}}));r.appendChild(f);
  f.onchange=function(){var file=f.files[0];f.value='';if(!file||file.size>1e6){s.textContent='Tệp góp ý tối đa 1 MB.';return;}file.text().then(function(t){var n=importReview(t);draw();s.textContent='Đã thêm '+n+' góp ý.';}).catch(function(e){s.textContent=e.message;});};p.appendChild(list);},
 function(){var p=panel('cv247-card','cv250-app','Cài như ứng dụng');if(!p)return;var r=row(p),s=status(p);
  button(r,'cv250-install','Cài CANVIO lên máy',s,async function(){if(w.matchMedia('(display-mode: standalone)').matches)return'Bạn đang chạy bản đã cài.';if(!installEvent)return'Trên Chrome: mở menu ⋮ → “Truyền, lưu và chia sẻ” → “Cài đặt trang dưới dạng ứng dụng”.';installEvent.prompt();var c=await installEvent.userChoice;installEvent=null;return c.outcome==='accepted'?'Đã cài.':'Đã huỷ.';});
  button(r,'cv250-offline','Kiểm tra chạy ngoại tuyến',s,async function(){var reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();return reg&&reg.active?'Đã sẵn sàng mở lại khi mất mạng.':'Chưa sẵn sàng: mở trang qua https, đợi tải xong rồi tải lại một lần.';});},
 function(){var p=panel('cv248-card','cv250-device','Chạy thử máy');if(!p)return;var r=row(p),s=status(p);button(r,'cv250-device-run','Đo máy và gợi ý mức mô hình',s,async function(){var x=await deviceCheck(/connect|online/.test($('cv248-status').textContent)?$('cv248-url').value:'');return'Nhân CPU: '+(x.cores||'?')+' · RAM trình duyệt báo: '+(x.memoryGB||'?')+' GB · GPU: '+(x.gpu||'không rõ')+(x.vramGB?' · VRAM '+x.vramGB+' GB':'')+'\nPhép tính thử: '+x.computeMs+' ms\nGợi ý: '+x.tier+'. '+x.reason;});},
 function(){var host=$('cv239-docs');if(!host||$('cv250-decks'))return;var p=el('div',{id:'cv250-decks','class':'cv250'}),r=row(p),s=status(p);host.parentNode.insertBefore(p,$('cvstudio-pro-tools'));
  button(r,'cv250-slides','Tải slide đẹp (PDF)',s,async function(){var x=await exportDeck('slides');download(x.blob,'CANVIO_slide.pdf');return'Đã xuất '+x.count+' slide.';});
  button(r,'cv250-board','Tải bảng phân cảnh (PDF)',s,async function(){var x=await exportDeck('storyboard');download(x.blob,'CANVIO_storyboard.pdf');return'Đã xuất bảng phân cảnh.';});
  button(r,'cv250-web','Tải website đẹp (HTML)',s,function(){download(new Blob([siteHTML(null)],{type:'text/html'}),'index.html');return'Đã tải trang HTML một tệp.';});},
 homeButton
];
async function openStudio(){CV.go('projectVault');if(w.CVBriefPackP239)CVBriefPackP239.mount();if(!await waitFor(function(){return $('cvstudio-pro-p239');}))return false;mount();var home=$('ws-jin'),brief=$('cv239-brief');if(home&&brief&&home.value.trim()&&!brief.value.trim())brief.value=home.value.trim();if(brief)brief.focus({preventScroll:true});await sleep(500);$('cvstudio-pro-p239').scrollIntoView({block:'start'});return true;}
var installEvent=null;w.addEventListener('beforeinstallprompt',function(e){e.preventDefault();installEvent=e;});
function mount(){mounts.forEach(function(f){try{f();}catch(e){console.error('[CANVIO P250]',e);}});return!!$('cv250-device')&&!!$('cv250-home');}
function start(){var css=el('style',{id:'cv250-css',text:'.cv250{margin-top:12px;display:grid;gap:8px;min-width:0}.cv250-row{gap:8px;flex-wrap:wrap;align-items:center}.cv250 .input{flex:1 1 180px;min-width:0;width:auto}.cv250-status{white-space:pre-line;overflow-wrap:anywhere}#cv250-preview,#cv250-preview>div{max-width:100%}#cv250-home{white-space:nowrap}@media(max-width:600px){#cv250-home{white-space:normal;flex:1 1 100%}}'});d.head.appendChild(css);var n=0;(function again(){if(!mount()&&++n<200)w.setTimeout(again,300);})();var page=$('page-home');if(page&&w.MutationObserver)new MutationObserver(homeButton).observe(page,{childList:true,subtree:true});}
w.CVStudioCompleteP250={version:'250.0.0',mount:mount,openStudio:openStudio,pdf:pdf,batch:batch,exportBatch:exportBatch,resizeDoc:resizeDoc,exportSizes:exportSizes,deckPages:deckPages,exportDeck:exportDeck,formConfig:formConfig,siteHTML:siteHTML,leadsSql:LEADS_SQL,beatPlan:beatPlan,applyBeatPlan:applyBeatPlan,exportFull:exportFull,importFull:importFull,putMedia:putMedia,getMedia:getMedia,compare:compare,restoreVersion:restoreVersion,exportReview:exportReview,importReview:importReview,deviceCheck:deviceCheck};
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window,document);
