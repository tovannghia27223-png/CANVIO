/* P114.1 · Khôi phục lối vào bị ẩn khi bật giao diện shell (data-nav=shell): (1) menu Studio có thêm "Dự án & xuất" (Alt+4) và "AI & cài đặt" (Alt+5), (2) nút "◈ Spatial" (Spatial Workspace, Ctrl/⌘+Shift+I) hiện lại trên thanh trên.
   Chỉ thêm: dùng đúng bộ điều hướng CVWS/CV.go và API CV229 có sẵn; không đổi lot P109/P114, không thêm route hay store mới. Việc hiển thị do CSS riêng của lô này. */
(function () {
'use strict';
if (window.CVNavRestoreP114) return;
var EXTRA = [{ id: 'proj', label: 'Dự án & xuất', icon: '▦', key: 'Alt+4' }, { id: 'ai', label: 'AI & cài đặt', icon: '✦', key: 'Alt+5' }];
function css() {
  if (document.getElementById('canvio-lot114n-css')) return;
  var s = document.createElement('style'); s.id = 'canvio-lot114n-css';
  s.textContent = 'html[data-nav=shell] header.top .topRight #cv229-open{display:inline-flex!important;align-items:center;gap:6px;order:-1;flex:none;visibility:visible!important}@media(max-width:560px){html[data-nav=shell] header.top .topRight #cv229-open{padding:0 9px;min-width:0}}';
  document.head.appendChild(s);
}
function mark(menu) {
  var cur = (document.querySelector('.page.active') || {}).id || 'page-home', id = cur.replace('page-', ''), sp = window.CVWS && CVWS.pageToSpace && CVWS.pageToSpace[id], want = (sp === 'proj' || sp === 'ai') ? sp : null;
  EXTRA.forEach(function (x) { var b = menu.querySelector('[data-route="' + x.id + '"]'); if (!b) return; if (want === x.id) { b.setAttribute('aria-current', 'page'); var home = menu.querySelector('[data-route="home"]'); if (home) home.removeAttribute('aria-current'); } else b.removeAttribute('aria-current'); });
}
function extendMenu() {
  var menu = document.getElementById('cv-studio-menu'); if (!menu) return false;
  if (!menu.querySelector('[data-route="ai"]')) {
    var foot = menu.querySelector('.cvss-foot'), sep = document.createElement('div'); sep.style.cssText = 'height:1px;margin:4px 8px;background:var(--line,#e7ecf5)'; sep.setAttribute('role', 'separator');
    var frag = document.createDocumentFragment(); frag.appendChild(sep);
    EXTRA.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.dataset.route = x.id; b.innerHTML = '<span class="cvss-ic" aria-hidden="true">' + x.icon + '</span><span>' + x.label + '</span><small>' + x.key + '</small>'; frag.appendChild(b); });
    if (foot) { menu.insertBefore(frag, foot); foot.textContent = 'Alt+0–5 chuyển nhanh · Ctrl+K để tìm công cụ'; } else menu.appendChild(frag);
  }
  mark(menu); return true;
}
function init() {
  try { css(); } catch (e) {}
  try {
    if (!extendMenu()) return false;
    if (window.CV && CV.go && !CV.go.__p114n) { var g = CV.go; CV.go = function () { var o = g.apply(this, arguments); try { extendMenu(); } catch (e) {} return o; }; CV.go.__p114n = true; }
    if (window.CVWS && CVWS.open && !CVWS.open.__p114n) { var w = CVWS.open; CVWS.open = function () { var o = w.apply(this, arguments); try { extendMenu(); } catch (e) {} return o; }; CVWS.open.__p114n = true; }
    if (window.CV && CV.palette && typeof CV.palette.build === 'function' && !CV.palette.build.__p114n) { var pb = CV.palette.build; CV.palette.build = function () { var items = pb.apply(this, arguments) || []; EXTRA.forEach(function (x) { var l = 'Chuyển sang ' + x.label; if (!items.some(function (i) { return i.label === l; })) items.push({ label: l, hint: 'Studio · ' + x.key, icon: x.icon, run: function () { if (window.CVWS && CVWS.open) CVWS.open(x.id); } }); }); return items; }; CV.palette.build.__p114n = true; }
    return true;
  } catch (e) { return false; }
}
var tries = 0; (function loop() { if (init() || ++tries > 40) return; setTimeout(loop, 250); })();
window.CVNavRestoreP114 = { version: '114.1.0', routes: EXTRA.map(function (x) { return x.id; }), init: init };
})();
