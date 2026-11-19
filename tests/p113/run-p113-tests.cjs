const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function module(id){const m=html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)<\\/script>'));assert.ok(m,id+' module exists');return m[1]}
class El{
 constructor(id=''){this.id=id;this.dataset={};this.attrs={};this.handlers={};this.children=[];this.classes=new Set(id==='page-designEngine'?['page','active']:['page']);this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x)}}
 setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]||null}removeAttribute(k){delete this.attrs[k]}
 addEventListener(k,f){(this.handlers[k]??=[]).push(f)}insertBefore(n){const i=this.children.indexOf(n);if(i>=0)this.children.splice(i,1);this.children.unshift(n);n.parentNode=this}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null}
 set innerHTML(v){this._html=v;this.children=[...v.matchAll(/data-cv111-page="([^"]+)"[^>]*aria-label="([^"]+)"/g)].map(m=>{const b=new El();b.setAttribute('data-cv111-page',m[1]);return b})}get innerHTML(){return this._html}
 querySelectorAll(sel){return sel==='[data-cv111-page]'?this.children:[]}
 querySelector(sel){return sel==='[aria-current=page]'?this.children.find(x=>x.getAttribute('aria-current')==='page')||null:null}
}
const design={id:'design',p:[['poster','Poster'],['designEngine','Design Engine']]},site={id:'site',p:[['cvstudio','CV Studio'],['web','Website Builder']]};
const media={id:'media',p:[['pixelStudio','Pixel Atelier','ẢNH'],['colorStudio','Luma Develop','ẢNH'],['clarityLab','Clarity Lab','ẢNH'],['imageStudio','AI ảnh','ẢNH'],['artcraft','ArtCraft','ẢNH'],['videoEngine','Dựng video','VIDEO'],['motionLab','Motion Lab','VIDEO'],['videoStudio','Kịch bản video','VIDEO'],['shotcraft','ShotCraft','VIDEO'],['motion','Motion presets','VIDEO'],['motionCut','MotionCut','LEGACY']]};
const pages=[new El('page-designEngine'),new El('page-videoEngine')],document={body:new El('body'),activeElement:null,createElement:()=>new El(),querySelector(sel){if(sel==='.page.active')return pages.find(p=>p.classList.contains('active'))||null;if(sel==='#cv-design-rail111')return pages.flatMap(p=>p.children).find(x=>x.id==='cv-design-rail111')||null;if(sel==='#page-cvstudio'||sel==='#cv87-docx'||sel==='#page-videoEngine')return new El(sel.slice(1));return null},querySelectorAll(sel){if(sel==='.page.cv111-has-rail')return pages.filter(p=>p.classList.contains('cv111-has-rail'));return[]}};
const routes=[...design.p,...site.p,...media.p],CVWS={spaces:[design,site,media],pageToSpace:Object.fromEntries(routes.map(x=>[x[0],x===undefined?'':(design.p.includes(x)?'design':site.p.includes(x)?'site':'media')]))};
const CV={go(id){pages.forEach(p=>p.classList.remove('active'));const p=pages.find(x=>x.id==='page-'+id)||pages[1];p.classList.add('active');return id}};
const window={CV,CVWS,addEventListener(){}};class MutationObserver{observe(){}}
const context={window,document,CV,CVWS,MutationObserver,setTimeout(fn){fn()}};
for(const id of ['canvio-lot111','canvio-lot112','canvio-lot113'])vm.runInNewContext(module(id),context);
const api=window.CANVIOStudioMediaP113;assert.ok(api,'P113 public API');const checks=api.tests();for(const[n,v]of Object.entries(checks))assert.equal(v,true,n);
CV.go('videoEngine');assert.equal(api.tests().videoEngineOwnerPreserved,true,'existing Video Engine page remains canonical');
const rail=document.querySelector('#cv-design-rail111');assert.equal(rail.querySelectorAll('[data-cv111-page]').length,media.p.length,'every media page is in rail');assert.ok(rail.innerHTML.includes('ẢNH')&&rail.innerHTML.includes('VIDEO')&&rail.innerHTML.includes('LEGACY'),'photo/video/legacy groups visible');
console.log('PASS P113: '+Object.keys(checks).length+' API checks, eleven photo/video routes, owner and group labels.');
