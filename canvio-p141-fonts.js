/* P141 · Quản lý font cục bộ: đọc nhiều tệp .ttf người dùng chọn, kiểm độ phủ chữ tiếng Việt (146 ký tự dựng sẵn), nhận biết font biến thiên, gợi ý cặp font (serif tiêu đề + sans nội dung) và xuất báo cáo JSON.
   Dùng bộ đọc TrueType của P118 (CVWordmarkP118.parse). Font chỉ ở trong bộ nhớ trang, không tải lên đâu. Không hỗ trợ .otf (CFF)/.woff; "đủ dấu" chỉ nghĩa là có glyph cho ký tự dựng sẵn, không bảo đảm dấu đặt đẹp (mark positioning/GPOS). Không tạo gói font offline: tệp font phải do người dùng cung cấp. */
(function () {
'use strict';
if (window.CVFontsP141) return;
var VN = (function () { var s = {}, b = 'AĂÂEÊIOÔƠUƯYaăâeêioôơuưy', m = ['̀', '̉', '̃', '́', '̣'], i, j; for (i = 0; i < b.length; i++) { s[b[i]] = 1; for (j = 0; j < m.length; j++) { var c = (b[i] + m[j]).normalize('NFC'); if (c.length === 1) s[c] = 1; } } s['Đ'] = 1; s['đ'] = 1; return Object.keys(s); })();
function nameOf(f, id) {
  var T = f.T.name; if (!T) return ''; var d = f.d, n = d.getUint16(T.off + 2), so = T.off + d.getUint16(T.off + 4), best = '', i;
  for (i = 0; i < n; i++) { var r = T.off + 6 + i * 12, pl = d.getUint16(r), nid = d.getUint16(r + 6), len = d.getUint16(r + 8), off = so + d.getUint16(r + 10); if (nid !== id || off + len > d.byteLength) continue; var s = '', k; if (pl === 3 || pl === 0) { for (k = 0; k + 1 < len; k += 2) s += String.fromCharCode(d.getUint16(off + k)); } else { for (k = 0; k < len; k++) s += String.fromCharCode(d.getUint8(off + k)); } if (s && (pl === 3 || !best)) best = s; }
  return best.slice(0, 80);
}
function os2(f) { var t = f.T['OS/2']; if (!t || t.len < 32) return { weight: 400, serif: null }; var d = f.d, w = d.getUint16(t.off + 4), fam = d.getUint8(t.off + 32), ser = d.getUint8(t.off + 33); return { weight: w, serif: fam === 2 ? (ser >= 11 && ser <= 13 ? false : (ser >= 2 ? true : null)) : null }; }
function analyze(buf, fileName) {
  var P = window.CVWordmarkP118; if (!P) throw new Error('Thiếu mô-đun đọc font (P118).');
  var f = P.parse(buf), missing = [], i; for (i = 0; i < VN.length; i++) if (!f.cmap(VN[i].codePointAt(0))) missing.push(VN[i]);
  var o = os2(f), fam = nameOf(f, 16) || nameOf(f, 1) || String(fileName || 'font').replace(/\.ttf$/i, ''), sub = nameOf(f, 17) || nameOf(f, 2);
  return { file: String(fileName || '').slice(0, 80), family: fam, style: sub, weight: o.weight, serif: o.serif, variable: !!f.T.fvar, glyphs: f.numGlyphs, vnTotal: VN.length, vnMissing: missing, vnCoverage: Math.round((VN.length - missing.length) / VN.length * 1000) / 10, vnComplete: missing.length === 0, kerning: !!(f.kern || f.gpos) };
}
function suggest(list) {
  var ok = (list || []).filter(function (x) { return x && x.vnComplete; }), seen = {}, fams = [];
  ok.forEach(function (x) { if (!seen[x.family]) { seen[x.family] = 1; fams.push(x); } });
  var serif = fams.filter(function (x) { return x.serif === true; }), sans = fams.filter(function (x) { return x.serif === false; }), pairs = [];
  serif.forEach(function (a) { sans.forEach(function (b) { pairs.push({ heading: a.family, body: b.family }); }); });
  return pairs.slice(0, 6);
}
function report(list) { return { generated: new Date().toISOString().slice(0, 10), vnCharset: VN.length, fonts: list, completeFonts: list.filter(function (x) { return x.vnComplete; }).length, suggestions: suggest(list), note: 'Chỉ kiểm glyph dựng sẵn; không đánh giá vị trí dấu hay giấy phép font.' }; }
function mount() {
  var page = document.getElementById('page-brand'); if (!page || page.querySelector('#cv141-card')) return false;
  var anchor = page.querySelector('#cv118-card') || page.querySelector('.grid.g2'), card = document.createElement('div'); card.className = 'card'; card.id = 'cv141-card'; card.style.marginBottom = '14px';
  card.innerHTML = '<div class="cardTop"><h3>Quản lý font (P141)</h3><span class="sub">kiểm đủ dấu tiếng Việt</span></div><div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><input type="file" id="cv141-files" multiple accept=".ttf,font/ttf" aria-label="Chọn các font .ttf"/><button type="button" class="btn btn-ghost sm" id="cv141-json" disabled>Tải báo cáo JSON</button></div><div id="cv141-list" style="margin-top:8px;display:grid;gap:6px"></div><div class="tiny" id="cv141-out" role="status" aria-live="polite">Chọn một hoặc nhiều font .ttf trên máy. Font không rời máy bạn.</div>';
  anchor.parentNode.insertBefore(card, anchor.nextSibling);
  var list = [], $ = function (s) { return card.querySelector(s); }, loaded = {};
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function draw() {
    var box = $('#cv141-list'); box.innerHTML = ''; list.forEach(function (x) { var r = document.createElement('div'); r.className = 'row'; r.style.cssText = 'gap:8px;align-items:center;flex-wrap:wrap'; var fam = x.cssFamily ? 'font-family:\'' + x.cssFamily + '\',sans-serif;' : ''; r.innerHTML = '<b style="min-width:150px">' + esc(x.family) + ' <span class="tiny">' + esc(x.style) + '</span></b><span class="badgeSoft" style="' + (x.vnComplete ? '' : 'opacity:.75') + '">' + (x.vnComplete ? 'Đủ dấu' : 'Thiếu ' + x.vnMissing.length + '/' + x.vnTotal) + '</span><span class="tiny">' + x.vnCoverage + '%' + (x.variable ? ' · biến thiên' : '') + (x.kerning ? ' · kerning' : '') + '</span><span style="' + fam + 'font-size:20px">Tiếng Việt: Ắ ằ ẳ ẵ ặ Đ đ ơ ư ệ ỳ</span>'; box.appendChild(r); });
    var sg = suggest(list); $('#cv141-out').textContent = list.length + ' font · ' + list.filter(function (x) { return x.vnComplete; }).length + ' đủ dấu' + (sg.length ? ' · gợi ý cặp: ' + sg.slice(0, 3).map(function (p) { return p.heading + ' + ' + p.body; }).join('; ') : ''); $('#cv141-json').disabled = !list.length;
  }
  $('#cv141-files').addEventListener('change', function () {
    var files = Array.prototype.slice.call(this.files || [], 0, 12), errs = 0; list = [];
    Promise.all(files.map(function (fl, idx) { if (fl.size > 20 * 1048576) { errs++; return null; } return fl.arrayBuffer().then(function (b) { var a = analyze(b, fl.name); a.cssFamily = 'cv141f' + idx; try { var ff = new FontFace(a.cssFamily, b.slice(0)); return ff.load().then(function () { document.fonts.add(ff); return a; }, function () { a.cssFamily = ''; return a; }); } catch (e) { a.cssFamily = ''; return a; } }).catch(function () { errs++; return null; }); })).then(function (r) { list = r.filter(Boolean); draw(); if (errs) $('#cv141-out').textContent += ' · ' + errs + ' tệp bị bỏ qua (không phải .ttf hợp lệ hoặc >20MB)'; });
  });
  $('#cv141-json').addEventListener('click', function () { var rep = report(list.map(function (x) { var c = Object.assign({}, x); delete c.cssFamily; return c; })), u = URL.createObjectURL(new Blob([JSON.stringify(rep, null, 1)], { type: 'application/json' })), a = document.createElement('a'); a.href = u; a.download = 'font-report.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); });
  return true;
}
function ready() { try { mount(); } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
window.CVFontsP141 = { version: '141.1.0', VN: VN, analyze: analyze, suggest: suggest, report: report, mount: mount };
})();
