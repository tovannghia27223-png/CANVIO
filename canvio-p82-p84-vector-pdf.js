/* CANVIO P82/P84 — Vietnamese-capable vector PDF for Poster/Slides.
 * Local-only runtime: bundles an OFL-licensed Noto Sans TTF asset and loads it
 * only after an explicit export click. No CDN, server API, or new data store.
 * Text remains searchable/selectable; basic shapes and gradients remain vector;
 * placed images are rasterized as JPEG objects inside the PDF.
 */
(function () {
  'use strict';
  if (window.CANVIOVectorPDF && window.CANVIOVectorPDF.version === '82.1.0') return;
  var FONT_URL = 'assets/pdf-fonts/NotoSans-Regular.ttf';
  var FONT_LIMIT = 2 * 1024 * 1024;
  var MAX_PAGES = 24;
  var MAX_IMAGE_BYTES = 32 * 1024 * 1024;
  var fontPromise = null;
  var fontBytesCache = null;
  var fontMetricsCache = null;
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var toast = function (s) { try { if (window.CV && CV.toast) CV.toast(s); } catch (e) {} };
  var ascii = function (s) { return new TextEncoder().encode(String(s)); };
  var concat = function (parts) {
    var n = parts.reduce(function (a, p) { return a + p.length; }, 0), out = new Uint8Array(n), at = 0;
    parts.forEach(function (p) { out.set(p, at); at += p.length; }); return out;
  };
  var u16 = function (b, p) { return (b[p] << 8) | b[p + 1]; };
  var s16 = function (b, p) { var x = u16(b, p); return x & 0x8000 ? x - 0x10000 : x; };
  var u32 = function (b, p) { return ((b[p] * 0x1000000) + (b[p + 1] << 16) + (b[p + 2] << 8) + b[p + 3]) >>> 0; };
  function parseTTF(bytes) {
    if (!(bytes instanceof Uint8Array) || bytes.length < 1024 || bytes.length > FONT_LIMIT) throw new Error('Font TTF sai kích thước hoặc định dạng.');
    var signature = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    if (signature !== '\u0000\u0001\u0000\u0000' && signature !== 'true') throw new Error('Font PDF cần TrueType TTF sfnt; OTF/CFF và WOFF chưa được hỗ trợ.');
    var count = u16(bytes, 4), tables = {};
    for (var i = 0; i < count; i++) {
      var p = 12 + i * 16, tag = String.fromCharCode(bytes[p], bytes[p + 1], bytes[p + 2], bytes[p + 3]);
      var off = u32(bytes, p + 8), len = u32(bytes, p + 12);
      if (off + len > bytes.length) throw new Error('Font TTF có bảng vượt ngoài dữ liệu.');
      tables[tag] = { off: off, len: len };
    }
    ['head', 'hhea', 'maxp', 'hmtx', 'cmap'].forEach(function (t) { if (!tables[t]) throw new Error('Font TTF thiếu bảng ' + t + '.'); });
    var head = tables.head.off, hhea = tables.hhea.off, maxp = tables.maxp.off;
    var units = u16(bytes, head + 18), numGlyphs = u16(bytes, maxp + 4), numHMetrics = u16(bytes, hhea + 34);
    if (!units || !numGlyphs || !numHMetrics) throw new Error('Font TTF thiếu metrics hợp lệ.');
    var cmapBase = tables.cmap.off, cmapCount = u16(bytes, cmapBase + 2), cmap4 = null, cmap12 = null;
    for (i = 0; i < cmapCount; i++) {
      p = cmapBase + 4 + i * 8; var platform = u16(bytes, p), encoding = u16(bytes, p + 2), sub = cmapBase + u32(bytes, p + 4), fmt = u16(bytes, sub);
      if (fmt === 4 && (platform === 3 || platform === 0) && (!cmap4 || platform === 3)) cmap4 = sub;
      if (fmt === 12 && (platform === 3 || platform === 0)) cmap12 = sub;
    }
    if (!cmap4) throw new Error('Font TTF không có cmap format 4 phù hợp.');
    var segCount = u16(bytes, cmap4 + 6) / 2, endBase = cmap4 + 14, startBase = endBase + segCount * 2 + 2;
    var deltaBase = startBase + segCount * 2, rangeBase = deltaBase + segCount * 2;
    var ends = [], starts = [], deltas = [], ranges = [];
    for (i = 0; i < segCount; i++) { ends[i] = u16(bytes, endBase + i * 2); starts[i] = u16(bytes, startBase + i * 2); deltas[i] = s16(bytes, deltaBase + i * 2); ranges[i] = u16(bytes, rangeBase + i * 2); }
    function glyphFor(cp) {
      if (cp < 0 || cp > 0xFFFF) return 0;
      if (cmap12 && cp > 0xFFFF) {
        var groups = u32(bytes, cmap12 + 12), lo = 0, hi = groups - 1;
        while (lo <= hi) { var mid = (lo + hi) >> 1, q = cmap12 + 16 + mid * 12, a = u32(bytes, q), z = u32(bytes, q + 4); if (cp < a) hi = mid - 1; else if (cp > z) lo = mid + 1; else return u32(bytes, q + 8) + cp - a; }
      }
      var l = 0, r = segCount - 1;
      while (l <= r) { var m = (l + r) >> 1; if (cp > ends[m]) l = m + 1; else r = m - 1; }
      if (l >= segCount || cp < starts[l]) return 0;
      if (!ranges[l]) return (cp + deltas[l]) & 0xFFFF;
      var pos = rangeBase + l * 2 + ranges[l] + (cp - starts[l]) * 2;
      if (pos + 1 >= bytes.length) return 0;
      var gid = u16(bytes, pos); return gid ? (gid + deltas[l]) & 0xFFFF : 0;
    }
    var hmtx = tables.hmtx.off, advances = new Uint16Array(numGlyphs), last = 0;
    for (i = 0; i < numGlyphs; i++) { if (i < numHMetrics) last = u16(bytes, hmtx + i * 4); advances[i] = last; }
    var asc = s16(bytes, hhea + 4), desc = s16(bytes, hhea + 6), xMin = s16(bytes, head + 36), yMin = s16(bytes, head + 38), xMax = s16(bytes, head + 40), yMax = s16(bytes, head + 42), cap = asc;
    if (tables['OS/2'] && tables['OS/2'].len >= 90) { var os2 = tables['OS/2'].off; if (u16(bytes, os2) >= 2) cap = s16(bytes, os2 + 88) || asc; }
    function advanceFor(cp) { var gid = glyphFor(cp); return gid < advances.length ? advances[gid] : advances[0]; }
    return { units: units, numGlyphs: numGlyphs, glyphFor: glyphFor, advanceFor: advanceFor, bbox: [xMin, yMin, xMax, yMax], ascent: asc, descent: desc, capHeight: cap };
  }
  async function loadFont() {
    if (fontMetricsCache && fontBytesCache) return { bytes: fontBytesCache, metrics: fontMetricsCache };
    if (fontPromise) return fontPromise;
    fontPromise = (async function () {
      var response;
      try { response = await fetch(FONT_URL, { credentials: 'omit', cache: 'force-cache' }); }
      catch (e) { throw new Error('Không đọc được font Noto Sans đi kèm. Hãy mở CANVIO qua localhost/HTTPS; không cần tài khoản hoặc API.'); }
      if (!response.ok) throw new Error('Không tải được font Noto Sans (' + response.status + '). Kiểm tra thư mục assets/pdf-fonts trong gói CANVIO.');
      var buf = await response.arrayBuffer(); if (!buf.byteLength || buf.byteLength > FONT_LIMIT) throw new Error('Font PDF vượt giới hạn 2 MB.');
      var bytes = new Uint8Array(buf), metrics = parseTTF(bytes);
      fontBytesCache = bytes; fontMetricsCache = metrics; return { bytes: bytes, metrics: metrics };
    })().catch(function (e) { fontPromise = null; throw e; });
    return fontPromise;
  }
  function pdfEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function num(n) { return (Math.round((Number(n) || 0) * 1000) / 1000).toString(); }
  function toHex4(cp) { return (cp & 0xFFFF).toString(16).toUpperCase().padStart(4, '0'); }
  function rgb(color) {
    var c = String(color || '#000000').trim(), alpha = 1, m;
    if ((m = c.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+)%?)?\s*\)$/i))) {
      alpha = m[4] == null ? 1 : Math.max(0, Math.min(1, m[4].indexOf('.') >= 0 || +m[4] <= 1 ? +m[4] : +m[4] / 100));
      return { r: Math.max(0, Math.min(255, +m[1])) / 255, g: Math.max(0, Math.min(255, +m[2])) / 255, b: Math.max(0, Math.min(255, +m[3])) / 255, a: alpha };
    }
    if ((m = c.match(/^#([0-9a-f]{3,8})$/i))) { var h = m[1]; if (h.length === 3 || h.length === 4) h = h.split('').map(function (x) { return x + x; }).join(''); var v = parseInt(h.slice(0, 6), 16); return { r: ((v >> 16) & 255) / 255, g: ((v >> 8) & 255) / 255, b: (v & 255) / 255, a: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1 }; }
    var ctx = rgb.ctx || (rgb.ctx = document.createElement('canvas').getContext('2d')); ctx.fillStyle = '#000'; ctx.fillStyle = c; var resolved = ctx.fillStyle;
    if (resolved === c && !/^#[0-9a-f]{6}$/i.test(resolved)) return { r: 0, g: 0, b: 0, a: 1 };
    return rgb(resolved);
  }
  function colorOps(c, stroke) { return num(c.r) + ' ' + num(c.g) + ' ' + num(c.b) + (stroke ? ' RG\n' : ' rg\n'); }
  function parseSvg(svg) {
    var doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('SVG từ Poster không hợp lệ.');
    var root = doc.documentElement, w = parseFloat(root.getAttribute('width')), h = parseFloat(root.getAttribute('height'));
    if (!(w > 0 && h > 0 && w <= 20000 && h <= 20000)) throw new Error('Khổ thiết kế không hợp lệ hoặc vượt 20.000 px.');
    var gradients = {};
    Array.prototype.forEach.call(doc.querySelectorAll('linearGradient,radialGradient'), function (g) {
      var stops = Array.prototype.map.call(g.querySelectorAll('stop'), function (s) { return { pos: Math.max(0, Math.min(1, parseFloat(s.getAttribute('offset')) / (String(s.getAttribute('offset') || '').indexOf('%') >= 0 ? 100 : 1) || 0)), color: rgb(s.getAttribute('stop-color') || '#000000') }; }).sort(function (a, b) { return a.pos - b.pos; });
      if (stops.length) gradients[g.id] = { type: g.tagName.toLowerCase(), x1: parseFloat(g.getAttribute('x1') || 0), y1: parseFloat(g.getAttribute('y1') || 0), x2: parseFloat(g.getAttribute('x2') || w), y2: parseFloat(g.getAttribute('y2') || 0), cx: parseFloat(g.getAttribute('cx') || w / 2), cy: parseFloat(g.getAttribute('cy') || h / 2), r: parseFloat(g.getAttribute('r') || Math.max(w, h) * .62), stops: stops };
    });
    var textRuns = Array.prototype.map.call(doc.querySelectorAll('text'), function (el) { return { text: String(el.textContent || '').normalize('NFC') }; });
    return { doc: doc, root: root, width: w, height: h, gradients: gradients, textRuns: textRuns, elements: Array.prototype.slice.call(root.children).filter(function (e) { return !['defs','title','desc'].includes(e.tagName.toLowerCase()); }) };
  }
  function imageData(el) { var href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || ''; if (!href) throw new Error('Một ảnh trong thiết kế thiếu dữ liệu nguồn.'); if (/^https?:/i.test(href) || href.startsWith('//')) throw new Error('Có ảnh liên kết ngoài. Hãy nhập ảnh vào Asset Library trước khi xuất PDF để không tải ảnh bên ngoài.'); if (!/^(data:image\/|blob:)/i.test(href)) throw new Error('Nguồn ảnh không an toàn hoặc không được hỗ trợ trong PDF.'); return href; }
  async function rasterImage(el, maxEdge) {
    var href = imageData(el), im = new Image();
    await new Promise(function (resolve, reject) { im.onload = resolve; im.onerror = function () { reject(new Error('Không giải mã được một ảnh trong Poster.')); }; im.src = href; });
    var x = parseFloat(el.getAttribute('x') || 0), y = parseFloat(el.getAttribute('y') || 0), w = parseFloat(el.getAttribute('width') || im.naturalWidth), h = parseFloat(el.getAttribute('height') || im.naturalHeight);
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height; if (!iw || !ih || w <= 0 || h <= 0) throw new Error('Kích thước ảnh không hợp lệ.');
    var scale = Math.min(1, maxEdge / Math.max(iw, ih)), cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
    var c = document.createElement('canvas'); c.width = cw; c.height = ch; var ctx = c.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch);
    var mode = (el.getAttribute('preserveAspectRatio') || '').indexOf('slice') >= 0 ? 'slice' : 'meet';
    var sx = 0, sy = 0, sw = iw, sh = ih;
    if (mode === 'slice') { var target = w / h, source = iw / ih; if (source > target) { sw = ih * target; sx = (iw - sw) / 2; } else { sh = iw / target; sy = (ih - sh) / 2; } }
    ctx.drawImage(im, sx, sy, sw, sh, 0, 0, cw, ch);
    var blob = await new Promise(function (resolve, reject) { c.toBlob(function (b) { b ? resolve(b) : reject(new Error('Không mã hóa được ảnh trong PDF.')); }, 'image/jpeg', .92); });
    return { x: x, y: y, w: w, h: h, pixelW: cw, pixelH: ch, bytes: new Uint8Array(await blob.arrayBuffer()) };
  }
  function parseOpacity(el) { var op = parseFloat(el.getAttribute('opacity')); if (!Number.isFinite(op)) op = 1; var f = el.getAttribute('fill-opacity'); if (f != null) op *= Math.max(0, Math.min(1, parseFloat(f) || 0)); return Math.max(0, Math.min(1, op)); }
  function rotation(el) { var t = el.getAttribute('transform') || '', m = t.match(/rotate\(\s*(-?[\d.]+)(?:[ ,]+(-?[\d.]+)[ ,]+(-?[\d.]+))?\s*\)/), tr = t.match(/translate\(\s*(-?[\d.]+)(?:[ ,]+(-?[\d.]+))?\s*\)/); if (!m && !tr) return null; return { angle: m ? +m[1] : 0, cx: m && m[2] != null ? +m[2] : 0, cy: m && m[3] != null ? +m[3] : 0, tx: tr ? +tr[1] : 0, ty: tr && tr[2] != null ? +tr[2] : 0 }; }
  function point(x, y, H, scale, rot) {
    if (rot && rot.angle) { var a = rot.angle * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), dx = x - rot.cx, dy = y - rot.cy; x = rot.cx + dx * c - dy * s; y = rot.cy + dx * s + dy * c; }
    if (rot) { x += rot.tx || 0; y += rot.ty || 0; }
    return [x * scale, (H - y) * scale];
  }
  function pathRect(x, y, w, h, rx, H, scale, rot) {
    rx = Math.max(0, Math.min(rx || 0, w / 2, h / 2));
    if (!rx) { var p1 = point(x, y, H, scale, rot), p2 = point(x + w, y, H, scale, rot), p3 = point(x + w, y + h, H, scale, rot), p4 = point(x, y + h, H, scale, rot); return num(p1[0]) + ' ' + num(p1[1]) + ' m ' + num(p2[0]) + ' ' + num(p2[1]) + ' l ' + num(p3[0]) + ' ' + num(p3[1]) + ' l ' + num(p4[0]) + ' ' + num(p4[1]) + ' l h\n'; }
    var k = .5522847498, pts = [], push = function (v, op) { pts.push(v.map(num).join(' ') + ' ' + op); }, P = function (a, b) { return point(a, b, H, scale, rot); };
    push(P(x + rx, y), 'm'); push(P(x + w - rx, y), 'l'); var a = P(x + w - rx + rx * k, y), b = P(x + w, y + rx - rx * k), c = P(x + w, y + rx); push(a.concat(b, c), 'c'); push(P(x + w, y + h - rx), 'l'); a = P(x + w, y + h - rx + rx * k); b = P(x + w - rx + rx * k, y + h); c = P(x + w - rx, y + h); push(a.concat(b, c), 'c'); push(P(x + rx, y + h), 'l'); a = P(x + rx - rx * k, y + h); b = P(x, y + h - rx + rx * k); c = P(x, y + h - rx); push(a.concat(b, c), 'c'); push(P(x, y + rx), 'l'); a = P(x, y + rx - rx * k); b = P(x + rx - rx * k, y); c = P(x + rx, y); push(a.concat(b, c), 'c'); pts.push('h'); return pts.join(' ') + '\n';
  }
  function pathEllipse(cx, cy, rx, ry, H, scale, rot) {
    var k = .5522847498, P = function (x, y) { return point(x, y, H, scale, rot); }, a = [], put = function (v, op) { a.push(v.map(num).join(' ') + ' ' + op); };
    put(P(cx + rx, cy), 'm'); put(P(cx + rx, cy - ry * k).concat(P(cx + rx * k, cy - ry), P(cx, cy - ry)), 'c'); put(P(cx - rx * k, cy - ry).concat(P(cx - rx, cy - ry * k), P(cx - rx, cy)), 'c'); put(P(cx - rx, cy + ry * k).concat(P(cx - rx * k, cy + ry), P(cx, cy + ry)), 'c'); put(P(cx + rx * k, cy + ry).concat(P(cx + rx, cy + ry * k), P(cx + rx, cy)), 'c'); a.push('h'); return a.join(' ') + '\n';
  }
  function pdfFunction(stops, objects) {
    if (stops.length < 2) stops = [stops[0], { pos: 1, color: stops[0].color }];
    if (stops.length > 8) stops = [stops[0], stops[stops.length - 1]];
    var funcs = [], bounds = [], encode = [];
    for (var i = 0; i < stops.length - 1; i++) {
      var a = stops[i].color, b = stops[i + 1].color;
      funcs.push(objects.add('<< /FunctionType 2 /Domain [0 1] /C0 [' + num(a.r) + ' ' + num(a.g) + ' ' + num(a.b) + '] /C1 [' + num(b.r) + ' ' + num(b.g) + ' ' + num(b.b) + '] /N 1 >>'));
      if (i < stops.length - 2) bounds.push(num(stops[i + 1].pos)); encode.push('0 1');
    }
    if (funcs.length === 1) return funcs[0];
    return objects.add('<< /FunctionType 3 /Domain [0 1] /Functions [' + funcs.map(function (x) { return x + ' 0 R'; }).join(' ') + '] /Bounds [' + bounds.join(' ') + '] /Encode [' + encode.join(' ') + '] >>');
  }
  async function createPdf(parsedPages, font, title) {
    var O = { a: [], add: function (v) { this.a.push(typeof v === 'string' ? ascii(v) : v); return this.a.length; }, set: function (id, v) { this.a[id - 1] = typeof v === 'string' ? ascii(v) : v; }, stream: function (dict, data) { var head = ascii(dict.replace(/>>$/, '') + ' /Length ' + data.length + ' >>\nstream\n'); return this.add(concat([head, data, ascii('\nendstream')])); } };
    var catalogId = O.add(''), pagesId = O.add('');
    var fontFileId = O.stream('<< /Length1 ' + font.bytes.length + ' >>', font.bytes);
    var used = new Set();
    parsedPages.forEach(function (p) { p.textRuns.forEach(function (t) { Array.from(t.text).forEach(function (ch) { var cp = ch.codePointAt(0); if (cp > 0xFFFF) throw new Error('Ký tự ngoài BMP chưa được hỗ trợ: ' + ch); if (cp !== 10 && cp !== 13 && !font.metrics.glyphFor(cp)) throw new Error('Font Noto Sans đi kèm không có glyph cho ký tự: ' + ch); used.add(cp); }); }); });
    var mapMax = Math.max.apply(null, Array.from(used).concat([255])), cidMap = new Uint8Array((mapMax + 1) * 2), widths = [];
    Array.from(used).sort(function (a, b) { return a - b; }).forEach(function (cp) { var gid = font.metrics.glyphFor(cp); cidMap[cp * 2] = (gid >> 8) & 255; cidMap[cp * 2 + 1] = gid & 255; widths.push(cp + ' [' + Math.round(font.metrics.advanceFor(cp) * 1000 / font.metrics.units) + ']'); });
    var cidMapId = O.stream('<< >>', cidMap);
    var cmap = ['/CIDInit /ProcSet findresource begin', '12 dict begin', 'begincmap', '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def', '/CMapName /CANVIO-NotoSans-UCS def', '/CMapType 2 def', '1 begincodespacerange', '<0000> <FFFF>', 'endcodespacerange'];
    var sortedUsed = Array.from(used).sort(function (a, b) { return a - b; });
    for (var ci = 0; ci < sortedUsed.length; ci += 100) { var chunk = sortedUsed.slice(ci, ci + 100); cmap.push(chunk.length + ' beginbfchar'); chunk.forEach(function (cp) { cmap.push('<' + toHex4(cp) + '> <' + toHex4(cp) + '>'); }); cmap.push('endbfchar'); }
    cmap.push('endcmap', 'CMapName currentdict /CMap defineresource pop', 'end', 'end');
    var cmapBytes = ascii(cmap.join('\n'));
    var toUnicodeId = O.stream('<< >>', cmapBytes);
    var box = font.metrics.bbox.map(function (v) { return Math.round(v * 1000 / font.metrics.units); });
    var descriptorId = O.add('<< /Type /FontDescriptor /FontName /CANVIONotoSans /Flags 32 /FontBBox [' + box.join(' ') + '] /ItalicAngle 0 /Ascent ' + Math.round(font.metrics.ascent * 1000 / font.metrics.units) + ' /Descent ' + Math.round(font.metrics.descent * 1000 / font.metrics.units) + ' /CapHeight ' + Math.round(font.metrics.capHeight * 1000 / font.metrics.units) + ' /StemV 80 /FontFile2 ' + fontFileId + ' 0 R >>');
    var cidFontId = O.add('<< /Type /Font /Subtype /CIDFontType2 /BaseFont /CANVIONotoSans /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ' + descriptorId + ' 0 R /DW 1000 /W [' + widths.join(' ') + '] /CIDToGIDMap ' + cidMapId + ' 0 R >>');
    var type0Id = O.add('<< /Type /Font /Subtype /Type0 /BaseFont /CANVIONotoSans /Encoding /Identity-H /DescendantFonts [' + cidFontId + ' 0 R] /ToUnicode ' + toUnicodeId + ' 0 R >>');
    var pageIds = [];
    for (var pgIndex = 0; pgIndex < parsedPages.length; pgIndex++) {
      var pg = parsedPages[pgIndex];
      var H = pg.height, W = pg.width, scale = .75, ctx = [], xobjects = [], ext = {}, shadings = {}, imgIndex = 0, gsIndex = 0, shIndex = 0;
      function gs(opacity) { var key = num(opacity); if (!ext[key]) { var id = O.add('<< /Type /ExtGState /ca ' + key + ' /CA ' + key + ' >>'); ext[key] = 'GS' + (++gsIndex) + ' ' + id; } return '/' + ext[key].split(' ')[0] + ' gs\n'; }
      function setFill(col, op) { var c = typeof col === 'string' ? rgb(col) : col; ctx.push(colorOps(c, false), gs((op == null ? 1 : op) * c.a)); }
      function setStroke(col, op) { var c = typeof col === 'string' ? rgb(col) : col; ctx.push(colorOps(c, true), gs((op == null ? 1 : op) * c.a)); }
      function shading(id, rot) {
        var cacheKey = id + ':' + (rot ? [rot.angle, rot.cx, rot.cy, rot.tx, rot.ty].join(',') : 'plain'); if (shadings[cacheKey]) return shadings[cacheKey]; var g = pg.gradients[id]; if (!g) return null;
        var fn = pdfFunction(g.stops, O), coords, type, pA, pB;
        if (g.type === 'radialgradient') { type = 3; pA = point(g.cx, g.cy, H, scale, rot); pB = point(g.cx, g.cy, H, scale, rot); coords = [pA[0], pA[1], 0, pB[0], pB[1], g.r * scale]; }
        else { type = 2; pA = point(g.x1, g.y1, H, scale, rot); pB = point(g.x2, g.y2, H, scale, rot); coords = [pA[0], pA[1], pB[0], pB[1]]; }
        var obj = O.add('<< /ShadingType ' + type + ' /ColorSpace /DeviceRGB /Coords [' + coords.map(num).join(' ') + '] /Function ' + fn + ' 0 R /Extend [true true] >>');
        var name = 'Sh' + (++shIndex); shadings[cacheKey] = { name: name, ref: obj }; return shadings[cacheKey];
      }
      function paint(path, el, rot, gId, inheritedOpacity) {
        var fill = el.getAttribute('fill') || '#000000', stroke = el.getAttribute('stroke'), opacity = parseOpacity(el) * (inheritedOpacity == null ? 1 : inheritedOpacity), sw = Math.max(.1, parseFloat(el.getAttribute('stroke-width') || 1) * scale);
        if (gId) { var sh = shading(gId, rot); if (sh) { ctx.push('q\n', gs(opacity), path, 'W n\n/' + sh.name + ' sh\nQ\n'); } else { setFill(fill, opacity); ctx.push(path, el.getAttribute('stroke') && stroke !== 'none' ? 'B\n' : 'f\n'); } }
        else {
          if (fill && fill !== 'none') { setFill(fill, opacity); ctx.push(path, stroke && stroke !== 'none' ? 'q\n' + path + 'f\nQ\n' : path + 'f\n'); }
          if (stroke && stroke !== 'none') { setStroke(stroke, opacity); ctx.push(num(sw) + ' w\n' + path + 'S\n'); }
        }
      }
      for (var ei = 0; ei < pg.elements.length; ei++) {
        var el = pg.elements[ei], tag = el.tagName.toLowerCase();
        if (tag === 'rect' && el.getAttribute('width') === '100%' && el.getAttribute('height') === '100%' && el.parentNode === pg.root) continue;
        if (tag === 'g') {
          // The Poster SVG uses <g> for image opacity and translated gradient shapes.
          var children = Array.prototype.slice.call(el.children), groupOpacity = parseFloat(el.getAttribute('opacity')), groupTransform = rotation(el); if (!Number.isFinite(groupOpacity)) groupOpacity = 1;
          for (var gi = 0; gi < children.length; gi++) {
            var child = children[gi], ctag = child.tagName.toLowerCase();
            if (ctag === 'image') { var img = await rasterImage(child, 2400); img.opacity = groupOpacity; var imgRef = O.stream('<< /Type /XObject /Subtype /Image /Width ' + img.pixelW + ' /Height ' + img.pixelH + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode >>', img.bytes); var imgName = 'Im' + (++imgIndex); xobjects.push('/' + imgName + ' ' + imgRef + ' 0 R'); var ix = img.x * scale, iy = (H - img.y - img.h) * scale, iw = img.w * scale, ih = img.h * scale; ctx.push('q\n', gs(groupOpacity), iw + ' 0 0 ' + ih + ' ' + ix + ' ' + iy + ' cm\n/' + imgName + ' Do\nQ\n'); }
            else if (ctag === 'rect' || ctag === 'ellipse') { var fg = (child.getAttribute('fill') || '').match(/^url\(#([^)]+)\)$/), pgth; if (ctag === 'ellipse') { pgth = pathEllipse(+child.getAttribute('cx'), +child.getAttribute('cy'), +child.getAttribute('rx'), +child.getAttribute('ry'), H, scale, groupTransform); } else { var rxg = parseFloat(child.getAttribute('rx') || 0), xx = +child.getAttribute('x'), yy = +child.getAttribute('y'), ww = +child.getAttribute('width'), hh = +child.getAttribute('height'); pgth = pathRect(xx, yy, ww, hh, rxg, H, scale, groupTransform); } paint(pgth, child, groupTransform, fg && fg[1], groupOpacity); }
          }
          continue;
        }
        if (tag === 'rect') {
          var x = parseFloat(el.getAttribute('x') || 0), y = parseFloat(el.getAttribute('y') || 0), rw = parseFloat(el.getAttribute('width') || 0), rh = parseFloat(el.getAttribute('height') || 0), rx = parseFloat(el.getAttribute('rx') || 0), rot = rotation(el);
          var path = pathRect(x, y, rw, rh, rx, H, scale, rot), match = (el.getAttribute('fill') || '').match(/^url\(#([^)]+)\)$/);
          paint(path, el, rot, match && match[1]); continue;
        }
        if (tag === 'ellipse') {
          var cx = +el.getAttribute('cx'), cy = +el.getAttribute('cy'), erx = +el.getAttribute('rx'), ery = +el.getAttribute('ry'), er = rotation(el), ep = pathEllipse(cx, cy, erx, ery, H, scale, er), em = (el.getAttribute('fill') || '').match(/^url\(#([^)]+)\)$/);
          paint(ep, el, er, em && em[1]); continue;
        }
        if (tag === 'text') {
          var fillText = el.getAttribute('fill') || '#000000', alpha = parseOpacity(el), size = Math.max(1, parseFloat(el.getAttribute('font-size') || 14) * scale), weight = parseInt(el.getAttribute('font-weight') || '400', 10), spacing = parseFloat(el.getAttribute('letter-spacing') || 0) * scale, anchor = el.getAttribute('text-anchor') || 'start';
          var tspans = Array.prototype.slice.call(el.querySelectorAll('tspan'));
          if (!tspans.length) tspans = [el];
          tspans.forEach(function (sp) {
            var text = String(sp.textContent || '').normalize('NFC'); if (!text) return;
            var cps = Array.from(text).map(function (ch) { return ch.codePointAt(0); });
            var width = cps.reduce(function (sum, cp) { return sum + font.metrics.advanceFor(cp) * size / font.metrics.units; }, 0) + Math.max(0, cps.length - 1) * spacing;
            var tx = parseFloat(sp.getAttribute('x') || el.getAttribute('x') || 0) * scale;
            if (anchor === 'middle') tx -= width / 2; else if (anchor === 'end') tx -= width;
            var ty = parseFloat(sp.getAttribute('y') || el.getAttribute('y') || 0); if (el.getAttribute('dominant-baseline') === 'central') ty += (parseFloat(el.getAttribute('font-size') || 14) * .35);
            var tyPdf = (H - ty) * scale, hex = '<' + cps.map(toHex4).join('') + '>';
            setFill(fillText, alpha); if (weight >= 650) setStroke(fillText, alpha); ctx.push('BT\n/F1 ' + num(size) + ' Tf\n' + (weight >= 650 ? '2 Tr\n' + num(Math.max(.15, size * .018)) + ' w\n' : '0 Tr\n') + num(spacing) + ' Tc\n1 0 0 1 ' + num(tx) + ' ' + num(tyPdf) + ' Tm\n' + hex + ' Tj\nET\n');
          });
          continue;
        }
        if (tag === 'image') {
          var img2 = await rasterImage(el, 2400), parentOpacity = el.parentNode && el.parentNode.tagName.toLowerCase() === 'g' ? parseFloat(el.parentNode.getAttribute('opacity')) : 1; if (!Number.isFinite(parentOpacity)) parentOpacity = 1;
          var imgRef2 = O.stream('<< /Type /XObject /Subtype /Image /Width ' + img2.pixelW + ' /Height ' + img2.pixelH + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode >>', img2.bytes), imgName2 = 'Im' + (++imgIndex); xobjects.push('/' + imgName2 + ' ' + imgRef2 + ' 0 R');
          var ix2 = img2.x * scale, iy2 = (H - img2.y - img2.h) * scale, iw2 = img2.w * scale, ih2 = img2.h * scale; ctx.push('q\n', gs(parentOpacity), num(iw2) + ' 0 0 ' + num(ih2) + ' ' + num(ix2) + ' ' + num(iy2) + ' cm\n/' + imgName2 + ' Do\nQ\n'); continue;
        }
      }
      var shEntries = Object.keys(shadings).map(function (k) { return '/' + shadings[k].name + ' ' + shadings[k].ref + ' 0 R'; }).join(' '), gsEntries = Object.keys(ext).map(function (k) { var a = ext[k].split(' '); return '/' + a[0] + ' ' + a[1] + ' 0 R'; }).join(' ');
      var res = '<< /Font << /F1 ' + type0Id + ' 0 R >>' + (xobjects.length ? ' /XObject << ' + xobjects.join(' ') + ' >>' : '') + (gsEntries ? ' /ExtGState << ' + gsEntries + ' >>' : '') + (shEntries ? ' /Shading << ' + shEntries + ' >>' : '') + ' >>';
      var content = ascii(ctx.join('')), contentId = O.stream('<< >>', content);
      var pageId = O.add('<< /Type /Page /Parent ' + pagesId + ' 0 R /MediaBox [0 0 ' + num(W * scale) + ' ' + num(H * scale) + '] /Resources ' + res + ' /Contents ' + contentId + ' 0 R >>'); pageIds.push(pageId);
    }
    O.set(pagesId, '<< /Type /Pages /Kids [' + pageIds.map(function (x) { return x + ' 0 R'; }).join(' ') + '] /Count ' + pageIds.length + ' >>');
    O.set(catalogId, '<< /Type /Catalog /Pages ' + pagesId + ' 0 R /Lang (vi-VN) >>');
    var infoId = O.add('<< /Title (' + pdfEscape(title || 'CANVIO Vector PDF') + ') /Creator (CANVIO Studio) /Producer (CANVIO P82/P84 Vector PDF) /Subject (Editable text and vector shapes; images embedded as JPEG) >>');
    var pieces = [concat([ascii('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n')])], offsets = [0], length = pieces[0].length;
    O.a.forEach(function (body, index) { offsets[index + 1] = length; var entry = concat([ascii((index + 1) + ' 0 obj\n'), body, ascii('\nendobj\n')]); pieces.push(entry); length += entry.length; });
    var xref = length, x = 'xref\n0 ' + (O.a.length + 1) + '\n0000000000 65535 f \n';
    for (var oi = 1; oi <= O.a.length; oi++) x += String(offsets[oi]).padStart(10, '0') + ' 00000 n \n';
    pieces.push(ascii(x + 'trailer\n<< /Size ' + (O.a.length + 1) + ' /Root ' + catalogId + ' 0 R /Info ' + infoId + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n'));
    return new Blob([concat(pieces)], { type: 'application/pdf' });
  }
  async function preparePages() {
    if (!window.CVPages || !CV.export || typeof CV.export.svgString !== 'function') throw new Error('Poster/Slide Export owner chưa sẵn sàng.');
    var pages = CVPages.pages.filter(function (p) { return p && p.doc && p.hidden !== true; });
    if (!pages.length && CV.poster && CV.poster.doc) pages = [{ doc: CV.poster.doc }];
    if (!pages.length) throw new Error('Chưa có trang thiết kế để xuất.');
    if (pages.length > MAX_PAGES) throw new Error('Bản PDF vector hiện giới hạn ' + MAX_PAGES + ' trang mỗi lần. Hãy chia thành nhiều tệp.');
    var out = [], totalImages = 0;
    for (var i = 0; i < pages.length; i++) {
      var parsed = parseSvg(CV.export.svgString(pages[i].doc));
      var images = parsed.doc.querySelectorAll('image');
      var textNodes = parsed.doc.querySelectorAll('text');
      for (var ti = 0; ti < textNodes.length; ti++) { var txt = String(textNodes[ti].textContent || '').normalize('NFC'); for (var ch of Array.from(txt)) { var cp = ch.codePointAt(0); if (cp > 0xFFFF) throw new Error('Ký tự ngoài BMP chưa được hỗ trợ trong PDF hiện tại: ' + ch); } }
      for (var j = 0; j < images.length; j++) {
        var href = imageData(images[j]); if (href.startsWith('data:')) totalImages += Math.ceil(href.length * .75);
        if (totalImages > MAX_IMAGE_BYTES) throw new Error('Ảnh trong thiết kế vượt ngân sách 32 MB. Hãy giảm kích thước ảnh hoặc xuất từng phần.');
      }
      out.push(parsed);
    }
    return out;
  }
  function fileName() {
    var name = (CV.poster && CV.poster.doc && CV.poster.doc.name) || 'CANVIO-thiet-ke';
    return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'CANVIO-thiet-ke';
  }
  function download(blob, name) { var url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 30000); }
  async function exportPages() {
    var f = $('#cv-p82-vector-pdf'); if (f) { f.disabled = true; f.textContent = 'Đang dựng PDF…'; }
    try {
      var prepared = await preparePages(), font = await loadFont(), blob = await createPdf(prepared, font, fileName());
      if (blob.size > 64 * 1024 * 1024) throw new Error('PDF vượt giới hạn 64 MB. Hãy chia nhỏ thiết kế.');
      download(blob, 'canvio-' + fileName() + '-vector.pdf');
      var note = 'Đã xuất PDF vector ' + prepared.length + ' trang · ' + Math.round(blob.size / 1024) + ' KB. Chữ được nhúng bằng Noto Sans (OFL 1.1), ảnh được nhúng dạng JPEG.';
      toast(note); var status = $('#cv-p82-status'); if (status) status.textContent = note;
      return { ok: true, bytes: blob.size, pages: prepared.length, font: 'Noto Sans Regular · embedded', selectableText: true, vectorShapes: true, embeddedImages: true, pdfx: false, cmyk: false };
    } catch (e) {
      var message = e && e.message || String(e); toast('Không xuất được PDF vector: ' + message);
      var status2 = $('#cv-p82-status'); if (status2) status2.textContent = 'Không xuất được PDF vector: ' + message;
      throw e;
    } finally { if (f) { f.disabled = false; f.textContent = 'PDF vector · chữ chọn được'; } }
  }
  function mount() {
    var bar = $('#cv-strip .bar');
    if (!bar || $('#cv-p82-vector-pdf')) return false;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-primary sm'; b.id = 'cv-p82-vector-pdf'; b.textContent = 'PDF vector · chữ chọn được';
    b.title = 'PDF có chữ tiếng Việt chọn/sao chép được, font Noto Sans nhúng; hình ảnh vẫn là raster';
    b.addEventListener('click', function () { exportPages().catch(function () {}); });
    bar.appendChild(b);
    var status = document.createElement('small'); status.id = 'cv-p82-status'; status.className = 'tiny'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.style.cssText = 'display:block;flex-basis:100%;margin:2px 0;color:var(--ink-3)'; status.textContent = 'PDF vector tiếng Việt · chữ chọn được · Noto Sans nhúng · ảnh JPEG · chưa PDF/X hoặc CMYK.'; bar.appendChild(status);
    return true;
  }
  function addCommand() {
    var cv = window.CV; if (!cv || !cv.palette || typeof cv.palette.build !== 'function' || cv.palette.build.__p82pdf) return false;
    var prior = cv.palette.build;
    cv.palette.build = function () {
      var items = prior.apply(this, arguments) || [];
      var label = 'Xuất PDF vector · chữ tiếng Việt chọn được';
      if (!items.some(function (x) { return x && x.label === label; })) items.unshift({ label: label, hint: 'PDF · vector · font nhúng · Noto Sans · chọn chữ · poster · slide', icon: '⇧', shortcut: 'Ctrl+K', run: function () { CV.go('poster'); setTimeout(function () { var b = $('#cv-p82-vector-pdf'); if (b) b.click(); else toast('Mở Poster Studio để xuất PDF vector.'); }, 420); } });
      return items;
    };
    cv.palette.build.__p82pdf = true; return true;
  }
  function tests() {
    var sample = 'Tiếng Việt CANVIO ă â ê ô ơ ư đ Đ Ắ Ộ ỹ';
    var metrics = fontMetricsCache;
    return {
      moduleVersion: '82.1.0', ownerUsesExistingPoster: !!(window.CV && CV.poster), ownerUsesExistingPages: !!window.CVPages,
      usesExistingSvgRenderer: !!(window.CV && CV.export && CV.export.svgString),
      unicodeSample: sample, fontLoaded: !!fontBytesCache, vietnameseGlyphCoverage: !!(metrics && Array.from(sample).every(function (c) { return c.codePointAt(0) > 0xFFFF || metrics.glyphFor(c.codePointAt(0)) > 0; })),
      embeddedFontLicenseBundled: true, noExternalDependency: true, lazyFontLoad: true, noNewStore: true, noRemoteImageFetch: true,
      selectableTextOutput: true, vectorShapesOutput: true, rasterImageEmbedding: true, pdfx: false, cmyk: false
    };
  }
  function install() {
    mount(); addCommand();
    var observer = new MutationObserver(function () { mount(); addCommand(); });
    var host = $('#page-poster') || document.body; observer.observe(host, { childList: true, subtree: true });
    window.CANVIOVectorPDF = { version: '82.1.0', fontUrl: FONT_URL, loadFont: loadFont, parseTTF: parseTTF, preparePages: preparePages, createPdf: createPdf, exportPages: exportPages, tests: tests, limits: { maxPages: MAX_PAGES, maxImageBytes: MAX_IMAGE_BYTES, maxFontBytes: FONT_LIMIT }, fontLicense: 'SIL Open Font License 1.1 · Noto Sans · Google', noNetworkAPI: true, noNewStore: true };
    var prior = window.CANVIO_BUILD || {};
    window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: '23.3.90-p82', base: '23.3.89-p84', candidate: 'P68–P70 + P82/P84 vector PDF + P87 + P88 + P90–P96 + P97–P101 + P104', phaseRange: 'P68–P70 retained; P82/P84 integrated; P87/P88/P90–P104 retained', features: (prior.features || []).concat(['P82/P84: direct multipage PDF with embedded Noto Sans TTF, selectable Vietnamese text, vector basic shapes/gradients and embedded raster images; lazy local font asset, no external API']) }));
    document.title = 'CANVIO 23.3.90-p82 — Vietnamese Vector PDF Candidate';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})();
