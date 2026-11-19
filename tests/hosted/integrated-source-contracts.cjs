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
const p111=html.match(/<script id="canvio-lot111">([\s\S]*?)<\/script>/)?.[1]||'';
test('P111 Design rail maps the complete existing workspace and preserves page engines',()=>{
 assert.equal((html.match(/id="canvio-lot111-css"/g)||[]).length,1);
 assert.ok(p111.includes('window.CANVIOStudioShellP111'));
 for(const token of ['CVWS.spaces','CVWS.pageToSpace','CV.go','aria-current','data-cv111-page'])assert.ok(p111.includes(token),token);
 assert.ok(!/localStorage\.setItem|fetch\s*\(|XMLHttpRequest|innerHTML\s*=\s*.*cloneNode/.test(p111));
});
const p112=html.match(/<script id="canvio-lot112">([\s\S]*?)<\/script>/)?.[1]||'';
test('P112 Website & hồ sơ registers the existing site workspace in the shared shell',()=>{
 assert.ok(p112.includes('CANVIOStudioShellP111')&&p112.includes("shell.register('site')"));
 for(const id of ['autodesign','cvstudio','web','webEngine','portfolioStudio','hrvisual'])assert.ok(html.includes("['"+id+"'"),id);
 assert.ok(p112.includes('#page-cvstudio')&&p112.includes('#cv87-docx'));
 assert.ok(!/localStorage\.setItem|fetch\s*\(|XMLHttpRequest/.test(p112));
});
const p113=html.match(/<script id="canvio-lot113">([\s\S]*?)<\/script>/)?.[1]||'';
test('P113 Photo & Video uses existing rail groups and keeps Video Engine owner',()=>{
 assert.ok(p113.includes("shell.register('media')"));
 for(const id of ['pixelStudio','imageStudio','videoEngine','motionLab','videoStudio','shotcraft','motionCut'])assert.ok(html.includes("['"+id+"'"),id);
 assert.ok(p113.includes("x[2]==='ẢNH'")&&p113.includes("x[2]==='VIDEO'")&&p113.includes("x[2]==='LEGACY'"));
 assert.ok(p113.includes('#page-videoEngine')&&p113.includes('CV.go'));
 assert.ok(!/localStorage\.setItem|fetch\s*\(|XMLHttpRequest/.test(p113));
});
const p114=html.match(/<script id="canvio-lot114">([\s\S]*?)<\/script>/)?.[1]||'';
test('P114 keeps a reversible v16 fallback and responsive accessible Studio navigation',()=>{
 assert.equal((html.match(/id="canvio-lot114-css"/g)||[]).length,1);
 assert.ok(p114.includes("KEY='canvio15.nav-mode'")&&p114.includes("mode==='shell'?'v16':'shell'"));
 assert.ok(p114.includes("root.setAttribute('data-nav',mode)")&&p114.includes('aria-pressed')&&p114.includes('aria-label'));
 assert.ok(p114.includes("document.querySelector('#side')")&&p114.includes("document.querySelector('#ws-tabs')"));
 assert.ok(html.includes('safe-area-inset-bottom')&&html.includes('prefers-reduced-motion'));
});
const p115=html.match(/<script id="canvio-lot115">([\s\S]*?)<\/script>/)?.[1]||'';
test('P115 keeps a same-origin optional PWA shell and local pinned design runtimes',()=>{
 for(const token of ['CANVIOOfflineP115','./canvio-sw.js','https:','serviceWorkerOptional:true'])assert.ok(p115.includes(token),token);
 const vm=read('assets/vendor/CANVIO-VENDOR-MANIFEST.json');
 for(const token of ['assets/vendor/konva/konva.min.js','assets/vendor/grapesjs/grapes.min.js','assets/vendor/lenis/lenis.min.js'])assert.ok(vm.includes(token),token);
 assert.ok(!html.includes("import('https://esm.sh/@ffmpeg"));
});
const p122=html.match(/<script id="canvio-lot122">([\s\S]*?)<\/script>/)?.[1]||'';
test('P122.1 offers explainable local taste checks and opt-in style application',()=>{
 assert.ok(p122.includes('CVTasteP122')&&p122.includes('function audit('));
 for(const token of ['typography','color','icons','motion','accessibility','hierarchy','prefers-reduced-motion'])assert.ok(p122.includes(token),token);
 assert.ok(p122.includes('userAppliedPresetOnly:true')&&!/fetch\s*\(|XMLHttpRequest/.test(p122));
});
const p1222=html.match(/<script id="canvio-lot1222">([\s\S]*?)<\/script>/)?.[1]||'';
test('P122.2 previews one local CSS group and guards apply, cancel and undo',()=>{
 for(const token of ['CVUnslopP1222','function plan(','function preview(','function apply(','function undo(','editor-changed-review-again','apply-failed-rolled-back','cv1222-preview'])assert.ok(p1222.includes(token),token);
 assert.ok(!/fetch\s*\(|XMLHttpRequest/.test(p1222));
});
const p123=html.match(/<script id="canvio-lot123">([\s\S]*?)<\/script>/)?.[1]||'';
test('P123 provides twelve unique editable layout starters through the existing GrapesJS editor',()=>{
 assert.ok(p123.includes('CVLayoutsP123')&&p123.includes('ed.addComponents(markup(item))'));
 for(const name of ['Bento Grid','Command Palette','Canvas Editor','Mega Menu','Sticky Sidebar','Three-Pane Inbox','Kanban Board','Timeline','Zig-Zag','Map + List','Product Page','Chat + Artifact'])assert.ok(p123.includes(name),name);
 assert.ok(p123.includes('twelveUniqueLayouts')&&!/fetch\s*\(|XMLHttpRequest/.test(p123));
});
const p127=html.match(/<script id="canvio-lot127">([\s\S]*?)<\/script>/)?.[1]||'';
test('P127.1 imports only validated edits to existing unlocked canonical clips with rollback',()=>{
 for(const token of ['CVEditPlanP127','CANVIO_EDIT_PLAN','clipId','duration','isLocked','rollback','typeof a.commit'])assert.ok(p127.includes(token),token);
 assert.ok(p127.includes('MAX=500')&&p127.includes('onlyExistingClips:true'));
 assert.ok(!/fetch\s*\(|XMLHttpRequest|localStorage\.setItem/.test(p127));
});
const passed=Object.values(checks).filter(Boolean).length,total=Object.keys(checks).length;
const report={suite:'CANVIO_23.3.111_INTEGRATED_SOURCE_CONTRACTS',passed,total,checks,modelInferenceExecuted:false,physicalGpuExecuted:false,twoDeviceSyncExecuted:false,p70ReleaseCertified:false};
fs.writeFileSync(path.join(root,'tests/hosted/integrated-source-contracts.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(passed!==total)process.exit(1);
