/* P240 · Constraint-based multi-format resize for editable P239 poster documents. */
(function(w){
'use strict';if(w.CVMagicResizeP240)return;
var PRESETS=[['Facebook cover',1640,624],['Instagram post',1080,1080],['Instagram story',1080,1920],['A4 portrait',2480,3508],['Web banner',1920,600],['LinkedIn post',1200,627]];
function clone(x){return JSON.parse(JSON.stringify(x));}
function resize(doc,width,height){
 if(!doc||!Array.isArray(doc.elements)||!Number.isFinite(+doc.width)||!Number.isFinite(+doc.height)||width<100||height<100||width>8000||height>8000)return{ok:false,error:'Tài liệu hoặc kích thước không hợp lệ.'};
 var sx=width/doc.width,sy=height/doc.height,s=Math.min(sx,sy),out=clone(doc),pad=Math.round(Math.min(width,height)*.06);
 out.width=width;out.height=height;out.format=width+'x'+height;
 out.elements=out.elements.map(function(e){
  var x=Number(e.x)||0,y=Number(e.y)||0,w0=Number(e.w)||1,h0=Number(e.h)||1;
  var nw=Math.max(1,Math.round(w0*s)),nh=Math.max(1,Math.round(h0*s)),nx=Math.round(x*s+(width-doc.width*s)/2),ny=Math.round(y*s+(height-doc.height*s)/2);
  nx=Math.max(pad,Math.min(width-pad-nw,nx));ny=Math.max(pad,Math.min(height-pad-nh,ny));
  var z=Object.assign({},e,{x:nx,y:ny,w:Math.min(nw,width-2*pad),h:Math.min(nh,height-2*pad)});
  if(Number.isFinite(+e.fontSize))z.fontSize=Math.max(10,Math.round(+e.fontSize*s));return z;
 });
 var collisions=[];for(var i=0;i<out.elements.length;i++)for(var j=i+1;j<out.elements.length;j++){var a=out.elements[i],b=out.elements[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)collisions.push([a.id,b.id]);}
 return{ok:true,document:out,collisions:collisions,overflow:out.elements.some(function(e){return e.x<0||e.y<0||e.x+e.w>width||e.y+e.h>height;})};
}
function buildSet(doc){return PRESETS.map(function(p){var r=resize(doc,p[1],p[2]);return{name:p[0],width:p[1],height:p[2],result:r};});}
function svg(doc){var esc=function(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};var els=doc.elements.map(function(e){var fs=Math.min(220,Math.max(10,+e.fontSize||24));return'<text x="'+e.x+'" y="'+(e.y+fs)+'" font-size="'+fs+'" font-weight="'+(+e.weight||400)+'" fill="'+esc(e.color||'#20172B')+'" font-family="'+esc(doc.theme&&doc.theme.fontFamily||'sans-serif')+'">'+esc(e.text)+'</text>';}).join('');return'<svg xmlns="http://www.w3.org/2000/svg" width="'+doc.width+'" height="'+doc.height+'" viewBox="0 0 '+doc.width+' '+doc.height+'"><rect width="100%" height="100%" fill="'+esc(doc.theme&&doc.theme.background||'#ffffff')+'"/>'+els+'</svg>';}
async function exportZip(doc){var rows=buildSet(doc);if(rows.some(function(x){return !x.result.ok||x.result.overflow;}))throw new Error('Có khổ không hợp lệ hoặc tràn vùng an toàn.');if(!w.CVZip||!CVZip.build)throw new Error('CVZip hiện có chưa sẵn sàng.');var files=rows.map(function(x){return{name:x.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.svg',data:svg(x.result.document)};});files.push({name:'manifest.json',data:JSON.stringify({format:'CANVIO_RESIZE_SET',version:1,items:rows.map(function(x){return{name:x.name,width:x.width,height:x.height,collisions:x.result.collisions.length};})},null,2)});return CVZip.build(files);}
var api={version:'240.1.0',presets:PRESETS,resize:resize,buildSet:buildSet,svg:svg,exportZip:exportZip,tests:function(){var d={width:1000,height:1000,elements:[{id:'a',x:100,y:100,w:200,h:80,fontSize:30,text:'A'}]},r=buildSet(d);return{sixSizes:r.length===6,noOverflow:r.every(function(x){return x.result.ok&&!x.result.overflow;}),keepsEditableElements:r.every(function(x){return x.result.document.elements[0].id==='a';}),collisionList:r.every(function(x){return Array.isArray(x.result.collisions);})};}};
w.CVMagicResizeP240=api;
})(window);