'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const sourcePath = process.argv[2] || path.resolve(__dirname, '../../index.html');
const html = fs.readFileSync(sourcePath, 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m => m[1]);
const videoScript = scripts.find(s => s.includes('function vTrackSettingsClean') && s.includes('function vVttParse'));
if (!videoScript) throw new Error('Could not locate the canonical Video Engine script block.');

function assert(name, condition, detail = '') {
  if (!condition) throw new Error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  console.log(`PASS ${name}`);
}

const trackStart = videoScript.indexOf('var videoState={clips:');
const trackEnd = videoScript.indexOf('function vInit()', trackStart);
if (trackStart < 0 || trackEnd < 0) throw new Error('Video track state/helpers could not be located.');
const trackCode = videoScript.slice(trackStart, trackEnd);
const renderStart = videoScript.indexOf('function vTransBars(');
const renderEnd = videoScript.indexOf('function vSelect(', renderStart);
if (renderStart < 0 || renderEnd < 0) throw new Error('Video track renderer could not be located.');
const renderCode = videoScript.slice(renderStart, renderEnd);
const vttStart = videoScript.indexOf('function vVttTime(');
const vttEnd = videoScript.indexOf('function vDownloadCaption(', vttStart);
if (vttStart < 0 || vttEnd < 0) throw new Error('WebVTT helpers could not be located.');
const vttCode = videoScript.slice(vttStart, vttEnd);

const elements = {
  vtTimeline: { innerHTML: '' },
  vtDuration: { textContent: '' },
  vtScrub: { max: 0, value: 0 }
};
const ctx = {
  console,
  Set,
  Number,
  String,
  Math,
  Date,
  document: { getElementById: id => elements[id] || null },
  window: {},
  toast: () => {},
  vPushUndo: () => { ctx.undoCount++; },
  vSave: () => { ctx.saveCount++; },
  vDraw: () => { ctx.drawCount++; },
  vRender: () => {},
  undoCount: 0,
  saveCount: 0,
  drawCount: 0
};
vm.createContext(ctx);
vm.runInContext(`${trackCode}\n${renderCode}\n${vttCode}\nglobalThis.__p48={videoState,vTrackSettingsClean,vTrackState,vTrackLocked,vClipLocked,vClipVisible,vClipAudible,vToggleTrack,vTrackTest,vRender,vVttParse,vVttFmt,vVttEscape,vVttTests};`, ctx);
const api = ctx.__p48;

const trackTests = api.vTrackTest();
assert('track settings strict booleans', trackTests.trackSettingsStrict);
assert('track lock inherited by clips', trackTests.trackLockSemantics);
assert('track visibility inherited by clips', trackTests.trackVisibilitySemantics);
assert('audio mute inherited by audio clip', trackTests.audioMuteSemantics);

api.videoState.clips = [{ id: 'overlay-fixture', type: 'image', track: 4, start: 0, duration: 2, name: 'Overlay fixture' }];
api.videoState.duration = 30;
api.videoState.time = 0;
api.videoState.tracks = api.vTrackSettingsClean();
api.vRender();
assert('timeline renders overlay track', elements.vtTimeline.innerHTML.includes('data-vt-track="4"'));
assert('timeline exposes per-track lock controls', elements.vtTimeline.innerHTML.includes("toggleTrack(4,'locked')"));
assert('timeline exposes visibility controls', elements.vtTimeline.innerHTML.includes("toggleTrack(4,'hidden')"));
assert('timeline exposes audio mute control', elements.vtTimeline.innerHTML.includes("toggleTrack(2,'muted')"));
const toggled = api.vToggleTrack(4, 'locked');
assert('track lock toggle succeeds', toggled && api.vTrackLocked(4));
assert('track toggle creates undo/save/render effects', ctx.undoCount === 1 && ctx.saveCount === 1 && ctx.drawCount === 1);
assert('locked track remains toggleable for unlock', api.vToggleTrack(4, 'locked') && !api.vTrackLocked(4));
assert('invalid track/action rejected', api.vToggleTrack(9, 'locked') === false && api.vToggleTrack(2, 'unknown') === false);

const vttTests = api.vVttTests();
assert('WebVTT header required', vttTests.webvttHeaderRequired);
assert('WebVTT cue ID/settings and multiline text', vttTests.webvttCueSettingsAndId);
assert('WebVTT malformed and reversed cues rejected', vttTests.webvttMalformedCuesRejected);
assert('WebVTT timestamps formatted correctly', vttTests.webvttTimeFormat);
assert('WebVTT cue text is escaped for export', vttTests.webvttTextEscaping);
assert('WebVTT invalid minute/second fields rejected', vttTests.webvttInvalidMinuteRejected);

assert('track settings included in timeline save', /tracks:vTrackSettingsClean\(videoState\.tracks\)/.test(videoScript));
assert('track settings included in snapshot and restore', /videoState\.tracks=vTrackSettingsClean\(x\.tracks\)/.test(videoScript) && /tracks:vTrackSettingsClean\(videoState\.tracks\)/.test(videoScript));
assert('audio mixer guards inherited track locks', (html.match(/v\.isClipLocked\(target\)/g) || []).length >= 4);
assert('Audio Studio calls the correct videoApi guard', /function applyTrim\(\)[\s\S]{0,260}videoApi\(\)\.isClipLocked\(c\)/.test(html));
assert('track state exposed for other Video Engine tools', /trackState:function\(track\)\{return Object\.assign\(\{\},vTrackState\(track\)\)\}/.test(videoScript));
assert('Audio Studio preview respects hidden/muted audio track', /function previewAudio\(\)[\s\S]{0,300}trackCfg\.hidden\|\|trackCfg\.muted/.test(html));
assert('WebVTT import blocks locked caption track', /function vVttImport\(\)[\s\S]{0,400}vTrackLocked\(3\)/.test(videoScript));
assert('P48 lineage remains in the P49/P50 candidate chain', /version:'23\.3\.69-p55',base:'23\.3\.68-p54',candidate:'P55'/.test(html) || /version:'23\.3\.64-p50',base:'23\.3\.63-p49',candidate:'P50'/.test(html) || /version:'23\.3\.63-p49',base:'23\.3\.62-p48',candidate:'P49'/.test(html));
assert('P48 PhaseSuite exposes runtime feature checks in successor candidate', /version:'55\.0\.0',init:init,tests:function\(\)[\s\S]{0,900}videoTrackControls/.test(html) || /version:'50\.0\.0',init:init,tests:function\(\)[\s\S]{0,700}videoTrackControls/.test(html) || /version:'49\.0\.0',init:init,tests:function\(\)[\s\S]{0,600}videoTrackControls/.test(html));

console.log(`P48 PASS: 26 assertions`);
