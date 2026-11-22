/* P150 · Tổng quan phong cách "Sky Glass": nền trời xanh có mây, tiêu đề trắng nét mảnh cỡ lớn, thẻ kính mờ, chip nổi, dải thẻ không gian làm việc và wordmark lớn ở cuối trang.
   Chỉ thêm: không xoá hay đổi chức năng của #cvHero, #ws-jobs, #ws-cards, #l43-recent, #cv-hub110, #cvhs-workflows… — chỉ phủ lớp CSS có phạm vi html[data-home-skin=sky] #page-home và chèn thêm khối #cv150-sky / #cv150-word. Nút "Giao diện cổ điển / Sky Glass" (lưu localStorage canvio.homeSkin) cho phép quay lại giao diện cũ. Tôn trọng prefers-reduced-motion. */
(function () {
'use strict';
if (window.CVHomeSkyP150) return;
var KEY = 'canvio.homeSkin';
function get() { try { return localStorage.getItem(KEY) === 'classic' ? 'classic' : 'sky'; } catch (e) { return 'sky'; } }
function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} apply(v); }
function apply(v) {
  v = v || get(); document.documentElement.setAttribute('data-home-skin', v);
  var b = document.getElementById('cv150-toggle'); if (b) { b.textContent = v === 'sky' ? 'Giao diện cổ điển' : 'Sky Glass'; b.setAttribute('aria-pressed', v === 'sky' ? 'true' : 'false'); }
}
function css() {
  if (document.getElementById('canvio-lot150h-css')) return;
  var S = 'html[data-home-skin=sky] #page-home', s = document.createElement('style'); s.id = 'canvio-lot150h-css';
  s.textContent = [
  '#cv150-sky,#cv150-word{display:none}',
  S + '{position:relative;isolation:isolate;padding:28px clamp(14px,3vw,40px) 0;border-radius:28px;overflow:hidden;color:#fff;background:linear-gradient(180deg,#2f6fe0 0%,#4f93f0 38%,#8fc3fb 72%,#cfe6fd 100%)}',
  S + '::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 38% 12% at 18% 22%,rgba(255,255,255,.55),transparent 70%),radial-gradient(ellipse 46% 14% at 72% 30%,rgba(255,255,255,.5),transparent 70%),radial-gradient(ellipse 55% 16% at 40% 52%,rgba(255,255,255,.42),transparent 72%),radial-gradient(ellipse 50% 14% at 85% 70%,rgba(255,255,255,.45),transparent 72%),radial-gradient(ellipse 60% 16% at 15% 88%,rgba(255,255,255,.55),transparent 72%);filter:blur(10px);animation:cv150drift 60s ease-in-out infinite alternate}',
  '@keyframes cv150drift{from{transform:translateX(-2%)}to{transform:translateX(2%)}}',
  '@media(prefers-reduced-motion:reduce){' + S + '::before{animation:none}}',
  S + ' #cv150-sky{order:-1;display:block;position:relative;padding:clamp(28px,6vw,72px) 0 18px}',
  S + ' #cv150-sky .e{display:inline-flex;gap:8px;align-items:center;padding:6px 14px;border-radius:999px;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.5);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-family:inherit;font-weight:600;font-size:12px;line-height:1;letter-spacing:.08em;text-transform:uppercase}',
  S + ' #cv150-sky h2{margin:18px 0 12px;font-family:inherit;font-weight:200;font-size:clamp(40px,7.2vw,104px);line-height:1.02;letter-spacing:-.035em;color:#fff;text-shadow:0 2px 30px rgba(20,60,140,.25);max-width:14ch}',
  S + ' #cv150-sky p{margin:0 0 20px;max-width:46ch;font-size:clamp(14px,1.4vw,18px);line-height:1.5;color:rgba(255,255,255,.92)}',
  S + ' #cv150-sky .c{display:flex;flex-wrap:wrap;gap:8px}',
  S + ' #cv150-sky .c button,#cv150-toggle{cursor:pointer;padding:9px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.2);color:#fff;font-family:inherit;font-weight:600;font-size:13px;line-height:1;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 6px 20px rgba(20,60,140,.15);transition:background .2s,transform .2s}',
  S + ' #cv150-sky .c button:hover,#cv150-toggle:hover{background:rgba(255,255,255,.38);transform:translateY(-1px)}',
  S + ' #cv150-sky .c button:focus-visible,#cv150-toggle:focus-visible{outline:2px solid #fff;outline-offset:2px}',
  S + ' #cv150-toggle{position:absolute;top:0;right:0;padding:7px 12px;font-size:12px}',
  S + ' #cvHero,' + S + ' #ws-jobs,' + S + ' #l43-recent,' + S + ' #cv-hub110,' + S + ' #cvux-home-launch,' + S + ' #cvhs-workflows,' + S + ' #ws-obc,' + S + ' #cvux-onboarding{background:rgba(255,255,255,.66)!important;border:1px solid rgba(255,255,255,.7)!important;border-radius:22px!important;box-shadow:0 18px 50px rgba(20,60,140,.18)!important;backdrop-filter:blur(22px) saturate(1.2);-webkit-backdrop-filter:blur(22px) saturate(1.2);color:#10203f}',
  S + ' #cvHero{background:rgba(255,255,255,.16)!important;color:#fff}',
  S + ' #cvHero h1,' + S + ' #cvHero p{color:#fff}',
  S + ' #ws-jobs,' + S + ' #l43-recent,' + S + ' #cv-hub110,' + S + ' #cvux-home-launch,' + S + ' #cvhs-workflows,' + S + ' #ws-obc,' + S + ' #cvux-onboarding,' + S + ' #cvHero{margin-bottom:18px}',
  S + ' #ws-cards h3{color:#fff;text-shadow:0 1px 12px rgba(20,60,140,.3)}',
  S + ' #ws-cards .ws-grid{display:flex!important;gap:12px;overflow-x:auto;padding:6px 2px 14px;scroll-snap-type:x proximity}',
  S + ' #ws-cards .ws-grid>*{flex:0 0 clamp(210px,22vw,270px);scroll-snap-align:start;background:rgba(255,255,255,.62)!important;border:1px solid rgba(255,255,255,.8)!important;border-radius:20px!important;box-shadow:0 14px 36px rgba(20,60,140,.16)!important;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);overflow:hidden;color:#10203f;transition:transform .25s,box-shadow .25s}',
  S + ' #ws-cards .ws-grid>*:hover{transform:translateY(-4px)}',
  S + ' #ws-jobs button[class],' + S + ' #cvHero button{border-radius:999px!important}',
  S + ' #cv150-word{order:999;display:block;font-family:inherit;font-weight:200;font-size:clamp(72px,19vw,300px);line-height:.9;letter-spacing:-.05em;color:rgba(255,255,255,.88);padding:10px 0 0;margin:10px 0 -.14em;user-select:none;pointer-events:none;text-shadow:0 4px 40px rgba(20,60,140,.2)}',
  'html[data-home-skin=classic] #cv150-toggle{position:fixed;right:14px;bottom:14px;z-index:60;display:inline-block;padding:8px 14px;border-radius:999px;border:1px solid #111;background:#fff;color:#111;font-family:inherit;font-weight:600;font-size:12px;line-height:1;cursor:pointer}',
  '@media(max-width:560px){html[data-home-skin=classic] #cv150-toggle{bottom:76px}' + S + '{padding-top:16px;border-radius:18px}' + S + ' #cv150-sky h2{max-width:none}}'
  ].join('\n');
  document.head.appendChild(s);
}
function build() {
  var p = document.getElementById('page-home'); if (!p) return false;
  if (!document.getElementById('cv150-sky')) {
    var d = document.createElement('div'); d.id = 'cv150-sky';
    d.innerHTML = '<span class="e">✦ CANVIO Studio</span><h2>Sáng tạo mọi thứ, nhẹ như mây.</h2><p>Poster, website, CV 3D và video — một nơi duy nhất, miễn phí, chạy ngay trên máy bạn.</p><div class="c"><button type="button" data-go="design">Thiết kế</button><button type="button" data-go="site">Website &amp; hồ sơ</button><button type="button" data-go="media">Ảnh &amp; video</button><button type="button" data-go="proj">Dự án &amp; xuất</button><button type="button" data-go="ai">AI &amp; cài đặt</button></div>';
    d.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-go]'); if (b && window.CVWS && CVWS.open) CVWS.open(b.getAttribute('data-go')); });
    var t = document.createElement('button'); t.id = 'cv150-toggle'; t.type = 'button'; t.addEventListener('click', function () { set(get() === 'sky' ? 'classic' : 'sky'); });
    d.appendChild(t); p.insertBefore(d, p.firstChild);
  }
  if (!document.getElementById('cv150-word')) { var w = document.createElement('div'); w.id = 'cv150-word'; w.setAttribute('aria-hidden', 'true'); w.textContent = 'canvio'; p.appendChild(w); }
  return true;
}
function toggleOutside() { /* ở chế độ cổ điển #cv150-sky bị ẩn → nút nổi riêng để quay lại */
  var b = document.getElementById('cv150-toggle'); if (b && b.parentNode && b.parentNode.id === 'cv150-sky' && get() === 'classic') document.body.appendChild(b);
  if (b && get() === 'sky' && b.parentNode === document.body) { var s = document.getElementById('cv150-sky'); if (s) s.appendChild(b); }
}
function init() { css(); if (!build()) return false; apply(); toggleOutside(); return true; }
var _set = set; set = function (v) { _set(v); toggleOutside(); };
var tries = 0; (function loop() { if (init() || ++tries > 40) return; setTimeout(loop, 250); })();
window.CVHomeSkyP150 = { version: '150.0.0', get: get, set: set, init: init };
})();
