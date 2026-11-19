const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const match=html.match(/<script id="canvio-lot111">([\s\S]*?)<\/script>/);assert.ok(match,'P111 module exists');
class El{
 constructor(id=''){this.id=id;this.dataset={};this.attrs={};this.handlers={};this.children=[];this.classes=new Set(id==='page-designEngine'?['page','active']:['page']);this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x)}}
 setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]||null}removeAttribute(k){delete this.attrs[k]}
 addEventListener(k,f){(this.handlers[k]??=[]).push(f)}insertBefore(n){const old=this.children.indexOf(n);if(old>=0)this.children.splice(old,1);this.children.unshift(n);n.parentNode=this}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null}
 set innerHTML(v){this._html=v;this.children=[...v.matchAll(/data-cv111-page="([^"]+)"[^>]*aria-label="([^"]+)"/g)].map(m=>{const b=new El();b.dataset.cv111Page=m[1];b.setAttribute('data-cv111-page',m[1]);return b})}get innerHTML(){return this._html}
 querySelectorAll(sel){return sel==='[data-cv111-page]'?this.children:[]}
 querySelector(sel){return sel==='[aria-current=page]'?this.children.find(x=>x.getAttribute('aria-current')==='page')||null:null}
}
const designPage=new El('page-designEngine'),sitePage=new El('page-web');sitePage.classes.add('active');
const pages=[designPage,sitePage],document={body:new El('body'),activeElement:null,createElement:()=>new El(),querySelector(sel){if(sel==='.page.active')return pages.find(p=>p.classList.contains('active'))||null;if(sel==='#cv-design-rail111')return pages.flatMap(p=>p.children).find(x=>x.id==='cv-design-rail111')||null;return null},querySelectorAll(sel){if(sel==='.page.cv111-has-rail')return pages.filter(p=>p.classList.contains('cv111-has-rail'));return[]}};
const space={id:'design',p:[['poster','Poster'],['layoutFoundry','Layout Foundry'],['vectorForge','Vector Forge'],['designEngine','Design Engine']]};
const CVWS={spaces:[space,{id:'site',p:[['web','Website']]}],pageToSpace:{designEngine:'design',poster:'design',layoutFoundry:'design',vectorForge:'design',web:'site'}};
const CV={go(id){pages.forEach(p=>p.classList.remove('active'));const p=pages.find(x=>x.id==='page-'+id)||designPage;p.classList.add('active');return id}};
const window={CV,CVWS,addEventListener(){}};class MutationObserver{observe(){}}
vm.runInNewContext(match[1],{window,document,CV,CVWS,MutationObserver,setTimeout(fn){fn()}});
const api=window.CANVIOStudioShellP111;assert.ok(api,'P111 public API');
let checks=api.tests();for(const[n,v]of Object.entries(checks))assert.equal(v,true,n);
assert.equal(api.refresh(),true,'design page gets shared shell');assert.equal(api.tests().railMatchesWorkspace,true,'every design page appears in rail');
CV.go('web');api.refresh();assert.equal(designPage.classList.contains('cv111-has-rail'),false,'legacy page leaves design shell');
console.log('PASS P111: '+Object.keys(checks).length+' API checks, complete Design rail mapping and page-scope cleanup.');
