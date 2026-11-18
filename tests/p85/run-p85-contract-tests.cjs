'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'canvio-p85-studio.js'), 'utf8');
const entry = fs.readFileSync(path.join(root, 'scripts/p85-renderers.entry.mjs'), 'utf8');
const vendor = fs.readFileSync(path.join(root, 'scripts/vendor-p85-runtimes.sh'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const checks = {};
function test(name, fn) { fn(); checks[name] = true; console.log('PASS', name); }
const fakeWindow = { addEventListener() {}, crypto: null };
const fakeDocument = { readyState: 'loading', addEventListener() {}, getElementById() { return null; } };
vm.runInNewContext(source, { window: fakeWindow, document: fakeDocument, console, URL, Set, Map, Promise, Error, RegExp, Number, String, Array, Object, Math, Date, Uint8Array, ArrayBuffer, fetch() { throw new Error('Unexpected boot fetch'); }, navigator: { gpu: null }, setTimeout, clearTimeout });
const api = fakeWindow.CANVIOP85Suite;
test('P85 public owner exposes mount, inspection, runtime loaders and lifecycle', () => {
  assert.ok(api); assert.equal(api.version, '85.0.2');
  for (const fn of ['mount','inspect','tests','verifyFiles','ensureOpenCV','ensureRendererBundle','ensureDotLottie','ensureRive','startOpticalFlow','stopOpticalFlow','dispose']) assert.equal(typeof api[fn], 'function', fn);
});
test('P85 diagnostic version always matches the public runtime owner', () => {
  assert.equal(api.inspect().version, api.version);
});
test('P85 boot does not download runtime, model, worker or any remote asset', () => {
  const x = api.inspect(); assert.equal(x.manifestLoaded, false); assert.equal(x.rendererBundleLoaded, false); assert.equal(x.openCvLoaded, false); assert.equal(x.dotLottieLoaded, false); assert.equal(x.riveLoaded, false); assert.equal(x.verifiedAssets.length, 0); assert.equal(x.noCDN, true);
});
test('P85 uses local SHA-256 manifest and same-origin relative assets only', () => {
  assert.ok(source.includes('CANVIO_P85_VENDOR_MANIFEST')); assert.ok(source.includes('crypto.subtle.digest')); assert.ok(source.includes('cache: \'no-store\''));
  assert.ok(source.includes("new URL(ROOT + path, document.baseURI)")); assert.ok(!/https?:\/\//i.test(source));
});
test('P85 limits GLB, video and animation input size and type', () => {
  assert.ok(source.includes('250 * 1024 * 1024')); assert.ok(source.includes('50 * 1024 * 1024')); assert.ok(source.includes('video.duration > 180')); assert.ok(source.includes('video.videoWidth > 3840'));
});
test('P85 postprocessing is lazy and includes bloom, vignette, chromatic aberration', () => {
  for (const token of ['createPostProcessingPreview','BloomEffect','VignetteEffect','ChromaticAberrationEffect','OrbitControls','renderer?.dispose','composer?.dispose','renderer?.forceContextLoss']) assert.ok(entry.includes(token), token);
  assert.ok(source.includes("import('./' + ROOT + 'p85-renderers.js')"));
});
test('P85 path tracing is real WebGPU-only and fails closed without navigator.gpu', () => {
  assert.ok(entry.includes('WebGPUPathTracer')); assert.ok(entry.includes('THREEGPU.WebGPURenderer')); assert.ok(entry.includes('navigator.gpu')); assert.ok(entry.includes('tracer?.dispose?.()'));
  assert.ok(source.includes("if (!navigator.gpu) fail(")); assert.ok(source.includes('không giả lập bằng WebGL') || source.includes('Không giả lập bằng WebGL'));
});
test('P85 OpenCV Lucas–Kanade flow uses local runtime and releases Mats on normal and error paths', () => {
  for (const token of ['opencv/opencv.js','goodFeaturesToTrack','calcOpticalFlowPyrLK','cvtColor','clearTracking','t.prevGray.delete()','t.windowSize','t.criteria','finally { try { image.delete(); } catch (_) {} }','if (gray && typeof gray.delete === \'function\')']) assert.ok(source.includes(token), token);
});
test('P85 dotLottie and Rive are local players with exact WASM URL configuration', () => {
  for (const token of ['dotlottie/index.js','dotlottie/dotlottie-player.wasm','DotLottie.setWasmUrl','DotLottie.preload','rive/rive.js','rive/rive.wasm','RuntimeLoader.setWasmUrl','RuntimeLoader.awaitInstance','setWasmFallbackUrl(null)','playerNotAuthoring']) assert.ok(source.includes(token), token);
  assert.ok(vendor.includes('DOTLOTTIE_VERSION="0.83.2"')); assert.ok(vendor.includes('RIVE_VERSION="2.51.0"') && vendor.includes('ESBUILD_VERSION="0.28.2"'));
});
test('P85 vendor script pins every package and keeps license notices in package', () => {
  for (const token of ['three@','three-mesh-bvh@','three-gpu-pathtracer@','postprocessing@','@techstark/opencv-js@','@lottiefiles/dotlottie-web@','@rive-app/canvas@','esbuild@','P85-VENDOR-MANIFEST.json','sha256','P85-VENDOR-NOTICE.md','licenses/']) assert.ok(vendor.includes(token), token);
});
test('P85 is embedded byte-for-byte in the current app index and has a single runtime panel owner', () => {
  const marker = '<script id="canvio-p85-module">'; assert.ok(html.includes(marker));
  const inline = html.split(marker)[1].split('</script>')[0].trim();
  assert.equal(inline, source.trim());
  assert.equal((html.match(/id="canvio-p85-module"/g) || []).length, 1);
});
test('P85 reuses canonical P72 GLB input and optical flow has no undefined point accumulator or seek deadlock', () => {
  assert.ok(source.includes("var input = byId('cv72-file')"));
  assert.ok(!source.includes("byId('p85-glb')"));
  assert.ok(!source.includes('kept.push('));
  assert.ok(source.includes("video.addEventListener('loadeddata', onData"));
  assert.ok(!source.includes("video.onseeked = resolve"));
});
test('P85 does not create a second project store, asset library or video timeline', () => {
  assert.ok(source.includes('usesExistingAssetLibrary')); assert.ok(source.includes('noSecondTimelineOrAssetStore'));
  assert.ok(source.includes("cv.assets.addBlob")); assert.ok(source.includes("video.importFiles([blob])"));
});
const report = { suite: 'CANVIO_P85_RUNTIME_CONTRACT', candidate: '23.3.108-p85-studio-r2', passed: Object.keys(checks).length, total: Object.keys(checks).length, checks, vendorRuntimePresentInLocalPackage: fs.existsSync(path.join(root, 'assets/p85/P85-VENDOR-MANIFEST.json')), realPathTracingExecuted: false, realOpenCVTrackingExecuted: false, dotLottiePlaybackExecuted: false, rivePlaybackExecuted: false, note: 'P85 runtime entry/source contracts and user-triggered lazy local loading are verified. Pinned npm runtime assets are provisioned by scripts/vendor-p85-runtimes.sh in hosted CI; local package installation is blocked by container DNS/network.' };
fs.writeFileSync(path.join(__dirname, 'p85-contract-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
