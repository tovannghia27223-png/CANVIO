/* P136 · Image Trace: ảnh -> SVG nhiều màu, chạy cục bộ. Lượng tử hoá median-cut (2–12 màu), tách lớp theo màu, dò đường biên theo cạnh điểm ảnh,
   gộp điểm thẳng hàng, đơn giản hoá Douglas-Peucker, tô evenodd. Ảnh lớn được thu nhỏ (≤ 512 px cạnh dài). Pixel trong suốt (alpha < 128) bị bỏ.
   Giới hạn: không làm mượt cong Bezier (đường gấp khúc), không tách nét đơn (stroke), ảnh chụp nhiều chuyển sắc cho kết quả dạng poster. */
(function () {
'use strict';
if (window.CVTraceP136) return;
var MAX_SIDE = 512;
function quantize(d, w, h, k) {
  k = Math.max(2, Math.min(12, Math.round(Number(k) || 6)));
  var bins = new Map(), i, key, b, n = w * h;
  for (i = 0; i < n; i++) { if (d[i * 4 + 3] < 128) continue; key = ((d[i * 4] >> 3) << 10) | ((d[i * 4 + 1] >> 3) << 5) | (d[i * 4 + 2] >> 3); b = bins.get(key); if (!b) bins.set(key, b = { c: 0, r: 0, g: 0, b: 0, key: key }); b.c++; b.r += d[i * 4]; b.g += d[i * 4 + 1]; b.b += d[i * 4 + 2]; }
  var list = Array.from(bins.values()), idx = new Int16Array(n).fill(-1);
  if (!list.length) return { palette: [], idx: idx };
  var boxes = [list];
  function rng(box) { var mn = [255, 255, 255], mx = [0, 0, 0]; box.forEach(function (e) { var v = [e.r / e.c, e.g / e.c, e.b / e.c]; for (var c = 0; c < 3; c++) { if (v[c] < mn[c]) mn[c] = v[c]; if (v[c] > mx[c]) mx[c] = v[c]; } }); var r = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]], ch = r[0] >= r[1] && r[0] >= r[2] ? 0 : (r[1] >= r[2] ? 1 : 2); return { ch: ch, range: r[ch] }; }
  while (boxes.length < k) {
    var bi = -1, best = 0.5;
    boxes.forEach(function (bx, j) { if (bx.length < 2) return; var s = rng(bx).range * Math.log(1 + bx.reduce(function (t, e) { return t + e.c; }, 0)); if (s > best) { best = s; bi = j; } });
    if (bi < 0) break;
    var bx = boxes[bi], ch = rng(bx).ch, nm = ['r', 'g', 'b'][ch];
    bx.sort(function (p, q) { return p[nm] / p.c - q[nm] / q.c; });
    var tot = bx.reduce(function (t, e) { return t + e.c; }, 0), acc = 0, cut = 1;
    for (i = 0; i < bx.length - 1; i++) { acc += bx[i].c; cut = i + 1; if (acc >= tot / 2) break; }
    boxes.splice(bi, 1, bx.slice(0, cut), bx.slice(cut));
  }
  var palette = boxes.map(function (bx) { var c = 0, r = 0, g = 0, bl = 0; bx.forEach(function (e) { c += e.c; r += e.r; g += e.g; bl += e.b; }); return [Math.round(r / c), Math.round(g / c), Math.round(bl / c)]; });
  var cache = new Map();
  function nearest(r, g, bl) { var ck = ((r >> 3) << 10) | ((g >> 3) << 5) | (bl >> 3), v = cache.get(ck); if (v !== undefined) return v; var bd = 1e12, bj = 0; palette.forEach(function (p, j) { var dd = (p[0] - r) * (p[0] - r) + (p[1] - g) * (p[1] - g) + (p[2] - bl) * (p[2] - bl); if (dd < bd) { bd = dd; bj = j; } }); cache.set(ck, bj); return bj; }
  for (i = 0; i < n; i++) if (d[i * 4 + 3] >= 128) idx[i] = nearest(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
  return { palette: palette, idx: idx };
}
function traceMask(mask, w, h) {
  var W1 = w + 1, edges = new Map(), x, y;
  function add(a, b) { var l = edges.get(a); if (l) l.push(b); else edges.set(a, [b]); }
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    if (!mask[y * w + x]) continue;
    if (y === 0 || !mask[(y - 1) * w + x]) add(y * W1 + x, y * W1 + x + 1);
    if (x === w - 1 || !mask[y * w + x + 1]) add(y * W1 + x + 1, (y + 1) * W1 + x + 1);
    if (y === h - 1 || !mask[(y + 1) * w + x]) add((y + 1) * W1 + x + 1, (y + 1) * W1 + x);
    if (x === 0 || !mask[y * w + x - 1]) add((y + 1) * W1 + x, y * W1 + x);
  }
  var loops = [];
  edges.forEach(function (_, start) {
    while (edges.get(start) && edges.get(start).length) {
      var pts = [], cur = start, guard = 0, arr;
      do { arr = edges.get(cur); if (!arr || !arr.length) break; pts.push(cur); cur = arr.pop(); guard++; } while (cur !== start && guard < 5000000);
      var out = pts.map(function (k) { return [k % W1, Math.floor(k / W1)]; }), m = out.length, keep = [], j;
      for (j = 0; j < m; j++) { var p = out[(j + m - 1) % m], c = out[j], q = out[(j + 1) % m]; if ((c[0] - p[0]) * (q[1] - c[1]) !== (c[1] - p[1]) * (q[0] - c[0])) keep.push(c); }
      if (keep.length >= 3) loops.push(keep);
    }
  });
  return loops;
}
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  var keep = new Uint8Array(pts.length), stack = [[0, pts.length - 1]], s, a, b, i, md, mi, dx, dy, len, dd;
  keep[0] = keep[pts.length - 1] = 1;
  while (stack.length) {
    s = stack.pop(); a = pts[s[0]]; b = pts[s[1]]; dx = b[0] - a[0]; dy = b[1] - a[1]; len = Math.sqrt(dx * dx + dy * dy) || 1; md = 0; mi = -1;
    for (i = s[0] + 1; i < s[1]; i++) { dd = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len; if (dd > md) { md = dd; mi = i; } }
    if (md > eps && mi > 0) { keep[mi] = 1; stack.push([s[0], mi], [mi, s[1]]); }
  }
  return pts.filter(function (_, j) { return keep[j]; });
}
function simplifyLoop(loop, eps) {
  if (eps <= 0 || loop.length < 8) return loop;
  var m = loop.length, half = 0, bd = -1, i;
  for (i = 1; i < m; i++) { var dd = (loop[i][0] - loop[0][0]) * (loop[i][0] - loop[0][0]) + (loop[i][1] - loop[0][1]) * (loop[i][1] - loop[0][1]); if (dd > bd) { bd = dd; half = i; } }
  var A = rdp(loop.slice(0, half + 1), eps), B = rdp(loop.slice(half).concat([loop[0]]), eps), res = A.slice(0, -1).concat(B.slice(0, -1));
  return res.length >= 3 ? res : loop;
}
function hex(c) { return '#' + c.map(function (v) { return ('0' + Math.max(0, Math.min(255, v)).toString(16)).slice(-2); }).join(''); }
function loopPath(pts, smooth) {
  var n = pts.length, t = Math.max(0, Math.min(1, Number(smooth) || 0));
  if (t <= 0 || n < 4) return 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join('L') + 'Z';
  function f(v) { return (Math.round(v * 1000) / 1000).toString(); }
  var out = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
  for (var i = 0; i < n; i++) {
    var p0 = pts[i], p1 = pts[(i + 1) % n], prev = pts[(i + n - 1) % n], next = pts[(i + 2) % n];
    var c1x = p0[0] + (p1[0] - prev[0]) * t / 6, c1y = p0[1] + (p1[1] - prev[1]) * t / 6;
    var c2x = p1[0] - (next[0] - p0[0]) * t / 6, c2y = p1[1] - (next[1] - p0[1]) * t / 6;
    out += 'C' + f(c1x) + ' ' + f(c1y) + ' ' + f(c2x) + ' ' + f(c2y) + ' ' + f(p1[0]) + ' ' + f(p1[1]);
  }
  return out + 'Z';
}
function traceImageData(img, opt) {
  opt = opt || {};
  var w = img && img.width, h = img && img.height, d = img && img.data;
  if (!(w >= 1 && h >= 1 && w <= 4096 && h <= 4096) || !d || d.length < w * h * 4) throw new Error('Ảnh không hợp lệ.');
  var q = quantize(d, w, h, opt.colors), eps = opt.detail == null ? 1 : Math.max(0, Math.min(5, Number(opt.detail))), smooth = Math.max(0, Math.min(1, Number(opt.smooth) || 0)), counts = new Array(q.palette.length).fill(0), i;
  for (i = 0; i < q.idx.length; i++) if (q.idx[i] >= 0) counts[q.idx[i]]++;
  var order = q.palette.map(function (_, j) { return j; }).sort(function (a, b) { return counts[b] - counts[a]; }), paths = [], total = 0;
  var opaque = counts.reduce(function (s, c) { return s + c; }, 0), bg = null;
  if (order.length && opaque >= w * h * 0.9) bg = order[0];
  order.forEach(function (j) {
    if (counts[j] === 0 || j === bg) return;
    var mask = new Uint8Array(w * h); for (var p = 0; p < mask.length; p++) mask[p] = q.idx[p] === j ? 1 : 0;
    var loops = traceMask(mask, w, h).map(function (l) { return simplifyLoop(l, eps); }), dstr = loops.map(function (l) { return loopPath(l, smooth); }).join('');
    if (dstr) { paths.push({ color: hex(q.palette[j]), d: dstr, area: counts[j], loops: loops.length }); total += loops.length; }
  });
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" shape-rendering="geometricPrecision">' + (bg != null ? '<rect width="' + w + '" height="' + h + '" fill="' + hex(q.palette[bg]) + '"/>' : '') + paths.map(function (p) { return '<path fill="' + p.color + '" stroke="' + p.color + '" stroke-width="0.5" fill-rule="evenodd" d="' + p.d + '"/>'; }).join('') + '</svg>';
  return { svg: svg, width: w, height: h, colors: q.palette.length, paths: paths.length, loops: total, background: bg != null ? hex(q.palette[bg]) : null, bytes: svg.length };
}
function fromBitmap(bmp, opt) {
  var s = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height)), w = Math.max(1, Math.round(bmp.width * s)), h = Math.max(1, Math.round(bmp.height * s)), c = document.createElement('canvas'); c.width = w; c.height = h;
  var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, w, h); var id = x.getImageData(0, 0, w, h);
  return traceImageData({ width: w, height: h, data: id.data }, opt);
}
function loadFile(file) {
  return new Promise(function (ok, no) {
    if (!file || !/^image\//.test(file.type || '')) { no(new Error('Chọn một tệp ảnh.')); return; }
    if (file.size > 30 * 1048576) { no(new Error('Ảnh quá lớn (>30 MB).')); return; }
    var u = URL.createObjectURL(file), im = new Image(); im.onload = function () { URL.revokeObjectURL(u); ok(im); }; im.onerror = function () { URL.revokeObjectURL(u); no(new Error('Không đọc được ảnh.')); }; im.src = u;
  });
}
function mount() {
  var page = document.querySelector('#page-imageStudio'); if (!page || page.querySelector('#cv136-card')) return false;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv136-card'; card.style.marginTop = '12px';
  card.innerHTML = '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><b>Ảnh → Vector (P136)</b><input type="file" id="cv136-file" accept="image/*" aria-label="Chọn ảnh"><label class="tiny">Số màu <input type="range" id="cv136-k" min="2" max="12" value="6"> <span id="cv136-kv">6</span></label><label class="tiny">Chi tiết <select id="cv136-d" class="input"><option value="0.5">Cao</option><option value="1" selected>Vừa</option><option value="2">Thấp (nhẹ hơn)</option></select></label><label class="tiny">Làm mượt Bezier <input type="range" id="cv136-s" min="0" max="100" value="0"><span id="cv136-sv">0%</span></label><button type="button" class="btn btn-soft sm" id="cv136-run">Chuyển sang SVG</button><button type="button" class="btn btn-ghost sm" id="cv136-dl" disabled>Tải SVG</button><span class="tiny" id="cv136-out" role="status" aria-live="polite">Logo, icon, hình ít màu cho kết quả tốt nhất; ảnh chụp sẽ thành dạng poster.</span></div><div id="cv136-prev" style="margin-top:8px;max-height:260px;overflow:auto"></div>';
  page.appendChild(card);
  var $ = function (s) { return card.querySelector(s); }, last = null;
  $('#cv136-k').addEventListener('input', function () { $('#cv136-kv').textContent = this.value; });
  $('#cv136-s').addEventListener('input', function () { $('#cv136-sv').textContent = this.value + '%'; });
  $('#cv136-run').addEventListener('click', function () {
    var f = $('#cv136-file').files[0], out = $('#cv136-out'), btn = this; if (!f) { out.textContent = 'Chọn một ảnh trước.'; return; }
    btn.disabled = true; out.textContent = 'Đang dò đường biên…';
    loadFile(f).then(function (im) { return new Promise(function (ok) { setTimeout(function () { ok(fromBitmap(im, { colors: $('#cv136-k').value, detail: $('#cv136-d').value, smooth: Number($('#cv136-s').value) / 100 })); }, 20); }); }).then(function (r) {
      last = r; var u = URL.createObjectURL(new Blob([r.svg], { type: 'image/svg+xml' })), im = new Image(); im.alt = 'Kết quả vector'; im.style.maxWidth = '100%'; im.onload = function () { URL.revokeObjectURL(u); }; im.src = u; var pv = $('#cv136-prev'); pv.innerHTML = ''; pv.appendChild(im); $('#cv136-dl').disabled = false;
      out.textContent = r.colors + ' màu, ' + r.paths + ' lớp, ' + r.loops + ' đường viền, Bezier ' + Math.round(Number($('#cv136-s').value)) + '%, ' + (r.bytes / 1024).toFixed(0) + ' KB' + (r.bytes > 800000 ? '. Nặng: giảm số màu hoặc chọn Chi tiết thấp.' : '.');
    }).catch(function (e) { out.textContent = String(e && e.message || e).slice(0, 140); }).then(function () { btn.disabled = false; });
  });
  $('#cv136-dl').addEventListener('click', function () { if (!last) return; var u = URL.createObjectURL(new Blob([last.svg], { type: 'image/svg+xml' })), a = document.createElement('a'); a.href = u; a.download = 'trace-' + Date.now().toString(36) + '.svg'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); });
  return true;
}
function ready() { try { mount(); var p = document.querySelector('#page-imageStudio'); if (p && !p.__cv136Obs && window.MutationObserver) { p.__cv136Obs = new MutationObserver(function () { if (!p.querySelector('#cv136-card')) mount(); }); p.__cv136Obs.observe(p, { childList: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function fixture() { var w = 40, h = 30, d = new Uint8ClampedArray(w * h * 4), x, y, p, c; for (y = 0; y < h; y++) for (x = 0; x < w; x++) { p = (y * w + x) * 4; c = [255, 255, 255]; if (x >= 5 && x < 20 && y >= 5 && y < 25) c = [220, 30, 30]; if (x >= 25 && x < 35 && y >= 10 && y < 20) c = [20, 60, 200]; if (x >= 8 && x < 12 && y >= 10 && y < 14) c = [255, 255, 255]; d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255; } return { width: w, height: h, data: d }; }
function tests() {
  var r = traceImageData(fixture(), { colors: 3, detail: 0 }), sq = new Uint8Array(16); for (var i = 0; i < 16; i++) sq[i] = ((i % 4) > 0 && (i % 4) < 3 && i > 3 && i < 12) ? 1 : 0;
  var loops = traceMask(sq, 4, 4), tr = { width: 4, height: 4, data: new Uint8ClampedArray(64) }, thrown = 0;
  [function () { traceImageData(null); }, function () { traceImageData({ width: 0, height: 5, data: [] }); }, function () { traceImageData({ width: 4, height: 4, data: new Uint8ClampedArray(3) }); }].forEach(function (f) { try { f(); } catch (e) { thrown++; } });
  var rect = rdp([[0, 0], [5, 0.2], [10, 0], [10, 10]], 1);
  var q = quantize(fixture().data, 40, 30, 3);
  return {
    quantizeFindsThreeColors: q.palette.length === 3 && q.idx[0] >= 0,
    traceProducesSvg: /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 40 30"/.test(r.svg) && r.svg.slice(-6) === '</svg>',
    hasBackgroundAndTwoLayers: r.background === '#ffffff' && r.paths === 2,
    holeBecomesSecondLoop: r.loops === 3, // red outer + red hole + blue
    simpleSquareIsOneLoopOfFourCorners: loops.length === 1 && loops[0].length === 4,
    rdpDropsNearlyCollinear: rect.length === 3,
    colorsEncoded: /fill="#dc1e1e"/.test(r.svg) && /fill="#143cc8"/.test(r.svg),
    transparentIgnored: (function () { try { var t = traceImageData(tr, { colors: 3 }); return t.paths === 0 && t.background === null; } catch (e) { return false; } })(),
    rejectsBadInput: thrown === 3,
    detailReducesPoints: traceImageData(fixture(), { colors: 3, detail: 5 }).bytes <= r.bytes,
    bezierSmoothingIsOptional: !/C[-0-9.]+ [-0-9.]+/.test(r.svg) && /C[-0-9.]+ [-0-9.]+/.test(traceImageData(fixture(), { colors: 3, detail: 0, smooth: 0.65 }).svg),
    smoothKeepsLayerAndLoopCounts: (function () { var z = traceImageData(fixture(), { colors: 3, detail: 0, smooth: 0.65 }); return z.paths === r.paths && z.loops === r.loops; })(),
    smoothnessClampedAndFinite: (function () { var a = loopPath([[0,0],[10,0],[10,10],[0,10]], 99), b = loopPath([[0,0],[10,0],[10,10],[0,10]], -2); return a.indexOf('C') >= 0 && !/NaN|Infinity/.test(a) && b.indexOf('C') < 0; })()
  };
}
window.CVTraceP136 = { version: '136.2.0', quantize: quantize, traceMask: traceMask, simplify: simplifyLoop, loopPath: loopPath, traceImageData: traceImageData, fromBitmap: fromBitmap, mount: mount, tests: tests };
})();
