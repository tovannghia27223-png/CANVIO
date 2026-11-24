/* P167 · Dựng khối 3D trắng (White-box Blocking) trong Video Studio.
   Đặt xe/người/nhà/vật bằng các khối trắng trên mặt phẳng, đặt camera (vị trí, điểm nhìn, FOV, bám theo đối tượng), xem cảnh QUA camera
   và xem thử chuyển động (đối tượng và camera chạy từ điểm đầu đến điểm cuối). Dựng hình phối cảnh bằng canvas 2D, KHÔNG cần mạng/WebGL.
   Nối hệ thống: cảnh lưu trong dự án chung (CVCreativeCore.documents.blocking); ảnh chụp khung vào Thư viện Tài nguyên (qua Bảng cảm hứng P153
   → CV.assets) và tự gắn dự án; “Gán vào Storyboard” tạo shot trong Video Studio (P155/P164); mô tả cảnh chạy qua CVOrchestratorP128. */
(function () {
'use strict';
if (window.CVBlockingP167) return;
var KEY = 'blocking', D2R = Math.PI / 180, NEAR = 0.1;
var TYPES = { box: { n: 'Khối', w: 2, d: 2, h: 2, c: '#f3f4f6' }, car: { n: 'Xe', w: 1.9, d: 4.5, h: 1.5, c: '#e5e7eb' }, person: { n: 'Người', w: 0.6, d: 0.6, h: 1.75, c: '#f8fafc' }, building: { n: 'Nhà', w: 8, d: 8, h: 12, c: '#e2e8f0' }, road: { n: 'Đường', w: 8, d: 60, h: 0.05, c: '#cbd5e1' } };
function uid(p) { return (p || 'k') + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function num(v, d, lo, hi) { v = Number(v); if (!isFinite(v)) v = d; return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function cleanObj(o) {
  var T = TYPES[o && o.type] || TYPES.box;
  var r = { id: String(o && o.id || uid('o')), type: TYPES[o && o.type] ? o.type : 'box', name: String(o && o.name || T.n).slice(0, 40), x: num(o && o.x, 0, -200, 200), z: num(o && o.z, 0, -200, 200), w: num(o && o.w, T.w, .05, 100), d: num(o && o.d, T.d, .05, 100), h: num(o && o.h, T.h, .02, 100), yaw: num(o && o.yaw, 0, -360, 360), color: /^#[0-9a-f]{6}$/i.test(o && o.color) ? o.color : T.c };
  if (o && o.to && isFinite(o.to.x) && isFinite(o.to.z)) r.to = { x: num(o.to.x, r.x, -200, 200), z: num(o.to.z, r.z, -200, 200) };
  return r;
}
function cleanCam(c) {
  var r = { id: String(c && c.id || uid('c')), name: String(c && c.name || 'Camera').slice(0, 40), pos: { x: num(c && c.pos && c.pos.x, 0, -300, 300), y: num(c && c.pos && c.pos.y, 1.6, 0.1, 100), z: num(c && c.pos && c.pos.z, -10, -300, 300) }, look: { x: num(c && c.look && c.look.x, 0, -300, 300), y: num(c && c.look && c.look.y, 1, 0, 100), z: num(c && c.look && c.look.z, 0, -300, 300) }, fov: num(c && c.fov, 60, 20, 110), dur: num(c && c.dur, 5, 1, 60) };
  if (c && c.follow) r.follow = String(c.follow);
  if (c && c.to && c.to.pos) r.to = { pos: { x: num(c.to.pos.x, r.pos.x, -300, 300), y: num(c.to.pos.y, r.pos.y, .1, 100), z: num(c.to.pos.z, r.pos.z, -300, 300) } };
  return r;
}
function cleanScene(s) { s = s || {}; return { version: 1, objects: (Array.isArray(s.objects) ? s.objects : []).slice(0, 60).map(cleanObj), cameras: (Array.isArray(s.cameras) ? s.cameras : []).slice(0, 20).map(cleanCam) }; }
function template(name) {
  if (name === 'room') return cleanScene({ objects: [{ id: 'floor', type: 'road', name: 'Sàn', x: 0, z: 0, w: 8, d: 8, color: '#e5e7eb' }, { id: 'tb', type: 'box', name: 'Bàn', x: 0, z: 1, w: 2, d: 1, h: .75 }, { id: 'p1', type: 'person', name: 'Nhân vật', x: -1, z: -1, to: { x: 1, z: -1 } }], cameras: [{ id: 'cam1', name: 'Toàn cảnh phòng', pos: { x: 3.5, y: 2.4, z: -3.5 }, look: { x: 0, y: 1, z: 0 }, fov: 70, dur: 4 }, { id: 'cam2', name: 'Bám nhân vật', pos: { x: 0, y: 1.6, z: -4 }, look: { x: 0, y: 1.2, z: 0 }, follow: 'p1', fov: 50, dur: 4 }] });
  return cleanScene({ objects: [{ id: 'road', type: 'road', name: 'Đường', x: 0, z: 0, w: 10, d: 80, color: '#cbd5e1' }, { id: 'b1', type: 'building', name: 'Nhà trái', x: -14, z: 8, w: 8, d: 10, h: 14 }, { id: 'b2', type: 'building', name: 'Nhà phải', x: 18, z: 12, w: 8, d: 12, h: 10 }, { id: 'carA', type: 'car', name: 'Xe nhân vật', x: -2, z: -25, to: { x: -2, z: 25 } }, { id: 'carB', type: 'car', name: 'Xe đuổi theo', x: 2, z: -33, to: { x: 2, z: 17 } }], cameras: [{ id: 'cam-wide', name: 'Toàn cảnh bám theo', pos: { x: 12, y: 7, z: -30 }, look: { x: 0, y: 1, z: 0 }, follow: 'carA', fov: 60, dur: 6 }, { id: 'cam-close', name: 'Bám sát thân xe', pos: { x: 3.5, y: 1.4, z: -32 }, look: { x: -2, y: 1, z: -25 }, follow: 'carA', fov: 70, dur: 4, to: { pos: { x: 3.5, y: 1.4, z: 18 } } }, { id: 'cam-pov', name: 'Trong xe đuổi', pos: { x: 2, y: 1.3, z: -33 }, look: { x: -2, y: 1, z: 0 }, follow: 'carA', fov: 75, dur: 5, to: { pos: { x: 2, y: 1.3, z: 17 } } }] });
}
/* ---- toán học (thuần, test được) ---- */
function objAt(o, t) { t = Math.max(0, Math.min(1, t)); return o.to ? { x: lerp(o.x, o.to.x, t), z: lerp(o.z, o.to.z, t) } : { x: o.x, z: o.z }; }
function yawAt(o, t) { if (!o.to) return o.yaw; var dx = o.to.x - o.x, dz = o.to.z - o.z; return (Math.abs(dx) + Math.abs(dz) < 1e-6) ? o.yaw : Math.atan2(dx, dz) / D2R; }
function camAt(c, scene, t) {
  t = Math.max(0, Math.min(1, t)); var pos = c.to && c.to.pos ? { x: lerp(c.pos.x, c.to.pos.x, t), y: lerp(c.pos.y, c.to.pos.y, t), z: lerp(c.pos.z, c.to.pos.z, t) } : { x: c.pos.x, y: c.pos.y, z: c.pos.z }, look = { x: c.look.x, y: c.look.y, z: c.look.z };
  if (c.follow) { var o = scene.objects.filter(function (x) { return x.id === c.follow; })[0]; if (o) { var p = objAt(o, t); look = { x: p.x, y: Math.max(.3, o.h * .5), z: p.z }; } }
  return { pos: pos, look: look, fov: c.fov };
}
function basis(cam) {
  var f = [cam.look.x - cam.pos.x, cam.look.y - cam.pos.y, cam.look.z - cam.pos.z], l = Math.hypot(f[0], f[1], f[2]) || 1; f = [f[0] / l, f[1] / l, f[2] / l];
  var r = [f[2], 0, -f[0]], rl = Math.hypot(r[0], r[2]); if (rl < 1e-6) { r = [1, 0, 0]; } else { r = [r[0] / rl, 0, r[2] / rl]; }
  var u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]]; return { f: f, r: r, u: u };
}
function toCam(p, cam, b) { var d = [p[0] - cam.pos.x, p[1] - cam.pos.y, p[2] - cam.pos.z]; return [d[0] * b.r[0] + d[1] * b.r[1] + d[2] * b.r[2], d[0] * b.u[0] + d[1] * b.u[1] + d[2] * b.u[2], d[0] * b.f[0] + d[1] * b.f[1] + d[2] * b.f[2]]; }
function toScreen(c, W, H, fov) { var fp = (W / 2) / Math.tan(fov * D2R / 2); return [W / 2 + c[0] / c[2] * fp, H / 2 - c[1] / c[2] * fp]; }
function project(p, cam, W, H) { var b = basis(cam), c = toCam(p, cam, b); if (c[2] <= NEAR) return null; var s = toScreen(c, W, H, cam.fov); return { x: s[0], y: s[1], depth: c[2] }; }
function clipNear(poly) { var out = [], i, a, b, ta, tb, t; for (i = 0; i < poly.length; i++) { a = poly[i]; b = poly[(i + 1) % poly.length]; ta = a[2] > NEAR; tb = b[2] > NEAR; if (ta) out.push(a); if (ta !== tb) { t = (NEAR - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), NEAR]); } } return out; }
function corners(o, t) {
  var p = objAt(o, t), y = yawAt(o, t) * D2R, cy = Math.cos(y), sy = Math.sin(y), hw = o.w / 2, hd = o.d / 2, out = [];
  [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].forEach(function (q) { out.push([p.x + q[0] * cy + q[1] * sy, p.z - q[0] * sy + q[1] * cy]); }); return out; /* chiều kim đồng hồ trên mặt phẳng */
}
function faces(o, t) {
  var c = corners(o, t), h = o.h, f = [], i, j, shade = [.78, .66, .72, .6];
  for (i = 0; i < 4; i++) { j = (i + 1) % 4; f.push({ v: [[c[i][0], 0, c[i][1]], [c[j][0], 0, c[j][1]], [c[j][0], h, c[j][1]], [c[i][0], h, c[i][1]]], shade: shade[i] }); }
  f.push({ v: c.map(function (q) { return [q[0], h, q[1]]; }), shade: 1 }); return f;
}
/* Trả về danh sách đa giác 2D đã sắp theo độ sâu (xa → gần): [{pts, fill, obj}] và các đoạn lưới. */
function render(scene, camIdx, t, W, H) {
  var c = scene.cameras[camIdx]; if (!c) return { polys: [], lines: [] };
  var cam = camAt(c, scene, t), b = basis(cam), polys = [], lines = [];
  scene.objects.forEach(function (o) {
    faces(o, t).forEach(function (f) {
      var vc = f.v.map(function (p) { return toCam(p, cam, b); }), cl = clipNear(vc); if (cl.length < 3) return;
      var depth = cl.reduce(function (s, p) { return s + p[2]; }, 0) / cl.length;
      polys.push({ pts: cl.map(function (p) { return toScreen(p, W, H, cam.fov); }), depth: depth, shade: f.shade, color: o.color, id: o.id, name: o.name });
    });
  });
  polys.sort(function (a, z) { return z.depth - a.depth; });
  for (var g = -100; g <= 100; g += 5) { [[[g, 0, -100], [g, 0, 100]], [[-100, 0, g], [100, 0, g]]].forEach(function (s) { var a = toCam(s[0], cam, b), e = toCam(s[1], cam, b), k = clipNear([a, e]); if (k.length >= 2) { var p1 = toScreen(k[0], W, H, cam.fov), p2 = toScreen(k[1], W, H, cam.fov); lines.push([p1, p2]); } }); }
  return { polys: polys, lines: lines, cam: cam };
}
function shade(hex, k) { var n = parseInt(hex.slice(1), 16), r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
function draw(ctx, scene, camIdx, t, W, H) {
  var r = render(scene, camIdx, t, W, H); ctx.fillStyle = '#dfe7f1'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#eef2f7'; ctx.fillRect(0, H / 2, W, H / 2);
  ctx.strokeStyle = 'rgba(100,116,139,.35)'; ctx.lineWidth = 1; r.lines.forEach(function (l) { ctx.beginPath(); ctx.moveTo(l[0][0], l[0][1]); ctx.lineTo(l[1][0], l[1][1]); ctx.stroke(); });
  r.polys.forEach(function (p) { ctx.beginPath(); p.pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fillStyle = shade(p.color, p.shade); ctx.fill(); ctx.strokeStyle = 'rgba(30,41,59,.55)'; ctx.stroke(); });
  return r;
}
function describe(scene, camIdx) {
  var c = scene.cameras[camIdx]; if (!c) return '';
  var moving = scene.objects.filter(function (o) { return o.to; }).map(function (o) { return o.name + ' di chuyển'; }), still = scene.objects.filter(function (o) { return !o.to && o.type !== 'road'; }).map(function (o) { return o.name; });
  return 'Dựng khối: ' + scene.objects.length + ' đối tượng (' + still.slice(0, 6).join(', ') + '). ' + (moving.length ? moving.join(', ') + '. ' : '') + 'Camera “' + c.name + '” cao ' + c.pos.y.toFixed(1) + 'm, FOV ' + Math.round(c.fov) + '°' + (c.follow ? ', bám theo ' + ((scene.objects.filter(function (o) { return o.id === c.follow; })[0] || {}).name || 'đối tượng') : '') + (c.to ? ', camera chuyển động' : '') + ', kéo dài ' + c.dur + ' giây.';
}
/* ---- lưu theo dự án chung ---- */
function core(create) { var C = window.CVCreativeCore; if (!C) return null; var p = C.active || null; if (!p && create && C.create) p = C.create({ name: 'Dựng khối' }); return p; }
function readScene() { var p = core(false), d = p && p.documents && p.documents[KEY]; return d && Array.isArray(d.objects) ? cleanScene(d) : null; }
function writeScene(s) { var p = core(true), C = window.CVCreativeCore; if (!p) return false; p.documents = p.documents || {}; p.documents[KEY] = cleanScene(s); try { C.capture && C.capture('videoStudio'); } catch (e) {} return true; }
function toast(t) { try { if (window.CV && CV.toast) CV.toast(t); } catch (e) {} }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
/* ---- giao diện ---- */
var st = { scene: null, cam: 0, t: 0, sel: null, playing: false, mode: 'start' };
function mount() {
  var page = document.getElementById('page-videoStudio'); if (!page) return false; if (page.querySelector('#cv167-card')) return true;
  st.scene = readScene(); if (!st.scene) { st.scene = template('chase'); if (core(false)) writeScene(st.scene); }
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv167-card'; card.style.cssText = 'margin:0;padding:14px';
  card.innerHTML = '<h3 style="margin:0">Dựng khối 3D trắng · P167</h3><p class="tiny" style="margin:2px 0 10px">Đặt xe, người, nhà bằng khối trắng; đặt camera; xem qua camera và xem thử chuyển động trước khi sinh video AI. Chạy trên máy bạn, không cần mạng.</p>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center"><select class="input" id="cv167-tpl" aria-label="Mẫu cảnh" style="width:auto"><option value="chase">Mẫu: Rượt đuổi trên đường</option><option value="room">Mẫu: Trong phòng</option></select><button class="btn btn-ghost sm" id="cv167-load" type="button">Dùng mẫu</button>'
    + '<select class="input" id="cv167-add" aria-label="Thêm đối tượng" style="width:auto"><option value="">+ Thêm đối tượng…</option>' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '">' + TYPES[k].n + '</option>'; }).join('') + '</select><button class="btn btn-ghost sm" id="cv167-addcam" type="button">+ Camera</button></div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;align-items:flex-start"><div style="flex:3 1 380px;min-width:0"><canvas id="cv167-view" width="640" height="360" aria-label="Khung nhìn qua camera" style="width:100%;border-radius:10px;background:#dfe7f1"></canvas>'
    + '<div class="row" style="gap:6px;margin-top:6px;align-items:center"><button class="btn btn-soft sm" id="cv167-play" type="button">▶ Xem thử</button><input type="range" id="cv167-t" min="0" max="100" value="0" aria-label="Thời điểm" style="flex:1"><span class="tiny" id="cv167-tv">0.0s</span></div></div>'
    + '<div style="flex:2 1 260px;min-width:0"><canvas id="cv167-plan" width="320" height="320" aria-label="Mặt bằng nhìn từ trên xuống. Kéo đối tượng để di chuyển" style="width:100%;border-radius:10px;background:#f4f7fb;touch-action:none;cursor:grab"></canvas>'
    + '<div class="row tiny" style="gap:6px;margin-top:4px;align-items:center"><label><input type="radio" name="cv167-mode" value="start" checked> Di chuyển đầu</label><label><input type="radio" name="cv167-mode" value="end"> Di chuyển cuối</label><label><input type="radio" name="cv167-mode" value="rotate"> Xoay</label><label><input type="radio" name="cv167-mode" value="scale"> Đổi cỡ</label></div></div></div>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px;align-items:center"><select class="input" id="cv167-cam" aria-label="Chọn camera" style="width:auto"></select>'
    + '<label class="tiny">FOV <input class="input" type="number" id="cv167-fov" min="20" max="110" style="width:70px"></label><label class="tiny">Cao <input class="input" type="number" id="cv167-cy" min="0.1" max="100" step="0.1" style="width:70px"></label><label class="tiny">Giây <input class="input" type="number" id="cv167-dur" min="1" max="60" style="width:64px"></label>'
    + '<select class="input" id="cv167-follow" aria-label="Camera bám theo" style="width:auto"></select></div>'
    + '<div class="row tiny" style="gap:8px;flex-wrap:wrap;margin-top:6px"><label>Camera X <input class="input" type="number" id="cv167-cx" step="0.1" style="width:76px"></label><label>Camera Z <input class="input" type="number" id="cv167-cz" step="0.1" style="width:76px"></label><label>Nhìn X <input class="input" type="number" id="cv167-lx" step="0.1" style="width:76px"></label><label>Nhìn Z <input class="input" type="number" id="cv167-lz" step="0.1" style="width:76px"></label></div>'
    + '<section id="cv167-inspector" hidden style="margin-top:10px;padding:10px;border:1px solid var(--line);border-radius:10px"><b>Thuộc tính đối tượng đang chọn</b><div class="row tiny" style="gap:8px;flex-wrap:wrap;margin-top:8px"><label>Tên <input class="input" id="cv167-obj-name" maxlength="40" style="width:150px"></label><label>X <input class="input" id="cv167-obj-x" type="number" step="0.1" style="width:76px"></label><label>Z <input class="input" id="cv167-obj-z" type="number" step="0.1" style="width:76px"></label><label>Rộng <input class="input" id="cv167-obj-w" type="number" min="0.05" max="100" step="0.1" style="width:76px"></label><label>Sâu <input class="input" id="cv167-obj-d" type="number" min="0.05" max="100" step="0.1" style="width:76px"></label><label>Cao <input class="input" id="cv167-obj-h" type="number" min="0.02" max="100" step="0.1" style="width:76px"></label><label>Góc xoay ° <input class="input" id="cv167-obj-yaw" type="number" min="-360" max="360" step="1" style="width:76px"></label><label>Màu <input id="cv167-obj-color" type="color" style="width:42px;height:32px"></label></div><p class="tiny" style="margin:6px 0 0">Chọn đối tượng trên mặt bằng, sau đó chỉnh số hoặc dùng chế độ Xoay/Đổi cỡ để thao tác bằng chuột.</p></section>'
    + '<div id="cv167-multi" hidden style="margin-top:10px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px"></div>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-primary sm" id="cv167-snap" type="button">Chụp khung → Tài nguyên</button><button class="btn btn-soft sm" id="cv167-story" type="button">Gán vào Storyboard</button><button class="btn btn-ghost sm" id="cv167-desc" type="button">Mô tả cho AI</button><button class="btn btn-ghost sm" id="cv167-del" type="button">Xóa đối tượng chọn</button><button class="btn btn-soft sm" id="cv167-multi-toggle" type="button">Xem nhiều camera</button><button class="btn btn-ghost sm" id="cv167-export-frames" type="button">Xuất chuỗi khung PNG</button></div>'
    + '<textarea class="input" id="cv167-out" rows="3" readonly aria-label="Mô tả cảnh" style="width:100%;margin-top:8px"></textarea><div id="cv167-msg" class="tiny" role="status" aria-live="polite" style="min-height:16px;margin-top:4px"></div>';
  var anchor = page.querySelector('#cv159u-panels') || page.querySelector('.head'); if (anchor && anchor.id === 'cv159u-panels') anchor.appendChild(card); else if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling); else page.insertBefore(card, page.firstChild);
  var $ = function (s) { return card.querySelector(s); }, view = $('#cv167-view'), vx = view.getContext('2d'), plan = $('#cv167-plan'), px = plan.getContext('2d'), msg = $('#cv167-msg');
  function say(t, bad) { msg.textContent = t; msg.style.color = bad ? '#b4233b' : ''; }
  function cam() { return st.scene.cameras[st.cam] || null; }
  function save() { writeScene(st.scene); }
  function fillCtl() {
    $('#cv167-cam').innerHTML = st.scene.cameras.map(function (c, i) { return '<option value="' + i + '"' + (i === st.cam ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') || '<option value="">(chưa có camera)</option>';
    var c = cam(); $('#cv167-fov').value = c ? Math.round(c.fov) : ''; $('#cv167-cy').value = c ? c.pos.y : ''; $('#cv167-dur').value = c ? c.dur : '';
    $('#cv167-cx').value = c ? c.pos.x : ''; $('#cv167-cz').value = c ? c.pos.z : ''; $('#cv167-lx').value = c ? c.look.x : ''; $('#cv167-lz').value = c ? c.look.z : '';
    $('#cv167-follow').innerHTML = '<option value="">Không bám đối tượng</option>' + st.scene.objects.filter(function (o) { return o.type !== 'road'; }).map(function (o) { return '<option value="' + esc(o.id) + '"' + (c && c.follow === o.id ? ' selected' : '') + '>Bám: ' + esc(o.name) + '</option>'; }).join('');
    fillObjectCtl();
  }
  function fillObjectCtl() {
    var o = st.scene.objects.filter(function (x) { return x.id === st.sel; })[0], box = $('#cv167-inspector');
    box.hidden = !o; if (!o) return;
    $('#cv167-obj-name').value = o.name; $('#cv167-obj-x').value = o.x; $('#cv167-obj-z').value = o.z;
    $('#cv167-obj-w').value = o.w; $('#cv167-obj-d').value = o.d; $('#cv167-obj-h').value = o.h;
    $('#cv167-obj-yaw').value = o.yaw; $('#cv167-obj-color').value = o.color;
  }
  var S = 3.2; /* px/m mặt bằng */
  function wx(x) { return plan.width / 2 + x * S; } function wz(z) { return plan.height / 2 - z * S; }
  function drawPlan() {
    px.fillStyle = '#f4f7fb'; px.fillRect(0, 0, plan.width, plan.height); px.strokeStyle = 'rgba(100,116,139,.2)'; for (var g = -50; g <= 50; g += 10) { px.beginPath(); px.moveTo(wx(g), 0); px.lineTo(wx(g), plan.height); px.moveTo(0, wz(g)); px.lineTo(plan.width, wz(g)); px.stroke(); }
    st.scene.objects.forEach(function (o) {
      [0, 1].forEach(function (end) { if (end && !o.to) return; var p = end ? o.to : { x: o.x, z: o.z }, y = (end ? yawAt(o, 1) : yawAt(o, 0)) * D2R, cy = Math.cos(y), sy = Math.sin(y), hw = o.w / 2, hd = o.d / 2;
        px.beginPath(); [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].forEach(function (q, i) { var X = p.x + q[0] * cy + q[1] * sy, Z = p.z - q[0] * sy + q[1] * cy; if (i) px.lineTo(wx(X), wz(Z)); else px.moveTo(wx(X), wz(Z)); }); px.closePath();
        px.fillStyle = end ? 'rgba(37,99,235,.18)' : (o.id === st.sel ? 'rgba(236,72,153,.35)' : 'rgba(255,255,255,.95)'); px.fill(); px.strokeStyle = o.id === st.sel ? '#ec4899' : '#64748b'; px.lineWidth = o.id === st.sel ? 2 : 1; px.stroke(); });
      if (o.to) { px.strokeStyle = '#2563eb'; px.setLineDash([4, 3]); px.beginPath(); px.moveTo(wx(o.x), wz(o.z)); px.lineTo(wx(o.to.x), wz(o.to.z)); px.stroke(); px.setLineDash([]); }
    });
    st.scene.cameras.forEach(function (c, i) { var a = camAt(c, st.scene, st.t); px.fillStyle = i === st.cam ? '#ec4899' : '#475569'; px.beginPath(); px.arc(wx(a.pos.x), wz(a.pos.z), 5, 0, 7); px.fill(); px.strokeStyle = px.fillStyle; px.beginPath(); px.moveTo(wx(a.pos.x), wz(a.pos.z)); px.lineTo(wx(a.look.x), wz(a.look.z)); px.stroke(); });
  }
  function paintMulti() {
    var box = $('#cv167-multi'); if (box.hidden) return; box.innerHTML = '';
    st.scene.cameras.slice(0, 8).forEach(function (c, i) {
      var item = document.createElement('div'); item.style.cssText = 'min-width:0;padding:6px;border:1px solid var(--line);border-radius:8px;background:var(--surface, #fff)';
      var title = document.createElement('div'); title.className = 'tiny'; title.textContent = c.name; title.style.marginBottom = '4px';
      var cv = document.createElement('canvas'); cv.width = 320; cv.height = 180; cv.style.cssText = 'display:block;width:100%;border-radius:6px;background:#dfe7f1'; cv.setAttribute('aria-label', 'Xem trước ' + c.name);
      item.appendChild(title); item.appendChild(cv); box.appendChild(item); draw(cv.getContext('2d'), st.scene, i, st.t, cv.width, cv.height);
    });
    if (st.scene.cameras.length > 8) { var note = document.createElement('p'); note.className = 'tiny'; note.textContent = 'Đang hiển thị 8/ ' + st.scene.cameras.length + ' camera đầu tiên.'; box.appendChild(note); }
  }
  function exportFrames() {
    var cams = st.scene.cameras.slice(0, 8); if (!cams.length) { say('Thêm camera trước khi xuất chuỗi khung.', true); return; }
    var W = 480, H = 270, cols = 2, times = [0, 1/3, 2/3, 1], total = cams.length * times.length, rows = Math.ceil(total / cols);
    var cv = document.createElement('canvas'); cv.width = W * cols; cv.height = H * rows; var ctx = cv.getContext('2d');
    cams.forEach(function (c, ci) { times.forEach(function (t, fi) {
      var n = ci * times.length + fi, x = (n % cols) * W, y = Math.floor(n / cols) * H;
      ctx.save(); ctx.translate(x, y); draw(ctx, st.scene, ci, t, W, H);
      ctx.fillStyle = 'rgba(15,23,42,.78)'; ctx.fillRect(0, 0, W, 28); ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(c.name.slice(0, 36) + ' · ' + (t * c.dur).toFixed(1) + 's', 10, 19); ctx.restore();
    }); });
    cv.toBlob(function (blob) { if (!blob) { say('Không tạo được PNG chuỗi khung.', true); return; }
      var url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'canvio-p167-camera-sequence.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1500); say('Đã xuất bảng chuỗi khung PNG: ' + total + ' khung từ ' + cams.length + ' camera.');
    }, 'image/png');
  }
  function paint() { var c = cam(); if (c) draw(vx, st.scene, st.cam, st.t, view.width, view.height); else { vx.fillStyle = '#dfe7f1'; vx.fillRect(0, 0, view.width, view.height); vx.fillStyle = '#64748b'; vx.font = '15px sans-serif'; vx.textAlign = 'center'; vx.fillText('Thêm camera để xem cảnh', view.width / 2, view.height / 2); } drawPlan(); paintMulti(); $('#cv167-tv').textContent = (c ? st.t * c.dur : 0).toFixed(1) + 's'; $('#cv167-t').value = Math.round(st.t * 100); }
  function refresh() { fillCtl(); paint(); }
  $('#cv167-load').addEventListener('click', function () { if (st.scene.objects.length > 4 && !confirm('Thay cảnh hiện tại bằng mẫu?')) return; st.scene = template($('#cv167-tpl').value); st.cam = 0; st.sel = null; st.t = 0; save(); refresh(); say('Đã dùng mẫu.'); });
  $('#cv167-add').addEventListener('change', function (e) { var k = e.target.value; if (!k) return; var o = cleanObj({ type: k, x: 0, z: 0 }); o.id = uid('o'); st.scene.objects.push(o); st.sel = o.id; e.target.value = ''; save(); refresh(); say('Đã thêm “' + o.name + '”. Kéo trên mặt bằng để đặt vị trí.'); });
  $('#cv167-addcam').addEventListener('click', function () { var c = cleanCam({ name: 'Camera ' + (st.scene.cameras.length + 1), pos: { x: 8, y: 3, z: -12 }, look: { x: 0, y: 1, z: 0 } }); c.id = uid('c'); st.scene.cameras.push(c); st.cam = st.scene.cameras.length - 1; save(); refresh(); });
  $('#cv167-cam').addEventListener('change', function (e) { st.cam = +e.target.value || 0; st.t = 0; refresh(); });
  [['#cv167-fov', function (c, v) { c.fov = num(v, 60, 20, 110); }], ['#cv167-cy', function (c, v) { c.pos.y = num(v, 1.6, .1, 100); }], ['#cv167-dur', function (c, v) { c.dur = num(v, 5, 1, 60); }]].forEach(function (p) { $(p[0]).addEventListener('change', function (e) { var c = cam(); if (!c) return; p[1](c, e.target.value); save(); refresh(); }); });
  $('#cv167-follow').addEventListener('change', function (e) { var c = cam(); if (!c) return; if (e.target.value) c.follow = e.target.value; else delete c.follow; save(); paint(); });
  [['#cv167-cx', 'pos', 'x'], ['#cv167-cz', 'pos', 'z'], ['#cv167-lx', 'look', 'x'], ['#cv167-lz', 'look', 'z']].forEach(function (p) { $(p[0]).addEventListener('change', function (e) { var c = cam(); if (!c) return; c[p[1]][p[2]] = num(e.target.value, c[p[1]][p[2]], -300, 300); save(); refresh(); }); });
  [['#cv167-obj-name', 'name'], ['#cv167-obj-x', 'x'], ['#cv167-obj-z', 'z'], ['#cv167-obj-w', 'w'], ['#cv167-obj-d', 'd'], ['#cv167-obj-h', 'h'], ['#cv167-obj-yaw', 'yaw'], ['#cv167-obj-color', 'color']].forEach(function (p) { $(p[0]).addEventListener('change', function (e) {
    var o = st.scene.objects.filter(function (x) { return x.id === st.sel; })[0]; if (!o) return;
    if (p[1] === 'name') o.name = String(e.target.value || TYPES[o.type].n).slice(0, 40);
    else if (p[1] === 'color') o.color = /^#[0-9a-f]{6}$/i.test(e.target.value) ? e.target.value : TYPES[o.type].c;
    else o[p[1]] = num(e.target.value, o[p[1]], p[1] === 'yaw' ? -360 : (p[1] === 'x' || p[1] === 'z' ? -200 : .05), p[1] === 'yaw' ? 360 : (p[1] === 'x' || p[1] === 'z' ? 200 : 100));
    save(); refresh();
  }); });
  $('#cv167-multi-toggle').addEventListener('click', function () { var box = $('#cv167-multi'); box.hidden = !box.hidden; this.textContent = box.hidden ? 'Xem nhiều camera' : 'Ẩn nhiều camera'; paint(); });
  $('#cv167-export-frames').addEventListener('click', exportFrames);
  $('#cv167-t').addEventListener('input', function (e) { st.playing = false; $('#cv167-play').textContent = '▶ Xem thử'; st.t = (+e.target.value) / 100; paint(); });
  var raf = 0, t0 = 0;
  function tick(now) { if (!st.playing) return; var c = cam(); if (!c) { st.playing = false; return; } st.t = Math.min(1, (now - t0) / (c.dur * 1000)); paint(); if (st.t >= 1) { st.playing = false; $('#cv167-play').textContent = '▶ Xem thử'; return; } raf = requestAnimationFrame(tick); }
  $('#cv167-play').addEventListener('click', function () { var c = cam(); if (!c) { say('Thêm camera trước.', true); return; } if (st.playing) { st.playing = false; $('#cv167-play').textContent = '▶ Xem thử'; return; } if (st.t >= 1) st.t = 0; st.playing = true; t0 = performance.now() - st.t * c.dur * 1000; $('#cv167-play').textContent = '⏸ Dừng'; raf = requestAnimationFrame(tick); });
  Array.prototype.forEach.call(card.querySelectorAll('[name=cv167-mode]'), function (r) { r.addEventListener('change', function () { st.mode = r.value; }); });
  var drag = null;
  function planPt(e) { var r = plan.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width * plan.width - plan.width / 2) / S, z: (plan.height / 2 - (e.clientY - r.top) / r.height * plan.height) / S }; }
  plan.addEventListener('pointerdown', function (e) {
    var p = planPt(e), hit = null, selected = st.scene.objects.filter(function (o) { return o.id === st.sel; })[0];
    if (selected && (st.mode === 'rotate' || st.mode === 'scale')) {
      var center = st.mode === 'end' && selected.to ? selected.to : { x: selected.x, z: selected.z }, nearSelected = Math.abs(p.x - center.x) <= Math.max(selected.w, selected.d) / 2 + 1 && Math.abs(p.z - center.z) <= Math.max(selected.w, selected.d) / 2 + 1;
      if (nearSelected) { var dx0 = p.x - center.x, dz0 = p.z - center.z; drag = { o: selected, kind: st.mode, center: center, startAngle: Math.atan2(dz0, dx0), startDistance: Math.max(.1, Math.sqrt(dx0 * dx0 + dz0 * dz0)), startYaw: selected.yaw, startW: selected.w, startD: selected.d }; plan.setPointerCapture(e.pointerId); plan.style.cursor = 'grabbing'; e.preventDefault(); return; }
    } st.scene.objects.slice().reverse().some(function (o) { var q = st.mode === 'end' && o.to ? o.to : { x: o.x, z: o.z }; if (Math.abs(p.x - q.x) <= Math.max(o.w, o.d) / 2 + .6 && Math.abs(p.z - q.z) <= Math.max(o.w, o.d) / 2 + .6) { hit = o; return true; } });
    if (!hit) { st.sel = null; paint(); return; } st.sel = hit.id; fillCtl(); drag = { o: hit, dx: 0, dz: 0, p: p }; plan.setPointerCapture(e.pointerId); plan.style.cursor = 'grabbing'; paint();
  });
  plan.addEventListener('pointermove', function (e) { if (!drag) return; var p = planPt(e), o = drag.o, x = Math.round(p.x * 2) / 2, z = Math.round(p.z * 2) / 2;
    if (drag.kind === 'rotate') { var angle = Math.atan2(p.z - drag.center.z, p.x - drag.center.x); o.yaw = num(drag.startYaw + (angle - drag.startAngle) * 180 / Math.PI, drag.startYaw, -360, 360); }
    else if (drag.kind === 'scale') { var dx = p.x - drag.center.x, dz = p.z - drag.center.z, factor = num(Math.sqrt(dx * dx + dz * dz) / drag.startDistance, 1, .2, 4); o.w = num(drag.startW * factor, drag.startW, .05, 100); o.d = num(drag.startD * factor, drag.startD, .05, 100); }
    else if (st.mode === 'end') o.to = { x: x, z: z }; else { o.x = x; o.z = z; } paint(); });
  ['pointerup', 'pointercancel'].forEach(function (ev) { plan.addEventListener(ev, function () { if (drag) { drag = null; plan.style.cursor = 'grab'; save(); fillCtl(); paint(); } }); });
  $('#cv167-del').addEventListener('click', function () { if (!st.sel) { say('Chọn một đối tượng trên mặt bằng trước.', true); return; } st.scene.objects = st.scene.objects.filter(function (o) { return o.id !== st.sel; }); st.scene.cameras.forEach(function (c) { if (c.follow === st.sel) delete c.follow; }); st.sel = null; save(); refresh(); });
  $('#cv167-snap').addEventListener('click', function () {
    var c = cam(), B = window.CVBoardP153; if (!c) { say('Thêm camera trước.', true); return; } if (!B) { say('Chưa sẵn sàng lưu vào Tài nguyên.', true); return; }
    var cv = document.createElement('canvas'); cv.width = 1280; cv.height = 720; draw(cv.getContext('2d'), st.scene, st.cam, st.t, 1280, 720);
    B.addDataUrl(cv.toDataURL('image/jpeg', .9), { name: 'Khối · ' + c.name + ' · ' + (st.t * c.dur).toFixed(1) + 's', kind: 'Cảnh', note: describe(st.scene, st.cam).slice(0, 380), extra: { blocking: true, camera: c.name, t: Math.round(st.t * 100) / 100 } }).then(function (it) { say('Đã lưu khung vào Thư viện Tài nguyên (và gắn dự án).'); toast('Đã chụp khung dựng khối'); }, function (e) { say(e.message, true); });
  });
  $('#cv167-desc').addEventListener('click', function () { var t = describe(st.scene, st.cam), O = window.CVOrchestratorP128, out = $('#cv167-out'); if (!t) { say('Thêm camera trước.', true); return; } if (O && O.register && O.run) { O.register('blocking-local', 'local', function (task) { return String(task.prompt || ''); }); O.run({ kind: 'blocking-local', tiers: ['local'], cache: false, prompt: t }).then(function (r) { out.value = r && r.text || t; say('Đã tạo mô tả qua AI Engine (cục bộ).'); }, function () { out.value = t; }); } else { out.value = t; } });
  $('#cv167-story').addEventListener('click', function () { var c = cam(), S = window.CVScenePackP155; if (!c) { say('Thêm camera trước.', true); return; } if (!S || !S.assignToStoryboard) { say('Storyboard chưa sẵn sàng.', true); return; } var t = describe(st.scene, st.cam), r = S.assignToStoryboard({ title: c.name, action: t, prompt: t, shotSeconds: c.dur, roles: {} }); if (!r.ok) { say(r.error, true); return; } say('Đã thêm shot “' + r.shot.title + '” vào Storyboard.'); toast('Đã gán vào Video Studio'); });
  refresh(); return true;
}
function ready() { var n = 0; (function loop() { var ok = false; try { ok = mount(); } catch (e) {} if (!ok && ++n < 80) setTimeout(loop, 250); })(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
window.CVBlockingP167 = { version: '167.1.0', TYPES: TYPES, cleanScene: cleanScene, template: template, objAt: objAt, yawAt: yawAt, camAt: camAt, project: project, render: render, draw: draw, describe: describe, readScene: readScene, writeScene: writeScene, mount: mount };
})();
