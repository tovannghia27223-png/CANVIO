const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(require('path').join(__dirname, '..', '..', 'index.html'),'utf8');
const m=html.match(/<script id="canvio-phase-completion-suite">([\s\S]*?)<\/script>/);
if(!m) throw new Error('phase suite script missing');
const listeners={};
const document={readyState:'loading',querySelector(){return null},addEventListener(n,fn){listeners[n]=fn}};
const sessionStorage={getItem(){return null},setItem(){},removeItem(){}};
const localStorage={getItem(){return null},setItem(){},removeItem(){},length:0};
const cv={engines:{video:{motionEase(){return 0.93}}},toast(){}};
const cvZip={crc32(){return 0},build:async()=>new Blob([])};
const cv11={backupIntegrity:{seal:async x=>x,verify:async()=>({status:'verified'})}};
const cvUnifiedLayers={editorIds(){return ['webEngine','portfolioStudio']}};
const sandbox={window:{},document,location:{href:'https://example.test/'},URL,Blob,TextEncoder,TextDecoder,AbortController,setTimeout,clearTimeout,console,sessionStorage,localStorage,fetch:async()=>{throw new Error('not called')}};
sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.CV=cv;sandbox.window.CVZip=cvZip;sandbox.window.CV11=cv11;sandbox.window.CVUnifiedLayers=cvUnifiedLayers;
sandbox.CV=cv;sandbox.CVZip=cvZip;sandbox.CV11=cv11;sandbox.CVUnifiedLayers=cvUnifiedLayers;
vm.createContext(sandbox);vm.runInContext(m[1],sandbox);
const allSuiteTests=sandbox.window.CANVIOPhaseSuite.tests();
// P47's regression fixture runs against newer candidates too. P48 runtime-only
// checks need a mounted app/browser and are exercised by tests/p48/run-p48-tests.cjs.
const newerRuntimeOnly=new Set(['videoTrackControls','videoWebVTT','videoTrackStateInSnapshot','videoNativeMP4H264','videoCaptionPreflight','videoWhisperASR','videoWhisperCancellation','videoExportCancellation','p55RuntimeDiagnostics','p55RenderRecovery','p55ProjectIntegrity','p55PerformanceBudget','p55ReleaseGate']);
const tests=Object.fromEntries(Object.entries(allSuiteTests).filter(([name])=>!newerRuntimeOnly.has(name)));
const injected=sandbox.window.CVWebsiteMotionBuilder.inject('<html><head></head><body><main data-canvio-motion="slide-up" style="--canvio-motion-easing:cubic-bezier(.2,.7,.2,1)">Hi</main></body></html>');
const css=injected.match(/<style id="canvio-motion-runtime">([\s\S]*?)<\/style>/)?.[1]||'';
const output={suiteVersion:sandbox.window.CANVIOPhaseSuite.version,tests,p48AndLaterRuntimeChecksDelegated:true,scriptClose:/<script id="canvio-motion-runtime-js">[\s\S]*?<\/script>/.test(injected),motionUsesEasingVariable:css.includes('--canvio-motion-easing'),reducedMotion:css.includes('prefers-reduced-motion:reduce'),outputIdempotent:sandbox.window.CVWebsiteMotionBuilder.inject(injected)===injected};
console.log(JSON.stringify(output,null,2));
const failed=Object.entries(tests).filter(([k,v])=>v!==true);
if(failed.length||!output.scriptClose||!output.motionUsesEasingVariable||!output.reducedMotion||!output.outputIdempotent)process.exitCode=1;
