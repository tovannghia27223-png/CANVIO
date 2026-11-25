/* P151.1 · Contrast guard chỉ sửa văn bản nội dung workspace; không chiếm quyền màu của menu, nút điều khiển hay Spatial Inspector.
   Chỉ đổi màu chữ khi tương phản < 2.4 và nền xác định được; hoàn tác khi đổi giao diện/skin. */
(function () {
'use strict';
if (window.CVContrastGuardP151) return;
var MIN = 2.4, TARGET_LIGHT = '#eef2fa', TARGET_DARK = '#10182a', SKIP = 'canvas,svg,iframe,script,style,button,a,input,select,textarea,[role=button],[role=menuitem],[data-route],[data-cv-studio-trigger],#cv-studio-menu,#cv229-inspector,#gjs,.gjs-editor,.konvajs-content,[id*=Stage],[id*=stage],[class*=preview],[class*=Preview],[data-cvg-skip]';
function parse(c) { var m = c && c.match(/[\d.]+/g); return m && m.length >= 3 ? { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 } : null; }
function lum(c) { function f(v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); } return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); }
function over(f, b) { return { r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 }; }
function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
function bgOf(el) {
  var layers = [], n = el, cs, c;
  while (n && n.nodeType === 1) { cs = getComputedStyle(n); if (cs.backgroundImage && cs.backgroundImage !== 'none') return null; if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') return null; c = parse(cs.backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } n = n.parentElement; }
  var base = { r: 255, g: 255, b: 255, a: 1 };
  if (!layers.length || layers[layers.length - 1].a < 1) { var rc = parse(getComputedStyle(document.documentElement).backgroundColor); if (rc && rc.a > 0) base = rc; else { var bc = parse(getComputedStyle(document.body).backgroundColor); if (bc && bc.a > 0) base = bc; } }
  for (var i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
  return base;
}
var changed = [], sig = '', lastPage = '';
function signature() { var d = document.documentElement, b = document.body; var i = document.getElementById('cv229-inspector'); return [d.getAttribute('data-theme'), d.getAttribute('data-skin'), d.getAttribute('data-home-skin'), b && b.className, i && i.className].join('|'); }
function undo() { changed.forEach(function (it) { if (it.el.isConnected) { if (it.prev) it.el.style.setProperty('color', it.prev, it.prio); else it.el.style.removeProperty('color'); it.el.removeAttribute('data-cvg'); } }); changed = []; }
function scan() {
  var s = signature(); if (s !== sig) { undo(); sig = s; }
  var pages = [].filter.call(document.querySelectorAll('.page'), function (p) { return p.offsetParent !== null; });
  var roots = pages, fixed = 0, seen = 0;
  roots.forEach(function (root) {
    root.querySelectorAll('*').forEach(function (el) {
      if (seen > 40000 || el.hasAttribute('data-cvg') || (el.closest && el.closest(SKIP))) return; seen++;
      var own = ''; for (var i = 0; i < el.childNodes.length; i++) if (el.childNodes[i].nodeType === 3) own += el.childNodes[i].nodeValue; own = own.trim(); if (!own) return;
      var r = el.getBoundingClientRect(); if (r.width < 6 || r.height < 6) return;
      var cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || cs.webkitTextFillColor === 'transparent' || cs.mixBlendMode !== 'normal') return;
      var op = 1, n = el; while (n && n !== document.body) { op *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; } if (op < .5) return;
      var fg = parse(cs.color), bg = bgOf(el); if (!fg || !bg || fg.a === 0) return;
      var f = fg.a < 1 ? over(fg, bg) : fg, icon = !/[\p{L}\p{N}]/u.test(own) && own.length <= 4;
      if (ratio(f, bg) >= (icon ? 3 : MIN)) return;
      var light = { r: 238, g: 242, b: 250, a: 1 }, dark = { r: 16, g: 24, b: 42, a: 1 };
      var pick = ratio(light, bg) >= ratio(dark, bg) ? TARGET_LIGHT : TARGET_DARK;
      changed.push({ el: el, prev: el.style.getPropertyValue('color'), prio: el.style.getPropertyPriority('color') });
      el.style.setProperty('color', pick, 'important'); el.setAttribute('data-cvg', '1'); fixed++;
    });
  });
  return fixed;
}
var timer = 0; function later() { clearTimeout(timer); timer = setTimeout(function () { try { scan(); } catch (e) {} }, 700); }
window.CVContrastGuardP151 = { version: '151.1.0', scan: scan, undo: undo, count: function () { return changed.length; } };
if (typeof document === 'undefined' || !document.body) return;
function start() { later(); if (window.MutationObserver) { new MutationObserver(later).observe(document.body, { childList: true, subtree: true }); new MutationObserver(later).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-skin', 'data-home-skin', 'class'] }); new MutationObserver(later).observe(document.body, { attributes: true, attributeFilter: ['class'] }); } window.addEventListener('hashchange', later); setInterval(function () { var pg = [].filter.call(document.querySelectorAll('.page'), function (p) { return p.offsetParent !== null; }).map(function (p) { return p.id; }).join(','); if (signature() !== sig || pg !== lastPage) { lastPage = pg; later(); } }, 1200); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
