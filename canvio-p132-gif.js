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

/* ---- APNG encoder: PNG chunks + APNG frame control, bounded raw size ---- */
var MAX_APNG_RAW = 64 * 1024 * 1024, CRC_TABLE = (function () {
  var t = new Uint32Array(256), i, c, k;
  for (i = 0; i < 256; i++) { c = i; for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[i] = c >>> 0; }
  return t;
})();
function pngU32(out, at, n) { out[at] = (n >>> 24) & 255; out[at + 1] = (n >>> 16) & 255; out[at + 2] = (n >>> 8) & 255; out[at + 3] = n & 255; }
function crc32Parts(type, data) {
  var c = 0xFFFFFFFF, i;
  for (i = 0; i < type.length; i++) c = CRC_TABLE[(c ^ type[i]) & 255] ^ (c >>> 8);
  for (i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  var name = new Uint8Array(4), i, out = new Uint8Array(data.length + 12);
  for (i = 0; i < 4; i++) name[i] = type.charCodeAt(i);
  pngU32(out, 0, data.length); out.set(name, 4); out.set(data, 8);
  pngU32(out, 8 + data.length, crc32Parts(name, data)); return out;
}
function zlibStored(data) {
  var blocks = Math.max(1, Math.ceil(data.length / 65535)), out = new Uint8Array(2 + data.length + blocks * 5 + 4);
  out[0] = 0x78; out[1] = 0x01;
  var pos = 2, offset = 0, a = 1, b = 0, i, len, final, nlen;
  while (offset < data.length) {
    len = Math.min(65535, data.length - offset); final = offset + len >= data.length; nlen = (~len) & 65535;
    out[pos++] = final ? 1 : 0; out[pos++] = len & 255; out[pos++] = (len >>> 8) & 255; out[pos++] = nlen & 255; out[pos++] = (nlen >>> 8) & 255;
    out.set(data.subarray(offset, offset + len), pos);
    for (i = offset; i < offset + len; i++) { a = (a + data[i]) % 65521; b = (b + a) % 65521; }
    pos += len; offset += len;
  }
  pngU32(out, pos, (((b << 16) | a) >>> 0)); return out;
}
function apngFrameData(frame, w, h) {
  var stride = w * 4, raw = new Uint8Array((stride + 1) * h), y, from, to;
  for (y = 0; y < h; y++) { to = y * (stride + 1); raw[to] = 0; from = y * stride; raw.set(frame.data.subarray ? frame.data.subarray(from, from + stride) : Array.prototype.slice.call(frame.data, from, from + stride), to + 1); }
  return raw;
}
function encodeApng(frames, opt) {
  opt = opt || {};
  if (!Array.isArray(frames) || !frames.length || frames.length > MAX_FRAMES) throw new Error('APNG cần 1–' + MAX_FRAMES + ' khung.');
  var first = frames[0], w = Number(first && first.w), h = Number(first && first.h);
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 4096 || h > 4096) throw new Error('Kích thước APNG không hợp lệ.');
  var rawBytes = (w * 4 + 1) * h * frames.length;
  if (rawBytes > MAX_APNG_RAW) throw new Error('APNG vượt ngân sách 64 MiB dữ liệu khung; hãy giảm FPS hoặc chiều rộng.');
  if (frames.some(function (f) { return !f || Number(f.w) !== w || Number(f.h) !== h || !f.data || f.data.length < w * h * 4; })) throw new Error('Khung APNG không hợp lệ hoặc khác kích thước.');
  var delay = Math.max(1, Math.min(6000, Math.round(Number(opt.delayCs) || 10))), plays = opt.loop === false ? 1 : 0;
  var chunks = [], size = 0, seq = 0, i;
  function add(c) { chunks.push(c); size += c.length; }
  add(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));
  var ihdr = new Uint8Array(13); pngU32(ihdr, 0, w); pngU32(ihdr, 4, h); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; add(pngChunk('IHDR', ihdr));
  var actl = new Uint8Array(8); pngU32(actl, 0, frames.length); pngU32(actl, 4, plays); add(pngChunk('acTL', actl));
  for (i = 0; i < frames.length; i++) {
    var fctl = new Uint8Array(26); pngU32(fctl, 0, seq++); pngU32(fctl, 4, w); pngU32(fctl, 8, h); pngU32(fctl, 12, 0); pngU32(fctl, 16, 0);
    fctl[20] = (delay >>> 8) & 255; fctl[21] = delay & 255; fctl[22] = 0; fctl[23] = 100; fctl[24] = 0; fctl[25] = 0; add(pngChunk('fcTL', fctl));
    var compressed = zlibStored(apngFrameData(frames[i], w, h));
    if (i === 0) add(pngChunk('IDAT', compressed));
    else { var fd = new Uint8Array(4 + compressed.length); pngU32(fd, 0, seq++); fd.set(compressed, 4); add(pngChunk('fdAT', fd)); }
  }
  add(pngChunk('IEND', new Uint8Array(0)));
  var result = new Uint8Array(size), at = 0; chunks.forEach(function (c) { result.set(c, at); at += c.length; });
  return result;
}
function inspectApng(bytes) {
  var rows = [], pos = 8, ok = bytes && bytes.length >= 20 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  function read32(a, p) { return (((a[p] << 24) >>> 0) + (a[p + 1] << 16) + (a[p + 2] << 8) + a[p + 3]) >>> 0; }
  if (!ok) return { ok: false, chunks: rows };
  while (pos + 12 <= bytes.length) {
    var len = read32(bytes, pos), typeBytes = bytes.subarray(pos + 4, pos + 8), type = String.fromCharCode(typeBytes[0], typeBytes[1], typeBytes[2], typeBytes[3]), end = pos + 12 + len;
    if (end > bytes.length) return { ok: false, chunks: rows };
    var data = bytes.subarray(pos + 8, pos + 8 + len), crc = read32(bytes, pos + 8 + len);
    rows.push({ type: type, length: len, crcOk: crc === crc32Parts(typeBytes, data), data: data });
    pos = end; if (type === 'IEND') break;
  }
  return { ok: pos === bytes.length && rows.length > 0 && rows[rows.length - 1].type === 'IEND' && rows.every(function (x) { return x.crcOk; }), chunks: rows };
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
  row.innerHTML = '<b class="tiny">Ảnh động (P132)</b><label class="tiny">FPS <input type="number" id="cv132-fps" value="8" min="1" max="15" style="width:52px"></label><label class="tiny">Rộng px <input type="number" id="cv132-w" value="400" min="64" max="640" style="width:64px"></label><button type="button" class="btn btn-soft sm" id="cv132-gif">Xuất GIF</button><button type="button" class="btn btn-soft sm" id="cv132-apng">Xuất APNG</button><span class="tiny" id="cv132-out" role="status" aria-live="polite">GIF 256 màu hoặc APNG RGBA; không có tiếng.</span>';
  card.insertBefore(row, card.querySelector('#cv127q-list'));
  function runExport(format, button) {
    var out = row.querySelector('#cv132-out'); button.disabled = true; out.textContent = 'Đang chụp khung…';
    captureTimeline({ fps: row.querySelector('#cv132-fps').value, width: row.querySelector('#cv132-w').value }, function (a, b) { out.textContent = 'Chụp khung ' + a + '/' + b + '…'; }).then(function (r) {
      out.textContent = 'Đang mã hoá…';
      return new Promise(function (ok) { setTimeout(function () { ok(format === 'apng' ? encodeApng(r.frames, { delayCs: r.delayCs }) : encode(r.frames, { delayCs: r.delayCs })); }, 20); }).then(function (bytes) {
        var ext = format === 'apng' ? 'apng' : 'gif', mime = format === 'apng' ? 'image/apng' : 'image/gif';
        var u = URL.createObjectURL(new Blob([bytes], { type: mime })), a = document.createElement('a'); a.href = u; a.download = 'canvio-' + Date.now().toString(36) + '.' + ext; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
        out.textContent = 'Đã xuất ' + ext.toUpperCase() + ' ' + r.frames.length + ' khung (' + (bytes.length / 1048576).toFixed(2) + ' MB).' + (bytes.length > 15 * 1048576 ? ' Khá nặng: giảm FPS/chiều rộng.' : '');
      });
    }).catch(function (e) { out.textContent = String(e && e.message || e).slice(0, 180); }).then(function () { button.disabled = false; });
  }
  row.querySelector('#cv132-gif').addEventListener('click', function () { runExport('gif', this); });
  row.querySelector('#cv132-apng').addEventListener('click', function () { runExport('apng', this); });
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
  var ap = encodeApng([solid(16, 8, 255, 0, 0), solid(16, 8, 0, 0, 255)], { delayCs: 20 }), parsed = inspectApng(ap), types = parsed.chunks.map(function (x) { return x.type; });
  var actl = parsed.chunks.filter(function (x) { return x.type === 'acTL'; })[0], ctrls = parsed.chunks.filter(function (x) { return x.type === 'fcTL'; });
  var apngThrown = 0; [function () { encodeApng([]); }, function () { encodeApng([solid(4, 4, 0, 0, 0), solid(5, 4, 0, 0, 0)]); }, function () { encodeApng([{ w: 2, h: 2, data: new Uint8ClampedArray(3) }]); }, function () { encodeApng([{ w: 4096, h: 4096, data: new Uint8Array(1) }]); }].forEach(function (f) { try { f(); } catch (e) { apngThrown++; } });
  return {
    headerAndTrailer: s === 'GIF89a' && g[g.length - 1] === 0x3B, sizeFields: g[6] === 16 && g[8] === 8,
    hasLoopExtension: String.fromCharCode.apply(null, g.slice(0, 900)).indexOf('NETSCAPE2.0') > 0,
    delayWritten: (function () { for (var k = 0; k < g.length - 8; k++) if (g[k] === 0x21 && g[k + 1] === 0xF9) return g[k + 4] === 20 && g[k + 5] === 0; return false; })(),
    twoImageDescriptors: Array.prototype.filter.call(g, function (v, k) { return v === 0x2C && g[k + 1] === 0 && g[k + 2] === 0 && g[k + 9] === 0 && g[k + 10] === 8; }).length >= 2,
    solidFramesCompress: g.length < 1100, noisyFrameStillValid: noisy[noisy.length - 1] === 0x3B && noisy.length > 800, rejectsBadGifInput: thrown === 4,
    apngSignatureAndIend: parsed.ok && parsed.chunks[parsed.chunks.length - 1].type === 'IEND',
    apngFrameAndPlayCounts: !!actl && actl.data.length === 8 && actl.data[3] === 2 && actl.data[7] === 0,
    apngSequenceAndFrameData: ctrls.length === 2 && types.filter(function (x) { return x === 'IDAT'; }).length === 1 && types.filter(function (x) { return x === 'fdAT'; }).length === 1,
    apngEveryChunkHasValidCrc: parsed.chunks.every(function (x) { return x.crcOk; }),
    apngDelayWritten: ctrls[0] && ctrls[0].data[20] === 0 && ctrls[0].data[21] === 20 && ctrls[0].data[22] === 0 && ctrls[0].data[23] === 100,
    rejectsBadApngInputAndOversize: apngThrown === 4
  };
}
window.CVGifP132 = { version: '132.2.0', encode: encode, encodeApng: encodeApng, inspectApng: inspectApng, captureTimeline: captureTimeline, mount: mount, tests: tests };
})();
