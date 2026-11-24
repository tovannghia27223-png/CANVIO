/* P153 · Bảng cảm hứng (Inspiration Board) trong trang Tài nguyên.
   Thả ảnh / dán link / ghi chú → tự tách bảng màu chủ đạo, lọc theo màu và loại. Chạy cục bộ, không gọi mạng.
   Lưu: siêu dữ liệu + ảnh nhỏ (thumb) trong localStorage `canvio.p153.board` (mảng có id → Cloud Sync P130 đồng bộ từng mục);
   ảnh đầy đủ nằm trong IndexedDB `CANVIO_SCENE_STORE` (dùng chung với P154/P155). */
(function () {
'use strict';
if (window.CVBoardP153) return;
var KEY = 'canvio.p153.board', DBN = 'CANVIO_SCENE_STORE', ST = 'img';
var KINDS = ['Poster', 'Web', 'Motion', 'Logo', 'Typography', 'Ảnh', 'Cảnh', 'Khác'];
var COLORS = ['Đỏ', 'Cam', 'Vàng', 'Xanh lá', 'Xanh dương', 'Tím', 'Hồng', 'Nâu', 'Xám', 'Đen', 'Trắng'];
var CHIP = { 'Đỏ': '#dc2626', 'Cam': '#f97316', 'Vàng': '#eab308', 'Xanh lá': '#16a34a', 'Xanh dương': '#2563eb', 'Tím': '#7c3aed', 'Hồng': '#ec4899', 'Nâu': '#92400e', 'Xám': '#9ca3af', 'Đen': '#111827', 'Trắng': '#f8fafc' };
/* ---------- thuần (test được bằng Node) ---------- */
function hex(r, g, b) { return '#' + [r, g, b].map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
function rgbOf(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.replace(/(.)/g, '$1$1'); var n = parseInt(h, 16); return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
  if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
function colorNameOf(h) {
  var c = rgbOf(h), x = hsl(c[0], c[1], c[2]), H = x[0], S = x[1], L = x[2];
  if (L < .13) return 'Đen'; if (L > .92) return 'Trắng'; if (S < .12) return L < .22 ? 'Đen' : L > .85 ? 'Trắng' : 'Xám';
  if (H >= 15 && H < 45 && L < .38 && S < .8) return 'Nâu';
  if (H < 12 || H >= 345) return L > .7 ? 'Hồng' : 'Đỏ'; if (H < 45) return 'Cam'; if (H < 70) return 'Vàng'; if (H < 165) return 'Xanh lá';
  if (H < 255) return 'Xanh dương'; if (H < 295) return 'Tím'; return 'Hồng';
}
/* px: Uint8ClampedArray RGBA. Trả về tối đa n màu hex, sắp theo độ phủ, bỏ qua điểm gần trong suốt. */
function palette(px, n) {
  n = n || 5; var bins = Object.create(null), i, a, key, b;
  for (i = 0; i + 3 < px.length; i += 4) {
    a = px[i + 3]; if (a < 128) continue;
    key = (px[i] >> 4) * 256 + (px[i + 1] >> 4) * 16 + (px[i + 2] >> 4);
    b = bins[key] || (bins[key] = [0, 0, 0, 0]); b[0]++; b[1] += px[i]; b[2] += px[i + 1]; b[3] += px[i + 2];
  }
  var list = Object.keys(bins).map(function (k) { var v = bins[k]; return { n: v[0], c: [v[1] / v[0], v[2] / v[0], v[3] / v[0]] }; }).sort(function (x, y) { return y.n - x.n; });
  var out = [];
  list.forEach(function (e) { if (out.length >= n) return; if (out.every(function (o) { var dr = o.c[0] - e.c[0], dg = o.c[1] - e.c[1], db = o.c[2] - e.c[2]; return dr * dr + dg * dg + db * db > 40 * 40; })) out.push(e); });
  return out.map(function (e) { return hex(e.c[0], e.c[1], e.c[2]); });
}
function namesOf(colors) { var s = []; (colors || []).forEach(function (h) { var n = colorNameOf(h); if (s.indexOf(n) < 0) s.push(n); }); return s; }
function filterItems(items, f) {
  f = f || {}; var q = String(f.q || '').trim().toLowerCase();
  return (items || []).filter(function (it) {
    if (f.kind && it.kind !== f.kind) return false;
    if (f.color && (it.names || []).indexOf(f.color) < 0) return false;
    if (q && ((it.name || '') + ' ' + (it.note || '') + ' ' + (it.url || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function safeUrl(u) { u = String(u || '').trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } }
function uid() { return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
/* ---------- lưu trữ ---------- */
function readList() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function writeList(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (e) { return false; } }
var dbP = null;
function openDb() {
  if (dbP) return dbP;
  dbP = new Promise(function (ok, no) {
    if (!window.indexedDB) { no(new Error('Không có IndexedDB')); return; }
    var q = indexedDB.open(DBN, 1);
    q.onupgradeneeded = function () { if (!q.result.objectStoreNames.contains(ST)) q.result.createObjectStore(ST, { keyPath: 'id' }); };
    q.onsuccess = function () { ok(q.result); }; q.onerror = function () { no(q.error); };
  });
  return dbP;
}
function idbPut(id, data) { return openDb().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction(ST, 'readwrite'); t.objectStore(ST).put({ id: id, data: data, at: Date.now() }); t.oncomplete = ok; t.onerror = function () { no(t.error); }; }); }); }
function idbGet(id) { return openDb().then(function (d) { return new Promise(function (ok, no) { var q = d.transaction(ST).objectStore(ST).get(id); q.onsuccess = function () { ok(q.result ? q.result.data : null); }; q.onerror = function () { no(q.error); }; }); }); }
function idbDel(id) { return openDb().then(function (d) { return new Promise(function (ok) { var t = d.transaction(ST, 'readwrite'); t.objectStore(ST).delete(id); t.oncomplete = ok; t.onerror = ok; }); }); }
window.CVSceneStoreP153 = { put: idbPut, get: idbGet, del: idbDel };
/* ---------- xử lý ảnh (trình duyệt) ---------- */
function loadImg(src) { return new Promise(function (ok, no) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { no(new Error('Không đọc được ảnh')); }; im.src = src; }); }
function draw(im, maxSide, type, q) { var s = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * s)); c.height = Math.max(1, Math.round(im.naturalHeight * s)); var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, c.width, c.height); return { c: c, x: x, url: c.toDataURL(type || 'image/jpeg', q || .82) }; }
function readFile(f) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = function () { no(new Error('Không đọc được tệp')); }; r.readAsDataURL(f); }); }
function addDataUrl(dataUrl, meta) {
  meta = meta || {};
  return loadImg(dataUrl).then(function (im) {
    var small = draw(im, 64), px = small.x.getImageData(0, 0, small.c.width, small.c.height).data, cols = palette(px, 5);
    var th = draw(im, 220, 'image/jpeg', .7), full = draw(im, 1600, 'image/jpeg', .86);
    var it = { id: meta.id || uid(), type: 'img', name: String(meta.name || 'Ảnh').slice(0, 80), kind: KINDS.indexOf(meta.kind) >= 0 ? meta.kind : 'Ảnh', note: String(meta.note || '').slice(0, 400), url: safeUrl(meta.url), colors: cols, names: namesOf(cols), thumb: th.url, w: im.naturalWidth, h: im.naturalHeight, at: Date.now() };
    if (meta.extra && typeof meta.extra === 'object') it.extra = meta.extra;
    return idbPut(it.id, full.url).then(function () { var l = readList(); l.unshift(it); if (!writeList(l)) { return idbDel(it.id).then(function () { throw new Error('Bộ nhớ trình duyệt đầy, hãy xóa bớt mục cũ.'); }); } return it; });
  });
}
function addFile(f, meta) { if (!f || !/^image\//.test(f.type)) return Promise.reject(new Error('Chỉ nhận tệp ảnh.')); if (f.size > 25 * 1024 * 1024) return Promise.reject(new Error('Ảnh quá lớn (tối đa 25MB).')); return readFile(f).then(function (d) { var m = {}; for (var k in meta) m[k] = meta[k]; if (!m.name) m.name = f.name.replace(/\.[^.]+$/, ''); return addDataUrl(d, m); }); }
function addLink(url, meta) {
  meta = meta || {}; var u = safeUrl(url); if (!u) return Promise.reject(new Error('Link không hợp lệ.'));
  var host = ''; try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (e) {}
  var it = { id: uid(), type: 'link', name: String(meta.name || host || 'Liên kết').slice(0, 80), kind: KINDS.indexOf(meta.kind) >= 0 ? meta.kind : 'Khác', note: String(meta.note || '').slice(0, 400), url: u, colors: [], names: [], at: Date.now() };
  var l = readList(); l.unshift(it); return writeList(l) ? Promise.resolve(it) : Promise.reject(new Error('Bộ nhớ trình duyệt đầy.'));
}
function remove(id) { var l = readList().filter(function (x) { return x.id !== id; }); writeList(l); return idbDel(id); }
function update(id, patch) { var l = readList(), it = l.filter(function (x) { return x.id === id; })[0]; if (!it) return false; ['name', 'note', 'kind'].forEach(function (k) { if (patch && patch[k] != null) it[k] = String(patch[k]).slice(0, 400); }); if (KINDS.indexOf(it.kind) < 0) it.kind = 'Khác'; return writeList(l); }
/* ---------- giao diện ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function toast(t) { try { if (window.CV && CV.toast) { CV.toast(t); return; } } catch (e) {} }
function copy(t) { try { navigator.clipboard.writeText(t).then(function () { toast('Đã sao chép ' + t); }, function () { toast('Không sao chép được'); }); } catch (e) { toast('Không sao chép được'); } }
var state = { color: '', kind: '', q: '' };
function css() {
  if (document.getElementById('cv153-style') || !document.head) return;
  var st = document.createElement('style'); st.id = 'cv153-style';
  /* Hiệu ứng nghiêng 3D của thẻ trang Tài nguyên làm lệch vùng bấm: tắt cho bảng cảm hứng và các thẻ Cảnh nhất quán. */
  st.textContent = '#cv153-card,#cv153-card .card,#cv154-card,#cv155-card,#cv155-card .card{transform:none!important;will-change:auto!important}';
  document.head.appendChild(st);
}
function mount() {
  var page = document.getElementById('page-assets'); if (!page) return false; css(); if (page.querySelector('#cv153-card')) return true;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv153-card'; card.style.cssText = 'margin:0 0 14px;padding:14px';
  card.innerHTML = '<div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><div><h3 style="margin:0">Bảng cảm hứng</h3><p class="tiny" style="margin:2px 0 0">Gom ảnh và link tham khảo, tự tách bảng màu, lọc theo màu hoặc loại. Lưu cục bộ trên máy bạn.</p></div><span class="tiny" id="cv153-count" role="status"></span></div>'
    + '<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap;align-items:center"><button class="btn btn-primary sm" id="cv153-add" type="button">+ Thêm ảnh</button><input type="file" id="cv153-file" accept="image/*" multiple style="display:none" aria-label="Chọn ảnh cảm hứng">'
    + '<select class="input" id="cv153-newkind" aria-label="Loại cho mục mới" style="width:auto">' + KINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select>'
    + '<input class="input" id="cv153-link" placeholder="Dán link tham khảo (https://…)" aria-label="Link tham khảo" style="flex:1;min-width:200px"><button class="btn btn-soft sm" id="cv153-addlink" type="button">Thêm link</button></div>'
    + '<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap;align-items:center" id="cv153-filters"></div>'
    + '<div id="cv153-msg" class="tiny" role="status" aria-live="polite" style="min-height:16px;margin-top:6px"></div>'
    + '<div id="cv153-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:6px"></div>';
  var head = page.querySelector('.head'); if (head && head.parentNode) head.parentNode.insertBefore(card, head.nextSibling); else page.insertBefore(card, page.firstChild);
  var $ = function (s) { return card.querySelector(s); }, msg = $('#cv153-msg');
  function say(t, bad) { msg.textContent = t; msg.style.color = bad ? '#b4233b' : ''; }
  function chips() {
    var f = $('#cv153-filters'), h = '<input class="input" id="cv153-q" placeholder="Tìm…" aria-label="Tìm trong bảng cảm hứng" style="width:150px" value="' + esc(state.q) + '">'
      + '<select class="input" id="cv153-kind" aria-label="Lọc theo loại" style="width:auto"><option value="">Mọi loại</option>' + KINDS.map(function (k) { return '<option' + (state.kind === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>';
    COLORS.forEach(function (c) { h += '<button type="button" class="cv153-chip" data-c="' + c + '" aria-pressed="' + (state.color === c) + '" title="Lọc màu ' + c + '" style="width:24px;height:24px;border-radius:50%;border:2px solid ' + (state.color === c ? 'var(--brand,#2563eb)' : 'rgba(128,128,128,.45)') + ';background:' + CHIP[c] + ';padding:0;cursor:pointer"></button>'; });
    h += '<button type="button" class="btn btn-ghost sm" id="cv153-clear"' + (state.color || state.kind || state.q ? '' : ' disabled') + '>Bỏ lọc</button>';
    f.innerHTML = h;
    f.querySelector('#cv153-q').addEventListener('input', function (e) { state.q = e.target.value; grid(); });
    f.querySelector('#cv153-kind').addEventListener('change', function (e) { state.kind = e.target.value; chips(); grid(); });
    Array.prototype.forEach.call(f.querySelectorAll('.cv153-chip'), function (b) { b.addEventListener('click', function () { state.color = state.color === b.dataset.c ? '' : b.dataset.c; chips(); grid(); }); });
    f.querySelector('#cv153-clear').addEventListener('click', function () { state = { color: '', kind: '', q: '' }; chips(); grid(); });
  }
  function grid() {
    var all = readList(), items = filterItems(all, state), g = $('#cv153-grid'); $('#cv153-count').textContent = items.length + '/' + all.length + ' mục';
    if (!items.length) { g.innerHTML = '<div class="tiny" style="grid-column:1/-1;padding:14px;border:1px dashed rgba(128,128,128,.4);border-radius:10px">' + (all.length ? 'Không có mục nào khớp bộ lọc.' : 'Chưa có gì. Bấm “Thêm ảnh” hoặc dán link để bắt đầu bảng cảm hứng.') + '</div>'; return; }
    g.innerHTML = items.map(function (it) {
      var dots = (it.colors || []).map(function (c) { return '<button type="button" class="cv153-dot" data-hex="' + esc(c) + '" title="Sao chép ' + esc(c) + '" aria-label="Sao chép màu ' + esc(c) + '" style="width:18px;height:18px;border-radius:50%;border:1px solid rgba(128,128,128,.5);background:' + esc(c) + ';padding:0;cursor:pointer"></button>'; }).join('');
      var pic = it.type === 'img' ? '<button type="button" class="cv153-open" data-id="' + esc(it.id) + '" aria-label="Xem ảnh ' + esc(it.name) + '" style="display:block;width:100%;padding:0;border:0;background:none;cursor:zoom-in"><img src="' + esc(it.thumb) + '" alt="' + esc(it.name) + '" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;display:block"></button>'
        : '<div style="aspect-ratio:4/3;border-radius:8px;display:grid;place-items:center;background:rgba(128,128,128,.14);font-size:26px" aria-hidden="true">🔗</div>';
      var link = it.url ? '<a href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer" class="tiny" style="word-break:break-all">' + esc(it.url.replace(/^https?:\/\//, '').slice(0, 34)) + '</a>' : '';
      return '<div class="card" style="padding:8px;display:grid;gap:6px" data-id="' + esc(it.id) + '">' + pic + '<div style="font-weight:700;font-size:13px;word-break:break-word">' + esc(it.name) + '</div><div class="tiny">' + esc(it.kind) + (it.note ? ' · ' + esc(it.note) : '') + '</div>' + link
        + '<div class="row" style="gap:4px;flex-wrap:wrap;align-items:center">' + dots + '<button type="button" class="btn btn-ghost sm cv153-del" data-id="' + esc(it.id) + '" aria-label="Xóa ' + esc(it.name) + '" style="margin-left:auto">Xóa</button></div></div>';
    }).join('');
    Array.prototype.forEach.call(g.querySelectorAll('.cv153-dot'), function (b) { b.addEventListener('click', function () { copy(b.dataset.hex); try { document.dispatchEvent(new CustomEvent('cv153:usecolor', { detail: { hex: b.dataset.hex } })); } catch (e) {} }); });
    Array.prototype.forEach.call(g.querySelectorAll('.cv153-del'), function (b) { b.addEventListener('click', function () { if (!confirm('Xóa mục này khỏi bảng cảm hứng?')) return; remove(b.dataset.id).then(function () { grid(); }); }); });
    Array.prototype.forEach.call(g.querySelectorAll('.cv153-open'), function (b) { b.addEventListener('click', function () { idbGet(b.dataset.id).then(function (d) { if (!d) { say('Không tìm thấy ảnh gốc, chỉ còn bản thu nhỏ.', true); return; } view(d); }); }); });
  }
  function view(src) {
    var o = document.createElement('div'); o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Xem ảnh');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:3000;display:grid;place-items:center;cursor:zoom-out;padding:20px';
    var im = document.createElement('img'); im.src = src; im.alt = ''; im.style.cssText = 'max-width:96vw;max-height:92vh;border-radius:8px'; o.appendChild(im);
    function close() { o.remove(); document.removeEventListener('keydown', key); } function key(e) { if (e.key === 'Escape') close(); }
    o.addEventListener('click', close); document.addEventListener('keydown', key); document.body.appendChild(o);
  }
  function add(files) {
    var kind = $('#cv153-newkind').value, list = Array.prototype.slice.call(files || []), ok = 0, bad = [];
    say('Đang xử lý ' + list.length + ' ảnh…');
    return list.reduce(function (p, f) { return p.then(function () { return addFile(f, { kind: kind }).then(function () { ok++; }, function (e) { bad.push(f.name + ': ' + e.message); }); }); }, Promise.resolve())
      .then(function () { say('Đã thêm ' + ok + ' ảnh' + (bad.length ? ' · lỗi: ' + bad.join('; ') : '') + '.', bad.length > 0 && !ok); grid(); });
  }
  $('#cv153-add').addEventListener('click', function () { $('#cv153-file').click(); });
  $('#cv153-file').addEventListener('change', function (e) { add(e.target.files).then(function () { e.target.value = ''; }); });
  $('#cv153-addlink').addEventListener('click', function () { addLink($('#cv153-link').value, { kind: $('#cv153-newkind').value }).then(function () { $('#cv153-link').value = ''; say('Đã thêm link.'); grid(); }, function (e) { say(e.message, true); }); });
  ['dragover', 'drop'].forEach(function (ev) { card.addEventListener(ev, function (e) { if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length && ev === 'dragover') return; e.preventDefault(); if (ev === 'drop') add(e.dataTransfer.files); }); });
  chips(); grid(); window.addEventListener('storage', function (e) { if (e.key === KEY) grid(); });
  card.__refresh = grid; return true;
}
function ready() { var n = 0; (function loop() { try { if (mount()) return; } catch (e) {} if (++n < 40) setTimeout(loop, 250); })(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
window.CVBoardP153 = { version: '153.0.0', KINDS: KINDS, COLORS: COLORS, hex: hex, rgbOf: rgbOf, colorNameOf: colorNameOf, palette: palette, namesOf: namesOf, filterItems: filterItems, safeUrl: safeUrl, list: readList, addDataUrl: addDataUrl, addFile: addFile, addLink: addLink, remove: remove, update: update, mount: mount };
})();
