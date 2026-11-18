/* CANVIO P75 — Logo Studio. Local SVG logo variants over Brand Kit / Vector Forge / Asset Library.
 * No new store, no network, no font downloads, no automatic writes. */
(function () {
  'use strict';
  if (window.CANVIOLogoStudio) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var rootId = 'cv75-logo-studio';
  var lastPreview = null;
  var lastApply = null;
  var mounted = false;
  var NS = 'http://www.w3.org/2000/svg';
  var slug = function (s) { return String(s || 'brand').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'brand'; };
  var cleanText = function (s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n || 120); };
  var esc = function (s) { return cleanText(s, 240).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); };
  var color = function (s, fallback) { return /^#[0-9a-f]{6}$/i.test(String(s || '')) ? String(s).toUpperCase() : fallback; };
  var fontStack = function (alias) {
    var map = { sans: 'Inter, Segoe UI, system-ui, Arial, sans-serif', serif: 'Georgia, Times New Roman, serif', condensed: 'Arial Narrow, Roboto Condensed, sans-serif', rounded: 'Trebuchet MS, Segoe UI, sans-serif', mono: 'ui-monospace, Consolas, monospace' };
    return map[String(alias || '').toLowerCase()] || 'Inter, Segoe UI, system-ui, Arial, sans-serif';
  };
  function getBrand() {
    var b = window.CV && CV.brand && typeof CV.brand.read === 'function' ? CV.brand.read() : {};
    return {
      name: cleanText(b.name || '', 120),
      tagline: cleanText(b.promise || b.positioning || '', 160),
      primary: color(b.primary, '#4F46E5'),
      secondary: color(b.secondary, '#0EA5E9'),
      accent: color(b.accent, '#0EA472'),
      bg: color(b.bg, '#FFFFFF'),
      ink: color(b.ink, '#0D1A2B'),
      font: fontStack(b.fontHead || 'sans')
    };
  }
  function deriveMonogram(name) {
    var words = cleanText(name, 120).split(/\s+/).filter(Boolean);
    var stop = /^(công|ty|company|co\.?|group|inc\.?|ltd\.?|limited|corporation|corp\.?|the)$/i;
    words = words.filter(function (w) { return !stop.test(w); });
    if (!words.length) words = cleanText(name, 120).split(/\s+/).filter(Boolean);
    var out = words.length > 1 ? Array.from(words.slice(0, 2)).map(function (w) { return Array.from(w)[0] || ''; }).join('') : Array.from(words[0] || '').slice(0, 2).join('');
    return cleanText(out || 'C', 3).toLocaleUpperCase('vi-VN');
  }
  function readOptions() {
    var b = getBrand();
    var initials = cleanText(($('#cv75-monogram') || {}).value || deriveMonogram(b.name), 3).toLocaleUpperCase('vi-VN').replace(/[^\p{L}\p{N}]/gu, '') || 'C';
    var shape = ($('#cv75-shape') || {}).value || 'rounded';
    if (!['rounded', 'circle', 'diamond'].includes(shape)) shape = 'rounded';
    return { brand: b, initials: initials, shape: shape };
  }
  function iconMarkup(initials, fill, textFill, shape, size, x, y, outline) {
    var border = outline ? ' fill="none" stroke="' + fill + '" stroke-width="7"' : ' fill="' + fill + '"';
    var shapeNode = shape === 'circle'
      ? '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + size * .48 + '"' + border + '/>'
      : shape === 'diamond'
        ? '<path d="M ' + size / 2 + ' 0 L ' + size + ' ' + size / 2 + ' L ' + size / 2 + ' ' + size + ' L 0 ' + size / 2 + ' Z"' + border + '/>'
        : '<rect x="0" y="0" width="' + size + '" height="' + size + '" rx="' + size * .22 + '"' + border + '/>';
    var fs = initials.length > 2 ? size * .31 : initials.length > 1 ? size * .42 : size * .52;
    return '<g transform="translate(' + x + ' ' + y + ')">' + shapeNode + '<text x="' + size / 2 + '" y="' + size / 2 + '" text-anchor="middle" dominant-baseline="central" font-family="' + esc('Inter, Segoe UI, system-ui, Arial, sans-serif') + '" font-size="' + fs + '" font-weight="850" letter-spacing="-' + size * .025 + '" fill="' + textFill + '">' + esc(initials) + '</text></g>';
  }
  function titleSvg(name, label) { return '<title>' + esc(name + ' — ' + label) + '</title><desc>Logo dạng vector do CANVIO Logo Studio tạo từ Brand Kit. Chữ vẫn là text SVG.</desc>'; }
  function svgForVariant(options, variant) {
    var b = options.brand, initials = options.initials, shape = options.shape;
    var name = b.name || 'CANVIO', tagline = b.tagline;
    var width = 1200, height = 760, primary = b.primary, ink = b.ink, bg = b.bg;
    var icon = '', texts = '', backdrop = '';
    var markSize = 174;
    var wordFs = Math.max(42, Math.min(116, 850 / Math.max(6, name.length * .62)));
    var tagFs = Math.max(22, Math.min(34, 440 / Math.max(10, tagline.length * .6)));
    if (variant === 'horizontal') {
      icon = iconMarkup(initials, primary, '#FFFFFF', shape, markSize, 92, 293, false);
      texts = '<text x="315" y="392" font-family="' + esc(b.font) + '" font-size="' + wordFs + '" font-weight="800" letter-spacing="-2" fill="' + ink + '">' + esc(name) + '</text>' + (tagline ? '<text x="320" y="462" font-family="' + esc(b.font) + '" font-size="' + tagFs + '" font-weight="500" letter-spacing=".4" fill="' + b.secondary + '">' + esc(tagline) + '</text>' : '');
    } else if (variant === 'vertical') {
      icon = iconMarkup(initials, primary, '#FFFFFF', shape, 196, 502, 105, false);
      texts = '<text x="600" y="420" text-anchor="middle" font-family="' + esc(b.font) + '" font-size="' + Math.max(38, Math.min(94, 900 / Math.max(6, name.length * .62))) + '" font-weight="800" letter-spacing="-1.5" fill="' + ink + '">' + esc(name) + '</text>' + (tagline ? '<text x="600" y="490" text-anchor="middle" font-family="' + esc(b.font) + '" font-size="' + Math.min(30, tagFs) + '" font-weight="500" fill="' + b.secondary + '">' + esc(tagline) + '</text>' : '');
    } else if (variant === 'mono') {
      icon = iconMarkup(initials, ink, ink, shape, markSize, 92, 293, true);
      texts = '<text x="315" y="392" font-family="' + esc(b.font) + '" font-size="' + wordFs + '" font-weight="800" letter-spacing="-2" fill="' + ink + '">' + esc(name) + '</text>' + (tagline ? '<text x="320" y="462" font-family="' + esc(b.font) + '" font-size="' + tagFs + '" font-weight="500" fill="' + ink + '">' + esc(tagline) + '</text>' : '');
    } else {
      backdrop = '<rect x="0" y="0" width="1200" height="760" fill="' + primary + '"/>';
      icon = iconMarkup(initials, '#FFFFFF', primary, shape, markSize, 92, 293, false);
      texts = '<text x="315" y="392" font-family="' + esc(b.font) + '" font-size="' + wordFs + '" font-weight="800" letter-spacing="-2" fill="#FFFFFF">' + esc(name) + '</text>' + (tagline ? '<text x="320" y="462" font-family="' + esc(b.font) + '" font-size="' + tagFs + '" font-weight="500" fill="#FFFFFF" opacity=".88">' + esc(tagline) + '</text>' : '');
    }
    var label = ({ horizontal: 'Wordmark ngang', vertical: 'Wordmark dọc', mono: 'Đơn sắc', reversed: 'Đảo màu' })[variant];
    var textNodes = texts.match(/<text\b[\s\S]*?<\/text>/g) || [];
    var markLayer = '<g class="vf-object" data-id="cv75-mark" data-type="logo-mark" data-cvg-name="Logo mark">' + icon + '</g>';
    var wordLayer = textNodes[0] ? '<g class="vf-object" data-id="cv75-wordmark" data-type="logo-wordmark" data-cvg-name="Wordmark">' + textNodes[0] + '</g>' : '';
    var taglineLayer = textNodes[1] ? '<g class="vf-object" data-id="cv75-tagline" data-type="logo-tagline" data-cvg-name="Tagline">' + textNodes[1] + '</g>' : '';
    return '<svg xmlns="' + NS + '" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + esc(name + ' — ' + label) + '">' + titleSvg(name, label) + backdrop + markLayer + wordLayer + taglineLayer + '</svg>';
  }
  function faviconSvg(options, size) {
    var b = options.brand, initial = Array.from(options.initials)[0] || 'C';
    var mark = iconMarkup(initial, b.primary, '#FFFFFF', options.shape, size * .84, size * .08, size * .08, false);
    return '<svg xmlns="' + NS + '" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' + esc(b.name || 'Brand') + ' favicon"><title>' + esc((b.name || 'Brand') + ' favicon') + '</title>' + mark + '</svg>';
  }
  function variants(options) {
    return [
      { id: 'horizontal', label: 'Wordmark ngang', svg: svgForVariant(options, 'horizontal') },
      { id: 'vertical', label: 'Wordmark dọc', svg: svgForVariant(options, 'vertical') },
      { id: 'mono', label: 'Đơn sắc', svg: svgForVariant(options, 'mono') },
      { id: 'reversed', label: 'Đảo màu', svg: svgForVariant(options, 'reversed') }
    ];
  }
  function brandSaved() {
    var status = window.CANVIOBrandDNA && typeof CANVIOBrandDNA.brandDraftStatus === 'function' ? CANVIOBrandDNA.brandDraftStatus() : { unsaved: false, fields: [] };
    return !status.unsaved && !!getBrand().name;
  }
  function setStatus(message, bad) { var e = $('#cv75-status'); if (e) { e.textContent = message; e.className = 'cv75-status' + (bad ? ' bad' : ''); } }
  function render() {
    var opts = readOptions(), rows = variants(opts), box = $('#cv75-variants'), favicon = $('#cv75-favicons');
    lastPreview = { options: opts, variants: rows, favicons: [16, 32, 48].map(function (n) { return { size: n, svg: faviconSvg(opts, n) }; }) };
    if (box) box.innerHTML = rows.map(function (r) { return '<article class="cv75-variant"><div class="cv75-variant-preview">' + r.svg + '</div><b>' + r.label + '</b><small>SVG · text có thể chỉnh sửa</small></article>'; }).join('');
    if (favicon) favicon.innerHTML = lastPreview.favicons.map(function (f) { return '<div class="cv75-favicon"><div>' + f.svg + '</div><b>' + f.size + ' px</b></div>'; }).join('');
    var apply = $('#cv75-apply'), save = $('#cv75-save-asset'), exportBtn = $('#cv75-export');
    var ready = brandSaved();
    if (apply) apply.disabled = !ready;
    if (save) save.disabled = !ready;
    if (exportBtn) exportBtn.disabled = !ready;
    setStatus(ready ? 'Brand Kit đã lưu · ' + opts.brand.name + ' · ' + opts.initials : 'Hãy lưu Brand Kit (tên, giọng nói, màu và phông) trước khi xuất hoặc áp dụng logo.', !ready);
    return lastPreview;
  }
  function getPreview() { return lastPreview || render(); }
  function download(blob, name) {
    var b = blob instanceof Blob ? blob : new Blob([blob]);
    var url = URL.createObjectURL(b), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 12000);
    return { name: name, bytes: b.size };
  }
  function svgToPng(svg, width, height) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      img.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = width; c.height = height;
          var ctx = c.getContext('2d'); if (!ctx) throw new Error('Không khởi tạo được canvas PNG.');
          ctx.clearRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height);
          c.toBlob(function (blob) { if (!blob) reject(new Error('Không tạo được PNG từ SVG.')); else resolve(blob); }, 'image/png');
        } catch (e) { reject(e); }
      };
      img.onerror = function () { reject(new Error('Không render được SVG thành PNG.')); };
      img.src = src;
    });
  }
  async function exportPackage() {
    var p = getPreview(); if (!brandSaved()) throw new Error('Hãy lưu Brand Kit trước khi xuất bộ logo.');
    if (!window.CVZip || typeof CVZip.build !== 'function') throw new Error('Không tìm thấy ZIP engine hiện hữu.');
    var name = slug(p.options.brand.name), files = [];
    for (var i = 0; i < p.variants.length; i++) {
      var v = p.variants[i];
      files.push({ name: 'logo/' + name + '-' + v.id + '.svg', data: v.svg });
      files.push({ name: 'logo/' + name + '-' + v.id + '.png', data: await svgToPng(v.svg, 1200, 760) });
    }
    for (var j = 0; j < p.favicons.length; j++) {
      var f = p.favicons[j];
      files.push({ name: 'favicon/favicon-' + f.size + '.svg', data: f.svg });
      files.push({ name: 'favicon/favicon-' + f.size + '.png', data: await svgToPng(f.svg, f.size, f.size) });
    }
    var readme = '# Logo package — ' + p.options.brand.name + '\n\nGenerated locally by CANVIO Logo Studio P75.\n\n- 4 editable SVG wordmark variants: horizontal, vertical, monochrome, reversed.\n- PNG exports are raster previews rendered from the matching SVG.\n- Favicon variants: SVG and PNG at 16/32/48 px.\n- Typography remains SVG text and uses a system font stack; fonts are not embedded or outlined.\n- This is a design starter, not trademark clearance, originality search, or legal advice. Check name/logo similarity, font suitability and local brand guidelines before commercial use.\n- All assets are generated locally. No image or brand data is uploaded.\n';
    files.push({ name: 'README-LOGO-PACKAGE.md', data: readme });
    var zip = await CVZip.build(files);
    var out = download(zip, name + '-logo-package.zip');
    setStatus('Đã xuất ZIP · ' + files.length + ' tệp · ' + Math.round(out.bytes / 1024) + ' KB.');
    return { ok: true, files: files.map(function (x) { return x.name; }), bytes: out.bytes };
  }
  async function saveAsset() {
    var p = getPreview(); if (!brandSaved()) throw new Error('Hãy lưu Brand Kit trước khi lưu logo.');
    if (!window.CV || !CV.assets || typeof CV.assets.addBlob !== 'function') throw new Error('Asset Library chưa sẵn sàng.');
    var v = p.variants.find(function (x) { return x.id === 'horizontal'; });
    var file = new File([v.svg], slug(p.options.brand.name) + '-logo-horizontal.svg', { type: 'image/svg+xml', lastModified: Date.now() });
    await CV.assets.addBlob(file);
    var rows = window.LS && LS.get ? (LS.get('assets', []) || []) : (CV.assets.list() || []);
    var found = rows.find(function (x) { return x && x.name === file.name; });
    if (found) {
      found.license = 'user-created';
      found.provenance = { source: 'CANVIO Logo Studio P75', type: 'generated-svg', declaredLicense: 'user-created', verified: false };
      if (window.LS && LS.set) LS.set('assets', rows);
    }
    var result = { ok: true, name: file.name, bytes: file.size, metadataDeclared: !!found };
    setStatus('Đã lưu SVG có thể chỉnh sửa vào Asset Library hiện hữu. Metadata ghi nguồn user-created; chưa phải xác minh pháp lý.');
    return result;
  }
  async function applyToVectorForge() {
    var p = getPreview(); if (!brandSaved()) throw new Error('Hãy lưu Brand Kit trước khi đưa logo vào Vector Forge.');
    if (!window.CV || !CV.go || !window.CVNativeEngines || !CVNativeEngines.vector) throw new Error('Vector Forge chưa sẵn sàng.');
    CV.go('vectorForge');
    await new Promise(function (resolve) { setTimeout(resolve, 360); });
    var api = CVNativeEngines.vector, svg = $('#vfSvg');
    if (!svg || typeof api.snapshotState !== 'function' || typeof api.restoreState !== 'function') throw new Error('Không truy cập được snapshot/restore của Vector Forge.');
    var before = api.snapshotState();
    var h = p.variants.find(function (x) { return x.id === 'horizontal'; }).svg;
    var doc = new DOMParser().parseFromString(h, 'image/svg+xml');
    if (doc.querySelector('parsererror') || !doc.documentElement || doc.documentElement.localName !== 'svg') throw new Error('Logo SVG không hợp lệ.');
    var inner = '<rect x="0" y="0" width="960" height="540" fill="#FFFFFF"/>' + Array.from(doc.documentElement.children).filter(function (n) { return !['title', 'desc'].includes(n.localName); }).map(function (n) { var node = n.cloneNode(true); if (node.classList && node.classList.contains('vf-object')) node.setAttribute('transform', 'scale(0.8 0.7105263158)'); return new XMLSerializer().serializeToString(node); }).join('');
    // Preserve Vector Forge's canonical SVG document and history adapter.
    if (window.CVUnifiedLayers && CVUnifiedLayers.capture && CVUnifiedLayers.editorIds && CVUnifiedLayers.editorIds().includes('vectorForge')) CVUnifiedLayers.capture('vectorForge', 'Trước khi áp dụng Logo P75');
    if (api.restoreState(inner) === false) throw new Error('Vector Forge từ chối SVG logo.');
    api.render && api.render();
    var after = api.snapshotState();
    if (window.CVUnifiedLayers && CVUnifiedLayers.capture && CVUnifiedLayers.editorIds && CVUnifiedLayers.editorIds().includes('vectorForge')) CVUnifiedLayers.capture('vectorForge', 'Áp dụng Logo P75');
    lastApply = { before: before, after: after, name: p.options.brand.name };
    setStatus('Đã đưa wordmark ngang vào Vector Forge dưới dạng các lớp SVG có thể chỉnh sửa. Dùng Undo P75 ngay tại đây hoặc Undo chung; tránh hoàn tác sau khi đã sửa thêm lớp.');
    return { ok: true, name: p.options.brand.name, layers: api.getLayers ? api.getLayers().length : svg.querySelectorAll('.vf-object').length, undo: true };
  }
  function undoApply() {
    if (!lastApply) throw new Error('Chưa có giao dịch Logo Studio để hoàn tác.');
    var api = window.CVNativeEngines && CVNativeEngines.vector;
    if (!api || typeof api.snapshotState !== 'function' || typeof api.restoreState !== 'function') throw new Error('Vector Forge chưa sẵn sàng.');
    if (api.snapshotState() !== lastApply.after) throw new Error('Vector Forge đã có chỉnh sửa sau giao dịch logo. Hãy dùng Undo gốc để tránh ghi đè thay đổi mới.');
    if (api.restoreState(lastApply.before) === false) throw new Error('Không khôi phục được snapshot Vector Forge.');
    api.render && api.render();
    if (window.CVUnifiedLayers && CVUnifiedLayers.capture && CVUnifiedLayers.editorIds && CVUnifiedLayers.editorIds().includes('vectorForge')) CVUnifiedLayers.capture('vectorForge', 'Hoàn tác Logo P75');
    lastApply = null;
    setStatus('Đã hoàn tác chính xác snapshot Vector Forge trước khi áp dụng logo.');
    return { ok: true };
  }
  function bind() {
    var root = $('#' + rootId); if (!root || root.__p75bound) return;
    root.__p75bound = true;
    root.addEventListener('input', function (e) { if (e.target && ['cv75-monogram'].includes(e.target.id)) render(); });
    root.addEventListener('change', function (e) { if (e.target && ['cv75-shape'].includes(e.target.id)) render(); });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-cv75]'); if (!b) return;
      var a = b.dataset.cv75; b.disabled = true;
      Promise.resolve().then(function () {
        if (a === 'preview') return render();
        if (a === 'apply') return applyToVectorForge();
        if (a === 'undo') return undoApply();
        if (a === 'export') return exportPackage();
        if (a === 'save') return saveAsset();
      }).then(function (r) {
        if (a === 'apply') setStatus('Đã áp dụng vào Vector Forge · ' + r.layers + ' lớp.');
        if (a === 'save') setStatus('Đã lưu ' + r.name + ' vào Asset Library.');
      }).catch(function (err) { setStatus(err && err.message || String(err), true); }).finally(function () { b.disabled = false; render(); });
    });
  }
  function mount() {
    var page = $('#page-brand'); if (!page || $('#' + rootId)) return false;
    var section = document.createElement('section'); section.id = rootId; section.className = 'card'; section.style.marginTop = '14px';
    section.innerHTML = '<style>' +
      '#cv75-logo-studio .cv75-toolbar{display:flex;gap:8px;align-items:end;flex-wrap:wrap}#cv75-logo-studio .cv75-toolbar .field{min-width:145px;flex:1}#cv75-logo-studio .cv75-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}#cv75-logo-studio .cv75-variant{border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--surface-2);min-width:0}#cv75-logo-studio .cv75-variant-preview{height:160px;border:1px solid var(--line);border-radius:9px;background:linear-gradient(135deg,#fff,#f5f7fb);display:grid;place-items:center;overflow:hidden}#cv75-logo-studio .cv75-variant-preview svg{width:100%;height:100%;object-fit:contain}#cv75-logo-studio .cv75-variant b,#cv75-logo-studio .cv75-variant small{display:block;margin-top:6px}#cv75-logo-studio .cv75-variant small{color:var(--ink-3);font-size:10px}#cv75-logo-studio .cv75-favicons{display:flex;gap:15px;align-items:end;flex-wrap:wrap;margin:12px 0}#cv75-logo-studio .cv75-favicon{display:grid;justify-items:center;gap:5px;font-size:10px}#cv75-logo-studio .cv75-favicon>div{width:54px;height:54px;border:1px dashed var(--line-2);display:grid;place-items:center;border-radius:9px;background:#fff}#cv75-logo-studio .cv75-favicon svg{max-width:100%;max-height:100%;image-rendering:auto}#cv75-logo-studio .cv75-status{padding:9px 11px;border-radius:9px;background:var(--mint-soft);color:var(--mint);font-size:11px;margin-top:10px}#cv75-logo-studio .cv75-status.bad{background:var(--amber-soft);color:#8a5a00}#cv75-logo-studio button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:640px){#cv75-logo-studio .cv75-grid{grid-template-columns:1fr}#cv75-logo-studio .cv75-variant-preview{height:135px}}' +
      '</style><div class="cardTop"><div><h3>Logo Studio · Brand Identity</h3><span class="sub">P75 · Wordmark, monogram, favicon và bộ biến thể SVG/PNG · chạy cục bộ</span></div><span class="badge">LOCAL SVG</span></div>' +
      '<div class="cv75-toolbar"><div class="field"><label for="cv75-monogram">Monogram (tối đa 3 ký tự)</label><input id="cv75-monogram" maxlength="3" aria-describedby="cv75-note"></div><div class="field"><label for="cv75-shape">Hình biểu tượng</label><select id="cv75-shape"><option value="rounded">Rounded square</option><option value="circle">Circle</option><option value="diamond">Diamond</option></select></div><button class="btn btn-soft sm" data-cv75="preview">Làm mới preview</button></div>' +
      '<div class="cv75-grid" id="cv75-variants" aria-live="polite"></div><div class="cardTop" style="margin-top:14px"><div><h3>Favicon</h3><span class="sub">Biến thể hình vuông 16 / 32 / 48 px</span></div></div><div class="cv75-favicons" id="cv75-favicons"></div>' +
      '<div class="row" style="gap:7px;flex-wrap:wrap"><button class="btn btn-primary sm" data-cv75="apply" id="cv75-apply">Đưa wordmark vào Vector Forge</button><button class="btn btn-soft sm" data-cv75="undo" id="cv75-undo">Undo Logo Studio</button><button class="btn btn-soft sm" data-cv75="save" id="cv75-save-asset">Lưu SVG chính vào Asset Library</button><button class="btn btn-ghost sm" data-cv75="export" id="cv75-export">Xuất bộ logo ZIP</button></div>' +
      '<div class="cv75-status" id="cv75-status" role="status" aria-live="polite">Đang đọc Brand Kit…</div>' +
      '<p class="cv76-note" id="cv75-note">Tên, tagline, màu và phông lấy từ Brand Kit. Sửa tại Brand Strategy &amp; Voice rồi lưu trước khi xuất/áp dụng. SVG giữ chữ dạng text (không outline/nhúng font); PNG là ảnh raster. Favicon là ký tự rút gọn. Logo chưa được kiểm tra trùng nhãn hiệu hoặc quyền sử dụng font.</p>';
    var brandPanel = $('#cv76-brand-dna', page); if (brandPanel) brandPanel.insertAdjacentElement('beforebegin', section); else page.appendChild(section);
    var opts = readOptions(); var monogram = $('#cv75-monogram'); if (monogram && !monogram.value) monogram.value = opts.initials;
    bind(); mounted = true; render(); return true;
  }
  function tests() {
    var p = getPreview(), api = window.CVNativeEngines && CVNativeEngines.vector;
    var safe = p.variants.every(function (v) { return /^<svg\b/.test(v.svg) && !/<script\b|\son\w+\s*=|(?:href|src)\s*=\s*["']https?:/i.test(v.svg); });
    var checks = {
      brandKitOwner: !!(window.CV && CV.brand && typeof CV.brand.read === 'function'),
      vectorForgeSnapshotOwner: !!(api && api.snapshotState && api.restoreState && api.exportSvg),
      assetLibraryOwner: !!(window.CV && CV.assets && CV.assets.addBlob && CV.assets.list),
      fourLogoVariants: p.variants.length === 4,
      editableSvgText: p.variants.every(function (v) { return /<text\b/.test(v.svg); }),
      vectorForgeSelectableLayers: p.variants.every(function (v) { return (v.svg.match(/class="vf-object"/g) || []).length >= 2 && /data-id="cv75-mark"/.test(v.svg) && /data-id="cv75-wordmark"/.test(v.svg); }),
      uniqueSvgMarkupIds: p.variants.every(function (v) { return !/\sid=/.test(v.svg); }),
      escapedUserText: p.variants.every(function (v) { return v.svg.indexOf('<script') < 0 && v.svg.indexOf('onload=') < 0; }),
      selfContainedSvg: safe,
      faviconSizes: p.favicons.length === 3 && p.favicons.map(function (f) { return new RegExp('width="' + f.size + '"').test(f.svg) && new RegExp('height="' + f.size + '"').test(f.svg); }).every(Boolean),
      noNewPersistentStore: !/localStorage|sessionStorage|indexedDB|createObjectStore/.test([svgForVariant, faviconSvg, variants].map(function (f) { return f.toString(); }).join('\n')),
      noExternalNetwork: !/fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test([svgForVariant, faviconSvg, variants, exportPackage].map(function (f) { return f.toString(); }).join('\n'))
    };
    return { version: '75.0.0', checks: checks, pass: Object.keys(checks).filter(function (k) { return checks[k] === true; }).length, total: Object.keys(checks).length, allPass: Object.keys(checks).every(function (k) { return checks[k] === true; }), limitations: ['SVG wordmark uses editable system-font text; no font embedding or outline conversion.', 'Generated logo is a design proposal, not trademark clearance or uniqueness verification.', 'PNG variants are raster derivatives; SVG remains the editable master.', 'Undo is session-only and guarded against overwriting later Vector Forge edits.'] };
  }
  function install() {
    var prior = window.CANVIO_BUILD || {};
    window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: '23.3.93-p75-p76-p77-p83-r1', base: '23.3.92-p76-p77-p83-r1', candidate: 'P75 Logo Studio + P76 Brand Voice + P77 Design DNA + P83 Unified Brand', features: (prior.features || []).concat(['P75 Logo Studio: four editable SVG wordmark variants, monogram and 16/32/48 favicon; exports SVG/PNG ZIP and reuses Vector Forge / Asset Library owners']) }));
    document.title = 'CANVIO 23.3.93-p75-p76-p77-p83-r1 — Logo Studio & Unified Brand';
    mount();
    var host = $('#page-brand') || document.body;
    var observer = new MutationObserver(function () { if (!mounted) mount(); });
    observer.observe(host, { childList: true, subtree: true });
    window.CANVIOLogoStudio = { version: '75.0.0', mount: mount, render: render, getPreview: getPreview, variants: variants, faviconSvg: faviconSvg, exportPackage: exportPackage, saveAsset: saveAsset, applyToVectorForge: applyToVectorForge, undo: undoApply, test: tests, get lastApply() { return lastApply ? { name: lastApply.name } : null; } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})();
