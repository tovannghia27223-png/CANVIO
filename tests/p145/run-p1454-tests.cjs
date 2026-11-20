const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../../canvio-p145-music.js'),'utf8');
const sb={window:{},document:{readyState:'loading',addEventListener(){}},Math,Number,String,Object,Array,Float32Array,Uint8Array,ArrayBuffer,DataView,Promise,Error,RegExp,JSON,console};
sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb,{filename:'p1454.js'});
const checks=sb.window.CVMusicComposerP1454.tests();let fail=0;
for(const [k,v] of Object.entries(checks)){console.log((v?'PASS ':'FAIL ')+k);if(!v)fail++;}
console.log('P145.4 '+(fail?'FAIL '+fail:'PASS '+Object.keys(checks).length+'/'+Object.keys(checks).length));process.exit(fail?1:0);