/* CANVIO P76/P77/P83 — Unified Brand Voice, Local Design DNA and CIEDE2000.
 * Reuses CV.brand, CVPages/CV.poster, CV.engines.web and CV Studio local state.
 * No remote requests, no new persistent store, no API keys, no automatic image persistence.
 */
(function () {
  'use strict';
  if (window.CANVIOBrandDNA) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.from((r || document).querySelectorAll(s)); };
  var deep = function (x) { return x == null ? x : JSON.parse(JSON.stringify(x)); };
  var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  var HEX = /^#[0-9a-f]{6}$/i;
  var BRAND_FIELDS = ['name', 'mission', 'audience', 'positioning', 'promise', 'voice', 'pillars', 'avoid', 'keywords'];
  var VOICE_IDS = { name: 'cv76-brand-name', mission: 'cv76-mission', audience: 'cv76-audience', positioning: 'cv76-positioning', promise: 'cv76-promise', voice: 'cv76-voice', pillars: 'cv76-pillars', avoid: 'cv76-avoid', keywords: 'cv76-keywords' };
  var latestDNA = null;
  var lastTransaction = null;
  var applyBusy = false;
  var mounted = false;
  var wrapped = false;
  var UI_ID = 'cv76-brand-dna';
  var WEB_MARKER = '/* CANVIO_BRAND_THEME_P76 */';

  function toast(s) { try { if (window.CV && CV.toast) CV.toast(s); else console.log(s); } catch (_) { console.log(s); } }
  function readVoice() {
    var out = {};
    BRAND_FIELDS.forEach(function (k) { var el = document.getElementById(VOICE_IDS[k]); if (el) out[k] = String(el.value || '').trim().slice(0, k === 'mission' || k === 'positioning' ? 1200 : 600); });
    return out;
  }
  function readStoredBrand() {
    try { return window.LS && LS.get ? (LS.get('brand', {}) || {}) : JSON.parse(localStorage.getItem('canvio5:brand') || '{}'); } catch (_) { return {}; }
  }
  function saveStoredBrand(next) {
    try {
      if (window.LS && LS.set) return LS.set('brand', next);
      localStorage.setItem('canvio5:brand', JSON.stringify(next)); return true;
    } catch (_) { return false; }
  }
  function wrapBrandAPI() {
    var api = window.CV && CV.brand;
    if (!api || wrapped) return false;
    var originalRead = api.read;
    var originalSave = api.save;
    if (typeof originalRead !== 'function' || typeof originalSave !== 'function') return false;
    api.read = function () { return Object.assign({}, originalRead.apply(this, arguments) || {}, readVoice()); };
    api.read.__p76 = true;
    api.save = function () {
      var result = originalSave.apply(this, arguments);
      var persisted = readStoredBrand();
      var voice = readVoice();
      Object.keys(voice).forEach(function (k) { persisted[k] = voice[k]; });
      if (!saveStoredBrand(persisted)) throw new Error('Không lưu được Brand Kit vào bộ nhớ hiện hữu.');
      return result;
    };
    api.save.__p76 = true;
    wrapped = true;
    return true;
  }
  function loadVoiceFields() {
    var b = readStoredBrand();
    BRAND_FIELDS.forEach(function (k) { var el = document.getElementById(VOICE_IDS[k]); if (el && b[k] != null) el.value = String(b[k]); });
  }
  function escapeHTML(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function download(name, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob); var a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 15000);
    return { bytes: blob.size, name: name };
  }
  async function copyText(s) {
    try { if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) { await navigator.clipboard.writeText(s); return true; } } catch (_) {}
    var ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (_) {} ta.remove(); return ok;
  }
  function voicePrompt() {
    var b = Object.assign({}, readStoredBrand(), readVoice());
    var labels = ['Tên thương hiệu: ' + (b.name || 'Chưa xác định'), 'Sứ mệnh: ' + (b.mission || 'Cần làm rõ'), 'Khách hàng mục tiêu: ' + (b.audience || 'Cần nghiên cứu'), 'Định vị: ' + (b.positioning || 'Cần xác lập'), 'Cam kết: ' + (b.promise || 'Cần xác lập'), 'Giọng điệu: ' + (b.voice || 'Chuyên nghiệp, rõ ràng'), 'Trụ cột thông điệp: ' + (b.pillars || 'Chưa thiết lập'), 'Nên tránh: ' + (b.avoid || 'Thông tin không có căn cứ'), 'Từ khóa: ' + (b.keywords || 'Chưa có')];
    return 'Bạn là chuyên gia chiến lược thương hiệu và biên tập nội dung. Hãy xây dựng hệ thống Brand Voice nhất quán, có thể triển khai trên website, poster, CV, slide và video.\n\n' + labels.join('\n') + '\n\nYêu cầu: (1) nêu rõ đặc trưng giọng nói và nguyên tắc viết; (2) lập bảng Do/Don\'t; (3) tạo ví dụ headline, CTA, đoạn giới thiệu ngắn; (4) phân biệt thông điệp theo nhóm người đọc nhưng không thay đổi định vị; (5) không bịa dữ kiện, số liệu, chứng nhận hoặc lời chứng thực; (6) chỉ đề xuất, không tự xuất bản hay gọi API. Trả lời bằng tiếng Việt, cấu trúc có thể đưa thẳng vào Brand Guidelines.';
  }
  function guidelinesMarkdown() {
    var b = Object.assign({}, readStoredBrand(), readVoice());
    var colors = ['primary', 'secondary', 'accent', 'bg', 'ink', 'muted'].map(function (k) { return '- ' + k + ': `' + (b[k] || 'chưa thiết lập') + '`'; }).join('\n');
    return '# Brand Guidelines — ' + (b.name || 'CANVIO Brand') + '\n\n> Tài liệu được tạo cục bộ từ Brand Kit. Các trường chưa có dữ liệu được giữ nguyên trạng thái chưa xác định.\n\n## Chiến lược\n\n- **Sứ mệnh:** ' + (b.mission || 'Chưa thiết lập') + '\n- **Khách hàng mục tiêu:** ' + (b.audience || 'Chưa thiết lập') + '\n- **Định vị:** ' + (b.positioning || 'Chưa thiết lập') + '\n- **Cam kết:** ' + (b.promise || 'Chưa thiết lập') + '\n\n## Brand Voice\n\n' + (b.voice || 'Chưa thiết lập') + '\n\n## Trụ cột thông điệp\n\n' + (b.pillars || 'Chưa thiết lập') + '\n\n## Nên tránh\n\n' + (b.avoid || 'Chưa thiết lập') + '\n\n## Từ khóa\n\n' + (b.keywords || 'Chưa thiết lập') + '\n\n## Màu thương hiệu\n\n' + colors + '\n\n## Typography\n\n- Tiêu đề: `' + (b.fontHead || 'sans') + '`\n- Nội dung: `' + (b.fontBody || 'sans') + '`\n\n## Nguyên tắc sử dụng\n\n1. Giữ nhất quán định vị và lời hứa thương hiệu.\n2. Không tự tạo số liệu, giải thưởng, chứng nhận hoặc trích dẫn.\n3. Kiểm tra tương phản màu và khả năng đọc trước khi phát hành.\n4. Dùng phông hệ thống tương ứng; không tải phông từ mạng khi chưa được phê duyệt.\n5. Mỗi đầu ra cần được rà soát theo ngữ cảnh, nền tảng và quyền sử dụng tài nguyên.\n';
  }

  /* Color science: sRGB -> CIELAB D65 and CIEDE2000 (Sharma et al. 2005). */
  function srgbChannel(v) { v = clamp(v / 255, 0, 1); return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function rgbToLab(rgb) {
    var r = srgbChannel(rgb[0]), g = srgbChannel(rgb[1]), b = srgbChannel(rgb[2]);
    var x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
    var y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / 1.00000;
    var z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883;
    var f = function (t) { return t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116; };
    var fx = f(x), fy = f(y), fz = f(z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }
  function hexRgb(hex) { if (!HEX.test(hex)) throw new Error('Mã màu phải có dạng #RRGGBB.'); return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
  function hexLab(hex) { return rgbToLab(hexRgb(hex)); }
  function deltaE00(lab1, lab2) {
    var L1 = lab1[0], a1 = lab1[1], b1 = lab1[2], L2 = lab2[0], a2 = lab2[1], b2 = lab2[2];
    var C1 = Math.sqrt(a1 * a1 + b1 * b1), C2 = Math.sqrt(a2 * a2 + b2 * b2), Cbar = (C1 + C2) / 2;
    var Cbar7 = Math.pow(Cbar, 7), G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));
    var a1p = (1 + G) * a1, a2p = (1 + G) * a2;
    var C1p = Math.sqrt(a1p * a1p + b1 * b1), C2p = Math.sqrt(a2p * a2p + b2 * b2);
    var h = function (a, b) { var d = Math.atan2(b, a) * 180 / Math.PI; return d < 0 ? d + 360 : d; };
    var h1p = C1p < 1e-12 ? 0 : h(a1p, b1), h2p = C2p < 1e-12 ? 0 : h(a2p, b2);
    var dLp = L2 - L1, dCp = C2p - C1p, dhp;
    if (C1p * C2p < 1e-12) dhp = 0;
    else if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
    else if (h2p <= h1p) dhp = h2p - h1p + 360;
    else dhp = h2p - h1p - 360;
    var dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI / 180) / 2);
    var Lbarp = (L1 + L2) / 2, Cbarp = (C1p + C2p) / 2, hbarp;
    if (C1p * C2p < 1e-12) hbarp = h1p + h2p;
    else if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2;
    else if (h1p + h2p < 360) hbarp = (h1p + h2p + 360) / 2;
    else hbarp = (h1p + h2p - 360) / 2;
    var T = 1 - 0.17 * Math.cos((hbarp - 30) * Math.PI / 180) + 0.24 * Math.cos((2 * hbarp) * Math.PI / 180) + 0.32 * Math.cos((3 * hbarp + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * hbarp - 63) * Math.PI / 180);
    var dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
    var Rc = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + Math.pow(25, 7)));
    var Sl = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
    var Sc = 1 + 0.045 * Cbarp, Sh = 1 + 0.015 * Cbarp * T;
    var Rt = -Math.sin(2 * dTheta * Math.PI / 180) * Rc;
    var x = dLp / Sl, y = dCp / Sc, z = dHp / Sh;
    return Math.sqrt(Math.max(0, x * x + y * y + z * z + Rt * y * z));
  }
  function deltaEHex(a, b) { return deltaE00(hexLab(a), hexLab(b)); }
  function deltaBand(d) { return d < 1 ? 'Rất khó nhận biết' : d < 3 ? 'Khác biệt nhẹ' : d < 10 ? 'Dễ nhận thấy' : 'Khác biệt lớn'; }

  function paletteSeed(samples, count) {
    if (!samples.length) return [];
    var centers = [samples[0].slice(0, 3)];
    while (centers.length < Math.min(count, samples.length)) {
      var best = null, bestDist = -1;
      for (var i = 0; i < samples.length; i++) {
        var p = samples[i], near = Infinity;
        for (var j = 0; j < centers.length; j++) { var c = centers[j], d = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2; if (d < near) near = d; }
        if (near > bestDist) { bestDist = near; best = p; }
      }
      if (bestDist < 100) break;
      centers.push(best.slice(0, 3));
    }
    return centers;
  }
  function quantizePixels(pixels, requested) {
    var samples = [];
    for (var i = 0; i + 3 < pixels.length; i += 4) {
      if (pixels[i + 3] < 220) continue;
      samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }
    if (!samples.length) throw new Error('Không tìm thấy pixel ảnh đủ rõ để phân tích.');
    var centers = paletteSeed(samples, requested || 6); if (!centers.length) throw new Error('Không tạo được bảng màu từ ảnh.');
    var assign = new Array(samples.length).fill(0), counts = new Array(centers.length).fill(0);
    for (var pass = 0; pass < 9; pass++) {
      var sums = centers.map(function () { return [0, 0, 0]; }); counts.fill(0);
      for (var s = 0; s < samples.length; s++) {
        var p = samples[s], ix = 0, min = Infinity;
        for (var c = 0; c < centers.length; c++) { var q = centers[c], d = (p[0]-q[0])**2 + (p[1]-q[1])**2 + (p[2]-q[2])**2; if (d < min) { min = d; ix = c; } }
        assign[s] = ix; counts[ix]++; sums[ix][0] += p[0]; sums[ix][1] += p[1]; sums[ix][2] += p[2];
      }
      centers = centers.map(function (old, ix) { return counts[ix] ? sums[ix].map(function (v) { return Math.round(v / counts[ix]); }) : old; });
    }
    var rows = centers.map(function (c, i) { return { rgb: c, count: counts[i], share: counts[i] / samples.length, hex: '#' + c.map(function (v) { return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'); }).join('').toUpperCase() }; }).filter(function (x) { return x.count > 0; });
    rows.sort(function (a, b) { return b.count - a.count; });
    return { palette: rows, samples: samples.length };
  }
  function luminance(rgb) { var v = rgb.map(function (x) { x = x / 255; return x <= .04045 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126*v[0] + .7152*v[1] + .0722*v[2]; }
  function chroma(rgb) { return Math.max.apply(null, rgb) - Math.min.apply(null, rgb); }
  function suggestPalette(rows) {
    if (!rows || !rows.length) throw new Error('Chưa có bảng màu để gợi ý.');
    var sorted = rows.slice().sort(function (a, b) { return b.count - a.count; });
    var light = sorted.filter(function (x) { return luminance(x.rgb) >= .55; });
    var dark = sorted.filter(function (x) { return luminance(x.rgb) < .25; });
    var dominant = sorted[0];
    var bg = (luminance(dominant.rgb) > .45 ? (light[0] || dominant) : (dark[0] || dominant));
    var ink = sorted.slice().sort(function (a, b) { return Math.abs(luminance(b.rgb) - luminance(bg.rgb)) - Math.abs(luminance(a.rgb) - luminance(bg.rgb)); })[0] || sorted[0];
    var vivid = sorted.filter(function (x) { return x !== bg && x !== ink; }).sort(function (a, b) { return chroma(b.rgb) * Math.sqrt(b.share) - chroma(a.rgb) * Math.sqrt(a.share); });
    var pick = function (i, fb) { return vivid[i] && vivid[i].hex || fb; };
    return { primary: pick(0, dominant.hex), secondary: pick(1, pick(0, dominant.hex)), accent: pick(2, pick(1, dominant.hex)), bg: bg.hex, ink: ink.hex, muted: pick(3, ink.hex), backgroundLuminance: luminance(bg.rgb) };
  }
  async function analyseImage(file) {
    if (!file) throw new Error('Chưa chọn ảnh.');
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type || '')) throw new Error('Chỉ hỗ trợ PNG, JPEG hoặc WebP.');
    if (file.size > 20 * 1024 * 1024) throw new Error('Ảnh vượt giới hạn 20 MiB.');
    if (typeof createImageBitmap !== 'function') throw new Error('Trình duyệt không hỗ trợ giải mã ảnh cục bộ.');
    var bitmap = await createImageBitmap(file);
    try {
      if (bitmap.width < 16 || bitmap.height < 16 || bitmap.width > 6000 || bitmap.height > 6000 || bitmap.width * bitmap.height > 36000000) throw new Error('Kích thước ảnh phải từ 16 px đến 6000 px mỗi chiều và tối đa 36 megapixel.');
      var scale = Math.min(1, 144 / Math.max(bitmap.width, bitmap.height));
      var w = Math.max(1, Math.round(bitmap.width * scale)), h = Math.max(1, Math.round(bitmap.height * scale));
      var canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) throw new Error('Không khởi tạo được bộ đọc pixel.');
      ctx.drawImage(bitmap, 0, 0, w, h); var image = ctx.getImageData(0, 0, w, h), q = quantizePixels(image.data, 6);
      var dna = suggestPalette(q.palette), bg = hexRgb(dna.bg), bbox = { x0: w, y0: h, x1: -1, y1: -1 }, changed = 0;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var ix = (y * w + x) * 4, r = image.data[ix], g = image.data[ix + 1], b = image.data[ix + 2];
        var dist = Math.sqrt((r-bg[0])**2 + (g-bg[1])**2 + (b-bg[2])**2);
        if (dist > 36) { changed++; bbox.x0 = Math.min(bbox.x0, x); bbox.y0 = Math.min(bbox.y0, y); bbox.x1 = Math.max(bbox.x1, x); bbox.y1 = Math.max(bbox.y1, y); }
      }
      var box = bbox.x1 >= bbox.x0 ? { x: bbox.x0 / w, y: bbox.y0 / h, width: (bbox.x1-bbox.x0+1) / w, height: (bbox.y1-bbox.y0+1) / h } : null;
      return { fileName: String(file.name || 'image').slice(0, 120), width: bitmap.width, height: bitmap.height, sampledWidth: w, sampledHeight: h, samples: q.samples, palette: q.palette, suggested: dna, contentBoundsEstimate: box, contentCoverageEstimate: changed / (w*h), limitation: 'Phân tích màu và mật độ pixel ở mức ước lượng. Không OCR, không xác định font chính xác, không suy ra khoảng cách thiết kế chính xác và không tái tạo ảnh y hệt.' };
    } finally { bitmap.close && bitmap.close(); }
  }

  function fontStack(alias) {
    return ({ sans: 'Inter, "Segoe UI", system-ui, Arial, sans-serif', serif: 'Georgia, "Times New Roman", serif', condensed: '"Arial Narrow", "Roboto Condensed", Impact, sans-serif', rounded: '"Trebuchet MS", "Segoe UI", sans-serif', mono: 'ui-monospace, Consolas, monospace' })[alias] || 'system-ui, sans-serif';
  }
  function isColor(v) { return typeof v === 'string' && HEX.test(v); }
  function mapDocument(doc, brand) {
    if (!doc || !Array.isArray(doc.layers)) return { changed: 0, skipped: 0 };
    var pal = window.CV && CV.designer && CV.designer.paletteById ? CV.designer.paletteById(doc.palette) : null;
    var c = pal && pal.c || {};
    var map = {};
    [['primary', brand.primary], ['accent', brand.accent], ['bg1', brand.bg], ['bg2', brand.secondary], ['ink', brand.ink], ['muted', brand.muted]].forEach(function (pair) { if (isColor(c[pair[0]]) && isColor(pair[1])) map[c[pair[0]].toLowerCase()] = pair[1].toUpperCase(); });
    var changed = 0, skipped = 0;
    (doc.layers || []).forEach(function (layer) {
      if (!layer || layer.locked) { if (layer) skipped++; return; }
      var touched = false;
      ['color', 'bg', 'borderColor'].forEach(function (key) { var v = layer[key]; if (typeof v === 'string' && map[v.toLowerCase()]) { layer[key] = map[v.toLowerCase()]; touched = true; } });
      ['gradient', 'border'].forEach(function (key) { if (typeof layer[key] === 'string' && layer[key]) { var v = layer[key], next = v.replace(/#[0-9a-f]{6}/gi, function (hex) { return map[hex.toLowerCase()] || hex; }); if (next !== v) { layer[key] = next; touched = true; } } });
      if (layer.type === 'text' || layer.type === 'badge') {
        var nextFont = Number(layer.weight || 400) >= 650 ? brand.fontHead : brand.fontBody;
        if (['sans', 'serif', 'condensed', 'rounded', 'mono'].includes(nextFont) && layer.font !== nextFont) { layer.font = nextFont; touched = true; }
      }
      if (touched) changed++;
    });
    return { changed: changed, skipped: skipped };
  }
  function webReady() {
    var w = window.CV && CV.engines && CV.engines.web, ed = window.CVWeb;
    return !!(w && typeof w.snapshotWebsite === 'function' && w.snapshotWebsite() && w.snapshotWebsite().ready === true && ed && typeof ed.getCss === 'function' && typeof ed.setStyle === 'function');
  }
  function selectedTargets() { return ['web', 'poster', 'cv'].filter(function (k) { var e = document.getElementById('cv76-target-' + k); return !!(e && e.checked); }); }
  function targetStatus(k) {
    if (k === 'web') return { key: k, label: 'Website Engine', ready: webReady(), detail: webReady() ? 'Đang dùng GrapesJS và snapshot API hiện hữu.' : 'Mở Website Engine và đợi trình dựng tải xong, sau đó quay lại đây.' };
    if (k === 'poster') { var rows = window.CVPages && CVPages.pages || []; var docsReady = rows.length > 0 && rows.every(function (p) { return !!(p && p.doc && Array.isArray(p.doc.layers)); }); return { key: k, label: 'Poster & Slides', ready: !!(window.CV && CV.poster && CV.poster.doc && docsReady), detail: docsReady ? (rows.length + ' trang hiện có, cùng chủ sở hữu CV.poster/CVPages.') : 'Một hoặc nhiều trang chưa có tài liệu/layers hợp lệ.' }; }
    var cv = $('#page-cvstudio [data-o="acc"]');
    return { key: k, label: 'CV Studio', ready: !!cv, detail: cv ? 'Đổi màu chủ đạo và sáng/tối theo Brand Kit; module hiện không có điều khiển phông chữ.' : 'CV Studio chưa được mount.' };
  }
  function brandDraftStatus() {
    var defaults = { primary: '#4f46e5', secondary: '#0ea5e9', accent: '#0ea472', bg: '#f4f7fc', ink: '#0d1a2b', muted: '#5f6f86', fontHead: 'sans', fontBody: 'sans' };
    var saved = readStoredBrand() || {};
    var live = window.CV && CV.brand && typeof CV.brand.read === 'function' ? CV.brand.read() : {};
    var keys = Object.keys(defaults);
    var changed = keys.filter(function (k) {
      var a = String(live[k] == null ? defaults[k] : live[k]).trim().toLowerCase();
      var b = String(saved[k] == null ? defaults[k] : saved[k]).trim().toLowerCase();
      return a !== b;
    });
    // Brand Voice is part of the same Brand Kit transaction. Never allow a
    // workspace sync to combine saved palette values with unsaved strategy.
    var voice = readVoice();
    BRAND_FIELDS.forEach(function (k) {
      var a = String(voice[k] == null ? '' : voice[k]).trim();
      var b = String(saved[k] == null ? '' : saved[k]).trim();
      if (a !== b) changed.push('voice.' + k);
    });
    return { unsaved: changed.length > 0, fields: changed };
  }
  function previewPlan() {
    var brand = Object.assign({}, readStoredBrand(), (window.CV && CV.brand && typeof CV.brand.read === 'function' ? CV.brand.read() : {}), readVoice());
    var draft = brandDraftStatus();
    var targets = selectedTargets().map(targetStatus);
    var allReady = targets.length > 0 && targets.every(function (x) { return x.ready; });
    var summaries = [];
    if (draft.unsaved) summaries.push('Brand Kit đang có thay đổi chưa lưu (' + draft.fields.join(', ') + '). Hãy bấm “Lưu bộ thương hiệu” trước khi áp dụng để mọi workspace nhận đúng một nguồn màu/phông.');
    targets.forEach(function (t) {
      if (t.key === 'poster' && t.ready) {
        var pages = CVPages.pages; var layers = pages.reduce(function (n, p) { return n + (p.doc && p.doc.layers ? p.doc.layers.length : 0); }, 0);
        summaries.push(t.label + ': sẽ rà màu theo bảng palette gốc và đổi font cho text/badge không khóa (' + pages.length + ' trang, ' + layers + ' lớp). Màu tùy chỉnh không trùng palette sẽ được giữ nguyên.');
      } else if (t.key === 'web') summaries.push(t.label + ': sẽ thêm một khối CSS có marker riêng; không sửa HTML/nội dung và không nạp font từ mạng.');
      else if (t.key === 'cv') summaries.push(t.label + ': sẽ đổi màu nhấn và chế độ nền; typography giữ theo tùy chọn CV Studio vì chưa có font control riêng.');
    });
    var result = { at: new Date().toISOString(), targets: targets, brandDraft: draft, canApply: allReady && !applyBusy && !draft.unsaved, summaries: summaries, brand: { primary: brand.primary, secondary: brand.secondary, accent: brand.accent, bg: brand.bg, ink: brand.ink, muted: brand.muted, fontHead: brand.fontHead, fontBody: brand.fontBody } };
    renderPreview(result); return result;
  }
  function renderPreview(plan) {
    var box = $('#cv76-preview'); if (!box) return;
    var statusText = plan.brandDraft && plan.brandDraft.unsaved ? 'Brand Kit còn thay đổi chưa lưu. Lưu bộ thương hiệu rồi xem trước lại.' : (plan.canApply ? 'Sẵn sàng áp dụng sau khi bạn xác nhận.' : 'Chưa thể áp dụng: chọn ít nhất một workspace và bảo đảm mọi workspace đã chọn sẵn sàng.');
    box.innerHTML = '<div class="cv76-status ' + (plan.canApply ? 'ok' : 'wait') + '">' + escapeHTML(statusText) + '</div>' + plan.targets.map(function (t) { return '<div class="cv76-target-row"><span class="cv76-dot ' + (t.ready ? 'ok' : 'wait') + '"></span><div><b>' + escapeHTML(t.label) + '</b><small>' + escapeHTML(t.detail) + '</small></div><strong>' + (t.ready ? 'Sẵn sàng' : 'Chưa sẵn sàng') + '</strong></div>'; }).join('') + plan.summaries.map(function (x) { return '<p class="cv76-summary">' + escapeHTML(x) + '</p>'; }).join('');
    var btn = $('#cv76-apply'); if (btn) btn.disabled = !plan.canApply;
  }
  function stripWebMarker(css) { return String(css || '').replace(/\/\* CANVIO_BRAND_THEME_P76 \*\/[\s\S]*?\/\* \/CANVIO_BRAND_THEME_P76 \*\//g, '').trim(); }
  function webCss(brand) {
    return WEB_MARKER + '\n:root{--canvio-brand-primary:' + brand.primary + ';--canvio-brand-secondary:' + brand.secondary + ';--canvio-brand-accent:' + brand.accent + ';--canvio-brand-bg:' + brand.bg + ';--canvio-brand-ink:' + brand.ink + ';--canvio-brand-muted:' + brand.muted + ';--canvio-brand-font-head:' + fontStack(brand.fontHead) + ';--canvio-brand-font-body:' + fontStack(brand.fontBody) + '}\n' +
      'body{background:var(--canvio-brand-bg);color:var(--canvio-brand-ink);font-family:var(--canvio-brand-font-body)}\nh1,h2,h3,h4{font-family:var(--canvio-brand-font-head);color:var(--canvio-brand-ink)}\na,.btn-primary,.button-primary{color:var(--canvio-brand-primary)}\nbutton,.btn,.button{font-family:var(--canvio-brand-font-body)}\n/* /CANVIO_BRAND_THEME_P76 */';
  }
  function snapshotCV() { try { return localStorage.getItem('canvio11:cvstudio'); } catch (_) { return null; } }
  function restoreCV(raw) {
    if (raw == null) localStorage.removeItem('canvio11:cvstudio'); else localStorage.setItem('canvio11:cvstudio', raw);
    var sec = $('#page-cvstudio'); if (!sec) return true;
    var data; try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = null; }
    var acc = $('[data-o="acc"]', sec), theme = $('[data-o="theme"]', sec);
    if (acc && data && data.o && data.o.acc) { acc.value = data.o.acc; acc.dispatchEvent(new Event('input', { bubbles: true })); }
    if (theme && data && data.o && data.o.theme) { theme.value = data.o.theme; theme.dispatchEvent(new Event('input', { bubbles: true })); }
    return true;
  }
  function setCVTheme(brand) {
    var sec = $('#page-cvstudio'), acc = sec && $('[data-o="acc"]', sec), theme = sec && $('[data-o="theme"]', sec);
    if (!acc || !theme) throw new Error('CV Studio chưa sẵn sàng.');
    acc.value = brand.primary; acc.dispatchEvent(new Event('input', { bubbles: true }));
    theme.value = luminance(hexRgb(brand.bg)) >= .42 ? 'light' : 'dark'; theme.dispatchEvent(new Event('input', { bubbles: true }));
    return { accent: brand.primary, theme: theme.value, fontApplied: false };
  }
  function applySelected() {
    if (applyBusy) throw new Error('Đang có một thao tác áp thương hiệu khác.');
    var plan = previewPlan(); if (!plan.canApply) throw new Error('Chưa đủ điều kiện. Hãy xem trạng thái workspace trong bản xem trước.');
    var brand = Object.assign({}, readStoredBrand(), (window.CV && CV.brand && typeof CV.brand.read === 'function' ? CV.brand.read() : {}), readVoice());
    var selected = plan.targets.map(function (t) { return t.key; });
    var tx = { id: Date.now(), targets: selected, createdAt: new Date().toISOString(), brand: brand, snapshots: {}, reports: [], applied: false };
    applyBusy = true; var btn = $('#cv76-apply'); if (btn) btn.disabled = true;
    try {
      if (selected.includes('web')) tx.snapshots.web = deep(CV.engines.web.snapshotWebsite());
      if (selected.includes('poster')) {
        var rows = CVPages.pages; tx.snapshots.poster = { current: CVPages.cur, pages: rows.map(function (p) { return deep(p.doc); }) };
      }
      if (selected.includes('cv')) tx.snapshots.cv = snapshotCV();
      if (selected.includes('web')) {
        var old = tx.snapshots.web, css = stripWebMarker(old.css) + '\n\n' + webCss(brand);
        CVWeb.setStyle(css); CV.engines.web.save();
        tx.reports.push({ target: 'Website Engine', changed: 1, detail: 'Đã thêm CSS Brand Kit, không thay HTML.' });
      }
      if (selected.includes('poster')) {
        var pageRows = CVPages.pages, current = CVPages.cur, changed = 0, skipped = 0, details = [];
        pageRows.forEach(function (p, i) { var res = mapDocument(p.doc, brand); changed += res.changed; skipped += res.skipped; details.push(res); });
        if (!pageRows.length) throw new Error('Không có trang Poster/Slide để áp dụng.');
        CV.poster.setDoc(deep(pageRows[current].doc), true); CVPages.go(current);
        if (CV.poster.history && CV.poster.history.push) CV.poster.history.push();
        if (window.CVUnifiedLayers && CVUnifiedLayers.capture) CVUnifiedLayers.capture('poster', 'Áp Brand Kit P76');
        tx.reports.push({ target: 'Poster & Slides', changed: changed, skippedLocked: skipped, pages: pageRows.length, detail: 'Chỉ đổi màu trùng palette hiện tại và font text/badge không khóa.' });
      }
      if (selected.includes('cv')) {
        var cvReport = setCVTheme(brand);
        tx.reports.push({ target: 'CV Studio', changed: 2, detail: 'Accent + light/dark; font chưa được áp dụng do UI không có điều khiển font.' , theme: cvReport.theme });
      }
      if (selected.includes('web') && window.CVUnifiedLayers && CVUnifiedLayers.capture) CVUnifiedLayers.capture('webEngine', 'Áp Brand Kit P76');
      tx.applied = true; lastTransaction = tx;
      renderApplyReport(tx);
      toast('Đã áp dụng Brand Kit cho ' + tx.reports.length + ' workspace. Hoàn tác khả dụng trong phiên này.');
      return { ok: true, transactionId: tx.id, reports: deep(tx.reports), undoScope: 'session-only' };
    } catch (e) {
      try { rollback(tx); } catch (rollbackError) { e.message += ' · Khôi phục một phần cần kiểm tra: ' + rollbackError.message; }
      throw e;
    } finally { applyBusy = false; previewPlan(); }
  }
  function rollback(tx) {
    if (!tx || !tx.snapshots) return false;
    if (tx.snapshots.web && window.CVWeb) { CVWeb.setComponents(tx.snapshots.web.html); CVWeb.setStyle(tx.snapshots.web.css || ''); CV.engines.web.save(); }
    if (tx.snapshots.poster && window.CVPages && CV.poster) restorePoster(tx.snapshots.poster);
    if (Object.prototype.hasOwnProperty.call(tx.snapshots, 'cv')) restoreCV(tx.snapshots.cv);
    return true;
  }
  function restorePoster(snap) {
    var rows = CVPages.pages, n = Math.min(rows.length, snap.pages.length);
    for (var i = 0; i < n; i++) rows[i].doc = deep(snap.pages[i]);
    var cur = clamp(Number(snap.current) || 0, 0, Math.max(0, rows.length - 1));
    if (rows[cur] && rows[cur].doc) CV.poster.setDoc(deep(rows[cur].doc), true);
    CVPages.go(cur);
    if (CV.poster.history && CV.poster.history.push) CV.poster.history.push();
    if (window.CVUnifiedLayers && CVUnifiedLayers.capture) CVUnifiedLayers.capture('poster', 'Hoàn tác Brand Kit P76');
    return true;
  }
  function undoLast() {
    if (!lastTransaction || !lastTransaction.applied) throw new Error('Không có thao tác Brand Kit để hoàn tác trong phiên này.');
    var tx = lastTransaction; rollback(tx); tx.applied = false; lastTransaction = null;
    renderUndoReport(tx); toast('Đã hoàn tác Brand Kit trong các workspace đã chọn.'); return { ok: true, transactionId: tx.id, restored: tx.targets.slice(), scope: 'session-only' };
  }
  function renderApplyReport(tx) {
    var box = $('#cv76-apply-report'); if (!box) return;
    box.innerHTML = '<div class="cv76-status ok">Đã áp dụng thành công · ' + escapeHTML(new Date(tx.createdAt).toLocaleTimeString('vi-VN')) + '</div>' + tx.reports.map(function (r) { return '<div class="cv76-target-row"><span class="cv76-dot ok"></span><div><b>' + escapeHTML(r.target) + '</b><small>' + escapeHTML(r.detail || '') + '</small></div><strong>' + (r.changed || 0) + ' thay đổi' + (r.skippedLocked ? ' · ' + r.skippedLocked + ' khóa' : '') + '</strong></div>'; }).join('') + '<small class="cv76-note">Undo theo giao dịch này chỉ còn trong phiên hiện tại. Hãy lưu dự án/snapshot trước khi đóng tab.</small>';
  }
  function renderUndoReport(tx) { var box = $('#cv76-apply-report'); if (box) box.innerHTML = '<div class="cv76-status ok">Đã khôi phục ' + escapeHTML(tx.targets.join(', ')) + ' về trạng thái trước thao tác.</div>'; }
  function renderDNA(dna) {
    var box = $('#cv77-report'); if (!box) return;
    var current = Object.assign({}, readStoredBrand(), readVoice());
    var rows = [['primary', 'Chính'], ['secondary', 'Phụ'], ['accent', 'Nhấn']].map(function (pair) {
      var a = current[pair[0]]; if (!isColor(a)) return '<div class="cv76-target-row"><b>' + pair[1] + '</b><small>Brand Kit chưa có HEX hợp lệ.</small></div>';
      var nearest = dna.palette.map(function (p) { return { hex: p.hex, d: deltaEHex(a, p.hex) }; }).sort(function (x, y) { return x.d - y.d; })[0];
      return '<div class="cv76-target-row"><span class="cv76-swatch" style="background:' + nearest.hex + '"></span><div><b>' + pair[1] + ' · ΔE00 ' + nearest.d.toFixed(2) + '</b><small>' + escapeHTML(a) + ' gần nhất với ' + nearest.hex + ' · ' + deltaBand(nearest.d) + '</small></div></div>';
    }).join('');
    box.innerHTML = '<div class="cv76-dna-grid"><div><b>' + escapeHTML(dna.fileName) + '</b><small>' + dna.width + ' × ' + dna.height + ' px · lấy mẫu ' + dna.samples + ' pixel</small></div><div><b>Vùng nội dung ước lượng</b><small>' + (dna.contentBoundsEstimate ? Math.round(dna.contentBoundsEstimate.x * 100) + '% / ' + Math.round(dna.contentBoundsEstimate.y * 100) + '% · ' + Math.round(dna.contentBoundsEstimate.width * 100) + ' × ' + Math.round(dna.contentBoundsEstimate.height * 100) + '%' : 'Không đủ khác biệt so với nền để ước lượng') + '</small></div></div><div class="cv76-swatches">' + dna.palette.map(function (x) { return '<div title="' + x.hex + ' · ' + (x.share * 100).toFixed(1) + '%"><span class="cv76-swatch" style="background:' + x.hex + '"></span><b>' + x.hex + '</b><small>' + (x.share * 100).toFixed(1) + '%</small></div>'; }).join('') + '</div><div class="cv76-note">' + escapeHTML(dna.limitation) + '</div><h4>So sánh màu với Brand Kit · CIEDE2000</h4>' + rows;
    var btn = $('#cv77-load'); if (btn) btn.disabled = false;
  }
  function loadSuggestedPalette() {
    if (!latestDNA) throw new Error('Chưa phân tích ảnh.');
    var p = latestDNA.suggested;
    var map = { bPrimary: p.primary, bSecondary: p.secondary, bAccent: p.accent, bBg: p.bg, bInk: p.ink, bMuted: p.muted };
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) { el.value = map[id]; el.dispatchEvent(new Event('input', { bubbles: true })); } });
    if (window.CV && CV.brand && CV.brand.preview) CV.brand.preview();
    toast('Đã nạp màu gợi ý vào ô Brand Kit. Bấm “Lưu bộ thương hiệu” để lưu chính thức.');
    return deep(p);
  }
  function bindUI() {
    var root = document.getElementById(UI_ID); if (!root || root.__p76bound) return;
    root.__p76bound = true;
    root.addEventListener('input', function (e) { if (e.target && e.target.id && Object.keys(VOICE_IDS).some(function (k) { return VOICE_IDS[k] === e.target.id; })) { /* values are read through the existing Brand API */ } });
    root.addEventListener('change', function (e) {
      if (e.target && e.target.id === 'cv77-file') {
        var file = e.target.files && e.target.files[0]; e.target.value = '';
        if (file) analyseImage(file).then(function (dna) { latestDNA = dna; renderDNA(dna); }).catch(function (err) { var box = $('#cv77-report'); if (box) box.textContent = 'Không phân tích được ảnh: ' + (err.message || err); toast('P77: ' + (err.message || err)); });
      }
      if (e.target && e.target.id && e.target.id.indexOf('cv76-target-') === 0) previewPlan();
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-cv76]'); if (!b) return;
      var act = b.dataset.cv76;
      try {
        if (act === 'saveVoice') { CV.brand.save(); toast('Đã lưu Brand Voice trong Brand Kit hiện hữu.'); }
        else if (act === 'prompt') { var p = voicePrompt(); copyText(p).then(function (ok) { toast(ok ? 'Đã sao chép Brand Voice prompt.' : 'Không thể sao chép tự động; hãy xuất guidelines hoặc thử lại trên HTTPS.'); }); }
        else if (act === 'exportMd') download('CANVIO-Brand-Guidelines.md', guidelinesMarkdown(), 'text/markdown;charset=utf-8');
        else if (act === 'exportJson') download('CANVIO-Brand-Kit.json', JSON.stringify(Object.assign({}, CV.brand.read(), readVoice()), null, 2), 'application/json;charset=utf-8');
        else if (act === 'preview') previewPlan();
        else if (act === 'apply') applySelected();
        else if (act === 'undo') undoLast();
        else if (act === 'loadDNA') loadSuggestedPalette();
      } catch (err) { toast('CANVIO Brand: ' + (err.message || err)); }
    });
  }
  function mount() {
    var page = $('#page-brand'); if (!page || document.getElementById(UI_ID)) return false;
    var section = document.createElement('section'); section.className = 'card'; section.id = UI_ID; section.style.cssText = 'margin-top:14px';
    section.innerHTML = '<style>' +
      '#cv76-brand-dna .cv76-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#cv76-brand-dna .cv76-wide{grid-column:1/-1}#cv76-brand-dna .cv76-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}#cv76-brand-dna .cv76-status{border-radius:10px;padding:9px 11px;margin:8px 0;font-weight:700;font-size:12px}#cv76-brand-dna .cv76-status.ok{background:var(--mint-soft);color:var(--mint)}#cv76-brand-dna .cv76-status.wait{background:var(--amber-soft);color:#8a5a00}#cv76-brand-dna .cv76-target-row{display:flex;gap:9px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)}#cv76-brand-dna .cv76-target-row:last-child{border-bottom:0}#cv76-brand-dna .cv76-target-row>div{flex:1;min-width:0}#cv76-brand-dna .cv76-target-row b,#cv76-brand-dna .cv76-target-row small{display:block}#cv76-brand-dna .cv76-target-row small,.cv76-note{color:var(--ink-3);font-size:11px;line-height:1.55}#cv76-brand-dna .cv76-target-row strong{font-size:10px;white-space:nowrap}#cv76-brand-dna .cv76-dot{width:8px;height:8px;border-radius:50%;flex:none}#cv76-brand-dna .cv76-dot.ok{background:var(--mint)}#cv76-brand-dna .cv76-dot.wait{background:var(--amber)}#cv76-brand-dna .cv76-swatches{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0}#cv76-brand-dna .cv76-swatches>div{display:grid;gap:3px;justify-items:center;font-size:10px}#cv76-brand-dna .cv76-swatch{width:42px;height:42px;border-radius:10px;display:inline-block;border:1px solid #0002}#cv76-brand-dna .cv76-dna-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}#cv76-brand-dna .cv76-dna-grid>div{padding:9px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px}#cv76-brand-dna .cv76-dna-grid small{display:block;color:var(--ink-3);font-size:11px;margin-top:3px}#cv76-brand-dna h3{margin:0;font-size:14px}#cv76-brand-dna h4{font-size:12px;margin:12px 0 4px}#cv76-brand-dna textarea{min-height:58px}#cv76-brand-dna button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:700px){#cv76-brand-dna .cv76-grid,#cv76-brand-dna .cv76-dna-grid{grid-template-columns:1fr}}' +
      '</style>' +
      '<div class="cardTop"><div><h3>Brand Strategy · Voice · Guidelines</h3><span class="sub">P76 · bổ sung vào Brand Kit hiện hữu; lưu màu/phông/giọng nói trước khi áp dụng</span></div><span class="badge">LOCAL</span></div>' +
      '<div class="cv76-grid">' +
      '<div class="field"><label for="cv76-brand-name">Tên thương hiệu</label><input id="cv76-brand-name" maxlength="120" placeholder="Tên doanh nghiệp / sản phẩm"></div>' +
      '<div class="field"><label for="cv76-audience">Khách hàng mục tiêu</label><input id="cv76-audience" maxlength="600" placeholder="Nhóm người dùng, nhu cầu, bối cảnh"></div>' +
      '<div class="field cv76-wide"><label for="cv76-mission">Sứ mệnh</label><textarea id="cv76-mission" maxlength="1200" rows="2" placeholder="Thương hiệu tồn tại để giải quyết vấn đề gì?"></textarea></div>' +
      '<div class="field"><label for="cv76-positioning">Định vị</label><textarea id="cv76-positioning" maxlength="1200" rows="2" placeholder="Khác biệt nào có căn cứ?"></textarea></div>' +
      '<div class="field"><label for="cv76-promise">Lời hứa thương hiệu</label><textarea id="cv76-promise" maxlength="600" rows="2" placeholder="Giá trị nhất quán có thể thực hiện"></textarea></div>' +
      '<div class="field"><label for="cv76-voice">Giọng điệu & tính cách</label><textarea id="cv76-voice" maxlength="600" rows="2" placeholder="Ví dụ: rõ ràng, chuyên nghiệp, điềm tĩnh, thực tế"></textarea></div>' +
      '<div class="field"><label for="cv76-pillars">Trụ cột thông điệp</label><textarea id="cv76-pillars" maxlength="600" rows="2" placeholder="Mỗi dòng một thông điệp"></textarea></div>' +
      '<div class="field"><label for="cv76-avoid">Từ ngữ / tuyên bố cần tránh</label><textarea id="cv76-avoid" maxlength="600" rows="2" placeholder="Không phóng đại, không cam kết không kiểm chứng…"></textarea></div>' +
      '<div class="field"><label for="cv76-keywords">Từ khóa thương hiệu</label><input id="cv76-keywords" maxlength="600" placeholder="Các từ khóa, phân tách bằng dấu phẩy"></div></div>' +
      '<div class="cv76-actions"><button class="btn btn-primary sm" data-cv76="saveVoice">Lưu Brand Voice</button><button class="btn btn-soft sm" data-cv76="prompt">Tạo / sao chép prompt cục bộ</button><button class="btn btn-ghost sm" data-cv76="exportMd">Xuất Brand Guidelines .MD</button><button class="btn btn-ghost sm" data-cv76="exportJson">Xuất Brand Kit .JSON</button></div>' +
      '<div class="divider" style="margin:15px 0;border-top:1px solid var(--line)"></div>' +
      '<div class="cardTop"><div><h3>Design DNA từ ảnh</h3><span class="sub">P77 · phân tích pixel cục bộ · ảnh không được tải lên hoặc tự lưu</span></div><span class="badge">OFFLINE</span></div>' +
      '<div class="row" style="gap:8px;align-items:end;flex-wrap:wrap"><div class="field" style="min-width:220px;flex:1"><label for="cv77-file">Chọn ảnh tham chiếu (PNG/JPEG/WebP · tối đa 20 MiB)</label><input id="cv77-file" type="file" accept="image/png,image/jpeg,image/webp"></div><button class="btn btn-soft sm" id="cv77-load" data-cv76="loadDNA" disabled>Nạp màu gợi ý vào Brand Kit</button></div>' +
      '<div id="cv77-report" class="tiny" aria-live="polite">Chưa có ảnh được phân tích. Kết quả là ước lượng màu/mật độ pixel; không OCR hoặc nhận diện font chính xác.</div>' +
      '<div class="divider" style="margin:15px 0;border-top:1px solid var(--line)"></div>' +
      '<div class="cardTop"><div><h3>Đồng bộ Brand / Theme</h3><span class="sub">P83 · một nguồn nhận diện · preview trước khi áp dụng</span></div><span class="badge">PREVIEW → APPLY</span></div>' +
      '<div class="cv76-grid"><label class="ck"><input id="cv76-target-web" type="checkbox" checked> Website Engine</label><label class="ck"><input id="cv76-target-poster" type="checkbox" checked> Poster & Slides (mọi trang)</label><label class="ck"><input id="cv76-target-cv" type="checkbox" checked> CV Studio</label></div>' +
      '<div class="cv76-actions"><button class="btn btn-soft sm" data-cv76="preview">Xem trước thay đổi</button><button class="btn btn-primary sm" id="cv76-apply" data-cv76="apply" disabled>Áp dụng workspace đã chọn</button><button class="btn btn-ghost sm" data-cv76="undo">Undo giao dịch gần nhất</button></div>' +
      '<div id="cv76-preview" class="tiny" aria-live="polite">Chọn workspace rồi bấm Xem trước thay đổi.</div><div id="cv76-apply-report" class="tiny" aria-live="polite"></div>' +
      '<p class="cv76-note">Lưu ý: Website cần GrapesJS đã khởi tạo. Poster/Slides chỉ thay màu khớp palette gốc và font ở text/badge không khóa; màu tùy chỉnh được giữ nguyên. CV Studio hiện chỉ nhận màu nhấn và chế độ nền, chưa có điều khiển font. Undo giao dịch áp dụng chỉ có trong phiên đang mở.</p>';
    page.appendChild(section);
    loadVoiceFields(); bindUI(); mounted = true;
    previewPlan(); return true;
  }
  function standardDeltaETests() {
    var pairs = [
      [[50,2.6772,-79.7751],[50,0,-82.7485],2.0425],
      [[50,3.1571,-77.2803],[50,0,-82.7485],2.8615],
      [[50,2.8361,-74.0200],[50,0,-82.7485],3.4412],
      [[50,-1.3802,-84.2814],[50,0,-82.7485],1.0],
      [[50,-1.1848,-84.8006],[50,0,-82.7485],1.0],
      [[50,-0.9009,-85.5211],[50,0,-82.7485],1.0]
    ];
    return pairs.map(function (p) { var v = deltaE00(p[0], p[1]); return Math.abs(v - p[2]) < 0.0002; }).every(Boolean) && deltaE00([50,0,0],[50,0,0]) < 1e-9;
  }
  function test() {
    var stored = readStoredBrand() || {};
    var localFeatureSource = [analyseImage, quantizePixels, suggestPalette, rgbToLab, deltaE00, deltaEHex].map(function (fn) { return Function.prototype.toString.call(fn); }).join('\n');
    var checks = {
      brandKitOwner: !!(window.CV && CV.brand && typeof CV.brand.read === 'function' && typeof CV.brand.save === 'function'),
      voiceStoredInExistingBrandKey: BRAND_FIELDS.some(function (k) { return Object.prototype.hasOwnProperty.call(stored, k); }),
      voiceFieldsMounted: mounted && BRAND_FIELDS.every(function (k) { return !!document.getElementById(VOICE_IDS[k]); }),
      imageAnalysisLocalAPI: typeof createImageBitmap === 'function' && typeof document.createElement('canvas').getContext === 'function',
      deltaE2000ReferenceVectors: standardDeltaETests(),
      posterAndSlidesOwner: !!(window.CV && CV.poster && window.CVPages),
      websiteOwnerAPI: !!(window.CV && CV.engines && CV.engines.web && CV.engines.web.snapshotWebsite),
      cvStudioExistingState: !!$('#page-cvstudio [data-o="acc"]') && !!$('#page-cvstudio [data-o="theme"]'),
      oneLevelSessionUndo: typeof undoLast === 'function',
      noExternalRequests: !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test(localFeatureSource),
      noNewPersistentStore: !/indexedDB|createObjectStore|canvio7[67]:/i.test(localFeatureSource),
      noAutomaticImagePersistence: !/localStorage|sessionStorage|indexedDB/.test(Function.prototype.toString.call(analyseImage))
    };
    return { version: '76.0.0+77.0.0+83.0.0', checks: checks, pass: Object.keys(checks).filter(function (k) { return checks[k] === true; }).length, total: Object.keys(checks).length, allPass: Object.keys(checks).every(function (k) { return checks[k] === true; }), deltaE2000: { referenceVectors: standardDeltaETests(), implementation: 'CIEDE2000, Sharma et al. reference vectors' }, lastDNA: latestDNA ? { fileName: latestDNA.fileName, palette: latestDNA.palette, samples: latestDNA.samples } : null, lastTransaction: lastTransaction ? { id: lastTransaction.id, targets: lastTransaction.targets, applied: lastTransaction.applied } : null, limitations: ['Design DNA does not run OCR or identify exact font family.', 'CV Studio exposes accent and light/dark but no brand font control.', 'Website Engine must be initialized before applying CSS.', 'Undo is session-only; save/pin project snapshots before closing.'] };
  }
  function install() {
    wrapBrandAPI(); mount();
    var observer = new MutationObserver(function () { if (!mounted) { wrapBrandAPI(); mount(); } });
    var host = $('#page-brand') || document.body; observer.observe(host, { childList: true, subtree: true });
    window.CANVIOBrandDNA = { version: '76.0.0+77.0.0+83.0.0', mount: mount, readVoice: readVoice, brandDraftStatus: brandDraftStatus, voicePrompt: voicePrompt, guidelinesMarkdown: guidelinesMarkdown, analyseImage: analyseImage, quantizePixels: quantizePixels, suggestPalette: suggestPalette, rgbToLab: rgbToLab, deltaE00: deltaE00, deltaEHex: deltaEHex, preview: previewPlan, apply: applySelected, undo: undoLast, test: test, get lastDNA() { return latestDNA ? deep(latestDNA) : null; } };
    var prior = window.CANVIO_BUILD || {};
    window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: '23.3.92-p76-p77-p83-r1', base: '23.3.90-p82', candidate: 'P76 + P77 + P83 Brand / Design DNA / Unified Theme', phaseRange: 'P68–P70 retained; P76/P77/P83 integrated; P82/P84/P87/P88/P90–P104 retained', features: (prior.features || []).concat(['P76 Brand Voice and strategy fields persisted in existing canvio5:brand Brand Kit; local prompt builder, Markdown/JSON guideline exports, no provider calls', 'P77 bounded local image pixel sampling and deterministic palette clusters; no OCR/exact-font claims, no image persistence', 'P83 CIEDE2000 ΔE00 color comparison using tested reference vectors; preview/apply/one-level session undo to Website, Poster/Slides and CV existing owners; blocks apply while Brand Kit color/font draft is unsaved']) }));
    document.title = 'CANVIO 23.3.92-p76-p77-p83-r1 — Unified Brand & Design DNA';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})();
