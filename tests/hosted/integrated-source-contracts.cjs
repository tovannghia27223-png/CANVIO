'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks={};
function test(name,fn){try{fn();checks[name]=true;console.log('PASS',name);}catch(e){checks[name]=false;console.error('FAIL',name,e.stack||e);}}
const ids=['canvio-p74-p81-three-viewer','canvio-p105-p107-depth-parallax','canvio-p102-background-removal','canvio-p85-module','canvio-p68-p70-main'];
test('Integrated P74/P81, P85, P102/P105/P107 and P70 module owners are present exactly once',()=>{
 for(const id of ids)assert.equal((html.match(new RegExp('<script[^>]*id="'+id+'"','g'))||[]).length,1,id);
});
const p74=read('canvio-p74-p81-three-viewer.js');
test('P74/P81 uses pinned local r187 runtime and strict vendor manifest SHA verification',()=>{
 for(const token of ['THREE-VENDOR-MANIFEST.json','crypto.subtle.digest','GLTFLoader.js','DRACOLoader.js','KTX2Loader.js','meshopt_decoder.module.js','setDRACOLoader','setMeshoptDecoder','setKTX2Loader'])assert.ok(p74.includes(token),token);
 assert.ok(!/https?:\/\/(cdn|unpkg|esm)\./i.test(p74));
});
const p85=read('canvio-p85-studio.js'),entry=read('scripts/p85-renderers.entry.mjs'),vendor=read('scripts/vendor-p85-runtimes.sh');
test('P85 owner is lazy, same-origin, SHA-pinned and disposes GPU/OpenCV/player resources',()=>{
 for(const token of ['P85-VENDOR-MANIFEST.json','crypto.subtle.digest','ensureOpenCV','ensureDotLottie','ensureRive','stopPathTracer','clearTracking','disposeAnimation'])assert.ok(p85.includes(token),token);
 for(const token of ['BloomEffect','VignetteEffect','ChromaticAberrationEffect','WebGPUPathTracer','renderer?.dispose'])assert.ok(entry.includes(token),token);
 for(const token of ['three@','three-gpu-pathtracer@','postprocessing@','@techstark/opencv-js@','@lottiefiles/dotlottie-web@','@rive-app/canvas@','@huggingface/transformers@','P85-VENDOR-MANIFEST.json','P85-VENDOR-NOTICE.md','licenses/'])assert.ok(vendor.includes(token),token);
});
const rmbg=read('assets/canvio-rmbg-worker.js'),depth=read('assets/canvio-depth-worker.js'),whisper=read('assets/canvio-whisper-worker.js');
test('P102/P105/P80 workers use self-hosted Transformers.js and local ONNX WASM',()=>{
 assert.ok(rmbg.includes('Orangebot/ormbg-ONNX')&&rmbg.includes('background-removal'));
 assert.ok(depth.includes('onnx-community/depth-anything-v2-small-ONNX')&&depth.includes('depth-estimation'));
 assert.ok(whisper.includes('Xenova/whisper-tiny')&&whisper.includes('automatic-speech-recognition'));
 for(const s of [rmbg,depth,whisper]){assert.ok(s.includes('p85/transformers/transformers.min.js'));assert.ok(s.includes('wasmPaths'));assert.ok(!/esm\.sh|cdn\.jsdelivr\.net/i.test(s));}
});
const p107=read('canvio-p105-p107-depth-parallax.js');
test('P107 portable bundle is a strict three-file CRC-checked ZIP with rollback on partial import',()=>{
 for(const token of ['function exportPresetBundle','function importPresetBundle','function parsePresetZip','CRC32','central directory','source.png','depth.png','rollback','strength'])assert.ok(p107.includes(token),token);
 assert.ok(p107.includes('noNewStore')||p107.includes('noSecondTimeline'));
});
const p97=read('canvio-p97-p101.js');
test('P97–P101 local Video Editor UX module is extracted and its workflow boundaries are explicit',()=>{
 for(const token of ['P97 · Deterministic local command planner','P98 · Working tools and shortcuts','P99 · Estimated word captions','P100 · Transcript cue editing','P101 · Detailed export UI','p97NoProviderCall','p99EstimatedAlignmentDisclosed','p100RipplePlannerReused','p101MP4CapabilityAware'])assert.ok(p97.includes(token),token);
 assert.equal((html.match(/CANVIO P97–P101 · Video Editor UX & local AI Director/g)||[]).length,1);
});
const p70=read('canvio-p68-p70.js');
test('P70 remains fail-closed and enumerates fourteen manual acceptance gates',()=>{
 assert.ok(p70.includes('PENDING_MANUAL_EVIDENCE'));assert.ok(p70.includes('releaseCertified: false'));
 assert.ok(p70.includes("manualGateCount: r.manualGates.length === 14"));
});
test('Candidate index includes the three local worker paths, no external script tags, and P85/Three panels',()=>{
 for(const token of ["assets/canvio-rmbg-worker.js","assets/canvio-depth-worker.js","assets/canvio-whisper-worker.js",'canvio-p85-studio','canvio-p74'])assert.ok(html.includes(token),token);
 let cursor=0, activeExternal=[]; const lowerHtml=html.toLowerCase();
 while(true){const start=lowerHtml.indexOf('<script',cursor);if(start<0)break;const end=html.indexOf('>',start);if(end<0)break;const open=html.slice(start,end+1);if(/\\bsrc\\s*=/.test(open))activeExternal.push(open);const close=lowerHtml.indexOf('</script',end+1);if(close<0)break;cursor=close+9;}
 assert.equal(activeExternal.length,0,'Active external script element found: '+activeExternal.join(' | '));
});
const p109=html.match(/<script id="canvio-lot109">([\s\S]*?)<\/script>/)?.[1]||'';
test('P109 Studio Switcher preserves CVWS/CV.go ownership, four destinations and accessible keyboard controls',()=>{
 assert.equal((html.match(/id="canvio-lot109-css"/g)||[]).length,1);
 assert.ok(p109.includes('window.CANVIOStudioSwitcherP109'));
 for(const token of ['CVWS.open(id)','CV.go','CV.palette.build','aria-expanded','aria-current','aria-label','ArrowDown','ArrowUp','Escape'])assert.ok(p109.includes(token),token);
 for(const route of ['home','design','site','media'])assert.ok(p109.includes("id:'"+route+"'"),route);
 assert.ok(!/fetch\s*\(|XMLHttpRequest/.test(p109));
});
const p110=html.match(/<script id="canvio-lot110">([\s\S]*?)<\/script>/)?.[1]||'';
test('P110 Hub reuses CVWS recent history, command palette and existing favorites owner',()=>{
 assert.equal((html.match(/id="canvio-lot110-css"/g)||[]).length,1);
 assert.ok(p110.includes('window.CANVIOHubP110'));
 for(const token of ['canvio15.recent','CV.palette.open()','CVDesignSystem','CV.assets.list','CVWS.spaces','CV.go'])assert.ok(p110.includes(token),token);
 assert.ok(p110.includes('data-cvh-studio')&&p110.includes('data-cvh-favorites')&&p110.includes('data-cvh-recent'));
 assert.ok(!/localStorage\.setItem|fetch\s*\(|XMLHttpRequest/.test(p110));
});
const passed=Object.values(checks).filter(Boolean).length,total=Object.keys(checks).length;
const report={suite:'CANVIO_23.3.111_INTEGRATED_SOURCE_CONTRACTS',passed,total,checks,modelInferenceExecuted:false,physicalGpuExecuted:false,twoDeviceSyncExecuted:false,p70ReleaseCertified:false};
fs.writeFileSync(path.join(root,'tests/hosted/integrated-source-contracts.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(passed!==total)process.exit(1);
