/* P159.1 · Dock "Bộ công cụ cảnh" trong Video Studio.
   Gom các thẻ P164 (Shot list), P163 (Nhân vật), P154 (Toàn cảnh), P155–P157 (Thẻ/Prompt/Góc máy) vào MỘT thanh tab gọn,
   để các thao tác chính vẫn thấy ngay mà không đẩy trình dựng video xuống dưới hàng nghìn pixel. Chỉ di chuyển nút DOM có sẵn
   (giữ nguyên sự kiện và dữ liệu); không tạo kho dữ liệu hay module nghiệp vụ mới. Chọn tab đang mở được nhớ trong sessionStorage. */
(function () {
'use strict';
if (window.CVToolkitDockP159) return;
var TABS = [['cv164-card', 'Shot list'], ['cv163-card', 'Nhân vật'], ['cv167-card', 'Dựng khối'], ['cv168-card', 'Ảnh → chuyển động'], ['cv154-card', 'Toàn cảnh'], ['cv155-card', 'Thẻ · Prompt · Góc máy']], SKEY = 'canvio.p159u.tab';
var st = null;
function adopt(page) {
  var added = 0;
  TABS.forEach(function (t, i) {
    var c = page.querySelector('#' + t[0]); if (!c || st.done[t[0]]) return; st.done[t[0]] = 1; added++;
    c.style.margin = '0'; c.style.display = t[0] === st.open ? '' : 'none'; c.setAttribute('role', 'tabpanel'); st.panels.appendChild(c);
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-ghost sm'; b.setAttribute('role', 'tab'); b.textContent = t[1]; b.dataset.id = t[0]; b.setAttribute('aria-controls', t[0]);
    var before = null; st.btns.forEach(function (o) { if (!before && TABS.map(function (x) { return x[0]; }).indexOf(o.dataset.id) > i) before = o; }); st.bar.insertBefore(b, before); st.btns.push(b);
    b.addEventListener('click', function () { st.open = st.open === t[0] ? '' : t[0]; try { sessionStorage.setItem(SKEY, st.open); } catch (e) {} show(); });
  });
  if (added) show();
  return Object.keys(st.done).length === TABS.length;
}
function show() {
  st.btns.forEach(function (b) { var on = b.dataset.id === st.open; b.setAttribute('aria-selected', on); b.className = 'btn ' + (on ? 'btn-primary' : 'btn-ghost') + ' sm'; });
  TABS.forEach(function (t) { var c = document.getElementById(t[0]); if (c && st.done[t[0]]) c.style.display = t[0] === st.open ? '' : 'none'; });
}
function mount() {
  var page = document.getElementById('page-videoStudio'); if (!page) return false;
  if (st) return adopt(page);
  var first = TABS.map(function (t) { return page.querySelector('#' + t[0]); }).filter(Boolean)[0]; if (!first) return false;
  var dock = document.createElement('div'); dock.className = 'card'; dock.id = 'cv159u-dock'; dock.style.cssText = 'margin:0 0 14px;padding:12px 14px';
  dock.innerHTML = '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between"><div><h3 style="margin:0;font-size:16px">Bộ công cụ cảnh</h3><p class="tiny" style="margin:2px 0 0">Shot list, nhân vật, toàn cảnh và prompt dùng chung ảnh, dự án và AI của CANVIO.</p></div>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap" role="tablist" aria-label="Bộ công cụ cảnh"></div></div><div id="cv159u-panels" style="margin-top:10px"></div>';
  var open = ''; try { open = sessionStorage.getItem(SKEY) || ''; } catch (e) {}
  first.parentNode.insertBefore(dock, first);
  st = { done: {}, btns: [], bar: dock.querySelector('[role=tablist]'), panels: dock.querySelector('#cv159u-panels'), open: open };
  return adopt(page);
}
function ready() { var n = 0; (function loop() { var ok = false; try { ok = mount(); } catch (e) {} if (!ok && ++n < 80) setTimeout(loop, 250); })(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
window.CVToolkitDockP159 = { version: '159.1.0', mount: mount };
})();
