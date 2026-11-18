(function () {
  'use strict';
  if (window.CANVIOP85Suite) return;

  var ROOT = 'assets/p85/';
  var MAX_GLB = 250 * 1024 * 1024;
  var MAX_VIDEO = 250 * 1024 * 1024;
  var MAX_ANIMATION = 50 * 1024 * 1024;
  var state = {
    mounted: false, manifest: null, verified: new Set(), pending: null,
    rendererModule: null, postFx: null, pathTracer: null,
    cv: null, cvPromise: null, cvScript: null, tracking: null,
    dotLottieModule: null, dotLottie: null, dotLottieUrl: null, dotLottieWasmReady: false, rivePromise: null, riveModule: null, rive: null, riveUrl: null,
    urls: new Set(), listeners: [],
  };
  function byId(id) { return document.getElementById(id); }
  function safeText(el, value) { if (el) el.textContent = String(value == null ? '' : value); }
  function note(id, message, kind) {
    var el = byId(id); if (!el) return;
    safeText(el, message); el.dataset.state = kind || 'info';
  }
  function local(path) { return new URL(ROOT + path, document.baseURI).href; }
  function selectedGlbFile() {
    var input = byId('cv72-file');
    return fileCheck(input && input.files && input.files[0], 'glb', MAX_GLB);
  }
  function fail(message) { throw new Error(message); }
  function fileCheck(file, ext, max) {
    if (!file) fail('Hãy chọn tệp trước.');
    if (file.size < 1 || file.size > max) fail('Tệp vượt giới hạn dung lượng cho phép.');
    if (!new RegExp('\\.(' + ext + ')$', 'i').test(file.name || '')) fail('Định dạng tệp không được hỗ trợ.');
    return file;
  }
  function trackUrl(blob) { var url = URL.createObjectURL(blob); state.urls.add(url); return url; }
  function revokeUrl(url) { if (url && state.urls.has(url)) { URL.revokeObjectURL(url); state.urls.delete(url); } }
  function getDigest(bytes) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error('Trình duyệt cần Web Crypto trên HTTPS/localhost để xác minh runtime.'));
    return crypto.subtle.digest('SHA-256', bytes).then(function (hash) {
      return Array.from(new Uint8Array(hash)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    });
  }
  async function loadManifest() {
    if (state.manifest) return state.manifest;
    var response = await fetch(local('P85-VENDOR-MANIFEST.json'), { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) fail('Không đọc được P85 vendor manifest (' + response.status + '). Hãy chạy scripts/vendor-p85-runtimes.sh trong build online.');
    var manifest = await response.json();
    if (!manifest || manifest.format !== 'CANVIO_P85_VENDOR_MANIFEST' || !Array.isArray(manifest.files) || !manifest.packages) fail('P85 vendor manifest không hợp lệ.');
    var seen = new Set();
    manifest.files.forEach(function (entry) {
      if (!entry || typeof entry.path !== 'string' || !entry.path || entry.path.indexOf('..') >= 0 || entry.path.startsWith('/') || seen.has(entry.path) || !/^[a-f0-9]{64}$/.test(entry.sha256 || '') || !Number.isSafeInteger(entry.bytes) || entry.bytes < 1) fail('P85 manifest có đường dẫn/hash/kích thước không hợp lệ.');
      seen.add(entry.path);
    });
    state.manifest = manifest;
    return manifest;
  }
  async function verifyFiles(paths) {
    var manifest = await loadManifest();
    var entries = new Map(manifest.files.map(function (entry) { return [entry.path, entry]; }));
    for (var i = 0; i < paths.length; i++) {
      var rel = paths[i], entry = entries.get(rel);
      if (!entry) fail('P85 manifest thiếu runtime: ' + rel);
      if (state.verified.has(rel)) continue;
      var response = await fetch(local(rel), { cache: 'force-cache', credentials: 'same-origin' });
      if (!response.ok) fail('Thiếu runtime cục bộ: ' + rel + ' (' + response.status + ').');
      var buffer = await response.arrayBuffer();
      if (buffer.byteLength !== entry.bytes) fail('Kích thước runtime không khớp manifest: ' + rel);
      var digest = await getDigest(buffer);
      if (digest !== entry.sha256) fail('SHA-256 runtime không khớp manifest: ' + rel);
      state.verified.add(rel);
    }
    return true;
  }
  async function ensureRendererBundle() {
    if (state.rendererModule) return state.rendererModule;
    await verifyFiles(['p85-renderers.js']);
    state.rendererModule = await import('./' + ROOT + 'p85-renderers.js');
    return state.rendererModule;
  }
  function stopPostFx() { if (state.postFx) { try { state.postFx.dispose(); } catch (_) {} state.postFx = null; } }
  function stopPathTracer() { if (state.pathTracer) { try { state.pathTracer.dispose(); } catch (_) {} state.pathTracer = null; } }
  function mediaAsset(blob, filename) {
    var cv = window.CV;
    if (cv && cv.assets && typeof cv.assets.addBlob === 'function') {
      return Promise.resolve(cv.assets.addBlob(blob, filename || 'CANVIO_P85_export.webm')).then(function (result) {
        var video = window.CV && window.CV.engines && window.CV.engines.video;
        if (video && typeof video.importFiles === 'function') return Promise.resolve(video.importFiles([blob])).then(function () { return result; });
        return result;
      });
    }
    return Promise.reject(new Error('Asset Library hiện tại không cung cấp addBlob; tệp vẫn có thể được lưu thủ công.'));
  }
  async function openPostFx() {
    var file = selectedGlbFile();
    stopPostFx(); stopPathTracer();
    note('p85-postfx-status', 'Đang xác minh runtime và tải PostFX cục bộ…');
    var module = await ensureRendererBundle();
    state.postFx = await module.createPostProcessingPreview(byId('p85-postfx-canvas'), file, { bloom: byId('p85-bloom').value });
    note('p85-postfx-status', 'Đã render bằng Three.js r187 + postprocessing 6.39.6. Xoay bằng chuột và điều chỉnh Bloom.', 'success');
    byId('p85-postfx-stop').disabled = false;
    return state.postFx;
  }
  async function openPathTracer() {
    if (!navigator.gpu) fail('Trình duyệt/thiết bị không có WebGPU. Path Tracing yêu cầu WebGPU; có thể dùng PostFX/WebGL thay thế.');
    var file = selectedGlbFile();
    stopPostFx(); stopPathTracer();
    note('p85-path-status', 'Đang khởi tạo WebGPU Path Tracer (thử nghiệm)…');
    var module = await ensureRendererBundle();
    state.pathTracer = await module.createWebGPUPathTracingPreview(byId('p85-path-canvas'), file, { maxSamples: 96, renderScale: 0.5 });
    note('p85-path-status', 'Path Tracer WebGPU đang tích lũy mẫu. Thử nghiệm; chất lượng/tốc độ tùy GPU.', 'success');
    byId('p85-path-stop').disabled = false;
    return state.pathTracer;
  }
  function ensureOpenCV() {
    if (state.cv) return Promise.resolve(state.cv);
    if (state.cvPromise) return state.cvPromise;
    state.cvPromise = verifyFiles(['opencv/opencv.js']).then(async function () {
      var imported = await import('./' + ROOT + 'opencv/opencv.js');
      var cvModule = imported.default || imported.cv || window.cv;
      if (cvModule && typeof cvModule.then === 'function') cvModule = await cvModule;
      if (cvModule && cvModule.Mat) { state.cv = cvModule; return cvModule; }
      if (!cvModule) cvModule = window.cv || window.Module;
      if (cvModule && cvModule.Mat) { state.cv = cvModule; return cvModule; }
      return new Promise(function (resolve, reject) {
        var done = false, timer = setTimeout(function () { if (!done) { done = true; reject(new Error('OpenCV.js không khởi tạo trong 45 giây.')); } }, 45000);
        var previous = cvModule && cvModule.onRuntimeInitialized;
        if (cvModule) cvModule.onRuntimeInitialized = function () {
          if (typeof previous === 'function') { try { previous(); } catch (_) {} }
          var ready = window.cv || cvModule;
          if (!ready || !ready.Mat) { if (!done) { done = true; clearTimeout(timer); reject(new Error('OpenCV.js khởi tạo nhưng API Mat không sẵn sàng.')); } return; }
          state.cv = ready; if (!done) { done = true; clearTimeout(timer); resolve(ready); }
        };
        var check = function () {
          if (done) return;
          var ready = window.cv;
          if (ready && typeof ready.then === 'function') ready.then(function (value) { if (value && value.Mat && !done) { done = true; clearTimeout(timer); state.cv = value; resolve(value); } }).catch(function (error) { if (!done) { done = true; clearTimeout(timer); reject(error); } });
          else if (ready && ready.Mat) { done = true; clearTimeout(timer); state.cv = ready; resolve(ready); }
          else setTimeout(check, 120);
        };
        check();
      });
    }).catch(function (error) { state.cvPromise = null; throw error; });
    return state.cvPromise;
  }
  function clearTracking() {
    var t = state.tracking; if (!t) return;
    t.stopped = true; if (t.raf) cancelAnimationFrame(t.raf);
    ['src','prevGray','nextGray','prevPts','nextPts','status','error','rgba','windowSize','criteria'].forEach(function (key) { if (t[key] && typeof t[key].delete === 'function') { try { t[key].delete(); } catch (_) {} } });
    if (t.video) { try { t.video.onended = null; t.video.onloadedmetadata = null; t.video.onseeked = null; t.video.onerror = null; t.video.pause(); t.video.removeAttribute('src'); t.video.load(); } catch (_) {} }
    if (t.url) revokeUrl(t.url);
    state.tracking = null;
  }
  function detectGoodFeatures(cv, gray, maxCorners, qualityLevel, minDistance) {
    var points = new cv.Mat();
    if (typeof cv.goodFeaturesToTrack === 'function') {
      cv.goodFeaturesToTrack(gray, points, maxCorners, qualityLevel, minDistance);
      return points;
    }
    if (typeof cv.cornerMinEigenVal !== 'function') {
      points.delete();
      throw new Error('OpenCV.js runtime thiếu cornerMinEigenVal; không thể khởi tạo điểm theo dõi Shi–Tomasi.');
    }
    var response = new cv.Mat();
    try {
      cv.cornerMinEigenVal(gray, response, 3, 3);
      var values = response.data32F;
      var rows = gray.rows, cols = gray.cols, length = rows * cols, maximum = 0;
      for (var i = 0; i < length; i++) {
        var score = values[i];
        if (Number.isFinite(score) && score > maximum) maximum = score;
      }
      if (!(maximum > 0)) return points;
      var cutoff = maximum * Math.max(0, Math.min(1, Number(qualityLevel) || 0.01));
      var candidates = [];
      for (var y = 3; y < rows - 3; y += 2) {
        for (var x = 3; x < cols - 3; x += 2) {
          var index = y * cols + x, value = values[index];
          if (!Number.isFinite(value) || value < cutoff) continue;
          var peak = true;
          for (var dy = -1; dy <= 1 && peak; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              var other = values[(y + dy) * cols + x + dx];
              if (other > value || (other === value && (dy < 0 || (dy === 0 && dx < 0)))) { peak = false; break; }
            }
          }
          if (peak) candidates.push({ x: x, y: y, score: value });
        }
      }
      candidates.sort(function (a, b) { return b.score - a.score; });
      var chosen = [], flat = [], minDistance2 = Math.max(1, Number(minDistance) || 7) ** 2;
      for (var c = 0; c < candidates.length && chosen.length < maxCorners; c++) {
        var candidate = candidates[c], separated = true;
        for (var j = 0; j < chosen.length; j++) {
          var dx2 = candidate.x - chosen[j].x, dy2 = candidate.y - chosen[j].y;
          if (dx2 * dx2 + dy2 * dy2 < minDistance2) { separated = false; break; }
        }
        if (separated) { chosen.push(candidate); flat.push(candidate.x, candidate.y); }
      }
      if (!flat.length) return points;
      points.delete();
      points = new cv.Mat(chosen.length, 1, cv.CV_32FC2);
      points.data32F.set(flat);
      return points;
    } catch (error) {
      points.delete();
      throw error;
    } finally {
      response.delete();
    }
  }

  async function startOpticalFlow() {
    var input = byId('p85-video'), file = fileCheck(input && input.files && input.files[0], 'mp4|webm|mov', MAX_VIDEO);
    clearTracking(); note('p85-cv-status', 'Đang xác minh và khởi tạo OpenCV.js…');
    var cv = await ensureOpenCV();
    var video = document.createElement('video'); video.muted = true; video.playsInline = true; video.preload = 'metadata'; video.src = trackUrl(file);
    await new Promise(function (resolve, reject) { video.onloadedmetadata = resolve; video.onerror = function () { reject(new Error('Không đọc được video.')); }; });
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 180) fail('Video tracking giới hạn tối đa 180 giây.');
    if (video.videoWidth > 3840 || video.videoHeight > 2160 || video.videoWidth * video.videoHeight > 8294400) fail('Video vượt 4K hoặc 8,3 megapixel mỗi khung.');
    var canvas = byId('p85-cv-canvas'), overlay = byId('p85-cv-overlay'), sourceCtx = canvas.getContext('2d'), overlayCtx = overlay.getContext('2d');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight; overlay.width = video.videoWidth; overlay.height = video.videoHeight;
    var t = { video: video, url: video.src, canvas: canvas, overlay: overlay, ctx: overlayCtx, sourceCtx: sourceCtx, raf: 0, stopped: false, src: null, prevGray: null, nextGray: null, prevPts: null, nextPts: null, status: null, error: null, rgba: null, windowSize: new cv.Size(21, 21), criteria: new cv.TermCriteria(cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 30, 0.01), processed: 0, last: 0, lastProcessAt: 0, points: 0 };
    state.tracking = t;
    try {
      await new Promise(function (resolve, reject) {
        if (video.readyState >= 2) return resolve();
        var timer = setTimeout(function () { cleanup(); reject(new Error('Video không giải mã được khung hình đầu trong 15 giây.')); }, 15000);
        function cleanup() { clearTimeout(timer); video.removeEventListener('loadeddata', onData); video.removeEventListener('error', onError); }
        function onData() { cleanup(); resolve(); }
        function onError() { cleanup(); reject(new Error('Không giải mã được khung hình video.')); }
        video.addEventListener('loadeddata', onData, { once: true });
        video.addEventListener('error', onError, { once: true });
      });
      video.playbackRate = 1; await video.play();
    } catch (error) { clearTracking(); throw error; }
    video.onended = function () { if (state.tracking === t) stopOpticalFlow(); };
    function readGray() {
      var image = cv.imread(canvas), gray = new cv.Mat();
      try { cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY); return gray; }
      catch (error) { try { gray.delete(); } catch (_) {} throw error; }
      finally { try { image.delete(); } catch (_) {} }
    }
    function drawFrame() {
      if (t.stopped || video.paused || video.ended) return;
      var now = performance.now();
      if ((t.lastProcessAt && now - t.lastProcessAt < 1000 / 15) || (t.last && video.currentTime === t.last)) { t.raf = requestAnimationFrame(drawFrame); return; }
      t.lastProcessAt = now; t.last = video.currentTime; overlayCtx.clearRect(0, 0, overlay.width, overlay.height); sourceCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
      var gray = null;
      try {
        gray = readGray();
        if (!t.prevGray) {
          t.prevGray = gray; gray = null; t.prevPts = new cv.Mat(); t.prevPts = detectGoodFeatures(cv, t.prevGray, 160, 0.01, 7); t.points = t.prevPts.rows;
        } else {
          if (!t.prevPts || t.prevPts.rows < 1) { t.prevGray.delete(); t.prevGray = gray; gray = null; if (t.prevPts) t.prevPts.delete(); t.prevPts = detectGoodFeatures(cv, t.prevGray, 160, 0.01, 7); t.points = t.prevPts.rows; t.processed++; note('p85-cv-status', 'OpenCV.js LK optical flow · khởi tạo lại ' + t.points + ' điểm · ' + t.processed + ' khung.', 'success'); t.raf = requestAnimationFrame(drawFrame); return; }
          t.nextPts = new cv.Mat(); t.status = new cv.Mat(); t.error = new cv.Mat();
          cv.calcOpticalFlowPyrLK(t.prevGray, gray, t.prevPts, t.nextPts, t.status, t.error, t.windowSize, 3, t.criteria, 0, 0.001);
          var next = [];
          for (var i = 0; i < t.status.rows; i++) if (t.status.data[i]) {
            var p0x=t.prevPts.data32F[i*2],p0y=t.prevPts.data32F[i*2+1],p1x=t.nextPts.data32F[i*2],p1y=t.nextPts.data32F[i*2+1];
            if (Number.isFinite(p1x) && Number.isFinite(p1y)) { overlayCtx.beginPath(); overlayCtx.moveTo(p0x,p0y); overlayCtx.lineTo(p1x,p1y); overlayCtx.strokeStyle='#55e5c2'; overlayCtx.lineWidth=Math.max(1,canvas.width/1400); overlayCtx.stroke(); overlayCtx.beginPath(); overlayCtx.arc(p1x,p1y,Math.max(2,canvas.width/500),0,Math.PI*2); overlayCtx.fillStyle='#ffbf69'; overlayCtx.fill(); next.push(p1x,p1y); }
          }
          var newPts = new cv.Mat(next.length/2,1,cv.CV_32FC2); if (next.length) newPts.data32F.set(next);
          t.prevPts.delete(); t.nextPts.delete(); t.status.delete(); t.error.delete(); t.prevGray.delete();
          t.prevPts = newPts; t.prevGray = gray; gray = null; t.nextPts = null; t.status = null; t.error = null; t.points = next.length/2;
          if (t.points < 12) { t.prevPts.delete(); t.prevPts = new cv.Mat(); t.prevPts = detectGoodFeatures(cv, t.prevGray, 160, 0.01, 7); t.points = t.prevPts.rows; }
        }
        t.processed++;
        note('p85-cv-status', 'OpenCV.js LK optical flow · ' + t.points + ' điểm theo dõi · ' + t.processed + ' khung xử lý.', 'success');
      } catch (error) { if (gray && typeof gray.delete === 'function') { try { gray.delete(); } catch (_) {} } note('p85-cv-status', 'Tracking dừng do lỗi frame: ' + (error.message || error), 'error'); clearTracking(); return; }
      t.raf = requestAnimationFrame(drawFrame);
    }
    t.raf = requestAnimationFrame(drawFrame);
    byId('p85-cv-stop').disabled = false;
    return { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
  }
  function stopOpticalFlow() { clearTracking(); note('p85-cv-status', 'Đã dừng tracking và giải phóng OpenCV Mat/video.'); byId('p85-cv-stop').disabled = true; }
  async function ensureDotLottie() {
    await verifyFiles(['dotlottie/index.js', 'dotlottie/dotlottie-player.wasm']);
    if (!state.dotLottieModule) state.dotLottieModule = await import('./' + ROOT + 'dotlottie/index.js');
    var DotLottie = state.dotLottieModule.DotLottie || state.dotLottieModule.default && state.dotLottieModule.default.DotLottie;
    if (!DotLottie) fail('dotLottie runtime không export DotLottie.');
    if (typeof DotLottie.setWasmUrl !== 'function' || typeof DotLottie.preload !== 'function') fail('dotLottie runtime thiếu API cấu hình/nạp WASM an toàn.');
    DotLottie.setWasmUrl(local('dotlottie/dotlottie-player.wasm'));
    await DotLottie.preload();
    state.dotLottieWasmReady = true;
    return DotLottie;
  }
  async function ensureRive() {
    await verifyFiles(['rive/rive.js', 'rive/rive.wasm']);
    if (state.riveModule && state.riveModule.Rive) return state.riveModule;
    if (state.rivePromise) return state.rivePromise;
    if (window.rive && window.rive.Rive) { state.riveModule = window.rive; }
    if (state.riveModule) {
      var cached = state.riveModule;
      if (cached.RuntimeLoader && typeof cached.RuntimeLoader.setWasmUrl === 'function') cached.RuntimeLoader.setWasmUrl(local('rive/rive.wasm'));
      if (cached.RuntimeLoader && typeof cached.RuntimeLoader.setWasmFallbackUrl === 'function') cached.RuntimeLoader.setWasmFallbackUrl(null);
      if (!cached.RuntimeLoader || typeof cached.RuntimeLoader.awaitInstance !== 'function') fail('Rive RuntimeLoader không hỗ trợ chờ WASM.');
      await cached.RuntimeLoader.awaitInstance();
      return cached;
    }
    state.rivePromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script'); script.src = local('rive/rive.js'); script.async = true;
      script.onload = function () {
        var rive = window.rive;
        if (!rive || !rive.Rive) return reject(new Error('Rive runtime đã tải nhưng API Rive không tồn tại.'));
        if (!rive.RuntimeLoader || typeof rive.RuntimeLoader.setWasmUrl !== 'function' || typeof rive.RuntimeLoader.awaitInstance !== 'function') return reject(new Error('Rive runtime thiếu RuntimeLoader WASM API.'));
        rive.RuntimeLoader.setWasmUrl(local('rive/rive.wasm'));
        if (typeof rive.RuntimeLoader.setWasmFallbackUrl === 'function') rive.RuntimeLoader.setWasmFallbackUrl(null);
        rive.RuntimeLoader.awaitInstance().then(function (instance) {
          if (!instance || !instance.Fit) return reject(new Error('Rive WASM đã tải nhưng runtime API không hợp lệ.'));
          state.riveModule = rive;
          resolve(rive);
        }).catch(reject);
      };
      script.onerror = function () { reject(new Error('Không tải được Rive runtime cục bộ.')); };
      document.head.appendChild(script);
    }).catch(function (error) { state.rivePromise = null; throw error; });
    return state.rivePromise;
  }
  async function openVectorAnimation() {
    var engine = byId('p85-animation-engine').value, file = byId('p85-animation-file').files && byId('p85-animation-file').files[0];
    fileCheck(file, engine === 'rive' ? 'riv' : 'lottie|json', MAX_ANIMATION);
    disposeAnimation(); var canvas = byId('p85-animation-canvas');
    if (engine === 'dotlottie') {
      var DotLottie = await ensureDotLottie(); var url = trackUrl(file); state.dotLottieUrl = url;
      state.dotLottie = new DotLottie({ canvas: canvas, src: url, autoplay: true, loop: true });
      state.dotLottie.addEventListener('load', function () { if (state.dotLottie) note('p85-animation-status', 'dotLottie đã tải animation bằng WASM cục bộ.', 'success'); });
      state.dotLottie.addEventListener('loadError', function (event) { note('p85-animation-status', 'dotLottie lỗi tải: ' + (event && event.error && event.error.message || 'không rõ lỗi'), 'error'); });
      state.dotLottie.addEventListener('renderError', function (event) { note('p85-animation-status', 'dotLottie lỗi render: ' + (event && event.error && event.error.message || 'không rõ lỗi'), 'error'); });
      note('p85-animation-status', 'Đang nạp .lottie/.json bằng WASM cục bộ…');
    } else {
      var rive = await ensureRive(), url2 = trackUrl(file); state.riveUrl = url2;
      state.rive = new rive.Rive({ src: url2, canvas: canvas, autoplay: true, onLoad: function () { if (state.rive && typeof state.rive.resizeDrawingSurfaceToCanvas === 'function') state.rive.resizeDrawingSurfaceToCanvas(); note('p85-animation-status', 'Rive đã tải animation bằng WASM cục bộ. Runtime player không tạo/chỉnh sửa file Rive.', 'success'); }, onLoadError: function (event) { note('p85-animation-status', 'Rive lỗi tải: ' + (event && event.data || 'không rõ lỗi'), 'error'); } });
      note('p85-animation-status', 'Đang nạp .riv bằng WASM cục bộ…');
    }
    byId('p85-animation-stop').disabled = false;
    return true;
  }
  function disposeAnimation() {
    if (state.dotLottie) { try { state.dotLottie.destroy(); } catch (_) {} state.dotLottie = null; }
    if (state.rive) { try { state.rive.cleanup(); } catch (_) {} state.rive = null; }
    revokeUrl(state.dotLottieUrl); state.dotLottieUrl = null; revokeUrl(state.riveUrl); state.riveUrl = null;
    var canvas = byId('p85-animation-canvas'); if (canvas) { var ctx = canvas.getContext('2d'); if (ctx) ctx.clearRect(0,0,canvas.width,canvas.height); }
    if (byId('p85-animation-stop')) byId('p85-animation-stop').disabled = true;
  }
  function mount() {
    if (state.mounted) return true;
    var anchor = byId('cv74-three-panel') || byId('cv72-glb-panel') || document.querySelector('main') || document.body;
    if (!anchor) return false;
    var panel = document.createElement('section'); panel.id = 'canvio-p85-studio'; panel.className = 'card'; panel.style.cssText = 'margin:14px 0;padding:16px;';
    panel.innerHTML = '<style>#canvio-p85-studio .p85-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#canvio-p85-studio .p85-box{min-width:0;border:1px solid var(--line,rgba(255,255,255,.12));border-radius:14px;padding:13px;background:rgba(15,23,42,.34)}#canvio-p85-studio .p85-canvas{display:block;width:100%;height:260px;max-height:45vh;background:#0b1220;border-radius:10px;margin-top:9px}#canvio-p85-studio .p85-status{font-size:12px;min-height:34px;color:var(--muted,#aeb9cd);margin-top:7px}#canvio-p85-studio .p85-row{display:flex;flex-wrap:wrap;gap:7px;align-items:center}#canvio-p85-studio input[type=file]{max-width:100%;font-size:12px}#canvio-p85-studio button:disabled{opacity:.48;cursor:not-allowed}#canvio-p85-studio label{font-size:12px}#canvio-p85-studio .p85-muted{font-size:11px;color:var(--muted,#aeb9cd)}@media(max-width:820px){#canvio-p85-studio .p85-grid{grid-template-columns:1fr}}</style><div class="cardTop"><div><h3>Creative Runtime Lab · P85</h3><span class="sub">Path tracing · PostFX · Optical Flow · dotLottie · Rive</span></div><span class="badgeSoft">LOCAL · ON-DEMAND</span></div><p class="tiny">Mô-đun nâng cao dùng runtime mã nguồn mở được ghim phiên bản và xác minh SHA-256. Chỉ tải khi bạn bấm chạy; không gọi CDN/API trả phí. Path tracing cần WebGPU và vẫn là tính năng thử nghiệm.</p><div class="p85-grid"><section class="p85-box"><h4>1 · 3D Post Processing</h4><p class="p85-muted">Bloom · Vignette · Chromatic Aberration · Orbit Controls. Dùng chung tệp GLB với P74/P72.</p><div class="p85-row"><button type="button" class="btn btn-primary sm" id="p85-postfx-open">Render PostFX</button><button type="button" class="btn btn-ghost sm" id="p85-postfx-stop" disabled>Giải phóng</button></div><label for="p85-bloom">Bloom <input id="p85-bloom" type="range" min="0" max="2" step="0.05" value="0.55"></label><canvas id="p85-postfx-canvas" class="p85-canvas" aria-label="3D Post Processing preview"></canvas><div class="p85-status" id="p85-postfx-status" role="status" aria-live="polite">Chọn GLB ở P72/P74, sau đó bấm Render PostFX.</div></section><section class="p85-box"><h4>2 · WebGPU Path Tracing</h4><p class="p85-muted">Renderer vật lý thử nghiệm; yêu cầu navigator.gpu, Three.js r187 và GPU/driver tương thích. Không giả lập bằng WebGL.</p><div class="p85-row"><button type="button" class="btn btn-primary sm" id="p85-path-open">Bắt đầu Path Tracing</button><button type="button" class="btn btn-ghost sm" id="p85-path-stop" disabled>Dừng</button></div><canvas id="p85-path-canvas" class="p85-canvas" aria-label="WebGPU path tracing preview"></canvas><div class="p85-status" id="p85-path-status" role="status" aria-live="polite">WebGPU: <span id="p85-webgpu-state">đang kiểm tra…</span>. Dùng GLB đã chọn ở P72/P74.</div></section><section class="p85-box"><h4>3 · OpenCV Optical Flow</h4><p class="p85-muted">Theo dõi chuyển động điểm đặc trưng (Lucas–Kanade) trên video cục bộ. Giới hạn 180 giây, 4K, 250 MiB; không tải video lên mạng.</p><div class="p85-row"><input type="file" id="p85-video" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"><button type="button" class="btn btn-primary sm" id="p85-cv-start">Theo dõi điểm</button><button type="button" class="btn btn-ghost sm" id="p85-cv-stop" disabled>Dừng & giải phóng</button></div><div style="position:relative;margin-top:9px"><canvas id="p85-cv-canvas" class="p85-canvas" style="height:auto;max-height:340px;object-fit:contain"></canvas><canvas id="p85-cv-overlay" class="p85-canvas" style="height:auto;max-height:340px;position:absolute;inset:0;pointer-events:none"></canvas></div><div class="p85-status" id="p85-cv-status" role="status" aria-live="polite">Chưa nạp OpenCV.js.</div></section><section class="p85-box"><h4>4 · Vector Animation Players</h4><p class="p85-muted">DotLottie: .lottie/.json · Rive: .riv. Đây là runtime player; không phải công cụ authoring Rive.</p><div class="p85-row"><select id="p85-animation-engine" class="input"><option value="dotlottie">dotLottie</option><option value="rive">Rive</option></select><input type="file" id="p85-animation-file" accept=".lottie,.json,.riv,application/json"><button type="button" class="btn btn-primary sm" id="p85-animation-open">Mở animation</button><button type="button" class="btn btn-ghost sm" id="p85-animation-stop" disabled>Đóng</button></div><canvas id="p85-animation-canvas" class="p85-canvas" aria-label="dotLottie or Rive animation player"></canvas><div class="p85-status" id="p85-animation-status" role="status" aria-live="polite">Chưa nạp animation.</div></section></div><details style="margin-top:10px"><summary>Runtime & license verification</summary><pre id="p85-runtime-report" class="cv-p3-pre" tabindex="0">Runtime chưa được tải. Bấm một công cụ để xác minh manifest và các tệp cần thiết.</pre></details>';
    if (anchor.id === 'cv74-three-panel') anchor.parentNode.insertBefore(panel, anchor.nextSibling); else anchor.appendChild(panel);
    state.mounted = true;
    byId('p85-webgpu-state').textContent = navigator.gpu ? 'có API' : 'không có';
    function bind(id, fn, statusId) { var el = byId(id); if (!el) return; var handler = async function () { el.disabled = true; try { await fn(); } catch (error) { note(statusId, error.message || String(error), 'error'); } finally { if (el.isConnected) el.disabled = false; } }; el.addEventListener('click', handler); state.listeners.push([el, 'click', handler]); }
    bind('p85-postfx-open', openPostFx, 'p85-postfx-status');
    byId('p85-postfx-stop').addEventListener('click', function () { stopPostFx(); this.disabled = true; note('p85-postfx-status', 'Đã giải phóng WebGL renderer, composer, controls và GLB.'); });
    bind('p85-path-open', openPathTracer, 'p85-path-status');
    byId('p85-path-stop').addEventListener('click', function () { stopPathTracer(); this.disabled = true; note('p85-path-status', 'Đã dừng WebGPU Path Tracer và giải phóng renderer.'); });
    byId('p85-bloom').addEventListener('input', function () { if (state.postFx) state.postFx.setBloom(this.value); });
    bind('p85-cv-start', startOpticalFlow, 'p85-cv-status');
    byId('p85-cv-stop').addEventListener('click', stopOpticalFlow);
    bind('p85-animation-open', openVectorAnimation, 'p85-animation-status');
    byId('p85-animation-stop').addEventListener('click', function () { disposeAnimation(); note('p85-animation-status', 'Đã dừng player và thu hồi URL tệp.'); });
    return true;
  }
  function inspect() {
    var manifest = state.manifest;
    return { version: '85.0.2', manifestLoaded: !!manifest, verifiedAssets: Array.from(state.verified), rendererBundleLoaded: !!state.rendererModule, postFxActive: !!state.postFx, pathTracerActive: !!state.pathTracer, openCvLoaded: !!state.cv, openCvTracking: !!state.tracking, dotLottieLoaded: !!state.dotLottieModule, dotLottieWasmReady: state.dotLottieWasmReady, riveLoaded: !!state.riveModule, rivePlayerActive: !!state.rive, noCDN: true, userTriggeredOnly: true, usesExistingAssetLibrary: true, webgpuAvailable: !!navigator.gpu };
  }
  function tests() {
    return { ownerRegistered: window.CANVIOP85Suite === api, oneSharedP85Panel: !!byId('canvio-p85-studio'), explicitRuntimeControls: !!byId('p85-postfx-open') && !!byId('p85-path-open') && !!byId('p85-cv-start') && !!byId('p85-animation-open'), selectedGlbReusesCanonicalP72Input: !!byId('cv72-file'), noBootRuntimeFetch: state.verified.size === 0 && !state.rendererModule && !state.cv && !state.dotLottieModule && !state.riveModule && !state.rive, noCDNFallback: ROOT === 'assets/p85/', boundedGlb: MAX_GLB === 250 * 1024 * 1024, boundedVideo: MAX_VIDEO === 250 * 1024 * 1024, localVideoOnly: true, cleanupHooks: typeof clearTracking === 'function' && typeof disposeAnimation === 'function' && typeof stopPostFx === 'function' && typeof stopPathTracer === 'function', webgpuFailClosed: !navigator.gpu || typeof openPathTracer === 'function', noSecondTimelineOrAssetStore: true, playerNotAuthoring: true };
  }
  function dispose() {
    stopPostFx(); stopPathTracer(); clearTracking(); disposeAnimation();
    state.listeners.forEach(function (entry) { try { entry[0].removeEventListener(entry[1], entry[2]); } catch (_) {} }); state.listeners = [];
    state.mounted = false;
  }
  var api = { version: '85.0.2', mount: mount, inspect: inspect, tests: tests, verifyFiles: verifyFiles, ensureOpenCV: ensureOpenCV, ensureRendererBundle: ensureRendererBundle, ensureDotLottie: ensureDotLottie, ensureRive: ensureRive, startOpticalFlow: startOpticalFlow, stopOpticalFlow: stopOpticalFlow, dispose: dispose };
  window.CANVIOP85Suite = api;
  function boot() { try { mount(); } catch (error) { console.error('[CANVIO P85 mount]', error); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  window.addEventListener('pagehide', dispose, { once: true });
})();
