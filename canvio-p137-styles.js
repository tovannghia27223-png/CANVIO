/* P137 · Kiểu đoạn dùng lại được + mục lục tự động cho Layout Foundry (dàn trang).
   Kiểu đoạn: gán tên kiểu (Tiêu đề 1/2, Thân bài, Trích dẫn, Chú thích) cho đoạn đang chọn; sửa định nghĩa kiểu thì cập nhật mọi đoạn mang kiểu đó ở mọi trang. Mục lục: gom Tiêu đề 1-3 (thẻ h1-h3 hoặc kiểu Tiêu đề) từ mọi trang, kèm số trang thật của tài liệu, chèn/làm mới ở đầu trang 1. Có Hoàn tác một bước.
   Không làm: luồng chữ nhiều khung, kiểu ký tự lồng, bảng nâng cao (Layout Foundry đã có chèn bảng), số trang theo in thật (số trang = thứ tự trang của tài liệu, không phải số trang vật lý sau khi in). Định nghĩa kiểu lưu trong localStorage (tiện ích giao diện), không nằm trong tệp xuất. */
(function () {
'use strict';
if (window.CVStylesP137) return;
var KEY = 'canvio137:styles', ATTR = 'data-cv137-style', TOC = 'data-cv137-toc', BLOCK = 'P,H1,H2,H3,H4,H5,H6,LI,BLOCKQUOTE';
var DEFAULTS = {
  'Tiêu đề 1': { fontSize: '30px', fontWeight: '800', lineHeight: '1.2', margin: '0 0 12px', level: 1 },
  'Tiêu đề 2': { fontSize: '22px', fontWeight: '700', lineHeight: '1.25', margin: '16px 0 8px', level: 2 },
  'Thân bài': { fontSize: '15px', fontWeight: '400', lineHeight: '1.65', margin: '0 0 10px' },
  'Trích dẫn': { fontSize: '17px', fontStyle: 'italic', lineHeight: '1.55', margin: '14px 0', paddingLeft: '14px', borderLeft: '3px solid currentColor' },
  'Chú thích': { fontSize: '12px', fontWeight: '400', lineHeight: '1.4', margin: '4px 0', opacity: '0.75' }
};
var CHAR_KEY = 'canvio137:char-styles', CHAR_ATTR = 'data-cv137-char', TABLE_ATTR = 'data-cv137-table';
var CHAR_DEFAULTS = {
  'Đậm': { fontWeight: '700' },
  'Nghiêng': { fontStyle: 'italic' },
  'Tô sáng': { backgroundColor: '#fff3b0', color: '#1f2937', padding: '1px 3px', borderRadius: '3px' },
  'Mã': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', backgroundColor: '#f3f4f6', padding: '1px 4px', borderRadius: '4px' },
  'Nhỏ hoa': { fontVariant: 'small-caps', letterSpacing: '.02em' }
};
var TABLE_DEFAULTS = {
  'Lưới': { table: { borderCollapse: 'collapse', width: '100%' }, cell: { border: '1px solid #cbd5e1', padding: '8px 10px' }, head: { backgroundColor: '#eff6ff', fontWeight: '700', color: '#1e3a8a' } },
  'Báo cáo': { table: { borderCollapse: 'collapse', width: '100%' }, cell: { borderBottom: '1px solid #e2e8f0', padding: '8px 10px' }, head: { borderBottom: '2px solid #64748b', fontWeight: '700' } },
  'Tối giản': { table: { borderCollapse: 'separate', borderSpacing: '0 4px', width: '100%' }, cell: { padding: '7px 10px' }, head: { backgroundColor: '#f8fafc', fontWeight: '700' } }
};
var CHAR_OK_PROP = /^(fontWeight|fontStyle|backgroundColor|color|fontFamily|fontVariant|textDecoration|padding|borderRadius|letterSpacing)$/;
function cleanChar(def) {
  var out = {};
  Object.keys(def || {}).forEach(function (k) {
    if (!CHAR_OK_PROP.test(k)) return;
    var v = String(def[k]);
    if (v.length > 80 || /[;{}<>]|url\s*\(|expression|javascript/i.test(v)) return;
    out[k] = v;
  });
  return out;
}
function loadChar() {
  var out = {}, saved = null;
  Object.keys(CHAR_DEFAULTS).forEach(function (k) { out[k] = Object.assign({}, CHAR_DEFAULTS[k]); });
  try { saved = JSON.parse(localStorage.getItem(CHAR_KEY) || 'null'); } catch (e) {}
  if (saved && typeof saved === 'object') Object.keys(saved).forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(CHAR_DEFAULTS, k)) {
      var c = cleanChar(saved[k]);
      if (Object.keys(c).length) out[k] = c;
    }
  });
  return out;
}
function setCss(el, def, allowed) {
  if (!el || !el.style) return;
  allowed.forEach(function (k) { el.style.removeProperty(kebab(k)); });
  Object.keys(def || {}).forEach(function (k) { if (allowed.indexOf(k) >= 0) el.style.setProperty(kebab(k), def[k]); });
}
var TABLE_KEYS = { table: ['borderCollapse', 'borderSpacing', 'width'], cell: ['border', 'borderBottom', 'padding', 'textAlign'], head: ['border', 'borderBottom', 'padding', 'backgroundColor', 'fontWeight', 'color', 'textAlign'] };
var CHAR_KEYS = ['fontWeight', 'fontStyle', 'backgroundColor', 'color', 'fontFamily', 'fontVariant', 'textDecoration', 'padding', 'borderRadius', 'letterSpacing'];
function applyCharDef(el, def) { setCss(el, cleanChar(def), CHAR_KEYS); }
function nearestBlock(node, root) {
  while (node && node !== root) {
    if (node.nodeType === 1 && BLOCK.split(',').indexOf(node.tagName) >= 0) return node;
    node = node.parentNode;
  }
  return null;
}
function applyCharacterStyle(name, root, styles) {
  root = root || document.getElementById('lfDoc');
  styles = styles || loadChar();
  var def = styles[name], sel = window.getSelection && getSelection();
  if (!root || !def || !sel || !sel.rangeCount) return 0;
  var range = sel.getRangeAt(0).cloneRange();
  if (range.collapsed || !root.contains(range.startContainer) || !root.contains(range.endContainer)) return 0;
  var a = nearestBlock(range.startContainer, root), b = nearestBlock(range.endContainer, root);
  if (!a || a !== b) return 0;
  var fragment = range.extractContents();
  if (!String(fragment.textContent || '').trim()) return 0;
  var span = document.createElement('span');
  span.setAttribute(CHAR_ATTR, name);
  applyCharDef(span, def);
  span.appendChild(fragment);
  range.insertNode(span);
  sel.removeAllRanges();
  var next = document.createRange(); next.selectNodeContents(span); sel.addRange(next);
  root.dispatchEvent(new Event('input', { bubbles: true }));
  return 1;
}
function applyTableDef(table, name) {
  var preset = TABLE_DEFAULTS[name];
  if (!table || !preset) return false;
  table.setAttribute(TABLE_ATTR, name);
  setCss(table, preset.table, TABLE_KEYS.table);
  Array.prototype.forEach.call(table.querySelectorAll('td,th'), function (cell) { setCss(cell, preset.cell, TABLE_KEYS.cell); });
  var heads = table.querySelectorAll('thead th');
  if (!heads.length && table.rows && table.rows.length) heads = table.rows[0].querySelectorAll('th,td');
  Array.prototype.forEach.call(heads, function (cell) { setCss(cell, preset.head, TABLE_KEYS.head); });
  return true;
}
function applyTableStyle(name, root) {
  root = root || document.getElementById('lfDoc');
  var sel = window.getSelection && getSelection(), node = sel && sel.anchorNode;
  node = node && (node.nodeType === 1 ? node : node.parentElement);
  var table = node && node.closest && node.closest('table');
  if (!table && sel && sel.rangeCount) {
    node = sel.getRangeAt(0).commonAncestorContainer;
    node = node && (node.nodeType === 1 ? node : node.parentElement);
    table = node && node.closest && node.closest('table');
  }
  if (!root || !table || !root.contains(table) || !applyTableDef(table, name)) return 0;
  root.dispatchEvent(new Event('input', { bubbles: true }));
  return 1;
}
function restyleCharacterHtml(html, styles) {
  var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html'), n = 0;
  styles = styles || loadChar();
  Array.prototype.forEach.call(doc.body.querySelectorAll('[' + CHAR_ATTR + ']'), function (el) {
    var def = styles[el.getAttribute(CHAR_ATTR)];
    if (def) { applyCharDef(el, def); n++; }
  });
  return { html: doc.body.innerHTML, n: n };
}
function restyleTableHtml(html) {
  var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html'), n = 0;
  Array.prototype.forEach.call(doc.body.querySelectorAll('table[' + TABLE_ATTR + ']'), function (table) {
    if (applyTableDef(table, table.getAttribute(TABLE_ATTR))) n++;
  });
  return { html: doc.body.innerHTML, n: n };
}

var OK_PROP = /^(fontSize|fontWeight|fontStyle|lineHeight|letterSpacing|textAlign|color|margin|marginTop|marginBottom|paddingLeft|borderLeft|opacity|textTransform|level)$/;
function clean(def) { var o = {}, k; for (k in (def || {})) { if (!OK_PROP.test(k)) continue; var v = String(def[k]); if (k === 'level') { var n = Number(v); if (n >= 1 && n <= 3) o.level = n; continue; } if (/[;{}<>]|url\(|expression|javascript/i.test(v) || v.length > 60) continue; o[k] = v; } return o; }
function load() { var s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {} var out = {}, k; for (k in DEFAULTS) out[k] = Object.assign({}, DEFAULTS[k]); if (s && typeof s === 'object') for (k in s) { if (/^[\wÀ-ỹ \-]{1,30}$/.test(k)) { var c = clean(s[k]); if (Object.keys(c).length) out[k] = c; } } return out; }
function save(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
function kebab(k) { return k.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); }); }
function cssKeys(def) { return Object.keys(def).filter(function (k) { return k !== 'level'; }); }
function applyDef(el, def, old) { if (old) cssKeys(old).forEach(function (k) { el.style.removeProperty(kebab(k)); }); cssKeys(def).forEach(function (k) { el.style.setProperty(kebab(k), def[k]); }); }
function blocksIn(root, range) { var all = Array.prototype.slice.call(root.querySelectorAll(BLOCK)); if (!range) return []; return all.filter(function (b) { try { return range.intersectsNode(b) && !(b.querySelector && b.querySelector(BLOCK) && b.tagName === 'LI' && false); } catch (e) { return false; } }); }
function styleBlocks(root, names, st) { return Array.prototype.slice.call(root.querySelectorAll('[' + ATTR + ']')); }
function applyToSelection(name, st, root) {
  st = st || load(); root = root || document.getElementById('lfDoc'); var def = st[name]; if (!def || !root) return 0;
  var sel = window.getSelection && getSelection(), n = 0; if (!sel || !sel.rangeCount) return 0; var r = sel.getRangeAt(0); if (!root.contains(r.commonAncestorContainer)) return 0;
  var bl = blocksIn(root, r); if (!bl.length) { var a = r.commonAncestorContainer; a = a.nodeType === 1 ? a : a.parentElement; var c = a && a.closest && a.closest(BLOCK); if (c && root.contains(c)) bl = [c]; }
  bl.forEach(function (b) { var oldName = b.getAttribute(ATTR), old = oldName && st[oldName]; applyDef(b, def, old); b.setAttribute(ATTR, name); n++; });
  if (n) root.dispatchEvent(new Event('input', { bubbles: true })); return n;
}
function restyleHtml(html, st) {
  var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html'), n = 0;
  Array.prototype.forEach.call(doc.body.querySelectorAll('[' + ATTR + ']'), function (el) { var def = st[el.getAttribute(ATTR)]; if (def) { applyDef(el, def, def); n++; } });
  var chars = loadChar();
  Array.prototype.forEach.call(doc.body.querySelectorAll('[' + CHAR_ATTR + ']'), function (el) { var def = chars[el.getAttribute(CHAR_ATTR)]; if (def) { applyCharDef(el, def); n++; } });
  Array.prototype.forEach.call(doc.body.querySelectorAll('table[' + TABLE_ATTR + ']'), function (table) { if (applyTableDef(table, table.getAttribute(TABLE_ATTR))) n++; });
  return { html: doc.body.innerHTML, n: n };
}
function entriesFrom(pages) {
  var out = []; pages.forEach(function (p, i) { var doc = new DOMParser().parseFromString('<body>' + (p.html || '') + '</body>', 'text/html'), st = load(); Array.prototype.forEach.call(doc.body.querySelectorAll('h1,h2,h3,[' + ATTR + ']'), function (el) { if (el.closest('[' + TOC + ']')) return; var lvl = 0, s = el.getAttribute(ATTR), d = s && st[s]; if (d && d.level) lvl = d.level; else if (/^H[1-3]$/.test(el.tagName)) lvl = Number(el.tagName[1]); if (!lvl) return; var t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90); if (t) out.push({ text: t, level: lvl, page: i + 1 }); }); });
  return out;
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function tocHtml(entries, title) {
  var rows = entries.map(function (e) { return '<div style="display:flex;gap:6px;align-items:baseline;margin:' + (e.level === 1 ? '8px 0 2px' : '2px 0') + ';padding-left:' + ((e.level - 1) * 16) + 'px;font-weight:' + (e.level === 1 ? '700' : '400') + '"><span>' + esc(e.text) + '</span><span style="flex:1;border-bottom:1px dotted currentColor;opacity:.4;transform:translateY(-3px)"></span><span>' + e.page + '</span></div>'; }).join('');
  return '<div ' + TOC + '="1" contenteditable="false" style="margin:0 0 18px;padding:0 0 10px;border-bottom:1px solid rgba(0,0,0,.15)"><div style="font-size:20px;font-weight:800;margin-bottom:6px">' + esc(title || 'Mục lục') + '</div>' + (rows || '<div style="opacity:.6">Chưa có tiêu đề (dùng Tiêu đề 1–3 hoặc thẻ h1–h3).</div>') + '</div>';
}
function stripToc(html) { var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html'); Array.prototype.forEach.call(doc.body.querySelectorAll('[' + TOC + ']'), function (e) { e.remove(); }); return doc.body.innerHTML; }
function eng() { return window.CVNativeEngines && CVNativeEngines.layout; }
var undoSnap = null;
function snapshot() { var e = eng(); if (!e) throw new Error('Mở Dàn trang trước.'); var s = e.snapshotState(); return typeof s === 'string' ? JSON.parse(s) : s; }
function buildToc() { var s = snapshot(); undoSnap = JSON.stringify(s); var pages = s.pages.map(function (p) { return { id: p.id, html: stripToc(p.html || '') }; }), ent = entriesFrom(pages); pages[0].html = tocHtml(ent) + pages[0].html; var out = Object.assign({}, s, { pages: pages }); eng().restoreState(out); return ent.length; }
function restyleAll(st) { var s = snapshot(); undoSnap = JSON.stringify(s); var n = 0, pages = s.pages.map(function (p) { var r = restyleHtml(p.html || '', st); n += r.n; return Object.assign({}, p, { html: r.html }); }); eng().restoreState(Object.assign({}, s, { pages: pages })); return n; }
function flowLimit(d) { var sz = (document.getElementById('lfSize') || {}).value, r = { A4: 1.4142, Letter: 1.2941, square: 1, presentation: 0.5625 }[sz] || 1.4142; return Math.round(d.clientWidth * r); }
function splitPara(box, limit) {
  var p = box.lastElementChild; if (!p || p.tagName !== 'P' || p.children.length) return null;
  var words = (p.textContent || '').split(/(\s+)/).filter(function (w) { return w !== ''; }), toks = [], k;
  for (k = 0; k < words.length; k++) if (!/^\s+$/.test(words[k])) toks.push(k);
  if (toks.length < 2) return null;
  var lo = 0, hi = toks.length - 1, cut = function (n) { return words.slice(0, toks[n]).join('').replace(/\s+$/, ''); };
  var full = p.textContent;
  while (lo < hi) { var mid = (lo + hi + 1) >> 1; p.textContent = cut(mid); if (box.scrollHeight <= limit + 1) lo = mid; else hi = mid - 1; }
  if (lo < 1) { p.textContent = full; return null; }
  var head = cut(lo), rest = full.slice(head.length).replace(/^\s+/, ''), q = p.cloneNode(false); q.textContent = rest; p.textContent = head;
  return q.outerHTML;
}
function flowOverflow(box, limit) {
  var moved = [];
  while (box.children.length && box.scrollHeight > limit + 1) {
    var part = splitPara(box, limit); if (part) { moved.unshift(part); break; }
    if (box.children.length < 2) break;
    var last = box.lastElementChild; moved.unshift(last.outerHTML); last.remove();
  }
  return moved;
}
function flowPages(pages, active, d, limit) {
  var m = d.cloneNode(false); m.removeAttribute('id'); m.removeAttribute('contenteditable'); m.style.cssText += ';position:absolute;visibility:hidden;pointer-events:none;left:-9999px;top:0;width:' + d.clientWidth + 'px;min-height:0;height:auto;box-sizing:border-box'; d.parentNode.appendChild(m);
  var out = pages.map(function (p) { return Object.assign({}, p); }), moved = 0, i;
  try {
    for (i = active; i < out.length && i < active + 60; i++) {
      m.innerHTML = out[i].html || ''; var over = flowOverflow(m, limit); if (!over.length) continue;
      moved += over.length; out[i].html = m.innerHTML;
      if (i + 1 < out.length) out[i + 1].html = over.join('') + (out[i + 1].html || ''); else out.push({ id: 'p' + Date.now().toString(36) + i, html: over.join('') });
    }
  } finally { m.remove(); }
  return { pages: out, moved: moved };
}
function flowNext() { var d = document.getElementById('lfDoc'); if (!d) throw new Error('Mở Dàn trang trước.'); var s = snapshot(), a = s.active || 0, r = flowPages(s.pages, a, d, flowLimit(d)); if (!r.moved) return 0; undoSnap = JSON.stringify(s); eng().restoreState(Object.assign({}, s, { pages: r.pages, active: a })); return r.moved; }
function undo() { if (!undoSnap) return false; eng().restoreState(JSON.parse(undoSnap)); undoSnap = null; return true; }
function mount() {
  var page = document.getElementById('page-layoutFoundry'), bar = page && page.querySelector('.ne-toolbar'); if (!bar || page.querySelector('#cv137-row')) return false;
  var row = document.createElement('div'); row.id = 'cv137-row'; row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:6px 0';
  row.innerHTML = '<b class="tiny">Đoạn</b><select class="input" id="cv137-sel" aria-label="Kiểu đoạn" style="max-width:140px"></select><button type="button" class="btn btn-soft sm" id="cv137-apply">Áp dụng</button><button type="button" class="btn btn-ghost sm" id="cv137-redef">Cập nhật kiểu đoạn</button><b class="tiny">Ký tự</b><select class="input" id="cv137-char-sel" aria-label="Kiểu ký tự" style="max-width:120px"></select><button type="button" class="btn btn-ghost sm" id="cv137-char-apply">Áp dụng ký tự</button><b class="tiny">Bảng</b><select class="input" id="cv137-table-sel" aria-label="Kiểu bảng" style="max-width:115px"></select><button type="button" class="btn btn-ghost sm" id="cv137-table-apply">Áp dụng bảng</button><button type="button" class="btn btn-ghost sm" id="cv137-toc">Mục lục</button><button type="button" class="btn btn-soft sm" id="cv137-flow" title="Đẩy phần chữ tràn khỏi trang này sang các trang sau">Chảy sang trang sau</button><button type="button" class="btn btn-ghost sm" id="cv137-undo">Hoàn tác</button><span class="tiny" id="cv137-out" role="status" aria-live="polite">Kiểu đoạn, ký tự và bảng dùng chung trang hiện tại; Mục lục gom mọi trang.</span>';
  bar.parentNode.insertBefore(row, bar.nextSibling);
  var $ = function (s) { return row.querySelector(s); }, st = load(), sel = $('#cv137-sel'), out = $('#cv137-out'), lastRange = null;
  function fill() { sel.innerHTML = ''; Object.keys(st).forEach(function (k) { var o = document.createElement('option'); o.textContent = k; sel.appendChild(o); }); }
  fill();
  var charSel = $('#cv137-char-sel'), tableSel = $('#cv137-table-sel');
  Object.keys(loadChar()).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = k; charSel.appendChild(o); });
  Object.keys(TABLE_DEFAULTS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = k; tableSel.appendChild(o); });
  document.addEventListener('selectionchange', function () { var s = getSelection(), d = document.getElementById('lfDoc'); if (s && s.rangeCount && d && d.contains(s.anchorNode)) lastRange = s.getRangeAt(0).cloneRange(); });
  function restore() { var s = getSelection(); if (lastRange) { s.removeAllRanges(); s.addRange(lastRange); } }
  row.querySelectorAll('button').forEach(function (b) { b.addEventListener('mousedown', function (e) { e.preventDefault(); }); });
  $('#cv137-apply').addEventListener('click', function () { restore(); var n = applyToSelection(sel.value, st); out.textContent = n ? 'Đã áp "' + sel.value + '" cho ' + n + ' đoạn.' : 'Hãy đặt con trỏ/chọn văn bản trong trang trước.'; });
  $('#cv137-redef').addEventListener('click', function () { restore(); var s = getSelection(), a = s && s.anchorNode; a = a && (a.nodeType === 1 ? a : a.parentElement); var b = a && a.closest && a.closest(BLOCK); if (!b || !document.getElementById('lfDoc').contains(b)) { out.textContent = 'Đặt con trỏ vào một đoạn mẫu trước.'; return; } var nm = sel.value, cs = getComputedStyle(b), def = {}; cssKeys(st[nm]).forEach(function (k) { var v = b.style.getPropertyValue(kebab(k)) || (k in cs ? cs[k] : ''); if (v) def[k] = v; }); if (st[nm].level) def.level = st[nm].level; var c = clean(def); if (!Object.keys(c).length) { out.textContent = 'Không đọc được định dạng.'; return; } st[nm] = c; save(st); try { out.textContent = 'Đã cập nhật "' + nm + '" cho ' + restyleAll(st) + ' đoạn.'; } catch (e) { out.textContent = String(e.message || e); } });
  $('#cv137-char-apply').addEventListener('click', function () { restore(); var n = applyCharacterStyle(charSel.value); out.textContent = n ? 'Đã áp kiểu ký tự "' + charSel.value + '".' : 'Chọn một phần chữ trong cùng đoạn trước.'; });
  $('#cv137-table-apply').addEventListener('click', function () { restore(); var n = applyTableStyle(tableSel.value); out.textContent = n ? 'Đã áp kiểu bảng "' + tableSel.value + '".' : 'Đặt con trỏ bên trong một bảng trước.'; });
  $('#cv137-toc').addEventListener('click', function () { try { out.textContent = 'Mục lục: ' + buildToc() + ' mục.'; } catch (e) { out.textContent = String(e.message || e); } });
  $('#cv137-flow').addEventListener('click', function () { try { var n = flowNext(); out.textContent = n ? 'Đã chuyển ' + n + ' khối sang trang sau.' : 'Trang này chưa tràn.'; } catch (e) { out.textContent = String(e.message || e); } });
  $('#cv137-undo').addEventListener('click', function () { try { out.textContent = undo() ? 'Đã hoàn tác bước vừa rồi.' : 'Không có gì để hoàn tác.'; } catch (e) { out.textContent = String(e.message || e); } });
  return true;
}
function ready() { try { mount(); var p = document.getElementById('page-layoutFoundry'); if (p && !p.__cv137 && window.MutationObserver) { p.__cv137 = true; new MutationObserver(function () { if (!p.querySelector('#cv137-row')) mount(); }).observe(p, { childList: true, subtree: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function tests() {
  var d = clean({ fontSize: '20px', color: 'red;background:url(x)', evil: '1', level: '2', margin: 'url(javascript:1)' }), t = tocHtml([{ text: 'A <b>', level: 1, page: 1 }, { text: 'B', level: 2, page: 3 }]);
  return { characterStylePresets: Object.keys(CHAR_DEFAULTS).length === 5 && cleanChar({fontWeight:'700',backgroundColor:'url(x)',evil:'1'}).fontWeight === '700' && !('backgroundColor' in cleanChar({backgroundColor:'url(x)'})), tableStylePresets: Object.keys(TABLE_DEFAULTS).length === 3 && TABLE_DEFAULTS['Lưới'].table.borderCollapse === 'collapse' && TABLE_DEFAULTS['Báo cáo'].head.fontWeight === '700', defaultsHaveHeadings: DEFAULTS['Tiêu đề 1'].level === 1 && Object.keys(DEFAULTS).length === 5, cleanDropsUnsafe: d.fontSize === '20px' && d.level === 2 && !('evil' in d) && !('color' in d) && !('margin' in d), tocEscapes: t.indexOf('A &lt;b&gt;') > 0 && t.indexOf('<b>') < 0, tocHasPages: />3<\/span>/.test(t) && />1<\/span>/.test(t), tocEmptyMessage: tocHtml([]).indexOf('Chưa có tiêu đề') > 0, kebab: kebab('borderLeft') === 'border-left' && kebab('fontSize') === 'font-size' };
}
window.CVStylesP137 = { version: '137.4.0', DEFAULTS: DEFAULTS, CHAR_DEFAULTS: CHAR_DEFAULTS, TABLE_DEFAULTS: TABLE_DEFAULTS, load: load, clean: clean, loadChar: loadChar, cleanChar: cleanChar, applyCharacterStyle: applyCharacterStyle, applyTableStyle: applyTableStyle, restyleCharacterHtml: restyleCharacterHtml, restyleTableHtml: restyleTableHtml, applyToSelection: applyToSelection, restyleHtml: restyleHtml, entriesFrom: entriesFrom, tocHtml: tocHtml, stripToc: stripToc, buildToc: buildToc, flowLimit: flowLimit, flowOverflow: flowOverflow, flowPages: flowPages, flowNext: flowNext, restyleAll: restyleAll, undo: undo, mount: mount, tests: tests };
})();
