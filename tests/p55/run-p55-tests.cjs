'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'assets/canvio-whisper-worker.js'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m => m[1]);
const p55 = scripts.find(s => s.includes('function collectRuntimeDiagnostics') && s.includes('CANVIO_P55_RELEASE_READINESS'));
if (!p55) throw new Error('P55 runtime/release module not found in actual index.html');
let passed = 0;
function assert(name, condition, detail = '') {
  if (!condition) throw new Error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  passed++;
  console.log(`PASS ${name}`);
}
function memoryStorage() {
  const data = new Map();
  return { getItem: k => data.has(k) ? data.get(k) : null, setItem: (k,v) => data.set(k,String(v)), removeItem: k => data.delete(k), get length(){return data.size;}, key:i=>Array.from(data.keys())[i] ?? null };
}
const session = memoryStorage();
const local = memoryStorage();
local.setItem('canvio:project:sample', JSON.stringify({title:'fixture'}));
local.setItem('canvio:provider:token', 'never expose this');
class MediaRecorderMock { static isTypeSupported(type) { return /webm/.test(type); } }
const clips = [
  {type:'video',track:1,start:0,duration:20},
  {type:'video',track:1,start:20,duration:20},
  {type:'image',track:4,start:2,duration:5},
  {type:'audio',track:2,start:0,duration:40},
  {type:'text',track:3,start:1,duration:2}
];
const videoApi = { _state:()=>({clips,duration:40}), exportWebM:()=>Promise.resolve({size:4096}), exportMP4:()=>Promise.reject(new Error('codec unavailable')), cancelExport:()=>true };
const windowHandlers = {};
const mockWindow = {
  sessionStorage:session, localStorage:local, MediaRecorder:MediaRecorderMock,
  Worker:function(){}, indexedDB:{}, AudioContext:function(){}, OfflineAudioContext:function(){}, OffscreenCanvas:function(){},
  isSecureContext:true, performance:{memory:{usedJSHeapSize:123456}},
  CV:{engines:{video:videoApi}}, addEventListener:(name,fn)=>{windowHandlers[name]=fn}
};
const mockNavigator = { userAgent:'CANVIO P55 test',deviceMemory:4,hardwareConcurrency:8,storage:{estimate:async()=>({usage:25*1024*1024,quota:100*1024*1024})} };
const canvas = {width:1920,height:1080,captureStream:()=>({})};
const mockDocument = {readyState:'loading',addEventListener:()=>{},getElementById:id=>id==='vtCanvas'?canvas:null};
const context = {window:mockWindow,navigator:mockNavigator,document:mockDocument,location:{protocol:'https:'},localStorage:local,sessionStorage:session,console,Date,Math,Number,String,Array,Object,Promise,Error,JSON,Blob,URL,Uint8Array,Map,Set};
vm.createContext(context);
vm.runInContext(p55, context, {timeout:3000});
const runtime = mockWindow.CANVIORuntimeDiagnostics;
const gate = mockWindow.CANVIOReleaseGate;
const project = mockWindow.CANVIOProjectIntegrity;
const budget = mockWindow.CANVIOPerformanceBudget;
assert('P51 runtime diagnostics API is installed', !!runtime && typeof runtime.collect === 'function');
assert('P52 render recovery API is installed', !!gate && gate.renderRecovery && typeof gate.renderRecovery.begin === 'function');
assert('P53 project integrity preflight API is installed', !!project && typeof project.preflightRestore === 'function');
assert('P54 performance budget API is installed', !!budget && typeof budget.inspect === 'function');
assert('P55 release gate API is installed', typeof gate.run === 'function');

const diag = runtime.collect({window:mockWindow,navigator:mockNavigator,document:mockDocument,location:{protocol:'https:'}});
assert('P51 reports secure context', diag.secureContext === true);
assert('P51 detects WebM codec', !!diag.codecs.webm);
assert('P51 keeps unsupported MP4 optional', diag.capabilities.find(x=>x.name==='mp4-h264-codec').required === false);
assert('P51 marks missing required features separately from optional codecs', diag.summary.requiredMissing === 0);
assert('P51 never claims MP4 support from WebM support', diag.codecs.mp4H264 === null);

(async()=>{
  const estimate = await runtime.storageEstimate({navigator:mockNavigator});
  assert('P51 reads storage estimate without changing data', estimate.available && estimate.usagePercent === 25);
  const report = budget.inspect({window:mockWindow,navigator:mockNavigator,document:mockDocument});
  assert('P54 counts media by clip type', report.clipCount === 5 && report.counts.video === 2 && report.counts.text === 1);
  assert('P54 calculates canvas backing-store estimate', report.canvas.rgbaBytesEstimate === 1920*1080*4);
  assert('P54 reports observed heap only when exposed', report.jsHeapBytes === 123456);
  assert('P54 does not fabricate loaded-media byte counts', !Object.prototype.hasOwnProperty.call(report,'mediaBytes'));
  const manyClips = Array.from({length:260}, (_,i)=>({type:i<65?'video':'image',track:1,start:i,duration:2}));
  const budgetWindow = {...mockWindow,CV:{engines:{video:{_state:()=>({clips:manyClips})}}}};
  const largeBudget = budget.inspect({window:budgetWindow,navigator:mockNavigator,document:{getElementById:()=>({width:5000,height:3000})}});
  assert('P54 raises review warnings for a large timeline and canvas', largeBudget.warnings.length >= 3 && largeBudget.level === 'review');

  const recovery = gate.renderRecovery;
  recovery.clear();
  const started = recovery.begin('webm', 1000);
  assert('P52 begins a scoped render recovery record', started.status === 'running' && started.videoFormat === 'webm');
  assert('P52 records only render metadata, not project media', !JSON.stringify(started).includes('fixture') && !JSON.stringify(started).includes('token'));
  assert('P52 marks active render as cancelling', recovery.cancel() === true && recovery.recover().status === 'cancelling');
  assert('P52 finalizes a cancelled render', recovery.finish('cancelled', null, 'user cancelled', 1600) === true && recovery.recover().status === 'cancelled');
  assert('P52 records bounded elapsed time', recovery.recover().durationMs === 600);
  recovery.begin('mp4', 2000);
  const restoredLedger = gate.renderRecovery.recover();
  assert('P52 ledger starts a new export attempt', restoredLedger.status === 'running' && restoredLedger.videoFormat === 'mp4');
  assert('P52 render export wrappers can be installed once', gate.wrapExportRecovery() === true && videoApi.exportWebM.__canvioP55Wrapped === true);
  const blob = await videoApi.exportWebM();
  assert('P52 successful WebM export is recorded', blob.size === 4096 && recovery.recover().status === 'completed' && recovery.recover().bytes === 4096);
  let mp4Rejected = false;
  try { await videoApi.exportMP4(); } catch (e) { mp4Rejected = /codec unavailable/.test(e.message); }
  assert('P52 failed MP4 export is recorded and propagated', mp4Rejected && recovery.recover().status === 'failed');
  recovery.begin('webm', 3000); recovery.finish('failed', null, 'private filename and secret=abc', 3100);
  assert('P52 ledger stores a coarse error code, not raw exception text', recovery.recover().reason === 'render-failed' && !JSON.stringify(recovery.recover()).includes('secret=abc'));
  recovery.begin('webm', 4000);
  assert('P52 active render is tracked before page navigation', recovery.recover().status === 'running');
  windowHandlers.pagehide();
  assert('P52 pagehide requests cancellation and marks unfinished render interrupted', recovery.recover().status === 'interrupted');

  let zipPreflightOk = false;
  const zipFile = {size:64,arrayBuffer:async()=>new ArrayBuffer(64),slice:()=>({arrayBuffer:async()=>new Uint8Array([0x50,0x4b,0x03,0x04]).buffer})};
  const zipResult = await project.preflightRestore(zipFile);
  zipPreflightOk = zipResult.valid && zipResult.sizeBytes === 64;
  assert('P53 accepts ZIP local-file signature', zipPreflightOk);
  let fakeZipRejected = false;
  try { await project.preflightRestore({size:64,arrayBuffer:async()=>new ArrayBuffer(64),slice:()=>({arrayBuffer:async()=>new Uint8Array([0,1,2,3]).buffer})}); } catch(e) { fakeZipRejected = /chữ ký ZIP/.test(e.message); }
  assert('P53 rejects files without ZIP signature before parsing', fakeZipRejected);
  let emptyRejected = false;
  try { await project.preflightRestore({size:0,arrayBuffer:async()=>new ArrayBuffer(0),slice:()=>({arrayBuffer:async()=>new ArrayBuffer(0)})}); } catch(e) { emptyRejected = /rỗng/.test(e.message); }
  assert('P53 rejects empty backup files', emptyRejected);
  let oversizeRejected = false;
  try { await project.preflightRestore({size:gate.constants.maxRestoreBytes+1,arrayBuffer:async()=>new ArrayBuffer(4),slice:()=>({arrayBuffer:async()=>new ArrayBuffer(4)})}); } catch(e) { oversizeRejected = /giới hạn đọc an toàn/.test(e.message); }
  assert('P53 rejects restore payloads above configured memory-safety limit', oversizeRejected);
  const audit = project.backupAudit();
  assert('P53 storage audit counts CANVIO keys only', audit.available && audit.localStorageKeys === 1);
  assert('P53 backup audit reports secret-key count without secret values', audit.excludedSecretKeyNames === 1 && !JSON.stringify(audit).includes('never expose this'));

  const release = await gate.run();
  assert('P55 emits a versioned release-readiness report', release.format === 'CANVIO_P55_RELEASE_READINESS' && release.candidate === 'P55');
  assert('P55 report has explicit manual acceptance gates', release.manualAcceptance.length >= 6 && release.manualAcceptance.every(x=>x.status==='pending'));
  assert('P55 never self-certifies production release', release.releaseCertified === false);
  assert('P55 report declares read-only and no-secret scope', release.scope.readOnly && release.scope.noSecretValues && release.scope.noProjectMutation);
  assert('P55 includes PhaseSuite runtime checks when available', typeof release.phaseSuite === 'object');
  assert('P55 release report does not expose provider secret values', !JSON.stringify(release).includes('never expose this'));

  assert('P55 lineage advances cleanly into P56 build and PhaseSuite', /version:'23\.3\.70-p56',base:'23\.3\.69-p55',candidate:'P56'/.test(html) && /version:'56\.0\.0'/.test(html));
  assert('P62 lineage is retained while document title reflects the 23.3.111 hosted candidate', /<title>CANVIO 23\.3\.111 — GitHub Runtime Verified Candidate<\/title>/.test(html) && /23\.3\.76-p62/.test(html));
  assert('P42 title observer follows P62/P56 builds instead of pinning a stale title', /buildTitleForVersion=function\(\)\{var version=window\.CANVIO_BUILD&&window\.CANVIO_BUILD\.version/.test(html) && /version==='23\.3\.76-p62'\?'CANVIO 23\.3\.76-p62 — Phase 1 Release Candidate':version==='23\.3\.70-p56'/.test(html));
  assert('P55 release dashboard button and panel IDs are created by module', /canvioP55Run/.test(p55) && /canvioP55Panel/.test(p55));
  assert('P55 restore integrity preflight remains after the P56 archive validator and before payload mutation', /CANVIOArchivePreflight\.inspect\(file\)[\s\S]{0,350}preflightRestore\(file\)[\s\S]{0,160}readStoreZip\(file\)/.test(html));
  assert('P55 backup audit is updated after a user-created ZIP', /noteBackup\(m\)/.test(html));
  assert('P55 worker asset remains present and unchanged', fs.existsSync(path.join(root,'assets/canvio-whisper-worker.js')) && worker.includes('transformers'));
  assert('P55 source is appended as a single additive inline script', /<script id="canvio-p55-runtime-release-gate">/.test(html));

  const staleStore = memoryStorage();
  staleStore.setItem('canvio:p55:render-recovery:v1', JSON.stringify({format:'CANVIO_RENDER_RECOVERY',version:1,job:'prior',status:'running',videoFormat:'webm',startedAt:new Date(Date.now()-5000).toISOString()}));
  const staleWindow = {sessionStorage:staleStore,localStorage:local,MediaRecorder:MediaRecorderMock,Worker:function(){},indexedDB:{},isSecureContext:true,addEventListener:()=>{}};
  const staleContext = {window:staleWindow,navigator:mockNavigator,document:mockDocument,location:{protocol:'https:'},localStorage:local,sessionStorage:staleStore,console,Date,Math,Number,String,Array,Object,Promise,Error,JSON,Blob,URL,Uint8Array,Map,Set};
  vm.createContext(staleContext); vm.runInContext(p55, staleContext, {timeout:3000});
  assert('P52 marks a stale running render as interrupted on next app load', staleWindow.CANVIOReleaseGate.renderRecovery.recover().status === 'interrupted');

  console.log(`\nP55: ${passed}/${passed} assertions passed.`);
})().catch(e=>{console.error(e);process.exitCode=1});
