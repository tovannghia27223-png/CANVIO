const fs=require('fs'),vm=require('vm'),zlib=require('zlib');
const html=fs.readFileSync(require('path').join(__dirname, '..', '..', 'index.html'),'utf8');
const m=html.match(/<script id="canvio-phase-completion-suite">([\s\S]*?)<\/script>/);if(!m)throw Error('suite missing');
const store=new Map(); const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),key:i=>Array.from(store.keys())[i]||null,get length(){return store.size}};
const listeners={};const document={readyState:'loading',querySelector(){return null},addEventListener(n,f){listeners[n]=f}};
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t})();
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
const cvZip={crc32,build:async()=>new Blob([])};
const cv11={backupIntegrity:{verify:async()=>({status:'verified',ok:true}),seal:async x=>x}};
const win={CVZip:cvZip,CV11:cv11,CV:{engines:{video:{motionEase(){return 0.93}}},toast:function(){}},CVUnifiedLayers:{editorIds:()=>['webEngine','portfolioStudio']}};
const sandbox={window:win,document,location:{href:'https://example.test/',reload(){}},URL,Blob,TextEncoder,TextDecoder,AbortController,setTimeout:(fn)=>0,clearTimeout,console,sessionStorage:{getItem(){return null}},localStorage,confirm:()=>true,fetch:async()=>{throw Error('network should not be called')}};
sandbox.CV11=cv11;sandbox.CVZip=cvZip;sandbox.CV=sandbox.window.CV;sandbox.CVUnifiedLayers=sandbox.window.CVUnifiedLayers;
vm.createContext(sandbox);vm.runInContext(m[1],sandbox);
(async()=>{
 const allSuiteTests=sandbox.window.CANVIOPhaseSuite.tests();
 const newerRuntimeOnly=new Set(['videoTrackControls','videoWebVTT','videoTrackStateInSnapshot','videoNativeMP4H264','videoCaptionPreflight','videoWhisperASR','videoWhisperCancellation','videoExportCancellation']);
 const p47SuiteTests=Object.fromEntries(Object.entries(allSuiteTests).filter(([name])=>!newerRuntimeOnly.has(name)));
 const direct=await sandbox.window.CANVIOProjectBundle.restorePayload({format:'CANVIO_FULL_BACKUP',schema:2,localStorage:{'canvio:qa':'direct-ok','canvio:gemini_key':'secret'},indexedDB:[]});
 const zipData=fs.readFileSync(require('path').join(__dirname, 'fixtures', 'restore-fixture.zip'));
 const result=await sandbox.window.CANVIOProjectBundle.restoreZip(new Blob([zipData]));
 console.log(JSON.stringify({suite:{version:sandbox.window.CANVIOPhaseSuite.version,tests:p47SuiteTests,p48RuntimeChecksDelegated:true},directRestore:direct,zipRestore:result,storedKeys:Array.from(store.keys()).sort(),directValue:localStorage.getItem('canvio:qa'),zipValue:localStorage.getItem('canvio:qa')},null,2));
 if(!sandbox.window.CANVIOPhaseSuite.tests().websiteRuntimeHasRealScriptClose)process.exitCode=1;
 if(!result||result.cancelled||result.restoredKeys!==1||localStorage.getItem('canvio:qa')!=='bundle-ok'||localStorage.getItem('canvio:gemini_key')!==null)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
