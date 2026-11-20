const fs=require('fs'),vm=require('vm');
const js=fs.readFileSync(__dirname+'/../../canvio-p125-scrollframes.js','utf8');
const h=fs.readFileSync(__dirname+'/../../index.html','utf8');
const m=h.match(/<script id="canvio-lot125f">([\s\S]*?)<\/script>/);
let bad=0;
if(!m){console.log('FAIL embedded lot missing');process.exit(1)}
if(m[1].replace(/\r\n/g,'\n').trim()!==js.replace(/\r\n/g,'\n').trim()){console.log('FAIL embedded copy differs from standalone');bad++}
for(const [name,src] of [['standalone',js],['embedded',m[1]]]){
  const sb={window:{},document:{readyState:'loading',addEventListener(){}},console,Float32Array,Float64Array,Math,Date,Set,JSON,Blob};sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);
  const t=sb.window.CVScrollFramesP125.tests();
  for(const k in t){if(t[k]!==true){console.log('FAIL',name,k);bad++}}
}
console.log(bad?'P125.1 FAIL':'P125.1 OK');process.exit(bad?1:0);
