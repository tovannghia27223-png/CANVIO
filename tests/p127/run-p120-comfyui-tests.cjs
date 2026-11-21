const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../..');
const js=fs.readFileSync(path.join(root,'canvio-p120-p126-comfyui.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const m=html.match(/<script id="canvio-lot120126">([\s\S]*?)<\/script>/);
let bad=0;function ck(name,value){if(value!==true){console.error('FAIL',name);bad++;}}
if(!m){console.error('FAIL embedded lot missing');process.exit(1);}
ck('embedded source parity',m[1].replace(/\r\n/g,'\n').trim()===js.replace(/\r\n/g,'\n').trim());
const registrations={};
const sb={window:{CVOrchestratorP128:{register:(k,t,fn)=>{registrations[k+'|'+t]=fn;}}},URL,Blob,FormData,AbortController,fetch,Promise,Map,Set,Date,Math,JSON,Object,Array,String,Number,RegExp,Error,TypeError,encodeURIComponent,decodeURIComponent,Uint8Array,Event:function(){},document:{readyState:'loading',addEventListener(){}}};
vm.createContext(sb);vm.runInContext(js,sb);
const A=sb.window.CVComfyP120P126;ck('module exports API',!!A);
for(const [k,v] of Object.entries(A.tests()))ck('unit '+k,v===true);
ck('orchestrator registrations exist',A.register()===true&&['image','video','upscale','interpolate'].every(k=>typeof registrations[k+'|comfyui-local']==='function'));
let threw=false;try{A.validateWorkflow({'1':{class_type:'x',inputs:{}}});}catch(e){threw=true;}ck('workflow accepts minimal API graph',!threw);
threw=false;try{A.validateWorkflow([]);}catch(e){threw=true;}ck('rejects array workflow',threw);
threw=false;try{A.normalizeBase('file:///tmp');}catch(e){threw=true;}ck('rejects non-http URL',threw);
console.log(bad?'P120/P126 FAIL':'P120/P126 PASS');process.exit(bad?1:0);