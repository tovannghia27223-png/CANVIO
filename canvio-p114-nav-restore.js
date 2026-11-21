/* P114.1 · Khôi phục lối vào bị ẩn khi bật giao diện shell (data-nav=shell): (1) menu Studio có thêm "Dự án & xuất" (Alt+4) và "AI & cài đặt" (Alt+5), (2) nút "◈ Spatial" (Spatial Workspace, Ctrl/⌘+Shift+I) hiện lại trên thanh trên, (3) đổi biểu tượng nút "Thêm tuỳ chọn" (#l42-btn) từ ba chấm "⋯" sang biểu tượng thanh trượt (SVG, theo màu chữ), giữ nguyên chức năng và nhãn truy cập, (4) ở màn hình ≤560px chỉ giữ chấm trạng thái lưu (ẩn chữ "Đã tự lưu · giờ") để nút "Thêm tuỳ chọn" không bị đẩy ra ngoài màn hình.
   Chỉ thêm: dùng đúng bộ điều hướng CVWS/CV.go và API CV229 có sẵn; không đổi lot P109/P114, không thêm route hay store mới. Việc hiển thị do CSS riêng của lô này. */
(function () {
'use strict';
if (window.CVNavRestoreP114) return;
var EXTRA = [{ id: 'proj', label: 'Dự án & xuất', icon: '▦', key: 'Alt+4' }, { id: 'ai', label: 'AI & cài đặt', icon: '✦', key: 'Alt+5' }];
function css() {
  if (document.getElementById('canvio-lot114n-css')) return;
  var s = document.createElement('style'); s.id = 'canvio-lot114n-css';
  var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round'><path d='M4 7h9M17 7h3M4 17h3M11 17h9'/><circle cx='15' cy='7' r='2'/><circle cx='9' cy='17' r='2'/></svg>", url = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  s.textContent = 'header.top #l42-btn{font-size:0!important;line-height:0!important}header.top #l42-btn::before{content:"";display:block;width:18px;height:18px;margin:auto;background:currentColor;-webkit-mask:' + url + ' center/contain no-repeat;mask:' + url + ' center/contain no-repeat}' + 'html[data-nav=shell] header.top .topRight #cv229-open{display:inline-flex!important;align-items:center;gap:6px;order:-1;flex:none;visibility:visible!important}@media(max-width:560px){html[data-nav=shell] header.top .topRight #cv229-open{padding:0 9px;min-width:0}header.top .saveState{padding:0 8px;min-width:0}header.top .saveState>span{display:none}html[data-nav=shell] header.top .topRight #cv229-open{font-size:0!important;width:34px;padding:0;justify-content:center}html[data-nav=shell] header.top .topRight #cv229-open::before{content:"\\25C8";font-size:15px}header.top .topRight{gap:3px}header.top .topRight #ws-export{padding-left:8px;padding-right:8px;font-size:12px}header.top .topRight #cvux-mode-toggle{padding-left:6px;padding-right:6px;font-size:10.5px}header.top #cv-studio-switch>[data-cv-studio-trigger]{padding:0 7px}}';
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
