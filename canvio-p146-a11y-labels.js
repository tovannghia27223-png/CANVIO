/* P146 · Gán nhãn truy cập cho ô nhập/lựa chọn còn thiếu tên (chỉ thêm aria-label, không đổi giao diện). */
(function () {
'use strict';
if (window.CVA11yLabelsP146) return;
function textOf(n) { return (n && n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80); }
function nameFor(c) {
  var f = c.closest('.field'), l = f && f.querySelector('label'); if (l && l.contains(c) === false && textOf(l)) return textOf(l);
  var p = c.previousElementSibling; if (p && /^(LABEL|SPAN|B|STRONG|SMALL|DIV)$/.test(p.tagName) && !p.querySelector('input,select,textarea') && textOf(p)) return textOf(p);
  var par = c.parentElement, pl = par && par.querySelector(':scope > label, :scope > .lbl, :scope > b'); if (pl && !pl.contains(c) && textOf(pl)) return textOf(pl);
  return c.getAttribute('data-label') || c.name || c.id || '';
}
function run(root) {
  var n = 0; (root || document).querySelectorAll('input:not([type=hidden]):not([type=file]),select,textarea').forEach(function (c) {
    if (c.getAttribute('aria-label') || c.getAttribute('aria-labelledby') || c.title || c.closest('label') || (c.id && document.querySelector('label[for="' + c.id.replace(/"/g, '\\"') + '"]')) || (c.placeholder && c.type !== 'range')) return;
    if (/^gjs-/.test(c.className + '') || c.closest('.gjs-editor, #gjs')) return;
    var t = nameFor(c); if (t) { c.setAttribute('aria-label', t); n++; }
  }); return n;
}
var timer = 0; function later() { clearTimeout(timer); timer = setTimeout(function () { run(); }, 500); }
window.CVA11yLabelsP146 = { version: '146.0.0', run: run };
if (typeof document === 'undefined') return;
function start() { run(); if (window.MutationObserver) new MutationObserver(later).observe(document.body, { childList: true, subtree: true }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
