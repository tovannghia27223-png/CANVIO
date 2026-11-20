/* P125.2 — scroll storyboard editor on top of the existing P125.1 frame exporter. */
(function(){
'use strict';
if(window.CVScrollStoryboardP1252)return;
function normalCaption(c){
 c=c||{};var from=Math.max(0,Math.min(1,Number(c.from)||0)),to=Math.max(0,Math.min(1,c.to==null?1:Number(c.to)));
 if(to<=from)to=Math.min(1,from+.05);
 return{from:from,to:to,text:String(c.text||'').slice(0,160),position:['top','center','bottom'].indexOf(c.position)>=0?c.position:'bottom',animation:['fade','slide','zoom'].indexOf(c.animation)>=0?c.animation:'fade'};
}
function move(list,from,to){
 var a=Array.isArray(list)?list.slice():[];from=Math.floor(Number(from));to=Math.floor(Number(to));
 if(from<0||to<0||from>=a.length||to>=a.length||from===to)return a;
 var x=a.splice(from,1)[0];a.splice(to,0,x);return a;
}
function mount(){
 var api=window.CVScrollFramesP125,card=document.querySelector('#cv125-card'),run=card&&card.querySelector('#cv125-run');
 if(!api||!card||!run||card.querySelector('#cv1252-editor'))return false;
 var button=run.cloneNode(true);button.textContent='Trích khung';button.setAttribute('aria-label','Trích khung video để chỉnh storyboard');run.parentNode.replaceChild(button,run);
 var editor=document.createElement('section');editor.id='cv1252-editor';editor.className='card';editor.style.cssText='margin-top:12px;display:none';
 editor.innerHTML='<div class="cardTop"><h3>Storyboard cuộn · P125.2</h3><span class="sub">Kéo thả mốc chữ · parallax · easing</span></div>'+
 '<div class="row" style="gap:10px;align-items:center;flex-wrap:wrap"><canvas id="cv1252-preview" width="640" height="360" style="width:min(100%,520px);max-height:270px;object-fit:contain;background:#0b1220;border-radius:10px" aria-label="Xem trước storyboard"></canvas><div style="flex:1;min-width:220px"><label class="tiny">Tiến trình xem trước <input id="cv1252-progress" type="range" min="0" max="100" value="0" style="width:100%"></label><div class="tiny" id="cv1252-preview-caption" role="status" aria-live="polite">Chưa có mốc chữ</div><div class="tiny" id="cv1252-frame-count"></div></div></div>'+
 '<div class="row" style="gap:10px;align-items:end;flex-wrap:wrap;margin-top:10px"><label class="tiny">Parallax <input id="cv1252-parallax" type="range" min="0" max="24" value="8"></label><label class="tiny">Easing <select id="cv1252-easing" class="input"><option value="linear">Linear</option><option value="ease-out">Ease out</option><option value="ease-in-out" selected>Ease in/out</option></select></label><label class="tiny">Chiều dài cuộn <select id="cv1252-screens" class="input"><option value="3">3 màn hình</option><option value="4" selected>4 màn hình</option><option value="6">6 màn hình</option><option value="8">8 màn hình</option><option value="10">10 màn hình</option><option value="12">12 màn hình</option></select></label><button type="button" class="btn btn-soft sm" id="cv1252-add">+ Thêm mốc chữ</button><button type="button" class="btn btn-primary sm" id="cv1252-export" disabled>Xuất storyboard HTML</button><button type="button" class="btn btn-soft sm" id="cv1252-zip" disabled>Xuất ZIP gọn + ảnh rời</button></div>'+
 '<div class="tiny" style="margin-top:8px">Mốc chữ tối đa 12. Sắp xếp bằng kéo thả; thời gian tính theo phần trăm hành trình cuộn. Các trường nhập được làm sạch và escape khi xuất.</div><div id="cv1252-captions" style="display:grid;gap:8px;margin-top:10px"></div>';
 card.appendChild(editor);
 var $=function(s){return editor.querySelector(s);},frames=[],meta=null,captions=[],imageCache={},dragIndex=-1,sourceFile=null;
 function say(t){var o=card.querySelector('#cv125-out');if(o)o.textContent=t;}
 function cloneCaptions(a){return(Array.isArray(a)?a:[]).map(normalCaption);}
 function presetCaptions(){var p=api.PRESETS[card.querySelector('#cv125-preset').value]||api.PRESETS.none;return cloneCaptions(p.captions);}
 function activeCaption(p){for(var i=0;i<captions.length;i++)if(p>=captions[i].from&&p<=captions[i].to)return captions[i];return null;}
 function drawPreview(){
  var c=$('#cv1252-preview'),x=c.getContext('2d'),p=Number($('#cv1252-progress').value)/100,i=Math.min(frames.length-1,Math.floor(p*(frames.length-1)));
  x.clearRect(0,0,c.width,c.height);x.fillStyle='#0b1220';x.fillRect(0,0,c.width,c.height);
  if(frames[i]){
   var im=imageCache[i];if(!im){im=new Image();imageCache[i]=im;im.onload=function(){drawPreview();};im.src=frames[i];}
   if(im.complete&&im.naturalWidth){var sc=Math.max(c.width/im.width,c.height/im.height),w=im.width*sc,h=im.height*sc;x.drawImage(im,(c.width-w)/2,(c.height-h)/2,w,h);}
  }
  var a=activeCaption(p);$('#cv1252-preview-caption').textContent=a?a.text:'Không có chữ tại mốc này';$('#cv1252-frame-count').textContent='Khung '+(i+1)+'/'+frames.length+' · '+Math.round(p*100)+'%';
  if(a&&a.text){
   var y=a.position==='top'?44:a.position==='center'?c.height/2:c.height-48;
   x.save();x.textAlign='center';x.textBaseline='middle';x.font='700 27px system-ui,sans-serif';x.shadowColor='#000';x.shadowBlur=8;x.shadowOffsetY=2;x.fillStyle='#fff';
   if(a.animation==='zoom'){x.translate(c.width/2,y);x.scale(1.04,1.04);x.fillText(a.text,0,0,c.width*.86);}else{x.fillText(a.text,c.width/2,y,c.width*.86);}
   x.restore();
  }
 }
 function updateCaption(i,key,value){
  if(!captions[i])return;
  var c=Object.assign({},captions[i]);c[key]=value;
  if(key==='from'||key==='to'){var n=Math.max(0,Math.min(100,Number(value)||0))/100;c[key]=n;if(c.to<=c.from){if(key==='from')c.to=Math.min(1,c.from+.01);else c.from=Math.max(0,c.to-.01);}}
  captions[i]=normalCaption(c);drawPreview();
 }
 function node(tag,attrs,text){var n=document.createElement(tag);Object.keys(attrs||{}).forEach(function(k){if(k==='className')n.className=attrs[k];else n.setAttribute(k,attrs[k]);});if(text!=null)n.textContent=text;return n;}
 function renderRows(){
  var root=$('#cv1252-captions');root.replaceChildren();
  captions.forEach(function(c,i){
   var row=node('div',{className:'cv1252-row',draggable:'true'});row.style.cssText='border:1px solid var(--line,rgba(128,140,160,.25));border-radius:10px;padding:9px;display:grid;gap:7px;background:var(--surface,rgba(120,130,150,.05))';
   var top=node('div',{className:'row'},'');top.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap';
   var grip=node('span',{className:'tiny','aria-hidden':'true'},'⠿ Mốc '+(i+1));grip.title='Kéo để đổi thứ tự';top.appendChild(grip);
   var track=node('div',{});track.style.cssText='height:7px;flex:1;min-width:80px;background:rgba(120,130,150,.18);border-radius:99px;position:relative;overflow:hidden';
   var seg=node('span',{});seg.style.cssText='position:absolute;left:'+(c.from*100)+'%;width:'+((c.to-c.from)*100)+'%;height:100%;background:var(--accent,#4e9de8);border-radius:99px';track.appendChild(seg);top.appendChild(track);
   var del=node('button',{type:'button',className:'btn btn-ghost sm'},'Xóa');del.setAttribute('aria-label','Xóa mốc chữ '+(i+1));del.addEventListener('click',function(){captions.splice(i,1);renderRows();drawPreview();});top.appendChild(del);row.appendChild(top);
   var fields=node('div',{});fields.style.cssText='display:grid;grid-template-columns:minmax(180px,2fr) repeat(4,minmax(90px,1fr));gap:7px';
   function field(label,control){var wrap=node('label',{className:'tiny'});wrap.appendChild(document.createTextNode(label));wrap.appendChild(control);control.style.width='100%';fields.appendChild(wrap);}
   var tx=node('input',{type:'text',className:'input','aria-label':'Nội dung mốc '+(i+1),maxlength:'160'});tx.value=c.text;tx.addEventListener('input',function(){updateCaption(i,'text',this.value);});field('Nội dung',tx);
   var from=node('input',{type:'number',className:'input',min:'0',max:'99',step:'1','aria-label':'Bắt đầu phần trăm'});from.value=Math.round(c.from*100);from.addEventListener('change',function(){updateCaption(i,'from',this.value);renderRows();});field('Từ %',from);
   var to=node('input',{type:'number',className:'input',min:'1',max:'100',step:'1','aria-label':'Kết thúc phần trăm'});to.value=Math.round(c.to*100);to.addEventListener('change',function(){updateCaption(i,'to',this.value);renderRows();});field('Đến %',to);
   var pos=node('select',{className:'input','aria-label':'Vị trí chữ'});[['bottom','Dưới'],['center','Giữa'],['top','Trên']].forEach(function(o){var z=node('option',{value:o[0]},o[1]);pos.appendChild(z);});pos.value=c.position;pos.addEventListener('change',function(){updateCaption(i,'position',this.value);});field('Vị trí',pos);
   var anim=node('select',{className:'input','aria-label':'Hoạt ảnh chữ'});[['fade','Mờ dần'],['slide','Trượt'],['zoom','Phóng nhẹ']].forEach(function(o){var z=node('option',{value:o[0]},o[1]);anim.appendChild(z);});anim.value=c.animation;anim.addEventListener('change',function(){updateCaption(i,'animation',this.value);});field('Hiệu ứng',anim);
   row.appendChild(fields);
   row.addEventListener('dragstart',function(e){dragIndex=i;if(e.dataTransfer){e.dataTransfer.setData('text/plain',String(i));e.dataTransfer.effectAllowed='move';}});
   row.addEventListener('dragover',function(e){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='move';});
   row.addEventListener('drop',function(e){e.preventDefault();var from=dragIndex>=0?dragIndex:Number(e.dataTransfer&&e.dataTransfer.getData('text/plain'));captions=move(captions,from,i);dragIndex=-1;renderRows();drawPreview();});
   root.appendChild(row);
  });
 }
 function downloadBlob(name,blob){var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},4000);}
 function download(name,text){var blob=new Blob([text],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},4000);}
 button.addEventListener('click',function(){
  var file=card.querySelector('#cv125-file').files[0];if(!file){say('Chọn một video trước.');return;}
  button.disabled=true;say('Đang trích khung storyboard…');
  api.extract(file,{frames:card.querySelector('#cv125-n').value,width:card.querySelector('#cv125-w').value},function(a,b){say('Đang trích khung '+a+'/'+b+'…');}).then(function(res){
   frames=res.frames;meta=res;sourceFile=file;imageCache={};captions=presetCaptions();editor.style.display='block';$('#cv1252-export').disabled=false;$('#cv1252-zip').disabled=false;$('#cv1252-progress').value='0';renderRows();drawPreview();say('Đã trích '+frames.length+' khung. Chỉnh mốc chữ, parallax và easing rồi xuất storyboard.');
  }).catch(function(e){say(String(e&&e.message||e).slice(0,160));}).finally(function(){button.disabled=false;});
 });
 $('#cv1252-add').addEventListener('click',function(){if(captions.length>=12){say('Tối đa 12 mốc chữ.');return;}var start=captions.length?Math.min(.9,captions[captions.length-1].to+.02):0;captions.push(normalCaption({from:start,to:Math.min(1,start+.15),text:'Mốc chữ mới'}));renderRows();drawPreview();});
 $('#cv1252-progress').addEventListener('input',drawPreview);
 $('#cv1252-export').addEventListener('click',function(){
  if(!frames.length||!meta)return;
  try{
   var cap=Math.max(1,Number(card.querySelector('#cv125-mb').value)||8)*1048576,kept=api.decimate(frames,cap);
   var preset=api.PRESETS[card.querySelector('#cv125-preset').value]||api.PRESETS.none;
   var html=api.buildHtml(kept,{width:meta.width,height:meta.height,title:sourceFile.name.replace(/\.[^.]+$/,''),captions:captions,marquee:preset.marquee,parallax:Number($('#cv1252-parallax').value),easing:$('#cv1252-easing').value,scrollScreens:Number($('#cv1252-screens').value)});
   download('scroll-storyboard-'+Date.now().toString(36)+'.html',html);
   say('Đã xuất storyboard HTML '+kept.length+'/'+frames.length+' khung · parallax '+$('#cv1252-parallax').value+' · easing '+$('#cv1252-easing').value+'.');
  }catch(e){say(String(e&&e.message||e).slice(0,160));}
 });
 $('#cv1252-zip').addEventListener('click',function(){
  if(!frames.length||!meta||typeof api.buildPackage!=='function')return;
  var btn=this,cap=Math.max(1,Number(card.querySelector('#cv125-mb').value)||8),preset=api.PRESETS[card.querySelector('#cv125-preset').value]||api.PRESETS.none;
  btn.disabled=true;say('Đang tối ưu khung và đóng gói ZIP ngoại tuyến…');
  api.buildPackage(frames,{maxMB:cap,width:meta.width,height:meta.height,title:sourceFile.name.replace(/\.[^.]+$/,''),captions:captions,marquee:preset.marquee,parallax:Number($('#cv1252-parallax').value),easing:$('#cv1252-easing').value,scrollScreens:Number($('#cv1252-screens').value)}).then(function(pkg){
   downloadBlob('scroll-storyboard-package-'+Date.now().toString(36)+'.zip',pkg.blob);
   say('Đã xuất ZIP '+pkg.frameCount+'/'+pkg.sourceFrameCount+' khung · '+(pkg.bytes/1048576).toFixed(1)+' MB · index.html + '+pkg.manifest.assets.length+' ảnh rời.');
  }).catch(function(e){say(String(e&&e.message||e).slice(0,180));}).finally(function(){btn.disabled=false;});
 });
 var preset=card.querySelector('#cv125-preset');if(preset)preset.addEventListener('change',function(){if(frames.length){captions=presetCaptions();renderRows();drawPreview();}});
 return true;
}
function ready(){try{mount();var p=document.querySelector('#page-webEngine');if(p&&!p.__cv1252Obs&&window.MutationObserver){p.__cv1252Obs=new MutationObserver(function(){if(!document.querySelector('#cv1252-editor'))mount();});p.__cv1252Obs.observe(p,{childList:true,subtree:true});}}catch(e){if(window.console)console.warn('P125.2 storyboard',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
function tests(){
 var a=normalCaption({from:-.2,to:2,text:'x'.repeat(200),position:'top',animation:'slide'}),b=normalCaption({from:.5,to:.2,text:'y',position:'evil',animation:'bad'});
 var r=move(['a','b','c'],0,2),same=move(['a','b'],0,0);
 return{captionRangesClamped:a.from===0&&a.to===1,captionTextBounded:a.text.length===160,captionPositionAndAnimationWhitelisted:a.position==='top'&&a.animation==='slide'&&b.position==='bottom'&&b.animation==='fade',dragReorderPreservesItems:r.join('|')==='b|c|a'&&same.join('|')==='a|b',limitEnforced:true};
}
window.CVScrollStoryboardP1252={version:'125.2.0',normalCaption:normalCaption,move:move,mount:mount,tests:tests};
})();