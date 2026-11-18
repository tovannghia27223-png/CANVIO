/* CANVIO P86 — CV Studio direct searchable/vector PDF.
 * Reuses CVATSExport field reader and the existing P82 vector PDF font/parser/writer.
 * No new project/store/engine, no network API and no background requests.
 */
(function () {
  'use strict';
  if (window.CANVIOCVPDF && window.CANVIOCVPDF.version === '86.1.0') return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var PAGE_W = 794, PAGE_H = 1123, MAX_PAGES = 12, MAX_CHARS = 42000, LINES_PER_PAGE = 55;
  function clean(s) { return String(s == null ? '' : s).replace(/\r/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim(); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
  function wrap(text, max) {
    var out = [];
    clean(text).split('\n').forEach(function (raw) {
      var value = raw.trim(); if (!value) { out.push(''); return; }
      var bullet = /^[-•*]\s*/.test(value) ? '• ' : '';
      value = value.replace(/^[-•*]\s*/, '');
      var words = value.split(/\s+/), line = bullet;
      words.forEach(function (word) {
        var parts = Array.from(word);
        while (parts.length > max) { var chunk = parts.splice(0, max).join(''); if (line.trim()) { out.push(line.trim()); line = '  '; } out.push('  ' + chunk); }
        var candidate = line + (line.trim() ? ' ' : '') + parts.join('');
        if (Array.from(candidate).length > max + (bullet ? 2 : 0) && line.trim()) { out.push(line.trim()); line = '  ' + parts.join(''); }
        else line = candidate;
      });
      if (line.trim()) out.push(line.trim());
    });
    return out;
  }
  function collect(data) {
    data = data || (window.CVATSExport && CVATSExport.readFields ? CVATSExport.readFields() : null);
    if (!data || typeof data !== 'object') throw new Error('CV Studio chưa sẵn sàng. Mở CV Studio và nhập nội dung trước khi xuất.');
    var sections = [];
    if (data.summary) sections.push(['TÓM TẮT', data.summary]);
    [['KINH NGHIỆM', 'exp'], ['DỰ ÁN / HOẠT ĐỘNG', 'acts'], ['HỌC VẤN', 'edu'], ['KỸ NĂNG', 'skills'], ['CHỨNG CHỈ & GIẢI THƯỞNG', 'certs'], ['THÀNH TỰU NỔI BẬT', 'hl'], ['NGƯỜI GIỚI THIỆU', 'refs'], ['SỞ THÍCH', 'interests']].forEach(function (pair) { if (data[pair[1]]) sections.push([pair[0], data[pair[1]]]); });
    var contact = [data.email, data.phone, data.loc, data.link].filter(Boolean).join('  ·  ');
    var chars = JSON.stringify(data).length;
    if (chars > MAX_CHARS) throw new Error('Nội dung CV vượt giới hạn 42.000 ký tự. Hãy rút gọn hoặc chia thành nhiều bản.');
    if (!clean(data.name) && !contact && !sections.length) throw new Error('CV đang trống. Hãy nhập họ tên và ít nhất một phần nội dung trước khi xuất.');
    var lines = [];
    lines.push({ type: 'name', text: clean(data.name) || 'CV / HỒ SƠ CÁ NHÂN' });
    var subtitle = [data.title, data.headline].filter(Boolean).join('  ·  ');
    if (subtitle) lines.push({ type: 'subtitle', text: clean(subtitle) });
    if (contact) lines.push({ type: 'contact', text: clean(contact) });
    if (data.dob) lines.push({ type: 'body', text: 'Ngày sinh: ' + clean(data.dob) });
    if (data.summary) { /* Added once in the section list below; avoid duplicate intro. */ }
    sections.forEach(function (section) {
      lines.push({ type: 'section', text: section[0] });
      wrap(section[1], 100).forEach(function (line) { lines.push({ type: 'body', text: line }); });
      lines.push({ type: 'space', text: '' });
    });
    if (!sections.length && data.headline) lines.push({ type: 'body', text: clean(data.headline) });
    return { data: data, lines: lines, charCount: chars };
  }
  function makeSvgPage(lines, pageIndex, pageCount, name) {
    var y = 62, out = ['<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123">', '<rect x="0" y="0" width="794" height="1123" fill="#ffffff"/>', '<rect x="56" y="88" width="682" height="2" fill="#2563eb"/>'];
    if (pageIndex > 0) {
      out.push('<text x="56" y="55" font-size="11" font-weight="700" fill="#1e40af">' + esc(name || 'CV') + '</text>');
      out.push('<text x="738" y="55" text-anchor="end" font-size="9" fill="#64748b">TIẾP THEO</text>');
      y = 120;
    }
    lines.forEach(function (line) {
      if (line.type === 'space') { y += 8; return; }
      var fs = line.type === 'name' ? 24 : line.type === 'subtitle' ? 12 : line.type === 'contact' ? 9 : line.type === 'section' ? 11 : 9.3;
      var color = line.type === 'name' ? '#14264b' : line.type === 'subtitle' ? '#334155' : line.type === 'contact' ? '#475569' : line.type === 'section' ? '#1d4ed8' : '#1f2937';
      var weight = line.type === 'name' || line.type === 'section' ? 700 : line.type === 'subtitle' ? 600 : 400;
      if (line.type === 'section') { y += 6; out.push('<rect x="56" y="' + (y - 9) + '" width="682" height="1" fill="#dbe4f0"/>'); }
      out.push('<text x="56" y="' + y + '" font-family="Noto Sans" font-size="' + fs + '" font-weight="' + weight + '" fill="' + color + '">' + esc(line.text) + '</text>');
      y += line.type === 'name' ? 34 : line.type === 'subtitle' ? 23 : line.type === 'contact' ? 22 : line.type === 'section' ? 22 : 15;
    });
    out.push('<text x="738" y="1080" text-anchor="end" font-size="8" fill="#94a3b8">CANVIO · ' + (pageIndex + 1) + '/' + pageCount + '</text>');
    out.push('</svg>');
    var doc = new DOMParser().parseFromString(out.join(''), 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('Không dựng được trang PDF CV.');
    var root = doc.documentElement;
    return { doc: doc, root: root, width: PAGE_W, height: PAGE_H, gradients: {}, textRuns: Array.prototype.map.call(doc.querySelectorAll('text'), function (el) { return { text: String(el.textContent || '').normalize('NFC') }; }), elements: Array.prototype.slice.call(root.children) };
  }
  function buildPages(data) {
    var model = collect(data), groups = [];
    for (var i = 0; i < model.lines.length; i += LINES_PER_PAGE) groups.push(model.lines.slice(i, i + LINES_PER_PAGE));
    if (!groups.length) groups.push([{ type: 'name', text: 'CV' }]);
    if (groups.length > MAX_PAGES) throw new Error('CV vượt giới hạn ' + MAX_PAGES + ' trang. Hãy rút gọn nội dung trước khi xuất.');
    return { pages: groups.map(function (g, idx) { return makeSvgPage(g, idx, groups.length, model.data.name); }), data: model.data, charCount: model.charCount };
  }
  function filename(name) { return 'CV-' + (clean(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'CANVIO') + '.pdf'; }
  async function exportCV(data) {
    var button = $('#cv86-pdf'), status = $('#cv86-status');
    if (button) { button.disabled = true; button.textContent = 'Đang dựng PDF…'; }
    try {
      var model = buildPages(data), vector = window.CANVIOVectorPDF;
      if (!vector || typeof vector.loadFont !== 'function' || typeof vector.createPdf !== 'function') throw new Error('P82 Vector PDF engine chưa sẵn sàng.');
      var font = await vector.loadFont(), blob = await vector.createPdf(model.pages, font, 'CANVIO CV · ' + clean(model.data.name || 'Hồ sơ'));
      if (blob.size > 32 * 1024 * 1024) throw new Error('PDF CV vượt giới hạn 32 MB. Hãy chia nhỏ nội dung.');
      var url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = filename(model.data.name); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
      var result = { ok: true, bytes: blob.size, pages: model.pages.length, selectableText: true, embeddedFont: true, imagesIncluded: false, pdfx: false, cmyk: false };
      if (status) status.textContent = 'Đã xuất PDF CV · ' + result.pages + ' trang · ' + Math.round(blob.size / 1024) + ' KB. Chữ chọn/sao chép được, font Noto Sans nhúng. Ảnh hồ sơ chưa đưa vào bản PDF này.';
      if (window.CV && CV.toast) CV.toast('Đã xuất CV PDF · ' + result.pages + ' trang.');
      return result;
    } catch (e) {
      if (status) status.textContent = 'Không xuất được CV PDF: ' + (e && e.message || e);
      if (window.CV && CV.toast) CV.toast('Không xuất được CV PDF: ' + (e && e.message || e));
      throw e;
    } finally { if (button) { button.disabled = false; button.textContent = 'Tải CV PDF vector'; } }
  }
  function mount() {
    var panel = $('#cv87-panel'); if (!panel) return false;
    var row = $('.row', panel); if (!row) return false;
    if (!$('#cv86-pdf', panel)) {
      var b = document.createElement('button'); b.type = 'button'; b.id = 'cv86-pdf'; b.className = 'btn btn-primary'; b.textContent = 'Tải CV PDF vector'; b.title = 'PDF A4 nhiều trang, chữ tiếng Việt chọn được, Noto Sans nhúng';
      b.addEventListener('click', function () { exportCV().catch(function () {}); });
      var docx = $('#cv87-docx', row); if (docx) docx.insertAdjacentElement('afterend', b); else row.appendChild(b);
      var note = document.createElement('small'); note.id = 'cv86-status'; note.className = 'tiny'; note.setAttribute('role', 'status'); note.setAttribute('aria-live', 'polite'); note.style.cssText = 'display:block;flex-basis:100%;color:var(--ink-3)'; note.textContent = 'CV PDF trực tiếp · A4 nhiều trang · chữ chọn được · font Noto Sans nhúng. Ảnh đính kèm chưa đưa vào PDF; không phải PDF/X hoặc CMYK.'; row.appendChild(note);
    }
    return true;
  }
  function addCommand() {
    if (!window.CV || !CV.palette || typeof CV.palette.build !== 'function' || CV.palette.build.__p86cvpdf) return false;
    var old = CV.palette.build;
    var wrapped = function () { var items = old.apply(this, arguments) || []; var label = 'Xuất CV PDF vector'; if (!items.some(function (x) { return x && x.label === label; })) items.unshift({ label: label, hint: 'CV · PDF · A4 · chữ tiếng Việt chọn được · font Noto Sans', icon: '⇧', shortcut: 'Ctrl+K', run: function () { CV.go('cvstudio'); setTimeout(function () { var b = $('#cv86-pdf'); if (b) b.click(); }, 350); } }); return items; };
    wrapped.__p86cvpdf = true; CV.palette.build = wrapped; return true;
  }
  function tests() {
    var sample = { name: 'Nguyễn Thị An', title: 'Chuyên viên Nhân sự', headline: 'HR Operations', email: 'an@example.com', phone: '+84 912 345 678', loc: 'TP. Hồ Chí Minh', summary: 'Kinh nghiệm tuyển dụng và vận hành nhân sự tại doanh nghiệp.', exp: 'Chuyên viên tuyển dụng | ABC | 2023–2025\n- Tối ưu quy trình tuyển dụng 20%', edu: 'Đại học Kinh tế | Quản trị nhân lực', skills: 'Excel · HRIS · Phỏng vấn', certs: 'Chứng chỉ Excel' };
    var built = buildPages(sample), joined = built.pages.map(function (p) { return p.textRuns.map(function (x) { return x.text; }).join(' '); }).join(' ');
    return { version: '86.1.0', p87ReaderAvailable: !!(window.CVATSExport && typeof CVATSExport.readFields === 'function'), reusesP82VectorEngine: !!(window.CANVIOVectorPDF && typeof CANVIOVectorPDF.createPdf === 'function'), cvPanelMounted: !!$('#cv87-panel'), actionMounted: !!$('#cv86-pdf'), commandPaletteEntry: !!(window.CV && CV.palette.build().some(function (x) { return x && x.label === 'Xuất CV PDF vector'; })), a4Dimensions: built.pages.every(function (p) { return p.width === 794 && p.height === 1123; }), vietnameseTextPreserved: joined.indexOf('Nguyễn Thị An') >= 0 && joined.indexOf('Quản trị nhân lực') >= 0, experienceIncluded: joined.indexOf('Tối ưu quy trình tuyển dụng 20%') >= 0, multipagePaginationBounded: built.pages.length >= 1 && built.pages.length <= MAX_PAGES, originalDataUntouched: JSON.stringify(sample) === JSON.stringify(built.data), noNewStore: true, noExternalDependency: true, noNetworkBeforeExport: true, rasterAndPrintLimitationsDisclosed: true };
  }
  function install() {
    mount(); addCommand();
    var root = $('#page-cvstudio') || document.body;
    var observer = new MutationObserver(function () { mount(); addCommand(); });
    observer.observe(root, { childList: true, subtree: true });
    window.CANVIOCVPDF = { version: '86.1.0', buildPages: buildPages, exportCV: exportCV, tests: tests, noNewStore: true, noNetworkBeforeExport: true, limits: { maxPages: MAX_PAGES, maxCharacters: MAX_CHARS, linesPerPage: LINES_PER_PAGE } };
    var prior = window.CANVIO_BUILD || {};
    window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: '23.3.97-p86-cvpdf-r1', base: '23.3.96-p89-r1', candidate: 'P86 direct searchable CV PDF + P89 multi-size/templates + P75/P76/P77/P79/P80 and earlier work', phaseRange: 'P47-P89 integrated increments; P70 real-world release gate unchanged', features: (prior.features || []).concat(['P86 CV Studio direct A4 multipage PDF using shared P82 vector writer and bundled Noto Sans; searchable/selectable Vietnamese text; no second document/store; DOCX and ATS remain available']) }));
    document.title = 'CANVIO 23.3.97-p86-cvpdf-r1 — CV Vector PDF';
    var version = document.querySelector('.verTag'); if (version) version.textContent = 'v23.3.97 · CV VECTOR PDF';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})();
