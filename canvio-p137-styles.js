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
function restyleHtml(html, st) { var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html'), n = 0; Array.prototype.forEach.call(doc.body.querySelectorAll('[' + ATTR + ']'), function (el) { var def = st[el.getAttribute(ATTR)]; if (def) { applyDef(el, def, def); n++; } }); return { html: doc.body.innerHTML, n: n }; }
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
function undo() { if (!undoSnap) return false; eng().restoreState(JSON.parse(undoSnap)); undoSnap = null; return true; }
function mount() {
  var page = document.getElementById('page-layoutFoundry'), bar = page && page.querySelector('.ne-toolbar'); if (!bar || page.querySelector('#cv137-row')) return false;
  var row = document.createElement('div'); row.id = 'cv137-row'; row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:6px 0';
  row.innerHTML = '<b class="tiny">Kiểu đoạn (P137)</b><select class="input" id="cv137-sel" aria-label="Kiểu đoạn" style="max-width:150px"></select><button type="button" class="btn btn-soft sm" id="cv137-apply">Áp dụng</button><button type="button" class="btn btn-ghost sm" id="cv137-redef">Cập nhật kiểu từ đoạn này</button><button type="button" class="btn btn-ghost sm" id="cv137-toc">Mục lục</button><button type="button" class="btn btn-ghost sm" id="cv137-undo">Hoàn tác</button><span class="tiny" id="cv137-out" role="status" aria-live="polite">Chọn đoạn rồi áp kiểu; sửa kiểu sẽ cập nhật mọi đoạn cùng kiểu.</span>';
  bar.parentNode.insertBefore(row, bar.nextSibling);
  var $ = function (s) { return row.querySelector(s); }, st = load(), sel = $('#cv137-sel'), out = $('#cv137-out'), lastRange = null;
  function fill() { sel.innerHTML = ''; Object.keys(st).forEach(function (k) { var o = document.createElement('option'); o.textContent = k; sel.appendChild(o); }); }
  fill();
  document.addEventListener('selectionchange', function () { var s = getSelection(), d = document.getElementById('lfDoc'); if (s && s.rangeCount && d && d.contains(s.anchorNode)) lastRange = s.getRangeAt(0).cloneRange(); });
  function restore() { var s = getSelection(); if (lastRange) { s.removeAllRanges(); s.addRange(lastRange); } }
  row.querySelectorAll('button').forEach(function (b) { b.addEventListener('mousedown', function (e) { e.preventDefault(); }); });
  $('#cv137-apply').addEventListener('click', function () { restore(); var n = applyToSelection(sel.value, st); out.textContent = n ? 'Đã áp "' + sel.value + '" cho ' + n + ' đoạn.' : 'Hãy đặt con trỏ/chọn văn bản trong trang trước.'; });
  $('#cv137-redef').addEventListener('click', function () { restore(); var s = getSelection(), a = s && s.anchorNode; a = a && (a.nodeType === 1 ? a : a.parentElement); var b = a && a.closest && a.closest(BLOCK); if (!b || !document.getElementById('lfDoc').contains(b)) { out.textContent = 'Đặt con trỏ vào một đoạn mẫu trước.'; return; } var nm = sel.value, cs = getComputedStyle(b), def = {}; cssKeys(st[nm]).forEach(function (k) { var v = b.style.getPropertyValue(kebab(k)) || (k in cs ? cs[k] : ''); if (v) def[k] = v; }); if (st[nm].level) def.level = st[nm].level; var c = clean(def); if (!Object.keys(c).length) { out.textContent = 'Không đọc được định dạng.'; return; } st[nm] = c; save(st); try { out.textContent = 'Đã cập nhật "' + nm + '" cho ' + restyleAll(st) + ' đoạn.'; } catch (e) { out.textContent = String(e.message || e); } });
  $('#cv137-toc').addEventListener('click', function () { try { out.textContent = 'Mục lục: ' + buildToc() + ' mục.'; } catch (e) { out.textContent = String(e.message || e); } });
  $('#cv137-undo').addEventListener('click', function () { try { out.textContent = undo() ? 'Đã hoàn tác bước vừa rồi.' : 'Không có gì để hoàn tác.'; } catch (e) { out.textContent = String(e.message || e); } });
  return true;
}
function ready() { try { mount(); var p = document.getElementById('page-layoutFoundry'); if (p && !p.__cv137 && window.MutationObserver) { p.__cv137 = true; new MutationObserver(function () { if (!p.querySelector('#cv137-row')) mount(); }).observe(p, { childList: true, subtree: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function tests() {
  var d = clean({ fontSize: '20px', color: 'red;background:url(x)', evil: '1', level: '2', margin: 'url(javascript:1)' }), t = tocHtml([{ text: 'A <b>', level: 1, page: 1 }, { text: 'B', level: 2, page: 3 }]);
  return { defaultsHaveHeadings: DEFAULTS['Tiêu đề 1'].level === 1 && Object.keys(DEFAULTS).length === 5, cleanDropsUnsafe: d.fontSize === '20px' && d.level === 2 && !('evil' in d) && !('color' in d) && !('margin' in d), tocEscapes: t.indexOf('A &lt;b&gt;') > 0 && t.indexOf('<b>') < 0, tocHasPages: />3<\/span>/.test(t) && />1<\/span>/.test(t), tocEmptyMessage: tocHtml([]).indexOf('Chưa có tiêu đề') > 0, kebab: kebab('borderLeft') === 'border-left' && kebab('fontSize') === 'font-size' };
}
window.CVStylesP137 = { version: '137.1.0', DEFAULTS: DEFAULTS, load: load, clean: clean, applyToSelection: applyToSelection, restyleHtml: restyleHtml, entriesFrom: entriesFrom, tocHtml: tocHtml, stripToc: stripToc, buildToc: buildToc, restyleAll: restyleAll, undo: undo, mount: mount, tests: tests };
})();
