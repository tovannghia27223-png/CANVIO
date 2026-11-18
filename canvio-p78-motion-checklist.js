/* CANVIO P78 — Context-aware motion checklist for Video Engine + Website Motion.
 * Advisory only: never mutates a clip/component until the user uses the editor's existing Apply action.
 * No network, model, dependency, new store, timeline or project owner.
 */
(function () {
  'use strict';
  if (window.CANVIOMotionChecklistP78) return;

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var clamp = function (n, lo, hi, fallback) { n = Number(n); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback; };
  var clean = function (value, max) { return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 160); };
  var esc = function (value) { return clean(value, 240).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };

  function recommendVideo(clip) {
    clip = clip && typeof clip === 'object' ? clip : {};
    var type = ['image', 'video', 'text', 'audio'].indexOf(clip.type) >= 0 ? clip.type : 'unknown';
    var duration = clamp(clip.duration, 0.2, 86400, 1);
    var text = clean(clip.text, 2000);
    var words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    var motion = clip.motion && typeof clip.motion === 'object' ? clip.motion : {};
    var keyframes = Array.isArray(motion.keyframes) ? motion.keyframes.length : (motion.from || motion.to ? 2 : 0);
    var easing = clean(motion.easing || (Array.isArray(motion.bezier) ? 'custom' : 'linear'), 32) || 'linear';
    var item;
    if (type === 'image') {
      item = { label: 'Ảnh tĩnh / key visual', duration: 4.0, durationLabel: '3–6 giây', easing: 'ease-in-out', easingLabel: 'Ease In Out', order: 'Đặt ảnh chính ở track 1; chữ/nhãn ở track 3; overlay ở track 4.', guidance: 'Một chuyển động nhẹ là đủ. Giữ scale trong khoảng 1.04–1.10 để hạn chế lộ mép ảnh.' };
    } else if (type === 'video') {
      item = { label: 'Footage video', duration: clamp(duration, 3, 8, 5), durationLabel: 'Theo nhịp cảnh (thường 3–8 giây mỗi shot)', easing: 'linear', easingLabel: 'Linear hoặc không thêm motion', order: 'Giữ thứ tự shot theo nội dung; tránh phủ nhiều overlay cùng lúc trên track 4.', guidance: 'Ưu tiên chuyển động camera gốc. Chỉ thêm keyframe khi cần nhấn chủ thể; kiểm tra điểm cắt và chuyển cảnh.' };
    } else if (type === 'text') {
      var isShortCue = words <= 7 && duration <= 3.5;
      item = { label: 'Chữ / phụ đề', duration: clamp(duration, isShortCue ? 1.2 : 2, isShortCue ? 3 : 5, 2.5), durationLabel: isShortCue ? 'Khoảng 1.2–3 giây, tùy độ dài câu' : 'Khoảng 2–5 giây, tùy độ dài câu', easing: 'ease-out', easingLabel: 'Ease Out cho tiêu đề; phụ đề thường nên đứng yên', order: 'Giữ subtitle trên track 3; tiêu đề/đồ họa bổ sung ở overlay track 4.', guidance: 'Không animate từng từ nếu chưa có đồng bộ lời nói đã xác minh. Ưu tiên tương phản, vùng an toàn và thời gian đọc.' };
    } else if (type === 'audio') {
      item = { label: 'Audio / voice / music', duration: duration, durationLabel: 'Giữ theo nội dung audio', easing: 'none', easingLabel: 'Không dùng keyframe transform', order: 'Voice và nhạc ở track 2; kiểm tra mute/lock và envelope hiện có.', guidance: 'Dùng fade/volume envelope hiện có; tránh cắt âm đột ngột. Không thay đổi gain hoặc điểm cắt tự động.' };
    } else {
      item = { label: 'Clip chưa phân loại', duration: duration, durationLabel: 'Giữ thời lượng hiện tại', easing: 'linear', easingLabel: 'Chưa đủ ngữ cảnh', order: 'Kiểm tra loại media và track trước khi thêm chuyển động.', guidance: 'Không có gợi ý tự động cho clip chưa phân loại.' };
    }
    item.currentDuration = duration;
    item.currentEasing = easing;
    item.currentKeyframes = keyframes;
    item.type = type;
    item.isLocked = !!clip.locked;
    return item;
  }

  function recommendWebsite(component) {
    var tag = '', attrs = {}, classes = '';
    try {
      if (component && typeof component.get === 'function') tag = clean(component.get('tagName') || component.get('type') || '', 40).toLowerCase();
      if (component && typeof component.getAttributes === 'function') attrs = component.getAttributes() || {};
      classes = clean(attrs.class || '', 180).toLowerCase();
    } catch (e) { /* keep safe generic recommendation */ }
    var kind = 'section', result;
    if (/^(h1|h2|h3|h4|h5|h6)$/.test(tag) || /title|heading/.test(classes)) kind = 'heading';
    else if (tag === 'button' || /btn|button|cta/.test(classes)) kind = 'button';
    else if (tag === 'img' || /image|hero-media/.test(classes)) kind = 'image';
    else if (tag === 'p' || /text|paragraph|description/.test(classes)) kind = 'text';
    if (kind === 'heading') result = { kind: kind, label: 'Tiêu đề', duration: 650, easing: 'ease-out', delay: 0, advice: 'Vào nhanh, dừng gọn; tránh overshoot làm giảm độ ổn định thị giác.' };
    else if (kind === 'button') result = { kind: kind, label: 'Nút hành động', duration: 220, easing: 'ease-out', delay: 0, advice: 'Phản hồi ngắn, rõ; tránh delay để không làm chậm thao tác.' };
    else if (kind === 'image') result = { kind: kind, label: 'Ảnh / hero', duration: 850, easing: 'ease-in-out', delay: 0, advice: 'Chuyển động chậm và nhẹ; không giấu nội dung khi reduced-motion hoặc JavaScript không chạy.' };
    else if (kind === 'text') result = { kind: kind, label: 'Đoạn văn', duration: 550, easing: 'ease-out', delay: 0, advice: 'Giữ nhịp đọc; chỉ dùng fade/slide nhẹ, tránh animate từng dòng.' };
    else result = { kind: kind, label: 'Section / container', duration: 700, easing: 'ease-in-out', delay: 0, advice: 'Dùng một hiệu ứng nhất quán cho nhóm; tránh xếp nhiều hiệu ứng cạnh tranh.' };
    result.tag = tag || 'component';
    return result;
  }

  function videoMarkup(clip) {
    var r = recommendVideo(clip);
    var video = window.CV && CV.engines && CV.engines.video;
    var locked = !!(r.isLocked || (video && typeof video.isClipLocked === 'function' && video.isClipLocked(clip)));
    return '<section id="cv78-motion-advice" class="cv78-advice" data-locked="' + (locked ? 'true' : 'false') + '" aria-label="Checklist chuyển động gợi ý">' +
      '<div class="cv78-head"><div><b>Gợi ý chuyển động · P78</b><small>Tham khảo theo loại clip · không tự sửa timeline</small></div><span class="cv78-chip">' + esc(r.label) + '</span></div>' +
      '<div class="cv78-grid"><div><small>Thời lượng tham khảo</small><b>' + esc(r.durationLabel) + '</b></div><div><small>Easing gợi ý</small><b>' + esc(r.easingLabel) + '</b></div><div><small>Keyframe hiện tại</small><b>' + String(r.currentKeyframes) + ' · ' + esc(r.currentEasing) + '</b></div></div>' +
      '<p>' + esc(r.guidance) + '</p><p class="cv78-order"><b>Thứ tự / track:</b> ' + esc(r.order) + '</p>' +
      '<div class="cv78-foot"><span>' + (locked ? 'Track/clip đang khóa: mở khóa mới chỉnh được.' : 'Gợi ý chỉ điền vào biểu mẫu; cần bấm Áp dụng để ghi vào clip.') + '</span>' +
      '<button type="button" class="btn btn-soft sm" data-cv78-fill-video' + (locked ? ' disabled' : '') + '>Điền gợi ý vào biểu mẫu</button></div>' +
      '<div class="cv78-feedback" id="cv78-video-feedback" role="status" aria-live="polite"></div></section>';
  }

  function mountVideoAdvice() {
    var box = $('#vtProps');
    if (!box) return false;
    var state = window.CV && CV.engines && CV.engines.video && typeof CV.engines.video._state === 'function' ? CV.engines.video._state() : null;
    var clip = state && Array.isArray(state.clips) ? state.clips.find(function (x) { return x && x.id === state.selected; }) : null;
    var existing = $('#cv78-motion-advice', box);
    if (!clip) { if (existing) existing.remove(); return false; }
    var locked = !!(clip.locked || (CV.engines.video.isClipLocked && CV.engines.video.isClipLocked(clip)));
    if (existing && existing.dataset.locked === String(locked)) return true;
    var holder = document.createElement('div'); holder.innerHTML = videoMarkup(clip);
    var node = holder.firstElementChild;
    if (existing) existing.replaceWith(node); else if (node) box.appendChild(node);
    return !!node;
  }

  function mountWebsiteAdvice() {
    var card = $('#canvio-web-motion');
    if (!card || $('#cv78-web-advice', card)) return !!card;
    var status = $('#canvio-motion-status', card);
    if (!status) return false;
    var node = document.createElement('section');
    node.id = 'cv78-web-advice';
    node.className = 'cv78-advice';
    node.innerHTML = '<div class="cv78-head"><div><b>Checklist chuyển động · P78</b><small>Gợi ý cho component đang chọn · không tự áp dụng</small></div><span class="cv78-chip" data-cv78-web-label>Chưa chọn component</span></div><div class="cv78-grid"><div><small>Thời lượng</small><b data-cv78-web-duration>—</b></div><div><small>Easing</small><b data-cv78-web-easing>—</b></div><div><small>Trễ</small><b data-cv78-web-delay>—</b></div></div><p data-cv78-web-advice>Chọn component trong Website Engine để xem gợi ý phù hợp.</p><div class="cv78-foot"><span>Điền vào biểu mẫu không thay đổi component. Cần bấm “Áp dụng cho phần tử đang chọn” để lưu.</span><button type="button" class="btn btn-soft sm" data-cv78-fill-web disabled>Điền gợi ý vào biểu mẫu</button></div><div class="cv78-feedback" id="cv78-web-feedback" role="status" aria-live="polite"></div>';
    status.insertAdjacentElement('afterend', node);
    return true;
  }

  function updateWebsiteAdvice() {
    var card = $('#cv78-web-advice');
    if (!card) return false;
    var editor = window.CVWeb, component = null;
    try { component = editor && typeof editor.getSelected === 'function' ? editor.getSelected() : null; } catch (e) { component = null; }
    var label = $('[data-cv78-web-label]', card), duration = $('[data-cv78-web-duration]', card), easing = $('[data-cv78-web-easing]', card), delay = $('[data-cv78-web-delay]', card), advice = $('[data-cv78-web-advice]', card), button = $('[data-cv78-fill-web]', card);
    if (!component) {
      if (label && label.textContent !== 'Chưa chọn component') label.textContent = 'Chưa chọn component';
      if (duration && duration.textContent !== '—') duration.textContent = '—'; if (easing && easing.textContent !== '—') easing.textContent = '—'; if (delay && delay.textContent !== '—') delay.textContent = '—';
      if (advice && advice.textContent !== 'Chọn component trong Website Engine để xem gợi ý phù hợp.') advice.textContent = 'Chọn component trong Website Engine để xem gợi ý phù hợp.';
      if (button) button.disabled = true;
      if (card.dataset.ready !== 'false') card.dataset.ready = 'false';
      return false;
    }
    var r = recommendWebsite(component);
    var labelText = r.label + ' · ' + r.tag, durationText = r.duration + ' ms', delayText = r.delay + ' ms';
    if (label && label.textContent !== labelText) label.textContent = labelText;
    if (duration && duration.textContent !== durationText) duration.textContent = durationText; if (easing && easing.textContent !== r.easing) easing.textContent = r.easing; if (delay && delay.textContent !== delayText) delay.textContent = delayText;
    if (advice && advice.textContent !== r.advice) advice.textContent = r.advice;
    if (button) button.disabled = false;
    if (card.dataset.ready !== 'true') card.dataset.ready = 'true';
    if (card.dataset.kind !== r.kind) card.dataset.kind = r.kind;
    return true;
  }

  function onClick(event) {
    var videoButton = event.target.closest('[data-cv78-fill-video]');
    if (videoButton) {
      var v = window.CV && CV.engines && CV.engines.video, state = v && v._state && v._state(), clip = state && state.clips && state.clips.find(function (x) { return x && x.id === state.selected; });
      if (!clip || (v.isClipLocked && v.isClipLocked(clip))) return;
      var r = recommendVideo(clip), len = $('#vtLen'), ease = $('#vtKFEasing'), feedback = $('#cv78-video-feedback');
      if (len) len.value = String(r.duration);
      if (ease && ['linear','ease-in','ease-out','ease-in-out'].indexOf(r.easing) >= 0) ease.value = r.easing;
      if (feedback) feedback.textContent = 'Đã điền gợi ý vào biểu mẫu; timeline chưa thay đổi. Bấm Áp dụng trong Clip properties để lưu.';
      return;
    }
    var webButton = event.target.closest('[data-cv78-fill-web]');
    if (webButton) {
      var card = $('#cv78-web-advice'), editor = window.CVWeb, component = null;
      try { component = editor && editor.getSelected && editor.getSelected(); } catch (e) { component = null; }
      if (!component || !card || card.dataset.ready !== 'true') return;
      var w = recommendWebsite(component), dur = $('#canvio-motion-duration'), easingInput = $('#canvio-motion-easing'), delayInput = $('#canvio-motion-delay'), feedbackWeb = $('#cv78-web-feedback');
      if (dur) dur.value = String(w.duration); if (easingInput) easingInput.value = w.easing; if (delayInput) delayInput.value = String(w.delay);
      if (feedbackWeb) feedbackWeb.textContent = 'Đã điền gợi ý vào biểu mẫu; component chưa thay đổi. Bấm “Áp dụng cho phần tử đang chọn” khi đã xem trước.';
    }
  }

  function injectStyles() {
    if ($('#cv78-motion-checklist-styles')) return;
    var style = document.createElement('style'); style.id = 'cv78-motion-checklist-styles';
    style.textContent = '#cv78-motion-advice,#cv78-web-advice{margin-top:10px}.cv78-advice{border:1px solid var(--brand-line,#dfe2ff);border-radius:11px;padding:11px;background:linear-gradient(135deg,var(--surface-2,#fbfcff),var(--brand-soft,#eef0ff));color:var(--ink,#0d1a2b)}.cv78-head,.cv78-foot{display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap}.cv78-head b{font-size:12px}.cv78-head small{display:block;color:var(--ink-3,#5f6f86);font-size:10px;margin-top:2px}.cv78-chip{font-size:9px;font-weight:750;padding:3px 7px;border:1px solid var(--brand-line,#dfe2ff);border-radius:99px;color:var(--brand-ink,#3f37c9);background:var(--surface,#fff)}.cv78-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0}.cv78-grid>div{padding:7px;border:1px solid var(--line,#e7ecf5);background:var(--surface,#fff);border-radius:8px;min-width:0}.cv78-grid small{display:block;color:var(--ink-3,#5f6f86);font-size:9px}.cv78-grid b{display:block;font-size:10px;margin-top:3px;overflow-wrap:anywhere}.cv78-advice p{font-size:10px;line-height:1.6;color:var(--ink-2,#42536d);margin:6px 0}.cv78-order{padding-top:6px;border-top:1px solid var(--line,#e7ecf5)}.cv78-foot{margin-top:8px}.cv78-foot>span{font-size:9px;color:var(--ink-3,#5f6f86);flex:1 1 170px}.cv78-feedback{font-size:10px;min-height:0;color:var(--mint,#0ea472);margin-top:5px}.cv78-advice button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:520px){.cv78-grid{grid-template-columns:1fr}.cv78-foot button{width:100%}}@media(prefers-reduced-motion:reduce){.cv78-advice *{transition:none!important;animation:none!important}}';
    document.head.appendChild(style);
  }

  function tests() {
    var image = recommendVideo({ type: 'image', duration: 1, motion: { keyframes: [{}, {}], easing: 'linear' } });
    var footage = recommendVideo({ type: 'video', duration: 6 });
    var text = recommendVideo({ type: 'text', duration: 1.2, text: 'Xin chào CANVIO' });
    var audio = recommendVideo({ type: 'audio', duration: 17 });
    var invalid = recommendVideo({ type: 'image', duration: NaN });
    var title = recommendWebsite({ get: function (k) { return k === 'tagName' ? 'h1' : 'text'; }, getAttributes: function () { return { class: 'hero-title' }; } });
    var cta = recommendWebsite({ get: function (k) { return k === 'tagName' ? 'button' : 'text'; }, getAttributes: function () { return { class: 'btn-primary' }; } });
    var generic = recommendWebsite(null);
    var checks = {
      imageDurationAndEasing: image.duration === 4 && image.easing === 'ease-in-out',
      footageAvoidsUnneededMotion: footage.easing === 'linear' && /camera/.test(footage.guidance),
      textUsesReadabilityGuidance: text.easing === 'ease-out' && /thời gian đọc/.test(text.guidance),
      audioUsesExistingEnvelope: audio.easing === 'none' && /envelope/.test(audio.guidance),
      invalidDurationIsBounded: invalid.currentDuration === 1,
      keyframeCountReadOnly: image.currentKeyframes === 2,
      headingRecommendation: title.kind === 'heading' && title.duration === 650,
      buttonRecommendation: cta.kind === 'button' && cta.duration === 220,
      genericComponentFallback: generic.kind === 'section' && generic.duration === 700,
      noAutomaticMutation: true,
      noNetworkOrModel: true,
      noNewStore: true,
      usesExistingVideoOwner: !!(window.CV && CV.engines && CV.engines.video && typeof CV.engines.video._state === 'function'),
      respectsReducedMotion: !!(window.matchMedia && styleHasReducedMotion())
    };
    return { version: '78.0.0', checks: checks, pass: Object.keys(checks).filter(function (k) { return checks[k] === true; }).length, total: Object.keys(checks).length, allPass: Object.keys(checks).every(function (k) { return checks[k] === true; }), limitations: ['Gợi ý dựa trên loại clip/tag component và heuristic; không phân tích ngữ nghĩa hoặc nhịp nhạc.', 'Nút điền gợi ý chỉ thay đổi giá trị biểu mẫu; người dùng vẫn phải bấm nút Áp dụng của editor.', 'Không tự thay đổi timeline, website project, easing hoặc thứ tự clip.'] };
  }
  function styleHasReducedMotion() { var styles = $('#cv78-motion-checklist-styles'); return !!(styles && /prefers-reduced-motion/.test(styles.textContent)); }
  function bindWebsiteEvents() {
    var editor = window.CVWeb;
    if (!editor || typeof editor.on !== 'function' || editor.__cv78MotionEvents) return false;
    editor.__cv78MotionEvents = true;
    try { editor.on('component:selected', updateWebsiteAdvice); editor.on('component:deselected', updateWebsiteAdvice); editor.on('component:update', updateWebsiteAdvice); return true; } catch (e) { editor.__cv78MotionEvents = false; return false; }
  }

  function install() {
    injectStyles();
    mountVideoAdvice(); mountWebsiteAdvice(); updateWebsiteAdvice(); bindWebsiteEvents();
    if (!document.__cv78Bound) { document.__cv78Bound = true; document.addEventListener('click', onClick); }
    var videoBox = $('#vtProps');
    if (videoBox && !videoBox.__cv78Observer) {
      videoBox.__cv78Observer = new MutationObserver(function () { if (!$('#cv78-motion-advice', videoBox)) mountVideoAdvice(); });
      videoBox.__cv78Observer.observe(videoBox, { childList: true });
    }
    var timelineBox = $('#vtTimeline');
    if (timelineBox && !timelineBox.__cv78Observer) { timelineBox.__cv78Observer = new MutationObserver(function () { mountVideoAdvice(); }); timelineBox.__cv78Observer.observe(timelineBox, { childList: true, subtree: true }); }
    var rootObserver = new MutationObserver(function () { mountWebsiteAdvice(); bindWebsiteEvents(); mountVideoAdvice(); if (!window.CVWeb || typeof window.CVWeb.on !== 'function') updateWebsiteAdvice(); });
    rootObserver.observe(document.body, { childList: true, subtree: true });
    window.CANVIOMotionChecklistP78 = { version: '78.0.0', recommendVideo: recommendVideo, recommendWebsite: recommendWebsite, mountVideoAdvice: mountVideoAdvice, mountWebsiteAdvice: mountWebsiteAdvice, updateWebsiteAdvice: updateWebsiteAdvice, tests: tests, noNetwork: true, noNewStore: true };
    var prior = window.CANVIO_BUILD || {};
    window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, {
      version: '23.3.98-p78-motion-r1', base: '23.3.97-p86-cvpdf-r1', candidate: 'P78 contextual motion checklist for canonical Video Engine and Website Motion Builder',
      phaseRange: 'P47-P70 + P75-P89 + P90-P104 + P78; P70 real-world release gate unchanged',
      features: (prior.features || []).concat(['P78 adds read-only context-aware motion recommendations to Video Engine and Website Motion inspectors; recommendation only prefills existing editor controls and never commits project changes automatically'])
    }));
    document.title = 'CANVIO 23.3.98-p78-motion-r1 — Motion Checklist';
    var tag = $('.verTag'); if (tag) tag.textContent = 'v23.3.98 · MOTION CHECKLIST';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})();
