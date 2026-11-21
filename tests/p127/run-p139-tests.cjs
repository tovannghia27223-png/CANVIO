const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../../canvio-p139-motionlab.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const m=html.match(/<script id="canvio-lot139">([\s\S]*?)<\/script>/);let fail=0;
function ck(n,v){if(v!==true){console.log('FAIL',n);fail++;}}
ck('P139 lot embedded',!!m);if(m)ck('standalone/inline parity',m[1].replace(/\r\n/g,'\n').trim()===src.replace(/\r\n/g,'\n').trim());
const window={Intl};
const sandbox={window,Math,Number,String,Object,Array,Map,Set,JSON,Date,Error};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=window.CVMotionLabP139;ck('API version',api&&api.version==='139.1.1');
const result=api&&api.tests();ck('eight model assertions pass',!!result&&Object.keys(result).length===8&&Object.values(result).every(Boolean));
const a=api.normalizeAnimator({enabled:true,mode:'tracking',stagger:.2,duration:1.5,strength:40,curve:[.1,.2,.3,.4]});
ck('animator keeps valid settings',a.enabled&&a.mode==='tracking'&&a.stagger===.2&&a.duration===1.5&&a.strength===40);
console.log(fail?'P139 Motion Lab FAIL':'P139 Motion Lab PASS');process.exit(fail?1:0);
