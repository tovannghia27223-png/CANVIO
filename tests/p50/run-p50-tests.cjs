'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m => m[1]);
const videoScript = scripts.find(s => s.includes('function vWhisperSyncControls') && s.includes('function vExportMimeCandidates'));
if (!videoScript) throw new Error('Could not locate P50 Video Engine script.');
let passed = 0;
function assert(name, condition, detail = '') {
  if (!condition) throw new Error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  passed++;
  console.log(`PASS ${name}`);
}

// Test the worker lifecycle from the actual source, with browser-only objects stubbed.
const whisperStart = videoScript.indexOf('var vWhisperWorker=');
const whisperEnd = videoScript.indexOf('function vDownloadCaption(', whisperStart);
if (whisperStart < 0 || whisperEnd < 0) throw new Error('P50 Whisper lifecycle helpers not found.');
const timerQueue = [];
const clearQueue = [];
const controlNodes = {
  vtWhisperCancel: { disabled: true },
  vtWhisperUnload: { disabled: true },
  vtStatus: { textContent: '' }
};
let workerInstances = [];
class WorkerMock {
  constructor(url, options) { this.url = url; this.options = options; this.terminated = false; this.messages = []; workerInstances.push(this); }
  postMessage(message, transfer) { this.messages.push({ message, transfer }); }
  terminate() { this.terminated = true; }
}
const whisperCtx = {
  console,
  window: { Worker: WorkerMock },
  document: { baseURI: 'https://example.test/app/', getElementById: id => controlNodes[id] || null },
  Worker: WorkerMock,
  URL,
  Error,
  Number, String, Math, Array, Object, Float32Array, Promise,
  setTimeout(fn, ms) { const item = { fn, ms, cleared: false }; timerQueue.push(item); return item; },
  clearTimeout(item) { if (item) { item.cleared = true; clearQueue.push(item); } },
  toast: () => {},
};
vm.createContext(whisperCtx);
vm.runInContext(`${videoScript.slice(whisperStart, whisperEnd)}\nglobalThis.__p50Whisper={vWhisperCancel,vWhisperUnload,vWhisperRunWorker,vWhisperGetWorker,vWhisperSyncControls,vWhisperRejectPending};`, whisperCtx);
const whisper = whisperCtx.__p50Whisper;
assert('Whisper cancel is a no-op when no job or worker exists', whisper.vWhisperCancel() === false);

// Create an active request and ensure explicit cancellation terminates the worker and rejects pending work.
let rejectionMessage = '';
const fakeWorker = new WorkerMock(new URL('assets/canvio-whisper-worker.js', 'https://example.test/app/'), { type: 'module' });
whisperCtx.vWhisperWorker = fakeWorker;
whisperCtx.vWhisperBusy = true;
whisperCtx.vWhisperPending[91] = { resolve: () => {}, reject: e => { rejectionMessage = e.message; }, timer: null };
const beforeToken = whisperCtx.vWhisperJobToken;
assert('Whisper cancellation reports an active job', whisper.vWhisperCancel() === true);
assert('Whisper cancellation increments the stale-job token', whisperCtx.vWhisperJobToken === beforeToken + 1);
assert('Whisper cancellation terminates the active module worker', fakeWorker.terminated === true && whisperCtx.vWhisperWorker === null);
assert('Whisper cancellation rejects and clears pending requests', /hủy/i.test(rejectionMessage) && Object.keys(whisperCtx.vWhisperPending).length === 0);

// Recreate worker through the real helper and exercise the watchdog without waiting 15 minutes.
workerInstances = [];
const request = whisper.vWhisperRunWorker(new Float32Array([0.1, -0.1]), 'auto');
const spawned = workerInstances[0];
assert('Whisper request uses a module worker with relative app asset URL', !!spawned && spawned.options.type === 'module' && /assets\/canvio-whisper-worker\.js$/.test(spawned.url.href));
assert('Whisper request transfers its Float32Array buffer', spawned.messages.length === 1 && spawned.messages[0].transfer.length === 1);
const watchdog = timerQueue[timerQueue.length - 1];
assert('Whisper request installs a 15-minute watchdog', watchdog.ms === 900000 && Object.keys(whisperCtx.vWhisperPending).length === 1);
let watchdogRejected = false;
request.catch(e => { watchdogRejected = /15 phút/.test(e.message); });
watchdog.fn();
Promise.resolve().then(() => {
  assert('Whisper watchdog terminates the worker after timeout', spawned.terminated === true && whisperCtx.vWhisperWorker === null);
  assert('Whisper watchdog clears the pending request', Object.keys(whisperCtx.vWhisperPending).length === 0);
  assert('Whisper watchdog rejects the request with actionable guidance', watchdogRejected);
  const idleWorker = new WorkerMock(new URL('assets/canvio-whisper-worker.js', 'https://example.test/app/'), { type: 'module' });
  whisperCtx.vWhisperWorker = idleWorker; whisperCtx.vWhisperBusy = false;
  assert('Whisper model unload terminates an idle worker', whisper.vWhisperUnload() === true && idleWorker.terminated && whisperCtx.vWhisperWorker === null);
  return Promise.resolve();
}).then(async () => {
  // Export cancellation helpers are extracted independently from the same source script.
  const exportStart = videoScript.indexOf('var vExportBusy=false,vExportCancelActive=null;');
  const exportEnd = videoScript.indexOf('/* CANVIO 10.0 Designer Core', exportStart);
  if (exportStart < 0 || exportEnd < 0) throw new Error('P50 export helpers not found.');
  const exportCtx = {
    console,
    window: { MediaRecorder: null },
    document: { getElementById: () => null },
    toast: () => {},
    videoState: { clips: [], duration: 0, time: 0 },
    Number, String, Math, Array, Object, Promise, Error,
  };
  vm.createContext(exportCtx);
  vm.runInContext(`${videoScript.slice(exportStart, exportEnd)}\nglobalThis.__p50Export={vCancelExport,vExportPickMime,vExportCapabilities};`, exportCtx);
  const exp = exportCtx.__p50Export;
  assert('Export cancellation is a no-op when idle', exp.vCancelExport() === false);
  let cancelled = 0;
  exportCtx.vExportCancelActive = () => { cancelled++; };
  assert('Export cancellation invokes the active recorder stop handler', exp.vCancelExport() === true && cancelled === 1);
  exportCtx.vExportCancelActive = null;
  exportCtx.vExportBusy = true;
  assert('Single-export guard blocks overlapping renders', await exportCtx.vExport({ format: 'webm' }) === null);
  assert('P50 Video Engine exposes export and Whisper cancellation APIs', /cancelExport:vCancelExport/.test(videoScript) && /whisperCancel:vWhisperCancel/.test(videoScript));
  assert('P50 UI exposes cancel render, cancel Whisper and unload model controls', ['vtExportCancel', 'vtWhisperCancel', 'vtWhisperUnload'].every(id => html.includes(`id="${id}"`)));
  assert('P50 guards cancel controls until their operations are active', /id="vtExportCancel"[^>]*disabled/.test(html) && /id="vtWhisperCancel"[^>]*disabled/.test(html) && /id="vtWhisperUnload"[^>]*disabled/.test(html));
  assert('P50 single-export cleanup disables control after settlement', /vExportBusy=false;vExportCancelActive=null;if\(cancelButton\)cancelButton\.disabled=true/.test(videoScript));
  assert('P50 Whisper cleanup clears watchdog timers and pending jobs', /function vWhisperRejectPending\(error\)[\s\S]*?clearTimeout\(item\.timer\)/.test(videoScript));
  assert('P50 marker and PhaseSuite versions are aligned', /version:'23\.3\.69-p55',base:'23\.3\.68-p54',candidate:'P55'/.test(html) && /version:'55\.0\.0'/.test(html) || /version:'23\.3\.64-p50',base:'23\.3\.63-p49',candidate:'P50'/.test(html) && /version:'50\.0\.0'/.test(html));

  // Exercise the real export Promise and cleanup path with a deterministic MediaRecorder stub.
  let recorder;
  let stoppedTrack = false;
  let rafCancelled = 0;
  const cancelNode = { disabled: true };
  const statusNode = { textContent: '' };
  const captureTrack = { stop() { stoppedTrack = true; } };
  class RecorderIntegrationMock {
    constructor(stream, options) { this.stream = stream; this.mimeType = options.mimeType; this.state = 'inactive'; recorder = this; }
    static isTypeSupported(type) { return type === 'video/webm;codecs=vp9'; }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; if (this.onstop) this.onstop(); }
  }
  const canvasNode = { captureStream: () => ({ getTracks: () => [captureTrack] }) };
  const integrationCtx = {
    console, window: { MediaRecorder: RecorderIntegrationMock },
    document: { getElementById: id => id === 'vtCanvas' ? canvasNode : id === 'vtExportCancel' ? cancelNode : id === 'vtStatus' ? statusNode : null },
    toast: () => {},
    videoState: { clips: [], duration: 5, time: 2 },
    vPause: () => {}, vDraw: () => {},
    performance: { now: () => 100 }, requestAnimationFrame: () => 77,
    cancelAnimationFrame: () => { rafCancelled++; },
    Number, String, Math, Array, Object, Promise, Error, Blob, URL, setTimeout, clearTimeout,
  };
  vm.createContext(integrationCtx);
  vm.runInContext(`${videoScript.slice(exportStart, exportEnd)}\nglobalThis.__p50RunExport={vExport,vCancelExport};`, integrationCtx);
  const activeExport = integrationCtx.__p50RunExport.vExport({ format: 'webm' });
  assert('Export enables its cancel control only while render is active', cancelNode.disabled === false && recorder && recorder.state === 'recording');
  assert('Export rejects a second concurrent render before creating another recorder', await integrationCtx.__p50RunExport.vExport({ format: 'webm' }) === null);
  assert('User cancel routes to the active MediaRecorder stop handler', integrationCtx.__p50RunExport.vCancelExport() === true && recorder.state === 'inactive');
  let cancelledExport = false;
  try { await activeExport; } catch (e) { cancelledExport = /hủy render/i.test(e.message); }
  assert('Cancelled export rejects without saving a file', cancelledExport && statusNode.textContent.includes('hủy render'));
  assert('Cancelled export stops the capture track and cancels RAF', stoppedTrack && rafCancelled === 1);
  assert('Cancelled export restores the previous playhead and disables cancel UI', integrationCtx.videoState.time === 2 && cancelNode.disabled === true && integrationCtx.vExportBusy === false);
  console.log(`P50 PASS: ${passed} assertions`);
}).catch(error => { console.error(error); process.exitCode = 1; });
