const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),match=html.match(/<script id="canvio-lot114">([\s\S]*?)<\/script>/);assert.ok(match,'P114 module exists');
class El{constructor(id=''){this.id=id;this.attrs={};this.handlers={};this.children=[];this.textContent=''}setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]||null}addEventListener(k,f){(this.handlers[k]??=[]).push(f)}appendChild(x){this.children.push(x);x.parentNode=this}click(){for(const f of this.handlers.click||[])f({target:this})}}
const htmlRoot=new El('html'),rail=new El('rail'),hub=new El('hub'),side=new El('side'),tabs=new El('ws-tabs'),controlHost=rail;let control=null,stored='';
const document={documentElement:htmlRoot,createElement:()=>{control=new El();return control},querySelector(sel){if(sel==='#cv-hub110 .cvh-rail')return controlHost;if(sel==='#page-settings .headActions'||sel==='#page-settings .head')return null;if(sel==='#cv-nav-toggle114')return control;if(sel==='#side')return side;if(sel==='#ws-tabs')return tabs;return null}};
const localStorage={getItem(k){assert.equal(k,'canvio15.nav-mode');return stored||null},setItem(k,v){assert.equal(k,'canvio15.nav-mode');stored=v}};
const CV={go(){}};const CVWS={open(){}};const window={CV,CVWS};
vm.runInNewContext(match[1],{window,document,localStorage,CV,CVWS});const api=window.CVNavShellP114;assert.ok(api,'P114 public API');
const checks=api.tests();for(const[n,v]of Object.entries(checks))assert.equal(v,true,n);
assert.equal(api.mode(),'shell','new shell is default');api.toggle();assert.equal(api.mode(),'v16');assert.equal(stored,'v16');assert.equal(control.getAttribute('aria-pressed'),'true');api.toggle();assert.equal(api.mode(),'shell');assert.equal(control.getAttribute('aria-label'),'Chuyển sang giao diện cổ điển v16');
assert.match(html,/@media\(max-width:560px\).*?safe-area-inset-bottom/s,'mobile rail honors safe area');
console.log('PASS P114: '+Object.keys(checks).length+' API checks, legacy fallback, persistence and mobile rail contract.');
