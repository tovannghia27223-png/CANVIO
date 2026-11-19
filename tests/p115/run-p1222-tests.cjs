'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../index.html'),'utf8');
const match=html.match(/<script id="canvio-lot1222">([\s\S]*?)<\/script>/);
assert.ok(match,'P122.2 script exists');
function makeEnv(saveFn=()=>{}){
 const sandbox={window:{},document:{readyState:'loading',addEventListener(){}},MutationObserver:function(){},WeakMap,Set,Array,Object,String,Math,RegExp,Promise};
 sandbox.window.window=sandbox.window;sandbox.window.CV={engines:{web:{save:saveFn}}};sandbox.CV=sandbox.window.CV;
 vm.createContext(sandbox);vm.runInContext(match[1],sandbox);
 const styles=[];const head={appendChild(n){n.parentNode=this;styles.push(n)},removeChild(n){styles.splice(styles.indexOf(n),1);n.parentNode=null}};
 const doc={head,createElement(){return {setAttribute(){},textContent:'',parentNode:null}}};
 const ed={css:'body{color:#172033}',Canvas:{getFrameEl(){return{contentDocument:doc}}},getCss(){return this.css},setStyle(v){this.css=v}};
 sandbox.window.CVWeb=ed;
 return{sandbox,api:sandbox.window.CVUnslopP1222,ed,styles};
}
const env=makeEnv(),checks=env.api.tests();
for(const [k,v] of Object.entries(checks))assert.equal(v,true,k);
const p=env.api.preview(env.ed,'typography');assert.equal(p.ok,true);assert.equal(p.projectChanged,false);assert.equal(env.styles.length,1);assert.equal(env.ed.css,'body{color:#172033}');
const a=env.api.apply(env.ed);assert.equal(a.ok,true);assert.equal(env.styles.length,0);assert.match(env.ed.css,/CANVIO Unslop · typography/);
const u=env.api.undo(env.ed);assert.equal(u.ok,true);assert.equal(env.ed.css,'body{color:#172033}');
const stale=makeEnv();stale.api.preview(stale.ed,'color');stale.ed.setStyle('body{color:red}');assert.equal(stale.api.apply(stale.ed).reason,'editor-changed-review-again');assert.equal(stale.ed.css,'body{color:red}');
const failed=makeEnv(()=>{throw new Error('simulated save failure')});failed.api.preview(failed.ed,'layout');assert.equal(failed.api.apply(failed.ed).reason,'apply-failed-rolled-back');assert.equal(failed.ed.css,'body{color:#172033}');
console.log(JSON.stringify({suite:'P122.2 local one-step preview/apply/undo',passed:14,total:14,checks,previewApplyUndo:true,stalePlanRejected:true,failedSaveRollback:true},null,2));

