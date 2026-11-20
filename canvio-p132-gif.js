/* P132 (phần xuất GIF động) · bộ mã hoá GIF89a thuần JS: bảng màu 3-3-2 + dither Bayer 4x4, LZW, vòng lặp NETSCAPE2.0.
   Thêm nút "Xuất GIF từ timeline" vào thẻ #cv127-quality: tua timeline, chụp #vtCanvas, mã hoá, tải .gif. Chỉ đọc timeline.
   Giới hạn: 256 màu cố định (ảnh động gradient có thể bị vân), tối đa 600 khung, rộng ≤ 640 px. Chưa có APNG/WebP động. */
(function () {
'use strict';
if (window.CVGifP132) return;
var MAX_FRAMES = 600, MAX_W = 640;
var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function toIndexed(rgba, w, h) {
  var out = new Uint8Array(w * h), i = 0, x, y, t, r, g, b, d;
  for (y = 0; y < h; y++) for (x = 0; x < w; x++, i++) {
    d = (BAYER[(y & 3) * 4 + (x & 3)] - 7.5) * 2; p = i * 4;
    r = Math.max(0, Math.min(255, rgba[p] + d)); g = Math.max(0, Math.min(255, rgba[p + 1] + d)); b = Math.max(0, Math.min(255, rgba[p + 2] + d * 2));
    out[i] = ((r >> 5) << 5) | ((g >> 5) << 2) | (b >> 6);
  }
  return out;
}
var p;
function palette() { var a = new Uint8Array(768), i; for (i = 0; i < 256; i++) { a[i * 3] = Math.round(((i >> 5) & 7) * 255 / 7); a[i * 3 + 1] = Math.round(((i >> 2) & 7) * 255 / 7); a[i * 3 + 2] = Math.round((i & 3) * 255 / 3); } return a; }
function lzw(idx) {
  var out = [], clear = 256, eoi = 257, next = 258, size = 9, dict = new Map(), cur = 0, bits = 0, buf = [];
  function put(code) { cur |= code << bits; bits += size; while (bits >= 8) { buf.push(cur & 255); cur >>>= 8; bits -= 8; } }
  put(clear);
  var prefix = idx[0], i, k, key, v;
  for (i = 1; i < idx.length; i++) {
    k = idx[i]; key = prefix * 256 + k; v = dict.get(key);
    if (v !== undefined) { prefix = v; continue; }
    put(prefix);
    if (next < 4096) { dict.set(key, next++); if (next - 1 === (1 << size) && size < 12) size++; }
    else { put(clear); dict.clear(); next = 258; size = 9; }
    prefix = k;
  }
  put(prefix); put(eoi); if (bits > 0) buf.push(cur & 255);
  for (i = 0; i < buf.length; i += 255) { var n = Math.min(255, buf.length - i); out.push(n); for (k = 0; k < n; k++) out.push(buf[i + k]); }
  out.push(0); return out;
}
function encode(frames, opt) {
  opt = opt || {};
  if (!Array.isArray(frames) || !frames.length || frames.length > MAX_FRAMES) throw new Error('Cần 1–' + MAX_FRAMES + ' khung.');
  var w = frames[0].w, h = frames[0].h;
  if (!(w >= 1 && h >= 1 && w <= 4096 && h <= 4096) || frames.some(function (f) { return f.w !== w || f.h !== h || !f.data || f.data.length < w * h * 4; })) throw new Error('Khung không hợp lệ hoặc khác kích thước.');
  var delay = Math.max(2, Math.min(6000, Math.round(Number(opt.delayCs) || 10))), loop = opt.loop === 0 ? 0 : (opt.loop === false ? -1 : 0), o = [];
  function u16(n) { o.push(n & 255, (n >> 8) & 255); }
  'GIF89a'.split('').forEach(function (c) { o.push(c.charCodeAt(0)); });
  u16(w); u16(h); o.push(0xF7, 0, 0);
  var pal = palette(); for (var i = 0; i < 768; i++) o.push(pal[i]);
  if (loop === 0) { o.push(0x21, 0xFF, 11); 'NETSCAPE2.0'.split('').forEach(function (c) { o.push(c.charCodeAt(0)); }); o.push(3, 1, 0, 0, 0); }
  frames.forEach(function (f) {
    o.push(0x21, 0xF9, 4, 0x04, delay & 255, (delay >> 8) & 255, 0, 0);
    o.push(0x2C); u16(0); u16(0); u16(w); u16(h); o.push(0, 8);
    var codes = lzw(toIndexed(f.data, w, h)); for (var j = 0; j < codes.length; j++) o.push(codes[j]);
  });
  o.push(0x3B); return new Uint8Array(o);
}
function captureTimeline(opt, onProgress) {
  var v = window.CV && CV.engines && CV.engines.video, s = v && v._state && v._state(), cv = document.getElementById('vtCanvas');
  if (!s || !cv || !v.seek) return Promise.reject(new Error('Mở Video Engine trước.'));
  var dur = Math.max(1, Number(s.duration) || 1), fps = Math.max(1, Math.min(15, Number(opt && opt.fps) || 8)), n = Math.min(MAX_FRAMES, Math.max(1, Math.round(dur * fps))), w = Math.min(MAX_W, Math.max(64, Math.round(Number(opt && opt.width) || 400))), h = Math.round(w * cv.height / cv.width), c = document.createElement('canvas'), x, frames = [], i = 0, old = s.time;
  c.width = w; c.height = h; x = c.getContext('2d', { willReadFrequently: true });
  return new Promise(function (ok, no) {
    (function step() {
      if (i >= n) { try { v.seek(old); } catch (e) {} ok({ frames: frames, delayCs: Math.round(100 / fps) }); return; }
      try { v.seek(i / fps); } catch (e) { no(e); return; }
      setTimeout(function () { try { x.drawImage(cv, 0, 0, w, h); var d = x.getImageData(0, 0, w, h); frames.push({ w: w, h: h, data: d.data }); } catch (e) { no(e); return; } i++; if (onProgress) onProgress(i, n); step(); }, 60);
    })();
  });
}
function mount() {
  var page = document.querySelector('#page-videoEngine'), card = page && page.querySelector('#cv127-quality');
  if (!card || card.querySelector('#cv132-gif')) return false;
  var row = document.createElement('div'); row.className = 'row'; row.style.cssText = 'margin-top:10px;align-items:center;flex-wrap:wrap;gap:8px';
  row.innerHTML = '<b class="tiny">Ảnh động (P132)</b><label class="tiny">FPS <input type="number" id="cv132-fps" value="8" min="1" max="15" style="width:52px"></label><label class="tiny">Rộng px <input type="number" id="cv132-w" value="400" min="64" max="640" style="width:64px"></label><button type="button" class="btn btn-soft sm" id="cv132-gif">Xuất GIF từ timeline</button><span class="tiny" id="cv132-out" role="status" aria-live="polite">GIF 256 màu, lặp vô hạn, không có tiếng.</span>';
  card.insertBefore(row, card.querySelector('#cv127q-list'));
  row.querySelector('#cv132-gif').addEventListener('click', function () {
    var out = row.querySelector('#cv132-out'), btn = this; btn.disabled = true; out.textContent = 'Đang chụp khung…';
    captureTimeline({ fps: row.querySelector('#cv132-fps').value, width: row.querySelector('#cv132-w').value }, function (a, b) { out.textContent = 'Chụp khung ' + a + '/' + b + '…'; }).then(function (r) {
      out.textContent = 'Đang mã hoá…'; return new Promise(function (ok) { setTimeout(function () { ok(encode(r.frames, { delayCs: r.delayCs })); }, 20); }).then(function (bytes) {
        var u = URL.createObjectURL(new Blob([bytes], { type: 'image/gif' })), a = document.createElement('a'); a.href = u; a.download = 'canvio-' + Date.now().toString(36) + '.gif'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
        out.textContent = 'Đã xuất GIF ' + r.frames.length + ' khung (' + (bytes.length / 1048576).toFixed(2) + ' MB).' + (bytes.length > 15 * 1048576 ? ' Khá nặng: giảm FPS/chiều rộng.' : '');
      });
    }).catch(function (e) { out.textContent = String(e && e.message || e).slice(0, 140); }).then(function () { btn.disabled = false; });
  });
  return true;
}
function ready() { try { mount(); var pg = document.querySelector('#page-videoEngine'); if (pg && !pg.__cv132Obs && window.MutationObserver) { pg.__cv132Obs = new MutationObserver(function () { if (!pg.querySelector('#cv132-gif')) mount(); }); pg.__cv132Obs.observe(pg, { childList: true, subtree: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function solid(w, h, r, g, b) { var d = new Uint8ClampedArray(w * h * 4); for (var i = 0; i < w * h; i++) { d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; } return { w: w, h: h, data: d }; }
function tests() {
  var g = encode([solid(16, 8, 255, 0, 0), solid(16, 8, 0, 0, 255)], { delayCs: 20 }), s = String.fromCharCode.apply(null, g.slice(0, 6)), thrown = 0;
  [function () { encode([]); }, function () { encode([solid(4, 4, 0, 0, 0), solid(5, 4, 0, 0, 0)]); }, function () { encode([{ w: 2, h: 2, data: new Uint8ClampedArray(3) }]); }, function () { encode(null); }].forEach(function (f) { try { f(); } catch (e) { thrown++; } });
  var big = new Uint8ClampedArray(64 * 64 * 4); for (var i = 0; i < big.length; i++) big[i] = (i * 2654435761 >>> 24) & 255;
  var noisy = encode([{ w: 64, h: 64, data: big }]);
  return {
    headerAndTrailer: s === 'GIF89a' && g[g.length - 1] === 0x3B, sizeFields: g[6] === 16 && g[8] === 8,
    hasLoopExtension: String.fromCharCode.apply(null, g.slice(0, 900)).indexOf('NETSCAPE2.0') > 0,
    delayWritten: (function () { for (var k = 0; k < g.length - 8; k++) if (g[k] === 0x21 && g[k + 1] === 0xF9) return g[k + 4] === 20 && g[k + 5] === 0; return false; })(),
    twoImageDescriptors: Array.prototype.filter.call(g, function (v, k) { return v === 0x2C && g[k + 1] === 0 && g[k + 2] === 0 && g[k + 9] === 0 && g[k + 10] === 8; }).length >= 2,
    solidFramesCompress: g.length < 1100, noisyFrameStillValid: noisy[noisy.length - 1] === 0x3B && noisy.length > 800,
    rejectsBadInput: thrown === 4
  };
}
window.CVGifP132 = { version: '132.1.0', encode: encode, captureTimeline: captureTimeline, mount: mount, tests: tests };
})();
