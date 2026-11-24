/* P155–P157 · Gói “Cảnh nhất quán” trong Video Studio.
   P155 Thẻ Nhân vật / Thẻ Không gian (mô tả cố định + ảnh tham chiếu từ Bảng cảm hứng), dùng lại qua nhiều cảnh.
   P156 Prompt có phân công vai (ai lo ngoại hình nhân vật, môi trường, góc máy).
   P157 Thư viện góc máy dựng sẵn + kiểm tra lệch tông giữa hai ảnh/cảnh liền nhau.
   Chạy cục bộ; không tự gửi mạng. Thẻ lưu ở localStorage `canvio.p155.cards` (mảng có id → Cloud Sync P130 đồng bộ từng thẻ). */
(function () {
'use strict';
if (window.CVScenePackP155) return;
var KEY = 'canvio.p155.cards';
var SHOTS = [
  { id: 'wide-follow', name: 'Toàn cảnh bám theo', dur: 5, text: 'toàn cảnh quay từ xa, máy bám theo chủ thể chuyển động, thấy rõ cả đường và môi trường xung quanh' },
  { id: 'close-follow', name: 'Bám sát thân', dur: 4, text: 'máy bám sát sau chủ thể, khoảng cách gần, rung nhẹ tạo cảm giác tốc độ' },
  { id: 'pov', name: 'Góc nhìn nhân vật (POV)', dur: 4, text: 'góc nhìn thứ nhất từ mắt nhân vật, thấy tay và phía trước' },
  { id: 'over-shoulder', name: 'Qua vai', dur: 4, text: 'máy đặt sau vai nhân vật, hướng về đối tượng phía trước' },
  { id: 'closeup', name: 'Cận mặt', dur: 3, text: 'cận cảnh khuôn mặt, nhấn vào ánh mắt và biểu cảm, nền mờ' },
  { id: 'impact', name: 'Cận cảnh va chạm', dur: 2, text: 'cận cảnh khoảnh khắc va chạm, chuyển động chậm ngắn, bụi và mảnh vụn bay' },
  { id: 'orbit', name: 'Quỹ đạo quanh chủ thể', dur: 5, text: 'máy quay vòng quanh chủ thể 180 độ, giữ chủ thể ở giữa khung' },
  { id: 'dolly-in', name: 'Dolly tiến vào', dur: 4, text: 'máy tiến chậm vào chủ thể theo đường thẳng, nhấn mạnh cảm xúc' },
  { id: 'establishing', name: 'Cảnh thiết lập', dur: 4, text: 'cảnh rộng giới thiệu không gian, máy đứng yên hoặc trượt rất chậm' },
  { id: 'top-down', name: 'Từ trên cao xuống', dur: 4, text: 'góc nhìn từ trên cao thẳng xuống, thấy bố cục mặt bằng' }
];
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function readCards() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function writeCards(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (e) { return false; } }
function clip(s, n) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n); }
function saveCard(c) {
  if (!c || (c.type !== 'character' && c.type !== 'space')) return { ok: false, error: 'Loại thẻ không hợp lệ.' };
  var name = clip(c.name, 60); if (!name) return { ok: false, error: 'Hãy đặt tên cho thẻ.' };
  var desc = clip(c.desc, 700); if (!desc) return { ok: false, error: 'Hãy mô tả thẻ (ngoại hình/không gian).' };
  var list = readCards(), old = c.id ? list.filter(function (x) { return x.id === c.id; })[0] : null;
  var card = { id: old ? old.id : uid(), type: c.type, name: name, desc: desc, traits: clip(c.traits, 300), refs: (c.refs || []).slice(0, 3).map(String), at: Date.now() };
  if (old) list[list.indexOf(old)] = card; else list.unshift(card);
  if (!writeCards(list)) return { ok: false, error: 'Bộ nhớ trình duyệt đầy.' };
  return { ok: true, card: card };
}
function removeCard(id) { return writeCards(readCards().filter(function (x) { return x.id !== id; })); }
function exportCards() { return JSON.stringify({ canvio: 'p155-cards', version: 1, cards: readCards() }); }
function importCards(text) {
  var o; try { o = JSON.parse(text); } catch (e) { return { ok: false, error: 'Tệp không phải JSON hợp lệ.' }; }
  if (!o || o.canvio !== 'p155-cards' || !Array.isArray(o.cards)) return { ok: false, error: 'Không phải tệp thẻ CANVIO.' };
  var list = readCards(), n = 0;
  o.cards.forEach(function (c) { if (!c || (c.type !== 'character' && c.type !== 'space') || !clip(c.name, 60) || !clip(c.desc, 700)) return; var card = { id: String(c.id || uid()).slice(0, 40), type: c.type, name: clip(c.name, 60), desc: clip(c.desc, 700), traits: clip(c.traits, 300), refs: (c.refs || []).slice(0, 3).map(String), at: Date.now() }; var i = list.map(function (x) { return x.id; }).indexOf(card.id); if (i >= 0) list[i] = card; else list.unshift(card); n++; });
  return writeCards(list) ? { ok: true, count: n } : { ok: false, error: 'Bộ nhớ trình duyệt đầy.' };
}
function shotById(id) { return SHOTS.filter(function (s) { return s.id === id; })[0] || null; }
/* roles: { character:{cardId?, ref?}, environment:{cardId?, ref?}, camera:{shotId?, ref?} }; cards: danh sách thẻ. */
function buildPrompt(opt) {
  opt = opt || {}; var cards = opt.cards || readCards(), roles = opt.roles || {}, lines = [], miss = [];
  function card(id) { return cards.filter(function (c) { return c.id === id; })[0] || null; }
  var ch = roles.character && card(roles.character.cardId), env = roles.environment && card(roles.environment.cardId), sh = roles.camera && shotById(roles.camera.shotId), action = clip(opt.action, 400);
  if (!ch) miss.push('nhân vật'); if (!env) miss.push('không gian'); if (!sh) miss.push('góc máy'); if (!action) miss.push('hành động');
  if (miss.length) return { ok: false, error: 'Còn thiếu: ' + miss.join(', ') + '.' };
  function refTxt(r) { r = r && clip(r.ref, 60); return r ? ' (tham chiếu: ' + r + ')' : ''; }
  lines.push('[Nhân vật]' + refTxt(roles.character) + ' ' + ch.name + ': ' + ch.desc + (ch.traits ? '. Đặc điểm riêng: ' + ch.traits : '') + '. Giữ nguyên ngoại hình ở mọi cảnh.');
  lines.push('[Không gian]' + refTxt(roles.environment) + ' ' + env.name + ': ' + env.desc + (env.traits ? '. Chi tiết cố định: ' + env.traits : '') + '. Không đổi bối cảnh giữa các cảnh.');
  lines.push('[Góc máy]' + refTxt(roles.camera) + ' ' + sh.name + ': ' + sh.text + '.');
  lines.push('[Hành động] ' + action + '.');
  lines.push('Phân công: ảnh tham chiếu nhân vật chỉ quyết định ngoại hình; ảnh không gian quyết định bối cảnh, ánh sáng, đồ vật; góc máy lấy theo mục [Góc máy].');
  return { ok: true, prompt: lines.join('\n'), shotSeconds: sh.dur };
}
/* Lệch tông: khoảng cách trung bình giữa các màu chủ đạo (hex) của hai ảnh, thang 0–100. */
function rgbOf(h) { h = String(h || '').replace('#', ''); var n = parseInt(h, 16); return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function toneDelta(a, b) {
  if (!a || !a.length || !b || !b.length) return null;
  function best(list, c) { var m = 1e9; list.forEach(function (h) { var r = rgbOf(h), d = Math.sqrt(Math.pow(r[0] - c[0], 2) + Math.pow(r[1] - c[1], 2) + Math.pow(r[2] - c[2], 2)); if (d < m) m = d; }); return m; }
  var s = 0; a.forEach(function (h) { s += best(b, rgbOf(h)); }); b.forEach(function (h) { s += best(a, rgbOf(h)); });
  return Math.round(s / (a.length + b.length) / 441.67 * 1000) / 10;
}
function toneVerdict(d, limit) { limit = limit == null ? 14 : limit; if (d == null) return { ok: null, text: 'Chưa đủ dữ liệu màu.' }; return d > limit ? { ok: false, text: 'Lệch tông (' + d + ' > ' + limit + '): hai cảnh trông như khác bối cảnh, hãy chỉnh màu hoặc dùng lại ảnh tham chiếu.' } : { ok: true, text: 'Cùng tông (' + d + ' ≤ ' + limit + ').' }; }
/* ---------- giao diện ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function toast(t) { try { if (window.CV && CV.toast) CV.toast(t); } catch (e) {} }
function mount() {
  var page = document.getElementById('page-videoStudio'); if (!page) return false; if (page.querySelector('#cv155-card')) return true;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv155-card'; card.style.cssText = 'margin:0 0 14px;padding:14px';
  card.innerHTML = '<h3 style="margin:0">Cảnh nhất quán: thẻ, góc máy, prompt</h3><p class="tiny" style="margin:2px 0 10px">Tạo thẻ Nhân vật/Không gian một lần, dùng lại cho mọi cảnh để video AI không đổi mặt hay đổi bối cảnh.</p>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap" role="tablist" aria-label="Công cụ cảnh nhất quán">'
    + ['cards:Thẻ', 'prompt:Prompt phân công', 'shots:Góc máy', 'tone:Kiểm tra tông'].map(function (t, i) { var p = t.split(':'); return '<button type="button" role="tab" class="btn ' + (i ? 'btn-ghost' : 'btn-soft') + ' sm cv155-tab" data-t="' + p[0] + '" aria-selected="' + (i === 0) + '">' + p[1] + '</button>'; }).join('') + '</div>'
    + '<div id="cv155-body" style="margin-top:10px"></div><div id="cv155-msg" class="tiny" role="status" aria-live="polite" style="min-height:16px;margin-top:6px"></div>';
  var anchor = page.querySelector('#cv154-card'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling); else { var head = page.querySelector('.head'); if (head && head.parentNode) head.parentNode.insertBefore(card, head.nextSibling); else page.insertBefore(card, page.firstChild); }
  var body = card.querySelector('#cv155-body'), msg = card.querySelector('#cv155-msg'), tab = 'cards', editing = null;
  function say(t, bad) { msg.textContent = t; msg.style.color = bad ? '#b4233b' : ''; }
  function boardItems() { return window.CVBoardP153 ? window.CVBoardP153.list().filter(function (i) { return i.type === 'img'; }) : []; }
  function opts(list, sel, ph) { return '<option value="">' + ph + '</option>' + list.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === sel ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join(''); }
  function viewCards() {
    var list = readCards(), e = editing && list.filter(function (c) { return c.id === editing; })[0] || {}, imgs = boardItems();
    body.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px"><div style="display:grid;gap:6px">'
      + '<select class="input" id="cv155-type" aria-label="Loại thẻ"><option value="character"' + (e.type === 'character' ? ' selected' : '') + '>Thẻ Nhân vật</option><option value="space"' + (e.type === 'space' ? ' selected' : '') + '>Thẻ Không gian</option></select>'
      + '<input class="input" id="cv155-name" maxlength="60" placeholder="Tên thẻ (vd: Thám tử Minh)" aria-label="Tên thẻ" value="' + esc(e.name) + '">'
      + '<textarea class="input" id="cv155-desc" rows="3" maxlength="700" placeholder="Mô tả cố định: ngoại hình, trang phục / kiểu nhà, ánh sáng, tông màu…" aria-label="Mô tả thẻ">' + esc(e.desc) + '</textarea>'
      + '<input class="input" id="cv155-traits" maxlength="300" placeholder="Đặc điểm riêng (tàn nhang, sẹo, đồ vật cố định…)" aria-label="Đặc điểm riêng" value="' + esc(e.traits) + '">'
      + [0, 1, 2].map(function (i) { return '<select class="input cv155-ref" aria-label="Ảnh tham chiếu ' + (i + 1) + '">' + opts(imgs, (e.refs || [])[i], '— ảnh tham chiếu ' + (i + 1) + ' (từ Bảng cảm hứng) —') + '</select>'; }).join('')
      + '<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn btn-primary sm" id="cv155-save" type="button">' + (e.id ? 'Cập nhật thẻ' : 'Lưu thẻ') + '</button>' + (e.id ? '<button class="btn btn-ghost sm" id="cv155-cancel" type="button">Hủy sửa</button>' : '') + '<button class="btn btn-ghost sm" id="cv155-exp" type="button">Xuất JSON</button><button class="btn btn-ghost sm" id="cv155-imp" type="button">Nhập JSON</button><input type="file" id="cv155-impf" accept="application/json,.json" style="display:none" aria-label="Chọn tệp thẻ JSON"></div></div>'
      + '<div style="display:grid;gap:6px;align-content:start" id="cv155-list">' + (list.length ? list.map(function (c) { var th = (c.refs || []).map(function (id) { var it = imgs.filter(function (x) { return x.id === id; })[0]; return it ? '<img src="' + esc(it.thumb) + '" alt="" style="width:34px;height:26px;object-fit:cover;border-radius:4px">' : ''; }).join(''); return '<div class="card" style="padding:8px"><div style="font-weight:700;font-size:13px">' + (c.type === 'character' ? '🧑 ' : '🏠 ') + esc(c.name) + '</div><div class="tiny">' + esc(c.desc.slice(0, 110)) + (c.desc.length > 110 ? '…' : '') + '</div><div class="row" style="gap:4px;margin-top:4px;align-items:center">' + th + '<button type="button" class="btn btn-ghost sm cv155-edit" data-id="' + esc(c.id) + '" style="margin-left:auto">Sửa</button><button type="button" class="btn btn-ghost sm cv155-del" data-id="' + esc(c.id) + '">Xóa</button></div></div>'; }).join('') : '<div class="tiny" style="padding:12px;border:1px dashed rgba(128,128,128,.4);border-radius:10px">Chưa có thẻ nào. Tạo thẻ đầu tiên ở bên trái.</div>') + '</div></div>';
    body.querySelector('#cv155-save').addEventListener('click', function () {
      var r = saveCard({ id: e.id, type: body.querySelector('#cv155-type').value, name: body.querySelector('#cv155-name').value, desc: body.querySelector('#cv155-desc').value, traits: body.querySelector('#cv155-traits').value, refs: Array.prototype.map.call(body.querySelectorAll('.cv155-ref'), function (s) { return s.value; }).filter(Boolean) });
      if (!r.ok) { say(r.error, true); return; } editing = null; say('Đã lưu thẻ “' + r.card.name + '”.'); viewCards();
    });
    var cn = body.querySelector('#cv155-cancel'); if (cn) cn.addEventListener('click', function () { editing = null; viewCards(); });
    Array.prototype.forEach.call(body.querySelectorAll('.cv155-edit'), function (b) { b.addEventListener('click', function () { editing = b.dataset.id; viewCards(); }); });
    Array.prototype.forEach.call(body.querySelectorAll('.cv155-del'), function (b) { b.addEventListener('click', function () { if (confirm('Xóa thẻ này?')) { removeCard(b.dataset.id); viewCards(); } }); });
    body.querySelector('#cv155-exp').addEventListener('click', function () { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([exportCards()], { type: 'application/json' })); a.href = u; a.download = 'canvio-the-canh.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 500); });
    body.querySelector('#cv155-imp').addEventListener('click', function () { body.querySelector('#cv155-impf').click(); });
    body.querySelector('#cv155-impf').addEventListener('change', function (ev) { var f = ev.target.files[0]; if (!f) return; f.text().then(function (t) { var r = importCards(t); say(r.ok ? 'Đã nhập ' + r.count + ' thẻ.' : r.error, !r.ok); viewCards(); }); ev.target.value = ''; });
  }
  function viewPrompt() {
    var cards = readCards(), ch = cards.filter(function (c) { return c.type === 'character'; }), sp = cards.filter(function (c) { return c.type === 'space'; });
    body.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px"><select class="input" id="cv156-ch" aria-label="Thẻ nhân vật">' + opts(ch, '', '— Thẻ nhân vật —') + '</select><select class="input" id="cv156-sp" aria-label="Thẻ không gian">' + opts(sp, '', '— Thẻ không gian —') + '</select>'
      + '<select class="input" id="cv156-sh" aria-label="Góc máy">' + opts(SHOTS, '', '— Góc máy —') + '</select><input class="input" id="cv156-ac" maxlength="400" placeholder="Hành động trong cảnh (vd: lao xe qua ngã tư, quay đầu nhìn lại)" aria-label="Hành động"></div>'
      + '<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><input class="input" id="cv156-r1" maxlength="60" placeholder="Ảnh nào lo nhân vật (vd: ảnh 1)" aria-label="Ảnh lo nhân vật" style="flex:1;min-width:160px"><input class="input" id="cv156-r2" maxlength="60" placeholder="Ảnh nào lo môi trường (vd: ảnh 2)" aria-label="Ảnh lo môi trường" style="flex:1;min-width:160px"><input class="input" id="cv156-r3" maxlength="60" placeholder="Ảnh nào lo góc máy (vd: ảnh 3)" aria-label="Ảnh lo góc máy" style="flex:1;min-width:160px"></div>'
      + '<div class="row" style="gap:6px;margin-top:8px"><button class="btn btn-primary sm" id="cv156-go" type="button">Tạo prompt</button><button class="btn btn-soft sm" id="cv156-cp" type="button" disabled>Sao chép</button></div><textarea class="input" id="cv156-out" rows="7" readonly aria-label="Prompt đã tạo" style="margin-top:8px;width:100%"></textarea>';
    var out = body.querySelector('#cv156-out'), cp = body.querySelector('#cv156-cp');
    body.querySelector('#cv156-go').addEventListener('click', function () {
      var v = function (s) { return body.querySelector(s).value; };
      var r = buildPrompt({ cards: cards, action: v('#cv156-ac'), roles: { character: { cardId: v('#cv156-ch'), ref: v('#cv156-r1') }, environment: { cardId: v('#cv156-sp'), ref: v('#cv156-r2') }, camera: { shotId: v('#cv156-sh'), ref: v('#cv156-r3') } } });
      if (!r.ok) { out.value = ''; cp.disabled = true; say(r.error, true); return; } out.value = r.prompt; cp.disabled = false; say('Đã tạo prompt (gợi ý ' + r.shotSeconds + ' giây).');
    });
    cp.addEventListener('click', function () { try { navigator.clipboard.writeText(out.value).then(function () { toast('Đã sao chép prompt'); }, function () { out.select(); say('Không tự sao chép được, hãy bấm Ctrl+C.', true); }); } catch (e) { out.select(); } });
  }
  function viewShots() {
    body.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px">' + SHOTS.map(function (s) { return '<div class="card" style="padding:8px"><div style="font-weight:700;font-size:13px">' + esc(s.name) + ' <span class="tiny">· ' + s.dur + ' giây</span></div><div class="tiny" style="margin:4px 0">' + esc(s.text) + '</div><button type="button" class="btn btn-ghost sm cv157-cp" data-id="' + s.id + '">Sao chép mô tả</button></div>'; }).join('') + '</div>';
    Array.prototype.forEach.call(body.querySelectorAll('.cv157-cp'), function (b) { b.addEventListener('click', function () { var s = shotById(b.dataset.id); try { navigator.clipboard.writeText(s.name + ': ' + s.text).then(function () { toast('Đã sao chép góc máy'); }); } catch (e) {} }); });
  }
  function viewTone() {
    var imgs = boardItems().filter(function (i) { return i.colors && i.colors.length; });
    body.innerHTML = '<p class="tiny" style="margin:0 0 8px">Chọn khung cuối của cảnh trước và khung đầu của cảnh sau (ảnh trong Bảng cảm hứng). Công cụ so màu chủ đạo và báo nếu hai cảnh lệch tông.</p><div class="row" style="gap:6px;flex-wrap:wrap;align-items:center"><select class="input" id="cv157-a" aria-label="Khung cuối cảnh trước" style="flex:1;min-width:180px">' + opts(imgs, '', '— Cảnh trước —') + '</select><select class="input" id="cv157-b" aria-label="Khung đầu cảnh sau" style="flex:1;min-width:180px">' + opts(imgs, '', '— Cảnh sau —') + '</select><label class="tiny">Ngưỡng <input class="input" id="cv157-t" type="number" min="1" max="60" value="14" style="width:70px"></label><button class="btn btn-primary sm" id="cv157-go" type="button">So sánh</button></div><div id="cv157-r" class="tiny" style="margin-top:8px"></div>';
    body.querySelector('#cv157-go').addEventListener('click', function () {
      var a = imgs.filter(function (i) { return i.id === body.querySelector('#cv157-a').value; })[0], b = imgs.filter(function (i) { return i.id === body.querySelector('#cv157-b').value; })[0], r = body.querySelector('#cv157-r');
      if (!a || !b) { r.textContent = 'Hãy chọn đủ hai ảnh.'; r.style.color = '#b4233b'; return; }
      var v = toneVerdict(toneDelta(a.colors, b.colors), +body.querySelector('#cv157-t').value || 14); r.style.color = v.ok === false ? '#b4233b' : '#0a7a55'; r.textContent = v.text;
    });
  }
  function show() { Array.prototype.forEach.call(card.querySelectorAll('.cv155-tab'), function (b) { var on = b.dataset.t === tab; b.setAttribute('aria-selected', on); b.className = 'btn ' + (on ? 'btn-soft' : 'btn-ghost') + ' sm cv155-tab'; }); ({ cards: viewCards, prompt: viewPrompt, shots: viewShots, tone: viewTone })[tab](); }
  Array.prototype.forEach.call(card.querySelectorAll('.cv155-tab'), function (b) { b.addEventListener('click', function () { tab = b.dataset.t; say(''); show(); }); });
  show(); return true;
}
function ready() { var n = 0; (function loop() { try { if (mount()) return; } catch (e) {} if (++n < 40) setTimeout(loop, 250); })(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
window.CVScenePackP155 = { version: '155.0.0', SHOTS: SHOTS, readCards: readCards, saveCard: saveCard, removeCard: removeCard, exportCards: exportCards, importCards: importCards, buildPrompt: buildPrompt, toneDelta: toneDelta, toneVerdict: toneVerdict, mount: mount };
})();
