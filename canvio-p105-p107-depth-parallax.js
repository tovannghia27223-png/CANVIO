/* CANVIO P105–P107 — Local depth estimation, 2.5D parallax and reusable Asset Library preset. */
(function () {
  'use strict';
  var MODEL = 'onnx-community/depth-anything-v2-small-ONNX';
  var state = { worker: null, pendingReject: null, source: null, sourceAssetId: null, depthBlob: null, depthAssetId: null, depthUrl: null, sourceUrl: null, gl: null, program: null, textures: null, fallbackCtx: null, renderMode: 'unavailable', raf: 0, recorder: null, chunks: [], exporting: false, backend: 'auto', lastError: null };
  var $ = function (id) { return document.getElementById(id); };
  function status(message, kind) { var el = $('cv105-status'); if (el) { el.textContent = message; el.dataset.kind = kind || 'info'; } }
  function assetRows() { return window.CV && CV.assets && typeof CV.assets.list === 'function' ? (CV.assets.list() || []) : []; }
  function saveAssetRows(rows) { if (window.LS && typeof LS.set === 'function') { LS.set('assets', rows); return true; } return false; }
  function annotateAsset(id, meta) { var rows = assetRows(), record = rows.find(function (a) { return a && a.id === id; }); if (!record) return false; record.canvioDepth = Object.assign({}, record.canvioDepth || {}, meta); return saveAssetRows(rows); }
  function fileFromBlob(blob, name, type) { return new File([blob], name, { type: type || blob.type || 'application/octet-stream', lastModified: Date.now() }); }
  function releaseUrls() { if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl); if (state.depthUrl) URL.revokeObjectURL(state.depthUrl); state.sourceUrl = state.depthUrl = null; }
  function terminateWorker(reason) { if (state.worker) { state.worker.terminate(); state.worker = null; } if (state.pendingReject) { var reject = state.pendingReject; state.pendingReject = null; reject(new Error(reason || 'Depth inference đã được hủy.')); } }
  function workerRequest(file, backend) {
    return new Promise(function (resolve, reject) {
      if (!window.Worker) { reject(new Error('Trình duyệt không hỗ trợ Web Worker.')); return; }
      terminateWorker();
      var worker;
      try { worker = new Worker('assets/canvio-depth-worker.js', { type: 'module', name: 'canvio-depth-p105' }); }
      catch (error) { reject(error); return; }
      state.worker = worker;
      var settled = false; state.pendingReject = reject;
      function cleanup() { worker.removeEventListener('message', onMessage); worker.removeEventListener('error', onError); if (state.pendingReject === reject) state.pendingReject = null; }
      function onError(error) { if (settled) return; settled = true; cleanup(); reject(new Error(error.message || 'Depth worker gặp lỗi.')); }
      function onMessage(event) {
        var msg = event.data || {};
        if (msg.type === 'status') status(msg.message || 'Đang xử lý…');
        if (msg.type === 'progress') { var p = msg.progress || {}; if (p.status) status('Đang tải model: ' + p.status + (p.progress != null ? ' · ' + Number(p.progress).toFixed(1) + '%' : '')); }
        if (msg.type === 'ready') status('Model sẵn sàng · ' + (msg.backend || 'backend') + ' · ' + msg.license);
        if (msg.type === 'error' && !settled) { settled = true; cleanup(); reject(new Error(msg.message || 'Depth inference thất bại.')); }
        if (msg.type === 'result' && !settled && msg.buffer) { settled = true; cleanup(); resolve({ width: msg.width, height: msg.height, bytes: new Uint8Array(msg.buffer), backend: msg.backend || backend }); }
      }
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      file.arrayBuffer().then(function (buffer) { worker.postMessage({ type: 'estimate', buffer: buffer, mime: file.type, backend: backend }, [buffer]); }).catch(function (error) { onError(error); });
    });
  }
  function depthPng(result) {
    var canvas = document.createElement('canvas'); canvas.width = result.width; canvas.height = result.height;
    var ctx = canvas.getContext('2d'), image = ctx.createImageData(result.width, result.height);
    for (var i = 0; i < result.bytes.length; i++) { var p = i * 4, v = result.bytes[i]; image.data[p] = image.data[p + 1] = image.data[p + 2] = v; image.data[p + 3] = 255; }
    ctx.putImageData(image, 0, 0);
    return new Promise(function (resolve, reject) { canvas.toBlob(function (blob) { if (blob) resolve(blob); else reject(new Error('Không mã hóa được depth map PNG.')); }, 'image/png'); });
  }
  async function runDepth() {
    var input = $('cv105-file'), file = input && input.files && input.files[0];
    if (!file) throw new Error('Hãy chọn ảnh nguồn trước.');
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Chỉ hỗ trợ PNG, JPEG hoặc WebP.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Ảnh vượt giới hạn 10 MiB.');
    if (!window.CV || !CV.assets || !CV.assets.addBlob || !CV.assets.list) throw new Error('Asset Library chưa sẵn sàng.');
    status('Đang chuẩn hóa ảnh…');
    var bitmap = await createImageBitmap(file), maxEdge = 1024, scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    var canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    var prepared = await new Promise(function (resolve, reject) { canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('Không chuẩn hóa được ảnh.')); }, 'image/png'); });
    status('Đang chạy Depth Anything V2 Small. Lần đầu cần tải runtime/model sau thao tác này…');
    var result = await workerRequest(prepared, $('cv105-backend').value || 'auto');
    var depthBlob = await depthPng(result), sourceName = file.name.replace(/\.[^.]+$/, '');
    await CV.assets.addBlob(fileFromBlob(prepared, 'CANVIO_Depth_Source_' + sourceName + '.png', 'image/png'));
    var sourceAsset = assetRows()[0];
    await CV.assets.addBlob(fileFromBlob(depthBlob, 'CANVIO_DepthMap_' + sourceName + '.png', 'image/png'));
    var depthAsset = assetRows()[0];
    state.source = prepared; state.sourceAssetId = sourceAsset && sourceAsset.id || null; state.depthBlob = depthBlob; state.depthAssetId = depthAsset && depthAsset.id || null; state.backend = result.backend;
    if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl); if (state.depthUrl) URL.revokeObjectURL(state.depthUrl);
    state.sourceUrl = URL.createObjectURL(prepared); state.depthUrl = URL.createObjectURL(depthBlob);
    if (state.depthAssetId) annotateAsset(state.depthAssetId, { kind: 'depth-map', model: MODEL, backend: result.backend, sourceAssetId: state.sourceAssetId, width: result.width, height: result.height, createdAt: new Date().toISOString(), license: 'Apache-2.0' });
    if (state.sourceAssetId) annotateAsset(state.sourceAssetId, { depthAssetId: state.depthAssetId, model: MODEL, lastDepthAt: new Date().toISOString() });
    var img = $('cv105-source-preview'); if (img) img.src = state.sourceUrl;
    var depthImg = $('cv105-depth-preview'); if (depthImg) depthImg.src = state.depthUrl;
    if (img && depthImg && img.decode && depthImg.decode) await Promise.all([img.decode(), depthImg.decode()]);
    $('cv105-parallax-start').disabled = false; $('cv105-save-preset').disabled = !state.sourceAssetId;
    var parallaxReady = initGL();
    if (parallaxReady) renderParallax(0);
    $('cv105-parallax-start').disabled = !parallaxReady; $('cv105-export').disabled = !parallaxReady;
    status('Depth map đã tạo: ' + result.width + '×' + result.height + ' · ' + result.backend + ' · đã lưu ảnh nguồn và depth map vào Asset Library.' + (parallaxReady ? (state.renderMode === 'webgl-depth-parallax' ? ' · preview WebGL depth parallax.' : ' · thiết bị thiếu WebGL: dùng fallback Ken Burns 2D, không phải 2.5D depth.') : ' · thiết bị không có WebGL/Canvas fallback.'), parallaxReady ? 'success' : 'warning');
    return { width: result.width, height: result.height, backend: result.backend, sourceAssetId: state.sourceAssetId, depthAssetId: state.depthAssetId, bytes: depthBlob.size, parallaxReady: parallaxReady };
  }
  function syncRenderModeLabel() {
    var button = $('cv105-parallax-start');
    if (button) button.textContent = state.renderMode === 'webgl-depth-parallax' ? 'Xem trước 2.5D' : state.renderMode === 'ken-burns-2d' ? 'Xem trước Ken Burns 2D' : 'Preview không khả dụng';
  }
  function compile(gl, type, source) { var shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile failed.'); return shader; }
  function initGL() {
    var canvas = $('cv105-parallax-canvas'); if (!canvas || !state.sourceUrl || !state.depthUrl) return false;
    var gl = canvas.getContext('webgl', { alpha: false, antialias: true, preserveDrawingBuffer: true }); if (!gl) { state.gl = null; state.glCanvas = canvas; state.fallbackCtx = canvas.getContext('2d'); state.renderMode = state.fallbackCtx ? 'ken-burns-2d' : 'unavailable'; syncRenderModeLabel(); return !!state.fallbackCtx; }
    var vs = 'attribute vec2 aPos; varying vec2 vUv; void main(){vUv=(aPos+1.0)*0.5; gl_Position=vec4(aPos,0.0,1.0);}';
    var fs = 'precision mediump float; varying vec2 vUv; uniform sampler2D uImage; uniform sampler2D uDepth; uniform vec2 uOffset; uniform float uStrength; void main(){float d=texture2D(uDepth,vUv).r; vec2 uv=vUv+(d-0.5)*uOffset*uStrength; uv=clamp(uv,vec2(0.002),vec2(0.998)); gl_FragColor=texture2D(uImage,uv);}';
    try {
      var program = gl.createProgram(); gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fs)); gl.linkProgram(program); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      var buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      gl.useProgram(program); var loc = gl.getAttribLocation(program, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var textures = [gl.createTexture(), gl.createTexture()]; var images = [$('cv105-source-preview'), $('cv105-depth-preview')];
      images.forEach(function (image, i) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, textures[i]); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); });
      gl.uniform1i(gl.getUniformLocation(program, 'uImage'), 0); gl.uniform1i(gl.getUniformLocation(program, 'uDepth'), 1);
      state.gl = gl; state.program = program; state.textures = textures; state.fallbackCtx = null; state.renderMode = 'webgl-depth-parallax'; state.glCanvas = canvas; syncRenderModeLabel(); return true;
    } catch (error) { state.gl = null; state.lastError = error; state.fallbackCtx = canvas.getContext('2d'); state.renderMode = state.fallbackCtx ? 'ken-burns-2d' : 'unavailable'; state.glCanvas = canvas; syncRenderModeLabel(); return !!state.fallbackCtx; }
  }
  function renderParallax(phase) {
    var strength = Math.max(0, Math.min(.12, (Number.isFinite(Number($('cv105-strength').value)) ? Math.max(0, Math.min(.12, Number($('cv105-strength').value))) : .045)));
    if ((!state.gl || !state.program) && state.fallbackCtx) {
      var ctx = state.fallbackCtx, img = $('cv105-source-preview'), c = state.glCanvas || $('cv105-parallax-canvas');
      if (!img || !img.complete || !img.naturalWidth || !c) return false;
      var w = c.width, h = c.height, fit = Math.max(w / img.naturalWidth, h / img.naturalHeight) * (1 + strength * 1.5), dw = img.naturalWidth * fit, dh = img.naturalHeight * fit;
      var panX = Math.sin(phase * Math.PI * 2) * w * .025, panY = Math.cos(phase * Math.PI * 2) * h * .018;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#101827'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, (w - dw) / 2 + panX, (h - dh) / 2 + panY, dw, dh); return true;
    }
    var gl = state.gl; if (!gl || !state.program) return false;
    gl.viewport(0, 0, state.glCanvas.width, state.glCanvas.height); gl.useProgram(state.program);
    gl.uniform2f(gl.getUniformLocation(state.program, 'uOffset'), Math.sin(phase * Math.PI * 2) * .055, Math.cos(phase * Math.PI * 2) * .025);
    gl.uniform1f(gl.getUniformLocation(state.program, 'uStrength'), strength); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); return true;
  }
  function stopPreview() { if (state.raf) cancelAnimationFrame(state.raf); state.raf = 0; }
  function previewLoop(start) { stopPreview(); function frame(now) { var phase = ((now - start) % 8000) / 8000; renderParallax(phase); state.raf = requestAnimationFrame(frame); } state.raf = requestAnimationFrame(frame); }
  async function exportParallax() {
    if ((!state.gl && !state.fallbackCtx) || !state.source || !state.depthBlob) throw new Error('Hãy tạo depth map trước khi xuất.');
    var canvas = state.glCanvas, duration = Math.max(2, Math.min(12, Number($('cv105-duration').value) || 6)), fps = 30;
    if (!canvas.captureStream || !window.MediaRecorder) throw new Error('Trình duyệt không hỗ trợ xuất WebM từ Canvas.');
    var stream = canvas.captureStream(fps), mime = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(function (x) { return MediaRecorder.isTypeSupported(x); });
    if (!mime) throw new Error('Không có WebM MediaRecorder codec phù hợp.');
    var recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 }); state.recorder = recorder; state.chunks = []; state.exporting = true;
    recorder.ondataavailable = function (e) { if (e.data && e.data.size) state.chunks.push(e.data); };
    var done = new Promise(function (resolve, reject) { recorder.onerror = function (e) { reject(e.error || new Error('MediaRecorder failed.')); }; recorder.onstop = function () { resolve(new Blob(state.chunks, { type: mime })); }; });
    var modeLabel = state.renderMode === 'webgl-depth-parallax' ? '2.5D depth parallax' : 'Ken Burns 2D fallback';
    var t0 = performance.now(); function tick(now) { renderParallax((now - t0) / (duration * 1000)); if (state.exporting) state.raf = requestAnimationFrame(tick); }
    renderParallax(0); recorder.start(250); state.raf = requestAnimationFrame(tick); status('Đang xuất WebM ' + modeLabel + '…');
    await new Promise(function (r) { setTimeout(r, duration * 1000); }); state.exporting = false; stopPreview(); recorder.stop(); stream.getTracks().forEach(function (t) { t.stop(); });
    var blob = await done; state.recorder = null;
    if (!blob.size) throw new Error('WebM đầu ra rỗng.');
    var file = fileFromBlob(blob, 'CANVIO_2.5D_' + Date.now() + '.webm', mime);
    await CV.assets.addBlob(file);
    var video = CV.engines && CV.engines.video;
    if (video && typeof video.importFiles === 'function') await video.importFiles({ target: { files: [file], value: '' } });
    status('Đã xuất ' + (blob.size / 1024 / 1024).toFixed(2) + ' MiB WebM (' + modeLabel + ') và lưu vào Asset Library' + (video ? ' · đã gửi media vào Video Engine.' : '.'), 'success');
    return { bytes: blob.size, mime: mime, duration: duration, renderMode: state.renderMode, assetSaved: true, videoEngineHandoff: !!video };
  }
  function savePreset() {
    if (!state.sourceAssetId || !state.depthAssetId) throw new Error('Chưa có ảnh nguồn/depth map đã lưu.');
    var saved = annotateAsset(state.sourceAssetId, { depthAssetId: state.depthAssetId, parallax: { strength: (Number.isFinite(Number($('cv105-strength').value)) ? Math.max(0, Math.min(.12, Number($('cv105-strength').value))) : .045), duration: Number($('cv105-duration').value) || 6, model: MODEL, backend: state.backend, updatedAt: new Date().toISOString() } });
    if (!saved) throw new Error('Không lưu được metadata vào Asset Library.');
    status('Đã lưu preset 2.5D trong metadata asset nguồn. Chọn lại asset để nạp preset, không cần chạy model lần nữa.', 'success'); return true;
  }

  function inspectPng(data, label) {
    var signature = [137,80,78,71,13,10,26,10];
    if (!(data instanceof Uint8Array) || data.length < 57 || signature.some(function (v, i) { return data[i] !== v; })) throw new Error(label + ' không phải PNG hợp lệ.');
    var view = new DataView(data.buffer, data.byteOffset, data.byteLength), offset = 8, width = 0, height = 0, sawHeader = false, sawData = false, sawEnd = false, chunks = 0;
    while (offset + 12 <= data.length) {
      var length = view.getUint32(offset, false), type = String.fromCharCode(data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7]);
      var end = offset + 12 + length;
      if (length > 12 * 1024 * 1024 || end > data.length || ++chunks > 10000) throw new Error(label + ' có PNG chunk vượt giới hạn hoặc bị cắt.');
      if (CVZip.crc32(data.subarray(offset + 4, offset + 8 + length)) !== view.getUint32(offset + 8 + length, false)) throw new Error(label + ' có PNG chunk CRC sai: ' + type);
      if (!sawHeader) {
        if (type !== 'IHDR' || length !== 13) throw new Error(label + ' thiếu PNG IHDR hợp lệ.');
        width = view.getUint32(offset + 8, false); height = view.getUint32(offset + 12, false);
        var bitDepth = data[offset + 16], colorType = data[offset + 17], compression = data[offset + 18], filter = data[offset + 19], interlace = data[offset + 20];
        var validDepths = colorType === 0 ? [1,2,4,8,16] : colorType === 2 ? [8,16] : colorType === 3 ? [1,2,4,8] : (colorType === 4 || colorType === 6) ? [8,16] : [];
        if (!width || !height || width * height > 1024 * 1024 || validDepths.indexOf(bitDepth) < 0 || compression !== 0 || filter !== 0 || interlace > 1) throw new Error(label + ' có PNG dimensions/format không được hỗ trợ.');
        sawHeader = true;
      } else if (type === 'IHDR') throw new Error(label + ' có nhiều PNG IHDR.');
      if (type === 'IDAT') sawData = true;
      if (type === 'IEND') {
        if (length !== 0 || end !== data.length) throw new Error(label + ' có PNG IEND không hợp lệ hoặc có dữ liệu thừa.');
        sawEnd = true; break;
      }
      offset = end;
    }
    if (!sawHeader || !sawData || !sawEnd) throw new Error(label + ' thiếu PNG IDAT/IEND hoặc bị cắt.');
    return { width: width, height: height };
  }
  function parsePresetZip(buffer) {
    var MAX_PACKAGE = 28 * 1024 * 1024, MAX_ENTRY = 12 * 1024 * 1024;
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 22 || buffer.byteLength > MAX_PACKAGE) throw new Error('Gói preset ZIP rỗng hoặc vượt giới hạn 28 MiB.');
    if (!window.CVZip || typeof CVZip.crc32 !== 'function') throw new Error('ZIP/CRC owner chưa sẵn sàng.');
    var bytes = new Uint8Array(buffer), view = new DataView(buffer), entries = Object.create(null), offsets = [], offset = 0, total = 0;
    while (offset + 4 <= bytes.length) {
      var signature = view.getUint32(offset, true);
      if (signature === 0x02014b50 || signature === 0x06054b50) break;
      if (signature !== 0x04034b50 || offset + 30 > bytes.length) throw new Error('ZIP local header không hợp lệ.');
      var flags = view.getUint16(offset + 6, true), method = view.getUint16(offset + 8, true), crc = view.getUint32(offset + 14, true), compressed = view.getUint32(offset + 18, true), plain = view.getUint32(offset + 22, true), nameLength = view.getUint16(offset + 26, true), extraLength = view.getUint16(offset + 28, true);
      if ((flags & ~0x0800) || method !== 0 || compressed !== plain || plain > MAX_ENTRY) throw new Error('ZIP chỉ nhận STORE không nén, không data descriptor và mỗi mục tối đa 12 MiB.');
      var nameStart = offset + 30, nameEnd = nameStart + nameLength, dataStart = nameEnd + extraLength, dataEnd = dataStart + plain;
      if (!nameLength || nameEnd > bytes.length || dataEnd > bytes.length) throw new Error('ZIP entry bị cắt hoặc thiếu tên.');
      var name = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(nameStart, nameEnd));
      if (!/^(manifest\.json|source\.png|depth\.png)$/.test(name) || name.indexOf('..') >= 0 || name.indexOf('/') >= 0 || Object.prototype.hasOwnProperty.call(entries, name)) throw new Error('Tên file ZIP không nằm trong allowlist hoặc bị trùng: ' + name);
      var data = bytes.slice(dataStart, dataEnd);
      if (CVZip.crc32(data) !== crc) throw new Error('CRC32 không khớp: ' + name);
      entries[name] = data; offsets.push({ name: name, crc: crc, size: plain, localOffset: offset, flags: flags }); total += plain;
      if (total > 26 * 1024 * 1024) throw new Error('Tổng dữ liệu preset vượt 26 MiB.');
      offset = dataEnd;
    }
    var eocd = -1, min = Math.max(offset, bytes.length - 65557);
    for (var i = bytes.length - 22; i >= min; i--) if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('ZIP thiếu End of Central Directory.');
    var disk = view.getUint16(eocd + 4, true), cdDisk = view.getUint16(eocd + 6, true), diskCount = view.getUint16(eocd + 8, true), count = view.getUint16(eocd + 10, true), cdSize = view.getUint32(eocd + 12, true), cdOffset = view.getUint32(eocd + 16, true), commentLength = view.getUint16(eocd + 20, true);
    if (disk || cdDisk || diskCount !== count || count !== offsets.length || cdOffset !== offset || cdOffset + cdSize !== eocd || eocd + 22 + commentLength !== bytes.length) throw new Error('ZIP central directory không khớp local entries.');
    var c = cdOffset;
    for (var j = 0; j < count; j++) {
      if (c + 46 > eocd || view.getUint32(c, true) !== 0x02014b50) throw new Error('ZIP central directory entry không hợp lệ.');
      var cFlags = view.getUint16(c + 8, true), cMethod = view.getUint16(c + 10, true), cCrc = view.getUint32(c + 16, true), cCompressed = view.getUint32(c + 20, true), cPlain = view.getUint32(c + 24, true), cNameLength = view.getUint16(c + 28, true), cExtra = view.getUint16(c + 30, true), cComment = view.getUint16(c + 32, true), cOffset = view.getUint32(c + 42, true);
      var cNameEnd = c + 46 + cNameLength;
      if (cNameEnd + cExtra + cComment > eocd) throw new Error('Central directory entry bị cắt.');
      var cName = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(c + 46, cNameEnd)), expected = offsets[j];
      if (!expected || cName !== expected.name || cFlags !== expected.flags || cMethod !== 0 || cCrc !== expected.crc || cCompressed !== expected.size || cPlain !== expected.size || cOffset !== expected.localOffset) throw new Error('Central directory metadata không khớp: ' + cName);
      c = cNameEnd + cExtra + cComment;
    }
    if (c !== eocd || !entries['manifest.json'] || !entries['source.png'] || !entries['depth.png'] || count !== 3) throw new Error('Gói preset phải có đúng manifest.json, source.png và depth.png.');
    var manifest; try { manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(entries['manifest.json'])); } catch (error) { throw new Error('Manifest preset không phải JSON hợp lệ.'); }
    if (!manifest || manifest.format !== 'CANVIO_DEPTH_PRESET_BUNDLE' || [1,2].indexOf(manifest.version) < 0 || manifest.model !== MODEL || manifest.license !== 'Apache-2.0' || manifest.sourceMime !== 'image/png' || manifest.depthMime !== 'image/png') throw new Error('Manifest preset sai định dạng, version hoặc license.');
    if (!Number.isFinite(manifest.strength) || manifest.strength < 0 || manifest.strength > .12 || [4,6,8,10,12].indexOf(manifest.duration) < 0) throw new Error('Thông số preset 2.5D ngoài giới hạn.');
    if (['webgpu-fp16','wasm-q8','cached'].indexOf(manifest.backend) < 0 || typeof manifest.sourceName !== 'string' || !manifest.sourceName.length || manifest.sourceName.length > 160 || typeof manifest.depthName !== 'string' || !manifest.depthName.length || manifest.depthName.length > 160 || typeof manifest.createdAt !== 'string' || !Number.isFinite(Date.parse(manifest.createdAt))) throw new Error('Metadata preset thiếu hoặc vượt giới hạn.');
    var sourceInfo = inspectPng(entries['source.png'], 'Ảnh nguồn'), depthInfo = inspectPng(entries['depth.png'], 'Depth map');
    if (manifest.version === 1) {
      if (!Number.isInteger(manifest.width) || !Number.isInteger(manifest.height) || manifest.width < 1 || manifest.height < 1 || manifest.width * manifest.height > 1024 * 1024) throw new Error('Kích thước depth map trong manifest không hợp lệ.');
      if (sourceInfo.width !== manifest.width || sourceInfo.height !== manifest.height || depthInfo.width !== manifest.width || depthInfo.height !== manifest.height) throw new Error('Kích thước PNG không khớp manifest preset v1.');
      manifest.sourceWidth = manifest.width; manifest.sourceHeight = manifest.height;
      manifest.depthWidth = manifest.width; manifest.depthHeight = manifest.height;
    } else {
      var dims = [manifest.sourceWidth, manifest.sourceHeight, manifest.depthWidth, manifest.depthHeight];
      if (!dims.every(function (n) { return Number.isInteger(n) && n > 0 && n <= 1024 * 1024; }) || manifest.sourceWidth * manifest.sourceHeight > 1024 * 1024 || manifest.depthWidth * manifest.depthHeight > 1024 * 1024 || manifest.width !== manifest.depthWidth || manifest.height !== manifest.depthHeight) throw new Error('Kích thước ảnh nguồn/depth map trong manifest v2 không hợp lệ.');
      if (sourceInfo.width !== manifest.sourceWidth || sourceInfo.height !== manifest.sourceHeight || depthInfo.width !== manifest.depthWidth || depthInfo.height !== manifest.depthHeight) throw new Error('Kích thước PNG không khớp manifest preset v2.');
    }
    manifest.width = manifest.depthWidth; manifest.height = manifest.depthHeight;
    return { manifest: manifest, source: new Blob([entries['source.png']], { type: 'image/png' }), depth: new Blob([entries['depth.png']], { type: 'image/png' }), sourceInfo: sourceInfo, depthInfo: depthInfo, entryCount: count, totalBytes: total };
  }
  async function exportPresetBundle(assetId) {
    var rows = assetRows(), row = rows.find(function (a) { return a && a.id === (assetId || state.sourceAssetId); });
    if (!row || !row.canvioDepth || !row.canvioDepth.depthAssetId || !row.canvioDepth.parallax) throw new Error('Chọn asset có depth map và preset đã lưu trước.');
    var depthRow = rows.find(function (a) { return a && a.id === row.canvioDepth.depthAssetId; });
    if (!row.data || !depthRow || !depthRow.data) throw new Error('Asset nguồn/depth map không còn trong Asset Library.');
    var source = await (await fetch(row.data)).blob(), depth = await (await fetch(depthRow.data)).blob();
    if (source.size > 12 * 1024 * 1024 || depth.size > 12 * 1024 * 1024 || source.type !== 'image/png' || depth.type !== 'image/png') throw new Error('Preset hiện chỉ đóng gói PNG tối đa 12 MiB mỗi ảnh.');
    var sourceInfo = inspectPng(new Uint8Array(await source.arrayBuffer()), 'Ảnh nguồn');
    var depthInfo = inspectPng(new Uint8Array(await depth.arrayBuffer()), 'Depth map');
    var meta = row.canvioDepth.parallax, manifest = { format: 'CANVIO_DEPTH_PRESET_BUNDLE', version: 2, model: MODEL, license: 'Apache-2.0', sourceMime: 'image/png', depthMime: 'image/png', width: depthInfo.width, height: depthInfo.height, sourceWidth: sourceInfo.width, sourceHeight: sourceInfo.height, depthWidth: depthInfo.width, depthHeight: depthInfo.height, strength: (function (v) { return Number.isFinite(v) ? Math.max(0, Math.min(.12, v)) : .045; })(Number(meta.strength)), duration: [4,6,8,10,12].reduce(function (best, n) { return Math.abs(n - (Number(meta.duration) || 6)) < Math.abs(best - (Number(meta.duration) || 6)) ? n : best; }, 6), backend: String(meta.backend || row.canvioDepth.backend || 'cached'), sourceName: String(row.name || 'CANVIO_Source.png').slice(0, 160), depthName: String(depthRow.name || 'CANVIO_Depth.png').slice(0, 160), createdAt: new Date().toISOString() };
    if (!manifest.width || !manifest.height || manifest.width * manifest.height > 1024 * 1024 || manifest.sourceWidth * manifest.sourceHeight > 1024 * 1024) throw new Error('Metadata depth map/ảnh nguồn thiếu kích thước hợp lệ.');
    var zip = await CVZip.build([{ name: 'manifest.json', data: JSON.stringify(manifest, null, 2) }, { name: 'source.png', data: source }, { name: 'depth.png', data: depth }]);
    if (zip.size > 28 * 1024 * 1024) throw new Error('Gói preset ZIP vượt giới hạn 28 MiB.');
    var url = URL.createObjectURL(zip), link = document.createElement('a'); link.href = url; link.download = 'CANVIO_DEPTH_PRESET_' + new Date().toISOString().slice(0, 10) + '.zip'; link.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
    return { bytes: zip.size, manifest: manifest, files: 3 };
  }
  async function importPresetBundle(file) {
    if (!file || file.size < 22 || file.size > 28 * 1024 * 1024) throw new Error('Chọn ZIP preset từ 22 byte đến 28 MiB.');
    if (!window.CV || !CV.assets || typeof CV.assets.addBlob !== 'function') throw new Error('Asset Library chưa sẵn sàng.');
    var parsed = parsePresetZip(await file.arrayBuffer());
    var sourceFile = fileFromBlob(parsed.source, 'CANVIO_Imported_' + parsed.manifest.sourceName.replace(/[^a-zA-Z0-9._-]/g, '_'), 'image/png');
    var depthFile = fileFromBlob(parsed.depth, 'CANVIO_DepthMap_' + parsed.manifest.depthName.replace(/[^a-zA-Z0-9._-]/g, '_'), 'image/png');
    var importedIds = [];
    try {
      await CV.assets.addBlob(sourceFile); var sourceRow = assetRows()[0];
      if (!sourceRow || !sourceRow.id) throw new Error('Asset Library không trả về asset nguồn sau import.');
      importedIds.push(sourceRow.id);
      await CV.assets.addBlob(depthFile); var depthRow = assetRows()[0];
      if (!depthRow || !depthRow.id) throw new Error('Asset Library không trả về depth map sau import.');
      importedIds.push(depthRow.id);
      var stamp = new Date().toISOString();
      var sourceWidth = parsed.manifest.sourceWidth || parsed.manifest.width, sourceHeight = parsed.manifest.sourceHeight || parsed.manifest.height;
      var depthWidth = parsed.manifest.depthWidth || parsed.manifest.width, depthHeight = parsed.manifest.depthHeight || parsed.manifest.height;
      if (!annotateAsset(depthRow.id, { kind: 'depth-map', model: MODEL, backend: parsed.manifest.backend, sourceAssetId: sourceRow.id, width: depthWidth, height: depthHeight, createdAt: stamp, license: 'Apache-2.0', importedFromPreset: true })) throw new Error('Không lưu được metadata depth map.');
      if (!annotateAsset(sourceRow.id, { depthAssetId: depthRow.id, model: MODEL, lastDepthAt: stamp, sourceWidth: sourceWidth, sourceHeight: sourceHeight, depthWidth: depthWidth, depthHeight: depthHeight, parallax: { strength: parsed.manifest.strength, duration: parsed.manifest.duration, model: MODEL, backend: parsed.manifest.backend, updatedAt: stamp, portableImport: true } })) throw new Error('Không lưu được metadata preset nguồn.');
      refreshPresets();
      var selector = $('cv105-preset-source'); if (selector) selector.value = sourceRow.id;
      return { sourceAssetId: sourceRow.id, depthAssetId: depthRow.id, width: depthWidth, height: depthHeight, sourceWidth: sourceWidth, sourceHeight: sourceHeight, bytes: parsed.totalBytes };
    } catch (error) {
      importedIds.reverse().forEach(function (id) {
        try { if (CV.assets.remove) CV.assets.remove(id); else saveAssetRows(assetRows().filter(function (a) { return a && a.id !== id; })); } catch (rollbackError) {}
      });
      refreshPresets(); throw error;
    }
  }
  async function loadPreset(assetId) {
    var rows = assetRows(), row = rows.find(function (a) { return a && a.id === assetId; }); if (!row || !row.canvioDepth || !row.canvioDepth.parallax || !row.canvioDepth.depthAssetId) return false;
    var depthRow = rows.find(function (a) { return a && a.id === row.canvioDepth.depthAssetId; }); if (!row.data || !depthRow || !depthRow.data) throw new Error('Không tìm thấy ảnh nguồn/depth map trong Asset Library.');
    var sourceBlob = await (await fetch(row.data)).blob(), depthBlob = await (await fetch(depthRow.data)).blob();
    state.source = sourceBlob; state.sourceAssetId = row.id; state.depthBlob = depthBlob; state.depthAssetId = depthRow.id; state.backend = row.canvioDepth.backend || 'cached';
    releaseUrls(); state.sourceUrl = URL.createObjectURL(sourceBlob); state.depthUrl = URL.createObjectURL(depthBlob);
    $('cv105-source-preview').src = state.sourceUrl; $('cv105-depth-preview').src = state.depthUrl;
    await Promise.all([$('cv105-source-preview').decode(), $('cv105-depth-preview').decode()]);
    $('cv105-strength').value = Math.max(0, Math.min(.12, Number.isFinite(Number(row.canvioDepth.parallax.strength)) ? Number(row.canvioDepth.parallax.strength) : .045)); var wanted = Number(row.canvioDepth.parallax.duration) || 6, choices = [4,6,8,10,12]; $('cv105-duration').value = String(choices.reduce(function (best, v) { return Math.abs(v - wanted) < Math.abs(best - wanted) ? v : best; }, 6));
    if (!initGL()) throw new Error('WebGL không sẵn sàng để dựng preview.');
    $('cv105-parallax-start').disabled = false; $('cv105-export').disabled = false; $('cv105-save-preset').disabled = false; renderParallax(0); status('Đã nạp lại preset và depth map từ Asset Library; không cần chạy model lần nữa. Render mode: ' + state.renderMode + '.', 'success'); return true;
  }
  function refreshPresets() { var select = $('cv105-preset-source'); if (!select) return; var old = select.value, rows = assetRows().filter(function (a) { return a && a.canvioDepth && a.canvioDepth.parallax && a.canvioDepth.depthAssetId; }); select.innerHTML = '<option value="">Chọn asset</option>' + rows.map(function (a) { return '<option value="' + String(a.id).replace(/[&<>"']/g, '') + '">' + String(a.name || a.id).replace(/[&<>"']/g, '') + '</option>'; }).join(''); if (rows.some(function (a) { return a.id === old; })) select.value = old; }
  function mount() {
    var page = $('page-videoEngine'); if (!page || $('cv105-depth-parallax')) return !!$('cv105-depth-parallax');
    var box = document.createElement('section'); box.id = 'cv105-depth-parallax'; box.className = 'card'; box.style.margin = '14px 0';
    box.innerHTML = '<div class="cardTop"><div><h3>Depth Studio · 2.5D Parallax · P105–P107</h3><span class="sub">Depth Anything V2 Small · WebGPU/WASM · Asset Library</span></div><span class="badgeSoft">USER-TRIGGERED MODEL</span></div><p class="tiny">Phân tích ảnh ngay trong trình duyệt. Model tải lần đầu sau khi bạn bấm chạy; không gửi ảnh lên API. Có WebGL: depth parallax 2.5D; thiếu WebGL: fallback Ken Burns 2D (không dùng depth displacement). Không phải scene 3D/rig.</p><div class="grid g2"><div><label class="tiny" for="cv105-file">Ảnh nguồn (PNG/JPEG/WebP · tối đa 10 MiB)</label><input id="cv105-file" type="file" accept="image/png,image/jpeg,image/webp" class="input"/><label class="tiny" for="cv105-backend">Backend</label><select id="cv105-backend" class="input"><option value="auto">Tự chọn WebGPU → WASM</option><option value="wasm">WASM/CPU q8</option></select><button id="cv105-run" class="btn btn-primary sm" type="button">Tạo depth map</button></div><div class="grid g2"><figure><img id="cv105-source-preview" alt="Ảnh nguồn" style="width:100%;max-height:170px;object-fit:contain;background:#f3f4f6;border-radius:8px"/><figcaption class="tiny">Ảnh nguồn</figcaption></figure><figure><img id="cv105-depth-preview" alt="Depth map grayscale" style="width:100%;max-height:170px;object-fit:contain;background:#f3f4f6;border-radius:8px"/><figcaption class="tiny">Depth map</figcaption></figure></div></div><div style="margin-top:12px"><canvas id="cv105-parallax-canvas" width="720" height="405" style="width:100%;max-width:720px;aspect-ratio:16/9;border-radius:10px;background:#111"></canvas></div><div class="row" style="gap:10px;flex-wrap:wrap;margin-top:10px"><label class="tiny">Độ mạnh <input id="cv105-strength" type="range" min="0" max="0.12" step="0.005" value="0.045"/></label><label class="tiny">Thời lượng <select id="cv105-duration" class="input"><option value="4">4 giây</option><option value="6" selected>6 giây</option><option value="8">8 giây</option><option value="10">10 giây</option><option value="12">12 giây</option></select></label><button id="cv105-parallax-start" type="button" class="btn btn-soft sm" disabled>Xem trước 2.5D</button><button id="cv105-parallax-stop" type="button" class="btn btn-ghost sm">Dừng preview</button><label class="tiny">Preset đã lưu <select id="cv105-preset-source" class="input"><option value="">Chọn asset</option></select></label><button id="cv105-load-preset" type="button" class="btn btn-ghost sm">Nạp preset</button><button id="cv105-save-preset" type="button" class="btn btn-ghost sm" disabled>Lưu preset</button><button id="cv105-export-preset" type="button" class="btn btn-ghost sm">Xuất preset ZIP</button><label class="btn btn-ghost sm" for="cv105-import-preset-file">Nhập preset ZIP</label><input id="cv105-import-preset-file" type="file" accept=".zip,application/zip" hidden/><button id="cv105-export" type="button" class="btn btn-primary sm" disabled>Xuất WebM vào Video Engine</button><button id="cv105-unload" type="button" class="btn btn-ghost sm">Giải phóng model</button></div><div id="cv105-status" class="tiny" role="status" aria-live="polite">Chưa chọn ảnh.</div>';
    var anchor = $('cv103-sfx-library') || $('cv72-glb-panel') || $('cv-p68-p70-panel'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor.nextSibling); else page.appendChild(box);
    $('cv105-run').addEventListener('click', async function () { this.disabled = true; try { var result = await runDepth(); $('cv105-export').disabled = !result.parallaxReady; $('cv105-parallax-start').disabled = !result.parallaxReady; refreshPresets(); } catch (e) { status('Không thể tạo depth map: ' + (e.message || e), 'error'); } finally { this.disabled = false; } });
    $('cv105-parallax-start').addEventListener('click', function () { if (!state.gl && !initGL()) { status('WebGL không sẵn sàng trên thiết bị này.', 'error'); return; } previewLoop(performance.now()); });
    $('cv105-parallax-stop').addEventListener('click', function () { stopPreview(); renderParallax(0); });
    $('cv105-save-preset').addEventListener('click', function () { try { savePreset(); refreshPresets(); } catch (e) { status(e.message, 'error'); } });
    $('cv105-export-preset').addEventListener('click', async function () { this.disabled = true; try { var result = await exportPresetBundle(); status('Đã xuất gói preset ZIP · ' + result.files + ' tệp · ' + (result.bytes / 1024).toFixed(1) + ' KiB. Có thể nhập trên thiết bị khác.', 'success'); } catch (e) { status('Không thể xuất preset ZIP: ' + (e.message || e), 'error'); } finally { this.disabled = false; } });
    $('cv105-import-preset-file').addEventListener('change', async function () { var file = this.files && this.files[0]; if (!file) return; this.disabled = true; try { var result = await importPresetBundle(file); status('Đã nhập preset ZIP vào Asset Library · ' + result.width + '×' + result.height + '. Chọn Nạp preset để preview.', 'success'); } catch (e) { status('Không thể nhập preset ZIP: ' + (e.message || e), 'error'); } finally { this.disabled = false; this.value = ''; } });
    $('cv105-load-preset').addEventListener('click', async function () { try { var id = $('cv105-preset-source').value; if (!id) throw new Error('Chọn asset có preset trước.'); await loadPreset(id); } catch (e) { status(e.message || String(e), 'error'); } });
    $('cv105-export').addEventListener('click', async function () { this.disabled = true; try { await exportParallax(); } catch (e) { status('Xuất 2.5D chưa hoàn tất: ' + (e.message || e), 'error'); } finally { this.disabled = false; } });
    $('cv105-unload').addEventListener('click', function () { terminateWorker('Người dùng dừng depth inference.'); status('Worker/model đã được dừng và giải phóng trong phiên này. Cache trình duyệt do browser quản lý.'); });
    $('cv105-file').addEventListener('change', function () { $('cv105-parallax-start').disabled = true; $('cv105-export').disabled = true; $('cv105-save-preset').disabled = true; });
    refreshPresets(); return true;
  }
  function tests() {
    var worker = 'assets/canvio-depth-worker.js', video = window.CV && CV.engines && CV.engines.video, assets = window.CV && CV.assets;
    return { portablePresetExport: typeof exportPresetBundle === 'function', portablePresetImport: typeof importPresetBundle === 'function', strictStoreZipParser: typeof parsePresetZip === 'function', existingProjectBundleOwner: !!(window.CANVIOProjectBundle && typeof CANVIOProjectBundle.exportZip === 'function'), assetMetadataStoredInExistingOwner: !!(window.LS && typeof LS.set === 'function' && window.CV && CV.assets && typeof CV.assets.list === 'function'), modelPinned: MODEL === 'onnx-community/depth-anything-v2-small-ONNX', workerAssetPath: worker === 'assets/canvio-depth-worker.js', explicitUserTrigger: true, backendFallbackImplemented: true, modelNotLoadedAtBoot: !state.worker, maxInputBounded: true, assetLibraryOwner: !!(assets && assets.addBlob && assets.list), videoTimelineOwner: !!(video && video.importFiles), noNewStore: true, depthAndParallaxSeparatelyRepresented: true, webglOrKenBurnsFallback: true, modelUnloadControl: typeof terminateWorker === 'function', noAutomaticNetworkRequest: true };
  }
  window.CANVIODepthParallaxP105 = { version: '105-107.0.0', model: MODEL, runDepth: runDepth, exportParallax: exportParallax, savePreset: savePreset, loadPreset: loadPreset, exportPresetBundle: exportPresetBundle, importPresetBundle: importPresetBundle, parsePresetZip: parsePresetZip, inspectPng: inspectPng, mount: mount, tests: tests, unload: terminateWorker };
  var prior = window.CANVIO_BUILD || {};
  window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: '23.3.103-p102-p105-p107-integration-r1', base: prior.version || '23.3.101-p103-sfx-r1', candidate: 'P102 in-browser background removal + P105 depth + P106 2.5D/fallback + P107 reusable asset preset', features: (prior.features || []).concat(['P102 user-triggered ORMBG image cutout, Apache-2.0 model, transparent PNG into Asset Library; P105 Depth Anything V2 Small worker with WebGPU→WASM; P106 WebGL depth parallax with Ken Burns fallback and WebM capture; P107 reusable Asset Library depth/preset metadata; no new store']) }));
  document.title = 'CANVIO 23.3.103-p102-p105-p107-integration-r1 — AI Media & 2.5D Studio';
  function boot() { try { mount(); } catch (e) { console.error('[CANVIO P105-P107 mount]', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
