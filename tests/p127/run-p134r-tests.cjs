'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','..','canvio-p134-reframe.js'),'utf8');
const sandbox={window:{addEventListener(){}},document:{readyState:'loading',addEventListener(){}},console,Promise,Math,Number,Array,Float32Array,Uint8Array,Uint8ClampedArray,Float64Array,setTimeout,clearTimeout};
vm.runInNewContext(source,sandbox,{filename:'canvio-p134-reframe.js'});
const api=sandbox.window.CVAutoReframeP134;
if(!api)throw new Error('P134.2 API did not register');
let passed=0;
function check(name,fn){let ok=false;try{ok=!!fn();}catch(error){console.error(name,error);}if(!ok)throw new Error('FAIL: '+name);passed++;console.log('PASS: '+name);}
function makeFrame(x,time){const w=192,h=108,data=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)data[i*4+3]=255;for(let y=40;y<68;y++)for(let xx=x;xx<x+26;xx++){const p=(y*w+xx)*4;data[p]=255;data[p+1]=255;data[p+2]=255;}return{width:w,height:h,time,data};}
const frames=[makeFrame(12,0),makeFrame(58,1),makeFrame(104,2),makeFrame(154,3)];
const plan=api.analyzeFrames(frames,9/16);
check('API and contracts exposed',()=>api.version==='134.2.0'&&api.tests().noNetwork&&api.tests().noTimelineMutation);
check('portrait crop geometry is 9:16',()=>{const c=api.cropSize(1920,1080,9/16);return Math.abs(c.width/c.height-9/16)<1e-9&&c.height===1080;});
check('square crop geometry is 1:1',()=>{const c=api.cropSize(1920,1080,1);return Math.abs(c.width-c.height)<1e-9;});
check('invalid aspect ratio rejected',()=>{try{api.cropSize(1920,1080,4/3);return false;}catch(_){return true;}});
check('moving high-contrast subject is followed',()=>plan.points.length===4&&plan.points[3].x>plan.points[0].x+.35);
check('focus interpolation is finite and monotonic',()=>{const a=api.focusAt(plan,.5),b=api.focusAt(plan,2.5);return Number.isFinite(a.x)&&Number.isFinite(b.x)&&b.x>a.x;});
check('crop stays inside source bounds',()=>{const c=api.cropAt(plan,2.5,1920,1080);return c.x>=0&&c.y>=0&&c.x+c.width<=1920.001&&c.y+c.height<=1080.001;});
check('flat frames fall back to a stable center',()=>{const data=new Uint8ClampedArray(192*108*4);for(let i=3;i<data.length;i+=4)data[i]=255;const flat=api.analyzeFrames([{width:192,height:108,time:0,data},{width:192,height:108,time:1,data}],1);return flat.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))&&Math.abs(flat.points[0].x-.5)<.08;});
check('frame count bounds enforced',()=>{try{api.analyzeFrames([frames[0]],1);return false;}catch(_){return true;}});
check('mixed frame dimensions rejected',()=>{try{api.analyzeFrames([frames[0],{...frames[1],width:180}],1);return false;}catch(_){return true;}});
check('source module keeps existing owners untouched',()=>!/CV\.engines\.video|localStorage|indexedDB|fetch\s*\(/.test(source));
console.log(JSON.stringify({passed,failed:0,apiVersion:api.version,focusStart:plan.points[0].x,focusEnd:plan.points[3].x},null,2));