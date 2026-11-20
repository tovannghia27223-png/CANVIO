/* P134 (phần đo màu) · Histogram RGB/Luma, Waveform (độ sáng theo cột) và Vectorscope (Cb/Cr, BT.709) cho khung đang xem của Video Engine.
   Chỉ đọc canvas xem trước #vtCanvas; không đổi timeline. Cập nhật bằng nút và khi kéo thanh tua. Chưa có Auto Reframe (cần dò mặt/vật thể). */
(function () {
'use strict';
if (window.CVScopesP134) return;
function luma(r, g, b) { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function histogram(d) {
  var R = new Uint32Array(256), G = new Uint32Array(256), B = new Uint32Array(256), Y = new Uint32Array(256), i, n = 0;
  for (i = 0; i + 3 < d.length; i += 4) { if (d[i + 3] === 0) continue; R[d[i]]++; G[d[i + 1]]++; B[d[i + 2]]++; Y[Math.min(255, Math.round(luma(d[i], d[i + 1], d[i + 2])))]++; n++; }
  return { r: R, g: G, b: B, y: Y, pixels: n };
}
function waveform(d, w, h, cols) {
  cols = Math.max(8, Math.min(w, cols || 256)); var acc = new Uint32Array(cols * 256), x, y, cx, p, l;
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) { p = (y * w + x) * 4; if (d[p + 3] === 0) continue; l = Math.min(255, Math.round(luma(d[p], d[p + 1], d[p + 2]))); cx = Math.min(cols - 1, Math.floor(x * cols / w)); acc[l * cols + cx]++; }
  return { cols: cols, acc: acc };
}
function vectorscope(d) {
  var acc = new Uint32Array(256 * 256), i, r, g, b, cb, cr, x, y;
  for (i = 0; i + 3 < d.length; i += 4) { if (d[i + 3] === 0) continue; r = d[i]; g = d[i + 1]; b = d[i + 2]; cb = (b - luma(r, g, b)) / 1.8556; cr = (r - luma(r, g, b)) / 1.5748; x = Math.max(0, Math.min(255, Math.round(128 + cb))); y = Math.max(0, Math.min(255, Math.round(128 - cr))); acc[y * 256 + x]++; }
  return { acc: acc };
}
function stats(h) {
  var n = h.pixels || 1, i, s = 0, lo = 0, hi = 0; for (i = 0; i < 256; i++) { s += i * h.y[i]; if (i <= 5) lo += h.y[i]; if (i >= 250) hi += h.y[i]; }
  return { meanLuma: s / n, clippedBlacks: lo / n, clippedWhites: hi / n };
}
function advice(st) {
  var out = [];
  if (st.clippedWhites > 0.05) out.push('Vùng sáng bị cháy ' + Math.round(st.clippedWhites * 100) + '%: giảm độ sáng/exposure.');
  if (st.clippedBlacks > 0.2) out.push('Vùng tối bị đen kịt ' + Math.round(st.clippedBlacks * 100) + '%: nâng bóng đổ.');
  if (st.meanLuma < 50) out.push('Khung khá tối (độ sáng TB ' + Math.round(st.meanLuma) + '/255).');
  if (st.meanLuma > 205) out.push('Khung rất sáng (độ sáng TB ' + Math.round(st.meanLuma) + '/255).');
  return out.length ? out.join(' ') : 'Độ sáng cân bằng, không thấy cháy sáng hay đen kịt đáng kể.';
}
function paintHist(cv, h) {
  var x = cv.getContext('2d'), W = cv.width, H = cv.height, mx = 1, i, c, ch = [['r', '#ef4444'], ['g', '#22c55e'], ['b', '#3b82f6'], ['y', '#e5e7eb']];
  x.fillStyle = '#0b1220'; x.fillRect(0, 0, W, H);
  for (i = 1; i < 255; i++) mx = Math.max(mx, h.r[i], h.g[i], h.b[i], h.y[i]);
  x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.7;
  ch.forEach(function (cc) { x.strokeStyle = cc[1]; x.beginPath(); for (i = 0; i < 256; i++) { var px = i * W / 255, py = H - Math.min(1, h[cc[0]][i] / mx) * (H - 4); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); });
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
}
function paintAcc(cv, acc, cols, rows, gamma) {
  var x = cv.getContext('2d'), W = cv.width, H = cv.height, img = x.createImageData(W, H), mx = 1, i, px, py, v;
  for (i = 0; i < acc.length; i++) if (acc[i] > mx) mx = acc[i];
  for (py = 0; py < H; py++) for (px = 0; px < W; px++) { v = acc[Math.floor(py * rows / H) * cols + Math.floor(px * cols / W)]; var o = (py * W + px) * 4, a = v ? Math.min(255, 40 + 215 * Math.pow(v / mx, gamma || 0.4)) : 0; img.data[o] = 30; img.data[o + 1] = a; img.data[o + 2] = 60 + a * 0.5; img.data[o + 3] = 255; }
  x.putImageData(img, 0, 0);
}
function frameData() { var cv = document.getElementById('vtCanvas'); if (!cv || !cv.width) return null; var c = document.createElement('canvas'), s = Math.min(1, 320 / cv.width); c.width = Math.max(8, Math.round(cv.width * s)); c.height = Math.max(8, Math.round(cv.height * s)); var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(cv, 0, 0, c.width, c.height); return { w: c.width, h: c.height, data: x.getImageData(0, 0, c.width, c.height).data }; }
function update(card) {
  var f = frameData(), out = card.querySelector('#cv134-out'); if (!f) { out.textContent = 'Mở Video Engine trước.'; return null; }
  var h = histogram(f.data), wf = waveform(f.data, f.w, f.h, 256), vs = vectorscope(f.data), st = stats(h);
  paintHist(card.querySelector('#cv134-h'), h); paintAcc(card.querySelector('#cv134-w'), wf.acc, wf.cols, 256, 0.45); paintAcc(card.querySelector('#cv134-v'), vs.acc, 256, 256, 0.35);
  var vc = card.querySelector('#cv134-v').getContext('2d'); vc.strokeStyle = 'rgba(255,255,255,.25)'; vc.beginPath(); vc.arc(vc.canvas.width / 2, vc.canvas.height / 2, vc.canvas.width * 0.38, 0, 7); vc.stroke();
  out.textContent = advice(st); return st;
}
function mount() {
  var page = document.querySelector('#page-videoEngine'), card = page && page.querySelector('#cv127-quality');
  if (!card || card.querySelector('#cv134-row')) return false;
  var row = document.createElement('div'); row.id = 'cv134-row'; row.style.cssText = 'margin-top:10px';
  row.innerHTML = '<div class="row" style="align-items:center;flex-wrap:wrap;gap:8px"><b class="tiny">Đo màu khung đang xem (P134)</b><button type="button" class="btn btn-soft sm" id="cv134-run">Cập nhật</button><span class="tiny" id="cv134-out" role="status" aria-live="polite">Histogram, waveform và vectorscope của khung hiện tại.</span></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><figure style="margin:0"><canvas id="cv134-h" width="256" height="110" aria-label="Histogram" style="border-radius:6px;max-width:100%"></canvas><figcaption class="tiny">Histogram</figcaption></figure><figure style="margin:0"><canvas id="cv134-w" width="256" height="110" aria-label="Waveform" style="border-radius:6px;max-width:100%"></canvas><figcaption class="tiny">Waveform (độ sáng)</figcaption></figure><figure style="margin:0"><canvas id="cv134-v" width="110" height="110" aria-label="Vectorscope" style="border-radius:6px"></canvas><figcaption class="tiny">Vectorscope</figcaption></figure></div>';
  card.insertBefore(row, card.querySelector('#cv127q-list'));
  row.querySelector('#cv134-run').addEventListener('click', function () { update(row); });
  var sc = document.getElementById('vtScrub'); if (sc && !sc.__cv134) { sc.__cv134 = 1; sc.addEventListener('input', function () { setTimeout(function () { if (document.getElementById('cv134-row')) update(row); }, 80); }); }
  return true;
}
function ready() { try { mount(); var p = document.querySelector('#page-videoEngine'); if (p && !p.__cv134Obs && window.MutationObserver) { p.__cv134Obs = new MutationObserver(function () { if (!p.querySelector('#cv134-row')) mount(); }); p.__cv134Obs.observe(p, { childList: true, subtree: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function fill(w, h, c) { var d = new Uint8ClampedArray(w * h * 4); for (var i = 0; i < w * h; i++) { d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; } return d; }
function tests() {
  var red = fill(10, 10, [255, 0, 0]), gray = fill(10, 10, [128, 128, 128]), white = fill(10, 10, [255, 255, 255]), black = fill(10, 10, [0, 0, 0]);
  var hr = histogram(red), hg = histogram(gray), vr = vectorscope(red), vg = vectorscope(gray), wf = waveform(gray, 10, 10, 8), tr = new Uint8ClampedArray(40);
  var rIdx = -1; for (var i = 0; i < vr.acc.length; i++) if (vr.acc[i]) rIdx = i;
  var gIdx = -1; for (i = 0; i < vg.acc.length; i++) if (vg.acc[i]) gIdx = i;
  return {
    histogramCounts: hr.pixels === 100 && hr.r[255] === 100 && hr.g[0] === 100 && hr.y[54] === 100 && hg.y[128] === 100,
    waveformColumnsAndLevel: wf.cols === 8 && wf.acc[128 * 8 + 0] === 20 && wf.acc.reduce(function (s, v) { return s + v; }, 0) === 100,
    vectorscopeGrayIsCenter: gIdx === 128 * 256 + 128 && vr.acc[gIdx] === 0,
    vectorscopeRedIsUpperRight: Math.floor(rIdx / 256) < 128 && (rIdx % 256) <= 128 + 1 && Math.floor(rIdx / 256) <= 5,
    transparentIgnored: histogram(tr).pixels === 0 && waveform(tr, 5, 2, 8).acc.every(function (v) { return v === 0; }),
    statsFlagClipping: stats(histogram(white)).clippedWhites === 1 && stats(histogram(black)).clippedBlacks === 1 && /cháy/.test(advice(stats(histogram(white)))) && /đen kịt/.test(advice(stats(histogram(black)))),
    balancedAdvice: /cân bằng/.test(advice(stats(hg)))
  };
}
window.CVScopesP134 = { version: '134.1.0', histogram: histogram, waveform: waveform, vectorscope: vectorscope, stats: stats, advice: advice, update: update, mount: mount, tests: tests };
})();
