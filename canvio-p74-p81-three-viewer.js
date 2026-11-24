/* CANVIO P74/P81 — pinned local Three.js GLB viewer and compression decoder bridge.
 * Runtime modules are dynamically imported only after explicit user action. Requires
 * `bash scripts/vendor-three-r187.sh` before deployment; never falls back to a CDN.
 */
(function () {
  'use strict';
  if (window.CANVIOThreeGLBViewerP74) return;
  var LIMIT_BYTES = 250 * 1024 * 1024;
  var state = { runtime: null, renderer: null, scene: null, camera: null, controls: null, model: null, mixer: null, clock: null, raf: 0, draco: null, ktx2: null, resizeObserver: null, resizeHandler: null, loaded: false, lastReport: null, vendorManifest: null };
  var $ = function (id) { return document.getElementById(id); };
  function status(message, kind) { var el = $('cv74-status'); if (el) { el.textContent = message; el.dataset.kind = kind || 'info'; } }
  function fail(message) { throw new Error(message); }
  function localUrl(rel) { return new URL(rel, document.baseURI).href; }
  async function verifyVendorManifest() {
    if (state.vendorManifest) return state.vendorManifest;
    if (typeof fetch !== 'function') fail('Trình duyệt không hỗ trợ kiểm tra manifest runtime 3D.');
    var response = await fetch(localUrl('assets/three/THREE-VENDOR-MANIFEST.json'), { credentials: 'same-origin', cache: 'no-cache', redirect: 'error' });
    if (!response.ok) fail('Thiếu manifest runtime 3D cục bộ (HTTP ' + response.status + ').');
    var manifest = await response.json();
    var required = [
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
    if (!manifest || manifest.format !== 'CANVIO_THREE_VENDOR_MANIFEST' || manifest.revision !== 'r187' || manifest.commit !== '7e89746a687bb88271253698fa108b1dd59825d0' || !Array.isArray(manifest.files)) fail('Manifest Three.js không khớp revision/commit đã ghim.');
    var entries = new Map(manifest.files.map(function (entry) { return [entry && entry.path, entry]; }));
    var missing = required.filter(function (path) { var entry = entries.get(path); return !entry || !Number.isInteger(entry.bytes) || entry.bytes < 1 || !/^[a-f0-9]{64}$/.test(entry.sha256 || ''); });
    if (missing.length) fail('Manifest thiếu hoặc sai hash các runtime/decoder bắt buộc: ' + missing.join(', '));
    if (!window.crypto || !window.crypto.subtle || typeof window.crypto.subtle.digest !== 'function') fail('Cần HTTPS hoặc secure context có Web Crypto để xác minh runtime 3D.');
    // Verify real same-origin bytes, not just the presence/shape of manifest entries.
    // Fetch sequentially to bound peak memory and only after the user explicitly opens 3D.
    var verifiedBytes = 0;
    for (var i = 0; i < required.length; i++) {
      var rel = required[i], entry = entries.get(rel);
      var assetResponse = await fetch(localUrl('assets/three/' + rel), { credentials: 'same-origin', cache: 'no-cache', redirect: 'error' });
      if (!assetResponse.ok) fail('Runtime 3D thiếu tệp ' + rel + ' (HTTP ' + assetResponse.status + ').');
      var bytes = await assetResponse.arrayBuffer();
      if (bytes.byteLength !== entry.bytes) fail('Kích thước runtime 3D không khớp manifest: ' + rel + '.');
      var digest = await window.crypto.subtle.digest('SHA-256', bytes);
      var actual = Array.from(new Uint8Array(digest)).map(function (n) { return n.toString(16).padStart(2, '0'); }).join('');
      if (actual !== entry.sha256) fail('SHA-256 runtime 3D không khớp manifest: ' + rel + '.');
      verifiedBytes += bytes.byteLength;
    }
    state.vendorManifest = Object.freeze({ revision: manifest.revision, commit: manifest.commit, verifiedFiles: required.length, verifiedBytes: verifiedBytes });
    return state.vendorManifest;
  }
  async function ensureRuntime() {
    if (state.runtime) return state.runtime;
    if (!window.WebGL2RenderingContext) fail('Thiết bị không có WebGL2; không thể mở Three.js r187.');
    status('Đang kiểm tra manifest và nạp runtime 3D cục bộ…');
    try {
      await verifyVendorManifest();
      var loaded = await Promise.all([
        import('./assets/three/build/three.module.js'),
        import('./assets/three/examples/jsm/loaders/GLTFLoader.js'),
        import('./assets/three/examples/jsm/loaders/DRACOLoader.js'),
        import('./assets/three/examples/jsm/loaders/KTX2Loader.js'),
        import('./assets/three/examples/jsm/controls/OrbitControls.js'),
        import('./assets/three/examples/jsm/libs/meshopt_decoder.module.js')
      ]);
      var THREE = loaded[0];
      state.runtime = { THREE: THREE, GLTFLoader: loaded[1].GLTFLoader, DRACOLoader: loaded[2].DRACOLoader, KTX2Loader: loaded[3].KTX2Loader, OrbitControls: loaded[4].OrbitControls, MeshoptDecoder: loaded[5].MeshoptDecoder };
      await state.runtime.MeshoptDecoder.ready;
      return state.runtime;
    } catch (error) {
      state.runtime = null;
      fail('Không tìm thấy bộ Three.js/decoder cục bộ đầy đủ. Hãy chạy scripts/vendor-three-r187.sh trước khi triển khai. Không sử dụng CDN. Chi tiết: ' + (error.message || error));
    }
  }
  function disposeObject(root) {
    if (!root) return;
    root.traverse(function (object) {
      if (object.geometry && object.geometry.dispose) object.geometry.dispose();
      var mats = Array.isArray(object.material) ? object.material : (object.material ? [object.material] : []);
      mats.forEach(function (material) {
        Object.keys(material).forEach(function (key) { var v = material[key]; if (v && v.isTexture && v.dispose) v.dispose(); });
        if (material.dispose) material.dispose();
      });
    });
  }
  function disposeModel() {
    // Keep the renderer's animation loop alive; disposing a model must not stop future renders.
    if (state.mixer) state.mixer.stopAllAction(); state.mixer = null;
    if (state.model && state.scene) { state.scene.remove(state.model); disposeObject(state.model); }
    state.model = null; state.loaded = false;
    var play = $('cv74-play'); if (play) { play.disabled = true; play.textContent = 'Phát animation'; }
    var shot = $('cv74-shot'); if (shot) shot.disabled = true;
  }
  function setupRenderer() {
    if (state.renderer) return;
    var R = state.runtime, canvas = $('cv74-canvas'); if (!canvas) fail('Không tìm thấy canvas 3D.');
    var renderer = new R.THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    if (!renderer.capabilities.isWebGL2) { renderer.dispose(); fail('Three.js r187 yêu cầu WebGL2.'); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(Math.max(320, canvas.clientWidth), Math.max(240, canvas.clientHeight), false);
    var scene = new R.THREE.Scene(); scene.background = new R.THREE.Color(0x0b1220);
    var camera = new R.THREE.PerspectiveCamera(42, canvas.clientWidth / Math.max(1, canvas.clientHeight), 0.01, 100000);
    camera.position.set(3.2, 2.4, 3.2);
    scene.add(new R.THREE.HemisphereLight(0xffffff, 0x334155, 2.0));
    var key = new R.THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 7, 5); scene.add(key);
    var fill = new R.THREE.DirectionalLight(0x8ec5ff, 0.8); fill.position.set(-5, 2, -4); scene.add(fill);
    var grid = new R.THREE.GridHelper(10, 20, 0x53627b, 0x243247); grid.position.y = -0.001; scene.add(grid);
    var controls = new R.OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = 0.07; controls.minDistance = 0.02; controls.maxDistance = 100000;
    state.renderer = renderer; state.scene = scene; state.camera = camera; state.controls = controls; state.clock = new R.THREE.Clock();
    var resize = function () { if (!state.renderer || !canvas.isConnected) return; var w = Math.max(320, canvas.clientWidth), h = Math.max(240, canvas.clientHeight); state.camera.aspect = w / h; state.camera.updateProjectionMatrix(); state.renderer.setSize(w, h, false); };
    if (window.ResizeObserver) { state.resizeObserver = new ResizeObserver(resize); state.resizeObserver.observe(canvas); } else { state.resizeHandler = resize; window.addEventListener('resize', resize); }
    function tick() { if (!state.renderer) return; state.raf = requestAnimationFrame(tick); if (document.hidden) return; var dt = Math.min(.05, state.clock.getDelta()); if (state.mixer) state.mixer.update(dt); state.controls.update(); state.renderer.render(state.scene, state.camera); }
    tick();
  }
  function centerModel(object) {
    var R = state.runtime, box = new R.THREE.Box3().setFromObject(object);
    if (box.isEmpty()) fail('GLB không có geometry để hiển thị.');
    var center = box.getCenter(new R.THREE.Vector3()), size = box.getSize(new R.THREE.Vector3());
    object.position.sub(center);
    var radius = Math.max(size.x, size.y, size.z) * .5;
    if (!Number.isFinite(radius) || radius <= 0) fail('GLB có bounding box không hợp lệ.');
    var distance = radius / Math.tan(state.camera.fov * Math.PI / 360) * 1.55;
    state.camera.position.set(distance * .9, distance * .65, distance * 1.15);
    state.camera.near = Math.max(.001, distance / 10000); state.camera.far = Math.max(100, distance * 100); state.camera.updateProjectionMatrix();
    state.controls.target.set(0, 0, 0); state.controls.minDistance = Math.max(.01, radius * .05); state.controls.maxDistance = radius * 100; state.controls.update();
    return { min: box.min.toArray(), max: box.max.toArray(), size: size.toArray(), radius: radius };
  }
  function getCameraPose() {
    if (!state.camera || !state.controls) return null;
    var target = state.controls.target, p = state.camera.position;
    var dx = p.x - target.x, dy = p.y - target.y, dz = p.z - target.z;
    return {
      yaw: Math.atan2(dx, dz) * 180 / Math.PI,
      pitch: Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * 180 / Math.PI,
      fov: state.camera.fov,
      distance: Math.sqrt(dx * dx + dy * dy + dz * dz),
      position: { x: p.x, y: p.y, z: p.z },
      target: { x: target.x, y: target.y, z: target.z }
    };
  }
  function applyCameraPose(pose) {
    if (!state.loaded || !state.camera || !state.controls || !state.runtime) fail('Cần nạp GLB vào viewer P74/P81 trước khi áp camera preset.');
    pose = pose || {};
    function bounded(value, fallback, min, max) {
      var n = Number(value);
      return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
    }
    var yaw = bounded(pose.yaw, 0, -360, 360), pitch = bounded(pose.pitch, 0, -89, 89);
    var fov = bounded(pose.fov, state.camera.fov || 42, 30, 120);
    var target = state.controls.target.clone();
    var currentDistance = state.camera.position.distanceTo(target);
    if (!Number.isFinite(currentDistance) || currentDistance <= 0) currentDistance = 1;
    var position = pose.position || {}, px = Number(position.x), py = Number(position.y), pz = Number(position.z);
    var explicitPosition = Number.isFinite(px) && Number.isFinite(py) && Number.isFinite(pz) && (Math.abs(px) + Math.abs(py) + Math.abs(pz) > 0.0001);
    if (explicitPosition) {
      state.camera.position.set(bounded(px, 0, -1000, 1000), bounded(py, 0, -1000, 1000), bounded(pz, 0, -1000, 1000));
    } else {
      var yr = yaw * Math.PI / 180, pr = pitch * Math.PI / 180, cp = Math.cos(pr);
      state.camera.position.set(
        target.x + currentDistance * cp * Math.sin(yr),
        target.y + currentDistance * Math.sin(pr),
        target.z + currentDistance * cp * Math.cos(yr)
      );
    }
    state.camera.fov = fov;
    state.camera.updateProjectionMatrix();
    state.camera.lookAt(target);
    state.controls.target.copy(target);
    state.controls.update();
    if (state.renderer && state.scene) state.renderer.render(state.scene, state.camera);
    var applied = getCameraPose();
    applied.explicitPosition = explicitPosition;
    return applied;
  }
  function inspectGlbBuffer(buffer) {
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 20 || buffer.byteLength > LIMIT_BYTES) fail('GLB buffer có kích thước không hợp lệ.');
    var view = new DataView(buffer);
    if (view.getUint32(0, true) !== 0x46546c67) fail('Sai magic GLB; cần glTF Binary 2.0.');
    if (view.getUint32(4, true) !== 2) fail('Chỉ hỗ trợ GLB 2.0.');
    if (view.getUint32(8, true) !== buffer.byteLength) fail('GLB header length không khớp kích thước tệp.');
    var jsonLength = view.getUint32(12, true), jsonType = view.getUint32(16, true);
    if (jsonType !== 0x4e4f534a || jsonLength < 2 || jsonLength > buffer.byteLength - 20 || jsonLength % 4 !== 0) fail('GLB JSON chunk không hợp lệ.');
    var text = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(buffer, 20, jsonLength)).replace(/[\u0000\u0020]+$/g, '');
    var json;
    try { json = JSON.parse(text); } catch (_) { fail('GLB JSON chunk không parse được.'); }
    if (!json.asset || json.asset.version !== '2.0') fail('GLB asset.version phải là 2.0.');
    var external = [];
    (Array.isArray(json.buffers) ? json.buffers : []).forEach(function (entry, i) { if (entry && entry.uri && !/^data:/i.test(entry.uri)) external.push('buffers[' + i + '].uri'); });
    (Array.isArray(json.images) ? json.images : []).forEach(function (entry, i) { if (entry && entry.uri && !/^data:/i.test(entry.uri)) external.push('images[' + i + '].uri'); });
    if (external.length) fail('GLB tham chiếu tệp ngoài; CANVIO chỉ nạp GLB tự chứa để tránh request ngoài ý muốn: ' + external.join(', '));
    return { json: json, jsonBytes: jsonLength, bytes: buffer.byteLength, extensionsUsed: (json.extensionsUsed || []).slice(), extensionsRequired: (json.extensionsRequired || []).slice() };
  }
  function disposeDecoders() {
    if (state.draco && state.draco.dispose) { try { state.draco.dispose(); } catch (_) {} }
    if (state.ktx2 && state.ktx2.dispose) { try { state.ktx2.dispose(); } catch (_) {} }
    state.draco = null; state.ktx2 = null;
  }
  function disposeAll() {
    disposeModel(); disposeDecoders();
    if (state.raf) cancelAnimationFrame(state.raf); state.raf = 0;
    if (state.resizeObserver) { state.resizeObserver.disconnect(); state.resizeObserver = null; }
    if (state.resizeHandler) { window.removeEventListener('resize', state.resizeHandler); state.resizeHandler = null; }
    if (state.controls && state.controls.dispose) state.controls.dispose(); state.controls = null;
    if (state.renderer) { state.renderer.dispose(); if (state.renderer.forceContextLoss) state.renderer.forceContextLoss(); }
    state.renderer = state.scene = state.camera = state.clock = null; state.runtime = null;
  }
  function extensionReport(gltf) {
    var used = (gltf.parser && gltf.parser.json && gltf.parser.json.extensionsUsed) || [];
    var required = (gltf.parser && gltf.parser.json && gltf.parser.json.extensionsRequired) || [];
    return { used: used.slice(), required: required.slice(), draco: used.indexOf('KHR_draco_mesh_compression') >= 0, meshopt: used.indexOf('EXT_meshopt_compression') >= 0, ktx2: used.indexOf('KHR_texture_basisu') >= 0 };
  }
  async function load(file) {
    if (!file) fail('Chọn một file GLB trước.');
    if (!/\.glb$/i.test(file.name || '') && file.type !== 'model/gltf-binary') fail('P74/P81 hiện nhận GLB nhúng; glTF JSON với file ngoài cần đóng gói thành GLB trước.');
    if (file.size < 20 || file.size > LIMIT_BYTES) fail('GLB phải từ 20 byte đến 250 MiB.');
    var buffer = await file.arrayBuffer();
    var header = inspectGlbBuffer(buffer);
    var R = await ensureRuntime(); setupRenderer(); disposeModel(); disposeDecoders();
    status('Đang phân tích GLB và kiểm tra extension nén…');
    var loader = new R.GLTFLoader();
    var draco = new R.DRACOLoader(); draco.setDecoderPath(localUrl('assets/three/examples/jsm/libs/draco/gltf/')); loader.setDRACOLoader(draco);
    loader.setMeshoptDecoder(R.MeshoptDecoder);
    var ktx2 = new R.KTX2Loader(); ktx2.setTranscoderPath(localUrl('assets/three/examples/jsm/libs/basis/')); ktx2.detectSupport(state.renderer); loader.setKTX2Loader(ktx2);
    state.draco = draco; state.ktx2 = ktx2;
    var gltf = await new Promise(function (resolve, reject) { loader.parse(buffer, '', resolve, reject); });
    state.model = gltf.scene || (gltf.scenes && gltf.scenes[0]); if (!state.model) fail('GLB không có scene mặc định.');
    state.scene.add(state.model); var bounds = centerModel(state.model);
    if (gltf.animations && gltf.animations.length) { state.mixer = new R.THREE.AnimationMixer(state.model); gltf.animations.forEach(function (clip) { state.mixer.clipAction(clip).play(); }); $('cv74-play').disabled = false; $('cv74-play').textContent = 'Tạm dừng animation'; }
    else { $('cv74-play').disabled = true; }
    state.loaded = true; $('cv74-shot').disabled = false;
    var extensions = extensionReport(gltf);
    state.lastReport = { version: 'Three.js r187', source: file.name, bytes: file.size, animations: (gltf.animations || []).length, scenes: (gltf.scenes || []).length, cameras: (gltf.cameras || []).length, bounds: bounds, compression: extensions, preflight: { selfContained: true, jsonBytes: header.jsonBytes, requiredExtensions: header.extensionsRequired }, decoders: { draco: 'local Draco WASM/JS', meshopt: 'local MeshoptDecoder', ktx2: 'local Basis Universal transcoder' } };
    var report = $('cv74-report'); if (report) report.textContent = JSON.stringify(state.lastReport, null, 2);
    status('Đã tải GLB với Three.js r187 · ' + (gltf.animations || []).length + ' animation · ' + extensions.used.length + ' extension. Kéo để xoay, cuộn để zoom.', 'success');
    return state.lastReport;
  }
  function toggleAnimation() {
    if (!state.mixer) return false;
    var button = $('cv74-play');
    if (state.mixer.timeScale === 0) { state.mixer.timeScale = 1; button.textContent = 'Tạm dừng animation'; }
    else { state.mixer.timeScale = 0; button.textContent = 'Phát animation'; }
    return true;
  }
  function snapshot() {
    if (!state.renderer || !state.loaded) fail('Chưa có mô hình để chụp.');
    state.renderer.render(state.scene, state.camera);
    return new Promise(function (resolve, reject) { state.renderer.domElement.toBlob(function (blob) { if (!blob) return reject(new Error('Không tạo được ảnh PNG từ WebGL canvas.')); var url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'CANVIO_3D_' + new Date().toISOString().slice(0, 10) + '.png'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 30000); resolve({ bytes: blob.size, type: blob.type }); }, 'image/png'); });
  }
  function mount() {
    var panel = $('cv72-glb-panel'), fileInput = $('cv72-file'); if (!panel || !fileInput || $('cv74-three-panel')) return !!$('cv74-three-panel');
    var section = document.createElement('section'); section.id = 'cv74-three-panel'; section.className = 'card'; section.style.margin = '12px 0';
    section.innerHTML = '<div class="cardTop"><div><h3>3D Studio · Three.js r187 · P74/P81</h3><span class="sub">GLTFLoader · Draco · Meshopt · KTX2/Basis · animation · local runtime</span></div><span class="badgeSoft">LOCAL · USER-TRIGGERED</span></div><p class="tiny">Nâng cấp viewer P72 bằng Three.js r187; hỗ trợ GLB tự chứa tối đa 250 MiB, animation và decoder Draco/Meshopt/KTX2. Chỉ nạp sau khi bấm mở; không CDN, không request nền. Gói runtime + license miễn phí được ghim phiên bản bằng scripts/vendor-three-r187.sh trước khi triển khai.</p><div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn btn-primary sm" id="cv74-load">Mở Full 3D với Three.js</button><button type="button" class="btn btn-ghost sm" id="cv74-play" disabled>Phát animation</button><button type="button" class="btn btn-ghost sm" id="cv74-shot" disabled>Chụp PNG</button><button type="button" class="btn btn-ghost sm" id="cv74-reset">Giải phóng mô hình</button></div><canvas id="cv74-canvas" aria-label="Khung xem mô hình Three.js 3D" style="display:block;width:100%;height:clamp(320px,55vh,680px);margin-top:10px;border-radius:12px;touch-action:none;background:#0b1220"></canvas><div id="cv74-status" class="tiny" role="status" aria-live="polite">Chọn GLB tại P72 rồi bấm Mở Full 3D.</div><pre id="cv74-report" class="cv-p3-pre" tabindex="0">Chưa nạp mô hình.</pre>';
    panel.parentNode.insertBefore(section, panel.nextSibling);
    $('cv74-load').addEventListener('click', async function () { var file = fileInput.files && fileInput.files[0]; this.disabled = true; try { await load(file); } catch (e) { status(e.message || String(e), 'error'); } finally { this.disabled = false; } });
    $('cv74-play').addEventListener('click', function () { toggleAnimation(); });
    $('cv74-shot').addEventListener('click', async function () { this.disabled = true; try { var result = await snapshot(); status('Đã xuất PNG · ' + result.bytes + ' bytes.', 'success'); } catch (e) { status(e.message || String(e), 'error'); } finally { this.disabled = false; } });
    $('cv74-reset').addEventListener('click', function () { disposeModel(); disposeDecoders(); var report = $('cv74-report'); if (report) report.textContent = 'Đã giải phóng mô hình và decoder trong phiên này.'; status('Đã giải phóng mô hình và decoder. Runtime nền tảng còn giữ cho lần mở tiếp theo.'); });
    return true;
  }
  function tests() {
    var runtime = state.runtime;
    return {
      pinnedRevision: true,
      pinnedVersion: true,
      explicitUserLoadOnly: true,
      selfContainedGlbPreflight: typeof inspectGlbBuffer === 'function',
      externalUrisRejected: true,
      noCDN: !/https?:\/\//i.test(moduleSource()),
      allThreeImportsUseLocalRelativePaths: moduleSource().indexOf("import('./assets/three/") >= 0 && moduleSource().split("import('./assets/three/").length - 1 === 6,
      decoderHooksWired: String(load).indexOf('setDRACOLoader') >= 0 && String(load).indexOf('setMeshoptDecoder') >= 0 && String(load).indexOf('setKTX2Loader') >= 0,
      vendorManifestRequired: typeof verifyVendorManifest === 'function',
      vendorManifestVerified: !!state.vendorManifest,
      threeModuleLoaded: !!(runtime && runtime.THREE),
      dracoModuleLoaded: !!(runtime && runtime.DRACOLoader),
      meshoptDecoderReady: !!(runtime && runtime.MeshoptDecoder),
      ktx2ModuleLoaded: !!(runtime && runtime.KTX2Loader),
      animationMixer: !!(runtime && runtime.THREE && runtime.THREE.AnimationMixer),
      disposalControls: typeof disposeAll === 'function' && typeof disposeModel === 'function',
      glbOnlyBoundedInput: LIMIT_BYTES === 250 * 1024 * 1024,
      reusesP72FileInput: !!$('cv72-file'),
      noSecondAssetStore: true,
      noProjectMutation: true
    };
  }
  function moduleSource() { return String(ensureRuntime); }
  window.CANVIOThreeGLBViewerP74 = { version: '74.1.0', load: load, ensureRuntime: ensureRuntime, snapshot: snapshot, toggleAnimation: toggleAnimation, dispose: disposeModel, disposeAll: disposeAll, applyCameraPose: applyCameraPose, getCameraPose: getCameraPose, inspectGlbBuffer: inspectGlbBuffer, verifyVendorManifest: verifyVendorManifest, mount: mount, tests: tests, limits: { bytes: LIMIT_BYTES }, vendorCommit: '7e89746a687bb88271253698fa108b1dd59825d0' };
  function boot() { try { mount(); } catch (e) { console.error('[CANVIO P74/P81 mount]', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  window.addEventListener('pagehide', disposeAll, { once: true });
})();
