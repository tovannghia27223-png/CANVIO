'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'canvio-p119-video.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const match=html.match(/<script id="canvio-lot119v">([\s\S]*?)<\/script>/);
if(!match)throw new Error('P119.3 embedded lot missing');
assert.equal(match[1].replace(/\r\n/g,'\n').trim(),source.replace(/\r\n/g,'\n').trim(),'P119.3 standalone/embedded parity');
const preset={'Mượt':[.2,.8,.3,1],'Giảm tốc':[0,0,.58,1],'Tăng tốc':[.42,0,1,1],'Đều hai đầu':[.42,0,.58,1],'Nảy nhẹ':[.34,1.56,.64,1],'Tuyến tính':[0,0,1,1]};
const nodes={motionEase:{value:'cubic-bezier(.1,.2,.3,.4)'},vtKFEasing:{value:'linear'},vtKFCurveX1:{value:'0'},vtKFCurveY1:{value:'0'},vtKFCurveX2:{value:'1'},vtKFCurveY2:{value:'1'},'cv119v-status':{textContent:'',dataset:{}}};
for(const n of Object.values(nodes)){n.dispatchEvent=()=>{};n.addEventListener=()=>{};}
const document={readyState:'loading',addEventListener(){},getElementById:id=>nodes[id]||null};
const easing={
 PRESETS:preset,
 norm:c=>c.map((v,i)=>Math.round(Math.max(i===0||i===2?0:-1,Math.min(i===0||i===2?1:2,Number(v)))*1000)/1000),
 parse:s=>{const m=/^cubic-bezier\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)$/.exec(String(s||''));return m?m.slice(1).map(Number):null;}
};
const window={document,CVEasingP119:easing,Event:function(type,opts){this.type=type;this.bubbles=opts&&opts.bubbles;}};
const sandbox={window,document,console,Math,Number,String,Object,Array,Set,Map,Promise,Error};
vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'canvio-p119-video.js'});
const api=window.CVVideoEasingP119;
assert(api,'P119.3 API is exported');
const pure=api.tests();
for(const [name,value] of Object.entries(pure))assert.equal(value,true,'P119.3 '+name);
assert.equal(Object.keys(pure).length,7,'seven pure P119.3 model contracts');
assert.deepEqual(Array.from(api.curveFromMotion()),[.1,.2,.3,.4]);
assert.equal(api.findPreset([.34,1.56,.64,1]),'Nảy nhẹ');
assert.equal(api.findPreset([.25,.75,.25,1]),null);
assert.equal(api.setNativeCurve(preset.Mượt),true);
assert.equal(nodes.vtKFEasing.value,'custom');
assert.deepEqual(['vtKFCurveX1','vtKFCurveY1','vtKFCurveX2','vtKFCurveY2'].map(k=>Number(nodes[k].value)),preset.Mượt);
assert.equal(api.setNativeCurve(preset.Tuyến tính),true);
assert.equal(nodes.vtKFEasing.value,'linear');
nodes.motionEase.value='linear(0,0.5,1)';
assert.equal(api.curveFromMotion(),null,'spring linear() cannot be silently misread as cubic-bezier');
const mixed=api.motionCurveState({motion:{keyframes:[{t:0,bezier:[.2,.8,.3,1]},{t:50,bezier:[.42,0,1,1]},{t:100}]}});
assert.equal(mixed.mixed,true,'different keyframe-segment curves are preserved as mixed');
assert(!/localStorage|indexedDB|CANVIO_PROJECT_VAULT|new[ \t]+(?:class[ \t]+)?Timeline/i.test(source),'module adds no storage or timeline owner');
console.log(JSON.stringify({suite:'P119.3 shared easing with canonical Video Engine',passed:20,total:20,failed:[]},null,2));
