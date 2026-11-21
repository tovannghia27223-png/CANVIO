/* P119 · Trình chỉnh đường cong easing dùng chung + xuất Lottie JSON đơn giản.
   Easing: cubic-bezier 4 số (kéo 2 tay cầm), preset, lò xo (xấp xỉ bằng linear()). Gắn vào #motionEase của trang Chuyển động (thêm tuỳ chọn "Tuỳ chỉnh", không bỏ tuỳ chọn cũ).
   Lottie: 1 lớp hình chữ nhật, keyframe vị trí/độ mờ/co giãn dùng đúng bezier đã chỉnh. Không phải trình soạn Lottie đầy đủ: không có expressions, mask, nhiều lớp phức tạp. Chưa kiểm bằng lottie-web thật. */
(function () {
'use strict';
if (window.CVEasingP119) return;
var PRESETS = { 'Mượt': [.2, .8, .3, 1], 'Giảm tốc': [0, 0, .58, 1], 'Tăng tốc': [.42, 0, 1, 1], 'Đều hai đầu': [.42, 0, .58, 1], 'Nảy nhẹ': [.34, 1.56, .64, 1], 'Tuyến tính': [0, 0, 1, 1] };
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function norm(c) { c = (c || []).map(Number); if (c.length !== 4 || c.some(function (n) { return !isFinite(n); })) return [.2, .8, .3, 1]; return [clamp(c[0], 0, 1), clamp(c[1], -1, 2), clamp(c[2], 0, 1), clamp(c[3], -1, 2)].map(function (n) { return Math.round(n * 1000) / 1000; }); }
function css(c) { c = norm(c); return 'cubic-bezier(' + c.join(',') + ')'; }
function parse(s) { var m = /^cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/.exec(String(s || '').trim()); return m ? norm([m[1], m[2], m[3], m[4]]) : null; }
function bez(c, t) { c = norm(c); var x1 = c[0], y1 = c[1], x2 = c[2], y2 = c[3]; function X(u) { var v = 1 - u; return 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u; } function Y(u) { var v = 1 - u; return 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u; } if (t <= 0) return 0; if (t >= 1) return 1; var lo = 0, hi = 1, u = t, i; for (i = 0; i < 40; i++) { u = (lo + hi) / 2; if (X(u) < t) lo = u; else hi = u; } return Y(u); }
function spring(o) { o = o || {}; var k = clamp(Number(o.stiffness) || 170, 20, 600), d = clamp(Number(o.damping) || 14, 2, 60), n = 24, pts = [], w = Math.sqrt(k), z = d / (2 * w), T = 1.2; for (var i = 0; i <= n; i++) { var t = i / n * T, v; if (z < 1) { var wd = w * Math.sqrt(1 - z * z); v = 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); } else v = 1 - (1 + w * t) * Math.exp(-w * t); pts.push(Math.round(v * 1000) / 1000); } pts[n] = 1; return 'linear(' + pts.join(',') + ')'; }
function lottie(o) {
  o = o || {}; var c = norm(o.curve), dur = clamp(Number(o.durationMs) || 700, 100, 5000), fr = 30, op = Math.max(2, Math.round(dur / 1000 * fr)), W = 512, H = 512, tail = Math.round(op * 1.5);
  function kf(a, b) { return [{ t: 0, s: a, i: { x: [c[2]], y: [c[3]] }, o: { x: [c[0]], y: [c[1]] } }, { t: op, s: b }]; }
  function kfv(a, b) { var n = a.length, ix = [], iy = [], ox = [], oy = []; for (var j = 0; j < n; j++) { ix.push(c[2]); iy.push(c[3]); ox.push(c[0]); oy.push(c[1]); } return [{ t: 0, s: a, i: { x: ix, y: iy }, o: { x: ox, y: oy } }, { t: op, s: b }]; }
  var color = /^#?[0-9a-f]{6}$/i.test(o.color || '') ? String(o.color).replace('#', '') : '2563eb', rgb = [0, 2, 4].map(function (i) { return Math.round(parseInt(color.substr(i, 2), 16) / 255 * 1000) / 1000; });
  var mode = o.mode === 'slide' ? 'slide' : (o.mode === 'scale' ? 'scale' : 'fade');
  return { v: '5.7.0', fr: fr, ip: 0, op: tail, w: W, h: H, nm: 'CANVIO easing', ddd: 0, assets: [], layers: [{ ddd: 0, ind: 1, ty: 4, nm: 'Hình', sr: 1, ip: 0, op: tail, st: 0, ks: { o: { a: 1, k: mode === 'fade' ? kf([0], [100]) : [{ t: 0, s: [100] }] }, r: { a: 0, k: 0 }, p: mode === 'slide' ? { a: 1, k: kfv([256, 380, 0], [256, 256, 0]) } : { a: 0, k: [256, 256, 0] }, a: { a: 0, k: [0, 0, 0] }, s: mode === 'scale' ? { a: 1, k: kfv([40, 40, 100], [100, 100, 100]) } : { a: 0, k: [100, 100, 100] } }, ao: 0, shapes: [{ ty: 'gr', it: [{ ty: 'rc', d: 1, s: { a: 0, k: [200, 200] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 28 }, nm: 'Chữ nhật' }, { ty: 'fl', c: { a: 0, k: rgb.concat([1]) }, o: { a: 0, k: 100 }, r: 1, nm: 'Màu' }, { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } }], nm: 'Nhóm' }] }], markers: [] };
}
function drawGraph(cv, c) {
  var x = cv.getContext('2d'), W = cv.width, H = cv.height, p = 22, w = W - p * 2, h = H - p * 2, pt = function (a, b) { return [p + a * w, H - p - (b * 0.5 + 0.25) * h]; };
  x.clearRect(0, 0, W, H); x.fillStyle = '#0b1220'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 1; x.strokeRect(p, H - p - 0.75 * h, w, 0.5 * h);
  var a = pt(0, 0), b = pt(1, 1), h1 = pt(c[0], c[1]), h2 = pt(c[2], c[3]); x.strokeStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(h1[0], h1[1]); x.moveTo(b[0], b[1]); x.lineTo(h2[0], h2[1]); x.stroke();
  x.strokeStyle = '#60a5fa'; x.lineWidth = 2.5; x.beginPath(); for (var i = 0; i <= 60; i++) { var t = i / 60, q = pt(t, bez(c, t)); i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); } x.stroke();
  [h1, h2].forEach(function (q) { x.fillStyle = '#fff'; x.beginPath(); x.arc(q[0], q[1], 6, 0, 7); x.fill(); });
  return { h1: h1, h2: h2, p: p, w: w, h: h, H: H };
}
function mount() {
  var page = document.getElementById('page-motion'), sel = document.getElementById('motionEase');
  if (!page || !sel || page.querySelector('#cv119-card')) return false;
  var host = sel.closest('.card'), card = document.createElement('div'); card.id = 'cv119-card'; card.style.marginTop = '12px';
  card.innerHTML = '<div class="tiny"><b>Đồ thị easing (P119)</b></div><canvas id="cv119-cv" width="300" height="190" style="width:100%;max-width:300px;touch-action:none;border-radius:8px;margin-top:6px" role="img" aria-label="Đồ thị easing, kéo hai chấm trắng để chỉnh"></canvas><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"><select class="input" id="cv119-pre" aria-label="Preset easing"></select><button type="button" class="btn btn-soft sm" id="cv119-spring">Lò xo</button><button type="button" class="btn btn-ghost sm" id="cv119-lottie">Tải Lottie</button></div><div class="tiny" id="cv119-out" role="status" aria-live="polite">Kéo hai chấm để chỉnh đường cong.</div>';
  host.appendChild(card);
  var cv = card.querySelector('#cv119-cv'), pre = card.querySelector('#cv119-pre'), out = card.querySelector('#cv119-out'), cur = parse(sel.value) || [.2, .8, .3, 1], geo, drag = -1;
  Object.keys(PRESETS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = k; pre.appendChild(o); });
  function apply(v) { var opt = sel.querySelector('option[data-cv119]'); if (!opt) { opt = document.createElement('option'); opt.setAttribute('data-cv119', '1'); opt.textContent = 'Tuỳ chỉnh (đồ thị)'; sel.appendChild(opt); } opt.value = v; sel.value = v; try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {} }
  function redraw(commit) { geo = drawGraph(cv, cur); out.textContent = css(cur); if (commit) apply(css(cur)); }
  pre.addEventListener('change', function () { cur = PRESETS[pre.value].slice(); redraw(true); });
  function pos(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; }
  cv.addEventListener('pointerdown', function (e) { var q = pos(e), d1 = Math.hypot(q[0] - geo.h1[0], q[1] - geo.h1[1]), d2 = Math.hypot(q[0] - geo.h2[0], q[1] - geo.h2[1]); drag = Math.min(d1, d2) < 24 ? (d1 <= d2 ? 0 : 1) : -1; if (drag >= 0) { try { cv.setPointerCapture(e.pointerId); } catch (x) {} } });
  cv.addEventListener('pointermove', function (e) { if (drag < 0) return; var q = pos(e), a = clamp((q[0] - geo.p) / geo.w, 0, 1), b = ((geo.H - geo.p - q[1]) / geo.h - 0.25) / 0.5; cur = cur.slice(); cur[drag * 2] = a; cur[drag * 2 + 1] = b; cur = norm(cur); redraw(true); });
  cv.addEventListener('pointerup', function () { drag = -1; });
  card.querySelector('#cv119-spring').addEventListener('click', function () { var s = spring(); apply(s); out.textContent = 'Lò xo: ' + s.slice(0, 60) + '… (cần trình duyệt hỗ trợ linear())'; });
  card.querySelector('#cv119-lottie').addEventListener('click', function () { var d = lottie({ curve: cur, durationMs: Number((document.getElementById('motionDur') || {}).value) || 700 }), u = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' })), a = document.createElement('a'); a.href = u; a.download = 'canvio-easing.lottie.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); out.textContent = 'Đã tải Lottie JSON (1 lớp, dùng đúng đường cong).'; });
  redraw(false); return true;
}
function ready() { try { mount(); } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function tests() {
  var l = lottie({ curve: [.2, .8, .3, 1], durationMs: 700, mode: 'slide' }), s = spring(), mid = bez([0, 0, 1, 1], 0.5), pr = parse('cubic-bezier(.1,.2,.3,.4)');
  var mono = true, last = -1; for (var i = 0; i <= 20; i++) { var v = bez([.2, .8, .3, 1], i / 20); if (v < last - 1e-9) mono = false; last = v; }
  return {
    linearMid: Math.abs(mid - 0.5) < 0.01, endpoints: bez([.2, .8, .3, 1], 0) === 0 && bez([.2, .8, .3, 1], 1) === 1, monotonic: mono,
    parseRoundTrip: !!pr && css(pr) === 'cubic-bezier(0.1,0.2,0.3,0.4)', parseRejectsBad: parse('ease') === null && parse('cubic-bezier(a,b,c,d)') === null,
    clampsX: norm([5, 9, -3, -9]).join() === '1,2,0,-1', badInputDefault: norm(null).join() === '0.2,0.8,0.3,1',
    springValid: /^linear\(/.test(s) && s.split(',').length === 25 && /,1\)$/.test(s),
    lottieShape: l.v && l.layers.length === 1 && l.layers[0].ks.p.a === 1 && l.op >= 2 && l.w === 512,
    lottieUsesCurve: l.layers[0].ks.p.k[0].o.x.length === 3 && l.layers[0].ks.p.k[0].o.x[0] === 0.2 && l.layers[0].ks.p.k[0].i.y[0] === 1,
    lottieJsonSafe: (function () { var d = lottie({ color: 'zz', mode: 'x', durationMs: -5, curve: [NaN] }), j = JSON.stringify(d); return j.indexOf('null') < 0 && d.op >= 2 && d.layers[0].shapes[0].it[1].c.k[2] === 0.922; })()
  };
}
window.CVEasingP119 = { version: '119.1.0', PRESETS: PRESETS, bez: bez, css: css, parse: parse, norm: norm, spring: spring, lottie: lottie, mount: mount, tests: tests };
})();
