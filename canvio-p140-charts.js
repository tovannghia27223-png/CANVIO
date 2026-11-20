/* P140 · Biểu đồ dữ liệu -> SVG (cột, đường, tròn, donut) từ CSV dán vào. Không thư viện ngoài, không mạng. Có <title>/<desc> cho trợ năng,
   thoát toàn bộ văn bản, bảng màu có tương phản trên nền sáng. Có thể tải SVG hoặc lưu thẳng vào Tài nguyên. Giới hạn: 1 cột nhãn + 1–3 cột số, ≤ 60 dòng. */
(function () {
'use strict';
if (window.CVChartsP140) return;
var PAL = ['#2563eb', '#e11d48', '#059669', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#4d7c0f', '#c2410c', '#4338ca'];
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function num(v) { var s = String(v == null ? '' : v).trim().replace(/\s/g, ''); if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.'); else s = s.replace(/,/g, ''); var x = parseFloat(s); return isFinite(x) && /^-?[\d.]+(e-?\d+)?%?$/i.test(s) ? x : NaN; }
function parseTable(text) {
  var lines = String(text || '').replace(/\r/g, '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).slice(0, 61);
  if (lines.length < 2) return { labels: [], series: [] };
  var sep = lines[0].indexOf('\t') >= 0 ? '\t' : (lines[0].indexOf(';') >= 0 ? ';' : ','), rows = lines.map(function (l) { var cells = [], cur = '', q = false, k, ch; for (k = 0; k < l.length; k++) { ch = l[k]; if (ch === '"') { if (q && l[k + 1] === '"') { cur += '"'; k++; } else q = !q; } else if (ch === sep && !q) { cells.push(cur.trim()); cur = ''; } else cur += ch; } cells.push(cur.trim()); return cells; });
  var head = rows[0], body = rows.slice(1), cols = Math.min(4, head.length) - 1, series = [], c;
  for (c = 1; c <= cols; c++) series.push({ name: head[c] || ('Dãy ' + c), values: body.map(function (r) { var v = num(r[c]); return isFinite(v) ? v : 0; }) });
  return { labels: body.map(function (r) { return r[0] || ''; }), series: series.filter(function (s) { return s.values.some(function (v) { return v !== 0; }); }) };
}
function niceMax(v) { if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
function fmt(v) { var a = Math.abs(v); return a >= 1e9 ? (v / 1e9).toFixed(1).replace(/\.0$/, '') + ' tỷ' : a >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + ' tr' : a >= 1e4 ? (v / 1e3).toFixed(0) + 'k' : String(Math.round(v * 100) / 100); }
function pt(cx, cy, r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
function build(table, o) {
  o = o || {}; var L = table.labels || [], S = table.series || [], type = ['bar', 'line', 'pie', 'donut'].indexOf(o.type) >= 0 ? o.type : 'bar';
  if (!L.length || !S.length) throw new Error('Cần dòng tiêu đề và ít nhất 1 cột số.');
  var W = 640, H = 400, title = esc(String(o.title || '').slice(0, 80)), pal = (o.colors && o.colors.length ? o.colors : PAL).filter(function (c) { return /^#[0-9a-f]{6}$/i.test(c); }); if (!pal.length) pal = PAL;
  var out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" font-family="system-ui,Segoe UI,Arial,sans-serif">', '<title>' + (title || 'Biểu đồ') + '</title>', '<desc>' + esc(type + ': ' + L.slice(0, 12).join(', ') + ' (' + S.map(function (s) { return s.name; }).join(', ') + ')') + '</desc>', '<rect width="' + W + '" height="' + H + '" fill="#ffffff"/>'];
  if (title) out.push('<text x="' + W / 2 + '" y="28" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a">' + title + '</text>');
  var i, j, top = title ? 46 : 20;
  if (type === 'pie' || type === 'donut') {
    var vals = S[0].values.map(function (v) { return Math.max(0, v); }), tot = vals.reduce(function (a, b) { return a + b; }, 0); if (tot <= 0) throw new Error('Tổng phải lớn hơn 0.');
    var cx = 220, cy = (H + top) / 2, r = Math.min(150, (H - top - 20) / 2), a0 = -Math.PI / 2, ri = type === 'donut' ? r * 0.58 : 0;
    vals.forEach(function (v, k) {
      if (v <= 0) return; var a1 = a0 + v / tot * 2 * Math.PI, big = a1 - a0 > Math.PI ? 1 : 0, p0 = pt(cx, cy, r, a0), p1 = pt(cx, cy, r, a1), col = pal[k % pal.length], d;
      if (v === tot) d = 'M' + (cx - r) + ' ' + cy + 'A' + r + ' ' + r + ' 0 1 1 ' + (cx + r) + ' ' + cy + 'A' + r + ' ' + r + ' 0 1 1 ' + (cx - r) + ' ' + cy + 'Z' + (ri ? 'M' + (cx - ri) + ' ' + cy + 'A' + ri + ' ' + ri + ' 0 1 0 ' + (cx + ri) + ' ' + cy + 'A' + ri + ' ' + ri + ' 0 1 0 ' + (cx - ri) + ' ' + cy + 'Z' : '');
      else { var q0 = pt(cx, cy, ri, a0), q1 = pt(cx, cy, ri, a1); d = ri ? 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + 'A' + r + ' ' + r + ' 0 ' + big + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + 'L' + q1[0].toFixed(2) + ' ' + q1[1].toFixed(2) + 'A' + ri + ' ' + ri + ' 0 ' + big + ' 0 ' + q0[0].toFixed(2) + ' ' + q0[1].toFixed(2) + 'Z' : 'M' + cx + ' ' + cy + 'L' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + 'A' + r + ' ' + r + ' 0 ' + big + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + 'Z'; }
      out.push('<path d="' + d + '" fill="' + col + '" stroke="#fff" stroke-width="2" fill-rule="evenodd"><title>' + esc(L[k]) + ': ' + fmt(v) + ' (' + Math.round(v / tot * 100) + '%)</title></path>'); a0 = a1;
    });
    vals.forEach(function (v, k) { if (k >= 14) return; var y = top + 14 + k * 22; out.push('<rect x="400" y="' + (y - 11) + '" width="14" height="14" rx="3" fill="' + pal[k % pal.length] + '"/><text x="422" y="' + y + '" font-size="13" fill="#1e293b">' + esc(String(L[k]).slice(0, 22)) + ' · ' + Math.round(v / tot * 100) + '%</text>'); });
  } else {
    var all = [].concat.apply([], S.map(function (s) { return s.values; })), mx = niceMax(Math.max.apply(null, all.concat([0]))), mn = Math.min.apply(null, all.concat([0])), lo = mn < 0 ? -niceMax(-mn) : 0, pl = 56, pr = 16, pb = 56, pt2 = top + (S.length > 1 ? 24 : 4), pw = W - pl - pr, ph = H - pt2 - pb, n = L.length;
    var Y = function (v) { return pt2 + ph - (v - lo) / (mx - lo) * ph; };
    for (i = 0; i <= 5; i++) { var gv = lo + (mx - lo) * i / 5, gy = Y(gv); out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="#e2e8f0"/><text x="' + (pl - 8) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#475569">' + fmt(gv) + '</text>'); }
    var step = pw / n;
    L.forEach(function (lb, k) { if (n > 14 && k % Math.ceil(n / 14)) return; out.push('<text x="' + (pl + step * (k + 0.5)).toFixed(1) + '" y="' + (H - pb + 18) + '" text-anchor="middle" font-size="11" fill="#475569">' + esc(String(lb).slice(0, 12)) + '</text>'); });
    if (type === 'bar') {
      var gw = step * 0.78, bw = gw / S.length;
      S.forEach(function (s, j2) { s.values.forEach(function (v, k) { var x = pl + step * k + (step - gw) / 2 + bw * j2, y0 = Y(0), y1 = Y(v); out.push('<rect x="' + x.toFixed(1) + '" y="' + Math.min(y0, y1).toFixed(1) + '" width="' + Math.max(1, bw - 2).toFixed(1) + '" height="' + Math.max(0.5, Math.abs(y0 - y1)).toFixed(1) + '" rx="3" fill="' + pal[j2 % pal.length] + '"><title>' + esc(L[k]) + ' · ' + esc(s.name) + ': ' + fmt(v) + '</title></rect>'); }); });
    } else {
      S.forEach(function (s, j2) { var pts = s.values.map(function (v, k) { return [pl + step * (k + 0.5), Y(v)]; }); out.push('<polyline fill="none" stroke="' + pal[j2 % pal.length] + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>'); pts.forEach(function (p, k) { out.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4" fill="#fff" stroke="' + pal[j2 % pal.length] + '" stroke-width="2.5"><title>' + esc(L[k]) + ' · ' + esc(s.name) + ': ' + fmt(s.values[k]) + '</title></circle>'); }); });
    }
    out.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="#94a3b8"/>');
    if (S.length > 1) S.forEach(function (s, j2) { var x = pl + j2 * 130; out.push('<rect x="' + x + '" y="' + (top - 6) + '" width="12" height="12" rx="3" fill="' + pal[j2 % pal.length] + '"/><text x="' + (x + 18) + '" y="' + (top + 4) + '" font-size="12" fill="#1e293b">' + esc(String(s.name).slice(0, 14)) + '</text>'); });
  }
  out.push('</svg>'); return out.join('');
}
function fromCsv(text, o) { return build(parseTable(text), o); }
function mount() {
  var page = document.querySelector('#page-assets'); if (!page || page.querySelector('#cv140-card')) return false;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv140-card'; card.style.marginTop = '12px';
  card.innerHTML = '<div class="cardTop"><h3>Biểu đồ từ dữ liệu (P140)</h3><span class="sub">CSV → SVG, dùng offline</span></div><div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-start"><textarea class="input" id="cv140-csv" rows="4" style="min-width:240px" placeholder="thang,Doanh thu,Chi phí&#10;T1,120,80&#10;T2,150,90&#10;T3,180,95"></textarea><div style="display:flex;flex-direction:column;gap:6px"><input class="input" id="cv140-title" placeholder="Tiêu đề (tuỳ chọn)" style="max-width:220px"><select class="input" id="cv140-type" style="max-width:220px"><option value="bar">Cột</option><option value="line">Đường</option><option value="pie">Tròn</option><option value="donut">Donut</option></select><div class="row" style="gap:6px"><button type="button" class="btn btn-soft sm" id="cv140-run">Tạo biểu đồ</button><button type="button" class="btn btn-ghost sm" id="cv140-dl" disabled>Tải SVG</button><button type="button" class="btn btn-ghost sm" id="cv140-save" disabled>Lưu vào Tài nguyên</button></div></div></div><div class="tiny" id="cv140-out" role="status" aria-live="polite" style="margin-top:6px">Cột đầu là nhãn, các cột sau là số (tối đa 3 dãy, 60 dòng). Hỗ trợ 1.234,5 và 1,234.5.</div><div id="cv140-prev" style="margin-top:8px;max-width:640px"></div>';
  page.appendChild(card);
  var $ = function (s) { return card.querySelector(s); }, last = '';
  $('#cv140-run').addEventListener('click', function () { try { last = fromCsv($('#cv140-csv').value, { type: $('#cv140-type').value, title: $('#cv140-title').value }); } catch (e) { $('#cv140-out').textContent = String(e.message || e).slice(0, 140); return; } var u = URL.createObjectURL(new Blob([last], { type: 'image/svg+xml' })), im = new Image(); im.alt = 'Biểu đồ'; im.style.maxWidth = '100%'; im.onload = function () { URL.revokeObjectURL(u); }; im.src = u; var pv = $('#cv140-prev'); pv.innerHTML = ''; pv.appendChild(im); $('#cv140-dl').disabled = $('#cv140-save').disabled = false; $('#cv140-out').textContent = 'Đã tạo biểu đồ (' + (last.length / 1024).toFixed(1) + ' KB).'; });
  $('#cv140-dl').addEventListener('click', function () { if (!last) return; var u = URL.createObjectURL(new Blob([last], { type: 'image/svg+xml' })), a = document.createElement('a'); a.href = u; a.download = 'bieu-do-' + Date.now().toString(36) + '.svg'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); });
  $('#cv140-save').addEventListener('click', function () { if (!last || !window.CV || !CV.assets || !CV.assets.addBlob) return; CV.assets.addBlob(new File([last], 'bieu-do-' + Date.now().toString(36) + '.svg', { type: 'image/svg+xml' })).then(function () { $('#cv140-out').textContent = 'Đã lưu vào Tài nguyên.'; }).catch(function (e) { $('#cv140-out').textContent = 'Không lưu được: ' + String(e && e.message || e).slice(0, 100); }); });
  return true;
}
function ready() { try { mount(); var p = document.querySelector('#page-assets'); if (p && !p.__cv140Obs && window.MutationObserver) { p.__cv140Obs = new MutationObserver(function () { if (!p.querySelector('#cv140-card')) mount(); }); p.__cv140Obs.observe(p, { childList: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function tests() {
  var t = parseTable('ten,A,B\nx<1,10,5\ny,"1.234,5",abc\nz,30,7'), bar = build(t, { type: 'bar', title: '<b>T</b>' }), line = build(t, { type: 'line' }), pie = build({ labels: ['a', 'b', 'c'], series: [{ name: 's', values: [1, 1, 2] }] }, { type: 'pie' }), don = build({ labels: ['a'], series: [{ name: 's', values: [5] }] }, { type: 'donut' }), thrown = 0;
  [function () { build({ labels: [], series: [] }); }, function () { build({ labels: ['a'], series: [{ name: 's', values: [0] }] }, { type: 'pie' }); }, function () { fromCsv('chi mot dong'); }].forEach(function (f) { try { f(); } catch (e) { thrown++; } });
  return {
    parseNumbersVnAndUs: t.series[0].values.join() === '10,1234.5,30' && t.series[1].values[1] === 0 && num('1,234.5') === 1234.5 && num('1.234') === 1234 && isNaN(num('abc')),
    barCountMatchesRowsTimesSeries: (bar.match(/<rect [^>]*><title>/g) || []).length === 6,
    lineHasPolylinesAndPoints: (line.match(/<polyline/g) || []).length === 2 && (line.match(/<circle/g) || []).length === 6,
    pieHasOnePathPerPositiveValue: (pie.match(/<path/g) || []).length === 3,
    fullCircleDonutRendersRing: /<path/.test(don) && /fill-rule="evenodd"/.test(don),
    textEscaped: bar.indexOf('<b>T</b>') < 0 && bar.indexOf('x<1') < 0 && bar.indexOf('x&lt;1') > 0,
    accessible: /<title>&lt;b&gt;T&lt;\/b&gt;<\/title>/.test(bar) && /role="img"/.test(bar) && /<desc>/.test(bar),
    wellFormedStructure: [bar, line, pie, don].every(function (s) { return s.indexOf('<svg') === 0 && s.slice(-6) === '</svg>' && !/NaN|undefined|Infinity/.test(s); }),
    noExternalOrScript: [bar, line, pie].every(function (s) { return !/<script|href=|http:\/\/(?!www\.w3\.org)/i.test(s); }),
    badInputThrows: thrown === 3,
    badColorsIgnored: build(t, { type: 'bar', colors: ['red', 'javascript:1', '#112233'] }).indexOf('#112233') > 0 && build(t, { type: 'bar', colors: ['red'] }).indexOf('#2563eb') > 0
  };
}
window.CVChartsP140 = { version: '140.1.0', parseTable: parseTable, build: build, fromCsv: fromCsv, mount: mount, tests: tests };
})();
