'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'canvio-p63-p67.js'), 'utf8');
let clips = [
  { id: 'clip-a', name: 'A', type: 'video', track: 1, start: 0, duration: 3, motion: null },
  { id: 'clip-b', name: 'B', type: 'text', track: 3, start: 4, duration: 2 },
  { id: 'clip-c', name: 'C', type: 'image', track: 4, start: 7, duration: 2 }
];
let selected = 'clip-a';
let undoCount = 0, commitCount = 0, persistedState = null;
const trackLocked = { 1: false, 2: false, 3: false, 4: false };
function rippleList(list, a, b, skip) {
  const d = b - a, add = [], drop = [];
  list.slice().forEach(x => {
    if (x.track === skip || trackLocked[x.track] || x.locked) return;
    const e = x.start + x.duration;
    if (x.start >= b - .01) { x.start = Math.max(0, x.start - d); return; }
    if (e <= a + .01) return;
    if (x.start >= a - .01) {
      if (e <= b + .01) { drop.push(x); return; }
      x.duration = e - b; x.start = a; if (x.duration < .2) drop.push(x); return;
    }
    if (e <= b + .01) { x.duration = a - x.start; if (x.duration < .2) drop.push(x); return; }
    x.duration -= d;
  });
  return { add, drop };
}
const videoApi = {
  _state: () => ({ clips, selected, duration: 30, time: 3 }),
  commit: () => { commitCount++; persistedState = JSON.parse(JSON.stringify(clips)); return true; },
  isClipLocked: c => !!(c && (c.locked || trackLocked[c.track])),
  seek: v => { videoApi._state().time = v; },
  _pro: { rippleList, pushUndo: () => { undoCount++; } }
};
let assetRows = [];
const CV = {
  engines: { video: videoApi },
  assets: {
    list: () => assetRows,
    addBlob: async f => { assetRows.unshift({ id: 'asset-' + (assetRows.length + 1), name: f.name, mime: f.type, size: f.size, data: 'data:image/png;base64,AA==' }); },
    render: () => true
  },
  go: () => true,
  toast: () => {}
};
let layoutState = { pages: [{ id: 'p1', html: '<h1>CANVIO</h1><p>Print test</p>' }, { id: 'p2', html: '<p>Second page</p>' }], active: 0 };
const layoutApi = {
  snapshotState: () => JSON.stringify(layoutState),
  restoreState: raw => { layoutState = typeof raw === 'string' ? JSON.parse(raw) : raw; return true; }
};
const window = {
  CV, CVNativeEngines: { layout: layoutApi, vector: { render: () => true }, motionCut: { snapshotState: () => [], sendToVideoEngine: async () => 0 } },
  CVShapeAnim: { project: () => ({ layers: [] }), toVideo: async () => 0 },
  CVNativeSuite: {}, CANVIOPhaseSuite: { version: '62.0.0', tests: () => ({ previousPhase: true }) },
  CANVIO_BUILD: { version: '23.3.76-p62', candidate: 'P62', features: [] },
  crypto: { randomUUID: () => 'test-' + Math.random().toString(36).slice(2) },
  setTimeout: () => 0,
  LS: { set: (k, v) => { if (k === 'assets') assetRows = v; return true; } }
};
const document = {
  readyState: 'loading', title: 'CANVIO P62', fonts: { check: () => true },
  head: { appendChild: () => true },
  getElementById: () => null,
  createElement: tag => ({ tagName: tag.toUpperCase(), setAttribute() {}, appendChild() {}, textContent: '', style: {} }),
  addEventListener: () => true
};
const context = {
  window, document, CV, CVNativeEngines: window.CVNativeEngines, CVShapeAnim: window.CVShapeAnim,
  LS: window.LS, setTimeout: () => 0, clearTimeout: () => {}, console,
  Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Map, Promise,
  Uint8Array, Uint8ClampedArray, Error, RegExp, TextEncoder, btoa: s => Buffer.from(s, 'binary').toString('base64'),
  Event: function Event() {},
};
vm.createContext(context);
vm.runInContext(src, context, { timeout: 10000, filename: 'canvio-p63-p67.js' });

let passed = 0;
async function test(name, fn) { await fn(); passed++; process.stdout.write('PASS ' + name + '\n'); }

(async () => {
  await test('P63 canonical owner and explicit bridge boundaries', () => {
    const r = window.CANVIOUnifiedTimeline.inspect();
    assert.equal(r.canonicalOwner, 'CV.engines.video._state()');
    assert.equal(r.canonicalClipCount, 3);
    assert.equal(r.mutationBoundary.noSecondTimelineCreated, true);
    assert.equal(window.CANVIOUnifiedTimeline.validate().fail, 0);
  });

  await test('P64 ripple planner predicts canonical changes without mutation', () => {
    const before = JSON.stringify(clips);
    const plan = window.CANVIOAdvancedTimeline.planRippleDelete(3, 7);
    assert.equal(plan.ok, true);
    assert.equal(JSON.stringify(clips), before);
    assert.ok(plan.droppedIds.includes('clip-b'));
    assert.ok(plan.shifted >= 1);
  });

  await test('P64 locked clips block ripple before mutation', () => {
    trackLocked[3] = true;
    const before = JSON.stringify(clips);
    const plan = window.CANVIOAdvancedTimeline.planRippleDelete(3, 7);
    assert.equal(plan.ok, false);
    assert.equal(plan.reason, 'locked-clips-would-be-affected');
    assert.equal(JSON.stringify(clips), before);
    trackLocked[3] = false;
  });

  await test('P64 group metadata persists through canonical commit', () => {
    const r = window.CANVIOAdvancedTimeline.group(['clip-b', 'clip-c'], 'Test group');
    assert.equal(r.ok, true);
    assert.equal(window.CANVIOAdvancedTimeline.selectedGroup(r.groupId).length, 2);
    assert.ok(persistedState.some(x => x.groupId === r.groupId));
  });

  await test('P64 group move and duplicate are atomic on canonical clips', () => {
    const ids = window.CANVIOAdvancedTimeline.selectedGroup(clips.find(x => x.groupId).groupId);
    const before = clips.filter(x => ids.includes(x.id)).map(x => x.start);
    const move = window.CANVIOAdvancedTimeline.moveGroup(ids, 1);
    assert.equal(move.ok, true);
    assert.deepEqual(clips.filter(x => ids.includes(x.id)).map(x => x.start), before.map(x => x + 1));
    const dupe = window.CANVIOAdvancedTimeline.duplicateGroup(ids, 2);
    assert.equal(dupe.ok, true);
    assert.equal(dupe.duplicated, 2);
    assert.equal(new Set(dupe.ids).size, 2);
  });

  await test('P64 snap finds nearest canonical edge', () => {
    const r = window.CANVIOAdvancedTimeline.snap(5.02, 0.1);
    assert.equal(r.snapped, true);
    assert.equal(r.value, 5);
  });

  function frameAt(cx, cy, time) {
    const width = 80, height = 80, data = new Uint8ClampedArray(width * height * 4);
    for (let i = 3; i < data.length; i += 4) data[i] = 255;
    for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) {
      const n = ((cy + y) * width + cx + x) * 4;
      const value = (Math.abs(x * 37 + y * 71 + x * y * 13) * 19) % 256;
      data[n] = data[n + 1] = data[n + 2] = value;
    }
    return { width, height, data, time };
  }
  const tracking = window.CANVIOMotionTracking.trackFrames([
    frameAt(30, 30, 0), frameAt(33, 32, 1), frameAt(36, 34, 2)
  ], { x: 30, y: 30 }, { patchRadius: 5, searchRadius: 8, minConfidence: 0.55 });

  await test('P65 local tracker follows a textured point deterministically', () => {
    assert.equal(tracking.sampleCount, 3);
    assert.deepEqual([tracking.points[1].x, tracking.points[1].y], [33, 32]);
    assert.deepEqual([tracking.points[2].x, tracking.points[2].y], [36, 34]);
    assert.equal(tracking.machineLearning, false);
    assert.equal(tracking.upload, false);
  });

  await test('P65 rejects ambiguous flat patches instead of false tracking', () => {
    const blank = () => { const d = new Uint8ClampedArray(80 * 80 * 4); for (let i = 3; i < d.length; i += 4) d[i] = 255; return { width: 80, height: 80, data: d }; };
    assert.throws(() => window.CANVIOMotionTracking.trackFrames([blank(), blank()], { x: 30, y: 30 }, { patchRadius: 5, searchRadius: 8 }), /Mất điểm tracking/);
  });

  await test('P65 writes tracking keyframes only to selected unlocked canonical clip', () => {
    clips = [{ id: 'video-selected', name: 'Selected', type: 'video', track: 1, start: 0, duration: 3 }]; selected = 'video-selected';
    const r = window.CANVIOMotionTracking.applyToSelected(tracking, 'stabilize');
    assert.equal(r.ok, true);
    assert.ok(clips[0].motion.keyframes.length <= 8 && clips[0].motion.keyframes.length >= 2);
    trackLocked[1] = true;
    assert.equal(window.CANVIOMotionTracking.applyToSelected(tracking, 'follow').ok, false);
    trackLocked[1] = false;
  });

  await test('P66 prompt builder constrains and structures user brief', () => {
    const p = window.CANVIOAICreativeWorkflow.buildPrompt({ brief: 'Sản phẩm trà xanh', output: 'brand', ratio: '4:5' });
    assert.match(p, /CREATIVE ASSET BRIEF/);
    assert.match(p, /Sản phẩm trà xanh/);
    assert.throws(() => window.CANVIOAICreativeWorkflow.buildPrompt({ brief: ' ' }), /Nhập brief/);
  });

  await test('P66 SVG sanitizer strips active markup and remote references', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script><image href="https://bad.example/x.png"/><rect width="10" height="10"/></svg>';
    const safe = window.CANVIOAICreativeWorkflow.sanitizeSvg(svg);
    assert.doesNotMatch(safe, /script|onload|https:\/\//i);
    assert.match(safe, /<rect/);
  });

  await test('P66 imports output into existing Asset Library and persists provenance', async () => {
    const file = { name: 'generated.png', type: 'image/png', size: 123, lastModified: 0 };
    const r = await window.CANVIOAICreativeWorkflow.ingest(file, { license: 'commercial', source: 'User-selected provider' });
    assert.equal(r.ok, true);
    assert.equal(r.provenancePersisted, true);
    const saved = assetRows.find(x => x.id === r.asset.id);
    assert.equal(saved.license, 'commercial');
    assert.equal(saved.provenance.source, 'User-selected provider');
  });

  await test('P66 rejects incorrect Asset Library identity instead of selecting arbitrary item', async () => {
    const oldAdd = CV.assets.addBlob;
    CV.assets.addBlob = async () => {};
    await assert.rejects(() => window.CANVIOAICreativeWorkflow.ingest({ name: 'missing.png', type: 'image/png', size: 99 }), /chưa trả về chính xác/);
    CV.assets.addBlob = oldAdd;
  });

  await test('P67 master page apply is idempotent and uses Layout Foundry owner', () => {
    const one = window.CANVIOPrintProduction.applyMaster({ header: 'Brand <Studio>', footer: 'Version 1', folio: true });
    assert.equal(one.ok, true);
    assert.equal(layoutState.pages[0].html.match(/data-canvio-p67="header"/g).length, 1);
    window.CANVIOPrintProduction.applyMaster({ header: 'Brand <Studio>', footer: 'Version 1', folio: true });
    assert.equal(layoutState.pages[0].html.match(/data-canvio-p67="header"/g).length, 1);
    assert.match(layoutState.pages[0].html, /Brand &lt;Studio&gt;/);
  });

  await test('P67 typography persists CSS with explicit non-embedded font limitation', () => {
    const r = window.CANVIOPrintProduction.applyTypography({ fontFamily: 'Be Vietnam Pro', letterSpacing: 0.3, kerning: true, ligatures: true });
    assert.equal(r.ok, true);
    assert.equal(r.fontEmbedded, false);
    assert.match(layoutState.pages[0].html, /data-canvio-p67="typography"/);
    assert.equal(layoutState.pages[0].html.match(/data-canvio-p67="typography"/g).length, 1);
  });

  await test('P67 print preflight blocks script and active embed content', () => {
    const original = layoutState;
    layoutState = { pages: [{ id: 'unsafe', html: '<h1>OK</h1><script>alert(1)</script><iframe src="https://bad.example"></iframe>' }], active: 0 };
    const r = window.CANVIOPrintProduction.inspect({ format: 'A4', bleedMm: 3, safeMarginMm: 5 });
    assert.equal(r.status, 'BLOCKED');
    assert.equal(r.metrics.scriptTags, 1);
    assert.equal(r.metrics.activeEmbeds, 1);
    layoutState = original;
  });

  await test('P67 validates paper and bleed bounds', () => {
    assert.throws(() => window.CANVIOPrintProduction.inspect({ format: 'A0' }), /Khổ giấy/);
    assert.throws(() => window.CANVIOPrintProduction.inspect({ bleedMm: 99 }), /Bleed/);
  });

  await test('P63–P67 PhaseSuite flags and build marker are wired', () => {
    assert.equal(window.CANVIO_BUILD.version, '23.3.81-p67');
    assert.equal(window.CANVIOPhaseSuite.version, '67.0.0');
    const r = window.CANVIOPhaseSuite.tests();
    for (const k of ['p63UnifiedTimeline','p64AdvancedTimelineEditing','p65MotionTracking','p66AICreativeAssetWorkflow','p67PrintProduction']) assert.equal(r[k], true, k);
    assert.equal(window.CANVIOPhase2.report().releaseCertified, false);
  });

  process.stdout.write(`\nP63–P67 tests: ${passed}/${passed} PASS\n`);
})().catch(err => { console.error(err); process.exitCode = 1; });
