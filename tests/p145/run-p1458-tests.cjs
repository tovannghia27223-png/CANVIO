const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../../canvio-p145-visual-assets.js'),'utf8');
const sb={window:{},document:{readyState:'loading',addEventListener(){}},Math,Number,String,Object,Array,Set,JSON,RegExp,Date,Promise,Error,console};sb.window.window=sb.window;
vm.createContext(sb);vm.runInContext(src,sb,{filename:'p1458.js'});
const c=sb.window.CVOriginalVectorAssetsP1458.tests();let failed=0;
for(const [name,ok] of Object.entries(c)){console.log((ok?'PASS ':'FAIL ')+name);if(!ok)failed++;}
console.log('P145.8 '+(failed?'FAIL '+failed:'PASS '+Object.keys(c).length+'/'+Object.keys(c).length));process.exit(failed?1:0);