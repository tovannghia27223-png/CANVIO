'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const passed = [];
const a11yLabelRefs = Object.create(null);
function assert(name, ok) { if (!ok) throw new Error('FAIL ' + name); passed.push(name); console.log('PASS ' + name); }

const syncModules = [
  ['tests/p57/p57-native-persistence.js', 'canvio-p57-native-persistence-audit'],
  ['tests/p58/p58-media-export-acceptance.js', 'canvio-p58-media-export-acceptance'],
  ['tests/p59/p59-whisper-runtime-acceptance.js', 'canvio-p59-whisper-runtime-acceptance'],
  ['tests/p60/p60-accessibility-audit.js', 'canvio-p60-accessibility-screening'],
  ['tests/p61/p61-hosting-security-audit.js', 'canvio-p61-hosting-security-audit'],
  ['tests/p62/p62-release-candidate-gate.js', 'canvio-p62-phase1-release-gate']
];
const appHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const modulesSynced = syncModules.every(([file, id]) => {
  const opening = '<script id="' + id + '">';
  const start = appHtml.indexOf(opening);
  const end = start < 0 ? -1 : appHtml.indexOf('</script>', start + opening.length);
  return start >= 0 && end >= 0 &&
    appHtml.slice(start + opening.length, end).trim() === fs.readFileSync(path.join(root, file), 'utf8').trim();
});
assert('P57–P62 standalone modules exactly match their index.html inline copies', modulesSynced);

class FakeDB {
  constructor() { this.version = 1; this.rows = new Map(); this.objectStoreNames = { contains: (name) => name === 'media' }; }
  close() { this.closed = true; }
  transaction(name, mode) {
    const db = this; const tx = { error: null, oncomplete: null, onerror: null, onabort: null };
    const store = {
      add(row) { if (db.rows.has(row.id)) throw new Error('ConstraintError'); db.rows.set(row.id, row); },
      put(row) { db.rows.set(row.id, row); },
      get(id) { const req = { result: null, onsuccess: null, onerror: null }; queueMicrotask(() => { req.result = db.rows.get(id); if (req.onsuccess) req.onsuccess(); queueMicrotask(() => tx.oncomplete && tx.oncomplete()); }); return req; },
      delete(id) { db.rows.delete(id); }
    };
    if (mode === 'readonly') store.count = () => { const req = { result: db.rows.size, onsuccess: null }; queueMicrotask(() => { if (req.onsuccess) req.onsuccess(); queueMicrotask(() => tx.oncomplete && tx.oncomplete()); }); return req; };
    tx.objectStore = (n) => { if (n !== 'media') throw new Error('NotFoundError'); return store; };
    return tx;
  }
}
const db = new FakeDB();
let blockNextOpen = false;
const indexedDB = { open(name) {
  const req = { result: null, transaction: null };
  queueMicrotask(() => {
    if (blockNextOpen) {
      blockNextOpen = false;
      if (req.onblocked) req.onblocked();
      queueMicrotask(() => { req.result = db; if (req.onsuccess) req.onsuccess(); });
      return;
    }
    req.result = db; if (req.onsuccess) req.onsuccess();
  });
  return req;
} };
const document = {
  title: 'P56', baseURI: 'https://canvio.example/', readyState: 'complete',
  getElementById: id => a11yLabelRefs[id] || null, querySelector: () => null, querySelectorAll: () => [],
  createElement(tag) {
    if (tag !== 'video') return {};
    const v = { duration: 12.5, videoWidth: 1920, videoHeight: 1080, readyState: 3, pause(){}, removeAttribute(){}, load(){}, set src(value) { this._src=value; queueMicrotask(() => { this.onloadedmetadata && this.onloadedmetadata(); this.oncanplay && this.oncanplay(); }); }, get src(){return this._src;} };
    return v;
  }
};
const navigator = { storage: { estimate: async () => ({usage:1234,quota:99999}), persisted: async () => false, persist: async () => true } };
const window = {
  CANVIO_BUILD: {version:'23.3.70-p56',base:'23.3.69-p55',features:[]},
  CANVIOPhaseSuite: {version:'56.0.0',tests:()=>({priorPhase:true})},
  CANVIOReleaseGate: {run:async()=>({candidate:'P56',status:'NEEDS_MANUAL_ACCEPTANCE',releaseCertified:false})},
  indexedDB, isSecureContext:true,
  location:{protocol:'https:',hostname:'canvio.example',origin:'https://canvio.example',href:'https://canvio.example/'},
  URL: {createObjectURL:()=> 'blob:fake', revokeObjectURL:()=>{}},
  confirm:()=>true
};
class TestURL extends URL { static createObjectURL(){ return 'blob:fake'; } static revokeObjectURL(){} }
const context = {window,document,navigator,indexedDB,URL:TestURL,Blob,TextEncoder,TextDecoder,ArrayBuffer,Uint8Array,DataView,Number,Math,Object,String,RegExp,Error,Promise,JSON,Date,Set,Map,console,setTimeout,clearTimeout,fetch:async()=>({ok:true,status:200,headers:{get:()=> 'text/javascript'},text:async()=>"Transformers.js 3.8.1 ./p85/transformers/transformers.min.js Xenova/whisper-tiny automatic-speech-recognition"})};
vm.createContext(context);
const files = [
  'tests/p57/p57-native-persistence.js','tests/p58/p58-media-export-acceptance.js',
  'tests/p59/p59-whisper-runtime-acceptance.js','tests/p60/p60-accessibility-audit.js',
  'tests/p61/p61-hosting-security-audit.js','tests/p62/p62-release-candidate-gate.js'
];
for (const file of files) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file,timeout:3000});
(async()=>{
  const storage = await window.CANVIOPersistenceAudit.inspect();
  assert('P57 opens existing CANVIO_81_MEDIA without schema upgrade', storage.databaseAvailable && storage.database==='CANVIO_81_MEDIA' && storage.databaseVersion===1 && storage.objectStore==='media');
  assert('P57 inspection is read-only and reports quota/persistence separately', storage.scope.readOnly && storage.scope.schemaChanged===false && storage.scope.mediaWritten===false && storage.storageUsageBytes===1234 && storage.storagePersisted===false);
  const round = await window.CANVIOPersistenceAudit.roundTrip();
  assert('P57 temporary Blob write/read/delete round-trip is verified', round.ok && round.verified && round.cleanupScheduled && db.rows.size===0);
  const persist = await window.CANVIOPersistenceAudit.requestPersistence();
  assert('P57 persistent storage request is explicit and reports browser decision', persist.supported && persist.granted);
  const mediaFile = new Blob(['synthetic-test'], {type:'video/webm'}); Object.defineProperty(mediaFile,'name',{value:'delivery.webm'});
  const media = await window.CANVIOExportAcceptance.inspectFile(mediaFile);
  assert('P58 validates selected WebM metadata and browser decode-readiness without upload', media.format==='webm' && media.durationSeconds===12.5 && media.width===1920 && media.scope.upload===false && media.scope.avSyncCertified===false);
  let badType=false; const badFile = new Blob(['x'], {type:'application/octet-stream'}); Object.defineProperty(badFile,'name',{value:'x.exe'}); try { await window.CANVIOExportAcceptance.inspectFile(badFile); } catch(e) { badType=/MP4 hoặc WebM/.test(e.message); }
  assert('P58 rejects unsupported or ambiguous file formats',badType);
  const worker = await window.CANVIOWhisperAcceptance.inspectWorker();
  assert('P59 worker check verifies pinned runtime/model without running inference',worker.checked && worker.available && worker.transformersVersionPinned && worker.modelPinned && worker.modelInferenceTested===false);
  const fakeNode = (tag, attrs={}, text='', props={}) => Object.assign({tagName:tag.toUpperCase(),id:attrs.id||'',innerText:text,textContent:text,hidden:false,getAttribute:(k)=>attrs[k]||null,hasAttribute:(k)=>Object.prototype.hasOwnProperty.call(attrs,k),closest:()=>null},props);
  a11yLabelRefs['a11y-label-one'] = fakeNode('span',{},'Export');
  a11yLabelRefs['a11y-label-two'] = fakeNode('span',{},'project');
  const unnamedControl = fakeNode('button',{id:'unnamed-control'},'');
  const multiLabelControl = fakeNode('button',{id:'multi-labelled','aria-labelledby':'a11y-label-one a11y-label-two'},'');
  const nativeLabelControl = fakeNode('input',{id:'email]field'},'',{labels:[fakeNode('label',{},'Email address')]});
  const brokenLabelControl = fakeNode('button',{id:'broken-labelled','aria-labelledby':'missing-label-id'},'');
  const hiddenControl = fakeNode('button',{id:'hidden-control'},'Hidden',{hidden:true});
  const a11yControls = [unnamedControl,multiLabelControl,nativeLabelControl,brokenLabelControl,hiddenControl];
  const a11yRoot = {querySelectorAll(selector){if(selector==='button,a[href],input,select,textarea,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])')return a11yControls;if(selector==='img')return [fakeNode('img',{},'')];if(selector==='main,nav,header,footer,aside,[role="main"],[role="navigation"],[role="region"]')return [fakeNode('main')];if(selector==='h1,h2,h3,h4,h5,h6')return [fakeNode('h1',{},'Title')];if(selector==='[role="dialog"],[aria-modal="true"]')return [];if(selector==='label[for]')return [];return [];}};
  const a11y = window.CANVIOAccessibilityAudit.inspect(a11yRoot);
  assert('P60 flags unnamed controls and missing image alt while recognizing label references', a11y.counts.unnamedControls===2 && a11y.counts.imagesMissingAlt===1 && a11y.scope.wcagCertified===false);
  assert('P60 resolves whitespace-separated aria-labelledby ID references', a11y.issues.filter(x=>x.code==='control-name-missing').every(x=>x.id!=='multi-labelled'));
  assert('P60 recognizes native labels when IDs contain CSS selector punctuation', a11y.issues.filter(x=>x.code==='control-name-missing').every(x=>x.id!=='email]field'));
  const host = window.CANVIOHostingSecurityAudit.inspect();
  assert('P61 hosting audit detects secure transport and same-origin worker target', host.secureTransport && host.workerSameOrigin && host.scope.headersRequireServerInspection===true);
  assert('P61 explicitly leaves server headers for live-origin verification', host.serverSecurityHeadersVerified===false && host.warnings.length>0);
  const report = await window.CANVIOPhase1ReleaseGate.run();
  assert('P62 aggregates all six implementations and keeps release fail-closed', Object.values(report.implementation).every(Boolean) && report.candidate==='P62' && report.releaseCertified===false && report.status==='BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE');
  assert('P62 preserves six mandatory real-world acceptance gates', report.manualGates.length===6 && report.manualGates.every(x=>x.status==='OPEN'));
  assert('PhaseSuite advances to P62 and preserves previous phase flags', window.CANVIOPhaseSuite.version==='62.0.0' && window.CANVIOPhaseSuite.tests().priorPhase && window.CANVIOPhaseSuite.tests().p62Phase1ReleaseGate);
  assert('Build/title marker advances to 23.3.76-p62', window.CANVIO_BUILD.version==='23.3.76-p62' && document.title==='CANVIO 23.3.76-p62 — Phase 1 Release Candidate');
  assert('P57 never upgrades an unknown DB and P62 never self-certifies', window.CANVIOPersistenceAudit.owner.schemaVersion===1 && report.releaseCertified===false);
  blockNextOpen = true;
  db.closed = false;
  const blocked = await window.CANVIOPersistenceAudit.inspect();
  // The fake request deliberately dispatches its late success in a subsequent task.
  // Wait for that event rather than depending on a single event-loop turn.
  for (let attempt=0; attempt<25 && !db.closed; attempt++) await new Promise(resolve => setTimeout(resolve, 2));
  console.log('P57 blocked-open diagnostic:', JSON.stringify({databaseAvailable:blocked.databaseAvailable,databaseError:blocked.databaseError,dbClosed:db.closed}));
  assert('P57 closes a late IndexedDB connection after a blocked-open rejection', blocked.databaseAvailable===false && /bị khóa/.test(blocked.databaseError) && db.closed===true);
  console.log(`\nP57–P62 PASS: ${passed.length}/${passed.length} assertions passed.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
