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
  var cloud = "<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='1100'><filter id='f' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.0035 .009' numOctaves='6' seed='7'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.6 -1.05'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>";
  var cloudUrl = 'url("data:image/svg+xml,' + encodeURIComponent(cloud) + '")';
  var cloud2 = cloud.replace("seed='7'", "seed='23'").replace('.0035 .009', '.006 .016');
  var cloudUrl2 = 'url("data:image/svg+xml,' + encodeURIComponent(cloud2) + '")';
  s.textContent = [
  '#cv150-sky,#cv150-word,#cv150-float{display:none}',
  S + '{position:relative;isolation:isolate;display:flex;flex-direction:column;padding:18px clamp(14px,3vw,44px) 0;border-radius:30px;overflow:hidden;color:#fff;background:linear-gradient(180deg,#1f5fd8 0%,#3f86ec 30%,#7db6f7 62%,#bfdcfb 100%)}',
  S + '::before,' + S + '::after{content:"";position:absolute;left:-10%;right:-10%;top:0;height:1100px;z-index:-1;pointer-events:none;background-repeat:no-repeat;background-size:100% 100%}',
  S + '::before{background-image:' + cloudUrl + ';opacity:.85;-webkit-mask-image:linear-gradient(180deg,#000 70%,transparent);mask-image:linear-gradient(180deg,#000 70%,transparent);animation:cv150drift 80s ease-in-out infinite alternate}',
  S + '::after{background-image:' + cloudUrl2 + ';opacity:.55;top:380px;-webkit-mask-image:linear-gradient(180deg,transparent,#000 30%,#000 70%,transparent);mask-image:linear-gradient(180deg,transparent,#000 30%,#000 70%,transparent);animation:cv150drift 110s ease-in-out infinite alternate-reverse}',
  '@keyframes cv150drift{from{transform:translateX(-3%)}to{transform:translateX(3%)}}',
  '@media(prefers-reduced-motion:reduce){' + S + '::before,' + S + '::after{animation:none}}',
  S + ' #cv150-sky{order:-3;display:flex;flex-direction:column;position:relative;min-height:min(62vh,560px);padding:0 0 10px}',
  S + ' #cv150-nav{align-self:center;display:flex;align-items:center;gap:4px;padding:6px 6px 6px 18px;border-radius:999px;background:linear-gradient(135deg,rgba(255,255,255,.42),rgba(255,255,255,.14));border:1px solid rgba(255,255,255,.7);backdrop-filter:blur(28px) saturate(1.8) brightness(1.08);-webkit-backdrop-filter:blur(28px) saturate(1.8) brightness(1.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.85),inset 0 -1px 0 rgba(255,255,255,.25),0 12px 44px rgba(10,40,120,.22);max-width:100%;overflow-x:auto}',
  S + ' #cv150-nav b{font-weight:600;letter-spacing:-.02em;font-size:17px;margin-right:12px;color:#fff}',
  S + ' #cv150-nav button{cursor:pointer;border:0;background:transparent;color:#fff;font-family:inherit;font-weight:500;font-size:13.5px;padding:9px 14px;border-radius:999px;white-space:nowrap;transition:background .2s}',
  S + ' #cv150-nav button:hover{background:rgba(255,255,255,.28)}',
  S + ' #cv150-nav button.go{background:#fff;color:#1b4fb8;font-weight:600;margin-left:6px}',
  S + ' #cv150-sky h2{margin:clamp(30px,9vh,96px) 0 0;font-family:inherit;font-weight:200;font-size:clamp(40px,7vw,108px);line-height:1;letter-spacing:-.045em;color:#fff;text-shadow:0 4px 40px rgba(20,60,150,.22);max-width:15ch}',
  S + ' #cv150-sky p{margin:18px 0 0;max-width:42ch;font-size:clamp(14px,1.3vw,17px);line-height:1.55;color:rgba(255,255,255,.95)}',
  S + ' #cv150-float{display:block;position:absolute;inset:0;pointer-events:none}',
  S + ' #cv150-float span{position:absolute;padding:8px 16px;border-radius:999px;background:linear-gradient(135deg,rgba(255,255,255,.4),rgba(255,255,255,.12));border:1px solid rgba(255,255,255,.7);backdrop-filter:blur(24px) saturate(1.8) brightness(1.08);-webkit-backdrop-filter:blur(24px) saturate(1.8) brightness(1.08);font-size:13px;font-weight:500;box-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 8px 26px rgba(10,40,120,.18);animation:cv150bob 7s ease-in-out infinite alternate}',
  S + ' #cv150-float span:nth-child(1){right:8%;top:34%}' + S + ' #cv150-float span:nth-child(2){right:22%;top:58%;animation-delay:-2s}' + S + ' #cv150-float span:nth-child(3){right:4%;top:72%;animation-delay:-4s}',
  '@keyframes cv150bob{from{transform:translateY(-6px)}to{transform:translateY(8px)}}',
  '@media(prefers-reduced-motion:reduce){' + S + ' #cv150-float span{animation:none}}',
  S + ' #cv150-toggle{position:absolute;top:62px;right:0;cursor:pointer;padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.6);background:rgba(255,255,255,.2);color:#fff;font:600 12px inherit;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}',
  S + ' #cv150-toggle{font-family:inherit}',
  /* dải thẻ kính */
  S + ' #ws-cards{order:-2;margin:0 0 6px}',
  S + ' #ws-cards h3{color:#fff;font-weight:500;font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.92;text-shadow:0 1px 12px rgba(20,60,140,.3)}',
  S + ' #ws-cards .ws-grid{display:flex!important;gap:14px;overflow-x:auto;padding:14px 4px 22px;scroll-snap-type:x proximity;perspective:1400px;cursor:grab;scrollbar-width:none;-webkit-overflow-scrolling:touch}',
  S + ' #ws-cards .ws-grid::-webkit-scrollbar{display:none}',
  S + ' #ws-cards .ws-grid.drag{cursor:grabbing;scroll-snap-type:none}',
  S + ' #ws-cards .ws-grid.drag>*{pointer-events:none}',
  S + ' #ws-cards .ws-grid>*{flex:0 0 clamp(220px,21vw,280px);scroll-snap-align:start;background:linear-gradient(160deg,rgba(255,255,255,.78),rgba(255,255,255,.5))!important;border:1px solid rgba(255,255,255,.9)!important;border-radius:22px!important;box-shadow:inset 0 1px 0 #fff,0 18px 44px rgba(10,40,120,.24)!important;backdrop-filter:blur(30px) saturate(1.7);-webkit-backdrop-filter:blur(30px) saturate(1.7);overflow:hidden;color:#0f2247;transform:rotateY(-7deg) rotateX(2deg);transform-origin:left center;transition:transform .3s,box-shadow .3s;user-select:none}',
  S + ' #ws-cards .ws-grid>*:hover{transform:rotateY(0) rotateX(0) translateY(-4px)}',
  S + ' #ws-cards .ws-grid>* *{color:inherit;background:transparent!important;text-shadow:none}',
  S + ' #ws-cards .ws-grid>*::before,' + S + ' #ws-cards .ws-grid>*::after{display:none!important}',
  S + ' #ws-cards .ws-grid>* [class*=chip],' + S + ' #ws-cards .ws-grid>* [class*=tag],' + S + ' #ws-cards .ws-grid>* button{background:rgba(20,70,190,.1)!important;border:1px solid rgba(20,70,190,.18)!important;color:#1a3d8f!important;border-radius:999px!important}',
  S + ' #ws-cards .ws-grid>* p,' + S + ' #ws-cards .ws-grid>* [class*=desc]{color:#3b4d75}',
  S + ' #cv150-word{order:-1;display:block;font-family:inherit;font-weight:200;font-size:clamp(80px,22vw,340px);line-height:.85;letter-spacing:-.055em;color:#fff;padding:0;margin:4px 0 clamp(18px,3vw,36px);user-select:none;pointer-events:none;text-shadow:0 6px 50px rgba(20,60,150,.18)}',
  /* phần còn lại: thẻ kính sáng, đọc rõ */
  S + ' #cvHero,' + S + ' #ws-jobs,' + S + ' #l43-recent,' + S + ' #cv-hub110,' + S + ' #cvux-home-launch,' + S + ' #cvhs-workflows,' + S + ' #ws-obc,' + S + ' #cvux-onboarding{background:rgba(255,255,255,.72)!important;border:1px solid rgba(255,255,255,.8)!important;border-radius:24px!important;box-shadow:0 18px 50px rgba(20,60,140,.16)!important;backdrop-filter:blur(22px) saturate(1.2);-webkit-backdrop-filter:blur(22px) saturate(1.2);color:#10203f;margin-bottom:18px}',
  S + ' #cvHero{background:rgba(20,40,110,.38)!important;color:#fff}',
  S + ' #ws-jobs button[class],' + S + ' #cvHero button{border-radius:999px!important}',
  'html[data-home-skin=classic] #cv150-toggle{position:fixed;right:14px;bottom:14px;z-index:60;display:inline-block;padding:8px 14px;border-radius:999px;border:1px solid #111;background:#fff;color:#111;font:600 12px/1 inherit;cursor:pointer}',
  '@media(max-width:560px){html[data-home-skin=classic] #cv150-toggle{bottom:76px}' + S + '{padding-top:12px;border-radius:20px}' + S + ' #cv150-float{display:none}' + S + ' #cv150-sky h2{max-width:none}' + S + ' #cv150-toggle{top:58px}}'
  ].join('\n');
  document.head.appendChild(s);
}
function build() {
  var p = document.getElementById('page-home'); if (!p) return false;
  if (!document.getElementById('cv150-sky')) {
    var d = document.createElement('div'); d.id = 'cv150-sky';
    d.innerHTML = '<nav id="cv150-nav" aria-label="Lối tắt không gian"><b>canvio</b><button type="button" data-go="design">Thiết kế</button><button type="button" data-go="site">Website</button><button type="button" data-go="media">Ảnh &amp; video</button><button type="button" data-go="proj">Dự án</button><button type="button" data-go="ai">AI</button><button type="button" class="go" data-go="design">Bắt đầu</button></nav><div id="cv150-float" aria-hidden="true"><span>Miễn phí</span><span>Chạy ngay trên máy</span><span>Xuất PDF · MP4</span></div><h2>Sáng tạo mọi thứ, nhẹ như mây.</h2><p>Poster, website, CV 3D và video — một nơi duy nhất, miễn phí.</p>';
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
function drag() {
  var g = document.querySelector('#ws-cards .ws-grid'); if (!g || g.__cv150) return; g.__cv150 = 1;
  var down = false, sx = 0, sl = 0, moved = 0;
  g.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') return; down = true; moved = 0; sx = e.clientX; sl = g.scrollLeft; });
  window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = 1; g.classList.add('drag'); } if (moved) g.scrollLeft = sl - dx; });
  window.addEventListener('pointerup', function () { if (!down) return; down = false; setTimeout(function () { g.classList.remove('drag'); }, 0); });
  g.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
}
function init() { css(); if (!build()) return false; drag(); apply(); toggleOutside(); return true; }
var _set = set; set = function (v) { _set(v); toggleOutside(); };
var tries = 0; (function loop() { if (init() || ++tries > 40) return; setTimeout(loop, 250); })();
window.CVHomeSkyP150 = { version: '150.0.0', get: get, set: set, init: init };
})();
