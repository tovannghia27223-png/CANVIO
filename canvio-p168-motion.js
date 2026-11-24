/* P168 · Thiết kế → chuyển động + bản mẫu quy trình AI.
   (1) “Ảnh → chuyển động” (dock Video Studio): chọn ảnh/thiết kế trong Thư viện Tài nguyên, chọn hiệu ứng (zoom, lia, trượt, mờ vào), xem thử trực tiếp,
       xuất GIF (bộ mã hoá P132) hoặc WebM (MediaRecorder) → lưu lại Thư viện Tài nguyên, gắn dự án, hoặc gán thành shot Storyboard.
   (2) Bản mẫu quy trình AI (trang Nền tảng, thẻ P165): xuất/nhập các quy trình thành tệp JSON để chia sẻ; không kèm kết quả chạy hay dữ liệu cá nhân. */
(function () {
'use strict';
if (window.CVMotionTemplatesP168) return;
var PRESETS = {
  'zoom-in': { n: 'Zoom vào', f: function (t) { return { s: 1 + .25 * t, x: 0, y: 0, a: 1 }; } },
  'zoom-out': { n: 'Zoom ra', f: function (t) { return { s: 1.25 - .25 * t, x: 0, y: 0, a: 1 }; } },
  'pan-right': { n: 'Lia sang phải', f: function (t) { return { s: 1.2, x: lerp(-.08, .08, t), y: 0, a: 1 }; } },
  'pan-left': { n: 'Lia sang trái', f: function (t) { return { s: 1.2, x: lerp(.08, -.08, t), y: 0, a: 1 }; } },
  'tilt-up': { n: 'Nghiêng lên', f: function (t) { return { s: 1.2, x: 0, y: lerp(.08, -.08, t), a: 1 }; } },
  'tilt-down': { n: 'Nghiêng xuống', f: function (t) { return { s: 1.2, x: 0, y: lerp(-.08, .08, t), a: 1 }; } },
  'fade-in': { n: 'Mờ dần vào', f: function (t) { return { s: 1.05, x: 0, y: 0, a: Math.min(1, t * 2.2) }; } },
  'slide-in': { n: 'Trượt vào', f: function (t) { var e = 1 - Math.pow(1 - Math.min(1, t * 1.6), 3); return { s: 1, x: lerp(.35, 0, e), y: 0, a: Math.min(1, t * 3) }; } }
};
var SIZES = { '800x500': [800, 500], '1280x720': [1280, 720], '720x1280': [720, 1280], '1080x1080': [1080, 1080] };
function lerp(a, b, t) { return a + (b - a) * t; }
function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function transformAt(preset, t) { var p = PRESETS[preset] || PRESETS['zoom-in']; return p.f(Math.max(0, Math.min(1, ease(Math.max(0, Math.min(1, t)))))); }
/* Vẽ ảnh “cover” vào khung W×H với biến đổi tf = {s,x,y,a}. ctx là CanvasRenderingContext2D. */
function normalizeOverlay(o) {
  o = o || {};
  return {
    text: String(o.text == null ? '' : o.text).replace(/\s+/g, ' ').trim().slice(0, 160),
    effect: ['none','fade','slide','typewriter','pop'].indexOf(o.effect) >= 0 ? o.effect : 'none',
    position: ['top','middle','bottom'].indexOf(o.position) >= 0 ? o.position : 'bottom',
    style: ['plain','banner','outline'].indexOf(o.style) >= 0 ? o.style : 'plain',
    color: /^#[0-9a-f]{6}$/i.test(o.color || '') ? o.color : '#ffffff',
    size: Math.max(18, Math.min(88, Number(o.size) || 42)),
    bold: o.bold !== false
  };
}
function drawOverlay(ctx, W, H, raw, t) {
  var o = normalizeOverlay(raw); if (!o.text) return false;
  var p = ease(Math.max(0, Math.min(1, Number(t) || 0))), alpha = 1, yShift = 0, scale = 1, chars = Array.from(o.text), shown = chars;
  if (o.effect === 'fade') alpha = p;
  else if (o.effect === 'slide') { alpha = Math.min(1, p * 2); yShift = (1 - p) * H * .08; }
  else if (o.effect === 'typewriter') shown = chars.slice(0, Math.max(0, Math.ceil(chars.length * p)));
  else if (o.effect === 'pop') { alpha = Math.min(1, p * 2); scale = .82 + .18 * p; }
  if (!shown.length || alpha <= 0) return false;
  ctx.save(); ctx.globalAlpha = alpha;
  var fontSize = Math.max(12, Math.round(o.size * Math.min(1, W / 800) * scale));
  ctx.font = (o.bold ? '700 ' : '500 ') + fontSize + 'px Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  var maxWidth = W * .86, words = shown.join('').split(' '), lines = [], line = '';
  words.forEach(function (word) {
    var next = line ? line + ' ' + word : word;
    if (line && ctx.measureText(next).width > maxWidth) { lines.push(line); line = word; } else line = next;
  });
  if (line || !lines.length) lines.push(line);
  lines = lines.slice(0, 3);
  var lineH = fontSize * 1.22, blockH = lineH * lines.length;
  var y = o.position === 'top' ? H * .16 : (o.position === 'middle' ? H * .5 : H * .84);
  y = Math.max(blockH / 2 + 8, Math.min(H - blockH / 2 - 8, y + yShift));
  if (o.style === 'banner') {
    var maxLine = lines.reduce(function (m, s) { return Math.max(m, ctx.measureText(s).width); }, 0);
    var bw = Math.min(W * .94, maxLine + fontSize * 1.5), bh = blockH + fontSize * .65;
    ctx.fillStyle = 'rgba(15,23,42,.72)'; ctx.fillRect((W - bw) / 2, y - bh / 2, bw, bh);
  }
  ctx.shadowColor = 'rgba(0,0,0,.78)'; ctx.shadowBlur = Math.max(2, fontSize * .16); ctx.shadowOffsetY = Math.max(1, fontSize * .05);
  lines.forEach(function (s, i) {
    var yy = y + (i - (lines.length - 1) / 2) * lineH;
    if (o.style === 'outline') { ctx.lineWidth = Math.max(2, fontSize * .11); ctx.strokeStyle = 'rgba(15,23,42,.92)'; ctx.strokeText(s, W / 2, yy, maxWidth); }
    ctx.fillStyle = o.color; ctx.fillText(s, W / 2, yy, maxWidth);
  });
  ctx.restore(); return true;
}
function drawFrame(ctx, img, W, H, tf, textOverlay, t) {
  var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k = Math.max(W / iw, H / ih) * tf.s, dw = iw * k, dh = ih * k;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = Math.max(0, Math.min(1, tf.a));
  ctx.drawImage(img, (W - dw) / 2 + tf.x * W, (H - dh) / 2 + tf.y * H, dw, dh); ctx.globalAlpha = 1;
  if (textOverlay && textOverlay.text) drawOverlay(ctx, W, H, textOverlay, t || 0);
}
function frameCount(sec, fps) { return Math.max(2, Math.min(90, Math.round(Math.max(1, Math.min(6, sec)) * Math.max(4, Math.min(24, fps))))); }
/* ---- bản mẫu quy trình ---- */
var ROLES = ['scriptwriter', 'prompt-director', 'generator-handoff', 'evaluator', 'reviser'];
function clip(s, n) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n); }
function exportWorkflows(list) {
  var A = window.CVAiWorkflowP165, src = list || (A && A.read ? A.read().workflows : []);
  return JSON.stringify({ canvio: 'p165-workflows', version: 1, workflows: src.slice(0, 50).map(function (w) { return { name: clip(w.name, 80), steps: (w.steps || []).filter(function (r) { return ROLES.indexOf(r) >= 0; }).slice(0, 12) }; }).filter(function (w) { return w.name && w.steps.length; }) }, null, 1);
}
function parseWorkflows(text) {
  var o; try { o = JSON.parse(text); } catch (e) { return { ok: false, error: 'Tệp không phải JSON hợp lệ.' }; }
  if (!o || o.canvio !== 'p165-workflows' || !Array.isArray(o.workflows)) return { ok: false, error: 'Không phải bản mẫu quy trình CANVIO.' };
  var out = []; o.workflows.slice(0, 50).forEach(function (w) { var name = clip(w && w.name, 80), steps = (w && Array.isArray(w.steps) ? w.steps : []).filter(function (r) { return ROLES.indexOf(r) >= 0; }).slice(0, 12); if (name && steps.length) out.push({ name: name, steps: steps }); });
  return out.length ? { ok: true, workflows: out } : { ok: false, error: 'Tệp không có quy trình hợp lệ.' };
}
function importWorkflows(text) {
  var A = window.CVAiWorkflowP165, p = parseWorkflows(text); if (!p.ok) return p; if (!A || !A.create) return { ok: false, error: 'Quy trình AI (P165) chưa sẵn sàng.' };
  var have = (A.read().workflows || []).map(function (w) { return w.name + '|' + (w.steps || []).join(','); }), added = 0, skipped = 0;
  p.workflows.forEach(function (w) { if (have.indexOf(w.name + '|' + w.steps.join(',')) >= 0) { skipped++; return; } var r = A.create(w.name, w.steps); if (r && r.ok) added++; });
  return { ok: true, added: added, skipped: skipped };
}
/* ---- giao diện ---- */
function toast(t) { try { if (window.CV && CV.toast) CV.toast(t); } catch (e) {} }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function assets() { try { return (CV.assets.list() || []).filter(function (a) { return a && /^image\//.test(a.mime || '') && String(a.data || '').indexOf('data:image/') === 0; }); } catch (e) { return []; } }
function saveAsset(blob, name) {
  if (!window.CV || !CV.assets || !CV.assets.addBlob) return Promise.reject(new Error('Thư viện Tài nguyên chưa sẵn sàng.'));
  var f = new File([blob], name, { type: blob.type }), before = CV.assets.list().length;
  return Promise.resolve(CV.assets.addBlob(f)).then(function () { var a = CV.assets.list()[0]; if (a && window.CVCreativeCore && CVCreativeCore.active && CVCreativeCore.linkAsset) { try { CVCreativeCore.linkAsset(a.id); } catch (e) {} } return a; });
}
function extractDesignSource(value, depth) {
  depth = depth || 0; if (depth > 5 || value == null) return '';
  if (typeof value === 'string') {
    var s = value.trim();
    if (/^(?:data:image\/(?:png|jpeg|webp|gif|svg\+xml);|blob:)/i.test(s) || /^<svg\b/i.test(s)) return s;
    if ((s[0] === '{' || s[0] === '[') && s.length < 4000000) { try { return extractDesignSource(JSON.parse(s), depth + 1); } catch (e) {} }
    return '';
  }
  if (Array.isArray(value)) { for (var i = 0; i < Math.min(40, value.length); i++) { var found = extractDesignSource(value[i], depth + 1); if (found) return found; } return ''; }
  if (typeof value === 'object') {
    var keys = ['dataUrl','dataURL','previewDataUrl','preview','imageDataUrl','image','src','svg','png','output','canvas'];
    for (var k = 0; k < keys.length; k++) if (value[keys[k]] != null) { var got = extractDesignSource(value[keys[k]], depth + 1); if (got) return got; }
    var names = Object.keys(value).slice(0, 40);
    for (var n = 0; n < names.length; n++) { var item = extractDesignSource(value[names[n]], depth + 1); if (item) return item; }
  }
  return '';
}
function mountMotion() {
  var page = document.getElementById('page-videoStudio'); if (!page) return false; if (page.querySelector('#cv168-card')) return true;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv168-card'; card.style.cssText = 'margin:0;padding:14px';
  card.innerHTML = '<h3 style="margin:0">Ảnh → chuyển động · P168</h3><p class="tiny" style="margin:2px 0 10px">Biến một ảnh hoặc thiết kế trong Thư viện Tài nguyên thành clip ngắn (zoom, lia, trượt, mờ vào), xuất GIF hoặc WebM, lưu lại Tài nguyên hoặc gán vào Storyboard.</p>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center"><select class="input" id="cv168-asset" aria-label="Chọn ảnh từ Thư viện Tài nguyên" style="min-width:200px;flex:1"></select><select class="input" id="cv168-preset" aria-label="Hiệu ứng" style="width:auto">' + Object.keys(PRESETS).map(function (k) { return '<option value="' + k + '">' + PRESETS[k].n + '</option>'; }).join('') + '</select>'
    + '<select class="input" id="cv168-size" aria-label="Kích thước" style="width:auto"><option value="800x500">800×500 (GIF nhẹ)</option><option value="1280x720">1280×720</option><option value="720x1280">720×1280 (dọc)</option><option value="1080x1080">1080×1080</option></select>'
    + '<label class="tiny">Giây <input class="input" id="cv168-sec" type="number" min="1" max="6" value="3" style="width:64px"></label><label class="tiny">Khung/giây <select class="input" id="cv168-fps" style="width:auto"><option>10</option><option selected>12</option><option>15</option><option>24</option></select></label></div>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px;align-items:center"><input class="input" id="cv168-text" maxlength="160" placeholder="Thêm tiêu đề / phụ đề vào video…" aria-label="Chữ phủ lên video" style="min-width:180px;flex:1"><select class="input" id="cv168-text-effect" aria-label="Hiệu ứng chữ" style="width:auto"><option value="none">Chữ tĩnh</option><option value="fade">Mờ dần</option><option value="slide">Trượt lên</option><option value="typewriter">Đánh máy</option><option value="pop">Bật nhẹ</option></select><select class="input" id="cv168-text-position" aria-label="Vị trí chữ" style="width:auto"><option value="top">Trên</option><option value="middle">Giữa</option><option value="bottom" selected>Dưới</option></select><select class="input" id="cv168-text-style" aria-label="Kiểu chữ" style="width:auto"><option value="plain">Tối giản</option><option value="banner">Nền mờ</option><option value="outline">Viền chữ</option></select><input id="cv168-text-color" type="color" value="#ffffff" aria-label="Màu chữ" title="Màu chữ" style="width:38px;height:32px"><label class="tiny">Cỡ <input class="input" id="cv168-text-size" type="number" min="18" max="88" value="42" style="width:58px"></label></div>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px;align-items:center"><button class="btn btn-ghost sm" id="cv168-poster-source" type="button">Lấy thiết kế Poster hiện tại</button><button class="btn btn-ghost sm" id="cv168-designer-source" type="button">Lấy thiết kế Designer hiện tại</button><span class="tiny">Lấy bản dựng trực tiếp, không cần lưu qua Tài nguyên trước.</span></div>'
    + '<div style="margin-top:10px"><canvas id="cv168-view" width="800" height="500" aria-label="Xem thử chuyển động" style="width:100%;max-width:640px;border-radius:10px;background:#0f172a;display:block"></canvas></div>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-soft sm" id="cv168-play" type="button">▶ Xem thử</button><button class="btn btn-primary sm" id="cv168-gif" type="button">Xuất GIF → Tài nguyên</button><button class="btn btn-soft sm" id="cv168-webm" type="button">Xuất WebM → Tài nguyên</button><button class="btn btn-ghost sm" id="cv168-story" type="button">Gán vào Storyboard</button></div><div id="cv168-msg" class="tiny" role="status" aria-live="polite" style="min-height:16px;margin-top:6px"></div>';
  var panels = page.querySelector('#cv159u-panels'), head = page.querySelector('.head'); if (panels) panels.appendChild(card); else if (head && head.parentNode) head.parentNode.insertBefore(card, head.nextSibling); else page.insertBefore(card, page.firstChild);
  var $ = function (s) { return card.querySelector(s); }, cv = $('#cv168-view'), cx = cv.getContext('2d'), msg = $('#cv168-msg'), img = null, imgId = '', playing = false, t0 = 0, raf = 0;
  function say(t, bad) { msg.textContent = t; msg.style.color = bad ? '#b4233b' : ''; }
  function overlay() { return normalizeOverlay({ text: $('#cv168-text').value, effect: $('#cv168-text-effect').value, position: $('#cv168-text-position').value, style: $('#cv168-text-style').value, color: $('#cv168-text-color').value, size: $('#cv168-text-size').value }); }
  function setDirectImage(src, label) {
    return new Promise(function (resolve, reject) {
      if (typeof src !== 'string' || !(/^(?:data:image\/(?:png|jpeg|webp|gif|svg\+xml);|blob:)/i.test(src))) { reject(new Error('Nguồn thiết kế không phải ảnh cục bộ được hỗ trợ.')); return; }
      var im = new Image(); im.onload = function () { img = im; imgId = 'direct:' + label; still(0); say('Đã lấy trực tiếp thiết kế ' + label + '.'); resolve(true); };
      im.onerror = function () { reject(new Error('Không giải mã được bản thiết kế ' + label + '.')); }; im.src = src;
    });
  }
  function setDirectSvg(svg, label) {
    if (typeof svg !== 'string' || !/<svg\b/i.test(svg) || /(?:href|xlink:href)\s*=\s*['"]\s*(?:https?:|\/\/)/i.test(svg)) return Promise.reject(new Error('Poster không trả về SVG hợp lệ hoặc đang tham chiếu ảnh ngoài.'));
    var u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    return setDirectImage(u, label).then(function (v) { setTimeout(function () { URL.revokeObjectURL(u); }, 30000); return v; }, function (e) { URL.revokeObjectURL(u); throw e; });
  }

  function dims() { var s = SIZES[$('#cv168-size').value] || SIZES['800x500']; return s; }
  function sec() { return Math.max(1, Math.min(6, Number($('#cv168-sec').value) || 3)); }
  function fillAssets() { var l = assets(), cur = $('#cv168-asset').value; $('#cv168-asset').innerHTML = l.length ? l.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>'; }).join('') : '<option value="">(Chưa có ảnh trong Tài nguyên — thêm ở trang Tài nguyên hoặc Bảng cảm hứng)</option>'; if (cur && l.some(function (a) { return a.id === cur; })) $('#cv168-asset').value = cur; }
  function load() { var id = $('#cv168-asset').value, a = assets().filter(function (x) { return x.id === id; })[0]; if (!a) { img = null; imgId = ''; still(); return Promise.resolve(); } if (id === imgId && img) return Promise.resolve(); return new Promise(function (ok) { var im = new Image(); im.onload = function () { img = im; imgId = id; still(); ok(); }; im.onerror = function () { img = null; say('Không đọc được ảnh này.', true); ok(); }; im.src = a.data; }); }
  function size() { var d = dims(); if (cv.width !== d[0] || cv.height !== d[1]) { cv.width = d[0]; cv.height = d[1]; } }
  function still(t) { size(); if (!img) { cx.fillStyle = '#0f172a'; cx.fillRect(0, 0, cv.width, cv.height); cx.fillStyle = '#94a3b8'; cx.font = '20px sans-serif'; cx.textAlign = 'center'; cx.fillText('Chọn ảnh để xem thử', cv.width / 2, cv.height / 2); return; } drawFrame(cx, img, cv.width, cv.height, transformAt($('#cv168-preset').value, t || 0), overlay(), t || 0); }
  function tick(now) { if (!playing) return; var t = (now - t0) / (sec() * 1000); if (t >= 1) { playing = false; still(1); $('#cv168-play').textContent = '▶ Xem thử'; return; } still(t); raf = requestAnimationFrame(tick); }
  $('#cv168-play').addEventListener('click', function () { if (playing) { playing = false; $('#cv168-play').textContent = '▶ Xem thử'; return; } load().then(function () { if (!img) { say('Chọn ảnh trước.', true); return; } playing = true; t0 = performance.now(); $('#cv168-play').textContent = '⏸ Dừng'; raf = requestAnimationFrame(tick); }); });
  ['#cv168-asset', '#cv168-preset', '#cv168-size'].forEach(function (s) { $(s).addEventListener('change', function () { playing = false; $('#cv168-play').textContent = '▶ Xem thử'; img = s === '#cv168-asset' ? null : img; load().then(function () { still(0); }); }); });
  function frames() { size(); var n = frameCount(sec(), +$('#cv168-fps').value), W = cv.width, H = cv.height, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d', { willReadFrequently: true }), out = [], i; for (i = 0; i < n; i++) { var t = n > 1 ? i / (n - 1) : 0; drawFrame(x, img, W, H, transformAt($('#cv168-preset').value, t), overlay(), t); var d = x.getImageData(0, 0, W, H); out.push({ w: W, h: H, data: d.data }); } return out; }
  $('#cv168-gif').addEventListener('click', function () {
    load().then(function () {
      if (!img) { say('Chọn ảnh trước.', true); return; } var G = window.CVGifP132; if (!G || !G.encode) { say('Bộ mã hoá GIF (P132) chưa sẵn sàng.', true); return; }
      say('Đang mã hoá GIF…'); setTimeout(function () { try {
        var fr = frames(), bytes = G.encode(fr, { delayCs: Math.round(100 / (+$('#cv168-fps').value)), loop: 0 }), u = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes), blob = new Blob([u], { type: 'image/gif' });
        saveAsset(blob, 'Chuyen-dong-' + $('#cv168-preset').value + '-' + Date.now().toString(36) + '.gif').then(function (a) { say('Đã lưu GIF ' + fr.length + ' khung (' + Math.round(blob.size / 1024) + ' KB) vào Thư viện Tài nguyên.'); toast('Đã xuất GIF'); }, function (e) { say(e.message, true); });
      } catch (e) { say('Không mã hoá được GIF: ' + e.message, true); } }, 30);
    });
  });
  $('#cv168-webm').addEventListener('click', function () {
    load().then(function () {
      if (!img) { say('Chọn ảnh trước.', true); return; } if (!window.MediaRecorder || !cv.captureStream) { say('Trình duyệt này không hỗ trợ ghi WebM; hãy xuất GIF.', true); return; }
      var types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'], mt = types.filter(function (t) { return MediaRecorder.isTypeSupported(t); })[0]; if (!mt) { say('Không có bộ mã hoá WebM; hãy xuất GIF.', true); return; }
      size(); var rec = new MediaRecorder(cv.captureStream(30), { mimeType: mt, videoBitsPerSecond: 4e6 }), chunks = [], s = sec(), start = 0, stop = false; say('Đang ghi WebM…');
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () { var blob = new Blob(chunks, { type: 'video/webm' }); saveAsset(blob, 'Chuyen-dong-' + $('#cv168-preset').value + '-' + Date.now().toString(36) + '.webm').then(function () { say('Đã lưu WebM (' + Math.round(blob.size / 1024) + ' KB) vào Thư viện Tài nguyên.'); toast('Đã xuất WebM'); }, function (e) { say(e.message, true); }); };
      rec.start(); start = performance.now(); (function step(now) { var t = (now - start) / (s * 1000); still(Math.min(1, t)); if (t < 1) requestAnimationFrame(step); else { setTimeout(function () { rec.stop(); }, 120); } })(start);
    });
  });
  $('#cv168-story').addEventListener('click', function () { var S = window.CVScenePackP155, name = (assets().filter(function (a) { return a.id === $('#cv168-asset').value; })[0] || {}).name; if (!name) { say('Chọn ảnh trước.', true); return; } if (!S || !S.assignToStoryboard) { say('Storyboard chưa sẵn sàng.', true); return; } var tx = 'Ảnh “' + name + '” với hiệu ứng ' + PRESETS[$('#cv168-preset').value].n.toLowerCase() + ', ' + sec() + ' giây.', r = S.assignToStoryboard({ title: 'Chuyển động: ' + name, action: tx, prompt: tx, shotSeconds: sec(), roles: {} }); if (!r.ok) { say(r.error, true); return; } say('Đã thêm shot vào Storyboard.'); toast('Đã gán vào Video Studio'); });
  $('#cv168-poster-source').addEventListener('click', function () {
    try {
      if (!window.CV || !CV.poster || !CV.poster.doc || !CV.export || typeof CV.export.svgString !== 'function') { say('Poster chưa có thiết kế đang mở hoặc bộ xuất SVG chưa sẵn sàng.', true); return; }
      setDirectSvg(CV.export.svgString(CV.poster.doc), 'Poster').catch(function (e) { say(e.message, true); });
    } catch (e) { say(e.message || String(e), true); }
  });
  $('#cv168-designer-source').addEventListener('click', function () {
    try {
      var snap = window.CV && CV.engines && CV.engines.design && typeof CV.engines.design.snapshotState === 'function' ? CV.engines.design.snapshotState() : null;
      var source = extractDesignSource(snap), label = 'Designer';
      if (source) { (source.slice(0, 4).toLowerCase() === '<svg' ? setDirectSvg(source, label) : setDirectImage(source, label)).catch(function (e) { say(e.message, true); }); return; }
      var root = document.querySelector('#page-designEngine, #page-designer, #page-designStudio');
      var canvases = root ? Array.prototype.slice.call(root.querySelectorAll('canvas')).filter(function (x) { return x.width > 16 && x.height > 16; }).sort(function (a, b) { return b.width * b.height - a.width * a.height; }) : [];
      if (canvases.length) { try { setDirectImage(canvases[0].toDataURL('image/png'), label).catch(function (e) { say(e.message, true); }); return; } catch (e) { say('Canvas Designer đang chứa ảnh ngoài hoặc không cho phép chụp cục bộ.', true); return; } }
      say('Designer hiện chưa cung cấp bản dựng ảnh qua snapshotState() hoặc canvas. Mở Designer và thử lại sau khi có bản preview đã render.', true);
    } catch (e) { say(e.message || String(e), true); }
  });
  ['#cv168-text','#cv168-text-effect','#cv168-text-position','#cv168-text-style','#cv168-text-color','#cv168-text-size'].forEach(function (s) { $(s).addEventListener('input', function () { playing = false; $('#cv168-play').textContent = '▶ Xem thử'; still(0); }); });
  fillAssets(); load(); window.addEventListener('focus', fillAssets); card.addEventListener('mouseenter', fillAssets); card.addEventListener('focusin', fillAssets);
  return true;
}
function mountWorkflow() {
  var card = document.getElementById('cv165-card'); if (!card) return false; if (card.querySelector('#cv168-wf')) return true;
  var row = document.createElement('div'); row.id = 'cv168-wf'; row.className = 'row'; row.style.cssText = 'gap:6px;flex-wrap:wrap;margin-top:8px;align-items:center';
  row.innerHTML = '<button type="button" class="btn btn-ghost sm" id="cv168-wfexp">Xuất bản mẫu quy trình</button><button type="button" class="btn btn-ghost sm" id="cv168-wfimp">Nhập bản mẫu</button><input type="file" id="cv168-wff" accept="application/json,.json" style="display:none" aria-label="Chọn tệp bản mẫu quy trình"><span class="tiny" id="cv168-wfmsg" role="status" aria-live="polite"></span>';
  card.appendChild(row); var m = row.querySelector('#cv168-wfmsg');
  row.querySelector('#cv168-wfexp').addEventListener('click', function () { var j = exportWorkflows(); if (JSON.parse(j).workflows.length === 0) { m.textContent = 'Chưa có quy trình nào để xuất.'; return; } var a = document.createElement('a'), u = URL.createObjectURL(new Blob([j], { type: 'application/json' })); a.href = u; a.download = 'canvio-quy-trinh-ai.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 500); m.textContent = 'Đã xuất bản mẫu.'; });
  row.querySelector('#cv168-wfimp').addEventListener('click', function () { row.querySelector('#cv168-wff').click(); });
  row.querySelector('#cv168-wff').addEventListener('change', function (e) { var f = e.target.files[0]; if (!f) return; f.text().then(function (t) { var r = importWorkflows(t); m.textContent = r.ok ? 'Đã nhập ' + r.added + ' quy trình' + (r.skipped ? ', bỏ qua ' + r.skipped + ' trùng' : '') + '.' : r.error; if (r.ok && r.added) { try { var A = window.CVAiWorkflowP165; if (A && A.mount) { var wf = document.getElementById('cv165-workflow'); if (wf && window.CVCreativeCore) { /* làm mới danh sách */ wf.dispatchEvent(new Event('focus')); } } } catch (er) {} } }); e.target.value = ''; });
  return true;
}
function ready() { var n = 0; (function loop() { var a = false, b = false; try { a = mountMotion(); } catch (e) {} try { b = mountWorkflow(); } catch (e) {} if (!(a && b) && ++n < 120) setTimeout(loop, 500); })(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
window.CVMotionTemplatesP168 = { version: '168.1.0', PRESETS: PRESETS, SIZES: SIZES, transformAt: transformAt, drawFrame: drawFrame, drawOverlay: drawOverlay, normalizeOverlay: normalizeOverlay, extractDesignSource: extractDesignSource, frameCount: frameCount, exportWorkflows: exportWorkflows, parseWorkflows: parseWorkflows, importWorkflows: importWorkflows, mountMotion: mountMotion, mountWorkflow: mountWorkflow };
})();
