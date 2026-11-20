/* P131 · Security hub (additive): credential-storage audit, strict allow-list SVG/HTML sanitizers,
   export redaction and SRI/CSP page audit. No network, no new store, no secret values in reports. */
(function () {
'use strict';
if (window.CANVIOSecurity) return;
var VERSION = '131.3.0';
var STRONG_NAME = /(api[-_. ]?key|secret|passw(?:or)?d|token|credential|service[-_.]?role|authorization|bearer)/i;
var WEAK_NAME = /(^|[-_.:])key$/i;
var KNOWN_SECRET_KEYS = ['canvio10:gemini_key', 'canvio18:google-font-key', 'canvio16:gh_tok'];
var SAFE_KEYS = /^canvio10:gemini_session$/;
var VALUE_PATTERNS = [
  ['Google API key', /AIza[0-9A-Za-z_-]{30,}/],
  ['Anthropic/OpenAI key', /\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/],
  ['Supabase token', /\bsb[ps]_[A-Za-z0-9]{30,}/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/]
];
var MASK = '[ĐÃ ẨN KHÓA]';

/* ---------- credential storage audit ---------- */
function valueKind(v) {
  v = String(v == null ? '' : v).slice(0, 2000000);
  for (var i = 0; i < VALUE_PATTERNS.length; i++) if (VALUE_PATTERNS[i][1].test(v)) return VALUE_PATTERNS[i][0];
  return '';
}
function plainSecret(v) { v = String(v == null ? '' : v).trim(); return v.length >= 16 && !/^[\[{]/.test(v) && !/\s/.test(v); }
function defaultStores() {
  var out = [];
  try { out.push(['local', window.localStorage]); } catch (e) {}
  try { out.push(['session', window.sessionStorage]); } catch (e) {}
  return out;
}
function scanStorage(stores) {
  var found = [], scanned = 0;
  (stores || defaultStores()).forEach(function (pair) {
    var name = pair[0], st = pair[1], n = 0;
    try { n = st.length; } catch (e) { return; }
    for (var i = 0; i < n && i < 5000; i++) {
      var k = null, v = null;
      try { k = st.key(i); v = st.getItem(k); } catch (e) { continue; }
      if (k == null || v == null) continue;
      scanned++;
      if (SAFE_KEYS.test(k)) continue;
      var kind = valueKind(v), strong = STRONG_NAME.test(k) && plainSecret(v), weak = !strong && WEAK_NAME.test(k) && plainSecret(v) && v.length >= 24;
      var known = KNOWN_SECRET_KEYS.indexOf(k) >= 0 && String(v).length > 0;
      if (!kind && !strong && !weak && !known) continue;
      found.push({ store: name, key: k, reason: kind ? 'pattern:' + kind : (known ? 'known' : (strong ? 'name' : 'weak-name')), length: String(v).length, migratable: name === 'local' && (!!kind || strong || known) });
    }
  });
  return { scanned: scanned, found: found, localSecrets: found.filter(function (f) { return f.store === 'local'; }).length };
}
function migrateToSession(report, stores) {
  var r = report || scanStorage(stores), local = null, session = null, moved = [], failed = [];
  if (stores) { local = stores[0][1]; session = stores[1][1]; } else { try { local = window.localStorage; session = window.sessionStorage; } catch (e) { return { moved: moved, failed: ['storage'] }; } }
  r.found.forEach(function (f) {
    if (!f.migratable || f.store !== 'local') return;
    try { var v = local.getItem(f.key); if (v == null) return; session.setItem(f.key, v); local.removeItem(f.key); moved.push(f.key); } catch (e) { failed.push(f.key); }
  });
  if (moved.indexOf('canvio10:gemini_key') >= 0) { try { local.setItem('canvio10:gemini_session', '1'); } catch (e) {} }
  return { moved: moved, failed: failed };
}
function redact(text) {
  var n = 0, t = String(text == null ? '' : text);
  VALUE_PATTERNS.forEach(function (p) { t = t.replace(new RegExp(p[1].source, 'g'), function () { n++; return MASK; }); });
  return { text: t, count: n };
}
function hasSecret(text) { return !!valueKind(text); }

/* ---------- URL / CSS helpers ---------- */
function squash(v) { return String(v == null ? '' : v).replace(/[\u0000-\u0020\u007f-\u009f\u200b-\u200f\u2028\u2029\ufeff]+/g, '').toLowerCase(); }
var RASTER = /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+\/=]+$/;
function svgUrlSafe(v) { var s = squash(v); return !s || s.charAt(0) === '#' || RASTER.test(s); }
function htmlUrlSafe(v, forSrc) {
  var s = squash(v);
  if (!s || s.charAt(0) === '#' || s.charAt(0) === '/' || s.charAt(0) === '.') return s.indexOf('//') === 0 ? false : true;
  var m = s.match(/^([a-z][a-z0-9+.\-]*):/);
  if (!m) return true;
  if (m[1] === 'http' || m[1] === 'https') return true;
  if (!forSrc && (m[1] === 'mailto' || m[1] === 'tel')) return true;
  return forSrc && m[1] === 'data' && RASTER.test(s);
}
function dangerousText(v) { return /javascript:|vbscript:|data:text\/html|data:image\/svg|expression\(|@import|<script|livescript:/.test(squash(v)); }
function cleanCss(css) {
  var x = String(css == null ? '' : css).replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\\[0-9a-fA-F]{1,6}/.test(x)) return '';
  x = x.replace(/@import[^;]*;?/gi, '');
  x = x.replace(/url\(\s*(['"]?)([\s\S]*?)\1\s*\)/gi, function (m, q, u) { return svgUrlSafe(u) ? m : 'none'; });
  if (/expression\s*\(|javascript:|vbscript:|-moz-binding|behavior\s*:/i.test(x.replace(/\s+/g, ''))) return '';
  return x;
}

/* ---------- SVG sanitizer (DOM based) ---------- */
var SVG_BLOCK = { script: 1, foreignobject: 1, iframe: 1, object: 1, embed: 1, audio: 1, video: 1, canvas: 1, link: 1, meta: 1, base: 1, handler: 1, listener: 1 };
function cleanSvgAttrs(el, stats) {
  Array.prototype.slice.call(el.attributes || []).forEach(function (a) {
    var n = a.name.toLowerCase(), v = a.value, drop = false;
    if (n.indexOf('on') === 0 || n === 'srcdoc') drop = true;
    else if (n === 'href' || n === 'xlink:href' || n === 'src') drop = !svgUrlSafe(v);
    else if (n === 'style') { var c = cleanCss(v); if (c !== v) { if (c) el.setAttribute(a.name, c); else drop = true; stats.attrs++; } }
    else if (dangerousText(v)) drop = true;
    if (drop) { el.removeAttribute(a.name); stats.attrs++; }
  });
}
function sanitizeSvg(raw, opts) {
  var max = (opts && opts.maxBytes) || 5 * 1024 * 1024, s = String(raw == null ? '' : raw);
  if (s.length > max) throw new Error('SVG vượt giới hạn kích thước.');
  if (!/^\s*(?:<\?xml[^>]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(s)) throw new Error('File không phải SVG hợp lệ.');
  if (/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(s)) throw new Error('SVG chứa khai báo DTD/ENTITY nên bị từ chối.');
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') throw new Error('Không thể xác thực SVG an toàn trong môi trường hiện tại.');
  var doc = new DOMParser().parseFromString(s, 'image/svg+xml'), root = doc.documentElement;
  if (!root || String(root.localName).toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) throw new Error('Không phân tích được SVG.');
  var stats = { elements: 0, attrs: 0 }, all = Array.prototype.slice.call(root.getElementsByTagName('*'));
  all.forEach(function (el) {
    if (!root.contains(el)) return;
    var ln = String(el.localName || '').toLowerCase();
    if (SVG_BLOCK[ln]) { el.parentNode.removeChild(el); stats.elements++; return; }
    if (ln === 'style') { var c = cleanCss(el.textContent); if (c !== el.textContent) stats.attrs++; el.textContent = c; return; }
    if (ln === 'set' || ln === 'animate' || ln === 'animatetransform' || ln === 'animatemotion') {
      var an = String(el.getAttribute('attributeName') || '').toLowerCase();
      if (/^(?:xlink:)?href$/.test(an) || an.indexOf('on') === 0 || an === 'style') { el.parentNode.removeChild(el); stats.elements++; return; }
    }
    cleanSvgAttrs(el, stats);
  });
  cleanSvgAttrs(root, stats);
  return { svg: new XMLSerializer().serializeToString(root), removed: stats };
}

/* ---------- HTML sanitizer (DOM allow-list) ---------- */
function words(s) { var o = {}; s.split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; }
var HTML_TAGS = words('a abbr address article aside b bdi bdo blockquote br button caption cite code col colgroup dd del details dfn div dl dt em figcaption figure footer h1 h2 h3 h4 h5 h6 header hgroup hr i img ins kbd li main mark nav ol p picture pre q rp rt ruby s samp section small source span strong sub summary sup table tbody td tfoot th thead time tr u ul var wbr');
var HTML_DROP = words('script style iframe frame frameset object embed applet noscript template textarea select option form input dialog link meta base title head audio video canvas math');
var SVG_OK = words('svg g path circle rect line polyline polygon ellipse text tspan defs lineargradient radialgradient stop use title desc clippath mask symbol');
var HTML_ATTRS = words('class id title lang dir role hidden alt width height loading colspan rowspan scope headers datetime href src target rel type name');
function sanitizeHtml(raw, opts) {
  var max = (opts && opts.maxBytes) || 5 * 1024 * 1024, s = String(raw == null ? '' : raw);
  if (s.length > max) throw new Error('HTML vượt giới hạn kích thước.');
  if (typeof DOMParser === 'undefined') throw new Error('Không thể xác thực HTML an toàn trong môi trường hiện tại.');
  var doc = new DOMParser().parseFromString('<!doctype html><body>' + s, 'text/html'), body = doc.body, stats = { elements: 0, attrs: 0 };
  (function walk(parent) {
    Array.prototype.slice.call(parent.childNodes).forEach(function (n) {
      if (n.nodeType === 8) { parent.removeChild(n); return; }
      if (n.nodeType !== 1) return;
      var ln = String(n.localName || '').toLowerCase(), svg = n.namespaceURI === 'http://www.w3.org/2000/svg';
      if (HTML_DROP[ln] || (svg && !SVG_OK[ln] && SVG_BLOCK[ln])) { parent.removeChild(n); stats.elements++; return; }
      if (svg) {
        if (!SVG_OK[ln]) { parent.removeChild(n); stats.elements++; return; }
        cleanSvgAttrs(n, stats); walk(n); return;
      }
      if (!HTML_TAGS[ln]) { walk(n); while (n.firstChild) parent.insertBefore(n.firstChild, n); parent.removeChild(n); stats.elements++; return; }
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        var an = a.name.toLowerCase(), v = a.value, ok = false;
        if (an === 'style') { var c = cleanCss(v); if (c) { n.setAttribute('style', c); ok = true; } }
        else if (an === 'href') ok = ln === 'a' && htmlUrlSafe(v, false);
        else if (an === 'src') ok = (ln === 'img' || ln === 'source') && htmlUrlSafe(v, true);
        else if (an === 'type') ok = ln === 'button' && /^(?:button|submit|reset)$/i.test(v);
        else if (an.indexOf('aria-') === 0 || an.indexOf('data-') === 0) ok = !/^data-.*on/.test(an) && !dangerousText(v);
        else ok = !!HTML_ATTRS[an] && an !== 'name' && !dangerousText(v);
        if (!ok) { n.removeAttribute(a.name); stats.attrs++; }
      });
      if (ln === 'a') { if (n.getAttribute('target')) n.setAttribute('rel', 'noopener noreferrer'); else n.removeAttribute('rel'); }
      if (ln === 'button' && !n.getAttribute('type')) n.setAttribute('type', 'button');
      walk(n);
    });
  })(body);
  return { html: body.innerHTML, removed: stats };
}

/* ---------- safe local HTML import into the existing Website Engine ---------- */
var MAX_HTML_IMPORT_BYTES = 5 * 1024 * 1024;
function utf8Bytes(value) {
  var x = String(value == null ? '' : value);
  try { return new TextEncoder().encode(x).length; } catch (e) { return x.length * 3; }
}
function prepareHtmlImport(raw, opts) {
  opts = opts || {};
  var max = Math.min(MAX_HTML_IMPORT_BYTES, Math.max(1, Number(opts.maxBytes) || MAX_HTML_IMPORT_BYTES));
  var source = String(raw == null ? '' : raw), bytes = utf8Bytes(source);
  if (!source.trim()) throw new Error('File HTML đang trống.');
  if (bytes > max) throw new Error('HTML vượt giới hạn 5 MiB; hãy rút gọn tệp trước khi nhập.');
  var safe = sanitizeHtml(source, { maxBytes: max });
  var doc = new DOMParser().parseFromString('<!doctype html><body>' + safe.html, 'text/html');
  var remoteSourcesRemoved = 0;
  Array.prototype.forEach.call(doc.body.querySelectorAll('img[src],source[src]'), function (node) {
    var value = String(node.getAttribute('src') || '').trim();
    if (!/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(squash(value))) {
      node.removeAttribute('src'); remoteSourcesRemoved++;
    }
  });
  var html = doc.body.innerHTML;
  if (!html.trim()) throw new Error('Không còn nội dung HTML an toàn để nhập.');
  return {
    html: html, bytes: bytes, insertedChars: html.length,
    removed: safe.removed || { elements: 0, attrs: 0 },
    remoteSourcesRemoved: remoteSourcesRemoved
  };
}
async function importHtmlText(raw, editor, opts) {
  opts = opts || {};
  var target = editor || window.CVWeb;
  if (!target || typeof target.addComponents !== 'function') throw new Error('Website Studio chưa sẵn sàng. Hãy mở Website Studio rồi thử lại.');
  var cv = window.CV, save = opts.save || (cv && cv.engines && cv.engines.web && cv.engines.web.save);
  if (typeof save !== 'function') throw new Error('Không tìm thấy bộ lưu Website Engine; từ chối nhập để tránh mất nội dung.');
  var prepared = prepareHtmlImport(raw, opts);
  if (!opts.confirmed && typeof window.confirm === 'function') {
    var accepted = window.confirm('Đã làm sạch HTML trước khi nhập. Script, form, iframe, CSS không an toàn và ảnh tải từ URL ngoài sẽ bị loại. Tiếp tục chèn vào Website Engine hiện tại?');
    if (!accepted) return { ok: false, cancelled: true, removed: prepared.removed, remoteSourcesRemoved: prepared.remoteSourcesRemoved };
  }
  var inserted = target.addComponents(prepared.html);
  if (inserted === false) throw new Error('Website Engine từ chối nội dung HTML đã làm sạch.');
  try {
    var saved = save.call(cv && cv.engines && cv.engines.web || target);
    if (saved && typeof saved.then === 'function') await saved;
    if (saved === false) throw new Error('Website Engine trả về trạng thái lưu thất bại.');
  } catch (e) {
    throw new Error('Nội dung đã được chèn trong phiên hiện tại nhưng lưu dự án thất bại; hãy hoàn tác trong Website Studio. ' + (e && e.message ? e.message : ''));
  }
  return {
    ok: true, bytes: prepared.bytes, insertedChars: prepared.insertedChars,
    removedElements: Number(prepared.removed.elements) || 0,
    removedAttributes: Number(prepared.removed.attrs) || 0,
    remoteSourcesRemoved: prepared.remoteSourcesRemoved,
    owner: 'CVWeb.addComponents / CV.engines.web.save', noNewStore: true
  };
}
var htmlPicker = null;
function chooseHtmlImport() {
  if (!window.CVWeb || typeof window.CVWeb.addComponents !== 'function' ||
      !window.CV || !CV.engines || !CV.engines.web || typeof CV.engines.web.save !== 'function') {
    toast('Hãy mở Website Studio trước khi nhập HTML an toàn.'); return false;
  }
  if (!htmlPicker) {
    htmlPicker = el('input'); htmlPicker.type = 'file'; htmlPicker.accept = '.html,.htm,text/html,application/xhtml+xml';
    htmlPicker.id = 'cv131-html-file'; htmlPicker.hidden = true;
    htmlPicker.addEventListener('change', async function () {
      var file = htmlPicker.files && htmlPicker.files[0]; if (!file) return;
      var name = String(file.name || '').toLowerCase(), type = String(file.type || '').toLowerCase();
      if (!/\.html?$/.test(name) || (type && type !== 'text/html' && type !== 'application/xhtml+xml')) {
        toast('Chỉ nhận tệp .html hoặc .htm.'); htmlPicker.value = ''; return;
      }
      if (Number(file.size) > MAX_HTML_IMPORT_BYTES) {
        toast('HTML vượt giới hạn 5 MiB.'); htmlPicker.value = ''; return;
      }
      try {
        var raw = await file.text();
        var result = await importHtmlText(raw, window.CVWeb, { sourceName: file.name });
        if (result.cancelled) toast('Đã hủy nhập HTML.');
        else toast('Đã nhập HTML an toàn: ' + result.insertedChars + ' ký tự; loại ' +
          (result.removedElements + result.removedAttributes) + ' thành phần/thuộc tính nguy hiểm và ' +
          result.remoteSourcesRemoved + ' ảnh ngoài.');
      } catch (e) { toast('Không thể nhập HTML: ' + (e && e.message ? e.message : 'lỗi không xác định')); }
      htmlPicker.value = '';
    });
    document.body.appendChild(htmlPicker);
  }
  htmlPicker.click(); return true;
}

/* ---------- page audit and report ---------- */
function auditPage(doc) {
  doc = doc || document;
  var out = { externalNoIntegrity: [], inlineHandlers: 0, cspMeta: false, secureContext: !!window.isSecureContext, nodes: 0 };
  try {
    Array.prototype.forEach.call(doc.querySelectorAll('script[src],link[rel~="stylesheet"][href]'), function (el) {
      try { var u = new URL(el.src || el.href, doc.baseURI || window.location.href); if (u.origin !== window.location.origin && !el.hasAttribute('integrity')) out.externalNoIntegrity.push(u.href); } catch (e) {}
    });
  } catch (e) {}
  try {
    var els = doc.getElementsByTagName('*'); out.nodes = els.length;
    for (var i = 0; i < els.length && i < 30000; i++) {
      var at = els[i].attributes;
      for (var j = 0; j < at.length; j++) { var nm = at[j].name; if (nm.length > 2 && nm.charCodeAt(0) === 111 && nm.charCodeAt(1) === 110) { out.inlineHandlers++; break; } }
    }
  } catch (e) {}
  try { out.cspMeta = !!doc.querySelector('meta[http-equiv="Content-Security-Policy"]'); } catch (e) {}
  return out;
}
function report(stores, doc) {
  var st = scanStorage(stores), pg = auditPage(doc), checks = [];
  checks.push({ id: 'storage-local', level: st.localSecrets ? 'fail' : 'pass', label: 'Khóa/token không nằm trong localStorage', detail: st.localSecrets ? st.localSecrets + ' mục cần chuyển sang bộ nhớ phiên' : 'Không thấy khóa nào (đã quét ' + st.scanned + ' mục)' });
  checks.push({ id: 'sri', level: pg.externalNoIntegrity.length ? 'warn' : 'pass', label: 'Tài nguyên ngoài có SRI', detail: pg.externalNoIntegrity.length ? pg.externalNoIntegrity.length + ' tài nguyên ngoài chưa có integrity (phông Google không dùng được SRI)' : 'Không có tài nguyên ngoài thiếu integrity' });
  checks.push({ id: 'csp', level: pg.cspMeta ? 'pass' : 'warn', label: 'Có CSP trong trang', detail: pg.cspMeta ? 'Có thẻ meta CSP' : 'Chưa có meta CSP; hãy đặt tiêu đề CSP ở máy chủ khi xuất bản' });
  checks.push({ id: 'secure', level: pg.secureContext ? 'pass' : 'warn', label: 'Chạy ở ngữ cảnh an toàn (HTTPS/localhost)', detail: pg.secureContext ? 'Có' : 'Không; một số API bảo mật sẽ không dùng được' });
  var worst = checks.some(function (c) { return c.level === 'fail'; }) ? 'fail' : (checks.some(function (c) { return c.level === 'warn'; }) ? 'warn' : 'pass');
  return { format: 'CANVIO_SECURITY_REPORT', version: VERSION, createdAt: new Date().toISOString(), status: worst, storage: st, page: pg, checks: checks, note: 'Báo cáo không chứa giá trị khóa; chỉ tên mục, độ dài và loại.' };
}

/* ---------- UI ---------- */
var dlg = null, lastFocus = null;
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function closePanel() { if (!dlg) return; dlg.hidden = true; try { if (lastFocus && lastFocus.focus) lastFocus.focus(); } catch (e) {} }
function toast(m) { try { window.CV.toast(m); } catch (e) {} }
function render() {
  var r = report(), body = dlg.querySelector('.cv131-body'), foot = dlg.querySelector('.cv131-foot');
  body.textContent = ''; foot.textContent = '';
  var head = el('p', 'cv131-sum cv131-' + r.status, r.status === 'pass' ? 'Đạt: không phát hiện vấn đề cần xử lý.' : (r.status === 'fail' ? 'Cần xử lý: có khóa lưu lâu dài trên máy.' : 'Có cảnh báo cần theo dõi.'));
  body.appendChild(head);
  var ul = el('ul', 'cv131-list');
  r.checks.forEach(function (c) { var li = el('li', 'cv131-item cv131-' + c.level); li.appendChild(el('b', null, (c.level === 'pass' ? 'Đạt · ' : c.level === 'warn' ? 'Lưu ý · ' : 'Lỗi · ') + c.label)); li.appendChild(el('span', null, c.detail)); ul.appendChild(li); });
  body.appendChild(ul);
  if (r.storage.found.length) {
    body.appendChild(el('p', 'cv131-sub', 'Mục nghi là khóa (không hiển thị giá trị):'));
    var l2 = el('ul', 'cv131-list');
    r.storage.found.slice(0, 20).forEach(function (f) { l2.appendChild(el('li', 'cv131-key', f.key + ' · ' + f.store + ' · ' + f.length + ' ký tự' + (f.migratable ? '' : ' · kiểm tra thủ công'))); });
    body.appendChild(l2);
  }
  var mig = r.storage.found.filter(function (f) { return f.migratable; }).length;
  if (mig) {
    var b = el('button', 'cv131-btn cv131-primary', 'Chuyển ' + mig + ' khóa sang bộ nhớ phiên'); b.type = 'button';
    b.onclick = function () {
      if (!window.confirm('Khóa sẽ chỉ còn trong tab này và mất khi đóng trình duyệt; bạn cần nhập lại lần sau. Tiếp tục?')) return;
      var res = migrateToSession(); toast('Đã chuyển ' + res.moved.length + ' khóa sang bộ nhớ phiên' + (res.failed.length ? ' (lỗi ' + res.failed.length + ')' : '')); render();
    };
    foot.appendChild(b);
  }
  var cp = el('button', 'cv131-btn', 'Sao chép báo cáo'); cp.type = 'button';
  cp.onclick = function () { var t = JSON.stringify(report(), null, 2); try { navigator.clipboard.writeText(t).then(function () { toast('Đã sao chép báo cáo'); }, function () { toast('Không sao chép được'); }); } catch (e) { toast('Không sao chép được'); } };
  var cl = el('button', 'cv131-btn', 'Đóng'); cl.type = 'button'; cl.onclick = closePanel;
  foot.appendChild(cp); foot.appendChild(cl);
  var first = dlg.querySelector('.cv131-btn'); if (first && !dlg.contains(document.activeElement)) first.focus();
}
function openPanel() {
  if (!dlg) {
    dlg = el('div', 'cv131-overlay'); dlg.id = 'cv131-security'; dlg.hidden = true;
    dlg.innerHTML = '<div class="cv131-card" role="dialog" aria-modal="true" aria-labelledby="cv131-title"><h2 id="cv131-title">Kiểm tra bảo mật</h2><div class="cv131-body"></div><div class="cv131-foot"></div></div>';
    dlg.addEventListener('mousedown', function (e) { if (e.target === dlg) closePanel(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); closePanel(); return; }
      if (e.key !== 'Tab') return;
      var bs = Array.prototype.slice.call(dlg.querySelectorAll('button')); if (!bs.length) return;
      var i = bs.indexOf(document.activeElement), last = bs.length - 1;
      if (e.shiftKey && i <= 0) { e.preventDefault(); bs[last].focus(); } else if (!e.shiftKey && i === last) { e.preventDefault(); bs[0].focus(); }
    });
    document.body.appendChild(dlg);
  }
  lastFocus = document.activeElement; render(); dlg.hidden = false;
  var f = dlg.querySelector('.cv131-btn'); if (f) f.focus();
}
function installPalette(tries) {
  var cv = window.CV;
  if (cv && cv.palette && typeof cv.palette.build === 'function') {
    if (cv.palette.build.__p131) return;
    var orig = cv.palette.build;
    cv.palette.build = function () {
      var items = orig.apply(this, arguments) || [];
      if (!items.some(function (x) { return x && x.label === 'Kiểm tra bảo mật · khóa API'; })) items.push({ label: 'Kiểm tra bảo mật · khóa API', hint: 'bao mat security api key token sri csp khoa', icon: '◆', run: openPanel });
      if (!items.some(function (x) { return x && x.label === 'Nhập HTML an toàn · Website Studio'; })) items.push({ label: 'Nhập HTML an toàn · Website Studio', hint: 'html htm import nhap website sanitize clean', icon: '⇧', run: chooseHtmlImport });
      return items;
    };
    cv.palette.build.__p131 = true; return;
  }
  if ((tries || 0) < 40) setTimeout(function () { installPalette((tries || 0) + 1); }, 500);
}
function mountLink() {
  var input = document.getElementById('geminiKey');
  if (!input || !input.parentNode || document.getElementById('cv131-open')) return !!document.getElementById('cv131-open');
  var b = el('button', 'cv131-link', 'Kiểm tra bảo mật khóa'); b.id = 'cv131-open'; b.type = 'button'; b.onclick = openPanel;
  input.parentNode.appendChild(b); return true;
}
function ready() { try { mountLink(); installPalette(0); } catch (e) { try { console.warn('P131 UI:', e && e.message); } catch (x) {} } }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();

/* ---------- self tests ---------- */
function fakeStore(obj) { var d = Object.assign({}, obj); return { get length() { return Object.keys(d).length; }, key: function (i) { return Object.keys(d)[i] || null; }, getItem: function (k) { return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null; }, setItem: function (k, v) { d[k] = String(v); }, removeItem: function (k) { delete d[k]; }, _d: d }; }
function tests() {
  var gk = 'AIza' + new Array(36).join('x'), local = fakeStore({ 'canvio10:gemini_key': gk, 'canvio5:design': '{"a":1}', 'canvio10:gemini_session': '1', 'x:note': 'hello world' }), sess = fakeStore({}), stores = [['local', local], ['session', sess]];
  var r = scanStorage(stores), mig = migrateToSession(r, stores), after = scanStorage(stores), red = redact('key=' + gk + ' ok'), flags = {
    detectsGeminiKey: r.found.length === 1 && r.found[0].key === 'canvio10:gemini_key' && r.found[0].migratable === true,
    ignoresProjectJsonAndSessionFlag: r.found.every(function (f) { return f.key === 'canvio10:gemini_key'; }),
    reportHasNoSecretValue: JSON.stringify(r).indexOf(gk) < 0,
    migrateMovesToSession: mig.moved.length === 1 && sess.getItem('canvio10:gemini_key') === gk && local.getItem('canvio10:gemini_key') === null,
    migrateSetsSessionFlag: local.getItem('canvio10:gemini_session') === '1',
    cleanAfterMigration: after.localSecrets === 0,
    redactsExportText: red.count === 1 && red.text.indexOf(gk) < 0 && red.text.indexOf(MASK) >= 0,
    detectsGithubToken: hasSecret('ghp_' + new Array(37).join('a')),
    plainTextNotSecret: !hasSecret('Xin chào CANVIO, đây là dự án thiết kế')
  };
  if (typeof DOMParser !== 'undefined' && typeof XMLSerializer !== 'undefined') {
    var evil = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" onload="alert(1)"><script>alert(1)<\/script><foreignObject><div/></foreignObject><a xlink:href="javascript:alert(1)"><rect width="9" height="9"/></a><set attributeName="href" to="javascript:alert(1)"/><style>@import url(http://evil.test/x.css);.a{fill:red}</style><rect style="fill:url(http://evil.test/p)" width="5" height="5"/><image href="data:image/png;base64,AAAA"/></svg>';
    var o = sanitizeSvg(evil).svg, ok = false;
    try { sanitizeSvg('<!DOCTYPE svg [<!ENTITY a "b">]><svg xmlns="http://www.w3.org/2000/svg"/>'); } catch (e) { ok = true; }
    flags.svgRemovesActiveContent = !/<script|foreignObject|onload|javascript:|<set|evil\.test|@import/i.test(o);
    flags.svgKeepsSafeShapes = /<rect/.test(o) && /data:image\/png/.test(o);
    flags.svgRejectsEntity = ok;
    var h = sanitizeHtml('<p onclick="x()">Chào<script>alert(1)<\/script><a href="javascript:alert(1)">x</a><a href="https://ok.test" target="_blank">y</a><img src="x" onerror="alert(1)"><iframe src="//e"></iframe><form><input></form><b style="background:url(javascript:alert(1))">B</b></p>').html;
    flags.htmlRemovesActiveContent = !/<script|onclick|onerror|javascript:|<iframe|<form|<input/i.test(h);
    flags.htmlKeepsSafeContent = /Chào/.test(h) && /href="https:\/\/ok\.test"/.test(h) && /rel="noopener noreferrer"/.test(h);
  }
  return flags;
}

window.CANVIOSecurity = { version: VERSION, scanStorage: scanStorage, migrateToSession: migrateToSession, redact: redact, hasSecret: hasSecret, sanitizeSvg: sanitizeSvg, sanitizeHtml: sanitizeHtml, prepareHtmlImport: prepareHtmlImport, importHtmlText: importHtmlText, chooseHtmlImport: chooseHtmlImport, cleanCss: cleanCss, auditPage: auditPage, report: report, open: openPanel, tests: tests };
})();
