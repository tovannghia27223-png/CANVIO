const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../../canvio-p127-director.js'),'utf8');
const sb={window:{},document:{readyState:'loading',addEventListener(){}},Math,Number,String,Object,Array,Error,RegExp,JSON,console};sb.window.window=sb.window;
vm.createContext(sb);vm.runInContext(src,sb,{filename:'p1272.js'});
const t=sb.window.CVCaptionDirectorP1272.tests();let bad=0;
for(const [k,v] of Object.entries(t)){console.log((v?'PASS ':'FAIL ')+k);if(!v)bad++;}
console.log('P127.2 '+(bad?'FAIL '+bad:'PASS '+Object.keys(t).length+'/'+Object.keys(t).length));process.exit(bad?1:0);