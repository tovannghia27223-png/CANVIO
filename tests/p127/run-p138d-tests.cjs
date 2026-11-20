const fs=require('fs'),vm=require('vm');
const js=fs.readFileSync(__dirname+'/../../canvio-p138-denoise.js','utf8');
const h=fs.readFileSync(__dirname+'/../../index.html','utf8');
const m=h.match(/<script id="canvio-lot138d">([\s\S]*?)<\/script>/);
let bad=0;
if(!m){console.log('FAIL embedded lot missing');process.exit(1)}
if(m[1].replace(/\r\n/g,'\n').trim()!==js.replace(/\r\n/g,'\n').trim()){console.log('FAIL embedded copy differs from standalone');bad++}
for(const [name,src] of [['standalone',js],['embedded',m[1]]]){
  const sb={localStorage:{},window:{},document:{readyState:'loading',addEventListener(){}},console,Float32Array,Float64Array,Math,Date,Set,JSON,Uint8Array,Uint8ClampedArray,Float32Array,Float64Array,DataView,ArrayBuffer,Uint8Array,Array,Map,Object,Number,String};sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);
  const t=sb.window.CVDenoiseP138.tests();
  for(const k in t){if(t[k]!==true){console.log('FAIL',name,k);bad++}}
}
console.log(bad?'P138 FAIL':'P138 OK');process.exit(bad?1:0);
