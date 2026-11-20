const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../../canvio-p145-templates.js'),'utf8');
const sb={window:{},document:{readyState:'loading',addEventListener(){}},Math,Number,String,Object,Array,JSON,RegExp,Date,Promise,Error,console};sb.window.window=sb.window;
vm.createContext(sb);vm.runInContext(src,sb,{filename:'p1455.js'});
const checks=sb.window.CVTemplateFactoryP1455.tests();let bad=0;
for(const [name,pass] of Object.entries(checks)){console.log((pass?'PASS ':'FAIL ')+name);if(!pass)bad++;}
console.log('P145.5 '+(bad?'FAIL '+bad:'PASS '+Object.keys(checks).length+'/'+Object.keys(checks).length));process.exit(bad?1:0);