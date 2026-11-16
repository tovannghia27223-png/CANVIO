const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(require('path').join(__dirname, '..', '..', 'index.html'),'utf8');
const m=html.match(/<script id="canvio-phase-completion-suite">([\s\S]*?)<\/script>/);if(!m)throw Error('suite missing');
const store=new Map();const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),key:i=>Array.from(store.keys())[i]||null,get length(){return store.size}};
const document={readyState:'loading',querySelector(){return null},addEventListener(){}};
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t})();
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
const CV11={backupIntegrity:{verify:async()=>({status:'verified'}),seal:async x=>x}};
const window={CVZip:{crc32,build:async()=>new Blob([])},CV11,CV:{engines:{video:{motionEase(){return 0.93}}},toast(){ }},CVUnifiedLayers:{editorIds:()=>['webEngine','portfolioStudio']}};
const sandbox={window,document,location:{href:'https://example.test/',reload(){}},URL,Blob,TextEncoder,TextDecoder,AbortController,setTimeout:()=>0,clearTimeout,console,localStorage,sessionStorage:{getItem(){return null}},confirm:()=>true,fetch:async()=>{throw Error('network unused')}};
sandbox.CV11=CV11;sandbox.CVZip=window.CVZip;sandbox.CV=window.CV;sandbox.CVUnifiedLayers=window.CVUnifiedLayers;
vm.createContext(sandbox);vm.runInContext(m[1],sandbox);
(async()=>{
 let error='';try{await window.CANVIOProjectBundle.restoreZip(new Blob([fs.readFileSync(require('path').join(__dirname, 'fixtures', 'restore-fixture-corrupt.zip'))]))}catch(e){error=String(e.message||e)}
 const pass=/CRC32/.test(error)&&store.size===0;
 console.log(JSON.stringify({crcMismatchRejected:/CRC32/.test(error),noMutationBeforeValidation:store.size===0,error,pass},null,2));
 if(!pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
