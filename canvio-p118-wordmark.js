/* P118 · Logo Wordmark: đọc phông TrueType (.ttf, glyf) do người dùng chọn, tính kerning thật (bảng kern + GPOS PairPos 1/2) và xuất chữ thành đường viền SVG (outline).
   Không cần thư viện ngoài; phông không rời máy. Không hỗ trợ .otf CFF, .woff/.woff2, ligature/GSUB, chữ nhiều dòng, biến thể (variable) hay shaping phức tạp (chữ Ả Rập/Ấn). Dấu tiếng Việt chỉ đúng nếu phông có glyph dựng sẵn (cmap). */
(function () {
'use strict';
if (window.CVWordmarkP118) return;
function dv(buf) { return new DataView(buf instanceof ArrayBuffer ? buf : buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)); }
function tag(d, o) { return String.fromCharCode(d.getUint8(o), d.getUint8(o + 1), d.getUint8(o + 2), d.getUint8(o + 3)); }
function parse(buf) {
  var d = dv(buf), T = {}, n, i, f = { d: d };
  if (d.byteLength < 12) throw new Error('Tệp phông quá nhỏ.');
  var sig = d.getUint32(0); if (sig === 0x774F4646) throw new Error('.woff cần giải nén bất đồng bộ (parseAsync).'); if (sig === 0x774F4632) throw new Error('.woff2 chưa hỗ trợ; dùng .ttf hoặc .woff.'); var isCff = sig === 0x4F54544F; if (sig !== 0x00010000 && sig !== 0x74727565 && !isCff) throw new Error('Không phải TrueType/OpenType (.ttf/.otf).');
  n = d.getUint16(4); if (n > 64) throw new Error('Số bảng không hợp lệ.');
  for (i = 0; i < n; i++) { var o = 12 + i * 16; T[tag(d, o)] = { off: d.getUint32(o + 8), len: d.getUint32(o + 12) }; if (T[tag(d, o)].off + T[tag(d, o)].len > d.byteLength) throw new Error('Bảng phông hỏng.'); }
  (isCff ? ['head', 'maxp', 'hhea', 'hmtx', 'cmap', 'CFF '] : ['head', 'maxp', 'hhea', 'hmtx', 'cmap', 'loca', 'glyf']).forEach(function (k) { if (!T[k]) throw new Error('Thiếu bảng ' + k + ' (có thể là phông CFF/variable).'); });
  f.T = T; if (isCff) f.cff = readCff(d, T['CFF '].off, T['CFF '].len); f.upm = d.getUint16(T.head.off + 18) || 1000; f.locaLong = d.getInt16(T.head.off + 50) === 1; f.numGlyphs = d.getUint16(T.maxp.off + 4); f.nHM = d.getUint16(T.hhea.off + 34); f.asc = d.getInt16(T.hhea.off + 4); f.desc = d.getInt16(T.hhea.off + 6);
  f.cmap = readCmap(d, T.cmap); if (!f.cmap) throw new Error('Không đọc được bảng cmap (cần format 4 hoặc 12).');
  f.kern = readKern(d, T.kern); f.gpos = T.GPOS ? readGpos(d, T.GPOS.off) : null; return f;
}
function woff1ToSfnt(buf) {
  var d = dv(buf), n = d.getUint16(12), i, tabs = [], total = 12 + n * 16;
  if (d.byteLength < 44 + n * 20 || n > 64) throw new Error('Tệp WOFF hỏng.');
  for (i = 0; i < n; i++) { var o = 44 + i * 20, t = { tag: d.getUint32(o), off: d.getUint32(o + 4), cl: d.getUint32(o + 8), ol: d.getUint32(o + 12), ck: d.getUint32(o + 16) }; if (t.off + t.cl > d.byteLength || t.ol > 20 * 1048576) throw new Error('Bảng WOFF hỏng.'); tabs.push(t); }
  tabs.sort(function (a, b) { return a.tag - b.tag; });
  var u8 = new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
  return Promise.all(tabs.map(function (t) {
    var raw = u8.slice(t.off, t.off + t.cl);
    if (t.cl === t.ol) return Promise.resolve(raw);
    if (typeof DecompressionStream !== 'function') return Promise.reject(new Error('Trình duyệt chưa hỗ trợ giải nén WOFF.'));
    var ds = new DecompressionStream('deflate'), w = ds.writable.getWriter(); w.write(raw); w.close();
    return new Response(ds.readable).arrayBuffer().then(function (ab) { if (ab.byteLength !== t.ol) throw new Error('Bảng WOFF giải nén sai kích thước.'); return new Uint8Array(ab); });
  })).then(function (parts) {
    parts.forEach(function (p) { total += (p.length + 3) & ~3; });
    var out = new Uint8Array(total), od = new DataView(out.buffer), pos = 12 + n * 16;
    od.setUint32(0, d.getUint32(4)); od.setUint16(4, n);
    var sr = 1, es = 0; while (sr * 2 <= n) { sr *= 2; es++; } od.setUint16(6, sr * 16); od.setUint16(8, es); od.setUint16(10, n * 16 - sr * 16);
    parts.forEach(function (p, k) { var o = 12 + k * 16; od.setUint32(o, tabs[k].tag); od.setUint32(o + 4, tabs[k].ck); od.setUint32(o + 8, pos); od.setUint32(o + 12, p.length); out.set(p, pos); pos += (p.length + 3) & ~3; });
    return out.buffer;
  });
}
function parseAsync(buf) {
  try { var d = dv(buf); if (d.byteLength >= 44 && d.getUint32(0) === 0x774F4646) return woff1ToSfnt(buf).then(parse); return Promise.resolve(parse(buf)); } catch (e) { return Promise.reject(e); }
}
function readCmap(d, t) {
  var n = d.getUint16(t.off + 2), best = null, i;
  for (i = 0; i < n; i++) { var p = d.getUint16(t.off + 4 + i * 8), e = d.getUint16(t.off + 6 + i * 8), o = t.off + d.getUint32(t.off + 8 + i * 8), fm = d.getUint16(o); if ((p === 3 && (e === 1 || e === 10)) || p === 0) { if (!best || fm === 12 || (fm === 4 && best.fm !== 12)) best = { o: o, fm: fm }; } }
  if (!best) return null; var o2 = best.o;
  if (best.fm === 4) { var sc = d.getUint16(o2 + 6) / 2, endO = o2 + 14, startO = endO + sc * 2 + 2, deltaO = startO + sc * 2, rangeO = deltaO + sc * 2; return function (cp) { if (cp > 0xFFFF) return 0; for (var s = 0; s < sc; s++) { if (cp <= d.getUint16(endO + s * 2)) { var st = d.getUint16(startO + s * 2); if (cp < st) return 0; var ro = d.getUint16(rangeO + s * 2), dl = d.getInt16(deltaO + s * 2); if (!ro) return (cp + dl) & 0xFFFF; var a = rangeO + s * 2 + ro + (cp - st) * 2; if (a + 2 > d.byteLength) return 0; var g = d.getUint16(a); return g ? (g + dl) & 0xFFFF : 0; } } return 0; }; }
  if (best.fm === 12) { var ng = d.getUint32(o2 + 12); return function (cp) { for (var g = 0; g < ng; g++) { var b = o2 + 16 + g * 12, s = d.getUint32(b), e = d.getUint32(b + 4); if (cp >= s && cp <= e) return d.getUint32(b + 8) + cp - s; } return 0; }; }
  return null;
}
function readKern(d, t) {
  if (!t) return null; var map = {}, n = d.getUint16(t.off + 2), o = t.off + 4, i, any = false;
  for (i = 0; i < n; i++) { var len = d.getUint16(o + 2), cov = d.getUint16(o + 4); if ((cov >> 8) === 0 && (cov & 1)) { var np = d.getUint16(o + 6), p; for (p = 0; p < np; p++) { var q = o + 14 + p * 6; map[d.getUint16(q) * 65536 + d.getUint16(q + 2)] = d.getInt16(q + 4); any = true; } } o += len || 6; }
  return any ? map : null;
}
function covIndex(d, o, g) { var fm = d.getUint16(o), n = d.getUint16(o + 2), i; if (fm === 1) { for (i = 0; i < n; i++) { if (d.getUint16(o + 4 + i * 2) === g) return i; } return -1; } for (i = 0; i < n; i++) { var b = o + 4 + i * 6, s = d.getUint16(b), e = d.getUint16(b + 2); if (g >= s && g <= e) return d.getUint16(b + 4) + g - s; } return -1; }
function classOf(d, o, g) { var fm = d.getUint16(o), i; if (fm === 1) { var s = d.getUint16(o + 2), n = d.getUint16(o + 4); return g >= s && g < s + n ? d.getUint16(o + 6 + (g - s) * 2) : 0; } var nr = d.getUint16(o + 2); for (i = 0; i < nr; i++) { var b = o + 4 + i * 6; if (g >= d.getUint16(b) && g <= d.getUint16(b + 2)) return d.getUint16(b + 4); } return 0; }
function valSize(fmt) { var c = 0; for (var i = 0; i < 8; i++) if (fmt & (1 << i)) c++; return c * 2; }
function readGpos(d, g) {
  var ll = g + d.getUint16(g + 8), n = d.getUint16(ll), subs = [], i, j;
  for (i = 0; i < n; i++) { var lo = ll + d.getUint16(ll + 2 + i * 2); if (d.getUint16(lo) !== 2) continue; var ns = d.getUint16(lo + 4); for (j = 0; j < ns; j++) subs.push(lo + d.getUint16(lo + 6 + j * 2)); }
  return subs.length ? subs : null;
}
function gposPair(f, a, b) {
  if (!f.gpos) return 0; var d = f.d, k, s, fm, cov, v1, v2, s1, s2;
  for (k = 0; k < f.gpos.length; k++) { s = f.gpos[k]; fm = d.getUint16(s); cov = s + d.getUint16(s + 2); v1 = d.getUint16(s + 4); v2 = d.getUint16(s + 6); s1 = valSize(v1); s2 = valSize(v2); var ci = covIndex(d, cov, a); if (ci < 0) continue;
    var xAdv = function (o) { return (v1 & 4) ? d.getInt16(o + ((v1 & 1 ? 2 : 0) + (v1 & 2 ? 2 : 0))) : 0; };
    if (fm === 1) { var ps = s + d.getUint16(s + 10 + ci * 2), pn = d.getUint16(ps), r; for (r = 0; r < pn; r++) { var rec = ps + 2 + r * (2 + s1 + s2); if (d.getUint16(rec) === b) return xAdv(rec + 2); } }
    else if (fm === 2) { var c1 = classOf(d, s + d.getUint16(s + 8), a), c2 = classOf(d, s + d.getUint16(s + 10), b), n2 = d.getUint16(s + 14), rec2 = s + 16 + (c1 * n2 + c2) * (s1 + s2); if (rec2 + s1 > d.byteLength) continue; var val = xAdv(rec2); if (val || (c1 !== 0 || c2 !== 0)) return val; }
  } return 0;
}
function kernPair(f, a, b) { if (f.kern && f.kern[a * 65536 + b] !== undefined) return f.kern[a * 65536 + b]; return gposPair(f, a, b); }
function cffIndex(d, o) {
  var n = d.getUint16(o); if (!n) return { items: [], end: o + 2 };
  var os = d.getUint8(o + 2), offs = [], i, j, v, base;
  if (os < 1 || os > 4) throw new Error('CFF hỏng (offSize).');
  for (i = 0; i <= n; i++) { v = 0; for (j = 0; j < os; j++) v = v * 256 + d.getUint8(o + 3 + i * os + j); offs.push(v); }
  base = o + 3 + (n + 1) * os - 1; var items = [];
  for (i = 0; i < n; i++) { if (offs[i + 1] < offs[i] || base + offs[i + 1] > d.byteLength) throw new Error('CFF hỏng (INDEX).'); items.push({ s: base + offs[i], e: base + offs[i + 1] }); }
  return { items: items, end: base + offs[n] };
}
function cffDict(d, s, e) {
  var ops = {}, st = [], p = s, b0, v;
  while (p < e) {
    b0 = d.getUint8(p++);
    if (b0 <= 21) { var op = b0; if (b0 === 12) op = 1200 + d.getUint8(p++); ops[op] = st; st = []; }
    else if (b0 === 28) { st.push(d.getInt16(p)); p += 2; }
    else if (b0 === 29) { st.push(d.getInt32(p)); p += 4; }
    else if (b0 === 30) { var str = '', nb, done = false; while (!done && p < e) { nb = d.getUint8(p++); [nb >> 4, nb & 15].forEach(function (q) { if (done) return; if (q === 15) done = true; else if (q === 10) str += '.'; else if (q === 11) str += 'E'; else if (q === 12) str += 'E-'; else if (q === 14) str += '-'; else if (q < 10) str += q; }); } st.push(parseFloat(str) || 0); }
    else if (b0 >= 32 && b0 <= 246) st.push(b0 - 139);
    else if (b0 >= 247 && b0 <= 250) { v = d.getUint8(p++); st.push((b0 - 247) * 256 + v + 108); }
    else if (b0 >= 251 && b0 <= 254) { v = d.getUint8(p++); st.push(-(b0 - 251) * 256 - v - 108); }
  }
  return ops;
}
function readCff(d, off, len) {
  if (d.getUint8(off) !== 1) throw new Error('Chỉ hỗ trợ CFF 1 (không phải CFF2).');
  var hs = d.getUint8(off + 2), names = cffIndex(d, off + hs), tops = cffIndex(d, names.end), strs = cffIndex(d, tops.end), gs = cffIndex(d, strs.end);
  if (!tops.items.length) throw new Error('CFF thiếu Top DICT.');
  var top = cffDict(d, tops.items[0].s, tops.items[0].e);
  if (top[1230]) throw new Error('Phông CFF dạng CID chưa hỗ trợ.');
  if (top[1206] && top[1206][0] !== 2) throw new Error('Chỉ hỗ trợ charstring Type 2.');
  if (!top[17]) throw new Error('CFF thiếu CharStrings.');
  var cs = cffIndex(d, off + top[17][0]), c = { d: d, cs: cs.items, gsubrs: gs.items, lsubrs: [], defW: 0, nomW: 0 };
  if (top[18] && top[18].length === 2) { var po = off + top[18][1], pd = cffDict(d, po, po + top[18][0]); c.defW = (pd[20] || [0])[0]; c.nomW = (pd[21] || [0])[0]; if (pd[19]) c.lsubrs = cffIndex(d, po + pd[19][0]).items; }
  return c;
}
function bias(n) { return n < 1240 ? 107 : n < 33900 ? 1131 : 32768; }
function glyphCff(f, gi) {
  var c = f.cff; if (gi < 0 || gi >= c.cs.length) return [];
  var d = c.d, st = [], x = 0, y = 0, nStems = 0, wDone = false, out = [], cur = null, steps = 0, done = false;
  function wd(has) { if (!wd.d) { wd.d = true; if (has) st.shift(); } }
  wd.d = false;
  function close() { if (cur && cur.length > 1) out.push(cur); cur = null; }
  function mv(dx, dy) { close(); x += dx; y += dy; cur = [{ x: x, y: y, on: true }]; }
  function ln(dx, dy) { if (!cur) cur = [{ x: x, y: y, on: true }]; x += dx; y += dy; cur.push({ x: x, y: y, on: true }); }
  function cv(a, b, c2, d2, e, g) { if (!cur) cur = [{ x: x, y: y, on: true }]; var x1 = x + a, y1 = y + b, x2 = x1 + c2, y2 = y1 + d2; x = x2 + e; y = y2 + g; cur.push({ x: x1, y: y1, on: false, cu: true }, { x: x2, y: y2, on: false, cu: true }, { x: x, y: y, on: true }); }
  function run(s, e, depth) {
    if (depth > 10) throw new Error('CFF: subr lồng quá sâu.');
    var p = s, i, b0, a, n;
    while (p < e && !done) {
      if (++steps > 20000) throw new Error('CFF: charstring quá dài.');
      b0 = d.getUint8(p++);
      if (b0 === 28) { st.push(d.getInt16(p)); p += 2; continue; }
      if (b0 >= 32 && b0 <= 246) { st.push(b0 - 139); continue; }
      if (b0 >= 247 && b0 <= 250) { st.push((b0 - 247) * 256 + d.getUint8(p++) + 108); continue; }
      if (b0 >= 251 && b0 <= 254) { st.push(-(b0 - 251) * 256 - d.getUint8(p++) - 108); continue; }
      if (b0 === 255) { st.push(d.getInt32(p) / 65536); p += 4; continue; }
      if (st.length > 96) throw new Error('CFF: ngăn xếp tràn.');
      a = st;
      switch (b0) {
        case 1: case 3: case 18: case 23: wd(a.length % 2 === 1); nStems += a.length >> 1; st = []; break;
        case 19: case 20: wd(a.length % 2 === 1); nStems += a.length >> 1; st = []; p += (nStems + 7) >> 3; break;
        case 21: wd(a.length > 2); mv(a[0] || 0, a[1] || 0); st = []; break;
        case 22: wd(a.length > 1); mv(a[0] || 0, 0); st = []; break;
        case 4: wd(a.length > 1); mv(0, a[0] || 0); st = []; break;
        case 5: for (i = 0; i + 1 < a.length; i += 2) ln(a[i], a[i + 1]); st = []; break;
        case 6: case 7: { var hz = b0 === 6; for (i = 0; i < a.length; i++) { if (hz) ln(a[i], 0); else ln(0, a[i]); hz = !hz; } st = []; break; }
        case 8: for (i = 0; i + 5 < a.length; i += 6) cv(a[i], a[i + 1], a[i + 2], a[i + 3], a[i + 4], a[i + 5]); st = []; break;
        case 24: for (i = 0; i + 7 < a.length; i += 6) cv(a[i], a[i + 1], a[i + 2], a[i + 3], a[i + 4], a[i + 5]); ln(a[i], a[i + 1]); st = []; break;
        case 25: for (i = 0; i + 7 < a.length; i += 2) ln(a[i], a[i + 1]); cv(a[i], a[i + 1], a[i + 2], a[i + 3], a[i + 4], a[i + 5]); st = []; break;
        case 26: { i = 0; var dx1 = 0; if (a.length % 4) { dx1 = a[0]; i = 1; } for (; i + 3 < a.length; i += 4) { cv(dx1, a[i], a[i + 1], a[i + 2], 0, a[i + 3]); dx1 = 0; } st = []; break; }
        case 27: { i = 0; var dy1 = 0; if (a.length % 4) { dy1 = a[0]; i = 1; } for (; i + 3 < a.length; i += 4) { cv(a[i], dy1, a[i + 1], a[i + 2], a[i + 3], 0); dy1 = 0; } st = []; break; }
        case 30: case 31: { var h = b0 === 31; i = 0; while (i + 3 < a.length) { var last = a.length - i === 5, ex = last ? a[i + 4] : 0; if (h) cv(a[i], 0, a[i + 1], a[i + 2], ex, a[i + 3]); else cv(0, a[i], a[i + 1], a[i + 2], a[i + 3], ex); h = !h; i += last ? 5 : 4; } st = []; break; }
        case 10: case 29: { var arr = b0 === 10 ? c.lsubrs : c.gsubrs; n = st.pop() + bias(arr.length); if (!arr[n]) throw new Error('CFF: subr không tồn tại.'); run(arr[n].s, arr[n].e, depth + 1); break; }
        case 11: return;
        case 14: wd(a.length === 1 || a.length === 5); close(); done = true; return;
        case 12: {
          var b1 = d.getUint8(p++);
          if (b1 === 35 && a.length >= 12) { cv(a[0], a[1], a[2], a[3], a[4], a[5]); cv(a[6], a[7], a[8], a[9], a[10], a[11]); }
          else if (b1 === 34 && a.length >= 7) { cv(a[0], 0, a[1], a[2], a[3], 0); cv(a[4], 0, a[5], -a[2], a[6], 0); }
          else if (b1 === 36 && a.length >= 9) { cv(a[0], a[1], a[2], a[3], a[4], 0); cv(a[5], 0, a[6], a[7], a[8], -(a[1] + a[3] + a[7])); }
          else if (b1 === 37 && a.length >= 11) { var sx = a[0] + a[2] + a[4] + a[6] + a[8], sy = a[1] + a[3] + a[5] + a[7] + a[9]; cv(a[0], a[1], a[2], a[3], a[4], a[5]); if (Math.abs(sx) > Math.abs(sy)) cv(a[6], a[7], a[8], a[9], a[10], -sy); else cv(a[6], a[7], a[8], a[9], -sx, a[10]); }
          st = []; break;
        }
        default: st = [];
      }
    }
  }
  var g = c.cs[gi]; run(g.s, g.e, 0); close(); return out;
}
function glyph(f, gi, depth) {
  if (f.cff) return glyphCff(f, gi);
  depth = depth || 0; if (depth > 4 || gi < 0 || gi >= f.numGlyphs) return []; var d = f.d, T = f.T, o0, o1;
  if (f.locaLong) { o0 = d.getUint32(T.loca.off + gi * 4); o1 = d.getUint32(T.loca.off + gi * 4 + 4); } else { o0 = d.getUint16(T.loca.off + gi * 2) * 2; o1 = d.getUint16(T.loca.off + gi * 2 + 2) * 2; }
  if (o1 <= o0) return []; var p = T.glyf.off + o0, nc = d.getInt16(p), i; p += 10;
  if (nc < 0) { var out = [], more = true; while (more) { var fl = d.getUint16(p), idx = d.getUint16(p + 2), dx, dy; p += 4; if (fl & 1) { dx = d.getInt16(p); dy = d.getInt16(p + 2); p += 4; } else { dx = d.getInt8(p); dy = d.getInt8(p + 1); p += 2; } var sx = 1, sy = 1, m01 = 0, m10 = 0; if (fl & 8) { sx = sy = d.getInt16(p) / 16384; p += 2; } else if (fl & 0x40) { sx = d.getInt16(p) / 16384; sy = d.getInt16(p + 2) / 16384; p += 4; } else if (fl & 0x80) { sx = d.getInt16(p) / 16384; m01 = d.getInt16(p + 2) / 16384; m10 = d.getInt16(p + 4) / 16384; sy = d.getInt16(p + 6) / 16384; p += 8; } if (fl & 2) glyph(f, idx, depth + 1).forEach(function (c) { out.push(c.map(function (q) { return { x: sx * q.x + m10 * q.y + dx, y: m01 * q.x + sy * q.y + dy, on: q.on }; })); }); more = !!(fl & 0x20); } return out; }
  var ends = [], np; for (i = 0; i < nc; i++) { ends.push(d.getUint16(p)); p += 2; } np = nc ? ends[nc - 1] + 1 : 0; var il = d.getUint16(p); p += 2 + il; var flags = [], fl2, rep;
  while (flags.length < np) { fl2 = d.getUint8(p++); flags.push(fl2); if (fl2 & 8) { rep = d.getUint8(p++); while (rep-- > 0 && flags.length < np) flags.push(fl2); } }
  var xs = [], ys = [], v = 0; for (i = 0; i < np; i++) { fl2 = flags[i]; if (fl2 & 2) { var dd = d.getUint8(p++); v += (fl2 & 16) ? dd : -dd; } else if (!(fl2 & 16)) { v += d.getInt16(p); p += 2; } xs.push(v); } v = 0;
  for (i = 0; i < np; i++) { fl2 = flags[i]; if (fl2 & 4) { var dd2 = d.getUint8(p++); v += (fl2 & 32) ? dd2 : -dd2; } else if (!(fl2 & 32)) { v += d.getInt16(p); p += 2; } ys.push(v); }
  var cs = [], s = 0; for (i = 0; i < nc; i++) { var c = []; for (var k = s; k <= ends[i]; k++) c.push({ x: xs[k], y: ys[k], on: !!(flags[k] & 1) }); cs.push(c); s = ends[i] + 1; } return cs;
}
function advance(f, gi) { var i = Math.min(gi, f.nHM - 1); return f.d.getUint16(f.T.hmtx.off + i * 4); }
function contourPath(c, tx, ty, sc, r) {
  if (c.some(function (q) { return q.cu; })) { var P0 = function (q) { return r((tx + q.x * sc)) + ' ' + r((ty - q.y * sc)); }, dd = 'M' + P0(c[0]), k = 1; while (k < c.length) { if (c[k].cu && c[k + 1] && c[k + 2]) { dd += 'C' + P0(c[k]) + ' ' + P0(c[k + 1]) + ' ' + P0(c[k + 2]); k += 3; } else { dd += 'L' + P0(c[k]); k++; } } return dd + 'Z'; }
  var n = c.length; if (n < 2) return ''; var pts = [], i; for (i = 0; i < n; i++) { var a = c[i], b = c[(i + 1) % n]; pts.push(a); if (!a.on && !b.on) pts.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true }); }
  var st = pts.findIndex(function (q) { return q.on; }), P = function (q) { return r((tx + q.x * sc)) + ' ' + r((ty - q.y * sc)); }, d, m = pts.length;
  if (st < 0) return ''; var q0 = pts[st]; d = 'M' + P(q0); for (i = 1; i <= m; i++) { var q = pts[(st + i) % m]; if (q.on) { if (i === m) break; d += 'L' + P(q); } else { var nx = pts[(st + i + 1) % m]; d += 'Q' + P(q) + ' ' + P(nx); i++; } } return d + 'Z';
}
function layout(f, text, o) {
  o = o || {}; var size = Math.max(4, Math.min(2000, Number(o.size) || 120)), track = Number(o.tracking) || 0, kern = o.kerning !== false, sc = size / f.upm, x = 0, prev = -1, i, items = [], miss = 0, cps = Array.from(String(text || '').slice(0, 200));
  cps.forEach(function (ch) { var cp = ch.codePointAt(0), g = f.cmap(cp); if (!g && cp !== 32) miss++; if (kern && prev >= 0 && g) x += kernPair(f, prev, g) * sc; var adv = advance(f, g); items.push({ ch: ch, g: g, x: x }); x += adv * sc + track * size / 1000; prev = g; });
  return { items: items, width: x, size: size, sc: sc, missing: miss };
}
function toSvg(f, text, o) {
  o = o || {}; var L = layout(f, text, o), pad = Math.round(L.size * 0.15), asc = f.asc * L.sc, desc = -f.desc * L.sc, H = asc + desc, W = L.width, r = function (n) { return Math.round(n * 100) / 100; }, fill = /^#[0-9a-f]{3,8}$/i.test(o.color || '') ? o.color : '#0b1220', d = '';
  L.items.forEach(function (it) { if (!it.g) return; glyph(f, it.g).forEach(function (c) { d += contourPath(c, pad + it.x, pad + asc, L.sc, r); }); });
  var vw = r(W + pad * 2), vh = r(H + pad * 2);
  return { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + vw + ' ' + vh + '" width="' + vw + '" height="' + vh + '" role="img"><title>' + String(text || '').replace(/[<>&"]/g, '') + '</title><path fill="' + fill + '" fill-rule="nonzero" d="' + d + '"/></svg>', width: vw, height: vh, missing: L.missing, kerned: !!(f.kern || f.gpos) && o.kerning !== false, d: d };
}
function mount() {
  var page = document.getElementById('page-brand'); if (!page || page.querySelector('#cv118-card')) return false;
  var grid = page.querySelector('.grid.g2'), card = document.createElement('div'); card.className = 'card'; card.id = 'cv118-card'; card.style.marginBottom = '14px';
  card.innerHTML = '<div class="cardTop"><h3>Wordmark outline (P118)</h3><span class="sub">chữ → đường viền SVG, có kerning</span></div><div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><input type="file" id="cv118-font" accept=".ttf,.otf,.woff,font/ttf,font/otf,font/woff" aria-label="Chọn phông .ttf"/><input class="input" id="cv118-text" value="AVATAR" maxlength="60" style="max-width:180px" aria-label="Chữ"/><label class="tiny">Tracking <input type="range" id="cv118-trk" min="-100" max="400" value="0" aria-label="Giãn chữ"></label><label class="tiny"><input type="checkbox" id="cv118-kern" checked> Kerning</label><button type="button" class="btn btn-soft sm" id="cv118-dl" disabled>Tải SVG</button><button type="button" class="btn btn-ghost sm" id="cv118-asset" disabled>Lưu vào thư viện</button></div><div id="cv118-prev" style="margin-top:8px;background:#fff;border-radius:8px;padding:8px;min-height:60px;overflow:auto"></div><div class="tiny" id="cv118-out" role="status" aria-live="polite">Chọn phông .ttf trên máy bạn (không tải lên đâu cả). .otf/.woff chưa hỗ trợ.</div>';
  (grid ? grid.parentNode.insertBefore(card, grid.nextSibling) : page.appendChild(card));
  var $ = function (s) { return card.querySelector(s); }, font = null, last = null;
  function render() { if (!font) return; try { last = toSvg(font, $('#cv118-text').value, { size: 120, tracking: Number($('#cv118-trk').value), kerning: $('#cv118-kern').checked }); $('#cv118-prev').innerHTML = last.svg; $('#cv118-dl').disabled = $('#cv118-asset').disabled = false; $('#cv118-out').textContent = last.width + '×' + last.height + ' · ' + (last.kerned ? 'có bảng kerning' : 'phông không có bảng kerning') + (last.missing ? ' · ' + last.missing + ' ký tự thiếu trong phông' : ''); } catch (e) { $('#cv118-out').textContent = String(e.message || e).slice(0, 140); } }
  $('#cv118-font').addEventListener('change', function () { var fl = this.files && this.files[0]; if (!fl) return; if (fl.size > 20 * 1048576) { $('#cv118-out').textContent = 'Phông quá lớn (>20MB).'; return; } fl.arrayBuffer().then(parseAsync).then(function (f) { font = f; render(); }).catch(function (e) { font = null; $('#cv118-out').textContent = String(e && e.message || e).slice(0, 140); }); });
  ['#cv118-text', '#cv118-trk', '#cv118-kern'].forEach(function (s) { $(s).addEventListener('input', render); $(s).addEventListener('change', render); });
  $('#cv118-dl').addEventListener('click', function () { if (!last) return; var u = URL.createObjectURL(new Blob([last.svg], { type: 'image/svg+xml' })), a = document.createElement('a'); a.href = u; a.download = 'wordmark.svg'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); });
  $('#cv118-asset').addEventListener('click', function () { if (!last || !window.CV || !CV.assets || !CV.assets.addBlob) { $('#cv118-out').textContent = 'Thư viện chưa sẵn sàng.'; return; } Promise.resolve(CV.assets.addBlob(new Blob([last.svg], { type: 'image/svg+xml' }), 'wordmark.svg')).then(function () { $('#cv118-out').textContent = 'Đã lưu wordmark.svg vào Thư viện.'; }).catch(function () { $('#cv118-out').textContent = 'Không lưu được vào Thư viện.'; }); });
  return true;
}
function ready() { try { mount(); } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
window.CVWordmarkP118 = { version: '118.3.0', parse: parse, parseAsync: parseAsync, layout: layout, glyph: glyph, kernPair: kernPair, toSvg: toSvg, mount: mount };
})();
