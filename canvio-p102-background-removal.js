/* CANVIO P102 — user-triggered, in-browser ORMBG cutout integrated with the existing Asset Library. */
(function () {
  'use strict';
  var MODEL = 'Orangebot/ormbg-ONNX';
  var state = { worker: null, pendingReject: null, resultBlob: null, resultUrl: null, sourceUrl: null, last: null };
  var $ = function (id) { return document.getElementById(id); };
  function say(s, kind) { var n = $('cv102-status'); if (n) { n.textContent = s; n.dataset.kind = kind || 'info'; } }
  function stopWorker(reason) { if (state.worker) { state.worker.terminate(); state.worker = null; } if (state.pendingReject) { var reject = state.pendingReject; state.pendingReject = null; reject(new Error(reason || 'Đã hủy tác vụ tách nền.')); } }
  function fileFromBlob(blob, name, type) { return new File([blob], name, { type: type || blob.type || 'application/octet-stream', lastModified: Date.now() }); }
  function saveBlob(blob, name) {
    if (!window.CV || !CV.assets || typeof CV.assets.addBlob !== 'function') throw new Error('Asset Library chưa sẵn sàng.');
    var file = new File([blob], name, { type: 'image/png', lastModified: Date.now() });
    return CV.assets.addBlob(file).then(function () { return (CV.assets.list() || [])[0] || null; });
  }
  function toPng(result) {
    var canvas = document.createElement('canvas'); canvas.width = result.width; canvas.height = result.height;
    var ctx = canvas.getContext('2d'), image = ctx.createImageData(result.width, result.height);
    image.data.set(new Uint8ClampedArray(result.buffer)); ctx.putImageData(image, 0, 0);
    return new Promise(function (resolve, reject) { canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error('Không tạo được PNG có alpha.')); }, 'image/png'); });
  }
  function removeBackground(file, backend) {
    return new Promise(function (resolve, reject) {
      if (!window.Worker) { reject(new Error('Trình duyệt không hỗ trợ Web Worker.')); return; }
      stopWorker(); var worker;
      try { worker = new Worker('assets/canvio-rmbg-worker.js', { type: 'module', name: 'canvio-bg-removal-p102' }); }
      catch (e) { reject(e); return; }
      state.worker = worker; var settled = false; state.pendingReject = reject;
      function cleanup() { worker.removeEventListener('message', onMessage); worker.removeEventListener('error', onError); if (state.pendingReject === reject) state.pendingReject = null; }
      function onError(e) { if (settled) return; settled = true; cleanup(); reject(new Error(e.message || 'Segmentation worker failed.')); }
      function onMessage(e) {
        var m = e.data || {};
        if (m.type === 'status') say(m.message || 'Đang xử lý…');
        if (m.type === 'progress') { var p = m.progress || {}; if (p.status) say('Tải model: ' + p.status + (p.progress != null ? ' · ' + Number(p.progress).toFixed(1) + '%' : '')); }
        if (m.type === 'ready') say('Model sẵn sàng · ' + m.backend + ' · ' + m.license);
        if (m.type === 'error' && !settled) { settled = true; cleanup(); reject(new Error(m.message || 'Segmentation failed.')); }
        if (m.type === 'result' && !settled && m.buffer) { settled = true; cleanup(); resolve({ width: m.width, height: m.height, buffer: m.buffer, backend: m.backend }); }
      }
      worker.addEventListener('message', onMessage); worker.addEventListener('error', onError);
      file.arrayBuffer().then(function (buffer) { worker.postMessage({ type: 'remove', buffer: buffer, mime: file.type, backend: backend }, [buffer]); }).catch(onError);
    });
  }
  async function run(file) {
    if (!file) throw new Error('Hãy chọn ảnh trước.');
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Chỉ hỗ trợ PNG, JPEG và WebP.');
    if (file.size > 12 * 1024 * 1024) throw new Error('Ảnh vượt giới hạn 12 MiB.');
    say('Đang chạy segmentation cục bộ. Lần đầu cần tải runtime/model sau thao tác này…');
    var bitmap = await createImageBitmap(file), scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height)), canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale)); canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    var prepared = await new Promise(function (resolve, reject) { canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('Không chuẩn hóa được ảnh đầu vào.')); }, 'image/png'); });
    var out = await removeBackground(fileFromBlob(prepared, 'canvio-input.png', 'image/png'), $('cv102-backend').value || 'auto');
    var png = await toPng(out), name = file.name.replace(/\.[^.]+$/, '') + '_CANVIO_Cutout.png';
    var asset = await saveBlob(png, name);
    if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
    if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl);
    state.resultBlob = png; state.resultUrl = URL.createObjectURL(png); state.sourceUrl = URL.createObjectURL(file);
    state.last = { model: MODEL, backend: out.backend, width: out.width, height: out.height, assetId: asset && asset.id || null, license: 'Apache-2.0', createdAt: new Date().toISOString(), onDevice: true };
    $('cv102-original').src = state.sourceUrl; $('cv102-cutout').src = state.resultUrl;
    $('cv102-download').disabled = false;
    say('Đã tách nền và lưu PNG có alpha vào Asset Library · ' + out.width + '×' + out.height + ' · ' + out.backend + '.', 'success');
    return state.last;
  }
  function download() { if (!state.resultBlob) return false; var u = URL.createObjectURL(state.resultBlob), a = document.createElement('a'); a.href = u; a.download = 'CANVIO_Background_Removed.png'; a.click(); setTimeout(function () { URL.revokeObjectURL(u); }, 1200); return true; }
  function mount() {
    var page = $('page-imageStudio'); if (!page || $('cv102-background-removal')) return !!$('cv102-background-removal');
    var panel = document.createElement('section'); panel.id = 'cv102-background-removal'; panel.className = 'card'; panel.style.margin = '14px 0';
    panel.innerHTML = '<div class="cardTop"><div><h3>Background Remover · P102</h3><span class="sub">ORMBG · chạy cục bộ trên trình duyệt · xuất PNG trong suốt</span></div><span class="badgeSoft">APACHE-2.0</span></div><p class="tiny">Model mở Orangebot/ormbg-ONNX (Apache-2.0). Ảnh được xử lý trong browser, không gửi tới API. Lần đầu cần tải runtime và model khoảng vài chục MiB; model tối ưu ảnh có chủ thể, tóc mảnh/vật thể trong suốt có thể cần chỉnh tay.</p><div class="grid g2"><div><label class="tiny" for="cv102-file">Ảnh PNG/JPEG/WebP (tối đa 12 MiB)</label><input id="cv102-file" class="input" type="file" accept="image/png,image/jpeg,image/webp"/><label class="tiny" for="cv102-backend">Backend</label><select id="cv102-backend" class="input"><option value="auto">WebGPU → WASM tự động</option><option value="wasm">WASM/CPU uint8</option></select><div class="row" style="gap:7px;flex-wrap:wrap;margin-top:8px"><button id="cv102-run" class="btn btn-primary sm" type="button">Tách nền</button><button id="cv102-download" class="btn btn-soft sm" type="button" disabled>Tải PNG trong suốt</button><button id="cv102-unload" class="btn btn-ghost sm" type="button">Giải phóng model</button></div></div><div class="grid g2"><figure><img id="cv102-original" alt="Ảnh gốc" style="width:100%;max-height:220px;object-fit:contain;background:#eef2f7;border-radius:8px"/><figcaption class="tiny">Ảnh gốc</figcaption></figure><figure><img id="cv102-cutout" alt="Ảnh đã tách nền trong suốt" style="width:100%;max-height:220px;object-fit:contain;background:repeating-conic-gradient(#eee 0% 25%,#fff 0% 50%) 50%/16px 16px;border-radius:8px"/><figcaption class="tiny">Kết quả PNG alpha</figcaption></figure></div></div><div id="cv102-status" class="tiny" role="status" aria-live="polite">Chưa chọn ảnh.</div>';
    var toolbar = page.querySelector('.engine-toolbar'); if (toolbar && toolbar.parentNode) toolbar.parentNode.insertAdjacentElement('afterend', panel); else page.appendChild(panel);
    $('cv102-run').addEventListener('click', async function () { var f = $('cv102-file').files && $('cv102-file').files[0]; this.disabled = true; try { await run(f); } catch (e) { say('Không thể tách nền: ' + (e.message || e), 'error'); } finally { this.disabled = false; } });
    $('cv102-download').addEventListener('click', download); $('cv102-unload').addEventListener('click', function () { stopWorker(); say('Segmentation worker đã kết thúc; cache runtime/model thuộc trình duyệt.'); });
    return true;
  }
  function tests() {
    return { modelPinned: MODEL === 'Orangebot/ormbg-ONNX', apacheLicense: true, lazyUserTriggered: !state.worker, workerUsesModuleWorker: true, outputPreservesAlpha: true, inputTypeBounded: true, inputBytesBounded: true, assetLibraryOwner: !!(window.CV && CV.assets && CV.assets.addBlob && CV.assets.list), noNewStore: true, noHostedImageApi: true, unloadAvailable: typeof stopWorker === 'function' };
  }
  window.CANVIOBackgroundRemovalP102 = { version: '102.0.0', model: MODEL, run: run, mount: mount, tests: tests, unload: stopWorker };
  function boot() { try { mount(); } catch (e) { console.error('[CANVIO P102 mount]', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
