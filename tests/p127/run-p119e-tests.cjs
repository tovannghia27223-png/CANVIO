const fs=require('fs'),vm=require('vm');
const js=fs.readFileSync(__dirname+'/../../canvio-p119-easing.js','utf8');
const h=fs.readFileSync(__dirname+'/../../index.html','utf8');
const m=h.match(/<script id="canvio-lot119e">([\s\S]*?)<\/script>/);
(async()=>{let bad=0;
if(!m){console.log('FAIL embedded lot missing');process.exit(1)}
if(m[1].replace(/\r\n/g,'\n').trim()!==js.replace(/\r\n/g,'\n').trim()){console.log('FAIL embedded copy differs');bad++}
for(const [name,src] of [['standalone',js],['embedded',m[1]]]){
  const sb={window:{},document:{readyState:'loading',addEventListener(){}},navigator:{},localStorage:{length:0},console,Date,Math,Set,Map,JSON,Blob,Array,Object,Promise,String,Number,setTimeout,addEventListener(){}};sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);
  const t=await sb.window.CVEasingP119.tests();
  for(const k in t){if(t[k]!==true){console.log('FAIL',name,k);bad++}}
}
console.log(bad?'P119 FAIL':'P119 OK');process.exit(bad?1:0)})();
