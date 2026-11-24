/* P154 · Trình xem toàn cảnh (Panorama Capture) trong Video Studio.
   Nạp ảnh equirectangular 2:1, kéo để xoay (yaw/pitch), cuộn để zoom (FOV), bấm “Chụp góc nhìn” → khung ảnh theo tỉ lệ chọn,
   lưu vào Bảng cảm hứng (loại “Cảnh”) kèm yaw/pitch/FOV để dùng làm ảnh tham chiếu cho từng cảnh. Dựng hình bằng CPU (canvas 2D), không thêm thư viện. */
(function () {
'use strict';
if (window.CVPanoramaP154) return;
var D2R = Math.PI / 180;
/* src: {data: Uint8ClampedArray RGBA, w, h}. out: {data, w, h}. yaw/pitch/fov: độ. Chiếu phối cảnh (pinhole) từ equirectangular. */
function renderView(src, out, yaw, pitch, fov) {
  var ow = out.w, oh = out.h, sw = src.w, sh = src.h, sd = src.data, od = out.data;
  fov = Math.max(20, Math.min(120, +fov || 90)); pitch = Math.max(-89, Math.min(89, +pitch || 0)); yaw = +yaw || 0;
  var f = (ow / 2) / Math.tan(fov * D2R / 2), cy = Math.cos(yaw * D2R), sy = Math.sin(yaw * D2R), cp = Math.cos(pitch * D2R), sp = Math.sin(pitch * D2R);
  var x, y, dx, dy, dz, rx, ry, rz, lon, lat, u, v, i, j, o = 0, fx, fy, x0, y0, x1, a, b, c, d, w00, w10, w01, w11, k;
  for (y = 0; y < oh; y++) {
    for (x = 0; x < ow; x++, o += 4) {
      dx = x - ow / 2 + .5; dy = oh / 2 - y - .5; dz = f;
      /* xoay pitch quanh trục X rồi yaw quanh trục Y */
      ry = dy * cp + dz * sp; rz = -dy * sp + dz * cp; rx = dx;
      var X = rx * cy + rz * sy, Z = -rx * sy + rz * cy, Y = ry;
      lon = Math.atan2(X, Z); lat = Math.atan2(Y, Math.sqrt(X * X + Z * Z));
      u = (lon / (2 * Math.PI) + .5) * sw - .5; v = (.5 - lat / Math.PI) * sh - .5;
      x0 = Math.floor(u); y0 = Math.floor(v); fx = u - x0; fy = v - y0;
      x1 = x0 + 1; x0 = ((x0 % sw) + sw) % sw; x1 = ((x1 % sw) + sw) % sw;
      var ya = Math.max(0, Math.min(sh - 1, Math.floor(v))), yb = Math.max(0, Math.min(sh - 1, Math.floor(v) + 1));
      a = (ya * sw + x0) * 4; b = (ya * sw + x1) * 4; c = (yb * sw + x0) * 4; d = (yb * sw + x1) * 4;
      w00 = (1 - fx) * (1 - fy); w10 = fx * (1 - fy); w01 = (1 - fx) * fy; w11 = fx * fy;
      for (k = 0; k < 3; k++) od[o + k] = sd[a + k] * w00 + sd[b + k] * w10 + sd[c + k] * w01 + sd[d + k] * w11;
      od[o + 3] = 255;
    }
  }
  return out;
}
var RATIOS = { '16:9': [16, 9], '9:16': [9, 16], '1:1': [1, 1], '4:3': [4, 3] };
function outSize(ratio, longSide) { var r = RATIOS[ratio] || RATIOS['16:9'], s = longSide / Math.max(r[0], r[1]); return { w: Math.round(r[0] * s), h: Math.round(r[1] * s) }; }
function isEquirect(w, h) { return w > 0 && h > 0 && Math.abs(w / h - 2) < .06; }
function toast(t) { try { if (window.CV && CV.toast) CV.toast(t); } catch (e) {} }
var pano = null; /* {src, name, img} */
function mount() {
  var page = document.getElementById('page-videoStudio'); if (!page) return false; if (page.querySelector('#cv154-card')) return true;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv154-card'; card.style.cssText = 'margin:0 0 14px;padding:14px';
  card.innerHTML = '<div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><div><h3 style="margin:0">Trình xem toàn cảnh</h3><p class="tiny" style="margin:2px 0 0">Nạp ảnh toàn cảnh 360° (tỉ lệ 2:1), kéo để xoay, chọn góc rồi chụp làm ảnh tham chiếu cho từng cảnh. Chạy trên máy bạn.</p></div></div>'
    + '<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap;align-items:center"><button class="btn btn-primary sm" id="cv154-open" type="button">Nạp ảnh toàn cảnh</button><input type="file" id="cv154-file" accept="image/*" style="display:none" aria-label="Chọn ảnh toàn cảnh 2:1">'
    + '<label class="tiny">Tỉ lệ <select class="input" id="cv154-ratio" style="width:auto"><option>16:9</option><option>9:16</option><option>1:1</option><option>4:3</option></select></label>'
    + '<button class="btn btn-soft sm" id="cv154-shot" type="button" disabled>Chụp góc nhìn</button><span id="cv154-msg" class="tiny" role="status" aria-live="polite"></span></div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;align-items:flex-start"><div style="flex:2 1 320px;min-width:0"><canvas id="cv154-view" width="640" height="360" tabindex="0" aria-label="Khung xem toàn cảnh. Kéo chuột hoặc dùng phím mũi tên để xoay, + và - để zoom" style="width:100%;border-radius:10px;background:#111;touch-action:none;cursor:grab"></canvas></div>'
    + '<div style="display:grid;gap:8px;flex:1 1 200px;min-width:0"><label class="tiny">Xoay ngang (yaw) <span id="cv154-yv">0°</span><input type="range" id="cv154-yaw" min="-180" max="180" value="0" style="width:100%"></label>'
    + '<label class="tiny">Ngẩng/cúi (pitch) <span id="cv154-pv">0°</span><input type="range" id="cv154-pitch" min="-85" max="85" value="0" style="width:100%"></label>'
    + '<label class="tiny">Góc nhìn (FOV) <span id="cv154-fv">90°</span><input type="range" id="cv154-fov" min="30" max="110" value="90" style="width:100%"></label>'
    + '<div class="tiny" id="cv154-list" style="display:flex;gap:6px;flex-wrap:wrap"></div></div></div>';
  var head = page.querySelector('.head'); if (head && head.parentNode) head.parentNode.insertBefore(card, head.nextSibling); else page.insertBefore(card, page.firstChild);
  var $ = function (s) { return card.querySelector(s); }, cv = $('#cv154-view'), cx = cv.getContext('2d', { willReadFrequently: true }), msg = $('#cv154-msg');
  var yaw = 0, pitch = 0, fov = 90, busy = false, again = false;
  function say(t, bad) { msg.textContent = t; msg.style.color = bad ? '#b4233b' : ''; }
  function sync() { $('#cv154-yaw').value = Math.round(yaw); $('#cv154-pitch').value = Math.round(pitch); $('#cv154-fov').value = Math.round(fov); $('#cv154-yv').textContent = Math.round(yaw) + '°'; $('#cv154-pv').textContent = Math.round(pitch) + '°'; $('#cv154-fv').textContent = Math.round(fov) + '°'; }
  function wrap(a) { while (a > 180) a -= 360; while (a < -180) a += 360; return a; }
  function paint() {
    if (!pano) { cx.fillStyle = '#111'; cx.fillRect(0, 0, cv.width, cv.height); cx.fillStyle = '#9ca3af'; cx.font = '16px sans-serif'; cx.textAlign = 'center'; cx.fillText('Chưa có ảnh toàn cảnh', cv.width / 2, cv.height / 2); return; }
    if (busy) { again = true; return; } busy = true;
    requestAnimationFrame(function () { var out = cx.createImageData(cv.width, cv.height); renderView(pano.src, { data: out.data, w: out.width, h: out.height }, yaw, pitch, fov); cx.putImageData(out, 0, 0); busy = false; if (again) { again = false; paint(); } });
  }
  function set(y, p, f) { yaw = wrap(y); pitch = Math.max(-85, Math.min(85, p)); fov = Math.max(30, Math.min(110, f)); sync(); paint(); }
  function load(file) {
    if (!file || !/^image\//.test(file.type)) { say('Chỉ nhận tệp ảnh.', true); return; }
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      var w = im.naturalWidth, h = im.naturalHeight; URL.revokeObjectURL(url);
      if (!isEquirect(w, h)) say('Ảnh ' + w + '×' + h + ' không đúng tỉ lệ 2:1; vẫn hiển thị nhưng có thể méo.', true); else say('Đã nạp ' + w + '×' + h + '. Kéo trong khung để xoay.');
      var s = Math.min(1, 2048 / w), c = document.createElement('canvas'); c.width = Math.max(2, Math.round(w * s)); c.height = Math.max(2, Math.round(h * s));
      var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, c.width, c.height); var d = x.getImageData(0, 0, c.width, c.height);
      pano = { src: { data: d.data, w: c.width, h: c.height }, name: file.name.replace(/\.[^.]+$/, ''), full: im.src || '' };
      $('#cv154-shot').disabled = false; set(0, 0, 90);
    };
    im.onerror = function () { URL.revokeObjectURL(url); say('Không đọc được ảnh.', true); }; im.src = url;
  }
  $('#cv154-open').addEventListener('click', function () { $('#cv154-file').click(); });
  $('#cv154-file').addEventListener('change', function (e) { load(e.target.files[0]); e.target.value = ''; });
  ['yaw', 'pitch', 'fov'].forEach(function (k) { $('#cv154-' + k).addEventListener('input', function () { set(+$('#cv154-yaw').value, +$('#cv154-pitch').value, +$('#cv154-fov').value); }); });
  var drag = null;
  cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, yaw: yaw, pitch: pitch }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
  cv.addEventListener('pointermove', function (e) { if (!drag) return; var k = fov / cv.clientWidth; set(drag.yaw - (e.clientX - drag.x) * k, drag.pitch + (e.clientY - drag.y) * k, fov); });
  ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { drag = null; cv.style.cursor = 'grab'; }); });
  cv.addEventListener('wheel', function (e) { if (!pano) return; e.preventDefault(); set(yaw, pitch, fov + (e.deltaY > 0 ? 4 : -4)); }, { passive: false });
  cv.addEventListener('keydown', function (e) { var m = { ArrowLeft: [-5, 0, 0], ArrowRight: [5, 0, 0], ArrowUp: [0, 5, 0], ArrowDown: [0, -5, 0], '+': [0, 0, -5], '=': [0, 0, -5], '-': [0, 0, 5] }[e.key]; if (m) { e.preventDefault(); set(yaw + m[0], pitch + m[1], fov + m[2]); } });
  function shot() {
    if (!pano) return; var ratio = $('#cv154-ratio').value, sz = outSize(ratio, 1280), c = document.createElement('canvas'); c.width = sz.w; c.height = sz.h;
    var x = c.getContext('2d'), out = x.createImageData(sz.w, sz.h); renderView(pano.src, { data: out.data, w: out.width, h: out.height }, yaw, pitch, fov); x.putImageData(out, 0, 0);
    var url = c.toDataURL('image/jpeg', .9), B = window.CVBoardP153;
    if (!B) { say('Chưa sẵn sàng lưu (thiếu Bảng cảm hứng).', true); return; }
    var n = B.list().filter(function (i) { return i.extra && i.extra.pano === pano.name; }).length + 1;
    B.addDataUrl(url, { name: pano.name + ' · góc ' + n, kind: 'Cảnh', note: 'yaw ' + Math.round(yaw) + '° · pitch ' + Math.round(pitch) + '° · FOV ' + Math.round(fov) + '°', extra: { pano: pano.name, yaw: Math.round(yaw), pitch: Math.round(pitch), fov: Math.round(fov), ratio: ratio } })
      .then(function (it) { say('Đã lưu “' + it.name + '” vào Bảng cảm hứng (loại Cảnh).'); toast('Đã chụp góc nhìn'); list(); }, function (e) { say(e.message, true); });
  }
  function list() { var B = window.CVBoardP153; if (!B) return; var l = B.list().filter(function (i) { return i.extra && i.extra.pano; }).slice(0, 8); $('#cv154-list').innerHTML = l.map(function (i) { return '<img src="' + i.thumb + '" alt="' + String(i.name).replace(/"/g, '') + '" title="' + String(i.note).replace(/"/g, '') + '" style="width:64px;height:40px;object-fit:cover;border-radius:6px">'; }).join(''); }
  $('#cv154-shot').addEventListener('click', shot);
  paint(); list(); return true;
}
function ready() { var n = 0; (function loop() { try { if (mount()) return; } catch (e) {} if (++n < 40) setTimeout(loop, 250); })(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
window.CVPanoramaP154 = { version: '154.0.0', renderView: renderView, outSize: outSize, isEquirect: isEquirect, RATIOS: RATIOS, mount: mount };
})();
