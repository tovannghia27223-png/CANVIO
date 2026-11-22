/* P150 · Tổng quan "Bàn thiết kế": nền pasteboard có lưới chấm và thước, một khung poster đang được dựng (khung chọn + con trỏ), 5 không gian làm việc là các khung giấy kéo ngang được (rê chuột hiện 4 điểm chọn).
   Chỉ thêm: không xoá hay đổi chức năng của #cvHero, #ws-jobs, #ws-cards, #l43-recent, #cv-hub110, #cvhs-workflows… — chỉ phủ lớp CSS có phạm vi html[data-home-skin=sky] #page-home và chèn khối #cv150-sky. Nút "Giao diện cổ điển / Bàn thiết kế" (localStorage canvio.homeSkin) cho phép quay lại giao diện cũ. Tôn trọng prefers-reduced-motion. */
(function () {
'use strict';
if (window.CVHomeSkyP150) return;
var KEY = 'canvio.homeSkin';
function get() { try { return localStorage.getItem(KEY) === 'classic' ? 'classic' : 'sky'; } catch (e) { return 'sky'; } }
function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} apply(v); toggleOutside(); }
function apply(v) {
  v = v || get(); document.documentElement.setAttribute('data-home-skin', v);
  var b = document.getElementById('cv150-toggle'); if (b) { b.textContent = v === 'sky' ? 'Giao diện cổ điển' : 'Bàn thiết kế'; b.setAttribute('aria-pressed', v === 'sky' ? 'true' : 'false'); }
}
function css() {
  if (document.getElementById('canvio-lot150h-css')) return;
  var S = 'html[data-home-skin=sky] #page-home', s = document.createElement('style'); s.id = 'canvio-lot150h-css';
  var F = '"Bahnschrift","Arial Narrow","Liberation Sans Narrow","Roboto Condensed",sans-serif';
  s.textContent = [
  'html[data-home-skin=sky]{--pb:#E4E6EE;--paper:#FBFBF8;--ink:#15151C;--sel:#FF2E93;--sun:#FFD84A;--ln:rgba(21,21,28,.14);--mute:#5b5f73}',
  '#cv150-sky{display:none}',
  S + '{position:relative;isolation:isolate;display:flex;flex-direction:column;padding:34px clamp(14px,3vw,44px) 28px;border-radius:14px;overflow:hidden;color:var(--ink);background-color:var(--pb);background-image:radial-gradient(rgba(21,21,28,.16) 1px,transparent 1.2px);background-size:22px 22px}',
  S + '::before{content:"";position:absolute;left:0;right:0;top:0;height:20px;z-index:-1;background:repeating-linear-gradient(90deg,rgba(21,21,28,.38) 0 1px,transparent 1px 10px),repeating-linear-gradient(90deg,rgba(21,21,28,.6) 0 1px,transparent 1px 50px);background-size:100% 6px,100% 11px;background-repeat:repeat-x;background-position:0 100%;border-bottom:1px solid var(--ln);background-color:rgba(251,251,248,.55)}',
  S + ' #cv150-sky{order:-3;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:clamp(20px,4vw,64px);align-items:center;position:relative;padding:clamp(10px,3vw,36px) 0 clamp(22px,3vw,40px)}',
  S + ' #cv150-sky h2{margin:0 0 18px;font-family:' + F + '!important;font-weight:700;font-stretch:75%;font-size:clamp(46px,7vw,112px);line-height:1;letter-spacing:-.012em;color:var(--ink);max-width:10em}',
  S + ' #cv150-sky p{margin:0 0 26px;max-width:40ch;font-size:clamp(15px,1.25vw,18px);line-height:1.55;color:var(--mute)}',
  S + ' #cv150-cta{display:flex;flex-wrap:wrap;gap:10px}',
  S + ' #cv150-cta button{cursor:pointer;font-family:inherit;font-size:15px;font-weight:600;padding:13px 20px;border-radius:6px;border:1.5px solid var(--ink);transition:transform .15s,background .15s}',
  S + ' #cv150-cta .p{background:var(--ink);color:#fff}' + S + ' #cv150-cta .p:hover{background:#2c2c3a}',
  S + ' #cv150-cta .q{background:transparent;color:var(--ink)}' + S + ' #cv150-cta .q:hover{background:rgba(21,21,28,.07)}',
  S + ' #cv150-cta button:focus-visible,#cv150-toggle:focus-visible{outline:3px solid var(--sel);outline-offset:3px}',
  S + ' #cv150-toggle{position:absolute;top:0;right:0;cursor:pointer;padding:6px 11px;border-radius:6px;border:1px solid var(--ln);background:rgba(251,251,248,.8);color:var(--mute);font-family:inherit;font-size:12px;font-weight:500}',
  S + ' #cv150-toggle:hover{color:var(--ink);border-color:var(--ink)}',
  /* khung poster */
  S + ' #cv150-art{position:relative;justify-self:center;width:min(100%,400px)}',
  S + ' #cv150-art .lab{display:flex;justify-content:space-between;margin:0 0 7px;font-size:12px;color:var(--mute)}',
  S + ' #cv150-art .fr{position:relative;aspect-ratio:4/5;background:var(--paper);border-radius:2px;box-shadow:0 0 0 1px var(--ln),0 22px 40px -18px rgba(21,21,28,.35);overflow:visible}',
  S + ' #cv150-art .bd{position:absolute;inset:0;overflow:hidden;border-radius:2px}',
  S + ' #cv150-art .sun{position:absolute;right:-18%;top:-10%;width:78%;aspect-ratio:1;border-radius:50%;background:var(--sun)}',
  S + ' #cv150-art .bar{position:absolute;left:8%;bottom:8%;right:8%;height:11%;background:var(--ink)}',
  S + ' #cv150-art .bar i{position:absolute;left:5%;top:50%;width:34%;height:3px;background:var(--sun);transform:translateY(-50%)}',
  S + ' #cv150-art .gd{position:absolute;background:var(--sel);opacity:.75}',
  S + ' #cv150-art .gd.v{top:-6%;bottom:-6%;width:1px;left:8%}' + S + ' #cv150-art .gd.h{left:-5%;right:-5%;height:1px;top:56%}',
  S + ' #cv150-art .tx{position:absolute;left:8%;top:36%;width:74%;animation:cv150snap 2.6s cubic-bezier(.2,.8,.2,1) .5s both}',
  S + ' #cv150-art .tx b{display:block;font-family:' + F + '!important;font-weight:700;font-stretch:75%;font-size:clamp(30px,4.4vw,50px);line-height:.95;letter-spacing:-.01em;color:var(--ink)}',
  S + ' #cv150-art .tx span{display:block;margin-top:10px;font-size:12px;color:#444}',
  S + ' #cv150-art .sl{position:absolute;inset:-7px -9px;border:1.5px solid var(--sel)}',
  S + ' #cv150-art .sl u{position:absolute;width:7px;height:7px;background:#fff;border:1.5px solid var(--sel)}',
  S + ' #cv150-art .sl u:nth-child(1){left:-5px;top:-5px}' + S + ' #cv150-art .sl u:nth-child(2){right:-5px;top:-5px}' + S + ' #cv150-art .sl u:nth-child(3){left:-5px;bottom:-5px}' + S + ' #cv150-art .sl u:nth-child(4){right:-5px;bottom:-5px}',
  S + ' #cv150-art .cur{position:absolute;right:-30px;bottom:-26px;display:flex;flex-direction:column;align-items:flex-start}',
  S + ' #cv150-art .cur svg{width:18px;height:18px;fill:var(--sel);stroke:#fff;stroke-width:1.5}',
  S + ' #cv150-art .cur em{margin:-2px 0 0 12px;font-style:normal;font-size:12px;font-weight:700;color:#fff;background:#B80F5A;padding:3px 9px;border-radius:3px 9px 9px 9px}',
  '@keyframes cv150snap{from{transform:translate(-34px,26px)}to{transform:none}}',
  '@media(prefers-reduced-motion:reduce){' + S + ' #cv150-art .tx{animation:none}}',
  /* 5 không gian = khung giấy */
  S + ' #ws-cards{order:-2;margin:0 0 20px}',
  S + ' #ws-cards h3{color:var(--ink);font-family:inherit;font-weight:600;font-size:15px;letter-spacing:0;text-transform:none;margin:0 0 4px}',
  S + ' #ws-cards .ws-grid{display:flex!important;gap:18px;overflow-x:auto;padding:12px 8px 20px;scroll-snap-type:x proximity;cursor:grab;scrollbar-width:none}',
  S + ' #ws-cards .ws-grid::-webkit-scrollbar{display:none}',
  S + ' #ws-cards .ws-grid.drag{cursor:grabbing;scroll-snap-type:none}' + S + ' #ws-cards .ws-grid.drag>*{pointer-events:none}',
  S + ' #ws-cards .ws-grid>*{position:relative;flex:0 0 clamp(230px,21vw,272px);scroll-snap-align:start;background:var(--paper)!important;border:0!important;border-radius:2px!important;box-shadow:0 0 0 1px var(--ln),0 14px 26px -16px rgba(21,21,28,.4)!important;overflow:visible;color:var(--ink);user-select:none;backdrop-filter:none;transform:none}',
  S + ' #ws-cards .ws-grid>*{--a:#FF3D9A;display:flex!important;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;gap:0;padding:30px 20px 24px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--a) 20%,#FBFBF8) 0,#FBFBF8 62%)!important}',
  S + ' #ws-cards .ws-grid>[data-ws=site]{--a:#22C7E8}' + S + ' #ws-cards .ws-grid>[data-ws=media]{--a:#FFC81E}' + S + ' #ws-cards .ws-grid>[data-ws=proj]{--a:#7C4DFF}' + S + ' #ws-cards .ws-grid>[data-ws=ai]{--a:#2BD48A}',
  S + ' #ws-cards .ws-grid>* .ws-ic{width:68px;height:68px;border-radius:20px;font-size:32px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 0 0 7px rgba(255,255,255,.75),0 16px 24px -10px var(--a)}',
  S + ' #ws-cards .ws-grid>* b{display:block;font-size:19px;font-weight:700;letter-spacing:-.01em;margin:0 0 6px;text-align:center}',
  S + ' #ws-cards .ws-grid>* .d{display:block;text-align:center;font-size:13.5px;line-height:1.5;max-width:22ch;margin:0 auto 16px}',
  S + ' #ws-cards .ws-grid>* .ws-ch{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:0 auto}',
  S + ' #ws-cards .ws-grid>*::before{display:none!important}',
  S + ' #ws-cards .ws-grid>*::after{content:""!important;display:block!important;position:absolute;inset:-4px;pointer-events:none;opacity:0;transition:opacity .15s;border:1.5px solid var(--sel)!important;background-color:transparent!important;box-shadow:none!important;background-image:linear-gradient(var(--sel),var(--sel)),linear-gradient(var(--sel),var(--sel)),linear-gradient(var(--sel),var(--sel)),linear-gradient(var(--sel),var(--sel));background-position:0 0,100% 0,0 100%,100% 100%;background-size:7px 7px;background-repeat:no-repeat;/*,*/border-radius:0!important;width:auto;height:auto;right:auto;bottom:auto;left:-4px;top:-4px;width:calc(100% + 8px);height:calc(100% + 8px)}',
  S + ' #ws-cards .ws-grid>*:hover::after,' + S + ' #ws-cards .ws-grid>*:focus-within::after{opacity:1}',
  S + ' #ws-cards .ws-grid>* *{color:inherit;text-shadow:none}',
  S + ' #ws-cards .ws-grid>* p,' + S + ' #ws-cards .ws-grid>* [class*=desc]{color:var(--mute)}',
  S + ' #ws-cards .ws-grid>* [class*=chip],' + S + ' #ws-cards .ws-grid>* [class*=tag],' + S + ' #ws-cards .ws-grid>* button{background:transparent!important;border:1px solid var(--ln)!important;color:#3b3f52!important;border-radius:3px!important}',
  /* phần còn lại: tờ giấy trên pasteboard */
  S + ' #cvHero,' + S + ' #ws-jobs,' + S + ' #l43-recent,' + S + ' #cv-hub110,' + S + ' #cvux-home-launch,' + S + ' #cvhs-workflows,' + S + ' #ws-obc,' + S + ' #cvux-onboarding{background:var(--paper)!important;border:0!important;border-radius:4px!important;box-shadow:0 0 0 1px var(--ln),0 18px 30px -22px rgba(21,21,28,.45)!important;color:var(--ink);margin-bottom:18px;backdrop-filter:none}',
  S + ' #cvHero{background:var(--ink)!important;color:#fff}',
  S + ' #ws-jobs button[class],' + S + ' #cvHero button{border-radius:6px!important}',
  'html[data-home-skin=classic] #cv150-toggle{position:fixed;right:14px;bottom:14px;z-index:60;display:inline-block;padding:8px 14px;border-radius:999px;border:1px solid #111;background:#fff;color:#111;font:600 12px/1 inherit;cursor:pointer}',
  '@media(max-width:820px){' + S + ' #cv150-sky{grid-template-columns:1fr}' + S + ' #cv150-art{width:min(100%,320px);margin:6px auto 24px}' + S + ' #cv150-sky h2{max-width:none}}',
  '@media(max-width:560px){html[data-home-skin=classic] #cv150-toggle{bottom:76px}' + S + '{padding-top:30px;border-radius:10px}}'
  ].join('\n');
  document.head.appendChild(s);
}
function build() {
  var p = document.getElementById('page-home'); if (!p) return false;
  if (!document.getElementById('cv150-sky')) {
    var d = document.createElement('div'); d.id = 'cv150-sky';
    d.innerHTML = '<div><h2>Bắt đầu từ một khung trống.</h2><p>Poster, CV 3D, website và video. Làm ngay trên máy bạn, không cần tài khoản, không tốn phí.</p><div id="cv150-cta"><button type="button" class="p" data-go="design">Tạo thiết kế mới</button><button type="button" class="q" data-go="ai">Nhờ AI dựng giúp</button></div></div>'
      + '<div id="cv150-art" aria-hidden="true"><div class="lab"><span>Poster tuyển dụng</span><span>1080 × 1350</span></div><div class="fr"><div class="bd"><div class="sun"></div><div class="bar"><i></i></div></div><div class="gd v"></div><div class="gd h"></div><div class="tx"><div class="sl"><u></u><u></u><u></u><u></u></div><b>Chúng tôi<br>đang tuyển</b><span>Nhân sự · Hà Nội · Toàn thời gian</span><div class="cur"><svg viewBox="0 0 16 16"><path d="M1 1l5.5 14 2-5.5L14 7.5z"/></svg><em>Hà</em></div></div></div></div>';
    d.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-go]'); if (b && window.CVWS && CVWS.open) CVWS.open(b.getAttribute('data-go')); });
    var t = document.createElement('button'); t.id = 'cv150-toggle'; t.type = 'button'; t.addEventListener('click', function () { set(get() === 'sky' ? 'classic' : 'sky'); });
    d.appendChild(t); p.insertBefore(d, p.firstChild);
  }
  return true;
}
function toggleOutside() {
  var b = document.getElementById('cv150-toggle'); if (!b) return;
  if (get() === 'classic' && b.parentNode && b.parentNode.id === 'cv150-sky') document.body.appendChild(b);
  if (get() === 'sky' && b.parentNode === document.body) { var s = document.getElementById('cv150-sky'); if (s) s.appendChild(b); }
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
var tries = 0; (function loop() { if (init() || ++tries > 40) return; setTimeout(loop, 250); })();
window.CVHomeSkyP150 = { version: '150.5.0', get: get, set: set, init: init };
})();
