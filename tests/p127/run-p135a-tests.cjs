const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../../canvio-p135-adjustments.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const match=html.match(/<script id="canvio-lot135a">([\s\S]*?)<\/script>/);let failed=0;
function ck(name,ok){if(ok!==true){console.log('FAIL',name);failed++;}}
ck('embedded lot exists',!!match);
if(match)ck('embedded and standalone parity',match[1].replace(/\r\n/g,'\n').trim()===src.replace(/\r\n/g,'\n').trim());
const document={readyState:'loading',addEventListener(){}};
const window={document,URL:{},setTimeout(){},requestAnimationFrame(fn){return fn();}};
const sandbox={window,document,console,Math,Number,String,Object,Array,JSON,Set,Promise,Error,File:function(){}};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=window.CVPixelAdjustmentsP135;ck('API version',api&&api.version==='135.1.0');
const result=api&&api.tests();ck('pure adjustment tests all pass',!!result&&Object.values(result).every(Boolean));
ck('eight model assertions',!!result&&Object.keys(result).length===8);
ck('brightness and contrast order retained',api.filterFor([{id:'b',type:'brightness',value:110},{id:'c',type:'contrast',value:90}])==='brightness(110%) contrast(90%)');
ck('empty stack has no CSS filter',api.filterFor([])==='none');
console.log(failed?'P135 adjustment stack FAIL':'P135 adjustment stack PASS');process.exit(failed?1:0);
