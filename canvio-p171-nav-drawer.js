/* P171 · Nút thu gọn menu ở thanh trên hoạt động lại + lối vào "Cổng bảo vệ" (khóa truy cập, chống AI cào, bảo vệ tác phẩm).
   Nguyên nhân: giao diện shell (data-nav=shell, P114) ẩn hẳn menu trái nên nút `.railBtn` chỉ đổi lớp `rail` của một menu đang ẩn → bấm không thấy gì;
   "Cổng bảo vệ" chỉ có trong không gian "AI & cài đặt", không có nút trong menu trái.
   Cách sửa (chỉ thêm): ở chế độ shell, nút mở menu đầy đủ dạng ngăn kéo (đóng bằng Esc, bấm nền, hoặc chọn mục); chế độ cổ điển giữ nguyên hành vi cũ.
   Thêm nút "Cổng bảo vệ" ngay dưới nút Spatial Workspace ở menu trái (cả khi menu mở dạng ngăn kéo), dùng CV.go('shield') có sẵn. Không thêm route hay kho dữ liệu. */
(function () {
'use strict';
if (window.CVNavDrawerP171) return;
var CLS = 'cv171-open', root = document.documentElement;
function shell() { return root.getAttribute('data-nav') === 'shell'; }
function isOpen() { return document.body.classList.contains(CLS); }
function setOpen(on) {
  document.body.classList.toggle(CLS, !!on);
  var b = document.querySelector('header.top .railBtn'); if (b) { b.setAttribute('aria-expanded', on ? 'true' : 'false'); b.setAttribute('aria-controls', 'side'); }
  var s = document.getElementById('side'); if (s) { s.setAttribute('aria-hidden', on || !shell() ? 'false' : 'true'); }
  if (on && s) { var first = s.querySelector('.nav button'); try { first && first.focus({ preventScroll: true }); } catch (e) {} }
}
function css() {
  if (document.getElementById('cv171-style')) return;
  var st = document.createElement('style'); st.id = 'cv171-style';
  st.textContent = 'html[data-nav=shell] body.' + CLS + ' #side{display:flex!important;flex-direction:column;position:fixed!important;left:14px;top:78px;bottom:14px;width:min(300px,calc(100vw - 28px));max-height:none;overflow:auto;z-index:140;box-shadow:0 24px 60px rgba(8,12,28,.38);border-radius:18px;transform:none!important}'
    + '#cv171-scrim{display:none}html[data-nav=shell] body.' + CLS + ' #cv171-scrim{display:block;position:fixed;inset:0;background:rgba(13,26,43,.32);z-index:139}'
    + 'html[data-nav=shell] body.' + CLS + ' #side .nl,html[data-nav=shell] body.' + CLS + ' #side .navgroup>label{display:revert!important}';
  document.head.appendChild(st);
}
function addShield() {
  var side = document.getElementById('side'); if (!side) return false;
  if (!document.getElementById('cv171-scrim') && side.parentNode) { var sc = document.createElement('div'); sc.id = 'cv171-scrim'; sc.setAttribute('aria-hidden', 'true'); side.parentNode.insertBefore(sc, side); } if (side.querySelector('.cv171-shield')) return true;
  var anchor = side.querySelector('.cv229-side-launch'); if (!anchor) return false;
  var b = document.createElement('button'); b.type = 'button'; b.className = 'cv229-side-launch cv171-shield'; b.setAttribute('data-page', 'shield'); b.setAttribute('aria-label', 'Mở Cổng bảo vệ');
  b.onclick = function () { setOpen(false); CV.go('shield'); }; b.innerHTML = '<span aria-hidden="true">◈</span><b>Cổng bảo vệ</b><small>Khóa · Chống AI cào · Bảo vệ tác phẩm</small>';
  anchor.parentNode.insertBefore(b, anchor.nextSibling); return true;
}
function bind() {
  var btn = document.querySelector('header.top .railBtn'); if (!btn) return false; if (btn.__cv171) return true; btn.__cv171 = 1;
  btn.addEventListener('click', function (e) { if (!shell()) return; e.stopImmediatePropagation(); e.preventDefault(); setOpen(!isOpen()); }, true);
  btn.title = 'Menu đầy đủ'; btn.setAttribute('aria-label', 'Mở hoặc đóng menu đầy đủ'); return true;
}
function mount() { css(); var a = bind(), b = addShield(); return a && b; }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) { setOpen(false); var b = document.querySelector('header.top .railBtn'); b && b.focus(); } });
document.addEventListener('click', function (e) {
  if (!isOpen()) return; var t = e.target;
  if (t.closest && t.closest('#side') && t.closest('button[data-page],button[data-ws],.nav button')) { setTimeout(function () { setOpen(false); }, 0); return; }
  if (t.closest && !t.closest('#side') && !t.closest('header.top .railBtn')) setOpen(false);
}, true);
window.CVNavDrawerP171 = { version: '171.0.0', open: function () { setOpen(true); }, close: function () { setOpen(false); }, isOpen: isOpen, mount: mount };
function ready() { var n = 0; (function loop() { var ok = false; try { ok = mount(); } catch (e) {} if (!ok && ++n < 80) setTimeout(loop, 250); })(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
})();
