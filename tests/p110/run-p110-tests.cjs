const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const match=html.match(/<script id="canvio-lot110">([\s\S]*?)<\/script>/);assert.ok(match,'P110 module exists');
class Element{
 constructor(id=''){this.id=id;this.dataset={};this.attrs={};this.handlers={};this.children=[];this._html='';}
 setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]||null}
 addEventListener(k,f){(this.handlers[k]??=[]).push(f)}
 insertBefore(node){this.children.unshift(node)}
 set innerHTML(v){this._html=v}get innerHTML(){return this._html}
 querySelector(sel){if(sel==='[data-cvh-recent]')return recentBox;if(sel==='[data-cvh-favorites]')return favBox;if(sel==='[data-cvh-search]')return searchButton;return null}
 querySelectorAll(sel){if(sel==='.cvh-types [data-cvh-go]')return Array.from({length:7});if(sel==='[data-cvh-studio]')return Array.from({length:3});return[]}
}
const home=new Element('page-home'),recentBox={innerHTML:''},favBox={innerHTML:''},searchButton=new Element('search');
const document={createElement:()=>new Element(),querySelector(sel){if(sel==='#page-home')return home;if(sel==='#cvHero')return null;if(sel==='#cv-hub110')return home.children.find(x=>x.id==='cv-hub110')||null;return null},querySelectorAll(sel){return sel==='#cv-hub110'?(home.children.some(x=>x.id==='cv-hub110')?[home.children.find(x=>x.id==='cv-hub110')]:[]):[]}};
let opened='',searches=0;const CVWS={spaces:[{p:[['poster','Poster']]},{p:[['web','Website']]},{p:[['videoEngine','Video']]}],open(id){opened=id}};
const CV={go(id){opened=id},palette:{build(){return[]},open(){searches++}}};
const window={CV,CVWS,CANVIOStudioSwitcherP109:{go(id){opened=id}},CVDesignSystem:{state:{favorites:[]}},addEventListener(){}};
const localStorage={getItem(k){assert.equal(k,'canvio15.recent');return JSON.stringify(['poster','web'])}};
vm.runInNewContext(match[1],{window,document,CV,CVWS,localStorage,setTimeout(fn){fn()}});
const api=window.CANVIOHubP110;assert.ok(api,'P110 public API');
const checks=api.tests();for(const[n,v]of Object.entries(checks))assert.equal(v,true,n);
assert.deepEqual(Array.from(api.recent()),['poster','web'],'recent pages read existing CVWS owner');
api.go('site');assert.equal(opened,'site','studio route uses P109 switcher');
api.openSearch();assert.equal(searches,1,'large search uses existing command palette');
CV.go('poster');assert.equal(recentBox.innerHTML.includes('Poster'),true,'recent panel uses actual page title');
console.log('PASS P110: '+Object.keys(checks).length+' API checks, existing recent/favorites owners, studio routes and command search.');
