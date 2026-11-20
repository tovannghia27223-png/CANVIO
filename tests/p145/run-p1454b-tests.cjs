const vm=require('node:vm');
const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../../canvio-p145-music-preview.js'),'utf8');
const sb={window:{},document:{readyState:'loading',addEventListener(){}},localStorage:{getItem(){return'[]';}},URL,URLSearchParams,Math,Number,String,Object,Array,RegExp,Error,JSON,console};
sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(source,sb,{filename:'p1454b.js'});
const checks=sb.window.CVMusicPreviewP1454B.tests();let fail=0;
for(const [k,v] of Object.entries(checks)){console.log((v?'PASS ':'FAIL ')+k);if(!v)fail++;}
console.log('P145.4b '+(fail?'FAIL '+fail:'PASS '+Object.keys(checks).length+'/'+Object.keys(checks).length));
process.exit(fail?1:0);