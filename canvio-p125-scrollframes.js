/* P125.1 · Video -> chuỗi khung scrub theo cuộn (canvas, nạp lười) + xuất 1 file HTML offline.
   Additive: thẻ mới trong Website Engine, không đổi trình dựng. Có fallback prefers-reduced-motion (hiện khung đầu, không cuộn-scrub).
   Giới hạn: khung nhúng base64 (WebP, rơi về JPEG); cảnh báo khi > 20 MB. Không giải mã được codec trình duyệt không hỗ trợ. */
(function () {
'use strict';
if (window.CVScrollFramesP125) return;
var MAX_FRAMES = 240, MIN_FRAMES = 8, WARN_BYTES = 20 * 1024 * 1024;
function clamp(n, a, b) { n = Number(n); if (!isFinite(n)) n = a; return Math.max(a, Math.min(b, n)); }
function plan(duration, frames) {
  var d = Number(duration); if (!(d > 0) || !isFinite(d)) return [];
  var n = Math.round(clamp(frames, MIN_FRAMES, MAX_FRAMES)), out = [];
  for (var i = 0; i < n; i++) out.push(Math.min(d - 0.001, (i + 0.5) * d / n));
  return out;
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function cleanFrames(frames) { return (Array.isArray(frames) ? frames : []).filter(function (u) { return typeof u === 'string' && /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+\/=]+$/.test(u); }); }
function estimateBytes(frames) { return cleanFrames(frames).reduce(function (s, u) { return s + u.length; }, 0); }
function buildHtml(frames, o) {
  o = o || {}; var f = cleanFrames(frames); if (f.length < 2) throw new Error('Cần ít nhất 2 khung hợp lệ.');
  var w = Math.round(clamp(o.width, 64, 4096)), h = Math.round(clamp(o.height, 64, 4096)), title = esc(o.title || 'Trang cuộn'), len = Math.round(clamp(o.scrollScreens || Math.max(3, Math.ceil(f.length / 15)), 1, 12)) * 100, caption = esc(o.caption || '');
  var data = JSON.stringify(f).replace(/</g, '\\u003c');
  return '<!DOCTYPE html>\n<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title>' +
    '<style>html,body{margin:0;background:#0b1220;color:#f8fafc;font-family:system-ui,sans-serif}#track{height:' + len + 'vh;position:relative}#stage{position:sticky;top:0;height:100vh;display:grid;place-items:center;overflow:hidden}canvas{max-width:100%;max-height:100vh;object-fit:contain}#cap{position:absolute;left:0;right:0;bottom:6vh;text-align:center;font-size:clamp(18px,3vw,36px);font-weight:700;text-shadow:0 2px 12px #000}@media (prefers-reduced-motion:reduce){#track{height:100vh}}</style></head>' +
    '<body><div id="track"><div id="stage"><canvas id="c" width="' + w + '" height="' + h + '" role="img" aria-label="' + title + '"></canvas><div id="cap">' + caption + '</div></div></div>' +
    '<script>(function(){var F=' + data + ',imgs=new Array(F.length),cv=document.getElementById("c"),x=cv.getContext("2d"),cur=-1,rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;' +
    'function load(i){if(i<0||i>=F.length||imgs[i])return;var m=new Image();m.onload=function(){imgs[i]=m;if(cur===i)draw(i)};m.src=F[i];imgs[i]=imgs[i]||null}' +
    'function draw(i){var m=imgs[i];if(!m||!m.complete)return;x.drawImage(m,0,0,cv.width,cv.height)}' +
    'function show(i){i=Math.max(0,Math.min(F.length-1,i));if(i===cur)return;cur=i;if(imgs[i]&&imgs[i].complete)draw(i);else load(i);for(var k=1;k<=3;k++){load(i+k);load(i-k)}}' +
    'function onScroll(){var t=document.getElementById("track"),r=t.getBoundingClientRect(),p=-r.top/Math.max(1,r.height-innerHeight);show(Math.round(Math.max(0,Math.min(1,p))*(F.length-1)))}' +
    'load(0);show(0);if(!rm){var tick=false;addEventListener("scroll",function(){if(!tick){tick=true;requestAnimationFrame(function(){tick=false;onScroll()})}},{passive:true});addEventListener("resize",onScroll);onScroll()}window.__scrollFrames={count:F.length,current:function(){return cur}}})();<\/script></body></html>';
}
function pickType() { try { var c = document.createElement('canvas'); c.width = c.height = 1; return c.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'image/webp' : 'image/jpeg'; } catch (e) { return 'image/jpeg'; } }
function extract(file, opt, onProgress) {
  opt = opt || {};
  return new Promise(function (ok, no) {
    if (!file || !/^video\//.test(file.type || '')) { no(new Error('Chọn một tệp video.')); return; }
    var url = URL.createObjectURL(file), v = document.createElement('video'), done = false;
    v.muted = true; v.preload = 'auto'; v.playsInline = true;
    function fin(err, res) { if (done) return; done = true; try { URL.revokeObjectURL(url); } catch (e) {} v.removeAttribute('src'); err ? no(err) : ok(res); }
    v.onerror = function () { fin(new Error('Trình duyệt không giải mã được video này.')); };
    v.onloadedmetadata = function () {
      var times = plan(v.duration, opt.frames || 60), vw = v.videoWidth || 640, vh = v.videoHeight || 360, tw = Math.round(clamp(opt.width, 160, 1920)), th = Math.round(tw * vh / vw), c = document.createElement('canvas'), q = clamp(opt.quality, 0.3, 0.95), type = pickType(), out = [], i = 0;
      if (!times.length) { fin(new Error('Video không có thời lượng hợp lệ.')); return; }
      c.width = tw; c.height = th; var x = c.getContext('2d');
      v.onseeked = function () { try { x.drawImage(v, 0, 0, tw, th); out.push(c.toDataURL(type, q)); } catch (e) { fin(e); return; } if (onProgress) onProgress(out.length, times.length); i++; if (i >= times.length) fin(null, { frames: out, width: tw, height: th, type: type }); else v.currentTime = times[i]; };
      v.currentTime = times[0];
    };
    setTimeout(function () { fin(new Error('Hết thời gian trích khung (video quá nặng?).')); }, 120000);
    v.src = url;
  });
}
function download(name, text) { var b = new Blob([text], { type: 'text/html' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }
function mount() {
  var page = document.querySelector('#page-webEngine'); if (!page || page.querySelector('#cv125-card')) return false;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv125-card'; card.style.marginBottom = '12px';
  card.innerHTML = '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><b>Web cuộn từ video (P125.1)</b><input type="file" id="cv125-file" accept="video/*" aria-label="Chọn video"><label class="tiny">Số khung <input type="number" id="cv125-n" value="60" min="8" max="240" style="width:64px"></label><label class="tiny">Rộng px <input type="number" id="cv125-w" value="960" min="160" max="1920" style="width:72px"></label><button type="button" class="btn btn-soft sm" id="cv125-run">Trích khung &amp; xuất HTML</button><span class="tiny" id="cv125-out" role="status" aria-live="polite">Video cuộn tới đâu, khung chạy tới đó. Xuất 1 tệp HTML dùng offline.</span></div>';
  var tb = page.querySelector('.card'); tb && tb.parentNode ? tb.parentNode.insertBefore(card, tb.nextSibling) : page.appendChild(card);
  card.querySelector('#cv125-run').addEventListener('click', function () {
    var out = card.querySelector('#cv125-out'), btn = this, f = card.querySelector('#cv125-file').files[0];
    if (!f) { out.textContent = 'Chọn một video trước.'; return; }
    btn.disabled = true; out.textContent = 'Đang trích khung…';
    extract(f, { frames: card.querySelector('#cv125-n').value, width: card.querySelector('#cv125-w').value }, function (a, b) { out.textContent = 'Đang trích khung ' + a + '/' + b + '…'; }).then(function (r) {
      var bytes = estimateBytes(r.frames), html = buildHtml(r.frames, { width: r.width, height: r.height, title: f.name.replace(/\.[^.]+$/, '') });
      download('scroll-' + Date.now().toString(36) + '.html', html);
      out.textContent = 'Đã xuất ' + r.frames.length + ' khung (' + (bytes / 1048576).toFixed(1) + ' MB)' + (bytes > WARN_BYTES ? '. Hơi nặng cho di động: giảm số khung hoặc chiều rộng.' : '.');
    }).catch(function (e) { out.textContent = String(e && e.message || e).slice(0, 140); }).then(function () { btn.disabled = false; });
  });
  return true;
}
function ready() { try { mount(); var p = document.querySelector('#page-webEngine'); if (p && !p.__cv125Obs && window.MutationObserver) { p.__cv125Obs = new MutationObserver(function () { if (!p.querySelector('#cv125-card')) mount(); }); p.__cv125Obs.observe(p, { childList: true, subtree: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function tests() {
  var p = plan(10, 10), good = 'data:image/jpeg;base64,/9j/AAAA', bad = ['javascript:alert(1)', 'data:text/html;base64,AAAA', 'data:image/jpeg;base64,AA"><script>'];
  var html = ''; try { html = buildHtml([good, good, good], { width: 100, height: 60, title: '<b>x</b>', caption: '"><img>' }); } catch (e) {}
  var threw = false; try { buildHtml([good], {}); } catch (e) { threw = true; }
  return {
    planEvenlySpaced: p.length === 10 && Math.abs(p[1] - p[0] - 1) < 1e-9 && p[9] < 10,
    planClampsCount: plan(5, 1).length === 8 && plan(5, 9999).length === 240,
    planBadDuration: plan(0, 20).length === 0 && plan(NaN, 20).length === 0 && plan(-3, 20).length === 0,
    filtersUnsafeFrames: cleanFrames([good].concat(bad, [42, null])).length === 1,
    htmlEscapesTitleAndCaption: html.indexOf('<b>x</b>') < 0 && html.indexOf('"><img>') < 0 && html.indexOf('&lt;b&gt;') > 0,
    htmlHasReducedMotionFallback: html.indexOf('prefers-reduced-motion') > 0 && html.indexOf('requestAnimationFrame') > 0,
    htmlNoExternalRequests: !/(src|href)=["']?https?:/i.test(html) && !/fetch\(|XMLHttpRequest/.test(html),
    defaultScrollLengthIsLong: /id="track"/.test(html) && /#track\{height:300vh/.test(html), needsTwoFrames: threw, estimateBytes: estimateBytes([good, good, 'x']) === good.length * 2
  };
}
window.CVScrollFramesP125 = { version: '125.1.0', plan: plan, buildHtml: buildHtml, extract: extract, estimateBytes: estimateBytes, mount: mount, tests: tests };
})();
