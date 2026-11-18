'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', '..', 'canvio-p68-p70.js'), 'utf8');
let now = 0;
const raf = [];
const allNodes = [
  { tagName: 'CANVAS', width: 100, height: 50 },
  { tagName: 'IMG', naturalWidth: 200, naturalHeight: 100, complete: true },
  { tagName: 'VIDEO', videoWidth: 320, videoHeight: 180, paused: false, readyState: 3 },
  { tagName: 'AUDIO', paused: true, readyState: 4 }
];
const root = { querySelectorAll: selector => selector === '*' ? allNodes : allNodes.filter(n => n.tagName.toLowerCase() === selector) };
const document = {
  readyState: 'loading', title: 'CANVIO P67', body: root, documentElement: root,
  head: { appendChild() {} }, getElementById() { return null; }, createElement() { return { setAttribute() {}, appendChild() {} }; }, addEventListener() {}
};
const window = {
  CANVIO_BUILD: { version: '23.3.81-p67', candidate: 'P67', features: [] },
  CANVIOPhaseSuite: { version: '67.0.0', tests: () => ({ inherited: true }) },
  CANVIOPhase1ReleaseGate: { run: () => ({ status: 'BLOCKED', releaseCertified: false }) },
  CANVIOPhase2: { report: () => ({ status: 'PENDING', releaseCertified: false, summary: { pass: 1, fail: 0 } }) },
  crypto: { randomUUID: () => 'test-id' }
};
const context = {
  window, document, setTimeout() {}, clearTimeout() {}, console, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Map, Promise,
  Uint8Array, Uint8ClampedArray, Blob, Error, RegExp, TextEncoder, performance: { now: () => now, getEntriesByType: () => [{ transferSize: 100, decodedBodySize: 120 }] },
  requestAnimationFrame: callback => { raf.push(callback); return raf.length; }
};
vm.createContext(context);
vm.runInContext(source, context, { timeout: 10000, filename: 'canvio-p68-p70.js' });
let passed = 0;
async function test(name, fn) { await fn(); passed++; process.stdout.write('PASS ' + name + '\n'); }
const OBJ = [
  '# tiny quad fixture',
  'o panel',
  'v -1 -1 0',
  'v 1 -1 0',
  'v 1 1 0',
  'v -1 1 0',
  'vt 0 0',
  'vn 0 0 1',
  'usemtl ignored',
  'f 1/1/1 2/1/1 3/1/1 4/1/1'
].join('\n');

(async () => {
  const P68 = window.CANVIOOffline3D, P69 = window.CANVIOSystemOptimizer, P70 = window.CANVIOStableRelease;
  assert.ok(P68 && P69 && P70, 'P68/P69/P70 APIs must be exposed');

  await test('P68 parses OBJ polygons and triangulates to bounded normalized geometry', () => {
    const mesh = P68.parseOBJ(OBJ);
    assert.equal(mesh.vertexCount, 4);
    assert.equal(mesh.faceCount, 1);
    assert.equal(mesh.triangleCount, 2);
    assert.equal(mesh.positions.length, 18);
    assert.equal(mesh.normals.length, 18);
    assert.ok(mesh.positions.every(n => Number.isFinite(n) && Math.abs(n) <= 1));
    assert.equal(mesh.materialsIncluded, false);
  });

  await test('P68 supports negative OBJ indices and polygon fan triangulation', () => {
    const negative = OBJ.split('\n').filter(x => !x.startsWith('f ')).concat('f -4 -3 -2 -1').join('\n');
    assert.equal(P68.parseOBJ(negative).triangleCount, 2);
  });

  await test('P68 rejects missing, zero and out-of-range face indices', () => {
    assert.throws(() => P68.parseOBJ(''), /trống/);
    assert.throws(() => P68.parseOBJ('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 0 3'), /không hợp lệ/);
    assert.throws(() => P68.parseOBJ('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 4'), /vượt danh sách/);
  });

  await test('P68 rejects malformed/non-finite and degenerate geometry', () => {
    assert.throws(() => P68.parseOBJ('v 0 0 0\nv NaN 1 0\nv 0 1 0\nf 1 2 3'), /không hữu hạn/);
    assert.throws(() => P68.parseOBJ('v 0 0 0\nv 1 0 0\nv 2 0 0\nf 1 2 3'), /mesh tam giác hợp lệ/);
  });

  await test('P68 caps source text before parse', () => {
    assert.throws(() => P68.parseOBJ('x'.repeat(P68.limits.sourceChars + 1)), /5 MiB/);
  });

  let packaged;
  await test('P68 rejects geometry tampering and enforces the triangle ceiling', () => {
    const mesh = P68.parseOBJ(OBJ); mesh.normals[0] = Infinity;
    assert.throws(() => P68.buildOfflineHTML(mesh), /normal không hợp lệ/);
    const oversized = ['v 0 0 0', 'v 1 0 0', 'v 0 1 0'];
    for (let i = 0; i < P68.limits.triangles + 1; i++) oversized.push('f 1 2 3');
    assert.throws(() => P68.parseOBJ(oversized.join('\n')), /12.000 tam giác/);
  });

  await test('P68 builds a self-contained offline HTML package with embedded geometry', () => {
    packaged = P68.buildFromOBJ(OBJ, { title: 'Product OBJ' });
    assert.equal(packaged.offline, true);
    assert.equal(packaged.mesh.triangleCount, 2);
    assert.equal(packaged.preflight.fail, 0);
    assert.equal(P68.inspectPackage(packaged.html).status, 'PASS');
    assert.match(packaged.html, /connect-src 'none'/);
    assert.match(packaged.html, /mesh-data/);
    assert.doesNotMatch(packaged.html, /<script\s+[^>]*src=/i);
    assert.doesNotMatch(packaged.html, /<link\s+[^>]*href=/i);
    assert.doesNotMatch(packaged.html, /\bfetch\s*\(/);
  });

  await test('P68 viewer JavaScript parses and does not leak title markup', () => {
    const hostile = P68.buildFromOBJ(OBJ, { title: '<img src=x onerror=alert(1)>' });
    const scripts = [...hostile.html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
    assert.equal(scripts.length, 1);
    new vm.Script(scripts[0][1], { filename: 'offline-viewer.js' });
    assert.doesNotMatch(hostile.html.slice(0, hostile.html.indexOf('id="mesh-data"')), /<img src=x/i);
  });

  await test('P68 package inspector detects external runtime/network dependencies', () => {
    const bad = packaged.html.replace('</head>', '<script src="https://example.invalid/viewer.js"></script></head>');
    assert.equal(P68.inspectPackage(bad).status, 'FAIL');
    assert.ok(P68.inspectPackage(bad).checks.some(x => x.id === 'no-external-script' && !x.ok));
  });

  await test('P69 resource audit is read-only and estimates canvas/image/video surfaces', () => {
    const r = P69.inspect({ root });
    assert.equal(r.readOnly, true);
    assert.equal(r.scannedNodes, 4);
    assert.equal(r.canvases.length, 1);
    assert.equal(r.totals.canvasBackingBytes, 100 * 50 * 4);
    assert.equal(r.totals.imageDecodedEstimateBytes, 200 * 100 * 4);
    assert.equal(r.totals.videoSurfaceEstimateBytes, 320 * 180 * 4);
    assert.equal(r.resources.transferBytes, 100);
    assert.equal(r.noProjectMutation, true);
  });

  await test('P69 frame sampler computes a bounded frame-rate sample', async () => {
    now = 0; raf.length = 0;
    const promise = P69.sampleFrames(250);
    let steps = 0;
    while (raf.length && steps < 30) { const cb = raf.shift(); now += 16; cb(now); steps++; }
    const r = await promise;
    assert.equal(r.supported, true);
    assert.ok(r.averageFps > 50 && r.averageFps < 70);
    assert.equal(r.noProjectMutation, true);
  });

  await test('P69 safe recommendations never propose deleting project data', () => {
    const r = P69.recommendations(P69.inspect({ root }));
    assert.ok(r.length >= 1);
    assert.ok(r.every(x => !/delete|xóa|clear storage|remove media/i.test(x.action)));
  });

  await test('P70 1.0 gate includes all fourteen manual acceptance gates', () => {
    const r = P70.inspect();
    assert.equal(r.candidate, 'P70');
    assert.equal(r.manualGates.length, 14);
    assert.equal(r.gateSummary.pending, 14);
    assert.equal(r.gateSummary.passed, 0);
  });

  await test('P70 never self-certifies from source or synthetic tests', () => {
    const r = P70.inspect();
    assert.equal(r.releaseCertified, false);
    assert.equal(r.status, 'BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE');
    assert.equal(P70.tests().noSelfCertification, true);
  });

  await test('P70 includes prior Phase 1 and Phase 2 reports without upgrading their status', () => {
    const r = P70.inspect();
    assert.equal(r.inheritedPhase1.status, 'AVAILABLE_ASYNC_GATE_NOT_AUTORUN');
    assert.equal(r.inheritedPhase2.status, 'PENDING');
    assert.equal(r.inheritedPhase1.releaseCertified, false);
    assert.equal(r.inheritedPhase2.releaseCertified, false);
  });

  await test('P68–P70 are wired to build marker and PhaseSuite without creating project owners', () => {
    assert.equal(window.CANVIO_BUILD.version, '23.3.84-p70');
    assert.equal(window.CANVIO_BUILD.candidate, 'P70');
    assert.equal(window.CANVIOPhase3.version, '70.0.0');
    const phase = window.CANVIOPhase3.tests();
    assert.equal(phase.noSecondTimeline, true);
    assert.equal(phase.noNewProjectDatabase, true);
    const suite = window.CANVIOPhaseSuite.tests();
    assert.equal(suite.p68Offline3DPackaging, true);
    assert.equal(suite.p69SystemOptimization, true);
    assert.equal(suite.p70StableReleaseGate, true);
  });

  process.stdout.write('\nP68–P70 tests: ' + passed + '/16 PASS\n');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
