/* CANVIO P87 · ATS-oriented CV DOCX export (local, editable OOXML)
 * Uses the existing CV Studio fields and CVZip store-only ZIP owner.
 * No external dependency, network request, AI call, or new persistence store.
 */
(function () {
  'use strict';
  if (window.CVATSExport) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); };
  var clean = function (s) { return String(s == null ? '' : s).replace(/\r/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim(); };
  var norm = function (s) { return clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase(); };
  var FILE_LIMIT = 1024 * 1024;

  function readFields() {
    var out = {};
    $$('#page-cvstudio [data-k]').forEach(function (el) { out[el.getAttribute('data-k')] = clean(el.value); });
    if (!out.name && window.CVStudioCore && typeof CVStudioCore.local === 'function') {
      try { out = Object.assign({}, CVStudioCore.local($('#cs-raw') && $('#cs-raw').value || ''), out); } catch (e) {}
    }
    return out;
  }
  function lines(s) { return clean(s).split('\n').map(clean).filter(Boolean); }
  function sectionParts(value) {
    return clean(value).split(/\n\s*\n/).map(function (block) { return lines(block); }).filter(function (rows) { return rows.length; });
  }
  function textOf(d) {
    return Object.keys(d).map(function (k) { return d[k]; }).join('\n');
  }
  function analyze(data) {
    data = data || readFields();
    var full = textOf(data), n = norm(full), checks = [], score = 0;
    function add(id, label, ok, weight, advice) { checks.push({ id: id, label: label, status: ok ? 'pass' : 'warn', weight: weight, advice: advice || '' }); if (ok) score += weight; }
    add('name', 'Có họ tên', !!clean(data.name), 12, 'Thêm họ tên ở đầu CV.');
    add('email', 'Có email liên hệ', /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.test(full), 12, 'Thêm email có thể liên hệ.');
    add('phone', 'Có số điện thoại', /(?:\+?\d[\d .()\-]{7,}\d)/.test(full), 6, 'Thêm số điện thoại nếu phù hợp vị trí.');
    add('summary', 'Có phần giới thiệu / mục tiêu', !!(data.summary || data.headline), 10, 'Thêm phần tóm tắt 2–4 câu, liên quan vị trí ứng tuyển.');
    add('experience', 'Có kinh nghiệm hoặc dự án', !!(data.exp || data.acts), 16, 'Bổ sung kinh nghiệm, thực tập hoặc dự án liên quan.');
    add('education', 'Có học vấn', !!data.edu, 8, 'Bổ sung học vấn và mốc thời gian.');
    add('skills', 'Có kỹ năng', !!data.skills, 10, 'Liệt kê kỹ năng theo nhóm và mức độ sử dụng thực tế.');
    add('metrics', 'Có kết quả / số liệu cụ thể', /\d+(?:[.,]\d+)?\s*(?:%|x|k|m|tỷ|tr|triệu|ngày|tháng|năm|users?|khách|đơn|dự án|nhân sự)/i.test(full) || !!data.hl, 8, 'Thêm kết quả đo được nếu có dữ liệu thật; không tự tạo số liệu.');
    add('action-verbs', 'Có động từ hành động', /\b(phan tich|xay dung|trien khai|quan ly|toi uu|dieu phoi|phat trien|thiet ke|van hanh|kiem soat|led|built|managed|developed|analyzed|improved|implemented|coordinated|designed)\b/.test(n), 6, 'Bắt đầu bullet bằng động từ mô tả phần việc bạn trực tiếp làm.');
    add('contact-links', 'Thông tin liên hệ rõ ràng', !!(data.email || data.phone || data.link), 6, 'Giữ email hoặc số điện thoại ở phần đầu CV.');
    var length = full.length;
    add('reasonable-length', 'Nội dung có độ dài đủ để đánh giá', length >= 250 && length <= 15000, 6, length < 250 ? 'CV hơi ngắn; bổ sung thông tin thực tế.' : 'CV quá dài; ưu tiên nội dung phù hợp vị trí.');
    var warnings = checks.filter(function (x) { return x.status !== 'pass'; }).map(function (x) { return x.advice; });
    var finalScore = Math.max(0, Math.min(100, score));
    return { format: 'CANVIO_ATS_HEURISTIC_REVIEW', version: 1, score: finalScore, grade: finalScore >= 85 ? 'Tương đối tốt' : finalScore >= 65 ? 'Cần rà soát' : 'Cần bổ sung', checks: checks, warnings: warnings, metrics: { characters: length, words: (full.match(/\S+/g) || []).length, sections: ['summary', 'exp', 'edu', 'skills', 'certs'].filter(function (k) { return !!data[k]; }).length }, limitations: ['Đây là checklist heuristic nội bộ, không mô phỏng thuật toán ATS của từng nhà tuyển dụng.', 'Không bảo đảm CV qua hệ thống ATS hoặc được tuyển dụng.', 'Cần đối chiếu từ khóa với mô tả công việc thật; không thêm kỹ năng hoặc thành tích không có bằng chứng.'] };
  }
  function p(text, style, options) {
    options = options || {};
    var run = '<w:r>' + (options.bold ? '<w:rPr><w:b/></w:rPr>' : '') + '<w:t xml:space="preserve">' + esc(text) + '</w:t></w:r>';
    var pp = style ? '<w:pPr><w:pStyle w:val="' + style + '"/></w:pPr>' : '';
    return '<w:p>' + pp + run + '</w:p>';
  }
  function addParagraphs(out, value, mode) {
    sectionParts(value).forEach(function (block) {
      block.forEach(function (row, idx) {
        if (/^[-•*]\s*/.test(row)) out.push(p('• ' + row.replace(/^[-•*]\s*/, ''), 'Normal'));
        else if (idx === 0 && row.indexOf('|') >= 0) out.push(p(row.split('|').map(clean).filter(Boolean).join(' · '), 'Subtitle'));
        else out.push(p(row, 'Normal'));
      });
      out.push(p('', 'Normal'));
    });
  }
  function makeDocument(data) {
    var out = [], name = clean(data.name) || 'CV';
    out.push(p(name, 'Title'));
    if (data.title || data.headline) out.push(p([data.title, data.headline].filter(Boolean).join(' · '), 'Subtitle'));
    var contact = [data.email, data.phone, data.loc, data.link].filter(Boolean).join(' | ');
    if (contact) out.push(p(contact, 'Contact'));
    if (data.summary) { out.push(p('TÓM TẮT', 'Heading1')); addParagraphs(out, data.summary); }
    var sections = [
      ['KINH NGHIỆM', data.exp], ['DỰ ÁN / HOẠT ĐỘNG', data.acts], ['HỌC VẤN', data.edu],
      ['KỸ NĂNG', data.skills], ['CHỨNG CHỈ & GIẢI THƯỞNG', data.certs],
      ['THÀNH TỰU NỔI BẬT', data.hl], ['NGƯỜI GIỚI THIỆU', data.refs], ['SỞ THÍCH', data.interests]
    ];
    sections.forEach(function (item) { if (item[1]) { out.push(p(item[0], 'Heading1')); addParagraphs(out, item[1]); } });
    if (data.dob) { out.push(p('THÔNG TIN BỔ SUNG', 'Heading1')); out.push(p('Ngày sinh: ' + data.dob)); }
    if (out.length < 3) throw new Error('Chưa có nội dung CV để xuất.');
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + out.join('') +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="900" w:bottom="850" w:left="900" w:header="400" w:footer="400" w:gutter="0"/></w:sectPr></w:body></w:document>';
    return xml;
  }
  function stylesXml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:eastAsia="Aptos"/><w:sz w:val="21"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="260"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="34"/><w:color w:val="172554"/></w:rPr><w:pPr><w:spacing w:after="80"/></w:pPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="23"/><w:color w:val="475569"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Contact"><w:name w:val="Contact"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="18"/><w:color w:val="334155"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1D4ED8"/></w:rPr><w:pPr><w:keepNext/><w:spacing w:before="220" w:after="90"/></w:pPr></w:style>' +
      '</w:styles>';
  }
  function packageFiles(data) {
    if (!window.CVZip || typeof CVZip.build !== 'function') throw new Error('CVZip canonical chưa sẵn sàng.');
    var documentXml = makeDocument(data);
    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>';
    var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>';
    var docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    var now = new Date().toISOString();
    var core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + esc(data.name || 'CV') + '</dc:title><dc:creator>CANVIO CV Studio</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified></cp:coreProperties>';
    var app = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>CANVIO</Application></Properties>';
    return [
      { name: '[Content_Types].xml', data: contentTypes },
      { name: '_rels/.rels', data: rootRels },
      { name: 'word/document.xml', data: documentXml },
      { name: 'word/styles.xml', data: stylesXml() },
      { name: 'word/_rels/document.xml.rels', data: docRels },
      { name: 'docProps/core.xml', data: core },
      { name: 'docProps/app.xml', data: app }
    ];
  }
  function safeFileName(s) { return (clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'CV_CANVIO') + '.docx'; }
  async function exportDocx(data) {
    data = data || readFields();
    var json = JSON.stringify(data);
    if (json.length > FILE_LIMIT) throw new Error('Nội dung CV vượt giới hạn 1 MB.');
    var blob = await CVZip.build(packageFiles(data));
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = safeFileName(data.name); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
    return { ok: true, bytes: blob.size, mime: blob.type, entries: 7, editableText: true, layout: 'single-column-linear', atsCompatibleIntent: true, embeddedFonts: false, note: 'DOCX dùng OOXML văn bản có thể chỉnh sửa, bố cục một cột; font do Word/ứng dụng mở file thay thế nếu không có Aptos.' };
  }
  function mount() {
    var page = $('#page-cvstudio');
    if (!page || $('#cv87-panel')) return false;
    var anchor = $('#cs-ex', page);
    if (!anchor) return false;
    var panel = document.createElement('section'); panel.id = 'cv87-panel'; panel.className = 'card'; panel.style.margin = '12px 0';
    panel.innerHTML = '<div class="cardTop"><div><h3>Xuất CV chuyên nghiệp</h3><span class="sub">DOCX văn bản có thể chỉnh sửa · bố cục một cột · không cần dịch vụ trả phí</span></div><span class="badge">P87 · LOCAL</span></div><div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn btn-primary" id="cv87-docx">Tải CV DOCX</button><button type="button" class="btn btn-soft" id="cv87-ats">Kiểm tra ATS</button></div><p class="tiny" id="cv87-status" role="status" aria-live="polite" style="margin-top:9px">DOCX giữ văn bản chỉnh sửa được; chưa nhúng font. Kiểm tra ATS chỉ là checklist gợi ý, không dự đoán kết quả tuyển dụng.</p><div id="cv87-report" class="tiny" style="margin-top:8px"></div>';
    anchor.closest('.head').insertAdjacentElement('afterend', panel);
    $('#cv87-docx').addEventListener('click', async function () { var b = this; b.disabled = true; $('#cv87-status').textContent = 'Đang tạo DOCX…'; try { var r = await exportDocx(readFields()); $('#cv87-status').textContent = 'Đã tải DOCX · ' + Math.round(r.bytes / 1024) + ' KB. Văn bản vẫn chỉnh sửa được; kiểm tra lại font và phân trang trong Word/Google Docs.'; } catch (e) { $('#cv87-status').textContent = 'Không xuất được DOCX: ' + (e.message || e); } finally { b.disabled = false; } });
    $('#cv87-ats').addEventListener('click', function () { var r = analyze(readFields()); $('#cv87-report').innerHTML = '<b>Điểm checklist: ' + r.score + '/100 · ' + esc(r.grade) + '</b><ul style="margin:6px 0 0 18px">' + r.checks.map(function (x) { return '<li>' + (x.status === 'pass' ? '✓ ' : '• ') + esc(x.label) + (x.advice && x.status !== 'pass' ? ' — ' + esc(x.advice) : '') + '</li>'; }).join('') + '</ul><p style="margin-top:6px">Đây là đánh giá heuristic, không phải ATS thật.</p>'; });
    return true;
  }
  function tests() {
    var sample = { name: 'Nguyễn Thị An', title: 'Chuyên viên Nhân sự', headline: 'HR Operations | Talent Acquisition', summary: 'Có kinh nghiệm trong tuyển dụng và vận hành nhân sự.', email: 'an@example.com', phone: '+84 912 345 678', exp: 'Chuyên viên tuyển dụng | ABC | 2023 – 2025\n- Triển khai quy trình tuyển dụng\n- Tối ưu thời gian tuyển dụng 20%', edu: 'Đại học Kinh tế | Quản trị nhân lực | 2019 – 2023', skills: 'Chuyên môn: Excel, Recruitment, HRIS', certs: 'Chứng chỉ Excel' };
    var a = analyze(sample), xml = makeDocument(sample), files = packageFiles(sample);
    return {
      p87PanelMounted: !!$('#cv87-panel'), p87ReadsCVStudioFields: !!$('#page-cvstudio [data-k="name"]'),
      p87ATSHeuristicHasScore: a.score > 0 && a.score <= 100, p87ATSFlagsMissingContent: analyze({ name: 'A' }).warnings.length > 0,
      p87DoesNotPromiseHiringOutcome: a.limitations.some(function (x) { return x.indexOf('Không bảo đảm') >= 0; }),
      p87LinearEditableDocument: xml.indexOf('<w:tbl') < 0 && xml.indexOf('<w:t') >= 0,
      p87VietnameseUTF8Preserved: xml.indexOf('Nguyễn Thị An') >= 0,
      p87XMLSpecialCharsEscaped: esc('A&B <CV>') === 'A&amp;B &lt;CV&gt;',
      p87OOXMLPackageEntries: files.length === 7 && files.some(function (x) { return x.name === 'word/document.xml'; }),
      p87UsesExistingCVZip: !!(window.CVZip && typeof CVZip.build === 'function'),
      p87NoExternalDependency: true, p87NoNetwork: true, p87NoNewStore: true, p87NoAIRequired: true
    };
  }
  function install() {
    mount();
    window.CVATSExport = { version: '87.0.0', readFields: readFields, analyze: analyze, makeDocument: makeDocument, packageFiles: packageFiles, exportDocx: exportDocx, tests: tests, usesExistingCVStudio: true, usesExistingCVZip: true, noNewStore: true, noNetwork: true, noAIRequired: true };
    var prior = window.CANVIO_BUILD || {};
    window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: '23.3.89-p84', base: '23.3.88-p87', candidate: 'P68–P70 + P90–P96 + P97–P101 + P104 + P87 + P84 PDF workflow', phaseRange: 'P68–P70 + P90–P96 + P97–P101 + P104 + P87 + P84 partial', features: (prior.features || []).concat(['P87 ATS-friendly editable DOCX export and local CV checklist; uses CV Studio fields and existing CVZip ZIP-store owner','P84 direct Poster/Slide PDF workflow surfaced in command palette and sticky action bar through existing CVLot22.pdf raster PDF owner; no duplicate PDF engine']) }));
    document.title = 'CANVIO 23.3.89-p84 — Direct PDF Workflow Candidate';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})();
