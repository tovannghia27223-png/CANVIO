/* P150 · Tổng quan "Bàn thiết kế": nền pasteboard có lưới chấm và thước, một khung poster đang được dựng (khung chọn + con trỏ), 5 không gian làm việc là các khung giấy kéo ngang được (rê chuột hiện 4 điểm chọn).
   Chỉ thêm: không xoá hay đổi chức năng của #cvHero, #ws-jobs, #ws-cards, #l43-recent, #cv-hub110, #cvhs-workflows… — chỉ phủ lớp CSS có phạm vi html[data-home-skin=sky] #page-home và chèn khối #cv150-sky. Nút "Giao diện cổ điển / Bàn thiết kế" (localStorage canvio.homeSkin) cho phép quay lại giao diện cũ. Tôn trọng prefers-reduced-motion. */
(function () {
'use strict';
if (window.CVHomeSkyP150) return;
var KEY = 'canvio.homeSkin.v2';
function get() { try { var v = localStorage.getItem(KEY); return v === 'classic' || v === 'fashion' || v === 'sky' || v === 'tech' ? v : 'classic'; } catch (e) { return 'classic'; } }
function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} apply(v); toggleOutside(); }
function apply(v) {
  v = v || get(); document.documentElement.setAttribute('data-home-skin', v);
  [].forEach.call(document.querySelectorAll('#cv150-skins button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-skin') === v ? 'true' : 'false'); });
}
function css() {
  if (document.getElementById('canvio-lot150h-css')) return;
  var S = 'html[data-home-skin=sky] #page-home', A = S + ' #cv150-art', s = document.createElement('style'); s.id = 'canvio-lot150h-css';
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
  /* bàn thiết kế chạy thật */
  S + ' #cv150-art{position:relative;justify-self:center;width:min(100%,500px)}',
  S + ' #cv150-art .tabs{display:flex;gap:4px;padding:4px;margin:0 0 14px;background:rgba(251,251,248,.85);border-radius:8px;box-shadow:0 0 0 1px var(--ln)}',
  S + ' #cv150-art .tabs button{flex:1;cursor:pointer;border:0;background:transparent;color:var(--mute);font-family:inherit;font-size:13.5px;font-weight:600;padding:9px 6px;border-radius:5px;transition:background .15s,color .15s}',
  S + ' #cv150-art .tabs button[aria-selected=true]{background:var(--ink);color:#fff}',
  S + ' #cv150-art .tabs button:not([aria-selected=true]):hover{color:var(--ink);background:rgba(21,21,28,.06)}',
  S + ' #cv150-art button:focus-visible{outline:3px solid var(--sel);outline-offset:2px}',
  S + ' #cv150-art .lab{display:flex;justify-content:space-between;margin:0 0 7px;font-size:12px;color:var(--mute)}',
  S + ' #cv150-art .cvstage{position:relative;min-height:370px;display:flex;align-items:center}',
  S + ' #cv150-art .fr{--acc:#FFD84A;position:relative;width:100%;aspect-ratio:4/5;background:var(--paper);border-radius:3px;box-shadow:0 0 0 1px var(--ln),0 30px 50px -22px rgba(21,21,28,.45);touch-action:none}',
  S + ' #cv150-art .fr[data-t=cv],' + A + ' .fr[data-t=web]{aspect-ratio:16/10}' + A + ' .fr[data-t=video]{aspect-ratio:16/9}',
  S + ' #cv150-art .tp{position:absolute;inset:0;display:none;overflow:hidden;border-radius:3px}',
  S + ' #cv150-art .fr[data-t=poster] .t-poster,' + A + ' .fr[data-t=cv] .t-cv,' + A + ' .fr[data-t=web] .t-web,' + A + ' .fr[data-t=video] .t-video{display:block}',
  S + ' #cv150-art .tx{position:absolute;cursor:grab;touch-action:none;z-index:3;user-select:none;display:none}',
  S + ' #cv150-art .fr[data-t=poster] .tx-poster,' + A + ' .fr[data-t=cv] .tx-cv,' + A + ' .fr[data-t=web] .tx-web,' + A + ' .fr[data-t=video] .tx-video{display:block}',
  S + ' #cv150-art .tx.dr{cursor:grabbing}',
  S + ' #cv150-art .tx-poster{left:8%;top:36%;width:74%;animation:cv150snap 2.6s cubic-bezier(.2,.8,.2,1) .5s both}' + A + ' .tx-cv{left:8%;top:30%;width:50%}' + A + ' .tx-web{left:7%;top:34%;width:52%}' + A + ' .tx-video{left:8%;top:12%;width:50%}',
  S + ' #cv150-art .tx b{display:block;font-family:' + F + '!important;font-weight:700;font-stretch:75%;font-size:clamp(30px,4.4vw,50px);line-height:.98;letter-spacing:-.01em;color:var(--ink)}',
  S + ' #cv150-art .tx span{display:block;margin-top:9px;font-size:12px;color:#444}',
  S + ' #cv150-art .tx-cv b,' + A + ' .tx-cv span,' + A + ' .tx-video b,' + A + ' .tx-video span{color:#fff}',
  S + ' #cv150-art .tx-cv b,' + A + ' .tx-web b,' + A + ' .tx-video b{font-size:clamp(26px,3.6vw,42px)}',
  S + ' #cv150-art .sl{position:absolute;inset:-7px -9px;border:1.5px solid var(--sel);pointer-events:none}',
  S + ' #cv150-art .sl u{position:absolute;width:7px;height:7px;background:#fff;border:1.5px solid var(--sel)}',
  S + ' #cv150-art .sl u:nth-child(1){left:-5px;top:-5px}' + A + ' .sl u:nth-child(2){right:-5px;top:-5px}' + A + ' .sl u:nth-child(3){left:-5px;bottom:-5px}' + A + ' .sl u:nth-child(4){right:-5px;bottom:-5px}',
  S + ' #cv150-art .gd{position:absolute;background:var(--sel);opacity:0;transition:opacity .12s;pointer-events:none;z-index:2}',
  S + ' #cv150-art .gd.on{opacity:.9}' + A + ' .gv{top:-5%;bottom:-5%;width:1px}' + A + ' .gh{left:-4%;right:-4%;height:1px;top:50%}',
  S + ' #cv150-art .cur{position:absolute;right:-30px;bottom:-26px;display:flex;flex-direction:column;align-items:flex-start;pointer-events:none}',
  S + ' #cv150-art.live .cur{display:none}',
  S + ' #cv150-art .cur svg{width:18px;height:18px;fill:var(--sel);stroke:#fff;stroke-width:1.5}',
  S + ' #cv150-art .cur em{margin:-2px 0 0 12px;font-style:normal;font-size:12px;font-weight:700;color:#fff;background:#B80F5A;padding:3px 9px;border-radius:3px 9px 9px 9px}',
  S + ' #cv150-art .sw{display:flex;align-items:center;gap:8px;margin:16px 0 0}',
  S + ' #cv150-art .sw button{width:26px;height:26px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px var(--ln);cursor:pointer;padding:0}',
  S + ' #cv150-art .sw button[aria-pressed=true]{box-shadow:0 0 0 2px var(--ink)}',
  S + ' #cv150-art .sw i{margin-left:auto;font-style:normal;font-size:12px;color:var(--mute)}',
  S + ' #cv150-art .go{margin-top:12px;width:100%;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600;padding:11px;border-radius:6px;border:1.5px solid var(--ink);background:transparent;color:var(--ink)}' + A + ' .go:hover{background:var(--ink);color:#fff}',
  /* các mẫu */
  S + ' .t-poster .sun{position:absolute;right:-18%;top:-10%;width:78%;aspect-ratio:1;border-radius:50%;background:var(--acc);transition:background .25s}',
  S + ' .t-poster .bar{position:absolute;left:8%;bottom:8%;right:8%;height:11%;background:var(--ink)}' + S + ' .t-poster .bar i{position:absolute;left:5%;top:50%;width:34%;height:3px;background:var(--acc);transform:translateY(-50%)}',
  S + ' .t-cv{background:radial-gradient(ellipse at 78% 40%,color-mix(in srgb,var(--acc) 38%,#15151C),#15151C 70%)}',
  S + ' .t-cv .nv,' + S + ' .t-web .nv{position:absolute;left:5%;right:5%;top:7%;display:flex;gap:7px;align-items:center}' + S + ' .nv u{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.5)}' + S + ' .t-web .nv u{background:rgba(21,21,28,.3)}',
  S + ' .cubew{position:absolute;right:11%;top:50%;width:104px;height:104px;margin-top:-52px;perspective:700px}',
  S + ' .cube{position:relative;width:100%;height:100%;transform-style:preserve-3d;animation:cv150spin 16s linear infinite}',
  S + ' .cube i{position:absolute;inset:0;border:1.5px solid rgba(255,255,255,.7);background:linear-gradient(135deg,color-mix(in srgb,var(--acc) 85%,#fff),color-mix(in srgb,var(--acc) 55%,#15151C));opacity:.92}',
  S + ' .cube i:nth-child(1){transform:translateZ(52px)}' + S + ' .cube i:nth-child(2){transform:rotateY(90deg) translateZ(52px)}' + S + ' .cube i:nth-child(3){transform:rotateY(180deg) translateZ(52px)}' + S + ' .cube i:nth-child(4){transform:rotateY(-90deg) translateZ(52px)}' + S + ' .cube i:nth-child(5){transform:rotateX(90deg) translateZ(52px)}' + S + ' .cube i:nth-child(6){transform:rotateX(-90deg) translateZ(52px)}',
  '@keyframes cv150spin{from{transform:rotateX(-22deg) rotateY(0)}to{transform:rotateX(-22deg) rotateY(360deg)}}',
  S + ' .t-web .hb{position:absolute;right:7%;top:20%;width:34%;height:62%;border-radius:999px 999px 8px 8px;background:var(--acc);transition:background .25s}',
  S + ' .t-web .hb::after{content:"";position:absolute;left:18%;bottom:14%;width:64%;aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.55)}',
  S + ' .t-web .bt{position:absolute;left:7%;bottom:12%;padding:8px 18px;border-radius:999px;background:var(--ink);color:#fff;font-size:12px;font-weight:600}',
  S + ' .t-video{background:#15151C}',
  S + ' .t-video .pv{position:absolute;left:0;right:0;top:0;height:60%;background:linear-gradient(120deg,color-mix(in srgb,var(--acc) 70%,#15151C),#15151C 75%)}',
  S + ' .t-video .pl{position:absolute;right:9%;top:22%;width:0;height:0;border-left:30px solid rgba(255,255,255,.9);border-top:19px solid transparent;border-bottom:19px solid transparent}',
  S + ' .t-video .cvtl{position:absolute;left:3%;right:3%;bottom:6%;height:30%;display:flex;flex-direction:column;gap:4px}',
  S + ' .t-video .cvtl b{display:block;height:100%;position:relative;background:rgba(255,255,255,.07);border-radius:2px}' + S + ' .t-video .cvtl b i{position:absolute;top:0;bottom:0;border-radius:2px;background:var(--acc)}' + S + ' .t-video .cvtl b:nth-child(2) i{background:#7C4DFF}' + S + ' .t-video .cvtl b:nth-child(3) i{background:#22C7E8}',
  S + ' .t-video .ph{position:absolute;top:56%;bottom:4%;width:2px;background:var(--sel);left:12%;animation:cv150play 7s linear infinite}',
  '@keyframes cv150play{from{left:6%}to{left:94%}}',
  '@keyframes cv150snap{from{transform:translate(-34px,26px)}to{transform:none}}',
  '@media(prefers-reduced-motion:reduce){' + S + ' #cv150-art .tx-poster,' + S + ' .cube,' + S + ' .t-video .ph{animation:none}}',
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
  /* biến màu của các khối cũ theo kiểu */
  'html[data-home-skin=sky] #page-home{--brand:#15151C;--brand-soft:rgba(21,21,28,.06);--brand-line:rgba(21,21,28,.34);--line:rgba(21,21,28,.14)}',
  'html[data-home-skin=fashion] #page-home{--brand:#2A2BFF;--brand-soft:#ECECFF;--brand-line:#2A2BFF;--line:rgba(13,13,15,.4)}',
  'html[data-home-skin=fashion]:has(#page-home.active) header.top{--line:rgba(13,13,15,.4)}',
  'html[data-home-skin=sky] #page-home .eyebrow,html[data-home-skin=fashion] #page-home .eyebrow{color:#5b5f73!important;text-transform:none!important;letter-spacing:0!important;font-size:12px!important;font-weight:600!important}',
  'html[data-home-skin=sky] #page-home .eyebrow::before,html[data-home-skin=fashion] #page-home .eyebrow::before{display:none!important}',
  'html[data-home-skin=sky] #page-home .cvux-meta,html[data-home-skin=fashion] #page-home .cvux-meta{background:transparent!important;border:1px solid rgba(21,21,28,.2);color:#44464f!important;border-radius:999px}',
  /* đồng bộ thanh menu + khối cũ theo kiểu */
  'html[data-home-skin=sky]:has(#page-home.active) header.top{background:rgba(251,251,248,.94)!important;color:#15151C!important;border-radius:8px!important;box-shadow:0 0 0 1px rgba(21,21,28,.16),0 14px 26px -18px rgba(21,21,28,.5)!important;backdrop-filter:none!important}',
  'html[data-home-skin=sky]:has(#page-home.active) header.top .crumb,html[data-home-skin=sky]:has(#page-home.active) header.top .crumb *,html[data-home-skin=sky]:has(#page-home.active) header.top b#crumb{color:#15151C!important}',
  'html[data-home-skin=sky]:has(#page-home.active) header.top .menuBtn,html[data-home-skin=sky]:has(#page-home.active) header.top .railBtn{background:transparent!important;color:#15151C!important}',
  'html[data-home-skin=sky]:has(#page-home.active) header.top .qbar{background:rgba(21,21,28,.05)!important;border:1px solid rgba(21,21,28,.14)!important;color:#5b5f73!important;border-radius:6px!important}html[data-home-skin=sky]:has(#page-home.active) header.top .qbar *{color:#5b5f73!important}html[data-home-skin=sky]:has(#page-home.active) header.top .qbar .kbd{background:#fff!important;border:1px solid rgba(21,21,28,.14)}',
  'html[data-home-skin=sky]:has(#page-home.active) header.top .btn,html[data-home-skin=sky]:has(#page-home.active) header.top button.sh-tb,html[data-home-skin=sky]:has(#page-home.active) header.top #ws-obbtn,html[data-home-skin=sky]:has(#page-home.active) header.top #ws-cmdbtn{background:#fff!important;color:#15151C!important;border:1px solid rgba(21,21,28,.16)!important;border-radius:6px!important;box-shadow:none!important}',
  'html[data-home-skin=sky]:has(#page-home.active) header.top #ws-export,html[data-home-skin=sky]:has(#page-home.active) header.top .cvExport{background:#15151C!important;color:#fff!important;border:1px solid #15151C!important;border-radius:6px!important;box-shadow:none!important}',
  'html[data-home-skin=sky]:has(#page-home.active) header.top #ws-export *,html[data-home-skin=sky]:has(#page-home.active) header.top .cvExport *{color:#fff!important}',
  'html[data-home-skin=sky] #page-home :is(.btn-primary,#ws-jobs>button,#ws-jobs button#ws-jgo,#ws-obc button){background:#15151C!important;background-image:none!important;color:#fff!important;border:1px solid #15151C!important;border-radius:6px!important;box-shadow:none!important}',
  'html[data-home-skin=sky] #page-home :is(.cvh-ic,.cvux-launch-icon,.cvhs-icon){background:rgba(21,21,28,.06)!important;color:#15151C!important;border-radius:6px!important;box-shadow:none!important}',
  'html[data-home-skin=sky] #page-home :is(.cvhs-kicker,.cvhs-detail-label){color:#5b5f73!important;text-transform:none!important;letter-spacing:0!important}',
  'html[data-home-skin=fashion]:has(#page-home.active) header.top{background:#fff!important;color:#0D0D0F!important;border-radius:0!important;box-shadow:none!important;border-bottom:1px solid #0D0D0F!important;backdrop-filter:none!important}',
  'html[data-home-skin=fashion]:has(#page-home.active) header.top .crumb,html[data-home-skin=fashion]:has(#page-home.active) header.top .crumb *,html[data-home-skin=fashion]:has(#page-home.active) header.top b#crumb{color:#0D0D0F!important;font-family:"Bodoni 72","Bodoni MT","Didot","Playfair Display",Georgia,serif!important;font-style:italic;font-weight:400!important;font-size:15px}',
  'html[data-home-skin=fashion]:has(#page-home.active) header.top .menuBtn,html[data-home-skin=fashion]:has(#page-home.active) header.top .railBtn{background:transparent!important;color:#0D0D0F!important}',
  'html[data-home-skin=fashion]:has(#page-home.active) header.top .qbar{background:transparent!important;border:1px solid #0D0D0F!important;color:#44464f!important;border-radius:999px!important}html[data-home-skin=fashion]:has(#page-home.active) header.top .qbar *{color:#44464f!important}html[data-home-skin=fashion]:has(#page-home.active) header.top .qbar .kbd{background:transparent!important;border:1px solid #0D0D0F}',
  'html[data-home-skin=fashion]:has(#page-home.active) header.top .btn,html[data-home-skin=fashion]:has(#page-home.active) header.top button.sh-tb,html[data-home-skin=fashion]:has(#page-home.active) header.top #ws-obbtn,html[data-home-skin=fashion]:has(#page-home.active) header.top #ws-cmdbtn{background:transparent!important;color:#0D0D0F!important;border:1px solid #0D0D0F!important;border-radius:999px!important;box-shadow:none!important}',
  'html[data-home-skin=fashion]:has(#page-home.active) header.top #ws-export,html[data-home-skin=fashion]:has(#page-home.active) header.top .cvExport{background:#2A2BFF!important;color:#fff!important;border:1px solid #2A2BFF!important;border-radius:999px!important;box-shadow:none!important}',
  'html[data-home-skin=fashion]:has(#page-home.active) header.top #ws-export *,html[data-home-skin=fashion]:has(#page-home.active) header.top .cvExport *{color:#fff!important}',
  'html[data-home-skin=fashion] #page-home :is(#cvHero,#ws-jobs,#l43-recent,#cv-hub110,#cvux-home-launch,#cvhs-workflows,#ws-obc,#cvux-onboarding) :is(h1,h2,h3,h4){font-family:"Bodoni 72","Bodoni MT","Didot","Playfair Display",Georgia,serif!important;font-weight:400!important;letter-spacing:-.01em!important}',
  'html[data-home-skin=fashion] #page-home :is(.btn-primary,#ws-jobs>button,#ws-jobs button#ws-jgo,#ws-obc button){background:#0D0D0F!important;background-image:none!important;color:#fff!important;border:1px solid #0D0D0F!important;border-radius:999px!important;box-shadow:none!important}',
  'html[data-home-skin=fashion] #page-home :is(.cvh-ic,.cvux-launch-icon,.cvhs-icon){background:#F4F5F8!important;color:#0D0D0F!important;border-radius:50%!important;box-shadow:none!important}',
  'html[data-home-skin=fashion] #page-home :is(.cvhs-kicker,.cvhs-detail-label){color:#44464f!important;text-transform:none!important;letter-spacing:0!important}',
  'html[data-home-skin=fashion] #page-home :is(#cv-hub110,#cvhs-workflows,#ws-jobs,#cvux-home-launch) :is([class*=card],[class*=tile],[class*=btn],a):not(.btn-primary){border-radius:0!important}',
  /* kiểu Công nghệ (HR) */
  '#cv150-tech{display:none}',
  'html[data-home-skin=tech]:has(#page-home.active),html[data-home-skin=tech]:has(#page-home.active) body,html[data-home-skin=tech]:has(#page-home.active) main{background:#07080C!important}',
  'html[data-home-skin=tech] #page-home{--surface:#11131A;--surface-2:#171A23;--ink:#F3F4F8;--ink-2:#C9CCD8;--ink-3:#8B90A3;--line:rgba(255,255,255,.1);--brand:#FF3D9A;--brand-soft:rgba(255,61,154,.12);--brand-line:rgba(255,61,154,.4);position:relative;isolation:isolate;display:flex;flex-direction:column;padding:34px clamp(14px,3vw,44px) 30px;border-radius:18px;overflow:hidden;color:#F3F4F8;background:radial-gradient(55% 45% at 88% 0%,rgba(123,77,255,.38),transparent 62%),radial-gradient(48% 42% at 0% 100%,rgba(255,61,154,.26),transparent 62%),#07080C}',
  'html[data-home-skin=tech] #page-home::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:64px 64px;-webkit-mask-image:radial-gradient(ellipse at 50% 30%,#000 30%,transparent 78%);mask-image:radial-gradient(ellipse at 50% 30%,#000 30%,transparent 78%)}',
  'html[data-home-skin=tech] #cv150-skins{display:flex;position:absolute;top:26px;right:clamp(14px,3vw,44px);z-index:6;gap:2px;padding:3px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;backdrop-filter:blur(12px)}',
  'html[data-home-skin=tech] #cv150-skins button{color:#9AA0B4}html[data-home-skin=tech] #cv150-skins button[aria-pressed=true]{background:#FFD84A;color:#0B0B10}',
  'html[data-home-skin=tech] #page-home #cv150-tech{order:-3;display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,1fr);gap:clamp(20px,3vw,56px);align-items:center;min-height:clamp(520px,68vh,640px);padding:30px 0 10px}',
  'html[data-home-skin=tech] #page-home .t-st{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.04);font-size:12.5px;color:#C9CCD8}',
  'html[data-home-skin=tech] #page-home .t-st i{width:7px;height:7px;border-radius:50%;background:#2BD48A;box-shadow:0 0 10px #2BD48A}',
  'html[data-home-skin=tech] #page-home #cv150-tech h2{margin:22px 0 18px;font-family:inherit!important;font-weight:300;font-size:clamp(34px,4.3vw,70px);line-height:1.02;letter-spacing:-.045em;color:#fff;max-width:14em}',
  'html[data-home-skin=tech] #page-home #cv150-tech h2 em{display:block;font-style:normal;color:transparent;-webkit-text-stroke:1.4px rgba(255,255,255,.9)}',
  'html[data-home-skin=tech] #page-home #cv150-tech .t-sub{margin:0 0 26px;max-width:46ch;font-size:clamp(14.5px,1.2vw,17px);line-height:1.6;color:#A5AABD}',
  'html[data-home-skin=tech] #page-home .t-con{display:flex;gap:8px;align-items:center;max-width:560px;padding:7px 7px 7px 16px;border:1px solid rgba(255,255,255,.16);border-radius:16px;background:rgba(255,255,255,.05);backdrop-filter:blur(14px);transition:border-color .2s,box-shadow .2s}',
  'html[data-home-skin=tech] #page-home .t-con:focus-within{border-color:#FF3D9A;box-shadow:0 0 0 4px rgba(255,61,154,.16),0 18px 50px -20px rgba(255,61,154,.5)}',
  'html[data-home-skin=tech] #page-home .t-con input{flex:1;min-width:0;background:transparent!important;border:0!important;outline:0!important;box-shadow:none!important;color:#fff!important;font-family:inherit;font-size:15px;padding:11px 0}',
  'html[data-home-skin=tech] #page-home .t-con input::placeholder{color:#7C8196}',
  'html[data-home-skin=tech] #page-home .t-con button{cursor:pointer;border:0;border-radius:11px;background:#FFD84A;color:#0B0B10;font-family:inherit;font-weight:700;font-size:14px;padding:12px 18px;white-space:nowrap}',
  'html[data-home-skin=tech] #page-home .t-con button:hover{background:#ffe27a}',
  'html[data-home-skin=tech] #page-home .t-con button:focus-visible,html[data-home-skin=tech] #page-home .t-sug button:focus-visible{outline:3px solid #fff;outline-offset:2px}',
  'html[data-home-skin=tech] #page-home .t-sug{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}',
  'html[data-home-skin=tech] #page-home .t-sug button{cursor:pointer;font-family:inherit;font-size:12.5px;color:#C9CCD8;background:transparent;border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:6px 12px}',
  'html[data-home-skin=tech] #page-home .t-sug button:hover{border-color:#fff;color:#fff}',
  'html[data-home-skin=tech] #page-home .t-stat{margin:16px 0 0;min-height:18px;font-family:ui-monospace,"SF Mono","Cascadia Mono",Consolas,monospace;font-size:12px;color:#8B90A3}',
  'html[data-home-skin=tech] #page-home .t-stat b{color:#2BD48A;font-weight:600}',
  'html[data-home-skin=tech] #page-home #cv150t-stage{position:relative;perspective:1500px;min-height:520px;touch-action:pan-y}',
  'html[data-home-skin=tech] #page-home .t-in{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .25s ease-out}',
  'html[data-home-skin=tech] #page-home .tc{position:absolute;opacity:0;clip-path:inset(0 0 100% 0);box-shadow:0 40px 70px -30px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.08);overflow:hidden;border-radius:6px}',
  'html[data-home-skin=tech] #page-home #cv150t-stage.run .tc{animation:cv150tin .9s cubic-bezier(.2,.8,.2,1) var(--d) forwards}',
  'html[data-home-skin=tech] #page-home #cv150t-stage.done .tc{opacity:1;clip-path:inset(0);animation:none}',
  '@keyframes cv150tin{from{opacity:1;clip-path:inset(0 0 100% 0)}to{opacity:1;clip-path:inset(0)}}',
  'html[data-home-skin=tech] #page-home .tc.po{left:2%;top:2%;width:46%;aspect-ratio:4/5;background:#FBFBF8;color:#0D0D0F;transform:translateZ(30px) rotate(-3deg);--d:.1s}',
  'html[data-home-skin=tech] #page-home .tc.po .pc{position:absolute;right:-22%;top:-12%;width:80%;aspect-ratio:1;border-radius:50%;background:#FF3D9A}',
  'html[data-home-skin=tech] #page-home .tc.po b{position:absolute;left:9%;top:34%;font-family:"Bahnschrift","Arial Narrow","Liberation Sans Narrow",sans-serif!important;font-stretch:75%;font-weight:700;font-size:clamp(26px,3.4vw,46px);line-height:.96;letter-spacing:-.01em;color:#0D0D0F}',
  'html[data-home-skin=tech] #page-home .tc.po span{position:absolute;left:9%;top:72%;font-size:11px;color:#444}',
  'html[data-home-skin=tech] #page-home .tc.po u{position:absolute;left:9%;bottom:8%;text-decoration:none;font-size:11px;font-weight:700;color:#fff;background:#0D0D0F;padding:7px 13px;border-radius:999px}',
  'html[data-home-skin=tech] #page-home .tc.bn{right:0;top:24%;width:60%;aspect-ratio:16/10;background:linear-gradient(135deg,#4B3BFF 0%,#B23DFF 52%,#FF3D9A 100%);color:#fff;transform:translateZ(70px) rotate(2deg);--d:.9s}',
  'html[data-home-skin=tech] #page-home .tc.bn::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 80% at 82% 20%,rgba(255,255,255,.35),transparent 60%)}',
  'html[data-home-skin=tech] #page-home .tc.bn b{position:absolute;left:7%;top:16%;font-weight:300;font-size:clamp(18px,2.4vw,32px);line-height:1.08;letter-spacing:-.03em;max-width:11em}',
  'html[data-home-skin=tech] #page-home .tc.bn span{position:absolute;left:7%;bottom:12%;display:flex;gap:6px}',
  'html[data-home-skin=tech] #page-home .tc.bn span i{font-style:normal;font-size:11px;padding:4px 10px;border:1px solid rgba(255,255,255,.7);border-radius:999px}',
  'html[data-home-skin=tech] #page-home .tc.bd{right:1%;bottom:-2%;width:25%;aspect-ratio:3/4.3;background:#fff;color:#0D0D0F;border-radius:12px;transform:translateZ(110px) rotate(-2deg);--d:1.7s}',
  'html[data-home-skin=tech] #page-home .tc.bd::before{content:"";position:absolute;left:50%;top:3.5%;width:26%;height:4%;transform:translateX(-50%);border-radius:99px;background:#dfe2ea}',
  'html[data-home-skin=tech] #page-home .tc.bd .av{position:absolute;left:50%;top:16%;width:44%;aspect-ratio:1;transform:translateX(-50%);border-radius:50%;background:conic-gradient(from 200deg,#4B3BFF,#FF3D9A,#FFC81E,#4B3BFF)}',
  'html[data-home-skin=tech] #page-home .tc.bd b{position:absolute;left:0;right:0;top:50%;text-align:center;font-size:clamp(11px,1.15vw,15px);font-weight:700}',
  'html[data-home-skin=tech] #page-home .tc.bd span{position:absolute;left:0;right:0;top:60%;text-align:center;font-size:clamp(9px,.9vw,11px);color:#555}',
  'html[data-home-skin=tech] #page-home .tc.bd .qr{position:absolute;left:50%;bottom:7%;width:30%;aspect-ratio:1;transform:translateX(-50%);background:repeating-conic-gradient(#0D0D0F 0 25%,#fff 0 50%) 0 0/20% 20%}',
  'html[data-home-skin=tech] #page-home .t-beam{position:absolute;left:-4%;right:-4%;top:0;height:2px;background:linear-gradient(90deg,transparent,#FF3D9A,#fff,#FF3D9A,transparent);box-shadow:0 0 24px 4px rgba(255,61,154,.7);opacity:0;pointer-events:none;transform:translateZ(150px)}',
  'html[data-home-skin=tech] #page-home #cv150t-stage.run .t-beam{animation:cv150tbeam 2.6s ease-in-out .1s forwards}',
  '@keyframes cv150tbeam{0%{opacity:1;top:0}100%{opacity:0;top:100%}}',
  '@media(prefers-reduced-motion:reduce){html[data-home-skin=tech] #page-home #cv150t-stage.run .tc,html[data-home-skin=tech] #page-home #cv150t-stage.run .t-beam{animation:none}html[data-home-skin=tech] #page-home .t-in{transition:none}}',
  'html[data-home-skin=tech] #page-home #ws-cards{order:-2;margin:0 0 22px}',
  'html[data-home-skin=tech] #page-home #ws-cards h3{font-family:inherit;font-weight:500;font-size:14px;letter-spacing:0;text-transform:none;color:#C9CCD8;margin:0 0 6px}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid{display:flex!important;gap:14px;overflow-x:auto;padding:8px 2px 18px;scroll-snap-type:x proximity;cursor:grab;scrollbar-width:none}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid::-webkit-scrollbar{display:none}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid.drag{cursor:grabbing;scroll-snap-type:none}html[data-home-skin=tech] #page-home #ws-cards .ws-grid.drag>*{pointer-events:none}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid>*{--a:#FF3D9A;position:relative;flex:0 0 clamp(224px,20vw,280px);scroll-snap-align:start;display:flex!important;flex-direction:column;align-items:center;text-align:center;padding:28px 20px 24px!important;color:#F3F4F8;border:1px solid rgba(255,255,255,.1)!important;border-radius:18px!important;box-shadow:none!important;overflow:hidden;user-select:none;transform:none;transition:border-color .2s,transform .25s;background:radial-gradient(240px circle at var(--mx,50%) var(--my,0%),color-mix(in srgb,var(--a) 30%,transparent),transparent 70%),#11131A!important}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid>[data-ws=site]{--a:#22C7E8}html[data-home-skin=tech] #page-home #ws-cards .ws-grid>[data-ws=media]{--a:#FFC81E}html[data-home-skin=tech] #page-home #ws-cards .ws-grid>[data-ws=proj]{--a:#8B7BFF}html[data-home-skin=tech] #page-home #ws-cards .ws-grid>[data-ws=ai]{--a:#2BD48A}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid>*:hover{border-color:var(--a)!important;transform:translateY(-4px)}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid>*::before,html[data-home-skin=tech] #page-home #ws-cards .ws-grid>*::after{display:none!important}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid>* *{color:inherit;background:transparent!important;text-shadow:none}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid>* .ws-ic{width:62px;height:62px;border-radius:50%;font-size:28px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;border:1px solid color-mix(in srgb,var(--a) 55%,transparent);box-shadow:0 0 30px -4px color-mix(in srgb,var(--a) 60%,transparent);background:rgba(255,255,255,.04)!important}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid>* b{display:block;font-size:18px;font-weight:600;letter-spacing:-.01em;margin:0 0 6px}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid>* .d{display:block;font-size:13px;line-height:1.5;max-width:22ch;margin:0 auto 16px;color:#9AA0B4}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid>* .ws-ch{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}',
  'html[data-home-skin=tech] #page-home #ws-cards .ws-grid>* button{background:transparent!important;border:1px solid rgba(255,255,255,.18)!important;color:#C9CCD8!important;border-radius:999px!important;font-size:11px;padding:3px 9px}',
  'html[data-home-skin=tech] #page-home :is(#cvHero,#ws-jobs,#l43-recent,#cv-hub110,#cvux-home-launch,#cvhs-workflows,#ws-obc,#cvux-onboarding){background:#11131A!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:16px!important;box-shadow:none!important;color:#F3F4F8;margin-bottom:16px;backdrop-filter:none}',
  'html[data-home-skin=tech] #page-home #cvHero{background:linear-gradient(135deg,#1a1342,#11131A 60%)!important}',
  'html[data-home-skin=tech] #page-home :is(.btn-primary,#ws-jobs>button,#ws-jgo,#ws-obc button){background:#FFD84A!important;background-image:none!important;color:#0B0B10!important;border:0!important;border-radius:10px!important;box-shadow:none!important}',
  'html[data-home-skin=tech] #page-home :is(h1,h2,h3,h4,b,strong,label){color:inherit}',
  'html[data-home-skin=tech] #page-home :is(#cv-hub110,#cvhs-workflows,#ws-jobs,#cvux-home-launch,#l43-recent) :is(p,small,.cvux-meta,[class*=sub],[class*=desc]){color:#9AA0B4}',
  'html[data-home-skin=tech] #page-home .eyebrow{color:#8B90A3!important;text-transform:none!important;letter-spacing:0!important;font-size:12px!important}html[data-home-skin=tech] #page-home .eyebrow::before{display:none!important}',
  'html[data-home-skin=tech] #page-home input,html[data-home-skin=tech] #page-home textarea,html[data-home-skin=tech] #page-home select{background:#0C0E14!important;color:#F3F4F8!important;border-color:rgba(255,255,255,.14)!important}',
  'html[data-home-skin=tech]:has(#page-home.active) header.top{background:rgba(10,11,16,.9)!important;color:#F3F4F8!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:14px!important;box-shadow:none!important}',
  'html[data-home-skin=tech]:has(#page-home.active) header.top .btn,html[data-home-skin=tech]:has(#page-home.active) header.top button.sh-tb,html[data-home-skin=tech]:has(#page-home.active) header.top #ws-obbtn,html[data-home-skin=tech]:has(#page-home.active) header.top #ws-cmdbtn{background:rgba(255,255,255,.06)!important;color:#F3F4F8!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:10px!important;box-shadow:none!important}',
  'html[data-home-skin=tech]:has(#page-home.active) header.top #ws-export,html[data-home-skin=tech]:has(#page-home.active) header.top .cvExport{background:#FFD84A!important;color:#0B0B10!important;border:0!important;border-radius:10px!important;box-shadow:none!important}',
  'html[data-home-skin=tech]:has(#page-home.active) header.top .qbar{border-radius:10px!important}',
  '@media(max-width:900px){html[data-home-skin=tech] #page-home #cv150-tech{grid-template-columns:1fr;min-height:0}html[data-home-skin=tech] #page-home #cv150t-stage{min-height:420px}html[data-home-skin=tech] #cv150-skins{position:relative!important;top:auto!important;right:auto!important;order:-5;align-self:flex-start;margin:0 0 12px}}',
  'html[data-home-skin=tech] #page-home .t-l{min-width:0}html[data-home-skin=tech] #page-home .t-con{width:100%;max-width:560px}html[data-home-skin=tech] #page-home #cv150-skins{max-width:calc(100% - 28px);overflow-x:auto}',
  'html[data-home-skin=tech] #page-home :is(#cv-hub110,#cvux-home-launch,#cvhs-workflows,#l43-recent,#ws-jobs,#cvux-onboarding) :is([class*=card],[class*=tile],[class*=choice],[class*=panel],[class*=box],[class*=item],[class*=cell],[class*=empty],[class*=rail],[class*=row],[class*=step],[class*=meta]){background:rgba(255,255,255,.04)!important;border-color:rgba(255,255,255,.1)!important;color:#F3F4F8!important;box-shadow:none!important}',
  'html[data-home-skin=tech] #page-home :is(#cv-hub110,#cvux-home-launch,#cvhs-workflows,#l43-recent,#ws-jobs,#cvux-onboarding,#ws-obc) :is(.btn:not(.btn-primary),button:not(.btn-primary):not(#ws-jgo)){background:rgba(255,255,255,.06)!important;color:#F3F4F8!important;border:1px solid rgba(255,255,255,.14)!important;box-shadow:none!important}',
  'html[data-home-skin=tech] #page-home #cv-hub110 :is(h1,h2,h3,h4,b,strong,span,div,a){color:#F3F4F8}html[data-home-skin=tech] #page-home #cv-hub110 :is(p,small,[class*=sub],[class*=desc],[class*=hint]){color:#9AA0B4!important}',
  'html[data-home-skin] #page-home:not(.active){display:none!important}',
  'html[data-home-skin=classic]:not(:has(#page-home.active)) #cv150-skins{display:none!important}',
  /* bộ chuyển kiểu */
  '#cv150-skins{display:none}',
  'html[data-home-skin=sky] #cv150-skins,html[data-home-skin=fashion] #cv150-skins,html[data-home-skin=tech] #cv150-skins{display:flex;position:absolute;top:30px;right:clamp(14px,3vw,44px);z-index:6;gap:2px;padding:3px;background:rgba(251,251,248,.92);border-radius:8px;box-shadow:0 0 0 1px rgba(21,21,28,.16)}',
  '#cv150-skins button{cursor:pointer;border:0;background:transparent;color:#5b5f73;font-family:inherit;font-size:12px;font-weight:600;padding:6px 11px;border-radius:5px;white-space:nowrap}',
  '#cv150-skins button[aria-pressed=true]{background:#15151C;color:#fff}',
  '#cv150-skins button:focus-visible{outline:3px solid #FF2E93;outline-offset:2px}',
  'html[data-home-skin=classic] #cv150-skins{display:flex;position:fixed;right:14px;bottom:14px;z-index:60;gap:2px;padding:3px;background:#fff;border:1px solid #111;border-radius:999px}',
  'html[data-home-skin=classic] #cv150-skins button{border-radius:999px}',
  '#cv150-fa{display:none}',
  'html[data-home-skin=fashion]{--fb:#F4F5F8;--fi:#0D0D0F;--fk:#2A2BFF;--fp:#F2C9C0;--fg:#0E5A45;--fs:#D5D8DE}',
  'html[data-home-skin=fashion] #page-home{position:relative;display:flex;flex-direction:column;padding:56px clamp(14px,3vw,44px) 30px;background:var(--fb);color:var(--fi);border-radius:0;overflow:hidden}',
  'html[data-home-skin=fashion] #page-home #cv150-fa{order:-3;display:block;position:relative;isolation:isolate;min-height:clamp(560px,80vh,760px);margin-bottom:26px;background:var(--fb);overflow:hidden}',
  'html[data-home-skin=fashion] #page-home .fa-arch{position:absolute;right:6%;bottom:0;width:min(44%,520px);height:96%;background:var(--fk);border-radius:999px 999px 0 0;z-index:0}',
  'html[data-home-skin=fashion] #page-home .fa-arch::before{content:"";position:absolute;left:50%;top:14%;width:46%;aspect-ratio:1;transform:translateX(-50%);border-radius:50%;background:var(--fp)}',
  'html[data-home-skin=fashion] #page-home .fa-arch::after{content:"";position:absolute;left:12%;right:12%;bottom:0;height:34%;border-radius:999px 999px 0 0;background:linear-gradient(180deg,var(--fs),#fff 90%);opacity:.9}',
  'html[data-home-skin=fashion] #page-home .fa-ring{position:absolute;right:calc(6% + 10%);top:6%;width:min(26%,300px);aspect-ratio:1;border:1px solid var(--fi);border-radius:50%;z-index:1}',
  'html[data-home-skin=fashion] #page-home .fa-copy{position:relative;z-index:3;max-width:42ch;padding-top:6px}',
  'html[data-home-skin=fashion] #page-home .fa-copy h2{margin:0 0 14px;font-family:"Bodoni 72","Bodoni MT","Didot","Playfair Display",Georgia,serif!important;font-style:italic;font-weight:400;font-size:clamp(28px,3.5vw,54px);line-height:1.08;letter-spacing:-.01em;color:var(--fi)}',
  'html[data-home-skin=fashion] #page-home .fa-copy p{margin:0 0 22px;font-size:15px;line-height:1.6;color:#44464f;max-width:36ch}',
  'html[data-home-skin=fashion] #page-home .fa-cta{display:flex;align-items:center;gap:20px;flex-wrap:wrap}',
  'html[data-home-skin=fashion] #page-home .fa-cta .p{cursor:pointer;width:116px;height:116px;border-radius:50%;border:0;background:var(--fi);color:#fff;font-family:inherit;font-size:14px;font-weight:600;line-height:1.25;padding:0 18px;transition:transform .2s,background .2s}',
  'html[data-home-skin=fashion] #page-home .fa-cta .p:hover{transform:scale(1.06);background:var(--fk)}',
  'html[data-home-skin=fashion] #page-home .fa-cta .q{cursor:pointer;background:none;border:0;border-bottom:1.5px solid var(--fi);color:var(--fi);font-family:inherit;font-size:14.5px;font-weight:600;padding:2px 0}',
  'html[data-home-skin=fashion] #page-home .fa-cta button:focus-visible{outline:3px solid var(--fk);outline-offset:3px}',
  'html[data-home-skin=fashion] #page-home .fa-word{position:absolute;left:-.015em;bottom:.07em;margin:0;z-index:2;font-family:"Bodoni 72","Bodoni MT","Didot","Playfair Display",Georgia,serif!important;font-weight:400;font-size:clamp(92px,25vw,400px);line-height:.8;letter-spacing:-.05em;color:#fff;mix-blend-mode:difference;pointer-events:none;user-select:none;white-space:nowrap}',
  'html[data-home-skin=fashion] #page-home #ws-cards{order:-2;margin:0 0 24px}',
  'html[data-home-skin=fashion] #page-home #ws-cards h3{font-family:"Bodoni 72","Bodoni MT","Didot","Playfair Display",Georgia,serif;font-style:italic;font-weight:400;font-size:24px;letter-spacing:0;text-transform:none;color:var(--fi);margin:0 0 6px}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid{display:flex!important;gap:14px;overflow-x:auto;padding:6px 2px 18px;scroll-snap-type:x proximity;cursor:grab;scrollbar-width:none}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid::-webkit-scrollbar{display:none}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid.drag{cursor:grabbing;scroll-snap-type:none}html[data-home-skin=fashion] #page-home #ws-cards .ws-grid.drag>*{pointer-events:none}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>*{--bg:var(--fk);--fgc:#fff;position:relative;flex:0 0 clamp(220px,19vw,280px);aspect-ratio:3/4;scroll-snap-align:start;display:flex!important;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center;padding:26px 20px 26px!important;background:var(--bg)!important;color:var(--fgc);border:0!important;border-radius:0!important;box-shadow:none!important;overflow:hidden;user-select:none;transform:none;transition:transform .3s}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>[data-ws=site]{--bg:var(--fp);--fgc:var(--fi)}html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>[data-ws=media]{--bg:var(--fi);--fgc:#fff}html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>[data-ws=proj]{--bg:var(--fs);--fgc:var(--fi)}html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>[data-ws=ai]{--bg:var(--fg);--fgc:#fff}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>*::before{content:""!important;display:block!important;position:absolute;left:50%;top:0;width:58%;height:46%;transform:translateX(-50%);border-radius:0 0 999px 999px;background:currentColor;opacity:.12;border:0!important;box-shadow:none!important}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>*::after{display:none!important}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>*:hover{transform:translateY(-6px)}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>* *{color:inherit;background:transparent!important;text-shadow:none}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>* .ws-ic{position:absolute;left:50%;top:9%;transform:translateX(-50%);width:76px;height:76px;border-radius:50%;font-size:34px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.92)!important;box-shadow:none}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>* b{display:block;font-family:"Bodoni 72","Bodoni MT","Didot","Playfair Display",Georgia,serif;font-weight:400;font-size:clamp(26px,2.3vw,34px);line-height:1.05;letter-spacing:-.01em;margin:0 0 8px}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>* .d{display:block;font-size:13px;line-height:1.45;max-width:22ch;margin:0 auto 14px;opacity:.88}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>* .ws-ch{display:flex;flex-wrap:wrap;justify-content:center;gap:5px}',
  'html[data-home-skin=fashion] #page-home #ws-cards .ws-grid>* button{background:transparent!important;border:1px solid currentColor!important;color:inherit!important;border-radius:999px!important;font-size:11px;padding:3px 9px;opacity:.9}',
  'html[data-home-skin=fashion] #page-home #cvHero,html[data-home-skin=fashion] #page-home #ws-jobs,html[data-home-skin=fashion] #page-home #l43-recent,html[data-home-skin=fashion] #page-home #cv-hub110,html[data-home-skin=fashion] #page-home #cvux-home-launch,html[data-home-skin=fashion] #page-home #cvhs-workflows,html[data-home-skin=fashion] #page-home #ws-obc,html[data-home-skin=fashion] #page-home #cvux-onboarding{background:#fff!important;border:1px solid var(--fi)!important;border-radius:0!important;box-shadow:none!important;color:var(--fi);margin-bottom:18px;backdrop-filter:none}',
  'html[data-home-skin=fashion] #page-home #cvHero{background:var(--fi)!important;color:#fff}',
  '@media(max-width:820px){html[data-home-skin=sky] #cv150-skins,html[data-home-skin=fashion] #cv150-skins{position:relative;top:auto;right:auto;order:-5;align-self:flex-start;margin:0 0 12px}html[data-home-skin=fashion] #page-home .fa-arch{width:80%;height:56%;right:-10%}html[data-home-skin=fashion] #page-home .fa-word{font-size:30vw}html[data-home-skin=fashion] #page-home .fa-ring{display:none}html[data-home-skin=fashion] #page-home #cv150-fa{min-height:560px}}',
  '@media(max-width:820px){' + S + ' #cv150-sky{grid-template-columns:1fr}' + S + ' #cv150-art{width:min(100%,320px);margin:6px auto 24px}' + S + ' #cv150-sky h2{max-width:none}}',
  '@media(max-width:560px){html[data-home-skin=classic] #cv150-skins{bottom:76px}' + S + '{padding-top:30px;border-radius:10px}}',
  /* đồng bộ nút chính vàng đen */
  'html[data-home-skin=sky] #page-home :is(#cv150-cta .p,.btn-primary,#ws-jobs>button,#ws-jgo,#ws-obc button),html[data-home-skin=fashion] #page-home :is(.fa-cta .p,.btn-primary,#ws-jobs>button,#ws-jgo,#ws-obc button),html[data-home-skin=tech] #page-home :is(.t-con button,.btn-primary,#ws-jobs>button,#ws-jgo,#ws-obc button){background:#FFD84A!important;background-image:none!important;color:#0D0D0F!important;border:1.5px solid #0D0D0F!important;box-shadow:none!important}',
  'html[data-home-skin=sky] #page-home :is(#cv150-cta .p,.btn-primary):hover,html[data-home-skin=fashion] #page-home :is(.fa-cta .p,.btn-primary):hover,html[data-home-skin=tech] #page-home :is(.t-con button,.btn-primary):hover{background:#FFE27A!important;transform:none}',
  'html[data-home-skin=sky] #page-home #cv150-cta .p,html[data-home-skin=tech] #page-home .t-con button{border-radius:8px!important}',
  'html[data-home-skin=fashion] #page-home :is(.fa-cta .p,.btn-primary,#ws-jobs>button,#ws-jgo,#ws-obc button){border-radius:999px!important}',
  'html[data-home-skin=tech] #page-home .t-con button{border-color:#FFD84A!important}',
  'html[data-home-skin] #cv150-skins button[aria-pressed=true]{background:#FFD84A!important;color:#0D0D0F!important}',
  'html[data-home-skin=sky]:has(#page-home.active) header.top #ws-export,html[data-home-skin=sky]:has(#page-home.active) header.top .btn.cvExport,html[data-home-skin=sky] header.top #ws-export,html[data-home-skin=sky] header.top .btn.cvExport,html[data-home-skin=fashion]:has(#page-home.active) header.top #ws-export,html[data-home-skin=fashion]:has(#page-home.active) header.top .btn.cvExport,html[data-home-skin=fashion] header.top #ws-export,html[data-home-skin=fashion] header.top .btn.cvExport,html[data-home-skin=tech]:has(#page-home.active) header.top #ws-export,html[data-home-skin=tech]:has(#page-home.active) header.top .btn.cvExport,html[data-home-skin=tech] header.top #ws-export,html[data-home-skin=tech] header.top .btn.cvExport{background:#FFD84A!important;background-image:none!important;color:#0D0D0F!important;border:1.5px solid #0D0D0F!important;box-shadow:none!important}',
  'html[data-home-skin=sky]:has(#page-home.active) header.top #ws-export *,html[data-home-skin=sky]:has(#page-home.active) header.top .btn.cvExport *,html[data-home-skin=sky] header.top #ws-export *,html[data-home-skin=sky] header.top .btn.cvExport *,html[data-home-skin=fashion]:has(#page-home.active) header.top #ws-export *,html[data-home-skin=fashion]:has(#page-home.active) header.top .btn.cvExport *,html[data-home-skin=fashion] header.top #ws-export *,html[data-home-skin=fashion] header.top .btn.cvExport *,html[data-home-skin=tech]:has(#page-home.active) header.top #ws-export *,html[data-home-skin=tech]:has(#page-home.active) header.top .btn.cvExport *,html[data-home-skin=tech] header.top #ws-export *,html[data-home-skin=tech] header.top .btn.cvExport *{color:#0D0D0F!important}',
  'html[data-home-skin=tech]:has(#page-home.active) header.top #ws-export,html[data-home-skin=tech]:has(#page-home.active) header.top .btn.cvExport{border-color:#FFD84A!important}',
  ].join('\n');
  document.head.appendChild(s);
}
function build() {
  var p = document.getElementById('page-home'); if (!p) return false;
  if (!document.getElementById('cv150-sky')) {
    var d = document.createElement('div'); d.id = 'cv150-sky';
    d.innerHTML = '<div><h2>Bắt đầu từ một khung trống.</h2><p>Poster, CV 3D, website và video. Làm ngay trên máy bạn, không cần tài khoản, không tốn phí.</p><div id="cv150-cta"><button type="button" class="p" data-go="design">Tạo thiết kế mới</button><button type="button" class="q" data-go="ai">Nhờ AI dựng giúp</button></div></div>'
      + '<div id="cv150-art"><div class="tabs" role="tablist" aria-label="Loại sản phẩm"><button type="button" role="tab" data-t="poster" aria-selected="true">Poster</button><button type="button" role="tab" data-t="cv" aria-selected="false">CV 3D</button><button type="button" role="tab" data-t="web" aria-selected="false">Website</button><button type="button" role="tab" data-t="video" aria-selected="false">Video</button></div>'
      + '<div class="lab"><span id="cv150-name">Poster tuyển dụng</span><span id="cv150-size">1080 × 1350</span></div>'
      + '<div class="cvstage"><div class="fr" data-t="poster">'
      + '<div class="tp t-poster"><div class="sun"></div><div class="bar"><i></i></div></div>'
      + '<div class="tp t-cv"><div class="nv"><u></u><u></u><u></u></div><div class="cubew"><div class="cube"><i></i><i></i><i></i><i></i><i></i><i></i></div></div></div>'
      + '<div class="tp t-web"><div class="nv"><u></u><u></u><u></u></div><div class="hb"></div><div class="bt">Đặt bàn ngay</div></div>'
      + '<div class="tp t-video"><div class="pv"></div><div class="pl"></div><div class="cvtl"><b><i style="left:4%;width:38%"></i><i style="left:46%;width:30%"></i></b><b><i style="left:12%;width:52%"></i></b><b><i style="left:2%;width:24%"></i><i style="left:58%;width:34%"></i></b></div><div class="ph"></div></div>'
      + '<div class="gd gv" data-g="50" style="left:50%"></div><div class="gd gv" data-g="8" style="left:8%"></div><div class="gd gh" data-g="h"></div>'
      + '<div class="tx tx-poster"><div class="sl"><u></u><u></u><u></u><u></u></div><b>Chúng tôi<br>đang tuyển</b><span>Nhân sự · Hà Nội · Toàn thời gian</span><div class="cur"><svg viewBox="0 0 16 16"><path d="M1 1l5.5 14 2-5.5L14 7.5z"/></svg><em>Hà</em></div></div>'
      + '<div class="tx tx-cv"><div class="sl"><u></u><u></u><u></u><u></u></div><b>Trần Thu Linh</b><span>Nhà thiết kế sản phẩm</span></div>'
      + '<div class="tx tx-web"><div class="sl"><u></u><u></u><u></u><u></u></div><b>Cà phê rang<br>tại Đà Lạt</b></div>'
      + '<div class="tx tx-video"><div class="sl"><u></u><u></u><u></u><u></u></div><b>Mở đầu</b><span>00:00 – 00:12</span></div>'
      + '</div></div>'
      + '<div class="sw" role="group" aria-label="Màu chủ đạo"><button type="button" data-c="#FFD84A" aria-label="Vàng" aria-pressed="true" style="background:#FFD84A"></button><button type="button" data-c="#FF5FA8" aria-label="Hồng" aria-pressed="false" style="background:#FF5FA8"></button><button type="button" data-c="#22C7E8" aria-label="Xanh ngọc" aria-pressed="false" style="background:#22C7E8"></button><button type="button" data-c="#7C4DFF" aria-label="Tím" aria-pressed="false" style="background:#7C4DFF"></button><button type="button" data-c="#2BD48A" aria-label="Xanh lá" aria-pressed="false" style="background:#2BD48A"></button><i>Kéo chữ, đổi màu thử</i></div>'
      + '<button type="button" class="go" id="cv150-go" data-go="design">Mở trong Poster Studio</button></div>';
    d.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-go]'); if (b && window.CVWS && CVWS.open) CVWS.open(b.getAttribute('data-go')); });
    p.insertBefore(d, p.firstChild);
  }
  if (!document.getElementById('cv150-fa')) {
    var fa = document.createElement('div'); fa.id = 'cv150-fa';
    fa.innerHTML = '<div class="fa-arch"></div><div class="fa-ring"></div><div class="fa-copy"><h2>Mọi thứ bạn làm ra, như một bộ sưu tập.</h2><p>Poster, CV 3D, website và video. Làm ngay trên máy bạn, không cần tài khoản, không tốn phí.</p><div class="fa-cta"><button type="button" class="p" data-go="design">Bắt đầu thiết kế</button><button type="button" class="q" data-go="ai">Nhờ AI dựng giúp</button></div></div><div class="fa-word" aria-hidden="true">canvio</div>';
    fa.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-go]'); if (b && window.CVWS && CVWS.open) CVWS.open(b.getAttribute('data-go')); });
    p.insertBefore(fa, p.firstChild);
  }
  if (!document.getElementById('cv150-tech')) {
    var te = document.createElement('div'); te.id = 'cv150-tech';
    te.innerHTML = '<div class="t-l"><span class="t-st"><i></i>Chạy trên máy bạn · không gửi dữ liệu</span><h2>Thương hiệu nhân sự,<em>dựng trong một phút.</em></h2><p class="t-sub">Mô tả việc cần làm. CANVIO dựng poster tuyển dụng, banner, thẻ nhân viên và sơ đồ tổ chức ngay trên máy bạn.</p>'
      + '<form class="t-con" id="cv150t-form" autocomplete="off"><label for="cv150t-in" style="position:absolute;left:-9999px">Mô tả việc cần làm</label><input id="cv150t-in" type="text" maxlength="160" placeholder="Ví dụ: poster tuyển Product Designer, văn phòng Hà Nội"><button type="submit" id="cv150t-go">Dựng ngay</button></form>'
      + '<div class="t-sug" role="group" aria-label="Gợi ý"><button type="button">Poster tuyển dụng</button><button type="button">Thẻ nhân viên</button><button type="button">Sơ đồ tổ chức</button><button type="button">Slide onboarding</button></div><div class="t-stat" id="cv150t-stat" aria-live="polite"></div></div>'
      + '<div id="cv150t-stage" aria-hidden="true"><div class="t-in"><div class="tc po"><i class="pc"></i><b>Product<br>Designer</b><span>Chúng tôi đang tìm bạn</span><u>Nộp hồ sơ</u></div><div class="tc bn"><b>Nơi ý tưởng được lắng nghe</b><span><i>Văn hoá</i><i>Phúc lợi</i><i>Lộ trình</i></span></div><div class="tc bd"><div class="av"></div><b>Nguyễn Minh Anh</b><span>Product Designer</span><div class="qr"></div></div><div class="t-beam"></div></div></div>';
    p.insertBefore(te, p.firstChild);
  }
  if (!document.getElementById('cv150-skins')) {
    var k = document.createElement('div'); k.id = 'cv150-skins'; k.setAttribute('role', 'group'); k.setAttribute('aria-label', 'Kiểu giao diện Tổng quan');
    [['tech', 'Công nghệ'], ['fashion', 'Thời trang'], ['sky', 'Bàn thiết kế'], ['classic', 'Cổ điển']].forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-skin', x[0]); b.textContent = x[1]; b.addEventListener('click', function () { set(x[0]); }); k.appendChild(b); });
    p.appendChild(k);
  }
  return true;
}
function toggleOutside() {
  var b = document.getElementById('cv150-skins'); if (!b) return;
  if (get() === 'classic') { if (b.parentNode !== document.body) document.body.appendChild(b); }
  else { var p = document.getElementById('page-home'); if (p && b.parentNode !== p) p.appendChild(b); }
}
function drag() {
  var g = document.querySelector('#ws-cards .ws-grid'); if (!g || g.__cv150) return; g.__cv150 = 1;
  var down = false, sx = 0, sl = 0, moved = 0;
  g.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') return; down = true; moved = 0; sx = e.clientX; sl = g.scrollLeft; });
  window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = 1; g.classList.add('drag'); } if (moved) g.scrollLeft = sl - dx; });
  window.addEventListener('pointerup', function () { if (!down) return; down = false; setTimeout(function () { g.classList.remove('drag'); }, 0); });
  g.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
}
var TYPES = { poster: ['Poster tuyển dụng', '1080 × 1350', 'design', 'Mở trong Poster Studio'], cv: ['CV 3D · trang cá nhân', '1440 × 900', 'site', 'Mở trong CV Studio'], web: ['Website quán cà phê', '1440 × 900', 'site', 'Mở trong Website Builder'], video: ['Video giới thiệu', '1920 × 1080', 'media', 'Mở trong Video Studio'] };
function art() {
  var A = document.getElementById('cv150-art'); if (!A || A.__cv150) return; A.__cv150 = 1;
  var fr = A.querySelector('.fr'), go = document.getElementById('cv150-go');
  function tab(t) {
    fr.setAttribute('data-t', t); var d = TYPES[t];
    [].forEach.call(A.querySelectorAll('.tabs button'), function (b) { b.setAttribute('aria-selected', b.getAttribute('data-t') === t ? 'true' : 'false'); });
    document.getElementById('cv150-name').textContent = d[0]; document.getElementById('cv150-size').textContent = d[1];
    go.textContent = d[3]; go.setAttribute('data-go', d[2]);
    [].forEach.call(fr.querySelectorAll('.tx'), function (x) { x.style.left = ''; x.style.top = ''; });
  }
  A.querySelector('.tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) tab(b.getAttribute('data-t')); });
  A.querySelector('.sw').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; fr.style.setProperty('--acc', b.getAttribute('data-c')); [].forEach.call(A.querySelectorAll('.sw button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); });
  var g50 = fr.querySelector('[data-g="50"]'), g8 = fr.querySelector('[data-g="8"]'), gh = fr.querySelector('[data-g=h]'), cur = null;
  fr.addEventListener('pointerdown', function (e) {
    var x = e.target.closest('.tx'); if (!x || getComputedStyle(x).display === 'none') return;
    var r = fr.getBoundingClientRect(), xr = x.getBoundingClientRect();
    cur = { x: x, ox: e.clientX - xr.left, oy: e.clientY - xr.top, r: r }; x.classList.add('dr'); A.classList.add('live'); try { x.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault();
  });
  fr.addEventListener('pointermove', function (e) {
    if (!cur) return; var r = cur.r, w = cur.x.offsetWidth, h = cur.x.offsetHeight;
    var l = e.clientX - r.left - cur.ox, t = e.clientY - r.top - cur.oy; l = Math.max(0, Math.min(r.width - w, l)); t = Math.max(0, Math.min(r.height - h, t));
    var on50 = Math.abs(l + w / 2 - r.width / 2) < 7, on8 = Math.abs(l - r.width * 0.08) < 7, onh = Math.abs(t + h / 2 - r.height / 2) < 7;
    if (on50) l = r.width / 2 - w / 2; else if (on8) l = r.width * 0.08; if (onh) t = r.height / 2 - h / 2;
    cur.x.style.left = (l / r.width * 100) + '%'; cur.x.style.top = (t / r.height * 100) + '%';
    g50.classList.toggle('on', on50); g8.classList.toggle('on', on8 && !on50); gh.classList.toggle('on', onh);
  });
  function up() { if (!cur) return; cur.x.classList.remove('dr'); cur = null; [g50, g8, gh].forEach(function (g) { g.classList.remove('on'); }); }
  fr.addEventListener('pointerup', up); fr.addEventListener('pointercancel', up);
}
function tech() {
  var T = document.getElementById('cv150-tech'); if (!T || T.__cv150) return; T.__cv150 = 1;
  var inp = document.getElementById('cv150t-in'), stage = document.getElementById('cv150t-stage'), stat = document.getElementById('cv150t-stat'), form = document.getElementById('cv150t-form');
  var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var txt = 'Poster tuyển Product Designer, văn phòng Hà Nội, hạn nộp 30/12', stopped = false;
  function submit(v) {
    v = (v || inp.value || '').trim(); var j = document.getElementById('ws-jin'), g = document.getElementById('ws-jgo');
    if (j && g) { j.value = v; g.click(); } else if (window.CVWS && CVWS.open) CVWS.open('ai');
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
  T.querySelector('.t-sug').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; stopped = true; inp.value = b.textContent; inp.focus(); });
  inp.addEventListener('focus', function () { stopped = true; });
  var wrap = stage;
  if (!reduce) {
    wrap.addEventListener('pointermove', function (e) { var r = wrap.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; var t = wrap.firstChild; t.style.setProperty('--ry', (x * 12).toFixed(2) + 'deg'); t.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg'); });
    wrap.addEventListener('pointerleave', function () { var t = wrap.firstChild; t.style.setProperty('--ry', '0deg'); t.style.setProperty('--rx', '0deg'); });
  }
  function steps() {
    stage.classList.add('run'); stat.innerHTML = '<b>●</b> Đang dựng poster…';
    setTimeout(function () { stat.innerHTML = '<b>●</b> Đang dựng banner…'; }, 800);
    setTimeout(function () { stat.innerHTML = '<b>●</b> Đang dựng thẻ nhân viên…'; }, 1600);
    setTimeout(function () { stat.innerHTML = '<b>✓</b> Xong: poster, banner, thẻ nhân viên'; stage.classList.add('done'); }, 3000);
  }
  if (reduce) { inp.value = txt; stage.classList.add('done'); stat.innerHTML = '<b>✓</b> Xong: poster, banner, thẻ nhân viên'; return; }
  var i = 0; (function type() { if (stopped) { steps(); return; } if (i <= txt.length) { inp.value = txt.slice(0, i++); setTimeout(type, 26); } else setTimeout(steps, 350); })();
}
function spot() {
  var g = document.querySelector('#ws-cards .ws-grid'); if (!g || g.__cv150s) return; g.__cv150s = 1;
  g.addEventListener('pointermove', function (e) { var c = e.target.closest && e.target.closest('.ws-grid>*'); if (!c) return; var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
}
function init() { css(); if (!build()) return false; art(); drag(); tech(); spot(); apply(); toggleOutside(); return true; }
var tries = 0; (function loop() { if (init() || ++tries > 40) return; setTimeout(loop, 250); })();
window.CVHomeSkyP150 = { version: '150.10.0', get: get, set: set, init: init };
})();
