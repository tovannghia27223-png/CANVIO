const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../..');
const js=fs.readFileSync(path.join(root,'canvio-p145-shader.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const m=html.match(/<script id="canvio-lot1452">([\s\S]*?)<\/script>/);
let failed=0;
if(!m){console.log('FAIL embedded P145.2 lot missing');process.exit(1);}
if(m[1].replace(/\r\n/g,'\n').trim()!==js.replace(/\r\n/g,'\n').trim()){console.log('FAIL embedded P145.2 differs from standalone source');failed++;}
for(const [name,source] of [['standalone',js],['embedded',m[1]]]){
  const sb={window:{},document:{readyState:'loading',addEventListener(){}},console,Math,Date,Number,String,Object,Array,JSON,Float32Array,Uint8Array,ArrayBuffer,DataView,Promise,Set,Map,Error,RegExp};
  sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(source,sb,{filename:name+'.js'});
  const suite=sb.window.CVShaderP145.tests();
  for(const k of Object.keys(suite)){if(suite[k]!==true){console.log('FAIL',name,k,suite[k]);failed++;}}
}
console.log(failed?'P145.2 FAIL ('+failed+')':'P145.2 OK');
process.exit(failed?1:0);
