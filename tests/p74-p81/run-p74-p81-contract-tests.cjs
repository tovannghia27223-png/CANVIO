'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const nodeCrypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'canvio-p74-p81-three-viewer.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const vendor = fs.readFileSync(path.join(root, 'scripts/vendor-three-r187.sh'), 'utf8');
const checks = {};
function test(name, fn) { try { fn(); checks[name] = true; } catch (error) { checks[name] = false; console.error('FAIL', name, error.stack || error); } }
const asyncTests = [];
function testAsync(name, fn) { asyncTests.push((async () => { try { await fn(); checks[name] = true; } catch (error) { checks[name] = false; console.error('FAIL', name, error.stack || error); } })()); }
function makeGlb(json) {
  const jsonBytes = Buffer.from(JSON.stringify(json), 'utf8');
  const pad = (4 - (jsonBytes.length % 4)) % 4;
  const jsonPadded = Buffer.concat([jsonBytes, Buffer.alloc(pad, 0x20)]);
  const total = 12 + 8 + jsonPadded.length;
  const out = Buffer.alloc(total);
  out.writeUInt32LE(0x46546c67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(total, 8);
  out.writeUInt32LE(jsonPadded.length, 12); out.writeUInt32LE(0x4e4f534a, 16); jsonPadded.copy(out, 20);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}
const fakeWindow = { addEventListener() {}, WebGL2RenderingContext: function WebGL2RenderingContext() {} };
const fakeDocument = { readyState: 'complete', getElementById(id) { return id === 'cv72-file' ? {} : null; } };
const sandbox = { window: fakeWindow, document: fakeDocument, console, URL, TextDecoder, ArrayBuffer, DataView, Uint8Array, Map, Promise, fetch: async () => { throw new Error('Network must not occur in contract test'); }, setTimeout, clearTimeout };
vm.runInNewContext(source, sandbox, { filename: 'canvio-p74-p81-three-viewer.js' });
const viewer = fakeWindow.CANVIOThreeGLBViewerP74;
assert.ok(viewer, 'P74 module must register its public owner');
const baseJson = { asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [] }], buffers: [{ byteLength: 0 }] };

test('P74 owner and pinned Three.js r187 commit are exposed', () => {
  assert.equal(viewer.version, '74.0.0');
  assert.equal(viewer.vendorCommit, '7e89746a687bb88271253698fa108b1dd59825d0');
});
test('P74 has bounded self-contained GLB 2.0 input preflight', () => {
  assert.equal(viewer.limits.bytes, 250 * 1024 * 1024);
  assert.equal(viewer.inspectGlbBuffer(makeGlb(baseJson)).json.asset.version, '2.0');
});
test('P74 rejects invalid GLB magic', () => {
  const b = Buffer.from(makeGlb(baseJson)); b.writeUInt32LE(0x12345678, 0);
  assert.throws(() => viewer.inspectGlbBuffer(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)), /magic/i);
});
test('P74 rejects unsupported GLB container version', () => {
  const b = Buffer.from(makeGlb(baseJson)); b.writeUInt32LE(1, 4);
  assert.throws(() => viewer.inspectGlbBuffer(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)), /GLB 2.0/i);
});
test('P74 rejects a mismatched GLB total length', () => {
  const b = Buffer.from(makeGlb(baseJson)); b.writeUInt32LE(b.length + 4, 8);
  assert.throws(() => viewer.inspectGlbBuffer(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)), /length/i);
});
test('P74 rejects external buffer URIs before loader execution', () => {
  const b = makeGlb({ ...baseJson, buffers: [{ byteLength: 10, uri: 'https://example.invalid/model.bin' }] });
  assert.throws(() => viewer.inspectGlbBuffer(b), /tệp ngoài/i);
});
test('P74 rejects external image URIs before loader execution', () => {
  const b = makeGlb({ ...baseJson, images: [{ uri: 'https://example.invalid/image.png' }] });
  assert.throws(() => viewer.inspectGlbBuffer(b), /tệp ngoài/i);
});
test('P74 refuses malformed and truncated inputs', () => {
  assert.throws(() => viewer.inspectGlbBuffer(new ArrayBuffer(8)), /kích thước/i);
  assert.throws(() => viewer.inspectGlbBuffer(new ArrayBuffer(21)), /magic/i);
});
test('P74 boot is lazy and reuses P72 file input', () => {
  const checks = viewer.tests();
  assert.equal(checks.reusesP72FileInput, true);
  assert.equal(checks.vendorManifestVerified, false);
  assert.equal(checks.threeModuleLoaded, false);
  assert.equal(checks.dracoModuleLoaded, false);
  assert.equal(checks.meshoptDecoderReady, false);
  assert.equal(checks.ktx2ModuleLoaded, false);
});
test('P74 local module graph and decoder adapters are wired without CDN', () => {
  const checks = viewer.tests();
  assert.equal(checks.noCDN, true);
  assert.equal(checks.allThreeImportsUseLocalRelativePaths, true);
  assert.equal(checks.decoderHooksWired, true);
  assert.equal(checks.vendorManifestRequired, true);
});
test('P81 vendor script pins upstream commit and binary decoder assets', () => {
  assert.ok(vendor.includes('7e89746a687bb88271253698fa108b1dd59825d0'));
  for (const token of ['draco_decoder.wasm', 'meshopt_decoder.module.js', 'basis_transcoder.wasm', 'THREE-VENDOR-MANIFEST.json']) assert.ok(vendor.includes(token), token);
  assert.ok(vendor.includes('sparse-checkout reapply'));
});
test('P81 runtime manifest requires files and SHA-256 hashes', () => {
  assert.ok(source.includes("manifest.format !== 'CANVIO_THREE_VENDOR_MANIFEST'"));
  assert.ok(source.includes("/^[a-f0-9]{64}$/"));
  assert.ok(source.includes('verifyVendorManifest()'));
});
test('P74/P81 resource cleanup, animation and shared-owner boundaries remain present', () => {
  const checks = viewer.tests();
  assert.equal(checks.animationMixer, false, 'animation runtime correctly remains unloaded before explicit open');
  assert.equal(checks.disposalControls, true);
  assert.equal(checks.noSecondAssetStore, true);
  assert.equal(checks.noProjectMutation, true);
});
test('P74 runtime is user-triggered; boot contains no external script tags', () => {
  assert.ok(source.includes("$('cv74-load').addEventListener('click'"));
  const markupOnly = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '<script></script>');
  assert.equal((markupOnly.match(/<script\b[^>]*\bsrc=/gi) || []).length, 0);
  assert.ok(source.includes("import('./assets/three/build/three.module.js')"));
});
test('P81 addon import rewrite remains relative to local Three.js core', () => {
  assert.ok(vendor.includes("..\\/..\\/..\\/build\\/three.module.js"));
});

const requiredVendorPaths = [
  'build/three.module.js', 'build/three.core.js',
  'examples/jsm/loaders/GLTFLoader.js', 'examples/jsm/loaders/DRACOLoader.js',
  'examples/jsm/loaders/KTX2Loader.js', 'examples/jsm/controls/OrbitControls.js',
  'examples/jsm/libs/meshopt_decoder.module.js',
  'examples/jsm/libs/ktx-parse.module.js', 'examples/jsm/libs/zstddec.module.js',
  'examples/jsm/utils/BufferGeometryUtils.js', 'examples/jsm/utils/SkeletonUtils.js',
  'examples/jsm/utils/WorkerPool.js', 'examples/jsm/math/ColorSpaces.js',
  'examples/jsm/libs/draco/gltf/draco_decoder.js', 'examples/jsm/libs/draco/gltf/draco_decoder.wasm',
  'examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js',
  'examples/jsm/libs/basis/basis_transcoder.js', 'examples/jsm/libs/basis/basis_transcoder.wasm',
  'licenses/THREE-LICENSE-MIT.txt', 'licenses/DRACO-LICENSE-APACHE-2.0.txt',
  'licenses/BASIS-UNIVERSAL-LICENSE-APACHE-2.0.txt', 'licenses/MESHOPT-LICENSE-MIT.txt'
];
function isolatedViewer(fetchImpl) {
  const w = { addEventListener() {}, WebGL2RenderingContext: function WebGL2RenderingContext() {}, crypto: nodeCrypto.webcrypto };
  const d = { readyState: 'complete', baseURI: 'https://canvio.test/', getElementById(id) { return id === 'cv72-file' ? {} : null; } };
  const box = { window: w, document: d, console, URL, TextDecoder, ArrayBuffer, DataView, Uint8Array, Map, Promise, fetch: fetchImpl, setTimeout, clearTimeout };
  vm.runInNewContext(source, box, { filename: 'canvio-p74-p81-three-viewer-isolated.js' });
  return w.CANVIOThreeGLBViewerP74;
}
function makeVendorFixture(overrides = {}) {
  const files = new Map();
  for (const rel of requiredVendorPaths) files.set(rel, Buffer.from('fixture:' + rel));
  for (const [rel, buf] of Object.entries(overrides)) files.set(rel, Buffer.from(buf));
  const entries = [...files].map(([rel, buf]) => ({ path: rel, bytes: buf.length, sha256: nodeCrypto.createHash('sha256').update(buf).digest('hex') }));
  return { files, manifest: { format: 'CANVIO_THREE_VENDOR_MANIFEST', revision: 'r187', commit: '7e89746a687bb88271253698fa108b1dd59825d0', files: entries } };
}
function makeFetch(fixture, corruptPath) {
  return async (url) => {
    const parsed = new URL(String(url));
    if (parsed.pathname.endsWith('/THREE-VENDOR-MANIFEST.json')) return { ok: true, status: 200, json: async () => fixture.manifest };
    const rel = parsed.pathname.replace(/^\/assets\/three\//, '');
    let bytes = fixture.files.get(rel);
    if (!bytes) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
    if (rel === corruptPath) { bytes = Buffer.from(bytes); bytes[0] ^= 0xff; }
    const copy = Buffer.from(bytes);
    return { ok: true, status: 200, arrayBuffer: async () => copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength) };
  };
}
testAsync('P81 verifies actual same-origin runtime file bytes against SHA-256 manifest', async () => {
  const fixture = makeVendorFixture(); let requests = 0;
  const fetchImpl = async (...args) => { requests++; return makeFetch(fixture)(...args); };
  const viewer = isolatedViewer(fetchImpl);
  const result = await viewer.verifyVendorManifest();
  assert.equal(result.commit, '7e89746a687bb88271253698fa108b1dd59825d0');
  assert.equal(result.verifiedFiles, requiredVendorPaths.length);
  assert.ok(result.verifiedBytes > 0);
  assert.equal(viewer.tests().vendorManifestVerified, true);
  const afterFirst = requests;
  await viewer.verifyVendorManifest();
  assert.equal(requests, afterFirst, 'verified manifest is cached for this runtime session');
});
testAsync('P81 rejects a runtime asset whose actual bytes do not match its SHA-256', async () => {
  const fixture = makeVendorFixture();
  const viewer = isolatedViewer(makeFetch(fixture, requiredVendorPaths[0]));
  await assert.rejects(() => viewer.verifyVendorManifest(), /SHA-256.*không khớp/i);
  assert.equal(viewer.tests().vendorManifestVerified, false);
});
testAsync('P81 rejects a vendor manifest from an unpinned Three.js commit', async () => {
  const fixture = makeVendorFixture(); fixture.manifest.commit = '0000000000000000000000000000000000000000';
  const viewer = isolatedViewer(makeFetch(fixture));
  await assert.rejects(() => viewer.verifyVendorManifest(), /không khớp revision\/commit/i);
  assert.equal(viewer.tests().vendorManifestVerified, false);
});

(async () => {
  await Promise.all(asyncTests);
  const passed = Object.values(checks).filter(Boolean).length;
  const report = { suite: 'CANVIO_P74_P81_LOCAL_THREE_R187_CONTRACT', candidate: '23.3.108-p85-studio-r2', passed, total: Object.keys(checks).length, checks, vendorRuntimePresentInLocalPackage: fs.existsSync(path.join(root, 'assets/three/THREE-VENDOR-MANIFEST.json')), physicalGpuExecuted: false, compressedFixtureDecodeExecuted: false, note: 'Static contract, GLB preflight and mocked byte-integrity verification. Hosted workflow provisions runtime assets and executes software-WebGL uncompressed GLB smoke; compressed Draco/Meshopt/KTX2 fixture decode and physical GPU remain separate gates.' };
  fs.writeFileSync(path.join(__dirname, 'p74-p81-contract-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (passed !== Object.keys(checks).length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
