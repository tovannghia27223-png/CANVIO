const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const shellSource=html.match(/<script id="canvio-lot111">([\s\S]*?)<\/script>/)?.[1],siteSource=html.match(/<script id="canvio-lot112">([\s\S]*?)<\/script>/)?.[1];
assert.ok(shellSource&&siteSource,'P111/P112 modules exist');
class El{
 constructor(id=''){this.id=id;this.dataset={};this.attrs={};this.handlers={};this.children=[];this.classes=new Set(id==='page-designEngine'?['page','active']:['page']);this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x)}}
 setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]||null}removeAttribute(k){delete this.attrs[k]}
 addEventListener(k,f){(this.handlers[k]??=[]).push(f)}insertBefore(n){const i=this.children.indexOf(n);if(i>=0)this.children.splice(i,1);this.children.unshift(n);n.parentNode=this}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null}
 set innerHTML(v){this._html=v;this.children=[...v.matchAll(/data-cv111-page="([^"]+)"[^>]*aria-label="([^"]+)"/g)].map(m=>{const b=new El();b.setAttribute('data-cv111-page',m[1]);return b})}get innerHTML(){return this._html}
 querySelectorAll(sel){return sel==='[data-cv111-page]'?this.children:[]}
 querySelector(sel){return sel==='[aria-current=page]'?this.children.find(x=>x.getAttribute('aria-current')==='page')||null:null}
}
const designPage=new El('page-designEngine'),sitePage=new El('page-web');
const design={id:'design',p:[['poster','Poster'],['layoutFoundry','Layout Foundry'],['vectorForge','Vector Forge'],['designEngine','Design Engine']]};
const site={id:'site',p:[['autodesign','Auto Design'],['cvstudio','CV Studio'],['web','Website Builder'],['webEngine','Web Engine'],['portfolioStudio','Portfolio'],['hrvisual','HR Visual']]};
const pages=[designPage,sitePage],document={body:new El('body'),activeElement:null,createElement:()=>new El(),querySelector(sel){if(sel==='.page.active')return pages.find(p=>p.classList.contains('active'))||null;if(sel==='#cv-design-rail111')return pages.flatMap(p=>p.children).find(x=>x.id==='cv-design-rail111')||null;if(sel==='#page-cvstudio'||sel==='#cv87-docx')return new El(sel.slice(1));return null},querySelectorAll(sel){if(sel==='.page.cv111-has-rail')return pages.filter(p=>p.classList.contains('cv111-has-rail'));return[]}};
const CVWS={spaces:[design,site],pageToSpace:{designEngine:'design',poster:'design',layoutFoundry:'design',vectorForge:'design',autodesign:'site',cvstudio:'site',web:'site',webEngine:'site',portfolioStudio:'site',hrvisual:'site'}};
const CV={go(id){pages.forEach(p=>p.classList.remove('active'));const p=pages.find(x=>x.id==='page-'+id)||sitePage;p.classList.add('active');return id}};
const window={CV,CVWS,addEventListener(){}};class MutationObserver{observe(){}}
const context={window,document,CV,CVWS,MutationObserver,setTimeout(fn){fn()}};
vm.runInNewContext(shellSource,context);vm.runInNewContext(siteSource,context);
const api=window.CANVIOStudioSiteP112;assert.ok(api,'P112 public API');
const checks=api.tests();for(const[n,v]of Object.entries(checks))assert.equal(v,true,n);
CV.go('web');assert.equal(api.tests().currentSiteUsesRail,true,'Website pages receive the shared shell');
assert.equal(document.querySelector('#cv-design-rail111').querySelectorAll('[data-cv111-page]').length,site.p.length,'every existing Website page is in its rail');
console.log('PASS P112: '+Object.keys(checks).length+' API checks, six existing Website pages routed through the shared shell.');
