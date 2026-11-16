'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = process.argv[2] || path.resolve(__dirname, '../../index.html');
const html = fs.readFileSync(sourcePath, 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m => m[1]);
const videoScript = scripts.find(s => s.includes('function vTrackSettingsClean') && s.includes('function vVttParse') && s.includes('function vExportMimeCandidates'));
if (!videoScript) throw new Error('Could not locate the canonical Video Engine script block.');

function assert(name, condition, detail = '') {
  if (!condition) throw new Error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  console.log(`PASS ${name}`);
}

const exportStart = videoScript.indexOf('function vExportMimeCandidates');
const exportEnd = videoScript.indexOf('async function vExport(options)', exportStart);
const captionStart = videoScript.indexOf('function vCaptionQC()');
const captionEnd = videoScript.indexOf('function vDownloadCaption(', captionStart);
if (exportStart < 0 || exportEnd < 0 || captionStart < 0 || captionEnd < 0) throw new Error('P49 helpers not found.');

const ctx = {
  console,
  window: { MediaRecorder: null },
  document: { getElementById: () => null },
  toast: () => {},
  videoState: { clips: [] },
  Number, String, Math, Array, Object
};
vm.createContext(ctx);
vm.runInContext(`${videoScript.slice(exportStart, exportEnd)}\n${videoScript.slice(captionStart, captionEnd)}\nglobalThis.__p49={vExportMimeCandidates,vExportPickMime,vExportCapabilities,vCaptionQC,vWhisperBuildCues};`, ctx);
const api = ctx.__p49;

const webmRecorder = { isTypeSupported: t => t === 'video/webm;codecs=vp9' || t === 'video/webm' };
assert('WebM prefers VP9 when supported', api.vExportPickMime('webm', webmRecorder) === 'video/webm;codecs=vp9');
const vp8Recorder = { isTypeSupported: t => t === 'video/webm;codecs=vp8' };
assert('WebM falls back to VP8', api.vExportPickMime('webm', vp8Recorder) === 'video/webm;codecs=vp8');
const genericWebMRecorder = { isTypeSupported: t => t === 'video/webm' };
assert('WebM falls back to generic container', api.vExportPickMime('webm', genericWebMRecorder) === 'video/webm');
assert('Missing MediaRecorder is rejected', api.vExportPickMime('webm', null) === null);
assert('MP4/H.264 selects explicit AVC + AAC when supported', api.vExportPickMime('mp4', {isTypeSupported: t => t === 'video/mp4;codecs="avc1.424028,mp4a.40.2"'}) === 'video/mp4;codecs="avc1.424028,mp4a.40.2"');
assert('MP4/H.264 selects AVC-only fallback when AAC combo is unavailable', api.vExportPickMime('mp4', {isTypeSupported: t => t === 'video/mp4;codecs=avc1'}) === 'video/mp4;codecs=avc1');
assert('Generic MP4 alone does not falsely advertise H.264', api.vExportPickMime('mp4', {isTypeSupported: t => t === 'video/mp4'}) === null);
assert('Codec-probe exceptions fail closed', api.vExportPickMime('mp4', {isTypeSupported: () => { throw new Error('probe failed'); }}) === null);
assert('Missing isTypeSupported preserves WebM-only fallback', api.vExportPickMime('webm', function MediaRecorderMock(){}) === 'video/webm');
assert('Missing isTypeSupported never claims MP4/H.264', api.vExportPickMime('mp4', function MediaRecorderMock(){}) === null);
const capsCtx = { isTypeSupported: t => t.includes('avc1') || t === 'video/webm' };
const caps = api.vExportCapabilities(capsCtx);
assert('Capability report records H.264 support only after explicit AVC probe', caps.h264Supported && caps.mp4RequiresNativeH264 && caps.ffmpegFallback === false);
assert('Capability report records WebM type independently', caps.webmMime === 'video/webm');

ctx.videoState.clips = [];
let qc = api.vCaptionQC();
assert('Caption preflight handles an empty timeline', qc.cueCount === 0 && qc.errorCount === 0 && qc.warningCount === 0);
ctx.videoState.clips = [
  {type:'text', start:0, duration:2, text:'A short caption'},
  {type:'text', start:3, duration:2, text:'A second readable caption'}
];
qc = api.vCaptionQC();
assert('Readable non-overlapping captions pass', qc.clean && qc.cueCount === 2);
ctx.videoState.clips = [
  {type:'text', start:-1, duration:0, text:''},
  {type:'text', start:0, duration:5, text:'First cue'},
  {type:'text', start:2, duration:1, text:'Overlaps first cue'}
];
qc = api.vCaptionQC();
assert('Caption preflight detects invalid time and empty text', qc.errorCount >= 3);
assert('Caption preflight detects overlapping cues', qc.issues.some(x => x.code === 'overlap'));
ctx.videoState.clips = [{type:'text', start:0, duration:1, text:'This caption is intentionally far too long to read in one second'}];
qc = api.vCaptionQC();
assert('Caption preflight detects excessive reading speed', qc.issues.some(x => x.code === 'reading-speed'));
assert('Caption preflight detects overly long line', qc.issues.some(x => x.code === 'long-line'));
ctx.videoState.clips = [{type:'text', start:0, duration:4, text:'line one\nline two\nline three'}];
qc = api.vCaptionQC();
assert('Caption preflight detects more than two lines', qc.issues.some(x => x.code === 'too-many-lines'));
ctx.videoState.clips = [
  {type:'text', start:0, duration:8, text:'Long cue'},
  {type:'text', start:2, duration:1, text:'Nested cue'},
  {type:'text', start:4, duration:1, text:'Still overlaps first cue'}
];
qc = api.vCaptionQC();
assert('Caption overlap scan compares against furthest active cue', qc.issues.filter(x => x.code === 'overlap').length === 2);

assert('P49 source exposes native MP4/H.264 export', /exportMP4:vExportMP4/.test(videoScript));
assert('P49 main export uses selected MIME, not a hard-coded WebM MIME', !/var mime=\['video\/webm;codecs=vp9'/.test(videoScript.slice(exportStart, videoScript.indexOf('function vCaptionQC'))));
assert('P49 refuses mislabeled MP4 output', /format==='mp4'&&\(!\/\^video\\\/mp4/.test(videoScript));
assert('P49 caption QA API is exposed', /captionQC:vCaptionQC,runCaptionQC:vRunCaptionQC/.test(videoScript));
const whisperCues = api.vWhisperBuildCues({chunks:[{text:'Xin chào',timestamp:[0,1.4]},{text:'CANVIO',timestamp:[1.4,2.2]}]}, 5, 10);
assert('Whisper chunk timestamps map to timeline offset', whisperCues.length === 2 && whisperCues[0].start === 5 && whisperCues[1].start === 6.4);
const fallbackCue = api.vWhisperBuildCues({text:'Transcript without timestamp chunks'}, 3, 7);
assert('Whisper output without chunk timestamps remains one reviewable cue', fallbackCue.length === 1 && fallbackCue[0].start === 3 && fallbackCue[0].duration === 7);
assert('Whisper rejects malformed timestamps and empty chunks', api.vWhisperBuildCues({chunks:[{text:'bad',timestamp:[null,1]},{text:'',timestamp:[0,1]}]}, 0, 3).length === 0);
assert('P49 exposes user-triggered Whisper adapter and unload', /whisperCaption:vWhisperCaption,whisperCancel:vWhisperCancel,whisperUnload:vWhisperUnload,whisperBuildCues:vWhisperBuildCues/.test(videoScript));
const workerSource = fs.readFileSync(path.resolve(__dirname, '../../assets/canvio-whisper-worker.js'), 'utf8');
assert('Whisper worker pins Transformers.js runtime', /@huggingface\/transformers@3\.8\.1/.test(workerSource));
assert('Whisper worker selects multilingual q8 model on CPU/WASM default', /Xenova\/whisper-tiny/.test(workerSource) && /dtype:\s*'q8'/.test(workerSource) && !/device:\s*'webgpu'/.test(workerSource));
assert('Whisper worker requests timestamped chunks', /return_timestamps:\s*true/.test(workerSource) && /chunk_length_s:\s*30/.test(workerSource));
assert('Whisper auto language leaves language unset for model detection', /message\.language\s*!==\s*'auto'/.test(workerSource) && /choice==='auto'\?'auto'/.test(videoScript));
assert('Whisper explicit Vietnamese and English choices are passed through', /options\.language\s*=\s*message\.language/.test(workerSource) && /choice==='english'\?'english'/.test(videoScript));
assert('Whisper worker does not transmit source audio to a remote ASR endpoint', !/fetch\s*\(/.test(workerSource) && !/XMLHttpRequest/.test(workerSource));
assert('P49 lineage and PhaseSuite are preserved in P49/P50 candidate', /version:'23\.3\.69-p55',base:'23\.3\.68-p54',candidate:'P55'/.test(html) && /version:'55\.0\.0'/.test(html) || /version:'23\.3\.64-p50',base:'23\.3\.63-p49',candidate:'P50'/.test(html) && /version:'50\.0\.0'/.test(html) || /version:'23\.3\.63-p49',base:'23\.3\.62-p48',candidate:'P49'/.test(html) && /version:'49\.0\.0'/.test(html));

console.log('P49 PASS: 35 assertions');
